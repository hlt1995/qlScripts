/*
cron "28 8,21 * * *" jd_bean_change.js, tag:资产变化强化版by-ccwav
export BEANCHANGE_PERSENT="10"  分段变量，ck太多一起发通知会失败，可以分10个一发
 */

//详细说明参考 https://github.com/ccwav/QLScript2.

const $ = new Env('京东资产统计');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const dyx = require('./function/dylanx.js');
let NowHour = new Date().getHours();

//默认开启缓存模式
let checkbeanDetailMode = 1;
if ($.isNode() && process.env.BEANCHANGE_BEANDETAILMODE) {
    checkbeanDetailMode = process.env.BEANCHANGE_BEANDETAILMODE * 1;
}

const fs = require('fs');
const CR = require('crypto-js');
const moment = require("moment");
let matchtitle = "昨日";
let yesterday = "";
let TodayDate = "";
let startDate = "";
let endDate = "";
try {
    yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
    TodayDate = moment().format("YYYY-MM-DD");
    startDate = moment().startOf("month").format("YYYY_MM");
    endDate = moment().endOf("month").format("YYYY-MM-DD");
} catch (e) {
    console.log("依赖缺失，请先安装依赖moment!");
    return
}
let RemainMessage = '';
//RemainMessage += "⭕提醒:⭕" + '\n';
//RemainMessage += '【特价金币】特价版APP->我的->金币(可兑换无门槛红包)\n';
//RemainMessage += '【话费积分】APP->充值中心-赚积分兑话费（180天效期）\n';
//RemainMessage += '【超市卡】APP首页->京东超市->超市卡（超市商品可用）\n';
//RemainMessage += '【老农场】APP->我的->东东农场->回旧版,完成可兑换无门槛红包,可用于任意商品\n';
//RemainMessage += '【新农场】APP->我的->东东农场,完成可在记录里查看奖品\n';
//RemainMessage += '【奖票】APP->我的->玩一玩,可兑换京豆、红包等\n';
//RemainMessage += '【汪贝余额】APP首页->京东超市->每日签到,可兑换\n';
//RemainMessage += '【省钱币】小程序->底部超级会场->天天领红包,可兑换购物红包\n';
//RemainMessage += '【其他】不同类别红包不能叠加使用，自测\n';
console.log(RemainMessage);
if (!fs.existsSync("./BeanCache")) {
    fs.mkdirSync("./BeanCache");
}

let strBeanCache = "./BeanCache/" + yesterday + ".json";
let strNewBeanCache = "./BeanCache/" + TodayDate + ".json";
let TodayCache = [];
let Fileexists = fs.existsSync(strBeanCache);
let TempBeanCache = [];
if (!Fileexists) {
    yesterday = TodayDate;
    strBeanCache = strNewBeanCache;
    Fileexists = fs.existsSync(strBeanCache);
    matchtitle = "今日";
}
if (Fileexists) {
    console.log("检测到资产变动缓存文件" + yesterday + ".json，载入...");
    TempBeanCache = fs.readFileSync(strBeanCache, 'utf-8');
    if (TempBeanCache) {
        TempBeanCache = TempBeanCache.toString();
        TempBeanCache = JSON.parse(TempBeanCache);
    }
}

Fileexists = fs.existsSync(strNewBeanCache);
if (Fileexists) {
    console.log("检测到资产变动缓存文件" + TodayDate + ".json，载入...");
    TodayCache = fs.readFileSync(strNewBeanCache, 'utf-8');
    if (TodayCache) {
        TodayCache = TodayCache.toString();
        TodayCache = JSON.parse(TodayCache);
    }
}


let allMessage = '';
let allMessage2 = '';
let allReceiveMessage = '';
let allWarnMessage = '';
let ReturnMessage = '';
let ReturnMessageMonth = '';
let allMessageMonth = '';

let MessageUserGp2 = '';
let ReceiveMessageGp2 = '';
let WarnMessageGp2 = '';
let allMessageGp2 = '';
let allMessage2Gp2 = '';
let allMessageMonthGp2 = '';
let IndexGp2 = 0;

let MessageUserGp3 = '';
let ReceiveMessageGp3 = '';
let WarnMessageGp3 = '';
let allMessageGp3 = '';
let allMessage2Gp3 = '';
let allMessageMonthGp3 = '';
let IndexGp3 = 0;

let MessageUserGp4 = '';
let ReceiveMessageGp4 = '';
let WarnMessageGp4 = '';
let allMessageGp4 = '';
let allMessageMonthGp4 = '';
let allMessage2Gp4 = '';
let IndexGp4 = 0;

let notifySkipList = "";
let IndexAll = 0;
let EnableMonth = "false";
let isSignError = false;
let ReturnMessageTitle = "";
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '';
const JD_API_HOST = 'https://api.m.jd.com/client.action';
let intPerSent = 0;
let i = 0;
let llShowMonth = false;
let Today = new Date();
let strAllNotify = "";
let strSubNotify = "";
let llPetError = false;
let strGuoqi = "";
let TempBaipiao = "";
let llgeterror = false;
let time = new Date().getHours();
let WP_APP_TOKEN_ONE = "";
if ($.isNode()) {
    if (process.env.WP_APP_TOKEN_ONE) {
        WP_APP_TOKEN_ONE = process.env.WP_APP_TOKEN_ONE;
    }
}
//if(WP_APP_TOKEN_ONE)
//console.log(`检测到已配置Wxpusher的Token，启用一对一推送...`);
//else
//console.log(`检测到未配置Wxpusher的Token，禁用一对一推送...`);

let jdSignUrl = 'https://api.nolanstore.cc/sign'
if (process.env.SIGNURL)
    jdSignUrl = process.env.SIGNURL;

let epsignurl = ""
if (process.env.epsignurl)
    epsignurl = process.env.epsignurl;

if ($.isNode() && process.env.BEANCHANGE_PERSENT) {
    intPerSent = parseInt(process.env.BEANCHANGE_PERSENT);
    console.log(`检测到设定了分段通知:` + intPerSent);
}

if ($.isNode() && process.env.BEANCHANGE_USERGP2) {
    MessageUserGp2 = process.env.BEANCHANGE_USERGP2 ? process.env.BEANCHANGE_USERGP2.split('&') : [];
    intPerSent = 0; //分组推送，禁用账户拆分
    console.log(`检测到设定了分组推送2,将禁用分段通知`);
}

if ($.isNode() && process.env.BEANCHANGE_USERGP3) {
    MessageUserGp3 = process.env.BEANCHANGE_USERGP3 ? process.env.BEANCHANGE_USERGP3.split('&') : [];
    intPerSent = 0; //分组推送，禁用账户拆分
    console.log(`检测到设定了分组推送3,将禁用分段通知`);
}

if ($.isNode() && process.env.BEANCHANGE_USERGP4) {
    MessageUserGp4 = process.env.BEANCHANGE_USERGP4 ? process.env.BEANCHANGE_USERGP4.split('&') : [];
    intPerSent = 0; //分组推送，禁用账户拆分
    console.log(`检测到设定了分组推送4,将禁用分段通知`);
}

//取消月结查询
//if ($.isNode() && process.env.BEANCHANGE_ENABLEMONTH) {
//EnableMonth = process.env.BEANCHANGE_ENABLEMONTH;
//}

if ($.isNode() && process.env.BEANCHANGE_SUBNOTIFY) {
    strSubNotify = process.env.BEANCHANGE_SUBNOTIFY;
    strSubNotify += "\n";
    console.log(`检测到预览置顶内容,将在一对一推送的预览显示...\n`);
}

if ($.isNode() && process.env.BEANCHANGE_ALLNOTIFY) {
    strAllNotify = process.env.BEANCHANGE_ALLNOTIFY;
    console.log(`检测到设定了公告,将在推送信息中置顶显示...`);
    strAllNotify = "✨✨✨✨✨✨✨公告✨✨✨✨✨✨✨\n" + strAllNotify;
    console.log(strAllNotify + "\n");
    strAllNotify += "\n🎏🎏🎏🎏🎏🎏🎏🎏🎏🎏🎏🎏🎏🎏🎏\n"
}


if (EnableMonth == "true" && Today.getDate() == 1 && Today.getHours() > 17)
    llShowMonth = true;

let userIndex2 = -1;
let userIndex3 = -1;
let userIndex4 = -1;


if ($.isNode()) {
    Object.keys(jdCookieNode).forEach((item) => {
        cookiesArr.push(jdCookieNode[item])
    })
    if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false')
        console.log = () => { };
} else {
    cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}

//查询开关
let strDisableList = "";
let DisableIndex = -1;
if ($.isNode()) {
    strDisableList = process.env.BEANCHANGE_DISABLELIST ? process.env.BEANCHANGE_DISABLELIST.split('&') : [];
}

//老农场
let EnableJdFruit = true;
DisableIndex = strDisableList.findIndex((item) => item === "老农场");
if (DisableIndex != -1) {
    console.log("检测到设定关闭老农场查询");
    EnableJdFruit = false;
}


//7天过期京豆
let EnableOverBean = true;
DisableIndex = strDisableList.findIndex((item) => item === "过期京豆");
if (DisableIndex != -1) {
    console.log("检测到设定关闭过期京豆查询");
    EnableOverBean = false
}

//查优惠券
let EnableChaQuan = false;
DisableIndex = strDisableList.findIndex((item) => item === "查优惠券");
if (DisableIndex != -1) {
    console.log("检测到设定关闭优惠券查询");
    EnableChaQuan = false
}

DisableIndex = strDisableList.findIndex((item) => item === "活动攻略");
if (DisableIndex != -1) {
    console.log("检测到设定关闭活动攻略显示");
    RemainMessage = "";
}


//京豆收益查询
let EnableCheckBean = true;
DisableIndex = strDisableList.findIndex((item) => item === "京豆收益");
if (DisableIndex != -1) {
    console.log("检测到设定关闭京豆收益查询");
    EnableCheckBean = false
}

