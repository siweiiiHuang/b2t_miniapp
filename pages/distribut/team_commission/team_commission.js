//index.js
var app = getApp();
var request = app.request;

Page({
  data: {
      user: {},
      distribut:{},
  },
    onShow: function () {
            this.commission();     
    },
    commission: function () {
        var that = this;
        request.post('/api/Distribut/distribut_detail', {
            successReload: true,
            success: function (res) {
                if (res.data.result) {
                    that.setData({ distribut: res.data.result.distribut, user: res.data.result.user})
                }
            }
        });
    },
})
