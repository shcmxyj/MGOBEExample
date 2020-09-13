// 云函数入口文件
const cloud = require('wx-server-sdk');
// 题库
const battleQues = require("./battleQues.json");

cloud.init();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  const openId = wxContext.OPENID + "";

  // 入参
  const size = Math.min(event.size || 6, battleQues.ques.length);
  const openIds = Array.from(new Set((event.openIds || [])));

  // 出参
  let list = [];
  let accuracy = 50;

  // 查询玩家信息，获得历史正确题目
  let records = [];
  const db = cloud.database();
  const _ = db.command;

  const res = await db.collection("User")
    .where({
      _id: _.in(openIds)
    })
    .get()
    .catch(err => {
      console.error("getBattleQuestions error1", err);
      return Promise.resolve({
        data: []
      });
    });

  if (res.data) {

    res.data.length > 0 ? (accuracy = 0) : "";

    records = res.data.map(v => {
      accuracy += Math.round((v.accQueCount || 0) / (v.queCount || 1) * 100);
      return v.accQueIds || [];
    });

    accuracy = Math.round(accuracy / (res.data.length || 1));
  }

  console.log("getBattleQuestions accuracy", accuracy, "length", res.data.length);

  // 抽题，需要根据历史题目抽取
  // 先洗牌打乱顺序
  const indexs = shuffle(battleQues.ques).map(v => {
    let weight = 0;

    records.forEach(record => {
      if (record && record.findIndex(id => id === v.id) >= 0) {
        weight++;
      }
    });

    return {
      weight,
      id: v.id,
    };
  });

  // 根据权重取前size个题目 
  const randomIndex = indexs.sort((a, b) => a.weight - b.weight).slice(0, size).map(v => v.id);

  // 根据 id 取题目
  list = randomIndex.map(id => battleQues.ques.find(v => v.id === id));

  console.log("getBattleQuestions", "size=", size, "openIds=", openIds, "records=", records, "randomIndex", randomIndex);

  return {
    list,
    accuracy,
  }
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