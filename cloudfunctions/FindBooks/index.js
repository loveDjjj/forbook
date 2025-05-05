// 云函数入口文件
const cloud = require('wx-server-sdk')
const MAX_LIMIT = 100
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  console.log(event, typeof event)
  let count = await db.collection('bookList').where(event).count();
  count = count.total;
  console.log(count)
  let list = []
  for (let i = 0; i < count; i += 100) { //自己设置每次获取数据的量
    list = list.concat(await getList(i, event));
  }
  return list;
}

async function getList(skip, event) { //分段获取数据
  let list = await db.collection('bookList').where(event).skip(skip).get();
  return list.data;
}