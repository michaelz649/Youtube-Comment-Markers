// --- ICONS (SVG Strings) ---
// Wir nutzen hier Strings, wandeln sie aber unten sicher mit DOMParser um
const ICON_THUMB_XML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="yt-stat-icon"><path d="M1,21h4V9H1V21z M23,10c0-1.1-0.9-2-2-2h-6.31l0.95-4.57c0.03-0.32-0.25-0.75-0.62-1.12c-0.32-0.32-0.75-0.5-1.19-0.5L12,2 l-7.29,7.29C4.25,9.75,4,10.35,4,11v9c0,1.1,0.9,2,2,2h11c0.83,0,1.54-0.5,1.84-1.22l3.02-7.05C21.96,13.54,22,13.28,22,13 L23,10z"></path></svg>`;
const ICON_REPLY_XML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="yt-stat-icon"><path d="M20,2H4C2.9,2,2,2.9,2,4v18l4-4h14c1.1,0,2-0.9,2-2V4C22,2.9,21.1,2,20,2z"></path></svg>`;

// --- HILFSFUNKTIONEN ---

function parseTimestampToSeconds(timeStr) {
  const parts = timeStr.split(':').map(Number);
  let seconds = 0;
  if (parts.length === 3) {
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    seconds = parts[0] * 60 + parts[1];
  }
  return seconds;
}

// --- SETTINGS ---

let settings = { maxPages: 15, debug: false };

browser.storage.sync.get({ maxPages: 15, debug: false }).then(s => { settings = s; });

function dbg(...args) {
  if (settings.debug) console.log('[YT-Overlay]', ...args);
}

// --- INNERTUBE API COMMENT LOADING ---

let apiComments = [];
let apiLoading = false;

function getPageConfig() {
  try {
    const ytcfg = window.wrappedJSObject?.ytcfg || window.ytcfg;
    dbg('getPageConfig: ytcfg found?', !!ytcfg);

    let apiKey = null;
    let context = null;

    if (ytcfg) {
      // data_ is blocked by Firefox Xray wrapper — use get() method instead
      try { apiKey = ytcfg.get('INNERTUBE_API_KEY'); } catch (e) {}
      try {
        const rawCtx = ytcfg.get('INNERTUBE_CONTEXT');
        if (rawCtx) context = JSON.parse(JSON.stringify(rawCtx));
      } catch (e) {}
    }

    // Fallback: minimal context — cookies carry authentication automatically
    if (!context) {
      const lang = document.documentElement.lang || 'en';
      context = { client: { clientName: 'WEB', clientVersion: '2.20250101.00.00', hl: lang } };
      dbg('getPageConfig: using fallback context');
    }

    dbg('getPageConfig: apiKey=', apiKey ? apiKey.slice(0, 8) + '…' : 'none (ok)', '| context=', !!context);
    return { apiKey, context };
  } catch (e) {
    console.error('[YT-Overlay] getPageConfig error:', e);
    return null;
  }
}

function getContinuationToken() {
  const el = document.querySelector('ytd-continuation-item-renderer');
  dbg('getContinuationToken: element found?', !!el);
  if (!el) return null;
  try {
    const src = el.wrappedJSObject || el;
    const data = src.data || src.__data?.data;
    const token = data?.continuationEndpoint?.continuationCommand?.token ?? null;
    dbg('getContinuationToken: data=', !!data, '| token=', token ? token.slice(0, 20) + '…' : 'MISSING');
    return token;
  } catch (e) {
    console.error('[YT-Overlay] getContinuationToken error:', e);
    return null;
  }
}

