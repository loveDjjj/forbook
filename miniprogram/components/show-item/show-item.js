Component({
  properties: {
    books: {
      type: Array,
      value: []
    }
  },

  methods: {
    GoDetailPage(e) {
      wx.setStorageSync('bookInfo', e.currentTarget.dataset.r)
      wx.navigateTo({
        url: `/pages/index/book_details/book_details`,
      });
    }
  }
})