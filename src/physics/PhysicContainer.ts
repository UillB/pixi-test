import { HookPixi } from './PixiBindings'; 
	HookPixi();

import { World } from "p2";
import { PixiBody } from './PixiBody';
import { PIXEL_TO_METR } from './constants';

export class PhysicContainer extends PIXI.Container {
	public world?: World;
	private _lastTime: number = undefined;
	private _enabled: boolean = true;

	constructor(options?: p2.WorldOptions) {
		super();

		options.gravity = options.gravity  || [0,0];
		options.gravity[0] *= PIXEL_TO_METR;
		options.gravity[1] *= PIXEL_TO_METR;
		
		this.world = new World(options);
	}

	updateBodies() {

		for(let obj of this.children) {
			if(obj && obj.body && this.world!.bodies.indexOf(obj.body) == -1){
				this.world!.addBody(obj.body);
			}
		}
	}

	addChild(...child: PIXI.DisplayObject[]) {
		for (let obj of child) {
			if (obj.body) {
				this.world!.addBody(obj.body);
			}
		}

		return super.addChild(...child);
	}

	addChildAt(child: PIXI.DisplayObject, index: number) {
		if (child.body) {
			this.world!.addBody(child.body);
		}

		return super.addChildAt(child, index);
	}

	removeChild(...child: PIXI.DisplayObject[]) {
		for (let obj of child) {
			if (obj.body) {
				this.world!.removeBody(obj.body);
			}
		}

		return super.removeChild(...child);
	}

	removeChildAt(index: number) {
		const child = super.removeChildAt(index);
		if (child && child.body) {
			this.world!.removeBody(child.body);
		}
		return child;
	}

	removeChildren(beginIndex?: number, endIndex?: number) {
		const childs = super.removeChildren(beginIndex, endIndex);
		for (let obj of childs) {
			if (obj.body) {
				this.world!.removeBody(obj.body);
			}
		}
		return childs;
	}

	private now() {
		return performance ? performance.now() : Date.now();
	}

	set enabled(enable: boolean) {
		this._enabled = enable;
		this._lastTime = this.now();
	}

	get(): boolean {
		return this._enabled;
	}

	update(fps: number = 60, interations: number = 5){
        if (!(this._enabled && this.world)) return;
		
		const newUpd = this.now();
		const delta = this._lastTime ?  newUpd - this._lastTime: 1.0/fps;
		this.world!.step(1.0/fps, delta, interations);

		for(let obj of this.world.bodies) {
			(obj as PixiBody).update();
		}

		this._lastTime = newUpd;
	}

	destroy(options: {}) {

		for(let obj of this.world.bodies) {
			(obj as PixiBody).destroy();
		}
		
		super.destroy(options);
		this.world!.clear();
		this.world = undefined;
	}
}
