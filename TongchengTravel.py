# -*- coding=UTF-8 -*-
# cron: 5 12 * * *
# const $ = new Env('同程旅行')
"""
开启抓包，进入app 进入'领福利'界面，点击签到，查看https://app.17u.cn/welfarecenter/index/signIndex请求头
提取变量： apptoken、device
变量格式： phone#apptoken#device，多个账号用@隔开

"""
import asyncio
import os
import time
from datetime import datetime

import httpx

# ==================== Bark 推送配置 ====================
# 添加自定义参数，也可以留空
CUSTOM_BARK_ICON = "https://gitee.com/hlt1995/BARK_ICON/raw/main/TongchengTravel.png"   # 自定义图标
CUSTOM_BARK_GROUP = "同程旅行"              # 自定义分组
PUSH_SWITCH = "1"                #推送开关，1开启，0关闭
# =======================================================

BARK_PUSH = os.getenv("BARK_PUSH")
BARK_ICON = CUSTOM_BARK_ICON or os.getenv("BARK_ICON", "")
BARK_GROUP = CUSTOM_BARK_GROUP or os.getenv("BARK_GROUP", "")

os.environ["BARK_ICON"] = BARK_ICON
os.environ["BARK_GROUP"] = BARK_GROUP
os.environ["PUSH_SWITCH"] = PUSH_SWITCH

def fn_print(message):
    print(message)

def get_env(env_name, separator="&"):
    env_value = os.getenv(env_name)
    if not env_value:
        return []
    return env_value.split(separator)

notify_message = "\n"

tc_cookies = get_env("tc_cookie", "@")


