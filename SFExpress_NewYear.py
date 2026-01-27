"""
顺丰速运新年活动脚本
Author: 爱学习的呆子
Version: 2.0.0
Date: 2026-01-26
活动代码: YEAREND_2025
"""
# cron: 0 12 * * *
# const $ = new Env('顺丰速运新年活动')

import hashlib
import json
import os
import random
import time
from datetime import datetime
from typing import Dict, Optional, Any, List
from dataclasses import dataclass
from urllib.parse import unquote
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

PROXY_TIMEOUT = 15
MAX_PROXY_RETRIES = 5
REQUEST_RETRY_COUNT = 3

CONCURRENT_NUM = int(os.getenv('SFBF', '1'))
if CONCURRENT_NUM > 20:
    CONCURRENT_NUM = 20
    print(f'⚠️ 并发数量超过最大值20，已自动调整为20')
elif CONCURRENT_NUM < 1:
    CONCURRENT_NUM = 1
    print(f'⚠️ 并发数量小于1，已自动调整为1（串行模式）')

print_lock = Lock()


@dataclass
class Config:
    """全局配置"""
    APP_NAME: str = "顺丰速运新年活动"
    VERSION: str = "2.0.0"
    ENV_NAME: str = "sfsyUrl"
    PROXY_API_URL: str = os.getenv('SF_PROXY_API_URL', '')
    ACTIVITY_CODE: str = "YEAREND_2025"
    
    TOKEN: str = 'wwesldfs29aniversaryvdld29'
    SYS_CODE: str = 'MCS-MIMP-CORE'
    
    ENABLE_INTEGRAL_EXCHANGE: bool = True


class Logger:
    """日志管理器"""
    
    ICONS = {
        'info': '📝',
        'success': '✨',
        'error': '❌',
        'warning': '⚠️',
        'user': '👤',
        'money': '💰',
        'gift': '🎁',
    }
    
    def __init__(self):
        self.messages: List[str] = []
        self.current_account_msg: List[str] = []
        self.lock = Lock()
    
    def _format_msg(self, icon: str, content: str) -> str:
        return f"{icon} {content}"
    
    def _safe_print(self, msg: str):
        with print_lock:
            print(msg)
    
    def info(self, content: str):
        msg = self._format_msg(self.ICONS['info'], content)
        self._safe_print(msg)
        with self.lock:
            self.current_account_msg.append(msg)
            self.messages.append(msg)
    
    def success(self, content: str):
        msg = self._format_msg(self.ICONS['success'], content)
        self._safe_print(msg)
        with self.lock:
            self.current_account_msg.append(msg)
            self.messages.append(msg)
    
    def error(self, content: str):
        msg = self._format_msg(self.ICONS['error'], content)
        self._safe_print(msg)
        with self.lock:
            self.current_account_msg.append(msg)
            self.messages.append(msg)
    
    def warning(self, content: str):
        msg = self._format_msg(self.ICONS['warning'], content)
        self._safe_print(msg)
        with self.lock:
            self.current_account_msg.append(msg)
            self.messages.append(msg)
    
    def user_info(self, account_index: int, mobile: str):
        msg = self._format_msg(self.ICONS['user'], f"账号{account_index}: 【{mobile}】登录成功")
        self._safe_print(msg)
        with self.lock:
            self.current_account_msg.append(msg)
            self.messages.append(msg)
    
    def reset_account_msg(self):
        self.current_account_msg = []
    
    def get_all_messages(self) -> str:
        return '\n'.join(self.messages)
    
    def get_account_messages(self) -> str:
        return '\n'.join(self.current_account_msg)


class ProxyManager:
    """代理管理器"""
    
    def __init__(self, api_url: str):
        self.api_url = api_url
    
    def get_proxy(self) -> Optional[Dict[str, str]]:
        try:
            if not self.api_url:
                print('⚠️ 未配置代理API地址，将不使用代理')
                return None
            
            response = requests.get(self.api_url, timeout=10)
            if response.status_code == 200:
                proxy_text = response.text.strip()
                if ':' in proxy_text:
                    if proxy_text.startswith('http://') or proxy_text.startswith('https://'):
                        proxy = proxy_text
                    else:
                        proxy = f'http://{proxy_text}'
                    
                    display_proxy = proxy
                    if '@' in proxy:
                        parts = proxy.split('@')
                        if len(parts) == 2:
                            display_proxy = f"http://***:***@{parts[1]}"
                    
                    print(f"✅ 成功获取代理: {display_proxy}")
                    return {'http': proxy, 'https': proxy}
            
            print(f'❌ 获取代理失败: {response.text}')
            return None
        except Exception as e:
            print(f'❌ 获取代理异常: {str(e)}')
            return None


