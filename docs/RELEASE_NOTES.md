# v0.1.1 发布说明

实验版本：Zotero PDF 阅读器划词加入 Anki，背面使用 Translate for Zotero 当前服务的结果。

包含插件入口与代码、MIT 许可证和来源 NOTICE。依赖 Translate for Zotero 与 AnkiConnect，需分别安装。

本版修正 manifest 中缺少 update_url 导致的安装拒绝，增加安装器字段检查回归测试。[首轮 GitHub 测试与构建已成功](https://github.com/cocmin/zotero-anki-bridge/actions/runs/37321673650)，维护者已确认插件在自己的使用环境中可用。其他环境以及重复检测、断线重试等专项场景尚未逐项确认。首次发布建议标记为 Pre-release。

致谢 windingwind 与 Translate for Zotero 贡献者、1ywan 与 ODH 贡献者、Alex Yatskov（FooSoft）与 AnkiConnect 贡献者、Zotero/Mozilla 贡献者以及 [原教程作者](https://juejin.cn/post/7592497088790315035)。这是独立桥接插件，不是上述项目的官方版本。

后续通过手动安装新版更新。当前 .invalid 更新地址是必填占位，不提供在线更新。

发布附件应由当前仓库构建生成：XPI、源码 ZIP、SHA256SUMS.txt。
