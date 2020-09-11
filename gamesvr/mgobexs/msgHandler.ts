import { mgobexsInterface } from "./mgobexsInterface";
import { ANS_TIME } from "./pushHandler";
import * as pushHandler from "./pushHandler";
import { QueInfo, getBattleQuestions, initRobot } from "./Util";

export interface PlayerInfo {
    playerId: string,
    curRoundAns: number,
    curRoundScore: number,
    sumScore: number,
    accQueIds: number[],
}

export interface GameState {
    isEnd: boolean,
    curRoundTime: number,
    curRound: number,
    ques: QueInfo[],
    teams: [PlayerInfo[], PlayerInfo[]],
}

export interface AnsGameData {
    room: mgobexsInterface.IRoomInfo,
    gameState: GameState,
    roundTimer: any,
    startRoundTime: number,
    robots: { playerId: string, accRound: boolean[] }[]
}

interface AnsActionData {
    cmd: string,
    ans: number,
}

function readyHandler({ actionData, gameData, SDK, sender }: mgobexsInterface.ActionArgs<AnsActionData>) {

    let gData = gameData as AnsGameData;

    if (gData.gameState && gData.gameState.isEnd) {
        gData.gameState = null;
    }

    const room = gData.room;

    if (!gData.gameState) {
        // 初始化当前房间对局的游戏信息
        initGameData(gData, room);
        // 获取题目，成功后下发给全部客户端
        getBattleQuestions(room, SDK, (err, ques, accuracy) => {
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
                        accRound: initRobot(ques, accuracy),
                    };

                    gData.robots.push(robot);
                });

                setTimeout(() => pushHandler.newGame(arguments[0]), 1000);
            } else {
                // 获取失败，重置state
                gData.gameState = null;
            }
        });
    }

    // 发送最新游戏信息
    pushHandler.curGame(arguments[0], [sender]);
}

function submitHandler({ actionData, gameData, SDK, sender }: mgobexsInterface.ActionArgs<AnsActionData>) {
    const isRobot = !!actionData["isRobot"];

    if (isRobot) {
        sender = actionData["playerId"] || "";
    }

    pushHandler.checkSubmit(arguments[0], sender, actionData.ans);
}

function curStateHandler({ actionData, gameData, SDK, sender }: mgobexsInterface.ActionArgs<AnsActionData>) {
    pushHandler.curGame(arguments[0], [sender]);
}

function initGameData(gData: AnsGameData, room: mgobexsInterface.IRoomInfo) {
    gData.gameState = {} as any;
    gData.robots = [];

    gData.gameState.isEnd = false;
    gData.gameState.curRoundTime = ANS_TIME;
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

const handlerWarpper = (handler: (arsg: mgobexsInterface.ActionArgs<AnsActionData>) => any) => (args: mgobexsInterface.ActionArgs<AnsActionData>) => {
    handler(args);

    args.SDK.exitAction();
};

export default {
    READY: handlerWarpper(readyHandler),
    SUBMIT: handlerWarpper(submitHandler),
    CURRENT: handlerWarpper(curStateHandler),
};