# cron: 10 12 * * *
# const $ = new Env('顺丰速运')

"""
顺丰速运日常积分任务
Author: 爱学习的呆子
Version: 1.3.0
Date: 2026-04-04
"""

import hashlib
import json
import os
import random
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from urllib.parse import unquote, urlparse, parse_qs
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning

# ==================== Bark 推送配置 ====================
# 添加自定义参数，也可以留空
CUSTOM_BARK_ICON = "https://gitee.com/hlt1995/BARK_ICON/raw/main/SFExpress.png"   # 自定义图标
CUSTOM_BARK_GROUP = "顺丰速运"              # 自定义分组
PUSH_SWITCH = "1"                #推送开关，1开启，0关闭
# =======================================================

BARK_PUSH = os.getenv("BARK_PUSH")
BARK_ICON = CUSTOM_BARK_ICON or os.getenv("BARK_ICON", "")
BARK_GROUP = CUSTOM_BARK_GROUP or os.getenv("BARK_GROUP", "")

os.environ["BARK_ICON"] = BARK_ICON
os.environ["BARK_GROUP"] = BARK_GROUP
os.environ["PUSH_SWITCH"] = PUSH_SWITCH

# 禁用SSL警告
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

# ==================== 代理相关配置常量 ====================
PROXY_TIMEOUT = 15  # 代理超时时间（秒）
MAX_PROXY_RETRIES = 5  # 最大代理重试次数
REQUEST_RETRY_COUNT = 3  # 请求重试次数

# ==================== 并发配置常量 ====================
CONCURRENT_NUM = int(os.getenv('SFBF', '1'))  # 并发数量，默认为1（串行），最大20
if CONCURRENT_NUM > 20:
    CONCURRENT_NUM = 20
    print(f'⚠️ 并发数量超过最大值20，已自动调整为20')
elif CONCURRENT_NUM < 1:
    CONCURRENT_NUM = 1
    print(f'⚠️ 并发数量小于1，已自动调整为1（串行模式）')

# 全局线程锁
print_lock = Lock()  # 用于保护打印输出


# ==================== 配置类 ====================
@dataclass
class Config:
    """全局配置"""
    APP_NAME: str = "顺丰速运"
    VERSION: str = "1.2.0"
    ENV_NAME: str = "sfsyUrl"
    PROXY_API_URL: str = os.getenv('SF_PROXY_API_URL', '')
    
    # 代理相关配置常量
    PROXY_TIMEOUT = 15  # 代理时间（秒）
    MAX_PROXY_RETRIES = 5  # 最大代理重试次数
    REQUEST_RETRY_COUNT = 3  # 请求重试次数
    
    # API签名配置
    TOKEN: str = 'wwesldfs29aniversaryvdld29'
    SYS_CODE: str = 'MCS-MIMP-CORE'
    
    # 任务跳过列表
    SKIP_TASKS: List[str] = None
    
    def __post_init__(self):
        if self.SKIP_TASKS is None:
            # 尝试直接提交所有任务，看看能否领取奖励
            # 原本跳过的任务：'用行业模板寄件下单'、'去新增一个收件偏好'
            self.SKIP_TASKS = ['用行业模板寄件下单','用积分兑任意礼品','参与积分活动','每月累计寄件','完成每月任务','去使用AI寄件']


