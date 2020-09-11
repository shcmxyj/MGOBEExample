import { ANS_TIME } from "./pushHandler";
import { GameState, AnsGameData } from "./msgHandler";
import { mgobexsInterface } from "./mgobexsInterface";

export interface QueInfo {
	id: number;
	que: string;
	opt: string[];
	ans: number;
}

let tcb = null;

/**
 * 初始化TCB
 */
export function initTcb(tcbApp) {
	tcb = tcbApp;
}

/**
 * 获取对战题目
 */
export function getBattleQuestions(room: mgobexsInterface.IRoomInfo, SDK: mgobexsInterface.ActionArgs<any>["SDK"], callback: (err, ques: QueInfo[], accuracy: number) => any) {
	if (!tcb || !room || !room.playerList) {
		SDK.logger.error("Error: getBattleQuestions1", room, !!tcb);
		return;
	}

	const openIds = [];

	room.playerList.forEach(p => {

		// 机器人不需要查询
		if (p.isRobot) {
			return;
		}

		let json = {} as any;
		try {
			json = JSON.parse(p.customProfile);
		} catch (e) {
			SDK.logger.error("Error: getBattleQuestions", "JSON.parse", p.customProfile);
		}

		!!json.openId && openIds.push(json.openId + "");
	});

	// 直接调用云开发
	tcb.callFunction({
		name: getCallName("getBattleQuestions"),
		data: { openIds },
	}).then((res: { result: { list: QueInfo[], accuracy: number } }) => {
		// 返回成功结果
		if (!!res && !!res.result && !!res.result.list && res.result.list.length > 0) {
			const accuracy = res.result.accuracy || 0;
			return callback(null, res.result.list, accuracy);
		}
		// 返回失败结果
		callback("Error", null, null);
	}).catch((err: any) => {
		// 返回失败结果
		SDK.logger.error("Error: getBattleQuestions2", { err });
		callback("Error", null, null);
	});
}

/**
 * 更新玩家信息
 */
export function updateUsers(gameState: GameState, room: mgobexsInterface.IRoomInfo, SDK: mgobexsInterface.ActionArgs<any>["SDK"]) {
	if (!tcb || !gameState || !gameState.teams || gameState.teams.length <= 0 || !room || !room.playerList) {
		SDK.logger.error("Error: updateUsers1", gameState, room, !!tcb);
		return;
	}

	gameState = JSON.parse(JSON.stringify(gameState));

	const sumScores = gameState.teams.map((team, i) => ({ i, score: !team ? 0 : team.reduce((a, b) => a + b.sumScore, 0) }));
	sumScores.sort((a, b) => - a.score + b.score);
	const maxTeam = sumScores[0].i;
	const allWin = (new Set(sumScores.map(v => v.score))).size === 1;

	const list = [];

	gameState.teams.forEach((team, i) => {
		if (team && team.length > 0) {
			team.forEach(p => {

				if (!p || !p.playerId) {
					return;
				}

				const playerInfo = room.playerList.find(v => v.id === p.playerId);

				// 机器人不需要更新
				if (!playerInfo || !playerInfo.customProfile || playerInfo.isRobot) {
					return;
				}

				let json = {} as any;

				try {
					json = JSON.parse(playerInfo.customProfile + "");
				} catch (e) {
					SDK.logger.error("Error: updateUsers", "JSON.parse", playerInfo.customProfile);
					return;
				}

				if (!json.openId) {
					SDK.logger.error("Error: updateUsers", "no openId");
					return;
				}

				const openId = json.openId;
				const score = (i === maxTeam || allWin) ? p.sumScore : 0;
				const avatarUrl = json.avatarUrl || "";
				const nickName = playerInfo.name || "";
				const accQueIds = p.accQueIds || [];
				const queCount = gameState.ques.length;

				list.push({ openId, score, avatarUrl, nickName, accQueIds, queCount });
			});
		}
	});

	// 直接调用云开发
	tcb.callFunction({
		name: getCallName("updateUsers"),
		data: { list },
	}).then((res) => {
		// 返回成功结果
		console.log("updateUsers success");
	}).catch((err: any) => {
		// 返回失败结果
		SDK.logger.error("Error: updateUsers2", { err });
	});
}

/**
 * 计算分数
 * @param full 满分
 * @param deltaTime 答题耗时 
 */
export function calcScore(full, deltaTime) {
	let res = 0;
	// 该时间内答题给满分
	const bufferTime = -1;

	deltaTime = Math.floor(deltaTime / 1000) * 1000;

	if (deltaTime <= bufferTime) {
		return full;
	}

	res = Math.max(0, Math.floor(Math.min((ANS_TIME - deltaTime + 1000) * full / ANS_TIME, full)));

	return res;
}

// 数组洗牌
function shuffle(arr) {
	for (let i = arr.length - 1; i >= 0; i--) {
		let rIndex = Math.floor(Math.random() * (i + 1));
		let temp = arr[rIndex];
		arr[rIndex] = arr[i];
		arr[i] = temp;
	}
	return arr;
}

/**
 * 初始化机器人
 * 计算第几回合获胜
 */
export function initRobot(ques: QueInfo[], accuracy: number): boolean[] {
	accuracy = accuracy || 0;
	ques = ques || [];

	// 答对数量
	const accCount = Math.max(Math.floor(0.01 * accuracy * ques.length), 1);

	let accRound = ques.map((_, i) => i + 1 <= accCount ? true : false);

	// 洗牌
	accRound = shuffle(accRound);

	return accRound;
}

/**
 * 机器人答题
 */
export function runRobot(gData: AnsGameData, room: mgobexsInterface.IRoomInfo, SDK: mgobexsInterface.ActionArgs<any>["SDK"]) {

	if (!gData || !room || !room.playerList || !gData.robots || !gData.gameState || !gData.gameState.ques) {
		SDK.logger.error("ERROR: runRobot1", gData, room);
		return;
	}

	// 3 ～ 8s 答题
	const curRound = gData.gameState.curRound;
	const que = gData.gameState.ques[curRound];

	if (!que) {
		SDK.logger.error("ERROR: runRobot2", curRound, gData.gameState);
		return;
	}

	gData.robots.forEach(robot => {
		if (!room.playerList.find(p => p.id === robot.playerId)) {
			return;
		}

		const accRound = robot.accRound || [];
		let acc = accRound[curRound];

		// 如果没有指定正误，随机生成
		if (acc !== true && acc !== false) {
			acc = Math.random() > 0.9 ? true : false;
		}

		let ans = acc ? que.ans : 0;

		if (!acc) {
			//  随机生成错误答案
			const random = Math.round(Math.random() * (que.opt.length - 2));
			ans = que.opt.map((_, i) => i).filter(v => v !== que.ans)[random] || 0;
		}

		const time = Math.random() * (10000 - 5000) + 5000;

		setTimeout(() => {
			SDK.dispatchAction({
				isRobot: true,
				playerId: robot.playerId,
				cmd: "SUBMIT",
				ans,
			});
		}, time);
	});
}

function getCallName(name: string): string {
	const cfgs = {
		getBattleQuestions: [
			"f1_getBattleQuestions",
		],
		updateUsers: [
			"f1_updateUsers",
		]
	};

	const cfg = cfgs[name];

	if (!cfg) {
		return null;
	}

	const random = Math.round(Math.random() * (cfg.length - 1));

	return cfg[random];
}