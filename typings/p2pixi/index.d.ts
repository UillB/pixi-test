declare interface PixiBody extends p2.Body {
    display: PIXI.DisplayObject;
    update(): void;
}

declare interface PixiBodyOptions {
    boundsToShape?: boolean
    force?: {x: number,y:number};
    velocity?: {x: number,y:number};
    allowSleep?: boolean;
    collisionResponse?: boolean;
    angle?: number;
    angularForce?: number;
    angularVelocity?: number;
    ccdIterations?: number;
    ccdSpeedThreshold?: number;
    fixedRotation?: boolean;
    gravityScale?: number;
    id?: number;
    mass?: number;
    sleepSpeedLimit?: number;
    sleepTimeLimit?: number;
    fixedX?: boolean;
    fixedY?: boolean;
    type?: number;
    material?: p2.Material;
    shape?:p2.Shape;
    damping?: number;
}

declare namespace PIXI {
	export interface DisplayObject {
		body?: PixiBody;
		setBody(options?: PixiBodyOptions): DisplayObject;
	}
}

// not related to p2

declare module PIXI {
	export interface Container {
        getChildByPath<T extends PIXI.DisplayObject>(query: string): T | undefined;
        addGlobalChild(...child: PIXI.DisplayObject[]): PIXI.DisplayObject[]; 
	}
}

declare module PIXI {
	export interface DisplayObject {
		replaceWithTransform(from:DisplayObject): void
	}
}

declare module PIXI {
	export interface Loader {
		filter(func: (v: PIXI.loaders.Resource) => boolean): PIXI.LoaderResource[];
	}
}