# ==================== 日志系统 ====================
class Logger:
    """
    日志管理器 - 实现图片中的日志风格
    """
    
    # 日志图标
    ICONS = {
        'task_found': '🎯',      # 发现任务
        'task_skip': '⏭️',       # 跳过任务
        'task_complete': '✅',   # 任务完成
        'reward_get': '🎁',      # 奖励领取
        'info': '📝',            # 普通信息
        'success': '✨',         # 成功
        'error': '❌',           # 错误
        'warning': '⚠️',        # 警告
        'user': '👤',            # 用户信息
        'money': '💰',           # 积分/金币
        'gift': '🎁',            # 礼物
        'target': '🎯',          # 目标
    }
    
    def __init__(self):
        self.messages: List[str] = []
        self.current_account_msg: List[str] = []
        self.lock = Lock()  # 每个Logger实例独立的锁
    
    def _format_msg(self, icon: str, content: str) -> str:
        """格式化消息"""
        return f"{icon} {content}"
    
    def _safe_print(self, msg: str):
        """线程安全的打印"""
        with print_lock:
            print(msg)
    
    def task_found(self, task_name: str, status: int = 2):
        """发现任务"""
        msg = self._format_msg(self.ICONS['task_found'], f"发现任务: {task_name} (状态: {status})")
        self._safe_print(msg)
        with self.lock:
            self.current_account_msg.append(msg)
            self.messages.append(msg)
    
    def task_skip(self, task_name: str):
        """跳过任务"""
        msg = self._format_msg(self.ICONS['task_skip'], f"[{task_name}] 已跳过")
        self._safe_print(msg)
        with self.lock:
            self.current_account_msg.append(msg)
            self.messages.append(msg)
    
    def task_complete(self, task_name: str):
        """任务完成"""
        msg = self._format_msg(self.ICONS['task_complete'], f"[{task_name}] 提交成功")
        self._safe_print(msg)
        with self.lock:
            self.current_account_msg.append(msg)
            self.messages.append(msg)
    
    def reward_get(self, task_name: str):
        """奖励领取成功"""
        msg = self._format_msg(self.ICONS['reward_get'], f"[{task_name}] 奖励领取成功")
        self._safe_print(msg)
        with self.lock:
            self.current_account_msg.append(msg)
            self.messages.append(msg)
    
    def info(self, content: str):
        """普通信息"""
        msg = self._format_msg(self.ICONS['info'], content)
        self._safe_print(msg)
        with self.lock:
            self.current_account_msg.append(msg)
            self.messages.append(msg)
    
    def success(self, content: str):
        """成功信息"""
        msg = self._format_msg(self.ICONS['success'], content)
        self._safe_print(msg)
        with self.lock:
            self.current_account_msg.append(msg)
            self.messages.append(msg)
    
    def error(self, content: str):
        """错误信息"""
        msg = self._format_msg(self.ICONS['error'], content)
        self._safe_print(msg)
        with self.lock:
            self.current_account_msg.append(msg)
            self.messages.append(msg)
    
    def warning(self, content: str):
        """警告信息"""
        msg = self._format_msg(self.ICONS['warning'], content)
        self._safe_print(msg)
        with self.lock:
            self.current_account_msg.append(msg)
            self.messages.append(msg)
    
    def user_info(self, account_index: int, mobile: str):
        """用户信息"""
        msg = self._format_msg(self.ICONS['user'], f"账号{account_index}: 【{mobile}】登录成功")
        self._safe_print(msg)
        with self.lock:
            self.current_account_msg.append(msg)
            self.messages.append(msg)
    
    def points_info(self, points: int, prefix: str = "当前积分"):
        """积分信息"""
        msg = self._format_msg(self.ICONS['money'], f"{prefix}: 【{points}】")
        self._safe_print(msg)
        with self.lock:
            self.current_account_msg.append(msg)
            self.messages.append(msg)
    
    def reset_account_msg(self):
        """重置当前账号消息"""
        self.current_account_msg = []
    
    def get_all_messages(self) -> str:
        """获取所有消息"""
        return '\n'.join(self.messages)
    
    def get_account_messages(self) -> str:
        """获取当前账号消息"""
        return '\n'.join(self.current_account_msg)


# ==================== 代理管理器 ====================
class ProxyManager:
    """代理管理器"""
    
    def __init__(self, api_url: str):
        self.api_url = api_url
        self.logger = Logger()
    
    def get_proxy(self) -> Optional[Dict[str, str]]:
        """获取代理
        返回格式：{'http': 'http://ip:port', 'https': 'http://ip:port'}
        """
        try:
            if not self.api_url:
                print('⚠️ 未配置代理API地址，将不使用代理')
                return None
            
            response = requests.get(self.api_url, timeout=10)
            if response.status_code == 200:
                proxy_text = response.text.strip()
                if ':' in proxy_text:
                    # 构建代理URL
                    if proxy_text.startswith('http://') or proxy_text.startswith('https://'):
                        proxy = proxy_text
                    else:
                        proxy = f'http://{proxy_text}'
                    
                    # 隐藏认证信息用于显示（如果有的话）
                    display_proxy = proxy
                    if '@' in proxy:
                        # 格式: http://user:pass@ip:port
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


