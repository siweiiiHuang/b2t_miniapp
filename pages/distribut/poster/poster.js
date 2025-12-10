// pages/distribut/poster/poster.js
var app = getApp();
var request = app.request;
var setting = app.globalData.setting;

Page({

  /**
   * 页面的初始数据
   */
  data: {
      look:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      var that = this;
      request.get('/api/user/getUserPoster', {
          success: function (res) {  
              if (res.data.result.status == 1 && res.data.result.result == -1 ){
                  app.showTextWarining(res.data.result.msg,function(){
                      wx.navigateBack({
                          delta:1
                      })
                  })
              }else{
                  that.getHttpImages(res.data);       
              }                      
          }
      });
  },
  getHttpImages:function(data){
       this.data.look = true;
       wx.getImageInfo({
           src: setting.url + data.result,
                  success: function (res) {    
                      wx.previewImage({
                          urls: [res.path],
                      })
                  }
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
      if (this.data.look){
          this.data.look = false,
          wx.navigateBack({
              delta: 1
          })
      }
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