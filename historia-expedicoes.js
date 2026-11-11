// historia.js — V79 — Expedições
// -----------------------------------------------------------------
// Heróis podem ser enviados para expedição em fases já completadas
// (1★+). Recompensa em background após o tempo, com base na chance
// calculada pela força do herói vs fase.
//
// Regras:
//   • 3 slots iniciais + 1 a cada 100 estrelas (máx 5)
//   • Tempo: Normal 30min, Difícil 1h, Pesadelo 2h
//   • Chance = heroPower / (phaseReq × 2), travado 15%–95%
//   • Fase 13-4: chance travada 10%–30% (final boss)
//   • Sucesso: 50% XP/ouro + drops normais (sem Núcleo/essência)
//   • Falha: 15% XP, 0 ouro, 0 drops
//   • NÃO dá estrela
//   • Herói fica indisponível na OCA durante
//   • Não pode cancelar
//   • Só vê resultado ao clicar em "Ver resultado e coletar"
//
// Cole NO FINAL do historia.js.
// =================================================================
(function expedicoesV79() {
    if (window._expedicoesV79) return;
    window._expedicoesV79 = true;

    // ═══════════════════════════════════════════════════════════
    // CONSTANTES
    // ═══════════════════════════════════════════════════════════
    const TEMPO_MS = {
        normal:   30 * 60 * 1000,
        dificil:  60 * 60 * 1000,
        pesadelo: 120 * 60 * 1000,
    };
    const DIFF_LABEL = { normal: 'Normal', dificil: 'Difícil', pesadelo: 'Pesadelo' };
    const DIFF_MULT = { normal: 1, dificil: 1.3, pesadelo: 1.6 };
    const DIFF_COR = { normal: '#c9a227', dificil: '#e67e22', pesadelo: '#a83232' };

    // Inicializa estrutura
    if (!Array.isArray(STORY_PROGRESS.expeditions)) {
        STORY_PROGRESS.expeditions = [];
    }

    // ═══════════════════════════════════════════════════════════
    // SLOTS (progressão por estrelas)
    // ═══════════════════════════════════════════════════════════
    function getSlots() {
        const stars = (typeof getTotalStars === 'function') ? getTotalStars() : 0;
        if (stars >= 200) return 5;
        if (stars >= 100) return 4;
        return 3;
    }

    function getExpedicoesAtivas() {
        return (STORY_PROGRESS.expeditions || []).filter(e => !e.coletada);
    }

    function getExpedicoesPorColetar() {
        return (STORY_PROGRESS.expeditions || []).filter(e => e.coletada === false && e.concluida === true);
    }

    function heroiEmExpedicao(heroClass) {
        return (STORY_PROGRESS.expeditions || []).some(e =>
            e.heroClass === heroClass && !e.coletada
        );
    }

    // ═══════════════════════════════════════════════════════════
    // CÁLCULOS
    // ═══════════════════════════════════════════════════════════
    function calcHeroPower(heroClass) {
        const heroData = STORY_HERO_CLASSES[heroClass];
        if (!heroData) return 0;
        const level = (typeof getHeroLevel === 'function') ? getHeroLevel(heroClass) : 1;
        const bonus = (typeof getHeroBonusFromLevel === 'function')
            ? (getHeroBonusFromLevel(heroClass) || {}) : {};

        let hp = (heroData.hp || 0) + (bonus.hp || 0);
        let atk = (heroData.atk || 0) + (bonus.atk || 0);

        if (typeof getHeroEquipment === 'function') {
            const eq = getHeroEquipment(heroClass);
            if (eq?.arma && typeof getWeaponById === 'function') {
                const w = getWeaponById(eq.arma);
                if (w) atk += w.atkBonus || 0;
            }
            if (eq?.amuleto && typeof getAmuletById === 'function') {
                const a = getAmuletById(eq.amuleto);
                if (a?.efeito) {
                    atk += a.efeito.atkBonus || 0;
                    hp += a.efeito.hpBonus || 0;
                }
            }
        }

        return (hp * 2) + (atk * 8) + (level * 15);
    }

    function calcPhaseReq(chapterId, phaseId, difficulty) {
        const ch = STORY_CHAPTERS[chapterId];
        if (!ch) return 1;
        const ph = ch.phases.find(p => p.id === phaseId);
        if (!ph) return 1;

        let hpSum = 0, atkSum = 0;
        ph.enemies.forEach(eid => {
            const e = STORY_ENEMIES[eid];
            if (e) {
                hpSum += e.hp || 0;
                atkSum += e.atk || 0;
            }
        });
        const mult = DIFF_MULT[difficulty] || 1;
        return Math.max(1, (hpSum + atkSum * 5) * mult);
    }

    function calcChance(heroClass, chapterId, phaseId, difficulty) {
        const hp = calcHeroPower(heroClass);
        const req = calcPhaseReq(chapterId, phaseId, difficulty);
        const isFinal = (phaseId === '13-4');
        const divisor = isFinal ? 3 : 2;
        const minChance = isFinal ? 0.10 : 0.15;
        const maxChance = isFinal ? 0.30 : 0.95;
        const base = hp / (req * divisor);
        return Math.max(minChance, Math.min(maxChance, base));
    }

    // ═══════════════════════════════════════════════════════════
    // DROPS/XP/OURO
    // ═══════════════════════════════════════════════════════════
    function calcRecompensas(phase, dificuldade) {
        const xpBase = (phase.reward?.xp || 0);
        const goldBase = (phase.reward?.gold || 0);
        const diffMult = DIFF_MULT[dificuldade] || 1;

        const xp = Math.floor(xpBase * 0.5 * diffMult);
        const gold = Math.floor(goldBase * 0.5 * diffMult);

        const drops = [];
        if (typeof rollStoryDrops === 'function') {
            phase.enemies.forEach(eid => {
                const enemyDrops = rollStoryDrops(eid, dificuldade);
                enemyDrops.forEach(d => {
                    if (d.id === 'nucleo_abismo') return; // só manual
                    if (d.id === 'essencia_sombria') return; // só evento manual
                    drops.push(d);
                });
            });
        }

        return { xp, gold, drops };
    }

    function calcRecompensaFalha(phase) {
        return {
            xp: Math.floor((phase.reward?.xp || 0) * 0.15),
            gold: 0,
            drops: [],
        };
    }

    // ═══════════════════════════════════════════════════════════
    // VERIFICAR CONCLUSÕES (timer de 10s)
    // ═══════════════════════════════════════════════════════════
    function verificarConclusoes() {
        if (!Array.isArray(STORY_PROGRESS.expeditions)) return;
        let mudou = false;

        STORY_PROGRESS.expeditions.forEach(exp => {
            if (exp.coletada || exp.concluida) return;
            if (exp.tipo) return;
            const elapsed = Date.now() - exp.startedAt;
            if (elapsed < exp.durationMs) return;

            // Rolar resultado
            const ch = STORY_CHAPTERS[exp.chapterId];
            const ph = ch?.phases.find(p => p.id === exp.phaseId);
            if (!ph) { exp.concluida = true; exp.resultado = { sucesso: false, xp: 0, gold: 0, drops: [] }; mudou = true; return; }

            const sucesso = Math.random() < exp.chance;
            if (sucesso) {
                const r = calcRecompensas(ph, exp.difficulty);
                exp.resultado = { sucesso: true, ...r };
            } else {
                const r = calcRecompensaFalha(ph);
                exp.resultado = { sucesso: false, ...r };
            }
            exp.concluida = true;
            mudou = true;
        });

        if (mudou) {
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
            const ss = document.getElementById('storyScreen');
            if (ss?.classList.contains('active') && ss.innerHTML.includes('OCA')) {
                if (typeof renderOcaScreenFiltered === 'function') renderOcaScreenFiltered();
            }
        }
    }

    setInterval(verificarConclusoes, 10000);

    // ═══════════════════════════════════════════════════════════
    // INJETAR BOTÃO 🗺️ NO CARD DO HERÓI
    // ═══════════════════════════════════════════════════════════
    function injetarBotaoExpedicao() {
        const cards = document.querySelectorAll('.story-hero-card:not(.locked)');
        cards.forEach(card => {
            if (card.querySelector('.hero-expedition-btn')) return;
            const onclickAttr = card.getAttribute('onclick') || '';
            const match = onclickAttr.match(/toggleHeroSelection\('((?:\\'|[^'])*)'\)/);
            if (!match) return;
            const heroClass = match[1].replace(/\\'/g, "'");

            const btn = document.createElement('button');
            btn.className = 'hero-expedition-btn';
            btn.title = 'Enviar para expedição';
            btn.innerHTML = '🗺️';

            if (heroiEmExpedicao(heroClass)) {
                btn.disabled = true;
                btn.style.opacity = '0.4';
                btn.title = 'Herói em expedição';
            } else {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    abrirTelaExpedicao(heroClass);
                };
            }
            card.appendChild(btn);
        });
    }

    // ═══════════════════════════════════════════════════════════
    // TELA DE EXPEDIÇÃO (seleção de fase + dificuldade)
    // ═══════════════════════════════════════════════════════════
    let _selHeroi = null;
    let _selChapter = null;
    let _selPhase = null;
    let _selDiff = 'normal';

    function abrirTelaExpedicao(heroClass) {
        if (heroiEmExpedicao(heroClass)) {
            if (typeof showToast === 'function') showToast('⛺', 'Herói já está em expedição.', '⛺');
            return;
        }
        const ativas = getExpedicoesAtivas();
        const slots = getSlots();
        if (ativas.length >= slots) {
            if (typeof showToast === 'function') showToast('⛺', `Slots cheios (${ativas.length}/${slots}).`, '⛺');
            return;
        }

        _selHeroi = heroClass;
        _selChapter = 1;
        _selPhase = null;
        _selDiff = 'normal';

        const old = document.getElementById('expedicaoOverlay');
        if (old) old.remove();

        const ov = document.createElement('div');
        ov.id = 'expedicaoOverlay';
        ov.className = 'expedicao-overlay';
        ov.onclick = (e) => { if (e.target === ov) fecharExpedicao(); };
        document.body.appendChild(ov);

        renderTelaExpedicao();
    }

    function fecharExpedicao() {
        const ov = document.getElementById('expedicaoOverlay');
        if (ov) ov.remove();
    }

    function renderTelaExpedicao() {
        const ov = document.getElementById('expedicaoOverlay');
        if (!ov) return;

        const heroData = STORY_HERO_CLASSES[_selHeroi];
        const heroPower = calcHeroPower(_selHeroi);

        // Fases disponíveis (1★+, exceto fase do boss final do evento)
        const fasesDisponiveis = [];
        Object.values(STORY_CHAPTERS).forEach(ch => {
            ch.phases.forEach(ph => {
                if (typeof isPhaseCompleted === 'function' && isPhaseCompleted(ph.id)) {
                    fasesDisponiveis.push({ chapterId: ch.id, phase: ph });
                }
            });
        });

        // Chapter atual selecionado
        if (!_selChapter || !fasesDisponiveis.some(f => f.chapterId === _selChapter)) {
            _selChapter = fasesDisponiveis[0]?.chapterId || 1;
        }

        const fasesDoChapter = fasesDisponiveis.filter(f => f.chapterId === _selChapter);
        if (!_selPhase && fasesDoChapter.length > 0) {
            _selPhase = fasesDoChapter[0].phase.id;
        }

        const phaseObj = fasesDisponiveis.find(f => f.phase.id === _selPhase)?.phase;
        const chance = phaseObj ? calcChance(_selHeroi, _selChapter, _selPhase, _selDiff) : 0;
        const tempo = TEMPO_MS[_selDiff];
        const tempoLabel = tempo >= 3600000
            ? `${Math.round(tempo / 3600000)}h`
            : `${Math.round(tempo / 60000)}min`;

        const sprite = (typeof SPRITES !== 'undefined' && SPRITES[_selHeroi]) || '';

        // Fases por ato (botões de ato)
        const chaptersComFases = [...new Set(fasesDisponiveis.map(f => f.chapterId))].sort((a, b) => a - b);
        const chapterBtns = chaptersComFases.map(cid => {
            const ativo = cid === _selChapter;
            return `<button class="exp-chapter-btn ${ativo ? 'active' : ''}" onclick="window._expSelChapter(${cid})">Ato ${cid}</button>`;
        }).join('');

        // Fases do ato selecionado
        const phaseBtns = fasesDoChapter.map(f => {
            const ativo = f.phase.id === _selPhase;
            const isBoss = f.phase.isBoss;
            const isFinal = f.phase.isFinalBoss;
            return `<button class="exp-phase-btn ${ativo ? 'active' : ''} ${isFinal ? 'final' : isBoss ? 'boss' : ''}" onclick="window._expSelPhase('${f.phase.id}')">
                ${f.phase.id}${isFinal ? ' 👑' : isBoss ? ' 🎯' : ''}
            </button>`;
        }).join('');

        // Dificuldades
        const diffs = ['normal', 'dificil', 'pesadelo'];
        const diffBtns = diffs.map(d => {
            const ativo = d === _selDiff;
            return `<button class="exp-diff-btn ${ativo ? 'active' : ''}" onclick="window._expSelDiff('${d}')" style="--cor:${DIFF_COR[d]};">
                ${DIFF_LABEL[d]}
            </button>`;
        }).join('');

        // Preview
        const chancePct = Math.round(chance * 100);
        const chanceCor = chancePct >= 70 ? '#8ac070' : chancePct >= 40 ? '#e8b923' : '#d05050';
        const req = calcPhaseReq(_selChapter, _selPhase, _selDiff);

        ov.innerHTML = `
            <div class="expedicao-panel">
                <div class="expedicao-header">
                    <div class="exp-hero">
                        <img src="${sprite}" class="exp-hero-sprite" onerror="this.style.display='none'">
                        <div>
                            <div class="exp-hero-name">${heroData?.displayName || _selHeroi}</div>
                            <div class="exp-hero-power">Poder: <b>${heroPower}</b></div>
                        </div>
                    </div>
                    <button class="exp-close" onclick="window._expFechar()">✕</button>
                </div>

                <div class="exp-section">
                    <div class="exp-section-title">ATOR</div>
                    <div class="exp-chapter-list">${chapterBtns || '<span style="color:#8a7a52;">Nenhuma fase completada</span>'}</div>
                </div>

                <div class="exp-section">
                    <div class="exp-section-title">FASE</div>
                    <div class="exp-phase-list">${phaseBtns || '<span style="color:#8a7a52;">—</span>'}</div>
                </div>

                <div class="exp-section">
                    <div class="exp-section-title">DIFICULDADE</div>
                    <div class="exp-diff-list">${diffBtns}</div>
                </div>

                ${phaseObj ? `
                <div class="exp-preview">
                    <div class="exp-preview-row">
                        <span>Chance de sucesso:</span>
                        <b style="color:${chanceCor}; font-size:1.3rem;">${chancePct}%</b>
                    </div>
                    <div class="exp-preview-row">
                        <span>Poder:</span>
                        <b>${heroPower}</b> · Necessário: <b>${Math.round(req)}</b>
                    </div>
                    <div class="exp-preview-row">
                        <span>Tempo:</span>
                        <b>${tempoLabel}</b>
                    </div>
                    <div class="exp-preview-row">
                        <span>Recompensa (sucesso):</span>
                        <b>+${Math.floor((phaseObj.reward?.xp||0) * 0.5 * DIFF_MULT[_selDiff])} XP
                        · +${Math.floor((phaseObj.reward?.gold||0) * 0.5 * DIFF_MULT[_selDiff])} ouro</b>
                    </div>
                    <div class="exp-preview-row dim">
                        <span>Recompensa (falha):</span>
                        <b>+${Math.floor((phaseObj.reward?.xp||0) * 0.15)} XP (consolação)</b>
                    </div>
                    ${_selPhase === '13-4' ? `<div class="exp-preview-warn">⚠️ Fase final: chance travada em 10%–30%</div>` : ''}
                </div>
                ` : ''}

                <div class="exp-actions">
                    <button class="exp-btn exp-btn-secondary" onclick="window._expFechar()">Cancelar</button>
                    <button class="exp-btn exp-btn-primary" ${!phaseObj ? 'disabled' : ''} onclick="window._expEnviar()">
                        ⛺ Enviar para expedição
                    </button>
                </div>
            </div>
        `;
    }

    // Hooks globais do modal
    window._expFechar = fecharExpedicao;
    window._expSelChapter = (cid) => { _selChapter = cid; _selPhase = null; renderTelaExpedicao(); };
    window._expSelPhase = (pid) => { _selPhase = pid; renderTelaExpedicao(); };
    window._expSelDiff = (d) => { _selDiff = d; renderTelaExpedicao(); };

    window._expEnviar = () => {
        const ativas = getExpedicoesAtivas();
        const slots = getSlots();
        if (ativas.length >= slots) {
            if (typeof showToast === 'function') showToast('⛺', `Slots cheios (${ativas.length}/${slots}).`, '⛺');
            return;
        }
        if (heroiEmExpedicao(_selHeroi)) {
            if (typeof showToast === 'function') showToast('⛺', 'Herói já em expedição.', '⛺');
            return;
        }

        const ch = STORY_CHAPTERS[_selChapter];
        const ph = ch?.phases.find(p => p.id === _selPhase);
        if (!ph) return;

        const chance = calcChance(_selHeroi, _selChapter, _selPhase, _selDiff);
        const exp = {
            id: 'exp_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            heroClass: _selHeroi,
            chapterId: _selChapter,
            phaseId: _selPhase,
            phaseName: ph.name,
            difficulty: _selDiff,
            chance,
            startedAt: Date.now(),
            durationMs: TEMPO_MS[_selDiff],
            concluida: false,
            coletada: false,
            resultado: null,
        };
        STORY_PROGRESS.expeditions.push(exp);
        if (typeof saveStoryProgress === 'function') saveStoryProgress();

        fecharExpedicao();
        if (typeof showToast === 'function') showToast('⛺', 'Expedição enviada!', '⛺');
        if (typeof playSfx === 'function') { try { playSfx('win'); } catch(e) {} }

        // Re-renderiza OCA
        if (typeof renderOcaScreenFiltered === 'function') renderOcaScreenFiltered();
    };

    // ═══════════════════════════════════════════════════════════
    // SLOTS NO TOPO DA OCA
    // ═══════════════════════════════════════════════════════════
    function renderSlots() {
        const container = document.getElementById('expedicaoSlots');
        if (!container) return;

        const slots = getSlots();
        const ativas = getExpedicoesAtivas();

        // Ordena por status: concluídas primeiro, depois em andamento
        const ordenadas = [...ativas].sort((a, b) => {
            if (a.concluida && !b.concluida) return -1;
            if (!a.concluida && b.concluida) return 1;
            return a.startedAt - b.startedAt;
        });

        const slotsHTML = [];
        for (let i = 0; i < slots; i++) {
            const exp = ordenadas[i];
            if (!exp) {
                slotsHTML.push(`<div class="exp-slot empty"><span class="exp-slot-empty-text">Slot vazio</span></div>`);
                continue;
            }

            const heroData = STORY_HERO_CLASSES[exp.heroClass];
            const sprite = (typeof SPRITES !== 'undefined' && SPRITES[exp.heroClass]) || '';
            const concluida = exp.concluida;

            if (concluida) {
                slotsHTML.push(`
                    <div class="exp-slot concluded" onclick="window._expVerResultado('${exp.id}')">
                        <div class="exp-slot-top">
                            <img src="${sprite}" class="exp-slot-sprite" onerror="this.style.display='none'">
                            <div class="exp-slot-info">
                                <div class="exp-slot-name">${heroData?.displayName || exp.heroClass}</div>
                                <div class="exp-slot-phase">${exp.phaseName || exp.faseId || exp.phaseId} · ${DIFF_LABEL[exp.difficulty]}</div>
                            </div>
                        </div>
                        <div class="exp-slot-cta">✅ Ver resultado e coletar</div>
                    </div>
                `);
                continue;
            }

            const elapsed = Date.now() - exp.startedAt;
            const restante = Math.max(0, exp.durationMs - elapsed);
            const mins = Math.ceil(restante / 60000);
            const pct = Math.min(100, (elapsed / exp.durationMs) * 100);
            const chancePct = Math.round(exp.chance * 100);

            slotsHTML.push(`
                <div class="exp-slot running">
                    <div class="exp-slot-top">
                        <img src="${sprite}" class="exp-slot-sprite" onerror="this.style.display='none'">
                        <div class="exp-slot-info">
                            <div class="exp-slot-name">${heroData?.displayName || exp.heroClass}</div>
                            <div class="exp-slot-phase">${exp.phaseName || exp.faseId || exp.phaseId} · ${DIFF_LABEL[exp.difficulty]}</div>
                        </div>
                    </div>
                    <div class="exp-slot-progress">
                        <div class="exp-slot-progress-fill" style="width:${pct}%"></div>
                    </div>
                    <div class="exp-slot-meta">
                        <span>⏱ ${mins}min</span>
                        <span>🎲 ${chancePct}%</span>
                    </div>
                </div>
            `);
        }

        container.innerHTML = slotsHTML.join('');
    }

    window._expVerResultado = function(expId) {
        const exp = STORY_PROGRESS.expeditions.find(e => e.id === expId);
        if (!exp || !exp.concluida || exp.coletada) return;

        const heroData = STORY_HERO_CLASSES[exp.heroClass];
        const sprite = (typeof SPRITES !== 'undefined' && SPRITES[exp.heroClass]) || '';
        const r = exp.resultado || { sucesso: false, xp: 0, gold: 0, drops: [] };

        // Aplica recompensas
        if (r.xp > 0) STORY_PROGRESS.totalXP = (STORY_PROGRESS.totalXP || 0) + r.xp;
        if (r.gold > 0) STORY_PROGRESS.gold = (STORY_PROGRESS.gold || 0) + r.gold;
        if (r.drops?.length) {
            r.drops.forEach(d => {
                if (typeof addMaterial === 'function') addMaterial(d.id, d.qty);
            });
        }

        // P2: sai do array na hora da coleta. Antes ficava marcada como
        // "coletada" e só saía no botão VOLTAR À OCA — fechar de outro
        // jeito deixava a entrada no save para sempre.
        exp.coletada = true;
        STORY_PROGRESS.expeditions = (STORY_PROGRESS.expeditions || []).filter(e => e.id !== expId);
        if (typeof saveStoryProgress === 'function') saveStoryProgress();

        const old = document.getElementById('expResultOverlay');
        if (old) old.remove();

        const ov = document.createElement('div');
        ov.id = 'expResultOverlay';
        ov.className = 'exp-result-overlay';

        const dropsHTML = (r.drops || []).length > 0
            ? r.drops.map(d => {
                const m = STORY_MATERIALS[d.id];
                return m ? `<span class="exp-drop">${m.emoji} ${m.name} ×${d.qty}</span>` : '';
            }).join('')
            : '<span class="exp-drop-empty">Nenhum material</span>';

        ov.innerHTML = `
            <div class="exp-result-panel ${r.sucesso ? 'success' : 'failure'}">
                <div class="exp-result-title">${r.sucesso ? '✅ EXPEDIÇÃO CONCLUÍDA' : '❌ EXPEDIÇÃO FALHOU'}</div>
                <div class="exp-result-hero">
                    <img src="${sprite}" class="exp-result-sprite" onerror="this.style.display='none'">
                    <div class="exp-result-hero-name">${heroData?.displayName || exp.heroClass}</div>
                    <div class="exp-result-hero-phase">${exp.phaseName || exp.faseId || exp.phaseId} · ${DIFF_LABEL[exp.difficulty]}</div>
                </div>
                <div class="exp-result-rewards">
                    ${r.xp > 0 ? `<div class="exp-result-xp">+${r.xp} XP</div>` : ''}
                    ${r.gold > 0 ? `<div class="exp-result-gold">+${r.gold} ouro</div>` : ''}
                    <div class="exp-result-drops">${dropsHTML}</div>
                </div>
                ${!r.sucesso ? `<div class="exp-result-hint">💡 O herói voltou com 15% do XP como aprendizado.</div>` : ''}
                <button class="exp-result-btn" onclick="window._expFecharResultado()">VOLTAR À OCA</button>
            </div>
        `;
        document.body.appendChild(ov);

        window._expFecharResultado = () => {
            ov.remove();
            // Remove a expedição do array
            STORY_PROGRESS.expeditions = STORY_PROGRESS.expeditions.filter(e => e.id !== expId);
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
            if (typeof renderOcaScreenFiltered === 'function') renderOcaScreenFiltered();
        };

        // Atualiza slots imediatamente
        renderSlots();
    };

    // ═══════════════════════════════════════════════════════════
    // HOOK: renderOcaScreenFiltered
    // ═══════════════════════════════════════════════════════════
    const _origOca = window.renderOcaScreenFiltered;
    if (typeof _origOca === 'function' && !_origOca._v79) {
        window.renderOcaScreenFiltered = function() {
            const r = _origOca.apply(this, arguments);

            setTimeout(() => {
                // Injeta slots no topo do grid (antes dos heróis)
                const grid = document.querySelector('.story-heroes-grid');
                if (grid && !document.getElementById('expedicaoSlots')) {
                    const container = document.createElement('div');
                    container.id = 'expedicaoSlots';
                    container.className = 'expedicao-slots';
                    grid.parentNode.insertBefore(container, grid);
                }
                renderSlots();

                // Injeta botões nos cards
                injetarBotaoExpedicao();

                // Verifica conclusões imediatamente
                verificarConclusoes();
            }, 100);

            return r;
        };
        window.renderOcaScreenFiltered._v79 = true;
    }

    // Bloqueia herói em expedição na seleção (via wrapper de toggleHeroSelection)
    const _origToggle = window.toggleHeroSelection;
    if (typeof _origToggle === 'function' && !_origToggle._v79) {
        window.toggleHeroSelection = function(heroClass) {
            if (heroiEmExpedicao(heroClass)) {
                if (typeof showToast === 'function') {
                    showToast('⛺', `${STORY_HERO_CLASSES[heroClass]?.displayName || heroClass} está em expedição.`, '⛺');
                }
                return;
            }
            return _origToggle.apply(this, arguments);
        };
        window.toggleHeroSelection._v79 = true;
    }

    // ═══════════════════════════════════════════════════════════
    // CSS
    // ═══════════════════════════════════════════════════════════
    if (!document.getElementById('v79CSS')) {
        const s = document.createElement('style');
        s.id = 'v79CSS';
        s.textContent = `
            /* ========== BOTÃO 🗺️ NO CARD ========== */
            .hero-expedition-btn {
                position: absolute;
                top: 8px;
                right: 38px;
                width: 28px; height: 28px;
                border-radius: 50%;
                background: linear-gradient(135deg, #2a4a6a, #1a2f45);
                color: #d0e8f5;
                border: 2px solid #4a8cb5;
                font-size: 1rem;
                cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                z-index: 10;
                box-shadow: 0 2px 6px rgba(0,0,0,.5);
                transition: all .15s;
            }
            .hero-expedition-btn:hover:not(:disabled) { transform: scale(1.15); background: #4a8cb5; }
            .hero-expedition-btn:disabled { cursor: not-allowed; }

            /* ========== SLOTS NO TOPO DA OCA ========== */
            .expedicao-slots {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 12px;
                margin-bottom: 20px;
                padding: 12px;
                background: linear-gradient(180deg, rgba(58,124,165,.08), transparent 40%), rgba(10,6,2,.4);
                border: 1px solid rgba(74,140,181,.3);
                border-radius: 8px;
            }
            .exp-slot {
                background: rgba(10,6,2,.7);
                border: 1px solid rgba(201,162,39,.25);
                border-radius: 6px;
                padding: 10px;
                min-height: 90px;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .exp-slot.empty {
                align-items: center;
                justify-content: center;
                border-style: dashed;
                opacity: .5;
            }
            .exp-slot-empty-text { color: #6a5024; font-family: 'EB Garamond', serif; font-style: italic; font-size: .85rem; }
            .exp-slot.running { border-color: rgba(74,140,181,.5); }
            .exp-slot.concluded {
                border-color: #6ba35c;
                background: linear-gradient(180deg, rgba(107,163,92,.15), transparent 60%), rgba(10,6,2,.7);
                cursor: pointer;
                animation: expSlotPulse 1.5s ease-in-out infinite alternate;
            }
            @keyframes expSlotPulse {
                from { box-shadow: 0 0 8px rgba(107,163,92,.3); }
                to   { box-shadow: 0 0 20px rgba(107,163,92,.7); }
            }
            .exp-slot-top { display: flex; gap: 8px; align-items: center; }
            .exp-slot-sprite { width: 36px; height: 36px; object-fit: contain; flex-shrink: 0; }
            .exp-slot-info { flex: 1; min-width: 0; }
            .exp-slot-name { font-family: 'Cinzel', serif; color: #f0e2c0; font-size: .85rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .exp-slot-phase { font-family: 'EB Garamond', serif; color: #b8a577; font-size: .75rem; }
            .exp-slot-progress { height: 6px; background: #1a1208; border-radius: 3px; overflow: hidden; border: 1px solid rgba(74,140,181,.3); }
            .exp-slot-progress-fill { height: 100%; background: linear-gradient(90deg, #4a8cb5, #8ac0e0); transition: width 1s linear; }
            .exp-slot-meta { display: flex; justify-content: space-between; font-family: 'Cinzel', serif; font-size: .7rem; color: #8a7a52; }
            .exp-slot-cta { font-family: 'Cinzel', serif; font-size: .75rem; color: #8ac070; text-align: center; font-weight: 700; letter-spacing: 1px; }

            /* ========== MODAL DE EXPEDIÇÃO ========== */
            .expedicao-overlay {
                position: fixed; inset: 0;
                background: rgba(10,6,2,.92);
                z-index: 20000;
                display: flex; align-items: flex-start; justify-content: center;
                padding: 20px; overflow-y: auto;
                animation: fadeIn .2s ease;
            }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            .expedicao-panel {
                background: linear-gradient(180deg, #2a1f10, #1a1208);
                border: 2px solid #4a8cb5;
                border-radius: 8px;
                max-width: 560px; width: 100%;
                padding: 20px; margin: auto;
                box-shadow: 0 10px 40px rgba(0,0,0,.9), 0 0 30px rgba(74,140,181,.3);
            }
            .expedicao-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(74,140,181,.3); padding-bottom: 12px; margin-bottom: 16px; }
            .exp-hero { display: flex; align-items: center; gap: 12px; }
            .exp-hero-sprite { width: 48px; height: 48px; object-fit: contain; }
            .exp-hero-name { font-family: 'Cinzel', serif; color: #e8b923; font-size: 1.1rem; font-weight: 700; }
            .exp-hero-power { font-family: 'EB Garamond', serif; color: #b8a577; font-size: .9rem; }
            .exp-hero-power b { color: #c39bd3; }
            .exp-close { background: #6a2020; color: #f5c8c8; border: 1px solid #a83232; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-weight: 700; }

            .exp-section { margin-bottom: 14px; }
            .exp-section-title { font-family: 'Cinzel', serif; color: #8a7a52; font-size: .75rem; letter-spacing: 2px; margin-bottom: 8px; }
            .exp-chapter-list, .exp-phase-list, .exp-diff-list { display: flex; flex-wrap: wrap; gap: 6px; }
            .exp-chapter-btn, .exp-phase-btn, .exp-diff-btn {
                padding: 6px 12px;
                background: rgba(10,6,2,.6);
                color: #c8b787;
                border: 1px solid rgba(201,162,39,.3);
                border-radius: 4px;
                cursor: pointer;
                font-family: 'Cinzel', serif;
                font-size: .8rem;
                letter-spacing: 1px;
                transition: all .15s;
            }
            .exp-chapter-btn:hover, .exp-phase-btn:hover, .exp-diff-btn:hover { border-color: #c9a227; color: #e8dcc4; }
            .exp-chapter-btn.active, .exp-phase-btn.active, .exp-diff-btn.active {
                background: linear-gradient(180deg, rgba(232,185,35,.2), transparent 50%), #3d2d18;
                border-color: #e8b923;
                color: #fff5dc;
                box-shadow: 0 0 10px rgba(232,185,35,.3);
            }
            .exp-phase-btn.boss { border-color: rgba(168,50,50,.5); }
            .exp-phase-btn.final { border-color: #8e44ad; }
            .exp-diff-btn { --cor: #c9a227; }
            .exp-diff-btn.active { border-color: var(--cor); }

            .exp-preview {
                background: rgba(10,6,2,.6);
                border: 1px solid rgba(201,162,39,.25);
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 14px;
                display: flex; flex-direction: column; gap: 6px;
            }
            .exp-preview-row { display: flex; justify-content: space-between; align-items: center; font-family: 'EB Garamond', serif; font-size: .9rem; color: #d9c89a; }
            .exp-preview-row b { color: #e8b923; }
            .exp-preview-row.dim { font-size: .8rem; color: #8a7a52; }
            .exp-preview-row.dim b { color: #8ac070; }
            .exp-preview-warn {
                margin-top: 6px; padding: 6px 10px;
                background: rgba(142,68,173,.15);
                border-left: 3px solid #8e44ad;
                border-radius: 4px;
                color: #c39bd3;
                font-family: 'EB Garamond', serif;
                font-size: .85rem;
                font-style: italic;
            }

            .exp-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
            .exp-btn { padding: 10px 20px; border-radius: 4px; cursor: pointer; font-family: 'Cinzel', serif; font-weight: 700; font-size: .9rem; letter-spacing: 1px; transition: all .2s; border: 2px solid; }
            .exp-btn-secondary { background: rgba(10,6,2,.6); color: #c8b787; border-color: #6a5024; }
            .exp-btn-secondary:hover { color: #e8dcc4; border-color: #c9a227; }
            .exp-btn-primary { background: linear-gradient(180deg, rgba(74,140,181,.3), transparent 45%), linear-gradient(135deg, #2a4a6a, #1a2f45); color: #d0e8f5; border-color: #4a8cb5; }
            .exp-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.6), 0 0 25px rgba(74,140,181,.5); }
            .exp-btn-primary:disabled { background: #2a1f10; color: #6a5024; border-color: #3d2d18; cursor: not-allowed; }

            /* ========== MODAL DE RESULTADO ========== */
            .exp-result-overlay {
                position: fixed; inset: 0;
                background: rgba(10,6,2,.95);
                z-index: 21000;
                display: flex; align-items: center; justify-content: center;
                padding: 20px;
                animation: fadeIn .3s ease;
            }
            .exp-result-panel {
                background: linear-gradient(180deg, #2a1f10, #1a1208);
                border: 3px solid;
                border-radius: 10px;
                max-width: 440px; width: 100%;
                padding: 24px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,.9);
            }
            .exp-result-panel.success { border-color: #6ba35c; box-shadow: 0 0 50px rgba(107,163,92,.4), 0 20px 60px rgba(0,0,0,.9); }
            .exp-result-panel.failure { border-color: #a83232; box-shadow: 0 0 50px rgba(168,50,50,.4), 0 20px 60px rgba(0,0,0,.9); }
            .exp-result-title { font-family: 'Cinzel Decorative', serif; font-size: 1.4rem; letter-spacing: 2px; margin-bottom: 16px; }
            .exp-result-panel.success .exp-result-title { color: #8ac070; text-shadow: 0 0 15px rgba(107,163,92,.7); }
            .exp-result-panel.failure .exp-result-title { color: #d05050; text-shadow: 0 0 15px rgba(168,50,50,.7); }
            .exp-result-hero { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-bottom: 16px; }
            .exp-result-sprite { width: 72px; height: 72px; object-fit: contain; }
            .exp-result-hero-name { font-family: 'Cinzel', serif; color: #f0e2c0; font-size: 1.1rem; font-weight: 700; }
            .exp-result-hero-phase { font-family: 'EB Garamond', serif; color: #b8a577; font-size: .9rem; }
            .exp-result-rewards { background: rgba(10,6,2,.5); border-radius: 6px; padding: 14px; margin-bottom: 14px; display: flex; flex-direction: column; gap: 8px; }
            .exp-result-xp, .exp-result-gold { font-family: 'Cinzel', serif; color: #e8b923; font-size: 1.05rem; font-weight: 700; }
            .exp-result-drops { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
            .exp-drop { padding: 3px 10px; background: rgba(201,162,39,.1); border: 1px solid rgba(201,162,39,.3); border-radius: 12px; font-family: 'EB Garamond', serif; font-size: .85rem; color: #d9c89a; }
            .exp-drop-empty { color: #8a7a52; font-family: 'EB Garamond', serif; font-style: italic; font-size: .9rem; }
            .exp-result-hint { font-family: 'EB Garamond', serif; color: #8a7a52; font-size: .85rem; font-style: italic; margin-bottom: 14px; padding: 8px; background: rgba(10,6,2,.4); border-radius: 4px; }
            .exp-result-btn { padding: 12px 24px; background: linear-gradient(180deg, rgba(232,185,35,.2), transparent 45%), linear-gradient(135deg, #8a6a2e, #4a3418); color: #fff5dc; border: 2px solid #e8b923; border-radius: 4px; cursor: pointer; font-family: 'Cinzel', serif; font-weight: 700; font-size: .95rem; letter-spacing: 2px; }
            .exp-result-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.6); }

            @media (max-width: 600px) {
                .expedicao-slots { grid-template-columns: 1fr; }
                .expedicao-panel { padding: 16px; }
                .exp-actions { flex-direction: column; }
                .exp-btn { width: 100%; }
            }
        `;
        document.head.appendChild(s);
    }

    // ═══════════════════════════════════════════════════════════
    // DEBUG
    // ═══════════════════════════════════════════════════════════
    window._debugExpedicoes = function() {
        console.group('=== EXPEDIÇÕES V79 ===');
        console.log('V79 ativo?', window._expedicoesV79);
        console.log('Slots:', getSlots());
        console.log('Estrelas:', typeof getTotalStars === 'function' ? getTotalStars() : 0);
        console.log('Ativas:', getExpedicoesAtivas().length);
        console.log('Por coletar:', getExpedicoesPorColetar().length);
        console.log('Expedições:', STORY_PROGRESS.expeditions);
        console.groupEnd();
    };

    // Força conclusão (teste)
    window._forcarConclusaoExpedicao = function(expId) {
        const exp = STORY_PROGRESS.expeditions.find(e => e.id === expId);
        if (!exp) { console.warn('Não encontrada'); return; }
        exp.startedAt = Date.now() - exp.durationMs - 1000;
        verificarConclusoes();
        console.log('Forçada conclusão de', expId);
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V79] Expedições');
    console.log('═══════════════════════════════════════════════════');
    console.log('• 3 slots base (+1 a cada 100⭐, máx 5)');
    console.log('• Tempo: 30min / 1h / 2h (Normal/Difícil/Pesadelo)');
    console.log('• Chance calculada por heroPower / phaseReq');
    console.log('• Fase 13-4: 10%–30% (final boss)');
    console.log('• Sucesso: 50% XP/ouro + drops normais');
    console.log('• Falha: 15% XP');
    console.log('• Sem estrelas');
    console.log('• Botão 🗺️ no card, slots no topo da OCA');
    console.log('');
    console.log('💡 Debug: window._debugExpedicoes()');
    console.log('💡 Forçar: window._forcarConclusaoExpedicao("exp_ID")');
    console.log('═══════════════════════════════════════════════════');
})();
// ═══════════════════════════════════════════════════════════════
// EXPEDIÇÕES TIPADAS — Sete Selados e Sete Nações
// ═══════════════════════════════════════════════════════════════
(function resolverExpedicoesDeEvento() {
    if (window._resolverExpedicoesDeEvento) return;
    window._resolverExpedicoesDeEvento = true;

    const rewardsEvento = {
        '1': { xp: 80, gold: 50, essencia: 3 },
        '2': { xp: 120, gold: 75, essencia: 6 },
        '3': { xp: 170, gold: 100, essencia: 9 },
        '4': { xp: 230, gold: 140, essencia: 12 },
    };
    const rewardsNacao = {
        '1': { xp: 200, gold: 150, essencia: 3 },
        '2': { xp: 350, gold: 250, essencia: 6 },
        '3': { xp: 500, gold: 400, essencia: 12 },
    };
    const eventMultiplier = { normal: 1, dificil: 1.5, pesadelo: 2 };
    const nationMultiplier = { normal: 1, dificil: 1.5, pesadelo: 2.2 };

    function resultadoPara(exp, sucesso) {
        const base = exp.tipo === 'nacao'
            ? rewardsNacao[String(exp.faseId)]
            : rewardsEvento[String(exp.faseId)];
        const multiplier = exp.tipo === 'nacao'
            ? (nationMultiplier[exp.difficulty] || 1)
            : (eventMultiplier[exp.difficulty] || 1);
        const savedReward = exp.recompensa;

        if (sucesso) {
            const drops = Array.isArray(savedReward?.drops)
                ? savedReward.drops.map(drop => ({ id: drop.id, qty: drop.qty }))
                : base ? [{
                    id: exp.tipo === 'nacao' ? 'essencia_ancestral' : 'essencia_sombria',
                    qty: exp.tipo === 'nacao'
                        ? Math.floor(base.essencia * multiplier)
                        : Math.floor(base.essencia * multiplier),
                }] : [];
            return {
                sucesso: true,
                xp: Number.isFinite(savedReward?.xp) ? savedReward.xp
                    : Math.floor((base?.xp || 0) * 0.5 * multiplier),
                gold: Number.isFinite(savedReward?.gold) ? savedReward.gold
                    : Math.floor((base?.gold || 0) * 0.5 * multiplier),
                drops,
            };
        }

        return {
            sucesso: false,
            xp: Math.floor((base?.xp || 0) * 0.15),
            gold: 0,
            drops: [],
        };
    }

    function concluirExpedicoesTipadas() {
        const expeditions = STORY_PROGRESS?.expeditions;
        if (!Array.isArray(expeditions)) return;
        let changed = false;
        for (const exp of expeditions) {
            if (!['evento', 'nacao'].includes(exp.tipo) || exp.coletada || exp.concluida) continue;
            if (!Number.isFinite(exp.startedAt) || !Number.isFinite(exp.durationMs)
                || Date.now() - exp.startedAt < exp.durationMs) continue;

            const chance = Number(exp.chance);
            const sucesso = Number.isFinite(chance) && Math.random() < Math.max(0, Math.min(1, chance));
            exp.resultado = resultadoPara(exp, sucesso);
            exp.concluida = true;
            changed = true;
        }

        if (changed) {
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
            const screen = document.getElementById('storyScreen');
            if (screen?.classList.contains('active') && screen.innerHTML.includes('OCA')
                && typeof renderOcaScreenFiltered === 'function') {
                renderOcaScreenFiltered();
            }
        }
    }

    // P2: remove do save entradas que já foram pagas (bug antigo do botão).
    function limparColetadasPresas() {
        const exps = STORY_PROGRESS?.expeditions;
        if (!Array.isArray(exps) || exps.length === 0) return;
        const restantes = exps.filter(e => !(e.coletada === true && e.concluida === true));
        if (restantes.length === exps.length) return;
        STORY_PROGRESS.expeditions = restantes;
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
    }
    window._limparExpedicoesColetadas = limparColetadasPresas;

    window._resolverExpedicoesTipadasAgora = concluirExpedicoesTipadas;
    setInterval(() => { limparColetadasPresas(); concluirExpedicoesTipadas(); }, 10000);
})();
// =================================================================
// historia.js — V79.1 — Fixes das Expedições
// -----------------------------------------------------------------
// Corrige 2 bugs:
//   1. STORY_PROGRESS.expeditions virando undefined após reload
//      ou troca de save → guard em todos os acessos + wrapper em
//      loadStoryProgressByName
//   2. Botão 🗺️ sobrepondo as estrelas de raridade → move para
//      top: 64px (abaixo do check)
//
// Cole NO FINAL do historia.js.
// =================================================================
(function fixExpedicoesV79_1() {
    if (window._fixExpedicoesV79_1) return;
    window._fixExpedicoesV79_1 = true;

    // ═══════════════════════════════════════════════════════════
    // 1. GARANTIR EXPEDITIONS SEMPRE
    // ═══════════════════════════════════════════════════════════
    function garantirExpeditions() {
        if (!Array.isArray(STORY_PROGRESS.expeditions)) {
            STORY_PROGRESS.expeditions = [];
            console.log('[V79.1] STORY_PROGRESS.expeditions re-criado');
        }
    }
    garantirExpeditions();

    // Wrapper em loadStoryProgressByName
    const _origLoad = window.loadStoryProgressByName;
    if (typeof _origLoad === 'function' && !_origLoad._v79_1) {
        window.loadStoryProgressByName = function() {
            const r = _origLoad.apply(this, arguments);
            garantirExpeditions();
            return r;
        };
        window.loadStoryProgressByName._v79_1 = true;
        console.log('[V79.1] Hook em loadStoryProgressByName');
    }

    // Wrapper em saveStoryProgress
    const _origSave = window.saveStoryProgress;
    if (typeof _origSave === 'function' && !_origSave._v79_1) {
        window.saveStoryProgress = function() {
            garantirExpeditions();
            return _origSave.apply(this, arguments);
        };
        window.saveStoryProgress._v79_1 = true;
        console.log('[V79.1] Hook em saveStoryProgress');
    }

    // ═══════════════════════════════════════════════════════════
    // 2. SUBSTITUIR _expEnviar (push seguro)
    // ═══════════════════════════════════════════════════════════
    window._expEnviar = () => {
        // Guard: garante array
        garantirExpeditions();

        const ativas = STORY_PROGRESS.expeditions.filter(e => !e.coletada);
        const estrelas = (typeof getTotalStars === 'function') ? getTotalStars() : 0;
        let slots = 3;
        if (estrelas >= 200) slots = 5;
        else if (estrelas >= 100) slots = 4;

        if (ativas.length >= slots) {
            if (typeof showToast === 'function') showToast('⛺', `Slots cheios (${ativas.length}/${slots}).`, '⛺');
            return;
        }

        // Herói já em expedição?
        const jaTem = STORY_PROGRESS.expeditions.some(e =>
            e.heroClass === window._selHeroi && !e.coletada
        );
        if (jaTem) {
            if (typeof showToast === 'function') showToast('⛺', 'Herói já em expedição.', '⛺');
            return;
        }

        // Precisa dos dados globais (definidos no V79)
        const selHeroi = window._selHeroi;
        const selChapter = window._selChapter;
        const selPhase = window._selPhase;
        const selDiff = window._selDiff;

        if (!selHeroi || !selChapter || !selPhase || !selDiff) {
            console.warn('[V79.1] Variáveis de seleção ausentes');
            return;
        }

        const ch = STORY_CHAPTERS[selChapter];
        const ph = ch?.phases.find(p => p.id === selPhase);
        if (!ph) {
            console.warn('[V79.1] Fase não encontrada');
            return;
        }

        // Tempo
        const TEMPO_MS = {
            normal:   30 * 60 * 1000,
            dificil:  60 * 60 * 1000,
            pesadelo: 120 * 60 * 1000,
        };

        // Chance (recalcula aqui)
        function calcHeroPower(heroClass) {
            const hd = STORY_HERO_CLASSES[heroClass];
            if (!hd) return 0;
            const level = (typeof getHeroLevel === 'function') ? getHeroLevel(heroClass) : 1;
            const bonus = (typeof getHeroBonusFromLevel === 'function')
                ? (getHeroBonusFromLevel(heroClass) || {}) : {};
            let hp = (hd.hp || 0) + (bonus.hp || 0);
            let atk = (hd.atk || 0) + (bonus.atk || 0);
            if (typeof getHeroEquipment === 'function') {
                const eq = getHeroEquipment(heroClass);
                if (eq?.arma && typeof getWeaponById === 'function') {
                    const w = getWeaponById(eq.arma);
                    if (w) atk += w.atkBonus || 0;
                }
                if (eq?.amuleto && typeof getAmuletById === 'function') {
                    const a = getAmuletById(eq.amuleto);
                    if (a?.efeito) {
                        atk += a.efeito.atkBonus || 0;
                        hp += a.efeito.hpBonus || 0;
                    }
                }
            }
            return (hp * 2) + (atk * 8) + (level * 15);
        }

        function calcPhaseReq(chapterId, phaseId, difficulty) {
            const ch = STORY_CHAPTERS[chapterId];
            if (!ch) return 1;
            const ph = ch.phases.find(p => p.id === phaseId);
            if (!ph) return 1;
            let hpSum = 0, atkSum = 0;
            ph.enemies.forEach(eid => {
                const e = STORY_ENEMIES[eid];
                if (e) { hpSum += e.hp || 0; atkSum += e.atk || 0; }
            });
            const mult = { normal: 1, dificil: 1.3, pesadelo: 1.6 }[difficulty] || 1;
            return Math.max(1, (hpSum + atkSum * 5) * mult);
        }

        const hp = calcHeroPower(selHeroi);
        const req = calcPhaseReq(selChapter, selPhase, selDiff);
        const isFinal = (selPhase === '13-4');
        const divisor = isFinal ? 3 : 2;
        const minChance = isFinal ? 0.10 : 0.15;
        const maxChance = isFinal ? 0.30 : 0.95;
        const chance = Math.max(minChance, Math.min(maxChance, hp / (req * divisor)));

        const exp = {
            id: 'exp_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            heroClass: selHeroi,
            chapterId: selChapter,
            phaseId: selPhase,
            phaseName: ph.name,
            difficulty: selDiff,
            chance,
            startedAt: Date.now(),
            durationMs: TEMPO_MS[selDiff],
            concluida: false,
            coletada: false,
            resultado: null,
        };
        STORY_PROGRESS.expeditions.push(exp);
        if (typeof saveStoryProgress === 'function') saveStoryProgress();

        if (typeof window._expFechar === 'function') window._expFechar();
        if (typeof showToast === 'function') showToast('⛺', 'Expedição enviada!', '⛺');
        if (typeof playSfx === 'function') { try { playSfx('win'); } catch(e) {} }

        if (typeof renderOcaScreenFiltered === 'function') renderOcaScreenFiltered();
    };

    // ═══════════════════════════════════════════════════════════
    // 3. CSS — mover botão 🗺️ para baixo do check
    // ═══════════════════════════════════════════════════════════
    if (!document.getElementById('v79_1CSS')) {
        const s = document.createElement('style');
        s.id = 'v79_1CSS';
        s.textContent = `
            .hero-expedition-btn {
                top: 64px !important;
                right: 10px !important;
                width: 26px !important;
                height: 26px !important;
                font-size: 0.9rem !important;
            }
            @media (max-width: 480px) {
                .hero-expedition-btn {
                    top: 60px !important;
                    right: 8px !important;
                }
            }
        `;
        document.head.appendChild(s);
        console.log('[V79.1] CSS aplicado (botão movido para baixo do check)');
    }

    // ═══════════════════════════════════════════════════════════
    // 4. Re-injeta botões nos cards existentes
    // ═══════════════════════════════════════════════════════════
    setTimeout(() => {
        const cards = document.querySelectorAll('.story-hero-card');
        cards.forEach(card => {
            const btn = card.querySelector('.hero-expedition-btn');
            if (btn) {
                // Já existe — força CSS
                btn.style.top = '64px';
                btn.style.right = '10px';
            }
        });
    }, 500);

    // ═══════════════════════════════════════════════════════════
    // 5. DEBUG
    // ═══════════════════════════════════════════════════════════
    window._debugExpedicoesV791 = function() {
        console.group('=== V79.1 FIXES ===');
        console.log('V79.1 ativo?', window._fixExpedicoesV79_1);
        console.log('expeditions é array?', Array.isArray(STORY_PROGRESS.expeditions));
        console.log('Total:', STORY_PROGRESS.expeditions?.length || 0);
        console.log('Expedições:', STORY_PROGRESS.expeditions);
        const btn = document.querySelector('.hero-expedition-btn');
        if (btn) {
            const cs = getComputedStyle(btn);
            console.log('Botão 🗺️: top=' + cs.top + ', right=' + cs.right);
        }
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V79.1] Fixes das Expedições');
    console.log('═══════════════════════════════════════════════════');
    console.log('• STORY_PROGRESS.expeditions garantido em save/load');
    console.log('• _expEnviar reescrito (push seguro)');
    console.log('• Botão 🗺️ movido para top:64px (abaixo do check)');
    console.log('');
    console.log('💡 Debug: window._debugExpedicoesV791()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V79.2 — Fix do "Variáveis de seleção ausentes"
// -----------------------------------------------------------------
// O V79.1 reescreveu _expEnviar mas tentou acessar window._selHeroi,
// que nunca foi definido (é variável local da IIFE do V79).
//
// Este V79.2 restaura o _expEnviar original do V79 (que tem acesso
// ao closure) e só adiciona um wrapper que garante o array.
//
// Cole NO FINAL do historia.js (depois do V79 e V79.1).
// =================================================================
(function fixExpedicoesV79_2() {
    if (window._fixExpedicoesV79_2) return;
    window._fixExpedicoesV79_2 = true;

    // ═══════════════════════════════════════════════════════════
    // 1. GARANTIR STORY_PROGRESS.expeditions
    // ═══════════════════════════════════════════════════════════
    function garantirExpeditions() {
        if (typeof STORY_PROGRESS === 'undefined') return;
        if (!Array.isArray(STORY_PROGRESS.expeditions)) {
            STORY_PROGRESS.expeditions = [];
            console.log('[V79.2] STORY_PROGRESS.expeditions re-criado');
        }
    }
    garantirExpeditions();

    // ═══════════════════════════════════════════════════════════
    // 2. RECUPERAR O _expEnviar ORIGINAL DO V79
    // -------------------------------------------------------------
    // Problema: o V79.1 sobrescreveu window._expEnviar com uma versão
    // quebrada. Precisamos do original do V79 (que tem closure).
    //
    // Solução: procurar no escopo global uma referência. Como o V79
    // fez `window._expEnviar = () => { ... }`, a função existe em
    // window MAS foi reescrita pelo V79.1.
    //
    // Precisamos re-executar o V79? Não. Melhor: fazer o V79.2
    // acessar STORY_PROGRESS.expeditions com a mesma lógica, mas
    // LENDO as variáveis via um novo mecanismo.
    //
    // ⭐ Melhor solução: fazer o V79.2 EXPOR as variáveis em window
    // para que o _expEnviar atual (do V79.1) funcione.
    // ═══════════════════════════════════════════════════════════

    // Proxy para as variáveis — precisa interceptar os hooks do V79
    // que setam _selHeroi, _selChapter, _selPhase, _selDiff.
    //
    // Como esses são `let` locais (não acessíveis), precisamos que o
    // V79.1 leia de outro lugar. A solução é substituir os hooks do V79
    // (`window._expSelChapter`, etc.) para também atualizar variáveis em
    // window.

    // ─────────────────────────────────────────────────────────
    // Estado espelho em window
    // ─────────────────────────────────────────────────────────
    if (typeof window._expState !== 'object' || window._expState === null) {
        window._expState = {
            heroClass: null,
            chapterId: null,
            phaseId: null,
            difficulty: 'normal',
        };
    }

    // ═══════════════════════════════════════════════════════════
    // 3. REESCREVER _expEnviar (versão robusta com window._expState)
    // ═══════════════════════════════════════════════════════════
    window._expEnviar = () => {
        garantirExpeditions();

        const st = window._expState;
        const selHeroi = st.heroClass;
        const selChapter = st.chapterId;
        const selPhase = st.phaseId;
        const selDiff = st.difficulty;

        if (!selHeroi || !selChapter || !selPhase || !selDiff) {
            console.warn('[V79.2] Variáveis de seleção ausentes', st);
            if (typeof showToast === 'function') showToast('❌', 'Escolha fase e dificuldade', '❌');
            return;
        }

        // Slots
        const ativas = STORY_PROGRESS.expeditions.filter(e => !e.coletada);
        const estrelas = (typeof getTotalStars === 'function') ? getTotalStars() : 0;
        let slots = 3;
        if (estrelas >= 200) slots = 5;
        else if (estrelas >= 100) slots = 4;

        if (ativas.length >= slots) {
            if (typeof showToast === 'function') showToast('⛺', `Slots cheios (${ativas.length}/${slots}).`, '⛺');
            return;
        }

        // Já em expedição?
        if (STORY_PROGRESS.expeditions.some(e => e.heroClass === selHeroi && !e.coletada)) {
            if (typeof showToast === 'function') showToast('⛺', 'Herói já em expedição.', '⛺');
            return;
        }

        const ch = STORY_CHAPTERS[selChapter];
        const ph = ch?.phases.find(p => p.id === selPhase);
        if (!ph) {
            console.warn('[V79.2] Fase não encontrada:', selPhase);
            return;
        }

        // Tempo
        const TEMPO_MS = {
            normal:   30 * 60 * 1000,
            dificil:  60 * 60 * 1000,
            pesadelo: 120 * 60 * 1000,
        };

        // Poder e chance
        function calcHeroPower(heroClass) {
            const hd = STORY_HERO_CLASSES[heroClass];
            if (!hd) return 0;
            const level = (typeof getHeroLevel === 'function') ? getHeroLevel(heroClass) : 1;
            const bonus = (typeof getHeroBonusFromLevel === 'function')
                ? (getHeroBonusFromLevel(heroClass) || {}) : {};
            let hp = (hd.hp || 0) + (bonus.hp || 0);
            let atk = (hd.atk || 0) + (bonus.atk || 0);
            if (typeof getHeroEquipment === 'function') {
                const eq = getHeroEquipment(heroClass);
                if (eq?.arma && typeof getWeaponById === 'function') {
                    const w = getWeaponById(eq.arma);
                    if (w) atk += w.atkBonus || 0;
                }
                if (eq?.amuleto && typeof getAmuletById === 'function') {
                    const a = getAmuletById(eq.amuleto);
                    if (a?.efeito) {
                        atk += a.efeito.atkBonus || 0;
                        hp += a.efeito.hpBonus || 0;
                    }
                }
            }
            return (hp * 2) + (atk * 8) + (level * 15);
        }

        function calcPhaseReq(chapterId, phaseId, difficulty) {
            const ch2 = STORY_CHAPTERS[chapterId];
            if (!ch2) return 1;
            const ph2 = ch2.phases.find(p => p.id === phaseId);
            if (!ph2) return 1;
            let hpSum = 0, atkSum = 0;
            ph2.enemies.forEach(eid => {
                const e = STORY_ENEMIES[eid];
                if (e) { hpSum += e.hp || 0; atkSum += e.atk || 0; }
            });
            const mult = { normal: 1, dificil: 1.3, pesadelo: 1.6 }[difficulty] || 1;
            return Math.max(1, (hpSum + atkSum * 5) * mult);
        }

        const hp = calcHeroPower(selHeroi);
        const req = calcPhaseReq(selChapter, selPhase, selDiff);
        const isFinal = (selPhase === '13-4');
        const divisor = isFinal ? 3 : 2;
        const minChance = isFinal ? 0.10 : 0.15;
        const maxChance = isFinal ? 0.30 : 0.95;
        const chance = Math.max(minChance, Math.min(maxChance, hp / (req * divisor)));

        const exp = {
            id: 'exp_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            heroClass: selHeroi,
            chapterId: selChapter,
            phaseId: selPhase,
            phaseName: ph.name,
            difficulty: selDiff,
            chance,
            startedAt: Date.now(),
            durationMs: TEMPO_MS[selDiff],
            concluida: false,
            coletada: false,
            resultado: null,
        };
        STORY_PROGRESS.expeditions.push(exp);
        if (typeof saveStoryProgress === 'function') saveStoryProgress();

        if (typeof window._expFechar === 'function') window._expFechar();
        if (typeof showToast === 'function') showToast('⛺', 'Expedição enviada!', '⛺');
        if (typeof playSfx === 'function') { try { playSfx('win'); } catch(e) {} }
        if (typeof renderOcaScreenFiltered === 'function') renderOcaScreenFiltered();
    };

    // ═══════════════════════════════════════════════════════════
    // 4. INTERCEPTAR OS HOOKS DE SELEÇÃO (para atualizar window._expState)
    // ═══════════════════════════════════════════════════════════
    // O V79 define window._expSelChapter, etc. Precisamos interceptar
    // para espelhar em window._expState.

    const _origSelChapter = window._expSelChapter;
    if (typeof _origSelChapter === 'function' && !_origSelChapter._v79_2) {
        window._expSelChapter = function(cid) {
            window._expState.chapterId = cid;
            window._expState.phaseId = null;
            return _origSelChapter.apply(this, arguments);
        };
        window._expSelChapter._v79_2 = true;
    }

    const _origSelPhase = window._expSelPhase;
    if (typeof _origSelPhase === 'function' && !_origSelPhase._v79_2) {
        window._expSelPhase = function(pid) {
            window._expState.phaseId = pid;
            return _origSelPhase.apply(this, arguments);
        };
        window._expSelPhase._v79_2 = true;
    }

    const _origSelDiff = window._expSelDiff;
    if (typeof _origSelDiff === 'function' && !_origSelDiff._v79_2) {
        window._expSelDiff = function(d) {
            window._expState.difficulty = d;
            return _origSelDiff.apply(this, arguments);
        };
        window._expSelDiff._v79_2 = true;
    }

    // ═══════════════════════════════════════════════════════════
    // 5. INTERCEPTAR openEquipScreen (para setar heroClass)
    // ═══════════════════════════════════════════════════════════
    // O V79 chama abrirTelaExpedicao(heroClass) que seta _selHeroi.
    // Não conseguimos interceptar essa função interna. Solução:
    // interceptar o clique no botão 🗺️ para capturar heroClass.

    function _capturarHeroClass() {
        const cards = document.querySelectorAll('.story-hero-card');
        cards.forEach(card => {
            const btn = card.querySelector('.hero-expedition-btn');
            if (!btn || btn._v79_2) return;

            const onclickAttr = card.getAttribute('onclick') || '';
            const match = onclickAttr.match(/toggleHeroSelection\('((?:\\'|[^'])*)'\)/);
            if (!match) return;
            const heroClass = match[1].replace(/\\'/g, "'");

            // Wrapper no onclick original
            const origOnClick = btn.onclick;
            btn.onclick = (e) => {
                window._expState.heroClass = heroClass;
                window._expState.chapterId = null;
                window._expState.phaseId = null;
                window._expState.difficulty = 'normal';
                if (typeof origOnClick === 'function') {
                    return origOnClick.call(btn, e);
                }
            };
            btn._v79_2 = true;
        });
    }

    // Injeta ao renderizar a OCA (após o V79 injetar os botões)
    const _origOca = window.renderOcaScreenFiltered;
    if (typeof _origOca === 'function' && !_origOca._v79_2) {
        window.renderOcaScreenFiltered = function() {
            const r = _origOca.apply(this, arguments);
            setTimeout(_capturarHeroClass, 200);
            setTimeout(_capturarHeroClass, 500);
            return r;
        };
        window.renderOcaScreenFiltered._v79_2 = true;
    }

    // Também roda nos botões existentes
    setTimeout(_capturarHeroClass, 300);
    setTimeout(_capturarHeroClass, 800);

    // Observer para captar novos cards
    const obs = new MutationObserver(() => {
        const cards = document.querySelectorAll('.story-hero-card .hero-expedition-btn:not(._v79_2-wrapper)');
        if (cards.length > 0) _capturarHeroClass();
    });
    obs.observe(document.body, { childList: true, subtree: true });

    // ═══════════════════════════════════════════════════════════
    // 6. Garantir expeditions em save/load
    // ═══════════════════════════════════════════════════════════
    const _origLoad = window.loadStoryProgressByName;
    if (typeof _origLoad === 'function' && !_origLoad._v79_2) {
        window.loadStoryProgressByName = function() {
            const r = _origLoad.apply(this, arguments);
            garantirExpeditions();
            return r;
        };
        window.loadStoryProgressByName._v79_2 = true;
    }

    // ═══════════════════════════════════════════════════════════
    // 7. DEBUG
    // ═══════════════════════════════════════════════════════════
    window._debugExpV792 = function() {
        console.group('=== V79.2 ===');
        console.log('V79.2 ativo?', window._fixExpedicoesV79_2);
        console.log('window._expState:', window._expState);
        console.log('expeditions é array?', Array.isArray(STORY_PROGRESS.expeditions));
        console.log('Total:', STORY_PROGRESS.expeditions?.length || 0);
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V79.2] Fix do "Variáveis de seleção ausentes"');
    console.log('═══════════════════════════════════════════════════');
    console.log('• window._expState espelha as variáveis de seleção');
    console.log('• _expEnviar lê de window._expState');
    console.log('• Hooks de seleção atualizam o espelho');
    console.log('• Botão 🗺️ captura heroClass no clique');
    console.log('');
    console.log('💡 Debug: window._debugExpV792()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V79.5 — Slots em modal (versão final, sem loop)
// -----------------------------------------------------------------
// Substitui V79.3 e V79.4. A diferença crucial:
//
//   • ZERO MutationObserver no document.body (era a fonte do loop)
//   • Botão EXPEDIÇÕES injetado via hook síncrono no render da OCA
//   • Atualização do contador via data-attribute + CSS (não toca DOM)
//   • Delegação de evento única para capturar cliques
//   • Auto-atualização via setInterval leve (3s), não observer
//
// Cole NO FINAL do historia.js (depois do V79, V79.1, V79.2).
// =================================================================
(function expedicoesFinalV79_5() {
    if (window._expedicoesFinalV79_5) return;
    window._expedicoesFinalV79_5 = true;

    console.log('[V79.5] Instalando versão final...');

    // ═══════════════════════════════════════════════════════════
    // 1. LIMPEZA INICIAL
    // ═══════════════════════════════════════════════════════════
    // Remove botões residuais do V79.3/V79.4
    document.querySelectorAll('.oca-expedicoes-btn').forEach(b => b.remove());
    // Remove overlays residuais
    const oldOverlay = document.getElementById('expedicoesListaOverlay');
    if (oldOverlay) oldOverlay.remove();

    // ═══════════════════════════════════════════════════════════
    // 2. CSS
    // ═══════════════════════════════════════════════════════════
    if (!document.getElementById('v79_5CSS')) {
        const s = document.createElement('style');
        s.id = 'v79_5CSS';
        s.textContent = `
            #expedicaoSlots { display: none !important; }

            .oca-expedicoes-btn {
                padding: 8px 16px;
                background:
                    linear-gradient(180deg, rgba(74,140,181,.25), transparent 45%),
                    linear-gradient(135deg, #2a4a6a, #1a2f45);
                color: #d0e8f5;
                border: 2px solid #4a8cb5;
                border-radius: 20px;
                cursor: pointer;
                font-family: 'Cinzel', serif;
                font-weight: 700;
                font-size: .85rem;
                letter-spacing: 1px;
                transition: all .2s;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }
            .oca-expedicoes-btn:hover {
                transform: translateY(-2px);
                border-color: #6ab0d8;
                box-shadow: 0 4px 15px rgba(0,0,0,.5), 0 0 20px rgba(74,140,181,.4);
            }
            .oca-expedicoes-btn::after {
                content: attr(data-counter);
                color: #8ac070;
                font-size: .7rem;
                padding: 2px 7px;
                background: rgba(107,163,92,.2);
                border-radius: 10px;
                margin-left: 4px;
                font-weight: 700;
            }
            .oca-expedicoes-btn[data-pronto="1"] {
                border-color: #e8b923;
                box-shadow: 0 0 15px rgba(232,185,35,.6);
            }
            .oca-expedicoes-btn[data-pronto="1"]::after {
                color: #fff5dc;
                background: rgba(232,185,35,.5);
                animation: expBadgePulseV5 1.5s ease-in-out infinite alternate;
            }
            @keyframes expBadgePulseV5 {
                from { box-shadow: 0 0 4px rgba(232,185,35,.3); }
                to   { box-shadow: 0 0 14px rgba(232,185,35,.9); }
            }

            .expedicoes-lista-overlay {
                position: fixed; inset: 0;
                background: rgba(10,6,2,.92);
                z-index: 20000;
                display: flex; align-items: flex-start; justify-content: center;
                padding: 20px; overflow-y: auto;
            }
            .expedicoes-lista-panel {
                background: linear-gradient(180deg, #2a1f10, #1a1208);
                border: 2px solid #4a8cb5;
                border-radius: 8px;
                max-width: 640px; width: 100%;
                padding: 20px; margin: auto;
                box-shadow: 0 10px 40px rgba(0,0,0,.9), 0 0 30px rgba(74,140,181,.3);
            }
            .expedicoes-lista-header {
                display: flex; justify-content: space-between; align-items: center;
                border-bottom: 1px solid rgba(74,140,181,.3);
                padding-bottom: 12px; margin-bottom: 16px;
            }
            .expedicoes-lista-titulo {
                font-family: 'Cinzel Decorative', serif;
                color: #6ab0d8; font-size: 1.3rem; letter-spacing: 3px;
            }
            .expedicoes-lista-close {
                background: #6a2020; color: #f5c8c8; border: 1px solid #a83232;
                border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-weight: 700;
            }
            .expedicoes-lista-footer { margin-top: 16px; text-align: center; }
        `;
        document.head.appendChild(s);
    }

    // ═══════════════════════════════════════════════════════════
    // 3. CONTADOR
    // ═══════════════════════════════════════════════════════════
    const DIFF_LABEL = { normal: 'Normal', dificil: 'Difícil', pesadelo: 'Pesadelo' };

    function calcularSlots() {
        const estrelas = (typeof getTotalStars === 'function') ? getTotalStars() : 0;
        if (estrelas >= 200) return 5;
        if (estrelas >= 100) return 4;
        return 3;
    }

    function calcularContador() {
        const slots = calcularSlots();
        const exps = Array.isArray(STORY_PROGRESS.expeditions) ? STORY_PROGRESS.expeditions : [];
        const ativas = exps.filter(e => !e.coletada).length;
        const prontas = exps.filter(e => !e.coletada && e.concluida).length;
        return {
            texto: prontas > 0 ? `${prontas} pronto${prontas > 1 ? 's' : ''}` : `${ativas}/${slots}`,
            pronto: prontas > 0,
        };
    }

    function atualizarContadorBtn(btn) {
        if (!btn) return;
        const { texto, pronto } = calcularContador();
        if (btn.getAttribute('data-counter') !== texto) {
            btn.setAttribute('data-counter', texto);
        }
        const novoPronto = pronto ? '1' : '0';
        if (btn.getAttribute('data-pronto') !== novoPronto) {
            btn.setAttribute('data-pronto', novoPronto);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // 4. INJETAR BOTÃO (síncrono, sem observer)
    // ═══════════════════════════════════════════════════════════
    function injetarBotao() {
        const title = document.querySelector('.story-title');
        if (!title) return;
        if (!title.textContent.includes('OCA')) return;

        // Se já existe, só atualiza o contador
        let btn = document.querySelector('.oca-expedicoes-btn');
        if (btn) { atualizarContadorBtn(btn); return; }

        const header = document.querySelector('.story-header');
        if (!header) return;

        const starsContainer = header.querySelector('.story-stars-counter');
        const wrapper = starsContainer?.parentElement;
        if (!wrapper) return;

        if (getComputedStyle(wrapper).display !== 'flex') {
            wrapper.style.display = 'flex';
            wrapper.style.justifyContent = 'center';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '12px';
            wrapper.style.flexWrap = 'wrap';
        }

        btn = document.createElement('button');
        btn.className = 'oca-expedicoes-btn';
        btn.textContent = '⛺ EXPEDIÇÕES';
        btn.setAttribute('data-acao', 'abrir-expedicoes');
        btn.setAttribute('data-counter', '0/3');
        btn.setAttribute('data-pronto', '0');
        wrapper.appendChild(btn);
        atualizarContadorBtn(btn);
    }

    // ═══════════════════════════════════════════════════════════
    // 5. MODAL DE SLOTS
    // ═══════════════════════════════════════════════════════════
    function renderSlotsModal() {
        const container = document.getElementById('expedicaoSlotsModal');
        if (!container) return;

        const slots = calcularSlots();
        const exps = Array.isArray(STORY_PROGRESS.expeditions) ? STORY_PROGRESS.expeditions : [];
        const ativas = exps.filter(e => !e.coletada);
        const ordenadas = [...ativas].sort((a, b) => {
            if (a.concluida && !b.concluida) return -1;
            if (!a.concluida && b.concluida) return 1;
            return a.startedAt - b.startedAt;
        });

        const slotsHTML = [];
        for (let i = 0; i < slots; i++) {
            const exp = ordenadas[i];
            if (!exp) {
                slotsHTML.push(`<div class="exp-slot empty"><span class="exp-slot-empty-text">Slot vazio</span></div>`);
                continue;
            }
            const heroData = STORY_HERO_CLASSES[exp.heroClass];
            const sprite = (typeof SPRITES !== 'undefined' && SPRITES[exp.heroClass]) || '';

            if (exp.concluida) {
                slotsHTML.push(`
                    <div class="exp-slot concluded" data-acao="coletar-exp" data-exp-id="${exp.id}">
                        <div class="exp-slot-top">
                            <img src="${sprite}" class="exp-slot-sprite" onerror="this.style.display='none'">
                            <div class="exp-slot-info">
                                <div class="exp-slot-name">${heroData?.displayName || exp.heroClass}</div>
                                <div class="exp-slot-phase">${exp.phaseName || exp.faseId || exp.phaseId} · ${DIFF_LABEL[exp.difficulty]}</div>
                            </div>
                        </div>
                        <div class="exp-slot-cta">✅ Ver resultado e coletar</div>
                    </div>
                `);
                continue;
            }

            const elapsed = Date.now() - exp.startedAt;
            const restante = Math.max(0, exp.durationMs - elapsed);
            const mins = Math.ceil(restante / 60000);
            const pct = Math.min(100, (elapsed / exp.durationMs) * 100);
            const chancePct = Math.round(exp.chance * 100);

            slotsHTML.push(`
                <div class="exp-slot running">
                    <div class="exp-slot-top">
                        <img src="${sprite}" class="exp-slot-sprite" onerror="this.style.display='none'">
                        <div class="exp-slot-info">
                            <div class="exp-slot-name">${heroData?.displayName || exp.heroClass}</div>
                            <div class="exp-slot-phase">${exp.phaseName || exp.faseId || exp.phaseId} · ${DIFF_LABEL[exp.difficulty]}</div>
                        </div>
                    </div>
                    <div class="exp-slot-progress">
                        <div class="exp-slot-progress-fill" style="width:${pct}%"></div>
                    </div>
                    <div class="exp-slot-meta">
                        <span>⏱ ${mins}min</span>
                        <span>🎲 ${chancePct}%</span>
                    </div>
                </div>
            `);
        }
        container.innerHTML = slotsHTML.join('');
    }

    function abrirModal() {
        const old = document.getElementById('expedicoesListaOverlay');
        if (old) old.remove();

        const ov = document.createElement('div');
        ov.id = 'expedicoesListaOverlay';
        ov.className = 'expedicoes-lista-overlay';
        ov.onclick = (e) => { if (e.target === ov) fecharModal(); };
        ov.innerHTML = `
            <div class="expedicoes-lista-panel">
                <div class="expedicoes-lista-header">
                    <div class="expedicoes-lista-titulo">⛺ EXPEDIÇÕES</div>
                    <button class="expedicoes-lista-close" data-acao="fechar-expedicoes">✕</button>
                </div>
                <div class="expedicao-slots" id="expedicaoSlotsModal"></div>
                <div class="expedicoes-lista-footer">
                    <button class="exp-btn exp-btn-secondary" data-acao="fechar-expedicoes">Voltar</button>
                </div>
            </div>
        `;
        document.body.appendChild(ov);
        renderSlotsModal();

        if (window._expListaTimer) clearInterval(window._expListaTimer);
        window._expListaTimer = setInterval(() => {
            if (document.getElementById('expedicoesListaOverlay')) renderSlotsModal();
            else { clearInterval(window._expListaTimer); window._expListaTimer = null; }
        }, 5000);
    }

    function fecharModal() {
        const ov = document.getElementById('expedicoesListaOverlay');
        if (ov) ov.remove();
        if (window._expListaTimer) {
            clearInterval(window._expListaTimer);
            window._expListaTimer = null;
        }
    }

    window._expAbrirLista = abrirModal;
    window._expFecharLista = fecharModal;

    // ═══════════════════════════════════════════════════════════
    // 6. DELEGAÇÃO DE EVENTO (ÚNICA, SEM OBSERVER)
    // ═══════════════════════════════════════════════════════════
    // Um único listener no document captura TODOS os cliques
    // relevantes via data-acao. Nada de observers.
    document.addEventListener('click', (ev) => {
        const alvo = ev.target.closest('[data-acao]');
        if (!alvo) return;
        const acao = alvo.getAttribute('data-acao');

        if (acao === 'abrir-expedicoes') {
            ev.preventDefault();
            ev.stopPropagation();
            abrirModal();
        } else if (acao === 'fechar-expedicoes') {
            ev.preventDefault();
            ev.stopPropagation();
            fecharModal();
        } else if (acao === 'coletar-exp') {
            ev.preventDefault();
            ev.stopPropagation();
            const expId = alvo.getAttribute('data-exp-id');
            if (expId && typeof window._expVerResultado === 'function') {
                window._expVerResultado(expId);
                setTimeout(() => { if (document.getElementById('expedicoesListaOverlay')) renderSlotsModal(); }, 200);
                setTimeout(atualizarContadorNoHeader, 400);
            }
        }
    }, true);

    // ═══════════════════════════════════════════════════════════
    // 7. HOOK ÚNICO NO RENDER (substitui a cadeia anterior)
    // ═══════════════════════════════════════════════════════════
    if (!window._renderOcaBaseV795) {
        window._renderOcaBaseV795 = window.renderOcaScreenFiltered;
    }

    window.renderOcaScreenFiltered = function() {
        const r = window._renderOcaBaseV795.apply(this, arguments);
        // Síncrono: o botão já existe quando a OCA aparece
        try { injetarBotao(); } catch(e) { console.warn('[V79.5] injetarBotao:', e); }
        return r;
    };

    function atualizarContadorNoHeader() {
        const btn = document.querySelector('.oca-expedicoes-btn');
        if (btn) atualizarContadorBtn(btn);
    }

    // ═══════════════════════════════════════════════════════════
    // 8. AUTO-ATUALIZAÇÃO (setInterval leve, sem observer)
    // ═══════════════════════════════════════════════════════════
    setInterval(() => {
        atualizarContadorNoHeader();
        // Se o botão sumiu (algum render), reinjeta
        if (!document.querySelector('.oca-expedicoes-btn')) {
            try { injetarBotao(); } catch(e) {}
        }
    }, 3000);

    // ═══════════════════════════════════════════════════════════
    // 9. HOOKS DOS MODAIS (atualiza contador ao enviar/coletar)
    // ═══════════════════════════════════════════════════════════
    const _origVer = window._expVerResultado;
    if (typeof _origVer === 'function' && !_origVer._v79_5) {
        window._expVerResultado = function() {
            const r = _origVer.apply(this, arguments);
            setTimeout(atualizarContadorNoHeader, 300);
            setTimeout(atualizarContadorNoHeader, 800);
            return r;
        };
        window._expVerResultado._v79_5 = true;
    }

    const _origEnv = window._expEnviar;
    if (typeof _origEnv === 'function' && !_origEnv._v79_5) {
        window._expEnviar = function() {
            const r = _origEnv.apply(this, arguments);
            setTimeout(atualizarContadorNoHeader, 300);
            setTimeout(atualizarContadorNoHeader, 800);
            return r;
        };
        window._expEnviar._v79_5 = true;
    }

    // ═══════════════════════════════════════════════════════════
    // 10. Cria botão imediatamente se já está na OCA
    // ═══════════════════════════════════════════════════════════
    setTimeout(injetarBotao, 100);
    setTimeout(injetarBotao, 500);
    setTimeout(injetarBotao, 1500);

    // ═══════════════════════════════════════════════════════════
    // 11. DEBUG
    // ═══════════════════════════════════════════════════════════
    window._debugExpV795 = function() {
        const btn = document.querySelector('.oca-expedicoes-btn');
        console.group('=== V79.5 ===');
        console.log('V79.5 ativo?', window._expedicoesFinalV79_5);
        console.log('Botão existe?', !!btn);
        if (btn) {
            console.log('  data-counter:', btn.getAttribute('data-counter'));
            console.log('  data-pronto:', btn.getAttribute('data-pronto'));
        }
        console.log('Modal aberto?', !!document.getElementById('expedicoesListaOverlay'));
        console.log('expeditions:', STORY_PROGRESS.expeditions);
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V79.5] Slots em modal (sem loop)');
    console.log('═══════════════════════════════════════════════════');
    console.log('• ZERO MutationObserver no body');
    console.log('• Botão injetado via hook síncrono');
    console.log('• Contador via data-attr (não dispara observer)');
    console.log('• Delegação de evento única');
    console.log('• Auto-atualização via setInterval (3s)');
    console.log('');
    console.log('💡 Debug: window._debugExpV795()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V80 — Restaurar PA do Rudá (seleção de tile)
// -----------------------------------------------------------------
// O V75 quebrou o PA do Rudá (getPATiles não tem caso para
// 'ruda_flecha_amor'). Este patch wrappa o triggerBravelyChain
// por cima do V75 e intercepta SÓ o Rudá, restaurando:
//   • Seleção de tile (qualquer tile do tabuleiro)
//   • Cruz completa (linha + coluna) no tile escolhido
//   • Dano PA se o boss estiver na cruz
//   • Conversão pra AR
//
// Outros heróis novos → delegam pro V75 (FX leve)
// Curupira → delega pro V68 (V75 também delega)
// PvP/Coop → delega pro original
//
// Cole NO FINAL do historia.js.
// =================================================================
(function fixRudaPAV80() {
    if (window._fixRudaPAV80) return;
    window._fixRudaPAV80 = true;

    const PA_KEY = 'ruda_flecha_amor';
    const _sleep = (ms) => new Promise(r => setTimeout(r, ms));

    let _resolveV80 = null;
    let _ativoV80 = false;
    window._rudaSelectingV80 = false;

    // ═══════════════════════════════════════════════════════════
    // 1. ABRIR SELEÇÃO (Promise-based)
    // ═══════════════════════════════════════════════════════════
    function abrirSelecao() {
        return new Promise((resolve) => {
            _resolveV80 = resolve;
            _ativoV80 = true;
            window._rudaSelectingV80 = true;

            // Marca TODOS os tiles como elegíveis (qualquer um pode ser o centro)
            for (let i = 0; i < 64; i++) {
                const el = document.querySelectorAll('#grid .tile')[i];
                if (el) el.classList.add('rudaV80-eligible');
            }

            // Barra de instrução
            let bar = document.getElementById('rudaBarV80');
            if (bar) bar.remove();
            bar = document.createElement('div');
            bar.id = 'rudaBarV80';
            bar.style.cssText = `
                display:flex; align-items:center; gap:12px; flex-wrap:wrap;
                padding:12px 20px; margin:0 15px 10px;
                background:linear-gradient(180deg,rgba(58,124,165,.2),transparent 60%),
                            linear-gradient(135deg,#2a4a6a,#1a2f45);
                border:2px solid #4a8cb5; border-radius:8px;
                font-family:'Cinzel',serif; color:#d0e8f5;
                box-shadow:0 4px 15px rgba(0,0,0,.5);
                animation:rudaV80Pulse 1.5s ease-in-out infinite alternate;
            `;
            bar.innerHTML = `
                <span style="font-size:1.5rem;">🏹</span>
                <span style="flex:1; font-size:.9rem; letter-spacing:1px; font-weight:700;">
                    FLECHA DO AMOR: escolha o tile central da cruz
                </span>
                <button id="rudaV80Cancel" style="padding:8px 16px; border-radius:4px; font-family:'Cinzel',serif; font-weight:700; font-size:.8rem; letter-spacing:1px; cursor:pointer; background:linear-gradient(135deg,#6a2020,#3a1010); color:#f5c8c8; border:2px solid #a83232;">CANCELAR</button>
            `;
            const main = document.querySelector('.game-main');
            if (main && main.parentNode) main.parentNode.insertBefore(bar, main);

            document.getElementById('rudaV80Cancel').onclick = () => finalizar(true);

            if (typeof addLog === 'function') addLog('🏹 Rudá: escolha um tile para a cruz.');
        });
    }

    function finalizar(cancelado, tile = null) {
        if (!_ativoV80) return;
        _ativoV80 = false;
        window._rudaSelectingV80 = false;

        document.querySelectorAll('.rudaV80-eligible, .rudaV80-selected')
            .forEach(el => el.classList.remove('rudaV80-eligible', 'rudaV80-selected'));
        const bar = document.getElementById('rudaBarV80');
        if (bar) bar.remove();

        const resolve = _resolveV80;
        _resolveV80 = null;
        if (resolve) {
            resolve(cancelado ? { cancelado: true } : { cancelado: false, tile });
        }
    }

    // ═══════════════════════════════════════════════════════════
    // 2. HOOK EM handleSelect
    // ═══════════════════════════════════════════════════════════
    const _hsAtual = window.handleSelect;
    if (typeof _hsAtual === 'function' && !_hsAtual._v80Ruda) {
        window.handleSelect = function(idx) {
            if (window._rudaSelectingV80) {
                const el = document.querySelectorAll('#grid .tile')[idx];
                if (el && el.classList.contains('rudaV80-eligible')) {
                    el.classList.add('rudaV80-selected');
                    finalizar(false, { x: idx % 8, y: Math.floor(idx / 8) });
                    return;
                }
            }
            return _hsAtual.apply(this, arguments);
        };
        window.handleSelect._v80Ruda = true;
    }

    // ═══════════════════════════════════════════════════════════
    // 3. WRAPPER EM triggerBravelyChain (por cima do V75)
    // ═══════════════════════════════════════════════════════════
    const _brav = window.triggerBravelyChain;
    if (typeof _brav === 'function' && !_brav._v80Ruda) {
        const _innerBrav = _brav;
        window.triggerBravelyChain = async function(active, target, totalAtk) {
            // PvP/Coop → delega (V75 já trata, mas por segurança)
            if (window._pvpMode || window._coopMode) {
                return _innerBrav.apply(this, arguments);
            }

            const heroData = (typeof STORY_HERO_CLASSES !== 'undefined' && active)
                ? STORY_HERO_CLASSES[active.class] : null;

            // Não é Rudá → delega pro V75
            if (!heroData || heroData.paKey !== PA_KEY) {
                return _innerBrav.apply(this, arguments);
            }

            // ─── Fluxo customizado do Rudá ───
            if (typeof showPoderAncestralEffect === 'function') {
                try { showPoderAncestralEffect(); } catch(e) {}
            }
            await _sleep(300);
            try { if (typeof playSfx === 'function') playSfx('skill1'); } catch(e) {}

            const chosen = await abrirSelecao();
            if (chosen.cancelado) {
                if (typeof addLog === 'function') addLog('🏹 Rudá: PA cancelado.');
                return;
            }

            // Cruz no tile escolhido
            const tiles = [];
            for (let i = 0; i < 8; i++) {
                if (!tiles.includes(i * 8 + chosen.tile.x)) tiles.push(i * 8 + chosen.tile.x);
                if (!tiles.includes(chosen.tile.y * 8 + i)) tiles.push(chosen.tile.y * 8 + i);
            }

            // FX
            tiles.forEach((idx, i) => {
                setTimeout(() => {
                    if (typeof spawnFxAt === 'function') {
                        spawnFxAt('impact', 'fx-impact', idx % 8, Math.floor(idx / 8), { duration: 500, scale: 0.7 });
                    }
                }, i * 30);
            });

            await _sleep(500);

            // Dano no boss (se estiver na cruz)
            if (target && !target.dead) {
                const bossIdx = target.y * 8 + target.x;
                if (tiles.includes(bossIdx)) {
                    if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
                }
            }

            // Converte pra AR
            tiles.forEach(idx => {
                grid[idx] = 'AR';
                const el = document.querySelectorAll('#grid .tile')[idx];
                if (el) el.className = 'tile bg-AR';
            });

            if (typeof addLog === 'function') {
                addLog(`🏹 Rudá: Cruz de Ar em (${chosen.tile.x},${chosen.tile.y})!`);
            }
            if (typeof updateVisuals === 'function') updateVisuals();
            if (typeof updateTitleStats === 'function') updateTitleStats('bravely_chain');
        };
        window.triggerBravelyChain._v80Ruda = true;
    }

    // ═══════════════════════════════════════════════════════════
    // 4. CSS
    // ═══════════════════════════════════════════════════════════
    if (!document.getElementById('v80RudaCSS')) {
        const s = document.createElement('style');
        s.id = 'v80RudaCSS';
        s.textContent = `
            @keyframes rudaV80Pulse {
                from { box-shadow: 0 4px 15px rgba(0,0,0,.5), 0 0 10px rgba(74,140,181,.3); }
                to   { box-shadow: 0 4px 15px rgba(0,0,0,.5), 0 0 25px rgba(74,140,181,.7); }
            }
            .rudaV80-eligible {
                box-shadow: inset 0 0 0 2px rgba(74,140,181,.9) !important;
                cursor: pointer !important;
                animation: rudaV80Elig 1s ease-in-out infinite alternate !important;
            }
            @keyframes rudaV80Elig {
                from { box-shadow: inset 0 0 0 2px rgba(74,140,181,.5); }
                to   { box-shadow: inset 0 0 0 3px rgba(74,140,181,1), 0 0 12px rgba(74,140,181,.6); }
            }
            .rudaV80-selected {
                box-shadow: inset 0 0 0 3px #e8b923, 0 0 20px rgba(232,185,35,.9) !important;
                transform: scale(1.05);
                z-index: 5;
            }
        `;
        document.head.appendChild(s);
    }

    // ═══════════════════════════════════════════════════════════
    // 5. WATCHDOG: se seleção ficou travada, reseta
    // ═══════════════════════════════════════════════════════════
    setInterval(() => {
        if (window._rudaSelectingV80 && !document.getElementById('rudaBarV80')) {
            console.warn('[V80] Seleção travada — resetando');
            window._rudaSelectingV80 = false;
            _ativoV80 = false;
            _resolveV80 = null;
            document.querySelectorAll('.rudaV80-eligible, .rudaV80-selected')
                .forEach(el => el.classList.remove('rudaV80-eligible', 'rudaV80-selected'));
        }
    }, 2000);

    // ═══════════════════════════════════════════════════════════
    // 6. DEBUG
    // ═══════════════════════════════════════════════════════════
    window._debugRudaV80 = function() {
        console.group('=== RUDA V80 ===');
        console.log('V80 ativo?', window._fixRudaPAV80);
        console.log('Seleção ativa?', window._rudaSelectingV80);
        console.log('Barra existe?', !!document.getElementById('rudaBarV80'));
        console.log('Tiles elegíveis:', document.querySelectorAll('.rudaV80-eligible').length);
        console.log('Tiles selecionados:', document.querySelectorAll('.rudaV80-selected').length);
        console.log('triggerBravelyChain._v80Ruda:', window.triggerBravelyChain?._v80Ruda);
        console.log('handleSelect._v80Ruda:', window.handleSelect?._v80Ruda);
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V80] PA do Rudá restaurado');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Seleção de tile central da cruz');
    console.log('• Cruz completa (linha + coluna) no tile escolhido');
    console.log('• Dano PA se boss na cruz');
    console.log('• Converte pra AR');
    console.log('• Outros heróis → V75 (FX leve)');
    console.log('• Curupira → V68');
    console.log('• PvP/Coop → delega');
    console.log('');
    console.log('💡 Debug: window._debugRudaV80()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V81 — Fix visual do card ao selecionar herói na OCA
// -----------------------------------------------------------------
// Bug: ao clicar num card, toggleHeroSelection chamava
// renderOcaScreenFiltered() → re-renderizava tudo → algum patch
// pós-processava o DOM e o card ficava com HTML incompleto
// (só o "?" e o status apareciam).
//
// Fix: não re-renderizar. Só atualizar a classe `.selected` e o
// check (✅) nos cards existentes. Zero impacto no DOM.
//
// Cole NO FINAL do historia.js (por último, depois do V80).
// =================================================================
(function fixToggleSelectionV81() {
    if (window._fixToggleSelectionV81) return;
    window._fixToggleSelectionV81 = true;

    console.log('[V81] Instalando fix do toggle selection...');

    // ═══════════════════════════════════════════════════════════
    // Guardar o original (para o resto do fluxo, se necessário)
    // ═══════════════════════════════════════════════════════════
    if (!window._origToggleHeroSelectionV81) {
        window._origToggleHeroSelectionV81 = window.toggleHeroSelection;
    }

    // ═══════════════════════════════════════════════════════════
    // toggleHeroSelection SEM re-render
    // ═══════════════════════════════════════════════════════════
    window.toggleHeroSelection = function(heroClass) {
        // Guard: herói em expedição
        if (typeof heroiEmExpedicao === 'function' && heroiEmExpedicao(heroClass)) {
            if (typeof showToast === 'function') {
                showToast('⛺', `${STORY_HERO_CLASSES[heroClass]?.displayName || heroClass} está em expedição.`, '⛺');
            }
            return;
        }

        // Guard: herói não desbloqueado
        const unlockedList = STORY_PROGRESS.unlockedHeroesStory || ['Tupa','Sume','Caipora'];
        const heroData = STORY_HERO_CLASSES[heroClass];
        if (!heroData) return;
        const isUnlocked = heroData.starsNeeded === 0 || unlockedList.includes(heroClass);
        if (!isUnlocked) return;

        // Atualiza estado
        STORY_PROGRESS.selectedHeroes = [heroClass];
        if (typeof saveStoryProgress === 'function') saveStoryProgress();

        // ⭐ Só atualiza classes (NÃO re-renderiza)
        document.querySelectorAll('.story-hero-card').forEach(card => {
            const onclickAttr = card.getAttribute('onclick') || '';
            const match = onclickAttr.match(/toggleHeroSelection\('((?:\\'|[^'])*)'\)/);
            if (!match) return;
            const hc = match[1].replace(/\\'/g, "'");
            const shouldSelect = (hc === heroClass);

            // Toggle da classe selected
            card.classList.toggle('selected', shouldSelect);

            // Atualiza check (✅)
            let check = card.querySelector('.story-hero-check');
            if (shouldSelect && !check) {
                check = document.createElement('div');
                check.className = 'story-hero-check';
                check.innerHTML = (typeof uiIcon === 'function') ? uiIcon('check') : '✅';
                card.appendChild(check);
            } else if (!shouldSelect && check) {
                check.remove();
            }
        });

        // Feedback tátil/som (opcional)
        if (typeof playSfx === 'function') {
            try { playSfx('click'); } catch(e) {}
        }
    };

    // ═══════════════════════════════════════════════════════════
    // Wrapper de segurança: se algum patch antigo restaura
    // toggleHeroSelection com re-render, re-instala o nosso
    // ═══════════════════════════════════════════════════════════
    setInterval(() => {
        const atual = window.toggleHeroSelection;
        if (atual && atual !== window.toggleHeroSelection) return; // referência sempre é ele mesmo, ignorar
        // Se algum patch trocou, reinstala
        if (!atual || atual.name === '' || (atual.toString().includes('renderOcaScreenFiltered'))) {
            // Reinstala
            window.toggleHeroSelection = arguments.callee.caller ? null : window.toggleHeroSelection;
        }
    }, 2000);

    // ═══════════════════════════════════════════════════════════
    // DEBUG
    // ═══════════════════════════════════════════════════════════
    window._debugToggleV81 = function() {
        console.group('=== V81 ===');
        console.log('V81 ativo?', window._fixToggleSelectionV81);
        console.log('toggleHeroSelection tem renderOcaScreenFiltered?',
            window.toggleHeroSelection?.toString().includes('renderOcaScreenFiltered'));
        console.log('Card selecionado atual:',
            STORY_PROGRESS.selectedHeroes);
        const selectedCard = document.querySelector('.story-hero-card.selected');
        if (selectedCard) {
            console.log('HTML do card selecionado:');
            console.log(selectedCard.innerHTML.substring(0, 300));
        }
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V81] Fix visual do card selecionado');
    console.log('═══════════════════════════════════════════════════');
    console.log('• toggleHeroSelection NÃO re-renderiza a OCA');
    console.log('• Só atualiza classe .selected + check (✅)');
    console.log('• Card não quebra mais ao clicar');
    console.log('• Performance melhor (sem re-render)');
    console.log('');
    console.log('💡 Debug: window._debugToggleV81()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V82 — Sistema de Liderança
// -----------------------------------------------------------------
// • 26 líderes com habilidades únicas (uma por herói)
// • Líder escolhido na OCA (card em destaque com bust)
// • Buff passivo global (funciona mesmo fora do time)
// • NÃO afeta PvP/Coop
//
// Cole NO FINAL do historia.js (último bloco).
// =================================================================
(function liderancaV82() {
    if (window._liderancaV82) return;
    window._liderancaV82 = true;

    // ═══════════════════════════════════════════════════════════
    // 1. TABELA DE LÍDERES (26)
    // ═══════════════════════════════════════════════════════════
    const LEADER_ABILITIES = {
        // ---- BASE ----
        'Tupa':                 { nome: 'Bênção do Trovão',       desc: '+1 HP máximo a todos',                icon: '⚡' },
        'Sume':                 { nome: 'Ensinamento Ancestral',  desc: '+8% XP em todas as batalhas',         icon: '📚' },
        'Caipora':              { nome: 'Olhar da Caçadora',      desc: '+1 ATK em qualquer forma válida',     icon: '🏹' },

        // ---- GUERREIROS ----
        'Kanarott':             { nome: 'Muralha de Pedra',       desc: '+2 HP a todos',                       icon: '🛡️' },
        'Teperesik':            { nome: 'Fortaleza Viva',         desc: '+2 HP a todos',                       icon: '🏔️' },
        'Eru':                  { nome: 'Chama de Guerra',        desc: '+1 ATK a todos',                      icon: '🔥' },
        'Kianumanka-Manã':      { nome: 'Chama Ancestral',        desc: '+2 dano quando herói em FOGO',        icon: '☄️' },
        'Caboclo d Água':       { nome: 'Maré Guerreira',         desc: 'PA +2 dano',                          icon: '🌊' },
        'Caboclo d\'Água':      { nome: 'Maré Guerreira',         desc: 'PA +2 dano',                          icon: '🌊' },
        'Tupinambá':            { nome: 'Resistência Tribal',     desc: '-1 dano recebido em TERRA',           icon: '🛡️' },
        'Mbaraká':              { nome: 'Voo do Vento',           desc: '+1 dano quando herói em AR',          icon: '🌪️' },

        // ---- MAGOS ----
        'Anduré':               { nome: 'Águas Puras',            desc: 'Cura +1 quando alvo em AGUA',         icon: '💧' },
        'Mãe da Mata':          { nome: 'Bênção da Mata',         desc: 'Cura +1 global',                      icon: '🌳' },
        'Pajé Anhanguera':      { nome: 'Fogo dos Magos',         desc: '+2 ATK a todos os magos',             icon: '🔮' },
        'Mãe-do-Ouro':          { nome: 'Fortuna',                desc: '+10% ouro em todas as batalhas',      icon: '💰' },
        'Pajé-Açu':             { nome: 'Sabedoria Ancestral',    desc: '+10% XP em todas as batalhas',        icon: '📖' },
        'Anhanga-Mirim':        { nome: 'Poder Abissal',          desc: '+2 HP e +1 ATK a todos',              icon: '🌑' },
        'Negrinho do Pastoreio':{ nome: 'Cruz Curativa',          desc: 'Todo PA cura +1 HP extra',            icon: '💚' },
        'Rudá':                 { nome: 'Amor Divino',            desc: 'Toda cura +3',                        icon: '💖' },
        'Abya':                 { nome: 'Eco da Terra',           desc: '+5 HP e +5 ATK para heróis de Terra', icon: '🌍' },

        // ---- ARQUEIROS ----
        'Juruá':                { nome: 'Rajada',                 desc: 'ZIGZAG +1 dano',                      icon: '🌪️' },
        'Araci':                { nome: 'Linha do Vento',         desc: 'LINHA +1 dano',                       icon: '💨' },
        'Bicho Folharal':       { nome: 'Instinto',               desc: 'L: +1 HP e +1 ATK',                   icon: '🌿' },
        'Tapyra-Yawara':        { nome: 'Caçada',                 desc: '+5% ouro e +1 dano em animais',       icon: '🏹' },
        'Curupira':             { nome: 'Guia da Mata',           desc: 'PA ativa com 8 tiles',                icon: '👣' },
        'Matinta Pereira':      { nome: 'Aura de Medo',           desc: '+2 ATK a todos os arqueiros',         icon: '🦉' },
        'Naiá':                 { nome: 'Sacrifício',             desc: '+1 HP/turno quando herói em AGUA',    icon: '💧' },
        'Kuatí':                { nome: 'Brincalhão',             desc: '+5% ouro e +5% XP',                   icon: '🎭' },
    };

    // ═══════════════════════════════════════════════════════════
    // 2. ESTADO
    // ═══════════════════════════════════════════════════════════
    if (typeof STORY_PROGRESS.leader === 'undefined') {
        STORY_PROGRESS.leader = null;
    }

    // ═══════════════════════════════════════════════════════════
    // 3. HELPERS
    // ═══════════════════════════════════════════════════════════
    function getLeader() { return STORY_PROGRESS.leader; }
    function isLeader(c) { return STORY_PROGRESS.leader === c; }
    function getLeaderAbility() { return LEADER_ABILITIES[getLeader()] || null; }

    function isHeroElement(p, targetElement) {
        if (!p) return false;
        const heroClass = p.class || p.className;
        const h = (typeof STORY_HERO_CLASSES !== 'undefined' && heroClass) ? STORY_HERO_CLASSES[heroClass] : null;
        const elem = p.element || h?.element || (typeof calcularElementoDoHeroi === 'function' && heroClass ? calcularElementoDoHeroi(heroClass) : null);
        return elem === targetElement;
    }

    function getLeaderHpBonus(p) {
        const l = getLeader();
        if (l === 'Tupa') return 1;
        if (l === 'Kanarott' || l === 'Teperesik') return 2;
        if (l === 'Anhanga-Mirim') return 2;
        if (l === 'Abya') {
            if (!p) return 5;
            return isHeroElement(p, 'TERRA') ? 5 : 0;
        }
        return 0;
    }

    function getLeaderAtkBonus(active, shape) {
        const l = getLeader();
        if (!l || !active) return 0;
        let b = 0;
        if (l === 'Eru') b += 1;
        if (l === 'Anhanga-Mirim') b += 1;
        if (l === 'Pajé Anhanguera' && active.role === 'Mago') b += 2;
        if (l === 'Matinta Pereira' && active.role === 'Arqueiro') b += 2;
        if (l === 'Abya' && isHeroElement(active, 'TERRA')) b += 5;
        if (l === 'Caipora' && shape) b += 1;
        if (l === 'Juruá' && shape === 'ZIGZAG') b += 1;
        if (l === 'Araci' && shape === 'LINHA') b += 1;
        if (l === 'Bicho Folharal' && shape === 'L') b += 1;
        if (l === 'Kianumanka-Manã') {
            const tile = grid[active.y * 8 + active.x];
            if (tile === 'FOGO') b += 2;
        }
        if (l === 'Mbaraká') {
            const tile = grid[active.y * 8 + active.x];
            if (tile === 'AR') b += 1;
        }
        return b;
    }

    function getLeaderHealBonus(target) {
        const l = getLeader();
        if (!l) return 0;
        let b = 0;
        if (l === 'Mãe da Mata') b += 1;
        if (l === 'Rudá') b += 3;
        if (l === 'Anduré' && target) {
            const tile = grid[target.y * 8 + target.x];
            if (tile === 'AGUA') b += 1;
        }
        return b;
    }

    function getLeaderXpMult() {
        const l = getLeader();
        if (l === 'Sume') return 1.08;
        if (l === 'Pajé-Açu') return 1.10;
        if (l === 'Kuatí') return 1.05;
        return 1;
    }

    function getLeaderOuroMult() {
        const l = getLeader();
        if (l === 'Mãe-do-Ouro') return 1.10;
        if (l === 'Kuatí') return 1.05;
        if (l === 'Tapyra-Yawara' || l === "Tapyra'yawara") return 1.05;
        return 1;
    }

    // ═══════════════════════════════════════════════════════════
    // 4. HOOKS
    // ═══════════════════════════════════════════════════════════

    // ---- HP máx ----
    const _origInit = window.initStoryBattle;
    if (typeof _origInit === 'function' && !_origInit._v82) {
        window.initStoryBattle = async function() {
            const r = await _origInit.apply(this, arguments);
            const l = getLeader();
            if (Array.isArray(players)) {
                let anyApplied = false;
                players.forEach(p => {
                    if (p) {
                        const hpBonus = getLeaderHpBonus(p);
                        if (hpBonus > 0) {
                            p.maxHp += hpBonus;
                            p.hp = p.maxHp;
                            anyApplied = true;
                        }
                    }
                });
                if (anyApplied) {
                    if (typeof updateHeroCard === 'function') updateHeroCard();
                    if (typeof addLog === 'function') {
                        if (l === 'Abya') {
                            addLog(`👑 Líder Abya: +5 HP máximo aos heróis de Terra`);
                        } else {
                            addLog(`👑 Líder: +${getLeaderHpBonus()} HP máximo a todos`);
                        }
                    }
                }
            }
            return r;
        };
        window.initStoryBattle._v82 = true;
    }

    // ---- ATK (executeAction) ----
    const _origExec = window.executeAction;
    if (typeof _origExec === 'function' && !_origExec._v82) {
        window.executeAction = async function() {
            const active = (typeof players !== 'undefined' && Array.isArray(players))
                ? players[currentPlayerIdx] : null;
            if (!active) return _origExec.apply(this, arguments);

            const shape = (typeof detectShape === 'function' && Array.isArray(path) && path.length > 0)
                ? detectShape([...path]) : null;

            const atkBonus = getLeaderAtkBonus(active, shape);

            let origBravelyTiles = null;
            if (isLeader('Curupira')) {
                const input = document.getElementById('bravely_tiles');
                if (input) {
                    origBravelyTiles = input.value;
                    input.value = Math.max(3, (parseInt(origBravelyTiles) || 9) - 1);
                }
            }

            const origBonusAtk = active.bonusAtk || 0;
            if (atkBonus > 0) active.bonusAtk = origBonusAtk + atkBonus;

            try {
                return await _origExec.apply(this, arguments);
            } finally {
                active.bonusAtk = origBonusAtk;
                if (origBravelyTiles !== null) {
                    const input = document.getElementById('bravely_tiles');
                    if (input) input.value = origBravelyTiles;
                }
            }
        };
        window.executeAction._v82 = true;
    }

    // ---- Redução + dano condicional (applyDmg) ----
    const _origDmg = window.applyDmg;
    if (typeof _origDmg === 'function' && !_origDmg._v82) {
        window.applyDmg = function(target, amount) {
            if (!window._storyMode && !window._eventoAtivo) return _origDmg.apply(this, arguments);
            if (window._pvpMode || window._coopMode) return _origDmg.apply(this, arguments);

            // Redução (Tupinambá)
            if (target && players?.includes(target) && !target.dead && isLeader('Tupinambá')) {
                const tile = grid[target.y * 8 + target.x];
                if (tile === 'TERRA') amount = Math.max(1, amount - 1);
            }

            // Dano em animais (Tapyra)
            if (target === boss && !target.dead && isLeader('Tapyra-Yawara')) {
                const enemyId = Array.isArray(window.storyEnemiesRemaining) ? storyEnemiesRemaining[0] : null;
                const enemy = enemyId && typeof STORY_ENEMIES !== 'undefined' ? STORY_ENEMIES[enemyId] : null;
                if (enemy && !enemy.isBoss && !enemy.isMiniBoss) amount += 1;
            }

            return _origDmg.call(this, target, amount);
        };
        window.applyDmg._v82 = true;
    }

    // ---- Cura (showHealEffect) ----
    const _origHeal = window.showHealEffect;
    if (typeof _origHeal === 'function' && !_origHeal._v82) {
        window.showHealEffect = function(x, y, qty) {
            if (!window._storyMode && !window._eventoAtivo) return _origHeal.apply(this, arguments);
            if (window._pvpMode || window._coopMode) return _origHeal.apply(this, arguments);

            const p = (typeof players !== 'undefined' && Array.isArray(players))
                ? players.find(pl => !pl.dead && pl.x === x && pl.y === y) : null;

            if (p) {
                const bonus = getLeaderHealBonus(p);
                if (bonus > 0) {
                    const hpAntes = p.hp;
                    p.hp = Math.min(p.maxHp, p.hp + bonus);
                    const curadoExtra = p.hp - hpAntes;
                    if (curadoExtra > 0) {
                        if (typeof updateHeroCard === 'function') updateHeroCard();
                        return _origHeal.call(this, x, y, qty + curadoExtra);
                    }
                }
            }
            return _origHeal.apply(this, arguments);
        };
        window.showHealEffect._v82 = true;
    }

    // ---- XP/Ouro na vitória ----
    const _origVictory = window.handleStoryPhaseVictory;
    if (typeof _origVictory === 'function' && !_origVictory._v82) {
        window.handleStoryPhaseVictory = function(phase, drops, finalScore, rankSnapshot) {
            const xpMult = getLeaderXpMult();
            const ouroMult = getLeaderOuroMult();
            if ((xpMult > 1 || ouroMult > 1) && phase && phase.reward) {
                const modified = Object.assign({}, phase, {
                    reward: Object.assign({}, phase.reward, {
                        xp: Math.floor((phase.reward.xp || 0) * xpMult),
                        gold: Math.floor((phase.reward.gold || 0) * ouroMult),
                    }),
                });
                return _origVictory.call(this, modified, drops, finalScore, rankSnapshot);
            }
            return _origVictory.apply(this, arguments);
        };
        window.handleStoryPhaseVictory._v82 = true;
    }

    // ---- Naiá: +1 HP/turno em AGUA ----
    let _ultimoHealTurnoNai = -1;
    const _origSwitch = window.switchConfig;
    if (typeof _origSwitch === 'function' && !_origSwitch._v82) {
        window.switchConfig = function(idx) {
            const r = _origSwitch.apply(this, arguments);
            if (!window._storyMode && !window._eventoAtivo) return r;
            if (window._pvpMode || window._coopMode) return r;
            if (!isLeader('Naiá')) return r;

            const p = players?.[idx];
            if (p && !p.dead) {
                const turno = (typeof RANKING !== 'undefined') ? RANKING.turns : 0;
                if (_ultimoHealTurnoNai !== turno) {
                    const tile = grid[p.y * 8 + p.x];
                    if (tile === 'AGUA' && p.hp < p.maxHp) {
                        _ultimoHealTurnoNai = turno;
                        p.hp = Math.min(p.maxHp, p.hp + 1);
                        if (typeof showHealEffect === 'function') showHealEffect(p.x, p.y, 1);
                        if (typeof updateHeroCard === 'function') updateHeroCard();
                    }
                }
            }
            return r;
        };
        window.switchConfig._v82 = true;
    }

    // ---- Caboclo: PA +2 dano ----
    const _origBrav = window.triggerBravelyChain;
    if (typeof _origBrav === 'function' && !_origBrav._v82) {
        window.triggerBravelyChain = async function(active, target, totalAtk) {
            if (isLeader('Caboclo d Água') && !window._pvpMode && !window._coopMode) {
                // FIX: o +2 era aplicado na variável local e descartado, porque
                // `arguments` (inalterado) ia para a função original.
                return _origBrav.call(this, active, target, (totalAtk || 0) + 2);
            }
            return _origBrav.apply(this, arguments);
        };
        window.triggerBravelyChain._v82 = true;
    }

    // ═══════════════════════════════════════════════════════════
    // 5. UI — Card do Líder na OCA
    // ═══════════════════════════════════════════════════════════
    function renderLeaderCard() {
        const title = document.querySelector('.story-title');
        if (!title || !title.textContent.includes('OCA')) return;

        // Remove antigo
        const old = document.getElementById('ocaLeaderSection');
        if (old) old.remove();

        const grid = document.querySelector('.story-heroes-grid');
        if (!grid) return;

        const leader = getLeader();
        const ability = leader ? LEADER_ABILITIES[leader] : null;
        const heroData = leader ? STORY_HERO_CLASSES[leader] : null;
        const spriteURL = (leader && typeof SPRITES !== 'undefined' && (SPRITES[leader] || SPRITES[heroData?.spriteKey])) || (typeof SPRITES_STORY !== 'undefined' && (SPRITES_STORY[leader] || SPRITES_STORY[heroData?.spriteKey])) || '';

        const section = document.createElement('div');
        section.id = 'ocaLeaderSection';
        section.className = 'oca-leader-section';

        if (!leader) {
            section.innerHTML = `
                <div class="oca-leader-empty">
                    <div class="oca-leader-empty-icon">👑</div>
                    <div class="oca-leader-empty-text">Nenhum líder escolhido</div>
                    <button class="oca-leader-btn" data-acao="escolher-lider">ESCOLHER LÍDER</button>
                </div>
            `;
        } else {
            const heroData = STORY_HERO_CLASSES[leader];
            section.innerHTML = `
                <div class="oca-leader-bust" style="background-image: url('${spriteURL}')"></div>
                <div class="oca-leader-info">
                    <div class="oca-leader-label">👑 LÍDER DO GRUPO</div>
                    <div class="oca-leader-name">${heroData?.displayName || leader}</div>
                    <div class="oca-leader-ability">${ability?.icon || '⭐'} <b>${ability?.nome || ''}</b> — ${ability?.desc || ''}</div>
                </div>
                <button class="oca-leader-btn" data-acao="escolher-lider">TROCAR LÍDER</button>
            `;
        }

        grid.parentNode.insertBefore(section, grid);
    }

    // ---- Modal de escolha ----
    function abrirModalEscolherLider() {
        const old = document.getElementById('escolherLiderOverlay');
        if (old) old.remove();

        const unlockedList = STORY_PROGRESS.unlockedHeroesStory || ['Tupa','Sume','Caipora'];
        const allHeroes = Object.values(STORY_HERO_CLASSES);
        const unlocked = allHeroes.filter(h =>
            (h.starsNeeded === 0 || unlockedList.includes(h.className)) &&
            LEADER_ABILITIES[h.className]
        );

        const ov = document.createElement('div');
        ov.id = 'escolherLiderOverlay';
        ov.className = 'escolher-lider-overlay';
        ov.onclick = (e) => { if (e.target === ov) ov.remove(); };

        const currentLeader = getLeader();

        const cardsHTML = unlocked.map(h => {
            const ability = LEADER_ABILITIES[h.className];
            const isCurrent = h.className === currentLeader;
            const spriteURL = (typeof SPRITES !== 'undefined' && (SPRITES[h.className] || SPRITES[h.spriteKey])) || (typeof SPRITES_STORY !== 'undefined' && (SPRITES_STORY[h.className] || SPRITES_STORY[h.spriteKey])) || '';
            return `
                <div class="escolher-lider-card ${isCurrent ? 'current' : ''}" data-lider="${h.className}">
                    <img src="${spriteURL}" class="escolher-lider-sprite" onerror="this.style.display='none'">
                    <div class="escolher-lider-name">${h.displayName}</div>
                    <div class="escolher-lider-role">${h.role}</div>
                    <div class="escolher-lider-ability">${ability.icon} ${ability.nome}</div>
                    <div class="escolher-lider-desc">${ability.desc}</div>
                </div>
            `;
        }).join('');

        ov.innerHTML = `
            <div class="escolher-lider-panel">
                <div class="escolher-lider-header">
                    <div class="escolher-lider-title">👑 ESCOLHER LÍDER</div>
                    <button class="escolher-lider-close" data-acao="fechar-escolher-lider">✕</button>
                </div>
                <div class="escolher-lider-hint">O líder gera um bônus passivo para todo o grupo. Não afeta PvP/Coop.</div>
                <div class="escolher-lider-grid">${cardsHTML}</div>
            </div>
        `;
        document.body.appendChild(ov);
    }

    // Delegação de eventos
    document.addEventListener('click', (ev) => {
        const acaoBtn = ev.target.closest('[data-acao]');
        if (acaoBtn) {
            const acao = acaoBtn.getAttribute('data-acao');
            if (acao === 'escolher-lider') {
                ev.preventDefault(); ev.stopPropagation();
                abrirModalEscolherLider();
                return;
            }
            if (acao === 'fechar-escolher-lider') {
                ev.preventDefault(); ev.stopPropagation();
                document.getElementById('escolherLiderOverlay')?.remove();
                return;
            }
        }
        const card = ev.target.closest('[data-lider]');
        if (card) {
            ev.preventDefault(); ev.stopPropagation();
            const heroClass = card.getAttribute('data-lider');
            STORY_PROGRESS.leader = heroClass;
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
            document.getElementById('escolherLiderOverlay')?.remove();
            const heroData = STORY_HERO_CLASSES[heroClass];
            if (typeof showToast === 'function') {
                showToast('👑', `${heroData?.displayName || heroClass} é o novo líder!`, '👑');
            }
            renderLeaderCard();
        }
    }, true);

    // Hook no render da OCA
    const _origOca = window.renderOcaScreenFiltered;
    if (typeof _origOca === 'function' && !_origOca._v82) {
        window.renderOcaScreenFiltered = function() {
            const r = _origOca.apply(this, arguments);
            setTimeout(renderLeaderCard, 150);
            setTimeout(renderLeaderCard, 500);
            return r;
        };
        window.renderOcaScreenFiltered._v82 = true;
    }

    // ═══════════════════════════════════════════════════════════
    // 6. CSS
    // ═══════════════════════════════════════════════════════════
    if (!document.getElementById('v82CSS')) {
        const s = document.createElement('style');
        s.id = 'v82CSS';
        s.textContent = `
            .oca-leader-section {
                display: flex; align-items: center; gap: 16px;
                padding: 16px 20px; margin-bottom: 20px;
                background: radial-gradient(ellipse at top left, rgba(232,185,35,.15), transparent 60%),
                            linear-gradient(135deg, #3d2d18, #2a1f10);
                border: 3px solid #e8b923; border-radius: 10px;
                box-shadow: 0 0 25px rgba(232,185,35,.35), inset 0 0 20px rgba(232,185,35,.08);
                position: relative; overflow: hidden;
            }
            .oca-leader-section::before {
                content: '👑'; position: absolute; top: -20px; right: -10px;
                font-size: 5rem; opacity: 0.08; pointer-events: none;
            }
            .oca-leader-bust {
                width: 110px; height: 130px;
                background-size: 230% auto;
                background-position: center 8%;
                background-repeat: no-repeat;
                background-color: rgba(10,6,2,.6);
                border-radius: 8px;
                border: 3px solid #e8b923;
                box-shadow: 0 0 20px rgba(232,185,35,.6);
                flex-shrink: 0;
            }
            .oca-leader-info { flex: 1; min-width: 0; }
            .oca-leader-label {
                font-family: 'Cinzel', serif; color: #e8b923;
                font-size: .75rem; letter-spacing: 3px; margin-bottom: 4px;
                text-shadow: 0 0 8px rgba(232,185,35,.6);
            }
            .oca-leader-name {
                font-family: 'Cinzel Decorative', serif; color: #f0e2c0;
                font-size: 1.4rem; font-weight: 700; letter-spacing: 1px;
                margin-bottom: 6px; line-height: 1.1;
            }
            .oca-leader-ability {
                font-family: 'EB Garamond', serif; color: #d9c89a;
                font-size: .95rem; line-height: 1.3;
            }
            .oca-leader-ability b {
                color: #e8b923; font-family: 'Cinzel', serif;
                font-size: .85rem; letter-spacing: 1px;
            }
            .oca-leader-btn {
                padding: 10px 18px;
                background: linear-gradient(180deg, rgba(232,185,35,.25), transparent 45%),
                            linear-gradient(135deg, #8a6a2e, #4a3418);
                color: #fff5dc; border: 2px solid #e8b923; border-radius: 6px;
                cursor: pointer; font-family: 'Cinzel', serif; font-weight: 700;
                font-size: .8rem; letter-spacing: 1.5px; transition: all .2s;
                flex-shrink: 0; white-space: nowrap;
            }
            .oca-leader-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0,0,0,.6), 0 0 25px rgba(232,185,35,.5);
            }
            .oca-leader-empty {
                display: flex; align-items: center; gap: 16px;
                width: 100%; justify-content: center; padding: 10px;
            }
            .oca-leader-empty-icon { font-size: 2.5rem; opacity: .6; }
            .oca-leader-empty-text {
                font-family: 'EB Garamond', serif; color: #b8a577;
                font-size: 1rem; font-style: italic;
            }

            .escolher-lider-overlay {
                position: fixed; inset: 0; background: rgba(10,6,2,.94);
                z-index: 21000; display: flex; align-items: flex-start; justify-content: center;
                padding: 20px; overflow-y: auto;
            }
            .escolher-lider-panel {
                background: linear-gradient(180deg, #2a1f10, #1a1208);
                border: 3px solid #e8b923; border-radius: 10px;
                max-width: 900px; width: 100%; padding: 20px; margin: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,.9), 0 0 40px rgba(232,185,35,.3);
            }
            .escolher-lider-header {
                display: flex; justify-content: space-between; align-items: center;
                border-bottom: 2px solid rgba(232,185,35,.3);
                padding-bottom: 12px; margin-bottom: 12px;
            }
            .escolher-lider-title {
                font-family: 'Cinzel Decorative', serif; color: #e8b923;
                font-size: 1.3rem; letter-spacing: 3px;
                text-shadow: 0 0 15px rgba(232,185,35,.5);
            }
            .escolher-lider-close {
                background: #6a2020; color: #f5c8c8;
                border: 1px solid #a83232; border-radius: 50%;
                width: 30px; height: 30px; cursor: pointer; font-weight: 700;
            }
            .escolher-lider-hint {
                font-family: 'EB Garamond', serif; color: #8a7a52;
                font-size: .9rem; font-style: italic; text-align: center;
                margin-bottom: 16px; padding: 8px;
                background: rgba(10,6,2,.4); border-radius: 4px;
            }
            .escolher-lider-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
                gap: 12px;
            }
            .escolher-lider-card {
                background: linear-gradient(180deg, rgba(201,162,39,.05), transparent 40%), rgba(10,6,2,.7);
                border: 2px solid rgba(201,162,39,.25); border-radius: 6px;
                padding: 12px; text-align: center; cursor: pointer;
                transition: all .2s; position: relative;
            }
            .escolher-lider-card:hover {
                border-color: #c9a227; transform: translateY(-3px);
                box-shadow: 0 6px 15px rgba(0,0,0,.5), 0 0 15px rgba(232,185,35,.3);
            }
            .escolher-lider-card.current {
                border-color: #e8b923;
                background: linear-gradient(180deg, rgba(232,185,35,.15), transparent 50%), rgba(10,6,2,.8);
                box-shadow: 0 0 20px rgba(232,185,35,.5);
            }
            .escolher-lider-card.current::before {
                content: '👑'; position: absolute; top: 6px; right: 8px; font-size: 1rem;
            }
            .escolher-lider-sprite { width: 56px; height: 56px; object-fit: contain; margin-bottom: 6px; }
            .escolher-lider-name {
                font-family: 'Cinzel', serif; color: #f0e2c0;
                font-size: .9rem; font-weight: 700; margin-bottom: 2px;
            }
            .escolher-lider-role {
                font-family: 'EB Garamond', serif; color: #8a7a52;
                font-size: .75rem; font-style: italic; margin-bottom: 6px;
            }
            .escolher-lider-ability {
                font-family: 'Cinzel', serif; color: #e8b923;
                font-size: .8rem; font-weight: 700; margin-bottom: 4px;
            }
            .escolher-lider-desc {
                font-family: 'EB Garamond', serif; color: #b8a577;
                font-size: .75rem; line-height: 1.3;
            }

            @media (max-width: 600px) {
                .oca-leader-section { flex-direction: column; text-align: center; }
                .oca-leader-bust { width: 90px; height: 110px; }
                .oca-leader-name { font-size: 1.15rem; }
                .escolher-lider-grid { grid-template-columns: repeat(2, 1fr); }
            }
        `;
        document.head.appendChild(s);
    }

    // ═══════════════════════════════════════════════════════════
    // 7. DEBUG
    // ═══════════════════════════════════════════════════════════
    window._debugLiderV82 = function() {
        console.group('=== LIDERANÇA V82 ===');
        console.log('Líder:', getLeader());
        console.log('Habilidade:', getLeaderAbility());
        console.log('HP bonus:', getLeaderHpBonus());
        console.log('XP mult:', getLeaderXpMult());
        console.log('Ouro mult:', getLeaderOuroMult());
        console.groupEnd();
    };

    window.LEADER_ABILITIES = LEADER_ABILITIES;

    window._setLider = function(heroClass) {
        if (!STORY_HERO_CLASSES[heroClass]) { console.warn('Herói inválido'); return; }
        STORY_PROGRESS.leader = heroClass;
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        if (typeof renderOcaScreenFiltered === 'function') renderOcaScreenFiltered();
        console.log('Líder definido:', heroClass);
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V82] Sistema de Liderança');
    console.log('═══════════════════════════════════════════════════');
    console.log('• 26 líderes com habilidades únicas');
    console.log('• Bust do herói em destaque na OCA');
    console.log('• Buff passivo global (funciona mesmo fora do time)');
    console.log('• NÃO afeta PvP/Coop');
    console.log('');
    console.log('💡 Debug: window._debugLiderV82()');
    console.log('💡 Teste: window._setLider("Mãe da Mata")');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V82.1 — Bônus de líder visíveis nos cards
// -----------------------------------------------------------------
// • HP/ATK dos cards já mostram o bônus do líder (verde com brilho
//   dourado para distinguir do bônus comum)
// • Bônus UNIVERSAIS e POR CLASSE aparecem no card:
//     - Tupã, Kanarott, Teperesik, Anhanga-Mirim → HP
//     - Eru, Anhanga-Mirim → ATK
//     - Pajé Anhanguera → ATK só nos Magos
//     - Matinta Pereira → ATK só nos Arqueiros
// • Bônus VARIÁVEIS (dano por forma, tile, PA, cura, redução,
//   XP, ouro) NÃO aparecem no card — ficam só no preview da batalha
//
// Cole NO FINAL do historia.js (depois do V82).
// =================================================================
(function leaderCardBonusV82_1() {
    if (window._leaderCardBonusV82_1) return;
    window._leaderCardBonusV82_1 = true;

    // ═══════════════════════════════════════════════════════════
    // BÔNUS DO LÍDER VISÍVEL NO CARD (só HP e ATK)
    // ═══════════════════════════════════════════════════════════
    function getLeaderCardBonus(heroClass) {
        const leader = STORY_PROGRESS.leader;
        if (!leader) return { hp: 0, atk: 0 };
        const heroData = STORY_HERO_CLASSES[heroClass];
        if (!heroData) return { hp: 0, atk: 0 };

        let hp = 0, atk = 0;

        // HP universal
        if (leader === 'Tupa') hp = 1;
        if (leader === 'Kanarott' || leader === 'Teperesik') hp = 2;
        if (leader === 'Anhanga-Mirim') hp = 2;

        // ATK universal
        if (leader === 'Eru') atk = 1;
        if (leader === 'Anhanga-Mirim') atk += 1;

        // ATK por classe (sempre ativo para a classe)
        if (leader === 'Pajé Anhanguera' && heroData.role === 'Mago') atk = 2;
        if (leader === 'Matinta Pereira' && heroData.role === 'Arqueiro') atk = 2;

        // Líder Abya: +5 HP e +5 ATK para heróis de Terra
        const elem = heroData.element || (typeof calcularElementoDoHeroi === 'function' ? calcularElementoDoHeroi(heroClass) : null);
        if (leader === 'Abya' && elem === 'TERRA') {
            hp += 5;
            atk += 5;
        }

        return { hp, atk };
    }

    // ═══════════════════════════════════════════════════════════
    // ATUALIZA TODOS OS CARDS
    // ═══════════════════════════════════════════════════════════
    function updateAllCardStats() {
        document.querySelectorAll('.story-hero-card').forEach(card => {
            if (card.classList.contains('locked')) return;
            const onclickAttr = card.getAttribute('onclick') || '';
            const match = onclickAttr.match(/toggleHeroSelection\('((?:\\'|[^'])*)'\)/);
            if (!match) return;
            const heroClass = match[1].replace(/\\'/g, "'");
            const heroData = STORY_HERO_CLASSES[heroClass];
            if (!heroData) return;

            const baseHp = heroData.hp;
            const baseAtk = heroData.atk;
            let bonusHp = 0, bonusAtk = 0;

            // Nível + stat 11
            if (typeof getHeroBonusFromLevel === 'function') {
                const lb = getHeroBonusFromLevel(heroClass) || {};
                bonusHp += lb.hp || 0;
                bonusAtk += lb.atk || 0;
            }

            // Equipamento
            if (typeof getHeroEquipment === 'function') {
                const eq = getHeroEquipment(heroClass);
                if (eq?.arma && typeof getWeaponById === 'function') {
                    const w = getWeaponById(eq.arma);
                    if (w) bonusAtk += w.atkBonus || 0;
                }
                if (eq?.amuleto && typeof getAmuletById === 'function') {
                    const a = getAmuletById(eq.amuleto);
                    if (a?.efeito) {
                        bonusHp += a.efeito.hpBonus || 0;
                        bonusAtk += a.efeito.atkBonus || 0;
                    }
                }
            }

            // ⭐ Bônus do líder
            const leaderBonus = getLeaderCardBonus(heroClass);
            bonusHp += leaderBonus.hp;
            bonusAtk += leaderBonus.atk;

            const formatar = (base, bonus, isLeader) => {
                if (bonus === 0) return `${base}`;
                const cor = bonus > 0 ? '#8ac070' : '#d05050';
                const sinal = bonus > 0 ? '+' : '';
                const shadow = isLeader
                    ? '; text-shadow: 0 0 6px rgba(232,185,35,.7), 0 0 10px rgba(232,185,35,.35);'
                    : '; text-shadow: 0 0 4px rgba(0,0,0,.8);';
                return `${base} <span style="color:${cor}; font-weight:900${shadow}">${sinal}${bonus}</span>`;
            };

            const infoDiv = card.querySelector('.story-hero-level');
            if (infoDiv) {
                infoDiv.innerHTML = `${heroData.role} · HP ${formatar(baseHp, bonusHp, leaderBonus.hp > 0)} · ATK ${formatar(baseAtk, bonusAtk, leaderBonus.atk > 0)}`;
            }
        });
    }

    window._updateAllCardStatsV821 = updateAllCardStats;
    window._getLeaderCardBonusV821 = getLeaderCardBonus;

    // ═══════════════════════════════════════════════════════════
    // HOOK no render da OCA (roda após V10.31)
    // ═══════════════════════════════════════════════════════════
    const _origOca = window.renderOcaScreenFiltered;
    if (typeof _origOca === 'function' && !_origOca._v82_1) {
        window.renderOcaScreenFiltered = function() {
            const r = _origOca.apply(this, arguments);
            setTimeout(updateAllCardStats, 400);
            setTimeout(updateAllCardStats, 800);
            return r;
        };
        window.renderOcaScreenFiltered._v82_1 = true;
    }

    // ═══════════════════════════════════════════════════════════
    // Detecta mudança de líder
    // ═══════════════════════════════════════════════════════════
    let _lastLeader = STORY_PROGRESS.leader;

    // Capture listener (V82 usa stopPropagation, não stopImmediatePropagation,
    // então nosso listener ainda roda; o setTimeout garante que roda depois
    // do V82 ter atualizado STORY_PROGRESS.leader)
    document.addEventListener('click', (ev) => {
        if (!ev.target.closest('[data-lider]')) return;
        setTimeout(() => {
            if (STORY_PROGRESS.leader !== _lastLeader) {
                _lastLeader = STORY_PROGRESS.leader;
                updateAllCardStats();
            }
        }, 200);
    }, true);

    // Safety net (mudança via console, _setLider, etc.)
    setInterval(() => {
        if (STORY_PROGRESS.leader !== _lastLeader) {
            _lastLeader = STORY_PROGRESS.leader;
            const ss = document.getElementById('storyScreen');
            if (ss && ss.classList.contains('active') && ss.innerHTML.includes('OCA')) {
                updateAllCardStats();
            }
        }
    }, 1000);

    // ═══════════════════════════════════════════════════════════
    // DEBUG
    // ═══════════════════════════════════════════════════════════
    window._debugLeaderCardBonus = function() {
        console.group('=== V82.1 — Bônus de Líder nos Cards ===');
        console.log('Líder atual:', STORY_PROGRESS.leader || '(nenhum)');
        const exemplos = ['Tupa', 'Eru', 'Pajé Anhanguera', 'Matinta Pereira', 'Mãe da Mata', 'Curupira'];
        exemplos.forEach(h => {
            const heroData = STORY_HERO_CLASSES[h];
            const b = getLeaderCardBonus(h);
            console.log(`${h} (${heroData?.role || '?'}) → HP +${b.hp}, ATK +${b.atk}`);
        });
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V82.1] Bônus de líder visíveis nos cards');
    console.log('═══════════════════════════════════════════════════');
    console.log('• HP/ATK dos cards refletem o buff do líder');
    console.log('• Bônus do líder tem brilho dourado (distinto dos outros)');
    console.log('• Bônus variáveis (forma, tile, cura, XP, ouro) → só no preview');
    console.log('');
    console.log('💡 Debug: window._debugLeaderCardBonus()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V83 — Fix Ritual (scroll + filtro) + Expedição (dif)
// Cole NO FINAL do historia.js (último bloco).
// =================================================================
(function fixRitualExpedicaoV83() {
    if (window._fixRitualExpedicaoV83) return;
    window._fixRitualExpedicaoV83 = true;

    // ═══════════════════════════════════════════════════════════
    // PARTE 1 — RITUAL: SCROLL PERSISTENTE + FILTRO
    // ═══════════════════════════════════════════════════════════

    let _ritualScrollPersistido = 0;
    let _ritualFilterRole = 'all';

    // Salva o scroll continuamente (o usuário rola, guarda a posição)
    setInterval(() => {
        const s = document.getElementById('storyScreen');
        if (!s || !s.classList.contains('active')) return;
        const t = s.querySelector('.story-title');
        if (t && t.textContent.includes('RITUAL')) {
            _ritualScrollPersistido = s.scrollTop;
        }
    }, 250);

    // Restaura em várias tentativas (render pode ter reflow lento)
    function _preservarScrollRitual(scrollAntes) {
        [50, 100, 300, 700, 1200, 1800].forEach(ms => {
            setTimeout(() => {
                const s = document.getElementById('storyScreen');
                if (!s || !s.classList.contains('active')) return;
                const t = s.querySelector('.story-title');
                if (!t || !t.textContent.includes('RITUAL')) return;
                if (scrollAntes > 0 && Math.abs(s.scrollTop - scrollAntes) > 20) {
                    s.scrollTop = scrollAntes;
                }
            }, ms);
        });
    }

    // Wrapper em handleRitualAscend (cobre níveis 2-10 E nível 11)
    const _origAscend = window.handleRitualAscend;
    if (typeof _origAscend === 'function' && !_origAscend._v83) {
        window.handleRitualAscend = function(heroClass) {
            const s = document.getElementById('storyScreen');
            const antes = s ? s.scrollTop : _ritualScrollPersistido;
            const r = _origAscend.apply(this, arguments);
            _preservarScrollRitual(antes);
            return r;
        };
        window.handleRitualAscend._v83 = true;
    }

    // Wrapper em rerollStat11
    const _origReroll = window.rerollStat11;
    if (typeof _origReroll === 'function' && !_origReroll._v83) {
        window.rerollStat11 = function(heroClass) {
            const s = document.getElementById('storyScreen');
            const antes = s ? s.scrollTop : _ritualScrollPersistido;
            const r = _origReroll.apply(this, arguments);
            _preservarScrollRitual(antes);
            return r;
        };
        window.rerollStat11._v83 = true;
    }

    // ─────────────────────────────────────────────────────
    // FILTRO DO RITUAL (mesmo padrão da OCA)
    // ─────────────────────────────────────────────────────
    function _aplicarFiltroRitualCards() {
        document.querySelectorAll('.ritual-card').forEach(card => {
            const nameEl = card.querySelector('.ritual-card-name');
            if (!nameEl) return;
            const nome = nameEl.textContent.trim();
            let heroClass = null;
            for (const cls in STORY_HERO_CLASSES) {
                if (STORY_HERO_CLASSES[cls].displayName === nome) { heroClass = cls; break; }
            }
            if (!heroClass) return;
            const role = STORY_HERO_CLASSES[heroClass].role;
            const match = _ritualFilterRole === 'all' || role === _ritualFilterRole;
            card.style.display = match ? '' : 'none';
        });
    }

    function _injetarFiltrosRitual() {
        const s = document.getElementById('storyScreen');
        if (!s || !s.classList.contains('active')) return;
        const t = s.querySelector('.story-title');
        if (!t || !t.textContent.includes('RITUAL')) return;

        const header = s.querySelector('.story-header');
        if (!header) return;

        // Se já existe, só atualiza estado ativo
        if (header.querySelector('.ritual-filters')) {
            header.querySelectorAll('.ritual-filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-role') === _ritualFilterRole);
            });
            return;
        }

        const div = document.createElement('div');
        div.className = 'ritual-filters';
        const roles = [
            { key: 'all', label: 'Todos' },
            { key: 'Guerreiro', label: '⚔️ Guerreiros' },
            { key: 'Mago', label: '🔮 Magos' },
            { key: 'Arqueiro', label: '🏹 Arqueiros' },
        ];
        div.innerHTML = roles.map(r =>
            `<button class="ritual-filter-btn ${r.key === _ritualFilterRole ? 'active' : ''}" data-role="${r.key}">${r.label}</button>`
        ).join('');

        div.querySelectorAll('.ritual-filter-btn').forEach(btn => {
            btn.onclick = () => {
                _ritualFilterRole = btn.getAttribute('data-role');
                div.querySelectorAll('.ritual-filter-btn').forEach(b => {
                    b.classList.toggle('active', b === btn);
                });
                _aplicarFiltroRitualCards();
            };
        });

        header.appendChild(div);
    }

    // Wrapper em renderRitualScreen (cobre chamadas diretas e patches pós)
    const _origRenderRitual = window.renderRitualScreen;
    if (typeof _origRenderRitual === 'function' && !_origRenderRitual._v83) {
        window.renderRitualScreen = function() {
            const s = document.getElementById('storyScreen');
            const antes = s ? s.scrollTop : _ritualScrollPersistido;
            const r = _origRenderRitual.apply(this, arguments);
            _preservarScrollRitual(antes);
            setTimeout(_injetarFiltrosRitual, 100);
            setTimeout(_injetarFiltrosRitual, 400);
            setTimeout(_aplicarFiltroRitualCards, 200);
            setTimeout(_aplicarFiltroRitualCards, 500);
            return r;
        };
        window.renderRitualScreen._v83 = true;
    }

    // CSS do filtro
    if (!document.getElementById('v83RitualCSS')) {
        const st = document.createElement('style');
        st.id = 'v83RitualCSS';
        st.textContent = `
            .ritual-filters {
                display: flex; justify-content: center; gap: 10px;
                flex-wrap: wrap; margin-top: 18px; margin-bottom: 10px;
            }
            .ritual-filter-btn {
                padding: 8px 18px;
                background: linear-gradient(135deg, #3d2d18, #2a1f10);
                color: #c8b787; border: 1px solid #6a5024;
                border-radius: 20px; cursor: pointer;
                font-family: 'Cinzel', serif; font-weight: 700;
                font-size: .85rem; letter-spacing: 1px;
                transition: all .2s;
            }
            .ritual-filter-btn:hover { color: #e8dcc4; border-color: #c9a227; }
            .ritual-filter-btn.active {
                background: linear-gradient(180deg, rgba(232,185,35,.2), transparent 45%),
                            linear-gradient(135deg, #6a5024, #3d2d18);
                color: #fff5dc; border-color: #e8b923;
                box-shadow: 0 0 15px rgba(232,185,35,.35);
            }
        `;
        document.head.appendChild(st);
    }

    // ═══════════════════════════════════════════════════════════
    // PARTE 2 — EXPEDIÇÃO: FILTRAR FASES PELA DIFICULDADE ESCOLHIDA
    // ═══════════════════════════════════════════════════════════

    // ⭐ Fonte de verdade: consulta difficultyProgress[diffId]
    function isPhaseCompletedInDiff(pid, diffId) {
        if (typeof STORY_PROGRESS === 'undefined') return false;
        if (!STORY_PROGRESS.difficultyProgress) return false;
        const d = STORY_PROGRESS.difficultyProgress[diffId];
        if (!d) return false;
        return Array.isArray(d.completedPhases) && d.completedPhases.includes(pid);
    }
    window.isPhaseCompletedInDiff = isPhaseCompletedInDiff;

    const TEMPO_MS = { normal: 30*60000, dificil: 60*60000, pesadelo: 120*60000 };
    const DIFF_LABEL = { normal: 'Normal', dificil: 'Difícil', pesadelo: 'Pesadelo' };
    const DIFF_MULT = { normal: 1, dificil: 1.3, pesadelo: 1.6 };
    const DIFF_COR = { normal: '#c9a227', dificil: '#e67e22', pesadelo: '#a83232' };

    function calcHeroPowerV83(heroClass) {
        const hd = STORY_HERO_CLASSES[heroClass];
        if (!hd) return 0;
        const level = (typeof getHeroLevel === 'function') ? getHeroLevel(heroClass) : 1;
        const bonus = (typeof getHeroBonusFromLevel === 'function')
            ? (getHeroBonusFromLevel(heroClass) || {}) : {};
        let hp = (hd.hp || 0) + (bonus.hp || 0);
        let atk = (hd.atk || 0) + (bonus.atk || 0);
        if (typeof getHeroEquipment === 'function') {
            const eq = getHeroEquipment(heroClass);
            if (eq?.arma && typeof getWeaponById === 'function') {
                const w = getWeaponById(eq.arma);
                if (w) atk += w.atkBonus || 0;
            }
            if (eq?.amuleto && typeof getAmuletById === 'function') {
                const a = getAmuletById(eq.amuleto);
                if (a?.efeito) {
                    atk += a.efeito.atkBonus || 0;
                    hp += a.efeito.hpBonus || 0;
                }
            }
        }
        return (hp * 2) + (atk * 8) + (level * 15);
    }

    function calcPhaseReqV83(chapterId, phaseId, difficulty) {
        const ch = STORY_CHAPTERS[chapterId];
        if (!ch) return 1;
        const ph = ch.phases.find(p => p.id === phaseId);
        if (!ph) return 1;
        let hpSum = 0, atkSum = 0;
        ph.enemies.forEach(eid => {
            const e = STORY_ENEMIES[eid];
            if (e) { hpSum += e.hp || 0; atkSum += e.atk || 0; }
        });
        return Math.max(1, (hpSum + atkSum * 5) * (DIFF_MULT[difficulty] || 1));
    }

    function calcChanceV83(heroClass, chapterId, phaseId, difficulty) {
        const hp = calcHeroPowerV83(heroClass);
        const req = calcPhaseReqV83(chapterId, phaseId, difficulty);
        const isFinal = (phaseId === '13-4');
        const min = isFinal ? 0.10 : 0.15;
        const max = isFinal ? 0.30 : 0.95;
        const divisor = isFinal ? 3 : 2;
        return Math.max(min, Math.min(max, hp / (req * divisor)));
    }

    // ─────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────
    function renderTelaExpedicaoV83() {
        const ov = document.getElementById('expedicaoOverlay');
        if (!ov) return;

        if (!window._expState) {
            window._expState = { heroClass: null, chapterId: null, phaseId: null, difficulty: 'normal' };
        }
        const st = window._expState;
        const diff = st.difficulty || 'normal';
        const selHeroi = st.heroClass;
        if (!selHeroi) return;

        const heroData = STORY_HERO_CLASSES[selHeroi];
        const heroPower = calcHeroPowerV83(selHeroi);

        // ⭐ Fases da dificuldade SELECIONADA
        const fasesDisponiveis = [];
        Object.values(STORY_CHAPTERS).forEach(ch => {
            ch.phases.forEach(ph => {
                if (isPhaseCompletedInDiff(ph.id, diff)) {
                    fasesDisponiveis.push({ chapterId: ch.id, phase: ph });
                }
            });
        });

        const chaptersComFases = [...new Set(fasesDisponiveis.map(f => f.chapterId))].sort((a, b) => a - b);

        let chapterAtual = st.chapterId;
        if (!chapterAtual || !chaptersComFases.includes(chapterAtual)) {
            chapterAtual = chaptersComFases[0] || null;
            st.chapterId = chapterAtual;
        }

        const fasesDoChapter = fasesDisponiveis.filter(f => f.chapterId === chapterAtual);
        let phaseAtual = st.phaseId;
        if (!phaseAtual || !fasesDoChapter.some(f => f.phase.id === phaseAtual)) {
            phaseAtual = fasesDoChapter[0]?.phase.id || null;
            st.phaseId = phaseAtual;
        }

        const phaseObj = fasesDoChapter.find(f => f.phase.id === phaseAtual)?.phase;
        const chance = phaseObj ? calcChanceV83(selHeroi, chapterAtual, phaseAtual, diff) : 0;
        const tempo = TEMPO_MS[diff];
        const tempoLabel = tempo >= 3600000
            ? `${Math.round(tempo / 3600000)}h`
            : `${Math.round(tempo / 60000)}min`;
        const sprite = (typeof SPRITES !== 'undefined' && SPRITES[selHeroi]) || '';

        const chapterBtns = chaptersComFases.map(cid => {
            const ativo = cid === chapterAtual;
            return `<button class="exp-chapter-btn ${ativo ? 'active' : ''}" onclick="window._expSelChapter(${cid})">Ato ${cid}</button>`;
        }).join('');

        const phaseBtns = fasesDoChapter.map(f => {
            const ativo = f.phase.id === phaseAtual;
            const isBoss = f.phase.isBoss;
            const isFinal = f.phase.isFinalBoss;
            return `<button class="exp-phase-btn ${ativo ? 'active' : ''} ${isFinal ? 'final' : isBoss ? 'boss' : ''}" onclick="window._expSelPhase('${f.phase.id}')">
                ${f.phase.id}${isFinal ? ' 👑' : isBoss ? ' 🎯' : ''}
            </button>`;
        }).join('');

        const diffBtns = ['normal', 'dificil', 'pesadelo'].map(d => {
            const ativo = d === diff;
            return `<button class="exp-diff-btn ${ativo ? 'active' : ''}" onclick="window._expSelDiff('${d}')" style="--cor:${DIFF_COR[d]};">
                ${DIFF_LABEL[d]}
            </button>`;
        }).join('');

        const chancePct = Math.round(chance * 100);
        const chanceCor = chancePct >= 70 ? '#8ac070' : chancePct >= 40 ? '#e8b923' : '#d05050';
        const req = phaseObj ? calcPhaseReqV83(chapterAtual, phaseAtual, diff) : 0;
        const semFases = fasesDisponiveis.length === 0;

        ov.innerHTML = `
            <div class="expedicao-panel">
                <div class="expedicao-header">
                    <div class="exp-hero">
                        <img src="${sprite}" class="exp-hero-sprite" onerror="this.style.display='none'">
                        <div>
                            <div class="exp-hero-name">${heroData?.displayName || selHeroi}</div>
                            <div class="exp-hero-power">Poder: <b>${heroPower}</b></div>
                        </div>
                    </div>
                    <button class="exp-close" onclick="window._expFechar()">✕</button>
                </div>

                <div class="exp-section">
                    <div class="exp-section-title">DIFICULDADE</div>
                    <div class="exp-diff-list">${diffBtns}</div>
                </div>

                ${semFases ? `
                    <div class="exp-preview" style="text-align:center; padding:30px; color:#8a7a52; font-family:'EB Garamond',serif; font-style:italic;">
                        Nenhuma fase completada no <b>${DIFF_LABEL[diff]}</b>.<br>
                        Complete fases no Modo História nesta dificuldade para liberar expedições.
                    </div>
                ` : `
                    <div class="exp-section">
                        <div class="exp-section-title">ATO</div>
                        <div class="exp-chapter-list">${chapterBtns}</div>
                    </div>
                    <div class="exp-section">
                        <div class="exp-section-title">FASE</div>
                        <div class="exp-phase-list">${phaseBtns}</div>
                    </div>
                    ${phaseObj ? `
                    <div class="exp-preview">
                        <div class="exp-preview-row">
                            <span>Chance de sucesso:</span>
                            <b style="color:${chanceCor}; font-size:1.3rem;">${chancePct}%</b>
                        </div>
                        <div class="exp-preview-row">
                            <span>Poder:</span>
                            <b>${heroPower}</b> · Necessário: <b>${Math.round(req)}</b>
                        </div>
                        <div class="exp-preview-row">
                            <span>Tempo:</span>
                            <b>${tempoLabel}</b>
                        </div>
                        <div class="exp-preview-row">
                            <span>Recompensa (sucesso):</span>
                            <b>+${Math.floor((phaseObj.reward?.xp||0) * 0.5 * DIFF_MULT[diff])} XP · +${Math.floor((phaseObj.reward?.gold||0) * 0.5 * DIFF_MULT[diff])} ouro</b>
                        </div>
                        <div class="exp-preview-row dim">
                            <span>Recompensa (falha):</span>
                            <b>+${Math.floor((phaseObj.reward?.xp||0) * 0.15)} XP (consolação)</b>
                        </div>
                        ${phaseAtual === '13-4' ? `<div class="exp-preview-warn">⚠️ Fase final: chance travada em 10%–30%</div>` : ''}
                    </div>
                    ` : ''}
                `}

                <div class="exp-actions">
                    <button class="exp-btn exp-btn-secondary" onclick="window._expFechar()">Cancelar</button>
                    <button class="exp-btn exp-btn-primary" ${!phaseObj ? 'disabled' : ''} onclick="window._expEnviar()">
                        ⛺ Enviar para expedição
                    </button>
                </div>
            </div>
        `;
    }

    // ─────────────────────────────────────────────────────
    // ABRIR EXPEDIÇÃO
    // ─────────────────────────────────────────────────────
    window.abrirTelaExpedicao = function(heroClass) {
        if (typeof window.heroiEmExpedicao === 'function' && heroiEmExpedicao(heroClass)) {
            if (typeof showToast === 'function') showToast('⛺', 'Herói já está em expedição.', '⛺');
            return;
        }
        const exps = Array.isArray(STORY_PROGRESS.expeditions) ? STORY_PROGRESS.expeditions : [];
        const ativas = exps.filter(e => !e.coletada);
        const estrelas = (typeof getTotalStars === 'function') ? getTotalStars() : 0;
        let slots = 3;
        if (estrelas >= 200) slots = 5;
        else if (estrelas >= 100) slots = 4;
        if (ativas.length >= slots) {
            if (typeof showToast === 'function') showToast('⛺', `Slots cheios (${ativas.length}/${slots}).`, '⛺');
            return;
        }

        if (!window._expState) {
            window._expState = { heroClass: null, chapterId: null, phaseId: null, difficulty: 'normal' };
        }
        window._expState.heroClass = heroClass;
        window._expState.chapterId = null;
        window._expState.phaseId = null;

        const old = document.getElementById('expedicaoOverlay');
        if (old) old.remove();

        const ov = document.createElement('div');
        ov.id = 'expedicaoOverlay';
        ov.className = 'expedicao-overlay';
        ov.onclick = (e) => { if (e.target === ov) window._expFechar(); };
        document.body.appendChild(ov);

        renderTelaExpedicaoV83();
    };

    // Hooks de seleção (substituem os antigos)
    window._expSelChapter = function(cid) {
        if (!window._expState) return;
        window._expState.chapterId = cid;
        window._expState.phaseId = null;
        renderTelaExpedicaoV83();
    };

    window._expSelPhase = function(pid) {
        if (!window._expState) return;
        window._expState.phaseId = pid;
        renderTelaExpedicaoV83();
    };

    window._expSelDiff = function(d) {
        if (!window._expState) return;
        window._expState.difficulty = d;
        // ⭐ Reseta chapter/phase — as fases disponíveis mudam
        window._expState.chapterId = null;
        window._expState.phaseId = null;
        renderTelaExpedicaoV83();
    };

    // ─────────────────────────────────────────────────────
    // REBIND do botão 🗺️ (o V79 chama função local do IIFE)
    // ─────────────────────────────────────────────────────
    function _rebindBotoesExpedicao() {
        document.querySelectorAll('.hero-expedition-btn').forEach(btn => {
            if (btn._v83) return;
            const card = btn.closest('.story-hero-card');
            if (!card) return;
            const attr = card.getAttribute('onclick') || '';
            const match = attr.match(/toggleHeroSelection\('((?:\\'|[^'])*)'\)/);
            if (!match) return;
            const hc = match[1].replace(/\\'/g, "'");
            btn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                window.abrirTelaExpedicao(hc);
            };
            btn._v83 = true;
        });
    }
    setTimeout(_rebindBotoesExpedicao, 500);
    setTimeout(_rebindBotoesExpedicao, 1500);

    // Observer leve (não monitora body inteiro, só a storyScreen)
    setInterval(() => {
        const ss = document.getElementById('storyScreen');
        if (ss?.classList.contains('active') && ss.innerHTML.includes('OCA')) {
            _rebindBotoesExpedicao();
        }
    }, 2000);

    // ─────────────────────────────────────────────────────
    // DEBUG
    // ─────────────────────────────────────────────────────
    window._debugV83 = function() {
        console.group('=== V83 ===');
        console.log('Ritual scroll persistido:', _ritualScrollPersistido);
        console.log('Ritual filtro:', _ritualFilterRole);
        console.log('Expedição state:', window._expState);
        console.log('');
        ['normal', 'dificil', 'pesadelo'].forEach(d => {
            const f = [];
            Object.values(STORY_CHAPTERS).forEach(ch => {
                ch.phases.forEach(ph => {
                    if (isPhaseCompletedInDiff(ph.id, d)) f.push(ph.id);
                });
            });
            console.log(`${d}: ${f.length} fases →`, f.slice(0,5).join(', ') + (f.length > 5 ? '...' : ''));
        });
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V83] Fix Ritual + Expedição');
    console.log('═══════════════════════════════════════════════════');
    console.log('🎯 RITUAL:');
    console.log('  • Scroll preservado em TODOS os níveis (2-10 e 11)');
    console.log('  • Filtro por role (Todos/Guerreiro/Mago/Arqueiro)');
    console.log('');
    console.log('🎯 EXPEDIÇÃO:');
    console.log('  • Fases filtradas pela DIFICULDADE SELECIONADA');
    console.log('  • Não usa mais storyCurrentDifficulty');
    console.log('  • Reseta chapter/phase ao trocar dificuldade');
    console.log('  • Mensagem clara quando não há fases naquela dif');
    console.log('');
    console.log('💡 Debug: window._debugV83()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V84 — Custo de ouro nas Expedições
// -----------------------------------------------------------------
// • Custo = metade da recompensa de ouro em caso de SUCESSO
//   (mesma fórmula já usada para calcular a recompensa)
// • Mostra no preview: custo + saldo atual
// • Botão desabilitado se o saldo for insuficiente
// • Cobra o ouro no envio (validação antes)
// • Registra custoPago na expedição (para histórico)
//
// Cole NO FINAL do historia.js (depois do V83).
// =================================================================
(function cobrarOuroExpedicaoV84() {
    if (window._cobrarOuroExpedicaoV84) return;
    window._cobrarOuroExpedicaoV84 = true;

    const DIFF_MULT = { normal: 1, dificil: 1.3, pesadelo: 1.6 };
    const TEMPO_MS  = { normal: 30*60000, dificil: 60*60000, pesadelo: 120*60000 };

    function calcOuroSucesso(phase, diff) {
        return Math.floor((phase?.reward?.gold || 0) * 0.5 * (DIFF_MULT[diff] || 1));
    }
    function calcCusto(phase, diff) {
        return Math.floor(calcOuroSucesso(phase, diff) / 2);
    }
    window._calcCustoExpedicaoV84 = calcCusto;
    window._calcOuroSucessoV84 = calcOuroSucesso;

    // ═══════════════════════════════════════════════════════════
    // PÓS-PROCESSAMENTO DO OVERLAY (injeta custo + saldo + regra do botão)
    // ═══════════════════════════════════════════════════════════
    function posProcessar() {
        const ov = document.getElementById('expedicaoOverlay');
        if (!ov) return;

        const st = window._expState;
        if (!st || !st.phaseId) return;

        const ch = STORY_CHAPTERS[st.chapterId];
        const ph = ch?.phases.find(p => p.id === st.phaseId);
        if (!ph) return;

        const preview = ov.querySelector('.exp-preview');
        if (!preview) return;

        const custo = calcCusto(ph, st.difficulty);
        const saldo = STORY_PROGRESS.gold || 0;
        const podePagar = saldo >= custo;

        // Linha de custo
        let custoRow = preview.querySelector('.exp-custo-row');
        if (!custoRow) {
            custoRow = document.createElement('div');
            custoRow.className = 'exp-preview-row exp-custo-row';
            custoRow.style.cssText = 'border-top:1px solid rgba(232,185,35,.2);padding-top:8px;margin-top:8px;';
            custoRow.title = 'Metade da recompensa de ouro em caso de sucesso';
            custoRow.innerHTML = `<span>💰 Custo de envio:</span><b class="exp-custo-valor" style="color:#e67e22;">-${custo} ouro</b>`;
            preview.appendChild(custoRow);
        } else {
            const v = custoRow.querySelector('.exp-custo-valor');
            if (v) v.textContent = `-${custo} ouro`;
        }

        // Linha de saldo
        let saldoRow = preview.querySelector('.exp-saldo-row');
        if (!saldoRow) {
            saldoRow = document.createElement('div');
            saldoRow.className = 'exp-preview-row exp-saldo-row';
            saldoRow.style.fontSize = '.85rem';
            saldoRow.innerHTML = `<span>Saldo atual:</span><b class="exp-saldo-valor"></b>`;
            preview.appendChild(saldoRow);
        }
        const saldoValor = saldoRow.querySelector('.exp-saldo-valor');
        if (saldoValor) {
            saldoValor.textContent = `${saldo} ouro`;
            saldoValor.style.color = podePagar ? '#8ac070' : '#d05050';
            saldoValor.style.fontWeight = '700';
        }

        // Aviso de insuficiência
        const insufExistente = preview.querySelector('.exp-preview-warn.insuficiente');
        if (!podePagar) {
            const txt = `❌ Ouro insuficiente (faltam ${custo - saldo})`;
            if (!insufExistente) {
                const aviso = document.createElement('div');
                aviso.className = 'exp-preview-warn insuficiente';
                aviso.style.cssText = 'border-left-color:#a83232;color:#d05050;background:rgba(168,50,50,.15);';
                aviso.textContent = txt;
                preview.appendChild(aviso);
            } else {
                insufExistente.textContent = txt;
            }
        } else if (insufExistente) {
            insufExistente.remove();
        }

        // Botão enviar
        const btn = ov.querySelector('.exp-btn-primary');
        if (btn) {
            if (!podePagar) {
                btn.disabled = true;
                btn.textContent = `❌ Faltam ${custo - saldo} ouro`;
            } else {
                btn.disabled = false;
                btn.textContent = `⛺ Enviar (-${custo} ouro)`;
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // HOOKS — reaplica o pós-processamento após cada render
    // ═══════════════════════════════════════════════════════════
    const _origAbrir = window.abrirTelaExpedicao;
    if (typeof _origAbrir === 'function' && !_origAbrir._v84) {
        window.abrirTelaExpedicao = function() {
            const r = _origAbrir.apply(this, arguments);
            setTimeout(posProcessar, 0);
            setTimeout(posProcessar, 100);
            return r;
        };
        window.abrirTelaExpedicao._v84 = true;
    }

    ['_expSelChapter', '_expSelPhase', '_expSelDiff'].forEach(nome => {
        const orig = window[nome];
        if (typeof orig === 'function' && !orig._v84) {
            window[nome] = function() {
                const r = orig.apply(this, arguments);
                setTimeout(posProcessar, 0);
                return r;
            };
            window[nome]._v84 = true;
        }
    });

    // Safety net (barato): se o overlay estiver aberto mas o custo sumiu
    setInterval(() => {
        if (document.getElementById('expedicaoOverlay')) posProcessar();
    }, 1500);

    // ═══════════════════════════════════════════════════════════
    // _expEnviar COM COBRANÇA
    // ═══════════════════════════════════════════════════════════
    window._expEnviar = () => {
        const st = window._expState;
        if (!st) { console.warn('[V84] expState ausente'); return; }

        const selHeroi   = st.heroClass;
        const selChapter = st.chapterId;
        const selPhase   = st.phaseId;
        const selDiff    = st.difficulty;

        if (!selHeroi || !selChapter || !selPhase || !selDiff) {
            if (typeof showToast === 'function') showToast('❌', 'Escolha fase e dificuldade', '❌');
            return;
        }

        // Slots
        const exps = Array.isArray(STORY_PROGRESS.expeditions) ? STORY_PROGRESS.expeditions : [];
        const ativas = exps.filter(e => !e.coletada);
        const estrelas = (typeof getTotalStars === 'function') ? getTotalStars() : 0;
        let slots = 3;
        if (estrelas >= 200) slots = 5;
        else if (estrelas >= 100) slots = 4;
        if (ativas.length >= slots) {
            if (typeof showToast === 'function') showToast('⛺', `Slots cheios (${ativas.length}/${slots}).`, '⛺');
            return;
        }
        // Herói já em expedição?
        if (exps.some(e => e.heroClass === selHeroi && !e.coletada)) {
            if (typeof showToast === 'function') showToast('⛺', 'Herói já em expedição.', '⛺');
            return;
        }

        const ch = STORY_CHAPTERS[selChapter];
        const ph = ch?.phases.find(p => p.id === selPhase);
        if (!ph) { console.warn('[V84] Fase não encontrada'); return; }

        // ⭐ CUSTO + COBRANÇA
        const custo = calcCusto(ph, selDiff);
        const saldo = STORY_PROGRESS.gold || 0;
        if (saldo < custo) {
            if (typeof showToast === 'function')
                showToast('❌', `Ouro insuficiente (precisa ${custo}, tem ${saldo})`, '❌');
            return;
        }
        STORY_PROGRESS.gold = saldo - custo;

        // ─── Recalcula chance ───
        function calcHeroPower(heroClass) {
            const hd = STORY_HERO_CLASSES[heroClass];
            if (!hd) return 0;
            const level = (typeof getHeroLevel === 'function') ? getHeroLevel(heroClass) : 1;
            const bonus = (typeof getHeroBonusFromLevel === 'function')
                ? (getHeroBonusFromLevel(heroClass) || {}) : {};
            let hp  = (hd.hp  || 0) + (bonus.hp  || 0);
            let atk = (hd.atk || 0) + (bonus.atk || 0);
            if (typeof getHeroEquipment === 'function') {
                const eq = getHeroEquipment(heroClass);
                if (eq?.arma && typeof getWeaponById === 'function') {
                    const w = getWeaponById(eq.arma);
                    if (w) atk += w.atkBonus || 0;
                }
                if (eq?.amuleto && typeof getAmuletById === 'function') {
                    const a = getAmuletById(eq.amuleto);
                    if (a?.efeito) {
                        atk += a.efeito.atkBonus || 0;
                        hp  += a.efeito.hpBonus  || 0;
                    }
                }
            }
            return (hp * 2) + (atk * 8) + (level * 15);
        }
        function calcPhaseReq(chapterId, phaseId, difficulty) {
            const c2 = STORY_CHAPTERS[chapterId];
            const p2 = c2?.phases.find(p => p.id === phaseId);
            if (!p2) return 1;
            let hpSum = 0, atkSum = 0;
            p2.enemies.forEach(eid => {
                const e = STORY_ENEMIES[eid];
                if (e) { hpSum += e.hp || 0; atkSum += e.atk || 0; }
            });
            return Math.max(1, (hpSum + atkSum * 5) * (DIFF_MULT[difficulty] || 1));
        }

        const hp  = calcHeroPower(selHeroi);
        const req = calcPhaseReq(selChapter, selPhase, selDiff);
        const isFinal    = (selPhase === '13-4');
        const divisor    = isFinal ? 3 : 2;
        const minChance  = isFinal ? 0.10 : 0.15;
        const maxChance  = isFinal ? 0.30 : 0.95;
        const chance = Math.max(minChance, Math.min(maxChance, hp / (req * divisor)));

        // ─── Push ───
        const exp = {
            id: 'exp_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            heroClass: selHeroi,
            chapterId: selChapter,
            phaseId: selPhase,
            phaseName: ph.name,
            difficulty: selDiff,
            chance,
            startedAt: Date.now(),
            durationMs: TEMPO_MS[selDiff],
            concluida: false,
            coletada: false,
            resultado: null,
            custoPago: custo, // ⭐ histórico
        };
        if (!Array.isArray(STORY_PROGRESS.expeditions)) STORY_PROGRESS.expeditions = [];
        STORY_PROGRESS.expeditions.push(exp);
        if (typeof saveStoryProgress === 'function') saveStoryProgress();

        if (typeof window._expFechar === 'function') window._expFechar();
        if (typeof showToast === 'function')
            showToast('⛺', `Expedição enviada! -${custo} ouro`, '⛺');
        if (typeof playSfx === 'function') { try { playSfx('win'); } catch(e) {} }
        if (typeof renderOcaScreenFiltered === 'function') renderOcaScreenFiltered();
    };

    // ═══════════════════════════════════════════════════════════
    // DEBUG
    // ═══════════════════════════════════════════════════════════
    window._debugCustoV84 = function() {
        console.group('=== V84 — Custo de Expedições ===');
        console.log('V84 ativo?', window._cobrarOuroExpedicaoV84);
        console.log('Saldo:', STORY_PROGRESS.gold);
        const st = window._expState;
        console.log('expState:', st);
        if (st && st.phaseId) {
            const ch = STORY_CHAPTERS[st.chapterId];
            const ph = ch?.phases.find(p => p.id === st.phaseId);
            if (ph) {
                const ouroSucesso = calcOuroSucesso(ph, st.difficulty);
                const custo = calcCusto(ph, st.difficulty);
                console.log(`Fase ${st.phaseId} (${st.difficulty}):`);
                console.log(`  Ouro no sucesso: ${ouroSucesso}`);
                console.log(`  Custo de envio:  ${custo}  (metade)`);
                console.log(`  Saldo atual:     ${STORY_PROGRESS.gold}`);
                console.log(`  Pode pagar?      ${(STORY_PROGRESS.gold||0) >= custo}`);
            }
        }
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V84] Custo de ouro nas Expedições');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Custo = metade da recompensa de ouro em sucesso');
    console.log('• Preview mostra custo + saldo atual');
    console.log('• Botão desabilitado se faltar ouro');
    console.log('• Cobra ouro ANTES de enviar');
    console.log('• Registra custoPago na expedição');
    console.log('');
    console.log('💡 Debug: window._debugCustoV84()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V85 — Upgrade de Equipamentos (Simples/Aprimorado/Ancestral)
// Cole NO FINAL do historia.js (último bloco).
// =================================================================
(function upgradeEquipamentosV85() {
    if (window._upgradeEquipamentosV85) return;
    window._upgradeEquipamentosV85 = true;

    // ═══════════════════════════════════════════════════════════
    // CONSTANTES
    // ═══════════════════════════════════════════════════════════
    const TIER_MAX = 2;
    const TIER_NOME = ['Simples', 'Aprimorado', 'Ancestral'];
    const TIER_AURA = ['simples', 'aprimorado', 'ancestral'];
    const TIER_COR  = ['#e8e8f0', '#c39bd3', '#8e44ad'];

    const CHANCE_TIER = [0.90, 0.09, 0.01];

    const CUSTO_EVENTO = {
        1: { qtd: 1000 },
        2: { qtd: 10000 },
    };
    const MULT_UPGRADE = { 1: 10, 2: 100 };
    window.MULT_UPGRADE = MULT_UPGRADE;

    // ═══════════════════════════════════════════════════════════
    // HELPERS DE TIER
    // ═══════════════════════════════════════════════════════════
    function getTierFromUid(uid) {
        if (!uid) return 0;
        const s = String(uid);
        const at = s.lastIndexOf('@');
        if (at === -1) return 0;
        const t = parseInt(s.slice(at + 1));
        return (t >= 0 && t <= TIER_MAX) ? t : 0;
    }
    function getUidSemTier(uid) {
        if (!uid) return uid;
        const s = String(uid);
        const at = s.lastIndexOf('@');
        return at === -1 ? s : s.slice(0, at);
    }
    function setTierInUid(uid, tier) {
        const base = getUidSemTier(uid);
        return tier === 0 ? base : `${base}@${tier}`;
    }
    function getTierInfo(tier) {
        return {
            tier,
            nome: TIER_NOME[tier] || TIER_NOME[0],
            aura: TIER_AURA[tier] || TIER_AURA[0],
            cor:  TIER_COR[tier]  || TIER_COR[0],
        };
    }

    window.getTierFromUid = getTierFromUid;
    window.getTierInfo = getTierInfo;
    window.getBaseId = window.getBaseId || getUidSemTier;
    window.TIER_MAX = TIER_MAX;
    window.TIER_NOME = TIER_NOME;

    // ═══════════════════════════════════════════════════════════
    // MIGRAÇÃO — garante UIDs com #
    // ═══════════════════════════════════════════════════════════
    function migrarSaves() {
        let mudou = false;
        if (!Array.isArray(STORY_PROGRESS.craftedWeapons)) STORY_PROGRESS.craftedWeapons = [];
        if (!Array.isArray(STORY_PROGRESS.craftedAmulets)) STORY_PROGRESS.craftedAmulets = [];

        [STORY_PROGRESS.craftedWeapons, STORY_PROGRESS.craftedAmulets].forEach(arr => {
            for (let i = 0; i < arr.length; i++) {
                const uid = arr[i];
                if (typeof uid !== 'string') continue;
                if (!uid.includes('#')) {
                    arr[i] = `${uid}#${Date.now()}${Math.floor(Math.random()*1000000)}`;
                    mudou = true;
                }
            }
        });
        if (mudou && typeof saveStoryProgress === 'function') saveStoryProgress();
    }
    migrarSaves();
    setTimeout(migrarSaves, 1500);

    // ═══════════════════════════════════════════════════════════
    // getWeaponById / getAmuletById com tier
    // (o .atkBonus retornado JÁ INCLUI o tier, então todo o resto
    //  do código que usa .atkBonus automaticamente pega o valor novo)
    // ═══════════════════════════════════════════════════════════
    window.getWeaponById = function(uid) {
        if (!uid) return null;
        const baseId = String(uid).split('#')[0].split('@')[0];
        const tier = getTierFromUid(uid);
        let base = (typeof STORY_WEAPONS !== 'undefined') ? STORY_WEAPONS[baseId] : null;
        const isEvent = !base && (typeof EVENTO_ARMAS !== 'undefined') && EVENTO_ARMAS[baseId];
        if (!base && isEvent) base = EVENTO_ARMAS[baseId];
        if (!base) return null;
        const baseAtk = base.atkBonus || 0;
        return {
            ...base,
            uid, baseId, id: uid, tier,
            baseAtkBonus: baseAtk,
            atkBonus: baseAtk + tier,
            isEventWeapon: !!isEvent,
        };
    };

    window.getAmuletById = function(uid) {
        if (!uid) return null;
        const baseId = String(uid).split('#')[0].split('@')[0];
        const tier = getTierFromUid(uid);
        const base = (typeof STORY_AMULETS !== 'undefined') ? STORY_AMULETS[baseId] : null;
        if (!base) return null;
        const ef = base.efeito ? { ...base.efeito } : {};
        if (ef.atkBonus)    ef.atkBonus    += tier;
        if (ef.hpBonus)     ef.hpBonus     += tier;
        if (ef.healPerTurn) ef.healPerTurn += tier;
        return { ...base, uid, baseId, id: uid, tier, efeito: ef };
    };

    // ═══════════════════════════════════════════════════════════
    // CUSTO DE UPGRADE
    // ═══════════════════════════════════════════════════════════
    function getUpgradeCost(uid) {
        const w = window.getWeaponById(uid);
        const a = !w ? window.getAmuletById(uid) : null;
        const item = w || a;
        if (!item) return null;
        const tier = item.tier;
        if (tier >= TIER_MAX) return null;
        const proximoTier = tier + 1;

        const isEspecial = item.isEventWeapon || item.baseId === 'coracao_vazio';

        if (isEspecial) {
            return {
                tipo: 'essencia',
                qtd: CUSTO_EVENTO[proximoTier].qtd,
                ouro: 0,
                tierAlvo: proximoTier,
                item,
            };
        }

        const baseRec = item.receita || {};
        const mult = MULT_UPGRADE[proximoTier];
        const receita = {};
        Object.entries(baseRec).forEach(([k, v]) => { receita[k] = v * mult; });

        return {
            tipo: 'material',
            receita,
            ouro: (item.custoOuro || 0) * mult,
            tierAlvo: proximoTier,
            item,
        };
    }
    window.getUpgradeCost = getUpgradeCost;

    function getEquipadoPor(uid) {
        if (!STORY_PROGRESS.heroEquipment) return null;
        for (const hc in STORY_PROGRESS.heroEquipment) {
            const eq = STORY_PROGRESS.heroEquipment[hc];
            if (eq.arma === uid || eq.amuleto === uid) return hc;
        }
        return null;
    }

    // ═══════════════════════════════════════════════════════════
    // EXECUTAR UPGRADE
    // ═══════════════════════════════════════════════════════════
    function executarUpgrade(uid) {
        const cost = getUpgradeCost(uid);
        if (!cost) { if (typeof showToast==='function') showToast('❌','Upgrade indisponível.','❌'); return; }

        if (getEquipadoPor(uid)) {
            if (typeof showToast==='function') showToast('❌','Desequipe o item antes de upar.','❌');
            return;
        }

        const item = cost.item;
        const proximoTier = cost.tierAlvo;

        if (cost.tipo === 'material') {
            for (const [matId, qtd] of Object.entries(cost.receita)) {
                const has = STORY_PROGRESS.inventory[matId] || 0;
                if (has < qtd) {
                    const m = STORY_MATERIALS[matId];
                    if (typeof showToast==='function')
                        showToast('❌',`Falta ${m?.name||matId}: ${qtd-has}.`,'❌');
                    return;
                }
            }
            if ((STORY_PROGRESS.gold || 0) < cost.ouro) {
                if (typeof showToast==='function')
                    showToast('❌',`Ouro insuficiente (precisa ${cost.ouro}).`,'❌');
                return;
            }
        } else {
            const currencyId = cost.moedaId || 'essencia_sombria';
            const ess = STORY_PROGRESS.inventory[currencyId] || 0;
            if (ess < cost.qtd) {
                if (typeof showToast==='function')
                    showToast('❌',`Essências insuficientes (precisa ${cost.qtd}).`,'❌');
                return;
            }
        }

        if (cost.tipo === 'material') {
            for (const [matId, qtd] of Object.entries(cost.receita)) {
                STORY_PROGRESS.inventory[matId] -= qtd;
                if (STORY_PROGRESS.inventory[matId] <= 0) delete STORY_PROGRESS.inventory[matId];
            }
            STORY_PROGRESS.gold -= cost.ouro;
        } else {
            const currencyId = cost.moedaId || 'essencia_sombria';
            STORY_PROGRESS.inventory[currencyId] -= cost.qtd;
            if (STORY_PROGRESS.inventory[currencyId] <= 0)
                delete STORY_PROGRESS.inventory[currencyId];
        }

        const novoUid = setTierInUid(uid, proximoTier);

        // Substitui na lista correta
        const inWeapons = STORY_PROGRESS.craftedWeapons.indexOf(uid);
        if (inWeapons !== -1) STORY_PROGRESS.craftedWeapons[inWeapons] = novoUid;
        const inAmulets = STORY_PROGRESS.craftedAmulets.indexOf(uid);
        if (inAmulets !== -1) STORY_PROGRESS.craftedAmulets[inAmulets] = novoUid;

        if (typeof saveStoryProgress === 'function') saveStoryProgress();

        if (typeof showToast==='function')
            showToast('⬆️', `${item.nome} → ${TIER_NOME[proximoTier]}`, '⬆️');

        mostrarAnimacaoTier(item.baseId, proximoTier, false);

        setTimeout(() => {
            if (typeof renderTesourariaScreen === 'function') renderTesourariaScreen();
        }, 2000);
    }
    window.executarUpgradeV85 = executarUpgrade;

    // ═══════════════════════════════════════════════════════════
    // CRAFT COM RNG
    // ═══════════════════════════════════════════════════════════
    function rolarTier() {
        const r = Math.random();
        if (r < CHANCE_TIER[2]) return 2;
        if (r < CHANCE_TIER[2] + CHANCE_TIER[1]) return 1;
        return 0;
    }
    window._rolarTierV85 = rolarTier;

    window.handleCraftWeapon = function(baseId) {
        const w = STORY_WEAPONS[baseId];
        if (!w) return;
        if (!isWeaponAvailable(baseId)) {
            if (typeof showToast==='function') showToast('❌','Ato não desbloqueado.','❌'); return;
        }
        if (!hasMaterials(w.receita)) {
            if (typeof showToast==='function') showToast('❌','Materiais insuficientes.','❌'); return;
        }
        if ((STORY_PROGRESS.gold || 0) < w.custoOuro) {
            if (typeof showToast==='function') showToast('❌',`Faltam ${w.custoOuro-(STORY_PROGRESS.gold||0)} de ouro.`,'❌'); return;
        }

        consumeMaterials(w.receita);
        STORY_PROGRESS.gold -= w.custoOuro;

        const tier = rolarTier();
        const baseUid = `${baseId}#${Date.now()}${Math.floor(Math.random()*1000000)}`;
        const finalUid = setTierInUid(baseUid, tier);
        STORY_PROGRESS.craftedWeapons.push(finalUid);
        if (typeof saveStoryProgress === 'function') saveStoryProgress();

        mostrarAnimacaoTier(baseId, tier, true);
        setTimeout(() => {
            if (typeof renderTesourariaScreen === 'function') renderTesourariaScreen();
        }, tier > 0 ? 2300 : 1600);
    };

    window.handleCraftAmulet = function(baseId) {
        const a = STORY_AMULETS[baseId];
        if (!a) return;
        if (!isAmuletAvailable(baseId)) {
            if (typeof showToast==='function') showToast('❌','Ato não desbloqueado.','❌'); return;
        }
        if (!hasMaterials(a.receita)) {
            if (typeof showToast==='function') showToast('❌','Materiais insuficientes.','❌'); return;
        }
        if ((STORY_PROGRESS.gold || 0) < a.custoOuro) {
            if (typeof showToast==='function') showToast('❌',`Faltam ${a.custoOuro-(STORY_PROGRESS.gold||0)} de ouro.`,'❌'); return;
        }

        consumeMaterials(a.receita);
        STORY_PROGRESS.gold -= a.custoOuro;

        const tier = rolarTier();
        const baseUid = `${baseId}#${Date.now()}${Math.floor(Math.random()*1000000)}`;
        const finalUid = setTierInUid(baseUid, tier);
        STORY_PROGRESS.craftedAmulets.push(finalUid);
        if (typeof saveStoryProgress === 'function') saveStoryProgress();

        mostrarAnimacaoTier(baseId, tier, true);
        setTimeout(() => {
            if (typeof renderTesourariaScreen === 'function') renderTesourariaScreen();
        }, tier > 0 ? 2300 : 1600);
    };

    // ═══════════════════════════════════════════════════════════
    // ANIMAÇÃO
    // ═══════════════════════════════════════════════════════════
    function mostrarAnimacaoTier(baseId, tier, isCraft) {
        const old = document.getElementById('tierAnimOverlay');
        if (old) old.remove();

        const w = (STORY_WEAPONS && STORY_WEAPONS[baseId])
            || (EVENTO_ARMAS && EVENTO_ARMAS[baseId])
            || (STORY_AMULETS && STORY_AMULETS[baseId]);
        if (!w) return;

        const fakeUid = `${baseId}#0`;
        const iconHTML = (STORY_WEAPONS[baseId] || (EVENTO_ARMAS && EVENTO_ARMAS[baseId]))
            ? window.getWeaponIcon(fakeUid, 'large')
            : window.getAmuletIcon(fakeUid, 'large');

        const tierInfo = getTierInfo(tier);
        const duracaoTotal = tier > 0 ? 2300 : 1600;

        const ov = document.createElement('div');
        ov.id = 'tierAnimOverlay';
        ov.className = 'tier-anim-overlay';
        ov.innerHTML = `
            <div class="tier-anim-panel">
                <div class="tier-anim-label">${isCraft ? 'FORJANDO' : 'ASCENDENDO'}</div>
                <div class="tier-anim-icon tier-aura-simples" id="tierAnimIcon">
                    ${iconHTML}
                    <div class="tier-anim-energy" id="tierAnimEnergy"></div>
                </div>
                <div class="tier-anim-name">${w.nome}</div>
                <div class="tier-anim-tier" id="tierAnimTier" style="opacity:0;">${tierInfo.nome}</div>
            </div>
        `;
        document.body.appendChild(ov);

        setTimeout(() => {
            const icone = document.getElementById('tierAnimIcon');
            if (!icone) return;
            if (tier > 0) {
                icone.classList.add('tier-anim-powered');
                const energy = document.getElementById('tierAnimEnergy');
                if (energy) energy.classList.add('active');
                setTimeout(() => {
                    icone.className = `tier-anim-icon tier-aura-${tierInfo.aura}`;
                    const tierEl = document.getElementById('tierAnimTier');
                    if (tierEl) {
                        tierEl.textContent = tierInfo.nome;
                        tierEl.style.color = tierInfo.cor;
                        tierEl.style.opacity = '1';
                    }
                    try { if (typeof playSfx==='function') playSfx('win'); } catch(e) {}
                }, 900);
            } else {
                const tierEl = document.getElementById('tierAnimTier');
                if (tierEl) { tierEl.textContent = tierInfo.nome; tierEl.style.opacity = '1'; }
            }
        }, 600);

        setTimeout(() => { if (ov.parentNode) ov.remove(); }, duracaoTotal);
    }
    window.mostrarAnimacaoTierV85 = mostrarAnimacaoTier;

    // ═══════════════════════════════════════════════════════════
    // INVENTÁRIO — reescreve com filtro de equipados + tier + UPAR
    // ═══════════════════════════════════════════════════════════
    window.renderTesourariaInventario = function(materialIds) {
        const eqMap = STORY_PROGRESS.heroEquipment || {};
        const armasEquipadas = new Set();
        const amuletosEquipados = new Set();
        for (const hc in eqMap) {
            if (eqMap[hc].arma) armasEquipadas.add(eqMap[hc].arma);
            if (eqMap[hc].amuleto) amuletosEquipados.add(eqMap[hc].amuleto);
        }

        const armas = (STORY_PROGRESS.craftedWeapons || [])
            .filter(uid => !armasEquipadas.has(uid))
            .map(uid => window.getWeaponById(uid))
            .filter(Boolean);

        const amuletos = (STORY_PROGRESS.craftedAmulets || [])
            .filter(uid => !amuletosEquipados.has(uid))
            .map(uid => window.getAmuletById(uid))
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

        const cardsHTML = materialIds.map(id => {
            const m = STORY_MATERIALS[id] || { emoji: '❓', name: '?' };
            const qty = STORY_PROGRESS.inventory[id] || 0;
            const price = window.getMaterialPrice?.(id) || 2;
            return `<div class="tesouraria-item">
                <div class="tesouraria-item-icon">${m.emoji}</div>
                <div class="tesouraria-item-name">${m.name}</div>
                <div class="tesouraria-item-qty">×${qty}</div>
                <div class="tesouraria-item-price">${uiIcon('gold')} ${price} / un.</div>
            </div>`;
        }).join('');

        const renderWeaponRow = (w) => {
            const ti = getTierInfo(w.tier);
            const icon = window.getWeaponIcon(w.uid, 'normal');
            const podeUpar = w.tier < TIER_MAX;
            return `<div class="inv-equip-row tier-row-${ti.aura}">
                <div class="inv-equip-icon tier-aura-${ti.aura}">${icon}</div>
                <div class="inv-equip-info">
                    <div class="inv-equip-name">${w.nome} <span class="tier-badge tier-badge-${ti.aura}">${ti.nome}</span></div>
                    <div class="inv-equip-meta">+${w.atkBonus} ATK ${w.elemento === 'ANY' ? '· ✨' : `· ${elemIcon(w.elemento)} ${w.elemento}`}</div>
                </div>
                ${podeUpar
                    ? `<button class="forge-btn" style="padding:4px 10px; font-size:.8rem;" onclick="window._abrirUpgradeModalV85('${w.uid}')">⬆️ UPAR</button>`
                    : `<span style="color:#e8b923; font-size:.75rem; font-weight:700; padding:4px 8px;">MAX</span>`}
                <button class="forge-btn danger" style="padding:4px 8px;" onclick="handleDismantleWeapon('${w.uid}')">🔥</button>
            </div>`;
        };

        const renderAmuletRow = (a) => {
            const ti = getTierInfo(a.tier);
            const icon = window.getAmuletIcon(a.uid, 'normal');
            const podeUpar = a.tier < TIER_MAX;
            const ef = a.efeito || {};
            const efeitos = [];
            if (ef.elementOverride) efeitos.push(`${elemIcon(ef.elementOverride)} ${ef.elementOverride}`);
            if (ef.hpBonus)     efeitos.push(`+${ef.hpBonus} HP`);
            if (ef.atkBonus)    efeitos.push(`+${ef.atkBonus} ATK`);
            if (ef.healPerTurn) efeitos.push(`+${ef.healPerTurn} HP/t`);
            return `<div class="inv-equip-row tier-row-${ti.aura}">
                <div class="inv-equip-icon tier-aura-${ti.aura}">${icon}</div>
                <div class="inv-equip-info">
                    <div class="inv-equip-name">${a.nome} <span class="tier-badge tier-badge-${ti.aura}">${ti.nome}</span></div>
                    <div class="inv-equip-meta">${efeitos.join(' · ') || '—'}</div>
                </div>
                ${podeUpar
                    ? `<button class="forge-btn" style="padding:4px 10px; font-size:.8rem;" onclick="window._abrirUpgradeModalV85('${a.uid}')">⬆️ UPAR</button>`
                    : `<span style="color:#e8b923; font-size:.75rem; font-weight:700; padding:4px 8px;">MAX</span>`}
                <button class="forge-btn danger" style="padding:4px 8px;" onclick="handleDismantleAmulet('${a.uid}')">🔥</button>
            </div>`;
        };

        const weaponsHTML = armas.length ? armas.map(renderWeaponRow).join('') : `<div class="inv-empty-line">Nenhuma arma não equipada.</div>`;
        const amuletsHTML = amuletos.length ? amuletos.map(renderAmuletRow).join('') : `<div class="inv-empty-line">Nenhum amuleto não equipado.</div>`;

        return `
            <div class="tesouraria-total">Valor do inventário: <b>${uiIcon('gold')} ${totalValue}</b></div>
            <div class="tesouraria-grid">${cardsHTML}</div>
            <div class="inv-equipment-section">
                <div class="inv-equipment-title">⚔️ ARMAS (não equipadas)</div>
                <div class="inv-equip-list">${weaponsHTML}</div>
                <div class="inv-equipment-title" style="margin-top:16px;">🧿 AMULETOS (não equipados)</div>
                <div class="inv-equip-list">${amuletsHTML}</div>
                <div class="inv-equipment-hint">💡 Itens equipados somem do inventário. Desequipe para upar ou desmanchar.</div>
            </div>
        `;
    };

    // ═══════════════════════════════════════════════════════════
    // MODAL DE UPGRADE
    // ═══════════════════════════════════════════════════════════
    window._abrirUpgradeModalV85 = function(uid) {
        const cost = getUpgradeCost(uid);
        if (!cost) { if (typeof showToast==='function') showToast('❌','Upgrade indisponível.','❌'); return; }
        const item = cost.item;
        const tierInfo = getTierInfo(item.tier);
        const proxInfo = getTierInfo(cost.tierAlvo);

        document.getElementById('upgradeModalOverlay')?.remove();

        let reqHTML = '';
        let podePagar = false;

        if (cost.tipo === 'material') {
            reqHTML = Object.entries(cost.receita).map(([matId, qtd]) => {
                const m = STORY_MATERIALS[matId];
                if (!m) return '';
                const has = STORY_PROGRESS.inventory[matId] || 0;
                const ok = has >= qtd;
                return `<div class="up-req-row ${ok?'ok':'no'}"><span>${m.emoji} ${m.name}</span><span><b style="color:${ok?'#8ac070':'#d05050'};">${has}</b> / ${qtd}</span></div>`;
            }).join('');
            const ouroOk = (STORY_PROGRESS.gold || 0) >= cost.ouro;
            reqHTML += `<div class="up-req-row ${ouroOk?'ok':'no'}"><span>💰 Ouro</span><span><b style="color:${ouroOk?'#8ac070':'#d05050'};">${STORY_PROGRESS.gold||0}</b> / ${cost.ouro}</span></div>`;
            podePagar = Object.entries(cost.receita).every(([k,v]) => (STORY_PROGRESS.inventory[k]||0) >= v) && ouroOk;
        } else {
            const currencyId = cost.moedaId || 'essencia_sombria';
            const isAncestral = currencyId === 'essencia_ancestral';
            const ess = STORY_PROGRESS.inventory[currencyId] || 0;
            const ok = ess >= cost.qtd;
            const label = isAncestral ? 'Essências Ancestrais' : 'Essências Sombrias';
            const emoji = isAncestral ? '🌎' : '🌑';
            reqHTML = `<div class="up-req-row ${ok?'ok':'no'}"><span>${emoji} ${label}</span><span><b style="color:${ok?'#8ac070':'#d05050'};">${ess}</b> / ${cost.qtd}</span></div>`;
            podePagar = ok;
        }

        const iconHTML = (item.isEventWeapon || (EVENTO_ARMAS && EVENTO_ARMAS[item.baseId]))
            ? window.getWeaponIcon(uid, 'large')
            : ((STORY_WEAPONS && STORY_WEAPONS[item.baseId])
                ? window.getWeaponIcon(uid, 'large')
                : window.getAmuletIcon(uid, 'large'));

        const ov = document.createElement('div');
        ov.id = 'upgradeModalOverlay';
        ov.className = 'upgrade-modal-overlay';
        ov.onclick = (e) => { if (e.target === ov) ov.remove(); };
        ov.innerHTML = `
            <div class="upgrade-modal-panel">
                <div class="upgrade-modal-header">
                    <div class="upgrade-modal-title">⬆️ APERFEIÇOAR</div>
                    <button class="upgrade-modal-close" onclick="document.getElementById('upgradeModalOverlay').remove()">✕</button>
                </div>
                <div class="upgrade-modal-body">
                    <div class="upgrade-modal-item">
                        <div class="upgrade-modal-icon tier-aura-${tierInfo.aura}">${iconHTML}</div>
                        <div class="upgrade-modal-name">${item.nome}</div>
                        <div class="upgrade-modal-tiers">
                            <span class="tier-badge tier-badge-${tierInfo.aura}">${tierInfo.nome}</span>
                            <span style="color:#8a7a52;">→</span>
                            <span class="tier-badge tier-badge-${proxInfo.aura}">${proxInfo.nome}</span>
                        </div>
                    </div>
                    <div class="upgrade-modal-section-title">📋 REQUISITOS</div>
                    <div class="upgrade-modal-req">${reqHTML}</div>
                    <div class="upgrade-modal-warning">✓ Upgrade é 100% garantido.</div>
                </div>
                <div class="upgrade-modal-actions">
                    <button class="exp-btn exp-btn-secondary" onclick="document.getElementById('upgradeModalOverlay').remove()">Cancelar</button>
                    <button class="exp-btn exp-btn-primary" ${podePagar?'':'disabled'} onclick="window._confirmarUpgradeV85('${uid}')">
                        ⬆️ CONFIRMAR
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(ov);
    };

    window._confirmarUpgradeV85 = function(uid) {
        document.getElementById('upgradeModalOverlay')?.remove();
        executarUpgrade(uid);
    };

    // ═══════════════════════════════════════════════════════════
    // DESMANCHAR — devolve 50% do investimento TOTAL
    // ═══════════════════════════════════════════════════════════
    function calcMultTotal(tier) {
        if (tier === 0) return 1;
        if (tier === 1) return 1 + MULT_UPGRADE[1];
        return 1 + MULT_UPGRADE[1] + MULT_UPGRADE[2];
    }

    function calcDismantleRefund(item) {
        const baseId = item.baseId || window.getBaseId(item.uid || item.id);
        const tier = Number(item.tier) || 0;
        const refund = {};
        const add = (id, qty) => { refund[id] = (refund[id] || 0) + qty; };
        const halve = () => Object.keys(refund).forEach(id => { refund[id] = Math.floor(refund[id] / 2); });

        // Equipamentos de raid são drops gratuitos: retorna metade apenas das essências pagas nos upgrades.
        if (item.raidOnly || String(baseId).startsWith('raid_')) {
            for (let t = 1; t <= tier; t++) {
                const spent = t === 1 ? 500 : 5000;
                add('essencia_sombria', spent);
                add('essencia_ancestral', spent);
            }
            // Raid no tier 0 é drop grátis; tiers 1/2 custam 500 e 5.000
            // de CADA moeda, sem receita de craft ou investimento inicial.
            Object.keys(refund).forEach(id => { refund[id] = Math.floor(refund[id] * 0.5); });
            return refund;
        }

        if (String(baseId).startsWith('arma_nacao_') || String(baseId).startsWith('amuleto_nacao_')) {
            if (String(baseId).startsWith('arma_nacao_')) add('essencia_ancestral', 1000);
            for (let t = 1; t <= tier; t++) add('essencia_ancestral', t === 1 ? 1000 : 10000);
            halve();
            return refund;
        }

        if (item.isEventWeapon || (typeof EVENTO_ARMAS !== 'undefined' && EVENTO_ARMAS[baseId])) {
            add('essencia_sombria', 1000);
            for (let t = 1; t <= tier; t++) add('essencia_sombria', t === 1 ? 1000 : 10000);
            halve();
            return refund;
        }

        if (baseId === 'coracao_vazio') {
            add('essencia_sombria', 10000);
            for (let t = 1; t <= tier; t++) add('essencia_sombria', t === 1 ? 1000 : 10000);
            halve();
            return refund;
        }

        const mult = calcMultTotal(tier);
        Object.entries(item.receita || {}).forEach(([id, qty]) => { refund[id] = Math.floor(qty * mult / 2); });
        return refund;
    }

    function creditDismantleRefund(refund) {
        if (!STORY_PROGRESS.inventory) STORY_PROGRESS.inventory = {};
        Object.entries(refund).forEach(([id, qty]) => {
            if (qty > 0) STORY_PROGRESS.inventory[id] = (STORY_PROGRESS.inventory[id] || 0) + qty;
        });
        return Object.entries(refund).filter(([, qty]) => qty > 0)
            .map(([id, qty]) => `${STORY_MATERIALS[id]?.emoji || '📦'} ×${qty}`);
    }

    window.handleDismantleWeapon = async function(uid) {
        const w = window.getWeaponById(uid);
        if (!w || !STORY_PROGRESS.craftedWeapons.includes(uid)) return;
        if (!(await uiConfirm(`Desmanchar "${w.nome} ${getTierInfo(w.tier).nome}"?\n\nReceberá 50% dos materiais/essências investidos.`))) return;

        const refund = calcDismantleRefund(w);
        STORY_PROGRESS.craftedWeapons.splice(STORY_PROGRESS.craftedWeapons.indexOf(uid), 1);
        for (const hc in STORY_PROGRESS.heroEquipment || {}) {
            if (STORY_PROGRESS.heroEquipment[hc].arma === uid) STORY_PROGRESS.heroEquipment[hc].arma = null;
        }
        const received = creditDismantleRefund(refund);
        if (String(w.baseId || '').startsWith('arma_nacao_')) {
            const legacy = STORY_PROGRESS.nacaoArmas || [];
            const legacyIndex = legacy.indexOf(w.baseId);
            if (legacyIndex !== -1) legacy.splice(legacyIndex, 1);
        }

        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        if (typeof showToast === 'function') showToast('🔥', 'Desmanchado: ' + (received.join(', ') || 'sem materiais/essências para devolver.'), '🔥');
        if (typeof renderTesourariaScreen === 'function') renderTesourariaScreen();
    };

    window.handleDismantleAmulet = async function(uid) {
        const a = window.getAmuletById(uid);
        if (!a || !STORY_PROGRESS.craftedAmulets.includes(uid)) return;
        if (!(await uiConfirm(`Desmanchar "${a.nome} ${getTierInfo(a.tier).nome}"?\n\nReceberá 50% dos materiais/essências investidos.`))) return;

        const refund = calcDismantleRefund(a);
        STORY_PROGRESS.craftedAmulets.splice(STORY_PROGRESS.craftedAmulets.indexOf(uid), 1);
        for (const hc in STORY_PROGRESS.heroEquipment || {}) {
            if (STORY_PROGRESS.heroEquipment[hc].amuleto === uid) STORY_PROGRESS.heroEquipment[hc].amuleto = null;
        }
        const received = creditDismantleRefund(refund);
        if (String(a.baseId || '').startsWith('amuleto_nacao_')) {
            const legacy = STORY_PROGRESS.nacaoAmuletos || [];
            const legacyIndex = legacy.indexOf(a.baseId);
            if (legacyIndex !== -1) legacy.splice(legacyIndex, 1);
        }

        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        if (typeof showToast === 'function') showToast('🔥', 'Desmanchado: ' + (received.join(', ') || 'sem materiais/essências para devolver.'), '🔥');
        if (typeof renderTesourariaScreen === 'function') renderTesourariaScreen();
    };

    // ═══════════════════════════════════════════════════════════
    // CSS
    // ═══════════════════════════════════════════════════════════
    if (!document.getElementById('v85CSS')) {
        const s = document.createElement('style');
        s.id = 'v85CSS';
        s.textContent = `
            /* Auras */
            .tier-aura-simples {
                filter: drop-shadow(0 0 4px rgba(232,232,240,.7)) drop-shadow(0 0 8px rgba(232,232,240,.4)) !important;
                border-color: #e8e8f0 !important;
            }
            .tier-aura-aprimorado {
                filter: drop-shadow(0 0 5px rgba(195,155,211,.8)) drop-shadow(0 0 12px rgba(195,155,211,.5)) !important;
                border-color: #c39bd3 !important;
            }
            .tier-aura-ancestral {
                filter: drop-shadow(0 0 8px rgba(142,68,173,1)) drop-shadow(0 0 16px rgba(142,68,173,.7)) drop-shadow(0 0 24px rgba(142,68,173,.4)) !important;
                border-color: #8e44ad !important;
                animation: ancestralPulseV85 1.8s ease-in-out infinite alternate;
            }
            @keyframes ancestralPulseV85 {
                from { filter: drop-shadow(0 0 6px rgba(142,68,173,.7)) drop-shadow(0 0 12px rgba(142,68,173,.5)); }
                to   { filter: drop-shadow(0 0 12px rgba(142,68,173,1)) drop-shadow(0 0 24px rgba(142,68,173,.8)) drop-shadow(0 0 32px rgba(142,68,173,.5)); }
            }

            /* Badges */
            .tier-badge {
                font-family: 'Cinzel', serif;
                font-size: .65rem;
                padding: 2px 7px;
                border-radius: 10px;
                font-weight: 700;
                letter-spacing: 1px;
                text-transform: uppercase;
                margin-left: 6px;
            }
            .tier-badge-simples { color:#e8e8f0; border:1px solid #e8e8f0; background:rgba(232,232,240,.1); }
            .tier-badge-aprimorado { color:#c39bd3; border:1px solid #c39bd3; background:rgba(195,155,211,.15); }
            .tier-badge-ancestral {
                color:#fff5dc; border:1px solid #8e44ad;
                background: linear-gradient(135deg, rgba(142,68,173,.4), rgba(106,16,144,.5));
                box-shadow: 0 0 10px rgba(142,68,173,.6);
            }

            .inv-equip-row.tier-row-ancestral {
                background: linear-gradient(90deg, rgba(142,68,173,.12), transparent 40%);
                border-left-color: #8e44ad;
            }
            .inv-equip-row.tier-row-aprimorado { border-left-color: #c39bd3; }
            .inv-equip-row.tier-row-simples { border-left-color: #e8e8f0; }

            /* Animação de craft */
            .tier-anim-overlay {
                position: fixed; inset: 0;
                background: rgba(10,6,2,.96);
                z-index: 25000;
                display: flex; align-items: center; justify-content: center;
                animation: tierAnimFadeIn .3s;
            }
            @keyframes tierAnimFadeIn { from { opacity: 0; } to { opacity: 1; } }
            .tier-anim-panel { text-align: center; padding: 30px; animation: tierAnimPanelIn .4s cubic-bezier(.25,.8,.3,1); }
            @keyframes tierAnimPanelIn { from { transform: scale(.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            .tier-anim-label {
                font-family: 'Cinzel', serif; color: #8a7a52;
                font-size: .85rem; letter-spacing: 4px; margin-bottom: 30px;
                animation: tierAnimLabelPulse 1.5s ease-in-out infinite alternate;
            }
            @keyframes tierAnimLabelPulse { from { opacity: .4; } to { opacity: 1; } }
            .tier-anim-icon {
                position: relative;
                display: inline-block;
                padding: 30px;
                border-radius: 12px;
                border: 3px solid transparent;
                margin-bottom: 20px;
            }
            .tier-anim-icon img,
            .tier-anim-icon .weapon-icon { width: 100px !important; height: 100px !important; object-fit: contain; }
            .tier-anim-icon .weapon-emoji { font-size: 5rem; }
            .tier-anim-icon.tier-anim-powered { animation: tierAnimShake .15s ease-in-out infinite; }
            @keyframes tierAnimShake { 0%,100% { transform: translateX(0); } 50% { transform: translateX(3px); } }
            .tier-anim-energy {
                position: absolute; inset: 0;
                border-radius: 12px;
                background: radial-gradient(circle, rgba(255,245,220,.6), rgba(232,185,35,.4) 40%, transparent 70%);
                opacity: 0; pointer-events: none;
            }
            .tier-anim-energy.active { animation: tierAnimEnergy 1s ease-in-out forwards; }
            @keyframes tierAnimEnergy {
                0% { opacity: 0; transform: scale(.3); }
                40% { opacity: 1; transform: scale(1.5); }
                100% { opacity: 0; transform: scale(2.2); }
            }
            .tier-anim-name {
                font-family: 'Cinzel Decorative', serif;
                color: #f0e2c0; font-size: 1.3rem;
                letter-spacing: 2px; margin-bottom: 12px;
            }
            .tier-anim-tier {
                font-family: 'Cinzel Decorative', serif;
                font-size: 2rem; font-weight: 900;
                letter-spacing: 4px;
                transition: opacity .5s;
                text-shadow: 0 0 20px currentColor;
            }

            /* Modal de upgrade */
            .upgrade-modal-overlay {
                position: fixed; inset: 0;
                background: rgba(10,6,2,.94);
                z-index: 22000;
                display: flex; align-items: center; justify-content: center;
                padding: 20px; animation: tierAnimFadeIn .2s;
            }
            .upgrade-modal-panel {
                background: linear-gradient(180deg, #2a1f10, #1a1208);
                border: 2px solid #c9a227;
                border-radius: 10px;
                max-width: 440px; width: 100%;
                padding: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,.9);
            }
            .upgrade-modal-header {
                display: flex; justify-content: space-between; align-items: center;
                border-bottom: 2px solid rgba(201,162,39,.3);
                padding-bottom: 12px; margin-bottom: 16px;
            }
            .upgrade-modal-title {
                font-family: 'Cinzel Decorative', serif;
                color: #e8b923; font-size: 1.2rem; letter-spacing: 2px;
            }
            .upgrade-modal-close {
                background: #6a2020; color: #f5c8c8;
                border: 1px solid #a83232; border-radius: 50%;
                width: 28px; height: 28px; cursor: pointer; font-weight: 700;
            }
            .upgrade-modal-item {
                text-align: center; padding: 15px;
                background: rgba(10,6,2,.5); border-radius: 6px;
                margin-bottom: 16px;
            }
            .upgrade-modal-icon {
                display: inline-block; padding: 12px;
                border-radius: 8px; border: 2px solid transparent;
                margin-bottom: 10px;
            }
            .upgrade-modal-icon img { width: 64px; height: 64px; object-fit: contain; }
            .upgrade-modal-name {
                font-family: 'Cinzel', serif; color: #f0e2c0;
                font-size: 1.05rem; margin-bottom: 8px;
            }
            .upgrade-modal-tiers { display: flex; justify-content: center; align-items: center; gap: 10px; }
            .upgrade-modal-section-title {
                font-family: 'Cinzel', serif; color: #8a7a52;
                font-size: .75rem; letter-spacing: 2px; margin-bottom: 8px;
            }
            .upgrade-modal-req { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
            .up-req-row {
                display: flex; justify-content: space-between;
                padding: 8px 12px; background: rgba(10,6,2,.5);
                border-radius: 4px; font-family: 'EB Garamond', serif;
                font-size: .9rem; border-left: 3px solid;
            }
            .up-req-row.ok { border-left-color: #6ba35c; color: #d9c89a; }
            .up-req-row.no { border-left-color: #a83232; color: #d9c89a; }
            .upgrade-modal-warning {
                font-family: 'EB Garamond', serif;
                color: #8a7a52; font-size: .85rem;
                font-style: italic; text-align: center;
                padding: 8px; background: rgba(10,6,2,.4);
                border-radius: 4px;
            }
            .upgrade-modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
        `;
        document.head.appendChild(s);
    }

    // ═══════════════════════════════════════════════════════════
    // DEBUG
    // ═══════════════════════════════════════════════════════════
    window._debugV85 = function() {
        console.group('=== V85 — Upgrade ===');
        console.log('V85 ativo?', window._upgradeEquipamentosV85);
        console.log('Armas:', (STORY_PROGRESS.craftedWeapons || []).length);
        (STORY_PROGRESS.craftedWeapons || []).slice(0, 5).forEach(uid => {
            const w = window.getWeaponById(uid);
            console.log(`  ${uid} → ${w?.nome} (${window.getTierInfo(w?.tier || 0).nome}) +${w?.atkBonus} ATK`);
        });
        console.groupEnd();
    };
    window._rolarTierDebugV85 = function(n) {
        n = n || 100;
        const r = [0,0,0];
        for (let i = 0; i < n; i++) r[rolarTier()]++;
        console.log(`${n} rolls → Simples=${r[0]}, Aprimorado=${r[1]}, Ancestral=${r[2]}`);
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V85] Upgrade de Equipamentos');
    console.log('═══════════════════════════════════════════════════');
    console.log('🎲 CRAFT: Simples 90% · Aprimorado 9% · Ancestral 1%');
    console.log('⬆️ UPGRADE (100% garantido):');
    console.log('  +1: 10× receita + 10× ouro  |  1000 essências (evento)');
    console.log('  +2: 100× receita + 100× ouro  |  10000 essências (evento)');
    console.log('💡 Itens equipados somem do inventário (desequipe para upar)');
    console.log('💡 Debug: window._debugV85()');
    console.log('💡 Teste RNG: window._rolarTierDebugV85(1000)');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V86.0 — EXPEDIÇÃO UNIFICADA DEFINITIVA
// -----------------------------------------------------------------
// • Modal único para História e Evento do Dia
// • Evento: Custo 2.0 do ouro base | Essências 3/6/9/12 | Tempo 2x
// • Slots separados (História 3-5 | Evento 3)
// • Interceptador de clique global (ignora botões antigos)
// =================================================================
(function expedicaoUnificadaV86() {
    if (window._expedicaoUnificadaV86) return;
    window._expedicaoUnificadaV86 = true;

    // ─── CONFIGURAÇÕES ───
    const FASE_EVT_REWARD = {
        '1': { xp: 80,  gold: 50,  essencia: 3  },
        '2': { xp: 120, gold: 75,  essencia: 6  },
        '3': { xp: 170, gold: 100, essencia: 9  },
        '4': { xp: 230, gold: 140, essencia: 12 },
    };
    const TEMPO_EVENTO  = { normal: 120*60000, dificil: 240*60000, pesadelo: 480*60000 }; // 2h, 4h, 8h
    const TEMPO_NORMAL  = { normal: 30*60000,  dificil: 60*60000,  pesadelo: 120*60000 }; // 30m, 1h, 2h
    const DIFF_MULT_EVT = { normal: 1.0, dificil: 1.5, pesadelo: 2.0 };
    const DIFF_MULT_NORM= { normal: 1.0, dificil: 1.3, pesadelo: 1.6 };
    const DIFF_LABEL    = { normal: 'Normal', dificil: 'Difícil', pesadelo: 'Pesadelo' };
    const DIFF_COR      = { normal: '#c9a227', dificil: '#e67e22', pesadelo: '#a83232' };
    
    const SLOTS_EVENTO  = 3;
    const CUSTO_MULT_EVENTO = 2.0; // ⭐ Custo de envio do evento

    // ─── HELPERS ───
    function calcHeroPower(heroClass) {
        const hd = STORY_HERO_CLASSES[heroClass];
        if (!hd) return 0;
        const level = (typeof getHeroLevel === 'function') ? getHeroLevel(heroClass) : 1;
        const bonus = (typeof getHeroBonusFromLevel === 'function')
            ? (getHeroBonusFromLevel(heroClass) || {}) : {};
        let hp = (hd.hp || 0) + (bonus.hp || 0);
        let atk = (hd.atk || 0) + (bonus.atk || 0);
        if (typeof getHeroEquipment === 'function') {
            const eq = getHeroEquipment(heroClass);
            if (eq?.arma && typeof getWeaponById === 'function') {
                const w = getWeaponById(eq.arma);
                if (w) atk += w.atkBonus || 0;
            }
            if (eq?.amuleto && typeof getAmuletById === 'function') {
                const a = getAmuletById(eq.amuleto);
                if (a?.efeito) {
                    atk += a.efeito.atkBonus || 0;
                    hp  += a.efeito.hpBonus  || 0;
                }
            }
        }
        return (hp * 2) + (atk * 8) + (level * 15);
    }

    function calcChanceNormal(heroClass, chapterId, phaseId, diff) {
        const ch = STORY_CHAPTERS[chapterId];
        const ph = ch?.phases.find(p => p.id === phaseId);
        if (!ph) return 0;
        let hpSum = 0, atkSum = 0;
        ph.enemies.forEach(eid => {
            const e = STORY_ENEMIES[eid];
            if (e) { hpSum += e.hp || 0; atkSum += e.atk || 0; }
        });
        const req = Math.max(1, (hpSum + atkSum * 5) * (DIFF_MULT_NORM[diff] || 1));
        const isFinal = (phaseId === '13-4');
        const divisor = isFinal ? 3 : 2;
        const minC = isFinal ? 0.10 : 0.15;
        const maxC = isFinal ? 0.30 : 0.95;
        return Math.max(minC, Math.min(maxC, calcHeroPower(heroClass) / (req * divisor)));
    }

    function calcChanceEvento(heroClass, faseId, diff) {
        const reqs = { '1': 50, '2': 100, '3': 150, '4': 200 };
        const req = (reqs[faseId] || 100) * (DIFF_MULT_EVT[diff] || 1);
        return Math.max(0.15, Math.min(0.95, calcHeroPower(heroClass) / (req * 2)));
    }

    function nacaoDoDia() {
        return Object.values(window.NACOES || {}).find(n => n.diaSemana === new Date().getDay()) || null;
    }

    function progressoNacao(nacaoId, diff) {
        const progresso = STORY_PROGRESS.nacaoProgressoPorDificuldade?.[diff]?.[nacaoId];
        const semana = typeof window.getWeekId === 'function' ? window.getWeekId() : null;
        if (!progresso || progresso.semana !== semana || !Array.isArray(progresso.fasesConcluidas)) {
            return [];
        }
        return progresso.fasesConcluidas;
    }

    function raridadeHeroi(heroClass) {
        if (typeof window.getHeroRarity === 'function') return window.getHeroRarity(heroClass);
        const hero = STORY_HERO_CLASSES[heroClass];
        if (!hero) return 1;
        if (hero.rarity) return hero.rarity;
        if (hero.starsNeeded === 0) return 1;
        return hero.starsNeeded < 100 ? 2 : 3;
    }

    function heroiElegivel(heroClass, tipo, nacao) {
        if (tipo !== 'nacao' || !nacao) return true;
        const maxStars = window._nacaoDayConfig?.[nacao.diaSemana]?.maxStars;
        return maxStars == null || raridadeHeroi(heroClass) <= maxStars;
    }

    // Restrição da fase de evento (mesma regra de eventoIniciarFase/manual).
    function restricaoEvento(heroClass, bossId) {
        const cfg = (typeof EVENTO_BOSSES !== 'undefined' && bossId) ? EVENTO_BOSSES[bossId] : null;
        if (!cfg || !cfg.restricao) return { valido: true, label: '' };

        const label = cfg.restricao.label || '';
        const heroiData = STORY_HERO_CLASSES[heroClass];
        if (!heroiData) return { valido: false, label, motivo: 'Herói inválido.' };

        if (cfg.restricao.tipo === 'elemento') {
            const elemento = (typeof window.getElementoRealDoHeroi === 'function')
                ? window.getElementoRealDoHeroi(heroClass)
                : (heroiData.element || 'FOGO');
            if (elemento !== cfg.restricao.valor) {
                return {
                    valido: false, label,
                    motivo: `Esta fase exige heróis de ${cfg.restricao.valor}. ${heroiData.displayName} é de ${elemento}.`,
                };
            }
        } else if (cfg.restricao.tipo === 'classe') {
            if (heroiData.role !== cfg.restricao.valor) {
                return {
                    valido: false, label,
                    motivo: `Esta fase exige ${cfg.restricao.valor}s. ${heroiData.displayName} é ${heroiData.role}.`,
                };
            }
        }

        return { valido: true, label };
    }

    function calcChanceNacao(heroClass, nacao, faseId, diff) {
        const ids = (nacao.deuses || []).slice(0, Number(faseId));
        const deuses = ids.map(id => window.NACAO_DEUSES?.[id]).filter(Boolean);
        const hpSum = deuses.reduce((sum, deus) => sum + (deus.hp || 0), 0);
        const atkSum = deuses.reduce((sum, deus) => sum + (deus.atk || 0), 0);
        const diffMult = DIFF_MULT_NORM[diff] || 1;
        const requirement = Math.max(1, (hpSum + atkSum * 5) * diffMult);
        return Math.max(0.15, Math.min(0.95, calcHeroPower(heroClass) / (requirement * 2)));
    }

    function calcRecompensaNacao(faseId, diff) {
        const phaseRewards = {
            '1': { xp: 200, gold: 150, essencia: 3 },
            '2': { xp: 350, gold: 250, essencia: 6 },
            '3': { xp: 500, gold: 400, essencia: 12 },
        }[faseId] || { xp: 0, gold: 0, essencia: 0 };
        const multiplier = { normal: 1, dificil: 1.5, pesadelo: 2.2 }[diff] || 1;
        return {
            xp: Math.floor(phaseRewards.xp * 0.5 * multiplier),
            gold: Math.floor(phaseRewards.gold * 0.5 * multiplier),
            essencia: Math.floor(phaseRewards.essencia * multiplier),
        };
    }

    function calcCustoNormal(chapterId, phaseId, diff) {
        const ch = STORY_CHAPTERS[chapterId];
        const ph = ch?.phases.find(p => p.id === phaseId);
        if (!ph) return 0;
        const ouro = Math.floor((ph.reward?.gold || 0) * 0.5 * (DIFF_MULT_NORM[diff] || 1));
        return Math.floor(ouro / 2);
    }

    function calcCustoEvento(faseId, diff) {
        const base = FASE_EVT_REWARD[faseId];
        if (!base) return 0;
        return Math.floor(base.gold * CUSTO_MULT_EVENTO * (DIFF_MULT_EVT[diff] || 1));
    }

    function slotsAtivos(tipo) {
        const exps = STORY_PROGRESS.expeditions || [];
        if (tipo === 'evento' || tipo === 'nacao') return exps.filter(e => e.tipo === tipo && !e.coletada).length;
        return exps.filter(e => e.tipo !== 'evento' && e.tipo !== 'nacao' && !e.coletada).length;
    }
    
    function slotsMax(tipo) {
        if (tipo === 'evento' || tipo === 'nacao') return SLOTS_EVENTO;
        const estrelas = (typeof getTotalStars === 'function') ? getTotalStars() : 0;
        return estrelas >= 200 ? 5 : estrelas >= 100 ? 4 : 3;
    }
    
    function heroiEmExp(heroClass) {
        return (STORY_PROGRESS.expeditions || []).some(e => e.heroClass === heroClass && !e.coletada);
    }

    // ─── ESTADO ───
    window._expStateV86 = {
        heroClass: null, tipo: 'normal', bossId: null, faseId: null, 
        chapterId: null, phaseId: null, difficulty: 'normal'
    };

    // ─── RENDER DO MODAL ───
    function render() {
        const ov = document.getElementById('expedicaoOverlayV86');
        if (!ov) return;

        const st = window._expStateV86;
        const diff = st.difficulty || 'normal';
        const tipo = st.tipo || 'normal';
        const selHeroi = st.heroClass;
        const isEvento = tipo === 'evento';
        const isNacao = tipo === 'nacao';
        const nacaoDia = isNacao ? nacaoDoDia() : null;

        const heroData = selHeroi ? STORY_HERO_CLASSES[selHeroi] : null;
        const heroPower = selHeroi ? calcHeroPower(selHeroi) : 0;
        const sprite = (selHeroi && SPRITES?.[selHeroi]) || '';

        const headerHTML = selHeroi
            ? `<div class="exp-hero" onclick="window._expV86TrocarHeroi()" style="cursor:pointer;" title="Trocar herói">
                   <img src="${sprite}" class="exp-hero-sprite" onerror="this.style.display='none'">
                   <div>
                       <div class="exp-hero-name">${heroData?.displayName || selHeroi}</div>
                       <div class="exp-hero-power">Poder: <b>${heroPower}</b> <span style="font-size:.7rem;color:#8a7a52;">(trocar)</span></div>
                   </div>
               </div>`
            : `<div class="exp-hero">
                   <div style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;background:rgba(10,6,2,.5);border-radius:50%;">?</div>
                   <div><div class="exp-hero-name">Escolha um herói</div></div>
               </div>`;

        const bossDia = (typeof getBossDoDia === 'function') ? getBossDoDia() : null;
        const temFasesEvento = bossDia && (typeof getEventoProgresso === 'function')
            ? getEventoProgresso(bossDia.id).fasesConcluidas.filter(f => f !== 'boss').length > 0
            : false;
        const nacaoDisponivel = nacaoDoDia();
        const temFasesNacao = nacaoDisponivel
            ? progressoNacao(nacaoDisponivel.id, diff).length > 0
            : false;

        const modoHTML = `
            <div class="exp-chapter-list">
                <button class="exp-chapter-btn ${!isEvento && !isNacao ? 'active' : ''}" onclick="window._expV86SelTipo('normal')">📖 História</button>
                <button class="exp-chapter-btn ${isEvento ? 'active' : ''}"
                        onclick="window.${temFasesEvento ? '_expV86SelTipo' : '_expV86ModoBloqueado'}('evento')"
                        title="${temFasesEvento ? '' : 'Complete uma fase do evento de hoje'}"
                        style="${temFasesEvento ? '' : 'opacity:.4;cursor:not-allowed;'}">
                    ⛺ Evento do Dia${temFasesEvento ? '' : ' 🔒'}
                </button>
                <button class="exp-chapter-btn ${isNacao ? 'active' : ''}"
                        onclick="window.${temFasesNacao ? '_expV86SelTipo' : '_expV86ModoBloqueado'}('nacao')"
                        title="${temFasesNacao ? '' : 'Conclua uma fase da nação de hoje nesta dificuldade'}"
                        style="${temFasesNacao ? '' : 'opacity:.4;cursor:not-allowed;'}">
                    🌎 Sete Nações${temFasesNacao ? '' : ' 🔒'}
                </button>
            </div>`;

        let secoesHTML = '';
        let faseObj = null;
        let chance = 0;
        let custo = 0;
        let tempoMs = TEMPO_NORMAL[diff];
        let recSucesso = { xp: 0, gold: 0, essencia: 0 };
        let recFalha = { xp: 0, gold: 0, essencia: 0 };

        if (isEvento) {
            if (!bossDia) {
                secoesHTML = `<div style="color:#8a7a52;text-align:center;padding:20px;font-style:italic;">Nenhum evento disponível hoje.</div>`;
            } else {
                const prog = getEventoProgresso(bossDia.id);
                const fasesDisp = [1,2,3,4].map(String).filter(f => prog.fasesConcluidas.includes(f));

                if (fasesDisp.length === 0) {
                    secoesHTML = `<div style="color:#8a7a52;text-align:center;padding:20px;font-style:italic;">
                        Nenhuma fase animal completada hoje.<br>Complete uma fase manualmente primeiro.</div>`;
                } else {
                    if (!st.faseId || !fasesDisp.includes(st.faseId)) st.faseId = fasesDisp[0];
                    st.bossId = bossDia.id;
                    const faseId = st.faseId;

                    const botoes = fasesDisp.map(f =>
                        `<button class="exp-phase-btn ${f === faseId ? 'active' : ''}" onclick="window._expV86SelPhase('${f}')">Fase ${f}</button>`
                    ).join('');

                    const avisoRestricao = (typeof EVENTO_BOSSES !== 'undefined'
                        && EVENTO_BOSSES[bossDia.id]?.restricao?.label) || '';
                    secoesHTML = `
                        <div class="exp-section">
                            <div class="exp-section-title">FASE — ${bossDia.nome}</div>
                            <div class="exp-phase-list">${botoes}</div>
                            ${avisoRestricao ? `<div style="color:#e8b923;text-align:center;margin-top:8px;">${avisoRestricao}</div>` : ''}
                        </div>`;

                    faseObj = { id: faseId, nome: `Fase ${faseId}` };
                    chance = calcChanceEvento(selHeroi, faseId, diff);
                    custo = calcCustoEvento(faseId, diff);
                    tempoMs = TEMPO_EVENTO[diff];
                    const dm = DIFF_MULT_EVT[diff];
                    const base = FASE_EVT_REWARD[faseId];
                    recSucesso = {
                        xp: Math.floor(base.xp * 0.5 * dm),
                        gold: Math.floor(base.gold * 0.5 * dm),
                        essencia: Math.floor(base.essencia * dm),
                    };
                    recFalha = { xp: Math.floor(base.xp * 0.15), gold: 0, essencia: 0 };
                }
            }
        } else if (isNacao) {
            if (!nacaoDia) {
                secoesHTML = `<div style="color:#8a7a52;text-align:center;padding:20px;font-style:italic;">Nenhuma nação disponível hoje.</div>`;
            } else {
                const fasesDisp = ['1', '2', '3'].filter(f => progressoNacao(nacaoDia.id, diff).includes(f));
                if (fasesDisp.length === 0) {
                    secoesHTML = `<div style="color:#8a7a52;text-align:center;padding:20px;font-style:italic;">
                        Nenhuma fase desta nação foi concluída em ${DIFF_LABEL[diff]} nesta semana.</div>`;
                } else {
                    if (!st.faseId || !fasesDisp.includes(String(st.faseId))) st.faseId = fasesDisp[0];
                    const faseId = String(st.faseId);
                    const dayConfig = window._nacaoDayConfig?.[nacaoDia.diaSemana];
                    const restriction = dayConfig?.maxStars == null
                        ? 'Sem limite de raridade.'
                        : `Heróis permitidos: até ${dayConfig.maxStars}★.`;
                    const botoes = fasesDisp.map(f =>
                        `<button class="exp-phase-btn ${f === faseId ? 'active' : ''}" onclick="window._expV86SelPhase('${f}')">Fase ${f}</button>`
                    ).join('');
                    secoesHTML = `
                        <div class="exp-section">
                            <div class="exp-section-title">FASE — ${nacaoDia.nome}</div>
                            <div class="exp-phase-list">${botoes}</div>
                            <div style="color:#c8b787;text-align:center;margin-top:8px;">${restriction}</div>
                        </div>`;
                    faseObj = { id: faseId, nome: `${nacaoDia.nome} — Fase ${faseId}` };
                    chance = calcChanceNacao(selHeroi, nacaoDia, faseId, diff);
                    custo = window._nacaoConfig?.custoEntrada?.[diff] || 500;
                    tempoMs = TEMPO_EVENTO[diff];
                    recSucesso = calcRecompensaNacao(faseId, diff);
                    const baseXp = { '1': 200, '2': 350, '3': 500 }[faseId] || 0;
                    recFalha = { xp: Math.floor(baseXp * 0.15), gold: 0, essencia: 0 };
                }
            }
        } else {
            // História
            const fasesDisp = [];
            Object.values(STORY_CHAPTERS).forEach(ch => {
                ch.phases.forEach(ph => {
                    if (typeof isPhaseCompletedInDiff === 'function' && isPhaseCompletedInDiff(ph.id, diff)) {
                        fasesDisp.push({ chapterId: ch.id, phase: ph });
                    }
                });
            });
            const chaptersComFases = [...new Set(fasesDisp.map(f => f.chapterId))].sort((a,b)=>a-b);

            if (chaptersComFases.length === 0) {
                secoesHTML = `<div style="color:#8a7a52;text-align:center;padding:20px;font-style:italic;">
                    Nenhuma fase completada no <b>${DIFF_LABEL[diff]}</b>.</div>`;
            } else {
                let chapterAtual = st.chapterId;
                if (!chapterAtual || !chaptersComFases.includes(chapterAtual)) {
                    chapterAtual = chaptersComFases[0];
                    st.chapterId = chapterAtual;
                }
                const fasesDoChapter = fasesDisp.filter(f => f.chapterId === chapterAtual);
                let phaseAtual = st.phaseId;
                if (!phaseAtual || !fasesDoChapter.some(f => f.phase.id === phaseAtual)) {
                    phaseAtual = fasesDoChapter[0]?.phase.id || null;
                    st.phaseId = phaseAtual;
                }
                if (phaseAtual) {
                    const atosBtns = chaptersComFases.map(cid =>
                        `<button class="exp-chapter-btn ${cid === chapterAtual ? 'active' : ''}" onclick="window._expV86SelChapter(${cid})">Ato ${cid}</button>`
                    ).join('');
                    const faseBtns = fasesDoChapter.map(f => {
                        const isBoss = f.phase.isBoss;
                        const isFinal = f.phase.isFinalBoss;
                        const ativo = f.phase.id === phaseAtual;
                        return `<button class="exp-phase-btn ${ativo ? 'active' : ''} ${isFinal ? 'final' : isBoss ? 'boss' : ''}" onclick="window._expV86SelPhase('${f.phase.id}')">
                            ${f.phase.id}${isFinal ? ' 👑' : isBoss ? ' 🎯' : ''}
                        </button>`;
                    }).join('');

                    secoesHTML = `
                        <div class="exp-section">
                            <div class="exp-section-title">ATO</div>
                            <div class="exp-chapter-list">${atosBtns}</div>
                        </div>
                        <div class="exp-section">
                            <div class="exp-section-title">FASE</div>
                            <div class="exp-phase-list">${faseBtns}</div>
                        </div>`;

                    const ph = fasesDoChapter.find(f => f.phase.id === phaseAtual)?.phase;
                    faseObj = { id: phaseAtual, nome: ph.name };
                    chance = calcChanceNormal(selHeroi, chapterAtual, phaseAtual, diff);
                    custo = calcCustoNormal(chapterAtual, phaseAtual, diff);
                    tempoMs = TEMPO_NORMAL[diff];
                    const dm = DIFF_MULT_NORM[diff];
                    recSucesso = {
                        xp: Math.floor((ph.reward?.xp || 0) * 0.5 * dm),
                        gold: Math.floor((ph.reward?.gold || 0) * 0.5 * dm),
                        essencia: 0,
                    };
                    recFalha = { xp: Math.floor((ph.reward?.xp || 0) * 0.15), gold: 0, essencia: 0 };
                }
            }
        }

        let heroisHTML = '';
        if (!selHeroi) {
            const unlockedList = STORY_PROGRESS.unlockedHeroesStory || ['Tupa','Sume','Caipora'];
            const disponiveis = Object.values(STORY_HERO_CLASSES).filter(h => {
                const unlocked = h.starsNeeded === 0 || unlockedList.includes(h.className);
                if (!unlocked || heroiEmExp(h.className)) return false;
                if (!heroiElegivel(h.className, tipo, nacaoDia)) return false;
                if (isEvento && st.bossId && !restricaoEvento(h.className, st.bossId).valido) return false;
                return true;
            });

            heroisHTML = disponiveis.length === 0
                ? `<div style="color:#8a7a52;text-align:center;padding:15px;font-style:italic;">Nenhum herói disponível para esta expedição. Confira a raridade exigida ou aguarde um herói voltar.</div>`
                : `<div class="exp-ev-heroes-grid">${disponiveis.map(h => {
                    const s = SPRITES?.[h.className] || '';
                    return `<div class="exp-ev-hero-card" onclick="window._expV86SelHero('${h.className.replace(/'/g,"\\'")}')">
                        <img src="${s}" class="exp-ev-hero-sprite" onerror="this.style.display='none'">
                        <div class="exp-ev-hero-name">${h.displayName}</div>
                        <div class="exp-ev-hero-role">${h.role}</div>
                    </div>`;
                }).join('')}</div>`;
        }

        let previewHTML = '';
        if (faseObj && selHeroi) {
            const chancePct = Math.round(chance * 100);
            const chanceCor = chancePct >= 70 ? '#8ac070' : chancePct >= 40 ? '#e8b923' : '#d05050';
            const tempoLabel = tempoMs >= 3600000 ? `${Math.round(tempoMs/3600000)}h` : `${Math.round(tempoMs/60000)}min`;
            const saldo = STORY_PROGRESS.gold || 0;
            const podePagar = saldo >= custo;

            previewHTML = `
                <div class="exp-preview">
                    <div class="exp-preview-row"><span>Chance:</span><b style="color:${chanceCor};font-size:1.3rem;">${chancePct}%</b></div>
                    <div class="exp-preview-row"><span>Tempo:</span><b>${tempoLabel}</b></div>
                    <div class="exp-preview-row" style="color:#8ac070;">
                        <span>Sucesso:</span>
                        <b>+${recSucesso.xp} XP · +${recSucesso.gold} 🪙${recSucesso.essencia > 0 ? ` · +${recSucesso.essencia} ${isNacao ? '🌎' : '🌑'}` : ''}</b>
                    </div>
                    <div class="exp-preview-row dim" style="font-size:.8rem;"><span>Falha:</span><b>+${recFalha.xp} XP</b></div>
                    <div class="exp-preview-row" style="border-top:1px solid rgba(232,185,35,.2);padding-top:8px;margin-top:8px;">
                        <span>💰 Custo:</span><b style="color:${podePagar?'#e8b923':'#d05050'};">${custo} ouro</b>
                    </div>
                    <div class="exp-preview-row" style="font-size:.8rem;"><span>Saldo:</span><b style="color:${podePagar?'#8ac070':'#d05050'};">${saldo}</b></div>
                    ${!podePagar ? `<div class="exp-preview-warn" style="border-left-color:#a83232;color:#d05050;background:rgba(168,50,50,.15);">❌ Faltam ${custo-saldo} ouro</div>` : ''}
                </div>`;
        }

        const restricaoEvt = (selHeroi && isEvento && st.bossId)
            ? restricaoEvento(selHeroi, st.bossId)
            : { valido: true };
        const heroiPermitido = !selHeroi
            || (heroiElegivel(selHeroi, tipo, nacaoDia) && restricaoEvt.valido);
        const sa = slotsAtivos(tipo);
        const sm = slotsMax(tipo);
        const cheios = sa >= sm;
        let motivo = '';
        if (!selHeroi) motivo = 'Escolha um herói';
        else if (heroiEmExp(selHeroi)) motivo = 'Herói já está em expedição';
        else if (!heroiPermitido) motivo = isEvento
            ? (restricaoEvt.motivo || 'Herói não permitido nesta fase')
            : `Herói acima do limite de raridade (${window._nacaoDayConfig?.[nacaoDia?.diaSemana]?.maxStars}★)`;
        else if (!faseObj) motivo = 'Escolha uma fase';
        else if (cheios) motivo = `Slots cheios (${sa}/${sm})`;
        else if ((STORY_PROGRESS.gold || 0) < custo) motivo = `Faltam ${custo - (STORY_PROGRESS.gold || 0)} ouro`;
        const podeEnviar = !motivo;
        const btnLabel = podeEnviar ? `⛺ Enviar (-${custo} 🪙)` : `❌ ${motivo}`;

        ov.innerHTML = `
            <div class="expedicao-panel">
                <div class="expedicao-header">
                    ${headerHTML}
                    <button class="exp-close" onclick="document.getElementById('expedicaoOverlayV86').remove()">✕</button>
                </div>

                <div class="exp-section">
                    <div class="exp-section-title">DIFICULDADE</div>
                    <div class="exp-diff-list">
                        ${['normal','dificil','pesadelo'].map(d =>
                            `<button class="exp-diff-btn ${d===diff?'active':''}" onclick="window._expV86SelDiff('${d}')" style="--cor:${DIFF_COR[d]};">${DIFF_LABEL[d]}</button>`
                        ).join('')}
                    </div>
                </div>

                <div class="exp-section">
                    <div class="exp-section-title">MODO</div>
                    ${modoHTML}
                </div>

                ${secoesHTML}
                ${heroisHTML}
                ${previewHTML}

                <div class="exp-actions">
                    <button class="exp-btn exp-btn-secondary" onclick="document.getElementById('expedicaoOverlayV86').remove()">Cancelar</button>
                    <button class="exp-btn exp-btn-primary" ${podeEnviar ? '' : 'disabled'} onclick="window._expV86Enviar()">${btnLabel}</button>
                </div>
            </div>
        `;
    }

    // ─── CONTROLES ───
    window._expV86TrocarHeroi = function() { window._expStateV86.heroClass = null; render(); };
    window._expV86SelTipo = function(t) { 
        const st = window._expStateV86; st.tipo = t; st.chapterId = null; st.phaseId = null; st.faseId = null; 
        if (t === 'evento') st.difficulty = STORY_PROGRESS.eventoDificuldade || 'normal';
        else if (t === 'nacao') st.difficulty = typeof storyCurrentDifficulty !== 'undefined' ? storyCurrentDifficulty : STORY_PROGRESS.difficulty || 'normal';
        render(); 
    };
    window._expV86SelDiff = function(d) { 
        const st = window._expStateV86; st.difficulty = d; st.chapterId = null; st.phaseId = null; st.faseId = null; 
        render(); 
    };
    window._expV86SelChapter = function(cid) { window._expStateV86.chapterId = cid; window._expStateV86.phaseId = null; render(); };

    // Abas de modo bloqueadas: dizem o que falta, em vez de morrer no clique.
    window._expV86ModoBloqueado = function(t) {
        const diffAtual = window._expStateV86?.difficulty || 'normal';
        const diffLabel = DIFF_LABEL[diffAtual] || diffAtual;
        let msg;
        if (t === 'evento') {
            const b = (typeof getBossDoDia === 'function') ? getBossDoDia() : null;
            msg = b
                ? `Conclua ao menos uma fase animal de ${b.nome} hoje para liberar a expedição de evento.`
                : 'Hoje não há evento ativo.';
        } else {
            const n = nacaoDoDia();
            msg = n
                ? `Conclua uma fase de ${n.nome} hoje, na dificuldade ${diffLabel}, para liberar.`
                : 'Hoje não há nação ativa.';
        }
        if (typeof showToast === 'function') showToast('🔒 Bloqueado', msg, '🔒');
    };

    // Diagnóstico das duas abas (usar no console).
    window._debugExpModos = function() {
        const b = (typeof getBossDoDia === 'function') ? getBossDoDia() : null;
        const n = nacaoDoDia();
        const diff = window._expStateV86?.difficulty || 'normal';
        const progEvt = (b && typeof getEventoProgresso === 'function') ? getEventoProgresso(b.id) : null;
        console.group('═══ Modos de expedição ═══');
        console.log('Evento de hoje:', b ? `${b.nome} (${b.id})` : 'nenhum');
        console.log('Fases de evento concluídas:', progEvt ? progEvt.fasesConcluidas : '—');
        console.log('Nação de hoje:', n ? `${n.nome} (${n.id})` : 'nenhuma');
        console.log('Fases da nação nesta semana (' + diff + '):', n ? progressoNacao(n.id, diff) : '—');
        console.groupEnd();
    };
    window._expV86SelPhase = function(pid) { window._expStateV86.phaseId = pid; window._expStateV86.faseId = pid; render(); };
    window._expV86SelHero = function(hc) { 
        if (heroiEmExp(hc)) { if(typeof showToast==='function') showToast('⛺', 'Herói já em expedição.', '⛺'); return; }
        const nacao = window._expStateV86.tipo === 'nacao' ? nacaoDoDia() : null;
        if (!heroiElegivel(hc, window._expStateV86.tipo, nacao)) {
            if (typeof showToast === 'function') showToast('🚫', 'Este herói excede a raridade permitida hoje.', '🚫');
            return;
        }
        window._expStateV86.heroClass = hc; render(); 
    };

    window.abrirTelaExpedicaoV86 = function(heroClass, tipoInicial, bossIdInicial, faseIdInicial) {
        const st = window._expStateV86;
        st.heroClass = heroClass || null;
        st.tipo = tipoInicial || 'normal';
        st.bossId = bossIdInicial || null;
        st.faseId = faseIdInicial || null;
        st.chapterId = null;
        st.phaseId = null;
        st.difficulty = tipoInicial === 'evento'
            ? (STORY_PROGRESS.eventoDificuldade || 'normal')
            : (typeof storyCurrentDifficulty !== 'undefined' ? storyCurrentDifficulty : 'normal');

        if (heroClass && heroiEmExp(heroClass)) {
            if (typeof showToast === 'function') showToast('⛺', 'Herói já em expedição.', '⛺');
            st.heroClass = null;
        }

        document.getElementById('expedicaoOverlayV86')?.remove();
        document.getElementById('expedicaoOverlay')?.remove(); // remove o antigo
        const ov = document.createElement('div');
        ov.id = 'expedicaoOverlayV86';
        ov.className = 'expedicao-overlay';
        ov.onclick = (e) => { if (e.target === ov) ov.remove(); };
        document.body.appendChild(ov);
        render();
    };

    window._expV86Enviar = function() {
        const st = window._expStateV86;
        if (!st || !st.heroClass) return;
        const tipo = st.tipo || 'normal';
        const diff = st.difficulty || 'normal';

        if (slotsAtivos(tipo) >= slotsMax(tipo)) {
            if (typeof showToast === 'function') {
                showToast('⛺ Expedição', `Slots cheios (${slotsAtivos(tipo)}/${slotsMax(tipo)}). Colete uma expedição pronta.`, '⛺');
            }
            return;
        }
        if (heroiEmExp(st.heroClass)) {
            if (typeof showToast === 'function') {
                showToast('⛺ Expedição', `${STORY_HERO_CLASSES[st.heroClass]?.displayName || st.heroClass} já está em uma expedição.`, '⛺');
            }
            return;
        }

        if (!Array.isArray(STORY_PROGRESS.expeditions)) STORY_PROGRESS.expeditions = [];

        if (tipo === 'evento') {
            const base = FASE_EVT_REWARD[st.faseId];
            if (!base || !st.bossId) return;

            const chkRestricao = restricaoEvento(st.heroClass, st.bossId);
            if (!chkRestricao.valido) {
                if (typeof showToast === 'function') {
                    showToast('🚫 Restrição', chkRestricao.motivo, '🚫');
                }
                return;
            }
            const custo = calcCustoEvento(st.faseId, diff);
            if ((STORY_PROGRESS.gold || 0) < custo) return;
            STORY_PROGRESS.gold -= custo;
            const chance = calcChanceEvento(st.heroClass, st.faseId, diff);
            const multiplier = DIFF_MULT_EVT[diff] || 1;
            const recompensa = {
                xp: Math.floor(base.xp * 0.5 * multiplier),
                gold: Math.floor(base.gold * 0.5 * multiplier),
                essencia: Math.floor(base.essencia * multiplier),
            };
            
            STORY_PROGRESS.expeditions.push({
                id: 'exp_evt_' + Date.now(),
                tipo: 'evento', bossId: st.bossId, faseId: st.faseId, 
                heroClass: st.heroClass, phaseName: `Fase ${st.faseId}`, difficulty: diff,
                chance, startedAt: Date.now(), durationMs: TEMPO_EVENTO[diff],
                concluida: false, coletada: false, resultado: null, custoPago: custo,
                recompensa: {
                    xp: recompensa.xp,
                    gold: recompensa.gold,
                    drops: recompensa.essencia > 0
                        ? [{ id: 'essencia_sombria', qty: recompensa.essencia }]
                        : [],
                },
            });
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
            document.getElementById('expedicaoOverlayV86')?.remove();
            if (typeof showToast === 'function') showToast('⛺', `Enviado! -${custo} ouro`, '⛺');
            if (typeof renderOcaScreenFiltered === 'function') renderOcaScreenFiltered();
            
        } else if (tipo === 'nacao') {
            const nacao = nacaoDoDia();
            const faseId = String(st.faseId || '');
            if (!nacao || !heroiElegivel(st.heroClass, tipo, nacao)
                || !progressoNacao(nacao.id, diff).includes(faseId)) return;
            const custo = window._nacaoConfig?.custoEntrada?.[diff] || 500;
            if ((STORY_PROGRESS.gold || 0) < custo) return;
            const recompensa = calcRecompensaNacao(faseId, diff);
            const chance = calcChanceNacao(st.heroClass, nacao, faseId, diff);
            STORY_PROGRESS.gold -= custo;
            STORY_PROGRESS.expeditions.push({
                id: 'exp_nacao_' + Date.now(),
                tipo: 'nacao',
                nacaoId: nacao.id,
                faseId,
                phaseName: `${nacao.nome} — Fase ${faseId}`,
                heroClass: st.heroClass,
                difficulty: diff,
                chance,
                startedAt: Date.now(),
                durationMs: TEMPO_EVENTO[diff],
                concluida: false,
                coletada: false,
                resultado: null,
                custoPago: custo,
                recompensa: {
                    xp: recompensa.xp,
                    gold: recompensa.gold,
                    drops: recompensa.essencia > 0
                        ? [{ id: 'essencia_ancestral', qty: recompensa.essencia }]
                        : [],
                },
            });
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
            document.getElementById('expedicaoOverlayV86')?.remove();
            if (typeof showToast === 'function') showToast('🌎', `Enviado! -${custo} ouro`, '🌎');
            if (typeof renderOcaScreenFiltered === 'function') renderOcaScreenFiltered();
        } else {
            const ch = STORY_CHAPTERS[st.chapterId];
            const ph = ch?.phases.find(p => p.id === st.phaseId);
            if (!ph) return;
            const custo = calcCustoNormal(st.chapterId, st.phaseId, diff);
            if ((STORY_PROGRESS.gold || 0) < custo) return;
            STORY_PROGRESS.gold -= custo;
            const chance = calcChanceNormal(st.heroClass, st.chapterId, st.phaseId, diff);
            
            STORY_PROGRESS.expeditions.push({
                id: 'exp_' + Date.now(),
                heroClass: st.heroClass, chapterId: st.chapterId, phaseId: st.phaseId, phaseName: ph.name,
                difficulty: diff, chance, startedAt: Date.now(), durationMs: TEMPO_NORMAL[diff],
                concluida: false, coletada: false, resultado: null, custoPago: custo,
            });
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
            document.getElementById('expedicaoOverlayV86')?.remove();
            if (typeof showToast === 'function') showToast('⛺', `Enviado! -${custo} ouro`, '⛺');
            if (typeof renderOcaScreenFiltered === 'function') renderOcaScreenFiltered();
        }
    };

    // ─── INTERCEPTADOR DE CLIQUES (A BALA DE PRATA) ───
    document.addEventListener('click', function(e) {
        // 1. Botão 🗺️ na OCA
        const btnExp = e.target.closest('.hero-expedition-btn');
        if (btnExp) {
            e.preventDefault(); e.stopPropagation();
            const card = btnExp.closest('.story-hero-card');
            if (!card) return;
            const m = (card.getAttribute('onclick') || '').match(/toggleHeroSelection\('((?:\\'|[^'])*)'\)/);
            if (!m) return;
            const hc = m[1].replace(/\\'/g, "'");
            window.abrirTelaExpedicaoV86(hc, 'normal');
            return;
        }

        // 2. Botão ⛺ nas fases do Evento
        const btnEvt = e.target.closest('.exp-event-btn');
        if (btnEvt) {
            e.preventDefault(); e.stopPropagation();
            const screen = document.getElementById('storyScreen');
            const title = screen ? screen.querySelector('.story-title') : null;
            if (!title) return;
            const txt = title.textContent.trim();
            let bossId = null;
            for (const id in EVENTO_BOSSES) {
                if (txt.includes(EVENTO_BOSSES[id].nome)) { bossId = id; break; }
            }
            if (!bossId) return;
            const card = btnEvt.closest('.evento-fase-card');
            let faseId = null;
            if (card) {
                const numEl = card.querySelector('.evento-fase-num');
                if (numEl) {
                    const mF = numEl.textContent.trim().match(/FASE\s+(\d+)/);
                    if (mF) faseId = mF[1];
                }
            }
            if (faseId) window.abrirTelaExpedicaoV86(null, 'evento', bossId, faseId);
            return;
        }
    }, true);

    // ─── INJETAR BOTÃO ⛺ NOS CARDS DE EVENTO (setInterval blindado) ───
    setInterval(() => {
        const screen = document.getElementById('storyScreen');
        if (!screen || !screen.classList.contains('active')) return;
        const title = screen.querySelector('.story-title');
        if (!title) return;
        const txt = title.textContent.trim();
        let bossId = null;
        for (const id in EVENTO_BOSSES) {
            if (txt.includes(EVENTO_BOSSES[id].nome)) { bossId = id; break; }
        }
        if (!bossId) return;

        const prog = (typeof getEventoProgresso === 'function') ? getEventoProgresso(bossId) : null;
        if (!prog) return;

        screen.querySelectorAll('.evento-fase-card').forEach(card => {
            if (card.querySelector('.exp-event-btn')) return;
            const numEl = card.querySelector('.evento-fase-num');
            if (!numEl) return;
            const m = numEl.textContent.trim().match(/FASE\s+(\d+)/);
            if (!m) return;
            const faseId = m[1];
            if (!prog.fasesConcluidas.includes(faseId)) return;

            const btn = document.createElement('button');
            btn.className = 'exp-event-btn';
            btn.textContent = '⛺ EXPEDIÇÃO';
            btn.style.cssText = 'margin-top:8px;padding:6px 12px;background:linear-gradient(180deg,rgba(74,140,181,.25),transparent 45%),linear-gradient(135deg,#2a4a6a,#1a2f45);color:#d0e8f5;border:2px solid #4a8cb5;border-radius:4px;font-family:Cinzel,serif;font-weight:700;font-size:.75rem;letter-spacing:1px;cursor:pointer;width:100%;';
            card.appendChild(btn);
        });
    }, 400);

    // ─── CSS EXTRA (Compatível com o V79) ───
    if (!document.getElementById('v86UnificadoCSS')) {
        const s = document.createElement('style');
        s.id = 'v86UnificadoCSS';
        s.textContent = `
            .exp-ev-heroes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px; max-height: 260px; overflow-y: auto; padding: 4px; margin-bottom: 12px; }
            .exp-ev-hero-card { background: rgba(10,6,2,.6); border: 2px solid rgba(201,162,39,.25); border-radius: 6px; padding: 8px 6px; text-align: center; cursor: pointer; transition: all .2s; }
            .exp-ev-hero-card:hover { border-color: #c9a227; transform: translateY(-2px); }
            .exp-ev-hero-sprite { width: 40px; height: 40px; object-fit: contain; margin-bottom: 4px; }
            .exp-ev-hero-name { font-family: 'Cinzel', serif; color: #f0e2c0; font-size: .75rem; font-weight: 700; margin-bottom: 2px; }
            .exp-ev-hero-role { font-family: 'EB Garamond', serif; color: #8a7a52; font-size: .7rem; font-style: italic; }
            .exp-chapter-btn:disabled { cursor: not-allowed; opacity: 0.5; }
        `;
        document.head.appendChild(s);
    }

    console.log('✅ [V86.0] Expedição Unificada Definitiva carregada.');
})();

// =================================================================
// historia.js — V90 — Temas dos Menus (Baseado no V87.2)
// =================================================================
(function temasMenusV90() {
    if (window._temasMenusV90) return;
    window._temasMenusV90 = true;

    // ═══════════════════════════════════════════════════════════
    // 🎵 CONFIGURAÇÃO DE MÚSICAS
    // ═══════════════════════════════════════════════════════════
    const MUSIC_ALDEIA = 'faldeia.mp3'; 
    const MUSIC_MENU   = 'fmenu.wav'; // ⚠️ Lembre-se de ter esse arquivo na pasta
    const AMBIENT_MULTIPLIER = 0.6; 

    // ═══════════════════════════════════════════════════════════

    const bgm = new Audio();
    bgm.loop = true;
    bgm.preload = 'auto';
    window._bgmGlobal = bgm;

    let userInteracted = false;
    let isTryingToPlay = false;
    let currentSrc = '';

    // Log de erro se o arquivo não existir
    bgm.addEventListener('error', () => {
        console.error(`🚨 [V90] O ARQUIVO DE MÚSICA (${currentSrc}) NÃO FOI ENCONTRADO!`);
    });

    // Desbloqueia o áudio no clique
    document.addEventListener('click', function unlockAudio() {
        userInteracted = true;
        if (typeof window.tentarTocarMusica === 'function') {
            window.tentarTocarMusica();
        }
    });

    function updateVolume() {
        const masterVol = (typeof STORY_SETTINGS !== 'undefined' && STORY_SETTINGS.musicVolume !== undefined) 
            ? STORY_SETTINGS.musicVolume 
            : 70;
        bgm.volume = (masterVol / 100) * AMBIENT_MULTIPLIER;
    }

    // ⭐ A mesma função do V87.2, mas agora escolhe o arquivo baseado na tela
    window.tentarTocarMusica = function() {
        if (!userInteracted) return;
        
        const screen = document.getElementById('storyScreen');
        const gameScreen = document.getElementById('gameScreen');
        
        // Se estiver em batalha, não toca música de menu
        if (gameScreen && gameScreen.classList.contains('active')) {
            if (!bgm.paused) bgm.pause();
            return;
        }

        if (!screen || !screen.classList.contains('active')) return;

        const titleEl = screen.querySelector('.story-title') || screen.querySelector('.story-ald-title');
        if (!titleEl) return;
        
        const titleTxt = titleEl.textContent.toUpperCase();
        
        // Define qual música deve tocar
        let novoSrc = MUSIC_MENU; // Fallback padrão para menus
        if (titleTxt.includes('ALDEIA')) {
            novoSrc = MUSIC_ALDEIA;
        }

        // Se mudou de tema, troca o arquivo
        if (currentSrc !== novoSrc) {
            currentSrc = novoSrc;
            bgm.src = novoSrc;
            bgm.load();
        }

        // Toca (se estiver pausado)
        if (bgm.paused && !isTryingToPlay) {
            isTryingToPlay = true;
            updateVolume();
            
            bgm.play().then(() => {
                console.log(`🎵 [V90] Tocando tema: ${currentSrc}`);
                isTryingToPlay = false;
            }).catch(e => {
                console.warn(`🔇 [V90] Navegador bloqueou a música: ${e.name}`);
                isTryingToPlay = false;
            });
        } else {
            updateVolume();
        }
    };

    // ⭐ O VIGIA (Idêntico ao V87.2)
    setInterval(() => {
        window.tentarTocarMusica();
    }, 1000);

    // Play ao clicar em voltar
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('button, .story-back-btn, .story-result-btn');
        if (!btn) return;
        
        const txt = (btn.textContent || '').toUpperCase();
        const onclickAttr = btn.getAttribute('onclick') || '';
        
        const voltaPraAldeia = txt.includes('ALDEIA') 
                            || onclickAttr.includes('renderAldeiaScreen')
                            || onclickAttr.includes('returnFromStoryVictory')
                            || onclickAttr.includes('eventoVoltarAldeia');
        
        if (voltaPraAldeia) {
            userInteracted = true;
            setTimeout(() => {
                window.tentarTocarMusica();
            }, 100);
        }
    }, true);

    // Hook do volume
    const _origApplyMusic = window.applyMusicVolume;
    if (typeof _origApplyMusic === 'function' && !_origApplyMusic._v90) {
        window.applyMusicVolume = function(pct) {
            _origApplyMusic.apply(this, arguments);
            updateVolume();
        };
        window.applyMusicVolume._v90 = true;
    }

    console.log('✅ [V90] Temas dos Menus ativados (Base V87.2).');
})();
// =================================================================
// aldeia.js — V91 — Fix música vazando para QUALQUER tela fora da Aldeia
// -----------------------------------------------------------------
// O V87.3 tem um listener de clique global (unlockAudio) que chama
// tentarTocarAldeia() em QUALQUER clique, sem verificar em que tela
// está. Isso dispara o play e o vigia de 1s do V87.3 pausa logo depois
// → efeito de "toca brevemente" ao clicar em qualquer lugar.
//
// Solução:
//   1. tentarTocarAldeia vira no-op (clique não toca mais)
//   2. Watchdog de 100ms pausa _bgmAldeia se estiver fora da Aldeia
//   3. tentarTocarMusica do V90 respeita estado de jogo
//
// Cole NO FINAL do aldeia.js (depois do V90).
// =================================================================
(function fixMusicaVazandoV91() {
    if (window._fixMusicaVazandoV91) return;
    window._fixMusicaVazandoV91 = true;

    // ─────────────────────────────────────────────────────────
    // Verificadores de estado
    // ─────────────────────────────────────────────────────────
    function estaNaAldeiaOuConfig() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return false;
        if (!screen.classList.contains('active')) return false;
        if (getComputedStyle(screen).display === 'none') return false;
        const titleEl = screen.querySelector('.story-title');
        if (!titleEl) return false;
        const txt = titleEl.textContent.toUpperCase();
        return txt.includes('ALDEIA') || txt.includes('CONFIGURAÇÕES');
    }

    function estaEmJogo() {
        const gameScreen = document.getElementById('gameScreen');
        return gameScreen
            && gameScreen.classList.contains('active')
            && getComputedStyle(gameScreen).display !== 'none';
    }

    // ─────────────────────────────────────────────────────────
    // 1. Pausa o áudio antigo imediatamente
    // ─────────────────────────────────────────────────────────
    if (window._bgmAldeia && !window._bgmAldeia.paused) {
        try { window._bgmAldeia.pause(); } catch (e) {}
    }

    // ─────────────────────────────────────────────────────────
    // 2. Neutraliza funções do V87.3
    //    - tentarTocarAldeia → no-op (cliques não tocam mais)
    //    - pararAldeia       → força pause de tudo
    // ─────────────────────────────────────────────────────────
    window.tentarTocarAldeia = function () {
        // no-op intencional: V90 cuida de toda a música
    };

    window.pararAldeia = function () {
        if (window._bgmAldeia && !window._bgmAldeia.paused) {
            try { window._bgmAldeia.pause(); } catch (e) {}
        }
    };

    // ─────────────────────────────────────────────────────────
    // 3. ⭐ WATCHDOG — pausa _bgmAldeia em no máximo 100ms
    //    Mesmo se algum clique / listener antigo escapar e chamar
    //    bgm.play(), a pausa chega em até 100ms.
    // ─────────────────────────────────────────────────────────
    setInterval(() => {
        const bgm = window._bgmAldeia;
        if (!bgm) return;
        if (bgm.paused) return;
        if (estaNaAldeiaOuConfig()) return;  // deixa tocar

        try { bgm.pause(); } catch (e) {}
    }, 100);

    // ─────────────────────────────────────────────────────────
    // 4. Endurece tentarTocarMusica do V90 (para o _bgmGlobal)
    //    O V90 já pausa em jogo, mas reforçamos a checagem
    // ─────────────────────────────────────────────────────────
    const _orig = window.tentarTocarMusica;
    if (typeof _orig === 'function' && !_orig._v91Fix) {
        window.tentarTocarMusica = function () {
            const bgm = window._bgmGlobal;
            if (!bgm) return;

            if (estaEmJogo()) {
                if (!bgm.paused) {
                    try { bgm.pause(); } catch (e) {}
                }
                return;
            }
            return _orig.apply(this, arguments);
        };
        window.tentarTocarMusica._v91Fix = true;
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V91] Música da Aldeia contida');
    console.log('═══════════════════════════════════════════════════');
    console.log('• tentarTocarAldeia → no-op (cliques não tocam)');
    console.log('• Watchdog de 100ms pausa _bgmAldeia fora da Aldeia');
    console.log('• tentarTocarMusica reforçado contra jogo');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// aldeia.js — V91.1 — Fix: música da Aldeia não estava tocando
// -----------------------------------------------------------------
// Reimplementa tentarTocarMusica do zero para evitar a cadeia
// de wrappers (V90 → V91) que pode estar escolhendo a música errada.
//
// Prioridades:
//   1. gameScreen ativo       → pausa
//   2. Aldeia (múltiplas det.)→ faldeia.mp3
//   3. Menus com .story-title → fmenu.wav
//   4. Nenhum dos dois        → pausa
//
// Cole NO FINAL do aldeia.js (depois do V90 e V91).
// =================================================================
(function fixMusicaAldeiaV91_1() {
    if (window._fixMusicaAldeiaV91_1) return;
    window._fixMusicaAldeiaV91_1 = true;

    // ─── CONFIG ───
    const MUSIC_ALDEIA = 'faldeia.mp3';
    const MUSIC_MENU   = 'fmenu.wav';
    const AMBIENT_MULT = 0.6;

    // ─── Interação do usuário (autoplay) ───
    let _userInteracted = false;
    document.addEventListener('click', () => { _userInteracted = true; }, { capture: true });
    document.addEventListener('touchstart', () => { _userInteracted = true; }, { capture: true });

    // ─── DETECÇÃO ───
    function estaEmJogo() {
        const g = document.getElementById('gameScreen');
        return g && g.classList.contains('active')
            && getComputedStyle(g).display !== 'none';
    }

    function estaNaAldeia() {
        const s = document.getElementById('storyScreen');
        if (!s) return false;
        if (!s.classList.contains('active')) return false;
        if (getComputedStyle(s).display === 'none') return false;

        // 1. Container visual da Aldeia (mais confiável)
        if (s.querySelector('.aldeia-visual-wrap')) return true;

        // 2. Título específico da Aldeia
        const t1 = s.querySelector('.story-ald-title');
        if (t1 && t1.textContent.trim().toUpperCase() === 'ALDEIA') return true;

        // 3. Fallback: story-title com conteúdo "ALDEIA"
        const t2 = s.querySelector('.story-title');
        if (t2 && t2.textContent.trim().toUpperCase() === 'ALDEIA') return true;

        return false;
    }

    function estaEmMenu() {
        const s = document.getElementById('storyScreen');
        if (!s) return false;
        if (!s.classList.contains('active')) return false;
        if (getComputedStyle(s).display === 'none') return false;
        // Tem título de menu E não é Aldeia
        return !!s.querySelector('.story-title') && !estaNaAldeia();
    }

    // ─── CONTROLES DE ÁUDIO ───
    function trocarFonte(bgm, url) {
        // Compara só o nome do arquivo (evita problemas com path relativo/absoluto)
        const atual = bgm.src || '';
        if (atual.endsWith(url)) return false;
        bgm.src = url;
        bgm.load();
        console.log(`🎵 [V91.1] Trocando para ${url}`);
        return true;
    }

    function atualizarVolume(bgm) {
        const vol = (typeof STORY_SETTINGS !== 'undefined' && STORY_SETTINGS.musicVolume !== undefined)
            ? STORY_SETTINGS.musicVolume : 70;
        bgm.volume = (vol / 100) * AMBIENT_MULT;
    }

    function tocar(bgm) {
        if (!bgm.paused) return;
        if (!_userInteracted) return;
        const p = bgm.play();
        if (p && p.catch) {
            p.catch(e => {
                // Silencioso: autoplay bloqueado antes da primeira interação
            });
        }
    }

    function pausar(bgm) {
        if (!bgm.paused) {
            try { bgm.pause(); } catch (e) {}
        }
    }

    // ─── SUBSTITUI tentarTocarMusica INTEIRO ───
    window.tentarTocarMusica = function() {
        const bgm = window._bgmGlobal;
        if (!bgm) return;

        // 1. Batalha → pausa
        if (estaEmJogo()) {
            pausar(bgm);
            return;
        }

        // 2. Aldeia → faldeia.mp3
        if (estaNaAldeia()) {
            trocarFonte(bgm, MUSIC_ALDEIA);
            atualizarVolume(bgm);
            tocar(bgm);
            return;
        }

        // 3. Menus → fmenu.wav
        if (estaEmMenu()) {
            trocarFonte(bgm, MUSIC_MENU);
            atualizarVolume(bgm);
            tocar(bgm);
            return;
        }

        // 4. Qualquer outra tela → pausa
        pausar(bgm);
    };
    window.tentarTocarMusica._v91_1 = true;

    // ─── DEBUG ───
    window._debugMusicaV91_1 = function() {
        const bgm = window._bgmGlobal;
        const s = document.getElementById('storyScreen');
        console.group('=== MÚSICA V91.1 ===');
        console.log('src atual:', bgm?.src?.split('/').pop() || '(vazio)');
        console.log('paused:', bgm?.paused);
        console.log('volume:', bgm?.volume?.toFixed(2));
        console.log('userInteracted:', _userInteracted);
        console.log('');
        console.log('storyScreen ativo:', s?.classList.contains('active'));
        console.log('storyScreen display:', s ? getComputedStyle(s).display : '?');
        console.log('tem .aldeia-visual-wrap:', !!s?.querySelector('.aldeia-visual-wrap'));
        console.log('story-ald-title:', s?.querySelector('.story-ald-title')?.textContent?.trim() || '(não existe)');
        console.log('story-title:', s?.querySelector('.story-title')?.textContent?.trim() || '(não existe)');
        console.log('');
        console.log('estaEmJogo():', estaEmJogo());
        console.log('estaNaAldeia():', estaNaAldeia());
        console.log('estaEmMenu():', estaEmMenu());
        console.groupEnd();
    };

    // ─── Chama imediatamente para corrigir o estado atual ───
    setTimeout(() => window.tentarTocarMusica(), 100);

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V91.1] Música da Aldeia corrigida');
    console.log('═══════════════════════════════════════════════════');
    console.log('• tentarTocarMusica reimplementado do zero');
    console.log('• Detecção da Aldeia por 3 critérios independentes');
    console.log('• Debug: window._debugMusicaV91_1()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V92.1 — Fix: drops da expedição usam a dificuldade
//                       DA PRÓPRIA EXPEDIÇÃO
// -----------------------------------------------------------------
// O calcRecompensas do V79 chama rollStoryDrops(eid) sem o 2º
// argumento. Isso faz o V92 usar storyCurrentDifficulty (errado
// quando a expedição tem uma dificuldade diferente da última
// partida da História).
//
// Solução: override de _expVerResultado pra recalcular os drops
// com exp.difficulty ANTES da função original aplicar as recompensas.
// Sem dupla aplicação (a original lê exp.resultado.drops).
//
// Cole NO FINAL do historia.js (depois do V92).
// =================================================================
(function fixDropsExpedicaoV92_1() {
    if (window._fixDropsExpedicaoV92_1) return;
    window._fixDropsExpedicaoV92_1 = true;

    const _orig = window._expVerResultado;
    if (typeof _orig !== 'function') {
        console.warn('[V92.1] _expVerResultado não existe. Abortando.');
        return;
    }
    if (_orig._v92_1) return;

    window._expVerResultado = function (expId) {
        const exp = STORY_PROGRESS?.expeditions?.find(e => e.id === expId);

        // Guard: só age se a expedição está pronta pra coletar
        if (!exp || !exp.concluida || exp.coletada) {
            return _orig.apply(this, arguments);
        }

        // Recalcula drops SE:
        //   - teve sucesso
        //   - tem drops computados (evita expedição sem drops)
        //   - tem chapterId/phaseId (event expeditions não têm)
        if (exp.resultado?.sucesso
            && exp.resultado.drops
            && exp.chapterId
            && exp.phaseId) {
            const ch = STORY_CHAPTERS[exp.chapterId];
            const ph = ch?.phases.find(p => p.id === exp.phaseId);
            if (ph) {
                const newDrops = [];
                ph.enemies.forEach(eid => {
                    // ⭐ Agora passa exp.difficulty como override
                    const enemyDrops = window.rollStoryDrops(eid, exp.difficulty);
                    enemyDrops.forEach(d => {
                        if (d.id === 'nucleo_abismo') return;
                        if (d.id === 'essencia_sombria') return;
                        newDrops.push(d);
                    });
                });
                exp.resultado.drops = newDrops;
                console.log(`[V92.1] Drops recalculados (${exp.difficulty}):`, newDrops);
            }
        }

        return _orig.apply(this, arguments);
    };
    window._expVerResultado._v92_1 = true;

    // Diagnóstico
    window._debugDropsExpV921 = function () {
        const exps = STORY_PROGRESS?.expeditions || [];
        console.group('=== DROPS EXPEDIÇÃO V92.1 ===');
        console.log('V92.1 ativo?', window._fixDropsExpedicaoV92_1);
        exps.forEach(e => {
            console.log(`[${e.id}]`, {
                heroClass: e.heroClass,
                dificuldade: e.difficulty,
                concluida: e.concluida,
                coletada: e.coletada,
                drops: e.resultado?.drops || '(ainda não computado)',
            });
        });
        console.log('');
        console.log('storyCurrentDifficulty (última partida):', storyCurrentDifficulty);
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V92.1] Drops da expedição com dificuldade CORRETA');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Agora usa exp.difficulty (não storyCurrentDifficulty)');
    console.log('• Recalcula drops antes de aplicar (sem dupla aplicação)');
    console.log('• Funciona pra Normal/Difícil/Pesadelo da expedição');
    console.log('');
    console.log('💡 Debug: window._debugDropsExpV921()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V10.55.1 — Fix: corrupção some visualmente ao
// converter o tile (por PA, skill de boss, etc.) mas continua bloqueando
// -----------------------------------------------------------------
// Causa: toda skill que converte tile faz `el.className = 'tile bg-X'`,
// que remove a classe .tile-corrupted (pentagrama + fundo preto) mas
// deixa órfão:
//   • window._corruptedTiles com o índice (bloqueio em handleSelect)
//   • <div class="corruption-fx"> dentro do tile (glow roxo residual)
//
// Fix:
//   1. CSS: esconde .corruption-fx em tiles sem .tile-corrupted
//   2. MutationObserver detecta tiles que perderam .tile-corrupted
//      → remove do array + remove filho + spawna smoke de purificação
//   3. Safety net de 1s (recupera se o observer não pegou)
// =================================================================
(function fixCorrupcaoVisualV1055_1() {
    if (window._fixCorrupcaoVisualV1055_1) return;
    window._fixCorrupcaoVisualV1055_1 = true;

    // ─────────────────────────────────────────────────────────────
    // 1. CSS imediato — esconde .corruption-fx órfão
    // ─────────────────────────────────────────────────────────────
    if (!document.getElementById('fixCorruptTileVisualCSS')) {
        const s = document.createElement('style');
        s.id = 'fixCorruptTileVisualCSS';
        s.textContent = `
            /* .corruption-fx só aparece se o tile AINDA tem .tile-corrupted */
            .tile:not(.tile-corrupted) .corruption-fx {
                display: none !important;
            }
        `;
        document.head.appendChild(s);
    }

    // ─────────────────────────────────────────────────────────────
    // 2. Helper que limpa um tile corrompido corretamente
    // ─────────────────────────────────────────────────────────────
    function _limparTileCorrompido(idx, opts) {
        opts = opts || {};

        const tile = document.querySelectorAll('#grid .tile')[idx];
        if (!tile) return;

        if (!Array.isArray(window._corruptedTiles)) return;
        if (!window._corruptedTiles.includes(idx)) return; // já não estava

        // Remove do array
        window._corruptedTiles = window._corruptedTiles.filter(x => x !== idx);

        // Remove o filho órfão
        const fx = tile.querySelector('.corruption-fx');
        if (fx) fx.remove();

        // Remove classe residual (por garantia)
        tile.classList.remove('tile-corrupted');

        // Smoke de purificação (feedback visual)
        if (!opts.silencioso) {
            const board = document.getElementById('board');
            const s = (typeof getStep === 'function') ? getStep() : 59;
            if (board) {
                const smoke = document.createElement('div');
                smoke.className = 'corruption-smoke-fx';
                smoke.style.left = ((idx % 8) * s + 8) + 'px';
                smoke.style.top = (Math.floor(idx / 8) * s + 8) + 'px';
                smoke.style.width = s + 'px';
                smoke.style.height = s + 'px';
                smoke.style.animationDelay = (Math.random() * 0.3) + 's';
                board.appendChild(smoke);
                setTimeout(() => { if (smoke.parentNode) smoke.remove(); }, 1600);
            }
        }
    }
    window._limparTileCorrompido = _limparTileCorrompido;

    // ─────────────────────────────────────────────────────────────
    // 3. MutationObserver — detecta tiles convertidos por skill
    // ─────────────────────────────────────────────────────────────
    function _setupObserver() {
        const grid = document.getElementById('grid');
        if (!grid) { setTimeout(_setupObserver, 500); return; }

        const observer = new MutationObserver(() => {
            if (!Array.isArray(window._corruptedTiles) || window._corruptedTiles.length === 0) return;

            const tiles = grid.querySelectorAll('.tile');
            let purificados = 0;

            const idxs = window._corruptedTiles.slice();
            idxs.forEach(idx => {
                const tile = tiles[idx];
                if (!tile) return;
                if (!tile.classList.contains('tile-corrupted')) {
                    _limparTileCorrompido(idx, { silencioso: false });
                    purificados++;
                }
            });

            if (purificados > 0) {
                if (typeof addLog === 'function') {
                    addLog(`✨ ${purificados} corrupção(ões) purificada(s) pelo efeito.`);
                }
                if (typeof playSfx === 'function') {
                    try { playSfx('purificacao'); } catch(e) {}
                }
                console.log(`[V10.55.1] ${purificados} tile(s) purificado(s) via observer`);
            }
        });

        observer.observe(grid, {
            attributes: true,
            attributeFilter: ['class'],
            subtree: true,
        });

        console.log('[V10.55.1] Observer de corrupção instalado');
    }
    _setupObserver();

    // ─────────────────────────────────────────────────────────────
    // 4. Safety net de 1s
    // ─────────────────────────────────────────────────────────────
    setInterval(() => {
        if (!Array.isArray(window._corruptedTiles) || window._corruptedTiles.length === 0) return;
        const tiles = document.querySelectorAll('#grid .tile');
        const idxs = window._corruptedTiles.slice();
        idxs.forEach(idx => {
            const tile = tiles[idx];
            if (tile && !tile.classList.contains('tile-corrupted')) {
                _limparTileCorrompido(idx, { silencioso: true });
            }
        });
    }, 1000);

    // ─────────────────────────────────────────────────────────────
    // 5. Debug
    // ─────────────────────────────────────────────────────────────
    window._debugCorrupcaoVisual = function() {
        const tiles = document.querySelectorAll('#grid .tile');
        const info = (window._corruptedTiles || []).map(idx => {
            const tile = tiles[idx];
            return {
                idx,
                existe: !!tile,
                temClasse: tile?.classList.contains('tile-corrupted'),
                temFx: !!tile?.querySelector('.corruption-fx'),
                bgAtual: Array.from(tile?.classList || []).find(c => c.startsWith('bg-')),
            };
        });
        console.group('=== [V10.55.1] Corrupção visual ===');
        console.log('Total no array:', (window._corruptedTiles || []).length);
        console.table(info);
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.55.1] Fix visual da corrupção');
    console.log('═══════════════════════════════════════════════════');
    console.log('• CSS: .corruption-fx escondido em tiles sem .tile-corrupted');
    console.log('• Observer detecta tiles convertidos por skill');
    console.log('• Remove do array + spawna smoke de purificação');
    console.log('• Safety net de 1s como backup');
    console.log('');
    console.log('💡 Debug: window._debugCorrupcaoVisual()');
    console.log('═══════════════════════════════════════════════════');
})();

// =================================================================
// historia-expedicoes.js — Vexp1 — Heróis em expedição bloqueados na OCA
// -----------------------------------------------------------------
// Heróis enviados para expedição ficam completamente bloqueados na
// tela da OCA: não clicáveis, visual escurecido com badge "⛺ Em expedição".
// Ao retornar, voltam ao estado normal automaticamente.
// =================================================================
(function bloqueioExpedicaoNaOcaVexp1() {
    if (window._bloqueioExpedicaoOcaVexp1) return;
    window._bloqueioExpedicaoOcaVexp1 = true;

    // ═══════════════════════════════════════════════════════════
    // CSS — aparência de bloqueado por expedição
    // ═══════════════════════════════════════════════════════════
    if (!document.getElementById('vexp1CSS')) {
        const s = document.createElement('style');
        s.id = 'vexp1CSS';
        s.textContent = `
            /* Card em expedição: não clicável, escurecido */
            .story-hero-card.heroi-em-expedicao {
                pointer-events: none !important;
                cursor: default !important;
                opacity: 0.55 !important;
                filter: grayscale(60%) !important;
                position: relative;
            }

            /* Badge de expedição no canto superior esquerdo */
            .story-hero-card.heroi-em-expedicao .expedicao-badge-oca {
                position: absolute;
                top: 6px;
                left: 6px;
                background: linear-gradient(135deg, rgba(20,40,60,0.95), rgba(10,25,40,0.95));
                border: 1px solid #4a8cb5;
                border-radius: 6px;
                padding: 2px 7px;
                font-size: 0.72rem;
                color: #90cef4;
                font-family: 'EB Garamond', serif;
                white-space: nowrap;
                pointer-events: none;
                z-index: 10;
                line-height: 1.4;
            }

            /* Remove o onclick visualmente (cursor) em cards de expedição */
            .story-hero-card.heroi-em-expedicao * {
                pointer-events: none !important;
            }
        `;
        document.head.appendChild(s);
    }

    // ═══════════════════════════════════════════════════════════
    // Aplica/remove visual nos cards da OCA
    // ═══════════════════════════════════════════════════════════
    function _aplicarBloqueioExpedicao() {
        const cards = document.querySelectorAll('.story-hero-card:not(.locked)');
        if (!cards.length) return;

        cards.forEach(card => {
            // Descobre o heroClass do card pelo onclick
            const onclick = card.getAttribute('onclick') || '';
            const match = onclick.match(/toggleHeroSelection\('((?:\\'|[^'])*)'\)/);
            if (!match) return;
            const heroClass = match[1].replace(/\\'/g, "'");

            // Verifica se está em expedição
            const emExp = (typeof window.heroiEmExpedicao === 'function')
                ? window.heroiEmExpedicao(heroClass)
                : (STORY_PROGRESS.expeditions || []).some(e => e.heroClass === heroClass && !e.coletada);

            if (emExp) {
                // Bloqueia
                card.classList.add('heroi-em-expedicao');

                // Adiciona badge se ainda não tem
                if (!card.querySelector('.expedicao-badge-oca')) {
                    const badge = document.createElement('div');
                    badge.className = 'expedicao-badge-oca';
                    badge.textContent = '⛺ Em expedição';
                    card.insertBefore(badge, card.firstChild);
                }

                // Remove onclick para garantir que não é clicável
                card.dataset.onclickBackup = card.getAttribute('onclick') || '';
                card.removeAttribute('onclick');

            } else {
                // Desbloqueia — restaura estado normal
                if (card.classList.contains('heroi-em-expedicao')) {
                    card.classList.remove('heroi-em-expedicao');

                    // Remove badge
                    const badge = card.querySelector('.expedicao-badge-oca');
                    if (badge) badge.remove();

                    // Restaura onclick
                    if (card.dataset.onclickBackup) {
                        card.setAttribute('onclick', card.dataset.onclickBackup);
                        delete card.dataset.onclickBackup;
                    }
                }
            }
        });
    }

    // ═══════════════════════════════════════════════════════════
    // Hook em renderOcaScreenFiltered — roda após cada render
    // ═══════════════════════════════════════════════════════════
    const _origOcaVexp1 = window.renderOcaScreenFiltered;
    if (typeof _origOcaVexp1 === 'function') {
        window.renderOcaScreenFiltered = function() {
            const r = _origOcaVexp1.apply(this, arguments);
            // Aguarda patches pós-render (injetarBotaoExpedicao etc.)
            setTimeout(_aplicarBloqueioExpedicao, 150);
            setTimeout(_aplicarBloqueioExpedicao, 400);
            return r;
        };
        window.renderOcaScreenFiltered._vexp1 = true;
    }

    // ═══════════════════════════════════════════════════════════
    // Expõe para uso externo (outros sistemas podem chamar)
    // ═══════════════════════════════════════════════════════════
    window.aplicarBloqueioExpedicaoOca = _aplicarBloqueioExpedicao;

    console.log('✅ [Vexp1] Heróis em expedição bloqueados na OCA (não clicáveis + visual).');
})();
