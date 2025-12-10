var app = getApp();
var request = require('../../../utils/request.js');

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl,
        addresses: null, //请求的地址列表
        operate: null, //操作类型，select：订单选择地址操作，其他：普通展示
    },

    onLoad: function (options) {
        this.data.operate = options.operate;
    },

    onShow: function () {
        this.requestAddressList();
    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        this.requestAddressList();
    },

    /** 请求地址列表数据 */
    requestAddressList: function () {
        var that = this;
        request.get(that.data.url + '/api/user/ajaxAddressList', {
            success: function (res) {
                that.setData({ addresses: res.data.result });
                wx.stopPullDownRefresh();
            }
        });
    },

    /** 修改地址 */
    editAddress: function (e) {
        var address = this.getAddressData(e.currentTarget.dataset.id);
        var params = '';
        for (var item in address) {
            params += (params.length != 0 ? '&' : '?') + (item + '=' + address[item]);
        }
        params && wx.navigateTo({ url: "/pages/user/add_address/add_address" + params });
    },

    /** 填写订单(商品详情)的时候可触发选择地址 */
    selectAddress: function (e) {
        var data = {};
        var item = e.currentTarget.dataset.item;
            data.consignee = item.consignee;
            data.mobile = item.mobile;
            data.province_name = item.province_name;
            data.province = item.province;
            data.city_name = item.city_name;
            data.city = item.city;
            data.district_name = item.district_name;
            data.twon_name = item.twon_name;
            data.address =  item.address;
            data.address_id = item.address_id;
            data.district = item.district;
            data.latitude = item.latitude;
            data.longitude = item.longitude;
            
        if (this.data.operate == null){
            return;
        }
        if (this.data.operate == 'select') {          
            //更新订单页的地址           
            wx.setStorageSync('cart:cart2:address', data);
        } else if (this.data.operate == 'teamSelect') {
            //更新拼团订单页的地址
            wx.setStorageSync('team:confirm:address', data);
        } else if (this.data.operate == 'selectAddress'){
            //更新商品详情的配送地
            var totalAddress = item.province_name + item.city_name + item.district_name;
            data.address2 = totalAddress;
            wx.setStorageSync('goodsInfo:goodsInfo:address', data);
        }
        wx.navigateBack();
    },

    /** 由addressId获取地址数据 */
    getAddressData: function (addressId) {
        var addresses = this.data.addresses;
        for (var idx in addresses) {
            if (addresses[idx].address_id == addressId) {
                break;
            }
        }
        if (!idx) {
            return {};
        }
        return addresses[idx];
    }

})