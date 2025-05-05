const db = wx.cloud.database()
const _ = db.command

Page({

  data: {
    list: [] // 收藏的商品列表
  },

  onShow() {
    wx.showLoading({
      title: '加载中',
    })
    this.loadFavorites();
  },

  loadFavorites() {
    const that = this
    const checkOpenId = setInterval(() => {
      if (getApp().data.OPENID) {
        clearInterval(checkOpenId);
        db.collection('users').doc(getApp().data.OPENID).get({
          success(res) {
            db.collection('bookList').where({
              _id: _.in(res.data.favorite)
            }).get({
              success(res) {
                that.setData({
                  list: res.data
                })
                wx.hideLoading()
              }
            })
          }
        })
      }
    }, 100);
  },

  removeFavorite(e) {
    const index = e.currentTarget.dataset.index;
    const favorites = this.data.favorite;
    favorites.splice(index, 1);
    this.setData({
      favorite: favorites
    });
    wx.showToast({
      title: '已移除收藏',
      icon: 'success'
    });
  }
})