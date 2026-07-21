# IOC 原型协作与在线预览

## 固定工作链路

1. 在装有 Axhub Make 的电脑上，从 GitHub 下载本项目并在 Axhub 中选择“添加本地已有项目”。
2. 在 Codex 中打开同一个项目目录，输入原型需求。
3. Codex 修改 `src/prototypes/` 下的原型文件并完成本地验收。
4. Windows 定时任务每 5 分钟自动提交并推送改动。
5. GitHub Actions 自动构建，发布完成后在线预览地址自动更新。

在线预览运行在 GitHub，不依赖公司或家里的电脑开机，也不依赖本地 Axhub 服务。

## 日常使用

- 查看或演示：直接打开 GitHub Pages 地址，电脑和手机均可访问。
- 修改原型：打开 Axhub Make 和 Codex，在 Codex 中描述需求。
- 修改完成：等待约 5 分钟自动推送，再等待 GitHub 发布约 1 至 3 分钟。
- 同一时间只在一台电脑上修改，避免公司电脑和家里电脑产生冲突。

## 新电脑首次接入

1. 安装 Git、Node.js、Codex 和 Axhub Make。
2. 登录有该仓库访问权限的 GitHub 账号。
3. 将仓库下载到本机固定目录。
4. 在项目目录执行一次 `npm install`。
5. 在 Axhub Make 中使用“添加本地已有项目”选择该目录。
6. 执行一次 `npm run git:autosync:install` 安装自动同步。

不熟悉命令行时，把当前项目目录和本文件发给 Codex，让 Codex完成第 3 至 6 步。

## 故障定位

- 自动同步日志：`logs/git-auto-sync.log`
- 在线发布记录：GitHub 仓库的 `Actions` 页面
- Pages 地址：GitHub 仓库的 `Settings -> Pages` 页面
- 自动同步遇到冲突时会停止，不会强制覆盖另一台电脑的文件。

## 仓库可见性

公司原型建议使用私有仓库。GitHub 私有仓库的 Pages 权限取决于账号套餐；若当前套餐不支持，可继续保留私有 GitHub 仓库，并将发布步骤切换到 Cloudflare Pages 或 Vercel。
