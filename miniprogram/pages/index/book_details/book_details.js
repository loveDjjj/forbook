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
  },

  // 跳转到AI页面
  navigateToAI: function() {
    // 准备要传递的书籍信息
    const bookInfo = {
      book_name: this.data.bookInfo.book_name,
      book_author: this.data.bookInfo.book_author,
      book_isbn: this.data.bookInfo.book_isbn,
      book_edition: this.data.bookInfo.book_edition,
      book_price: this.data.bookInfo.book_price,
      course: this.data.bookInfo.course,
      course_id: this.data.bookInfo.course_id,
      college: this.data.bookInfo.college,
      course_kind: this.data.bookInfo.course_kind,
      zy: this.data.bookInfo.zy
    };
    
    wx.navigateTo({
      url: '/pages/index/book_details/AI/AI',
      events: {
        // 为页面监听acceptDataFromOpenerPage事件
        acceptDataFromOpenerPage: function(data) {
          console.log('接收到页面数据', data);
        }
      },
      success: function(res) {
        // 通过eventChannel向被打开页面传送数据
        res.eventChannel.emit('acceptDataFromOpenerPage', { bookInfo: bookInfo });
        console.log('跳转到AI页面成功，已传递书籍信息');
      },
      fail: function(error) {
        console.error('跳转到AI页面失败:', error);
        wx.showToast({
          title: '跳转失败，请重试',
          icon: 'none'
        });
      }
    });
  },
})