var app = getApp();
var request = app.request;

Page({
  data: {
    url: app.globalData.setting.url,
    resourceUrl: app.globalData.setting.resourceUrl,
    shopList: null, //门店列表
    datas: null,
    is_set: false,
    selected: 0,
  },

  onLoad: function (options) {
    console.log(options)
    console.log(JSON.parse(options.datas))
    var datas = JSON.parse(options.datas);
    //this.requestAddressList(datas);
    options.datas && this.setData({ shopList: datas })
  },

  onShow: function () {
    if (this.data.is_set) {
      let datas = JSON.parse(this.data.datas);
      this.setData({
        shopList: JSON.stringify(datas)
      })
    }
  },
  shop_page(e) {
    wx.navigateTo({
      url: '../shopDetail/shopDetail?datas=' + JSON.stringify(this.data.shopList[e.currentTarget.dataset.index]),
    })
  },

  

  /** 请求自提点地址列表数据 */
  requestAddressList: function (datas) {
    var that = this;
    request.post('/Home/Api/shop', {
      data: {
        province_id: datas.province,
        city_id: datas.city,
        district_id: datas.district,
        shop_address: '',//datas.address
        longitude: datas.longitude,
        latitude: datas.latitude
      },
      successReload: true,
      success: function (res) {
        that.checkShopList(res.data.result);
       
        
      }
    });
  },
  radioChange: function (e) {
    this.setData({ selected: e.detail.value })
  },
  selectAddress: function (e) {
    this.setData({ selected: e.currentTarget.dataset.index })
  },

  checkShopList:function(data){
      if(data && data.length> 0){
        this.setData({ shopList: data });
        wx.stopPullDownRefresh();
        return
      }
      wx.showModal({
        title: '获取提示',
        content: '当前地址附件没有门店',
        showCancel:false,
        success:function(res){
          if (res.confirm){
            wx.navigateBack({
              delta: 1
            })
          }
        }
      })
  },
  
  formSubmit: function () {

    let data = this.data.shopList[this.data.selected];
    let user = JSON.parse(this.data.datas);

    let pages = getCurrentPages();//当前页面
    let prevPage = pages[pages.length - 2];//上一页面
    //直接给上移页面赋值 
    prevPage.setData({
      is_set: true,
      'shop_id': data.shop_id,
      'shop_name': data.shop_name,
     
    });

    wx.navigateBack({
      delta: 1
    })
  }

})