import { BodyOptions, Body, Box, Shape } from "p2";

import { PIXEL_TO_METR, METR_TO_PIXEL } from './constants';

export class PixiBody extends Body {
	display: PIXI.DisplayObject;
	_lastTransform: number;
	constructor(options: PixiBodyOptions | undefined, display: PIXI.DisplayObject) {
		if (!display) throw Error("Display object can't be null");

		options = options || {};
		options.boundsToShape = options.boundsToShape == undefined ? true : options.boundsToShape;
		const pos = display.position;
		const force = options.force ? options.force : { x: 0, y: 0 };
		const vel = options.velocity ? options.velocity : { x: 0, y: 0 };
		const opts: BodyOptions = {
			...(options as any), //because PixiBodyOptions have some other definitions
			...{
				position: [
                    -pos.x * PIXEL_TO_METR,
                    - pos.y * PIXEL_TO_METR
                ],
				velocity: [vel.x, vel.y],
				force: [force.x, force.y]
			}
		};

		super(opts);

		this.angle = display.rotation;
		this.display = display;

		if(options.shape instanceof Shape) {
			this.addShape(options.shape)
		}
		else if (options.boundsToShape) {
			const bounds = display.getLocalBounds();
			const box = new Box({ 
                width: Math.abs(bounds.width * PIXEL_TO_METR * display.scale.x),
				height: Math.abs(bounds.height * PIXEL_TO_METR * display.scale.y)
			 });
            
                box.material = options.material;

			//todo fixme, pass valid offset;
			//FIXME
			//FIIIIIIXXXXXMMMMMEEEEE

			this.addShape(box);
		}

		this._lastTransform = (this.display.transform as any)._localID;
	}

	update() {
        
        if (this._lastTransform !== (this.display.transform as any)._localID) {
        
            this.position[0] = -this.display.x * PIXEL_TO_METR;
			this.position[1] = -this.display.y * PIXEL_TO_METR;
			this.angle = this.display.rotation;
        
        } else {
			if (this.sleepState != Body.AWAKE) return;

			this.display.position.set(
                    -this.position[0] * METR_TO_PIXEL,
                    -this.position[1] * METR_TO_PIXEL);
			this.display.rotation = this.angle;
        }
        
		this._lastTransform = (this.display.transform as any)._localID;
    }
    
    destroy() {
        //???
        this.display = undefined;
    }
}
