# 贡献指南

先查看 README 的实验性状态与已知限制。问题报告请包含 Zotero、Translate for Zotero、Anki 和 AnkiConnect 版本、笔记类型与字段顺序、复现步骤及经过脱敏的错误信息。

不要提交 API Key、个人文献、Zotero 配置目录、Anki 数据库或带身份信息的日志。公开 Issue 不适合发送未脱敏信息。

开发前运行 `node --test`，改动后再执行测试和归档验证。行为变更应覆盖相应失败场景；文档或署名修正不要求额外行为测试。

保持 `addon/manifest.json` 和 `package.json` 的版本一致。修改引用的测试片段时保留 MPL 通知、来源及修改记录。引入新的外部代码应同时增加许可证和 THIRD_PARTY_NOTICES 记录，不能只写一句“感谢原作者”。

真实界面验收与模拟测试结果应分开报告。没有运行的检查不应标成通过。
