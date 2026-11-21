const adPopup = document.getElementById('adPopup');
const adPopupClose = document.getElementById('adPopupClose');
const adContainer = document.getElementById('container-f7a4cd18b482d3e1811e3157321aaf55');
const inlineAdPlacement = document.getElementById('inlineAdPlacement');
const adPopupStateKey = 'learncpnb-ad-popup-state-v2';
const adPopupDelays = [1, 3, 5, 5, 10].map(minutes => minutes * 60 * 1000);

if (!adPopup || !adPopupClose || !adContainer || !inlineAdPlacement) {
  console.error('No se pudo preparar la ventana de anuncios.');
} else {
  let adTimer;

  function readAdPopupState() {
    const saved = localStorage.getItem(adPopupStateKey);
    if (!saved) return { shown: 0 };

    const state = JSON.parse(saved);
    if (!state || !Number.isInteger(state.shown) || state.shown < 0 || state.shown > adPopupDelays.length) {
      throw new Error('El registro de vistas de anuncios no es válido.');
    }
    return state;
  }

  function showInlineAd() {
    inlineAdPlacement.hidden = false;
    inlineAdPlacement.appendChild(adContainer);
  }

  function scheduleAd() {
    const state = readAdPopupState();
    if (state.shown >= adPopupDelays.length) {
      showInlineAd();
      return;
    }

    const delay = adPopupDelays[state.shown];
    window.clearTimeout(adTimer);
    adTimer = window.setTimeout(tryShowAd, delay);
  }

  function tryShowAd() {
    const hasAd = adContainer.querySelector('[class*="__bn-container"]');
    if (!hasAd) {
      adTimer = window.setTimeout(tryShowAd, 2000);
      return;
    }

    const state = readAdPopupState();
    if (state.shown >= adPopupDelays.length) {
      showInlineAd();
      return;
    }
    state.shown += 1;
    localStorage.setItem(adPopupStateKey, JSON.stringify(state));
    adPopup.show();
  }

  adPopupClose.addEventListener('click', () => adPopup.close());
  adPopup.addEventListener('close', () => {
    const state = readAdPopupState();
    if (state.shown >= adPopupDelays.length) showInlineAd();
    else scheduleAd();
  });
  window.addEventListener('pagehide', () => window.clearTimeout(adTimer), { once: true });

  scheduleAd();
}