var _0xodA='jsjiami.com.v7';function _0x4f5b(_0x4f042a,_0xeb873e){const _0x30374f=_0x3037();return _0x4f5b=function(_0x4f5ba5,_0x24f8a0){_0x4f5ba5=_0x4f5ba5-0xa7;let _0x1412db=_0x30374f[_0x4f5ba5];if(_0x4f5b['lDRVhn']===undefined){var _0x1e35ad=function(_0x4d859c){const _0x514ebc='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let _0x4527f4='',_0x3d6245='';for(let _0x454e8a=0x0,_0x532925,_0x4ec628,_0x5d26de=0x0;_0x4ec628=_0x4d859c['charAt'](_0x5d26de++);~_0x4ec628&&(_0x532925=_0x454e8a%0x4?_0x532925*0x40+_0x4ec628:_0x4ec628,_0x454e8a++%0x4)?_0x4527f4+=String['fromCharCode'](0xff&_0x532925>>(-0x2*_0x454e8a&0x6)):0x0){_0x4ec628=_0x514ebc['indexOf'](_0x4ec628);}for(let _0x3d2994=0x0,_0x14a757=_0x4527f4['length'];_0x3d2994<_0x14a757;_0x3d2994++){_0x3d6245+='%'+('00'+_0x4527f4['charCodeAt'](_0x3d2994)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(_0x3d6245);};const _0x518a99=function(_0x3746b4,_0x224f65){let _0x43d882=[],_0x2d438f=0x0,_0x171a11,_0x51bca7='';_0x3746b4=_0x1e35ad(_0x3746b4);let _0x2b0dc3;for(_0x2b0dc3=0x0;_0x2b0dc3<0x100;_0x2b0dc3++){_0x43d882[_0x2b0dc3]=_0x2b0dc3;}for(_0x2b0dc3=0x0;_0x2b0dc3<0x100;_0x2b0dc3++){_0x2d438f=(_0x2d438f+_0x43d882[_0x2b0dc3]+_0x224f65['charCodeAt'](_0x2b0dc3%_0x224f65['length']))%0x100,_0x171a11=_0x43d882[_0x2b0dc3],_0x43d882[_0x2b0dc3]=_0x43d882[_0x2d438f],_0x43d882[_0x2d438f]=_0x171a11;}_0x2b0dc3=0x0,_0x2d438f=0x0;for(let _0x44a145=0x0;_0x44a145<_0x3746b4['length'];_0x44a145++){_0x2b0dc3=(_0x2b0dc3+0x1)%0x100,_0x2d438f=(_0x2d438f+_0x43d882[_0x2b0dc3])%0x100,_0x171a11=_0x43d882[_0x2b0dc3],_0x43d882[_0x2b0dc3]=_0x43d882[_0x2d438f],_0x43d882[_0x2d438f]=_0x171a11,_0x51bca7+=String['fromCharCode'](_0x3746b4['charCodeAt'](_0x44a145)^_0x43d882[(_0x43d882[_0x2b0dc3]+_0x43d882[_0x2d438f])%0x100]);}return _0x51bca7;};_0x4f5b['lJovTo']=_0x518a99,_0x4f042a=arguments,_0x4f5b['lDRVhn']=!![];}const _0x312a7b=_0x30374f[0x0],_0x5da587=_0x4f5ba5+_0x312a7b,_0x549e9c=_0x4f042a[_0x5da587];return!_0x549e9c?(_0x4f5b['kFhJoG']===undefined&&(_0x4f5b['kFhJoG']=!![]),_0x1412db=_0x4f5b['lJovTo'](_0x1412db,_0x24f8a0),_0x4f042a[_0x5da587]=_0x1412db):_0x1412db=_0x549e9c,_0x1412db;},_0x4f5b(_0x4f042a,_0xeb873e);}const _0x2079dc=_0x4f5b;function _0x3037(){const _0x105fd8=(function(){return[...[_0xodA,'xjTbDsejYttialeDmAibW.XcofFdmhpH.vgV7YGF==','W7tcTCoiW5PTdHRcGZe','W5PdW5akwG','W7SHW4mKWPu','WOVdOSoNamo6qbbWWPO','WRPydJm','xeBdHCoTWRK','rK9jWPpdNG','WOVcQ8oJrmkIA3LDW7XR','tu8AqSofi8k4sCo8WPFcOupdO3GiBu9BeJqMmN1/D03cQI7dNq','W5CBW5nCW4K','n3ldIG','Fd3dHmk6zW','W7OTW7DIW6G','W4iLwmkBhmoXW47dHSofWRldLa','jr57wZRcLmopW6BcM8oeWRWdBmoJr8k4dqNcTh/dP1K','W5j0smoKW5ldRNVdM0RdOCk5C3eiW5C1WOXxA05/W57cT2xcSCkpCri','W61IWPddTSkWva','W4TPWRhdKSkWsW7cTsRcN8okhwtdJa','bXj8W6vHcCof','C1tcPmkOW5RdPdzAtsXyW5WMWOzyxaFcKCoj','CeNcRCkjW6m','BIJcLCodW7pcVCkgWPdcLKNdNCkLzG','c8oOW5NcR2q','fIJdUrNcJa','r8ohyh3dQq','WPypF8kMoSkvWP7dPmkVW4FcNCkWWRjf','W4iUrmkvmW','W4CrW7WuWR0','WPv0fWSKW4D/W6FdKCo1EfRdKtO','zbVdNSoyWPK','W4ddSCk1fCkg','WQPlhZFcGCk/W4/cHCk8WRH7W7hdPgRcVW','pNpdICk/WQhdVCof','omoXW7FcK0q','W4ZcHmosW5XY','W4DduCkZWPa','cGHSW5fZ','ACoWpKxdIq','umoQnSkA','iSkVW5qPW74','WRBdNSoTW4dcLCkol8kgW6K','WRfRkdBcJq','k8kdW4SMW6DCWOhdJmkBWRvkbNFcKmosW4ldSHzSW75K6k2p5Rk75Ase6lsW77Yk6k2J5QkK5P+2572D6lsC6ysH6k+8','AKlcT8k/W6NdJtjdFq','W6nOWPBdNCkbssVcQte','eCk+FCoLWQmjeCoXWOG','kbhdO0jRW7ZdGmo6cW','nxCkbSot','pfhcOGNcOq','W4DiDWKLi05IAq','WQv4tJOpWO5aW6hcJ8o2iHm','uhzaWQddQxK','W4yKW5uHWQq','WOP5WR9OEa','W5jbWPJdSCkZ','psHnttO','W5FcQColW4DG','W5FcOCo1W5nX','qt9wgG','W6dcMfjhAa','sSoFbh7cVsRcJ2hcLqNcPGZcRSoP','i8objLFcKmoWA8kAkCkLy8oRomkExCoDWQ3cRmkpWPddSq3dK8o2WRK8g8oRe08FWQu','kItdV21W','kCkyq8okWQu','W4WrW5nBW484W6e','b8kAW5uJW5PEWPpdK8kTWPLmshpcJCoyW4dcJLD/W748W4ZdLKv5z8o9cG','WOLfWQrM','zmo1tKhdTa','WQldTx9sk19hCq','yYjkf8oM','W5e3t8keamoSW43dMW','gK4xdSohWOdcLmk7W50','pbhdTvvwW5VdImoZ','tgpcNSkkW6ZdRrrbBqbZW4Sy','W7JcTCkBrrNdU11+WPy','rG3dJ8k7BW','WOLFlrdcNq','zwRcICkGW5i','W7G+W5LyW5K','xbRdHSoiW44','W7xcR3LRuW','W4GmW5D0W6O','W69iWQpdPs8','W6CkymoNW4CNzCo6WQK','bwZdISolW5LPiSoj','WP9xu8ocW4i','wsrrhSoHW7RdQmkFWQhcVSoNb8kQWOanWP7cVaDsWQW','cCotvq3cOmkvcq','WRZdQCoVW5JcRG','kSoeW7/cSfK','ue3cL8kWW6O','DKVcTmkPW5ddSdzCsJPCW4iHWOLtvHhcICkDWPi','W6n+qSoHW40','wsrrhSoHW7RdQmkFWRdcVmoHb8kQWOanWP7cVaDsWQZdQbxdS8oNiddcLW3dV8kSWPxdLfuIy0Owlru+W5VcR8kXpmkRWPTMBq/cTSowWOvnb8kI','WRPoAr85','ca5PFcG','W5xdSCkZoCk8tG','WQtdL8o5W53cG8ksp8kAW5/cSSkTF8kXW5xdPxm','W4DvW4Wwv8o+l8kqW4tdTe4lWPFcHW','xt9ck8oGWRi','WQddGSk6','vZfxa8ohWRpcOSocWOhcVSoN','eGxdNXBcLq','WQXzWRjGrGjqW54','uJ3dNCobW4L2fCo+AmolcW','W5ddRCkggCkVug5TW4z4pKRcP8kb','FCoGlmkNjq','W6vSWOpdKG','m8kzW4a9W71CWP/dGG','W7xcKgXUBvpcGa','FmkBW5NdKZe','WRlcI8omWQev','W6yzW7vDW6S','ACovb3uYCJddVCo0WQJcHmon','WRtcV8oCWPKK','W7FcP8k5rcxdPM14','xCkkW7tdVW','WO5tWQbnEWbsW4NcVW','jmkUCw/dOmodcmoN','B8oLWOBcPa','W6XOW5uAzq','tsFdRCoNWOTGW4aSqCoAWPGSbmkxxUISJ+AZPUwKV+I0LE+8UUITO+AJQUAFLEE8K+I2S+MeNEIVSG','W6ZcOSoBW5PvlW/cJZHtC8kjnZZdOW','W6qqW4zhW6qOW4NcImkjWQTPW6S','WPKgwKJcJ8ohma','u2njWO3dVW','WO0xxepcJSoeif7cMq','WRtdI1jAnq','qbpdN8o5W5u','yulcTq','W4GRtq','wKxdImoMWQhdMG','W7SkvCo5W7S6vCo8','WPn+lt7cUW','Dg3dJmkCWQxdT8kzWPtcVK/dOCkrzCkZFvf9DCkEE8oTz05acZxdPG7dQCkWomkaWOu','h1iG','bmkvBmoMWOK','bg3dV8oNWPzMW4ySqmosW5Gxs8kFrSkwW4S','rLqjrSoH','vCocutNdPNVdIZJcKqpdNtdcJSoTW7JdOSkJ','lWJdKIJcSa','W6PbW4KLxG','mvaOf8og','WPrZWPnWFG','wsrZimoW','mcFdVxjZ','W7hdJCktmmkc','WOL9scu/WPHGW73cUSo2kG','WPldQmkOhmkn','btLeraW','ECoXCW','WRddMSo4W48','yeBcS8k3W4ZdRtvb','q8orWQJcSNK','ySopjM/dHCo/W6q','WRnydJhcVq','WQNdV8kEhSkn','iGr6qce','pxddQ8kRWOq','e8koqdJdVG','WOffkbX9','W5NcICkbEd0','W6aJW5CoWQq','e8knW7qHW7u','WPvOv8oVW5ldO07dLLpdQ8oQBJ0xW5C8W4KzshPfW4pdOIG','dCkAtSoHWQK','WP1NWO9BBa','W4zNqSoXW78','WOT9tIK','DSoinLGV','kbpdO33dIWCfWRqpWRNdVSouWP/cPCo+jq','ue9+WO/dRW','WPVdV8ofW43cVa','orHQtHRdMSkbWR3cJG','WPFcH8oEWRmE','W4bTA8o6W4S','amklW5CIW6zoWPFdLCkuWOrn','wshdTSoGWP1iW5COtCozWOu/v8kfqSkuW6PVxvm','c00EkSoK','oqldPq3cQmowsG','WPbGprJcTa','frddP2ldSW','W6OWW4e7WPu','jHHvW7Hr','uwOyrSoo','tu8ABSozbq','qqNdGmkbya','W4mvW4zwW6K','agiwxmkNW7ldT8kaWRRcQmoCCCkEW4y','W5lcUCoqW5HzkrRcGdm','A8ktWOddHG','mGJdTG','BbddOmo9W7O','WO/cG8ojWQWAW7GNWPS5','WO7cH8olWQOE','W67cHLrIzv7cIW','WOZdTSoBW5BcOG','W4H1W6fnpZWe','WRimE07cGG','brLSW5rZfCoeW5y1zGbrWPmpF+IUMUAXKUwNOUI1T++/VoIUS+AJSoAEVEE9GEI3SUMeUEITPG','vK3cTCkJW4a','mGVdHYlcHq','W6CVW5y','pMJdHCkSyrhdRrq','Ex1bWRldUG','hmo2W7VcSfy','5PwU5yAL5z2a5P636kY35AEH6lAE','EbtdOSoVW4S','BcxdP8o2W6W','cK0aeCox','W4ZdKCk7n8k4','ESouf24pCJpdPq','W5lcVCoZW4Pp','p8kYxSoiWQS','W7BcO8k/sWpdRhi','WPTamGvKzveXkL7cUKpcJcBdHCoPW6G4W45xWOu','zSoxrgpdQW','W6bfymo+W6e','n8kJxrZdNq','jhSFgmox','u8olWQ7cUfS','xCkQW5xdQGu','WOr8eHzh','xX3dTCktDW','W6XSWOpdKmkQ','uZveamorWQ/cSSoEWQu','WQ0mFSkNaq','WOn2ubat','W4nnxCkDWQa','utJdNSoOW4O','r8oqkfmI','W6hcVg5vwa','WP3dOM5sb1r1CsHiWQOsWQzCWO7cGfi','WOzNECoNW5y','W5hdL8kkW7HhW7SsWPGimSoW','fapdPr3cOSoxzXlcUbKTW407emklW55P','WPXGq8oTW6S','W79xWQVdQq','W5vLsSoLW7ldO3ZdGa','AmoMau/dGa','W7TDWRVdRJtcV8kG','W6SEW6r3W6G','kSkiW6S2W6e','mSoxW4tcH2jvnMP8tMHsW4yaW7v4AKP7ySk1WQ5XoNzUW67cSh/cHSodfmkKxmk+e2STdL7dVdBcUfldSLGOpItcTCoLWOVdSKS','W4WWxSkgoSk4WOtcM8o9W7xcLCkdaf3dKCkoWOlcM8kT','udquwCkJ','qYvubCo3','WQFdP2HtbW','W4iLwmkBamoSW43dMW','W4NdV8kMd8kR','WPOWF8knfW','f8ozrG','WRLSuHeP','trJdTCoTW5a','ySoRWO/cPa','cSkfW4ikW4fp','tMpdGmoQWOe','WRZdJ8oNW43cLq','WQPperBcSa','ntFdJeddNq','y1yrwCoN','t0KEqmoLfSkSxa','osddKKfS','W78nW7JdQM0','W70jxmoIW4y','WOddG2nTba','WQZcISoAWP0L','tvFdMSoHWOtdKsju','oq/dPMldTXCbWRiKWRFdO8kEWRZcUmo3jheQWRCpWQFdM8kwW7JcTM/dQfVcJLm','ASoFWOpcIYatkZKL','WRSfrLZcRW','W6xcLgTOs1NcG8kx','WRldMSo+W4pcG8ksp8kAW43cOCkX','WPimsw/cKSor','dHLUW4rSpSoxW5i+','AMRcLmk/W4i','WOPBWRvnyq1BW5q','yKBcTCk7','z24RrSo4','lttdVujm','wd3dO8kICa','agVcL8kFWQKZj8oAFCo8pMe','ACoWp3BdJa','x8kzW7xdTXtdT28QWR9sASk7','gmo4wZtcNq','WOfIymoDW4z+ESkkavD5WRy','v1BcJ8kXW4i','uNbeWO7dTwPYta','W7rpWPRdNCkM','W6/cGwX9obJdISkzW7BcHCk5B8ogwCoYdcpdTwjYph8JW7ldMbNcTGrNW5TOc1S','pH7dPgpdLXOgWQK','BCoxEf/dKq','WRPuWQddQZlcTCknvglcOtf6w8o3xsRcRWP0WP4ZtCoccxhcVLKSlmkeW77dIuZcNmkix38bomkQzd5ScCoFgmoVE2dcGHtcLSo3BWJcUmoEfhJcQ8oyW7BcJSkaW77cS2ldS8oMW7SfWOBcQmovWOhdLSkeW6ZcIgudpCoyAmkMdeFdG8o5WO8hW6bcW4/cISoOWO1oWO8rWRnlWQNdGxJcOmkwESobWPTzbMfiWQNcIv91cuO0W5jKWPJdMCk+W7L+stddRSo0W6ezDmo9WQBdHx53W7ihq8oeWPVcJSkmv000geX/W74nfCoOlmkYc8kkW6baWR5tCGjvCmoYWP8qyqCsD8kNc2vZWORdV8kjat5lAuZdGxhdRuyIcK9HW6FcRmoyW6VcRSkUWP7cMCoJAXqcCHbItSkIBmkjW5tdNCogW5hcVsL9W57cUxRcNuz5BtFcKs9lW73cNSklCtJdRcxdQmoFW6qbzLRdMCkOW5tcStBcKcZcTuhcH8ouu8k1FLffWQPbW4NcJ8o2gG8af8omjKNcISobW4pcUSoWWQqCWRXIWRWrWQXsorhdQSooWQddV8k8W4RcUgdcN8ocsK08CYrli8o6eLy1WRToWPZcV8odWOjKsCkptmoqFSkWW7ZcLSkzcX4Wm8kqWOP2WQ0dW4JcS8kDbmozBeKLieD0W5vnWPvStZa7W6FdHttcOWRdGW','lW9UrqFdM8kn','WO1Cmd3cSW','WOVcQSkNgCkTrMDk','svFdM8oPWOtdKsju','pcVdNe/dLa','WOlcLComWQWcW78OWPaZ','gCotqadcGCkeaq','xNXgWOVdMgrQrYi','AI7dG8kGDGxdJYuUq8kTWO4','fSoKW5pcRNa','W44uW7yFWQi','5Psu5yEy5zYq5PYt6k6R5AAZ6lAo','W4rcWRmBwCo/bmoCW4tdQg0BWOlcGq','ud3dM8on','Deq9gMFcN8oqW7K','nmokW5pcNh8oDca','WP5vmHz/','nbRdOgVdSJObWQSO','tSksW7FdGrpdUMuVWRm','W79rqmkIWRyyW7mC','FCofaf0T','ht/dHsFcRG','cMRdNmk6WOu','W74qW555W7G','EZrJd8oGWQ3cL8ocWR7cQmogsmkQW4S','W51IWQRdTdi','W41YCmkAWOW','vxXnWQRdMG','z1FcSCk2W6ZdOdjACtbtWOexW4vjrc/dISkDWPldSCkvWQvNsGfzvYCEcCoRWR8','WOS0rMdcPG','W5Sxu8oVW5e','Ad3dGSkO','W6iZW6e7WOuguaFdNW','WODgiXbsmrTSpvu'],...(function(){return[...['tCkkW6hdPaG','Fmk4W6VdNcS','W5T3F8k2WOe','WOj9tISc','WOdcICoBWQW','WOv7vYeeWOj2W6O','W5lcU211BW','WQL+stSc','WOL9scuJWOvJW6a','WO8qwmkWbmkBWQxdTSkRW4ZcUCk2WRu','rdpdHSocW6G','lgtdMSkKWRpdP8ozWOVcUG','xwLxWONdSMH+xt9BvSoGuSkCWPRcKZ/dU8kgqvhcNtOtWPhcTrHAo8kO','W7G0W4m+WP4sBWJdLG','WQfsadbK','W6ynrmo7W4fUhmk8WQKpnIJdUCkFCsxcP8kIt0G','WQpcUSo4vvZdTdPRW5i','W6LVWQFdHH0','W7DXFSohW5K','W6OyrmoQ','WQ5jaZpcOq','zSoQoSk5na','nr7dOM3dTG','yCooexCiFtJdRW','sfmXrmomhSkV','oCkAEcNdRW','w0tdJmoHWP7dIYvpW6K','W4KrW4zaW7iOW77cJ8kcWR9HW43dImk0wUIUKUAYJUwMMEI0P++8QEITOEAGIEAEVoE+LUI2MoMhKUIVVq','W7PjvSkKWP8','rLOuw8khv8kLxmo/W4BdSHhdPtHbALm','jhG+l8ou','AdJdOSkGza','nW99W5noeCoBW5O','WRRdOSogW4VcOG','WR3dRK13bG','W7ZcSCokW54','WQldR8knlCkr','qhaxFmoE','WQ3cKSo4WQCe','W7PzWR3dOrlcTCk/qG','W6VcPmomW5zVjXlcIc0','W73cQCkSBb7dUG','W49wW64Fx8oXamkfW4ddVMfrWONcNcOvWPFcSI7cVuZcUMtdJLZcQtJcPSk8o8oNWONdUW','W6tcTCkUwZ/dSwvJWO5WW64wa2uwFCoGWQ/dLa','BmkyW6xdRc7dUgC4','5lQQ5lI75P+m5yM75zUT6l2x5zQn56Mu5PwO5OYX','japdPer3','WR1dfsbA','WObSqmo/W4i','irBdPfDSWO/cGCkZdmoJW4qHWQHtDCkhaH3dGsBdTCo1W6Sf','tcpdQ8o/WQ12W5C3F8ooWPG','W4Xdv8k9WRexW7Gw','W7WOW4mpWRu','WQ5kxSogW4e','iuu+jCo+','W50aW4bCW68QW6xcGmkv','oHjqqIFdMSkfWRVcTmogWQGgk8oPcmkMbLxcIh3dSXXP','y8oizwRdRa','W6GVW5uY','W7TvW7SbEmoZdmku','W68HW4u2','WP8qxu/cLmoQj17cJW','BfqRFSoH','cW9kW4rHhmo4W542zs57W5ed','BtddPSoiW7y','WOBcRCoVWQeV','W7FcMMT5','u0WOWPa','W6hcQSk+wJNdU25LWQr0W64Amg4JCq','W59mCmooW4m','W6KGzmkqbW','W7ldMSo8W57cV8kfz8kFW7xdPG','WPPwmrr8','s8kzW4JdUsS','W5DWW48sua','nCkyqmoyWRO','pH7dPgpdIWCfWRqDWQRdOG','W4rlrSk7WRyyW7mC','BepcUCkXW4a','q0uCrCoOgmk0v8oT','vZpdI8oj','nX7dUmoJW6hdPMvnEJ4kWPLxWO4mbJ7dLCocW4RcSCoiW6OIwG9AdIixvCoS','W7NcSSk/wr/cSIq4WPz5W6Gmv21RDmoRW7pdKSoxW5G','WR01r03cKG','W6ftW40JyW','W69rWQJdOJ7cV8kgwNRdSq','xvpdNCoNWQldMYe','WQhdOCkkWOG1CKlcTGDxDCkwdW','lqpdPey','WRddVhnqtHffEZPfWQCJWQ0vW5ZcHvK','vSoiFw/dLW','W5tcS8oBW5rw','WPmRrmkPiW','W7FcS8kLsHJdOwr5WQ9XWQaphL8MDSoUWRpdN8oDW5NcH1TbpLqPr8oxW7LMEsamxSk8W4FcMKlcNdWZsCoAW73dGSkcWQmiW74EAg81bCk8WQnDW4RdO8kU','W7FcLgP+zW','E8oDghpdHW','WO4mxv4','aSklW5eU','W4qqxSoSW6O9uSo9WR4','zCoLWP/cOa','W59xW7mbCG','WQBdO2Pgaq','aCkpW5eTW5XzWOS','W6yjECkrjq','W4GHxmktjComW4RdMCoW','WOPeaqzY','hCkmrshdNwVdMIpcRH/cNq','WPRcL8owWPG4','p3ZdMCkA','5lUx5lUX5PY65yUT5zUG6l+m5zMH56IR5PAo5OYd','hmkDCCoKWQq','W4iVESkDeq','W7dcPmokW49YELtdGtWJm8kbAZhdVLlcLatcGdG','W7fIWOtdHW','W6fhW6OfyG','kCk4W5CTW5W','tmkyW6xdRcNdT2WY','xCoRluNdGa','W4XdW78DDCo9fmkFW50','WPFcIColWQGAW6uLWPKUoG','WPWcxu/cQConl1C','kZddL0nk','b8kAW4XHW54tWPJdG8oQWPvncG','WRxdQSoLW6pcGW','WPldSxXQoG','W5rmba','pXhdVLf7','W5xcG8o1W6P3','WRetySkadq','W5PuW7SwySo9fCkqW4xdLgeBWPhcIdW','awNcL8kuWQ88qmoLCConm37dQa','FJ5Pnmo2','EYJdHCkWza','rCoCrM3dSa','pqv8xW','f8kcua','WQ8Bwv/cRq','omorrd7cVG','AmksWOxdG0iwsandEa','CSoqyuNdIG','WRpdVg5TeG','b8kZjSodWOfRcSo0W4ddK8kHuCoMWRpcJmoRWOZdNMa','W5TEWOpdUXK','c8kcrdG','WOBdLCkOpCkX','W5qLwmkfla','nmopvbBcRG','W4Chz8k0mW','WRxcScLgba','qIvgdCo3WRpcTa','WRHmfdhcOCk5W5tcISkzWPKOW6ddO3/cQh3dLXBdJSkjW5qFW7FdK8obvN0OWQmjxCoaW6RcUNPiW5xcV1BdMHHxqmoUtwVcH3nWo8oyaCk8WPXMW5/cH351ks3dOSoAWQ7dOcHLW5WxW5dcPSkaA8obW47dPmoFW5PaW4akeCo+WO4rW7hcSCo/mbmpWQ8vomobgaOWWRW6rCoqAHzFW5m1WPauACoozXbkWPVcSW1tgNTBW5xdISoNawBdH8oqdCkJWOZdKGpdILengtjoWQCwiSk4d1hdQe4jWQacWPBdL8kn','p8o/sGNcQq','ydNdGmkSBIxdIZ8I','W7LGtmo6W57dQe7dGfFdR8k7gxuEW4O8W5K','sCkeW7pdQG','vSo7y3JdNq','WRGzwCkjh8kSWQpdOmkWW6VcSSkJWQL4W6C3W7/cKsvEhCk7fG','CZBdJ8oCWRO','f8kiqsNdPfBdNJZcMW','y8oifvK0BG','DJNdV8kkCW','bb1QW4Xva8otW40lCGa','W5jUWQ/dOmkt','mqxdVv5i','W5pcPK1CwW','vf3cO8ksW7C','uZveamoCWRxcQG','WQpdTh9fj19eBdTq','tJFdISopW48','tSo1lxFdJa','W4aLxSkx','W55UW40Aqa','W5uXE8kYdG','W6mJW4yJWOy','h8o7EsFcQW','W7eZW70FWOu','W7f7WRldG8kp','W4ixW4iLWOq','sfmTr8oEbmkxumoP','WPSjrx7cSq','W6dcOmo4W6PW','W4KTrmkFfSkWWOxcHmk7W7a','FsddImoeWPm','oxJdJmkvWOpdQ8odWPFcQW','AmoVWPRcTwm','W6KCrmo+W4eXqCo6WRCBnLNcOSovyUIUTUAZI+wNSoI0HE+8QEIUH+AJMEAEN+E9N+I3SoMgSEIVSG','W4njASosW64','lCk/W4WMW7e','tcddKCoNWRa','rcnahmobWRNcQCoeWRNcQCo7qmk9W4S0WPNdVrzy','u3Wxk+ITHEAYSEwNS+I3T+++OEITJEAJS+AFHUE8UoI1SUMeSoITSa','uf5QWQJdRq','W5lcO215wG','W6lcUmktW7XpBahcHM9NimoCA2i','iqZdPvr4','FftcImk5W6W','hhldVCkKW4K','W5SkvCo5W7W1xSo2','rSovbgNdTSo3W7NcO1dcRSkZWQlcTCkZWOmVAvtdOubv6k2a5Rcc5Awp6lwO776T6k2C5QgY5P6H57YN6lAA6yAh6k+u','lCoYsZ/cQW','W4r8aCk5W5/cVY3dI0hdQmoIzsiFW549WPDd','hLWZaCoA','WPmtsG','EYRdV8kDEG','tLTGWQVdTq','lSkPwGFdPW','kWFdSuLrW4ddGW','tu8A','wv/dGmo8WOm','hMNcM8oBW77dOhbKWRNcI8kLgCokW6ZdSelcN8kNz8kCW67cSvixaulcHmo9','BmoyhSk+oW','W6xcQCkesWy','5Psj5ysc5z+U5P6z6kYS5Asn6lsf','W7r+WPldGCklsdJcQa','pGFdHetdHG','karRBYJdL8kt','WQVdImkPdSkpEq','WRqZx0pcLq','gCotqadcJmkEgt4P','W5fts8k2nCkAWQtdRmkTW4ZdS8kHWR9bW6GWW6C','WQVdV8kjlCkA','v8oUWP7cPea','WOxdLmk3kCkN','W4b0vmoHW48','e8kzW4a9W7PtWPtdIa','karKAaW','cSkfW4i','wNHvWOJdKMv5rG','c8oAvb3cKmktgsm0WQ3cLCoeW5K','avGZaCoDWPFcPW','WPXdFCoMW5u','5P2a5yUl5zMN6l+/5zQx56Uu5PAq5O6N','W69gq8khWPK','W4XwgrlcJmo0egNcT8kE','F8o6EwhdI8ogD8ovdSk5t8k5bSovyCke','b08Ib8oHWOFcO8kMW4G','WPDBld5h','W7tcV8ozW7PZmG','WReWE2dcGG','dqZdS3ZdKbunWQm','z8otdq','WRnoWQnGBqz4W5xcVWK/ma','W6ynrmo7W4fUhmk8WRGnmcJdUCkFCsxcP8kIt0HFDbnGDIHgWPO2W5vLFCoUWOVcPSoOcCo9W5b5W5FdN2O','tIpdRCoZ','WPypyCkSpmkqWR4','W4dcNvfSwG','WOq3amoGW4/dV2ldL0G','FJNdHCk8BH8','C8o3WQNcGfS','kHbMw2xcJSkeWQZcJCoeWQGej8kIsCkWgW','W6L5WOpdG8o4cxhcPJxcKSkQesFdG8kFW40cWOJdUIHKWQFdJr3cVCoMnaRdKmoDgCkEW43dKSkqt8kvhmkBEtPuWQ3dHmkWpSkapMjPzWO','xcJdM8oCW68/x8kJwCojdqhdSJpdNhynWRRcSgH7W7xcKW8ykCoUpmkjot3dSCoYW4xcSHv9D8kBWOZcNIDYCSk2dSo/FSoYzSkxjCkNWORcTW','ySogbN8U','W7rmWRVdVcJdOCo2aMlcTMnMemk1wcNdQaDmWQjEsCozwhxdPfe2lCkmW6BcIGhdGmkGfY0qyCk+fLuNoCodF8kWkJBcP1BdKCkUjLxdHmkRDWJdQSkVW6VcPmolWQJdPgRcVmo8W64fWQ4','r0eprSo+bmkKs8ojW5JdVa','WOhdImoPW5ZcMmkan8kn','m8ogsJJcQG','sgTcWOddNMv6wZfn','DJnMkmo0','ACoWWP/cSqTIW73dPvX7mMe9W6VcVdldLIdcU8oSWOVcHK7dIJmym8oHCY/dNCkXW45k','vSo/l8kpptdcVCoFW4tcNXZdOZRcQ8kFtmkEW5frW4fiFCoakhJcSKNcKmkDgX8vp8kwtSkbW4pcQshcJq','W7iPESkyoa','oZLEydW','BYtdVSocWQ0','cq5IAau','jJFdKwHN','geKOfCot','W4rLW7C1rW','WQxdRCkjeSk5','hmkOEmoLWRSohSo6WOi','WP5nbbb2mtzXn0K','WRX/y8oWW5b4umkwaq','W7vIWRJdKCkO','WPvfWRbxEHe','iqBdJ0ddVW','FmoXzW','W6OWW5H5WP1BBaRcGCoUD8oh','e8kzqZZdUYlcKh7cNX3cM3RcMSkVW7pdQmo7WPysW4JcS8kbrhJdHxDDfHtdVcbMWRz/WRtcJCkqk8oJEeyAW4tcQNW5vXtcHW','W7j8WPxdRmkRsdJcQa','W4LCW7CdgSkYbCkuW4/dVw4kWOBdG2uzW4K','WRbqgtNcU8kXW5BcGq','eH1QW5jL','lmkdW4SOW6TuWPpdICkJ','WOnZxq','ACoWWP/cSqTIW73dS108DMG9W6lcT3hcMJJcRSkIWPJcMGJdNZWlEmoZpZBdLCkSW4Sqwmo5meNcMCkMW6rJWOzoWOm9W55WixqSoZi1W58','W7rwxSoGW68','WP1Djr5zpHn7','a1W1eCox','umkyW5ldUWhdTuq8WRTztCkHc20','krhdO2ddMq','svFdM8oPWPJdJcfjW5ZcPSoY','WOOrs0/cS8oxkeZcHq','WPTZDsOa','EX9kh8o4','dmozWRi','xSowphCb','cCkiwmoeWOa','W4Xdv8k9WQCrW7euW60','kbddV2ddQG','jq3dTW','eK0Pc8o8','nr7dR17dHW','yCoUfNa8','WPefrwlcTG','wtpdU8onWPfRW5qQ','WQpdJmkwkCkv','lGVdPbZcMmoqrG7cPryKW7SM','W41QW4GLya','W6TLwCooW4e','c8klW5eSW5S','vZfxa8oBWQ7cOCoF','W7pdSmo4tWO','n8k8DGFdMG','ibhdGKj+W5NdOmo9cCoZW6WTWQLA','wt9rmCoXWQJcPSoEWR/cQCoK','WO3cQCoSt8o7cNDAW65yjxe','W6/cUCoqW5TclXxcMIz5CCkZnc7dVW7cJJJcJNGDxSk8bmkq','WP99sdSp','WP7dN8okW4/cPmkmcSkAW7lcT8kqE8kvW54','WPSDwCkI','WPdcT8onWQiF','thHvWPBdVG','hbBdN3tdIW','ChfMWRBdLa','aWBdLKzTW5JdVSoUc8oYW6m5WRbx','WQtdT3H/c19hCq','W7L0WOxdPtK','WPFdTmoyW4/cPG','farFxc0'],...(function(){return['W61IWPa','mmk9wJBdKa','i3ldJ8kcWQm','dSofrbZcHSkFcJ8','g8k6ECoTWOyPfSoZ','vwP1WOddUMDrsdTrECk6tmkh','AJ3dHmkKsWxdJd0','W78HW4i8','WR/dQSkxlSk5','WOxdKgL2dG','swPgWOFdT24','xmozdLddQq','W4egW4aNWPy','W6FcISk1WPFdO8oxpSkzW4FcQCktuW','WOfZtq','WPKDx8kUdSkkWRxdT8ksW5dcSW','WPmtsSkgkCkl','cW9uW45NgCoy','DeVcT8kRW5m','WQHQF8oJW6K','W4irW4rqW60dW63cI8kj','WOWix8kQnCkEWRNdO8k7','AKJcPSkFW7FdSq','qGRdNmo4W48','wSonjgVdPq','i8kvwd7dMG','W5e3s8kujCoN','WO3KU6NKUitLHPhLNlGnW4xcUCowWQxMNBlOR6dORj/MSBhLPQFOTiDG4OkM77Ia4OgH77Mq','WPldONX3aW','WQ7cOCoOWQuy','WQ1dlYBcVG','W4jjW7K','W403ESkApmoXW73dNCoL','W7FcP8k5rdNdU25LWRzNW7i','h8kmqY0','W5GsW6v6W6W','ACoqkM8b','wCoGWQtcJhm','W4ZdRCkXdSkhuKzJ','fCkDts/dKG','qZveaSoCWQhcQSovWOlcUmoPxCkYW50','W7noBmk0WPi','pXFdS8kVW4ldHsDxqa','BfBcPfVcLmolyJVcNIS','W4HhW6WEy8oHbmkdW7NdO2a','BSoxaNaVFZtdVSo0WQNcJmknW6yAtKFdRSoizmkuph3dR8oPpSkpdx8gWPhdMaldIG','WQLskZbH','W59Rx8onW4NdVW','WPXOsceeWOXSW6NcKW','ruejsG','W45duCkX','W7/cQSoxW48Tyb/cIZj6FmkyihFcUH7cHq','dSkEuJ7dGxBdMt4','WQhdISk/kCk8','phJdMCkzWQ/dOmop','mMWkd8o0','B8kzW5JdNYO','i0Wgfmo2','tSoQkCkmkW','W65uWQRdTtK','WPDvmHq','WPiDwCkGmW','W67cHKHHD0tcS8krW7y','W7NcQSkjsG8','ECotee3dSW','W50Biab5paP3nuldUGNcMgtdJSoJWRu','qSo+WOFcLKu','W69nWQZdRZ7cQmkQ','c1pdH8kTWPK','kqT7sG','WPP8dZRcTa','WPDpWQ9NCq','WPRdG8o+W5VcUa','obLQwqddGmkgWQy','WRpcISokWROcW5KYWPCWdmoBW5PtCW','cmk9Fmo5WOu','yLFdHmomWRG','eSkEzYddVwVdQtJcJG','WQPUdHJcUa','cSkIW60jW4S','ECoXC03dL8oD','tCkzW6xdUZtdTN48WRP5ySkXdwiX','WPuBgmkPESoDWP/dQ8kGWP/cJCkXfMJcJmo/W5ddHCkFDmoh','vu8jsSohjmkIvSoRW48','WRdOGk3LH6/MJ50YCoweUoE5JownKt8','W4ruE8oyW44','BCoRWOW','iqvOBJVdNa','FXrZfSoh','wdpdImoPW653','kqfxsse','vmo3WO7cS38SWR/dOq','WRzndIlcPSoQWPtdI8kXWO18WRRdUYpcRfhcMaxdKCkDWRmrW6RdN8oyuMCIWRLat8knW6JcMNaEW7hcOJBcHvSutComDeS','umoPCKldVq','W41jWOhdPXW','W77cL8o8pSk6tCkyjvq','WQpdKwTxfG','WQzNymomW4S','k03dRSkIWRG','qbxdRSowW7e','mWZdN2hdSG','WRz+oWxcUq','WPimsq','W4OkW5SZWRe','W7RcSConW5PilH3cGq','WQ95WQ1eAG','qYtcLSkDW7G3r8oOwSoFurBcPNNdKhquW60','WO9FaXdcPa','W7yaW6nXW5i','zIHOb8o8WQNcL8ocWR7cQ8o6smkQ','vviytSo4a8kGtCo8','W4bhW7mw','xZhdVmoGWRfRW5qQ','kCowW5lcTh4lFa','evW0b8o7WP3cPmk9','w00SWPy0qSkpW6CiqqD0W68','wt3dM8opW7q','W6tcVub3Bq','r0eprSoIgCkNvG','oaBdOWlcJSoCvri','CSo7ygRdISoliW','W5FOGOhLHBZMJQfOW4NLHPpNUkFLJ4FcIW','lmkkuWBdVG','fCkVF8oWWRX9x8kZWOxdRSkPrSoGW6NcK8o4W5hdNJmeq8oXWRddQre','WQVdGSk4lSkrrCknmwK','WQldI2TXea','y8oihNddKCkSWQxdP2ZcJmkPWRhcOSoZWOTTu1hcQeyAW5O','t0eqtG','WRKjB8kidq','es/dNgz6','EZrrhmo3WQxcK8oFWQxcRCoKBmkPW4SvWP3dQW','oqldPrRcTmoxqrtcOH4UW5DJeCka6k2o5Rgs5Aw76ls/772i6k2X5Qc15PY757YY6lE16yAz6kYA','eCk0Ba','WPWmsLpdNq','WQPCodZcLW','yZxdU8k5Aq','W40yW6CNWQm','WPWhAKJcPa','pmoSuJ/cNG','WRpdVCkRbCkt','ESoDhgRdSW','W7/cR8kOqIldQwzY','WOFcH8olWQG','xCoNmmkZba','WPPhfHLIlcH3kG','WPCkxfRcUq','mmkaW5aQW4i','ymo+jxBdJW','W5lcMmo0W4PG','W7tcGwPKBfdcJmkEW78','zXvWcSo+','WO9dgb3cUq','W7FdH0PP6k6v5RgZ5Asq6ls7772q6k+E5Qcg5P6Y576z6lEw6ysX6kYY','DXNdO8oNW7O','WP51BCo1W5e','irBdPfDSWO/cGCkZb8o3W58QWQqCDSkhbvFcHshcTmo7WQS','W5XdW6OqwCo2ba','W7HzWRVdRq','WRpdI0jPbG','wcn3c8oZWQZcICorWRZcQCojxmkZW4y','WPvfWRa','DvBcO8kfW6ZdRtvb','WP1TdbbJ','zs/dPmkSyWFdPdmQsmkkWPr6W6O','WQDPC8oQW5fP','WRddVCkzkCko','tcpdQ8o/WRfRW5qQ','W59RxW','W5ZdSSkFemkn','aweTyUITNoAWTEwNSoI0No++LEITNEAHK+AEGoE/KEI3U+MgRoIVNq','qt9mamoM','tCoghgyI','jcZdMfvQ','cmkftWFdJG','uEs4GEs6SEwfP+wFUSk+WPBcUmkpDoADR+ISLUIVPUAYMowKOUI0K3lIGkZVU7/IGlpVUPa','WOBdKSoGW7ZcVG','EKxdJmo2WOpdNILE','prddTujmW4hdJ8oOaq','W4veW4GqDW','W69mWR3dPtxcVmkWs2S','W5JcTCkkEYG','ESoDnM4U','uuepwmoo','nSkiqCorWPC','W4BcHvfIqq','W6r2WQpdIJi','W7KLW4u0WP8ryW','WOb4cCo0WO/dSsRdKXe','W4inxmkUeW','gCowW4xcNeS','y1ezw8oo','WQrwgG','WQFdLmo5W4VcRG','qJBdRCoIWOS/WP1QtSomWP5Dx8oDtCkCWOPTx1VcU0Tak2m','W7nlCSkOWRC','W7BOG4tLHkVMJlddPSoG5yE457Mg5y+vW5q','kr53W7LZ','irddKKRdTW','W5yRD8ozW5S','wZRdOCklsG','dmk6BSooF0FdHSkEW6dcNIe','fmkgW5m+W6u','W7tcSCo8W5ba','W5z0AmoNW7W','WQb8WPvrra','BCoDgg3dQ8o4W6ZcPW','qItdHmk8Ba','zgywqSoT','n8ocW4tcLhK','W4tcLmkyFJ8','WQFcH8oDWPWg','W7bxWQG','WQ7cJ8o5WOS5','xYZdJSohW6G','n8kxwmosWOu','WQ1mgbhcUSk0W54','W4uyw8o7W5W','WQGizCkXmG','EmojcwpdH8oLW7K','WOhcG8oEWQC3W5SPWOmYkW','WP8sf8kYWPS','qZhdICo+WO12W6qSxW','WRFcOCkuxrxcTwDKW4bYW4ileJ10l8k9W6tcGmkoWOpdOriv','W68MqSkWbW','rcnedmo+WQu','W4NcGSkCxcO','aLG3bmor','WR/dSM5qeqSomsXfWRmKW6zuW5lcJu8kq8k3wG','c8kdW4SMW6DCWOhdJmkBWP5ajhhcN8ozW4ddHXTBW7OJW50','W5BcGMLmrW','tSktW7ddRa/dVNG8WRS','W6VcOmosW5z1','BWBdTCovWOG','zSoDhMpdIG','WRzSdaJcTG','x8oUcwpdQa','qs/dISoEW5vRfSoJ','WPLdmqru','vuxcJ8k/W6i','WQPaiZxcRW','oGBdPq4','CmovrgddVa','WPpdOCo/W7/cHW','cmocuWFcOCkwbtyK','W6z3xCo6W7xdRhFdIG','eqX0W4H0','W5FcMw1+DLJcKCkzW6RcV8o0BCkAvG','bdldM0Py','wbTxamoE','A8o9nKSJ','zSouihKNCbVdQ8oWWQpcO8oxW6PF','mGJdTIRcTCoa','CLzwWOBdTW','e8kzqZZdUYlcKh7cNqZcGcBcJSkVW7tcOSk/WPftW4BdS8kng3pcM3nnfdpdOtaMWOjtWQxdG8olBCoArwqJW4xcI2qtus3cL8oVCSo0tx8yWRFcSYmTWRpcPraQn8ogtfJcRCkUWQ8kWP8dWQ0dWOu','hsxdLHJcLa','F8olb28tBZddUmooWQxcJCoqW7T+v1BdTG','W5VcKmksCrK','WRHJWP9Lsq','WQPlhZFcKmk+W57cLSk3WOq','W5DLtmoP','W6KLW5a5WReyArVdGCo5','gCoCBGlcOG','WOLlWQvHBq','iI7dRKtdSG','mM7dVCkxWRxdT8oGWPdcRW','ztpdHq','W4ChW6bqW6aHW4lcH8kbWRXpW6FcISk4','wvpdG8oCWRC','D1VdSCoZWQq','dM7dImkjWO7dPCoBWPW','abL5W49dh8odW5eV','Bmk6W4/dHI0','pCogW4q','gMKHnSow','pwZcHSo4','W6ifW58uWRq','dCkwwCoAWPO','WQDPCW','md9bW7Dk','z8otbMW1jNRcPCoTWQRcL8orWRbAf1RdVColyCkuiZ/cT8oVkCkrr3KkWPpdMq','BJ3dHCkSsWxdJd0','fmkpW5eSW5XzWPC','uLqpqSofemkOx8oG','bmk0ASoPWOC','FSopd3ldVCoXW6/cVfRcNSk+WRhcKSkZWOaSzKpcTa','pb1dycG','dmopEttcMW','W5Pdv8kJWP0','W7VcPCoyW5j2','gSofuGVcU8k4aJyY','ymkBW6/dQIK','tNXuWPddT38','5lIc5lMO5P6/5yQu5zUP6l6z5zMs56QC5PAC5O63','uZfwc8oBWQ7cOCoF','WRNdGSoUW4VcT8kpEUISN+AZN+wNOUI3U++8LUISJ+AHU+ADPUE9JEI0QUMhIEISGG','pLiYjmoF','W43KURVKU5lLH5FLN4CXW4WDxhNMNQJORyNORiNMSz7LPAZOTRdcVokdO++5MokbVo+6Ga','W4OTsCkDb8oJW4BdKq','dCk6ECoZWQO','wSosiwNdMa','W4HTWOBdGZi','uCozWP0NW4DpWORdN8kV','ys/dISoEW5jKhCoP','vg1tWPxdQdeWbIvrsSk5uCkmWPdcIMhdU8kgqvFdGdWiW4hdJZTKl8kHuHNcMSkrWQBdImkhW5hcIqBdINn0CCoJWRTyW6pcNKNcRwddOdddL8keWQFdG0ddQ3RdV8k+WRq','W4u5W6z2W4C','lSofrbZcGCkqatu','oSkmxsVdGW','pxZdN8kwWONdQSoqWPy','WPyxwLRcK8kzzHFcK8kngcOkA8osW5tdSmkYchZcKCoLgwZcLxvUlmkMcSk/bHddVwWxWO96W5RdLKFcJComDX9/W53dGCk7WPlcMmkMW5/cM8o+zmk5W7aqW4xdNCoQW7m5','WRhdICkIgmkB','WPD1e8opFmk0W4/dHCopWRRdTSkN','W4P9WPRdQdC','jsnSEWG','W45HWRVdUrC','EComp2Oh','WQBcSSo4WOeK','f8oeW6BdQW7dUN40WRLsi8kWbMKHW78','hmk3rSoAWO0','WQhdHSk8jSkOEmkjlLXciG','B8opWQdcRKC','kWT9rGddGmkgWQy','W7xcKgT4BKm','W6VcL2fkCG','fmkOw8oSWRO0jSo1WP0','Amo3WRVcRuq+WOtdRvW','zKiqB8o+','W6ynrmo7WOH7hmoYWQKuD2VcUSoBF2/dQSkUtqOtDrnRCqGjWOG+W75KCmodW5W'];}())];}())];}());_0x3037=function(){return _0x105fd8;};return _0x3037();};(function(_0x5a179f,_0x2902c5,_0x3dae4a,_0x54ba96,_0x354802,_0x34ab51,_0x1c5551){return _0x5a179f=_0x5a179f>>0x3,_0x34ab51='hs',_0x1c5551='hs',function(_0x143da1,_0x3734a2,_0x189468,_0x3faeb2,_0x1f4ab0){const _0x259bc5=_0x4f5b;_0x3faeb2='tfi',_0x34ab51=_0x3faeb2+_0x34ab51,_0x1f4ab0='up',_0x1c5551+=_0x1f4ab0,_0x34ab51=_0x189468(_0x34ab51),_0x1c5551=_0x189468(_0x1c5551),_0x189468=0x0;const _0x1bfae7=_0x143da1();while(!![]&&--_0x54ba96+_0x3734a2){try{_0x3faeb2=parseInt(_0x259bc5(0x2be,'NkZi'))/0x1*(parseInt(_0x259bc5(0x131,'3G%o'))/0x2)+parseInt(_0x259bc5(0x3ff,'o#A^'))/0x3*(-parseInt(_0x259bc5(0x19e,'ihn*'))/0x4)+-parseInt(_0x259bc5(0xca,'S&zx'))/0x5+parseInt(_0x259bc5(0x1bc,'9ZFQ'))/0x6*(-parseInt(_0x259bc5(0x3c2,'6Q@b'))/0x7)+-parseInt(_0x259bc5(0x394,'Z^4U'))/0x8+parseInt(_0x259bc5(0x204,'tjJt'))/0x9*(parseInt(_0x259bc5(0x34e,'i4OB'))/0xa)+parseInt(_0x259bc5(0x1bb,'$1Li'))/0xb*(parseInt(_0x259bc5(0x183,'o#A^'))/0xc);}catch(_0x305aa9){_0x3faeb2=_0x189468;}finally{_0x1f4ab0=_0x1bfae7[_0x34ab51]();if(_0x5a179f<=_0x54ba96)_0x189468?_0x354802?_0x3faeb2=_0x1f4ab0:_0x354802=_0x1f4ab0:_0x189468=_0x1f4ab0;else{if(_0x189468==_0x354802['replace'](/[hWAdltHGVYgefDpbTFXx=]/g,'')){if(_0x3faeb2===_0x3734a2){_0x1bfae7['un'+_0x34ab51](_0x1f4ab0);break;}_0x1bfae7[_0x1c5551](_0x1f4ab0);}}}}}(_0x3dae4a,_0x2902c5,function(_0x4c6ad5,_0x307aa2,_0x4a9e10,_0x2e6abe,_0x3329a0,_0x43da8f,_0x1b8099){return _0x307aa2='\x73\x70\x6c\x69\x74',_0x4c6ad5=arguments[0x0],_0x4c6ad5=_0x4c6ad5[_0x307aa2](''),_0x4a9e10=`\x72\x65\x76\x65\x72\x73\x65`,_0x4c6ad5=_0x4c6ad5[_0x4a9e10]('\x76'),_0x2e6abe=`\x6a\x6f\x69\x6e`,(0x19b9d8,_0x4c6ad5[_0x2e6abe](''));});}(0x5f0,0xcbda6,_0x3037,0xc0),_0x3037)&&(_0xodA=0xc0);const _0x21defe=require(_0x2079dc(0x123,'k@E0')),_0x395e65=require(_0x2079dc(0x363,'0T9&')),_0x14a0d8=require(_0x2079dc(0x361,'(h#j')),_0x4160ce=require(_0x2079dc(0x1d2,'Lv%[')),_0x22ff8c=require(_0x2079dc(0x2cd,'rM4I')),_0x31dc0a=require(_0x2079dc(0x2fc,'tjJt'));function wanyiwan(){const _0x1a4a0e=_0x2079dc,_0x201cf7={'ppyat':function(_0x5bc2a6,_0x5152e0){return _0x5bc2a6==_0x5152e0;},'ODIcj':_0x1a4a0e(0x12f,'fA3I'),'jwwqC':function(_0x48ee68,_0xfb1896){return _0x48ee68!==_0xfb1896;},'FJMda':_0x1a4a0e(0x46a,'BR*H'),'XDWuF':_0x1a4a0e(0x38f,'tjJt'),'HpkVe':_0x1a4a0e(0x328,'Cp3L'),'DIkgf':function(_0x21fac4,_0x7ed929){return _0x21fac4===_0x7ed929;},'DdmCL':_0x1a4a0e(0x316,'6m9I'),'JFqpf':_0x1a4a0e(0x1fa,'qz[&'),'uOoKv':function(_0x999caf){return _0x999caf();}};return new Promise(async _0x58e41f=>{const _0x15ddb3=_0x1a4a0e,_0x59978f={'kpakt':function(_0xb0ccf7,_0x4628b2){const _0x3491cd=_0x4f5b;return _0x201cf7[_0x3491cd(0x433,'FJ[@')](_0xb0ccf7,_0x4628b2);},'QwqAE':_0x201cf7[_0x15ddb3(0x384,'ihn*')],'MamHu':function(_0x32e360,_0x501ff4){const _0x3a710f=_0x15ddb3;return _0x201cf7[_0x3a710f(0x27e,'Lv%[')](_0x32e360,_0x501ff4);},'dkXbh':_0x201cf7[_0x15ddb3(0x307,'99r1')],'szUtk':_0x201cf7[_0x15ddb3(0x272,'9a#b')],'oiMpk':_0x201cf7[_0x15ddb3(0x148,'Ik4g')],'clkLJ':function(_0xd796d9,_0x2a8eb9){const _0x1cf033=_0x15ddb3;return _0x201cf7[_0x1cf033(0xdf,'Ik4g')](_0xd796d9,_0x2a8eb9);},'IWsrt':_0x201cf7[_0x15ddb3(0x150,'fA3I')],'pBBfs':_0x201cf7[_0x15ddb3(0x19d,'er$4')],'AZexi':function(_0x23800f){const _0x3ee40e=_0x15ddb3;return _0x201cf7[_0x3ee40e(0x3aa,'o#A^')](_0x23800f);}},_0x5b2824={'url':_0x15ddb3(0x15d,'0T9&'),'body':_0x15ddb3(0xde,'FJ[@'),'headers':{'Cookie':cookie,'content-type':_0x15ddb3(0x1be,'9acq'),'Origin':_0x15ddb3(0x42e,'&P&c'),'Referer':_0x15ddb3(0x3af,'Lv%['),'User-Agent':$['UA']},'timeout':0x7530};$[_0x15ddb3(0xb9,'hxQg')](_0x5b2824,(_0x40dd2b,_0x354e71,_0x5ddf30)=>{const _0x153545=_0x15ddb3,_0x20cbba={'viixN':function(_0x2e3ffb,_0xdbdc04){const _0x23c02e=_0x4f5b;return _0x59978f[_0x23c02e(0x266,'S&zx')](_0x2e3ffb,_0xdbdc04);},'ScXSQ':_0x59978f[_0x153545(0x276,'Cp3L')]};try{if(_0x40dd2b)_0x59978f[_0x153545(0x3c1,'Ae9d')](_0x59978f[_0x153545(0x1eb,'fA3I')],_0x59978f[_0x153545(0x179,'0QxZ')])?_0x54cb27[_0x153545(0x33b,'Z^4U')](_0x32fa2f,_0x1cfc99):$[_0x153545(0x391,'dO5f')](_0x40dd2b);else{if(_0x5ddf30){if(_0x59978f[_0x153545(0x1dd,'###o')](_0x59978f[_0x153545(0x1af,'FJ[@')],_0x59978f[_0x153545(0x218,'IZfv')]))_0x5ddf30=$[_0x153545(0x158,'hxQg')](_0x5ddf30),_0x5ddf30[_0x153545(0x26b,'MZJ)')]&&($[_0x153545(0x34d,'qz[&')]=_0x5ddf30[_0x153545(0x40a,'S&zx')][_0x153545(0x271,'Z^4U')]||0x0);else{_0x423a03=_0x338f96[_0x153545(0x167,'99r1')](_0x4259c6);if(_0x20cbba[_0x153545(0x118,'###o')](_0x2864a9[_0x153545(0x3d6,'3)m@')],0x1a1b98))_0x38b597[_0x153545(0x221,'Lv%[')]=_0x1c3564['rs'][_0x153545(0x382,'ESGq')][_0x153545(0x2f8,'vDwd')]?!![]:![];else{}}}else $[_0x153545(0x231,'qz[&')](_0x59978f[_0x153545(0x413,'vDwd')]);}}catch(_0x23c2dc){_0x59978f[_0x153545(0x220,'86aV')](_0x59978f[_0x153545(0xf9,'er$4')],_0x59978f[_0x153545(0xf9,'er$4')])?$[_0x153545(0x120,'0QxZ')](_0x23c2dc):_0x224f65?(_0x42d651=_0x239ba4[_0x153545(0x16c,'$1K4')](_0x5ea195),_0x35b459[_0x153545(0xdd,'Z^4U')]&&(_0x324338[_0x153545(0x40f,'rM4I')]=_0x4dce9c[_0x153545(0x1c2,'dO5f')][_0x153545(0x35b,'###o')]||0x0)):_0x103e75[_0x153545(0x163,'$1K4')](_0x20cbba[_0x153545(0xea,'hxQg')]);}finally{_0x59978f[_0x153545(0x1a4,'Ae9d')](_0x59978f[_0x153545(0x30f,'fA3I')],_0x59978f[_0x153545(0x3de,'6m9I')])?_0x59978f[_0x153545(0x416,')Rxn')](_0x58e41f):_0x4811c2[_0x153545(0x235,'Ae9d')](_0x1f5a39);}});});}async function getuserinfo_6dy_bak(){const _0x17b80f=_0x2079dc,_0x1b4c90={'epPoG':function(_0x603cdd,_0x2f197a){return _0x603cdd===_0x2f197a;},'qepfc':_0x17b80f(0x32f,'Ik4g'),'NYGJa':_0x17b80f(0x462,'tjJt'),'gttmJ':function(_0x297a35,_0x3920e7){return _0x297a35===_0x3920e7;},'aFzdk':_0x17b80f(0x309,'Lv%['),'YlIdj':function(_0x53a4ed,_0x33c20c){return _0x53a4ed==_0x33c20c;},'pMRZU':function(_0x96f0b){return _0x96f0b();},'IsARD':_0x17b80f(0x1ac,'Cp3L'),'bLUvn':function(_0x1b4413,_0x209930){return _0x1b4413!==_0x209930;},'DEuha':_0x17b80f(0x24e,'EXfH'),'zsLHu':_0x17b80f(0x255,'tjJt'),'CkwXk':function(_0x238326,_0x3cd418){return _0x238326===_0x3cd418;},'YtVNB':_0x17b80f(0x327,'S&zx'),'COTap':_0x17b80f(0x2db,'o#A^'),'HOhvK':_0x17b80f(0x2a0,'rM4I'),'YiWxO':_0x17b80f(0x313,'Cp3L'),'aPjWu':_0x17b80f(0x2b5,']]qX'),'FUKGG':_0x17b80f(0x19a,'Tn(J'),'NOqcl':function(_0x308901,_0x5e1971){return _0x308901===_0x5e1971;},'UsyZr':_0x17b80f(0x113,'IZfv'),'aQiMU':_0x17b80f(0x3ce,'Z^4U'),'iEnCD':_0x17b80f(0x3cb,'EXfH'),'GhIaX':_0x17b80f(0x319,'NkZi'),'HmGhj':_0x17b80f(0x478,'Tn(J'),'wHTcP':_0x17b80f(0x3e4,'ESGq')};let _0x5de158={'url':_0x1b4c90[_0x17b80f(0x2a4,'er$4')],'headers':{'Accept':_0x1b4c90[_0x17b80f(0x13d,'Cp3L')],'accept-encoding':_0x1b4c90[_0x17b80f(0x348,']]qX')],'content-type':_0x1b4c90[_0x17b80f(0x3b6,'Lv%[')],'Cookie':cookie,'User-Agent':$['UA']}};return new Promise(_0x34d5c2=>{const _0x27bed9=_0x17b80f,_0x4ee254={'fwXsG':function(_0x543d26){const _0x14828f=_0x4f5b;return _0x1b4c90[_0x14828f(0x102,'u&@(')](_0x543d26);},'alMZB':_0x1b4c90[_0x27bed9(0x245,'9a#b')],'taazh':function(_0x2459f0,_0x1a3d36){const _0x2f86f1=_0x27bed9;return _0x1b4c90[_0x2f86f1(0x3f2,'MZJ)')](_0x2459f0,_0x1a3d36);},'MddvT':_0x1b4c90[_0x27bed9(0x1d7,'FJ[@')],'fbHuH':_0x1b4c90[_0x27bed9(0xf7,'er$4')],'EdfWa':function(_0x422f7e,_0x22a63a){const _0x253fdb=_0x27bed9;return _0x1b4c90[_0x253fdb(0x342,'86aV')](_0x422f7e,_0x22a63a);},'CBGwS':_0x1b4c90[_0x27bed9(0x273,'99r1')],'LQAKR':_0x1b4c90[_0x27bed9(0x38c,'FJ[@')],'eLJib':_0x1b4c90[_0x27bed9(0xe5,'(h#j')],'XtQDS':_0x1b4c90[_0x27bed9(0x18f,'ihn*')],'TaUkr':function(_0x5673ea,_0x579dab){const _0x486052=_0x27bed9;return _0x1b4c90[_0x486052(0x1ba,'0X8y')](_0x5673ea,_0x579dab);},'dAUte':_0x1b4c90[_0x27bed9(0x2ef,'9ZFQ')],'OSUJb':_0x1b4c90[_0x27bed9(0x253,'0X8y')],'TSUQY':_0x1b4c90[_0x27bed9(0x444,'dO5f')],'hcwtv':_0x1b4c90[_0x27bed9(0x3a5,'EXfH')],'rleyb':function(_0x45f0b7){const _0xa19909=_0x27bed9;return _0x1b4c90[_0xa19909(0x2a5,'BR*H')](_0x45f0b7);}};if(_0x1b4c90[_0x27bed9(0x28d,'vRF8')](_0x1b4c90[_0x27bed9(0x22b,'Ae9d')],_0x1b4c90[_0x27bed9(0xc3,'ihn*')])){_0x1a3c43=_0x506fc8[_0x27bed9(0x185,'$1K4')](_0x219ed2);if(_0x1b4c90[_0x27bed9(0x25c,'u&@(')](_0x2b87f4[_0x1b4c90[_0x27bed9(0xad,'Tn(J')]],_0x1b4c90[_0x27bed9(0x2f5,'(h#j')])){_0x223348[_0x27bed9(0x39b,'Cp3L')]=![];return;}if(_0x1b4c90[_0x27bed9(0x362,'dO5f')](_0x3f8590[_0x27bed9(0x24b,'er$4')],'0')&&_0x3f110d[_0x27bed9(0x1c3,'0X8y')]){const _0x1d5c2d=_0x1b4c90[_0x27bed9(0xb6,'BR*H')][_0x27bed9(0x2dd,'###o')]('|');let _0x4f64b9=0x0;while(!![]){switch(_0x1d5c2d[_0x4f64b9++]){case'0':_0x5bc2bd[_0x27bed9(0x45e,'tjJt')]=_0x15c5d0[_0x27bed9(0x41c,'IZfv')]?.[_0x27bed9(0xbc,'rM4I')]?.[_0x27bed9(0x196,'vRF8')]||'';continue;case'1':_0x34ce8b[_0x27bed9(0x299,'vDwd')]=_0x1b4c90[_0x27bed9(0x45f,'S&zx')](_0x48450e[_0x27bed9(0xb4,'vDwd')]?.[_0x27bed9(0x31c,'Tn(J')]?.[_0x27bed9(0x322,'9a#b')],0x1);continue;case'2':_0x3abf26[_0x27bed9(0x3dd,'dO5f')]=_0x477016[_0x27bed9(0x45a,'Yg2w')];continue;case'3':_0x11f3c2[_0x27bed9(0xbe,'Yg2w')]=_0x23d05b[_0x27bed9(0x1d6,'fA3I')]?.[_0x27bed9(0x2b2,'Ik4g')]?.[_0x27bed9(0x403,'Ik4g')]||0x0;continue;case'4':_0x247485[_0x27bed9(0x3ea,'tjJt')]=_0x34d50c[_0x27bed9(0x281,'9ZFQ')]?.[_0x27bed9(0x35c,'&P&c')]?.[_0x27bed9(0xc0,'3G%o')]?.[_0x27bed9(0xb0,'%P^D')];continue;}break;}}}else $[_0x27bed9(0x359,'$1Li')](_0x5de158,async(_0x3f4bf5,_0x43a937,_0xf0e58c)=>{const _0x5866ed=_0x27bed9;try{if(_0x4ee254[_0x5866ed(0x386,'6Q@b')](_0x4ee254[_0x5866ed(0x30c,'er$4')],_0x4ee254[_0x5866ed(0x104,'(h#j')])){if(_0x3f4bf5)console[_0x5866ed(0x36e,'i4OB')](''+JSON[_0x5866ed(0x244,')Rxn')](_0x3f4bf5)),console[_0x5866ed(0x264,')Rxn')](_0x5866ed(0x351,'(h#j'));else{if(_0xf0e58c){_0xf0e58c=JSON[_0x5866ed(0x2e3,'IZfv')](_0xf0e58c);if(_0x4ee254[_0x5866ed(0x1ad,'Tn(J')](_0xf0e58c[_0x4ee254[_0x5866ed(0x28f,'9ZFQ')]],_0x4ee254[_0x5866ed(0x180,'0T9&')])){$[_0x5866ed(0x13c,'k@E0')]=![];return;}if(_0x4ee254[_0x5866ed(0x3a4,'vRF8')](_0xf0e58c[_0x5866ed(0x345,'Cp3L')],'0')&&_0xf0e58c[_0x5866ed(0x380,'$1K4')]){if(_0x4ee254[_0x5866ed(0x337,'fA3I')](_0x4ee254[_0x5866ed(0x454,'Ae9d')],_0x4ee254[_0x5866ed(0x18e,')Rxn')])){const _0x103beb=_0x4ee254[_0x5866ed(0x1fd,']]qX')][_0x5866ed(0x278,'Sk4(')]('|');let _0x1b92d1=0x0;while(!![]){switch(_0x103beb[_0x1b92d1++]){case'0':$[_0x5866ed(0x2f1,'k@E0')]=_0xf0e58c[_0x5866ed(0x21f,'6Q@b')]?.[_0x5866ed(0x31c,'Tn(J')]?.[_0x5866ed(0x234,'IZfv')]||'';continue;case'1':$[_0x5866ed(0x3b9,'Z^4U')]=_0xf0e58c[_0x5866ed(0xf2,'%P^D')]?.[_0x5866ed(0x45c,'3G%o')]?.[_0x5866ed(0x116,'6m9I')]||0x0;continue;case'2':$[_0x5866ed(0x1a5,']]qX')]=_0xf0e58c[_0x5866ed(0xa9,'NkZi')]?.[_0x5866ed(0x27d,'S&zx')]?.[_0x5866ed(0x203,'99r1')]?.[_0x5866ed(0x20d,'0QxZ')];continue;case'3':$[_0x5866ed(0x2d5,'3)m@')]=_0x4ee254[_0x5866ed(0x3f0,'IZfv')](_0xf0e58c[_0x5866ed(0x1cd,'Lv%[')]?.[_0x5866ed(0x31c,'Tn(J')]?.[_0x5866ed(0x2d4,'BR*H')],0x1);continue;case'4':$[_0x5866ed(0x3dd,'dO5f')]=$[_0x5866ed(0x2c2,'Ik4g')];continue;}break;}}else _0x4d0ccd[_0x5866ed(0x3a2,'er$4')](_0x5866ed(0x11c,'o#A^')),_0x1e7bee[_0x5866ed(0x1c0,'u&@(')](_0x3260e3);}}else _0x4ee254[_0x5866ed(0x41f,'rM4I')](_0x4ee254[_0x5866ed(0x3b5,'rM4I')],_0x4ee254[_0x5866ed(0x136,'3G%o')])?$[_0x5866ed(0x35a,'%P^D')](_0x4ee254[_0x5866ed(0xec,'Cp3L')]):_0x4ee254[_0x5866ed(0x1b5,'9acq')](_0x48ada5);}}else _0xa84237[_0x5866ed(0x191,'hxQg')](_0x4ee254[_0x5866ed(0x2ce,'BR*H')]),_0x3bab94[_0x5866ed(0x1f7,'3G%o')](_0x263281[_0x5866ed(0x1a6,'k@E0')](_0x4c116b));}catch(_0xdac896){_0x4ee254[_0x5866ed(0x130,'0X8y')](_0x4ee254[_0x5866ed(0xf5,'er$4')],_0x4ee254[_0x5866ed(0x377,'0T9&')])?$[_0x5866ed(0x28c,'9ZFQ')](_0xdac896,_0x43a937):(_0x1d8a59[_0x5866ed(0x2e2,'vDwd')](''+_0x3ba0f4[_0x5866ed(0x284,'Ik4g')](_0x270980)),_0x4d2113[_0x5866ed(0x117,'dO5f')](_0x5866ed(0x39f,'tjJt')));}finally{_0x4ee254[_0x5866ed(0x1cc,')Rxn')](_0x34d5c2);}});});}async function getuserinfo_6dy_old(){const _0x79f114=_0x2079dc,_0x4e7bce={'TCHJj':_0x79f114(0x23f,'vDwd'),'edqDV':function(_0x2ba206){return _0x2ba206();},'ZfmEv':function(_0x5e207b,_0xcb7f17){return _0x5e207b!==_0xcb7f17;},'gPUJt':_0x79f114(0x44e,'Lv%['),'ypGse':function(_0x5d7ae1,_0x14dc4d){return _0x5d7ae1===_0x14dc4d;},'ugQnF':_0x79f114(0x2c3,'0T9&'),'oznhd':_0x79f114(0x12d,'99r1'),'eHCfl':_0x79f114(0x2a3,'IZfv'),'tOpUI':function(_0x51d9e8,_0x570602){return _0x51d9e8!==_0x570602;},'Qmshc':_0x79f114(0x18b,'vRF8'),'MtVUJ':_0x79f114(0x280,'FJ[@'),'nexuy':_0x79f114(0x2af,'Ik4g'),'EfgPU':_0x79f114(0x469,'Yg2w'),'vfWOm':_0x79f114(0x24c,'u&@('),'JPqiu':function(_0x51e1e0,_0x3b42f0){return _0x51e1e0==_0x3b42f0;},'ioxMX':_0x79f114(0x1f3,'vDwd'),'FNVmS':_0x79f114(0x20e,'Tn(J'),'XLOQf':_0x79f114(0xb5,'0T9&'),'HOJQQ':function(_0x42f44a){return _0x42f44a();},'EjVBi':function(_0x2410fa,_0x4323f1){return _0x2410fa!==_0x4323f1;},'GZsQQ':_0x79f114(0x3db,'ESGq'),'BwOeg':_0x79f114(0x321,'$1Li'),'mNHru':_0x79f114(0x277,'rM4I'),'MUvHb':_0x79f114(0x1fe,'Z^4U'),'zsIci':_0x79f114(0x1fb,'S&zx'),'cHXzo':_0x79f114(0x470,'$1Li'),'jCiFq':_0x79f114(0x424,'$1K4'),'Vjueq':_0x79f114(0x15b,'i4OB'),'LcekW':_0x79f114(0x457,'fA3I'),'RCYVJ':_0x79f114(0x3cd,'Z^4U'),'hRcvx':_0x79f114(0xe4,'k@E0'),'ofkHV':_0x79f114(0x132,'i4OB'),'kMTCF':_0x79f114(0x2e7,'u&@('),'YpotI':_0x79f114(0x141,'fA3I'),'eLRNL':_0x79f114(0x42b,'vRF8'),'cZkOb':_0x79f114(0x2c0,'vRF8')};let _0x2eae79={'orgFlag':_0x4e7bce[_0x79f114(0x438,'0T9&')],'callSource':_0x4e7bce[_0x79f114(0x23d,'6m9I')],'channel':0x1,'isHomewhite':0x1,'bizModelCode':'6','externalLoginType':'1','bizModeClientType':_0x4e7bce[_0x79f114(0x392,'IZfv')],'appId':_0x4e7bce[_0x79f114(0x10b,'$1Li')],'token':_0x4e7bce[_0x79f114(0x206,'Cp3L')],'tenantCode':_0x4e7bce[_0x79f114(0x153,'Yg2w')],'uuid':'','client':_0x4e7bce[_0x79f114(0x223,'NkZi')],'sourceType':_0x4e7bce[_0x79f114(0x47a,'Sk4(')]},_0x264f28={'appId':_0x4e7bce[_0x79f114(0x2a7,'tjJt')],'functionId':_0x4e7bce[_0x79f114(0x330,'ihn*')],'body':_0x2eae79,'appid':_0x4e7bce[_0x79f114(0x177,'3G%o')],'client':_0x4e7bce[_0x79f114(0x125,'3)m@')],'user':$[_0x79f114(0x137,'ESGq')],'code':0x0,'ua':$['UA']};_0x2eae79=await _0x4160ce[_0x79f114(0x3ae,'9a#b')](_0x264f28);let _0x21269c={'url':_0x79f114(0x2d7,'&P&c')+_0x2eae79+_0x79f114(0x26f,'9a#b'),'headers':{'Accept':_0x4e7bce[_0x79f114(0x2c1,']]qX')],'accept-encoding':_0x4e7bce[_0x79f114(0x2b3,'rM4I')],'content-type':_0x4e7bce[_0x79f114(0x3d2,'k@E0')],'referer':_0x4e7bce[_0x79f114(0x3c7,'MZJ)')],'Cookie':cookie,'User-Agent':$['UA']}};return new Promise(_0x464124=>{const _0x3d152e=_0x79f114,_0xa75a9c={'LGcYa':_0x4e7bce[_0x3d152e(0x317,'BR*H')],'Nxrun':function(_0x4b67c8){const _0x4db026=_0x3d152e;return _0x4e7bce[_0x4db026(0x3bd,'S&zx')](_0x4b67c8);},'ksIol':function(_0xecea8,_0x38f17b){const _0x41286a=_0x3d152e;return _0x4e7bce[_0x41286a(0x1bf,'Lv%[')](_0xecea8,_0x38f17b);},'cMHzW':_0x4e7bce[_0x3d152e(0x417,'0X8y')],'QqNkG':function(_0x5d0bc5,_0xfd4584){const _0x210245=_0x3d152e;return _0x4e7bce[_0x210245(0x3a9,'99r1')](_0x5d0bc5,_0xfd4584);},'WEyMf':_0x4e7bce[_0x3d152e(0x37b,'NkZi')],'npzcZ':_0x4e7bce[_0x3d152e(0x355,'vRF8')],'xNlFi':_0x4e7bce[_0x3d152e(0x443,'0QxZ')],'iejOA':function(_0x4bb610,_0x11e9cd){const _0x153cf2=_0x3d152e;return _0x4e7bce[_0x153cf2(0x358,'S&zx')](_0x4bb610,_0x11e9cd);},'tWtJm':_0x4e7bce[_0x3d152e(0x347,'6Q@b')],'yqiQN':_0x4e7bce[_0x3d152e(0x45d,'dO5f')],'vejXz':_0x4e7bce[_0x3d152e(0x1d8,'qz[&')],'bLTEk':_0x4e7bce[_0x3d152e(0x14f,'(h#j')],'cufmw':_0x4e7bce[_0x3d152e(0x1b4,']]qX')],'Pkstg':function(_0x234cda,_0x16a314){const _0x57b3d5=_0x3d152e;return _0x4e7bce[_0x57b3d5(0x121,'3G%o')](_0x234cda,_0x16a314);},'bjOlm':function(_0x4b85c8,_0x35458f){const _0x52d795=_0x3d152e;return _0x4e7bce[_0x52d795(0xb1,'Lv%[')](_0x4b85c8,_0x35458f);},'DgWVh':_0x4e7bce[_0x3d152e(0x3bc,'0X8y')],'pgOGH':_0x4e7bce[_0x3d152e(0x3ee,'dO5f')],'WFXze':_0x4e7bce[_0x3d152e(0x398,'S&zx')],'pvEpM':function(_0x47c417){const _0x18bda1=_0x3d152e;return _0x4e7bce[_0x18bda1(0x379,'9a#b')](_0x47c417);}};_0x4e7bce[_0x3d152e(0x3c9,']]qX')](_0x4e7bce[_0x3d152e(0x21b,'Ik4g')],_0x4e7bce[_0x3d152e(0x283,'ihn*')])?_0x3be13e[_0x3d152e(0x1a7,'$1Li')](_0x4466e3,_0x10ef1e):$[_0x3d152e(0x2a1,'EXfH')](_0x21269c,async(_0x4307d8,_0x3ea687,_0x36ab33)=>{const _0x424c8e=_0x3d152e,_0x56f399={'quQDG':function(_0x48b6bc){const _0x4929a3=_0x4f5b;return _0xa75a9c[_0x4929a3(0x1d9,'ihn*')](_0x48b6bc);}};try{if(_0x4307d8)console[_0x424c8e(0x2e2,'vDwd')](''+JSON[_0x424c8e(0x1c1,'$1K4')](_0x4307d8)),console[_0x424c8e(0x1b0,'Yg2w')](_0x424c8e(0x101,'&P&c'));else{if(_0xa75a9c[_0x424c8e(0x1f5,'ESGq')](_0xa75a9c[_0x424c8e(0x357,'Tn(J')],_0xa75a9c[_0x424c8e(0x325,'$1Li')]))_0x1ecbe5[_0x424c8e(0x120,'0QxZ')](_0x18c01f);else{if(_0x36ab33){if(_0xa75a9c[_0x424c8e(0x1a9,'MZJ)')](_0xa75a9c[_0x424c8e(0x43d,'99r1')],_0xa75a9c[_0x424c8e(0x3e1,'Tn(J')])){_0x36ab33=JSON[_0x424c8e(0x2e3,'IZfv')](_0x36ab33);if(_0xa75a9c[_0x424c8e(0x16f,'9acq')](_0x36ab33[_0xa75a9c[_0x424c8e(0x1b8,'0T9&')]],_0xa75a9c[_0x424c8e(0x24a,')Rxn')])){if(_0xa75a9c[_0x424c8e(0x418,'vRF8')](_0xa75a9c[_0x424c8e(0x1df,'FJ[@')],_0xa75a9c[_0x424c8e(0xb3,'6Q@b')])){$[_0x424c8e(0x372,'MZJ)')]=![];return;}else!_0x13ac84&&(_0x3df64c[_0x424c8e(0x191,'hxQg')](_0xa75a9c[_0x424c8e(0x406,'EXfH')]),_0x2edd83[_0x424c8e(0x35f,'99r1')](_0x144ec2[_0x424c8e(0x42c,'er$4')](_0x215d91))),_0x11e8fe=!![];}if(_0xa75a9c[_0x424c8e(0x3f6,'$1Li')](_0x36ab33[_0x424c8e(0x2aa,'NkZi')],'0')&&_0x36ab33[_0x424c8e(0xb4,'vDwd')]){if(_0xa75a9c[_0x424c8e(0x1ef,')Rxn')](_0xa75a9c[_0x424c8e(0x29c,'###o')],_0xa75a9c[_0x424c8e(0x2fd,'MZJ)')]))_0xa75a9c[_0x424c8e(0x25f,'IZfv')](_0x117d3a);else{const _0x447f95=_0xa75a9c[_0x424c8e(0x2b1,'Sk4(')][_0x424c8e(0x32a,')Rxn')]('|');let _0x6d20bd=0x0;while(!![]){switch(_0x447f95[_0x6d20bd++]){case'0':$[_0x424c8e(0x168,'rM4I')]=_0x36ab33[_0x424c8e(0x343,'hxQg')]?.[_0x424c8e(0x11d,'hxQg')]?.[_0x424c8e(0x28b,'9acq')]||'';continue;case'1':$[_0x424c8e(0x31f,'99r1')]=_0xa75a9c[_0x424c8e(0x43b,'0X8y')](_0x36ab33[_0x424c8e(0x477,'6m9I')]?.[_0x424c8e(0x1da,'fA3I')]?.[_0x424c8e(0x1cf,'Cp3L')],0x1);continue;case'2':$[_0x424c8e(0x46e,'dO5f')]=_0x36ab33[_0x424c8e(0x281,'9ZFQ')]?.[_0x424c8e(0x306,'6m9I')]?.[_0x424c8e(0xee,'Z^4U')]||0x0;continue;case'3':$[_0x424c8e(0x40e,'ESGq')]=_0x36ab33[_0x424c8e(0x432,'&P&c')]?.[_0x424c8e(0x320,'6m9I')]?.[_0x424c8e(0x3e3,'###o')]?.[_0x424c8e(0x399,'6Q@b')];continue;case'4':$[_0x424c8e(0x436,'9acq')]=_0x36ab33[_0x424c8e(0x2dc,'FJ[@')]?.[_0x424c8e(0x31e,'%P^D')]?.[_0x424c8e(0x2b6,'Z^4U')]?.[_0x424c8e(0x40c,'EXfH')]||$[_0x424c8e(0x44b,'rM4I')];continue;}break;}}}}else _0x56f399[_0x424c8e(0xf4,'%P^D')](_0x584c51);}else _0xa75a9c[_0x424c8e(0x296,'Ik4g')](_0xa75a9c[_0x424c8e(0x365,'Yg2w')],_0xa75a9c[_0x424c8e(0x331,'EXfH')])?_0x5d7a26[_0x424c8e(0x1a1,'k@E0')](_0x4f815b,_0x20ac80):$[_0x424c8e(0x12a,'NkZi')](_0xa75a9c[_0x424c8e(0x3b3,'99r1')]);}}}catch(_0x3ab185){$[_0x424c8e(0x235,'Ae9d')](_0x3ab185,_0x3ea687);}finally{_0xa75a9c[_0x424c8e(0xf8,'hxQg')](_0x464124);}});});}async function getuserinfo_6dy(){const _0x340fed=_0x2079dc,_0x187af5={'ETGHR':function(_0x47b88b){return _0x47b88b();},'PNjVY':function(_0x7d2e83,_0x4b6cc3){return _0x7d2e83===_0x4b6cc3;},'teNyl':_0x340fed(0x2d3,'Cp3L'),'KUiiB':_0x340fed(0x371,'3)m@'),'ESkBK':function(_0x24feee,_0x1eccc2){return _0x24feee==_0x1eccc2;},'JHJua':function(_0xab2c44,_0x371bdb){return _0xab2c44!==_0x371bdb;},'yoDDi':_0x340fed(0x12e,'Ae9d'),'pAEaf':function(_0x1f670e,_0x450022){return _0x1f670e!==_0x450022;},'URSWS':_0x340fed(0x32d,'Ae9d'),'OatvT':function(_0x4871ba){return _0x4871ba();},'lWijx':_0x340fed(0x315,'i4OB'),'hGAWl':_0x340fed(0x119,'###o'),'hnusg':_0x340fed(0xdc,'Tn(J'),'aUinL':_0x340fed(0x2ad,'MZJ)'),'jdxkE':_0x340fed(0x17a,'9ZFQ'),'SbNeg':_0x340fed(0x274,'Tn(J'),'vSQKu':_0x340fed(0x2a8,'9acq')};let _0x496d1f={'qids':_0x187af5[_0x340fed(0x47b,'k@E0')],'checkLevel':0x1,'signType':0x3eb,'contentType':_0x187af5[_0x340fed(0x1f6,'FJ[@')],'skuSourceId':0x927c8},_0x181cbe={'appId':_0x187af5[_0x340fed(0x10a,'6m9I')],'functionId':_0x187af5[_0x340fed(0x3d8,'###o')],'body':_0x496d1f,'appid':_0x187af5[_0x340fed(0x46d,'$1Li')],'user':$[_0x340fed(0x29e,'vDwd')],'code':0x1,'ua':$['UA']};_0x496d1f=await _0x4160ce[_0x340fed(0x1c7,'vDwd')](_0x181cbe);let _0x3a8cfd={'url':_0x340fed(0x335,'Z^4U'),'body':_0x496d1f,'headers':{'User-Agent':$['UA'],'Cookie':cookie,'Origin':_0x187af5[_0x340fed(0x27f,'$1Li')],'Referer':_0x187af5[_0x340fed(0x14e,'fA3I')]}};return new Promise(async _0x3bc9b8=>{const _0x5cd383=_0x340fed,_0x3a0ee7={'pJeme':function(_0x2b455f){const _0x33df9e=_0x4f5b;return _0x187af5[_0x33df9e(0x407,'er$4')](_0x2b455f);}};$[_0x5cd383(0x461,'Cp3L')](_0x3a8cfd,async(_0x4089f0,_0x1c8e3d,_0x4209e4)=>{const _0x42440b=_0x5cd383,_0x106c7c={'KjTPa':function(_0x2979f9){const _0x3e3eb1=_0x4f5b;return _0x187af5[_0x3e3eb1(0x2cc,'6Q@b')](_0x2979f9);}};if(_0x187af5[_0x42440b(0x1d5,'vDwd')](_0x187af5[_0x42440b(0x2d9,'Yg2w')],_0x187af5[_0x42440b(0x103,'NkZi')]))_0x3a0ee7[_0x42440b(0x390,'dO5f')](_0x4ed63d);else try{if(_0x4089f0)console[_0x42440b(0x191,'hxQg')](''+JSON[_0x42440b(0x447,'Sk4(')](_0x4089f0)),console[_0x42440b(0x2a6,'Ae9d')](_0x42440b(0x106,'99r1'));else{_0x4209e4=JSON[_0x42440b(0xa7,'MZJ)')](_0x4209e4);if(_0x187af5[_0x42440b(0x420,'rM4I')](_0x4209e4[_0x42440b(0x423,'6Q@b')],0x1a1b98))$[_0x42440b(0xfa,'dO5f')]=_0x4209e4['rs'][_0x42440b(0x339,'ihn*')][_0x42440b(0x2ea,'tjJt')]?!![]:![],$[_0x42440b(0x303,'$1Li')]=_0x4209e4['rs']?.[_0x42440b(0x290,'9acq')]?.[_0x42440b(0x389,'(h#j')],$[_0x42440b(0x29b,']]qX')]=_0x4209e4['rs']?.[_0x42440b(0x333,'$1Li')]?.[_0x42440b(0x1b9,'Z^4U')]||'';else{}}}catch(_0x2135fd){_0x187af5[_0x42440b(0x225,'Sk4(')](_0x187af5[_0x42440b(0x381,'9acq')],_0x187af5[_0x42440b(0x256,'ESGq')])?(_0x26554d[_0x42440b(0xaa,'&P&c')]=_0x4fd1c1[_0x42440b(0x39a,'6Q@b')](/"score":(\d+)/)?_0x38da93[_0x42440b(0x27a,'MZJ)')](/"score":(\d+)/)[0x1]:0x0,_0x212055[_0x42440b(0x304,'hxQg')]=_0x2eca55[_0x42440b(0x144,'9acq')](/"currentBeanNum":(\d+)/)?_0x2adcf7[_0x42440b(0x44d,'6m9I')](/"currentBeanNum":(\d+)/)[0x1]:0x0,_0x3f3ac5[_0x42440b(0x166,'Lv%[')]=_0x52e8c9[_0x42440b(0x435,'ESGq')](/"showName":"(.*?)"/)?_0x12758e[_0x42440b(0x1f2,'Ae9d')](/"showName":"(.*?)"/)[0x1]:_0x54cb35[_0x42440b(0x33f,'qz[&')]):$[_0x42440b(0x3e9,'3G%o')](_0x2135fd,_0x1c8e3d);}finally{_0x187af5[_0x42440b(0x37d,'BR*H')](_0x187af5[_0x42440b(0x336,'$1K4')],_0x187af5[_0x42440b(0x262,'9a#b')])?_0x106c7c[_0x42440b(0x44f,'Ae9d')](_0x568111):_0x187af5[_0x42440b(0xba,'Yg2w')](_0x3bc9b8);}});});}async function mybean(){const _0xb5990=_0x2079dc,_0x4cc8aa={'VWGIb':function(_0xc3dc1b,_0x272881){return _0xc3dc1b==_0x272881;},'mayPY':function(_0x4b97c7,_0x1ad862){return _0x4b97c7(_0x1ad862);},'hlBcc':function(_0x12244b,_0x566af1){return _0x12244b===_0x566af1;},'htVNb':_0xb5990(0x243,'Yg2w'),'qqmrD':_0xb5990(0xd0,'3G%o'),'LQMCM':function(_0x13045c,_0x38038c){return _0x13045c!==_0x38038c;},'dztMp':_0xb5990(0x134,'Lv%['),'hUvZc':_0xb5990(0x38a,'99r1'),'RSEAu':function(_0x1fc6f0){return _0x1fc6f0();},'laBoA':_0xb5990(0x26d,'0X8y'),'FXVpS':_0xb5990(0x156,'Lv%['),'MouFm':_0xb5990(0x409,'Yg2w'),'htkcC':_0xb5990(0x32e,'Z^4U'),'uzDrh':_0xb5990(0x145,')Rxn')};let _0x51e66b={'needDetails':!![],'needResourceItems':!![]},_0x32e8ce={'appId':_0x4cc8aa[_0xb5990(0x25b,'Sk4(')],'functionId':_0x4cc8aa[_0xb5990(0x219,'er$4')],'body':_0x51e66b,'appid':_0x4cc8aa[_0xb5990(0x2b8,'99r1')],'user':$[_0xb5990(0x147,'ihn*')],'code':0x1,'ua':$['UA']};_0x51e66b=await _0x4160ce[_0xb5990(0x3c8,')Rxn')](_0x32e8ce);let _0x4085fa={'url':_0xb5990(0x1ed,'FJ[@'),'body':_0x51e66b,'headers':{'User-Agent':$['UA'],'Cookie':cookie,'Origin':_0x4cc8aa[_0xb5990(0x3d9,'ihn*')],'Referer':_0x4cc8aa[_0xb5990(0x246,'9acq')]}};return new Promise(async _0x17543b=>{const _0x5441ac=_0xb5990,_0x1f77b6={'fIvXZ':function(_0x3ce072,_0x3c79cb){const _0xb357e=_0x4f5b;return _0x4cc8aa[_0xb357e(0xbd,'MZJ)')](_0x3ce072,_0x3c79cb);},'zVnvE':function(_0x3984c5,_0x498c6f){const _0x5bd0a8=_0x4f5b;return _0x4cc8aa[_0x5bd0a8(0x175,'ESGq')](_0x3984c5,_0x498c6f);},'whrXE':function(_0x6528b7,_0x5014e9){const _0x11fcec=_0x4f5b;return _0x4cc8aa[_0x11fcec(0x1d0,'9a#b')](_0x6528b7,_0x5014e9);},'Rroyt':_0x4cc8aa[_0x5441ac(0x368,'Z^4U')],'Cewpx':_0x4cc8aa[_0x5441ac(0xac,'Yg2w')],'BiUHd':function(_0x5b5409,_0x23531e){const _0x193cef=_0x5441ac;return _0x4cc8aa[_0x193cef(0x2f3,'er$4')](_0x5b5409,_0x23531e);},'XyHZp':_0x4cc8aa[_0x5441ac(0xd4,'Tn(J')],'cNzZR':_0x4cc8aa[_0x5441ac(0x27b,'FJ[@')],'sShzp':function(_0x39e5c1){const _0x20442c=_0x5441ac;return _0x4cc8aa[_0x20442c(0x11a,'86aV')](_0x39e5c1);}};$[_0x5441ac(0xa8,'3G%o')](_0x4085fa,async(_0x106d0f,_0x1812f4,_0x2182f5)=>{const _0x5b3be3=_0x5441ac,_0x44dbdd={'qnunG':function(_0x3744d1,_0x124c01){const _0x4aba84=_0x4f5b;return _0x1f77b6[_0x4aba84(0x2de,'vRF8')](_0x3744d1,_0x124c01);}};try{if(_0x106d0f)_0x1f77b6[_0x5b3be3(0x453,'er$4')](_0x1f77b6[_0x5b3be3(0x31d,'Z^4U')],_0x1f77b6[_0x5b3be3(0xe3,'i4OB')])?_0x44dbdd[_0x5b3be3(0x169,'ESGq')](_0x48aa1e,_0x1e4ca1):(console[_0x5b3be3(0x173,'6m9I')](''+JSON[_0x5b3be3(0x244,')Rxn')](_0x106d0f)),console[_0x5b3be3(0x397,'9ZFQ')](_0x5b3be3(0x2b7,'ihn*')));else{_0x2182f5=JSON[_0x5b3be3(0x2da,'er$4')](_0x2182f5);if(_0x1f77b6[_0x5b3be3(0x3bf,'Cp3L')](_0x2182f5[_0x5b3be3(0x46f,'S&zx')],0x0))$[_0x5b3be3(0xff,'vDwd')]=_0x2182f5[_0x5b3be3(0x294,'u&@(')]?.[_0x5b3be3(0x295,'er$4')]||0x0;else{}}}catch(_0x3e5dc5){if(_0x1f77b6[_0x5b3be3(0x3ad,'BR*H')](_0x1f77b6[_0x5b3be3(0x3a8,'S&zx')],_0x1f77b6[_0x5b3be3(0x3f4,'Ik4g')]))$[_0x5b3be3(0x338,'o#A^')](_0x3e5dc5,_0x1812f4);else{const _0x167e58=_0x2621f6[_0x5b3be3(0x161,'tjJt')](_0x399b0b);_0x1f77b6[_0x5b3be3(0x24d,'%P^D')](_0x167e58[_0x5b3be3(0x3c5,')Rxn')],0x3e8)&&(_0xe7d24[_0x5b3be3(0x287,'Cp3L')]=_0x167e58['rs'][_0x5b3be3(0x44a,'9a#b')][_0x5b3be3(0x1e4,'dO5f')]);}}finally{_0x1f77b6[_0x5b3be3(0x30d,'qz[&')](_0x17543b);}});});}async function _0x102e77(){const _0x5867dd=_0x2079dc,_0x1f318f={'CELKf':function(_0x2def49){return _0x2def49();},'SLoBq':function(_0x2d1fbe,_0xc846d2){return _0x2d1fbe!==_0xc846d2;},'NtGnr':_0x5867dd(0x1aa,'0T9&'),'enkCE':_0x5867dd(0x151,'6m9I'),'cCMBz':function(_0x2eda0c,_0xc4da37){return _0x2eda0c===_0xc4da37;},'lHHFx':_0x5867dd(0x260,'dO5f'),'EwfJX':function(_0x46fed0,_0x6b3910){return _0x46fed0===_0x6b3910;},'CVigr':_0x5867dd(0x1ca,'99r1'),'VphYC':function(_0x56d2e8){return _0x56d2e8();},'apniN':_0x5867dd(0x38d,'ESGq'),'tWqwt':_0x5867dd(0x326,']]qX'),'xpFUq':_0x5867dd(0x450,'6m9I'),'rsBAj':_0x5867dd(0x20c,'BR*H')};let _0x25a631={'url':_0x5867dd(0x3f9,'Cp3L'),'body':_0x5867dd(0x47c,'9a#b')+Date[_0x5867dd(0x19f,'$1K4')]()+_0x5867dd(0x3fc,')Rxn'),'headers':{'Cookie':cookie,'User-Agent':$['UA'],'Origin':_0x1f318f[_0x5867dd(0xfc,'Sk4(')],'Referer':_0x1f318f[_0x5867dd(0x140,'3)m@')]}};return new Promise(_0x260582=>{const _0x2bac92=_0x5867dd;_0x1f318f[_0x2bac92(0x1ee,'i4OB')](_0x1f318f[_0x2bac92(0x174,'99r1')],_0x1f318f[_0x2bac92(0x1f1,'Tn(J')])?_0x4dd953[_0x2bac92(0x42a,'vDwd')]=_0x279fc4[_0x2bac92(0x294,'u&@(')][_0x2bac92(0x1ab,'%P^D')]||0x0:$[_0x2bac92(0xe2,'rM4I')](_0x25a631,async(_0x7e3e61,_0x3361da,_0x5588b1)=>{const _0x2b451e=_0x2bac92,_0x5a0060={'ddTif':function(_0x87fe35){const _0x41288c=_0x4f5b;return _0x1f318f[_0x41288c(0x22a,'S&zx')](_0x87fe35);}};try{_0x7e3e61?_0x1f318f[_0x2b451e(0x30e,'hxQg')](_0x1f318f[_0x2b451e(0x445,'6Q@b')],_0x1f318f[_0x2b451e(0x129,'fA3I')])?(console[_0x2b451e(0xcf,'0T9&')](''+JSON[_0x2b451e(0x2ab,'dO5f')](_0x7e3e61)),console[_0x2b451e(0x3a2,'er$4')](_0x2b451e(0x214,'9ZFQ'))):_0x5a0060[_0x2b451e(0x43e,'IZfv')](_0x2ceda0):($[_0x2b451e(0x395,'Sk4(')]=_0x5588b1[_0x2b451e(0x422,'$1K4')](/"score":(\d+)/)?_0x5588b1[_0x2b451e(0x205,'S&zx')](/"score":(\d+)/)[0x1]:0x0,$[_0x2b451e(0x122,'Ik4g')]=_0x5588b1[_0x2b451e(0x373,'FJ[@')](/"currentBeanNum":(\d+)/)?_0x5588b1[_0x2b451e(0x40d,'Lv%[')](/"currentBeanNum":(\d+)/)[0x1]:0x0,$[_0x2b451e(0x2ba,'%P^D')]=_0x5588b1[_0x2b451e(0x2fb,'0X8y')](/"showName":"(.*?)"/)?_0x5588b1[_0x2b451e(0x393,']]qX')](/"showName":"(.*?)"/)[0x1]:$[_0x2b451e(0x1ec,'3)m@')]);}catch(_0x10c229){_0x1f318f[_0x2b451e(0xdb,'%P^D')](_0x1f318f[_0x2b451e(0x464,'u&@(')],_0x1f318f[_0x2b451e(0x1e0,'NkZi')])?$[_0x2b451e(0x1e1,'i4OB')](_0x10c229,_0x3361da):_0x1b5341[_0x2b451e(0xe7,'9acq')](_0x57f145,_0x4f568f);}finally{_0x1f318f[_0x2b451e(0xc4,'Tn(J')](_0x1f318f[_0x2b451e(0x472,'3G%o')],_0x1f318f[_0x2b451e(0x479,'i4OB')])?_0x1f318f[_0x2b451e(0x3d4,'$1K4')](_0x260582):(_0x2d3393[_0x2b451e(0x264,')Rxn')](''+_0x2f2910[_0x2b451e(0x456,']]qX')](_0x34a2e6)),_0x5037c5[_0x2b451e(0x1e7,'3)m@')](_0x2b451e(0x23a,'dO5f')));}});});}async function queryScores(){const _0x7529b1=_0x2079dc,_0x3f4501={'llVMB':_0x7529b1(0x44c,'$1Li'),'BNKiS':function(_0x419277,_0x97c77a){return _0x419277!==_0x97c77a;},'tSSDO':_0x7529b1(0x421,'0X8y'),'ikqtR':_0x7529b1(0x3e2,'6Q@b'),'WtHri':function(_0x1f00bd,_0x238f7c){return _0x1f00bd==_0x238f7c;},'lXGfg':function(_0xea29d3){return _0xea29d3();},'mYDbv':function(_0x2d4f3e,_0x3f3416){return _0x2d4f3e!==_0x3f3416;},'LNjPU':_0x7529b1(0x15a,'ESGq'),'xMYeD':_0x7529b1(0x426,'$1K4'),'fxRJX':_0x7529b1(0x17f,'9a#b'),'vkMvA':_0x7529b1(0x184,'Sk4('),'dVmeS':_0x7529b1(0x428,'k@E0'),'RpSdZ':_0x7529b1(0x14c,'86aV')};let _0x3ebe12='',_0x371ca6={'appId':_0x3f4501[_0x7529b1(0x11e,'ESGq')],'functionId':_0x3f4501[_0x7529b1(0x2cb,'9acq')],'body':{},'appid':_0x3f4501[_0x7529b1(0x3ef,'6m9I')],'user':$[_0x7529b1(0x43f,'tjJt')],'code':0x0,'ua':$['UA']};body=await _0x4160ce[_0x7529b1(0x209,'i4OB')](_0x371ca6);let _0x964e0b={'url':_0x7529b1(0x252,'(h#j')+body+_0x7529b1(0x37c,'u&@('),'headers':{'Cookie':cookie,'User-Agent':$['UA'],'Referer':_0x3f4501[_0x7529b1(0x3ba,'k@E0')]}};return new Promise(_0x42a0b5=>{const _0xf33b3a=_0x7529b1;_0x3f4501[_0xf33b3a(0x367,'qz[&')](_0x3f4501[_0xf33b3a(0x3b2,'0T9&')],_0x3f4501[_0xf33b3a(0x199,'0QxZ')])?$[_0xf33b3a(0xd7,'0T9&')](_0x964e0b,async(_0x6bfa83,_0x3fc1be,_0x584d19)=>{const _0x5b093e=_0xf33b3a,_0x9579a8={'xobyc':_0x3f4501[_0x5b093e(0x3a1,'9ZFQ')]};try{if(_0x3f4501[_0x5b093e(0x350,'Yg2w')](_0x3f4501[_0x5b093e(0x170,'BR*H')],_0x3f4501[_0x5b093e(0x100,'3)m@')])){const _0x4df5d2=JSON[_0x5b093e(0xd9,'%P^D')](_0x584d19);_0x3f4501[_0x5b093e(0x26a,'k@E0')](_0x4df5d2[_0x5b093e(0x459,'er$4')],0x3e8)&&($[_0x5b093e(0x1db,'6Q@b')]=_0x4df5d2['rs'][_0x5b093e(0x105,'Z^4U')][_0x5b093e(0xbf,'6Q@b')]);}else _0x3dcd3e[_0x5b093e(0x397,'9ZFQ')](_0x9579a8[_0x5b093e(0x193,'vDwd')]);}catch(_0x50f69e){$[_0x5b093e(0x3d7,'NkZi')](_0x50f69e,_0x3fc1be);}finally{_0x3f4501[_0x5b093e(0x124,'0QxZ')](_0x42a0b5);}}):_0x39e8b2[_0xf33b3a(0x122,'Ik4g')]=_0x372638[_0xf33b3a(0x45b,'er$4')]?.[_0xf33b3a(0x26c,'6Q@b')]||0x0;});}async function fruitinfo(){const _0x2e8b14=_0x2079dc,_0x265462={'WfWBH':function(_0x36b242,_0x2bf79c){return _0x36b242(_0x2bf79c);},'VEUdl':function(_0xe65d69,_0x39e0dc){return _0xe65d69===_0x39e0dc;},'AQMmF':_0x2e8b14(0xf1,'MZJ)'),'qkZIQ':_0x2e8b14(0x455,'99r1'),'iTfTd':_0x2e8b14(0x2ff,'NkZi'),'HSKoE':_0x2e8b14(0x2b9,'0QxZ'),'QnKiz':function(_0x440c67,_0x552241){return _0x440c67===_0x552241;},'GcCFf':_0x2e8b14(0x236,'0QxZ'),'nKKov':_0x2e8b14(0x21a,'3G%o'),'elKlC':function(_0x59c280,_0xfa837c){return _0x59c280!==_0xfa837c;},'Uncdc':_0x2e8b14(0xcb,'Z^4U'),'zkecS':_0x2e8b14(0x3da,'FJ[@'),'onukh':function(_0x305ded){return _0x305ded();},'DuFOb':_0x2e8b14(0x16e,'rM4I'),'Kakpn':_0x2e8b14(0xc5,'3G%o'),'WgdJv':_0x2e8b14(0x1c4,'Sk4('),'TUIOi':_0x2e8b14(0x2f4,'$1K4'),'XMWxt':_0x2e8b14(0x20f,'MZJ)'),'JmMuN':_0x2e8b14(0x22c,'6m9I'),'siSrp':_0x2e8b14(0x28e,'0T9&'),'JOoqj':_0x2e8b14(0x419,'$1Li')};return new Promise(_0x546b9a=>{const _0x32ed10=_0x2e8b14,_0x398f68={'fkPkX':function(_0xa2f7d7,_0x529908){const _0x5444d9=_0x4f5b;return _0x265462[_0x5444d9(0x3c4,'Ae9d')](_0xa2f7d7,_0x529908);},'Banzd':function(_0x4b4f86,_0x1e4ec7){const _0x2464bd=_0x4f5b;return _0x265462[_0x2464bd(0x2c8,')Rxn')](_0x4b4f86,_0x1e4ec7);},'RYtuL':_0x265462[_0x32ed10(0x1c8,'99r1')],'zQxJl':function(_0x4a9128,_0x1e9c63){const _0x46cf2f=_0x32ed10;return _0x265462[_0x46cf2f(0x227,'Z^4U')](_0x4a9128,_0x1e9c63);},'jhWWd':_0x265462[_0x32ed10(0x31b,'i4OB')],'ibwak':_0x265462[_0x32ed10(0x2a2,'99r1')],'lGMMv':_0x265462[_0x32ed10(0x36d,'fA3I')],'Bmout':function(_0x2ba43f,_0x286d70){const _0x58f5b5=_0x32ed10;return _0x265462[_0x58f5b5(0x324,'FJ[@')](_0x2ba43f,_0x286d70);},'OuSPU':function(_0x1f8bfe,_0x19c631){const _0x585a71=_0x32ed10;return _0x265462[_0x585a71(0x2bc,'MZJ)')](_0x1f8bfe,_0x19c631);},'TYEWi':_0x265462[_0x32ed10(0x14a,'Z^4U')],'VDjQd':_0x265462[_0x32ed10(0x2d0,'3)m@')],'rbrAk':function(_0x58d6a1,_0x5de30d){const _0x3c4ad7=_0x32ed10;return _0x265462[_0x3c4ad7(0x239,'o#A^')](_0x58d6a1,_0x5de30d);},'Oyuxa':_0x265462[_0x32ed10(0x41b,'&P&c')],'vnlSf':_0x265462[_0x32ed10(0xf0,'S&zx')],'YVBCL':function(_0xaf4594){const _0x445f80=_0x32ed10;return _0x265462[_0x445f80(0x375,'fA3I')](_0xaf4594);}},_0x91ef34={'url':_0x32ed10(0x142,'hxQg'),'body':_0x32ed10(0x216,'3G%o')+_0x265462[_0x32ed10(0x258,'IZfv')](encodeURIComponent,JSON[_0x32ed10(0x356,'3G%o')]({'version':0x1c,'channel':0x1,'babelChannel':_0x265462[_0x32ed10(0x431,'u&@(')],'lat':'0','lng':'0'}))+_0x32ed10(0x466,'ihn*'),'headers':{'accept':_0x265462[_0x32ed10(0x269,'&P&c')],'accept-encoding':_0x265462[_0x32ed10(0x20b,'0T9&')],'accept-language':_0x265462[_0x32ed10(0x2bd,')Rxn')],'cookie':cookie,'origin':_0x265462[_0x32ed10(0x39c,'ihn*')],'referer':_0x265462[_0x32ed10(0x3ac,'Sk4(')],'x-referer-page':_0x265462[_0x32ed10(0x387,'u&@(')],'User-Agent':$['UA'],'Content-Type':_0x265462[_0x32ed10(0x16d,'Z^4U')]},'timeout':0x2710};$[_0x32ed10(0x312,'Z^4U')](_0x91ef34,(_0x1f82b1,_0x12619c,_0x45afb2)=>{const _0x375612=_0x32ed10,_0x2b9b1c={'kcfYT':function(_0x1137fe,_0x1a9f09){const _0x515a3d=_0x4f5b;return _0x398f68[_0x515a3d(0xb7,'%P^D')](_0x1137fe,_0x1a9f09);}};if(_0x398f68[_0x375612(0x23c,'9acq')](_0x398f68[_0x375612(0x2f0,'i4OB')],_0x398f68[_0x375612(0x2ca,')Rxn')]))try{if(_0x1f82b1){if(!llgeterror){if(_0x398f68[_0x375612(0x298,'ESGq')](_0x398f68[_0x375612(0x441,'Tn(J')],_0x398f68[_0x375612(0x467,'Lv%[')])){_0x620ba2[_0x375612(0x1a2,'tjJt')]=![];return;}else console[_0x375612(0x238,'u&@(')](_0x398f68[_0x375612(0x107,'vRF8')]),console[_0x375612(0x215,'BR*H')](JSON[_0x375612(0x447,'Sk4(')](_0x1f82b1));}llgeterror=!![];}else llgeterror=![],_0x398f68[_0x375612(0x366,'99r1')](safeGet,_0x45afb2)&&($[_0x375612(0x3d0,'%P^D')]=JSON[_0x375612(0x2b0,'0X8y')](_0x45afb2),$[_0x375612(0x25e,'MZJ)')][_0x375612(0xb2,'0T9&')]&&(_0x398f68[_0x375612(0x473,'Yg2w')](_0x398f68[_0x375612(0x2e4,']]qX')],_0x398f68[_0x375612(0x10f,'Ik4g')])?_0x506bb9[_0x375612(0x18d,'Tn(J')]+=_0x375612(0x254,'FJ[@'):($[_0x375612(0x2e9,'hxQg')]=$[_0x375612(0x427,'$1K4')][_0x375612(0x451,'(h#j')][_0x375612(0x200,'Yg2w')],$[_0x375612(0x30a,'$1K4')]=$[_0x375612(0x427,'$1K4')][_0x375612(0x1b2,'9a#b')][_0x375612(0xef,'Tn(J')],$[_0x375612(0xe1,'u&@(')]=$[_0x375612(0x400,'###o')][_0x375612(0x2e5,'%P^D')][_0x375612(0x1e2,'rM4I')],$[_0x375612(0x439,'###o')]=$[_0x375612(0x3c6,'u&@(')][_0x375612(0x1b2,'9a#b')][_0x375612(0x439,'###o')])));}catch(_0x2b659d){_0x398f68[_0x375612(0x411,'9acq')](_0x398f68[_0x375612(0xda,'Ik4g')],_0x398f68[_0x375612(0x310,'Sk4(')])?(_0x5ddd10=![],_0x2b9b1c[_0x375612(0x37a,'er$4')](_0x209de6,_0x3140de)&&(_0x247cac[_0x375612(0x34b,'9a#b')]=_0xf4b05e[_0x375612(0x47d,'Cp3L')](_0x2d08c9),_0x2d4526[_0x375612(0x2d1,'fA3I')][_0x375612(0x16a,'###o')]&&(_0x16ebd0[_0x375612(0x415,'Z^4U')]=_0x5d5da3[_0x375612(0x2c4,'vDwd')][_0x375612(0x340,'S&zx')][_0x375612(0x210,'dO5f')],_0x4d4551[_0x375612(0x353,']]qX')]=_0x109a95[_0x375612(0x197,'IZfv')][_0x375612(0x1bd,'Yg2w')][_0x375612(0x41e,'Lv%[')],_0x33633c[_0x375612(0x3c3,'9ZFQ')]=_0x170d69[_0x375612(0x3fa,'ESGq')][_0x375612(0x388,'NkZi')][_0x375612(0x2f7,'FJ[@')],_0x4d1eeb[_0x375612(0x1ff,'dO5f')]=_0x4a3c05[_0x375612(0x195,'BR*H')][_0x375612(0x146,'dO5f')][_0x375612(0x242,'6m9I')]))):$[_0x375612(0x33b,'Z^4U')](_0x2b659d,_0x12619c);}finally{_0x398f68[_0x375612(0x411,'9acq')](_0x398f68[_0x375612(0x2ec,'$1Li')],_0x398f68[_0x375612(0x2c6,'0QxZ')])?_0x4127af[_0x375612(0x30b,'vRF8')](_0x3fe910,_0x148909):_0x398f68[_0x375612(0x25d,'qz[&')](_0x546b9a);}else _0x514ebc[_0x375612(0x159,'qz[&')](_0x4527f4);});});}async function fruitnew(_0x352b35=0x1f4){const _0x29279d=_0x2079dc,_0x2d757e={'qwLKa':function(_0x36aee9,_0xe2e283){return _0x36aee9==_0xe2e283;},'rBGNn':function(_0x4dac08,_0x45eeb7){return _0x4dac08>_0x45eeb7;},'RilRh':function(_0x313a96,_0x33b512){return _0x313a96!==_0x33b512;},'nXPUp':_0x29279d(0x23e,'0T9&'),'UNuxm':function(_0x4c59e7,_0x5f9b30){return _0x4c59e7(_0x5f9b30);},'DiIzU':function(_0x13afd0,_0x15f1cb){return _0x13afd0!==_0x15f1cb;},'pHSiv':_0x29279d(0xd6,')Rxn'),'rozMQ':_0x29279d(0x154,'0QxZ'),'vsnvd':function(_0x40e89e,_0x50b452,_0x38da19){return _0x40e89e(_0x50b452,_0x38da19);},'SACZu':_0x29279d(0x3df,')Rxn'),'fmFPD':_0x29279d(0x171,'0X8y'),'CzlWt':_0x29279d(0x474,')Rxn'),'YnPwd':_0x29279d(0x29a,'IZfv'),'vVsTS':_0x29279d(0xc2,'NkZi'),'fxeAk':_0x29279d(0x250,'&P&c'),'XMLAe':_0x29279d(0x3cc,'%P^D'),'ROEyj':_0x29279d(0x43c,'dO5f'),'ejkTQ':_0x29279d(0xd5,'BR*H'),'BMSgl':_0x29279d(0xb8,'Sk4(')};let _0x63d55e={'version':0xd,'channelParam':'1'},_0xd8dac1={'appId':_0x2d757e[_0x29279d(0x3b7,'IZfv')],'fn':_0x2d757e[_0x29279d(0x376,'vDwd')],'body':_0x63d55e,'apid':_0x2d757e[_0x29279d(0x1d3,'3)m@')],'ver':$['UA'][_0x29279d(0x127,'u&@(')](';')[0x2],'cl':_0x2d757e[_0x29279d(0x190,'fA3I')],'user':$[_0x29279d(0x2bf,'S&zx')],'code':0x1,'ua':$['UA']};_0x63d55e=await _0x395e65[_0x29279d(0x354,'3G%o')](_0xd8dac1);let _0xf8d208={'url':_0x29279d(0x14b,'3)m@')+_0x63d55e,'headers':{'Host':_0x2d757e[_0x29279d(0x1a8,'S&zx')],'Accept':_0x2d757e[_0x29279d(0x329,']]qX')],'Origin':_0x2d757e[_0x29279d(0x212,'6m9I')],'Accept-Encoding':_0x2d757e[_0x29279d(0x3b4,'3)m@')],'User-Agent':$['UA'],'Accept-Language':_0x2d757e[_0x29279d(0xfb,'3G%o')],'Referer':_0x2d757e[_0x29279d(0xaf,'%P^D')],'Cookie':cookie},'timeout':0x7530};return new Promise(_0x5cb8e4=>{const _0x49d32e=_0x29279d;_0x2d757e[_0x49d32e(0x18a,'ESGq')](_0x2d757e[_0x49d32e(0xf3,'Yg2w')],_0x2d757e[_0x49d32e(0x1d1,'MZJ)')])?_0x2d757e[_0x49d32e(0xc6,'6m9I')](setTimeout,()=>{const _0x5cb33e=_0x49d32e,_0x23bd99={'MiFBO':function(_0x426d90,_0x33ea2c){const _0x527572=_0x4f5b;return _0x2d757e[_0x527572(0x2ae,'fA3I')](_0x426d90,_0x33ea2c);},'iirpY':function(_0x5689c4,_0x2a6370){const _0x5a38b5=_0x4f5b;return _0x2d757e[_0x5a38b5(0x114,'vRF8')](_0x5689c4,_0x2a6370);},'yDZAL':function(_0x45f50f,_0x1677b4){const _0x4bff13=_0x4f5b;return _0x2d757e[_0x4bff13(0x240,'ihn*')](_0x45f50f,_0x1677b4);},'bRGdU':_0x2d757e[_0x5cb33e(0x374,'0QxZ')],'ufwyJ':function(_0x48c995,_0x348303){const _0x31721c=_0x5cb33e;return _0x2d757e[_0x31721c(0x425,'Cp3L')](_0x48c995,_0x348303);}};$[_0x5cb33e(0x33c,'0QxZ')](_0xf8d208,(_0x3cf125,_0x1c8683,_0x4b584a)=>{const _0x1a6da0=_0x5cb33e;try{_0x3cf125?(console[_0x1a6da0(0x112,'k@E0')](_0x1a6da0(0x408,'%P^D')),$[_0x1a6da0(0x1e8,'fA3I')](_0x3cf125)):(_0x4b584a=JSON[_0x1a6da0(0x2bb,'BR*H')](_0x4b584a),$[_0x1a6da0(0x3f3,'rM4I')]=_0x4b584a[_0x1a6da0(0x1b3,'0T9&')]?.[_0x1a6da0(0x2d2,'Cp3L')]||'');}catch(_0x25df73){$[_0x1a6da0(0x2e8,'hxQg')](_0x25df73,_0x1c8683);}finally{if(_0x23bd99[_0x1a6da0(0x3d5,'S&zx')](_0x23bd99[_0x1a6da0(0x2f9,'EXfH')],_0x23bd99[_0x1a6da0(0xc1,'6m9I')])){_0x54b649=_0x3fa87b[_0x1a6da0(0x3d1,'o#A^')](_0x1ffe46);if(_0x23bd99[_0x1a6da0(0x265,'6Q@b')](_0x290fa3[_0x1a6da0(0x268,'FJ[@')],0x0))_0x4d48de[_0x1a6da0(0x3ec,'qz[&')]=_0x5a8eab[_0x1a6da0(0x281,'9ZFQ')][_0x1a6da0(0x172,'ESGq')]+'个',_0x23bd99[_0x1a6da0(0x222,'3G%o')](_0xc977e3[_0x1a6da0(0x34c,'rM4I')][_0x1a6da0(0x23b,'Z^4U')],0x7530)&&(_0x1a22bf[_0x1a6da0(0x232,'$1Li')]+=_0x1a6da0(0x1e5,'Sk4('));else{}}else _0x23bd99[_0x1a6da0(0x1dc,'BR*H')](_0x5cb8e4,_0x4b584a);}});},_0x352b35):(_0x2b3f5e=_0x4d022f[_0x49d32e(0x189,'vRF8')](_0x2c1c89),_0x4af317[_0x49d32e(0x349,'9acq')]=_0x3a9ce6[_0x49d32e(0xab,'3)m@')]?.[_0x49d32e(0x2b4,'vRF8')]||'');});}async function checkplus(){const _0x220917=_0x2079dc,_0x15e0fe={'RzbHr':function(_0x317516,_0x3e0377){return _0x317516===_0x3e0377;},'JVYXu':_0x220917(0x475,'###o'),'uBmnd':_0x220917(0x396,'EXfH'),'XmXwi':_0x220917(0x42f,'9a#b'),'gNuAo':function(_0x2fd891,_0x45878b){return _0x2fd891==_0x45878b;},'FuBKV':function(_0x1813c8,_0x223831){return _0x1813c8!==_0x223831;},'sQrki':_0x220917(0x34a,'6Q@b'),'dZDWe':_0x220917(0x383,'vRF8'),'rqnij':function(_0x19c705,_0x41dd1f){return _0x19c705!==_0x41dd1f;},'GRfhT':_0x220917(0x3bb,'$1K4'),'PjtyE':_0x220917(0x17b,'Yg2w'),'JLSRJ':_0x220917(0x3a7,'S&zx'),'QzbOl':_0x220917(0x323,'IZfv'),'MSKUv':_0x220917(0x224,'MZJ)'),'xgmyW':function(_0x1e208d){return _0x1e208d();},'MPKmG':_0x220917(0x1e3,'%P^D'),'KPmzX':_0x220917(0x39d,'qz[&'),'nIdlz':_0x220917(0x308,'9ZFQ'),'KbhFN':_0x220917(0x2eb,'$1Li'),'fjncz':_0x220917(0x12c,'Ik4g'),'lMUeG':_0x220917(0x471,'9a#b'),'HSGLL':_0x220917(0x2e6,'fA3I')};let _0x5bc68a={'contentType':_0x15e0fe[_0x220917(0x288,'6m9I')],'qids':_0x15e0fe[_0x220917(0x192,'0T9&')],'checkLevel':0x1},_0x7a88e6={'appId':_0x15e0fe[_0x220917(0x176,'9acq')],'functionId':_0x15e0fe[_0x220917(0x270,'%P^D')],'body':_0x5bc68a,'appid':_0x15e0fe[_0x220917(0x2f2,'%P^D')],'user':$[_0x220917(0x241,'###o')],'code':0x1,'ua':$['UA']};_0x5bc68a=await _0x4160ce[_0x220917(0xae,'NkZi')](_0x7a88e6);let _0x282335={'url':_0x220917(0x143,'S&zx'),'body':_0x5bc68a,'headers':{'User-Agent':$['UA'],'Cookie':cookie,'Origin':_0x15e0fe[_0x220917(0x3eb,'$1Li')],'Referer':_0x15e0fe[_0x220917(0x36a,'o#A^')]}};return new Promise(async _0x51089a=>{const _0x4209fc=_0x220917,_0x4ca799={'dMXId':function(_0x49025c,_0x408bb6){const _0x1459d3=_0x4f5b;return _0x15e0fe[_0x1459d3(0xed,'$1Li')](_0x49025c,_0x408bb6);},'CgePq':_0x15e0fe[_0x4209fc(0x291,'9a#b')],'SeJof':_0x15e0fe[_0x4209fc(0x3f8,'hxQg')],'WbQVk':_0x15e0fe[_0x4209fc(0x29d,'###o')],'LbNyR':function(_0x1bb19c,_0x36ff16){const _0x569dd7=_0x4209fc;return _0x15e0fe[_0x569dd7(0xd3,'i4OB')](_0x1bb19c,_0x36ff16);},'EfhvO':function(_0x5d58c9,_0x2588f5){const _0x57d96d=_0x4209fc;return _0x15e0fe[_0x57d96d(0x211,'k@E0')](_0x5d58c9,_0x2588f5);},'iKrnL':_0x15e0fe[_0x4209fc(0x188,'6Q@b')],'tZeNn':_0x15e0fe[_0x4209fc(0x28a,'9acq')],'GbmDU':function(_0x411170,_0x34d6c3){const _0x2beecd=_0x4209fc;return _0x15e0fe[_0x2beecd(0x378,'Lv%[')](_0x411170,_0x34d6c3);},'rlvqV':_0x15e0fe[_0x4209fc(0x165,'u&@(')],'PBReU':_0x15e0fe[_0x4209fc(0x3a0,'$1Li')],'VjVjo':_0x15e0fe[_0x4209fc(0x267,'BR*H')],'yNgfF':_0x15e0fe[_0x4209fc(0x228,'FJ[@')],'MdNfN':_0x15e0fe[_0x4209fc(0xc7,'Sk4(')],'QKiXu':function(_0x1bd59a){const _0x381368=_0x4209fc;return _0x15e0fe[_0x381368(0xeb,'6m9I')](_0x1bd59a);}};$[_0x4209fc(0xce,'fA3I')](_0x282335,async(_0x1082ab,_0x28f83d,_0x2fce8b)=>{const _0x3f3c96=_0x4209fc,_0x251f27={'eKPhY':function(_0xee26a9,_0x37985d){const _0x526cff=_0x4f5b;return _0x4ca799[_0x526cff(0x22f,'Tn(J')](_0xee26a9,_0x37985d);},'qoCGw':_0x4ca799[_0x3f3c96(0xd1,'Ik4g')],'LoUdb':_0x4ca799[_0x3f3c96(0x3fe,'FJ[@')],'XdOMB':_0x4ca799[_0x3f3c96(0xfe,'(h#j')],'oRRdX':function(_0x86387,_0x1dfac0){const _0x4185a9=_0x3f3c96;return _0x4ca799[_0x4185a9(0x33e,'9ZFQ')](_0x86387,_0x1dfac0);}};if(_0x4ca799[_0x3f3c96(0x3e6,'3G%o')](_0x4ca799[_0x3f3c96(0x289,'Z^4U')],_0x4ca799[_0x3f3c96(0x21c,'0QxZ')]))try{if(_0x4ca799[_0x3f3c96(0x2d6,'dO5f')](_0x4ca799[_0x3f3c96(0x25a,'NkZi')],_0x4ca799[_0x3f3c96(0x1a3,'$1Li')]))_0x4239af?(_0x1c057c[_0x3f3c96(0x264,')Rxn')](''+_0x2cd5ae[_0x3f3c96(0x2ab,'dO5f')](_0x56c8cb)),_0x3c0db2[_0x3f3c96(0x3d3,'Ik4g')](_0x3f3c96(0x43a,']]qX'))):(_0x4b0c56[_0x3f3c96(0x162,'NkZi')]=_0x440ea1[_0x3f3c96(0x144,'9acq')](/"score":(\d+)/)?_0x47e1eb[_0x3f3c96(0x111,'99r1')](/"score":(\d+)/)[0x1]:0x0,_0x32afc2[_0x3f3c96(0x29f,'tjJt')]=_0x2bbc5d[_0x3f3c96(0x261,'EXfH')](/"currentBeanNum":(\d+)/)?_0x14574b[_0x3f3c96(0x17d,'NkZi')](/"currentBeanNum":(\d+)/)[0x1]:0x0,_0x3413d1[_0x3f3c96(0x46c,'0X8y')]=_0x3c60f2[_0x3f3c96(0x3b8,'hxQg')](/"showName":"(.*?)"/)?_0x10ae2a[_0x3f3c96(0x1ce,'k@E0')](/"showName":"(.*?)"/)[0x1]:_0x5d109a[_0x3f3c96(0x285,'u&@(')]);else{if(_0x1082ab)console[_0x3f3c96(0x163,'$1K4')](''+JSON[_0x3f3c96(0x226,'Cp3L')](_0x1082ab)),console[_0x3f3c96(0x138,'MZJ)')](_0x3f3c96(0x229,'Tn(J'));else{if(_0x4ca799[_0x3f3c96(0xf6,'Ik4g')](_0x4ca799[_0x3f3c96(0xcd,'i4OB')],_0x4ca799[_0x3f3c96(0x332,'$1Li')]))_0x3f8ccd=_0x25a5a5[_0x3f3c96(0x11b,'9a#b')](_0xe968e5),_0x4a905d[_0x3f3c96(0x1d4,')Rxn')]&&(_0x396bc0[_0x3f3c96(0x157,'Ae9d')]=_0x1a2d1e[_0x3f3c96(0x187,'k@E0')][_0x3f3c96(0x19b,'vRF8')]||0x0);else{_0x2fce8b=JSON[_0x3f3c96(0x2da,'er$4')](_0x2fce8b);if(_0x4ca799[_0x3f3c96(0x3ca,'NkZi')](_0x2fce8b[_0x3f3c96(0x3c5,')Rxn')],0x1a1b98))$[_0x3f3c96(0x1b1,'%P^D')]=_0x2fce8b['rs'][_0x3f3c96(0x463,'9a#b')][_0x3f3c96(0x11f,'fA3I')]?!![]:![];else{}}}}}catch(_0x30c01e){_0x4ca799[_0x3f3c96(0x37e,'qz[&')](_0x4ca799[_0x3f3c96(0x360,'BR*H')],_0x4ca799[_0x3f3c96(0x465,'%P^D')])?(_0x226075[_0x3f3c96(0x237,'(h#j')]=_0x2f7da9[_0x3f3c96(0x1cb,'86aV')](_0x4845c0),_0x4327aa[_0x3f3c96(0x17e,'Z^4U')][_0x3f3c96(0x1a0,'k@E0')]&&(_0xae4245[_0x3f3c96(0x186,'ihn*')]=_0x44236c[_0x3f3c96(0x452,'0X8y')][_0x3f3c96(0x46b,'ESGq')][_0x3f3c96(0x2fe,'86aV')],_0x499a44[_0x3f3c96(0x3f5,'Ae9d')]=_0x1ce9d7[_0x3f3c96(0x207,'dO5f')][_0x3f3c96(0xe9,'tjJt')][_0x3f3c96(0x149,'vRF8')],_0x598398[_0x3f3c96(0x213,'Z^4U')]=_0x561441[_0x3f3c96(0x208,'9ZFQ')][_0x3f3c96(0x2cf,'0QxZ')][_0x3f3c96(0xc9,'Yg2w')],_0x2abaad[_0x3f3c96(0x439,'###o')]=_0x3888e9[_0x3f3c96(0x197,'IZfv')][_0x3f3c96(0x2cf,'0QxZ')][_0x3f3c96(0x385,'fA3I')])):$[_0x3f3c96(0x135,'Sk4(')](_0x30c01e,_0x28f83d);}finally{_0x4ca799[_0x3f3c96(0x2ee,'EXfH')](_0x51089a);}else{_0x35e035=_0x57d394[_0x3f3c96(0x247,'dO5f')](_0x3920c9);if(_0x251f27[_0x3f3c96(0x282,'i4OB')](_0x275d2c[_0x251f27[_0x3f3c96(0x364,'9ZFQ')]],_0x251f27[_0x3f3c96(0x39e,'3G%o')])){_0x2ea801[_0x3f3c96(0x437,'dO5f')]=![];return;}if(_0x251f27[_0x3f3c96(0x460,'6Q@b')](_0x331698[_0x3f3c96(0x22d,'Yg2w')],'0')&&_0x2d2e9b[_0x3f3c96(0xb4,'vDwd')]){const _0x30753e=_0x251f27[_0x3f3c96(0x1b6,'3)m@')][_0x3f3c96(0x286,'tjJt')]('|');let _0x3fc367=0x0;while(!![]){switch(_0x30753e[_0x3fc367++]){case'0':_0xcc26e5[_0x3f3c96(0x46c,'0X8y')]=_0x20a4b8[_0x3f3c96(0x3ed,'$1Li')]?.[_0x3f3c96(0x1b7,'o#A^')]?.[_0x3f3c96(0x203,'99r1')]?.[_0x3f3c96(0x3f7,'vRF8')]||_0x31cc05[_0x3f3c96(0x410,'0X8y')];continue;case'1':_0x10251d[_0x3f3c96(0x341,'o#A^')]=_0x430799[_0x3f3c96(0x22e,')Rxn')]?.[_0x3f3c96(0x128,'NkZi')]?.[_0x3f3c96(0x230,'Z^4U')]||'';continue;case'2':_0x52b205[_0x3f3c96(0x2d8,'Sk4(')]=_0x217885[_0x3f3c96(0xa9,'NkZi')]?.[_0x3f3c96(0x1b7,'o#A^')]?.[_0x3f3c96(0x1f9,'Sk4(')]?.[_0x3f3c96(0x305,'BR*H')];continue;case'3':_0x194c16[_0x3f3c96(0x26e,'(h#j')]=_0x251f27[_0x3f3c96(0x301,'FJ[@')](_0x2931b6[_0x3f3c96(0x1cd,'Lv%[')]?.[_0x3f3c96(0x201,'(h#j')]?.[_0x3f3c96(0x41d,'er$4')],0x1);continue;case'4':_0x35c09b[_0x3f3c96(0x404,'vRF8')]=_0xda7ff7[_0x3f3c96(0x281,'9ZFQ')]?.[_0x3f3c96(0x402,'6Q@b')]?.[_0x3f3c96(0x3fd,'fA3I')]||0x0;continue;}break;}}}});});}async function sqb(){const _0x3c197b=_0x2079dc,_0x49c814={'UDmKo':_0x3c197b(0x3e5,'EXfH'),'WedPK':function(_0x2b6a5c,_0x5f39a0){return _0x2b6a5c==_0x5f39a0;},'hIcPA':function(_0x284318){return _0x284318();},'yoaiH':function(_0x399140,_0x26b760){return _0x399140===_0x26b760;},'UOfWp':_0x3c197b(0x468,'rM4I'),'wPCPu':_0x3c197b(0x1e9,'Z^4U'),'ApIoC':_0x3c197b(0x1f8,'er$4'),'vVqbI':function(_0x1fc9c6,_0x19cc06){return _0x1fc9c6>_0x19cc06;},'zeICq':function(_0x2c383d,_0x5728ce){return _0x2c383d!==_0x5728ce;},'QfyBq':_0x3c197b(0x14d,'%P^D'),'qavjQ':_0x3c197b(0x1f4,'S&zx'),'EpYMQ':_0x3c197b(0x251,'ihn*'),'PdlLy':function(_0x55eca8){return _0x55eca8();},'BsybZ':function(_0x249b58,_0x1303ef){return _0x249b58===_0x1303ef;},'uWhJF':_0x3c197b(0x257,'&P&c'),'UVutX':_0x3c197b(0x15c,'er$4'),'sIPkN':_0x3c197b(0x2c5,'3G%o'),'ORrbo':_0x3c197b(0x164,'3)m@'),'yEmUl':_0x3c197b(0xfd,'%P^D'),'teBnB':_0x3c197b(0x109,'Sk4('),'uczyD':_0x3c197b(0x15f,'Yg2w'),'fmqbA':_0x3c197b(0x35e,'vDwd'),'SAXvZ':_0x3c197b(0x110,'u&@('),'CXTHi':_0x3c197b(0x449,'Yg2w'),'TRccJ':_0x3c197b(0x275,'NkZi'),'dTJAJ':_0x3c197b(0x198,'er$4'),'AIHwA':_0x3c197b(0x10c,'(h#j'),'VrXAJ':_0x3c197b(0x182,'Z^4U'),'Pzziv':_0x3c197b(0x40b,'fA3I'),'xIlWt':_0x3c197b(0x38e,'er$4')};let _0x27ed4e=_0x49c814[_0x3c197b(0x27c,'MZJ)')],_0x57b701={'source':_0x49c814[_0x3c197b(0x401,'ESGq')]},_0x52d626={'appId':_0x49c814[_0x3c197b(0x292,'qz[&')],'fn':_0x27ed4e,'body':_0x57b701,'apid':_0x49c814[_0x3c197b(0x1c9,'rM4I')],'ver':_0x49c814[_0x3c197b(0x334,'u&@(')],'cl':_0x49c814[_0x3c197b(0x3fb,'i4OB')],'user':$[_0x3c197b(0x10d,'&P&c')],'code':0x1,'ua':$['UA']};_0x57b701=await _0x14a0d8[_0x3c197b(0x38b,'9ZFQ')](_0x52d626);if(!_0x57b701)return;return new Promise(async _0x4861c1=>{const _0x3664cb=_0x3c197b,_0x3fa9a3={'ktowa':_0x49c814[_0x3664cb(0x115,'0T9&')],'nYJet':function(_0x3bb2a7,_0x9e39eb){const _0x5f1b81=_0x3664cb;return _0x49c814[_0x5f1b81(0x19c,'MZJ)')](_0x3bb2a7,_0x9e39eb);},'RfFEs':function(_0x1e5995){const _0x43bdf5=_0x3664cb;return _0x49c814[_0x43bdf5(0x2c9,'fA3I')](_0x1e5995);},'DabUp':function(_0x359d5b,_0x4fcf32){const _0x5d9f79=_0x3664cb;return _0x49c814[_0x5d9f79(0x2ac,'BR*H')](_0x359d5b,_0x4fcf32);},'KSJQX':_0x49c814[_0x3664cb(0x36c,'0QxZ')],'ArfvL':_0x49c814[_0x3664cb(0x1e6,'u&@(')],'OqKlp':function(_0x290b25,_0x561ffb){const _0x4833dd=_0x3664cb;return _0x49c814[_0x4833dd(0x2f6,'o#A^')](_0x290b25,_0x561ffb);},'XaaFz':_0x49c814[_0x3664cb(0x249,'Cp3L')],'TTlcs':function(_0x1d2f9b,_0x1cb8c3){const _0x21af82=_0x3664cb;return _0x49c814[_0x21af82(0x458,'i4OB')](_0x1d2f9b,_0x1cb8c3);},'NoOCV':function(_0x168e0a,_0x56a3f1){const _0x4d063e=_0x3664cb;return _0x49c814[_0x4d063e(0xe8,'IZfv')](_0x168e0a,_0x56a3f1);},'BvlrL':_0x49c814[_0x3664cb(0x1fc,'FJ[@')],'EDlGp':_0x49c814[_0x3664cb(0x21d,'MZJ)')],'Bqdpe':function(_0x3d8c57,_0x4e4ed5){const _0x4a428b=_0x3664cb;return _0x49c814[_0x4a428b(0x2e1,']]qX')](_0x3d8c57,_0x4e4ed5);},'MGWln':_0x49c814[_0x3664cb(0x346,'rM4I')],'wtsyf':function(_0x4d6a4c){const _0xd0e7c6=_0x3664cb;return _0x49c814[_0xd0e7c6(0x414,']]qX')](_0x4d6a4c);}};if(_0x49c814[_0x3664cb(0x126,'0QxZ')](_0x49c814[_0x3664cb(0x41a,'3G%o')],_0x49c814[_0x3664cb(0x430,')Rxn')])){const _0x2cbbf9={'url':_0x3664cb(0x13a,'&P&c'),'body':_0x3664cb(0x2e0,'dO5f')+_0x57b701,'headers':{'Host':_0x49c814[_0x3664cb(0x108,'Cp3L')],'Referer':_0x49c814[_0x3664cb(0x3b0,'i4OB')],'User-Agent':$['UA'],'cookie':cookie,'wqreferer':_0x49c814[_0x3664cb(0xbb,'NkZi')],'x-rp-client':_0x49c814[_0x3664cb(0x369,'6m9I')],'accept-language':_0x49c814[_0x3664cb(0x217,'FJ[@')],'Accept-Encoding':_0x49c814[_0x3664cb(0x37f,'u&@(')],'x-referer-page':_0x49c814[_0x3664cb(0x1c6,'0QxZ')],'x-referer-package':_0x49c814[_0x3664cb(0x3b1,'u&@(')],'accept':_0x49c814[_0x3664cb(0x412,'9ZFQ')]}};$[_0x3664cb(0x31a,'qz[&')](_0x2cbbf9,(_0x5ebaf7,_0x5e0e78,_0x28f25d)=>{const _0x12b397=_0x3664cb,_0x574e2c={'HwZOd':function(_0x529e92){const _0xdaece=_0x4f5b;return _0x3fa9a3[_0xdaece(0x42d,'Lv%[')](_0x529e92);}};try{if(_0x5ebaf7)_0x3fa9a3[_0x12b397(0x263,'6Q@b')](_0x3fa9a3[_0x12b397(0x248,'BR*H')],_0x3fa9a3[_0x12b397(0xd8,'0QxZ')])?(_0x512e7d[_0x12b397(0x18c,'6m9I')]=_0x10bb8c[_0x12b397(0x446,')Rxn')][_0x12b397(0x1b2,'9a#b')][_0x12b397(0x34f,'3)m@')],_0x5a7cb5[_0x12b397(0x139,'qz[&')]=_0x519394[_0x12b397(0x17e,'Z^4U')][_0x12b397(0x33d,'Z^4U')][_0x12b397(0x293,'FJ[@')],_0xc1808f[_0x12b397(0x3c0,'Tn(J')]=_0x44e790[_0x12b397(0x370,'$1Li')][_0x12b397(0x3e8,'ihn*')][_0x12b397(0x352,'Sk4(')],_0x38988a[_0x12b397(0x133,'99r1')]=_0x5e09da[_0x12b397(0x12b,'vRF8')][_0x12b397(0x36b,'$1K4')][_0x12b397(0x16b,'3G%o')]):($[_0x12b397(0x1c0,'u&@(')](_0x5ebaf7),console[_0x12b397(0x112,'k@E0')](_0x12b397(0x302,'NkZi')));else{_0x28f25d=JSON[_0x12b397(0x3cf,'Tn(J')](_0x28f25d);if(_0x3fa9a3[_0x12b397(0x233,'Lv%[')](_0x28f25d[_0x12b397(0x202,'EXfH')],0x0))_0x3fa9a3[_0x12b397(0x311,'Sk4(')](_0x3fa9a3[_0x12b397(0x17c,'u&@(')],_0x3fa9a3[_0x12b397(0x434,'86aV')])?($[_0x12b397(0x178,'(h#j')]=_0x28f25d[_0x12b397(0x442,'Sk4(')][_0x12b397(0x429,'S&zx')]+'个',_0x3fa9a3[_0x12b397(0x2fa,'Sk4(')](_0x28f25d[_0x12b397(0x40a,'S&zx')][_0x12b397(0x429,'S&zx')],0x7530)&&($[_0x12b397(0x15e,'hxQg')]+=_0x12b397(0x20a,'k@E0'))):_0x574e2c[_0x12b397(0x3be,'9acq')](_0x4ac7f7);else{}}}catch(_0x17d2e9){_0x3fa9a3[_0x12b397(0xc8,'k@E0')](_0x3fa9a3[_0x12b397(0x3dc,'dO5f')],_0x3fa9a3[_0x12b397(0x279,'(h#j')])?$[_0x12b397(0x1e1,'i4OB')](_0x17d2e9):(_0x7ac890[_0x12b397(0x1ea,'S&zx')](_0x1db27b),_0x40d12a[_0x12b397(0x163,'$1K4')](_0x12b397(0x10e,'MZJ)')));}finally{if(_0x3fa9a3[_0x12b397(0x24f,'dO5f')](_0x3fa9a3[_0x12b397(0x35d,'FJ[@')],_0x3fa9a3[_0x12b397(0x1ae,'6Q@b')]))_0x3fa9a3[_0x12b397(0xcc,'IZfv')](_0x4861c1);else{const _0x1583f1=_0x3fa9a3[_0x12b397(0x152,'99r1')][_0x12b397(0x3e0,'&P&c')]('|');let _0x2cd4f6=0x0;while(!![]){switch(_0x1583f1[_0x2cd4f6++]){case'0':_0x327fdd[_0x12b397(0xe6,'0T9&')]=_0x47f85c[_0x12b397(0x13b,'(h#j')]?.[_0x12b397(0x194,'Ik4g')]?.[_0x12b397(0x2a9,'IZfv')]?.[_0x12b397(0xe0,'IZfv')];continue;case'1':_0x3ffbf9[_0x12b397(0x21e,'9a#b')]=_0x293252[_0x12b397(0x343,'hxQg')]?.[_0x12b397(0x3ab,'9acq')]?.[_0x12b397(0x3e7,'Cp3L')]?.[_0x12b397(0x160,'FJ[@')]||_0x4fa0d2[_0x12b397(0x344,'NkZi')];continue;case'2':_0x4916e9[_0x12b397(0x33a,'Yg2w')]=_0x252fc3[_0x12b397(0x1c3,'0X8y')]?.[_0x12b397(0x1c5,'0T9&')]?.[_0x12b397(0x181,'6m9I')]||'';continue;case'3':_0x22751e[_0x12b397(0x32b,'&P&c')]=_0x3fa9a3[_0x12b397(0x440,'ihn*')](_0x3d6081[_0x12b397(0x1cd,'Lv%[')]?.[_0x12b397(0x320,'6m9I')]?.[_0x12b397(0x1de,'0T9&')],0x1);continue;case'4':_0x54a690[_0x12b397(0x300,'ihn*')]=_0xac00ea[_0x12b397(0x36f,'ihn*')]?.[_0x12b397(0x155,'BR*H')]?.[_0x12b397(0x318,']]qX')]||0x0;continue;}break;}}}});}else _0x151cbc?(_0x29cbfc[_0x3664cb(0x1f7,'3G%o')](_0x3664cb(0x3a6,'FJ[@')),_0x22a576[_0x3664cb(0x448,'9a#b')](_0x1203af)):(_0x325e95=_0x2d2027[_0x3664cb(0x297,'qz[&')](_0x12430c),_0x3c91fc[_0x3664cb(0x405,'IZfv')]=_0x9e263c[_0x3664cb(0x1d6,'fA3I')]?.[_0x3664cb(0x13f,'IZfv')]||'');});}var version_ = 'jsjiami.com.v7';
!(async () => {
    if (!cookiesArr[0]) {
        $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {
            "open-url": "https://bean.m.jd.com/bean/signIndex.action"
        });
        return;
    }
    for (i = 0; i < cookiesArr.length; i++) {
        if (cookiesArr[i]) {
            cookie = cookiesArr[i];
            $.pt_pin = (cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
            $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
            $.CryptoJS = $.isNode() ? require('crypto-js') : CryptoJS;
            $.index = i + 1;
            $.beanCount = 0;
            $.incomeBean = 0;
            $.expenseBean = 0;
            $.todayIncomeBean = 0;
            $.todayOutcomeBean = 0;
            $.errorMsg = '';
            $.isLogin = true;
            $.nickName = '';
            $.levelName = '';
            $.message = '';
            $.balance = 0;
            $.expiredBalance = 0;
            $.JdFarmProdName = '';
            $.JdtreeEnergy = 0;
            $.JdtreeTotalEnergy = 0;
            $.treeState = 0;
            $.JdwaterTotalT = 0;
            $.JdwaterD = 0;
            $.JDwaterEveryDayT = 0;
            $.JDtotalcash = 0;
            $.jdCash = 0;
            $.isPlusVip = false;
            $.isRealNameAuth = false;
            $.JingXiang = "";
            $.allincomeBean = 0; //月收入
            $.allexpenseBean = 0; //月支出
            $.beanChangeXi = 0;
            $.YunFeiTitle = "";
            $.YunFeiQuan = 0;
            $.YunFeiQuanEndTime = "";
            $.YunFeiTitle2 = "";
            $.YunFeiQuan2 = 0;
            $.YunFeiQuanEndTime2 = "";
            $.JoyRunningAmount = "";
            $.ECardinfo = "";
            $.PlustotalScore = 0;
            $.CheckTime = "";
            $.beanCache = 0;
            $.fruitnewinfo = '';
            $.newfarm_info = '';
            TempBaipiao = "";
            strGuoqi = "";
            $.wyw_score = '';
            $.wb_score = '';
            $.sqb_info = '';

            console.log(`*********开始查询【账号${$.index}】${$.UserName}***********`);
            $.UA = require('./USER_AGENTS').UARAM();
            await getuserinfo_6dy();
            await mybean();
            if ($.beanCount == 0) {
                console.log("数据获取失败，等待30秒后重试....")
                await $.wait(30 * 1000);
                await TotalBean();
            }
            if ($.beanCount == 0) {
                console.log("疑似获取失败,等待10秒后用第二个接口试试....")
                await $.wait(10 * 1000);
                var userdata = await getuserinfo();
                if (userdata.code == 1) {
                    $.beanCount = userdata.content.jdBean;
                }
            }


            if (!$.isLogin) {
                await isLoginByX1a0He();
            }
            if (!$.isLogin) {
                $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
                    "open-url": "https://bean.m.jd.com/bean/signIndex.action"
                });

                if ($.isNode()) {
                    await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
                }
                continue
            }

            if (TempBeanCache) {
                for (let j = 0; j < TempBeanCache.length; j++) {
                    if (TempBeanCache[j].pt_pin == $.UserName) {
                        $.CheckTime = TempBeanCache[j].CheckTime;
                        $.beanCache = TempBeanCache[j].BeanNum;
                        break;
                    }
                }
            }

            var llfound = false;
            var timeString = "";
            var nowHour = new Date().getHours();
            var nowMinute = new Date().getMinutes();
            if (nowHour < 10)
                timeString += "0" + nowHour + ":";
            else
                timeString += nowHour + ":";

            if (nowMinute < 10)
                timeString += "0" + nowMinute;
            else
                timeString += nowMinute;

            if (TodayCache) {
                for (let j = 0; j < TodayCache.length; j++) {
                    if (TodayCache[j].pt_pin == $.UserName) {
                        TodayCache[j].CheckTime = timeString;
                        TodayCache[j].BeanNum = $.beanCount;
                        llfound = true;
                        break;
                    }
                }
            }
            if (!llfound) {

                var tempAddCache = {
                    "pt_pin": $.UserName,
                    "CheckTime": timeString,
                    "BeanNum": $.beanCount
                };
                TodayCache.push(tempAddCache);
            }
            await getjdfruitinfo(); //老农场
            await $.wait(500);
            await fruitnew();
            //await checkplus();
            await Promise.all([
                wanyiwan(),
                //wb_info(),
                bean(), //京豆查询
                //queryScores(),
                getek(),
                newfarm_info(),
                //sqb()

            ])

            await showMsg();
            if (intPerSent > 0) {
                if ((i + 1) % intPerSent == 0) {
                    console.log("分段通知条件达成，处理发送通知....");
                    if ($.isNode() && allMessage) {
                        var TempMessage = allMessage;
                        if (strAllNotify)
                            allMessage = strAllNotify + `\n` + allMessage;

                        await notify.sendNotify(`${$.name}`, `${allMessage}`, {
                            url: ``
                        }, undefined, TempMessage)
                    }
                    if ($.isNode() && allMessageMonth) {
                        await notify.sendNotify(`京东月资产统计`, `${allMessageMonth}`, {
                            url: ``
                        })
                    }
                    allMessage = "";
                    allMessageMonth = "";
                }

            }
        }
    }

    var str = JSON.stringify(TodayCache, null, 2);
    fs.writeFile(strNewBeanCache, str, function (err) {
        if (err) {
            console.log(err);
            console.log("添加缓存" + TodayDate + ".json失败!");
        } else {
            console.log("添加缓存" + TodayDate + ".json成功!");
        }
    })

    //组1通知
    if (ReceiveMessageGp4) {
        allMessage2Gp4 = `【⏰商品白嫖清单⏰】\n` + ReceiveMessageGp4;
    }
    if (WarnMessageGp4) {
        if (allMessage2Gp4) {
            allMessage2Gp4 = `\n` + allMessage2Gp4;
        }
        allMessage2Gp4 = `【⏰商品白嫖活动任务提醒⏰】\n` + WarnMessageGp4 + allMessage2Gp4;
    }

    //组2通知
    if (ReceiveMessageGp2) {
        allMessage2Gp2 = `【⏰商品白嫖清单⏰】\n` + ReceiveMessageGp2;
    }
    if (WarnMessageGp2) {
        if (allMessage2Gp2) {
            allMessage2Gp2 = `\n` + allMessage2Gp2;
        }
        allMessage2Gp2 = `【⏰商品白嫖活动任务提醒⏰】\n` + WarnMessageGp2 + allMessage2Gp2;
    }

    //组3通知
    if (ReceiveMessageGp3) {
        allMessage2Gp3 = `【⏰商品白嫖清单⏰】\n` + ReceiveMessageGp3;
    }
    if (WarnMessageGp3) {
        if (allMessage2Gp3) {
            allMessage2Gp3 = `\n` + allMessage2Gp3;
        }
        allMessage2Gp3 = `【⏰商品白嫖活动任务提醒⏰】\n` + WarnMessageGp3 + allMessage2Gp3;
    }

    //其他通知
    if (allReceiveMessage) {
        allMessage2 = `【⏰商品白嫖清单⏰】\n` + allReceiveMessage;
    }
    if (allWarnMessage) {
        if (allMessage2) {
            allMessage2 = `\n` + allMessage2;
        }
        allMessage2 = `【⏰商品白嫖活动任务提醒⏰】\n` + allWarnMessage + allMessage2;
    }

    if (intPerSent > 0) {
        //console.log("分段通知还剩下" + cookiesArr.length % intPerSent + "个账号需要发送...");
        if (allMessage || allMessageMonth) {
            console.log("分段通知收尾，处理发送通知....");
            if ($.isNode() && allMessage) {
                var TempMessage = allMessage;
                if (strAllNotify)
                    allMessage = strAllNotify + `\n` + allMessage;

                await notify.sendNotify(`${$.name}`, `${allMessage}`, {
                    url: ``
                }, undefined, TempMessage)
            }
            if ($.isNode() && allMessageMonth) {
                await notify.sendNotify(`京东月资产统计`, `${allMessageMonth}`, {
                    url: ``
                })
            }
        }
    } else {

        if ($.isNode() && allMessageGp2) {
            var TempMessage = allMessageGp2;
            if (strAllNotify)
                allMessageGp2 = strAllNotify + `\n` + allMessageGp2;
            await notify.sendNotify(`${$.name}#2`, `${allMessageGp2}`, {
                url: ``
            }, undefined, TempMessage)
            await $.wait(10 * 1000);
        }
        if ($.isNode() && allMessageGp3) {
            var TempMessage = allMessageGp3;
            if (strAllNotify)
                allMessageGp3 = strAllNotify + `\n` + allMessageGp3;
            await notify.sendNotify(`${$.name}#3`, `${allMessageGp3}`, {
                url: ``
            }, undefined, TempMessage)
            await $.wait(10 * 1000);
        }
        if ($.isNode() && allMessageGp4) {
            var TempMessage = allMessageGp4;
            if (strAllNotify)
                allMessageGp4 = strAllNotify + `\n` + allMessageGp4;
            await notify.sendNotify(`${$.name}#4`, `${allMessageGp4}`, {
                url: ``
            }, undefined, TempMessage)
            await $.wait(10 * 1000);
        }
        if ($.isNode() && allMessage) {
            var TempMessage = allMessage;
            if (strAllNotify)
                allMessage = strAllNotify + `\n` + allMessage;

            await notify.sendNotify(`${$.name}`, `${allMessage}`, {
                url: ``
            }, undefined, TempMessage)
            await $.wait(10 * 1000);
        }

        if ($.isNode() && allMessageMonthGp2) {
            await notify.sendNotify(`京东月资产统计#2`, `${allMessageMonthGp2}`, {
                url: ``
            })
            await $.wait(10 * 1000);
        }
        if ($.isNode() && allMessageMonthGp3) {
            await notify.sendNotify(`京东月资产统计#3`, `${allMessageMonthGp3}`, {
                url: ``
            })
            await $.wait(10 * 1000);
        }
        if ($.isNode() && allMessageMonthGp4) {
            await notify.sendNotify(`京东月资产统计#4`, `${allMessageMonthGp4}`, {
                url: ``
            })
            await $.wait(10 * 1000);
        }
        if ($.isNode() && allMessageMonth) {
            await notify.sendNotify(`京东月资产统计`, `${allMessageMonth}`, {
                url: ``
            })
            await $.wait(10 * 1000);
        }
    }

    if ($.isNode() && allMessage2Gp2) {
        allMessage2Gp2 += RemainMessage;
        await notify.sendNotify("京东白嫖提醒#2", `${allMessage2Gp2}`, {
            url: ``
        })
        await $.wait(10 * 1000);
    }
    if ($.isNode() && allMessage2Gp3) {
        allMessage2Gp3 += RemainMessage;
        await notify.sendNotify("京东白嫖提醒#3", `${allMessage2Gp3}`, {
            url: ``
        })
        await $.wait(10 * 1000);
    }
    if ($.isNode() && allMessage2Gp4) {
        allMessage2Gp4 += RemainMessage;
        await notify.sendNotify("京东白嫖提醒#4", `${allMessage2Gp4}`, {
            url: ``
        })
        await $.wait(10 * 1000);
    }
    if ($.isNode() && allMessage2) {
        allMessage2 += RemainMessage;
        await notify.sendNotify("京东白嫖提醒", `${allMessage2}`, {
            url: ``
        })
        await $.wait(10 * 1000);
    }

})()
    .catch((e) => {
        $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
        $.done();
    })
async function showMsg() {
    //if ($.errorMsg)
    //return
    ReturnMessageTitle = "";
    ReturnMessage = "";
    var strsummary = "";
    if (MessageUserGp2) {
        userIndex2 = MessageUserGp2.findIndex((item) => item === $.pt_pin);
    }
    if (MessageUserGp3) {
        userIndex3 = MessageUserGp3.findIndex((item) => item === $.pt_pin);
    }
    if (MessageUserGp4) {
        userIndex4 = MessageUserGp4.findIndex((item) => item === $.pt_pin);
    }

    if (userIndex2 != -1) {
        IndexGp2 += 1;
        ReturnMessageTitle = `【账号${IndexGp2}🆔】${$.UserName}`;
    }
    if (userIndex3 != -1) {
        IndexGp3 += 1;
        ReturnMessageTitle = `【账号${IndexGp3}🆔】${$.UserName}`;
    }
    if (userIndex4 != -1) {
        IndexGp4 += 1;
        ReturnMessageTitle = `【账号${IndexGp4}🆔】${$.UserName}`;
    }
    if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
        IndexAll += 1;
        ReturnMessageTitle = `【账号${IndexAll}🆔】${$.UserName}`;
    }


    if ($.JingXiang||1) {
        if ($.isRealNameAuth)
            if (cookie.includes("app_open"))
                ReturnMessageTitle += `(wskey已实名)\n`;
            else
                ReturnMessageTitle += `(已实名)\n`;
        else
            if (cookie.includes("app_open"))
                ReturnMessageTitle += `(wskey未实名)\n`;
            else
                ReturnMessageTitle += `(未实名)\n`;

    } else {
        ReturnMessageTitle += `\n`;
    }
    if (llShowMonth) {
        ReturnMessageMonth = ReturnMessage;
        ReturnMessageMonth += `\n【上月收入】：${$.allincomeBean}京豆 🐶\n`;
        ReturnMessageMonth += `【上月支出】：${$.allexpenseBean}京豆 🐶\n`;

        console.log(ReturnMessageMonth);

        if (userIndex2 != -1) {
            allMessageMonthGp2 += ReturnMessageMonth + `\n`;
        }
        if (userIndex3 != -1) {
            allMessageMonthGp3 += ReturnMessageMonth + `\n`;
        }
        if (userIndex4 != -1) {
            allMessageMonthGp4 += ReturnMessageMonth + `\n`;
        }
        if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
            allMessageMonth += ReturnMessageMonth + `\n`;
        }
        if ($.isNode() && WP_APP_TOKEN_ONE) {
            try {
                await notify.sendNotifybyWxPucher("京东月资产统计", `${ReturnMessageMonth}`, `${$.UserName}`);
            } catch {
                $.log(`一对一推送异常，请拷贝库里的sendnotify.js文件到deps目录下，在拉库重试！！！\n`);
            }
        }

    }
    if (EnableCheckBean) {
        if (checkbeanDetailMode == 0) {
            ReturnMessage += `【今日京豆】收${$.todayIncomeBean}豆`;
            strsummary += `收${$.todayIncomeBean}豆,`;
            if ($.todayOutcomeBean != 0) {
                ReturnMessage += `,支${$.todayOutcomeBean}豆`;
            }
            ReturnMessage += `\n`;
            ReturnMessage += `【昨日京豆】收${$.incomeBean}豆`;

            if ($.expenseBean != 0) {
                ReturnMessage += `,支${$.expenseBean}豆`;
            }
            ReturnMessage += `\n`;
        } else {
            if (TempBeanCache) {
                ReturnMessage += `【京豆变动】${$.beanCount - $.beanCache}豆(与${matchtitle}${$.CheckTime}比较)`;
                strsummary += `变动${$.beanCount - $.beanCache}豆,`;
                ReturnMessage += `\n`;
            }
            else {
                ReturnMessage += `【京豆变动】未找到缓存,下次出结果统计`;
                ReturnMessage += `\n`;
            }
        }
    }


    if ($.beanCount) {
        ReturnMessage += `【当前京豆】${$.beanCount - $.beanChangeXi}豆(≈${(($.beanCount - $.beanChangeXi) / 100).toFixed(2)}元)\n`;
    } else {
        if ($.levelName || $.JingXiang)
            ReturnMessage += `【当前京豆】获取失败,接口返回空数据\n`;
        else {
            ReturnMessage += `【当前京豆】${$.beanCount - $.beanChangeXi}豆(≈${(($.beanCount - $.beanChangeXi) / 100).toFixed(2)}元)\n`;
        }
    }

    if ($.JDtotalcash) {
        ReturnMessage += `【特价金币】${$.JDtotalcash}币(≈${($.JDtotalcash / 10000).toFixed(2)}元)\n`;
    }
    if ($.ECardinfo)
        ReturnMessage += `【京东 E卡】${$.ECardinfo}元\n`;

    if ($.JoyRunningAmount)
        ReturnMessage += `【汪汪赛跑】${$.JoyRunningAmount}元\n`;

    if ($.JdFarmProdName != "") {
        if ($.JdtreeEnergy != 0) {
            if ($.treeState === 2 || $.treeState === 3) {
                ReturnMessage += `【老农场】${$.JdFarmProdName} 可以兑换了!\n`;
                TempBaipiao += `【老农场】${$.JdFarmProdName} 可以兑换了!\n`;
                if (userIndex2 != -1) {
                    ReceiveMessageGp2 += `【账号${IndexGp2} ${$.UserName}】${$.JdFarmProdName} (老农场)\n`;
                }
                if (userIndex3 != -1) {
                    ReceiveMessageGp3 += `【账号${IndexGp3} ${$.UserName}】${$.JdFarmProdName} (老农场)\n`;
                }
                if (userIndex4 != -1) {
                    ReceiveMessageGp4 += `【账号${IndexGp4} ${$.UserName}】${$.JdFarmProdName} (老农场)\n`;
                }
                if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
                    allReceiveMessage += `【账号${IndexAll} ${$.UserName}】${$.JdFarmProdName} (老农场)\n`;
                }
            } else {
                //if ($.JdwaterD != 'Infinity' && $.JdwaterD != '-Infinity') {
                //ReturnMessage += `【老农场】${$.JdFarmProdName}(${(($.JdtreeEnergy / $.JdtreeTotalEnergy) * 100).toFixed(0)}%,${$.JdwaterD}天)\n`;
                //} else {
                ReturnMessage += `【老农场】${$.JdFarmProdName}(${(($.JdtreeEnergy / $.JdtreeTotalEnergy) * 100).toFixed(0)}%)\n`;

                //}
            }
        } else {
            if ($.treeState === 0) {
                TempBaipiao += `【老农场】水果领取后未重新种植!\n`;

                if (userIndex2 != -1) {
                    WarnMessageGp2 += `【账号${IndexGp2} ${$.UserName}】水果领取后未重新种植! (老农场)\n`;
                }
                if (userIndex3 != -1) {
                    WarnMessageGp3 += `【账号${IndexGp3} ${$.UserName}】水果领取后未重新种植! (老农场)\n`;
                }
                if (userIndex4 != -1) {
                    WarnMessageGp4 += `【账号${IndexGp4} ${$.UserName}】水果领取后未重新种植! (老农场)\n`;
                }
                if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
                    allWarnMessage += `【账号${IndexAll} ${$.UserName}】水果领取后未重新种植! (老农场)\n`;
                }

            } else if ($.treeState === 1) {
                ReturnMessage += `【老农场】${$.JdFarmProdName}种植中...\n`;
            } else {
                TempBaipiao += `【老农场】状态异常!\n`;
                if (userIndex2 != -1) {
                    WarnMessageGp2 += `【账号${IndexGp2} ${$.UserName}】状态异常! (老农场)\n`;
                }
                if (userIndex3 != -1) {
                    WarnMessageGp3 += `【账号${IndexGp3} ${$.UserName}】状态异常! (老农场)\n`;
                }
                if (userIndex4 != -1) {
                    WarnMessageGp4 += `【账号${IndexGp4} ${$.UserName}】状态异常! (老农场)\n`;
                }
                if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
                    allWarnMessage += `【账号${IndexAll} ${$.UserName}】状态异常! (老农场)\n`;
                }
                //ReturnMessage += `【老农场】${$.JdFarmProdName}状态异常${$.treeState}...\n`;
            }
        }
    }
    if ($.fruitnewinfo){
        //ReturnMessage += `【新农场】种植进度${$.fruitnewinfo}\n`;
        if ($.fruitnewinfo.skuName && $.fruitnewinfo.treeFullStage == 5 ){
            ReturnMessage += `【新农场】种植完成!\n`;
            TempBaipiao += `【新农场】种植完成!\n`;
            allReceiveMessage += `【账号${IndexAll} ${$.UserName}】种植完成，去领取吧 (新农场)\n`;
        } else if ($.fruitnewinfo.skuName && $.fruitnewinfo.treeCurrentState === 0){
            ReturnMessage += '【新农场】种植进度' + $.fruitnewinfo.treeFullStage +'/5(' + $.fruitnewinfo.currentProcess+'%)\n';
        } else if ($.fruitnewinfo.treeFullStage === 0){
            ReturnMessage += `【新农场】未种植!\n`;
            //TempBaipiao += `【新农场】未种植!\n`;
            //allWarnMessage += `【账号${IndexAll} ${$.UserName}】未种植，快去种植吧! (新农场)\n`;
        } else {
            ReturnMessage += '【新农场】可能枯萎了，请重新种植！\n';
        }
    } 
    if ($.newfarm_info){
            //ReturnMessage += `【新农场】奖品未兑换!\n`;
            TempBaipiao += `【新农场】奖品未兑换!\n`;
            allReceiveMessage += `【账号${IndexAll} ${$.UserName}】\n ${$.newfarm_info}\n 快去兑换吧 (新农场)\n`;        
    }

    let dwscore = await dwappinfo();
    if (dwscore) {
        let dwappex = await dwappexpire();
        ReturnMessage += `【话费积分】${dwscore}`;
        if (dwappex) {
            ReturnMessage += `(近7日将过期${dwappex})`;
        }
        ReturnMessage += `\n`;
    }
    let marketcard = await marketCard();
    if (marketcard && marketcard.balance != '0.00' ) {
        ReturnMessage += `【超市卡】${marketcard.balance}元`;
        if (marketcard.expirationGiftAmountDes) {
            ReturnMessage += `(${marketcard.expirationGiftAmountDes})`;
        }
        ReturnMessage += `\n`;
    }
    if ($.wb_score != '' ) {
        ReturnMessage += `【汪贝余额】${$.wb_score}个${$.wb_expire!=0?'(近7日将过期'+$.wb_expire+')':''}`;
        ReturnMessage += `\n`;
    }    
    if ($.sqb_info != '' ) {
        ReturnMessage += `【省钱币】${$.sqb_info}`;
        ReturnMessage += `\n`;
    }        
    if ($.jdCash) {
        ReturnMessage += `【其他信息】`;

        if ($.jdCash) {
            ReturnMessage += `领现金:${$.jdCash}元`;
        }

        ReturnMessage += `\n`;

    }

    if(strGuoqi){
		if(new Date().getDay() === 1) {
		    ReturnMessage += `💸💸💸临期京豆明细💸💸💸\n`;
		    ReturnMessage += `${strGuoqi}`;
		}
	}

    ReturnMessage += `${$.message}`;
    strsummary += `红包${$.balance}元`
    if ($.YunFeiQuan) {
        var strTempYF = "【免运费券】" + $.YunFeiQuan + "张";
        if ($.YunFeiQuanEndTime)
            strTempYF += "(有效期至" + $.YunFeiQuanEndTime + ")";
        strTempYF += "\n";
        ReturnMessage += strTempYF
    }
    if ($.YunFeiQuan2) {
        var strTempYF2 = "【免运费券】" + $.YunFeiQuan2 + "张";
        if ($.YunFeiQuanEndTime2)
            strTempYF += "(有效期至" + $.YunFeiQuanEndTime2 + ")";
        strTempYF2 += "\n";
        ReturnMessage += strTempYF2
    }

    if (userIndex2 != -1) {
        allMessageGp2 += ReturnMessageTitle + ReturnMessage + `\n`;
    }
    if (userIndex3 != -1) {
        allMessageGp3 += ReturnMessageTitle + ReturnMessage + `\n`;
    }
    if (userIndex4 != -1) {
        allMessageGp4 += ReturnMessageTitle + ReturnMessage + `\n`;
    }
    if (userIndex2 == -1 && userIndex3 == -1 && userIndex4 == -1) {
        allMessage += ReturnMessageTitle + ReturnMessage + `\n`;
    }

    console.log(`${ReturnMessageTitle + ReturnMessage}`);

    if ($.isNode() && WP_APP_TOKEN_ONE) {
        var strTitle = "京东资产统计";
        if ($.JingXiang||1) {
            if ($.isRealNameAuth)
                if (cookie.includes("app_open"))
                    ReturnMessage = `【账号名称】${$.UserName}(wskey已实名)\n` + ReturnMessage;
                else
                    ReturnMessage = `【账号名称】${$.UserName}(已实名)\n` + ReturnMessage;
            else
                if (cookie.includes("app_open"))
                    ReturnMessage = `【账号名称】${$.UserName}(wskey未实名)\n` + ReturnMessage;
                else
                    ReturnMessage = `【账号名称】${$.UserName}(未实名)\n` + ReturnMessage;

        } else {
            ReturnMessage = `【账号名称】${$.UserName}\n` + ReturnMessage;
        }
        if (TempBaipiao) {
            TempBaipiao = `【⏰商品白嫖活动提醒⏰】\n` + TempBaipiao;
            ReturnMessage = TempBaipiao + `\n` + ReturnMessage;
        }

        ReturnMessage += RemainMessage;

        if (strAllNotify)
            ReturnMessage = strAllNotify + `\n` + ReturnMessage;
        try {
            await notify.sendNotifybyWxPucher(strTitle, `${ReturnMessage}`, `${$.UserName}`, undefined, strsummary);
        } catch {
            $.log(`一对一推送异常，请拷贝库里的sendnotify.js文件到deps目录下，在拉库重试！！！\n`);
        }
    }

    //$.msg($.name, '', ReturnMessage , {"open-url": "https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean"});
}
async function bean() {

    if (EnableCheckBean && checkbeanDetailMode == 0) {

        // console.log(`北京时间零点时间戳:${parseInt((Date.now() + 28800000) / 86400000) * 86400000 - 28800000}`);
        // console.log(`北京时间2020-10-28 06:16:05::${new Date("2020/10/28 06:16:05+08:00").getTime()}`)
        // 不管哪个时区。得到都是当前时刻北京时间的时间戳 new Date().getTime() + new Date().getTimezoneOffset()*60*1000 + 8*60*60*1000

        //前一天的0:0:0时间戳
        const tm = parseInt((Date.now() + 28800000) / 86400000) * 86400000 - 28800000 - (24 * 60 * 60 * 1000);
        // 今天0:0:0时间戳
        const tm1 = parseInt((Date.now() + 28800000) / 86400000) * 86400000 - 28800000;
        let page = 1,
            t = 0,
            yesterdayArr = [],
            todayArr = [];
        do {
            let response = await getJingBeanBalanceDetail(page);
            await $.wait(1000);
            // console.log(`第${page}页: ${JSON.stringify(response)}`);
            if (response && response.code === "0") {
                page++;
                let detailList = response.jingDetailList;
                if (detailList && detailList.length > 0) {
                    for (let item of detailList) {
                        const date = item.date.replace(/-/g, '/') + "+08:00";
                        if (new Date(date).getTime() >= tm1 && (!item['eventMassage'].includes("退还") && !item['eventMassage'].includes("物流") && !item['eventMassage'].includes('扣赠'))) {
                            todayArr.push(item);
                        } else if (tm <= new Date(date).getTime() && new Date(date).getTime() < tm1 && (!item['eventMassage'].includes("退还") && !item['eventMassage'].includes("物流") && !item['eventMassage'].includes('扣赠'))) {
                            //昨日的
                            yesterdayArr.push(item);
                        } else if (tm > new Date(date).getTime()) {
                            //前天的
                            t = 1;
                            break;
                        }
                    }
                } else {
                    $.errorMsg = `数据异常`;
                    $.msg($.name, ``, `账号${$.index}：${$.nickName}\n${$.errorMsg}`);
                    t = 1;
                }
            } else if (response && response.code === "3") {
                console.log(`cookie已过期，或者填写不规范，跳出`)
                t = 1;
            } else {
                console.log(`未知情况：${JSON.stringify(response)}`);
                console.log(`未知情况，跳出`)
                t = 1;
            }
        } while (t === 0);
        for (let item of yesterdayArr) {
            if (Number(item.amount) > 0) {
                $.incomeBean += Number(item.amount);
            } else if (Number(item.amount) < 0) {
                $.expenseBean += Number(item.amount);
            }
        }
        for (let item of todayArr) {
            if (Number(item.amount) > 0) {
                $.todayIncomeBean += Number(item.amount);
            } else if (Number(item.amount) < 0) {
                $.todayOutcomeBean += Number(item.amount);
            }
        }
        $.todayOutcomeBean = -$.todayOutcomeBean;
        $.expenseBean = -$.expenseBean;
    }

    if (EnableOverBean) {
        await jingBeanDetail(); //过期京豆	    
    }
    await redPacket();
    if (EnableChaQuan)
        await getCoupon();
}

