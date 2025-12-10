// pages/distribut/distribut_detail/distribut_detail.js
var app = getApp();
var request = app.request;
var WxParse = require('../../../utils/wxParse/wxParse.js');
var common = require('../../../utils/common.js');
var pay = require('../../../utils/pay.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
      data:null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      var that = this;
      request.get('/api/distribut/distribut_list?id=' + options.id, {
          success: function (res) {
              WxParse.wxParse('content', 'html', res.data.result.level_intro, that, 6);
              //网页中的图片加上域名
              common.wxParseAddFullImageUrl(that, 'content');
              that.setData({data:res.data.result})
          }
      });
  },
  payment:function(){
      //检查用户是否登录方可操作立即购买
      if (!app.auth.isAuth()) {
          app.showLoading(null, 1500);
          app.getUserInfo();
          return;
      }
      var that = this;
      var data = {
          level_id: that.data.data.level_id,
      };

      request.post('/api/cart/buy_upgrade', {
          data: data,
          success: function (res) {
              Object.assign(data, {              
                  order_sn:res.data.result,
              });
              pay.distribut(data, function () {
                  wx.navigateBack();
              });
          },
          failStatus: function (res) {
              if (res.data.status == -1) {
                  app.showWarning(res.data.msg);
              } 
              return false;
          }      
      });


     
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


})