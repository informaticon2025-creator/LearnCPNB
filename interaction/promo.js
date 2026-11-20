const promoContent = document.getElementById('promoContent');
document.body.classList.add('promo-page');
let promoFeedbackTimeout;
let promoFeedbackElement;
const completedPromosStorageKey = 'learncpnb-completed-promos-v2';
const practiceLivesStorageKey = 'learncpnb-practice-lives';
const maxPracticeLives = 5;
const practiceCooldownMs = 24 * 60 * 60 * 1000;

function savePracticeLifeState(state) {
  localStorage.setItem(practiceLivesStorageKey, JSON.stringify(state));
}

function getPracticeLifeState() {
  const saved = localStorage.getItem(practiceLivesStorageKey);
  if (!saved) return { lives: maxPracticeLives, cooldownUntil: null };

  const state = JSON.parse(saved);
  if (
    !state ||
    !Number.isInteger(state.lives) ||
    state.lives < 0 ||
    state.lives > maxPracticeLives ||
    (state.lives === 0 && state.cooldownUntil === null) ||
    (state.lives > 0 && state.cooldownUntil !== null) ||
    (state.cooldownUntil !== null &&
      (!Number.isSafeInteger(state.cooldownUntil) || state.cooldownUntil < 0))
  ) {
    throw new Error('El registro de vidas de práctica no es válido.');
  }
  if (state.cooldownUntil !== null && state.cooldownUntil <= Date.now()) {
    const restoredState = { lives: maxPracticeLives, cooldownUntil: null };
    savePracticeLifeState(restoredState);
    return restoredState;
  }
  return state;
}

function updateLifeMeter(state) {
  const indicator = document.getElementById('practiceLivesIndicator');
  const count = document.getElementById('practiceLivesCount');
  if (!indicator || !count) return;
  count.textContent = `${state.lives}/${maxPracticeLives}`;
  indicator.setAttribute('aria-label', `Vidas: ${state.lives} de ${maxPracticeLives}`);
}

function losePracticeLife() {
  const state = getPracticeLifeState();
  if (state.cooldownUntil !== null) return state;
  state.lives = Math.max(0, state.lives - 1);
  if (state.lives === 0) state.cooldownUntil = Date.now() + practiceCooldownMs;
  savePracticeLifeState(state);
  updateLifeMeter(state);
  return state;
}

function getLifeLossMessage(state) {
  if (state.lives === 0) {
    return 'Perdiste tus 5 vidas. Ponte a investigar en Material de función policial. Podrás volver a jugar en 24 horas.';
  }
  return `Te queda${state.lives === 1 ? '' : 'n'} ${state.lives} ${state.lives === 1 ? 'vida' : 'vidas'}.`;
}

function redirectToFunctionMaterial(cooldownUntil) {
  const url = new URL('index.html', document.baseURI);
  url.searchParams.set('view', 'function');
  url.searchParams.set('material', '1');
  url.searchParams.set('exhausted', '1');
  url.searchParams.set('until', String(cooldownUntil));
  window.location.replace(url.href);
}

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

