# cron: 0 12 * * *
# const $ = new Env("小米钱包");

#每天两次视频任务
#环境变量 xmqb ，格式为：备注名&passToken&userId，多账号用@隔开
#环境变量 xmqb_UA ，用于自定义User-Agent，不设置则使用默认UA
#浏览器打开https://account.xiaomi.com/ 登陆

import os
import time
import requests
import urllib3
from datetime import datetime
from typing import Optional, Dict, Any, Union

# ==================== Bark 推送配置 ====================
# 添加自定义参数，也可以留空
CUSTOM_BARK_ICON = "https://gitee.com/hlt1995/BARK_ICON/raw/main/XiaomiWallet.png"   # 自定义图标
CUSTOM_BARK_GROUP = "小米钱包"              # 自定义分组
PUSH_SWITCH = "1"                #推送开关，1开启，0关闭
# =======================================================

BARK_PUSH = os.getenv("BARK_PUSH")
BARK_ICON = CUSTOM_BARK_ICON or os.getenv("BARK_ICON", "")
BARK_GROUP = CUSTOM_BARK_GROUP or os.getenv("BARK_GROUP", "")

os.environ["BARK_ICON"] = BARK_ICON
os.environ["BARK_GROUP"] = BARK_GROUP
os.environ["PUSH_SWITCH"] = PUSH_SWITCH

import notify
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 默认UA
DEFAULT_UA = 'Mozilla/5.0 (Linux; U; Android 14; zh-CN; M2012K11AC Build/UKQ1.230804.001; AppBundle/com.mipay.wallet; AppVersionName/6.89.1.5275.2323; AppVersionCode/20577595; MiuiVersion/stable-V816.0.13.0.UMNCNXM; DeviceId/alioth; NetworkType/WIFI; mix_version; WebViewVersion/118.0.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36 XiaoMi/MiuiBrowser/4.3'

def get_custom_ua():
    """获取自定义UA，如果没有设置则使用默认UA"""
    custom_ua = os.environ.get("xmqb_UA", "").strip()
    if custom_ua:
        print(f"✅ 读取到xmqb_UA变量，使用自定义UA: {custom_ua}")
        return custom_ua
    else:
        print(f"✅ 未配置xmqb_UA变量，使用默认UA: {DEFAULT_UA[:50]}...")  # 只打印前50个字符避免过长
        return DEFAULT_UA


def get_ck_from_env():
    ck_str = os.environ.get("xmqb", "")
    accounts = []
    if ck_str:
        for item in ck_str.split("@"):
            try:
                parts = item.split("&")
                if len(parts) == 2:
                    passToken, userId = parts
                    display_name = userId  # 使用userId作为显示名
                    accounts.append({
                        'display_name': display_name.strip(),
                        'passToken': passToken.strip(), 
                        'userId': userId.strip()
                    })
                elif len(parts) == 3:
                    display_name, passToken, userId = parts
                    accounts.append({
                        'display_name': display_name.strip(),
                        'passToken': passToken.strip(), 
                        'userId': userId.strip()
                    })
                else:
                    print(f"[Warning] 无法解析CK格式: {item}")
            except Exception as e:
                print(f"[Warning] 解析CK时出错: {item}, 错误: {e}")
    return accounts


