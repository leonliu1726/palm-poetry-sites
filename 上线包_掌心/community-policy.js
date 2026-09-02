/* Shared, deterministic presentation rules. No AI calls or view tracking. */
(function (root) {
  'use strict';
  var DAY = 24 * 60 * 60 * 1000;
  function timestamp(value) {
    var n = typeof value === 'number' ? value : Date.parse(value || '');
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  function recent(value, now) {
    var t = timestamp(value), age = (now == null ? Date.now() : now) - t;
    return t > 0 && age >= 0 && age < DAY;
  }
  function newestFirst(a, b) {
    var delta = timestamp(b.updated_at) - timestamp(a.updated_at);
    if (delta) return delta;
    // Stable tie-break only: no popularity score or view counts.
    var order = (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0);
    return order || String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hans');
  }
  function freshActivities(items, now) {
    return (Array.isArray(items) ? items : []).filter(function (x) {
      return x && recent(x.t, now) && typeof x.text === 'string' && typeof x.href === 'string';
    }).sort(function (a, b) { return timestamp(b.t) - timestamp(a.t); });
  }
  var policy = { timestamp: timestamp, recent: recent, newestFirst: newestFirst, freshActivities: freshActivities };
  root.PalmCommunityPolicy = policy;
  if (typeof module === 'object' && module.exports) module.exports = policy;
})(typeof window !== 'undefined' ? window : globalThis);
