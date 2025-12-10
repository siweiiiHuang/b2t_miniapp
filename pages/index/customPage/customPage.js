// pages/index/customPage/customPage.js
//获取应用实例
var app = getApp();
var request = app.request;
var setting = app.globalData.setting;
var bmap = require('../../../libs/bmap-wx.min.js');
var util = require('../../../utils/util.js');
var common = require('../../../utils/common.js');
var WxParse = require('../../../utils/wxParse/wxParse.js');
import Regions from '../../../utils/regions/Regions.js';
Page({

  /**
   * 页面的初始数据
   */
  data: {
      infologin:false,
      ak: 'fZksmKUsUDqqYs2FHWv6CHHBIF3cR5qK',  //百度地图key
      ad: true, //门店列表
      url: setting.url,
      resourceUrl: setting.resourceUrl,
      logo: setting.appLogo,
      homeData: null, //首页轮播和广告
      saleGoods: null,
      sale: {
          countTime: {
              hour: 0,
              minute: 0,
              second: 0,
          },
          diffTime: 0,
          good: null,
      },
      timer: null, //活动倒计时定时器
      recommend: null, //推荐商品
      scrollTop: 0,
      currentPage: 1,
      is_block: 0,
      goods_show: 0,
      end_time: '',  //秒杀结束时间
      countDownList: {
          day: '00',
          hou: '00',
          min: '00',
          sec: '00',
      }, //秒杀结束初始化时间
      webUrl: '',
      address: '', //当前地址
      menu_index: 0,//菜单索引
      defaultMenu: false,  //默认底部菜单显示状态
      custom_skill_status:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      var index = options.types ? options.types:app.globalData.menu_index 
      var wap_home_logo;
      app.getConfig(function (res) {
          wap_home_logo = common.getConfigByName(res.config, 'wap_home_logo');   //首页logo
      })   
      this.setData({ menu_index: index, wap_home_logo: wap_home_logo})
      this.checklogin();
      this.getAutoData(options.id);

      wx.setNavigationBarTitle({
          title: setting.appName
      })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
      if (this.data.infologin) {
          this.data.infologin = false;
          this.checklogin();
      }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  },
  /****************************** 自定义 start ********************************/

  //获取自定义首页数据
  getAutoData: function (id) {
      var that = this;
      var url = !id ? '/api/Index/block_index' : '/api/Index/block_index/id/' + id
      request.get(url, {
          failRollback: true,
          successReload: true,
          success: function (res) {
              if (res.data.status == 1) {
                  var data = res.data.result.blocks;      //模块集合
                  var skill = [];                         //秒杀
                  var block_model = [];                   //其他模块集合
                  var shop = [];                          //多门店集合
                  var content = [];                       //富文本集合
                  var menu_model = [];                    //菜单集合
                  var video = [];                         //视频集合
                  var search = [];                        //搜索
                  var ids = [];


                  for (let z = 0; z < data.length; z++) {
                      if (data[z]['block_type'] == '6') {
                          skill = data[z];
                      }

                      if (data[z]['block_type'] == '14') {
                          data[z]['video_url'] = data[z]['video_url'].indexOf('http') == -1 ? setting.url + data[z]['video_url'] : data[z]['video_url'];
                          video = data[z];
                      }

                      if (data[z]['block_type'] != '8' && data[z]['block_type'] != '9' && data[z]['block_type'] != '11') {

                          if (data[z]['block_type'] == '3') {
                              data[z]['list'] = data[z]['nav'][0]['goods_list']
                          }

                          block_model.push(data[z]);
                          ids.push(data[z]['div_order'])
                      }
                      if (data[z]['block_type'] == '8') {
                          search = data[z];
                      }

                      if (data[z]['block_type'] == '18') {
                          shop = data[z];
                      }

                      if (data[z]['block_type'] == '16') {
                          content = data[z];
                      }

                      if (data[z]['block_type'] == '11') {
                          menu_model = data[z];
                      }

                      if (data[z]['block_type'] == '19') {
                          for (let i = 0; i < data[z]['nav'].length; i++) {
                              if (data[z]['nav'][i]['type'] == 4) {
                                  //radio_from = data[z]['nav'][i]['option_name'];
                                  var len = data[z]['nav'][i]['option_name'].length;
                                  var arrs = [];
                                  for (let ii = 0; ii < len; ii++) {
                                      let obj = { name: data[z]['nav'][i]['option_name'][ii], selected: -1 }
                                      arrs.push(obj)
                                  }
                                  data[z]['nav'][i]['option_name'] = arrs
                              }

                              if (data[z]['nav'][i]['type'] == 5) {
                                  //checked_from = data[z]['nav'][i]['option_name'];
                                  var len = data[z]['nav'][i]['option_name'].length;
                                  var arrs = [];
                                  for (let ii = 0; ii < len; ii++) {
                                      let obj = { name: data[z]['nav'][i]['option_name'][ii], selected: -1 }
                                      arrs.push(obj)
                                  }
                                  data[z]['nav'][i]['option_name'] = arrs
                              }
                          }
                          that.initRegions();
                      }
                  }

                  var array = [];
                  if (ids.length > 0) {
                      for (let y = 1; y <= ids.length; y++) {
                          array.push(y);
                      }
                  }

                  if (content != '') {
                      WxParse.wxParse('content', 'html', content.content, that, 6);
                  }

                  if (skill != '' && skill.activity_type == 1) {
                      that.setData({
                          end_time: skill.end_time
                      })
                      that.destroyActivityTimer();
                      that.data.timer = setInterval(function () {
                          that.secondKill();
                      }, 1000);

                  }

                  if (shop != '') {
                      wx.getLocation({
                          type: 'wgs84',
                          altitude: true,
                          success: function (res) {
                              that.getUserLatitudeLongitude(shop, res);
                          },
                          fail(e) {
                              app.confirmBox('如需正常使用小程序门店自提点功能，请在【我的】页面中点击授权按钮，勾选用户信息并点击确定。');
                          }
                      })
                  }
                  block_model = that.returnModelArr(block_model, array);
                  app.globalData.menu_model = menu_model.nav;
                  that.setData({
                      video: video,
                      search: search,
                      menu_model: menu_model.nav,
                      models: res.data.result,
                      block_model: block_model
                  });
              }
          }
      });
  },
    jumpSearch: function () {
        wx.navigateTo({ url: '/pages/goods/search/search' });
    },

  /** 获取授权用户经纬度 */
  getUserLatitudeLongitude(result, res) {
      var that = this;
      //根据用户当前经纬度获取相应的附近门店
      request.post('/api/Index/shopList', {
          data: {
              lng: res.longitude,
              lat: res.latitude,
              province: '',
              search_radius: result.search_radius,
          },
          failRollback: true,
          successReload: true,
          success: function (res) {
              var ad = res.data.result.length > 0 ? false : true;
              that.setData({
                  shop_list: res.data.result,
                  ad: ad
              })
          }
      });

      //用户当前经纬度地址位置
      var BMap = new bmap.BMapWX({
          ak: that.data.ak,
      });
      var fail = function (data) {
          console.log(data)
      };
      var success = function (data) {
          var originalData = data.originalData;
          that.setData({
              address: originalData.result.formatted_address
          })
      }
      BMap.regeocoding({
          location: res.latitude + ',' + res.longitude, //22.622572 + ',' + 114.077780, // 22.71991 + ',' + 114.24779, 
          fail: fail,
          success: success,
      });
  },
    shop_page(e) {
        wx.navigateTo({ url: '/pages/cart/cart2/shopDetail/shopDetail?datas=' + JSON.stringify(e.currentTarget.dataset.item) });
    },
  /** 自定义模板秒杀接口时间数据 */
  secondKill: function () {
      // 获取当前时间
      let newTime = new Date().getTime();
      let countDownArr = null;
      // 对结束时间进行处理渲染到页面    
      let endTime = this.data.end_time * 1000;    //活动结束时间       
      let obj = null;
      // 如果活动未结束，对时间进行处理
      if (endTime - newTime > 0) {
          let time = (endTime - newTime) / 1000;
          // 获取天、时、分、秒
          let day = parseInt(time / (60 * 60 * 24));
          let hou = parseInt(time % (60 * 60 * 24) / 3600);
          let min = parseInt(time % (60 * 60 * 24) % 3600 / 60);
          let sec = parseInt(time % (60 * 60 * 24) % 3600 % 60);
          obj = {
              day: this.timeFormat(day),
              hou: this.timeFormat(hou),
              min: this.timeFormat(min),
              sec: this.timeFormat(sec)
          }
      } else {//活动已结束，全部设置为'00'
              this.destroyActivityTimer();
              this.setData({ custom_skill_status: false })
              this.getAutoData(); //首页数据
              return;
      }
      countDownArr = obj;
      this.setData({ countDownList: countDownArr, custom_skill_status: true});
  },

  timeFormat(param) {//小于10的格式化函数
      return param < 10 ? '0' + param : param;
  },


  /** 领券 */
  getCoupon: function (e) {
      var that = this;
      var coupon_id = e.currentTarget.dataset.cid;
      request.post('/api/activity/get_coupon', {
          data: { coupon_id: coupon_id },
          success: function (res) {
              app.showSuccess(res.data.msg);
              for (var i in that.data.coupons) {
                  if (that.data.coupons[i].id == coupon_id) {
                      that.data.coupons.splice(i, 1);
                      that.setData({ coupons: that.data.coupons });
                      break;
                  }
              }
          }
      });
  },
    /** 跳转模式 自定义页面 || 自定义菜单 || 自定义控件控件*/
    topage: function (e) {
        //自定义控件控件
        var obj = e.currentTarget.dataset.obj ? e.currentTarget.dataset.obj : '';
        var url = e.currentTarget.dataset.url;
        var page_type = e.currentTarget.dataset.type;
        var id = e.currentTarget.dataset.id;
        if (obj == 'custom') {
            //底部自定义菜单
            var idx = e.currentTarget.dataset.idx;
            app.globalData.menu_index = idx;
            //  page_type = this.data.menu_model[this.data.menu_index].url_type
            page_type = this.data.menu_model[idx].url_type
            id = this.data.menu_model[idx].app_url
        }
        //判断跳转的类型  1 = 小程序页面，2 = 分类商品，3 = 商品详情 ，4 = 自定义页面 , 5 = 外部网址链接,
        if (page_type == 1) {
            if (obj == 'custom') {
                //要访问的页面idx，当前页面menu_index
                common.totabar(idx, this.data.menu_index, this.data.menu_model);
            } else {
                var url = common.meunCheck(e.currentTarget.dataset.url);
                wx.navigateTo({ url: url, });
            }

        } else if (page_type == 2) {
            wx.navigateTo({ url: '/pages/goods/goodsList/goodsList?cat_id=' + id });
        } else if (page_type == 3) {
            wx.navigateTo({ url: '/pages/goods/goodsInfo/goodsInfo?goods_id=' + id });
        } else if (page_type == 5 || page_type == 0) {
            this.setData({ webUrl: url ? url : id });
            wx.navigateTo({ url: '/pages/index/webview/webview' });
        } else {
        //自定义页面      
           this.setData({ menu_index: idx })
           this.getAutoData(this.data.menu_model[idx].app_url);
        }
    },

  /** 默认菜单 */
  topages: function (e) {
      var idx = e.currentTarget.dataset.idx;
      app.globalData.menu_index = idx;
      common.defaultTotabar(idx, 0);
  },

  //新闻详情
  goNewsDetail: function (e) {
      var id = e.currentTarget.dataset.id;
      var link = e.currentTarget.dataset.link;
      var webUrl;
      if (link != '') {
          webUrl = link;
      } else {
          webUrl = "/api/news/news_detail?news_id=" + id;
      }
      this.setData({ webUrl: webUrl });
      wx.navigateTo({ url: '/pages/index/webview/webview' });
  },

    changeGoodsShow(e) {
        var index = e.currentTarget.dataset.index;
        var fid = e.currentTarget.dataset.fid;
        this.data.block_model[fid]['list'] = this.data.block_model[fid]['nav'][index]['goods_list']
        this.data.block_model[fid]['title_selected'] = index
        this.setData({ goods_show: index, goods_show_fid: fid, block_model: this.data.block_model });
    },

  returnModelArr: function (data, ids) {
      var arr = [];
      for (let i = 0; i < ids.length; i++) {
          for (let l = 0; l < data.length; l++) {
              if (ids[i] == data[l]['div_order']) {
                  arr.push(data[l]);
              }
          }
      }
      return arr;
  },
  /** 创建活动倒计时定时器 */
  createActivityTimer: function () {
      var sale = this.data.sale;
      var that = this;
      this.data.timer = setInterval(function () {
          var time = sale.good.end_time * 1000 - (new Date()).getTime() + sale.diffTime;
          var remainTime = util.transTime(time);
          if (time <= 0) {
              // that.destroyActivityTimer();
              that.getAutoData(); //首页数据
              return;
          }
          that.setData({ 'sale.countTime': remainTime });
      }, 1000);
  },

  /** 销毁活动倒计时定时器 */
  destroyActivityTimer: function () {
      if (this.data.timer) {
          clearInterval(this.data.timer);
          this.data.timer = null;
      }
  },
  tologin: function () {
      if (!app.auth.isAuth()) {
          app.showLoading(null, 1500);
          app.getUserInfo();
          this.data.infologin = true;
          return;
      }
  },
  checklogin: function () {
      this.setData({ iflogin: app.auth.hadAuth() })
  },

  /** 页面滚动事件 */
  onPageScroll: function (e) {
      this.setData({ scrollTop: e.scrollTop });
      //可能还在滚动就跳到其他页面去了，导致导航栏变色，所以要判断路由
      var pages = getCurrentPages();
      if (pages[pages.length - 1].route == 'pages/index/customPage/customPage') {
          if (e.scrollTop > 10) {
              wx.setNavigationBarColor({
                  frontColor: '#ffffff',
                  backgroundColor: '#f95959'
              });
          } else {
              wx.setNavigationBarColor({
                  frontColor: '#000000',
                  backgroundColor: '#eeeeee'
              });
          }
      }
  },

    bindTimeChange(e) {
        var that = this;
        let fid = e.currentTarget.dataset.fid;
        let idx = e.currentTarget.dataset.idx;
        let datas = that.data.block_model;
        datas[fid]['nav'][idx]['val'] = e.detail.value
        this.setData({ intelligence_date: e.detail.value, block_model: datas });
    },
    /** 初始化区域弹框相关 */
    initRegions: function (e) {
        var that = this;
        new Regions(this, 'regions', {
            endAreaLevelCall: function (parentId, regionName, address) {
                Object.assign(that.data.from_address, address);
                that.setData({
                    'from_address.province_name': that.data.from_address.province_name,
                    'from_address.city_name': that.data.from_address.city_name,
                    'from_address.district_name': that.data.from_address.district_name,
                    'from_address.twon_name': that.data.from_address.twon_name,
                });
            },
            setFromRegionsVal: function (selected, address) {
                let fid = selected.fid;
                let idx = selected.idx;
                let datas = that.data.block_model;

                datas[fid]['nav'][idx]['val'] = address.province_name + address.city_name + address.district_name + address.twon_name
                that.setData({ block_model: datas })
            }
        });
    },

    radioChange: function (e) {
        var that = this;
        let fid = e.currentTarget.dataset.fid;
        let idx = e.currentTarget.dataset.idx;
        let idxs = e.currentTarget.dataset.idxs;
        let datas = that.data.block_model;
        for (let i = 0; i < datas[fid]['nav'][idx]['option_name'].length; i++) {
            datas[fid]['nav'][idx]['option_name'][i]['selected'] = -1
            datas[fid]['nav'][idx]['val'] = ''
        }
        datas[fid]['nav'][idx]['option_name'][idxs]['selected'] = idxs
        datas[fid]['nav'][idx]['val'] = datas[fid]['nav'][idx]['option_name'][idxs]['name']
        that.setData({ block_model: datas })

    },
    checkboxChange: function (e) {
        var that = this;
        let fid = e.currentTarget.dataset.fid;
        let idx = e.currentTarget.dataset.idx;
        let idxs = e.currentTarget.dataset.idxs;
        let datas = that.data.block_model;

        if (datas[fid]['nav'][idx]['option_name'][idxs]['selected'] == idxs) {
            datas[fid]['nav'][idx]['option_name'][idxs]['selected'] = -1
        } else {
            datas[fid]['nav'][idx]['option_name'][idxs]['selected'] = idxs
        }
        let val = '';
        if (datas[fid]['nav'][idx]['option_name'].length > 0) {
            for (let i = 0; i < datas[fid]['nav'][idx]['option_name'].length; i++) {
                if (datas[fid]['nav'][idx]['option_name'][i]['selected'] >= 0) {
                    if (val) {
                        val += ',' + datas[fid]['nav'][idx]['option_name'][i]['name']
                    } else {
                        val += datas[fid]['nav'][idx]['option_name'][i]['name']
                    }
                }
            }
        }
        datas[fid]['nav'][idx]['val'] = val;
        that.setData({ block_model: datas })
    },
    checkFromType: function (e) {
        var that = this;
        let fid = e.currentTarget.dataset.fid;
        let idx = e.currentTarget.dataset.idx;
        let datas = that.data.block_model;
        datas[fid]['nav'][idx]['val'] = e.detail.value;
        that.setData({ block_model: datas })
    },
    fromSubmit: function (e) {

        var that = this;
        let datas = that.data.block_model;
        let fid = e.currentTarget.dataset.fid;
        var data = '';
        for (let j = 0; j < datas[fid]['nav'].length; j++) {
            if (datas[fid]['nav'][j]['required'] == 1 && !datas[fid]['nav'][j]['val'] && (datas[fid]['nav'][j]['type'] == 0 || datas[fid]['nav'][j]['type'] == 1)) {
                return app.showTextWarining("请填写" + datas[fid]['nav'][j]['title']);
            }

            if (datas[fid]['nav'][j]['type'] == 0 && datas[fid]['nav'][j]['verify_type'] == 1) {
                if (!app.validatemobile(datas[fid]['nav'][j]['val'])) {
                    return;
                }
            }

            if (datas[fid]['nav'][j]['type'] == 0 && datas[fid]['nav'][j]['verify_type'] == 2) {
                if (!common.checkEmail(datas[fid]['nav'][j]['val'])) {
                    return app.showTextWarining("请填写" + datas[fid]['nav'][j]['title'] + '正确的格式');
                }
            }

            if (datas[fid]['nav'][j]['required'] == 1 && !datas[fid]['nav'][j]['val'] && (datas[fid]['nav'][j]['type'] == 2 || datas[fid]['nav'][j]['type'] == 3 || datas[fid]['nav'][j]['type'] == 5 || datas[fid]['nav'][j]['type'] == 4)) {
                return app.showTextWarining("请选择" + datas[fid]['nav'][j]['title']);
            }
            data += '&name' + j + '=' + datas[fid]['nav'][j]['val']
        }

        //验证之后清空数据
        for (let i = 0; i < datas[fid]['nav'].length; i++) {
            datas[fid]['nav'][i]['val'] = '';
            if (datas[fid]['nav'][i]['type'] == 4) {
                for (let y = 0; y < datas[fid]['nav'][i]['option_name'].length; y++) {
                    datas[fid]['nav'][i]['option_name'][y]['selected'] = -1;
                }
            }

            if (datas[fid]['nav'][i]['type'] == 5) {
                for (let u = 0; u < datas[fid]['nav'][i]['option_name'].length; u++) {
                    datas[fid]['nav'][i]['option_name'][u]['selected'] = -1;
                }
            }
        }

        var from_datas = '?timeid=' + datas[fid]['timeid'] + '&form_name=' + datas[fid]['form_name'] + data

        request.get('/Api/Index/save_form' + from_datas, {
            data: data,
            failRollback: true,
            success: function (res) {
                app.showTextWarining(datas[fid]['result'] || '提交成功', function () {
                    that.setData({
                        block_model: datas
                    })
                });
            }
        });


    }
 /****************************** 自定义 end ********************************/
})