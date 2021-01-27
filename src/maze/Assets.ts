import { Config } from '../shared/Config';

export const Assets = {
    BaseDir: Config.BaseResDir + "/game6",
    Assets : {
        "map-atlas": {
            name : "game-atlas",
            url : '/map-atlas.json'
        },
        "player" : {
            name: "player",
            url : "/Player/Game Character (up).json"
        }
    }
}