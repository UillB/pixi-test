

const dirs = [0, 1, 2, 3]; // direction of neighbors
const undirs = [1, 0, 3, 2]; // opposite direction
const delta = { x: [0, 0, -1, 1], y: [-1, 1, 0, 0] }; // offsets of neighbors

let SEED = Math.random() * 1000000000 | 0;

interface IStackData  {
    x: number;
    y: number;
    neighbors : Array<number>;
}

export enum MazeType {
    ELLEE = 0,
    DFS = 1
}

export interface IMazeCell {
    x: number;
    y: number;
    wall: Array<boolean>;
    visited: boolean;
}

/**
 *
 */
function generator(maze : Maze) {
	switch (maze.type) {
		case MazeType.ELLEE:
			var L = new Array();
			var R = new Array();

			for (var x = 0; x < maze.columns; x++) {
				L[x] = x;
				R[x] = x;
			}

			iter(
				function(row : number) {
					return eller(maze, L, R, row);
				},
				maze.rows - 1,
				function() {
					maze.complete();
				},
				undefined
			);

			break;

		case MazeType.DFS:
			/* a stack containing coordinates of the current cell and */
			/* a scrambled list of the direction to its neighbors */
			var stack = [
                { 
                    x: rnd() * maze.columns | 0,
                    y: rnd() * maze.rows | 0,
                    neighbors: Shuffle(dirs as any) 
                }
            ];

			iter(
				function() {
					return dfs(maze, stack);
				},
				maze.rows * maze.columns,
				function() {
					maze.complete();;
				},
				undefined
			);

			break;
	}
}

/**
 * Generates the maze using the Depth-First Search algorithm
 */
function dfs(maze : Maze, stack : Array<IStackData>) {
	var cell = stack[stack.length - 1];

	let x = cell.x;
	let y = cell.y;
	let neighbors = cell.neighbors;

	// when all cells have been visited at least once, it's done
	if (maze.cells[x][y].visited == false) {
		maze.cells[x][y].visited = true;
		maze.visitedCount++;
	}

	/* look for a neighbor that is in the maze and hasn't been visited yet */
	while (neighbors.length > 0) {
		let dir = neighbors.pop();
		if (neighbors.length == 0) {
			stack.pop(); // all neighbors checked, done with this one.
		}

		let dx = x + delta.x[dir];
		let dy = y + delta.y[dir];
		if (dx >= 0 && dy >= 0 && dx < maze.columns && dy < maze.rows) {
			if (maze.cells[dx][dy].visited == false) {
				/* break down the wall between them. The new neighbor */
				/* is pushed onto the stack and becomes the new current cell */
				maze.cells[x][y].wall[dir] = false;
				maze.cells[dx][dy].wall[undirs[dir]] = false;
				stack.push({ x: dx, y: dy, neighbors: Shuffle(dirs as any) });
				break;
			}
		}
	}

	return maze.visitedCount; // when visited count == row * columns it's done
}

/**
 * Generates the maze using an implementation of "Eller's Algorithm"
 * adapted from an example here: http://homepages.cwi.nl/~tromp/maze.html
 */
function eller(maze : Maze, L : any, R : any, y : number) {
	/**
	 * Initialize the maze one row at a time
	 */
    const columns = maze.columns;
    const rows = maze.rows;

	for (x = 0; x < maze.columns; x++) {
		if (randomBoolean() && R[x] != x + 1 && x != columns - 1) {
			L[R[x]] = L[x + 1];
			R[L[x + 1]] = R[x];
			R[x] = x + 1;
			L[x + 1] = x;

			maze.cells[x][y].wall[3] = false;
			maze.cells[x + 1][y].wall[2] = false;
		}

		if (randomBoolean() && R[x] != x) {
			L[R[x]] = L[x];
			R[L[x]] = R[x];
			L[x] = R[x] = x;
		} else {
			maze.cells[x][y].wall[1] = false;
			maze.cells[x][y + 1].wall[0] = false;
		}

		/* special treatment for last row */
		if (x == columns - 1 && y == rows - 2) {
			for (var x = 0; x < columns - 1; x++) {
				if (R[x] != x + 1) {
					L[R[x]] = L[x + 1];
					R[L[x + 1]] = R[x];
					R[x] = x + 1;
					L[x + 1] = x;
					maze.cells[x][rows - 1].wall[3] = false;
					maze.cells[x + 1][rows - 1].wall[2] = false;
				}
			}
		}
	}

	return y + 1;

	/**
	 * Slightly biased to the horizontal (i.e., returns true a bit more often than false)
	 */
	function randomBoolean() {
		return Math.floor(rnd() * 32) > 14;
	}
}

/**
 * A maze object, which is an 2D array of cells
 */

export class Maze {

	cells : Array<Array<IMazeCell>> = new Array();
   	visitedCount : number = 0;
    
    type: number;
    columns: number;
    rows: number;

    complete : () => void;

    constructor() {
 
        this.columns = 4;
        this.rows = 4;
        this.type = 0;
    }
	/**
	 * Provides a level of indirection to the builder() method which can't
	 * use a 'this' reference
	 */
	build (colls: number, rows: number, type : MazeType = MazeType.ELLEE)
	{
		this.columns = colls;
		this.rows = rows;
		this.type = type;
		this.cells = [];
		return new Promise( (res) =>{
			this.complete = res; 
			for(let i = 0; i < this.columns; i++)
				this.rowInitializer(i);
			
			generator(this);
		});
		
	}

	/**
	 * Initializes the maze one row at a time
	 */
	rowInitializer(x : number) {
		this.cells[x] = new Array<IMazeCell>(this.columns);

		for (let y = 0; y < this.rows; y++) {
			this.cells[x][y] = {
                visited: false,
                x : x,
                y : y,
                wall : [true, true, true, true]
            } as IMazeCell;
		}

		return x + 1;
	}
}

/**
 * Add a function to Array that returns a shuffled copy
 * of the current array contents
 */
let Shuffle = function(arr : []) {
	var that = arr.slice();
	for (var j, x, i = that.length; i; j = ( rnd() * i | 0 ), x = that[--i], that[i] = that[j], that[j] = x);
	return that;
};

/**
 * Add a function to Array that returns that last element.
 * equivalent to a peek operation on a stack
 */
let Peek = function(arr : []) {
	return arr[arr.length - 1];
};

/**
 * A generalized continuation mechanism for javascript
 *
 * Calls a function f(i) until it returns a result that indicates processing is complete.  The
 * value "state" passed to f() is the result of the previous call to f().  Every "max" iterations,
 * processing is yielded to allow responsiveness.
 *
 * f    - a function that takes a state parameter and returns an updated state
 * done - the final state that indicates that iteration is complete
 * fc   - an optional continuation function that is called when processing is complete
 * fp   - an optional callback function used to indicate progress though the iteration
 */
function iter(f : any, done : any, fc : any, fp : any) {
	var max = 50; // a reasonable number
	var count = 0;

	/* define the loop function that will manage the calls to f() */
	var loop = function(state : any) {
		while ((state = f(state)) != done) {
			if (count < max) {
				count++;
			} else {
				count = 0;
				setTimeout(function() {
					loop(state);
				}, 0);
				break;
			}
		}

		if (fp) {
			fp(state, done);
		}

		if (fc && state == done) {
			setTimeout(function() {
				fc();
			}, 0);
		}
	};

	/* call the loop function with the initial state */
	loop(0);
}

/**
 * Seedable random number generator function
 */
function rnd() : number {
    
	return Math.random();
}