function createPracticeComments(practiceKey) {
  const storageKey = `learncpnb-practice-comments-${practiceKey}`;
  const readComments = () => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return [];
    const comments = JSON.parse(saved);
    if (!Array.isArray(comments) || comments.some(comment =>
      !comment ||
      typeof comment.id !== 'string' ||
      typeof comment.name !== 'string' ||
      typeof comment.text !== 'string' ||
      typeof comment.createdAt !== 'string'
    )) throw new Error('El formato de los comentarios de práctica no es válido.');
    return comments;
  };

  const section = createPromoElement('section', 'practice-comments');
  section.append(
    createPromoElement('h2', 'practice-comments-title', 'Opinión sobre la práctica'),
    createPromoElement('p', 'practice-comments-description', 'Comparte tu opinión sobre esta actividad.')
  );

  const list = createPromoElement('div', 'practice-comments-list');
  list.setAttribute('aria-label', 'Comentarios de la práctica');
  const status = createPromoElement('p', 'practice-comments-status');
  status.setAttribute('role', 'status');

  const render = () => {
    const comments = readComments();
    list.replaceChildren();
    if (!comments.length) {
      list.appendChild(createPromoElement('p', 'practice-comments-empty', 'Todavía no hay comentarios.'));
      return;
    }
    comments.slice().reverse().forEach(comment => {
      const item = createPromoElement('article', 'practice-comment');
      const header = createPromoElement('div', 'practice-comment-header');
      header.appendChild(createPromoElement('strong', '', comment.name || 'Anónimo'));
      const date = createPromoElement('time', '', new Date(comment.createdAt).toLocaleString('es-VE'));
      date.dateTime = comment.createdAt;
      header.appendChild(date);
      item.append(header, createPromoElement('p', 'practice-comment-text', comment.text));
      list.appendChild(item);
    });
  };

  const form = document.createElement('form');
  form.className = 'practice-comments-form';
  const nameLabel = createPromoElement('label', 'practice-comment-field');
  nameLabel.append(document.createTextNode('Nombre'));
  const nameInput = document.createElement('input');
  nameInput.className = 'practice-comment-input';
  nameInput.name = 'name';
  nameInput.type = 'text';
  nameInput.maxLength = 80;
  nameInput.autocomplete = 'name';
  nameInput.placeholder = 'Anónimo';
  nameLabel.appendChild(nameInput);

  const textLabel = createPromoElement('label', 'practice-comment-field');
  textLabel.append(document.createTextNode('Comentario'));
  const textInput = document.createElement('textarea');
  textInput.className = 'practice-comment-input practice-comment-textarea';
  textInput.name = 'comment';
  textInput.rows = 3;
  textInput.maxLength = 3000;
  textInput.required = true;
  textLabel.appendChild(textInput);

  const submit = createPromoElement('button', 'practice-comment-submit');
  submit.type = 'submit';
  submit.setAttribute('aria-label', 'Enviar comentario');
  submit.title = 'Enviar comentario';
  submit.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M22 2 9.8 14.2M22 2l-7.6 20-4.6-7.8L2 9.6 22 2Z"></path></svg>';

  form.append(nameLabel, textLabel, submit);
  form.onsubmit = event => {
    event.preventDefault();
    const text = textInput.value.trim();
    if (!text) {
      status.textContent = 'Escribe un comentario antes de enviarlo.';
      textInput.focus();
      return;
    }
    const comment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: nameInput.value.trim(),
      text,
      createdAt: new Date().toISOString()
    };
    try {
      const comments = readComments();
      comments.push(comment);
      localStorage.setItem(storageKey, JSON.stringify(comments));
      nameInput.value = '';
      textInput.value = '';
      status.textContent = 'Comentario publicado.';
      render();
    } catch (error) {
      console.error('No se pudo guardar el comentario de práctica.', error);
      status.textContent = 'No se pudo guardar el comentario.';
    }
  };

  section.append(status, list, form);
  render();
  return section;
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

