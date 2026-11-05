export default async function run(page, ui) {
  const out = {};
  await page.waitForTimeout(1500);

  // Abre o modo história pelo menu de modos, se disponível
  out.openStory = await page.evaluate(() => {
    const labels = [...document.querySelectorAll('button, .mode-card, .mode-option, [onclick]')];
    const target = labels.find(el => /HISTÓRIA|HISTORIA/i.test(el.textContent || ''));
    if (target) { target.click(); return 'clicked: ' + target.textContent.trim().slice(0,60); }
    return 'no history control';
  });
  await page.waitForTimeout(1500);

  // Se ainda não carregou a aldeia, tenta a API de renderização apropriada.
  out.bootstrap = await page.evaluate(() => {
    try {
      if (typeof window.showStoryScreen === 'function') window.showStoryScreen();
      if (typeof window.renderAldeiaScreen === 'function') window.renderAldeiaScreen();
      return {showStoryScreen: typeof window.showStoryScreen, renderAldeiaScreen: typeof window.renderAldeiaScreen};
    } catch (e) { return {error: e.message}; }
  });
  await page.waitForTimeout(1000);

  out.ocaRender = await page.evaluate(() => {
    try {
      if (typeof window.renderOcaScreenFiltered === 'function') {
        window.renderOcaScreenFiltered();
        return 'ok';
      }
      return 'missing renderOcaScreenFiltered';
    } catch (e) { return 'error: ' + e.message; }
  });
  await page.waitForTimeout(500);

  out.cards = await page.evaluate(() => [...document.querySelectorAll('.story-hero-card')].map(c => ({
    name: c.querySelector('.story-hero-name')?.textContent?.trim(),
    locked: c.classList.contains('locked'),
    button: !!c.querySelector('.hero-details-btn'),
    dataHero: c.querySelector('.hero-details-btn')?.getAttribute('data-hero') || null
  })));

  out.abya = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.hero-details-btn')].find(b => b.dataset.hero === 'Abya');
    if (!btn) return {found: false};
    btn.click();
    return {found: true};
  });
  await page.waitForTimeout(500);
  out.overlay = await page.evaluate(() => {
    const ov = document.getElementById('heroDetailsOverlay');
    if (!ov) return {open: false};
    return {open: ov.classList.contains('open'), name: ov.querySelector('.hero-details-name')?.textContent?.trim(), pa: ov.querySelector('.hero-details-pa-name')?.textContent?.trim(), miniTiles: ov.querySelectorAll('.pa-mini-tile').length};
  });

  await page.evaluate(() => { window.closeHeroDetails?.(); });
  await page.waitForTimeout(400);
  out.hubCall = await page.evaluate(() => {
    try { window.renderEventosHubScreen(); return 'ok'; }
    catch (e) { return 'error: ' + e.message; }
  });
  await page.waitForTimeout(800);
  out.hubBg = await page.evaluate(() => {
    const s = document.getElementById('storyScreen');
    return {title: s?.querySelector('.story-title')?.textContent?.trim(), hub: !!s?.querySelector('.event-hub-container'), bg: (s?.style.backgroundImage || '').slice(0,150), size: s?.style.backgroundSize};
  });
  return out;
}