async function Monthbean() {
    let time = new Date();
    let year = time.getFullYear();
    let month = parseInt(time.getMonth()); //取上个月
    if (month == 0) {
        //一月份，取去年12月，所以月份=12，年份减1
        month = 12;
        year -= 1;
    }

    //开始时间 时间戳
    let start = new Date(year + "-" + month + "-01 00:00:00").getTime();
    console.log(`计算月京豆起始日期:` + GetDateTime(new Date(year + "-" + month + "-01 00:00:00")));

    //结束时间 时间戳
    if (month == 12) {
        //取去年12月，进1个月，所以月份=1，年份加1
        month = 1;
        year += 1;
    }
    let end = new Date(year + "-" + (month + 1) + "-01 00:00:00").getTime();
    console.log(`计算月京豆结束日期:` + GetDateTime(new Date(year + "-" + (month + 1) + "-01 00:00:00")));

    let allpage = 1,
        allt = 0,
        allyesterdayArr = [];
    do {
        let response = await getJingBeanBalanceDetail(allpage);
        await $.wait(1000);
        // console.log(`第${allpage}页: ${JSON.stringify(response)}`);
        if (response && response.code === "0") {
            allpage++;
            let detailList = response.jingDetailList;
            if (detailList && detailList.length > 0) {
                for (let item of detailList) {
                    const date = item.date.replace(/-/g, '/') + "+08:00";
                    if (start <= new Date(date).getTime() && new Date(date).getTime() < end) {
                        //日期区间内的京豆记录
                        allyesterdayArr.push(item);
                    } else if (start > new Date(date).getTime()) {
                        //前天的
                        allt = 1;
                        break;
                    }
                }
            } else {
                $.errorMsg = `数据异常`;
                $.msg($.name, ``, `账号${$.index}：${$.nickName}\n${$.errorMsg}`);
                allt = 1;
            }
        } else if (response && response.code === "3") {
            console.log(`cookie已过期，或者填写不规范，跳出`)
            allt = 1;
        } else {
            console.log(`未知情况：${JSON.stringify(response)}`);
            console.log(`未知情况，跳出`)
            allt = 1;
        }
    } while (allt === 0);

    for (let item of allyesterdayArr) {
        if (Number(item.amount) > 0) {
            $.allincomeBean += Number(item.amount);
        } else if (Number(item.amount) < 0) {
            $.allexpenseBean += Number(item.amount);
        }
    }

}


