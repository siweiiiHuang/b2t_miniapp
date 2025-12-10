// pages/cart/cart2/shopDetail/shopDetail.js
var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
      enable_scroll:false,
      enable_zoom:false,
      markers: [{
        iconPath: "../../../../images/hd_red_marker.png",
        id: 0,
        latitude: 22.6352920,
        longitude: 114.0865840,
        width: 30,
        height: 30
      }],
      shop:null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      var data = JSON.parse(options.datas)
      this.setData({
          shop:data,
        'markers[0].latitude': data.latitude,
        'markers[0].longitude': data.longitude

      })
  },

  contact: function (e) {
    var phone = e.currentTarget.dataset.tel
    if (phone) {
      app.confirmBox('拨打门店电话：' + phone, function () {
        wx.makePhoneCall({
          phoneNumber: phone,
        });
      });
    }
  },

 
})