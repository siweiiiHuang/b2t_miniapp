// pages/user/active_mesg/active_mesg.js
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
        var requestUrl = that.data.url + '/index.php?m=Api&c=Message&a=message_notice_detail&type=1';
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
        request.post('/index.php?m=Api&c=Message&a=deletedMessage&type=1', {
            success: function (res) {
                that.onPullDownRefresh();
            }
        })
    },

    goDetail: function (e) {
        var item = e.currentTarget.dataset.item;
        this.data.messageList[e.currentTarget.dataset.idx].is_see = 1;
        this.setData({
            messageList: this.data.messageList
        })
        if (item.finished){
            this.setMessageForRead(item.rec_id);                             
            app.showTextWarining("活动已结束");          
            return;
        }
        if(item.is_start==0){
            this.setMessageForRead(item.rec_id);
            app.showTextWarining("活动开始时间:"+item.start_time);
            return;
        }
        switch (item.prom_type){
            case 1:  //抢购
                this.setMessageForRead(item.rec_id);
                if (item.goods_id==0){  //表示列表（多个商品）
                    wx.navigateTo({ url: '/pages/activity/seckill_list/seckill_list' });
                } else {  //表示单个商品
                    wx.navigateTo({ url: '/pages/goods/goodsInfo/goodsInfo?goods_id=' + item.goods_id + '&item_id=' + item.item_id });
                }
                break;
            case 2:  //团购
                this.setMessageForRead(item.rec_id);
                if (item.goods_id == 0) {  //表示列表（多个商品）
                    wx.navigateTo({ url: '/pages/activity/group_list/group_list' });
                } else {  //表示单个商品
                    wx.navigateTo({ url: '/pages/goods/goodsInfo/goodsInfo?goods_id=' + item.goods_id + '&item_id=' + item.item_id });
                }
                break;
            case 3:  //商品优惠
                this.setMessageForRead(item.rec_id);
                if (item.goods_id == 0) {  //表示列表（多个商品）
                    wx.navigateTo({ url: '/pages/activity/sales_list/sales_list' });
                } else {  //表示单个商品
                    wx.navigateTo({ url: '/pages/goods/goodsInfo/goodsInfo?goods_id=' + item.goods_id + '&item_id=' + item.item_id });
                }
                break;
            case 4:  //预售
                this.setMessageForRead(item.rec_id);
                wx.navigateTo({ url: '/pages/goods/goodsInfo/goodsInfo?goods_id=' + item.goods_id + '&item_id=' + item.item_id });
                break;
            case 5:  //虚拟
                this.setMessageForRead(item.rec_id);
                if (item.goods_id!=0){
                    wx.navigateTo({ url: '/pages/goods/goodsInfo/goodsInfo?goods_id=' + item.goods_id + '&item_id=' + item.item_id });
                }
                break;
            case 6:  //拼团
                this.setMessageForRead(item.rec_id);
                if (item.goods_id == 0) {  //表示列表（多个商品）
                    wx.navigateTo({ url: '/pages/team/index/index' });
                } else {  //表示单个商品
                    wx.navigateTo({ url: '/pages/team/team_info/team_info?goods_id=' + item.goods_id + '&item_id=' + (item.item_id ? item.item_id : 0) + '&team_id=' + item.prom_id});
                }
                break;
            case 7:  //搭配购
                this.setMessageForRead(item.rec_id);
                app.showTextWarining("暂无搭配购");
                break;
            case 8:  //自定义图文消息
                this.setMessageForRead(item.rec_id);
                wx.navigateTo({ url: '/pages/goods/goodsInfo/goodsInfo?goods_id=' + item.goods_id + '&item_id=' + item.item_id });
                break;
            case 9:  //订单促销
                this.setMessageForRead(item.rec_id);
                //app.showTextWarining("下单即可享受优惠活动");
                wx.navigateTo({ url: 'msg_info/msg_info?rec_id=' + item.rec_id});
                break;
        }
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