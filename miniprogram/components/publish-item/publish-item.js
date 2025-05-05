Component({
  properties: {
    books: {
      type: Array,
      value: []
    },
    chose: {
      type: String,
      value: '0'
    }
  },
  observers: {
    'books': function (books) {
      if(this.data.chose == '0') {
        wx.setStorageSync('list0', books)
      }
      else if(this.data.chose == '1'){
        wx.setStorageSync('list1', books)
      }
      console.log(this.data.books)
    }
  },
  methods: {
    deleteBook(e) {
      wx.showModal({
        title: '提示',
        content: '确定要删除吗？',
        success: (res) => {
          if (res.confirm) {
            const index = e.currentTarget.dataset.index
            const books = this.data.books
            books.splice(index, 1)
            this.setData({
              books: books
            })
            this.triggerEvent('deleteBook', {books: books})
          }
        }
      })
    }
  }
})