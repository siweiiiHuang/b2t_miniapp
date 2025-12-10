var app = getApp();
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;
var util = require('../../../utils/util.js');

Page({
  data: {
    url: app.globalData.setting.url,
    resourceUrl: app.globalData.setting.resourceUrl,
    requestData: null,
    tabType: 0,
    goodsCurrentPage: 1,
    timer: null,
  },

  onLoad: function () {
    // load.init(this, 'groups', 'requestData');
      load.init(this, '', 'requestData');
    this.requestGroupBuy(this.data.tabType);
    this.createTimer();
  },

  onUnload: function () {
    clearInterval(this.data.timer);
  },
  //导航切换
  changeTab: function (event) {
      var that=this;
      console.log(555666)
      console.log(event)
    var tabType = event.currentTarget.dataset.type;
    //重置数据
    load.resetConfig();
    this.setData({
        tabType:tabType
    })
    this.data.requestData = null;
    this.data.goodsCurrentPage = 1;
    this.requestGroupBuy(tabType);
  },

  requestGroupBuy: function (tabType) {
    var that = this;
    //   var requestUrl = that.data.url + '/api/activity/SalesList';
      var requestUrl = that.data.url + '/api/activity/promote_goods';
    requestUrl += '/type/' + tabType;
    requestUrl = requestUrl + '?p=' + that.data.goodsCurrentPage;

      //时间格式转换
      load.request(requestUrl, function (res) {
        //   that.data.currentPage++;
          res.data.result.forEach(function (val, index, arr) {
              val.starttime = util.formatTime(val.start_time,false);
              val.endtime = util.formatTime(val.end_time, false);
          });
        //   wx.stopPullDownRefresh();
      });
      //时间格式转换
    
    var goodsCurrentPage = that.data.goodsCurrentPage++;
    load.request(requestUrl, function () {
      that.setData({
        goodsCurrentPage: goodsCurrentPage
      })
    });
  },

//   onReachBottom: function () {
//     if (load.canloadMore()) {
//       this.requestGroupBuy(this.data.tabType);
//     }
//   },

  createTimer: function () {
    var that = this;
    var startTime = (new Date()).getTime();
    this.data.timer = setInterval(function () {
      if (!that.data.requestData || !that.data.requestData.groups) {
        return;
      }
      var remainTime = 0;
      var groups = that.data.requestData.groups;
      for (var i = 0; i < groups.length; i++) {
        var diffTime = startTime - that.data.requestData.server_current_time * 1000;
        groups[i].remainTime = util.remainTime(groups[i].end_time * 1000 - (new Date()).getTime() + diffTime);
      }
      that.setData({ 'requestData.groups': groups });
    }, 1000);
  },

  //下拉分页
  onReachBottom: function (e) {
    console.log(123)
    this.requestGroupBuy(this.data.tabType);
    // Do something when page reach bottom.
  },
});