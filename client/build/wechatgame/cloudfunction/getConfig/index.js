// 云函数入口文件
const cloud = require('wx-server-sdk');
cloud.init();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openId = wxContext.OPENID + "";

  const func = {
    getUserInfo: [
      "f1_getUserInfo",
    ],
    getRank: [
      "f1_getRank",
    ],
    getTestQuestions: [
      "f1_getTestQuestions",
    ],
    getBgm: [
      "f1_getBgm",
    ],
    saveTestRes: [
      "f1_saveTestRes",
    ],
  };

  // 从 MGOBE 控制台获取信息替换以下参数
  // match1v1 是指一条满足1v1匹配规则的匹配Code
  const gameInfo = {
    gameId: "obg-5bel448q",
    secretKey: "9c8859beb7accfe6ccf7dbd9d0b280fca92df36d",
    url: "5bel448q.wxlagame.com",
    match1v1: "match-enau20md",
  };

  console.log(openId, func);

  return {
    func,
    gameInfo,
  };
}