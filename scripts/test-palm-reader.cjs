const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const dir=path.join(__dirname,'..','上线包_掌心');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const source=html.slice(html.indexOf('var wkReader=null;'),html.indexOf("document.addEventListener('click', function(e){",html.indexOf('var wkReader=null;')));
const nodes={};
function element(){
 const e={style:{},children:[],textContent:'',appendChild(x){this.children.push(x);},replaceChildren(){this.children=[];},addEventListener(){},
 querySelector(s){return nodes[s.slice(1)];},removeAttribute(k){delete this[k];}};
 Object.defineProperty(e,'innerHTML',{set(s){for(const m of s.matchAll(/id="([^"]+)"/g))nodes[m[1]]=element();}});
 return e;
}
const ctx={URL,document:{createElement:element,getElementById:id=>nodes[id],body:element()},protectedTitle:w=>w.title||'作品',
 isImageUrl:u=>/\.(jpg|png|jpeg|webp)(?:[?#].*)?$/i.test(u)};
ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(dir,'palm-work.js'),'utf8'),ctx);vm.runInContext(source,ctx);
ctx.openWkReader({title:'Image work',author_name:'Test',body:'',url:'',cover_url:'https://example.org/cover.jpg'});
assert.equal(nodes.wkrMedia.children.length,1);assert.match(nodes.wkrBody.textContent,/图片/);assert.equal(nodes.wkrLink.style.display,'none');
ctx.openWkReader({title:'Text work',body:'First\n\nSecond',url:'jenziartgallery.com',note:'{"f":"https://example.org/book.pdf","d":"说明"}'});
assert.equal(nodes.wkrBody.textContent,'First\n\nSecond');assert.equal(nodes.wkrLink.href,'https://jenziartgallery.com/');
assert.equal(nodes.wkrMedia.children[0].href,'https://example.org/book.pdf');assert.equal(nodes.wkrSummary.textContent,'说明');
ctx.openWkReader({title:'Unsafe',url:'javascript:alert(1)',body:'<script>keep as text</script>'});
assert.equal(nodes.wkrLink.href,undefined);assert.equal(nodes.wkrBody.textContent,'<script>keep as text</script>');
ctx.openWkReader({title:'Description',note:'{"d":"原有作品说明"}'});
assert.equal(nodes.wkrSummary.textContent,'原有作品说明');assert.equal(nodes.wkrMedia.children.length,0);
assert.match(nodes.wkrBody.textContent,/尚未添加/);
console.log('PASS: work reader images, body, normalized link, separate attachment, plain-text safety, stale-link clearing and description preservation.');