# ==================== HTTP客户端 ====================
class SFHttpClient:
    """顺丰HTTP客户端"""
    
    def __init__(self, config: Config, proxy_manager: ProxyManager):
        self.config = config
        self.proxy_manager = proxy_manager
        self.session = requests.Session()
        self.session.verify = False
        
        # 设置代理
        proxy = self.proxy_manager.get_proxy()
        if proxy:
            self.session.proxies = proxy
        
        # 默认请求头
        self.headers = {
            'Host': 'mcs-mimp-web.sf-express.com',
            'upgrade-insecure-requests': '1',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36 NetType/WIFI MicroMessenger/7.0.20.1781(0x6700143B) WindowsWechat(0x63090551) XWEB/6945 Flue',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'sec-fetch-site': 'none',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-user': '?1',
            'sec-fetch-dest': 'document',
            'accept-language': 'zh-CN,zh',
            'platform': 'MINI_PROGRAM',
        }
    
    def _generate_sign(self) -> Dict[str, str]:
        """生成API签名"""
        timestamp = str(int(round(time.time() * 1000)))
        data = f'token={self.config.TOKEN}&timestamp={timestamp}&sysCode={self.config.SYS_CODE}'
        signature = hashlib.md5(data.encode()).hexdigest()
        
        return {
            'sysCode': self.config.SYS_CODE,
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
        """发送HTTP请求，带双层重试机制
        
        Args:
            url: 请求URL
            method: 请求方法 GET/POST
            data: 请求数据
            max_retries: 最大重试次数
            
        Returns:
            响应JSON数据或None
        """
        # 更新签名
        sign_data = self._generate_sign()
        self.headers.update(sign_data)
        
        retry_count = 0
        proxy_retry_count = 0
        
        while proxy_retry_count < MAX_PROXY_RETRIES:
            try:
                # 如果请求重试次数达到2次，尝试切换代理
                if retry_count >= 2:
                    print('请求已失败2次，尝试切换代理IP')
                    new_proxy = self.proxy_manager.get_proxy()
                    if new_proxy:
                        self.session.proxies = new_proxy
                    else:
                        print('⚠️ 切换代理失败，无可用代理')
                    retry_count = 0  # 重置请求重试计数
                
                try:
                    if method.upper() == 'GET':
                        response = self.session.get(url, headers=self.headers, timeout=PROXY_TIMEOUT)
                    elif method.upper() == 'POST':
                        response = self.session.post(url, headers=self.headers, json=data or {}, timeout=PROXY_TIMEOUT)
                    else:
                        raise ValueError(f'不支持的请求方法: {method}')
                    
                    # 检查响应状态码
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
                    # 如果是代理错误或SSL错误，增加代理重试计数
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
        """
        登录（兼容URL和CK格式）

        Args:
            url: 登录URL 或 CK字符串(sessionId=xxx;_login_mobile_=xxx;_login_user_id_=xxx)
            timeout: 超时时间（秒）

        Returns:
            tuple: (是否成功, user_id, 手机号)
        """
        try:
            decoded_input = unquote(url)
            if decoded_input.startswith('sessionId=') or '_login_mobile_=' in decoded_input:
                cookie_dict = {}
                for item in decoded_input.split(';'):
                    item = item.strip()
                    if '=' in item:
                        k, v = item.split('=', 1)
                        cookie_dict[k] = v
                for k, v in cookie_dict.items():
                    self.session.cookies.set(k, v, domain='mcs-mimp-web.sf-express.com')
                user_id = cookie_dict.get('_login_user_id_', '')
                phone = cookie_dict.get('_login_mobile_', '')
                if phone:
                    return True, user_id, phone
                else:
                    return False, '', ''
            else:
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


# ==================== 任务执行器 ====================
class TaskExecutor:
    """任务执行器"""
    
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
        self.total_points = 0
        
        # 任务相关属性
        self.taskId = ""
        self.taskCode = ""
        self.strategyId = ""
        self.title = ""
    
    @staticmethod
    def generate_device_id(characters: str = 'abcdef0123456789') -> str:
        """生成设备ID"""
        result = ''
        for char in 'xxxxxxxx-xxxx-xxxx':
            if char == 'x':
                result += random.choice(characters)
            else:
                result += char
        return result
    
    def _extract_task_id_from_url(self, url: str) -> str:
        """从URL中提取taskId"""
        try:
            from urllib.parse import parse_qs, urlparse, unquote
            import json
            
            # 处理_ug_view_param参数
            parsed = urlparse(url)
            params = parse_qs(parsed.query)
            
            if '_ug_view_param' in params:
                ug_params = json.loads(unquote(params['_ug_view_param'][0]))
                if 'taskId' in ug_params:
                    return str(ug_params['taskId'])  # 确保返回字符串类型
                    
            # 如果URL是JSON格式的，尝试解析
            if url.startswith('com.sf-express://'):
                json_str = url.split('_ug_view_param=')[1]
                ug_params = json.loads(unquote(json_str))
                if 'taskId' in ug_params:
                    return str(ug_params['taskId'])  # 确保返回字符串类型
                    
        except Exception as e:
            self.logger.warning(f'从URL提取taskId失败: {e}')
            
        return ''
        
    def _set_task_attrs(self, task: Dict) -> None:
        """设置任务属性"""
        self.taskId = str(task.get('taskId', ''))  # 确保是字符串类型
        self.taskCode = str(task.get('taskCode', ''))  # 确保是字符串类型
        self.strategyId = int(task.get('strategyId', 0))  # 确保是整数类型
        self.title = str(task.get('title', '未知任务'))
        self.point = int(task.get('point', 0))  # 确保是整数类型
        
        # 如果taskCode为空，尝试从buttonRedirect中提取
        if not self.taskCode and 'buttonRedirect' in task:
            extracted_task_id = self._extract_task_id_from_url(task['buttonRedirect'])
            if extracted_task_id:
                self.taskCode = extracted_task_id
                self.logger.info(f'从buttonRedirect中提取到taskId: {self.taskCode}')
    
    def app_sign_in(self) -> Dict:
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~integralTaskSignPlusService~getUnFetchPointAndDiscount'
        data = {}
        original_platform = self.http.headers.get('platform', 'MINI_PROGRAM')
        self.http.headers['platform'] = 'SFAPP'
        result = {'channel': 'APP签到', 'success': False, 'message': '', 'award': ''}
        try:
            response = self.http.request(url, data=data)
            if response and response.get('success'):
                obj = response.get('obj', [])
                if obj and isinstance(obj, list) and len(obj) > 0:
                    award_names = [item.get('packetName','') for item in obj]
                    result['success'] = True
                    result['award'] = '、'.join(award_names)
                    result['message'] = f"获得 {result['award']}"
                else:
                    # 尝试二次领取
                    time.sleep(1)
                    response2 = self.http.request(url, data=data)
                    if response2 and response2.get('success'):
                        obj2 = response2.get('obj', [])
                        if obj2 and isinstance(obj2, list) and len(obj2) > 0:
                            award_names2 = [item.get('packetName','') for item in obj2]
                            result['success'] = True
                            result['award'] = '、'.join(award_names2)
                            result['message'] = f"二次领取成功，获得 {result['award']}"
                        else:
                            result['success'] = True
                            result['message'] = '今日已签到，无待领取奖励'
                    else:
                        result['message'] = f"失败: {response2.get('errorMessage','') if response2 else '无响应'}"
                return result
            else:
                result['message'] = f"失败: {response.get('errorMessage','') if response else '无响应'}"
                return result
        finally:
            self.http.headers['platform'] = original_platform
    
    def sign_in(self) -> Dict:
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~integralTaskSignPlusService~automaticSignFetchPackage'
        data = {"comeFrom": "vioin", "channelFrom": "WEIXIN"}
        result = {'channel': '小程序签到', 'success': False, 'message': '', 'week_day': 0}
        response = self.http.request(url, data=data)
        if response and response.get('success'):
            count_day = response.get('obj', {}).get('countDay', 0)
            packet_list = response.get('obj', {}).get('integralTaskSignPackageVOList', [])
            week_day = count_day + 1
            result['week_day'] = week_day
            if packet_list:
                packet_name = packet_list[0].get('packetName', '未知')
                result['success'] = True
                result['message'] = f"签到成功，获得【{packet_name}】，本周累计签到{week_day}天"
            else:
                result['success'] = True
                result['message'] = f"今日已签到，本周累计签到{week_day}天"
        else:
            error_msg = response.get('errorMessage', '未知错误') if response else '请求失败'
            result['message'] = f"签到失败: {error_msg}"
        return result
    
    def new_sign_in(self) -> Dict:
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~integralSignV2Service~sign'
        data = {}
        original_platform = self.http.headers.get('platform', 'MINI_PROGRAM')
        self.http.headers['platform'] = 'SFAPP'
        result = {'channel': '新签到', 'success': False, 'message': '', 'detail': ''}
        try:
            response = self.http.request(url, data=data)
            if response and response.get('success'):
                obj = response.get('obj', {})
                signed = obj.get('signed', False)
                day_count = obj.get('dayCount', 0)
                if signed:
                    award = obj.get('award', {})
                    award_name = award.get('giftBagName', '')
                    result['success'] = True
                    result['message'] = f"签到成功，连续{day_count}天" + (f"，获得 {award_name}" if award_name else "")
                    result['detail'] = f"day={day_count}, award={award_name}"
                else:
                    result['success'] = True
                    result['message'] = f"今日已签到，连续{day_count}天"
                return result
            else:
                result['message'] = f"失败: {response.get('errorMessage','') if response else '无响应'}"
                return result
        finally:
            self.http.headers['platform'] = original_platform
    
    def get_task_list(self) -> List[Dict]:
        """获取任务列表"""
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~integralTaskStrategyService~queryPointTaskAndSignFromES'
        
        all_tasks = []
        task_codes_seen = set() 
        
        for channel_type in ['1', '2', '3', '4','01','02','03','04']:
            data = {
                'channelType': channel_type,
                'deviceId': self.generate_device_id(),
            }
            
            response = self.http.request(url, data=data)
            
            if response and response.get('success') and response.get('obj'):
                # 只在第一次请求时获取总积分
                if channel_type == '1':
                    self.total_points = response['obj'].get('totalPoint', 0)
                
                tasks = response['obj'].get('taskTitleLevels', [])
                
                # 去重添加任务
                for task in tasks:
                    task_code = task.get('taskCode')
                    task_title = task.get('title', '未知任务')
                    
                    # 尝试提取taskId
                    if 'buttonRedirect' in task:
                        extracted_id = self._extract_task_id_from_url(task['buttonRedirect'])
                        if extracted_id and not task_code:
                            task_code = extracted_id
                            task['taskCode'] = extracted_id
                    
                    # 如果taskCode为空，但能从buttonRedirect中提取到taskId，则使用提取的taskId
                    if not task_code and 'buttonRedirect' in task:
                        extracted_id = self._extract_task_id_from_url(task['buttonRedirect'])
                        if extracted_id:
                            task['taskCode'] = extracted_id
                            task_code = extracted_id
                    
                    # 如果taskCode仍然为空，则跳过
                    if not task_code:
                        continue
                        
                    # 检查是否已存在相同taskCode的任务
                    if task_code not in task_codes_seen:
                        task_codes_seen.add(task_code)
                        all_tasks.append(task)
            else:
                error_msg = response.get('errorMessage', '未知错误') if response else '请求失败'
                self.logger.warning(f'获取 channelType={channel_type} 的任务失败: {error_msg}')
        
        return all_tasks
    
    def execute_task(self) -> bool:
        """执行单个任务"""
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonRoutePost/memberEs/taskRecord/finishTask'
        data = {'taskCode': self.taskCode}
        
        response = self.http.request(url, data=data)
        if response and response.get('success'):
            return True
        return False
    
    def _update_points(self):
        """更新积分显示"""
        tasks = self.get_task_list()
        if tasks:
            self.logger.points_info(self.total_points, "当前积分")
    
    def receive_task_reward(self) -> bool:
        """领取任务奖励"""
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~integralTaskStrategyService~fetchIntegral'
        data = {
            "strategyId": self.strategyId,
            "taskId": self.taskId,
            "taskCode": self.taskCode,
            "deviceId": self.generate_device_id()
        }
        
        response = self.http.request(url, data=data)
        if response:
            if response.get('success'):
                self.logger.success(f'成功领取任务奖励: {self.title}')
                return True
        return False
    
    def get_welfare_list(self) -> List[Dict]:
        """获取生活特权列表"""
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberGoods~mallGoodsLifeService~list'
        data = {
            "memGrade": 3,
            "categoryCode": "SHTQ",
            "showCode": "SHTQWNTJ"
        }
        
        response = self.http.request(url, data=data)
        if response and response.get('success'):
            obj_list = response.get('obj', [])
            # 收集所有可领取的特权
            welfare_list = []
            for module in obj_list:
                goods_list = module.get('goodsList', [])
                for goods in goods_list:
                    # exchangeStatus=1 表示可以领取
                    if goods.get('exchangeStatus') == 1:
                        welfare_list.append({
                            'goodsId': goods.get('goodsId'),
                            'goodsNo': goods.get('goodsNo'),
                            'goodsName': goods.get('goodsName'),
                            'showName': goods.get('showName', ''),
                            'id': goods.get('id')
                        })
            return welfare_list
        return []
    
    def receive_welfare(self, goods_no: str, goods_name: str, task_code: str) -> bool:
        """领取生活特权"""
        url = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberGoods~pointMallService~createOrder'
        data = {
            "from": "Point_Mall",
            "orderSource": "POINT_MALL_EXCHANGE",
            "goodsNo": goods_no,
            "quantity": 1,
            "taskCode": task_code
        }
        
        response = self.http.request(url, data=data)
        if response and response.get('success'):
            order_no = response.get('obj', {}).get('orderNo', '')
            self.logger.success(f'成功领取生活特权: {goods_name} (订单号: {order_no})')
            return True
        else:
            error_msg = response.get('errorMessage', '未知错误') if response else '请求失败'
            self.logger.error(f'领取生活特权失败: {goods_name} - {error_msg}')
            return False
    
    def handle_welfare_task(self, task_title: str) -> bool:
        """处理领取生活特权任务"""
        self.logger.info('正在获取生活特权列表...')
        
        welfare_list = self.get_welfare_list()
        if not welfare_list:
            self.logger.warning('没有可领取的生活特权')
            return False
        
        self.logger.info(f'找到 {len(welfare_list)} 个可领取的生活特权')
        
        # 尝试领取第一个可用的特权
        for welfare in welfare_list:
            goods_no = welfare.get('goodsNo')
            goods_name = welfare.get('goodsName')
            show_name = welfare.get('showName')
            
            if not goods_no:
                continue
            
            display_name = f"{show_name} - {goods_name}" if show_name else goods_name
            
            # 使用任务的 taskCode
            if self.receive_welfare(goods_no, display_name, self.taskCode):
                return True
            
            # 如果领取失败,等待一下再尝试下一个
            time.sleep(1)
        
        return False
    
    def run_all_tasks(self) -> tuple[int, int]:
        """执行所有任务
        
        Returns:
            tuple: (执行前积分, 执行后积分)
        """
        print('-'*50)
        
        # 只在这里显示一次任务列表更新信息
        self.logger.info('正在获取任务列表...')
        tasks = self.get_task_list()
        if not tasks:
            self.logger.error('获取任务列表失败')
            return (0, 0)
        
        points_before = self.total_points
        self.logger.points_info(points_before, "执行前积分")
        
        for task in tasks:
            task_title = task.get('title', '未知任务')
            task_status = task.get('status')
            
            # 状态3表示已完成
            if task_status == 3:
                self.logger.success(f'{task_title} - 已完成')
                continue
            
            # 跳过特定任务
            if task_title in self.config.SKIP_TASKS:
                self.logger.task_skip(task_title)
                continue
            
            # 提取任务属性
            self._set_task_attrs(task)
            
            # 检查是否成功提取 taskCode
            if not self.taskCode:
                # 如果taskCode为空，尝试从buttonRedirect中提取
                if 'buttonRedirect' in task:
                    self.logger.info(f'尝试从buttonRedirect中提取taskCode: {task_title}')
                    extracted_task_id = self._extract_task_id_from_url(task['buttonRedirect'])
                    if extracted_task_id:
                        self.taskCode = extracted_task_id
                        self.logger.info(f'成功从buttonRedirect中提取到taskCode: {self.taskCode}')
                    else:
                        self.logger.warning(f'{task_title} - 无法从buttonRedirect提取taskCode，跳过')
                        continue
                else:
                    self.logger.warning(f'{task_title} - 无法提取taskCode，跳过')
                    continue
            
            # 发现任务
            self.logger.task_found(task_title, task_status)
            
            # 特殊任务处理 - 需要在状态判断之前处理
            if '领任意生活特权福利' in task_title:
                # 先处理生活特权领取
                if self.handle_welfare_task(task_title):
                    time.sleep(2)
                    # 然后执行任务提交
                    if self.execute_task():
                        self.logger.task_complete(task_title)
                        time.sleep(2)
                        # 领取奖励
                        if self.receive_task_reward():
                            self.logger.reward_get(task_title)
                            self._update_points()
                    else:
                        self.logger.warning(f'任务执行失败: {task_title}')
                else:
                    self.logger.warning(f'{task_title} - 无法完成,跳过')
                time.sleep(3)
                continue
            
            # 状态1表示需要先执行任务
            if task_status == 1:
                # 特殊处理连签7天任务
                if '连签7天' in task_title and 'process' in task:
                    current, total = map(int, task['process'].split('/'))
                    if current < total:
                        self.logger.info(f'【{task_title}】进度: {task["process"]}，还需{total - current}天')
                        continue
                
                if self.execute_task():
                    self.logger.task_complete(task_title)
                    time.sleep(2)
                    # 执行成功后，将状态更新为2（可领取奖励）
                    task_status = 2
                else:
                    self.logger.warning(f'任务执行失败: {task_title}')
                    continue
            
            # 状态2表示可领取奖励
            if task_status == 2:
                # 先尝试直接领取奖励
                if self.receive_task_reward():
                    self.logger.reward_get(task_title)
                    # 更新积分
                    self._update_points()
                    continue
                
                # 如果直接领取失败，尝试先执行任务再领取
                if self.execute_task():
                    self.logger.task_complete(task_title)
                    time.sleep(2)
                    # 再次尝试领取奖励
                    if self.receive_task_reward():
                        self.logger.reward_get(task_title)
                        self._update_points()
                else:
                    self.logger.warning(f'任务执行失败: {task_title}')
                continue
            
            time.sleep(3)
        
        # 获取最新积分
        tasks = self.get_task_list()
        points_after = self.total_points if tasks else points_before
        if tasks:
            self.logger.points_info(points_after, "执行后积分")
        
        return (points_before, points_after)


# ==================== 账号管理器 ====================
class AccountManager:
    """账号管理器"""
    
    def __init__(self, account_url: str, account_index: int, config: Config):
        self.account_url = account_url
        self.account_index = account_index + 1
        self.config = config
        self.logger = Logger()
        self.proxy_manager = ProxyManager(config.PROXY_API_URL)
        
        # 登录重试机制（参考顺丰代理.py的实现）
        self.login_success = False
        self.user_id = None
        self.phone = None
        self.http_client = None
        
        retry_count = 0
        while retry_count < MAX_PROXY_RETRIES and not self.login_success:
            try:
                # 每次重试都重新获取代理和创建HTTP客户端
                self.http_client = SFHttpClient(config, self.proxy_manager)
                
                # 尝试登录（带超时）
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
        
        # 如果所有代理重试都失败，记录错误
        if not self.login_success:
            self.logger.error(f'账号{self.account_index} 登录失败，已重试{MAX_PROXY_RETRIES}次，所有代理均不可用')
    
    def run(self) -> Dict[str, Any]:
        """运行账号任务
        
        Returns:
            Dict: 包含账号统计信息的字典
        """
        if not self.login_success:
            return {
                'success': False,
                'phone': '',
                'points_before': 0,
                'points_after': 0,
                'points_earned': 0
            }
        
        # 随机延迟
        wait_time = random.randint(1000, 3000) / 1000.0
        time.sleep(wait_time)
        
        # 初始化任务执行器
        executor = TaskExecutor(self.http_client, self.logger, self.config, self.user_id)
        
        sign_results = []
        app_sign_result = executor.app_sign_in()
        sign_results.append(app_sign_result)
        self.logger.info(f"[{app_sign_result['channel']}] {app_sign_result['message']}")
        time.sleep(1)
        
        new_sign_result = executor.new_sign_in()
        sign_results.append(new_sign_result)
        self.logger.info(f"[{new_sign_result['channel']}] {new_sign_result['message']}")
        time.sleep(1)
        
        sign_result = executor.sign_in()
        sign_results.append(sign_result)
        self.logger.info(f"[{sign_result['channel']}] {sign_result['message']}")
        
        # 如果小程序签到因代理问题失败，进行重试并更新 sign_results
        if not sign_result['success'] and '活动太火爆' in sign_result['message']:
            max_retries = 3
            for retry in range(max_retries):
                self.logger.warning(f'小程序签到失败（代理IP问题），{2}秒后重新获取代理并重试（第{retry + 1}次）...')
                time.sleep(2)
                try:
                    # 重新创建HTTP客户端（会自动获取新代理）
                    self.http_client = SFHttpClient(self.config, self.proxy_manager)
                    # 重新登录
                    success, self.user_id, self.phone = self.http_client.login(self.account_url)
                    if success:
                        # 更新执行器的HTTP客户端
                        executor.http = self.http_client
                        executor.user_id = self.user_id
                        # 重试小程序签到
                        sign_result = executor.sign_in()
                        sign_results[-1] = sign_result          # 更新列表中的最后一个元素
                        self.logger.info(f"[{sign_result['channel']}] {sign_result['message']}")
                        if sign_result['success']:
                            self.logger.success('重新登录后小程序签到成功')
                            break
                        elif '活动太火爆' not in sign_result['message']:
                            # 如果不是代理问题，则不再重试
                            break
                    else:
                        if retry == max_retries - 1:
                            self.logger.error(f'重新登录失败，已重试{max_retries}次')
                except Exception as e:
                    if retry == max_retries - 1:
                        self.logger.error(f'重新登录异常: {str(e)[:100]}，已重试{max_retries}次')
        
        # 执行其他任务
        points_before, points_after = executor.run_all_tasks()
        points_earned = points_after - points_before
        
        # 返回统计信息（注意加入 sign_results）
        return {
            'success': True,
            'phone': self.phone,
            'points_before': points_before,
            'points_after': points_after,
            'points_earned': points_earned,
            'sign_results': sign_results
        }

# ==================== 单账号执行函数 ====================
def run_single_account(account_info: str, index: int, config: Config) -> Dict[str, Any]:
    """
    执行单个账号的任务（线程安全）
    
    Args:
        account_info: 账号信息
        index: 账号索引
        config: 配置对象
    
    Returns:
        Dict: 包含账号统计信息的字典
    """
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
            'points_before': 0,
            'points_after': 0,
            'points_earned': 0,
            'error': error_msg
        }


