# 上传 GitHub 与发布

## 上传仓库

建议仓库名：`zotero-anki-bridge`。简介可填写：`Zotero PDF selection to Anki using Translate for Zotero.`

在 GitHub 创建空仓库。已有项目包含 README、LICENSE 和 .gitignore，因此创建时不再让 GitHub生成这些文件。解压项目包，将 `zotero-anki-bridge/` **里面的文件与目录**放到仓库根目录；不要多套一层目录。务必上传 .github、.gitignore、.gitattributes 和 LICENSES。

如使用 Git，在项目根目录执行 `git init`、`git add .`、`git commit -m "Prepare Zotero Anki Bridge project"`，然后使用新仓库页面提供的远程地址完成绑定与推送。不要把个人访问令牌写在远程 URL 或脚本中。

如果使用网页上传，选择仓库中的 Add file → Upload files，上传上述内容并提交。[GitHub 官方上传说明](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)提供了网页和命令行操作方法。

## 首次验证与发布

1. 上传后查看 Actions 的 Test and build，确认实际测试结果。此项目准备时未执行远程 CI。
2. 完成 docs/USAGE.md 中的实际 Zotero/Anki 验收，将结果和版本记入 docs/VERIFICATION.md。
3. 若仍未完成真实验收，首个版本标记为 Pre-release，并保留发布说明中的实验性状态。
4. 创建 Release，标签使用 `v0.1.1`，正文参考 docs/RELEASE_NOTES.md。
5. 上传当前仓库构建的 XPI、源码 ZIP 和 SHA256SUMS.txt。不要混用本地项目整理前的旧校验和。
6. 源码及许可证文件与 XPI 一同保持可获取。不要把依赖插件的安装包重命名成自己的作品。

CI 只上传构建产物，不会自动创建 Release、推送标签或修改仓库。当前 XPI 中新增了 NOTICE，功能代码不变，归档校验和会相应改变。

## 在线更新源

当前 manifest 使用 HTTPS 保留域名 `zotero-anki-bridge.invalid`，仅满足 Zotero 必填项和更新安全检查，不能下载更新。README 已公开说明后续手动安装新版。

当决定提供自动更新时，先在你控制的仓库部署真实的 Zotero JSON 更新清单，再把 `applications.zotero.update_url` 改为该清单的 HTTPS 地址。清单中插件 ID 必须保持 `zotero-anki-bridge@local`，发布版本及下载链接必须与 Release 对应，附正确 SHA-256。不要指向其他作者的更新清单。

这会改变插件 manifest，应同时更新 addon/manifest.json 和 package.json 的版本，重新测试、构建和发布，并完成真实更新检查。格式参考 [Zotero 官方开发说明](https://www.zotero.org/support/dev/zotero_7_for_developers#updaterdf_updatesjson)。

## 来源与署名

保留 ACKNOWLEDGEMENTS.md、THIRD_PARTY_NOTICES.md、NOTICE、LICENSE、LICENSES 和 fixture 中的原许可通知。原教程作者尚未查到，不应猜测；可根据原页面的准确署名补充。后续引入任何第三方代码时继续记录来源、修改和许可证。