function parseItemsForComments(items, mutations) {
  const comments = [];
  let nextToken = null;

  // --- New ViewModel format: comments live in mutations, not items ---
  for (const m of (mutations || [])) {
    if (m.payload?.commentEntityPayload) {
      const payload = m.payload.commentEntityPayload;
      const text = payload.properties?.content?.content || '';
      const timeMatch = text.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
      if (timeMatch) {
        comments.push({
          author: payload.author?.displayName || '',
          avatarUrl: payload.author?.avatarThumbnailUrl || '',
          text,
          likeCount: '0',
          replyCount: String(payload.properties?.replyCount ?? 0),
          timestampStr: timeMatch[0],
          seconds: parseTimestampToSeconds(timeMatch[0]),
          element: null
        });
      }
    }
    // Continuation token can be embedded in mutations
    const mutToken = m.payload?.continuationItemRendererEntityPayload?.token;
    if (mutToken && !nextToken) nextToken = mutToken;
  }

  // --- Legacy format + continuation token from items ---
  for (const item of items) {
    if (item.commentThreadRenderer) {
      const renderer = item.commentThreadRenderer?.comment?.commentRenderer;
      if (!renderer) continue;
      const text = (renderer.contentText?.runs || []).map(r => r.text || '').join('');
      const timeMatch = text.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
      if (!timeMatch) continue;
      const thumbs = renderer.authorThumbnail?.thumbnails || [];
      comments.push({
        author: (renderer.authorText?.runs || []).map(r => r.text || '').join(''),
        avatarUrl: thumbs[thumbs.length - 1]?.url || '',
        text,
        likeCount: renderer.voteCount?.simpleText || '0',
        replyCount: String(renderer.replyCount?.replyCount ?? 0),
        timestampStr: timeMatch[0],
        seconds: parseTimestampToSeconds(timeMatch[0]),
        element: null
      });
    } else if (item.continuationItemRenderer) {
      const t = item.continuationItemRenderer
        ?.continuationEndpoint?.continuationCommand?.token;
      if (t) nextToken = t;
    }
  }

  return { comments, nextToken };
}

async function loadCommentsViaAPI() {
  if (apiLoading || !window.location.href.includes('/watch?v=')) return;
  apiLoading = true;
  dbg('loadCommentsViaAPI: starting');

  try {
    const config = getPageConfig();
    if (!config || !config.context) { console.warn('[YT-Overlay] loadCommentsViaAPI: no config, aborting'); return; }

    let token = getContinuationToken();
    if (!token) { console.warn('[YT-Overlay] loadCommentsViaAPI: no token, aborting'); return; }

    const urlBase = config.apiKey
      ? `/youtubei/v1/next?key=${encodeURIComponent(config.apiKey)}`
      : '/youtubei/v1/next';

    let page = 0;
    while (token && page < settings.maxPages) {
      page++;
      dbg(`fetching page ${page}, apiComments so far: ${apiComments.length}`);

      let data;
      try {
        const resp = await fetch(urlBase, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context: config.context, continuation: token })
        });
        dbg(`page ${page} response status:`, resp.status);
        if (!resp.ok) { console.error('[YT-Overlay] non-ok response, stopping'); break; }
        data = await resp.json();
        dbg(`page ${page} response keys:`, Object.keys(data));
      } catch (e) {
        console.error('[YT-Overlay] fetch error:', e);
        break;
      }

      const endpoints = data?.onResponseReceivedEndpoints || [];

      // Collect items from ALL endpoints (header in first, continuation in second)
      let items = [];
      for (const ep of endpoints) {
        const epItems = ep?.appendContinuationItemsAction?.continuationItems
                     || ep?.reloadContinuationItemsCommand?.continuationItems
                     || [];
        items = items.concat(epItems);
      }
      dbg(`page ${page} total items:`, items.length, '| types:', JSON.stringify(items.map(i => Object.keys(i)[0])));

      // ViewModel: comments are in mutations
      const mutations = data?.frameworkUpdates?.entityBatchUpdate?.mutations || [];
      dbg(`page ${page} mutations:`, mutations.length, '| commentEntityPayload count:', mutations.filter(m => m.payload?.commentEntityPayload).length);

      if (!items.length && !mutations.length) {
        console.warn('[YT-Overlay] empty response, stopping');
        break;
      }

      const { comments, nextToken } = parseItemsForComments(items, mutations);
      dbg(`page ${page} timestamp comments found:`, comments.length, '| nextToken:', nextToken ? nextToken.slice(0,20)+'…' : 'null');
      apiComments.push(...comments);
      token = nextToken;

      initOverlay();

      // Throttle: randomized 700–1100ms between requests to stay under rate limits
      await new Promise(r => setTimeout(r, 700 + Math.random() * 400));
    }
    dbg('loadCommentsViaAPI: done. Total API comments:', apiComments.length);
  } finally {
    apiLoading = false;
  }
}

// --- DOM CONTINUATION WATCHER ---

let commentAutoLoader = null;

function stopCommentAutoLoader() {
  if (commentAutoLoader) {
    clearInterval(commentAutoLoader);
    commentAutoLoader = null;
  }
}

