// 云函数入口文件
const cloud = require('wx-server-sdk');
// 题库
const testQues = require("./testQues.json");

cloud.init();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  const openId = wxContext.OPENID + "";

  // 入参
  const size = Math.min(event.size || 20, testQues.ques.length);

  // 出参
  let list = [];

  // 抽题，不需要考虑题号
  const indexs = random(0, testQues.ques.length - 1, size);
  list = indexs.map(v => testQues.ques[v]);

  console.log("getTestQuestions", "size=", size, "indexs=", indexs);

  return {
    list,
  }
}

/**
 * 生成随机数
 */
function random(from, to, count) {
  if (to <= from) {
    throw new Error("random 参数错误");
  }
  let res = [];
  while (res.length < count) {
    let r = Math.round((Math.random() * (to - from)) + from);
    if (res.findIndex(v => v === r) >= 0) {
      continue;
    } else {
      res.push(r);
    }
  }
  return res;
}