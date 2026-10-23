// =================================================================
// aldeia.js — Visual Aldeia (Hub clicável estilo jogo profissional)
// -----------------------------------------------------------------
// Carregar no FINAL do index.html (último <script>).
//
// NÃO QUEBRA NADA:
//   • Só sobrescreve window.renderAldeiaScreen
//   • Não mexe em enterAldeiaLocation nem patches
//   • Fallback automático para o render clássico se algo falhar
//   • Toggle: window.toggleAldeiaVisual()
// =================================================================

(function aldeiaVisualV1() {
    if (window._aldeiaVisualV1) return;
    window._aldeiaVisualV1 = true;

    // =============================================================
    // ⚙️ CONFIG — edite aqui
    // =============================================================
    const CFG = window.ALDEIA_CONFIG || {
        // Cole o URL do GIF ou PNG da aldeia
        // Vazio = usa gradiente escuro (igual antes)
        bgImage: 'https://i.imgur.com/zE5VIwh.png',

        // Escurecimento para legibilidade dos ícones
        bgOverlay: 'rgba(10, 6, 2, 0.35)',

        // Ativo por padrão? (toggle salvo em localStorage)
        useVisual: true,

        // Locais clicáveis (x, y são % da tela)
        // imgKey: chave em SPRITES_STORY (se existir, usa sprite; senão, emoji)
        // action: 'enter:key' chama enterAldeiaLocation(key)
        //         'nome' chama window[nome]()
        locations: [
            // ─── Topo ───
            { id: 'evento',     x: 18, y: 28, icon: '🎉', label: 'EVENTO',     action: 'renderEventoSemanalScreen' },
            { id: 'coop',       x: 50, y: 22, icon: '🎮', label: 'COOP',       action: 'coopAbrirPainel' },
            { id: 'pvp',        x: 82, y: 28, icon: '⚔️', label: 'PVP',        action: 'pvpAbrirPainel' },

            // ─── Meio ───
            { id: 'tesouraria', x: 25, y: 52, icon: '🏛️', label: 'TESOURARIA', action: 'enter:tesouraria', imgKey: 'aldeia_tesouraria' },
            { id: 'ritual',     x: 50, y: 48, icon: '⛩️', label: 'RITUAL',     action: 'enter:ritual',     imgKey: 'aldeia_ritual' },
            { id: 'bestiario',  x: 75, y: 52, icon: '📖', label: 'BESTIÁRIO',  action: 'enter:bestiario',  imgKey: 'aldeia_bestiario' },

            // ─── Base ───
            { id: 'atos',       x: 18, y: 76, icon: '🗺️', label: 'ATOS',       action: 'enter:atos',       imgKey: 'aldeia_atos' },
            { id: 'loja',       x: 50, y: 80, icon: '🧙', label: 'ESCAMBO',    action: 'enter:loja',       imgKey: 'aldeia_loja' },
            { id: 'oca',        x: 82, y: 76, icon: '🏠', label: 'OCA',        action: 'enter:oca',        imgKey: 'aldeia_oca' },
        ],
    };
    window.ALDEIA_CONFIG = CFG;

    // =============================================================
    // 🎨 CSS
    // =============================================================
    function injectCSS() {
        if (document.getElementById('aldeiaVisualCSS')) return;
        const style = document.createElement('style');
        style.id = 'aldeiaVisualCSS';
        style.textContent = `
            /* ============ WRAP FULLSCREEN ============ */
            .aldeia-visual-wrap {
                position: fixed;
                inset: 0;
                min-height: 100vh;
                min-height: 100dvh;
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                overflow-y: auto;
                overflow-x: hidden;
                display: flex;
                flex-direction: column;
                z-index: 9701;
                animation: aldeiaFadeIn 0.6s ease;
            }
            @keyframes aldeiaFadeIn {
                from { opacity: 0; }
                to   { opacity: 1; }
            }

            .aldeia-visual-overlay {
                position: absolute;
                inset: 0;
                background: var(--aldeia-overlay, rgba(10, 6, 2, 0.35));
                pointer-events: none;
                z-index: 1;
            }

            /* ============ BARRA SUPERIOR ============ */
            .aldeia-top-bar {
                position: relative;
                z-index: 20;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                gap: 10px;
                flex-wrap: wrap;
                background: linear-gradient(180deg, rgba(10, 6, 2, 0.75), transparent);
            }

            .aldeia-top-group {
                display: flex;
                gap: 8px;
                align-items: center;
                flex-wrap: wrap;
            }

            .aldeia-chip {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                padding: 6px 12px;
                background: rgba(10, 6, 2, 0.75);
                border: 1px solid rgba(201, 162, 39, 0.45);
                border-radius: 20px;
                font-family: 'Cinzel', serif;
                font-size: 0.78rem;
                color: #e8b923;
                font-weight: 700;
                letter-spacing: 1px;
                white-space: nowrap;
            }

            .aldeia-chip img {
                width: 14px;
                height: 14px;
                object-fit: contain;
            }

            .aldeia-chip-btn {
                cursor: pointer;
                transition: all 0.2s;
                font-family: 'Cinzel', serif;
            }
            .aldeia-chip-btn:hover {
                background: rgba(201, 162, 39, 0.25);
                border-color: #e8b923;
                transform: translateY(-1px);
            }

            /* ============ ÁREA DOS ÍCONES ============ */
            .aldeia-icones-wrap {
                position: relative;
                flex: 1;
                min-height: 500px;
                z-index: 15;
            }

            .aldeia-icone {
                position: absolute;
                transform: translate(-50%, -50%);
                cursor: pointer;
                transition: transform 0.25s cubic-bezier(0.25, 0.8, 0.3, 1), filter 0.2s;
                text-align: center;
                user-select: none;
                -webkit-tap-highlight-color: transparent;
            }

            .aldeia-icone:hover {
                transform: translate(-50%, -50%) scale(1.15);
                filter: drop-shadow(0 0 25px #e8b923);
                z-index: 30;
            }
            .aldeia-icone:active {
                transform: translate(-50%, -50%) scale(1.05);
            }

            .aldeia-icone-icon {
                width: 72px;
                height: 72px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 3.2rem;
                background: radial-gradient(circle at 30% 30%,
                    rgba(232, 185, 35, 0.35),
                    rgba(10, 6, 2, 0.85));
                border: 3px solid rgba(201, 162, 39, 0.7);
                border-radius: 50%;
                box-shadow:
                    0 6px 20px rgba(0, 0, 0, 0.7),
                    0 0 20px rgba(201, 162, 39, 0.25),
                    inset 0 0 15px rgba(232, 185, 35, 0.15);
                overflow: hidden;
            }

            .aldeia-icone-icon img {
                width: 85%;
                height: 85%;
                object-fit: contain;
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.9));
            }

            .aldeia-icone-label {
                font-family: 'Cinzel', serif;
                font-size: 0.78rem;
                color: #fff5dc;
                text-shadow:
                    0 2px 4px #000,
                    0 0 8px #000,
                    0 0 15px rgba(232, 185, 35, 0.5);
                font-weight: 900;
                letter-spacing: 1.8px;
                margin-top: 8px;
                white-space: nowrap;
                padding: 3px 8px;
                background: rgba(10, 6, 2, 0.6);
                border-radius: 10px;
            }

            /* ============ BARRA INFERIOR ============ */
            .aldeia-bottom-bar {
                margin-top: auto;
                position: relative;
                z-index: 20;
                padding: 16px;
                text-align: center;
                background: linear-gradient(0deg, rgba(10, 6, 2, 0.75), transparent);
            }

            .aldeia-back-btn {
                padding: 12px 30px;
                background: linear-gradient(135deg, #3d2d18, #2a1f10);
                color: #c8b787;
                border: 2px solid #6a5024;
                border-radius: 4px;
                cursor: pointer;
                font-family: 'Cinzel', serif;
                font-weight: 700;
                font-size: 0.9rem;
                letter-spacing: 1.5px;
                transition: all 0.2s;
            }
            .aldeia-back-btn:hover {
                background: linear-gradient(135deg, #5a4220, #3d2d18);
                color: #e8dcc4;
                border-color: #c9a227;
                transform: translateY(-2px);
            }

            /* ============ MOBILE — GRID FALLBACK ============ */
            @media (max-width: 700px) {
                .aldeia-icones-wrap {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    align-content: flex-start;
                    padding: 20px 10px;
                    min-height: auto;
                }

                .aldeia-icone {
                    position: static !important;
                    transform: none !important;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin: 6px;
                    width: calc(33.33% - 12px);
                    max-width: 110px;
                }

                .aldeia-icone:hover {
                    transform: scale(1.05) !important;
                }

                .aldeia-icone-icon {
                    width: 56px;
                    height: 56px;
                    font-size: 2.4rem;
                }

                .aldeia-icone-label {
                    font-size: 0.62rem;
                    letter-spacing: 1px;
                    padding: 2px 6px;
                    margin-top: 5px;
                }

                .aldeia-top-bar {
                    padding: 8px 10px;
                    gap: 6px;
                }

                .aldeia-chip {
                    font-size: 0.65rem;
                    padding: 4px 9px;
                }
            }

            @media (max-width: 400px) {
                .aldeia-icone { width: calc(50% - 12px); }
            }
        `;
        document.head.appendChild(style);
    }

    // =============================================================
    // 🎯 EXECUTAR AÇÃO
    // =============================================================
    function executarAcao(action, id) {
        try {
            // enter:key → enterAldeiaLocation(key)
            if (action.startsWith('enter:')) {
                const key = action.split(':')[1];
                if (typeof enterAldeiaLocation === 'function') {
                    enterAldeiaLocation(key);
                } else {
                    console.warn(`[aldeia] enterAldeiaLocation ausente (key="${key}")`);
                }
                return;
            }
            // nome → window[nome]()
            if (typeof window[action] === 'function') {
                window[action]();
                return;
            }
            console.warn(`[aldeia] Ação desconhecida: "${action}" (id="${id}")`);
        } catch (e) {
            console.error(`[aldeia] Erro ao executar "${action}":`, e);
        }
    }

    // =============================================================
    // 🖼️ RESOLVE ÍCONE (sprite se existir, senão emoji)
    // =============================================================
    function resolverIcone(loc) {
        if (loc.imgKey && typeof SPRITES_STORY !== 'undefined' && SPRITES_STORY[loc.imgKey]) {
            const url = SPRITES_STORY[loc.imgKey];
            if (url && url.trim() !== '') {
                return `<img src="${url}" alt="${loc.label}" onerror="this.parentNode.innerHTML='${loc.icon}'">`;
            }
        }
        return `<span>${loc.icon}</span>`;
    }

    // =============================================================
    // 🏘️ RENDER VISUAL
    // =============================================================
    function renderVisual() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;

        // Guard: sem save → modal (comportamento original)
        if (!STORY_CURRENT_SAVE_NAME || !STORY_PROGRESS.saveName) {
            screen.style.display = 'none';
            screen.classList.remove('active');
            if (typeof showStorySaveNameModal === 'function') {
                showStorySaveNameModal({ allowCancel: true, title: 'NOVO SAVE' });
            }
            return;
        }

        const gold     = STORY_PROGRESS.gold || 0;
        const xp       = STORY_PROGRESS.totalXP || 0;
        const stars    = (typeof getTotalStars === 'function')    ? getTotalStars()    : 0;
        const maxStars = (typeof getMaxTotalStars === 'function') ? getMaxTotalStars() : 0;
        const saveName = STORY_CURRENT_SAVE_NAME;

        // Ícones
        const iconesHTML = CFG.locations.map(loc => `
            <div class="aldeia-icone" data-id="${loc.id}" style="left:${loc.x}%;top:${loc.y}%;">
                <div class="aldeia-icone-icon">${resolverIcone(loc)}</div>
                <div class="aldeia-icone-label">${loc.label}</div>
            </div>
        `).join('');

        // Background
        const bgStyle = CFG.bgImage
            ? `background-image: url('${CFG.bgImage}');`
            : `background: radial-gradient(ellipse at center, #2a1f10 0%, #1a1208 60%, #0d0805 100%);`;

        // Botões da barra superior (helpers inline)
        const trocarSaveBtn = `<button class="aldeia-chip aldeia-chip-btn" onclick="changeStorySave()">🔄 TROCAR</button>`;
        const configBtn      = `<button class="aldeia-chip aldeia-chip-btn" onclick="renderStorySettingsScreen()">⚙️</button>`;

        screen.innerHTML = `
            <div class="aldeia-visual-wrap" id="aldeiaVisualWrap" style="${bgStyle}">
                <div class="aldeia-visual-overlay" style="--aldeia-overlay:${CFG.bgOverlay};"></div>

                <div class="aldeia-top-bar">
                    <div class="aldeia-top-group">
                        <span class="aldeia-chip">💾 ${saveName}</span>
                        ${trocarSaveBtn}
                    </div>
                    <div class="aldeia-top-group">
                        <span class="aldeia-chip">💰 ${gold}</span>
                        <span class="aldeia-chip">⭐ ${xp} XP</span>
                        <span class="aldeia-chip">✨ ${stars}/${maxStars}</span>
                        ${configBtn}
                    </div>
                </div>

                <div class="aldeia-icones-wrap" id="aldeiaIconesWrap">
                    ${iconesHTML}
                </div>

                <div class="aldeia-bottom-bar">
                    <button class="aldeia-back-btn" onclick="exitStoryToTitle()">← VOLTAR AO MENU</button>
                </div>
            </div>
        `;

        screen.style.display = 'flex';
        screen.classList.add('active');

        // Bind clicks
        setTimeout(() => {
            document.querySelectorAll('.aldeia-icone').forEach(el => {
                const id = el.getAttribute('data-id');
                const loc = CFG.locations.find(l => l.id === id);
                if (!loc) return;
                el.onclick = () => executarAcao(loc.action, loc.id);
            });
        }, 0);

        // Fallback se BG falhar
        if (CFG.bgImage) {
            const img = new Image();
            img.onerror = () => {
                console.warn('[aldeia] Background falhou. Usando gradiente.');
                const wrap = document.getElementById('aldeiaVisualWrap');
                if (wrap) {
                    wrap.style.backgroundImage = 'none';
                    wrap.style.background = 'radial-gradient(ellipse at center, #2a1f10 0%, #1a1208 60%, #0d0805 100%)';
                }
            };
            img.src = CFG.bgImage;
        }
    }

    // =============================================================
    // 🚀 INIT
    // =============================================================
    function init() {
        if (typeof SPRITES_STORY === 'undefined') {
            setTimeout(init, 300);
            return;
        }
        injectCSS();

        // Salva o render clássico (cadeia inteira de patches)
        if (!window._renderAldeiaClassic && typeof window.renderAldeiaScreen === 'function') {
            window._renderAldeiaClassic = window.renderAldeiaScreen;
        }

        // Override final
        window.renderAldeiaScreen = function() {
            if (CFG.useVisual) {
                try {
                    return renderVisual();
                } catch (e) {
                    console.error('[aldeia] Erro no visual, caindo para clássico:', e);
                    if (typeof window._renderAldeiaClassic === 'function') {
                        return window._renderAldeiaClassic.apply(this, arguments);
                    }
                }
            }
            if (typeof window._renderAldeiaClassic === 'function') {
                return window._renderAldeiaClassic.apply(this, arguments);
            }
        };

        // Helpers
        window.toggleAldeiaVisual = function(enable) {
            CFG.useVisual = (enable !== undefined) ? !!enable : !CFG.useVisual;
            try { localStorage.setItem('aldeia_visual_enabled', CFG.useVisual ? '1' : '0'); } catch (e) {}
            if (typeof window.renderAldeiaScreen === 'function') window.renderAldeiaScreen();
            return CFG.useVisual;
        };

        window.setAldeiaBg = function(url) {
            CFG.bgImage = url || '';
            try { localStorage.setItem('aldeia_bg_url', CFG.bgImage); } catch (e) {}
            if (typeof window.renderAldeiaScreen === 'function') window.renderAldeiaScreen();
        };

        // Restore preferências
        try {
            const savedMode = localStorage.getItem('aldeia_visual_enabled');
            if (savedMode === '0') CFG.useVisual = false;
            const savedBg = localStorage.getItem('aldeia_bg_url');
            if (savedBg) CFG.bgImage = savedBg;
        } catch (e) {}

        // Diagnóstico
        window._debugAldeia = function() {
            console.log('═══ [aldeia.js] ═══');
            console.log('Modo visual:', CFG.useVisual);
            console.log('Background:', CFG.bgImage || '(gradiente)');
            console.log('Locais:', CFG.locations.length);
            CFG.locations.forEach(l => {
                const iconType = l.imgKey && SPRITES_STORY?.[l.imgKey] ? 'sprite' : 'emoji';
                console.log(`  • ${l.id} (${l.label}) → ${l.action} [${iconType}]`);
            });
            console.log('Render clássico disponível:', typeof window._renderAldeiaClassic === 'function');
            console.log('═══════════════════════════════════');
        };

        console.log('');
        console.log('═══════════════════════════════════════════════════');
        console.log('🏘️ aldeia.js carregado');
        console.log('═══════════════════════════════════════════════════');
        console.log(`• Modo visual: ${CFG.useVisual ? 'ATIVO ✅' : 'DESATIVADO'}`);
        console.log(`• Background: ${CFG.bgImage ? 'configurado' : '(gradiente)'}`);
        console.log(`• Locais: ${CFG.locations.length}`);
        console.log('');
        console.log('💡 Comandos úteis (console):');
        console.log('   window.toggleAldeiaVisual()         → alterna visual/clássico');
        console.log('   window.setAldeiaBg("URL_DO_GIF")    → define background');
        console.log('   window.ALDEIA_CONFIG.locations      → ajustar posições');
        console.log('   window._debugAldeia()               → status');
        console.log('═══════════════════════════════════════════════════');
    }

    init();
})();
// =================================================================
// aldeia.js — PATCH V1.1 (Modo de Calibração)
// -----------------------------------------------------------------
// Cole NO FINAL do aldeia.js (depois do IIFE principal).
//
// Adiciona:
//   • window.calibrarAldeia()   → liga/desliga modo de arrastar
//   • Arrastar ícones com o mouse/dedo reposiciona
//   • Coordenadas salvas em localStorage
//   • Botão "Salvar" e "Resetar" flutuante
// =================================================================

