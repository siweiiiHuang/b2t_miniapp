// pages/user/sign_in/sign_in.js
var app = getApp();
var setting = app.globalData.setting;
var request = app.request;

const date = new Date()
const days = []
var thisMon = date.getMonth();
var thisDay = date.getDate() ;

if (0 <= thisMon && thisMon < 9) {
    thisMon = "0" + (thisMon + 1);
} else {
    thisMon = (thisMon + 1);
}
if (0 <= thisDay && thisDay < 10) {
    thisDay = "0" + thisDay;
}

var totalDay = mGetDate(date.getFullYear(), thisMon);
for (let i = 1; i <= totalDay; i++) {
    // if (0 <= i && i < 10) {
    //     i = "0" + i;
    // }
    days.push({day:i,selected:-1})
}
function mGetDate(year, month) {
    var d = new Date(year, month, 0);
    return d.getDate();
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
      store_name: setting.appName,
      isSign:0,
      sign:false,
      sign_integral:0,
      show_sign:false,
      year: date.getFullYear(),
      month: thisMon,
      day: thisDay,
      dayArr: days,
      weekDay: ["日", "一", "二", "三", "四", "五", "六"],
      oneWeek:[],
      twoWeek: [],
      threeWeek: [],
      fourWeek: [],
      fiveWeek: [],
      sixWeek:[],
      data:[],
  },

     

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      var that = this;
      var date = that.data.year + "/" + that.data.month + "/" + 1;   //获取每个月的第一天
      var d = new Date(date);
      var weekDay = that.data.weekDay;
      var day = weekDay[d.getDay()]; //判断每月第一天是星期几
  
      var appendNum = that.addDay(day);
      if (appendNum > 0) {
          for (let i = 0; i < appendNum; i++) {
              that.data.dayArr.unshift('')
          }
      }

      //先预设值，加速加载
      if (app.globalData.userInfo) {
          that.setData({ userInfo: app.globalData.userInfo });
      }
      that.getData();
   
  },
  getData:function(){
      var that = this;
      console.log(that.data.dayArr)
      request.get('/api/User/sign', {
          success: function (res) {
              var status = false;
              var arr = res.data.result.str.split(',');
              for (var i = 0; i < that.data.dayArr.length; i++) {   
                  var str = String(that.data.dayArr[i]['day']);             
                  if (that.data.dayArr[i] && arr.indexOf(str) != -1) {             
                      if (arr.indexOf(that.data.day.toString()) != -1){    
                          status = true;
                      }
                      that.data.dayArr[i]['selected'] = that.data.dayArr[i]['day']
                  }
              }
    
              that.setData({ 
                  data: res.data.result,
                  sign: status ? status : false, 
                  show_sign: status ? status : false,
                  isSign: status ? '-4.266666rem' : ''
               });
              that.show();
          },
          fail() {
              that.show();
          }
      })
  },
    show:function(){
        var that = this;
        for (let y = 0; y < 7; y++) {
            that.data.oneWeek.push(that.data.dayArr[y])
        }
        for (let u = 7; u < 14; u++) {
            that.data.twoWeek.push(that.data.dayArr[u])
        }
        for (let g = 14; g < 21; g++) {
            that.data.threeWeek.push(that.data.dayArr[g])
        }
        for (let t = 21; t < 28; t++) {
            that.data.fourWeek.push(that.data.dayArr[t])
        }
        for (let k = 28; k < 35; k++) {
            if (that.data.dayArr[k]) {
                that.data.fiveWeek.push(that.data.dayArr[k])
            }
        }

        if (that.data.dayArr.length - 28 > 0) {
            for (let h = 35; h < that.data.dayArr.length; h++) {
                that.data.sixWeek.push(that.data.dayArr[h])
            }
            that.setData({
                sixWeek: that.data.sixWeek,
            })
        }
        that.setData({
            oneWeek: that.data.oneWeek,
            twoWeek: that.data.twoWeek,
            threeWeek: that.data.threeWeek,
            fourWeek: that.data.fourWeek,
            fiveWeek: that.data.fiveWeek,
            store_name: setting.appName
        })
    },

    clickSign:function(e){
        var that = this;
        if (!this.data.sign) {
            request.post('/api/User/user_sign', {
                data: {
                    date: this.data.year + '-' + this.data.month + '-' + this.data.day
                },
                success: function (res) {
                    app.showSuccess('签到成功', function () {
                        that.setData({
                            oneWeek: [],
                            twoWeek: [],
                            threeWeek: [],
                            fourWeek: [],
                            fiveWeek: [],
                            sixWeek: [],
                        })
                        that.getData()
                    });

                }
            });         
        }else{
            app.showWarning('今日已签到');
        }

     
    },
    back:function(){
        wx.navigateBack({
            delta:1
        })
    },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },
addDay(e){
    switch(e){
        case '一': return 1;
        case '二': return 2;
        case '三': return 3;
        case '四': return 4;
        case '五': return 5;
        case '六': return 6;
        default: return 0;
    }
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

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})