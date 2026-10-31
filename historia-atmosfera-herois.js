// historia.js — V8.5 — ATMOSFERA DO TABULEIRO (versão limpa)
// -----------------------------------------------------------------
// Um único CSS, sem conflitos, com posicionamento correto das
// partículas (percentual relativo ao container pai via top/bottom).
// =================================================================

// =================================================================
// 1. MAPA DE ATMOSFERA POR ATO
// =================================================================
const STORY_ATO_ATMOSPHERE = {
    1:  'atm-folhas',
    2:  'atm-nevoa-ambar',
    3:  'atm-agua',
    4:  'atm-brasas',
    5:  'atm-chamas',
    6:  'atm-poeira',
    7:  'atm-luar',
    8:  'atm-fumaca-roxa',
    9:  'atm-rio-bolhas',
    10: 'atm-tempestade',
    11: 'atm-estrelas',
    12: 'atm-sol',
    13: 'atm-abismo',
};

// =================================================================
// 2. CSS LIMPO
// =================================================================
(function injectCleanAtmosphereCSS() {
    const old = document.getElementById('atmosphereStyleClean');
    if (old) old.remove();

    const style = document.createElement('style');
    style.id = 'atmosphereStyleClean';
    style.textContent = `
        /* ============ BOARD ============ */
        #board {
            position: relative;
        }

        /* ============ CAMADAS ============ */
        #board > .board-atmosphere {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            border-radius: 6px;
            overflow: hidden;
            z-index: 0;
        }
        #board > .board-particles {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
            border-radius: 6px;
            z-index: 3;
        }
        #board > .grid {
            position: relative;
            z-index: 1;
        }
        #board > .token {
            z-index: 10;
        }
        #board > .story-fx,
        #board > [class*="fx-"] {
            z-index: 50;
        }

        /* ============ PARTÍCULAS ============ */
        .atm-particle {
            position: absolute;
            pointer-events: none;
            opacity: 0;
            will-change: top, bottom, left, transform, opacity;
        }

        /* 1. FOLHAS */
        .atm-particle.pt-folha {
            top: -30px;
            width: var(--p-size, 8px);
            height: var(--p-size, 8px);
            background: linear-gradient(135deg, #6a8a4a, #3a5020);
            border-radius: 50% 10% 50% 10%;
            box-shadow: 0 0 4px rgba(0,0,0,0.4);
            animation: folhaFall linear infinite;
        }
        @keyframes folhaFall {
            0%   { top: -30px;             transform: translateX(0) rotate(0deg); opacity: 0; }
            10%  { opacity: 0.85; }
            50%  { top: 50%;               transform: translateX(20px) rotate(180deg); opacity: 0.9; }
            90%  { opacity: 0.7; }
            100% { top: calc(100% + 30px); transform: translateX(-15px) rotate(360deg); opacity: 0; }
        }

        /* 2. NÉVOA ÂMBAR */
        .atm-particle.pt-poeira-ambar {
            bottom: -30px;
            width: var(--p-size, 5px);
            height: var(--p-size, 5px);
            background: radial-gradient(circle, #d9b840, rgba(217,184,64,0));
            border-radius: 50%;
            animation: poeiraFlutua ease-in-out infinite;
        }
        @keyframes poeiraFlutua {
            0%   { bottom: -30px;             transform: translateX(0) scale(0.6); opacity: 0; }
            30%  { opacity: 0.9; }
            50%  { bottom: 40%;               transform: translateX(15px) scale(1.1); opacity: 0.7; }
            80%  { opacity: 0.6; }
            100% { bottom: calc(100% + 30px); transform: translateX(-10px) scale(0.7); opacity: 0; }
        }

        /* 3. ÁGUA (BOLHAS) */
        .atm-particle.pt-bolha {
            bottom: -20px;
            width: var(--p-size, 8px);
            height: var(--p-size, 8px);
            background: radial-gradient(circle at 30% 30%, rgba(200,230,245,0.9), rgba(74,140,181,0.5) 60%, transparent 100%);
            border: 1px solid rgba(200,230,245,0.4);
            border-radius: 50%;
            animation: bolhaSobe ease-in infinite;
        }
        @keyframes bolhaSobe {
            0%   { bottom: -20px;             transform: translateX(0) scale(0.5); opacity: 0; }
            20%  { opacity: 0.9; }
            80%  { opacity: 0.7; }
            100% { bottom: calc(100% + 20px); transform: translateX(10px) scale(1.2); opacity: 0; }
        }

        /* 4. BRASAS */
        .atm-particle.pt-brasa {
            bottom: -20px;
            width: var(--p-size, 5px);
            height: var(--p-size, 5px);
            background: radial-gradient(circle, #fff5dc 0%, #e67e22 40%, #a83232 80%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 6px rgba(232, 110, 35, 0.8);
            animation: brasaSubindo ease-out infinite;
        }
        @keyframes brasaSubindo {
            0%   { bottom: -20px;             transform: translateX(0) scale(0.4); opacity: 0; }
            15%  { opacity: 1; }
            70%  { opacity: 0.9; }
            100% { bottom: calc(100% + 20px); transform: translateX(20px) scale(0.3); opacity: 0; }
        }

        /* 5. FAÍSCAS */
        .atm-particle.pt-faisca {
            bottom: -10px;
            width: var(--p-size, 4px);
            height: var(--p-size, 4px);
            background: #e8b923;
            border-radius: 50%;
            box-shadow: 0 0 8px #e8b923, 0 0 14px rgba(232,185,35,0.6);
            animation: faiscaPula ease-out infinite;
        }
        @keyframes faiscaPula {
            0%   { bottom: -10px;             transform: translateX(0) scale(0.3); opacity: 0; }
            20%  { opacity: 1; }
            60%  { opacity: 0.8; }
            100% { bottom: calc(100% + 10px); transform: translateX(30px) scale(0.2); opacity: 0; }
        }

        /* 6. POEIRA */
        .atm-particle.pt-poeira {
            left: -30px;
            width: var(--p-size, 6px);
            height: var(--p-size, 6px);
            background: radial-gradient(circle, rgba(180, 140, 90, 0.8), rgba(139,90,43,0));
            border-radius: 50%;
            animation: poeiraHorizontal linear infinite;
        }
        @keyframes poeiraHorizontal {
            0%   { left: -30px;              transform: translateY(0) scale(0.6); opacity: 0; }
            20%  { opacity: 0.7; }
            80%  { opacity: 0.6; }
            100% { left: calc(100% + 30px);  transform: translateY(-10px) scale(0.9); opacity: 0; }
        }

        /* 7. LUAR */
        .atm-particle.pt-luar {
            bottom: -20px;
            width: var(--p-size, 5px);
            height: var(--p-size, 5px);
            background: radial-gradient(circle, #d0e0f0, rgba(168,192,216,0));
            border-radius: 50%;
            box-shadow: 0 0 6px rgba(168,192,216,0.8);
            animation: luarSobe ease-in-out infinite;
        }
        @keyframes luarSobe {
            0%   { bottom: -20px;             transform: scale(0.5); opacity: 0; }
            30%  { opacity: 0.8; }
            70%  { opacity: 0.7; }
            100% { bottom: calc(100% + 20px); transform: scale(1); opacity: 0; }
        }

        /* 8. FUMAÇA ROXA + COGUMELOS */
        .atm-particle.pt-fumaca {
            bottom: -30px;
            width: var(--p-size, 14px);
            height: var(--p-size, 14px);
            background: radial-gradient(circle, rgba(142,68,173,0.7) 0%, rgba(90,42,112,0.4) 40%, transparent 75%);
            border-radius: 50%;
            filter: blur(3px);
            animation: fumacaSobe ease-in-out infinite;
        }
        @keyframes fumacaSobe {
            0%   { bottom: -30px;             transform: translateX(0) scale(0.5); opacity: 0; }
            30%  { opacity: 0.6; }
            70%  { opacity: 0.5; }
            100% { bottom: calc(100% + 30px); transform: translateX(20px) scale(1.4); opacity: 0; }
        }
        .atm-particle.pt-cogumelo {
            top: 50%;
            width: var(--p-size, 7px);
            height: var(--p-size, 7px);
            background: radial-gradient(circle, #c080e0 0%, #8e44ad 60%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(192,128,224,0.9);
            animation: cogumeloPisca ease-in-out infinite;
        }
        @keyframes cogumeloPisca {
            0%, 100% { opacity: 0.3; transform: scale(0.7); }
            50%      { opacity: 1;   transform: scale(1.2); }
        }

        /* 9. RIO */
        .atm-particle.pt-bolha-rio {
            bottom: -20px;
            width: var(--p-size, 8px);
            height: var(--p-size, 8px);
            background: radial-gradient(circle at 30% 30%, rgba(232,67,147,0.7), rgba(52,152,219,0.4) 60%, transparent 100%);
            border: 1px solid rgba(232, 67, 147, 0.5);
            border-radius: 50%;
            animation: bolhaRioSobe ease-in infinite;
        }
        @keyframes bolhaRioSobe {
            0%   { bottom: -20px;             transform: translateX(0) scale(0.5); opacity: 0; }
            20%  { opacity: 0.9; }
            80%  { opacity: 0.7; }
            100% { bottom: calc(100% + 20px); transform: translateX(-10px) scale(1.3); opacity: 0; }
        }

        /* 10. GOTAS */
        .atm-particle.pt-gota {
            top: -20px;
            width: 2px;
            height: 10px;
            background: linear-gradient(180deg, transparent, rgba(168, 192, 216, 0.9));
            animation: gotaCai linear infinite;
        }
        @keyframes gotaCai {
            0%   { top: -20px;             opacity: 0; }
            10%  { opacity: 0.9; }
            100% { top: calc(100% + 20px); opacity: 0.5; }
        }

        /* 11. ESTRELAS */
        .atm-particle.pt-estrela {
            top: 30%;
            width: var(--p-size, 5px);
            height: var(--p-size, 5px);
            background: radial-gradient(circle, #fff5dc, #f1c40f 60%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 8px #f1c40f;
            animation: estrelaPisca ease-in-out infinite;
        }
        @keyframes estrelaPisca {
            0%, 100% { opacity: 0.2; transform: scale(0.7); }
            50%      { opacity: 1;   transform: scale(1.3); }
        }

        /* 12. SOL */
        .atm-particle.pt-sol {
            bottom: -20px;
            width: var(--p-size, 7px);
            height: var(--p-size, 7px);
            background: radial-gradient(circle, #fff5dc 0%, #e8b923 50%, #a83232 100%);
            border-radius: 50%;
            box-shadow: 0 0 12px rgba(232, 185, 35, 0.9);
            animation: solFaisca ease-out infinite;
        }
        @keyframes solFaisca {
            0%   { bottom: -20px;             transform: translateX(0) scale(0.4); opacity: 0; }
            20%  { opacity: 1; }
            60%  { opacity: 0.9; }
            100% { bottom: calc(100% + 20px); transform: translateX(25px) scale(0.3); opacity: 0; }
        }

        /* 13. ABISMO */
        .atm-particle.pt-abismo {
            top: 40%;
            width: var(--p-size, 6px);
            height: var(--p-size, 6px);
            background: radial-gradient(circle, #c080e0, #6a1090 60%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 12px rgba(106, 16, 144, 0.9);
            animation: abismoFlutua ease-in-out infinite;
        }
        @keyframes abismoFlutua {
            0%, 100% { transform: translate(0, 0) scale(0.7); opacity: 0.5; }
            50%      { transform: translate(10px, -15px) scale(1.2); opacity: 1; }
        }

        /* ============ FUNDOS POR ATO ============ */
        .board-atmosphere.atm-folhas-bg {
            background: radial-gradient(ellipse at center, rgba(74,107,58,0.10) 0%, rgba(74,107,58,0.05) 40%, transparent 70%);
        }
        .board-atmosphere.atm-nevoa-ambar-bg {
            background:
                radial-gradient(ellipse at top, rgba(217,184,64,0.10), transparent 55%),
                radial-gradient(ellipse at bottom, rgba(74,60,30,0.20), transparent 60%);
        }
        .board-atmosphere.atm-agua-bg {
            background: linear-gradient(180deg, rgba(52,152,219,0.08) 0%, rgba(52,152,219,0.18) 50%, rgba(52,152,219,0.08) 100%);
        }
        .board-atmosphere.atm-brasas-bg {
            background: radial-gradient(ellipse at bottom, rgba(232,110,35,0.20) 0%, rgba(168,50,50,0.10) 40%, transparent 75%);
        }
        .board-atmosphere.atm-chamas-bg {
            background:
                linear-gradient(90deg, rgba(168,50,50,0.20) 0%, transparent 15%, transparent 85%, rgba(168,50,50,0.20) 100%),
                radial-gradient(ellipse at bottom, rgba(232,110,35,0.15), transparent 60%);
        }
        .board-atmosphere.atm-poeira-bg {
            background:
                radial-gradient(ellipse at top, rgba(217,184,64,0.06), transparent 55%),
                linear-gradient(180deg, rgba(139,90,43,0.10), rgba(74,60,30,0.15));
        }
        .board-atmosphere.atm-luar-bg {
            background:
                radial-gradient(ellipse at top, rgba(168,192,216,0.15), transparent 55%),
                linear-gradient(180deg, rgba(52,73,94,0.10), rgba(15,21,32,0.20));
        }
        .board-atmosphere.atm-fumaca-roxa-bg {
            background:
                radial-gradient(circle at 25% 70%, rgba(142,68,173,0.15), transparent 40%),
                radial-gradient(circle at 75% 30%, rgba(90,42,112,0.15), transparent 40%),
                linear-gradient(180deg, rgba(31,10,42,0.10), rgba(15,5,21,0.20));
        }
        .board-atmosphere.atm-rio-bolhas-bg {
            background: linear-gradient(180deg, rgba(232,67,147,0.05) 0%, rgba(52,152,219,0.12) 50%, rgba(232,67,147,0.08) 100%);
        }
        .board-atmosphere.atm-tempestade-bg {
            background:
                radial-gradient(ellipse at top, rgba(44,62,80,0.20), transparent 55%),
                linear-gradient(180deg, rgba(10,15,21,0.20), rgba(5,8,13,0.30));
        }
        .board-atmosphere.atm-estrelas-bg {
            background:
                radial-gradient(ellipse at top, rgba(241,196,15,0.10), transparent 55%),
                radial-gradient(ellipse at bottom, rgba(168,192,216,0.10), transparent 60%),
                linear-gradient(180deg, rgba(26,21,5,0.10), rgba(13,10,2,0.15));
        }
        .board-atmosphere.atm-sol-bg {
            background:
                radial-gradient(ellipse at top, rgba(230,126,34,0.20), transparent 60%),
                linear-gradient(180deg, rgba(217,184,64,0.10), rgba(168,50,50,0.10));
        }
        .board-atmosphere.atm-abismo-bg {
            background:
                radial-gradient(ellipse at center, rgba(80,20,120,0.20), transparent 60%),
                linear-gradient(180deg, rgba(26,8,37,0.20), rgba(10,4,18,0.30));
        }

        @media (prefers-reduced-motion: reduce) {
            .atm-particle { animation: none !important; }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS limpo da atmosfera injetado.');
})();

// =================================================================
// 3. GERADOR DE PARTÍCULAS
// =================================================================
function generateParticlesForAto(cid) {
    const atmClass = STORY_ATO_ATMOSPHERE[cid];
    if (!atmClass) return '';

    const makeParticles = (count, cls, opts = {}) => {
        let html = '';
        for (let i = 0; i < count; i++) {
            const left = Math.random() * 100;
            const delay = Math.random() * 6;
            const duration = 4 + Math.random() * 4;
            const size = opts.sizeMin + Math.random() * (opts.sizeMax - opts.sizeMin);

            html += `<div class="atm-particle ${cls}"
                          style="left:${left}%;animation-delay:-${delay}s;animation-duration:${duration}s;--p-size:${size}px;"></div>`;
        }
        return html;
    };

    switch (atmClass) {
        case 'atm-folhas':      return makeParticles(14, 'pt-folha',         { sizeMin:6,  sizeMax:12 });
        case 'atm-nevoa-ambar': return makeParticles(12, 'pt-poeira-ambar',  { sizeMin:3,  sizeMax:6  });
        case 'atm-agua':        return makeParticles(16, 'pt-bolha',         { sizeMin:4,  sizeMax:10 });
        case 'atm-brasas':      return makeParticles(18, 'pt-brasa',         { sizeMin:3,  sizeMax:6  });
        case 'atm-chamas':      return makeParticles(20, 'pt-faisca',        { sizeMin:2,  sizeMax:5  });
        case 'atm-poeira':      return makeParticles(14, 'pt-poeira',        { sizeMin:4,  sizeMax:8  });
        case 'atm-luar':        return makeParticles(12, 'pt-luar',          { sizeMin:3,  sizeMax:6  });
        case 'atm-fumaca-roxa': return makeParticles(10, 'pt-fumaca',        { sizeMin:8,  sizeMax:16 })
                                     + makeParticles(8,  'pt-cogumelo',      { sizeMin:5,  sizeMax:9  });
        case 'atm-rio-bolhas':  return makeParticles(20, 'pt-bolha-rio',     { sizeMin:4,  sizeMax:10 });
        case 'atm-tempestade':  return makeParticles(24, 'pt-gota',          { sizeMin:2,  sizeMax:4  });
        case 'atm-estrelas':    return makeParticles(20, 'pt-estrela',       { sizeMin:3,  sizeMax:7  });
        case 'atm-sol':         return makeParticles(16, 'pt-sol',           { sizeMin:4,  sizeMax:9  });
        case 'atm-abismo':      return makeParticles(16, 'pt-abismo',        { sizeMin:4,  sizeMax:8  });
        default:                return '';
    }
}

// =================================================================
// 4. APLICAR / LIMPAR ATMOSFERA
// =================================================================
function clearBoardAtmosphere() {
    const board = document.getElementById('board');
    if (!board) return;

    board.querySelectorAll(':scope > .board-atmosphere, :scope > .board-particles').forEach(el => el.remove());

    board.classList.forEach(cls => {
        if (cls.startsWith('atm-')) board.classList.remove(cls);
    });
    board.classList.remove('has-atmosphere');
}

function applyBoardAtmosphere(cid) {
    const board = document.getElementById('board');
    if (!board) return;
    if (!window._storyMode) return;
    if (!cid) return;

    clearBoardAtmosphere();

    const atmClass = STORY_ATO_ATMOSPHERE[cid];
    if (!atmClass) return;

    board.classList.add(atmClass);
    board.classList.add('has-atmosphere');

    // Camada de fundo
    const atmos = document.createElement('div');
    atmos.className = 'board-atmosphere ' + atmClass + '-bg';
    board.appendChild(atmos);

    // Camada de partículas
    const part = document.createElement('div');
    part.className = 'board-particles ' + atmClass + '-pt';
    part.innerHTML = generateParticlesForAto(cid);
    board.appendChild(part);

    // Reorganiza a ordem no DOM (grid primeiro, atmosfera, partículas)
    const grid = board.querySelector(':scope > .grid');
    if (grid && grid !== board.firstElementChild) {
        board.insertBefore(grid, board.firstElementChild);
    }

    console.log('[atmosfera] Aplicada no Ato', cid, '→', atmClass);
}

// =================================================================
// 5. HOOKS
// =================================================================
(function hookAtmosphereInit() {
    const _origInit = window.initStoryBattle;
    if (typeof _origInit !== 'function') return;

    window.initStoryBattle = async function() {
        await _origInit.apply(this, arguments);
        // Espera dois frames pra garantir que o DOM está pronto
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const cid = STORY_PROGRESS.currentChapter || 1;
        applyBoardAtmosphere(cid);
    };
})();

(function hookAtmosphereCleanup() {
    const _origFinish = window.finishStoryPhase;
    if (typeof _origFinish === 'function') {
        window.finishStoryPhase = function() {
            clearBoardAtmosphere();
            return _origFinish.apply(this, arguments);
        };
    }
    const _origReturn = window.returnFromStoryVictory;
    if (typeof _origReturn === 'function') {
        window.returnFromStoryVictory = function() {
            clearBoardAtmosphere();
            return _origReturn.apply(this, arguments);
        };
    }
})();

// =================================================================
// 6. TESTES
// =================================================================
window.testAtmosphere = function(cid) {
    cid = parseInt(cid) || 1;
    applyBoardAtmosphere(cid);
    console.log('[atmosfera] Testando Ato', cid);
};
window.clearAtmosphere = function() {
    clearBoardAtmosphere();
    console.log('[atmosfera] Limpa.');
};

console.log('✅ historia.js V8.5 — Atmosfera LIMPA carregada.');
// =================================================================
// historia.js — V8.6 — Fixes:
//   1. Sprite do boss não some na lateral
//   2. Bravely continua mesmo se o boss morrer (versão SEGURA)
// -----------------------------------------------------------------
// Importante: esta versão NÃO sobrescreve executeAction.
// Só intercepta o triggerBravelyChain quando o target está morto.
// =================================================================

// =================================================================
// FIX 1 — updateBossCard usa SPRITES_STORY no modo história
// =================================================================
(function fixBossCardSprite() {
    const _origUpdateBossCard = window.updateBossCard;
    if (typeof _origUpdateBossCard !== 'function') return;

    window.updateBossCard = function() {
        // Fora do modo história → original
        if (!window._storyMode) {
            return _origUpdateBossCard.apply(this, arguments);
        }

        const spriteEl = document.getElementById('bossCardSprite');
        const nameEl   = document.getElementById('bossCardName');
        const hpEl     = document.getElementById('bossCardHp');

        if (!spriteEl || !nameEl || !hpEl) return;

        // Pega o ID do inimigo atual da fila da história
        const enemyId = (typeof storyEnemiesRemaining !== 'undefined' && storyEnemiesRemaining[0])
            ? storyEnemiesRemaining[0]
            : null;

        if (!enemyId) {
            spriteEl.style.display = 'none';
            nameEl.textContent = '—';
            hpEl.innerHTML = 'HP: — / —';
            return;
        }

        const enemy = STORY_ENEMIES[enemyId];
        if (!enemy) return;

        // Resolve o sprite (mesma lógica do applyStoryEnemyToBoss)
        let sprite = SPRITES_STORY[enemyId];
        if (!sprite || sprite.trim() === '') {
            const bk = STORY_TO_BASE_BOSS[enemyId];
            if (bk && typeof SPRITES !== 'undefined' && SPRITES[bk]) sprite = SPRITES[bk];
        }
        const has = sprite && sprite.trim() !== '';

        if (has) {
            if (spriteEl.src !== sprite) spriteEl.src = sprite;
            spriteEl.style.display = '';
            spriteEl.classList.remove('spectral-boss');
            if (enemy.isSpectral) spriteEl.classList.add('spectral-boss');
        } else {
            spriteEl.style.display = 'none';
        }

        nameEl.textContent = enemy.name;
        hpEl.innerHTML = `HP: <b>${boss.hp}</b> / ${boss.maxHp}`;
    };

    console.log('✅ updateBossCard sobrescrito — sprite do boss sempre visível.');
})();

// =================================================================
// FIX 2 — Bravely continua quando o boss morre (VERSÃO SEGURA)
// -----------------------------------------------------------------
// Intercepta só o triggerBravelyChain, sem tocar no executeAction.
// Se o target estiver morto, espera a transição e redireciona
// pro próximo inimigo.
// =================================================================
(function fixBravelyOnDeadTarget() {
    const _origBravely = window.triggerBravelyChain;
    if (typeof _origBravely !== 'function') return;

    window.triggerBravelyChain = async function(active, target, totalAtk) {
        // Fora do modo história → original
        if (!window._storyMode) {
            return _origBravely.apply(this, arguments);
        }

        // Se o target está vivo, chama o original normalmente
        if (target && !target.dead) {
            return _origBravely.apply(this, arguments);
        }

        // Target morto ou nulo → espera transição e redireciona
        console.log('[fix bravely] target morto, aguardando próximo...');

        let attempts = 0;
        while (arcadeBossTransition && attempts < 30) {
            await sleep(150);
            attempts++;
        }

        // Pega o novo target (boss atual vivo)
        const novoTarget = (mode === "BOSS" || mode === "ARCADE")
            ? boss
            : players.find(p => p.id !== active.id && !p.dead);

        // Se há um novo target vivo, redireciona
        if (novoTarget && !novoTarget.dead) {
            console.log('[fix bravely] redirecionando pra novo target:', novoTarget.name || novoTarget.class);
            return _origBravely.call(this, active, novoTarget, totalAtk);
        }

        // Se não há, apenas ignora
        console.log('[fix bravely] nenhum target vivo, pulando PA');
    };

    console.log('✅ fixBravelyOnDeadTarget instalado (versão segura).');
})();

console.log('✅ historia.js V8.6 — Fixes aplicados (sprite boss + PA continuado).');
// =================================================================
// 🎨 TABELA DE SPRITES DOS MATERIAIS DROPADOS
// -----------------------------------------------------------------
// Nova tabela dedicada só pra materiais (drops).
// Mesmo padrão de STORY_WEAPON_SPRITES e STORY_AMULET_SPRITES.
//
// Como preencher:
//   Cole o link entre as aspas. Se vazio, cai no emoji do SPRITES_STORY
//   antigo (que também tem fallback pro STORY_MATERIALS.emoji).
//
// Prioridade de resolução:
//   1. STORY_MATERIAL_SPRITES (esta tabela)
//   2. SPRITES_STORY (tabela antiga, se por acaso tiver link lá)
//   3. STORY_MATERIALS.emoji (emoji do material)
// =================================================================
const STORY_MATERIAL_SPRITES = {
    // ============ ATO 1 — Mata do Saci ============
    'espinho':         'https://i.imgur.com/lEnuaey.png',  // ← Espinho
    'espinho_raro':    'https://i.imgur.com/YNUNntc.png',  // ← Espinho Raro
    'pele_jacare':     'https://i.imgur.com/BG6eT8i.png',  // ← Pele de Jacaré
    'escama_brilhante':'https://i.imgur.com/FKvYzZ3.png',  // ← Escama Brilhante
    'chifre_cervo':    'https://i.imgur.com/I41gtiJ.png',  // ← Chifre de Cervo
    'chifre_ancestral':'https://i.imgur.com/8kPnUtX.png',  // ← Chifre Ancestral
    'garra_onca':      'https://i.imgur.com/TLwSsmn.png',  // ← Garra de Onça
    'garra_lendaria':  'https://i.imgur.com/8yK7V89.png',  // ← Garra Lendária
    // Boss
    'gorro_saci':      'https://i.imgur.com/5KCdWWZ.png',  // ← Gorro do Saci
    'amuleto_saci':    'https://i.imgur.com/wZNdnfe.png',  // ← Amuleto do Saci

    // ============ ATO 2 — Mata Fechada ============
    'pelo_tamandua':   'https://i.imgur.com/nkvQ3EG.png',  // ← Pelo de Tamanduá
    'garra_tamandua':  'https://i.imgur.com/g8MZYeu.png',  // ← Garra de Tamanduá
    'couro_anta':      'https://i.imgur.com/WDIf5e7.png',  // ← Couro de Anta
    'chifre_anta':     'https://i.imgur.com/DUAD1UB.png',  // ← Chifre de Anta
    'cera_queixada':   'https://i.imgur.com/lp2iykt.png',  // ← Cera de Queixada
    'presa_queixada':  'https://i.imgur.com/yi9oRFy.png',  // ← Presa de Queixada
    'escama_sucuri':   'https://i.imgur.com/ITchbmQ.png',  // ← Escama de Sucuri
    'pele_sucuri':     'https://i.imgur.com/TQAUp0L.png',  // ← Pele de Sucuri
    // Boss
    'pelo_mapinguari': 'https://i.imgur.com/Mgy0IG8.png',  // ← Pelo do Mapinguari
    'amuleto_mapinguari':'https://i.imgur.com/grxwdL7.png',// ← Amuleto do Mapinguari

    // ============ ATO 3 — Águas Profundas ============
    'escama_piranha':  'https://i.imgur.com/kgoUTpU.png',  // ← Escama de Piranha
    'dente_piranha':   'https://i.imgur.com/3zk4fmC.png',  // ← Dente de Piranha
    'pelo_lontra':     'https://i.imgur.com/kI3a2zX.png',  // ← Pelo de Lontra
    'garra_lontra':    'https://i.imgur.com/kNdKrkP.png',  // ← Garra de Lontra
    'pelo_ariranha':   'https://i.imgur.com/zCM98NX.png',  // ← Pelo de Ariranha
    'dente_ariranha':  'https://i.imgur.com/EdSUqjg.png',  // ← Dente de Ariranha
    'escama_pirarucu': 'https://i.imgur.com/XpUjh4G.png',  // ← Escama de Pirarucu
    'lingua_pirarucu': 'https://i.imgur.com/DRTmmiT.png',  // ← Língua de Pirarucu
    // Boss
    'joia_iara':       'https://i.imgur.com/j2zjNYG.png',  // ← Joia da Iara
    'amuleto_iara':    'https://i.imgur.com/1Au85vR.png',  // ← Amuleto da Iara

    // ============ ATO 4 — Chamas da Noite ============
    'pele_cascavel':    'https://i.imgur.com/l8tPijz.png',  // ← Pele de Cascavel
    'chocalho_cascavel':'https://i.imgur.com/HpZIXLn.png',  // ← Chocalho de Cascavel
    'anel_coral':       'https://i.imgur.com/ecZV4QI.png',  // ← Anel de Coral
    'veneno_coral':     'https://i.imgur.com/ItUix5K.png',  // ← Veneno de Coral
    'pele_jararaca':    'https://i.imgur.com/hOJwfmd.png',  // ← Pele de Jararaca
    'presa_jararaca':   'https://i.imgur.com/4MBzwuX.png',  // ← Presa de Jararaca
    'casco_tartaruga':  'https://i.imgur.com/O4HKJzr.png',  // ← Casco de Tartaruga
    'ovo_tartaruga':    'https://i.imgur.com/4Rtovom.png',  // ← Ovo de Tartaruga
    // Boss
    'escama_boitata':   'https://i.imgur.com/9NBxzxu.png',  // ← Escama Flamejante
    'amuleto_boitata':  'https://i.imgur.com/cBaWgUV.png',  // ← Amuleto do Boitatá

    // ============ ATO 5 — Maldição do Fogo ============
    'chifre_bode':      'https://i.imgur.com/PEUng6v.png',  // ← Chifre de Bode
    'pelo_bode':        'https://i.imgur.com/K1iK21s.png',  // ← Pelo de Bode
    'la_carneiro':      'https://i.imgur.com/RDgvubw.png',  // ← Lã de Carneiro
    'chifre_carneiro':  'https://i.imgur.com/akmk5Rc.png',  // ← Chifre de Carneiro
    'crina_cavalo':     'https://i.imgur.com/4YV8EKn.png',  // ← Crina de Cavalo
    'casco_cavalo':     'https://i.imgur.com/ZowdhMC.png',  // ← Casco de Cavalo
    'chifre_touro':     'https://i.imgur.com/YRtPJ8l.png',  // ← Chifre de Touro
    'couro_touro':      'https://i.imgur.com/gZeLGoE.png',  // ← Couro de Touro
    // Boss
    'ferradura_mula':   'https://i.imgur.com/j0KDfvl.png',  // ← Ferradura da Mula
    'amuleto_mula':     'https://i.imgur.com/NCSB2In.png',  // ← Amuleto da Mula

    // ============ ATO 6 — Ossos do Sertão ============
    'pena_urubu':         'https://i.imgur.com/rXrxotX.png',  // ← Pena de Urubu
    'bico_urubu':         'https://i.imgur.com/5taPpjh.png',  // ← Bico de Urubu
    'pena_carcara':       'https://i.imgur.com/WZ6M71Z.png',  // ← Pena de Carcará
    'garra_carcara':      'https://i.imgur.com/mnVsZ8c.png',  // ← Garra de Carcará
    'placa_tatu':         'https://i.imgur.com/PWN8WJN.png',  // ← Placa de Tatu
    'garra_tatu':         'https://i.imgur.com/0GVyG4N.png',  // ← Garra de Tatu
    'pelo_lobo_guara':    'https://i.imgur.com/SACZHLY.png',  // ← Pelo de Lobo-Guará
    'presa_lobo_guara':   'https://i.imgur.com/4xBtg0m.png',  // ← Presa de Lobo-Guará
    // Boss
    'osso_corpo_seco':    'https://i.imgur.com/yCGLbk6.png',  // ← Osso Amaldiçoado
    'amuleto_corpo_seco': 'https://i.imgur.com/nbWin30.png',  // ← Amuleto do Corpo Seco

    // ============ ATO 7 — Maldição da Lua ============
    'pelo_cachorro_mato': 'https://i.imgur.com/CzuZlmm.png',  // ← Pelo de Cachorro-do-Mato
    'presa_cachorro_mato':'https://i.imgur.com/OKvf39t.png',  // ← Presa de Cachorro-do-Mato
    'cauda_raposa':       'https://i.imgur.com/VA8rW74.png',  // ← Cauda de Raposa
    'pelo_raposa':        'https://i.imgur.com/whEu4si.png',  // ← Pelo de Raposa
    'mascara_guaxinim':   'https://i.imgur.com/hpcbhjV.png',  // ← Máscara de Guaxinim
    'garra_guaxinim':     'https://i.imgur.com/vlxB7Zf.png',  // ← Garra de Guaxinim
    'pelo_jaguatirica':   'https://i.imgur.com/PJpgkA5.png',  // ← Pelo de Jaguatirica
    'garra_jaguatirica':  'https://i.imgur.com/BJbRLkT.png',  // ← Garra de Jaguatirica
    // Boss
    'pelo_lobisomem':     'https://i.imgur.com/Q6GTFIi.png',  // ← Pelo de Lobisomem
    'amuleto_lobisomem':  'https://i.imgur.com/SdrNTgW.png',  // ← Amuleto do Lobisomem

    // ============ ATO 8 — Poções e Sombras ============
    'asa_morcego':        'https://i.imgur.com/ZGi0F9K.png',  // ← Asa de Morcego
    'presa_morcego':      'https://i.imgur.com/rlTYIxR.png',  // ← Presa de Morcego
    'pena_coruja':        'https://i.imgur.com/5vpxoKa.png',  // ← Pena de Coruja
    'olho_coruja':        'https://i.imgur.com/Y7A1wW9.png',  // ← Olho de Coruja
    'pele_sapo':          'https://i.imgur.com/Oug9mNH.png',  // ← Pele de Sapo
    'veneno_sapo':        'https://i.imgur.com/1AZH1rO.png',  // ← Veneno de Sapo
    'pena_seriema':       'https://i.imgur.com/udfo4lA.png',  // ← Pena de Seriema
    'bico_seriema':       'https://i.imgur.com/2Pu8FLf.png',  // ← Bico de Seriema
    // Boss
    'caldeirao_cuca':     'https://i.imgur.com/D73xfFj.png',  // ← Fragmento do Caldeirão
    'amuleto_cuca':       'https://i.imgur.com/MZqecGu.png',  // ← Amuleto da Cuca

    // ============ ATO 9 — Canto das Águas ============
    'escama_tucunare':    'https://i.imgur.com/ATGdiol.png',  // ← Escama de Tucunaré
    'dente_tucunare':     'https://i.imgur.com/mnVsZ8c.png',  // ← Dente de Tucunaré
    'escama_piraiba':     'https://i.imgur.com/ow8TFQ9.png',  // ← Escama de Piraíba
    'lingua_piraiba':     'https://i.imgur.com/TNMkNZH.png',  // ← Língua de Piraíba
    'escama_dourada':     'https://i.imgur.com/oJEjSCR.png',  // ← Escama Dourada
    'barbatana_dourada':  'https://i.imgur.com/M0yxEz8.png',  // ← Barbatana Dourada
    'couro_peixe_boi':    'https://i.imgur.com/hMxADzR.png',  // ← Couro de Peixe-Boi
    'osso_peixe_boi':     'https://i.imgur.com/wpLp3Fz.png',  // ← Osso de Peixe-Boi
    // Boss
    'flor_boto':          'https://i.imgur.com/VjU6qOb.png',  // ← Flor do Boto
    'amuleto_boto':       'https://i.imgur.com/60PhZcr.png',  // ← Amuleto do Boto

    // ============ ATO 10 — Terror do Pasto ============
    'chifre_bufalo':      'https://i.imgur.com/81JTkR3.png',  // ← Chifre de Búfalo
    'couro_bufalo':       'https://i.imgur.com/ZNeUIi9.png',  // ← Couro de Búfalo
    'sino_vaca':          'https://i.imgur.com/eC6RONh.png',  // ← Sino da Vaca Louca
    'chifre_vaca':        'https://i.imgur.com/8mLj2H3.png',  // ← Chifre da Vaca Louca
    'chifre_cabra':       'https://i.imgur.com/2Ef2uzL.png',  // ← Chifre de Cabra Preta
    'pelo_cabra':         'https://i.imgur.com/jZuInjs.png',  // ← Pelo de Cabra Preta
    'corcova_zebu':       'https://i.imgur.com/ricPmaF.png',  // ← Corcova de Zebu
    'chifre_zebu':        'https://i.imgur.com/QdR6ZbI.png',  // ← Chifre de Zebu
    // Boss
    'chifre_boi':         'https://i.imgur.com/HaNOyts.png',  // ← Chifre do Boi da Cara Preta
    'amuleto_boi':        'https://i.imgur.com/GhVUlJ8.png',  // ← Amuleto do Boi da Cara Preta

    // ============ ATO 11 — Luz Fria da Lua ============
    'pelo_gato_mato':     'https://i.imgur.com/KKWzAjN.png',  // ← Pelo de Gato-do-Mato
    'garra_gato_mato':    'https://i.imgur.com/OVzXdR7.png',  // ← Garra de Gato-do-Mato
    'asa_mariposa':       'https://i.imgur.com/tVh2HIp.png',  // ← Asa de Mariposa Gigante
    'po_mariposa':        'https://i.imgur.com/eHR7wl4.png',  // ← Pó Lunar
    'mascara_quati':      'https://i.imgur.com/u3u0t9f.png',  // ← Máscara de Quati
    'cauda_quati':        'https://i.imgur.com/4YSOwAo.png',  // ← Cauda de Quati
    'pelo_sucuarana':     'https://i.imgur.com/VxUQeoh.png',  // ← Pelo de Suçuarana
    'garra_sucuarana':    'https://i.imgur.com/baOFA8X.png',  // ← Garra de Suçuarana
    // Boss
    'raio_lunar':         'https://i.imgur.com/rRMX5zO.png',  // ← Raio Lunar
    'amuleto_jaci':       'https://i.imgur.com/Ugx2s1z.png',  // ← Amuleto da Jaci

    // ============ ATO 12 — O Sol Devorador ============
    'pena_gaviao':        'https://i.imgur.com/uKsKkCO.png',  // ← Pena de Gavião
    'garra_gaviao':       'https://i.imgur.com/pAcExMf.png',  // ← Garra de Gavião
    'pena_falcao':        'https://i.imgur.com/e0Jl4m6.png',  // ← Pena de Falcão
    'garra_falcao':       'https://i.imgur.com/OVzXdR7.png',  // ← Garra de Falcão
    'pena_urutau':        'https://i.imgur.com/RJ5R30X.png',  // ← Pena de Urutau
    'olho_urutau':        'https://i.imgur.com/MXv4iR4.png',  // ← Olho de Urutau
    'pena_aguia':         'https://i.imgur.com/Voa3glg.png',  // ← Pena de Águia
    'garra_aguia':        'https://i.imgur.com/mnVsZ8c.png',  // ← Garra de Águia
    // Boss
    'coroa_solar':        'https://i.imgur.com/eU5rrOA.png',  // ← Coroa Solar
    'amuleto_guaraci':    'https://i.imgur.com/rRwaKTH.png',  // ← Amuleto do Guaraci

    // ============ ATO 13 — O Senhor do Abismo ============
    'fragmento_abismo':   'https://i.imgur.com/mEsrwkS.png',  // ← Fragmento do Abismo
    'essencia_anhanga':   'https://i.imgur.com/cfBkyLL.png',  // ← Essência de Anhangá

    // ============ Consumíveis ============
    'pocao_cura':         '',  // ← Poção de Cura
};

// =================================================================
// 🔧 RESOLUÇÃO DE SPRITE — função unificada
// -----------------------------------------------------------------
// Prioridade:
//   1. STORY_MATERIAL_SPRITES (nova tabela)
//   2. SPRITES_STORY (tabela antiga)
//   3. Emoji do STORY_MATERIALS
// =================================================================
function getMaterialIcon(matId, size = 'normal') {
    const m = STORY_MATERIALS[matId];
    if (!m) return '<span style="opacity:0.5;">?</span>';

    // 1. Tabela nova
    let url = STORY_MATERIAL_SPRITES[matId];

    // 2. Tabela antiga (compatibilidade)
    if (!url || String(url).trim() === '') {
        url = (typeof SPRITES_STORY !== 'undefined') ? SPRITES_STORY[matId] : '';
    }

    // 3. Emoji de fallback
    const emoji = m.emoji || '❓';

    if (url && String(url).trim() !== '') {
        const cls = size === 'large' ? 'material-icon material-icon-large'
                  : size === 'small' ? 'material-icon material-icon-small'
                  : 'material-icon';
        return `<img src="${url}" class="${cls}" alt="${m.name}" onerror="this.outerHTML='${emoji}'">`;
    }

    const cls = size === 'large' ? 'material-emoji material-emoji-large'
              : size === 'small' ? 'material-emoji material-emoji-small'
              : 'material-emoji';
    return `<span class="${cls}">${emoji}</span>`;
}

// =================================================================
// 🎨 CSS dos ícones de material
// =================================================================
(function injectMaterialIconCSS() {
    if (document.getElementById('materialIconStyle')) return;
    const style = document.createElement('style');
    style.id = 'materialIconStyle';
    style.textContent = `
        .material-icon {
            width: 1em;
            height: 1em;
            object-fit: contain;
            vertical-align: -0.15em;
            display: inline-block;
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
        }
        .material-icon-small { width: 0.85em; height: 0.85em; }
        .material-icon-large { width: 2em;    height: 2em; }

        .material-emoji { display: inline-block; line-height: 1; }
        .material-emoji-small { font-size: 0.85em; }
        .material-emoji-large { font-size: 2em; }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS dos ícones de material injetado.');
})();

