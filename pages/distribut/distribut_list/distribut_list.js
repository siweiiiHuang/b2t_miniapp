var app = getApp();
var request = app.request;
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl,
        requestUrl: '', //请求的链接
        goods: null,
        checkAllToggle: false, //全选标志
        currentPage: 1,
        result:[],
    },

    onLoad: function (options) {
        this.requestGoodsList();
    },

    requestGoodsList: function () {
        var that = this;
        var requestUrl = '/api/Distribut/distribution_list?p=' + that.data.currentPage;
        request.get(requestUrl, {
            success: function (res) {
                if (that.data.currentPage > 1){
                    var data = [...that.data.goods,...res.data.result]
                    that.setData({ goods: data });
                }else{       
                    that.setData({ goods: res.data.result });
                }               
                that.data.currentPage++;
                wx.stopPullDownRefresh();
            }
        });
    },
    onReachBottom: function () {
        if (load.canloadMore()) {
            this.requestGoodsList();
        }
    },

    //全选
    checkAll:function(){
        var checkAll = !this.data.checkAllToggle;
        var goodList = [];
        var goods = this.data.goods;
        if(goods == null || goods.length <= 0){
            return;
        }
        for (var i = 0; i < goods.length; i++) {
            goodList.push({
                goods_id: goods[i].goods_id,
                goods_name: goods[i].goods_name,
                selected: checkAll,
                commission: goods[i].commission,
                shop_price: goods[i].shop_price,
            })
        }
        this.setData({ goods: goodList });
        this.setData({ checkAllToggle: checkAll });
    },

    /** 选择单一商品 */
    selectGoods: function (e) {
        var id = e.currentTarget.dataset.id;
        var goodList = this.data.goods;
        for (var i = 0; i < goodList.length; i++){
            if (id == goodList[i].goods_id){
                goodList[i].selected = !goodList[i].selected;
            }
        }
        var checkAll = true;
        for (var j = 0; j < goodList.length; j++) {
            if (!goodList[j].selected) {
                checkAll = false;
            }
        }
        this.setData({ checkAllToggle: checkAll });
        this.setData({ goodList: goodList });
    },

    //删除商品
    delGoods: function () {
        var that = this;
        var ids = [];
        var goodList = this.data.goods;
        for (var i = 0; i < goodList.length; i++) {
            if (goodList[i].selected) {
                ids.push(goodList[i].goods_id);
            }
        }
        if (ids.length <= 0) {
            app.showTextWarining("还没有选中商品");
            return;
        }
        request.post('/api/Distribut/delete', {
            data: { 
                goods_ids: ids,
                terminal: "miniapp"
                },
            success: function (res) {
                if (res.data.status == 1){
                    app.showSuccess('操作成功',function(){
                        that.setData({
                            currentPage: 1
                        })
                        that.requestGoodsList();
                    });
                }
               
            }
        });
    },

    goodsDetail: function(e){
        var goodsId = e.currentTarget.dataset.id;
        wx.navigateTo({ url: '/pages/goods/goodsInfo/goodsInfo?goods_id='+goodsId, });
    },

});