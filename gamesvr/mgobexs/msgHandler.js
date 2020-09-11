"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const pushHandler_1 = require("./pushHandler");
const pushHandler = __importStar(require("./pushHandler"));
const Util_1 = require("./Util");
function readyHandler({ actionData, gameData, SDK, sender }) {
    let gData = gameData;
    if (gData.gameState && gData.gameState.isEnd) {
        gData.gameState = null;
    }
    const room = gData.room;
    if (!gData.gameState) {
        // 初始化当前房间对局的游戏信息
        initGameData(gData, room);
        // 获取题目，成功后下发给全部客户端
        Util_1.getBattleQuestions(room, SDK, (err, ques, accuracy) => {
            if (!err && !!ques && ques.length > 0) {
                gData.gameState.ques = ques;
                accuracy = accuracy || 0;
                // 初始化机器人
                room.playerList && room.playerList.forEach(p => {
                    if (!p.isRobot) {
                        return;
                    }
                    if (!gData.robots) {
                        gData.robots = [];
                    }
                    const robot = {
                        playerId: p.id,
                        accRound: Util_1.initRobot(ques, accuracy),
                    };
                    gData.robots.push(robot);
                });
                setTimeout(() => pushHandler.newGame(arguments[0]), 1000);
            }
            else {
                // 获取失败，重置state
                gData.gameState = null;
            }
        });
    }
    // 发送最新游戏信息
    pushHandler.curGame(arguments[0], [sender]);
}
function submitHandler({ actionData, gameData, SDK, sender }) {
    const isRobot = !!actionData["isRobot"];
    if (isRobot) {
        sender = actionData["playerId"] || "";
    }
    pushHandler.checkSubmit(arguments[0], sender, actionData.ans);
}
function curStateHandler({ actionData, gameData, SDK, sender }) {
    pushHandler.curGame(arguments[0], [sender]);
}
function initGameData(gData, room) {
    gData.gameState = {};
    gData.robots = [];
    gData.gameState.isEnd = false;
    gData.gameState.curRoundTime = pushHandler_1.ANS_TIME;
    gData.gameState.curRound = -1;
    gData.gameState.ques = null;
    gData.gameState.teams = [[], []];
    let teamId = room.playerList[0].teamId;
    gData.gameState.teams[0] = room.playerList.filter(u => u.teamId === teamId).map(player => ({
        curRoundScore: 0,
        sumScore: 0,
        playerId: player.id,
        curRoundAns: -1,
        accQueIds: [],
    }));
    gData.gameState.teams[1] = room.playerList.filter(u => u.teamId !== teamId).map(player => ({
        curRoundScore: 0,
        sumScore: 0,
        playerId: player.id,
        curRoundAns: -1,
        accQueIds: [],
    }));
}
const handlerWarpper = (handler) => (args) => {
    handler(args);
    args.SDK.exitAction();
};
exports.default = {
    READY: handlerWarpper(readyHandler),
    SUBMIT: handlerWarpper(submitHandler),
    CURRENT: handlerWarpper(curStateHandler),
};
