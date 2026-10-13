// =================================================================
// coop.js — VERSÃO CONSOLIDADA (V2.0)
// -----------------------------------------------------------------
// Arquivo único. Substitui todos os patches anteriores.
//
// Mudanças da V2.0:
//   • P2 roda o boss (não o host)
//   • Sprite do P2 placeholder = silhueta genérica
//   • Auto-update com 3 passos: ação P2 → boss → seu turno
//   • Fix de reentrada em "Minhas Partidas"
//
// Fluxo do turno:
//   P1 joga → publica 'turno_maria'
//   P2 joga → publica 'turno_boss'
//   P2 RODA O BOSS → publica 'turno_joao'
//   P1 vê tudo e joga de novo
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
let coopFinishShowing = false;
let coopP1Atualizado = false;

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
// 5. PAINEL DE SALAS (UI)
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

    // *** DETECTA SE O P2 É PLACEHOLDER ***
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

    // Recria tokens
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

            // *** SPRITE DO PLACEHOLDER = SILHUETA ***
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

    // Boss
    if (rd.estadoJogo?.boss && typeof boss !== 'undefined') {
        const bt = coopBossTypeNormalize(rd.estadoJogo.boss.type);
        Object.assign(boss, rd.estadoJogo.boss);
        boss.type = bt;
    }

    // Grid
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

    coopRenderTudo();
    coopAtualizarUI();
}

function coopRenderTudo() {
    if (typeof updateVisuals === 'function') updateVisuals();
    if (typeof updateHeroCard === 'function') updateHeroCard();
    if (typeof updateBossCard === 'function') updateBossCard();
    if (typeof updateAllSpriteDirections === 'function') updateAllSpriteDirections();
    if (typeof updateHeaderBossName === 'function') updateHeaderBossName();

    setTimeout(() => {
        const bs = document.getElementById('bossCardSprite');
        if (bs && (!bs.src || bs.src.includes('undefined'))) {
            const url = SPRITES[boss.type];
            if (url) bs.src = url;
        }
        const bi = document.getElementById('imgBoss');
        if (bi && (!bi.src || bi.src.includes('undefined'))) {
            const url = SPRITES[boss.type];
            if (url) bi.src = url;
        }
    }, 100);
}

