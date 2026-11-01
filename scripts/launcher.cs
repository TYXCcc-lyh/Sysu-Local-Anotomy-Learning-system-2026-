using System;
using System.IO;
using System.Diagnostics;
using System.Windows.Forms;

namespace SYSU.AnatomyApp
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            try
            {
                // 1. Locate index.html
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                string htmlPath = Path.Combine(baseDir, "index.html");

                if (!File.Exists(htmlPath))
                {
                    htmlPath = Path.Combine(Directory.GetCurrentDirectory(), "index.html");
                }

                if (!File.Exists(htmlPath))
                {
                    MessageBox.Show(
                        "未能检测到核心页面文件 index.html！\n\n请确保「局部解剖学学习系统.exe」与 index.html 放置在同一目录下。",
                        "局部解剖学学习系统 - 启动提示",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Warning
                    );
                    return;
                }

                string fileUri = new Uri(htmlPath).AbsoluteUri;

                // 2. Locate Modern Chromium Browser (Edge or Chrome)
                string browserPath = FindBrowser();

                if (!string.IsNullOrEmpty(browserPath))
                {
                    // Create dedicated isolated data dir so LocalStorage is permanent and window runs as standalone App
                    string appData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                    string profileDir = Path.Combine(appData, "SYSU_Anatomy_App_Profile");

                    string arguments = string.Format(
                        "--app=\"{0}\" --user-data-dir=\"{1}\" --window-size=1440,920 --disable-features=Translate",
                        fileUri,
                        profileDir
                    );

                    ProcessStartInfo startInfo = new ProcessStartInfo
                    {
                        FileName = browserPath,
                        Arguments = arguments,
                        UseShellExecute = false,
                        WindowStyle = ProcessWindowStyle.Normal
                    };

                    Process.Start(startInfo);
                }
                else
                {
                    // Fallback to default browser
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = fileUri,
                        UseShellExecute = true
                    });
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "启动系统时发生错误：\n" + ex.Message,
                    "错误",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }

        private static string FindBrowser()
        {
            string[] candidatePaths = new string[]
            {
                // Microsoft Edge
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Edge\Application\msedge.exe"),
                
                // Google Chrome
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe")
            };

            foreach (string path in candidatePaths)
            {
                if (!string.IsNullOrEmpty(path) && File.Exists(path))
                {
                    return path;
                }
            }

            return null;
        }
    }
}
