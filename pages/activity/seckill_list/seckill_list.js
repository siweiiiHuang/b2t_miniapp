// seckill_list.js
var app = getApp();
var request = app.request;
var setting = app.globalData.setting;
var util = require('../../../utils/util.js');
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;

Page({
    data: {
        url: setting.url,
        killtime: null,
        currentPage: 1,
        timeac: 0,
        goodlist: null,
        timer: null, //活动倒计时定时器
    },

    changeTimeAc:function(e){
        this.setData({ timeac: e.currentTarget.dataset.index });
        this.reloadGoodList();
    },

    onLoad: function (options) {
        load.init(this, '', 'goodlist');
        this.requestTime();
    },

    requestTime: function(){
        var that = this;
        request.post('/api/activity/flash_sale_time',{
            success: function(res){
                var time = res.data.result.time;
                that.setData({ killtime: time });
                that.requestSalelist(that.data.killtime[that.data.timeac]);
            }
        });
    },

    requestSalelist: function (time){
        var that = this;
        var requestUrl = '/api/activity/flash_sale_list?p=' + that.data.currentPage + '&start_time=' + time.start_time + '&end_time=' + time.end_time;
        load.request(requestUrl, function (res) {
            that.data.currentPage++;
            wx.stopPullDownRefresh();
        });
        that.destroyActivityTimer();
        that.createActivityTimer(time);  
    },
    /** 创建活动倒计时定时器 */
    createActivityTimer: function (time) {
        var that = this;
        that.data.timer = setInterval(function () {
            that.overTime(time);
        }, 1000);
    },
    /** 销毁活动倒计时定时器 */
    destroyActivityTimer: function () {
        if (this.data.timer) {
            clearInterval(this.data.timer);
            this.data.timer = null;
        }
    },
    //倒计时
    overTime: function (time) {
        let text, over_time;
        var startTime = parseInt((new Date()).getTime().toString().substring(0, 10));   //当前时间戳

        if (time.start_time > startTime) {
            text = '秒杀活动即将开场~'
            var remainTime = time.start_time * 1000 - (new Date()).getTime()
            remainTime = '距离开始' + util.remainTime(remainTime);
        } else {
            text = '正在秒杀，先下单先得哦~'
            var remainTime = time.end_time * 1000 - (new Date()).getTime();    
            if (util.remainTime(remainTime) == '1秒' || remainTime == 1000) {
                load.init(this, '', 'goodlist');
                this.requestTime();
            }else{
                remainTime = '距离结束' + util.remainTime(remainTime);
            }            
        }
        this.setData({
            'time.text': text,
            'time.over_time': remainTime,
        })
    },
 
    onPullDownRefresh: function () {
        this.reloadGoodList();
    },

    //重置数据
    reloadGoodList: function () {
        load.resetConfig();
        this.data.goodlist = null;
        this.data.currentPage = 1;
        this.requestSalelist(this.data.killtime[this.data.timeac]);
    },
  
    onReachBottom: function () {
        if (load.canloadMore()) {
            this.requestSalelist(this.data.killtime[this.data.timeac]);
        }
    },

    onUnload: function () {
        this.destroyActivityTimer();
    },

})