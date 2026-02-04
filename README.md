## 🔗 拉库地址

```
ql repo https://gitee.com/hlt1995/qlScripts.git "" "Backup" "" "" "js|sh|py"
```

---

## 📝 脚本说明

### 🌐 自动更新YDNS动态域名

- `ydns_update.sh` &emsp;环境变量：`YDNS_CONFIG`

>[注册域名](https://ydns.io/)

>支持IPv4/IPv6地址解析，添加IP变动检测避免过度请求

>CK格式：`域名|用户名|密码|记录类型`


### 🎮️ Epic免费游戏领取提醒

- `EpicGamesNotify.js`

>支持Bark推送，点击bark通知即可跳转领取页面


### ☁️ 移动云盘

- `mcloud.py` &emsp;环境变量：`ydyp_ck`

>浏览器登录 [https://yun.139.com/](https://yun.139.com/) ,抓取cookie中的Authorization的值

>CK格式：`Authorization` `@`


### 🏅 Microsoft Rewards 自动积分

- `Microsoft_Rewards_v2.1.py` &emsp;环境变量：`bing_ck_1`

>浏览器登录 [https://cn.bing.com/](https://cn.bing.com/) -> 右上角的积分 -> 查看仪表板

>抓取包含`tifacfaatcs`和`.MSA.Auth`字段的Cookie

>CK格式：`整段Cookie`


### 📦️ 顺丰速运

- `SFExpress.py` `SFExpress_NewYear.py` `SFExpress_Lottery.py` &emsp;环境变量：`sfsyUrl`

>手机开启抓包软件，进入微信 -> 小程序(顺丰速运) -> 我的 -> 积分

>搜索 `https://mcs-mimp-web.sf-express.com/mcs-mimp/share/weChat/activityRedirect?source=` 的请求链接

>CK格式：`编码后的url` `&`


### ✈️ 同程旅行

- `TongchengTravel.py` &emsp;环境变量：`tc_cookie`

>手机开启抓包软件，进入同程旅行 -> 领福利 -> 点击签到

>搜索 `https://app.17u.cn/welfarecenter/index/signIndex` 的请求头，找到`appToken` `device`

>CK格式：`手机号#appToken#device` `@`


### 🧴 薇诺娜小薇森林

- `winona.js` &emsp;环境变量：`wnn_ck`

>手机开启抓包软件，进入微信 -> 小程序(薇诺娜专柜商城) -> 首页小薇森林种树

>搜索 `https://api.qiumeiapp.com/zg-activity/zg-daily/getZgForst` 的请求体中的`appUserToken`

>CK格式：`备注(可选)#appUserToken` `&`


### 🌟 电信营业厅

- `ChinaTelecomyyt.js` &emsp;环境变量：`chinaTelecomAccount`

>CK格式：`手机号#服务密码` `&`


### ☕️ 雀巢会员

- `Nestle.js` &emsp;环境变量：`NESTLE_TOKEN`

>手机开启抓包软件，复制 `#小程序://雀巢会员/O0NOfAHwAGV3tZb` 到微信打开

>搜索 `https://crm.nestlechinese.com/openapi/activityservice/api` 的任意请求头中的 `Authorization`

>CK格式：`Authorization` `&`


### 🖥️ 网络唤醒(远程开机)

- `WakeOnLAN.py` &emsp;环境变量：`WOL_MAC` `WOL_IP` `WOL_PORT`

>脚本对指定MAC地址发送幻数据包（Magic Packet）实现定时远程开机,支持多设备唤醒。

>局域网唤醒只需填写`WOL_MAC`，外网唤醒填写`WOL_MAC` `WOL_IP`，端口默认9


### 🍅 统一茄皇

- `Tomato_King.py` &emsp;环境变量：`QH`

>无需抓包，进入微信 -> 小程序(统一梦时代) -> 个人中心头像 -> 客户编号

>CK格式：`客户编号#手机号` `&`

---


#### 部分脚本来自网络，如有侵权，请联系删除！