function apptaskUrl(functionId = "", body = "") {
    return {
        url: `${JD_API_HOST}?functionId=${functionId}`,
        body,
        headers: {
            'Cookie': cookie,
            'Host': 'api.m.jd.com',
            'Connection': 'keep-alive',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': '',
            'User-Agent': 'JD4iPhone/167774 (iPhone; iOS 14.7.1; Scale/3.00)',
            'Accept-Language': 'zh-Hans-CN;q=1',
            'Accept-Encoding': 'gzip, deflate, br',
        },
        timeout: 10000
    }
}

function TotalBean() {
    return new Promise(async resolve => {
        const options = {
            "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
            "headers": {
                "Accept": "application/json,text/plain, */*",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "zh-cn",
                "Connection": "keep-alive",
                "Cookie": cookie,
                "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
                "User-Agent": $.UA
            }
        }
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`TotalBean API请求失败，请检查网路重试`)
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        if (data['retcode'] === 13) {
                            $.isLogin = false; //cookie过期
                            return
                        }
                        if (data['retcode'] === 0) {
                            //$.nickName = (data['base'] && data['base'].nickname) || $.UserName;
							$.nickName = $.UserName;
                            //$.isPlusVip=data['isPlusVip'];
                            $.isRealNameAuth = data['isRealNameAuth'];
                            $.beanCount = (data['base'] && data['base'].jdNum) || 0;
                            $.JingXiang = (data['base'] && data['base'].jvalue) || 0;
                        } else {
                            $.nickName = $.UserName
                        }



                    } else {
                        console.log(`京东服务器返回空数据`)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve();
            }
        })
    })
}

