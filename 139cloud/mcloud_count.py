# 脚本名称: [云朵资产统计]
# 功能描述: [签到 抽抽乐 云朵统计]
# 注: 本脚本仅用于个人学习和交流，请勿用于非法用途。作者不承担由于滥用此脚本所引起的任何责任，请在下载后24小时内删除。

# cron: 20 12 * * *
# const $ = new Env('云朵资产统计')

import os
import random
import re
import time
import json
from os import path

import requests

ua = 'Mozilla/5.0 (Linux; Android 11; M2012K10C Build/RP1A.200720.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/90.0.4430.210 Mobile Safari/537.36 MCloudApp/10.0.1'

err_accounts = ''  # 异常账号
err_message = ''  # 错误信息
user_amount = ''  # 用户云朵·数量
GLOBAL_DEBUG = False

# Bark推送配置
# ==================== Bark 推送配置 ====================
BARK_ICON = "https://gitee.com/hlt1995/BARK_ICON/raw/main/mcloud.png"     # 自定义图标
BARK_GROUP = "移动云盘"                     # 自定义分组
PUSH_SWITCH = "1"                #推送开关，1开启，0关闭
# =======================================================

os.environ["PUSH_SWITCH"] = PUSH_SWITCH

def load_send():
    cur_path = path.abspath(path.dirname(__file__))
    notify_file = cur_path + "/notify.py"

    if path.exists(notify_file):
        try:
            from notify import send
            print("加载通知服务成功！")
            return send
        except ImportError:
            print("加载通知服务失败~")
    else:
        print("加载通知服务失败~")

    return False


