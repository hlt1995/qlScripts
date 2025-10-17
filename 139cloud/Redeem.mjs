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
const TARGET_HOUR = parseInt(configMap.TARGET_HOUR, 10);
const EXCHANGE_IDS = configMap.EXCHANGE_IDS
  .split(/[,&]/)
  .map(id => parseInt(id.trim()))
  .filter(id => !isNaN(id));

// 指定账号
const { exchange, exchangeQuickly, sendMessage } = await useExchange(
  config[ACCOUNT_INDEX],
  message
);

// 自定义等待到指定时间点（最大等待2分钟）
const waitToTargetHour = (targetHour = 24) => {
  const now = new Date();
  const target = new Date();
  
  // 设置目标时间
  if (now.getHours() >= targetHour) {
    // 如果当前时间已经过了目标时间，等待到明天的目标时间
    target.setDate(target.getDate() + 1);
  }
  target.setHours(targetHour, 0, 0, 0);
  
  let ms = target - now;
  const twoMinutes = 2 * 60 * 1000;
  
  if (ms > twoMinutes) {
    console.log(`距离${targetHour}点还有${ms}ms，超过2分钟，只等待2分钟`);
    ms = twoMinutes;
  } else {
    console.log(`等待到${targetHour}点，剩余时间: ${ms}ms`);
  }
  
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 兑换时间
await waitToTargetHour(TARGET_HOUR);

// 兑换奖品
// await exchange(EXCHANGE_IDS);

// 快速兑换
await exchangeQuickly(EXCHANGE_IDS, '奖品');

// 发送推送
await sendMessage();
