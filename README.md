## 🔗 拉库地址

```
ql repo https://github.com/hlt1995/qlScripts.git "" "Backup"
```

拉取的文件后缀名：`js sh py`

> 脚本基于Android手机+ZeroTermux+Alpine部署青龙面板运行[部署教程参考①](https://blog.csdn.net/a18065597272/article/details/132633015)  [②](https://blog.csdn.net/a18065597272/article/details/129752658?ops_request_misc=&request_id=&biz_id=102&utm_term=%E9%9D%92%E9%BE%99%E9%9D%A2%E6%9D%BF2.15%E6%81%A2%E5%A4%8D%E5%8C%85&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduweb~default-3-129752658.142^v102^pc_search_result_base5&spm=1018.2226.3001.4187)
---
## 📝 脚本说明

### 🌐 自动更新YDNS动态域名

- `ydns_update.sh`  环境变量：`YDNS_CONFIG`

>支持IPv4/IPv6地址解析，添加IP变动检测避免过度请求

>注册地址：[https://ydns.io](https://ydns.io)


### 🎮️ Epic免费游戏领取提醒

- `EpicGamesNotify.js`

支持Bark推送

>点击bark通知即可跳转领取页面


### ☁️ 移动云盘签到

- `mcloud.py`

环境变量：`ydypCK`

>浏览器登录 [https://yun.139.com/w/#/index](https://yun.139.com/w/#/index) 抓取cookie

>CK格式：`Authorization#手机号#00` `@`


### 🏅 Microsoft Rewards 自动积分

- `Microsoft_Rewards_v2.1.py`

环境变量：`bing_ck_1` `bing_ck_2`

>浏览器登录 [https://cn.bing.com/](https://cn.bing.com/) 点击 <ins>查看仪表板</ins>

>抓取包含`tifacfaatcs`和`.MSA.Auth`字段的Cookie

>CK格式：`整段Cookie`


### 📦️ 顺丰速运每日任务

- `SFExpress.py`

环境变量：`sfsy_url`

>手机开启抓包软件，进入微信->小程序->我的->积分

>搜索 https://mcs-mimp-web.sf-express.com/mcs-mimp/share/weChat/activityRedirect?source= 的请求链接

>CK格式：`整段url` `@`


### ✈️ 同程旅行每日签到

- `TongchengTravel.py`

环境变量：`tc_cookie`

>手机开启抓包软件，进入同程旅行->领福利->点击签到

>搜索 https://app.17u.cn/welfarecenter/index/signIndex 的请求头，找到`appToken` `device`

>CK格式：`手机号#appToken#device` `@`


---

## 🗒️ 青龙面板升级和依赖安装

恢复包解压完成并切换容器后，输入`startalpine`进入Alpine

执行
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
pip3 install requests
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
在文件中加入以下命令并保存

```
startalpine
```

输入`startalpine`进入Alpine，建议安装nano编辑器

```
apk update
apk add nano
```

安装完成后，执行：
```
nano ~/.profile
```

在文件中加入以下命令并保存
```
# 青龙面板自启动
if pgrep -f "app.js" > /dev/null 2>&1; then
  echo -e "\033[1;32m✔ [QL-PANEL] 青龙面板正在运行\033[0m
"
else
  echo -e "\033[1;33m⚡ [QL-PANEL] 青龙面板未运行，正在启动...\033[0m"
  qinglong
fi

```

---
#### 部分脚本来自网络，如有侵权，请联系删除！
