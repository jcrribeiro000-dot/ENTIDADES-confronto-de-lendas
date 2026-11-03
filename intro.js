// =================================================================
// intro.js — V1.0 — Nova Abertura do Jogo
// -----------------------------------------------------------------
// Substitui completamente a intro antiga (logo → título → menu).
//
// Nova sequência:
//   1. Logo do jogo
//   2. Imagem do desenvolvedor (dev16.jpg / dev9.jpg)
//   3. Vídeo de abertura (intro16.mp4 / intro9.mp4)
//   4. Vai direto para a Aldeia (carregando último save)
//      OU abre criação de save se não houver nenhum
//
// • Wide  (>700px): dev16.jpg + intro16.mp4
// • Mobile (≤700px): dev9.jpg + intro9.mp4
// • Skip total: adicione ?skipIntro=1 na URL
// =================================================================
(function newIntroV1() {
    if (window._newIntroV1) return;
    window._newIntroV1 = true;

    // ═══════════════════════════════════════════════════════════
    // CONFIGURAÇÃO
    // ═══════════════════════════════════════════════════════════
    const CFG = {
        logo: 'https://i.imgur.com/LbVLpE8.png',
        devWide: 'dev16.jpg',
        devMobile: 'dev9.jpg',
        videoWide: 'intro16.mp4',
        videoMobile: 'intro9.mp4',
        logoDuration: 2200,
        devDuration: 2200,
        fadeMs: 500,
        videoSkipAfter: 1500,
        skipParam: 'skipIntro',
    };

    // ═══════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════
    const isMobile = () =>
        window.matchMedia('(max-width: 700px)').matches || window.innerWidth < 700;

    const hasSave = () => {
        try { return !!localStorage.getItem('entity_story_current_save'); }
        catch (e) { return false; }
    };

    const checkSkipParam = () => {
        try {
            const url = new URL(window.location.href);
            return url.searchParams.get(CFG.skipParam) === '1';
        } catch (e) { return false; }
    };

    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    // ═══════════════════════════════════════════════════════════
    // CSS
    // ═══════════════════════════════════════════════════════════
    function injectCSS() {
        if (document.getElementById('newIntroV1CSS')) return;
        const s = document.createElement('style');
        s.id = 'newIntroV1CSS';
        s.textContent = `
            #newIntroOverlay {
                position: fixed;
                inset: 0;
                width: 100vw;
                height: 100vh;
                height: 100dvh;
                background: #000;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100000;
                overflow: hidden;
                opacity: 0;
                transition: opacity 0.5s ease;
            }
            #newIntroOverlay.visible { opacity: 1; }
            #newIntroOverlay.fade-out { opacity: 0; }

            #newIntroOverlay .intro-stage {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.5s ease;
                pointer-events: none;
            }
            #newIntroOverlay .intro-stage.active {
                opacity: 1;
                pointer-events: auto;
            }

            #newIntroOverlay .intro-logo-img {
                max-width: 70vw;
                max-height: 70vh;
                object-fit: contain;
                filter: drop-shadow(0 0 40px rgba(232, 185, 35, 0.5));
                animation: introPulse 2s ease-in-out infinite;
            }

            #newIntroOverlay .intro-dev-img {
                max-width: 88vw;
                max-height: 78vh;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            }

            #newIntroOverlay .intro-video {
                width: 100%;
                height: 100%;
                object-fit: contain;
                background: #000;
            }

            #newIntroOverlay .intro-loading {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 3rem;
                color: #c9a227;
                font-family: 'Cinzel', serif;
                animation: introSpin 1s linear infinite;
                z-index: 2;
                pointer-events: none;
            }

            #newIntroOverlay .intro-skip {
                position: absolute;
                bottom: 40px;
                right: 40px;
                padding: 12px 22px;
                background: rgba(10, 6, 2, 0.78);
                color: #e8b923;
                border: 2px solid #c9a227;
                border-radius: 4px;
                font-family: 'Cinzel', serif;
                font-size: 0.9rem;
                font-weight: 700;
                letter-spacing: 2px;
                cursor: pointer;
                z-index: 10;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease, background 0.2s;
                -webkit-tap-highlight-color: transparent;
            }
            #newIntroOverlay .intro-skip.visible {
                opacity: 1;
                pointer-events: auto;
            }
            #newIntroOverlay .intro-skip:hover {
                background: rgba(201, 162, 39, 0.28);
            }

            #newIntroOverlay .intro-unmute {
                position: absolute;
                top: 40px;
                right: 40px;
                padding: 10px 18px;
                background: rgba(10, 6, 2, 0.85);
                color: #e8b923;
                border: 2px solid #c9a227;
                border-radius: 4px;
                font-family: 'Cinzel', serif;
                font-size: 0.8rem;
                font-weight: 700;
                letter-spacing: 1.5px;
                cursor: pointer;
                z-index: 11;
                animation: introPulse 1s ease-in-out infinite;
                -webkit-tap-highlight-color: transparent;
            }

            @keyframes introPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.04); }
            }
            @keyframes introSpin {
                0% { transform: translate(-50%, -50%) rotate(0deg); }
                100% { transform: translate(-50%, -50%) rotate(360deg); }
            }

            @media (max-width: 700px) {
                #newIntroOverlay .intro-skip {
                    bottom: max(20px, env(safe-area-inset-bottom));
                    right: 20px;
                    padding: 10px 16px;
                    font-size: 0.78rem;
                    letter-spacing: 1px;
                }
                #newIntroOverlay .intro-unmute {
                    top: max(20px, env(safe-area-inset-top));
                    right: 20px;
                    padding: 8px 14px;
                    font-size: 0.72rem;
                }
                #newIntroOverlay .intro-loading {
                    font-size: 2.2rem;
                }
            }
        `;
        document.head.appendChild(s);
    }

    // ═══════════════════════════════════════════════════════════
    // OVERLAY
    // ═══════════════════════════════════════════════════════════
    function createOverlay() {
        const old = document.getElementById('newIntroOverlay');
        if (old) old.remove();
        const el = document.createElement('div');
        el.id = 'newIntroOverlay';
        document.body.appendChild(el);
        void el.offsetHeight;
        el.classList.add('visible');
        return el;
    }

    // ═══════════════════════════════════════════════════════════
    // STAGE: IMAGEM
    // ═══════════════════════════════════════════════════════════
    async function showImageStage(overlay, imgSrc, duration, isLogo) {
        const stage = document.createElement('div');
        stage.className = 'intro-stage';

        const img = document.createElement('img');
        img.src = imgSrc;
        img.className = isLogo ? 'intro-logo-img' : 'intro-dev-img';
        img.alt = 'Intro';
        img.onerror = () => {
            console.warn(`[Intro] Falha ao carregar imagem: ${imgSrc}`);
            img.style.display = 'none';
        };
        stage.appendChild(img);
        overlay.appendChild(stage);

        await wait(50);
        stage.classList.add('active');
        await wait(duration);
        stage.classList.remove('active');
        await wait(CFG.fadeMs);
        stage.remove();
    }

    // ═══════════════════════════════════════════════════════════
    // STAGE: VÍDEO
    // ═══════════════════════════════════════════════════════════
    async function playVideoStage(overlay) {
        return new Promise((resolve) => {
            const stage = document.createElement('div');
            stage.className = 'intro-stage';
            stage.style.background = '#000';

            const video = document.createElement('video');
            video.src = isMobile() ? CFG.videoMobile : CFG.videoWide;
            video.className = 'intro-video';
            video.playsInline = true;
            video.setAttribute('playsinline', '');
            video.setAttribute('webkit-playsinline', '');
            video.preload = 'auto';
            video.muted = false;

            const loading = document.createElement('div');
            loading.className = 'intro-loading';
            loading.textContent = '⏳';

            const skipBtn = document.createElement('button');
            skipBtn.className = 'intro-skip';
            skipBtn.textContent = isMobile() ? 'PULAR →' : 'PULAR INTRO →';

            stage.appendChild(video);
            stage.appendChild(loading);
            stage.appendChild(skipBtn);
            overlay.appendChild(stage);

            let finished = false;
            const finish = () => {
                if (finished) return;
                finished = true;
                try {
                    video.pause();
                    video.removeAttribute('src');
                    video.load();
                } catch (e) {}
                stage.classList.remove('active');
                setTimeout(() => {
                    if (stage.parentNode) stage.remove();
                    resolve();
                }, CFG.fadeMs);
            };

            // Se clique em qualquer lugar → ativa som (se estiver mudo)
            const handleUnmute = () => {
                if (video.muted) {
                    video.muted = false;
                    video.volume = 1;
                }
            };
            overlay.addEventListener('click', handleUnmute, { once: true });

            // Tenta tocar com som; fallback mutado; fallback pular
            const tryPlay = async () => {
                try {
                    await video.play();
                    loading.remove();
                    setTimeout(() => skipBtn.classList.add('visible'), CFG.videoSkipAfter);
                } catch (err) {
                    // Autoplay com som bloqueado — tenta mutado
                    video.muted = true;
                    try {
                        await video.play();
                        loading.remove();

                        // Adiciona botão "ativar som"
                        const unmuteBtn = document.createElement('button');
                        unmuteBtn.className = 'intro-unmute';
                        unmuteBtn.textContent = '🔊 ATIVAR SOM';
                        unmuteBtn.onclick = (e) => {
                            e.stopPropagation();
                            video.muted = false;
                            video.volume = 1;
                            unmuteBtn.remove();
                        };
                        stage.appendChild(unmuteBtn);

                        setTimeout(() => skipBtn.classList.add('visible'), CFG.videoSkipAfter);
                    } catch (err2) {
                        console.warn('[Intro] Vídeo não pôde tocar:', err2);
                        finish();
                    }
                }
            };

            video.onended = finish;
            video.onerror = () => {
                console.warn('[Intro] Erro ao carregar vídeo');
                finish();
            };
            video.oncanplay = () => loading.remove();

            skipBtn.onclick = (e) => {
                e.stopPropagation();
                finish();
            };

            // ESC também pula
            const escHandler = (e) => {
                if (e.key === 'Escape') finish();
            };
            document.addEventListener('keydown', escHandler);
            const origFinish = finish;
            // Envolve finish para remover listener de ESC
            const finishWrapped = () => {
                document.removeEventListener('keydown', escHandler);
                origFinish();
            };
            video.onended = finishWrapped;
            video.onerror = finishWrapped;
            skipBtn.onclick = (e) => { e.stopPropagation(); finishWrapped(); };

            requestAnimationFrame(() => stage.classList.add('active'));
            tryPlay();
        });
    }

    // ═══════════════════════════════════════════════════════════
    // ROTEAMENTO (para onde ir depois da intro)
    // ═══════════════════════════════════════════════════════════
    function hideMenus() {
        ['introScreen', 'titleScreen', 'modeScreen', 'challengeScreen',
         'playersScreen', 'gameScreen', 'configScreen', 'tutorialScreen'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = 'none';
                el.classList.remove('active');
            }
        });
    }

    function routeAfterIntro() {
        hideMenus();

        // Sem save → forçar criação de save (allowCancel: false)
        if (!hasSave()) {
            console.log('[Intro] Sem save → abrindo criação de save');
            // Prefere abrir direto o modal com allowCancel: false
            if (typeof window.showStorySaveNameModal === 'function') {
                window.showStorySaveNameModal({ allowCancel: false, title: 'NOVO SAVE' });
            } else if (typeof window.showStoryScreen === 'function') {
                // Fallback: showStoryScreen detecta falta de save e abre o modal
                window.showStoryScreen();
            } else {
                console.error('[Intro] Nenhuma função de save disponível');
            }
            return;
        }

        // Com save → ir para Aldeia (carregando último save)
        console.log('[Intro] Com save → abrindo Aldeia');
        if (typeof window.showStoryScreen === 'function') {
            window.showStoryScreen();
        } else {
            // Fallback manual
            const ss = document.getElementById('storyScreen');
            if (ss) {
                ss.style.display = 'flex';
                ss.classList.add('active');
                if (typeof window.renderAldeiaScreen === 'function') {
                    window.renderAldeiaScreen();
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // SEQUÊNCIA PRINCIPAL
    // ═══════════════════════════════════════════════════════════
    async function runIntroSequence() {
        injectCSS();

        // Esconde intro antiga (se ainda visível)
        const oldIntro = document.getElementById('introScreen');
        if (oldIntro) {
            oldIntro.style.display = 'none';
            oldIntro.style.opacity = '0';
        }
        const oldTitle = document.getElementById('titleScreen');
        if (oldTitle) {
            oldTitle.style.display = 'none';
            oldTitle.classList.remove('active');
        }

        // Trava scroll durante intro
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        // Toca música de intro (se disponível)
        try {
            if (typeof sfx !== 'undefined' && sfx.intro) {
                sfx.intro.volume = 0.4;
                sfx.intro.currentTime = 0;
                sfx.intro.play().catch(() => {});
            }
        } catch (e) {}

        const overlay = createOverlay();

        try {
            // 1. Logo
            await showImageStage(overlay, CFG.logo, CFG.logoDuration, true);

            // 2. Imagem do dev (responsiva)
            const devSrc = isMobile() ? CFG.devMobile : CFG.devWide;
            await showImageStage(overlay, devSrc, CFG.devDuration, false);

            // Para música antes do vídeo (vídeo tem áudio próprio)
            try {
                if (typeof sfx !== 'undefined' && sfx.intro) {
                    sfx.intro.pause();
                    sfx.intro.currentTime = 0;
                }
            } catch (e) {}

            // 3. Vídeo
            await playVideoStage(overlay);
        } catch (err) {
            console.error('[Intro] Erro na sequência:', err);
        }

        // Fade out do overlay
        overlay.classList.add('fade-out');
        await wait(CFG.fadeMs);
        overlay.remove();

        // Restaura scroll
        document.body.style.overflow = prevOverflow;

        // Desbloqueia áudio (gesto do usuário já foi feito se ele pulou)
        try {
            if (typeof window.unlockAudio === 'function') window.unlockAudio();
        } catch (e) {}

        // Atualiza variável de tela
        try {
            if (typeof currentScreen !== 'undefined') currentScreen = 'story';
        } catch (e) {}

        // Vai para o destino
        routeAfterIntro();
    }

    // ═══════════════════════════════════════════════════════════
    // INSTALAÇÃO
    // ═══════════════════════════════════════════════════════════
    const skip = checkSkipParam();

    if (skip) {
        console.log('[Intro] ?skipIntro=1 → pulando direto para Aldeia/Save');
        window.showIntro = function () {
            setTimeout(routeAfterIntro, 100);
        };
    } else {
        window.showIntro = function () {
            runIntroSequence();
        };
    }

    // Fallback: se intro.js carregar DEPOIS do DOMContentLoaded
    // (não deveria acontecer, mas por segurança)
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        setTimeout(() => {
            const oldIntro = document.getElementById('introScreen');
            const oldTitle = document.getElementById('titleScreen');
            const introVisible = oldIntro && getComputedStyle(oldIntro).display !== 'none';
            const titleVisible = oldTitle && getComputedStyle(oldTitle).display !== 'none'
                                && oldTitle.classList.contains('active');
            if (introVisible || titleVisible) {
                console.log('[Intro] Detectado fluxo antigo, forçando nova sequência');
                runIntroSequence();
            }
        }, 200);
    }

    // ═══════════════════════════════════════════════════════════
    // DEBUG
    // ═══════════════════════════════════════════════════════════
    window._debugIntro = function () {
        console.group('🎬 [intro.js V1.0]');
        console.log('Mobile?', isMobile());
        console.log('Tem save?', hasSave());
        console.log('Dev image:', isMobile() ? CFG.devMobile : CFG.devWide);
        console.log('Vídeo:', isMobile() ? CFG.videoMobile : CFG.videoWide);
        console.log('Overlay visível?', !!document.getElementById('newIntroOverlay'));
        console.log('showIntro é override?', window.showIntro && window.showIntro !== showIntro.toString());
        console.groupEnd();
    };

    window._forceIntro = function () {
        runIntroSequence();
    };

    window._skipIntroNow = function () {
        const ov = document.getElementById('newIntroOverlay');
        if (ov) ov.remove();
        routeAfterIntro();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('🎬 [intro.js V1.0] Nova abertura carregada');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Sequência: Logo → Dev (${isMobile() ? 'mobile' : 'desktop'}) → Vídeo → Aldeia/Save`);
    console.log(`• Assets: ${isMobile() ? 'mobile (dev9/intro9)' : 'desktop (dev16/intro16)'}`);
    console.log(`• Pular tudo: adicione ?${CFG.skipParam}=1 na URL`);
    console.log('');
    console.log('💡 Comandos (console):');
    console.log('   window._forceIntro()   → roda a intro novamente');
    console.log('   window._skipIntroNow() → pula e vai para Aldeia');
    console.log('   window._debugIntro()   → inspecionar estado');
    console.log('═══════════════════════════════════════════════════');
})();