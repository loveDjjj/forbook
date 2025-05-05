wx.cloud.init({
  appid: 'your appid,
  env: "your env",
})
const db = wx.cloud.database();
const _ = db.command

App({
  data: {
    OPENID: '',
  },

  async onLaunch() {
    this.InitialUser()
  },
  onLaunch: function () {
    wx.cloud.init({
      env: "your env",
    });
  },

  async InitialUser() {
    await wx.cloud.callFunction({
      name: 'UserId',
      complete: res => {
        this.data.OPENID = res.result.OPENID
        console.log(res.result)
      }
    })
  },

  uuid  () {
    function S4() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
  }
});
