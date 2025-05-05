// pages/index/sort/sort.js
const db = wx.cloud.database();
const _ = db.command;

Page({
  data: { 
    schools:  ['湖南大学','中南大学','中南大学','中南大学','中南大学','中南大学','中南大学','中南大学','中南大学','中南大学','中南大学','中南大学','中南大学','中南大学'],
    colleges: [],
    majors: [],
    books: []
  },
  onLoad() {
    this.setData({
      currentSchool: 0,
      currentCollege: -1,
      currentMajor: -1
    })
    this.loadColleges();
  },

  // 选择学校
  selectSchool(e) {
    wx.showLoading({
      title: '加载中',
    });
    const index = parseInt(e.currentTarget.dataset.index);
    console.log(index);
    this.setData({
      currentSchool: index,
      currentCollege: -1,
      currentMajor: -1,
      colleges: [],
      majors: []
    });
    this.loadColleges().then(() => {
      wx.hideLoading();
    });
  },

  // 选择院系
  async selectCollege(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({
      currentCollege: index,
      currentCollegeName: this.data.colleges[index].name,
      currentMajor: -1,
      majors: this.data.colleges[index].zy_list.map(item => item.zy_name)
    });
  },

  // 加载院系数据
  async loadColleges() {
    try {
      const res = await db.collection('collegeList').where({}).get();
      const collegesList = res.data.map(item => ({
        name: item.college,
        zy_list: item.zy_list || []
      }));

      this.setData({
        colleges: collegesList
      });
    } catch (error) {
      console.error('加载院系数据失败：', error);
    }
  },

  selectMajor(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    const list = this.data.colleges[this.data.currentCollege].zy_list[index].course_list.filter(item => item.time === e.currentTarget.dataset.grade);

    wx.setStorageSync('courseList', list)
    wx.navigateTo({
      url: `./sort_result/sort_result`
    });
  }
})