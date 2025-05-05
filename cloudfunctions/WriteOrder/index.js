// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
}) // 使用当前云环境
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  console.log(event)
  await db.collection('order').where({ _openid: event._openid }).update({
    data: {
      order: _.push(event.orderData)
    }
  })
}