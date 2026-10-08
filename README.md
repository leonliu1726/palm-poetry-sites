# 掌心诗社官网 · palmpoetry.org

本仓库只管**一个网站：掌心诗社 The Palm Poetry Society**（掌心 + 萤火 + 诗海流风）。

| | |
|---|---|
| 正式网址 | **https://palmpoetry.org/** |
| 网站文件 | `上线包_掌心/`（改网站就是改这里） |
| 托管 | Cloudflare Pages：推送到 `main` 后自动部署，只发布 `上线包_掌心/` |
| 数据 | Supabase（成员、作品、诗帖、雅集），由页面脚本运行时读取 |
| 接手必读 | `掌心网站交接说明.md` |

> 仓库名里的 `sites` 是历史遗留：2026-10-08 以前这里还放着一份《千山獨行》网站的副本（`上线包_千山独行/`）。那份副本已过时，现已撤除，**《千山獨行》只在 `leonliu1726.github.io` 仓库维护**。旧副本可在 Git 历史中找回（撤除前最后一个提交：`a16c5b5`）。

## 目录

- `上线包_掌心/`：网站本体（`index.html` 单文件 + 公约、萤火全本、隐私、致谢、404）
- `发布前自检.py`：推送前必跑，检查截断、草稿标记、空图、缺失资源
- `scripts/`：掌心健康检查与读者端测试脚本（`*.cjs`）
- `掌心网站交接说明.md`：架构、数据库、权限、已知问题
- `掌心征稿体例.md`、`掌心官网改版-基线快照-20260922.md`、`掌心修复验收_2026-09-29.md`：规范与核对记录
- `论坛存档_20260922/`：已停用的 Discourse 论坛存档（只读）
- `index.html`（根目录）：只在 GitHub Pages 备用地址出现的入口页，指向两个正式网站，不参与 palmpoetry.org

## 发布流程

1. 改 `上线包_掌心/` 里的文件
2. `python 发布前自检.py`，必须全绿
3. 改过 JS 的话，再跑交接说明第二节里的脚本块语法检查
4. GitHub Desktop → Commit → Push
5. Cloudflare 自动部署；有缓存，推完等半分钟，或在网址后加 `?v=2`

## 备用地址

GitHub Pages 仍开着：`https://leonliu1726.github.io/palm-poetry-sites/上线包_掌心/` 与正式站内容相同，只给每月备份脚本读取用，不对外宣传、不进 sitemap。

## 历史

- Netlify 是旧方案，已弃用（两个 Netlify 站点均 404）。
- Discourse 论坛 2026-09-22 停用，内容迁入「诗海流风」；不得再出现 discourse 链接。
- 2026-10-08：撤除《千山獨行》旧副本、撤除对其空转的 YouTube 同步工作流、撤除列有副本网址的根目录 sitemap。

---

## Leon 的五个仓库

| 仓库 | 可见性 | 管什么 | 发布到 |
|---|---|---|---|
| `leonliu1726.github.io` | 公开 | 《千山獨行》诗集网站（唯一一份）+ 根目录入口页 + 掌心旧网址跳转 | GitHub Pages：https://leonliu1726.github.io/beyondathousandmountains/ |
| `palm-poetry-sites` | 公开 | 掌心诗社官网 | Cloudflare Pages：https://palmpoetry.org/ |
| `vtrust-website` | 私有 | V-Trust Corporation 官网 | Cloudflare Pages：https://vtrustcorporation.com/ |
| `poem-tools` | 私有 | 千山独行配画、翻译、发布脚本 | 不发布（本地工具） |
| `homer` | 私有 | 荷马 Homer 文刃风格写作助手 | Google Cloud Run |
