// 大大鸣版 雀巢
// 环境变量 NESTLE_TOKEN  抓取 Authorization 的值，例如：bearer 0610099d-550e-4e8d-9624-6840ff680812，只需要 bearer 后面的值
//name: 雀巢
//cron: 30 12 * * *
 * 变量：export NESTLE_TOKEN="Authorization"
 * 入口：#小程序://雀巢会员/O0NOfAHwAGV3tZb
 *
 */

//自己的User-Agent  不设置将会调用getRandomUserAgent随机分配
// https://useragent.todaynav.com/ 微信打开此网站即可
var User_Agent = "";

const axios = require("axios");
const $ = {
    name: "雀巢会员",
    wait: a => new Promise(e => setTimeout(e, a)),
    logErr: e => console.error(e),
    done: () => console.log("任务完成")
};
const nestleList = process.env.NESTLE_TOKEN ? process.env.NESTLE_TOKEN.split(/[\n&]/) : [];

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
(async () => {
    //   printBanner();
    console.log("\n已随机分配 User-Agent\n\n" + headers["User-Agent"]);
    for (let e = 0; e < nestleList.length; e++) {
        const n = e + 1;
        console.log("\n*****第[" + n + "]个" + "雀巢会员" + "账号*****");
        headers.authorization = "Bearer " + nestleList[e];
        message += "📣====雀巢会员账号[" + n + "]====📣\n";
        await main();
        await $.wait(Math.floor(Math.random() * 501 + 2e3));
    }
    if (message) {
        console.log("\n执行结果汇总：\n" + message);
    }
})()["catch"](e => console.error(e))["finally"](() => console.log("任务完成"));

async function main() {
    await getUserInfo();
    await everyDaySign()
    await $.wait(Math.floor(Math.random() * 1001 + 1e3));
    await getTaskList();
    await $.wait(Math.floor(Math.random() * 1001 + 1e3));
    await getUserBalance();
}

async function getUserInfo() {
    try {
        const e = await sendRequest("https://crm.nestlechinese.com/openapi/member/api/User/GetUserInfo", "get", headers);
        if (200 !== e.errcode) {
            return console.error("获取用户信息失败：" + e.errmsg);
        }
        const {
            nickname: n,
            mobile: t
        } = e.data;
        console.log("用户：" + n + "(" + t + ")");
        message += "用户：" + n + "(" + t + ")\n";
    } catch (e) {
        console.error("获取用户信息时发生异常 -> " + e);
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

async function everyDaySign() {
    let data = JSON.stringify({
        "rule_id": 1,
        "goods_rule_id": 1
    });
    try {
        const e = await sendRequest("https://crm.nestlechinese.com/openapi/activityservice/api/sign2025/sign", "post", headers, data);
        if (200 !== e.errcode) {
            return console.error("用户每日签到失败：" + e.errmsg);
        }
        console.log("当前签到天数：" + e.data.sign_day);
        message += "当前签到天数：" + e.data.sign_day + "\n\n";
    } catch (e) {
        console.error("用户每日签到发生异常 -> " + e);
    }
}

async function getUserBalance() {
    try {
        const e = await sendRequest("https://crm.nestlechinese.com/openapi/pointsservice/api/Points/getuserbalance", "post", headers);
        if (200 !== e.errcode) {
            return console.error("获取用户积分余额失败：" + e.errmsg);
        }
        console.log("当前巢币：" + e.data);
        message += "当前巢币：" + e.data + "\n\n";
    } catch (e) {
        console.error("获取用户巢币时发生异常 -> " + e);
    }
}
