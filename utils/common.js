var util = require('util.js');

/** 通用函数：这里放的是与系统配置和变量相关的函数 */
module.exports = {
    app: function () {
        return getApp();
    },

    getFullUrl: function (url) {
        if (!url || url.indexOf('http') == 0 || url.indexOf('www') == 0) {
            return url;
        }
        return this.app().globalData.setting.url + url;
    },

    /** 广告跳转 */
    adverPage: function (type,data,that) {
        if (type == 3) {
            wx.navigateTo({
                url: '/pages/goods/goodsInfo/goodsInfo?goods_id=' + data,
            })
        } else if (type == 4) {
            let a = data.split('_');
            let b = a[a.length - 1]
            wx.navigateTo({
                url: '/pages/goods/goodsList/goodsList?cat_id=' + b,
            })
        } else {
            //type == 0 || 5  符合该合法业务域名时则跳转
            that.setData({ webUrl: data });
            wx.navigateTo({ url: '/pages/index/webview/webview' });
        }       
    },

    /** 获取配置值，在app.getConfig回调中使用 */
    getConfigByName: function(config, name, type) {
        for (var i = 0; i < config.length; i++) {
            if (config[i].name === name && (typeof type == 'undefined' || (typeof type != 'undefined' && config[i].inc_type === type))) {
                return config[i].value;
            }
        }
        console.warn(name);
        console.warn(config);
        return null;
    },

    /** 跳到cart4页面 */
    jumpToCart4: function (order, isRedirect) {
        var params = {
            order_sn: order.order_sn,
            order_type: order.order_type ? order.order_type : 0 ,
            order_amount: order.order_amount,
        };
        if (order.master_order_sn) {
            params.master_order_sn = order.master_order_sn;
        }
        var url = '/pages/cart/cart4/cart4?' + util.Obj2Str(params);
        if (isRedirect) {
            wx.redirectTo({ url: url });
        } else {
            wx.navigateTo({ url: url });
        }
    },

    getCapache: function () {
        return this.app().request.modifyUrl('/api/user/verify?is_image=1&t=' + (Date.parse(new Date)));
    },

    //网页中的图片加上域名
    wxParseAddFullImageUrl: function (page, contentStr) {
        if (typeof page.data[contentStr].images != 'undefined') {
            var content = page.data[contentStr];
            for (var i = 0; i < content.images.length; i++) {
                content.images[i].attr.src = this.getFullUrl(content.images[i].attr.src);
                content.imageUrls[i] = this.getFullUrl(content.imageUrls[i]);
            }
            console.log(content);
            page.setData({ [contentStr]: content });
        }
    },

    /** 发送短信验证码 */
    sendSmsCode: function (mobile, scene, cb) {
        var that = this;
        if (!mobile) {
            return that.app().showTextWarining('手机号码不能为空');
        }
        if (typeof scene == 'undefined' || scene === null) {
            scene = 6; //身份验证
        }
        var that = this;
        this.app().request.post('/home/api/send_validate_code', {
            data: {
                mobile: mobile,
                scene: scene,
                type: 'mobile',
            },
            success: function (res) {
                typeof cb == 'function' && cb(res);
                that.app().confirmBox(res.data.msg);
            }
        });
    },

    /** 绑定账号发送短信验证码 */
    sendBindSmsCode: function (mobile , cb) {
        var that = this;
        if (!mobile) {
            return that.app().showTextWarining('手机号码不能为空');
        }
        var that = this;
        this.app().request.post('/home/api/send_validate_code', {
            data: {
                mobile: mobile,
                scene: '1',
                type: 'user_reg',
            },
            success: function (res) {
                typeof cb == 'function' && cb(res);
                that.app().confirmBox(res.data.msg);
            }
        });
    },

    /** 默认菜单跳转 */
    defaultTotabar:function (idx,idx_page){
        if (idx != idx_page) {                     
            switch (idx) {
                case '0':
                    wx.reLaunch({
                        url: '../../index/index/index',
                    })
                    break;
                case '1':
                    wx.reLaunch({
                        url: '../../goods/categoryList/categoryList',
                    })
                    break;
                case '2':
                    wx.reLaunch({
                        url: '../../cart/cart/cart',
                    })
                    break;
                case '3':
                    wx.reLaunch({
                        url: '../../user/index/index',
                    })
                    break;             
                default:
                    break;
            }
        }
    },
    /** 自定义菜单跳转 */
    totabar: function (idx, idx_page, menu_model) {
        if (idx != idx_page) {
            switch (menu_model[idx].app_url) {
                case '/index.php/Mobile/Goods/ajaxSearch':
                    wx.navigateTo({
                        url: '../../goods/search/search',
                    })
                    break;
                case '/index.php/Mobile/Activity/flash_sale_list':
                    wx.navigateTo({
                        url: '../../activity/seckill_list/seckill_list',
                    })
                    break;
                case '/index.php/Mobile/activity/coupon_list':
                    wx.navigateTo({
                        url: '../../activity/coupon_list/coupon_list',
                    })
                    break;
                case '/index.php/Mobile/Team/index':
                    wx.navigateTo({
                        url: '../../team/index/index',
                    })
                    break;
                case '/index.php/Mobile/Distribut/become_distribut':
                    wx.navigateTo({
                        url: '../../distribut/distribut_level/distribut_level',
                    })
                    break;
                case '/index.php/Mobile/Distribut/index':
                    wx.navigateTo({
                        url: '../../distribut/index/index',
                    })
                    break;
                case '/index.php/Mobile/Goods/integralMall':
                    wx.navigateTo({
                        url: '../../goods/integralMall/integralMall',
                    })
                    break;
                default:
                    let url = this.meunCheck(menu_model[idx].app_url);
                    wx.reLaunch({
                        url: url,
                    })
                    break;
            }
        }
    },
    /**分销页面跳转 */
    todistribut: function (idx, idx_page) {
        if (idx != idx_page) {
            switch (idx) {           
                case '0':
                    wx.redirectTo({
                        url: '../../distribut/index/index',
                    })
                    break;
                case '1':
                    wx.redirectTo({
                        url: '../../distribut/team_list/team_list',
                    })
                    break;
                case '2':
                    wx.navigateTo({
                        url: '../../user/account/account',
                    })
                    break;
                case '3':
                    wx.redirectTo({
                        url: '../../distribut/retail_order/retail_order',
                    })
                    break;
                case '4':
                    wx.redirectTo({
                        url: '../../distribut/shop/shop',
                    })
                    break;
                default:                 
                    break;
            }
        }
    },
    customTocart:function(){
        var menu = this.app().globalData.menu_model;
        for (let i = 0; i < menu.length; i++) {
            if (menu[i]['app_url'] == '/index.php/Mobile/Cart/index') {
                this.app().globalData.menu_index = i;
                wx.reLaunch({
                    url: '../../cart/cart/cart',
                })
            }
        }    
    },
    /** 自定义菜单内部模板判断 */
    meunCheck:function(data){
        let arr = [        
            { check: '/index.php/Mobile/Index/index', ret: '../../index/index/index' },                               //商城首页
            { check: '/index.php/Mobile/Bargain/bargain_list', ret: '../../Bargain/order_list/order_list?type=bargain' },    //砍价活动
            { check: '/index.php/Mobile/Cart/index', ret: '../../cart/cart/cart' },                                   //购物车
            { check: '/index.php/Mobile/activity/coupon_list', ret: '../../activity/coupon_list/coupon_list' },       //优惠券中心
            { check: '/index.php/Mobile/Team/index', ret: '../../team/index/index' },                                 //拼团中心
            { check: '/index.php/Mobile/Activity/flash_sale_list', ret: '../../activity/seckill_list/seckill_list' }, //限时秒杀
            { check: '/index.php/Mobile/Goods/categoryList', ret: '../../goods/categoryList/categoryList' },          //分类
            { check: '/index.php/Mobile/User/index', ret: '../../user/index/index' },                                 //会员中心
            { check: '/index.php/Mobile/Distribut/index', ret: '../../distribut/index/index' },                       //我的分销
            { check: '/index.php/Mobile/Goods/integralMall', ret: '../../goods/integralMall/integralMall' },          //积分商城
            { check: '/index.php/Mobile/Goods/ajaxSearch', ret: '../../goods/search/search' },                        //搜索
            { check: '/index.php/Mobile/User/collect_list', ret: '../../user/collect_list/collect_list' },            //收藏
            { check: '/index.php/Mobile/Distribut/become_distribut', ret: '../../distribut/distribut_level/distribut_level' },            //加盟分销商
        ]
        if (data){
            for (let i = 0; i < arr.length; i++) {
                if (data == arr[i]['check']){
                    return arr[i]['ret']
                }
            }
        }
        
    },

    // 校验纳税号机构代码
    orgcodevalidate:function (value) {
        if (value != "") {
            var part1 = value.substring(0, 8);
            var part2 = value.substring(value.length - 1, 1);
            var ws = [3, 7, 9, 10, 5, 8, 4, 2];
            var str = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            var reg = /^([0-9A-Z]){8}$/;
            if (!reg.test(part1)) {
                return true
            }
            var sum = 0;
            for (var i = 0; i < 8; i++) {
                sum += str.indexOf(part1.charAt(i)) * ws[i];
            }
            var C9 = 11 - (sum % 11);
            var YC9 = part2 + '';
            if (C9 == 11) {
                C9 = '0';
            } else if (C9 == 10) {
                C9 = 'X';
            } else {
                C9 = C9 + '';
            }
            return YC9 != C9;
        }
    },
    /**
    * 邮箱格式判断
    * @param str
    */
    checkEmail:function (str){
        var reg = /^[a-z0-9]([a-z0-9\\.]*[-_]{0,4}?[a-z0-9-_\\.]+)*@([a-z0-9]*[-_]?[a-z0-9]+)+([\.][\w_-]+){1,5}$/i;
        if (reg.test(str)) {
            return true;
        } else {
            return false;
        }
    },
    checkRequestIsHttps:function(url){
        if (url && url.indexOf('https') == -1) {
            return 'https' + url.substring(4);
        }else{
            return url
        }
    },

    /**
     * 判断输入的字符是否为空格字符串
     */
    isNull: function (str) {
        if (str == "") return true;
        var regu = "^[ ]+$";
        var re = new RegExp(regu);
        //为空或纯空格为 true    有值为false
        console.log(re.test(str))
        return re.test(str);
    },
    checkAuthorize: function(scope) {
    wx.getSetting({
        success: (res) => {
            if (!res.authSetting[scope]) {
                wx.showModal({
                    title: '用户未授权',
                    content: '拒绝授权将不能体验小程序完整功能，前往个人中心页底部->授权管理',
                    success: (res) => {
                        if (res.confirm) {
                            wx.navigateTo({
                                url: '/pages/user/index/index',
                            })
                        }
                    }
                })
            }
        }
    })
    }
};