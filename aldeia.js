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