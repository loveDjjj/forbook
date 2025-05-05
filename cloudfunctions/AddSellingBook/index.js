// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  await db.collection('users').doc(event.openid).update({
    data: {
      publish: _.push(event.bookdata.map(item => item._id))
    }
  })
  for (let i = 0; i < event.bookdata.length; i++) {
    await db.collection('bookList').where({ book_isbn: event.bookdata[i].book_isbn }).get().then(res => {
      book_price = res.data[0].book_price || 0
      reference_price = Number(res.data[0].reference_price || 0)
      console.log(reference_price)
      book_price = Math.min(event.bookdata[i].book_price, book_price)
      Selling = res.data[0].Selling || []
      reference_price = (Number(event.bookdata[i].book_price) + reference_price * Selling.length) / (Selling.length + 1)
      console.log(reference_price)
      reference_price = Math.round(reference_price * 100) / 100
      db.collection('bookList').doc(res.data[0]._id).update({
        data: {
          Selling: _.push(event.bookdata[i]._id),
          book_price: book_price,
          reference_price: reference_price
        }
      })
    })
  }
  await db.collection('sellingbook').add({
    data: event.bookdata
  })
  return {}

}