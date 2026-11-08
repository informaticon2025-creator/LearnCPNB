const promoContent = document.getElementById('promoContent');
document.body.classList.add('promo-page');
let promoFeedbackTimeout;
const completedPromosStorageKey = 'learncpnb-completed-promos';

function getCompletedPromoIds() {
  const saved = localStorage.getItem(completedPromosStorageKey);
  if (!saved) return [];

  const ids = JSON.parse(saved);
  if (!Array.isArray(ids) || ids.some(id => !Number.isSafeInteger(id) || id < 1 || id > 999)) {
    throw new Error('El registro de actividades completadas no es válido.');
  }
  return ids;
}

function markPromoCompleted(promoId) {
  const completedIds = getCompletedPromoIds();
  if (!completedIds.includes(promoId)) {
    completedIds.push(promoId);
    localStorage.setItem(completedPromosStorageKey, JSON.stringify(completedIds));
  }
}

function createPromoElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function createPromoCheckIcon(className) {
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.classList.add(className);
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('focusable', 'false');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'm5 12 4 4L19 6');
  icon.appendChild(path);
  return icon;
}

function showQuizFeedback(isCorrect, onDismiss) {
  const backdrop = createPromoElement(
    'div',
    `promo-feedback-backdrop ${isCorrect ? 'promo-feedback-backdrop--correct' : 'promo-feedback-backdrop--incorrect'}`
  );
  backdrop.setAttribute('role', 'alert');
  backdrop.setAttribute('aria-live', 'assertive');
  backdrop.setAttribute('aria-atomic', 'true');

  const card = createPromoElement('div', 'promo-feedback-card');
  const icon = isCorrect
    ? createPromoCheckIcon('promo-feedback-icon')
    : createPromoElement('span', 'promo-feedback-icon', '!');
  if (!isCorrect) icon.setAttribute('aria-hidden', 'true');
  card.append(
    icon,
    createPromoElement('p', 'promo-feedback-message', isCorrect ? '¡Correcto!' : 'Respuesta incorrecta'),
    ...(!isCorrect ? [createPromoElement('p', 'promo-feedback-hint', 'Inténtalo de nuevo.')] : [])
  );
  backdrop.appendChild(card);
  document.body.appendChild(backdrop);

  window.clearTimeout(promoFeedbackTimeout);
  promoFeedbackTimeout = window.setTimeout(() => {
    backdrop.remove();
    promoFeedbackTimeout = undefined;
    if (onDismiss) onDismiss();
  }, 1500);
}

