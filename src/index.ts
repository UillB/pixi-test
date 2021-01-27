import HookPixi from "./pixi-utils";
	HookPixi();

import TWEEN from "@tweenjs/tween.js";
import { Application } from "./Application";
import { Config } from "./shared/Config";
import { Assets } from "./shared/AssetsLib";
import { BaseGame } from "./shared/BaseGame";
import { UiManager } from "./shared/ui/UiManager";
import { GameApiInterface, FakeGameApi, GameStateInterface, EmbeddedGameApi } from './GameAPI';
import { Multilang } from "./shared/Multilang";

//games
import { Maze } from './maze/index';
import { GA } from "./GA";
import { SoundGrouper } from './shared/Sound';

//@ts-ignore
const FAKEAPI = '/* @echo FAKEAPI */' == 'true';

export class App extends Application {
	static instance: App;
	public api: GameApiInterface;
	private _currentGame?: BaseGame;
	public uiManager: UiManager;
	public multilang: Multilang;
	public lang: string;
	public games: {[key: string]: typeof BaseGame};

	_init: boolean;
	constructor(parent: HTMLElement) {
		if(!parent)
			throw new Error("aprent element must be div!");
			
		const aspect = window.innerWidth / window.innerHeight;
		const size = { ...Config.ReferenceSize };

		if (aspect < size.width / size.height) {
			size.height = size.width / aspect;
		}

		//fallback
		PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL;

		super({
			autoStart: false,
			powerPreference: "low-power",
			backgroundColor: 0xcccccc,
			...size
		});

		parent.appendChild(this.view);
		
		this.games = { Maze };
		this.lang = 'en_US';

		if(!FAKEAPI) {
			//@ts-ignore
			this.api = window.GameAPI || new EmbeddedGameApi();
		}else {
			this.api = new FakeGameApi();
		}

		//@ts-ignore		
		window.GameAPI = this.api;
		
		this.uiManager = new UiManager(this);
		this.uiManager.visible = false;
		this.ticker.add(this.update, this);

		if (Config.PausedInBackground) {
			window.addEventListener("blur", () => {
				this.pause();
			});

			window.addEventListener("focus", () => {
				this.resume();
			});
		}

		this.render();

		//@ts-ignore
		window.AppInstance = this;
		App.instance = this;
	}

	load() {
		// на всякий случай такой кастыль
		this.loader.baseUrl = Assets.BaseDir;
		SoundGrouper.createManager("Any");
		try{
			const data = this.api.getGameData("Loader")
			this.lang =  data.lang || ( data.data && data.data.lang ) || this.lang;
		} catch (e) {
			GA.error(e, true);
			console.error("Critical", e);
		}
		//@ts-ignore
		const ui_asset = Assets.AssetsTranslated[this.lang] || {};

		//@ts-ignore
		this.loader.add(Object.values( {...Assets.Assets, ...ui_asset}));
	
		this.loader.add("mainfest", Config.Translations);

		this.loader.load(() => {
			this.init();
		});
	}

	private init() {

		this.multilang = new Multilang(this.loader.resources["mainfest"].data);
		this.multilang.preload(this.lang);
		this.lang = this.multilang._lang;

		this.uiManager.init(this.loader.resources);
		this.uiManager.visible = false;
		this.stage.addChild(this.uiManager.stage);

		this.multilang.once("loaded", () => {
			this.api.registerHook("Loader", (arg) => {
				this.apiHook(arg);
			})
			this._init = true;
			this.emit("loaded");
			this.api.submitGameState("Loader", {
				type: "init",
				data: { message: "Game loader init" }
			});
		});
	}

	private apiHook(arg: GameStateInterface) 
	{
		if(arg.type == "start") {
			if(!arg.data) {
				this.api.submitGameState("Loader", {
					type: "error",
					data: {
						game: undefined, 
						message: "Data can't be empty! ",
						variants: {
							data : {
								 name: Object.keys(this.games)[0]
								}
							}
						}
				});
				return;
			}

			const name = arg.data["name"] || arg.data["game"];
			if(!this.startGameByName(name)) {
				this.api.submitGameState("Loader", {
					type: "error",
					data: {game: name, message: "Can't found", variants: Object.keys(this.games) }
				});
			}
		}

		if(arg.type == "close") {
			this.stop();
			this.api.submitGameState("Loader", {
				type: "close",
				data: {message: "Stoped by API Request"}
			});
		}
	}

	public startGameByName(name: string) {
		if(name && this.games[name]) {
			this.preparedStart(new this.games[name]);
			return true;
		}
		return false;
	}
	
	preparedStart(game: BaseGame) {
		if(!this._init)
			throw Error("App can't init!");

		if (!game)
			throw Error("Game can't be null!");

		this.stop();
		game.preload().load(() => {
			this.start(game);
			//setTimeout(() => this.start(game), 0); //unBug
		});
	}

	start(game: BaseGame) {
		
		this._currentGame = game;

		this.uiManager.bindListener(game as any);
		this._currentGame.init(this);
		this.uiManager.postInit();

		this.stage.addChildAt(this._currentGame.stage, 0);
		
		this.resume();
		super.start();
	}

	stop() {
		if (this._currentGame) {
			this.stage.removeChild(this._currentGame.stage);
			this.uiManager.reset();
			this._currentGame.stop();
			if(this._currentGame.sounds)
				this._currentGame.sounds.Stop();
		}
		this._currentGame = undefined;
		super.render();
		super.stop();
	}

	pause() {
		this.ticker.stop();
		if (this._currentGame) {
			this._currentGame.pause();
		}
		
		this.update();
	}

	resume() {
		if (!this._currentGame) return;

		this._currentGame.resume();
		super.start();
	}

	private update() {
		TWEEN.update(this.ticker.lastTime);
		if (this._currentGame != null) {
			this._currentGame.update(this.ticker);
		}

		this.render();
	}
}

//@ts-ignore
window.GamesFromHell = App;