function TotalBean2() {
    return new Promise(async (resolve) => {
        const options = {
            url: `https://wxapp.m.jd.com/kwxhome/myJd/home.json?&useGuideModule=0&bizId=&brandId=&fromType=wxapp&timestamp=${Date.now()}`,
            headers: {
                Cookie: cookie,
                'content-type': `application/x-www-form-urlencoded`,
                Connection: `keep-alive`,
                'Accept-Encoding': `gzip,compress,br,deflate`,
                Referer: `https://servicewechat.com/wxa5bf5ee667d91626/161/page-frame.html`,
                Host: `wxapp.m.jd.com`,
                'User-Agent': `Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.10(0x18000a2a) NetType/WIFI Language/zh_CN`,
            },
            timeout: 10000
        };
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    $.logErr(err);
                } else {
                    if (data) {
                        data = JSON.parse(data);

                        if (!data.user) {
                            return;
                        }
                        const userInfo = data.user;
                        if (userInfo) {
                            if (!$.nickName)
                                $.nickName = userInfo.petName;
                            if ($.beanCount == 0) {
                                $.beanCount = userInfo.jingBean;
                            }
                            $.JingXiang = userInfo.uclass;
                        }
                    } else {
                        $.log('京东服务器返回空数据');
                    }
                }
            } catch (e) {
                $.logErr(e);
            }
            finally {
                resolve();
            }
        });
    });
}


