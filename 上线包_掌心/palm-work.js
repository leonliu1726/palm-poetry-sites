/* Shared work validation. No credentials or member content are logged. */
(function(root){
  'use strict';
  function url(value){
    var s=String(value||'').trim();
    if(!s) return '';
    if(/[\u0000-\u0020\u007f]/.test(s)) throw new Error('链接包含空格或无效字符，请检查网址。');
    if(s.indexOf('//')===0) s='https:'+s;
    else if(!/^[a-z][a-z0-9+.-]*:/i.test(s)) s='https://'+s;
    var u;
    try{u=new URL(s);}catch(e){throw new Error('请输入完整的网站或附件网址。');}
    if(!/^https?:$/.test(u.protocol)||u.username||u.password||u.hostname.indexOf('.')<0)
      throw new Error('链接须为有效的 http 或 https 网址。');
    return u.href;
  }
  function safeUrl(value){try{return url(value);}catch(e){return '';}}
  function meta(note){try{var x=JSON.parse(note||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{d:String(note||'')};}catch(e){return {d:String(note||'')};}}
  function gallery(note){var m=meta(note);return (Array.isArray(m.g)?m.g:Array.isArray(m.gallery)?m.gallery:[]).map(safeUrl).filter(Boolean);}
  function failure(stage,status){
    var hint=status===401?'登录已过期，请重新登录后重试。':status===403?'没有保存权限，请核对本人账号或联系管理员。':status===413?'文件过大，请压缩文件后重试。':status===429?'请求过于频繁，请稍后重试。':'请保留输入内容，稍后重试。';
    var e=new Error(stage+'失败'+(status?'（'+status+'）':'')+'。'+hint);e.stage=stage;e.status=status||0;return e;
  }
  function report(e){
    if(root.dispatchEvent&&root.CustomEvent)root.dispatchEvent(new root.CustomEvent('palm:operation-error',{detail:{stage:e.stage||'作品保存',status:e.status||0}}));
  }
  var api={url:url,safeUrl:safeUrl,meta:meta,gallery:gallery,failure:failure,report:report};
  root.PalmWork=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
