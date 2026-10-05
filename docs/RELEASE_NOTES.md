# v0.1.1 · Zotero 划词加入 Anki

已由维护者确认实际可用，GitHub 测试、构建及归档检查通过。

## 功能

- 在 Zotero PDF 阅读器中划词，点击“＋ 加入 Anki”保存笔记。
- 正面保存所选单词或短语，背面保存 Translate for Zotero 当前服务的译文，包括 DeepSeek。
- 支持匹配译文复用、重复检查、错误提示和重试。
- 默认牌组为“文献单词”，笔记类型为“问答题”，字段为“正面”和“背面”，可在设置中修改。

## 安装

先安装并启用 Translate for Zotero 和 AnkiConnect，保持 Anki 打开。下载附件中的 `zotero-anki-bridge-v0.1.1.xpi`，在 Zotero“工具 → 插件 → 齿轮 → 从文件安装插件”中安装。

0.1.1 修正了缺少 update_url 导致的安装拒绝。后续通过手动安装新版更新；当前未提供在线更新服务器。

## 附件

- `zotero-anki-bridge-v0.1.1.xpi`：插件安装包。
- `zotero-anki-bridge-source-v0.1.1.zip`：完整源码、文档、构建脚本和许可证。
- `SHA256SUMS.txt`：上述两个归档的校验和。

## 致谢与许可

感谢 windingwind 与 Translate for Zotero 贡献者、1ywan 与 ODH 贡献者、Alex Yatskov（FooSoft）与 AnkiConnect 贡献者、Zotero/Mozilla 贡献者及 [原教程作者](https://juejin.cn/post/7592497088790315035)。这是独立桥接项目。

自有代码采用 MIT，测试中的安装器片段保留 MPL-2.0 及原始来源。源码包保留完整致谢与第三方说明。
