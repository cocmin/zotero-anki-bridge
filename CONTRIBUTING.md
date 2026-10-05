# 贡献指南

当前版本 0.1.1 已由维护者确认实际可用，GitHub 测试与构建已通过，结果记录在 [验证记录](docs/VERIFICATION.md)。贡献前请阅读 README 的功能范围和配置方法。

问题报告请包含 Zotero、Translate for Zotero、Anki 和 AnkiConnect 版本、笔记类型与字段顺序、复现步骤及经过脱敏的错误信息。

不要提交 API Key、个人文献、Zotero 配置目录、Anki 数据库或带身份信息的日志。公开 Issue 不适合发送未脱敏信息。

开发前运行 `node --test`，改动后再执行测试和归档验证。行为变更应覆盖相应失败场景；文档或署名修正不要求额外行为测试。

保持 `addon/manifest.json` 和 `package.json` 的版本一致。修改引用的测试片段时保留 MPL 通知、来源及修改记录。引入新的外部代码应同时增加许可证和 THIRD_PARTY_NOTICES 记录，不能只写一句“感谢原作者”。

提交修复时说明改动、测试结果和实际使用结果。当前版本的实际可用性已经确认；新增功能或修复仍需验证对应场景。
