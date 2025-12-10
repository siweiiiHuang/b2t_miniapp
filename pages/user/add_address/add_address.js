var app = getApp();
var setting = app.globalData.setting;
var request = app.request;
import Regions from '../../../utils/regions/Regions.js';

Page({
    data: {
        url: setting.url,
        resourceUrl: setting.resourceUrl,
        address: {}, //收货地址信息
        disabled:false,
    },

    onLoad: function (options) {
        var that = this;
        that.setData({ address: options });
        app.getUserInfo(function (userInfo) {
            that.setData({ user: userInfo });
        });
        that.initRegions();
    },

    /** 初始化区域弹框相关 */
    initRegions: function () {
        var that = this;
        new Regions(this, 'regions', {
            endAreaLevelCall: function (parentId, regionName, address) {
                Object.assign(that.data.address, address);
                that.setData({
                    'address.province_name': that.data.address.province_name,
                    'address.city_name': that.data.address.city_name,
                    'address.district_name': that.data.address.district_name,
                    'address.twon_name': that.data.address.twon_name,
                });
            }
        });
    },

    submitAddress: function (e) {
        var that = this;
        that.setData({ disabled: true });
        var address = that.data.address;       
        Object.assign(address, e.detail.value);
        address.is_default = Number(address.is_default);
        if (!app.validatemobile(this.data.address.mobile)) {
            return;
        }
        request.post('/api/user/addAddress', {
            data: address,
            failRollback: false,
            success: function (res) {
                if(res.data.status == 1){
                    if (e.detail.value.is_default == 1 && address.address_id) {
                        wx.setStorageSync('cart:cart2:address', address);
                    }
                    app.showSuccess(res.data.msg, function () {
                        wx.navigateBack();
                    });
                }else{
                    app.confirmBox(res.data.msg);
                    that.setData({ disabled: true })
                }
                
            }
        });
    },

    /** 删除地址 */
    deleteAddress: function () {
        var addressId = this.data.address.address_id;
        if (!addressId) {
            return;
        }
        wx.showModal({
            title: '确定删除？',
            success: function (res) {
                res.confirm && request.post('/api/user/del_address', {
                    data: { id: addressId },
                    success: function (res) {
                        app.showSuccess('删除成功', function () {
                            wx.navigateBack();
                        }, 500);
                    }
                });
            }
        })
    },

});