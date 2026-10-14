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
        alert('Erro ao conectar no Firebase. Verifique se o Auth Anônimo está ativo.');
        return false;
    }
}

// =================================================================
// 5. PAINEL DE SALAS
// =================================================================
let painelUnsubs = [];

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
                <div class="coop-lista" id="coopListaAbertas">
                    <div class="coop-empty">Carregando...</div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(painel);

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
            const list = document.getElementById('coopListaAbertas');
            const count = document.getElementById('coopCountAbertas');
            if (!list) return;

            const abertas = snap.docs
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

            count.textContent = abertas.length;

            if (abertas.length === 0) {
                list.innerHTML = '<div class="coop-empty">Nenhuma sala aberta. Crie uma!</div>';
                return;
            }

            list.innerHTML = abertas.map(r => coopRenderCard(r, 'aberta')).join('');
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
                <span class="coop-card-fase">📖 Fase ${fase}</span>
                ${badge}
            </div>
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
async function coopCriarSala(atoId, faseId) {
    if (!coopUser) {
        const ok = await coopInit();
        if (!ok) return;
    }

    if (!confirm(`🎮 CRIAR SALA COOP\n\nFase: ${faseId} (Ato ${atoId})\n\nVocê vai jogar seu turno. Depois a sala fica aberta pra um amigo entrar.\n\nContinuar?`)) {
        return;
    }

    window._coopMode = true;
    coopRole = 'criador';
    window._coopRole = 'criador';
    coopRoomId = null;
    coopFaseId = faseId;
    coopAtoId = parseInt(atoId);
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

    if (typeof startStoryPhase === 'function') {
        startStoryPhase(parseInt(atoId), faseId);
    }
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
            alert('Sala não encontrada.');
            return;
        }
        room = { id: doc.id, ...doc.data() };
    } catch (e) {
        alert('Erro ao buscar sala: ' + e.message);
        return;
    }

    if (room.criador?.uid === coopUser.uid) {
        alert('Você não pode entrar na sua própria sala.');
        return;
    }
    if (room.oponente?.uid) {
        alert('Esta sala já tem oponente.');
        return;
    }

    const meuHeroClass = (STORY_PROGRESS.selectedHeroes || ['Tupa'])[0];
    const meuHeroData = STORY_HERO_CLASSES[meuHeroClass];
    const meuNome = coopSanitize(localStorage.getItem('coop_player_name') || 'Jogador');

    if (!meuHeroData) {
        alert('Herói inválido no save.');
        return;
    }

    if (!confirm(`🎮 ENTRAR NA SALA COOP\n\nCriador: ${room.criador.nome} (${room.criador.heroi})\nFase: ${room.fase}\nSeu herói: ${meuHeroData.displayName}\n\nEntrar?`)) {
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
        alert('Erro ao entrar: ' + e.message);
        return;
    }

    window._coopMode = true;
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

    if (typeof startStoryPhase === 'function') {
        startStoryPhase(parseInt(room.ato), room.fase);
    }
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
            if ((Math.abs(active.x - target.x) + Math.abs(active.y - target.y)) <= 1) {
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
        players: players.map(p => ({
            id: p.id, x: p.x, y: p.y, hp: p.hp, maxHp: p.maxHp,
            class: p.class, element: p.element, name: p.name,
            skillUsed: p.skillUsed, dead: p.dead, bonusAtk: p.bonusAtk || 0,
        })),
        boss: {
            x: boss.x, y: boss.y, hp: boss.hp, maxHp: boss.maxHp,
            type: boss.type, dead: boss.dead,
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

    try {
        if (typeof storyEnemyAI === 'function') {
            await storyEnemyAI();
        } else if (typeof bossAI === 'function') {
            await bossAI();
        }
    } catch (e) {
        console.error('[coop] Erro na IA:', e);
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

            // 1. Tenta pelo STORY_ANIMAL_SKILLS (handlers reais)
            if (typeof STORY_ANIMAL_SKILLS !== 'undefined' &&
                STORY_ANIMAL_SKILLS[handlerKey]) {
                try {
                    const handler = STORY_ANIMAL_SKILLS[handlerKey];
                    const enemyMock = {
                        id: evento.enemyId,
                        name: (typeof STORY_ENEMIES !== 'undefined' && STORY_ENEMIES[evento.enemyId])
                              ? STORY_ENEMIES[evento.enemyId].name
                              : 'Boss',
                        atk: 4,
                    };
                    const skillMock = { name: skillName, handler: handlerKey };
                    console.log('[coop] Reproduzindo skill:', skillName);
                    await handler(enemyMock, skillMock);
                    reproduzido = true;
                } catch (e) {
                    console.warn('[coop] Falha ao reproduzir skill:', skillName, e);
                }
            }

            // 2. Fallback: chama função global
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
                    alert('⚠️ A sala foi cancelada.');
                    coopSairParaAldeia();
                }
                return;
            }

            const data = doc.data();
            coopRoomData = { id: doc.id, ...data };

            if (!window._coopMode) return;

            if (data.status === 'cancelada') {
                alert('⚠️ O criador cancelou a partida.');
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
        btn.onclick = () => {
            if (confirm('Sair da sala? A partida fica pausada.')) coopSairParaAldeia();
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

    window._coopMode = false;
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
            alert('Sala não encontrada.');
            return;
        }
        room = { id: doc.id, ...doc.data() };
    } catch (e) {
        alert('Erro: ' + e.message);
        return;
    }

    const isCriador = room.criador?.uid === coopUser.uid;
    const isOponente = room.oponente?.uid === coopUser.uid;

    if (!isCriador && !isOponente) {
        alert('Você não participa desta sala.');
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

    if (typeof startStoryPhase === 'function') {
        startStoryPhase(parseInt(room.ato), room.fase);
    }
}

async function coopCancelarSala(roomId) {
    if (!confirm('Cancelar e deletar esta partida?\n\nO oponente será avisado.')) return;

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
        alert('Erro ao cancelar: ' + e.message);
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

    let msg = '';
    if (vitoria && coopFaseId) {
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

    alert(vitoria
        ? `🏆 VITÓRIA COOP!${msg}\n\nVoltando à Aldeia.`
        : `💀 DERROTA COOP...\n\nVoltando à Aldeia.`);

    window._coopMode = false;
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

    if (typeof showStoryScreen === 'function') {
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
            if (coopCapturandoEventosBoss && window._coopMode && skill) {
                coopBufferEventosBoss.push({
                    tipo: 'boss_skill',
                    skill: skill.handler || skill.name,
                    skillName: skill.name || '',
                    enemyId: enemy ? enemy.id : null,
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
            max-width: 600px; width: 100%;
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
            color: #e8b923; font-size: 0.9rem;
            letter-spacing: 1px; font-weight: 700;
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
                const enemyMock = {
                    id: evento.enemyId,
                    name: (typeof STORY_ENEMIES !== 'undefined' && STORY_ENEMIES[evento.enemyId])
                          ? STORY_ENEMIES[evento.enemyId].name
                          : 'Boss',
                    atk: 4,
                };
                const skillMock = { name: skillName, handler: handlerKey };

                console.log('[V8.8] Reproduzindo skill com snapshot:', skillName);
                await handler(enemyMock, skillMock);
                reproduzido = true;
            }
        } catch (e) {
            console.warn('[V8.8] Falha ao reproduzir skill:', skillName, e);
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