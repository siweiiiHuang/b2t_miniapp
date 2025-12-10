var app = getApp();
var setting = app.globalData.setting;
var request = app.request;
import Regions from '../../../utils/regions/Regions.js';

Page({
    data: {
        url: setting.url,
        resourceUrl: setting.resourceUrl,
        address: {}, //收货地址信息
    },

    onLoad: function () {
        this.initRegions();
    },

    /** 初始化区域弹框相关 */
    initRegions: function () {
        var that = this;
        new Regions(this, 'regions', {
            endAreaLevel:2,
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

    submitSupplier: function (e) {
        if (!e.detail.value.suppliers_contacts || !e.detail.value.suppliers_phone 
            || !this.data.address.province || !this.data.address.city) {
            return app.showTextWarining('请补全信息');
        }
        request.post('/api/supplier/add_supplier', {
            data: {
                suppliers_contacts: e.detail.value.suppliers_contacts,
                suppliers_phone: e.detail.value.suppliers_phone,
                province_id: this.data.address.province,
                city_id: this.data.address.city,
            },
            success: function (res) {
                app.showSuccess(res.data.msg, function () {
                    wx.navigateBack();
                });
            }
        });
    }

});