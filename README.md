# Zotero Anki Bridge · 划词加入 Anki

在 Zotero PDF 阅读器中选择单词或短语，点击 **＋ 加入 Anki**，将所选文本和 **Translate for Zotero 当前翻译服务的结果**保存为 Anki 笔记。最初使用场景是 DeepSeek 翻译。

这是独立桥接插件。翻译功能由 [Translate for Zotero](https://github.com/windingwind/zotero-pdf-translate) 提供，Anki 写入由 [AnkiConnect](https://github.com/FooSoft/anki-connect) 提供。项目思路来自 [原掘金教程](https://juejin.cn/post/7592497088790315035) 和 [Zotero ODH](https://github.com/1ywan/zotero-odh) 的划词学习流程。感谢这些项目的作者和贡献者；本仓库不是它们的官方版本或 fork。完整来源与许可见 [致谢](ACKNOWLEDGEMENTS.md) 和 [第三方说明](THIRD_PARTY_NOTICES.md)。

**当前版本：0.1.1，已由维护者确认实际可用。目标版本为 Zotero 10.0.x。** GitHub 测试、构建和归档检查已通过，见 [验证记录](docs/VERIFICATION.md)。

## 功能

- 点击按钮后才添加笔记，单纯划词不会提交。
- 复用匹配当前选词、文献和翻译服务的成功译文。
- 正在翻译时最多等待 90 秒；没有匹配结果时调用翻译 API，可能产生正常的服务用量。
- 检查牌组与字段，阻止空译文和错误结果写入。
- 检查重复词，显示添加成功、已存在或可重试的错误。
- 翻译作为普通文本保存，保留换行并转义 HTML。

## 安装与使用

1. 安装并启用 [Translate for Zotero](https://github.com/windingwind/zotero-pdf-translate)，配置所需服务。
2. 在 Anki 中安装并启用 [AnkiConnect](https://ankiweb.net/shared/info/2055492159)，保持 Anki 打开。
3. 从本仓库 [Releases](https://github.com/cocmin/zotero-anki-bridge/releases/latest) 下载 `zotero-anki-bridge-v0.1.1.xpi`；也可以按下面的步骤自行构建。
4. Zotero 中打开 **工具 → 插件 → 齿轮 → 从文件安装插件**，选择 XPI；安装后重新划词，必要时重启 Zotero。
5. 在 PDF 中选择文本并点击 **＋ 加入 Anki**。第一次添加后，在 Anki“浏览”中核对正反面内容。

默认配置如下。名称必须与 Anki 中的实际名称一致；插件不会自动创建牌组或笔记类型。

| 设置 | 默认值 |
| --- | --- |
| 牌组 | 文献单词 |
| 笔记类型 | 问答题 |
| 单词字段 | 正面 |
| 翻译字段 | 背面 |
| 标签 | Zotero |
| AnkiConnect 地址 | http://127.0.0.1:8765 |

保存单词的字段必须是该笔记类型的第一个字段，以便检测重复。可修改的设置、常见错误与卸载方法见 [使用指南](docs/USAGE.md)。

当前版本不包含音频、上下文句子或文献链接。翻译服务密钥继续由 Translate for Zotero 管理；桥接插件只向本机 AnkiConnect 提交笔记。不要在仓库或 Issue 中上传任何 API Key。

## 开发与构建

需要 Node.js 22 或更高版本及 Python 3.10 或更高版本。无需安装 npm 或 pip 第三方依赖。

```sh
node --test
python build.py
python verify_package.py --dist dist
```

生成的 XPI、源码 ZIP 与 SHA256SUMS.txt 位于 `dist/`。验证可重复构建：

```sh
python build.py --output dist-check
python verify_package.py --dist dist --compare dist-check
```

[GitHub Actions](.github/workflows/ci.yml) 运行测试、打包和归档检查。[已有运行已成功](https://github.com/cocmin/zotero-anki-bridge/actions/runs/37322558946)。在 `main` 上提交带 `[release]` 标记的提交时，检查通过后会发布包含 XPI、完整源码 ZIP 和校验和的 Release，详见 [发布指南](docs/PUBLISHING.md)。普通提交仅执行验证，不发布版本。

```text
addon/                 插件入口、配置与运行代码
tests/                 行为测试与安装器回归测试
LICENSES/              被引用代码的许可证全文
docs/                  使用、发布和验证说明
.github/               CI 与 Issue 模板
build.py               可重复构建
verify_package.py      归档与源码检查
```

## 更新与贡献

当前没有在线更新服务器，采用手动安装新版。为满足 Zotero 安装器必填项和 HTTPS 检查，manifest 中使用保留的 `.invalid` 更新地址；主动检查更新可能显示地址不可访问。配置真实更新源的方法见 [发布指南](docs/PUBLISHING.md)。

提交问题前请阅读 [贡献指南](CONTRIBUTING.md)。修改自己的代码时仍需保留第三方片段的来源和许可证。

## 许可证

自有桥接代码与文档采用 [MIT](LICENSE)。`tests/fixtures/zotero10-required-manifest.js` 引用 Zotero/Mozilla 安装器片段，单独采用 [MPL-2.0](LICENSES/MPL-2.0.txt)，不包含在 XPI 中。外部插件由用户独立安装，保留各自许可证。许可适用范围见 [第三方说明](THIRD_PARTY_NOTICES.md)。
