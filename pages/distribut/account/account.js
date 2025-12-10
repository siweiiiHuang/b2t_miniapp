//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    currentTab1: 0,
    currentTab2: 0
  },
  //事件处理函数
  clickTab1: function (e) {
    var that = this;
    if (this.data.currentTab1 === e.target.dataset.current) {
      return false;
    } else {
      that.setData({
        currentTab1: e.target.dataset.current,
      })
    }
  },
  clickTab2: function (e) {
    var that = this;
    if (this.data.currentTab2 === e.target.dataset.current) {
      return false;
    } else {
      that.setData({
        currentTab2: e.target.dataset.current,
      })
    }
  }
})