(function aldeiaCalibracaoV1_1() {
    if (window._aldeiaCalibracaoV1_1) return;
    window._aldeiaCalibracaoV1_1 = true;

    const STORAGE_KEY = 'aldeia_custom_coords';
    let modoCalibracao = false;
    let dragAtivo = null;

    // =============================================================
    // Carrega coordenadas salvas (aplica em CFG.locations)
    // =============================================================
    function carregarCoordenadasSalvas() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const salvas = JSON.parse(raw);
            if (!CFG?.locations) return;
            CFG.locations.forEach(loc => {
                if (salvas[loc.id]) {
                    loc.x = salvas[loc.id].x;
                    loc.y = salvas[loc.id].y;
                }
            });
            console.log('[calibração] Coordenadas carregadas:', salvas);
        } catch (e) {
            console.warn('[calibração] Erro ao carregar:', e);
        }
    }

    // =============================================================
    // Salva as coordenadas atuais
    // =============================================================
    function salvarCoordenadas() {
        const data = {};
        CFG.locations.forEach(loc => {
            data[loc.id] = { x: loc.x, y: loc.y };
        });
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            console.log('[calibração] Salvo:', data);
            if (typeof showToast === 'function') showToast('💾', 'Coordenadas salvas!', '💾');
        } catch (e) {
            console.warn('[calibração] Erro ao salvar:', e);
        }
    }

    // =============================================================
    // Reset (limpa localStorage e restaura padrão)
    // =============================================================
    function resetarCoordenadas() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            // Restaura padrão do arquivo original
            const padrao = {
                evento:     { x: 18, y: 28 },
                coop:       { x: 50, y: 22 },
                pvp:        { x: 82, y: 28 },
                tesouraria: { x: 25, y: 52 },
                ritual:     { x: 50, y: 48 },
                bestiario:  { x: 75, y: 52 },
                atos:       { x: 18, y: 76 },
                loja:       { x: 50, y: 80 },
                oca:        { x: 82, y: 76 },
            };
            CFG.locations.forEach(loc => {
                if (padrao[loc.id]) {
                    loc.x = padrao[loc.id].x;
                    loc.y = padrao[loc.id].y;
                }
            });
            console.log('[calibração] Resetado para padrão');
            if (typeof showToast === 'function') showToast('↺', 'Posições resetadas', '↺');
            if (typeof renderAldeiaScreen === 'function') renderAldeiaScreen();
        } catch (e) {
            console.warn('[calibração] Erro ao resetar:', e);
        }
    }

    // =============================================================
    // Injetar CSS da calibração
    // =============================================================
    function injectCSS() {
        if (document.getElementById('aldeiaCalibCSS')) return;
        const s = document.createElement('style');
        s.id = 'aldeiaCalibCSS';
        s.textContent = `
            body.aldeia-calib-mode .aldeia-icone {
                cursor: grab !important;
                outline: 2px dashed #e8b923;
                outline-offset: 4px;
                z-index: 100 !important;
            }
            body.aldeia-calib-mode .aldeia-icone:active {
                cursor: grabbing !important;
            }
            body.aldeia-calib-mode .aldeia-icone:hover {
                transform: translate(-50%, -50%) scale(1.05) !important;
            }
            .aldeia-calib-badge {
                position: absolute;
                top: -8px;
                left: 50%;
                transform: translateX(-50%);
                background: #e8b923;
                color: #1a1208;
                font-family: 'Courier New', monospace;
                font-size: 0.7rem;
                font-weight: 900;
                padding: 2px 6px;
                border-radius: 4px;
                white-space: nowrap;
                box-shadow: 0 2px 6px rgba(0,0,0,0.8);
                z-index: 2;
            }
            .aldeia-calib-bar {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(10, 6, 2, 0.95);
                border-top: 2px solid #e8b923;
                padding: 12px 16px;
                z-index: 10000;
                display: flex;
                gap: 10px;
                justify-content: center;
                flex-wrap: wrap;
                align-items: center;
                box-shadow: 0 -4px 20px rgba(0,0,0,0.8);
            }
            .aldeia-calib-bar button {
                padding: 10px 20px;
                border-radius: 4px;
                font-family: 'Cinzel', serif;
                font-weight: 700;
                font-size: 0.9rem;
                letter-spacing: 1px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .aldeia-calib-bar .btn-save {
                background: linear-gradient(135deg, #4a7040, #2a4520);
                color: #e0f0d0;
                border: 2px solid #6ba35c;
            }
            .aldeia-calib-bar .btn-reset {
                background: linear-gradient(135deg, #6a2020, #3a1010);
                color: #f5c8c8;
                border: 2px solid #a83232;
            }
            .aldeia-calib-bar .btn-exit {
                background: linear-gradient(135deg, #3d2d18, #2a1f10);
                color: #c8b787;
                border: 2px solid #6a5024;
            }
            .aldeia-calib-bar button:hover {
                transform: translateY(-2px);
                filter: brightness(1.2);
            }
            .aldeia-calib-bar .calib-info {
                font-family: 'EB Garamond', serif;
                color: #d9c89a;
                font-size: 0.85rem;
                font-style: italic;
            }
        `;
        document.head.appendChild(s);
    }

    // =============================================================
    // Ativa arrastar em cada ícone
    // =============================================================
    function ativarDrag() {
        const icones = document.querySelectorAll('.aldeia-icone');
        icones.forEach(el => {
            const id = el.getAttribute('data-id');
            const loc = CFG?.locations?.find(l => l.id === id);
            if (!loc) return;

            // Badge com coordenadas
            let badge = el.querySelector('.aldeia-calib-badge');
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'aldeia-calib-badge';
                el.appendChild(badge);
            }
            badge.textContent = `${loc.x.toFixed(1)}%, ${loc.y.toFixed(1)}%`;

            // Remove onclick (só no modo calibração)
            el._onclickOriginal = el.onclick;
            el.onclick = null;

            el.onmousedown = (e) => iniciarDrag(e, el, loc, badge);
            el.ontouchstart = (e) => iniciarDrag(e, el, loc, badge);
        });
    }

    function iniciarDrag(e, el, loc, badge) {
        if (!modoCalibracao) return;
        e.preventDefault();
        e.stopPropagation();

        const wrap = document.getElementById('aldeiaIconesWrap');
        if (!wrap) return;

        const rect = wrap.getBoundingClientRect();
        dragAtivo = { el, loc, badge, rect };

        function mover(ev) {
            if (!dragAtivo) return;
            ev.preventDefault();

            const point = ev.touches?.[0] || ev;
            const px = point.clientX - rect.left;
            const py = point.clientY - rect.top;

            const x = Math.max(2, Math.min(98, (px / rect.width) * 100));
            const y = Math.max(2, Math.min(98, (py / rect.height) * 100));

            loc.x = x;
            loc.y = y;

            el.style.left = x + '%';
            el.style.top = y + '%';
            badge.textContent = `${x.toFixed(1)}%, ${y.toFixed(1)}%`;
        }

        function soltar() {
            dragAtivo = null;
            document.removeEventListener('mousemove', mover);
            document.removeEventListener('mouseup', soltar);
            document.removeEventListener('touchmove', mover);
            document.removeEventListener('touchend', soltar);
        }

        document.addEventListener('mousemove', mover);
        document.addEventListener('mouseup', soltar);
        document.addEventListener('touchmove', mover, { passive: false });
        document.addEventListener('touchend', soltar);
    }

    // =============================================================
    // Entrar/sair do modo calibração
    // =============================================================
    function entrarModo() {
        modoCalibracao = true;
        document.body.classList.add('aldeia-calib-mode');

        // Re-renderiza para garantir que o DOM está fresco
        if (typeof renderAldeiaScreen === 'function') renderAldeiaScreen();

        setTimeout(() => {
            ativarDrag();
            adicionarBarra();
        }, 100);

        console.log('[calibração] Modo ATIVO — arraste os ícones com o mouse/dedo');
        if (typeof showToast === 'function') {
            showToast('🎯', 'Modo de calibração ativo! Arraste os ícones.', '🎯');
        }
    }

    function sairModo() {
        modoCalibracao = false;
        document.body.classList.remove('aldeia-calib-mode');
        const bar = document.getElementById('aldeiaCalibBar');
        if (bar) bar.remove();
        if (typeof renderAldeiaScreen === 'function') renderAldeiaScreen();
        console.log('[calibração] Modo desligado');
    }

    function adicionarBarra() {
        if (document.getElementById('aldeiaCalibBar')) return;
        const bar = document.createElement('div');
        bar.id = 'aldeiaCalibBar';
        bar.className = 'aldeia-calib-bar';
        bar.innerHTML = `
            <span class="calib-info">🎯 Arraste os ícones. Solte e clique em Salvar.</span>
            <button class="btn-save" onclick="window._aldeiaSalvarCoords()">💾 SALVAR</button>
            <button class="btn-reset" onclick="window._aldeiaResetCoords()">↺ RESETAR</button>
            <button class="btn-exit" onclick="window._aldeiaSairCalib()">✕ SAIR</button>
        `;
        document.body.appendChild(bar);
    }

    // =============================================================
    // Expor API
    // =============================================================
    window.calibrarAldeia = function(enable) {
        const ativar = (enable !== undefined) ? !!enable : !modoCalibracao;
        if (ativar) entrarModo();
        else sairModo();
        return modoCalibracao;
    };

    window._aldeiaSalvarCoords = salvarCoordenadas;
    window._aldeiaResetCoords = resetarCoordenadas;
    window._aldeiaSairCalib = sairModo;

    // =============================================================
    // Init: carrega coordenadas salvas ANTES do primeiro render
    // =============================================================
    const _init = () => {
        if (typeof CFG === 'undefined' || !CFG.locations) {
            setTimeout(_init, 200);
            return;
        }
        injectCSS();
        carregarCoordenadasSalvas();
        console.log('✅ [calibração] Pronto. Use window.calibrarAldeia()');
    };
    _init();

    // Diagnóstico
    window._debugCalib = function() {
        console.log('═══ [calibração] ═══');
        console.log('Modo ativo:', modoCalibracao);
        console.log('Coordenadas atuais:');
        CFG.locations.forEach(loc => {
            console.log(`  ${loc.id.padEnd(12)} → x=${loc.x.toFixed(1)}%, y=${loc.y.toFixed(1)}%`);
        });
        console.log('Storage:', localStorage.getItem(STORAGE_KEY) ? 'sim' : 'não');
        console.log('═══════════════════');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('🎯 aldeia.js V1.1 — Modo de Calibração');
    console.log('═══════════════════════════════════════════════════');
    console.log('window.calibrarAldeia()      → liga/desliga');
    console.log('window._debugCalib()         → status');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// aldeia.js — PATCH V1.2 (Responsivo: Desktop 16:9 + Mobile 9:16)
// -----------------------------------------------------------------
// Cole no FINAL do aldeia.js.
//
// O que faz:
//   1. Adiciona CFG.mobileBgImage (cole o link da arte vertical)
//   2. Detecta celular via matchMedia
//   3. Se celular: usa mobileBgImage (ou fallback inteligente)
//   4. Recalcula ao girar a tela / redimensionar
// =================================================================

(function aldeiaResponsivoV1_2() {
    if (window._aldeiaResponsivoV1_2) return;
    window._aldeiaResponsivoV1_2 = true;

    // =============================================================
    // 1. ADICIONAR SLOT MOBILE NA CONFIG
    // -------------------------------------------------------------
    // Se você já tem a imagem mobile, coloque o link aqui.
    // Se deixar vazio, o código usa fallback (contain + blur).
    // =============================================================
    if (typeof window.ALDEIA_CONFIG !== 'undefined') {
        window.ALDEIA_CONFIG.mobileBgImage = 'https://i.imgur.com/OtQ6odm.png';  // ← COLE O LINK DA ARTE VERTICAL AQUI

        // Recupera do localStorage (se já foi setado via console)
        try {
            const savedMobile = localStorage.getItem('aldeia_bg_mobile');
            if (savedMobile) window.ALDEIA_CONFIG.mobileBgImage = savedMobile;
        } catch (e) {}
    }

    // =============================================================
    // 2. HELPERS
    // =============================================================
    function isMobile() {
        // <= 700px de largura OU tela em modo retrato
        return window.matchMedia('(max-width: 700px)').matches
            || window.matchMedia('(orientation: portrait)').matches;
    }

    function getBgParaTela() {
        const cfg = window.ALDEIA_CONFIG || {};
        if (isMobile()) {
            return cfg.mobileBgImage || cfg.bgImage || '';
        }
        return cfg.bgImage || '';
    }

    // =============================================================
    // 3. APLICAR CSS INLINE ADAPTATIVO
    // -------------------------------------------------------------
    // Em desktop: cover (preenche)
    // Em mobile SEM imagem vertical: contain + fundo escuro (não corta)
    // Em mobile COM imagem vertical: cover (preenche)
    // =============================================================
    function aplicarBackground() {
        const wrap = document.getElementById('aldeiaVisualWrap');
        if (!wrap) return;

        const cfg = window.ALDEIA_CONFIG || {};
        const mobile = isMobile();
        const temMobileImage = !!(cfg.mobileBgImage && cfg.mobileBgImage.trim() !== '');
        const bgFinal = getBgParaTela();

        // Fundo base (sempre escuro, evita "flick" branco)
        wrap.style.backgroundColor = '#0d0805';

        if (!bgFinal) {
            // Sem imagem: gradiente (comportamento original)
            wrap.style.backgroundImage = 'none';
            wrap.style.background = 'radial-gradient(ellipse at center, #2a1f10 0%, #1a1208 60%, #0d0805 100%)';
            return;
        }

        if (mobile && !temMobileImage) {
            // ⚠️ Mobile SEM arte vertical: usar contain (não corta)
            // O fundo escuro preenche as bordas sobrando
            wrap.style.backgroundImage = `url('${bgFinal}')`;
            wrap.style.backgroundSize = 'contain';
            wrap.style.backgroundPosition = 'center';
            wrap.style.backgroundRepeat = 'no-repeat';
            wrap.style.backgroundAttachment = 'scroll';
        } else {
            // Desktop OU mobile com arte vertical: cover
            wrap.style.backgroundImage = `url('${bgFinal}')`;
            wrap.style.backgroundSize = 'cover';
            wrap.style.backgroundPosition = 'center';
            wrap.style.backgroundRepeat = 'no-repeat';
        }
    }

    // =============================================================
    // 4. HOOK NO renderAldeiaScreen (aplica após cada render)
    // =============================================================
    const _installHook = () => {
        if (typeof window.renderAldeiaScreen !== 'function') return false;
        if (window.renderAldeiaScreen._aldeiaRespV12) return true;

        const _orig = window.renderAldeiaScreen;
        window.renderAldeiaScreen = function() {
            const r = _orig.apply(this, arguments);
            // Espera o DOM montar
            setTimeout(aplicarBackground, 20);
            return r;
        };
        window.renderAldeiaScreen._aldeiaRespV12 = true;
        console.log('[aldeia V1.2] Hook de responsividade instalado.');
        return true;
    };
    if (!_installHook()) {
        const t = setInterval(() => { if (_installHook()) clearInterval(t); }, 200);
    }

    // =============================================================
    // 5. LISTENER DE RESIZE / ORIENTAÇÃO
    // -------------------------------------------------------------
    // Se o jogador gira a tela, recalcula o background
    // =============================================================
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (document.getElementById('aldeiaVisualWrap')) {
                aplicarBackground();
            }
        }, 200);
    });

    window.addEventListener('orientationchange', () => {
        setTimeout(aplicarBackground, 300);
    });

    // =============================================================
    // 6. API PÚBLICA
    // =============================================================
    window.setAldeiaBgMobile = function(url) {
        if (!window.ALDEIA_CONFIG) return;
        window.ALDEIA_CONFIG.mobileBgImage = url || '';
        try { localStorage.setItem('aldeia_bg_mobile', url || ''); } catch (e) {}
        if (typeof window.renderAldeiaScreen === 'function') window.renderAldeiaScreen();
        console.log('[aldeia V1.2] Mobile BG:', url || '(fallback contain)');
    };

    window._debugAldeiaResp = function() {
        const cfg = window.ALDEIA_CONFIG || {};
        console.log('═══ [aldeia V1.2] Responsividade ═══');
        console.log('Tela:', window.innerWidth, 'x', window.innerHeight);
        console.log('Modo:', isMobile() ? 'MOBILE (retrato/pequena)' : 'DESKTOP (wide)');
        console.log('BG Desktop:', cfg.bgImage || '(vazio)');
        console.log('BG Mobile :', cfg.mobileBgImage || '(vazio → contain)');
        console.log('BG aplicado:', getBgParaTela() ? 'SIM' : 'gradiente');
        const wrap = document.getElementById('aldeiaVisualWrap');
        if (wrap) {
            console.log('CSS atual:');
            console.log('  size:', wrap.style.backgroundSize);
            console.log('  position:', wrap.style.backgroundPosition);
        }
        console.log('═══════════════════════════════════');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [aldeia.js V1.2] Responsividade Desktop + Mobile');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Desktop: usa bgImage com cover');
    console.log('• Mobile SEM arte vertical: usa contain (não corta)');
    console.log('• Mobile COM arte vertical: usa mobileBgImage');
    console.log('');
    console.log('💡 Comandos:');
    console.log('   setAldeiaBgMobile("URL")  → define arte vertical');
    console.log('   _debugAldeiaResp()        → status');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// aldeia.js — PATCH V1.3 (Posições Independentes Desktop/Mobile)
