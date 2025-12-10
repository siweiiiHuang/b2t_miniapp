var app = getApp();
var request = app.request;
var setting = app.globalData.setting;

Page({
    data: {
        url: setting.url,
        store: {},
    },

    onLoad: function () {
        this.requestMyStore();
    },

    requestMyStore: function () {
        var that = this;
        request.get('/api/distribut/store', {
            success: function (res) {
                that.setData({ store: res.data.result });
            },
            failStatus: function () {
                return false;
            }
        });
    },

    submitStore: function (e) {
        var that = this;
        var myreg = /^[1][3,4,5,7,8][0-9]{9}$/;
        var data = Object.assign(e.detail.value, {store_img: this.data.store.store_img});
        if (data.store_name.replace(/\s+/g, '') == ""){
            return app.showTextWarining("请输入店铺名称");
        } else if (data.true_name.replace(/\s+/g, '') == ""){
            return app.showTextWarining("请输入真实姓名");
        } else if (data.mobile.replace(/\s+/g, '') == "") {
            return app.showTextWarining("请输入手机号");
        } else if (!myreg.test(data.mobile)){
            return app.showTextWarining("手机号不合法");
        }
        request.post('/api/distribut/store', {
            data: data,
            success: function (res) {
                app.showSuccess(res.data.msg);
                that.setData({ store: res.data.result });
                wx.navigateBack();
            }
        });
    },

    changeStoreImg: function () {
        var that = this;
        wx.chooseImage({
            count: 1, //最多1张图片,默认9
            sizeType: ['compressed', 'original'], // 可以指定是原图还是压缩图，默认二者都有
            sourceType: ['camera', 'album'], // 可以指定来源是相册还是相机，默认二者都有
            success: function (res) {
                request.uploadFile('/api/distribut/upload_store_img', {
                    filePath: res.tempFilePaths[0],
                    name: 'store_img',
                    success: function (res) {
                        that.setData({ 'store.store_img': res.data.result });
                    }
                });
            }
        });
    }

})