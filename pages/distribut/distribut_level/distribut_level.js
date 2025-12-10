// pages/wcs/privil-card/priviledge/priviledge.js
var app = getApp();
var request = app.request;
var setting = app.globalData.setting;
import LoadMore from '../../../utils/LoadMore.js';
var load = new LoadMore;

Page({

  /**
   * 页面的初始数据
   */
  data: {
      url: setting.url,
      currentPage: 1,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      load.init(this, '', 'list');
      this.getDistributList();
  },
  getDistributList(){
      var that = this;
      var requestUrl = '/api/distribut/distribut_list?p=' + that.data.currentPage;
      load.request(requestUrl, function () {
          that.data.currentPage++;
      });
  },
    info:function(e){ 
        wx.navigateTo({
            url: '/pages/distribut/distribut_detail/distribut_detail?id=' + e.currentTarget.dataset.id,
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
      load.resetConfig();
      this.getDistributList();   
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
      load.canloadMore()
      this.getDistributList();
  },

})