class SFHttpClient:
    """顺丰HTTP客户端"""
    
    def __init__(self, config: Config, proxy_manager: ProxyManager):
        self.config = config
        self.proxy_manager = proxy_manager
        self.session = requests.Session()
        self.session.verify = False
        
        proxy = self.proxy_manager.get_proxy()
        if proxy:
            self.session.proxies = proxy
        
        self.headers = {
            'Host': 'mcs-mimp-web.sf-express.com',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 16; PJE110 Build/TP1A.220905.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/134.0.6998.135 Mobile Safari/537.36 mediaCode=SFEXPRESSAPP-Android-ML',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Content-Type': 'application/json',
            'sec-ch-ua-platform': '"Android"',
            'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Android WebView";v="134"',
            'sec-ch-ua-mobile': '?1',
            'channel': 'daluapp',
            'syscode': 'MCS-MIMP-CORE',
            'platform': 'SFAPP',
            'origin': 'https://mcs-mimp-web.sf-express.com',
            'x-requested-with': 'com.sf.activity',
            'sec-fetch-site': 'same-origin',
            'sec-fetch-mode': 'cors',
            'sec-fetch-dest': 'empty',
            'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            'priority': 'u=1, i'
        }
    
    def _generate_sign(self) -> Dict[str, str]:
        timestamp = str(int(round(time.time() * 1000)))
        data = f'token={self.config.TOKEN}&timestamp={timestamp}&sysCode={self.config.SYS_CODE}'
        signature = hashlib.md5(data.encode()).hexdigest()
        
        return {
            'timestamp': timestamp,
            'signature': signature
        }
    
    def request(
        self, 
        url: str, 
        method: str = 'POST', 
        data: Optional[Dict] = None,
        max_retries: int = REQUEST_RETRY_COUNT
    ) -> Optional[Dict[str, Any]]:
        sign_data = self._generate_sign()
        self.headers.update(sign_data)
        
        retry_count = 0
        proxy_retry_count = 0
        
        while proxy_retry_count < MAX_PROXY_RETRIES:
            try:
                if retry_count >= 2:
                    print('请求已失败2次，尝试切换代理IP')
                    new_proxy = self.proxy_manager.get_proxy()
                    if new_proxy:
                        self.session.proxies = new_proxy
                    else:
                        print('⚠️ 切换代理失败，无可用代理')
                    retry_count = 0
                
                try:
                    if method.upper() == 'GET':
                        response = self.session.get(url, headers=self.headers, timeout=PROXY_TIMEOUT)
                    elif method.upper() == 'POST':
                        response = self.session.post(url, headers=self.headers, json=data or {}, timeout=PROXY_TIMEOUT)
                    else:
                        raise ValueError(f'不支持的请求方法: {method}')
                    
                    response.raise_for_status()
                    
                    try:
                        res = response.json()
                        if res is None:
                            print(f'响应内容为空，正在重试 ({retry_count + 1}/{max_retries})')
                            retry_count += 1
                            time.sleep(2)
                            continue
                        return res
                    except (json.JSONDecodeError, ValueError) as e:
                        print(f'JSON解析失败: {str(e)}, 响应内容: {response.text[:200]}')
                        retry_count += 1
                        if retry_count < max_retries:
                            print(f'正在进行第{retry_count + 1}次重试...')
                            time.sleep(2)
                            continue
                        return None
                
                except requests.exceptions.RequestException as e:
                    retry_count += 1
                    print(f'请求失败，正在重试 ({retry_count}/{max_retries}): {str(e)}')
                    if 'ProxyError' in str(e) or 'SSLError' in str(e):
                        proxy_retry_count += 1
                        print(f'代理连接失败，尝试切换代理 ({proxy_retry_count}/{MAX_PROXY_RETRIES})')
                        if proxy_retry_count < MAX_PROXY_RETRIES:
                            new_proxy = self.proxy_manager.get_proxy()
                            if new_proxy:
                                self.session.proxies = new_proxy
                    time.sleep(2)
                    continue
            
            except Exception as e:
                print(f'请求发生异常: {str(e)}')
                proxy_retry_count += 1
                if proxy_retry_count < MAX_PROXY_RETRIES:
                    print(f'尝试切换代理 ({proxy_retry_count}/{MAX_PROXY_RETRIES})')
                    time.sleep(2)
                    continue
                else:
                    print('达到最大代理重试次数，返回None')
                    return None
        
        print('请求最终失败，返回None')
        return None
    
    def login(self, url: str, timeout: int = PROXY_TIMEOUT) -> tuple[bool, str, str]:
        try:
            decoded_url = unquote(url)
            self.session.get(decoded_url, headers=self.headers, timeout=timeout)
            
            cookies = self.session.cookies.get_dict()
            user_id = cookies.get('_login_user_id_', '')
            phone = cookies.get('_login_mobile_', '')
            
            if phone:
                return True, user_id, phone
            else:
                return False, '', ''
        except Exception as e:
            print(f'登录异常: {str(e)}')
            return False, '', ''


