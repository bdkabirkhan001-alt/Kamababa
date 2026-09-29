// ========== CONFIG ==========
const PROXY = 'https://corsproxy.io/?';
const RAW_API = 'https://kamababa.cam/wp-json/wp/v2';
const API = PROXY + encodeURIComponent(RAW_API);
const PER_PAGE = 12;

// ========== HOME PAGE ==========
async function loadVideos(page = 1) {
  const grid = document.getElementById('videoGrid');
  const loading = document.getElementById('loading');
  const pagination = document.getElementById('pagination');
  
  if (!grid) return;

  loading.style.display = 'block';
  loading.innerHTML = 'Loading videos...';
  grid.innerHTML = '';
  if (pagination) pagination.innerHTML = '';

  try {
    const url = `\( {API}/posts?per_page= \){PER_PAGE}&page=${page}&_embed&orderby=date&order=desc`;
    
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }

    const posts = await res.json();
    
    // Total pages proxy theke ashe na, tai simple pagination
    loading.style.display = 'none';

    if (!Array.isArray(posts) || posts.length === 0) {
      loading.style.display = 'block';
      loading.innerHTML = 'No videos found.';
      return;
    }

    posts.forEach(post => {
      const thumb = post.jetpack_featured_media_url || 
                    (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]?.source_url) || 
                    'https://via.placeholder.com/400x225/111/666?text=No+Thumbnail';

      const card = document.createElement('div');
      card.className = 'video-card';
      card.innerHTML = `
        <div class="thumb-wrap">
          <img src="\( {thumb}" alt=" \){escapeHtml(post.title.rendered)}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x225/111/666?text=No+Thumb'">
        </div>
        <div class="card-body">
          <h3>${escapeHtml(post.title.rendered)}</h3>
          <div class="card-meta">${new Date(post.date).toLocaleDateString()}</div>
        </div>
      `;
      card.onclick = () => {
        window.location.href = `video.html?id=${post.id}`;
      };
      grid.appendChild(card);
    });

    // Simple pagination
    if (pagination) {
      pagination.innerHTML = `
        <button onclick="loadVideos(${Math.max(1, page-1)})" ${page <= 1 ? 'disabled' : ''}>← Prev</button>
        <button class="active">${page}</button>
        <button onclick="loadVideos(${page+1})">Next →</button>
      `;
    }

  } catch (err) {
    console.error(err);
    loading.style.display = 'block';
    loading.innerHTML = `
      <p style="color:#ff6b6b; margin-bottom:10px;">Failed to load videos</p>
      <p style="font-size:0.9rem; color:#aaa;">${err.message}</p>
      <p style="font-size:0.85rem; margin-top:15px; color:#888;">
        Possible reasons: CORS / Proxy down / Network issue<br>
        Try refreshing or check browser console (F12)
      </p>
    `;
  }
}

// ========== SINGLE VIDEO PAGE ==========
async function loadSingleVideo() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  
  const loading = document.getElementById('playerLoading');
  const content = document.getElementById('playerContent');
  
  if (!id) {
    if (loading) loading.innerHTML = 'No video ID provided.';
    return;
  }

  try {
    const url = `\( {API}/posts/ \){id}?_embed`;
    const res = await fetch(url);
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const post = await res.json();

    document.title = post.title.rendered + ' | KamaBaba';
    
    document.getElementById('videoTitle').textContent = post.title.rendered;
    document.getElementById('videoExcerpt').innerHTML = post.excerpt?.rendered || post.content?.rendered || '';
    document.getElementById('originalLink').href = post.link;

    // Player area
    const player = document.getElementById('videoPlayer');
    player.innerHTML = `
      <div style="text-align:center; padding:40px 20px; color:#aaa;">
        <div style="font-size:3rem; margin-bottom:15px;">▶</div>
        <p style="font-size:1.15rem; margin-bottom:10px;">Video Player</p>
        <p style="margin-bottom:25px; font-size:0.95rem;">
          Direct video stream public API te available na.<br>
          Full video dekhte original site e jaw.
        </p>
        <a href="${post.link}" target="_blank" rel="noopener" class="btn">Open Full Video →</a>
      </div>
    `;

    // Tags
    const tagsEl = document.getElementById('videoTags');
    tagsEl.innerHTML = '';
    if (post._embedded && post._embedded['wp:term']) {
      post._embedded['wp:term'].flat().forEach(term => {
        if (term.taxonomy === 'post_tag' || term.taxonomy === 'category') {
          const span = document.createElement('span');
          span.className = 'tag';
          span.textContent = term.name;
          tagsEl.appendChild(span);
        }
      });
    }

    loading.style.display = 'none';
    content.style.display = 'block';

    loadRelated();
  } catch (err) {
    console.error(err);
    loading.innerHTML = `
      <p style="color:#ff6b6b;">Could not load video</p>
      <p style="color:#aaa; font-size:0.9rem;">${err.message}</p>
    `;
  }
}

async function loadRelated() {
  const grid = document.getElementById('relatedGrid');
  if (!grid) return;

  try {
    const url = `${API}/posts?per_page=6&_embed`;
    const res = await fetch(url);
    const posts = await res.json();

    grid.innerHTML = '';
    posts.forEach(post => {
      const thumb = post.jetpack_featured_media_url || 'https://via.placeholder.com/400x225/111/666?text=No+Thumb';
      const card = document.createElement('div');
      card.className = 'video-card';
      card.innerHTML = `
        <div class="thumb-wrap">
          <img src="${thumb}" alt="" loading="lazy">
        </div>
        <div class="card-body">
          <h3>${escapeHtml(post.title.rendered)}</h3>
        </div>
      `;
      card.onclick = () => location.href = `video.html?id=${post.id}`;
      grid.appendChild(card);
    });
  } catch (e) {
    console.log('Related videos failed', e);
  }
}

// Helper
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Auto start
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('videoGrid')) {
    loadVideos(1);
  }
  // video.html page e loadSingleVideo call kora ache
});
