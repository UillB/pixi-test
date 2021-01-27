import { IMazeCell, Maze } from './Maze';
import { MazeView, CellView } from './MazeView';
/* ебаный пидарас, ща вбивай все
  0
2   3
  1
*/

interface ICellPair {
    t : string;
    r? : number;
}

export const MazeCelType = {
    
    0b0000 : { t : "cross"},

    0b0001 : { t : "t" },
    0b0010 : { t : "t" , r : 4 },
    0b1000 : { t : "t" , r : 6 },
    0b0100 : { t : "t" , r : 2 },
    
    0b1101 : { t : "deadend" },
    0b1110 : { t : "deadend" , r : 4},
    0b1011 : { t : "deadend" , r : 6},
    0b0111 : { t : "deadend", r : 2},
    
    0b0101 : { t : "corner"},
    0b0110 : { t : "corner", r : 2},
    0b1001 : { t : "corner", r : 6},
    0b1010 : { t : "corner", r : 4},
    
    
    0b1100 : { t : "straight" },
    0b0011 : { t : "straight" , r : 2},

} as {[key: number]:ICellPair}

export interface ITypedMazeCell {
    baseType: string;
    flip : number;
    orig?: IMazeCell;
}

function cyclicShift(a: number, steps: number = 4) {
    const end = a >> (steps - 1) & 1;
    return (a << 1 | end) & (~(-1 << steps)); 
}

export function ArrayToCell (arr: Array<Boolean> ){
    
    if(arr.length != 4)
        throw Error("FTW??? Array length must be 4");
    
    //generate bit mask from array
    let res = 0;
    for(let i = 0; i < 4; i++) {
        res = res | (~~arr[i] << i);
    }

    const map = MazeCelType[res];
    let cell = {
        baseType : map.t,
        flip : map.r || 0
    }

    return cell;
}

export class MazeBuilder {

    constructor(public textures: PIXI.ITextureDictionary) {

    }

    getCellSize() {
        return this.textures['t.png'].width;
    }

    buildMaze(maze: Maze, gems: number = 0) {
        
        
        const end =  1 + (maze.columns - 2 ) * Math.random() | 0;
		const start = 1 + (maze.columns -2 ) * Math.random() | 0;

        maze.cells[end][0].wall[0] = false;
        maze.cells[start][maze.rows - 1].wall[1] = false;

        const cells = MazeBuilder.mazeCellsToTyped(maze);

        maze.rows += 2; // так как маргины

        const stage = new MazeView();
        const
            w = this.textures["t.png"].width,
            h = this.textures["t.png"].height

        const cellsView : Array<CellView> = [];
        const gemsView : Array<PIXI.Sprite> = [];

        const emptyt = this.textures['empty.png'];
        const ot = this.textures['deadend.png'];
        const startt = new PIXI.Texture(ot.baseTexture, ot.frame, ot.orig, ot.trim, ot.rotate | 8);
        const endt = this.textures['straight.png'];

        //margins
        for(let i = 0; i < maze.columns; i++) {

            const top = new CellView(i === start ? startt : emptyt);
            const btm = new CellView(i === end ? endt : emptyt);
            
            top.x = btm.x = i * w ;
            
            top.data = {
                wall: [!!0,!!1,!!1,!!1],
                x : i,
                y : maze.rows - 1,
                visited : false
            }
            top.y = top.data.y * h;

            btm.data = {
                wall: [!!1,!!0,!!1,!!1],
                x : i,
                y : 0,
                visited : false
            }
            
            btm.y = btm.data.y * h;

            stage.addChild(top, btm);
            cellsView[i * maze.rows + top.data.y] = top;
            cellsView[i * maze.rows + btm.data.y] = btm;
        }

        for(let c of cells) {
            const tex = this.textures[c.baseType + ".png"];
            const fliped = new PIXI.Texture(tex.baseTexture, tex.frame, tex.orig, tex.trim, tex.rotate | c.flip);
            const cell = new CellView(fliped);
            
            // так как маргины
            c.orig.y += 1;
            cell.data = c.orig;
            cell.type = c.baseType;
            cell.x = c.orig.x * w;
            cell.y = c.orig.y * h;

            cellsView[c.orig.x * maze.rows + c.orig.y] = cell;
            stage.addChild(cell);
        }
        
        const visited: Array<boolean> = []
        for(let i = 0; i < gems; i++) {
            const t = this.textures[`normal ${1 + Math.random() * 4 | 0}.png`];
            const gem = new PIXI.Sprite(t);
            gem.anchor.set(0.5);
            gem.scale.set(0.35);

            let index = 0;
            do{
                const x = maze.columns * Math.random() | 0;
                const y = 1 + (maze.rows - 2 ) * Math.random() | 0;
                index = x * maze.rows + y;
            }while(visited[index]);
            
            visited[index] = true;

            gem.x = cellsView[index].x + w * 0.5;
            gem.y = cellsView[index].y + h * 0.5;
            
            gemsView.push(gem);
            stage.addChild(gem);
        }
        
        stage.data = maze;
        stage.cells = cellsView;
        stage.gems = gemsView;

        stage.endCell = stage.getCellByIndex(end, 0);
        stage.startCell = stage.getCellByIndex(start, maze.rows - 1);
        

        return stage;
    }

    static mazeCellsToTyped(maze: Maze) {
        
        const cells = maze.cells;
        const res : Array<ITypedMazeCell> = [];

        for(let i = 0; i < cells.length; i++) {
            res.push(...this.mazeRowToTyped(cells[i]))
        }
        return res;
    }
    
    static mazeRowToTyped (cells: Array<IMazeCell>) {

        const res: Array<ITypedMazeCell> = [];
        for(let c of cells) {
            const nc : ITypedMazeCell = ArrayToCell(c.wall);
            nc.orig = c;
            res.push(nc);
        }

        return res;
    }
}