class NewYearActivity:
    """新年活动任务执行器"""
    
    def __init__(
        self, 
        http_client: SFHttpClient, 
        logger: Logger,
        config: Config,
        user_id: str
    ):
        self.http = http_client
        self.logger = logger
        self.config = config
        self.user_id = user_id
    
    def init_activity_index(self) -> bool:
        """初始化活动索引（必须在所有操作前调用）"""
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonNoLoginPost/~memberNonactivity~yearEnd2025IndexService~index'
        
        # 使用随机邀请ID（如果没有则使用空字符串）
        invite_ids = [
            'F5E70D771ABD4D86AFB0782313945C91',
            '16A1E9AF32C1441894D27E0F1453F7CB',
            '3ED135C9A3254CCFACA88781CD9B3A91',
            '6931380B6A234074A318CECD9E62089D',
            'C883BE3AE638494B90BAB440A4CFFDEC'
        ]
        
        # 随机选择一个邀请ID（排除自己的user_id）
        available_invites = [inv for inv in invite_ids if inv != self.user_id]
        invite_user_id = random.choice(available_invites) if available_invites else invite_ids[0]
        
        data = {
            "inviteType": 1,
            "inviteUserId": invite_user_id
        }
        
        response = self.http.request(url, data=data)
        if response and response.get('success'):
            return True
        else:
            self.logger.warning('活动索引初始化失败')
            return False
    
    def request_activity_page(self) -> bool:
        """请求活动页面（避免活动太火爆错误）"""
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonNoLoginPost/~cempBase~pageGreyStrategyService~getStrategyByUser'
        data = {"sceneCode": "year-end-2025"}
        
        response = self.http.request(url, data=data)
        if response and response.get('success'):
            return True
        else:
            self.logger.warning('活动页面请求失败')
            return False
    
    def check_sign_status(self) -> tuple[bool, Dict]:
        """检查签到状态"""
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~activitySignService~signStatus'
        data = {"activityCode": self.config.ACTIVITY_CODE}
        
        response = self.http.request(url, data=data)
        if response and response.get('success'):
            obj = response.get('obj', {})
            sign_count_cache = obj.get('signCountCache', {})
            sign_count = sign_count_cache.get('signCount', 0)
            sign_time = sign_count_cache.get('signTime', '')
            sign_expired_tm = sign_count_cache.get('signExpiredTm', '')
            
            self.logger.info(f'累计签到次数: {sign_count}')
            if sign_time:
                self.logger.info(f'最后签到时间: {sign_time}')
            if sign_expired_tm:
                self.logger.info(f'活动截止时间: {sign_expired_tm}')
            
            return True, obj
        else:
            error_msg = response.get('errorMessage', '未知错误') if response else '请求失败'
            self.logger.error(f'查询签到状态失败: {error_msg}')
            return False, {}
    
    def sign_in(self) -> tuple[bool, str]:
        """执行签到"""
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~activitySignService~sign'
        data = {
            "activityCode": self.config.ACTIVITY_CODE
        }
        
        response = self.http.request(url, data=data)
        if response and response.get('success'):
            obj = response.get('obj', {})
            signed = obj.get('signed', False)
            sign_count = obj.get('signCount', 0)
            
            if signed:
                self.logger.warning('今日已签到')
                return True, '今日已签到'
            
            common_sign_packet = obj.get('commonSignPacketDTO', {})
            if common_sign_packet:
                gift_bag_name = common_sign_packet.get('giftBagName', '未知奖励')
                gift_bag_worth = common_sign_packet.get('giftBagWorth', 0)
                product_list = common_sign_packet.get('commonSignProductList', [])
                
                reward_details = []
                for product in product_list:
                    product_name = product.get('productName', '')
                    amount = product.get('amount', 0)
                    if product_name and amount:
                        reward_details.append(f'{product_name} x{amount}')
                
                reward_text = ', '.join(reward_details) if reward_details else gift_bag_name
                self.logger.success(f'签到成功！获得: {reward_text}')
                self.logger.info(f'累计签到: {sign_count} 次')
                
                return True, ''
            else:
                self.logger.success(f'签到成功！累计签到: {sign_count} 次')
                return True, ''
        else:
            error_msg = response.get('errorMessage', '未知错误') if response else '请求失败'
            self.logger.error(f'签到失败: {error_msg}')
            return False, error_msg
    
    def get_task_list(self) -> List[Dict]:
        """获取任务列表"""
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~activityTaskService~taskList'
        data = {
            "activityCode": self.config.ACTIVITY_CODE,
            "channelType": "SFAPP"
        }
        
        response = self.http.request(url, data=data)
        if response and response.get('success'):
            task_list = response.get('obj', [])
            self.logger.info(f'成功获取任务列表，共 {len(task_list)} 个任务')
            return task_list
        else:
            error_msg = response.get('errorMessage', '未知错误') if response else '请求失败'
            self.logger.error(f'获取任务列表失败: {error_msg}')
            return []
    
    def receive_task_reward(self, task_code: str, task_name: str) -> bool:
        """领取任务奖励"""
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~activityTaskService~receiveTaskToken'
        data = {
            "activityCode": self.config.ACTIVITY_CODE,
            "taskCode": task_code
        }
        
        response = self.http.request(url, data=data)
        if response and response.get('success'):
            self.logger.success(f'[{task_name}] 奖励领取成功')
            return True
        else:
            error_msg = response.get('errorMessage', '未知错误') if response else '请求失败'
            self.logger.warning(f'[{task_name}] 领取奖励失败: {error_msg}')
            return False
    
    def receive_member_equity(self) -> bool:
        """领取寄件会员权益"""
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberManage~memberEquity~commonEquityReceive'
        data = {"key": "surprise_benefit"}
        
        response = self.http.request(url, data=data)
        if response and response.get('success'):
            self.logger.success('领取寄件会员权益成功')
            return True
        else:
            error_msg = response.get('errorMessage', '未知错误') if response else '请求失败'
            self.logger.warning(f'领取寄件会员权益失败: {error_msg}')
            return False
    
    def do_tasks(self) -> int:
        """执行所有任务"""
        
        task_list = self.get_task_list()
        if not task_list:
            return 0
        
        completed_count = 0
        
        # 需要跳过的任务（无需显示日志）
        skip_task_names = [
            '开通家庭8折互寄权益',
            '去寄快递',
            '充值新速运通全国卡',
            '邀好友首次访问活动',
            '春节寄大件行李'
        ]
        
        for task in task_list:
            task_name = task.get('taskName', '未知任务')
            task_code = task.get('taskCode', '')
            task_type = task.get('taskType', '')
            status = task.get('status', 0)
            process = task.get('process', '0/0')
            description = task.get('description', '')
            virtual_token_num = task.get('virtualTokenNum', 0)
            
            if status == 3:
                self.logger.success(f'[{task_name}] 已完成 ({process})')
                completed_count += 1
            elif status == 2:
                # 跳过无taskCode且在跳过列表中的任务
                if not task_code and task_name in skip_task_names:
                    continue
                
                self.logger.info(f'[{task_name}] 可领取 - {description} (奖励: {virtual_token_num}次)')
                
                if task_name == '领取寄件会员权益':
                    if self.receive_member_equity():
                        completed_count += 1
                        time.sleep(1)
                elif task_name == '积分兑冲刺次数':
                    self.logger.info('积分兑换任务将在游戏前自动执行')
                elif task_name == '套财神游戏':
                    self.logger.info('套财神游戏任务将在后续执行')
                elif task_code:
                    if self.receive_task_reward(task_code, task_name):
                        completed_count += 1
                        time.sleep(1)
            else:
                self.logger.info(f'[{task_name}] 未完成 ({process}) - {description}')
            
            time.sleep(0.5)
        
        self.logger.success(f'任务执行完成，共完成 {completed_count} 个任务')
        return completed_count
    
    def get_forward_status(self) -> tuple[bool, Dict]:
        """查询向前冲状态"""
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~yearEnd2025ForwardService~forwardStatus'
        data = {}
        
        response = self.http.request(url, data=data)
        if response and response.get('success'):
            obj = response.get('obj', {})
            return True, obj
        else:
            error_msg = response.get('errorMessage', '未知错误') if response else '请求失败'
            self.logger.error(f'查询向前冲状态失败: {error_msg}')
            return False, {}
    
    def play_forward_game(self, card_token: str = None) -> tuple[bool, str]:
        """执行向前冲游戏
        
        Args:
            card_token: 卡片令牌，如果为None则获取新令牌
            
        Returns:
            tuple[bool, str]: (是否成功, cardToken)
        """
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~yearEnd2025ForwardService~forward'
        
        if card_token:
            data = {"cardToken": card_token}
        else:
            data = {}
        
        response = self.http.request(url, data=data)
        if response and response.get('success'):
            obj = response.get('obj', {})
            new_card_token = obj.get('cardToken', '')
            current_times = obj.get('currentTimes', 0)
            total_times = obj.get('totalTimes', 0)
            current_ratio = obj.get('currentRatio', 0)
            remain_chance = obj.get('remainChance', 0)
            result_type = obj.get('resultType', 0)
            
            if result_type == 5:
                self.logger.info(f'🎮 向前冲游戏进行中... 进度: {current_times}/{total_times} ({current_ratio:.1f}%) 剩余次数: {remain_chance}')
            else:
                self.logger.success(f'🎮 向前冲游戏 - 进度: {current_times}/{total_times} ({current_ratio:.1f}%) 剩余次数: {remain_chance}')
            
            return True, new_card_token
        else:
            error_msg = response.get('errorMessage', '未知错误') if response else '请求失败'
            self.logger.warning(f'向前冲游戏失败: {error_msg}')
            return False, ''
    
    def play_game(self) -> bool:
        """执行套财神游戏"""
        self.logger.info('开始执行套财神游戏...')
        
        url_init = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~yearEnd2025GameService~init'
        response = self.http.request(url_init, data={})
        
        if not response or not response.get('success'):
            self.logger.warning('游戏初始化失败')
            return False
        
        obj = response.get('obj', {})
        if obj.get('alreadyDayPass', False):
            self.logger.info('今日已通关，跳过游戏')
            return True
        
        start_level = obj.get('currentIndex', 0)
        level_config = obj.get('levelConfig', [])
        total_levels = len(level_config)
        
        self.logger.info(f'今日未通关，从第 {start_level} 关开始，共 {total_levels} 关')
        
        url_win = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~yearEnd2025GameService~win'
        
        for i in range(start_level, total_levels):
            self.logger.info(f'正在闯关第 {i} 关...')
            data = {"levelIndex": i}
            response = self.http.request(url_win, data=data)
            
            if response and response.get('success'):
                award_list = response.get('obj', {}).get('currentAwardList', [])
                if award_list:
                    for award in award_list:
                        currency = award.get('currency', '')
                        amount = award.get('amount', 0)
                        self.logger.success(f'第 {i} 关通关成功！获得: {currency} x{amount}')
                else:
                    self.logger.success(f'第 {i} 关通关成功！')
                
                time.sleep(random.randint(5, 10))
            else:
                error_msg = response.get('errorMessage', '未知错误') if response else '请求失败'
                self.logger.error(f'第 {i} 关闯关失败: {error_msg}')
                return False
        
        self.logger.success('所有关卡通关完成！')
        return True
    
    def fetch_tasks_reward(self) -> int:
        """领取任务奖励次数"""
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~yearEnd2025TaskService~fetchTasksReward'
        data = {
            "activityCode": self.config.ACTIVITY_CODE,
            "channelType": "MINI_PROGRAM"
        }
        
        response = self.http.request(url, data=data)
        if response and response.get('success'):
            success, status_obj = self.get_forward_status()
            if success:
                remain_chance = status_obj.get('remainChance', 0)
                current_ratio = status_obj.get('currentRatio', 0)
                current_level = status_obj.get('currentLevel', '')
                self.logger.info(f'任务奖励领取成功，当前剩余次数: {remain_chance}，进度: {current_ratio:.1f}%，等级: {current_level}')
                return remain_chance
            return 0
        else:
            error_msg = response.get('errorMessage', '未知错误') if response else '请求失败'
            self.logger.warning(f'领取任务奖励失败: {error_msg}')
            return 0
    
    def get_accrued_task_award(self) -> bool:
        """获取累计任务奖励"""
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~yearEnd2025TaskService~getAccruedTaskAward'
        data = {}
        
        response = self.http.request(url, data=data)
        if response and response.get('success'):
            obj = response.get('obj', {})
            current_progress = obj.get('currentProgress', 0)
            progress_config = obj.get('progressConfig', {})
            accrued_award = obj.get('accruedAward', {})
            
            self.logger.info(f'累计任务进度: {current_progress}')
            
            if accrued_award:
                self.logger.success('获得累计任务奖励')
            
            return True
        else:
            error_msg = response.get('errorMessage', '未知错误') if response else '请求失败'
            self.logger.warning(f'获取累计任务奖励失败: {error_msg}')
            return False
    
    def get_user_rest_integral(self) -> int:
        """查询用户剩余积分"""
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~activityTaskService~getUserRestIntegral'
        data = {}
        
        response = self.http.request(url, data=data)
        if response and response.get('success'):
            integral = response.get('obj', 0)
            self.logger.info(f'当前可用积分: {integral}')
            return integral
        else:
            error_msg = response.get('errorMessage', '未知错误') if response else '请求失败'
            self.logger.warning(f'查询用户剩余积分失败: {error_msg}')
            return 0
    
    def integral_exchange(self, exchange_num: int = 1) -> bool:
        """积分兑换冲刺次数
        
        Args:
            exchange_num: 兑换次数，默认1次（消耗10积分）
            
        Returns:
            bool: 是否兑换成功
        """
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~yearEnd2025TaskService~integralExchange'
        data = {
            "exchangeNum": exchange_num,
            "activityCode": self.config.ACTIVITY_CODE
        }
        
        response = self.http.request(url, data=data)
        if response and response.get('success'):
            obj = response.get('obj', {})
            remain_chance = obj.get('remainChance', 0)
            self.logger.success(f'💎 积分兑换成功！兑换 {exchange_num} 次冲刺机会，当前剩余: {remain_chance} 次')
            return True
        else:
            error_msg = response.get('errorMessage', '未知错误') if response else '请求失败'
            self.logger.warning(f'积分兑换失败: {error_msg}')
            return False
    
    def do_forward_game(self) -> int:
        """执行所有向前冲游戏次数"""
        self.logger.info('开始执行向前冲游戏...')
        
        if self.config.ENABLE_INTEGRAL_EXCHANGE:
            self.logger.info('积分兑换功能已启用，尝试兑换冲刺次数...')
            self.integral_exchange(1)
            time.sleep(1)
        
        success, status_obj = self.get_forward_status()
        if not success:
            return 0
        
        remain_chance = status_obj.get('remainChance', 0)
        if remain_chance <= 0:
            self.logger.info('向前冲游戏次数已用完')
            return 0
        
        self.logger.info(f'当前剩余游戏次数: {remain_chance}')
        
        played_count = 0
        card_token = None
        
        for i in range(remain_chance):
            success, card_token = self.play_forward_game(card_token)
            if success:
                played_count += 1
                time.sleep(1)
            else:
                break
        
        if played_count > 0:
            self.logger.success(f'向前冲游戏完成，共进行 {played_count} 次')
        
        return played_count
    
    def run(self) -> Dict[str, Any]:
        """执行新年活动任务"""
        print('-' * 50)

        self.init_activity_index()
        time.sleep(1)
        
        self.request_activity_page()
        time.sleep(1)
        
        success, status_obj = self.check_sign_status()
        if not success:
            return {
                'success': False,
                'signed': False,
                'sign_count': 0,
                'task_completed': 0,
                'game_played': 0
            }
        
        time.sleep(1)
        
        sign_success, error_msg = self.sign_in()
        
        sign_count = status_obj.get('signCountCache', {}).get('signCount', 0)
        
        time.sleep(1)
        
        self.fetch_tasks_reward()
        time.sleep(1)
        
        task_completed = self.do_tasks()
        
        time.sleep(1)
        
        self.play_game()
        time.sleep(1)
        
        self.fetch_tasks_reward()
        time.sleep(1)
        
        self.get_accrued_task_award()
        time.sleep(1)
        
        current_integral = self.get_user_rest_integral()
        if current_integral >= 10 and self.config.ENABLE_INTEGRAL_EXCHANGE:
            time.sleep(1)
        
        game_played = self.do_forward_game()
        
        return {
            'success': sign_success,
            'signed': '今日已签到' in error_msg,
            'sign_count': sign_count,
            'task_completed': task_completed,
            'game_played': game_played
        }


