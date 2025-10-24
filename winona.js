//name: 薇诺娜小薇森林
//cron: 15 12 * * *

/*
微信小程序：薇诺娜专柜商城

    首次跑需要点击首页右侧"小游戏"
    奖品：种树换实物

功能：
    双签到、种树任务、自动浇水

抓包：
    1. 抓域名api.qiumeiapp.com请求体中的appUserToken值
    2. 环境变量：wnn_ck="备注1（可选）#appUserToken1&备注2（可选）#appUserToken2"
*/

const axios = require("axios");
const wnn = process.env.wnn_ck || "";

let notifyMessages = [];

function addNotifyMessage(message) {
    if (message && !notifyMessages.includes(message)) {
        notifyMessages.push(message);
    }
}

async function sendNotify() {
    if (notifyMessages.length > 0) {
        try {
            const notify = require('./sendNotify');
            const title = "🔔薇诺娜任务通知";
            const content = notifyMessages.join('\n');
            notify.sendNotify(title, content);
            console.log(`📤 已发送通知: ${notifyMessages.length} 条消息`);
        } catch (error) {
            console.log("❌ 发送通知失败:", error.message);
        }
    } else {
        console.log("✅ 无需发送通知");
    }
}

function log(message) {
    console.log(message);
}

// 延迟函数
function delay() {
    return new Promise(resolve => setTimeout(resolve, 7000));
}

class WnnTask {
    constructor(token, remark, index) {
        this.appUserToken = token.trim();
        this.remark = remark || `账号 ${index}`;
        this.index = index;
        this.baseUrl = "https://api.qiumeiapp.com/zg-activity/zg-daily/";
        this.headers = {
            Host: "api.qiumeiapp.com",
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept-Encoding": "gzip, deflate, br",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.56(0x18003830) NetType/WIFI Language/zh_CN",
            Referer: "https://servicewechat.com/wx250394ab3f680bfa/637/page-frame.html",
            Connection: "keep-alive"
        };
        this.hasCriticalError = false;
    }

    async checkin() {
        try {
            const response = await axios.post(
                `${this.baseUrl}zgSigninNew`,
                `appUserToken=${this.appUserToken}`,
                { headers: this.headers }
            );

            log(`\n====== ${this.remark} ======`);
            
            switch (response.data.code) {
                case 703:
                    log("✅ 今日已签到！");
                    break;
                case 200:
                    log("✅ 签到成功！");
                    break;
                case 600:
                    const tokenErrorMsg = `❌ ${this.remark} Token 失效，请重新获取！`;
                    log(tokenErrorMsg);
                    addNotifyMessage(tokenErrorMsg);
                    this.hasCriticalError = true;
                    return false;
                default:
                    const signErrorMsg = `❌ ${this.remark} 签到失败: ${JSON.stringify(response.data)}`;
                    log(signErrorMsg);
                    addNotifyMessage(signErrorMsg);
                    this.hasCriticalError = true;
                    return false;
            }
        } catch (error) {
            const requestErrorMsg = `❌ ${this.remark} 签到请求异常: ${error.message}`;
            log(requestErrorMsg);
            addNotifyMessage(requestErrorMsg);
            this.hasCriticalError = true;
            return false;
        }
        return true;
    }

    async treeCheckin() {
        try {
            const response = await axios.post(
                `${this.baseUrl}signinZgForest`,
                `appUserToken=${this.appUserToken}`,
                { headers: this.headers }
            );

            if (response.data.code === 200) {
                log(`🌳 树木签到成功，获得 ${response.data.data.waterGram}g 水滴`);
            } else {
                log(`❌ 树木签到失败: ${JSON.stringify(response.data)}`);
            }
        } catch (error) {
            log(`❌ 树木签到请求异常: ${error.message}`);
        }
    }

    async assist(shareCode) {
        try {
            await axios.post(
                `${this.baseUrl}addZgForestInvite`,
                `appUserToken=${this.appUserToken}&sysCode=zgxcx&isRegister=1&userShareCode=${shareCode}`,
                { headers: this.headers }
            );
        } catch (error) {
            // 静默处理异常
        }
    }

    async browseMall() {
        try {
            const response = await axios.post(
                `${this.baseUrl}updateZgForestTask`,
                `appUserToken=${this.appUserToken}&taskCode=2025001`,
                { headers: this.headers }
            );

            if (response.data.code === 200) {
                log("✅ 浏览商城任务完成！");
            } else {
                log(`❌ 浏览商城失败: ${JSON.stringify(response.data)}`);
            }
        } catch (error) {
            log(`❌ 浏览商城请求异常: ${error.message}`);
        }
    }

