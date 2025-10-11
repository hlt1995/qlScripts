# -*- coding=UTF-8 -*-
# @Project          QL_TimingScript
# @fileName         TongchengTravel.py
# @author           Echo
# @EditTime         2025/3/14
# cron: 5 12 * * *
# const $ = new Env('同程旅行')
"""
开启抓包，进入app 进入'领福利'界面，点击签到，查看https://app.17u.cn/welfarecenter/index/signIndex请求头
提取变量： apptoken、device
变量格式： phone#apptoken#device，多个账号用@隔开

"""
import asyncio
import time
from datetime import datetime
import os
import re
from typing import *

import httpx

# ==================== Bark 推送配置 ====================
# Bark 推送地址（环境变量读取，不变）
BARK_PUSH = os.getenv("BARK_PUSH")

# 你可以在这里写死参数，也可以留空
CUSTOM_BARK_ICON = "https://gitee.com/hlt1995/BARK_ICON/raw/main/TongchengTravel.png"   # 自定义图标
CUSTOM_BARK_GROUP = "同程旅行"              # 自定义分组
PUSH_SWITCH = "0"    #推送开关，1开启，0关闭

# 定义全局变量，保证不会报未定义错误
BARK_ICON = CUSTOM_BARK_ICON or os.getenv("BARK_ICON", "")
BARK_GROUP = CUSTOM_BARK_GROUP or os.getenv("BARK_GROUP", "")

# 覆盖环境变量，让 notify.py 能读到
os.environ["BARK_ICON"] = BARK_ICON
os.environ["BARK_GROUP"] = BARK_GROUP
os.environ["PUSH_SWITCH"] = PUSH_SWITCH

# =====================================================

all_print_list = []
push_summary_list = []  # 存储精简的推送内容

def fn_print(*args, sep=' ', end='\n', **kwargs):
    global all_print_list
    output = ""
    # 构建输出字符串
    for index, arg in enumerate(args):
        if index == len(args) - 1:
            output += str(arg)
            continue
        output += str(arg) + sep
    output = output + end
    all_print_list.append(output)
    # 调用内置的 print 函数打印字符串
    print(*args, sep=sep, end=end, **kwargs)


def get_env(env_var, separator):
    if env_var in os.environ:
        return re.split(separator, os.environ.get(env_var))
    else:
        try:
            from dotenv import load_dotenv, find_dotenv
            load_dotenv(find_dotenv())
            if env_var in os.environ:
                return re.split(separator, os.environ.get(env_var))
            else:
                fn_print(f"未找到{env_var}变量.")
                return []
        except ImportError:
            fn_print(f"未找到{env_var}变量且无法加载dotenv.")
            return []


try:
    from notify import send as notify_send
except ImportError:
    fn_print("无法导入青龙面板的notify模块，将使用简单的打印通知")
    def notify_send(title, content):
        fn_print(f"【{title}】\n{content}")


