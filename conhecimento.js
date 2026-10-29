// =================================================================
// conhecimento.js — V1.0 — Sistema de Conhecimento dos Inimigos
// -----------------------------------------------------------------
// • Info 1: 100% (silenciosa) na 1ª vitória
// • Info 2: 15% por vitória (após Info 1)
// • Info 3: 5% por vitória (após Info 2)
// • Info 3 ativa:
//     ✓ Material dropado ×2 (chance intacta)
//     ✓ Essências Ancestral/Sombria ×2
//     ✓ +10% XP e ouro na fase (se o BOSS da fase é dominado)
// • Split de revelação: 1=stats · 2=skills+mini-grid · 3=drops+chances
// • Migration: enemiesDefeatedIds → Info 1 (retroativo grátis)
// • Badge "🧠 DOMINADO" no bestiário
// =================================================================
(function conhecimentoSistemaV1() {
    if (window._conhecimentoV1) return;
    window._conhecimentoV1 = true;

    // ─────────────────────────────────────────────────────────────
    // CONFIG
    // ─────────────────────────────────────────────────────────────
    const CHANCE_INFO2 = 0.15;
    const CHANCE_INFO3 = 0.05;
    const BONUS_XP_OURO_PCT = 0.10;
    const BONUS_MATERIAL_MULT = 2;
    const BONUS_ESSENCIA_MULT = 2;

    // ─────────────────────────────────────────────────────────────
    // PERSISTÊNCIA
    // ─────────────────────────────────────────────────────────────
    function garantirEstrutura() {
        if (!STORY_PROGRESS.knowledge || typeof STORY_PROGRESS.knowledge !== 'object') {
            STORY_PROGRESS.knowledge = {};
        }
    }
    function getInfo(id) {
        garantirEstrutura();
        return STORY_PROGRESS.knowledge[id] || 0;
    }
    function setInfo(id, lvl) {
        garantirEstrutura();
        const antes = STORY_PROGRESS.knowledge[id] || 0;
        STORY_PROGRESS.knowledge[id] = Math.max(antes, lvl);
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
    }
    function isDominado(id) { return getInfo(id) >= 3; }

    // ─────────────────────────────────────────────────────────────
    // MIGRAÇÃO RETROATIVA
    // ─────────────────────────────────────────────────────────────
    function migrar() {
        garantirEstrutura();
        const todos = new Set([
            ...(STORY_PROGRESS.enemiesDefeatedIds || []),
            ...(STORY_PROGRESS.bossesDefeated || []),
        ]);
        let mudou = false;
        todos.forEach(id => {
            if (getInfo(id) < 1) {
                STORY_PROGRESS.knowledge[id] = 1;
                mudou = true;
            }
        });
        if (mudou && typeof saveStoryProgress === 'function') saveStoryProgress();
        console.log(`[conhecimento] Migração: ${todos.size} inimigos → Info 1`);
    }

    // ─────────────────────────────────────────────────────────────
    // ROLL
    // ─────────────────────────────────────────────────────────────
    function tryUpgradeInfo(enemyId) {
        const atual = getInfo(enemyId);
        if (atual === 0) {
            setInfo(enemyId, 1);
            return { nivel: 1, mudou: true };
        }
        if (atual === 1 && Math.random() < CHANCE_INFO2) {
            setInfo(enemyId, 2);
            return { nivel: 2, mudou: true };
        }
        if (atual === 2 && Math.random() < CHANCE_INFO3) {
            setInfo(enemyId, 3);
            return { nivel: 3, mudou: true };
        }
        return { nivel: atual, mudou: false };
    }

    // ─────────────────────────────────────────────────────────────
    // HOOK: handleStoryBossDefeat
    //   • Captura estado ANTES (info 3? essências?)
    //   • Roll de info APÓS (drop desta kill já foi normal)
    //   • Dobra essências se já era Info 3
    // ─────────────────────────────────────────────────────────────
    const _origDefeat = window.handleStoryBossDefeat;
    if (typeof _origDefeat === 'function') {
        window.handleStoryBossDefeat = async function() {
            const enemyId = (typeof storyEnemiesRemaining !== 'undefined' && storyEnemiesRemaining[0]) || null;
            if (!enemyId) return _origDefeat.apply(this, arguments);

            const eraInfo3 = isDominado(enemyId);
            const essAncBefore = STORY_PROGRESS.inventory?.essencia_ancestral || 0;
            const essSomBefore = STORY_PROGRESS.inventory?.essencia_sombria || 0;

            const r = await _origDefeat.apply(this, arguments);

            // Roll de info (silencioso para nível 1)
            try {
                const upgrade = tryUpgradeInfo(enemyId);
                if (upgrade.mudou && upgrade.nivel >= 2) {
                    const enemy = STORY_ENEMIES[enemyId];
                    const nome = enemy?.name || enemyId;
                    if (typeof addLog === 'function') {
                        addLog(upgrade.nivel === 3
                            ? `🧠 ${nome}: DOMINADO! Drops dobrados da próxima vez.`
                            : `📖 ${nome}: Conhecimento Nível 2!`);
                    }
                    if (upgrade.nivel === 3 && typeof playSfx === 'function') {
                        try { playSfx('purificacao'); } catch(e) {}
                    }
                    if (!window._infoDropsPendentes) window._infoDropsPendentes = [];
                    window._infoDropsPendentes.push({ enemyId, nivel: upgrade.nivel });
                }
            } catch(e) { console.warn('[conhecimento] roll falhou:', e); }

            // Dobrar essências se já era Info 3 antes da kill
            if (eraInfo3) {
                try {
                    const essAncAfter = STORY_PROGRESS.inventory?.essencia_ancestral || 0;
                    const essSomAfter = STORY_PROGRESS.inventory?.essencia_sombria || 0;
                    const dAnc = essAncAfter - essAncBefore;
                    const dSom = essSomAfter - essSomBefore;
                    if (dAnc > 0) {
                        STORY_PROGRESS.inventory.essencia_ancestral = essAncAfter + dAnc;
                        if (typeof addLog === 'function') addLog(`🧠 Essências Ancestrais dobradas (+${dAnc})!`);
                    }
                    if (dSom > 0) {
                        STORY_PROGRESS.inventory.essencia_sombria = essSomAfter + dSom;
                        if (typeof addLog === 'function') addLog(`🧠 Essências Sombrias dobradas (+${dSom})!`);
                    }
                    if (dAnc > 0 || dSom > 0) {
                        if (typeof saveStoryProgress === 'function') saveStoryProgress();
                    }
                } catch(e) { console.warn('[conhecimento] dobro essência falhou:', e); }
            }

            return r;
        };
    }

    // ─────────────────────────────────────────────────────────────
    // HOOK: rollStoryDrops — material ×2 se dominado
    // ─────────────────────────────────────────────────────────────
    const _origRoll = window.rollStoryDrops;
    if (typeof _origRoll === 'function') {
        window.rollStoryDrops = function(enemyId) {
            const drops = _origRoll.apply(this, arguments);
            if (isDominado(enemyId) && Array.isArray(drops)) {
                drops.forEach(d => { if (d.qty) d.qty *= BONUS_MATERIAL_MULT; });
            }
            return drops;
        };
    }

    // ─────────────────────────────────────────────────────────────
    // HOOK: handleStoryPhaseVictory — +10% XP/ouro
    // (fases normais: último inimigo = boss da fase)
    // ─────────────────────────────────────────────────────────────
    const _origVictory = window.handleStoryPhaseVictory;
    if (typeof _origVictory === 'function') {
        window.handleStoryPhaseVictory = function(phase, drops, finalScore, rankSnapshot) {
            if (phase && Array.isArray(phase.enemies) && phase.enemies.length > 0 && phase.reward) {
                const lastEnemy = phase.enemies[phase.enemies.length - 1];
                if (isDominado(lastEnemy)) {
                    const clone = Object.assign({}, phase, {
                        reward: Object.assign({}, phase.reward, {
                            xp: Math.floor((phase.reward.xp || 0) * (1 + BONUS_XP_OURO_PCT)),
                            gold: Math.floor((phase.reward.gold || 0) * (1 + BONUS_XP_OURO_PCT)),
                        })
                    });
                    return _origVictory.call(this, clone, drops, finalScore, rankSnapshot);
                }
            }
            return _origVictory.apply(this, arguments);
        };
    }

    // ─────────────────────────────────────────────────────────────
    // HOOK: eventoFinalizarPartida — +10% XP/ouro (Selados)
    // (Nações não dão XP/ouro hoje — hook é inócuo pra elas)
    // ─────────────────────────────────────────────────────────────
    const _origFin = window.eventoFinalizarPartida;
    if (typeof _origFin === 'function') {
        window.eventoFinalizarPartida = async function(vitoria, saindo) {
            if (!vitoria || saindo) return _origFin.apply(this, arguments);

            const bossId = window._eventoBatalha?.bossId;
            const dominado = bossId && isDominado(bossId);

            const xpBefore = STORY_PROGRESS.totalXP || 0;
            const goldBefore = STORY_PROGRESS.gold || 0;

            const r = await _origFin.apply(this, arguments);

            if (dominado) {
                const xpDepois = STORY_PROGRESS.totalXP || 0;
                const goldDepois = STORY_PROGRESS.gold || 0;
                const dXp = xpDepois - xpBefore;
                const dGold = goldDepois - goldBefore;
                if (dXp > 0) {
                    const bonus = Math.floor(dXp * BONUS_XP_OURO_PCT);
                    STORY_PROGRESS.totalXP = xpDepois + bonus;
                }
                if (dGold > 0) {
                    const bonus = Math.floor(dGold * BONUS_XP_OURO_PCT);
                    STORY_PROGRESS.gold = goldDepois + bonus;
                }
                if (dXp > 0 || dGold > 0) {
                    if (typeof saveStoryProgress === 'function') saveStoryProgress();
                }
            }
            return r;
        };
    }

    // ─────────────────────────────────────────────────────────────
    // POPUP: chips no card de vitória
    // ─────────────────────────────────────────────────────────────
    const _origScreen = window.showStoryVictoryScreen;
    if (typeof _origScreen === 'function') {
        window.showStoryVictoryScreen = function(phase, drops, rewards, meta) {
            const r = _origScreen.apply(this, arguments);
            const pendentes = window._infoDropsPendentes || [];
            window._infoDropsPendentes = [];
            if (pendentes.length > 0) {
                setTimeout(() => _injetarChipsInfo(pendentes), 180);
                setTimeout(() => _injetarChipsInfo(pendentes), 500);
            }
            return r;
        };
    }

    function _injetarChipsInfo(pendentes) {
        const overlay = document.getElementById('storyVictoryOverlay');
        if (!overlay) return;
        const body = overlay.querySelector('.story-result-body');
        if (!body) return;

        body.querySelectorAll('.conhecimento-section').forEach(el => el.remove());

        const chips = pendentes.map(p => {
            const enemy = STORY_ENEMIES[p.enemyId];
            const nome = enemy?.name || p.enemyId;
            const isDom = p.nivel === 3;
            return `<div class="conhecimento-chip ${isDom?'dominado':''}">
                <div class="conhecimento-chip-icon">${isDom ? '🧠' : '📖'}</div>
                <div class="conhecimento-chip-name">${nome}</div>
                <div class="conhecimento-chip-nivel">${isDom ? 'DOMINADO' : `Nível ${p.nivel}`}</div>
            </div>`;
        }).join('');

        const section = document.createElement('div');
        section.className = 'conhecimento-section';
        section.innerHTML = `
            <div class="conhecimento-title">🧠 CONHECIMENTO</div>
            <div class="conhecimento-grid">${chips}</div>
        `;

        const actions = body.querySelector('.story-result-actions');
        if (actions) body.insertBefore(section, actions);
        else body.appendChild(section);
    }

    // ─────────────────────────────────────────────────────────────
    // RESET ao iniciar batalha
    // ─────────────────────────────────────────────────────────────
    const _origInit = window.initStoryBattle;
    if (typeof _origInit === 'function') {
        window.initStoryBattle = async function() {
            window._infoDropsPendentes = [];
            return _origInit.apply(this, arguments);
        };
    }

    // ─────────────────────────────────────────────────────────────
    // BESTIÁRIO — gating visual + badge
    // ─────────────────────────────────────────────────────────────
    const _origBest = window.renderBestiaryScreen;
    if (typeof _origBest === 'function') {
        window.renderBestiaryScreen = function() {
            const r = _origBest.apply(this, arguments);
            setTimeout(_aplicarGatingBestiario, 100);
            setTimeout(_aplicarGatingBestiario, 400);
            return r;
        };
    }

    function _aplicarGatingBestiario() {
        document.querySelectorAll('.bestiary-card').forEach(card => {
            const nameEl = card.querySelector('.bestiary-card-name');
            if (!nameEl) return;
            const nome = nameEl.textContent.trim();
            if (!nome || nome === '???') return;

            let enemyId = null;
            for (const id in STORY_ENEMIES) {
                if (STORY_ENEMIES[id].name === nome) { enemyId = id; break; }
            }
            if (!enemyId) return;

            const lvl = getInfo(enemyId);

            if (lvl < 2) {
                card.querySelectorAll('.bestiary-skills').forEach(el => el.style.display = 'none');
            }
            if (lvl < 3) {
                card.querySelectorAll('.bestiary-card-section').forEach(sec => {
                    const t = sec.textContent || '';
                    if (t.includes('DROPS') || t.includes('💎') || t.includes('APARECE')) {
                        sec.style.display = 'none';
                    }
                });
            }

            let badge = card.querySelector('.conhecimento-nivel-badge');
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'conhecimento-nivel-badge';
                card.insertBefore(badge, card.firstChild);
            }
            if (lvl >= 3) {
                badge.textContent = '🧠 DOMINADO';
                badge.classList.add('dominado');
            } else {
                badge.textContent = `📖 Nível ${lvl}`;
                badge.classList.remove('dominado');
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    // CSS
    // ─────────────────────────────────────────────────────────────
    if (!document.getElementById('conhecimentoCSS')) {
        const st = document.createElement('style');
        st.id = 'conhecimentoCSS';
        st.textContent = `
            .conhecimento-section {
                width: 100%;
                margin: 12px 0;
                padding: 14px 16px;
                background:
                    linear-gradient(180deg, rgba(142,68,173,0.15), transparent 60%),
                    rgba(10,6,2,0.4);
                border: 2px solid rgba(142,68,173,0.5);
                border-radius: 8px;
                box-shadow: 0 0 20px rgba(142,68,173,0.25);
            }
            .conhecimento-title {
                font-family: 'Cinzel', serif;
                color: #c39bd3;
                font-size: 0.85rem;
                letter-spacing: 2px;
                text-align: center;
                margin-bottom: 12px;
                text-shadow: 0 0 8px rgba(142,68,173,0.6);
            }
            .conhecimento-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                justify-content: center;
            }
            .conhecimento-chip {
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: 100px;
                padding: 10px 12px;
                background: rgba(10,6,2,0.6);
                border: 1px solid rgba(142,68,173,0.4);
                border-radius: 6px;
                transition: all 0.2s;
            }
            .conhecimento-chip:hover {
                transform: translateY(-2px);
                border-color: #c39bd3;
                box-shadow: 0 4px 12px rgba(142,68,173,0.3);
            }
            .conhecimento-chip.dominado {
                border-color: #e8b923;
                background: linear-gradient(180deg, rgba(232,185,35,0.15), transparent 60%), rgba(10,6,2,0.6);
                box-shadow: 0 0 15px rgba(232,185,35,0.4);
            }
            .conhecimento-chip-icon {
                font-size: 2rem;
                line-height: 1;
                margin-bottom: 6px;
                filter: drop-shadow(0 0 6px rgba(142,68,173,0.6));
            }
            .conhecimento-chip.dominado .conhecimento-chip-icon {
                filter: drop-shadow(0 0 10px rgba(232,185,35,0.9));
            }
            .conhecimento-chip-name {
                font-family: 'EB Garamond', serif;
                color: #d9c89a;
                font-size: 0.85rem;
                text-align: center;
                line-height: 1.2;
                margin-bottom: 4px;
            }
            .conhecimento-chip-nivel {
                font-family: 'Cinzel', serif;
                color: #c39bd3;
                font-weight: 700;
                font-size: 0.75rem;
                letter-spacing: 1px;
            }
            .conhecimento-chip.dominado .conhecimento-chip-nivel {
                color: #e8b923;
            }
            .conhecimento-nivel-badge {
                display: inline-block;
                padding: 3px 10px;
                background: rgba(142,68,173,0.15);
                border: 1px solid rgba(142,68,173,0.4);
                border-radius: 12px;
                font-family: 'Cinzel', serif;
                font-size: 0.7rem;
                font-weight: 700;
                color: #c39bd3;
                letter-spacing: 1px;
                margin-bottom: 8px;
            }
            .conhecimento-nivel-badge.dominado {
                background: linear-gradient(180deg, rgba(232,185,35,0.25), transparent 60%);
                border-color: #e8b923;
                color: #fff5dc;
                box-shadow: 0 0 12px rgba(232,185,35,0.5);
            }
        `;
        document.head.appendChild(st);
    }

    // ─────────────────────────────────────────────────────────────
    // DEBUG
    // ─────────────────────────────────────────────────────────────
    window._debugConhecimento = function() {
        console.group('=== CONHECIMENTO ===');
        const k = STORY_PROGRESS.knowledge || {};
        const lv1 = Object.values(k).filter(v => v === 1).length;
        const lv2 = Object.values(k).filter(v => v === 2).length;
        const lv3 = Object.values(k).filter(v => v === 3).length;
        console.log(`Info 1: ${lv1} | Info 2: ${lv2} | Info 3 (dominados): ${lv3}`);
        console.log('Total registrado:', Object.keys(k).length, '/', Object.keys(STORY_ENEMIES).length);
        console.log('');
        console.log('Detalhes:');
        Object.keys(k).forEach(id => {
            const enemy = STORY_ENEMIES[id];
            console.log(`  ${enemy?.name || id} → Nível ${k[id]}`);
        });
        console.groupEnd();
    };

    window._forcarInfo = function(enemyId, nivel) {
        if (!STORY_ENEMIES[enemyId]) {
            console.warn('Inimigo não existe:', enemyId);
            return;
        }
        garantirEstrutura();
        STORY_PROGRESS.knowledge[enemyId] = Math.max(0, Math.min(3, nivel));
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        console.log(`✅ ${STORY_ENEMIES[enemyId].name} → Nível ${nivel}`);
    };

    window._forcarInfoTodos = function(nivel) {
        garantirEstrutura();
        const lvl = Math.max(0, Math.min(3, nivel || 3));
        Object.keys(STORY_ENEMIES).forEach(id => {
            STORY_PROGRESS.knowledge[id] = lvl;
        });
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        console.log(`✅ ${Object.keys(STORY_ENEMIES).length} inimigos → Nível ${lvl}`);
    };

    window._resetConhecimento = function() {
        STORY_PROGRESS.knowledge = {};
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        console.log('🧠 Conhecimento resetado (migração re-adicionará Info 1 na próxima vitória)');
    };

    // ─────────────────────────────────────────────────────────────
    // INICIALIZAÇÃO
    // ─────────────────────────────────────────────────────────────
    setTimeout(migrar, 600);
    setTimeout(migrar, 2500);

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [conhecimento.js V1.0] carregado');
    console.log('═══════════════════════════════════════════════════');
    console.log('📖 Info 1: 100% (silenciosa) · rekill não repete');
    console.log('📖 Info 2: 15% por vitória');
    console.log('🧠 Info 3: 5% por vitória');
    console.log('');
    console.log('Ao dominar (Info 3):');
    console.log('  • Material dropado ×2 (chance intacta)');
    console.log('  • Essências Ancestral/Sombria ×2');
    console.log('  • +10% XP/ouro (se o BOSS da fase é dominado)');
    console.log('');
    console.log('💡 Debug:');
    console.log('  window._debugConhecimento()             → ver todos');
    console.log('  window._forcarInfo("saci", 3)           → forçar 1 inimigo');
    console.log('  window._forcarInfoTodos(3)              → todos dominados');
    console.log('  window._resetConhecimento()             → resetar');
    console.log('═══════════════════════════════════════════════════');
})();