function startCommentAutoLoader() {
  if (!window.location.href.includes('/watch?v=')) return;
  stopCommentAutoLoader();

  let ticks = 0;
  const MAX_TICKS = 15; // 15 × 2s = 30s max wait before giving up

  commentAutoLoader = setInterval(() => {
    ticks++;
    if (!window.location.href.includes('/watch?v=') || apiLoading || ticks > MAX_TICKS) {
      if (ticks > MAX_TICKS) console.warn('[YT-Overlay] autoLoader: tick limit reached, stopping');
      stopCommentAutoLoader();
      return;
    }

    // Scope to comments section — avoids picking up sidebar/recommendations continuation
    const commentsSection = document.querySelector('ytd-comments#comments');
    const continuation = commentsSection
      ? commentsSection.querySelector('ytd-continuation-item-renderer')
      : null;
    const currentCount = document.querySelectorAll('ytd-comment-thread-renderer').length;
    dbg('autoLoader tick', ticks, ': domComments=', currentCount, '| commentsContinuation=', !!continuation, '| apiLoading=', apiLoading);

    if (continuation && !apiLoading) {
      // Token present in ytd-comments — API can fetch this page (1st or subsequent)
      dbg('autoLoader: handing off to API, domComments=', currentCount);
      stopCommentAutoLoader();
      loadCommentsViaAPI();
    } else if (!continuation && currentCount > 0) {
      dbg('autoLoader: no continuation, all comments loaded, stopping');
      stopCommentAutoLoader();
    }
  }, 2000);
}

function extractComments() {
  const comments = [];
  const commentElements = document.querySelectorAll('ytd-comment-thread-renderer');

  commentElements.forEach(el => {
    const authorEl = el.querySelector('#author-text span');
    const contentEl = el.querySelector('#content-text');
    const avatarEl = el.querySelector('#author-thumbnail img');
    
    // Likes
    const voteEl = el.querySelector('#vote-count-middle');
    let likeCount = "0";
    if (voteEl) {
        likeCount = voteEl.innerText.trim();
        if (!likeCount) likeCount = "0";
    }

    // Replies
    let replyCount = "0";
    const repliesRenderer = el.querySelector('ytd-comment-replies-renderer');
    if (repliesRenderer) {
        const moreRepliesBtn = repliesRenderer.querySelector('#more-replies');
        if (moreRepliesBtn) {
            const match = moreRepliesBtn.innerText.match(/(\d+)/);
            if (match) replyCount = match[0];
        } else {
             const buttons = repliesRenderer.querySelectorAll('ytd-button-renderer');
             for (const btn of buttons) {
                 const match = btn.innerText.match(/(\d+)/);
                 if (match) {
                     replyCount = match[0];
                     break; 
                 }
             }
        }
    }
    
    if (!authorEl || !contentEl) return;

    const author = authorEl.innerText.trim();
    const text = contentEl.innerText;
    const avatarUrl = avatarEl ? avatarEl.src : '';
    const timeMatch = text.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);

    if (timeMatch) {
      comments.push({
        author,
        avatarUrl,
        text,
        likeCount,
        replyCount,
        timestampStr: timeMatch[0],
        seconds: parseTimestampToSeconds(timeMatch[0]),
        element: el
      });
    }
  });
  
  // Merge API-fetched comments (pages 2+) — no DOM element, element: null
  comments.push(...apiComments);

  return comments.sort((a, b) => a.seconds - b.seconds);
}

function clusterComments(comments, duration, thresholdPercent = 0.5) {
  if (comments.length === 0) return [];
  
  const clusters = [];
  let currentCluster = [comments[0]];
  
  for (let i = 1; i < comments.length; i++) {
    const prev = currentCluster[currentCluster.length - 1];
    const curr = comments[i];
    
    const diffPercent = ((curr.seconds - prev.seconds) / duration) * 100;
    
    if (diffPercent <= thresholdPercent) {
      currentCluster.push(curr);
    } else {
      clusters.push(currentCluster);
      currentCluster = [curr];
    }
  }
  clusters.push(currentCluster);
  
  return clusters;
}

function scrollToComment(element) {
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const originalBg = element.style.backgroundColor;
    element.style.transition = "background-color 0.5s";
    element.style.backgroundColor = "rgba(255, 204, 0, 0.15)";
    setTimeout(() => { element.style.backgroundColor = originalBg || ""; }, 2000);
  }
}

// --- DOM BUILDER HELPERS (100% Sicher: DOMParser statt innerHTML) ---

// WICHTIG: Diese Funktion nutzt jetzt DOMParser. Das ist sicher und erlaubt.
function createIcon(xmlString) {
  const parser = new DOMParser();
  // Wandelt den String in ein echtes XML/SVG Dokument um
  const doc = parser.parseFromString(xmlString, "image/svg+xml");
  // Gibt das Wurzelelement (das <svg> Tag) zurück
  return doc.documentElement; 
}

