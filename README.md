## 🔗 拉库地址

```
ql repo https://gitee.com/hlt1995/qlScripts.git "" "Backup"
```

拉取的文件后缀名：`js sh py mjs json`

> 脚本基于Android手机+ZeroTermux+Alpine部署青龙面板运行[教程及资源下载](https://cloud.189.cn/web/share?code=U36RferiMvIf（访问码：2io3）)
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


### ☁️ 移动云盘签到

- `caiyun.ql.mjs` &emsp;配置文件：`asign.json`

>浏览器登录 [https://yun.139.com/](https://yun.139.com/)

>抓取cookie中的Authorization写入配置文件


### 🏅 Microsoft Rewards 自动积分

- `Microsoft_Rewards_v2.1.py` &emsp;环境变量：`bing_ck_1`

>浏览器登录 [https://cn.bing.com/](https://cn.bing.com/) -> 右上角的积分 -> 查看仪表板

>抓取包含`tifacfaatcs`和`.MSA.Auth`字段的Cookie

>CK格式：`整段Cookie`


### 📦️ 顺丰速运每日任务

- `SFExpress.py` &emsp;环境变量：`sfsyUrl`

>手机开启抓包软件，进入微信 -> 小程序 -> 我的 -> 积分

>搜索 `https://mcs-mimp-web.sf-express.com/mcs-mimp/share/weChat/activityRedirect?source=` 的请求链接

>CK格式：`编码后的url` `&`


### ✈️ 同程旅行每日签到

- `TongchengTravel.py` &emsp;环境变量：`tc_cookie`

>手机开启抓包软件，进入同程旅行 -> 领福利 -> 点击签到

>搜索 `https://app.17u.cn/welfarecenter/index/signIndex` 的请求头，找到`appToken` `device`

>CK格式：`手机号#appToken#device` `@`


### 👛 小米钱包

- `XiaomiWallet_A/B.py` &emsp;环境变量：`xmqb`

>浏览器登录 [https://account.xiaomi.com/](https://account.xiaomi.com/) ,抓取cookie中的`passToken` `userId`

>CK格式：`passToken&userId` `@`


---


## 🗒️ 青龙面板升级以及依赖安装

恢复包解压完成切换容器后，输入`startalpine`进入Alpine，执行
```
cd /ql
ql update
```

面板升级完成后，执行安装NodeJS依赖
```
cd /ql/data/scripts
pnpm add axios jsdom ds moment sharp@0.32.0
```

执行安装Python3依赖
```
pip3 install requests httpx pycryptodome
```
---

## 📒 jdpro库配置sendNotify.js

青龙脚本订阅拉库会默认创建内置sendNotify.js覆盖jdpro库中的sendNotify.js,因此需要手动替换/ql/data/deps下的sendNotify.js

下载sendNotify.js放在手机存储根目录后，Alpine下执行：
```
cp -f /sdcard/sendNotify.js /ql/data/deps/sendNotify.js
```

---

## 🚀 自动执行青龙面板启动命令

为了避免手机意外重启导致青龙面板离线，可利用`MacroDroid`APP开机启动ZeroTermux，并在ZeroTermux中添加自动启动青龙面板命令

进入 Zerotermux，执行：
```
nano ~/.bashrc
```
在文件中加入以下命令

```
startalpine
```

进入Alpine，首先安装nano编辑器

```
apk update
apk add nano
```

安装完成后，执行：
```
nano ~/.profile
```

在文件中加入以下逻辑
```
# 青龙面板自启动逻辑
if pgrep -f "app.js" > /dev/null 2>&1; then
  echo -e "\033[1;32m✔ [QL-PANEL] 青龙面板正在运行\033[0m"
else
  echo -e "\033[1;33m⚡ [QL-PANEL] 青龙面板未运行，正在启动...\033[0m"
  qinglong
fi
```

---
#### 部分脚本来自网络，如有侵权，请联系删除！
