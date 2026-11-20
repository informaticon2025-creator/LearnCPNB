const adPopup = document.getElementById('adPopup');
const adPopupClose = document.getElementById('adPopupClose');
const adContainer = document.getElementById('container-f7a4cd18b482d3e1811e3157321aaf55');

if (!adPopup || !adPopupClose || !adContainer) {
  console.error('No se pudo preparar la ventana de anuncios.');
} else {
  const adInterval = 5 * 60 * 1000;
  const adTimer = window.setInterval(() => {
    const hasAd = adContainer.querySelector('[class*="__bn-container"]');
    if (hasAd && !adPopup.open) adPopup.show();
  }, adInterval);

  adPopupClose.addEventListener('click', () => adPopup.close());
  window.addEventListener('pagehide', () => window.clearInterval(adTimer), { once: true });
}
