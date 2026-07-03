#!/usr/bin/env python3
# 掌心 / 千山独行 发布前自检脚本
# 用法：python 发布前自检.py
# 检查项：① 文件是否被截断  ② 残留「草稿/DRAFT」水印  ③ 空 img src  ④ 本地图片/链接是否缺失
# 通过 = 可以安全上传 Netlify；有 ✗ = 先修好再传

import re, os, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PACKAGES = ["上线包_掌心", "上线包_千山独行"]

def check_pkg(pkg):
    base = os.path.join(ROOT, pkg)
    if not os.path.isdir(base):
        print(f"  （跳过：找不到 {pkg}）"); return True
    ok = True
    htmls = [f for f in os.listdir(base) if f.lower().endswith(".html")]
    for hf in htmls:
        path = os.path.join(base, hf)
        raw = open(path, "rb").read()
        # 尾部 NUL 空字节 = OneDrive 半同步残留
        if raw.rstrip().endswith(b"\x00") or b"\x00" in raw[-64:]:
            print(f"  ⚠ {hf} 尾部有 NUL 空字节（同步残留），建议清理");
        html = raw.decode("utf-8", "ignore")

        # ① 截断检查：剥掉空字节和空白后应以 </html> 结尾
        if not html.replace("\x00", "").rstrip().endswith("</html>"):
            print(f"  ✗ {hf} 疑似被截断（未以 </html> 结尾）——不要上传！"); ok = False

        # ② 草稿水印（排除诗句内容：只抓 class=\"draft\" 或可见 DRAFT 徽标）
        if re.search(r'class="draft"', html) or re.search(r'>\s*草稿\s*DRAFT', html):
            print(f"  ✗ {hf} 残留「草稿 DRAFT」水印"); ok = False

        # ③ 空 img src
        if re.search(r'<img[^>]*\bsrc=""', html):
            print(f"  ✗ {hf} 含空 img src=\"\""); ok = False

        # ④ 本地资源缺失
        refs = re.findall(r'(?:src|href)="([^"]+)"', html)
        miss = []
        for s in refs:
            if s.startswith(("http", "#", "mailto:", "data:", "javascript:")): continue
            if not s.lower().endswith((".jpg", ".jpeg", ".png", ".gif", ".webp", ".html", ".css", ".js")): continue
            if not os.path.exists(os.path.join(base, s)): miss.append(s)
        if miss:
            ok = False
            print(f"  ✗ {hf} 缺失 {len(miss)} 个本地资源：")
            for m in miss[:20]: print(f"      - {m}")

        if ok:
            print(f"  ✓ {hf} 通过（完整 · 无草稿 · 图片齐全）")
    return ok

def main():
    print("=" * 48)
    print("  掌心 / 千山独行 发布前自检")
    print("=" * 48)
    all_ok = True
    for pkg in PACKAGES:
        print(f"\n【{pkg}】")
        if not check