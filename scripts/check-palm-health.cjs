// Read-only public health probe. Run with Node 22+: node scripts/check-palm-health.cjs
// Does not sign in, upload, send messages, or use a secret/service-role key.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const P=require('../上线包_掌心/palm-work.js');
const ORIGIN='https://palmpoetry.org',DB='https://ubzykpglausstbsvijoc.supabase.co';
const statePath=process.env.PALM_HEALTH_STATE||path.join(__dirname,'..','.palm-health','palmpoetry.json');
async function request(url,options={}){
 let last;
 for(let attempt=0;attempt<2;attempt++){
  try{
   const r=await fetch(url,{...options,signal:AbortSignal.timeout(15000),redirect:'error'});
   if(r.status>=500&&attempt===0){await r.body?.cancel();continue;}
   return r;
  }catch(e){last=e;}
 }
 throw last;
}
async function probe(){
 const issues=[],warnings=[],uncheckedExternal=new Set(),assets=new Set();
 const add=(code,id)=>issues.push({code,id});
 let workCount=0,memberCount=0;
 try{
  const page=await request(ORIGIN+'/');if(!page.ok)throw Error('homepage-http-'+page.status);
  const html=await page.text();
  if(!html.includes('wkGrid')||!html.includes('sbCard'))add('homepage-structure','home');
  const key=(html.match(/sb_publishable_[A-Za-z0-9_-]+/)||[])[0];
  if(!key)throw Error('public-config-missing');
  const headers={apikey:key};
  const wr=await request(DB+'/rest/v1/works?select=id,kind,author_name,title,url,note,body,cover_url',{headers});
  const mr=await request(DB+'/rest/v1/members?select=id,name,photo_url',{headers});
  if(!wr.ok||!mr.ok)throw Error('public-api-http-'+wr.status+'-'+mr.status);
  const works=await wr.json(),members=await mr.json();
  if(!Array.isArray(works)||!Array.isArray(members))throw Error('public-api-shape');
  workCount=works.length;memberCount=members.length;
  if(!memberCount)add('empty-member-roster','members');
  if(!workCount)add('empty-works','works');
  function link(raw,id){
   if(!raw)return;
   const normalized=P.safeUrl(raw);
   if(!normalized){add('invalid-url',id);return;}
   if(!/^https?:\/\//i.test(String(raw)))warnings.push({code:'legacy-url-needs-protocol',id});
   const u=new URL(normalized);
   // Restrict outgoing asset probes to this site's public storage; external/member
   // supplied URLs are reported separately and never receive API credentials.
   if(u.origin===DB&&u.pathname.startsWith('/storage/v1/object/public/'))assets.add(normalized);
   else uncheckedExternal.add(u.hostname);
  }
  for(const w of works){
   const m=P.meta(w.note);
   link(w.url,w.id);link(w.cover_url,w.id);link(m.f,w.id);
   for(const u of (Array.isArray(m.g)?m.g:Array.isArray(m.gallery)?m.gallery:[]))link(u,w.id);
   const pending=!String(w.title||'').trim()||/^\s*[《（(]?\s*待补/.test(w.title);
   if(!pending&&!w.body&&!w.url&&!m.f&&!w.cover_url&&!P.gallery(w.note).length){if(String(m.d||'').trim())warnings.push({code:'description-only-work',id:w.id});else add('work-has-no-content',w.id);}
   else if(!pending&&!w.body&&!w.url&&!m.f&&!String(m.d||String()).trim())warnings.push({code:'image-only-work',id:w.id});
  }
  for(const m of members)link(m.photo_url,m.id);
  const queue=[...assets];
  if(queue.length>300)throw Error('asset-check-limit-exceeded');
  await Promise.all(Array.from({length:4},async()=>{
   while(queue.length){
    const u=queue.shift();let r;
    try{r=await request(u,{method:'HEAD'});if(!r.ok)add('asset-http-'+r.status,crypto.createHash('sha256').update(u).digest('hex').slice(0,16));}
    catch(e){add('asset-unreachable',crypto.createHash('sha256').update(u).digest('hex').slice(0,16));}
   }
  }));
 }catch(e){add('monitor-incomplete',String(e.message).slice(0,100));}
 issues.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
 const fingerprint=crypto.createHash('sha256').update(JSON.stringify(issues)).digest('hex');
 let previous=null;try{previous=JSON.parse(fs.readFileSync(statePath,'utf8'));}catch(e){}
 const now=new Date(), gap=previous&&now-new Date(previous.checkedAt)>60*60*60*1000;
 const changed=!previous||previous.fingerprint!==fingerprint;
 const transition=!previous?(issues.length?'initial-failure':'baseline'):changed?(issues.length?'changed-failure':'recovered'):'unchanged';
 const result={checkedAt:now.toISOString(),healthy:issues.length===0,transition,notify:transition==='initial-failure'||transition==='changed-failure'||transition==='recovered'||!!gap,
  missedInterval:!!gap,counts:{members:memberCount,works:workCount,assets:assets.size},issues,warnings,
  notVerified:['authenticated upload and save','browser rendering','external-link reachability','notification delivery'],externalHosts:[...uncheckedExternal].sort(),fingerprint};
 fs.mkdirSync(path.dirname(statePath),{recursive:true});
 const temp=statePath+'.tmp';fs.writeFileSync(temp,JSON.stringify(result,null,2));fs.renameSync(temp,statePath);
 console.log(JSON.stringify(result,null,2));
 process.exitCode=issues.length?1:0;
}
probe().catch(e=>{console.error(JSON.stringify({healthy:false,notify:true,issues:[{code:'monitor-failed',id:e.message}]}));process.exitCode=2;});
