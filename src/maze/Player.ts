import { Assets } from './Assets';
import { Tween } from "@tweenjs/tween.js";
import { GameConfig } from "./GameConfig";
import { M2 } from "../shared/M2";
import { MazeView, CellView } from './MazeView';
import { Spot } from './Spot';
import { App } from '../index';

enum Direction {
	NONE = "none",
	LEFT = "left",
	RIGHT = "right",
	UP = "up",
	DOWN = "down"
}

const DirectionAnimations = {
	up: "Step up",
	left: "Step left 90",
	right: "Step right 90"
} as { [key: string]: string };


function dirToIndex(dir: {x: number, y: number}) {
	if(dir.y > 0) return 1;
	if(dir.y < 0) return 0;
	if(dir.x > 0) return 3;
	if(dir.x < 0) return 2;
	return -1;
}

const EPSILON = 0.05;

export class Player extends PIXI.Container {

	localPos : PIXI.Point = new PIXI.Point(0,0);
	mazeView : MazeView;
	currentCell: CellView;
	deadmask: PIXI.Sprite;
	lastDirection : PIXI.Point;
	spot: Spot;


	_spine: PIXI.spine.Spine;
	_prevDirection: Direction = Direction.NONE;
	_tween: Tween;
    _drowned: boolean = false;
	_targetPoint: PIXI.Point = new PIXI.Point();
    _lastHits: PIXI.DisplayObject[];


	constructor(res: PIXI.IResourceDictionary) {
		super();

		const rig = res[Assets.Assets.player.name].spineData;
		const b = new PIXI.spine.Spine(rig);
		b.autoUpdate = false;
		b.pivot.y -= 60;
		this._spine = b;

		const mask = res[Assets.Assets["map-atlas"].name].textures["deadend_mask.png"];
		this.deadmask = new PIXI.Sprite(mask);
		this.deadmask.anchor.set(0.5);

		this.addChild(b);
	}

	_tiltTween: Tween ;
	_targetAngle : number = 0;

	tilt(dir: {x: number, y: number}) {
		
		let angle = this._targetAngle;
		if(dir.y > 0) {
			angle = 180;
		}
		else if(dir.y < 0) {
			angle = 0;
		}
		else if( Math.abs(dir.x) > 0) {
			angle = dir.x * 90;
		}
		
		if(Math.abs(M2.AngleDist(this._targetAngle, angle)) < 0.1)
			return;
		
		if(this._tiltTween && this._tiltTween.isPlaying())
			this._tiltTween.stop();
		

		const delta = M2.AngleDist(this._targetAngle, angle);
		const initial = this._targetAngle;
		this._tiltTween = new Tween({a : 0})
			.to({
				a: 1,
			}, 200)
			.onUpdate( obj =>{
				this.angle = initial + obj.a * delta;
			})
			.start();
		
		this._targetAngle = angle;

	}

	place(cell: CellView) {

		this.currentCell = cell;
		this.localPos.x = cell.data.x;
		this.localPos.y = cell.data.y;
		this.position.copyFrom(this.currentCell.getGlobalCenter());
		this._targetPoint.copyFrom(this.position);
		
		this.lastDirection = new PIXI.Point(0, -1);
		
	}

	move(dir: PIXI.Point) {

		if(this.moved)
			return;

		let dr = Direction.NONE;
		
		const index = dirToIndex(dir);
		
		if(index == -1){
			this._setAnim(dr);
			return;
		}

		if(Math.abs(dir.x) > 0 || Math.abs(dir.y) > 0)
			dr = Direction.UP;
		
		//disable diagonals
		if (Math.abs(dir.y) > EPSILON)
			dir.x = 0;
		
		this.lastDirection = dir;

		this.tilt(dir);

		// стена
		if(this.currentCell.data.wall[index])
			return;

		const nx = this.localPos.x + dir.x;
		const ny = this.localPos.y + dir.y;

		const cell = this.mazeView.getCellByIndex( nx, ny );

		if(!cell || cell.data.wall[dirToIndex({x: -dir.x, y : -dir.y})]) {
			this.deadmask.visible = false
			return;
		}
		
		this.localPos.set(nx, ny);

		this.currentCell = cell;
		this._targetPoint = cell.getGlobalCenter();

		if(cell.type == 'deadend') {
			this.deadmask.visible = true;
			this.deadmask.texture.rotate = cell.texture.rotate;
			this.deadmask.zIndex = this.zIndex  + 10;
			this.parent.addChild(this.deadmask);
			this.deadmask.position.copyFrom(this._targetPoint);
		}

	}

	reset() {
        this._spine.scale.set(1);
	}

	_moveComplete = false;
	get moved() {
		return !this._moveComplete;
    }
	
	
	update(ticker: PIXI.Ticker) {
		this._spine.update(ticker.deltaMS / 1000);

		const dx = this._targetPoint.x - this.x;
		const dy = this._targetPoint.y - this.y;

		const delta = GameConfig.stepLen * ticker.deltaMS * 0.001 / GameConfig.stepDuration;
		
		if(Math.abs(dx) > delta * 2 || Math.abs(dy) > delta * 2) {

			this._moveComplete = false;
			this.x += Math.sign(dx) * delta;
			this.y += Math.sign(dy) * delta;
			
			this._setAnim(Direction.UP);

		} else if(!this._moveComplete) {
			
			this._moveComplete = true;
			if(this.currentCell == this.mazeView.endCell)
				this.emit("endreached");
			
			this.position.copyFrom(this._targetPoint);
			this._setAnim(Direction.NONE);
		}
		
	}

	_setAnim(dir: Direction) {
		if (dir === this._prevDirection) return;

		if (dir == Direction.NONE) {
			this._spine.state.clearTracks();
			this._spine.skeleton.setToSetupPose();
		} else {
			this._spine.state.setAnimation(0, DirectionAnimations[dir], true);
			this._spine.state.timeScale = this._spine.state.getCurrent(0).animation.duration / GameConfig.stepDuration;
		}

		this._prevDirection = dir;
	}
    
}
