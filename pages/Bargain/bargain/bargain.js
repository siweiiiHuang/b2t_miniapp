// pages/index/index.js
var app = getApp();
var request = app.request;
var common = require('../../../utils/common.js');
var setting = app.globalData.setting;
var util = require('../../../utils/util.js');
Page({
  bargainClose: function (e) {
    this.setData({
      bargainRule: !this.data.bargainRule
    })
  },
  helpFriendMy: function(){
    this.setData({
        helpFriendMy: !this.data.helpFriendMy
    })
      wx.setStorageSync('is_read',true);
  },
    helpFriend: function () {
        this.setData({
            helpFriend: !this.data.helpFriend
        })
        wx.setStorageSync('is_read_f', true);
    },
  /**
   * 页面的初始数据
   */
  data: {
      url: setting.url,
       setting : app.globalData.setting,
       defaultAvatar: setting.resourceUrl + "/static/images/user68.jpg",
       bargainRule: false,
       helpFriend: false,
       helpFriendMy: false,
       over:false,
       userInfo:[],    
       datas:[],
       timer:null,
       d:'00',
       h:'00',
       m:'00',
       s:'00',
      bg_scale_data:'0rem',
      roundel_data:'0rem',
      is_cut:false,
      end:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      var that = this;
      wx.setStorageSync('is_read', false);
      wx.setStorageSync('is_read_f', false);
      if (options.first_leader) {
          wx.setStorageSync('first_leader', options.first_leader);
      }   
          that.getBragainGoods(options.id);    
  },
  
  getBragainGoods:function(id){
      var that = this;
      request.get('/api/Bargain/show_bargain', {
          data: {
              bargain_first_id: id,
          },     
          successReload:true,     
          success: function (res) {  
              var userInfo = wx.getStorageSync('app:userInfo');
              that.setData({ userInfo: userInfo ? userInfo : [] });    
              if (res.data.status == 1){                  
                  res.data.result.bargain_first_info.users.head_pic = res.data.result.bargain_first_info.users.head_pic ? common.getFullUrl(res.data.result.bargain_first_info.users.head_pic) : that.data.defaultAvatar;
                  res.data.result.cut_actor_info.forEach(function (item, index) {            
                      item.head_pic = item.head_pic ? common.getFullUrl(item.head_pic) : that.data.defaultAvatar;                
                  })     

                  that.setData({ datas: res.data.result})
                  that.createActivityTimer();
                  that.checkLoad();
              }else{
                  that.setData({ end: true })
                  app.showTextWarining(res.data.msg,function(){
                      wx.navigateBack({
                          delta:1
                      })
                  });                
              }                      
          },
          //failStatus(){}
      }); 
  },
  //加载初始化砍价逻辑
    checkLoad:function(){
        var that = this;
        var data = that.data.datas;
        var userInfo = that.data.userInfo;
        //当前用户是否砍价
    
        if (userInfo != '' && userInfo.user_id == (data.user_cut_price != null ? data.user_cut_price.user_id : 0) ){
           that.setData({
            'datas.ctodo.click' : false,
            'datas.ctodo.text' : '已帮好友砍过价',
            'datas.ctodo.bg_css' : '#999999',
            'datas.ctodo.border_css' : '0 0.064rem 0.32rem 0 #999999',
           })
        }

        //判断当前用户是否是发起人
        if (data.bargain_first_info.user_id == userInfo.user_id && userInfo.user_id >0) {
            that.setData({ 'datas.bsgf': false, helpFriendMy : wx.getStorageSync('is_read') ? false : true})
        }else{    
            that.setData({ 'datas.bsgf': true, helpFriend: that.data.is_cut ? wx.getStorageSync('is_read_f') ? false : true : false})
        }


        //计算进度条
        let bargain_first_end_price = Number(data.bargain_first_info.end_price);
        let bargain_end_price = Number(data.bargain_info.end_price);
        let bargain_start_price = Number(data.bargain_info.start_price);

        let count_cut_price = data.user_cut_price != null ? data.user_cut_price.cut_price: 0
        let order_id = Number(data.bargain_first_info.order_id);
        let w = 13.4 / (bargain_start_price - bargain_end_price);
        let l = 12.66 / (bargain_start_price - bargain_end_price);

        if (bargain_first_end_price == bargain_end_price) {  
            that.setData({
                bg_scale_data: '13.4rem', 
                roundel_data: '12.66rem' ,
                'datas.ctodo.click': false,
                'datas.ctodo.text': '砍价已完成',
                'datas.ctodo.bg_css': '#999999',
                'datas.ctodo.border_css': '0 0.064rem 0.32rem 0 #999999',
                'datas.btodo.click': false,
                'datas.btodo.text': '砍价已完成',
                'datas.btodo.bg_css': '#999999',
                'datas.btodo.border_css': '0 0.064rem 0.32rem 0 #999999',            
            })

        } else {  
            that.setData({ bg_scale_data:  w * count_cut_price + 'rem', roundel_data:   l * count_cut_price + 'rem' });
        }

        if (Number(data.bargain_first_info.order_id) > 0 ){
            that.setData({
                'datas.ctodo.click': false,
                'datas.ctodo.text': '已完成',
                'datas.ctodo.bg_css': '#999999',
                'datas.ctodo.border_css': '0 0.064rem 0.32rem 0 #999999',
                'datas.btodo.click': false,
                'datas.btodo.text': '已完成',
                'datas.btodo.bg_css': '#999999',
                'datas.btodo.border_css': '0 0.064rem 0.32rem 0 #999999',
                'datas.atodo.click': false,
                'datas.atodo.text': '已购买',
                'datas.atodo.bg_css': '#999999',
                'datas.atodo.border_css': '0 0.064rem 0.32rem 0 #999999',
            })
           
        }
    },
    /** 检查是否倒计时是否结束 */
    checkActivityTime: function () {
        var that = this;
        var t = that.data.datas.bargain_info.end_time * 1000 - (new Date()).getTime() 
        if (t > 0) {            
            var d = Math.floor(t / 1000 / 60 / 60 / 24);
            var h = Math.floor(t / 1000 / 60 / 60 % 24);
            var m = Math.floor(t / 1000 / 60 % 60);
            var s = Math.floor(t / 1000 % 60);
            if (s >= 0)
            if (d < 10) { d = '0' + d; }
            if (h < 10) { h = '0' + h; }
            if (m < 10) { m = '0' + m; }
            if (s < 10) { s = '0' + s; }
            that.setData({ d: d,h:h,m:m,s:s });
        } else {
            //结束时
            that.setData({over:true});
            app.showTextWarining('活动已结束');
            that.destroyActivityTimer();
        }
    },

    /** 创建活动倒计时定时器 */
    createActivityTimer: function () {
        var that = this;
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

    buy_now:function(e){
        var that = this;
        var id = e.currentTarget.dataset.id;  //商品id
        var data = that.data.datas;
        
        //检查用户是否登录方可操作立即购买
        if (!app.auth.isAuth()) {
            app.showLoading(null, 1500);
            app.getUserInfo();
            return;
        }
        

        //发起人没购买，才可以购买商品
        if (id>0){
            if ( Number(data.bargain_first_info.goods_num) <= Number(data.bargain_info.goods_num) ){
                var data = {
                    goods_id: data.bargain_info.goods_id,
                    item_id: data.bargain_first_info.item_id > 0 ? data.bargain_first_info.item_id : '',
                    goods_num: data.bargain_first_info.goods_num,
                    action: 'buy_now',
                }
                wx.navigateTo({ url: '/pages/cart/cart2/cart2?' + util.Obj2Str(data) });              
            }else{            
                app.showTextWarining('购买数量超过此商品购买上限');
            }
        }
    },
    //砍价
    cut:function(e){
        var that = this;
        var id = e.currentTarget.dataset.first;

        //检查用户是否登录方可操作立即购买
        if (!app.auth.isAuth()) {
            app.showLoading(null, 1500);
            app.getUserInfo();
            return;
        }

        request.post('/api/Bargain/bargain_cut', {
            data: {
                bargain_first_id: id
            },
            success: function (res) {
                if (res.data.status == 1) {        
                    that.setData({is_cut:true});
                    that.getBragainGoods(that.data.datas.bargain_first_info.id)
                } else {                   
                    app.showTextWarining(res.msg);                    
                }
            }
        });
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
      if (this.data.datas != '' && this.data.datas.bargain_first_info.id){
          this.getBragainGoods(this.data.datas.bargain_first_info.id)
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
    * 转发按钮
    */
    onShareAppMessage: function (res) {
        var that = this
        return {
            title: '砍价活动',//自定义转发标题
            path: '/pages/Bargain/bargain/bargain?id=' + that.data.datas.bargain_first_info.id +'&first_leader=' + wx.getStorageSync('app:userInfo')['user_id']
        }
    }
})