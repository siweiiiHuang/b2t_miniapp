var util = require('../../../utils/util.js');
var common = require('../../../utils/common.js');
var app = getApp();
var request = app.request;
var setting = app.globalData.setting;

Page({
    data: {
        url: setting.url,
        resourceUrl: setting.resourceUrl,
        defaultAvatar: setting.resourceUrl + "/static/images/user68.jpg",          
    },

    onLoad: function (options) {
        this.requestComments(options.comment_id);
    },

    onShow: function () {
       
    },

 

    /** 请求评论数据 */
    requestComments: function (comment_id) {
        var that = this;
        var requestUrl = that.data.url + '/api/user/comment_info?comment_id=' + comment_id ;
        request.get(requestUrl, {
            success: function (res) {
                var comments = res.data.result.comment_info;   
                var reply_count = res.data.result.reply.count;
                var reply = res.data.result.reply.list;        
                    comments.addTimeFormat = util.formatTime(comments.add_time);
                    comments.head_pic = common.getFullUrl(comments.head_pic);  
                    if (reply.length > 0){
                        for(var i = 0; i < reply.length;i++){
                            reply[i].reply_time = util.formatTime(reply[i].reply_time);              
                        }
                    }
                    
                    that.setData({ comments: comments, reply_count: reply_count, reply: reply});
            }
        });
    },



    /**
     * 转发按钮
     */
    onShareAppMessage: function (res) {
        return setting.share;
    }

});