class RnlRequest:
    def __init__(self, cookies: Union[str, dict], user_agent: str):
        self.session = requests.Session()
        self._base_headers = {
            'Host': 'm.jr.airstarfinance.net',
            'User-Agent': user_agent,  # 使用传入的UA
        }
        self.update_cookies(cookies)

    def request(
        self,
        method: str,
        url: str,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Union[Dict[str, Any], str, bytes]] = None,
        json: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> Optional[Dict[str, Any]]:
        headers = {**self._base_headers, **kwargs.pop('headers', {})}
        try:
            resp = self.session.request(
                verify=False,
                method=method.upper(),
                url=url,
                params=params,
                data=data,
                json=json,
                headers=headers,
                **kwargs
            )
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as e:
            print(f"[Request Error] {e}")
            return None
        except ValueError as e:
            print(f"[JSON Parse Error] {e}")
            return None

    def update_cookies(self, cookies: Union[str, dict]) -> None:
        if cookies:
            if isinstance(cookies, str):
                dict_cookies = self._parse_cookies(cookies)
            else:
                dict_cookies = cookies
            self.session.cookies.update(dict_cookies)
            self._base_headers['Cookie'] = self.dict_cookie_to_string(dict_cookies)

    @staticmethod
    def _parse_cookies(cookies_str: str) -> Dict[str, str]:
        return dict(
            item.strip().split('=', 1)
            for item in cookies_str.split(';')
            if '=' in item
        )

    @staticmethod
    def dict_cookie_to_string(cookie_dict):
        cookie_list = []
        for key, value in cookie_dict.items():
            cookie_list.append(f"{key}={value}")
        return "; ".join(cookie_list)

    def get(self, url: str, params: Optional[Dict[str, Any]] = None, **kwargs) -> Optional[Dict[str, Any]]:
        return self.request('GET', url, params=params, **kwargs)

    def post(self, url: str, data: Optional[Union[Dict[str, Any], str, bytes]] = None,
             json: Optional[Dict[str, Any]] = None, **kwargs) -> Optional[Dict[str, Any]]:
        return self.request('POST', url, data=data, json=json, **kwargs)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.session.close()


