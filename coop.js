// =================================================================
// coop.js — VERSÃO CONSOLIDADA V8.5
// -----------------------------------------------------------------
// Arquivo único. Correções estruturais + replay + sincronização.
//
// Correções da V8.5 (sobre V7.0):
//   • Fallback de dano CONSERVADOR (dist <= 1)
//   • Herói morto fica no tabuleiro (cinza) e é pulado no turno
//   • Fim de jogo SÓ quando todos morrem
//   • Eventos do boss com uid/role (P1 vê movimentação)
//   • Fim cinematográfico (purificação + delay)
//   • Sincronização de fila de inimigos
//   • Replay filtrado por UID
//   • [V8.5] Boss não "renasce" após vitória do P2
//   • [V8.5] Skills do boss capturadas via applyStorySkill (sem duplicatas)
//   • [V8.5] storyEnemyAI roda no coop (destrava turno do boss)
//   • [V8.5] Bônus de nível aplicados nos heróis
//   • [V8.5] Bônus elemental da arma aplicado
//   • [V8.5] Monitor de segurança contra turno travado
//   • [V8.5] coopProcessandoMorteBoss sempre liberado (finally)
// =================================================================

// =================================================================
// 1. FIREBASE INIT
// =================================================================
const fbAuth = firebase.auth();
const fbDb = firebase.firestore();
const COOP_ROOMS = 'salas_coop_v2';

// =================================================================
// 2. ESTADO LOCAL
// =================================================================
let coopUser = null;
let coopRole = null;
let coopRoomId = null;
let coopRoomData = null;
let coopFaseId = null;
let coopAtoId = null;
let coopContent = null;
let coopPublishingLock = false;
let coopListenerUnsub = null;
let coopBossRunning = false;
let coopForcarBoss = false;
let coopFinalizando = false;
let coopP1Atualizado = false;
let coopProcessandoMorteBoss = false;
let coopPartidaConcluida = false;
let coopEventosTurno = [];
let coopReplayRodando = false;
let coopSalasAbertasCache = [];

// Buffer de eventos do boss
let coopBufferEventosBoss = [];
let coopCapturandoEventosBoss = false;

// Flag para evitar chamar storyEnemyAI quando o boss já morreu
let coopEnemyAlreadyDead = false;

// =================================================================
// 3. UTILIDADES
// =================================================================
function coopLog(...args) {
    console.log('[coop]', ...args);
}

function coopSleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function coopMeuIdx() {
    return coopRole === 'criador' ? 0 : 1;
}

function coopMeuUid() {
    return coopUser?.uid || null;
}

function coopValidarConteudo(content, heroClass, isHost) {
    if (!content) return { valido: true };
    const hero = STORY_HERO_CLASSES[heroClass];
    if (!hero) return { valido: false, motivo: 'Herói inválido no save.' };
    const unlocked = STORY_PROGRESS.unlockedHeroesStory || STORY_PROGRESS.selectedHeroes || ['Tupa'];
    if (hero.starsNeeded !== 0 && !unlocked.includes(heroClass)) {
        return { valido: false, motivo: 'Este herói ainda não foi desbloqueado neste save.' };
    }

    if (content.type === 'nacoes') {
        const nacao = window.NACOES?.[content.nacaoId];
        if (!nacao) return { valido: false, motivo: 'Nação não encontrada.' };
        if (!['normal', 'dificil', 'pesadelo'].includes(content.difficulty)
            || !['1', '2', '3'].includes(String(content.phaseId))) {
            return { valido: false, motivo: 'Dificuldade ou fase da nação inválida.' };
        }
        if (nacao.diaSemana !== new Date().getDay()) {
            return { valido: false, motivo: 'Esta nação não está disponível hoje.' };
        }
        const dayConfig = window._nacaoDayConfig?.[nacao.diaSemana];
        const rarity = typeof window.getHeroRarity === 'function'
            ? window.getHeroRarity(heroClass)
            : (hero.rarity || 1);
        if (dayConfig?.maxStars != null && rarity > dayConfig.maxStars) {
            return {
                valido: false,
                motivo: `${hero.displayName || heroClass} tem ${rarity}★; esta prova aceita até ${dayConfig.maxStars}★.`,
            };
        }

        if (isHost) {
            const difficulty = content.difficulty || STORY_PROGRESS.difficulty || 'normal';
            const progress = STORY_PROGRESS.nacaoProgressoPorDificuldade?.[difficulty]?.[content.nacaoId];
            const week = typeof window.getWeekId === 'function' ? window.getWeekId() : null;
            const completed = progress?.semana === week ? progress.fasesConcluidas || [] : [];
            const phaseIndex = Number(content.phaseId) - 1;
            if (!Number.isInteger(phaseIndex) || phaseIndex < 0 || phaseIndex > 2
                || (phaseIndex > 0 && !completed.includes(String(phaseIndex)))) {
                return { valido: false, motivo: 'A fase ainda não foi desbloqueada pelo anfitrião.' };
            }
        }
        return { valido: true };
    }

    if (content.type === 'selados') {
        const boss = window.EVENTO_BOSSES?.[content.bossId];
        if (!boss && content.bossId !== 'pesadelo') {
            return { valido: false, motivo: 'Chefe dos Sete Selados não encontrado.' };
        }
        if (!['normal', 'dificil', 'pesadelo'].includes(content.difficulty)
            || !['1', '2', '3', '4', 'boss'].includes(String(content.phaseId))) {
            return { valido: false, motivo: 'Dificuldade ou fase dos Sete Selados inválida.' };
        }
        if (boss && boss.diaSemana !== new Date().getDay()) {
            return { valido: false, motivo: 'Este evento dos Sete Selados não está ativo hoje.' };
        }
        if (isHost) {
            const progress = typeof window.getEventoProgresso === 'function'
                ? window.getEventoProgresso(content.bossId) : null;
            const phases = ['1', '2', '3', '4', 'boss'];
            const phaseIndex = phases.indexOf(String(content.phaseId));
            if (!progress || phaseIndex < 0
                || (phaseIndex > 0 && !progress.fasesConcluidas.includes(phases[phaseIndex - 1]))) {
                return { valido: false, motivo: 'A fase ainda não foi desbloqueada pelo anfitrião.' };
            }
            if (content.phaseId === 'boss'
                && (typeof window.getChavesAtuais !== 'function' || window.getChavesAtuais() < 1)) {
                return { valido: false, motivo: 'O anfitrião não tem chave para iniciar o chefe.' };
            }
        }
        return { valido: true };
    }

    if (content.type === 'raid-regional') {
        const cfg = window.raidGetConfig?.(content.raidId);
        if (!cfg) {
            return { valido: false, motivo: 'Raid regional não encontrada.' };
        }
        if (!['normal', 'dificil', 'pesadelo'].includes(content.difficulty)) {
            return { valido: false, motivo: 'Dificuldade da Raid regional inválida.' };
        }
        const today = new Date();
        const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
        const week = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
        if (STORY_PROGRESS.raidAttempts?.[content.raidId]?.week === week) {
            return { valido: false, motivo: 'Esta Raid já teve sua tentativa semanal consumida.' };
        }
        const costMultiplier = { normal: 1, dificil: 1.5, pesadelo: 2 }[content.difficulty] || 1;
        const cost = Math.round(cfg.custoEntrada * costMultiplier);
        if (isHost && (STORY_PROGRESS.gold || 0) < cost) {
            return { valido: false, motivo: `O anfitrião precisa de ${cost} ouro para abrir esta Raid.` };
        }
        return { valido: true };
    }

    return { valido: false, motivo: 'Tipo de sala cooperativa desconhecido.' };
}

async function coopIniciarConteudo(content, options = {}) {
    if (content?.type === 'raid-regional') {
        if (typeof window.raidIniciarSoloViaCoop !== 'function') {
            throw new Error('O inicializador da Raid regional não está disponível.');
        }
        window._regionalRaidContext = true;
        window._regionalRaidRound = 0;
        await window.raidIniciarSoloViaCoop(content.raidId, {
            difficulty: content.difficulty,
            coop: true,
            resume: options.resume === true,
        });
        return;
    }

    if (!content) {
        if (typeof startStoryPhase === 'function') {
            startStoryPhase(parseInt(coopAtoId, 10) || 0, coopFaseId);
        }
        return;
    }

    if (content.type === 'nacoes') {
        if (typeof window.setStoryDifficulty === 'function') {
            window.setStoryDifficulty(content.difficulty || 'normal');
        }
        window._nacaoBatalha = {
            ativa: true,
            nacaoId: content.nacaoId,
            faseId: String(content.phaseId),
            dificuldade: content.difficulty || 'normal',
            isNacao: true,
            isFinal: String(content.phaseId) === '3',
        };
        window._nacaoAtivo = true;
        window._eventoAtivo = true;
        window._eventoMode = true;
        window._eventoAtual = {
            bossId: `nacao_${content.nacaoId}`,
            faseId: String(content.phaseId),
        };
        await window.eventoIniciarBatalha(`nacao_${content.nacaoId}`, String(content.phaseId));
        return;
    }

    if (content.type === 'selados') {
        if (typeof window.setDificuldadeEvento === 'function') {
            window.setDificuldadeEvento(content.difficulty || 'normal');
        }
        window._eventoMode = true;
        window._eventoAtual = {
            bossId: content.bossId,
            faseId: String(content.phaseId),
            isPesadelo: content.bossId === 'pesadelo',
        };
        await window.eventoIniciarBatalha(content.bossId, String(content.phaseId));
    }
}

function coopSanitize(str) {
    return String(str || 'Jogador').substring(0, 20).replace(/[<>]/g, '');
}

function coopBossTypeNormalize(tipo) {
    if (!tipo) return 'BOITATA';
    if (typeof SPRITES !== 'undefined' && SPRITES[tipo]) return tipo;

    const lower = String(tipo).toLowerCase();
    const mapa = {
        'saci': 'SACI', 'mapinguari': 'MAPINGUARI', 'iara': 'IARA',
        'boitata': 'BOITATA', 'mula': 'MULA', 'corpo_seco': 'CORPOSECO',
        'corposeco': 'CORPOSECO', 'lobisomem': 'LOBISOMEM', 'cuca': 'CUCA',
        'boto': 'BOTO', 'boi': 'BOI', 'jaci': 'JACI',
        'guaraci': 'GUARACI', 'anhanga': 'ANHANGA',
    };
    return mapa[lower] || String(tipo).toUpperCase();
}

function coopBossTypeToEnemyId(bossType) {
    const mapa = {
        'SACI': 'saci', 'MAPINGUARI': 'mapinguari', 'IARA': 'iara',
        'BOITATA': 'boitata', 'MULA': 'mula', 'CORPOSECO': 'corpo_seco',
        'LOBISOMEM': 'lobisomem', 'CUCA': 'cuca', 'BOTO': 'boto',
        'BOI': 'boi', 'JACI': 'jaci', 'GUARACI': 'guaraci',
        'ANHANGA': 'anhanga',
    };
    return mapa[bossType] || String(bossType).toLowerCase();
}

function coopGetBossSprite(bossType) {
    if (typeof SPRITES !== 'undefined' && SPRITES[bossType]) {
        return SPRITES[bossType];
    }
    if (typeof SPRITES_STORY !== 'undefined') {
        const lower = String(bossType).toLowerCase();
        if (SPRITES_STORY[lower]) return SPRITES_STORY[lower];
        const idFromBoss = coopBossTypeToEnemyId(bossType);
        if (SPRITES_STORY[idFromBoss]) return SPRITES_STORY[idFromBoss];
    }
    return null;
}

function coopRegistrarEvento(evento) {
    if (!window._coopMode) return;
    if (!evento.uid) evento.uid = coopMeuUid();
    if (!evento.role) evento.role = coopRole;
    coopEventosTurno.push(evento);
}

// *** Verifica se um herói específico está morto ***
function coopHeroiMorto(idx) {
    if (!players || !players[idx]) return false;
    return players[idx].dead === true;
}

// *** Retorna o próximo índice de herói vivo ***
function coopProximoHeroiVivo(idxAtual) {
    if (!players || players.length === 0) return -1;

    let proximo = (idxAtual + 1) % players.length;
    let tentativas = 0;

    while (tentativas < players.length) {
        if (!players[proximo].dead) return proximo;
        proximo = (proximo + 1) % players.length;
        tentativas++;
    }

    return -1;
}

// =================================================================
// 4. LOGIN
// =================================================================
async function coopInit() {
    if (coopUser) return true;
    if (fbAuth.currentUser) {
        coopUser = fbAuth.currentUser;
        return true;
    }
    try {
        const r = await fbAuth.signInAnonymously();
        coopUser = r.user;
        coopLog('Login OK:', coopUser.uid);
        return true;
    } catch (e) {
        console.error('[coop] Erro no login:', e);
        uiAviso('Erro ao conectar no Firebase. Verifique se o Auth Anônimo está ativo.');
        return false;
    }
}

// =================================================================
// 5. PAINEL DE SALAS
// =================================================================
let painelUnsubs = [];

function coopTipoDaSala(room) {
    const type = room.coopContent?.type;
    if (type === 'nacoes' || type === 'selados') return type;
    if (type === 'raid-regional' || /^raid\s*:/i.test(String(room.fase || ''))) return 'raid';
    return 'atos';
}

function coopContextoDaSala(room) {
    const type = coopTipoDaSala(room);
    if (type === 'atos') return String(room.ato ?? '');
    if (type === 'raid') {
        return String(room.coopContent?.raidId || String(room.fase || '').replace(/^raid\s*:\s*/i, ''));
    }
    return String(type === 'selados' ? room.coopContent?.bossId || '' : room.coopContent?.nacaoId || '');
}

function coopFaseDaSala(room) {
    if (room.coopContent?.phaseId != null) return String(room.coopContent.phaseId);
    return coopTipoDaSala(room) === 'raid' ? 'unica' : String(room.fase ?? '');
}

function coopDificuldadeDaSala(room) {
    return String(room.coopContent?.difficulty || room.dificuldade || 'sem-dificuldade');
}

function coopNomeTipoSala(type) {
    return ({
        atos: 'Atos',
        raid: 'Raids regionais',
        selados: 'Sete Selados',
        nacoes: 'Sete Nações',
    })[type] || 'Atos';
}

function coopNomeContextoSala(room) {
    const type = coopTipoDaSala(room);
    const id = coopContextoDaSala(room);
    if (type === 'atos') return `Ato ${id || '?'}`;
    if (type === 'raid') {
        const raid = window.raidGetConfig?.(id);
        return raid?.name || raid?.nome || room.coopContent?.title || `Raid ${id || '?'}`;
    }
    if (type === 'selados') return window.EVENTO_BOSSES?.[id]?.nome || id || 'Chefe';
    return window.NACOES?.[id]?.nome || id || 'Nação';
}

function coopNomeFaseSala(room) {
    const type = coopTipoDaSala(room);
    const phase = coopFaseDaSala(room);
    if (type === 'raid') return 'Combate';
    if (phase === 'boss') return 'Chefe';
    if (/^fase\b/i.test(phase)) return phase;
    return `Fase ${phase || '?'}`;
}

function coopNomeDificuldadeSala(room) {
    const difficulty = coopDificuldadeDaSala(room);
    return ({
        normal: 'Normal',
        dificil: 'Difícil',
        pesadelo: 'Pesadelo',
        'sem-dificuldade': 'Sem dificuldade',
    })[difficulty] || difficulty;
}

function coopDefinirOpcoesFiltro(select, values, placeholder, selectedValue) {
    if (!select) return '';
    const options = [{ value: '', label: placeholder }, ...values];
    select.replaceChildren();
    options.forEach(item => {
        const option = document.createElement('option');
        option.value = item.value;
        option.textContent = item.label;
        select.appendChild(option);
    });
    const selectedExists = options.some(item => item.value === selectedValue);
    select.value = selectedExists ? selectedValue : '';
    return select.value;
}

function coopRenderSalasAbertas(salas) {
    const list = document.getElementById('coopListaAbertas');
    const count = document.getElementById('coopCountAbertas');
    if (!list || !count) return;

    const tipoFiltro = document.getElementById('coopFiltroTipo')?.value || '';
    const contextoFiltro = document.getElementById('coopFiltroContexto');
    const faseFiltro = document.getElementById('coopFiltroFase');
    const dificuldadeFiltro = document.getElementById('coopFiltroDificuldade')?.value || '';

    const salasPorTipo = salas.filter(room => !tipoFiltro || coopTipoDaSala(room) === tipoFiltro);
    const contextos = new Map();
    salasPorTipo.forEach(room => {
        const key = `${coopTipoDaSala(room)}|${coopContextoDaSala(room)}`;
        if (!contextos.has(key)) contextos.set(key, coopNomeContextoSala(room));
    });
    const contextoSelecionado = coopDefinirOpcoesFiltro(
        contextoFiltro,
        [...contextos].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
            .map(([value, label]) => ({ value, label })),
        'Todos os atos / eventos',
        contextoFiltro?.value || ''
    );

    const salasPorContexto = salasPorTipo.filter(room =>
        !contextoSelecionado || `${coopTipoDaSala(room)}|${coopContextoDaSala(room)}` === contextoSelecionado
    );
    const fases = new Map();
    salasPorContexto.forEach(room => {
        const key = `${coopTipoDaSala(room)}|${coopFaseDaSala(room)}`;
        if (!fases.has(key)) fases.set(key, coopNomeFaseSala(room));
    });
    const faseSelecionada = coopDefinirOpcoesFiltro(
        faseFiltro,
        [...fases].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
            .map(([value, label]) => ({ value, label })),
        'Todas as fases',
        faseFiltro?.value || ''
    );

    const filtradas = salas.filter(room => {
        if (tipoFiltro && coopTipoDaSala(room) !== tipoFiltro) return false;
        if (contextoSelecionado
            && `${coopTipoDaSala(room)}|${coopContextoDaSala(room)}` !== contextoSelecionado) return false;
        if (faseSelecionada && `${coopTipoDaSala(room)}|${coopFaseDaSala(room)}` !== faseSelecionada) return false;
        if (dificuldadeFiltro && coopDificuldadeDaSala(room) !== dificuldadeFiltro) return false;
        return true;
    });

    count.textContent = filtradas.length === salas.length
        ? String(salas.length)
        : `${filtradas.length}/${salas.length}`;
    if (filtradas.length === 0) {
        list.innerHTML = salas.length === 0
            ? '<div class="coop-empty">Nenhuma sala aberta. Crie uma!</div>'
            : '<div class="coop-empty">Nenhuma sala corresponde aos filtros.</div>';
        return;
    }
    list.innerHTML = filtradas.map(room => coopRenderCard(room, 'aberta')).join('');
}

