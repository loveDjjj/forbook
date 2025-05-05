const db = wx.cloud.database();
const _ = db.command;
var utils = require('../../../utils/throttle.js');

Page({
  data: {
    messages: [],
    itemid: '',
    item: {},
    inputValue: '',
    userId: '',
    myId: '',
    hidden: false,
    showToolbox: false,
    watcher: null
  },

  onLoad(options) {
    const userId = options.userId;
    this.setData({
      userId: userId,
      myId: getApp().data.OPENID
    });
    wx.setStorageSync(`${userId}_lastReadTime`, new Date());
    this.updateLastReadTime();
    this.initMessageWatcher();
    this.setTitle(userId);
  },

  setTitle(userId) {
    db.collection('users').doc(userId).get().then(res => {
      const UserName = res.data.UserName;
      wx.setNavigationBarTitle({
        title: UserName||'暂无昵称'
      });
    });
  },

  onShow() {
    this.updateLastReadTime();
  },  

  updateLastReadTime() {
    const key = `lastRead_${this.data.userId}`;
    const timestamp = new Date();
    wx.setStorageSync(key, timestamp);
  },

  initMessageWatcher() {
    const watcher = db.collection('messages').where({
      $or: [
        {
          from: this.data.myId,
          to: this.data.userId
        },
        {
          from: this.data.userId,
          to: this.data.myId
        }
      ]
    }).watch({
      onChange: (snapshot) => {
        console.log('messages监听器收到更新', snapshot);
        this.updateLastReadTime();
        if (snapshot.type === 'init') {
          this.setData({
            messages: snapshot.docs[0].messages || [],
            itemid: snapshot.docs[0].itemid
          },()=>{
            this.initItemWatcher();
            this.scrollToBottom();
          })
        } else {
          if (snapshot.docs.length > 0) {
            this.setData({
              messages: snapshot.docs[0].messages || [],
              itemid: snapshot.docs[0].itemid
            });
            this.scrollToBottom();
          }
        }
      },
      onError: (err) => {
        console.error('监听错误', err);
      }
    });

    this.setData({ watcher });
  },


  initItemWatcher() {
    const itemWatcher = db.collection('sellingbook').doc(this.data.itemid)
    .watch({
      onChange: (snapshot) => {
        console.log('item监听器收到更新', snapshot);
        if (snapshot.type === 'init') {
          this.setData({
            item: snapshot.docs[0] || {}
          });
        } else {
          if (snapshot.docs.length > 0) {
            this.setData({
              item: snapshot.docs[0] || {}
            });
          }
        }
      },
      onError: (err) => {
        console.error('监听错误', err);
      }
    });

    this.setData({ itemWatcher });
  },

  onUnload() {
    wx.setStorageSync(`${this.data.userId}_lastReadTime`, new Date());
    if (this.data.watcher) {
      this.data.watcher.close();
    }
  },

  onInputChange(e) {
    this.updateLastReadTime();
    this.setData({
      inputValue: e.detail.value
    });
  },

  sendMessage: utils.throttle(async function() {
    if (!this.data.inputValue.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }
    const message = {
      from: this.data.myId,
      content: this.data.inputValue,
      createTime: new Date()
    };
    const newMessages = [...this.data.messages, message]
    await db.collection('messages').where({
      $or: [
        {
          from: this.data.myId,
          to: this.data.userId
        },
        {
          from: this.data.userId,
          to: this.data.myId
        }
      ]
    }).update({
      data: {
        messages: newMessages
      }
    })
    // 更新本地消息列表
    this.setData({
      inputValue: ''
    });
    this.scrollToBottom(); 
  }, 1500),

  scrollToBottom() {
    const query = wx.createSelectorQuery();
    query.select('#message-list')
      .node()
      .exec((res) => {
        const scrollView = res[0].node;
        scrollView.scrollTo({
          behavior: 'smooth',
          top: 999999
        });
      });
  },

  async deleteItem() {
    this.setData({
      hidden: true
    });
  },

  toggleToolbox() {
    this.setData({
      showToolbox: !this.data.showToolbox
    });
  },

  chooseImage: utils.throttle(async function(e) {
    const source = e.currentTarget.dataset.source;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: [source],
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        
        // 上传图片到云存储
        const cloudPath = 'chat_images/' + new Date().getTime() + '.jpg';
        
        wx.showLoading({ title: '发送中...' });
        
        try {
          const uploadRes = await wx.cloud.uploadFile({
            cloudPath: cloudPath,
            filePath: tempFilePath
          });

          // 发送图片消息
          const message = {
            from: this.data.myId,
            type: 'image',
            content: uploadRes.fileID,
            createTime: new Date()
          };

          // 更新消息列表
          var that = this
          await db.collection('messages').where({
            $or: [
              {
                from: this.data.myId,
                to: this.data.userId
              },
              {
                from: this.data.userId,
                to: this.data.myId
              }
            ]
          }).update({
            data: {
              messages: [...that.data.messages, message]
            }
          })
          this.setData({
            showToolbox: false
          })  
          this.scrollToBottom();
        } catch (error) {
          console.error('发送图片失败:', error);
          wx.showToast({
            title: '发送失败',
            icon: 'none'
          });
        } finally {
          wx.hideLoading();
        }
      }
    });
  }, 2000),

  hideToolbox() {
    this.setData({
      showToolbox: false
    });
  },

  // 添加图片预览方法
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: [url]
    });
  },

  showProductDetail(e) {
    wx.setStorageSync('sellerInfo', this.data.item)
    wx.navigateTo({
      url: `/pages/index/book_details/seller_info/seller_info`
    });
  }
});
