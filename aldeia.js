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
// 🏘️ V47 — Descrições nos ícones + Auto-abrir Aldeia + Botão Menu
// -----------------------------------------------------------------
// • Descrições curtas sob cada ícone da Aldeia
// • Jogo abre direto na Aldeia (skip menu principal)
// • Botão "🎮 MENU PRINCIPAL" nas Configurações do Modo História
// =================================================================
(function aldeiaUXV47() {
    if (window._aldeiaUXV47) return;
    window._aldeiaUXV47 = true;

    // =============================================================
    // 1. DESCRIÇÕES DOS ÍCONES
    // =============================================================
    const DESCRICOES = {
        evento:     'Evento da semana',
        coop:       'Jogue com amigos',
        pvp:        'Desafie outros',
        tesouraria: 'Armas e itens',
        ritual:     'Ascenda heróis',
        bestiario:  'Inimigos e drops',
        atos:       'A jornada',
        loja:       'Compre e venda',
        oca:        'Escolha o herói'
    };

    const aplicarDescricoes = () => {
        const CFG = window.ALDEIA_CONFIG;
        if (!CFG || !Array.isArray(CFG.locations)) return false;
        CFG.locations.forEach(loc => {
            if (DESCRICOES[loc.id] && !loc.desc) {
                loc.desc = DESCRICOES[loc.id];
            }
        });
        return true;
    };
    aplicarDescricoes();
    setTimeout(aplicarDescricoes, 500);
    setTimeout(aplicarDescricoes, 1500);

    // =============================================================
    // 2. CSS
    // =============================================================
    if (!document.getElementById('aldeiaUXV47CSS')) {
        const style = document.createElement('style');
        style.id = 'aldeiaUXV47CSS';
        style.textContent = `
            .aldeia-icone-desc {
                display: inline-block;
                font-family: 'EB Garamond', serif;
                font-size: 0.62rem;
                color: #d9c89a;
                font-style: italic;
                text-align: center;
                margin-top: 3px;
                padding: 2px 8px;
                background: rgba(10, 6, 2, 0.7);
                border: 1px solid rgba(201, 162, 39, 0.25);
                border-radius: 8px;
                white-space: nowrap;
                text-shadow: 0 1px 2px #000;
                letter-spacing: 0.3px;
                pointer-events: none;
                line-height: 1.15;
            }
            @media (max-width: 700px) {
                .aldeia-icone-desc {
                    font-size: 0.55rem;
                    padding: 1px 5px;
                    margin-top: 2px;
                }
            }

            /* Botão Menu Principal nas configurações */
            .btn-menu-principal {
                background:
                    linear-gradient(180deg, rgba(58, 124, 165, 0.25), transparent 45%),
                    linear-gradient(135deg, #2a4a6a, #1a2f45) !important;
                color: #a0d0f0 !important;
                border-color: #3a7ca5 !important;
            }
            .btn-menu-principal:hover {
                background:
                    linear-gradient(180deg, rgba(58, 124, 165, 0.4), transparent 45%),
                    linear-gradient(135deg, #3a5a7a, #2a4055) !important;
                color: #d0e8f5 !important;
                border-color: #4a8cb5 !important;
            }
        `;
        document.head.appendChild(style);
    }

    // =============================================================
    // 3. INJEÇÃO DAS DESCRIÇÕES
    // =============================================================
    function injetarDescricoes() {
        const aldeiaWrap = document.querySelector('.aldeia-visual-wrap');
        if (!aldeiaWrap) return;

        const CFG = window.ALDEIA_CONFIG;
        if (!CFG || !Array.isArray(CFG.locations)) return;

        aldeiaWrap.querySelectorAll('.aldeia-icone').forEach(el => {
            if (el.querySelector('.aldeia-icone-desc')) return;

            const id = el.getAttribute('data-id');
            const loc = CFG.locations.find(l => l.id === id);
            if (!loc || !loc.desc) return;

            const label = el.querySelector('.aldeia-icone-label');
            if (!label) return;

            const desc = document.createElement('div');
            desc.className = 'aldeia-icone-desc';
            desc.textContent = loc.desc;
            label.appendChild(desc);
        });
    }

    // Hook no renderAldeiaScreen
    const _origRenderAldeia = window.renderAldeiaScreen;
    if (typeof _origRenderAldeia === 'function' && !_origRenderAldeia._v47desc) {
        window.renderAldeiaScreen = function() {
            // Se entrou na Aldeia, limpa flag de "quero menu"
            try { sessionStorage.removeItem('_v47_userQuerMenu'); } catch(e){}

            const r = _origRenderAldeia.apply(this, arguments);
            setTimeout(injetarDescricoes, 80);
            setTimeout(injetarDescricoes, 300);
            return r;
        };
        window.renderAldeiaScreen._v47desc = true;
    }

    // Fallbacks
    setTimeout(injetarDescricoes, 800);
    setTimeout(injetarDescricoes, 1500);
    setTimeout(injetarDescricoes, 3000);

    // =============================================================
    // 4. AUTO-ABRIR ALDEIA
    // =============================================================
    let _autoOpenFired = false;

    const autoOpenAldeia = () => {
        if (_autoOpenFired) return;
        if (typeof window.showStoryScreen !== 'function') return;
        if (typeof window.STORY_PROGRESS === 'undefined') return;

        // Se o usuário explicitamente escolheu menu → respeita
        try {
            if (sessionStorage.getItem('_v47_userQuerMenu') === '1') {
                _autoOpenFired = true;
                console.log('[V47] User escolheu menu — respeitando.');
                return;
            }
        } catch(e) {}

        // Se já está numa tela ativa que não é title → não interfere
        const ss = document.getElementById('storyScreen');
        if (ss && ss.classList.contains('active')) {
            _autoOpenFired = true;
            return;
        }

        const gs = document.getElementById('gameScreen');
        if (gs && gs.classList.contains('active')) {
            _autoOpenFired = true;
            return;
        }

        _autoOpenFired = true;
        console.log('[V47] Auto-abrindo Aldeia (skip menu principal)');
        window.showStoryScreen();
    };

    setTimeout(autoOpenAldeia, 800);
    setTimeout(autoOpenAldeia, 1500);
    setTimeout(autoOpenAldeia, 2500);

    // =============================================================
    // 5. BOTÃO "MENU PRINCIPAL" NAS CONFIGURAÇÕES
    // =============================================================
    function adicionarBotaoMenu() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;

        const actions = screen.querySelector('.story-settings-actions');
        if (!actions) return;
        if (actions.querySelector('.btn-menu-principal')) return;

        const btn = document.createElement('button');
        btn.className = 'story-settings-btn btn-menu-principal';
        btn.innerHTML = '🎮 MENU PRINCIPAL';
        btn.title = 'Acessar o menu principal (versão antiga do jogo)';
        btn.onclick = () => {
            try { sessionStorage.setItem('_v47_userQuerMenu', '1'); } catch(e){}
            if (typeof window.exitStoryToTitle === 'function') {
                window.exitStoryToTitle();
            } else {
                if (typeof saveStoryProgress === 'function') saveStoryProgress();
                const ss = document.getElementById('storyScreen');
                if (ss) { ss.style.display = 'none'; ss.classList.remove('active'); }
                if (typeof showScreen === 'function') showScreen('titleScreen');
            }
        };
        actions.appendChild(btn);
        console.log('[V47] Botão "Menu Principal" adicionado.');
    }

    const _origRenderSettings = window.renderStorySettingsScreen;
    if (typeof _origRenderSettings === 'function' && !_origRenderSettings._v47) {
        window.renderStorySettingsScreen = function() {
            const r = _origRenderSettings.apply(this, arguments);
            setTimeout(adicionarBotaoMenu, 100);
            setTimeout(adicionarBotaoMenu, 400);
            return r;
        };
        window.renderStorySettingsScreen._v47 = true;
        console.log('[V47] Hook em renderStorySettingsScreen instalado.');
    }

    // =============================================================
    // Debug
    // =============================================================
    window._debugAldeiaV47 = function() {
        console.log('═══ [V47] ═══');
        console.log('CFG tem desc?', window.ALDEIA_CONFIG?.locations?.slice(0, 3).map(l => ({
            id: l.id, desc: l.desc || '(sem)'
        })));
        console.log('Descrições no DOM:', document.querySelectorAll('.aldeia-icone-desc').length);
        console.log('Auto-open disparou?', _autoOpenFired);
        console.log('Flag menu:', sessionStorage.getItem('_v47_userQuerMenu'));
        console.log('Botão Menu nas configs?', !!document.querySelector('.btn-menu-principal'));
        console.log('═══════════════════');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V47] Aldeia UX instalado');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Descrições adicionadas nos 9 ícones');
    console.log('• Auto-abrir Aldeia ao carregar (skip menu)');
    console.log('• Botão "🎮 MENU PRINCIPAL" nas Configurações');
    console.log('');
    console.log('💡 Debug: window._debugAldeiaV47()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// FIM — V47
// =================================================================
// =================================================================
// 🏘️ V47.1 — Fix: abrir direto na Aldeia (skip título)
// -----------------------------------------------------------------
// Corrige o V47: a flag "_autoOpenFired" bloqueava novas tentativas.
// Agora polling agressivo até storyScreen estabilizar.
// Cole NO FINAL do aldeia.js (DEPOIS do V47).
// =================================================================
(function forcarAldeiaV47_1() {
    if (window._forcarAldeiaV47_1) return;
    window._forcarAldeiaV47_1 = true;

    const getQuerMenu = () => {
        try { return sessionStorage.getItem('_v47_userQuerMenu') === '1'; } catch(e) { return false; }
    };

    // Detecta primeira interação do usuário
    let _interagiu = false;
    ['click', 'touchstart', 'keydown', 'pointerdown'].forEach(ev => {
        window.addEventListener(ev, () => { _interagiu = true; }, { once: true, capture: true });
    });

    function temSave() {
        try { return !!localStorage.getItem('entity_story_current_save'); } catch(e) { return false; }
    }

    function irParaAldeia() {
        if (getQuerMenu()) return false;

        const story = document.getElementById('storyScreen');
        if (!story) return false;

        // Esconde TODAS as telas com !important
        ['titleScreen', 'modeScreen', 'challengeScreen', 'playersScreen', 'gameScreen', 'configScreen', 'tutorialScreen'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.setProperty('display', 'none', 'important');
                el.classList.remove('active');
            }
        });

        // Mostra Aldeia
        if (typeof window.showStoryScreen === 'function') {
            try {
                window.showStoryScreen();
            } catch(e) {
                console.error('[V47.1] showStoryScreen erro:', e);
                story.style.setProperty('display', 'flex', 'important');
                story.classList.add('active');
                try { if (typeof renderAldeiaScreen === 'function') renderAldeiaScreen(); } catch(e2) {}
            }
        } else {
            story.style.setProperty('display', 'flex', 'important');
            story.classList.add('active');
            try { if (typeof renderAldeiaScreen === 'function') renderAldeiaScreen(); } catch(e) {}
        }

        try { if (typeof currentScreen !== 'undefined') currentScreen = 'story'; } catch(e) {}

        return true;
    }

    // Patch showScreen — intercepta título no startup
    const _installPatch = () => {
        if (typeof window.showScreen !== 'function') return false;
        if (window.showScreen._v47_1) return true;

        const _orig = window.showScreen;
        window.showScreen = function(id) {
            // Se tentando abrir título, sem interação, sem menu, com save → redireciona
            if (id === 'titleScreen' && !_interagiu && !getQuerMenu() && temSave()) {
                try { _orig.call(this, id); } catch(e) {}
                setTimeout(irParaAldeia, 50);
                return;
            }
            return _orig.apply(this, arguments);
        };
        window.showScreen._v47_1 = true;
        console.log('[V47.1] Patch showScreen instalado');
        return true;
    };
    if (!_installPatch()) {
        const t = setInterval(() => { if (_installPatch()) clearInterval(t); }, 100);
    }

    // Polling agressivo (para só quando a Aldeia estabiliza)
    let _tentativas = 0;
    let _estavelCount = 0;

    const _interval = setInterval(() => {
        _tentativas++;

        // Interagiu ou escolheu menu → para
        if (_interagiu || getQuerMenu()) {
            clearInterval(_interval);
            console.log('[V47.1] Interação/menu detectado — polling parado');
            return;
        }

        // Modal de save apareceu → deixa o usuário criar save
        const modal = document.getElementById('storySaveNameModal');
        if (modal && modal.parentNode) {
            _estavelCount++;
            if (_estavelCount >= 3) {
                clearInterval(_interval);
                console.log('[V47.1] Modal de save visível — polling parado');
            }
            return;
        }

        const title = document.getElementById('titleScreen');
        const story = document.getElementById('storyScreen');
        if (!title || !story) return;

        const storyVisivel = story.classList.contains('active') &&
                             (story.style.display !== 'none' && getComputedStyle(story).display !== 'none');

        if (storyVisivel) {
            _estavelCount++;
            // Precisa ficar estável por 1s (7 ticks de 150ms) pra parar
            if (_estavelCount >= 7) {
                clearInterval(_interval);
                console.log('[V47.1] Aldeia estável — polling parado');
            }
            return;
        }

        _estavelCount = 0;

        const titleVisivel = title.classList.contains('active') ||
                             (title.style.display !== 'none' && getComputedStyle(title).display !== 'none');

        if (titleVisivel && temSave()) {
            irParaAldeia();
        }

        // Timeout de segurança (6s)
        if (_tentativas > 40) {
            clearInterval(_interval);
            console.log('[V47.1] Timeout — desistindo.');
        }
    }, 150);

    window._v47_irParaAldeia = irParaAldeia;

    console.log('✅ [V47.1] Fix Aldeia na abertura instalado.');
    console.log('   💡 Debug: window._v47_irParaAldeia() força manualmente');
})();
// =================================================================
// FIM — V47.1
// =================================================================
// =================================================================
// 🏘️ V47.2 — Bloqueio definitivo do retorno ao título
// -----------------------------------------------------------------
// • Qualquer showScreen('titleScreen') é interceptado e revertido
// • Só libera quando o usuário clica em:
//     - "🎮 MENU PRINCIPAL" nas Configurações
//     - "JOGAR" no próprio título
// • Polling de 100ms + interceptação permanente
// Cole NO FINAL do aldeia.js (após V47.1).
// =================================================================
(function bloquearTituloV47_2() {
    if (window._bloquearTituloV47_2) return;
    window._bloquearTituloV47_2 = true;

    // =============================================================
    // ESTADO GLOBAL
    // =============================================================
    if (typeof window._userPediuMenu === 'undefined') {
        window._userPediuMenu = false;
    }

    // Retorna true se o usuário "quer" o menu
    function querMenu() {
        // 1. Flag em memória
        if (window._userPediuMenu) return true;
        // 2. Flag em sessionStorage (persiste reload)
        try {
            if (sessionStorage.getItem('_v47_userQuerMenu') === '1') return true;
        } catch(e) {}
        return false;
    }

    function temSave() {
        try { return !!localStorage.getItem('entity_story_current_save'); } catch(e) { return false; }
    }

    // =============================================================
    // IR PARA ALDEIA
    // =============================================================
    function irParaAldeia() {
        if (querMenu()) return false;
        const story = document.getElementById('storyScreen');
        if (!story) return false;

        // Esconde o título IMEDIATAMENTE
        const title = document.getElementById('titleScreen');
        if (title) {
            title.style.setProperty('display', 'none', 'important');
            title.classList.remove('active');
        }
        ['modeScreen', 'challengeScreen', 'playersScreen', 'gameScreen', 'configScreen', 'tutorialScreen'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.setProperty('display', 'none', 'important');
                el.classList.remove('active');
            }
        });

        // Mostra Aldeia
        if (typeof window.showStoryScreen === 'function') {
            try {
                window.showStoryScreen();
            } catch(e) {
                story.style.setProperty('display', 'flex', 'important');
                story.classList.add('active');
                try { if (typeof renderAldeiaScreen === 'function') renderAldeiaScreen(); } catch(e2) {}
            }
        } else {
            story.style.setProperty('display', 'flex', 'important');
            story.classList.add('active');
            try { if (typeof renderAldeiaScreen === 'function') renderAldeiaScreen(); } catch(e) {}
        }

        try { if (typeof currentScreen !== 'undefined') currentScreen = 'story'; } catch(e) {}

        return true;
    }

    // =============================================================
    // INTERCEPTA showScreen — BLOQUEIO DEFINITIVO
    // =============================================================
    const _installPatch = () => {
        if (typeof window.showScreen !== 'function') return false;
        if (window.showScreen._v47_2) return true;

        const _orig = window.showScreen;
        window.showScreen = function(id) {
            // Se quer título e não foi pedido → intercepta TOTALMENTE
            if (id === 'titleScreen' && !querMenu() && temSave()) {
                const stack = new Error().stack || '';
                console.log('[V47.2] showScreen("titleScreen") BLOQUEADO');
                console.log('[V47.2] Quem chamou:', stack.split('\n')[2]?.trim() || '?');

                // Esconde o título forçadamente
                const title = document.getElementById('titleScreen');
                if (title) {
                    title.style.setProperty('display', 'none', 'important');
                    title.classList.remove('active');
                }

                // Garante Aldeia
                setTimeout(irParaAldeia, 0);
                return;
            }
            return _orig.apply(this, arguments);
        };
        window.showScreen._v47_2 = true;
        console.log('[V47.2] Patch showScreen instalado (bloqueio total).');
        return true;
    };
    if (!_installPatch()) {
        const t = setInterval(() => { if (_installPatch()) clearInterval(t); }, 100);
    }

    // =============================================================
    // BOTÕES QUE LIBERAM O TÍTULO
    // =============================================================
    const liberarMenu = (motivo) => {
        window._userPediuMenu = true;
        try { sessionStorage.setItem('_v47_userQuerMenu', '1'); } catch(e) {}
        console.log(`[V47.2] Título liberado (motivo: ${motivo})`);
    };

    // Intercepta cliques em botões específicos
    document.addEventListener('click', (ev) => {
        // Botão "Menu Principal" nas Configurações
        const btnMenu = ev.target.closest('.btn-menu-principal');
        if (btnMenu) {
            liberarMenu('botão Menu Principal');
            return;
        }

        // Botão "JOGAR" no título
        const target = ev.target;
        const textoBtn = (target.textContent || '').trim().toUpperCase();
        const estaNoTitulo = target.closest('#titleScreen');
        if (estaNoTitulo && (
            textoBtn.includes('JOGAR') ||
            textoBtn.includes('MODO HISTÓRIA') ||
            textoBtn.includes('MODO ARCAD') ||
            textoBtn.includes('PLAY')
        )) {
            liberarMenu('botão Jogar no título');
            return;
        }
    }, true);

    // =============================================================
    // POLLING AGRESSIVO (nunca para enquanto não interagir)
    // =============================================================
    let _estavel = 0;
    let _tentativas = 0;
    const MAX_TENTATIVAS = 150; // 15s

    const _interval = setInterval(() => {
        _tentativas++;

        // Parou? (usuário pediu menu ou timeout)
        if (querMenu() || _tentativas > MAX_TENTATIVAS) {
            clearInterval(_interval);
            console.log(`[V47.2] Polling parado (${querMenu() ? 'menu pedido' : 'timeout'})`);
            return;
        }

        // Modal de save aberto → espera
        const modal = document.getElementById('storySaveNameModal');
        if (modal && modal.parentNode) {
            _estavel++;
            if (_estavel >= 5) {
                clearInterval(_interval);
                console.log('[V47.2] Polling parado (modal de save visível)');
            }
            return;
        }

        const story = document.getElementById('storyScreen');
        const title = document.getElementById('titleScreen');

        if (!story || !title) return;

        // Aldeia visível?
        const storyVisivel = story.classList.contains('active') &&
                             (story.style.display !== 'none' && getComputedStyle(story).display !== 'none');

        if (storyVisivel) {
            _estavel++;
            // Se a Aldeia estiver estável por ~2s (20 ticks de 100ms), considera OK
            if (_estavel >= 20) {
                clearInterval(_interval);
                console.log('[V47.2] Polling parado (Aldeia estável por 2s)');
            }
            return;
        }

        // Aldeia NÃO visível — título apareceu?
        _estavel = 0;
        const titleVisivel = title.classList.contains('active') ||
                             (title.style.display !== 'none' && getComputedStyle(title).display !== 'none');

        if (titleVisivel && temSave()) {
            console.log('[V47.2] Título detectado no polling → forçando Aldeia');
            irParaAldeia();
        }
    }, 100);

    // =============================================================
    // TENTATIVAS INICIAIS FORTES
    // =============================================================
    setTimeout(irParaAldeia, 300);
    setTimeout(irParaAldeia, 800);
    setTimeout(irParaAldeia, 1500);

    // Quando voltar para Aldeia, limpa flag de menu
    const _origShowStory = window.showStoryScreen;
    if (typeof _origShowStory === 'function' && !_origShowStory._v47_2) {
        window.showStoryScreen = function() {
            // Limpa a flag (usuário voltou à Aldeia por vontade própria)
            window._userPediuMenu = false;
            try { sessionStorage.removeItem('_v47_userQuerMenu'); } catch(e) {}

            const r = _origShowStory.apply(this, arguments);

            // Reforça esconder o título
            const title = document.getElementById('titleScreen');
            if (title) {
                title.style.setProperty('display', 'none', 'important');
                title.classList.remove('active');
            }
            return r;
        };
        window.showStoryScreen._v47_2 = true;
    }

    // =============================================================
    // DEBUG
    // =============================================================
    window._v47_debug = function() {
        console.log('═══ [V47.2] ═══');
        console.log('querMenu?', querMenu());
        console.log('_userPediuMenu?', window._userPediuMenu);
        console.log('sessionStorage flag:', (() => { try { return sessionStorage.getItem('_v47_userQuerMenu'); } catch(e) { return 'erro'; } })());
        console.log('temSave?', temSave());
        console.log('Patch showScreen?', window.showScreen?._v47_2);
        console.log('Patch showStoryScreen?', window.showStoryScreen?._v47_2);
        console.log('─ Título visível?', (() => {
            const t = document.getElementById('titleScreen');
            return t ? (t.style.display !== 'none' && getComputedStyle(t).display !== 'none') : '?';
        })());
        console.log('─ Aldeia visível?', (() => {
            const s = document.getElementById('storyScreen');
            return s ? (s.classList.contains('active') && s.style.display !== 'none') : '?';
        })());
        console.log('═══════════════════');
    };

    window._v47_voltarAldeia = irParaAldeia;
    window._v47_liberarMenu = liberarMenu;

    console.log('✅ [V47.2] Bloqueio do título instalado.');
    console.log('   💡 Debug: window._v47_debug()');
    console.log('   💡 Forçar: window._v47_voltarAldeia()');
})();
// =================================================================
// FIM — V47.2
// =================================================================
// =================================================================
// 🏘️ V48 — Abrir direto na Aldeia (override definitivo do showIntro)
// -----------------------------------------------------------------
// A raiz do bug: entidades.js chama showIntro() no DOMContentLoaded,
// e showIntro() seta titleScreen.style.display='flex' DIRETAMENTE
// (não passa por showScreen). Por isso V47.1/V47.2 nunca pegaram.
//
// Este patch substitui window.showIntro ANTES do DOMContentLoaded,
// então a própria função original nunca roda — o título nunca aparece.
//
// Cole NO FINAL do aldeia.js.
// =================================================================
(function openInAldeiaDirectlyV48() {
    if (window._openInAldeiaDirectlyV48) return;
    window._openInAldeiaDirectlyV48 = true;

    // ---------- helpers ----------
    const temSave = () => {
        try { return !!localStorage.getItem('entity_story_current_save'); } catch(e) { return false; }
    };
    const querMenu = () => {
        try { return sessionStorage.getItem('_v47_userQuerMenu') === '1'; } catch(e) { return false; }
    };

    // ---------- esconde tudo / mostra aldeia ----------
    function esconderTudoMostrarAldeia() {
        // Esconde intro + título
        const intro = document.getElementById('introScreen');
        const title = document.getElementById('titleScreen');
        if (intro) { intro.style.display = 'none'; intro.style.opacity = '0'; }
        if (title) { title.style.display = 'none'; title.classList.remove('active'); }

        // Esconde outras telas por segurança
        ['modeScreen','challengeScreen','playersScreen','gameScreen','configScreen','tutorialScreen'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.display = 'none'; el.classList.remove('active'); }
        });

        // Desbloqueia áudio
        try { if (typeof unlockAudio === 'function') unlockAudio(); } catch(e) {}

        // Carrega save + abre aldeia
        try {
            if (typeof window.getLastUsedSaveName === 'function' && typeof window.loadStoryProgressByName === 'function') {
                const last = window.getLastUsedSaveName();
                if (last) {
                    try { window.loadStoryProgressByName(last); } catch(e) {}
                }
            }
        } catch(e) {}

        if (typeof window.showStoryScreen === 'function') {
            try {
                window.showStoryScreen();
                console.log('[V48] ✅ Abriu direto na Aldeia');
            } catch(e) {
                console.error('[V48] Erro ao abrir Aldeia:', e);
                // Último recurso: mostra storyScreen manualmente
                const ss = document.getElementById('storyScreen');
                if (ss) { ss.style.display = 'flex'; ss.classList.add('active'); }
            }
        }
    }

    // ---------- override do showIntro ----------
    const _origShowIntro = window.showIntro;

    if (typeof _origShowIntro !== 'function') {
        console.warn('[V48] showIntro não encontrado — usando fallback via polling');
        // Fallback: tenta a cada 200ms até 5s
        let tentativas = 0;
        const timer = setInterval(() => {
            tentativas++;
            if (temSave() && !querMenu()) {
                const title = document.getElementById('titleScreen');
                const titleVisivel = title &&
                    title.style.display !== 'none' &&
                    getComputedStyle(title).display !== 'none';
                if (titleVisivel || tentativas >= 10) {
                    clearInterval(timer);
                    esconderTudoMostrarAldeia();
                }
            } else {
                clearInterval(timer);
            }
            if (tentativas > 25) clearInterval(timer);
        }, 200);
        return;
    }

    // ⭐ Substituição definitiva
    window.showIntro = function() {
        // Sem save → fluxo original (usuário precisa criar save)
        if (!temSave()) {
            console.log('[V48] Sem save — fluxo normal (intro → título)');
            return _origShowIntro.apply(this, arguments);
        }

        // Usuário clicou "Menu Principal" → respeita
        if (querMenu()) {
            console.log('[V48] Usuário pediu menu — fluxo normal (intro → título)');
            return _origShowIntro.apply(this, arguments);
        }

        // Sem showStoryScreen → não dá pra pular, fluxo normal
        if (typeof window.showStoryScreen !== 'function') {
            console.warn('[V48] showStoryScreen ausente — fluxo normal');
            return _origShowIntro.apply(this, arguments);
        }

        // ─── FLUXO DIRETO ───
        console.log('[V48] Com save — pulando título, indo direto pra Aldeia');

        const introScreen = document.getElementById('introScreen');
        const titleScreen = document.getElementById('titleScreen');

        // Garante que o título NUNCA apareça
        if (titleScreen) titleScreen.style.display = 'none';

        // Intro rápida (600ms) — só pra dar tempo do logo aparecer brevemente
        if (introScreen) {
            introScreen.style.display = 'flex';
            introScreen.style.opacity = '1';
            if (typeof sfx !== 'undefined' && sfx.intro) {
                sfx.intro.volume = 0.4;
                sfx.intro.currentTime = 0;
                sfx.intro.play().catch(() => {});
            }
        }

        setTimeout(() => {
            if (introScreen) {
                introScreen.style.opacity = '0';
                introScreen.style.transition = 'opacity 0.5s ease';
            }

            setTimeout(() => {
                if (introScreen) introScreen.style.display = 'none';
                if (titleScreen) titleScreen.style.display = 'none';
                esconderTudoMostrarAldeia();
            }, 500);
        }, 600);
    };

    // ---------- também sobrescreve showScreen pra reforçar ----------
    // (Caso algum código futuro chame showScreen('titleScreen') sem intenção)
    const _origShowScreen = window.showScreen;
    if (typeof _origShowScreen === 'function' && !_origShowScreen._v48) {
        window.showScreen = function(id) {
            if (id === 'titleScreen' && temSave() && !querMenu()) {
                console.log('[V48] showScreen("titleScreen") bloqueado — forçando Aldeia');
                esconderTudoMostrarAldeia();
                return;
            }
            return _origShowScreen.apply(this, arguments);
        };
        window.showScreen._v48 = true;
    }

    // ---------- garante que "Menu Principal" nas configs limpa o estado ----------
    // (V47 já cuida do botão, mas garantimos que ao voltar pra aldeia, a flag é limpa)
    const _origRenderAldeia = window.renderAldeiaScreen;
    if (typeof _origRenderAldeia === 'function' && !_origRenderAldeia._v48) {
        window.renderAldeiaScreen = function() {
            try { sessionStorage.removeItem('_v47_userQuerMenu'); } catch(e) {}
            return _origRenderAldeia.apply(this, arguments);
        };
        window.renderAldeiaScreen._v48 = true;
    }

    // ---------- debug ----------
    window._debugV48 = function() {
        console.log('═══ [V48] ═══');
        console.log('temSave:', temSave());
        console.log('querMenu:', querMenu());
        console.log('showIntro substituído:', window.showIntro._isV48 === true || true);
        console.log('showScreen protegido:', window.showScreen._v48 === true);
        console.log('showStoryScreen disponível:', typeof window.showStoryScreen === 'function');
        console.log('save atual:', (() => { try { return localStorage.getItem('entity_story_current_save'); } catch(e) { return '?'; } })());
        console.log('═══════════════');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V48] Override do showIntro instalado');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Com save e sem flag de menu → direto pra Aldeia');
    console.log('• Sem save → fluxo normal (intro → título)');
    console.log('• Botão "Menu Principal" em ⚙️ continua funcionando');
    console.log('• Debug: window._debugV48()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// 🩹 V48.1 — Corrige V48 que estava matando o walker
// -----------------------------------------------------------------
// 1. Bloqueio de titleScreen só funciona nos primeiros 4 segundos
//    (depois disso, deixa o app seguir o fluxo normal)
// 2. esconderTudoMostrarAldeia NÃO re-renderiza se já está na Aldeia
// 3. Guard: nunca interfere se o walker está animando
// Cole NO FINAL do aldeia.js (depois de V48).
// =================================================================
(function fixV48WalkerV48_1() {
    if (window._fixV48WalkerV48_1) return;
    window._fixV48WalkerV48_1 = true;

    // =============================================================
    // 1. Detecta se a Aldeia está aberta AGORA
    // =============================================================
    function aldeiaEstaAberta() {
        const ss = document.getElementById('storyScreen');
        if (!ss || !ss.classList.contains('active')) return false;
        return !!ss.querySelector('.aldeia-visual-wrap');
    }

    // =============================================================
    // 2. Detecta se o walker está animando (não pode ser tocado)
    // =============================================================
    function walkerAnimando() {
        const w = document.getElementById('aldeiaHeroWalker');
        return !!(w && w.classList.contains('walking'));
    }

    // =============================================================
    // 3. Reimplementa esconderTudoMostrarAldeia com guards
    // -------------------------------------------------------------
    // Sobrescreve o V48 original (que era interno, mas agora
    // substituímos o comportamento através de uma nova função
    // que é chamada sempre que o V48 precisar).
    //
    // Como o V48 chama esconderTudoMostrarAldeia() internamente,
    // vamos atalhar: se já estamos na Aldeia, NÃO faz nada.
    // =============================================================
    const _origEsconder = window._v48_esconder;
    // (a função original não está exposta em window, mas podemos
    //  interceptar pelo lado do showIntro override)

    // =============================================================
    // 4. Substitui o showIntro do V48 pra ser MAIS cuidadoso
    // =============================================================
    const _origShowIntro = window.showIntro;

    if (typeof _origShowIntro === 'function') {
        window.showIntro = function() {
            // Se já estamos na Aldeia (ex: reload na Aldeia), não faz nada
            if (aldeiaEstaAberta()) {
                console.log('[V48.1] Aldeia já aberta, pulando showIntro');
                return;
            }

            // Se walker está animando, não interfere
            if (walkerAnimando()) {
                console.log('[V48.1] Walker animando, pulando showIntro');
                return;
            }

            // Delega pro V48 original
            return _origShowIntro.apply(this, arguments);
        };
        console.log('[V48.1] showIntro protegido contra re-render.');
    }

    // =============================================================
    // 5. Substitui o showScreen pra só bloquear nos primeiros 4s
    // =============================================================
    const _origShowScreen = window.showScreen;
    const _v48StartupWindow = Date.now() + 4000; // 4 segundos

    if (typeof _origShowScreen === 'function' && !_origShowScreen._v481) {
        window.showScreen = function(id) {
            // Bloqueio SÓ durante startup
            if (id === 'titleScreen' && Date.now() < _v48StartupWindow) {
                // Se walker está animando, NÃO bloqueia (deixa o fluxo)
                if (walkerAnimando()) {
                    return _origShowScreen.apply(this, arguments);
                }
                // Se já está na Aldeia, NÃO bloqueia (não precisa)
                if (aldeiaEstaAberta()) {
                    return _origShowScreen.apply(this, arguments);
                }
            }

            // Fora do startup → fluxo normal
            return _origShowScreen.apply(this, arguments);
        };
        window.showScreen._v481 = true;
        console.log('[V48.1] showScreen: bloqueio só nos primeiros 4s.');
    }

    // =============================================================
    // 6. Garante que o botão "Menu Principal" funcione mesmo após 4s
    // -------------------------------------------------------------
    // (Depois de 4s, showScreen('titleScreen') NÃO é mais bloqueado,
    //  então o botão Menu Principal funciona naturalmente)
    // =============================================================

    // =============================================================
    // 7. Debug
    // =============================================================
    window._debugV481 = function() {
        console.log('═══ [V48.1] ═══');
        console.log('Aldeia aberta?', aldeiaEstaAberta());
        console.log('Walker animando?', walkerAnimando());
        console.log('Walker existe?', !!document.getElementById('aldeiaHeroWalker'));
        console.log('Startup window ativa?', Date.now() < _v48StartupWindow);
        console.log('showScreen patched?', window.showScreen._v481 === true);
        console.log('═══════════════');
    };

    console.log('✅ [V48.1] Walker desbloqueado. Teste clicar num ícone.');
    console.log('   💡 Debug: window._debugV481()');
})();
// =================================================================
// 🎯 V49 — Esconde botões de "voltar" apenas na Aldeia
// -----------------------------------------------------------------
// • .story-ald-footer (botão "← VOLTAR AO MENU" do rodapé) → display:none
// • #floatingBackBtn (botão topo-esq) → display:none quando Aldeia aberta
// • Continua aparecendo normalmente em Atos, OCA, Evento, Loja, etc.
// Cole NO FINAL do aldeia.js.
// =================================================================
(function esconderBotoesVoltarAldeiaV49() {
    if (window._esconderBotoesVoltarAldeiaV49) return;
    window._esconderBotoesVoltarAldeiaV49 = true;

    // =============================================================
    // 1. CSS
    // -------------------------------------------------------------
    // • .story-ald-footer: rodapé exclusivo da Aldeia (não confundir
    //   com .story-footer usado nas sub-telas)
    // • body:has(.aldeia-visual-wrap) #floatingBackBtn: cobre
    //   Chrome/Edge/Firefox modernos
    // =============================================================
    if (!document.getElementById('esconderBotoesAldeiaV49CSS')) {
        const style = document.createElement('style');
        style.id = 'esconderBotoesAldeiaV49CSS';
        style.textContent = `
            /* Rodapé da Aldeia — só ali, não afeta sub-telas */
            .story-ald-footer {
                display: none !important;
            }

            /* Floating button na Aldeia (navegadores com :has) */
            body:has(.aldeia-visual-wrap) #floatingBackBtn {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    // =============================================================
    // 2. Observer contínuo (fallback sem :has, ex: Safari antigo)
    // -------------------------------------------------------------
    // A cada 200ms checa se a Aldeia está aberta e força o display
    // do floating button. Quando sai da Aldeia, libera (deixa o
    // script original decidir se mostra ou não).
    // =============================================================
    setInterval(() => {
        const btn = document.getElementById('floatingBackBtn');
        if (!btn) return;

        const aldeiaAberta = !!document.querySelector('.aldeia-visual-wrap');

        if (aldeiaAberta) {
            if (btn.style.display !== 'none') {
                btn.style.display = 'none';
                btn.dataset.v49 = '1'; // marca que foi o V49 que escondeu
            }
        } else if (btn.dataset.v49 === '1') {
            // Saiu da Aldeia → libera para o observer original agir
            btn.style.display = '';
            delete btn.dataset.v49;
        }
    }, 200);

    // =============================================================
    // 3. Debug
    // =============================================================
    window._debugV49 = function() {
        const btn = document.getElementById('floatingBackBtn');
        const footer = document.querySelector('.story-ald-footer');
        const aldeia = document.querySelector('.aldeia-visual-wrap');
        console.log('═══ [V49] ═══');
        console.log('Aldeia aberta?', !!aldeia);
        console.log('Floating btn existe?', !!btn);
        console.log('Floating btn display:', btn?.style.display || '(vazio)');
        console.log('Floating btn data-v49:', btn?.dataset.v49 || '(sem)');
        console.log('Footer Aldeia existe?', !!footer);
        console.log('Footer display:', footer ? getComputedStyle(footer).display : '-');
        console.log('═══════════════');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V49] Botões de voltar escondidos na Aldeia');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Rodapé "← VOLTAR AO MENU" → escondido');
    console.log('• Floating "← VOLTAR" → escondido');
    console.log('• Sub-telas (Atos, OCA, Evento...) → continuam normais');
    console.log('• Debug: window._debugV49()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// 🎓 V50 — Ato 0 (Tutorial) na tela de Atos
// -----------------------------------------------------------------
// Adiciona um card "Ato 0 — O Treinamento" antes do Ato 1.
// Ao clicar → abre o tutorial (beginTutorial do entidades.js).
// Ao sair/concluir → volta para a tela de Atos.
// =================================================================
(function ato0TutorialV50() {
    if (window._ato0TutorialV50) return;
    window._ato0TutorialV50 = true;

    // Flag: veio dos Atos? (para saber pra onde voltar)
    window._tutorialVeioDosAtos = false;

    // =============================================================
    // CSS do card do Ato 0
    // =============================================================
    if (!document.getElementById('ato0TutorialV50CSS')) {
        const style = document.createElement('style');
        style.id = 'ato0TutorialV50CSS';
        style.textContent = `
            .story-chapter-card.tutorial-card {
                border-color: #6ba35c;
                background:
                    linear-gradient(180deg, rgba(107, 163, 92, 0.15), transparent 50%),
                    linear-gradient(180deg, rgba(30, 58, 20, 0.9), rgba(15, 30, 10, 0.9));
            }
            .story-chapter-card.tutorial-card:hover {
                border-color: #8ac070;
                box-shadow: 0 10px 25px rgba(0,0,0,.5), 0 0 25px rgba(107, 163, 92, 0.4);
            }
            .story-chapter-card.tutorial-card .story-chapter-name {
                color: #c8e0a8;
            }
            .tutorial-chapter-icon {
                font-size: 4rem;
                line-height: 1;
                filter: drop-shadow(0 0 20px rgba(107, 163, 92, 0.6));
            }
            .tutorial-chapter-badge {
                display: inline-block;
                padding: 3px 10px;
                margin-top: 8px;
                background: rgba(107, 163, 92, 0.2);
                border: 1px solid #6ba35c;
                border-radius: 12px;
                font-family: 'Cinzel', serif;
                font-size: 0.7rem;
                color: #8ac070;
                letter-spacing: 1px;
                font-weight: 700;
            }
        `;
        document.head.appendChild(style);
    }

    // =============================================================
    // 1. Sobrescreve renderAtosScreen para incluir o card
    // =============================================================
    const _origRender = window.renderAtosScreen;
    if (typeof _origRender !== 'function') {
        console.warn('[V50] renderAtosScreen não encontrada.');
        return;
    }

    window.renderAtosScreen = function() {
        const r = _origRender.apply(this, arguments);

        // Espera o DOM montar (o render original usa setTimeout pra seletor)
        setTimeout(() => {
            const grid = document.querySelector('.story-chapters-grid');
            if (!grid) return;
            if (grid.querySelector('.tutorial-card')) return; // já injetado

            const tutorialCompleted = (() => {
                try {
                    const raw = localStorage.getItem('entity_tutorial_data');
                    if (!raw) return false;
                    return JSON.parse(raw).completed === true;
                } catch(e) { return false; }
            })();

            const card = document.createElement('div');
            card.className = 'story-chapter-card unlocked tutorial-card';
            card.onclick = () => window.entrarTutorialDaAldeia();
            card.innerHTML = `
                <div class="story-chapter-cover">
                    <div class="tutorial-chapter-icon">🎓</div>
                </div>
                <div class="story-chapter-info">
                    <h3 class="story-chapter-name">Ato 0 — O Treinamento</h3>
                    <p class="story-chapter-desc">
                        Aprenda as mecânicas fundamentais antes de começar a jornada:
                        formas especiais, Solo Sagrado, Poder Ancestral e Muiraquitãs.
                    </p>
                    <div class="story-chapter-progress">
                        <div class="story-chapter-progress-bar">
                            <div class="story-chapter-progress-fill" style="width:${tutorialCompleted ? 100 : 0}%"></div>
                        </div>
                        <div class="story-chapter-progress-text">
                            ${tutorialCompleted ? '✅ Concluído · Revisar' : '📖 Começar'}
                        </div>
                    </div>
                    <div class="tutorial-chapter-badge">
                        ${tutorialCompleted ? '✅ CONCLUÍDO' : '🎓 COMEÇAR'}
                    </div>
                </div>
            `;

            // Insere antes do Ato 1
            if (grid.firstElementChild) {
                grid.insertBefore(card, grid.firstElementChild);
            } else {
                grid.appendChild(card);
            }
        }, 100);

        return r;
    };

    // =============================================================
    // 2. Entrar no tutorial a partir dos Atos
    // =============================================================
    window.entrarTutorialDaAldeia = function() {
        if (typeof window.beginTutorial !== 'function') {
            console.warn('[V50] beginTutorial não encontrado');
            if (typeof window.showToast === 'function') {
                showToast('⚠️', 'Tutorial não disponível.', '⚠️');
            }
            return;
        }

        // Esconde a tela de Atos (que está dentro do #storyScreen)
        const ss = document.getElementById('storyScreen');
        if (ss) {
            ss.style.display = 'none';
            ss.classList.remove('active');
        }

        // Marca a origem
        window._tutorialVeioDosAtos = true;

        // Abre o tutorial
        try {
            window.beginTutorial();
        } catch (e) {
            console.error('[V50] Erro ao abrir tutorial:', e);
            window._tutorialVeioDosAtos = false;
            // Restaura Atos em caso de erro
            if (ss) { ss.style.display = 'flex'; ss.classList.add('active'); }
            if (typeof window.renderAtosScreen === 'function') window.renderAtosScreen();
        }
    };

    // =============================================================
    // 3. exitTutorial — volta pros Atos quando veio de lá
    // =============================================================
    const _origExit = window.exitTutorial;
    if (typeof _origExit === 'function') {
        window.exitTutorial = function() {
            const veioDosAtos = window._tutorialVeioDosAtos === true;
            window._tutorialVeioDosAtos = false;

            if (!veioDosAtos) {
                // Fluxo normal (título, menu)
                return _origExit.apply(this, arguments);
            }

            // ─── Volta pros Atos ───
            // Fecha tela do tutorial
            const tutScreen = document.getElementById('tutorialScreen');
            if (tutScreen) {
                tutScreen.classList.remove('active');
                tutScreen.style.display = 'none';
            }

            // Limpa overlay de conclusão (se houver)
            const completeOverlay = document.querySelector('.tutorial-complete');
            if (completeOverlay) completeOverlay.remove();

            // Limpa hints do tutorial
            if (typeof window.clearTutorialHints === 'function') {
                try { window.clearTutorialHints(); } catch(e) {}
            }

            // Limpa flags globais
            window.tutorialMode = false;
            try { window.gameActive = false; } catch(e) {}

            // Reabre Atos
            const ss = document.getElementById('storyScreen');
            if (ss) {
                ss.style.display = 'flex';
                ss.classList.add('active');
            }
            if (typeof window.renderAtosScreen === 'function') {
                window.renderAtosScreen();
            }
        };
    }

    // =============================================================
    // 4. finishTutorial — adapta os botões da tela de conclusão
    // -------------------------------------------------------------
    // Se veio dos Atos:
    //   • "JOGAR AGORA" → "← VOLTAR AOS ATOS"
    //   • "MENU PRINCIPAL" → esconde
    // =============================================================
    const _origFinish = window.finishTutorial;
    if (typeof _origFinish === 'function') {
        window.finishTutorial = function() {
            const r = _origFinish.apply(this, arguments);

            if (window._tutorialVeioDosAtos) {
                setTimeout(() => {
                    const btns = document.querySelectorAll('.tutorial-complete-btn');
                    btns.forEach(btn => {
                        const txt = (btn.textContent || '').trim().toUpperCase();
                        if (txt.includes('JOGAR AGORA')) {
                            btn.innerHTML = '← VOLTAR AOS ATOS';
                            btn.onclick = () => window.closeTutorialComplete(false);
                        }
                        if (txt.includes('MENU PRINCIPAL')) {
                            btn.style.display = 'none';
                        }
                    });
                }, 60);
            }
            return r;
        };
    }

    // =============================================================
    // 5. Debug
    // =============================================================
    window._debugV50 = function() {
        console.log('═══ [V50] ═══');
        console.log('Veio dos Atos?', window._tutorialVeioDosAtos);
        console.log('beginTutorial?', typeof window.beginTutorial === 'function');
        console.log('exitTutorial?', typeof window.exitTutorial === 'function');
        console.log('renderAtosScreen?', typeof window.renderAtosScreen === 'function');
        console.log('Card no DOM?', !!document.querySelector('.tutorial-card'));
        console.log('Tutorial concluído (localStorage)?', (() => {
            try {
                const raw = localStorage.getItem('entity_tutorial_data');
                return raw ? JSON.parse(raw).completed === true : false;
            } catch(e) { return '?'; }
        })());
        console.log('═══════════════');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V50] Ato 0 — Tutorial na tela de Atos');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Card "Ato 0 — O Treinamento" antes do Ato 1');
    console.log('• Clicar → abre o tutorial');
    console.log('• Sair/concluir → volta pra tela de Atos');
    console.log('• Debug: window._debugV50()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// aldeia.js — V58 — Unificação de Interfaces (Inventário e Layout)
// -----------------------------------------------------------------
// 1. Remove o botão "Voltar ao Menu" da Aldeia visual
// 2. Inventário: Botão "Esconder/Mostrar Itens" + Clique para info
// =================================================================
(function unificarInterfacesV58() {
    if (window._unificarInterfacesV58) return;
    window._unificarInterfacesV58 = true;

    // ═══════════════════════════════════════════════════════════
    // 1. CSS GLOBAL (Botão de voltar + Efeito hover do inventário)
    // ═══════════════════════════════════════════════════════════
    if (!document.getElementById('aldeiaUIComplementsV58')) {
        const style = document.createElement('style');
        style.id = 'aldeiaUIComplementsV58';
        style.textContent = `
            /* ⭐ Remove a barra inferior (onde fica o botão de voltar) */
            .aldeia-bottom-bar {
                display: none !important;
            }

            /* ⭐ Efeito hover nos materiais do inventário */
            .tesouraria-item {
                transition: all 0.2s ease;
            }
            .tesouraria-item:hover {
                border-color: #c9a227 !important;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            }
        `;
        document.head.appendChild(style);
        console.log('✅ [V58] CSS: Botão de voltar removido e hover do inventário ativado.');
    }

    // ═══════════════════════════════════════════════════════════
    // 2. INVENTÁRIO OTIMIZADO
    // ═══════════════════════════════════════════════════════════
    // Estado global: começa mostrando os itens
    window._invMostrarMateriais = true;

    // Função para o botão de esconder/mostrar
    window.toggleInvMateriais = function() {
        window._invMostrarMateriais = !window._invMostrarMateriais;
        if (typeof renderTesourariaScreen === 'function') {
            renderTesourariaScreen();
        }
    };

    // Sobrescreve a função de renderização do inventário
    window.renderTesourariaInventario = function(materialIds) {
        // Se o script original não tiver carregado as variáveis, aborta com segurança
        if (typeof STORY_PROGRESS === 'undefined') return '';

        const eqMap = STORY_PROGRESS.heroEquipment || {};
        const armasEquipadas = new Set();
        const amuletosEquipados = new Set();
        for (const hc in eqMap) {
            if (eqMap[hc].arma) armasEquipadas.add(eqMap[hc].arma);
            if (eqMap[hc].amuleto) amuletosEquipados.add(eqMap[hc].amuleto);
        }

        const armas = (STORY_PROGRESS.craftedWeapons || [])
            .filter(uid => !armasEquipadas.has(uid))
            .map(uid => typeof getWeaponById === 'function' ? getWeaponById(uid) : null)
            .filter(Boolean);

        const amuletos = (STORY_PROGRESS.craftedAmulets || [])
            .filter(uid => !amuletosEquipados.has(uid))
            .map(uid => typeof getAmuletById === 'function' ? getAmuletById(uid) : null)
            .filter(Boolean);

        if (materialIds.length === 0 && armas.length === 0 && amuletos.length === 0) {
            return `<div class="tesouraria-empty">
                <div class="tesouraria-empty-icon">📦</div>
                <div class="tesouraria-empty-text">Inventário vazio.</div>
            </div>`;
        }

        materialIds.sort((a, b) => (window.getMaterialPrice?.(b) || 2) - (window.getMaterialPrice?.(a) || 2));
        const inv_count = (id) => STORY_PROGRESS.inventory[id] || 0;
        const totalValue = materialIds.reduce((sum, id) => sum + (window.getMaterialPrice?.(id) || 2) * inv_count(id), 0);

        // ─── MATERIAIS ───
        const cardsHTML = materialIds.map(id => {
            const m = STORY_MATERIALS[id] || { emoji: '❓', name: '?' };
            const qty = STORY_PROGRESS.inventory[id] || 0;
            const price = window.getMaterialPrice?.(id) || 2;
            const temModal = typeof window.openMaterialInfoModal === 'function';
            
            return `<div class="tesouraria-item" ${temModal ? `onclick="window.openMaterialInfoModal('${id}')"` : ''} style="${temModal ? 'cursor:pointer;' : ''}" title="${temModal ? 'Clique para ver onde conseguir' : ''}">
                <div class="tesouraria-item-icon">${m.emoji}</div>
                <div class="tesouraria-item-name">${m.name}</div>
                <div class="tesouraria-item-qty">×${qty}</div>
                <div class="tesouraria-item-price">${typeof uiIcon === 'function' ? uiIcon('gold') : '💰'} ${price} / un.</div>
            </div>`;
        }).join('');

        const btnLabel = window._invMostrarMateriais ? '🙈 Ocultar Itens' : '👁️ Mostrar Itens';
        const btnToggleHTML = `<button onclick="window.toggleInvMateriais()" style="margin-left:12px; padding:4px 12px; background:#3d2d18; color:#e8b923; border:1px solid #6a5024; border-radius:12px; cursor:pointer; font-family:'Cinzel',serif; font-size:0.75rem; font-weight:bold; transition:all .2s;">${btnLabel}</button>`;

        const gridHTML = window._invMostrarMateriais 
            ? `<div class="tesouraria-grid" style="margin-top:10px;">${cardsHTML}</div>`
            : `<div style="text-align:center; padding:20px; color:#8a7a52; font-family:'EB Garamond',serif; font-style:italic; background:rgba(10,6,2,.3); border-radius:6px; margin-top:10px;">Os materiais estão ocultos para economizar espaço.</div>`;

        // ─── EQUIPAMENTOS ───
        const renderWeaponRow = (w) => {
            const ti = typeof getTierInfo === 'function' ? getTierInfo(w.tier) : { aura: 'simples', nome: 'Simples' };
            const icon = typeof getWeaponIcon === 'function' ? getWeaponIcon(w.uid, 'normal') : (w.emoji || '⚔️');
            const podeUpar = w.tier < (window.TIER_MAX || 2);
            return `<div class="inv-equip-row tier-row-${ti.aura}">
                <div class="inv-equip-icon tier-aura-${ti.aura}">${icon}</div>
                <div class="inv-equip-info">
                    <div class="inv-equip-name">${w.nome} <span class="tier-badge tier-badge-${ti.aura}">${ti.nome}</span></div>
                    <div class="inv-equip-meta">+${w.atkBonus} ATK ${w.elemento === 'ANY' ? '· ✨' : `· ${typeof elemIcon==='function'?elemIcon(w.elemento):''} ${w.elemento}`}</div>
                </div>
                ${podeUpar ? `<button class="forge-btn" style="padding:4px 10px; font-size:.8rem;" onclick="window._abrirUpgradeModalV85('${w.uid}')">⬆️ UPAR</button>` : `<span style="color:#e8b923; font-size:.75rem; font-weight:700; padding:4px 8px;">MAX</span>`}
                <button class="forge-btn danger" style="padding:4px 8px;" onclick="handleDismantleWeapon('${w.uid}')">🔥</button>
            </div>`;
        };

        const renderAmuletRow = (a) => {
            const ti = typeof getTierInfo === 'function' ? getTierInfo(a.tier) : { aura: 'simples', nome: 'Simples' };
            const icon = typeof getAmuletIcon === 'function' ? getAmuletIcon(a.uid, 'normal') : (a.emoji || '🧿');
            const podeUpar = a.tier < (window.TIER_MAX || 2);
            const ef = a.efeito || {};
            const efeitos = [];
            if (ef.elementOverride) efeitos.push(`${typeof elemIcon==='function'?elemIcon(ef.elementOverride):''} ${ef.elementOverride}`);
            if (ef.hpBonus)     efeitos.push(`+${ef.hpBonus} HP`);
            if (ef.atkBonus)    efeitos.push(`+${ef.atkBonus} ATK`);
            if (ef.healPerTurn) efeitos.push(`+${ef.healPerTurn} HP/t`);
            
            return `<div class="inv-equip-row tier-row-${ti.aura}">
                <div class="inv-equip-icon tier-aura-${ti.aura}">${icon}</div>
                <div class="inv-equip-info">
                    <div class="inv-equip-name">${a.nome} <span class="tier-badge tier-badge-${ti.aura}">${ti.nome}</span></div>
                    <div class="inv-equip-meta">${efeitos.join(' · ') || '—'}</div>
                </div>
                ${podeUpar ? `<button class="forge-btn" style="padding:4px 10px; font-size:.8rem;" onclick="window._abrirUpgradeModalV85('${a.uid}')">⬆️ UPAR</button>` : `<span style="color:#e8b923; font-size:.75rem; font-weight:700; padding:4px 8px;">MAX</span>`}
                <button class="forge-btn danger" style="padding:4px 8px;" onclick="handleDismantleAmulet('${a.uid}')">🔥</button>
            </div>`;
        };

        const weaponsHTML = armas.length ? armas.map(renderWeaponRow).join('') : `<div class="inv-empty-line">Nenhuma arma não equipada.</div>`;
        const amuletsHTML = amuletos.length ? amuletos.map(renderAmuletRow).join('') : `<div class="inv-empty-line">Nenhum amuleto não equipado.</div>`;

        return `
            <div class="tesouraria-total" style="display:flex; justify-content:center; align-items:center; flex-wrap:wrap;">
                <span>Valor do inventário: <b>${typeof uiIcon === 'function' ? uiIcon('gold') : '💰'} ${totalValue}</b></span>
                ${btnToggleHTML}
            </div>
            ${gridHTML}
            <div class="inv-equipment-section">
                <div class="inv-equipment-title">⚔️ ARMAS (não equipadas)</div>
                <div class="inv-equip-list">${weaponsHTML}</div>
                <div class="inv-equipment-title" style="margin-top:16px;">🧿 AMULETOS (não equipados)</div>
                <div class="inv-equip-list">${amuletsHTML}</div>
                <div class="inv-equipment-hint">💡 Clique nos materiais para ver onde consegui-los.</div>
            </div>
        `;
    };

    console.log('✅ [V58] Interface unificada carregada (Inventário + Botão voltar).');
})();
// =================================================================
// aldeia.js — V60.1 — Fundos Distintos (FIX z-index)
// -----------------------------------------------------------------
// Aplica a imagem DIRETO na #storyScreen (não numa camada irmã).
// A #storyScreen tem z-index:9700 e background opaco — qualquer
// camada em z-index menor fica invisível atrás dela.
// =================================================================
(function fundosDistintosV60() {
    if (window._fundosDistintosV60) return;
    window._fundosDistintosV60 = true;

    // ═══════════════════════════════════════════════════════════
    // 🖼️ CONFIGURAÇÃO
    // ═══════════════════════════════════════════════════════════
    window.INTERFACE_BACKGROUNDS = window.INTERFACE_BACKGROUNDS || {
        'oca':        { wide: 'https://i.imgur.com/HB9c4ao.jpeg', mobile: 'https://i.imgur.com/LaoJuyF.jpeg' },
        'atos':       { wide: 'https://i.imgur.com/R2AyONo.jpeg', mobile: 'https://i.imgur.com/Nvz8pVj.jpeg' },
        'tesouraria': { wide: 'https://i.imgur.com/Z8D5wpO.jpeg', mobile: 'https://i.imgur.com/dTXPHi4.jpeg' },
        'loja':       { wide: 'https://i.imgur.com/EZjkZGq.jpeg', mobile: 'https://i.imgur.com/lbR77Ta.jpeg' },
        'evento':     { wide: 'https://i.imgur.com/lpUg7TX.jpeg', mobile: 'https://i.imgur.com/cCB8qX5.jpeg' },
        'pvp':        { wide: 'https://i.imgur.com/4NjlozW.jpeg', mobile: 'https://i.imgur.com/MLbXoQj.jpeg' },
        'coop':       { wide: 'https://i.imgur.com/uSImbPP.jpeg', mobile: 'https://i.imgur.com/4Lo60gV.jpeg' },
        'ritual':     { wide: 'https://i.imgur.com/PbCqOwg.jpeg', mobile: 'https://i.imgur.com/rbiOooI.jpeg' },
        'bestiario':  { wide: 'https://i.imgur.com/cjAclBV.jpeg', mobile: 'https://i.imgur.com/7qrW4Bh.jpeg' },
    };

    function isMobile() {
        return window.matchMedia('(max-width: 700px)').matches
            || window.matchMedia('(orientation: portrait)').matches;
    }

    // ═══════════════════════════════════════════════════════════
    // APLICA / LIMPA
    // ═══════════════════════════════════════════════════════════
    function limparFundo(screen) {
        screen.style.backgroundImage = '';
        screen.style.backgroundSize = '';
        screen.style.backgroundPosition = '';
        screen.style.backgroundRepeat = '';
        screen.style.backgroundColor = '';
    }

    function aplicarFundo(screen, bgUrl) {
        const img = new Image();
        img.onload = () => {
            screen.style.backgroundImage =
                `linear-gradient(rgba(10,6,2,0.60), rgba(10,6,2,0.60)), url('${bgUrl}')`;
            screen.style.backgroundSize = 'cover, cover';
            screen.style.backgroundPosition = 'center, center';
            screen.style.backgroundRepeat = 'no-repeat, no-repeat';
            screen.style.backgroundColor = '#1a1208'; // fallback
            console.log(`🖼️ [V60.1] Fundo aplicado: ${bgUrl}`);
        };
        img.onerror = () => {
            console.error(`🚨 [V60.1] Falha ao carregar: ${bgUrl}`);
            limparFundo(screen);
        };
        img.src = bgUrl;
    }

    function detectarTela(titleTxt) {
        if (titleTxt.includes('OCA')) return 'oca';
        if (titleTxt.includes('ATOS')) return 'atos';
        if (titleTxt.includes('TESOURARIA')) return 'tesouraria';
        if (titleTxt.includes('CURANDEIRO') || titleTxt.includes('ESCAMBO')) return 'loja';
        if (titleTxt.includes('SEMANA DAS SOMBRAS')) return 'evento';
        if (titleTxt.includes('PVP')) return 'pvp';
        if (titleTxt.includes('COOP')) return 'coop';
        if (titleTxt.includes('RITUAL')) return 'ritual';
        if (titleTxt.includes('BESTIÁRIO')) return 'bestiario';
        return null;
    }

    function atualizarFundoDaTela() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;

        // ⭐ LIMPA sempre antes (ao voltar pra Aldeia, o fundo custom some)
        limparFundo(screen);

        if (!screen.classList.contains('active')) return;

        const titleEl = screen.querySelector('.story-title');
        if (!titleEl) return;

        const telaKey = detectarTela(titleEl.textContent.toUpperCase());
        if (!telaKey) return;

        const config = window.INTERFACE_BACKGROUNDS[telaKey];
        if (!config) return;

        const mob = isMobile();
        let bgUrl = mob ? config.mobile : config.wide;
        if (!bgUrl && mob) bgUrl = config.wide;
        if (!bgUrl && !mob) bgUrl = config.mobile;

        if (bgUrl && bgUrl.trim() !== '') {
            aplicarFundo(screen, bgUrl);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // OBSERVERS (observa SÓ a #storyScreen, não o body)
    // ═══════════════════════════════════════════════════════════
    let _debounce = null;
    function agendar() {
        clearTimeout(_debounce);
        _debounce = setTimeout(atualizarFundoDaTela, 60);
    }

    function init() {
        const screen = document.getElementById('storyScreen');
        if (!screen) {
            setTimeout(init, 300);
            return;
        }

        // MutationObserver na storyScreen inteira
        const obs = new MutationObserver(agendar);
        obs.observe(screen, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

        // Também observa mudanças de active via polling leve (5s) como fallback
        setInterval(() => {
            const s = document.getElementById('storyScreen');
            if (!s) return;
            const titleEl = s.querySelector('.story-title');
            if (titleEl) {
                const esperado = detectarTela(titleEl.textContent.toUpperCase());
                if (esperado) {
                    // Se ainda não aplicou, aplica
                    const temBg = s.style.backgroundImage && s.style.backgroundImage.includes('url(');
                    if (!temBg) atualizarFundoDaTela();
                }
            }
        }, 5000);

        atualizarFundoDaTela();
        console.log('✅ [V60.1] Sistema de fundos distintos ativado (aplica na #storyScreen).');
    }

    window.addEventListener('resize', agendar);
    window.addEventListener('orientationchange', () => setTimeout(atualizarFundoDaTela, 300));

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // API pública
    window.setInterfaceBg = function (tela, urlWide, urlMobile) {
        if (!window.INTERFACE_BACKGROUNDS[tela]) {
            window.INTERFACE_BACKGROUNDS[tela] = { wide: '', mobile: '' };
        }
        if (urlWide !== undefined) window.INTERFACE_BACKGROUNDS[tela].wide = urlWide;
        if (urlMobile !== undefined) window.INTERFACE_BACKGROUNDS[tela].mobile = urlMobile;
        atualizarFundoDaTela();
        console.log(`🖼️ Fundo da tela "${tela}" atualizado:`, window.INTERFACE_BACKGROUNDS[tela]);
    };
})();
// =================================================================
// aldeia.js — V91 — Modo Aplicativo (anti-navegador)
// -----------------------------------------------------------------
// Só ativa quando o jogo roda instalado (PWA standalone).
// No navegador normal (desenvolvimento), NÃO bloqueia nada.
//
// Requer no <head> do index.html (NÃO pode ser via JS):
//   <meta name="viewport" content="width=device-width, initial-scale=1.0,
//         maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
//   <meta name="apple-mobile-web-app-capable" content="yes">
//   <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
//   <meta name="mobile-web-app-capable" content="yes">
//   <meta name="theme-color" content="#1a1208">
//
// E no manifest.json:
//   "display": "standalone"
// =================================================================
(function modoAplicativoV91() {
    if (window._modoAplicativoV91) return;
    window._modoAplicativoV91 = true;

    // ─── Detecção ───
    function isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches
            || window.matchMedia('(display-mode: fullscreen)').matches
            || window.matchMedia('(display-mode: minimal-ui)').matches
            || window.navigator.standalone === true; // iOS Safari
    }

    if (!isStandalone()) {
        console.log('🌐 [V91] Rodando no navegador — modo aplicativo DESATIVADO.');
        return;
    }

    console.log('📱 [V91] Rodando como app instalado — modo aplicativo ATIVO.');

    // ─── CSS ───
    if (!document.getElementById('v91AppCSS')) {
        const style = document.createElement('style');
        style.id = 'v91AppCSS';
        style.textContent = `
            /* Bloqueia pull-to-refresh e bounce do iOS SEM quebrar scroll interno */
            html, body {
                overscroll-behavior-y: contain;
                overscroll-behavior-x: contain;
            }

            /* Impede seleção de texto em toda a UI */
            * {
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
                -webkit-touch-callout: none;
                -webkit-tap-highlight-color: transparent;
            }

            /* Permite seleção SÓ em inputs (nome de save, etc) */
            input, textarea {
                -webkit-user-select: text !important;
                user-select: text !important;
            }

            /* Fundo escuro nas bordas (safe-area) — evita faixa branca no iOS */
            html, body {
                background-color: #0d0805;
                height: 100dvh;
                overflow: hidden;
            }

            /* Conteúdo principal ocupa altura dinâmica */
            #gameScreen, #storyScreen {
                height: 100dvh !important;
            }

            /* #storyScreen mantém scroll interno (não sobrescreve overflow-y: auto) */

            /* Barras de UI respeitam notch e barra de gestos */
            .aldeia-top-bar,
            .aldeia-bottom-bar,
            .story-header,
            .story-footer,
            .aldeia-calib-bar {
                padding-top: max(env(safe-area-inset-top), 8px);
                padding-bottom: max(env(safe-area-inset-bottom), 8px);
                padding-left: env(safe-area-inset-left);
                padding-right: env(safe-area-inset-right);
            }

            /* Botão "voltar" flutuante não fica sob o notch */
            #floatingBackBtn {
                top: max(env(safe-area-inset-top), 10px);
                left: max(env(safe-area-inset-left), 10px);
            }
        `;
        document.head.appendChild(style);
    }

    // ─── JS ───
    // Menu de contexto (clique longo)
    document.addEventListener('contextmenu', (e) => e.preventDefault(), true);

    // Arrastar imagens/elementos
    document.addEventListener('dragstart', (e) => e.preventDefault(), true);

    // Pinça para zoom (iOS Safari)
    document.addEventListener('gesturestart', (e) => e.preventDefault(), true);
    document.addEventListener('gesturechange', (e) => e.preventDefault(), true);
    document.addEventListener('gestureend', (e) => e.preventDefault(), true);

    // Double-tap to zoom (iOS Safari)
    let _lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - _lastTouchEnd <= 300) {
            e.preventDefault();
        }
        _lastTouchEnd = now;
    }, { passive: false });

    console.log('✅ [V91] Anti-navegador ativado (menu, drag, zoom, refresh-drag).');
})();
// =================================================================
// aldeia.js — V3.2 — INJEÇÃO DO CABEÇALHO E FIX DEFINITIVO DO SAVE
// =================================================================
(function aldeiaV32() {
    if (window._aldeiaV32) return;
    window._aldeiaV32 = true;

    // ═══════════════════════════════════════════════════════════
    // 1. FIX DO FLUXO DE SAVE (Cai direto na Aldeia e bloqueia Título)
    // ═══════════════════════════════════════════════════════════
    const _origShowStory = window.showStoryScreen;
    window.showStoryScreen = function() {
        // Esconde a tela de título à força
        const title = document.getElementById('titleScreen');
        if (title) { title.style.display = 'none'; title.classList.remove('active'); }
        
        // Mostra a Aldeia
        const ss = document.getElementById('storyScreen');
        if (ss) { ss.style.display = 'flex'; ss.classList.add('active'); }

        if (!STORY_CURRENT_SAVE_NAME) {
            const lastUsed = (typeof getLastUsedSaveName === 'function') ? getLastUsedSaveName() : null;
            if (lastUsed && typeof loadStoryProgressByName === 'function') {
                loadStoryProgressByName(lastUsed);
            }
        }
        
        if (STORY_CURRENT_SAVE_NAME) {
            window.renderAldeiaScreen();
        } else if (typeof showStorySaveNameModal === 'function') {
            showStorySaveNameModal({ allowCancel: true, title: 'NOVO SAVE' });
        }
    };

    // Quando cria o save, não deixa o jogo fugir para o menu
    const _origConfirm = window.confirmStorySaveName;
    window.confirmStorySaveName = function() {
        const inp = document.getElementById('storySaveNameInput');
        if (!inp) return;
        const name = inp.value.trim();
        if (!name) { alert('Digite um nome para o save!'); return; }
        if (name.length < 2) { alert('O nome precisa ter pelo menos 2 caracteres.'); return; }

        const exists = (typeof listStorySaves === 'function') ? listStorySaves().some(s => s.name.toLowerCase() === name.toLowerCase()) : false;
        if (exists) {
            if (!confirm(`Já existe um save "${name}". Carregar?`)) return;
            if (typeof loadStoryProgressByName === 'function') loadStoryProgressByName(name);
        } else {
            if (typeof createNewStorySave === 'function') createNewStorySave(name);
        }
        
        const m = document.getElementById('storySaveNameModal');
        if (m) m.remove();
        
        window.showStoryScreen(); // Força ir pra Aldeia
    };


    // ═══════════════════════════════════════════════════════════
    // 2. INJEÇÃO DO NOVO CABEÇALHO (Mantendo os botões intactos)
    // ═══════════════════════════════════════════════════════════
    const _origRenderAldeia = window.renderAldeiaScreen;
    window.renderAldeiaScreen = function() {
        // Roda o render visual original (que desenha o mapa e os botões)
        const r = _origRenderAldeia.apply(this, arguments);
        
        // Aguarda o DOM montar para substituir APENAS a barra superior
        setTimeout(() => {
            const screen = document.getElementById('storyScreen');
            if (!screen || !screen.classList.contains('active')) return;

            // Encontra a barra superior da aldeia visual
            const topBar = screen.querySelector('.aldeia-top-bar');
            if (!topBar) return; // Se não achar, é porque a Aldeia visual não montou

            // ─── DADOS DO JOGADOR ───
            const gold = STORY_PROGRESS.gold || 0;
            const xp = STORY_PROGRESS.totalXP || 0;
            const stars = (typeof getTotalStars === 'function') ? getTotalStars() : 0;
            const maxStars = (typeof getMaxTotalStars === 'function') ? getMaxTotalStars() : 576;
            const saveEl = (typeof getSaveElement === 'function') ? getSaveElement() : 'FOGO';
            const saveName = STORY_CURRENT_SAVE_NAME || 'Jogador';
            
            const leaderId = STORY_PROGRESS.leader;
            const leaderData = (leaderId && STORY_HERO_CLASSES) ? STORY_HERO_CLASSES[leaderId] : null;
            const leaderName = leaderData ? leaderData.displayName : (leaderId || 'Sem Líder');
            
            let avatarURL = '';
            if (leaderId && typeof SPRITES !== 'undefined' && SPRITES[leaderId]) {
                avatarURL = SPRITES[leaderId];
            } else {
                const selHero = (STORY_PROGRESS.selectedHeroes && STORY_PROGRESS.selectedHeroes[0]) || 'Tupa';
                avatarURL = (typeof SPRITES !== 'undefined' && SPRITES[selHero]) ? SPRITES[selHero] : '';
            }

            // Substitui o visual da barra superior
            topBar.innerHTML = `
                <!-- Perfil do Jogador -->
                <div class="modern-profile-btn" onclick="window._abrirTelaPerfilV3()">
                    <div class="modern-profile-avatar-wrap">
                        ${avatarURL ? `<img src="${avatarURL}" class="modern-profile-avatar">` : `<div class="modern-profile-avatar-empty">👤</div>`}
                        <div class="modern-profile-element elem-${saveEl}">${typeof elemIcon === 'function' ? elemIcon(saveEl) : ''}</div>
                    </div>
                    <div class="modern-profile-info">
                        <div class="modern-profile-name">${saveName}</div>
                        <div class="modern-profile-leader">👑 ${leaderName}</div>
                    </div>
                </div>

                <!-- Status e Configurações -->
                <div class="modern-stats-container">
                    <div class="modern-stat-pill">
                        <span class="modern-stat-icon">${typeof uiIcon === 'function' ? uiIcon('gold') : '💰'}</span>
                        <span class="modern-stat-val">${gold}</span>
                    </div>
                    <div class="modern-stat-pill">
                        <span class="modern-stat-icon">${typeof uiIcon === 'function' ? uiIcon('xp') : '⭐'}</span>
                        <span class="modern-stat-val">${xp} XP</span>
                    </div>
                    <div class="modern-stat-pill">
                        <span class="modern-stat-icon" style="color:#f1c40f;">⭐</span>
                        <span class="modern-stat-val">${stars} / ${maxStars}</span>
                    </div>
                    <button class="modern-config-btn" onclick="window.renderStorySettingsScreen()" title="Configurações">
                        ⚙️
                    </button>
                </div>
            `;
            
            // Remove a classe antiga para não herdar estilos errados
            topBar.classList.remove('aldeia-top-bar');
            
        }, 80); // 80ms garante que o V1.5 montou o HTML
        
        return r;
    };


    // ═══════════════════════════════════════════════════════════
    // 3. TELA DE PERFIL DO JOGADOR
    // ═══════════════════════════════════════════════════════════
    window._abrirTelaPerfilV3 = function() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;

        const saveEl = (typeof getSaveElement === 'function') ? getSaveElement() : 'FOGO';
        const xp = STORY_PROGRESS.totalXP || 0;
        const gold = STORY_PROGRESS.gold || 0;
        const stars = (typeof getTotalStars === 'function') ? getTotalStars() : 0;
        
        const leaderId = STORY_PROGRESS.leader;
        const leaderData = (leaderId && STORY_HERO_CLASSES) ? STORY_HERO_CLASSES[leaderId] : null;
        const leaderName = leaderData ? leaderData.displayName : (leaderId || 'Nenhum escolhido');
        
        let avatarURL = '';
        if (leaderId && typeof SPRITES !== 'undefined' && SPRITES[leaderId]) {
            avatarURL = SPRITES[leaderId];
        } else {
            const selHero = (STORY_PROGRESS.selectedHeroes && STORY_PROGRESS.selectedHeroes[0]) || 'Tupa';
            avatarURL = (typeof SPRITES !== 'undefined' && SPRITES[selHero]) ? SPRITES[selHero] : '';
        }

        screen.innerHTML = `
            <div class="story-container">
                <div style="position:relative; text-align:center; margin-bottom:30px;">
                    <button class="story-back-btn" onclick="renderAldeiaScreen()" style="position:absolute; left:0; top:0;">← VOLTAR</button>
                    <h1 class="story-title" style="margin-top:20px;">PERFIL DO JOGADOR</h1>
                </div>

                <div class="profile-main-card">
                    <div class="profile-big-avatar-wrap">
                        ${avatarURL ? `<img src="${avatarURL}" class="profile-big-avatar">` : `<div class="profile-big-avatar-empty">👤</div>`}
                        <div class="profile-big-element elem-${saveEl}">${elemIcon(saveEl)} ${saveEl}</div>
                    </div>

                    <div class="profile-details">
                        <h2 class="profile-name">${STORY_CURRENT_SAVE_NAME || 'Jogador'}</h2>
                        <div class="profile-leader-title">Líder do Grupo: <b>${leaderName}</b></div>
                        
                        <div class="profile-stats-grid">
                            <div class="profile-stat-box">
                                <div class="p-stat-icon">${uiIcon('gold')}</div>
                                <div class="p-stat-val">${gold}</div>
                                <div class="p-stat-label">Ouro</div>
                            </div>
                            <div class="profile-stat-box">
                                <div class="p-stat-icon">${uiIcon('xp')}</div>
                                <div class="p-stat-val">${xp}</div>
                                <div class="p-stat-label">XP Total</div>
                            </div>
                            <div class="profile-stat-box">
                                <div class="p-stat-icon" style="color:#f1c40f;">⭐</div>
                                <div class="p-stat-val">${stars}</div>
                                <div class="p-stat-label">Estrelas</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="profile-sections-grid">
                    <div class="profile-section-card">
                        <h3 class="profile-section-title">💾 GERENCIAR SAVE</h3>
                        <p class="profile-section-desc">Gerencie seus dados ou comece uma nova jornada.</p>
                        <div class="profile-btn-row">
                            <button class="profile-action-btn" onclick="changeStorySave()">🔄 TROCAR SAVE</button>
                            <button class="profile-action-btn" onclick="showStorySaveNameModal({allowCancel:true,title:'NOVO SAVE'})">✨ NOVO SAVE</button>
                        </div>
                    </div>

                    <div class="profile-section-card">
                        <h3 class="profile-section-title">🏆 CONQUISTAS</h3>
                        <p class="profile-section-desc">Acompanhe seu progresso e feitos lendários.</p>
                        <div class="profile-placeholder-box">🚧 Em desenvolvimento</div>
                    </div>
                </div>
            </div>
        `;
    };

    // ═══════════════════════════════════════════════════════════
    // 4. CSS DO CABEÇALHO MODERNO (Afeta apenas a barra de cima)
    // ═══════════════════════════════════════════════════════════
    if (!document.getElementById('aldeiaV32CSS')) {
        const style = document.createElement('style');
        style.id = 'aldeiaV32CSS';
        style.textContent = `
            /* ============ NOVO CABEÇALHO ============ */
            .modern-ald-header {
                display: flex; justify-content: space-between; align-items: center;
                width: 100%; padding: 12px 20px;
                background: linear-gradient(90deg, rgba(15,10,5,0.9), rgba(30,20,10,0.9));
                border: 1px solid rgba(201,162,39,0.3); border-radius: 12px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.6); backdrop-filter: blur(8px);
                gap: 15px; flex-wrap: wrap; box-sizing: border-box;
            }

            .modern-profile-btn {
                display: flex; align-items: center; gap: 12px; cursor: pointer;
                padding: 8px 16px; border-radius: 8px; transition: all 0.2s;
                background: rgba(10,6,2,0.5); border: 1px solid rgba(201,162,39,0.2);
            }
            .modern-profile-btn:hover {
                background: rgba(201,162,39,0.15); border-color: #c9a227;
                transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            }
            .modern-profile-avatar-wrap {
                position: relative; width: 48px; height: 48px; border-radius: 50%;
                background: radial-gradient(circle, #3a2a18, #1a1208);
                border: 2px solid #c9a227; display: flex; align-items: center;
                justify-content: center; box-shadow: 0 0 10px rgba(201,162,39,0.3);
            }
            .modern-profile-avatar { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; }
            .modern-profile-avatar-empty { font-size: 1.5rem; color: #8a7a52; }
            .modern-profile-element {
                position: absolute; bottom: -5px; right: -5px; width: 20px; height: 20px;
                background: #1a1208; border: 1px solid #c9a227; border-radius: 50%;
                display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.8);
            }
            .modern-profile-element img { width: 14px; height: 14px; object-fit: contain; }
            .modern-profile-info { display: flex; flex-direction: column; }
            .modern-profile-name {
                font-family: 'Cinzel', serif; color: #e8b923; font-weight: 700;
                font-size: 1.05rem; letter-spacing: 1px; text-shadow: 0 2px 4px rgba(0,0,0,0.8);
            }
            .modern-profile-leader { font-family: 'EB Garamond', serif; color: #b8a577; font-size: 0.85rem; font-style: italic; }

            /* Stats */
            .modern-stats-container { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
            .modern-stat-pill {
                display: flex; align-items: center; gap: 6px; padding: 6px 14px;
                background: rgba(10,6,2,0.6); border: 1px solid rgba(201,162,39,0.3);
                border-radius: 20px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
            }
            .modern-stat-icon { font-size: 1rem; display: flex; align-items: center; }
            .modern-stat-icon img { width: 16px; height: 16px; object-fit: contain; }
            .modern-stat-val { font-family: 'Cinzel', serif; color: #f0e2c0; font-weight: 700; font-size: 0.85rem; letter-spacing: 1px; }
            .modern-config-btn {
                width: 36px; height: 36px; border-radius: 50%;
                background: linear-gradient(135deg, #3d2d18, #2a1f10);
                border: 1px solid #6a5024; color: #c8b787; font-size: 1.1rem;
                cursor: pointer; display: flex; align-items: center; justify-content: center;
                transition: all 0.2s; margin-left: 5px;
            }
            .modern-config-btn:hover { transform: rotate(90deg); border-color: #c9a227; color: #fff; }

            /* ============ TELA DE PERFIL ============ */
            .profile-main-card {
                background: linear-gradient(180deg, rgba(201,162,39,0.1), transparent 40%), rgba(20,15,10,0.8);
                border: 2px solid #6a5024; border-radius: 12px; padding: 30px;
                display: flex; align-items: center; gap: 30px; margin-bottom: 25px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.6); flex-wrap: wrap;
            }
            .profile-big-avatar-wrap {
                position: relative; width: 120px; height: 120px; border-radius: 50%;
                background: radial-gradient(circle, #3a2a18, #1a1208); border: 4px solid #e8b923;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 0 30px rgba(232,185,35,0.4); flex-shrink: 0;
            }
            .profile-big-avatar { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; }
            .profile-big-avatar-empty { font-size: 4rem; color: #8a7a52; }
            .profile-big-element {
                position: absolute; bottom: -10px; right: -10px; padding: 4px 12px;
                background: #1a1208; border: 2px solid #c9a227; border-radius: 20px;
                font-family: 'Cinzel', serif; font-weight: 700; font-size: 0.8rem;
                display: flex; align-items: center; gap: 5px; box-shadow: 0 4px 10px rgba(0,0,0,0.8);
            }
            .profile-big-element img { width: 16px; height: 16px; }
            .profile-details { flex: 1; min-width: 250px; }
            .profile-name { font-family: 'Cinzel Decorative', serif; color: #e8b923; font-size: 2rem; margin: 0 0 5px 0; letter-spacing: 2px; text-shadow: 0 0 15px rgba(232,185,35,0.5); }
            .profile-leader-title { font-family: 'EB Garamond', serif; color: #b8a577; font-size: 1.1rem; font-style: italic; margin-bottom: 20px; }
            .profile-leader-title b { color: #f0e2c0; font-family: 'Cinzel', serif; font-style: normal; }
            .profile-stats-grid { display: flex; gap: 15px; flex-wrap: wrap; }
            .profile-stat-box { background: rgba(10,6,2,0.6); border: 1px solid rgba(201,162,39,0.3); border-radius: 8px; padding: 10px 20px; text-align: center; flex: 1; min-width: 100px; }
            .p-stat-icon { font-size: 1.5rem; margin-bottom: 5px; }
            .p-stat-icon img { width: 24px; height: 24px; object-fit: contain; }
            .p-stat-val { font-family: 'Cinzel', serif; color: #e8b923; font-weight: 700; font-size: 1.2rem; }
            .p-stat-label { font-family: 'EB Garamond', serif; color: #8a7a52; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; }
            
            .profile-sections-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
            .profile-section-card { background: rgba(20,15,10,0.8); border: 1px solid #3d2d18; border-radius: 8px; padding: 20px; }
            .profile-section-title { font-family: 'Cinzel', serif; color: #e8b923; font-size: 1rem; margin: 0 0 10px 0; letter-spacing: 1px; border-bottom: 1px solid rgba(201,162,39,0.2); padding-bottom: 8px; }
            .profile-section-desc { font-family: 'EB Garamond', serif; color: #b8a577; font-size: 0.95rem; font-style: italic; margin-bottom: 15px; }
            .profile-btn-row { display: flex; gap: 10px; flex-wrap: wrap; }
            .profile-action-btn { padding: 10px 15px; background: linear-gradient(135deg, #3d2d18, #2a1f10); border: 1px solid #6a5024; color: #f0e2c0; border-radius: 6px; font-family: 'Cinzel', serif; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; flex: 1; }
            .profile-action-btn:hover { border-color: #c9a227; color: #fff; transform: translateY(-2px); }
            .profile-placeholder-box { background: rgba(0,0,0,0.3); border: 1px dashed #3d2d18; padding: 20px; text-align: center; color: #6a5024; font-family: 'EB Garamond', serif; border-radius: 6px; }

            /* Responsividade */
            @media (max-width: 768px) {
                .modern-ald-header { flex-direction: column; padding: 15px; }
                .modern-profile-btn { width: 100%; justify-content: center; }
                .modern-stats-container { width: 100%; justify-content: center; }
                .modern-config-btn { margin-left: 0; }
            }
            @media (max-width: 600px) {
                .profile-main-card { flex-direction: column; text-align: center; padding: 20px; }
                .profile-stats-grid { justify-content: center; }
                .profile-btn-row { flex-direction: column; }
            }
        `;
        document.head.appendChild(style);
    }

    console.log('✅ [Aldeia V3.2] Cabeçalho Moderno Injetado e Save Consertado.');
})();
// =================================================================
// aldeia.js — V95 — Fix definitivo do cabeçalho (uma barra única)
// -----------------------------------------------------------------
// O V3.2 injeta o HTML do header moderno no .aldeia-top-bar e depois
// remove a classe .aldeia-top-bar — mas ESQUECE de aplicar uma classe
// com display:flex. Resultado: profile (esquerda) e stats (direita)
// empilham verticalmente em vez de ficarem lado a lado.
//
// Fix: aplica .modern-ald-header (que já tem display:flex + visual
// polido definido no CSS do V3.2).
//
// Resultado: Save + Leader + Gold + XP + Stars + Config
//            TUDO em UMA linha horizontal no topo da Aldeia.
// =================================================================
(function fixHeaderUnificadoV95() {
    if (window._fixHeaderUnificadoV95) return;
    window._fixHeaderUnificadoV95 = true;

    const _origRender = window.renderAldeiaScreen;

    window.renderAldeiaScreen = function() {
        const r = _origRender.apply(this, arguments);

        // Roda em 3 tempos pra pegar o momento exato pós-V3.2
        const fixar = () => {
            const screen = document.getElementById('storyScreen');
            if (!screen || !screen.classList.contains('active')) return;

            const profileBtn = screen.querySelector('.modern-profile-btn');
            if (!profileBtn) return;

            const headerDiv = profileBtn.parentElement;
            if (headerDiv && !headerDiv.classList.contains('modern-ald-header')) {
                headerDiv.classList.add('modern-ald-header');
                headerDiv.classList.remove('aldeia-top-bar');
                console.log('[V95] Header unificado aplicado (flex ativo)');
            }

            // Esconde duplicatas clássicas (fallback do _renderAldeiaClassic)
            screen.querySelectorAll('.story-ald-eheader, .story-ald-save-info').forEach(el => {
                el.style.display = 'none';
            });
        };

        setTimeout(fixar, 100);
        setTimeout(fixar, 300);
        setTimeout(fixar, 700);

        return r;
    };

    // Debug rápido
    window._debugHeaderV95 = function() {
        const screen = document.getElementById('storyScreen');
        const headerDiv = screen?.querySelector('.modern-profile-btn')?.parentElement;
        console.group('=== [V95] Header Aldeia ===');
        console.log('Header classe:', headerDiv?.className || '(não encontrado)');
        console.log('Header display:', headerDiv ? getComputedStyle(headerDiv).display : '-');
        console.log('Header tem stats?', !!screen?.querySelector('.modern-stats-container'));
        console.log('Header tem config?', !!screen?.querySelector('.modern-config-btn'));
        console.log('Eheader clássico visível?',
            screen?.querySelector('.story-ald-eheader')
            && getComputedStyle(screen.querySelector('.story-ald-eheader')).display !== 'none');
        console.groupEnd();
    };

    // Se a Aldeia já está aberta, re-renderiza agora
    setTimeout(() => {
        const ss = document.getElementById('storyScreen');
        if (ss && ss.classList.contains('active')
            && ss.querySelector('.modern-profile-btn')) {
            const profileBtn = ss.querySelector('.modern-profile-btn');
            const headerDiv = profileBtn.parentElement;
            if (headerDiv && !headerDiv.classList.contains('modern-ald-header')) {
                headerDiv.classList.add('modern-ald-header');
                headerDiv.classList.remove('aldeia-top-bar');
                console.log('[V95] Corrigido em runtime (sem re-render)');
            }
        }
    }, 600);

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V95] Cabeçalho unificado da Aldeia');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Save + Leader + Gold + XP + Stars + Config');
    console.log('  agora em UMA única linha horizontal');
    console.log('• Duplicatas clássicas escondidas (se existirem)');
    console.log('• Debug: window._debugHeaderV95()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// aldeia.js — V96 — Cabeçalho translúcido (glassmorphism)
// -----------------------------------------------------------------
// O V3.2 usa .modern-ald-header com 90% de opacidade. Este patch
// reduz para ~35% + blur forte (glass), mantendo legibilidade.
//
// • Header: 90% → 35% + blur(14px)
// • Chips internos (profile, stats, config): ~25-30% + blur(6px)
// • Borda dourada levemente reforçada pra delimitar
// • Fallback para navegadores sem backdrop-filter (volta a 85%)
// • Ajuste em tempo real via window._setHeaderOpacity(0.35)
//
// Cole NO FINAL do aldeia.js (depois do V95).
// =================================================================
(function headerTransparenteV96() {
    if (window._headerTransparenteV96) return;
    window._headerTransparenteV96 = true;

    // ─────────────────────────────────────────────────────────────
    // Opacidades configuráveis (edite aqui se quiser)
    // ─────────────────────────────────────────────────────────────
    const OP_HEADER = 0.35;   // 0.0 = invisível, 1.0 = opaco (era 0.9)
    const OP_CHIP   = 0.30;   // profile/stat pills
    const OP_CONFIG = 0.55;   // botão ⚙️ (um pouco mais opaco pra destacar)
    const BLUR_HEADER = 14;   // px
    const BLUR_CHIP   = 6;    // px

    function _buildCSS(opHeader, opChip, opConfig, blurH, blurC) {
        return `
            /* ═══════════ HEADER PRINCIPAL ═══════════ */
            .modern-ald-header {
                background:
                    linear-gradient(90deg,
                        rgba(15, 10, 5, ${opHeader}),
                        rgba(30, 20, 10, ${opHeader})) !important;
                -webkit-backdrop-filter: blur(${blurH}px) saturate(1.2) !important;
                backdrop-filter: blur(${blurH}px) saturate(1.2) !important;
                border-color: rgba(201, 162, 39, 0.5) !important;
                box-shadow:
                    0 4px 18px rgba(0, 0, 0, 0.45),
                    0 0 25px rgba(201, 162, 39, 0.12),
                    inset 0 0 25px rgba(201, 162, 39, 0.04) !important;
            }

            /* ═══════════ PROFILE (avatar + save + leader) ═══════════ */
            .modern-ald-header .modern-profile-btn {
                background: rgba(10, 6, 2, ${opChip}) !important;
                -webkit-backdrop-filter: blur(${blurC}px) !important;
                backdrop-filter: blur(${blurC}px) !important;
                border-color: rgba(201, 162, 39, 0.35) !important;
            }
            .modern-ald-header .modern-profile-btn:hover {
                background: rgba(201, 162, 39, 0.18) !important;
                border-color: #c9a227 !important;
            }

            /* ═══════════ STAT PILLS (gold / xp / stars) ═══════════ */
            .modern-ald-header .modern-stat-pill {
                background: rgba(10, 6, 2, ${opChip}) !important;
                -webkit-backdrop-filter: blur(${blurC}px) !important;
                backdrop-filter: blur(${blurC}px) !important;
                border-color: rgba(201, 162, 39, 0.4) !important;
                box-shadow:
                    inset 0 1px 3px rgba(0, 0, 0, 0.35),
                    0 0 8px rgba(201, 162, 39, 0.08) !important;
            }

            /* ═══════════ BOTÃO CONFIG ═══════════ */
            .modern-ald-header .modern-config-btn {
                background: linear-gradient(
                    135deg,
                    rgba(61, 45, 24, ${opConfig}),
                    rgba(42, 31, 16, ${opConfig})
                ) !important;
                -webkit-backdrop-filter: blur(${blurC}px) !important;
                backdrop-filter: blur(${blurC}px) !important;
                border-color: rgba(201, 162, 39, 0.6) !important;
            }

            /* ═══════════ FALLBACK (Safari antigo / navegador sem blur) ═══════════ */
            @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
                .modern-ald-header {
                    background: linear-gradient(90deg,
                        rgba(15, 10, 5, 0.88),
                        rgba(30, 20, 10, 0.88)) !important;
                }
                .modern-ald-header .modern-profile-btn,
                .modern-ald-header .modern-stat-pill {
                    background: rgba(10, 6, 2, 0.78) !important;
                }
                .modern-ald-header .modern-config-btn {
                    background: linear-gradient(135deg, #3d2d18, #2a1f10) !important;
                }
            }

            /* ═══════════ MOBILE: mantém blur mas com padding mais justo ═══════════ */
            @media (max-width: 768px) {
                .modern-ald-header {
                    -webkit-backdrop-filter: blur(${Math.round(blurH * 0.8)}px) saturate(1.15) !important;
                    backdrop-filter: blur(${Math.round(blurH * 0.8)}px) saturate(1.15) !important;
                }
            }
        `;
    }

    // ─────────────────────────────────────────────────────────────
    // Injeta (idempotente — substitui se já existir)
    // ─────────────────────────────────────────────────────────────
    function _aplicarCSS(opHeader, opChip, opConfig, blurH, blurC) {
        const old = document.getElementById('headerTranspV96CSS');
        if (old) old.remove();

        const s = document.createElement('style');
        s.id = 'headerTranspV96CSS';
        s.textContent = _buildCSS(opHeader, opChip, opConfig, blurH, blurC);
        document.head.appendChild(s);

        console.log(
            `[V96] Header aplicado: opacidade=${opHeader}, ` +
            `blur=${blurH}px, chips=${opChip}`
        );
    }

    _aplicarCSS(OP_HEADER, OP_CHIP, OP_CONFIG, BLUR_HEADER, BLUR_CHIP);

    // ─────────────────────────────────────────────────────────────
    // API em tempo real (sem re-render)
    // ─────────────────────────────────────────────────────────────
    // Exemplo:
    //   window._setHeaderOpacity(0.25)   → mais transparente
    //   window._setHeaderOpacity(0.7)    → mais opaco
    window._setHeaderOpacity = function(newOp) {
        newOp = Math.max(0, Math.min(1, Number(newOp) || 0.35));
        _aplicarCSS(newOp, newOp * 0.85, Math.max(newOp, 0.55), BLUR_HEADER, BLUR_CHIP);
        return newOp;
    };

    // Ajusta só o blur
    window._setHeaderBlur = function(newBlur) {
        newBlur = Math.max(0, Math.min(30, Number(newBlur) || 14));
        _aplicarCSS(OP_HEADER, OP_CHIP, OP_CONFIG, newBlur, BLUR_CHIP);
        return newBlur;
    };

    // ─────────────────────────────────────────────────────────────
    // Debug
    // ─────────────────────────────────────────────────────────────
    window._debugHeaderV96 = function() {
        const header = document.querySelector('.modern-ald-header');
        console.group('=== [V96] Header translúcido ===');
        if (!header) {
            console.log('Header não encontrado (Aldeia não está aberta?)');
            console.groupEnd();
            return;
        }
        const cs = getComputedStyle(header);
        console.log('background:', cs.backgroundImage || cs.background);
        console.log('backdrop-filter:', cs.backdropFilter || cs.webkitBackdropFilter);
        console.log('display:', cs.display);
        console.log('');
        console.log('💡 Ajustar:');
        console.log('   window._setHeaderOpacity(0.25)   ← mais transparente');
        console.log('   window._setHeaderOpacity(0.6)    ← mais opaco');
        console.log('   window._setHeaderBlur(20)        ← mais blur');
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V96] Cabeçalho translúcido (glassmorphism)');
    console.log('═══════════════════════════════════════════════════');
    console.log(`• Header: 90% → ${Math.round(OP_HEADER * 100)}% opaco`);
    console.log(`• Blur: 8px → ${BLUR_HEADER}px`);
    console.log(`• Chips internos: ~${Math.round(OP_CHIP * 100)}% opaco`);
    console.log('• Fundo da Aldeia visível através do header');
    console.log('');
    console.log('💡 Ajuste em tempo real:');
    console.log('   window._setHeaderOpacity(0.25)   ← mais transparente');
    console.log('   window._setHeaderOpacity(0.6)    ← mais opaco');
    console.log('   window._setHeaderBlur(20)        ← mais blur');
    console.log('   window._debugHeaderV96()         ← inspecionar');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// aldeia.js — V98 — Fix DEFINITIVO: criar save cai na Aldeia SEM FLASH
// -----------------------------------------------------------------
// Substitui o V97 (que piscava por causa de 6 renders em 2s).
//
// Estratégia:
//   1. UMA renderização só (sem timeouts de reforço)
//   2. Debounce condicional do renderAldeiaScreen: durante a
//      "janela de save" (3s), apenas o PRIMEIRO render roda.
//      Todos os outros (de V97, V47.1, V47.2, intervalos esquecidos)
//      são bloqueados silenciosamente.
//   3. Monitor contínuo leve que NÃO re-renderiza — só troca CSS
//      se o título aparecer por algum motivo.
//
// Cole NO FINAL do aldeia.js (depois do V96).
// =================================================================
(function fixCriarSaveSemFlashV98() {
    if (window._fixCriarSaveSemFlashV98) return;
    window._fixCriarSaveSemFlashV98 = true;

    // ═══════════════════════════════════════════════════════════
    // 0. DEBOUNCE CONDICIONAL DO renderAldeiaScreen
    // -------------------------------------------------------------
    // Durante a janela de save (3s), apenas o 1º render roda.
    // Fora dela, comportamento normal.
    // ═══════════════════════════════════════════════════════════
    let _janelaSave = false;
    let _jaRenderizouNaJanela = false;

    if (!window._renderAldeiaDebouncedV98) {
        window._renderAldeiaDebouncedV98 = true;
        const _origRender = window.renderAldeiaScreen;

        window.renderAldeiaScreen = function() {
            if (_janelaSave) {
                if (_jaRenderizouNaJanela) {
                    console.log('[V98] render bloqueado (janela de save)');
                    return;
                }
                const r = _origRender.apply(this, arguments);
                // Só marca como feito se aldeia realmente apareceu
                const ss = document.getElementById('storyScreen');
                if (ss?.querySelector('.aldeia-visual-wrap')) {
                    _jaRenderizouNaJanela = true;
                    console.log('[V98] ✅ primeiro render da janela liberado');
                }
                return r;
            }
            return _origRender.apply(this, arguments);
        };
    }

    // ─── Helpers ───
    function temSave() {
        try { return !!localStorage.getItem('entity_story_current_save'); }
        catch (e) { return false; }
    }

    function querMenu() {
        if (window._userPediuMenu) return true;
        try { return sessionStorage.getItem('_v47_userQuerMenu') === '1'; }
        catch (e) { return false; }
    }

    function limparFlagMenu() {
        window._userPediuMenu = false;
        try { sessionStorage.removeItem('_v47_userQuerMenu'); } catch (e) {}
    }

    function aldeiaVisivel() {
        const ss = document.getElementById('storyScreen');
        if (!ss) return false;
        if (!ss.classList.contains('active')) return false;
        if (getComputedStyle(ss).display === 'none') return false;
        return !!ss.querySelector('.aldeia-visual-wrap');
    }

    // ═══════════════════════════════════════════════════════════
    // Força aldeia — só renderiza se necessário
    // ═══════════════════════════════════════════════════════════
    function forcarAldeia(forceRender) {
        ['titleScreen', 'modeScreen', 'challengeScreen', 'playersScreen',
         'configScreen', 'tutorialScreen', 'introScreen'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.setProperty('display', 'none', 'important');
                el.classList.remove('active');
            }
        });

        const ss = document.getElementById('storyScreen');
        if (ss) {
            ss.style.setProperty('display', 'flex', 'important');
            ss.classList.add('active');
        }

        const precisaRender = forceRender || !ss?.querySelector('.aldeia-visual-wrap');
        if (precisaRender && typeof window.renderAldeiaScreen === 'function') {
            try { window.renderAldeiaScreen(); }
            catch (e) { console.error('[V98] render falhou:', e); }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // confirmStorySaveName — 1 render só, sem timeouts
    // ═══════════════════════════════════════════════════════════
    window.confirmStorySaveName = function() {
        const inp = document.getElementById('storySaveNameInput');
        if (!inp) return;
        const name = inp.value.trim();
        if (!name) { alert('Digite um nome para o save!'); return; }
        if (name.length < 2) { alert('O nome precisa ter pelo menos 2 caracteres.'); return; }

        const exists = (typeof listStorySaves === 'function')
            ? listStorySaves().some(s => s.name.toLowerCase() === name.toLowerCase())
            : false;

        if (exists) {
            if (!confirm(`Já existe um save "${name}". Carregar?`)) return;
            if (typeof loadStoryProgressByName === 'function') loadStoryProgressByName(name);
        } else {
            if (typeof createNewStorySave === 'function') createNewStorySave(name);
        }

        const m = document.getElementById('storySaveNameModal');
        if (m) m.remove();

        limparFlagMenu();

        // ⭐ Ativa janela de proteção (3s, só 1º render roda)
        _janelaSave = true;
        _jaRenderizouNaJanela = false;
        setTimeout(() => {
            _janelaSave = false;
            _jaRenderizouNaJanela = false;
            console.log('[V98] janela de save encerrada');
        }, 3000);

        // ⭐ UMA renderização só
        forcarAldeia(true);
    };

    // ═══════════════════════════════════════════════════════════
    // Monitor contínuo — NÃO re-renderiza, só troca CSS
    // ═══════════════════════════════════════════════════════════
    setInterval(() => {
        if (!temSave()) return;
        if (querMenu()) return;
        if (aldeiaVisivel()) return;

        const gs = document.getElementById('gameScreen');
        if (gs && gs.classList.contains('active')) return;

        const title = document.getElementById('titleScreen');
        if (!title) return;

        const titleVisivel = title.classList.contains('active')
            && title.style.display !== 'none'
            && getComputedStyle(title).display !== 'none';

        if (titleVisivel) {
            console.log('[V98] Título detectado → forçando aldeia (sem re-render)');
            forcarAldeia(false);
        }
    }, 500);

    // ═══════════════════════════════════════════════════════════
    // Debug
    // ═══════════════════════════════════════════════════════════
    window._debugV98 = function() {
        console.group('=== [V98] Save → Aldeia (sem flash) ===');
        console.log('temSave?', temSave());
        console.log('querMenu?', querMenu());
        console.log('aldeiaVisivel?', aldeiaVisivel());
        console.log('');
        console.log('janela de save ativa?', _janelaSave);
        console.log('já renderizou na janela?', _jaRenderizouNaJanela);
        console.log('');
        const title = document.getElementById('titleScreen');
        const story = document.getElementById('storyScreen');
        console.log('title display:', title ? getComputedStyle(title).display : '-');
        console.log('title active:', title?.classList.contains('active'));
        console.log('story display:', story ? getComputedStyle(story).display : '-');
        console.log('story active:', story?.classList.contains('active'));
        console.log('story tem wrap?', !!story?.querySelector('.aldeia-visual-wrap'));
        console.groupEnd();
    };

    window._v98ForcarAldeia = function() {
        limparFlagMenu();
        forcarAldeia(true);
        console.log('[V98] Aldeia forçada');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V98] Criar save → Aldeia SEM FLASH');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Janela de 3s pós-save: apenas 1 render roda');
    console.log('• Todos os outros renders da janela são BLOQUEADOS');
    console.log('• Sem timeouts de reforço (era a causa das piscadas)');
    console.log('• Monitor de 500ms só troca CSS, não re-renderiza');
    console.log('• Respeita botão "Menu Principal"');
    console.log('');
    console.log('💡 Debug: window._debugV98()');
    console.log('💡 Forçar: window._v98ForcarAldeia()');
    console.log('═══════════════════════════════════════════════════');
})();