const db = wx.cloud.database()
const _ = db.command

Page({
  data: {
    showModal: false,
    isEditing: false,
    list: [],
    index: 0,
    nickname: '',
    address: '',
    phone: ''
  },

  onShow() {
    this.loadAddress();
  },

  AddAddress() {
    this.setData({
      showModal: true,
      nickname: '',
      address: '',
      phone: ''
    })
  },

  loadAddress() {
    const that = this
    db.collection('users').doc(getApp().data.OPENID).watch({
      onChange(res) {
        that.setData({
          list: res.docs[0].address
        })
      },
      onError(err) {
        console.log(err)
      }
    })
  },

  addAddress() {
    this.setData({
      showModal: true,
      isEditing: false,
      nickname: '',
      address: '',
      phone: ''
    })
  },

  editAddress(e) {
    this.setData({
      showModal: true,
      isEditing: true,
      nickname: this.data.list[e.currentTarget.dataset.index].nickname,
      address: this.data.list[e.currentTarget.dataset.index].address,
      phone: this.data.list[e.currentTarget.dataset.index].phone,
      index: e.currentTarget.dataset.index
    })
  },

  removeAddress(e) {
    wx.showModal({
      title: '提示',
      content: '确定要删除该地址吗？',
      success: (res) => {
        if (res.confirm) {
          this.data.list.splice(e.currentTarget.dataset.index, 1)
          this.setData({
            list: this.data.list
          })
          db.collection('users').doc(getApp().data.OPENID).update({
            data: {
              address: this.data.list
            }
          })
        }
      }
    })
  },

  confirm() {
    this.setData({
      showModal: false
    })
    var temp = this.data.list
    if (this.data.isEditing) {
      temp[this.data.index].nickname = this.data.nickname
      temp[this.data.index].address = this.data.address
      temp[this.data.index].phone = this.data.phone
      this.setData({
        list: temp
      })
    } else {//增加
      temp.push({
        nickname: this.data.nickname,
        address: this.data.address,
        phone: this.data.phone
      })
      this.setData({
        list: temp
      })
    }
    db.collection('users').doc(getApp().data.OPENID).update({
      data: {
        address: temp
      }
    })
  },

  cancel() {
    this.setData({
      showModal: false,
      nickname: '',
      address: '',
      phone: ''
    })
  }
})