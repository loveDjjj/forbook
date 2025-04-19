const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    searchKeyword: '',
    hotSearchList: []
  },

  onLoad() {
    db.collection('others').doc('hotSearchList').get().then(res => {
      this.setData({
        hotSearchList: res.data.hotSearchList,
        searchKeyword: wx.getStorageSync('isbn')
      })
    })
    wx.clearStorageSync('isbn')
  },

  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  GoSortPage() {
    wx.navigateTo({
      url: '/pages/index/sort/sort'
    })
  },

  GoSearchResultPage(e) {
    if (e.currentTarget.dataset.keyword) {
      this.setData({
        searchKeyword: e.currentTarget.dataset.keyword
      })
    }
    const keyword = this.data.searchKeyword
    if (!keyword) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      })
      return
    }
    wx.setStorageSync('Keyword', keyword)
    wx.navigateTo({
      url: `./search_result/search_result`
    })
  }
})