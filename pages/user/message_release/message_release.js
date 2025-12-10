// pages/user/message_release/message_release.js
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

    requestMessageList: function(){
        var that = this;
        var requestUrl = that.data.url + '/index.php?m=Api&c=Message&a=message_notice_detail&type=0';
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

    deleteMsg: function(){
        var that = this;
        request.post('/index.php?m=Api&c=Message&a=deletedMessage&type=0', {
            success: function (res) {
                that.onPullDownRefresh();
            }
        })
    },

    // 跳到详情页
    goDetail: function(e){
        var item = e.currentTarget.dataset.item;
        var idx = e.currentTarget.dataset.idx;
        switch (item.type) {
            case 0:  //系统公告
                wx.navigateTo({ url: '/pages/user/mesg_detail/mesg_detail?rec_id=' + item.rec_id });
                this.setMessageForRead(item.rec_id, idx);
                break;
            case 1:  //降价通知
                this.setMessageForRead(item.rec_id, idx);
                wx.navigateTo({ url: '/pages/goods/goodsInfo/goodsInfo?item_id='  + item.item_id });
                break;
            case 2:  //优惠券到账提醒
                this.setMessageForRead(item.rec_id, idx);
                wx.navigateTo({ url: '/pages/user/coupon/coupon' });
                break;
            case 3:  //优惠券使用提醒
                this.setMessageForRead(item.rec_id, idx);
                wx.navigateTo({ url: '/pages/user/coupon/coupon' });
                break;
            case 4:  //优惠券即将过期提醒
                this.setMessageForRead(item.rec_id, idx);
                wx.navigateTo({ url: '/pages/user/coupon/coupon'});
                break;
            case 5:  //预售订单尾款支付提醒
                this.setMessageForRead(item.rec_id, idx);
                wx.navigateTo({ url: '/pages/user/order_detail/order_detail?order_id=' + item.order_id });
                break;
            case 6:  //提现到账提醒
                this.setMessageForRead(item.rec_id, idx);        
                wx.navigateTo({ url: '/pages/user/withdrawals_list/withdrawals_list'});
                break;
        }
    },

    // 设置已读未读
    setMessageForRead: function (recId,idx){
        var that = this;
        request.post('/index.php?m=Api&c=Message&a=setMessageForRead', {
            data:{
                rec_id: recId,
            },
            success: function (res) {        
                that.data.messageList[idx].is_see = 1;
                that.setData({
                    messageList: that.data.messageList
                })
            }
        })
    },

})