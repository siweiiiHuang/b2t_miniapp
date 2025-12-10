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
    currentTab: 1,
    page:1,
    one:0,
    two:0,
    three:0,
    currentPage:1,
    teamList:null,
  },

    onLoad: function () {
        load.init(this, 'lists', 'teamList');
        this.getTeamList(this.data.currentTab);
    },
    getTeamList: function (level) {
        var that = this;
        load.request('/api/Distribut/lower_list/level/' + level + '?p=' + that.data.currentPage, function (res){
                    that.data.currentPage++;
                    that.setData({
                        one: res.data.result.fcount,
                        two: res.data.result.scount,
                        three: res.data.result.tcount,
                    })
            if (res.data.result.lists){
                res.data.result.lists.forEach(function (val, index, arr) {
                    val.reg_time = util.format(val.reg_time, 'yyyy-M-d');
                    val.head_pic = common.getFullUrl(val.head_pic)
                });
            }          
        });
    },
  //事件处理函数
  clickTab: function(e) {
    var that = this;
      if (that.data.currentTab != e.target.dataset.current) {
        that.setData({
            currentTab: e.target.dataset.current,
        })
        that.resetData();
        that.getTeamList(e.target.dataset.current);
    } 
  },
    distributTopages: function (e) {
        common.todistribut(e.currentTarget.dataset.idx, this.data.page);
    },
    //重置数据
    resetData: function () {
        load.resetConfig();
        this.data.teamList = null;
        this.data.currentPage = 1;
    },

    onReachBottom: function () {
        if (load.canloadMore()) {
            this.getTeamList(this.data.currentTab);
        }
    },

    onPullDownRefresh: function (e) {
        this.resetData();
        this.getTeamList(this.data.currentTab);
    },
})
