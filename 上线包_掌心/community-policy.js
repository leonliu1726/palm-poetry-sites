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
  // Evergreen invitations, not news. They are never stored in the activity cache.
  var welcomeMessages = [
    { text: '初次来到掌心？先读一首诗，慢慢认识这里的朋友。', href: '#fireflies' },
    { text: '每个人都有自己的故事，点开名片，认识一位新朋友。', href: '#members' },
    { text: '一本书、一组诗、一幅画，都可以成为相识的开始。', href: '#works' },
    { text: '喜欢一首作品，不妨到论坛留下你的感受。', href: '#forum' },
    { text: '不同的语言与经历，让这里的谈话更丰厚。', href: '#origin' },
    { text: '带来一首诗，也带来你的不同看法；一起读，一起学。', href: '#origin' },
    { text: '欢迎天南地北的诗文艺术好友，在掌心留下一声问候。', href: '#join' },
    { text: '名片与作品由成员自己整理，按自己的节奏慢慢充实。', href: '#members' },
    { text: '不必急着写出答案，带着一个问题来，也很好。', href: '#forum' },
    { text: '掌上有温，心中有诚；愿每位新朋友在这里自在相逢。', href: '#join' }
  ];
  function activityFrame(items, index, now) {
    var fresh = freshActivities(items, now);
    var list = fresh.length ? fresh : welcomeMessages;
    var position = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0;
    var item = list[position % list.length];
    return {
      mode: fresh.length ? 'update' : 'welcome',
      label: fresh.length ? '掌心动态' : '掌心相伴',
      text: item.text, href: item.href,
      t: fresh.length ? timestamp(item.t) : null
    };
  }
  function readingDay(now) {
    var d = new Date(now == null ? Date.now() : now);
    return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
  }
  // One stable choice per local calendar day; rotate authors before their works.
  function dailyReading(items, now) {
    var groups = Object.create(null);
    (Array.isArray(items) ? items : []).forEach(function(item) {
      if (!item || !item.t) return;
      var author = String(item.a || '未署名');
      (groups[author] || (groups[author] = [])).push(item);
    });
    var authors = Object.keys(groups).sort();
    if (!authors.length) return null;
    var day = readingDay(now);
    var list = groups[authors[((day % authors.length) + authors.length) % authors.length]];
    list.sort(function(a,b) {
      var left=String(a.id == null ? a.t : a.id), right=String(b.id == null ? b.t : b.id);
      return left < right ? -1 : left > right ? 1 : 0;
    });
    var turn = Math.floor(day / authors.length);
    return list[((turn % list.length) + list.length) % list.length];
  }
  function dailyForumTopic(topics, now) {
    var candidates = (Array.isArray(topics) ? topics : []).filter(function(topic) {
      return topic && Number.isInteger(topic.id) && topic.id>0 && topic.visible!==false &&
        !topic.pinned && !topic.pinned_globally && topic.archetype!=='private_message' &&
        !/(管理员|指南|准则|注册|发不出|使用入门|hello\s*world|贴诗读诗的地方|^宣传$|^测试$)/i.test(topic.title || '');
    }).map(function(topic) {
      var posters=Array.isArray(topic.posters)?topic.posters:[];
      var author=posters.find(function(p){return /原始|original poster/i.test(p.description || '');}) || posters[0];
      return {id:topic.id,t:topic.title,a:author&&author.user_id!=null?String(author.user_id):'topic-'+topic.id};
    });
    return dailyReading(candidates, now);
  }
  var policy = { timestamp: timestamp, recent: recent, newestFirst: newestFirst, freshActivities: freshActivities,
    activityFrame: activityFrame, welcomeMessages: welcomeMessages, readingDay: readingDay,
    dailyReading: dailyReading, dailyForumTopic: dailyForumTopic };
  root.PalmCommunityPolicy = policy;
  if (typeof module === 'object' && module.exports) module.exports = policy;
})(typeof window !== 'undefined' ? window : globalThis);
