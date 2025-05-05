const db = wx.cloud.database()
const _ = db.command

Component({
  properties: {
    list: {
      type: Array,
      value: []
    },
    buyorsell:{
      type: Number,
      value: 0
    },
    className: String,
    style: String
  },
  data:{
    sellerInfo:{}
  },
  methods: {
    confirmSend(e) {
      console.log('确认发货', e.currentTarget.dataset.item);
      wx.showModal({
        title: '确认发货',
        content: '确认发货后，订单状态将变为待收货',
        success: res => {
          if (res.confirm) {
            wx.showLoading({
              title: '确认发货中',
              mask: true
            })
            wx.cloud.callFunction({
              name: 'UpdateBookStatus',
              data: {
                operation: 'confirmSend',
                orderId: e.currentTarget.dataset.item.orderid
              },
              success: res => {
                this.triggerEvent('refresh')
                wx.hideLoading()
                wx.showToast({
                  title: '确认发货成功',
                  icon: 'success',
                  duration: 2000
                })
              }
            })
          }
        }
      })
    },
    confirmReceive(e) {
      console.log('确认收货', e.currentTarget.dataset.item);
      wx.showModal({
        title: '确认收货',
        content: '确认收货后，订单状态将变为已收货',
        success: res => {
          if (res.confirm) {
            wx.showLoading({
              title: '确认收货中',
              mask: true
            })
            wx.cloud.callFunction({
              name: 'UpdateBookStatus',
              data: {
                operation: 'confirmReceive',
                orderId: e.currentTarget.dataset.item.orderid
              },
              success: res => {
                this.triggerEvent('refresh')
                wx.showToast({
                  title: '确认收货成功',
                  icon: 'success',
                  duration: 2000
                })
              }
            })
          }
        }
      })
    },
    askCancel(e) {
      console.log('申请退款', e.currentTarget.dataset.item);
      wx.showModal({
        title: '申请退款',
        content: '申请退款后，订单状态将变为退款中',
        success: res => {
          if (res.confirm) {
            wx.showLoading({
              title: '申请退款中',
              mask: true
            })
            wx.cloud.callFunction({
              name: 'UpdateBookStatus',
              data: {
                operation: 'askCancel',
                orderId: e.currentTarget.dataset.item.orderid
              },
              success: res => {
                this.triggerEvent('refresh')
                wx.hideLoading()
                wx.showToast({
                  title: '申请退款成功',
                  icon: 'success',
                  duration: 2000
                })
              }
            })
          }
        }
      })
    },
    confirmCancel(e) {
      console.log('确认退款', e.currentTarget.dataset.item);
      wx.showModal({
        title: '确认退款',
        content: '确认退款后，订单状态将变为已退款',
        success: res => {
          if (res.confirm) {
            wx.showLoading({
              title: '确认退款中',
              mask: true
            })
            wx.cloud.callFunction({
              name: 'UpdateBookStatus',
              data: {
                operation: 'confirmCancel',
                orderId: e.currentTarget.dataset.item.orderid
              },
              success: res => {
                this.triggerEvent('refresh')
                wx.hideLoading()
                wx.showToast({
                  title: '确认退款成功',
                  icon: 'success',
                  duration: 2000
                })
              }
            })
          }
        }
      })
    },
    buyAgain(e) {
      console.log('再次购买', e.currentTarget.dataset.item);
      wx.showModal({
        title: '再次购买',
        content: '再次购买后，订单状态将变为待发货',
        success: res => {
          if (res.confirm) {
            wx.showLoading({
              title: '再次购买中',
              mask: true
            })
            wx.cloud.callFunction({
              name: 'UpdateBookStatus',
              data: {
                operation: 'buy',
                orderId: e.currentTarget.dataset.item.orderid
              },
              success: res => {
                this.triggerEvent('refresh')
                wx.hideLoading()
                wx.showToast({
                  title: '再次购买成功',
                  icon: 'success',
                  duration: 2000
                })
              }
            })
          }
        }
      })
    },
    async goToChat(e){
      console.log('跳转到聊天页面',e.currentTarget.dataset.item);
      const temp = await db.collection('messages').where({
        $or: [
          {from: getApp().data.OPENID,to: e.currentTarget.dataset.item.sellerid},
          {from: e.currentTarget.dataset.item.sellerid,to: getApp().data.OPENID}
        ]
      }).get()
      if(temp.data.length == 0){
        await db.collection('messages').add({
          data: {
            from: getApp().data.OPENID,
            to: e.currentTarget.dataset.item.sellerid,
            messages: [],
            itemid: e.currentTarget.dataset.item._id,
            createTime: new Date().getTime()
          }
        })
      }

      wx.navigateTo({
        url: `/pages/chat/message/message?userId=${e.currentTarget.dataset.item.sellerid}`
      })
    }
  }
})