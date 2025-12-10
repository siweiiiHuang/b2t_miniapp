// pages/cart/invoice/invoice.js
var app = getApp();
var request = app.request;
var common = require('../../../utils/common.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
      invoicesType: [
          { name: '个人', checked: true },
          { name: '单位', checked: false }
      ],
      invoicesContent: [
          { name: '商品明细', checked: false },
          { name: '商品类别', checked: false },
          { name: '不开发票', checked: true }
      ],
      invoicesVlue: 0,
      invoicesVlues: 0,
      Company: true,
      invoiceToggle: false, //写发票抬头开关
      invoiceToggles: false, //发票内容开关
      invoice_title:'',
      taxpayer:'',
      status:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      let pages = getCurrentPages();//当前页面
      let prevPage = pages[pages.length - 2];//上一页面
      if (prevPage.data.invoice_title != '个人') {
          this.setData({ invoicesVlue: 1 })
          this.data.invoicesType[0].checked = false;
          this.data.invoicesType[1].checked = true;
          this.setData({  Company: false })
      } else if (prevPage.data.invoice_title == '个人'){
          this.setData({ invoicesVlue: 0 })
      }

      if (prevPage.data.invoice_desc == '商品明细') {
          this.data.invoicesContent[0].checked = true;
          this.data.invoicesContent[1].checked = false;
          this.data.invoicesContent[2].checked = false;
          this.setData({ invoicesVlues: 0 })
      } else if (prevPage.data.invoice_desc == '商品类别'){    
          this.data.invoicesContent[0].checked = false;
          this.data.invoicesContent[1].checked = true;
          this.data.invoicesContent[2].checked = false;   
          this.setData({ invoicesVlues: 1 })   
      } else if(prevPage.data.invoice_desc == '不开发票'){
          this.data.invoicesContent[0].checked = false;
          this.data.invoicesContent[1].checked = false;
          this.data.invoicesContent[2].checked = true;     
          this.setData({ invoiceToggle: true, Company: true, invoicesVlues: 2})
      }

      this.setData({
          invoicesType: this.data.invoicesType,
          invoicesContent: this.data.invoicesContent,
          name: prevPage.data.invoice_title != '个人' ? prevPage.data.invoice_title : '',
          invoice_title: prevPage.data.invoice_title != '个人' ? prevPage.data.invoice_title : '',
          numbers: prevPage.data.taxpayer,
          taxpayer: prevPage.data.taxpayer,
      })       
  },
  radioTypeChange: function (e) {
      this.setData({ invoicesVlue: e.detail.value, status:true })
      if (e.detail.value == 1) {
          this.setData({ Company: false })
      } else {
          this.setData({ Company: true })
      }
  },
  radioContentChange: function (e) {
      this.setData({ invoicesVlues: e.detail.value, status: true})
      if (e.detail.value == 2) {
          this.setData({ invoiceToggle: true, Company: true})
      } else {
          this.setData({ invoiceToggle: false })
          this.data.invoicesVlue ==1 && this.setData({ Company: false })        
      }
  },
  nameInfo:function(e){
      this.setData({ invoice_title: e.detail.value, status: true})
  },
  numberInfo: function (e) {
      this.setData({ taxpayer: e.detail.value, status: true })
  },
  submit:function(){
      var that = this;
      var invoice_desc = '';
      var title  = that.data.invoicesVlue == 1 ? that.data.invoice_title : '个人';  
       if(!that.data.status){
           wx.navigateBack({
               delta:1
           })
           return;
       }

      if (that.data.invoicesVlue == 1 && that.data.invoicesVlues != 2){
          if (!that.data.invoice_title){
              app.confirmBox('请输入单位名称');
              return false;
          }
          if (!that.data.taxpayer) {
              app.confirmBox('请输入纳税人识别号');
              return false;
          }

          var orgCode = that.data.taxpayer.substring(6, 9);
          var check = common.orgcodevalidate(orgCode);
          if (!check){
              app.confirmBox('请输入正确的纳税人识别号');
              return false;
          }

          if ((that.data.taxpayer.length == 15) || (that.data.taxpayer.length == 18) || (that.data.taxpayer.length == 20)) {
          } else {
              app.confirmBox('请输入正确的纳税人识别号');
              return false;
          }

      }

      if (that.data.invoicesVlues == 0){
          invoice_desc = '商品明细';
      }
      else if (that.data.invoicesVlues == 1) {
          invoice_desc = '商品类别';
      }
      else{
          invoice_desc = '不开发票';
      }

      var postData = {
          invoice_title: title,
          taxpayer: that.data.taxpayer,
          invoice_desc: invoice_desc
      }
      request.post('/api/cart/save_invoice', {
          data: postData,
          successReload:true,
          success: function (res) {
              if (invoice_desc == '不开发票'){
                  var text = invoice_desc;
              }else{
                  var text = '纸质 ( ' + title + '-' + invoice_desc + ' )';
              }
              
              let pages = getCurrentPages();//当前页面
              let prevPage = pages[pages.length - 2];//上一页面
              //直接给上移页面赋值 
              prevPage.setData({
                  text: text,
                  invoice_title: title,
                  taxpayer: that.data.taxpayer,
                  invoice_desc: invoice_desc,                  
              });

              wx.navigateBack({
                  delta:1
              })
            
          },    
      });

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

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})