// -----------------------------------------------------------------
// 1. Adiciona xMobile e yMobile na configuração
// 2. Remove a grade automática do mobile (ícones voltam a flutuar)
// 3. Calibração salva separadamente para cada tela
// =================================================================

(function aldeiaPosicoesV1_3() {
    if (window._aldeiaPosicoesV1_3) return;
    window._aldeiaPosicoesV1_3 = true;

    // =============================================================
    // 1. INJETAR COORDENADAS MOBILE NA CONFIGURAÇÃO
    // -------------------------------------------------------------
    // Baseado numa imagem vertical 9:16 (ex: 1080x1920).
    // Ajuste esses valores iniciais se necessário.
    // =============================================================
    const posicoesMobilePadrao = {
        evento:     { xMobile: 50, yMobile: 10 },
        coop:       { xMobile: 30, yMobile: 22 },
        pvp:        { xMobile: 70, yMobile: 22 },
        tesouraria: { xMobile: 25, yMobile: 38 },
        ritual:     { xMobile: 50, yMobile: 50 },
        bestiario:  { xMobile: 75, yMobile: 38 },
        atos:       { xMobile: 25, yMobile: 65 },
        loja:       { xMobile: 50, yMobile: 78 },
        oca:        { xMobile: 75, yMobile: 65 },
    };

    if (typeof window.ALDEIA_CONFIG !== 'undefined' && window.ALDEIA_CONFIG.locations) {
        window.ALDEIA_CONFIG.locations.forEach(loc => {
            if (posicoesMobilePadrao[loc.id]) {
                // Só adiciona se ainda não existir (para não sobrescrever saves antigos)
                if (loc.xMobile === undefined) {
                    loc.xMobile = posicoesMobilePadrao[loc.id].xMobile;
                    loc.yMobile = posicoesMobilePadrao[loc.id].yMobile;
                }
            }
        });
    }

    // =============================================================
    // 2. SOBRESCREVER O CSS PADRÃO (Remover a Grade Mobile)
    // -------------------------------------------------------------
    // O V1 original forçava grid no mobile. Agora vamos permitir
    // que os ícones flutuem usando as coordenadas xMobile/yMobile.
    // =============================================================
    if (!document.getElementById('aldeiaV13CSS')) {
        const style = document.createElement('style');
        style.id = 'aldeiaV13CSS';
        style.textContent = `
            /* Força os ícones a flutuarem em qualquer tela */
            @media (max-width: 700px) {
                .aldeia-icones-wrap {
                    display: block !important; /* Remove o flex/grid */
                    min-height: 100vh !important;
                    padding: 0 !important;
                }
                .aldeia-icone {
                    position: absolute !important;
                    transform: translate(-50%, -50%) !important;
                    width: auto !important;
                    margin: 0 !important;
                    max-width: none !important;
                }
                .aldeia-icone:hover {
                    transform: translate(-50%, -50%) scale(1.15) !important;
                }
                .aldeia-icone-icon {
                    width: 60px; /* Ícones um pouco menores no celular */
                    height: 60px;
                    font-size: 2.5rem;
                }
                .aldeia-icone-label {
                    font-size: 0.65rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // =============================================================
    // 3. HELPER PARA SABER SE É MOBILE
    // =============================================================
    function isMobile() {
        return window.matchMedia('(max-width: 700px)').matches
            || window.matchMedia('(orientation: portrait)').matches;
    }

    // =============================================================
    // 4. HOOK NO RENDER (Usar x/y ou xMobile/yMobile)
    // =============================================================
    const _installRenderHook = () => {
        if (typeof window.renderAldeiaScreen !== 'function') return false;
        if (window.renderAldeiaScreen._aldeiaV13) return true;

        const _orig = window.renderAldeiaScreen;
        window.renderAldeiaScreen = function() {
            const r = _orig.apply(this, arguments);
            
            // Após o render, corrige as posições dos ícones
            setTimeout(() => {
                const mob = isMobile();
                const icones = document.querySelectorAll('.aldeia-icone');
                
                icones.forEach(el => {
                    const id = el.getAttribute('data-id');
                    const loc = window.ALDEIA_CONFIG?.locations?.find(l => l.id === id);
                    if (!loc) return;

                    const px = (mob && loc.xMobile !== undefined) ? loc.xMobile : loc.x;
                    const py = (mob && loc.yMobile !== undefined) ? loc.yMobile : loc.y;

                    el.style.left = px + '%';
                    el.style.top = py + '%';
                });
            }, 10);
            
            return r;
        };
        window.renderAldeiaScreen._aldeiaV13 = true;
        return true;
    };
    if (!_installRenderHook()) {
        const t = setInterval(() => { if (_installRenderHook()) clearInterval(t); }, 200);
    }

    // =============================================================
    // 5. ATUALIZAR A CALIBRAÇÃO (Salvar Desktop e Mobile Sep.)
    // =============================================================
    const _origCalibrar = window.calibrarAldeia;
    if (typeof _origCalibrar === 'function') {
        window.calibrarAldeia = function(enable) {
            // Se estiver ativando a calibração
            const ativar = (enable !== undefined) ? !!enable : !document.body.classList.contains('aldeia-calib-mode');
            
            if (ativar) {
                const mob = isMobile();
                console.log(`[calibração] Modo: ${mob ? 'MOBILE' : 'DESKTOP'}. Arraste e salve.`);
                
                // Modifica o drag para salvar na propriedade correta
                const _ativarDrag = () => {
                    const icones = document.querySelectorAll('.aldeia-icone');
                    icones.forEach(el => {
                        const id = el.getAttribute('data-id');
                        const loc = window.ALDEIA_CONFIG?.locations?.find(l => l.id === id);
                        if (!loc) return;

                        let badge = el.querySelector('.aldeia-calib-badge');
                        if (!badge) {
                            badge = document.createElement('div');
                            badge.className = 'aldeia-calib-badge';
                            el.appendChild(badge);
                        }

                        const px = (mob && loc.xMobile !== undefined) ? loc.xMobile : loc.x;
                        const py = (mob && loc.yMobile !== undefined) ? loc.yMobile : loc.y;
                        badge.textContent = `${px.toFixed(1)}%, ${py.toFixed(1)}%`;

                        el.onmousedown = null;
                        el.ontouchstart = null;

                        const iniciar = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const wrap = document.getElementById('aldeiaIconesWrap');
                            if (!wrap) return;
                            const rect = wrap.getBoundingClientRect();

                            const mover = (ev) => {
                                ev.preventDefault();
                                const point = ev.touches?.[0] || ev;
                                const x = Math.max(2, Math.min(98, ((point.clientX - rect.left) / rect.width) * 100));
                                const y = Math.max(2, Math.min(98, ((point.clientY - rect.top) / rect.height) * 100));

                                if (mob) {
                                    loc.xMobile = x;
                                    loc.yMobile = y;
                                } else {
                                    loc.x = x;
                                    loc.y = y;
                                }

                                el.style.left = x + '%';
                                el.style.top = y + '%';
                                badge.textContent = `${x.toFixed(1)}%, ${y.toFixed(1)}%`;
                            };

                            const soltar = () => {
                                document.removeEventListener('mousemove', mover);
                                document.removeEventListener('mouseup', soltar);
                                document.removeEventListener('touchmove', mover);
                                document.removeEventListener('touchend', soltar);
                            };

                            document.addEventListener('mousemove', mover);
                            document.addEventListener('mouseup', soltar);
                            document.addEventListener('touchmove', mover, { passive: false });
                            document.addEventListener('touchend', soltar);
                        };

                        el.addEventListener('mousedown', iniciar);
                        el.addEventListener('touchstart', iniciar, { passive: false });
                    });
                };

                // Chama o método original (que ativa o CSS e cria a barra)
                _origCalibrar.apply(this, arguments);
                // Sobrescreve os eventos de drag para o modo atual
                setTimeout(_ativarDrag, 150);
            } else {
                _origCalibrar.apply(this, arguments);
            }
        };
    }

    // Atualizar o salvamento para incluir xMobile/yMobile
    if (typeof window._aldeiaSalvarCoords === 'function') {
        const _origSalvar = window._aldeiaSalvarCoords;
        window._aldeiaSalvarCoords = function() {
            const data = {};
            window.ALDEIA_CONFIG.locations.forEach(loc => {
                data[loc.id] = { 
                    x: loc.x, y: loc.y,
                    xMobile: loc.xMobile, yMobile: loc.yMobile
                };
            });
            try {
                localStorage.setItem('aldeia_custom_coords', JSON.stringify(data));
                console.log('[calibração] Salvo (Desktop + Mobile):', data);
                if (typeof showToast === 'function') showToast('💾', 'Posições salvas!', '💾');
            } catch (e) {}
        };
    }

    // Atualizar o carregamento para restaurar xMobile/yMobile
    const _carregarCoordsOrig = () => {
        try {
            const raw = localStorage.getItem('aldeia_custom_coords');
            if (!raw) return;
            const salvas = JSON.parse(raw);
            window.ALDEIA_CONFIG.locations.forEach(loc => {
                if (salvas[loc.id]) {
                    if (salvas[loc.id].x !== undefined) loc.x = salvas[loc.id].x;
                    if (salvas[loc.id].y !== undefined) loc.y = salvas[loc.id].y;
                    if (salvas[loc.id].xMobile !== undefined) loc.xMobile = salvas[loc.id].xMobile;
                    if (salvas[loc.id].yMobile !== undefined) loc.yMobile = salvas[loc.id].yMobile;
                }
            });
            console.log('[calibração] Coordenadas restauradas (Desktop + Mobile).');
        } catch (e) {}
    };
    
    // Executa o carregamento assim que o patch rodar
    _carregarCoordsOrig();

    // Diagnóstico atualizado
    window._debugPosicoes = function() {
        const mob = isMobile();
        console.log(`═══ [V1.3] Posições (${mob ? 'MOBILE' : 'DESKTOP'}) ═══`);
        window.ALDEIA_CONFIG.locations.forEach(loc => {
            const px = (mob && loc.xMobile !== undefined) ? loc.xMobile : loc.x;
            const py = (mob && loc.yMobile !== undefined) ? loc.yMobile : loc.y;
            console.log(`  ${loc.id.padEnd(12)} → ${px.toFixed(1)}%, ${py.toFixed(1)}%`);
        });
        console.log('═══════════════════════════════════');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [aldeia V1.3] Posições Independentes (PC / Mobile)');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Desktop usa x / y');
    console.log('• Mobile usa xMobile / yMobile');
    console.log('• Calibração agora salva os dois separadamente!');
    console.log('• Debug: window._debugPosicoes()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// aldeia.js — PATCH V1.4 (O Conserto Definitivo da Calibração)
// =================================================================

(function aldeiaFixCalibracaoV1_4() {
    if (window._aldeiaFixCalibracaoV1_4) return;
    window._aldeiaFixCalibracaoV1_4 = true;

    const CFG = window.ALDEIA_CONFIG;

    // =============================================================
    // 1. RESTAURAR AS POSIÇÕES DO DESKTOP (Caso tenham sido bagunçadas)
    // =============================================================
    const padraoDesktop = {
        evento:     { x: 20, y: 22 },
        coop:       { x: 49, y: 20 },
        pvp:        { x: 77, y: 24 },
        tesouraria: { x: 20, y: 46 },
        ritual:     { x: 49, y: 45 },
        bestiario:  { x: 76, y: 46 },
        atos:       { x: 23, y: 76 },
        loja:       { x: 49, y: 76 },
        oca:        { x: 77, y: 74 },
    };

    if (CFG && CFG.locations) {
        CFG.locations.forEach(loc => {
            if (padraoDesktop[loc.id]) {
                loc.x = padraoDesktop[loc.id].x;
                loc.y = padraoDesktop[loc.id].y;
            }
        });
        
        // Salva o estado limpo de volta no localStorage
        try {
            const data = {};
            CFG.locations.forEach(loc => {
                data[loc.id] = { 
                    x: loc.x, y: loc.y,
                    xMobile: loc.xMobile !== undefined ? loc.xMobile : loc.x, 
                    yMobile: loc.yMobile !== undefined ? loc.yMobile : loc.y
                };
            });
            localStorage.setItem('aldeia_custom_coords', JSON.stringify(data));
            console.log('[V1.4] Desktop restaurado ao padrão original.');
        } catch(e) {}
    }

    // =============================================================
    // 2. DESATIVAR O SISTEMA DE CALIBRAÇÃO ANTIGO
    // =============================================================
    window._aldeiaSalvarCoords = function() {};
    window._aldeiaResetCoords = function() {};
    
    // Remove a barra antiga se ela estiver na tela
    const barraAntiga = document.getElementById('aldeiaCalibBar');
    if (barraAntiga) barraAntiga.remove();

    // =============================================================
    // 3. CRIAR O NOVO SISTEMA DE CALIBRAÇÃO (BLINDADO)
    // =============================================================
    let modoAtivo = false;

    window.calibrarAldeia = function(ativar) {
        const isMobile = window.matchMedia('(max-width: 700px)').matches || window.matchMedia('(orientation: portrait)').matches;
        
        if (ativar === false || (ativar === undefined && modoAtivo)) {
            // --- DESATIVAR ---
            modoAtivo = false;
            document.body.classList.remove('aldeia-calib-mode');
            const b = document.getElementById('aldeiaCalibBarV14');
            if (b) b.remove();
            if (typeof renderAldeiaScreen === 'function') renderAldeiaScreen();
            return;
        }

        // --- ATIVAR ---
        modoAtivo = true;
        document.body.classList.add('aldeia-calib-mode');
        if (typeof renderAldeiaScreen === 'function') renderAldeiaScreen();

        setTimeout(() => {
            // Cria a barra nova
            const bar = document.createElement('div');
            bar.id = 'aldeiaCalibBarV14';
            bar.className = 'aldeia-calib-bar'; // Usa o CSS que já criamos
            bar.innerHTML = `
                <span class="calib-info">🎯 Editando: <b>${isMobile ? 'CELULAR' : 'DESKTOP'}</b></span>
                <button class="btn-save" onclick="window._v14Salvar()">💾 SALVAR</button>
                <button class="btn-exit" onclick="window.calibrarAldeia(false)">✕ SAIR</button>
            `;
            document.body.appendChild(bar);

            // Ativa o arrastar
            const icones = document.querySelectorAll('.aldeia-icone');
            icones.forEach(el => {
                const id = el.getAttribute('data-id');
                const loc = CFG.locations.find(l => l.id === id);
                if (!loc) return;

                // Badge com as coordenadas
                let badge = el.querySelector('.aldeia-calib-badge');
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'aldeia-calib-badge';
                    el.appendChild(badge);
                }
                
                const px = (isMobile && loc.xMobile !== undefined) ? loc.xMobile : loc.x;
                const py = (isMobile && loc.yMobile !== undefined) ? loc.yMobile : loc.y;
                badge.textContent = `${px.toFixed(1)}%, ${py.toFixed(1)}%`;

                // Limpa qualquer evento antigo (isso resolve o bug)
                el.onmousedown = null;
                el.ontouchstart = null;

                // Adiciona o evento novo exclusivo
                const iniciarDrag = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const wrap = document.getElementById('aldeiaIconesWrap');
                    if (!wrap) return;
                    const rect = wrap.getBoundingClientRect();

                    const mover = (ev) => {
                        ev.preventDefault();
                        const point = ev.touches?.[0] || ev;
                        const x = Math.max(2, Math.min(98, ((point.clientX - rect.left) / rect.width) * 100));
                        const y = Math.max(2, Math.min(98, ((point.clientY - rect.top) / rect.height) * 100));

                        // Atualiza apenas o lado correto
                        if (isMobile) {
                            loc.xMobile = x;
                            loc.yMobile = y;
                        } else {
                            loc.x = x;
                            loc.y = y;
                        }

                        el.style.left = x + '%';
                        el.style.top = y + '%';
                        badge.textContent = `${x.toFixed(1)}%, ${y.toFixed(1)}%`;
                    };

                    const soltar = () => {
                        document.removeEventListener('mousemove', mover);
                        document.removeEventListener('mouseup', soltar);
                        document.removeEventListener('touchmove', mover);
                        document.removeEventListener('touchend', soltar);
                    };

                    document.addEventListener('mousemove', mover);
                    document.addEventListener('mouseup', soltar);
                    document.addEventListener('touchmove', mover, { passive: false });
                    document.addEventListener('touchend', soltar);
                };

                el.addEventListener('mousedown', iniciarDrag);
                el.addEventListener('touchstart', iniciarDrag, { passive: false });
            });
        }, 50);
    };

    // Função de Salvar do V1.4
    window._v14Salvar = function() {
        const data = {};
        CFG.locations.forEach(loc => {
            data[loc.id] = { 
                x: loc.x, y: loc.y,
                xMobile: loc.xMobile, yMobile: loc.yMobile
            };
        });
        try {
            localStorage.setItem('aldeia_custom_coords', JSON.stringify(data));
            if (typeof showToast === 'function') showToast('💾', 'Posições salvas!', '💾');
            console.log('[V1.4] Posições salvas:', data);
        } catch(e) {}
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [aldeia.js V1.4] Calibração Blindada');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Desktop foi restaurado para as posições corretas.');
    console.log('• O bug de alterar os dois ao mesmo tempo foi consertado.');
    console.log('• Use window.calibrarAldeia() para ajustar.');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// aldeia.js — PATCH V1.5 (Injeção Direta de Coordenadas via Print)
// -----------------------------------------------------------------
// Cole este código NO FINAL do seu aldeia.js
// =================================================================

(function aldeiaInjectCoordsV1_5() {
    if (window._aldeiaInjectCoordsV1_5) return;
    window._aldeiaInjectCoordsV1_5 = true;

    // Coordenadas extraídas exatamente do print enviado
    const coordsPrint = {
        evento:     { x: 60.8, y: 7.2 },
        coop:       { x: 13.8, y: 15.4 },
        pvp:        { x: 82.0, y: 21.4 },
        tesouraria: { x: 25.0, y: 38.0 },
        ritual:     { x: 48.8, y: 45.8 },
        bestiario:  { x: 85.5, y: 48.6 },
        atos:       { x: 12.3, y: 52.1 },
        loja:       { x: 42.5, y: 64.3 }, // ESCAMBO
        oca:        { x: 70.8, y: 80.9 }
    };

    const aplicarPosicoes = () => {
        const CFG = window.ALDEIA_CONFIG;
        
        // Se o jogo ainda não carregou a config, espera 200ms e tenta de novo
        if (!CFG || !CFG.locations) {
            setTimeout(aplicarPosicoes, 200);
            return;
        }

        // 1. Atualiza a memória do jogo com as posições do print
        CFG.locations.forEach(loc => {
            if (coordsPrint[loc.id]) {
                // Aplica tanto no Desktop quanto no Mobile
                loc.x = coordsPrint[loc.id].x;
                loc.y = coordsPrint[loc.id].y;
                loc.xMobile = coordsPrint[loc.id].x;
                loc.yMobile = coordsPrint[loc.id].y;
            }
        });

        // 2. Salva no localStorage para blindar contra os patches antigos
        try {
            const data = {};
            CFG.locations.forEach(loc => {
                data[loc.id] = { 
                    x: loc.x, 
                    y: loc.y,
                    xMobile: loc.xMobile, 
                    yMobile: loc.yMobile
                };
            });
            localStorage.setItem('aldeia_custom_coords', JSON.stringify(data));
        } catch(e) {}

        // 3. Limpa qualquer sujeira do modo de calibração antigo
        document.body.classList.remove('aldeia-calib-mode');
        const b1 = document.getElementById('aldeiaCalibBarV14');
        const b2 = document.getElementById('aldeiaCalibBar');
        if (b1) b1.remove();
        if (b2) b2.remove();
        document.querySelectorAll('.aldeia-calib-badge').forEach(b => b.remove());

        // 4. Força a tela a atualizar com as novas posições
        if (typeof window.renderAldeiaScreen === 'function') {
            const screen = document.getElementById('storyScreen');
            // Só re-renderiza se a tela da aldeia estiver aberta
            if (screen && screen.style.display !== 'none') {
                window.renderAldeiaScreen();
            }
        }
        
        console.log('✅ [aldeia V1.5] Posições do print injetadas com sucesso!');
    };

    // Executa assim que o script for lido
    aplicarPosicoes();
    
})();

// =================================================================
// 🚶 heroAldeiaWalker v6 — Visual novo, sem piscar, sem vazar
// -----------------------------------------------------------------
// Foco: .aldeia-visual-wrap + .aldeia-icone[data-id]
// Walker mora em #storyScreen (não em body) → morre junto com a tela.
// Observer só CRIA — nunca remove. Sem polling.
// =================================================================
(function heroAldeiaWalkerV6() {
    if (window._heroAldeiaWalkerV6) return;
    window._heroAldeiaWalkerV6 = true;

    const SPRITE_SIZE = 52;
    const WALK_MS = 1200;
    let heroElem = null;
    let animando = false;
    let _obsDebounce = null;

    // ---------------- CSS ----------------
    if (!document.getElementById('heroAldeiaWalkerCSS6')) {
        const style = document.createElement('style');
        style.id = 'heroAldeiaWalkerCSS6';
        style.textContent = `
            .hero-walker-wrap {
                position: fixed;
                width: ${SPRITE_SIZE}px; height: ${SPRITE_SIZE}px;
                pointer-events: none;
                z-index: 99999;
                opacity: 0;
                transition:
                    left ${WALK_MS}ms cubic-bezier(.25,.8,.3,1),
                    top ${WALK_MS}ms cubic-bezier(.25,.8,.3,1),
                    opacity 0.3s ease;
                filter: drop-shadow(0 6px 10px rgba(0,0,0,0.9))
                        drop-shadow(0 0 10px rgba(232,185,35,0.6));
            }
            .hero-walker-wrap.visible { opacity: 1; }
            .hero-walker-wrap.walking {
                filter: drop-shadow(0 6px 12px rgba(0,0,0,0.9))
                        drop-shadow(0 0 16px rgba(232,185,35,0.9));
            }
            .hero-walker-img {
                width: 100%; height: 100%;
                object-fit: contain;
                transform-origin: center bottom;
            }
            .hero-walker-wrap.walking .hero-walker-img {
                animation: heroWalkerBob 0.3s ease-in-out infinite;
            }
            @keyframes heroWalkerBob {
                0%,100% { transform: translateY(0); }
                50%     { transform: translateY(-5px); }
            }
            .hero-walker-wrap.facing-left .hero-walker-img {
                transform: scaleX(-1);
            }
            .hero-walker-wrap.facing-left.walking .hero-walker-img {
                animation: heroWalkerBobLeft 0.3s ease-in-out infinite;
            }
            @keyframes heroWalkerBobLeft {
                0%,100% { transform: scaleX(-1) translateY(0); }
                50%     { transform: scaleX(-1) translateY(-5px); }
            }
            .hero-walker-badge {
                position: absolute; bottom: -14px; left: 50%;
                transform: translateX(-50%);
                font-family: 'Cinzel', serif; font-size: 0.6rem;
                color: #e8b923; background: rgba(10,6,2,0.85);
                border: 1px solid rgba(201,162,39,0.5);
                border-radius: 8px; padding: 1px 6px;
                white-space: nowrap;
                text-shadow: 0 1px 2px #000;
                pointer-events: none;
            }
            .aldeia-icone.hero-target-pulse {
                animation: heroTargetPulse 0.9s ease-out;
            }
            @keyframes heroTargetPulse {
                0%,100% { filter: drop-shadow(0 0 0 rgba(232,185,35,0)); }
                50%     { filter: drop-shadow(0 0 28px rgba(232,185,35,0.95)); }
            }
        `;
        document.head.appendChild(style);
    }

    // ---------------- acesso seguro às globais ----------------
    function getSP() { try { if (typeof STORY_PROGRESS !== 'undefined') return STORY_PROGRESS; } catch(e){} return window.STORY_PROGRESS || null; }
    function getHC() { try { if (typeof STORY_HERO_CLASSES !== 'undefined') return STORY_HERO_CLASSES; } catch(e){} return window.STORY_HERO_CLASSES || null; }
    function getSS() { try { if (typeof SPRITES_STORY !== 'undefined') return SPRITES_STORY; } catch(e){} return window.SPRITES_STORY || null; }
    function getES() { try { if (typeof EMOJI_STORY !== 'undefined') return EMOJI_STORY; } catch(e){} return window.EMOJI_STORY || null; }

    // ---------------- 100% visual ----------------
    function getAldeiaWrap() {
        return document.querySelector('.aldeia-visual-wrap');
    }
    function getIcone(key) {
        return document.querySelector(`.aldeia-icone[data-id="${key}"]`);
    }
    function getAnchorIcone(el) {
        if (!el) return null;
        return el.querySelector('.aldeia-icone-icon') || el;
    }

    // ---------------- helpers de herói ----------------
    function getSelectedHeroClass() {
        const sel = getSP()?.selectedHeroes;
        return (Array.isArray(sel) && sel[0]) ? sel[0] : null;
    }
    function getHeroSprite(cls) {
        if (!cls) return null;
        const hc = getHC(), ss = getSS();
        const key = hc?.[cls]?.spriteKey;
        if (key && ss?.[key]) {
            const url = ss[key];
            if (url && String(url).trim() !== '') return url;
        }
        try { if (typeof SPRITES !== 'undefined' && SPRITES[cls]) return SPRITES[cls]; } catch(e){}
        return null;
    }
    function getHeroEmoji(cls) {
        const key = getHC()?.[cls]?.spriteKey;
        return (key && getES()?.[key]) ? getES()[key] : '🧙';
    }
    function getHeroDisplayName(cls) {
        return getHC()?.[cls]?.displayName || cls || 'Herói';
    }

    // ---------------- executar ação (fallback) ----------------
    function executarAcaoDireta(key) {
        const fns = {
            atos: ['renderAtosScreen'],
            oca: ['renderOcaScreenFiltered', 'renderOcaScreen'],
            loja: ['renderLojaScreenCompleta', 'renderLojaScreen'],
            ritual: ['renderRitualScreen'],
            bestiario: ['renderBestiaryScreen'],
            tesouraria: ['renderTesourariaScreen'],
            evento: ['renderEventoSemanalScreen'],
            coop: ['coopAbrirPainel'],
            pvp: ['pvpAbrirPainel']
        }[key] || [];
        for (const n of fns) if (typeof window[n] === 'function') { try { window[n](); return true; } catch(e){} }
        if (typeof window.enterAldeiaLocation === 'function') {
            try { window.enterAldeiaLocation(key); return true; } catch(e){}
        }
        return false;
    }

    // ---------------- posicionar ----------------
    function posicionarHeroNaAldeia() {
        // Early return: já existe e está visível + não animando
        const existente = document.getElementById('aldeiaHeroWalker');
        if (existente && existente.classList.contains('visible') && !existente.classList.contains('walking')) {
            return;
        }

        // Se já existe (mesmo invisível), remove
        if (existente) existente.remove();
        heroElem = null;

        if (animando) return;
        if (!getAldeiaWrap()) return;

        const heroClass = getSelectedHeroClass();
        if (!heroClass) { console.log('[v6] sem herói selecionado'); return; }

        const ocaIcon = getIcone('oca');
        if (!ocaIcon) { console.warn('[v6] ícone OCA não encontrado'); return; }

        const anchor = getAnchorIcone(ocaIcon);
        const sprite = getHeroSprite(heroClass);
        const emoji  = getHeroEmoji(heroClass);
        const name   = getHeroDisplayName(heroClass);

        const wrap = document.createElement('div');
        wrap.id = 'aldeiaHeroWalker';
        wrap.className = 'hero-walker-wrap';
        wrap.setAttribute('data-hero', heroClass);

        if (sprite) {
            const img = document.createElement('img');
            img.className = 'hero-walker-img';
            img.src = sprite;
            img.alt = name;
            img.onerror = function () {
                this.outerHTML = `<div class="hero-walker-img" style="display:flex;align-items:center;justify-content:center;font-size:2.4rem;">${emoji}</div>`;
            };
            wrap.appendChild(img);
        } else {
            const img = document.createElement('div');
            img.className = 'hero-walker-img';
            img.textContent = emoji;
            img.style.cssText = 'display:flex;align-items:center;justify-content:center;font-size:2.4rem;';
            wrap.appendChild(img);
        }

        const badge = document.createElement('div');
        badge.className = 'hero-walker-badge';
        badge.textContent = name;
        wrap.appendChild(badge);

        const baseRect = anchor.getBoundingClientRect();
        const isMobile = window.innerWidth < 700;
        let x, y;
        if (isMobile) {
            x = baseRect.left + baseRect.width / 2 - SPRITE_SIZE / 2;
            y = baseRect.top - SPRITE_SIZE - 6;
        } else {
            x = baseRect.right + 8;
            y = baseRect.top + baseRect.height / 2 - SPRITE_SIZE / 2;
        }
        x = Math.max(4, Math.min(window.innerWidth  - SPRITE_SIZE - 4, x));
        y = Math.max(4, Math.min(window.innerHeight - SPRITE_SIZE - 4, y));

        wrap.style.left = x + 'px';
        wrap.style.top  = y + 'px';

        // ⭐ MORADOR: #storyScreen (morre com a tela)
        const screen = document.getElementById('storyScreen');
        (screen || document.body).appendChild(wrap);
        heroElem = wrap;

        requestAnimationFrame(() => {
            if (heroElem) heroElem.classList.add('visible');
        });

        console.log(`[v6] ${name} posicionado em (${x|0}, ${y|0})`);
    }

    // ---------------- caminhada ----------------
    async function animarCaminhada(target) {
        return new Promise(resolve => {
            if (!heroElem || !target) { resolve(); return; }
            const tgt = target.getBoundingClientRect();
            const targetCenter = tgt.left + tgt.width / 2;
            const currentX = parseFloat(heroElem.style.left) || 0;
            const goRight = targetCenter > currentX;
            heroElem.classList.toggle('facing-left', !goRight);

            const dx = goRight ? tgt.right + 8 : tgt.left - SPRITE_SIZE - 8;
            const dy = tgt.top + tgt.height / 2 - SPRITE_SIZE / 2;

            target.classList.add('hero-target-pulse');
            heroElem.classList.add('walking');
            heroElem.style.left = dx + 'px';
            heroElem.style.top  = dy + 'px';

            setTimeout(() => {
                if (heroElem) heroElem.classList.remove('walking');
                target.classList.remove('hero-target-pulse');
                resolve();
            }, WALK_MS + 50);
        });
    }

    // ---------------- click handler ----------------
    function onClick(ev) {
        if (animando) {
            if (ev.target.closest('.aldeia-icone')) {
                ev.preventDefault();
                ev.stopImmediatePropagation();
            }
            return;
        }

        const icone = ev.target.closest('.aldeia-icone');
        if (!icone) return;
        if (icone.classList.contains('locked')) return;
        if (!getAldeiaWrap()) return;

        const key = icone.getAttribute('data-id');
        if (!key) return;

        const origOnClick = icone.onclick;

        ev.preventDefault();
        ev.stopImmediatePropagation();

        const acionarAcao = () => {
            if (typeof origOnClick === 'function') {
                try { origOnClick.call(icone); return; } catch (e) { console.warn('[v6] onclick erro:', e); }
            }
            executarAcaoDireta(key);
        };

        // OCA → entra direto (sem caminhada)
        if (key === 'oca' || !heroElem) {
            acionarAcao();
            return;
        }

        // Caminha → ação
        animando = true;
        (async () => {
            try {
                await animarCaminhada(icone);
                await new Promise(r => setTimeout(r, 150));
                if (heroElem) { heroElem.remove(); heroElem = null; }
                acionarAcao();
            } catch (e) {
                console.warn('[v6] erro:', e);
                acionarAcao();
            } finally {
                setTimeout(() => { animando = false; }, 150);
            }
        })();
    }

    window.addEventListener('click', onClick, true);

    // ---------------- observer (só CRIA) ----------------
    function instalarObserver() {
        const screen = document.getElementById('storyScreen');
        if (!screen) { setTimeout(instalarObserver, 300); return; }
        const obs = new MutationObserver(() => {
            clearTimeout(_obsDebounce);
            _obsDebounce = setTimeout(() => {
                // ⭐ Só cria se: tem aldeia + não tem walker + não está animando
                if (getAldeiaWrap()
                    && !document.getElementById('aldeiaHeroWalker')
                    && !animando) {
                    posicionarHeroNaAldeia();
                }
            }, 350);
        });
        obs.observe(screen, { childList: true, subtree: true });
        console.log('[v6] MutationObserver instalado.');
    }
    instalarObserver();

    // Tentativas iniciais
    setTimeout(posicionarHeroNaAldeia, 400);
    setTimeout(posicionarHeroNaAldeia, 1200);

    // Resize
    let rt = null;
    window.addEventListener('resize', () => {
        clearTimeout(rt);
        rt = setTimeout(() => {
            // Reposicionar se já existe
            const el = document.getElementById('aldeiaHeroWalker');
            if (el && !el.classList.contains('walking') && getAldeiaWrap()) {
                el.remove();
                heroElem = null;
                posicionarHeroNaAldeia();
            }
        }, 250);
    });
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            const el = document.getElementById('aldeiaHeroWalker');
            if (el && !el.classList.contains('walking') && getAldeiaWrap()) {
                el.remove();
                heroElem = null;
                posicionarHeroNaAldeia();
            }
        }, 350);
    });

    // ---------------- debug ----------------
    window._forceWalker = function() {
        console.log('[v6] forçando...');
        const el = document.getElementById('aldeiaHeroWalker');
        if (el) el.remove();
        heroElem = null;
        posicionarHeroNaAldeia();
        setTimeout(() => {
            const el2 = document.getElementById('aldeiaHeroWalker');
            console.log('[v6] DIAGNÓSTICO:', {
                aldeiaWrap: !!getAldeiaWrap(),
                ocaIcon: !!getIcone('oca'),
                heroClass: getSelectedHeroClass(),
                walkerNoDOM: !!el2,
                walkerVisivel: el2?.classList.contains('visible'),
                walkerAnimando: el2?.classList.contains('walking'),
                pos: el2 ? { x: el2.getBoundingClientRect().x | 0, y: el2.getBoundingClientRect().y | 0 } : null
            });
        }, 200);
    };

    window._debugHeroWalker = function() {
        const el = document.getElementById('aldeiaHeroWalker');
        console.log('═══ [v6] ═══');
        console.log('Aldeia visual-wrap?', !!getAldeiaWrap());
        console.log('Ícone OCA?         ', !!getIcone('oca'));
        console.log('Herói selecionado? ', getSelectedHeroClass());
        console.log('Walker no DOM?     ', !!el);
        console.log('Walker visível?    ', el?.classList.contains('visible'));
        console.log('Walker animando?   ', el?.classList.contains('walking'));
        console.log('Animando (flag)?   ', animando);
        console.log('Papai do walker?   ', el?.parentElement?.id || el?.parentElement?.className);
        console.log('═══════════════════');
    };

    console.log('✅ [v6] Walker instalado. Foco no layout visual.');
    console.log('   💡 Debug: window._forceWalker() / window._debugHeroWalker()');
})();
// =================================================================
// FIM — heroAldeiaWalker v6
// =================================================================
// =================================================================
// 🚶 heroAldeiaWalker v6.1 — Visual novo, à prova de polling antigo
// -----------------------------------------------------------------
// Foco: .aldeia-visual-wrap + .aldeia-icone[data-id]
// Walker mora em #storyScreen → morre junto com a tela.
// Guard observer recria imediatamente se for removido por algo
// externo (proteção contra v3/v4/v5 antigos ainda ativos).
// =================================================================
(function heroAldeiaWalkerV61() {
    if (window._heroAldeiaWalkerV61) return;
    window._heroAldeiaWalkerV61 = true;

    const SPRITE_SIZE = 52;
    const WALK_MS = 1200;
    let heroElem = null;
    let animando = false;
    let _obsDebounce = null;
    let _removidosExternos = 0;

    // ---------------- CSS ----------------
    if (!document.getElementById('heroAldeiaWalkerCSS61')) {
        const style = document.createElement('style');
        style.id = 'heroAldeiaWalkerCSS61';
        style.textContent = `
            .hero-walker-wrap {
                position: fixed;
                width: ${SPRITE_SIZE}px; height: ${SPRITE_SIZE}px;
                pointer-events: none; z-index: 99999;
                opacity: 0;
                transition:
                    left ${WALK_MS}ms cubic-bezier(.25,.8,.3,1),
                    top ${WALK_MS}ms cubic-bezier(.25,.8,.3,1),
                    opacity 0.3s ease;
                filter: drop-shadow(0 6px 10px rgba(0,0,0,0.9))
                        drop-shadow(0 0 10px rgba(232,185,35,0.6));
            }
            .hero-walker-wrap.visible { opacity: 1; }
            .hero-walker-wrap.walking {
                filter: drop-shadow(0 6px 12px rgba(0,0,0,0.9))
                        drop-shadow(0 0 16px rgba(232,185,35,0.9));
            }
            .hero-walker-img {
                width: 100%; height: 100%;
                object-fit: contain;
                transform-origin: center bottom;
            }
            .hero-walker-wrap.walking .hero-walker-img {
                animation: heroWalkerBob 0.3s ease-in-out infinite;
            }
            @keyframes heroWalkerBob {
                0%,100% { transform: translateY(0); }
                50%     { transform: translateY(-5px); }
            }
            .hero-walker-wrap.facing-left .hero-walker-img { transform: scaleX(-1); }
            .hero-walker-wrap.facing-left.walking .hero-walker-img {
                animation: heroWalkerBobLeft 0.3s ease-in-out infinite;
            }
            @keyframes heroWalkerBobLeft {
                0%,100% { transform: scaleX(-1) translateY(0); }
                50%     { transform: scaleX(-1) translateY(-5px); }
            }
            .hero-walker-badge {
                position: absolute; bottom: -14px; left: 50%;
                transform: translateX(-50%);
                font-family: 'Cinzel', serif; font-size: 0.6rem;
                color: #e8b923; background: rgba(10,6,2,0.85);
                border: 1px solid rgba(201,162,39,0.5);
                border-radius: 8px; padding: 1px 6px;
                white-space: nowrap;
                text-shadow: 0 1px 2px #000;
                pointer-events: none;
            }
            .aldeia-icone.hero-target-pulse {
                animation: heroTargetPulse 0.9s ease-out;
            }
            @keyframes heroTargetPulse {
                0%,100% { filter: drop-shadow(0 0 0 rgba(232,185,35,0)); }
                50%     { filter: drop-shadow(0 0 28px rgba(232,185,35,0.95)); }
            }
        `;
        document.head.appendChild(style);
    }

    // ---------------- acesso seguro às globais ----------------
    function getSP() { try { if (typeof STORY_PROGRESS !== 'undefined') return STORY_PROGRESS; } catch(e){} return window.STORY_PROGRESS || null; }
    function getHC() { try { if (typeof STORY_HERO_CLASSES !== 'undefined') return STORY_HERO_CLASSES; } catch(e){} return window.STORY_HERO_CLASSES || null; }
    function getSS() { try { if (typeof SPRITES_STORY !== 'undefined') return SPRITES_STORY; } catch(e){} return window.SPRITES_STORY || null; }
    function getES() { try { if (typeof EMOJI_STORY !== 'undefined') return EMOJI_STORY; } catch(e){} return window.EMOJI_STORY || null; }

    // ---------------- visual ----------------
    function getAldeiaWrap() { return document.querySelector('.aldeia-visual-wrap'); }
    function getIcone(key) { return document.querySelector(`.aldeia-icone[data-id="${key}"]`); }
    function getAnchorIcone(el) { return el ? (el.querySelector('.aldeia-icone-icon') || el) : null; }

    // ---------------- herói ----------------
    function getSelectedHeroClass() {
        const sel = getSP()?.selectedHeroes;
        return (Array.isArray(sel) && sel[0]) ? sel[0] : null;
    }
    function getHeroSprite(cls) {
        if (!cls) return null;
        const hc = getHC(), ss = getSS();
        const key = hc?.[cls]?.spriteKey;
        if (key && ss?.[key]) {
            const url = ss[key];
            if (url && String(url).trim() !== '') return url;
        }
        try { if (typeof SPRITES !== 'undefined' && SPRITES[cls]) return SPRITES[cls]; } catch(e){}
        return null;
    }
    function getHeroEmoji(cls) {
        const key = getHC()?.[cls]?.spriteKey;
        return (key && getES()?.[key]) ? getES()[key] : '🧙';
    }
    function getHeroDisplayName(cls) {
        return getHC()?.[cls]?.displayName || cls || 'Herói';
    }

    // ---------------- ação ----------------
    function executarAcaoDireta(key) {
        const fns = {
            atos: ['renderAtosScreen'],
            oca: ['renderOcaScreenFiltered', 'renderOcaScreen'],
            loja: ['renderLojaScreenCompleta', 'renderLojaScreen'],
            ritual: ['renderRitualScreen'],
            bestiario: ['renderBestiaryScreen'],
            tesouraria: ['renderTesourariaScreen'],
            evento: ['renderEventoSemanalScreen'],
            coop: ['coopAbrirPainel'],
            pvp: ['pvpAbrirPainel']
        }[key] || [];
        for (const n of fns) if (typeof window[n] === 'function') { try { window[n](); return true; } catch(e){} }
        if (typeof window.enterAldeiaLocation === 'function') {
            try { window.enterAldeiaLocation(key); return true; } catch(e){}
        }
        return false;
    }

    // ---------------- posicionar ----------------
    function posicionarHeroNaAldeia() {
        // Se já existe conectado e visível → não recria
        const existente = document.getElementById('aldeiaHeroWalker');
        if (existente && existente.isConnected && existente.classList.contains('visible') && !existente.classList.contains('walking')) {
            return;
        }
        if (existente) existente.remove();
        heroElem = null;

        if (animando) return;
        if (!getAldeiaWrap()) return;

        const heroClass = getSelectedHeroClass();
        if (!heroClass) return;

        const ocaIcon = getIcone('oca');
        if (!ocaIcon) return;

        const anchor = getAnchorIcone(ocaIcon);
        const sprite = getHeroSprite(heroClass);
        const emoji  = getHeroEmoji(heroClass);
        const name   = getHeroDisplayName(heroClass);

        const wrap = document.createElement('div');
        wrap.id = 'aldeiaHeroWalker';
        wrap.className = 'hero-walker-wrap';
        wrap.setAttribute('data-hero', heroClass);

        if (sprite) {
            const img = document.createElement('img');
            img.className = 'hero-walker-img';
            img.src = sprite;
            img.alt = name;
            img.onerror = function () {
                this.outerHTML = `<div class="hero-walker-img" style="display:flex;align-items:center;justify-content:center;font-size:2.4rem;">${emoji}</div>`;
            };
            wrap.appendChild(img);
        } else {
            const img = document.createElement('div');
            img.className = 'hero-walker-img';
            img.textContent = emoji;
            img.style.cssText = 'display:flex;align-items:center;justify-content:center;font-size:2.4rem;';
            wrap.appendChild(img);
        }

        const badge = document.createElement('div');
        badge.className = 'hero-walker-badge';
        badge.textContent = name;
        wrap.appendChild(badge);

        const baseRect = anchor.getBoundingClientRect();
        const isMobile = window.innerWidth < 700;
        let x, y;
        if (isMobile) {
            x = baseRect.left + baseRect.width / 2 - SPRITE_SIZE / 2;
            y = baseRect.top - SPRITE_SIZE - 6;
        } else {
            x = baseRect.right + 8;
            y = baseRect.top + baseRect.height / 2 - SPRITE_SIZE / 2;
        }
        x = Math.max(4, Math.min(window.innerWidth  - SPRITE_SIZE - 4, x));
        y = Math.max(4, Math.min(window.innerHeight - SPRITE_SIZE - 4, y));

        wrap.style.left = x + 'px';
        wrap.style.top  = y + 'px';

        const screen = document.getElementById('storyScreen');
        (screen || document.body).appendChild(wrap);
        heroElem = wrap;

        requestAnimationFrame(() => {
            if (heroElem) heroElem.classList.add('visible');
        });
    }

    // ---------------- caminhada ----------------
    async function animarCaminhada(target) {
        return new Promise(resolve => {
            if (!heroElem || !target) { resolve(); return; }
            const tgt = target.getBoundingClientRect();
            const targetCenter = tgt.left + tgt.width / 2;
            const currentX = parseFloat(heroElem.style.left) || 0;
            const goRight = targetCenter > currentX;
            heroElem.classList.toggle('facing-left', !goRight);

            const dx = goRight ? tgt.right + 8 : tgt.left - SPRITE_SIZE - 8;
            const dy = tgt.top + tgt.height / 2 - SPRITE_SIZE / 2;

            target.classList.add('hero-target-pulse');
            heroElem.classList.add('walking');
            heroElem.style.left = dx + 'px';
            heroElem.style.top  = dy + 'px';

            setTimeout(() => {
                if (heroElem) heroElem.classList.remove('walking');
                target.classList.remove('hero-target-pulse');
                resolve();
            }, WALK_MS + 50);
        });
    }

    // ---------------- click ----------------
    function onClick(ev) {
        if (animando) {
            if (ev.target.closest('.aldeia-icone')) {
                ev.preventDefault();
                ev.stopImmediatePropagation();
            }
            return;
        }

        const icone = ev.target.closest('.aldeia-icone');
        if (!icone) return;
        if (icone.classList.contains('locked')) return;
        if (!getAldeiaWrap()) return;

        const key = icone.getAttribute('data-id');
        if (!key) return;

        const origOnClick = icone.onclick;
        ev.preventDefault();
        ev.stopImmediatePropagation();

        const acionarAcao = () => {
            if (typeof origOnClick === 'function') {
                try { origOnClick.call(icone); return; } catch (e) { console.warn('[v6.1] onclick erro:', e); }
            }
            executarAcaoDireta(key);
        };

        if (key === 'oca' || !heroElem) { acionarAcao(); return; }

        animando = true;
        (async () => {
            try {
                await animarCaminhada(icone);
                await new Promise(r => setTimeout(r, 150));
                if (heroElem) { heroElem.remove(); heroElem = null; }
                acionarAcao();
            } catch (e) { console.warn('[v6.1] erro:', e); acionarAcao(); }
            finally { setTimeout(() => { animando = false; }, 150); }
        })();
    }

    window.addEventListener('click', onClick, true);

    // ---------------- Observer principal (cria com debounce) ----------------
    function instalarObserverPrincipal() {
        const screen = document.getElementById('storyScreen');
        if (!screen) { setTimeout(instalarObserverPrincipal, 300); return; }
        const obs = new MutationObserver(() => {
            clearTimeout(_obsDebounce);
            _obsDebounce = setTimeout(() => {
                if (getAldeiaWrap()
                    && !document.getElementById('aldeiaHeroWalker')
                    && !animando) {
                    posicionarHeroNaAldeia();
                }
            }, 350);
        });
        obs.observe(screen, { childList: true, subtree: true });
    }
    instalarObserverPrincipal();

    // ---------------- Guard observer (recupera IMEDIATAMENTE se removido) ----------------
    function instalarGuardObserver() {
        const screen = document.getElementById('storyScreen');
        if (!screen) { setTimeout(instalarGuardObserver, 300); return; }
        const guard = new MutationObserver(() => {
            if (animando) return;
            if (!getAldeiaWrap()) return;
            if (document.getElementById('aldeiaHeroWalker')) return;
            if (!heroElem) return;
            // Walker foi removido por algo externo → recria AGORA
            _removidosExternos++;
            if (_removidosExternos === 5 || _removidosExternos === 20) {
                console.warn(`[v6.1] Walker removido ${_removidosExternos}× por patch externo. Você ainda tem v3/v4/v5 rodando? Delete-os!`);
            }
            heroElem = null;
            posicionarHeroNaAldeia();
        });
        guard.observe(screen, { childList: true });  // só filhos diretos
    }
    instalarGuardObserver();

    // Tentativas iniciais
    setTimeout(posicionarHeroNaAldeia, 400);
    setTimeout(posicionarHeroNaAldeia, 1200);

    // Resize
    let rt = null;
    window.addEventListener('resize', () => {
        clearTimeout(rt);
        rt = setTimeout(() => {
            const el = document.getElementById('aldeiaHeroWalker');
            if (el && !el.classList.contains('walking') && getAldeiaWrap()) {
                el.remove();
                heroElem = null;
                posicionarHeroNaAldeia();
            }
        }, 250);
    });

    // ---------------- Debug ----------------
    window._forceWalker = function() {
        console.log('[v6.1] forçando...');
        _removidosExternos = 0;
        const el = document.getElementById('aldeiaHeroWalker');
        if (el) el.remove();
        heroElem = null;
        posicionarHeroNaAldeia();
        setTimeout(() => {
            const el2 = document.getElementById('aldeiaHeroWalker');
            console.log('[v6.1] DIAGNÓSTICO:', {
                aldeiaWrap: !!getAldeiaWrap(),
                ocaIcon: !!getIcone('oca'),
                heroClass: getSelectedHeroClass(),
                walkerNoDOM: !!el2,
                walkerVisivel: el2?.classList.contains('visible'),
                walkerAnimando: el2?.classList.contains('walking'),
                removidosExternos: _removidosExternos,
                pos: el2 ? { x: el2.getBoundingClientRect().x | 0, y: el2.getBoundingClientRect().y | 0 } : null
            });
        }, 200);
    };

    window._debugHeroWalker = function() {
        const el = document.getElementById('aldeiaHeroWalker');
        console.log('═══ [v6.1] ═══');
        console.log('Aldeia wrap?      ', !!getAldeiaWrap());
        console.log('Ícone OCA?        ', !!getIcone('oca'));
        console.log('Herói:            ', getSelectedHeroClass());
        console.log('Walker no DOM?    ', !!el);
        console.log('Walker visível?   ', el?.classList.contains('visible'));
        console.log('Walker animando?  ', el?.classList.contains('walking'));
        console.log('Animando (flag)?  ', animando);
        console.log('Removidos externos:', _removidosExternos);
        console.log('Papai do walker?  ', el?.parentElement?.id);
        console.log('═══════════════════');
    };

    console.log('✅ [v6.1] Walker instalado. Foco no visual novo + guard observer.');
})();
// =================================================================
// FIM — heroAldeiaWalker v6.1
// =================================================================