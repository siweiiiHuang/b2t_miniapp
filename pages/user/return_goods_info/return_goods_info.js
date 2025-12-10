var app = getApp();
var setting = app.globalData.setting;
var request = app.request;
var util = require("../../../utils/util.js");

Page({
    data: {
        url: setting.url,
        resourceUrl: setting.resourceUrl,
        shop_name: setting.appName,
        return_goods: null, //请求的数据
        goods: null,         //请求的数据
        userInfo: null,
        back_logistics:false,
        id:'',
    },
    onLoad: function (options) {
        this.setData({ userInfo: app.globalData.userInfo, id: options.id});
        this.requestReturnGoods(options.id);
    },
   onShow:function(){
       if (this.data.back_logistics){
           this.data.back_logistics = false;
           this.onLoad({ id: this.data.id})
       }
   },
    requestReturnGoods: function (id) {
        var that = this;
        request.get('/api/order/return_goods_info', {
            failRollback: true,
            data: { id: id },
            success: function (res) {
                var return_goods = res.data.result.return_goods;
                return_goods.addTimeFormat = util.format(return_goods.addtime);
                if (typeof return_goods.seller_delivery == 'object'
                    && typeof return_goods.seller_delivery.express_time == 'number') {
                    return_goods.seller_delivery.expressTimeFormat
                        = util.format(return_goods.seller_delivery.express_time);
                }
                that.setData({
                    return_goods: return_goods,
                    goods: res.data.result.goods,
                });
            }
        });
    },

    /** 确认收货 */
    receiveOrder: function () {
        var that = this;
        var return_id = this.data.return_goods.id
        wx.showModal({
            title: '确定已收货？',
            success: function (res) {
                if (res.confirm) {
                    request.post('/api/order/receiveConfirm', {
                        data: { return_id: return_id },
                        success: function (res) {
                            wx.setStorageSync('user:return_goods_list:update', true);
                            that.requestReturnGoods(return_id);
                        }
                    });
                }
            }
        });
    },
    back:function(){
            wx.navigateTo({
                url: '../../user/return_goods_logistics/return_goods_logistics?id=' + this.data.return_goods.id,
            })
    },

    /** 取消退换货 */
    cancelReturn: function () {
        var that = this;
        var return_id = this.data.return_goods.id
        wx.showModal({
            title: '确定取消售后服务？',
            success: function (res) {
                if (res.confirm) {
                    request.post('/api/order/return_goods_cancel', {
                        data: { id: return_id },
                        success: function (res) {
                            wx.setStorageSync('user:return_goods_list:update', true);
                            that.requestReturnGoods(return_id);
                        }
                    });
                }
            }
        });
    },

    /** 预览图片 */
    previewImgs: function (e) {
        var that = this;
        var imgs = this.data.return_goods.imgs;
        imgs = imgs.map(function (val) {
            return that.data.url + val;
        });
        wx.previewImage({ 
            current: imgs[e.currentTarget.dataset.idx],
            urls: imgs 
        });
    },

});