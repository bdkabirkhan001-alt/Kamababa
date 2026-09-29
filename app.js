const API = 'https://kamababa.cam/wp-json/wp/v2';
const PER_PAGE = 12;

// ========== HOME PAGE ==========
async function loadVideos(page = 1) {
  const grid = document.getElementById('videoGrid');
  const loading = document.getElementById('loading');
  const pagination = document.getElementById('pagination');
  
  if (!grid) return;

  loading.style.display = 'block';
  grid.innerHTML = '';

  try {
    const url = `\( {API}/posts?per_page= \){PER_PAGE}&page=${page}&_embed&orderby=date&order=desc`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API error');

    const posts = await res.json();
    const totalPages = parseInt(res.headers.get('X-WP-TotalPages') || '1');

    loading.style.display = 'none';

    posts.forEach(post => {
      const thumb = post.jetpack_featured_media_url || 
                    (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) || 
                    'https://via.placeholder.com/400x225?text=No+Thumb';

      const card = document.createElement('div');
      card.className = 'video-card';
      card.innerHTML = `
        <div class="thumb-wrap">
          <img src="\( {thumb}" alt=" \){post.title.rendered}" loading="lazy">
        </div>
        <div class="card-body">
          <h3>${post.title.rendered}</h3>
          <div class="card-meta">${new Date(post.date).toLocaleDateString()}</div>
        </div>
      `;
      card.onclick = () => {
        window.location.href = `video.html?id=${post.id}`;
      };
      grid.appendChild(card);
    });

    // Pagination
    pagination.innerHTML = '';
    if (totalPages > 1) {
      for (let i = 1; i <= Math.min(totalPages, 8); i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        if (i === page) btn.classList.add('active');
        btn.onclick = () => loadVideos(i);
        pagination.appendChild(btn);
      }
    }
  } catch (err) {
    loading.innerHTML = `<p style="color:#ff6b6b">Failed to load videos.<br>Possible CORS or API issue.<br>${err.message}</p>`;
    console.error(err);
  }
}

// ========== SINGLE VIDEO PAGE ==========
async function loadSingleVideo() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    document.getElementById('playerLoading').innerHTML = 'No video ID provided.';
    return;
  }

  const loading = document.getElementById('playerLoading');
  const content = document.getElementById('playerContent');

  try {
    const res = await fetch(`\( {API}/posts/ \){id}?_embed`);
    if (!res.ok) throw new Error('Video not found');

    const post = await res.json();

    document.title = post.title.rendered + ' | KamaBaba';
    document.getElementById('videoTitle').textContent = post.title.rendered;
    document.getElementById('videoExcerpt').innerHTML = post.excerpt.rendered || post.content.rendered;
    document.getElementById('originalLink').href = post.link;

    // Player: since direct mp4 rarely available, we show a nice placeholder + original link
    // + try to embed if possible
    const player = document.getElementById('videoPlayer');
    player.innerHTML = `
      <div style="text-align:center;padding:40px;color:#aaa;">
        <p style="font-size:1.2rem;margin-bottom:15px;">▶ Video Player</p>
        <p style="margin-bottom:20px;">Direct stream not available via public API.<br>
        Click below to watch full video on original site.</p>
        <a href="${post.link}" target="_blank" rel="noopener" class="btn">Open Full Video →</a>
      </div>
    `;

    // Tags
    const tagsEl = document.getElementById('videoTags');
    if (post._embedded?.['wp:term']) {
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

    // Related videos
    loadRelated();
  } catch (err) {
    loading.innerHTML = `<p style="color:#ff6b6b">Could not load video.<br>${err.message}</p>`;
  }
}

async function loadRelated() {
  const grid = document.getElementById('relatedGrid');
  if (!grid) return;

  try {
    const res = await fetch(`${API}/posts?per_page=6&_embed`);
    const posts = await res.json();

    posts.forEach(post => {
      const thumb = post.jetpack_featured_media_url || 'https://via.placeholder.com/400x225';
      const card = document.createElement('div');
      card.className = 'video-card';
      card.innerHTML = `
        <div class="thumb-wrap">
          <img src="${thumb}" alt="" loading="lazy">
        </div>
        <div class="card-body">
          <h3>${post.title.rendered}</h3>
        </div>
      `;
      card.onclick = () => location.href = `video.html?id=${post.id}`;
      grid.appendChild(card);
    });
  } catch (e) {}
}

// Auto init
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('videoGrid')) {
    loadVideos(1);
  }
});
