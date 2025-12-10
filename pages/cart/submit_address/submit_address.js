var app = getApp();
var request = require('../../../utils/request.js');

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl,
        addresses: null, //请求的地址列表
        name:'',
        mobile:'',
        datas:null,
        is_set:false,
        selected:0,
    },

    onLoad: function (options) {
        var datas = JSON.parse(options.datas);
        this.requestAddressList(datas);
        options.datas && this.setData({ name: datas.consignee, mobile: datas.mobile, datas: options.datas, selected: options.selected})
    },

    onShow: function () {
        if (this.data.is_set){
            let datas = JSON.parse(this.data.datas);
            datas.consignee = this.data.name;
            datas.mobile = this.data.mobile;
            this.setData({
                name: this.data.name,
                mobile: this.data.mobile,
                datas: JSON.stringify(datas)
            })
        }
    },
    shop_page(e) {
        var id = e.currentTarget.dataset.id;
        this.setData({ webUrl: "/mobile/Cart/shop?shop_id=" + id });
        wx.navigateTo({ url: '/pages/index/webview/webview' });
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        this.requestAddressList();
    },

    /** 请求自提点地址列表数据 */
    requestAddressList: function (datas) {
        var that = this;
        wx.authorize({
            scope: 'scope.userLocation',
            success: function (res) {
                wx.getLocation({
                    type: 'wgs84',
                    success(res2) {
                        request.post('/Home/Api/shop', {
                            data: {
                                province_id: datas.province,
                                city_id: datas.city,
                                district_id: datas.district,
                                shop_address: '',//datas.address
                                longitude: res2.longitude,
                                latitude: res2.latitude
                            },
                            successReload: true,
                            success: function (res) {
                                that.setData({ addresses: res.data.result });
                                wx.stopPullDownRefresh();
                            }
                        });
                    }
                })
            }
        })
    },
    radioChange:function(e){
        this.setData({selected:e.detail.value})
    },
    getUser:function(){
        wx.navigateTo({
            url: '../../cart/submit_people/submit_people?datas=' + this.data.datas,
        })
    },
    formSubmit:function(){

        let data = this.data.addresses[this.data.selected];
        let user = JSON.parse(this.data.datas);
   
        let pages = getCurrentPages();//当前页面
        let prevPage = pages[pages.length - 2];//上一页面
        //直接给上移页面赋值 
        prevPage.setData({
            is_set: true,
            'submit_datas.shop_id': data.shop_id,
            'submit_datas.submit_address': data.shop_name,
            'submit_datas.name': user.consignee,
            'submit_datas.mobile': user.mobile,   
            selected: this.data.selected    
        });

        wx.navigateBack({
            delta: 1
        })  
    }

})