const article = document.getElementById('newsArticle');
const status = document.getElementById('newsDetailStatus');
const shareSection = document.getElementById('newsShare');
const shareToggle = document.getElementById('newsShareToggle');
const shareMenu = document.getElementById('newsShareMenu');
const shareStatus = document.getElementById('newsShareStatus');
const commentsToggle = document.getElementById('newsCommentsToggle');
const commentsSection = document.getElementById('newsComments');
const commentsStatus = document.getElementById('newsCommentsStatus');
const commentsList = document.getElementById('newsCommentsList');
const commentsForm = document.getElementById('newsCommentsForm');
const commentNameInput = document.getElementById('newsCommentName');
const commentTextInput = document.getElementById('newsCommentText');
const commentSubmit = document.getElementById('newsCommentSubmit');
const emailServiceId = 'service_ymcp91a';
const emailTemplateId = 'template_2gmw4jb';
const emailPublicKey = 'hwNG-ShfplD0kHJwf';
const newsId = Number(new URLSearchParams(window.location.search).get('id'));
let currentNewsItem = null;

function setShareMenuOpen(isOpen) {
  shareMenu.hidden = !isOpen;
  shareToggle.setAttribute('aria-expanded', String(isOpen));
}

function getCommentsStorageKey() {
  return `learncpnb-comments-${newsId}`;
}

function readComments() {
  const savedComments = localStorage.getItem(getCommentsStorageKey());
  if (!savedComments) return [];

  const comments = JSON.parse(savedComments);
  if (!Array.isArray(comments) || comments.some(comment =>
    !comment ||
    typeof comment.id !== 'string' ||
    typeof comment.name !== 'string' ||
    typeof comment.text !== 'string' ||
    typeof comment.createdAt !== 'string' ||
    typeof comment.emailSent !== 'boolean'
  )) {
    throw new Error('El formato de los comentarios guardados no es válido.');
  }
  return comments;
}

function saveComments(comments) {
  localStorage.setItem(getCommentsStorageKey(), JSON.stringify(comments));
}

function renderComments() {
  const comments = readComments();
  commentsList.replaceChildren();

  if (!comments.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'news-comments-empty';
    emptyMessage.textContent = 'Todavía no hay comentarios en este navegador.';
    commentsList.appendChild(emptyMessage);
    return;
  }

  comments.slice().reverse().forEach(comment => {
    const item = document.createElement('article');
    item.className = 'news-comment';

    const header = document.createElement('div');
    header.className = 'news-comment-header';
    const name = document.createElement('strong');
    name.textContent = comment.name || 'Anónimo';
    const date = document.createElement('time');
    date.dateTime = comment.createdAt;
    const timestamp = Date.parse(comment.createdAt);
    date.textContent = Number.isNaN(timestamp) ? '' : new Date(timestamp).toLocaleString('es-VE');
    header.append(name, date);

    const text = document.createElement('p');
    text.className = 'news-comment-text';
    text.textContent = comment.text;
    item.append(header, text);

    if (!comment.emailSent) {
      const retryButton = document.createElement('button');
      retryButton.className = 'news-comment-retry';
      retryButton.type = 'button';
      retryButton.dataset.commentId = comment.id;
      retryButton.textContent = 'Reintentar envío por correo';
      item.appendChild(retryButton);
    }

    commentsList.appendChild(item);
  });
}

async function sendCommentEmail(comment, item) {
  if (!emailTemplateId) {
    throw new Error('Falta configurar el Template ID de EmailJS.');
  }

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: emailServiceId,
      template_id: emailTemplateId,
      user_id: emailPublicKey,
      template_params: {
        article_title: item.titulo,
        article_url: `https://informaticon2025-creator.github.io/LearnCPNB/page/news.html?id=${newsId}`,
        comment_name: comment.name || 'Anónimo',
        comment_text: comment.text
      }
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `EmailJS respondió con el estado ${response.status}.`);
  }
}

async function retryCommentEmail(commentId, item, button = null) {
  if (button) {
    button.disabled = true;
    button.textContent = 'Enviando...';
  }
  try {
    const comments = readComments();
    const comment = comments.find(saved => saved.id === commentId);
    if (!comment) throw new Error('No se encontró el comentario guardado.');

    await sendCommentEmail(comment, item);
    comment.emailSent = true;
    saveComments(comments);
    commentsStatus.textContent = 'EmailJS aceptó el envío. Revisa tu bandeja de entrada y Spam.';
    renderComments();
  } catch (error) {
    if (emailTemplateId) {
      console.error('No se pudo enviar el comentario por correo.', error);
    }
    commentsStatus.textContent = emailTemplateId
      ? 'El comentario sigue guardado en este navegador, pero no se pudo enviar por correo. Revisa EmailJS e inténtalo de nuevo.'
      : 'El comentario quedó guardado en este navegador. Para enviarlo por correo, falta configurar el Template ID de EmailJS.';
    try {
      renderComments();
    } catch (renderError) {
      console.error('No se pudo actualizar la lista de comentarios.', renderError);
    }
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = button.dataset.commentId ? 'Reintentar envío por correo' : 'Publicar comentario';
    }
  }
}

