import { BaseGame, GameState } from '../shared/BaseGame';
import { APIData } from '../shared/APIData';
import { App } from "..";
import { Assets } from './Assets';
import { GameConfig, ILevelData } from './GameConfig';
import { M2 } from "../shared/M2";
import { PopupType } from '../shared/ui/Popup';
import { UiManager, ControlsLayout } from '../shared/ui/UiManager';
import { InputHandler } from '../shared/CrossplatformInputHandler';
import { IUIListener, IPopup } from '../shared/ui/IUIListener';
import { Maze as MazeMap, MazeType } from './Maze';
import { MazeBuilder } from './MazeBuilder';
import { Player } from './Player';
import { MazeView } from './MazeView';
import { Spot } from './Spot';
import { Tween } from '@tweenjs/tween.js';
import { Ghost } from './Ghost';
import { SoundGrouper } from '../shared/Sound';

export class Maze extends BaseGame implements IUIListener{

	maze: MazeMap;
	mazeBuilder: MazeBuilder;
	mazeView: MazeView;
	ui: UiManager;
	tex: PIXI.ITextureDictionary;
	stage: PIXI.Container;
	gameLevel: PIXI.Container;
	res: PIXI.IResourceDictionary;
	levelData: ILevelData;
	player: Player;
	ghost: Ghost;
	spot: Spot;
	overlay: PIXI.Sprite;

	margins: PIXI.TilingSprite[];

	_progress : number = 0;
	_power : number = 0;
	
	set spotPower(v: number) {
		if(!this.levelData || !this.levelData.power){
			this._power = Infinity;
			this.overlay.alpha = 0;
			return;
		}
		const end = this.levelData.power;
		this._power = M2.clamp(v, 0, end);
		this.overlay.alpha = 1 -  this._power / end ;
	}

	get spotPower() {
		return this._power;
	}

	set progress(x: number) {
		this._progress = x;
		this.ui.progress = x;
	}

	get progress() {
		return this._progress;
	}

	constructor() {
		super();
		
		this.input = new InputHandler(false, M2.mobile);
		this.apiData = new APIData("Maze", this);
		this.stage = new PIXI.Container();
		this.gameLevel = new PIXI.Container();
		this.gameLevel.sortableChildren = true;
		this.loader = new PIXI.Loader(Assets.BaseDir);
	}

	init(app: App){
		this.app = app;
		this.lang = this.app.multilang.getTextBase('Maze');
		this.sounds = SoundGrouper.createManager("Labirint");
		this.sounds.Play("main_theme5", {loop: true, volume: 0.25});

		this.gameState.on("enter", this.onStateEnter, this);
		this.res = this.loader.resources;
		this.maze = new MazeMap();
		this.stage.y = app.height;
		this.ui = this.app.uiManager;

		this.ui.setOptions({
            showArrows: false,
            showProgress: false,
			level: this.apiData.lastOpenedLevel,
			controlLayout: ControlsLayout.FULL,
			levelHint: this.lang.levels[0],
            progressHint: this.lang.progress[0],
		});

		this.input.mobileControlls = this.ui.controls;
		
		this.player = new Player(this.res);
		this.player.on('endreached', this.onEndReached, this);
		this.player.zIndex = 100;

		this.ghost = new Ghost(this.res);
		this.ghost.zIndex = 110;

		this.spot = new Spot(500, app.height * 1.5);
		//this.spot.alpha = 0.5;
		this.spot.scale.set(2);
		this.spot.zIndex = 200;

		this.overlay = new PIXI.Sprite(PIXI.Texture.WHITE);
		this.overlay.anchor.set(0,1);
		this.overlay.width = this.app.width;
		this.overlay.height = this.app.height;
		this.overlay.zIndex = 300;
		this.overlay.alpha = 0;
		this.overlay.tint = 0;

		// view builder
		this.mazeBuilder = new MazeBuilder(this.res[Assets.Assets["map-atlas"].name].textures);

		// model
		const level = GameConfig.levels[0];
		this.maze.build( level.size, level.size)
				.then( ()=>this.onMazeBuilded())
		
		this.gameState.current = GameState.PRE;
		this.gameLevel.addChild(this.player, this.ghost, this.spot);
		this.stage.addChild(this.gameLevel, this.overlay);
		
        this.app.uiManager.hint.open(this.lang.hello);
	    super.init(app);
		super.start();
	}

