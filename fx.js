// =================================================================
// fx.js — V1.0 (Efeitos cinematográficos v2)
// -----------------------------------------------------------------
// Carregado DEPOIS de historia.js (hooks dependem dele).
// Cada feature tem flag própria em window.FX_FEATURES.
// Ajustes de intensidade em window.FX_CONFIG.
//
// Desligar um efeito:
//   window._fxToggle('shake')          // alterna
//   window._fxToggle('shake', false)   // força off
//   window._fxToggle('shake', true)    // força on
// =================================================================

// =================================================================
// CONFIG — mexa AQUI pra ajustar intensidades
// =================================================================
window.FX_CONFIG = {
    // Hit-stop (congelamento em impacto forte)
    HITSTOP_THRESHOLD: 8,       // dano mínimo pra congelar
    HITSTOP_DURATION: 90,       // ms de congelamento

    // Screen shake
    SHAKE_LIGHT_THRESHOLD: 4,   // dano que aciona shake leve
    SHAKE_STRONG_THRESHOLD: 8,  // dano que aciona shake forte
    SHAKE_LIGHT: 3,             // px de deslocamento (leve)
    SHAKE_STRONG: 6,            // px de deslocamento (forte)
    SHAKE_DURATION: 180,        // ms

    // Boss flinch
    FLINCH_THRESHOLD: 3,        // dano mínimo pra boss recuar

    // Partículas
    PARTICLES_PER_HIT: 7,       // por impacto em herói
    PARTICLES_PER_BOSS_HIT: 9,  // por impacto no boss

    // Flash de elemento
    FLASH_DURATION: 400,        // ms
    FLASH_OPACITY: 0.15,        // 0-1

    // Nome da skill
    SKILLNAME_DURATION: 900,    // ms
};

// =================================================================
// FLAGS — controle por efeito
// =================================================================
window.FX_FEATURES = {
    shake: true,
    particles: true,
    elementTint: true,
    hitStop: true,
    bossFlinch: true,
    skillName: true,
    spriteGlow: true,
};

