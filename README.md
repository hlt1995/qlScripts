## 🔗 拉库地址

```plaintext
https://github.com/hlt1995/qlScripts.git
```

拉取的文件后缀名：`js sh mjs json`

> 脚本基于Android手机+ZeroTermux+Alpine部署青龙面板运行[部署教程参考①](https://blog.csdn.net/a18065597272/article/details/132633015)  [②](https://blog.csdn.net/a18065597272/article/details/129752658?ops_request_misc=&request_id=&biz_id=102&utm_term=%E9%9D%92%E9%BE%99%E9%9D%A2%E6%9D%BF2.15%E6%81%A2%E5%A4%8D%E5%8C%85&utm_medium=distribute.pc_search_result.none-task-blog-2~all~sobaiduweb~default-3-129752658.142^v102^pc_search_result_base5&spm=1018.2226.3001.4187)
---

## 🌐 自动更新YDNS动态域名服务的IP地址

同时支持A/AAAA地址解析

YDNS：https://ydns.io

环境变量：`YDNS_CONFIG`

---

## 🎮️ Epic免费游戏领取提醒

只写了bark推送，bark_Key直接读取配置文件config.sh中的`export BARK_PUSH=""`

点击bark通知即可跳转领取页面

---

## ☁️ 移动云盘签到脚本

### 文件说明

- `caiyun-1.0.0-alpha.7.mjs`：移动云盘脚本
- `caiyun.ql.mjs`：青龙启动脚本
- `asign.json`：配置文件
- `yidongyunpan.py`：移动云盘备用脚本

[移动云盘](https://as.js.cool/reference/caiyun)
[数据配置](https://as.js.cool/start/config)
[推送配置](https://as.js.cool/reference/push)

### 青龙脚本配置

> 青龙任务命令，建议每天运行两次
```
task hlt1995_qlScripts/caiyun.ql.mjs
```
```
task hlt1995_qlScripts/yidongyunpan.py
```

---

## 🗒️ 青龙面板升级以及依赖安装

恢复包解压完成切换容器后，输入`startalpine`进入Alpine

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
  echo -e "\033[1;32m✔ [QL-PANEL] 青龙面板正在运行\033[0m
"
else
  echo -e "\033[1;33m⚡ [QL-PANEL] 青龙面板未运行，正在启动...\033[0m"
  qinglong
fi

```

---
#### 部分脚本来自网络，如有侵权，请联系删除！
