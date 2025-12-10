/**
 * 系统配置
 */
module.exports = {
    appName: 'TPshop商城',
    versionCode: '2.0.0',                 //小程序软件版本
    // url: 'https://b2t.tp-shop.cn',
    // url:'http://192.168.0.250:1001',
    url: 'https://xuxing.yunpute.com',
    // url: 'http://junlin.tpsns.com/',//'http://192.168.0.250:1001',//'http://192.168.0.146:1005',//'http://www.b2t.com',//'http://www.zidingyi.com:1005',// https://b2t.tp-shop.cn
    //转发按钮配置
    share: {
        title:'TPshop商城',//自定义转发标题
        path: '/pages/index/index/index?first_leader=' + wx.getStorageSync('app:userInfo')['user_id'] 
    }
};
