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
    
    // 配送 / 快递相关
    selectedExpressCode: '', // 选中的快递编码
    expressFee: '0.00', // 快递费用
    sfFeeText: '物流费：请选择快递方式', // 初始提示选择快递
    jdFeeText: '物流费：请选择快递方式', 
    isPickup: false, // 是否自提
    expressFeeCalculated: false, // 物流费是否计算完成
    pickupStore: {   // 自提门店信息（固定写死）
      name: '酥仙记',
      address: '广东省中山市东区街道三溪路18号三溪市场首层F14-17铺位',
      businessTime: '08:30-18:30',
      phone: '13902829834/14748088324'
    },
    
    // 优惠券相关
    coupons: [], // 可用优惠券列表
    coupon: null, // 已选优惠券
    
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
    submitBtnText: '请选择配送方式',
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
    
    // 加载发票信息
    that.requestInvoice();
  },

  onShow: function () {
    var that = this;
    
    // 从地址选择页面返回时刷新
    var selectedAddress = wx.getStorageSync('selectedAddress');
    if (selectedAddress) {
      that.setData({
        'order.userAddress': selectedAddress
      });
      wx.removeStorageSync('selectedAddress');
      // 地址变化后重新计算物流费和价格
      that.getExpressFee();
      that.calculatePrice();
      return;
    }
    
    // 从优惠券选择页面返回时刷新
    var couponUse = wx.getStorageSync('cart:cart2:cid');
    if (couponUse) {
      that.setData({ 
        coupon: couponUse
      });
      that.calculatePrice(); // 重新计算价格
    }
  },

  onUnload: function () {
    var couponUse = wx.getStorageSync('cart:cart2:cid');
    if (couponUse) {
      wx.removeStorageSync('cart:cart2:cid');
    }
  },

  /** 发票 */
  requestInvoice: function () {
    var that = this;
    request.get('/api/cart/invoice', {
      failRollback: false,
      successReload: true,
      success: function (res) {
        if (res.data.result && res.data.result.invoice_title) {
          var text = res.data.result.invoice_desc == '不开发票' ? '不开发票' : '纸质 ( ' + res.data.result.invoice_title + '-' + res.data.result.invoice_desc + ' )';
          that.setData({
            invoiceText: text,
            invoice_title: res.data.result.invoice_title,
            invoice_desc: res.data.result.invoice_desc,
            taxpayer: res.data.result.taxpayer,
          });
        }
      }
    });
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
          // 处理商品图片URL
          if (item.goods_img) {
            // 如果goods_img是完整的URL（以http开头），直接使用
            if (item.goods_img.indexOf('http') === 0) {
              item.imageUrl = item.goods_img;
            } else {
              // 否则拼接resourceUrl
              item.imageUrl = that.data.resourceUrl + item.goods_img;
            }
          } else {
            // 如果没有goods_img字段，使用API生成图片URL
            item.imageUrl = that.data.url + '/api/goods/goodsThumImages?goods_id=' + item.goods_id + '&width=200&height=200';
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
          // 接口已经返回默认地址，直接使用
          that.setData({
            selectedAddress: res.data.result.userAddress,
            'order.userAddress': res.data.result.userAddress
          });
          // 有地址后计算物流费(但不显示，等待选择后显示)
          that.getExpressFee();
        } else {
          // 没有地址信息时，从用户地址列表中获取默认地址
          that.getDefaultAddress();
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

  /** 获取用户默认收货地址（用于本页直接填充） */
  getDefaultAddress: function () {
    var that = this;
    request.get('/api/User/ajaxAddressList', {
      success: function (res) {
        var list = (res.data && res.data.result) || [];
        if (list.length > 0) {
          // 优先使用 is_default == 1 的地址，否则取第一个
          var defaultAddress = list.find(function (item) { return item.is_default == 1; }) || list[0];
          that.setData({
            selectedAddress: defaultAddress,
            'order.userAddress': defaultAddress
          });
          // 有地址后计算物流费(但不显示，等待选择后显示)
          that.getExpressFee();
        } else {
          that.showToastMsg('请先选择收货地址');
        }
      }
    });
  },

  /** 获取快递费用 */
  getExpressFee: function () {
    var that = this;

    // 自提不需要计算快递费
    if (that.data.isPickup) {
      that.setData({
        expressFeeCalculated: true,
        expressFee: '0.00',
        sfFeeText: '物流费：¥0.00'
      });
      that.calculatePrice();
      return;
    }
    
    if (!that.data.order || !that.data.order.userAddress || !that.data.order.userAddress.address_id) {
      console.log('缺少地址信息，无法计算物流费');
      return;
    }
    
    if (!that.data.userId) {
      console.log('缺少用户ID，无法计算物流费');
      return;
    }
    
    // 显示提示选择状态，重置计算完成标识
    that.setData({
      sfFeeText: '物流费：请选择快递方式',
      expressFeeCalculated: false
    });
    
    console.log('开始计算物流费，参数：', {
      user_id: that.data.userId,
      address_id: that.data.order.userAddress.address_id,
      boxCount: that.data.boxCount
    });
    
    // 调用顺丰物流费计算接口（直接使用 wx.request，因返回结构与公共 request 不一致）
    wx.request({
      url: app.globalData.setting.url + '/api/ShunfengLogistics/calcFeeV2',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: {
        user_id: that.data.userId,
        address_id: that.data.order.userAddress.address_id,
        boxCount: that.data.boxCount
      },
      success: function (res) {
        // 接口返回格式：
        // { success: true, errorCode: '', errorMessage: '', data: { totalPrice: 10, ... } }
        if (res.data && res.data.success && res.data.data && res.data.data.totalPrice != null) {
          var fee = parseFloat(res.data.data.totalPrice || 0).toFixed(2);
          // 只计算不显示，等待选择后再显示
          that.setData({
            expressFee: fee,
            expressFeeCalculated: true // 标记计算完成
          });
          // 物流费获取成功后重新计算总价
          that.calculatePrice();
        } else {
          that.setData({
            sfFeeText: '物流费：计算失败',
            expressFeeCalculated: true // 即使失败也标记为已计算
          });
          console.log('物流费计算失败：', res.data && (res.data.errorMessage || res.data.msg || res.errMsg));
        }
      },
      fail: function (err) {
        that.setData({
          sfFeeText: '物流费：计算失败',
          expressFeeCalculated: true // 即使失败也标记为已计算
        });
        console.log('物流费计算接口调用失败：', err);
      }
    });
  },

  /** 选择快递 */
  selectExpress: function (e) {
    var that = this;

    // 非快递配送模式下不处理快递选择
    if (that.data.isPickup) {
      return;
    }

    var code = e.currentTarget.dataset.code;
    var name = e.currentTarget.dataset.name;
    
    // 选择后才显示计算好的费用
    let feeText = `物流费：¥${that.data.expressFee}`;
    
    that.setData({
      selectedExpressCode: code,
      sfFeeText: feeText, // 显示费用
      canSubmit: true,
      submitBtnText: '提交订单'
    });
    
    // 重新计算价格
    that.calculatePrice();
    
    that.showToastMsg('已选择' + name);
  },

  /** 计算订单价格 */
  calculatePrice: function (formData, submitOrder) {
    var that = this;
    
    if (!that.data.order || !that.data.order.userAddress) {
      return;
    }
    
    if (typeof formData == 'undefined') {
      formData = that.data.formData;
    } else {
      that.data.formData = formData;
    }
    
    var postData = {
      address_id: that.data.order.userAddress.address_id,
      invoice_title: that.data.invoice_title || '',
      taxpayer: that.data.taxpayer || '',
      invoice_desc: that.data.invoice_desc || '不开发票',
      act: submitOrder ? 'submit_order' : 'order_price',
      user_note: formData.user_note || '',
      coupon_id: that.data.coupon ? that.data.coupon.id : '',
      // 物流相关参数
      express_code: that.data.isPickup ? '' : that.data.selectedExpressCode,
      express_fee: that.data.isPickup ? 0 : (that.data.selectedExpressCode ? that.data.expressFee : 0),
      is_pickup: that.data.isPickup ? 1 : 0
    };
    
    // 添加商品信息（立即购买）
    if (that.data.goods) {
      postData.goods_id = that.data.goods.goods_id;
      postData.item_id = that.data.goods.item_id;
      postData.goods_num = that.data.goods.goods_num;
      postData.action = that.data.goods.action;
    }
    
    request.post('/api/cart/cart3', {
      data: postData,
      success: function (res) {
        if (res.data.status == 1) {
          if (!submitOrder) {
            // 只是计算价格，更新显示
            var prices = res.data.result;
            
            // 统一价格格式为两位小数
            prices.goods_price = parseFloat(prices.goods_price || 0).toFixed(2);
            prices.order_amount = parseFloat(prices.order_amount || 0).toFixed(2);
            prices.shipping_price = parseFloat(prices.shipping_price || 0).toFixed(2);
            
            // 处理优惠券抵扣金额
            prices.coupon_price = parseFloat(prices.coupon_price || 0).toFixed(2);
            prices.integral_money = parseFloat(prices.integral_money || 0).toFixed(2);
            prices.order_prom_amount = parseFloat(prices.order_prom_amount || 0).toFixed(2);
            
            // 设置物流费显示并重新计算总价
            var expressFee = 0;
            if (that.data.isPickup) {
              expressFee = 0;
              prices.expressFee = '0.00';
            } else {
              expressFee = that.data.selectedExpressCode ? parseFloat(that.data.expressFee) : 0;
              prices.expressFee = expressFee.toFixed(2);
            }
            
            // 确保订单总价 = 商品总价 + 物流费 - 优惠券抵扣 - 积分抵扣 - 订单优惠
            var totalAmount = parseFloat(prices.goods_price) + expressFee - parseFloat(prices.coupon_price) - parseFloat(prices.integral_money) - parseFloat(prices.order_prom_amount);
            prices.total_amount = totalAmount.toFixed(2);
            
            that.setData({
              orderPrices: prices
            });
            
            console.log('价格计算完成：', prices);
          } else {
            // 提交订单成功，跳转到支付页面
            var result = res.data.result;
            console.log(result,'res');
            
            wx.redirectTo({
              url: '/pages/cart/cart4/cart4?order_sn=' + result.order_sn + 
                   '&order_id=' + (result.order_id || '') + 
                   '&order_amount=' + that.data.orderPrices.total_amount
            });
          }
        } else {
          if (submitOrder) {
            that.showToastMsg(res.data.msg || '订单提交失败');
          }
        }
      },
      fail: function (err) {
        console.log('价格计算失败：', err);
        if (submitOrder) {
          that.showToastMsg('订单提交失败，请重试');
        }
      }
    });
  },

  /** 选择地址 */
  selectAddress: function () {
    wx.navigateTo({
      url: '/pages/user/address_list/address_list?operate=select'
    });
  },

  /** 配送方式切换：快递 / 自提 */
  changeDeliveryType: function (e) {
    var that = this;
    var type = e.currentTarget.dataset.type; // express / self

    if (type === 'self') {
      // 到店自提
      that.setData({
        isPickup: true,
        selectedExpressCode: '',
        expressFee: '0.00',
        expressFeeCalculated: true,
        sfFeeText: '物流费：¥0.00', // 自提始终显示0
        canSubmit: true,              // 自提不需要再选快递，允许直接提交
        submitBtnText: '提交订单'
      });
      // 自提重新算价（不带快递费）
      that.calculatePrice();
      that.showToastMsg('已选择到店自提');
    } else {
      // 快递配送
      that.setData({
        isPickup: false,
        selectedExpressCode: '',
        expressFee: '0.00',
        expressFeeCalculated: false,
        sfFeeText: '物流费：请选择快递方式', // 重置为提示选择
        canSubmit: false,             // 需要重新选择快递公司
        submitBtnText: '请选择快递'
      });
      // 快递模式下重新计算快递费及总价
      that.getExpressFee();
      that.calculatePrice();
      that.showToastMsg('已选择快递配送');
    }
  },

  /** 选择优惠券 */
  selectCoupon: function () {
    var that = this;
    if (that.data.coupons.length == 0) {
      that.showToastMsg('暂无可用优惠券');
      return;
    }
    
    // 跳转到优惠券选择页面，使用与cart2相同的参数格式
    var params = {
      lid: that.data.coupon ? that.data.coupon.id : '0',
    };
    var url = '/pages/user/checkcoupon/checkcoupon';
    if (params.lid !== '0') {
      url += '?lid=' + params.lid;
    }
    wx.navigateTo({ url: url });
  },

  /** 选择发票 */
  selectInvoice: function () {
    wx.navigateTo({
      url: '../../cart/invoice/invoice'
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

  /** 表单提交处理 */
  submitForm: function (e) {
    var that = this;
    
    // 检查是否是提交订单按钮
    var submitOrder = (e.detail.target.id == 'submitOrder') ? true : false;
    
    // 调用calculatePrice，传入表单数据和是否提交订单的标识
    that.calculatePrice(e.detail.value, submitOrder);
  },

  /** 提交订单（保留原有函数作为备用） */
  submitOrder: function () {
    var that = this;
    
    if (!that.data.canSubmit) {
      that.showToastMsg('请先选择配送方式');
      return;
    }
    
    if (!that.data.order || !that.data.order.userAddress) {
      that.showToastMsg('请先选择收货地址');
      return;
    }
    
    that.showToastMsg('订单提交中，请稍候...');
    
    // 使用 calculatePrice 函数提交订单，传入 submitOrder = true
    that.calculatePrice(that.data.formData, true);
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