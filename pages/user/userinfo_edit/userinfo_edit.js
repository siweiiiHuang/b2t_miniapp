var app = getApp();
var setting = app.globalData.setting;
var request = app.request;
var md5 = require('../../../utils/md5.js');
var common = require('../../../utils/common.js');

Page({
    data: {
        url: setting.url,
        resourceUrl: setting.resourceUrl,
        user: null,
        type: '',
        canGetCode: false, //是否能获取验证码
        timer: '',//定时器名字
        countDownNum: '60',//倒计时初始值
        is_send:false
    },

    onLoad: function (options) {
        var that = this;
        this.setBarTitle(options.type);
        app.getConfig(function (res) {
            var sms_enable = common.getConfigByName(res.config, 'bind_mobile_sms_enable');
            var isEnable = (sms_enable == 1) ? true : false;
            that.setData({ canGetCode: isEnable });
        });
        app.getUserInfo(function (userInfo) {
            that.setData({ 
                hasMobile: userInfo.mobile != '' ? true : false,
                user: userInfo,
                type: options.type
            });
        });
       //检验是否开启短信验证修改密码
        // request.get('/home/api/send_validate_code', {
        //   failRollback: true,
        //   successReload: true,
        //   data: {
        //     mobile: this.data.user.mobile,
        //     scene: 6,
        //     type: 'mobile',
        //   },
        //   success: function (res) {   
        //     that.setData({
        //       is_send_code: res.data.status
        //     })
        //   }
        // });
    },

    setBarTitle: function (type) {
        var title = '修改个人信息';
        if (type == 'nickname') {
            title = '修改昵称';
        } else if (type == 'mobile') {
            title = '修改手机';
        } else if (type == 'email') {
            title = '修改邮箱';
        } else if (type == 'password') {
            title = '修改密码';
        } else if (type == 'paypwd') {
            title = '修改支付密码';
        } else if (type == 'sex') {
            title = '修改性别';
        }
        wx.setNavigationBarTitle({ title: title });
    },

    formSubmit: function (e) {
        var type = this.data.type;
        if (!type) {
            return;
        }
        var values = e.detail.value;
        if (type == 'nickname') {
            this.submitNickname(values);
        } else if (type == 'mobile') {
            this.submitMobile(values);
        } else if (type == 'email') {
            this.submitEmail(values);
        } else if (type == 'password') {
            this.submitPassword(values);
        } else if (type == 'paypwd') {
            this.submitPaypwd(values);
        } else if (type == 'sex') {
            this.submitSex(values);
        } else {
            app.confirmBox("处理类型出错:" + type);
        }
    },

    submitNickname: function (values) {
        if (!values.nickname) {
            app.showTextWarining("请输入昵称");
            return false;
        }
        this.requestUpdateUser({
            nickname: values.nickname
        });
    },

    submitMobile: function (values) {
        if (!values.mobile) {
            app.showTextWarining("请输入手机号");
            return false;
        }
        if (this.data.canGetCode && !values.mobile_code){
            app.showTextWarining("请输入验证码");
            return false;
        }
        this.requestUpdateUser({
            mobile: values.mobile,
            mobile_code: values.mobile_code
        });
    },

    submitEmail: function (values) {
        if (!values.email){
            app.showTextWarining("请输入邮箱");
            return false;
        }
        if (values.email.indexOf('@') < 0) {
            app.showTextWarining("邮箱格式不正确");
            return false;
        }
        this.requestUpdateUser({
            email: values.email
        });
    },

    submitPassword: function (values) {
        var hasPw = this.data.user.password;
        if (hasPw && !values.old_password){
            app.showTextWarining("请输入旧密码");
            return false;
        }
        if (!values.new_password){
            app.showTextWarining("请输入新密码");
            return false;
        }
        if (!values.confirm_password){
            app.showTextWarining("请输入确认密码");
            return false;
        }
        if (values.new_password.length < 6 || values.new_password.length > 18) {
            app.showTextWarining("密码长度不合法");
            return false;
        }
        if (values.new_password !== values.confirm_password) {
            app.showTextWarining("两次密码不一致");
            return false;
        }
        request.post('/api/user/password', {
            data: {
                old_password: md5('TPSHOP' + values.old_password),
                new_password: md5('TPSHOP' + values.new_password)
            },
            success: function (res) {
                app.showSuccess('修改成功', function() {
                    wx.navigateBack();
                });
            }
        });
    },

    submitPaypwd: function (values) {
        if (!values.paypwd_mobile) {
            app.showTextWarining("请输入手机号");
            return false;
        }
       // if (this.data.is_send_code != 0){
            if (!values.paypwd_code) {
                app.showTextWarining("请输入验证码");
                return false;
            }
       // }
        if (!values.paypwd){
            app.showTextWarining("请输入新密码");
            return false;
        }
        if (!values.paypwd_confirm){
            app.showTextWarining("请输入确认密码");
            return false;
        }
        if (values.paypwd.length < 6 || values.paypwd.length > 18) {
            app.showTextWarining("密码长度不合法");
            return false;
        }
        if (values.paypwd !== values.paypwd_confirm) {
            app.showTextWarining("两次密码不一致");
            return false;
        }
        request.post('/api/user/paypwd', {
            data: {
                new_password: md5('TPSHOP' + values.paypwd),
                mobile: values.paypwd_mobile,
                paypwd_code: values.paypwd_code,
            },
            success: function (res) {
                app.showSuccess('修改成功', function () {
                    wx.navigateBack();
                });
            }
        });
    },

    submitSex: function (values) {
        if (this.data.user.sex == 0) {
            app.showTextWarining("请选择性别");
            return false;
        }
        this.requestUpdateUser({
            sex: this.data.user.sex
        });
    },

    changeGender: function (e) {
        var gender = e.currentTarget.dataset.gender;
        var sexNum = (gender == 'boy') ? 1 : 2;
        this.setData({ 'user.sex': sexNum });
    },

    requestUpdateUser: function (data) {
        request.post('/api/user/updateUserInfo', {
            data: data,
            success: function (res) {
                if (wx.getStorageSync('withdrawals_pay')) {
                   app.showSuccess('绑定成功',function(){
                       wx.removeStorageSync('withdrawals_pay');
                       wx.reLaunch({
                           url: '/pages/user/index/index',
                       })
                   })
                } else {
                    wx.navigateBack();
                }               
            }
        });
    },

    setMobile: function (e) {
        this.data.user.mobile = e.detail.value;
    },

    getCode: function (e) {
      let that = this
      common.sendSmsCode(that.data.user.mobile, null,function(res){
        if (res.data.status==1){
          that.setData({ is_send: true });
          that.countDown();
        }
      });
    },
  countDown: function () {
    let that = this;
    let countDownNum = that.data.countDownNum;
    that.setData({
      timer: setInterval(function () {
        if (countDownNum == 0) {
          clearInterval(that.data.timer);
          that.setData({ is_send: false, countDownNum: 60 });
          return ;
        }else{
          countDownNum--;
          that.setData({
            countDownNum: countDownNum
          })
        }
      }, 1000)
    })
  }
})