// =================================================================
// MÓDULO
// =================================================================
(function fxV1() {
    if (window._fxV1) return;
    window._fxV1 = true;

    // =============================================================
    // CSS
    // =============================================================
    if (!document.getElementById('fxV1CSS')) {
        const style = document.createElement('style');
        style.id = 'fxV1CSS';
        style.textContent = `
            /* ============ HIT-STOP ============ */
            #board.fx2-hitstop .token img,
            #board.fx2-hitstop .story-fx,
            #board.fx2-hitstop [class*="fx-"],
            #board.fx2-hitstop .purificacao-particula,
            #board.fx2-hitstop .dmg-float {
                animation-play-state: paused !important;
            }

            /* ============ SCREEN SHAKE ============ */
            #board.fx2-shake {
                animation: fx2Shake 0.18s ease-out;
            }
            @keyframes fx2Shake {
                0%   { transform: translate(0, 0); }
                20%  { transform: translate(calc(var(--fx2-shake-intensity, 4px) * -1), calc(var(--fx2-shake-intensity, 4px) * 0.4)); }
                40%  { transform: translate(var(--fx2-shake-intensity, 4px), calc(var(--fx2-shake-intensity, 4px) * -0.4)); }
                60%  { transform: translate(calc(var(--fx2-shake-intensity, 4px) * -0.5), var(--fx2-shake-intensity, 4px)); }
                80%  { transform: translate(calc(var(--fx2-shake-intensity, 4px) * 0.5), calc(var(--fx2-shake-intensity, 4px) * -0.5)); }
                100% { transform: translate(0, 0); }
            }

            /* ============ ELEMENT FLASH ============ */
            .fx2-elem-flash {
                position: absolute;
                inset: 0;
                pointer-events: none;
                z-index: 5;
                border-radius: 6px;
                animation: fx2ElemFlash 0.4s ease-out forwards;
            }
            @keyframes fx2ElemFlash {
                0%   { opacity: 0; }
                15%  { opacity: 1; }
                100% { opacity: 0; }
            }
            .fx2-elem-flash.fx2-elem-fogo  { background: radial-gradient(ellipse at center, rgba(231,76,60,0.45) 0%, rgba(231,76,60,0.15) 60%, transparent 100%); }
            .fx2-elem-flash.fx2-elem-agua  { background: radial-gradient(ellipse at center, rgba(52,152,219,0.45) 0%, rgba(52,152,219,0.15) 60%, transparent 100%); }
            .fx2-elem-flash.fx2-elem-terra { background: radial-gradient(ellipse at center, rgba(39,174,96,0.45) 0%, rgba(39,174,96,0.15) 60%, transparent 100%); }
            .fx2-elem-flash.fx2-elem-ar    { background: radial-gradient(ellipse at center, rgba(241,196,15,0.45) 0%, rgba(241,196,15,0.15) 60%, transparent 100%); }

            /* ============ PARTÍCULAS ============ */
            .fx2-particle {
                position: absolute;
                width: 6px;
                height: 6px;
                border-radius: 50%;
                pointer-events: none;
                z-index: 65;
                transform: translate(-50%, -50%);
                animation: fx2Particle 0.7s ease-out forwards;
                box-shadow: 0 0 6px currentColor, 0 0 12px currentColor;
                will-change: transform, opacity;
            }
            @keyframes fx2Particle {
                0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
                20%  { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                100% { opacity: 0; transform: translate(calc(-50% + var(--fx-dx, 0px)), calc(-50% + var(--fx-dy, 0px))) scale(0.4); }
            }

            /* ============ BOSS FLINCH ============ */
            #tokenBoss.fx2-boss-flinch {
                animation: fx2BossFlinch 0.18s ease-out;
            }
            @keyframes fx2BossFlinch {
                0%   { transform: translate(0, 0) scale(1); filter: brightness(1); }
                30%  { transform: translate(-3px, 1px) scale(1.06); filter: brightness(2.2) saturate(1.6); }
                60%  { transform: translate(2px, -1px) scale(0.97); filter: brightness(1.5); }
                100% { transform: translate(0, 0) scale(1); filter: brightness(1); }
            }

            /* ============ SKILL NAME ============ */
            .fx2-skill-name {
                position: absolute;
                top: 65px;
                left: 50%;
                transform: translateX(-50%) translateY(-20px);
                padding: 7px 22px;
                background: linear-gradient(180deg, rgba(42,20,20,0.95), rgba(20,8,8,0.95));
                border: 2px solid #a83232;
                border-radius: 8px;
                font-family: 'Cinzel Decorative', serif;
                font-size: 1rem;
                font-weight: 900;
                letter-spacing: 3px;
                color: #f5c8c8;
                text-shadow: 0 0 12px rgba(168,50,50,0.9), 0 2px 4px rgba(0,0,0,0.9);
                z-index: 1600;
                pointer-events: none;
                white-space: nowrap;
                opacity: 0;
                animation: fx2SkillName 0.9s ease-out forwards;
                box-shadow: 0 4px 20px rgba(0,0,0,0.7), 0 0 24px currentColor;
            }
            @keyframes fx2SkillName {
                0%   { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.85); }
                20%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.06); }
                80%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-15px) scale(0.95); }
            }
            .fx2-skill-name.fx2-elem-fogo  { border-color: #e74c3c; color: #ffd0d0; text-shadow: 0 0 14px rgba(231,76,60,1), 0 2px 4px rgba(0,0,0,0.9); }
            .fx2-skill-name.fx2-elem-agua  { border-color: #3498db; color: #d0e8ff; text-shadow: 0 0 14px rgba(52,152,219,1), 0 2px 4px rgba(0,0,0,0.9); }
            .fx2-skill-name.fx2-elem-terra { border-color: #27ae60; color: #d0ffd8; text-shadow: 0 0 14px rgba(39,174,96,1), 0 2px 4px rgba(0,0,0,0.9); }
            .fx2-skill-name.fx2-elem-ar    { border-color: #f1c40f; color: #fff5d0; text-shadow: 0 0 14px rgba(241,196,15,1), 0 2px 4px rgba(0,0,0,0.9); }

            /* ============ SPRITE GLOW ============ */
            .fx2-sprite-glow {
                filter:
                    drop-shadow(0 0 6px var(--fx2-glow-color, #e8b835))
                    drop-shadow(0 0 14px var(--fx2-glow-color, #e8b835));
            }

            /* ============ BOSS DEATH (efeito extra) ============ */
            #board.fx2-boss-death {
                animation: fx2BossDeath 0.6s ease-out;
            }
            @keyframes fx2BossDeath {
                0%   { filter: brightness(1); }
                30%  { filter: brightness(2) contrast(1.4) saturate(1.5); }
                100% { filter: brightness(1); }
            }

            @media (max-width: 600px) {
                .fx2-skill-name { font-size: 0.75rem; padding: 5px 14px; letter-spacing: 2px; }
                .fx2-particle { width: 4px; height: 4px; }
            }
        `;
        document.head.appendChild(style);
    }

    // =============================================================
    // HELPERS
    // =============================================================
    const ELEMENT_COLORS = {
        FOGO:  { particle: '#ff5c46', flash: 'rgba(231,76,60,0.45)' },
        AGUA:  { particle: '#4aa8f0', flash: 'rgba(52,152,219,0.45)' },
        TERRA: { particle: '#4fc772', flash: 'rgba(39,174,96,0.45)' },
        AR:    { particle: '#f5d040', flash: 'rgba(241,196,15,0.45)' },
    };

    const BOSS_ELEMENT = {
        BOITATA: 'FOGO', MULA: 'FOGO', GUARACI: 'FOGO',
        IARA: 'AGUA', BOTO: 'AGUA',
        MAPINGUARI: 'TERRA', CORPOSECO: 'TERRA', BOI: 'TERRA',
        SACI: 'AR', JACI: 'AR', LOBISOMEM: 'AR', CUCA: 'AGUA',
        ANHANGA: 'FOGO',
    };

    function getBossElement() {
        if (typeof boss === 'undefined' || !boss) return 'FOGO';
        return BOSS_ELEMENT[boss.type] || 'FOGO';
    }

    function getAttackerElement() {
        if (typeof players === 'undefined' || !Array.isArray(players)) return 'FOGO';
        if (typeof currentPlayerIdx === 'undefined') return 'FOGO';
        const p = players[currentPlayerIdx];
        return p?.element || 'FOGO';
    }

    // =============================================================
    // EFEITOS
    // =============================================================
    let _shakeTimer = null;
    let _hitStopTimer = null;

    function fxShake(intensity, duration) {
        if (!window.FX_FEATURES.shake) return;
        const board = document.getElementById('board');
        if (!board) return;
        board.style.setProperty('--fx2-shake-intensity', (intensity || 4) + 'px');
        board.classList.remove('fx2-shake');
        void board.offsetWidth;
        board.classList.add('fx2-shake');
        if (_shakeTimer) clearTimeout(_shakeTimer);
        _shakeTimer = setTimeout(
            () => board.classList.remove('fx2-shake'),
            duration || window.FX_CONFIG.SHAKE_DURATION
        );
    }

    function fxElementFlash(element) {
        if (!window.FX_FEATURES.elementTint) return;
        const board = document.getElementById('board');
        if (!board) return;
        const el = document.createElement('div');
        el.className = 'fx2-elem-flash fx2-elem-' + (element || 'fogo').toLowerCase();
        board.appendChild(el);
        setTimeout(() => el.remove(), window.FX_CONFIG.FLASH_DURATION + 50);
    }

    function fxParticles(x, y, element, count) {
        if (!window.FX_FEATURES.particles) return;
        const board = document.getElementById('board');
        if (!board) return;
        const s = (typeof getStep === 'function') ? getStep() : 59;
        const px = x * s + s / 2 + 8;
        const py = y * s + s / 2 + 8;
        const color = (ELEMENT_COLORS[element] || ELEMENT_COLORS.FOGO).particle;
        const n = count || window.FX_CONFIG.PARTICLES_PER_HIT;

        for (let i = 0; i < n; i++) {
            const p = document.createElement('div');
            p.className = 'fx2-particle';
            const angle = (i / n) * Math.PI * 2 + Math.random() * 0.6;
            const dist = 25 + Math.random() * 40;
            p.style.left = px + 'px';
            p.style.top = py + 'px';
            p.style.background = color;
            p.style.color = color;
            p.style.setProperty('--fx-dx', (Math.cos(angle) * dist).toFixed(1) + 'px');
            p.style.setProperty('--fx-dy', (Math.sin(angle) * dist).toFixed(1) + 'px');
            p.style.animationDelay = (Math.random() * 80).toFixed(0) + 'ms';
            board.appendChild(p);
            setTimeout(() => p.remove(), 900);
        }
    }

    function fxHitStop(duration) {
        if (!window.FX_FEATURES.hitStop) return;
        const board = document.getElementById('board');
        if (!board) return;
        board.classList.add('fx2-hitstop');
        if (_hitStopTimer) clearTimeout(_hitStopTimer);
        _hitStopTimer = setTimeout(
            () => board.classList.remove('fx2-hitstop'),
            duration || window.FX_CONFIG.HITSTOP_DURATION
        );
    }

    function fxBossFlinch() {
        if (!window.FX_FEATURES.bossFlinch) return;
        const tok = document.getElementById('tokenBoss');
        if (!tok) return;
        tok.classList.remove('fx2-boss-flinch');
        void tok.offsetWidth;
        tok.classList.add('fx2-boss-flinch');
        setTimeout(() => tok.classList.remove('fx2-boss-flinch'), 200);
    }

    function fxShowSkillName(name, element) {
        if (!window.FX_FEATURES.skillName) return;
        const board = document.getElementById('board');
        if (!board || !name) return;
        const old = document.getElementById('fx2-skill-name');
        if (old) old.remove();
        const el = document.createElement('div');
        el.id = 'fx2-skill-name';
        el.className = 'fx2-skill-name fx2-elem-' + (element || 'fogo').toLowerCase();
        el.textContent = name;
        board.appendChild(el);
        setTimeout(() => el.remove(), window.FX_CONFIG.SKILLNAME_DURATION + 100);
    }

    // =============================================================
    // HOOKS
    // =============================================================

    // 1. applyDmg — efeitos de impacto
    const _origApplyDmg = window.applyDmg;
    if (typeof _origApplyDmg === 'function' && !_origApplyDmg._fxV1) {
        window.applyDmg = function(target, amount) {
            const isBoss = (target === (typeof boss !== 'undefined' ? boss : null));
            const isPlayer = target && typeof players !== 'undefined'
                             && Array.isArray(players) && players.includes(target);

            if (amount > 0) {
                if (isBoss) {
                    const elem = getAttackerElement();

                    if (amount >= (window.FX_CONFIG.FLINCH_THRESHOLD || 3)) {
                        fxBossFlinch();
                    }

                    if (amount >= (window.FX_CONFIG.SHAKE_STRONG_THRESHOLD || 8)) {
                        fxShake(window.FX_CONFIG.SHAKE_STRONG, window.FX_CONFIG.SHAKE_DURATION);
                        fxHitStop(window.FX_CONFIG.HITSTOP_DURATION);
                    } else if (amount >= (window.FX_CONFIG.SHAKE_LIGHT_THRESHOLD || 4)) {
                        fxShake(window.FX_CONFIG.SHAKE_LIGHT, window.FX_CONFIG.SHAKE_DURATION);
                    }

                    fxParticles(target.x, target.y, elem,
                        window.FX_CONFIG.PARTICLES_PER_BOSS_HIT || 9);
                }
                else if (isPlayer) {
                    const elem = getBossElement();
                    if (amount >= 5) {
                        fxShake(window.FX_CONFIG.SHAKE_LIGHT, window.FX_CONFIG.SHAKE_DURATION);
                    }
                    fxParticles(target.x, target.y, elem,
                        window.FX_CONFIG.PARTICLES_PER_HIT || 7);
                }
            }

            return _origApplyDmg.apply(this, arguments);
        };
        window.applyDmg._fxV1 = true;
        console.log('[fx V1.0] applyDmg hookado.');
    }

    // 2. applyStorySkill — nome da skill + flash
    const _origApplySkill = window.applyStorySkill;
    if (typeof _origApplySkill === 'function' && !_origApplySkill._fxV1) {
        window.applyStorySkill = async function(enemy, skill) {
            if (skill && window.FX_FEATURES.skillName) {
                const name = skill.name || skill.handler || 'SKILL';
                const elem = getBossElement();
                fxShowSkillName(name, elem);
                fxElementFlash(elem);
            }
            return _origApplySkill.apply(this, arguments);
        };
        window.applyStorySkill._fxV1 = true;
        console.log('[fx V1.0] applyStorySkill hookado.');
    }

    // 3. spawnFxAt — glow colorido por elemento
    const _origSpawnFxAt = window.spawnFxAt;
    if (typeof _origSpawnFxAt === 'function' && !_origSpawnFxAt._fxV1) {
        window.spawnFxAt = function(fxKey, cssClass, x, y, opts) {
            const el = _origSpawnFxAt.apply(this, arguments);
            if (el && el.classList && window.FX_FEATURES.spriteGlow) {
                const elem = getBossElement();
                const color = (ELEMENT_COLORS[elem] || ELEMENT_COLORS.FOGO).particle;
                el.style.setProperty('--fx2-glow-color', color);
                el.classList.add('fx2-sprite-glow');
            }
            return el;
        };
        window.spawnFxAt._fxV1 = true;
        console.log('[fx V1.0] spawnFxAt hookado.');
    }

    // 4. handleStoryBossDefeat — flash dramático na morte
    const _origDefeat = window.handleStoryBossDefeat;
    if (typeof _origDefeat === 'function' && !_origDefeat._fxV1) {
        const _innerDefeat = _origDefeat;
        window.handleStoryBossDefeat = async function() {
            // Flash dramático (sem hit-stop pra não travar a purificação)
            const board = document.getElementById('board');
            if (board) {
                board.classList.remove('fx2-boss-death');
                void board.offsetWidth;
                board.classList.add('fx2-boss-death');
                setTimeout(() => board.classList.remove('fx2-boss-death'), 700);
            }
            if (typeof boss !== 'undefined' && boss) {
                fxParticles(boss.x, boss.y, getBossElement(), 14);
                fxShake(4, 300);
            }
            return _innerDefeat.apply(this, arguments);
        };
        window.handleStoryBossDefeat._fxV1 = true;
        console.log('[fx V1.0] handleStoryBossDefeat hookado.');
    }

    // =============================================================
    // DEBUG / TOGGLE
    // =============================================================
    window._fxDebug = function() {
        console.log('═══ [fx V1.0] ═══');
        console.log('Features:', window.FX_FEATURES);
        console.log('Config:', window.FX_CONFIG);
        console.log('Boss element:', getBossElement());
        console.log('Attacker element:', getAttackerElement());
        console.log('Hooks:');
        console.log('  applyDmg:', !!window.applyDmg._fxV1);
        console.log('  applyStorySkill:', !!window.applyStorySkill._fxV1);
        console.log('  spawnFxAt:', !!window.spawnFxAt._fxV1);
        console.log('  handleStoryBossDefeat:', !!window.handleStoryBossDefeat._fxV1);
        console.log('════════════════════');
    };

    window._fxToggle = function(feature, value) {
        if (!(feature in window.FX_FEATURES)) {
            console.warn('[fx] Feature desconhecida:', feature);
            console.log('Disponíveis:', Object.keys(window.FX_FEATURES));
            return;
        }
        window.FX_FEATURES[feature] = (typeof value === 'boolean') ? value : !window.FX_FEATURES[feature];
        console.log(`[fx] ${feature} = ${window.FX_FEATURES[feature]}`);
    };

    window._fxKillAll = function() {
        Object.keys(window.FX_FEATURES).forEach(k => window.FX_FEATURES[k] = false);
        console.log('[fx] Todos os efeitos desligados.');
    };

    window._fxReviveAll = function() {
        Object.keys(window.FX_FEATURES).forEach(k => window.FX_FEATURES[k] = true);
        console.log('[fx] Todos os efeitos religados.');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [fx.js V1.0] Efeitos cinematográficos');
    console.log('═══════════════════════════════════════════════════');
    console.log('Features:');
    console.log('  • Hit-stop em dano ≥', window.FX_CONFIG.HITSTOP_THRESHOLD);
    console.log('  • Screen shake (leve ≥' + window.FX_CONFIG.SHAKE_LIGHT_THRESHOLD + ', forte ≥' + window.FX_CONFIG.SHAKE_STRONG_THRESHOLD + ')');
    console.log('  • Flash de elemento no board');
    console.log('  • Partículas de impacto coloridas');
    console.log('  • Boss flinch ao levar dano ≥', window.FX_CONFIG.FLINCH_THRESHOLD);
    console.log('  • Nome da skill do boss no topo');
    console.log('  • Glow colorido nos FX sprites');
    console.log('  • Flash dramático na morte do boss');
    console.log('');
    console.log('💡 Debug:');
    console.log('   window._fxDebug()            → estado completo');
    console.log('   window._fxToggle("shake")    → liga/desliga');
    console.log('   window._fxKillAll()          → desliga tudo');
    console.log('   window._fxReviveAll()        → religa tudo');
    console.log('   window.FX_CONFIG.SHAKE_STRONG = 8  → ajusta intensidade');
    console.log('═══════════════════════════════════════════════════');
})();