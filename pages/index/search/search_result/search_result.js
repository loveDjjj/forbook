const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    searchKeyword: '',
    sortType: 'comprehensive',
    priceSort: 'none',
    bookList: []
  },

  onLoad(e) {
    this.setData({
      searchKeyword: wx.getStorageSync('Keyword')
    })
    this.searchBooks()
  },

  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  onSortChange(e) {
    const type = e.currentTarget.dataset.type
    if (type === 'price') {
      let priceSort = 'up'
      if (this.data.priceSort === 'up') {
        priceSort = 'down'
      } else if (this.data.priceSort === 'down') {
        priceSort = 'up'
      }
      this.setData({ priceSort })
    } else {
      this.setData({
        priceSort: 'none'
      })
    }
    this.setData({
      sortType: type
    })
    this.searchBooks()
  },

  searchBooks() {
    const keyword = this.data.searchKeyword;
    const nameQuery = db.collection('bookList').where({
      book_name: db.RegExp({
        regexp: keyword,
        options: 'i'
      })
    }).get();

    const isbnQuery = db.collection('bookList').where({
      book_isbn: db.RegExp({
        regexp: keyword,
        options: 'i'
      })
    }).get();

    const authorQuery = db.collection('bookList').where({
      book_author: db.RegExp({
        regexp: keyword,
        options: 'i'
      })
    }).get();

    const courseQuery = db.collection('bookList').where({
      course: db.RegExp({
        regexp: keyword,
        options: 'i'
      })
    }).get();

    Promise.all([nameQuery, isbnQuery, authorQuery, courseQuery]).then(results => {
      // 合并所有查询结果
      const combinedResults = results.reduce((acc, cur) => {
        return acc.concat(cur.data);
      }, []);
      
      // 使用Map根据id去重
      const uniqueMap = new Map();
      combinedResults.forEach(item => {
        if (!uniqueMap.has(item._id)) {
          uniqueMap.set(item._id, item);
        }
      });
      
      // 转换回数组
      const uniqueResults = Array.from(uniqueMap.values());
      
      this.setData({
        bookList: uniqueResults
      });
    });
  },

  GoSortPage() {
    wx.navigateTo({
      url: '/pages/index/sort/sort'
    })
  },
  
  goToBookDetail(e) {
    wx.setStorageSync('bookInfo', e.currentTarget.dataset.item)
    wx.navigateTo({
      url: `/pages/index/book_details/book_details`
    })
  }
})