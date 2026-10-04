const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'), html=fs.readFileSync(path.join(root,'上线包_掌心/index.html'),'utf8');
const helper=fs.readFileSync(path.join(root,'上线包_掌心/palm-work.js'),'utf8');
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!/\bsrc\s*=|application\/ld\+json/i.test(m[1]));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'palm-js-check-'));
for(let i=0;i<scripts.length;i++){
 const p=path.join(temp,i+(/\bmodule\b/.test(scripts[i][1])?'.mjs':'.js'));fs.writeFileSync(p,scripts[i][2]);
 const r=cp.spawnSync(process.execPath,['--check',p],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
}
const raw=scripts.find(m=>m[2].includes('var CATS=')&&m[2].includes('window.__palmMyWork=open;'))[2];
function fixture(responses=[],token='test-token'){
 const calls=[],events=[]; const element=()=>({style:{},children:[],appendChild(x){this.children.push(x);},innerHTML:'',textContent:''});
 const ctx={URL,console,Event:class{constructor(type){this.type=type;}},CustomEvent:class{constructor(type,opts){this.type=type;this.detail=opts.detail;}},
 document:{createElement:element,addEventListener(){}},setTimeout(){},alert(){},location:{reload(){}},localStorage:{length:0},
 fetch:async(url,opts)=>{calls.push({url,opts});if(!responses.length)throw Error('Unexpected fetch');return responses.shift();},
 __palmClientReady:Promise.resolve({auth:{getSession:async()=>({data:{session:token?{access_token:token}:null}})}})};
 ctx.window=ctx;ctx.globalThis=ctx;ctx.dispatchEvent=e=>events.push(e);vm.createContext(ctx);vm.runInContext(helper,ctx);
 vm.runInContext(raw.replace('window.__palmMyWork=open;','window.__palmMyWork=open; window.testApi={save,upload,F,setMine:function(row){MINE=row;HOST="https://example.supabase.co";KEY="public";NAME="Test";OWNER="test@example.org";},setGallery:function(a){GAL=a;}};'),ctx);
 const a=ctx.testApi;
 for(const k of ['title','url','cover','desc','year','body','cat'])a.F[k]={value:''};
 a.F.title.value='Test work';a.F.body.value='Line one\n\nLine two';
 for(const k of ['coverF','gal','file'])a.F[k]={files:[],value:''};
 a.F.save={disabled:false};a.F.msg={textContent:''};a.F.galBox=element();
 a.setMine({id:'work-1',note:'{"c":"诗集","f":"https://files.example.org/old.pdf","custom":"keep"}'});
 return {ctx,a,calls,events};
}
const response=(status,data)=>({ok:status>=200&&status<300,status,json:async()=>data});
(async()=>{
 let f=fixture();const P=f.ctx.PalmWork;
 assert.equal(P.url('jenziartgallery.com'),'https://jenziartgallery.com/');
 assert.equal(P.url('https://example.org/a?q=1#b'),'https://example.org/a?q=1#b');
 for(const s of ['javascript:alert(1)','data:text/html,x','https://a:b@example.org','https://bad host.org'])assert.throws(()=>P.url(s));
 assert.equal(P.safeUrl('javascript:alert(1)'),'');
 f=fixture([response(500,{})]);f.a.F.file.files=[{name:'work.pdf',size:100,type:'application/pdf'}];await f.a.save();
 assert.equal(f.calls.length,1);assert.match(f.calls[0].url,/storage/);assert.match(f.a.F.msg.textContent,/上传失败/);assert.equal(f.a.F.save.disabled,false);assert.ok(!f.a.F.msg.textContent.startsWith('已保存'));
 f=fixture([response(200,[])]);await f.a.save();assert.match(f.a.F.msg.textContent,/未确认保存成功/);
 f=fixture([],null);await f.a.save();assert.equal(f.calls.length,0);assert.match(f.a.F.msg.textContent,/登录/);
 f=fixture([response(200,[{id:'work-1'}])]);f.a.F.url.value='jenziartgallery.com';await f.a.save();
 assert.match(f.a.F.msg.textContent,/已保存/);const body=JSON.parse(f.calls[0].opts.body);
 assert.equal(body.body,'Line one\n\nLine two');assert.equal(body.url,'https://jenziartgallery.com/');
 assert.equal(JSON.parse(body.note).custom,'keep');assert.equal(JSON.parse(body.note).f,'https://files.example.org/old.pdf');
 assert.equal(f.calls[0].opts.headers.Prefer,'return=representation');
 f=fixture();f.a.setGallery(Array(30).fill('https://example.org/a.jpg'));f.a.F.gal.files=[{name:'extra.jpg',size:1}];await f.a.save();
 assert.equal(f.calls.length,0);assert.match(f.a.F.msg.textContent,/最多 30/);
 f=fixture();f.a.F.url.value='javascript:alert(1)';await f.a.save();assert.equal(f.calls.length,0);
 f=fixture([response(403,{})]);await f.a.save();assert.match(f.a.F.msg.textContent,/权限/);assert.equal(f.events[0].detail.status,403);
 f=fixture();await assert.rejects(()=>f.a.upload({name:'empty.pdf',size:0},'f'),/空文件/);
 console.log('PASS: '+scripts.length+' inline scripts parsed; URL, session, upload failure, zero-row save, preservation, gallery limit and permission regressions.');
})().catch(e=>{console.error(e);process.exitCode=1;});