class AccountManager:
    """账号管理器"""
    
    def __init__(self, account_url: str, account_index: int, config: Config):
        self.account_url = account_url
        self.account_index = account_index + 1
        self.config = config
        self.logger = Logger()
        self.proxy_manager = ProxyManager(config.PROXY_API_URL)
        
        self.login_success = False
        self.user_id = None
        self.phone = None
        self.http_client = None
        
        retry_count = 0
        while retry_count < MAX_PROXY_RETRIES and not self.login_success:
            try:
                self.http_client = SFHttpClient(config, self.proxy_manager)
                
                success, self.user_id, self.phone = self.http_client.login(account_url)
                
                if success:
                    masked_phone = self.phone[:3] + "*" * 4 + self.phone[7:]
                    self.logger.user_info(self.account_index, masked_phone)
                    self.login_success = True
                    break
                else:
                    if retry_count < MAX_PROXY_RETRIES - 1:
                        print(f'账号{self.account_index} 登录失败，尝试重新获取代理 ({retry_count + 1}/{MAX_PROXY_RETRIES})')
                        time.sleep(2)
            except Exception as e:
                print(f'账号{self.account_index} 登录异常: {str(e)[:100]}')
            
            retry_count += 1
        
        if not self.login_success:
            self.logger.error(f'账号{self.account_index} 登录失败，已重试{MAX_PROXY_RETRIES}次，所有代理均不可用')
    
    def run(self) -> Dict[str, Any]:
        if not self.login_success:
            return {
                'success': False,
                'phone': '',
                'signed': False,
                'sign_count': 0,
                'task_completed': 0,
                'game_played': 0
            }
        
        wait_time = random.randint(1000, 3000) / 1000.0
        time.sleep(wait_time)
        
        activity = NewYearActivity(self.http_client, self.logger, self.config, self.user_id)
        result = activity.run()
        
        result['phone'] = self.phone
        return result


