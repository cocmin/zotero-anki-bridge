# 第三方代码与许可范围

核对日期：2026-10-05。下面分别说明实际随仓库分发的片段和独立安装的外部组件。自有代码的 MIT 许可不会替换第三方的许可。

## 仓库内引用的安装器测试片段

- 文件：`tests/fixtures/zotero10-required-manifest.js`。
- 来源：Zotero 10.0.5 随附的 `modules/Extension.sys.mjs`，`ExtensionData.parseManifest()` 中的 Zotero 必填字段检查；原始平台模块来自 Mozilla，并包含 Zotero 的适配修改。
- 参考源：[Mozilla Extension.sys.mjs](https://github.com/mozilla/gecko-dev/blob/master/toolkit/components/extensions/Extension.sys.mjs)、[Zotero 客户端源码](https://github.com/zotero/zotero)。Zotero 特有必填字段的版本依据是上述已发布安装包，并非声称 Mozilla 当前主分支含有同样的检查。
- 作者与权利归属：原始 Mozilla/Zotero 代码贡献者，保留原许可通知。
- 处理方式：截取指定检查块，增加来源、SPDX 和测试用途说明；检查语句保持提取时的内容。
- 许可：Mozilla Public License 2.0，全文见 [LICENSES/MPL-2.0.txt](LICENSES/MPL-2.0.txt)；[官方原文](https://www.mozilla.org/media/MPL/2.0/index.txt)。
- 使用位置：仅用于测试；不装入发布 XPI。源码 ZIP 会同时携带片段、来源说明和许可证。

## 用户独立安装的组件

| 项目 | 上游许可或通知 | 接入方式 |
| --- | --- | --- |
| Translate for Zotero | [GNU AGPL v3](https://github.com/windingwind/zotero-pdf-translate/blob/main/LICENSE) | 调用公开 API，仓库不包含其源码或安装包 |
| Zotero ODH | [GNU AGPL v3](https://github.com/1ywan/zotero-odh/blob/main/LICENSE) | 工作流参考和旧配置名称兼容，仓库不包含其源码或安装包 |
| AnkiConnect | [GNU GPL v3 或更新版本](https://github.com/FooSoft/anki-connect/blob/master/LICENSE) | 本机 HTTP API，仓库不包含其源码或安装包 |

这些链接记录上游发布的许可证，不能据此将其代码改标为 MIT。未来若复制、修改或捆绑上游代码，应逐文件保留来源并重新核对相应许可要求。

## 自有文件

`addon/`、测试执行器、构建与验证脚本以及项目文档的自有内容采用根目录 [MIT 许可证](LICENSE)。上述 fixture 为明确例外；包元数据用 `MIT AND MPL-2.0` 表示源码分发中两种许可均存在。

本项目未使用原教程图片、上游 Logo 或第三方账号身份作为项目标识。
