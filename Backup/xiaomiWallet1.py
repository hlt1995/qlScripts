#百度搜索小米账号，抓包即可
#每天两个视频任务，CK在脚本里配置，无推送
import os
import time
import requests
import urllib3
from datetime import datetime
from typing import Optional, Dict, Any, Union
#import sendNotify
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class RnlRequest:
    def __init__(self, cookies: Union[str, dict]):
        self.session = requests.Session()
        self._base_headers = {
            'Host': 'm.jr.airstarfinance.net',
            'User-Agent': 'Mozilla/5.0 (Linux; U; Android 14; zh-CN; M2012K11AC Build/UKQ1.230804.001; AppBundle/com.mipay.wallet; AppVersionName/6.89.1.5275.2323; AppVersionCode/20577595; MiuiVersion/stable-V816.0.13.0.UMNCNXM; DeviceId/alioth; NetworkType/WIFI; mix_version; WebViewVersion/118.0.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Mobile Safari/537.36 XiaoMi/MiuiBrowser/4.3',
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
    def __init__(self, c):
        self.t_id = None
        self.options = {
            "task_list": True,
            "complete_task": True,
            "receive_award": True,
            "task_item": True,
            "UserJoin": True,
        }
        self.activity_code = '2211-videoWelfare'
        self.rr = RnlRequest(c)
        self.current_user_id = None  # 存储当前处理的用户ID
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


def get_xiaomi_cookies(pass_token, user_id):
    session = requests.Session()
    login_url = 'https://account.xiaomi.com/pass/serviceLogin?callback=https%3A%2F%2Fapi.jr.airstarfinance.net%2Fsts%3Fsign%3D1dbHuyAmee0NAZ2xsRw5vhdVQQ8%253D%26followup%3Dhttps%253A%252F%252Fm.jr.airstarfinance.net%252Fmp%252Fapi%252Flogin%253Ffrom%253Dmipay_indexicon_TVcard%2526deepLinkEnable%253Dfalse%2526requestUrl%253Dhttps%25253A%25252F%25252Fm.jr.airstarfinance.net%25252Fmp%25252Factivity%25252FvideoActivity%25253Ffrom%25253Dmipay_indexicon_TVcard%252526_noDarkMode%25253Dtrue%252526_transparentNaviBar%25253Dtrue%252526cUserId%25253Dusyxgr5xjumiQLUoAKTOgvi858Q%252526_statusBarHeight%25253D137&sid=jrairstar&_group=DEFAULT&_snsNone=true&_loginType=ticket'
    headers = {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0',
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


def generate_notification(account_id, rnl_instance):
    """生成格式化的通知消息"""
    current_date = datetime.now().strftime("%Y-%m-%d")
    
    msg = f"""
【账号信息】
✨ 账号ID：{account_id}
📊 当前兑换视频天数：{rnl_instance.total_days}

📅 {current_date} 任务记录
{"-"*40}"""
    
    for record in rnl_instance.today_records:
        record_time = record["createTime"]
        days = int(record["value"]) / 100
        msg += f"""
⏰ {record_time}
🎁 领到视频会员，+{days:.2f}天"""
    
    if rnl_instance.error_info:
        msg += f"""
⚠️ 执行异常：{rnl_instance.error_info}"""
    
    msg += f"""
{"="*40}"""
    
    return msg


if __name__ == "__main__":
    # 多账号配置区 ##################################
    ORIGINAL_COOKIES = [
        {   # 账号1
            'passToken': 'V1:DXmurwq2/R1BHTELu6obCU+oPGdHuAEuFerP3TbZPC27oxbVAcHIVYA3ullr3vdxL1nl8eDwy/w9t1oxcyqzlcoOmx/ciFdYfzyGtuH7mNOYWKusdMMANdzd9fHqwaaV8t8E9E8c/tq4quFNgWNmgaEpvoCEFxTnV3udIxnS9CRFSnYw+JIPaqP058DQTz/SAyB74wsBuuvngE3rGC6PA5xDEACTyQ7gNg93eQp3myfDwXmPQlRITbJUYKuNRjBbzVrlzmx8DxFyDgP6N1pz7voCsIIBiwz0YYcEHZr6TaPkyxPRmsCd5RtVkhBFY4m6dUM6zvyNeM+rdOHENSuuxQ==&2519635652@V1:DXmurwq2/R1BHTELu6obCaBLs8Oytbq9ks7HPRiFyyF/z7npTXman/pU5GMbjNSGmDIki9/zaG/haQGpMRqjd3oYbeYXBzj8VZn4btojELkCbjPds1RZcCcHOE6MKUBURRwGkkDNSp/TnLmmPyWSinTVyes/9BZDcISjpfNDZxxLljssmS5+OF4ZLUsote3fcvy4s92NdoBNFkE16ImkeFtikcRp5clmrOxqVmSIG7LKYpm+odWOnKQNSt2uVKW0mu+O2KhU7+hc4UDC+e/I0PJzSnhNGirReL7zzEXMo9onYisc62tsIV/UpYOXrZkJTEZENvf/1mkUMZUrzdyc7A==&3122031873@V1:J7rrshrufaw8uWrlTMO7x/AZ8GjaEBP0htgXLIxCAmsRwWFRStUteK0i9Us+7MdLT5Xcn8I+IiOe5yGPSZ0ij+SM+ByN230zNWbFaiYzolxEMbTxaLAYm5dmUmZXUKoJwQLfbSFsTlfY15IULDjVvG5vt9qlJo8Ni3BcNTSSu05hRU2kxzHX+xcnkAXzuAlAbBARXIAvljZ1E537y9Bxmgh9gKlGTL4SUgPH8pLgnfVvQkz3DxQ9JUQMHnXFvw7mN57l22mbhFaODIQfpu5Z7XwzXbdSJT7o7ZQzzjRt+n5ulk9rcKjTfobTgTNybj50XNrp3iBW9vqW2I4VCgPElg==&3122284306@V1:DXmurwq2/R1BHTELu6obCVZR7+t3vIjlUxQwjmyVhgZN/xgTVFHQ7zwub4tyGz2FC7cmu7W/d1ZbReM2aWN5701KtHCCf3gyV4dlmOrH774zK0qOwf7+BLu9nn8RzEuCpI94sLG2VHr388I0chPZ5TtlYpZkiaaqVo8xhX1M2qGrZzdPOdHJx3Tdhm/Q6qRPrzZDycadKtxzEa6aLpaeaXFB5RLeZ5zxUWobWOg64A61qriGHHFbv7lWT/i8hDzCteEtKmmbw0wJ0PpC1h8UmlxWtCfimadyD3nACMUCuTApuveaMnHnmia8nwkxmaH5aEDn7prxriQAaPZUX+p+6w==&3079231332@V1:J7rrshrufaw8uWrlTMO7x9wJTeTR3BIsuZuGQreKMj8EjIgrpBMGEe6h5/9W70eaYITiZm8lMfkdj4J1H/vqCiQHW4h7SBh3BoXw8mnCpxEZWufhhOaSiI0s0XhyH9ovvnfPwcGq2FbX71rii6+CuWVqojuEeiPm46poGXOHMHqHK1DLWsYYSlOa7ofrIPH73ydj8i9S28ZdK912ZM8uN2nZEwEEULkIZQ3W6eaOO8b7Kv7+7k9715gn3PEYbO0U+LcgcIBL+8LNYowiDn/c4WsYcJ2h5VIGIb4DhItXlyldrwlkjvtbKlZxmNUIjAiHt6i/Nqp9Z77FnyJgx7YzNA==&3122289860@V1:DXmurwq2/R1BHTELu6obCXQhX+fdTG4gXC+ATBK3b0jKYJ2Xu1DOHYFUoqb69IHl1LRS3kbSTNXRpLzOYni0traef5m2JeM5nm2bjs6d6mQWSeZWIPgl2gumpwtnrGvMnjcUM0a0fOTUntUk2anjfQiLJ5WedYxdYMiNPbWc6YH7R4I8bVSfexOMfzu31vrfsoNFR9e5oCfLqJcNbcLQ9d5rBUsUU/NpAspo+OG37YQYJrffPlufqunzikFIKYGpiZcQr5wPAdadxJqo8w5hPzjnY5FFqWQU5z6ZioKlrFRy9eXEB1UYCf3B9Pjcn35TCZ3DmqtNEq0YiL1O/1hMQQ==&3122028739@V1:DXmurwq2/R1BHTELu6obCTjVwvk2Rvnl//0UKyyahGfEai0LjQmn73TZhymxkR5c4RorZBo1Z2TNWIEBVmakhrIlLRbwT0yVn4ALqZSrgieoYeAUqOUyi4atCZy20ai+oBBV1x8GGLbm7bnPdSDDkEJLyf54whp55YQ8FMjaUL6zAFLSV+3ucxT2xD+mHJNQweF4GJYVwmRRUZLqn+FmfxJ/pr3EGylmLODJw7rlmQCjsj/dterOXFRcgmaKjO4u/0i1ssiith02Mc0sWpbnEH12WvdqM8XE6Agmu0e6RgMznL3uOsy/B/rRuPPbb/gPkg5qGvcXkPrWFfRWl/ubjA==&3123159026@V1:DXmurwq2/R1BHTELu6obCfGbZlm9b5wzMOkKbtT6Mf3mPvumbV9F9+mUt98LyARP4tmVvJo1ZxqnZFoCBC9YFT/khJ8popqgR7Hymxnl9emk+3TC23kbsdU4tJ814k76naWrR6LMef5B+CgRaIXLq/FB4hr4lHy5w2idvjFtkp1el8cWDAd/pEK/suRKPUIWIpfBtHeWSLfpMP08OpebpYpGdzN+5NpC3eb2YTUcGVQQcpuWOkNVqi+R5GcbnZlraiWsQF7A/2lHhOllQc+kAYmuR9TmSQD/CLjTDPOBW0ZXMTxS8iGJh/e63Zr8Yb4x4N2+jhH3DsWMdUmp3FGLdQ==&3123161307@V1:J7rrshrufaw8uWrlTMO7xyT5/vs6S9QEfVBwg47rqprJDvhhTz9MrjFrI5CwH05qGDjoMox8BNqyqPedA4/bZsZeiQd6prnUHzs7qozDQM1ZVGHlnIIWVL0cyEbs5tkdXsV7x8mrBk7DQUbDwnwKbinDToeZNaKLm93XWqjsEV4tWwT/G47+ztOTrYUI0IHQVT/KSmknG5stIUwaNHgdcgq4DtuF8tZxz/0odmu4sha4FwXd9mvvlx+1t4qUKzsEXj7HrEF5TybvpSdWgmjoArnjgjuOiNGNesqcDn+8h9D6aMsiNpwWHHMuvVrTFzTADERk/qCKXvVx6Xs4JO/Mlg==&3123859427@V1:J7rrshrufaw8uWrlTMO7x6qWqKBu9yogajQW4FCZn9rSECg+iPwixPPn1uCOPj2LUdkA53iT92edGHlCDEJFup2fMJ5STdTLslOj5EabJXJSQ4X7dWcLFIe9tnD/Eh1AgqqmYWoIlxR6+trJIsEWoDwncJazSeq0e6o8NHpaLiSTzsMJNmrI0EFwEOEQ+9bDxx4JetyXvH1wRM8v8XqqXngIec68fKiHAhcJ0V6IfvppOTvYDteu5BhU/EoUMcD9rPER6XFfHX/Cx/2hnpzJpogAiNWPe5DUDn3Lom8M8nccaG0yHlUR96wKvzw5Uog42moX03niSuAZq48RDin18g==',
            'userId': '3123860248'
        },
        {   # 账号2
            'passToken': '1',
            'userId': '1'
        }
        # 可继续添加更多账号...
    ]
    # 结束配置 ######################################

    # 构建完整通知消息
    full_notification = "📺【小米钱包任务执行结果】\n"
    
    cookie_list = []
    for account in ORIGINAL_COOKIES:
        user_id = account['userId']
        print(f"\n>>>>>>>>>> 正在处理账号 {user_id} <<<<<<<<<<")
        
        # 获取Cookie - 兼容原函数返回值
        cookie_result = get_xiaomi_cookies(account['passToken'], user_id)
        
        # 处理返回结果
        if isinstance(cookie_result, tuple):
            new_cookie, error = cookie_result
        else:
            new_cookie = cookie_result
            error = None
        
        # 创建RNL实例并设置当前用户ID
        rnl = RNL(new_cookie)
        rnl.current_user_id = user_id
        
        if error:
            rnl.error_info = error
        else:
            print(f"账号 {user_id} Cookie获取成功")
            cookie_list.append(new_cookie)
            
            # 执行主程序
            try:
                rnl.main()
            except Exception as e:
                rnl.error_info = f"执行异常: {str(e)}"
                print(rnl.error_info)
        
        # 生成当前账号的通知消息并添加到完整通知中
        account_notification = generate_notification(user_id, rnl)
        full_notification += account_notification

    # 添加汇总信息
    full_notification += f"""
📊 执行汇总：
✅ 成功账号数：{len(cookie_list)}
⚠️ 失败账号数：{len(ORIGINAL_COOKIES) - len(cookie_list)}
"""

    # 打印最终通知消息
    print(full_notification)

    # 此处可添加实际的消息推送代码
    sendNotify.send("小米钱包任务推送",full_notification)        