import { mgobexsInterface } from "./mgobexsInterface";
import { AnsGameData, GameState, PlayerInfo } from "./msgHandler";
import { calcScore, QueInfo, updateUsers, runRobot } from "./Util";

// 答题时间
export const ANS_TIME = 15000;
// 进入下一题时间
export const NEXT_TIME = 2000;
// 一题满分
export const ANS_FULL = 30;

export interface SerPushMsg {
    gameState: GameState,
}

// 新游戏
function newGame({ gameData, SDK }: mgobexsInterface.ActionArgs<null>) {
    let gData = gameData as AnsGameData;
    gData.gameState.curRound = -1;

    // 重置总分
    gData.gameState.teams.forEach(team => team.forEach(player => {
        player.sumScore = 0;
        player.curRoundAns = -1;
    }));

    newRound(arguments[0]);
}

// 当前游戏状态
function curGame({ gameData, SDK }: mgobexsInterface.ActionArgs<null>, playerIdList: string[] = []) {
    let gData = gameData as AnsGameData;

    playerIdList = playerIdList.filter(id => !!id);

    let curRoundTime = 0;

    if (gData.gameState && gData.gameState.curRound >= 0 && gData.gameState.curRoundTime > 0) {
        curRoundTime = gData.gameState.curRoundTime;
        // 剩余时间
        gData.gameState.curRoundTime = Math.max(ANS_TIME - (Date.now() - gData.startRoundTime) - 1, 0);
    }

    const gameState = JSON.parse(JSON.stringify(gData.gameState)) as GameState;

    // 保证每次新一局 curRoundTime 都能是 ANS_TIME
    if (curRoundTime === ANS_TIME && gameState && gameState.curRoundTime) {
        gameState.curRoundTime = curRoundTime;
    }

    SDK.sendData({ playerIdList, data: { gameState } });
}

// 新一局
function newRound({ gameData, SDK }: mgobexsInterface.ActionArgs<null>) {
    let gData = gameData as AnsGameData;
    gData.gameState.curRound++;
    gData.gameState.curRoundTime = ANS_TIME;
    gData.startRoundTime = Date.now();

    // 重置当前分数
    gData.gameState.teams.forEach(team => team.forEach(player => {
        player.curRoundScore = 0;
        player.curRoundAns = -1;
    }));

    curGame(arguments[0]);

    // 计时结束
    gData.roundTimer = setTimeout(() => {
        endRound(arguments[0]);
    }, ANS_TIME + 300);

    // 当前题目
    const que = gData.gameState.ques[gData.gameState.curRound];

    if (!que) {
        return;
    }

    const room = gData.room;
    const curRound = gData.gameState.curRound;

    // 处理机器人逻辑
    runRobot(gData, room, SDK);

    // 处理掉线玩家
    room.playerList && room.playerList.forEach(p => {
        if (p.commonNetworkState === mgobexsInterface.NetworkState.COMMON_ONLINE ||
            p.relayNetworkState === mgobexsInterface.NetworkState.RELAY_ONLINE ||
            p.isRobot
        ) {
            return;
        }

        let player: PlayerInfo = null;

        gData.gameState.teams.forEach(team => team && team.forEach(v => v.playerId === p.id && (player = v)));

        if (!player || player.curRoundAns !== -1) {
            return;
        }

        // 答题
        setTimeout(() => {
            if (!gData.gameState || gData.gameState.isEnd || player.curRoundAns !== -1 || gData.gameState.curRound !== curRound) {
                return;
            }
            player.curRoundAns = Math.round(Math.random() * (que.opt.length - 1));

            if (isAllSubmit(arguments[0])) {
                clearTimeout(gData.roundTimer);
                return endRound(arguments[0]);
            }

            curGame(arguments[0]);
        }, Math.random() * 4000 + 3000);
    });

    // 处理退出房间的玩家
    gData.gameState.teams.forEach(team => team && team.forEach(player => {
        if (!room || !room.playerList || !!room.playerList.find(p => p.id === player.playerId) || player.curRoundAns !== -1) {
            return;
        }

        // 答题
        setTimeout(() => {
            if (!gData.gameState || gData.gameState.isEnd || player.curRoundAns !== -1 || gData.gameState.curRound !== curRound) {
                return;
            }
            player.curRoundAns = Math.round(Math.random() * (que.opt.length - 1));

            if (isAllSubmit(arguments[0])) {
                clearTimeout(gData.roundTimer);
                return endRound(arguments[0]);
            }

            curGame(arguments[0]);
        }, Math.random() * 4000 + 3000);
    }));
}

// 结束一局
function endRound({ gameData, SDK }: mgobexsInterface.ActionArgs<null>) {
    let gData = gameData as AnsGameData;

    const room = gData.room;

    curGame(arguments[0]);

    const ANS_COUNT = gData.gameState.ques.length;
    // 2秒后结束游戏
    if (!gData.gameState.isEnd && gData.gameState.curRound >= ANS_COUNT - 1) {
        // 更新玩家信息
        updateUsers(gData.gameState, room, SDK);
        return setTimeout(() => endGame(arguments[0]), NEXT_TIME);
    }

    // 2秒后新一局
    return setTimeout(() => newRound(arguments[0]), NEXT_TIME);
}

// 结束游戏
async function endGame({ gameData, SDK }: mgobexsInterface.ActionArgs<null>) {
    let gData = gameData as AnsGameData;
    gData.gameState.isEnd = true;

    curGame(arguments[0]);


}

// 检查提交的答案
function checkSubmit({ gameData, SDK }: mgobexsInterface.ActionArgs<null>, playerId: string, ans: number) {
    let gData = gameData as AnsGameData;

    // 超过时间
    if (gData.gameState.curRoundTime <= 0) {
        return curGame(arguments[0]);
    }

    const ANS_COUNT = gData.gameState.ques.length;

    // 超过题目数量
    if (gData.gameState.curRound >= ANS_COUNT) {
        return curGame(arguments[0]);
    }

    let player: PlayerInfo = null;
    let que: QueInfo = gData.gameState.ques[gData.gameState.curRound];

    gData.gameState.teams.forEach(team => team.forEach(p => p.playerId === playerId && (player = p)));

    // 异常
    if (!player || player.curRoundScore > 0 || player.curRoundAns >= 0 || !que) {
        return curGame(arguments[0]);
    }

    player.curRoundAns = ans;

    if (que.ans !== ans) {
        // 答错
        player.curRoundScore = 0;
    } else {
        // 答对
        player.accQueIds.push(que.id);

        let scale = 1;

        // 最后一题是否要翻倍
        if (gData.gameState.curRound === ANS_COUNT - 1) { scale = 2; }

        let score = calcScore(ANS_FULL * scale, Date.now() - gData.startRoundTime);

        player.curRoundScore = score;
        player.sumScore += score;
    }

    // 全部提交就结束一局
    if (isAllSubmit(arguments[0])) {
        clearTimeout(gData.roundTimer);
        return endRound(arguments[0]);
    }

    return curGame(arguments[0]);
}

function isAllSubmit({ gameData, SDK }: mgobexsInterface.ActionArgs<null>): boolean {
    let gData = gameData as AnsGameData;
    let res = true;

    gData.gameState.teams.forEach(team => team.forEach(p => p.curRoundAns < 0 && (res = false)));

    return res;
}

export { newGame, curGame, newRound, endRound, endGame, checkSubmit };