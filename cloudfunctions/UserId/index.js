const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  // 这里获取到的 openId、 appId 和 unionId 是可信的，注意 unionId 仅在满足 unionId 获取条件时返回
  let {
    OPENID,
    APPID,
    UNIONID
  } = cloud.getWXContext()
  let temp = await db.collection('users').where({
    _id: OPENID
  }).get()
  if (temp.data.length == 0) {
    await db.collection('users').add({
      data: {
        UserName:'',
        _id: OPENID,
        _openid: OPENID,
        Selling: [],
        Buying: [],
        cart:[],
        favorite:[],
        address:[],
        publish:[],
        balance:0
      }
    })
  }
  return {
    OPENID,
    APPID,
    UNIONID,
  }
}