const desktopNoticeScript = document.currentScript;
const desktopAppRoot = new URL('../', desktopNoticeScript.src);
const desktopNoticeStyles = document.createElement('link');
desktopNoticeStyles.rel = 'stylesheet';
desktopNoticeStyles.href = new URL('style/desktop-notice.css?v=2', desktopAppRoot).href;
document.head.appendChild(desktopNoticeStyles);

function createDesktopNotice() {
  const template = document.createElement('template');
  template.innerHTML = `
    <dialog class="desktop-notice" id="desktopNotice" aria-labelledby="desktopNoticeTitle" aria-describedby="desktopNoticeDescription" tabindex="-1">
      <button class="desktop-notice-share" id="desktopNoticeShare" type="button" aria-label="Compartir LearnCPNB">
        <svg class="desktop-notice-share-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle>
          <path d="m8.7 10.6 6.6-4.2m-6.6 7 6.6 4.2"></path>
        </svg>
        <span>Compartir</span>
      </button>
      <p class="desktop-notice-share-status" id="desktopNoticeShareStatus" role="status" aria-live="polite"></p>
      <div class="desktop-notice-card">
        <img class="desktop-notice-logo" data-desktop-asset="icon.png" alt="">
        <p class="desktop-notice-eyebrow">LearnCPNB</p>
        <h2 id="desktopNoticeTitle">No disponible en DESKTOP</h2>
        <p id="desktopNoticeDescription">LearnCPNB no está disponible para navegadores de escritorio.</p>
        <nav class="desktop-social-links" aria-label="Redes sociales">
          <a href="https://www.instagram.com/polarhackeo/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle>
              <circle cx="17.5" cy="6.8" r="0.8" class="desktop-social-icon-fill"></circle>
            </svg>
          </a>
          <a href="https://x.com/informaticon01" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M18.9 3H22l-6.8 7.8L23.2 21h-6.3L12 14.8 6.1 21H3l7.3-8.4L2.8 3h6.5l4.5 5.9L18.9 3Zm-1.1 16h1.7L8.3 4.9H6.5L17.8 19Z"></path>
            </svg>
          </a>
          <a href="https://www.tiktok.com/@deniscapote" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M19.6 8.2a7.1 7.1 0 0 1-4.4-1.5v7.1a5.8 5.8 0 1 1-5-5.7v3.7a2.2 2.2 0 1 0 1.5 2.1V2.5h3.5c.2 2 1.8 3.6 4.4 3.8v1.9Z"></path>
            </svg>
          </a>
        </nav>
        <section class="desktop-section-previews" aria-labelledby="desktopPreviewsTitle">
          <div class="desktop-previews-heading">
            <p class="desktop-notice-eyebrow">Vista previa</p><h3 id="desktopPreviewsTitle">Secciones de la app</h3>
          </div>
          <div class="desktop-preview-grid">
            <figure class="desktop-preview">
              <img class="desktop-preview-image" data-desktop-asset="assets/app-preview-news.png" alt="Captura real de la sección de noticias de LearnCPNB" loading="lazy">
              <figcaption>Noticias</figcaption>
            </figure>
            <figure class="desktop-preview">
              <img class="desktop-preview-image" data-desktop-asset="assets/app-preview-laws.png" alt="Captura real de la sección de leyes y gacetas oficiales" loading="lazy">
              <figcaption>Leyes oficiales</figcaption>
            </figure>
            <figure class="desktop-preview">
              <img class="desktop-preview-image" data-desktop-asset="assets/app-preview-function.png" alt="Captura real de la sección de función policial con su menú abierto" loading="lazy">
              <figcaption>Función policial</figcaption>
            </figure>
          </div>
        </section>
        <section class="desktop-about" aria-labelledby="desktopAboutTitle">
          <div class="desktop-about-copy">
            <p class="desktop-notice-eyebrow">Al servicio policial</p>
            <h3 id="desktopAboutTitle">Una herramienta de apoyo para el oficial</h3>
            <p>LearnCPNB reúne recursos de consulta que pueden acompañar a las y los oficiales recién egresados de la UNES en el inicio de su labor policial. Desde un enfoque de servicio, respeto a los derechos humanos y apego a la ley, la app facilita el acceso a gacetas, materiales de referencia y herramientas prácticas para reforzar lo aprendido en Ciencias Policiales. Su contenido es de apoyo y no sustituye la formación, los protocolos institucionales ni las instrucciones de los superiores.</p>
          </div>
          <img class="desktop-about-logo" data-desktop-asset="assets/cpnb-emblem.png" alt="Emblema de la Policía Nacional Bolivariana, Venezuela renace" loading="lazy">
        </section>
        <footer class="desktop-notice-footer"><p>&copy; CPNB. Proteger, Defender y Servir a nuestro pueblo.</p></footer>
      </div>
    </dialog>
  `;
  document.body.appendChild(template.content);

  const notice = document.getElementById('desktopNotice');
  notice.querySelectorAll('[data-desktop-asset]').forEach(image => {
    image.src = new URL(image.dataset.desktopAsset, desktopAppRoot).href;
  });
  return notice;
}

const desktopNotice = document.getElementById('desktopNotice') || createDesktopNotice();
const desktopNoticeShare = document.getElementById('desktopNoticeShare');
const desktopNoticeShareStatus = document.getElementById('desktopNoticeShareStatus');
const desktopViewport = window.matchMedia('(min-width: 768px)');
let desktopShareStatusTimeout;

function showDesktopShareStatus(message) {
  desktopNoticeShareStatus.textContent = message;
  window.clearTimeout(desktopShareStatusTimeout);
  desktopShareStatusTimeout = window.setTimeout(() => {
    desktopNoticeShareStatus.textContent = '';
  }, 4000);
}

desktopNoticeShare.addEventListener('click', async () => {
  const title = document.querySelector('meta[property="og:title"]')?.content || document.title;
  const description = document.querySelector('meta[property="og:description"]')?.content
    || document.querySelector('meta[name="description"]')?.content
    || '';
  const url = document.querySelector('meta[property="og:url"]')?.content || window.location.href;

  if (navigator.share) {
    try {
      await navigator.share({ title, text: description, url });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('No se pudo compartir LearnCPNB.', error);
        showDesktopShareStatus('No se pudo compartir el enlace. Inténtalo de nuevo.');
      }
    }
    return;
  }

  try {
    await navigator.clipboard.writeText(`${description}\n${url}`);
    showDesktopShareStatus('Descripción y enlace copiados.');
  } catch (error) {
    console.error('No se pudo copiar el enlace de LearnCPNB.', error);
    showDesktopShareStatus('No se pudo copiar el enlace desde este navegador.');
  }
});

function updateDesktopNotice() {
  if (desktopViewport.matches && !desktopNotice.open) {
    desktopNotice.showModal();
  } else if (!desktopViewport.matches && desktopNotice.open) {
    desktopNotice.close();
  }
}

desktopNotice.addEventListener('cancel', event => event.preventDefault());
desktopNoticeStyles.addEventListener('load', updateDesktopNotice, { once: true });
desktopNoticeStyles.addEventListener('error', () => {
  console.error('No se pudieron cargar los estilos del aviso de escritorio.');
  updateDesktopNotice();
}, { once: true });
desktopViewport.addEventListener('change', updateDesktopNotice);
window.addEventListener('resize', updateDesktopNotice);
updateDesktopNotice();
