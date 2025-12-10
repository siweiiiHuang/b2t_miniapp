var app = getApp();
var request = app.request;
var common = require('../../../utils/common.js');
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;

Page({
    data: {
        url: app.globalData.setting.url,
        bargain:false,
        menu_selected:false, 
        orderList: null, //请求的订单列表    
        BargainList:null, //活动列表
        activeCategoryId:0,  
        currentPage: 1,
        categories: [
            { name: "全部", id: 0 },
            { name: "砍价中", id: 1 },
            { name: "待购买", id: 2 },
            { name: "未支付", id: 3 },
            { name: "已支付", id: 4 },
            { name: "失败", id: 5 },
        ],
        bargainList: [
            { name: "综合推荐", id: 0 },
            { name: "价格", id: 2 },
            { name: "热销榜", id: 3 },  
        ],
        activeBargainId:0,
    },
    onLoad: function (options) {   
        if (options){
            if (options.type == 'bargain') {
                wx.setNavigationBarTitle({
                    title: '砍价活动'
                })
                this.requestBargainList(0);
                this.setData({ bargain: true, menu_selected: true });
            }
        }else{
            this.requestOrderList(0);
        }        
    },
    /** 请求订单数据 */
    requestOrderList: function (categoryId) {
        var that = this;
        load.init(that, '', 'orderList');
        var requestUrl = that.data.url + '/api/Bargain/order_list';
  
        requestUrl += '/type/' + categoryId;
        
        that.setData({ activeCategoryId: categoryId });
        requestUrl = requestUrl + '?p=' + that.data.currentPage;
        load.request(requestUrl, function (res) {
            that.data.currentPage++;       
            wx.stopPullDownRefresh();
        });
    },
    /** 请求活动数据 */
    requestBargainList: function (activeBargainId) {
        var that = this;
        load.init(that, '', 'BargainList');
        var requestUrl = that.data.url + '/api/Bargain/bargain_list';

        requestUrl += '/type/' + activeBargainId;

        that.setData({ activeBargainId: activeBargainId });
        requestUrl = requestUrl + '?p=' + that.data.currentPage;
        load.request(requestUrl, function (res) {
            that.data.currentPage++;
            wx.stopPullDownRefresh();
        });
    },
    show:function(e){
        let t = e.currentTarget.dataset.type
        this.resetData();
        if(t == 'bargain'){
            wx.setNavigationBarTitle({
                title: '砍价活动'
            })
            this.requestBargainList(0);            
            this.setData({bargain:true,menu_selected:true});
        }else{
            wx.setNavigationBarTitle({
                title: '砍价订单'
            })
            this.requestOrderList(0);
            this.setData({ bargain: false, menu_selected: false });
        }
    },
    changeTab: function (e) {
        this.resetData();
        this.requestOrderList(e.currentTarget.id);
    },
    changeTabs:function(e){
        this.resetData();
        this.requestBargainList(e.currentTarget.id);
    },

    onReachBottom: function () {
        if (load.canloadMore()) {
            if (this.data.bargain) {
                this.requestBargainList(this.data.activeBargainId);
            } else {
                this.requestOrderList(this.data.activeCategoryId);
            }              
        }
    },

    onPullDownRefresh: function (e) {
        this.resetData();
        if (this.data.bargain) {
            this.requestBargainList(this.data.activeBargainId);        
        } else {
            this.requestOrderList(this.data.activeCategoryId);
        }       
    },
    //重置数据
    resetData: function () {
        load.resetConfig();
        this.data.orderList = null;
        this.data.BargainList = null;
        this.data.currentPage = 1;
    },
    redirectPage:function(e){
        var data = e.currentTarget.dataset.datas;
        if (data.status == 0 || data.status == 1){
            wx.navigateTo({
                url: '../../Bargain/bargain/bargain?id=' + data.id,
            })
        } else if (data.status == 2 || data.status == 3){
            wx.navigateTo({
                url: '../../user/order_detail/order_detail?order_id=' + data.order_id,
            })
        }else{
            if (data.order_id == 0){               
                 app.showTextWarining('活动已结束');
            }else{
                wx.navigateTo({
                    url: '../../user/order_detail/order_detail?order_id=' + data.order_id,
                })
            }
        }
    }
})
