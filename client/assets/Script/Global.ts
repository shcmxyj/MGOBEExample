/// <reference path="../../MGOBE.d.ts" />

// 导入MGOBE SDK
import '../Script/libs/MGOBE';

interface UserInfo {
	nickName: string,
	gender: number,
	language: string,
	city: string,
	province: string,
	country: string,
	avatarUrl: string,
}

class Global {
	// 云开发环境ID
	public cloudEnvId: string = "test-iv5hi";

	// 游戏信息由云函数下发
	// MGOBE 游戏ID
	public gameId: string;
	// MGOBE 游戏密钥
	public secretKey: string;
	// MGOBE 服务域名
	public server: string;
	// MGOBE 匹配Code
	public matchCode: string = null;

	public room: MGOBE.Room = null;
	public userInfo: UserInfo;
	public otherNickName = null;
	public otherAvatarUrl = null;
	public openId: string;
	public playerId: string;
	public gameState: boolean = false;
	public newFriendPlayer = null;
	public assesment = {
		questions: [],
		mistakes: [],
		score: -1,
	};
	public cloudFunc: {
		getRank: Array<any>,
		getTestQuestions: Array<any>,
		getUserInfo: Array<any>,
		getBgm: Array<any>,
		saveTestRes: Array<string>
	} = null;

	public score = 0;
	public accuracy = 0;
	public _initialized = false;
	public bgm = null;
	public options = {
		sound: 'on',
		music: 'on',
	};
	public iswechatgame: boolean = true;
	public audioId: number = 0;
	public ansS: boolean = null;
	public ansS2: boolean = null;

	public personalView: cc.Node = null;
	public resultView: cc.Node = null;
	public settlementView: cc.Node = null;
	public playerView: cc.Node = null;
	public matchView: cc.Node = null;

	// 初始化 MGOBE SDK
	public init() {
		console.log("---------------openId", this.openId);

		const gameInfo = {
			// 替换 为控制台上的“游戏ID”
			gameId: this.gameId,
			// 玩家 openId
			openId: this.openId,
			// 替换 为控制台上的“游戏Key”
			secretKey: this.secretKey,
		};

		const config = {
			// 替换 为控制台上的“域名”
			url: this.server,
			reconnectMaxTimes: 5,
			reconnectInterval: 1000,
			resendInterval: 1000,
			resendTimeout: 10000,
		};

		// 打开log输出
		// MGOBE.DebuggerLog.enable = true;

		// 实例化 Room
		this.room = new MGOBE.Room();

		// 初始化 Listener
		MGOBE.Listener.init(gameInfo, config, event => {
			if (event.code === 0) {
				// 添加 room 监听
				MGOBE.Listener.add(this.room);
				this.playerId = MGOBE.Player.id;

				const ev = new cc.Event.EventCustom('MGOBE-Init', false);
				cc.director.dispatchEvent(ev);
			} else {
				console.log("初始化失败");
				const ev = new cc.Event.EventCustom('MGOBE-fail', false);
				cc.director.dispatchEvent(ev);

				console.log("初始化失败");
			}
		});

		this._initialized = true;
	}
}

const global = new Global();

export default global;

// 将 Global 注入到全局
if (typeof window !== "undefined") {
	(window as any).Global = global;
}