class YP:
    def __init__(self, cookie):
        self.notebook_id = None
        self.note_token = None
        self.note_auth = None
        self.click_num = 15  # 定义抽奖次数和摇一摇戳一戳次数
        self.draw = 1  # 抽奖次数，首次免费
        self.session = requests.Session()

        self.timestamp = str(int(round(time.time() * 1000)))
        self.cookies = {'sensors_stay_time': self.timestamp}
        self.Authorization = cookie.split("#")[0]
        self.account = cookie.split("#")[1]
        self.auth_token = cookie.split("#")[2]
        self.encrypt_account = self.account[:3] + "*" * 4 + self.account[7:]
        self.fruit_url = 'https://happy.mail.10086.cn/jsp/cn/garden/'

        self.jwtHeaders = {
            'User-Agent': ua,
            'Accept': '*/*',
            'Host': 'caiyun.feixin.10086.cn:7071',
        }
        self.treeHeaders = {
            'Host': 'happy.mail.10086.cn',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': ua,
            'Referer': 'https://happy.mail.10086.cn/jsp/cn/garden/wap/index.html?sourceid=1003',
            'Cookie': '',
        }

    # 捕获异常
    
    def catch_errors(func):
        def wrapper(self, *args, **kwargs):
            try:
                return func(self, *args, **kwargs)
            except Exception as e:
                global err_message
                print("错误:", str(e))
                err_message += f'用户[{self.encrypt_account}]:{e}\n'  # 错误信息
            return None

        return wrapper

    @catch_errors
    def run(self):
        if self.jwt():
            print(f'📅 签到查询')
            self.signin_status()
            self.wxsign()
            self.click()
            print(f'\n🎰 抽抽乐')
            self.shake()
            print(f'\n☁️ 云朵统计')
            self.receive()
        else:
            global err_accounts
            # 失效账号
            err_accounts += f'{self.encrypt_account}\n'

    @catch_errors
    def send_request(self, url, headers=None, cookies=None, data=None, params=None, method='GET', debug=None,
                     retries=5):

        debug = debug if debug is not None else GLOBAL_DEBUG

        self.session.headers.update(headers or {})
        if cookies:
            self.session.cookies.update(cookies)
        request_args = {'json': data} if isinstance(data, dict) else {'data': data}

        for attempt in range(retries):
            try:
                response = self.session.request(method, url, params = params, **request_args)
                response.raise_for_status()
                if debug:
                    print(f'\n【{url}】响应数据:\n{response.text}')
                return response
            except (requests.RequestException, ConnectionError, TimeoutError) as e:
                print(f"请求异常: {e}")
                if attempt >= retries - 1:
                    print("达到最大重试次数。")
                    return None
                time.sleep(1)

    # 随机延迟默认1-1.5s
    def sleep(self, min_delay=1, max_delay=1.5):
        delay = random.uniform(min_delay, max_delay)
        time.sleep(delay)

    # 日志
    def log_info(self, err_msg=None, amount=None):
        global err_message, user_amount
        if err_msg is not None:
            err_message += f'{err_msg}\n'  # 错误信息
        elif amount is not None:
            user_amount += f'{amount}\n'  # 云朵数量

    # 刷新令牌
    def sso(self):
        sso_url = 'https://orches.yun.139.com/orchestration/auth-rebuild/token/v1.0/querySpecToken'
        sso_headers = {
            'Authorization': self.Authorization,
            'User-Agent': ua,
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Host': 'orches.yun.139.com'
        }
        sso_payload = {"account": self.account, "toSourceId": "001005"}
        sso_data = self.send_request(sso_url, headers = sso_headers, data = sso_payload, method = 'POST').json()

        if sso_data['success']:
            refresh_token = sso_data['data']['token']
            return refresh_token
        else:
            print(sso_data['message'])
            return None

    # jwt
    def jwt(self):
        # 获取jwttoken
        token = self.sso()
        if token is not None:

            jwt_url = f"https://caiyun.feixin.10086.cn:7071/portal/auth/tyrzLogin.action?ssoToken={token}"
            jwt_data = self.send_request(jwt_url, headers = self.jwtHeaders, method = 'POST').json()
            if jwt_data['code'] != 0:
                print(jwt_data['msg'])
                return False
            self.jwtHeaders['jwtToken'] = jwt_data['result']['token']
            self.cookies['jwtToken'] = jwt_data['result']['token']
            return True
        else:
            print('-ck可能失效了')
            return False

    # 签到查询
    @catch_errors
    def signin_status(self):
        self.sleep()
        check_url = 'https://caiyun.feixin.10086.cn/market/signin/page/info?client=app'
        check_data = self.send_request(check_url, headers = self.jwtHeaders, cookies = self.cookies).json()
        if check_data['msg'] == 'success':
            today_sign_in = check_data['result'].get('todaySignIn', False)

            if today_sign_in:
                print('- ✅APP已签到')
            else:
                print('- ❌APP未签到')
                signin_url = 'https://caiyun.feixin.10086.cn/market/manager/commonMarketconfig/getByMarketRuleName?marketName=sign_in_3'
                signin_data = self.send_request(signin_url, headers = self.jwtHeaders,
                                                cookies = self.cookies).json()

                if signin_data['msg'] == 'success':
                    print('- ✅APP签到成功')
                else:
                    print(signin_data['msg'])
                    self.log_info(signin_data['msg'])
        else:
            print(check_data['msg'])
            self.log_info(check_data['msg'])

    # 戳一下
    def click(self):
        url = "https://caiyun.feixin.10086.cn/market/signin/task/click?key=task&id=319"
        successful_click = 0  # 获得次数

        try:
            for _ in range(self.click_num):
                return_data = self.send_request(url, headers = self.jwtHeaders, cookies = self.cookies).json()
                time.sleep(0.2)

                if 'result' in return_data:
                    print(f'- ✅{return_data["result"]}')
                    successful_click += 1

        except Exception as e:
            print(f'错误信息:{e}')


    # 公众号签到
    @catch_errors
    def wxsign(self):
        self.sleep()
        url = 'https://caiyun.feixin.10086.cn/market/playoffic/followSignInfo?isWx=true'
        return_data = self.send_request(url, headers = self.jwtHeaders, cookies = self.cookies).json()

        if return_data['msg'] != 'success':
            return print(return_data['msg'])
        if not return_data['result'].get('todaySignIn'):
            return print('- ❌签到失败,可能未绑定公众号')
        return print('- ✅公众号已签到')

    # 抽抽乐
    def shake(self):
        url = "https://caiyun.feixin.10086.cn:7071/market/shake-server/shake/shakeIt?flag=1"
        successful_shakes = 0  # 记录成功摇中的次数
        print(f'- 🔁执行 {self.click_num} 次，正在抽取...')

        try:
            for _ in range(self.click_num):
                return_data = self.send_request(url = url, cookies = self.cookies, headers = self.jwtHeaders,
                                                method = 'POST').json()
                time.sleep(1)
                shake_prize_config = return_data["result"].get("shakePrizeconfig")

                if shake_prize_config:
                    print(f"- 🎉抽抽乐获得: {shake_prize_config['name']}")
                    successful_shakes += 1
        except Exception as e:
            print(f'- 错误信息: {e}')
        if successful_shakes == 0:
            print(f'- ❌未抽中奖品')


    # 领取云朵
    @catch_errors
    def receive(self):
        receive_url = "https://caiyun.feixin.10086.cn/market/signin/page/receive"
        prize_url = f"https://caiyun.feixin.10086.cn/market/prizeApi/checkPrize/getUserPrizeLogPage?currPage=1&pageSize=15&_={self.timestamp}"
        receive_data = self.send_request(receive_url, headers = self.jwtHeaders, cookies = self.cookies).json()
        self.sleep()
        prize_data = self.send_request(prize_url, headers = self.jwtHeaders, cookies = self.cookies).json()
        result = prize_data.get('result').get('result')
        rewards = ''
        for value in result:
            prizeName = value.get('prizeName')
            flag = value.get('flag')
            if flag == 1:
                rewards += f'　• {prizeName}\n'

        receive_amount = receive_data["result"].get("receive", "")
        total_amount = receive_data["result"].get("total", "")
        print(f'-当前待领取:{receive_amount}云朵')
        print(f'-当前云朵数量:{total_amount}云朵')

        if rewards:
            msg = f"📱 用户：【{self.encrypt_account}】\n☁️ 云朵数量：【{total_amount}】\n🎁 待领取奖品：\n{rewards}"
        else:
            msg = f"📱 用户：【{self.encrypt_account}】\n☁️ 云朵数量：【{total_amount}】\n"
        self.log_info(amount = msg)