def run_single_account(account_info: str, index: int, config: Config) -> Dict[str, Any]:
    try:
        with print_lock:
            print(f"🚀 开始执行账号{index + 1}")
        
        account = AccountManager(account_info, index, config)
        result = account.run()
        
        if result['success']:
            with print_lock:
                print(f"✅ 账号{index + 1}执行完成")
        else:
            with print_lock:
                print(f"❌ 账号{index + 1}执行失败")
        
        result['index'] = index
        return result
    except Exception as e:
        error_msg = f"账号{index + 1}执行异常: {str(e)}"
        with print_lock:
            print(f"❌ {error_msg}")
        return {
            'index': index,
            'success': False,
            'phone': '',
            'signed': False,
            'sign_count': 0,
            'task_completed': 0,
            'game_played': 0,
            'error': error_msg
        }


def main():
    config = Config()

    env_value = os.getenv(config.ENV_NAME)
    if not env_value:
        print(f"❌ 未找到环境变量 {config.ENV_NAME}，请检查配置")
        return

    account_urls = [url.strip() for url in env_value.split('&') if url.strip()]
    if not account_urls:
        print(f"❌ 环境变量 {config.ENV_NAME} 为空或格式错误")
        return

    random.shuffle(account_urls)
    print(f"🔀 已随机打乱账号执行顺序")

    print("=" * 50)
    print(f"🎉 {config.APP_NAME} v{config.VERSION}")
    print(f"👨‍💻 作者: 爱学习的呆子")
    print(f"🎊 活动代码: {config.ACTIVITY_CODE}")
    print(f"📱 共获取到 {len(account_urls)} 个账号")
    print(f"⚙️ 并发数量: {CONCURRENT_NUM}")
    print(f"💎 积分兑换: {'✅ 已启用' if config.ENABLE_INTEGRAL_EXCHANGE else '❌ 已禁用'}")
    print(f"⏰ 执行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    all_results = []
    
    if CONCURRENT_NUM <= 1:
        print("🔄 使用串行模式执行...")
        for index, account_url in enumerate(account_urls):
            account = AccountManager(account_url, index, config)
            result = account.run()
            result['index'] = index
            all_results.append(result)
            
            if index < len(account_urls) - 1:
                print("=" * 50)
                print(f"⏳ 等待 2 秒后执行下一个账号...")
                time.sleep(2)
    else:
        print(f"🔄 使用并发模式执行，并发数: {CONCURRENT_NUM}")
        
        with ThreadPoolExecutor(max_workers=CONCURRENT_NUM) as executor:
            future_to_index = {
                executor.submit(run_single_account, account_url, index, config): index 
                for index, account_url in enumerate(account_urls)
            }
            
            for future in as_completed(future_to_index):
                result = future.result()
                all_results.append(result)
    
    all_results.sort(key=lambda x: x['index'])
    
    success_count = sum(1 for r in all_results if r['success'])
    fail_count = len(all_results) - success_count
    signed_count = sum(1 for r in all_results if r.get('signed', False))
    total_tasks = sum(r.get('task_completed', 0) for r in all_results)
    total_games = sum(r.get('game_played', 0) for r in all_results)
    
    print(f"\n" + "=" * 100)
    print(f"📊 新年活动任务统计")
    print("=" * 100)
    print(f"{'序号':<6} {'手机号':<15} {'签到状态':<12} {'累计签到':<10} {'完成任务':<10} {'游戏次数':<10} {'状态':<10}")
    print("-" * 100)
    
    for result in all_results:
        index = result['index'] + 1
        phone = result['phone'][:3] + "****" + result['phone'][7:] if result['phone'] else "未登录"
        signed_status = "✅已签到" if result.get('signed', False) else ("🎁新签到" if result['success'] else "❌失败")
        sign_count = result.get('sign_count', 0)
        task_completed = result.get('task_completed', 0)
        game_played = result.get('game_played', 0)
        status = "✅成功" if result['success'] else "❌失败"
        
        print(f"{index:<6} {phone:<15} {signed_status:<12} {sign_count:<10} {task_completed:<10} {game_played:<10} {status:<10}")
    
    print("-" * 100)
    print(f"{'汇总':<6} {'总数: ' + str(len(all_results)):<15} {'已签: ' + str(signed_count):<12} {'':<10} {'任务: ' + str(total_tasks):<10} {'游戏: ' + str(total_games):<10} {'成功: ' + str(success_count):<10}")
    print("=" * 100)
    
    print("\n🎊 所有账号新年活动任务执行完成!")


if __name__ == '__main__':
    main()
