Page({
  data: {
    services: [
      { title: '自取', sub: 'PICK UP', icon: '/images/pickUp.png' },
      { title: '店家配送', sub: 'TAKE OUT', icon: '/images/takeOut.png' },
      { title: '快递', sub: 'EXPRESS', icon: '/images/express.png' }
    ],
    quickEntries: [
      { title: '个人中心', sub: 'Personal center', icon: '/images/peson.jpg' },
      { title: '优惠券', sub: 'Coupon group', icon: '/images/coupon.png' },
      { title: '查看订单', sub: 'Shopping notice', icon: '/images/order.png' }
    ],
    navActions: [
      { title: '自助下单', icon: '/images/self-pay.png' },
      { title: '预约', icon: '/images/icon_booktel.png' },
      { title: '订单', icon: '/images/orderIcon.png' },
      { title: '我的', icon: '/images/user2.png' }
    ],
    promos: [
      { title: '幸运大转盘', icon: '/images/ico-pt1.png' },
      { title: '幸运刮刮乐', icon: '/images/ico-pt2.png' },
      { title: '商品拼团', icon: '/images/ico-pt3.png' },
      { title: '集章', icon: '/images/icon_flash_sale.png' }
    ],
    storeList: [
      {
        name: '珊妈烘焙Suecake',
        address: '广东省广州市荔湾区广州市荔湾区石围塘街道华发荔湾荟7-1601'
      }
    ],
    searchIcon: '/images/search.png'
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '' });
  }
});

