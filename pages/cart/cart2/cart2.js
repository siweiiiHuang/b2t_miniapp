var app = getApp();
var request = app.request;
var util = require('../../../utils/util.js');
var common = require('../../../utils/common.js');
var md5 = require('../../../utils/md5.js');




const date = new Date()
const years = []
const months = []
const days = []
const hours = []
const minutes = []
var thisMon = date.getMonth();
var thisDay = date.getDate() +1;
var thisHours = date.getHours();
var thisMinutes = date.getMinutes();
for (let i = 2017; i <= date.getFullYear() + 1; i++) {
    years.push(i)
}

for (let i = date.getMonth(); i <= 11; i++) {
    var k = i;
    if (0 <= i && i < 9) {
        k = "0" + (i + 1);
    } else {
        k = (i + 1);
    }
    months.push(k)
}
if (0 <= thisMon && thisMon < 9) {
    thisMon = "0" + (thisMon + 1);
} else {
    thisMon = (thisMon + 1);
}
if (0 <= thisDay && thisDay < 10) {
    thisDay = "0" + thisDay;
}

if (thisMinutes < 10){
    thisMinutes = "0" + thisMinutes;
}

var totalDay = mGetDate(date.getFullYear(), thisMon);
for (let i = 1; i <= 31; i++) {
    var k = i;
    if (0 <= i && i < 10) {
        k = "0" + i
    }
    days.push(k)
}

