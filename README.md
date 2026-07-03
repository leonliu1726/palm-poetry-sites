# 掌心 · 千山独行 网站仓库

这个仓库只收录两个上线包，用于 Netlify 自动部署。私人手稿、源图等不在其中（见 .gitignore）。

## 内容
- `上线包_掌心/` → 部署到 Netlify 站点 **thepalmpoetrysociety**（掌心 + 萤火）
- `上线包_千山独行/` → 部署到 Netlify 站点 **beyondathousandmountains**（千山独行）
- `发布前自检.py` → 每次改动后、推送前的自动检查（截断 / 草稿标记 / 空图 / 缺失资源）

## 发布流程（Git 自动部署）
1. Claude 修改上线包里的文件
2. 运行 `python 发布前自检.py`，确认全绿
3. 在 GitHub Desktop 里 Commit + Push
4. Netlify 收到推送后自动部署上线

再也不用手动拖文件夹。