function shufflePromoItems(items) {
  const shuffled = items.slice();
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function showQuizFeedback(isCorrect, onDismiss, detail, message) {
  window.clearTimeout(promoFeedbackTimeout);
  promoFeedbackElement?.remove();

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
    createPromoElement(
      'p',
      'promo-feedback-message',
      message || (isCorrect ? '¡Correcto!' : 'Respuesta incorrecta')
    ),
    ...(!isCorrect
      ? [createPromoElement('p', 'promo-feedback-hint', detail || 'Inténtalo de nuevo.')]
      : detail ? [createPromoElement('p', 'promo-feedback-hint', detail)] : [])
  );
  backdrop.appendChild(card);
  document.body.appendChild(backdrop);
  promoFeedbackElement = backdrop;

  promoFeedbackTimeout = window.setTimeout(() => {
    backdrop.remove();
    promoFeedbackElement = undefined;
    promoFeedbackTimeout = undefined;
    if (onDismiss) onDismiss();
  }, detail ? 3000 : 1500);
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

function renderQuizBlock(block, section, blockIndex, nextPromoId, onComplete, completionContext) {
  if (!Array.isArray(block.preguntas) || !block.preguntas.length) {
    throw new Error(`El cuestionario ${blockIndex + 1} debe tener al menos una pregunta.`);
  }
  const form = document.createElement('form');
  form.className = 'promo-quiz';

  block.preguntas.forEach((question, questionIndex) => {
    const correctOptions = Array.isArray(question?.opciones)
      ? question.opciones.filter(option => option && option.correcta === true).length
      : 0;
    const isMultipleSelection = correctOptions > 1;
    if (
      !question ||
      typeof question.pregunta !== 'string' ||
      !Array.isArray(question.opciones) ||
      question.opciones.length < 2 ||
      correctOptions < 1 ||
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
    if (isMultipleSelection) {
      fieldset.appendChild(createPromoElement('p', 'promo-quiz-progress', 'Selecciona todas las respuestas correctas.'));
    }

    question.opciones.forEach((option, optionIndex) => {
      const label = createPromoElement('label', 'promo-option');
      const input = document.createElement('input');
      input.type = isMultipleSelection ? 'checkbox' : 'radio';
      input.name = `promo-${blockIndex}-question-${questionIndex}`;
      input.value = String(optionIndex);
      input.required = !isMultipleSelection;
      const optionText = createPromoElement('span', 'promo-option-text', option.texto);
      const selectionMark = createPromoCheckIcon('promo-option-check');
      label.append(input, optionText, selectionMark);
      input.addEventListener('change', () => {
        fieldset.querySelectorAll('.promo-option').forEach(optionLabel => {
          const answerInput = optionLabel.querySelector('input');
          optionLabel.classList.toggle('is-selected', answerInput.checked);
        });
      });
      fieldset.appendChild(label);
    });
    form.appendChild(fieldset);
  });

  const progress = createPromoElement('div', 'promo-lesson-progress');
  const progressLabel = createPromoElement(
    'span',
    'promo-lesson-progress-label',
    `Reto ${blockIndex + 1} · ${block.preguntas.length} ${block.preguntas.length === 1 ? 'pregunta' : 'preguntas'}`
  );
  const progressTrack = createPromoElement('div', 'promo-lesson-progress-track');
  progressTrack.setAttribute('role', 'progressbar');
  progressTrack.setAttribute('aria-label', 'Preguntas respondidas');
  progressTrack.setAttribute('aria-valuemin', '0');
  progressTrack.setAttribute('aria-valuemax', String(block.preguntas.length));
  progressTrack.setAttribute('aria-valuenow', '0');
  const progressFill = createPromoElement('span', 'promo-lesson-progress-fill');
  progressTrack.appendChild(progressFill);
  progress.append(progressLabel, progressTrack);

  const updateProgress = () => {
    const answered = [...form.querySelectorAll('.promo-question')].filter(fieldset =>
      fieldset.querySelector('input:checked')
    ).length;
    progressTrack.setAttribute('aria-valuenow', String(answered));
    progressFill.style.width = `${(answered / block.preguntas.length) * 100}%`;
  };
  form.addEventListener('change', updateProgress);

  const submit = createPromoElement('button', 'promo-action promo-action--icon-only');
  submit.type = 'submit';
  submit.setAttribute('aria-label', 'Verificar respuestas');
  submit.title = 'Verificar respuestas';
  submit.appendChild(createPromoCheckIcon('promo-action-icon'));
  const status = createPromoElement('p', 'promo-quiz-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  form.prepend(progress);
  form.append(submit, status);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const incorrectFieldsets = [];
    const selectedAnswers = [];
    block.preguntas.forEach((question, questionIndex) => {
      const fieldset = form.querySelectorAll('.promo-question')[questionIndex];
      const name = `promo-${blockIndex}-question-${questionIndex}`;
      const correctCount = question.opciones.filter(option => option.correcta).length;
      const selectedOptions = correctCount > 1
        ? formData.getAll(name).map(Number)
        : [Number(formData.get(name))];
      const correct = selectedOptions.length === correctCount &&
        selectedOptions.every(selected => question.opciones[selected]?.correcta);
      selectedOptions.forEach(selected => {
        const selectedInput = fieldset.querySelector(`input[value="${selected}"]`);
        selectedAnswers.push({
          label: selectedInput.closest('.promo-option'),
          correct: question.opciones[selected].correcta
        });
      });
      if (!correct) incorrectFieldsets.push(fieldset);
    });

    if (incorrectFieldsets.length) {
      selectedAnswers.forEach(({ label, correct }) => {
        label.classList.add(correct ? 'is-correct' : 'is-incorrect');
      });
      const state = losePracticeLife();
      const onDismiss = state.lives === 0
        ? () => redirectToFunctionMaterial(state.cooldownUntil)
        : () => {
            incorrectFieldsets.forEach(fieldset => {
              fieldset.querySelectorAll('.promo-option').forEach(optionLabel => {
                const input = optionLabel.querySelector('input');
                input.checked = false;
                optionLabel.classList.remove('is-selected', 'is-incorrect', 'is-correct');
              });
            });
          };
      showQuizFeedback(false, onDismiss, getLifeLossMessage(state));
      return;
    }

    selectedAnswers.forEach(({ label }) => label.classList.add('is-correct'));
    submit.disabled = true;
    const activityCompleted = onComplete();
    const sectionCompleted = activityCompleted && completionContext.isLastActivity;
    showQuizFeedback(true, () => {
      if (activityCompleted) {
        if (sectionCompleted) {
          const catalogUrl = new URL('index.html', document.baseURI);
          catalogUrl.searchParams.set('view', 'function');
          catalogUrl.searchParams.set('promos', '1');
          catalogUrl.searchParams.set('section', completionContext.sectionName);
          window.location.assign(catalogUrl.href);
        } else {
          loadNextPromo(nextPromoId).catch(error => {
            console.error('No se pudo cargar la siguiente actividad.', error);
            promoContent.replaceChildren(createPromoElement('p', 'content-status', error.message));
          });
        }
      }
    }, sectionCompleted ? 'Has completado todas las actividades de esta sección.' : undefined,
    sectionCompleted ? `¡Completaste ${completionContext.sectionName}!` : undefined);
    status.textContent = `Resultado: ${block.preguntas.length} de ${block.preguntas.length} respuestas correctas.`;
  });

  section.appendChild(form);
}

function renderContentBlock(block, index, nextPromoId, onQuizComplete, completionContext) {
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
      renderQuizBlock(block, section, index, nextPromoId, onQuizComplete, completionContext);
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
  const params = new URLSearchParams(window.location.search);
  const sectionName = params.get('sectionName');
  const sectionIdsValue = params.get('sectionIds');
  const sectionIds = sectionIdsValue === null
    ? null
    : sectionIdsValue.split(',').map(value => Number(value));
  if (
    (sectionName !== null && (!sectionName.trim() || sectionName.length > 80)) ||
    (sectionIds !== null &&
      (!sectionIds.length ||
        sectionIds.some(id => !Number.isSafeInteger(id) || id < 1 || id > 999) ||
        new Set(sectionIds).size !== sectionIds.length ||
        !sectionIds.includes(promoId)))
  ) {
    throw new Error('El orden de actividades de esta sección no es válido.');
  }
  const sectionIndex = sectionIds?.indexOf(promoId) ?? -1;
  const nextPromoId = sectionIds
    ? sectionIds[sectionIndex + 1] ?? null
    : promo.siguiente === undefined ? promoId + 1 : promo.siguiente;
  if (
    nextPromoId !== null &&
    (!Number.isSafeInteger(nextPromoId) || nextPromoId < 1 || nextPromoId > 999)
  ) {
    throw new Error('El enlace a la siguiente actividad no es válido.');
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
  const completionContext = {
    isLastActivity: Boolean(sectionIds && sectionName && nextPromoId === null),
    sectionName
  };
  const onQuizComplete = blockIndex => {
    completedQuizBlocks.add(blockIndex);
    if (completedQuizBlocks.size !== quizBlocks.length) return false;
    markPromoCompleted(promoId);
    return true;
  };
  const sections = (promo.contenido || []).map((block, index) =>
    renderContentBlock(block, index, nextPromoId, onQuizComplete, completionContext)
  );
  promoContent.replaceChildren(
    heading,
    ...sections,
    createPracticeComments(`actividad-${promoId}`)
  );
}

async function loadKeyPracticeEntries() {
  const response = await fetch('file/funcion/fuc_02.json');
  if (!response.ok) {
    throw new Error(`No se pudo cargar el material de claves (${response.status}).`);
  }
  const resource = await response.json();
  if (!resource || !Array.isArray(resource.categoria)) {
    throw new Error('El material de claves no tiene un formato válido.');
  }

  const entries = resource.categoria.flatMap(category => {
    if (
      !category ||
      typeof category.nombre !== 'string' ||
      !Array.isArray(category.subcategorias)
    ) {
      throw new Error('Una categoría del material de claves no tiene un formato válido.');
    }
    return category.subcategorias.flatMap(subcategory => {
      if (!subcategory || !Array.isArray(subcategory.articulos)) {
        throw new Error(`La categoría ${category.nombre} contiene datos de claves inválidos.`);
      }
      return subcategory.articulos
        .filter(article =>
          article &&
          typeof article.numART === 'string' &&
          article.numART.trim() &&
          typeof article.tituloART === 'string' &&
          article.tituloART.trim()
        )
        .map(article => ({
          category: category.nombre.trim(),
          number: article.numART.trim(),
          meaning: article.tituloART.trim()
        }));
    });
  });
  if (entries.length < 4) {
    throw new Error('No hay suficientes claves para preparar la práctica.');
  }
  return entries;
}

function createKeyPracticeQuestionPool(entries) {
  const countBy = selector => {
    const counts = new Map();
    entries.forEach(entry => {
      const value = selector(entry);
      counts.set(value, (counts.get(value) || 0) + 1);
    });
    return counts;
  };
  const meaningCounts = countBy(entry => entry.meaning);
  const categoryMeaningCounts = countBy(entry => `${entry.category}\0${entry.meaning}`);
  const categoryNumberCounts = countBy(entry => `${entry.category}\0${entry.number}`);
  const uniqueMeanings = entries.filter(entry =>
    meaningCounts.get(entry.meaning) === 1 &&
    categoryNumberCounts.get(`${entry.category}\0${entry.number}`) === 1
  );
  const uniqueCategoryMeanings = entries.filter(entry =>
    categoryMeaningCounts.get(`${entry.category}\0${entry.meaning}`) === 1 &&
    categoryNumberCounts.get(`${entry.category}\0${entry.number}`) === 1
  );
  const questions = [];

  function addQuestions(mode, targets, optionEntries) {
    targets.forEach(target => {
      const answer = mode === 'meaning'
        ? target.meaning
        : mode === 'code'
          ? `${target.category} ${target.number}`
          : target.number;
      const getLabel = entry => mode === 'meaning'
        ? entry.meaning
        : mode === 'code'
          ? `${entry.category} ${entry.number}`
          : entry.number;
      const optionsByLabel = new Map();
      optionEntries.forEach(entry => {
        const label = getLabel(entry);
        if (!optionsByLabel.has(label)) {
          optionsByLabel.set(label, { texto: label, correcta: label === answer });
        }
      });
      const correctOption = optionsByLabel.get(answer);
      const distractors = shufflePromoItems(
        Array.from(optionsByLabel.values()).filter(option => !option.correcta)
      ).slice(0, 3);
      if (!correctOption || distractors.length < 3) return;

      questions.push({
        pregunta: mode === 'meaning'
          ? `¿Qué significa ${target.category} ${target.number}?`
          : mode === 'code'
            ? `¿Qué clave corresponde a «${target.meaning}»?`
            : `Completa: ${target.category} ____ = «${target.meaning}».`,
        opciones: shufflePromoItems([...distractors, correctOption]),
        explicacion: `${target.category} ${target.number} significa «${target.meaning}».`
      });
    });
  }

  addQuestions('meaning', uniqueMeanings, uniqueMeanings);
  addQuestions('code', uniqueMeanings, entries);
  entries.forEach(target => {
    addQuestions(
      'number',
      uniqueCategoryMeanings.includes(target) ? [target] : [],
      entries.filter(entry => entry.category === target.category)
    );
  });

  if (!questions.length) {
    throw new Error('No se pudieron preparar preguntas de claves con respuestas válidas.');
  }
  return shufflePromoItems(questions);
}

function renderKeyPracticePage(entries) {
  document.title = 'Práctica de claves policiales | Tu learn | CPNB';
  const heading = createPromoElement('div', 'promo-heading');
  heading.append(
    createPromoElement('h1', '', 'Práctica de claves policiales'),
    createPromoElement('p', '', 'Recuerda las claves y sus significados. Cada pregunta aparece en un orden aleatorio.')
  );

  const section = createPromoElement('section', 'promo-section promo-section--quiz');
  section.appendChild(createPromoElement('h2', 'promo-section-title', 'Responde y practica'));
  const form = document.createElement('form');
  form.className = 'promo-quiz';
  section.appendChild(form);
  let questionPool = createKeyPracticeQuestionPool(entries);
  let questionNumber = 0;
  let previousQuestion;
  let currentQuestion;

  function showQuestion(question) {
    currentQuestion = question || questionPool.shift();
    if (!currentQuestion) {
      questionPool = createKeyPracticeQuestionPool(entries);
      currentQuestion = questionPool.shift();
      if (currentQuestion.pregunta === previousQuestion && questionPool.length) {
        questionPool.push(currentQuestion);
        currentQuestion = questionPool.shift();
      }
    }
    form.replaceChildren();
    form.appendChild(createPromoElement('p', 'promo-quiz-progress', `Pregunta ${questionNumber + 1}`));
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'promo-question';
    fieldset.appendChild(createPromoElement('legend', '', currentQuestion.pregunta));
    currentQuestion.opciones.forEach((option, index) => {
      const label = createPromoElement('label', 'promo-option');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'key-practice-answer';
      input.value = String(index);
      input.required = true;
      const text = createPromoElement('span', 'promo-option-text', option.texto);
      label.append(input, text, createPromoCheckIcon('promo-option-check'));
      input.addEventListener('change', () => {
        fieldset.querySelectorAll('.promo-option').forEach(optionLabel => {
          optionLabel.classList.toggle(
            'is-selected',
            optionLabel.querySelector('input[type="radio"]').checked
          );
        });
      });
      fieldset.appendChild(label);
    });
    const submit = createPromoElement('button', 'promo-action promo-action--icon-only');
    submit.type = 'submit';
    submit.setAttribute('aria-label', 'Verificar respuesta');
    submit.title = 'Verificar respuesta';
    submit.appendChild(createPromoCheckIcon('promo-action-icon'));
    const status = createPromoElement('p', 'promo-quiz-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    form.append(fieldset, submit, status);
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const selected = Number(new FormData(form).get('key-practice-answer'));
    const option = currentQuestion.opciones[selected];
    const selectedLabel = form.querySelectorAll('.promo-option')[selected];
    if (!option.correcta) {
      selectedLabel.classList.add('is-incorrect');
      const state = losePracticeLife();
      showQuizFeedback(
        false,
        state.lives === 0
          ? () => redirectToFunctionMaterial(state.cooldownUntil)
          : () => showQuestion(currentQuestion),
        getLifeLossMessage(state)
      );
      return;
    }

    selectedLabel.classList.add('is-correct');
    form.querySelector('button[type="submit"]').disabled = true;
    const completedQuestion = currentQuestion;
    showQuizFeedback(true, () => {
      questionNumber += 1;
      previousQuestion = completedQuestion.pregunta;
      showQuestion();
    }, completedQuestion.explicacion);
  });

  showQuestion();
  promoContent.replaceChildren(
    heading,
    section,
    createPracticeComments('claves')
  );
}

async function loadPromo() {
  const lifeState = getPracticeLifeState();
  if (lifeState.cooldownUntil !== null) {
    redirectToFunctionMaterial(lifeState.cooldownUntil);
    return;
  }
  updateLifeMeter(lifeState);
  window.addEventListener('storage', event => {
    if (event.key === practiceLivesStorageKey) {
      updateLifeMeter(getPracticeLifeState());
    }
  });

  const params = new URLSearchParams(window.location.search);
  if (params.get('practice') === 'keys') {
    renderKeyPracticePage(await loadKeyPracticeEntries());
    return;
  }

  const id = Number(params.get('id') || 1);
  if (!Number.isSafeInteger(id) || id < 1 || id > 999) {
    throw new Error('El enlace de la actividad no es válido.');
  }
  if (getCompletedPromoIds().includes(id)) {
    window.location.replace('index.html?view=function&promos=1');
    return;
  }
  const sectionIdsValue = params.get('sectionIds');
  if (sectionIdsValue !== null) {
    const sectionIds = sectionIdsValue.split(',').map(value => Number(value));
    const sectionName = params.get('sectionName');
    if (
      !sectionName ||
      !sectionName.trim() ||
      sectionName.length > 80 ||
      !sectionIds.length ||
      sectionIds.some(sectionId => !Number.isSafeInteger(sectionId) || sectionId < 1 || sectionId > 999) ||
      new Set(sectionIds).size !== sectionIds.length ||
      !sectionIds.includes(id)
    ) {
      throw new Error('El orden de actividades de esta sección no es válido.');
    }

    const completedPromoIds = getCompletedPromoIds();
    const firstIncompleteId = sectionIds.find(sectionId => !completedPromoIds.includes(sectionId));
    if (firstIncompleteId !== undefined && firstIncompleteId !== id) {
      const nextUrl = new URL('page/promo.html', document.baseURI);
      nextUrl.searchParams.set('id', String(firstIncompleteId));
      nextUrl.searchParams.set('sectionIds', sectionIds.join(','));
      nextUrl.searchParams.set('sectionName', sectionName);
      window.location.replace(nextUrl.href);
      return;
    }
    if (firstIncompleteId === undefined) {
      const catalogUrl = new URL('index.html', document.baseURI);
      catalogUrl.searchParams.set('view', 'function');
      catalogUrl.searchParams.set('promos', '1');
      catalogUrl.searchParams.set('section', sectionName);
      window.location.replace(catalogUrl.href);
      return;
    }
  }

  const filename = new URL(
    `file/news/promo_${String(id).padStart(2, '0')}.json`,
    document.baseURI
  );
  const response = await fetch(filename);
  if (!response.ok) throw new Error(`No se pudo cargar la actividad (${response.status}).`);
  await renderPromo(await response.json(), id);
}

async function loadNextPromo(nextPromoId) {
  if (nextPromoId === null) {
    window.location.assign('index.html?view=function&promos=1');
    return;
  }

  if (!Number.isSafeInteger(nextPromoId) || nextPromoId < 1 || nextPromoId > 999) {
    throw new Error('El enlace a la siguiente actividad no es válido.');
  }
  const nextUrl = new URL('page/promo.html', document.baseURI);
  const params = new URLSearchParams(window.location.search);
  params.set('id', String(nextPromoId));
  nextUrl.search = params.toString();
  window.location.assign(nextUrl.href);
}

loadPromo().catch(error => {
  console.error('No se pudo mostrar la actividad.', error);
  promoContent.replaceChildren(createPromoElement('p', 'content-status', error.message));
});
