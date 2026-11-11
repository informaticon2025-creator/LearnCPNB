const elements = {
  badge: document.getElementById('connectionBadge'),
  connectionPanel: document.querySelector('.connection-panel'),
  token: document.getElementById('tokenInput'),
  connect: document.getElementById('connectButton'),
  disconnect: document.getElementById('disconnectButton'),
  collection: document.getElementById('collectionSelect'),
  resource: document.getElementById('resourceSelect'),
  refresh: document.getElementById('refreshButton'),
  create: document.getElementById('newButton'),
  meta: document.getElementById('fileMeta'),
  fields: document.getElementById('editorFields'),
  form: document.getElementById('editorForm'),
  commit: document.getElementById('commitInput'),
  remove: document.getElementById('deleteButton'),
  save: document.getElementById('saveButton'),
  status: document.getElementById('statusOutput')
};

let resources = [];
let currentResource = null;
let connected = false;
let isCreating = false;
let editorData = null;

const fieldLabels = {
  titulo: 'Título',
  subtitulo: 'Subtítulo',
  descripcion: 'Descripción',
  fecha: 'Fecha (DD/MM/AAAA)',
  img: 'URL de la imagen',
  iframe: 'URL del video',
  link: 'Enlace',
  enlace: 'Enlace o ruta',
  textoBoton: 'Texto del botón',
  siguiente: 'Siguiente',
  contenido: 'Contenido',
  tipo: 'Tipo',
  num: 'Número',
  categoria: 'Categorías',
  nombre: 'Nombre',
  subcategorias: 'Subcategorías',
  articulos: 'Artículos',
  number: 'Número del artículo',
  title: 'Título',
  text: 'Texto',
  numART: 'Número del artículo',
  tituloART: 'Título del artículo',
  parrafoART: 'Texto del artículo',
  imgART: 'URL de la imagen',
  preguntas: 'Preguntas',
  pregunta: 'Pregunta',
  opciones: 'Opciones',
  correcta: 'Respuesta correcta',
  explicacion: 'Explicación'
};

const inputLabels = {
  news: 'noticia',
  promotions: 'promoción',
  laws: 'artículo',
  functions: 'artículo'
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    cache: 'no-store',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `El servidor respondió ${response.status}.`);
  return result;
}

function setStatus(message, kind = '') {
  elements.status.textContent = message;
  elements.status.className = `status${kind ? ` is-${kind}` : ''}`;
}

function setConnected(value) {
  connected = value;
  elements.badge.textContent = value ? 'Conectado' : 'Conexion Fallida';
  elements.badge.classList.toggle('is-connected', value);
  elements.connectionPanel.hidden = value;
  elements.token.disabled = value;
  elements.connect.hidden = value;
  elements.disconnect.hidden = !value;
  elements.refresh.disabled = !value;
  elements.collection.disabled = !value;
  elements.create.disabled = !value;
  elements.resource.disabled = !value || resources.length === 0;
  if (!value) {
    resources = [];
    currentResource = null;
    isCreating = false;
    editorData = null;
    elements.resource.replaceChildren(new Option('Conecta el Servidor para cargar', ''));
    elements.form.replaceChildren(Object.assign(document.createElement('p'), {
      className: 'empty-form',
      textContent: 'Conecta y selecciona un archivo para editar sus campos.'
    }));
    elements.fields.disabled = true;
    elements.save.disabled = true;
    elements.remove.hidden = true;
    elements.meta.hidden = true;
  }
}

function updateEditorState() {
  const hasSelection = connected && (isCreating || Boolean(currentResource));
  elements.fields.disabled = !hasSelection;
  elements.save.disabled = !hasSelection;
  elements.remove.hidden = !connected || isCreating || !currentResource ||
    resources.at(-1)?.path !== currentResource.path;
  elements.meta.hidden = !currentResource || isCreating;
  elements.meta.textContent = currentResource?.path || '';
}

function setCurrentResource(resource) {
  currentResource = resource;
  isCreating = false;
  elements.resource.value = resource?.path || '';
  editorData = resource ? JSON.parse(resource.content) : null;
  renderEditor();
  elements.commit.value = resource
    ? `Actualizar ${resource.path.split('/').pop()} desde el editor local`
    : 'Actualizar contenido desde el editor local';
  updateEditorState();
}