for (let i = 0; i <= 23; i++) {
    var k = i;
    if (0 <= i && i < 10) {
        k = "0" + i
    }
    hours.push(k)
}
for (let i = 0; i <= 59; i++) {
    var k = i;
    if (0 <= i && i < 10) {
        k = "0" + i
    }
    minutes.push(k)
}
function mGetDate(year, month) {
    var d = new Date(year, month, 0);
    return d.getDate();
}

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl,
        goods: null, //立即购买商品参数
        order: null, //请求的订单数据
        orderPrices: null, //请求的订单价格数据
        coupons: null, //可用的优惠券
        coupon: null, //已使用的优惠券     
        payWithUserMoney: true, //是否使用余额支付
        payWithPoints: true, //是否使用积分支付
        maxWord: 0,
        enterAddressPage: false,
        firstEnter: true, //是否第一次进入页面
        invoice_title: '',
        taxpayer: '',
        invoice_desc:'不开发票',
        text:'不开发票',
        formData: {          
            pay_points: '',
            user_money: '',
            paypwd: '',
            user_note: '',
        },
        shopList:null,
        shop_id :null,
        shop_name: '选择门店',
        items: [
            { name: '快速配送', value: '工作日、双休日与节假日均可送货', checked: 'true'},          
        ],
        submit_datas:{
            shop_id: '',                //自提id
            submit_text: '',            //页面展示自提时间
            submit_address: '',         //页面展示自提地点
            name:'',                    //自提人
            mobile:'',                  //自提联系方式
            time:'',                    //自提时间
        },
        submit: false,
        is_set: false,
        submit_heigth_css:240,
        selected:0,
        checkTime: date.getFullYear() + "-" + thisMon + "-" + thisDay + " " + thisHours + ":" + thisMinutes,
        //---时间控件参数
        flag: true,
        years: years,
        year: date.getFullYear(),
        months: months,
        month: thisMon,
        days: days,
        day: thisDay,
        value: [1, 0, thisDay - 1, thisHours, thisMinutes],
        hours: hours,
        hour: thisHours,
        minutes: minutes,
        minute: thisMinutes,    
        weekDay: ["星期天", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
    },

    onLoad: function (options) { 
        var that = this
        var date = this.data.year + "/" + this.data.month + "/" + this.data.day;
        var d = new Date(date);
        var weekDay = this.data.weekDay;
        var day = weekDay[d.getDay()];

        this.setData({ 
         goods: options,
        'submit_datas.submit_text': ' 【' + day + '】',
        'submit_datas.time': this.data.year + '-' + this.data.month + '-' + this.data.day + ' ' + this.data.hour + ':' + this.data.minute
             });
        this.requestCart2();
        this.requestInvoice();
        //可用余额实时刷新
        var that = this;
        app.getUserInfo(function (userInfo) {
            that.setData({ userInfo: userInfo });
        }, true, false);
        //加载积分使用配置
        app.getConfig(function (res) {
            var is_use = common.getConfigByName(res.config, 'is_use_integral');
            if (0 == is_use) {
                that.setData({ 'userInfo.pay_points': 0})
            }
        });
    },

    //重新加载数据
    onShow: function () {
        this.setData({ order: this.data.order });
        if (this.data.enterAddressPage) {
            this.data.enterAddressPage = false;
            var address = wx.getStorageSync('cart:cart2:address'); 
            if (address !== '') {
                wx.removeStorageSync('cart:cart2:address');
            }
            this.requestCart2(address); //改变地址要重新请求数据
        } else if (!this.data.firstEnter && this.checkAddressList()) {
            var conponUse = wx.getStorageSync('cart:cart2:cid');     
            this.setData({ coupon: conponUse ,text:this.data.text});
            this.calculatePrice(); //其他操作离开页面要重新计算价格
        }
        this.data.firstEnter = false;      

        if(this.data.is_set)  {
            this.data.is_set = false;
            this.setData({ 'submit_datas.submit_address': this.data.submit_datas.submit_address})
        }
    },
    onUnload:function(){
        var conponUse = wx.getStorageSync('cart:cart2:cid');
        if (conponUse) {
            wx.removeStorageSync('cart:cart2:cid');
        }
    },
    /** 获取用户收货地址 */
    getDefaultAddress: function (){
        var that = this;        
            request.get('/api/User/ajaxAddressList', {
                success: function (res) {
                    if (res.data.result.length > 0) {
                        var address = res.data.result[0] || null;
                        that.setData({ 'order.userAddress': address });
                        that.getShopList();
                        if (that.checkAddressList()) {
                            that.calculatePrice();
                        } 
                  } else {
                    wx.chooseAddress({
                      success(res) {
                        that.setData({ enterAddressPage: true})
                        that.submitAddress(res)
                      }
                    })
                  }                   
                }
            });             
    },
    
    

    //获取微信地址并保存为默认地址
    submitAddress: function (data) {
      var that = this;
      var address = {
        address: data.detailInfo,
        city: 0,
        city_name: data.cityName,
        consignee: data.userName,
        district: 0,
        district_name: data.countyName,
        is_default: 1,
        mobile: data.telNumber,
        province: 0,
        province_name: data.provinceName,
        twon: 0,
        twon_name: ''
      };
      
      
      if (!app.validatemobile(address.mobile)) {
        return;
      }
      request.post('/api/user/addAddress', {
        data: address,
        failRollback: false,
        successReload: true,
        success: function (res) {
          if (res.data.status == 1) {
            address.address_id = res.data.result
            that.setData({ 
              'order.userAddress': address,              
               });
          } 
        }
      });
    },



    /** 发票 */
    requestInvoice:function (){
        var that = this;
        request.get('/api/cart/invoice', {
            failRollback: false,
            successReload: true,
            success: function (res) {
                if (res.data.result.invoice_title){
                    var text = res.data.result.invoice_desc == '不开发票' ? '不开发票' : '纸质 ( ' + res.data.result.invoice_title + '-' + res.data.result.invoice_desc + ' )';
                    that.setData({
                        text: text,
                        invoice_title: res.data.result.invoice_title,
                        invoice_desc: res.data.result.invoice_desc,
                        taxpayer: res.data.result.taxpayer,
                    })
                }               
            }
        });  
    },
    requestCart2: function (address) {
        var that = this;
        var data;
        if (this.data.goods.action) { //商品立即购买跳转
            data = {
                goods_id: this.data.goods.goods_id,
                item_id: this.data.goods.item_id,
                goods_num: this.data.goods.goods_num,
                action: this.data.goods.action,
            };
        } 
        request.get('/api/cart/cart2', {
            failRollback: true,
            data: data,
            success: function (res) {
              var j = 0;
              for (var i of res.data.result.cartList){
                res.data.result.cartList[j].member_goods_price = parseFloat(i.member_goods_price).toFixed(2).toString().split('.')
                j++
              }
              console.log('================================',res.data.result.cartList[0])
                that.setData({ order: res.data.result });   
                if (res.data.result.userCouponNum.usable_num > 0){
                    that.setData({ coupons: res.data.result.userCartCouponList });      
                }   else{
                    that.setData({ coupons: []});      
                }                        
                if (address) {
                    that.setData({ 'order.userAddress': address });
                    that.getShopList();
                    if (that.checkAddressList()) {
                        that.calculatePrice();
                    }                   
                } else if (wx.getStorageSync('goodsInfo:goodsInfo:address')){
                    that.setData({ 'order.userAddress': wx.getStorageSync('goodsInfo:goodsInfo:address') });
                    that.getShopList();
                    wx.removeStorageSync('goodsInfo:goodsInfo:address');
                    if (that.checkAddressList()) {
                        that.calculatePrice();
                    }                    
                }
                else{
                    that.getDefaultAddress();
                }                          
            },
            failStatus: function(res){
                if (res.data.status == 0){
                    wx.showModal({
                        title: res.data.msg,
                        showCancel: false,
                        success: function (res) {
                            if (res.confirm) {
                                wx.navigateBack();
                            }
                        },
                        fail: function () {
                            wx.navigateBack();
                        }
                    });
                } else if (res.data.status == -1) {
                    that.setData({ order: null });
                    that.checkAddressList();
                }
                return false;
            }
        });
    },   
    checkAddressList: function () {
        var that = this;    
        if (!that.data.order || that.data.order.userAddress == null) {
            wx.showModal({
                title: '请先填写或选择收货地址~',
                success: function (res) {
                    if (res.confirm) {
                        that.enterAddressPage();
                    } else {
                        wx.navigateBack();
                    }
                },
                fail: function () {
                    wx.navigateBack();
                }
            });
            return false;
        }
        return true;
    },
  //判断获取预约门店还是获取自提点
  getShopList: function () {
    var that = this; 
    wx.authorize({
      scope: 'scope.userLocation',
      success:function(res){
        wx.getLocation({
          type: 'wgs84',
          success(res2) {
            that.data.order.cartList[0]['goods']['is_virtual'] ==2 ? that.requestShopList(res2) : that.getSubmitAddressDatas(res2);  
            
          }
        })
      }
    })
    
    
  },
  requestShopList:function(res){
    var that = this;
    var datas = that.data.order.userAddress
    request.post('/Home/Api/shop', {
      data: {
        province_id: datas.province,
        city_id: datas.city,
        district_id: datas.district,
        shop_address: '',//datas.address
        longitude: res.longitude,
        latitude: res.latitude
      },
      successReload: true,
      success: function (res) {
        console.log('shopList',res)
        if (res.data.result.length == 0) {
          that.setData({
            shop_list: null,
            shop_id: null,
            shop_name: '选择门店',
          })
          wx.showModal({
            title: '下单提示',
            content: '当前地址附近没有门店',
            showCancel: false
          })
          return
        }
        that.setData({
          shop_list: res.data.result,
          shop_id: res.data.result[0].shop_id,
          shop_name: res.data.result[0].shop_name,
        })
      }
    });
  },
    /** 显示发票信息 */
    showInvoice:function() {
        wx.navigateTo({
            url: '../../cart/invoice/invoice',
        })
    },

    keyUpChangePay1:function(e) {
        this.setData({
            payWithUserMoney: e.detail.value.length > 0 ? false : true
        });
    },

    // keyUpChangePay2: function (e) {
    //     this.setData({
    //         payWithPoints: e.detail.value.length > 0 ? false : true
    //     });
    // },

    keyUpChangeNum:function(e) {
        this.setData({
            maxWord: e.detail.value.length
        });
    },

    /** 请求计算价格 */
    calculatePrice: function (formData, submitOrder) {
        var that = this;
        if (typeof formData == 'undefined') {
            formData = that.data.formData;
        } else {
            that.data.formData = formData;
        }
        var pwd = formData.paypwd ? md5('TPSHOP' + formData.paypwd) : '';
        var postData;
        var submitTime = '';
        if (this.data.submit_datas.time != ''){
            submitTime = this.data.submit_datas.time.replace(/-/g, '/');
            submitTime = Date.parse(new Date(submitTime)) / 1000
        }
        if (!!!that.data.order.userAddress){
            return app.showTextWarining('请添加地址',function(){
                that.setData({ enterAddressPage: true })
                wx.navigateTo({
                    url: '../../user/address_list/address_list',
                })
            });
        }

        if (this.data.goods.action) {
            postData = {
                address_id: that.data.order.userAddress.address_id,
                invoice_title: that.data.invoice_title ? that.data.invoice_title : '',
                taxpayer: that.data.taxpayer ? that.data.taxpayer : '',
                invoice_desc: that.data.invoice_desc ? that.data.invoice_desc : '',
              pay_points: formData.pay_points ? formData.pay_points : this.data.available_integral,
                user_money: formData.user_money ? formData.user_money : 0,
                //payPwd: pwd,
                //pay_pwd: pwd,
                act: submitOrder ? 'submit_order' : 'order_price',
                user_note: formData.user_note,
                coupon_id: that.data.coupon ? that.data.coupon.id : '',
                goods_id: this.data.goods.goods_id,
                item_id: this.data.goods.item_id,
                goods_num: this.data.goods.goods_num,
                action: this.data.goods.action,
                shop_id: this.data.submit ? this.data.submit_datas.shop_id:'',
                take_time: submitTime,
                consignee: this.data.submit ? this.data.submit_datas.name : '',
                mobile: this.data.submit ? this.data.submit_datas.mobile : '',
            };

              postData = submitOrder ? that.getBespeakFormData(postData) : postData
            
        } else {
            postData = {
                address_id: that.data.order.userAddress.address_id,
                invoice_title: that.data.invoice_title ? that.data.invoice_title : '',
                taxpayer: that.data.taxpayer ? that.data.taxpayer : '',
                invoice_desc: that.data.invoice_desc ? that.data.invoice_desc : '',
                pay_points: formData.pay_points ? formData.pay_points : 0,
                user_money: formData.user_money ? formData.user_money : 0,
                //payPwd: pwd,
                //pay_pwd: pwd,
                act: submitOrder ? 'submit_order' : 'order_price',
                user_note: formData.user_note,
                coupon_id: that.data.coupon ? that.data.coupon.id : '',
                shop_id: this.data.submit ? this.data.submit_datas.shop_id : '',
                take_time: submitTime,
                consignee: this.data.submit ? this.data.submit_datas.name : '',
                mobile: this.data.submit ? this.data.submit_datas.mobile : '',
            };
        }
        request.post('/api/cart/cart3', {
            data: postData,
            success: function (res) {
                if (res.data.result.integral_msg) {
                    app.showTextWarining(res.data.result.integral_msg)
                    that.setData({ available_integral: res.data.result.pay_points})
                }
                if (!submitOrder) {
                    that.setData({ orderPrices: res.data.result })
                    return;
                }
                wx.removeStorageSync('bespeakFormData');
                wx.removeStorageSync('bespeak_template_unit');
                var order_type = that.data.order.cartList[0].prom_type;
                if (that.data.submit) {
                  order_type = 9
                }

                if (that.data.orderPrices.order_amount <= 0){
                    wx.setStorageSync('order:order_list:update', true);
                  var url_param = (that.data.order.cartList[0]['goods']['is_virtual'] == 2) ? '&goods_name=' + that.data.order.cartList[0]['goods']['goods_name'] + '&take_time=' + postData.take_time : ''
                    wx.redirectTo({
                      url: '/pages/payment/payment/payment?order_sn=' + res.data.result + '&order_amount=' + that.data.orderPrices.total_amount + '&order_type=' + order_type + url_param
                    });
                }else{
                    
                    
                    
                    var params = (that.data.order.cartList[0]['goods']['is_virtual'] == 2) ? {
                        order_sn: res.data.result,
                        order_type: 7,
                        goods_name: that.data.order.cartList[0]['goods']['goods_name'],
                        take_time: postData.take_time
                    } : {
                      order_sn: res.data.result,
                      order_type: order_type,
                    };

                    var url = '/pages/cart/cart4/cart4?' + util.Obj2Str(params);
                    wx.redirectTo({ url: url });
                }
            },
            failStatus: function (res) {
                if (res.data.msg == '请先设置支付密码') {
                    wx.showModal({
                        title: '请先设置支付密码',
                        success: function (res) {
                            if (res.confirm) {
                                wx.navigateTo({ url: '/pages/user/userinfo/userinfo' });
                            } else {
                                wx.navigateBack();
                            }
                        },
                        fail: function () {
                            wx.navigateBack();
                        }
                    });
                } else if (res.data.status == -5){
                    that.setData({ available_integral:''})
                } else if (res.data.status == -6) {
                    that.setData({ available_balance: '' })
                }                
            }
        });
    },
    getSubmitAddressDatas:function(res){
        var that = this;
        var datas = that.data.order.userAddress
        request.post('/Home/Api/shop', {
            data: {
                province_id: datas.province,
                city_id: datas.city,
                district_id: datas.district,
                shop_address: '',//datas.address
                longitude: res.longitude,
                latitude: res.latitude
            },
            successReload: true,
            success: function (res) {
                if (res.data.result.length > 0 ) {
                    var items = [{ name: '快速配送', value: '工作日、双休日与节假日均可送货', checked: 'true' },{ name: '上门自提', value: '选择自提上门点并支付订单>收到提货短信>到自提点提货' }]
                    that.setData({
                        items: items,
                        'submit_datas.shop_id': res.data.result[0].shop_id,
                        'submit_datas.submit_address': res.data.result[0].shop_name,
                        'submit_datas.name': datas.consignee,
                        'submit_datas.mobile': datas.mobile,
                        submit_heigth_css:240
                    })
                }else{
                    that.setData({ items: [{ name: '快速配送', value: '工作日、双休日与节假日均可送货', checked: 'true' }], submit_heigth_css: 120, submit: false}) 
                }
            }       
        });
    },
    radioChange:function(e){
        if (parseInt(e.detail.value) == 1){             
            this.setData({
                submit:true
            })
            this.calculatePrice();
        }else{
            this.setData({
                submit: false,
                //'submit_datas.shop_id':''
            })
            this.calculatePrice();
        }
    },

    showdate:function(){
        this.setData({ flag:false})
    },
    getSubmitAddress(){
        wx.navigateTo({
            url: '../../cart/submit_address/submit_address?selected='+ this.data.selected +'&datas=' + JSON.stringify(this.data.order.userAddress),
        })
    },
    /** 提交订单 */
    submitForm: function (e) {
        if (this.data.order.cartList[0]['goods']['is_virtual'] == 2 && !this.data.shop_id){
            wx.showModal({
              title: '操作提示',
              content: '请先选择门店',
              showCancel:false
            })
            return
        }

        var submitOrder = (e.detail.target.id == 'submitOrder') ? true : false;
        this.calculatePrice(e.detail.value, submitOrder);
    },

    /** 使用优惠券 */
    useCoupon: function () {
        if (this.data.order.couponNum <= 0){
            return app.showTextWarining("无可用优惠券");
        }
        console.log(this.data.coupon)
        var params = {
            lid: this.data.coupon ? this.data.coupon.id : '0',
        };
        wx.navigateTo({ url: '/pages/user/checkcoupon/checkcoupon?' + util.Obj2Str(params) });
    },

    enterAddressPage: function() {
        this.data.enterAddressPage = true;
        wx.navigateTo({ url: '/pages/user/address_list/address_list?operate=select' });
    },
    
     /**     预约模板              */
  showBespeakTpl:function(){
    wx.setStorage({
      key: 'bespeak_template_unit',
      data: this.data.order.cartList[0]['goods']['bespeak_template_unit'],
      success:function(res){
        wx.navigateTo({
          url: './cart2Bespeak/cart2Bespeak',
        })
      }
    })
    
  },

  //获取填写的预约信息
  getBespeakFormData:function(data){
    if (this.data.order.cartList[0]['goods']['is_virtual'] != 2){
        return data;
    }
   var datas =  wx.getStorageSync('bespeakFormData');
    if (!datas){
     return data;
   }
  var form_data = datas.form_data
  for (var k in form_data) {
    if (typeof form_data[k] == 'object') {
      form_data[k].forEach(function (i, s) {
        data[k + '[' + s + ']'] = i
      })
    } else {
      data[k] = form_data[k]
    }
  }
  data['shop_id'] =  this.data.shop_id;
  return data
  },

  showShopList:function(){
    if(!this.data.shop_list){
      wx.showModal({
        title: '操作提示',
        content: '当前地址附近没有门店',
        showCancel: false
      })
      return
    }
    wx.navigateTo({
      url: './shopList/shopList?datas='  + JSON.stringify(this.data.shop_list),
    })
  },

    /** 日期插件s */
    showModel: function (e) {
        this.setData({ flag: false });
    },
    getTime: function (e) {
        var times = this.data.year + "-" + this.data.month + "-" + this.data.day      
        var date_time_picker_mask = times;
        var date = date_time_picker_mask.replace(/-/g, '/');
        var d = new Date(date);
 
        var weekDay = this.data.weekDay;
        var day = weekDay[d.getDay()];

        this.setData({
            flag: true,
            checkTime: times  + " " + this.data.hour + ":" + this.data.minute ,
            'submit_datas.submit_text': ' 【' + day + '】',
            'submit_datas.time': times + " " + this.data.hour + ":" + this.data.minute,
        });

    },
    bindChange: function (e) {
        const val = e.detail.value
        this.setData({
            year: this.data.years[val[0]],
            month: this.data.months[val[1]],
            day: this.data.days[val[2]],
            hour: this.data.hours[val[3]],
            minute: this.data.minutes[val[4]],
        })
        var totalDay = mGetDate(this.data.year, this.data.month);
        var changeDate = [];
        for (let i = 1; i <= totalDay; i++) {
            var k = i;
            if (0 <= i && i < 10) {
                k = "0" + i
            }
            changeDate.push(k)
        }
        this.setData({
            days: changeDate
        })
    },
    /** 日期插件e */

  catchtouchmove:function(){
    return 
  },
  //使用积分
  user_pay_points:function(d){
    var e = Object();
    if (d.detail.value){
      e.pay_points = this.data.userInfo.pay_points;
    }else{
      e.pay_points = 0;
    }

    this.setData({ available_integral: e.pay_points})
    this.calculatePrice(e);
  }
})