class RNL:
    def __init__(self, c, user_agent: str):
        self.t_id = None
        self.options = {
            "task_list": True,
            "complete_task": True,
            "receive_award": True,
            "task_item": True,
            "UserJoin": True,
        }
        self.activity_code = '2211-videoWelfare'
        self.rr = RnlRequest(c, user_agent)  # 传入UA
        self.current_display_name = None  # 存储当前处理的账号显示名
        self.total_days = "未知"
        self.today_records = []
        self.error_info = ""

    def get_task_list(self):
        data = {
            'activityCode': self.activity_code,
        }
        try:
            response = self.rr.post(
                'https://m.jr.airstarfinance.net/mp/api/generalActivity/getTaskList',
                data=data,
            )
            if response and response['code'] != 0:
                self.error_info = f"获取任务列表失败：{response}"
                print(self.error_info)
                return None
            target_tasks = []
            for task in response['value']['taskInfoList']:
                if '浏览组浏览任务' in task['taskName']:
                    target_tasks.append(task)
            return target_tasks
        except Exception as e:
            self.error_info = f'获取任务列表失败：{e}'
            print(self.error_info)
            return None

    def get_task(self, task_code):
        try:
            data = {
                'activityCode': self.activity_code,
                'taskCode': task_code,
                'jrairstar_ph': '98lj8puDf9Tu/WwcyMpVyQ==',
            }
            response = self.rr.post(
                'https://m.jr.airstarfinance.net/mp/api/generalActivity/getTask',
                data=data,
            )
            if response and response['code'] != 0:
                self.error_info = f'获取任务信息失败：{response}'
                print(self.error_info)
                return None
            return response['value']['taskInfo']['userTaskId']
        except Exception as e:
            self.error_info = f'获取任务信息失败：{e}'
            print(self.error_info)
            return None

    def complete_task(self, task_id, t_id, brows_click_urlId):
        try:
            response = self.rr.get(
                f'https://m.jr.airstarfinance.net/mp/api/generalActivity/completeTask?activityCode={self.activity_code}&app=com.mipay.wallet&isNfcPhone=true&channel=mipay_indexicon_TVcard&deviceType=2&system=1&visitEnvironment=2&userExtra=%7B%22platformType%22:1,%22com.miui.player%22:%224.27.0.4%22,%22com.miui.video%22:%22v2024090290(MiVideo-UN)%22,%22com.mipay.wallet%22:%226.83.0.5175.2256%22%7D&taskId={task_id}&browsTaskId={t_id}&browsClickUrlId={brows_click_urlId}&clickEntryType=undefined&festivalStatus=0',
            )
            if response and response['code'] != 0:
                self.error_info = f'完成任务失败：{response}'
                print(self.error_info)
                return None
            return response['value']
        except Exception as e:
            self.error_info = f'完成任务失败：{e}'
            print(self.error_info)
            return None

    def receive_award(self, user_task_id):
        try:
            response = self.rr.get(
                f'https://m.jr.airstarfinance.net/mp/api/generalActivity/luckDraw?imei=&device=manet&appLimit=%7B%22com.qiyi.video%22:false,%22com.youku.phone%22:true,%22com.tencent.qqlive%22:true,%22com.hunantv.imgo.activity%22:true,%22com.cmcc.cmvideo%22:false,%22com.sankuai.meituan%22:true,%22com.anjuke.android.app%22:false,%22com.tal.abctimelibrary%22:false,%22com.lianjia.beike%22:false,%22com.kmxs.reader%22:true,%22com.jd.jrapp%22:false,%22com.smile.gifmaker%22:true,%22com.kuaishou.nebula%22:false%7D&activityCode={self.activity_code}&userTaskId={user_task_id}&app=com.mipay.wallet&isNfcPhone=true&channel=mipay_indexicon_TVcard&deviceType=2&system=1&visitEnvironment=2&userExtra=%7B%22platformType%22:1,%22com.miui.player%22:%224.27.0.4%22,%22com.miui.video%22:%22v2024090290(MiVideo-UN)%22,%22com.mipay.wallet%22:%226.83.0.5175.2256%22%7D'
            )
            if response and response['code'] != 0:
                self.error_info = f'领取奖励失败：{response}'
                print(self.error_info)
        except Exception as e:
            self.error_info = f'领取奖励失败：{e}'
            print(self.error_info)

    def queryUserJoinListAndQueryUserGoldRichSum(self):
        try:
            total_res = self.rr.get('https://m.jr.airstarfinance.net/mp/api/generalActivity/queryUserGoldRichSum?app=com.mipay.wallet&deviceType=2&system=1&visitEnvironment=2&userExtra={"platformType":1,"com.miui.player":"4.27.0.4","com.miui.video":"v2024090290(MiVideo-UN)","com.mipay.wallet":"6.83.0.5175.2256"}&activityCode=2211-videoWelfare')
            if not total_res or total_res['code'] != 0:
                self.error_info = f'获取兑换视频天数失败：{total_res}'
                print(self.error_info)
                return False
            self.total_days = f"{int(total_res['value']) / 100:.2f}天" if total_res else "未知"

            response = self.rr.get(
                f'https://m.jr.airstarfinance.net/mp/api/generalActivity/queryUserJoinList?&userExtra=%7B%22platformType%22:1,%22com.miui.player%22:%224.27.0.4%22,%22com.miui.video%22:%22v2024090290(MiVideo-UN)%22,%22com.mipay.wallet%22:%226.83.0.5175.2256%22%7D&activityCode={self.activity_code}&pageNum=1&pageSize=20',
            )
            if not response or response['code'] != 0:
                self.error_info = f'查询任务完成记录失败：{response}'
                print(self.error_info)
                return False

            history_list = response['value']['data']
            current_date = datetime.now().strftime("%Y-%m-%d")
            
            # 清空记录
            self.today_records = []
            
            for a in history_list:
                record_time = a['createTime']
                record_date = record_time[:10]
                if record_date == current_date:
                    self.today_records.append({
                        'createTime': record_time,
                        'value': a['value']
                    })
            
            return True
        except Exception as e:
            self.error_info = f'获取任务记录失败：{e}'
            print(self.error_info)
            return False

    def main(self):
        if not self.queryUserJoinListAndQueryUserGoldRichSum():
            return False
        for i in range(2):
            # 获取任务列表
            tasks = self.get_task_list()
            if not tasks:
                return False
                
            task = tasks[0]
            try:
                t_id = task['generalActivityUrlInfo']['id']
                self.t_id = t_id
            except:
                t_id = self.t_id
            task_id = task['taskId']
            task_code = task['taskCode']
            brows_click_url_id = task['generalActivityUrlInfo']['browsClickUrlId']

            time.sleep(13)

            # 完成任务
            user_task_id = self.complete_task(
                t_id=t_id,
                task_id=task_id,
                brows_click_urlId=brows_click_url_id,
            )

            time.sleep(2)

            # 获取任务数据
            if not user_task_id:
                user_task_id = self.get_task(task_code=task_code)
                time.sleep(2)

            # 领取奖励
            self.receive_award(
                user_task_id=user_task_id
            )

            time.sleep(2)
        
        # 重新获取最新记录
        self.queryUserJoinListAndQueryUserGoldRichSum()
        return True


