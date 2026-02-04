#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# cron: 30 9 * * *
# const $ = new Env('网络唤醒')
"""
Wake-On-LAN 网络唤醒
"""

import socket
import argparse
import sys
import os
import time
from typing import Optional

class WOLWakeOnLan:
    def __init__(self, broadcast_address: str = '255.255.255.255', port: int = 9,
                 repeat: int = 3, interval: float = 0.3):
        """
        :param broadcast_address: 广播地址
        :param port: UDP 端口
        :param repeat: 发送次数
        :param interval: 每次发送间隔（秒）
        """
        self.broadcast_address = broadcast_address
        self.port = port
        self.repeat = repeat
        self.interval = interval
    
    def create_magic_packet(self, mac_address: str) -> bytes:
        mac_address = mac_address.replace(':', '').replace('-', '')
        if len(mac_address) != 12:
            raise ValueError("MAC地址格式不正确")
        try:
            mac_bytes = bytes.fromhex(mac_address)
        except ValueError:
            raise ValueError("MAC地址包含无效字符")
        return b'\xff' * 6 + mac_bytes * 16
    
    def wake_up(self, mac_address: str, interface: Optional[str] = None) -> bool:
        try:
            magic_packet = self.create_magic_packet(mac_address)
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
                sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
                if interface:
                    try:
                        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BINDTODEVICE, interface.encode())
                    except OSError:
                        print(f"⚠️ 无法绑定到接口 {interface}，使用默认接口")
                for i in range(1, self.repeat + 1):
                    sock.sendto(magic_packet, (self.broadcast_address, self.port))
                    # print(f"📡 已发送第 {i}/{self.repeat} 个幻数据包 → {self.broadcast_address}:{self.port}")
                    if i < self.repeat:
                        time.sleep(self.interval)
            print(f"✅ 发送幻数据包成功，目标 MAC: {mac_address}")
            return True
        except Exception as e:
            print(f"❌ 发送幻数据包失败: {e}")
            return False

def get_mac_from_env() -> str:
    mac_address = os.getenv('WOL_MAC')
    if not mac_address:
        print("❌ 请设置 WOL_MAC 环境变量")
        sys.exit(1)
    return mac_address

def main():
    env_broadcast = os.getenv('WOL_IP', '255.255.255.255')
    env_port = int(os.getenv('WOL_PORT', '9'))
    env_interface = os.getenv('WOL_INTERFACE')
    env_repeat = int(os.getenv('WOL_REPEAT', '3'))
    env_interval = float(os.getenv('WOL_INTERVAL', '0.3'))

    parser = argparse.ArgumentParser(description='WOL 网络唤醒')
    parser.add_argument('mac', nargs='?', help='目标 MAC 地址')
    parser.add_argument('-b', '--broadcast', default=env_broadcast)
    parser.add_argument('-p', '--port', type=int, default=env_port)
    parser.add_argument('-i', '--interface', default=env_interface)
    parser.add_argument('-r', '--repeat', type=int, default=env_repeat,
                        help='发送次数（默认来自 WOL_REPEAT）')
    parser.add_argument('-t', '--interval', type=float, default=env_interval,
                        help='发送间隔秒（默认来自 WOL_INTERVAL）')

    args = parser.parse_args()

    mac_address = args.mac if args.mac else get_mac_from_env()

    wol = WOLWakeOnLan(
        broadcast_address=args.broadcast,
        port=args.port,
        repeat=args.repeat,
        interval=args.interval
    )

    success = wol.wake_up(mac_address, args.interface)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
