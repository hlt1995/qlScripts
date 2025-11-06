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

// 格式化时间为易读格式
const formatTime = (date) => {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
};

// 格式化毫秒为易读时间
const formatMilliseconds = (ms) => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  const milliseconds = ms % 1000;
  
  return `${hours}小时 ${minutes}分钟 ${seconds}秒 ${milliseconds}毫秒`;
};

// 等待到目标时间点（最大等待2分钟）
const waitToTargetHour = (targetHour = 0) => {
  const now = new Date();
  const target = new Date();
  
  // 设置目标时间
  if (targetHour === 0) {
    target.setDate(target.getDate() + 1);
    target.setHours(0, 0, 0, 0);
  } else {
    target.setHours(targetHour, 0, 0, 0);
  }
  
  let ms = target - now;
  const twoMinutes = 2 * 60 * 1000;
  
  // 输出目标时间和等待时间
  console.log(``);
  console.log(`✅️ 自动配置兑换时间点`);
  console.log(`🎯 目标时间: ${formatTime(target)}`);
  console.log(`🕒 当前时间: ${formatTime(now)}`);
  console.log(`⏱️ 等待时间: ${formatMilliseconds(ms)}`);
  
  if (ms > twoMinutes) {
    console.log(`⚠️ 等待时间超过2分钟，将在2分钟后执行兑换`);
    ms = twoMinutes;
  }
  
  return new Promise(resolve => setTimeout(resolve, ms));
};

const TARGET_HOUR = getNearestTargetHour();

// 兑换时间
await waitToTargetHour(TARGET_HOUR);

// 兑换奖品
await exchange(EXCHANGE_IDS);

// 快速兑换
// await exchangeQuickly(EXCHANGE_IDS, '奖品');

// 发送推送
await sendMessage();
