const db = wx.cloud.database();
const _ = db.command

Page({
  data: {
    selectedTab: 0, // 当前选中的标签
    allList: [], // 全部列表
    waitSend: [], // 待发货列表
    waitReceive: [], // 待收货列表
    waitSettle: [], // 待结算列表
    canceling: [], // 退款中列表
    selling: [], // 已退款列表
    buyorsell:0,
    list:[],
    //状态
    //selling:在售 *****已售出 waitPickup:待取件 waitIn:待入库 in:在库
    list0: ['在售','已售出','待取件','待入库','在库'],
    //allList,waitSend,waitReceive,received(待结算),canceling,ok(订单完成)
    list1 :['全部','待发货','待收货','待结算','退款中'],
    //Refund:已退款
    list2 :['全部','待发货','待收货','退款中'],
  },


  onLoad() {
    this.setData({
      buyorsell: wx.getStorageSync('index') // 1卖 2买
    });
    console.log(this.data.buyorsell)
    this.setData({
      list: this.data.buyorsell == 2 ? this.data.list2 : this.data.buyorsell == 1 ? this.data.list1 : this.data.list0
    })
    wx.setNavigationBarTitle({
      title: this.data.buyorsell == 2 ? '我买到的' : this.data.buyorsell == 1 ? '我卖出的' : '我发布的'
    })
    this.observeListChanges(); 
  },

  onPullDownRefresh(){
    console.log('onPullDownRefresh')
    this.observeListChanges()
  },
  
  // 切换选项卡函数
  selectTab(e) {
    this.setData({
      selectedTab: e.currentTarget.dataset.tab
    });
  },
  //滑动
  swiperTab(e) {
    this.setData({
      selectedTab: e.detail.current
    });
  },

  async observeListChanges() {
    const ddd = db.collection('users').doc(getApp().data.OPENID).get()
    console.log(ddd)
    db.collection('users').doc(getApp().data.OPENID).get().then(res => {
      if(this.data.buyorsell == 1 || this.data.buyorsell == 2){
        let orderId = this.data.buyorsell == 1 ? res.data.Selling : res.data.Buying;
        let bookListPromises = orderId.map(async item => {
          const orderRes = await db.collection('orderList').doc(item).get();
          const bookId = orderRes.data.bookid; // 获取bookid
          console.log(orderRes.data)
          const bookRes = await db.collection('sellingbook').doc(bookId).get(); // 根据bookid获取书籍信息
          return {
            orderData: orderRes.data,
            bookData: bookRes.data
          };
        });
        let bookList = []
        Promise.all(bookListPromises).then(res => {
          res.forEach(item => {
            item.bookData.status = item.orderData.status
            item.bookData.orderid = item.orderData._id
            bookList.push(item.bookData)
          })
          console.log(bookList)
          this.setList(bookList)
        })
      }else{
        let bookId = res.data.publish
        let bookList = []
        const bookListPromises = bookId.map(async item => {
          const bookRes = await db.collection('sellingbook').doc(item).get();
          return bookRes.data
        })
        Promise.all(bookListPromises).then(res => {
          res.forEach(item => {
            bookList.push(item)
          })
          console.log(bookList)
          this.setList(bookList)
        })
      }
    })
  },

  setList(itemData){
    this.setData({
      allList: itemData || [],
      selling: itemData.filter(item => item.status === 'selling') || [],
      selled: itemData.filter(item => item.status === 'sold') || [],
      waitPickup: itemData.filter(item => item.status === 'waitPickup') || [],
      waitIn: itemData.filter(item => item.status === 'waitIn') || [],
      in: itemData.filter(item => item.status === 'in') || [],
      waitSend: itemData.filter(item => item.status === 'waitSend') || [],
      waitReceive: itemData.filter(item => item.status === 'waitReceive') || [],
      received: itemData.filter(item => item.status === 'received') || [],
      canceling: itemData.filter(item => item.status === 'canceling') || [],
      canceled: itemData.filter(item => item.status === 'Refund') || [],
      ok: itemData.filter(item => item.status === 'ok') || [],
    });
  },

  refresh(){
    console.log('刷新')
    this.observeListChanges()
  }
});