function setCommentsOpen(isOpen) {
  commentsSection.hidden = !isOpen;
  commentsToggle.setAttribute('aria-expanded', String(isOpen));
  if (!isOpen) return;

  try {
    renderComments();
  } catch (error) {
    console.error('No se pudieron leer los comentarios guardados.', error);
    commentsStatus.textContent = 'No se pudieron leer los comentarios guardados en este navegador.';
  }
  commentsSection.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start'
  });
}

function safeHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    const url = new URL(value, document.baseURI);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

function addShareLink(id, baseUrl, params) {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  document.getElementById(id).href = url.href;
}

function renderNews(item) {
  currentNewsItem = item;
  document.title = `${item.titulo} | Tu learn | CPNB`;
  document.querySelector('meta[name="description"]').content = item.descripcion;

  const heading = document.createElement('h1');
  heading.textContent = item.titulo;
  const date = document.createElement('time');
  date.className = 'news-date';
  date.textContent = item.fecha;
  const content = document.createElement('div');
  content.className = 'news-detail-content';
  const description = document.createElement('p');
  description.textContent = item.contenido || item.descripcion;
  content.append(date, heading);

  const imageUrl = item.img ? safeHttpUrl(item.img) : null;
  if (item.img && !imageUrl) {
    throw new Error('La noticia tiene una URL de imagen inválida.');
  }
  const videoUrl = item.iframe ? safeHttpUrl(item.iframe) : null;
  if (item.iframe && !videoUrl) {
    throw new Error('La noticia tiene una URL de video inválida.');
  }
  document.querySelector('meta[property="og:title"]').content = item.titulo;
  document.querySelector('meta[property="og:description"]').content = item.descripcion;
  document.querySelector('meta[property="og:image"]').content = imageUrl || '';
  document.querySelector('meta[name="twitter:title"]').content = item.titulo;
  document.querySelector('meta[name="twitter:description"]').content = item.descripcion;
  document.querySelector('meta[name="twitter:image"]').content = imageUrl || '';
  const shareUrl = window.location.href;
  document.querySelector('meta[property="og:url"]').content = shareUrl;
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.href = shareUrl;
  if (imageUrl) {
    const image = window.createNewsImageElement(imageUrl, item.titulo, 'news-detail-image');
    image.fetchPriority = 'high';
    content.appendChild(image);
  }
  if (videoUrl) {
    content.appendChild(window.createNewsIframeElement(videoUrl, item.titulo));
  }
  content.appendChild(description);

  if (item.link) {
    const sourceUrl = safeHttpUrl(item.link);
    if (!sourceUrl) {
      throw new Error('La noticia tiene una URL de fuente inválida.');
    }
    const source = document.createElement('a');
    source.className = 'news-link';
    source.href = sourceUrl;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    source.textContent = 'Ir a fuente';
    content.appendChild(source);
  }

  article.replaceChildren(content);
  shareSection.hidden = false;
  setShareMenuOpen(false);

  const shareText = `${item.titulo}\n\n${item.descripcion}`;
  addShareLink('shareWhatsApp', 'https://wa.me/', { text: `${shareText}\n\n${shareUrl}` });
  addShareLink('shareFacebook', 'https://www.facebook.com/sharer/sharer.php', {
    u: shareUrl,
    quote: shareText
  });
  addShareLink('shareX', 'https://twitter.com/intent/tweet', { text: shareText, url: shareUrl });
  addShareLink('shareTelegram', 'https://t.me/share/url', { url: shareUrl, text: shareText });
}

async function loadNews() {
  if (!Number.isSafeInteger(newsId) || newsId < 1 || newsId > 999) {
    throw new Error('El enlace de la noticia no es válido.');
  }

  const assetBase = document.querySelector('base')?.href || document.baseURI;
  const filename = new URL(`file/news/new_${String(newsId).padStart(2, '0')}.json`, assetBase);
  const response = await fetch(filename);
  if (!response.ok) {
    if (response.status === 404) throw new Error('No se encontró esta noticia.');
    if (response.status === 503) {
      throw new Error('El contenido requiere conexión a internet y no está disponible sin conexión.');
    }
    throw new Error(`No se pudo cargar la noticia (${response.status}).`);
  }

  const item = await response.json();
  if (
    !item ||
    typeof item.titulo !== 'string' ||
    typeof item.fecha !== 'string' ||
    typeof item.img !== 'string' ||
    typeof item.descripcion !== 'string' ||
    (item.link !== undefined && typeof item.link !== 'string') ||
    (item.contenido !== undefined && typeof item.contenido !== 'string')
  ) {
    throw new Error('El archivo de la noticia tiene un formato inválido.');
  }
  renderNews(item);
}

