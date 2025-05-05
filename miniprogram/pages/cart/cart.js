const db = wx.cloud.database();
const _ = db.command

Page({
  data: {
    chose_option: [],
    watchers: [],
  },
  onLoad() {
    wx.showLoading({
      title: '加载中',
    })
    const checkOpenId = setInterval(() => {
      if (getApp().data.OPENID) {
        clearInterval(checkOpenId);
        this.watchUserCart();
      }
    }, 100);
    wx.hideLoading()
  },

  goToDetail(e) {
    const index = e.currentTarget.dataset.index
    const bookInfo = this.data.chose_option[index]
    console.log(bookInfo)
    wx.setStorageSync('bookInfo', bookInfo)
    wx.navigateTo({
      url: `/pages/index/book_details/book_details`,
    });
  },

  async watchUserCart() {
    db.collection('users').doc(getApp().data.OPENID).watch({
      onChange: snapshot => {
        db.collection('bookList').where({
          _id: _.in(snapshot.docs[0].cart)
        }).get().then(res => {
          this.setData({
            chose_option: res.data
          })
        })
      },
      onError: err => {
        console.error('监听用户购物车数据变化失败：', err);
      }
    });
  },

})