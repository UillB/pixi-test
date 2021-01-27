import { Maze, IMazeCell } from './Maze';

export class CellView extends PIXI.Sprite{
    data : IMazeCell;
    type : string;
    
    getGlobalCenter() {
        const point = this.parent.parent.toLocal(this.position, this.parent, undefined, false);
        point.x += this.width >> 1;
        point.y += this.height >> 1;
        return point;
    }
}

export class MazeView extends PIXI.Container {
    data: Maze;
    cells: Array<CellView> = [];
    gems: PIXI.Sprite[];
    startCell : CellView;
    endCell: CellView;

    getCellByPoint(point : {x : number, y : number}) {

        const {x, y} = this.mapGlobalToCell(point);
        return this.getCellByIndex(x, y);
    }

    getCellByIndex(x : number, y : number) {
        if(x < 0 || x >= this.data.columns) return undefined;
        if(y < 0 || y >= this.data.rows) return undefined;
        
        const index = x * this.data.rows + y;
        return this.cells[index];
    }

    mapGlobalToCell(point: {x: number, y : number}) {
        
        const p = new PIXI.Point(point.x, point.y);
        
        this.toLocal(p, this.parent, p, false);

        p.x = (p.x / this.width) * this.data.columns | 0;
        p.y = (p.y / this.height) * this.data.rows | 0;
        
        return p;
    }
}