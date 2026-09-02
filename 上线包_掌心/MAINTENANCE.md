# Community presentation rules — 2026-09-02

- The Palm is an open, volunteer-supported community maintained by its participants. Do not rank members by popularity.
- Society above Academy; sort each group independently by actual `updated_at` descending. Use a stable tie-break only for equal timestamps.
- Both text and profile-photo saves update the timestamp. Do not claim a save succeeded if no row was affected.
- Member/work view counters are retired. Do not read, show or increment `view_counts` / `bump_view`. Historical records are not deleted.
- Activity means a real update within the last 24 hours. Expire cached events too. If there is none, hide the activity segment; do not rotate old biographies or filler tips as news.
- Empty member work spaces remain reserved. Existing works, files, covers and links must not disappear or move to “pending” because of redesigns or sorting changes.
- A document URL used as a cover gets a readable text fallback. Preserve its original work link and ownership.
- Keep profile and work sign-in destinations intact; the Discourse forum has its own login. Do not promise cross-browser or permanent sign-in.
- Submission for review is not blanket publication permission. Preserve attribution and confirm new uses separately.
- Daily poems, featured forum posts and activity use ordinary code and existing data, never model calls.

The deterministic ordering/expiry helpers are in `community-policy.js`. Verify changes against the local regression tests before publication.
