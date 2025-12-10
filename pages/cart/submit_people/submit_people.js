// pages/cart/invoice/invoice.js
var app = getApp();
var request = app.request;
var common = require('../../../utils/common.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
     name:'',
      mobile:'',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      var datas = JSON.parse(options.datas);
      options.datas && this.setData({ name: datas.consignee, mobile: datas.mobile})
  },
    inputName: function (e) {     
        this.setData({ name: e.detail.value})
    },
    inputMobile: function (e) {
        this.setData({ mobile: e.detail.value })
    },
  submit:function(){
      let name = this.data.name, mobile = this.data.mobile
      if (!name) {
          app.showTextWarining('请输入提货人');
          return false;
      }

      if (!app.validatemobile(mobile)) {
          return;
      }
 
        let pages = getCurrentPages();//当前页面
        let prevPage = pages[pages.length - 2];//上一页面
        //直接给上移页面赋值 
        prevPage.setData({
            is_set:true,
            name: name ,
            mobile: mobile   
        });

        wx.navigateBack({
            delta:1
        })            
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})