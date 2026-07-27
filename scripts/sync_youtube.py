#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自动把 YouTube 频道「Beyond a Thousand Mountains-千山独行」的新视频
同步为千山独行网站「音像 / Media」区的 media-card。

行为：
  - 读取频道 RSS，找出最近 WINDOW_DAYS 天内发布、且页面尚未收录的视频；
  - 仿照网站现有 YouTube media-card 结构，插入到 .media-grid 末尾（频道卡片之前）；
  - 幂等：已按 watch?v= 链接收录的视频会被跳过，不会重复添加。

配置（环境变量，均可选）：
  WINDOW_DAYS  只收录最近多少天内发布的视频，默认 8。设为很大的数（如 99999）可一次性导入全部。
"""
import html
import os
import re
import sys
import datetime
import urllib.request
from pathlib import Path

CHANNEL_ID = "UC5AKO3I8_OR0TPMTjNo6iUA"
FEED_URL = f"https://www.youtube.com/feeds/videos.xml?channel_id={CHANNEL_ID}"
INDEX = Path("上线包_千山独行/index.html")
WINDOW_DAYS = int(os.environ.get("WINDOW_DAYS", "8"))

SUFFIX_RE = re.compile(r"\s*/\s*Beyond a Thousand Mountains.*$", re.IGNORECASE | re.DOTALL)
ANCHOR = '<a class="media-card yt-card"'


def fetch_feed(url=FEED_URL):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (site-sync)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8")


def parse_feed(xml):
    out = []
    for entry in re.findall(r"<entry>.*?</entry>", xml, re.S):
        vid = re.search(r"<yt:videoId>(.*?)</yt:videoId>", entry)
        title = re.search(r"<title>(.*?)</title>", entry, re.S)
        pub = re.search(r"<published>(.*?)</published>", entry)
        if not (vid and title and pub):
            continue
        raw = html.unescape(title.group(1)).strip()
        clean = SUFFIX_RE.sub("", raw).strip()
        published = datetime.datetime.fromisoformat(pub.group(1))
        out.append({"id": vid.group(1), "title": clean, "published": published})
    return out


def make_card(vid, title):
    url = f"https://www.youtube.com/watch?v={vid}"
    thumb = f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
    t = html.escape(title, quote=True)
    return (
        '          <figure class="media-card">\n'
        f'            <a class="yt-link" href="{url}" target="_blank" rel="noopener" title="前往 YouTube 观看">'
        f'<img src="{thumb}" alt="{t}" loading="lazy">'
        '<span class="yt-badge"><span class="pl">▶</span>'
        '<span data-zh="YouTube 观看" data-en="Watch on YouTube">YouTube 观看</span></span></a>\n'
        f'            <figcaption><b data-zh="{t}" data-en="{t}">{t}</b>'
        '<span data-zh="诗影 · YouTube" data-en="Poem-film on YouTube">诗影 · YouTube</span></figcaption>\n'
        '          </figure>\n'
    )


def main():
    if not INDEX.exists():
        print(f"ERROR: {INDEX} not found (run from repo root).", file=sys.stderr)
        return 2
    text = INDEX.read_text(encoding="utf-8")
    now = datetime.datetime.now(datetime.timezone.utc)
    videos = parse_feed(fetch_feed())
    existing = set(re.findall(r"youtube\.com/watch\?v=([A-Za-z0-9_-]{11})", text))

    new = [
        v for v in videos
        if v["id"] not in existing
        and (now - v["published"]).total_seconds() <= WINDOW_DAYS * 86400
    ]
    if not new:
        print("No new videos in the last %d days. Nothing to do." % WINDOW_DAYS)
        return 0

    cards = "".join(make_card(v["id"], v["title"]) for v in new)
    idx = text.find(ANCHOR)
    if idx == -1:
        print("ERROR: could not locate media-grid anchor.", file=sys.stderr)
        return 2
    line_start = text.rfind("\n", 0, idx) + 1
    INDEX.write_text(text[:line_start] + cards + text[line_start:], encoding="utf-8")
    print(f"Added {len(new)} new video(s):")
    for v in new:
        print(f"  - {v['title']}  (https://www.youtube.com/watch?v={v['id']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
