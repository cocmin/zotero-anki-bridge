# 完整构建与发布

当前版本 0.1.1 已由维护者确认实际可用，GitHub 测试与构建通过，结果见 [验证记录](VERIFICATION.md)。

## 一次提交发布完整版本

将源码、文档、版本信息与许可证作为一个完整提交推送到 `main`。准备发布时在提交消息中加入 `[release]` 标记，工作流会先运行测试、两次构建和归档检查，全部通过后创建对应版本的 GitHub Release，并上传 XPI、完整源码 ZIP 和 SHA256SUMS.txt。

普通提交不带此标记，仅执行验证。已经存在的同名 Release 不会被自动覆盖；请更新版本号发布新版本。

版本号同时维护在 `addon/manifest.json` 和 `package.json`，发布说明写在 `docs/RELEASE_NOTES.md`。将这些文件与相关功能、使用说明和贡献指南一起更新，无需将同一版本拆成多次上传。

CI 只在发布 job 中获得仓库内容写权限。发布使用 GitHub 自带的 GITHUB_TOKEN，不需要提交个人访问令牌。

## 本地构建

```sh
node --test
python build.py
python build.py --output dist-check
python verify_package.py --dist dist --compare dist-check
```

输出位于 `dist/`。如果手动发布，也应上传同一次构建的三个文件，并使用对应版本的发布说明。不要混用旧源码包与新校验和。

## 在线更新源

本版本通过手动安装新版更新。manifest 使用 HTTPS 保留域名 `zotero-anki-bridge.invalid`，用于满足 Zotero 的必填项和更新安全检查，不提供在线更新。

如要启用插件自动更新，应先部署仓库维护者控制的真实 Zotero JSON 更新清单，再修改 update_url。清单中的插件 ID 保持 `zotero-anki-bridge@local`，下载链接指向对应 Release，附正确的 SHA-256；此变更与版本更新一起完整提交。

格式参考 [Zotero 官方开发说明](https://www.zotero.org/support/dev/zotero_7_for_developers#updaterdf_updatesjson)。

## 来源与署名

保留 ACKNOWLEDGEMENTS.md、THIRD_PARTY_NOTICES.md、NOTICE、LICENSE、LICENSES 和 fixture 中的原许可通知。原教程作者尚未核实昵称，保留原文链接，不猜测署名。后续引用任何第三方代码时继续记录来源、修改和许可证。
