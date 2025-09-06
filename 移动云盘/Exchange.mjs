import { loadConfig, useExchange } from "./caiyun-1.0.0-alpha.7.mjs";

const { config, message } = await loadConfig();

// 定时任务设定为兑换时间点前2分钟

// =================== 配置参数 ===================
const ACCOUNT_INDEX = 3;           // 兑换账号索引（0表示第一个账号）
const TARGET_HOUR = 16;            // 兑换时间点（可选12/16/24）
const EXCHANGE_IDS = [241229017];  // 兑换奖品ID
// ================================================

// 使用配置中的指定账号
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

// 选择兑换的时间点
await waitToTargetHour(TARGET_HOUR);

// 3.此处为 id 数组（可多个）
await exchange(EXCHANGE_IDS);

// 快速兑换,如果需要自定义逻辑，可以使用这个 api，在兑换前不会有校验
// await exchangeQuickly(EXCHANGE_IDS, '奖品');

// 发送推送
await sendMessage();