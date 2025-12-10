//index.js
var app = getApp();
var request = app.request;
var setting = app.globalData.setting;
var common = require('../../../utils/common.js');
var util = require('../../../utils/util.js');
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;

Page({
  data: {
      page: 4,   
      currentPage: 1,
      list: null,
      url: setting.url,
      userInfo:null,
      store:null,
      goods: null,  //待上架商品
  },
    onLoad: function (options) {
        this.requestGoodsList();
    },
       // 请求待上架商品
    requestGoodsList: function (e) {
        var that = this;
        request.get('/api/Distribut/goods_list', {
            success: function (res) {
                var res = res.data.result;
                that.setData({
                    goods: res
                })
            }
        });
    },
    onShow:function(){
        var that = this;
        var userInfo = wx.getStorageSync('app:userInfo');
        if (userInfo) {
            userInfo.head_pic = common.getFullUrl(userInfo.head_pic);
        }
        that.setData({ userInfo: userInfo });
        load.init(this, '', 'list');
        that.getGoodsList();
        that.getStore();
    },
    getStore:function(){
        var that = this;
        request.post('/api/Distribut/get_store', {
            successReload: true,
            success: function (res) {
                if (res.data.result){
                    that.setData({ store: res.data.result })
                }                
            }
        });
    },
    getGoodsList: function () {
        var that = this;
        load.request('/api/Distribut/my_store?p=' + that.data.currentPage, function (res) {
            that.data.currentPage++;               
        });
    },

    distributTopages: function (e) {
        common.todistribut(e.currentTarget.dataset.idx, this.data.page);
    },
    //重置数据
    resetData: function () {
        load.resetConfig();
        this.data.list = null;
        this.data.currentPage = 1;
    },

    onReachBottom: function () {
        if (load.canloadMore()) {
            this.getGoodsList();
        }
    },

    onPullDownRefresh: function (e) {
        this.resetData();
        this.getGoodsList();
    },
 
})
