var app = getApp();
var request = app.request;
var util = require('../../../utils/util.js');
var common = require('../../../utils/common.js');

Page({
  data: {
    url: app.globalData.setting.url,
    resourceUrl: app.globalData.setting.resourceUrl,
    
    // 订单数据
    order: null,
    orderPrices: null,
    goods: null, // 立即购买商品参数
    
    // 地址相关
    selectedAddress: null,
    
    // 快递相关
    selectedExpressCode: '', // 选中的快递编码
    expressFee: '0.00', // 快递费用
    sfFeeText: '物流费：计算中...', // 顺丰快递费文本
    jdFeeText: '物流费：计算中...', // 京东快递费文本
    isPickup: false, // 是否自提
    
    // 优惠券相关
    coupons: [], // 可用优惠券列表
    coupon: null, // 已选优惠券
    couponText: '未使用',
    
    // 发票相关
    invoiceText: '不开发票',
    invoice_title: '',
    invoice_desc: '不开发票',
    taxpayer: '',
    
    // 留言相关
    formData: {
      user_note: '',
    },
    messageLength: 0,
    
    // UI状态
    canSubmit: false,
    submitBtnText: '请选择快递',
    showToast: false,
    toastText: '',
    
    // 用户信息
    userId: null,
    boxCount: 1, // 商品数量（箱数）
  },

  onLoad: function (options) {
    var that = this;
    
    // 获取用户信息
    app.getUserInfo(function (userInfo) {
      that.setData({ 
        userId: userInfo.user_id 
      });
    }, true, false);
    
    // 判断是立即购买还是购物车结算
    if (options.goods_id) {
      // 立即购买
      that.setData({
        goods: {
          goods_id: options.goods_id,
          item_id: options.item_id || 0,
          goods_num: options.goods_num || 1,
          action: 'buy_now'
        }
      });
    }
    
    // 加载订单数据
    that.requestCart2();
  },

  onShow: function () {
    // 从地址选择页面返回时刷新
    var selectedAddress = wx.getStorageSync('selectedAddress');
    if (selectedAddress) {
      this.setData({
        'order.userAddress': selectedAddress
      });
      wx.removeStorageSync('selectedAddress');
      // 地址变化后重新计算物流费和价格
      this.getExpressFee();
      this.calculatePrice();
    }
  },

  /** 请求订单数据 */
  requestCart2: function () {
    var that = this;
    var data = {};
    
    if (that.data.goods) {
      // 立即购买
      data = {
        goods_id: that.data.goods.goods_id,
        item_id: that.data.goods.item_id,
        goods_num: that.data.goods.goods_num,
        action: that.data.goods.action,
      };
    }
    
    request.get('/api/cart/cart2', {
      failRollback: true,
      data: data,
      success: function (res) {
        // 处理商品价格格式
        var cartList = res.data.result.cartList || [];
        var totalBoxCount = 0;
        
        cartList.forEach(function(item) {
          if (item.member_goods_price) {
            item.member_goods_price = parseFloat(item.member_goods_price).toFixed(2).split('.');
          }
          totalBoxCount += parseInt(item.goods_num);
        });
        
        that.setData({ 
          order: res.data.result,
          boxCount: totalBoxCount
        });
        
        // 处理优惠券
        if (res.data.result.userCouponNum && res.data.result.userCouponNum.usable_num > 0) {
          that.setData({ 
            coupons: res.data.result.userCartCouponList || []
          });
        }
        
        // 获取默认地址
        if (res.data.result.userAddress) {
          that.setData({
            selectedAddress: res.data.result.userAddress,
            'order.userAddress': res.data.result.userAddress
          });
          // 有地址后计算物流费
          that.getExpressFee();
        } else {
          that.showToastMsg('请先选择收货地址');
        }
      },
      failStatus: function(res) {
        if (res.data.status == 0) {
          wx.showModal({
            title: res.data.msg,
            showCancel: false,
            success: function (res) {
              if (res.confirm) {
                wx.navigateBack();
              }
            }
          });
        }
        return false;
      }
    });
  },

  /** 获取快递费用 */
  getExpressFee: function () {
    var that = this;
    
    if (!that.data.order || !that.data.order.userAddress || !that.data.order.userAddress.address_id) {
      console.log('缺少地址信息，无法计算物流费');
      return;
    }
    
    if (!that.data.userId) {
      console.log('缺少用户ID，无法计算物流费');
      return;
    }
    
    // 显示计算中状态
    that.setData({
      sfFeeText: '物流费：计算中...'
    });
    
    console.log('开始计算物流费，参数：', {
      user_id: that.data.userId,
      address_id: that.data.order.userAddress.address_id,
      boxCount: that.data.boxCount
    });
    
    // 调用顺丰物流费计算接口
    request.post('/api/ShunfengLogistics/calcFeeV2', {
      data: {
        user_id: that.data.userId,
        address_id: that.data.order.userAddress.address_id,
        boxCount: that.data.boxCount
      },
      success: function (res) {
        console.log('物流费计算结果：', res);
        if (res.data.status == 1 && res.data.result) {
          var fee = parseFloat(res.data.result.fee || 0).toFixed(2);
          that.setData({
            sfFeeText: '物流费：¥' + fee,
            expressFee: fee
          });
          // 物流费获取成功后重新计算总价
          that.calculatePrice();
        } else {
          that.setData({
            sfFeeText: '物流费：计算失败'
          });
          console.log('物流费计算失败：', res.data.msg);
        }
      },
      fail: function (err) {
        that.setData({
          sfFeeText: '物流费：计算失败'
        });
        console.log('物流费计算接口调用失败：', err);
      },
      failStatus: function (res) {
        that.setData({
          sfFeeText: '物流费：计算失败'
        });
        console.log('物流费计算接口返回错误：', res.data.msg);
        return false;
      }
    });
  },

  /** 选择快递 */
  selectExpress: function (e) {
    var that = this;
    var code = e.currentTarget.dataset.code;
    var name = e.currentTarget.dataset.name;
    
    that.setData({
      selectedExpressCode: code,
      canSubmit: true,
      submitBtnText: '提交订单'
    });
    
    // 重新计算价格
    that.calculatePrice();
    
    that.showToastMsg('已选择' + name);
  },

  /** 计算订单价格 */
  calculatePrice: function () {
    var that = this;
    
    if (!that.data.order || !that.data.order.userAddress) {
      return;
    }
    
    var data = {
      address_id: that.data.order.userAddress.address_id,
    };
    
    // 添加优惠券
    if (that.data.coupon) {
      data.coupon_id = that.data.coupon.id;
    }
    
    // 添加商品信息
    if (that.data.goods) {
      data.goods_id = that.data.goods.goods_id;
      data.item_id = that.data.goods.item_id;
      data.goods_num = that.data.goods.goods_num;
      data.action = that.data.goods.action;
    }
    
    request.get('/api/cart/cart3', {
      data: data,
      success: function (res) {
        if (res.data.status == 1) {
          var prices = res.data.result;
          
          // 添加快递费到总价（只有选择了快递且不是自提时）
          if (that.data.selectedExpressCode && !that.data.isPickup && that.data.expressFee) {
            var totalPrice = parseFloat(prices.orderTotalPrice) + parseFloat(that.data.expressFee);
            prices.orderTotalPrice = totalPrice.toFixed(2);
            // 更新显示的快递费
            prices.expressFee = that.data.expressFee;
          } else {
            prices.expressFee = '0.00';
          }
          
          that.setData({
            orderPrices: prices
          });
          
          console.log('价格计算完成：', prices);
        }
      },
      fail: function (err) {
        console.log('价格计算失败：', err);
      }
    });
  },

  /** 选择地址 */
  selectAddress: function () {
    wx.navigateTo({
      url: '/pages/user/address_list/address_list?operate=select'
    });
  },

  /** 选择优惠券 */
  selectCoupon: function () {
    var that = this;
    if (that.data.coupons.length == 0) {
      that.showToastMsg('暂无可用优惠券');
      return;
    }
    // 跳转到优惠券选择页面
    wx.navigateTo({
      url: '/pages/user/coupon_list/coupon_list?from=order'
    });
  },

  /** 选择发票 */
  selectInvoice: function () {
    wx.navigateTo({
      url: '/pages/user/invoice/invoice'
    });
  },

  /** 留言输入 */
  onMessageInput: function (e) {
    var value = e.detail.value;
    this.setData({
      'formData.user_note': value,
      messageLength: value.length
    });
  },

  /** 提交订单 */
  submitOrder: function () {
    var that = this;
    
    if (!that.data.canSubmit) {
      that.showToastMsg('请先选择快递方式');
      return;
    }
    
    if (!that.data.order || !that.data.order.userAddress) {
      that.showToastMsg('请先选择收货地址');
      return;
    }
    
    that.showToastMsg('订单提交中，请稍候...');
    
    // 构建订单参数
    var orderData = {
      address_id: that.data.order.userAddress.address_id,
      invoice_title: that.data.invoice_title,
      taxpayer: that.data.taxpayer,
      user_note: that.data.formData.user_note,
      express_code: that.data.selectedExpressCode,
      express_fee: that.data.expressFee,
    };
    
    // 添加优惠券
    if (that.data.coupon) {
      orderData.coupon_id = that.data.coupon.id;
    }
    
    // 添加商品信息（立即购买）
    if (that.data.goods) {
      orderData.goods_id = that.data.goods.goods_id;
      orderData.item_id = that.data.goods.item_id;
      orderData.goods_num = that.data.goods.goods_num;
      orderData.action = that.data.goods.action;
    }
    
    // 提交订单
    request.post('/api/cart/cart3', {
      data: orderData,
      success: function (res) {
        if (res.data.status == 1) {
          var result = res.data.result;
          // 跳转到支付页面
          wx.redirectTo({
            url: '/pages/cart/cart4/cart4?order_sn=' + result.order_sn + 
                 '&order_id=' + result.order_id + 
                 '&order_amount=' + result.order_amount
          });
        } else {
          that.showToastMsg(res.data.msg || '订单提交失败');
        }
      },
      fail: function () {
        that.showToastMsg('订单提交失败，请重试');
      }
    });
  },

  /** 显示提示信息 */
  showToastMsg: function (text) {
    var that = this;
    that.setData({
      toastText: text,
      showToast: true
    });
    
    setTimeout(function () {
      that.setData({
        showToast: false
      });
    }, 1500);
  }
});