const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    detail: [],
    detailList: [],
    orderItems: [],
    totalPrice: 0,
    discount: 0,
    finalPrice: 0,
    remark: ''
  },

  onLoad() {
    // 从缓存获取订单数据
    const selectedItems = wx.getStorageSync('selectedItems') || []
    console.log(selectedItems)
    // 计算总价和优惠
    let totalPrice = 0
    selectedItems.forEach(item => {
      // 使用Math.round进行四舍五入后保留两位小数
      totalPrice += Math.round(item.book_price * 100) / 100
    })

    // 计算优惠金额
    let discount = 0

    // 计算最终价格时也使用四舍五入
    const finalPrice = Math.round((totalPrice - discount) * 100) / 100

    this.setData({
      orderItems: selectedItems,
      totalPrice: Math.round(totalPrice * 100) / 100,
      discount: discount,
      finalPrice: finalPrice
    })

    db.collection('users').doc(getApp().data.OPENID).get().then(res => {
      this.setData({
        detailList: res.data.address,
        detail: res.data.address[0]
      })
    })
  },

  // 选择收货地址
  chooseAddress() {
    wx.showActionSheet({
      itemList: this.data.detailList.map(addr =>
        `${addr.nickname} - ${addr.address}`
      ),
      success: (res) => {
        // 用户选择了某个地址
        const selecteddetail = this.data.detailList[res.tapIndex]
        this.setData({
          detail: selecteddetail
        })
      }
    })
  },

  // 备注输入
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    })
  },

  // 提交订单
  async submitOrder() {
    /*if (!this.data.detail.name) {
      wx.showToast({
        title: '请选择收货地址',
        icon: 'none'
      })
      return
    }*/
    wx.showModal({
      content: '是否确认订单',
      complete: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '提交订单中'
          })
          for(let i = 0; i < this.data.orderItems.length; i++){
            wx.cloud.callFunction({
              name: 'UpdateBookStatus',
              data: {
                operation: 'buy',
                bookInfo: this.data.orderItems[i],
                buyerId: getApp().data.OPENID,
              },
              success: (res) => {
                wx.hideLoading()
                wx.showToast({
                  title: '提交订单成功',
                  icon: 'none'
                })
                wx.navigateBack({
                  delta: 1
                })
              },
              fail: (res) => {
                wx.hideLoading()
                wx.showToast({
                  title: '提交订单失败',
                  icon: 'none'
                })
              }
            })
          }
        }
      }
    })
  }
})