// =================================================================
// 9. HANDLE SELECT
// =================================================================
function coopHandleSelect(idx) {
    if (!window._coopMode) return;
    if (!gameActive || arcadeBossTransition) return;

    const meuIdx = coopMeuIdx();
    const p = players[meuIdx];
    if (!p) return;
    if (p.placeholder) return;

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
    if (coopBossRunning) return;

    const meuIdx = coopMeuIdx();
    const active = players[meuIdx];

    if (!active || active.placeholder) {
        console.error('[coop] Sem herói ativo');
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

    try {
        await coopExecutarAcaoManual(active);
    } catch (e) {
        console.error('[coop] Erro na execução:', e);
    }
}

async function coopExecutarAcaoManual(active) {
    const target = boss;
    const info = CLASS_DB[active.class] || { atk: 2, min: 0 };
    const heroData = STORY_HERO_CLASSES[active.class] || { role: 'Guerreiro' };
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

    const titleAtkBonus = active.titleBonus?.ATK || 0;
    const tileBonus = (usedPath.length > 0 && grid[usedPath[0]] === active.element) ? 1 : 0;
    const totalAtk = info.atk + (active.bonusAtk || 0) + tileBonus + skillAtkBonus + titleAtkBonus;

    coopLog('Ação:', active.name, '| totalAtk:', totalAtk);

    if (heroData.role === 'Guerreiro') {
        const dealDmg = () => {
            if (target.dead) return;
            if ((Math.abs(active.x - target.x) + Math.abs(active.y - target.y)) <= 1) {
                if (typeof playSfx === 'function') playSfx('atkg');
                coopApplyDmg(target, totalAtk);
                if (typeof spawnSwordEffect === 'function') spawnSwordEffect(target.x, target.y);
            }
        };
        dealDmg();
        for (const idx of usedPath) {
            active.x = idx % 8;
            active.y = Math.floor(idx / 8);
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
    }

    path = [];
    if (typeof renderPath === 'function') renderPath();

    RANKING.turns++;

    await coopPublicarEstado();
}

function coopApplyDmg(t, amt) {
    if (t.dead) return;

    t.hp -= amt;
    if (typeof showDmgEffect === 'function') showDmgEffect(t.x, t.y, amt);

    if (t.hp <= 0) {
        t.hp = 0;
        t.dead = true;
    }

    if (typeof updateVisuals === 'function') updateVisuals();
    if (typeof updateBossCard === 'function') updateBossCard();
    if (typeof updateHeroCard === 'function') updateHeroCard();
}

// =================================================================
// 11. PUBLICAR ESTADO
// =================================================================
async function coopPublicarEstado() {
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
        },
        criadaEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const ref = await fbDb.collection(COOP_ROOMS).add(roomData);
    coopRoomId = ref.id;
    window._coopRoomId = ref.id;

    coopLog('Sala criada:', ref.id);
    if (typeof showToast === 'function') showToast('🎮', 'Sala publicada!', '🎮');

    coopInstalarListener();
    coopAtualizarUI();
}

async function coopAtualizarSalaNoFirestore(estado) {
    const bossMorto = estado.boss.dead;
    const todosMortos = estado.players.every(p => p.dead);

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
        atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (bossMorto || todosMortos) {
        update.status = 'concluida';
        update.vencedor = bossMorto ? 'jogadores' : 'boss';
    } else if (coopRole === 'criador') {
        // P1 jogou → turno do P2
        update.status = 'turno_maria';
        update['estadoJogo.turnoDe'] = 'oponente';
    } else {
        // *** P2 jogou → turno do BOSS ***
        update.status = 'turno_boss';
        update['estadoJogo.turnoDe'] = 'boss';
    }

    await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update(update);
    coopLog('Sala atualizada:', update.status);

    // *** MUDANÇA V2.0: SE SOU P2 E VIROU TURNO DO BOSS, EU RODO ***
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
// 12. P2 RODA O BOSS
// =================================================================
async function coopRodarBossP2() {
    if (coopRole !== 'oponente') return;
    if (coopBossRunning) return;
    if (!coopRoomId) return;

    coopBossRunning = true;
    coopLog('P2 rodando boss...');

    // Pega estado atual
    try {
        const doc = await fbDb.collection(COOP_ROOMS).doc(coopRoomId).get();
        if (doc.exists) {
            coopRoomData = { id: doc.id, ...doc.data() };
            coopAplicarEstadoDoRoom(coopRoomData);
        }
    } catch (e) {}

    await coopSleep(500);

    coopForcarBoss = true;

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
    await coopSleep(500);

    // Publica estado com turno pro P1
    const estado = coopCapturarEstado();
    const bossMorto = estado.boss.dead;
    const todosMortos = estado.players.every(p => p.dead);

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
        atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (bossMorto || todosMortos) {
        update.status = 'concluida';
        update.vencedor = bossMorto ? 'jogadores' : 'boss';
    } else {
        update.status = 'turno_joao';
        update['estadoJogo.turnoDe'] = 'criador';
    }

    await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update(update);
    coopLog('Boss rodou (pelo P2). Status:', update.status);

    coopBossRunning = false;

    if (update.status === 'concluida') {
        coopFinalizar(bossMorto);
    } else {
        coopPausar();
    }
}

// =================================================================
// 13. APLICAR ESTADO DO ROOM
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
        Object.assign(boss, room.estadoJogo.boss);
        boss.type = bt;
    }

    if (room.estadoJogo.players && players.length >= 2) {
        room.estadoJogo.players.forEach((pData, i) => {
            if (players[i]) {
                players[i].x = pData.x;
                players[i].y = pData.y;
                players[i].hp = pData.hp;
                players[i].maxHp = pData.maxHp;
                players[i].dead = pData.dead;
            }
        });
    }

    coopRenderTudo();
}

