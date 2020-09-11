"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const msgHandler_1 = __importDefault(require("./msgHandler"));
const Util_1 = require("./Util");
const gameServer = {
    mode: 'sync',
    onInitGameData: function () {
        return {};
    },
    // 处理客户端消息
    onRecvFromClient: function ({ actionData, gameData, SDK, sender, room, exports }) {
        gameData && (gameData.room = room);
        let cmd = actionData.cmd;
        if (!room) {
            SDK.logger.error("ERROR: NO_ROOM", actionData);
            return SDK.exitAction();
        }
        if (!cmd || !msgHandler_1.default[cmd]) {
            SDK.logger.error("ERROR: NO_CMD", actionData);
            return SDK.exitAction();
        }
        try {
            msgHandler_1.default[cmd](arguments[0]);
        }
        catch (e) {
            SDK.logger.error("ERROR: ", e);
            SDK.sendData({ playerIdList: [], data: { e } });
            SDK.exitAction();
        }
        return;
    },
    onJoinRoom: function ({ actionData, gameData, SDK, room, exports }) {
        gameData && (gameData.room = room);
        SDK.logger.debug('actionData', actionData, '\n', 'gameData', gameData, '\n', 'room', room);
    },
    onCreateRoom: function ({ actionData, gameData, SDK, room, exports }) {
        gameData && (gameData.room = room);
        SDK.logger.debug('actionData', actionData, '\n', 'gameData', gameData, '\n', 'room', room);
    },
    onLeaveRoom: function ({ actionData, gameData, SDK, room, exports }) {
        gameData && (gameData.room = room);
        let gData = gameData;
        if (gData && gData.roundTimer && room.playerList.length === 0) {
            clearTimeout(gData.roundTimer);
        }
        SDK.logger.debug('actionData', actionData, '\n', 'gameData', gameData, '\n', 'room', room);
    },
    onRemovePlayer: function ({ actionData, gameData, SDK, room, exports }) {
        gameData && (gameData.room = room);
        SDK.logger.debug('actionData', actionData, '\n', 'gameData', gameData, '\n', 'room', room);
    },
    onDestroyRoom: function ({ actionData, gameData, SDK, room, exports }) {
        gameData && (gameData.room = room);
        let gData = gameData;
        if (gData && gData.roundTimer) {
            clearTimeout(gData.roundTimer);
        }
        SDK.logger.debug('actionData', actionData, '\n', 'gameData', gameData, '\n', 'room', room);
    },
    onChangeRoom: function ({ actionData, gameData, SDK, room, exports }) {
        gameData && (gameData.room = room);
        SDK.logger.debug('actionData', actionData, '\n', 'gameData', gameData, '\n', 'room', room);
    },
    onChangeCustomPlayerStatus: function ({ actionData, gameData, SDK, room, exports }) {
        gameData && (gameData.room = room);
        SDK.logger.debug('actionData', actionData, '\n', 'gameData', gameData, '\n', 'room', room);
    },
    onChangePlayerNetworkState: function ({ actionData, gameData, SDK, room, exports }) {
        gameData && (gameData.room = room);
        SDK.logger.debug('onChangePlayerNetworkState', 'actionData:', actionData, 'gameData:', gameData, 'room:', room);
    },
    onStartFrameSync: function ({ actionData, gameData, SDK, room, exports }) {
        gameData && (gameData.room = room);
        SDK.logger.debug('onStartFrameSync', 'actionData:', actionData, 'gameData:', gameData, 'room:', room);
    },
    onStopFrameSync: function ({ actionData, gameData, SDK, room, exports }) {
        gameData && (gameData.room = room);
        SDK.logger.debug('onStopFrameSync', 'actionData:', actionData, 'gameData:', gameData, 'room:', room);
    }
};
// 服务器初始化时调用
function onInitGameServer(tcb) {
    // 如需要，可以在此初始化 TCB
    const tcbApp = tcb.init({
        secretId: "请填写使用云开发的腾讯云账号secretId",
        secretKey: "请填写使用云开发的腾讯云账号secretKey",
        env: "请填写云开发环境ID",
        serviceUrl: 'http://tcb-admin.tencentyun.com/admin',
        timeout: 5000,
    });
    Util_1.initTcb(tcbApp);
}
exports.mgobexsCode = {
    logLevel: 'error+',
    logLevelSDK: 'error+',
    gameInfo: {
        gameId: "",
        serverKey: "",
    },
    onInitGameServer,
    gameServer
};
