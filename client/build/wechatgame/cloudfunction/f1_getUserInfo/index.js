// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  const openId = wxContext.OPENID + "";

  // 出参
  let score = 0;
  let accuracy = 0;
  let testRes = "";

  // 使用 openId 查询玩家信息
  const db = cloud.database();

  const res = await db.collection("User")
    .doc(openId)
    .get()
    .catch(err => {
      console.log("getUserInfo error1", err);
      return Promise.resolve({
        data: {}
      });
    });

  console.log("getUserInfo", "openId=", openId, "res=", res);

  if (res.data) {
	Array.isArray(res.data) && res.data.length > 0 && (res.data = res.data[0]);
    testRes = res.data.testRes || "";
    score = res.data.score || score;
    accuracy = Math.round((res.data.accQueCount || 0) / (res.data.queCount || 1) * 100);
  }

  return {
    openId,
    score,
    accuracy,
    testRes,
  }
}