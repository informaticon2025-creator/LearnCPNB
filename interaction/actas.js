const searchInput = document.getElementById('actasSearch');
const searchStatus = document.getElementById('actasSearchStatus');
const resultsContainer = document.getElementById('actasResults');
let sections = [];

function getPinnedItems() {
  return JSON.parse(localStorage.getItem('pinnedItems') || '[]');
}

function savePinnedItems(items) {
  localStorage.setItem('pinnedItems', JSON.stringify(items));
}

function togglePin(item) {
  let pinned = getPinnedItems();
  const index = pinned.findIndex(p => p.id === item.id);
  if (index >= 0) {
    pinned.splice(index, 1);
  } else {
    pinned.push(item);
  }
  savePinnedItems(pinned);
}

function normalizeSearch(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function renderSections(query) {
  resultsContainer.replaceChildren();

  const terms = query ? query.split(/\s+/) : [];
  const results = query
    ? sections.filter(section => {
      const content = normalizeSearch(`${section.title} ${section.text}`);
      return terms.every(term => content.includes(term));
    })
    : sections;

  if (!results.length) {
    searchStatus.textContent = 'No se encontró información con esos términos.';
    return;
  }

  searchStatus.textContent = query
    ? `Se encontraron ${results.length} artículo${results.length === 1 ? '' : 's'}.`
    : `Se muestran los ${results.length} artículos del protocolo.`;

  const pinnedItems = getPinnedItems();

  for (let i = 0; i < results.length; i++) {
    const section = results[i];
    const result = document.createElement('article');
    result.className = 'article-result';

    const heading = document.createElement('h2');
    heading.textContent = section.title;

    const text = document.createElement('p');
    text.textContent = section.text;

    const itemId = `acta-${normalizeSearch(section.title).replace(/\s+/g, '-')}`;
    const isPinned = pinnedItems.some(p => p.id === itemId);

    const pinBtn = document.createElement('button');
    pinBtn.type = 'button';
    pinBtn.className = `btn-pin ${isPinned ? 'pinned' : ''}`;
    pinBtn.setAttribute('aria-label', `${isPinned ? 'Desfijar' : 'Fijar'} ${section.title}`);
    pinBtn.setAttribute('aria-pressed', String(isPinned));
    pinBtn.innerHTML = `
      <svg class="icon pin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5v6l1 1 1-1v-6h5v-2l-2-2z"></path>
      </svg>
    `;

    pinBtn.addEventListener('click', () => {
      const pinObj = {
        id: itemId,
        type: 'ACTA',
        title: section.title,
        text: section.text
      };
      togglePin(pinObj);
      const currentlyPinned = getPinnedItems().some(p => p.id === itemId);
      pinBtn.classList.toggle('pinned', currentlyPinned);
      pinBtn.setAttribute('aria-label', `${currentlyPinned ? 'Desfijar' : 'Fijar'} ${section.title}`);
      pinBtn.setAttribute('aria-pressed', String(currentlyPinned));
    });

    result.append(heading, text, pinBtn);
    resultsContainer.appendChild(result);
  }
}

searchInput.addEventListener('input', () => {
  renderSections(normalizeSearch(searchInput.value));
});

fetch('file/funcion/fuc_01.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`No se pudo cargar el protocolo (${response.status}).`);
    }
    return response.json();
  })
  .then(data => {
    if (data?.tipo !== 'actas' || !Array.isArray(data.categoria)) {
      throw new Error('El archivo de Actas debe incluir categorías con sus artículos.');
    }

    sections = data.categoria.flatMap(category => {
      if (
        typeof category.nombre !== 'string' ||
        !Array.isArray(category.subcategorias)
      ) {
        throw new Error('El archivo de Actas contiene una categoría con formato inválido.');
      }

      return category.subcategorias.flatMap(subcategory => {
        if (
          typeof subcategory.nombre !== 'string' ||
          !Array.isArray(subcategory.articulos)
        ) {
          throw new Error('El archivo de Actas contiene una subcategoría con formato inválido.');
        }

        return subcategory.articulos.map(article => {
          if (
            typeof article.numART !== 'string' ||
            typeof article.tituloART !== 'string' ||
            typeof article.parrafoART !== 'string'
          ) {
            throw new Error('El archivo de Actas contiene un artículo con formato inválido.');
          }

          return {
            title: `${category.nombre} · ${subcategory.nombre} · Artículo ${article.numART}: ${article.tituloART}`,
            text: article.parrafoART
          };
        });
      });
    });

    if (!sections.length) {
      throw new Error('El archivo de Actas no contiene artículos para mostrar.');
    }

    renderSections(normalizeSearch(searchInput.value));
  })
  .catch(error => {
    console.error(error);
    searchStatus.textContent = 'No se pudo cargar el protocolo. Intenta recargar la página.';
  });
