// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  const openId = wxContext.OPENID + "";

  // 一次最大查询量
  const MAX_SIZE = 1000;

  // 入参
  const start = event.start || 1;
  const size = Math.min(event.size || 20, MAX_SIZE);

  // 出参
  let myRank = 0;
  let list = [];

  // 查询
  const db = cloud.database();
  const res = await db.collection("User")
    .orderBy("score", "desc")
    .field({ accQueIds: false, testRes: false })
    .limit(MAX_SIZE)
    .get()
    .catch(err => {
      console.error("getRank error1", err);
      return Promise.resolve({
        data: []
      });
    });

  if (res.data.length > 0) {
    list = res.data.slice(start - 1, start - 1 + size).map((v, i) => ({
      rank: i + start,
      score: v.score,
      nickName: v.nickName || "",
      accuracy: Math.round((v.accQueCount || 0) / (v.queCount || 1) * 100),
      avatarUrl: v.avatarUrl,
    }));
    myRank = res.data.findIndex(v => v._id === openId) + 1;
  }

  console.log("getRank", "start=", start, "size=", size, "myRak=", myRank);

  return {
    myRank,
    list,
  }
}