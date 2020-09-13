// 云函数入口文件
const cloud = require('wx-server-sdk')
const tencentcloud = require("tencentcloud-sdk-nodejs");

cloud.init()

// 云API 参数
const secretId = "填写开通AME的腾讯云账号secretId";
const secretKey = "填写开通AME的腾讯云账号secretKey";
const Client = tencentcloud.ame.v20190916.Client;
const models = tencentcloud.ame.v20190916.Models;
const Credential = tencentcloud.common.Credential;
const cred = new Credential(secretId, secretKey);

// 腾讯云AME域名
// 如：https://xxx.xxx
const DOMAIN = "填写开通AME时配置的域名";

// 云函数入口函数
exports.main = async (event, context) => {
	const wxContext = cloud.getWXContext();
	const openId = wxContext.OPENID + "";

	// 入参
	const bgmId = event.bgmId || "";

	// 出参
	let url = "";

	if (!bgmId) {
		return {
			url,
		};
	}

	// 查询
	const queryRes = await queryBgm(bgmId);
	const timeout = 1 * 60 * 1000; // 0.5h

	if (queryRes && queryRes[0] && queryRes[0].time && Date.now() - queryRes[0].time < timeout) {
		url = queryRes[0].url;

		return {
			url,
		};
	}

	// 查询不到，调用接口
	url = await getBGM(bgmId, openId).catch(e => {
		console.error("ERROR: getBGM", e);
		return Promise.resolve("");
	});

	if (url) {
		url = DOMAIN + url;
		// 更新数据库
		await updateBgm(bgmId, url);
	}

	return {
		url,
	}
}

async function queryBgm(ItemId) {
	const db = cloud.database();
	const _ = db.command;

	const res = await db.collection("Bgm")
		.where({
			_id: _.in([ItemId])
		})
		.get()
		.catch(err => {
			console.error("queryBgm error1", err);
			return Promise.resolve({ data: [] });
		});

	return res.data;
}

async function updateBgm(ItemId, url) {
	if (!ItemId || !url) {
		return;
	}

	const db = cloud.database();
	let data = {
		url,
		time: Date.now(),
	};

	await db.collection("Bgm")
		.doc(ItemId)
		.set({
			data
		})
		.catch(err => {
			console.error("updateBgm error2", err);
			return Promise.resolve();
		});
}

async function getBGM(ItemId, IdentityId) {
	// 实例化要请求产品(以cvm为例)的client对象
	let client = new Client(cred, "ap-shanghai");

	// 实例化一个请求对象
	let req = new models.DescribeMusicRequest();

	req.ItemId = ItemId;
	req.IdentityId = IdentityId;
	req.SubItemType = null;
	req.Ssl = "Y";

	return new Promise((resolve, reject) => {
		// 通过client对象调用想要访问的接口，需要传入请求对象以及响应回调函数
		client.DescribeMusic(req, function (err, response) {
			// 请求异常返回，打印异常信息
			if (err) {
				console.error("ERROR: DescribeMusic", err);
				return resolve("");
			}
			// 请求正常返回，打印response对象
			console.log(response.Music);
			return resolve(response.Music.Url);
		});
	});
}