function isLoginByX1a0He() {
    return new Promise((resolve) => {
        const options = {
            url: 'https://plogin.m.jd.com/cgi-bin/ml/islogin',
            headers: {
                "Cookie": cookie,
                "referer": "https://h5.m.jd.com/",
                "User-Agent": "jdapp;iPhone;10.1.2;15.0;network/wifi;Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
            },
            timeout: 10000
        }
        $.get(options, (err, resp, data) => {
            try {
                if (data) {
                    data = JSON.parse(data);
                    if (data.islogin === "1") {
                        console.log(`使用X1a0He写的接口加强检测: Cookie有效\n`)
                    } else if (data.islogin === "0") {
                        $.isLogin = false;
                        console.log(`使用X1a0He写的接口加强检测: Cookie无效\n`)
                    } else {
                        console.log(`使用X1a0He写的接口加强检测: 未知返回，不作变更...\n`)
                        $.error = `${$.nickName} :` + `使用X1a0He写的接口加强检测: 未知返回...\n`
                    }
                }
            } catch (e) {
                console.log(e);
            }
            finally {
                resolve();
            }
        });
    });
}

function getJingBeanBalanceDetail(page) {
    return new Promise(async resolve => {
        const options = {
            "url": `https://bean.m.jd.com/beanDetail/detail.json?page=${page}`,
            "body": `body=${escape(JSON.stringify({ "pageSize": "20", "page": page.toString() }))}&appid=ld`,
            "headers": {
                'User-Agent': $.UA,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookie,
            }
        }
        $.post(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`getJingBeanBalanceDetail API请求失败，请检查网路重试`)
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        // console.log(data)
                    } else {
                        // console.log(`京东服务器返回空数据`)
                    }
                }
            } catch (e) {
                // $.logErr(e, resp)
            } finally {
                resolve(data);
            }
        })
    })
}

