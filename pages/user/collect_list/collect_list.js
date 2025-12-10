var app = getApp();
var request = app.request;
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;

Page({
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl,
        collects: null, //请求的数据
        currentPage: 1
    },

    onLoad: function () {
        load.init(this, '', 'collects');
        this.requestCollectList();
    },

    requestCollectList: function () {
        var that = this;
        var requestUrl = '/api/user/getGoodsCollect/' + '?p=' + that.data.currentPage;
        load.request(requestUrl, function (res) {
            that.data.currentPage++;
        });
    },

    onReachBottom: function () {
        if (load.canloadMore()) {
            this.requestCollectList();
        }
    },

    /** 取消收藏 */
    cancelCollect: function (e) {
        var goodsId = e.currentTarget.dataset.id;
        var that = this;
        request.post('/api/goods/collectGoodsOrNo', {
            data: { goods_id: goodsId },
            success: function (res) {
                app.showSuccess(res.data.msg);
                that.deleteItemData(goodsId);
            }
        });
    },

    /** 删除单项数据 */
    deleteItemData: function (goodsId) {
        for (var i = 0; i < this.data.collects.length; i++) {
            if (this.data.collects[i].goods_id == goodsId) {
                this.data.collects.splice(i, 1);
                this.setData({ collects: this.data.collects });
                break;
            }
        }
    }

});