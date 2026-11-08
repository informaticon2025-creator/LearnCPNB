function getNewsMediaUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    const url = new URL(value, document.baseURI);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function getNewsVideoEmbed(url) {
  const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
  const youtubeHosts = ['youtube.com', 'youtube-nocookie.com', 'youtu.be'];
  const isYouTube = youtubeHosts.some(host => hostname === host || hostname.endsWith(`.${host}`));

  if (isYouTube) {
    const videoId = hostname === 'youtu.be'
      ? url.pathname.split('/').filter(Boolean)[0]
      : url.searchParams.get('v') ||
        url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})(?:\/|$)/)?.[1];
    if (videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId)) {
      return {
        src: `https://www.youtube-nocookie.com/embed/${videoId}?controls=1&playsinline=1&rel=0`,
        vertical: false
      };
    }
  }

  const isTikTok = hostname === 'tiktok.com' || hostname.endsWith('.tiktok.com');
  if (isTikTok) {
    const videoId = url.pathname.match(/\/(?:@[^/]+\/video|player\/v1|embed\/v2)\/(\d+)/)?.[1];
    if (videoId) {
      return {
        src: `https://www.tiktok.com/player/v1/${videoId}?controls=1&music_info=1&description=1`,
        vertical: true
      };
    }
  }

  return { src: url.href, vertical: false };
}

window.createNewsImageElement = function (value, title, className) {
  const url = getNewsMediaUrl(value);
  if (!url) throw new Error('La noticia tiene una URL de imagen inválida.');

  const image = document.createElement('img');
  image.className = className;
  image.src = url.href;
  image.alt = title;
  return image;
};

window.createNewsIframeElement = function (value, title) {
  const url = getNewsMediaUrl(value);
  if (!url) throw new Error('La noticia tiene una URL de video inválida.');
  const video = getNewsVideoEmbed(url);
  const frame = document.createElement('div');
  frame.className = `news-media-frame${video.vertical ? ' news-media-frame--vertical' : ''}`;

  const iframe = document.createElement('iframe');
  iframe.src = video.src;
  iframe.title = `${title} - reproductor de video`;
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  frame.appendChild(iframe);

  const openLink = document.createElement('a');
  openLink.className = 'news-video-open';
  openLink.href = url.href;
  openLink.target = '_blank';
  openLink.rel = 'noopener noreferrer';
  openLink.textContent = '¿No se reproduce? Abrir video en una pestaña nueva';

  const media = document.createElement('div');
  media.className = 'news-video';
  media.append(frame, openLink);
  return media;
};
