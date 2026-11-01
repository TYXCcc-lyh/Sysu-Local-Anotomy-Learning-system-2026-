# -*- coding: utf-8 -*-
import os

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

bat_files = {
    "一键推送到GitHub自动打包APK.bat": r"""@echo off
chcp 65001 >nul
title GitHub Actions 云端一键打包 APK 脚本
cd /d "%~dp0"

echo ===================================================================
echo     局部解剖学数字化学习系统 - GitHub Actions 自动化云端构建 APK
echo ===================================================================
echo.
echo 【打包原理】
echo  系统已为您配置好 .github/workflows/build-apk.yml 工作流。
echo  推送到您的 GitHub 仓库后，GitHub 云端虚拟机会全自动调用
echo  Android SDK 与 JDK 17 进行编译，并在 2 分钟内生成 APK 供下载！
echo.
echo -------------------------------------------------------------------
echo 【第一步：创建 GitHub 仓库】
echo  1. 打开浏览器登录 https://github.com
echo  2. 点击右上角 "+" 号 -^> "New repository"
echo  3. 仓库名填 anatomy（或其他名称），设为 Public 或 Private 均可
echo  4. 不要勾选 Initialize with README，点击 "Create repository"
echo  5. 复制仓库的 HTTPS 链接（形如：https://github.com/用户名/anatomy.git）
echo -------------------------------------------------------------------
echo.
set "REPO_URL="
set /p REPO_URL=请输入您刚复制的 GitHub 仓库链接: 

if not defined REPO_URL (
    echo.
    echo [错误] 您没有输入 GitHub 仓库链接，操作已取消。
    echo 请先在 GitHub 网页上新建仓库后，复制链接再次运行本脚本。
    echo.
    pause
    exit /b
)

echo.
echo 正在准备代码与 Android 资源同步...
python scripts\sync_to_android_assets.py

echo.
echo 正在初始化 Git 仓库...
git init -b main
git config user.name "TYXCcc"
git config user.email "tyxccc202011@163.com"

git remote remove origin >nul 2>nul
git remote add origin %REPO_URL%

echo.
echo 正在提交代码...
git add .
git commit -m "Feat: Complete Regional Anatomy App with 264 cards and APK workflow"

echo.
echo 正在推送到 GitHub...
git push -u origin main --force

if %ERRORLEVEL% equ 0 (
    echo.
    echo ===================================================================
    echo [成功] 代码已成功推送到 GitHub！
    echo.
    echo 【第二步：下载 APK 文件】
    echo  1. 打开您的 GitHub 仓库页面；
    echo  2. 点击顶部的 [Actions] 标签页；
    echo  3. 会看到 "Build Android APK" 正在运行（黄色小圈）；
    echo  4. 等待约 1~2 分钟变为绿色对勾后，点击进入；
    echo  5. 在页面底部 [Artifacts] 处，直接点击下载：
    echo     RegionalAnatomy-debug.apk
    echo  6. 发送到安卓手机直接安装即可！
    echo ===================================================================
) else (
    echo.
    echo [提示] 推送遇到问题，请检查网络或 GitHub 仓库地址。
)

echo.
pause
""",
    "启动手机局域网同步.bat": r"""@echo off
chcp 65001 >nul
title 局部解剖学移动端局域网同步服务
cd /d "%~dp0"
echo 正在启动局域网同步服务...
python scripts\serve_mobile.py
pause
""",
    "打开学习系统.bat": r"""@echo off
chcp 65001 >nul
title 局部解剖学学习系统
cd /d "%~dp0"
start 局部解剖学学习系统.exe
""",
    "打包APK助手.bat": r"""@echo off
chcp 65001 >nul
title 局部解剖学 - 移动端与 APK 打包助手
cd /d "%~dp0"
python scripts\apk_helper_gui.py
"""
}

for fname, text in bat_files.items():
    crlf_text = text.replace('\r\n', '\n').replace('\n', '\r\n')
    fpath = os.path.join(root, fname)
    # Write UTF-8 with BOM
    with open(fpath, "wb") as f:
        f.write(b'\xef\xbb\xbf' + crlf_text.encode("utf-8"))
    print("Updated successfully in UTF-8-BOM/CRLF:", fname)
