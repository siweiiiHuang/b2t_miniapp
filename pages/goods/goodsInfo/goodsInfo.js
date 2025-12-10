var util = require('../../../utils/util.js');
var common = require('../../../utils/common.js');
var WxParse = require('../../../utils/wxParse/wxParse.js');
var app = getApp();
var request = app.request;
var setting = app.globalData.setting;

Page({
    data: {
        url: setting.url,
        resourceUrl: setting.resourceUrl,
        defaultAvatar: setting.resourceUrl + "/static/images/user68.jpg",
        data: null, //请求的商品详情数据
        result: null,
        content: '', //商品详情页html
        goodsAttrs: null, //商品属性列表
        cartGoodsNum: 0, //购物车商品数量
        specSelect: 0, //选中的组合规格数组spec_goods_price下标
        optionItemId: 0, //页面参数，页面初始化指定显示的itemid，用于活动
        goodsInputNum: 1, //选中的商品件数
        openSpecModal: false, //是否打开规格弹窗
        openPromModal: false, //是否打开优惠信息弹窗
        activeCategoryId: 0, //商品主页tab
        supportPageScroll: false, //微信版本是否支持页面滚动回顶部
        address: {
            address: '',
            district: 0,
        },
        shipping: '',
        shippingCost: 0,
        hasSpec: true,
        enterAddressPage: false,
        categories: [
            { name: "商品", id: 0 },
            { name: "详情", id: 1 },
            { name: "评论", id: 2 }
        ],
        activeCategoryId2: 0, //商品内容tab
        categories2: [
            { name: "商品详情", id: 0 },
            { name: "规格参数", id: 1 },
        ],
        activeCategoryId3: 0, //商品评论tab
        categories3: [
            { name: "全部评价", id: 0, num: 0 },
            { name: "好评", id: 1, num: 0 },
            { name: "中评", id: 2, num: 0 },
            { name: "差评", id: 3, num: 0 },
            { name: "有图", id: 4, num: 0 }
        ],
        select: { //选择的(规格)商品的参数，用于显示
            price: 0,
            stock: 0,
            specName: '',
            activity: null
        },
        timer: null, //活动倒计时定时器
        imChoose: 0, //0 QQ客服,1 IM客服,2 小能客服
        imgs:[],     //商品图片组
        options: null,
        share_btn:false, //自定义分享按钮状态
        actionSheetHidden:true,  //自定义actionSheet隐藏True
        activityIn:0,
        isBragain:false,
        isSeparate:true,
        cardList:[],
        combinations:[], //搭配购
        maskShow:true,
        showCar:false,
        showYes:false,
		showStore: false,
    },

    onLoad: function (options) {
        console.log(options)
        if (options.scene){
            var scene = decodeURIComponent(options.scene)
            var data = scene.split('&')
            options.goods_id = data[0].split('=')[1]
            options.item_id = data[1].split('=')[1]
            options.first_leader = data[2].split('=')[1] 
        }
        var that = this;
        if (options.first_leader) {
            wx.setStorageSync('first_leader', options.first_leader);
        }
        var userInfo = wx.getStorageSync('app:userInfo');
        that.setData({ userInfo: userInfo });      
        app.getConfig(function (res) {
            var im_choose = common.getConfigByName(res.config, 'im_choose');
            var guarantee = common.getConfigByName(res.config, 'auto_service_date');
            var point_rate = common.getConfigByName(res.config, 'point_rate');
            that.setData({ imChoose: im_choose, auto_service_date: guarantee, point_rate: point_rate});
        });  
        that.data.optionItemId = typeof options.item_id == 'undefined' ? 0 : options.item_id;
        request.get('/api/goods/goodsInfo', {
            data: { id: options.goods_id },
            failRollback: true,
            isShowLoading:false,
            success: function(res) {                          
                that.setData({ result: res.data.result, data: res.data.result });
                that.initData(res.data.result);
                that.requestGoodsContent();                      
                that.getUserAddress(res.data.result);   
                that.requestCardList(); 
            }
        });
        that.requestCardNum();
        //是否支持返回按钮
        if (wx.pageScrollTo) {
            that.setData({ supportPageScroll: true });
        }
		
		 if (app.globalData.is_apply != 1) {
            that.setData({ showStore: true });
        }
    },

    //重新刷新物流数据
    onShow: function () {
        if (this.data.enterAddressPage) {
            this.data.enterAddressPage = false;
            this.getUserAddress(this.data.result);
        }
    },

    /**查询商品物流 */
    refreshDispatch: function (result, consigneeAddress) {
        var that = this;
        that.setData({
            'address.address': consigneeAddress.address2 || consigneeAddress.address,
            'address.district': consigneeAddress.district,
        });           
        request.get('/api/goods/dispatching', {
            data: {
                goods_id: result.goods.goods_id,
                region_id: consigneeAddress.district,
            },
            isShowLoading: false,
            success: function (res) {
                var shippinginfo;
                if (res.data.result.freight > 0) {
                    shippinginfo = '￥' + res.data.result.freight;
                    that.setData({ shippingCost: res.data.result.freight });
                } else if (res.data.result.freight == 0) {
                    shippinginfo = '包邮';
                    that.setData({ shippingCost: res.data.result.freight });
                } else {
                    shippinginfo = res.data.msg;
                    that.setData({ shippingCost: -1 });
                }
                that.setData({ shipping: shippinginfo });
            },
            failStatus: function(res){
                if (res.data.status == 0){
                    that.setData({ shipping: res.data.msg });
                    that.setData({ shippingCost: -1 });
                    app.showTextWarining(res.data.msg);
                }
                return false;
            },
        });
    },

    enterAddress: function () {
        this.data.enterAddressPage = true;
        wx.navigateTo({ url: '/pages/user/address_list/address_list?operate=selectAddress' });
    },

    onUnload: function () {
        this.destroyActivityTimer();
    },

    /** 初始化数据，注意顺序 */
    initData: function (data) {
        //获取推荐商品
        this.getRecommendGoods(data);
        //初始化评论
        this.initComment(data);        
        //检查商品
        this.initCheckGoods(data);
        //初始化规格
        //this.initSpecsPrice(data);
        //检查一下购物的数量，可能无库存
        //this.checkCartNum(this.data.goodsInputNum);
        //处理商品轮播图片
        this.goodsImages(data);        
    },
    getCombination: function (data,item_id){
        var that = this;
        request.post('/Home/Goods/combination', {
            data: {
                goods_id: data.goods.goods_id,
                item_id: item_id ?item_id:that.data.optionItemId,
            },
            isShowLoading: false,
            success: function (res) {
                that.setData({ combinations: res.data.result || [] })
            }
        });     
    },
    /** 商品图片组 */
    goodsImages: function (data) {
        var img = data.goods.goods_images;
        var imgs = [];
        for(var i = 0; i< img.length; i ++){
            imgs.push(this.data.url + img[i]['image_url'])
        }
        this.setData({ imgs:imgs});
    },

    /** 查看图片 */
    look: function (e) {
        wx.previewImage({
            current: e.currentTarget.dataset.src, // 当前显示图片的http链接
            urls: this.data.imgs // 需要预览的图片http链接列表
        })
    },

    /** 检查商品 */
    initCheckGoods: function (data){    
        var that = this;          
        var item_id = data.goods.spec_goods_price.length > 0 ? data.goods.spec_goods_price[0]['item_id'] : ''; 
        if (that.data.optionItemId){
            item_id = that.data.optionItemId;
        }     
        request.get('/api/goods/activity', {
            data: {
                goods_id: data.goods.goods_id,
                item_id: item_id,
            },
            isShowLoading: false,
            success: function (res) {
                //初始化规格
                if (res.data.result.goods.activity_is_on == 1){                        
                    that.initSpecsPrice(res.data.result);                                               
                }else{              
                    data.goods.prom_type = 0;
                    that.initSpecsPrice(data);
                }                                       
            }
        });         
    },

    /** 获取该分类推荐商品 */
    getRecommendGoods: function (data){
        var that = this;
        request.get('/api/goods/recommendGoods', {
            data: {
                cat_id: data.goods.cat_id,
            },
            isShowLoading: false,
            success: function (res) {
                that.data.data.recommend_goods = res.data.result || [];
                that.setData({data: that.data.data});
            },
        });
    },

    /** 获取用户地址 */
    getUserAddress: function (result) {
        var that = this;
        var consigneeAddress = wx.getStorageSync('goodsInfo:goodsInfo:address');
        if (consigneeAddress){
            if (that.data.data.goods.is_virtual!=1){
                that.refreshDispatch(result, consigneeAddress);
            }
        }else{
            request.post('/api/goods/getDefaultAddress', {
                data: { goods_id: result.goods.goods_id },
                isShowLoading: false,
                success: function (res) {
                    if (that.data.data.goods.is_virtual != 1){
                        that.refreshDispatch(result, res.data.result);
                    }
                }
            });
        }
    },

    /** 初始化评论相关 */
    initComment: function (data) {   
        //好评率
        data.goods.goodCommentRate = data.goods.comment_statistics.total_sum > 0 ?  data.goods.comment_statistics.high_rate:0;
        //评论数
        this.data.categories3[0].num = data.goods.comment_statistics.total_sum;
        this.data.categories3[1].num = data.goods.comment_statistics.high_sum;
        this.data.categories3[2].num = data.goods.comment_statistics.center_sum;
        this.data.categories3[3].num = data.goods.comment_statistics.low_sum;
        this.data.categories3[4].num = data.goods.comment_statistics.img_sum;
        //渲染视图
        this.setData({
            categories3: this.data.categories3,      
            data: data,
        });
    },

    /** 初始化所有规格 */
    initSpecsPrice: function (data) {     
        var specSelect = 0; //初始化选中第一个规格 
        var specs = this.data.data.goods.spec_goods_price;
        if (specs.length == 0) {
            //没有规格
            this.initActivity(data.goods);
            //检查一下购物的数量，可能无库存
            this.checkCartNum(this.data.goodsInputNum);
            //获取搭配购活动商品
            this.getCombination(data);
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
        //获取搭配购活动商品
        this.getCombination(data, specs[specSelect].item_id);
        //检查一下购物的数量，可能无库存
        this.checkCartNum(this.data.goodsInputNum);
        this.initSelectSpecGoods();
    },

    /** 初始化选中的规格商品 */
    initSelectSpecGoods: function () {
        var specSelect = this.data.specSelect;
        var specs = this.data.data.goods.spec_goods_price;
        var itemId = specs[specSelect].item_id;
      if (specs[specSelect].prom_type == 0 || specs[specSelect].prom_type == 7) {
            var noActivity = { prom_type: 0 };       
            this.initActivity(noActivity);
        } else if (typeof specs[specSelect].activity != 'undefined') {
            this.initActivity(specs[specSelect].activity);
        }else {
            this.requestSpecInfo(specSelect);
        }
    },

    /** 请求规格商品的活动信息 */
    requestSpecInfo: function (specSelect) {       
        var that = this;
        var specs = this.data.data.goods.spec_goods_price;
        request.get('/api/goods/activity', {
            data: {
                goods_id: this.data.data.goods.goods_id,
                item_id: specs.length > 0 ? specs[specSelect].item_id : '' ,
            },
            isShowLoading: false,
            success: function (res) {
                if (res.data.result.goods.activity_is_on == 1) {
                  that.initActivity(res.data.result.goods);
                }else{
                  that.initActivity(that.data.data.goods);
                }                     
            }
        });
    },

    /** 初始化显示的活动信息 */
    initActivity: function (activity) {
        if (activity.prom_type && activity.prom_type != 6) {
            var startTime = (new Date()).getTime();
            if (activity.prom_type == 1) {       //抢购
                activity.priceName = '抢购价';
                activity.countName = '限时抢购';
            } else if (activity.prom_type == 2) { //团购
                activity.priceName = '团购价';
                activity.countName = '限时团购';
            } else if (activity.prom_type == 3) { //促销
                activity.countName = '优惠促销';
            } else if (activity.prom_type == 4) { //预售
                activity.priceName = '预售价';
                activity.countName = '预售';
            } else if (activity.prom_type == 8  ) { //砍价
                !this.data.isBragain ? activity.priceName = '砍价享' : activity.priceName =''
                !this.data.isBragain ? activity.countName = '砍价活动' : activity.countName = ''
                !this.data.isBragain && this.barGainShar(activity);                
            }
                activity.countTime = '--天--时--分--秒';
                if (!activity.diffTime) {
                    activity.diffTime = (new Date()).getTime() - activity.server_current_time * 1000;
                }         
        } else if (activity.prom_type == 6){
            activity.countName = '该商品正在参与拼团';
            activity.goods_id = activity.goods_id;
            activity.team_id = activity.prom_id ? activity.prom_id : 0;
            activity.item_id = activity.item_id ? activity.item_id : 0;
        } 
        this.setData({ 'select.activity': activity});
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
        var specImg = "/api/goods/goodsThumImages?goods_id=" + this.data.data.goods.goods_id + "&width=200&height=200";
        if (activity.prom_type == 1 || activity.prom_type == 2) {
            price = activity.shop_price;
            stock = activity.store_count;
        } else if (activity.prom_type == 3) {
            price = activity.shop_price;
            //stock = specs.length > 0 ? specs[specSelect].store_count : activity.store_count;
            stock =  activity.store_count;
        } else if (activity.prom_type == 4) {
            price = activity.shop_price;
            //stock = specs.length > 0 ? specs[specSelect].store_count : activity.store_count;
            stock =  activity.store_count;
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
        }     
        else {
            price = goods.shop_price;
            stock = goods.store_count;
        }
        if (this.data.data.goods.exchange_integral > 0) {
            var exchange_integral_price = price - (this.data.data.goods.exchange_integral / this.data.point_rate )
        }

        if (specs.length > 0) {
            specImg = specs[specSelect].spec_img;
            if (!specImg) {
                specImg = "/api/goods/goodsThumImages?goods_id=" + this.data.data.goods.goods_id + "&width=200&height=200";
            }
        }
        if (specImg.indexOf('http') < 0 && specImg.indexOf('https') < 0) {
            specImg = this.data.url + specImg;
        }
  
        this.setData({
            exchange_integral_price: exchange_integral_price ? exchange_integral_price.toFixed(2):0,
            'select.price': parseFloat(price).toFixed(2).split('.'),
            'select.stock': stock,
            'select.specName': specs.length > 0 ? specs[specSelect].key_name : '',  
            'select.spec_img': specImg,              
        });
        if (this.data.isBragain){
            this.setData({ isBragain:false})
        }
    },
    /** 获取正在参与砍价人员 */
    barGainShar: function (activity){
        //参与人数
        if (!activity.bargain){
            return;
        }
        var list_count = Number(activity.bargain.virtual_num) + Number(activity.bargain_list.length);
        if (list_count >= 10000) {
            list_count = (list_count / 10000).toFixed(1) + '万';
        }
        
        //虚拟头像
        var photo = ['https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=1788562038,3472846301&fm=27&gp=0.jpg',
            'https://ss0.bdstatic.com/70cFuHSh_Q1YnxGkpoWK1HF6hhy/it/u=1091628847,41930541&fm=27&gp=0.jpg',
            'https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=1285622578,302277335&fm=27&gp=0.jpg',
            'https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=3893578947,513342183&fm=27&gp=0.jpg',
            'https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=1880698741,2631508258&fm=27&gp=0.jpg',
            'https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=3859421672,511986628&fm=200&gp=0.jpg',
        ];



        if (activity.bargain_list.length < 6 ) {
            for (var y = 0; y < activity.bargain_list.length; y++) {
                var str = activity.bargain_list[y]['head_pic'];
                if (photo.indexOf(str) != -1 ) {
                       return ;
                    }   
                if (activity.bargain_list[y]['head_pic'].indexOf('http') == -1) {
                    activity.bargain_list[y]['head_pic'] = this.data.url + activity.bargain_list[y]['head_pic']
                }                  
            }


            if (Number(activity.bargain.virtual_num) + Number(activity.bargain_list.length) >= 6) {
                var le = 6 - activity.bargain_list.length ;
            } else {
                var le = activity.bargain.virtual_num;              
            }
            if (le > 0 ){
                for (var i = 0; i < le; i++) {
                    activity.bargain_list.push({ head_pic: photo[i],types:1})
                }
            }            
        }
        this.setData({ 
         'select.activity.bargain_list': activity.bargain_list,
          activityIn : list_count 
         });
    },

    /** 检查是否倒计时是否结束 */
    checkActivityTime: function (){
        var that =this;
        var activity = that.data.select.activity;
        var remainTime = activity.end_time * 1000 - (new Date()).getTime() + activity.diffTime;
        if (remainTime > 0 ) {
            remainTime = util.remainTime(remainTime);
            that.setData({ 'select.activity.countTime': remainTime });
        }else{
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

    /** 商品首页 */
    tabClick: function (e) {
        var typeId = e.currentTarget.id;
        this.setData({
            activeCategoryId: typeId
        });
        if (typeId == 1) {
            this.tabGoodsContent();
        } else if (typeId == 2) {
            this.tabComment();
        }
    },

    /** 商品详情页 */
    tabClick2:function (e) {
        this.setData({
            activeCategoryId2: e.currentTarget.id
        });
    },

    /** 评论页 */
    tabClick3: function (e) {
        if (e.currentTarget.id == this.data.activeCategoryId3) {
            return;
        }
        this.setData({ activeCategoryId3: e.currentTarget.id });
        this.requestComments(this.data.data.goods.goods_id, e.currentTarget.id);
    },

    /** 请求评论数据 */
    requestComments: function (goodsId, commentType) {
        var that = this;
        commentType++;
        var requestUrl = that.data.url + '/api/goods/getGoodsComment?goods_id=' + goodsId + '&type=' + commentType;
        request.get(requestUrl, {
            isShowLoading: false,
            success: function (res) {
                var comments = res.data.result;
                for (var i = 0; i < comments.length; i++) {
                    comments[i].addTimeFormat = util.formatTime(comments[i].add_time);
                    comments[i].head_pic = common.getFullUrl(comments[i].head_pic);
                }
                that.setData({ comments: comments });
            }
        });
    },

    tocart:function(){
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

    /** 返回顶部 */
    doScrollTop: function () {
        wx.pageScrollTo({ scrollTop: 0 });
    },

    /** 打开评论页 */
    tabComment: function () {
        this.setData({ activeCategoryId: 2 });
        if (!this.data.comments) {
            this.requestComments(this.data.data.goods.goods_id, this.data.activeCategoryId3);
        }
    },

    /** 打开商品内容页 */
    tabGoodsContent: function () {
        this.setData({ activeCategoryId: 1 });
    },

    /** 请求商品详情页嵌入的html内容 */
    requestGoodsContent: function () {
        var that = this;
        request.get('/api/goods/goodsContent', {
            data: { id: this.data.data.goods.goods_id },
            // isShowLoading: false,
            success: function (res) {
                WxParse.wxParse('content', 'html', res.data.result.goods_content, that, 6);
                //网页中的图片加上域名
                common.wxParseAddFullImageUrl(that, 'content');
                that.setData({ goodsAttrs: res.data.result.goods_attr_list });
            },
        });
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
            optionItemId: this.data.data.goods.spec_goods_price[newSpecSelect].item_id,
            isBragain: this.data.isSeparate?false:true,
        });
        this.getCombination(this.data.data, this.data.data.goods.spec_goods_price[newSpecSelect].item_id);
        this.initSelectSpecGoods();
        this.checkCartNum(this.data.goodsInputNum);
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
      if (this.data.data.goods.is_virtual>0 && this.data.data.goods.is_virtual !=2) {
            return this.buyVirtualGoods(data);
        }
        if (e.currentTarget.dataset.action == 'add') { //加入购物车
            if (this.data.shippingCost < 0 || this.data.select.stock <= 0 || !this.data.hasSpec) {
                return;
            }
            request.post('/api/cart/add', {
                data: data,
                isShowLoading: false,
                success: function (res) {                  
                    that.setData({ openSpecModal:false});
                    request.checkUniqueId(); 
                    app.showSuccess('添加成功', that.requestCardNum());
                }
            });
        } else if (e.currentTarget.dataset.action == 'reserve') { //立即预订
            this.reserve(data);
        }else if (e.currentTarget.dataset.action == 'exchange') { //立即兑换
            this.exchange(data);
        }  else { //立即购买
            this.buyNow(data);
        }
    },

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
            prom_id: that.data.select.activity.prom_id ? that.data.select.activity.prom_id : '',
        });
        this.setData({ openSpecModal: false, enterAddressPage: true });
        wx.navigateTo({ url: '/pages/cart/reserve/reserve?' + util.Obj2Str(data) });
    },

    /** 立即兑换 */
    exchange: function (data) {
        //检查用户是否登录方可操作立即购买
        if (!app.auth.isAuth()) {
            app.showLoading(null, 1500);
            app.getUserInfo();
            return;
        } 
        let that = this
        that.setData({ openSpecModal: false, enterAddressPage: true });
        request.post('/api/cart/buyIntegralGoods', {
          data: data,
            isShowLoading: false,
          success: function (res) {
            if (1 == res.data.status){
              wx.navigateTo({ url: '/pages/cart/integral/integral?' + util.Obj2Str(data) });  
            }
          }
        });
      
       
        // if (app.globalData.userInfo.pay_points < this.data.data.goods.exchange_integral ){
          
        //     return app.showTextWarining('您的积分不够喔~');
        // }

        // if (this.data.shippingCost < 0 || this.data.select.stock <= 0 || !this.data.hasSpec){
        //     return;
        // }
        
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

    /** 增加购买的商品数量 */
    addCartNum: function (e) {
        this.checkCartNum(this.data.goodsInputNum + 1);
    },

    /** 减少购买的商品数量 */
    subCartNum: function (e) {
        this.checkCartNum(this.data.goodsInputNum - 1);
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
        if (activity && activity.activity_is_on  ==  1){
            stock = activity.store_count
        }else{
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

    /** 关闭规格弹窗 */
    closeSpecModal: function () {
        this.setData({ openSpecModal: false });
    },

    /** 打开规格弹窗 */
    openSpecModel: function (e) {
      this.setData({ openSpecModal: true, isSeparate: true, addCartType:e.currentTarget.dataset.type});
    },

    /** 打开砍价规格弹框 */
    openSpecModelBargain:function(e){
        var data = e.currentTarget.dataset;
        this.setData({ openSpecModal: true});        
        //单独购
        if (data.a == 1){
            this.setData({ isSeparate: false, isBragain: true});                
        }else{
            // wx.showLoading({mask: true});      
            this.setData({ isSeparate: true,isBragain: false });              
        }
        this.initActivity(this.data.data.goods);
    },
    /** 砍价购买 */
    bargainBuy:function(e){
        var that = this;
        if (!app.auth.isAuth()) {
            app.showLoading(null, 1500);
            app.getUserInfo();
            return;
        }     
        var data = e.currentTarget.dataset;
        if (data.status) {
            if (that.data.shippingCost < 0 || that.data.select.stock <= 0 || !that.data.hasSpec) {
                return;
            }
            //砍价拿
            that.setData({ openSpecModal: false });                
            var specs = that.data.data.goods.spec_goods_price;
            var specSelect = that.data.specSelect;
            var item_id = specs.length > 0 ?  specs[specSelect]['item_id']:''   

            if (that.data.select.stock == 0 || Number(that.data.select.stock) - Number(that.data.goodsInputNum)  < 0){   
                that.setData({ goodsInputNum:1})  ;    
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
                            isShowLoading: false,
                            success: function (res) {
                                if (1 == res.data.status) {
                                    wx.navigateTo({
                                        url: '/pages/Bargain/bargain/bargain?id=' + res.data.result.id
                                })
                              }else{
                                    app.showTextWarining(res.data.msg);
                              }
                            }
                        });
                    } 
                }
            })
        }else{
            //单独购
            that.addCart(e);
        }
    },

    collectGoods: function () {
        var that = this;
        request.post('/api/goods/collectGoodsOrNo',{
            data: { goods_id: that.data.data.goods.goods_id },
            isShowLoading: false,
            success: function (res) {
                app.showSuccess(res.data.msg);
                that.setData({ 'data.collect': !that.data.data.collect });
            }
        });
    },

    /** 联系客服 */
    contactService: function () {
        app.getConfig(function (res) {
            var phone = common.getConfigByName(res.config, 'phone');
            if(phone){
                app.confirmBox('请联系客服：' +phone,function(){
                    wx.makePhoneCall({
                        phoneNumber: phone,
                    });
                });
            }
        });
    },

    /** 请求购物车数量 */
    requestCardNum: function () {
        var that = this;
        request.get('/api/cart/getCartNum', {
            isShowLoading: false,
            success: function (res) {
                that.setData({ cartGoodsNum: res.data.result });
            }
        });
    },

    /** 获取可领券的优惠券 */
    requestCardList: function () {
        var that = this;
        request.get('/api/activity/coupon_center', {
            data:{
                cat_id: that.data.result.goods.cat_id,
                goods_id: that.data.result.goods.goods_id,
            },
            isShowLoading: false,
            success: function (res) {
                that.setData({cardList:res.data.result || [] })
            }
        });
    },
    /** 领取卡券 */
    getCardList:function(){
        wx.navigateTo({
            url: '../../activity/coupon_list/coupon_list?type=goodsinfo',
        })
    },

    /** 预览图片 */
    previewCommentImgs: function (e) {
        var imgs = this.data.comments[e.currentTarget.dataset.cidx].img;
        wx.previewImage({ 
            current: imgs[e.currentTarget.dataset.id],
            urls: imgs
        });
    },

    /** 预览图片 */
    previewGoodsCommentImgs: function (e) {
        var that = this;
        var imgs = this.data.data.comment[e.currentTarget.dataset.cidx].img;
        imgs = imgs.map(function(val) {
            return that.data.url + val;
        });
        wx.previewImage({ 
            current: imgs[e.currentTarget.dataset.id],
            urls: imgs
        });
    },

    /** 关闭优惠信息弹窗 */
    closePromModal: function () {
        this.setData({ openPromModal: false });
    },

    /** 打开优惠信息弹窗 */
    openPromModal: function () {
        this.setData({ openPromModal: true });
    },


    catchShare:function(){
        this.setData({
            actionSheetHidden:false
        })

    },

    listenerActionSheet: function (e) {
        this.setData({
            actionSheetHidden: !this.data.actionSheetHidden
        })
    },

    /**
     * 获取商品分享海报
     */
    getSharePic:function(){
        var that = this
        that.setData({
            actionSheetHidden: !this.data.actionSheetHidden
        })
        wx.showLoading({
            title:'正在生成',
            mask:true,
        })
        var item_id = (that.data.data.goods.spec_goods_price.length) > 0 ? that.data.data.goods.spec_goods_price[that.data.specSelect].item_id : 0
        wx.getImageInfo({
            src: that.data.url + '/api/goods/goodsSharePoster?id=' + that.data.data.goods.goods_id 
            + '&item_id=' + item_id
            + '&prom_id=' + that.data.data.goods.prom_id
            + '&prom_type=' + that.data.data.goods.prom_type
            + '&leader_id=' + wx.getStorageSync('app:userInfo')['user_id'],
            success: function (res) {
                that.setData({
                    share_btn: true,
                    share_pic: res.path
                })
            },
            complete:function(res){
                wx.hideLoading()
            }
        })
    },

    closeShareModal:function(){
        this.setData({
            share_btn: false
        })
        
    },

    saveSharePic:function(){
        var that = this
        wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success:function(res){
                wx.saveImageToPhotosAlbum({
                    filePath: that.data.share_pic,
                    success:function(res){
                        that.setData({
                            share_btn: false
                        })
                        wx.showToast({
                            title: '保存成功',
                            duration:2000
                        })
                    }
                })
            },
            fail:function(res){
                common.checkAuthorize('scope.writePhotosAlbum')
            }
        })
        
    },

    previewSharePic:function(){
        wx.previewImage({
            urls: [this.data.share_pic],
        })
    },

    /**
     * 转发按钮
     */
    onShareAppMessage: function (res) {
        var that = this
        var goods = that.data.data.goods;
        var url = that.data.url;

        return {
            title: goods.goods_name,//自定义转发标题
            path: '/pages/goods/goodsInfo/goodsInfo?goods_id=' + goods.goods_id + '&item_id=' + that.data.optionItemId + '&first_leader=' + wx.getStorageSync('app:userInfo')['user_id'],
            imageUrl: goods.original_img ? url + goods.original_img : url + goods.spec_goods_price[0].spec_img
        }
    },
});
