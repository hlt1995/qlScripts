import { loadConfig, useExchange } from "./caiyun-1.0.0-alpha.7.mjs";

const { config, message } = await loadConfig();

const configRaw = process.env.REDEEM_CONFIG;
const configLines = configRaw.split(/\r?\n/).map(line => line.trim()).filter(Boolean);

const configMap = {};
for (const line of configLines) {
  const [key, value] = line.split("=");
  if (key && value !== undefined) configMap[key.trim()] = value.trim();
}

const ACCOUNT_INDEX = parseInt(configMap.ACCOUNT_INDEX, 10) - 1;
const EXCHANGE_IDS = configMap.EXCHANGE_IDS
  .split(/[,&]/)
  .map(id => parseInt(id.trim()))
  .filter(id => !isNaN(id));

// 指定账号
const { exchange, exchangeQuickly, sendMessage } = await useExchange(
  config[ACCOUNT_INDEX],
  message
);

const getNearestTargetHour = () => {
  const now = new Date();
  const currentHour = now.getHours();
  
  const redeemHours = [12, 16, 24];
  
  for (const hour of redeemHours) {
    if (currentHour < hour || hour === 24) {
      return hour === 24 ? 0 : hour;
    }
  }
  
  return 12;
};

const formatTime = (date) => {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
};

const formatMilliseconds = (ms) => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  const milliseconds = ms % 1000;
  
  return `${hours}小时 ${minutes}分钟 ${seconds}秒 ${milliseconds}毫秒`;
};

// 等待到目标时间
const waitToTargetHour = (targetHour = 0) => {
  const now = new Date();

  console.log(``);
  console.log(`🚀 开始执行兑换脚本...`);
  console.log(`🕒 当前时间: ${formatTime(now)}`);
  console.log(``);
  console.log(`🔍 匹配最佳兑换时间...`);
  
  const target = new Date();
  
  if (targetHour === 0) {
    target.setDate(target.getDate() + 1);
    target.setHours(0, 0, 0, 0);
  } else {
    target.setHours(targetHour, 0, 0, 0);
  }
  
  let ms = target - now;
  const twoMinutes = 2 * 60 * 1000;
  
  console.log(`🎯 兑换时间: ${formatTime(target)}`);
  console.log(``);
  console.log(`🖊️ 计算等待时间...`);
  
  if (ms > twoMinutes) {
    console.log(`⚠️ 等待时间超过2分钟，将在2分钟后执行兑换`);
    console.log(`⏱️ 等待时间: 2分钟 0秒 0毫秒`);
    ms = twoMinutes;
  } else {
    console.log(`⏱️ 等待时间: ${formatMilliseconds(ms)}`);
  }
  
  console.log(``);
  console.log(`🟢 准备就绪，正在计时...`);
  
  return new Promise(resolve => setTimeout(resolve, ms));
};

const TARGET_HOUR = getNearestTargetHour();

// 兑换时间
await waitToTargetHour(TARGET_HOUR);

// 兑换奖品
console.log(`⏰ 倒计时结束，开始执行兑换...`);
await exchange(EXCHANGE_IDS);

// 快速兑换
// console.log(`⏰ 倒计时结束，开始执行兑换...\n`);
// await exchangeQuickly(EXCHANGE_IDS, '奖品');

// 发送推送
await sendMessage();
