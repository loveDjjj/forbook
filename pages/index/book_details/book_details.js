const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    bookInfo: null,
    sellingList: [],
    isFavorite: false
  },

  onLoad(e) {
    this.setData({
      bookInfo: wx.getStorageSync('bookInfo')
    })
    console.log(this.data.bookInfo)
    this.getFavoriteAndCart()
    this.getSellingList()
    wx.clearStorageSync('bookInfo')
  },

  onShow() {
    this.getSellingList()
  },

  goBack() {
    wx.navigateBack()
  },

  getFavoriteAndCart() {
    db.collection('users').doc(getApp().data.OPENID).get().then(res => {
      this.setData({
        isFavorite: res.data.favorite.indexOf(this.data.bookInfo._id) !== -1,
        isCart: res.data.cart.indexOf(this.data.bookInfo._id) !== -1
      })
    })
  },

  toggleFavorite() {
    this.setData({
      isFavorite: !this.data.isFavorite
    })
    wx.cloud.callFunction({
      name: 'FavoriteAndCart',
      data: {
        action: 'favorite',
        bookId: this.data.bookInfo._id,
        userId: getApp().data.OPENID
      }
    })
  },

  addToCart() {
    this.setData({
      isCart: !this.data.isCart
    })
    wx.cloud.callFunction({
      name: 'FavoriteAndCart',
      data: {
        action: 'cart',
        bookId: this.data.bookInfo._id,
        userId: getApp().data.OPENID
      }
    })
  },

  goToSellerinfoPage(e) {
    wx.setStorageSync('sellerInfo', e.currentTarget.dataset.item)
    wx.navigateTo({
      url: `/pages/index/book_details/seller_info/seller_info`
    })
  },

  getSellingList: function() {
    const that = this;
    db.collection('bookList').where({
      book_isbn: that.data.bookInfo.book_isbn
    }).get().then(res => {
      let sellingList = res.data[0].Selling
      db.collection('sellingbook').where({
        _id: _.in(sellingList)
      }).get().then(res => {
        that.setData({
          sellingList: res.data.filter(item => item.status === 'selling'||item.status === 'canceled')
        })
        console.log(this.data.sellingList)
      })
    })
  }
})