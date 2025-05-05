// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, bookId, userId } = event
  console.log(event)
  const db = cloud.database()
  const _ = db.command
  const res = await db.collection('users').doc(userId).get()
  const user = res.data
  console.log(user)
  if (action === 'favorite') {
    if (user.favorite.indexOf(bookId) !== -1) {
      console.log('取消收藏')
      await db.collection('users').doc(userId).update({
        data: {
          favorite: _.pull(bookId)
        }
      })
    } else {
      console.log('收藏')
      await db.collection('users').doc(userId).update({
        data: {
          favorite: _.push(bookId)
        }
      })
    }
  } else {
    if (user.cart.indexOf(bookId) !== -1) {
      console.log('取消购物车')
      await db.collection('users').doc(userId).update({
        data: {
          cart: _.pull(bookId)
        }
      })
    } else {
      console.log('加入购物车')
      await db.collection('users').doc(userId).update({
        data: {
          cart: _.push(bookId)
        }
      })
    }
  }
}