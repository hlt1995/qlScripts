import { loadConfig, useExchange } from "./caiyun-1.0.0-alpha.7.mjs";

const { config, message } = await loadConfig();

// 使用配置中的第一个账号
const { exchange, exchangeQuickly, sendMessage } = await useExchange(
  config[0],
  message
);

// 自定义等待到指定时间点的函数（最大等待2分钟）
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

// 根据需求选择等待的时间点
// await waitToTargetHour(12); // 等待到12点
await waitToTargetHour(16); // 等待到16点
// await waitToTargetHour(24); // 等待到24点

// 快速兑换  奖品ID查询：https://m.mcloud.139.com/market/signin/page/exchangeList
await exchangeQuickly(241229017, '奖品');

// 发送推送
await sendMessage();