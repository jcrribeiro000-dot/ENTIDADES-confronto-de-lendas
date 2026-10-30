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
// =================================================================
// nacoes.js — V3.0 — BESTIÁRIO UNIFICADO
// -----------------------------------------------------------------
// • Deduplica STORY_ENEMIES + EVENTO_BOSSES (Sete Selados)
// • Containers de nação (nacao_tainos, nacao_pesadelo...) ignorados
// • 21 deuses das Nações em categoria própria
// • Filtros: origem · tipo · ato · conhecimento (0/1/2/3) · busca
// =================================================================
(function bestiarioV3() {
    if (window._bestiarioV3) return;
    window._bestiarioV3 = true;

    // ─────────────────────────────────────────────────────────────
    // ESTADO DOS FILTROS
    // ─────────────────────────────────────────────────────────────
    function getFilters() {
        if (!window._bestiaryFilters) {
            window._bestiaryFilters = {
                origem: 'todos',
                tipo: 'todos',
                ato: 'todos',
                conhecimento: 'todos',
                busca: '',
            };
        }
        return window._bestiaryFilters;
    }

    // ─────────────────────────────────────────────────────────────
    // CLASSIFICAÇÃO
    // ─────────────────────────────────────────────────────────────
    function isNacaoDeus(id) {
        return !!id && id.startsWith('nacao_') &&
            typeof NACAO_DEUSES !== 'undefined' && !!NACAO_DEUSES[id];
    }

    function isNacaoContainer(id) {
        return !!id && id.startsWith('nacao_') &&
            !(typeof NACAO_DEUSES !== 'undefined' && NACAO_DEUSES[id]);
    }

    function getOrigem(id) {
        if (isNacaoContainer(id)) return 'container';
        if (isNacaoDeus(id)) return 'nacoes';
        if (typeof EVENTO_BOSSES !== 'undefined' &&
            EVENTO_BOSSES[id] && !id.startsWith('nacao_')) return 'selados';
        if (id === 'pesadelo') return 'selados';
        return 'historia';
    }

    function getTipo(id) {
        if (typeof getEnemyType === 'function') {
            try { return getEnemyType(id); } catch (e) {}
        }
        const e = (typeof STORY_ENEMIES !== 'undefined') ? STORY_ENEMIES[id] : null;
        if (!e) return 'boss';
        if (e.isFinalBoss) return 'final';
        if (e.isBoss)      return 'boss';
        if (e.isMiniBoss)  return 'miniboss';
        if (e.isSpectral)  return 'espectral';
        return 'animal';
    }

    // ─────────────────────────────────────────────────────────────
    // DESCOBERTA / CONHECIMENTO
    // ─────────────────────────────────────────────────────────────
    function isDiscovered(id, origem) {
        if ((STORY_PROGRESS.enemiesDefeatedIds || []).includes(id)) return true;
        if ((STORY_PROGRESS.bossesDefeated    || []).includes(id)) return true;
        if (origem === 'selados' && typeof getEventoProgresso === 'function') {
            try {
                const prog = getEventoProgresso(id);
                if (prog && prog.fasesConcluidas && prog.fasesConcluidas.includes('boss')) return true;
            } catch (e) {}
        }
        return false;
    }

    function getConhecimento(id) {
        return (STORY_PROGRESS.knowledge && STORY_PROGRESS.knowledge[id]) || 0;
    }

    // ─────────────────────────────────────────────────────────────
    // LISTA UNIFICADA (deduplicada)
    // ─────────────────────────────────────────────────────────────
    function getAllEnemies() {
        const list = [];
        const seen = new Set();

        if (typeof STORY_ENEMIES !== 'undefined') {
            Object.keys(STORY_ENEMIES).forEach(id => {
                if (seen.has(id)) return;
                const origem = getOrigem(id);
                if (origem === 'container') return;
                seen.add(id);
                list.push(makeEntry(id, origem));
            });
        }

        if (typeof EVENTO_BOSSES !== 'undefined') {
            Object.values(EVENTO_BOSSES).forEach(b => {
                if (!b || !b.id) return;
                if (b.id.startsWith('nacao_')) return;
                if (seen.has(b.id)) return;
                seen.add(b.id);
                list.push(makeEntry(b.id, 'selados', b));
            });
        }

        if (typeof EVENTO_PESADELO !== 'undefined' &&
            EVENTO_PESADELO.id && !seen.has(EVENTO_PESADELO.id)) {
            seen.add(EVENTO_PESADELO.id);
            list.push(makeEntry(EVENTO_PESADELO.id, 'selados',
                Object.assign({}, EVENTO_PESADELO, { diaLabel: 'Mensal' })));
        }

        return list;
    }

    function makeEntry(id, origem, eventBossOverride) {
        const e  = (typeof STORY_ENEMIES !== 'undefined')  ? STORY_ENEMIES[id]  : null;
        const eb = eventBossOverride ||
                   ((typeof EVENTO_BOSSES !== 'undefined') ? EVENTO_BOSSES[id] : null);

        const nome = (e && (e.name || e.nome)) || (eb && eb.nome) || id;
        const hp   = (e && e.hp  != null) ? e.hp  : (eb && eb.hp);
        const atk  = (e && e.atk != null) ? e.atk : (eb && eb.atk);
        const tipo = getTipo(id);

        let ato = null, diaLabel = null, descricao = null, nacaoNome = null;

        if (origem === 'historia' && typeof getEnemyAtoFromId === 'function') {
            ato = getEnemyAtoFromId(id);
        }
        if (origem === 'selados' && eb) {
            diaLabel  = eb.diaLabel;
            descricao = eb.descricao;
        }
        if (origem === 'nacoes' &&
            typeof NACAO_DEUSES !== 'undefined' && NACAO_DEUSES[id]) {
            const d = NACAO_DEUSES[id];
            if (d.nacao && typeof NACOES !== 'undefined' && NACOES[d.nacao]) {
                nacaoNome = NACOES[d.nacao].nome;
            }
        }

        return {
            id, origem, nome, hp, atk, tipo,
            ato, diaLabel, descricao, nacaoNome,
            raw: e || eb || {},
            eventBoss: eb,
        };
    }

    // ─────────────────────────────────────────────────────────────
    // ORDEM DE APARIÇÃO (história)
    // ─────────────────────────────────────────────────────────────
    function buildOrdem() {
        const ord = {};
        let c = 0;
        if (typeof STORY_CHAPTERS !== 'undefined') {
            Object.keys(STORY_CHAPTERS)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .forEach(cid => {
                    const ch = STORY_CHAPTERS[cid];
                    (ch.phases || []).forEach(ph => {
                        (ph.enemies || []).forEach(eid => {
                            if (ord[eid] === undefined) ord[eid] = c++;
                        });
                    });
                });
        }
        return ord;
    }

    // ─────────────────────────────────────────────────────────────
    // FILTROS
    // ─────────────────────────────────────────────────────────────
    function normalize(s) {
        return String(s || '').toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function aplicarFiltros(lista, ordem) {
        const f = getFilters();
        let out = lista.slice();

        if (f.origem !== 'todos') out = out.filter(x => x.origem === f.origem);
        if (f.tipo   !== 'todos') out = out.filter(x => x.tipo   === f.tipo);
        if (f.ato    !== 'todos') out = out.filter(x =>
            x.origem === 'historia' && x.ato === parseInt(f.ato));
        if (f.conhecimento !== 'todos') {
            const k = parseInt(f.conhecimento);
            out = out.filter(x => getConhecimento(x.id) === k);
        }
        if (f.busca && f.busca.trim()) {
            const term = normalize(f.busca.trim());
            out = out.filter(x => normalize(x.nome).includes(term));
        }

        const peso = { historia: 0, selados: 1, nacoes: 2 };
        out.sort((a, b) => {
            const pa = peso[a.origem] != null ? peso[a.origem] : 99;
            const pb = peso[b.origem] != null ? peso[b.origem] : 99;
            if (pa !== pb) return pa - pb;

            if (a.origem === 'nacoes' && b.origem === 'nacoes') {
                const na = (a.raw && a.raw.nacao) || '';
                const nb = (b.raw && b.raw.nacao) || '';
                if (na !== nb) return na.localeCompare(nb);
                const listA = (NACOES && NACOES[na] && NACOES[na].deuses) || [];
                const listB = (NACOES && NACOES[nb] && NACOES[nb].deuses) || [];
                const idxA = listA.indexOf(a.id);
                const idxB = listB.indexOf(b.id);
                return idxA - idxB;
            }
            if (a.origem === 'selados' && b.origem === 'selados') {
                const ka = Object.keys(EVENTO_BOSSES || {}).indexOf(a.id);
                const kb = Object.keys(EVENTO_BOSSES || {}).indexOf(b.id);
                return ka - kb;
            }
            const oa = ordem[a.id] != null ? ordem[a.id] : 9999;
            const ob = ordem[b.id] != null ? ordem[b.id] : 9999;
            if (oa !== ob) return oa - ob;
            return a.nome.localeCompare(b.nome);
        });

        return out;
    }

    // ─────────────────────────────────────────────────────────────
    // SPRITE / EMOJI
    // ─────────────────────────────────────────────────────────────
    function getSprite(id) {
        let url = (typeof SPRITES_STORY !== 'undefined') ? SPRITES_STORY[id] : '';
        if (!url || url.trim() === '') {
            if (typeof STORY_TO_BASE_BOSS !== 'undefined') {
                const bk = STORY_TO_BASE_BOSS[id];
                if (bk && typeof SPRITES !== 'undefined' && SPRITES[bk]) url = SPRITES[bk];
            }
        }
        return url || '';
    }

    function getEmoji(id) {
        if (typeof EMOJI_STORY !== 'undefined' && EMOJI_STORY[id]) return EMOJI_STORY[id];
        if (window.NACAO_EMOJIS && window.NACAO_EMOJIS[id])         return window.NACAO_EMOJIS[id];
        return '?';
    }

    // ─────────────────────────────────────────────────────────────
    // SKILLS
    // ─────────────────────────────────────────────────────────────
    function getSkillsData(enemy) {
        const e  = enemy.raw || {};
        const eb = enemy.eventBoss;

        if (eb && Array.isArray(eb.skills) && eb.skills.length > 0) {
            return eb.skills.map(sk => ({
                nome: sk.nome || sk.name || '?',
                gridHTML: (typeof desenharMiniGridBestiario === 'function' && sk.handler)
                    ? desenharMiniGridBestiario(sk.handler) : '',
            }));
        }

        const arr = [];
        if (e.skill1) arr.push({
            nome: e.skill1.name || e.skill1.nome || 'Skill 1',
            gridHTML: (typeof getEnemySkillGrid === 'function')
                ? getEnemySkillGrid(enemy.id, 'skill1') : '',
        });
        if (e.skill2) arr.push({
            nome: e.skill2.name || e.skill2.nome || 'Skill 2',
            gridHTML: (typeof getEnemySkillGrid === 'function')
                ? getEnemySkillGrid(enemy.id, 'skill2') : '',
        });
        return arr;
    }

    // ─────────────────────────────────────────────────────────────
    // META
    // ─────────────────────────────────────────────────────────────
    function getMeta(enemy) {
        const tipoLabel = {
            animal:    'Animal',
            miniboss:  'Mini-Boss',
            boss:      'Boss',
            espectral: 'Espectro',
            final:     'BOSS FINAL',
        }[enemy.tipo] || '?';

        if (enemy.origem === 'historia')
            return 'Ato ' + (enemy.ato != null ? enemy.ato : '?') + ' · ' + tipoLabel;
        if (enemy.origem === 'selados')
            return '🌑 Sete Selados · ' + (enemy.diaLabel || 'Evento');
        if (enemy.origem === 'nacoes')
            return '🌎 ' + (enemy.nacaoNome || 'Nações');
        return tipoLabel;
    }

    // ─────────────────────────────────────────────────────────────
    // CARD
    // ─────────────────────────────────────────────────────────────
    function renderCard(enemy) {
        const disc   = isDiscovered(enemy.id, enemy.origem);
        const e      = enemy.raw || {};
        const sprite = getSprite(enemy.id);
        const emoji  = getEmoji(enemy.id);
        const hasSprite = sprite && sprite.trim() !== '';

        let imgHTML;
        if (!disc) {
            imgHTML = '<div class="bestiary-sprite bestiary-silhouette" style="display:flex;align-items:center;justify-content:center;font-size:3rem;">' + emoji + '</div>';
        } else if (hasSprite) {
            imgHTML = '<img src="' + sprite + '" class="bestiary-sprite" alt="' + enemy.nome + '">';
        } else if (enemy.origem === 'selados' && typeof eventoIcon === 'function') {
            try {
                imgHTML = '<div style="transform:scale(1.4);display:flex;align-items:center;justify-content:center;">' + eventoIcon(enemy.id, 'large') + '</div>';
            } catch (e2) {
                imgHTML = '<div class="bestiary-sprite" style="display:flex;align-items:center;justify-content:center;font-size:3rem;">' + emoji + '</div>';
            }
        } else {
            imgHTML = '<div class="bestiary-sprite" style="display:flex;align-items:center;justify-content:center;font-size:3rem;">' + emoji + '</div>';
        }

        const meta = getMeta(enemy);

        if (!disc) {
            return [
                '<div class="bestiary-card locked" data-enemy-id="' + enemy.id + '"',
                '     onclick="showToast(\'🔒 Selado\', \'Derrote este inimigo para desbloquear.\', \'🔒\')">',
                '  <div class="bestiary-card-header">',
                '    ' + imgHTML,
                '    <div class="bestiary-card-info">',
                '      <div class="bestiary-card-name">?????</div>',
                '      <div class="bestiary-card-meta">' + meta + '</div>',
                '    </div>',
                '  </div>',
                '  <div class="bestiary-card-locked">',
                '    <div class="bestiary-lock-icon">🔒</div>',
                '    <div class="bestiary-lock-text">Selado</div>',
                '  </div>',
                '</div>'
            ].join('\n');
        }

        const lore = (typeof STORY_ENEMY_LORE !== 'undefined' && STORY_ENEMY_LORE[enemy.id])
                   || enemy.descricao || e.descricao || '';

        const skills = getSkillsData(enemy);
        let skillsHTML = '';
        if (skills.length > 0) {
            skillsHTML = '<div class="bestiary-skills">' + skills.map(sk => (
                '<div class="bestiary-skill">' +
                    '<div class="bestiary-skill-header">' +
                        '<span class="bestiary-skill-name">' + sk.nome + '</span>' +
                    '</div>' +
                    '<div class="bestiary-skill-grid">' + sk.gridHTML + '</div>' +
                '</div>'
            )).join('') + '</div>';
        }

        let dropsHTML = '<span style="color:#8a7a52;font-style:italic;">Nenhum drop conhecido.</span>';
        if (enemy.origem === 'selados') {
            dropsHTML = '<span class="bestiary-drop">🗡️ Armas (5%-20%)</span>' +
                        '<span class="bestiary-drop bestiary-drop-raro">🧿 Fragmento (5%-20%)</span>';
        } else if (enemy.origem === 'nacoes') {
            dropsHTML = '<span class="bestiary-drop">🌎 Essência Ancestral</span>' +
                        '<span class="bestiary-drop bestiary-drop-raro">⚔️ Arma / 🧿 Amuleto (Fase 3)</span>';
        } else if (typeof STORY_DROP_TABLE !== 'undefined' && STORY_DROP_TABLE[enemy.id]) {
            const dt = STORY_DROP_TABLE[enemy.id];
            const list = [];
            if (dt.comum) {
                const m = (typeof STORY_MATERIALS !== 'undefined') ? STORY_MATERIALS[dt.comum.id] : null;
                if (m) list.push('<span class="bestiary-drop"><span>' + (m.emoji || '') + '</span> ' + m.name + ' <b>(' + dt.comum.chance + '%)</b></span>');
            }
            if (dt.raro) {
                const m = (typeof STORY_MATERIALS !== 'undefined') ? STORY_MATERIALS[dt.raro.id] : null;
                if (m) list.push('<span class="bestiary-drop bestiary-drop-raro"><span>' + (m.emoji || '') + '</span> ' + m.name + ' <b>(' + dt.raro.chance + '%)</b></span>');
            }
            if (list.length) dropsHTML = list.join('');
        }

        let fasesHTML = '<span style="color:#8a7a52;font-style:italic;">—</span>';
        if (enemy.origem === 'historia' && typeof STORY_CHAPTERS !== 'undefined') {
            const fases = [];
            Object.values(STORY_CHAPTERS).forEach(ch => {
                (ch.phases || []).forEach(ph => {
                    if (ph.enemies && ph.enemies.indexOf(enemy.id) !== -1) fases.push(ph.id);
                });
            });
            if (fases.length) fasesHTML = fases.map(f => '<span class="bestiary-fase">' + f + '</span>').join('');
        } else if (enemy.origem === 'selados') {
            fasesHTML = '<span class="bestiary-fase" style="color:#c39bd3;border-color:rgba(142,68,173,.5);background:rgba(142,68,173,.1);">' + (enemy.diaLabel || 'Evento') + '</span>';
        } else if (enemy.origem === 'nacoes' && enemy.nacaoNome) {
            fasesHTML = '<span class="bestiary-fase" style="color:#4a8cb5;border-color:rgba(74,140,181,.5);background:rgba(74,140,181,.1);">' + enemy.nacaoNome + '</span>';
        }

        const cls = [
            enemy.tipo === 'final'    ? 'bestiary-final'    : '',
            enemy.tipo === 'boss'     ? 'bestiary-boss'     : '',
            enemy.tipo === 'miniboss' ? 'bestiary-miniboss' : '',
        ].filter(Boolean).join(' ');

        return [
            '<div class="bestiary-card unlocked ' + cls + '" data-enemy-id="' + enemy.id + '">',
            '  <div class="bestiary-card-header">',
            '    ' + imgHTML,
            '    <div class="bestiary-card-info">',
            '      <div class="bestiary-card-name">' + enemy.nome + '</div>',
            '      <div class="bestiary-card-meta">' + meta + '</div>',
            '      <div class="bestiary-card-stats">',
            '        <span><b>HP</b> ' + (enemy.hp != null ? enemy.hp : '?') + '</span>',
            '        <span><b>ATK</b> ' + (enemy.atk != null ? enemy.atk : '?') + '</span>',
            '      </div>',
            '    </div>',
            '  </div>',
            lore ? ('  <div class="bestiary-card-lore">' + lore + '</div>') : '',
            '  ' + skillsHTML,
            '  <div class="bestiary-card-section">',
            '    <div class="bestiary-card-section-title">💎 Drops</div>',
            '    <div class="bestiary-drops">' + dropsHTML + '</div>',
            '  </div>',
            '  <div class="bestiary-card-section">',
            '    <div class="bestiary-card-section-title">📖 Aparece em</div>',
            '    <div class="bestiary-fases">' + fasesHTML + '</div>',
            '  </div>',
            '</div>'
        ].join('\n');
    }

    // ─────────────────────────────────────────────────────────────
    // RENDER PRINCIPAL
    // ─────────────────────────────────────────────────────────────
    window.renderBestiaryScreen = function() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;

        document.querySelectorAll('.bestiary-evento-header').forEach(el => el.remove());

        const f        = getFilters();
        const all      = getAllEnemies();
        const ordem    = buildOrdem();
        const filtered = aplicarFiltros(all, ordem);

        const stats = {
            historia:    all.filter(x => x.origem === 'historia').length,
            selados:     all.filter(x => x.origem === 'selados').length,
            nacoes:      all.filter(x => x.origem === 'nacoes').length,
            descobertos: all.filter(x => isDiscovered(x.id, x.origem)).length,
            total:       all.length,
        };

        let cardsHTML;
        if (filtered.length === 0) {
            cardsHTML = '<div style="text-align:center;padding:40px;color:#8a7a52;grid-column:1/-1;">Nenhum inimigo corresponde aos filtros.</div>';
        } else {
            cardsHTML = filtered.map(renderCard).join('');
        }

        const atosOptions = [];
        for (let i = 1; i <= 13; i++) {
            atosOptions.push('<option value="' + i + '" ' + (String(f.ato) === String(i) ? 'selected' : '') + '>Ato ' + i + '</option>');
        }

        const buscaEscapada = String(f.busca || '').replace(/"/g, '&quot;');

        screen.innerHTML = [
            '<div class="story-container">',
            '  <div class="story-header">',
            '    <h1 class="story-title">📖 BESTIÁRIO</h1>',
            '    <p class="story-subtitle">' + stats.descobertos + ' / ' + stats.total + ' inimigos descobertos · ' + filtered.length + ' exibidos</p>',
            '  </div>',
            '  <div class="bestiary-filters">',
            '    <input type="text" class="bestiary-filter bestiary-search"',
            '           placeholder="🔍 Pesquisar por nome..."',
            '           value="' + buscaEscapada + '"',
            '           oninput="window._setBestiaryFilter(\'busca\', this.value)">',
            '    <select class="bestiary-filter" onchange="window._setBestiaryFilter(\'origem\', this.value)">',
            '      <option value="todos"    ' + (f.origem === 'todos'    ? 'selected' : '') + '>📚 Todas as origens</option>',
            '      <option value="historia" ' + (f.origem === 'historia' ? 'selected' : '') + '>📖 História (' + stats.historia + ')</option>',
            '      <option value="selados"  ' + (f.origem === 'selados'  ? 'selected' : '') + '>🌑 Sete Selados (' + stats.selados + ')</option>',
            '      <option value="nacoes"   ' + (f.origem === 'nacoes'   ? 'selected' : '') + '>🌎 Sete Nações (' + stats.nacoes + ')</option>',
            '    </select>',
            '    <select class="bestiary-filter" onchange="window._setBestiaryFilter(\'ato\', this.value)">',
            '      <option value="todos" ' + (f.ato === 'todos' ? 'selected' : '') + '>Todos os Atos</option>',
            '      ' + atosOptions.join(''),
            '    </select>',
            '    <select class="bestiary-filter" onchange="window._setBestiaryFilter(\'tipo\', this.value)">',
            '      <option value="todos"    ' + (f.tipo === 'todos'    ? 'selected' : '') + '>Todos os Tipos</option>',
            '      <option value="animal"   ' + (f.tipo === 'animal'   ? 'selected' : '') + '>Animais</option>',
            '      <option value="miniboss" ' + (f.tipo === 'miniboss' ? 'selected' : '') + '>Mini-Bosses</option>',
            '      <option value="boss"     ' + (f.tipo === 'boss'     ? 'selected' : '') + '>Bosses</option>',
            '      <option value="espectral" ' + (f.tipo === 'espectral' ? 'selected' : '') + '>Espectros</option>',
            '      <option value="final"    ' + (f.tipo === 'final'    ? 'selected' : '') + '>Boss Final</option>',
            '    </select>',
            '    <select class="bestiary-filter" onchange="window._setBestiaryFilter(\'conhecimento\', this.value)">',
            '      <option value="todos" ' + (f.conhecimento === 'todos' ? 'selected' : '') + '>🧠 Todos os conhecimentos</option>',
            '      <option value="0" ' + (String(f.conhecimento) === '0' ? 'selected' : '') + '>📕 Desconhecido (0)</option>',
            '      <option value="1" ' + (String(f.conhecimento) === '1' ? 'selected' : '') + '>📖 Nível 1</option>',
            '      <option value="2" ' + (String(f.conhecimento) === '2' ? 'selected' : '') + '>📗 Nível 2</option>',
            '      <option value="3" ' + (String(f.conhecimento) === '3' ? 'selected' : '') + '>🧠 Dominado (3)</option>',
            '    </select>',
            '  </div>',
            '  <div class="bestiary-grid">' + cardsHTML + '</div>',
            '  <div class="story-footer">',
            '    <button class="story-back-btn" onclick="renderAldeiaScreen()">← VOLTAR À ALDEIA</button>',
            '  </div>',
            '</div>'
        ].join('\n');

        // Gating visual por conhecimento
        setTimeout(() => {
            document.querySelectorAll('.bestiary-card.unlocked').forEach(card => {
                const id = card.getAttribute('data-enemy-id');
                if (!id) return;
                const lvl = getConhecimento(id);

                if (lvl < 2) {
                    card.querySelectorAll('.bestiary-skills').forEach(el => { el.style.display = 'none'; });
                }
                if (lvl < 3) {
                    card.querySelectorAll('.bestiary-card-section').forEach(sec => {
                        const t = sec.textContent || '';
                        if (t.indexOf('DROPS') !== -1 || t.indexOf('💎') !== -1) sec.style.display = 'none';
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
                    badge.style.display = '';
                } else if (lvl >= 1) {
                    badge.textContent = '📖 Nível ' + lvl;
                    badge.classList.remove('dominado');
                    badge.style.display = '';
                } else {
                    badge.style.display = 'none';
                }
            });
        }, 80);
    };

    // ─────────────────────────────────────────────────────────────
    // SETTER DE FILTRO
    // ─────────────────────────────────────────────────────────────
    window._setBestiaryFilter = function(key, value) {
        const f = getFilters();
        f[key] = value;
        window.renderBestiaryScreen();
        if (key === 'busca') {
            setTimeout(() => {
                const input = document.querySelector('.bestiary-search');
                if (input) {
                    input.focus();
                    try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {}
                }
            }, 0);
        }
    };

    // ─────────────────────────────────────────────────────────────
    // CSS DO INPUT DE BUSCA
    // ─────────────────────────────────────────────────────────────
    if (!document.getElementById('bestiaryV3CSS')) {
        const st = document.createElement('style');
        st.id = 'bestiaryV3CSS';
        st.textContent = [
            '.bestiary-search {',
            '  min-width: 200px;',
            '  flex: 1 1 200px;',
            '  max-width: 320px;',
            '}',
            '.bestiary-search::placeholder {',
            '  color: #8a7a52;',
            '  font-style: italic;',
            '}'
        ].join('\n');
        document.head.appendChild(st);
    }

    // ─────────────────────────────────────────────────────────────
    // APLICA JÁ SE TELA ABERTA
    // ─────────────────────────────────────────────────────────────
    (function autoRefresh() {
        const screen = document.getElementById('storyScreen');
        if (!screen || !screen.classList.contains('active')) return;
        const titleEl = screen.querySelector('.story-title');
        if (titleEl && titleEl.textContent.indexOf('BESTIÁRIO') !== -1) {
            setTimeout(() => window.renderBestiaryScreen(), 150);
        }
    })();

    // ─────────────────────────────────────────────────────────────
    // DEBUG
    // ─────────────────────────────────────────────────────────────
    window._debugBestiarioV3 = function() {
        console.group('=== Bestiário V3 ===');
        console.log('Filtros ativos:', getFilters());

        const buckets = { historia: [], selados: [], nacoes: [], container: [] };
        const SE = (typeof STORY_ENEMIES !== 'undefined') ? STORY_ENEMIES : {};

        Object.keys(SE).forEach(id => {
            const o = getOrigem(id);
            if (buckets[o]) buckets[o].push(id);
        });

        console.log('História:', buckets.historia.length);
        console.log('Nações (deuses):', buckets.nacoes.length);
        console.log('Sete Selados:', buckets.selados.length);
        console.log('Containers ignorados:', buckets.container.length);
        console.log('');

        console.log('Deuses das Nações:');
        buckets.nacoes.forEach(id => {
            const d = NACAO_DEUSES[id];
            console.log('  ' + id + ' → ' + d.nome + ' (' + d.nacao + ')');
        });
        console.log('');

        console.log('Sete Selados:');
        buckets.selados.forEach(id => {
            const b = EVENTO_BOSSES[id];
            console.log('  ' + id + ' → ' + (b ? b.nome : '?') + ' (' + (b ? b.diaLabel : '?') + ')');
        });
        if (buckets.container.length > 0) {
            console.log('');
            console.log('Containers ignorados (correto):');
            buckets.container.forEach(id => console.log('  ' + id + ' — não renderizado'));
        }
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [Bestiário V3] Filtros completos');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Cards fantasmas (containers nacao_*) removidos');
    console.log('• Sete Selados deduplicados (STORY_ENEMIES + EVENTO_BOSSES)');
    console.log('• 21 deuses das Nações em categoria própria');
    console.log('• Filtros: origem · tipo · ato · conhecimento · busca');
    console.log('');
    console.log('💡 Debug: window._debugBestiarioV3()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// nacoes.js — V3.1 — Pesadelo das Nações no bestiário
// -----------------------------------------------------------------
// • Injeta nacao_pesadelo em NACAO_DEUSES, NACOES e STORY_ENEMIES
// • Aparece como boss final do bloco 🌎 Sete Nações
// • Auto-discovery: todos os 7 deuses finais derrotados
// • Injeta bloco "fila de 7 deuses" no card pós-render
// =================================================================
(function bestiarioV31() {
    if (window._bestiarioV31) return;
    window._bestiarioV31 = true;

    const eb = (typeof EVENTO_BOSSES !== 'undefined') ? EVENTO_BOSSES['nacao_pesadelo'] : null;
    if (!eb) {
        console.warn('[V3.1] EVENTO_BOSSES.nacao_pesadelo ausente — patch inativo.');
        return;
    }

    // ─────────────────────────────────────────────────────────────
    // 1. NACAO_DEUSES['nacao_pesadelo'] — faz isNacaoDeus() = true
    // ─────────────────────────────────────────────────────────────
    if (typeof NACAO_DEUSES !== 'undefined' && !NACAO_DEUSES['nacao_pesadelo']) {
        NACAO_DEUSES['nacao_pesadelo'] = {
            id: 'nacao_pesadelo',
            nacao: 'pesadelo',
            nome: eb.nome,
            titulo: eb.titulo,
            elemento: eb.elemento,
            hp: null,
            atk: null,
            descricao: eb.descricao,
            lore: eb.lore,
            skills: [],
            isNacaoPesadelo: true,
        };
        console.log('[V3.1] NACAO_DEUSES.nacao_pesadelo registrado');
    }

    // ─────────────────────────────────────────────────────────────
    // 2. NACOES.pesadelo (virtual) — só pra resolver nacaoNome
    //    diaSemana: -1 garante que NUNCA casa com _getNacaoDoDia
    // ─────────────────────────────────────────────────────────────
    if (typeof NACOES !== 'undefined' && !NACOES['pesadelo']) {
        NACOES['pesadelo'] = {
            id: 'pesadelo',
            nome: 'Pesadelo Mensal',
            titulo: eb.titulo,
            diaSemana: -1,
            elemento: 'VARIAVEL',
            corFundo: '#1a0a2a',
            descricao: eb.descricao,
            lore: eb.lore,
            deuses: eb.animais || [],
            _isVirtualBestiary: true,
        };
        console.log('[V3.1] NACOES.pesadelo registrado (virtual)');
    }

    // ─────────────────────────────────────────────────────────────
    // 3. STORY_ENEMIES['nacao_pesadelo'] — faz getTipo() = 'final'
    // ─────────────────────────────────────────────────────────────
    if (typeof STORY_ENEMIES !== 'undefined' && !STORY_ENEMIES['nacao_pesadelo']) {
        STORY_ENEMIES['nacao_pesadelo'] = {
            id: 'nacao_pesadelo',
            name: eb.nome,
            hp: null,
            atk: null,
            isBoss: true,
            isFinalBoss: true,
            elemento: eb.elemento,
            descricao: eb.descricao,
            lore: eb.lore,
            skill1: null,
            skill2: null,
            isNacaoPesadelo: true,
            deusesFila: eb.animais || [],
        };
        console.log('[V3.1] STORY_ENEMIES.nacao_pesadelo registrado');
    }

    // ─────────────────────────────────────────────────────────────
    // 4. Emoji do pesadelo (fallback do card)
    // ─────────────────────────────────────────────────────────────
    if (window.NACAO_EMOJIS && !window.NACAO_EMOJIS['nacao_pesadelo']) {
        window.NACAO_EMOJIS['nacao_pesadelo'] = '🌑';
    }

    // ─────────────────────────────────────────────────────────────
    // 5. Hook renderBestiaryScreen
    //    ANTES:  auto-discovery (marca pesadelo como descoberto)
    //    DEPOIS: injeta bloco "fila de 7 deuses" no card
    // ─────────────────────────────────────────────────────────────
    const _origRender = window.renderBestiaryScreen;
    if (typeof _origRender === 'function' && !_origRender._v31) {

        window.renderBestiaryScreen = function() {
            // ─── Auto-discovery ───
            try {
                if (!Array.isArray(STORY_PROGRESS.bossesDefeated)) {
                    STORY_PROGRESS.bossesDefeated = [];
                }
                const bd  = STORY_PROGRESS.bossesDefeated;
                const ed  = STORY_PROGRESS.enemiesDefeatedIds || [];
                const fila = eb.animais || [];

                const allFinalDefeated = fila.length > 0 &&
                    fila.every(g => bd.indexOf(g) !== -1 || ed.indexOf(g) !== -1);

                if (allFinalDefeated && bd.indexOf('nacao_pesadelo') === -1) {
                    bd.push('nacao_pesadelo');
                    if (typeof saveStoryProgress === 'function') saveStoryProgress();
                    console.log('[V3.1] 🌑 Pesadelo auto-descoberto (7 deuses finais derrotados)');
                }
            } catch (e) {
                console.warn('[V3.1] auto-discovery falhou:', e);
            }

            // ─── Render normal do V3.0 ───
            const result = _origRender.apply(this, arguments);

            // ─── Pós-render: injeta fila + conserta drops ───
            setTimeout(() => {
                try {
                    const card = document.querySelector('.bestiary-card[data-enemy-id="nacao_pesadelo"]');
                    if (!card) return;
                    if (card.classList.contains('locked')) return;

                    // Fila de 7 deuses
                    if (!card.querySelector('.v31-fila-pesadelo')) {
                        const nacaoEmojis = window.NACAO_EMOJIS || {};
                        const fila = eb.animais || [];
                        const filaHTML = fila.map(g => {
                            const deus = (typeof NACAO_DEUSES !== 'undefined' && NACAO_DEUSES[g]) || {};
                            const titulo = deus.nome || g;
                            const emoji = nacaoEmojis[g] || '?';
                            return `<span style="font-size:1.6rem;" title="${titulo}">${emoji}</span>`;
                        }).join('<span style="color:#8a7a52;font-size:1.1rem;">→</span>');

                        const bloco = document.createElement('div');
                        bloco.className = 'v31-fila-pesadelo';
                        bloco.style.cssText = 'margin-top:10px;padding:10px;background:rgba(142,68,173,0.12);border:1px solid rgba(142,68,173,0.4);border-radius:6px;text-align:center;';
                        bloco.innerHTML = `
                            <div style="font-family:'Cinzel',serif;color:#c39bd3;font-size:0.8rem;letter-spacing:2px;margin-bottom:8px;">⚔️ FILA DE 7 DEUSES FINAIS</div>
                            <div style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px;">${filaHTML}</div>
                            <div style="font-family:'EB Garamond',serif;color:#b8a577;font-size:0.8rem;font-style:italic;margin-top:8px;">Cada deus precisa cair para o próximo aparecer.</div>
                        `;
                        const firstSection = card.querySelector('.bestiary-card-section');
                        if (firstSection) card.insertBefore(bloco, firstSection);
                        else card.appendChild(bloco);
                    }

                    // Corrige drops (V3.0 mostra "Fase 3" — errado pro pesadelo)
                    card.querySelectorAll('.bestiary-card-section').forEach(sec => {
                        const titleEl = sec.querySelector('.bestiary-card-section-title');
                        if (titleEl && titleEl.textContent.indexOf('Drops') !== -1) {
                            const dropsEl = sec.querySelector('.bestiary-drops');
                            if (dropsEl && !dropsEl.querySelector('[data-v31-fixed]')) {
                                dropsEl.innerHTML = `
                                    <span class="bestiary-drop" data-v31-fixed="1">🌎 Essência Ancestral</span>
                                    <span class="bestiary-drop bestiary-drop-raro" data-v31-fixed="1">⚔️ Arma aleatória (35%)</span>
                                    <span class="bestiary-drop bestiary-drop-raro" data-v31-fixed="1">🧿 Núcleo do Pesadelo</span>
                                `;
                            }
                        }
                    });
                } catch (e) {
                    console.warn('[V3.1] pós-render falhou:', e);
                }
            }, 90);

            return result;
        };
        window.renderBestiaryScreen._v31 = true;
    }

    // ─────────────────────────────────────────────────────────────
    // 6. Debug / testes manuais
    // ─────────────────────────────────────────────────────────────
    window._forcarDescobertaPesadelo = function() {
        if (!Array.isArray(STORY_PROGRESS.bossesDefeated)) STORY_PROGRESS.bossesDefeated = [];
        if (STORY_PROGRESS.bossesDefeated.indexOf('nacao_pesadelo') === -1) {
            STORY_PROGRESS.bossesDefeated.push('nacao_pesadelo');
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
            console.log('✅ Pesadelo marcado como descoberto');
        } else {
            console.log('Já estava descoberto');
        }
        if (document.querySelector('#storyScreen.active .story-title')?.textContent.indexOf('BESTIÁRIO') !== -1) {
            window.renderBestiaryScreen();
        }
    };

    window._resetDescobertaPesadelo = function() {
        if (!Array.isArray(STORY_PROGRESS.bossesDefeated)) return;
        const idx = STORY_PROGRESS.bossesDefeated.indexOf('nacao_pesadelo');
        if (idx !== -1) {
            STORY_PROGRESS.bossesDefeated.splice(idx, 1);
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
            console.log('🔄 Pesadelo ocultado');
        }
        if (document.querySelector('#storyScreen.active .story-title')?.textContent.indexOf('BESTIÁRIO') !== -1) {
            window.renderBestiaryScreen();
        }
    };

    window._debugBestiarioV31 = function() {
        console.group('=== Bestiário V3.1 — Pesadelo ===');
        console.log('NACAO_DEUSES.nacao_pesadelo:', !!NACAO_DEUSES['nacao_pesadelo']);
        console.log('STORY_ENEMIES.nacao_pesadelo:', !!STORY_ENEMIES['nacao_pesadelo']);
        console.log('NACOES.pesadelo:', !!NACOES['pesadelo']);
        console.log('Emoji:', window.NACAO_EMOJIS && window.NACAO_EMOJIS['nacao_pesadelo']);
        console.log('');
        console.log('Fila:', eb.animais);
        const bd = STORY_PROGRESS.bossesDefeated || [];
        const ed = STORY_PROGRESS.enemiesDefeatedIds || [];
        console.log('Status de cada deus final:');
        (eb.animais || []).forEach(g => {
            const ok = bd.indexOf(g) !== -1 || ed.indexOf(g) !== -1;
            console.log(`  ${g}: ${ok ? '✓' : '✗'}`);
        });
        console.log('');
        console.log('Pesadelo descoberto:', bd.indexOf('nacao_pesadelo') !== -1);
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V3.1] Pesadelo das Nações no bestiário');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Aparece como boss final do bloco 🌎 Sete Nações');
    console.log('• Auto-discovery: 7 deuses finais derrotados');
    console.log('• Fila de 7 deuses exibida no card');
    console.log('');
    console.log('💡 Debug:     window._debugBestiarioV31()');
    console.log('💡 Force:     window._forcarDescobertaPesadelo()');
    console.log('💡 Ocultar:   window._resetDescobertaPesadelo()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// nacoes.js — V3.2 — Sync de descobertas (fase concluída = deus visto)
// -----------------------------------------------------------------
// • Ao abrir o bestiário, percorre nacaoProgressoPorDificuldade
//   e adiciona em enemiesDefeatedIds todos os deuses das fases
//   já concluídas (resolve Wekufe, Supay, Chibchacum, Hashchélíí...)
// • Roda também ao carregar o save (timeout + saveStoryProgress hook)
// =================================================================
(function bestiarioV32() {
    if (window._bestiarioV32) return;
    window._bestiarioV32 = true;

    // ─────────────────────────────────────────────────────────────
    // 1. SYNC PROATIVO
    // ─────────────────────────────────────────────────────────────
    function sincronizarDescobertas() {
        if (typeof STORY_PROGRESS === 'undefined') return 0;
        if (!Array.isArray(STORY_PROGRESS.enemiesDefeatedIds)) STORY_PROGRESS.enemiesDefeatedIds = [];
        if (!Array.isArray(STORY_PROGRESS.bossesDefeated))      STORY_PROGRESS.bossesDefeated = [];

        const prog = STORY_PROGRESS.nacaoProgressoPorDificuldade || {};
        const add  = new Set();

        Object.keys(prog).forEach(diff => {
            const bucket = prog[diff] || {};
            Object.keys(bucket).forEach(nacaoId => {
                const p = bucket[nacaoId];
                if (!p || !Array.isArray(p.fasesConcluidas)) return;
                const nacao = (typeof NACOES !== 'undefined') ? NACOES[nacaoId] : null;
                if (!nacao || !Array.isArray(nacao.deuses)) return;

                p.fasesConcluidas.forEach(fase => {
                    const idx = parseInt(fase) - 1;
                    if (idx >= 0 && idx < nacao.deuses.length) {
                        // Todos os deuses até o índice dessa fase foram derrotados
                        for (let i = 0; i <= idx; i++) {
                            if (nacao.deuses[i]) add.add(nacao.deuses[i]);
                        }
                    }
                });
            });
        });

        let novas = 0;
        add.forEach(id => {
            if (STORY_PROGRESS.enemiesDefeatedIds.indexOf(id) === -1) {
                STORY_PROGRESS.enemiesDefeatedIds.push(id);
                novas++;
            }
        });

        if (novas > 0 && typeof saveStoryProgress === 'function') {
            saveStoryProgress();
            console.log('[V3.2] ' + novas + ' deuses de nação sincronizados em enemiesDefeatedIds');
        }
        return novas;
    }
    window._syncBestiarioV32 = sincronizarDescobertas;

    // ─────────────────────────────────────────────────────────────
    // 2. Wrapper do renderBestiaryScreen (sync ANTES do render)
    // ─────────────────────────────────────────────────────────────
    const _origRender = window.renderBestiaryScreen;
    if (typeof _origRender === 'function' && !_origRender._v32) {
        window.renderBestiaryScreen = function() {
            sincronizarDescobertas();
            return _origRender.apply(this, arguments);
        };
        window.renderBestiaryScreen._v32 = true;
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Sync ao carregar o save
    // ─────────────────────────────────────────────────────────────
    setTimeout(sincronizarDescobertas, 800);
    setTimeout(sincronizarDescobertas, 2500);

    const _origLoad = window.loadStoryProgressByName;
    if (typeof _origLoad === 'function' && !_origLoad._v32) {
        window.loadStoryProgressByName = function() {
            const r = _origLoad.apply(this, arguments);
            if (r) setTimeout(sincronizarDescobertas, 200);
            return r;
        };
        window.loadStoryProgressByName._v32 = true;
    }

    // ─────────────────────────────────────────────────────────────
    // 4. DEBUG
    // ─────────────────────────────────────────────────────────────
    window._debugBestiarioV32 = function() {
        console.group('=== Bestiário V3.2 — Sync ===');
        const ed = STORY_PROGRESS.enemiesDefeatedIds || [];
        const bd = STORY_PROGRESS.bossesDefeated || [];

        const prog = STORY_PROGRESS.nacaoProgressoPorDificuldade || {};
        console.log('Fases concluídas por nação:');
        Object.keys(prog).forEach(diff => {
            Object.keys(prog[diff] || {}).forEach(nid => {
                const p = prog[diff][nid];
                const nacao = (typeof NACOES !== 'undefined') ? NACOES[nid] : null;
                if (!nacao || !nacao.deuses) return;
                const fases = p.fasesConcluidas || [];
                if (fases.length === 0) return;
                console.log('  [' + diff + '] ' + nid + ': fases=[' + fases.join(',') + ']');
                nacao.deuses.forEach((did, i) => {
                    const fase = String(i + 1);
                    const concluida = fases.indexOf(fase) !== -1;
                    const descoberto = ed.indexOf(did) !== -1 || bd.indexOf(did) !== -1;
                    if (concluida && !descoberto) {
                        console.warn('    ⚠️ ' + did + ' (fase ' + fase + ') — fase concluída mas NÃO em enemiesDefeatedIds');
                    } else if (concluida && descoberto) {
                        console.log('    ✓ ' + did + ' (fase ' + fase + ')');
                    }
                });
            });
        });
        console.groupEnd();
    };

    window._syncBestiarioManual = function() {
        const n = sincronizarDescobertas();
        console.log('✅ ' + n + ' sincronizações aplicadas');
        if (document.querySelector('#storyScreen.active .story-title')?.textContent.indexOf('BESTIÁRIO') !== -1) {
            window.renderBestiaryScreen();
        }
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V3.2] Sincronização de descobertas');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Fases concluídas → enemiesDefeatedIds automaticamente');
    console.log('• Resolve 3º deus de cada nação:');
    console.log('  Mapuches→Wekufe · Incas→Supay · Chibchas→Chibchacum');
    console.log('  Navajos→Hashchélíí · Taínos→Juracán · Astecas→Huitzilopochtli');
    console.log('  Maias→Ixchel');
    console.log('');
    console.log('💡 Debug:     window._debugBestiarioV32()');
    console.log('💡 Sync manual: window._syncBestiarioManual()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// nacoes.js — V3.3 — Registro garantido de deuses derrotados
// -----------------------------------------------------------------
// • Ao vencer fase de nação → deus vai em enemiesDefeatedIds
//   (não depende mais de fasesConcluidas, que reseta toda segunda)
// • Intercepta eventoFinalizarPartida + finishStoryPhase
// • Helper manual para recuperar derrotas antigas
// =================================================================
(function bestiarioV33() {
    if (window._bestiarioV33) return;
    window._bestiarioV33 = true;

    function registrarDeus(nacaoId, faseId) {
        if (!nacaoId || !faseId || nacaoId === 'pesadelo') return;
        const nacao = (typeof NACOES !== 'undefined') ? NACOES[nacaoId] : null;
        if (!nacao || !Array.isArray(nacao.deuses)) return;

        const idx = parseInt(faseId) - 1;
        if (idx < 0 || idx >= nacao.deuses.length) return;

        const deusId = nacao.deuses[idx];
        if (!deusId) return;

        if (!Array.isArray(STORY_PROGRESS.enemiesDefeatedIds)) {
            STORY_PROGRESS.enemiesDefeatedIds = [];
        }
        if (STORY_PROGRESS.enemiesDefeatedIds.indexOf(deusId) === -1) {
            STORY_PROGRESS.enemiesDefeatedIds.push(deusId);
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
            console.log('[V3.3] ✅ ' + deusId + ' registrado (fase ' + faseId + ' de ' + nacaoId + ')');
        }
    }

    // ─────────────────────────────────────────────────────────────
    // 1. Hook eventoFinalizarPartida (fase 3 / boss)
    // ─────────────────────────────────────────────────────────────
    const _origFinalizar = window.eventoFinalizarPartida;
    if (typeof _origFinalizar === 'function' && !_origFinalizar._v33) {
        window.eventoFinalizarPartida = async function(vitoria) {
            const b = window._nacaoBatalha || {};
            const emNacao = b.ativa === true || window._nacaoAtivo === true;
            if (vitoria && emNacao && b.nacaoId && b.faseId) {
                try { registrarDeus(b.nacaoId, b.faseId); }
                catch (e) { console.warn('[V3.3] finalizar erro:', e); }
            }
            return _origFinalizar.apply(this, arguments);
        };
        window.eventoFinalizarPartida._v33 = true;
    }

    // ─────────────────────────────────────────────────────────────
    // 2. Hook finishStoryPhase (fases 1 e 2)
    //    (roda ANTES do V2.11 resetar _nacaoBatalha)
    // ─────────────────────────────────────────────────────────────
    const _origFinish = window.finishStoryPhase;
    if (typeof _origFinish === 'function' && !_origFinish._v33) {
        window.finishStoryPhase = function(victory) {
            const b = window._nacaoBatalha || {};
            const emNacao = b.ativa === true || window._nacaoAtivo === true;
            if (victory && emNacao && b.nacaoId && b.faseId) {
                try { registrarDeus(b.nacaoId, b.faseId); }
                catch (e) { console.warn('[V3.3] finish erro:', e); }
            }
            return _origFinish.apply(this, arguments);
        };
        window.finishStoryPhase._v33 = true;
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Helper manual para o retroativo
    // ─────────────────────────────────────────────────────────────
    window._marcarDeusComoDerrotado = function(deusId) {
        if (!deusId) {
            console.log('Uso: _marcarDeusComoDerrotado("nacao_wekufe")');
            console.log('IDs disponíveis:');
            Object.keys(NACAO_DEUSES || {}).forEach(id => {
                const d = NACAO_DEUSES[id];
                console.log('  ' + id + '  (' + d.nome + ' — ' + d.nacao + ')');
            });
            return;
        }
        if (!Array.isArray(STORY_PROGRESS.enemiesDefeatedIds)) {
            STORY_PROGRESS.enemiesDefeatedIds = [];
        }
        if (STORY_PROGRESS.enemiesDefeatedIds.indexOf(deusId) === -1) {
            STORY_PROGRESS.enemiesDefeatedIds.push(deusId);
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
            console.log('✅ ' + deusId + ' marcado como derrotado');
        } else {
            console.log(deusId + ' já estava marcado');
        }
        if (document.querySelector('#storyScreen.active .story-title')?.textContent.indexOf('BESTIÁRIO') !== -1) {
            window.renderBestiaryScreen();
        }
    };

    window._marcarTodosTerceirosDeuses = function() {
        let n = 0;
        Object.keys(NACOES || {}).forEach(nid => {
            const nac = NACOES[nid];
            if (nac._isVirtualBestiary) return;
            if (!nac.deuses || nac.deuses.length < 3) return;
            const deusFinal = nac.deuses[2];
            if (!Array.isArray(STORY_PROGRESS.enemiesDefeatedIds)) {
                STORY_PROGRESS.enemiesDefeatedIds = [];
            }
            if (STORY_PROGRESS.enemiesDefeatedIds.indexOf(deusFinal) === -1) {
                STORY_PROGRESS.enemiesDefeatedIds.push(deusFinal);
                console.log('  ✅ ' + deusFinal + ' (' + nac.nome + ')');
                n++;
            }
        });
        if (n > 0 && typeof saveStoryProgress === 'function') saveStoryProgress();
        console.log(n + ' deuses finais registrados');
        if (document.querySelector('#storyScreen.active .story-title')?.textContent.indexOf('BESTIÁRIO') !== -1) {
            window.renderBestiaryScreen();
        }
    };

    // ─────────────────────────────────────────────────────────────
    // 4. Debug
    // ─────────────────────────────────────────────────────────────
    window._debugBestiarioV33 = function() {
        console.group('=== Bestiário V3.3 ===');
        const ed = STORY_PROGRESS.enemiesDefeatedIds || [];
        const bd = STORY_PROGRESS.bossesDefeated || [];

        console.log('Deuses de nação — status:');
        let faltando = 0;
        Object.keys(NACAO_DEUSES || {}).forEach(id => {
            if (id === 'nacao_pesadelo') return;
            const d = NACAO_DEUSES[id];
            const ok = ed.indexOf(id) !== -1 || bd.indexOf(id) !== -1;
            if (!ok) faltando++;
            console.log('  ' + (ok ? '✓' : '✗') + ' ' + id + '  (' + d.nome + ' — ' + d.nacao + ')');
        });
        console.log('');
        console.log(faltando === 0 ? '✅ Todos os 21 deuses registrados' : '⚠️ ' + faltando + ' faltando');

        const prog = STORY_PROGRESS.nacaoProgressoPorDificuldade || {};
        console.log('');
        console.log('Fases concluídas (por diff — pode ter resetado na semana):');
        Object.keys(prog).forEach(diff => {
            Object.keys(prog[diff] || {}).forEach(nid => {
                const p = prog[diff][nid];
                if (p.fasesConcluidas && p.fasesConcluidas.length > 0) {
                    console.log('  [' + diff + '] ' + nid + ': fases=[' + p.fasesConcluidas.join(',') + '] semana=' + p.semana);
                }
            });
        });
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V3.3] Registro garantido de deuses derrotados');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Agora toda vitória de fase grava enemiesDefeatedIds');
    console.log('• Não depende mais de fasesConcluidas (que reseta na segunda)');
    console.log('');
    console.log('💡 Debug:    window._debugBestiarioV33()');
    console.log('💡 Marcar 1: window._marcarDeusComoDerrotado("nacao_wekufe")');
    console.log('💡 Marcar 7: window._marcarTodosTerceirosDeuses()');
    console.log('═══════════════════════════════════════════════════');
})();