function jingBeanDetail() {
    return new Promise(async resolve => {
        setTimeout(async () => {
            var strsign = "";
            if (epsignurl) {
                strsign = await getepsign('jingBeanDetail', { "pageSize": "20", "page": "1" });
                strsign = strsign.body;
            }
            else
                strsign = await dyx.getbody('jingBeanDetail', { "pageSize": "20", "page": "1" });

            const options = {
                "url": `https://api.m.jd.com/client.action?functionId=jingBeanDetail`,
                "body": strsign,
                "headers": {
                    'User-Agent': $.UA,
                    'Host': 'api.m.jd.com',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': cookie,
                }
            }
            $.post(options, (err, resp, data) => {
                try {
                    if (err) {
                        console.log(`${JSON.stringify(err)}`)
                        console.log(`${$.name} jingBeanDetail API请求失败，请检查网路重试`)
                    } else {
                        if (data) {
                            data = JSON.parse(data);
                            if (data?.others?.jingBeanExpiringInfo?.detailList) {
                                const { detailList = [] } = data?.others?.jingBeanExpiringInfo;
                                detailList.map(item => {
                                    strGuoqi += `【${(item['eventMassage']).replace("即将过期京豆", "").replace("年", "-").replace("月", "-").replace("日", "")}】过期${item['amount']}豆\n`;
                                })
                            }
                        } else {
                            console.log(`jingBeanDetail 京东服务器返回空数据`)
                        }
                    }
                } catch (e) {
                    if (epsignurl)
                        $.logErr(e, resp)
                    else
                        console.log("因为没有指定带ep的Sign,获取过期豆子信息次数多了就会失败.")
                } finally {
                    resolve(data);
                }
            })
        }, 0 * 1000);
    })
}

function getepsign(n, o, t = "sign") {
    let e = {
        url: epsignurl,
        form: {
            functionId: n, body: $.toStr(o),
        }, headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    };
    return new Promise(n => {
        $.post(e, async (o, t, e) => {
            try {
                o ? console.log(o) : e = JSON.parse(e)
                if (e.code === 200 && e.data) {
                    n({ body: e.data.convertUrlNew })
                }
            } catch (n) {
                $.logErr(n, t)
            } finally {
                n({ body: e.convertUrlNew })
            }
        })
    })
}

function getSignfromNolan(functionId, body) {
    var strsign = '';
    let data = {
        "fn": functionId,
        "body": body
    }
    return new Promise((resolve) => {
        let url = {
            url: jdSignUrl,
            body: JSON.stringify(data),
            followRedirect: false,
            headers: {
                'Accept': '*/*',
                "accept-encoding": "gzip, deflate, br",
                'Content-Type': 'application/json'
            },
            timeout: 30000
        }
        $.post(url, async (err, resp, data) => {
            try {
                data = JSON.parse(data);
                if (data && data.body) {
                    if (data.body)
                        strsign = data.body || '';
                    if (strsign != '')
                        resolve(strsign);
                    else
                        console.log("签名获取失败.");
                } else {
                    console.log("签名获取失败.");
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve(strsign);
            }
        })
    })
}


function redPacket() {
    return new Promise(async resolve => {
        const options = {
            "url": `https://api.m.jd.com/client.action?functionId=myhongbao_getUsableHongBaoList&body=%7B%22appId%22%3A%22appHongBao%22%2C%22appToken%22%3A%22apphongbao_token%22%2C%22platformId%22%3A%22appHongBao%22%2C%22platformToken%22%3A%22apphongbao_token%22%2C%22platform%22%3A%221%22%2C%22orgType%22%3A%222%22%2C%22country%22%3A%22cn%22%2C%22childActivityId%22%3A%22-1%22%2C%22childActiveName%22%3A%22-1%22%2C%22childActivityTime%22%3A%22-1%22%2C%22childActivityUrl%22%3A%22-1%22%2C%22openId%22%3A%22-1%22%2C%22activityArea%22%3A%22-1%22%2C%22applicantErp%22%3A%22-1%22%2C%22eid%22%3A%22-1%22%2C%22fp%22%3A%22-1%22%2C%22shshshfp%22%3A%22-1%22%2C%22shshshfpa%22%3A%22-1%22%2C%22shshshfpb%22%3A%22-1%22%2C%22jda%22%3A%22-1%22%2C%22activityType%22%3A%221%22%2C%22isRvc%22%3A%22-1%22%2C%22pageClickKey%22%3A%22-1%22%2C%22extend%22%3A%22-1%22%2C%22organization%22%3A%22JD%22%7D&appid=JDReactMyRedEnvelope&client=apple&clientVersion=7.0.0`,
            "headers": {
                'Host': 'api.m.jd.com',
                'Accept': '*/*',
                'Connection': 'keep-alive',
                'Accept-Language': 'zh-cn',
                'Referer': 'https://h5.m.jd.com/',
                'Accept-Encoding': 'gzip, deflate, br',
                "Cookie": cookie,
                'User-Agent': $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1")
            }
        }
        $.get(options, (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`redPacket API请求失败，请检查网路重试`)
                } else {
                    if (data) {
                        data = JSON.parse(data);
                        $.jxRed = 0,
                            $.jsRed = 0,
                            $.jdRed = 0,
                            $.jdhRed = 0,
                            $.jdwxRed = 0,
                            $.jdGeneralRed = 0,
                            $.jxRedExpire = 0,
                            $.jsRedExpire = 0,
                            $.jdRedExpire = 0,
                            $.jdhRedExpire = 0;
                        $.jdwxRedExpire = 0,
                            $.jdGeneralRedExpire = 0

                        let t = new Date();
                        t.setDate(t.getDate() + 1);
                        t.setHours(0, 0, 0, 0);
                        t = parseInt((t - 1) / 1000) * 1000;

                        for (let vo of data.hongBaoList || []) {
                            if (vo.orgLimitStr) {
                                if (vo.orgLimitStr.includes("京喜") && !vo.orgLimitStr.includes("特价")) {
                                    $.jxRed += parseFloat(vo.balance)
                                    if (vo['endTime'] === t) {
                                        $.jxRedExpire += parseFloat(vo.balance)
                                    }
                                    continue;
                                } else if (vo.orgLimitStr.includes("购物小程序")) {
                                    $.jdwxRed += parseFloat(vo.balance)
                                    if (vo['endTime'] === t) {
                                        $.jdwxRedExpire += parseFloat(vo.balance)
                                    }
                                    continue;
                                } else if (vo.orgLimitStr.includes("京东商城")) {
                                    $.jdRed += parseFloat(vo.balance)
                                    if (vo['endTime'] === t) {
                                        $.jdRedExpire += parseFloat(vo.balance)
                                    }
                                    continue;
                                } else if (vo.orgLimitStr.includes("极速") || vo.orgLimitStr.includes("京东特价") || vo.orgLimitStr.includes("京喜特价")) {
                                    $.jsRed += parseFloat(vo.balance)
                                    if (vo['endTime'] === t) {
                                        $.jsRedExpire += parseFloat(vo.balance)
                                    }
                                    continue;
                                } else if (vo.orgLimitStr && vo.orgLimitStr.includes("京东健康")) {
                                    $.jdhRed += parseFloat(vo.balance)
                                    if (vo['endTime'] === t) {
                                        $.jdhRedExpire += parseFloat(vo.balance)
                                    }
                                    continue;
                                }
                            }
                            $.jdGeneralRed += parseFloat(vo.balance)
                            if (vo['endTime'] === t) {
                                $.jdGeneralRedExpire += parseFloat(vo.balance)
                            }
                        }

                        $.balance = ($.jxRed + $.jsRed + $.jdRed + $.jdhRed + $.jdwxRed + $.jdGeneralRed).toFixed(2);
                        $.jxRed = $.jxRed.toFixed(2);
                        $.jsRed = $.jsRed.toFixed(2);
                        $.jdRed = $.jdRed.toFixed(2);
                        $.jdhRed = $.jdhRed.toFixed(2);
                        $.jdwxRed = $.jdwxRed.toFixed(2);
                        $.jdGeneralRed = $.jdGeneralRed.toFixed(2);
                        $.expiredBalance = ($.jxRedExpire + $.jsRedExpire + $.jdRedExpire + $.jdhRedExpire + $.jdwxRedExpire + $.jdGeneralRedExpire).toFixed(2);
                        $.message += `【红包总额🧧】${$.balance}元(今日总过期${$.expiredBalance}) \n`;

                    } else {
                        console.log(`京东服务器返回空数据`)
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            }
            finally {
                resolve(data);
            }
        })
    })
}