function coopAbrirPainel() {
    if (!coopUser) {
        coopInit().then(ok => { if (ok) coopAbrirPainel(); });
        return;
    }

    const old = document.getElementById('coopPainel');
    if (old) old.remove();

    painelUnsubs.forEach(u => u && u());
    painelUnsubs = [];

    const painel = document.createElement('div');
    painel.id = 'coopPainel';
    painel.className = 'coop-painel-overlay';
    painel.innerHTML = `
        <div class="coop-painel-container">
            <div class="coop-painel-header">
                <h2>🎮 JOGAR COOP</h2>
                <button class="coop-painel-close" onclick="coopFecharPainel()">✕ FECHAR</button>
            </div>
            <div class="coop-painel-subtitle">
                Para criar uma sala, vá em <b>ATOS → escolha uma fase → clique em 🎮</b>.
            </div>
            <div class="coop-painel-section">
                <div class="coop-painel-section-title">
                    👤 MINHAS PARTIDAS <span class="coop-count" id="coopCountMinhas">0</span>
                </div>
                <div class="coop-lista" id="coopListaMinhas">
                    <div class="coop-empty">Carregando...</div>
                </div>
            </div>
            <div class="coop-painel-section">
                <div class="coop-painel-section-title">
                    🌐 SALAS ABERTAS <span class="coop-count" id="coopCountAbertas">0</span>
                </div>
                <div class="coop-filtros" aria-label="Filtros de salas abertas">
                    <select id="coopFiltroTipo" aria-label="Tipo de conteúdo">
                        <option value="">Todos os tipos</option>
                        <option value="atos">Atos</option>
                        <option value="raid">Raids regionais</option>
                        <option value="selados">Sete Selados</option>
                        <option value="nacoes">Sete Nações</option>
                    </select>
                    <select id="coopFiltroContexto" aria-label="Ato, raid ou evento">
                        <option value="">Todos os atos / eventos</option>
                    </select>
                    <select id="coopFiltroFase" aria-label="Fase">
                        <option value="">Todas as fases</option>
                    </select>
                    <select id="coopFiltroDificuldade" aria-label="Dificuldade">
                        <option value="">Todas as dificuldades</option>
                        <option value="normal">Normal</option>
                        <option value="dificil">Difícil</option>
                        <option value="pesadelo">Pesadelo</option>
                        <option value="sem-dificuldade">Sem dificuldade registrada</option>
                    </select>
                </div>
                <div class="coop-lista" id="coopListaAbertas">
                    <div class="coop-empty">Carregando...</div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(painel);

    ['coopFiltroTipo', 'coopFiltroContexto', 'coopFiltroFase', 'coopFiltroDificuldade']
        .forEach(id => document.getElementById(id)?.addEventListener('change', () => {
            coopRenderSalasAbertas(coopSalasAbertasCache);
        }));
    coopAssinarMinhas();
    coopAssinarAbertas();
}

function coopFecharPainel() {
    painelUnsubs.forEach(u => u && u());
    painelUnsubs = [];
    const p = document.getElementById('coopPainel');
    if (p) p.remove();
}

function coopAssinarMinhas() {
    let minhasCriador = [];
    let minhasOponente = [];

    const mergeErender = () => {
        const list = document.getElementById('coopListaMinhas');
        const count = document.getElementById('coopCountMinhas');
        if (!list) return;

        const todas = [...minhasCriador, ...minhasOponente];
        count.textContent = todas.length;

        if (todas.length === 0) {
            list.innerHTML = '<div class="coop-empty">Você não tem partidas em andamento.</div>';
            return;
        }

        todas.sort((a, b) => {
            const ta = a.atualizadaEm?.toMillis?.() || 0;
            const tb = b.atualizadaEm?.toMillis?.() || 0;
            return tb - ta;
        });

        list.innerHTML = todas.map(r => coopRenderCard(r, 'minha')).join('');
    };

    const unsub1 = fbDb.collection(COOP_ROOMS)
        .where('criador.uid', '==', coopUser.uid)
        .onSnapshot(snap => {
            minhasCriador = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                .filter(r => r.status !== 'concluida' && r.status !== 'cancelada');
            mergeErender();
        }, e => console.warn('[coop] Listener minhas (criador):', e));

    const unsub2 = fbDb.collection(COOP_ROOMS)
        .where('oponente.uid', '==', coopUser.uid)
        .onSnapshot(snap => {
            minhasOponente = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                .filter(r => r.status !== 'concluida' && r.status !== 'cancelada');
            mergeErender();
        }, e => console.warn('[coop] Listener minhas (oponente):', e));

    painelUnsubs.push(unsub1, unsub2);
}

function coopAssinarAbertas() {
    const unsub = fbDb.collection(COOP_ROOMS)
        .onSnapshot(snap => {
            coopSalasAbertasCache = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(r => {
                    if (r.criador?.uid === coopUser.uid) return false;
                    if (r.oponente?.uid) return false;
                    return r.status === 'turno_maria' || r.status === 'aguardando_oponente';
                })
                .sort((a, b) => {
                    const ta = a.criadaEm?.toMillis?.() || 0;
                    const tb = b.criadaEm?.toMillis?.() || 0;
                    return tb - ta;
                });
            coopRenderSalasAbertas(coopSalasAbertasCache);
        }, e => console.warn('[coop] Listener abertas:', e));

    painelUnsubs.push(unsub);
}

function coopRenderCard(room, tipo) {
    const isCriador = room.criador?.uid === coopUser.uid;
    const isOponente = room.oponente?.uid === coopUser.uid;
    const fase = room.fase || '?';
    const criador = room.criador?.nome || '?';
    const heroiC = room.criador?.heroi || '?';
    const oponente = room.oponente?.nome || null;
    const heroiO = room.oponente?.heroi || null;

    let badge = '';
    let acoes = '';

    if (tipo === 'aberta') {
        badge = '<span class="coop-badge amarelo">🟡 Aberta</span>';
        acoes = `<button class="coop-btn-coop entrar" onclick="coopEntrarSala('${room.id}')">🎮 ENTRAR</button>`;
    } else {
        if (room.status === 'pausada') {
            badge = '<span class="coop-badge cinza">⏸️ Pausada</span>';
        } else if (room.status === 'turno_boss') {
            badge = '<span class="coop-badge azul">👹 Turno do Boss</span>';
        } else {
            const turnoDe = room.estadoJogo?.turnoDe;
            const meuTurno =
                (isCriador && turnoDe === 'criador') ||
                (isOponente && turnoDe === 'oponente');
            badge = meuTurno
                ? '<span class="coop-badge verde">🎯 SEU TURNO</span>'
                : '<span class="coop-badge amarelo">⏳ Aguardando</span>';
        }

        acoes = `
            <button class="coop-btn-coop" onclick="coopContinuarSala('${room.id}')">▶ CONTINUAR</button>
            ${isCriador ? `<button class="coop-btn-coop cancelar" onclick="coopCancelarSala('${room.id}')">🗑️</button>` : ''}
        `;
    }

    return `
        <div class="coop-card">
            <div class="coop-card-header">
                <span class="coop-card-fase">${coopNomeTipoSala(coopTipoDaSala(room))} · ${coopNomeContextoSala(room)} · ${coopNomeFaseSala(room)}</span>
                ${badge}
            </div>
            <div class="coop-card-meta">${coopNomeDificuldadeSala(room)}</div>
            <div class="coop-card-players">
                <span class="coop-jogador ${isCriador ? 'me' : ''}">👤 ${criador} <b>(${heroiC})</b></span>
                <span class="coop-vs">vs</span>
                <span class="coop-jogador ${isOponente ? 'me' : ''} ${!oponente ? 'vazio' : ''}">
                    ${oponente ? `👤 ${oponente} <b>(${heroiO})</b>` : '❓ aguardando...'}
                </span>
            </div>
            <div class="coop-card-acoes">${acoes}</div>
        </div>
    `;
}

// =================================================================
// 6. CRIAR SALA
// =================================================================
async function coopCriarSala(atoId, faseId, content = null) {
    if (!coopUser) {
        const ok = await coopInit();
        if (!ok) return;
    }

    const heroClass = (STORY_PROGRESS.selectedHeroes || ['Tupa'])[0];
    const check = coopValidarConteudo(content, heroClass, true);
    if (!check.valido) {
        uiAviso(check.motivo);
        return;
    }

    const custoNacao = content?.type === 'nacoes'
        ? (window._nacaoConfig?.custoEntrada?.[content.difficulty] || 500)
        : 0;
    const usaChave = content?.type === 'selados' && String(content.phaseId) === 'boss';
    let prompt = content?.confirmMessage || (
        content
            ? `🎮 CRIAR SALA COOP\n\n${content.title || faseId}\nHerói: ${STORY_HERO_CLASSES[heroClass]?.displayName || heroClass}\n` +
              `${custoNacao ? `Custo pago pelo anfitrião: ${custoNacao} ouro.\n` : ''}` +
              `${usaChave ? 'O anfitrião gastará 1 chave.\n' : ''}` +
              '\nVocê inicia a batalha; quem entrar na sala não paga a entrada.\n\nContinuar?'
            : `🎮 CRIAR SALA COOP\n\nFase: ${faseId} (Ato ${atoId})\n\nVocê vai jogar seu turno. Depois a sala fica aberta pra um amigo entrar.\n\nContinuar?`
    );
    if (content?.type === 'raid-regional') {
        const difficultyScale = { normal: 1, dificil: 1.5, pesadelo: 2 };
        const cfg = window.raidGetConfig(content.raidId);
        const price = cfg ? Math.round(cfg.custoEntrada * (difficultyScale[content.difficulty] || 1)) : 0;
        prompt = `🎮 CRIAR SALA COOP\n\n${content.title}\nHerói: ${STORY_HERO_CLASSES[heroClass]?.displayName || heroClass}\n` +
            `Dificuldade: ${content.difficulty}\nEntrada paga pelo anfitrião: ${price} ouro.\n` +
            'A tentativa semanal será consumida ao iniciar. Quem entrar não paga a entrada.\n\nContinuar?';
    }
    if (!(await uiConfirm(prompt))) {
        return;
    }

    if (content?.type === 'nacoes') {
        if ((STORY_PROGRESS.gold || 0) < custoNacao) {
            uiAviso(`O anfitrião precisa de ${custoNacao} de ouro para abrir esta fase.`);
            return;
        }
        STORY_PROGRESS.gold -= custoNacao;
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
    } else if (usaChave) {
        if (typeof window.gastarChave !== 'function' || !window.gastarChave(1)) {
            uiAviso('Não foi possível gastar a chave do anfitrião.');
            return;
        }
    }

    window._coopMode = true;
    coopContent = content;
    window._coopContent = content;
    coopRole = 'criador';
    window._coopRole = 'criador';
    coopRoomId = null;
    coopFaseId = faseId;
    coopAtoId = parseInt(atoId, 10) || 0;
    coopP1Atualizado = false;
    coopFinalizando = false;
    coopProcessandoMorteBoss = false;
    coopPartidaConcluida = false;
    coopEventosTurno = [];
    coopReplayRodando = false;
    coopBufferEventosBoss = [];
    coopCapturandoEventosBoss = false;
    coopEnemyAlreadyDead = false;

    window._coopCriadorHeroClass = (STORY_PROGRESS.selectedHeroes || ['Tupa'])[0];
    window._coopCriadorNome = coopSanitize(localStorage.getItem('coop_player_name') || 'Jogador');
    window._coopCriadorSave = STORY_CURRENT_SAVE_NAME;

    document.querySelectorAll('#storyScreen, #titleScreen, #modeScreen, #playersScreen, #challengeScreen, #configScreen, #tutorialScreen').forEach(el => {
        if (el) el.style.display = 'none';
    });
    const ss = document.getElementById('storyScreen');
    if (ss) ss.classList.remove('active');

    const _origInitGame = window.initGame;
    window.initGame = async function() {
        await _origInitGame.apply(this, arguments);
        window.initGame = _origInitGame;
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        coopRebuildPlayers();
        setTimeout(() => coopInjetarUI(), 500);
    };

    await coopIniciarConteudo(content);
}

// =================================================================
// 7. ENTRAR EM SALA
// =================================================================
async function coopEntrarSala(roomId) {
    if (!coopUser) {
        const ok = await coopInit();
        if (!ok) return;
    }

    let room;
    try {
        const doc = await fbDb.collection(COOP_ROOMS).doc(roomId).get();
        if (!doc.exists) {
            uiAviso('Sala não encontrada.');
            return;
        }
        room = { id: doc.id, ...doc.data() };
    } catch (e) {
        uiAviso('Erro ao buscar sala: ' + e.message);
        return;
    }

    if (room.criador?.uid === coopUser.uid) {
        uiAviso('Você não pode entrar na sua própria sala.');
        return;
    }
    if (room.oponente?.uid) {
        uiAviso('Esta sala já tem oponente.');
        return;
    }

    const meuHeroClass = (STORY_PROGRESS.selectedHeroes || ['Tupa'])[0];
    const meuHeroData = STORY_HERO_CLASSES[meuHeroClass];
    const meuNome = coopSanitize(localStorage.getItem('coop_player_name') || 'Jogador');

    if (!meuHeroData) {
        uiAviso('Herói inválido no save.');
        return;
    }

    const contentCheck = coopValidarConteudo(room.coopContent, meuHeroClass, false);
    if (!contentCheck.valido) {
        uiAviso(contentCheck.motivo);
        return;
    }

    if (!(await uiConfirm(`🎮 ENTRAR NA SALA COOP\n\nCriador: ${room.criador.nome} (${room.criador.heroi})\nFase: ${room.fase}\nSeu herói: ${meuHeroData.displayName}\n\nEntrar?`, { titulo: 'Entrar na sala', ok: 'Entrar', cancelar: 'Cancelar' }))) {
        return;
    }

    try {
        await fbDb.collection(COOP_ROOMS).doc(roomId).update({
            oponente: {
                uid: coopUser.uid,
                nome: meuNome,
                heroi: meuHeroData.displayName,
                heroiClass: meuHeroClass,
                saveName: STORY_CURRENT_SAVE_NAME,
            },
            status: 'turno_maria',
            atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
        });
        coopLog('Entrou na sala:', roomId);
    } catch (e) {
        uiAviso('Erro ao entrar: ' + e.message);
        return;
    }

    window._coopMode = true;
    coopContent = room.coopContent || null;
    window._coopContent = coopContent;
    coopRole = 'oponente';
    window._coopRole = 'oponente';
    coopRoomId = roomId;
    coopFaseId = room.fase;
    coopAtoId = room.ato;
    coopP1Atualizado = false;
    coopFinalizando = false;
    coopProcessandoMorteBoss = false;
    coopPartidaConcluida = false;
    coopEventosTurno = [];
    coopReplayRodando = false;
    coopBufferEventosBoss = [];
    coopCapturandoEventosBoss = false;
    coopEnemyAlreadyDead = false;
    window._coopCriadorHeroClass = room.criador.heroiClass;
    window._coopOponenteHeroClass = meuHeroClass;
    window._coopOponenteNome = meuNome;

    coopFecharPainel();
    document.querySelectorAll('#storyScreen, #titleScreen, #modeScreen, #playersScreen, #challengeScreen, #configScreen, #tutorialScreen').forEach(el => {
        if (el) el.style.display = 'none';
    });
    const ss = document.getElementById('storyScreen');
    if (ss) ss.classList.remove('active');

    const _origInitGame = window.initGame;
    window.initGame = async function() {
        await _origInitGame.apply(this, arguments);
        window.initGame = _origInitGame;
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        try {
            const doc = await fbDb.collection(COOP_ROOMS).doc(roomId).get();
            if (doc.exists) coopRoomData = { id: doc.id, ...doc.data() };
        } catch (e) {}

        coopRebuildPlayers();
        coopInstalarListener();
        setTimeout(() => coopInjetarUI(), 500);
    };

    await coopIniciarConteudo(coopContent);
}

// =================================================================
// 8. REBUILD DE PLAYERS + TOKENS
// =================================================================
function coopRebuildPlayers() {
    if (!window._coopMode) return;

    const rd = coopRoomData || {};
    const heroCriador = rd.criador?.heroiClass || window._coopCriadorHeroClass || 'Tupa';
    const heroOponente = rd.oponente?.heroiClass || window._coopOponenteHeroClass || 'Tupa';

    const dataC = STORY_HERO_CLASSES[heroCriador];
    const dataO = STORY_HERO_CLASSES[heroOponente];

    const estadoPlayers = rd.estadoJogo?.players || [];
    const estadoP0 = estadoPlayers[0] || null;
    const estadoP1 = estadoPlayers[1] || null;

    const p2EhPlaceholder = !rd.oponente || !rd.oponente.uid;

    players.length = 0;

    players.push({
        id: 0,
        x: estadoP0?.x ?? 2,
        y: estadoP0?.y ?? 7,
        hp: estadoP0?.hp ?? (dataC?.hp || 16),
        maxHp: estadoP0?.maxHp ?? (dataC?.hp || 16),
        class: heroCriador,
        element: estadoP0?.element || 'FOGO',
        name: rd.criador?.nome || 'Criador',
        skillUsed: estadoP0?.skillUsed || false,
        dead: estadoP0?.dead || false,
        bonusAtk: estadoP0?.bonusAtk || 0,
        placeholder: false,
    });

    players.push({
        id: 1,
        x: estadoP1?.x ?? 5,
        y: estadoP1?.y ?? 7,
        hp: estadoP1?.hp ?? (dataO?.hp || 16),
        maxHp: estadoP1?.maxHp ?? (dataO?.hp || 16),
        class: p2EhPlaceholder ? 'Tupa' : heroOponente,
        element: estadoP1?.element || 'FOGO',
        name: p2EhPlaceholder ? 'aguardando...' : (rd.oponente?.nome || 'Oponente'),
        skillUsed: estadoP1?.skillUsed || false,
        dead: estadoP1?.dead || false,
        bonusAtk: estadoP1?.bonusAtk || 0,
        placeholder: p2EhPlaceholder,
    });

    const board = document.getElementById('board');
    if (board) {
        board.querySelectorAll('.token').forEach(t => {
            if (!t.id.includes('Boss')) t.remove();
        });

        players.forEach((p, i) => {
            const tok = document.createElement('div');
            tok.id = `tokenP${i}`;
            tok.className = `token p-hue-${i}`;
            if (p.placeholder) tok.classList.add('placeholder');
            if (p.dead) tok.classList.add('dead');

            const spriteSrc = p.placeholder ? '' : SPRITES[p.class];
            const imgHTML = p.placeholder
                ? `<div class="coop-silhueta">?</div>`
                : `<img id="imgP${i}" src="${spriteSrc}" class="normal">`;

            tok.innerHTML = `
                <div class="hp-container"><div id="hpBarP${i}" class="hp-bar"></div></div>
                ${imgHTML}
            `;
            board.appendChild(tok);
        });
    }

    if (rd.estadoJogo?.boss && typeof boss !== 'undefined') {
        const bt = coopBossTypeNormalize(rd.estadoJogo.boss.type);
        Object.assign(boss, rd.estadoJogo.boss);
        boss.type = bt;
    }

    if (rd.estadoJogo?.grid) {
        for (let i = 0; i < 64; i++) {
            if (rd.estadoJogo.grid[i]) grid[i] = rd.estadoJogo.grid[i];
        }
    }
    if (rd.estadoJogo?.amulets) {
        amulets.length = 0;
        rd.estadoJogo.amulets.forEach(a => amulets.push(a));
    }

    window.currentPlayerIdx = coopMeuIdx();
    window.editingIdx = coopMeuIdx();

    // Aplica bônus de nível + equipamento
    if (typeof applyHeroLevelBonus === 'function' || typeof applyHeroEquipment === 'function') {
        players.forEach(p => {
            if (typeof getHeroBonusFromLevel === 'function') {
                const bonus = getHeroBonusFromLevel(p.class);
                if (bonus.hp > 0 && !p.levelBonusApplied) {
                    p.maxHp += bonus.hp;
                    p.hp = p.maxHp;
                    p.levelBonusApplied = true;
                }
            }
            if (typeof applyHeroEquipment === 'function' && !p.equipApplied) {
                try { applyHeroEquipment(p); p.equipApplied = true; } catch(e) {}
            }
        });
    }

    coopRenderTudo();

    if (rd.coopContent?.type === 'raid-regional'
        && rd.estadoJogo?.raid
        && typeof window.raidAplicarEstadoCoop === 'function') {
        window.raidAplicarEstadoCoop(rd.estadoJogo.raid);
    }

    coopAtualizarUI();
}

function coopRenderTudo() {
    if (typeof updateVisuals === 'function') updateVisuals();
    if (typeof updateHeroCard === 'function') updateHeroCard();
    if (typeof updateBossCard === 'function') updateBossCard();
    if (typeof updateAllSpriteDirections === 'function') updateAllSpriteDirections();
    if (typeof updateHeaderBossName === 'function') updateHeaderBossName();

    const imgBoss = document.getElementById('imgBoss');
    if (imgBoss && boss && boss.type) {
        const url = coopGetBossSprite(boss.type);
        if (url && imgBoss.src !== url) {
            imgBoss.src = url;
            imgBoss.style.display = '';
        }
    }

    if (players) {
        players.forEach((p, i) => {
            const tok = document.getElementById(`tokenP${i}`);
            if (tok) {
                if (p.dead) tok.classList.add('dead');
                else tok.classList.remove('dead');
            }
        });
    }

    setTimeout(() => {
        const bs = document.getElementById('bossCardSprite');
        if (bs && boss && boss.type) {
            const url = coopGetBossSprite(boss.type);
            if (url && (!bs.src || bs.src.includes('undefined'))) bs.src = url;
        }
    }, 100);
}

// =================================================================
// 9. HANDLE SELECT
// =================================================================
function coopHandleSelect(idx) {
    if (!window._coopMode) return;
    if (coopPartidaConcluida) return;
    if (coopReplayRodando) return;
    if (!gameActive || arcadeBossTransition) return;

    const meuIdx = coopMeuIdx();
    const p = players[meuIdx];
    if (!p) return;
    if (p.placeholder) return;

    if (p.dead) {
        coopLog('Herói morto. Bloqueando clique.');
        return;
    }

    if (!coopEhMeuTurno()) {
        coopLog('Clique bloqueado: não é meu turno');
        return;
    }

    if (skillActive) {
        grid[idx] = p.element;
        const tile = document.querySelectorAll('#grid .tile')[idx];
        if (tile) tile.className = `tile bg-${p.element}`;
        p.skillUsed = true;
        skillActive = false;
        document.querySelectorAll('#grid .tile').forEach(t => t.classList.remove('skill-mode'));
        if (typeof addLog === 'function') addLog(`${icon('solo_sagrado')} ${p.name} usou SOLO SAGRADO!`);

        coopRegistrarEvento({
            tipo: 'skill',
            x: idx % 8,
            y: Math.floor(idx / 8),
            em: Date.now(),
        });

        coopAtualizarUI();
        return;
    }

    const x = idx % 8;
    const y = Math.floor(idx / 8);

    if (isOccupied(x, y, p.id) || (x === p.x && y === p.y)) return;

    if (path.length === 0) {
        if ((Math.abs(x - p.x) + Math.abs(y - p.y)) === 1) {
            path.push(idx);
            if (typeof playSfx === 'function') playSfx('click');
        }
    } else {
        const lastIdx = path[path.length - 1];
        if (idx === lastIdx) {
            path.pop();
            if (typeof playSfx === 'function') playSfx('click');
        } else if (!path.includes(idx)
                   && grid[idx] === grid[lastIdx]
                   && (Math.abs(x - lastIdx % 8) + Math.abs(y - Math.floor(lastIdx / 8))) === 1) {
            path.push(idx);
            if (typeof playSfx === 'function') playSfx('click');
        }
    }

    if (typeof renderPath === 'function') renderPath();
    coopHabilitarBotoes();
}

// =================================================================
// 10. EXECUTE ACTION
// =================================================================
async function coopExecuteAction() {
    if (!window._coopMode) return;
    if (coopPartidaConcluida) return;
    if (coopReplayRodando) return;
    if (coopBossRunning) return;

    const meuIdx = coopMeuIdx();
    const active = players[meuIdx];

    if (!active || active.placeholder) {
        console.error('[coop] Sem herói ativo');
        return;
    }

    if (active.dead) {
        coopLog('Herói morto. Ignorando ação.');
        return;
    }

    if (!coopEhMeuTurno()) {
        coopLog('executeAction bloqueado: não é meu turno');
        return;
    }

    coopLog('executeAction. active =', active.name, '| path =', path?.length);

    if (!path || path.length === 0) {
        coopLog('Path vazio, passando turno');
        await coopPublicarEstado();
        return;
    }

    coopEventosTurno = [];

    try {
        await coopExecutarAcaoManual(active);
    } catch (e) {
        console.error('[coop] Erro na execução:', e);
    }
}

// =================================================================
// 10b. COOP EXECUTAR AÇÃO MANUAL (com bônus de nível + arma)
// =================================================================
async function coopExecutarAcaoManual(active) {
    const target = boss;
    const info = CLASS_DB[active.class] || { atk: 2, min: 0 };
    const heroData = (typeof STORY_HERO_CLASSES !== 'undefined')
                     ? STORY_HERO_CLASSES[active.class]
                     : { role: 'Guerreiro' };
    const usedPath = [...path];
    const isAdjacentToTarget = (x, y) => {
        if (window._raidMode) {
            const sizeH = target.sizeH || target.size || 1;
            const sizeV = target.sizeV || target.size || 1;
            for (let dx = 0; dx < sizeH; dx++) {
                for (let dy = 0; dy < sizeV; dy++) {
                    if (Math.abs(x - (target.x + dx)) + Math.abs(y - (target.y + dy)) <= 1) {
                        return true;
                    }
                }
            }
            return false;
        }
        return Math.abs(x - target.x) + Math.abs(y - target.y) <= 1;
    };
    const threshold = parseInt(document.getElementById('bravely_tiles')?.value) || 9;
    const isBravely = usedPath.length >= threshold;

    let skillAtkBonus = 0;
    const shape = (typeof detectShape === 'function') ? detectShape(usedPath) : null;
    if (shape && RANKING.shapes[shape] !== undefined) {
        RANKING.shapes[shape]++;
        if (typeof updateTitleStats === 'function') updateTitleStats('shape_executed', 1, shape);
    }
    if (shape) {
        if (shape === "LINHA") {
            skillAtkBonus = 2;
            active.hp = Math.min(active.maxHp, active.hp + 1);
            if (typeof showHealEffect === 'function') showHealEffect(active.x, active.y, 1);
        }
        if (shape === "L") {
            active.hp = Math.min(active.maxHp, active.hp + 2);
            if (typeof showHealEffect === 'function') showHealEffect(active.x, active.y, 2);
        }
        if (shape === "ZIGZAG") skillAtkBonus = 3;
        if (shape === "QUADRADO") active.skillUsed = false;
    }

    // ----- BÔNUS DE NÍVEL -----
    let levelBonus = { hp: 0, atk: 0, formAtk: 0, paAtk: 0 };
    if (typeof getHeroBonusFromLevel === 'function') {
        levelBonus = getHeroBonusFromLevel(active.class) || levelBonus;
    }

    // ----- BÔNUS ELEMENTAL DA ARMA -----
    let weaponElementBonus = 0;
    if (typeof getHeroEquipment === 'function' && typeof getWeaponById === 'function') {
        const eq = getHeroEquipment(active.class);
        if (eq && eq.arma && usedPath.length > 0) {
            const w = getWeaponById(eq.arma);
            if (w) {
                const firstTileElement = grid[usedPath[0]];
                const weaponElem = w.elemento;
                if (weaponElem === 'ANY') {
                    if (firstTileElement === active.element) {
                        weaponElementBonus = w.elementoBonus || 0;
                    }
                } else if (firstTileElement === weaponElem) {
                    weaponElementBonus = w.elementoBonus || 0;
                }
            }
        }
    }

    const titleAtkBonus = active.titleBonus?.ATK || 0;
    const tileBonus = (usedPath.length > 0 && grid[usedPath[0]] === active.element) ? 1 : 0;
    const totalAtk = info.atk
                   + (active.bonusAtk || 0)
                   + (levelBonus.atk || 0)
                   + tileBonus
                   + skillAtkBonus
                   + titleAtkBonus
                   + weaponElementBonus;

    coopLog('Ação:', active.name, '| totalAtk:', totalAtk, '| isBravely:', isBravely);

    coopRegistrarEvento({
        tipo: 'preparar',
        atk: totalAtk,
        em: Date.now(),
    });

    if (heroData.role === 'Guerreiro') {
        const dealDmg = () => {
            if (target.dead) return;
            if (isAdjacentToTarget(active.x, active.y)) {
                if (typeof playSfx === 'function') playSfx('atkg');
                coopApplyDmg(target, totalAtk);
                if (typeof spawnSwordEffect === 'function') spawnSwordEffect(target.x, target.y);

                coopRegistrarEvento({
                    tipo: 'attack',
                    dmg: totalAtk,
                    alvoX: target.x,
                    alvoY: target.y,
                    em: Date.now(),
                });
            }
        };
        dealDmg();
        for (const idx of usedPath) {
            active.x = idx % 8;
            active.y = Math.floor(idx / 8);

            coopRegistrarEvento({
                tipo: 'move',
                x: active.x,
                y: active.y,
                em: Date.now(),
            });

            if (typeof checkAmulet === 'function') checkAmulet(active, active.x, active.y);
            coopRenderTudo();
            if (isOccupied(active.x, active.y, active.id)) break;
            dealDmg();
            await coopSleep(120);
        }
    } else {
        for (const idx of usedPath) {
            active.x = idx % 8;
            active.y = Math.floor(idx / 8);

            coopRegistrarEvento({
                tipo: 'move',
                x: active.x,
                y: active.y,
                em: Date.now(),
            });

            if (typeof checkAmulet === 'function') checkAmulet(active, active.x, active.y);
            coopRenderTudo();
            if (isOccupied(active.x, active.y, active.id)) break;
            await coopSleep(100);
        }
        if (usedPath.length >= (info.min || 0) && !target.dead) {
            const extra = usedPath.length - (info.min || 0);
            if (heroData.role === 'Arqueiro') {
                if (typeof spawnArrowProjectile === 'function') await spawnArrowProjectile(active, target);
                if (typeof playSfx === 'function') playSfx('atka');
            } else {
                if (typeof spawnProjectile === 'function') await spawnProjectile(active, target, 'Magic');
                if (typeof playSfx === 'function') playSfx('atkm');
            }
            coopApplyDmg(target, totalAtk + extra);

            coopRegistrarEvento({
                tipo: 'attack',
                dmg: totalAtk + extra,
                alvoX: target.x,
                alvoY: target.y,
                em: Date.now(),
            });
        }
    }

    usedPath.forEach(idx => {
        const gridEl = document.getElementById('grid');
        if (gridEl.childNodes[idx] && typeof createTile === 'function') {
            gridEl.replaceChild(createTile(idx), gridEl.childNodes[idx]);
        }
    });

    if (isBravely) {
        if (typeof showBravelyAnimation === 'function') await showBravelyAnimation(active.class);
        if (typeof triggerBravelyChain === 'function') await triggerBravelyChain(active, target, totalAtk);

        coopRegistrarEvento({
            tipo: 'bravely',
            em: Date.now(),
        });
    }

    path = [];
    if (typeof renderPath === 'function') renderPath();

    RANKING.turns++;

    coopRegistrarEvento({
        tipo: 'fim',
        em: Date.now(),
    });

    if (boss.dead && coopProcessandoMorteBoss) {
        coopLog('Boss morreu. Publicação adiada (processando morte).');
        return;
    }

    await coopPublicarEstado();
}

// =================================================================
// 11. APLICAR DANO
// =================================================================
function coopApplyDmg(t, amt) {
    if (t.dead) return;

    t.hp -= amt;
    if (typeof showDmgEffect === 'function') showDmgEffect(t.x, t.y, amt);

    if (t.hp <= 0) {
        t.hp = 0;
        t.dead = true;

        if (t.id !== undefined) {
            const tok = document.getElementById(`tokenP${t.id}`);
            if (tok) tok.classList.add('dead');
        }

        if (t === boss) {
            if (coopEhMeuTurno() && !coopProcessandoMorteBoss) {
                coopProcessarMorteBoss();
            } else {
                coopLog('Boss morreu mas não é minha vez. Ignorando processamento.');
            }
        }
    }

    if (typeof updateVisuals === 'function') updateVisuals();
    if (typeof updateBossCard === 'function') updateBossCard();
    if (typeof updateHeroCard === 'function') updateHeroCard();
}

// =================================================================
// 12. PROCESSA MORTE DO BOSS
// =================================================================
async function coopProcessarMorteBoss() {
    if (coopProcessandoMorteBoss) {
        coopLog('coopProcessarMorteBoss já em execução.');
        return;
    }
    if (coopPartidaConcluida) {
        coopLog('Partida já concluída, ignorando morte do boss.');
        return;
    }

    coopProcessandoMorteBoss = true;
    coopLog('Boss morreu. Verificando se tem próximo...');
    coopLog('  storyEnemiesRemaining:', storyEnemiesRemaining);

    try {
        await coopSleep(800);

        const temProximo = Array.isArray(storyEnemiesRemaining)
                           && storyEnemiesRemaining.length > 1;

        if (temProximo) {
            coopLog('Ainda tem inimigos. Avançando...');

            if (typeof showPurificacao === 'function') {
                try {
                    await showPurificacao(boss.type, boss.x, boss.y, false);
                } catch (e) {
                    console.warn('[coop] Erro na purificação:', e);
                }
            }

            storyEnemiesRemaining.shift();
            storyCurrentEnemyIndex++;

            const proximoId = storyEnemiesRemaining[0];
            const proximoEnemy = STORY_ENEMIES[proximoId];

            if (!proximoEnemy) {
                console.error('[coop] Próximo inimigo não existe:', proximoId);
                return;
            }

            coopLog('Próximo inimigo:', proximoEnemy.name);
            await coopSleep(1000);

            const baseType = (typeof STORY_TO_BASE_BOSS !== 'undefined' && STORY_TO_BASE_BOSS[proximoId])
                ? STORY_TO_BASE_BOSS[proximoId]
                : proximoId.toUpperCase();

            boss.type = baseType;
            boss.hp = proximoEnemy.hp;
            boss.maxHp = proximoEnemy.hp;
            boss.dead = false;
            boss.x = 4;
            boss.y = 0;

            const board = document.getElementById('board');
            if (board) {
                const oldBossToken = document.getElementById('tokenBoss');
                if (oldBossToken) oldBossToken.remove();

                board.querySelectorAll('.token').forEach(el => {
                    if (el.querySelector('#imgBoss') || el.querySelector('#storyBossEmoji')) {
                        el.remove();
                    }
                });

                const tok = document.createElement('div');
                tok.id = 'tokenBoss';
                tok.className = 'token';

                let spriteSrc = coopGetBossSprite(baseType);

                let imgHTML;
                if (spriteSrc) {
                    imgHTML = `<img id="imgBoss" src="${spriteSrc}" class="normal">`;
                } else {
                    const emoji = (typeof EMOJI_STORY !== 'undefined' && EMOJI_STORY[proximoId]) || '?';
                    imgHTML = `<span id="storyBossEmoji" class="story-boss-emoji">${emoji}</span>`;
                }

                tok.innerHTML = `
                    <div class="hp-container"><div id="hpBarBoss" class="hp-bar"></div></div>
                    ${imgHTML}
                `;
                board.appendChild(tok);
            }

            if (typeof updateBossCard === 'function') updateBossCard();
            if (typeof updateHeaderBossName === 'function') updateHeaderBossName();
            if (typeof updateVisuals === 'function') updateVisuals();
            coopRenderTudo();

            await coopPublicarEstado();
            return;
        }

        // Último boss morto — VITÓRIA FINAL
        coopLog('Último inimigo morto. Vitória!');
        coopPartidaConcluida = true;

        await coopSleep(800);

        if (typeof showPurificacao === 'function') {
            try {
                await showPurificacao(boss.type, boss.x, boss.y, true);
            } catch (e) {
                console.warn('[coop] Erro na purificação:', e);
            }
        }

        await coopSleep(1500);

        if (coopRoomId) {
            try {
                await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                    status: 'concluida',
                    vencedor: 'jogadores',
                    'estadoJogo.boss': {
                        x: boss.x, y: boss.y, hp: boss.hp, maxHp: boss.maxHp,
                        type: boss.type, dead: true,
                    },
                    atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
                });
                coopLog('Vitória publicada');
            } catch (e) {
                console.error('[coop] Erro ao publicar vitória:', e);
            }
        }

    } catch (e) {
        console.error('[coop] Erro em coopProcessarMorteBoss:', e);
    } finally {
        coopProcessandoMorteBoss = false;
        coopLog('Flag coopProcessandoMorteBoss liberada.');
    }
}

// =================================================================
// 13. PUBLICAR ESTADO
// =================================================================
async function coopPublicarEstado() {
    if (coopPartidaConcluida) {
        coopLog('Publicação bloqueada: partida concluída');
        return;
    }
    if (!window._coopMode || !coopRole) {
        coopLog('Publicação bloqueada: não estamos em COOP');
        return;
    }

    if (coopPublishingLock) {
        coopLog('Publicação em andamento');
        return;
    }
    coopPublishingLock = true;

    try {
        const estado = coopCapturarEstado();

        if (!coopRoomId) {
            await coopCriarSalaNoFirestore(estado);
            return;
        }

        await coopAtualizarSalaNoFirestore(estado);
    } catch (e) {
        console.error('[coop] Erro ao publicar:', e);
    } finally {
        coopPublishingLock = false;
    }
}

function coopCapturarEstado() {
    return {
        grid: [...grid],
        amulets: [...amulets],
        corruptedTiles: Array.isArray(window._corruptedTiles) ? [...window._corruptedTiles] : [],
        raid: window._raidMode && typeof window.raidCapturarEstadoCoop === 'function'
            ? window.raidCapturarEstadoCoop()
            : null,
        players: players.map(p => ({
            id: p.id, x: p.x, y: p.y, hp: p.hp, maxHp: p.maxHp,
            class: p.class, element: p.element, name: p.name,
            skillUsed: p.skillUsed, dead: p.dead, bonusAtk: p.bonusAtk || 0,
        })),
        boss: {
            x: boss.x, y: boss.y, hp: boss.hp, maxHp: boss.maxHp,
            type: boss.type, dead: boss.dead,
            _corruptedTriggered: boss._corruptedTriggered === true,
        },
    };
}

async function coopCriarSalaNoFirestore(estado) {
    const heroClass = window._coopCriadorHeroClass || 'Tupa';
    const heroData = STORY_HERO_CLASSES[heroClass];

    const eventos = [...coopEventosTurno];

    const roomData = {
        status: 'turno_maria',
        fase: coopFaseId,
        ato: coopAtoId,
        coopContent,
        dificuldade: coopContent?.difficulty
            || (typeof storyCurrentDifficulty !== 'undefined' ? storyCurrentDifficulty : null)
            || STORY_PROGRESS.difficulty
            || 'normal',
        criador: {
            uid: coopUser.uid,
            nome: window._coopCriadorNome,
            heroi: heroData?.displayName || heroClass,
            heroiClass: heroClass,
            saveName: window._coopCriadorSave,
        },
        oponente: null,
        estadoJogo: {
            grid: estado.grid,
            amulets: estado.amulets,
            corruptedTiles: estado.corruptedTiles,
            ...(estado.raid ? { raid: estado.raid } : {}),
            players: estado.players,
            boss: estado.boss,
            turnoDe: 'oponente',
            ultimaAcao: {
                tipo: 'turno_criador',
                resumo: `${window._coopCriadorNome} jogou`,
                em: Date.now(),
            },
            eventosTurno: eventos,
        },
        criadaEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const ref = await fbDb.collection(COOP_ROOMS).add(roomData);
    coopRoomId = ref.id;
    window._coopRoomId = ref.id;

    coopLog('Sala criada:', ref.id, '| eventos:', eventos.length);
    if (typeof showToast === 'function') showToast('🎮', 'Sala publicada!', '🎮');

    coopInstalarListener();
    coopAtualizarUI();

    coopEventosTurno = [];
}

async function coopAtualizarSalaNoFirestore(estado) {
    const bossMorto = estado.boss.dead;
    const todosMortos = estado.players.every(p => p.dead);

    const temProximoInimigo = Array.isArray(storyEnemiesRemaining)
                              && storyEnemiesRemaining.length > 1;

    const eventos = [...coopEventosTurno];

    const update = {
        'estadoJogo.grid': estado.grid,
        'estadoJogo.amulets': estado.amulets,
        'estadoJogo.corruptedTiles': estado.corruptedTiles,
        'estadoJogo.players': estado.players,
        'estadoJogo.boss': estado.boss,
        'estadoJogo.ultimaAcao': {
            tipo: coopRole === 'criador' ? 'turno_criador' : 'turno_maria',
            resumo: `${players[coopMeuIdx()]?.name} jogou`,
            em: Date.now(),
        },
        'estadoJogo.eventosTurno': eventos,
        atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
    };
    if (estado.raid) update['estadoJogo.raid'] = estado.raid;

    // ============ STATUS FINAL ============
    if (todosMortos) {
        update.status = 'concluida';
        update.vencedor = 'boss';
        coopPartidaConcluida = true;
    } else if (bossMorto && !temProximoInimigo) {
        // Último boss morreu — publica vitória SEM sobrescrever estado
        update.status = 'concluida';
        update.vencedor = 'jogadores';
        coopPartidaConcluida = true;
    } else if (bossMorto && temProximoInimigo) {
        // Boss morreu mas tem próximo — coopProcessarMorteBoss cuida disso
        coopLog('Boss morreu mas tem próximo. Ignorando publicação de vitória.');
        coopEventosTurno = [];
        return;
    } else if (coopRole === 'criador') {
        update.status = 'turno_maria';
        update['estadoJogo.turnoDe'] = 'oponente';
    } else {
        update.status = 'turno_boss';
        update['estadoJogo.turnoDe'] = 'boss';
    }

    await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update(update);
    coopLog('Sala atualizada:', update.status, '| eventos:', eventos.length);

    coopEventosTurno = [];

    if (update.status === 'turno_boss' && coopRole === 'oponente') {
        coopLog('Sou o P2. Vou rodar o boss.');
        setTimeout(() => coopRodarBossP2(), 800);
        return;
    }

    if (update.status === 'concluida') {
        coopFinalizar(bossMorto);
        return;
    }

    coopPausar();
}

// =================================================================
// 14. P2 RODA O BOSS
// =================================================================
async function coopRodarBossP2() {
    if (coopRole !== 'oponente') return;
    if (coopBossRunning) return;
    if (!coopRoomId) return;
    if (coopPartidaConcluida) return;
    if (coopEnemyAlreadyDead) {
        coopLog('coopRodarBossP2: inimigo já morto, ignorando.');
        return;
    }

    coopBossRunning = true;
    coopLog('P2 rodando boss...');

    try {
        const doc = await fbDb.collection(COOP_ROOMS).doc(coopRoomId).get();
        if (doc.exists) {
            coopRoomData = { id: doc.id, ...doc.data() };
            coopAplicarEstadoDoRoom(coopRoomData);
        }
    } catch (e) {}

    await coopSleep(500);

    // Snapshot do HP antes
    const hpAntes = players.map(p => ({ id: p.id, hp: p.hp, maxHp: p.maxHp }));
    const bossXAntes = boss.x;
    const bossYAntes = boss.y;

    // Inicia captura
    coopBufferEventosBoss = [];
    coopCapturandoEventosBoss = true;
    coopForcarBoss = true;
    window._coopV82BatchHasApplySkill = false; // Limpa flag de batch
    const isEventoCoop = ['selados', 'nacoes'].includes(coopContent?.type);
    if (isEventoCoop) window._eventoTurnoJogador = false;

    try {
        // Aguarda banner "BOSS ENFURECIDO" sair antes de agir (máx. 4s)
        if (window._bossEnfurecidoAviso) {
            const _inicio = Date.now();
            while (window._bossEnfurecidoAviso && (Date.now() - _inicio) < 4500) {
                await new Promise(r => setTimeout(r, 100));
            }
        }
        if (window._raidMode && window.raidAtual) {
            if (typeof window.raidTurnoBoss !== 'function') {
                throw new Error('A IA da Raid não está disponível durante o turno cooperativo.');
            }
            await window.raidTurnoBoss();
        } else if (typeof storyEnemyAI === 'function') {
            await storyEnemyAI();
        } else if (typeof bossAI === 'function') {
            await bossAI();
        }
    } catch (e) {
        console.error('[coop] Erro na IA:', e);
    } finally {
        if (isEventoCoop) window._eventoTurnoJogador = true;
    }

    coopForcarBoss = false;
    coopCapturandoEventosBoss = false;

    await coopSleep(500);

    // Se boss morreu durante o turno
    if (boss.dead) {
        coopLog('Boss morreu durante o turno do P2.');
        coopEnemyAlreadyDead = true;

        // Se ainda não processou a morte, processa agora
        if (!coopProcessandoMorteBoss && !coopPartidaConcluida) {
            coopLog('Processando morte do boss após turno do P2.');
            await coopProcessarMorteBoss();
        }

        coopBossRunning = false;
        return;
    }

    // Verifica movimento final
    if (boss.x !== bossXAntes || boss.y !== bossYAntes) {
        const jaTemMovimentoFinal = coopBufferEventosBoss.some(
            e => e.tipo === 'boss_move' && e.x === boss.x && e.y === boss.y
        );
        if (!jaTemMovimentoFinal) {
            coopBufferEventosBoss.push({
                tipo: 'boss_move',
                x: boss.x,
                y: boss.y,
                uid: coopMeuUid(),
                role: coopRole,
                em: Date.now(),
            });
        }
    }

    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg')?.value) || 4;

    // Fallback conservador: só aplica dano se dist <= 1 E se a skill não aplicou
    players.forEach((p, i) => {
        if (p.dead) return;
        const antes = hpAntes[i];
        if (!antes) return;
        const hpMudou = p.hp < antes.hp;
        if (hpMudou) {
            coopLog(`${p.name} já recebeu dano da IA (${antes.hp} → ${p.hp})`);
            return;
        }
        const dist = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (dist <= 1) {
            p.hp = Math.max(0, p.hp - bossAtk);
            if (typeof showDmgEffect === 'function') showDmgEffect(p.x, p.y, bossAtk);
            coopLog(`Fallback: dano ${bossAtk} em ${p.name} (dist ${dist})`);
            if (p.hp <= 0) {
                p.dead = true;
                const tok = document.getElementById(`tokenP${i}`);
                if (tok) tok.classList.add('dead');
            }
        }
    });

    if (typeof updateVisuals === 'function') updateVisuals();
    if (typeof updateHeroCard === 'function') updateHeroCard();

    const estado = coopCapturarEstado();
    const todosMortos = estado.players.every(p => p.dead);
    const temProximoInimigo = Array.isArray(storyEnemiesRemaining)
                              && storyEnemiesRemaining.length > 1;

    // Eventos de ataque do boss
    const eventosBoss = [...coopBufferEventosBoss];
    players.forEach((p, i) => {
        const antes = hpAntes[i];
        if (!antes) return;
        const dmgTomado = antes.hp - p.hp;
        if (dmgTomado > 0) {
            eventosBoss.push({
                tipo: 'boss_attack',
                alvoId: p.id,
                alvoX: p.x,
                alvoY: p.y,
                dmg: dmgTomado,
                uid: coopMeuUid(),
                role: coopRole,
                em: Date.now(),
            });
        }
    });

    const update = {
        'estadoJogo.grid': estado.grid,
        'estadoJogo.amulets': estado.amulets,
        'estadoJogo.corruptedTiles': estado.corruptedTiles,
        'estadoJogo.players': estado.players,
        'estadoJogo.boss': estado.boss,
        'estadoJogo.ultimaAcao': {
            tipo: 'turno_boss',
            resumo: 'Boss atacou',
            em: Date.now(),
        },
        'estadoJogo.eventosTurno': eventosBoss,
        atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (todosMortos) {
        update.status = 'concluida';
        update.vencedor = 'boss';
        coopPartidaConcluida = true;
    } else {
        update.status = 'turno_joao';
        update['estadoJogo.turnoDe'] = 'criador';
    }

    await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update(update);
    coopLog('Boss rodou (pelo P2). Status:', update.status, '| eventos:', eventosBoss.length);

    coopBossRunning = false;

    if (update.status === 'concluida') {
        coopFinalizar(false);
    } else {
        coopPausar();
    }
}

// =================================================================
// 15. APLICAR ESTADO DO ROOM
// =================================================================
function coopAplicarEstadoDoRoom(room) {
    if (!room?.estadoJogo) return;

    if (room.estadoJogo.grid) {
        for (let i = 0; i < 64; i++) {
            if (room.estadoJogo.grid[i]) grid[i] = room.estadoJogo.grid[i];
            const tile = document.querySelectorAll('#grid .tile')[i];
            if (tile) {
                tile.className = `tile bg-${grid[i]}`;
                if (room.estadoJogo.amulets?.[i]) {
                    tile.innerHTML = `<img src="${SPRITES.Muiraquita}" class="amulet-img">`;
                } else {
                    tile.innerHTML = '';
                }
            }
        }
        if (room.estadoJogo.amulets) {
            amulets.length = 0;
            room.estadoJogo.amulets.forEach(a => amulets.push(a));
        }
    }

    if (room.estadoJogo.boss) {
        const bt = coopBossTypeNormalize(room.estadoJogo.boss.type);
        const tipoMudou = boss.type !== bt;

        Object.assign(boss, room.estadoJogo.boss);
        boss.type = bt;

        if (tipoMudou) {
            coopLog('[coop] Tipo do boss mudou:', bt);
            const sprite = coopGetBossSprite(bt);
            const img = document.getElementById('imgBoss');
            if (img && sprite) {
                img.src = sprite;
                img.style.display = '';
            }
            const emoji = document.getElementById('storyBossEmoji');
            if (emoji) emoji.remove();

            const idFromBoss = coopBossTypeToEnemyId(bt);
            if (Array.isArray(storyEnemiesRemaining) && storyEnemiesRemaining.length > 0) {
                if (storyEnemiesRemaining[0] !== idFromBoss) {
                    console.log('[coop] Sincronizando fila:', storyEnemiesRemaining[0], '→', idFromBoss);
                    storyEnemiesRemaining[0] = idFromBoss;
                }
            }

        }

        if (Array.isArray(room.estadoJogo.corruptedTiles)) {
            window._corruptedTiles = [...new Set(room.estadoJogo.corruptedTiles
                .filter(idx => Number.isInteger(idx) && idx >= 0 && idx < 64))];
            const tiles = document.querySelectorAll('#grid .tile');
            tiles.forEach(tile => {
                tile.classList.remove('tile-corrupted');
                tile.querySelector('.corruption-fx')?.remove();
            });
            window._corruptedTiles.forEach(idx => {
                const tile = tiles[idx];
                if (!tile) return;
                tile.classList.add('tile-corrupted');
                tile.innerHTML = '<div class="corruption-fx"></div>';
            });
        }
    }

    if (room.estadoJogo.players && players.length >= 2) {
        room.estadoJogo.players.forEach((pData, i) => {
            if (players[i]) {
                players[i].x = pData.x;
                players[i].y = pData.y;
                players[i].hp = pData.hp;
                players[i].maxHp = pData.maxHp;
                players[i].dead = pData.dead;

                const tok = document.getElementById(`tokenP${i}`);
                if (tok) {
                    if (pData.dead) tok.classList.add('dead');
                    else tok.classList.remove('dead');
                }
            }
        });
    }

    coopRenderTudo();

    if (room.coopContent?.type === 'raid-regional'
        && room.estadoJogo.raid
        && typeof window.raidAplicarEstadoCoop === 'function') {
        window.raidAplicarEstadoCoop(room.estadoJogo.raid);
    }
}

// =================================================================
// 16. REPLAY DE EVENTOS
// =================================================================
async function coopReproduzirEventos(eventos) {
    if (!eventos || eventos.length === 0) return;
    if (coopReplayRodando) return;

    const meuUid = coopMeuUid();
    const eventosOutros = eventos.filter(e => {
        if (e.uid && e.uid !== meuUid) return true;
        if (e.role && e.role !== coopRole) return true;
        return false;
    });

    if (eventosOutros.length === 0) {
        coopLog('Nenhum evento do outro jogador. Ignorando replay.');
        return;
    }

    coopReplayRodando = true;
    coopLog('Reproduzindo', eventosOutros.length, 'eventos do outro');

    const gridEl = document.getElementById('grid');
    if (gridEl) gridEl.style.pointerEvents = 'none';

    const banner = document.getElementById('coopBanner');
    if (banner) {
        banner.innerHTML = `
            <span class="coop-banner-icon">🎬</span>
            <span class="coop-banner-text">REPRODUZINDO AÇÃO DO OPONENTE</span>
            <span class="coop-banner-hint">Aguarde...</span>
        `;
        banner.classList.add('waiting');
        banner.classList.remove('active');
    }

    // Desativa captura durante replay (evita loop)
    const tempCaptura = coopCapturandoEventosBoss;
    coopCapturandoEventosBoss = false;

    try {
        for (const evento of eventosOutros) {
            if (!window._coopMode) break;
            try {
                await coopReproduzirEventoIndividual(evento);
            } catch (e) {
                console.warn('[coop] Erro no replay:', evento.tipo, e);
            }
        }
    } finally {
        coopCapturandoEventosBoss = tempCaptura;
        if (gridEl) gridEl.style.pointerEvents = '';
        coopReplayRodando = false;
        coopLog('Replay finalizado.');
    }
}

async function coopReproduzirEventoIndividual(evento) {
    switch (evento.tipo) {
        case 'move': {
            const idx = evento.role === 'criador' ? 0 : 1;
            const token = document.getElementById(`tokenP${idx}`);
            if (token) {
                const s = (typeof getStep === 'function') ? getStep() : 59;
                token.style.transition = 'left 0.15s, top 0.15s';
                token.style.left = (evento.x * s + 8) + 'px';
                token.style.top = (evento.y * s + 8) + 'px';
            }
            await coopSleep(150);
            break;
        }

        case 'boss_move': {
            const bossToken = document.getElementById('tokenBoss');
            if (bossToken) {
                const s = (typeof getStep === 'function') ? getStep() : 59;
                bossToken.style.transition = 'left 0.2s, top 0.2s';
                bossToken.style.left = (evento.x * s + 8) + 'px';
                bossToken.style.top = (evento.y * s + 8) + 'px';
            }
            await coopSleep(200);
            break;
        }

        case 'attack': {
            if (typeof showDmgEffect === 'function') {
                showDmgEffect(evento.alvoX, evento.alvoY, evento.dmg);
            }
            if (typeof spawnSwordEffect === 'function') {
                spawnSwordEffect(evento.alvoX, evento.alvoY);
            }
            await coopSleep(300);
            break;
        }

        case 'boss_attack': {
            if (typeof showDmgEffect === 'function') {
                showDmgEffect(evento.alvoX, evento.alvoY, evento.dmg);
            }
            await coopSleep(300);
            break;
        }

        // ⭐ SKILLS DO BOSS — reproduz via handler do historia.js
        case 'boss_skill': {
            const skillName = evento.skillName || evento.skill;
            const handlerKey = evento.skill;
            let reproduzido = false;

        // ATK real capturado (handlers de nação usam enemy.atk)
        const atkReplay = Number(evento.enemyAtk) > 0 ? Number(evento.enemyAtk)
                : (typeof STORY_ENEMIES !== 'undefined' && STORY_ENEMIES[evento.enemyId]?.atk) || 4;
        const enemyMock = {
                id: evento.enemyId,
                nome: evento.enemyNome
                    || (typeof STORY_ENEMIES !== 'undefined' && STORY_ENEMIES[evento.enemyId]?.name)
                    || 'Boss',
                name: evento.enemyNome
                    || (typeof STORY_ENEMIES !== 'undefined' && STORY_ENEMIES[evento.enemyId]?.name)
                    || 'Boss',
                atk: atkReplay,
        };

        // 1. Handlers de nação (coop Sete Nações)
        if (!reproduzido && handlerKey && String(handlerKey).startsWith('nacao_')
                && typeof window.NACAO_SKILL_HANDLERS !== 'undefined'
                && typeof window.NACAO_SKILL_HANDLERS[handlerKey] === 'function') {
                try {
                    const skillMock = { nome: skillName, name: skillName, handler: handlerKey };
                    console.log('[coop] Reproduzindo skill de NAÇÃO:', skillName);
                    await window.NACAO_SKILL_HANDLERS[handlerKey](enemyMock, skillMock);
                    reproduzido = true;
                } catch (e) {
                    console.warn('[coop] Falha ao reproduzir skill de nação:', skillName, e);
                }
        }

        // 1b. Handlers de evento (Sete Selados)
        if (!reproduzido && handlerKey && String(handlerKey).startsWith('evento_')
                && typeof window.EVENTO_SKILLS !== 'undefined'
                && typeof window.EVENTO_SKILLS[handlerKey] === 'function') {
                try {
                    const skillMock = { nome: skillName, name: skillName, handler: handlerKey,
                        danoBase: atkReplay, dano: atkReplay };
                    console.log('[coop] Reproduzindo skill de EVENTO:', skillName);
                    await window.EVENTO_SKILLS[handlerKey](enemyMock, skillMock);
                    reproduzido = true;
                } catch (e) {
                    console.warn('[coop] Falha ao reproduzir skill de evento:', skillName, e);
                }
        }

        // 2. Tenta pelo STORY_ANIMAL_SKILLS (handlers reais)
        if (!reproduzido && typeof STORY_ANIMAL_SKILLS !== 'undefined' &&
                STORY_ANIMAL_SKILLS[handlerKey]) {
                try {
                    const handler = STORY_ANIMAL_SKILLS[handlerKey];
                    const skillMock = { name: skillName, handler: handlerKey };
                    console.log('[coop] Reproduzindo skill:', skillName);
                    await handler(enemyMock, skillMock);
                    reproduzido = true;
                } catch (e) {
                    console.warn('[coop] Falha ao reproduzir skill:', skillName, e);
                }
        }

        // 3. Fallback: chama função global
            if (!reproduzido && typeof window[handlerKey] === 'function') {
                try {
                    window[handlerKey].apply(window, evento.argsRaw || []);
                    reproduzido = true;
                } catch (e) {
                    console.warn('[coop] Fallback window[] falhou:', handlerKey, e);
                }
            }

            if (!reproduzido) {
                console.warn('[coop] Skill não reproduzida:', skillName);
            }

            await coopSleep(600);
            break;
        }

        case 'skill': {
            const tile = document.querySelectorAll('#grid .tile')[evento.y * 8 + evento.x];
            if (tile) {
                tile.classList.add('coop-skill-flash');
                setTimeout(() => tile.classList.remove('coop-skill-flash'), 500);
            }
            await coopSleep(400);
            break;
        }

        case 'bravely': {
            if (typeof showPoderAncestralEffect === 'function') {
                showPoderAncestralEffect();
            }
            await coopSleep(1000);
            break;
        }

        case 'fim': {
            await coopSleep(200);
            break;
        }

        default:
            break;
    }
}

// =================================================================
// 17. LISTENER
// =================================================================
function coopInstalarListener() {
    if (!coopRoomId) return;
    if (coopListenerUnsub) {
        coopListenerUnsub();
        coopListenerUnsub = null;
    }

    coopLog('Instalando listener da sala', coopRoomId);

    let ultimoEventoHash = '';

    coopListenerUnsub = fbDb.collection(COOP_ROOMS).doc(coopRoomId)
        .onSnapshot(async doc => {
            if (!doc.exists) {
                if (window._coopMode) {
                    uiAviso('⚠️ A sala foi cancelada.');
                    coopSairParaAldeia();
                }
                return;
            }

            const data = doc.data();
            coopRoomData = { id: doc.id, ...data };

            if (!window._coopMode) return;

            if (data.status === 'cancelada') {
                uiAviso('⚠️ O criador cancelou a partida.');
                coopSairParaAldeia();
                return;
            }

            if (data.status === 'pausada') {
                coopPausar();
                return;
            }

            if (data.status === 'concluida') {
                if (!coopFinalizando && !coopReplayRodando) {
                    setTimeout(() => coopFinalizar(data.vencedor === 'jogadores'), 500);
                }
                return;
            }

            if (coopRole === 'criador' && data.oponente?.heroiClass && !coopP1Atualizado) {
                coopP1Atualizado = true;
                if (players[1]) {
                    players[1].class = data.oponente.heroiClass;
                    players[1].name = data.oponente.nome;
                    players[1].placeholder = false;
                    players[1].maxHp = STORY_HERO_CLASSES[data.oponente.heroiClass]?.hp || 16;
                    players[1].hp = players[1].maxHp;

                    const board = document.getElementById('board');
                    const oldTok = document.getElementById('tokenP1');
                    if (oldTok) oldTok.remove();
                    if (board) {
                        const tok = document.createElement('div');
                        tok.id = 'tokenP1';
                        tok.className = 'token p-hue-1';
                        tok.innerHTML = `
                            <div class="hp-container"><div id="hpBarP1" class="hp-bar"></div></div>
                            <img id="imgP1" src="${SPRITES[players[1].class]}" class="normal">
                        `;
                        board.appendChild(tok);
                    }
                }
                coopRenderTudo();
                if (typeof showToast === 'function') showToast('🎮', `${data.oponente.nome} entrou!`, '🎮');
            }

            const turnoDe = data.estadoJogo?.turnoDe;
            const meuTurnoDe = coopRole === 'criador' ? 'criador' : 'oponente';
            const meuTurno = turnoDe === meuTurnoDe;

            // Sincroniza fila
            if (data.estadoJogo?.boss?.type) {
                const bt = coopBossTypeNormalize(data.estadoJogo.boss.type);
                const idFromBoss = coopBossTypeToEnemyId(bt);
                if (Array.isArray(storyEnemiesRemaining) && storyEnemiesRemaining.length > 0) {
                    if (storyEnemiesRemaining[0] !== idFromBoss) {
                        console.log('[coop] Sincronizando fila:', storyEnemiesRemaining[0], '→', idFromBoss);
                        storyEnemiesRemaining[0] = idFromBoss;
                    }
                }
            }

            // Reproduz eventos
            const eventos = data.estadoJogo?.eventosTurno || [];
            const eventosHash = JSON.stringify(eventos);

            if (eventos.length > 0 && eventosHash !== ultimoEventoHash && !coopReplayRodando) {
                ultimoEventoHash = eventosHash;
                const meuUid = coopMeuUid();
                const eventosOutros = eventos.filter(e => e.uid && e.uid !== meuUid);
                if (eventosOutros.length > 0) {
                    await coopReproduzirEventos(eventos);
                }
            }

            const meuIdx = coopMeuIdx();
            const meuHeroiMorto = players[meuIdx]?.dead;

            if (meuHeroiMorto) {
                coopLog('Meu herói morreu. Pulando meu turno automaticamente.');
            }

            if (meuTurno && !meuHeroiMorto) {
                coopLog('É meu turno');
                coopAplicarEstadoDoRoom(data);

                const ua = data.estadoJogo?.ultimaAcao;
                if (ua && ua.resumo) {
                    const outroNome = coopRole === 'criador'
                        ? data.oponente?.nome : data.criador?.nome;
                    coopMostrarResumoAcao(ua.resumo, outroNome);
                }

                setTimeout(() => {
                    coopDesbloquear();
                }, 500);
            } else {
                coopPausar();
            }
        }, err => console.warn('[coop] Erro no listener:', err));
}

// =================================================================
// 18. UI
// =================================================================
function coopInjetarUI() {
    const header = document.querySelector('.game-title');
    if (header && !header.querySelector('.coop-badge')) {
        const badge = document.createElement('span');
        badge.className = 'coop-badge';
        badge.id = 'coopBadge';
        badge.textContent = coopRole === 'criador' ? '🎮 COOP · Criador' : '🎮 COOP · Oponente';
        header.appendChild(badge);
    }

    const acoes = document.querySelector('.game-header-actions');
    if (acoes && !acoes.querySelector('.coop-sair-btn')) {
        const btn = document.createElement('button');
        btn.className = 'coop-sair-btn';
        btn.innerHTML = '🚪 SAIR';
        btn.onclick = async () => {
            if (await uiConfirm('Sair da sala? A partida fica pausada.')) coopSairParaAldeia();
        };
        acoes.insertBefore(btn, acoes.firstChild);
    }

    const main = document.querySelector('.game-main');
    if (main && !document.getElementById('coopBanner')) {
        const banner = document.createElement('div');
        banner.id = 'coopBanner';
        banner.className = 'coop-banner';
        main.parentNode.insertBefore(banner, main);
    }

    coopAtualizarUI();
}

function coopAtualizarUI() {
    const banner = document.getElementById('coopBanner');
    if (!banner) return;
    if (coopReplayRodando) return;

    const meuIdx = coopMeuIdx();
    const meuHeroiMorto = players && players[meuIdx]?.dead;

    if (meuHeroiMorto) {
        banner.innerHTML = `
            <span class="coop-banner-icon">💀</span>
            <span class="coop-banner-text">VOCÊ MORREU</span>
            <span class="coop-banner-hint">Aguardando o oponente terminar</span>
        `;
        banner.classList.add('waiting');
        banner.classList.remove('active');
        return;
    }

    if (!coopEhMeuTurno()) {
        const outro = coopRole === 'criador'
            ? (coopRoomData?.oponente?.nome || 'oponente')
            : (coopRoomData?.criador?.nome || 'criador');
        banner.innerHTML = `
            <span class="coop-banner-icon">⏳</span>
            <span class="coop-banner-text">AGUARDANDO ${outro.toUpperCase()}</span>
            <span class="coop-banner-hint">Você pode sair e voltar depois</span>
        `;
        banner.classList.add('waiting');
        banner.classList.remove('active');
    } else {
        banner.innerHTML = `
            <span class="coop-banner-icon">🎯</span>
            <span class="coop-banner-text">SEU TURNO</span>
            <span class="coop-banner-hint">Jogue seu turno e clique em "JOGAR TURNO"</span>
        `;
        banner.classList.add('active');
        banner.classList.remove('waiting');
    }
}

function coopMostrarResumoAcao(resumo, quem) {
    if (!resumo) return;

    const old = document.getElementById('coopResumo');
    if (old) old.remove();

    const el = document.createElement('div');
    el.id = 'coopResumo';
    el.className = 'coop-resumo';
    el.innerHTML = `
        <span class="coop-resumo-icon">📢</span>
        <div>
            <div class="coop-resumo-quem">${quem || 'Oponente'} jogou</div>
            <div class="coop-resumo-texto">${resumo}</div>
        </div>
    `;

    const main = document.querySelector('.game-main');
    if (main) main.parentNode.insertBefore(el, main);

    setTimeout(() => {
        el.style.transition = 'opacity 0.5s';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 500);
    }, 4000);
}

function coopHabilitarBotoes() {
    const btnPlay = document.getElementById('btnPlay');
    const btnSkill = document.getElementById('btnSkill');
    const meuIdx = coopMeuIdx();
    const p = players[meuIdx];

    if (p && p.dead) {
        if (btnPlay) btnPlay.disabled = true;
        if (btnSkill) btnSkill.disabled = true;
        return;
    }

    if (btnPlay) btnPlay.disabled = false;
    if (btnSkill) {
        if (p && !p.skillUsed) btnSkill.disabled = false;
    }
}

function coopDesbloquear() {
    if (coopReplayRodando) return;

    const meuIdx = coopMeuIdx();
    const p = players[meuIdx];

    if (p && p.dead) {
        coopAtualizarUI();
        return;
    }

    window.currentPlayerIdx = meuIdx;
    window.editingIdx = meuIdx;

    const ov = document.getElementById('coopOverlay');
    if (ov) ov.remove();

    const gridEl = document.getElementById('grid');
    if (gridEl) {
        gridEl.style.pointerEvents = '';
        gridEl.style.opacity = '';
    }

    coopHabilitarBotoes();
    coopAtualizarUI();
}

function coopPausar() {
    if (coopReplayRodando) return;

    const btnPlay = document.getElementById('btnPlay');
    const btnSkill = document.getElementById('btnSkill');
    if (btnPlay) btnPlay.disabled = true;
    if (btnSkill) btnSkill.disabled = true;

    const gridEl = document.getElementById('grid');
    if (gridEl) gridEl.style.pointerEvents = 'none';

    coopAtualizarUI();
}

function coopEhMeuTurno() {
    if (!coopRoomData) return true;
    const turnoDe = coopRoomData.estadoJogo?.turnoDe;
    if (!turnoDe) return true;
    const meuTurnoDe = coopRole === 'criador' ? 'criador' : 'oponente';
    return turnoDe === meuTurnoDe;
}

// =================================================================
// 19. SAIR / VOLTAR / CANCELAR
// =================================================================
async function coopSairParaAldeia() {
    const leavingContent = coopContent;
    if (typeof stopAllAudio === 'function') {
        try { stopAllAudio(); } catch(e) {}
    }

    if (coopRoomId && coopRole === 'criador' && !coopPartidaConcluida) {
        try {
            await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                status: 'pausada',
                atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
            });
        } catch (e) {}
    }

    if (['selados', 'nacoes'].includes(leavingContent?.type)
        && typeof window.eventoFinalizarPartida === 'function') {
        await window.eventoFinalizarPartida(false, true);
        window._eventoMode = false;
        window._eventoAtual = null;
        if (window._eventoBatalha) window._eventoBatalha.ativa = false;
        if (leavingContent.type === 'nacoes') {
            window._nacaoAtivo = false;
            window._nacaoBatalha = { ativa: false };
        }
    } else if (leavingContent?.type === 'raid-regional'
        && typeof window.raidLimparEstado === 'function') {
        window.raidLimparEstado();
        window._regionalRaidContext = false;
        ['raidBadge', 'raidBanner', 'raidResumo'].forEach(id => {
            document.getElementById(id)?.remove();
        });
        document.querySelectorAll('.raid-sair-btn, .raid-salas-btn').forEach(element => element.remove());
    }

    window._coopMode = false;
    window._coopContent = null;
    coopContent = null;
    coopRole = null;
    window._coopRole = null;
    coopRoomId = null;
    coopRoomData = null;
    window._coopRoomId = null;
    coopEventosTurno = [];
    coopReplayRodando = false;
    coopBufferEventosBoss = [];
    coopCapturandoEventosBoss = false;
    coopEnemyAlreadyDead = false;

    if (coopListenerUnsub) {
        coopListenerUnsub();
        coopListenerUnsub = null;
    }

    ['coopBanner', 'coopOverlay', 'coopResumo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
    const badge = document.getElementById('coopBadge');
    if (badge) badge.remove();
    const btn = document.querySelector('.coop-sair-btn');
    if (btn) btn.remove();

    const gridEl = document.getElementById('grid');
    if (gridEl) {
        gridEl.style.pointerEvents = '';
        gridEl.style.opacity = '';
    }

    if (typeof showStoryScreen === 'function') {
        showStoryScreen();
        setTimeout(() => {
            if (typeof renderAldeiaScreen === 'function') renderAldeiaScreen();
        }, 100);
    }
}

async function coopContinuarSala(roomId) {
    if (!coopUser) {
        const ok = await coopInit();
        if (!ok) return;
    }

    let room;
    try {
        const doc = await fbDb.collection(COOP_ROOMS).doc(roomId).get();
        if (!doc.exists) {
            uiAviso('Sala não encontrada.');
            return;
        }
        room = { id: doc.id, ...doc.data() };
    } catch (e) {
        uiAviso('Erro: ' + e.message);
        return;
    }

    const isCriador = room.criador?.uid === coopUser.uid;
    const isOponente = room.oponente?.uid === coopUser.uid;

    if (!isCriador && !isOponente) {
        uiAviso('Você não participa desta sala.');
        return;
    }

    if (room.status === 'pausada') {
        try {
            const turnoDe = room.estadoJogo?.turnoDe || 'criador';
            const novoStatus = turnoDe === 'oponente' ? 'turno_maria'
                            : turnoDe === 'boss' ? 'turno_boss'
                            : 'turno_joao';
            await fbDb.collection(COOP_ROOMS).doc(roomId).update({
                status: novoStatus,
                atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
            });
            room.status = novoStatus;
        } catch (e) {}
    }

    window._coopMode = true;
    coopContent = room.coopContent || null;
    window._coopContent = coopContent;
    coopRole = isCriador ? 'criador' : 'oponente';
    window._coopRole = coopRole;
    coopRoomId = roomId;
    coopRoomData = room;
    coopFaseId = room.fase;
    coopAtoId = room.ato;
    coopP1Atualizado = !!room.oponente?.heroiClass;
    coopFinalizando = false;
    coopProcessandoMorteBoss = false;
    coopPartidaConcluida = false;
    coopEventosTurno = [];
    coopReplayRodando = false;
    coopBufferEventosBoss = [];
    coopCapturandoEventosBoss = false;
    coopEnemyAlreadyDead = false;

    window._coopCriadorHeroClass = room.criador.heroiClass;
    window._coopOponenteHeroClass = room.oponente?.heroiClass;
    window._coopCriadorNome = room.criador.nome;
    window._coopOponenteNome = room.oponente?.nome;

    coopFecharPainel();
    document.querySelectorAll('#storyScreen, #titleScreen, #modeScreen, #playersScreen, #challengeScreen, #configScreen, #tutorialScreen').forEach(el => {
        if (el) el.style.display = 'none';
    });
    const ss = document.getElementById('storyScreen');
    if (ss) ss.classList.remove('active');

    const _origInitGame = window.initGame;
    window.initGame = async function() {
        await _origInitGame.apply(this, arguments);
        window.initGame = _origInitGame;
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        coopRebuildPlayers();
        coopInstalarListener();
        setTimeout(() => coopInjetarUI(), 500);
    };

    await coopIniciarConteudo(coopContent, { resume: true });
}

async function coopCancelarSala(roomId) {
    if (!(await uiConfirm('Cancelar e deletar esta partida?\n\nO oponente será avisado.'))) return;

    try {
        await fbDb.collection(COOP_ROOMS).doc(roomId).update({
            status: 'cancelada',
            atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
        });
        await coopSleep(1000);
        await fbDb.collection(COOP_ROOMS).doc(roomId).delete();

        coopLog('Sala cancelada');
        if (typeof showToast === 'function') showToast('🗑️', 'Partida cancelada.', '🗑️');

        coopFecharPainel();
        setTimeout(() => coopAbrirPainel(), 300);
    } catch (e) {
        uiAviso('Erro ao cancelar: ' + e.message);
    }
}

// =================================================================
// 20. FINALIZAR PARTIDA
// =================================================================
async function coopFinalizar(vitoria) {
    if (coopFinalizando) return;
    coopFinalizando = true;
    coopPartidaConcluida = true;

    if (typeof stopAllAudio === 'function') {
        try { stopAllAudio(); } catch(e) {}
    }

    let tentativas = 0;
    while (coopReplayRodando && tentativas < 20) {
        await coopSleep(200);
        tentativas++;
    }

    await coopSleep(2000);

    if (coopListenerUnsub) {
        coopListenerUnsub();
        coopListenerUnsub = null;
    }

    const conteudoConcluido = coopContent;

    // ⭐ FIX sala fantasma: garante que a sala seja marcada como concluída
    // (em coop de eventos, o motor cuida da tela mas a sala ficava aberta)
    if (coopRoomId && typeof fbDb !== 'undefined') {
        try {
            await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                status: 'concluida',
                vencedor: vitoria ? 'jogadores' : 'boss',
                atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
            });
            coopLog('Sala marcada como concluída.');
        } catch (e) {
            console.warn('[coop] Falha ao marcar sala concluída:', e);
        }
    }

    const finalizarPeloMotorEvento = ['selados', 'nacoes'].includes(conteudoConcluido?.type)
        && typeof window.eventoFinalizarPartida === 'function';
    const finalizarPeloMotorRaid = conteudoConcluido?.type === 'raid-regional'
        && typeof window.raidMostrarTelaFinal === 'function';
    if (finalizarPeloMotorEvento && typeof window.eventoFinalizarPartida === 'function') {
        await window.eventoFinalizarPartida(vitoria, false);
        window._eventoMode = false;
        window._eventoAtual = null;
        if (window._eventoBatalha) window._eventoBatalha.ativa = false;
        if (conteudoConcluido.type === 'nacoes') {
            window._nacaoAtivo = false;
            window._nacaoBatalha = { ativa: false };
        }
    }

    let msg = '';
    if (!finalizarPeloMotorEvento && !finalizarPeloMotorRaid && vitoria && coopFaseId) {
        const ch = STORY_CHAPTERS[parseInt(coopAtoId)];
        const ph = ch?.phases.find(p => p.id === coopFaseId);
        if (ph?.reward) {
            const xp = Math.ceil(ph.reward.xp * 0.5);
            const gold = Math.ceil(ph.reward.gold * 0.5);
            STORY_PROGRESS.totalXP = (STORY_PROGRESS.totalXP || 0) + xp;
            STORY_PROGRESS.gold = (STORY_PROGRESS.gold || 0) + gold;
            if (!STORY_PROGRESS.completedPhases.includes(coopFaseId)) {
                STORY_PROGRESS.completedPhases.push(coopFaseId);
            }
            if (!STORY_PROGRESS.phasesEverCompleted.includes(coopFaseId)) {
                STORY_PROGRESS.phasesEverCompleted.push(coopFaseId);
            }
            saveStoryProgress();
            msg = `\n\n💰 Recompensa COOP (50%):\n+${xp} XP\n+${gold} ouro`;
        }
    }

    if (!finalizarPeloMotorEvento && !finalizarPeloMotorRaid) {
        uiAviso(vitoria
            ? `🏆 VITÓRIA COOP!${msg}\n\nVoltando à Aldeia.`
            : `💀 DERROTA COOP...\n\nVoltando à Aldeia.`);
    }

    window._coopMode = false;
    window._coopContent = null;
    coopContent = null;
    coopRole = null;
    coopRoomId = null;
    coopRoomData = null;
    window._coopRole = null;
    window._coopRoomId = null;
    coopFinalizando = false;
    coopEventosTurno = [];
    coopReplayRodando = false;
    coopBufferEventosBoss = [];
    coopCapturandoEventosBoss = false;
    coopEnemyAlreadyDead = false;

    ['coopBanner', 'coopOverlay', 'coopResumo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
    const badge = document.getElementById('coopBadge');
    if (badge) badge.remove();
    const btn = document.querySelector('.coop-sair-btn');
    if (btn) btn.remove();

    if (finalizarPeloMotorRaid) {
        const cfg = window.raidGetConfig(conteudoConcluido.raidId);
        window.raidMostrarTelaFinal(vitoria, cfg, []);
    } else if (!finalizarPeloMotorEvento && typeof showStoryScreen === 'function') {
        showStoryScreen();
        setTimeout(() => {
            if (typeof renderAldeiaScreen === 'function') renderAldeiaScreen();
        }, 100);
    }
}

// =================================================================
// 21. HOOK PARA CAPTURAR MOVIMENTO DO BOSS
// =================================================================
(function hookCapturaMovimentoBoss() {
    const check = setInterval(() => {
        if (typeof window.updateVisuals !== 'function') return;
        clearInterval(check);
        if (window._coopCapturaBoss) return;
        window._coopCapturaBoss = true;

        const _origUpdate = window.updateVisuals;
        let ultimoBossX = null;
        let ultimoBossY = null;

        window.updateVisuals = function() {
            const r = _origUpdate.apply(this, arguments);

            if (coopCapturandoEventosBoss && window._coopMode && boss) {
                if (ultimoBossX !== boss.x || ultimoBossY !== boss.y) {
                    if (ultimoBossX !== null) {
                        coopBufferEventosBoss.push({
                            tipo: 'boss_move',
                            x: boss.x,
                            y: boss.y,
                            uid: coopMeuUid(),
                            role: coopRole,
                            em: Date.now(),
                        });
                    }
                    ultimoBossX = boss.x;
                    ultimoBossY = boss.y;
                }
            } else {
                ultimoBossX = boss?.x ?? null;
                ultimoBossY = boss?.y ?? null;
            }

            return r;
        };

        console.log('✅ [V8.5] Hook de captura de movimento do boss instalado.');
    }, 200);
})();

// =================================================================
// 22. HOOK EM applyStorySkill (captura ÚNICA de skills do boss)
// =================================================================
(function hookApplyStorySkill() {
    const check = setInterval(() => {
        if (typeof window.applyStorySkill !== 'function') return;
        clearInterval(check);
        if (window._coopApplySkillHook) return;
        window._coopApplySkillHook = true;

        const _origApply = window.applyStorySkill;

        window.applyStorySkill = async function(enemy, skill) {
            // ⭐ FIX: captura duplicada removida. O hook V8.8 (mais abaixo)
            // já captura com snapshot completo — capturar aqui também gerava
            // DOIS eventos boss_skill por skill, e o primeiro (sem snapshot)
            // era reproduzido no estado errado (direção do rolinho errada,
            // FX em tiles errados etc.). Só captura se o V8.8 não existir.
            if (coopCapturandoEventosBoss && window._coopMode && skill && !window._coopV88ApplyHook) {
                coopBufferEventosBoss.push({
                    tipo: 'boss_skill',
                    skill: skill.handler || skill.name,
                    skillName: skill.name || '',
                    enemyId: enemy ? enemy.id : null,
                    enemyNome: enemy ? (enemy.name || enemy.nome) : '',
                    enemyAtk: enemy ? (Number(enemy.atk) || 4) : 4,
                    uid: coopMeuUid(),
                    role: coopRole,
                    em: Date.now(),
                });
                coopLog('[V8.5] Skill capturada:', skill.name);
            }
            return _origApply.apply(this, arguments);
        };

        console.log('✅ [V8.5] applyStorySkill hookado (fonte única de skills).');
    }, 200);
})();

// =================================================================
// 23. HOOK EM storyEnemyAI (permite rodar no coop quando forçado)
// =================================================================
(function hookStoryEnemyAI() {
    const check = setInterval(() => {
        if (typeof window.storyEnemyAI !== 'function') return;
        clearInterval(check);
        if (window._coopStoryAIHook) return;
        window._coopStoryAIHook = true;

        const _origStoryAI = window.storyEnemyAI;

        window.storyEnemyAI = async function() {
            // Se estamos no coop E forçando o boss, permite rodar
            if (window._coopMode && coopForcarBoss) {
                const prevStoryMode = window._storyMode;
                window._storyMode = true; // temporariamente ativa

                try {
                    return await _origStoryAI.apply(this, arguments);
                } finally {
                    window._storyMode = prevStoryMode;
                }
            }

            // Fora do coop ou não forçado: comportamento original
            return _origStoryAI.apply(this, arguments);
        };

        console.log('✅ [V8.5] storyEnemyAI roda no coop quando forçado.');
    }, 200);
})();

// =================================================================
// 24. LOOP DE VERIFICAÇÃO DE HERÓIS MORTOS E TURNOS
// =================================================================
(function loopVerificacaoTurnos() {
    setInterval(() => {
        if (!window._coopMode) return;
        if (coopPartidaConcluida || coopFinalizando) return;
        if (!players || players.length === 0) return;

        const todosMortos = players.every(p => p.dead);
        if (todosMortos && coopRoomId) {
            console.log('[coop] Todos morreram. Publicando derrota.');
            coopPartidaConcluida = true;
            fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                status: 'concluida',
                vencedor: 'boss',
                atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
            }).catch(() => {});
            return;
        }

        const meuIdx = coopMeuIdx();
        const meuHeroi = players[meuIdx];

        if (meuHeroi?.dead && coopEhMeuTurno()) {
            console.log('[coop] Meu herói morreu no meu turno. Passando automaticamente.');
            setTimeout(() => {
                if (window._coopMode && !coopPartidaConcluida) {
                    coopPublicarEstado();
                }
            }, 1000);
        }
    }, 1000);

    console.log('✅ [V8.5] Loop de verificação de turnos instalado.');
})();

// =================================================================
// 25. MONITOR DE SEGURANÇA (destrava turno travado)
// =================================================================
(function monitorTurnoTravado() {
    let stuckCounter = 0;

    setInterval(() => {
        if (!window._coopMode) { stuckCounter = 0; return; }
        if (coopPartidaConcluida) { stuckCounter = 0; return; }
        if (!coopRoomId) { stuckCounter = 0; return; }
        if (coopFinalizando) { stuckCounter = 0; return; }

        // Detecta: boss morto + não está processando morte + não está finalizando
        if (boss && boss.dead && !coopProcessandoMorteBoss) {
            stuckCounter++;

            if (stuckCounter >= 3) { // 6 segundos (3 ciclos de 2s)
                coopLog('[V8.5] Monitor: turno travado detectado. Forçando conclusão.');

                const temProximo = Array.isArray(storyEnemiesRemaining)
                                   && storyEnemiesRemaining.length > 1;

                if (!temProximo) {
                    coopPartidaConcluida = true;
                    fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                        status: 'concluida',
                        vencedor: 'jogadores',
                        atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
                    }).catch(() => {});
                } else {
                    if (typeof advanceStoryEnemy === 'function') {
                        try { advanceStoryEnemy(); } catch(e) {}
                    }
                }
                stuckCounter = 0;
            }
        } else {
            stuckCounter = 0;
        }
    }, 2000);

    console.log('✅ [V8.5] Monitor de turno travado instalado.');
})();

// =================================================================
// 26. BOTÕES NA UI (Aldeia + Fase)
// =================================================================
(function botaoNaAldeia() {
    const check = setInterval(() => {
        if (typeof window.renderAldeiaScreen !== 'function') return;
        clearInterval(check);
        if (window._coopAldeiaBtn) return;
        window._coopAldeiaBtn = true;

        const _orig = window.renderAldeiaScreen;
        window.renderAldeiaScreen = function() {
            _orig.apply(this, arguments);
            const gridEl = document.querySelector('.story-ald-grid');
            if (!gridEl || gridEl.querySelector('.coop-aldeia-card')) return;

            const card = document.createElement('div');
            card.className = 'story-ald-location coop-aldeia-card';
            card.onclick = () => coopAbrirPainel();
            card.innerHTML = `
                <div class="story-ald-loc-icon">🎮</div>
                <div class="story-ald-loc-info">
                    <div class="story-ald-loc-name">JOGAR COOP</div>
                    <div class="story-ald-loc-desc">Jogue com amigos online</div>
                </div>
            `;
            gridEl.insertBefore(card, gridEl.firstChild);
        };
    }, 300);
})();

(function botaoNaFase() {
    const check = setInterval(() => {
        if (typeof window.renderChapterPhases !== 'function') return;
        clearInterval(check);
        if (window._coopFaseBtn) return;
        window._coopFaseBtn = true;

        const _orig = window.renderChapterPhases;
        window.renderChapterPhases = function(ch) {
            window._coopAtoAtual = ch.id;
            _orig.apply(this, arguments);

            const injetar = () => {
                document.querySelectorAll('.story-phase-card.unlocked').forEach(card => {
                    if (card.querySelector('.coop-fase-btn')) return;
                    const numEl = card.querySelector('.story-phase-num');
                    if (!numEl) return;
                    const faseId = numEl.textContent.trim();

                    const btn = document.createElement('button');
                    btn.className = 'coop-fase-btn';
                    btn.innerHTML = '🎮';
                    btn.title = 'Criar sala COOP';
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        coopCriarSala(ch.id, faseId);
                    };
                    card.appendChild(btn);
                });
            };

            setTimeout(injetar, 50);
            setTimeout(injetar, 200);
        };
    }, 300);
})();

// =================================================================
// 27. HOOKS (handleSelect, executeAction, bloquear boss, etc.)
// =================================================================
(function instalarHooks() {
    const check = setInterval(() => {
        if (typeof window.handleSelect !== 'function') return;
        if (typeof window.executeAction !== 'function') return;
        clearInterval(check);
        if (window._coopHooksInstalled) return;
        window._coopHooksInstalled = true;

        const _origHandle = window.handleSelect;
        const _origExec = window.executeAction;

        window.handleSelect = function(idx) {
            if (window._coopMode) return coopHandleSelect(idx);
            return _origHandle.apply(this, arguments);
        };

        window.executeAction = async function() {
            if (window._coopMode) return coopExecuteAction();
            return _origExec.apply(this, arguments);
        };

        coopLog('Hooks instalados.');
    }, 200);
})();

(function bloquearBoss() {
    const check = setInterval(() => {
        if (typeof window.bossAI !== 'function') return;
        clearInterval(check);
        if (window._coopBossBlock) return;
        window._coopBossBlock = true;

        const _origBossAI = window.bossAI;
        window.bossAI = async function() {
            if (window._coopMode && !coopForcarBoss) {
                coopLog('bossAI bloqueado');
                return;
            }
            return _origBossAI.apply(this, arguments);
        };
    }, 200);
})();

(function bloquearManageTurns() {
    const check = setInterval(() => {
        if (typeof window.manageTurns !== 'function') return;
        clearInterval(check);
        if (window._coopManageBlock) return;
        window._coopManageBlock = true;

        const _orig = window.manageTurns;
        window.manageTurns = function() {
            if (window._coopMode && !coopForcarBoss) {
                coopLog('manageTurns bloqueado');
                setTimeout(() => coopPublicarEstado(), 100);
                return;
            }
            return _orig.apply(this, arguments);
        };
    }, 200);
})();

// =================================================================
// 28. CSS
// =================================================================
(function injetarCSS() {
    if (document.getElementById('coopStyle')) return;
    const s = document.createElement('style');
    s.id = 'coopStyle';
    s.textContent = `
        .coop-painel-overlay {
            position: fixed; inset: 0;
            background: rgba(10,6,2,0.95);
            z-index: 20000;
            display: flex; align-items: flex-start; justify-content: center;
            padding: 20px; overflow-y: auto;
        }
        .coop-painel-container {
            background: linear-gradient(180deg, #2a1f10, #1a1208);
            border: 3px solid #8e44ad;
            border-radius: 10px;
            max-width: 860px; width: 100%;
            margin: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.9), 0 0 60px rgba(142,68,173,0.3);
        }
        .coop-painel-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 18px 22px;
            background: linear-gradient(180deg, rgba(142,68,173,0.2), transparent 60%);
            border-bottom: 2px solid rgba(142,68,173,0.4);
        }
        .coop-painel-header h2 {
            font-family: 'Cinzel Decorative', serif;
            color: #c39bd3; font-size: 1.4rem;
            letter-spacing: 2px; margin: 0;
            text-shadow: 0 0 15px rgba(142,68,173,0.7);
        }
        .coop-painel-close {
            padding: 6px 14px;
            background: linear-gradient(135deg, #6a2020, #3a1010);
            color: #f5c8c8; border: 1px solid #a83232;
            border-radius: 4px; cursor: pointer;
            font-family: 'Cinzel', serif; font-weight: 700; font-size: 0.8rem;
        }
        .coop-painel-subtitle {
            padding: 12px 22px;
            font-family: 'EB Garamond', serif;
            color: #b8a577; font-size: 0.9rem;
            font-style: italic; text-align: center;
            border-bottom: 1px solid rgba(142,68,173,0.2);
        }
        .coop-painel-section { padding: 16px 22px; }
        .coop-painel-section-title {
            display: flex; align-items: center; gap: 10px;
            font-family: 'Cinzel', serif;
            color: #c39bd3; font-size: 0.85rem;
            letter-spacing: 2px;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 1px solid rgba(142,68,173,0.3);
        }
        .coop-count {
            background: rgba(142,68,173,0.25);
            border: 1px solid rgba(142,68,173,0.5);
            color: #c39bd3;
            padding: 2px 10px; border-radius: 12px;
            font-size: 0.75rem; font-weight: 700;
        }
        .coop-filtros {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 8px;
            margin: 0 0 12px;
        }
        .coop-filtros select {
            min-width: 0;
            padding: 8px 10px;
            color: #e6d6ad;
            background: #1a1208;
            border: 1px solid rgba(142,68,173,0.55);
            border-radius: 5px;
            font: 600 0.8rem 'EB Garamond', serif;
        }
        .coop-filtros select:focus { outline: 2px solid #8e44ad; outline-offset: 1px; }
        .coop-lista { display: flex; flex-direction: column; gap: 10px; }
        .coop-empty {
            text-align: center; padding: 20px;
            color: #8a7a52; font-family: 'EB Garamond', serif;
            font-style: italic;
            background: rgba(10,6,2,0.4);
            border: 1px dashed rgba(142,68,173,0.3);
            border-radius: 6px;
        }
        .coop-card {
            background: rgba(10,6,2,0.6);
            border: 2px solid rgba(142,68,173,0.35);
            border-radius: 8px; padding: 12px;
        }
        .coop-card-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 10px; gap: 8px; flex-wrap: wrap;
        }
        .coop-card-fase {
            font-family: 'Cinzel', serif;
            color: #e8b923; font-size: 0.82rem;
            letter-spacing: 1px; font-weight: 700;
        }
        .coop-card-meta {
            margin: -4px 0 8px;
            color: #b8a577;
            font: italic 0.82rem 'EB Garamond', serif;
        }
        .coop-badge {
            display: inline-flex; align-items: center; gap: 4px;
            padding: 3px 10px; border-radius: 12px;
            font-family: 'Cinzel', serif; font-size: 0.7rem;
            font-weight: 700; letter-spacing: 1px;
        }
        .coop-badge.verde { background: rgba(107,163,92,0.2); border: 1px solid #6ba35c; color: #a8e088; }
        .coop-badge.amarelo { background: rgba(232,185,35,0.15); border: 1px solid #e8b923; color: #e8b923; }
        .coop-badge.cinza { background: rgba(138,122,82,0.2); border: 1px solid #8a7a52; color: #b8a577; }
        .coop-badge.azul { background: rgba(74,140,181,0.2); border: 1px solid #4a8cb5; color: #a0c8e0; }
        .coop-card-players {
            display: flex; align-items: center; gap: 10px;
            padding: 8px; background: rgba(10,6,2,0.5);
            border-radius: 5px; margin-bottom: 10px;
            flex-wrap: wrap;
        }
        .coop-jogador {
            font-family: 'EB Garamond', serif;
            color: #d9c89a; font-size: 0.85rem;
            padding: 3px 8px;
            background: rgba(142,68,173,0.15);
            border-radius: 4px;
            border-left: 3px solid rgba(142,68,173,0.5);
        }
        .coop-jogador.me { border-left-color: #6ba35c; background: rgba(107,163,92,0.15); }
        .coop-jogador.vazio { opacity: 0.5; }
        .coop-vs {
            font-family: 'Cinzel', serif;
            color: #8a7a52; font-size: 0.75rem;
            font-weight: 700;
        }
        .coop-card-acoes {
            display: flex; gap: 8px; justify-content: flex-end;
            flex-wrap: wrap;
        }
        .coop-btn-coop {
            padding: 8px 16px;
            background: linear-gradient(135deg, #3d2d18, #2a1f10);
            color: #c8b787;
            border: 2px solid #6a5024;
            border-radius: 4px; cursor: pointer;
            font-family: 'Cinzel', serif; font-weight: 700;
            font-size: 0.8rem; letter-spacing: 1px;
            transition: all 0.2s;
        }
        .coop-btn-coop:hover { color: #e8dcc4; border-color: #c9a227; }
        .coop-btn-coop.entrar {
            background: linear-gradient(180deg, rgba(142,68,173,0.25), transparent 45%),
                        linear-gradient(135deg, #5a2a70, #2a1538);
            color: #f0e0ff; border-color: #8e44ad;
        }
        .coop-btn-coop.entrar:hover { box-shadow: 0 0 15px rgba(142,68,173,0.5); }
        .coop-btn-coop.cancelar {
            background: linear-gradient(135deg, #4a1414, #2a0808);
            border-color: #8a3030; color: #f5c8c8;
            padding: 8px 12px;
        }
        .coop-btn-coop.cancelar:hover { border-color: #d05050; }

        .coop-aldeia-card {
            border-color: #8e44ad !important;
            background: linear-gradient(180deg, rgba(142,68,173,0.1), transparent 40%),
                        linear-gradient(180deg, rgba(42,31,16,0.95), rgba(26,18,8,0.95)) !important;
        }
        .coop-aldeia-card:hover {
            border-color: #c39bd3 !important;
            box-shadow: 0 8px 25px rgba(0,0,0,0.5), 0 0 25px rgba(142,68,173,0.4) !important;
        }

        .story-phase-card {
            position: relative !important;
            overflow: visible !important;
        }
        .coop-fase-btn {
            position: absolute !important;
            top: 8px !important;
            right: 8px !important;
            width: 34px !important;
            height: 34px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: linear-gradient(180deg, rgba(142,68,173,0.4), transparent 45%),
                        linear-gradient(135deg, #5a2a70, #2a1538) !important;
            color: #f0e0ff !important;
            border: 2px solid #8e44ad !important;
            border-radius: 50% !important;
            cursor: pointer !important;
            font-size: 1rem !important;
            z-index: 100 !important;
            opacity: 1 !important;
            visibility: visible !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.6), 0 0 12px rgba(142,68,173,0.5) !important;
            transition: all 0.2s !important;
        }
        .coop-fase-btn:hover {
            transform: scale(1.15) rotate(-10deg) !important;
            box-shadow: 0 0 20px rgba(142,68,173,0.9) !important;
        }

        .coop-sair-btn {
            padding: 8px 14px;
            background: linear-gradient(135deg, #6a2020, #3a1010);
            color: #f5c8c8;
            border: 1px solid #a83232;
            border-radius: 4px; cursor: pointer;
            font-family: 'Cinzel', serif; font-weight: 700;
            font-size: 0.8rem; letter-spacing: 1px;
        }
        .coop-sair-btn:hover { background: linear-gradient(135deg, #8a3030, #4a1414); }

        .coop-banner {
            display: flex; align-items: center; justify-content: center;
            gap: 12px;
            padding: 12px 20px;
            margin: 0 15px 10px;
            background: linear-gradient(180deg, rgba(232,185,35,0.15), transparent 60%),
                        linear-gradient(135deg, rgba(74,52,24,0.9), rgba(42,31,16,0.9));
            border: 2px solid #c9a227;
            border-radius: 8px;
            font-family: 'Cinzel', serif;
            color: #e8dcc4;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        }
        .coop-banner.active {
            background: linear-gradient(180deg, rgba(107,163,92,0.2), transparent 60%),
                        linear-gradient(135deg, rgba(42,69,32,0.9), rgba(26,47,20,0.9));
            border-color: #6ba35c;
            animation: coopPulse 2s ease-in-out infinite alternate;
        }
        .coop-banner.waiting {
            background: linear-gradient(180deg, rgba(232,185,35,0.12), transparent 60%),
                        linear-gradient(135deg, rgba(74,52,24,0.9), rgba(42,31,16,0.9));
            border-color: #c9a227;
        }
        @keyframes coopPulse {
            from { box-shadow: 0 4px 15px rgba(0,0,0,0.5), 0 0 10px rgba(107,163,92,0.3); }
            to { box-shadow: 0 4px 15px rgba(0,0,0,0.5), 0 0 25px rgba(107,163,92,0.6); }
        }
        .coop-banner-icon { font-size: 1.5rem; }
        .coop-banner-text {
            font-size: 1rem; font-weight: 900;
            letter-spacing: 2px;
        }
        .coop-banner-hint {
            font-family: 'EB Garamond', serif;
            font-size: 0.8rem; font-style: italic;
            opacity: 0.85;
        }

        .coop-resumo {
            display: flex; align-items: center; gap: 14px;
            padding: 12px 20px; margin: 10px 15px 0;
            background: linear-gradient(180deg, rgba(142,68,173,0.18), transparent 60%),
                        linear-gradient(135deg, rgba(58,26,72,0.95), rgba(42,21,56,0.95));
            border: 2px solid #8e44ad;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.5), 0 0 20px rgba(142,68,173,0.3);
        }
        .coop-resumo-icon { font-size: 1.5rem; }
        .coop-resumo-quem {
            font-family: 'Cinzel', serif;
            color: #c39bd3; font-size: 0.85rem;
            font-weight: 700; letter-spacing: 1.5px;
        }
        .coop-resumo-texto {
            font-family: 'EB Garamond', serif;
            color: #e8dcc4; font-size: 0.9rem;
            font-style: italic;
        }

        .coop-silhueta {
            width: 60%;
            height: 60%;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(80,80,80,0.6), rgba(40,40,40,0.9));
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Cinzel', serif;
            font-size: 1.5rem;
            color: rgba(200,200,200,0.4);
            border: 2px dashed rgba(150,150,150,0.5);
            animation: coopPlaceholderPulse 2s ease-in-out infinite alternate;
        }
        @keyframes coopPlaceholderPulse {
            from { opacity: 0.5; }
            to { opacity: 0.8; }
        }
        .token.placeholder {
            opacity: 0.5;
        }

        .token.dead {
            opacity: 0.4;
            filter: grayscale(1) brightness(0.6);
            pointer-events: none;
        }
        .token.dead img {
            animation: none !important;
        }

        .coop-skill-flash {
            animation: coopSkillFlash 0.5s ease-out;
        }
        @keyframes coopSkillFlash {
            0% { transform: scale(1); filter: brightness(1); }
            50% { transform: scale(1.2); filter: brightness(2); }
            100% { transform: scale(1); filter: brightness(1); }
        }

        @media (max-width: 600px) {
            .coop-painel-header h2 { font-size: 1.1rem; }
            .coop-filtros { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .coop-card-players { flex-direction: column; align-items: stretch; }
            .coop-vs { transform: rotate(90deg); text-align: center; }
            .coop-banner { flex-direction: column; gap: 6px; padding: 10px; }
            .coop-fase-btn { width: 30px; height: 30px; font-size: 0.9rem; }
        }
    `;
    document.head.appendChild(s);
    coopLog('CSS injetado.');
})();

// =================================================================
// 29. BOOT
// =================================================================
(async function boot() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => coopInit());
    } else {
        coopInit();
    }
    coopLog('coop.js V8.5 carregado.');
})();

// =================================================================
// EXPOR
// =================================================================
window.coopAbrirPainel = coopAbrirPainel;
window.coopFecharPainel = coopFecharPainel;
window.coopCriarSala = coopCriarSala;
window.coopEntrarSala = coopEntrarSala;
window.coopContinuarSala = coopContinuarSala;
window.coopCancelarSala = coopCancelarSala;
window.coopSairParaAldeia = coopSairParaAldeia;
window.coopPublicarEstado = coopPublicarEstado;
window.coopProcessarMorteBoss = coopProcessarMorteBoss;
window.coopExecutarAcaoManual = coopExecutarAcaoManual;
window.coopRodarBossP2 = coopRodarBossP2;
window.coopReproduzirEventos = coopReproduzirEventos;
window.coopReproduzirEventoIndividual = coopReproduzirEventoIndividual;

console.log('✅ coop.js V8.5 (boss não renasce + skills sem duplicata + IA roda no coop + bônus de nível/arma) carregado.');
// =================================================================
// coop.js — PATCH V8.6 (CORREÇÃO DEFINITIVA DO BOSS RENASCENDO)
// -----------------------------------------------------------------
// Causa raiz: race condition entre coopProcessarMorteBoss e
// coopRodarBossP2. O listener recebe "turno_boss" antes do
// coopProcessarMorteBoss terminar de publicar "concluida".
//
// Correção:
//   • coopRodarBossP2 tem guarda DUPLA (início + após await)
//   • coopAplicarEstadoDoRoom NÃO recria boss se estiver processando morte
//   • coopAtualizarSalaNoFirestore NÃO publica "turno_boss" se boss morreu
//   • Flag global coopBossMortoNesteTurno marca o momento exato
// =================================================================

(function patchV86() {
    if (window._coopV86) return;
    window._coopV86 = true;

    // ================================================================
    // FLAG GLOBAL: marca quando o boss acabou de morrer
    // ================================================================
    window.coopBossMortoNesteTurno = false;

    // ================================================================
    // FIX 1: coopApplyDmg marca a flag global ao matar o boss
    // ================================================================
    const _origApplyDmg = window.coopApplyDmg;
    if (typeof _origApplyDmg === 'function') {
        window.coopApplyDmg = function(t, amt) {
            const r = _origApplyDmg.apply(this, arguments);
            if (t === boss && boss.dead) {
                window.coopBossMortoNesteTurno = true;
                coopLog('[V8.6] Flag coopBossMortoNesteTurno = true');
            }
            return r;
        };
    }

    // ================================================================
    // FIX 2: coopAtualizarSalaNoFirestore
    //   NÃO publica "turno_boss" se o boss morreu neste turno.
    //   Deixa o coopProcessarMorteBoss decidir o que publicar.
    // ================================================================
    const _origAtualizar = window.coopAtualizarSalaNoFirestore;
    if (typeof _origAtualizar === 'function') {
        window.coopAtualizarSalaNoFirestore = async function(estado) {
            const bossMorto = estado.boss.dead;
            const temProximoInimigo = Array.isArray(storyEnemiesRemaining)
                                      && storyEnemiesRemaining.length > 1;

            // Se o boss morreu neste turno E é o último, NÃO publica nada.
            // O coopProcessarMorteBoss vai publicar "concluida".
            if (bossMorto && !temProximoInimigo) {
                coopLog('[V8.6] Boss morto (último). Ignorando publicação de turno_boss.');
                window.coopBossMortoNesteTurno = true;
                return;
            }

            // Se o boss morreu mas tem próximo, também não publica
            // turno_boss — deixa o coopProcessarMorteBoss cuidar
            if (bossMorto && temProximoInimigo) {
                coopLog('[V8.6] Boss morto (tem próximo). Ignorando publicação.');
                window.coopBossMortoNesteTurno = true;
                return;
            }

            // Fluxo normal: chama o original
            return _origAtualizar.apply(this, arguments);
        };
    }

    // ================================================================
    // FIX 3: coopRodarBossP2 com guarda DUPLA
    //   • Antes do await (estado atual)
    //   • Depois do await (estado pode ter mudado)
    // ================================================================
    const _origRodarBoss = window.coopRodarBossP2;
    if (typeof _origRodarBoss === 'function') {
        window.coopRodarBossP2 = async function() {
            // GUARDA 1: estado no início
            if (coopPartidaConcluida) {
                coopLog('[V8.6] coopRodarBossP2 bloqueado (1): partida concluída.');
                return;
            }
            if (coopProcessandoMorteBoss) {
                coopLog('[V8.6] coopRodarBossP2 bloqueado (1): processando morte.');
                return;
            }
            if (window.coopBossMortoNesteTurno) {
                coopLog('[V8.6] coopRodarBossP2 bloqueado (1): boss morreu neste turno.');
                return;
            }
            if (boss && boss.dead) {
                coopLog('[V8.6] coopRodarBossP2 bloqueado (1): boss já está morto.');
                return;
            }

            // Chama o original
            const result = await _origRodarBoss.apply(this, arguments);

            // GUARDA 2: estado pode ter mudado durante o await
            // (ex: o outro cliente publicou "concluida" enquanto rodávamos)
            if (coopPartidaConcluida) {
                coopLog('[V8.6] Após rodar boss: partida concluída.');
            }
            if (coopProcessandoMorteBoss) {
                coopLog('[V8.6] Após rodar boss: processando morte.');
            }

            return result;
        };
    }

    // ================================================================
    // FIX 4: coopAplicarEstadoDoRoom
    //   NÃO recria boss com HP cheio se estiver processando morte
    //   ou se o boss da sala é o mesmo que acabou de morrer.
    // ================================================================
    const _origAplicar = window.coopAplicarEstadoDoRoom;
    if (typeof _origAplicar === 'function') {
        window.coopAplicarEstadoDoRoom = function(room) {
            // GUARDA: se estamos processando morte do boss,
            // não deixa a leitura do Firestore sobrescrever o estado local
            if (coopProcessandoMorteBoss) {
                coopLog('[V8.6] coopAplicarEstadoDoRoom bloqueado: processando morte.');
                return;
            }

            // GUARDA: se o boss morreu neste turno e o Firestore ainda
            // não refletiu isso, não deixa recriar
            if (window.coopBossMortoNesteTurno && room?.estadoJogo?.boss) {
                // Só permite se o boss da sala também está marcado como morto
                if (!room.estadoJogo.boss.dead) {
                    coopLog('[V8.6] coopAplicarEstadoDoRoom bloqueado: boss local morto, sala diz vivo.');
                    return;
                }
            }

            return _origAplicar.apply(this, arguments);
        };
    }

    // ================================================================
    // FIX 5: Reset da flag no início de cada turno do P1
    // ================================================================
    const _origExec = window.coopExecuteAction;
    if (typeof _origExec === 'function') {
        window.coopExecuteAction = async function() {
            // Reseta a flag quando o P1 começa o turno dele
            window.coopBossMortoNesteTurno = false;
            return _origExec.apply(this, arguments);
        };
    }

    // ================================================================
    // FIX 6: Reset da flag quando o P2 termina de rodar o boss
    //        (só reseta se o boss NÃO morreu)
    // ================================================================
    const _origRodarBoss2 = window.coopRodarBossP2;
    if (typeof _origRodarBoss2 === 'function' && !window._coopV86RodarBoss) {
        window._coopV86RodarBoss = true;
        const _innerRodar = window.coopRodarBossP2;
        window.coopRodarBossP2 = async function() {
            const r = await _innerRodar.apply(this, arguments);
            // Só reseta se o boss NÃO morreu neste turno
            if (!boss.dead) {
                window.coopBossMortoNesteTurno = false;
            }
            return r;
        };
    }

    // ================================================================
    // FIX 7: Reset da flag quando a partida é finalizada
    // ================================================================
    const _origFinalizar = window.coopFinalizar;
    if (typeof _origFinalizar === 'function' && !window._coopV86Finalizar) {
        window._coopV86Finalizar = true;
        const _innerFinalizar = window.coopFinalizar;
        window.coopFinalizar = async function() {
            window.coopBossMortoNesteTurno = false;
            return _innerFinalizar.apply(this, arguments);
        };
    }

    // ================================================================
    // FIX 8: Reset no listener quando o status muda para "concluida"
    // ================================================================
    // (já é feito no FIX 7 acima, quando coopFinalizar é chamado)

    // ================================================================
    // FIX 9: Guarda extra no applyStorySkill — evita que skills do
    //        boss sejam capturadas DEPOIS do boss morrer
    // ================================================================
    const _origApplySkill = window.applyStorySkill;
    if (typeof _origApplySkill === 'function' && !window._coopV86ApplySkill) {
        window._coopV86ApplySkill = true;
        const _innerApplySkill = window.applyStorySkill;
        window.applyStorySkill = async function(enemy, skill) {
            if (boss && boss.dead && window._coopMode) {
                coopLog('[V8.6] applyStorySkill bloqueado: boss já morreu.');
                return;
            }
            return _innerApplySkill.apply(this, arguments);
        };
    }

    console.log('✅ [V8.6] Correção do boss renascendo instalada.');
    console.log('   • Flag coopBossMortoNesteTurno ativa');
    console.log('   • coopRodarBossP2 com guarda dupla');
    console.log('   • coopAplicarEstadoDoRoom não sobrescreve após morte');
    console.log('   • coopAtualizarSalaNoFirestore não publica turno_boss pós-morte');
})();
// =================================================================
// coop.js — PATCH V8.7 (CORREÇÃO DO TRAVAMENTO EM FASES MULTI-BOSS)
// -----------------------------------------------------------------
// Bug: quando o P2 mata um boss que tem PRÓXIMO, o fluxo travava:
//   1. coopProcessarMorteBoss avançava o inimigo
//   2. Publicava "turno_boss" (para o P2 rodar o próximo)
//   3. MAS coopRodarBossP2 era bloqueado pela flag coopBossMortoNesteTurno
//   4. Turno travava (P2 não rodava, P1 esperava "turno_joao")
//
// Correção:
//   • coopBossMortoNesteTurno é resetada quando avança para o próximo
//   • coopProcessarMorteBoss tem controle total do fluxo
//   • Guards do V8.6 ajustados para não bloquear após avanço
// =================================================================

(function patchV87() {
    if (window._coopV87) return;
    window._coopV87 = true;

    // ================================================================
    // FIX 1: coopProcessarMorteBoss — reseta a flag ao avançar
    // ================================================================
    const _origProcessarMorte = window.coopProcessarMorteBoss;
    if (typeof _origProcessarMorte === 'function') {
        window.coopProcessarMorteBoss = async function() {
            if (coopProcessandoMorteBoss) {
                coopLog('[V8.7] coopProcessarMorteBoss já rodando.');
                return;
            }
            if (coopPartidaConcluida) {
                coopLog('[V8.7] Partida já concluída.');
                return;
            }

            coopProcessandoMorteBoss = true;
            coopLog('[V8.7] Iniciando processamento de morte.');

            try {
                await coopSleep(800);

                const temProximo = Array.isArray(storyEnemiesRemaining)
                                   && storyEnemiesRemaining.length > 1;

                if (temProximo) {
                    // ============================
                    // AINDA TEM INIMIGO → AVANÇA
                    // ============================
                    coopLog('[V8.7] Ainda tem inimigos. Avançando...');

                    if (typeof showPurificacao === 'function') {
                        try {
                            await showPurificacao(boss.type, boss.x, boss.y, false);
                        } catch (e) {
                            console.warn('[V8.7] Erro na purificação:', e);
                        }
                    }

                    storyEnemiesRemaining.shift();
                    storyCurrentEnemyIndex++;

                    const proximoId = storyEnemiesRemaining[0];
                    const proximoEnemy = STORY_ENEMIES[proximoId];

                    if (!proximoEnemy) {
                        console.error('[V8.7] Próximo inimigo não existe:', proximoId);
                        coopPartidaConcluida = true;
                        return;
                    }

                    coopLog('[V8.7] Próximo inimigo:', proximoEnemy.name);
                    await coopSleep(1000);

                    const baseType = (typeof STORY_TO_BASE_BOSS !== 'undefined' && STORY_TO_BASE_BOSS[proximoId])
                        ? STORY_TO_BASE_BOSS[proximoId]
                        : proximoId.toUpperCase();

                    boss.type = baseType;
                    boss.hp = proximoEnemy.hp;
                    boss.maxHp = proximoEnemy.hp;
                    boss.dead = false;
                    boss.x = 4;
                    boss.y = 0;

                    // ⭐⭐⭐ RESETA A FLAG CRÍTICA ⭐⭐⭐
                    // O novo boss está VIVO, então a flag de "boss morto"
                    // deve ser limpa para permitir que coopRodarBossP2 rode
                    window.coopBossMortoNesteTurno = false;
                    coopLog('[V8.7] Flag coopBossMortoNesteTurno resetada (novo boss vivo).');

                    // Recria o token do boss
                    const board = document.getElementById('board');
                    if (board) {
                        const oldBossToken = document.getElementById('tokenBoss');
                        if (oldBossToken) oldBossToken.remove();

                        board.querySelectorAll('.token').forEach(el => {
                            if (el.querySelector('#imgBoss') || el.querySelector('#storyBossEmoji')) {
                                el.remove();
                            }
                        });

                        const tok = document.createElement('div');
                        tok.id = 'tokenBoss';
                        tok.className = 'token';

                        let spriteSrc = coopGetBossSprite(baseType);

                        let imgHTML;
                        if (spriteSrc) {
                            imgHTML = `<img id="imgBoss" src="${spriteSrc}" class="normal">`;
                        } else {
                            const emoji = (typeof EMOJI_STORY !== 'undefined' && EMOJI_STORY[proximoId]) || '?';
                            imgHTML = `<span id="storyBossEmoji" class="story-boss-emoji">${emoji}</span>`;
                        }

                        tok.innerHTML = `
                            <div class="hp-container"><div id="hpBarBoss" class="hp-bar"></div></div>
                            ${imgHTML}
                        `;
                        board.appendChild(tok);
                    }

                    if (typeof updateBossCard === 'function') updateBossCard();
                    if (typeof updateHeaderBossName === 'function') updateHeaderBossName();
                    if (typeof updateVisuals === 'function') updateVisuals();
                    if (typeof updateAllSpriteDirections === 'function') updateAllSpriteDirections();
                    coopRenderTudo();

                    // Publica o estado com o novo boss vivo
                    // IMPORTANTE: publica turno_boss para o P2 rodar o próximo
                    // E também precisa liberar a flag coopProcessandoMorteBoss
                    // ANTES de publicar, senão o listener pode travar
                    coopProcessandoMorteBoss = false;

                    await coopPublicarEstado();

                    return;
                }

                // ============================
                // ÚLTIMO BOSS → VITÓRIA FINAL
                // ============================
                coopLog('[V8.7] Último boss morto. Vitória final!');
                coopPartidaConcluida = true;

                await coopSleep(800);

                if (typeof showPurificacao === 'function') {
                    try {
                        await showPurificacao(boss.type, boss.x, boss.y, true);
                    } catch (e) {
                        console.warn('[V8.7] Erro na purificação:', e);
                    }
                }

                await coopSleep(1500);

                if (coopRoomId) {
                    try {
                        await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                            status: 'concluida',
                            vencedor: 'jogadores',
                            'estadoJogo.boss': {
                                x: boss.x, y: boss.y, hp: boss.hp, maxHp: boss.maxHp,
                                type: boss.type, dead: true,
                            },
                            atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
                        });
                        coopLog('[V8.7] Vitória publicada');
                    } catch (e) {
                        console.error('[V8.7] Erro ao publicar vitória:', e);
                    }
                }

            } catch (e) {
                console.error('[V8.7] Erro:', e);
            } finally {
                coopProcessandoMorteBoss = false;
                coopLog('[V8.7] coopProcessandoMorteBoss liberado.');
            }
        };
    }

    // ================================================================
    // FIX 2: coopAtualizarSalaNoFirestore — ajusta a lógica de status
    // ================================================================
    const _origAtualizar = window.coopAtualizarSalaNoFirestore;
    if (typeof _origAtualizar === 'function') {
        window.coopAtualizarSalaNoFirestore = async function(estado) {
            const bossMorto = estado.boss.dead;
            const todosMortos = estado.players.every(p => p.dead);
            const temProximoInimigo = Array.isArray(storyEnemiesRemaining)
                                      && storyEnemiesRemaining.length > 1;

            // ============ CASO 1: Todos mortos ============
            if (todosMortos) {
                coopLog('[V8.7] Todos morreram. Publicando derrota.');
                coopPartidaConcluida = true;
                try {
                    await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                        status: 'concluida',
                        vencedor: 'boss',
                        'estadoJogo.boss': estado.boss,
                        'estadoJogo.players': estado.players,
                        atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
                    });
                } catch (e) {
                    console.error('[V8.7] Erro ao publicar derrota:', e);
                }
                return;
            }

            // ============ CASO 2: Último boss morto → vitória ============
            if (bossMorto && !temProximoInimigo) {
                coopLog('[V8.7] Último boss morto. Publicando vitória.');
                coopPartidaConcluida = true;
                try {
                    await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                        status: 'concluida',
                        vencedor: 'jogadores',
                        'estadoJogo.boss': estado.boss,
                        'estadoJogo.players': estado.players,
                        atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
                    });
                } catch (e) {
                    console.error('[V8.7] Erro ao publicar vitória:', e);
                }
                return;
            }

            // ============ CASO 3: Boss morto mas tem próximo ============
            // Este caso NÃO deveria acontecer (coopProcessarMorteBoss já
            // avançou o inimigo e publicou o estado com o novo boss vivo).
            // Mas se acontecer, publica turno_boss para o P2 rodar.
            if (bossMorto && temProximoInimigo) {
                coopLog('[V8.7] Boss morto (tem próximo). Forçando turno_boss.');
                const update = {
                    status: 'turno_boss',
                    'estadoJogo.turnoDe': 'boss',
                    'estadoJogo.boss': estado.boss,
                    'estadoJogo.players': estado.players,
                    'estadoJogo.grid': estado.grid,
                    'estadoJogo.eventosTurno': [],
                    atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
                };
                try {
                    await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update(update);
                } catch (e) {
                    console.error('[V8.7] Erro:', e);
                }
                return;
            }

            // ============ CASO 4: Fluxo normal ============
            const eventos = [...coopEventosTurno];

            const update = {
                'estadoJogo.grid': estado.grid,
                'estadoJogo.amulets': estado.amulets,
                'estadoJogo.players': estado.players,
                'estadoJogo.boss': estado.boss,
                'estadoJogo.ultimaAcao': {
                    tipo: coopRole === 'criador' ? 'turno_criador' : 'turno_maria',
                    resumo: `${players[coopMeuIdx()]?.name} jogou`,
                    em: Date.now(),
                },
                'estadoJogo.eventosTurno': eventos,
                atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
            };

            if (coopRole === 'criador') {
                update.status = 'turno_maria';
                update['estadoJogo.turnoDe'] = 'oponente';
            } else {
                update.status = 'turno_boss';
                update['estadoJogo.turnoDe'] = 'boss';
            }

            await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update(update);
            coopLog('[V8.7] Sala atualizada:', update.status, '| eventos:', eventos.length);

            coopEventosTurno = [];

            if (update.status === 'turno_boss' && coopRole === 'oponente') {
                coopLog('[V8.7] Sou o P2. Vou rodar o boss.');
                setTimeout(() => coopRodarBossP2(), 800);
                return;
            }

            if (update.status === 'concluida') {
                coopFinalizar(true);
                return;
            }

            coopPausar();
        };
    }

    // ================================================================
    // FIX 3: coopRodarBossP2 — ajusta guardas do V8.6
    // ================================================================
    const _origRodarBoss = window.coopRodarBossP2;
    if (typeof _origRodarBoss === 'function') {
        window.coopRodarBossP2 = async function() {
            if (coopRole !== 'oponente') return;
            if (coopBossRunning) {
                coopLog('[V8.7] coopRodarBossP2: já rodando.');
                return;
            }
            if (!coopRoomId) return;
            if (coopPartidaConcluida) {
                coopLog('[V8.7] coopRodarBossP2: partida concluída.');
                return;
            }
            // ⚠️ NÃO bloqueia mais por coopBossMortoNesteTurno
            // (o coopProcessarMorteBoss já resetou essa flag ao avançar)
            if (coopProcessandoMorteBoss) {
                coopLog('[V8.7] coopRodarBossP2: processando morte.');
                return;
            }
            if (boss && boss.dead) {
                coopLog('[V8.7] coopRodarBossP2: boss morto.');
                return;
            }

            return _origRodarBoss.apply(this, arguments);
        };
    }

    // ================================================================
    // FIX 4: coopAplicarEstadoDoRoom — ajusta guardas
    // ================================================================
    const _origAplicar = window.coopAplicarEstadoDoRoom;
    if (typeof _origAplicar === 'function') {
        window.coopAplicarEstadoDoRoom = function(room) {
            // Só bloqueia se realmente estiver processando morte
            if (coopProcessandoMorteBoss) {
                coopLog('[V8.7] coopAplicarEstadoDoRoom: processando morte, ignorando.');
                return;
            }
            // Só bloqueia se o boss LOCAL está morto e a sala diz vivo
            if (window.coopBossMortoNesteTurno && room?.estadoJogo?.boss && !room.estadoJogo.boss.dead) {
                coopLog('[V8.7] coopAplicarEstadoDoRoom: boss local morto, sala diz vivo.');
                return;
            }
            return _origAplicar.apply(this, arguments);
        };
    }

    console.log('✅ [V8.7] Correção do travamento em fases multi-boss instalada.');
})();
// =================================================================
// coop.js — PATCH V8.8 (SINCRONIZAÇÃO DE SKILLS DO BOSS)
// -----------------------------------------------------------------
// Bug: handlers de skill leem boss.x/y, players[].x/y e grid[]
// no momento em que rodam. No P1 (replay), esses valores são
// diferentes dos do P2, então a skill sai em tiles diferentes.
//
// Solução:
//   • Capturar snapshot completo (boss, players, grid) ao registrar skill
//   • No replay, restaurar temporariamente esse snapshot antes de
//     rodar o handler, e voltar ao estado atual depois
// =================================================================

(function patchV88() {
    if (window._coopV88) return;
    window._coopV88 = true;

    // ================================================================
    // FIX 1: Captura snapshot ao registrar boss_skill
    // ================================================================
    const _origApplySkill = window.applyStorySkill;
    if (typeof _origApplySkill === 'function' && !window._coopV88ApplyHook) {
        window._coopV88ApplyHook = true;
        const _innerApply = window.applyStorySkill;

        window.applyStorySkill = async function(enemy, skill) {
            // Captura o snapshot ANTES de rodar a skill
            if (coopCapturandoEventosBoss && window._coopMode && skill) {
                // Snapshot do boss
                const bossSnapshot = {
                    x: boss.x,
                    y: boss.y,
                    hp: boss.hp,
                    maxHp: boss.maxHp,
                    type: boss.type,
                    dead: boss.dead,
                };

                // Snapshot dos players
                const playersSnapshot = players.map(p => ({
                    id: p.id,
                    x: p.x,
                    y: p.y,
                    hp: p.hp,
                    maxHp: p.maxHp,
                    dead: p.dead,
                    element: p.element,
                    class: p.class,
                }));

                // Snapshot do grid (cópia)
                const gridSnapshot = [...grid];

                // Snapshot dos amulets
                const amuletsSnapshot = [...amulets];

                coopBufferEventosBoss.push({
                    tipo: 'boss_skill',
                    skill: skill.handler || skill.name,
                    skillName: skill.name || '',
                    enemyId: enemy ? enemy.id : null,
                    enemyNome: enemy ? (enemy.name || enemy.nome) : '',
                    enemyAtk: enemy ? (Number(enemy.atk) || 4) : 4,
                    // ⭐ Snapshot completo do estado no momento da skill
                    snapshot: {
                        boss: bossSnapshot,
                        players: playersSnapshot,
                        grid: gridSnapshot,
                        amulets: amuletsSnapshot,
                    },
                    uid: coopMeuUid(),
                    role: coopRole,
                    em: Date.now(),
                });
                coopLog('[V8.8] Skill capturada com snapshot:', skill.name);
            }

            return _innerApply.apply(this, arguments);
        };

        console.log('✅ [V8.8] applyStorySkill hookado com captura de snapshot.');
    }

    // ================================================================
    // FIX 2: Replay restaura o snapshot antes de rodar a skill
    // ================================================================
    const _origReproEvento = window.coopReproduzirEventoIndividual;
    if (typeof _origReproEvento === 'function' && !window._coopV88ReproHook) {
        window._coopV88ReproHook = true;
        const _innerRepro = window.coopReproduzirEventoIndividual;

        window.coopReproduzirEventoIndividual = async function(evento) {
            // Se é boss_skill com snapshot, restaura antes de rodar
            if (evento.tipo === 'boss_skill' && evento.snapshot) {
                return await coopReproduzirSkillComSnapshot(evento);
            }

            // Se é boss_skill SEM snapshot (compatibilidade), roda normal
            return _innerRepro.apply(this, arguments);
        };
    }

    // ================================================================
    // Helper: reproduz skill restaurando o snapshot temporariamente
    // ================================================================
    async function coopReproduzirSkillComSnapshot(evento) {
        const snap = evento.snapshot;
        if (!snap) return;

        // ---- Salva estado ATUAL (para restaurar depois) ----
        const estadoAtual = {
            boss: {
                x: boss.x, y: boss.y, hp: boss.hp, maxHp: boss.maxHp,
                type: boss.type, dead: boss.dead,
            },
            players: players.map(p => ({
                x: p.x, y: p.y, hp: p.hp, maxHp: p.maxHp,
                dead: p.dead, element: p.element,
            })),
            grid: [...grid],
            amulets: [...amulets],
        };

        // ---- Aplica o snapshot ----
        boss.x = snap.boss.x;
        boss.y = snap.boss.y;
        boss.hp = snap.boss.hp;
        boss.maxHp = snap.boss.maxHp;
        boss.type = snap.boss.type;
        boss.dead = snap.boss.dead;

        snap.players.forEach((pSnap, i) => {
            if (players[i]) {
                players[i].x = pSnap.x;
                players[i].y = pSnap.y;
                players[i].hp = pSnap.hp;
                players[i].maxHp = pSnap.maxHp;
                players[i].dead = pSnap.dead;
                players[i].element = pSnap.element;
            }
        });

        for (let i = 0; i < 64; i++) {
            if (snap.grid[i]) grid[i] = snap.grid[i];
        }
        for (let i = 0; i < 64; i++) {
            amulets[i] = snap.amulets[i] || false;
        }

        // Reposiciona tokens VISUALMENTE (para o P1 ver o boss/players
        // nas posições corretas no momento da skill)
        const s = (typeof getStep === 'function') ? getStep() : 59;
        const bossToken = document.getElementById('tokenBoss');
        if (bossToken) {
            bossToken.style.left = (snap.boss.x * s + 8) + 'px';
            bossToken.style.top = (snap.boss.y * s + 8) + 'px';
        }
        snap.players.forEach((pSnap, i) => {
            const tok = document.getElementById(`tokenP${i}`);
            if (tok) {
                tok.style.left = (pSnap.x * s + 8) + 'px';
                tok.style.top = (pSnap.y * s + 8) + 'px';
            }
        });

        // ---- Roda o handler ----
        const skillName = evento.skillName || evento.skill;
        const handlerKey = evento.skill;
        let reproduzido = false;

        try {
            if (typeof STORY_ANIMAL_SKILLS !== 'undefined' &&
                STORY_ANIMAL_SKILLS[handlerKey]) {
                const handler = STORY_ANIMAL_SKILLS[handlerKey];
                const atkReplay = Number(evento.enemyAtk) > 0 ? Number(evento.enemyAtk)
                    : (typeof STORY_ENEMIES !== 'undefined' && STORY_ENEMIES[evento.enemyId]?.atk) || 4;
                const enemyMock = {
                    id: evento.enemyId,
                    nome: evento.enemyNome
                        || (typeof STORY_ENEMIES !== 'undefined' && STORY_ENEMIES[evento.enemyId]?.name)
                        || 'Boss',
                    name: evento.enemyNome
                        || (typeof STORY_ENEMIES !== 'undefined' && STORY_ENEMIES[evento.enemyId]?.name)
                        || 'Boss',
                    atk: atkReplay,
                };
                const skillMock = { name: skillName, handler: handlerKey };
                console.log('[V8.8] Reproduzindo skill com snapshot:', skillName);
                await handler(enemyMock, skillMock);
                reproduzido = true;
            }
        } catch (e) {
            console.warn('[V8.8] Falha ao reproduzir skill:', skillName, e);
        }

        // Handlers de nação/evento não estão em STORY_ANIMAL_SKILLS
        if (!reproduzido && handlerKey && String(handlerKey).startsWith('nacao_')
            && typeof window.NACAO_SKILL_HANDLERS !== 'undefined'
            && typeof window.NACAO_SKILL_HANDLERS[handlerKey] === 'function') {
            try {
                const atkReplay = Number(evento.enemyAtk) > 0 ? Number(evento.enemyAtk) : 4;
                const enemyMock = {
                    id: evento.enemyId,
                    nome: evento.enemyNome || 'Boss', name: evento.enemyNome || 'Boss',
                    atk: atkReplay,
                };
                const skillMock = { nome: skillName, name: skillName, handler: handlerKey };
                console.log('[V8.8] Reproduzindo skill de NAÇÃO com snapshot:', skillName);
                await window.NACAO_SKILL_HANDLERS[handlerKey](enemyMock, skillMock);
                reproduzido = true;
            } catch (e) {
                console.warn('[V8.8] Falha ao reproduzir skill de nação:', skillName, e);
            }
        }
        if (!reproduzido && handlerKey && String(handlerKey).startsWith('evento_')
            && typeof window.EVENTO_SKILLS !== 'undefined'
            && typeof window.EVENTO_SKILLS[handlerKey] === 'function') {
            try {
                const atkReplay = Number(evento.enemyAtk) > 0 ? Number(evento.enemyAtk) : 4;
                const enemyMock = {
                    id: evento.enemyId,
                    nome: evento.enemyNome || 'Boss', name: evento.enemyNome || 'Boss',
                    atk: atkReplay,
                };
                const skillMock = { nome: skillName, name: skillName, handler: handlerKey,
                    danoBase: atkReplay, dano: atkReplay };
                console.log('[V8.8] Reproduzindo skill de EVENTO com snapshot:', skillName);
                await window.EVENTO_SKILLS[handlerKey](enemyMock, skillMock);
                reproduzido = true;
            } catch (e) {
                console.warn('[V8.8] Falha ao reproduzir skill de evento:', skillName, e);
            }
        }

        // Fallback
        if (!reproduzido && typeof window[handlerKey] === 'function') {
            try {
                window[handlerKey].apply(window, evento.argsRaw || []);
                reproduzido = true;
            } catch (e) {
                console.warn('[V8.8] Fallback falhou:', handlerKey, e);
            }
        }

        await coopSleep(600);

        // ---- Restaura estado ATUAL ----
        boss.x = estadoAtual.boss.x;
        boss.y = estadoAtual.boss.y;
        boss.hp = estadoAtual.boss.hp;
        boss.maxHp = estadoAtual.boss.maxHp;
        boss.type = estadoAtual.boss.type;
        boss.dead = estadoAtual.boss.dead;

        estadoAtual.players.forEach((pAtual, i) => {
            if (players[i]) {
                players[i].x = pAtual.x;
                players[i].y = pAtual.y;
                players[i].hp = pAtual.hp;
                players[i].maxHp = pAtual.maxHp;
                players[i].dead = pAtual.dead;
                players[i].element = pAtual.element;
            }
        });

        for (let i = 0; i < 64; i++) {
            if (estadoAtual.grid[i]) grid[i] = estadoAtual.grid[i];
        }
        for (let i = 0; i < 64; i++) {
            amulets[i] = estadoAtual.amulets[i] || false;
        }

        // Reposiciona tokens VISUALMENTE de volta
        const bossTokenRestore = document.getElementById('tokenBoss');
        if (bossTokenRestore) {
            bossTokenRestore.style.left = (estadoAtual.boss.x * s + 8) + 'px';
            bossTokenRestore.style.top = (estadoAtual.boss.y * s + 8) + 'px';
        }
        estadoAtual.players.forEach((pAtual, i) => {
            const tok = document.getElementById(`tokenP${i}`);
            if (tok) {
                tok.style.left = (pAtual.x * s + 8) + 'px';
                tok.style.top = (pAtual.y * s + 8) + 'px';
            }
        });

        // Atualiza visual
        if (typeof updateVisuals === 'function') updateVisuals();
        if (typeof updateHeroCard === 'function') updateHeroCard();
        if (typeof updateBossCard === 'function') updateBossCard();
    }

    window.coopReproduzirSkillComSnapshot = coopReproduzirSkillComSnapshot;

    console.log('✅ [V8.8] Sincronização de skills do boss instalada.');
    console.log('   • Skills capturadas com snapshot completo');
    console.log('   • Replay restaura snapshot antes de rodar handler');
    console.log('   • Estado atual é preservado após o replay');
})();
// =================================================================
// coop.js — PATCH V8.9 (CORREÇÃO: duplicação de hooks)
// -----------------------------------------------------------------
// Bug: dois hooks em applyStorySkill causavam captura duplicada de
// skills do boss → replay rodava a skill 2 vezes (uma certa, uma errada).
//
// Correção:
//   • Remove todos os hooks anteriores de applyStorySkill
//   • Reinstala UM ÚNICO hook (o do V8.8, com snapshot)
//   • Deduplica eventos boss_skill no buffer (por segurança)
// =================================================================

(function patchV89() {
    if (window._coopV89) return;
    window._coopV89 = true;

    // ================================================================
    // FIX 1: Remove hooks anteriores de applyStorySkill
    // ================================================================
    // Verifica se applyStorySkill foi sobrescrito várias vezes.
    // Aplica uma técnica de "reset" limpando todas as camadas.
    // Como não temos acesso direto à função original do historia.js,
    // usamos uma abordagem indireta: salvamos uma referência ANTES de
    // qualquer hook ser instalado.
    //
    // ⚠️ Isso precisa rodar ANTES dos hooks serem instalados. Como
    // estamos colando no final, o hook V8.8 já está ativo. Vamos
    // reconstruir a cadeia corretamente.

    // ================================================================
    // Estratégia: desativa o hook V8.1 FIX 4 "por dentro"
    // ----------------------------------------------------------------
    // O V8.1 FIX 4 adicionava eventos com formato:
    //   { tipo: 'boss_skill', skill, skillName, enemyId, uid, role, em }
    //
    // O V8.8 adicionava eventos com formato:
    //   { tipo: 'boss_skill', skill, skillName, enemyId, snapshot, uid, role, em }
    //
    // A diferença é o campo `snapshot`. Vamos filtrar eventos SEM
    // snapshot no replay (para não rodar skills duplicadas).
    // ================================================================

    // 1.1 — Filtro no replay: ignora eventos sem snapshot
    const _origReproEvento = window.coopReproduzirEventoIndividual;
    if (typeof _origReproEvento === 'function' && !window._coopV89ReproHook) {
        window._coopV89ReproHook = true;
        const _innerRepro = window.coopReproduzirEventoIndividual;

        window.coopReproduzirEventoIndividual = async function(evento) {
            // Se é boss_skill SEM snapshot, ignora (é duplicata do V8.1)
            if (evento.tipo === 'boss_skill' && !evento.snapshot) {
                coopLog('[V8.9] Ignorando boss_skill sem snapshot (duplicata).');
                return;
            }
            return _innerRepro.apply(this, arguments);
        };

        console.log('✅ [V8.9] Filtro de duplicatas instalado no replay.');
    }

    // ================================================================
    // FIX 2: Deduplicação no BUFFER (evita evento com snapshot ser
    //        adicionado 2x se ambos os hooks rodarem)
    // ================================================================
    const _origRodarBoss = window.coopRodarBossP2;
    if (typeof _origRodarBoss === 'function' && !window._coopV89RodarHook) {
        window._coopV89RodarHook = true;
        const _innerRodar = window.coopRodarBossP2;

        window.coopRodarBossP2 = async function() {
            // Antes de rodar, limpa o buffer
            coopBufferEventosBoss = [];
            const r = await _innerRodar.apply(this, arguments);

            // Após rodar, deduplica o buffer:
            // Remove eventos boss_skill SEM snapshot (duplicatas do V8.1)
            const antes = coopBufferEventosBoss.length;
            coopBufferEventosBoss = coopBufferEventosBoss.filter(e => {
                if (e.tipo === 'boss_skill' && !e.snapshot) return false;
                return true;
            });
            const depois = coopBufferEventosBoss.length;

            if (antes !== depois) {
                coopLog(`[V8.9] Deduplicação: ${antes} → ${depois} eventos (-${antes - depois}).`);
            }

            return r;
        };
    }

    // ================================================================
    // FIX 3: Monitor — verifica se há hooks duplicados em applyStorySkill
    // ================================================================
    // Se detectarmos múltiplos hooks, avisamos no console
    setTimeout(() => {
        if (window._coopV82ApplyHook && window._coopV88ApplyHook) {
            console.warn('[V8.9] ⚠️ Detectados 2 hooks em applyStorySkill (V8.2 + V8.8).');
            console.warn('[V8.9] O filtro por snapshot deve resolver. Se ainda houver duplicata, verifique os logs.');
        }
    }, 3000);

    // ================================================================
    // FIX 4: Limpa buffer ANTES de rodar boss (evita acumulação)
    // ================================================================
    const _origCapturarBoss = window.coopRodarBossP2;
    // (já foi adicionado no FIX 2 acima — garantia dupla)

    console.log('✅ [V8.9] Correção de duplicação instalada.');
    console.log('   • Eventos boss_skill sem snapshot são ignorados no replay');
    console.log('   • Buffer é deduplicado após rodar o boss');
})();
// =================================================================
// coop.js — PATCH V9.0 (SOM DAS SKILLS DO BOSS NO REPLAY)
// -----------------------------------------------------------------
// Bug: skills do boss não tocam som no replay do P1.
//
// Causas:
//   1. audioUnlocked pode estar false no P1
//   2. Sons disparados em rápida sucessão (saturação)
//   3. playSfx usa cloneNode() que pode falhar em mobile
//
// Correção:
//   • Pré-desbloqueia áudio quando entra em coop
//   • Toca som manualmente durante replay de boss_skill
//   • Adiciona delay entre eventos pra evitar saturação
// =================================================================

(function patchV90() {
    if (window._coopV90) return;
    window._coopV90 = true;

    // ================================================================
    // FIX 1: Pré-desbloqueia áudio quando entra em modo coop
    // ================================================================
    const _origRebuild = window.coopRebuildPlayers;
    if (typeof _origRebuild === 'function' && !window._coopV90Unlock) {
        window._coopV90Unlock = true;
        const _innerRebuild = window.coopRebuildPlayers;

        window.coopRebuildPlayers = function() {
            // Desbloqueia áudio se ainda não estiver
            if (typeof audioUnlocked !== 'undefined' && !audioUnlocked) {
                if (typeof unlockAudio === 'function') {
                    try { unlockAudio(); } catch(e) {}
                }
            }
            return _innerRebuild.apply(this, arguments);
        };
    }

    // ================================================================
    // FIX 2: Mapa de som por handler de skill
    // ================================================================
    const SOM_POR_HANDLER = {
        // Ato 1
        'porco_espinho_espinhos': 'minoa1',
        'porco_espinho_bote': 'minoa1',
        'jacare_bocada': 'minoa1',
        'jacare_giro': 'minoa1',
        'cervo_investida': 'minoa1',
        'cervo_chifrada': 'atkg',
        'onca_garra_dupla': 'garras',
        'onca_salto': 'minoa2',
        // Ato 2
        'tamandua_garras': 'garras',
        'tamandua_bicada': 'atkg',
        'anta_pisada': 'minoa2',
        'anta_atropelamento': 'minoa2',
        'queixada_mordida': 'minoa1',
        'queixada_estouro': 'minoa2',
        'sucuri_bocarra': 'minoa1',
        'sucuri_caudada': 'minoa1',
        // Ato 3
        'piranha_cardume': 'minoa1',
        'piranha_frenesi': 'minoa1',
        'lontra_garras': 'garras',
        'lontra_nado': 'iara1',
        'ariranha_matilha': 'minoa1',
        'ariranha_bote': 'minoa1',
        'pirarucu_bocarra': 'minoa1',
        'pirarucu_caudada': 'minoa1',
        // Ato 4
        'cascavel_chocalho': 'garras',
        'cascavel_bote': 'atkg',
        'coral_aneis': 'minoa1',
        'coral_peconha': 'garras',
        'jararaca_bote': 'atkg',
        'jararaca_enrolar': 'minoa1',
        'tartaruga_casco': 'minoa2',
        'tartaruga_pancada': 'minoa2',
        // Ato 5
        'bode_cornada': 'atkg',
        'bode_marrada': 'atkg',
        'carneiro_trombada': 'minoa2',
        'carneiro_pisada': 'minoa2',
        'cavalo_coice': 'atkg',
        'cavalo_relincho': 'skill1',
        'touro_cornada': 'atkg',
        'touro_pisoteada': 'minoa2',
        // Ato 6
        'urubu_voo': 'atkg',
        'urubu_bicada': 'atkg',
        'carcaara_garras': 'garras',
        'carcaara_mergulho': 'atkg',
        'tatu_casco': 'minoa2',
        'tatu_cavar': 'minoa2',
        'lobo_guara_uivo': 'garras',
        'lobo_guara_bote': 'minoa1',
        // Ato 7
        'cachorro_mordida': 'minoa1',
        'cachorro_rosnado': 'garras',
        'raposa_astucia': 'minoa1',
        'raposa_bote': 'minoa1',
        'guaxinim_garras': 'garras',
        'guaxinim_surpresa': 'minoa1',
        'jaguatirica_garras': 'garras',
        'jaguatirica_salto': 'minoa2',
        // Ato 8
        'morcego_voo': 'saci1',
        'morcego_eco': 'skill1',
        'coruja_garras': 'garras',
        'coruja_voo': 'saci1',
        'sapo_veneno': 'garras',
        'sapo_lingua': 'minoa1',
        'seriema_bicada': 'atkg',
        'seriema_grito': 'minoa2',
        // Ato 9
        'tucunare_bote': 'minoa1',
        'tucunare_cardume': 'minoa1',
        'piraiba_bocarra': 'minoa1',
        'piraiba_caudada': 'minoa1',
        'dourada_escamas': 'garras',
        'dourada_nado': 'iara1',
        'peixe_boi_corpulencia': 'minoa2',
        'peixe_boi_pancada': 'minoa2',
        // Ato 10
        'bufalo_marrada': 'atkg',
        'bufalo_pisoteada': 'minoa2',
        'vaca_coice': 'atkg',
        'vaca_mugido': 'minoa2',
        'cabra_cornada': 'atkg',
        'cabra_bote': 'minoa1',
        'zebu_marrada': 'atkg',
        'zebu_pisada': 'minoa2',
        // Ato 11
        'gato_mato_garras': 'garras',
        'gato_mato_salto': 'minoa2',
        'mariposa_po': 'saci1',
        'mariposa_voo': 'saci1',
        'quati_garras': 'garras',
        'quati_bote': 'minoa1',
        'sucuarana_garra': 'garras',
        'sucuarana_salto': 'minoa2',
        // Ato 12
        'gaviao_voo': 'atkg',
        'gaviao_garras': 'garras',
        'falcao_mergulho': 'minoa2',
        'falcao_garras': 'garras',
        'urutau_canto': 'skill1',
        'urutau_voo': 'saci1',
        'aguia_garras': 'garras',
        'aguia_mergulho': 'minoa2',
        // Bosses
        'saci_vortices': 'saci1',
        'saci_diagonais': 'saci',
        'mapinguari_mordida': 'minoa1',
        'mapinguari_pedras': 'minoa2',
        'iara_tsunami': 'iara1',
        'iara_jatos': 'iara2',
        'boitata_colunas': 'skill1',
        'boitata_explosoes': 'skill1',
        'mula_relincho': 'skill1',
        'mula_bolas': 'skill1',
        'corpo_seco_vapor': 'garras',
        'corpo_seco_garras': 'garras',
        'lobisomem_garras': 'garras',
        'lobisomem_tremor': 'minoa2',
        'cuca_pocao': 'cucask1',
        'cuca_cura': 'cucask2',
        'boto_coracoes': 'boto_skill1',
        'boto_jatos': 'iara2',
        'boi_face': 'boi_skill1',
        'boi_empurrao': 'boi_skill2',
        'jaci_lua': 'saci1',
        'jaci_tempestade': 'jaci_skill2',
        'guaraci_sol': 'skill1',
        'guaraci_onda': 'guaraci_skill2',
        'anhanga_fogo': 'skill1',
        'anhanga_devora': 'cucask2',
    };

    // ================================================================
    // FIX 3: Toca som manualmente durante replay de boss_skill
    // ================================================================
    const _origReproEvento = window.coopReproduzirEventoIndividual;
    if (typeof _origReproEvento === 'function' && !window._coopV90ReproHook) {
        window._coopV90ReproHook = true;
        const _innerRepro = window.coopReproduzirEventoIndividual;

        window.coopReproduzirEventoIndividual = async function(evento) {
            // Se é boss_skill, toca o som ANTES de rodar o handler
            if (evento.tipo === 'boss_skill') {
                const handlerKey = evento.skill;
                const somNome = SOM_POR_HANDLER[handlerKey];

                if (somNome && typeof playSfx === 'function') {
                    try {
                        // Tenta desbloquear áudio primeiro
                        if (typeof audioUnlocked !== 'undefined' && !audioUnlocked) {
                            if (typeof unlockAudio === 'function') unlockAudio();
                        }
                        // Toca o som
                        playSfx(somNome);
                        coopLog('[V9.0] Som do replay:', somNome, 'para', handlerKey);
                    } catch (e) {
                        console.warn('[V9.0] Falha ao tocar som:', e);
                    }
                } else {
                    coopLog('[V9.0] Sem som mapeado para:', handlerKey);
                }

                // Pequeno delay pra garantir que o som comece
                await coopSleep(150);
            }

            return _innerRepro.apply(this, arguments);
        };

        console.log('✅ [V9.0] Som do replay instalado.');
    }

    // ================================================================
    // FIX 4: Toca som do boss_attack no replay
    // ================================================================
    const _origReproAttack = window.coopReproduzirEventoIndividual;
    if (typeof _origReproAttack === 'function' && !window._coopV90AttackHook) {
        window._coopV90AttackHook = true;
        const _innerAttack = window.coopReproduzirEventoIndividual;

        window.coopReproduzirEventoIndividual = async function(evento) {
            // Toca som de dano em boss_attack
            if (evento.tipo === 'boss_attack' && typeof playSfx === 'function') {
                try {
                    if (typeof audioUnlocked !== 'undefined' && !audioUnlocked) {
                        if (typeof unlockAudio === 'function') unlockAudio();
                    }
                    playSfx('atkg');
                } catch (e) {}
            }
            return _innerAttack.apply(this, arguments);
        };
    }

    // ================================================================
    // FIX 5: Unlock de áudio no primeiro clique dentro do tabuleiro
    // ================================================================
    if (!window._coopV90ClickUnlock) {
        window._coopV90ClickUnlock = true;
        document.addEventListener('click', function coopUnlockAudio() {
            if (typeof audioUnlocked !== 'undefined' && !audioUnlocked) {
                if (typeof unlockAudio === 'function') {
                    try { unlockAudio(); } catch(e) {}
                }
            }
            if (audioUnlocked) {
                document.removeEventListener('click', coopUnlockAudio);
            }
        }, { capture: true });
    }

    console.log('✅ [V9.0] Patch de som do replay instalado.');
    console.log('   • Pré-desbloqueio de áudio ao entrar em coop');
    console.log('   • Som mapeado para cada handler de skill do boss');
    console.log('   • Som do boss_attack no replay');
    console.log('   • Unlock de áudio no primeiro clique');
})();
STORY_PROGRESS.inventory['nucleo_abismo'] = (STORY_PROGRESS.inventory['nucleo_abismo'] || 0) + 1;
saveStoryProgress();
console.log('🌑 Núcleo do Abismo:', STORY_PROGRESS.inventory['nucleo_abismo']);
// =================================================================
// ⭐ COOP FIX — capturar skills de evento/nação (eventoAplicarSkill)
// -----------------------------------------------------------------
// No coop do Sete Nações / Sete Selados, o boss roda skills via
// eventoAplicarSkill → handler direto (NUNCA passa por applyStorySkill),
// então o hook do applyStorySkill não captura nada e o outro jogador
// vê só o dano (sem FX, sem som). Este hook captura esses eventos também.
// =================================================================
(function coopHookEventoAplicarSkill() {
    function instalar() {
        if (typeof window.eventoAplicarSkill !== 'function') return false;
        if (window._coopEventoAplicarHook) return true;
        window._coopEventoAplicarHook = true;

        const _orig = window.eventoAplicarSkill;
        window.eventoAplicarSkill = async function(enemy, skill) {
            if (coopCapturandoEventosBoss && window._coopMode && skill) {
                coopBufferEventosBoss.push({
                    tipo: 'boss_skill',
                    skill: skill.handler || skill.name || '',
                    skillName: skill.nome || skill.name || '',
                    enemyId: (enemy && enemy.id) || null,
                    enemyNome: (enemy && (enemy.nome || enemy.name)) || '',
                    enemyAtk: (enemy && Number(enemy.atk)) || 4,
                    uid: coopMeuUid(),
                    role: coopRole,
                    em: Date.now(),
                });
                coopLog('[FIX-EVT] Skill de evento capturada:', skill.nome || skill.handler);
            }
            return _orig.apply(this, arguments);
        };
        console.log('✅ [FIX-EVT] eventoAplicarSkill hookado (captura skills de nação/evento no coop).');
        return true;
    }

    if (!instalar()) {
        const check = setInterval(() => {
            if (instalar()) clearInterval(check);
        }, 200);
    }
})();
// =================================================================
// ⚔️ COOP V10.6 — O VERDADEIRO CONSERTO (P2 MATANDO BOSS)
// -----------------------------------------------------------------
// 1. P2 mata o boss: publica o estado de morte e passa a vez pro P1.
// 2. P1 vê o boss morto e processa a transição.
// 3. Bloqueia Monitor V8.5 de pular bosses.
// =================================================================

(function coopV106() {
    if (window._coopV106) return;
    window._coopV106 = true;

    // Desativa o V10.5 para não conflitar
    if (window._coopV105) window._coopV105 = false;

    console.log('✅ [V10.6] Instalando correção para P2 matando boss...');

    // -----------------------------------------------------------------
    // FIX 1 — Monitor V8.5 não pula mais bosses
    // -----------------------------------------------------------------
    const _origAdvance = window.advanceStoryEnemy;
    if (typeof _origAdvance === 'function') {
        window.advanceStoryEnemy = async function() {
            if (window._coopMode) {
                console.log('[V10.6] advanceStoryEnemy bloqueado (Monitor V8.5).');
                return;
            }
            return _origAdvance.apply(this, arguments);
        };
    }

    // -----------------------------------------------------------------
    // FIX 2 — Lógica de Morte do Boss (P2 avisa, P1 processa)
    // -----------------------------------------------------------------
    const _origProcessarMorte = window.coopProcessarMorteBoss;
    if (typeof _origProcessarMorte === 'function') {
        window.coopProcessarMorteBoss = async function() {
            if (!window._coopMode) return _origProcessarMorte.apply(this, arguments);

            // ⭐ SE FOR O P2: Não processa a fila. Apenas avisa o P1.
            if (coopRole === 'oponente') {
                if (coopProcessandoMorteBoss) return;
                coopProcessandoMorteBoss = true;
                
                console.log('[V10.6] P2 matou o boss. Passando a vez pro P1.');
                const estado = coopCapturarEstado();
                
                try {
                    await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                        'estadoJogo.boss': { ...estado.boss, dead: true, hp: 0 },
                        'estadoJogo.players': estado.players,
                        'estadoJogo.grid': estado.grid,
                        'estadoJogo.eventosTurno': [...coopEventosTurno],
                        status: 'turno_joao',
                        'estadoJogo.turnoDe': 'criador',
                        atualizadaEm: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } catch(e) { console.error(e); }
                
                coopEventosTurno = [];
                coopPausar();
                coopProcessandoMorteBoss = false;
                return;
            }

            // ⭐ SE FOR O P1: Roda o original (avança a fila) e força o turno
            await _origProcessarMorte.apply(this, arguments);
            
            if (coopRoomId) {
                try {
                    await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                        status: 'turno_joao',
                        'estadoJogo.turnoDe': 'criador',
                        atualizadaEm: firebase.firestore.FieldValue.serverTimestamp()
                    });
                } catch(e) {}
            }
        };
    }

    // -----------------------------------------------------------------
    // FIX 3 — P2 não publica "turno_boss" falso após matar
    // -----------------------------------------------------------------
    const _origAtualizarSala = window.coopAtualizarSalaNoFirestore;
    if (typeof _origAtualizarSala === 'function') {
        window.coopAtualizarSalaNoFirestore = async function(estado) {
            if (window._coopMode && coopRole === 'oponente' && estado.boss?.dead) {
                console.log('[V10.6] P2 bloqueou publicação de turno_boss (já passou pro P1).');
                return;
            }
            return _origAtualizarSala.apply(this, arguments);
        };
    }

    // -----------------------------------------------------------------
    // FIX 4 — P1 percebe o boss morto e assume a morte
    // -----------------------------------------------------------------
    const _origAplicarEstado = window.coopAplicarEstadoDoRoom;
    if (typeof _origAplicarEstado === 'function') {
        window.coopAplicarEstadoDoRoom = function(room) {
            const r = _origAplicarEstado.apply(this, arguments);
            
            if (window._coopMode && coopRole === 'criador' && room.estadoJogo?.boss?.dead && !coopProcessandoMorteBoss && !coopPartidaConcluida) {
                if (room.estadoJogo?.turnoDe === 'criador') {
                    console.log('[V10.6] P1 assumindo processamento de morte (causada pelo P2)...');
                    setTimeout(() => coopProcessarMorteBoss(), 600);
                }
            }
            return r;
        };
    }

    console.log('✅ [V10.6] Correção P2 matando boss instalada com sucesso.');
})();
// =================================================================
// 💀 PATCH V10.7 — GAME OVER IMEDIATO SE QUALQUER HERÓI MORRER
// -----------------------------------------------------------------
// No Coop, a morte de um único herói encerra a batalha em derrota.
// Isso evita que o outro jogador fique sozinho no tabuleiro.
// =================================================================

(function coopGameOverOnDeathV107() {
    if (window._coopV107) return;
    window._coopV107 = true;

    // Função central que checa a morte e encerra
    function checarMorte(t, wasDead) {
        if (window._coopMode && !coopPartidaConcluida && t && players.includes(t) && !wasDead && t.hp <= 0) {
            console.log(`[V10.7] Herói ${t.name} morreu. Game Over Coop imediato.`);
            coopPartidaConcluida = true;

            // Avisa o outro jogador via Firestore
            if (coopRoomId) {
                fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                    status: 'concluida',
                    vencedor: 'boss',
                    atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
                }).catch(e => console.warn('[V10.7] Erro ao publicar derrota:', e));
            }

            // Mostra a tela de derrota local
            setTimeout(() => {
                if (typeof coopFinalizar === 'function') {
                    coopFinalizar(false);
                }
            }, 1000);
        }
    }

    // 1. Hook no applyDmg (usado pelo Boss AI para dar dano nos heróis)
    const _origApplyDmg = window.applyDmg;
    if (typeof _origApplyDmg === 'function') {
        window.applyDmg = function(t, amt) {
            const wasDead = t ? t.dead : false;
            const r = _origApplyDmg.apply(this, arguments);
            checarMorte(t, wasDead);
            return r;
        };
    }

    // 2. Hook no coopApplyDmg (usado pelo P2 ou P1 caso haja ataque amigo, ou fallback)
    const _origCoopApplyDmg = window.coopApplyDmg;
    if (typeof _origCoopApplyDmg === 'function') {
        window.coopApplyDmg = function(t, amt) {
            const wasDead = t ? t.dead : false;
            const r = _origCoopApplyDmg.apply(this, arguments);
            checarMorte(t, wasDead);
            return r;
        };
    }

    console.log('✅ [V10.7] Patch Game Over em caso de morte de herói aplicado.');
})();
// =================================================================
// ⚔️ COOP V10.8 — CORREÇÃO DO P2 (P2 não via o novo boss)
// -----------------------------------------------------------------
// Quando o P2 matava o boss, a flag coopBossMortoNesteTurno ficava
// true. O P1 avançava a fila e mandava o novo boss (ex: Jaci), mas
// a flag travava a atualização no P2, impedindo o P2 de trocar o
// boss morto pelo novo.
// =================================================================

(function coopV108() {
    if (window._coopV108) return;
    window._coopV108 = true;

    console.log('✅ [V10.8] Instalando correção para P2 receber o novo boss...');

    const _origAplicarEstado = window.coopAplicarEstadoDoRoom;
    if (typeof _origAplicarEstado === 'function') {
        window.coopAplicarEstadoDoRoom = function(room) {
            // Se eu sou o P2 e a sala está me mandando um boss VIVO
            if (window._coopMode && coopRole === 'oponente') {
                if (room?.estadoJogo?.boss && !room.estadoJogo.boss.dead) {
                    // Eu tinha matado o boss anterior? Se sim, limpo a flag
                    // para que a trava do V8.7 não bloqueie a atualização.
                    if (window.coopBossMortoNesteTurno) {
                        console.log('[V10.8] P2 limpando flag de boss morto para aceitar o novo.');
                        window.coopBossMortoNesteTurno = false;
                    }
                    // Garante que o estado de morte local está limpo
                    coopProcessandoMorteBoss = false;
                }
            }

            return _origAplicarEstado.apply(this, arguments);
        };
    }

    console.log('✅ [V10.8] Correção P2 instalada com sucesso.');
})();
// =================================================================
// ⚔️ COOP V10.9 — DESTRAVADOR FORÇADO DO P2 (Boss Fantasma)
// -----------------------------------------------------------------
// Se o P2 receber um boss vivo da sala, limpa à força as flags
// de morte (coopProcessandoMorteBoss, coopBossMortoNesteTurno) e
// restaura o boss local para o P2 poder jogar.
// =================================================================

(function coopV109() {
    if (window._coopV109) return;
    window._coopV109 = true;

    console.log('✅ [V10.9] Instalando destravador do P2...');

    const _origAplicarEstado = window.coopAplicarEstadoDoRoom;
    if (typeof _origAplicarEstado === 'function') {
        window.coopAplicarEstadoDoRoom = function(room) {
            // Se é o P2 e a sala mandou um boss VIVO
            if (window._coopMode && coopRole === 'oponente' && room?.estadoJogo?.boss) {
                const bossRoom = room.estadoJogo.boss;
                
                if (!bossRoom.dead) {
                    // Limpa as travas de morte locais do P2
                    coopProcessandoMorteBoss = false;
                    window.coopBossMortoNesteTurno = false;
                    coopBossRunning = false;

                    // Força o boss local a aceitar a vida e o tipo da sala
                    if (boss && boss.dead) {
                        boss.dead = false;
                        console.log('[V10.9] P2 destravou o boss local (fantasma removido).');
                    }
                    boss.hp = bossRoom.hp;
                    boss.maxHp = bossRoom.maxHp;
                    boss.type = coopBossTypeNormalize(bossRoom.type);
                    
                    // Restaura a imagem do boss
                    const imgBoss = document.getElementById('imgBoss');
                    if (imgBoss) {
                        const sprite = coopGetBossSprite(boss.type);
                        if (sprite) imgBoss.src = sprite;
                    }
                }
            }
            return _origAplicarEstado.apply(this, arguments);
        };
    }

    // Monitor de segurança: se por algum motivo o listener não atualizar,
    // o monitor força o destravamento a cada 1s.
    setInterval(() => {
        if (!window._coopMode) return;
        if (coopRole !== 'oponente') return;
        if (coopPartidaConcluida) return;
        if (!coopRoomData) return;

        const bossRoom = coopRoomData.estadoJogo?.boss;
        const turnoDe = coopRoomData.estadoJogo?.turnoDe;

        // Se a sala diz que o boss tá vivo e é minha vez de jogar
        if (bossRoom && !bossRoom.dead && turnoDe === 'oponente') {
            // Se o meu boss local tá morto ou processando morte, destrava!
            if (boss.dead || coopProcessandoMorteBoss || window.coopBossMortoNesteTurno) {
                console.log('[V10.9] Monitor: P2 destravando o turno forçadamente.');
                coopProcessandoMorteBoss = false;
                window.coopBossMortoNesteTurno = false;
                boss.dead = false;
                boss.hp = bossRoom.hp;
                boss.maxHp = bossRoom.maxHp;
                
                if (typeof coopDesbloquear === 'function') coopDesbloquear();
            }
        }
    }, 1000);

    console.log('✅ [V10.9] Destravador do P2 instalado com sucesso.');
})();
// =================================================================
// 💀 PATCH V10.10 — DEATH WATCHDOG (Morte de um = Game Over)
// -----------------------------------------------------------------
// Independente de onde o dano veio, se qualquer herói chegar a 0 
// de vida, o jogo encerra imediatamente com derrota para os dois.
// =================================================================

(function coopDeathWatchdogV1010() {
    if (window._coopV1010) return;
    window._coopV1010 = true;

    console.log('✅ [V10.10] Instalando Death Watchdog (fim imediato na morte)...');

    // Monitor implacável: verifica a vida dos heróis a cada 500ms
    setInterval(() => {
        // Só age no modo coop, se o jogo estiver rolando
        if (!window._coopMode) return;
        if (coopPartidaConcluida || coopFinalizando) return;
        if (!players || players.length < 2) return;

        // Verifica se ALGUM herói (P1 ou P2) morreu
        const alguemMorreu = players.some(p => p.dead);

        if (alguemMorreu) {
            console.log('[V10.10] ⚠️ Herói morreu! Forçando fim de jogo...');
            
            // Trava tudo para não executar duas vezes
            coopPartidaConcluida = true;
            coopFinalizando = true;

            // Avisa o Firestore que quem venceu foi o Boss
            if (coopRoomId) {
                fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                    status: 'concluida',
                    vencedor: 'boss',
                    atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
                }).catch(e => console.warn('[V10.10] Erro ao publicar morte:', e));
            }

            // Mostra a tela de derrota
            setTimeout(() => {
                if (typeof coopFinalizar === 'function') {
                    coopFinalizar(false);
                }
            }, 1200);
        }
    }, 500);

    console.log('✅ [V10.10] Vigia de morte ativado.');
})();
// =================================================================
// ⚔️ COOP V10.12 — CONSERTO FINAL (PA e Morte de 1 Herói)
// -----------------------------------------------------------------
// 1. Conserta o PA: espera o ataque acabar antes de trocar de boss.
// 2. Conserta a Morte: Game Over imediato se QUALQUER herói morrer.
// =================================================================

(function coopV1012() {
    if (window._coopV1012) return;
    window._coopV1012 = true;

    console.log('✅ [V10.12] Instalando correções de PA e Fim de Jogo...');

    // -----------------------------------------------------------------
    // FIX 1 — PA matando o próximo boss (Espera o ataque acabar)
    // -----------------------------------------------------------------
    const _origProcessarMorte = window.coopProcessarMorteBoss;
    if (typeof _origProcessarMorte === 'function') {
        window.coopProcessarMorteBoss = async function() {
            if (!window._coopMode) return _origProcessarMorte.apply(this, arguments);

            // Se for o P1 e a execução do ataque ainda estiver rolando, espera.
            if (coopRole === 'criador') {
                let tentativas = 0;
                while (window.isExecutingAction && tentativas < 30) {
                    await new Promise(r => setTimeout(r, 100));
                    tentativas++;
                }
            }
            
            // Agora deixa o fluxo original (V10.6) cuidar de avançar a fila
            return _origProcessarMorte.apply(this, arguments);
        };
    }

    // -----------------------------------------------------------------
    // FIX 2 — Fim de Jogo se 1 herói morrer
    // -----------------------------------------------------------------
    const _origPublicar = window.coopPublicarEstado;
    if (typeof _origPublicar === 'function') {
        window.coopPublicarEstado = async function() {
            if (!window._coopMode) return _origPublicar.apply(this, arguments);

            // Se QUALQUER herói morrer, a gente força o fim.
            if (players && players.some(p => p.dead)) {
                if (coopPartidaConcluida) return;
                console.log('[V10.12] Herói morreu. Publicando derrota...');
                coopPartidaConcluida = true;

                if (coopRoomId) {
                    try {
                        await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                            status: 'concluida',
                            vencedor: 'boss',
                            atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
                        });
                    } catch(e) {}
                }
                
                if (typeof coopFinalizar === 'function') {
                    coopFinalizar(false);
                }
                return;
            }

            // Se todos vivos, publica normal
            return _origPublicar.apply(this, arguments);
        };
    }

    // Monitor para o P2 morrer no turno do boss (já que o P2 não publica estado quando morre)
    setInterval(() => {
        if (!window._coopMode) return;
        if (coopPartidaConcluida || coopFinalizando) return;
        if (!players || players.length < 2) return;

        if (players.some(p => p.dead)) {
            console.log('[V10.12] Monitor: Herói morto detectado. Encerrando...');
            coopPartidaConcluida = true;
            
            if (coopRoomId) {
                fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                    status: 'concluida',
                    vencedor: 'boss',
                    atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
                }).catch(() => {});
            }

            setTimeout(() => {
                if (typeof coopFinalizar === 'function') coopFinalizar(false);
            }, 1000);
        }
    }, 500);

    console.log('✅ [V10.12] Conserto final aplicado com sucesso.');
})();
// =================================================================
// 💀 COOP V10.13 — COMUNICAÇÃO DE GAME OVER E TELA DE DERROTA
// -----------------------------------------------------------------
// 1. Se alguém morrer, a sala é trancada em "concluida".
// 2. O P2 não consegue mais sobrescrever o "concluida" com "turno".
// 3. Troca o alert() feio pela tela de derrota do jogo.
// =================================================================

(function coopV1013() {
    if (window._coopV1013) return;
    window._coopV1013 = true;

    console.log('✅ [V10.13] Instalando comunicação de Game Over...');

    // -----------------------------------------------------------------
    // FIX 1 — Bloquear publicação se a partida já acabou
    // -----------------------------------------------------------------
    const _origAtualizar = window.coopAtualizarSalaNoFirestore;
    if (typeof _origAtualizar === 'function') {
        window.coopAtualizarSalaNoFirestore = async function(estado) {
            // Se a partida já era pra ter acabado, o P2 NÃO pode
            // sobrescrever o status 'concluida' com 'turno_joao'.
            if (coopPartidaConcluida) {
                console.log('[V10.13] Publicação bloqueada: partida já concluída.');
                return;
            }
            return _origAtualizar.apply(this, arguments);
        };
    }

    // O mesmo para o publicar estado básico
    const _origPublicar = window.coopPublicarEstado;
    if (typeof _origPublicar === 'function') {
        window.coopPublicarEstado = async function() {
            if (coopPartidaConcluida) return;
            return _origPublicar.apply(this, arguments);
        };
    }

    // -----------------------------------------------------------------
    // FIX 2 — O P2 recebe o 'concluida' e destrava na hora
    // -----------------------------------------------------------------
    // Substitui o listener para garantir que o P2 não ignore o fim de jogo
    // se a flag coopFinalizando estiver ativa por algum motivo.
    const _origListener = window.coopInstalarListener;
    if (typeof _origListener === 'function') {
        window.coopInstalarListener = function() {
            const r = _origListener.apply(this, arguments);
            
            // Adiciona um monitor para o P2 que checa o Firestore
            setInterval(() => {
                if (!window._coopMode || coopRole !== 'oponente') return;
                if (coopFinalizando) return;

                // Se a sala no Firestore diz que concluiu, força a finalização
                if (coopRoomData && coopRoomData.status === 'concluida') {
                    console.log('[V10.13] P2 detectou conclusão. Encerrando tela...');
                    coopPartidaConcluida = true;
                    if (typeof coopFinalizar === 'function') {
                        coopFinalizar(coopRoomData.vencedor === 'jogadores');
                    }
                }
            }, 1000);

            return r;
        };
    }

    // -----------------------------------------------------------------
    // FIX 3 — Tela de Derrota Bonita (Substitui o Alert)
    // -----------------------------------------------------------------
    const _origFinalizar = window.coopFinalizar;
    if (typeof _origFinalizar === 'function') {
        window.coopFinalizar = async function(vitoria) {
            if (coopContent) {
                return _origFinalizar.apply(this, arguments);
            }
            // Se for derrota, mostra a tela bonita do jogo
            if (!vitoria) {
                if (typeof stopAllAudio === 'function') stopAllAudio();
                
                // Avisa o Firestore que acabou (por segurança)
                if (coopRoomId) {
                    fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                        status: 'concluida',
                        vencedor: 'boss'
                    }).catch(() => {});
                }

                // Limpa a sala local para não voltar pra ela
                const salaId = coopRoomId;
                coopRoomId = null;
                coopPartidaConcluida = true;

                // Mostra o overlay de derrota padrão do jogo
                if (typeof showStoryDefeatScreen === 'function') {
                    showStoryDefeatScreen({ name: 'Batalha Coop' }, []);
                } else if (typeof showEndGame === 'function') {
                    showEndGame("GAME OVER", false);
                } else {
                    uiAviso("💀 DERROTA COOP...");
                }

                // Volta para a aldeia após alguns segundos (quando fechar a tela)
                // O botão da tela de derrota já chama a função de voltar.
                return;
            }

            // Se for vitória, deixa o fluxo original cuidar
            return _origFinalizar.apply(this, arguments);
        };
    }

    console.log('✅ [V10.13] Comunicação de Game Over instalada.');
})();
// =================================================================
// ⚔️ COOP V10.14 — FIX HP DOBRADO E BOTÃO DE RETRY
// -----------------------------------------------------------------
// 1. Impede que o P2 dobre o HP ao ler o estado da sala.
// 2. Remove o botão "Tentar Novamente" da tela de derrota.
// =================================================================

(function coopV1014() {
    if (window._coopV1014) return;
    window._coopV1014 = true;

    console.log('✅ [V10.14] Instalando correções de HP e Retry...');

    // -----------------------------------------------------------------
    // FIX 1 — Impedir HP Dobrado
    // -----------------------------------------------------------------
    const _origRebuild = window.coopRebuildPlayers;
    if (typeof _origRebuild === 'function') {
        window.coopRebuildPlayers = function() {
            const rd = coopRoomData || {};
            const temEstado = rd.estadoJogo && rd.estadoJogo.players && rd.estadoJogo.players.length === 2;
            
            // Chama o rebuild original (que aplica o bônus de nível erroneamente)
            const r = _origRebuild.apply(this, arguments);
            
            // ⭐ SE O ESTADO VEIO DO FIRESTORE: O HP JÁ ESTÁ CALCULADO!
            // Vamos reverter o bônus que foi somado por engano.
            if (temEstado && players && players.length === 2) {
                players.forEach((p, i) => {
                    const estadoP = rd.estadoJogo.players[i];
                    if (estadoP && p.levelBonusApplied) {
                        // O HP verdadeiro é o que veio do Firestore
                        p.maxHp = estadoP.maxHp;
                        p.hp = estadoP.hp;
                        console.log(`[V10.14] HP de ${p.name} restaurado do Firestore: ${p.hp}/${p.maxHp}`);
                    }
                });
                if (typeof updateVisuals === 'function') updateVisuals();
                if (typeof updateHeroCard === 'function') updateHeroCard();
            }
            return r;
        };
    }

    // -----------------------------------------------------------------
    // FIX 2 — Remover o botão "Tentar Novamente" (Retry)
    // -----------------------------------------------------------------
    const _origFinalizar = window.coopFinalizar;
    if (typeof _origFinalizar === 'function') {
        window.coopFinalizar = async function(vitoria) {
            const r = await _origFinalizar.apply(this, arguments);
            
            // Se for derrota, a tela do história.js é montada.
            // A gente espera 100ms e remove o botão quebrado.
            if (!vitoria) {
                setTimeout(() => {
                    const btns = document.querySelectorAll('#storyVictoryOverlay .story-result-btn');
                    btns.forEach(btn => {
                        if (btn.innerHTML.includes('TENTAR NOVAMENTE') || btn.innerHTML.includes('retryStoryPhase')) {
                            btn.remove();
                            console.log('[V10.14] Botão "Tentar Novamente" removido da tela de Coop.');
                        }
                    });
                }, 100);
            }
            return r;
        };
    }

    console.log('✅ [V10.14] Correções aplicadas com sucesso.');
})();
// =================================================================
// ⚔️ COOP V10.19 — FIM DO HP FANTASMA E BOTÃO RETRY
// =================================================================

(function coopV1019() {
    if (window._coopV1019) return;
    window._coopV1019 = true;

    console.log('✅ [V10.19] Aplicando correção do HP Fantasma (Placeholder)...');

    // -----------------------------------------------------------------
    // FIX 1 — Corrigir o HP do P2 antes de montar o tabuleiro
    // -----------------------------------------------------------------
    const _origRebuild = window.coopRebuildPlayers;
    if (typeof _origRebuild === 'function') {
        window.coopRebuildPlayers = function() {
            const rd = coopRoomData || {};
            
            if (rd.estadoJogo && rd.estadoJogo.players) {
                const p2State = rd.estadoJogo.players[1];
                const p2Class = rd.oponente?.heroiClass || playerConfigs[1].class || 'Tupa';
                
                // Se o estado no Firestore diz que é Tupã, mas a sala diz que é Sumé
                // (ou seja, o P2 acabou de entrar e o HP é do fantasma):
                if (p2State && p2State.class !== p2Class) {
                    const dataO = (typeof STORY_HERO_CLASSES !== 'undefined') ? STORY_HERO_CLASSES[p2Class] : null;
                    const baseHp = dataO?.hp || 8; // Pega o HP base real do Sumé (8)
                    
                    // Corrige o estado antes que o jogo leia
                    p2State.class = p2Class;
                    p2State.hp = baseHp;
                    p2State.maxHp = baseHp;
                    
                    console.log(`[V10.19] HP do P2 corrigido do fantasma (16) para ${p2Class} (${baseHp}).`);
                }
            }

            // Roda o rebuild original com o estado já corrigido
            return _origRebuild.apply(this, arguments);
        };
    }

    // -----------------------------------------------------------------
    // FIX 2 — Remover o botão "Tentar Novamente" na tela de derrota
    // -----------------------------------------------------------------
    const observer = new MutationObserver(() => {
        // O botão tem o onclick="retryStoryPhase()"
        const btn = document.querySelector('button[onclick="retryStoryPhase()"]');
        if (btn) {
            btn.remove();
            console.log('[V10.19] Botão "Tentar Novamente" removido da tela.');
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('✅ [V10.19] Correções aplicadas com sucesso.');
})();
// =================================================================
// ⚔️ COOP V10.21 — A CURA DEFINITIVA DO HP (Firestore não sobrescreve)
// =================================================================

(function coopV1021() {
    if (window._coopV1021) return;
    window._coopV1021 = true;

    console.log('✅ [V10.21] Protegendo o HP contra o atraso do Firestore...');

    // -----------------------------------------------------------------
    // FIX 1 — Ignorar o HP do Firestore se for o Fantasma
    // -----------------------------------------------------------------
    const _origAplicar = window.coopAplicarEstadoDoRoom;
    if (typeof _origAplicar === 'function') {
        window.coopAplicarEstadoDoRoom = function(room) {
            // Antes do jogo aplicar o estado, a gente filtra o HP
            if (room?.estadoJogo?.players && players.length >= 2) {
                room.estadoJogo.players.forEach((pData, i) => {
                    // Se a classe no Firestore é DIFERENTE da classe local
                    // (ex: Firestore tem Tupa de placeholder, mas o player é Sume)
                    if (players[i] && pData.class !== players[i].class) {
                        // Nós ignoramos o HP do Firestore e forçamos o HP local
                        pData.hp = players[i].hp;
                        pData.maxHp = players[i].maxHp;
                        pData.class = players[i].class;
                        console.log(`[V10.21] Firestore tentou sobrescrever HP com ${pData.class}. Ignorado. Mantendo ${players[i].class} com ${players[i].hp} HP.`);
                    }
                });
            }
            return _origAplicar.apply(this, arguments);
        };
    }

    // -----------------------------------------------------------------
    // FIX 2 — Remover o botão "Tentar Novamente" (Retry)
    // -----------------------------------------------------------------
    const observer = new MutationObserver(() => {
        const btns = document.querySelectorAll('#storyVictoryOverlay .story-result-btn');
        btns.forEach(btn => {
            if (btn.innerHTML.includes('TENTAR NOVAMENTE') || btn.getAttribute('onclick')?.includes('retryStoryPhase')) {
                btn.remove();
                console.log('[V10.21] Botão "Tentar Novamente" removido da tela.');
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('✅ [V10.21] Correções aplicadas.');
})();
// =================================================================
// ⚔️ ONLINE V10.23 — O FIM DOS BÔNUS FANTASMAS (PVP e COOP)
// -----------------------------------------------------------------
// 1. Desativa Títulos no PVP e no Coop.
// 2. Impede duplicação de Nível no PVP.
// 3. Impede duplicação de Nível no Coop.
// =================================================================

(function onlineFixHpV1023() {
    if (window._onlineFixHpV1023) return;
    window._onlineFixHpV1023 = true;

    console.log('✅ [V10.23] Instalando correção de HP (PVP + Coop)...');

    // -----------------------------------------------------------------
    // FIX 1 — Desativar Títulos no PVP e Coop (Evita o +3 fantasma)
    // -----------------------------------------------------------------
    const _origInitGame = window.initGame;
    if (typeof _origInitGame === 'function') {
        window.initGame = async function() {
            const isOnline = window._pvpMode || window._coopMode;
            let tituloSalvo = null;

            if (isOnline && typeof ACTIVE_TITLE !== 'undefined' && ACTIVE_TITLE !== null) {
                tituloSalvo = ACTIVE_TITLE;
                window.ACTIVE_TITLE = null; // Desativa o título na inicialização
            }

            const r = await _origInitGame.apply(this, arguments);

            if (isOnline && typeof ACTIVE_TITLE !== 'undefined' && tituloSalvo !== null) {
                window.ACTIVE_TITLE = tituloSalvo; // Restaura
            }
            return r;
        };
    }

    // -----------------------------------------------------------------
    // FIX 2 — Bloquear duplicação de Nível no PVP
    // -----------------------------------------------------------------
    const _origPvpRebuild = window.pvpRebuildPlayers;
    if (typeof _origPvpRebuild === 'function') {
        window.pvpRebuildPlayers = function() {
            const temEstado = pvpRoomData?.estadoJogo?.players?.length === 2;

            if (temEstado) {
                const _origLvlBonus = window.getHeroBonusFromLevel;
                const _origEquip = window.applyHeroEquipment;
                const _origTitle = window.applyTitleBonus;

                window.getHeroBonusFromLevel = () => ({ hp: 0, atk: 0, formAtk: 0, paAtk: 0 });
                window.applyHeroEquipment = () => {};
                window.applyTitleBonus = () => {};

                const r = _origPvpRebuild.apply(this, arguments);

                window.getHeroBonusFromLevel = _origLvlBonus;
                window.applyHeroEquipment = _origEquip;
                window.applyTitleBonus = _origTitle;
                return r;
            }
            return _origPvpRebuild.apply(this, arguments);
        };
    }

    // -----------------------------------------------------------------
    // FIX 3 — Bloquear duplicação de Nível no COOP (A correção faltante)
    // -----------------------------------------------------------------
    const _origCoopRebuild = window.coopRebuildPlayers;
    if (typeof _origCoopRebuild === 'function') {
        window.coopRebuildPlayers = function() {
            const temEstado = coopRoomData?.estadoJogo?.players?.length === 2;

            if (temEstado) {
                const _origLvlBonus = window.getHeroBonusFromLevel;
                const _origEquip = window.applyHeroEquipment;
                const _origTitle = window.applyTitleBonus;

                window.getHeroBonusFromLevel = () => ({ hp: 0, atk: 0, formAtk: 0, paAtk: 0 });
                window.applyHeroEquipment = () => {};
                window.applyTitleBonus = () => {};

                const r = _origCoopRebuild.apply(this, arguments);

                window.getHeroBonusFromLevel = _origLvlBonus;
                window.applyHeroEquipment = _origEquip;
                window.applyTitleBonus = _origTitle;
                return r;
            }
            return _origCoopRebuild.apply(this, arguments);
        };
    }

    console.log('✅ [V10.23] Correção aplicada no PVP e no Coop.');
})();
// =================================================================
// ⚔️ ONLINE V10.24 — O FIM DA DUPLICAÇÃO DE NÍVEL (A Causa Real)
// -----------------------------------------------------------------
// O Coop iniciava o bônus de nível pela História e depois o
// coopRebuildPlayers somava de novo. Este patch aplica uma trava
// global para garantir que o nível só suba uma vez.
// =================================================================

(function onlineFixHpV1024() {
    if (window._onlineFixHpV1024) return;
    window._onlineFixHpV1024 = true;

    console.log('✅ [V10.24] Instalando trava global contra bônus duplo...');

    // -----------------------------------------------------------------
    // FIX 1 — Travar o bônus de nível (Evita o 12 + 3 + 3 = 18)
    // -----------------------------------------------------------------
    const _origApplyLevel = window.applyHeroLevelBonus;
    if (typeof _origApplyLevel === 'function') {
        window.applyHeroLevelBonus = function(player) {
            if (!player) return;
            
            // Se o bônus já foi aplicado neste herói, não soma de novo
            if (player.levelBonusApplied) {
                return; 
            }
            
            // Aplica o bônus (12 + 3 = 15) e marca a flag
            _origApplyLevel.apply(this, arguments);
            player.levelBonusApplied = true;
        };
    }

    // -----------------------------------------------------------------
    // FIX 2 — Bloquear Títulos no Online
    // -----------------------------------------------------------------
    // Garante que o Título não entre no PVP nem no Coop, independente de onde seja chamado
    const _origApplyTitle = window.applyTitleBonus;
    if (typeof _origApplyTitle === 'function') {
        window.applyTitleBonus = function(player) {
            if (window._pvpMode || window._coopMode || window._eventoAtivo) {
                return; // Ignora títulos nos modos online
            }
            return _origApplyTitle.apply(this, arguments);
        };
    }

    console.log('✅ [V10.24] Nível travado. PVP e Coop devem ficar com o HP correto.');
})();
// =================================================================
// ⚔️ ONLINE V10.25 — O CONSERTO FINAL DOS STATUS (TÍTULO E ATK)
// -----------------------------------------------------------------
// 1. Desativa o V10.24 (que quebrou o ATK).
// 2. Remove o Título de todos os heróis no PVP e Coop.
// 3. Força a soma do Bônus de Nível e Equipamento no ATK.
// =================================================================

(function onlineFixStatsV1025() {
    if (window._onlineFixStatsV1025) return;
    window._onlineFixStatsV1025 = true;

    // Desativa a trava do V10.24 (que impedia o cálculo do ATK)
    window._onlineFixHpV1024 = false;

    console.log('✅ [V10.25] Instalando correção de ATK e Títulos...');

    const _origInit = window.initGame;
    if (typeof _origInit === 'function') {
        window.initGame = async function() {
            const r = await _origInit.apply(this, arguments);

            // Se estamos no PVP ou Coop, a gente conserta os status
            if (window._pvpMode || window._coopMode) {
                if (!players || players.length === 0) return r;

                players.forEach(p => {
                    // 1. DESTRUIR O TÍTULO
                    p.titleBonus = null;

                    // 2. APLICAR O BÔNUS DE NÍVEL NO ATK
                    if (!p.levelBonusApplied && typeof getHeroBonusFromLevel === 'function') {
                        const b = getHeroBonusFromLevel(p.class) || {};
                        // Soma o ATK do nível direto no bonusAtk
                        p.bonusAtk = (p.bonusAtk || 0) + (b.atk || 0);
                        p.levelBonusApplied = true;
                    }

                    // 3. APLICAR O EQUIPAMENTO (Arma/Amuleto)
                    if (!p.equipApplied && typeof applyHeroEquipment === 'function') {
                        try { 
                            applyHeroEquipment(p); 
                            p.equipApplied = true; 
                        } catch(e) {}
                    }
                });

                // Atualiza a tela para mostrar os valores corretos (3 + 6.5 = 9.5)
                if (typeof updateHeroCard === 'function') updateHeroCard();
                if (typeof updateVisuals === 'function') updateVisuals();
            }
            return r;
        };
    }

    console.log('✅ [V10.25] Status calculados (sem Título, com Nível e Arma).');
})();
// =================================================================
// ⚔️ ONLINE V10.32 — O ISOLAMENTO DO HP DO P2 (O Fim do Fantasma 15)
// -----------------------------------------------------------------
// O P2 estava herdando a vida do P1 (15) porque o Firestore carregava
// o estado do placeholder ou do save anterior. Este patch força o P2
// a assumir a vida base real do herói dele, ignorando o resto.
// =================================================================

(function fixP2HpIsolationV1032() {
    if (window._fixP2HpIsolationV1032) return;
    window._fixP2HpIsolationV1032 = true;

    console.log('✅ [V10.32] Isolando HP do P2 (PVP e Coop)...');

    function limparHpPlaceholder(rd, meuIdx, playerConfigsArray) {
        if (!rd?.estadoJogo?.players) return;
        
        const p2Data = rd.estadoJogo.players[1];
        if (!p2Data) return;

        // Se eu sou o P2 (meuIdx === 1)
        if (meuIdx === 1) {
            const heroOponente = rd.oponente?.heroiClass || playerConfigsArray[1]?.class || 'Tupa';
            const dataO = (typeof STORY_HERO_CLASSES !== 'undefined') ? STORY_HERO_CLASSES[heroOponente] : null;
            const baseHp = dataO?.hp || 8;

            // Se a classe no Firestore é diferente da minha classe real
            // OU se o HP atual é maior que o meu HP base + um limite seguro (ex: +10)
            // Significa que eu peguei o HP do P1 ou do Placeholder.
            if (p2Data.class !== heroOponente || p2Data.maxHp > (baseHp + 10)) {
                console.log(`[V10.32] HP do P2 limpo: ${p2Data.maxHp} -> ${baseHp} (Base do ${heroOponente})`);
                p2Data.class = heroOponente;
                p2Data.hp = baseHp;
                p2Data.maxHp = baseHp;
            }
        }
    }

    // Hook no PVP
    const _origPvpRebuild = window.pvpRebuildPlayers;
    if (typeof _origPvpRebuild === 'function') {
        window.pvpRebuildPlayers = function() {
            limparHpPlaceholder(pvpRoomData, pvpMeuIdx(), playerConfigs);
            return _origPvpRebuild.apply(this, arguments);
        };
    }

    // Hook no Coop
    const _origCoopRebuild = window.coopRebuildPlayers;
    if (typeof _origCoopRebuild === 'function') {
        window.coopRebuildPlayers = function() {
            limparHpPlaceholder(coopRoomData, coopMeuIdx(), playerConfigs);
            return _origCoopRebuild.apply(this, arguments);
        };
    }

    console.log('✅ [V10.32] Correção aplicada. O P2 agora terá a vida real dele.');
})();
// =================================================================
// ⚔️ ONLINE V10.33 — HP DO P2 FORÇADO E ISOLADO (Definitivo)
// -----------------------------------------------------------------
// Se o navegador for do P2, ele recalcula a própria vida e ignora o
// Firestore. Se for do P1, ele limpa o placeholder para a vida base.
// =================================================================

(function fixP2HpV1033() {
    if (window._fixP2HpV1033) return;
    window._fixP2HpV1033 = true;

    console.log('✅ [V10.33] Isolamento forçado de HP no PVP e Coop...');

    function fixP2State(rd, meuIdx, heroOponente) {
        if (!rd || !rd.estadoJogo || !rd.estadoJogo.players || !rd.estadoJogo.players[1]) return;
        const p2Data = rd.estadoJogo.players[1];

        if (meuIdx === 1) {
            // ⭐ EU SOU O P2. Ignoro o Firestore e calculo meu HP real.
            const dataO = STORY_HERO_CLASSES[heroOponente];
            const baseHp = dataO ? dataO.hp : 8;
            let bonusHp = 0;
            
            if (typeof getHeroBonusFromLevel === 'function') {
                bonusHp += getHeroBonusFromLevel(heroOponente).hp || 0;
            }
            if (typeof getHeroEquipment === 'function' && typeof getAmuletById === 'function') {
                const eq = getHeroEquipment(heroOponente);
                if (eq && eq.amuleto) {
                    const a = getAmuletById(eq.amuleto);
                    if (a && a.efeito) bonusHp += a.efeito.hpBonus || 0;
                }
            }
            
            p2Data.class = heroOponente;
            p2Data.maxHp = baseHp + bonusHp;
            p2Data.hp = baseHp + bonusHp;
            console.log(`[V10.33] P2 auto-corrigido. HP real: ${p2Data.maxHp}`);
            
        } else if (meuIdx === 0) {
            // ⭐ EU SOU O P1. Vejo o P2 placeholder.
            if (rd.oponente && rd.oponente.uid && p2Data.class !== heroOponente) {
                const dataO = STORY_HERO_CLASSES[heroOponente];
                const baseHp = dataO ? dataO.hp : 8;
                p2Data.class = heroOponente;
                p2Data.maxHp = baseHp;
                p2Data.hp = baseHp;
                console.log(`[V10.33] P1 limpou placeholder do P2. HP base: ${baseHp}`);
            }
        }
    }

    // Aplica no PVP
    const _origPvpRebuild = window.pvpRebuildPlayers;
    if (typeof _origPvpRebuild === 'function') {
        window.pvpRebuildPlayers = function() {
            if (typeof pvpRoomData !== 'undefined' && typeof pvpMeuIdx === 'function') {
                const heroOponente = pvpRoomData?.oponente?.heroiClass || 'Tupa';
                fixP2State(pvpRoomData, pvpMeuIdx(), heroOponente);
            }
            return _origPvpRebuild.apply(this, arguments);
        };
    }

    // Aplica no Coop
    const _origCoopRebuild = window.coopRebuildPlayers;
    if (typeof _origCoopRebuild === 'function') {
        window.coopRebuildPlayers = function() {
            if (typeof coopRoomData !== 'undefined' && typeof coopMeuIdx === 'function') {
                const heroOponente = coopRoomData?.oponente?.heroiClass || 'Tupa';
                fixP2State(coopRoomData, coopMeuIdx(), heroOponente);
            }
            return _origCoopRebuild.apply(this, arguments);
        };
    }

    console.log('✅ [V10.33] O HP do P2 agora é 100% independente e calculado localmente.');
})();

(function integrarConteudosNoCoop() {
    if (window._integrarConteudosNoCoop) return;
    window._integrarConteudosNoCoop = true;

    const style = document.createElement('style');
    style.textContent = `
        .coop-content-button {
            display: block;
            width: 100%;
            margin-top: 8px;
            padding: 8px 10px;
            color: #fff5dc;
            background: linear-gradient(135deg, #3b562e, #1d321b);
            border: 1px solid #8ac070;
            border-radius: 5px;
            cursor: pointer;
            font: 700 .78rem 'Cinzel', serif;
            letter-spacing: .5px;
        }
        .coop-content-button:hover:not(:disabled) { filter: brightness(1.2); }
        .coop-content-button:disabled { opacity: .45; cursor: not-allowed; }
    `;
    document.head.appendChild(style);

    function dificuldadeAtual(tipo) {
        if (tipo === 'selados') return STORY_PROGRESS.eventoDificuldade || 'normal';
        return typeof storyCurrentDifficulty !== 'undefined'
            ? storyCurrentDifficulty
            : STORY_PROGRESS.difficulty || 'normal';
    }

    function abrirConteudo(tipo, id, phaseId) {
        const difficulty = dificuldadeAtual(tipo);
        let content;
        if (tipo === 'selados') {
            const boss = window.EVENTO_BOSSES?.[id];
            content = {
                type: 'selados',
                bossId: id,
                phaseId: String(phaseId),
                difficulty,
                title: `${boss?.nome || id} — Fase ${phaseId}`,
            };
        } else {
            const nacao = window.NACOES?.[id];
            content = {
                type: 'nacoes',
                nacaoId: id,
                phaseId: String(phaseId),
                difficulty,
                title: `${nacao?.nome || id} — Fase ${phaseId}`,
            };
        }
        window.coopCriarSala(0, content.title, content);
    }

    window.coopAbrirConteudo = abrirConteudo;

    function identificarBossEvento(screen) {
        const title = screen.querySelector('.story-title')?.textContent || '';
        for (const [id, boss] of Object.entries(window.EVENTO_BOSSES || {})) {
            if (boss.nome && title.includes(boss.nome)) return id;
        }
        return window.getBossDoDia?.()?.id || null;
    }

    function inserirBotoes() {
        const screen = document.getElementById('storyScreen');
        if (!screen?.classList.contains('active')) return;

        const bossId = identificarBossEvento(screen);
        if (bossId) {
            screen.querySelectorAll('.evento-fase-card').forEach(card => {
                if (card.querySelector('.coop-content-button')) return;
                const label = card.querySelector('.evento-fase-num')?.textContent || '';
                const phase = /BOSS/i.test(label) ? 'boss' : label.match(/FASE\s+(\d+)/i)?.[1];
                if (!phase) return;
                const button = document.createElement('button');
                button.className = 'coop-content-button';
                button.textContent = '🎮 CRIAR SALA COOP';
                button.disabled = card.classList.contains('bloqueada');
                button.onclick = event => {
                    event.stopPropagation();
                    abrirConteudo('selados', bossId, phase);
                };
                card.appendChild(button);
            });
        }

        const nacaoId = window._nacaoAtual;
        if (!nacaoId || !window.NACOES?.[nacaoId]) return;
        screen.querySelectorAll('.nacao-fase-card').forEach(card => {
            if (card.querySelector('.coop-content-button')) return;
            const label = card.querySelector('.nacao-fase-num')?.textContent || '';
            const phase = label.match(/FASE\s+(\d+)/i)?.[1];
            if (!phase) return;
            const button = document.createElement('button');
            button.className = 'coop-content-button';
            button.textContent = '🎮 CRIAR SALA COOP';
            button.disabled = card.classList.contains('bloqueada');
            button.onclick = event => {
                event.stopPropagation();
                abrirConteudo('nacoes', nacaoId, phase);
            };
            card.appendChild(button);
        });
    }

    setInterval(inserirBotoes, 800);
})();
// =================================================================
// COOP — V11.0 — Fix nações + corrupção sincronizada
// -----------------------------------------------------------------
// 1. Nações/eventos: skills com snapshot (para replay do P2)
// 2. corruptedTiles no publish (V8.7 dropava)
// 3. Só P1 dispara corrupção em coop (P2 espera sync)
// 4. Reaplica corrupção após qualquer render
// =================================================================
(function coopV11() {
    if (window._coopV11) return;
    window._coopV11 = true;

    console.log('✅ [V11] Instalando correções de coop...');

    // =============================================================
    // FIX 1 — eventoAplicarSkill captura com snapshot (nações/eventos)
    // =============================================================
    function _instalarHookEventoSkill() {
        if (typeof window.eventoAplicarSkill !== 'function') return false;
        if (window._coopEventoAplicarHookV11) return true;
        window._coopEventoAplicarHookV11 = true;

        const _orig = window.eventoAplicarSkill;
        window.eventoAplicarSkill = async function(enemy, skill) {
            if (coopCapturandoEventosBoss && window._coopMode && skill) {
                const bossSnapshot = {
                    x: boss.x, y: boss.y, hp: boss.hp, maxHp: boss.maxHp,
                    type: boss.type, dead: boss.dead,
                };
                const playersSnapshot = players.map(p => ({
                    id: p.id, x: p.x, y: p.y, hp: p.hp, maxHp: p.maxHp,
                    dead: p.dead, element: p.element, class: p.class,
                }));
                const gridSnapshot = [...grid];
                const amuletsSnapshot = [...amulets];

                coopBufferEventosBoss.push({
                    tipo: 'boss_skill',
                    skill: skill.handler || skill.name || '',
                    skillName: skill.nome || skill.name || '',
                    enemyId: enemy?.id || null,
                    enemyNome: enemy?.nome || enemy?.name || '',
                    enemyAtk: Number(enemy?.atk) || 4,
                    snapshot: {
                        boss: bossSnapshot,
                        players: playersSnapshot,
                        grid: gridSnapshot,
                        amulets: amuletsSnapshot,
                    },
                    uid: coopMeuUid(),
                    role: coopRole,
                    em: Date.now(),
                });
                coopLog('[V11] Skill de nação/evento capturada com snapshot:', skill.nome || skill.handler);
            }
            return _orig.apply(this, arguments);
        };
        console.log('✅ [V11] eventoAplicarSkill hookado com snapshot.');
        return true;
    }

    if (!_instalarHookEventoSkill()) {
        const t = setInterval(() => {
            if (_instalarHookEventoSkill()) clearInterval(t);
        }, 200);
    }

    // =============================================================
    // FIX 2 — Substituir coopAtualizarSalaNoFirestore
    //        (reimplementa V8.7 + V10.6 + V10.13 com corruptedTiles)
    // =============================================================
    window.coopAtualizarSalaNoFirestore = async function(estado) {
        // --- Guard V10.13 ---
        if (coopPartidaConcluida) {
            coopLog('[V11] Publicação bloqueada: partida já concluída.');
            return;
        }
        // --- Guard V10.6 (P2 com boss morto) ---
        if (window._coopMode && coopRole === 'oponente' && estado.boss?.dead) {
            coopLog('[V11] P2 com boss morto: bloqueando publicação.');
            return;
        }

        const bossMorto = estado.boss.dead;
        const temProximoInimigo = Array.isArray(storyEnemiesRemaining)
                                  && storyEnemiesRemaining.length > 1;

        // --- Guard V8.6 (boss morto) ---
        if (bossMorto && !temProximoInimigo) {
            window.coopBossMortoNesteTurno = true;
            return;
        }
        if (bossMorto && temProximoInimigo) {
            window.coopBossMortoNesteTurno = true;
            return;
        }

        const todosMortos = estado.players.every(p => p.dead);

        // --- Derrota ---
        if (todosMortos) {
            coopPartidaConcluida = true;
            try {
                await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                    status: 'concluida',
                    vencedor: 'boss',
                    'estadoJogo.boss': estado.boss,
                    'estadoJogo.players': estado.players,
                    'estadoJogo.corruptedTiles': estado.corruptedTiles || [],
                    atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
                });
            } catch (e) { console.error('[V11] Erro ao publicar derrota:', e); }
            return;
        }

        // --- Fluxo normal (com corruptedTiles) ---
        const eventos = [...coopEventosTurno];
        const update = {
            'estadoJogo.grid': estado.grid,
            'estadoJogo.amulets': estado.amulets,
            'estadoJogo.corruptedTiles': estado.corruptedTiles || [], // ⭐ FIX
            'estadoJogo.players': estado.players,
            'estadoJogo.boss': estado.boss,
            'estadoJogo.ultimaAcao': {
                tipo: coopRole === 'criador' ? 'turno_criador' : 'turno_maria',
                resumo: `${players[coopMeuIdx()]?.name} jogou`,
                em: Date.now(),
            },
            'estadoJogo.eventosTurno': eventos,
            atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
        };
        if (estado.raid) update['estadoJogo.raid'] = estado.raid;

        if (coopRole === 'criador') {
            update.status = 'turno_maria';
            update['estadoJogo.turnoDe'] = 'oponente';
        } else {
            update.status = 'turno_boss';
            update['estadoJogo.turnoDe'] = 'boss';
        }

        await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update(update);
        coopLog('[V11] Sala atualizada:', update.status,
                '| corrompidos:', (estado.corruptedTiles || []).length);

        coopEventosTurno = [];

        if (update.status === 'turno_boss' && coopRole === 'oponente') {
            setTimeout(() => coopRodarBossP2(), 800);
            return;
        }
        if (update.status === 'concluida') {
            coopFinalizar(true);
            return;
        }
        coopPausar();
    };

    // =============================================================
    // FIX 3 — Só P1 (host) dispara corrupção em coop
    //        P2 espera o sync
    // =============================================================
    function _instalarHookCorrupcao() {
        if (typeof window.triggerTabuleiroCorrompido !== 'function') return false;
        if (window._coopCorrGuardV11) return true;
        window._coopCorrGuardV11 = true;

        const _orig = window.triggerTabuleiroCorrompido;
        window.triggerTabuleiroCorrompido = function() {
            // Fora do coop: comportamento normal
            if (!window._coopMode) {
                return _orig.apply(this, arguments);
            }

            // Coop: só o host (criador) dispara
            if (coopRole !== 'criador') {
                if (typeof boss !== 'undefined' && boss) {
                    boss._corruptedTriggered = true; // trava monitor local
                }
                console.log('[V11] P2 bloqueou trigger local (espera sync do P1).');
                return;
            }

            // P1 dispara normalmente
            const r = _orig.apply(this, arguments);

            // Publica corrupção IMEDIATAMENTE (sem mudar turno)
            if (window._corruptedTiles && window._corruptedTiles.length > 0) {
                setTimeout(async () => {
                    if (window._coopMode && coopRoomId && !coopPartidaConcluida) {
                        try {
                            await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                                'estadoJogo.corruptedTiles': [...window._corruptedTiles],
                                'estadoJogo.boss._corruptedTriggered': true,
                            });
                            console.log('[V11] P1 publicou corrupção:', window._corruptedTiles.length, 'tiles');
                        } catch (e) {
                            console.warn('[V11] Erro ao publicar corrupção:', e);
                        }
                    }
                }, 200);
            }
            return r;
        };
        console.log('✅ [V11] Só P1 dispara corrupção em coop.');
        return true;
    }

    if (!_instalarHookCorrupcao()) {
        const t = setInterval(() => {
            if (_instalarHookCorrupcao()) clearInterval(t);
        }, 200);
    }

    // =============================================================
    // FIX 4 — Reaplica corrupção após coopRenderTudo
    //        (defensivo: caso updateVisuals limpe .tile-corrupted)
    // =============================================================
    const _origRenderTudo = window.coopRenderTudo;
    if (typeof _origRenderTudo === 'function' && !_origRenderTudo._v11Corr) {
        window.coopRenderTudo = function() {
            const r = _origRenderTudo.apply(this, arguments);
            if (Array.isArray(window._corruptedTiles) && window._corruptedTiles.length > 0) {
                const tiles = document.querySelectorAll('#grid .tile');
                window._corruptedTiles.forEach(idx => {
                    const t = tiles[idx];
                    if (t && !t.classList.contains('tile-corrupted')) {
                        t.classList.add('tile-corrupted');
                        if (!t.querySelector('.corruption-fx')) {
                            t.innerHTML = '<div class="corruption-fx"></div>';
                        }
                    }
                });
            }
            return r;
        };
        window.coopRenderTudo._v11Corr = true;
        console.log('✅ [V11] Reaplicação de corrupção após render.');
    }

    // =============================================================
    // Debug
    // =============================================================
    window._debugCoopV11 = function() {
        console.group('═══ [V11] Coop Fixes ═══');
        console.log('eventoAplicarSkill hookado?', window._coopEventoAplicarHookV11 === true);
        console.log('triggerTabuleiroCorrompido guard?', window._coopCorrGuardV11 === true);
        console.log('coopAtualizarSalaNoFirestore reimplementado?',
            window.coopAtualizarSalaNoFirestore.toString().includes('[V11]'));
        console.log('');
        console.log('Estado atual:');
        console.log('  Modo coop?', window._coopMode);
        console.log('  Role:', coopRole);
        console.log('  RoomId:', coopRoomId);
        console.log('  Corrompidos locais:', window._corruptedTiles);
        console.log('  boss._corruptedTriggered:', boss?._corruptedTriggered);
        console.groupEnd();
    };

    console.log('✅ [V11] Correções instaladas.');
    console.log('   • Nações/eventos: skill com snapshot');
    console.log('   • corruptedTiles vai pro Firestore');
    console.log('   • Só P1 dispara corrupção');
    console.log('   • Corrupção preservada após render');
    console.log('');
    console.log('💡 Debug: window._debugCoopV11()');
})();
// =================================================================
// coop.js — V11.1 — Fix skill visual + fim de partida
// -----------------------------------------------------------------
// • enemyMock no replay recebe x/y (matava skill de nação/evento)
// • applyDmg suprimido durante replay (evita double damage)
// • P1 re-publica status correto após morte (V10.6 sobrescrevia)
// • Bloqueia re-entrada em sala concluída/boss morto
// • Safety monitor periódico
// =================================================================
(function coopV111() {
    if (window._coopV111) return;
    window._coopV111 = true;

    console.log('✅ [V11.1] Instalando fixes de coop...');

    // =============================================================
    // FIX 1 — Replay de skill com enemyMock COMPLETO
    // =============================================================
    function replaySkillComSnapshot(evento) {
        const snap = evento.snapshot;
        if (!snap) return Promise.resolve();

        return (async () => {
            // Salvar estado atual
            const estadoAtual = {
                boss: { x: boss.x, y: boss.y, hp: boss.hp, maxHp: boss.maxHp,
                        type: boss.type, dead: boss.dead },
                players: players.map(p => ({
                    x: p.x, y: p.y, hp: p.hp, maxHp: p.maxHp,
                    dead: p.dead, element: p.element,
                })),
                grid: [...grid],
                amulets: [...amulets],
            };

            // Aplicar snapshot
            Object.assign(boss, snap.boss);
            snap.players.forEach((pSnap, i) => {
                if (players[i]) Object.assign(players[i], {
                    x: pSnap.x, y: pSnap.y, hp: pSnap.hp, maxHp: pSnap.maxHp,
                    dead: pSnap.dead, element: pSnap.element,
                });
            });
            for (let i = 0; i < 64; i++) {
                if (snap.grid[i]) grid[i] = snap.grid[i];
                amulets[i] = snap.amulets[i] || false;
            }

            // Reposicionar tokens (visual)
            const s = (typeof getStep === 'function') ? getStep() : 59;
            const bossToken = document.getElementById('tokenBoss');
            if (bossToken) {
                bossToken.style.left = (snap.boss.x * s + 8) + 'px';
                bossToken.style.top = (snap.boss.y * s + 8) + 'px';
            }
            snap.players.forEach((pSnap, i) => {
                const tok = document.getElementById(`tokenP${i}`);
                if (tok) {
                    tok.style.left = (pSnap.x * s + 8) + 'px';
                    tok.style.top = (pSnap.y * s + 8) + 'px';
                }
            });

            // ⭐⭐⭐ FIX PRINCIPAL: enemyMock com x/y/atk/hp
            const handlerKey = evento.skill;
            const skillName = evento.skillName || evento.skill;
            const atkReplay = Number(evento.enemyAtk) > 0 ? Number(evento.enemyAtk) : 4;

            const enemyMock = {
                id: evento.enemyId,
                enemyId: evento.enemyId,
                nome: evento.enemyNome || 'Boss',
                name: evento.enemyNome || 'Boss',
                atk: atkReplay,
                x: snap.boss.x,
                y: snap.boss.y,
                hp: snap.boss.hp,
                maxHp: snap.boss.maxHp,
                elemento: boss.elemento,
                element: boss.elemento,
                size: 1, sizeH: 1, sizeV: 1,
            };

            let reproduzido = false;
            window._coopReplaySkillActive = true;

            try {
                if (typeof STORY_ANIMAL_SKILLS !== 'undefined' && STORY_ANIMAL_SKILLS[handlerKey]) {
                    await STORY_ANIMAL_SKILLS[handlerKey](enemyMock, { name: skillName, handler: handlerKey });
                    reproduzido = true;
                }
            } catch (e) { console.warn('[V11.1] STORY_ANIMAL handler:', e); }

            if (!reproduzido && String(handlerKey || '').startsWith('nacao_')
                && window.NACAO_SKILL_HANDLERS?.[handlerKey]) {
                try {
                    await window.NACAO_SKILL_HANDLERS[handlerKey](enemyMock, {
                        nome: skillName, name: skillName, handler: handlerKey,
                    });
                    reproduzido = true;
                } catch (e) { console.warn('[V11.1] NACAO handler:', e); }
            }

            if (!reproduzido && String(handlerKey || '').startsWith('evento_')
                && window.EVENTO_SKILLS?.[handlerKey]) {
                try {
                    await window.EVENTO_SKILLS[handlerKey](enemyMock, {
                        nome: skillName, name: skillName, handler: handlerKey,
                        danoBase: atkReplay, dano: atkReplay,
                    });
                    reproduzido = true;
                } catch (e) { console.warn('[V11.1] EVENTO handler:', e); }
            }

            if (!reproduzido && typeof window[handlerKey] === 'function') {
                try {
                    window[handlerKey].apply(window, evento.argsRaw || []);
                    reproduzido = true;
                } catch (e) {}
            }

            if (!reproduzido) {
                console.warn('[V11.1] ⚠️ Skill não reproduzida:', {
                    handler: handlerKey,
                    temSTORY_ANIMAL: typeof STORY_ANIMAL_SKILLS?.[handlerKey],
                    temNACAO: typeof window.NACAO_SKILL_HANDLERS?.[handlerKey],
                    temEVENTO: typeof window.EVENTO_SKILLS?.[handlerKey],
                    temGlobal: typeof window[handlerKey],
                });
            }

            await coopSleep(600);

            // Restaurar estado atual
            Object.assign(boss, estadoAtual.boss);
            estadoAtual.players.forEach((pAtual, i) => {
                if (players[i]) Object.assign(players[i], pAtual);
            });
            for (let i = 0; i < 64; i++) {
                if (estadoAtual.grid[i]) grid[i] = estadoAtual.grid[i];
                amulets[i] = estadoAtual.amulets[i] || false;
            }

            if (bossToken) {
                bossToken.style.left = (estadoAtual.boss.x * s + 8) + 'px';
                bossToken.style.top = (estadoAtual.boss.y * s + 8) + 'px';
            }
            estadoAtual.players.forEach((pAtual, i) => {
                const tok = document.getElementById(`tokenP${i}`);
                if (tok) {
                    tok.style.left = (pAtual.x * s + 8) + 'px';
                    tok.style.top = (pAtual.y * s + 8) + 'px';
                }
            });

            window._coopReplaySkillActive = false;

            if (typeof updateVisuals === 'function') updateVisuals();
            if (typeof updateHeroCard === 'function') updateHeroCard();
            if (typeof updateBossCard === 'function') updateBossCard();
        })();
    }

    window.coopReproduzirSkillComSnapshot = replaySkillComSnapshot;
    console.log('[V11.1] Replay de skill reescrito (enemyMock com x/y).');

    // =============================================================
    // FIX 2 — Suprimir dano durante replay (evita double damage)
    // -------------------------------------------------------------
    // Os handlers chamam applyDmg. Se rodarem no P1 e o HP já veio
    // sincronizado do Firestore, HP cairia 2×. Solução: durante o
    // replay, applyDmg NÃO altera HP (só deixa o handler disparar
    // FX/som normalmente — os "damage numbers" vêm do boss_attack).
    // =============================================================
    const _origApplyDmg = window.applyDmg;
    if (typeof _origApplyDmg === 'function' && !_origApplyDmg._v111Guard) {
        window.applyDmg = function(t, amt) {
            if (window._coopReplaySkillActive) return; // suprime
            return _origApplyDmg.apply(this, arguments);
        };
        window.applyDmg._v111Guard = true;
        console.log('[V11.1] applyDmg guard instalado.');
    }

    // =============================================================
    // FIX 3 — P1 re-publica status correto após morte do boss
    // -------------------------------------------------------------
    // V10.6 sempre publica 'turno_joao' depois do V8.7 publicar
    // 'concluida'. Isso destrói o fim de partida. Aqui corrigimos.
    // =============================================================
    const _curPM = window.coopProcessarMorteBoss;
    if (typeof _curPM === 'function' && !_curPM._v111) {
        window.coopProcessarMorteBoss = async function() {
            if (!window._coopMode) return _curPM.apply(this, arguments);
            if (coopRole === 'oponente') return _curPM.apply(this, arguments);

            const r = await _curPM.apply(this, arguments);
            if (!coopRoomId) return r;

            const temProximo = Array.isArray(storyEnemiesRemaining)
                               && storyEnemiesRemaining.length > 1;

            try {
                if (coopPartidaConcluida) {
                    // Último boss — garante 'concluida'
                    await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                        status: 'concluida',
                        vencedor: 'jogadores',
                        atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
                    });
                    console.log('[V11.1] Re-publish: concluida (vitória final).');
                } else if (temProximo && boss && !boss.dead) {
                    // Avançou — P2 precisa rodar o próximo boss
                    await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                        status: 'turno_boss',
                        'estadoJogo.turnoDe': 'boss',
                        'estadoJogo.boss': {
                            x: boss.x, y: boss.y, hp: boss.hp, maxHp: boss.maxHp,
                            type: boss.type, dead: false,
                        },
                        atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
                    });
                    console.log('[V11.1] Re-publish: turno_boss (próximo boss).');
                }
            } catch (e) { console.error('[V11.1]', e); }

            return r;
        };
        window.coopProcessarMorteBoss._v111 = true;
        console.log('[V11.1] P1 re-publish instalado.');
    }

    // =============================================================
    // FIX 4 — Bloquear re-entrada em salas inválidas
    // =============================================================
    const _origCont = window.coopContinuarSala;
    if (typeof _origCont === 'function' && !_origCont._v111) {
        window.coopContinuarSala = async function(roomId) {
            try {
                const doc = await fbDb.collection(COOP_ROOMS).doc(roomId).get();
                if (doc.exists) {
                    const data = doc.data();
                    const bossDead = data.estadoJogo?.boss?.dead;

                    if (data.status === 'concluida'
                        || (bossDead && /^turno_/.test(data.status || ''))) {
                        // Sala quebrada — corrige e bloqueia
                        if (data.status !== 'concluida') {
                            await fbDb.collection(COOP_ROOMS).doc(roomId).update({
                                status: 'concluida',
                                vencedor: data.vencedor || 'jogadores',
                                atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
                            });
                        }
                        uiAviso('Esta partida já foi concluída.');
                        if (typeof coopFecharPainel === 'function') coopFecharPainel();
                        if (typeof coopAbrirPainel === 'function') setTimeout(coopAbrirPainel, 100);
                        return;
                    }
                }
            } catch (e) { console.warn('[V11.1]', e); }
            return _origCont.apply(this, arguments);
        };
        window.coopContinuarSala._v111 = true;
        console.log('[V11.1] Guard de re-entrada instalado.');
    }

    // =============================================================
    // FIX 5 — Safety monitor (força 'concluida' se partida acabou)
    // =============================================================
    setInterval(async () => {
        if (!window._coopMode || !coopPartidaConcluida || !coopRoomId) return;
        try {
            const doc = await fbDb.collection(COOP_ROOMS).doc(coopRoomId).get();
            if (!doc.exists) return;
            const data = doc.data();
            if (data.status !== 'concluida' && data.status !== 'cancelada') {
                console.log('[V11.1] Safety: corrigindo', data.status, '→ concluida');
                await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                    status: 'concluida',
                    vencedor: data.vencedor || 'jogadores',
                    atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
                });
            }
        } catch (e) {}
    }, 3000);

    // =============================================================
    // FIX 6 — boss_attack usa posição PRE-skill (não pós-empurrão)
    // =============================================================
    const _origRodarBoss = window.coopRodarBossP2;
    if (typeof _origRodarBoss === 'function' && !_origRodarBoss._v111Pos) {
        window.coopRodarBossP2 = async function() {
            window._coopV111PosIniciais = players.map(p => ({ x: p.x, y: p.y }));
            return _origRodarBoss.apply(this, arguments);
        };
        window.coopRodarBossP2._v111Pos = true;
    }

    // =============================================================
    // Debug
    // =============================================================
    window._debugCoopV111 = function() {
        console.group('═══ [V11.1] Coop ═══');
        console.log('Replay skill reescrito?', window.coopReproduzirSkillComSnapshot?.name === 'replaySkillComSnapshot');
        console.log('applyDmg guard?', window.applyDmg?._v111Guard === true);
        console.log('P1 victory fix?', window.coopProcessarMorteBoss?._v111 === true);
        console.log('Continuar guard?', window.coopContinuarSala?._v111 === true);
        console.log('');
        console.log('Estado atual:');
        console.log('  Modo coop?', window._coopMode);
        console.log('  Role:', coopRole);
        console.log('  RoomId:', coopRoomId);
        console.log('  coopPartidaConcluida:', coopPartidaConcluida);
        console.log('  boss.dead:', boss?.dead, '| hp:', boss?.hp);
        console.log('  storyEnemiesRemaining:', storyEnemiesRemaining);
        console.groupEnd();
    };

    console.log('✅ [V11.1] Correções instaladas:');
    console.log('   • Skill replay: enemyMock com x/y/atk/hp');
    console.log('   • applyDmg guard (sem double damage)');
    console.log('   • P1 victory re-publish (concluida/turno_boss)');
    console.log('   • Guard de re-entrada');
    console.log('   • Safety monitor a cada 3s');
    console.log('');
    console.log('💡 Debug: window._debugCoopV111()');
})();
// =================================================================
// coop.js — V11.2 — Roteamento correto + replay de skill com snapshot
// -----------------------------------------------------------------
// 1. Nações usam eventoBossAI (não storyEnemyAI)
// 2. Replay com snapshot completo (não usa V8.8 local)
// 3. enemyMock + skillMock completos
// 4. Flag _coopV112SkillFired para diagnóstico
// =================================================================
(function coopV112() {
    if (window._coopV112) return;
    window._coopV112 = true;

    // =============================================================
    // 1. Replay substituindo coopReproduzirEventoIndividual
    // =============================================================
    const _origRepro = window.coopReproduzirEventoIndividual;

    window.coopReproduzirEventoIndividual = async function(evento) {
        if (evento.tipo === 'boss_skill' && evento.snapshot) {
            return await _replaySkillV112(evento);
        }
        return _origRepro.apply(this, arguments);
    };
    window.coopReproduzirEventoIndividual._v112 = true;

    async function _replaySkillV112(evento) {
        const snap = evento.snapshot;
        if (!snap) return;

        const estadoAtual = {
            boss: { x: boss.x, y: boss.y, hp: boss.hp, maxHp: boss.maxHp,
                    type: boss.type, dead: boss.dead, elemento: boss.elemento },
            players: players.map(p => ({ x: p.x, y: p.y, hp: p.hp, maxHp: p.maxHp,
                                          dead: p.dead, element: p.element })),
            grid: [...grid],
            amulets: [...amulets],
        };

        boss.x = snap.boss.x;
        boss.y = snap.boss.y;
        boss.hp = snap.boss.hp;
        boss.maxHp = snap.boss.maxHp;
        boss.type = snap.boss.type;
        boss.dead = snap.boss.dead;
        snap.players.forEach((ps, i) => {
            if (players[i]) {
                players[i].x = ps.x; players[i].y = ps.y;
                players[i].hp = ps.hp; players[i].maxHp = ps.maxHp;
                players[i].dead = ps.dead; players[i].element = ps.element;
            }
        });
        for (let i = 0; i < 64; i++) {
            if (snap.grid[i]) grid[i] = snap.grid[i];
            amulets[i] = snap.amulets[i] || false;
        }

        const s = (typeof getStep === 'function') ? getStep() : 59;
        const bossToken = document.getElementById('tokenBoss');
        if (bossToken) {
            bossToken.style.left = (snap.boss.x * s + 8) + 'px';
            bossToken.style.top = (snap.boss.y * s + 8) + 'px';
        }
        snap.players.forEach((ps, i) => {
            const tok = document.getElementById(`tokenP${i}`);
            if (tok) {
                tok.style.left = (ps.x * s + 8) + 'px';
                tok.style.top = (ps.y * s + 8) + 'px';
            }
        });

        const handlerKey = evento.skill;
        const skillName = evento.skillName || evento.skill;
        const atkReplay = Number(evento.enemyAtk) > 0 ? Number(evento.enemyAtk) : 4;
        const currentEnemy = (typeof STORY_ENEMIES !== 'undefined' && evento.enemyId)
            ? STORY_ENEMIES[evento.enemyId] : null;

        const enemyMock = {
            id: evento.enemyId,
            nome: evento.enemyNome || currentEnemy?.name || currentEnemy?.nome || 'Chefe',
            name: evento.enemyNome || currentEnemy?.name || currentEnemy?.nome || 'Chefe',
            atk: atkReplay,
            x: snap.boss.x, y: snap.boss.y,
            hp: snap.boss.hp, maxHp: snap.boss.maxHp,
            elemento: currentEnemy?.elemento || snap.boss.elemento,
            element: currentEnemy?.element || snap.boss.elemento,
            size: 1, sizeH: 1, sizeV: 1,
        };
        const skillMock = { nome: skillName, name: skillName, handler: handlerKey };

        let handler = null;
        if (window.NACAO_SKILL_HANDLERS?.[handlerKey]) handler = window.NACAO_SKILL_HANDLERS[handlerKey];
        else if (window.STORY_ANIMAL_SKILLS?.[handlerKey]) handler = window.STORY_ANIMAL_SKILLS[handlerKey];
        else if (window.EVENTO_SKILLS?.[handlerKey]) handler = window.EVENTO_SKILLS[handlerKey];
        else if (typeof window[handlerKey] === 'function') handler = window[handlerKey];

        window._coopReplaySkillActive = true;
        try {
            if (handler) {
                console.log('[V11.2] Replay:', handlerKey, '| atk:', atkReplay,
                            '| boss em', snap.boss.x + ',' + snap.boss.y);
                await handler(enemyMock, skillMock);
            } else {
                console.warn('[V11.2] Handler não encontrado:', handlerKey);
            }
        } catch (e) {
            console.warn('[V11.2] Erro no handler:', e);
        }
        await coopSleep(600);
        window._coopReplaySkillActive = false;

        Object.assign(boss, estadoAtual.boss);
        estadoAtual.players.forEach((pa, i) => {
            if (players[i]) Object.assign(players[i], pa);
        });
        for (let i = 0; i < 64; i++) {
            if (estadoAtual.grid[i]) grid[i] = estadoAtual.grid[i];
            amulets[i] = estadoAtual.amulets[i] || false;
        }
        if (bossToken) {
            bossToken.style.left = (estadoAtual.boss.x * s + 8) + 'px';
            bossToken.style.top = (estadoAtual.boss.y * s + 8) + 'px';
        }
        estadoAtual.players.forEach((pa, i) => {
            const tok = document.getElementById(`tokenP${i}`);
            if (tok) {
                tok.style.left = (pa.x * s + 8) + 'px';
                tok.style.top = (pa.y * s + 8) + 'px';
            }
        });

        if (typeof updateVisuals === 'function') updateVisuals();
        if (typeof updateHeroCard === 'function') updateHeroCard();
        if (typeof updateBossCard === 'function') updateBossCard();
    }

    // =============================================================
    // 2. Roteamento: nações usam eventoBossAI
    // =============================================================
    const _curStoryAI = window.storyEnemyAI;
    if (typeof _curStoryAI === 'function' && !_curStoryAI._v112) {
        window.storyEnemyAI = async function() {
            if (window._coopMode && coopForcarBoss && window._nacaoAtivo
                && typeof window.eventoBossAI === 'function') {
                console.log('[V11.2] P2: roteando para eventoBossAI (nação)');
                const prevStory = window._storyMode;
                const prevTurno = window._eventoTurnoJogador;
                window._storyMode = true;
                window._eventoTurnoJogador = false;
                try {
                    return await window.eventoBossAI();
                } catch (e) {
                    console.error('[V11.2] eventoBossAI falhou:', e);
                    return _curStoryAI.apply(this, arguments);
                } finally {
                    window._storyMode = prevStory;
                    window._eventoTurnoJogador = prevTurno;
                }
            }
            return _curStoryAI.apply(this, arguments);
        };
        window.storyEnemyAI._v112 = true;
        console.log('[V11.2] storyEnemyAI roteado para nações');
    }

    // =============================================================
    // 3. Flag de detecção de skill disparada
    // =============================================================
    const _origApplyStory = window.applyStorySkill;
    if (typeof _origApplyStory === 'function' && !_origApplyStory._v112Fire) {
        window.applyStorySkill = async function(enemy, skill) {
            if (skill?.handler?.startsWith('nacao_') && window._coopMode && coopForcarBoss) {
                window._coopV112SkillFired = true;
                console.log('[V11.2] ✅ Skill nação disparada (applyStorySkill):', skill.handler);
            }
            return _origApplyStory.apply(this, arguments);
        };
        window.applyStorySkill._v112Fire = true;
    }

    const _origApplyEvt = window.eventoAplicarSkill;
    if (typeof _origApplyEvt === 'function' && !_origApplyEvt._v112Fire) {
        window.eventoAplicarSkill = async function(enemy, skill) {
            if (skill?.handler?.startsWith('nacao_') && window._coopMode && coopForcarBoss) {
                window._coopV112SkillFired = true;
                console.log('[V11.2] ✅ Skill nação disparada (eventoAplicarSkill):', skill.handler);
            }
            return _origApplyEvt.apply(this, arguments);
        };
        window.eventoAplicarSkill._v112Fire = true;
    }

    // Reset flag no início de coopRodarBossP2
    const _curRodar = window.coopRodarBossP2;
    if (typeof _curRodar === 'function' && !_curRodar._v112) {
        window.coopRodarBossP2 = async function() {
            window._coopV112SkillFired = false;
            return _curRodar.apply(this, arguments);
        };
        window.coopRodarBossP2._v112 = true;
    }

    // =============================================================
    // 4. Fallback conservador: NÃO aplica dano se skill disparou
    //    (substitui o trecho `players.forEach` do coopRodarBossP2)
    // -------------------------------------------------------------
    // Sem acesso direto ao trecho, usamos um "passe" no applyDmg:
    // se _coopV112SkillFired e o dano vem do fallback (p.x/p.y perto
    // do boss), bloqueia.
    // =============================================================
    const _origCoopApplyDmg = window.coopApplyDmg;
    if (typeof _origCoopApplyDmg === 'function' && !_origCoopApplyDmg._v112) {
        window.coopApplyDmg = function(t, amt) {
            // Bloqueia fallback em coop quando skill já disparou e o alvo
            // é jogador (não boss)
            if (window._coopV112SkillFired && coopForcarBoss
                && t && t.id !== undefined && boss && t !== boss) {
                const dist = Math.abs(t.x - boss.x) + Math.abs(t.y - boss.y);
                if (dist <= 1) {
                    console.log('[V11.2] Fallback bloqueado (skill já disparou):', t.name);
                    return;
                }
            }
            return _origCoopApplyDmg.apply(this, arguments);
        };
        window.coopApplyDmg._v112 = true;
    }

    // =============================================================
    // 5. Test helper
    // =============================================================
    window._testarSkillNacao = async function(handlerKey) {
        handlerKey = handlerKey || 'nacao_yucahu_raizes';
        console.log('Testando:', handlerKey);
        const enemyMock = { nome: 'Teste', atk: 4, x: 4, y: 0 };
        const skillMock = { nome: 'Teste', handler: handlerKey };
        const handler = window.NACAO_SKILL_HANDLERS?.[handlerKey]
                     || window.STORY_ANIMAL_SKILLS?.[handlerKey];
        if (!handler) { console.error('Handler não encontrado'); return; }
        try { await handler(enemyMock, skillMock); console.log('✅ OK'); }
        catch (e) { console.error('❌ Falha:', e); }
    };

    // =============================================================
    // Debug
    // =============================================================
    window._debugV112 = function() {
        console.group('=== [V11.2] Skill Replay ===');
        console.log('V11.2 ativo?', window._coopV112 === true);
        console.log('Repro wrapper?', window.coopReproduzirEventoIndividual?._v112 === true);
        console.log('Story AI router?', window.storyEnemyAI?._v112 === true);
        console.log('Fire flag:', window._coopV112SkillFired);
        console.log('Replay active:', window._coopReplaySkillActive);
        console.log('');
        console.log('_nacaoAtivo:', window._nacaoAtivo);
        console.log('_nacaoBatalha.ativa:', window._nacaoBatalha?.ativa);
        console.log('_eventoTurnoJogador:', window._eventoTurnoJogador);
        console.log('eventoBossAI existe?', typeof window.eventoBossAI);
        console.log('');
        console.log('Handler exemplo (nacao_yucahu_raizes):');
        console.log('  NACAO_SKILL_HANDLERS:', typeof window.NACAO_SKILL_HANDLERS?.['nacao_yucahu_raizes']);
        console.log('  STORY_ANIMAL_SKILLS:', typeof window.STORY_ANIMAL_SKILLS?.['nacao_yucahu_raizes']);
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V11.2] Skill Replay Fix');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Replay com snapshot (não usa V8.8 local)');
    console.log('• Nações: storyEnemyAI roteado para eventoBossAI');
    console.log('• enemyMock/skillMock completos (nome, x/y, atk, hp)');
    console.log('• applyDmg suprimido durante replay (sem HP duplo)');
    console.log('• Fallback bloqueado quando skill disparou');
    console.log('');
    console.log('💡 Debug: window._debugV112()');
    console.log('💡 Teste: window._testarSkillNacao("nacao_yucahu_raizes")');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// coop.js — V11.3 — Fix: roteamento correto sem quebrar o turno
// -----------------------------------------------------------------
// • NÃO restaura _eventoTurnoJogador (eventoBossAI gerencia)
// • NÃO cai em ato-AI no catch (evita dano duplo/errado)
// • Garante _eventoBatalha.ativa + _eventoAtivo + _storyMode
// • Força _eventoBossRunning/_eventoProcessandoAcao = false
// • Diagnóstico: HP antes/depois + alerta vermelho se não rodou
// =================================================================
(function coopV113() {
    if (window._coopV113) return;
    window._coopV113 = true;

    console.log('✅ [V11.3] Instalando roteamento correto de IA');

    // Guarda o wrapper atual (V11.2 sobre V8.5) — só usa para atos
    const _prevWrapper = window.storyEnemyAI;

    window.storyEnemyAI = async function() {
        // Fora de coop ou não forçado → delega ao wrapper anterior
        if (!window._coopMode || !coopForcarBoss) {
            return _prevWrapper.apply(this, arguments);
        }

        const isNacao =
            window._nacaoAtivo === true
            || window._nacaoBatalha?.ativa === true
            || (typeof coopContent !== 'undefined' && coopContent?.type === 'nacoes');
        const isSelados =
            (typeof coopContent !== 'undefined' && coopContent?.type === 'selados');

        if ((isNacao || isSelados) && typeof window.eventoBossAI === 'function') {
            console.log('%c[V11.3] → eventoBossAI', 'color:#27ae60;font-weight:bold;',
                        '| isNacao:', isNacao, '| isSelados:', isSelados);

            // ⭐ Garante TODO o estado necessário
            const prevStoryMode = window._storyMode;
            const prevTurnoJogador = window._eventoTurnoJogador;

            window._eventoAtivo = true;
            window._storyMode = true;
            if (window._nacaoAtivo) window._nacaoAtivo = true;
            if (window._eventoBatalha && typeof window._eventoBatalha === 'object') {
                window._eventoBatalha.ativa = true;
                window._eventoBatalha.publicandoResultado = false;
            }
            window._eventoBossRunning = false;
            window._eventoProcessandoAcao = false;
            window._eventoTurnoJogador = false;

            const hpAntes = (players || []).map(p => p.hp);
            const posAntes = (players || []).map(p => ({ x: p.x, y: p.y }));
            const bossHpAntes = boss ? boss.hp : null;
            const gridAntes = typeof grid !== 'undefined' ? [...grid] : null;

            let erroAI = null;
            try {
                await window.eventoBossAI();
            } catch (e) {
                erroAI = e;
                console.error('[V11.3] ❌ eventoBossAI ERRO:', e);
            }

            // ⭐ Diagnóstico: HP mudou?
            const hpDepois = (players || []).map(p => p.hp);
            const posDepois = (players || []).map(p => ({ x: p.x, y: p.y }));
            const bossHpDepois = boss ? boss.hp : null;
            const gridDepois = typeof grid !== 'undefined' ? [...grid] : null;

            const hpMudou = hpAntes.some((h, i) => h !== hpDepois[i]);
            const posMudou = posAntes.some((p, i) =>
                p.x !== posDepois[i].x || p.y !== posDepois[i].y);
            const bossMudou = bossHpAntes !== bossHpDepois;
            const gridMudou = gridAntes && gridDepois &&
                gridAntes.some((el, i) => el !== gridDepois[i]);

            if (!hpMudou && !posMudou && !bossMudou && !gridMudou && !erroAI) {
                console.warn('%c[V11.3] ⚠️ eventoBossAI NÃO FEZ NADA (HP, pos, boss e grid intactos)',
                    'color:#e74c3c;font-weight:bold;font-size:12px;');
                console.warn('  Estado:', {
                    _eventoTurnoJogador: window._eventoTurnoJogador,
                    _eventoBatalha_ativa: window._eventoBatalha?.ativa,
                    _eventoBossRunning: window._eventoBossRunning,
                    _eventoProcessandoAcao: window._eventoProcessandoAcao,
                    _nacaoAtivo: window._nacaoAtivo,
                    _storyMode: window._storyMode,
                    boss: boss ? { x: boss.x, y: boss.y, hp: boss.hp, dead: boss.dead } : null,
                });
                console.warn('  Se repetir, envie este log + arquivo historia-eventos.js');
            } else if (!erroAI) {
                console.log('%c[V11.3] ✅ eventoBossAI agiu',
                    'color:#27ae60;',
                    { hpMudou, posMudou, bossMudou, gridMudou,
                      hpAntes, hpDepois, bossHpAntes, bossHpDepois });
            }

            // ⭐ NÃO restaura _eventoTurnoJogador — o eventoBossAI gerencia
            // (ele seta true quando termina o turno do boss)
            window._storyMode = prevStoryMode;

            return;
        }

        // Atos normais → wrapper anterior
        return _prevWrapper.apply(this, arguments);
    };
    window.storyEnemyAI._v113 = true;

    // =============================================================
    // Debug
    // =============================================================
    window._debugV113 = function() {
        console.group('=== [V11.3] ===');
        console.log('storyEnemyAI._v113:', window.storyEnemyAI?._v113 === true);
        console.log('coopContent.type:', typeof coopContent !== 'undefined' ? coopContent?.type : '?');
        console.log('_nacaoAtivo:', window._nacaoAtivo);
        console.log('_nacaoBatalha:', window._nacaoBatalha);
        console.log('_eventoAtivo:', window._eventoAtivo);
        console.log('_eventoTurnoJogador:', window._eventoTurnoJogador);
        console.log('_eventoBatalha.ativa:', window._eventoBatalha?.ativa);
        console.log('_eventoBossRunning:', window._eventoBossRunning);
        console.log('_eventoProcessandoAcao:', window._eventoProcessandoAcao);
        console.log('eventoBossAI existe:', typeof window.eventoBossAI);
        console.log('boss:', boss ? { x: boss.x, y: boss.y, hp: boss.hp, dead: boss.dead } : null);
        console.groupEnd();
    };

    // =============================================================
    // Teste: chama eventoBossAI manualmente
    // =============================================================
    window._forcarBossTurnoTeste = async function() {
        if (!window.eventoBossAI) { console.error('eventoBossAI não existe'); return; }
        console.log('Forçando eventoBossAI manualmente...');
        window._eventoTurnoJogador = false;
        window._eventoAtivo = true;
        if (window._eventoBatalha) window._eventoBatalha.ativa = true;
        window._eventoBossRunning = false;
        window._eventoProcessandoAcao = false;
        const hpAntes = (players || []).map(p => p.hp);
        try {
            await window.eventoBossAI();
            console.log('HP antes:', hpAntes, '→ depois:', (players || []).map(p => p.hp));
        } catch (e) {
            console.error('Erro:', e);
        }
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V11.3] Roteamento corrigido');
    console.log('═══════════════════════════════════════════════════');
    console.log('• NÃO restaura _eventoTurnoJogador (deixa AI gerenciar)');
    console.log('• NÃO cai em ato-AI no catch (evita dano duplo)');
    console.log('• Garante _eventoBatalha.ativa + _eventoAtivo + _storyMode');
    console.log('• Força _eventoBossRunning/_eventoProcessandoAcao = false');
    console.log('• Alerta vermelho se eventoBossAI não fizer nada');
    console.log('');
    console.log('💡 Debug: window._debugV113()');
    console.log('💡 Teste: window._forcarBossTurnoTeste()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// coop.js — V11.4 — Force skill do boss (bypass do eventoBossAI parado)
// -----------------------------------------------------------------
// Quando eventoBossAI retorna sem fazer nada (HP/pos/grid intactos),
// executa a skill manualmente + move o boss. Logs indicam cada passo.
// =================================================================
(function coopV114() {
    if (window._coopV114) return;
    window._coopV114 = true;

    const _curStoryAI = window.storyEnemyAI;

    window.storyEnemyAI = async function() {
        if (!window._coopMode || !coopForcarBoss) {
            return _curStoryAI.apply(this, arguments);
        }

        const isNacao = window._nacaoAtivo === true || window._nacaoBatalha?.ativa === true;
        const isSelados = (typeof coopContent !== 'undefined' && coopContent?.type === 'selados');

        if ((!isNacao && !isSelados) || typeof window.eventoBossAI !== 'function') {
            return _curStoryAI.apply(this, arguments);
        }

        // Prepara estado
        const prevStory = window._storyMode;
        window._eventoAtivo = true;
        window._storyMode = true;
        if (window._eventoBatalha) {
            window._eventoBatalha.ativa = true;
            window._eventoBatalha.publicandoResultado = false;
        }
        window._eventoBossRunning = false;
        window._eventoProcessandoAcao = false;
        window._eventoTurnoJogador = false;

        const hpAntes = (players || []).map(p => p.hp);
        const posAntes = (players || []).map(p => ({ x: p.x, y: p.y }));
        const bHpAntes = boss?.hp;
        const gridAntes = typeof grid !== 'undefined' ? [...grid] : null;

        try {
            await window.eventoBossAI();
        } catch (e) {
            console.error('[V11.4] eventoBossAI erro:', e);
        }

        const hpDepois = (players || []).map(p => p.hp);
        const posDepois = (players || []).map(p => ({ x: p.x, y: p.y }));
        const bHpDepois = boss?.hp;
        const gridDepois = typeof grid !== 'undefined' ? [...grid] : null;

        const hpMudou = hpAntes.some((h, i) => h !== hpDepois[i]);
        const posMudou = posAntes.some((p, i) => p.x !== posDepois[i].x || p.y !== posDepois[i].y);
        const bMudou = bHpAntes !== bHpDepois;
        const gridMudou = gridAntes && gridDepois && gridAntes.some((e, i) => e !== gridDepois[i]);

        if (!hpMudou && !posMudou && !bMudou && !gridMudou) {
            console.warn('%c[V11.4] eventoBossAI vazio — FORÇANDO skill manual',
                'color:#e74c3c;font-weight:bold;');
            await _forcarSkillManual(isNacao ? 'nacao' : 'evento');
        }

        window._storyMode = prevStory;
    };
    window.storyEnemyAI._v114 = true;

    async function _forcarSkillManual(tipo) {
        try {
            const enemyId = Array.isArray(storyEnemiesRemaining) && storyEnemiesRemaining[0];
            if (!enemyId) { console.warn('[V11.4] Sem inimigo atual'); return; }

            const enemy = STORY_ENEMIES?.[enemyId];
            if (!enemy) { console.warn('[V11.4] Enemy não existe:', enemyId); return; }

            let skill1 = enemy.skill1;
            let skill2 = enemy.skill2;

            if (tipo === 'nacao' && window.NACAO_DEUSES?.[enemyId]) {
                const deus = window.NACAO_DEUSES[enemyId];
                skill1 = deus.skills?.[0];
                skill2 = deus.skills?.[1];
            }

            const skills = [skill1, skill2].filter(s => s && s.handler);
            if (skills.length === 0) {
                console.warn('[V11.4] Sem skills registradas para', enemyId,
                             '| skill1:', enemy.skill1, '| skill2:', enemy.skill2);
                return;
            }

            const skill = skills[Math.floor(Math.random() * skills.length)];
            console.log('%c[V11.4] Executando skill:', 'color:#27ae60;font-weight:bold;',
                        skill.handler, '|', skill.nome || '');

            const enemyMock = {
                id: enemyId,
                nome: enemy.name || enemy.nome || 'Boss',
                name: enemy.name || enemy.nome || 'Boss',
                atk: enemy.atk || 4,
                x: boss?.x ?? 4, y: boss?.y ?? 0,
                hp: boss?.hp ?? 100, maxHp: boss?.maxHp ?? 100,
                elemento: enemy.elemento,
                element: enemy.element || enemy.elemento,
                size: 1, sizeH: 1, sizeV: 1,
            };
            const skillMock = { nome: skill.nome, name: skill.nome, handler: skill.handler };

            let handler = null;
            if (window.NACAO_SKILL_HANDLERS?.[skill.handler]) handler = window.NACAO_SKILL_HANDLERS[skill.handler];
            else if (window.STORY_ANIMAL_SKILLS?.[skill.handler]) handler = window.STORY_ANIMAL_SKILLS[skill.handler];
            else if (window.EVENTO_SKILLS?.[skill.handler]) handler = window.EVENTO_SKILLS[skill.handler];
            else if (typeof window[skill.handler] === 'function') handler = window[skill.handler];

            if (!handler) {
                console.warn('[V11.4] Handler NÃO encontrado:', skill.handler);
                console.warn('  disponíveis em NACAO_SKILL_HANDLERS:',
                             Object.keys(window.NACAO_SKILL_HANDLERS || {}).length);
                return;
            }

            try {
                await handler(enemyMock, skillMock);
                console.log('[V11.4] ✅ Skill executada:', skill.handler);
            } catch (e) {
                console.warn('[V11.4] Skill lançou erro:', e);
            }

            // Move o boss (senão fica parado)
            const alive = players.filter(p => p && !p.dead);
            if (alive.length > 0 && boss) {
                const alvo = alive.reduce((a, b) => {
                    const da = Math.abs(a.x - boss.x) + Math.abs(a.y - boss.y);
                    const db = Math.abs(b.x - boss.x) + Math.abs(b.y - boss.y);
                    return da < db ? a : b;
                });
                if (boss.x !== alvo.x || boss.y !== alvo.y) {
                    const dx = Math.sign(alvo.x - boss.x);
                    const dy = Math.sign(alvo.y - boss.y);
                    if (Math.abs(alvo.x - boss.x) >= Math.abs(alvo.y - boss.y) && dx !== 0) {
                        boss.x = Math.max(0, Math.min(7, boss.x + dx));
                    } else if (dy !== 0) {
                        boss.y = Math.max(0, Math.min(7, boss.y + dy));
                    }
                    console.log('[V11.4] Boss moveu →', boss.x, boss.y);
                }
            }

            if (typeof updateVisuals === 'function') updateVisuals();
            if (typeof updateHeroCard === 'function') updateHeroCard();
            if (typeof updateBossCard === 'function') updateBossCard();
        } catch (e) {
            console.error('[V11.4] _forcarSkillManual erro:', e);
        }
    }

    window._debugV114 = function() {
        console.group('=== [V11.4] ===');
        console.log('Ativo?', window._coopV114 === true);
        console.log('_nacaoAtivo:', window._nacaoAtivo);
        console.log('_nacaoBatalha:', window._nacaoBatalha);
        console.log('_eventoBatalha.ativa:', window._eventoBatalha?.ativa);
        console.log('_eventoTurnoJogador:', window._eventoTurnoJogador);
        console.log('Boss:', boss ? { x: boss.x, y: boss.y, hp: boss.hp, dead: boss.dead } : null);
        const enemyId = storyEnemiesRemaining?.[0];
        console.log('Enemy atual:', enemyId);
        if (enemyId) {
            const e = STORY_ENEMIES?.[enemyId];
            console.log('  skill1:', e?.skill1?.handler);
            console.log('  skill2:', e?.skill2?.handler);
            console.log('  NACAO_DEUSES:', window.NACAO_DEUSES?.[enemyId]?.skills?.map(s => s.handler));
        }
        console.groupEnd();
    };

    window._forcarSkillTeste = function() {
        return _forcarSkillManual(window._nacaoAtivo ? 'nacao' : 'evento');
    };

    console.log('✅ [V11.4] Force skill ativado');
    console.log('💡 Debug: window._debugV114()');
    console.log('💡 Teste: window._forcarSkillTeste()');
})();
// =================================================================
// coop.js — V11.5 — Corrupção + Ordem skill (move→skill)
// =================================================================
(function coopV115() {
    if (window._coopV115) return;
    window._coopV115 = true;

    // =============================================================
    // FIX 1: NÃO sincronizar _corruptedTriggered
    // =============================================================
    const _origCapture = window.coopCapturarEstado;
    if (typeof _origCapture === 'function' && !_origCapture._v115) {
        window.coopCapturarEstado = function() {
            const estado = _origCapture.apply(this, arguments);
            if (estado?.boss) delete estado.boss._corruptedTriggered;
            return estado;
        };
        window.coopCapturarEstado._v115 = true;
        console.log('[V11.5] coopCapturarEstado: _corruptedTriggered não sincroniza');
    }

    const _origApply = window.coopAplicarEstadoDoRoom;
    if (typeof _origApply === 'function' && !_origApply._v115) {
        window.coopAplicarEstadoDoRoom = function(room) {
            const localFlag = boss?._corruptedTriggered;
            const r = _origApply.apply(this, arguments);
            if (boss && room?.estadoJogo?.boss) {
                const corrVivas = Array.isArray(room.estadoJogo.corruptedTiles)
                    && room.estadoJogo.corruptedTiles.length > 0;
                if (corrVivas) {
                    boss._corruptedTriggered = true; // corrupção está ativa
                } else {
                    boss._corruptedTriggered = localFlag; // mantém local
                }
            }
            return r;
        };
        window.coopAplicarEstadoDoRoom._v115 = true;
        console.log('[V11.5] coopAplicarEstadoDoRoom: preserva flag local');
    }

    // =============================================================
    // FIX 2: Mover boss ANTES da skill
    // =============================================================
    const _curStoryAI = window.storyEnemyAI;
    if (typeof _curStoryAI !== 'function' || _curStoryAI._v115) return;

    window.storyEnemyAI = async function() {
        if (!window._coopMode || !coopForcarBoss) {
            return _curStoryAI.apply(this, arguments);
        }

        const isNacao = window._nacaoAtivo === true || window._nacaoBatalha?.ativa === true;
        const isSelados = (typeof coopContent !== 'undefined' && coopContent?.type === 'selados');

        if ((!isNacao && !isSelados) || typeof window.eventoBossAI !== 'function') {
            return _curStoryAI.apply(this, arguments);
        }

        const prevStory = window._storyMode;
        window._eventoAtivo = true;
        window._storyMode = true;
        if (window._eventoBatalha) {
            window._eventoBatalha.ativa = true;
            window._eventoBatalha.publicandoResultado = false;
        }
        window._eventoBossRunning = false;
        window._eventoProcessandoAcao = false;
        window._eventoTurnoJogador = false;

        const hpA = (players || []).map(p => p.hp);
        const posA = (players || []).map(p => ({ x: p.x, y: p.y }));
        const bHpA = boss?.hp;
        const bXA = boss?.x, bYA = boss?.y;
        const gridA = typeof grid !== 'undefined' ? [...grid] : null;

        try { await window.eventoBossAI(); }
        catch (e) { console.error('[V11.5] eventoBossAI erro:', e); }

        const hpD = (players || []).map(p => p.hp);
        const posD = (players || []).map(p => ({ x: p.x, y: p.y }));
        const bHpD = boss?.hp;
        const bMudouPos = boss?.x !== bXA || boss?.y !== bYA;
        const gridD = typeof grid !== 'undefined' ? [...grid] : null;

        const hpMudou = hpA.some((h, i) => h !== hpD[i]);
        const posMudou = posA.some((p, i) => p.x !== posD[i].x || p.y !== posD[i].y);
        const bMudouHp = bHpA !== bHpD;
        const gridMudou = gridA && gridD && gridA.some((e, i) => e !== gridD[i]);

        if (!hpMudou && !posMudou && !bMudouHp && !gridMudou && !bMudouPos) {
            console.warn('%c[V11.5] Forçando skill (move → skill)',
                'color:#e74c3c;font-weight:bold;');
            await _forcarSkillV115();
        }

        window._storyMode = prevStory;
    };
    window.storyEnemyAI._v115 = true;

    async function _forcarSkillV115() {
        try {
            const enemyId = Array.isArray(storyEnemiesRemaining) && storyEnemiesRemaining[0];
            if (!enemyId) return;
            const enemy = STORY_ENEMIES?.[enemyId];
            if (!enemy) return;

            let s1 = enemy.skill1, s2 = enemy.skill2;
            const isNacao = window._nacaoAtivo === true || window._nacaoBatalha?.ativa === true;
            if (isNacao && window.NACAO_DEUSES?.[enemyId]) {
                const d = window.NACAO_DEUSES[enemyId];
                s1 = d.skills?.[0]; s2 = d.skills?.[1];
            }
            const skills = [s1, s2].filter(x => x && x.handler);
            if (!skills.length) { console.warn('[V11.5] Sem skills para', enemyId); return; }

            const skill = skills[Math.floor(Math.random() * skills.length)];
            console.log('%c[V11.5] Skill:', 'color:#27ae60;font-weight:bold;', skill.handler);

            // ⭐ PASSO 1: MOVE boss primeiro
            const alive = (players || []).filter(p => p && !p.dead);
            if (alive.length > 0 && boss) {
                let alvo = alive[0];
                let dMin = Infinity;
                alive.forEach(p => {
                    const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
                    if (d < dMin) { dMin = d; alvo = p; }
                });
                if (dMin > 1) {
                    const dx = Math.sign(alvo.x - boss.x);
                    const dy = Math.sign(alvo.y - boss.y);
                    const passos = Math.min(2, dMin - 1);
                    for (let i = 0; i < passos; i++) {
                        if (Math.abs(alvo.x - boss.x) >= Math.abs(alvo.y - boss.y) && dx !== 0) {
                            boss.x = Math.max(0, Math.min(7, boss.x + dx));
                        } else if (dy !== 0) {
                            boss.y = Math.max(0, Math.min(7, boss.y + dy));
                        }
                        if (typeof updateVisuals === 'function') updateVisuals();
                        await new Promise(r => setTimeout(r, 250));
                    }
                    console.log('[V11.5] Boss moveu →', boss.x, boss.y);
                }
            }

            // ⭐ PASSO 2: skill via eventoAplicarSkill (dispara hook de captura)
            const enemyMock = {
                id: enemyId,
                nome: enemy.name || enemy.nome || 'Boss',
                name: enemy.name || enemy.nome || 'Boss',
                atk: enemy.atk || 4,
                x: boss?.x ?? 4, y: boss?.y ?? 0,
                hp: boss?.hp ?? 100, maxHp: boss?.maxHp ?? 100,
                elemento: enemy.elemento,
                element: enemy.element || enemy.elemento,
                size: 1, sizeH: 1, sizeV: 1,
            };
            const skillMock = { nome: skill.nome, name: skill.nome, handler: skill.handler };

            if (typeof window.eventoAplicarSkill === 'function') {
                await window.eventoAplicarSkill(enemyMock, skillMock);
            } else {
                const h = window.NACAO_SKILL_HANDLERS?.[skill.handler]
                       || window.STORY_ANIMAL_SKILLS?.[skill.handler]
                       || window.EVENTO_SKILLS?.[skill.handler];
                if (h) await h(enemyMock, skillMock);
            }
            console.log('[V11.5] ✅ Skill OK');

            if (typeof updateVisuals === 'function') updateVisuals();
            if (typeof updateHeroCard === 'function') updateHeroCard();
            if (typeof updateBossCard === 'function') updateBossCard();
        } catch (e) { console.error('[V11.5]', e); }
    }

    // =============================================================
    // Debug
    // =============================================================
    window._debugV115 = function() {
        console.group('═══ [V11.5] ═══');
        console.log('coopCapturarEstado._v115:', window.coopCapturarEstado?._v115);
        console.log('coopAplicarEstadoDoRoom._v115:', window.coopAplicarEstadoDoRoom?._v115);
        console.log('storyEnemyAI._v115:', window.storyEnemyAI?._v115);
        console.log('');
        console.log('Corrupção local:');
        console.log('  _corruptedTiles:', window._corruptedTiles);
        console.log('  boss._corruptedTriggered:', boss?._corruptedTriggered);
        console.log('  boss.hp:', boss?.hp, '/', boss?.maxHp,
                    '(', boss ? (boss.hp/boss.maxHp*100).toFixed(0) : '?', '%)');
        console.log('');
        console.log('Se _corruptedTiles vazio mas boss.hp < 50%:');
        console.log('  → aguarde ~300ms, monitor deve disparar');
        console.log('  → se persistir, window._debugV115() de novo');
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V11.5] Corrupção + Ordem da skill');
    console.log('═══════════════════════════════════════════════════');
    console.log('• _corruptedTriggered NÃO vai mais pro Firestore');
    console.log('• P1 dispara corrupção localmente (sem interferência do P2)');
    console.log('• Boss move ANTES da skill (ordem natural do combate)');
    console.log('');
    console.log('💡 Debug: window._debugV115()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// coop.js — V11.6 — Bloqueia fallback quando skill disparou
// -----------------------------------------------------------------
// • Guard de HP por player: bloqueia decremento que não veio de skill
// • applyDmg marca players como "legit damage" durante boss turn
// • Fallback do coopRodarBossP2 vira no-op quando skill rodou
// =================================================================
(function coopV116() {
    if (window._coopV116) return;
    window._coopV116 = true;

    // =============================================================
    // 1. Hook em applyDmg: marca "legit damage" durante boss turn
    // =============================================================
    const _origApplyDmg = window.applyDmg;
    if (typeof _origApplyDmg === 'function' && !_origApplyDmg._v116) {
        window.applyDmg = function(target, amount) {
            if (window._coopMode && coopForcarBoss
                && target && target.id !== undefined
                && boss && target !== boss) {
                window._coopSkillFired = true;
                window._coopLegitDmg = window._coopLegitDmg || {};
                window._coopLegitDmg[target.id] = true;
                console.log('[V11.6] Legit dmg:', target.name, '-', amount);
            }
            return _origApplyDmg.apply(this, arguments);
        };
        window.applyDmg._v116 = true;
        console.log('[V11.6] applyDmg hook: tracking de dano legítimo');
    }

    // =============================================================
    // 2. Guard de HP por player (bloqueia fallback)
    // =============================================================
    function _installHPGuard() {
        (typeof players !== 'undefined' ? players : []).forEach(p => {
            if (!p || p._v116Guard) return;

            let _hp = p.hp;
            Object.defineProperty(p, 'hp', {
                get() { return _hp; },
                set(v) {
                    // Se skill rodou e este player NÃO foi marcado como
                    // legítimo, bloqueia o decremento (é fallback).
                    if (window._coopSkillFired && window._coopMode && coopForcarBoss
                        && typeof v === 'number' && v < _hp
                        && !(window._coopLegitDmg && window._coopLegitDmg[p.id])) {
                        console.warn('%c[V11.6] Fallback bloqueado em ' + p.name,
                            'color:#e74c3c;font-weight:bold;', _hp, '→', v);
                        return;
                    }
                    _hp = v;
                },
                configurable: true,
                enumerable: true,
            });
            p._v116Guard = true;
        });
    }

    // =============================================================
    // 3. Wrap coopRodarBossP2: reset flags + instala guard
    // =============================================================
    const _curRodar = window.coopRodarBossP2;
    if (typeof _curRodar === 'function' && !_curRodar._v116) {
        window.coopRodarBossP2 = async function() {
            window._coopSkillFired = false;
            window._coopLegitDmg = {};
            _installHPGuard();
            return _curRodar.apply(this, arguments);
        };
        window.coopRodarBossP2._v116 = true;
    }

    // =============================================================
    // 4. Re-instala guard após rebuild de players (defensivo)
    // =============================================================
    const _curRebuild = window.coopRebuildPlayers;
    if (typeof _curRebuild === 'function' && !_curRebuild._v116) {
        window.coopRebuildPlayers = function() {
            const r = _curRebuild.apply(this, arguments);
            setTimeout(_installHPGuard, 50);
            return r;
        };
        window.coopRebuildPlayers._v116 = true;
    }

    // =============================================================
    // 5. Diagnóstico: detecta dano fora de skill no fim do turno
    // -------------------------------------------------------------
    // Se algum player tomou dano sem ter entrado em _coopLegitDmg,
    // avisa. Útil pra capturar outros fallbacks escondidos.
    // =============================================================
    const _curRodarDiag = window.coopRodarBossP2;
    if (typeof _curRodarDiag === 'function' && !_curRodarDiag._v116Diag) {
        // Já envelopado — coloca diagnóstico no fim
        window.coopRodarBossP2 = async function() {
            const r = await _curRodarDiag.apply(this, arguments);
            // (não faz nada extra — o log já aparece no setter)
            return r;
        };
        window.coopRodarBossP2._v116Diag = true;
    }

    // =============================================================
    // Debug
    // =============================================================
    window._debugV116 = function() {
        console.group('═══ [V11.6] ═══');
        console.log('applyDmg._v116:', window.applyDmg?._v116 === true);
        console.log('coopRodarBossP2._v116:', window.coopRodarBossP2?._v116 === true);
        console.log('');
        console.log('_coopSkillFired:', window._coopSkillFired);
        console.log('_coopLegitDmg:', window._coopLegitDmg);
        console.log('coopForcarBoss:', coopForcarBoss);
        console.log('');
        console.log('Players com guard:',
            (players || []).filter(p => p?._v116Guard).length,
            '/', (players || []).length);
        (players || []).forEach(p => {
            if (!p) return;
            console.log(`  ${p.name}: hp=${p.hp}, id=${p.id}, guard=${p._v116Guard}`);
        });
        console.groupEnd();
    };

    // =============================================================
    // Teste manual: chama skill e observa se fallback é bloqueado
    // =============================================================
    window._testRangeSkill = async function(handlerKey) {
        handlerKey = handlerKey || 'nacao_quetzalcoatl_sopro';
        console.log('[teste] Forçando', handlerKey);
        const enemyMock = { nome: 'Teste', atk: 4, x: boss?.x ?? 4, y: boss?.y ?? 0 };
        const skillMock = { nome: 'Teste', handler: handlerKey };
        const h = window.NACAO_SKILL_HANDLERS?.[handlerKey];
        if (!h) { console.error('Handler não encontrado'); return; }
        const antes = (players || []).map(p => p.hp);
        window._coopSkillFired = true;
        window._coopLegitDmg = {};
        try { await h(enemyMock, skillMock); }
        catch (e) { console.error(e); }
        const depois = (players || []).map(p => p.hp);
        console.log('HP antes:', antes, '→ depois:', depois);
        console.log('Legit:', window._coopLegitDmg);
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V11.6] Fallback bloqueado quando skill disparou');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Só coop: no solo o range já funcionava');
    console.log('• Guard por-player: HP só cai se vier de skill legítima');
    console.log('• Fallback (dist ≤ 1) vira no-op após skill');
    console.log('• Console mostra "[V11.6] Fallback bloqueado em X"');
    console.log('');
    console.log('💡 Debug:  window._debugV116()');
    console.log('💡 Teste:  window._testRangeSkill("nacao_quetzalcoatl_sopro")');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// coop.js — V12.1 — Finalização de derrota coop (minimalista)
// -----------------------------------------------------------------
// NÃO toca em alert/showStoryScreen
// NÃO envolve coopCriarSala/coopEntrarSala
// Substitui coopFinalizar SÓ quando está em coop
// Auto-reset quando entra em nova sala
// =================================================================
(function coopDefeatFixV121() {
    if (window._coopDefeatFixV121) return;
    window._coopDefeatFixV121 = true;

    let _emAndamento = false;
    let _finalizada = false;

    async function _finalizar(motivo) {
        if (_emAndamento || _finalizada) return;
        _emAndamento = true;

        console.log('%c[V12.1] Finalizando derrota:', 'color:#a83232;font-weight:bold;', motivo);

        try {
            coopPartidaConcluida = true;
            coopForcarBoss = false;
            coopProcessandoMorteBoss = false;
            coopBossRunning = false;

            // Desconecta listener (evita novas syncs)
            if (coopListenerUnsub) {
                try { coopListenerUnsub(); } catch(e) {}
                coopListenerUnsub = null;
            }

            // Firestore (timeout 1.5s)
            if (coopRoomId && typeof fbDb !== 'undefined') {
                try {
                    const pub = fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                        status: 'concluida',
                        vencedor: 'boss',
                        atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
                    });
                    await Promise.race([pub, new Promise(r => setTimeout(r, 1500))]);
                    console.log('[V12.1] Firestore OK');
                } catch(e) { console.warn('[V12.1] Firestore:', e); }
            }

            try { if (typeof stopAllAudio === 'function') stopAllAudio(); } catch(e) {}

            // Fecha gameScreen
            const gs = document.getElementById('gameScreen');
            if (gs) { gs.classList.remove('active'); gs.style.display = 'none'; }

            // Remove overlays de combate
            ['purificacaoOverlay', 'storyPurificationOverlay',
             'storySaciFinalOverlay', 'storySaciDialogOverlay',
             'nacaoVictoryOverlay', 'curupiraV68Overlay', 'battleHeroModal']
                .forEach(id => {
                    const el = document.getElementById(id);
                    if (el) try { el.remove(); } catch(e) {}
                });

            // Remove UI coop
            ['coopBadge', 'coopBanner', 'coopResumo'].forEach(id => {
                const el = document.getElementById(id);
                if (el) try { el.remove(); } catch(e) {}
            });
            document.querySelectorAll('.coop-sair-btn').forEach(b => {
                try { b.remove(); } catch(e) {}
            });

            _mostrarTela();

            _finalizada = true;
        } catch (e) {
            console.error('[V12.1] Erro crítico:', e);
        } finally {
            _emAndamento = false;
        }
    }

    function _mostrarTela() {
        document.getElementById('coopDefeatOverlay')?.remove();

        const ov = document.createElement('div');
        ov.id = 'coopDefeatOverlay';
        ov.style.cssText = `
            position: fixed; inset: 0; z-index: 26000;
            background: radial-gradient(ellipse at center,
                rgba(42,31,16,0.98), rgba(10,6,2,0.99));
            display: flex; align-items: center; justify-content: center;
            padding: 20px; overflow-y: auto;
        `;
        ov.innerHTML = `
            <div style="
                background: linear-gradient(180deg, rgba(168,50,50,0.1), transparent 20%),
                            linear-gradient(180deg, #2a1f10, #1a1208);
                border: 3px solid #a83232; border-radius: 10px;
                max-width: 480px; width: 100%;
                padding: 30px 24px; text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,0.9),
                            0 0 60px rgba(168,50,50,0.4);
            ">
                <div style="font-size: 4rem; margin-bottom: 10px;
                            filter: drop-shadow(0 0 20px rgba(168,50,50,0.8));">
                    💀
                </div>
                <div style="font-family:'Cinzel Decorative',serif; color:#d05050;
                            font-size:1.8rem; letter-spacing:3px; margin-bottom:16px;
                            text-shadow: 0 0 20px rgba(168,50,50,0.7);">
                    DERROTA COOP
                </div>
                <div style="font-family:'EB Garamond',serif; color:#d9c89a;
                            font-size:1.05rem; font-style:italic; line-height:1.5;
                            margin-bottom:24px;">
                    Os heróis caíram em batalha.<br>A aliança foi rompida pelas sombras.
                </div>
                <button id="coopDefeatVoltar" style="
                    padding: 14px 32px;
                    background: linear-gradient(180deg, rgba(232,185,35,0.2), transparent 45%),
                                linear-gradient(135deg, #8a6a2e, #4a3418);
                    color: #fff5dc; border: 2px solid #e8b923; border-radius: 5px;
                    cursor: pointer; font-family: 'Cinzel', serif;
                    font-weight: 700; font-size: 1rem; letter-spacing: 2px;
                ">← VOLTAR À ALDEIA</button>
            </div>
        `;
        document.body.appendChild(ov);

        document.getElementById('coopDefeatVoltar').onclick = () => {
            ov.remove();
            _limparEstado();
            // Vai direto pra aldeia (sem showStoryScreen)
            const ss = document.getElementById('storyScreen');
            if (ss) {
                ss.classList.add('active');
                ss.style.display = 'flex';
            }
            if (typeof renderAldeiaScreen === 'function') {
                renderAldeiaScreen();
            }
        };
    }

    function _limparEstado() {
        window._coopMode = false;
        window._coopContent = null;
        if (typeof coopContent !== 'undefined') coopContent = null;
        coopRole = null;
        window._coopRole = null;
        coopRoomId = null;
        coopRoomData = null;
        window._coopRoomId = null;
        coopEventosTurno = [];
        coopBufferEventosBoss = [];
        coopEnemyAlreadyDead = false;
        coopFinalizando = false;
        coopPartidaConcluida = false;
        _finalizada = false;
        _emAndamento = false;
        window._eventoAtivo = false;
        window._nacaoAtivo = false;
        window._storyMode = false;
        if (window._eventoBatalha) window._eventoBatalha.ativa = false;
        if (window._nacaoBatalha) window._nacaoBatalha = { ativa: false };
        const gridEl = document.getElementById('grid');
        if (gridEl) gridEl.style.pointerEvents = '';
    }

    // -------------------------------------------------------------
    // Override coopFinalizar SÓ para coop + derrota
    // (não mexe no caso de vitória nem fora do coop)
    // -------------------------------------------------------------
    const _origCoopFinalizar = window.coopFinalizar;
    if (typeof _origCoopFinalizar === 'function') {
        window.coopFinalizar = async function(vitoria) {
            if (!window._coopMode) {
                return _origCoopFinalizar.apply(this, arguments);
            }
            if (!vitoria) {
                return _finalizar('coopFinalizar');
            }
            return _origCoopFinalizar.apply(this, arguments);
        };
    }

    // -------------------------------------------------------------
    // Reset automático quando _coopMode vira true (nova partida)
    // -------------------------------------------------------------
    let _prevCoopMode = false;
    setInterval(() => {
        if (window._coopMode && !_prevCoopMode) {
            // Entrou em nova partida
            _finalizada = false;
            _emAndamento = false;
            console.log('[V12.1] Novo coop detectado — estado resetado');
        }
        _prevCoopMode = !!window._coopMode;
    }, 300);

    // -------------------------------------------------------------
    // Monitor de morte (só coop)
    // -------------------------------------------------------------
    setInterval(() => {
        if (!window._coopMode) return;
        if (_finalizada || _emAndamento) return;
        if (!players || players.length < 2) return;
        if (players.some(p => p && p.dead)) {
            _finalizar('monitor');
        }
    }, 500);

    // -------------------------------------------------------------
    // Polling Firestore (detecta derrota remota)
    // -------------------------------------------------------------
    setInterval(() => {
        if (!window._coopMode || !coopRoomId) return;
        if (_finalizada || _emAndamento) return;
        if (typeof fbDb === 'undefined') return;
        fbDb.collection(COOP_ROOMS).doc(coopRoomId).get().then(doc => {
            if (!doc.exists) return;
            const data = doc.data();
            if (data.status === 'concluida' && data.vencedor === 'boss'
                && !_finalizada && !_emAndamento) {
                _finalizar('sync remoto');
            }
        }).catch(() => {});
    }, 1500);

    // -------------------------------------------------------------
    // Debug
    // -------------------------------------------------------------
    window._debugCoopDefeatV121 = function() {
        console.group('═══ [V12.1] ═══');
        console.log('_coopMode:', window._coopMode);
        console.log('_emAndamento:', _emAndamento);
        console.log('_finalizada:', _finalizada);
        console.log('coopFinalizando:', coopFinalizando);
        console.log('coopPartidaConcluida:', coopPartidaConcluida);
        console.log('coopRoomId:', coopRoomId);
        console.log('coopRole:', coopRole);
        console.log('players:',
            (players || []).map(p => ({ name: p?.name, hp: p?.hp, dead: p?.dead })));
        console.groupEnd();
    };

    window._finalizarCoopDerrotaV121 = _finalizar;

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V12.1] Finalização derrota coop (minimalista)');
    console.log('═══════════════════════════════════════════════════');
    console.log('• SEM override de alert/showStoryScreen');
    console.log('• SEM wrapper em coopCriarSala/coopEntrarSala');
    console.log('• coopFinalizar só substituído DURANTE coop + derrota');
    console.log('• Auto-reset quando _coopMode vira true (nova partida)');
    console.log('');
    console.log('💡 Debug: window._debugCoopDefeatV121()');
    console.log('💡 Force: window._finalizarCoopDerrotaV121("teste")');
    console.log('═══════════════════════════════════════════════════');
})();