# 网站自动更新服务修复进度

- 任务目标：将 macOS 常驻网站机器人从已删除的旧 LK ThinkNote 路径迁移到当前 MAXNOTE 网站工程，并验证内容变化后的自动同步链路。
- 开始时间：2026-08-17
- 处理范围：`scripts/robot.mjs`、`scripts/watch.mjs`、macOS LaunchAgent、当前网站构建产物。
- 当前断点：修复完成，LaunchAgent 已指向当前 MAXNOTE 路径并通过源文件变化实测。
- 已完成批次：故障定位、LaunchAgent 重装、监听器自触发过滤、自动同步链路验证。
- 失败项：旧常驻服务 `last exit code 78: EX_CONFIG`，旧脚本路径不存在。
- 跳过项：未开启 `autoPublish`，不修改公网自动发布策略。
- 验证结果：`launchctl` 显示 `state = running`、`active count = 1`；触碰源 Markdown 后自动完成 `content:sync`、`build`、`check` 各一轮。
- 后续修复：后台读取 515MB 历史日志导致 `/api/status` 崩溃，`scripts/lib/process.mjs` 已改为只读取日志末尾 256KB；后台接口现已返回 `200 OK`。
- 内容链路修复：贴图改读内容运营库 `03_贴图/2026`，仅取不晚于当天的最新 10 张；“思想与洞察”改读已发布归档单篇文章，并允许已发布但尚未补公开链接的文章以非外链卡片展示。
- 自动监听修复：常驻服务同时监听课程网站源、最新贴图目录和已发布文章归档目录；已用 2026-08-17 贴图来源说明文件完成自动触发实测。
- 下一步断点：如需公网自动发布，另行确认并开启 `autoPublish`；当前不自动推送公网。
