var app = getApp();
var request = app.request;
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl,
        coupons: null,
        typeId: 1,
        currentPage: 1,
        type:false,
        pages:null,
        idx:1,
    },

    onLoad: function (options) {
        //商品详情领券
        if (options && options.type == 'goodsinfo'){
            var pages = getCurrentPages();
            var prevPage = pages[pages.length - 2];  //上一个页面
            this.setData({ coupons: prevPage.data.cardList, type: true, pages: prevPage})
        }else{
        //领券中心    
            load.init(this, '', 'coupons');
            this.requestCouponList(this.data.typeId);
        }        
    },

    requestCouponList: function (typeId) {
        var that = this;
        that.setData({ typeId: typeId });
        var requestUrl = '/api/activity/coupon_list?type=' + typeId + '&p=' + that.data.currentPage;
        load.request(requestUrl, function (res) {
            that.data.currentPage++;
            for (var i in res.data.result) {
                var val = res.data.result[i];
                val.percent = val.createnum > 0 ? Math.ceil(val.send_num / val.createnum * 100) : 0;
            }
            that.getCouponRate(res.data.result);
            wx.stopPullDownRefresh();
        });
    },

    onReachBottom: function () {
        if (load.canloadMore() && !this.data.type) {
            this.requestCouponList(this.data.typeId);
        }
    },

    onPullDownRefresh: function () {
        !this.data.type && this.reloadCouponList(this.data.typeId);
    },
    changeTab:function(e){
        this.setData({ idx: e.currentTarget.dataset.type})
        this.reloadCouponList(e.currentTarget.dataset.type);
    },
    //重置数据
    reloadCouponList: function (typeId) {
        load.resetConfig();
        this.data.coupons = null;
        this.data.currentPage = 1;
        this.requestCouponList(typeId);
    },

    /** 商品详情领券 */
    getCoupons: function (e) {
        var that = this;
        var coupon_id = e.currentTarget.dataset.cid;
        var idx = e.currentTarget.dataset.idx;
        var coupons = that.data.coupons;

        request.post('/api/activity/get_coupon', {
            data: { coupon_id: coupon_id },
            success: function (res) {
                app.confirmBox(res.data.msg);
                coupons[idx]['isget'] = 1;
                that.setData({ coupons: coupons });
                that.data.pages.data.cardList = coupons
            }
        });
    },

    /** 领券 */
    getCoupon: function (e) {
        var that = this;
        var coupon_id = e.currentTarget.dataset.cid;
        var idx = e.currentTarget.dataset.idx;     
        var coupons = that.data.coupons;
        var arr = [];
        var del_index;
        for(var i in coupons){
            if (coupons[i]['id'] != coupon_id){
                arr.push(coupons[i])
            }else{
                del_index = i;
            }           
        }
  
        request.post('/api/activity/get_coupon', {
            data: { coupon_id: coupon_id },
            success: function (res) {
                app.confirmBox(res.data.msg);                         
                arr.splice(i, 1);
                that.setData({ coupons: arr });
            }
        });
    },

    /** 获取所有优惠券领券进度 */
    getCouponRate: function (coupons) {
        for (var i in coupons) {
            var id = coupons[i].id;
            var rate = (coupons[i].percent) / 100;
            this.createCircle(id, rate);
        }
    },

    /** 画领取进度 */
    createCircle: function (id, rate) {
        var context = wx.createCanvasContext(id);
        context.beginPath();
        context.setStrokeStyle("#8e8e8e");
        context.setLineWidth(3);
        context.setLineCap('round');
        context.arc(38, 35, 31, 0.75 * Math.PI, 2.25 * Math.PI, false);
        context.stroke();
        if (rate > 0) {
            context.beginPath();
            context.setLineWidth(3);
            context.setStrokeStyle("#ffffff");
            context.setLineCap('round');
            context.arc(38, 35, 31, 0.75 * Math.PI, (rate * 1.5 + 0.75) * Math.PI, false);
            context.stroke();
        }
        context.draw();
    },

});