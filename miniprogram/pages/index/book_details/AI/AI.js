// pages/index/AI/AI.js
Page({

  /**
   * 页面的初始数据
   */
    data: {
      chatMode: "bot", // bot 表示使用agent，model 表示使用大模型
      showBotAvatar: true, // 是否在对话框左侧显示头像
      agentConfig: {
        botId: "bot-267249e6", // agent id,
        allowWebSearch: true, // 允许客户端选择启用联网搜索
        allowUploadFile: true, // 允许上传文件
        allowPullRefresh: true, // 允许下拉刷新
        allowUploadImage: true,// 允许上传图片
        showToolCallDetail: true, // 是否展示工具调用细节
        allowMultiConversation: true, // 是否展示会话列表，创建会话按钮
      },
      bookInfo: null, // 存储书籍信息
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function(options) {
      // 获取书籍信息
      const eventChannel = this.getOpenerEventChannel();
      eventChannel.on('acceptDataFromOpenerPage', (data) => {
        console.log('接收到的书籍信息:', data.bookInfo);
        this.setData({
          bookInfo: data.bookInfo
        });
        
        // 将书籍信息传递给agent-ui组件
        const agentUI = this.selectComponent('#agent-ui');
        if (agentUI) {
          agentUI.setBookInfo(this.data.bookInfo);
        }
      });
    }
})