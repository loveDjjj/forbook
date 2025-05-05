const db = wx.cloud.database();
const _ = db.command


Page({
  data: {
    UserName: '',
    avatarUrl: '',
    orders: ['我发布的', '我卖出的', '我买到的'],
    balance: '0.00',
    showWithdrawDialog: false,
    qrCodeUrl: ''
  },

  async onShow(e) {
    var that = this
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    const checkOpenId = setInterval(() => {
      if (getApp().data.OPENID) {
        clearInterval(checkOpenId);
        db.collection('users').doc(getApp().data.OPENID).get({
          success(res) {
            that.setData({
              UserName: res.data.UserName,
              balance: res.data.balance || '0.00'
            });
            
            if (!res.data.balance) {
              db.collection('users').doc(getApp().data.OPENID).update({
                data: {
                  balance: '0.00'
                }
              }).catch(err => {
                console.error('初始化余额失败', err);
              });
            }
          }
        })
        wx.cloud.downloadFile({
          fileID: 'cloud://tx-5gi1emj7c6a1ff3f.7478-tx-5gi1emj7c6a1ff3f-1317385835/avatarUrl/' + getApp().data.OPENID + '.png',
          success: res => {
            this.setData({
              avatarUrl: res.tempFilePath
            })
          },
          fail: err => {
            console.error('暂时没有头像')
            this.setData({
              avatarUrl: '/images/avatar.png'
            })
          }
        })

        // 预加载二维码图片
        wx.cloud.downloadFile({
          fileID: 'cloud://tx-5gi1emj7c6a1ff3f.7478-tx-5gi1emj7c6a1ff3f-1317385835/OneDay.jpg',
          success: res => {
            this.setData({
              qrCodeUrl: res.tempFilePath
            });
          },
          fail: err => {
            console.error('获取二维码失败', err);
          }
        });
      }
      wx.hideLoading()
    }, 100);
  },

  goToOrderDetail(e) {
    wx.setStorageSync('index', e.currentTarget.dataset.index)
    wx.navigateTo({
      url: `/pages/user/userItem/userItem`
    })
  },
  goToFavorite() {
    wx.navigateTo({
      url: `/pages/user/favorite/favorite`
    })
  },
  goToAddress() {
    wx.navigateTo({
      url: `/pages/user/address/address`
    })
  },
  async chooseAvatar(e) {
    await wx.cloud.uploadFile({
      cloudPath: "avatarUrl/" + getApp().data.OPENID + ".png",
      filePath: e.detail.avatarUrl,
    });
  },

  changeName(e) {
    db.collection('users').doc(getApp().data.OPENID).update({
      data: {
        UserName: e.detail.value
      }
    })
  },

  // 显示提现弹窗
  showWithdrawDialog() {
    if (this.data.qrCodeUrl) {
      this.setData({
        showWithdrawDialog: true
      });
    } else {
      wx.showToast({
        title: '获取二维码失败',
        icon: 'none'
      });
    }
  },

  // 隐藏提现弹窗
  hideWithdrawDialog() {
    this.setData({
      showWithdrawDialog: false
    });
  },

  // 刷新余额
  async refreshBalance() {
    try {
      wx.showLoading({
        title: '刷新中',
        mask: true
      });

      const res = await db.collection('users').doc(getApp().data.OPENID).get();
      
      this.setData({
        balance: res.data.balance || '0.00'
      });
      
      wx.showToast({
        title: '已刷新',
        icon: 'success',
        duration: 1000
      });
      
    } catch (err) {
      console.error('刷新余额失败', err);
      wx.showToast({
        title: '刷新失败',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },
});