class Tclx:
    def __init__(self, cookie):
        self.client = httpx.AsyncClient(base_url="https://app.17u.cn/welfarecenter",
                                        verify=False,
                                        timeout=60)
        self.phone = cookie.split("#")[0]
        self.apptoken = cookie.split("#")[1]
        self.device = cookie.split("#")[2]
        self.headers = {
            'accept': 'application/json, text/plain, */*',
            'phone': self.phone,
            'channel': '1',
            'apptoken': self.apptoken,
            'sec-fetch-site': 'same-site',
            'accept-language': 'zh-CN,zh-Hans;q=0.9',
            'accept-encoding': 'gzip, deflate, br',
            'sec-fetch-mode': 'cors',
            'origin': 'https://m.17u.cn',
            'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 TcTravel/11.0.0 tctype/wk',
            'referer': 'https://m.17u.cn/',
            'device': self.device,
            'sec-fetch-dest': 'empty'
        }
        self.account_result = ""
        self.sign_success = False  # 新增：记录签到是否成功

    def account_print(self, message):
        """只打印到控制台，不收集到通知中"""
        fn_print(f"用户【{self.phone}】 - {message}")

    @staticmethod
    async def get_today_date():
        return datetime.now().strftime('%Y-%m-%d')

    async def sign_in(self):
        try:
            response = await self.client.post(
                url="/index/signIndex",
                headers=self.headers,
                json={}
            )
            data = response.json()
            if data['code'] != 2200:
                self.account_print("token失效了，请更新")
                return None
            else:
                today_sign = data['data']['todaySign']
                mileage = data['data']['mileageBalance']['mileage']
                self.account_print(f"今日{'已' if today_sign else '未'}签到，当前剩余里程{mileage}！")
                return today_sign
        except Exception as e:
            self.account_print(f"签到请求异常！{e}")
            return None

    async def do_sign_in(self):
        today_date = await self.get_today_date()
        try:
            response = await self.client.post(
                url="/index/sign",
                headers=self.headers,
                json={"type": 1, "day": today_date}
            )
            data = response.json()
            if data['code'] != 2200:
                self.account_print(f"签到失败！错误信息：{data.get('message', '未知错误')}")
                return False
            else:
                self.account_print("签到成功！")
                return True
        except Exception as e:
            self.account_print(f"执行签到请求异常！{e}")
            return False

    async def get_task_list(self):
        try:
            response = await self.client.post(
                url="/task/taskList?version=11.0.7",
                headers=self.headers,
                json={}
            )
            data = response.json()
            if data['code'] != 2200:
                self.account_print("获取任务列表失败了")
                return None
            else:
                tasks = []
                for task in data['data']:
                    if task['state'] == 1 and task['browserTime'] != 0:
                        tasks.append(
                            {
                                'taskCode': task['taskCode'],
                                'title': task['title'],
                                'browserTime': task['browserTime']
                            }
                        )
                return tasks
        except Exception as e:
            self.account_print(f"获取任务列表请求异常！{e}")
            return None

    async def perform_tasks(self, task_code):
        try:
            response = await self.client.post(
                url="/task/start",
                headers=self.headers,
                json={"taskCode": task_code}
            )
            data = response.json()
            if data['code'] != 2200:
                self.account_print(f"执行任务【{task_code}】失败了，跳过当前任务")
                return None
            else:
                task_id = data['data']
                return task_id
        except Exception as e:
            self.account_print(f"执行任务【{task_code}】请求异常！{e}")
            return None

    async def finsh_task(self, task_id):
        max_retry = 3
        retry_delay = 2
        for attempt in range(max_retry):
            try:
                response = await self.client.post(
                    url="/task/finish",
                    headers=self.headers,
                    json={"id": task_id}
                )
                data = response.json()
                if data['code'] == 2200:
                    self.account_print(f"完成任务【{task_id}】成功！开始领取奖励")
                    return True
                if attempt < max_retry - 1:
                    self.account_print(f"完成任务【{task_id}】失败了，尝试重新提交（第{attempt + 1}次重试。。）")
                    await asyncio.sleep(retry_delay * (attempt + 1))
                    continue
                self.account_print(f"完成任务【{task_id}】最终失败，跳过当前任务")
                return False
            except Exception as e:
                self.account_print(f"完成任务【{task_id}】请求异常！{e}")
                if attempt == max_retry - 1:
                    return False
                await asyncio.sleep(retry_delay * (attempt + 1))

    async def receive_reward(self, task_id):
        try:
            response = await self.client.post(
                url="/task/receive",
                headers=self.headers,
                json={"id": task_id}
            )
            data = response.json()
            if data['code'] != 2200:
                self.account_print("领取签到奖励失败了， 请尝试手动领取")
            else:
                self.account_print("领取签到奖励成功！开始下一个任务")
        except Exception as e:
            self.account_print(f"领取签到奖励请求异常！{e}")

    async def get_mileage_info(self):
        try:
            response = await self.client.post(
                url="/index/signIndex",
                headers=self.headers,
                json={}
            )
            data = response.json()
            if data['code'] != 2200:
                self.account_print("获取积分信息失败了")
                return None
            else:
                cycle_sign_num = data['data']['cycleSighNum']
                continuous_history = data['data']['continuousHistory']
                mileage = data['data']['mileageBalance']['mileage']
                today_mileage = data['data']['mileageBalance']['todayMileage']
                
                self.account_print(f"本月签到{cycle_sign_num}天，连续签到{continuous_history}天，今日共获取{today_mileage}里程，当前剩余里程{mileage}")
                return {
                    'cycle_sign_num': cycle_sign_num,
                    'mileage': mileage,
                    'today_mileage': today_mileage
                }
        except Exception as e:
            self.account_print(f"获取积分信息请求异常！{e}")
            return None

    async def run(self):
        # 初始化账号结果
        self.account_result = f"📱 账号：{self.phone}\n"
        
        # 首先检查签到状态
        today_sign = await self.sign_in()
        if today_sign is None:
            # token失效的情况
            self.account_result += "❌ token失效，请更新\n\n"
            return
            
        if today_sign:
            self.account_print("今日已签到，开始获取任务列表")
            self.sign_success = True
        else:
            self.account_print("今日未签到，开始执行签到")
            self.sign_success = await self.do_sign_in()
            
        # 获取任务列表并执行任务
        tasks = await self.get_task_list()
        if tasks:
            for task in tasks:
                task_code = task['taskCode']
                title = task['title']
                browser_time = task['browserTime']
                self.account_print(f"开始做任务【{title}】，需要浏览{browser_time}秒")
                task_id = await self.perform_tasks(task_code)
                if task_id:
                    await asyncio.sleep(browser_time)
                    if await self.finsh_task(task_id):
                        await self.receive_reward(task_id)
        
        # 获取最终的里程信息并构建结果
        mileage_info = await self.get_mileage_info()
        if mileage_info:
            if self.sign_success:
                status_icon = "✨️"
                result_text = f"{status_icon} 签到成功，本月签到【{mileage_info['cycle_sign_num']}】天"
            else:
                status_icon = "❗️"
                result_text = f"{status_icon} 签到暂不可用，请前往APP手动签到！\n🈷️ 本月签到【{mileage_info['cycle_sign_num']}】天"
                
            self.account_result = f"📱 账号：{self.phone}\n{result_text}\n🎁 当前里程: 【{mileage_info['mileage']}】(+{mileage_info['today_mileage']})\n\n"
        else:
            if self.sign_success:
                self.account_result += "✅ 签到成功（但获取里程信息失败）\n\n"
            else:
                self.account_result += "❌ 签到失败且获取里程信息失败\n\n"


async def main():
    global notify_message
    tasks = []
    account_instances = []
    
    for cookie in tc_cookies:
        tclx = Tclx(cookie)
        account_instances.append(tclx)
        tasks.append(tclx.run())
    
    await asyncio.gather(*tasks)
    
    # 收集所有账号的最终结果
    for instance in account_instances:
        notify_message += instance.account_result
        
    notify_message = notify_message.strip()


if __name__ == '__main__':
    asyncio.run(main())
    
    if PUSH_SWITCH == '1':
        try:
            from notify import send
            title = f"✈️ 同程旅行签到结果\n"
            send(title, notify_message)
        except ImportError:
            print("未找到notify模块，使用默认打印方式")
            print("\n" + "="*50)
            print(notify_message)
            print("="*50)
    else:
        print("推送开关已关闭，不发送推送通知")
