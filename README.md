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
pnpm add axios sharp jsdom ds requests moment
```

执行安装Python3依赖
```
pip3 install request
```
---

## ☁️ 移动云盘签到脚本

### 脚本来自@Catlair大佬

### 文件说明

- `caiyun-1.0.0-alpha.7.mjs`：移动云盘脚本
- `caiyun.ql.mjs`：青龙启动脚本
- `asign.json`：配置文件

[移动云盘](https://as.js.cool/reference/caiyun)
[数据配置](https://as.js.cool/start/config)
[推送配置](https://as.js.cool/reference/push)

### 青龙脚本配置

> 青龙任务命令
```
task hlt1995_qlScripts/caiyun.ql.mjs
```

> 青龙任务定时，建议每天运行两次

---