    async readArticle() {
        try {
            const response = await axios.post(
                `${this.baseUrl}updateZgForestTask`,
                `appUserToken=${this.appUserToken}&taskCode=2025002`,
                { headers: this.headers }
            );

            if (response.data.code === 200) {
                log("✅ 阅读文章任务完成！");
            } else if (response.data.code === 703) {
                log("⚠️ 请勿频繁操作！");
            } else {
                log(`❌ 阅读文章失败: ${JSON.stringify(response.data)}`);
            }
        } catch (error) {
            log(`❌ 阅读文章请求异常: ${error.message}`);
        }
    }

    async getWaterDrops() {
        try {
            const response = await axios.post(
                `${this.baseUrl}getZgForest`,
                `appUserToken=${this.appUserToken}`,
                { headers: this.headers }
            );

            if (response.data.code === 200) {
                const waterDrops = response.data.data.remainWaterGram;
                log(`💧 当前水滴数量: ${waterDrops}g`);
                return waterDrops;
            } else {
                log(`❌ 获取水滴失败: ${JSON.stringify(response.data)}`);
            }
        } catch (error) {
            log(`❌ 获取水滴请求异常: ${error.message}`);
        }
        return 0;
    }

    async waterTree() {
        const waterDrops = await this.getWaterDrops();
        const waterTimes = Math.floor(waterDrops / 10);

        if (waterTimes <= 0) {
            log("❌ 水滴不足，无法浇水！");
            return;
        }

        log(`🌿 计划浇水 ${waterTimes} 次...`);

        for (let i = 1; i <= waterTimes; i++) {
            try {
                const response = await axios.post(
                    `${this.baseUrl}wateringZgForest`,
                    `appUserToken=${this.appUserToken}`,
                    { headers: this.headers }
                );

                if (response.data.code === 200) {
                    log(`✅ 第 ${i} 次浇水成功！`);
                } else {
                    log(`❌ 浇水失败: ${JSON.stringify(response.data)}`);
                }
            } catch (error) {
                log(`❌ 浇水请求异常: ${error.message}`);
            }
            await delay();
        }
    }

    async run(shareCode) {
        if (!(await this.checkin())) return;
        
        await delay();
        await this.treeCheckin();
        await delay();
        await this.assist(shareCode);
        await delay();
        await this.browseMall();
        await delay();
        await this.readArticle();
        await delay();
        await this.waterTree();
    }
}

// 解析CK函数
function parseCookies(cookieString) {
    const accounts = [];
    if (!cookieString) return accounts;
    
    const tokens = cookieString.split("&")
        .map(item => item.trim())
        .filter(item => item);
    
    tokens.forEach((item, index) => {
        if (item.includes('#')) {
            const [remark, token] = item.split('#', 2);
            accounts.push({
                remark: remark.trim(),
                token: token.trim(),
                index: index + 1
            });
        } else {
            accounts.push({
                remark: `账号 ${index + 1}`,
                token: item.trim(),
                index: index + 1
            });
        }
    });
    
    return accounts;
}

// 主函数
(async () => {
    console.log("薇诺娜专柜商城 v1.0.0");

    if (!wnn) {
        const noTokenMsg = "❌ 未找到环境变量 wnn_ck 变量！";
        console.log(noTokenMsg);
        addNotifyMessage(noTokenMsg);
        await sendNotify();
        process.exit(1);
    }

    const accounts = parseCookies(wnn);

    if (accounts.length > 0) {
        console.log(`\n共获取到 ${accounts.length} 个账号`);
        accounts.forEach(account => {
            console.log(`📝 ${account.remark}`);
        });
        
        const shareCode = "48d96b20";

        for (let i = 0; i < accounts.length; i++) {
            const account = accounts[i];
            const task = new WnnTask(account.token, account.remark, account.index);
            await task.run(shareCode);
            
            // 每个任务完成后延迟一下
            if (i < accounts.length - 1) {
                await delay();
            }
        }

        console.log("\n====== 任务完成 ======");
        
        // 发送通知
        await sendNotify();
    } else {
        const noValidTokenMsg = "❌ 未找到有效的 appUserToken，退出。";
        console.log(noValidTokenMsg);
        addNotifyMessage(noValidTokenMsg);
        await sendNotify();
    }
})();
