// pages/news/news_detail/news_detail.js
var app = getApp();
import LoadMore from '../../../utils/LoadMore.js'
var load = new LoadMore;
var util = require('../../../utils/util.js');
var WxParse = require('../../../utils/wxParse/wxParse.js');
var request = app.request;
var common = require('../../../utils/common.js');

Page({

    /**
     * 页面的初始数据
     */
    data: {
        url: app.globalData.setting.url,
        resourceUrl: app.globalData.setting.resourceUrl + '/static/images/user68.jpg',
        news:[],
        down:null,
        up:null,
        like:null,
        comment:null,
        comment_text:'',
        share_btn: false, //自定义分享按钮状态
        actionSheetHidden: true,  //自定义actionSheet隐藏True
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        if (options.scene) {
            var scene = decodeURIComponent(options.scene)
            var data = scene.split('&')
            options.article_id = data[0].split('=')[1]
            options.first_leader = data[1].split('=')[1]
        }
        if (options.first_leader) {
            wx.setStorageSync('first_leader', options.first_leader);
        }   
        this.getNews(options.article_id);
    },

    getNews: function (article_id) {
        var that = this;
        request.get('/Api/News/news_detail?article_id=' + article_id + '&is_json=1', {
            success: function (res) {
                res.data.result.comment.forEach(function (val, index, arr){
                    if (val.time < 1440 && val.time >= 60 ){
                        val.hour = parseInt(val.time / 60)
                    } else if (val.time > 1440){
                        val.day = parseInt(val.time / 1440)
                    }

                    if (val.head_pic){
                        val.head_pic = common.getFullUrl(val.head_pic)
                    }else{
                        val.head_pic = that.data.resourceUrl;
                    }                   
                })

                res.data.result.news.publish_time = util.format(res.data.result.news.publish_time,'yyyy-M-d');
                that.setData({ news: res.data.result.news, down: res.data.result.down, up: res.data.result.up, like: res.data.result.like, comment: res.data.result.comment})
                WxParse.wxParse('content', 'html', res.data.result.news.content, that, 6);
            }
        })
    },

    like:function(e){ 
        //检查用户是否登录方可操作
        if (!app.auth.isAuth()) {
            app.showLoading(null, 1500);
            app.getUserInfo();
            return;
        }

        var that = this; 
        request.post('/Api/News/newsLike', {
            data: {
                comment_id: e.currentTarget.dataset.comment_id,
            },
            successReload:true,
            success: function (res) {           
                    app.showSuccess(res.data.msg, function () {
                        that.getNews(that.data.news.article_id)
                    })                
            }
        })
    },
    send:function(){
        var that = this;
        //检查用户是否登录方可操作
        if (!app.auth.isAuth()) {
            app.showLoading(null, 1500);
            app.getUserInfo();
            return;
        }

        if (that.data.comment_text == ''){
            return app.showWarning('请输入评论内容');
        }

        request.post('/Api/News/newsComment', {
            data:{
                article_id: that.data.news.article_id,
                content: that.data.comment_text
            },
            success: function (res) {
                if (res.data.status == 1){
                    that.setData({ comment_text:''});
                    app.showSuccess(res.data.msg,function(){
                        wx.setStorageSync('news:comment:update', true);
                        that.getNews(that.data.news.article_id)
                    })
                }
            }
        })
    },
    input: function (e) {
        this.setData({ comment_text:e.detail.value})
    },
    read:function(e){
        this.getNews(e.currentTarget.dataset.id)
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


    catchShare: function () {
        this.setData({
            actionSheetHidden: false
        })

    },

    listenerActionSheet: function (e) {
        this.setData({
            actionSheetHidden: !this.data.actionSheetHidden
        })
    },

    /**
     * 获取商品分享海报
     */
    getSharePic: function () {
        var that = this
        that.setData({
            actionSheetHidden: !this.data.actionSheetHidden
        })
        wx.showLoading({
            title: '正在生成',
            mask: true,
        })

        wx.getImageInfo({
            src: that.data.url + '/api/News/newsSharePoster?news_id=' + that.data.news.article_id,
            success: function (res) {
                that.setData({
                    share_btn: true,
                    share_pic: res.path
                })
            },
            complete: function (res) {
                wx.hideLoading()
            }
        })
    },

    closeShareModal: function () {
        this.setData({
            share_btn: false
        })

    },

    saveSharePic: function () {
        var that = this
        wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: function (res) {
                wx.saveImageToPhotosAlbum({
                    filePath: that.data.share_pic,
                    success: function (res) {
                        that.setData({
                            share_btn: false
                        })
                        wx.showToast({
                            title: '保存成功',
                            duration: 2000
                        })
                    }
                })
            },
            fail: function (res) {
                common.checkAuthorize('scope.writePhotosAlbum')
            }
        })

    },

    previewSharePic: function () {
        wx.previewImage({
            urls: [this.data.share_pic],
        })
    },


    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
        var that = this;
        var url = that.data.url;
        return {
            title: that.data.news.title,//自定义转发标题
            path: '/pages/news/news_detail/news_detail?first_leader=' + wx.getStorageSync('app:userInfo')['user_id'] + '&article_id=' + that.data.news.article_id,
            imageUrl: that.data.news.thumb ? url + that.data.news.thumb : ''
        }
    }
})