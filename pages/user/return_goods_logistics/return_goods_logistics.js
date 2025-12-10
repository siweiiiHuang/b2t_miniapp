// pages/cart/invoice/invoice.js
var app = getApp();
var request = app.request;
var common = require('../../../utils/common.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
     id:''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      this.setData({ id:options.id})
  },
  
  formSubmit:function(e){
      var that = this;
      var express_fee = e.detail.value.express_fee;
      var express_name = e.detail.value.express_name;
      var express_sn = e.detail.value.express_sn;
      var express_time = e.detail.value.express_time;
     
         if (!express_name){
              app.confirmBox('请输入快递公司名称');
              return false;
          }
         if (!express_fee) {
              app.confirmBox('请输入快递费用');
              return false;
          }

         if (!express_sn) {
             app.confirmBox('请输入快递单号');
             return false;
         }

         if (!express_time) {
             app.confirmBox('请输入发货时间');
             return false;
         }
      var postData = {
          express_fee: express_fee,
          express_name: express_name,
          express_sn: express_sn,
          express_time: express_time,
          id:that.data.id,
      }

      request.post('/api/order/checkReturnInfo', {
          data: postData,
          success: function (res) {                       
              let pages = getCurrentPages();//当前页面
              let prevPage = pages[pages.length - 2];//上一页面
              //直接给上移页面赋值 
              prevPage.setData({
                  back_logistics: true,                            
              });
              wx.navigateBack({
                  delta:1
              })            
          },    
      });

  },
  bindDateChange: function (e) {
      this.setData({
          date: e.detail.value
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