async function loadResources(selectedPath = '') {
  if (!connected) return;
  setStatus('Cargando archivos desde del cloud...');
  elements.refresh.disabled = true;
  try {
    const result = await api(`/api/resources?type=${encodeURIComponent(elements.collection.value)}`);
    resources = result.resources;
    elements.resource.replaceChildren();
    if (!resources.length) {
      elements.resource.add(new Option('No hay archivos en esta colección', ''));
      setCurrentResource(null);
      setStatus('No se encontraron archivos para esta sección. Puedes crear el primero con «+ Nuevo».');
      return;
    }
    for (const resource of resources) {
      elements.resource.add(new Option(resource.path.split('/').pop(), resource.path));
    }
    elements.resource.disabled = resources.length === 0;
    const selected = resources.find(resource => resource.path === selectedPath) || resources[0];
    setCurrentResource(selected);
    setStatus(`Se cargaron ${resources.length} archivo(s).`);
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    elements.refresh.disabled = !connected;
  }
}

function blankResource(type) {
  if (type === 'news') {
    const now = new Date();
    return {
      titulo: '',
      fecha: [
        String(now.getDate()).padStart(2, '0'),
        String(now.getMonth() + 1).padStart(2, '0'),
        now.getFullYear()
      ].join('/'),
      descripcion: '',
      img: '',
      iframe: '',
      link: ''
    };
  }
  if (type === 'promotions') {
    return {
      titulo: '',
      descripcion: '',
      enlace: '',
      siguiente: null,
      textoBoton: 'Ver más',
      contenido: []
    };
  }
  if (type === 'laws') {
    return { titulo: '', subtitulo: '', descripcion: '', articulos: [] };
  }
  return {
    tipo: 'claves',
    num: '',
    titulo: '',
    categoria: [{
      nombre: '',
      subcategorias: [{
        nombre: '',
        articulos: [{ numART: '', tituloART: '', parrafoART: '' }]
      }]
    }]
  };
}

function labelFor(key) {
  return fieldLabels[key] || key.replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, character => character.toUpperCase());
}

function isLongText(key, value) {
  return ['descripcion', 'parrafoART', 'text', 'explicacion'].includes(key) ||
    (typeof value === 'string' && value.length > 100);
}

function emptyValueLike(value) {
  if (Array.isArray(value)) return value.length ? [emptyValueLike(value[0])] : [];
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, emptyValueLike(child)]));
  }
  if (typeof value === 'boolean') return false;
  if (typeof value === 'number') return 0;
  return value === null ? null : '';
}

function newArrayItem(path, items, requestedType = '') {
  const key = path.at(-1);
  if (key === 'contenido') {
    if (requestedType === 'quiz') {
      return {
        tipo: 'quiz',
        titulo: '',
        preguntas: [{ pregunta: '', opciones: [{ texto: '', correcta: false }], explicacion: '' }]
      };
    }
    return { tipo: 'texto', titulo: '', texto: '' };
  }
  if (items.length) return emptyValueLike(items[0]);
  if (key === 'categoria') return { nombre: '', subcategorias: [] };
  if (key === 'subcategorias') return { nombre: '', articulos: [] };
  if (key === 'articulos' && elements.collection.value === 'laws') {
    return { number: '', title: '', text: '' };
  }
  if (key === 'articulos') return { numART: '', tituloART: '', parrafoART: '' };
  if (key === 'preguntas') {
    return { pregunta: '', opciones: [{ texto: '', correcta: false }], explicacion: '' };
  }
  if (key === 'opciones') return { texto: '', correcta: false };
  return '';
}

function itemLabel(key, index) {
  const itemName = key === 'categoria' ? 'Categoría'
    : key === 'subcategorias' ? 'Subcategoría'
      : key === 'articulos' ? inputLabels[elements.collection.value]
        : key === 'preguntas' ? 'Pregunta'
          : key === 'opciones' ? 'Opción'
            : key === 'contenido' ? 'Bloque' : 'Elemento';
  return `${itemName} ${index + 1}`;
}