function buildSingleTooltip(comment, videoElement) {
  const container = document.createElement('div');
  container.className = 'yt-tooltip-content-single';
  
  // Header
  const header = document.createElement('div');
  header.className = 'yt-tooltip-header';
  
  // Avatar
  const avatar = document.createElement('img');
  avatar.className = 'yt-tooltip-avatar';
  avatar.src = comment.avatarUrl;
  avatar.onerror = () => { avatar.style.display = 'none'; };
  header.appendChild(avatar);
  
  // Meta Info
  const meta = document.createElement('div');
  meta.className = 'yt-tooltip-meta';
  
  const author = document.createElement('span');
  author.className = 'yt-tooltip-author';
  author.textContent = comment.author; 
  meta.appendChild(author);
  
  const stats = document.createElement('div');
  stats.className = 'yt-tooltip-stats';
  
  // Likes
  const statLike = document.createElement('span');
  statLike.className = 'yt-stat-item';
  statLike.title = 'Likes';
  statLike.appendChild(createIcon(ICON_THUMB_XML));
  statLike.appendChild(document.createTextNode(' ' + comment.likeCount));
  stats.appendChild(statLike);

  // Replies
  const statReply = document.createElement('span');
  statReply.className = 'yt-stat-item';
  statReply.title = 'Replies';
  statReply.appendChild(createIcon(ICON_REPLY_XML));
  statReply.appendChild(document.createTextNode(' ' + comment.replyCount));
  stats.appendChild(statReply);
  
  meta.appendChild(stats);
  header.appendChild(meta);
  
  // Hint
  const hint = document.createElement('span');
  hint.className = 'yt-tooltip-hint';
  hint.textContent = 'Ir al comentario ➜';
  header.appendChild(hint);
  
  container.appendChild(header);
  
  // Text
  const textDiv = document.createElement('div');
  textDiv.className = 'yt-tooltip-text';
  textDiv.textContent = comment.text; // Sicher: textContent
  container.appendChild(textDiv);

  // Click Event
  container.onclick = (e) => {
      e.stopPropagation();
      scrollToComment(comment.element);
      if (videoElement) {
          videoElement.currentTime = comment.seconds;
          videoElement.play();
      }
  };

  return container;
}

function buildClusterTooltip(cluster, videoElement) {
  const container = document.createElement('div');
  
  // Header
  const header = document.createElement('div');
  header.className = 'yt-tooltip-cluster-header';
  header.textContent = `${cluster.length} comentarios en este momento`;
  container.appendChild(header);
  
  // Liste
  const ul = document.createElement('ul');
  ul.className = 'yt-cluster-list';
  
  cluster.forEach((comment) => {
      const li = document.createElement('li');
      li.className = 'yt-cluster-item';
      
      // Avatar
      const img = document.createElement('img');
      img.className = 'yt-cluster-avatar';
      img.src = comment.avatarUrl;
      li.appendChild(img);
      
      // Content
      const content = document.createElement('div');
      content.className = 'yt-cluster-content';
      
      const authorRow = document.createElement('div');
      authorRow.className = 'yt-cluster-author';
      
      const authorName = document.createElement('span');
      authorName.textContent = comment.author;
      authorRow.appendChild(authorName);
      
      const statsMini = document.createElement('div');
      statsMini.className = 'yt-cluster-stats-mini';
      
      const likesSpan = document.createElement('span');
      likesSpan.textContent = `${comment.likeCount} 👍`;
      statsMini.appendChild(likesSpan);

      const timeSpan = document.createElement('span');
      timeSpan.style.marginLeft = '5px';
      timeSpan.textContent = comment.timestampStr;
      statsMini.appendChild(timeSpan);
      
      authorRow.appendChild(statsMini);
      content.appendChild(authorRow);
      
      // Text
      const textDiv = document.createElement('div');
      textDiv.className = 'yt-cluster-text';
      textDiv.textContent = comment.text;
      content.appendChild(textDiv);
      
      li.appendChild(content);
      
      // Click Event pro Item
      li.onclick = (e) => {
          e.stopPropagation();
          scrollToComment(comment.element);
          if (videoElement) {
              videoElement.currentTime = comment.seconds;
              videoElement.play();
          }
      };
      
      ul.appendChild(li);
  });
  
  container.appendChild(ul);
  return container;
}

// --- TOOLTIP LOGIC ---

let tooltipEl = null;
let hideTimeout = null;

function createGlobalTooltip() {
  if (document.getElementById('yt-timeline-tooltip-container')) {
    tooltipEl = document.getElementById('yt-timeline-tooltip-container');
    return;
  }
  tooltipEl = document.createElement('div');
  tooltipEl.id = 'yt-timeline-tooltip-container';
  
  tooltipEl.addEventListener('mouseenter', () => { if (hideTimeout) clearTimeout(hideTimeout); });
  tooltipEl.addEventListener('mouseleave', () => { hideTooltip(); });
  
  document.body.appendChild(tooltipEl);
}

