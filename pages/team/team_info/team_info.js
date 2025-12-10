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
        result: null,
        content: '', //商品详情页html
        goodsAttrs: null, //商品属性列表
        specSelect: 0, //选中的组合规格数组spec_goods_price下标
        optiongoodId: 0,
        optionItemId: 0, //页面参数，页面初始化指定显示的itemid，用于活动
        goodsInputNum: 1, //选中的商品件数
        openSpecModal: false, //是否打开规格弹窗
        activeCategoryId: 0, //商品主页tab
        supportPageScroll: false, //微信版本是否支持页面滚动回顶部
      share_btn: false, //自定义分享按钮状态
      actionSheetHidden: true, //自定义actionSheet隐藏True
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
        comments: null,
        categories3: [
            { name: "全部评价", id: 0, num: 0 },
            { name: "好评", id: 1, num: 0 },
            { name: "中评", id: 2, num: 0 },
            { name: "差评", id: 3, num: 0 },
            { name: "有图", id: 4, num: 0 }
        ],
        goods: null,
        team: null,
        teamResult: {
            server_time: 0,
            teamFounds: null,
        },
        timer: null,
        select: { //选择的(规格)商品的参数，用于显示
            teamId: 0,
            teamPrice: 0,
            needer: 0,
            price: 0,
            stock: 0,
            statusDesc: '',
            shareDesc: '',
        },
        rule: true,
        imgs:[], //商品图片组
        options: null,
        show: false,
    },

    onLoad: function (options) {
        if (options.first_leader) {
            wx.setStorageSync('first_leader', options.first_leader);
        }
        var that = this;
        var goodId = typeof options.goods_id == 'undefined' ? 0 : options.goods_id;
        var itemId = typeof options.item_id == 'undefined' ? 0 : options.item_id;
        var teamId = typeof options.team_id == 'undefined' ? 0 : options.team_id;
        this.setData({
            optiongoodId: goodId,
            optionItemId: itemId,
        });
        this.getTeamList();
        request.get('/api/Team/info', {
            data: { 
                goods_id: goodId,
                team_id: teamId,
            },
            failRollback: true,
            success: function (res) {
                var result = res.data.result;
                that.setData({ result: result, team: result.team_activity.team_goods_item });            
                //初始化评论
                that.initComment();
                //初始化规格
                that.initSpecsPrice(result.team_activity.goods);
                //获取详情内容
                that.requestGoodsContent();
                //图片组
                that.goodsImages(result.team_activity);
            }
        });
        //是否支持返回按钮
        if (wx.pageScrollTo) {
            this.setData({ supportPageScroll: true });
        }
    },
    //查看更多
    catmore: function () {
        this.setData({ show: true })
    },
    clickMask: function () {
        this.setData({ show: false })
    },
    /** 商品图片组 */
    goodsImages: function (data) {
        var img = data.goods.goods_images;
        var imgs = [];
        for (var i = 0; i < img.length; i++) {
            imgs.push(this.data.url + img[i]['image_url'])
        }
        this.setData({ imgs: imgs });
    },
    /** 查看图片 */
    look: function (e) {
        wx.previewImage({
            current: e.currentTarget.dataset.src, // 当前显示图片的http链接
            urls: this.data.imgs // 需要预览的图片http链接列表
        })
    },

    /** 获取拼团列表 */
    getTeamList: function(){
        var that = this;
        request.post('/api/Team/ajaxTeamFound', {
            data: {
                goods_id: that.data.optiongoodId,
            },
            failRollback: true,
            success: function (res) {
                var result = res.data.result;
                var teamFounds = result.teamFounds;
                for (var i = 0; i < teamFounds.length; i++){
                    if (teamFounds[i].head_pic && teamFounds[i].head_pic.indexOf("http") == -1){
                        teamFounds[i].head_pic = that.data.url + teamFounds[i].head_pic;
                    }
                }
                that.setData({ 
                    'teamResult.server_time': result.server_time,
                    'teamResult.teamFounds': result.teamFounds,
                });
                that.createTimer();
            }
        });
    },

    createTimer: function () {
        var that = this;
        var startTime = (new Date()).getTime();
        this.data.timer = setInterval(function () {
            if (that.data.teamResult.teamFounds.length <= 0) {
                return;
            }
            var teamFounds = that.data.teamResult.teamFounds;
            for (var i = 0; i < teamFounds.length; i++) {
                var diffTime = startTime - that.data.teamResult.server_time * 1000;
                teamFounds[i].remainTime = util.transTime((teamFounds[i].found_time + teamFounds[i].time_limit) * 1000 - (new Date()).getTime() + diffTime);
                if (teamFounds[i].remainTime.hour < 0){
                    clearInterval(that.data.timer);
                    that.getTeamList();
                }
            }
            that.setData({ 'teamResult.teamFounds': teamFounds });
        }, 1000);
    },

    onUnload: function () {
        clearInterval(this.data.timer);
    },

    /** 初始化评论相关 */
    initComment: function () {
        //评论数
        this.data.categories3[0].num = this.data.result.team_activity.goods.comment_statistics.total_sum;
        this.data.categories3[1].num = this.data.result.team_activity.goods.comment_statistics.high_sum;
        this.data.categories3[2].num = this.data.result.team_activity.goods.comment_statistics.center_sum;
        this.data.categories3[3].num = this.data.result.team_activity.goods.comment_statistics.low_sum;
        this.data.categories3[4].num = this.data.result.team_activity.goods.comment_statistics.img_sum;
        //渲染视图
        this.setData({ categories3: this.data.categories3 });
    },

    /** 初始化所有规格 */
    initSpecsPrice: function (result) {
        var specSelect = 0; //初始化选中第一个规格
        var specs = result.spec_goods_price;   //商品所有规格
        var team_activity = this.data.result.team_activity;

        if (specs.length == 0) { //没有规格
            this.setData({
                'select.prom_id': this.data.team[0].team_id,
                'select.teamPrice': this.data.team[0].team_price,
                'select.price': this.data.team[0].price ? this.data.team[0].price : team_activity.goods.shop_price,
                'select.stock': this.data.team[0].store_count ? this.data.team[0].store_count : team_activity.goods.store_count,
                'select.needer': this.data.team[0].needer ? this.data.team[0].needer : team_activity.needer,
                'select.statusDesc': this.data.team[0].front_status_desc ? this.data.team[0].front_status_desc : team_activity.front_status_desc,
                'select.shareDesc': this.data.team[0].share_desc ? this.data.team[0].share_desc : team_activity.share_desc,
            });
            return;
        }
        if (this.data.optionItemId) { //指定规格
            for (var i = 0; i < specs.length; i++) {
                if (specs[i].item_id == this.data.optionItemId) {
                    specSelect = i;
                    break;
                }
            }
        }
        //生成子规格组(spec)的各自选中项
        var specIds = specs[specSelect].key.split("_");
        var list = result.spec;
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
            'result.team_activity.goods.spec': list,
            'result.team_activity.goods.spec_goods_price': specs,
        });
        this.initSelectSpecGoods(this.data.optionItemId > 0 ? this.data.optionItemId : specs[specSelect]['item_id']);
    },


    /** 检查规格商品 */
    initSelectSpecGoods: function (item_id) {
        var that = this;
        request.post('/api/Team/ajaxCheckTeam', {
            data: { goods_id: that.data.result.team_activity.goods.goods_id, item_id: item_id },
            successReload:true,
            success: function (res) {
               that.initActivity(res.data); 
            }
        });
    },
    /** 初始化选中的规格商品 */
    initActivity: function (data){
        var that = this;
        if(data.status == 1){
            var datas = data.result.team_goods_item;      
            that.setData({
                'select.prom_id': datas.spec_goods_price.prom_id,
                'select.teamPrice': datas.team_price,
                'select.price': datas.spec_goods_price.price,
                'select.stock': datas.spec_goods_price.store_count,
                'select.needer': datas.team_activity.needer,
                'select.statusDesc': datas.team_activity.front_status_desc,
                'select.shareDesc': datas.team_activity.share_desc,
            });
        }else{
            that.setData({               
                'select.statusDesc': '未参与活动', 
            });
        }

       
    },
    /** 联系客服 */
    contactService: function () {
        app.getConfig(function (res) {
            app.confirmBox('请联系客服：' + common.getConfigByName(res.config, 'phone'));
        });
    },

    collectGoods: function () {
        var that = this; 
        request.post('/api/goods/collectGoodsOrNo', {
            data: { goods_id: that.data.result.team_activity.goods.goods_id },
            success: function (res) {
                app.showSuccess(res.data.msg);
                that.setData({ 'result.collect': !that.data.result.collect });
            }
        });
    },

    showRule:function(){
        this.setData({ rule: !this.data.rule });
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
    tabClick2: function (e) {
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
        this.requestComments(this.data.result.team_activity.goods.goods_id, e.currentTarget.id);
    },

    /** 请求评论数据 */
    requestComments: function (goodsId, commentType) {
        var that = this;
        commentType++;
        var requestUrl = that.data.url + '/api/goods/getGoodsComment?goods_id=' + goodsId + '&type=' + commentType;
        request.get(requestUrl, {
            success: function (res) {
                var comments = res.data.result;
                for (var i = 0; i < comments.length; i++) {
                    comments[i].addTimeFormat = util.formatTime(comments[i].add_time);
                    comments[i].goods_rank = parseInt(comments[i].goods_rank);
                }
                that.setData({ comments: comments });
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
            this.requestComments(this.data.result.team_activity.goods.goods_id, this.data.activeCategoryId3);
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
            data: { id: that.data.result.team_activity.goods.goods_id },
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
        var list = this.data.result.team_activity.goods.spec;
        var team_activity = this.data.result.team_activity;

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
        var specs = this.data.result.team_activity.goods.spec_goods_price;
        for (var i = 0; i < specs.length; i++) {
            if (specs[i].key == newSpecKeys) {
                newSpecSelect = i;
                break;
            }
        }
      
        this.setData({
            specSelect: newSpecSelect,
            'result.team_activity.goods.spec': list,
            'result.team_activity.goods.spec_goods_price': specs,
            optionItemId: this.data.result.team_activity.goods.spec_goods_price[newSpecSelect].item_id,
        });
        this.checkCartNum(this.data.goodsInputNum);
        this.initSelectSpecGoods(this.data.optionItemId);
    },

    /** 单独购买 */
    buyNormal: function(){
        var parmas={
            goods_id: this.data.result.team_activity.goods.goods_id,
            item_id: this.data.optionItemId,
        };
        wx.navigateTo({ url: '/pages/goods/goodsInfo/goodsInfo?' + util.Obj2Str(parmas) });
    },

    /** 拼团立即购买 */
    buyNow: function(){
        var that = this;
        //检查用户是否登录方可操作立即购买
        if (!app.auth.isAuth()) {
            app.showLoading(null, 1500);
            app.getUserInfo();
            return;
        }   
        if (that.data.select.prom_id <= 0){
            return;
        }
        var spes = that.data.result.team_activity.goods.spec_goods_price;
        request.post('/api/Team/addOrder', {
            data: { 
                item_id: spes.length > 0 ? spes[that.data.specSelect].item_id:'',
                goods_id: that.data.result.team_activity.goods.goods_id,
                goods_num: that.data.goodsInputNum,
            },
            success: function (res) {
                that.setData({ openSpecModal: false });
                wx.navigateTo({ url: '/pages/team/team_confirm/team_confirm?orderSn=' + res.data.result.order_sn });
            }
        });
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
        var stock = this.data.result.team_activity.goods.store_count;
        if (this.data.result.team_activity.goods.spec_goods_price.length > 0) {
            stock = this.data.result.team_activity.goods.spec_goods_price[this.data.specSelect].store_count;
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
    openSpecModel: function () {
        this.setData({ openSpecModal: true });
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
        imgs = imgs.map(function (val) {
            return that.data.url + val;
        });
        wx.previewImage({
            current: imgs[e.currentTarget.dataset.id],
            urls: imgs
        });
    },

  /**
  * 获取商品分享海报
  */
  getSharePic: function () {
    var that = this
    that.setData({
      actionSheetHidden: !this.data.actionSheetHidden
    })
    wx.showLoading({
      title: '正在生成',
      mask: true,
    })
    var item_id = that.data.optionItemId;
    wx.getImageInfo({
      src: that.data.url + '/api/goods/goodsSharePoster?id=' + that.data.optiongoodId +
        '&item_id=' + item_id +
        '&prom_type= 6 ' +
        '&leader_id=' + wx.getStorageSync('app:userInfo')['user_id'],
      success: function (res) {
        that.setData({
          share_btn: true,
          share_pic: res.path
        })
      },
      complete: function (res) {
        wx.hideLoading()
      }
    })
  },

  closeShareModal: function () {
    this.setData({
      share_btn: false
    })

  },
  listenerActionSheet: function (e) {
    this.setData({
      actionSheetHidden: !this.data.actionSheetHidden
    })
  },

  saveSharePic: function () {
    var that = this
    wx.authorize({
      scope: 'scope.writePhotosAlbum',
      success: function (res) {
        wx.saveImageToPhotosAlbum({
          filePath: that.data.share_pic,
          success: function (res) {
            that.setData({
              share_btn: false
            })
            wx.showToast({
              title: '保存成功',
              duration: 2000
            })
          }
        })
      },
      fail: function (res) {
        common.checkAuthorize('scope.writePhotosAlbum')
      }
    })

  },

  previewSharePic: function () {
    wx.previewImage({
      urls: [this.data.share_pic],
    })
  },

  /**
   * 转发按钮
   */
  onShareAppMessage: function (res) {
    var that = this;
    var team = that.data.result.team_activity;
    var url = that.data.url;

    return {
      title: team.goods_name, //自定义转发标题
      path: '/pages/team/team_info/team_info?goods_id=' + team.goods_id + '&item_id=' + team.item_id + '&team_id=' + team.team_id + '&first_leader=' + wx.getStorageSync('app:userInfo')['user_id'],
      imageUrl: team.goods.original_img ? url + team.goods.original_img : url + team.goods.spec_goods_price[0].spec_img
    }
  },
  catchShare: function (e) {
    this.setData({
      actionSheetHidden: false
    })

  },
  closePromModal: function () {
    this.setData({
      openPromModal: false
    });
  },

});
