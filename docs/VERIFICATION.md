# 验证记录

日期：2026-10-05。核对环境：Zotero 10.0.5 安装器，阅读器接口此前核对自 10.0.3，Translate for Zotero 2.4.8，AnkiConnect API v6。

## 已执行

- 38 项 JavaScript 测试通过：核心 18、界面与请求适配 12、启动与卸载 4、manifest 必填字段 4。
- 实际执行环境为 V8，Zotero、DOM、翻译与 AnkiConnect 边界采用模拟对象。
- 使用 Zotero 10.0.5 中实际必填字段检查片段，旧 manifest 返回缺少 update_url，新 manifest 通过此片段检查。
- XPI 与源码 ZIP 的完整性、UTF-8、源码一致性和可重复构建已检查。
- 项目整理过程中没有向真实 Anki 牌组添加笔记。

本机标准 Node 入口在初始化时出现 `ncrypto::CSPRNG(nullptr, 0)` 断言失败，即使沙箱外运行也未成功；因此不将 `node --test` 或 GitHub Actions 标成已通过。仓库保留标准入口，首次上传后需要查看 CI 的实际结果。

## 尚待执行

- 新版 XPI 在真实 Zotero 中安装与启用。
- PDF 阅读器及独立阅读窗口中的按钮显示。
- 通过真实 AnkiConnect 保存新笔记并核对正反面。
- 实际重复检测、连接中断后的重试。
- 上传 GitHub 后的 Actions 运行。

安装器片段测试不能替代完整安装器和真实界面。请将实际验收结果、版本和日期记录下来再调整发布状态。