if __name__ == "__main__":
    script_dir = path.dirname(path.abspath(__file__))
    asign_file = path.join(script_dir, 'asign.json')
    
    try:
        with open(asign_file, 'r', encoding='utf-8') as f:
            asign_data = json.load(f)
        
        auth_list = [item['auth'] for item in asign_data.get('caiyun', [])]
        
        bark_key = asign_data.get('message', {}).get('bark', {}).get('key', '')
        
        if bark_key:
            os.environ['BARK_KEY'] = bark_key
            os.environ['BARK_ICON'] = BARK_ICON
            os.environ['BARK_GROUP'] = BARK_GROUP
        
        # 构建cookie列表 (格式: auth#手机号#00)
        cookies = []
        for auth in auth_list:
            try:
                import base64
                decoded = base64.b64decode(auth).decode('utf-8')
                parts = decoded.split(':')
                if len(parts) >= 2:
                    phone = parts[1]  # 获取手机号
                    cookies.append(f"Basic {auth}#{phone}#00")
                else:
                    print(f"无法从auth中提取手机号: {auth}")
            except Exception as e:
                print(f"解析auth失败: {e}")
                # 如果无法解析，使用默认手机号
                cookies.append(f"Basic {auth}#13800138000#00")
        
        print(f"移动云盘共获取到{len(cookies)}个账号")
        
    except Exception as e:
        print(f"读取asign.json失败: {e}")
        exit(0)

    for i, account_info in enumerate(cookies, start = 1):
        print(f"\n======== ▷ 第 {i} 个账号 ◁ ========")
        YP(account_info).run()
        print("\n随机等待5-10s进行下一个账号")
        time.sleep(random.randint(5, 10))

    if err_accounts != '':
        print(f"\n失效账号:\n{err_accounts}")
    else:
        print('当前所有账号ck有效')
    
    print(user_amount)
    
    send = load_send()

    # 判断是否推送
    if PUSH_SWITCH == '1':
        if send:
            if err_accounts:
                msg = f"⚠️ 失效账号：\n{err_accounts}\n" + user_amount
            else:
                msg = user_amount
            send('☁️ 云朵资产统计', msg)
        else:
            print('通知服务不可用')
    else:
        print("推送开关已关闭，不发送推送通知")
