// pages/user/message_logistics/message_logistics.js
var app = getApp();
var request = app.request;
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;

Page({
    data: {
        url: app.globalData.setting.url,
        messageList: null,
        currentPage: 1,
    },

    onLoad: function (options) {
        load.init(this, '', 'messageList');
        this.requestMessageList();
    },

    onShow: function () {
        this.onPullDownRefresh();
    },

    //重置数据
    resetData: function () {
        load.resetConfig();
        this.data.messageList = null;
        this.data.currentPage = 1;
    },

    requestMessageList: function () {
        var that = this;
        var requestUrl = that.data.url + '/index.php?m=Api&c=Message&a=message_notice_detail&type=2';
        requestUrl = requestUrl + '&p=' + that.data.currentPage;
        load.request(requestUrl, function (res) {
            that.data.currentPage++;
            //that.setData({ messageList: res.data.result });
            wx.stopPullDownRefresh();
        });
    },

    onPullDownRefresh: function () {
        this.resetData();
        this.requestMessageList();
    },

    onReachBottom: function () {
        if (load.canloadMore()) {
            this.requestMessageList();
        }
    },

    //删除操作
    clearMessage: function () {
        if (this.data.messageList == null || this.data.messageList.length == 0) {
            app.showTextWarining("当前无消息");
            return;
        }
        var that = this;
        wx.showModal({
            title: '确定清空全部消息！',
            cancelText: '取消',
            confirmText: '确定',
            success: function (res) {
                if (!res.confirm) {
                    return;
                }
                that.deleteMsg();
            }
        });
    },

    deleteMsg: function () {
        var that = this;
        request.post('/index.php?m=Api&c=Message&a=deletedMessage&type=2', {
            success: function (res) {
                that.onPullDownRefresh();
            }
        })
    },

    goDetail: function (e) {
        var item = e.currentTarget.dataset.item;
        this.setMessageForRead(item.rec_id); 
        if(4 == item.type){ //待评价跳转
            wx.redirectTo({
              url: '/pages/user/comment/comment',
            })
            return
        }
        
        wx.navigateTo({ url: '/pages/user/order_detail/order_detail?order_id=' + item.order_id });
        
    },

    setMessageForRead: function (recId) {
        request.post('/index.php?m=Api&c=Message&a=setMessageForRead', {
            data: {
                rec_id: recId,
            },
            success: function (res) {
            }
        })
    },

})