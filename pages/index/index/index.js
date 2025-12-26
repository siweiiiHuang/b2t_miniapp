var app = getApp();
var request = app.request;
var setting = app.globalData.setting;
import LoadMore from '../../../utils/LoadMore.js';
var load = new LoadMore;

Page({
  data: {
    showModal: false,
    statusBarHeight: 0,
    navBarHeight: 0,
    capsuleHeight: 0,
    capsuleTop: 0,
    tipsBoxMarginTop: 0,
    currentPage: 0,  // 当前页面索引：0-首页，1-点单，2-取单，3-个人中心
    url: setting.url,
    recommend: null, // 推荐商品
    recommendPage: 1 // 推荐商品分页
  },

  // 显示弹窗
  showModal() {
    this.setData({
      showModal: true
    });
  },

  // 关闭弹窗
  closeModal() {
    this.setData({
      showModal: false
    });
  },

  // 阻止弹窗冒泡
  stopPropagation() {},

  // 导航到个人中心
  navigateToUser() {
    wx.navigateTo({
      url: '/pages/user/index/index',
      fail: function(err) {
        console.error('跳转个人中心失败', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 导航到优惠券页面
  navigateToCoupon() {
    // 检查用户是否登录
    if (!app.auth.isAuth()) {
      app.auth.auth(() => {
        this.navigateToCoupon(); // 登录成功后重新调用
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/user/coupon/coupon',
      fail: function(err) {
        console.error('跳转优惠券页面失败', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 导航到订单列表
  navigateToOrder() {
    // 检查用户是否登录
    if (!app.auth.isAuth()) {
      app.auth.auth(() => {
        this.navigateToOrder(); // 登录成功后重新调用
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/user/order_list/order_list',
      fail: function(err) {
        console.error('跳转订单列表失败', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none',
          duration: 1500
        });
      }
    });
  },

  // 拨打电话
  makePhoneCall(e) {
    const phoneNumber = e.currentTarget.dataset.phone;
    if (!phoneNumber) {
      wx.showToast({
        title: '电话号码错误',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    wx.makePhoneCall({
      phoneNumber: phoneNumber,
      success: function (res) {
        console.log('拨打电话成功', res);
      },
      fail: function (err) {
        console.error('拨打电话失败', err);
        let errorMsg = '拨打电话失败';
        if (err.errMsg) {
          if (err.errMsg.includes('cancel')) {
            // 用户取消，不显示提示
            return;
          } else if (err.errMsg.includes('permission')) {
            errorMsg = '需要授权电话权限';
          }
        }
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 打开地图导航
  openMap() {
    // 门店地址的经纬度
    // 地址：广东省中山市东区街道三溪路18号三溪市场首层F14-17铺位
    // 注意：以下经纬度需要根据实际门店位置进行调整
    // 可以通过百度地图、高德地图等工具查询准确坐标
    const latitude = 22.5170;  // 纬度（需要根据实际位置调整）
    const longitude = 113.3820; // 经度（需要根据实际位置调整）
    const name = '酥仙记';
    const address = '广东省中山市东区街道三溪路18号三溪市场首层F14-17铺位';

    wx.openLocation({
      latitude: latitude,
      longitude: longitude,
      name: name,
      address: address,
      scale: 18, // 地图缩放级别，18为街道级别
      success: function (res) {
        console.log('打开地图成功', res);
      },
      fail: function (err) {
        console.error('打开地图失败', err);
        let errorMsg = '打开地图失败';
        if (err.errMsg) {
          if (err.errMsg.includes('auth deny') || err.errMsg.includes('permission')) {
            errorMsg = '需要授权位置权限才能使用导航功能';
          } else if (err.errMsg.includes('cancel')) {
            // 用户取消，不显示提示
            return;
          }
        }
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 加入购物车
  addCart(e) {
    const goodsId = e.currentTarget.dataset.goodsId;
    if (!goodsId) {
      wx.showToast({
        title: '商品信息错误',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    // 检查用户是否登录
    if (!app.auth.isAuth()) {
      app.auth.auth(() => {
        this.addCart(e); // 登录成功后重新调用
      });
      return;
    }

    // 调用加入购物车接口
    const data = {
      goods_id: goodsId,
      goods_num: 1,
      item_id: 0 // 默认规格
    };

    request.post('/api/cart/add', {
      data: data,
      isShowLoading: true,
      success: function (res) {
        wx.showToast({
          title: '加入购物车成功！',
          icon: 'success',
          duration: 1500
        });
        // 更新购物车数量
        request.checkUniqueId();
      },
      fail: function (res) {
        wx.showToast({
          title: '加入购物车失败',
          icon: 'none',
          duration: 1500
        });
      },
      failStatus: function (res) {
        wx.showToast({
          title: res.data.msg || '加入购物车失败',
          icon: 'none',
          duration: 1500
        });
        return false;
      }
    });
  },

  // 请求推荐商品
  requestRecommend() {
    var that = this;
    var requestUrl = '/api/index/recommend?p=' + that.data.recommendPage;
    load.request(requestUrl, function (res) {
      if (res.data.result && res.data.result.length > 0) {
        // 处理价格格式
        for (var i = 0; i < res.data.result.length; i++) {
          var item = res.data.result[i];
          if (typeof item.shop_price === 'string') {
            item.shop_price = item.shop_price.split('.');
          } else if (typeof item.shop_price === 'number') {
            var priceStr = item.shop_price.toFixed(2);
            item.shop_price = priceStr.split('.');
          }
        }
        that.data.recommendPage++;
      }
    });
  },

  // 底部导航栏跳转
  navigateToPage(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    const currentPage = this.data.currentPage;
    
    // 如果点击的是当前页面，不进行跳转
    if (index === currentPage) {
      return;
    }

    // 更新当前页面索引
    this.setData({
      currentPage: index
    });

    // 根据索引跳转到对应页面
    switch(index) {
      case 0: // 首页
        wx.reLaunch({
          url: '/pages/index/index/index'
        });
        break;
      case 1: // 点单（购物车）
        wx.reLaunch({
          url: '/pages/cart/cart/cart'
        });
        break;
      case 2: // 取单（订单列表）
        wx.reLaunch({
          url: '/pages/shop_order/shop_order_list/shop_order_list'
        });
        break;
      case 3: // 个人中心
        wx.reLaunch({
          url: '/pages/user/index/index'
        });
        break;
    }
  },

  onLoad(options) {
    var that = this;
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    
    // 获取胶囊按钮信息
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const capsuleHeight = menuButtonInfo.height || 32;
    const capsuleTop = menuButtonInfo.top || 0;
    const capsuleBottom = capsuleTop + capsuleHeight;
    
    // 计算导航栏总高度：胶囊按钮底部 + (胶囊按钮顶部 - 状态栏高度)
    // 这样导航栏内容区域与胶囊按钮垂直居中对齐
    const navBarHeight = capsuleBottom + (capsuleTop - statusBarHeight);
    
    // 计算温馨提示区的上边距：导航栏高度 + 20rpx（约10px，与下边距一致）
    const tipsBoxMarginTop = navBarHeight + 10;
    
    this.setData({
      statusBarHeight: statusBarHeight,
      navBarHeight: navBarHeight,
      capsuleHeight: capsuleHeight,
      capsuleTop: capsuleTop,
      tipsBoxMarginTop: tipsBoxMarginTop
    });

    // 初始化推荐商品加载，禁用"加载完啦"的toast提示
    load.init(that, '', 'recommend', undefined, false);
    // 请求推荐商品数据
    that.requestRecommend();
  },

  onShow() {},

  // 下拉刷新
  onPullDownRefresh() {
    this.data.recommend = null;
    this.data.recommendPage = 1;
    load.resetConfig();
    this.requestRecommend();
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  onReachBottom() {
    if (load.canloadMore()) {
      this.requestRecommend();
    }
  }
});
