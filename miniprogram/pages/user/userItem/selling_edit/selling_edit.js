const db = wx.cloud.database();
const _ = db.command;
var utils = require('../../../../utils/throttle.js')

Page({
  // 页面的初始数据
  data: {
    help:'',
    bookInfo: null,
    tempImagePath: '', // 临时图片路径
    cloudImagePath: '', // 云端图片路径
    description: '',//书籍描述
    price: '',//售价
    contactInfo: '',//联系方式
    studentId: '', // 学号
    bookConditions: ['全新', '九成新', '八成新', '七成新', '六成新及以下'],
    selectedCondition: '',//书籍成色
    hasNotes: false,//是否附带笔记
    sellerid: '',//卖家id
    sellbookid: '',//书籍id
    isLoading: false, // 添加遮罩状态变量
    needPlatformHosting: false, // 添加平台托管状态
  },

  /**
   * 生命周期函数--监听页面加载
   * 页面加载时根据默认院系加载专业数据
   */
  async onLoad() {
    try {
      await this.load();
    } catch (error) {
      console.error('加载失败:', error);
      wx.showToast({ title: '加载失败', icon: 'error' });
    } finally {
    }
  },

  // 加载详细数据
  async load() {
    wx.showLoading({ title: '加载中' });
    this.setData({ isLoading: true })
    try {
      this.setData({ isLoading: true });
      const sellingbook = wx.getStorageSync('sellingbook');
      console.log(sellingbook)
      // 设置基本信息
      this.setData({
        sellbookid: sellingbook._id,
        bookInfo: sellingbook.bookinfo,
        description: sellingbook.description,
        price: sellingbook.price,
        contactInfo: sellingbook.contactInfo,
        selectedCondition: sellingbook.condition,
        hasNotes: sellingbook.hasNotes,
        studentId: sellingbook.studentId,
        sellerid: sellingbook.sellerid,
        cloudImagePath: sellingbook.image,
        needPlatformHosting: sellingbook.needPlatformHosting || false,
        cloudImagePath: sellingbook.image
      });

      // 下载图片
      await wx.cloud.downloadFile({
        fileID: sellingbook.image,
        success: res => {
          this.setData({ tempImagePath: res.tempFilePath });
        }
      });

      db.collection('others').doc('help').get().then(res=>{
        this.setData({help:res.data.help})
      })
    } catch (error) {
      console.error('加载详细信息失败:', error);
      wx.showToast({ title: '加载失败', icon: 'error' });
    } finally {
      this.setData({ isLoading: false });
      wx.hideLoading();
    }
  },

  Upload() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        const originalSize = res.tempFiles[0].size;
        
        // 压缩图片
        try {
          const compressedImage = await wx.compressImage({
            src: tempFilePath,
            quality: 10 // 压缩质量0-100
          });
          
          // 获取压缩后文件信息
          const compressedFileInfo = await wx.getFileInfo({
            filePath: compressedImage.tempFilePath
          });
          
          console.log('原始大小:', (originalSize / 1024).toFixed(2) + 'KB');
          console.log('压缩后大小:', (compressedFileInfo.size / 1024).toFixed(2) + 'KB');

          this.setData({
            tempImagePath: compressedImage.tempFilePath
          });
        } catch (err) {
          console.error('压缩图片失败:', err);
          wx.showToast({
            title: '图片太大，不要上传原图',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({
          title: '选择图片失败', 
          icon: 'none'
        });
      }
    });
  },

  onDescriptionInput(e) {
    this.setData({
      description: e.detail.value
    })
  },

  onPriceInput(e) {
    this.setData({
      price: e.detail.value
    })
  },

  onContactInfoInput(e) {
    this.setData({
      contactInfo: e.detail.value
    })
  },

  onConditionChange(e) {
    this.setData({
      selectedCondition: this.data.bookConditions[e.detail.value]
    })
  },

  onNotesChange(e) {
    this.setData({
      hasNotes: e.detail.value.length > 0
    })
  },

  onPlatformHostingChange(e) {
    this.setData({
      needPlatformHosting: e.detail.value.length > 0
    })
  },

  onStudentIdInput(e) {
    this.setData({
      studentId: e.detail.value
    })
  },

  showHostingTip() {
    wx.showModal({
      title: '平台托管服务说明',
      content: this.data.help,
      showCancel: false,
      confirmText: '我知道了',
    })
  },

  onSubmit: utils.throttle(async function () {
    try {
      // 1. 表单验证
      if (!this.validateForm()) {
        return;
      }

      this.setData({ isLoading: true });

      // 2. 上传新图片
      wx.showLoading({ title: '上传图片中' });
      const cloudPath = `SellBooks/${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;

      await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: this.data.tempImagePath
      });

      // 3. 删除旧图片
      await wx.cloud.callFunction({
        name: 'DeleteImage',
        data: {
          cloudPath: this.data.cloudImagePath
        }
      }).catch(err => {
        console.warn('删除旧图片失败:', err);
        // 继续执行，不中断流程
      });
      wx.hideLoading()
      wx.showLoading({ title: '更新信息中' });

      // 4. 准备更新数据
      const bookData = {
        sellbookid: this.data.sellbookid,
        image: `cloud://tx-5gi1emj7c6a1ff3f.7478-tx-5gi1emj7c6a1ff3f-1317385835/${cloudPath}`,
        status: 'selling',
        description: this.data.description,
        price: this.data.price,
        contactInfo: this.data.contactInfo,
        condition: this.data.selectedCondition,
        hasNotes: this.data.hasNotes,
        studentId: this.data.studentId,
        needPlatformHosting: this.data.needPlatformHosting
      };

      // 5. 提交更新
      await wx.cloud.callFunction({
        name: 'UpdataSellingBook',
        data: {bookData},
      });

      // 6. 成功处理
      wx.showToast({
        title: '更新成功',
        icon: 'success'
      });
      wx.hideLoading();

      // 7. 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (error) {
      console.error('更新失败:', error);
      wx.showToast({
        title: '更新失败，请重试',
        icon: 'error'
      });
    } finally {
      this.setData({ isLoading: false });
    }
  }, 2000),

  validateForm() {
    if (this.data.departmentIndex === -1) {
      wx.showToast({ title: '请选择院系', icon: 'none' })
      return false
    }
    if (this.data.majorIndex === -1) {
      wx.showToast({ title: '请选择专业', icon: 'none' })
      return false
    }
    if (this.data.bookIndex === -1) {
      wx.showToast({ title: '请选择书籍', icon: 'none' })
      return false
    }
    if (!this.data.tempImagePath) {
      wx.showToast({ title: '请上传图片', icon: 'none' })
      return false
    }
    if (!this.data.selectedCondition) {
      wx.showToast({ title: '请选择书籍成色', icon: 'none' })
      return false
    }
    if (!this.data.description.trim()) {
      wx.showToast({ title: '请填写书籍描述', icon: 'none' })
      return false
    }
    if (!this.data.price) {
      wx.showToast({ title: '请填写售价', icon: 'none' })
      return false
    }
    if (!this.data.contactInfo.trim()) {
      wx.showToast({ title: '请填写联系方式', icon: 'none' })
      return false
    }
    return true
  }
})

