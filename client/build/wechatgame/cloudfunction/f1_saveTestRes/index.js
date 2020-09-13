// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  const openId = wxContext.OPENID + "";

  // 入参
  const testRes = event.testRes || "";

  // 查询用户信息
  const db = cloud.database();
  const _ = db.command;

  const res = await db.collection("User")
    .where({
      _id: _.in([openId])
    })
    .get()
    .catch(err => {
      console.error("saveTestRes error1", err);
      // 返回异常，停止执行
      return Promise.reject(err);
    });

  console.log("saveTestRes openId=", openId);
  console.log("saveTestRes query res=", res);

  if (!res.data || !Array.isArray(res.data)) {
    return Promise.reject("查询失败");
  }

  if (res.data.length === 0) {
    console.log("未写入");
    await addUser({
      openId,
      testRes
    });
  } else {
    console.log("更新");
    await updateUser({
      openId,
      testRes
    });
  }


  return {};
}

async function updateUser({
  openId,
  testRes
}) {

  if (!openId) {
    return;
  }

  const db = cloud.database();
  let data = {
    testRes: (testRes || "") + "",
  };

  const res = await db.collection("User")
    .doc(openId)
    .update({
      data
    })
    .catch(err => {
      console.error("setTestRes error2", err);
      return Promise.reject(err);
    });
}

async function addUser({
  openId,
  testRes
}) {

  if (!openId) {
    return;
  }

  avatarUrl = "";
  nickName = "";
  score = 0;
  accQueIds = [];
  queCount = 0;
  accQueCount = 0;

  const db = cloud.database();
  const res = await db.collection("User")
    .add({
      data: {
        _id: openId,
        avatarUrl,
        nickName,
        score,
        accQueIds,
        queCount,
        accQueCount,
        testRes,
      }
    })
    .catch(err => {
      console.error("setTestRes error3", err);
      return Promise.reject(err);
    });
}