// =================================================================
// 14. LISTENER (auto-update com 3 passos)
// =================================================================
function coopInstalarListener() {
    if (!coopRoomId) return;
    if (coopListenerUnsub) {
        coopListenerUnsub();
        coopListenerUnsub = null;
    }

    coopLog('Instalando listener da sala', coopRoomId);

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
            const eraRoomData = coopRoomData;
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
                coopFinalizar(data.vencedor === 'jogadores');
                return;
            }

            // Atualiza P1 se oponente entrou
            if (coopRole === 'criador' && data.oponente?.heroiClass && !coopP1Atualizado) {
                coopP1Atualizado = true;
                // Reconstrói P1 (remove placeholder)
                if (players[1]) {
                    players[1].class = data.oponente.heroiClass;
                    players[1].name = data.oponente.nome;
                    players[1].placeholder = false;
                    players[1].maxHp = STORY_HERO_CLASSES[data.oponente.heroiClass]?.hp || 16;
                    players[1].hp = players[1].maxHp;

                    // Recria token
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

            // Verifica turno
            const turnoDe = data.estadoJogo?.turnoDe;
            const meuTurnoDe = coopRole === 'criador' ? 'criador' : 'oponente';
            const meuTurno = turnoDe === meuTurnoDe;

            if (meuTurno) {
                coopLog('É meu turno');
                coopAplicarEstadoDoRoom(data);

                // *** MOSTRA RESUMO DAS AÇÕES ***
                // 1. Ação do outro jogador
                const ua = data.estadoJogo?.ultimaAcao;
                if (ua && ua.resumo) {
                    const outroNome = coopRole === 'criador'
                        ? data.oponente?.nome : data.criador?.nome;
                    coopMostrarResumoAcao(ua.resumo, outroNome);
                }

                // 2. Se teve turno do boss entre os turnos, mostra depois
                if (coopRole === 'criador' && data.estadoJogo?.ultimaAcaoBoss) {
                    setTimeout(() => {
                        coopMostrarResumoAcao('atacou', '👹 Boss');
                    }, 2500);
                }

                // 3. Libera o turno
                setTimeout(() => {
                    coopDesbloquear();
                }, data.estadoJogo?.ultimaAcaoBoss ? 5000 : 2500);
            } else {
                coopPausar();
            }
        }, err => console.warn('[coop] Erro no listener:', err));
}

// =================================================================
// 15. UI
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
    if (btnPlay) btnPlay.disabled = false;
    if (btnSkill) {
        const p = players[coopMeuIdx()];
        if (p && !p.skillUsed) btnSkill.disabled = false;
    }
}

function coopDesbloquear() {
    window.currentPlayerIdx = coopMeuIdx();
    window.editingIdx = coopMeuIdx();

    const ov = document.getElementById('coopOverlay');
    if (ov) ov.remove();

    const grid = document.getElementById('grid');
    if (grid) {
        grid.style.pointerEvents = '';
        grid.style.opacity = '';
    }

    coopHabilitarBotoes();
    coopAtualizarUI();
}

