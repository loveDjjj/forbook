// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command


// 云函数入口函数
exports.main = async (event, context) => {
  console.log(event)
  db.collection('sellingbook').doc(event.bookData.sellbookid).update({
    data: {
      condition: event.bookData.condition,
      contactInfo: event.bookData.contactInfo,
      description: event.bookData.description,
      hasNotes: event.bookData.hasNotes,
      image: event.bookData.image,
      needPlatformHosting: event.bookData.needPlatformHosting,
      price: event.bookData.price,
      status: event.bookData.status,
      sellerid: event.bookData.sellerid,
      studentId: event.bookData.studentId,
    }
  })
  return{}
}
