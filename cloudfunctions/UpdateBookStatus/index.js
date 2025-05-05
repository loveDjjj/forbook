// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { operation, orderId } = event
  console.log('操作类型:', operation, '订单号:', orderId)

  try {
    // 根据订单号获取订单信息
    const orderInfo = await db.collection('orderList').doc(orderId).get();
    console.log(orderInfo)
    const { buyerid, sellerid, bookid } = orderInfo.data;

    switch (operation) {
      case 'buy':
        // 更新买家的Buying数组
        await db.collection('users').doc(buyerid).update({
          data: {
            Buying: _.push(orderId)
          }
        });

        // 更新卖家的Selling数组
        await db.collection('users').doc(sellerid).update({
          data: {
            Selling: _.push(orderId)
          }
        });

        // 更新订单状态
        await db.collection('orderList').doc(orderId).update({
          data: {
            status: 'waitSend'
          }
        });

        // 更新书籍状态为已售出
        await db.collection('sellingbook').doc(bookid).update({
          data: {
            status: 'sold'
          }
        });
        break;

      case 'confirmSend':
        // 更新订单状态为待收货
        await db.collection('orderList').doc(orderId).update({
          data: {
            status: 'waitReceive'
          }
        });
        break;

      case 'confirmReceive':
        // 获取卖家当前余额
        const sellerRes = await db.collection('users').doc(sellerid).get();
        const currentBalance = parseFloat(sellerRes.data.balance || '0.00');
        
        // 获取书籍价格
        const bookPrice = parseFloat(orderInfo.data.book_price);
        
        // 计算新余额
        const newBalance = (currentBalance + bookPrice).toFixed(2);

        // 更新订单状态为已收货
        await db.collection('orderList').doc(orderId).update({
          data: {
            status: 'received'
          }
        });

        // 更新卖家余额
        await db.collection('users').doc(sellerid).update({
          data: {
            balance: newBalance
          }
        });
        break;

      case 'askCancel':
        // 更新订单状态为退款中
        await db.collection('orderList').doc(orderId).update({
          data: {
            status: 'canceling'
          }
        });
        break;

      case 'confirmCancel':
        try {
          // 获取订单信息用于退款
          const orderInfo = await db.collection('orderList').doc(orderId).get();
          
          // 调用退款云函数
          const refundResult = await cloud.callFunction({
            name: 'Refund',
            data: {
              trade: orderId,
              total_fee: orderInfo.data.payment_info.total_fee,
              refund_fee: orderInfo.data.payment_info.total_fee
            }
          });

          if (refundResult.result.code === 200) {
            // 退款成功，更新订单状态
            await db.collection('orderList').doc(orderId).update({
              data: {
                status: 'refunded',
                refund_info: {
                  refund_no: refundResult.result.out_refund_no,
                  refund_time: new Date(),
                  refund_fee: orderInfo.data.payment_info.total_fee
                }
              }
            });

            // 退款成功，更新书籍状态为在售
            await db.collection('sellingbook').doc(bookid).update({
              data: {
                status: 'selling'
              }
            });
          } else {
            throw new Error(`退款失败: ${refundResult.result.err_code_des || '未知错误'}`);
          }
        } catch (error) {
          console.error('退款处理失败:', error);
          throw error;
        }
        break;
    }

    return {
      success: true,
      message: '操作成功'
    };
  } catch (error) {
    console.error('操作失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

