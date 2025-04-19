// pages/index/book_details/seller_info/seller_info.js
const db = wx.cloud.database();
const _ = db.command

Page({
  data: {
    bookInfo: {},
    help: ''
  },

  onLoad(e) {
    this.setData({
      bookInfo: wx.getStorageSync('sellerInfo'),
    });
    if(this.data.bookInfo.status == 'sold'){
      wx.showToast({
        title: '书籍已出售',
        icon: 'none'
      })
    }
    db.collection('others').doc('help').get().then(res => {
      this.setData({
        help: res.data.help
      })
    })
  },


  async contactSeller() {
    //如果要平台托管就联系管理员
    /*if (this.data.bookInfo.sellerid === getApp().data.OPENID) {
      wx.showToast({
        title: '大朗，这是你自己',
        icon: 'none'
      });
      return;
    }*/
    if(this.data.bookInfo.needPlatformHosting){
      await this.setData({
        sellerId: "administer"
      })
    }
    const temp = await db.collection('messages').where({
      $or: [
        {from: getApp().data.OPENID,to: this.data.bookInfo.sellerid},
        {from: this.data.bookInfo.sellerid,to: getApp().data.OPENID}
      ]
    }).get()
    if(temp.data.length == 0){
      await db.collection('messages').add({
        data: {
          from: getApp().data.OPENID,
          to: this.data.bookInfo.sellerid,
          messages: [],
          itemid: this.data.bookInfo._id,
          createTime: new Date().getTime()
        }
      })
    }else{
      await db.collection('messages').where({
        from: getApp().data.OPENID,
        to: this.data.bookInfo.sellerid
      }).update({
        data: {
          itemid: this.data.bookInfo._id,
          createTime: new Date().getTime()
        }
      })
    }
    wx.navigateTo({
      url: `/pages/chat/message/message?userId=${this.data.bookInfo.sellerid}`
    });
  },

  showHelp() {
    wx.showModal({
      title: '平台托管服务说明',
      content: this.data.help,
      showCancel: false,
      confirmText: '我知道了',
    });
  },

  buyNow() {
    console.log(this.data.bookInfo)
    wx.showModal({
      title: '购买确认',
      content: '确定要购买这本书吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '处理中...',
          });

          // 先检查书籍状态
          wx.cloud.database().collection('sellingbook').doc(this.data.bookInfo._id).get({
            success: async (res) => {
              if (res.data.status !== 'selling') {
                wx.hideLoading();
                wx.showToast({
                  title: '购买失败，书籍已出售',
                  icon: 'none',
                  duration: 2000
                });
                return;
              }

              // 先将书籍状态改为sold，防止他人购买
              try {
                await wx.cloud.database().collection('sellingbook').doc(this.data.bookInfo._id).update({
                  data: { status: 'processing' }
                });

                // 调用OrderLoad云函数生成订单
                wx.cloud.callFunction({
                  name: 'OrderLoad',
                  data: {
                    bookInfo: this.data.bookInfo
                  },
                  success: async res => {
                    if (res.result.success) {
                      const orderId = res.result.orderId;
                      
                      // 调用支付云函数
                      wx.cloud.callFunction({
                        name: 'Pay',
                        data: {
                          orderid: orderId,
                          money: this.data.bookInfo.book_price
                        },
                        success: async res => {
                          if (res.result.success) {
                            try {
                              const payment = res.result.payment;
                              
                              // 发起支付
                              await wx.requestPayment({
                                ...payment,
                                success: async (res) => {
                                  console.log('支付成功', res);
                                  wx.hideLoading();
                                  wx.showToast({
                                    title: '购买成功！',
                                    icon: 'success',
                                    duration: 2000
                                  });
                                  wx.navigateBack({
                                    delta: 1
                                  });
                                },
                                fail: async (err) => {
                                  console.error('支付失败', err);
                                  // 支付失败，恢复书籍状态
                                  await wx.cloud.database().collection('sellingbook').doc(this.data.bookInfo._id).update({
                                    data: { status: 'selling' }
                                  });
                                  wx.hideLoading();
                                  wx.showToast({
                                    title: '支付失败，请重试',
                                    icon: 'none'
                                  });
                                }
                              });
                            } catch (error) {
                              // 处理支付失败，恢复书籍状态
                              await wx.cloud.database().collection('sellingbook').doc(this.data.bookInfo._id).update({
                                data: { status: 'selling' }
                              });
                              console.error('处理支付失败:', error);
                              wx.hideLoading();
                              wx.showToast({
                                title: '支付失败，请重试',
                                icon: 'none'
                              });
                            }
                          } else {
                            // 调用支付云函数失败，恢复书籍状态
                            await wx.cloud.database().collection('sellingbook').doc(this.data.bookInfo._id).update({
                              data: { status: 'selling' }
                            });
                            wx.hideLoading();
                            wx.showToast({
                              title: '支付失败，请重试',
                              icon: 'none'
                            });
                          }
                        },
                        fail: async err => {
                          // 调用支付云函数失败，恢复书籍状态
                          await wx.cloud.database().collection('sellingbook').doc(this.data.bookInfo._id).update({
                            data: { status: 'selling' }
                          });
                          console.error('调用支付云函数失败:', err);
                          wx.hideLoading();
                          wx.showToast({
                            title: '支付失败，请重试',
                            icon: 'none'
                          });
                        }
                      });
                    } else {
                      // 创建订单失败，恢复书籍状态
                      await wx.cloud.database().collection('sellingbook').doc(this.data.bookInfo._id).update({
                        data: { status: 'selling' }
                      });
                      console.error('创建订单失败:', res.result.errorMessage);
                      wx.hideLoading();
                      wx.showToast({
                        title: `创建订单失败: ${res.result.errorMessage}`,
                        icon: 'none',
                        duration: 3000
                      });
                    }
                  },
                  fail: async err => {
                    // 调用OrderLoad云函数失败，恢复书籍状态
                    await wx.cloud.database().collection('sellingbook').doc(this.data.bookInfo._id).update({
                      data: { status: 'selling' }
                    });
                    console.error('调用OrderLoad云函数失败:', err);
                    wx.hideLoading();
                    wx.showToast({
                      title: `创建订单失败: ${err.errMsg || '未知错误'}`,
                      icon: 'none',
                      duration: 3000
                    });
                  }
                });
              } catch (error) {
                console.error('更新书籍状态失败:', error);
                wx.hideLoading();
                wx.showToast({
                  title: '购买失败，请重试',
                  icon: 'none',
                  duration: 2000
                });
              }
            },
            fail: (err) => {
              console.error('获取书籍信息失败:', err);
              wx.hideLoading();
              wx.showToast({
                title: '购买失败，请重试',
                icon: 'none',
                duration: 2000
              });
            }
          });
        }
      }
    });
  }
});