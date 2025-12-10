1// team_detail.js
var app = getApp();
var request = app.request;
var setting = app.globalData.setting;
var util = require('../../../utils/util.js');
var common = require('../../../utils/common.js');

Page({
    data: {
        url: setting.url,
        defaultAvatar: setting.resourceUrl + "/static/images/user68.jpg",     
    },

    onLoad: function (options) {       
        this.getTeamGoods(options.team_id);  
    },

    getTeamGoods: function (team_id){
        var that = this;
        request.get('/api/Team/lottery', {
            data: {
                team_id: team_id,
            },
            failRollback: true,
            success: function (res) {
                res.data.result.team_lottery.forEach(function (item, index){
                    let str = item.mobile;
                    item.head_pic = item.head_pic ? common.getFullUrl(item.head_pic) : that.data.defaultAvatar;
                    item.mobile = str.substring(0, 3) + '*****' + str.substring(8, 11)
                })          
                that.setData({ data: res.data.result})     
            }
        });
    },

})
