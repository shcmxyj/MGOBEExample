// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init();

/**
 User 字段：
 _id: string, openId,
 avatarUrl: string, 头像,
 nickName: string, 昵称,
 score: number, 积分,
 queCount: number, 答题数,
 accQueCount: number, 答对题数,
 accQueIds: number[], 答对题号数组,
 testRes: string, 玩家评测结果
 */

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  // 入参
  const list = (event.list || []).filter(v => !!v.openId).map(user => ({
    openId: user.openId + "",
    avatarUrl: user.avatarUrl || "",
    nickName: user.nickName || "",
    score: user.score || 0,
    accQueIds: Array.isArray(user.accQueIds) ? user.accQueIds : [],
    queCount: user.queCount || 1,
  }));

  if (list.length === 0) {
    console.log("length = 0, event = ", event);
    return {};
  }

  // 查询用户信息
  const db = cloud.database();
  const _ = db.command;

  const res = await db.collection("User")
    .where({
      _id: _.in(list.map(v => v.openId))
    })
    .get()
    .catch(err => {
      console.error("updateUsers error1", err);
      // 返回异常，停止执行
      return Promise.reject(err);
    });

  console.log("updateUsers list=", list);
  console.log("updateUsers query res=", res);

  if (!res.data || !Array.isArray(res.data)) {
    res.data = [];
  }

  // 更新用户信息（新增、修改）
  for (let i = 0; i < list.length; i++) {
    const info = list[i];
    const isNew = !res.data.find(v => v._id === info.openId);

    if (isNew) {
      await addUser(info);
    } else {
      await updateUser(info);
    }
  }

  return {};
}

async function updateUser({ openId, avatarUrl, nickName, score, accQueIds, queCount }) {

  if (!openId) {
    return;
  }

  avatarUrl = avatarUrl || "";
  nickName = nickName || "";
  score = score || 0;
  accQueIds = accQueIds || [];
  queCount = queCount || 1;
  accQueCount = accQueIds.length;

  const db = cloud.database();
  const _ = db.command;
  let data = {
    avatarUrl,
    nickName,
    score: _.inc(score),
    accQueIds: _.addToSet({
      "$each": accQueIds
    }),
    queCount: _.inc(queCount),
    accQueCount: _.inc(accQueCount),
  };

  if (accQueIds.length === 0) {
    delete data.accQueIds;
  }

  const res = await db.collection("User")
    .doc(openId)
    .update({ data })
    .catch(err => {
      console.error("updateUsers error2", err);
    });
}

async function addUser({ openId, avatarUrl, nickName, score, accQueIds, queCount }) {

  if (!openId) {
    return;
  }

  avatarUrl = avatarUrl || "";
  nickName = nickName || "";
  score = score || 0;
  accQueIds = accQueIds || [];
  queCount = queCount || 1;
  accQueCount = accQueIds.length;

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
        testRes: "",
      }
    })
    .catch(err => {
      console.error("updateUsers error3", err);
    });
}