document.getElementById('menuToggle').addEventListener('click', () => {
  const menu = document.getElementById('sectionMenu');
  const isOpen = menu.classList.toggle('open');
  document.getElementById('menuToggle').setAttribute('aria-expanded', String(isOpen));
});

shareToggle.addEventListener('click', () => {
  setShareMenuOpen(shareMenu.hidden);
  if (!shareMenu.hidden) shareMenu.querySelector('a, button')?.focus();
});

commentsToggle.addEventListener('click', () => {
  setCommentsOpen(commentsSection.hidden);
});

commentsForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (commentsForm.elements.namedItem('website').value) return;

  const text = commentTextInput.value.trim();
  if (!text) {
    commentsStatus.textContent = 'Escribe un comentario antes de publicarlo.';
    commentTextInput.focus();
    return;
  }
  if (!currentNewsItem) {
    commentsStatus.textContent = 'Espera a que termine de cargar la noticia para comentar.';
    return;
  }

  const comment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: commentNameInput.value.trim(),
    text,
    createdAt: new Date().toISOString(),
    emailSent: false
  };
  try {
    const comments = readComments();
    comments.push(comment);
    saveComments(comments);
    renderComments();
    commentNameInput.value = '';
    commentTextInput.value = '';
    commentsStatus.textContent = 'Comentario guardado en este navegador. Enviando al correo...';
    await retryCommentEmail(comment.id, currentNewsItem, commentSubmit);
  } catch (error) {
    console.error('No se pudo guardar el comentario en este navegador.', error);
    commentsStatus.textContent = 'No se pudo guardar el comentario en este navegador. Revisa el almacenamiento y vuelve a intentarlo.';
  }
});

commentsList.addEventListener('click', event => {
  const button = event.target.closest('button[data-comment-id]');
  if (button && currentNewsItem) {
    retryCommentEmail(button.dataset.commentId, currentNewsItem, button);
  }
});

shareMenu.addEventListener('click', event => {
  if (event.target.closest('a')) setShareMenuOpen(false);
});

document.addEventListener('click', event => {
  const menu = document.getElementById('sectionMenu');
  const toggle = document.getElementById('menuToggle');
  if (menu.classList.contains('open') && !menu.contains(event.target) && !toggle.contains(event.target)) {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  if (!shareSection.contains(event.target)) setShareMenuOpen(false);
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !shareMenu.hidden) {
    setShareMenuOpen(false);
    shareToggle.focus();
  }
});

document.getElementById('nativeShareButton').addEventListener('click', async () => {
  if (!navigator.share) {
    shareStatus.textContent = 'Tu navegador no admite el menú nativo para compartir. Usa uno de los enlaces o copia la dirección.';
    return;
  }

  try {
    await navigator.share({
      title: document.title,
      text: document.querySelector('#newsArticle h1')?.textContent
        ? `${document.querySelector('#newsArticle h1').textContent}\n\n${document.querySelector('#newsArticle p')?.textContent || ''}`
        : '',
      url: window.location.href
    });
    shareStatus.textContent = '';
    setShareMenuOpen(false);
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error(error);
      shareStatus.textContent = 'No se pudo compartir la noticia desde este dispositivo.';
    }
  }
});

document.getElementById('copyNewsLink').addEventListener('click', async () => {
  try {
    const shareUrl = window.location.href;
    await navigator.clipboard.writeText(shareUrl);
    shareStatus.textContent = 'Enlace de esta noticia copiado.';
    setShareMenuOpen(false);
  } catch (error) {
    console.error(error);
    shareStatus.textContent = 'No se pudo copiar el enlace. Puedes copiarlo desde la barra de direcciones.';
  }
});

document.getElementById('shareInstagram').addEventListener('click', async () => {
  try {
    const title = document.querySelector('#newsArticle h1')?.textContent || '';
    const description = document.querySelector('#newsArticle p')?.textContent || '';
    const shareUrl = window.location.href;
    await navigator.clipboard.writeText(`${title}\n\n${description}\n\n${shareUrl}`);
    shareStatus.textContent = 'Título, descripción y enlace copiados. Pégalos en Instagram.';
    setShareMenuOpen(false);
  } catch (error) {
    console.error(error);
    shareStatus.textContent = 'No se pudo copiar el enlace para Instagram. Puedes copiarlo desde la barra de direcciones.';
  }
});

loadNews().catch(error => {
  console.error(error);
  status.textContent = error.message || 'No se pudo cargar la noticia.';
  if (!status.isConnected) article.replaceChildren(status);
});
