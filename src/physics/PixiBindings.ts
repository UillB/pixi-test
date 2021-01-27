///<reference types="p2pixi"/>

import { PixiBody } from './PixiBody';

export function HookPixi() {
	console.log("Path pixi");
	PIXI.DisplayObject.prototype.setBody = function(options?: PixiBodyOptions) {
		if (!this.body)
			this.body = new PixiBody(options, this);

		return this;
	};
}