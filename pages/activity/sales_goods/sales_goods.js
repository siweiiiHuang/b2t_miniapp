var app = getApp();
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;
var util = require('../../../utils/util.js');
var request = app.request;
Page({
  data: {
    url: app.globalData.setting.url,
    resourceUrl: app.globalData.setting.resourceUrl,
    requestData: null,
    tabType: 0,
    goodsCurrentPage: 1,
    timer: null,
  },

  onLoad: function (data) {
    this.requestGroupBuy(data.id);
    console.log(666555)
    console.log(this.data.url)
  },

    // 请求商品数据
  requestGroupBuy: function (id) {
      var that = this;
      request.post('/api/Activity/promote_list', {
          data: {
              id: id,
          },
          success: function (res) {
              that.setData({
                  requestData: res.data.result
              })
          }
      });
    
  },




});