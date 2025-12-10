//index.js
var app = getApp();
var request = app.request;
var setting = app.globalData.setting;
var common = require('../../../utils/common.js');
var util = require('../../../utils/util.js');

Page({
  data: {
      data:null,
      defaultAvatar: setting.resourceUrl + "/static/images/user68.jpg",
      webUrl:'',
      page:0,
      store:null,
  },
  //事件处理函数
    onShow:function(){
        this.getDistribut();
        this.getStore();
    },
    getStore: function () {
        var that = this;
        request.post('/api/Distribut/get_store', {
            successReload: true,
            success: function (res) {
                if (res.data.result) {
                    res.data.result.store_time = util.format(res.data.result.store_time,'yyyy-MM-dd')
                    that.setData({ store: res.data.result })
                }
            }
        });
    },
    getDistribut:function(){
        var that = this;
        request.post('/api/Distribut/index', {           
            successReload: true,
            success: function (res) {
                res.data.result.user.head_pic = common.getFullUrl(res.data.result.user.head_pic);
                that.setData({ data:res.data.result })
            }
        });
    },

    /** 新手必看 */
    distributSee: function () {
        this.setData({ webUrl: "/api/Article/agreement?doc_code=create_circle" });
        wx.navigateTo({ url: '/pages/index/webview/webview' });
    },

    distributTopages:function(e){
        common.todistribut(e.currentTarget.dataset.idx,this.data.page);
    }
})
