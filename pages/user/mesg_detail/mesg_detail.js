// pages/messages/mesg_detail/mesg_detail.js
var app = getApp();
var request = app.request;

Page({
    data: {
        mesgdetails: null,
        recId: null,
    },

    onLoad: function (options) {
        var recId = options.rec_id;
        this.setData({ recId: recId });
        this.getMessageDetail();
    },

    getMessageDetail:function(){
        var that =this;
        var requestUrl = '/index.php?m=Api&c=Message&a=getMessageDetails&rec_id=' + this.data.recId;
        request.get(requestUrl, {
            success: function (res) {
                that.setData({ mesgdetails: res.data.result });
            }
        });
    }
  
})