function renderEditor() {
  elements.form.replaceChildren();
  if (!editorData || typeof editorData !== 'object' || Array.isArray(editorData)) {
    elements.form.append(Object.assign(document.createElement('p'), {
      className: 'empty-form',
      textContent: 'Selecciona o crea un archivo para mostrar sus campos.'
    }));
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'editor-grid';
  renderObjectFields(editorData, [], grid, (key, value) => {
    editorData[key] = value;
  });
  elements.form.append(grid);
}

function renderObjectFields(value, path, container, onChange) {
  for (const [key, child] of Object.entries(value)) {
    renderField(key, child, [...path, key], container, nextValue => onChange(key, nextValue));
  }
}

function renderField(key, value, path, container, onChange) {
  if (Array.isArray(value)) {
    const section = document.createElement('section');
    section.className = 'array-editor editor-field editor-field-wide';
    const heading = document.createElement('div');
    heading.className = 'array-heading';
    const label = document.createElement('label');
    label.textContent = `${labelFor(key)} (${value.length})`;
    const addButtons = document.createElement('div');
    addButtons.className = 'add-buttons';
    const addItem = (buttonText, requestedType = '') => {
      const addButton = document.createElement('button');
      addButton.type = 'button';
      addButton.className = 'mini-button';
      addButton.textContent = buttonText;
      addButton.addEventListener('click', () => {
        value.push(newArrayItem(path, value, requestedType));
        onChange(value);
        renderEditor();
      });
      addButtons.append(addButton);
    };
    if (key === 'contenido') {
      addItem('＋ Texto', 'texto');
      addItem('＋ Cuestionario', 'quiz');
    } else {
      addItem('＋ Agregar');
    }
    heading.append(label, addButtons);
    const items = document.createElement('div');
    items.className = 'array-items';
    value.forEach((item, index) => {
      const itemPath = [...path, index];
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        const details = document.createElement('details');
        details.className = 'array-item';
        const summary = document.createElement('summary');
        summary.textContent = itemLabel(key, index);
        const contents = document.createElement('div');
        contents.className = 'array-item-content editor-grid';
        renderObjectFields(item, itemPath, contents, (childKey, nextValue) => {
          item[childKey] = nextValue;
        });
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'mini-button remove-item';
        removeButton.textContent = 'Eliminar';
        removeButton.addEventListener('click', () => {
          value.splice(index, 1);
          onChange(value);
          renderEditor();
        });
        contents.append(removeButton);
        details.append(summary, contents);
        items.append(details);
      } else {
        renderField(itemLabel(key, index), item, itemPath, items, nextValue => {
          value[index] = nextValue;
        });
      }
    });
    section.append(heading, items);
    container.append(section);
    return;
  }

  if (value && typeof value === 'object') {
    const details = document.createElement('details');
    details.className = 'object-editor editor-field editor-field-wide';
    const summary = document.createElement('summary');
    summary.textContent = labelFor(key);
    const children = document.createElement('div');
    children.className = 'editor-grid';
    renderObjectFields(value, path, children, (childKey, nextValue) => {
      value[childKey] = nextValue;
    });
    details.append(summary, children);
    container.append(details);
    return;
  }

  const field = document.createElement('div');
  field.className = 'editor-field';
  if (typeof value === 'string' && isLongText(key, value)) field.classList.add('editor-field-wide');
  const label = document.createElement('label');
  label.textContent = labelFor(key);
  if (typeof value === 'boolean') {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = value;
    checkbox.addEventListener('change', () => onChange(checkbox.checked));
    label.prepend(checkbox);
    field.append(label);
  } else if (value === null) {
    const nullLabel = document.createElement('label');
    nullLabel.textContent = labelFor(key);
    const nullRow = document.createElement('label');
    nullRow.className = 'null-row';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.addEventListener('change', () => {
      onChange(checkbox.checked ? null : '');
      renderEditor();
    });
    nullRow.append(checkbox, document.createTextNode('Sin valor (null)'));
    field.append(nullLabel, nullRow);
  } else {
    const options = key === 'tipo' && elements.collection.value === 'functions' && path.length === 1
      ? ['claves', 'documento', 'actas', 'procedimiento', 'updf', 'updfm']
      : key === 'tipo' && path.includes('contenido') ? ['texto', 'quiz'] : null;
    const control = options
      ? document.createElement('select')
      : document.createElement(typeof value === 'string' && isLongText(key, value) ? 'textarea' : 'input');
    if (control instanceof HTMLInputElement) {
      control.type = typeof value === 'number' ? 'number' : 'text';
    }
    control.value = value ?? '';
    if (options) {
      control.replaceChildren(...options.map(option => new Option(option, option)));
      control.value = value;
    }
    control.addEventListener('input', () => {
      onChange(typeof value === 'number' && control.value !== '' ? Number(control.value) : control.value);
    });
    field.append(label, control);
  }
  container.append(field);
}

