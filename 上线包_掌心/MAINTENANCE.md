# Community presentation rules — 2026-09-02

- The Palm is an open, volunteer-supported community maintained by its participants. Do not rank members by popularity.
- Society above Academy; sort each group independently by actual `updated_at` descending. Use a stable tie-break only for equal timestamps.
- Both text and profile-photo saves update the timestamp. Do not claim a save succeeded if no row was affected.
- Member/work view counters are retired. Do not read, show or increment `view_counts` / `bump_view`. Historical records are not deleted.
- Latest superseding instruction, 2026-09-02: the official English name is `The Palm Poetry Society`, including the leading `The`. This overrides the earlier same-day instruction to omit it. Use it in site branding, page metadata and institutional references; preserve members' names, poems and works. Do not duplicate `The` or rename The Palm Academy.
- Group headings are deliberately quiet and equal in style. Do not add a sentence explaining status or rank. Preserve Society above Academy and each group's independent latest-update order; do not merge, relabel members or change their groups.
- Activity means a real update within the last 24 hours. Expire cached events too. When none remains, show short, warm introductions to members, works, forum, community values and joining, labelled `掌心相伴`, not as news. This supersedes the earlier rule to hide the entire empty segment. Real updates have priority and are never mixed with evergreen introductions while any recent event remains. Do not present old member updates as current news.
- Welcome messages are fixed local copy, rotated every 12 seconds without model calls, new database writes or periodic background requests. Pause rotation on hover, keyboard focus, hidden tabs and reduced-motion preference; still expire old events. Respect the site's Simplified/Traditional Chinese preference. Welcome copy never enters the real-activity cache.
- Empty member work spaces remain reserved. Existing works, files, covers and links must not disappear or move to “pending” because of redesigns or sorting changes.
- A document URL used as a cover gets a readable text fallback. Preserve its original work link and ownership.
- Keep profile and work sign-in destinations intact; the Discourse forum has its own login. Do not promise cross-browser or permanent sign-in.
- Submission for review is not blanket publication permission. Preserve attribution and confirm new uses separately.
- Daily poems, featured forum posts and activity use ordinary code and existing data, never model calls.
- Subsequent instruction, 2026-09-02: automatic readings stay within the existing layout. Both the anthology's daily poem and forum reading rotate by author and then by work, using the local calendar date; no popularity score or model-based judging. The poem stays still while being read. Forum candidates come only from available public regular topics, excluding pinned guidance and obvious administrative/test notices; this is a reading rotation, not a quality award. Do not add another selection panel or daily editorial workload.

- Place the existing Chinese and English welcome paragraph directly below `面向世界 / To the World`, once only. The four language cards are removed; the Chinese/English welcome itself remains intact.
- Show works maintenance by member 晓鸣, forum administrators 飞鸿、陶然, and in-person discussions/talks administrators 黄忠、文刃. These are visible maintenance credits, not authorization to change backend roles.
- Keep all 2023–2026 lecture titles, dates and speakers in a single default-closed archive under `线下讨论和讲座`. Show each year as a heading within it, avoiding nested disclosure controls. Founding history and travel-gallery notes are folded, not deleted. Main member/work lists, sign-in and forum links remain immediately accessible.

The deterministic ordering/expiry helpers are in `community-policy.js`. Verify changes against the local regression tests before publication.