tc_cookies = get_env("tc_cookie", "@")
push_switch = os.environ.get('PUSH_SWITCH', '1')
bark_key = os.environ.get('BARK_KEY', '')
bark_icon = os.environ.get('BARK_ICON', '')
bark_group = os.environ.get('BARK_GROUP', '')


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
            # 'content-length': str(len(payload_str.encode('utf-8'))),
            'device': self.device,
            'sec-fetch-dest': 'empty'
        }
        self.summary_info = {}  # 存储精简的推送信息

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
                fn_print(f"用户【{self.phone}】 - token失效了，请更新")
                self.summary_info['status'] = "token失效‼️"
                return None
            else:
                today_sign = data['data']['todaySign']
                mileage = data['data']['mileageBalance']['mileage']
                fn_print(f"用户【{self.phone}】 - 今日{'已' if today_sign else '未'}签到，当前剩余里程{mileage}！")
                return today_sign
        except Exception as e:
            fn_print(f"用户【{self.phone}】 - 签到请求异常！{e}")
            fn_print(response.text)
            self.summary_info['status'] = "签到异常‼️"
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
                fn_print(f"用户【{self.phone}】 - 签到失败了，尝试获取任务列表")
                self.summary_info['status'] = "签到失败❌"
                return False
            else:
                fn_print(f"用户【{self.phone}】 - 签到成功！开始获取任务列表")
                self.summary_info['status'] = "签到成功✅"
                return True
        except Exception as e:
            fn_print(f"用户【{self.phone}】 - 执行签到请求异常！{e}")
            fn_print(response.text)
            self.summary_info['status'] = "签到异常‼️"
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
                fn_print(f"用户【{self.phone}】 - 获取任务列表失败了")
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
            fn_print(f"用户【{self.phone}】 - 获取任务列表请求异常！{e}")
            fn_print(response.text)
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
                fn_print(f"用户【{self.phone}】 - 执行任务【{task_code}】失败了，跳过当前任务")
                return None
            else:
                task_id = data['data']
                return task_id
        except Exception as e:
            fn_print(f"用户【{self.phone}】 - 执行任务【{task_code}】请求异常！{e}")
            fn_print(response.text)
            return None

    async def finsh_task(self, task_id):
        max_retry = 3  # 最大重试次数
        retry_delay = 2  # 重试间隔时间（秒）
        for attempt in range(max_retry):
            try:
                response = await self.client.post(
                    url="/task/finish",
                    headers=self.headers,
                    json={"id": task_id}
                )
                data = response.json()
                if data['code'] == 2200:
                    fn_print(f"用户【{self.phone}】 - 完成任务【{task_id}】成功！开始领取奖励")
                    return True
                if attempt < max_retry - 1:
                    fn_print(f"用户【{self.phone}】 - 完成任务【{task_id}】失败了，尝试重新提交（第{attempt + 1}次重试。。）")
                    await asyncio.sleep(retry_delay * (attempt + 1))
                    continue
                fn_print(f"用户【{self.phone}】 - 完成任务【{task_id}】最终失败，跳过当前任务")
                return False
            except Exception as e:
                error_msg = f"用户【{self.phone}】 - 完成任务【{task_id}】请求异常！{e}"
                if 'response' in locals():
                    error_msg += f"\n{response.text}"
                fn_print(error_msg)
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
                fn_print(f"用户【{self.phone}】 - 领取签到奖励失败了， 请尝试手动领取")
            else:
                fn_print(f"用户【{self.phone}】 - 领取签到奖励成功！开始下一个任务")
        except Exception as e:
            fn_print(f"用户【{self.phone}】 - 领取签到奖励请求异常！{e}")
            fn_print(response.text)

    async def get_mileage_info(self):
        try:
            response = await self.client.post(
                url="/index/signIndex",
                headers=self.headers,
                json={}
            )
            data = response.json()
            if data['code'] != 2200:
                fn_print(f"用户【{self.phone}】 - 获取积分信息失败了")
                return None
            else:
                cycle_sign_num = data['data']['cycleSighNum']
                continuous_history = data['data']['continuousHistory']
                mileage = data['data']['mileageBalance']['mileage']
                today_mileage = data['data']['mileageBalance']['todayMileage']
                
                # 存储精简信息
                self.summary_info['cycle_sign_num'] = cycle_sign_num
                self.summary_info['continuous_history'] = continuous_history
                self.summary_info['mileage'] = mileage
                self.summary_info['today_mileage'] = today_mileage
                
                fn_print(
                    f"用户【{self.phone}】 - 本月签到{cycle_sign_num}天，连续签到{continuous_history}天，今日共获取{today_mileage}里程，当前剩余里程{mileage}")
                return True
        except Exception as e:
            fn_print(f"用户【{self.phone}】 - 获取积分信息请求异常！{e}")
            fn_print(response.text)
            return None

    async def run(self):
        # 初始化摘要信息
        self.summary_info = {
            'phone': self.phone,
            'status': '未签到',
            'cycle_sign_num': 0,
            'continuous_history': 0,
            'mileage': 0,
            'today_mileage': 0
        }
        
        today_sign = await self.sign_in()
        if today_sign is None:
            return self.summary_info
        if today_sign:
            fn_print(f"用户【{self.phone}】 - 今日已签到，开始获取任务列表")
            self.summary_info['status'] = "签到成功✅"
        else:
            if await self.do_sign_in():
                fn_print(f"用户【{self.phone}】 - 签到成功，开始获取任务列表")
        tasks = await self.get_task_list()
        if tasks:
            for task in tasks:
                task_code = task['taskCode']
                title = task['title']
                browser_time = task['browserTime']
                fn_print(f"用户【{self.phone}】 - 开始做任务【{title}】，需要浏览{browser_time}秒")
                task_id = await self.perform_tasks(task_code)
                if task_id:
                    await asyncio.sleep(browser_time)
                    if await self.finsh_task(task_id):
                        await self.receive_reward(task_id)
        await self.get_mileage_info()
        
        # 添加到推送摘要列表
        summary = f"📱 {self.phone}\n • {self.summary_info['status']}本月签到{self.summary_info['cycle_sign_num']}天\n • 当前里程: {self.summary_info['mileage']}(+{self.summary_info['today_mileage']})"
        push_summary_list.append(summary)
        
        return self.summary_info


async def main():
    tasks = []
    for cookie in tc_cookies:
        tclx = Tclx(cookie)
        tasks.append(tclx.run())
    results = await asyncio.gather(*tasks)
    return results


if __name__ == '__main__':
    results = asyncio.run(main())
    
    # 构建精简推送内容
    title = f"同程旅行签到 - {datetime.now().strftime('%m/%d')}"
    push_content = ""
    
    for summary in push_summary_list:
        push_content += f"\n\n{summary}"
    
    # 添加统计信息
    success_count = sum(1 for r in results if r and r.get('status') in ['签到成功', '今日已签到'])
    push_content += f""

    push_content = push_content.strip()
    
    # 根据推送开关决定是否推送
    if push_switch == '1':
        if bark_key:
            bark_send(title, push_content, bark_key, bark_icon, bark_group)
        else:
            notify_send(title, push_content)
    else:
        fn_print("推送开关已关闭，不发送推送通知")
    
    # 输出详细日志
    fn_print("\n" + "="*50)
    fn_print("详细执行日志:")
    fn_print(''.join(all_print_list))
