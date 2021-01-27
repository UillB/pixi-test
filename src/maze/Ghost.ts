import { Assets } from './Assets';
import { Tween } from '@tweenjs/tween.js';

export class Ghost extends PIXI.Container {   
    _baloon: PIXI.Sprite;
    _body: PIXI.Sprite;
    _text: PIXI.Text;

    _showed: boolean = false;
    constructor(_res: PIXI.IResourceDictionary) {
        super();
        let pack = _res[Assets.Assets["map-atlas"].name].textures;
        this._body = new PIXI.Sprite(pack['ghost.png']);
        this._body.pivot.set(0.5);
        this._body.x -= this._body.width >> 1;
        this._body.y -= this._body.height >> 1;
        
        
        this._baloon = new PIXI.Sprite(pack['balloon.png']);
        this._baloon.anchor.set(1,1);
        this._text = new PIXI.Text("x00", new PIXI.TextStyle({
            fontFamily : "Carter One MultiCyr, CarterOne",
            fontSize : 30,
            fill: 0x0
        }));

        
        this._baloon.addChild(this._text);
        this._text.anchor.set(0, .5);
        this._text.y -= 75;
        this._text.x -= 100;

        this._baloon.y += this._baloon.height >> 1;
        this._baloon.visible = false;

        this.addChild(this._body, this._baloon);
    }

    setAmount(amount: number) {
        this._text.text = `x${amount | 0}`;
    }

    showBalloon(amount: number){
        if(this._showed)
            return;
        this._showed = true;

        this.setAmount(amount);
        this._baloon.alpha = 1;
        this._baloon.visible = true;
        this._baloon.scale.set(0.001);
        return new Tween(this._baloon.scale)
            .to({x: 1, y: 1}, 300)
            .start();
    }
    
    hideBaloon() {
        if(!this._showed)
            return;

        this._showed = false;
        return new Tween(this._baloon)
            .to({alpha: 0}, 300)
            .onComplete(()=>{
                this._baloon.visible = false;
            })
            .start();
    }

    reset() {
        this.angle = 0;
        this._baloon.visible = false;
        this._showed = false;
    }
}