// =================================================================
// 🔧 PATCH — Substitui os usos diretos de .emoji por getMaterialIcon
// -----------------------------------------------------------------
// Aplica em: Tesouraria (inventário + receitas), Loja (venda),
// Resultado de vitória (drops).
// =================================================================

// Patch 1 — Cards do inventário na Tesouraria
(function patchTesourariaInventoryIcons() {
    if (window._tesourariaInvIconObserver) return;
    window._tesourariaInvIconObserver = true;

    const patchCards = () => {
        document.querySelectorAll('.tesouraria-item').forEach(card => {
            if (card.dataset.iconPatched === '1') return;
            const iconEl = card.querySelector('.tesouraria-item-icon');
            const nameEl = card.querySelector('.tesouraria-item-name');
            if (!iconEl || !nameEl) return;

            const matName = nameEl.textContent.trim();
            const matId = Object.keys(STORY_MATERIALS).find(id => STORY_MATERIALS[id].name === matName);
            if (!matId) return;

            iconEl.innerHTML = getMaterialIcon(matId, 'large');
            iconEl.dataset.iconPatched = '1';
            card.dataset.iconPatched = '1';
        });
    };

    const observer = new MutationObserver(() => {
        const ss = document.getElementById('storyScreen');
        if (ss?.classList.contains('active')) patchCards();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('✅ Observer de ícones do inventário instalado.');
})();

// Patch 2 — Receitas da Forja
(function patchForgeRecipeIcons() {
    if (window._forgeRecipeIconObserver) return;
    window._forgeRecipeIconObserver = true;

    const patchRecipes = () => {
        document.querySelectorAll('.forge-recipe-mat').forEach(el => {
            if (el.dataset.iconPatched === '1') return;
            // Pega o texto pra descobrir qual material é
            const text = el.textContent.trim();
            // Formato: "🦔 3/5" — pega o nome
            const matId = Object.keys(STORY_MATERIALS).find(id => {
                const m = STORY_MATERIALS[id];
                return text.includes(m.name) || text.includes(m.emoji);
            });
            if (!matId) return;

            const m = STORY_MATERIALS[matId];
            const has = STORY_PROGRESS.inventory[matId] || 0;
            // Recalcula o "requerido" pela classe de cor
            const qty = text.match(/(\d+)\/(\d+)/);
            if (!qty) return;
            const qtyHas = qty[1], qtyNeed = qty[2];
            const okClass = el.classList.contains('ok') ? 'ok' : 'no';

            el.innerHTML = `${getMaterialIcon(matId, 'small')} ${qtyHas}/${qtyNeed}`;
            el.classList.remove('ok', 'no');
            el.classList.add(okClass);
            el.dataset.iconPatched = '1';
        });
    };

    const observer = new MutationObserver(() => {
        const ss = document.getElementById('storyScreen');
        if (ss?.classList.contains('active')) patchRecipes();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('✅ Observer de ícones das receitas instalado.');
})();

// Patch 3 — Cards de venda no Curandeiro
(function patchSellIcons() {
    if (window._sellIconObserver) return;
    window._sellIconObserver = true;

    const patchSell = () => {
        document.querySelectorAll('.sell-card').forEach(card => {
            if (card.dataset.iconPatched === '1') return;
            const iconEl = card.querySelector('.sell-icon');
            const nameEl = card.querySelector('.sell-name');
            if (!iconEl || !nameEl) return;

            const matName = nameEl.textContent.trim();
            const matId = Object.keys(STORY_MATERIALS).find(id => STORY_MATERIALS[id].name === matName);
            if (!matId) return;

            iconEl.innerHTML = getMaterialIcon(matId, 'large');
            iconEl.dataset.iconPatched = '1';
            card.dataset.iconPatched = '1';
        });
    };

    const observer = new MutationObserver(() => {
        const ss = document.getElementById('storyScreen');
        if (ss?.classList.contains('active')) patchSell();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('✅ Observer de ícones de venda instalado.');
})();

// Patch 4 — Drops na tela de vitória
(function patchVictoryDropIcons() {
    if (window._victoryDropIconObserver) return;
    window._victoryDropIconObserver = true;

    const patchVictory = () => {
        document.querySelectorAll('.story-result-drop').forEach(card => {
            if (card.dataset.iconPatched === '1') return;
            const iconEl = card.querySelector('.story-result-drop-emoji');
            const nameEl = card.querySelector('.story-result-drop-name');
            if (!iconEl || !nameEl) return;

            const matName = nameEl.textContent.trim();
            const matId = Object.keys(STORY_MATERIALS).find(id => STORY_MATERIALS[id].name === matName);
            if (!matId) return;

            iconEl.innerHTML = getMaterialIcon(matId, 'large');
            iconEl.dataset.iconPatched = '1';
            card.dataset.iconPatched = '1';
        });
    };

    const observer = new MutationObserver(() => {
        const ov = document.getElementById('storyVictoryOverlay');
        if (ov) patchVictory();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('✅ Observer de ícones de drops instalado.');
})();

// =================================================================
// 🌐 Expõe no window
// =================================================================
window.STORY_MATERIAL_SPRITES = STORY_MATERIAL_SPRITES;
window.getMaterialIcon = getMaterialIcon;

console.log('✅ Tabela de sprites dos materiais carregada.');
// =================================================================
// 🔧 UX — Botão flutuante "VOLTAR" nas telas longas
// -----------------------------------------------------------------
// Adiciona um botão fixo no topo da tela do storyScreen,
// sempre visível independente do scroll.
//
// Aparece em: Bestiário, OCA, Forja, Ritual, Atos, Fases, Loja
// Não aparece em: Aldeia (já tem botão no topo), telas de batalha
// =================================================================
(function addFloatingBackButton() {

    // Evita duplicar
    if (document.getElementById('floatingBackBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'floatingBackBtn';
    btn.className = 'floating-back-btn';
    btn.innerHTML = '← VOLTAR À ALDEIA';
    btn.style.display = 'none'; // só aparece quando faz sentido
    document.body.appendChild(btn);

    // Ação do clique: decide pra onde voltar
    btn.onclick = function() {
        const ss = document.getElementById('storyScreen');
        if (!ss) return;

        const titleEl = ss.querySelector('.story-title');
        const title = titleEl ? titleEl.textContent.trim().toUpperCase() : '';

        // Se estamos em sub-tela (Bestiário, OCA, Forja, etc) → volta pra Aldeia
        if (title.includes('BESTIÁRIO') ||
            title.includes('OCA') ||
            title.includes('TESOURARIA') ||
            title.includes('RITUAL') ||
            title.includes('CURANDEIRO') ||
            title.includes('ATOS')) {
            if (typeof renderAldeiaScreen === 'function') {
                renderAldeiaScreen();
            }
            return;
        }

        // Fases de um ato → volta pra lista de atos
        if (title.includes('ATO ')) {
            if (typeof renderAtosScreen === 'function') {
                renderAtosScreen();
            }
            return;
        }

        // Fallback: volta pra Aldeia
        if (typeof renderAldeiaScreen === 'function') {
            renderAldeiaScreen();
        }
    };

    // ============================================================
    // Mostra/esconde o botão conforme a tela atual
    // ============================================================
    function updateFloatingBtnVisibility() {
        const ss = document.getElementById('storyScreen');
        const btn = document.getElementById('floatingBackBtn');
        if (!ss || !btn) return;

        // Só mostra se a storyScreen estiver ativa
        const isActive = ss.classList.contains('active') &&
                         getComputedStyle(ss).display !== 'none';

        if (!isActive) {
            btn.style.display = 'none';
            return;
        }

        // Não mostra na Aldeia (já tem botão no rodapé e a tela é curta)
        const titleEl = ss.querySelector('.story-title');
        const title = titleEl ? titleEl.textContent.trim().toUpperCase() : '';

        const naAldeia = title === 'ALDEIA';
        const emBatalha = document.getElementById('gameScreen')?.classList.contains('active');

        if (naAldeia || emBatalha) {
            btn.style.display = 'none';
        } else {
            btn.style.display = 'flex';
        }
    }

    // Observa mudanças no DOM pra atualizar visibilidade
    const observer = new MutationObserver(() => {
        updateFloatingBtnVisibility();
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });

    // Chama uma vez pra iniciar
    setTimeout(updateFloatingBtnVisibility, 100);

    console.log('✅ Botão flutuante "VOLTAR" instalado.');
})();

// =================================================================
// 🎨 CSS do botão flutuante
// =================================================================
(function injectFloatingBackBtnCSS() {
    if (document.getElementById('floatingBackBtnStyle')) return;
    const style = document.createElement('style');
    style.id = 'floatingBackBtnStyle';
    style.textContent = `
        .floating-back-btn {
            position: fixed;
            top: 16px;
            left: 16px;
            z-index: 9800;
            padding: 10px 18px;
            background:
                linear-gradient(180deg, rgba(232, 185, 35, 0.15), transparent 45%),
                linear-gradient(135deg, #6a5024 0%, #4a3418 60%, #2a1f10 100%);
            color: #f0e2c0;
            border: 2px solid #c9a227;
            border-radius: 4px;
            cursor: pointer;
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 0.85rem;
            letter-spacing: 1.5px;
            transition: all 0.2s;
            box-shadow:
                0 4px 15px rgba(0, 0, 0, 0.6),
                0 0 20px rgba(201, 162, 39, 0.2);
            align-items: center;
            gap: 6px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
            -webkit-tap-highlight-color: transparent;
        }

        .floating-back-btn:hover {
            background:
                linear-gradient(180deg, rgba(232, 185, 35, 0.3), transparent 45%),
                linear-gradient(135deg, #8a6a2e 0%, #6a4a20 60%, #3a2a14 100%);
            border-color: #e8b923;
            color: #fff5dc;
            transform: translateY(-2px);
            box-shadow:
                0 6px 20px rgba(0, 0, 0, 0.7),
                0 0 30px rgba(232, 185, 35, 0.4);
        }

        .floating-back-btn:active {
            transform: translateY(0);
            box-shadow:
                0 3px 10px rgba(0, 0, 0, 0.6),
                0 0 15px rgba(201, 162, 39, 0.3);
        }

        /* Em mobile, ajusta o tamanho pra não cobrir conteúdo importante */
        @media (max-width: 600px) {
            .floating-back-btn {
                top: 10px;
                left: 10px;
                padding: 8px 14px;
                font-size: 0.75rem;
                letter-spacing: 1px;
            }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS do botão flutuante injetado.');
})();

console.log('✅ Botão flutuante "VOLTAR" pronto pra uso.');
// =================================================================
// historia.js — BLOCO CORRETIVO 1 (V9.0 — Correções Críticas)
// -----------------------------------------------------------------
// Cole NO FINAL de historia.js, sem substituir nada.
//
// Contém:
//   1. handleStoryBossDefeat exposta corretamente em window
//      (corrige o hook quebrado do bestiário)
//   2. Reset de _storyPurificationShowing movido para advanceStoryEnemy
//      (corrige travamento de purificação em mortes em cadeia)
//   3. PA (triggerBravelyChain) SEMPRE dispara, mesmo com alvo morto
//      (corrige o PA não aparecer quando o boss morre no ataque base)
//   4. Botão flutuante "VOLTAR" reduzido
//   5. Registro de derrota no bestiário dentro do próprio
//      handleStoryBossDefeat (não depende mais de hook externo)
// =================================================================

// =================================================================
// 1 + 5. handleStoryBossDefeat — reescrita robusta
// -----------------------------------------------------------------
// Sobrescreve a versão anterior (que estava exposta errada).
// Agora:
//   • Exposta corretamente em window
//   • Registra a derrota no bestiário ANTES de qualquer transição
//   • Reset de _storyPurificationShowing movido pro finally
//   • Guarda contra dupla execução usando o ID do inimigo atual
// =================================================================
(function installRobustHandleStoryBossDefeat() {
    // Guarda a versão anterior (que era local, não estava em window)
    const _orig = window.handleStoryBossDefeat;

    window.handleStoryBossDefeat = async function() {
        if (!window._storyMode) {
            if (typeof _orig === 'function') return _orig.apply(this, arguments);
            return;
        }

        // ---- GUARD anti-duplicação ----
        // Usa o ID do inimigo atual como chave. Se já estamos processando
        // a morte desse inimigo, ignora a chamada duplicada.
        const enemyId = (typeof storyEnemiesRemaining !== 'undefined' && storyEnemiesRemaining[0])
            ? storyEnemiesRemaining[0]
            : null;

        if (!enemyId) return;

        if (window._processingBossDefeat === enemyId) {
            console.log('[story] handleStoryBossDefeat ignorado (duplicado):', enemyId);
            return;
        }
        window._processingBossDefeat = enemyId;

        try {
            // ---- REGISTRO NO BESTIÁRIO (antes de tudo) ----
            if (!Array.isArray(STORY_PROGRESS.enemiesDefeatedIds)) {
                STORY_PROGRESS.enemiesDefeatedIds = [];
            }
            if (!STORY_PROGRESS.enemiesDefeatedIds.includes(enemyId)) {
                STORY_PROGRESS.enemiesDefeatedIds.push(enemyId);
                saveStoryProgress();
                console.log('[story] Inimigo registrado no bestiário:', enemyId);
            }

            // ---- DROPS ----
            const drops = rollStoryDrops(enemyId);
            let dropTxt = '';
            drops.forEach(d => {
                addMaterial(d.id, d.qty);
                const m = STORY_MATERIALS[d.id];
                if (m) dropTxt += ` ${m.emoji} ${m.name}×${d.qty}`;
                storyPendingDrops.push({ id: d.id, qty: d.qty });
            });
            saveStoryProgress();

            addLog(`💀 ${getStoryEnemyName(enemyId)} foi derrotado!`);
            if (dropTxt) {
                addLog(`${uiIcon('gift')} Drops:${dropTxt}`);
            } else {
                addLog(`${uiIcon('gift')} Nenhum drop.`);
            }

            STORY_PROGRESS.enemiesDefeated = (STORY_PROGRESS.enemiesDefeated || 0) + 1;
            saveStoryProgress();

            // ---- PURIFICAÇÃO VISUAL ----
            if (typeof showPurificacao === 'function') {
                try {
                    await showPurificacao(boss.type, boss.x, boss.y, false);
                } catch(e) {
                    console.warn('[story] Erro na purificação visual:', e);
                }
            }

            // ---- MENSAGEM DE PURIFICAÇÃO ----
            await showPurificationMessage(enemyId);

            // ---- DIÁLOGO FINAL (só bosses com epílogo) ----
            const isBoss = STORY_FINAL_DIALOGS[enemyId] !== undefined;
            if (isBoss) {
                await showBossFinalDialog(enemyId);
            }

            // ---- AVANÇA PARA O PRÓXIMO INIMIGO ----
            await advanceStoryEnemy();

        } catch (e) {
            console.error('[story] Erro em handleStoryBossDefeat:', e);
        } finally {
            // Libera o guard pra permitir a próxima morte
            window._processingBossDefeat = null;
        }
    };

    console.log('✅ handleStoryBossDefeat robusta instalada.');
})();

// =================================================================
// 2. advanceStoryEnemy — reset correto de _storyPurificationShowing
// -----------------------------------------------------------------
// A versão anterior resetava dentro do próprio handleStoryBossDefeat,
// o que travava purificações em cadeia. Agora o reset acontece aqui,
// que é o ponto natural (após a transição para o próximo inimigo).
// =================================================================
(function patchAdvanceStoryEnemyReset() {
    const _origAdvance = window.advanceStoryEnemy;
    if (typeof _origAdvance !== 'function') {
        console.warn('[story] advanceStoryEnemy não encontrada, pulando patch.');
        return;
    }

    window.advanceStoryEnemy = async function() {
        // Reseta o flag ANTES de qualquer transição
        window._storyPurificationShowing = false;

        try {
            return await _origAdvance.apply(this, arguments);
        } catch (e) {
            console.error('[story] Erro em advanceStoryEnemy:', e);
            window._storyPurificationShowing = false;
        }
    };

    console.log('✅ advanceStoryEnemy patcheada — reset de purificação correto.');
})();

// =================================================================
// 3. PA dispara SEMPRE, mesmo com alvo morto
// -----------------------------------------------------------------
// Reinstala o triggerBravelyChain pra funcionar corretamente quando
// o boss morre no ataque base antes do PA executar.
//
// Estratégia:
//   • Salva a referência do alvo original ANTES de qualquer dano
//   • Se o alvo morrer no meio do caminho, ainda assim converte os
//     tiles afetados pelo PA (efeito estratégico)
//   • Efeitos extras (empurrar, curar, dobro se em FOGO) só rodam
//     se houver alvo vivo
//   • Se o PA estava em execução e o boss morreu, redireciona pro
//     próximo boss se ele já estiver no board
// =================================================================
(function installBravelyAlwaysFires() {
    // Guarda a versão atual (do bloco V8.1 anterior)
    const _origBravely = window.triggerBravelyChain;
    if (typeof _origBravely !== 'function') {
        console.warn('[story] triggerBravelyChain não encontrada, pulando patch.');
        return;
    }

    window.triggerBravelyChain = async function(active, target, totalAtk) {
        // Fora do modo história → original
        if (!window._storyMode) {
            return _origBravely.apply(this, arguments);
        }

        const heroData = STORY_HERO_CLASSES[active.class];
        // Herói base → original (Tupã/Sumé/Caipora)
        if (!heroData || !heroData.paKey || heroData.paKey.startsWith('base_')) {
            return _origBravely.apply(this, arguments);
        }

        // ============================================================
        // HERÓI NOVO — versão robusta
        // ============================================================
        const element = active.element || 'FOGO';
        const paKey = heroData.paKey;

        // ---- Salva o snapshot do alvo original ----
        // Mesmo que o alvo morra no meio do PA, guardamos a posição
        // original pra calcular os tiles corretamente.
        const targetSnapshot = target ? {
            x: target.x,
            y: target.y,
            dead: target.dead,
            id: target.id
        } : null;

        // ---- 1. Overlay "PODER ANCESTRAL" ----
        if (typeof showPoderAncestralEffect === 'function') {
            try { showPoderAncestralEffect(); } catch(e) {}
        }
        await sleep(300);

        // ---- 2. Som ----
        try { playSfx('skill1'); } catch(e) {}

        // ---- 3. Calcula os tiles afetados pelo PA ----
        // IMPORTANTE: usa o snapshot do alvo, não o estado atual.
        // Isso garante que mesmo se o alvo morreu, os tiles são calculados.
        const paTiles = getPAaffectedTilesWithSnapshot(active, paKey, targetSnapshot);

        // ---- 4. FX elemental em cada tile ----
        paTiles.forEach((idx) => {
            const tx = idx % 8;
            const ty = Math.floor(idx / 8);
            const dist = Math.abs(tx - active.x) + Math.abs(ty - active.y);
            setTimeout(() => {
                if (typeof triggerElementalFX === 'function') {
                    let fxType = 'COL';
                    if (paKey.includes('linha')) fxType = 'ROW';
                    triggerElementalFX(element, fxType === 'ROW' ? ty : tx, fxType, active.x, active.y);
                }
            }, dist * 60);
        });

        await sleep(400);

        // ---- 5. Dano no alvo (se ainda estiver vivo) ----
        // Só aplica dano se o alvo original ainda estiver vivo.
        // Se morreu no ataque base, o PA não causa mais dano — mas
        // ainda converte tiles (o efeito estratégico).
        if (target && !target.dead) {
            const targetIdx = target.y * 8 + target.x;
            if (paTiles.includes(targetIdx)) {
                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            }
        }

        // ---- 6. Efeitos EXTRAS únicos ----
        // Só rodam se houver alvo vivo. Usa o snapshot pra posição.
        const targetForExtras = (target && !target.dead) ? target : null;
        const paFn = STORY_HERO_PA[paKey];
        if (paFn && typeof paFn.execute === 'function') {
            try {
                // Para o PA do Kanarott (empurrar), precisamos de um alvo vivo.
                // Se o alvo morreu, passamos um "target fake" com a posição
                // original pra que os efeitos de cura ainda rodem.
                const targetArg = targetForExtras || (targetSnapshot ? {
                    x: targetSnapshot.x,
                    y: targetSnapshot.y,
                    dead: true,  // marca como morto pra evitar empurrar
                    id: targetSnapshot.id
                } : null);

                await paFn.execute(active, targetArg, totalAtk);
            } catch(e) {
                console.warn('[story] Erro no efeito extra do PA:', e);
            }
        }

        // ---- 7. Trocar tiles afetados pelo elemento do herói ----
        // ESSENCIAL: sempre converte os tiles, independente do alvo.
        // É aqui que está o valor estratégico do PA com alvo morto.
        paTiles.forEach(idx => {
            grid[idx] = element;
            const tile = document.querySelectorAll('#grid .tile')[idx];
            if (tile) tile.className = `tile bg-${element}`;
            if (element === 'TERRA' && typeof updateTitleStats === 'function') {
                updateTitleStats('earth_tile');
            } else if (element === 'AR' && typeof updateTitleStats === 'function') {
                updateTitleStats('air_tile');
            }
        });

        // ---- 8. Estatística ----
        if (typeof updateTitleStats === 'function') updateTitleStats('bravely_chain');

        console.log('[story] PA executado. Tiles convertidos:', paTiles.length,
                    '| Alvo vivo:', targetForExtras ? 'sim' : 'não');

        // ---- 9. Se o boss morreu durante o PA, o fluxo de vitória ----
        // ---- já foi disparado por applyDmg. Não faz nada aqui. ----
    };

    // ================================================================
    // getPAaffectedTiles COM SNAPSHOT
    // Mesma lógica do V8.1, mas aceita um objeto snapshot do alvo
    // (que pode estar morto) em vez de exigir o objeto vivo.
    // ================================================================
    function getPAaffectedTilesWithSnapshot(active, paKey, targetSnapshot) {
        const tiles = [];
        const cx = active.x;
        const cy = active.y;

        // Helper: verifica se o alvo snapshot existe e está no tabuleiro
        const hasTarget = targetSnapshot &&
                          typeof targetSnapshot.x === 'number' &&
                          typeof targetSnapshot.y === 'number';

        if (paKey === 'kanarott_cruz_empurra') {
            for (let i = -2; i <= 2; i++) {
                const ny = cy + i;
                if (ny >= 0 && ny < 8) tiles.push(ny * 8 + cx);
            }
            for (let i = -2; i <= 2; i++) {
                if (i === 0) continue;
                const nx = cx + i;
                if (nx >= 0 && nx < 8) tiles.push(cy * 8 + nx);
            }
        }
        else if (paKey === 'teperesik_area2x2') {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                }
            }
        }
        else if (paKey === 'eru_linha_horizontal') {
            for (let x = 0; x < 8; x++) tiles.push(cy * 8 + x);
        }
        else if (paKey === 'andure_area2x2_cura') {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                }
            }
        }
        else if (paKey === 'maedamata_area3x3_cura') {
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                }
            }
        }
        else if (paKey === 'paje_coluna_fogo') {
            for (let y = 0; y < 8; y++) tiles.push(y * 8 + cx);
        }
        else if (paKey === 'jurua_area_alvo_3x3') {
            if (hasTarget) {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const nx = targetSnapshot.x + dx, ny = targetSnapshot.y + dy;
                        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                    }
                }
            }
        }
        else if (paKey === 'araci_linha_horizontal') {
            for (let x = 0; x < 8; x++) tiles.push(cy * 8 + x);
        }
        else if (paKey === 'bicho_cruz_completa') {
            if (hasTarget) {
                for (let x = 0; x < 8; x++) tiles.push(targetSnapshot.y * 8 + x);
                for (let y = 0; y < 8; y++) {
                    if (y !== targetSnapshot.y) tiles.push(y * 8 + targetSnapshot.x);
                }
            }
        }
        else if (paKey === 'tapyra_coluna_alvo') {
            if (hasTarget) {
                for (let y = 0; y < 8; y++) tiles.push(y * 8 + targetSnapshot.x);
            }
        }

        return tiles;
    }

    console.log('✅ triggerBravelyChain robusta instalada — PA dispara com alvo vivo ou morto.');
})();

// =================================================================
// 4. Botão flutuante "VOLTAR" reduzido
// -----------------------------------------------------------------
// Reduz padding, fonte, e em telas pequenas troca o texto por só "←".
// =================================================================
(function shrinkFloatingBackBtn() {
    // Remove o CSS antigo (se existir)
    const oldStyle = document.getElementById('floatingBackBtnStyle');
    if (oldStyle) oldStyle.remove();

    // Injeta o CSS novo
    const style = document.createElement('style');
    style.id = 'floatingBackBtnStyle';
    style.textContent = `
        .floating-back-btn {
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 9800;
            padding: 6px 12px;
            background:
                linear-gradient(180deg, rgba(232, 185, 35, 0.15), transparent 45%),
                linear-gradient(135deg, #6a5024 0%, #4a3418 60%, #2a1f10 100%);
            color: #f0e2c0;
            border: 1.5px solid #c9a227;
            border-radius: 20px;
            cursor: pointer;
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 0.7rem;
            letter-spacing: 1px;
            transition: all 0.2s;
            box-shadow:
                0 3px 10px rgba(0, 0, 0, 0.6),
                0 0 15px rgba(201, 162, 39, 0.2);
            display: flex;
            align-items: center;
            gap: 5px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
            -webkit-tap-highlight-color: transparent;
            line-height: 1;
            opacity: 0.9;
        }

        .floating-back-btn:hover {
            background:
                linear-gradient(180deg, rgba(232, 185, 35, 0.3), transparent 45%),
                linear-gradient(135deg, #8a6a2e 0%, #6a4a20 60%, #3a2a14 100%);
            border-color: #e8b923;
            color: #fff5dc;
            transform: translateY(-1px);
            box-shadow:
                0 4px 15px rgba(0, 0, 0, 0.7),
                0 0 22px rgba(232, 185, 35, 0.4);
            opacity: 1;
        }

        .floating-back-btn:active {
            transform: translateY(0);
            box-shadow:
                0 2px 8px rgba(0, 0, 0, 0.6),
                0 0 10px rgba(201, 162, 39, 0.3);
        }

        /* Em telas muito pequenas, esconde o texto e mostra só a seta */
        @media (max-width: 600px) {
            .floating-back-btn {
                top: 8px;
                left: 8px;
                padding: 7px 11px;
                font-size: 1rem;
                letter-spacing: 0;
                border-radius: 50%;
                width: 34px;
                height: 34px;
                justify-content: center;
            }
            .floating-back-btn .fb-text {
                display: none;
            }
        }
    `;
    document.head.appendChild(style);

    // Reposiciona o botão: em vez de "← VOLTAR À ALDEIA" fixo,
    // coloca o texto num span pra poder escondê-lo em telas pequenas.
    const btn = document.getElementById('floatingBackBtn');
    if (btn) {
        // Guarda a ação do clique
        const clickHandler = btn.onclick;

        // Reescreve o conteúdo com o span
        btn.innerHTML = '←<span class="fb-text"> VOLTAR</span>';

        // Restaura o handler
        if (clickHandler) btn.onclick = clickHandler;
    }

    console.log('✅ Botão flutuante reduzido.');
})();

// =================================================================
// 5. Registro retroativo do bestiário
// -----------------------------------------------------------------
// Sincroniza bossesDefeated antigos com enemiesDefeatedIds.
// Roda uma vez ao carregar.
// =================================================================
(function syncBestiaryRetroactive() {
    if (!Array.isArray(STORY_PROGRESS.enemiesDefeatedIds)) {
        STORY_PROGRESS.enemiesDefeatedIds = [];
    }
    if (Array.isArray(STORY_PROGRESS.bossesDefeated)) {
        STORY_PROGRESS.bossesDefeated.forEach(id => {
            if (!STORY_PROGRESS.enemiesDefeatedIds.includes(id)) {
                STORY_PROGRESS.enemiesDefeatedIds.push(id);
            }
        });
    }
    if (typeof saveStoryProgress === 'function') saveStoryProgress();
    console.log('✅ Bestiário retroativo sincronizado.');
})();

console.log('✅ BLOCO CORRETIVO 1 (V9.0) carregado com sucesso.');
// =================================================================
// historia.js — BLOCO CORRETIVO 2 (V9.0 — Armas Escaladas)
// -----------------------------------------------------------------
// Cole NO FINAL de historia.js, depois do Bloco 1.
//
// Contém:
//   1. STORY_WEAPONS reescrita com:
//      • atkBonus escalonado por ato (1/2/3)
//      • elemento (AR/TERRA/AGUA/FOGO/ANY)
//   2. Hook no executeAction pra aplicar bônus elemental da arma
//      (EMPILHA com o bônus do elemento do herói — Opção A)
//   3. Painel de detalhes do herói mostra o elemento da arma
//   4. Tooltip/legenda explicando o bônus
// =================================================================

// =================================================================
// 1. ELEMENTO POR ATO (baseado no boss)
// =================================================================
const STORY_ATO_ELEMENT = {
    1:  'AR',      // Saci (redemoinho)
    2:  'TERRA',   // Mapinguari
    3:  'AGUA',    // Iara
    4:  'FOGO',    // Boitatá
    5:  'FOGO',    // Mula sem Cabeça
    6:  'TERRA',   // Corpo Seco
    7:  'AR',      // Lobisomem
    8:  'AGUA',    // Cuca (poções)
    9:  'AGUA',    // Boto Rosa
    10: 'TERRA',   // Boi da Cara Preta
    11: 'AR',      // Jaci
    12: 'FOGO',    // Guaraci
    13: 'ANY',     // Anhangá — conta pra qualquer elemento do herói
};

// =================================================================
// 2. TABELA DE ATK POR ATO (escala)
// =================================================================
const STORY_ATO_ATK_SCALE = {
    1: 1, 2: 1, 3: 1, 4: 1,
    5: 2, 6: 2, 7: 2, 8: 2,
    9: 3, 10: 3, 11: 3, 12: 3,
    13: 3,
};

// =================================================================
// 3. REESCREVE STORY_WEAPONS
// -----------------------------------------------------------------
// Cada arma ganha:
//   • atkBonus:      ATK base (fixo, sempre soma)
//   • elemento:      elemento que dá o bônus extra quando o tile bate
//   • elementoBonus: valor do bônus extra (mesmo do atkBonus por enquanto)
//
// O elemento é aplicado a TODAS as armas do mesmo ato.
// =================================================================
(function rewriteWeaponsTable() {
    if (typeof STORY_WEAPONS === 'undefined') {
        console.warn('[story] STORY_WEAPONS não encontrada, pulando Bloco 2.');
        return;
    }

    // Itera todas as armas e adiciona elemento + elementoBonus
    Object.keys(STORY_WEAPONS).forEach(weaponId => {
        const w = STORY_WEAPONS[weaponId];
        const ato = w.ato;
        const elemento = STORY_ATO_ELEMENT[ato] || 'ANY';
        const atkBonus = STORY_ATO_ATK_SCALE[ato] || 1;

        // Atualiza os campos
        w.atkBonus = atkBonus;
        w.elemento = elemento;
        w.elementoBonus = atkBonus;  // mesmo valor, empilha com o do herói
    });

    console.log('[story] STORY_WEAPONS reescrita com elemento + escala de ATK.');
    console.log('[story] Amostra:', {
        tacape_1: STORY_WEAPONS.tacape_1,
        tacape_5: STORY_WEAPONS.tacape_5,
        tacape_9: STORY_WEAPONS.tacape_9,
        tacape_13: STORY_WEAPONS.tacape_13,
    });
})();

// =================================================================
// 4. HOOK NO executeAction — aplica bônus elemental da arma
// -----------------------------------------------------------------
// EMPILHA com o bônus do elemento do herói (Opção A).
//
// Regra:
//   • Tile do elemento do HERÓI  → +1 (já existia)
//   • Tile do elemento da ARMA   → +atkBonus (novo, empilha)
//   • Arma do Ato 13 (ANY)       → +3 sempre que o tile for do
//                                   elemento do herói
// =================================================================
(function hookWeaponElementalBonus() {
    const _exec = window.executeAction;
    if (typeof _exec !== 'function') {
        console.warn('[story] executeAction não encontrada, pulando hook de bônus elemental.');
        return;
    }

    window.executeAction = async function() {
        // Fora do modo história → original
        if (!window._storyMode) {
            return _exec.apply(this, arguments);
        }

        // Só age em herói novo
        const active = players[currentPlayerIdx];
        if (!active) return _exec.apply(this, arguments);

        const heroData = STORY_HERO_CLASSES[active.class];
        if (!heroData || !heroData.paKey || heroData.paKey.startsWith('base_')) {
            return _exec.apply(this, arguments);
        }

        // Aplica o bônus elemental da arma manipulando `active.bonusAtk`
        // temporariamente. O `_exec` recalcula `totalAtk` internamente,
        // então somamos aqui antes de chamá-la.
        const weapon = active.equippedWeapon;
        const eq = (typeof getHeroEquipment === 'function') ? getHeroEquipment(active.class) : null;
        const weaponId = eq && eq.arma ? eq.arma : null;
        const w = weaponId && typeof getWeaponById === 'function' ? getWeaponById(weaponId) : null;

        // Se não tem arma equipada, não faz nada
        if (!w) {
            return _exec.apply(this, arguments);
        }

        // Detecta se o tile inicial do caminho bate com o elemento da arma
        let weaponElementBonus = 0;
        if (path.length > 0) {
            const firstTileElement = grid[path[0]];
            const weaponElem = w.elemento;

            if (weaponElem === 'ANY') {
                // Ato 13: conta se o tile for do elemento do HERÓI
                if (firstTileElement === active.element) {
                    weaponElementBonus = w.elementoBonus || 0;
                }
            } else if (firstTileElement === weaponElem) {
                // Bônus normal: tile bate com o elemento da arma
                weaponElementBonus = w.elementoBonus || 0;
            }
        }

        if (weaponElementBonus > 0) {
            // Salva o valor original
            const origBonusAtk = active.bonusAtk || 0;
            // Soma o bônus elemental da arma (o _exec vai usar info.atk + bonusAtk + tileBonus...)
            active.bonusAtk = origBonusAtk + weaponElementBonus;

            addLog(`⚔️ Bônus elemental da arma (${w.elemento === 'ANY' ? 'abissal' : w.elemento}): +${weaponElementBonus} ATK!`);

            try {
                return await _exec.apply(this, arguments);
            } finally {
                // Restaura
                active.bonusAtk = origBonusAtk;
            }
        }

        return _exec.apply(this, arguments);
    };

    console.log('✅ Hook de bônus elemental da arma instalado.');
})();

// =================================================================
// 5. PAINEL DE DETALHES DO HERÓI — mostra o elemento da arma
// -----------------------------------------------------------------
// Sobrescreve o patchHeroDetailsWithEquipment pra incluir o elemento
// da arma e a legenda de bônus elemental.
// =================================================================
(function enhanceHeroDetailsWithWeaponElement() {
    if (typeof window.openHeroDetails !== 'function') {
        console.warn('[story] openHeroDetails não existe, pulando enriquecimento.');
        return;
    }

    const _origOpen = window.openHeroDetails;
    window.openHeroDetails = function(heroClass) {
        _origOpen.apply(this, arguments);

        const panel = document.querySelector('.hero-details-panel');
        if (!panel) return;

        const eq = (typeof getHeroEquipment === 'function') ? getHeroEquipment(heroClass) : null;
        if (!eq || !eq.arma) return;

        const w = (typeof getWeaponById === 'function') ? getWeaponById(eq.arma) : null;
        if (!w || !w.elemento) return;

        // Remove versão anterior (se houver)
        const oldSection = panel.querySelector('.hero-details-weapon-element');
        if (oldSection) oldSection.remove();

        // Monta a seção nova
        const elemDisplay = w.elemento === 'ANY'
            ? `✨ ${w.elementoBonus} ATK sempre que o tile for do elemento do herói`
            : `${elemIcon(w.elemento)} ${w.elemento} (+${w.elementoBonus} ATK quando o tile for deste elemento)`;

        const sectionHTML = `
            <div class="hero-details-section hero-details-weapon-element">
                <div class="hero-details-section-title">⚔️ BÔNUS ELEMENTAL DA ARMA</div>
                <div class="hero-details-weapon-element-line">
                    <span class="hero-details-weapon-element-label">Arma:</span>
                    <span class="hero-details-weapon-element-value">${w.emoji || '⚔️'} ${w.nome}</span>
                </div>
                <div class="hero-details-weapon-element-line">
                    <span class="hero-details-weapon-element-label">Elemento:</span>
                    <span class="hero-details-weapon-element-value">${elemDisplay}</span>
                </div>
                <div class="hero-details-note" style="margin-top:8px;">
                    💡 Os bônus do <b>elemento do herói</b> e do <b>elemento da arma</b> <b>empilham</b>.
                    Se o tile bater com os dois, você ganha os dois bônus.
                </div>
            </div>`;

        // Insere antes da seção de NOTAS (último filho) ou no final
        const notas = panel.querySelector('.hero-details-notes');
        if (notas) {
            notas.insertAdjacentHTML('beforebegin', sectionHTML);
        } else {
            panel.insertAdjacentHTML('beforeend', sectionHTML);
        }
    };

    console.log('✅ Painel do herói enriquecido com elemento da arma.');
})();

// =================================================================
// 6. CSS auxiliar do elemento da arma
// =================================================================
(function injectWeaponElementCSS() {
    if (document.getElementById('weaponElementStyle')) return;
    const style = document.createElement('style');
    style.id = 'weaponElementStyle';
    style.textContent = `
        .hero-details-weapon-element-line {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            padding: 6px 8px;
            background: rgba(10, 6, 2, 0.4);
            border-radius: 4px;
            margin-bottom: 6px;
            font-family: 'EB Garamond', serif;
            font-size: 0.9rem;
        }
        .hero-details-weapon-element-line:last-child {
            margin-bottom: 0;
        }
        .hero-details-weapon-element-label {
            color: #8a7a52;
            font-weight: 700;
            letter-spacing: 1px;
            font-size: 0.8rem;
            text-transform: uppercase;
        }
        .hero-details-weapon-element-value {
            color: #e8dcc4;
            text-align: right;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .hero-details-weapon-element-value img {
            width: 18px;
            height: 18px;
            object-fit: contain;
            vertical-align: middle;
        }
        .hero-details-weapon-element {
            background: rgba(201, 162, 39, 0.04);
            border-top: 1px solid rgba(201, 162, 39, 0.2);
        }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS do elemento da arma injetado.');
})();

// =================================================================
// 7. EXPÕE NO WINDOW
// =================================================================
window.STORY_ATO_ELEMENT = STORY_ATO_ELEMENT;
window.STORY_ATO_ATK_SCALE = STORY_ATO_ATK_SCALE;

console.log('✅ BLOCO CORRETIVO 2 (V9.0 — Armas Escaladas) carregado.');
// =================================================================
// historia.js — BLOCO CORRETIVO 3 (V9.0 — Equipamento Visual)
// -----------------------------------------------------------------
// Cole NO FINAL de historia.js, depois do Bloco 2.
//
// Contém:
//   1. Substitui o <select> de equipamento por uma GRADE DE CARDS
//      visuais no painel de detalhes do herói
//   2. Nova aba "⚔️ Equipamentos" no Inventário da Tesouraria
//      (mostra armas/amuletos forjados, quem está usando, e permite
//       equipar/desequipar diretamente de lá)
//   3. CSS completo dos cards
// =================================================================

// =================================================================
// 1. SOBRESCREVE openHeroDetails pra usar cards visuais
// -----------------------------------------------------------------
// Remove a seção de equipamento baseada em <select> e injeta uma
// grade de cards com sprite + nome + bônus + botão equipar/desequipar.
// =================================================================
(function installVisualEquipmentInHeroDetails() {
    if (typeof window.openHeroDetails !== 'function') {
        console.warn('[story] openHeroDetails não existe, pulando Bloco 3.');
        return;
    }

    // Guarda a versão atual (que já injeta a seção "BÔNUS ELEMENTAL DA ARMA")
    const _origOpen = window.openHeroDetails;

    window.openHeroDetails = function(heroClass) {
        _origOpen.apply(this, arguments);

        const panel = document.querySelector('.hero-details-panel');
        if (!panel) return;

        // Remove a seção de equipamento antiga (com <select>)
        const oldEquip = panel.querySelector('.hero-details-equipment');
        if (oldEquip) oldEquip.remove();

        // Remove a seção de elemento da arma antiga (vamos refazer junto)
        const oldWeaponElem = panel.querySelector('.hero-details-weapon-element');
        if (oldWeaponElem) oldWeaponElem.remove();

        // ---- Monta os dados ----
        const heroData = STORY_HERO_CLASSES[heroClass];
        if (!heroData) return;

        const archetype = getArchetypeFromHeroClass(heroClass);
        const eq = getHeroEquipment(heroClass);

        // Armas compatíveis forjadas
        const craftedWeapons = (STORY_PROGRESS.craftedWeapons || [])
            .map(id => getWeaponById(id))
            .filter(w => w && w.tipo === archetype);

        // Todos os amuletos forjados
        const craftedAmulets = (STORY_PROGRESS.craftedAmulets || [])
            .map(id => getAmuletById(id))
            .filter(Boolean);

        // Equipamento atual
        const equippedWeaponId = eq.arma || null;
        const equippedAmuletId = eq.amuleto || null;

        // ---- Monta a seção de EQUIPAMENTO (cards) ----
        const weaponCards = craftedWeapons.length > 0
            ? craftedWeapons.map(w => renderWeaponEquipCard(w, equippedWeaponId, heroClass)).join('')
            : `<div class="equip-empty-msg">Nenhuma arma compatível forjada. Vá à <b>Tesouraria → Forja de Armas</b>.</div>`;

        const amuletCards = craftedAmulets.length > 0
            ? craftedAmulets.map(a => renderAmuletEquipCard(a, equippedAmuletId, heroClass)).join('')
            : `<div class="equip-empty-msg">Nenhum amuleto forjado. Vá à <b>Tesouraria → Forja de Amuletos</b>.</div>`;

        const equipHTML = `
            <div class="hero-details-section hero-details-equipment">
                <div class="hero-details-section-title">⚔️ EQUIPAMENTO</div>

                <div class="equip-subsection-title">Arma (${archetype === 'tacape' ? 'Tacape' : archetype === 'flecha' ? 'Flecha' : 'Cajado'})</div>
                <div class="equip-cards-grid">
                    ${weaponCards}
                </div>

                <div class="equip-subsection-title" style="margin-top:14px;">Amuleto</div>
                <div class="equip-cards-grid">
                    ${amuletCards}
                </div>
            </div>`;

        // Insere antes da seção de NOTAS (último filho) ou no final
        const notas = panel.querySelector('.hero-details-notes');
        if (notas) {
            notas.insertAdjacentHTML('beforebegin', equipHTML);
        } else {
            panel.insertAdjacentHTML('beforeend', equipHTML);
        }
    };

    // ---- Helper: card de ARMA ----
    function renderWeaponEquipCard(w, equippedId, heroClass) {
        const isEquipped = equippedId === w.id;
        const weaponIcon = (typeof getWeaponIcon === 'function')
            ? getWeaponIcon(w.id, 'large')
            : (w.emoji || '⚔️');

        // Elemento da arma
        const elemLabel = w.elemento === 'ANY'
            ? '✨ Abissal'
            : `${elemIcon(w.elemento)} ${w.elemento}`;
        const elemClass = w.elemento === 'ANY' ? 'equip-elem-abissal' : `equip-elem-${w.elemento}`;

        // Bônus
        const bonusText = `+${w.atkBonus} ATK <span class="equip-elem-bonus">(+${w.elementoBonus} ${w.elemento === 'ANY' ? 'com elemento do herói' : 'no elemento'})</span>`;

        return `
            <div class="equip-card ${isEquipped ? 'equipped' : ''}" data-weapon-id="${w.id}">
                <div class="equip-card-icon">${weaponIcon}</div>
                <div class="equip-card-info">
                    <div class="equip-card-name">${w.nome}</div>
                    <div class="equip-card-bonus">${bonusText}</div>
                    <div class="equip-card-elem ${elemClass}">${elemLabel}</div>
                </div>
                <button class="equip-card-btn ${isEquipped ? 'unequip' : 'equip'}"
                        onclick="handleWeaponCardClick('${heroClass.replace(/'/g, "\\'")}', '${w.id}', ${isEquipped})">
                    ${isEquipped ? '✕ Remover' : '⚔️ Equipar'}
                </button>
            </div>`;
    }

    // ---- Helper: card de AMULETO ----
    function renderAmuletEquipCard(a, equippedId, heroClass) {
        const isEquipped = equippedId === a.id;
        const amuletIcon = (typeof getAmuletIcon === 'function')
            ? getAmuletIcon(a.id, 'large')
            : (a.emoji || '🧿');

        // Efeitos resumidos
        const ef = a.efeito || {};
        const efeitos = [];
        if (ef.elementOverride) efeitos.push(`${elemIcon(ef.elementOverride)} ${ef.elementOverride}`);
        if (ef.hpBonus)         efeitos.push(`❤️ +${ef.hpBonus} HP`);
        if (ef.atkBonus)        efeitos.push(`⚔️ +${ef.atkBonus} ATK`);
        if (ef.healPerTurn)     efeitos.push(`💚 +${ef.healPerTurn} HP/turno`);
        const efeitosText = efeitos.join(' · ') || '—';

        return `
            <div class="equip-card ${isEquipped ? 'equipped' : ''}" data-amulet-id="${a.id}">
                <div class="equip-card-icon">${amuletIcon}</div>
                <div class="equip-card-info">
                    <div class="equip-card-name">${a.nome}</div>
                    <div class="equip-card-bonus">${efeitosText}</div>
                </div>
                <button class="equip-card-btn ${isEquipped ? 'unequip' : 'equip'}"
                        onclick="handleAmuletCardClick('${heroClass.replace(/'/g, "\\'")}', '${a.id}', ${isEquipped})">
                    ${isEquipped ? '✕ Remover' : '🧿 Equipar'}
                </button>
            </div>`;
    }

    console.log('✅ Painel do herói agora usa CARDS visuais de equipamento.');
})();

// =================================================================
// 2. HANDLERS dos botões dos cards
// =================================================================
window.handleWeaponCardClick = function(heroClass, weaponId, isEquipped) {
    if (isEquipped) {
        // Desequipar
        if (typeof unequipWeapon === 'function') {
            unequipWeapon(heroClass);
            showToast('⚔️', 'Arma removida.', '⚔️');
        }
    } else {
        // Equipar
        if (typeof equipWeapon === 'function') {
            const r = equipWeapon(heroClass, weaponId);
            if (!r.ok) {
                showToast('❌', r.error, '❌');
                return;
            }
            const w = getWeaponById(weaponId);
            showToast('⚔️ Equipado!', `${w.emoji || ''} ${w.nome}`, '⚔️');
        }
    }
    // Reabre o painel pra atualizar
    if (typeof window.openHeroDetails === 'function') {
        setTimeout(() => {
            // Fecha o antigo
            if (typeof closeHeroDetails === 'function') closeHeroDetails();
            // Reabre depois da animação
            setTimeout(() => window.openHeroDetails(heroClass), 320);
        }, 100);
    }
};

window.handleAmuletCardClick = function(heroClass, amuletId, isEquipped) {
    if (isEquipped) {
        if (typeof unequipAmulet === 'function') {
            unequipAmulet(heroClass);
            showToast('🧿', 'Amuleto removido.', '🧿');
        }
    } else {
        if (typeof equipAmulet === 'function') {
            const r = equipAmulet(heroClass, amuletId);
            if (!r.ok) {
                showToast('❌', r.error, '❌');
                return;
            }
            const a = getAmuletById(amuletId);
            showToast('🧿 Equipado!', `${a.emoji || ''} ${a.nome}`, '🧿');
        }
    }
    if (typeof window.openHeroDetails === 'function') {
        setTimeout(() => {
            if (typeof closeHeroDetails === 'function') closeHeroDetails();
            setTimeout(() => window.openHeroDetails(heroClass), 320);
        }, 100);
    }
};

// =================================================================
// 3. INVENTÁRIO DA TESOURARIA — nova aba "Equipamentos"
// -----------------------------------------------------------------
// Sobrescreve renderTesourariaInventario pra incluir os equipamentos.
// =================================================================
(function enhanceTesourariaInventory() {
    if (typeof window.renderTesourariaInventario !== 'function') {
        console.warn('[story] renderTesourariaInventario não existe, pulando.');
        return;
    }

    // Sobrescreve a aba de Inventário pra adicionar uma seção de equipamentos
    const _origInv = window.renderTesourariaInventario;

    window.renderTesourariaInventario = function(materialIds) {
        // Chama a versão original (que renderiza os materiais)
        const materialHTML = _origInv.apply(this, arguments);

        // Monta a seção de equipamentos
        const weapons = (STORY_PROGRESS.craftedWeapons || [])
            .map(id => getWeaponById(id))
            .filter(Boolean);

        const amulets = (STORY_PROGRESS.craftedAmulets || [])
            .map(id => getAmuletById(id))
            .filter(Boolean);

        // Descobre quem está usando cada equipamento
        const usageMap = {};
        const eqMap = STORY_PROGRESS.heroEquipment || {};
        for (const heroClass in eqMap) {
            const e = eqMap[heroClass];
            if (e.arma) usageMap[e.arma] = heroClass;
            if (e.amuleto) usageMap[e.amuleto] = heroClass;
        }

        let weaponsHTML = '';
        if (weapons.length === 0) {
            weaponsHTML = `<div class="inv-empty-line">Nenhuma arma forjada ainda.</div>`;
        } else {
            weaponsHTML = weapons.map(w => {
                const equippedBy = usageMap[w.id];
                const owner = equippedBy
                    ? (STORY_HERO_CLASSES[equippedBy]?.displayName || equippedBy)
                    : null;
                const icon = (typeof getWeaponIcon === 'function')
                    ? getWeaponIcon(w.id, 'normal')
                    : (w.emoji || '⚔️');
                return `
                    <div class="inv-equip-row">
                        <div class="inv-equip-icon">${icon}</div>
                        <div class="inv-equip-info">
                            <div class="inv-equip-name">${w.nome}</div>
                            <div class="inv-equip-meta">
                                +${w.atkBonus} ATK
                                ${w.elemento === 'ANY' ? '· ✨ Abissal' : `· ${elemIcon(w.elemento)} ${w.elemento}`}
                            </div>
                        </div>
                        <div class="inv-equip-owner ${owner ? 'used' : 'free'}">
                            ${owner ? `👤 ${owner}` : '— Livre —'}
                        </div>
                    </div>`;
            }).join('');
        }

        let amuletsHTML = '';
        if (amulets.length === 0) {
            amuletsHTML = `<div class="inv-empty-line">Nenhum amuleto forjado ainda.</div>`;
        } else {
            amuletsHTML = amulets.map(a => {
                const equippedBy = usageMap[a.id];
                const owner = equippedBy
                    ? (STORY_HERO_CLASSES[equippedBy]?.displayName || equippedBy)
                    : null;
                const icon = (typeof getAmuletIcon === 'function')
                    ? getAmuletIcon(a.id, 'normal')
                    : (a.emoji || '🧿');
                const ef = a.efeito || {};
                const efeitos = [];
                if (ef.elementOverride) efeitos.push(`${elemIcon(ef.elementOverride)} ${ef.elementOverride}`);
                if (ef.hpBonus)         efeitos.push(`+${ef.hpBonus} HP`);
                if (ef.atkBonus)        efeitos.push(`+${ef.atkBonus} ATK`);
                if (ef.healPerTurn)     efeitos.push(`+${ef.healPerTurn} HP/turno`);
                return `
                    <div class="inv-equip-row amulet">
                        <div class="inv-equip-icon">${icon}</div>
                        <div class="inv-equip-info">
                            <div class="inv-equip-name">${a.nome}</div>
                            <div class="inv-equip-meta">${efeitos.join(' · ') || '—'}</div>
                        </div>
                        <div class="inv-equip-owner ${owner ? 'used' : 'free'}">
                            ${owner ? `👤 ${owner}` : '— Livre —'}
                        </div>
                    </div>`;
            }).join('');
        }

        const equipSection = `
            <div class="inv-equipment-section">
                <div class="inv-equipment-title">⚔️ ARMAS FORJADAS</div>
                <div class="inv-equip-list">${weaponsHTML}</div>

                <div class="inv-equipment-title" style="margin-top:16px;">🧿 AMULETOS FORJADOS</div>
                <div class="inv-equip-list">${amuletsHTML}</div>

                <div class="inv-equipment-hint">
                    💡 Para equipar, abra o <b>painel de um herói</b> na <b>OCA</b> (botão <b>?</b>) e escolha o item.
                </div>
            </div>`;

        return materialHTML + equipSection;
    };

    console.log('✅ Inventário da Tesouraria enriquecido com equipamentos.');
})();

// =================================================================
// 4. CSS DOS CARDS DE EQUIPAMENTO
// =================================================================
(function injectEquipCardsCSS() {
    if (document.getElementById('equipCardsStyle')) return;
    const style = document.createElement('style');
    style.id = 'equipCardsStyle';
    style.textContent = `
        /* ============ CARDS NO PAINEL DO HERÓI ============ */
        .equip-subsection-title {
            font-family: 'Cinzel', serif;
            color: #e8b923;
            font-size: 0.75rem;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px solid rgba(201, 162, 39, 0.2);
        }

        .equip-cards-grid {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .equip-card {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: rgba(10, 6, 2, 0.55);
            border: 2px solid rgba(201, 162, 39, 0.25);
            border-radius: 6px;
            transition: all 0.2s;
        }

        .equip-card:hover {
            border-color: rgba(201, 162, 39, 0.5);
            background: rgba(10, 6, 2, 0.75);
        }

        .equip-card.equipped {
            border-color: #6ba35c;
            background:
                linear-gradient(180deg, rgba(107, 163, 92, 0.12), transparent 60%),
                rgba(10, 6, 2, 0.6);
            box-shadow: 0 0 12px rgba(107, 163, 92, 0.25);
        }

        .equip-card-icon {
            width: 44px;
            height: 44px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: radial-gradient(circle, rgba(0,0,0,0.5), transparent 70%);
            border-radius: 4px;
        }

        .equip-card-icon img {
            width: 40px;
            height: 40px;
            object-fit: contain;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));
        }

        .equip-card-icon .weapon-emoji,
        .equip-card-icon .weapon-emoji-large {
            font-size: 2rem;
            line-height: 1;
        }

        .equip-card-info {
            flex: 1;
            min-width: 0;
        }

        .equip-card-name {
            font-family: 'Cinzel', serif;
            color: #f0e2c0;
            font-size: 0.9rem;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
            line-height: 1.15;
        }

        .equip-card-bonus {
            font-family: 'EB Garamond', serif;
            color: #8ac070;
            font-size: 0.78rem;
            line-height: 1.3;
        }

        .equip-elem-bonus {
            color: #c8b787;
            font-style: italic;
            font-size: 0.72rem;
        }

        .equip-card-elem {
            font-family: 'Cinzel', serif;
            font-size: 0.7rem;
            letter-spacing: 1px;
            margin-top: 4px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            border-radius: 10px;
            background: rgba(10, 6, 2, 0.5);
            border: 1px solid rgba(201, 162, 39, 0.3);
        }

        .equip-card-elem img {
            width: 12px;
            height: 12px;
            object-fit: contain;
        }

        .equip-elem-FOGO   { color: #e74c3c; border-color: rgba(231, 76, 60, 0.5); }
        .equip-elem-AGUA   { color: #3498db; border-color: rgba(52, 152, 219, 0.5); }
        .equip-elem-TERRA  { color: #27ae60; border-color: rgba(39, 174, 96, 0.5); }
        .equip-elem-AR     { color: #f1c40f; border-color: rgba(241, 196, 15, 0.5); }
        .equip-elem-abissal{ color: #c39bd3; border-color: rgba(195, 155, 211, 0.6);
                              background: linear-gradient(180deg, rgba(142, 68, 173, 0.2), transparent 70%); }

        .equip-card-btn {
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 0.75rem;
            letter-spacing: 1px;
            transition: all 0.2s;
            flex-shrink: 0;
            white-space: nowrap;
        }

        .equip-card-btn.equip {
            background:
                linear-gradient(180deg, rgba(232, 185, 35, 0.2), transparent 45%),
                linear-gradient(135deg, #8a6a2e, #4a3418);
            color: #fff5dc;
            border: 1.5px solid #e8b923;
        }

        .equip-card-btn.equip:hover {
            transform: translateY(-1px);
            box-shadow: 0 3px 10px rgba(0,0,0,0.5), 0 0 15px rgba(232, 185, 35, 0.4);
        }

        .equip-card-btn.unequip {
            background:
                linear-gradient(180deg, rgba(168, 50, 50, 0.15), transparent 45%),
                linear-gradient(135deg, #6a2020, #3a1010);
            color: #f5c8c8;
            border: 1.5px solid #a83232;
        }

        .equip-card-btn.unequip:hover {
            transform: translateY(-1px);
            box-shadow: 0 3px 10px rgba(0,0,0,0.5), 0 0 15px rgba(168, 50, 50, 0.4);
        }

        .equip-empty-msg {
            font-family: 'EB Garamond', serif;
            color: #8a7a52;
            font-size: 0.85rem;
            font-style: italic;
            padding: 10px;
            background: rgba(10, 6, 2, 0.4);
            border-left: 3px solid #6a5024;
            border-radius: 4px;
            line-height: 1.4;
        }

        /* ============ SEÇÃO DE EQUIPAMENTOS NO INVENTÁRIO ============ */
        .inv-equipment-section {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 2px solid rgba(201, 162, 39, 0.25);
        }

        .inv-equipment-title {
            font-family: 'Cinzel', serif;
            color: #e8b923;
            font-size: 0.9rem;
            letter-spacing: 2px;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 1px solid rgba(201, 162, 39, 0.2);
        }

        .inv-equip-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .inv-equip-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            background: rgba(10, 6, 2, 0.5);
            border: 1px solid rgba(201, 162, 39, 0.2);
            border-left: 3px solid #c9a227;
            border-radius: 5px;
            transition: all 0.2s;
        }

        .inv-equip-row:hover {
            border-left-color: #e8b923;
            background: rgba(10, 6, 2, 0.7);
        }

        .inv-equip-row.amulet {
            border-left-color: #8e44ad;
        }

        .inv-equip-row.amulet:hover {
            border-left-color: #c39bd3;
        }

        .inv-equip-icon {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            background: radial-gradient(circle, rgba(0,0,0,0.4), transparent 70%);
            border-radius: 4px;
        }

        .inv-equip-icon img {
            width: 36px;
            height: 36px;
            object-fit: contain;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));
        }

        .inv-equip-icon .weapon-emoji,
        .inv-equip-icon .weapon-emoji-large {
            font-size: 1.8rem;
            line-height: 1;
        }

        .inv-equip-info {
            flex: 1;
            min-width: 0;
        }

        .inv-equip-name {
            font-family: 'Cinzel', serif;
            color: #f0e2c0;
            font-size: 0.92rem;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
            line-height: 1.15;
        }

        .inv-equip-meta {
            font-family: 'EB Garamond', serif;
            color: #b8a577;
            font-size: 0.8rem;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            flex-wrap: wrap;
        }

        .inv-equip-meta img {
            width: 14px;
            height: 14px;
            object-fit: contain;
            vertical-align: middle;
        }

        .inv-equip-owner {
            font-family: 'EB Garamond', serif;
            font-size: 0.82rem;
            padding: 4px 10px;
            border-radius: 12px;
            white-space: nowrap;
            flex-shrink: 0;
        }

        .inv-equip-owner.used {
            background: rgba(107, 163, 92, 0.15);
            border: 1px solid rgba(107, 163, 92, 0.4);
            color: #8ac070;
        }

        .inv-equip-owner.free {
            background: rgba(10, 6, 2, 0.4);
            border: 1px dashed rgba(201, 162, 39, 0.3);
            color: #8a7a52;
            font-style: italic;
        }

        .inv-empty-line {
            font-family: 'EB Garamond', serif;
            color: #8a7a52;
            font-size: 0.85rem;
            font-style: italic;
            padding: 10px;
            background: rgba(10, 6, 2, 0.3);
            border-radius: 4px;
            text-align: center;
        }

        .inv-equipment-hint {
            margin-top: 16px;
            padding: 12px;
            background: rgba(201, 162, 39, 0.06);
            border-left: 3px solid #c9a227;
            border-radius: 4px;
            font-family: 'EB Garamond', serif;
            color: #d9c89a;
            font-size: 0.88rem;
            font-style: italic;
            line-height: 1.5;
        }

        /* Responsivo */
        @media (max-width: 600px) {
            .equip-card {
                flex-wrap: wrap;
            }
            .equip-card-btn {
                width: 100%;
                margin-top: 6px;
            }
            .inv-equip-row {
                flex-wrap: wrap;
            }
            .inv-equip-owner {
                width: 100%;
                text-align: center;
                margin-top: 4px;
            }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS dos cards de equipamento injetado.');
})();

// =================================================================
// 5. EXPÕE NO WINDOW
// =================================================================
// (handlers já expostos no item 2)

console.log('✅ BLOCO CORRETIVO 3 (V9.0 — Equipamento Visual) carregado.');
// =================================================================
// historia.js — BLOCO CORRETIVO 4 (V9.0 — Atmosfera Intensificada)
// -----------------------------------------------------------------
// Cole NO FINAL de historia.js, depois do Bloco 3.
//
// Contém:
//   1. Tint por ato (tinge o tabuleiro inteiro com mix-blend-mode)
//   2. Vinheta temática nas bordas
//   3. Partículas intensificadas (~40% mais + maiores)
//   4. Substitui applyBoardAtmosphere por versão mais rica
// =================================================================

// =================================================================
// 1. TABELA DE TINT POR ATO
// -----------------------------------------------------------------
// Cada ato tem:
//   • tintCor:    cor base do tint (aplicado via overlay)
//   • tintMix:    mix-blend-mode do tint
//   • tintOpac:   opacidade máxima do tint
//   • vinhetaCor: cor da vinheta (radial escuro nas bordas)
//   • vinhetaOpac: opacidade da vinheta
// =================================================================
const STORY_ATO_TINT = {
    1:  { tintCor: 'rgba(74, 138, 58, 0.28)',   tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(20, 40, 15, 0.75)',  vinhetaOpac: 1 },
    2:  { tintCor: 'rgba(139, 100, 40, 0.32)',  tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(40, 30, 10, 0.8)',   vinhetaOpac: 1 },
    3:  { tintCor: 'rgba(58, 124, 165, 0.35)',  tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(15, 35, 55, 0.8)',   vinhetaOpac: 1 },
    4:  { tintCor: 'rgba(200, 60, 20, 0.32)',   tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(50, 12, 5, 0.8)',    vinhetaOpac: 1 },
    5:  { tintCor: 'rgba(230, 110, 35, 0.35)',  tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(45, 18, 5, 0.8)',    vinhetaOpac: 1 },
    6:  { tintCor: 'rgba(180, 140, 90, 0.35)',  tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(45, 35, 20, 0.8)',   vinhetaOpac: 1 },
    7:  { tintCor: 'rgba(80, 110, 150, 0.35)',  tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(15, 25, 45, 0.85)',  vinhetaOpac: 1 },
    8:  { tintCor: 'rgba(142, 68, 173, 0.35)',  tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(35, 10, 55, 0.85)',  vinhetaOpac: 1 },
    9:  { tintCor: 'rgba(232, 67, 147, 0.28)',  tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(45, 10, 35, 0.8)',   vinhetaOpac: 1 },
    10: { tintCor: 'rgba(44, 62, 80, 0.45)',    tintMix: 'multiply',   tintOpac: 1,    vinhetaCor: 'rgba(5, 10, 20, 0.9)',    vinhetaOpac: 1 },
    11: { tintCor: 'rgba(241, 196, 15, 0.28)',  tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(40, 35, 5, 0.8)',    vinhetaOpac: 1 },
    12: { tintCor: 'rgba(255, 165, 40, 0.35)',  tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(50, 25, 5, 0.85)',   vinhetaOpac: 1 },
    13: { tintCor: 'rgba(80, 20, 120, 0.40)',   tintMix: 'multiply',   tintOpac: 1,    vinhetaCor: 'rgba(15, 0, 25, 0.95)',   vinhetaOpac: 1 },
};

// =================================================================
// 2. CSS NOVO (substitui o anterior)
// =================================================================
(function injectIntenseAtmosphereCSS() {
    // Remove o antigo
    const old = document.getElementById('atmosphereStyleClean');
    if (old) old.remove();

    const style = document.createElement('style');
    style.id = 'atmosphereStyleClean';
    style.textContent = `
        /* ============ BOARD ============ */
        #board {
            position: relative;
        }

        /* ============ CAMADAS ============ */
        #board > .board-atmosphere {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            border-radius: 6px;
            overflow: hidden;
            z-index: 0;
        }

        #board > .board-tint {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            border-radius: 6px;
            overflow: hidden;
            z-index: 2;
            transition: opacity 0.6s ease;
        }

        #board > .board-vignette {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            border-radius: 6px;
            overflow: hidden;
            z-index: 3;
        }

        #board > .board-particles {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
            border-radius: 6px;
            z-index: 4;
        }

        #board > .grid {
            position: relative;
            z-index: 1;
        }

        #board > .token {
            z-index: 10;
        }

        #board > .story-fx,
        #board > [class*="fx-"] {
            z-index: 50;
        }

        /* ============ PARTÍCULAS ============ */
        .atm-particle {
            position: absolute;
            pointer-events: none;
            opacity: 0;
            will-change: top, bottom, left, transform, opacity;
        }

        /* 1. FOLHAS */
        .atm-particle.pt-folha {
            top: -30px;
            width: var(--p-size, 12px);
            height: var(--p-size, 12px);
            background: linear-gradient(135deg, #6a8a4a, #3a5020);
            border-radius: 50% 10% 50% 10%;
            box-shadow: 0 0 6px rgba(0,0,0,0.5);
            animation: folhaFall linear infinite;
        }
        @keyframes folhaFall {
            0%   { top: -30px;             transform: translateX(0) rotate(0deg); opacity: 0; }
            10%  { opacity: 0.95; }
            50%  { top: 50%;               transform: translateX(30px) rotate(180deg); opacity: 1; }
            90%  { opacity: 0.85; }
            100% { top: calc(100% + 30px); transform: translateX(-20px) rotate(360deg); opacity: 0; }
        }

        /* 2. NÉVOA ÂMBAR */
        .atm-particle.pt-poeira-ambar {
            bottom: -30px;
            width: var(--p-size, 8px);
            height: var(--p-size, 8px);
            background: radial-gradient(circle, #e8b923, rgba(217,184,64,0));
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(232, 185, 35, 0.7);
            animation: poeiraFlutua ease-in-out infinite;
        }
        @keyframes poeiraFlutua {
            0%   { bottom: -30px;             transform: translateX(0) scale(0.6); opacity: 0; }
            30%  { opacity: 1; }
            50%  { bottom: 40%;               transform: translateX(20px) scale(1.3); opacity: 0.9; }
            80%  { opacity: 0.75; }
            100% { bottom: calc(100% + 30px); transform: translateX(-15px) scale(0.7); opacity: 0; }
        }

        /* 3. ÁGUA (BOLHAS) */
        .atm-particle.pt-bolha {
            bottom: -20px;
            width: var(--p-size, 12px);
            height: var(--p-size, 12px);
            background: radial-gradient(circle at 30% 30%, rgba(200,230,245,0.95), rgba(74,140,181,0.6) 60%, transparent 100%);
            border: 1.5px solid rgba(200,230,245,0.6);
            border-radius: 50%;
            box-shadow: 0 0 8px rgba(74, 140, 181, 0.6);
            animation: bolhaSobe ease-in infinite;
        }
        @keyframes bolhaSobe {
            0%   { bottom: -20px;             transform: translateX(0) scale(0.5); opacity: 0; }
            20%  { opacity: 1; }
            80%  { opacity: 0.85; }
            100% { bottom: calc(100% + 20px); transform: translateX(15px) scale(1.4); opacity: 0; }
        }

        /* 4. BRASAS */
        .atm-particle.pt-brasa {
            bottom: -20px;
            width: var(--p-size, 8px);
            height: var(--p-size, 8px);
            background: radial-gradient(circle, #fff5dc 0%, #e67e22 40%, #a83232 80%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 12px rgba(232, 110, 35, 1), 0 0 20px rgba(232, 110, 35, 0.6);
            animation: brasaSubindo ease-out infinite;
        }
        @keyframes brasaSubindo {
            0%   { bottom: -20px;             transform: translateX(0) scale(0.4); opacity: 0; }
            15%  { opacity: 1; }
            70%  { opacity: 0.95; }
            100% { bottom: calc(100% + 20px); transform: translateX(25px) scale(0.3); opacity: 0; }
        }

        /* 5. FAÍSCAS */
        .atm-particle.pt-faisca {
            bottom: -10px;
            width: var(--p-size, 6px);
            height: var(--p-size, 6px);
            background: #e8b923;
            border-radius: 50%;
            box-shadow: 0 0 12px #e8b923, 0 0 22px rgba(232,185,35,0.8);
            animation: faiscaPula ease-out infinite;
        }
        @keyframes faiscaPula {
            0%   { bottom: -10px;             transform: translateX(0) scale(0.3); opacity: 0; }
            20%  { opacity: 1; }
            60%  { opacity: 0.9; }
            100% { bottom: calc(100% + 10px); transform: translateX(35px) scale(0.2); opacity: 0; }
        }

        /* 6. POEIRA */
        .atm-particle.pt-poeira {
            left: -30px;
            width: var(--p-size, 10px);
            height: var(--p-size, 10px);
            background: radial-gradient(circle, rgba(200, 160, 100, 0.9), rgba(139,90,43,0));
            border-radius: 50%;
            box-shadow: 0 0 8px rgba(200, 160, 100, 0.6);
            animation: poeiraHorizontal linear infinite;
        }
        @keyframes poeiraHorizontal {
            0%   { left: -30px;              transform: translateY(0) scale(0.6); opacity: 0; }
            20%  { opacity: 0.9; }
            80%  { opacity: 0.75; }
            100% { left: calc(100% + 30px);  transform: translateY(-15px) scale(1); opacity: 0; }
        }

        /* 7. LUAR */
        .atm-particle.pt-luar {
            bottom: -20px;
            width: var(--p-size, 8px);
            height: var(--p-size, 8px);
            background: radial-gradient(circle, #d0e0f0, rgba(168,192,216,0));
            border-radius: 50%;
            box-shadow: 0 0 12px rgba(168,192,216,1), 0 0 24px rgba(168,192,216,0.6);
            animation: luarSobe ease-in-out infinite;
        }
        @keyframes luarSobe {
            0%   { bottom: -20px;             transform: scale(0.5); opacity: 0; }
            30%  { opacity: 0.95; }
            70%  { opacity: 0.85; }
            100% { bottom: calc(100% + 20px); transform: scale(1.2); opacity: 0; }
        }

        /* 8. FUMAÇA ROXA + COGUMELOS */
        .atm-particle.pt-fumaca {
            bottom: -30px;
            width: var(--p-size, 20px);
            height: var(--p-size, 20px);
            background: radial-gradient(circle, rgba(142,68,173,0.85) 0%, rgba(90,42,112,0.55) 40%, transparent 75%);
            border-radius: 50%;
            filter: blur(4px);
            animation: fumacaSobe ease-in-out infinite;
        }
        @keyframes fumacaSobe {
            0%   { bottom: -30px;             transform: translateX(0) scale(0.5); opacity: 0; }
            30%  { opacity: 0.75; }
            70%  { opacity: 0.65; }
            100% { bottom: calc(100% + 30px); transform: translateX(25px) scale(1.6); opacity: 0; }
        }
        .atm-particle.pt-cogumelo {
            top: 50%;
            width: var(--p-size, 10px);
            height: var(--p-size, 10px);
            background: radial-gradient(circle, #c080e0 0%, #8e44ad 60%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 15px rgba(192,128,224,1), 0 0 28px rgba(142,68,173,0.6);
            animation: cogumeloPisca ease-in-out infinite;
        }
        @keyframes cogumeloPisca {
            0%, 100% { opacity: 0.35; transform: scale(0.7); }
            50%      { opacity: 1;   transform: scale(1.4); }
        }

        /* 9. RIO */
        .atm-particle.pt-bolha-rio {
            bottom: -20px;
            width: var(--p-size, 12px);
            height: var(--p-size, 12px);
            background: radial-gradient(circle at 30% 30%, rgba(232,67,147,0.85), rgba(52,152,219,0.55) 60%, transparent 100%);
            border: 1.5px solid rgba(232, 67, 147, 0.7);
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(232, 67, 147, 0.6);
            animation: bolhaRioSobe ease-in infinite;
        }
        @keyframes bolhaRioSobe {
            0%   { bottom: -20px;             transform: translateX(0) scale(0.5); opacity: 0; }
            20%  { opacity: 1; }
            80%  { opacity: 0.85; }
            100% { bottom: calc(100% + 20px); transform: translateX(-15px) scale(1.5); opacity: 0; }
        }

        /* 10. GOTAS */
        .atm-particle.pt-gota {
            top: -20px;
            width: 3px;
            height: 14px;
            background: linear-gradient(180deg, transparent, rgba(168, 192, 216, 1));
            box-shadow: 0 0 4px rgba(168, 192, 216, 0.8);
            animation: gotaCai linear infinite;
        }
        @keyframes gotaCai {
            0%   { top: -20px;             opacity: 0; }
            10%  { opacity: 1; }
            100% { top: calc(100% + 20px); opacity: 0.6; }
        }

        /* 11. ESTRELAS */
        .atm-particle.pt-estrela {
            top: 30%;
            width: var(--p-size, 8px);
            height: var(--p-size, 8px);
            background: radial-gradient(circle, #fff5dc, #f1c40f 60%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 12px #f1c40f, 0 0 24px rgba(241, 196, 15, 0.6);
            animation: estrelaPisca ease-in-out infinite;
        }
        @keyframes estrelaPisca {
            0%, 100% { opacity: 0.25; transform: scale(0.7); }
            50%      { opacity: 1;   transform: scale(1.5); }
        }

        /* 12. SOL */
        .atm-particle.pt-sol {
            bottom: -20px;
            width: var(--p-size, 10px);
            height: var(--p-size, 10px);
            background: radial-gradient(circle, #fff5dc 0%, #e8b923 50%, #a83232 100%);
            border-radius: 50%;
            box-shadow: 0 0 18px rgba(232, 185, 35, 1), 0 0 35px rgba(232, 185, 35, 0.6);
            animation: solFaisca ease-out infinite;
        }
        @keyframes solFaisca {
            0%   { bottom: -20px;             transform: translateX(0) scale(0.4); opacity: 0; }
            20%  { opacity: 1; }
            60%  { opacity: 0.95; }
            100% { bottom: calc(100% + 20px); transform: translateX(30px) scale(0.3); opacity: 0; }
        }

        /* 13. ABISMO */
        .atm-particle.pt-abismo {
            top: 40%;
            width: var(--p-size, 10px);
            height: var(--p-size, 10px);
            background: radial-gradient(circle, #c080e0, #6a1090 60%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 18px rgba(106, 16, 144, 1), 0 0 32px rgba(142, 68, 173, 0.7);
            animation: abismoFlutua ease-in-out infinite;
        }
        @keyframes abismoFlutua {
            0%, 100% { transform: translate(0, 0) scale(0.7); opacity: 0.5; }
            50%      { transform: translate(15px, -20px) scale(1.4); opacity: 1; }
        }

        /* ============ FUNDOS POR ATO (INTENSIFICADOS) ============ */
        .board-atmosphere.atm-folhas-bg {
            background:
                radial-gradient(ellipse at 30% 20%, rgba(120, 180, 90, 0.25) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 80%, rgba(74, 107, 58, 0.20) 0%, transparent 55%);
        }
        .board-atmosphere.atm-nevoa-ambar-bg {
            background:
                radial-gradient(ellipse at top, rgba(217,184,64,0.28), transparent 55%),
                radial-gradient(ellipse at bottom, rgba(139, 100, 40, 0.30), transparent 60%);
        }
        .board-atmosphere.atm-agua-bg {
            background:
                linear-gradient(180deg, rgba(52,152,219,0.20) 0%, rgba(52,152,219,0.35) 50%, rgba(52,152,219,0.20) 100%),
                radial-gradient(ellipse at bottom, rgba(20, 60, 100, 0.4), transparent 60%);
        }
        .board-atmosphere.atm-brasas-bg {
            background:
                radial-gradient(ellipse at bottom, rgba(232,110,35,0.45) 0%, rgba(168,50,50,0.25) 40%, transparent 75%);
        }
        .board-atmosphere.atm-chamas-bg {
            background:
                linear-gradient(90deg, rgba(232,110,35,0.35) 0%, transparent 20%, transparent 80%, rgba(232,110,35,0.35) 100%),
                radial-gradient(ellipse at bottom, rgba(255,80,20,0.4), transparent 60%);
        }
        .board-atmosphere.atm-poeira-bg {
            background:
                radial-gradient(ellipse at top, rgba(217,184,64,0.20), transparent 55%),
                linear-gradient(180deg, rgba(200, 160, 100, 0.25), rgba(139,90,43,0.35));
        }
        .board-atmosphere.atm-luar-bg {
            background:
                radial-gradient(ellipse at top, rgba(168,192,216,0.35), transparent 55%),
                linear-gradient(180deg, rgba(80,110,150,0.25), rgba(20,30,50,0.40));
        }
        .board-atmosphere.atm-fumaca-roxa-bg {
            background:
                radial-gradient(circle at 25% 70%, rgba(142,68,173,0.40), transparent 45%),
                radial-gradient(circle at 75% 30%, rgba(90,42,112,0.40), transparent 45%),
                linear-gradient(180deg, rgba(80,20,120,0.25), rgba(35,10,55,0.40));
        }
        .board-atmosphere.atm-rio-bolhas-bg {
            background:
                linear-gradient(180deg, rgba(232,67,147,0.18) 0%, rgba(52,152,219,0.30) 50%, rgba(232,67,147,0.20) 100%),
                radial-gradient(ellipse at top, rgba(255, 100, 180, 0.20), transparent 60%);
        }
        .board-atmosphere.atm-tempestade-bg {
            background:
                radial-gradient(ellipse at top, rgba(44,62,80,0.50), transparent 55%),
                linear-gradient(180deg, rgba(20,30,45,0.45), rgba(5,10,20,0.55));
        }
        .board-atmosphere.atm-estrelas-bg {
            background:
                radial-gradient(ellipse at top, rgba(241,196,15,0.22), transparent 55%),
                radial-gradient(ellipse at bottom, rgba(168,192,216,0.22), transparent 60%),
                linear-gradient(180deg, rgba(60, 50, 15, 0.20), rgba(20, 15, 5, 0.30));
        }
        .board-atmosphere.atm-sol-bg {
            background:
                radial-gradient(ellipse at top, rgba(255, 180, 40, 0.40), transparent 60%),
                linear-gradient(180deg, rgba(255, 140, 30, 0.30), rgba(168, 50, 30, 0.30));
        }
        .board-atmosphere.atm-abismo-bg {
            background:
                radial-gradient(ellipse at center, rgba(120, 30, 180, 0.45), transparent 60%),
                linear-gradient(180deg, rgba(50, 10, 80, 0.45), rgba(15, 0, 25, 0.55));
        }

        @media (prefers-reduced-motion: reduce) {
            .atm-particle { animation: none !important; }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS intensificado da atmosfera injetado.');
})();

// =================================================================
// 3. GERADOR DE PARTÍCULAS — versão intensificada
// =================================================================
function generateParticlesIntense(cid) {
    const atmClass = STORY_ATO_ATMOSPHERE[cid];
    if (!atmClass) return '';

    const makeParticles = (count, cls, opts = {}) => {
        let html = '';
        for (let i = 0; i < count; i++) {
            const left = Math.random() * 100;
            const delay = Math.random() * 6;
            const duration = 4 + Math.random() * 4;
            const size = opts.sizeMin + Math.random() * (opts.sizeMax - opts.sizeMin);

            html += `<div class="atm-particle ${cls}"
                          style="left:${left}%;animation-delay:-${delay}s;animation-duration:${duration}s;--p-size:${size}px;"></div>`;
        }
        return html;
    };

    // Contagem +40%, tamanho +30%
    switch (atmClass) {
        case 'atm-folhas':      return makeParticles(20, 'pt-folha',        { sizeMin:8,  sizeMax:16 });
        case 'atm-nevoa-ambar': return makeParticles(18, 'pt-poeira-ambar', { sizeMin:5,  sizeMax:9  });
        case 'atm-agua':        return makeParticles(24, 'pt-bolha',        { sizeMin:6,  sizeMax:13 });
        case 'atm-brasas':      return makeParticles(26, 'pt-brasa',        { sizeMin:4,  sizeMax:9  });
        case 'atm-chamas':      return makeParticles(28, 'pt-faisca',       { sizeMin:3,  sizeMax:7  });
        case 'atm-poeira':      return makeParticles(20, 'pt-poeira',       { sizeMin:6,  sizeMax:11 });
        case 'atm-luar':        return makeParticles(18, 'pt-luar',         { sizeMin:5,  sizeMax:9  });
        case 'atm-fumaca-roxa': return makeParticles(14, 'pt-fumaca',       { sizeMin:12, sizeMax:22 })
                                     + makeParticles(12, 'pt-cogumelo',     { sizeMin:7,  sizeMax:12 });
        case 'atm-rio-bolhas':  return makeParticles(28, 'pt-bolha-rio',    { sizeMin:6,  sizeMax:13 });
        case 'atm-tempestade':  return makeParticles(32, 'pt-gota',         { sizeMin:2,  sizeMax:4  });
        case 'atm-estrelas':    return makeParticles(28, 'pt-estrela',      { sizeMin:5,  sizeMax:10 });
        case 'atm-sol':         return makeParticles(24, 'pt-sol',          { sizeMin:6,  sizeMax:12 });
        case 'atm-abismo':      return makeParticles(24, 'pt-abismo',       { sizeMin:6,  sizeMax:11 });
        default:                return '';
    }
}

// =================================================================
// 4. clearBoardAtmosphere — remove as novas camadas também
// =================================================================
function clearBoardAtmosphereIntense() {
    const board = document.getElementById('board');
    if (!board) return;

    board.querySelectorAll(':scope > .board-atmosphere, :scope > .board-tint, :scope > .board-vignette, :scope > .board-particles').forEach(el => el.remove());

    board.classList.forEach(cls => {
        if (cls.startsWith('atm-')) board.classList.remove(cls);
    });
    board.classList.remove('has-atmosphere');
}

// =================================================================
// 5. applyBoardAtmosphere — versão intensificada
// =================================================================
function applyBoardAtmosphereIntense(cid) {
    const board = document.getElementById('board');
    if (!board) return;
    if (!window._storyMode) return;
    if (!cid) return;

    clearBoardAtmosphereIntense();

    const atmClass = STORY_ATO_ATMOSPHERE[cid];
    if (!atmClass) return;

    const tintCfg = STORY_ATO_TINT[cid];
    if (!tintCfg) return;

    board.classList.add(atmClass);
    board.classList.add('has-atmosphere');

    // ---- Camada 1: fundo temático ----
    const atmos = document.createElement('div');
    atmos.className = 'board-atmosphere ' + atmClass + '-bg';
    board.appendChild(atmos);

    // ---- Camada 2: tint colorido (por cima do grid) ----
    const tint = document.createElement('div');
    tint.className = 'board-tint';
    tint.style.background = tintCfg.tintCor;
    tint.style.mixBlendMode = tintCfg.tintMix;
    tint.style.opacity = tintCfg.tintOpac;
    board.appendChild(tint);

    // ---- Camada 3: vinheta ----
    const vin = document.createElement('div');
    vin.className = 'board-vignette';
    vin.style.background = `radial-gradient(ellipse at center, transparent 30%, ${tintCfg.vinhetaCor} 100%)`;
    vin.style.opacity = tintCfg.vinhetaOpac;
    board.appendChild(vin);

    // ---- Camada 4: partículas ----
    const part = document.createElement('div');
    part.className = 'board-particles ' + atmClass + '-pt';
    part.innerHTML = generateParticlesIntense(cid);
    board.appendChild(part);

    // Reorganiza a ordem no DOM: grid primeiro
    const grid = board.querySelector(':scope > .grid');
    if (grid && grid !== board.firstElementChild) {
        board.insertBefore(grid, board.firstElementChild);
    }

    console.log('[atmosfera] Aplicada (intensa) no Ato', cid, '→', atmClass, '| tint:', tintCfg.tintCor);
}

// =================================================================
// 6. HOOKS — substitui applyBoardAtmosphere e clearBoardAtmosphere
// =================================================================
(function hookIntenseAtmosphere() {
    // Expõe as novas funções
    window.applyBoardAtmosphere = applyBoardAtmosphereIntense;
    window.clearBoardAtmosphere = clearBoardAtmosphereIntense;

    // Reinstala o hook do initStoryBattle (já existia, mas agora usa a versão nova)
    const _origInit = window.initStoryBattle;
    if (typeof _origInit === 'function') {
        // Marca que já foi hookado por este bloco
        if (!window._intenseAtmosphereHookInstalled) {
            window._intenseAtmosphereHookInstalled = true;

            window.initStoryBattle = async function() {
                await _origInit.apply(this, arguments);
                await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
                const cid = STORY_PROGRESS.currentChapter || 1;
                applyBoardAtmosphereIntense(cid);
            };
        }
    }

    // Reinstala o hook de cleanup
    const _origFinish = window.finishStoryPhase;
    if (typeof _origFinish === 'function' && !window._intenseAtmosphereCleanupInstalled) {
        window._intenseAtmosphereCleanupInstalled = true;
        window.finishStoryPhase = function() {
            clearBoardAtmosphereIntense();
            return _origFinish.apply(this, arguments);
        };
    }

    const _origReturn = window.returnFromStoryVictory;
    if (typeof _origReturn === 'function' && !window._intenseAtmosphereReturnInstalled) {
        window._intenseAtmosphereReturnInstalled = true;
        window.returnFromStoryVictory = function() {
            clearBoardAtmosphereIntense();
            return _origReturn.apply(this, arguments);
        };
    }
})();

// =================================================================
// 7. TESTES
// =================================================================
window.testAtmosphere = function(cid) {
    cid = parseInt(cid) || 1;
    applyBoardAtmosphereIntense(cid);
    console.log('[atmosfera] Testando Ato', cid);
};
window.clearAtmosphere = function() {
    clearBoardAtmosphereIntense();
    console.log('[atmosfera] Limpa.');
};

console.log('✅ BLOCO CORRETIVO 4 (V9.0 — Atmosfera Intensificada) carregado.');
// =================================================================
// historia.js — BLOCO CORRETIVO 5 (V9.0 — Consolidação Final)
// -----------------------------------------------------------------
// Cole NO FINAL de historia.js, depois do Bloco 4.
//
// Contém:
//   1. Ajuste do Ato 2 (Mata Fechada) — atmosfera correta
//   2. Re-log de versão consolidada (V9.0)
//   3. Sistema de "reconstrução de save" leve:
//      • Garante que todos os campos novos existem
//      • Corrige saves antigos que não têm enemiesDefeatedIds
//   4. Estatísticas de debug úteis no console
// =================================================================

// =================================================================
// 1. AJUSTE DO ATO 2 — Mata Fechada (era nevoa-ambar)
// -----------------------------------------------------------------
// Substitui a atmosfera do Ato 2:
//   • Remove partículas de poeira amarela subindo
//   • Adiciona folhas caindo + névoa densa escura no fundo
//   • Tint mais escuro/verde musgo
// =================================================================
(function fixAto2Atmosphere() {
    // 1.1 — Atualiza o mapa de atmosfera
    if (typeof STORY_ATO_ATMOSPHERE !== 'undefined') {
        STORY_ATO_ATMOSPHERE[2] = 'atm-mata-fechada';
    }

    // 1.2 — Atualiza o tint
    if (typeof STORY_ATO_TINT !== 'undefined') {
        STORY_ATO_TINT[2] = {
            tintCor: 'rgba(30, 60, 25, 0.38)',   // verde musgo escuro
            tintMix: 'multiply',                  // escurece em vez de overlay
            tintOpac: 1,
            vinhetaCor: 'rgba(10, 25, 8, 0.9)',   // vinheta muito escura
            vinhetaOpac: 1
        };
    }

    // 1.3 — Injeta o CSS da nova atmosfera do Ato 2
    if (!document.getElementById('ato2AtmosphereStyle')) {
        const style = document.createElement('style');
        style.id = 'ato2AtmosphereStyle';
        style.textContent = `
            /* ============ FUNDO DA MATA FECHADA ============ */
            .board-atmosphere.atm-mata-fechada-bg {
                background:
                    radial-gradient(ellipse at 50% 10%, rgba(80, 130, 60, 0.35) 0%, transparent 45%),
                    radial-gradient(ellipse at 20% 90%, rgba(20, 50, 15, 0.55) 0%, transparent 55%),
                    radial-gradient(ellipse at 80% 90%, rgba(20, 50, 15, 0.55) 0%, transparent 55%),
                    linear-gradient(180deg, rgba(30, 60, 25, 0.40), rgba(10, 25, 8, 0.55));
            }

            /* ============ PARTÍCULAS DA MATA FECHADA ============ */

            /* Folhas verdes caindo lentamente */
            .atm-particle.pt-folha-mata {
                top: -30px;
                width: var(--p-size, 12px);
                height: var(--p-size, 12px);
                background: linear-gradient(135deg, #4a6b3a 0%, #2d4523 60%, #1a2f14 100%);
                border-radius: 60% 20% 70% 20%;
                box-shadow:
                    0 0 4px rgba(0, 0, 0, 0.7),
                    inset 0 0 3px rgba(120, 180, 90, 0.4);
                animation: folhaMataFall linear infinite;
            }
            @keyframes folhaMataFall {
                0%   { top: -30px;             transform: translateX(0) rotate(0deg) scale(0.9); opacity: 0; }
                10%  { opacity: 1; }
                30%  { transform: translateX(-25px) rotate(120deg) scale(1); }
                60%  { transform: translateX(20px) rotate(280deg) scale(1); }
                90%  { opacity: 0.9; }
                100% { top: calc(100% + 30px); transform: translateX(-10px) rotate(420deg) scale(0.95); opacity: 0; }
            }

            /* Névoa densa subindo (mais escura que a do Ato 1) */
            .atm-particle.pt-nevoa-mata {
                bottom: -40px;
                width: var(--p-size, 24px);
                height: var(--p-size, 24px);
                background: radial-gradient(circle, rgba(80, 110, 70, 0.7) 0%, rgba(40, 70, 30, 0.5) 40%, transparent 75%);
                border-radius: 50%;
                filter: blur(5px);
                animation: nevoaMataSobe ease-in-out infinite;
            }
            @keyframes nevoaMataSobe {
                0%   { bottom: -40px;             transform: translateX(0) scale(0.5); opacity: 0; }
                25%  { opacity: 0.7; }
                60%  { opacity: 0.55; }
                100% { bottom: calc(100% + 40px); transform: translateX(30px) scale(1.8); opacity: 0; }
            }

            /* Esporos brilhantes (pequenos pontos verdes-claros) */
            .atm-particle.pt-esporo {
                top: 40%;
                width: var(--p-size, 6px);
                height: var(--p-size, 6px);
                background: radial-gradient(circle, #a8e088 0%, #6ba35c 60%, transparent 100%);
                border-radius: 50%;
                box-shadow: 0 0 8px rgba(168, 224, 136, 0.8);
                animation: esporoPisca ease-in-out infinite;
            }
            @keyframes esporoPisca {
                0%, 100% { opacity: 0.3; transform: scale(0.8); }
                50%      { opacity: 1;   transform: scale(1.4); }
            }

            /* Galhos/gravetos flutuando (raros) */
            .atm-particle.pt-graveto {
                top: -20px;
                width: var(--p-size, 4px);
                height: calc(var(--p-size, 4px) * 3);
                background: linear-gradient(180deg, #6a4a20, #3a2a14);
                border-radius: 1px;
                box-shadow: 0 0 3px rgba(0, 0, 0, 0.6);
                animation: gravetoFall linear infinite;
            }
            @keyframes gravetoFall {
                0%   { top: -20px;             transform: translateX(0) rotate(0deg); opacity: 0; }
                15%  { opacity: 0.85; }
                50%  { transform: translateX(-30px) rotate(180deg); }
                100% { top: calc(100% + 20px); transform: translateX(20px) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // 1.4 — Substitui generateParticlesIntense pra tratar o novo Ato 2
    const _origGenerate = window.generateParticlesIntense;
    if (typeof _origGenerate === 'function' && !window._ato2ParticlesPatched) {
        window._ato2ParticlesPatched = true;

        window.generateParticlesIntense = function(cid) {
            if (parseInt(cid) === 2) {
                // Ato 2 — Mata Fechada
                const makeP = (count, cls, opts = {}) => {
                    let html = '';
                    for (let i = 0; i < count; i++) {
                        const left = Math.random() * 100;
                        const delay = Math.random() * 6;
                        const duration = 5 + Math.random() * 4;
                        const size = opts.sizeMin + Math.random() * (opts.sizeMax - opts.sizeMin);
                        html += `<div class="atm-particle ${cls}"
                                      style="left:${left}%;animation-delay:-${delay}s;animation-duration:${duration}s;--p-size:${size}px;"></div>`;
                    }
                    return html;
                };
                return makeP(16, 'pt-folha-mata', { sizeMin: 8, sizeMax: 16 })
                     + makeP(14, 'pt-nevoa-mata', { sizeMin: 16, sizeMax: 28 })
                     + makeP(12, 'pt-esporo',     { sizeMin: 4, sizeMax: 8 })
                     + makeP(4,  'pt-graveto',    { sizeMin: 3, sizeMax: 6 });
            }
            return _origGenerate.apply(this, arguments);
        };
    }

    console.log('✅ Ato 2 corrigido — Mata Fechada com folhas, névoa e esporos.');
})();

// =================================================================
// 2. RECONSTRUÇÃO DE SAVE — garante todos os campos novos
// -----------------------------------------------------------------
// Roda uma vez ao carregar. Corrige saves antigos que possam ter
// ficado sem campos novos introduzidos pelos blocos V9.0.
// =================================================================
(function rebuildSaveIntegrity() {
    if (typeof STORY_PROGRESS === 'undefined') return;

    let changed = false;

    // 2.1 — Bestiário
    if (!Array.isArray(STORY_PROGRESS.enemiesDefeatedIds)) {
        STORY_PROGRESS.enemiesDefeatedIds = [];
        changed = true;
    }
    if (Array.isArray(STORY_PROGRESS.bossesDefeated)) {
        STORY_PROGRESS.bossesDefeated.forEach(id => {
            if (!STORY_PROGRESS.enemiesDefeatedIds.includes(id)) {
                STORY_PROGRESS.enemiesDefeatedIds.push(id);
                changed = true;
            }
        });
    }

    // 2.2 — Equipamentos por herói
    if (!STORY_PROGRESS.heroEquipment || typeof STORY_PROGRESS.heroEquipment !== 'object') {
        STORY_PROGRESS.heroEquipment = {};
        changed = true;
    }

    // 2.3 — Armas e amuletos forjados
    if (!Array.isArray(STORY_PROGRESS.craftedWeapons)) {
        STORY_PROGRESS.craftedWeapons = [];
        changed = true;
    }
    if (!Array.isArray(STORY_PROGRESS.craftedAmulets)) {
        STORY_PROGRESS.craftedAmulets = [];
        changed = true;
    }

    // 2.4 — Níveis e XP de heróis
    if (!STORY_PROGRESS.heroLevels || typeof STORY_PROGRESS.heroLevels !== 'object') {
        STORY_PROGRESS.heroLevels = {};
        changed = true;
    }
    if (!STORY_PROGRESS.heroXP || typeof STORY_PROGRESS.heroXP !== 'object') {
        STORY_PROGRESS.heroXP = {};
        changed = true;
    }

    // 2.5 — Estrelas
    if (!STORY_PROGRESS.starsByPhase || typeof STORY_PROGRESS.starsByPhase !== 'object') {
        STORY_PROGRESS.starsByPhase = {};
        changed = true;
    }

    // 2.6 — Heróis desbloqueados na história
    if (!Array.isArray(STORY_PROGRESS.unlockedHeroesStory)) {
        STORY_PROGRESS.unlockedHeroesStory = ['Tupa', 'Sume', 'Caipora'];
        changed = true;
    }

    // 2.7 — Capítulos e fases desbloqueados
    if (!Array.isArray(STORY_PROGRESS.unlockedChapters) || STORY_PROGRESS.unlockedChapters.length === 0) {
        STORY_PROGRESS.unlockedChapters = [1];
        changed = true;
    }
    if (!STORY_PROGRESS.unlockedPhases || Object.keys(STORY_PROGRESS.unlockedPhases).length === 0) {
        STORY_PROGRESS.unlockedPhases = { 1: ['1-1'] };
        changed = true;
    }

    // 2.8 — Fases completadas
    if (!Array.isArray(STORY_PROGRESS.completedPhases)) {
        STORY_PROGRESS.completedPhases = [];
        changed = true;
    }
    if (!Array.isArray(STORY_PROGRESS.phasesEverCompleted)) {
        STORY_PROGRESS.phasesEverCompleted = [];
        changed = true;
    }

    // 2.9 — Inventário
    if (!STORY_PROGRESS.inventory || typeof STORY_PROGRESS.inventory !== 'object') {
        STORY_PROGRESS.inventory = {};
        changed = true;
    }

    // 2.10 — Seleção de heróis
    if (!Array.isArray(STORY_PROGRESS.selectedHeroes) || STORY_PROGRESS.selectedHeroes.length === 0) {
        STORY_PROGRESS.selectedHeroes = ['Tupa'];
        changed = true;
    }

    if (changed && typeof saveStoryProgress === 'function') {
        saveStoryProgress();
        console.log('✅ Save reconstruído (campos ausentes corrigidos).');
    }
})();

// =================================================================
// 3. EXPÕE FERRAMENTAS DE DEBUG
// =================================================================
window.storyDebug = {
    // Mostra um resumo completo do estado atual
    dump: function() {
        console.group('📖 STORY DEBUG');
        console.log('Save ativo:', STORY_CURRENT_SAVE_NAME);
        console.log('Progresso:', STORY_PROGRESS);
        console.log('Elemento base:', getSaveElement());
        console.log('Estrelas:', getTotalStars(), '/', getMaxTotalStars());
        console.log('Heróis desbloqueados:', STORY_PROGRESS.unlockedHeroesStory);
        console.log('Armas forjadas:', STORY_PROGRESS.craftedWeapons);
        console.log('Amuletos forjados:', STORY_PROGRESS.craftedAmulets);
        console.log('Equipamentos:', STORY_PROGRESS.heroEquipment);
        console.log('Bestiário (IDs descobertos):', STORY_PROGRESS.enemiesDefeatedIds);
        console.log('Estados de herói (níveis):', STORY_PROGRESS.heroLevels);
        console.groupEnd();
    },

    // Testa uma arma específica
    testWeapon: function(weaponId) {
        const w = getWeaponById(weaponId);
        if (!w) {
            console.warn('Arma não encontrada:', weaponId);
            return;
        }
        console.group(`⚔️ ${w.nome}`);
        console.log('ID:', w.id);
        console.log('Tipo:', w.tipo);
        console.log('Ato:', w.ato);
        console.log('ATK base:', w.atkBonus);
        console.log('Elemento:', w.elemento);
        console.log('Bônus elemental:', w.elementoBonus);
        console.log('Custo ouro:', w.custoOuro);
        console.log('Receita:', w.receita);
        console.groupEnd();
    },

    // Lista todas as armas de um tipo
    listWeapons: function(tipo) {
        const filtered = Object.values(STORY_WEAPONS).filter(w => !tipo || w.tipo === tipo);
        console.table(filtered.map(w => ({
            id: w.id,
            nome: w.nome,
            ato: w.ato,
            tipo: w.tipo,
            atkBase: w.atkBonus,
            elem: w.elemento,
            elemBonus: w.elementoBonus,
            ouro: w.custoOuro,
        })));
    },

    // Simula o bônus de uma arma num tile específico
    simulateBonus: function(weaponId, tileElement, heroElement) {
        const w = getWeaponById(weaponId);
        if (!w) return;
        let weaponBonus = 0;
        if (w.elemento === 'ANY') {
            if (tileElement === heroElement) weaponBonus = w.elementoBonus;
        } else if (tileElement === w.elemento) {
            weaponBonus = w.elementoBonus;
        }
        const heroBonus = (tileElement === heroElement) ? 1 : 0;
        console.log(`⚔️ Simulação — ${w.nome}`);
        console.log(`Tile: ${tileElement} | Herói: ${heroElement} | Arma: ${w.elemento}`);
        console.log(`ATK base da arma: +${w.atkBonus}`);
        console.log(`Bônus elemental da arma: +${weaponBonus}`);
        console.log(`Bônus elemental do herói: +${heroBonus}`);
        console.log(`🎯 TOTAL extra: +${w.atkBonus + weaponBonus + heroBonus}`);
    },
};

// =================================================================
// 4. LOG FINAL CONSOLIDADO
// =================================================================
console.log('');
console.log('═══════════════════════════════════════════════════');
console.log('📖 historia.js — V9.0 CONSOLIDADO');
console.log('═══════════════════════════════════════════════════');
console.log('Blocos aplicados:');
console.log('  ✅ V8.x — Base do Modo História (13 atos)');
console.log('  ✅ V8.2 — Ritual, Bestiário, Filtros, Níveis');
console.log('  ✅ V8.3 — Tesouraria (Armas, Amuletos, Forja)');
console.log('  ✅ V8.5 — Atmosfera temática');
console.log('  ✅ V8.6 — Fixes (sprite boss + PA continuado)');
console.log('  ✅ V9.0-B1 — PA robusto, bestiário, purificação');
console.log('  ✅ V9.0-B2 — Armas escaladas + elemento');
console.log('  ✅ V9.0-B3 — Equipamento visual (cards)');
console.log('  ✅ V9.0-B4 — Atmosfera intensificada');
console.log('  ✅ V9.0-B5 — Consolidação final');
console.log('');
console.log('💡 Comandos úteis no console:');
console.log('   window.storyDebug.dump()              → resumo do estado');
console.log('   window.storyDebug.listWeapons()       → tabela de armas');
console.log('   window.storyDebug.listWeapons("tacape") → só tacapes');
console.log('   window.storyDebug.testWeapon("tacape_13") → detalhe de 1 arma');
console.log('   window.storyDebug.simulateBonus("tacape_1", "AR", "TERRA")');
console.log('   window.testAtmosphere(4)              → testa atmosfera do Ato 4');
console.log('   window.resetStoryMode()               → apaga todos os saves');
console.log('═══════════════════════════════════════════════════');
console.log('');
// =================================================================
// historia.js — BLOCO CORRETIVO 6 (V9.0 — Fix Esporos Ato 2)
// -----------------------------------------------------------------
// Corrige os esporos do Ato 2 que estavam estáticos numa fileira.
// Agora eles flutuam livremente pelo tabuleiro em todas as direções.
// =================================================================

(function fixEsporosAto2() {
    // Remove o CSS anterior dos esporos (se existir)
    const oldStyle = document.getElementById('ato2AtmosphereStyle');
    if (oldStyle) oldStyle.remove();

    // Injeta o CSS corrigido
    const style = document.createElement('style');
    style.id = 'ato2AtmosphereStyle';
    style.textContent = `
        /* ============ FUNDO DA MATA FECHADA ============ */
        .board-atmosphere.atm-mata-fechada-bg {
            background:
                radial-gradient(ellipse at 50% 10%, rgba(80, 130, 60, 0.35) 0%, transparent 45%),
                radial-gradient(ellipse at 20% 90%, rgba(20, 50, 15, 0.55) 0%, transparent 55%),
                radial-gradient(ellipse at 80% 90%, rgba(20, 50, 15, 0.55) 0%, transparent 55%),
                linear-gradient(180deg, rgba(30, 60, 25, 0.40), rgba(10, 25, 8, 0.55));
        }

        /* ============ PARTÍCULAS DA MATA FECHADA ============ */

        /* Folhas verdes caindo lentamente */
        .atm-particle.pt-folha-mata {
            top: -30px;
            width: var(--p-size, 12px);
            height: var(--p-size, 12px);
            background: linear-gradient(135deg, #4a6b3a 0%, #2d4523 60%, #1a2f14 100%);
            border-radius: 60% 20% 70% 20%;
            box-shadow:
                0 0 4px rgba(0, 0, 0, 0.7),
                inset 0 0 3px rgba(120, 180, 90, 0.4);
            animation: folhaMataFall linear infinite;
        }
        @keyframes folhaMataFall {
            0%   { top: -30px;             transform: translateX(0) rotate(0deg) scale(0.9); opacity: 0; }
            10%  { opacity: 1; }
            30%  { transform: translateX(-25px) rotate(120deg) scale(1); }
            60%  { transform: translateX(20px) rotate(280deg) scale(1); }
            90%  { opacity: 0.9; }
            100% { top: calc(100% + 30px); transform: translateX(-10px) rotate(420deg) scale(0.95); opacity: 0; }
        }

        /* Névoa densa subindo */
        .atm-particle.pt-nevoa-mata {
            bottom: -40px;
            width: var(--p-size, 24px);
            height: var(--p-size, 24px);
            background: radial-gradient(circle, rgba(80, 110, 70, 0.7) 0%, rgba(40, 70, 30, 0.5) 40%, transparent 75%);
            border-radius: 50%;
            filter: blur(5px);
            animation: nevoaMataSobe ease-in-out infinite;
        }
        @keyframes nevoaMataSobe {
            0%   { bottom: -40px;             transform: translateX(0) scale(0.5); opacity: 0; }
            25%  { opacity: 0.7; }
            60%  { opacity: 0.55; }
            100% { bottom: calc(100% + 40px); transform: translateX(30px) scale(1.8); opacity: 0; }
        }

        /* ✨ ESPOROS — agora flutuam livremente pelo tabuleiro */
        .atm-particle.pt-esporo {
            /* Posição inicial vem do style inline (left + top aleatórios) */
            width: var(--p-size, 6px);
            height: var(--p-size, 6px);
            background: radial-gradient(circle, #a8e088 0%, #6ba35c 60%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(168, 224, 136, 1), 0 0 20px rgba(107, 163, 92, 0.6);
            animation: esporoFlutua ease-in-out infinite;
        }
        @keyframes esporoFlutua {
            0% {
                opacity: 0;
                transform: translate(0, 0) scale(0.4);
            }
            15% {
                opacity: 0.4;
            }
            35% {
                opacity: 1;
                transform: translate(calc(var(--drift-x, 20px) * 0.4), calc(var(--drift-y, -20px) * 0.5)) scale(1.2);
            }
            65% {
                opacity: 0.9;
                transform: translate(calc(var(--drift-x, 20px) * 0.8), calc(var(--drift-y, -20px) * 0.85)) scale(0.9);
            }
            85% {
                opacity: 0.5;
            }
            100% {
                opacity: 0;
                transform: translate(var(--drift-x, 20px), var(--drift-y, -20px)) scale(0.4);
            }
        }

        /* Galhos/gravetos flutuando (raros) */
        .atm-particle.pt-graveto {
            top: -20px;
            width: var(--p-size, 4px);
            height: calc(var(--p-size, 4px) * 3);
            background: linear-gradient(180deg, #6a4a20, #3a2a14);
            border-radius: 1px;
            box-shadow: 0 0 3px rgba(0, 0, 0, 0.6);
            animation: gravetoFall linear infinite;
        }
        @keyframes gravetoFall {
            0%   { top: -20px;             transform: translateX(0) rotate(0deg); opacity: 0; }
            15%  { opacity: 0.85; }
            50%  { transform: translateX(-30px) rotate(180deg); }
            100% { top: calc(100% + 20px); transform: translateX(20px) rotate(360deg); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Sobrescreve o gerador de partículas do Ato 2
    // pra dar posição inicial aleatória (left E top) + direção de drift aleatória.
    const _origGen = window.generateParticlesIntense;
    if (typeof _origGen === 'function') {
        window.generateParticlesIntense = function(cid) {
            if (parseInt(cid) === 2) {
                // ---- Helper genérico ----
                const makeP = (count, cls, opts = {}) => {
                    let html = '';
                    for (let i = 0; i < count; i++) {
                        const left = Math.random() * 100;
                        const delay = Math.random() * 6;
                        const duration = opts.minDur + Math.random() * (opts.maxDur - opts.minDur);
                        const size = opts.sizeMin + Math.random() * (opts.sizeMax - opts.sizeMin);
                        html += `<div class="atm-particle ${cls}"
                                      style="left:${left}%;animation-delay:-${delay}s;animation-duration:${duration}s;--p-size:${size}px;"></div>`;
                    }
                    return html;
                };

                // ---- Helper SÓ pros esporos: posição inicial 2D + drift 2D ----
                const makeEsporos = (count) => {
                    let html = '';
                    for (let i = 0; i < count; i++) {
                        const left = Math.random() * 90 + 5;      // 5% a 95%
                        const top = Math.random() * 80 + 10;      // 10% a 90%
                        const delay = Math.random() * 8;
                        const duration = 6 + Math.random() * 5;   // 6s a 11s
                        const size = 4 + Math.random() * 5;       // 4px a 9px
                        // Direção de drift aleatória: -40px a +40px em X, -50px a +20px em Y
                        const driftX = (Math.random() * 80 - 40).toFixed(1);
                        const driftY = (Math.random() * 70 - 50).toFixed(1);
                        html += `<div class="atm-particle pt-esporo"
                                      style="left:${left}%;top:${top}%;
                                             animation-delay:-${delay}s;
                                             animation-duration:${duration}s;
                                             --p-size:${size}px;
                                             --drift-x:${driftX}px;
                                             --drift-y:${driftY}px;"></div>`;
                    }
                    return html;
                };

                // ---- Monta as 4 camadas ----
                // Folhas caem de cima pra baixo
                let html = makeP(16, 'pt-folha-mata', { sizeMin: 8, sizeMax: 16, minDur: 5, maxDur: 9 });
                // Névoa sobe de baixo pra cima
                html += makeP(14, 'pt-nevoa-mata', { sizeMin: 16, sizeMax: 28, minDur: 5, maxDur: 9 });
                // Esporos flutuam livremente (posição 2D + drift 2D)
                html += makeEsporos(16);
                // Gravetos caem de cima pra baixo
                html += makeP(4, 'pt-graveto', { sizeMin: 3, sizeMax: 6, minDur: 4, maxDur: 8 });

                return html;
            }
            return _origGen.apply(this, arguments);
        };
    }

    console.log('✅ Esporos do Ato 2 corrigidos — flutuam livremente.');
})();

console.log('✅ BLOCO CORRETIVO 6 (V9.0 — Fix Esporos Ato 2) carregado.');
// =================================================================
// historia.js — BLOCO 7 (V9.1 — Configurações do Modo História)
// -----------------------------------------------------------------
// Cole NO FINAL de historia.js, depois do Bloco 6.
//
// Contém:
//   1. Estrutura de configurações persistidas em localStorage
//   2. Tela de Configurações do Modo História (acessível pela Aldeia)
//   3. Slider de Intensidade da Atmosfera (aplica em tempo real)
//   4. Sliders de Volume (Música e Efeitos)
//   5. Toggle de Auto-Save visual
//   6. Botão "CONFIGURAÇÕES" na Aldeia
// =================================================================

// =================================================================
// 1. ESTRUTURA DE CONFIGURAÇÕES
// =================================================================
const STORY_SETTINGS_KEY = 'entity_story_settings';

const STORY_DEFAULT_SETTINGS = {
    atmosphereIntensity: 100,   // 0 a 150 (%)
    musicVolume: 70,            // 0 a 100 (%)
    sfxVolume: 80,              // 0 a 100 (%)
    autoSaveNotify: true,       // mostra "💾 Salvo!"
};

let STORY_SETTINGS = { ...STORY_DEFAULT_SETTINGS };

function loadStorySettings() {
    try {
        const raw = localStorage.getItem(STORY_SETTINGS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            STORY_SETTINGS = { ...STORY_DEFAULT_SETTINGS, ...parsed };
        }
    } catch(e) {
        console.warn('[settings] Falha ao carregar, usando padrão:', e);
    }
}

function saveStorySettings() {
    try {
        localStorage.setItem(STORY_SETTINGS_KEY, JSON.stringify(STORY_SETTINGS));
    } catch(e) {
        console.warn('[settings] Falha ao salvar:', e);
    }
}

// Aplica as configurações no jogo (chamado ao iniciar e ao mudar)
function applyStorySettings() {
    // ---- 1. Intensidade da atmosfera ----
    applyAtmosphereIntensity(STORY_SETTINGS.atmosphereIntensity);

    // ---- 2. Volume da música ----
    applyMusicVolume(STORY_SETTINGS.musicVolume);

    // ---- 3. Volume dos efeitos ----
    applySfxVolume(STORY_SETTINGS.sfxVolume);
}

function applyAtmosphereIntensity(pct) {
    // Multiplica a opacidade dos elementos de atmosfera
    // O CSS da atmosfera usa var(--atm-intensity, 1) como multiplicador
    const root = document.documentElement;
    const factor = Math.max(0, Math.min(1.5, pct / 100));
    root.style.setProperty('--atm-intensity', factor.toString());

    // Também aplica nas camadas diretamente (fallback, se o CSS não usar var)
    const tints = document.querySelectorAll('#board > .board-tint');
    const vins = document.querySelectorAll('#board > .board-vignette');
    const parts = document.querySelectorAll('#board > .board-particles');
    const atms = document.querySelectorAll('#board > .board-atmosphere');

    tints.forEach(el => el.style.opacity = factor);
    vins.forEach(el => el.style.opacity = factor);
    parts.forEach(el => el.style.opacity = factor);
    atms.forEach(el => el.style.opacity = Math.min(1, factor));

    console.log(`[settings] Atmosfera: ${pct}% (fator ${factor})`);
}

function applyMusicVolume(pct) {
    const vol = Math.max(0, Math.min(100, pct)) / 100;
    // Aplica em TODAS as faixas de música do sfx
    if (typeof sfx !== 'undefined') {
        const musicTracks = [
            'bgm', 'sacitema', 'mapinguaritema', 'boitatatema', 'iaratema',
            'corposecotema', 'lobisomemtema', 'cucatema', 'mulatema',
            'bototema', 'boitema', 'jacitema', 'guaracitema', 'anhangatema'
        ];
        musicTracks.forEach(k => {
            if (sfx[k]) sfx[k].volume = 0.3 * vol; // 0.3 era o volume original
        });
    }
    console.log(`[settings] Música: ${pct}%`);
}

function applySfxVolume(pct) {
    // Guarda globalmente pra ser usado no playSfx
    window._sfxVolumeMultiplier = Math.max(0, Math.min(100, pct)) / 100;
    console.log(`[settings] Efeitos: ${pct}%`);
}

// =================================================================
// 2. HOOK NO playSfx — respeita o volume configurado
// =================================================================
(function hookSfxVolume() {
    const _origPlaySfx = window.playSfx;
    if (typeof _origPlaySfx !== 'function') return;

    window.playSfx = function(name) {
        if (!audioUnlocked || !sfx[name]) return;
        const sound = sfx[name].cloneNode();
        const baseVol = 0.6;
        const mult = (typeof window._sfxVolumeMultiplier === 'number')
            ? window._sfxVolumeMultiplier
            : 1;
        sound.volume = baseVol * mult;
        sound.play().catch(() => {});
    };

    console.log('✅ playSfx agora respeita o volume configurado.');
})();

// =================================================================
// 3. AUTO-SAVE VISUAL
// =================================================================
(function installAutoSaveFeedback() {
    const _origSave = window.saveStoryProgress;
    if (typeof _origSave !== 'function') return;

    let saveIndicatorTimeout = null;

    window.saveStoryProgress = function() {
        try {
            _origSave.apply(this, arguments);

            // Só mostra o feedback se a opção estiver ligada
            if (!STORY_SETTINGS.autoSaveNotify) return;

            // Cria/atualiza o indicador
            let indicator = document.getElementById('storySaveIndicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'storySaveIndicator';
                indicator.className = 'story-save-indicator';
                indicator.innerHTML = '💾 Salvo!';
                document.body.appendChild(indicator);
            }

            // Reinicia a animação
            indicator.classList.remove('show');
            void indicator.offsetWidth; // força reflow
            indicator.classList.add('show');

            // Esconde depois de 2s
            clearTimeout(saveIndicatorTimeout);
            saveIndicatorTimeout = setTimeout(() => {
                indicator.classList.remove('show');
            }, 2000);

        } catch(e) {
            console.warn('[autosave] Erro:', e);
        }
    };

    console.log('✅ Auto-save visual instalado.');
})();

// =================================================================
// 4. TELA DE CONFIGURAÇÕES DO MODO HISTÓRIA
// =================================================================
function renderStorySettingsScreen() {
    const screen = document.getElementById('storyScreen');
    if (!screen) return;

    // Garante que as configs estão carregadas
    loadStorySettings();

    screen.innerHTML = `
        <div class="story-container">
            <div class="story-header">
                <h1 class="story-title">⚙️ CONFIGURAÇÕES</h1>
                <p class="story-subtitle">Ajuste a experiência do Modo História</p>
            </div>

            <div class="story-settings-panel">

                <!-- ATMOSFERA -->
                <div class="story-settings-section">
                    <div class="story-settings-section-title">🎨 ATMOSFERA DO TABULEIRO</div>
                    <div class="story-settings-row">
                        <label class="story-settings-label">Intensidade</label>
                        <div class="story-settings-slider-wrap">
                            <input type="range" id="setAtmIntensity" class="story-settings-slider"
                                   min="0" max="150" step="5"
                                   value="${STORY_SETTINGS.atmosphereIntensity}">
                            <span id="setAtmIntensityVal" class="story-settings-value">${STORY_SETTINGS.atmosphereIntensity}%</span>
                        </div>
                    </div>
                    <div class="story-settings-hint">
                        Controla o tint, a vinheta e as partículas temáticas de cada ato.
                        Reduza se o tabuleiro ficar difícil de ver em telas pequenas.
                    </div>
                </div>

                <!-- ÁUDIO -->
                <div class="story-settings-section">
                    <div class="story-settings-section-title">🔊 ÁUDIO</div>

                    <div class="story-settings-row">
                        <label class="story-settings-label">Música</label>
                        <div class="story-settings-slider-wrap">
                            <input type="range" id="setMusicVol" class="story-settings-slider"
                                   min="0" max="100" step="5"
                                   value="${STORY_SETTINGS.musicVolume}">
                            <span id="setMusicVolVal" class="story-settings-value">${STORY_SETTINGS.musicVolume}%</span>
                        </div>
                    </div>

                    <div class="story-settings-row">
                        <label class="story-settings-label">Efeitos</label>
                        <div class="story-settings-slider-wrap">
                            <input type="range" id="setSfxVol" class="story-settings-slider"
                                   min="0" max="100" step="5"
                                   value="${STORY_SETTINGS.sfxVolume}">
                            <span id="setSfxVolVal" class="story-settings-value">${STORY_SETTINGS.sfxVolume}%</span>
                        </div>
                    </div>
                </div>

                <!-- FEEDBACK -->
                <div class="story-settings-section">
                    <div class="story-settings-section-title">💬 FEEDBACK</div>
                    <div class="story-settings-row">
                        <label class="story-settings-label">Notificação de Auto-Save</label>
                        <label class="story-settings-toggle">
                            <input type="checkbox" id="setAutoSave" ${STORY_SETTINGS.autoSaveNotify ? 'checked' : ''}>
                            <span class="story-settings-toggle-slider"></span>
                        </label>
                    </div>
                    <div class="story-settings-hint">
                        Mostra um aviso "💾 Salvo!" toda vez que o jogo salvar o progresso.
                    </div>
                </div>

                <!-- BOTÕES -->
                <div class="story-settings-actions">
                    <button class="story-settings-btn primary" onclick="resetStorySettings()">
                        ↺ RESTAURAR PADRÃO
                    </button>
                    <button class="story-settings-btn" onclick="renderAldeiaScreen()">
                        ← VOLTAR À ALDEIA
                    </button>
                </div>
            </div>
        </div>
    `;

    // ---- Handlers dos sliders (tempo real) ----
    const atmSlider = document.getElementById('setAtmIntensity');
    const atmVal = document.getElementById('setAtmIntensityVal');
    if (atmSlider) {
        atmSlider.addEventListener('input', function() {
            const v = parseInt(this.value);
            atmVal.textContent = v + '%';
            STORY_SETTINGS.atmosphereIntensity = v;
            applyAtmosphereIntensity(v);
            saveStorySettings();
        });
    }

    const musSlider = document.getElementById('setMusicVol');
    const musVal = document.getElementById('setMusicVolVal');
    if (musSlider) {
        musSlider.addEventListener('input', function() {
            const v = parseInt(this.value);
            musVal.textContent = v + '%';
            STORY_SETTINGS.musicVolume = v;
            applyMusicVolume(v);
            saveStorySettings();
        });
    }

    const sfxSlider = document.getElementById('setSfxVol');
    const sfxVal = document.getElementById('setSfxVolVal');
    if (sfxSlider) {
        sfxSlider.addEventListener('input', function() {
            const v = parseInt(this.value);
            sfxVal.textContent = v + '%';
            STORY_SETTINGS.sfxVolume = v;
            applySfxVolume(v);
            saveStorySettings();

            // Toca um som de teste pra feedback
            if (typeof playSfx === 'function') {
                clearTimeout(window._sfxTestTimer);
                window._sfxTestTimer = setTimeout(() => playSfx('click'), 100);
            }
        });
    }

    const autosaveToggle = document.getElementById('setAutoSave');
    if (autosaveToggle) {
        autosaveToggle.addEventListener('change', function() {
            STORY_SETTINGS.autoSaveNotify = this.checked;
            saveStorySettings();
        });
    }
}

function resetStorySettings() {
    STORY_SETTINGS = { ...STORY_DEFAULT_SETTINGS };
    saveStorySettings();
    applyStorySettings();
    renderStorySettingsScreen();
    showToast('⚙️', 'Configurações restauradas.', '⚙️');
}

// =================================================================
// 5. BOTÃO NA ALDEIA
// -----------------------------------------------------------------
// Sobrescreve renderAldeiaScreen pra adicionar o botão de config.
// =================================================================
(function addSettingsButtonToAldeia() {
    const _origRender = window.renderAldeiaScreen;
    if (typeof _origRender !== 'function') {
        console.warn('[settings] renderAldeiaScreen não encontrada.');
        return;
    }

    window.renderAldeiaScreen = function() {
        _origRender.apply(this, arguments);

        // Procura o footer da Aldeia e injeta o botão
        const footer = document.querySelector('.story-ald-footer');
        if (!footer) return;

        // Evita duplicar
        if (footer.querySelector('.story-settings-btn-ald')) return;

        const btn = document.createElement('button');
        btn.className = 'story-back-btn story-settings-btn-ald';
        btn.style.marginLeft = '10px';
        btn.innerHTML = '⚙️ CONFIGURAÇÕES';
        btn.onclick = () => {
            if (typeof renderStorySettingsScreen === 'function') {
                renderStorySettingsScreen();
            }
        };
        footer.appendChild(btn);
    };

    console.log('✅ Botão de Configurações adicionado à Aldeia.');
})();

// =================================================================
// 6. CSS
// =================================================================
(function injectSettingsCSS() {
    if (document.getElementById('storySettingsStyle')) return;
    const style = document.createElement('style');
    style.id = 'storySettingsStyle';
    style.textContent = `
        /* ---- Painel de Configurações ---- */
        .story-settings-panel {
            max-width: 640px;
            margin: 0 auto 30px;
            display: flex;
            flex-direction: column;
            gap: 18px;
        }

        .story-settings-section {
            background:
                linear-gradient(180deg, rgba(201, 162, 39, 0.04), transparent 40%),
                linear-gradient(180deg, rgba(42, 31, 16, 0.9), rgba(26, 18, 8, 0.9));
            border: 2px solid #3d2d18;
            border-radius: 8px;
            padding: 18px 20px;
        }

        .story-settings-section-title {
            font-family: 'Cinzel', serif;
            color: #e8b923;
            font-size: 0.85rem;
            letter-spacing: 2px;
            margin-bottom: 14px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(201, 162, 39, 0.2);
            text-transform: uppercase;
        }

        .story-settings-row {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 12px;
            flex-wrap: wrap;
        }

        .story-settings-row:last-child { margin-bottom: 0; }

        .story-settings-label {
            font-family: 'EB Garamond', serif;
            color: #d9c89a;
            font-size: 1rem;
            min-width: 130px;
            flex-shrink: 0;
        }

        .story-settings-slider-wrap {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 200px;
        }

        .story-settings-slider {
            flex: 1;
            -webkit-appearance: none;
            height: 8px;
            background: #1a1208;
            border-radius: 4px;
            outline: none;
            border: 1px solid #6a5024;
            cursor: pointer;
        }

        .story-settings-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle at 30% 30%, #e8b923, #8a7018);
            border: 2px solid #1a1208;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 8px rgba(232, 185, 35, 0.5);
        }

        .story-settings-slider::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: radial-gradient(circle at 30% 30%, #e8b923, #8a7018);
            border: 2px solid #1a1208;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 8px rgba(232, 185, 35, 0.5);
        }

        .story-settings-value {
            font-family: 'Cinzel', serif;
            color: #e8b923;
            font-weight: 700;
            font-size: 0.95rem;
            min-width: 55px;
            text-align: right;
            letter-spacing: 1px;
        }

        .story-settings-hint {
            font-family: 'EB Garamond', serif;
            color: #8a7a52;
            font-size: 0.85rem;
            font-style: italic;
            line-height: 1.4;
            padding: 8px 12px;
            background: rgba(10, 6, 2, 0.4);
            border-left: 3px solid #6a5024;
            border-radius: 4px;
            margin-top: 4px;
        }

        /* ---- Toggle ---- */
        .story-settings-toggle {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 26px;
            cursor: pointer;
        }

        .story-settings-toggle input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .story-settings-toggle-slider {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: #3a2a18;
            border: 1px solid #6a5024;
            border-radius: 34px;
            transition: 0.3s;
        }

        .story-settings-toggle-slider:before {
            content: "";
            position: absolute;
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background: radial-gradient(circle at 30% 30%, #d9c89a, #8a7a52);
            border-radius: 50%;
            transition: 0.3s;
        }

        .story-settings-toggle input:checked + .story-settings-toggle-slider {
            background: #3a5a2c;
            border-color: #6ba35c;
        }

        .story-settings-toggle input:checked + .story-settings-toggle-slider:before {
            transform: translateX(24px);
            background: radial-gradient(circle at 30% 30%, #c8e0a8, #4a7040);
        }

        /* ---- Botões ---- */
        .story-settings-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 20px;
        }

        .story-settings-btn {
            padding: 12px 24px;
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

        .story-settings-btn:hover {
            background: linear-gradient(135deg, #5a4220, #3d2d18);
            color: #e8dcc4;
            border-color: #c9a227;
        }

        .story-settings-btn.primary {
            background:
                linear-gradient(180deg, rgba(232, 185, 35, 0.2), transparent 45%),
                linear-gradient(135deg, #8a6a2e, #4a3418);
            color: #fff5dc;
            border-color: #e8b923;
        }

        /* ---- Auto-save indicator ---- */
        .story-save-indicator {
            position: fixed;
            bottom: 24px;
            right: 24px;
            padding: 10px 18px;
            background:
                linear-gradient(180deg, rgba(107, 163, 92, 0.25), transparent 60%),
                linear-gradient(135deg, #2a4520, #1a2f14);
            color: #e0f0d0;
            border: 2px solid #6ba35c;
            border-radius: 24px;
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 0.85rem;
            letter-spacing: 1.5px;
            box-shadow:
                0 4px 15px rgba(0, 0, 0, 0.6),
                0 0 20px rgba(107, 163, 92, 0.3);
            z-index: 9500;
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.3s, transform 0.3s;
            pointer-events: none;
        }

        .story-save-indicator.show {
            opacity: 1;
            transform: translateY(0);
        }

        @media (max-width: 600px) {
            .story-settings-row {
                flex-direction: column;
                align-items: flex-start;
            }
            .story-settings-label {
                min-width: 0;
            }
            .story-settings-slider-wrap {
                width: 100%;
            }
            .story-save-indicator {
                bottom: 12px;
                right: 12px;
                padding: 8px 14px;
                font-size: 0.75rem;
            }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS das Configurações injetado.');
})();

// =================================================================
// 7. INICIALIZAÇÃO
// =================================================================
loadStorySettings();
applyStorySettings();

console.log('✅ BLOCO CORRETIVO 7 (V9.1 — Configurações) carregado.');
// =================================================================
// historia.js — BLOCO 8 (V9.1 — Dificuldade Progressiva)
// -----------------------------------------------------------------
// Cole NO FINAL de historia.js, depois do Bloco 7.
//
// Contém:
//   1. Definição dos modos de dificuldade
//   2. Desbloqueio progressivo (Normal → Difícil → Pesadelo)
//   3. Aplicação dos multiplicadores em batalha
//   4. Recompensas escaladas
//   5. Seletor de dificuldade na tela de fases
//   6. Selo de dificuldade nas fases concluídas
// =================================================================

// =================================================================
// 1. DEFINIÇÃO DAS DIFICULDADES
// =================================================================
const STORY_DIFFICULTIES = {
    'normal': {
        id: 'normal',
        nome: 'Normal',
        desc: 'A jornada original.',
        icon: '⚔️',
        hpMult: 1.0,
        atkMult: 1.0,
        rewardMult: 1.0,
        starsBonus: 0,
        color: '#c9a227',
        unlockedBy: null,
    },
    'dificil': {
        id: 'dificil',
        nome: 'Difícil',
        desc: 'Inimigos mais resistentes.',
        icon: '🔥',
        hpMult: 1.5,
        atkMult: 1.3,
        rewardMult: 1.5,
        starsBonus: 1,
        color: '#e67e22',
        unlockedBy: 'zerar',  // requer ter zerado o jogo no modo anterior
    },
    'pesadelo': {
        id: 'pesadelo',
        nome: 'Pesadelo',
        desc: 'O abismo em sua forma mais pura.',
        icon: '💀',
        hpMult: 2.2,
        atkMult: 1.6,
        rewardMult: 2.5,
        starsBonus: 2,
        color: '#a83232',
        unlockedBy: 'dificil',  // requer ter zerado no Difícil
    },
};

// Dificuldade atual (carregada do save)
let storyCurrentDifficulty = 'normal';

// =================================================================
// 2. CARREGAR / SALVAR DIFICULDADE NO SAVE
// =================================================================
(function initDifficultyFromSave() {
    if (!STORY_PROGRESS) return;
    if (!STORY_PROGRESS.difficulty) {
        STORY_PROGRESS.difficulty = 'normal';
    }
    if (!STORY_PROGRESS.difficultyProgress) {
        // Estrutura: { normal: { completed: [], stars: {} }, dificil: {...}, pesadelo: {...} }
        STORY_PROGRESS.difficultyProgress = {
            normal: { completed: [], stars: {} },
            dificil: { completed: [], stars: {} },
            pesadelo: { completed: [], stars: {} },
        };
    }
    if (!STORY_PROGRESS.clearedDifficulties) {
        // Lista de dificuldades já zeradas
        STORY_PROGRESS.clearedDifficulties = [];
    }

    storyCurrentDifficulty = STORY_PROGRESS.difficulty || 'normal';
    console.log('[dificuldade] Carregada:', storyCurrentDifficulty);
})();

function saveDifficultyToProgress() {
    if (!STORY_PROGRESS) return;
    STORY_PROGRESS.difficulty = storyCurrentDifficulty;
    saveStoryProgress();
}

// =================================================================
// 3. VERIFICAR SE UMA DIFICULDADE ESTÁ DESBLOQUEADA
// =================================================================
function isDifficultyUnlocked(diffId) {
    if (diffId === 'normal') return true;

    const diff = STORY_DIFFICULTIES[diffId];
    if (!diff) return false;

    const required = diff.unlockedBy;
    if (!required) return true;

    // 'zerar' → requer ter completado o Ato 13 em QUALQUER dificuldade
    if (required === 'zerar') {
        return (STORY_PROGRESS.clearedDifficulties || []).length > 0;
    }

    // 'dificil' → requer ter zerado no Difícil
    if (required === 'dificil') {
        return (STORY_PROGRESS.clearedDifficulties || []).includes('dificil');
    }

    return false;
}

// =================================================================
// 4. APLICAR MULTIPLICADORES EM BATALHA
// -----------------------------------------------------------------
// Hook no initStoryBattle pra escalar HP/ATK do inimigo atual.
// =================================================================
(function hookDifficultyInBattle() {
    const _origInit = window.initStoryBattle;
    if (typeof _origInit !== 'function') {
        console.warn('[dificuldade] initStoryBattle não encontrada.');
        return;
    }

    window.initStoryBattle = async function() {
        await _origInit.apply(this, arguments);

        // Aplica multiplicadores no inimigo atual
        applyDifficultyToCurrentEnemy();

        // Aplica no header/boss card
        if (typeof updateBossCard === 'function') updateBossCard();
        if (typeof updateHeaderBossName === 'function') updateHeaderBossName();

        // Log de aviso
        const diff = STORY_DIFFICULTIES[storyCurrentDifficulty];
        if (diff && storyCurrentDifficulty !== 'normal') {
            addLog(`${diff.icon} DIFICULDADE: ${diff.nome.toUpperCase()}`);
            addLog(`HP do inimigo ×${diff.hpMult} · ATK ×${diff.atkMult}`);
        }
    };

    console.log('✅ Hook de dificuldade em batalha instalado.');
})();

function applyDifficultyToCurrentEnemy() {
    if (!window._storyMode) return;
    if (!storyEnemiesRemaining || storyEnemiesRemaining.length === 0) return;

    const diff = STORY_DIFFICULTIES[storyCurrentDifficulty];
    if (!diff || storyCurrentDifficulty === 'normal') return;

    // Multiplica o HP atual (que foi setado pelo initStoryBattle)
    if (boss && boss.maxHp) {
        const origMaxHp = boss.maxHp;
        const newMaxHp = Math.ceil(origMaxHp * diff.hpMult);
        boss.maxHp = newMaxHp;
        boss.hp = newMaxHp;
    }

    // Multiplica o ATK (aplicado quando o inimigo atacar)
    // O ATK vem do input atk_BOSS_cfg, multiplicado pelo diff
    const atkInput = document.getElementById('atk_BOSS_cfg');
    if (atkInput) {
        const origAtk = parseInt(atkInput.value) || 4;
        // Guarda o original pra não multiplicar de novo
        if (!atkInput.dataset.originalAtk) {
            atkInput.dataset.originalAtk = origAtk;
        }
        const baseAtk = parseInt(atkInput.dataset.originalAtk);
        atkInput.value = Math.ceil(baseAtk * diff.atkMult);
    }
}

// Quando avança pro próximo inimigo, reaplica
(function hookAdvanceForDifficulty() {
    const _origAdvance = window.advanceStoryEnemy;
    if (typeof _origAdvance !== 'function') return;

    window.advanceStoryEnemy = async function() {
        const result = await _origAdvance.apply(this, arguments);

        // Reaplica multiplicadores no novo inimigo
        if (window._storyMode && storyEnemiesRemaining.length > 0) {
            applyDifficultyToCurrentEnemy();
            if (typeof updateBossCard === 'function') updateBossCard();
        }

        return result;
    };

    console.log('✅ Hook de avanço de inimigo com dificuldade instalado.');
})();

// =================================================================
// 5. RECOMPENSAS ESCALADAS POR DIFICULDADE
// =================================================================
(function hookRewardsForDifficulty() {
    const _origVictory = window.handleStoryPhaseVictory;
    if (typeof _origVictory !== 'function') {
        console.warn('[dificuldade] handleStoryPhaseVictory não encontrada.');
        return;
    }

    window.handleStoryPhaseVictory = function(phase, drops, finalScore, rankSnapshot) {
        // Multiplica XP e ouro da fase pela dificuldade
        const diff = STORY_DIFFICULTIES[storyCurrentDifficulty];
        if (diff && storyCurrentDifficulty !== 'normal' && phase && phase.reward) {
            phase.reward.xp = Math.ceil(phase.reward.xp * diff.rewardMult);
            phase.reward.gold = Math.ceil(phase.reward.gold * diff.rewardMult);
        }

        // Guarda dificuldade no rankSnapshot
        if (rankSnapshot) {
            rankSnapshot.difficulty = storyCurrentDifficulty;
        }

        return _origVictory.apply(this, arguments);
    };

    console.log('✅ Hook de recompensas por dificuldade instalado.');
})();

// =================================================================
// 6. REGISTRAR ZERAR DO JOGO
// -----------------------------------------------------------------
// Hook no showStoryVictoryScreen pra detectar quando o Ato 13 termina.
// =================================================================
(function hookVictoryForClear() {
    const _origShowVictory = window.showStoryVictoryScreen;
    if (typeof _origShowVictory !== 'function') return;

    window.showStoryVictoryScreen = function(phase, drops, rewards, meta) {
        // Detecta final boss
        if (phase && phase.isFinalBoss) {
            // Marca a dificuldade como zerada
            if (!Array.isArray(STORY_PROGRESS.clearedDifficulties)) {
                STORY_PROGRESS.clearedDifficulties = [];
            }
            if (!STORY_PROGRESS.clearedDifficulties.includes(storyCurrentDifficulty)) {
                STORY_PROGRESS.clearedDifficulties.push(storyCurrentDifficulty);

                // Toast de novo desbloqueio
                const nextDiff = getNextDifficultyAfter(storyCurrentDifficulty);
                if (nextDiff) {
                    setTimeout(() => {
                        showToast(
                            `${nextDiff.icon} NOVA DIFICULDADE!`,
                            `${nextDiff.nome} desbloqueada!`,
                            nextDiff.icon
                        );
                    }, 2000);
                }

                saveStoryProgress();
            }
        }

        return _origShowVictory.apply(this, arguments);
    };

    console.log('✅ Hook de vitória final instalado.');
})();

function getNextDifficultyAfter(current) {
    const order = ['normal', 'dificil', 'pesadelo'];
    const idx = order.indexOf(current);
    if (idx === -1 || idx >= order.length - 1) return null;

    const nextId = order[idx + 1];
    const next = STORY_DIFFICULTIES[nextId];
    if (next && isDifficultyUnlocked(nextId)) return next;
    return null;
}

// =================================================================
// 7. SALVAR ESTRELAS POR DIFICULDADE
// -----------------------------------------------------------------
// Sobrescreve saveStarsForPhase pra guardar separadamente por dificuldade.
// =================================================================
(function hookStarsForDifficulty() {
    const _origSaveStars = window.saveStarsForPhase;
    if (typeof _origSaveStars !== 'function') return;

    window.saveStarsForPhase = function(phaseId, stars) {
        const diff = STORY_DIFFICULTIES[storyCurrentDifficulty];

        // Aplica bônus de estrelas por dificuldade
        let effectiveStars = stars;
        if (diff && diff.starsBonus > 0) {
            effectiveStars = Math.min(3, stars + diff.starsBonus);
        }

        // Salva no progresso geral (comportamento original)
        const result = _origSaveStars.apply(this, arguments);

        // Salva também na estrutura por dificuldade
        if (!STORY_PROGRESS.difficultyProgress) {
            STORY_PROGRESS.difficultyProgress = {};
        }
        if (!STORY_PROGRESS.difficultyProgress[storyCurrentDifficulty]) {
            STORY_PROGRESS.difficultyProgress[storyCurrentDifficulty] = {
                completed: [],
                stars: {},
            };
        }

        const diffProg = STORY_PROGRESS.difficultyProgress[storyCurrentDifficulty];
        const current = diffProg.stars[phaseId] || 0;
        diffProg.stars[phaseId] = Math.max(current, effectiveStars);
        saveStoryProgress();

        return result;
    };

    console.log('✅ Hook de estrelas por dificuldade instalado.');
})();

// =================================================================
// 8. UI — SELETOR DE DIFICULDADE NA TELA DE FASES
// -----------------------------------------------------------------
// Sobrescreve renderChapterPhases pra adicionar o seletor no topo.
// =================================================================
(function addDifficultySelectorToChapter() {
    const _origRender = window.renderChapterPhases;
    if (typeof _origRender !== 'function') {
        console.warn('[dificuldade] renderChapterPhases não encontrada.');
        return;
    }

    window.renderChapterPhases = function(ch) {
        _origRender.apply(this, arguments);

        // Procura o header da tela
        const header = document.querySelector('.story-header');
        if (!header) return;

        // Evita duplicar
        if (header.querySelector('.story-difficulty-selector')) return;

        // Monta o seletor
        const selector = document.createElement('div');
        selector.className = 'story-difficulty-selector';

        const diffs = Object.values(STORY_DIFFICULTIES);
        const buttonsHTML = diffs.map(d => {
            const unlocked = isDifficultyUnlocked(d.id);
            const active = d.id === storyCurrentDifficulty;
            return `
                <button class="story-difficulty-btn ${active ? 'active' : ''} ${unlocked ? '' : 'locked'}"
                        data-diff="${d.id}"
                        ${unlocked ? '' : 'disabled'}
                        style="--diff-color: ${d.color};">
                    <span class="story-difficulty-icon">${d.icon}</span>
                    <span class="story-difficulty-nome">${d.nome}</span>
                    ${unlocked ? '' : '<span class="story-difficulty-lock">🔒</span>'}
                </button>
            `;
        }).join('');

        selector.innerHTML = `
            <div class="story-difficulty-label">DIFICULDADE</div>
            <div class="story-difficulty-buttons">${buttonsHTML}</div>
        `;

        // Insere depois do subtitle
        header.appendChild(selector);

        // Handler dos botões
        selector.querySelectorAll('.story-difficulty-btn:not(.locked)').forEach(btn => {
            btn.addEventListener('click', function() {
                const diffId = this.dataset.diff;
                if (diffId === storyCurrentDifficulty) return;

                storyCurrentDifficulty = diffId;
                saveDifficultyToProgress();

                // Re-renderiza
                renderChapterPhases(ch);

                const d = STORY_DIFFICULTIES[diffId];
                showToast(`${d.icon}`, `Dificuldade: ${d.nome}`, d.icon);
            });
        });
    };

    console.log('✅ Seletor de dificuldade adicionado à tela de fases.');
})();

// =================================================================
// 9. UI — BADGE DE DIFICULDADE NAS FASES
// -----------------------------------------------------------------
// Sobrescreve renderChapterPhases pra adicionar badges nas fases.
// Como o item 8 já sobrescreveu, fazemos um segundo patch em cima.
// =================================================================
(function addDifficultyBadgesToPhases() {
    const _origRender = window.renderChapterPhases;
    if (typeof _origRender !== 'function') return;

    window.renderChapterPhases = function(ch) {
        _origRender.apply(this, arguments);

        // Se estamos no modo Normal, não mostra badges
        if (storyCurrentDifficulty === 'normal') return;

        const diff = STORY_DIFFICULTIES[storyCurrentDifficulty];
        if (!diff) return;

        // Adiciona um badge global indicando a dificuldade ativa
        const header = document.querySelector('.story-header');
        if (header && !header.querySelector('.story-difficulty-active-badge')) {
            const badge = document.createElement('div');
            badge.className = 'story-difficulty-active-badge';
            badge.style.setProperty('--diff-color', diff.color);
            badge.innerHTML = `
                ${diff.icon} JOGANDO EM ${diff.nome.toUpperCase()}
                <span class="story-difficulty-active-hint">
                    (HP ×${diff.hpMult} · ATK ×${diff.atkMult} · Recompensa ×${diff.rewardMult})
                </span>
            `;
            // Insere antes do seletor
            const selector = header.querySelector('.story-difficulty-selector');
            if (selector) {
                selector.parentNode.insertBefore(badge, selector);
            } else {
                header.appendChild(badge);
            }
        }
    };
})();

// =================================================================
// 10. PATCH EM startStoryPhase — usa a dificuldade atual
// =================================================================
(function hookStartPhaseForDifficulty() {
    const _origStart = window.startStoryPhase;
    if (typeof _origStart !== 'function') return;

    window.startStoryPhase = function(cid, pid) {
        // Garante que a dificuldade está salva
        saveDifficultyToProgress();

        return _origStart.apply(this, arguments);
    };

    console.log('✅ startStoryPhase agora respeita a dificuldade.');
})();

// =================================================================
// 11. UI — MOSTRAR DIFICULDADE NA ALDEIA
// -----------------------------------------------------------------
// Pequeno badge na Aldeia mostrando a dificuldade atual.
// =================================================================
(function showDifficultyInAldeia() {
    const _origRender = window.renderAldeiaScreen;
    if (typeof _origRender !== 'function') return;

    window.renderAldeiaScreen = function() {
        _origRender.apply(this, arguments);

        const saveInfo = document.querySelector('.story-ald-save-info');
        if (!saveInfo) return;
        if (saveInfo.querySelector('.story-ald-difficulty-badge')) return;

        const diff = STORY_DIFFICULTIES[storyCurrentDifficulty];
        if (!diff) return;

        // Só mostra se for diferente de Normal
        if (storyCurrentDifficulty === 'normal') return;

        const badge = document.createElement('div');
        badge.className = 'story-ald-difficulty-badge';
        badge.style.setProperty('--diff-color', diff.color);
        badge.innerHTML = `${diff.icon} ${diff.nome.toUpperCase()}`;
        saveInfo.appendChild(badge);
    };
})();

// =================================================================
// 12. CSS
// =================================================================
(function injectDifficultyCSS() {
    if (document.getElementById('storyDifficultyStyle')) return;
    const style = document.createElement('style');
    style.id = 'storyDifficultyStyle';
    style.textContent = `
        /* ---- Seletor de dificuldade ---- */
        .story-difficulty-selector {
            margin-top: 18px;
            padding: 12px 16px;
            background: rgba(10, 6, 2, 0.5);
            border: 1px solid rgba(201, 162, 39, 0.25);
            border-radius: 6px;
        }

        .story-difficulty-label {
            font-family: 'Cinzel', serif;
            font-size: 0.75rem;
            color: #8a7a52;
            letter-spacing: 2px;
            text-align: center;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        .story-difficulty-buttons {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
        }

        .story-difficulty-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 18px;
            background: linear-gradient(135deg, #2a1f10, #1a1208);
            color: #c8b787;
            border: 2px solid rgba(201, 162, 39, 0.3);
            border-radius: 6px;
            cursor: pointer;
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 0.85rem;
            letter-spacing: 1px;
            transition: all 0.2s;
            position: relative;
        }

        .story-difficulty-btn:hover:not(.locked) {
            border-color: var(--diff-color, #c9a227);
            color: #e8dcc4;
            transform: translateY(-2px);
        }

        .story-difficulty-btn.active {
            background:
                linear-gradient(180deg, rgba(232, 185, 35, 0.15), transparent 50%),
                linear-gradient(135deg, #3d2d18, #2a1f10);
            border-color: var(--diff-color, #c9a227);
            border-width: 3px;
            color: #fff5dc;
            box-shadow: 0 0 18px color-mix(in srgb, var(--diff-color, #c9a227) 50%, transparent);
        }

        .story-difficulty-btn.locked {
            opacity: 0.45;
            cursor: not-allowed;
            filter: grayscale(0.7);
        }

        .story-difficulty-icon {
            font-size: 1.2rem;
            line-height: 1;
        }

        .story-difficulty-lock {
            font-size: 0.9rem;
            opacity: 0.7;
            margin-left: 4px;
        }

        /* ---- Badge ativo ---- */
        .story-difficulty-active-badge {
            margin-top: 14px;
            padding: 10px 16px;
            background:
                linear-gradient(180deg, color-mix(in srgb, var(--diff-color, #c9a227) 15%, transparent), transparent 60%),
                rgba(10, 6, 2, 0.6);
            border: 2px solid var(--diff-color, #c9a227);
            border-radius: 6px;
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 0.85rem;
            color: var(--diff-color, #c9a227);
            text-align: center;
            letter-spacing: 1.5px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            align-items: center;
        }

        .story-difficulty-active-hint {
            font-family: 'EB Garamond', serif;
            font-size: 0.75rem;
            font-weight: 400;
            color: #b8a577;
            font-style: italic;
            letter-spacing: 0.5px;
        }

        /* ---- Badge na Aldeia ---- */
        .story-ald-difficulty-badge {
            padding: 6px 14px;
            background:
                linear-gradient(180deg, color-mix(in srgb, var(--diff-color, #c9a227) 20%, transparent), transparent 60%),
                rgba(10, 6, 2, 0.6);
            border: 2px solid var(--diff-color, #c9a227);
            border-radius: 20px;
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 0.8rem;
            color: var(--diff-color, #c9a227);
            letter-spacing: 1.5px;
            white-space: nowrap;
        }

        @media (max-width: 600px) {
            .story-difficulty-btn {
                padding: 8px 12px;
                font-size: 0.75rem;
            }
            .story-difficulty-icon {
                font-size: 1rem;
            }
            .story-difficulty-active-badge {
                font-size: 0.75rem;
            }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS de dificuldade injetado.');
})();

// =================================================================
// 13. EXPOR NO WINDOW
// =================================================================
window.STORY_DIFFICULTIES = STORY_DIFFICULTIES;
window.isDifficultyUnlocked = isDifficultyUnlocked;
window.getCurrentStoryDifficulty = () => storyCurrentDifficulty;
window.setStoryDifficulty = (id) => {
    if (STORY_DIFFICULTIES[id] && isDifficultyUnlocked(id)) {
        storyCurrentDifficulty = id;
        saveDifficultyToProgress();
        return true;
    }
    return false;
};

console.log('✅ BLOCO CORRETIVO 8 (V9.1 — Dificuldade Progressiva) carregado.');
console.log('💡 Dificuldades:', Object.keys(STORY_DIFFICULTIES).join(', '));
console.log('💡 Atual:', storyCurrentDifficulty);
console.log('💡 Zeradas:', STORY_PROGRESS.clearedDifficulties || []);
// =================================================================
// historia.js — BLOCO CORRETIVO 9 (V9.2 — Dificuldades Independentes)
// -----------------------------------------------------------------
// Cole NO FINAL de historia.js, depois do Bloco 8.
//
// PROBLEMA:
//   • unlockedChapters/unlockedPhases/unlockedPhases eram GLOBAIS.
//   • Ao zerar no Normal e destravar o Difícil, todas as fases
//     já apareciam liberadas porque o progresso era compartilhado.
//
// SOLUÇÃO:
//   • Cada dificuldade tem SEU PRÓPRIO progresso de fases.
//   • O save ganha a estrutura:
//       difficultyProgress[diffId] = {
//         unlockedChapters: [1, 2, ...],
//         unlockedPhases: { 1: ['1-1'], 2: ['2-1'], ... },
//         completedPhases: ['1-1', '1-2', ...],
//         stars: { '1-1': 3, ... }
//       }
//   • saveStarsForPhase, completePhase, unlockPhase, isPhaseUnlocked,
//     isPhaseCompleted e getStarsForPhase passam a operar na
//     dificuldade ATUAL, com migração automática do save antigo.
// =================================================================

(function fixDifficultyIndependentProgress() {
    if (window._storyDiffIndepV92) return;
    window._storyDiffIndepV92 = true;

    // ==============================================================
    // 0. GARANTIR ESTRUTURA NO SAVE
    // ==============================================================
    function garantirEstrutura() {
        if (!STORY_PROGRESS) return;

        if (!STORY_PROGRESS.difficultyProgress || typeof STORY_PROGRESS.difficultyProgress !== 'object') {
            STORY_PROGRESS.difficultyProgress = {};
        }

        const DIFFS = ['normal', 'dificil', 'pesadelo'];
        DIFFS.forEach(diffId => {
            if (!STORY_PROGRESS.difficultyProgress[diffId]) {
                STORY_PROGRESS.difficultyProgress[diffId] = {
                    unlockedChapters: [],
                    unlockedPhases: {},
                    completedPhases: [],
                    stars: {},
                };
            }
            const d = STORY_PROGRESS.difficultyProgress[diffId];
            if (!Array.isArray(d.unlockedChapters)) d.unlockedChapters = [];
            if (!d.unlockedPhases || typeof d.unlockedPhases !== 'object') d.unlockedPhases = {};
            if (!Array.isArray(d.completedPhases)) d.completedPhases = [];
            if (!d.stars || typeof d.stars !== 'object') d.stars = {};
        });

        // ---- MIGRAÇÃO: save antigo (global) → normal ----
        // Se o save antigo tem progresso global e a estrutura nova está vazia,
        // move o progresso antigo para a dificuldade 'normal'.
        const legadoNormal = STORY_PROGRESS.difficultyProgress.normal;
        const temProgressoGlobal =
            (Array.isArray(STORY_PROGRESS.unlockedChapters) && STORY_PROGRESS.unlockedChapters.length > 0) ||
            (STORY_PROGRESS.unlockedPhases && Object.keys(STORY_PROGRESS.unlockedPhases).length > 0) ||
            (Array.isArray(STORY_PROGRESS.completedPhases) && STORY_PROGRESS.completedPhases.length > 0);

        const normalVazio =
            legadoNormal.unlockedChapters.length === 0 &&
            Object.keys(legadoNormal.unlockedPhases).length === 0 &&
            legadoNormal.completedPhases.length === 0;

        if (temProgressoGlobal && normalVazio && window._storyDiffMigrado !== true) {
            window._storyDiffMigrado = true;

            legadoNormal.unlockedChapters = [...(STORY_PROGRESS.unlockedChapters || [1])];
            legadoNormal.unlockedPhases = JSON.parse(JSON.stringify(STORY_PROGRESS.unlockedPhases || { 1: ['1-1'] }));
            legadoNormal.completedPhases = [...(STORY_PROGRESS.completedPhases || [])];
            legadoNormal.stars = JSON.parse(JSON.stringify(STORY_PROGRESS.starsByPhase || {}));

            console.log('[V9.2] Migração: progresso global movido para "normal".');
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
        }
    }

    // Garante que a dificuldade atual existe e é válida
    function getDiffId() {
        let id = (typeof storyCurrentDifficulty !== 'undefined' && storyCurrentDifficulty)
            ? storyCurrentDifficulty
            : (STORY_PROGRESS?.difficulty || 'normal');
        if (!['normal', 'dificil', 'pesadelo'].includes(id)) id = 'normal';
        return id;
    }

    // Retorna (e garante) o objeto de progresso da dificuldade ATUAL
    function getDiffProg() {
        garantirEstrutura();
        const id = getDiffId();
        if (!STORY_PROGRESS.difficultyProgress[id]) {
            STORY_PROGRESS.difficultyProgress[id] = {
                unlockedChapters: [],
                unlockedPhases: {},
                completedPhases: [],
                stars: {},
            };
        }
        return STORY_PROGRESS.difficultyProgress[id];
    }

    // ==============================================================
    // 1. SOBRESCREVER FUNÇÕES DE PROGRESSO (operam na dificuldade ATUAL)
    // ==============================================================

    window.isPhaseUnlocked = function(cid, pid) {
        const d = getDiffProg();
        // Sempre libera a primeira fase do Ato 1
        if (pid === '1-1') return true;
        return (d.unlockedPhases[cid] || []).includes(pid);
    };

    window.isPhaseCompleted = function(pid) {
        const d = getDiffProg();
        return d.completedPhases.includes(pid);
    };

    window.unlockPhase = function(cid, pid) {
        const d = getDiffProg();
        if (!d.unlockedPhases[cid]) d.unlockedPhases[cid] = [];
        if (!d.unlockedPhases[cid].includes(pid)) d.unlockedPhases[cid].push(pid);
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
    };

    window.completePhase = function(cid, pid, nextPid) {
        const d = getDiffProg();
        if (!d.completedPhases.includes(pid)) d.completedPhases.push(pid);
        if (nextPid) window.unlockPhase(cid, nextPid);

        // Mantém a cópia "geral" em sincronia (compatibilidade)
        if (!STORY_PROGRESS.completedPhases.includes(pid)) {
            STORY_PROGRESS.completedPhases.push(pid);
        }
        if (!STORY_PROGRESS.phasesEverCompleted.includes(pid)) {
            STORY_PROGRESS.phasesEverCompleted.push(pid);
        }

        if (typeof saveStoryProgress === 'function') saveStoryProgress();
    };

    window.getStarsForPhase = function(phaseId) {
        const d = getDiffProg();
        return d.stars[phaseId] || 0;
    };

    window.saveStarsForPhase = function(phaseId, stars) {
        const d = getDiffProg();

        // Aplica bônus de estrelas por dificuldade (se existir a tabela)
        let effectiveStars = stars;
        const DIFFS = (typeof STORY_DIFFICULTIES !== 'undefined') ? STORY_DIFFICULTIES : null;
        const diffId = getDiffId();
        if (DIFFS && DIFFS[diffId] && DIFFS[diffId].starsBonus > 0) {
            effectiveStars = Math.min(3, stars + DIFFS[diffId].starsBonus);
        }

        const current = d.stars[phaseId] || 0;
        const final = Math.max(current, effectiveStars);
        d.stars[phaseId] = final;

        // Mantém a cópia geral também (para telas legadas)
        const curGlobal = STORY_PROGRESS.starsByPhase[phaseId] || 0;
        STORY_PROGRESS.starsByPhase[phaseId] = Math.max(curGlobal, final);

        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        return final;
    };

    // ==============================================================
    // 2. getTotalStars — SOMA só da dificuldade ATUAL
    // ==============================================================
    window.getTotalStars = function() {
        const d = getDiffProg();
        return Object.values(d.stars || {}).reduce((a, b) => a + b, 0);
    };

    // ==============================================================
    // 3. unlockAllStoryChapters (debug) — só na dificuldade ATUAL
    // ==============================================================
    window.unlockAllStoryChapters = function() {
        const d = getDiffProg();
        Object.keys(STORY_CHAPTERS).forEach(k => {
            const cid = parseInt(k);
            if (!d.unlockedChapters.includes(cid)) d.unlockedChapters.push(cid);
            if (!d.unlockedPhases[cid]) d.unlockedPhases[cid] = [];
            STORY_CHAPTERS[cid].phases.forEach(p => {
                if (!d.unlockedPhases[cid].includes(p.id)) d.unlockedPhases[cid].push(p.id);
            });
        });
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        console.log('✅ (debug) Todos os capítulos/fases liberados na dificuldade: ' + getDiffId());
        if (typeof renderAldeiaScreen === 'function') renderAldeiaScreen();
    };

    // ==============================================================
    // 4. HOOK NO completePhase do jogo (phase.isBoss desbloqueia próximo ato)
    //    Garante que o Ato N+1 entra na lista da dificuldade ATUAL
    // ==============================================================
    // (a função handleStoryPhaseVictory já chama unlockPhase, que foi
    //  reescrita acima e opera na dificuldade atual — então já funciona.)

    // ==============================================================
    // 5. HOOK NA TELA DE FASES: filtrar exibição pela dificuldade
    //    (o renderChapterPhases original usa isPhaseUnlocked,
    //     que agora consulta a dificuldade atual)
    // ==============================================================
    // (não precisa sobrescrever — isPhaseUnlocked já resolve)

    // ==============================================================
    // 6. HOOK NA TELA DE ATOS: mostrar progresso por dificuldade
    // ==============================================================
    // renderAtosScreen usa:
    //   isPhaseCompleted (agora por dificuldade)
    //   getStarsForPhase (agora por dificuldade)
    // Então já mostra o progresso correto automaticamente.

    // ==============================================================
    // 7. AO TROCAR DE DIFICULDADE, limpar cache visual e re-renderizar
    // ==============================================================
    const _origSetDiff = window.setStoryDifficulty;
    if (typeof _origSetDiff === 'function' && !window._setDiffV92) {
        window._setDiffV92 = true;
        window.setStoryDifficulty = function(id) {
            const ok = _origSetDiff.apply(this, arguments);
            if (ok) {
                console.log(`[V9.2] Dificuldade trocada para "${id}". Progresso independente.`);
                // Se estiver na tela de atos/fases, re-renderiza
                const ss = document.getElementById('storyScreen');
                if (ss && ss.classList.contains('active')) {
                    // Detecta se está numa tela de fases
                    const titleEl = ss.querySelector('.story-title');
                    const titleTxt = titleEl ? titleEl.textContent.trim().toUpperCase() : '';
                    if (titleTxt.includes('ATO ')) {
                        // Re-renderiza a tela de fases do mesmo ato
                        const match = titleTxt.match(/ATO\s+(\d+)/);
                        if (match) {
                            const cid = parseInt(match[1]);
                            if (STORY_CHAPTERS[cid] && typeof renderChapterPhases === 'function') {
                                renderChapterPhases(STORY_CHAPTERS[cid]);
                            }
                        }
                    } else if (titleTxt === 'ALDEIA') {
                        if (typeof renderAldeiaScreen === 'function') renderAldeiaScreen();
                    } else if (titleTxt.includes('ATOS')) {
                        if (typeof renderAtosScreen === 'function') renderAtosScreen();
                    }
                }
            }
            return ok;
        };
    }

    // ==============================================================
    // 8. GARANTIR primeira fase do Ato 1 sempre liberada
    // ==============================================================
    function garantirPrimeiraFase() {
        const d = getDiffProg();
        if (!d.unlockedPhases[1]) d.unlockedPhases[1] = [];
        if (!d.unlockedPhases[1].includes('1-1')) d.unlockedPhases[1].push('1-1');
        if (!d.unlockedChapters.includes(1)) d.unlockedChapters.push(1);
    }

    // ==============================================================
    // 9. EXECUTAR SETUP
    // ==============================================================
    garantirEstrutura();
    garantirPrimeiraFase();

    // Se o save ativo carregar depois (via loadStoryProgressByName),
    // re-garantir a estrutura. Envolve a função.
    if (typeof window.loadStoryProgressByName === 'function' && !window._loadSaveV92) {
        window._loadSaveV92 = true;
        const _origLoad = window.loadStoryProgressByName;
        window.loadStoryProgressByName = function(name) {
            const r = _origLoad.apply(this, arguments);
            if (r) {
                // Reseta flag de migração por save
                window._storyDiffMigrado = false;
                garantirEstrutura();
                garantirPrimeiraFase();
                if (typeof saveStoryProgress === 'function') saveStoryProgress();
            }
            return r;
        };
    }

    // Também envolve createNewStorySave para garantir estrutura
    if (typeof window.createNewStorySave === 'function' && !window._createSaveV92) {
        window._createSaveV92 = true;
        const _origCreate = window.createNewStorySave;
        window.createNewStorySave = function(name) {
            const r = _origCreate.apply(this, arguments);
            window._storyDiffMigrado = false;
            garantirEstrutura();
            garantirPrimeiraFase();
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
            return r;
        };
    }

    // ==============================================================
    // 10. DEBUG HELPER
    // ==============================================================
    window.debugDifficulties = function() {
        console.group('📊 PROGRESSO POR DIFICULDADE');
        ['normal', 'dificil', 'pesadelo'].forEach(id => {
            const d = STORY_PROGRESS.difficultyProgress[id] || {};
            const stars = Object.values(d.stars || {}).reduce((a, b) => a + b, 0);
            console.log(`[${id}]`, {
                capítulos: d.unlockedChapters || [],
                fasesLiberadas: Object.values(d.unlockedPhases || {}).flat().length,
                fasesCompletas: (d.completedPhases || []).length,
                estrelas: stars,
            });
        });
        console.groupEnd();
    };

    console.log('✅ [V9.2] Progresso por dificuldade INDEPENDENTE instalado.');
    console.log('   • Normal/Difícil/Pesadelo têm fases e estrelas separadas.');
    console.log('   • Migração automática: save antigo → "normal".');
    console.log('   • Use window.debugDifficulties() para ver o estado.');
})();
// =================================================================
// historia.js — BLOCO CORRETIVO 10 (V9.3 — Score Multi-Inimigo)
// -----------------------------------------------------------------
// Cole NO FINAL de historia.js, depois do Bloco 9.
//
// PROBLEMA:
//   • calcularMaxScorePossivel olhava SÓ o último inimigo da fase
//   • calculateFinalScore usava só o boss ATUAL (não acumulava)
//   • Fases com 1 inimigo eram penalizadas
//   • Fases com vários inimigos davam 3 estrelas fácil
//
// SOLUÇÃO:
//   • maxScore = soma do HP de TODOS os inimigos da fase
//   • score real = acumula pontuação de CADA inimigo derrotado
//   • Bônus (ultimates/amuletas/formas) acumulam por fase
//   • Referências balanceadas para 1/2/3/4+ inimigos
// =================================================================

(function fixScoreMultiInimigoV93() {
    if (window._storyScoreV93) return;
    window._storyScoreV93 = true;

    // =============================================================
    // 1. Estado acumulador (resetado no início de cada fase)
    // =============================================================
    if (typeof window._storyScoreAcumulado === 'undefined') {
        window._storyScoreAcumulado = {
            totalBase: 0,           // soma de base × mult de cada inimigo
            totalBonus: 0,          // soma de bônus (ultimates/amuletas/formas)
            inimigosMortos: 0,      // quantos já caíram nesta fase
            faseAtual: null,        // id da fase (para reset)
        };
    }

    function resetScoreAcumulado() {
        window._storyScoreAcumulado = {
            totalBase: 0,
            totalBonus: 0,
            inimigosMortos: 0,
            faseAtual: null,
        };
    }

    // =============================================================
    // 2. calcularMaxScorePossivel — SOMA TODOS os inimigos da fase
    // =============================================================
    window.calcularMaxScorePossivel = function(cid, phase) {
        if (!phase || !phase.enemies || phase.enemies.length === 0) return 100;

        // Soma o HP de TODOS os inimigos da fase
        let somaHp = 0;
        phase.enemies.forEach(enemyId => {
            const enemy = STORY_ENEMIES[enemyId];
            if (enemy) somaHp += enemy.hp || 30;
        });

        // Cada inimigo gera um score próprio.
        // Simula "matar todos com mult máximo (1.5) e bônus ótimos".
        const numInimigos = phase.enemies.length;

        // Base por inimigo (mesma fórmula do calculateFinalScore)
        // Fórmula antiga: 1000 + (hp - 30) × 50
        // Mas para fases com vários inimigos, o HP "médio" é mais justo
        const hpMedio = somaHp / numInimigos;
        const basePorInimigo = Math.max(100, 1000 + (hpMedio - 30) * 50);

        // Base total = base por inimigo × número de inimigos × mult máximo
        const baseTotal = basePorInimigo * numInimigos * 1.5;

        // Bônus que escalam com número de inimigos
        // (você pode usar 1 ultimate por inimigo, coletar 2 amuletas por fase)
        const ultimatesBonus = numInimigos * 150;
        const amuletasBonus  = 2 * 100;             // amuletas são por fase
        const formasBonus    = numInimigos * 100;   // uma forma por inimigo

        const maxScore = Math.floor(baseTotal + ultimatesBonus + amuletasBonus + formasBonus);
        return Math.max(100, maxScore);
    };

    // =============================================================
    // 3. saveStarsForPhase — recalcular com a fórmula NOVA
    // =============================================================
    // (mantém o comportamento anterior: aplica bônus de dificuldade,
    //  salva na dificuldade atual e no global)

    // =============================================================
    // 4. Hook no início da fase — resetar acumulador
    // =============================================================
    const _origStartPhase = window.startStoryPhase;
    if (typeof _origStartPhase === 'function') {
        window.startStoryPhase = function(cid, pid) {
            resetScoreAcumulado();
            window._storyScoreAcumulado.faseAtual = pid;
            return _origStartPhase.apply(this, arguments);
        };
    }

    // =============================================================
    // 5. Hook em handleStoryBossDefeat — acumular score a cada morte
    // =============================================================
    const _origBossDefeat = window.handleStoryBossDefeat;
    if (typeof _origBossDefeat === 'function') {
        window.handleStoryBossDefeat = async function() {
            // ANTES de processar a morte, captura o score do inimigo ATUAL
            // (o calculateFinalScore usa boss.maxHp, que ainda está vivo aqui)
            try {
                if (window._storyMode && typeof calculateFinalScore === 'function') {
                    // Base do inimigo atual
                    const hpAtual = boss.maxHp || 30;
                    const baseAtual = Math.max(100, 1000 + (hpAtual - 30) * 50);

                    // Mult por turnos (mesma fórmula do calculateFinalScore)
                    let mult = 1;
                    if (RANKING.turns <= 10) mult = 1.5;
                    else if (RANKING.turns <= 20) mult = 1.25;
                    else if (RANKING.turns <= 30) mult = 1.0;
                    else mult = 0.8;

                    const basePontos = Math.floor(baseAtual * mult);

                    // Bônus DESTE inimigo (ultimates/amuletas/formas usados desde a última morte)
                    // Como os bônus são globais em RANKING, vamos zerar após acumular
                    const bonusAtual =
                        (RANKING.ultimates * 150) +
                        (RANKING.amulets * 100) +
                        (RANKING.shapes.LINHA * 50) +
                        (RANKING.shapes.L * 75) +
                        (RANKING.shapes.ZIGZAG * 100) +
                        (RANKING.shapes.QUADRADO * 80);

                    // Acumula
                    window._storyScoreAcumulado.totalBase += basePontos;
                    window._storyScoreAcumulado.totalBonus += bonusAtual;
                    window._storyScoreAcumulado.inimigosMortos += 1;

                    // Zera os contadores para o PRÓXIMO inimigo
                    RANKING.turns = 0;
                    RANKING.ultimates = 0;
                    RANKING.amulets = 0;
                    Object.keys(RANKING.shapes).forEach(k => RANKING.shapes[k] = 0);

                    console.log(
                        `[V9.3] Score acumulado do inimigo #${window._storyScoreAcumulado.inimigosMortos}:`,
                        `base=${basePontos}`, `bonus=${bonusAtual}`,
                        `total=${window._storyScoreAcumulado.totalBase + window._storyScoreAcumulado.totalBonus}`
                    );
                }
            } catch(e) {
                console.warn('[V9.3] Erro ao acumular score:', e);
            }

            return _origBossDefeat.apply(this, arguments);
        };
    }

    // =============================================================
    // 6. Sobrescrever calculateFinalScore — retorna o ACUMULADO
    // =============================================================
    const _origCalcFinal = window.calculateFinalScore;
    if (typeof _origCalcFinal === 'function') {
        window.calculateFinalScore = function() {
            // Fora do modo história → comportamento original
            if (!window._storyMode) {
                return _origCalcFinal.apply(this, arguments);
            }

            const acc = window._storyScoreAcumulado || { totalBase: 0, totalBonus: 0 };

            // Se nenhum inimigo foi contabilizado ainda (ex: chamado antes
            // do hook rodar), cai no comportamento original.
            if (acc.inimigosMortos === 0) {
                return _origCalcFinal.apply(this, arguments);
            }

            // Score da fase = base acumulada + bônus acumulados
            return Math.floor(acc.totalBase + acc.totalBonus);
        };
    }

    // =============================================================
    // 7. Hook em showStoryVictoryScreen — garantir que use o score
    //    final acumulado (não o do último inimigo sozinho)
    // =============================================================
    // (isso já é feito porque handleStoryPhaseVictory chama
    //  calculateFinalScore, que agora retorna o acumulado)

    // =============================================================
    // 8. Ajuste fino dos thresholds (opcional)
    // =============================================================
    // Com maxScore maior (soma de todos os inimigos), os thresholds
    // originais (60%/35%/15%) ficam um pouco frouxos.
    // Ajustando para 80%/55%/30% — mais justo:
    if (typeof STORY_STARS_CONFIG !== 'undefined') {
        // Não mexe nos thresholds em uso (calcularEstrelas usa hardcode)
        // Mas expõe pra debug
        STORY_STARS_CONFIG.THRESHOLD_3_STARS = 0.70;
        STORY_STARS_CONFIG.THRESHOLD_2_STARS = 0.30;
        STORY_STARS_CONFIG.THRESHOLD_1_STAR  = 0.30;
    }

    // Reescreve calcularEstrelas com os novos thresholds
    window.calcularEstrelas = function(score, maxScore) {
        if (!maxScore || maxScore <= 0) return 1;
        const ratio = score / maxScore;
        if (ratio >= 0.70) return 3;
        if (ratio >= 0.20) return 2;
        return 1;
    };

    // =============================================================
    // 9. Debug
    // =============================================================
    window.debugScore = function() {
        console.group('📊 SCORE DEBUG');
        console.log('Acumulado:', window._storyScoreAcumulado);
        if (typeof storyCurrentPhase !== 'undefined' && storyCurrentPhase) {
            const cid = STORY_PROGRESS.currentChapter || 1;
            const max = calcularMaxScorePossivel(cid, storyCurrentPhase);
            const real = calculateFinalScore();
            console.log('Fase atual:', storyCurrentPhase.id);
            console.log('Inimigos:', storyCurrentPhase.enemies.length);
            console.log('Max score possível:', max);
            console.log('Score real (acumulado):', real);
            console.log('Ratio:', (real / max).toFixed(2));
            console.log('Estrelas:', calcularEstrelas(real, max));
        }
        console.groupEnd();
    };

    console.log('✅ [V9.3] Score multi-inimigo corrigido.');
    console.log('   • maxScore = soma de TODOS os inimigos da fase');
    console.log('   • score real = acumulado de cada inimigo derrotado');
    console.log('   • thresholds: 80% / 55% / 30%');
    console.log('   • use window.debugScore() para ver o estado');
})();
// =================================================================
// historia.js — BLOCO 11 (V9.4) — 12 NOVOS HERÓIS
// -----------------------------------------------------------------
// Cole NO FINAL de historia.js, depois do Bloco 10.
//
// Contém:
//   • 12 heróis inéditos (3 por classe + 3 por zerar dificuldade)
//   • Stats, raridade, elemento, role
//   • PAs implementados (executam via triggerBravelyChain)
//   • Sprites em branco para preencher
//
// A Parte 2 (hooks de desbloqueio + UI de seleção + CSS) vem depois.
// =================================================================

(function install12NovosHerois() {
    if (window._storyHeroisV94) return;
    window._storyHeroisV94 = true;

    // ==============================================================
    // 1. ESTENDER STORY_HERO_CLASSES
    // ==============================================================
    if (typeof STORY_HERO_CLASSES === 'undefined') {
        console.warn('[V9.4] STORY_HERO_CLASSES não encontrada.');
        return;
    }

    const novosHerois = {
        // ---- ZERAR DIFICULDADE ----
        'Curupira': {
            displayName: 'Curupira',
            spriteKey: 'heroi_Curupira',
            className: 'Curupira',
            role: 'Arqueiro',
            hp: 11, atk: 4, range: 3,
            element: 'TERRA',
            paKey: 'curupira_chuva_flechas',
            starsNeeded: 0,
            rarity: 4,   // ⭐⭐⭐⭐ Mítico
            unlockReq: { type: 'clear', difficulty: 'normal' },
        },
        'Kianumanka-Manã': {
            displayName: 'Kianumanka-Manã',
            spriteKey: 'heroi_Kianumanka',
            className: 'Kianumanka-Manã',
            role: 'Guerreiro',
            hp: 16, atk: 4, range: 0,
            element: 'FOGO',
            paKey: 'kianumanka_meteoro',
            starsNeeded: 0,
            rarity: 4,   // ⭐⭐⭐⭐ Mítico
            unlockReq: { type: 'clear', difficulty: 'dificil' },
        },
        'Anhanga-Mirim': {
            displayName: 'Anhanga-Mirim',
            spriteKey: 'heroi_AnhangaMirim',
            className: 'Anhanga-Mirim',
            role: 'Mago',
            hp: 12, atk: 4, range: 4,
            element: 'AR',
            paKey: 'anhanga_mirim_raio',
            starsNeeded: 0,
            rarity: 5,   // ⭐⭐⭐⭐⭐ Divino
            unlockReq: { type: 'clear', difficulty: 'pesadelo' },
        },

        // ---- ARQUEIROS (por estrelas) ----
        'Matinta Pereira': {
            displayName: 'Matinta Pereira',
            spriteKey: 'heroi_Matinta',
            className: 'Matinta Pereira',
            role: 'Arqueiro',
            hp: 9, atk: 4, range: 3,
            element: 'AR',
            paKey: 'matinta_rajada',
            starsNeeded: 200,
            rarity: 3,
            unlockReq: { type: 'stars', difficulty: 'dificil' },
        },
        'Naiá': {
            displayName: 'Naiá',
            spriteKey: 'heroi_Naia',
            className: 'Naiá',
            role: 'Arqueiro',
            hp: 12, atk: 2, range: 3,
            element: 'AGUA',
            paKey: 'naia_apaga_fogo',
            starsNeeded: 220,
            rarity: 3,
            unlockReq: { type: 'stars', difficulty: 'dificil' },
        },
        'Kuatí': {
            displayName: 'Kuatí',
            spriteKey: 'heroi_Kuati',
            className: 'Kuatí',
            role: 'Arqueiro',
            hp: 10, atk: 3, range: 3,
            element: 'FOGO',
            paKey: 'kuati_explosao',
            starsNeeded: 240,
            rarity: 3,
            unlockReq: { type: 'stars', difficulty: 'dificil' },
        },

        // ---- GUERREIROS (por estrelas) ----
        'Caboclo d\'Água': {
            displayName: 'Caboclo dágua',
            spriteKey: 'heroi_CabocloAgua',
            className: 'Caboclo d\'Água',
            role: 'Guerreiro',
            hp: 18, atk: 3, range: 0,
            element: 'AGUA',
            paKey: 'caboclo_mare',
            starsNeeded: 200,
            rarity: 3,
            unlockReq: { type: 'stars', difficulty: 'dificil' },
        },
        'Tupinambá': {
            displayName: 'Tupinambá',
            spriteKey: 'heroi_Tupinamba',
            className: 'Tupinambá',
            role: 'Guerreiro',
            hp: 20, atk: 4, range: 0,
            element: 'TERRA',
            paKey: 'tupinamba_avalanche',
            starsNeeded: 220,
            rarity: 3,
            unlockReq: { type: 'stars', difficulty: 'dificil' },
        },
        'Mbaraká': {
            displayName: 'Mbaraká',
            spriteKey: 'heroi_Mbaraka',
            className: 'Mbaraká',
            role: 'Guerreiro',
            hp: 15, atk: 4, range: 0,
            element: 'AR',
            paKey: 'mbaraka_salto_raio',
            starsNeeded: 240,
            rarity: 3,
            unlockReq: { type: 'stars', difficulty: 'dificil' },
        },

        // ---- MAGOS (por estrelas) ----
        'Mãe-do-Ouro': {
            displayName: 'Mãe-do-Ouro',
            spriteKey: 'heroi_MaeDoOuro',
            className: 'Mãe-do-Ouro',
            role: 'Mago',
            hp: 10, atk: 4, range: 4,
            element: 'TERRA',
            paKey: 'maedouro_caminho',
            starsNeeded: 200,
            rarity: 3,
            unlockReq: { type: 'stars', difficulty: 'dificil' },
        },
        'Pajé-Açu': {
            displayName: 'Pajé-Açu',
            spriteKey: 'heroi_PajeAcu',
            className: 'Pajé-Açu',
            role: 'Mago',
            hp: 11, atk: 3, range: 4,
            element: 'FOGO',
            paKey: 'pajeacu_linha',
            starsNeeded: 220,
            rarity: 3,
            unlockReq: { type: 'stars', difficulty: 'dificil' },
        },
        'Negrinho do Pastoreio': {
            displayName: 'Negrinho do Pastoreio',
            spriteKey: 'heroi_Negrinho',
            className: 'Negrinho do Pastoreio',
            role: 'Mago',
            hp: 10, atk: 3, range: 4,
            element: 'AGUA',
            paKey: 'negrinho_cruz_cura',
            starsNeeded: 240,
            rarity: 3,
            unlockReq: { type: 'stars', difficulty: 'dificil' },
        },
    };

    // Adiciona ao STORY_HERO_CLASSES
    Object.keys(novosHerois).forEach(className => {
        if (!STORY_HERO_CLASSES[className]) {
            STORY_HERO_CLASSES[className] = novosHerois[className];
        }
    });

    console.log(`[V9.4] ${Object.keys(novosHerois).length} heróis adicionados a STORY_HERO_CLASSES.`);

    // ==============================================================
    // 2. ESTENDER STORY_BRAVELY_GIFS (sprites em branco)
    // ==============================================================
    if (typeof STORY_BRAVELY_GIFS !== 'undefined') {
        const gifsNovos = {
            'Curupira': '',
            'Kianumanka-Manã': '',
            'Anhanga-Mirim': '',
            'Matinta Pereira': '',
            'Naiá': '',
            'Kuatí': '',
            'Caboclo d\'Água': '',
            'Tupinambá': '',
            'Mbaraká': '',
            'Mãe-do-Ouro': '',
            'Pajé-Açu': '',
            'Negrinho do Pastoreio': '',
        };
        Object.keys(gifsNovos).forEach(k => {
            if (!(k in STORY_BRAVELY_GIFS)) STORY_BRAVELY_GIFS[k] = gifsNovos[k];
        });
    }

    // ==============================================================
    // 3. HELPER — posições de área
    // ==============================================================
    function getTilesInArea(cx, cy, radius, includeCenter = true) {
        const tiles = [];
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (!includeCenter && dx === 0 && dy === 0) continue;
                const nx = cx + dx, ny = cy + dy;
                if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                    tiles.push({ x: nx, y: ny, idx: ny * 8 + nx });
                }
            }
        }
        return tiles;
    }

    function getTilesInLine(cx, cy, isHorizontal) {
        const tiles = [];
        for (let i = 0; i < 8; i++) {
            if (isHorizontal) tiles.push({ x: i, y: cy, idx: cy * 8 + i });
            else              tiles.push({ x: cx, y: i, idx: i * 8 + cx });
        }
        return tiles;
    }

    function getTilesInCross(cx, cy) {
        const tiles = [];
        const seen = new Set();
        for (let i = 0; i < 8; i++) {
            if (!seen.has(i * 8 + cx)) { tiles.push({ x: cx, y: i, idx: i * 8 + cx }); seen.add(i * 8 + cx); }
            if (!seen.has(cy * 8 + i)) { tiles.push({ x: i, y: cy, idx: cy * 8 + i }); seen.add(cy * 8 + i); }
        }
        return tiles;
    }

    function convertTiles(tiles, element) {
        tiles.forEach(t => {
            grid[t.idx] = element;
            const el = document.querySelectorAll('#grid .tile')[t.idx];
            if (el) el.className = `tile bg-${element}`;
        });
    }

    // ==============================================================
    // 4. STORY_HERO_PA — 12 PAs implementados
    // ==============================================================
    if (typeof STORY_HERO_PA === 'undefined') {
        window.STORY_HERO_PA = {};
    }

    // ---- 1. CURUPIRA — Chuva de Flechas ----
    STORY_HERO_PA['curupira_chuva_flechas'] = {
        desc: 'Escolhe até 10 tiles AR → viram TERRA. Flecha cai em cada. Boss neles toma dano PA ×2.',
        execute: async (active, target, totalAtk) => {
            // Tiles AR no tabuleiro
            const arTiles = [];
            grid.forEach((el, idx) => {
                if (el === 'AR') arTiles.push({ x: idx % 8, y: Math.floor(idx / 8), idx });
            });

            // Se ≤10, auto-seleciona todos
            let selected = [];
            if (arTiles.length <= 10) {
                selected = arTiles;
                addLog(`🏹 Curupira: ${selected.length} tiles AR selecionados automaticamente!`);
            } else {
                // Modo de seleção manual (Parte 2 vai implementar o botão)
                // Fallback: pega os 10 primeiros
                selected = arTiles.slice(0, 10);
                addLog(`🏹 Curupira: selecionando 10 tiles AR...`);
            }

            // Converte pra TERRA
            convertTiles(selected, 'TERRA');

            // Flechas caindo (visual)
            selected.forEach((t, i) => {
                setTimeout(() => {
                    if (typeof spawnFxAt === 'function') {
                        spawnFxAt('impact', 'fx-impact', t.x, t.y, { duration: 500, scale: 0.7 });
                    }
                }, i * 60);
            });

            await sleep(600);

            // Dano no boss (se estiver em algum tile)
            if (target && !target.dead) {
                const bossIdx = target.y * 8 + target.x;
                if (selected.some(t => t.idx === bossIdx)) {
                    const dmg = Math.floor(totalAtk * 2);
                    if (typeof applyDmg === 'function') applyDmg(target, dmg);
                    addLog(`🏹 Curupira: dano crítico ×2 no boss! (${dmg})`);
                }
            }
        }
    };

    // ---- 2. KIANUMANKA — Meteoro ----
    STORY_HERO_PA['kianumanka_meteoro'] = {
        desc: 'Meteoro cai no tile do boss, área 3×3, converte pra FOGO, dano PA.',
        execute: async (active, target, totalAtk) => {
            if (!target || target.dead) return;
            const tiles = getTilesInArea(target.x, target.y, 1, true);

            // Meteoro caindo (visual)
            if (typeof spawnFxAt === 'function') {
                spawnFxAt('fireball', 'fireball-fx', target.x, target.y, { duration: 800, scale: 2 });
            }
            await sleep(400);

            // Explosão
            if (typeof spawnFxArea === 'function') {
                spawnFxArea('impact', 'fx-impact', target.x, target.y, 1, { duration: 700 });
            }

            convertTiles(tiles, 'FOGO');
            await sleep(300);

            // Dano
            if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            addLog(`☄️ Kianumanka: meteoro caiu! (${totalAtk} dano em área 3×3)`);
        }
    };

    // ---- 3. ANHANGA-MIRIM — Raio em linha + coluna ----
    STORY_HERO_PA['anhanga_mirim_raio'] = {
        desc: 'Escolhe 1 tile AR → raio na linha + coluna (150% dano PA).',
        execute: async (active, target, totalAtk) => {
            // Tiles AR
            const arTiles = [];
            grid.forEach((el, idx) => {
                if (el === 'AR') arTiles.push({ x: idx % 8, y: Math.floor(idx / 8), idx });
            });

            if (arTiles.length === 0) {
                addLog(`⚡ Anhanga-Mirim: nenhum tile AR! PA falhou.`);
                return;
            }

            // Fallback: primeiro tile AR
            const chosen = arTiles[0];
            const tiles = getTilesInCross(chosen.x, chosen.y);

            // Raio visual
            if (typeof spawnFxAt === 'function') {
                spawnFxAt('impact', 'fx-impact', chosen.x, chosen.y, { duration: 800, scale: 1.5 });
            }
            await sleep(400);

            convertTiles(tiles, 'AR');

            // Dano 150%
            const dmg = Math.floor(totalAtk * 1.5);
            if (target && !target.dead) {
                if (typeof applyDmg === 'function') applyDmg(target, dmg);
            }
            addLog(`⚡ Anhanga-Mirim: raio na cruz! (${dmg} dano = 150%)`);
        }
    };

    // ---- 4. MATINTA — Rajada + empurrão ----
    STORY_HERO_PA['matinta_rajada'] = {
        desc: 'Boss é empurrado pra uma borda, depois pra outra. Dano PA em cada colisão.',
        execute: async (active, target, totalAtk) => {
            if (!target || target.dead) return;

            const linha = target.y;
            const tiles = getTilesInLine(target.x, linha, true);
            convertTiles(tiles, 'AR');

            // Primeiro empurrão: pra borda esquerda (x=0)
            if (typeof spawnFxAt === 'function') {
                spawnFxAt('vortex', 'vortex-fx', target.x, target.y, { duration: 600 });
            }
            target.x = 0;
            if (typeof updateVisuals === 'function') updateVisuals();
            await sleep(400);

            if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            addLog(`🌪️ Matinta: boss empurrado pra borda esquerda! (${totalAtk} dano)`);

            if (target.dead) return;

            // Segundo empurrão: pra borda direita (x=7)
            if (typeof spawnFxAt === 'function') {
                spawnFxAt('vortex', 'vortex-fx', target.x, target.y, { duration: 600 });
            }
            target.x = 7;
            if (typeof updateVisuals === 'function') updateVisuals();
            await sleep(400);

            if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            addLog(`🌪️ Matinta: boss empurrado pra borda direita! (${totalAtk} dano)`);
        }
    };

    // ---- 5. NAIÁ — Apaga fogo ----
    STORY_HERO_PA['naia_apaga_fogo'] = {
        desc: 'Todos os tiles FOGO viram AGUA. Cada um = 1 dano no boss.',
        execute: async (active, target, totalAtk) => {
            const fogoTiles = [];
            grid.forEach((el, idx) => {
                if (el === 'FOGO') fogoTiles.push({ x: idx % 8, y: Math.floor(idx / 8), idx });
            });

            if (fogoTiles.length === 0) {
                addLog(`💧 Naiá: nenhum tile FOGO! PA fraco.`);
            }

            // Visual + conversão
            fogoTiles.forEach((t, i) => {
                setTimeout(() => {
                    if (typeof spawnFxAt === 'function') {
                        spawnFxAt('splash', 'fx-splash-wave', t.x, t.y, { duration: 500 });
                    }
                }, i * 40);
            });

            convertTiles(fogoTiles, 'AGUA');
            await sleep(600);

            // Dano = número de tiles convertidos
            const dmg = fogoTiles.length;
            if (target && !target.dead && dmg > 0) {
                if (typeof applyDmg === 'function') applyDmg(target, dmg);
            }
            addLog(`💧 Naiá: ${dmg} tiles FOGO apagados! (${dmg} dano)`);
        }
    };

    // ---- 6. KUATÍ — Explosão de fogo ----
    STORY_HERO_PA['kuati_explosao'] = {
        desc: 'Área 3×3 ao redor do herói + linha do herói. Explosão de FOGO.',
        execute: async (active, target, totalAtk) => {
            const area = getTilesInArea(active.x, active.y, 1, true);
            const linha = getTilesInLine(active.x, active.y, true);

            // União
            const allTiles = [...area];
            const seen = new Set(area.map(t => t.idx));
            linha.forEach(t => { if (!seen.has(t.idx)) allTiles.push(t); });

            // Explosão visual
            if (typeof spawnFxAt === 'function') {
                spawnFxAt('impact', 'fx-impact', active.x, active.y, { duration: 800, scale: 2 });
            }
            allTiles.forEach((t, i) => {
                setTimeout(() => {
                    if (typeof spawnFxAt === 'function') {
                        spawnFxAt('impact', 'fx-impact', t.x, t.y, { duration: 400, scale: 0.6 });
                    }
                }, i * 40);
            });

            await sleep(500);
            convertTiles(allTiles, 'FOGO');

            // Dano
            if (target && !target.dead) {
                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            }
            addLog(`🔥 Kuatí: explosão de fogo! (${totalAtk} dano em ${allTiles.length} tiles)`);
        }
    };

    // ---- 7. CABOCLO D'ÁGUA — Maré + puxão ----
    STORY_HERO_PA['caboclo_mare'] = {
        desc: 'Maré 3×3 ao redor do herói. Boss é puxado 3 tiles. Dano se estiver na área.',
        execute: async (active, target, totalAtk) => {
            const tiles = getTilesInArea(active.x, active.y, 1, true);

            // Maré visual
            tiles.forEach((t, i) => {
                setTimeout(() => {
                    if (typeof spawnFxAt === 'function') {
                        spawnFxAt('splash', 'fx-splash-wave', t.x, t.y, { duration: 500 });
                    }
                }, i * 40);
            });

            convertTiles(tiles, 'AGUA');
            await sleep(500);

            if (target && !target.dead) {
                // Puxa 3 tiles na direção do herói
                const dx = Math.sign(active.x - target.x);
                const dy = Math.sign(active.y - target.y);
                for (let i = 0; i < 3; i++) {
                    const nx = target.x + dx;
                    const ny = target.y + dy;
                    if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
                    if (typeof isOccupied === 'function' && isOccupied(nx, ny, -1)) break;
                    target.x = nx; target.y = ny;
                }
                if (typeof updateVisuals === 'function') updateVisuals();

                // Dano se boss estiver na área
                const bossIdx = target.y * 8 + target.x;
                if (tiles.some(t => t.idx === bossIdx)) {
                    if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
                    addLog(`🌊 Caboclo: boss puxado e atingido! (${totalAtk} dano)`);
                } else {
                    addLog(`🌊 Caboclo: boss puxado mas fora da área.`);
                }
            }
        }
    };

    // ---- 8. TUPINAMBÁ — Avalanche em cruz ----
    STORY_HERO_PA['tupinamba_avalanche'] = {
        desc: 'Cruz (linha + coluna do boss). Empurra boss. Dano PA.',
        execute: async (active, target, totalAtk) => {
            if (!target || target.dead) return;

            const tiles = getTilesInCross(target.x, target.y);

            // Avalanche visual
            tiles.forEach((t, i) => {
                setTimeout(() => {
                    if (typeof spawnFxAt === 'function') {
                        spawnFxAt('rock', 'rock-projectile', t.x, t.y, { duration: 500, scale: 0.8 });
                    }
                }, i * 30);
            });

            convertTiles(tiles, 'TERRA');
            await sleep(600);

            // Empurra boss
            const dx = Math.sign(target.x - active.x) || 1;
            const dy = Math.sign(target.y - active.y) || 0;
            for (let i = 0; i < 2; i++) {
                const nx = target.x + dx;
                const ny = target.y + dy;
                if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
                target.x = nx; target.y = ny;
            }
            if (typeof updateVisuals === 'function') updateVisuals();

            // Dano
            if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            addLog(`🪨 Tupinambá: avalanche + empurrão! (${totalAtk} dano)`);
        }
    };

    // ---- 9. MBARAKÁ — Salto + raio ----
    STORY_HERO_PA['mbaraka_salto_raio'] = {
        desc: 'Salta no boss. Raio 3×3. Empurra pra borda mais próxima (ou oposta se já na borda).',
        execute: async (active, target, totalAtk) => {
            if (!target || target.dead) return;

            // Salto visual
            if (typeof spawnFxAt === 'function') {
                spawnFxAt('impact', 'fx-impact', active.x, active.y, { duration: 400 });
            }
            await sleep(200);

            // Teleporta herói pro lado do boss
            active.x = target.x;
            active.y = Math.max(0, target.y - 1);
            if (typeof updateVisuals === 'function') updateVisuals();

            const tiles = getTilesInArea(target.x, target.y, 1, true);

            // Raio visual
            if (typeof spawnFxAt === 'function') {
                spawnFxAt('impact', 'fx-impact', target.x, target.y, { duration: 800, scale: 2 });
            }
            await sleep(400);

            convertTiles(tiles, 'AR');

            // Empurra
            if (target.x <= 1) {
                target.x = 7;   // se perto da borda esquerda, empurra pra direita
            } else if (target.x >= 6) {
                target.x = 0;   // se perto da direita, empurra pra esquerda
            } else {
                target.x = target.x < 4 ? 0 : 7;  // senão, pra borda mais próxima
            }
            if (typeof updateVisuals === 'function') updateVisuals();

            if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            addLog(`⚡ Mbaraká: raio + empurrão! (${totalAtk} dano)`);
        }
    };

    // ---- 10. MÃE-DO-OURO — Caminho até o boss ----
    STORY_HERO_PA['maedouro_caminho'] = {
        desc: 'Traça caminho até o boss. Tiles do caminho + boss = área. Dano em toda a área.',
        execute: async (active, target, totalAtk) => {
            if (!target || target.dead) return;

            // Caminho simples: linha horizontal depois vertical
            const tiles = [];
            const seen = new Set();

            // Horizontal
            const stepX = Math.sign(target.x - active.x);
            for (let x = active.x; x !== target.x + stepX; x += (stepX || 1)) {
                const nx = Math.max(0, Math.min(7, x));
                const idx = active.y * 8 + nx;
                if (!seen.has(idx)) { tiles.push({ x: nx, y: active.y, idx }); seen.add(idx); }
                if (stepX === 0) break;
            }
            // Vertical
            const stepY = Math.sign(target.y - active.y);
            for (let y = active.y; y !== target.y + stepY; y += (stepY || 1)) {
                const ny = Math.max(0, Math.min(7, y));
                const idx = ny * 8 + target.x;
                if (!seen.has(idx)) { tiles.push({ x: target.x, y: ny, idx }); seen.add(idx); }
                if (stepY === 0) break;
            }

            // Garante o tile do boss
            const bossIdx = target.y * 8 + target.x;
            if (!seen.has(bossIdx)) tiles.push({ x: target.x, y: target.y, idx: bossIdx });

            // Explosão por baixo (visual)
            tiles.forEach((t, i) => {
                setTimeout(() => {
                    if (typeof spawnFxAt === 'function') {
                        spawnFxAt('rock', 'rock-projectile', t.x, t.y, { duration: 500, scale: 0.6 });
                    }
                }, i * 40);
            });

            convertTiles(tiles, 'TERRA');
            await sleep(600);

            if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            addLog(`🌍 Mãe-do-Ouro: caminho explodiu! (${totalAtk} dano em ${tiles.length} tiles)`);
        }
    };

    // ---- 11. PAJÉ-AÇU — Linha + empurrão ----
    STORY_HERO_PA['pajeacu_linha'] = {
        desc: 'Dano em linha do herói. Empurra boss pra borda. Colisão = +50% dano.',
        execute: async (active, target, totalAtk) => {
            const tiles = getTilesInLine(active.x, active.y, true);

            // Fogo visual
            tiles.forEach((t, i) => {
                setTimeout(() => {
                    if (typeof spawnFxAt === 'function') {
                        spawnFxAt('impact', 'fx-impact', t.x, t.y, { duration: 500, scale: 0.6 });
                    }
                }, i * 40);
            });

            convertTiles(tiles, 'FOGO');
            await sleep(500);

            if (target && !target.dead) {
                // Empurra pra borda
                const targetX = target.x < 4 ? 0 : 7;
                target.x = targetX;
                if (typeof updateVisuals === 'function') updateVisuals();
                await sleep(300);

                // Dano + 50% se colidiu
                const dmg = Math.floor(totalAtk * 1.5);
                if (typeof applyDmg === 'function') applyDmg(target, dmg);
                addLog(`🔥 Pajé-Açu: empurrão + colisão! (${dmg} dano = +50%)`);
            }
        }
    };

    // ---- 12. NEGRINHO — Cruz + cura ----
    STORY_HERO_PA['negrinho_cruz_cura'] = {
        desc: 'Cruz a partir do boss. Dano PA. Cura 5 HP em aliados + em si.',
        execute: async (active, target, totalAtk) => {
            if (!target || target.dead) return;

            const tiles = getTilesInCross(target.x, target.y);

            // Cruz de luz
            tiles.forEach((t, i) => {
                setTimeout(() => {
                    if (typeof spawnFxAt === 'function') {
                        spawnFxAt('impact', 'fx-impact', t.x, t.y, { duration: 500, scale: 0.7 });
                    }
                }, i * 30);
            });

            convertTiles(tiles, 'AGUA');
            await sleep(500);

            // Dano
            if (typeof applyDmg === 'function') applyDmg(target, totalAtk);

            // Cura 5 HP no herói + aliados na área
            const allPlayers = (typeof players !== 'undefined') ? players : [active];
            allPlayers.forEach(p => {
                if (p.dead) return;
                const idx = p.y * 8 + p.x;
                if (tiles.some(t => t.idx === idx)) {
                    p.hp = Math.min(p.maxHp, p.hp + 5);
                    if (typeof showHealEffect === 'function') showHealEffect(p.x, p.y, 5);
                }
            });
            addLog(`💧 Negrinho: cruz + cura 5 HP! (${totalAtk} dano)`);
        }
    };

    console.log(`[V9.4] ${Object.keys(STORY_HERO_PA).length} PAs registrados.`);
    console.log('✅ [V9.4] Parte 1 instalada (12 heróis + PAs).');
})();
// =================================================================
// historia.js — BLOCO 12 (V9.4) — Parte 2
// -----------------------------------------------------------------
// Cole NO FINAL de historia.js, depois do Bloco 11.
//
// Contém:
//   1. Modo de seleção do Curupira (botão "CHUVA DE FLECHAS")
//   2. Modo de seleção do Anhanga-Mirim (tiles amarelos + texto)
//   3. Desbloqueio por zerar dificuldade
//   4. Sistema de raridade na OCA (bordas 1-5 estrelas)
//   5. CSS completo
// =================================================================

(function installNovosHeroisParte2() {
    if (window._storyHeroisV94Parte2) return;
    window._storyHeroisV94Parte2 = true;

    // ==============================================================
    // 1. MODO DE SELEÇÃO DO CURUPIRA
    // ==============================================================
    window._curupiraSelecting = false;
    window._curupiraSelectedTiles = [];

    function curupiraStartSelection() {
        const arTiles = [];
        grid.forEach((el, idx) => {
            if (el === 'AR') arTiles.push({ x: idx % 8, y: Math.floor(idx / 8), idx });
        });

        if (arTiles.length === 0) {
            showToast('🏹', 'Nenhum tile AR no tabuleiro!', '🏹');
            return;
        }

        if (arTiles.length <= 10) {
            // Auto-seleciona todos
            window._curupiraSelectedTiles = arTiles.slice();
            curupiraConfirmSelection();
            return;
        }

        // Modo manual
        window._curupiraSelecting = true;
        window._curupiraSelectedTiles = [];

        // Destaca tiles AR
        arTiles.forEach(t => {
            const el = document.querySelectorAll('#grid .tile')[t.idx];
            if (el) el.classList.add('curupira-eligible');
        });

        // Mostra barra de seleção
        curupiraShowBar();
        addLog(`🏹 Curupira: clique em até 10 tiles AR (0/10 selecionados)`);
    }

    function curupiraShowBar() {
        let bar = document.getElementById('curupiraBar');
        if (bar) bar.remove();

        bar = document.createElement('div');
        bar.id = 'curupiraBar';
        bar.className = 'curupira-bar';
        bar.innerHTML = `
            <span class="curupira-bar-icon">🏹</span>
            <span class="curupira-bar-text">
                CHUVA DE FLECHAS: selecione até 10 tiles AR
                <b id="curupiraCount">0/10</b>
            </span>
            <button class="curupira-bar-btn confirm" onclick="curupiraConfirmSelection()">CONFIRMAR</button>
            <button class="curupira-bar-btn cancel" onclick="curupiraCancelSelection()">CANCELAR</button>
        `;
        const main = document.querySelector('.game-main');
        if (main) main.parentNode.insertBefore(bar, main);
    }

    window.curupiraConfirmSelection = function() {
        if (!window._curupiraSelecting) return;

        const selected = window._curupiraSelectedTiles;
        if (selected.length === 0) {
            showToast('🏹', 'Selecione pelo menos 1 tile!', '🏹');
            return;
        }

        // Limpa UI
        document.querySelectorAll('.curupira-eligible, .curupira-selected')
            .forEach(el => el.classList.remove('curupira-eligible', 'curupira-selected'));
        const bar = document.getElementById('curupiraBar');
        if (bar) bar.remove();

        // Converte pra TERRA
        selected.forEach(t => {
            grid[t.idx] = 'TERRA';
            const el = document.querySelectorAll('#grid .tile')[t.idx];
            if (el) el.className = `tile bg-TERRA`;
        });

        // Flechas caindo
        selected.forEach((t, i) => {
            setTimeout(() => {
                if (typeof spawnFxAt === 'function') {
                    spawnFxAt('impact', 'fx-impact', t.x, t.y, { duration: 500, scale: 0.7 });
                }
            }, i * 60);
        });

        // Dano no boss
        const bossIdx = boss.y * 8 + boss.x;
        if (selected.some(t => t.idx === bossIdx)) {
            const active = players[currentPlayerIdx];
            const dmg = Math.floor((active.totalAtk || 3) * 2);
            if (typeof applyDmg === 'function') applyDmg(boss, dmg);
            addLog(`🏹 Curupira: CHUVA DE FLECHAS! Dano crítico ×2 (${dmg})`);
        } else {
            addLog(`🏹 Curupira: ${selected.length} tiles AR → TERRA`);
        }

        // Reset
        window._curupiraSelecting = false;
        window._curupiraSelectedTiles = [];
    };

    window.curupiraCancelSelection = function() {
        document.querySelectorAll('.curupira-eligible, .curupira-selected')
            .forEach(el => el.classList.remove('curupira-eligible', 'curupira-selected'));
        const bar = document.getElementById('curupiraBar');
        if (bar) bar.remove();
        window._curupiraSelecting = false;
        window._curupiraSelectedTiles = [];
        addLog(`🏹 Curupira: seleção cancelada.`);
    };

    // Hook no clique de tile para seleção do Curupira
    function curupiraHandleClick(idx) {
        const el = document.querySelectorAll('#grid .tile')[idx];
        if (!el || !el.classList.contains('curupira-eligible')) return false;

        const pos = window._curupiraSelectedTiles.findIndex(t => t.idx === idx);
        if (pos >= 0) {
            // Desmarca
            window._curupiraSelectedTiles.splice(pos, 1);
            el.classList.remove('curupira-selected');
        } else {
            // Marca (se < 10)
            if (window._curupiraSelectedTiles.length >= 10) {
                showToast('🏹', 'Máximo de 10 tiles!', '🏹');
                return true;
            }
            window._curupiraSelectedTiles.push({ x: idx % 8, y: Math.floor(idx / 8), idx });
            el.classList.add('curupira-selected');
        }

        const count = document.getElementById('curupiraCount');
        if (count) count.textContent = `${window._curupiraSelectedTiles.length}/10`;

        return true;
    }

    // ==============================================================
    // 2. MODO DE SELEÇÃO DO ANHANGA-MIRIM
    // ==============================================================
    window._anhangaSelecting = false;

    function anhangaStartSelection() {
        const arTiles = [];
        grid.forEach((el, idx) => {
            if (el === 'AR') arTiles.push({ x: idx % 8, y: Math.floor(idx / 8), idx });
        });

        if (arTiles.length === 0) {
            showToast('⚡', 'Nenhum tile AR no tabuleiro!', '⚡');
            return;
        }

        window._anhangaSelecting = true;

        // Destaca tiles AR
        arTiles.forEach(t => {
            const el = document.querySelectorAll('#grid .tile')[t.idx];
            if (el) el.classList.add('anhanga-eligible');
        });

        // Barra de instrução
        let bar = document.getElementById('anhangaBar');
        if (bar) bar.remove();
        bar = document.createElement('div');
        bar.id = 'anhangaBar';
        bar.className = 'anhanga-bar';
        bar.innerHTML = `
            <span class="anhanga-bar-icon">⚡</span>
            <span class="anhanga-bar-text">Clique em um tile AR para invocar o raio</span>
            <button class="anhanga-bar-btn cancel" onclick="anhangaCancelSelection()">CANCELAR</button>
        `;
        const main = document.querySelector('.game-main');
        if (main) main.parentNode.insertBefore(bar, main);
    }

    function anhangaHandleClick(idx) {
        const el = document.querySelectorAll('#grid .tile')[idx];
        if (!el || !el.classList.contains('anhanga-eligible')) return false;

        const x = idx % 8, y = Math.floor(idx / 8);

        // Limpa UI
        document.querySelectorAll('.anhanga-eligible').forEach(e => e.classList.remove('anhanga-eligible'));
        const bar = document.getElementById('anhangaBar');
        if (bar) bar.remove();
        window._anhangaSelecting = false;

        // Raio na cruz
        const tiles = [];
        for (let i = 0; i < 8; i++) {
            if (!tiles.some(t => t.idx === i * 8 + x)) tiles.push({ x, y: i, idx: i * 8 + x });
            if (!tiles.some(t => t.idx === y * 8 + i)) tiles.push({ x: i, y, idx: y * 8 + i });
        }

        // Visual
        if (typeof spawnFxAt === 'function') {
            spawnFxAt('impact', 'fx-impact', x, y, { duration: 800, scale: 1.5 });
        }

        // Converte
        tiles.forEach(t => {
            grid[t.idx] = 'AR';
            const e = document.querySelectorAll('#grid .tile')[t.idx];
            if (e) e.className = `tile bg-AR`;
        });

        // Dano 150%
        const active = players[currentPlayerIdx];
        const dmg = Math.floor((active.totalAtk || 3) * 1.5);
        if (typeof applyDmg === 'function') applyDmg(boss, dmg);
        addLog(`⚡ Anhanga-Mirim: RAIO! ${dmg} dano (150%) na cruz (${x},${y})`);

        return true;
    }

    window.anhangaCancelSelection = function() {
        document.querySelectorAll('.anhanga-eligible').forEach(e => e.classList.remove('anhanga-eligible'));
        const bar = document.getElementById('anhangaBar');
        if (bar) bar.remove();
        window._anhangaSelecting = false;
        addLog(`⚡ Anhanga-Mirim: seleção cancelada.`);
    };

    // ==============================================================
    // 3. HOOK NO handleSelect — interceptar seleção
    // ==============================================================
    const _origHandleSelectV94 = window.handleSelect;
    if (typeof _origHandleSelectV94 === 'function') {
        window.handleSelect = function(idx) {
            if (window._curupiraSelecting) {
                if (curupiraHandleClick(idx)) return;
            }
            if (window._anhangaSelecting) {
                if (anhangaHandleClick(idx)) return;
            }
            return _origHandleSelectV94.apply(this, arguments);
        };
    }

    // ==============================================================
    // 4. HOOK NO triggerBravelyChain — interceptar PA do Curupira/Anhanga
    // ==============================================================
    const _origBravelyV94 = window.triggerBravelyChain;
    if (typeof _origBravelyV94 === 'function') {
        window.triggerBravelyChain = async function(active, target, totalAtk) {
            if (!window._storyMode) return _origBravelyV94.apply(this, arguments);

            const heroData = STORY_HERO_CLASSES[active.class];
            if (!heroData) return _origBravelyV94.apply(this, arguments);

            // Curupira → ativa seleção em vez de PA direto
            if (heroData.paKey === 'curupira_chuva_flechas') {
                if (typeof showPoderAncestralEffect === 'function') showPoderAncestralEffect();
                await sleep(300);
                try { playSfx('skill1'); } catch(e) {}
                curupiraStartSelection();
                return;
            }

            // Anhanga-Mirim → ativa seleção
            if (heroData.paKey === 'anhanga_mirim_raio') {
                if (typeof showPoderAncestralEffect === 'function') showPoderAncestralEffect();
                await sleep(300);
                try { playSfx('skill1'); } catch(e) {}
                anhangaStartSelection();
                return;
            }

            // Outros → comportamento normal
            return _origBravelyV94.apply(this, arguments);
        };
    }

    // ==============================================================
    // 5. DESBLOQUEIO POR ZERAR DIFICULDADE
    // ==============================================================
    const HEROIS_POR_ZERAR = {
        'Curupira': { difficulty: 'normal', label: 'Zerar o Normal' },
        'Kianumanka-Manã': { difficulty: 'dificil', label: 'Zerar o Difícil' },
        'Anhanga-Mirim': { difficulty: 'pesadelo', label: 'Zerar o Pesadelo' },
    };

    function checkHeroisPorZerar() {
        const cleared = STORY_PROGRESS.clearedDifficulties || [];
        let unlockedAny = false;

        Object.keys(HEROIS_POR_ZERAR).forEach(heroClass => {
            const req = HEROIS_POR_ZERAR[heroClass];
            if (cleared.includes(req.difficulty)) {
                if (!STORY_PROGRESS.unlockedHeroesStory.includes(heroClass)) {
                    STORY_PROGRESS.unlockedHeroesStory.push(heroClass);
                    unlockedAny = true;
                    showToast(
                        '🏅 HERÓI LENDÁRIO!',
                        `${heroClass} desbloqueado (${req.label})`,
                        '🏅'
                    );
                    try { playSfx('win'); } catch(e) {}
                }
            }
        });

        if (unlockedAny) saveStoryProgress();
    }

    // Hook no showStoryVictoryScreen (detecta final boss)
    const _origVictoryV94 = window.showStoryVictoryScreen;
    if (typeof _origVictoryV94 === 'function') {
        window.showStoryVictoryScreen = function(phase, drops, rewards, meta) {
            if (phase && phase.isFinalBoss) {
                setTimeout(() => checkHeroisPorZerar(), 500);
            }
            return _origVictoryV94.apply(this, arguments);
        };
    }

    // Também roda ao carregar (caso o save já tenha zerado)
    setTimeout(() => checkHeroisPorZerar(), 1000);

    // ==============================================================
    // 6. DESBLOQUEIO POR ESTRELAS (extensão do sistema existente)
    // ==============================================================
    // O checkHeroUnlocks original já existe. Vamos estendê-lo
    // para considerar heróis com unlockReq do tipo 'stars'.
    const _origCheckUnlocksV94 = window.checkHeroUnlocks;
    if (typeof _origCheckUnlocksV94 === 'function') {
        window.checkHeroUnlocks = function() {
            const result = _origCheckUnlocksV94.apply(this, arguments);

            // Extensão: heróis com unlockReq.stars
            let unlockedAny = false;
            const starsPorDiff = {
                normal: getStarsPorDiff('normal'),
                dificil: getStarsPorDiff('dificil'),
                pesadelo: getStarsPorDiff('pesadelo'),
            };

            Object.values(STORY_HERO_CLASSES).forEach(hero => {
                if (!hero.unlockReq || hero.unlockReq.type !== 'stars') return;
                if (STORY_PROGRESS.unlockedHeroesStory.includes(hero.className)) return;

                const diff = hero.unlockReq.difficulty || 'normal';
                const stars = starsPorDiff[diff] || 0;

                if (stars >= hero.starsNeeded) {
                    STORY_PROGRESS.unlockedHeroesStory.push(hero.className);
                    unlockedAny = true;
                    showToast('🏅 HERÓI DESBLOQUEADO!', hero.displayName, '🏅');
                    try { playSfx('win'); } catch(e) {}
                }
            });

            if (unlockedAny) saveStoryProgress();
            return result;
        };
    }

    function getStarsPorDiff(diffId) {
        const d = STORY_PROGRESS.difficultyProgress?.[diffId];
        if (!d || !d.stars) return 0;
        return Object.values(d.stars).reduce((a, b) => a + b, 0);
    }

    // ==============================================================
    // 7. SISTEMA DE RARIDADE NA OCA
    // ==============================================================
    // Cada herói tem `rarity` (1-5). A OCA mostra bordas coloridas.

    window.getHeroRarity = function(heroClass) {
        const h = STORY_HERO_CLASSES[heroClass];
        if (!h) return 1;
        return h.rarity || (h.starsNeeded === 0 ? 1 : h.starsNeeded < 100 ? 2 : 3);
    };

    window.getRarityStars = function(rarity) {
        return '⭐'.repeat(rarity);
    };

    window.getRarityLabel = function(rarity) {
        return ['', 'Comum', 'Raro', 'Épico', 'Mítico', 'Divino'][rarity] || 'Comum';
    };

    // ==============================================================
    // 8. CSS
    // ==============================================================
    if (!document.getElementById('novosHeroisV94Style')) {
        const style = document.createElement('style');
        style.id = 'novosHeroisV94Style';
        style.textContent = `
            /* ========== BARRA DO CURUPIRA ========== */
            .curupira-bar {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 20px;
                margin: 0 15px 10px;
                background:
                    linear-gradient(180deg, rgba(39, 174, 96, 0.2), transparent 60%),
                    linear-gradient(135deg, rgba(42, 69, 32, 0.9), rgba(26, 47, 20, 0.9));
                border: 2px solid #6ba35c;
                border-radius: 8px;
                font-family: 'Cinzel', serif;
                color: #d0f0c0;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                animation: pulseCurupira 1.5s ease-in-out infinite alternate;
                flex-wrap: wrap;
            }
            @keyframes pulseCurupira {
                from { box-shadow: 0 4px 15px rgba(0,0,0,0.5), 0 0 10px rgba(107,163,92,0.3); }
                to   { box-shadow: 0 4px 15px rgba(0,0,0,0.5), 0 0 25px rgba(107,163,92,0.7); }
            }
            .curupira-bar-icon { font-size: 1.5rem; }
            .curupira-bar-text {
                flex: 1;
                font-size: 0.9rem;
                letter-spacing: 1px;
                font-weight: 700;
            }
            .curupira-bar-text b {
                color: #e8b923;
                margin-left: 8px;
                font-size: 1rem;
            }
            .curupira-bar-btn {
                padding: 8px 16px;
                border-radius: 4px;
                font-family: 'Cinzel', serif;
                font-weight: 700;
                font-size: 0.8rem;
                letter-spacing: 1px;
                cursor: pointer;
                transition: all 0.2s;
                border: 2px solid;
            }
            .curupira-bar-btn.confirm {
                background: linear-gradient(135deg, #4a7040, #2a4520);
                color: #e0f0d0;
                border-color: #6ba35c;
            }
            .curupira-bar-btn.confirm:hover {
                box-shadow: 0 0 15px rgba(107,163,92,0.6);
            }
            .curupira-bar-btn.cancel {
                background: linear-gradient(135deg, #6a2020, #3a1010);
                color: #f5c8c8;
                border-color: #a83232;
            }

            /* Tiles elegíveis do Curupira */
            .curupira-eligible {
                box-shadow: inset 0 0 0 2px rgba(107, 163, 92, 0.8) !important;
                animation: curupiraPulse 1s ease-in-out infinite alternate;
                cursor: pointer !important;
            }
            @keyframes curupiraPulse {
                from { box-shadow: inset 0 0 0 2px rgba(107, 163, 92, 0.5); }
                to   { box-shadow: inset 0 0 0 3px rgba(107, 163, 92, 1), 0 0 10px rgba(107,163,92,0.5); }
            }
            .curupira-selected {
                box-shadow: inset 0 0 0 3px #e8b923, 0 0 15px rgba(232,185,35,0.7) !important;
                transform: scale(1.02);
                z-index: 5;
            }

            /* ========== BARRA DO ANHANGA ========== */
            .anhanga-bar {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 20px;
                margin: 0 15px 10px;
                background:
                    linear-gradient(180deg, rgba(241, 196, 15, 0.2), transparent 60%),
                    linear-gradient(135deg, rgba(69, 55, 20, 0.9), rgba(45, 35, 10, 0.9));
                border: 2px solid #f1c40f;
                border-radius: 8px;
                font-family: 'Cinzel', serif;
                color: #fff5dc;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5), 0 0 20px rgba(241,196,15,0.4);
                animation: pulseAnhanga 1.5s ease-in-out infinite alternate;
                flex-wrap: wrap;
            }
            @keyframes pulseAnhanga {
                from { box-shadow: 0 4px 15px rgba(0,0,0,0.5), 0 0 10px rgba(241,196,15,0.3); }
                to   { box-shadow: 0 4px 15px rgba(0,0,0,0.5), 0 0 30px rgba(241,196,15,0.8); }
            }
            .anhanga-bar-icon { font-size: 1.5rem; }
            .anhanga-bar-text {
                flex: 1;
                font-size: 0.95rem;
                letter-spacing: 1px;
                font-weight: 700;
            }
            .anhanga-bar-btn.cancel {
                padding: 8px 16px;
                background: linear-gradient(135deg, #6a2020, #3a1010);
                color: #f5c8c8;
                border: 2px solid #a83232;
                border-radius: 4px;
                font-family: 'Cinzel', serif;
                font-weight: 700;
                font-size: 0.8rem;
                cursor: pointer;
            }
            .anhanga-eligible {
                box-shadow: inset 0 0 0 2px rgba(241, 196, 15, 0.9), 0 0 12px rgba(241,196,15,0.6) !important;
                animation: anhangaPulse 0.8s ease-in-out infinite alternate;
                cursor: pointer !important;
            }
            @keyframes anhangaPulse {
                from { box-shadow: inset 0 0 0 2px rgba(241,196,15,0.5), 0 0 8px rgba(241,196,15,0.3); }
                to   { box-shadow: inset 0 0 0 3px rgba(241,196,15,1), 0 0 18px rgba(241,196,15,0.8); }
            }

            /* ========== RARIDADE DOS CARDS DA OCA ========== */
            .story-hero-card[data-rarity="1"] {
                border-color: #6a5024;
                box-shadow: 0 0 0 1px rgba(106, 80, 36, 0.4);
            }
            .story-hero-card[data-rarity="2"] {
                border-color: #a8b8c8;
                box-shadow: 0 0 0 2px rgba(168, 184, 200, 0.4), 0 0 15px rgba(168, 184, 200, 0.3);
            }
            .story-hero-card[data-rarity="3"] {
                border-color: #4a8cb5;
                box-shadow: 0 0 0 2px rgba(74, 140, 181, 0.5), 0 0 20px rgba(74, 140, 181, 0.4);
            }
            .story-hero-card[data-rarity="4"] {
                border-color: #8e44ad;
                background:
                    linear-gradient(180deg, rgba(142, 68, 173, 0.15), transparent 50%),
                    linear-gradient(180deg, rgba(42, 31, 16, 0.9), rgba(26, 18, 8, 0.9));
                box-shadow: 0 0 0 2px rgba(142, 68, 173, 0.6), 0 0 25px rgba(142, 68, 173, 0.5);
            }
            .story-hero-card[data-rarity="5"] {
                border-color: #e8b923;
                background:
                    radial-gradient(ellipse at top, rgba(232, 185, 35, 0.25), transparent 60%),
                    linear-gradient(180deg, rgba(58, 42, 24, 0.95), rgba(26, 18, 8, 0.95));
                box-shadow:
                    0 0 0 3px rgba(232, 185, 35, 0.7),
                    0 0 35px rgba(232, 185, 35, 0.6),
                    inset 0 0 20px rgba(232, 185, 35, 0.2);
                animation: divinoPulse 2s ease-in-out infinite alternate;
            }
            @keyframes divinoPulse {
                from {
                    box-shadow: 0 0 0 3px rgba(232,185,35,0.6), 0 0 30px rgba(232,185,35,0.4);
                }
                to {
                    box-shadow: 0 0 0 3px rgba(232,185,35,0.9), 0 0 50px rgba(232,185,35,0.8);
                }
            }

            /* Badge de raridade */
            .hero-rarity-badge {
                position: absolute;
                top: 8px;
                right: 8px;
                display: inline-flex;
                align-items: center;
                gap: 2px;
                padding: 3px 8px;
                border-radius: 12px;
                font-family: 'Cinzel', serif;
                font-size: 0.7rem;
                font-weight: 700;
                letter-spacing: 1px;
                z-index: 5;
            }
            .hero-rarity-badge[data-rarity="1"] {
                background: rgba(106, 80, 36, 0.4);
                color: #c8b787;
                border: 1px solid #6a5024;
            }
            .hero-rarity-badge[data-rarity="2"] {
                background: rgba(168, 184, 200, 0.2);
                color: #d0d8e0;
                border: 1px solid #a8b8c8;
            }
            .hero-rarity-badge[data-rarity="3"] {
                background: rgba(74, 140, 181, 0.3);
                color: #a0d0f0;
                border: 1px solid #4a8cb5;
            }
            .hero-rarity-badge[data-rarity="4"] {
                background: rgba(142, 68, 173, 0.4);
                color: #e0c8f0;
                border: 1px solid #8e44ad;
            }
            .hero-rarity-badge[data-rarity="5"] {
                background: rgba(232, 185, 35, 0.3);
                color: #fff5dc;
                border: 1px solid #e8b923;
                box-shadow: 0 0 12px rgba(232,185,35,0.5);
            }
        `;
        document.head.appendChild(style);
    }

    // ==============================================================
    // 9. PATCH NA OCA — adicionar data-rarity + badge
    // ==============================================================
    // Sobrescreve renderOcaScreenFiltered (do Bloco 7) para incluir
    // o atributo data-rarity e o badge visual.
    const _origOcaV94 = window.renderOcaScreenFiltered;
    if (typeof _origOcaV94 === 'function') {
        window.renderOcaScreenFiltered = function() {
            const result = _origOcaV94.apply(this, arguments);

            // Pós-processa os cards para adicionar raridade
            setTimeout(() => {
                document.querySelectorAll('.story-hero-card').forEach(card => {
                    const onclickAttr = card.getAttribute('onclick') || '';
                    const match = onclickAttr.match(/toggleHeroSelection\('((?:\\'|[^'])*)'\)/);
                    if (!match) return;
                    const heroClass = match[1].replace(/\\'/g, "'");
                    const rarity = getHeroRarity(heroClass);

                    card.setAttribute('data-rarity', rarity);
                    if (!card.querySelector('.hero-rarity-badge')) {
                        const badge = document.createElement('div');
                        badge.className = 'hero-rarity-badge';
                        badge.setAttribute('data-rarity', rarity);
                        badge.innerHTML = '⭐'.repeat(rarity);
                        badge.title = getRarityLabel(rarity);
                        card.appendChild(badge);
                    }
                });
            }, 100);

            return result;
        };
    }

    // ==============================================================
    // 10. DEBUG
    // ==============================================================
    window.testNovosHerois = function() {
        console.group('🦸 HERÓIS V9.4');
        console.log('Total STORY_HERO_CLASSES:', Object.keys(STORY_HERO_CLASSES).length);
        console.log('Total PAs:', Object.keys(STORY_HERO_PA || {}).length);
        console.log('Desbloqueados:', STORY_PROGRESS.unlockedHeroesStory);
        console.log('Por zerar:');
        Object.keys(HEROIS_POR_ZERAR).forEach(h => {
            const req = HEROIS_POR_ZERAR[h];
            const ok = (STORY_PROGRESS.clearedDifficulties || []).includes(req.difficulty);
            console.log(`  ${h}: ${ok ? '✅' : '🔒'} (${req.label})`);
        });
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V9.4] Parte 2 instalada');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Modo de seleção: Curupira + Anhanga-Mirim');
    console.log('• Desbloqueio por zerar dificuldade');
    console.log('• Desbloqueio por estrelas (por dificuldade)');
    console.log('• Sistema de raridade na OCA (1-5 ⭐)');
    console.log('• CSS completo');
    console.log('');
    console.log('💡 Debug: window.testNovosHerois()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