	preload(): PIXI.Loader {
		
		//@ts-ignore
		this.loader.add(Object.values(Assets.Assets));
		return super.preload();
	}

	reset() {

		this._progress = 0;
		this.mazeView.destroy({children: true});
		this.mazeView = undefined;
		this.gameState.current = undefined;
		this.ghost.reset();
		this._allowMovement = false;
	}

	_lastNear: boolean = false;
	_allowMovement: boolean = false;

	onPlayerNearAtEnd(near = false) {
		if(this._lastNear == near || this._allowMovement)
			return;
		this._lastNear = near;
		
		if(!this.levelData)
			return;

		const collected = this.progress ==  this.levelData.gems;

		if(near){
			const tween = this.ghost.showBalloon(this.levelData.gems);
			
			this.sounds.Play("ghost");

			if(collected) {
				const flip = new Tween(this.ghost).to({angle: 180}, 200);
				const moveback = new Tween(this.ghost.position).to({y : this.ghost.y - 600}, 800);	
				tween.chain(flip, this.ghost.hideBaloon());
				flip.chain(moveback);
				moveback.onComplete(()=>{
					//disable wall
					this.mazeView.endCell.data.wall[1] = false;
				})
				this._allowMovement = true;
			}
		}
		else {
			this.ghost.hideBaloon();
		}
	}

	onEndReached() {
		if(this.progress < this.levelData.gems)
			return;

		this.gameState.current = GameState.PREWIN;
		new Tween(this.player.position)
			.to({
				y: this.player.y - GameConfig.stepLen * 2
			}, GameConfig.stepDuration * 2 * 1000)
			.onComplete(()=>{
				this.gameState.current = GameState.WIN;
			}).start();
	}

	onMazeBuilded() {
		
		this.mazeView = this
				.mazeBuilder
				.buildMaze(this.maze, this.levelData? this.levelData.gems : 5);
			
		this.mazeView.y -= this.mazeView.height;
		this.gameLevel.addChild(this.mazeView);

		this.player.mazeView = this.mazeView;

		this.player.place(this.mazeView.startCell);
		this.ghost.position = this.mazeView.endCell.getGlobalCenter();
		this.ghost.y += 200;

		// disable path become cant collect 
		this.mazeView.endCell.data.wall[1] = true;

		if(this.levelData)
			this.ghost.setAmount(this.levelData.gems);

		this.spot.position.copyFrom(this.player.position);
		this.updateCamera();

	}
	// --- UI Listener impementing

	setLevel(level: number): void {
	
		this.apiData.current = level;
		this.levelData = GameConfig.levels[level - 1];
		this.spotPower = this.levelData.power;
		this.player.move(new PIXI.Point());

		this.reset();
		this.maze
			.build(this.levelData.size, this.levelData.size)
			.then(
			() => {
				this.onMazeBuilded();
				this.gameState.current = GameState.GAME;
			});
	}

	reload(): void {
		this.setLevel(this.apiData.current);
	}

	popupOpened(popup: IPopup): void {
		
		if(popup == IPopup.MENU){
			this.app.uiManager.setOptions({
				showArrows: false,
				level: this.apiData.lastOpenedLevel
			});
		}
	}
	
	softPause(): boolean {
		this.player.move(new PIXI.Point(0,0));
		return super.softPause();
	}
	// --- End

