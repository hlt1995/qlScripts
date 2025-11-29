#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# const $ = new Env('网络唤醒')
"""
Wake-on-LAN 网络唤醒
"""

import socket
import struct
import argparse
import sys
import os
import re
from typing import Optional, List, Tuple

class WOLWakeOnLan:
    def __init__(self, broadcast_address: str = '225.225.225.255', port: int = 9):
        self.broadcast_address = broadcast_address
        self.port = port
    
    def create_magic_packet(self, mac_address: str) -> bytes:
        mac_address = mac_address.replace(':', '').replace('-', '')
        
        if len(mac_address) != 12:
            raise ValueError("❌ MAC地址格式不正确")
        
        try:
            mac_bytes = bytes.fromhex(mac_address)
        except ValueError:
            raise ValueError("❌ MAC地址包含无效字符")
        
        magic_packet = b'\xff' * 6 + mac_bytes * 16
        return magic_packet
    
    def wake_up(self, mac_address: str, interface: Optional[str] = None) -> bool:
        try:
            ip_pattern = re.compile(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$')
            
            if not ip_pattern.match(self.broadcast_address):
                print(f"🔍 正在解析域名: {self.broadcast_address}")
                try:
                    resolved_ip = socket.gethostbyname(self.broadcast_address)
                    print(f"🔍 解析结果: {resolved_ip}")
                    target_address = resolved_ip
                except socket.gaierror as e:
                    print(f"❌ 域名解析失败: {e}")
                    return False
            else:
                target_address = self.broadcast_address

            magic_packet = self.create_magic_packet(mac_address)
            
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
                sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
                
                if interface:
                    try:
                        sock.setsockopt(socket.SOL_SOCKET, socket.SO_BINDTODEVICE, interface.encode())
                    except OSError:
                        print(f"⚠️ 无法绑定到接口 {interface}，使用默认接口")
                
                sock.sendto(magic_packet, (target_address, self.port))
                
                print(f"📍 目标 MAC: {mac_address}")
                print(f"📡 广播地址: {target_address}:{self.port}")
                if interface:
                    print(f"🔌 网络接口: {interface}")
                print(f"✅ 幻数据包已发送！")
                
                return True
                
        except Exception as e:
            print(f"❌ 发送幻数据包失败: {e}")
            return False

def is_multi_device_mode() -> bool:
    macs_env = os.getenv('WOL_MAC', '')
    return '&' in macs_env

def parse_device_configs() -> List[Tuple[str, str, int]]:
    macs_env = os.getenv('WOL_MAC', '')
    ips_env = os.getenv('WOL_IP', '225.225.225.255')
    ports_env = os.getenv('WOL_PORT', '9')
    
    if not macs_env:
        print("❌ 请设置 WOL_MAC 环境变量")
        sys.exit(1)
    
    macs = [mac.strip() for mac in macs_env.split('&') if mac.strip()]
    ips = [ip.strip() for ip in ips_env.split('&') if ip.strip()]
    ports = [port.strip() for port in ports_env.split('&') if port.strip()]
    
    print(f"🔍️ 检测到 {len(macs)} 台设备")
    
    if len(ips) == 1 and len(macs) > 1:
        print("📝 当前配置：所有设备处于同一IP地址")
        ips = ips * len(macs)
    
    if len(ports) == 1 and len(macs) > 1:
        print("📝 当前配置：所有设备使用同一唤醒端口")
        ports = ports * len(macs)
    
    if len(macs) != len(ips) or len(macs) != len(ports):
        print("❌ 环境变量配置不匹配")
        print(f"  MAC地址数量: {len(macs)}")
        print(f"  IP地址数量: {len(ips)}")
        print(f"  端口数量: {len(ports)}")
        print("💡 请确保:")
        print("   - 单设备: WOL_MAC=AA-BB-CC-DD-EE-FF")
        print("   - 多设备: WOL_MAC=AA-BB-CC-DD-EE-FF&BB-CC-DD-EE-FF-GG")
        print("   - 多IP/端口: 使用相同数量的&分隔符")
        sys.exit(1)
    
    try:
        ports = [int(port) for port in ports]
    except ValueError:
        print("❌ 端口号必须为整数")
        sys.exit(1)
    
    return list(zip(macs, ips, ports))

def get_single_device_config() -> Tuple[str, str, int]:
    mac_env = os.getenv('WOL_MAC', '')
    ip_env = os.getenv('WOL_IP', '225.225.225.255')
    port_env = os.getenv('WOL_PORT', '9')
    
    if not mac_env:
        print("❌ 请设置 WOL_MAC 环境变量")
        sys.exit(1)
    
    mac = mac_env.split('&')[0].strip() if '&' in mac_env else mac_env
    ip = ip_env.split('&')[0].strip() if '&' in ip_env else ip_env
    
    try:
        port = int(port_env.split('&')[0].strip()) if '&' in port_env else int(port_env)
    except ValueError:
        print("❌ 端口号必须为整数")
        sys.exit(1)
    
    return mac, ip, port

def wake_multiple_devices(interface: Optional[str] = None) -> bool:
    devices = parse_device_configs()
    
    print(f"🖥️ 正在唤醒设备...\n")
    
    success_count = 0
    for i, (mac, ip, port) in enumerate(devices, 1):
        print(f"--- 设备 {i}/{len(devices)} ---")
        wol = WOLWakeOnLan(broadcast_address=ip, port=port)
        if wol.wake_up(mac, interface):
            success_count += 1
        print()  # 空行分隔
    
    return success_count > 0

def wake_single_device(mac: str = None, ip: str = None, port: int = None, interface: Optional[str] = None) -> bool:
    if mac is None or ip is None or port is None:
        mac, ip, port = get_single_device_config()
    
    print(f"🖥️ 正在唤醒设备...\n")
    wol = WOLWakeOnLan(broadcast_address=ip, port=port)
    return wol.wake_up(mac, interface)

def main():
    # 从环境变量读取配置
    env_interface = os.getenv('WOL_INTERFACE')
    
    parser = argparse.ArgumentParser(description='WOL远程开机脚本')
    parser.add_argument('mac', nargs='?', help='目标设备的MAC地址 (格式: XX:XX:XX:XX:XX:XX)')
    parser.add_argument('-b', '--broadcast', 
                       help='广播地址 (默认从WOL_IP环境变量读取)')
    parser.add_argument('-p', '--port', type=int, 
                       help='端口号 (默认从WOL_PORT环境变量读取)')
    parser.add_argument('-i', '--interface', default=env_interface, 
                       help='网络接口名称')
    parser.add_argument('--list-interfaces', action='store_true', 
                       help='列出可用的网络接口')
    parser.add_argument('--single', action='store_true',
                       help='强制单设备模式')
    parser.add_argument('--multi', action='store_true',
                       help='强制多设备模式')
    
    args = parser.parse_args()
    
    if args.list_interfaces:
        print("可用的网络接口:")
        try:
            import netifaces
            interfaces = netifaces.interfaces()
            for iface in interfaces:
                addrs = netifaces.ifaddresses(iface)
                if netifaces.AF_INET in addrs:
                    ip = addrs[netifaces.AF_INET][0]['addr']
                    print(f"  {iface}: {ip}")
        except ImportError:
            print("  ℹ️ 需要安装netifaces库来显示接口信息")
            print("  💡 运行: pip install netifaces")
        return
    
    if args.multi:
        print("🔧 强制多设备模式")
        success = wake_multiple_devices(args.interface)
    elif args.single:
        print("🔧 强制单设备模式")
        if args.mac:
            ip = args.broadcast if args.broadcast else os.getenv('WOL_IP', '225.225.225.255')
            port = args.port if args.port else int(os.getenv('WOL_PORT', '9'))
            success = wake_single_device(args.mac, ip, port, args.interface)
        else:
            success = wake_single_device(interface=args.interface)
    else:
        if is_multi_device_mode():
            success = wake_multiple_devices(args.interface)
        else:
            if args.mac:
                ip = args.broadcast if args.broadcast else os.getenv('WOL_IP', '225.225.225.255')
                port = args.port if args.port else int(os.getenv('WOL_PORT', '9'))
                success = wake_single_device(args.mac, ip, port, args.interface)
            else:
                success = wake_single_device(interface=args.interface)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()