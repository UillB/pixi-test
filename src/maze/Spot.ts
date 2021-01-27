export class Spot extends PIXI.Sprite {

    context: CanvasRenderingContext2D;
    initialAlpha: number;
    constructor(rad : number = 100, size : number = 220) {

        const canvas = document.createElement("canvas");

        const middle = size * 0.5 | 0;
        canvas.width = canvas.height = middle * 2;
        const ctx = canvas.getContext("2d");

        ctx.clearRect(0,0,middle * 2, middle * 2);
        const grad = ctx.createRadialGradient(middle, middle, rad * 0.1, middle, middle, rad);
        
        grad.addColorStop(0, "#00000080");
        grad.addColorStop(1, "#FFFFFF");

        ctx.fillStyle = grad;
        ctx.fillRect(0,0, middle * 2, middle * 2);
        super(PIXI.Texture.from(canvas));
        
        this.blendMode = PIXI.BLEND_MODES.SUBTRACT;
        this.anchor.set(0.5);
        this.context = ctx;
    }
}