function coopPausar() {
    const btnPlay = document.getElementById('btnPlay');
    const btnSkill = document.getElementById('btnSkill');
    if (btnPlay) btnPlay.disabled = true;
    if (btnSkill) btnSkill.disabled = true;

    const grid = document.getElementById('grid');
    if (grid) {
        grid.style.pointerEvents = 'none';
        grid.style.opacity = '0.6';
    }

    const board = document.querySelector('.board-wrapper');
    if (board && !document.getElementById('coopOverlay')) {
        const ov = document.createElement('div');
        ov.id = 'coopOverlay';
        ov.className = 'coop-overlay';
        ov.innerHTML = `
            <div class="coop-overlay-content">
                <div class="coop-overlay-icon">⏳</div>
                <div class="coop-overlay-text">Aguardando oponente...</div>
            </div>
        `;
        board.appendChild(ov);
    }

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
// 16. SAIR / VOLTAR / CANCELAR
// =================================================================
async function coopSairParaAldeia() {
    if (coopRoomId && coopRole === 'criador') {
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

    const grid = document.getElementById('grid');
    if (grid) {
        grid.style.pointerEvents = '';
        grid.style.opacity = '';
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

    // Despausa
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
// 17. FINALIZAR PARTIDA
// =================================================================
async function coopFinalizar(vitoria) {
    if (coopFinishShowing) return;
    coopFinishShowing = true;

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
    coopFinishShowing = false;

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
// 18. BOTÕES NA UI
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
            const grid = document.querySelector('.story-ald-grid');
            if (!grid || grid.querySelector('.coop-aldeia-card')) return;

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
            grid.insertBefore(card, grid.firstChild);
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
            _orig.apply(this, arguments);
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
    }, 300);
})();

// =================================================================
// 19. HOOKS
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
        if (typeof window.storyEnemyAI !== 'function') return;
        clearInterval(check);
        if (window._coopBossBlock) return;
        window._coopBossBlock = true;

        const _origStory = window.storyEnemyAI;
        window.storyEnemyAI = async function() {
            if (window._coopMode && !coopForcarBoss) {
                coopLog('storyEnemyAI bloqueado');
                return;
            }
            return _origStory.apply(this, arguments);
        };

        if (typeof window.bossAI === 'function') {
            const _origBossAI = window.bossAI;
            window.bossAI = async function() {
                if (window._coopMode && !coopForcarBoss) {
                    coopLog('bossAI bloqueado');
                    return;
                }
                return _origBossAI.apply(this, arguments);
            };
        }
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
// 20. CSS
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

        .coop-fase-btn {
            position: absolute; top: 8px; right: 8px;
            width: 34px; height: 34px;
            background: linear-gradient(180deg, rgba(142,68,173,0.3), transparent 45%),
                        linear-gradient(135deg, #5a2a70, #2a1538);
            color: #f0e0ff;
            border: 2px solid #8e44ad;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1rem;
            display: flex; align-items: center; justify-content: center;
            z-index: 10;
            transition: all 0.2s;
        }
        .coop-fase-btn:hover {
            transform: scale(1.15) rotate(-10deg);
            box-shadow: 0 0 20px rgba(142,68,173,0.8);
        }

        .coop-badge {
            display: inline-flex; align-items: center; gap: 4px;
            padding: 4px 10px; margin-left: 12px;
            background: linear-gradient(180deg, rgba(142,68,173,0.25), transparent 50%),
                        rgba(42,21,56,0.6);
            border: 1px solid #8e44ad;
            border-radius: 14px;
            font-family: 'Cinzel', serif;
            font-size: 0.7rem; font-weight: 700;
            color: #c39bd3; letter-spacing: 1px;
            white-space: nowrap;
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

        .coop-overlay {
            position: absolute; inset: 0;
            background: rgba(10,6,2,0.7);
            z-index: 500;
            display: flex; align-items: center; justify-content: center;
            border-radius: 6px;
            backdrop-filter: blur(2px);
        }
        .coop-overlay-content {
            text-align: center;
            padding: 20px 30px;
            background: rgba(42,31,16,0.95);
            border: 2px solid #c9a227;
            border-radius: 8px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        }
        .coop-overlay-icon {
            font-size: 3rem; margin-bottom: 10px;
            animation: coopPulse 1.5s ease-in-out infinite alternate;
        }
        .coop-overlay-text {
            font-family: 'Cinzel', serif;
            color: #e8b923; font-size: 1rem;
            letter-spacing: 2px; font-weight: 700;
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

        /* *** SILHUETA DO PLACEHOLDER *** */
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
// 21. BOOT
// =================================================================
(async function boot() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => coopInit());
    } else {
        coopInit();
    }
    coopLog('coop.js V2.0 carregado.');
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

console.log('✅ coop.js V2.0 (consolidado) carregado.');
