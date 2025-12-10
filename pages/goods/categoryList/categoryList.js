var app = getApp();
var request = app.request;
var common = require('../../../utils/common.js');
var util = require('../../../utils/util.js');

Page({
    data: {
        url: app.globalData.setting.url,
        firstCategoris: [],
        categories: [],
        currentCategoryId: 0, //目前的第一分类id
        scrollHeight: 0, //界面高度，用于滚动
        defaultMenu: false,  //默认底部菜单显示状态
        types:1,            //分类风格 1 2 3 
        categorys2:[],
        goods:[],
        datas:[],
        openSpecModal: false, //是否打开规格弹窗
        goodsInputNum: 1, //选中的商品件数
        specSelect: 0, //选中的组合规格数组spec_goods_price下标
        optionItemId: 0, //页面参数，页面初始化指定显示的itemid，用于活动
        shippingCost: 0,
        hasSpec: true,
        select: { //选择的(规格)商品的参数，用于显示
            price: 0,
            stock: 0,
            specName: '',
            activity: null
        },
        isBragain: false,
        isSeparate: true,
    },

    onLoad: function() {
        var types = common.getConfigByName(app.globalData.config['config'], 'category_switch') || 1;
      console.log(types)
        if (types == 1) {      
            this.requestFirstCategoris();            
        } else if (types == 2) {
            this.requestCategoris(2);
        } else {
            this.requestCategoris(3);
        }

        if (app.globalData.menu_model.length == 0) {
            app.globalData.menu_index = 1
        } else {
            //遍历自定义底部，该页面在哪个位置
            for (var i in app.globalData.menu_model) {
                if (app.globalData.menu_model[i].app_url.indexOf('categoryList') != -1) {
                    app.globalData.menu_index = i;
                }
            }
        }
  
        this.setData({
            types: types,
            defaultMenu: app.globalData.defaultMenu,
            menu_index: app.globalData.menu_index,
            menu_model:app.globalData.menu_model,
        })        
    },
    //请求分类
    requestCategories: function (parenId) {
        var that = this;
        request.get('/api/goods/goodsSecAndThirdCategoryList', {
            data: { 'parent_id': parenId },
            success: function (res) {
                that.setData({
                    categories: res.data.result,
                    currentCategoryId: parenId
                });
            }
        });
    },
    adver:function(e){
        common.adverPage(e.currentTarget.dataset.type, e.currentTarget.dataset.url,this);
    },
    //切换第一分类
    switchFirstCategory: function (e) {
        this.changeType(e.currentTarget.dataset.id, e.currentTarget.dataset.index);
    },

    goodsList: function (e) {
        var catId = e.currentTarget.dataset.id;
        wx.navigateTo({ url: '/pages/goods/goodsList/goodsList?cat_id=' + catId, })
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
            this.setData({ webUrl: id });
            wx.navigateTo({ url: '/pages/index/webview/webview' });
        }else{
            wx.reLaunch({
                url: '../../index/customPage/customPage?id=' + this.data.menu_model[idx].app_url,
            })
        }
    },
    changeType:function(id,index){
        var that = this;
        if (that.data.types == 1) {
            that.requestCategories(id);        
        } else if (that.data.types == 2) {
            that.categoryHandle(that.data.datas, index);
        } else {
            that.categoryHandle(that.data.datas, index);
        }
    },
    /** 默认菜单 */
    topages: function (e) {
        var idx = e.currentTarget.dataset.idx;
        app.globalData.menu_index = idx;
        common.defaultTotabar(idx, 1);
    },
    requestFirstCategoris: function () {
        var that = this;
        request.get('/api/goods/goodsCategoryList', {
            isShowLoading: false,
            data:{
                new_ad:1
            },
            success: function (res) {
                var categories = res.data.result.category;
                if (categories.length == 0) {
                    return;
                }
                that.setData({ firstCategoris: categories, adv: res.data.result.adv});
                that.requestCategories(categories[0].id);
            }
        });
    },
    requestCategoris: function (types) {
        var that = this;
        request.get('/api/goods/categoryPage?category=' + types, {
            success: function (res) {
                if (res.data.status == 1) {
                    that.setData({ datas: res.data });
                    that.categoryHandle(res.data)
                }
            }
        });
    },
    /** 处理分类 */
    categoryHandle:function(datas,index){
        var that = this;
        var idx = !index ? 0 : index;
        that.setData({ firstCategoris: datas.category1, currentCategoryId: datas.category1[idx]['id'] });
        if(that.data.types == 2){
            let category2 = datas.category2;
            let categorys2 = [];
            for (var i = 0; i < category2.length; i++){
                if (category2[i]['parent_id'] == datas.category1[idx]['id']){
                    categorys2.push(category2[i])
                }
            }
            that.setData({ categorys2: categorys2})
        }
        if (that.data.types == 3) {
            let good = datas.goods;
            let goods = [];
            for (var i = 0; i < good.length; i++) {
                if (good[i]['cat_id'] == datas.category1[idx]['id']) {
                    goods.push(good[i])
                }
            }
            that.setData({ goods: goods })
        }
    },
  
    /** 规格相关s */

    /** 购买虚拟商品 */
    buyVirtualGoods: function (data) {
        //检查用户是否登录方可操作立即购买
        if (!app.auth.isAuth()) {
            app.showLoading(null, 1500);
            app.getUserInfo();
            return;
        }
        Object.assign(data, {
            goods_name: this.data.data.goods.goods_name,
            spec_name: this.data.select.specName,
            price: this.data.select.price,
        });
        wx.navigateTo({ url: '/pages/virtual/buy_step/buy_step?' + util.Obj2Str(data) });
    },

    /** 立即兑换 */
    exchange: function (data) {
        //检查用户是否登录方可操作立即购买
        if (!app.auth.isAuth()) {
            app.showLoading(null, 1500);
            app.getUserInfo();
            return;
        }
        if (app.globalData.userInfo.pay_points < this.data.data.goods.exchange_integral) {
            return app.showTextWarining('您的积分不够喔~');
        }
        if (this.data.shippingCost < 0 || this.data.select.stock <= 0 || !this.data.hasSpec) {
            return;
        }
        this.setData({ openSpecModal: false, enterAddressPage: true });
        wx.navigateTo({ url: '/pages/cart/integral/integral?' + util.Obj2Str(data) });
    },

    /** 立即预订 */
    reserve: function (data) {
        var that = this;
        //检查用户是否登录方可操作立即购买
        if (!app.auth.isAuth()) {
            app.showLoading(null, 1500);
            app.getUserInfo();
            return;
        }

        if (this.data.shippingCost < 0 || this.data.select.stock <= 0 || !this.data.hasSpec) {
            return;
        }
        Object.assign(data, {
            action: 'reserve',
            prom_id: that.data.select.activity.prom_id ? that.data.select.activity.prom_id : ''
        });
        this.setData({ openSpecModal: false, enterAddressPage: true });
        wx.navigateTo({ url: '/pages/cart/reserve/reserve?' + util.Obj2Str(data) });
    },

    /** 立即购买 */
    buyNow: function (data) {
        //检查用户是否登录方可操作立即购买
        if (!app.auth.isAuth()) {
            app.showLoading(null, 1500);
            app.getUserInfo();
            return;
        }
        if (this.data.shippingCost < 0 || this.data.select.stock <= 0 || !this.data.hasSpec) {
            return;
        }
        Object.assign(data, {
            action: 'buy_now',
        });
        this.setData({ openSpecModal: false, enterAddressPage: true });
        wx.navigateTo({ url: '/pages/cart/cart2/cart2?' + util.Obj2Str(data) });
    },


    /** 关闭规格弹窗 */
    closeSpecModal: function () {
        this.setData({ openSpecModal: false });
    },
    /** 打开规格弹窗 */
    openSpecModel: function (e) {
        var that = this;
        request.get('/api/goods/goodsInfo', {
            data: { id: e.currentTarget.dataset.goods_id },
            failRollback: true,
            success: function (res) {
                that.setData({ data: res.data.result, openSpecModal: true });
                that.initData(res.data.result);
            }
        });

    },
    /** 初始化数据，注意顺序 */
    initData: function (data) {
        //检查商品
        this.initCheckGoods(data);
        //检查一下购物的数量，可能无库存
        this.checkCartNum(this.data.goodsInputNum);
    },
    /** 检查商品 */
    initCheckGoods: function (data) {
        var that = this;
        request.post('/api/goods/activity', {
            data: {
                goods_id: data.goods.goods_id,
                item_id: data.goods.spec_goods_price.length > 0 ? data.goods.spec_goods_price[0]['item_id'] : '',
            },
            success: function (res) {
                //初始化规格
                if (res.data.result.goods.activity_is_on == 1) {
                    that.initSpecsPrice(res.data.result);
                } else {
                    data.goods.prom_type = 0;
                    that.initSpecsPrice(data);
                }
            }
        });
    },
    /** 初始化所有规格 */
    initSpecsPrice: function (data) {
        var specSelect = 0; //初始化选中第一个规格 
        var specs = this.data.data.goods.spec_goods_price;
        if (specs.length == 0) {
            //没有规格
            this.initActivity(data.goods);
            return;
        }
        //第一次请求的总数据中的activity默认是第一种规格的,可减少一次请求
        //specs[0].activity = data.goods;
        if (this.data.optionItemId) { //指定规格
            for (var i = 0; i < specs.length; i++) {
                if (specs[i].item_id == this.data.optionItemId) {
                    specSelect = i;
                    break;
                }
            }
        } else { //初始化选库存不为0的规格
            for (var i = 0; i < specs.length; i++) {
                if (specs[i].store_count <= 0) {
                    continue;
                }
                specSelect = i;
                break;
            }
        }
        specs[specSelect].activity = data.goods;
        //生成子规格组(goods_spec_list)的各自选中项
        var specIds = specs[specSelect].key.split("_");
        var list = this.data.data.goods.spec;
        for (var i = 0; i < list.length; i++) {
            for (var j = 0; j < list[i].spec_item.length; j++) {
                if (util.inArray(list[i].spec_item[j].id, specIds)) {
                    list[i].selectItemId = list[i].spec_item[j].id;
                    break;
                }
            }
        }
        this.setData({
            specSelect: specSelect,
            'data.goods_spec_list': list,
            'data.goods.spec_goods_price': specs
        });
        this.initSelectSpecGoods();
    },
    /** 初始化选中的规格商品 */
    initSelectSpecGoods: function () {
        var specSelect = this.data.specSelect;
        var specs = this.data.data.goods.spec_goods_price;
        var itemId = specs[specSelect].item_id;
        if (specs[specSelect].prom_type == 0) {
            var noActivity = { prom_type: 0 };
            specs[specSelect].activity = noActivity;
            this.initActivity(noActivity);
        } else if (typeof specs[specSelect].activity != 'undefined') {
            this.initActivity(specs[specSelect].activity);
        } else {
            this.requestSpecInfo(specSelect);
        }
    },
    /** 点击规格按钮的回调函数 */
    selectSpec: function (e) {
        //对商品数量进行判断，对库存进行判断
        var itemId = e.currentTarget.dataset.itemid;
        var listIdx = e.currentTarget.dataset.listidx;
        var list = this.data.data.goods_spec_list;
        if (list[listIdx].selectItemId == itemId) {
            return;
        }
        list[listIdx].selectItemId = itemId;
        var newSpecKeys = [];
        for (var i = 0; i < list.length; i++) {
            newSpecKeys[i] = list[i].selectItemId;
        }
        //item排序,生成key
        var newSpecKeys = util.sortSize(newSpecKeys).join('_');
        var newSpecSelect = 0;
        var specs = this.data.data.goods.spec_goods_price;
        var hasSpec = false;
        for (var i = 0; i < specs.length; i++) {
            if (specs[i].key == newSpecKeys) {
                hasSpec = true;
                newSpecSelect = i;
                break;
            }
        }
        this.setData({
            hasSpec: hasSpec,
            specSelect: newSpecSelect,
            'data.goods_spec_list': list,
            isBragain: this.data.isSeparate ? false : true,
        });
        this.initSelectSpecGoods();
        this.checkCartNum(this.data.goodsInputNum);
    },
    /** 初始化显示的活动信息 */
    initActivity: function (activity) {
        if (activity.prom_type && activity.prom_type != 6) {
            var startTime = (new Date()).getTime();
            if (activity.prom_type == 1) { //抢购
                activity.priceName = '抢购价';
                activity.countName = '限时抢购';
            } else if (activity.prom_type == 2) { //团购
                activity.priceName = '团购价';
                activity.countName = '限时团购';
            } else if (activity.prom_type == 3) { //促销
                activity.countName = '优惠促销';
            } else if (activity.prom_type == 4) { //预售
                activity.priceName = '预售价';
                activity.countName = '预售商品';
            } else if (activity.prom_type == 8) { //砍价
                !this.data.isBragain ? activity.priceName = '砍价享' : activity.priceName = ''
                !this.data.isBragain ? activity.countName = '砍价活动' : activity.countName = ''
            }

            activity.countTime = '--天--时--分--秒';
            if (!activity.diffTime) {
                activity.diffTime = (new Date()).getTime() - activity.server_current_time * 1000;
            }
        } else if (activity.prom_type == 6) {
            activity.countName = '该商品正在参与拼团';
            activity.goods_id = activity.goods_id;
            activity.team_id = activity.prom_id ? activity.prom_id : 0;
            activity.item_id = activity.item_id ? activity.item_id : 0;
        }
        this.setData({ 'select.activity': activity });
        this.destroyActivityTimer();
        this.createActivityTimer();
        this.initSelectedData();
    },

    /** 初始化选中的（规格）商品的显示参数 */
    initSelectedData: function () {
        var goods = this.data.data.goods;
        var activity = this.data.select.activity;
        var specs = this.data.data.goods.spec_goods_price;
        var specSelect = this.data.specSelect;
        var stock = 0;
        var price = 0;
        if (activity.prom_type == 1 || activity.prom_type == 2) {
            price = activity.shop_price;
            stock = activity.store_count;
        } else if (activity.prom_type == 3) {
            price = activity.shop_price;
            // stock = specs.length > 0 ? specs[specSelect].store_count : goods.store_count;
            stock = activity.store_count;
        } else if (activity.prom_type == 4) {
            price = activity.shop_price;
            //stock = specs.length > 0 ? specs[specSelect].store_count : goods.store_count;
            stock = activity.store_count;
        }
        else if (activity.prom_type == 8 && !this.data.isBragain) {
            price = activity.end_price ? activity.end_price : activity.shop_price;
            stock = activity.store_count;
            this.setData({
                'select.bargain_price': price,
            });
        }
        else if (specs.length > 0) {
            price = specs[specSelect].price;
            stock = specs[specSelect].store_count;
        } else {
            price = goods.shop_price;
            stock = goods.store_count;
        }
        this.setData({
            'select.price': price,
            'select.stock': stock,
            'select.specName': specs.length > 0 ? specs[specSelect].key_name : '',
        });
        if (this.data.isBragain) {
            this.setData({ isBragain: false })
        }
    },

    /** 检查是否倒计时是否结束 */
    checkActivityTime: function () {
        var that = this;
        var activity = that.data.select.activity;
        var remainTime = activity.end_time * 1000 - (new Date()).getTime() + activity.diffTime;
        if (remainTime > 0) {
            remainTime = util.remainTime(remainTime);
            that.setData({ 'select.activity.countTime': remainTime });
        } else {
            that.requestSpecInfo(that.data.specSelect);
            return;
        }
    },

    /** 创建活动倒计时定时器 */
    createActivityTimer: function () {
        var that = this;
        var activity = that.data.select.activity;
        if (!activity.prom_type || activity.prom_type == 6 || that.data.isBragain) {
            return;
        }
        that.data.timer = setInterval(function () {
            that.checkActivityTime();
        }, 1000);
    },

    /** 销毁活动倒计时定时器 */
    destroyActivityTimer: function () {
        if (this.data.timer) {
            clearInterval(this.data.timer);
            this.data.timer = null;
        }
    },
    /** 请求规格商品的活动信息 */
    requestSpecInfo: function (specSelect) {
        var that = this;
        var specs = that.data.data.goods.spec_goods_price;
        request.get('/api/goods/activity', {
            data: {
                goods_id: that.data.data.goods.goods_id,
                item_id: specs.length > 0 ? specs[specSelect].item_id : '',
            },
            success: function (res) {
                if (res.data.result.goods.activity_is_on == 1) {
                    that.initActivity(res.data.result.goods);
                }
            }
        });
    },

    /** 减少购买的商品数量 */
    subCartNum: function (e) {
        this.checkCartNum(this.data.goodsInputNum - 1);
    },
    /** 增加购买的商品数量 */
    addCartNum: function (e) {
        this.checkCartNum(this.data.goodsInputNum + 1);
    },
    /** 输入购买的数量 */
    inputCartNum: function (e) {
        this.checkCartNum(Number(e.detail.value));
    },

    /** 检查购买的数量 */
    checkCartNum: function (num) {
        var specs = this.data.data.goods.spec_goods_price;
        var specSelect = this.data.specSelect;
        var activity = this.data.select.activity;
        var stock = this.data.data.goods.store_count;
        //参与活动
        if (activity && activity.activity_is_on == 1) {
            stock = activity.store_count
        } else {
            if (specs.length > 0) {
                stock = specs[specSelect].store_count;
            }
        }

        if (num > stock || stock == 0) {
            num = stock;
        } else if (num < 1) {
            num = 1;
        }
        this.setData({ goodsInputNum: num });
    },
    /** 加入购物车 */
    addCart: function (e) {
        var that = this;
        var itemId = 0;
        var specs = this.data.data.goods.spec_goods_price;
        //区分有规格和无规格
        if (specs.length > 0) {
            if (specs[this.data.specSelect].store_count <= 0) {
                return app.showTextWarining("当前无库存！");
            }
            itemId = specs[this.data.specSelect].item_id;
        } else {
            if (this.data.data.goods.store_count <= 0) {
                return app.showTextWarining("当前无库存！");
            }
        }
        if (this.data.goodsInputNum <= 0) {
            return app.showTextWarining("商品数量不能小于1");
        }
        var data = {
            goods_id: this.data.data.goods.goods_id,
            goods_num: this.data.goodsInputNum,
            item_id: itemId
        };
        if (this.data.data.goods.is_virtual) {
            return this.buyVirtualGoods(data);
        }
        if (e.currentTarget.dataset.action == 'add') { //加入购物车
            if (this.data.shippingCost < 0 || this.data.select.stock <= 0 || !this.data.hasSpec) {
                return;
            }
            request.post('/api/cart/add', {
                data: data,
                success: function (res) {
                    that.setData({ openSpecModal: false });
                    request.checkUniqueId();
                    app.showSuccess('添加成功');
                }
            });
        } else if (e.currentTarget.dataset.action == 'exchange') { //立即兑换
            this.exchange(data);
        } else if (e.currentTarget.dataset.action == 'reserve') { //立即预订
            this.reserve(data);
        } else { //立即购买
            this.buyNow(data);
        }
    },


    /** 砍价购买 */
    bargainBuy: function (e) {
        var that = this;
        if (!app.auth.isAuth()) {
            app.showLoading(null, 1500);
            app.getUserInfo();
            return;
        }
        var data = e.currentTarget.dataset;
        if (data.status) {
            //砍价拿
            that.setData({ openSpecModal: false });
            var specs = that.data.data.goods.spec_goods_price;
            var specSelect = that.data.specSelect;
            var item_id = specs.length > 0 ? specs[specSelect]['item_id'] : ''

            if (that.data.select.stock == 0 || Number(that.data.select.stock) - Number(that.data.goodsInputNum) < 0) {
                that.setData({ goodsInputNum: 1 });
                return app.showTextWarining('砍价库存不足!');
            }

            wx.showModal({
                content: '确定发起砍价吗?',
                success: function (res) {
                    if (res.confirm) {
                        //去下单，并且发起砍价活动
                        request.post('/api/Bargain/start_bargain', {
                            data: {
                                bargain_id: that.data.select.activity.prom_id,
                                goods_num: that.data.goodsInputNum,
                                item_id: item_id,
                            },
                            success: function (res) {
                                if (1 == res.data.status) {
                                    wx.navigateTo({
                                        url: '/pages/Bargain/bargain/bargain?id=' + res.data.result.id
                                    })
                                } else {
                                    app.showTextWarining(res.data.msg);
                                }
                            }
                        });
                    }
                }
            })
        } else {
            //单独购
            that.addCart(e);
        }
    },
    /** 规格相关e */

})