// 大大鸣版 雀巢
// 环境变量 NESTLE_TOKEN  抓取 Authorization 的值，例如：bearer 0610099d-550e-4e8d-9624-6840ff680812，只需要 bearer 后面的值
// 环境变量 NESTLE_UA  自定义User-Agent
// name: 雀巢会员
// cron: 30 12 * * *
// 入口：#小程序://雀巢会员/O0NOfAHwAGV3tZb

//自己的User-Agent  不设置将会调用getRandomUserAgent随机分配
// https://useragent.todaynav.com/ 微信打开此网站即可
var User_Agent = process.env.NESTLE_UA || "";

// ==================== Bark 推送配置 ====================
const NESTLE_BARK_GROUP = "雀巢";    // 自定义分组
const NESTLE_BARK_ICON  = "https://gitee.com/hlt1995/BARK_ICON/raw/main/Nestle.png";    // 自定义图标
const PUSH_SWITCH = 1;     // 推送开关，1开启，0关闭
// =======================================================
const axios = require("axios");
const $ = {
    name: "雀巢会员",
    wait: a => new Promise(e => setTimeout(e, a)),
    logErr: e => console.error(e),
    done: () => console.log("任务完成")
};
const nestleList = process.env.NESTLE_TOKEN ? process.env.NESTLE_TOKEN.split(/[\n&]/) : [];

let notify = require('./sendNotify');
let message = "";

function getRandomUserAgent() {
    if (User_Agent) {
        return User_Agent;
    }
    const a = ["Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148", "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36"];
    return a[Math.floor(Math.random() * a.length)];
}

function getRandomWait(e, a) {
    return Math.floor(Math.random() * (a - e + 1) + e);
}

async function sendRequest(e, a, n, t = null) {
    try {
        const o = {
            url: e,
            method: a,
            headers: n,
            timeout: 1e4,
            validateStatus: () => true
        };
        if (t && (a.toLowerCase() === "post" || a.toLowerCase() === "put")) {
            o.data = t;
        }
        const r = await axios(o);
        return r.data;
    } catch (e) {
        console.error("请求失败: " + e.message);
        return {
            errcode: 500,
            errmsg: "请求失败: " + e.message
        };
    }
}

const headers = {
    "User-Agent": getRandomUserAgent(),
    "content-type": "application/json",
    referer: "https://servicewechat.com/wxc5db704249c9bb31/353/page-frame.html"
};

let accountResults = [];

(async () => {
    //   printBanner();
    console.log("\n已随机分配 User-Agent\n\n" + headers["User-Agent"]);
    for (let e = 0; e < nestleList.length; e++) {
        const n = e + 1;
        console.log("\n*****第[" + n + "]个" + "雀巢会员" + "账号*****");
        headers.authorization = "Bearer " + nestleList[e];
        
        let accountResult = {
            index: n,
            mobile: "",
            signDay: 0,
            balance: 0,
            success: true
        };
        
        await main(accountResult);
        accountResults.push(accountResult);
        await $.wait(Math.floor(Math.random() * 501 + 2e3));
    }
    
    await sendNotification();
})()["catch"](e => console.error(e))["finally"](() => console.log("任务完成"));

async function main(accountResult) {
    await getUserInfo(accountResult);
    await everyDaySign(accountResult);
    await $.wait(Math.floor(Math.random() * 1001 + 1e3));
    await getTaskList();
    await $.wait(Math.floor(Math.random() * 1001 + 1e3));
    await getUserBalance(accountResult);
}

async function getUserInfo(accountResult) {
    try {
        const e = await sendRequest("https://crm.nestlechinese.com/openapi/member/api/User/GetUserInfo", "get", headers);
        if (200 !== e.errcode) {
            console.error("获取用户信息失败：" + e.errmsg);
            accountResult.success = false;
            accountResult.forcePush = true;
            return;
        }
        const {
            nickname: n,
            mobile: t
        } = e.data;
        console.log("用户：" + n + "(" + t + ")");
        accountResult.mobile = t.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    } catch (e) {
        console.error("获取用户信息时发生异常 -> " + e);
        accountResult.success = false;
        accountResult.forcePush = true;
        accountResult.wrong = e.message || e;
    }
}

async function getTaskList() {
    try {
        const e = await sendRequest("https://crm.nestlechinese.com/openapi/activityservice/api/task/getlist", "post", headers);
        if (200 !== e.errcode) {
            return console.error("获取任务列表失败：" + e.errmsg);
        }
        for (const n of e.data) {
            console.log("开始【" + n.task_title + "】任务");
            await doTask(n.task_guid);
            await $.wait(Math.floor(Math.random() * 501 + 2e3));
        }
    } catch (e) {
        console.error("获取任务列表时发生异常 -> " + e);
    }
}

async function doTask(e) {
    try {
        const n = await sendRequest("https://crm.nestlechinese.com/openapi/activityservice/api/task/add", "post", headers, {
            task_guid: e
        });
        if (201 == n.errcode) {
            return console.error("任务失败 -> " + n.errmsg + "\n");
        }
        console.log("完成任务" + n.errcode + " -> " + n.errmsg + "\n");
    } catch (e) {
        console.error("完成任务时发生异常 -> " + e);
    }
}

async function everyDaySign(accountResult) {
    let data = JSON.stringify({
        "rule_id": 1,
        "goods_rule_id": 1
    });
    try {
        const e = await sendRequest("https://crm.nestlechinese.com/openapi/activityservice/api/sign2025/sign", "post", headers, data);
        if (200 !== e.errcode) {
            console.error("用户每日签到失败：" + e.errmsg);
            accountResult.success = false;
            accountResult.wrong = e.errmsg;
            return;
        }
        console.log("当前签到天数：" + e.data.sign_day);
        accountResult.signDay = e.data.sign_day;
    } catch (e) {
        console.error("用户每日签到发生异常 -> " + e);
        accountResult.success = false;
    }
}

async function getUserBalance(accountResult) {
    try {
        const e = await sendRequest("https://crm.nestlechinese.com/openapi/pointsservice/api/Points/getuserbalance", "post", headers);
        if (200 !== e.errcode) {
            console.error("获取用户积分余额失败：" + e.errmsg);
            accountResult.success = false;
            return;
        }
        console.log("当前巢币：" + e.data);
        accountResult.balance = e.data;
    } catch (e) {
        console.error("获取用户巢币时发生异常 -> " + e);
        accountResult.success = false;
    }
}

async function sendNotification() {
    if (PUSH_SWITCH === 0) {
        console.log("🔕 PUSH_SWITCH=0，不执行推送消息");
        return;
    }
    if (accountResults.length === 0) return;

    let notifyMessage = "";
    let forcePushFlag = false;
    for (let result of accountResults) {
        if (result.success) {
            notifyMessage += `📱 账号：【${result.mobile}】\n✨️ 签到成功，已签到【${result.signDay}】天\n💰️ 当前巢币: 【${result.balance}】\n\n`;
        } else {
            notifyMessage += `📱 账号：【${result.mobile}】\n❌ 签到失败:${result.wrong}\n💰️ 当前巢币: 【${result.balance}】\n\n`;
        }
    }
    notifyMessage = notifyMessage.trim();

    if (PUSH_SWITCH === 0 && !forcePushFlag) {
        console.log("🔕 PUSH_SWITCH=0，本次运行不推送消息");
        return;
    }

    process.env.BARK_GROUP = NESTLE_BARK_GROUP;
    process.env.BARK_ICON  = NESTLE_BARK_ICON;

    await notify.sendNotify("☕️ 雀巢会员签到结果\n", notifyMessage);
}