# 验证记录

版本：0.1.1。日期：2026-10-05。目标：Zotero 10.0.x、Translate for Zotero 与 AnkiConnect API v6。

## 当前结果

| 检查 | 结果 | 依据 |
| --- | --- | --- |
| 插件实际使用 | 维护者已确认可用 | 维护者完成使用后明确确认 |
| JavaScript 行为测试 | 38 项通过 | 核心 18、界面与请求适配 12、启动与卸载 4、manifest 4 |
| GitHub 测试与构建 | 通过 | [Test and build #2](https://github.com/cocmin/zotero-anki-bridge/actions/runs/37322558946)，提交 `9c124f2` |
| 归档完整性与源码一致性 | 通过 | 构建流程检查 XPI、源码 ZIP 与校验和 |
| 可重复构建 | 通过 | 两次构建的归档逐字节比较 |

GitHub 工作流使用标准 `node --test`，随后两次构建并执行归档比较。首次运行也已[成功](https://github.com/cocmin/zotero-anki-bridge/actions/runs/37321673650)。

## 版本修正与范围

0.1.0 的 manifest 缺少 Zotero 安装器要求的 `update_url`，导致安装被拒绝。0.1.1 已修正，安装器字段回归测试覆盖这一问题。

阅读器接口核对自 Zotero 10.0.3，安装器必填字段核对自 Zotero 10.0.5，翻译接口核对自 Translate for Zotero 2.4.8。实际可用性依据维护者的使用确认；自动测试中的 Zotero、DOM 和 AnkiConnect 边界使用模拟对象。

当前结论适用于维护者已使用的环境和本项目声明的功能。其他系统与版本的兼容性可通过后续 Issue 和测试记录补充。

## 后续记录

发生版本、翻译服务、字段配置或运行逻辑变更时，追加对应版本、场景和结果。当前已确认的结果保持保留，不因未来改动而覆盖历史记录。