function showTooltip(marker, cluster) {
  if (!tooltipEl) return;
  if (hideTimeout) clearTimeout(hideTimeout);
  
  // Inhalt sicher löschen
  while (tooltipEl.firstChild) {
      tooltipEl.removeChild(tooltipEl.firstChild);
  }
  tooltipEl.onclick = null;

  const isCluster = cluster.length > 1;
  const videoElement = document.querySelector('video');
  
  // Elemente zusammenbauen
  let contentNode;
  if (isCluster) {
      contentNode = buildClusterTooltip(cluster, videoElement);
  } else {
      contentNode = buildSingleTooltip(cluster[0], videoElement);
  }
  
  tooltipEl.appendChild(contentNode);

  // Positionierung
  const isFullscreen = document.fullscreenElement !== null;
  const player = document.querySelector('#movie_player');
  
  if (isFullscreen) {
      if (tooltipEl.parentElement !== player) player.appendChild(tooltipEl);
  } else {
      if (tooltipEl.parentElement !== document.body) document.body.appendChild(tooltipEl);
  }

  tooltipEl.style.display = 'block';

  const markerRect = marker.getBoundingClientRect();
  const tooltipWidth = 450; 
  let leftPos = markerRect.left + (markerRect.width / 2) - (tooltipWidth / 2);
  
  if (leftPos < 10) leftPos = 10;
  if (leftPos + tooltipWidth > window.innerWidth) leftPos = window.innerWidth - tooltipWidth - 20;

  tooltipEl.style.left = `${leftPos}px`;

  if (isFullscreen) {
      const topPos = markerRect.top - tooltipEl.offsetHeight - 25;
      tooltipEl.style.top = `${topPos}px`;
  } else {
      const topPos = markerRect.bottom + 20;
      tooltipEl.style.top = `${topPos}px`;
  }
}

function hideTooltip() {
  hideTimeout = setTimeout(() => {
      if (tooltipEl) tooltipEl.style.display = 'none';
  }, 300); 
}

// --- MAIN ---

function initOverlay() {
  // NUR auf Video-Seiten ausführen!
  if (!window.location.href.includes('/watch?v=')) return;
  
  const videoElement = document.querySelector('video');
  const progressBar = document.querySelector('.ytp-progress-bar');
  
  if (!videoElement || !progressBar) return;

  const oldOverlay = document.getElementById('yt-comment-timeline-overlay');
  if (oldOverlay) oldOverlay.remove();

  createGlobalTooltip();

  const duration = videoElement.duration;
  const comments = extractComments();

  if (comments.length === 0) return;

  const clusters = clusterComments(comments, duration, 0.5);

  const overlay = document.createElement('div');
  overlay.id = 'yt-comment-timeline-overlay';
  
  clusters.forEach(cluster => {
    const firstComment = cluster[0];
    const positionPercent = (firstComment.seconds / duration) * 100;
    
    if (positionPercent < 0 || positionPercent > 100) return;

    const marker = document.createElement('div');
    marker.className = 'yt-timeline-marker';
    if (cluster.length > 1) marker.classList.add('is-cluster');
    
    marker.style.left = `${positionPercent}%`;

    marker.addEventListener('mouseenter', () => { showTooltip(marker, cluster); });
    marker.addEventListener('mouseleave', () => { hideTooltip(); });
    
    marker.addEventListener('click', (e) => {
      e.stopPropagation();
      videoElement.currentTime = firstComment.seconds;
      videoElement.play();
    });

    overlay.appendChild(marker);
  });

  progressBar.appendChild(overlay);
}

// --- INIT & OBSERVERS ---

setTimeout(() => { startCommentAutoLoader(); initOverlay(); }, 3000);
document.addEventListener('yt-navigate-finish', () => {
  stopCommentAutoLoader();
  apiComments = [];
  apiLoading = false;
  setTimeout(() => { startCommentAutoLoader(); initOverlay(); }, 2000);
});

window.addEventListener('scroll', () => {
    if (window.ytTimelineDebounce) clearTimeout(window.ytTimelineDebounce);
    window.ytTimelineDebounce = setTimeout(() => {
        initOverlay();
    }, 1000);
});

let lastCommentCount = 0;
setInterval(() => {
    const currentCount = document.querySelectorAll('ytd-comment-thread-renderer').length;
    if (currentCount !== lastCommentCount) {
        lastCommentCount = currentCount;
        initOverlay();
    }
}, 2000);