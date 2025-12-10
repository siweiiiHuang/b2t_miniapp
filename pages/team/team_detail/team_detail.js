1 // team_detail.js
var app = getApp();
var request = app.request;
var setting = app.globalData.setting;
var util = require('../../../utils/util.js');
var common = require('../../../utils/common.js');
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;

Page({
  data: {
    url: setting.url,
    defaultAvatar: setting.resourceUrl + "/static/images/user68.jpg",
    openSpecModal: false, //是否打开规格弹窗
    foundId: 0,
    team: null,
    order_id:0,
    goods_id:0,
    teamFollow: null,
    teamFound: null,
    serverTime: 0,
    teamGoods: [],
    head_pic: null,
    teamMsg: {
      msg: '',
      btnTxt: '',
    },
    timer: null,
    goodsInputNum: 1,
    currentPage: 1,
    back_time: 0,
    shipping: '包邮',
    optionItemId: 0, //页面参数，页面初始化指定显示的itemid，用于活动
    select: { //选择的(规格)商品的参数，用于显示
      teamId: 0,
      teamPrice: 0,
      needer: 0,
      price: 0,
      stock: 0,
      statusDesc: '',
      shareDesc: '',
    },
    specSelect: 0, //选中的组合规格数组spec_goods_price下标
    status:0,
  },

  onLoad: function(options) {
      console.log(options)
    var that = this;
    load.init(this, '', 'teamGoods');
    var foundId = typeof options.foundId == 'undefined' ? 0 : options.foundId;
    var order_id = typeof options.order_id == 'undefined' ? 0 : options.order_id;
      that.setData({
      foundId: foundId,
      order_id: order_id
    });
    
      that.getTeamGoods();    
      that.getTeamGoodlist();

    //获取可申请售后时间上限
    app.getConfig(function(res) {
      var back_time = common.getConfigByName(res.config, 'auto_service_date');
      that.setData({
        back_time: back_time
      });
    });
    //获取是否包邮信息
    // console.log(that.data.goods_id);
    // that.getUserAddress(that.data.goods_id);
  },

  /**
   * 转发按钮
   */
  onShareAppMessage: function(res) {
    var pages = getCurrentPages();
    var currentPage = pages[pages.length - 1];
    var url = currentPage.route
    return url;
  },

  /** 获取用户地址 */
  getUserAddress: function(goods_id) {
    var that = this;
    var consigneeAddress = wx.getStorageSync('goodsInfo:goodsInfo:address');
    if (consigneeAddress) {
      that.refreshDispatch(goods_id, consigneeAddress);
    } else {
      request.post('/api/goods/getDefaultAddress', {
        data: {
          goods_id: goods_id
        },
        success: function(res) {
          that.refreshDispatch(goods_id, res.data.result);
        }
      });
    }

  },
  /**查询商品物流 */
  refreshDispatch: function(goods_id, consigneeAddress) {
    var that = this;
    request.get('/api/team/checkFreeShipping', {
      data: {
        goods_id: goods_id,
        region_id: consigneeAddress.district,
      },
      success: function(res) {
        var shippinginfo;
        if (res.data.result == 1) {
          shippinginfo = '不包邮';
        } else if (res.data.result == 0) {
          shippinginfo = '包邮';
        } else if (res.data.result > 0) {
          shippinginfo = '￥' + res.data.result;
        } else {
          shippinginfo = res.data.msg;
        }
        that.setData({
          shipping: shippinginfo
        });
      },
    });
  },

  getTeamGoods: function() {
    var that = this;
    request.get('/api/Team/found', {
      data: {
        id: that.data.foundId, 
        order_id: that.data.order_id,
      },
      failRollback: true,
      success: function(res) {
        that.setData({ goods_id: res.data.result.team.goods_id});
        var result = res.data.result;
        var head_pic = result.teamFound.head_pic;

        if (head_pic && head_pic.indexOf("http") == -1) {
          head_pic = that.data.url + head_pic;
        }
        var teamFollow = result.teamFollow;
        for (var i = 0; i < teamFollow.length; i++) {
          if (teamFollow[i].follow_user_head_pic && teamFollow[i].follow_user_head_pic.indexOf("http") == 0) {
            //teamFollow[i].follow_user_head_pic = that.data.url + teamFollow[i].follow_user_head_pic;
            teamFollow[i].follow_user_head_pic =  teamFollow[i].follow_user_head_pic;
          } else {
            teamFollow[i].follow_user_head_pic = that.data.defaultAvatar
          }
        }
        if (teamFollow.length < result.teamFound.need - 1) {
          var need = result.teamFound.need - 1 - teamFollow.length;
          for (var i = 0; i < need; i++) {
            var follow = {
              follow_user_head_pic: '',
            }
            teamFollow.push(follow);
          }
        }
        result.teamFound.cut_price = result.teamFound.cut_price.toFixed(2);
        that.setData({
          serverTime: result.server_time,
          team: result.team,
          teamFollow: teamFollow,
          teamFound: result.teamFound,
          head_pic: head_pic,
        });
        if (result.teamFound.status == 0) {
          that.setData({
            'teamMsg.msg': "待开团",
            'teamMsg.btnTxt': "一键发起拼单", 
          });
        } else if (result.teamFound.status == 1) {
          if (result.teamFound.user_id == app.globalData.userInfo.user_id){
            that.setData({
              'status': 1,
              'teamMsg.msg': '',
              'teamMsg.btnTxt': "邀请好友拼单",
            });
          }else{ //参与拼团
            var is_play = false;
            for (var i=0; i<result.teamFollow.length;i++){
              if (result.teamFollow[i].follow_user_id == app.globalData.userInfo.user_id){
                is_play = true;
              }
            }
            if (is_play) {
              that.setData({
                'status': 2,
                'teamMsg.msg': '',
                'teamMsg.btnTxt': "您已参与拼单",
              });
            }else{
              that.setData({
                'status': 3,
                'teamMsg.msg': '参与拼单',
                'teamMsg.btnTxt': "参与拼单",
              });
            }
          }
          
          that.createTimer();
        } else if (result.teamFound.status == 2) {
          that.setData({
            'status': 4,
            'teamMsg.msg': "拼单已满",
            'teamMsg.btnTxt': "拼单完成",
          });
        } else {
          that.setData({
            'status': 5,
            'teamMsg.msg': "拼单失败",
            'teamMsg.btnTxt': "一键发起拼单",
          });
        }
        //初始化选择的规格
        that.initSpecsPrice();
        
        that.getUserAddress(that.data.goods_id);
      }
    });
  },
  /** 检查购买的数量 */
  checkCartNum: function(num) {
    var stock = this.data.team.goods.store_count;
    if (this.data.team.goods.spec_goods_price.length > 0) {
      stock = this.data.team.goods.spec_goods_price[this.data.specSelect].store_count;
    }
    if (num > stock || stock == 0) {
      num = stock;
    } else if (num < 1) {
      num = 1;
    }
    this.setData({
      goodsInputNum: num
    });
  },
  createTimer: function() {
    var that = this;
    var startTime = (new Date()).getTime();
    this.data.timer = setInterval(function() {
      var teamFound = that.data.teamFound;
      var diffTime = startTime - that.data.serverTime * 1000;
      teamFound.remainTime = util.transTime(teamFound.found_end_time * 1000 - (new Date()).getTime() + diffTime);
      if (teamFound.remainTime.hour < 0) {
        clearInterval(that.data.timer);
        that.getTeamGoods();
      }
      that.setData({
        teamFound: teamFound
      });
    }, 1000);
  },

  onUnload: function() {
    clearInterval(this.data.timer);
  },

  getTeamGoodlist: function() {
    var that = this;
    var requestUrl =app.globalData.setting.url + '/api/Team/ajaxGetMore?p=' + that.data.currentPage;
    wx.request({
      url: requestUrl,
      header: {
        'content-type': 'application/json' 
      },
      success: function (res) {
        if (res.data.status !=0){
          that.data.currentPage++;
          var new_team_goods = that.data.teamGoods;
          for (var t = 0; t < res.data.result.length; t++) {
            new_team_goods.push(res.data.result[t]);
          }
          that.setData({ teamGoods: new_team_goods });
          wx.stopPullDownRefresh();
        }
      }
    })

    // load.request(requestUrl, function(res) { 
    //   that.data.currentPage++;
    //   wx.stopPullDownRefresh();
    // });
  },

  onPullDownRefresh: function() {
    this.reloadGoodList();
  },

  //重置数据
  reloadGoodList: function() {
    load.resetConfig();
    this.data.teamGoods = null;
    this.data.currentPage = 1;
    this.getTeamGoodlist();
  },

  onReachBottom: function() {
    if (load.canloadMore()) {
      this.getTeamGoodlist();
    }
  },

  /** 关闭规格弹窗 */
  closeSpecModal: function() {
    this.setData({
      openSpecModal: false
    });
  },

  /** 打开规格弹窗 */
  openSpecModel: function() {
    this.setData({
      openSpecModal: true
    });
  },

  /** 增加购买的商品数量 */
  addCartNum: function(e) {
    var num = this.data.goodsInputNum + 1;
    this.checkCartNum(num);
  },

  /** 减少购买的商品数量 */
  subCartNum: function(e) {
    var num = this.data.goodsInputNum - 1;
    if (num < 1) {
      num = 1;
    }
    this.checkCartNum(num);
  },

  /** 输入购买的数量 */
  inputCartNum: function(e) {
    var num = Number(e.detail.value);
    this.checkCartNum(num);
  },

  /** 立即购买 */
  buyNow: function() {
    var that = this;
    var data = that.data.team;
    console.log(11111)
        console.log(that.data.foundId)
  
    var data = {
      item_id: data.goods.spec_goods_price.length > 0 ? data.goods.spec_goods_price[that.data.specSelect].item_id : '',
      goods_id: data.goods.goods_id,
      goods_num: that.data.goodsInputNum,
      found_id: that.data.teamFound.status == 1 ? that.data.foundId : '',
    };
    request.get('/api/Team/addOrder', {
      data: data,
      success: function(res) {
        var result = res.data.result;
          console.log(2222)
          console.log(that.data.foundId)
        wx.navigateTo({
            url: '/pages/team/team_confirm/team_confirm?orderSn=' + res.data.result.order_sn + '&found_id=' + that.data.foundId
        });
      }
    });
  },


  /** 初始化所有规格 */
  initSpecsPrice: function() {
    var specSelect = 0; //初始化选中第一个规格
    var specs = this.data.team.goods.spec_goods_price;
    var team_activity = this.data.team;

    if (specs.length == 0) { //没有规格
      this.setData({
        'select.prom_id': team_activity.team_goods_item[0].team_id,
        'select.teamPrice': team_activity.team_goods_item[0].team_price,
        'select.price': team_activity.team_goods_item[0].price ? team_activity.team_goods_item[0].price : team_activity.goods.shop_price,
        'select.stock': team_activity.team_goods_item[0].store_count ? team_activity.team_goods_item.store_count : team_activity.goods.store_count,
        'select.needer': team_activity.needer,
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
    } else {
      //选取当前参与拼团活动的商品进行显示
      for (var i = 0; i < specs.length; i++) {
        if (specs[i].prom_type == 6) {
          specSelect = i;
          break;
        }
      }
    }
    //生成子规格组(spec)的各自选中项
    var specIds = specs[specSelect].key.split("_");
    var list = team_activity.goods.spec;
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
      'team.goods.spec': list,
      'team.goods.spec_goods_price': specs,
    });
    this.initSelectSpecGoods(specs[specSelect]['item_id']);
  },
  /** 检查规格商品 */
  initSelectSpecGoods: function(item_id) {
    var that = this;
    request.post('/api/Team/ajaxCheckTeam', {
      data: {
        goods_id: that.data.team.goods.goods_id,
        item_id: item_id
      },
      successReload: true,
      success: function(res) {
        that.initActivity(res.data);
      }
    });
  },
  /** 初始化选中的规格商品 */
  initActivity: function(data) {
    var that = this;
    if (data.status == 1) {
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
    } else {
      that.setData({
        'select.statusDesc': '未参与活动',
      });
    }
  },

  /** 点击规格按钮的回调函数 */
  selectSpec: function(e) {
    //对商品数量进行判断，对库存进行判断
    var itemId = e.currentTarget.dataset.itemid;
    var listIdx = e.currentTarget.dataset.listidx;
    var list = this.data.team.goods.spec;
    var team_activity = this.data.team;

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
    var specs = this.data.team.goods.spec_goods_price;
    for (var i = 0; i < specs.length; i++) {
      if (specs[i].key == newSpecKeys) {
        newSpecSelect = i;
        break;
      }
    }

    this.setData({
      specSelect: newSpecSelect,
      'team.goods.spec': list,
      'team.goods.spec_goods_price': specs,
      optionItemId: specs[newSpecSelect].item_id,
    });
    this.checkCartNum(this.data.goodsInputNum);
    this.initSelectSpecGoods(this.data.optionItemId);
  },
})