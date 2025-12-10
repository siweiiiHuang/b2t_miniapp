// pages/test/test.js
var app = getApp();
var request = app.request;
var util = require('../../../../utils/util.js')


const date = new Date()
const years = [date.getFullYear()]
const months = []
const days = []
const hours = []

// for (let i = 2018; i <= date.getFullYear(); i++) {
//   years.push(i)
// }

for (let i = 1; i <= 12; i++) {
  months.push(i)
}

for (let i = 1; i <= 31; i++) {
  days.push(i)
}

for (let i = 0; i <= 23; i++) {
  hours.push(i)
}



Page({

  /**
   * 页面的初始数据
   */
  data: {
    form_data: {

    },
    picker_val: {

    },
    time_picker: false,
    years: years,
    months: months,
    days: days,
    hours: hours,
    time_str: '',
    img_url: {},
    url: app.globalData.setting.url,
    bespeak_template_unit:{},
    picker_view_value:[0,date.getMonth(),date.getDate()-1,date.getHours()]

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    wx.getStorage({
      key: 'bespeakFormData',
      success: function(res) {
        that.setData(res.data)
      },
    })
    
    wx.getStorage({
      key: 'bespeak_template_unit',
      success: function(res) {
        that.formVerifyType(res.data)
        that.setData({
          time_start: util.format((new Date).getTime() / 1000, 'yyyy-MM-dd'),
          time_end: util.format((new Date).getTime() / 1000 + 31536000, 'yyyy-MM-dd'),
          bespeak_template_unit:res.data
        })
      },
    })
    
    
  },

 
  verifyFormData: function () {
    //遍历form_data
    var that = this
    var form_type = this.data.form_type
    var status = true
    for (var k in form_type) {

      if (!that.verifyFunc(k)) {
        status = false
        break;
      }

    }
    if (status) {
      wx.setStorage({
        key: 'bespeakFormData',
        data: this.data,
        success:function(res){
          wx.navigateBack({
            delta:1
          })
        }
      })
    }
  },

  verifyFunc: function (type_name) {
    var status = true
    var value = this.data.form_data[type_name]
    if (typeof value == 'object') {
      value = value[0]
    }
    var _type = this.data.form_type[type_name].format
    var _required = this.data.form_type[type_name].required
    var title = this.data.form_type[type_name].title
    var name = this.data.form_type[type_name].name
    
    if (1 == _required && (value == '' || value == undefined)) {
      wx.showModal({
        title: '操作提示',
        content: title + '为必填项',
        showCancel: false
      })
      return false
    }
    if(name == 'user_name'){
      this.setData({
        "form_data.consignee": value 
      })
    }
    //加入take_time字段
    if (name == 'take_time') {
      this.setData({
          "form_data.take_time": (new Date(value.replace('-', '/').replace('-', '/').replace(' ', '  '))).getTime()/1000
      })
    }
    //加入mobile字段
    if (name == 'user_mobile') {
      this.setData({
        "form_data.mobile": value
      })
    }
    
    if (value) {
      switch (_type) {
        case 'mobile':
          if (!/^1[34578]\d{9}$/.test(value)) {
            status = false;
          }
          break;
        case 'phone':
          if (!(/^(\(\d{3,4}\)|\d{3,4}-|\s)?\d{7,14}$/.test(value))) {
            status = false;
          }
          break;
        case 'identity':
          if (!(/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(value))) {
            status = false;
          }
          break;
        case 'zip_code':
          if (!(/^[0-9][0-9]{5}$/.test(value))) {
            status = false;
          }
          break;
        case 'email':
          if (!(/[a-z0-9A-Z_-]+@[a-z0-9A-Z_-]+(\.[a-z]{2,5}){1,2}/.test(value))) {
            status = false;
          }
          break;
        case 'url':
          if (!(/[a-zA-z]+:\/\/[^\s]*/.test(value))) {
            status = false;
          }
          break;
      }
    }
    if (!status) {
      wx.showModal({
        title: '操作提示',
        content: title + '格式不对',
        showCancel: false
      })
    }

    return status

  },

  formVerifyType: function (data) {
    var form_type = {}
    data.forEach(function (o) {
      form_type['bespeak_form[' + o.template_unit_id + ']'] = {
        required: o.required,
        format: o.format,
        title: o.title,
        name: o.name
      }
    })
    this.setData({
      form_type: form_type
    })
  },

  verInput: function (e) {
    var name = e.currentTarget.dataset.name
    var form_data = this.data.form_data
    form_data[name] = e.detail.value
    var input_val = this.data.input_val || {}
    input_val[e.currentTarget.dataset.input_id] = e.detail.value
     this.setData({
      form_data: form_data,
       input_val: input_val
    })
  },

  checkBoxChange:function(e){
    var _val = e.detail.value
    var _index = e.currentTarget.dataset.index
    var _check_item = this.data.bespeak_template_unit[_index].value_arr
    var _check_group = []
    for(var i in _check_item){
        _check_group.push({
          name: _check_item[i],
          value: _check_item[i],
          checked: false
        })
    }
    for (var k in _val) {
      for (var j in _check_group) {
        if (_val[k] == _check_group[j].value){
          _check_group[j].checked =  true
        }
      }
    }
    var name = e.currentTarget.dataset.name
    var form_data = this.data.form_data
    var checkbox_val = this.data.checkbox_val || {}
    checkbox_val[e.currentTarget.dataset.check_id]= _check_group
    form_data[name] = _val
    this.setData({
      form_data: form_data,
      checkbox_val: checkbox_val
    })
  },

  checkboxCtype: function (e) {
    value.forEach(function (o, i) {
      var _name = name + '[' + i + ']'
      form_data[_name] = o
    })
    this.setData({
      form_data: form_data
    })
  },

  bindPickerChange: function (e) {
    var name = e.currentTarget.dataset.name
    var form_data = this.data.form_data
    var value_arr = e.currentTarget.dataset.value_arr
    var picker_id = e.currentTarget.dataset.picker_id
    form_data[name] = value_arr[e.detail.value]
    var picker_val = this.data.picker_val
    picker_val[picker_id] = value_arr[e.detail.value]
    this.setData({
      picker_val: picker_val,
      form_data: form_data
    })
  },

  bindDateChange: function (e) {
    var name = e.currentTarget.dataset.name
    var form_data = this.data.form_data
    var picker_id = e.currentTarget.dataset.picker_id
    var picker_time_val = this.data.picker_time_val
    picker_time_val[picker_id] = e.detail.value
    this.setData({
      picker_time_val: picker_time_val,
      form_data: form_data,
    })
  },

  closeTimePicker: function () {
    this.setData({
      time_picker: false
    })
  },

  openTimePicker: function (e) {
    //判断是否已选择时间
    
    this.setData({
      time_picker: e.currentTarget.dataset.name,
    })
  },

  bindTimePickerData: function () {
    var time_str = this.data.time_str.replace('-', '/').replace(' ', '  ')
    var timestamp = (new Date(time_str)).getTime();
    if (timestamp < (date.getTime())) {
      wx.showModal({
        title: '操作提示',
        content: '选择的时间应大于当前时间',
        showCancel: false
      })
      return false;
    }

    //存入form_data中
    var form_data = this.data.form_data
    form_data[this.data.time_picker] = this.data.time_str
    this.setData({
      form_data: form_data
    })
    this.closeTimePicker()

  },

  TimePickerChange: function (e) {
    var value = e.detail.value;
    var y = this.data.years[value[0]]
    var m = this.data.months[value[1]]
    var d = this.data.days[value[2]]
    var h = this.data.hours[value[3]]
    var time_str = [y, m, d].map(function (n) {
      n = n.toString();
      return n[1] ? n : '0' + n;
    }).join('-') + ' ' + [h, 0, 0].map(function (n) {
      n = n.toString();
      return n[1] ? n : '0' + n;
    }).join(':');
    this.setData({
      time_str: time_str,
      picker_view_value: e.detail.value
    })

  },

  uploadImg: function (e) {
    var that = this
    wx.chooseImage({
      count: parseInt(e.currentTarget.dataset.limit),
      success: function (res) {
        //判断单、多图上传
        var img_url = that.data.img_url
        if (img_url[e.currentTarget.dataset.img_id] && img_url[e.currentTarget.dataset.img_id].length + res.tempFilePaths.length > e.currentTarget.dataset.limit) {
          wx.showModal({
            title: '上传提示',
            content: '最多上传' + e.currentTarget.dataset.limit + '张图片',
            showCancel: false
          })
          return
        }

        res.tempFilePaths.forEach(function (path) {
          that.doUploadImg(path, e)
        })

      },
    })
  },

  doUploadImg: function (filePath, e) {
    var that = this
    var options = {
      filePath: filePath,
      name: 'bespeak_img_file',
      success: function (res) {
        var img_url = that.data.img_url
        var arr = img_url[e.currentTarget.dataset.img_id] || []
        arr.push(res.data.data)
        img_url[e.currentTarget.dataset.img_id] = arr
        var form_data = that.data.form_data
        form_data[e.currentTarget.dataset.name] = arr
        that.setData({
          img_url: img_url,
          form_data: form_data
        })
      }
    }
    request.uploadFile('/api/cart/bespeakUpImg', options)
  },

  delImg: function (e) {
    var img_url = this.data.img_url
    var arr = img_url[e.currentTarget.dataset.img_id] || []
    arr.splice(e.currentTarget.dataset.index, 1)
    img_url[e.currentTarget.dataset.img_id] = arr
    var form_data = this.data.form_data
    form_data[e.currentTarget.dataset.name] = arr
    this.setData({
      img_url: img_url,
      form_data: form_data
    })
  }






})