function getCoupon() {
    return new Promise(resolve => {
        let options = {
            url: `https://wq.jd.com/activeapi/queryjdcouponlistwithfinance?state=1&wxadd=1&filterswitch=1&_=${Date.now()}&sceneval=2&g_login_type=1&callback=jsonpCBKB&g_ty=ls`,
            headers: {
                'authority': 'wq.jd.com',
                "User-Agent": $.UA,
                'accept': '*/*',
                'referer': 'https://wqs.jd.com/',
                'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'cookie': cookie
            },
            timeout: 10000
        }
        $.get(options, async (err, resp, data) => {
            try {
                data = JSON.parse(data.match(new RegExp(/jsonpCBK.?\((.*);*/))[1]);
                let couponTitle = '';
                let couponId = '';
                // 删除可使用且非超市、生鲜、京贴;
                let useable = data.coupon.useable;
                $.todayEndTime = new Date(new Date(new Date().getTime()).setHours(23, 59, 59, 999)).getTime();
                $.tomorrowEndTime = new Date(new Date(new Date().getTime() + 24 * 60 * 60 * 1000).setHours(23, 59, 59, 999)).getTime();
                $.platFormInfo = "";
                for (let i = 0; i < useable.length; i++) {
                    //console.log(useable[i]);
                    if (useable[i].limitStr.indexOf('全品类') > -1) {
                        $.beginTime = useable[i].beginTime;
                        if ($.beginTime < new Date().getTime() && useable[i].quota <= 100 && useable[i].coupontype === 1) {
                            //$.couponEndTime = new Date(parseInt(useable[i].endTime)).Format('yyyy-MM-dd');
                            $.couponName = useable[i].limitStr;
                            if (useable[i].platFormInfo)
                                $.platFormInfo = useable[i].platFormInfo;

                            var decquota = parseFloat(useable[i].quota).toFixed(2);
                            var decdisc = parseFloat(useable[i].discount).toFixed(2);
                            if (useable[i].quota > useable[i].discount + 5 && useable[i].discount < 2)
                                continue
                            $.message += `【全品类券】满${decquota}减${decdisc}元`;

                            if (useable[i].endTime < $.todayEndTime) {
                                $.message += `(今日过期,${$.platFormInfo})\n`;
                            } else if (useable[i].endTime < $.tomorrowEndTime) {
                                $.message += `(明日将过期,${$.platFormInfo})\n`;
                            } else {
                                $.message += `(${$.platFormInfo})\n`;
                            }

                        }
                    }
                    if (useable[i].couponTitle.indexOf('运费券') > -1 && useable[i].limitStr.indexOf('自营商品运费') > -1) {
                        if (!$.YunFeiTitle) {
                            $.YunFeiTitle = useable[i].couponTitle;
                            $.YunFeiQuanEndTime = new Date(parseInt(useable[i].endTime)).Format('yyyy-MM-dd');
                            $.YunFeiQuan += 1;
                        } else {
                            if ($.YunFeiTitle == useable[i].couponTitle) {
                                $.YunFeiQuanEndTime = new Date(parseInt(useable[i].endTime)).Format('yyyy-MM-dd');
                                $.YunFeiQuan += 1;
                            } else {
                                if (!$.YunFeiTitle2)
                                    $.YunFeiTitle2 = useable[i].couponTitle;

                                if ($.YunFeiTitle2 == useable[i].couponTitle) {
                                    $.YunFeiQuanEndTime2 = new Date(parseInt(useable[i].endTime)).Format('yyyy-MM-dd');
                                    $.YunFeiQuan2 += 1;
                                }
                            }

                        }

                    }
                    if (useable[i].couponTitle.indexOf('特价版APP活动') > -1 && useable[i].limitStr == '仅可购买活动商品') {
                        $.beginTime = useable[i].beginTime;
                        if ($.beginTime < new Date().getTime() && useable[i].coupontype === 1) {
                            if (useable[i].platFormInfo)
                                $.platFormInfo = useable[i].platFormInfo;
                            var decquota = parseFloat(useable[i].quota).toFixed(2);
                            var decdisc = parseFloat(useable[i].discount).toFixed(2);

                            $.message += `【特价版券】满${decquota}减${decdisc}元`;

                            if (useable[i].endTime < $.todayEndTime) {
                                $.message += `(今日过期,${$.platFormInfo})\n`;
                            } else if (useable[i].endTime < $.tomorrowEndTime) {
                                $.message += `(明日将过期,${$.platFormInfo})\n`;
                            } else {
                                $.message += `(${$.platFormInfo})\n`;
                            }

                        }

                    }
                    //8是支付券， 7是白条券
                    if (useable[i].couponStyle == 7 || useable[i].couponStyle == 8) {
                        $.beginTime = useable[i].beginTime;
                        if ($.beginTime > new Date().getTime() || useable[i].quota > 50 || useable[i].coupontype != 1) {
                            continue;
                        }

                        if (useable[i].couponStyle == 8) {
                            $.couponType = "支付立减";
                        } else {
                            $.couponType = "白条优惠";
                        }
                        if (useable[i].discount < useable[i].quota)
                            $.message += `【${$.couponType}】满${useable[i].quota}减${useable[i].discount}元`;
                        else
                            $.message += `【${$.couponType}】立减${useable[i].discount}元`;
                        if (useable[i].platFormInfo)
                            $.platFormInfo = useable[i].platFormInfo;

                        //$.couponEndTime = new Date(parseInt(useable[i].endTime)).Format('yyyy-MM-dd');

                        if (useable[i].endTime < $.todayEndTime) {
                            $.message += `(今日过期,${$.platFormInfo})\n`;
                        } else if (useable[i].endTime < $.tomorrowEndTime) {
                            $.message += `(明日将过期,${$.platFormInfo})\n`;
                        } else {
                            $.message += `(${$.platFormInfo})\n`;
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp);
            }
            finally {
                resolve();
            }
        })
    })
}

function jdfruitRequest(function_id, body = {}, timeout = 1000) {
    return new Promise(resolve => {
        setTimeout(() => {
            $.get(taskfruitUrl(function_id, body), (err, resp, data) => {
                try {
                    if (err) {
                        console.log('\n老农场: API查询请求失败 ‼️‼️')
                        console.log(JSON.stringify(err));
                        console.log(`function_id:${function_id}`)
                        $.logErr(err);
                    } else {
                        if (safeGet(data)) {
                            data = JSON.parse(data);
                            if (data.code == "400") {
                                console.log('老农场: ' + data.message);
                                llgeterror = true;
                            }
                            else
                                $.JDwaterEveryDayT = data.firstWaterInit.totalWaterTimes;
                        }
                    }
                } catch (e) {
                    $.logErr(e, resp);
                }
                finally {
                    resolve(data);
                }
            })
        }, timeout)
    })
}

async function getjdfruitinfo() {
    if (EnableJdFruit) {
        llgeterror = false;

        //await jdfruitRequest('taskInitForFarm', {
        //    "version": 14,
        //    "channel": 1,
        //    "babelChannel": "120"
        //});
        //
        //if (llgeterror)
        //	return
        //
        await fruitinfo();
        if (llgeterror) {
            console.log(`老农场API查询失败,等待10秒后再次尝试...`)
            await $.wait(10 * 1000);
            await fruitinfo();
        }
        if (llgeterror) {
            console.log(`老农场API查询失败,有空重启路由器换个IP吧.`)
        }

    }
    return;
}

async function getjdfruit() {
    return new Promise(resolve => {
        const option = {
            url: `${JD_API_HOST}?functionId=initForFarm`,
            body: `body=${escape(JSON.stringify({ "version": 4 }))}&appid=wh5&clientVersion=9.1.0`,
            headers: {
                "accept": "*/*",
                "accept-encoding": "gzip, deflate, br",
                "accept-language": "zh-CN,zh;q=0.9",
                "cache-control": "no-cache",
                "cookie": cookie,
                "origin": "https://home.m.jd.com",
                "pragma": "no-cache",
                "referer": "https://home.m.jd.com/myJd/newhome.action",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-site",
                "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
                "Content-Type": "application/x-www-form-urlencoded"
            },
            timeout: 10000
        };
        $.post(option, (err, resp, data) => {
            try {
                if (err) {
                    if (!llgeterror) {
                        console.log('\n老农场: API查询请求失败 ‼️‼️');
                        console.log(JSON.stringify(err));
                    }
                    llgeterror = true;
                } else {
                    llgeterror = false;
                    if (safeGet(data)) {
                        $.farmInfo = JSON.parse(data)
                        if ($.farmInfo.farmUserPro) {
                            $.JdFarmProdName = $.farmInfo.farmUserPro.name;
                            $.JdtreeEnergy = $.farmInfo.farmUserPro.treeEnergy;
                            $.JdtreeTotalEnergy = $.farmInfo.farmUserPro.treeTotalEnergy;
                            $.treeState = $.farmInfo.treeState;
                            let waterEveryDayT = $.JDwaterEveryDayT;
                            let waterTotalT = ($.farmInfo.farmUserPro.treeTotalEnergy - $.farmInfo.farmUserPro.treeEnergy) / 10; //一共还需浇多少次水
                            let waterD = Math.ceil(waterTotalT / waterEveryDayT);

                            $.JdwaterTotalT = waterTotalT;
                            $.JdwaterD = waterD;
                        }
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            }
            finally {
                resolve();
            }
        })
    })
}

function taskfruitUrl(function_id, body = {}) {
    return {
        url: `${JD_API_HOST}?functionId=${function_id}&body=${encodeURIComponent(JSON.stringify(body))}&appid=wh5`,
        headers: {
            "Host": "api.m.jd.com",
            "Accept": "*/*",
            "Origin": "https://carry.m.jd.com",
            "Accept-Encoding": "gzip, deflate, br",
            "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
            "Accept-Language": "zh-CN,zh-Hans;q=0.9",
            "Referer": "https://carry.m.jd.com/",
            "Cookie": cookie
        },
        timeout: 10000
    }
}

function safeGet(data) {
    try {
        if (typeof JSON.parse(data) == "object") {
            return true;
        }
    } catch (e) {
        console.log(e);
        console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
        return false;
    }
}



function taskcashUrl(functionId, body = {}) {
    const struuid = randomString(16);
    let nowTime = Date.now();
    let _0x7683x5 = `${"lite-android&"}${JSON["stringify"](body)}${"&android&3.1.0&"}${functionId}&${nowTime}&${struuid}`;
    let _0x7683x6 = "12aea658f76e453faf803d15c40a72e0";
    const _0x7683x7 = $["isNode"]() ? require("crypto-js") : CryptoJS;
    let sign = _0x7683x7.HmacSHA256(_0x7683x5, _0x7683x6).toString();
    let strurl = JD_API_HOST + "api?functionId=" + functionId + "&body=" + `${escape(JSON["stringify"](body))}&appid=lite-android&client=android&uuid=` + struuid + `&clientVersion=3.1.0&t=${nowTime}&sign=${sign}`;
    return {
        url: strurl,
        headers: {
            'Host': "api.m.jd.com",
            'accept': "*/*",
            'kernelplatform': "RN",
            'user-agent': "JDMobileLite/3.1.0 (iPad; iOS 14.4; Scale/2.00)",
            'accept-language': "zh-Hans-CN;q=1, ja-CN;q=0.9",
            'Cookie': cookie
        },
        timeout: 10000
    }
}

function randomString(e) {
    e = e || 32;
    let t = "0123456789abcdef",
        a = t.length,
        n = "";
    for (let i = 0; i < e; i++)
        n += t.charAt(Math.floor(Math.random() * a));
    return n
}

Date.prototype.Format = function (fmt) {
    var e,
        n = this,
        d = fmt,
        l = {
            "M+": n.getMonth() + 1,
            "d+": n.getDate(),
            "D+": n.getDate(),
            "h+": n.getHours(),
            "H+": n.getHours(),
            "m+": n.getMinutes(),
            "s+": n.getSeconds(),
            "w+": n.getDay(),
            "q+": Math.floor((n.getMonth() + 3) / 3),
            "S+": n.getMilliseconds()
        };
    /(y+)/i.test(d) && (d = d.replace(RegExp.$1, "".concat(n.getFullYear()).substr(4 - RegExp.$1.length)));
    for (var k in l) {
        if (new RegExp("(".concat(k, ")")).test(d)) {
            var t,
                a = "S+" === k ? "000" : "00";
            d = d.replace(RegExp.$1, 1 == RegExp.$1.length ? l[k] : ("".concat(a) + l[k]).substr("".concat(l[k]).length))
        }
    }
    return d;
}

function jsonParse(str) {
    if (typeof str == "string") {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.log(e);
            $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
            return [];
        }
    }
}
function timeFormat(time) {
    let date;
    if (time) {
        date = new Date(time)
    } else {
        date = new Date();
    }
    return date.getFullYear() + '-' + ((date.getMonth() + 1) >= 10 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)) + '-' + (date.getDate() >= 10 ? date.getDate() : '0' + date.getDate());
}


function GetDateTime(date) {

    var timeString = "";

    var timeString = date.getFullYear() + "-";
    if ((date.getMonth() + 1) < 10)
        timeString += "0" + (date.getMonth() + 1) + "-";
    else
        timeString += (date.getMonth() + 1) + "-";

    if ((date.getDate()) < 10)
        timeString += "0" + date.getDate() + " ";
    else
        timeString += date.getDate() + " ";

    if ((date.getHours()) < 10)
        timeString += "0" + date.getHours() + ":";
    else
        timeString += date.getHours() + ":";

    if ((date.getMinutes()) < 10)
        timeString += "0" + date.getMinutes() + ":";
    else
        timeString += date.getMinutes() + ":";

    if ((date.getSeconds()) < 10)
        timeString += "0" + date.getSeconds();
    else
        timeString += date.getSeconds();

    return timeString;
}

async function getuserinfo() {
    var body = [{ "pin": "$cooMrdGatewayUid$" }];
    var ua = `jdapp;iPhone;${random(["11.1.0", "10.5.0", "10.3.6"])};${random(["13.5", "14.0", "15.0"])};${uuidRandom()};network/wifi;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone11,6;addressid/7565095847;supportBestPay/0;appBuild/167541;jdSupportDarkMode/0;Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1`;

    let config = {
        url: 'https://lop-proxy.jd.com/JingIntegralApi/userAccount',
        body: JSON.stringify(body),
        headers: {
            "host": "lop-proxy.jd.com",
            "jexpress-report-time": Date.now().toString(),
            "access": "H5",
            "source-client": "2",
            "accept": "application/json, text/plain, */*",
            "d_model": "iPhone11,6",
            "accept-encoding": "gzip",
            "lop-dn": "jingcai.jd.com",
            "user-agent": ua,
            "partner": "",
            "screen": "375*812",
            "cookie": cookie,
            "x-requested-with": "XMLHttpRequest",
            "version": "1.0.0",
            "uuid": randomNumber(10),
            "clientinfo": "{\"appName\":\"jingcai\",\"client\":\"m\"}",
            "d_brand": "iPhone",
            "appparams": "{\"appid\":158,\"ticket_type\":\"m\"}",
            "sdkversion": "1.0.7",
            "area": area(),
            "client": "iOS",
            "referer": "https://jingcai-h5.jd.com/",
            "eid": "",
            "osversion": random(["13.5", "14.0", "15.0"]),
            "networktype": "wifi",
            "jexpress-trace-id": uuid(),
            "origin": "https://jingcai-h5.jd.com",
            "app-key": "jexpress",
            "event-id": uuid(),
            "clientversion": random(["11.1.0", "10.5.0", "10.3.6"]),
            "content-type": "application/json;charset=utf-8",
            "build": "167541",
            "biz-type": "service-monitor",
            "forcebot": "0"
        }
    }
    return new Promise(resolve => {
        $.post(config, async (err, resp, data) => {
            try {
                //console.log(data)
                if (err) {
                    console.log(err)
                } else {
                    data = JSON.parse(data);
                }
            } catch (e) {
                $.logErr(e, resp)
            }
            finally {
                resolve(data || '');
            }
        })
    })
}
function dwappinfo() {
    let ts = Date.now();
    let opt = {
        url: `https://dwapp.jd.com/user/dwSignInfo`,
        body: JSON.stringify({ "t": ts, "channelSource": "txzs", "encStr": CR.MD5(ts + 'e9c398ffcb2d4824b4d0a703e38yffdd').toString() }),
        headers: {
            'Origin': 'https://txsm-m.jd.com',
            'Content-Type': 'application/json',
            'User-Agent': $.UA,
            'Cookie': cookie
        }
    }
    return new Promise(async (resolve) => {
        $.post(opt, async (err, resp, data) => {
            let ccc = '';
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`dwappinfo 请求失败，请检查网路重试`)
                } else {
                    data = JSON.parse(data);
                    if (data.code == 200) {
                        ccc = data.data.balanceNum;
                    } else {
                        //console.log(data.msg);
                    }
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve(ccc);
            }
        })
    })
}
function dwappexpire() {
    let opt = {
        url: `https://api.m.jd.com/api?functionId=DATAWALLET_USER_QUERY_EXPIRED_SCORE&appid=h5-sep&body=%7B%22expireDayNum%22%3A7%7D&client=m&clientVersion=6.0.0`,
        headers: {
			'Origin':'https://prodev.m.jd.com',
            'User-Agent': $.UA,
            'Cookie': cookie
        }
    }
    return new Promise(async (resolve) => {
        $.post(opt, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`dwappexpire 请求失败，请检查网路重试`)
                } else {
                    data = JSON.parse(data)
                    if (data.code == 200) {
                        data = data.data.expireNum;
						
                    } else {
                        //console.log(data.msg);
                        data = '';
                    }
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve(data);
            }
        })
    })
}

function getek() {
    let opt = {
        url: `https://api.m.jd.com/api?functionId=queryChannelUserCard`,
        body: `cthr=1&client=h5&clientVersion=&t=${Date.now()}&loginWQBiz=&appid=mygiftcard&functionId=queryChannelUserCard&body=null`,
        headers: {
            //'Host': 'api.m.jd.com',
            'Origin': 'https://o.jd.com',
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': $.UA,
            'Cookie': cookie
        }
    }
    return new Promise(async (resolve) => {
        $.post(opt, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`getek请求失败!!`)
                } else {
                    data = JSON.parse(data)
                    if (data.code == '000000') {
                        $.ECardinfo = Number(data.data.totalAmount);
                    } else {
                    }
                }
            } catch (e) {
                $.logErr(e, resp)
            } finally {
                resolve(data)
            }
        })
    })
}
function marketCard() {
    let opt = {
        url: `https://api.m.jd.com/atop_channel_marketCard_cardInfo`,
        body: `appid=jd-super-market&t=${Date.now()}&functionId=atop_channel_marketCard_cardInfo&client=m&uuid=&body=%7B%22babelChannel%22%3A%22ttt9%22%2C%22isJdApp%22%3A%221%22%2C%22isWx%22%3A%220%22%7D`,
        headers: {
            'Origin': 'https://pro.m.jd.com',
            'User-Agent': $.UA,
            'Cookie': cookie
        }
    }
    let carddata = '';
    return new Promise(async (resolve) => {
        $.post(opt, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`marketCard 请求失败，请检查网路重试`)
                } else {
                    data = JSON.parse(data)
                    if (data.success) {
                        carddata = data.data?.floorData?.items ? data.data?.floorData?.items[0].marketCardVO : '';
                    } else {
                    }
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve(carddata);
            }
        })
    })
}
function newfarm_info() {
    let opt = {
        url: `https://api.m.jd.com/client.action`,
        body: `appid=signed_wh5&client=android&clientVersion=12.4.2&screen=393*0&wqDefault=false&build=99108&osVersion=12&t=${Date.now()}&body={"version":1,"type":1}&functionId=farm_award_detail`,
        headers: {
            'Origin': 'https://h5.m.jd.com',
            'User-Agent': $.UA,
            'Cookie': cookie
        }
    }
    return new Promise(async (resolve) => {
        $.post(opt, async (err, resp, data) => {
            try {
                if (err) {
                    console.log(`${JSON.stringify(err)}`)
                    console.log(`newfarm_info 请求失败，请检查网路重试`)
                } else {
                    
                    data = JSON.parse(data);
                    if (data.data.success) {
                        if (data.data.result.plantAwards && data.data.result.plantAwards.length > 0){
                            for (let i of  data.data.result.plantAwards ){
                                if (i.awardStatus == 1){
                                    $.newfarm_info = `${i.skuName} -> ${i.exchangeRemind}`;
                                }
                            }
                        }
                    } else {
                    }
                }
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                resolve();
            }
        })
    })
}

function area() {
    let i = getRand(1, 30)
    let o = getRand(70, 3000)
    let x = getRand(900, 60000)
    let g = getRand(600, 30000)
    let a = i + '_' + o + '_' + x + '_' + g;
    return a
};
function getRand(min, max) {
    return parseInt(Math.random() * (max - min)) + min;
};
function uuid() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
    s[8] = s[13] = s[18] = s[23] = "-";
    var uuid = s.join("");
    return uuid;
};
function uuidRandom() {
    return Math.random().toString(16).slice(2, 10) +
        Math.random().toString(16).slice(2, 10) +
        Math.random().toString(16).slice(2, 10) +
        Math.random().toString(16).slice(2, 10) +
        Math.random().toString(16).slice(2, 10);
}
function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function randomNumber(len) {
    let chars = '0123456789';
    let maxPos = chars.length;
    let str = '';
    for (let i = 0; i < len; i++) {
        str += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return Date.now() + str;
}


function Env(t, e) {
    "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0);
    class s {
        constructor(t) {
            this.env = t
        }
        send(t, e = "GET") {
            t = "string" == typeof t ? {
                url: t
            }
                : t;
            let s = this.get;
            return "POST" === e && (s = this.post),
                new Promise((e, i) => {
                    s.call(this, t, (t, s, r) => {
                        t ? i(t) : e(s)
                    })
                })
        }
        get(t) {
            return this.send.call(this.env, t)
        }
        post(t) {
            return this.send.call(this.env, t, "POST")
        }
    }
    return new class {
        constructor(t, e) {
            this.name = t,
                this.http = new s(this),
                this.data = null,
                this.dataFile = "box.dat",
                this.logs = [],
                this.isMute = !1,
                this.isNeedRewrite = !1,
                this.logSeparator = "\n",
                this.startTime = (new Date).getTime(),
                Object.assign(this, e),
                this.log("", `🔔${this.name}, 开始!`)
        }
        isNode() {
            return "undefined" != typeof module && !!module.exports
        }
        isQuanX() {
            return "undefined" != typeof $task
        }
        isSurge() {
            return "undefined" != typeof $httpClient && "undefined" == typeof $loon
        }
        isLoon() {
            return "undefined" != typeof $loon
        }
        toObj(t, e = null) {
            try {
                return JSON.parse(t)
            } catch {
                return e
            }
        }
        toStr(t, e = null) {
            try {
                return JSON.stringify(t)
            } catch {
                return e
            }
        }
        getjson(t, e) {
            let s = e;
            const i = this.getdata(t);
            if (i)
                try {
                    s = JSON.parse(this.getdata(t))
                } catch { }
            return s
        }
        setjson(t, e) {
            try {
                return this.setdata(JSON.stringify(t), e)
            } catch {
                return !1
            }
        }
        getScript(t) {
            return new Promise(e => {
                this.get({
                    url: t
                }, (t, s, i) => e(i))
            })
        }
        runScript(t, e) {
            return new Promise(s => {
                let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
                i = i ? i.replace(/\n/g, "").trim() : i;
                let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
                r = r ? 1 * r : 20,
                    r = e && e.timeout ? e.timeout : r;
                const [o, h] = i.split("@"),
                    n = {
                        url: `http://${h}/v1/scripting/evaluate`,
                        body: {
                            script_text: t,
                            mock_type: "cron",
                            timeout: r
                        },
                        headers: {
                            "X-Key": o,
                            Accept: "*/*"
                        }
                    };
                this.post(n, (t, e, i) => s(i))
            }).catch(t => this.logErr(t))
        }
        loaddata() {
            if (!this.isNode())
                return {}; {
                this.fs = this.fs ? this.fs : require("fs"),
                    this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile),
                    e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t),
                    i = !s && this.fs.existsSync(e);
                if (!s && !i)
                    return {}; {
                    const i = s ? t : e;
                    try {
                        return JSON.parse(this.fs.readFileSync(i))
                    } catch (t) {
                        return {}
                    }
                }
            }
        }
        writedata() {
            if (this.isNode()) {
                this.fs = this.fs ? this.fs : require("fs"),
                    this.path = this.path ? this.path : require("path");
                const t = this.path.resolve(this.dataFile),
                    e = this.path.resolve(process.cwd(), this.dataFile),
                    s = this.fs.existsSync(t),
                    i = !s && this.fs.existsSync(e),
                    r = JSON.stringify(this.data);
                s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r)
            }
        }
        lodash_get(t, e, s) {
            const i = e.replace(/\[(\d+)\]/g, ".$1").split(".");
            let r = t;
            for (const t of i)
                if (r = Object(r)[t], void 0 === r)
                    return s;
            return r
        }
        lodash_set(t, e, s) {
            return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t)
        }
        getdata(t) {
            let e = this.getval(t);
            if (/^@/.test(t)) {
                const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t),
                    r = s ? this.getval(s) : "";
                if (r)
                    try {
                        const t = JSON.parse(r);
                        e = t ? this.lodash_get(t, i, "") : e
                    } catch (t) {
                        e = ""
                    }
            }
            return e
        }
        setdata(t, e) {
            let s = !1;
            if (/^@/.test(e)) {
                const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e),
                    o = this.getval(i),
                    h = i ? "null" === o ? null : o || "{}" : "{}";
                try {
                    const e = JSON.parse(h);
                    this.lodash_set(e, r, t),
                        s = this.setval(JSON.stringify(e), i)
                } catch (e) {
                    const o = {};
                    this.lodash_set(o, r, t),
                        s = this.setval(JSON.stringify(o), i)
                }
            } else
                s = this.setval(t, e);
            return s
        }
        getval(t) {
            return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null
        }
        setval(t, e) {
            return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null
        }
        initGotEnv(t) {
            this.got = this.got ? this.got : require("got"),
                this.cktough = this.cktough ? this.cktough : require("tough-cookie"),
                this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar,
                t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar))
        }
        get(t, e = (() => { })) {
            t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]),
                this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
                    "X-Surge-Skip-Scripting": !1
                })), $httpClient.get(t, (t, s, i) => {
                    !t && s && (s.body = i, s.statusCode = s.status),
                        e(t, s, i)
                })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
                    hints: !1
                })), $task.fetch(t).then(t => {
                    const {
                        statusCode: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    } = t;
                    e(null, {
                        status: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    }, o)
                }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => {
                    try {
                        if (t.headers["set-cookie"]) {
                            const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
                            s && this.ckjar.setCookieSync(s, null),
                                e.cookieJar = this.ckjar
                        }
                    } catch (t) {
                        this.logErr(t)
                    }
                }).then(t => {
                    const {
                        statusCode: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    } = t;
                    e(null, {
                        status: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    }, o)
                }, t => {
                    const {
                        message: s,
                        response: i
                    } = t;
                    e(s, i, i && i.body)
                }))
        }
        post(t, e = (() => { })) {
            if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon())
                this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, {
                    "X-Surge-Skip-Scripting": !1
                })), $httpClient.post(t, (t, s, i) => {
                    !t && s && (s.body = i, s.statusCode = s.status),
                        e(t, s, i)
                });
            else if (this.isQuanX())
                t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, {
                    hints: !1
                })), $task.fetch(t).then(t => {
                    const {
                        statusCode: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    } = t;
                    e(null, {
                        status: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    }, o)
                }, t => e(t));
            else if (this.isNode()) {
                this.initGotEnv(t);
                const {
                    url: s,
                    ...i
                } = t;
                this.got.post(s, i).then(t => {
                    const {
                        statusCode: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    } = t;
                    e(null, {
                        status: s,
                        statusCode: i,
                        headers: r,
                        body: o
                    }, o)
                }, t => {
                    const {
                        message: s,
                        response: i
                    } = t;
                    e(s, i, i && i.body)
                })
            }
        }
        time(t, e = null) {
            const s = e ? new Date(e) : new Date;
            let i = {
                "M+": s.getMonth() + 1,
                "d+": s.getDate(),
                "H+": s.getHours(),
                "m+": s.getMinutes(),
                "s+": s.getSeconds(),
                "q+": Math.floor((s.getMonth() + 3) / 3),
                S: s.getMilliseconds()
            };
            /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length)));
            for (let e in i)
                new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length)));
            return t
        }
        msg(e = t, s = "", i = "", r) {
            const o = t => {
                if (!t)
                    return t;
                if ("string" == typeof t)
                    return this.isLoon() ? t : this.isQuanX() ? {
                        "open-url": t
                    }
                        : this.isSurge() ? {
                            url: t
                        }
                            : void 0;
                if ("object" == typeof t) {
                    if (this.isLoon()) {
                        let e = t.openUrl || t.url || t["open-url"],
                            s = t.mediaUrl || t["media-url"];
                        return {
                            openUrl: e,
                            mediaUrl: s
                        }
                    }
                    if (this.isQuanX()) {
                        let e = t["open-url"] || t.url || t.openUrl,
                            s = t["media-url"] || t.mediaUrl;
                        return {
                            "open-url": e,
                            "media-url": s
                        }
                    }
                    if (this.isSurge()) {
                        let e = t.url || t.openUrl || t["open-url"];
                        return {
                            url: e
                        }
                    }
                }
            };
            if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) {
                let t = ["", "==============📣系统通知📣=============="];
                t.push(e),
                    s && t.push(s),
                    i && t.push(i),
                    console.log(t.join("\n")),
                    this.logs = this.logs.concat(t)
            }
        }
        log(...t) {
            t.length > 0 && (this.logs = [...this.logs, ...t]),
                console.log(t.join(this.logSeparator))
        }
        logErr(t, e) {
            const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
            s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t)
        }
        wait(t) {
            return new Promise(e => setTimeout(e, t))
        }
        done(t = {}) {
            const e = (new Date).getTime(),
                s = (e - this.startTime) / 1e3;
            this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`),
                this.log(),
                (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t)
        }
    }
        (t, e)
}