function promoUrl(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Falta el enlace de ${label}.`);
  }

  try {
    const url = new URL(value, document.baseURI);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
    return url;
  } catch {
    throw new Error(`El enlace de ${label} no es válido.`);
  }
}

function appendExternalLink(container, value, label, buttonText = 'Abrir enlace') {
  const url = promoUrl(value, label);
  const link = createPromoElement('a', 'promo-action', buttonText);
  link.href = url.href;
  if (url.origin !== window.location.origin) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  container.appendChild(link);
}

function normalizeVideoUrl(value) {
  const url = promoUrl(value, 'el video');
  if (url.protocol !== 'https:') throw new Error('El video debe usar una dirección HTTPS.');

  if (url.hostname === 'youtu.be') {
    const id = url.pathname.slice(1);
    if (id) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`;
  }
  if (['www.youtube.com', 'youtube.com', 'm.youtube.com'].includes(url.hostname)) {
    const id = url.pathname === '/watch' ? url.searchParams.get('v') : '';
    if (id) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`;
    if (url.pathname.startsWith('/embed/')) return url.href;
  }
  if (url.hostname === 'www.youtube-nocookie.com' && url.pathname.startsWith('/embed/')) {
    return url.href;
  }
  if (url.hostname === 'player.vimeo.com' && url.pathname.startsWith('/video/')) {
    return url.href;
  }
  throw new Error('Usa un enlace de inserción de YouTube o Vimeo para el video.');
}

function renderTextBlock(block, section) {
  if (block.texto) section.appendChild(createPromoElement('p', 'promo-copy', block.texto));
}

function renderImageBlock(block, section) {
  const url = promoUrl(block.url, 'la imagen');
  const image = createPromoElement('img', 'promo-image');
  image.src = url.href;
  image.alt = block.alt || block.titulo || 'Imagen de la actividad';
  image.loading = 'lazy';
  section.appendChild(image);
  renderTextBlock(block, section);
}

function renderVideoBlock(block, section) {
  const frame = document.createElement('iframe');
  frame.className = 'promo-video';
  frame.src = normalizeVideoUrl(block.url);
  frame.title = block.titulo || 'Video de la actividad';
  frame.loading = 'lazy';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  frame.allowFullscreen = true;
  section.appendChild(frame);
  renderTextBlock(block, section);
}

function renderLinkBlock(block, section) {
  renderTextBlock(block, section);
  appendExternalLink(section, block.url, 'el recurso', block.textoBoton || 'Abrir recurso');
}

function renderOfferBlock(block, section) {
  renderTextBlock(block, section);
  if (block.precio) section.appendChild(createPromoElement('p', 'promo-price', block.precio));
  if (block.condiciones) section.appendChild(createPromoElement('p', 'promo-copy', block.condiciones));
  appendExternalLink(section, block.url, 'la promoción', block.textoBoton || 'Ver promoción');
}

function renderQuizBlock(block, section, blockIndex, onComplete) {
  if (!Array.isArray(block.preguntas) || !block.preguntas.length) {
    throw new Error(`El cuestionario ${blockIndex + 1} debe tener al menos una pregunta.`);
  }
  const form = document.createElement('form');
  form.className = 'promo-quiz';

  block.preguntas.forEach((question, questionIndex) => {
    const correctOptions = Array.isArray(question?.opciones)
      ? question.opciones.filter(option => option && option.correcta === true).length
      : 0;
    if (
      !question ||
      typeof question.pregunta !== 'string' ||
      !Array.isArray(question.opciones) ||
      question.opciones.length < 2 ||
      correctOptions !== 1 ||
      question.opciones.some(option =>
        !option ||
        typeof option.texto !== 'string' ||
        typeof option.correcta !== 'boolean'
      )
    ) {
      throw new Error(`La pregunta ${questionIndex + 1} del cuestionario ${blockIndex + 1} tiene datos inválidos.`);
    }

    const fieldset = document.createElement('fieldset');
    fieldset.className = 'promo-question';
    const legend = createPromoElement('legend', '', question.pregunta);
    fieldset.appendChild(legend);

    question.opciones.forEach((option, optionIndex) => {
      const label = createPromoElement('label', 'promo-option');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `promo-${blockIndex}-question-${questionIndex}`;
      input.value = String(optionIndex);
      input.required = true;
      const optionText = createPromoElement('span', 'promo-option-text', option.texto);
      const selectionMark = createPromoCheckIcon('promo-option-check');
      label.append(input, optionText, selectionMark);
      input.addEventListener('change', () => {
        fieldset.querySelectorAll('.promo-option').forEach(optionLabel => {
          const radio = optionLabel.querySelector('input[type="radio"]');
          optionLabel.classList.toggle('is-selected', radio.checked);
        });
      });
      fieldset.appendChild(label);
    });
    form.appendChild(fieldset);
  });

  const submit = createPromoElement('button', 'promo-action promo-action--icon-only');
  submit.type = 'submit';
  submit.setAttribute('aria-label', 'Verificar respuestas');
  submit.title = 'Verificar respuestas';
  submit.appendChild(createPromoCheckIcon('promo-action-icon'));
  const status = createPromoElement('p', 'promo-quiz-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  form.append(submit, status);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    status.textContent = '';
    const formData = new FormData(form);
    const incorrectFieldsets = [];
    const selectedAnswers = [];
    block.preguntas.forEach((question, questionIndex) => {
      const fieldset = form.querySelectorAll('.promo-question')[questionIndex];
      const selected = Number(formData.get(`promo-${blockIndex}-question-${questionIndex}`));
      const selectedInput = fieldset.querySelector(`input[value="${selected}"]`);
      const selectedLabel = selectedInput.closest('.promo-option');
      const correct = question.opciones[selected].correcta;
      selectedAnswers.push({ label: selectedLabel, correct });
      if (!correct) incorrectFieldsets.push(fieldset);
    });

    if (incorrectFieldsets.length) {
      selectedAnswers.forEach(({ label, correct }) => {
        label.classList.add(correct ? 'is-correct' : 'is-incorrect');
      });
      showQuizFeedback(false, () => {
        incorrectFieldsets.forEach(fieldset => {
          fieldset.querySelectorAll('.promo-option').forEach(optionLabel => {
            const input = optionLabel.querySelector('input[type="radio"]');
            input.checked = false;
            optionLabel.classList.remove('is-selected', 'is-incorrect');
          });
        });
      });
      return;
    }

    selectedAnswers.forEach(({ label }) => label.classList.add('is-correct'));
    submit.disabled = true;
    const activityCompleted = onComplete();
    showQuizFeedback(true, () => {
      if (activityCompleted) window.location.assign('index.html');
    });
    status.textContent = `Resultado: ${block.preguntas.length} de ${block.preguntas.length} respuestas correctas.`;
  });
  section.appendChild(form);
}

function renderContentBlock(block, index, onQuizComplete) {
  const supportedTypes = ['texto', 'imagen', 'video', 'enlace', 'promocion', 'quiz'];
  if (!block || !supportedTypes.includes(block.tipo)) {
    throw new Error(`El bloque ${index + 1} tiene un tipo no compatible.`);
  }

  const section = createPromoElement('section', `promo-section promo-section--${block.tipo}`);
  if (block.titulo) section.appendChild(createPromoElement('h2', 'promo-section-title', block.titulo));

  switch (block.tipo) {
    case 'texto':
      renderTextBlock(block, section);
      break;
    case 'imagen':
      renderImageBlock(block, section);
      break;
    case 'video':
      renderVideoBlock(block, section);
      break;
    case 'enlace':
      renderLinkBlock(block, section);
      break;
    case 'promocion':
      renderOfferBlock(block, section);
      break;
    case 'quiz':
      renderQuizBlock(block, section, index, onQuizComplete);
      break;
  }

  return section;
}

function renderPromo(promo, promoId) {
  if (!promo || typeof promo.titulo !== 'string' || typeof promo.descripcion !== 'string') {
    throw new Error('La promoción debe incluir titulo y descripcion.');
  }
  if (promo.contenido !== undefined && !Array.isArray(promo.contenido)) {
    throw new Error('El campo contenido debe ser una lista de bloques.');
  }

  document.title = `${promo.titulo} | Tu learn | CPNB`;
  const heading = createPromoElement('div', 'promo-heading');
  heading.append(
    createPromoElement('h1', '', promo.titulo),
    createPromoElement('p', '', promo.descripcion)
  );
  const quizBlocks = (promo.contenido || [])
    .map((block, index) => block?.tipo === 'quiz' ? index : -1)
    .filter(index => index >= 0);
  const completedQuizBlocks = new Set();
  const onQuizComplete = blockIndex => {
    completedQuizBlocks.add(blockIndex);
    if (completedQuizBlocks.size !== quizBlocks.length) return false;
    markPromoCompleted(promoId);
    return true;
  };
  const sections = (promo.contenido || []).map((block, index) =>
    renderContentBlock(block, index, onQuizComplete)
  );
  promoContent.replaceChildren(heading, ...sections);
}

async function loadPromo() {
  const id = Number(new URLSearchParams(window.location.search).get('id') || 1);
  if (!Number.isSafeInteger(id) || id < 1 || id > 999) {
    throw new Error('El enlace de la actividad no es válido.');
  }
  if (getCompletedPromoIds().includes(id)) {
    window.location.replace('index.html');
    return;
  }

  const filename = new URL(
    `file/news/promo_${String(id).padStart(2, '0')}.json`,
    document.baseURI
  );
  const response = await fetch(filename);
  if (!response.ok) throw new Error(`No se pudo cargar la actividad (${response.status}).`);
  renderPromo(await response.json(), id);
}

loadPromo().catch(error => {
  console.error('No se pudo mostrar la actividad.', error);
  promoContent.replaceChildren(createPromoElement('p', 'content-status', error.message));
});
