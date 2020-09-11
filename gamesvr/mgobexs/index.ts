import { mgobexsInterface } from './mgobexsInterface';
import msgHandler, { AnsGameData } from './msgHandler';
import { initTcb } from './Util';

const gameServer: mgobexsInterface.GameServer.IGameServer = {
	mode: 'sync',
	onInitGameData: function (): mgobexsInterface.GameData {
		return {};
	},
	// 处理客户端消息
	onRecvFromClient: function ({ actionData, gameData, SDK, sender, room, exports }: mgobexsInterface.ActionArgs<mgobexsInterface.UserDefinedData>) {

		gameData && (gameData.room = room);

		let cmd = actionData.cmd;

		if (!room) {
			SDK.logger.error("ERROR: NO_ROOM", actionData);
			return SDK.exitAction();
		}

		if (!cmd || !msgHandler[cmd]) {
			SDK.logger.error("ERROR: NO_CMD", actionData);
			return SDK.exitAction();
		}

		try {
			msgHandler[cmd](arguments[0]);
		} catch (e) {
			SDK.logger.error("ERROR: ", e);
			SDK.sendData({ playerIdList: [], data: { e } });
			SDK.exitAction();
		}

		return;

	},
	onJoinRoom: function ({ actionData, gameData, SDK, room, exports }) {
		gameData && (gameData.room = room);
		SDK.logger.debug(
			'actionData', actionData,
			'\n',
			'gameData', gameData,
			'\n',
			'room', room
		);
	},
	onCreateRoom: function ({ actionData, gameData, SDK, room, exports }) {
		gameData && (gameData.room = room);
		SDK.logger.debug(
			'actionData', actionData,
			'\n',
			'gameData', gameData,
			'\n',
			'room', room
		);
	},
	onLeaveRoom: function ({ actionData, gameData, SDK, room, exports }) {
		gameData && (gameData.room = room);

		let gData = gameData as AnsGameData;

		if (gData && gData.roundTimer && room.playerList.length === 0) {
			clearTimeout(gData.roundTimer);
		}

		SDK.logger.debug(
			'actionData', actionData,
			'\n',
			'gameData', gameData,
			'\n',
			'room', room
		);
	},
	onRemovePlayer: function ({ actionData, gameData, SDK, room, exports }) {
		gameData && (gameData.room = room);
		SDK.logger.debug(
			'actionData', actionData,
			'\n',
			'gameData', gameData,
			'\n',
			'room', room
		);
	},
	onDestroyRoom: function ({ actionData, gameData, SDK, room, exports }) {
		gameData && (gameData.room = room);

		let gData = gameData as AnsGameData;

		if (gData && gData.roundTimer) {
			clearTimeout(gData.roundTimer);
		}

		SDK.logger.debug(
			'actionData', actionData,
			'\n',
			'gameData', gameData,
			'\n',
			'room', room
		);
	},
	onChangeRoom: function ({ actionData, gameData, SDK, room, exports }) {
		gameData && (gameData.room = room);
		SDK.logger.debug(
			'actionData', actionData,
			'\n',
			'gameData', gameData,
			'\n',
			'room', room
		);
	},
	onChangeCustomPlayerStatus: function ({ actionData, gameData, SDK, room, exports }) {
		gameData && (gameData.room = room);
		SDK.logger.debug(
			'actionData', actionData,
			'\n',
			'gameData', gameData,
			'\n',
			'room', room
		);
	},
	onChangePlayerNetworkState: function ({ actionData, gameData, SDK, room, exports }) {
		gameData && (gameData.room = room);
		SDK.logger.debug(
			'onChangePlayerNetworkState',
			'actionData:', actionData,
			'gameData:', gameData,
			'room:', room
		);
	},
	onStartFrameSync: function ({ actionData, gameData, SDK, room, exports }) {
		gameData && (gameData.room = room);
		SDK.logger.debug(
			'onStartFrameSync',
			'actionData:', actionData,
			'gameData:', gameData,
			'room:', room
		);
	},
	onStopFrameSync: function ({ actionData, gameData, SDK, room, exports }) {
		gameData && (gameData.room = room);
		SDK.logger.debug(
			'onStopFrameSync',
			'actionData:', actionData,
			'gameData:', gameData,
			'room:', room
		);
	}
};

// 服务器初始化时调用
function onInitGameServer(tcb: any) {
	// 如需要，可以在此初始化 TCB
	const tcbApp = tcb.init({
		secretId: "请填写使用云开发的腾讯云账号secretId",
		secretKey: "请填写使用云开发的腾讯云账号secretKey",
		env: "请填写云开发环境ID",
		serviceUrl: 'http://tcb-admin.tencentyun.com/admin',
		timeout: 5000,
	});

	initTcb(tcbApp);
}

export const mgobexsCode: mgobexsInterface.mgobexsCode = {
	logLevel: 'error+',
	logLevelSDK: 'error+',
	gameInfo: {
		gameId: "",
		serverKey: "",
	},
	onInitGameServer,
	gameServer
}