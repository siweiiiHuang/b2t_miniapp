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
        checkAllToggle: false, //全选标志
        defaultMenu: false,  //默认底部菜单显示状态
        currentPage: 1,
        hot:null,
    },

    onLoad: function () {
        var that = this;
        load.init(that, '', 'hot');
        that.requestHotGoods();
        if (app.auth.hadAuth()) {
            app.getUserInfo(function () {
                that.getCardList(); //获取登录后的购物车
            });
        }
        if (app.globalData.menu_model.length ==0){
            app.globalData.menu_index = 2
        }else{
            //遍历自定义底部，该页面在哪个位置
            for (var i in app.globalData.menu_model) {
                if (app.globalData.menu_model[i].app_url.indexOf('Cart') != -1) {
                    app.globalData.menu_index = i;
                }
            }
        }
      
        that.setData({
            defaultMenu: app.globalData.defaultMenu,
            menu_index: app.globalData.menu_index,
            menu_model: app.globalData.menu_model,
        })  
    },
    requestHotGoods: function () {
        var that = this;
        var requestUrl = '/api/Goods/guessYouLike?p=' + that.data.currentPage;
        load.request(requestUrl, function (res) {
            that.data.currentPage++;
        });
    },
    onPullDownRefresh: function (e) { 
            this.data.hot = null;
            this.data.currentPage = 1;
            load.resetConfig();  
            this.requestHotGoods();        
    },

    onReachBottom: function () {
        if ( load.canloadMore()) {
            this.requestHotGoods();
        }
    },
    /** 跳转模式 自定义页面 || 自定义菜单 || 自定义控件控件*/
    topage(e) {
        //自定义菜单
        var idx = e.currentTarget.dataset.idx;
        app.globalData.menu_index = idx;
        var page_type = this.data.menu_model[idx].url_type
        var id = this.data.menu_model[idx].app_url
        //判断跳转的类型  0 = 外部网址,1 = 小程序页面，2 = 分类商品，3 = 商品详情 ，4 = 自定义页面
        if (page_type == 1) {
            //要访问的页面idx，当前页面menu_index
            common.totabar(idx, this.data.menu_index, this.data.menu_model);
        } else if (page_type == 2) {
            wx.navigateTo({ url: '/pages/goods/goodsList/goodsList?cat_id=' + id });
        } else if (page_type == 3) {
            wx.navigateTo({ url: '/pages/goods/goodsInfo/goodsInfo?goods_id=' + id });
        } else if (page_type == 0) {
            this.setData({ webUrl:  id });
            wx.navigateTo({ url: '/pages/index/webview/webview' });
        }else{
            wx.reLaunch({
                url: '../../index/customPage/customPage?id=' + this.data.menu_model[idx].app_url,
            })
        }
    },
    /** 默认菜单 */
    topages: function (e) {
        var idx = e.currentTarget.dataset.idx;
        app.globalData.menu_index = idx;
        common.defaultTotabar(idx, 2);
    },
    //返回的时候也可以刷新
    onShow: function () {
        this.getCardList();
    },

    deleteItem:function (e) {
        var that = this;
        wx.showModal({
            title: '确定删除',
            success: function (res) {
                if (!res.confirm) {
                    return;
                }
                if (e.currentTarget.dataset.index >= 0){
                    var id = that.data.requestData.cart_list[e.currentTarget.dataset.item].combination_cart[e.currentTarget.dataset.index].id;
                }else{
                    var id = that.data.requestData.cart_list[e.currentTarget.dataset.item].id; 
                }
               
                var requestUrl = that.data.url + '/api/cart/delete?cart_ids=' + id;
                request.post(requestUrl, {
                    success: function (res) {
                        that.getCardList();
                    }
                });
            }
        })
    },

    valueToNum:function (e) {
        var goodsNum;
        var cart = this.data.requestData.cart_list[e.currentTarget.dataset.item];
        if (isNaN(e.detail.value) || e.detail.value < 1){
            goodsNum = 1;
        } else {
            goodsNum = parseInt(e.detail.value);
        }
          
        var postData = {
            goodsNum: goodsNum,
            cartID: cart.id,
            item: e.currentTarget.dataset.item
        };
        this.changeNum(postData);
    },

    addNum:function (e) {
        var cart = this.data.requestData.cart_list[e.currentTarget.dataset.item];    
        var postData = {
            goodsNum: cart.goods_num + 1,
            cartID: cart.id,
            item: e.currentTarget.dataset.item
        };
        this.changeNum(postData);
    },

    subNum:function (e) {
        var cart = this.data.requestData.cart_list[e.currentTarget.dataset.item];
        if (cart.goods_num == 1) {
            return;
        }
        var postData = {
            goodsNum: cart.goods_num - 1,
            cartID: cart.id,
            item: e.currentTarget.dataset.item
        }
        this.changeNum(postData);
    },
    /** 修改购物车数量 */
    changeNum:function(data){
        var that = this;
        request.post(that.data.url + '/api/cart/changeNum', 
         {
             data: {
                 'cart[id]': data.cartID,
                 'cart[goods_num]': data.goodsNum
             },
            success: function (res) {
                that.AsyncUpdateCart();  
            },
            failStatus:function(res){        
                that.data.requestData.cart_list[data.item]['goods_num'] = that.data.requestData.cart_list[data.item]['goods_num']  
                that.setData({
                    requestData: that.data.requestData
                })
                app.confirmBox(res.data.msg);
            }
        });
    },
    /** 查询购物车选中商品价格 */
    AsyncUpdateCart:function(){
        var that = this;
        var data = that.data.requestData.cart_list;           
        var str = ""
        for (var i = 0; i < data.length; i++){     
            if (i == 0) {
                str += "?cart[" + i + "][id]=" + data[i]['id'] 
                str += "&cart[" + i + "][selected]=" + data[i]['selected']
            } else{
                str += "&cart[" + i + "][id]=" + data[i]['id']
                str += "&cart[" + i + "][selected]=" + data[i]['selected']
            }                                         
        }
   
        request.get(that.data.url + '/api/cart/AsyncUpdateCart' + str,          
            {   
                isShowLoading:false,                      
                success: function (res) {
                    res.data.result.cart_list.forEach(function (item, i) {
                        if (item.combination_cart.length > 0 && item.combination) {
                            var total = 0.00;
                            item.combination_cart.forEach(function (items, i) {
                                total = total + items.cut_fee
                            })
                            item['combination']['total_cut_fee'] = item['cut_fee'] + total
                        }
                    })
                  res.data.result.cart_price_info.total_fee = res.data.result.cart_price_info.total_fee.toFixed(2);
                        that.setData({
                            requestData: res.data.result
                        })
                        that.doCheckAll(); 
                }
            });
    },
    checkAll:function(){
        var checkAll = !this.data.checkAllToggle;
        var cartList = this.data.requestData.cart_list;
        for (var i = 0; i < cartList.length;  i++){
            cartList[i]['selected'] = Number(checkAll)            
        }
        this.setData({ 'requestData.cart_list': cartList})
        this.AsyncUpdateCart();
    },

    checkItem: function (e) {
        var cart = this.data.requestData;
        cart.cart_list[e.currentTarget.dataset.item].selected = Number(!cart.cart_list[e.currentTarget.dataset.item].selected);
        this.setData({ requestData: cart})
        this.AsyncUpdateCart();    
    },

    doCheckAll: function () {
        var cartList = this.data.requestData.cart_list;
        var selected = 0;
        if (!cartList){
            return;
        }
        for (var i = 0, j = cartList.length; i < j; i++) {
            if (cartList[i].selected) {
                selected++;
                this.setData({
                    setTlement: true
                });           
            }
        }; 
        if (!selected){
            this.setData({
                setTlement: false
            });
        }
        if (selected == cartList.length){
            this.setData({
                checkAllToggle: true
            });
        }else{
            this.setData({
                checkAllToggle: false
            });            
        }
        
    },

    postCardList: function (postData) {
        var that = this;
        request.post(that.data.url + '/api/cart/index', {
            data: { cart_form_data: postData },
            success: function (res) {
                that.setData({
                    requestData: res.data.result
                });
                that.doCheckAll();                
            }
        });
    },

    getCardList: function () {
        var that = this;
        request.get(that.data.url + '/api/cart/index', {
            success: function (res) {         
                that.setData({
                    requestData: res.data.result
                });
                that.doCheckAll();
                that.AsyncUpdateCart();
                wx.stopPullDownRefresh();
            }
        });
    },

    onPullDownRefresh: function (e) {
        this.getCardList();
    },

    //去结算
    checkout: function () {
        //检查用户是否登录方可操作立即购买
        if (!app.auth.isAuth()) {
            app.showLoading(null, 1500);
            app.getUserInfo();
            return;
        }  
        var hasAnySelected = false;
        var cartList = this.data.requestData.cart_list;
        for (var i = 0; i < cartList.length; i++) {
            if (cartList[i].selected) {
                hasAnySelected = true;
                break;
            }
        }
        if (!hasAnySelected) {
            return;
        }
        wx.navigateTo({ url: '/pages/cart/cart2/cart2' });
    },

    // 底部导航栏跳转
    navigateToPage(e) {
        const index = parseInt(e.currentTarget.dataset.index);
        
        // 如果点击的是当前页面，不进行跳转
        if (index === 1) {
            return;
        }

        // 根据索引跳转到对应页面
        switch(index) {
            case 0: // 首页
                wx.reLaunch({
                    url: '/pages/index/index/index'
                });
                break;
            case 1: // 点单（购物车）
                // 当前页面，不跳转
                break;
            case 2: // 取单（订单列表）
                wx.reLaunch({
                    url: '/pages/user/order_list/order_list'
                });
                break;
            case 3: // 个人中心
                wx.reLaunch({
                    url: '/pages/user/index/index'
                });
                break;
        }
    }

});