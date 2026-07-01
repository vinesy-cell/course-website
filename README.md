# 课程网站与网站机器人

这个仓库将 Obsidian 内容源转换为可发布的静态课程网站，并提供一个本地“网站机器人后台”完成同步、构建、预览和发布。

## 系统结构

```text
Obsidian 内容源
  -> scripts/sync-content.mjs
  -> content/site-data.json
  -> scripts/build.mjs
  -> dist 静态网站
  -> Git 推送
  -> GitHub Pages 自动部署
```

## 常用入口

- 网站机器人后台：`http://localhost:4174`
- 本地网站预览：`http://localhost:4174/preview/`
- 内容源：`/Users/maxlee/Documents/LK ThinkNote/08_课程网站`
- 网站工程：`/Users/maxlee/Documents/LK ThinkNote/08_课程网站/06_网站工程`

> 2026-07-01，网站工程已从独立目录迁入 Obsidian。原仓库完整 `main` 分支历史保存在 `00_历史与备份/course-website-main-2026-07-01.bundle`。

## 常用命令

```bash
npm run robot          # 启动后台并实时监听内容变化
npm run content:sync   # 只同步内容
npm run build          # 构建网站
npm run check          # 检查关键内容和禁用口径
npm run publish        # 同步、构建、提交并推送发布
npm run robot:install  # 安装 macOS 常驻后台服务
npm run robot:uninstall
```

## 内容怎么更新

优先编辑：

- `00_项目管理/01_当前状态与决策清单.md`
- `02_网站结构与文案/02_首页内容骨架.md`
- `01_网站资料清单/02_公开联系方式与二维码.md`

机器人运行时，文件变化会自动触发内容同步、网站构建和检查。

## 公网发布

仓库内已经配置 GitHub Pages workflow。首次发布前：

1. 在 GitHub 创建远程仓库。
2. 在本地执行 `git remote add origin <远程仓库地址>`。
3. 在 GitHub 仓库设置中将 Pages 的 Source 设为 `GitHub Actions`。
4. 运行 `npm run publish` 或在后台点击“发布上线”。

配置远程仓库后，如需每次内容变化自动推送上线，将 `site.config.json` 中的 `autoPublish` 改为 `true`。

## 默认公开边界

- 不公开数字价格。
- 不公开未授权客户案例。
- 不使用“在读”“AI企业培训师”等禁用口径。
- 未核实数字背书不上网站。
