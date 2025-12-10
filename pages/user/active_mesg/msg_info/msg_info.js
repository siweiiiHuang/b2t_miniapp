// pages/user/active_mesg/msg_info/msg_info.js
var WxParse = require('../../../../utils/wxParse/wxParse.js');
var app = getApp();
var request = app.request;
Page({

  /**
   * 页面的初始数据
   */
  data: {
    
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      app.showLoading(null, 1500);
      if(!options.rec_id){
         wx.showModal({
           title: '获取提示',
           content: '未传入消息ID',
           showCancel:false
         })
         return;
      }
      var that =this
    var url = '/api/message/getMessageDetails?rec_id=' + options.rec_id
    
    request.get(url, {
      success: function (res) {
          that.setData({
            message_details: res.data.result,
          })
        WxParse.wxParse('message_content', 'html', res.data.result.message_content,that,5)
      }
    });
  },

  onShareAppMessage: function () {

  }
})