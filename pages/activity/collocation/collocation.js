var app = getApp();
var request = app.request;
var common = require('../../../utils/common.js');
import LoadMore from '../../../utils/LoadMore.js';
var load = new LoadMore;

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl,
        requestData: null,
        currentPage: 1,
        cartGoodsNum:0,
        datas:null,
        district_id:0,
        imChoose: 0, //0 QQ客服,1 IM客服,2 小能客服
    },

    onLoad: function (options) {
        var that = this;      
        that.getCardList(options);        
        that.requestCardNum();
        that.setData({
            defaultMenu: app.globalData.defaultMenu,
            menu_index: app.globalData.menu_index,
            menu_model: app.globalData.menu_model,
        }) 

        app.getConfig(function (res) {
            var im_choose = common.getConfigByName(res.config, 'im_choose');
            that.setData({ imChoose: im_choose});
        }); 

    },

    adTopage: function (e) {
        var id = e.currentTarget.dataset.id;
        if (id>0) {    
            wx.navigateTo({ url: '/pages/goods/goodsInfo/goodsInfo?goods_id=' + id });
        } 
    },

    tocart: function () {
        var url = '/pages/cart/cart/cart';
        app.getConfig(function (res) {
            var is_block = common.getConfigByName(res.config, 'is_block_index');
            if (is_block == 0) {
                app.globalData.menu_index = '2';
                common.defaultTotabar('2', -1);
            } else {
                common.customTocart();
            }
        });
    },

    valueToNum:function (e) {
        var goodsNum;
        if (isNaN(e.detail.value) || e.detail.value < 1){
            goodsNum = 1;
        } else if (e.detail.value > 200){
            goodsNum = 200;
        }        
        else{
            goodsNum = parseInt(e.detail.value);
        }
        this.changeNum(goodsNum);
    },

    addNum:function (e) {
        var num = e.currentTarget.dataset.num
        if (num == 200){
            return;
        }
        num++
        this.changeNum(num);
    },

    subNum:function (e) {
        var num = e.currentTarget.dataset.num
        if (num == 1) {
            return;
        }
        num--
        this.changeNum(num);
    },
    /** 修改购物车数量 */
    changeNum: function (num){
        this.AsyncUpdateCart(num);  
    },
    /** 查询购物车选中商品价格 */
    AsyncUpdateCart:function(num){
        var that = this;
        var datas = that.data.requestData;
        var setmeal_price = 0.00;  //套餐价
        var cost_saving = 0.00; //节省
  
        for (var i = 0; i < datas.length; i++){
            if (i == 0) {
                datas[0]['selected'] = 1;
            }
            datas[i]['goods_num'] = num ? num : datas[0]['goods_num']
            if (datas[i]['selected'] == 1){
                setmeal_price += parseFloat(datas[i]['price']) * (num ? num : datas[i]['goods_num'] ? datas[i]['goods_num']:1)
                cost_saving += (parseFloat(datas[i]['original_price']) - parseFloat(datas[i]['price'])) * (num ? num : datas[i]['goods_num'] ? datas[i]['goods_num'] : 1)
            }            
        }
        setmeal_price = setmeal_price.toFixed(2)
        cost_saving = cost_saving.toFixed(2)
        that.setData({ setmeal_price: setmeal_price, cost_saving: cost_saving, requestData: datas})
    },

    /** 加入购物车 */
    addCart: function (e) {
        var that = this;
        var datas = that.data.requestData;
        var Selected = 0;       
        var arr = new Array();
        for (var i = 0; i < datas.length;i++){
            if (datas[i]['selected'] == 1){
                var obj = new Object();
                obj.goods_id = datas[i]['goods_id']
                obj.item_id = datas[i]['item_id']
                obj.region_id = that.data.district_id        
                arr.push(obj);              
                Selected++
            }       
        }

        if (Selected==1){
            return app.showTextWarining("请勾选至少俩个商品!");
        }      
            request.post('/api/cart/addCombination', {
                data:{
                    combination_id: that.data.datas.combination[0].combination_id ,
                    num: (datas[0]['goods_num'] ? datas[0]['goods_num'] : 1),
                    combination_goods: JSON.stringify(arr)
                },
                success: function (res) {                    
                    if (e.currentTarget.dataset.action == 'add') { 
                        //加入购物车 
                        app.showSuccess('添加成功', that.requestCardNum());
                    }else{
                        //立即购买
                        wx.navigateTo({
                            url: '/pages/cart/cart/cart',
                        })
                    }

                }
            });
         
    },
    checkItem: function (e) {
        var datas = this.data.requestData;
        if (e.currentTarget.dataset.item == 0){
            return
        }
        datas[e.currentTarget.dataset.item].selected = Number(!datas[e.currentTarget.dataset.item].selected);
        this.setData({ requestData: datas})
        this.AsyncUpdateCart();    
    },

    /** 请求购物车数量 */
    requestCardNum: function () {
        var that = this;
        request.get('/api/cart/index', {
            success: function (res) {
                var cartGoodsNum = 0;
                if (res.data.result.length == 0) {
                    that.setData({ cartGoodsNum: cartGoodsNum });
                    return;
                }
                var list = res.data.result.cart_list;
                for (var i = 0; i < list.length; i++) {
                    cartGoodsNum += list[i].goods_num;
                }
                that.setData({ cartGoodsNum: cartGoodsNum });
            }
        });
    },
    getCardList: function (options) {
        var that = this;
        request.get(that.data.url + '/api/Goods/collocation_details', {
            data:{
                id: options.goods_id,
                item: options.item_id,
                combination: options.combination_id,
            },
            success: function (res) {        
                that.setData({
                    requestData: res.data.result.combination[0]['combination_goods'],
                    datas: res.data.result,
                    district_id: options.district_id
                });
                that.AsyncUpdateCart(1);
            }
        });
    },
  

});