	async onStateEnter(state: GameState) {
		switch(state) {

			case GameState.PRE: {
				this.ui.setOptions({
					showProgress: false,
					progress : 0,
					level : this.apiData.lastOpenedLevel
				});
				
				this.ui.pushPopup(IPopup.MENU, true, PopupType.START);
				break;
			}

			case GameState.GAME: {
				this.ui.setOptions({
					showProgress: true,
					progress : 0,
					showArrows: M2.mobile,
					level : this.apiData.current,
					progressMax: this.levelData.gems
				});
				this.ui.progress = 0;
				break;
			}

			case GameState.PREWIN: {
				// empty state, for layer animation
				break;	
			}

			case GameState.WIN: {
				this.apiData.levelSucsess();
				this.ui.setOptions({
					showProgress: false,
					progress : 0,
					showArrows: false,
					level : this.apiData.lastOpenedLevel
				});

				await this.ui.pushPopup(IPopup.MENU, true, PopupType.WIN);
				await M2.Delay(1000);

				if(this.gameState.current !== GameState.WIN)
						return;
				this.ui.hint.open(this.lang.endings)
				break;
			}
			case GameState.LOSE: {
				this.apiData.levelFailed();
				this.ui.setOptions({
					showProgress: false,
					progress : 0,
					showArrows: false,
					level : this.apiData.lastOpenedLevel
				});
				
				this.sounds.Play("dark");
				await M2.Delay(1000);
				await this.ui.pushPopup(IPopup.MENU, true, PopupType.LOSE);
				await M2.Delay(2000);

				if(this.gameState.current !== GameState.LOSE)
					return;
				let three = this.apiData.loosesAtRun % 3 == 0 && this.apiData.loosesAtRun > 0;
				this.ui.hint.open(three ?  this.lang.falling_3times  : this.lang.falling, this.ui.sadNeoo);
				break;	
			}
		}
	}

	// its real pause, when tab changed
	pause(): void {
		this.player.move(new PIXI.Point(0,0));
		this.app.uiManager.onPause();
		super.pause();
	}

	// real resume
	resume(): void {
		
		this.app.uiManager.onResume();
		super.resume();
	}

	update(ticker: PIXI.Ticker): void {
		if(this._isPaused)
			return;
		
		this.spot.x = (this.player.x + Math.sin(this.player.rotation) * 100);
		this.spot.y = (this.player.y - Math.cos(this.player.rotation) * 100);
		
		if(this.gameState.current == GameState.GAME 
				&& this.mazeView)
		{
			this.input.update();
			this.player.move(this.input.axis);
			this.player.update(ticker);

			this.spotPower -= ticker.deltaMS * 0.001;

			if(this.spotPower <= 1) {
				this.gameState.current = GameState.LOSE;
			}

			const c = this.player.currentCell;
			const end = this.mazeView.endCell;
			const d = Math.abs(c.data.x - end.data.x) + Math.abs(c.data.y - end.data.y);
			this.onPlayerNearAtEnd(d <= 1);
			this.updateGems();
			this.updateCamera();
		}
	}

	updateGems() {

		const gems = this.mazeView.gems;
		const ppos = this.mazeView.toLocal(this.player.position, this.gameLevel, undefined, true);

		for(let i = gems.length - 1; i >= 0; i--) {
			const g = gems[i];

			const dx = Math.abs(ppos.x - g.x);
			const dy = Math.abs(ppos.y - g.y);

			if( Math.sqrt(dx ** 2 +  dy ** 2) <= GameConfig.stepLen * 0.75) {
				
				this.progress ++;
				this.spotPower += GameConfig.gemtopower;
				gems.splice(i, 1);
				this.gameLevel.addChild(g);
				this.gameLevel.toLocal(g.position, this.mazeView, g.position, true);

				new Tween({a : 0})
					.to({a : 1}, 200)
					.onUpdate((v)=>{
						g.x -= (g.x - this.player.x) * v.a;
						g.y -= (g.y - this.player.y) * v.a;
					})
					.onComplete(()=>{
						g.destroy();
						this.sounds.Play("catching");
					})
					.start()
			}
		}
	}

	updateCamera() {
		if(!this.mazeView)
			return;
		
		const 
			posx = this.player.x - this.app.width * 0.5,
			posy = this.player.y + this.app.height * 0.5;
	
		this.gameLevel.pivot.x = M2.clamp(posx, 0, this.mazeView.width - this.app.width);
		this.gameLevel.pivot.y = M2.clamp(posy, -this.mazeView.height + this.app.height, 0);
	}
}
