const grid=document.getElementById("grid"),search=document.getElementById("search"),sort=document.getElementById("sort"),count=document.getElementById("count"),empty=document.getElementById("empty");let category="All",allPosts=[];
function strip(s){const d=document.createElement("div");d.innerHTML=s||"";return d.textContent||d.innerText||""}
function esc(s){return String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function getVideoUrl(p){
  if(typeof VIDEO_FIELD!=="undefined" && VIDEO_FIELD && p.acf && p.acf[VIDEO_FIELD]) return p.acf[VIDEO_FIELD];
  const html=p.content?.rendered||"";
  const m=html.match(/<video[^>]*src=["']([^"']+)["']/i)||html.match(/<source[^>]*src=["']([^"']+)["']/i);
  if(m)return m[1];
  const a=html.match(/https?:\/\/[^\s"'<>]+\.mp4(?:\?[^\s"'<>]+)?/i);
  return a?a[0]:"";
}
function getThumb(p){
  return p._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
         "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=80";
}
function getCats(p){
  return (p._embedded?.["wp:term"]||[]).flat().filter(x=>x.taxonomy==="category").map(x=>x.name);
}
function render(){
  const q=search.value.trim().toLowerCase();
  let list=allPosts.filter(p=>{
    const title=strip(p.title?.rendered);
    const cats=getCats(p);
    return (!q||title.toLowerCase().includes(q)||cats.join(" ").toLowerCase().includes(q)) &&
           (category==="All"||cats.includes(category));
  });
  list.sort((a,b)=>sort.value==="popular"?0:new Date(b.date)-new Date(a.date));
  grid.innerHTML=list.map(p=>{
    const title=strip(p.title?.rendered)||"Untitled video", cats=getCats(p), url=getVideoUrl(p);
    return `<article class="card">
      <a href="${url||p.link}" target="_blank" rel="noopener">
        <div class="thumb"><img loading="lazy" src="${esc(getThumb(p))}" alt="${esc(title)}"></div>
        <div class="card-body"><h3>${esc(title)}</h3><div class="meta">${esc(cats[0]||"Video")} · ${new Date(p.date).toLocaleDateString()}</div></div>
      </a>
    </article>`;
  }).join("");
  count.textContent=`${list.length} video${list.length===1?"":"s"}`;
  empty.hidden=list.length!==0;
}
async function load(){
  grid.innerHTML='<p class="meta">Loading videos…</p>';
  try{
    const r=await fetch(`${API_BASE}?per_page=${PER_PAGE}&_embed`);
    if(!r.ok) throw new Error("API request failed: "+r.status);
    allPosts=await r.json();
    render();
    const cats=[...new Set(allPosts.flatMap(getCats))].slice(0,8);
    const box=document.querySelector(".chips");
    box.innerHTML='<button data-category="All">All</button>'+cats.map(c=>`<button data-category="${esc(c)}">${esc(c)}</button>`).join("");
    document.querySelectorAll("[data-category]").forEach(b=>b.addEventListener("click",()=>{category=b.dataset.category;render()}));
  }catch(e){
    grid.innerHTML='<p class="empty">Could not load videos from the FSI MMS API. Check the REST API URL and CORS settings.</p>';
    console.error(e);
  }
}
search.addEventListener("input",render);sort.addEventListener("change",render);load();
