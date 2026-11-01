# -*- coding: utf-8 -*-
"""
局部解剖学学习系统 - GitHub 仓库一键更新脚本
"""
import os
import sys
import subprocess

def run_cmd(cmd, cwd=None, check=True):
    return subprocess.run(cmd, cwd=cwd, check=check, text=True, capture_output=True)

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root_dir)

    print("=" * 64)
    print("   局部解剖学数字化学习系统 - GitHub 仓库一键更新")
    print("=" * 64)
    print()

    # 1. 同步最新资源到 Android assets
    print("[1/4] 正在同步系统资源至 Android Assets 目录...")
    try:
        from sync_to_android_assets import sync_assets
        sync_assets()
    except Exception as e:
        print(f"[警告] Android 资源同步出现提示: {e}")

    # 2. 检查并初始化 Git 仓库
    print("\n[2/4] 检查本地 Git 仓库状态...")
    if not os.path.exists(os.path.join(root_dir, ".git")):
        print("  正在初始化本地 Git 仓库 (分支: main)...")
        subprocess.run(["git", "init", "-b", "main"], cwd=root_dir, check=True)
    
    subprocess.run(["git", "config", "user.name", "TYXCcc"], cwd=root_dir)
    subprocess.run(["git", "config", "user.email", "tyxccc202011@163.com"], cwd=root_dir)

    # 检查 remote origin
    origin_url = ""
    try:
        res = subprocess.run(["git", "remote", "get-url", "origin"], cwd=root_dir, capture_output=True, text=True)
        if res.returncode == 0:
            origin_url = res.stdout.strip()
    except Exception:
        pass

    if origin_url:
        print(f"  当前绑定远程仓库: {origin_url}")
        change = input("  是否需要更改仓库地址? (y/N，直接回车保留原地址): ").strip().lower()
        if change == 'y':
            origin_url = ""

    while not origin_url:
        print("\n  提示：若未创建仓库，请在浏览器打开 https://github.com/new 创建一个新仓库")
        url_input = input("  请输入 GitHub 仓库地址 (如 https://github.com/TYXCcc/anatomy.git): ").strip()
        if not url_input:
            print("  [错误] 仓库地址不能为空，请重新输入。")
            continue
        origin_url = url_input
        subprocess.run(["git", "remote", "remove", "origin"], cwd=root_dir, stderr=subprocess.DEVNULL)
        subprocess.run(["git", "remote", "add", "origin", origin_url], cwd=root_dir, check=True)

    # 3. 提交本地代码变更
    print("\n[3/4] 正在提交本地更新...")
    commit_msg = input("  请输入本次更新说明 (直接回车默认为: 更新局部解剖学学习系统): ").strip()
    if not commit_msg:
        commit_msg = "更新局部解剖学学习系统"

    subprocess.run(["git", "add", "."], cwd=root_dir, check=True)
    
    # 检查是否有内容需要 commit
    status_res = subprocess.run(["git", "status", "--porcelain"], cwd=root_dir, capture_output=True, text=True)
    if status_res.stdout.strip():
        subprocess.run(["git", "commit", "-m", commit_msg], cwd=root_dir, check=True)
        print("  已完成本地 Commit。")
    else:
        print("  本地文件暂无变更，跳过 Commit。")

    # 4. 推送到 GitHub
    print(f"\n[4/4] 正在推送到远程 GitHub 仓库 ({origin_url})...")
    print("  请稍候（请确保网络畅通）...")

    push_res = subprocess.run(["git", "push", "-u", "origin", "main", "--force"], cwd=root_dir, text=True, capture_output=True)

    print()
    if push_res.returncode == 0:
        print("=" * 64)
        print("[SUCCESS] 仓库已成功更新并推送到 GitHub！")
        actions_url = origin_url.replace(".git", "") + "/actions"
        print(f"云端打包页面: {actions_url}")
        print("GitHub Actions 正在自动构建最新的 APK 安装包，可在上述页面下载。")
        print("=" * 64)
    else:
        print("=" * 64)
        print("[ERROR] 推送遇到问题，错误详情如下:")
        print(push_res.stderr)
        print("排查建议: 请检查网络连接、仓库地址是否正确，或登录凭据是否有效。")
        print("=" * 64)

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n[ERROR] 执行异常: {e}")
    input("\n按回车键退出...")