function nextResourcePath() {
  const prefixByType = {
    news: ['file/news', 'new'],
    promotions: ['file/news', 'promo'],
    laws: ['file/gacetas', 'ley'],
    functions: ['file/funcion', 'fuc']
  };
  const [directory, prefix] = prefixByType[elements.collection.value];
  const number = (resources.at(-1)?.number || 0) + 1;
  return `${directory}/${prefix}_${String(number).padStart(2, '0')}.json`;
}

async function connect() {
  const token = elements.token.value.trim();
  if (!token) {
    setStatus('Pega primero el token personal del cloud.', 'error');
    elements.token.focus();
    return;
  }
  elements.connect.disabled = true;
  setStatus('Comprobando acceso al repositorio...');
  try {
    const result = await api('/api/connect', {
      method: 'POST',
      body: JSON.stringify({ token })
    });
    elements.token.value = '';
    setConnected(true);
    setStatus('Conexión correcta. El token solo permanece en la memoria del servidor local.', 'success');
    await loadResources();
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    elements.connect.disabled = false;
  }
}

async function disconnect() {
  try {
    await api('/api/disconnect', { method: 'POST', body: '{}' });
    setConnected(false);
    setStatus('Se borró el token de la memoria del servidor.');
  } catch (error) {
    setStatus(error.message, 'error');
  }
}

async function save() {
  if (!editorData || typeof editorData !== 'object' || Array.isArray(editorData)) {
    setStatus('El formulario no contiene un registro válido.', 'error');
    return;
  }
  const path = isCreating ? nextResourcePath() : currentResource.path;
  const saveButtonText = elements.save.textContent;
  elements.save.disabled = true;
  elements.save.textContent = 'Publicando...';
  setStatus(`Publicando ${path} en cloud...`);
  try {
    const result = await api('/api/save', {
      method: 'POST',
      body: JSON.stringify({
        type: elements.collection.value,
        path,
        sha: isCreating ? null : currentResource.sha,
        content: JSON.stringify(editorData, null, 2),
        message: elements.commit.value
      })
    });
    await loadResources(result.saved.path);
    setStatus(`Publicado ${result.saved.path}. cloud Pages actualizará el sitio en unos momentos.${result.saved.commit ? ` Commit: ${result.saved.commit}` : ''}`, 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    elements.save.textContent = saveButtonText;
    updateEditorState();
  }
}

async function removeLast() {
  if (!currentResource || !window.confirm(`¿Eliminar ${currentResource.path}? Esta acción crea un commit y solo se permite para el último archivo de la colección.`)) {
    return;
  }
  elements.remove.disabled = true;
  setStatus(`Eliminando ${currentResource.path}...`);
  try {
    const result = await api('/api/delete', {
      method: 'POST',
      body: JSON.stringify({
        type: elements.collection.value,
        path: currentResource.path,
        sha: currentResource.sha
      })
    });
    await loadResources();
    setStatus(`Se eliminó ${result.deleted.path}.`, 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    elements.remove.disabled = false;
  }
}

elements.connect.addEventListener('click', connect);
elements.disconnect.addEventListener('click', disconnect);
elements.refresh.addEventListener('click', () => loadResources(currentResource?.path));
elements.collection.addEventListener('change', () => loadResources());
elements.resource.addEventListener('change', () => {
  setCurrentResource(resources.find(resource => resource.path === elements.resource.value) || null);
});
elements.create.addEventListener('click', () => {
  currentResource = null;
  isCreating = true;
  elements.resource.value = '';
  editorData = blankResource(elements.collection.value);
  renderEditor();
  elements.commit.value = `Agregar a ${elements.collection.options[elements.collection.selectedIndex].text}`;
  updateEditorState();
  setStatus(`Nuevo registro. Se guardará en ${nextResourcePath()}.`);
});
elements.save.addEventListener('click', save);
elements.remove.addEventListener('click', removeLast);

api('/api/status')
  .then(result => {
    setConnected(result.connected);
    if (!result.connected) setStatus('Conecta el Cloud para comenzar. Cada guardado crea un commit en la rama main.');
  })
  .catch(error => setStatus(error.message, 'error'));
