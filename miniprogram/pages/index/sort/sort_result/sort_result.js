const db = wx.cloud.database();
const _ = db.command;

Page({
  data: {
    booklist: [],
  },
  onLoad: function(e) {
    const courseList = wx.getStorageSync('courseList')
    db.collection('bookList').where({
      book_isbn: _.in(courseList.map(item => item.book_isbn))
    }).get().then(res => {
      this.setData({
        booklist: res.data
      });
    });
  },

  /**
   * 跳转到图书详情页
   */
  goToBookDetail(e) {
    const item = e.currentTarget.dataset.item;
    wx.setStorageSync('bookInfo', item)
    wx.navigateTo({
      url: `/pages/index/book_details/book_details`
    });
  }
});