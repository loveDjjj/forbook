const db = wx.cloud.database();
const _ = db.command

Page({
  data: {
    swiperList: [],
    hotBooks: [],
    specialBooks: [],
    searchValue: '',
  },

  async onLoad(e) {
    await this.LoadSwiper();
    await this.LoadHotBooks();
    await this.LoadSpecialBooks();
  },

  handleInput(e) {
    this.setData({
      searchValue: e.detail.value
    })
  },

  async LoadSwiper() {
    await db.collection('swiper').where({}).get().then(res => {
      this.setData({
        swiperList: res.data
      });
    })
  },

  async LoadHotBooks() {
    await db.collection('bookList')
      .orderBy('book_price', 'asc')
      .limit(10)
      .get().then(res => {
        this.setData({
          hotBooks: res.data
        });
      })
  },

  async LoadSpecialBooks() {
    await db.collection('bookList').orderBy('book_price', 'asc').limit(5).get().then(res => {
      console.log(res.data)
      this.setData({
        specialBooks: res.data
      })
    })
    console.log(this.data.specialBooks)
  },

  change(e) {
    const items = this.data.options
    for (let i = 0, len = items.length; i < len; ++i) {
      items[i].checked = items[i].option === e.currentTarget.dataset.s
    }
    this.setData({
      options: items,
      whichkind: e.currentTarget.dataset.s
    })
  },

  GoSortPage() {
    wx.showToast({
      title: '正在开发中',
      icon: 'error'
    })
    return
    wx.navigateTo({
      url: '/pages/index/sort/sort'
    })
  },

  scanIsbn() {
    wx.scanCode({
      scanType: ['barCode'],
      success: (res) => {
        wx.setStorageSync('isbn', res.result)
        wx.navigateTo({
          url: '/pages/index/search/search'
        })
      },
      fail: (err) => {
        wx.showToast({
          title: '扫码失败',
          icon: 'none'
        });
      }
    });
  },

  GoDetailPage(e) {
    wx.setStorageSync('bookInfo', e.currentTarget.dataset.r)
    wx.navigateTo({
      url: `book_details/book_details`,
    });
  },

  GoSearchPage() {
    wx.navigateTo({
      url: '/pages/index/search/search'
    });
  },
})