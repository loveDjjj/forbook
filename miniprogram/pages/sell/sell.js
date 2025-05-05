const db = wx.cloud.database();
const _ = db.command;
var utils = require('../../utils/throttle');

Page({
  // 页面的初始数据
  data: {
    chose: '0',
    list0: [],
    list1: [],
    submitList: [],
    showIsbnInput: false,
    isbn: '',
    showBookInfo: [],
    uploadedImages: [],
    price: '',
    selectedAddress: [],
    selectedIndex: -1,
    addressList: [],
  },

  async onLoad() {
    this.setData({
      list0: wx.getStorageSync('list0') || [],
      list1: wx.getStorageSync('list1') || []
    })
  },

  async onShow() {
    // 等待OPENID加载完成
    if (!getApp().data.OPENID) {
      wx.showLoading({
        title: '加载中',
      });
      await new Promise(resolve => {
        const checkOpenID = setInterval(() => {
          if (getApp().data.OPENID) {
            clearInterval(checkOpenID);
            wx.hideLoading();
            resolve();
          }
        }, 100);
      });
    }
    db.collection('users').doc(getApp().data.OPENID).watch({
      onChange: (res) => {
        this.setData({
          addressList: res.docs[0].address,
          selectedAddress: res.docs[0].address.map(item => {
            return item.nickname + ' - ' + item.address + ' - ' + item.phone
          }),
          selectedIndex: res.docs[0].address.length - 1
        })
      },
      onError: (err) => {
        console.log(err)
      }
    })
  },

  selectAddress(e) {
    console.log(e)
    this.setData({
      selectedIndex: e.detail.value
    })
  },

  chose(e) {
    this.setData({
      chose: e.currentTarget.dataset.chose
    })
  },

  swiperTab(e) {
    this.setData({
      chose: e.detail.current
    })
  },

  showIsbnInput(e) {
    this.setData({
      showIsbnInput: true
    });
  },


  inputISBN(e) {
    this.setData({
      isbn: e.detail.value
    });
    if(this.data.isbn.length === 13) {
      db.collection('bookList').where({
        book_isbn: this.data.isbn
      }).get().then(res => {
        if(res.data.length === 0) {
          wx.showToast({
            title: '未找到该书',
            icon: 'none'
          });
          return;
        }
        res.data[0].image_url = [res.data[0].image_url]
        this.setData({
          showBookInfo: res.data
        });
      });
    }
  },

  onCancel() {
    this.setData({
      showIsbnInput: false
      
    });
  },

  onSubmit(e) {
    if(this.data.showBookInfo.length === 0) {
      wx.showToast({
        title: '未找到该书',
        icon: 'none'
      });
      return;
    }
    if(this.data.chose == '1' && this.data.price == '') {
      wx.showToast({
        title: '请输入价格',
        icon: 'none'
      });
      return;
    }
    wx.showLoading({
      title: '上传中',
    })
    const book = this.data.showBookInfo.map(item => {
      return {
        _id: `${getApp().data.OPENID}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        book_isbn: item.book_isbn,
        book_name: item.book_name,
        book_author: item.book_author,
        book_price: item.book_price || 0,
        image_url: item.image_url,
        sellerid: getApp().data.OPENID,
        needPlatformHosting: this.data.chose == '0' ? true : false,
        status: 'selling'
      }
    })
    if(this.data.chose == '0') {
      book[0].status = 'waitPickup'
      this.data.list0.push(book[0])
      wx.hideLoading()
      this.setData({
        list0: this.data.list0
      })
    } else {
      book[0].book_price = this.data.price
      if(this.data.uploadedImages.length > 0) {
        var uploadPromises = this.data.uploadedImages.map(item => {
          return wx.cloud.uploadFile({
            cloudPath: `SellBooks/${getApp().data.OPENID}_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`,
            filePath: item,
          }).then(res => res.fileID).catch(err => {
            console.log(err);
            return null; // 返回 null 以便后续处理
          });
        });
        Promise.all(uploadPromises).then(res => {
          book[0].image_url = res
          this.data.list1.push(book[0])
          wx.hideLoading()
          this.setData({
            list1: this.data.list1
          })
        });
      } else {
        this.data.list1.push(book[0])
        wx.hideLoading()
        this.setData({
          list1: this.data.list1
        })
      }
    }
    this.setData({
      showIsbnInput: false,
      isbn: '',
      showBookInfo: [],
      price: '',
      uploadedImages: []
    });
  },

  scanISBN() {
    wx.scanCode({
      success: (res) => {
        this.setData({
          showIsbnInput: true,
        });
        this.inputISBN({
          detail: {
            value: res.result
          }
        });
      }
    })
  },

  async SubmitAll() {
    if(this.data.selectedIndex == -1) {
      wx.showToast({
        title: '请选择地址',
        icon: 'error'
      });
      return;
    }
    if(this.data.list0.length === 0 && this.data.list1.length === 0) {
      wx.showToast({
        title: '请先添加书籍',
        icon: 'error'
      });
      return;
    }
    wx.showModal({
      title: '确认提交',
      content: '确认提交所有书籍吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '提交中',
          })
          let list0 = this.data.list0
          let list1 = this.data.list1
          list0 = list0.map(item => {
            item.address = this.data.addressList[this.data.selectedIndex]
            return item
          })
          this.data.submitList = list0.concat(list1)
          console.log(this.data.submitList)
          wx.cloud.callFunction({
            name: 'AddSellingBook',
            data: {
              bookdata: this.data.submitList,
              openid: getApp().data.OPENID
            }
          }).then(res => {
            wx.hideLoading();
            wx.showToast({
              title: '提交成功',
              icon: 'success'
            });
            this.setData({
              list0: [],
              list1: [],
              submitList: []
            });
            wx.setStorageSync('list0', [])
            wx.setStorageSync('list1', [])
          })
        }
      }
    });
  },

  deleteBook(e) {
    if(this.data.chose == '0') {
      this.setData({
        list0: e.detail.books
      })
    } else {
      this.setData({
        list1: e.detail.books
      })
    }
  },

  inputPrice(e) {
    this.setData({
      price: e.detail.value
    })
  },

  chooseImage() {
    wx.chooseImage({
      count: 9,
      success: (res) => {
        this.setData({
          uploadedImages: this.data.uploadedImages.concat(res.tempFilePaths)
        });
      }
    });
  },

  handleAddressClick() {
    if (this.data.addressList.length === 0) {
      // 如果地址列表为空，直接跳转到地址页面
      wx.navigateTo({
        url: '/pages/user/address/address'
      });
    } else {
      // 如果有地址，则显示地址选择器
      wx.showActionSheet({
        itemList: this.data.selectedAddress,
        success: (res) => {
          this.selectAddress({
            detail: {
              value: res.tapIndex
            }
          });
        }
      });
    }
  },
})

