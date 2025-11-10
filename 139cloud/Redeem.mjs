import { loadConfig, useExchange } from "./caiyun-1.0.0-alpha.7.mjs";

const { config, message } = await loadConfig();

const configRaw = process.env.REDEEM_CONFIG || "";
const configLines = configRaw.split(/\r?\n/).map(line => line.trim()).filter(Boolean);

const configMap = {};
for (const line of configLines) {
  const [key, value] = line.split("=");
  if (key && value !== undefined) configMap[key.trim()] = value.trim();
}

const ACCOUNT_INDEX = parseInt(configMap.ACCOUNT_INDEX, 10);
const EXCHANGE_IDS = configMap.EXCHANGE_IDS
  .split(/[,&]/)
  .map(id => parseInt(id.trim()))
  .filter(id => !isNaN(id));

const { exchange, exchangeQuickly, sendMessage } = await useExchange(
  config[ACCOUNT_INDEX],
  message
);

const formatTime = (date) => {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
};

const waitTo24Hour = () => {
  const now = new Date();
  const target = new Date();

  console.log(``);
  console.log(`🚀 开始执行兑换脚本...`);
  console.log(`🕒 当前时间: ${formatTime(now)}`);

  target.setDate(target.getDate() + 1);
  target.setHours(0, 0, 0, 0);

  let ms = target - now;
  const twoMinutes = 2 * 60 * 1000;

  if (ms > twoMinutes) {
    console.log(`⚠️ 距离 0 点还有 ${ms}ms，超过 2 分钟，只等待 2 分钟`);
    console.log(`⏱️ 剩余时间: 2分钟 0秒 0毫秒`);
    ms = twoMinutes;
  } else {
    console.log(`⏱️ 剩余时间: ${ms}ms`);
  }
  console.log(``);
  console.log(`🟢 准备就绪，正在计时...`);
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 等待到24点
await waitTo24Hour();

// 兑换奖品
await exchange(EXCHANGE_IDS);

// 快速兑换
await exchangeQuickly(EXCHANGE_IDS, '奖品名称');

// 发送推送
await sendMessage();