def get_xiaomi_cookies(pass_token, user_id, user_agent: str):
    session = requests.Session()
    login_url = 'https://account.xiaomi.com/pass/serviceLogin?callback=https%3A%2F%2Fapi.jr.airstarfinance.net%2Fsts%3Fsign%3D1dbHuyAmee0NAZ2xsRw5vhdVQQ8%253D%26followup%3Dhttps%253A%252F%252Fm.jr.airstarfinance.net%252Fmp%252Fapi%252Flogin%253Ffrom%253Dmipay_indexicon_TVcard%2526deepLinkEnable%253Dfalse%2526requestUrl%253Dhttps%25253A%25252F%25252Fm.jr.airstarfinance.net%25252Fmp%25252Factivity%25252FvideoActivity%25253Ffrom%25253Dmipay_indexicon_TVcard%252526_noDarkMode%25253Dtrue%252526_transparentNaviBar%25253Dtrue%252526cUserId%25253Dusyxgr5xjumiQLUoAKTOgvi858Q%252526_statusBarHeight%25253D137&sid=jrairstar&_group=DEFAULT&_snsNone=true&_loginType=ticket'
    headers = {
        'user-agent': user_agent,  # 使用传入的UA
        'cookie': f'passToken={pass_token}; userId={user_id};'
    }

    try:
        session.get(url=login_url, headers=headers, verify=False)
        cookies = session.cookies.get_dict()
        return f"cUserId={cookies.get('cUserId')};jrairstar_serviceToken={cookies.get('serviceToken')}"
    except Exception as e:
        error_msg = f"获取Cookie失败: {e}"
        print(error_msg)
        return None, error_msg


def generate_notification(display_name, rnl_instance):
    """生成简化的通知消息"""
    # 计算今日获得的总天数
    today_total = sum(int(record["value"]) for record in rnl_instance.today_records) / 100
    
    msg = f"""
📱 账号ID：{display_name}
📊 当前兑换视频天数：{rnl_instance.total_days}
🎁 今日获得：+{today_total:.2f}天"""
    
    return msg


if __name__ == "__main__":
    
    # 获取自定义UA
    CURRENT_UA = get_custom_ua()
    
    ORIGINAL_COOKIES = get_ck_from_env()
    if not ORIGINAL_COOKIES:
        print("❌ 未获取到账号CK，请检查青龙环境变量 xmqb 是否配置正确！")
        exit()

    # 构建简化通知消息
    simplified_notification = ""
    
    cookie_list = []
    for account in ORIGINAL_COOKIES:
        display_name = account['display_name']
        user_id = account['userId']
        print(f"\n>>>>>>>>>> 正在处理账号 {display_name} <<<<<<<<<<")
        
        # 获取Cookie
        cookie_result = get_xiaomi_cookies(account['passToken'], user_id, CURRENT_UA)
        
        # 处理返回结果
        if isinstance(cookie_result, tuple):
            new_cookie, error = cookie_result
        else:
            new_cookie = cookie_result
            error = None
        
        # 创建RNL实例并设置当前显示名，传入UA
        rnl = RNL(new_cookie, CURRENT_UA)
        rnl.current_display_name = display_name
        
        if error:
            rnl.error_info = error
        else:
            print(f"账号 {display_name} Cookie获取成功")
            cookie_list.append(new_cookie)
            
            # 执行主程序
            try:
                rnl.main()
            except Exception as e:
                rnl.error_info = f"执行异常: {str(e)}"
                print(rnl.error_info)
        
        # 生成当前账号的简化通知消息
        account_notification = generate_notification(display_name, rnl)
        simplified_notification += account_notification + "\n"

    # 判断是否推送
    if PUSH_SWITCH == '1':
        notify.send("👛 小米钱包签到结果", simplified_notification)
    else:
        print("推送开关已关闭，不发送推送通知")