# ==================== 主程序 ====================
def main():
    """主函数"""
    config = Config()

    env_value = os.getenv(config.ENV_NAME)
    if not env_value:
        print(f"❌ 未找到环境变量 {config.ENV_NAME}，请检查配置")
        return

    account_urls = [url.strip() for url in env_value.split('&') if url.strip()]
    if not account_urls:
        print(f"❌ 环境变量 {config.ENV_NAME} 为空或格式错误")
        return

    # 随机打乱账号顺序
    random.shuffle(account_urls)
    print(f"🔀 已随机打乱账号执行顺序")

    print("=" * 50)
    print(f"🎉 {config.APP_NAME} v{config.VERSION}")
    print(f"👨‍💻 作者: 爱学习的呆子")
    print(f"📱 共获取到 {len(account_urls)} 个账号")
    print(f"⚙️ 并发数量: {CONCURRENT_NUM}")
    print(f"⏰ 执行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # 收集所有账号的统计信息
    all_results = []
    
    if CONCURRENT_NUM <= 1:
        # 串行执行模式
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
        # 并发执行模式
        print(f"🔄 使用并发模式执行，并发数: {CONCURRENT_NUM}")
        
        # 使用线程池执行
        with ThreadPoolExecutor(max_workers=CONCURRENT_NUM) as executor:
            # 提交所有任务
            future_to_index = {
                executor.submit(run_single_account, account_url, index, config): index 
                for index, account_url in enumerate(account_urls)
            }
            
            # 等待任务完成
            for future in as_completed(future_to_index):
                result = future.result()
                all_results.append(result)
    
    # 按索引排序结果
    all_results.sort(key=lambda x: x['index'])
    
    # 统计成功和失败数量
    success_count = sum(1 for r in all_results if r['success'])
    fail_count = len(all_results) - success_count
    total_earned = sum(r['points_earned'] for r in all_results if r['success'])
    
    # 显示汇总统计表格
    print(f"\n" + "=" * 80)
    print(f"📊 积分统计汇总")
    print("=" * 80)
    print(f"{'序号':<6} {'手机号':<15} {'今日获得积分':<15} {'总积分':<15} {'状态':<10}")
    print("-" * 80)
    
    for result in all_results:
        index = result['index'] + 1
        phone = result['phone'][:3] + "****" + result['phone'][7:] if result['phone'] else "未登录"
        earned = result['points_earned']
        total = result['points_after']
        status = "✅成功" if result['success'] else "❌失败"
        
        print(f"{index:<6} {phone:<15} {earned:<15} {total:<15} {status:<10}")
    
    print("-" * 80)
    print(f"{'汇总':<6} {'账号总数: ' + str(len(all_results)):<15} {'今日总获得: ' + str(total_earned):<15} {'':<15} {'成功: ' + str(success_count):<10}")
    print("=" * 80)
    
    print("\n🎊 所有账号任务执行完成!")
    
    # ==================== Bark推送 ====================
    # Bark推送
    if PUSH_SWITCH == "1" and BARK_PUSH:
        bark_url = BARK_PUSH
        if not bark_url.startswith('http://') and not bark_url.startswith('https://'):
            bark_url = 'https://api.day.app/' + bark_url
        
        title = "🚚 顺丰速运签到结果\n"
        body = ""
        for r in all_results:
            index = r['index'] + 1
            phone = r.get('phone', '')
            masked_phone = phone[:3] + "****" + phone[7:] if phone and len(phone) == 11 else phone
            body += f"👤 账号{index}:【{masked_phone}】\n"
            if r.get('success'):
                # 签到详情
                sign_results = r.get('sign_results', [])
                for sign in sign_results:
                    channel = sign.get('channel', '签到')
                    if sign.get('success'):
                        body += f"✨ {channel}：{sign.get('message', '')}\n"
                    else:
                        body += f"⚠️ {channel}：{sign.get('message', '')}\n"
                points_earned = r.get('points_earned', 0)
                points_after = r.get('points_after', 0)
                body += f"💰 当前积分：【{points_after}】（{'+' if points_earned>=0 else ''}{points_earned}）\n"
            else:
                body += f"❌ 账号执行失败\n"
            body += "\n"
        
        try:
            data = {
                "title": title,
                "body": body.strip(),
                "icon": BARK_ICON,
                "group": BARK_GROUP
            }
            resp = requests.post(bark_url, json=data, timeout=10)
            if resp.status_code == 200:
                print("✅ Bark推送成功")
            else:
                print(f"⚠️ Bark推送失败，状态码: {resp.status_code}")
        except Exception as e:
            print(f"❌ Bark推送异常: {e}")
    else:
        if not BARK_PUSH:
            print("\n📱 未配置BARK_PUSH，跳过推送")
        elif PUSH_SWITCH != "1":
            print("\n📱 推送开关已关闭，跳过推送")


if __name__ == '__main__':
    main()
