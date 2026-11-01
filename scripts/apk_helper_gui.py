# -*- coding: utf-8 -*-
"""
局部解剖学 - 移动端与 APK 制作图形化助手 (GUI)
彻底规避 Windows CMD 编码乱码问题，提供最直观的打包体验
"""
import tkinter as tk
from tkinter import ttk, messagebox
import os
import subprocess
import webbrowser
import threading

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZIP_PATH = os.path.join(os.path.dirname(ROOT_DIR), "局部解剖学_手机离线安装包(用于在线打包APK).zip")

class ApkHelperApp:
    def __init__(self, root):
        self.root = root
        self.root.title("🏥 局部解剖学 - 手机 App 与 APK 制作助手")
        self.root.geometry("680x620")
        self.root.resizable(False, False)

        # Apply styling
        style = ttk.Style()
        style.theme_use('clam')

        self.create_widgets()

    def create_widgets(self):
        # Header
        header_frame = tk.Frame(self.root, bg="#2563eb", padx=20, pady=15)
        header_frame.pack(fill=tk.X)

        title_lbl = tk.Label(header_frame, text="局部解剖学 · 移动端与 APK 打包工作台", 
                             font=("Microsoft YaHei UI", 14, "bold"), fg="#ffffff", bg="#2563eb")
        title_lbl.pack(anchor="w")

        sub_lbl = tk.Label(header_frame, text="已完整接入全部 264 张精要闪卡、全景思维导图、1,281 道题库及 143 例病例", 
                           font=("Microsoft YaHei UI", 9), fg="#dbeafe", bg="#2563eb")
        sub_lbl.pack(anchor="w", pady=(3, 0))

        # Main container
        main_frame = tk.Frame(self.root, padx=20, pady=15)
        main_frame.pack(fill=tk.BOTH, expand=True)

        # Tab 1: Method 1 (Online 1-click APK)
        m1_group = tk.LabelFrame(main_frame, text=" 🌟 方案一：在线 1 键免配置打包 APK（最省心 · 30秒扫码装） ", 
                                 font=("Microsoft YaHei UI", 10, "bold"), padx=12, pady=10)
        m1_group.pack(fill=tk.X, pady=(0, 12))

        m1_desc = tk.Label(m1_group, text="已自动将系统全部资源精简压缩为仅 637 KB 的离线专用包。\n只需上传至免费平台即可直接生成下载二维码：", 
                           font=("Microsoft YaHei UI", 9), justify=tk.LEFT)
        m1_desc.pack(anchor="w")

        m1_btn_box = tk.Frame(m1_group, pady=8)
        m1_btn_box.pack(fill=tk.X)

        btn_show_zip = tk.Button(m1_btn_box, text="📁 1. 在电脑中查看离线安装包 (ZIP)", 
                                 bg="#0284c7", fg="#ffffff", font=("Microsoft YaHei UI", 9, "bold"), 
                                 padx=10, pady=5, relief=tk.FLAT, cursor="hand2", command=self.locate_zip)
        btn_show_zip.pack(side=tk.LEFT, padx=(0, 10))

        btn_open_web = tk.Button(m1_btn_box, text="🌐 2. 打开免费一键打包平台 (一门APP)", 
                                 bg="#16a34a", fg="#ffffff", font=("Microsoft YaHei UI", 9, "bold"), 
                                 padx=10, pady=5, relief=tk.FLAT, cursor="hand2", command=self.open_online_pack)
        btn_open_web.pack(side=tk.LEFT)

        # Tab 2: Method 2 (GitHub Actions Cloud Compile)
        m2_group = tk.LabelFrame(main_frame, text=" 🚀 方案二：GitHub Actions 云端全自动打包 APK ", 
                                 font=("Microsoft YaHei UI", 10, "bold"), padx=12, pady=10)
        m2_group.pack(fill=tk.X, pady=(0, 12))

        m2_desc = tk.Label(m2_group, text="输入您的 GitHub 仓库链接，本工具将全自动完成资源同步、Git 初始化并推送到云端自动编译：", 
                           font=("Microsoft YaHei UI", 9), justify=tk.LEFT)
        m2_desc.pack(anchor="w")

        url_box = tk.Frame(m2_group, pady=6)
        url_box.pack(fill=tk.X)

        tk.Label(url_box, text="GitHub 仓库链接:", font=("Microsoft YaHei UI", 9, "bold")).pack(side=tk.LEFT, padx=(0, 5))
        self.entry_repo = tk.Entry(url_box, font=("Consolas", 9), width=42)
        self.entry_repo.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 8))
        self.entry_repo.insert(0, "https://github.com/TYXCcc/anatomy.git")

        btn_paste = tk.Button(url_box, text="粘贴", font=("Microsoft YaHei UI", 8), command=self.paste_clipboard)
        btn_paste.pack(side=tk.LEFT, padx=(0, 8))

        self.btn_push = tk.Button(m2_group, text="⚡ 一键同步并推送到 GitHub 开始自动编译", 
                                  bg="#2563eb", fg="#ffffff", font=("Microsoft YaHei UI", 9, "bold"), 
                                  pady=6, relief=tk.FLAT, cursor="hand2", command=self.start_github_push)
        self.btn_push.pack(fill=tk.X, pady=(4, 0))

        # Tab 3: Method 3 (LAN PWA)
        m3_group = tk.LabelFrame(main_frame, text=" 📱 方案三：手机局域网无线免打包模式 (PWA 原生全屏独立 App) ", 
                                 font=("Microsoft YaHei UI", 10, "bold"), padx=12, pady=10)
        m3_group.pack(fill=tk.X, pady=(0, 10))

        m3_desc = tk.Label(m3_group, text="手机与电脑连同一个 Wi-Fi，打开浏览器点击「添加到主屏幕」，即刻生成独立 App 图标，100% 离线可用：", 
                           font=("Microsoft YaHei UI", 9), justify=tk.LEFT)
        m3_desc.pack(anchor="w")

        btn_lan = tk.Button(m3_group, text="📶 启动手机无线同步局域网服务", 
                            bg="#7c3aed", fg="#ffffff", font=("Microsoft YaHei UI", 9, "bold"), 
                            pady=6, relief=tk.FLAT, cursor="hand2", command=self.start_lan_server)
        btn_lan.pack(fill=tk.X, pady=(6, 0))

        # Log Output Console
        log_frame = tk.LabelFrame(main_frame, text=" 实时执行状态与日志 ", font=("Microsoft YaHei UI", 9), padx=8, pady=6)
        log_frame.pack(fill=tk.BOTH, expand=True)

        self.log_text = tk.Text(log_frame, font=("Consolas", 8), height=6, bg="#0f172a", fg="#f8fafc")
        self.log_text.pack(fill=tk.BOTH, expand=True)
        self.log("✅ 打包助手初始化完成。请根据需要选择上述三种方案之一。")

    def log(self, text):
        self.log_text.insert(tk.END, text + "\n")
        self.log_text.see(tk.END)

    def locate_zip(self):
        if not os.path.exists(ZIP_PATH):
            from sync_to_android_assets import sync_assets
            sync_assets()
        subprocess.run(f'explorer /select,"{ZIP_PATH}"', shell=True)
        self.log(f"[方案一] 已在文件管理器中定位离线包: {ZIP_PATH}")

    def open_online_pack(self):
        url = "https://www.yimenapp.com/"
        webbrowser.open(url)
        self.log(f"[方案一] 已在浏览器打开免费在线打包平台: {url}")
        self.log("💡 提示：进入网站后选择「本地HTML/离线包打包」，上传刚才高亮选中的 ZIP 文件即可一键生成 APK！")

    def paste_clipboard(self):
        try:
            cb = self.root.clipboard_get().strip()
            self.entry_repo.delete(0, tk.END)
            self.entry_repo.insert(0, cb)
        except Exception:
            pass

    def start_github_push(self):
        repo_url = self.entry_repo.get().strip()
        if not repo_url:
            messagebox.showwarning("提示", "请输入有效的 GitHub 仓库链接！")
            return

        self.btn_push.config(state=tk.DISABLED, text="正在推送代码，请稍候...")
        threading.Thread(target=self.run_git_push_thread, args=(repo_url,), daemon=True).start()

    def run_git_push_thread(self, repo_url):
        try:
            self.log("\n[方案二] 开始同步 Android 静态资源...")
            subprocess.run(["python", os.path.join(ROOT_DIR, "scripts", "sync_to_android_assets.py")], cwd=ROOT_DIR, check=True)

            self.log("[方案二] 初始化 Git 仓库...")
            subprocess.run(["git", "init", "-b", "main"], cwd=ROOT_DIR, check=True)
            subprocess.run(["git", "config", "user.name", "TYXCcc"], cwd=ROOT_DIR)
            subprocess.run(["git", "config", "user.email", "tyxccc202011@163.com"], cwd=ROOT_DIR)

            subprocess.run(["git", "remote", "remove", "origin"], cwd=ROOT_DIR, stderr=subprocess.DEVNULL)
            subprocess.run(["git", "remote", "add", "origin", repo_url], cwd=ROOT_DIR, check=True)

            self.log("[方案二] 正在暂存文件与提交...")
            subprocess.run(["git", "add", "."], cwd=ROOT_DIR, check=True)
            subprocess.run(["git", "commit", "-m", "Feat: Complete Regional Anatomy App with 264 cards and APK workflow"], cwd=ROOT_DIR)

            self.log("[方案二] 正在推送到 GitHub（请保持网络畅通）...")
            proc = subprocess.run(["git", "push", "-u", "origin", "main", "--force"], cwd=ROOT_DIR, capture_output=True, text=True)

            if proc.returncode == 0:
                self.log("🎉 [成功] 代码已成功推送至 GitHub！")
                actions_url = repo_url.replace(".git", "") + "/actions"
                self.log(f"👉 正在自动为您打开云端打包页面: {actions_url}")
                webbrowser.open(actions_url)
                messagebox.showinfo("推送成功", "代码已成功推送至 GitHub！\n正在为您打开 Actions 页面，请等待 1~2 分钟编译完成后直接下载 APK。")
            else:
                self.log(f"❌ 推送失败:\n{proc.stderr}")
                messagebox.showerror("推送失败", f"推送遇到问题，请检查网络或仓库地址:\n{proc.stderr}")
        except Exception as e:
            self.log(f"❌ 运行异常: {e}")
            messagebox.showerror("错误", str(e))
        finally:
            self.btn_push.config(state=tk.NORMAL, text="⚡ 一键同步并推送到 GitHub 开始自动编译")

    def start_lan_server(self):
        bat = os.path.join(ROOT_DIR, "启动手机局域网同步.bat")
        subprocess.Popen(f'start cmd /k "{bat}"', shell=True, cwd=ROOT_DIR)
        self.log("[方案三] 已启动局域网无线服务控制台。请查看弹出的黑色窗口获取手机访问网址。")

if __name__ == "__main__":
    root = tk.Tk()
    app = ApkHelperApp(root)
    root.mainloop()
