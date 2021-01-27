import { GlobalConfig } from "../GlobalConfig";

export interface ILevelData {
    size : number;
    gems: number;
    power?: number; 
}

export const GameConfig = {
    stepLen: 444,
    offsets : {
        top : 500, bottom: 500,
        left : 300, right: 300
    },
    ...GlobalConfig.Maze
}
