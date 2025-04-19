// pages/chat/chat.js
const db = wx.cloud.database();

Page({
  data: {
    chatList: [],
  },

  async onLoad() {
    try {
      wx.showLoading({ title: '加载中' });
      const checkOpenId = setInterval(() => {
        if (getApp().data.OPENID) {
          clearInterval(checkOpenId);
          this.startMessageWatcher();
        }
      }, 100);
    } catch (error) {
      console.error('onLoad 发生错误：', error);
    } finally {
    }
  },

  async loadChatList() {
    try {
      const res = await db.collection('messages').where({
        $or: [
          { from: getApp().data.OPENID },
          { to: getApp().data.OPENID }
        ]
      }).get()
      const otherUserIds = [...new Set(res.data.map(msg => 
        msg.from === getApp().data.OPENID ? msg.to : msg.from
      ))];
      
      const userPromises = otherUserIds.map(userId => {
        return db.collection('users').doc(userId).get();
      });
      const results = await Promise.all(userPromises);
      
      let chatList = [];

      for (const res of results) {
        const latestMessage = await db.collection('messages')
          .where({
            $or: [
              { from: getApp().data.OPENID, to: res.data._id },
              { to: getApp().data.OPENID, from: res.data._id }
            ]
          })
          .get();

        // 获取最新的消息
        let lastMsg = {};
        if (latestMessage.data.length > 0) {
          const messages = latestMessage.data[0].messages || [];
          lastMsg = messages[messages.length - 1] || {};
        }

        const imagePath = await this.downloadImage('cloud://tx-5gi1emj7c6a1ff3f.7478-tx-5gi1emj7c6a1ff3f-1317385835/avatarUrl/' + res.data._id + '.png');
        const hasUnread = await this.checkUnreadMessages(res.data._id);

        
        chatList.push({
          userId: res.data._id,
          userName: res.data.UserName || '未设置昵称',
          image: imagePath,
          hasUnread: hasUnread,
          lastMessage: lastMsg.type === 'image' ? '[图片]' : (lastMsg.content || '暂无消息'),
          lastMessageTime: this.formatTime(lastMsg && lastMsg.createTime),
          rawTime: lastMsg.createTime // 添加原始时间戳用于排序
        });
        
      }
      console.log('chatList', chatList)
      // 按最后消息时间排序
      chatList.sort((a, b) => {
        const timeA = a.rawTime || 0; // 如果没有时间则默认为0
        const timeB = b.rawTime || 0;
        return timeB - timeA;
      });
      
      this.setData({
        chatList: chatList
      });
    } catch (error) {
      console.error('加载聊天列表失败：', error);
    }
  },

  async downloadImage(fileID) {
    try {
      const res = await wx.cloud.downloadFile({
        fileID: fileID
      })
      return res.tempFilePath
    } catch (error) {
      return "../../images/avatar.png"
    }
  },

  // 启动消息监听器
  async startMessageWatcher() {
    return new Promise((resolve, reject) => {
      try {
        // 监听整个 messages 集合的变化
        const watcher = db.collection('messages')
          .where({
            $or: [
              { from: getApp().data.OPENID },
              { to: getApp().data.OPENID }
            ]
          })
          .watch({
            onChange: async snapshot => {
              console.log('chat监听器收到更新', snapshot);
              
              // 检查是否有新消息
              if (snapshot.type !== 'init' && snapshot.docChanges.length > 0) {
                const changes = snapshot.docChanges;
                for (const change of changes) {
                  if (change.dataType === 'update' || change.dataType === 'add') {
                    // 立即更新聊天列表
                    const userId = change.doc.from === getApp().data.OPENID ? change.doc.to : change.doc.from;
                    await this.loadChatList();
                    
                    // 获取最后阅读时间并转换为时间戳
                    const lastReadTime = new Date(wx.getStorageSync(`${userId}_lastReadTime`)).getTime();
                    const messageTime = new Date(change.doc.messages[change.doc.messages.length - 1].createTime).getTime();
                    
                    console.log('lastReadTime:', lastReadTime);
                    console.log('messageTime:', messageTime);
                    
                    // 使用时间戳进行比较
                    if (lastReadTime < messageTime && change.doc.messages[change.doc.messages.length - 1].from === userId) {
                      console.log('收到新消息');
                      wx.showToast({
                        title: '收到新消息',
                        icon: 'none', 
                        duration: 2000
                      });
                    }
                    break; // 有任何更新就刷新一次即可
                  }
                }
              }
            },
            onError: err => {
              console.error('监听器错误:', err);
              reject(err);
            }
          });

        this.messageWatcher = watcher;
        // 初始加载
        this.loadChatList().then(() => {
          resolve();
          wx.hideLoading();
        });
      } catch (error) {
        console.error('启动消息监听器失败：', error);
        reject(error);
      }
    });
  },


  // 跳转到聊天页面
  gotoMessage(e) {
    const userId = e.currentTarget.dataset.userid;
    // 更新最后阅读时间
    wx.setStorageSync(`lastRead_${userId}`, Date.now());
    // 更新未读状态
    const chatList = this.data.chatList;
    const index = chatList.findIndex(item => item.userId === userId);
    if (index !== -1) {
      chatList[index].hasUnread = false;
      this.setData({ chatList });
    }
    wx.navigateTo({
      url: `message/message?userId=${userId}`
    });
    
  },

  // 页面卸载时关闭监听器
  onUnload() {
    if (this.messageWatcher) {
      this.messageWatcher.close();
    }
  },

  async checkUnreadMessages(userId) {
    try {
      const res = await db.collection('messages')
        .where({
          $or: [
            { to: getApp().data.OPENID, from: userId },
            { from: getApp().data.OPENID, to: userId }
          ]
        })
        .orderBy('messages.createTime', 'desc')
        .get();

      if (res.data.length === 0) return false;
      
      const messages = res.data[0].messages;
      let lastMessage = '';
      if(messages.length == 0) {
        lastMessage = '没有消息'
      }else{
        lastMessage = messages[messages.length - 1];
      }
      const lastReadTime = wx.getStorageSync(`lastRead_${userId}`) || 0;
      // 只有接收到的消息才标记为未读
      return lastMessage.from === userId && lastMessage.createTime > lastReadTime;
    } catch (error) {
      console.error('检查未读消息失败:', error);
      return false;
    }
  },

  // 复制电话号码
  copyPhone(e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.phone,
      success: () => {
        wx.showToast({
          title: '电话号码已复制',
          icon: 'none'
        });
      }
    });
  },

  // 添加时间格式化函数
  formatTime(timestamp) {
    console.log('timestamp', timestamp)
    if (timestamp == undefined) return ' ';
    
    const now = new Date();
    const msgTime = new Date(timestamp);
    const diff = now - msgTime;

    // 小于1分钟
    if (diff < 60000) {
      return '刚刚';
    }
    // 小于1小时
    if (diff < 3600000) {
      return Math.floor(diff / 60000) + '分钟前';
    }
    // 小于24小时
    if (diff < 86400000) {
      return Math.floor(diff / 3600000) + '小时前';
    }
    // 大于24小时
    return `${msgTime.getMonth() + 1}月${msgTime.getDate()}日`;
  },

  // 添加 onShow 生命周期函数
  onShow() {
    this.loadChatList();
  },

  // 添加下拉刷新方法
  async onPullDownRefresh() {
    try {
      wx.showNavigationBarLoading(); // 显示导航栏加载动画
      await this.loadChatList(); // 重新加载聊天列表
      wx.hideNavigationBarLoading(); // 隐藏导航栏加载动画
      wx.stopPullDownRefresh(); // 停止下拉刷新动画
    } catch (error) {
      console.error('下拉刷新失败：', error);
      wx.hideNavigationBarLoading();
      wx.stopPullDownRefresh();
    }
  },

});