# -*- coding: utf-8 -*-
"""
局部解剖学学习系统 - 手机局域网访问与 PWA 独立安装服务
"""
import http.server
import socketserver
import socket
import os
import sys
import subprocess

PORT = 8080

def get_ip_addresses():
    ips = []
    # Try powershell net ip address for Windows
    try:
        out = subprocess.check_output(
            ["powershell", "-NoProfile", "-Command", 
             "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -Property IPAddress, InterfaceAlias | ConvertTo-Json"],
            universal_newlines=True
        )
        import json
        data = json.loads(out)
        if isinstance(data, dict):
            data = [data]
        for item in data:
            alias = item.get("InterfaceAlias", "")
            ip = item.get("IPAddress", "")
            is_wlan = "WLAN" in alias or "Wi-Fi" in alias or "无线" in alias or "以太网" in alias or "Ethernet" in alias
            ips.append((ip, alias, is_wlan))
    except Exception:
        pass

    if not ips:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ips.append((s.getsockname()[0], "Default Interface", True))
            s.close()
        except Exception:
            ips.append(("127.0.0.1", "Localhost", False))
    return ips

def run_server():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root_dir)

    global PORT
    handler = http.server.SimpleHTTPRequestHandler
    # Enable cache headers and utf-8
    handler.extensions_map.update({
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.webmanifest': 'application/manifest+json',
    })

    while PORT < 8090:
        try:
            server = socketserver.TCPServer(("0.0.0.0", PORT), handler)
            break
        except OSError:
            PORT += 1

    ips = get_ip_addresses()
    # Sort so WLAN comes first
    ips.sort(key=lambda x: not x[2])

    print("=" * 64)
    print("   🏥《局部解剖学》移动端同步与 PWA 原生安装服务器已启动")
    print("=" * 64)
    print("\n【手机访问方法】")
    print("  1. 请确保手机与此电脑连接在同一个 Wi-Fi / 局域网下")
    print("  2. 在手机浏览器中直接输入以下网址访问：\n")

    primary_url = ""
    for ip, alias, is_wlan in ips:
        url = f"http://{ip}:{PORT}"
        tag = "[推荐 Wi-Fi 访问]" if is_wlan else f"[{alias}]"
        print(f"     👉  {url:<28}  {tag}")
        if is_wlan and not primary_url:
            primary_url = url

    if not primary_url and ips:
        primary_url = f"http://{ips[0][0]}:{PORT}"

    print("\n【免打包！1秒直接在安卓手机安装为独立原生 APP】")
    print("  • Chrome / Edge 浏览器：点击右上角菜单 ->「安装应用」或「添加到主屏幕」")
    print("  • 华为 / 小米 / 蓝绿厂自带浏览器：点击底部菜单 ->「添加到桌面」或「快捷方式」")
    print("  • 夸克 / Via / X 浏览器：点击工具箱 ->「添加到桌面」")
    print("  ★ 安装后：手机桌面会出现《局部解剖学》独立 App 图标！")
    print("  ★ 离线支持：由于内置 Service Worker 强缓存，打开一次后即使电脑关机或断网，")
    print("             手机也能 100% 离线顺畅学习全部 264 张闪卡、思维导图与题库！")
    print("=" * 64)
    print(f"服务运行中 (端口: {PORT})，按 Ctrl + C 可停止服务...\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止。")

if __name__ == "__main__":
    run_server()
