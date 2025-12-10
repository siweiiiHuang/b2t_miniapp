var app = getApp();
var request = app.request;
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;
var util = require('../../../utils/util.js');

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl,
        categories: [
            { name: "未使用", id: 0 },
            { name: "已使用", id: 1 },
            { name: "已过期", id: 2 }
        ],
        typeId: 0,
        coupons: null,
        currentPage: 1,
        couponCode: '',
        flag: true,
    },

    onLoad: function (options) {
        var typeId = typeof options.type == 'undefined' ? this.data.typeId : options.type;
        load.init(this, '', 'coupons');
        this.requestCoupons(typeId);
    },

    //出现
    show: function () {
        this.setData({ flag: false });
    },

    //消失
    hide: function () {
        this.setData({ flag: true });
    },

    changeTab: function (e) {
        this.reloadCoupons(e.currentTarget.id);
    },

    requestCoupons: function (typeId) {
        var that = this;
        var requestUrl = '/api/user/getCouponList?type=' + typeId + '&p=' + that.data.currentPage;
        this.setData({ typeId: typeId });
        load.request(requestUrl, function (res) {
            that.data.currentPage++;
            res.data.result.forEach(function (val, index, arr) {
                val.deadTimeFommat = util.format(val.use_end_time, 'yyyy-MM-dd');
                val.startTimeFommat = util.format(val.use_start_time, 'yyyy-MM-dd');
            });
            wx.stopPullDownRefresh();
        });
    },

    onReachBottom: function () {
        if (load.canloadMore()) {
            this.requestCoupons(this.data.typeId);
        }
    },

    onPullDownRefresh: function (e) {
        this.reloadCoupons(this.data.typeId);
    },

    //重载数据
    reloadCoupons: function (typeId) {
        load.resetConfig();
        this.setData({ coupons: null });
        this.data.currentPage = 1;
        this.requestCoupons(typeId);
    },

    inputCouponCode: function (e) {
        this.setData({ couponCode: e.detail.value });
    },

    exchange: function () {
        var that = this;
        if (this.data.couponCode==''){
            app.showTextWarining("请输入优惠劵码");
            return;
        }
        this.hide();
        request.post('/api/cart/cartCouponExchange', {
            data: { coupon_code: that.data.couponCode },
            success: function (res) {
                that.setData({ typeId: 0 });
                that.reloadCoupons(0);
                app.showSuccess('兑换成功');
            },
            complete: function () {
                that.setData({ couponCode: '' });
            }
        });
    },

    useCoupon: function (e) {
        if (this.data.typeId >0){
            app.showTextWarining(this.data.typeId == 1?'卡券已被使用':'卡券已过期');
            return;
        }
        var coupon = e.currentTarget.dataset.item;
        if (coupon.goods_id){
            wx.navigateTo({ url: '/pages/goods/goodsInfo/goodsInfo?goods_id=' + coupon.goods_id });
        } else if (coupon.category_id){
            wx.navigateTo({ url: '/pages/goods/goodsList/goodsList?cat_id=' + coupon.category_id });
        }else{
            wx.navigateTo({ url: '/pages/goods/goodsList/goodsList' });
        }
    },

});