// =================================================================
// pvp.js — PVP ONLINE V3.0
// -----------------------------------------------------------------
// Baseado 100% no coop.js V8.5 + patches (que funciona).
//
// FILOSOFIA:
//   • O "boss" do coop vira o ADVERSÁRIO no PVP
//   • Não existe IA de boss (storyEnemyAI nunca roda)
//   • Turnos alternados: criador → oponente → criador → ...
//   • Criador só joga após o oponente entrar
//
// MANTÉM DO COOP:
//   • Sincronização via Firestore
//   • Replay de eventos por UID
//   • Sistema de aposta
//   • Painel de salas com filtro por modo
//   • UI (badge, banner, resumo, sair)
//
// TROCA DO COOP:
//   • Coleção: salas_pvp_v1 (separada)
//   • Sem coopRodarBossP2, sem coopProcessarMorteBoss
//   • turnoDe só tem 'criador' e 'oponente'
//   • Vitória = adversário morre
// =================================================================

// =================================================================
// 1. FIREBASE
// =================================================================
const pvpFbAuth = firebase.auth();
const pvpFbDb = firebase.firestore();
const PVP_ROOMS = 'salas_pvp_v1';

// =================================================================
// 2. ESTADO LOCAL
// =================================================================
let pvpUser = null;
let pvpRole = null;                  // 'criador' | 'oponente'
let pvpRoomId = null;
let pvpRoomData = null;
let pvpMeuHeroClass = null;
let pvpMeuNome = null;

let pvpEventosTurno = [];
let pvpReplayRodando = false;
let pvpPublishingLock = false;
let pvpListenerUnsub = null;
let pvpFinalizando = false;
let pvpPartidaConcluida = false;
let pvpProcessandoMorte = false;
let pvpAguardandoOponente = false;

let pvpMinhaAposta = { xp: 0, gold: 0 };

// =================================================================
// 3. UTILITÁRIOS
// =================================================================
function pvpLog(...args) { console.log('[pvp]', ...args); }
function pvpSleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function pvpMeuUid() { return pvpUser?.uid || null; }
function pvpMeuIdx() { return pvpRole === 'criador' ? 0 : 1; }
function pvpAdversarioIdx() { return pvpRole === 'criador' ? 1 : 0; }
function pvpSanitize(s) { return String(s || 'Jogador').substring(0, 20).replace(/[<>]/g, ''); }

function pvpEhMeuTurno() {
    if (!pvpRoomData) return false;
    if (pvpAguardandoOponente) return false;
    const t = pvpRoomData.estadoJogo?.turnoDe;
    if (!t) return false;
    return t === pvpRole;
}

function pvpRegistrarEvento(ev) {
    if (!window._pvpMode) return;
    ev.uid = pvpMeuUid();
    ev.role = pvpRole;
    pvpEventosTurno.push(ev);
}

function pvpGetAdversario() {
    return players[pvpAdversarioIdx()];
}

// =================================================================
// 4. HELPERS DE TELA
// =================================================================
function pvpMostrarGameScreen() {
    ['introScreen', 'titleScreen', 'modeScreen', 'playersScreen',
     'challengeScreen', 'configScreen', 'tutorialScreen', 'storyScreen']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.display = 'none'; el.classList.remove('active'); }
        });
    const gs = document.getElementById('gameScreen');
    if (gs) { gs.style.display = 'flex'; gs.classList.add('active'); }
    window.currentScreen = 'game';
}

// =================================================================
// 5. LOGIN
// =================================================================
async function pvpInit() {
    if (pvpUser) return true;
    if (pvpFbAuth.currentUser) { pvpUser = pvpFbAuth.currentUser; return true; }
    try {
        const r = await pvpFbAuth.signInAnonymously();
        pvpUser = r.user;
        pvpLog('Login OK:', pvpUser.uid);
        return true;
    } catch (e) {
        console.error('[pvp] Erro no login:', e);
        alert('Erro ao conectar no Firebase.');
        return false;
    }
}

// =================================================================
// 6. SISTEMA DE APOSTA
// =================================================================
function pvpCreditar(xp, gold) {
    if (xp > 0) STORY_PROGRESS.totalXP = (STORY_PROGRESS.totalXP || 0) + xp;
    if (gold > 0) STORY_PROGRESS.gold = (STORY_PROGRESS.gold || 0) + gold;
    if (typeof saveStoryProgress === 'function') saveStoryProgress();
}

function pvpDebitar(xp, gold) {
    if (xp > 0) STORY_PROGRESS.totalXP = Math.max(0, (STORY_PROGRESS.totalXP || 0) - xp);
    if (gold > 0) STORY_PROGRESS.gold = Math.max(0, (STORY_PROGRESS.gold || 0) - gold);
    if (typeof saveStoryProgress === 'function') saveStoryProgress();
}

function pvpModalAposta() {
    return new Promise(resolve => {
        const meuXP = STORY_PROGRESS.totalXP || 0;
        const meuGold = STORY_PROGRESS.gold || 0;
        const old = document.getElementById('pvpModalAposta');
        if (old) old.remove();

        const modal = document.createElement('div');
        modal.id = 'pvpModalAposta';
        modal.className = 'coop-painel-overlay';
        modal.style.zIndex = '21000';
        modal.innerHTML = `
            <div class="coop-painel-container" style="max-width: 480px;">
                <div class="coop-painel-header">
                    <h2>🔥 PVP VALENDO</h2>
                    <button class="coop-painel-close" id="pvpApostaCancelar">✕ CANCELAR</button>
                </div>
                <div class="coop-painel-subtitle">
                    Defina o que está em jogo. Quem perder, perde isso.<br>Quem ganhar, leva tudo.
                </div>
                <div style="padding: 20px;">
                    <div style="margin-bottom: 18px;">
                        <label style="display:block; color:#d9c89a; font-family:'Cinzel',serif; font-size:.85rem; margin-bottom:8px;">
                            ⭐ XP APOSTADO (você tem ${meuXP})
                        </label>
                        <input type="range" id="pvpApostaXP" min="0" max="${meuXP}" step="5" value="0" style="width:100%; accent-color:#e8b923;">
                        <div style="text-align:center; color:#e8b923; font-family:'Cinzel',serif; font-size:1.3rem; font-weight:700; margin-top:8px;" id="pvpApostaXPVal">0 XP</div>
                    </div>
                    <div style="margin-bottom: 18px;">
                        <label style="display:block; color:#d9c89a; font-family:'Cinzel',serif; font-size:.85rem; margin-bottom:8px;">
                            💰 OURO APOSTADO (você tem ${meuGold})
                        </label>
                        <input type="range" id="pvpApostaGold" min="0" max="${meuGold}" step="5" value="0" style="width:100%; accent-color:#e8b923;">
                        <div style="text-align:center; color:#e8b923; font-family:'Cinzel',serif; font-size:1.3rem; font-weight:700; margin-top:8px;" id="pvpApostaGoldVal">0 ouro</div>
                    </div>
                    <div style="background: rgba(10,6,2,0.5); padding: 12px; border-radius: 6px; border-left: 3px solid #c9a227; margin-bottom: 20px;">
                        <div style="font-family:'EB Garamond',serif; color:#b8a577; font-size:.9rem; font-style:italic;">
                            💡 Aposte 0 para jogar sem perder nada.
                        </div>
                    </div>
                    <button id="pvpApostaConfirmar" style="width:100%; padding:14px; background: linear-gradient(135deg, #6a5024, #3a2a14); color:#fff5dc; border: 2px solid #e8b923; border-radius:6px; font-family:'Cinzel',serif; font-weight:700; font-size:1rem; letter-spacing:2px; cursor:pointer;">
                        ⚔️ CRIAR SALA COM ESSA APOSTA
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const xpS = document.getElementById('pvpApostaXP');
        const gS = document.getElementById('pvpApostaGold');
        const xpV = document.getElementById('pvpApostaXPVal');
        const gV = document.getElementById('pvpApostaGoldVal');
        xpS.oninput = () => { xpV.textContent = `${xpS.value} XP`; };
        gS.oninput = () => { gV.textContent = `${gS.value} ouro`; };

        document.getElementById('pvpApostaConfirmar').onclick = () => {
            modal.remove();
            resolve({ xp: parseInt(xpS.value) || 0, gold: parseInt(gS.value) || 0 });
        };
        document.getElementById('pvpApostaCancelar').onclick = () => {
            modal.remove();
            resolve(null);
        };
    });
}

function pvpModalAceitar(room) {
    return new Promise(resolve => {
        const apostaXP = room.aposta?.xp || 0;
        const apostaGold = room.aposta?.gold || 0;
        const meuXP = STORY_PROGRESS.totalXP || 0;
        const meuGold = STORY_PROGRESS.gold || 0;
        const temXP = meuXP >= apostaXP;
        const temGold = meuGold >= apostaGold;
        const podeEntrar = temXP && temGold;

        const old = document.getElementById('pvpModalAceitar');
        if (old) old.remove();

        const modal = document.createElement('div');
        modal.id = 'pvpModalAceitar';
        modal.className = 'coop-painel-overlay';
        modal.style.zIndex = '21000';
        modal.innerHTML = `
            <div class="coop-painel-container" style="max-width: 480px;">
                <div class="coop-painel-header">
                    <h2>⚔️ ACEITAR DESAFIO</h2>
                    <button class="coop-painel-close" id="pvpAceitarCancelar">✕ CANCELAR</button>
                </div>
                <div style="padding: 20px;">
                    <div style="text-align:center; margin-bottom:20px;">
                        <div style="font-family:'Cinzel',serif; color:#c39bd3; font-size:1.1rem;">${room.criador.nome}</div>
                        <div style="font-family:'EB Garamond',serif; color:#b8a577; font-size:.95rem; font-style:italic;">desafiou você valendo:</div>
                    </div>
                    ${apostaXP > 0 || apostaGold > 0 ? `
                        <div style="background: rgba(201,162,39,0.1); border: 2px solid #c9a227; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align:center;">
                            ${apostaXP > 0 ? `<div style="font-family:'Cinzel',serif; color:#e8b923; font-size:1.5rem;">⭐ ${apostaXP} XP</div>` : ''}
                            ${apostaGold > 0 ? `<div style="font-family:'Cinzel',serif; color:#e8b923; font-size:1.5rem;">💰 ${apostaGold} ouro</div>` : ''}
                        </div>
                    ` : `
                        <div style="background: rgba(10,6,2,0.5); border-left:3px solid #6ba35c; border-radius:6px; padding:16px; margin-bottom: 20px; text-align:center;">
                            <div style="color:#8ac070; font-family:'EB Garamond',serif; font-style:italic;">Partida amistosa</div>
                        </div>
                    `}
                    <div style="background: rgba(10,6,2,0.5); padding: 12px; border-radius: 6px; margin-bottom: 20px;">
                        <div style="font-family:'Cinzel',serif; color:#8a7a52; font-size:.75rem; margin-bottom:6px;">SEU SALDO</div>
                        <div style="color:${temXP ? '#8ac070' : '#d05050'}; font-family:'EB Garamond',serif;">⭐ ${meuXP} XP ${!temXP ? '(insuficiente)' : ''}</div>
                        <div style="color:${temGold ? '#8ac070' : '#d05050'}; font-family:'EB Garamond',serif;">💰 ${meuGold} ouro ${!temGold ? '(insuficiente)' : ''}</div>
                    </div>
                    <button id="pvpAceitarConfirmar" ${podeEntrar ? '' : 'disabled'} style="width:100%; padding:14px; background: ${podeEntrar ? 'linear-gradient(135deg, #6a5024, #3a2a14)' : '#2a1f10'}; color:${podeEntrar ? '#fff5dc' : '#6a5024'}; border: 2px solid ${podeEntrar ? '#e8b923' : '#3d2d18'}; border-radius:6px; font-family:'Cinzel',serif; font-weight:700; cursor:${podeEntrar ? 'pointer' : 'not-allowed'};">
                        ${podeEntrar ? '⚔️ ACEITAR E ENTRAR' : '✕ SALDO INSUFICIENTE'}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        if (podeEntrar) {
            document.getElementById('pvpAceitarConfirmar').onclick = () => { modal.remove(); resolve(true); };
        }
        document.getElementById('pvpAceitarCancelar').onclick = () => { modal.remove(); resolve(false); };
    });
}

// =================================================================
// 7. PAINEL DE SALAS
// =================================================================
let pvpPainelUnsubs = [];

function pvpAbrirPainel() {
    if (!pvpUser) { pvpInit().then(ok => { if (ok) pvpAbrirPainel(); }); return; }

    const old = document.getElementById('pvpPainel');
    if (old) old.remove();
    pvpPainelUnsubs.forEach(u => u && u());
    pvpPainelUnsubs = [];

    const painel = document.createElement('div');
    painel.id = 'pvpPainel';
    painel.className = 'coop-painel-overlay';
    painel.innerHTML = `
        <div class="coop-painel-container">
            <div class="coop-painel-header">
                <h2>⚔️ PVP ONLINE</h2>
                <button class="coop-painel-close" onclick="pvpFecharPainel()">✕ FECHAR</button>
            </div>
            <div class="coop-painel-subtitle">
                Duelo 1 vs 1 online. Turnos alternados.
            </div>
            <div class="coop-painel-section">
                <div class="coop-painel-section-title">🎯 CRIAR PARTIDA</div>
                <div style="padding: 12px 0;">
                    <button class="coop-btn-coop entrar" style="width: 100%; padding: 14px;" onclick="pvpCriarSala()">
                        ➕ CRIAR SALA PVP
                    </button>
                </div>
            </div>
            <div class="coop-painel-section">
                <div class="coop-painel-section-title">
                    👤 MINHAS PARTIDAS <span class="coop-count" id="pvpCountMinhas">0</span>
                </div>
                <div class="coop-lista" id="pvpListaMinhas">
                    <div class="coop-empty">Carregando...</div>
                </div>
            </div>
            <div class="coop-painel-section">
                <div class="coop-painel-section-title">
                    🌐 SALAS ABERTAS <span class="coop-count" id="pvpCountAbertas">0</span>
                </div>
                <div class="coop-lista" id="pvpListaAbertas">
                    <div class="coop-empty">Carregando...</div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(painel);
    pvpAssinarMinhas();
    pvpAssinarAbertas();
}

function pvpFecharPainel() {
    pvpPainelUnsubs.forEach(u => u && u());
    pvpPainelUnsubs = [];
    const p = document.getElementById('pvpPainel');
    if (p) p.remove();
}

function pvpAssinarMinhas() {
    let c = [], o = [];
    const render = () => {
        const list = document.getElementById('pvpListaMinhas');
        const count = document.getElementById('pvpCountMinhas');
        if (!list) return;
        const todas = [...c, ...o];
        count.textContent = todas.length;
        if (todas.length === 0) {
            list.innerHTML = '<div class="coop-empty">Você não tem partidas.</div>';
            return;
        }
        todas.sort((a, b) => (b.atualizadaEm?.toMillis?.() || 0) - (a.atualizadaEm?.toMillis?.() || 0));
        list.innerHTML = todas.map(r => pvpRenderCard(r, 'minha')).join('');
    };

    const u1 = pvpFbDb.collection(PVP_ROOMS)
        .where('criador.uid', '==', pvpUser.uid)
        .onSnapshot(s => {
            c = s.docs.map(d => ({ id: d.id, ...d.data() }))
                .filter(r => r.status !== 'concluida' && r.status !== 'cancelada');
            render();
        }, e => console.warn('[pvp] Listener minhas (criador):', e));

    const u2 = pvpFbDb.collection(PVP_ROOMS)
        .where('oponente.uid', '==', pvpUser.uid)
        .onSnapshot(s => {
            o = s.docs.map(d => ({ id: d.id, ...d.data() }))
                .filter(r => r.status !== 'concluida' && r.status !== 'cancelada');
            render();
        }, e => console.warn('[pvp] Listener minhas (oponente):', e));

    pvpPainelUnsubs.push(u1, u2);
}

function pvpAssinarAbertas() {
    const unsub = pvpFbDb.collection(PVP_ROOMS)
        .onSnapshot(s => {
            const list = document.getElementById('pvpListaAbertas');
            const count = document.getElementById('pvpCountAbertas');
            if (!list) return;

            const abertas = s.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(r => r.criador?.uid !== pvpUser.uid && !r.oponente?.uid && r.status === 'aguardando_oponente')
                .sort((a, b) => (b.criadaEm?.toMillis?.() || 0) - (a.criadaEm?.toMillis?.() || 0));

            count.textContent = abertas.length;
            if (abertas.length === 0) {
                list.innerHTML = '<div class="coop-empty">Nenhuma sala aberta.</div>';
                return;
            }
            list.innerHTML = abertas.map(r => pvpRenderCard(r, 'aberta')).join('');
        }, e => console.warn('[pvp] Listener abertas:', e));
    pvpPainelUnsubs.push(unsub);
}

function pvpRenderCard(room, tipo) {
    const isC = room.criador?.uid === pvpUser.uid;
    const isO = room.oponente?.uid === pvpUser.uid;
    const aposta = room.aposta || { xp: 0, gold: 0 };
    const apostaTxt = (aposta.xp > 0 || aposta.gold > 0)
        ? `⭐ ${aposta.xp} XP · 💰 ${aposta.gold} ouro`
        : 'Sem aposta';

    let badge = '';
    let acoes = '';

    if (tipo === 'aberta') {
        badge = '<span class="coop-badge amarelo">🟡 Aberta</span>';
        acoes = `<button class="coop-btn-coop entrar" onclick="pvpEntrarSala('${room.id}')">⚔️ ENTRAR</button>`;
    } else {
        if (room.status === 'pausada') {
            badge = '<span class="coop-badge cinza">⏸️ Pausada</span>';
        } else if (room.status === 'aguardando_oponente') {
            badge = '<span class="coop-badge amarelo">⏳ Aguardando</span>';
        } else {
            const turnoDe = room.estadoJogo?.turnoDe;
            const meuTurno = (isC && turnoDe === 'criador') || (isO && turnoDe === 'oponente');
            badge = meuTurno
                ? '<span class="coop-badge verde">🎯 SEU TURNO</span>'
                : '<span class="coop-badge amarelo">⏳ Aguardando</span>';
        }
        acoes = `
            <button class="coop-btn-coop" onclick="pvpContinuarSala('${room.id}')">▶ CONTINUAR</button>
            ${isC ? `<button class="coop-btn-coop cancelar" onclick="pvpCancelarSala('${room.id}')">🗑️</button>` : ''}
        `;
    }

    return `
        <div class="coop-card">
            <div class="coop-card-header">
                <span class="coop-card-fase">⚔️ PVP 1v1</span>
                ${badge}
            </div>
            <div class="coop-card-players">
                <span class="coop-jogador ${isC ? 'me' : ''}">👤 ${room.criador?.nome || '?'} <b>(${room.criador?.heroi || '?'})</b></span>
                <span class="coop-vs">vs</span>
                <span class="coop-jogador ${isO ? 'me' : ''} ${!room.oponente ? 'vazio' : ''}">
                    ${room.oponente ? `👤 ${room.oponente.nome} <b>(${room.oponente.heroi})</b>` : '❓ aguardando...'}
                </span>
            </div>
            <div style="text-align:center; font-family:'EB Garamond',serif; color:#e8b923; font-size:.85rem; margin-top:6px;">
                🔥 ${apostaTxt}
            </div>
            <div class="coop-card-acoes">${acoes}</div>
        </div>
    `;
}

// =================================================================
// 8. CRIAR SALA
// =================================================================
async function pvpCriarSala() {
    try {
        if (!pvpUser) { const ok = await pvpInit(); if (!ok) return; }

        pvpMeuHeroClass = (STORY_PROGRESS.selectedHeroes || ['Tupa'])[0];
        const heroData = STORY_HERO_CLASSES[pvpMeuHeroClass];
        if (!heroData) { alert('Selecione um herói antes.'); return; }

        pvpMeuNome = pvpSanitize(localStorage.getItem('coop_player_name') || 'Jogador');

        const aposta = await pvpModalAposta();
        if (!aposta) return;

        // Estado
        window._pvpMode = true;
        pvpRole = 'criador';
        pvpRoomId = null;
        pvpRoomData = null;
        pvpEventosTurno = [];
        pvpReplayRodando = false;
        pvpFinalizando = false;
        pvpPartidaConcluida = false;
        pvpProcessandoMorte = false;
        pvpAguardandoOponente = true;
        pvpMinhaAposta = aposta;

        // Config players
        try { mode = 'PVP'; } catch(e) {}
        window.mode = 'PVP';
        playerCount = 2;
        playerConfigs[0].active = true;
        playerConfigs[0].class = pvpMeuHeroClass;
        playerConfigs[0].name = pvpMeuNome;
        playerConfigs[1].active = true;
        playerConfigs[1].class = pvpMeuHeroClass;
        playerConfigs[1].name = 'aguardando...';

        pvpFecharPainel();
        pvpMostrarGameScreen();

        // Setup do initGame adaptado (usa o initGame original)
        const _origInitGame = window.initGame;
        window.initGame = async function() {
            const prevStory = window._storyMode;
            window._storyMode = false;

            try {
                await _origInitGame.apply(this, arguments);
            } finally {
                window.initGame = _origInitGame;
                window._storyMode = prevStory;
            }

            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

            pvpRebuildPlayers();
            pvpBloquearTurno();
            setTimeout(() => pvpInjetarUI(), 500);
        };

        // Chama initGame
        if (typeof initGame === 'function') {
            await initGame();
        }

        // Cria sala
        await pvpCriarSalaNoFirestore(aposta);

        pvpLog('Sala criada. Aguardando oponente...');
    } catch (e) {
        console.error('[pvp] ERRO em pvpCriarSala:', e);
        console.error(e.stack);
        alert('Erro ao criar sala: ' + e.message);
    }
}

async function pvpCriarSalaNoFirestore(aposta) {
    const heroData = STORY_HERO_CLASSES[pvpMeuHeroClass];
    const estado = pvpCapturarEstado();

    const roomData = {
        status: 'aguardando_oponente',
        aposta: { xp: aposta.xp || 0, gold: aposta.gold || 0 },
        criador: {
            uid: pvpUser.uid,
            nome: pvpMeuNome,
            heroi: heroData?.displayName || pvpMeuHeroClass,
            heroiClass: pvpMeuHeroClass,
            saveName: STORY_CURRENT_SAVE_NAME,
        },
        oponente: null,
        estadoJogo: {
            grid: estado.grid,
            amulets: estado.amulets,
            players: estado.players,
            turnoDe: null,
            eventosTurno: [],
        },
        criadaEm: firebase.firestore.FieldValue.serverTimestamp(),
        atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const ref = await pvpFbDb.collection(PVP_ROOMS).add(roomData);
    pvpRoomId = ref.id;

    pvpLog('Sala criada:', ref.id);
    if (typeof showToast === 'function') {
        showToast('⚔️', `Sala criada! Aposta: ${aposta.xp} XP + ${aposta.gold} ouro`, '⚔️');
    }

    pvpInstalarListener();
    pvpAtualizarUI();
}

// =================================================================
// 9. ENTRAR EM SALA
// =================================================================
async function pvpEntrarSala(roomId) {
    try {
        if (!pvpUser) { const ok = await pvpInit(); if (!ok) return; }

        let room;
        try {
            const doc = await pvpFbDb.collection(PVP_ROOMS).doc(roomId).get();
            if (!doc.exists) { alert('Sala não encontrada.'); return; }
            room = { id: doc.id, ...doc.data() };
        } catch (e) { alert('Erro: ' + e.message); return; }

        if (room.criador?.uid === pvpUser.uid) { alert('Você não pode entrar na sua própria sala.'); return; }
        if (room.oponente?.uid) { alert('Sala já tem oponente.'); return; }

        const meuHeroClass = (STORY_PROGRESS.selectedHeroes || ['Tupa'])[0];
        const meuHeroData = STORY_HERO_CLASSES[meuHeroClass];
        const meuNome = pvpSanitize(localStorage.getItem('coop_player_name') || 'Jogador');
        if (!meuHeroData) { alert('Herói inválido.'); return; }

        const aceitou = await pvpModalAceitar(room);
        if (!aceitou) return;

        try {
            await pvpFbDb.collection(PVP_ROOMS).doc(roomId).update({
                oponente: {
                    uid: pvpUser.uid, nome: meuNome,
                    heroi: meuHeroData.displayName, heroiClass: meuHeroClass,
                    saveName: STORY_CURRENT_SAVE_NAME,
                },
                status: 'turno_criador',
                'estadoJogo.turnoDe': 'criador',
                atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
            });
        } catch (e) { alert('Erro ao entrar: ' + e.message); return; }

        // Estado
        window._pvpMode = true;
        pvpRole = 'oponente';
        pvpRoomId = roomId;
        pvpRoomData = room;
        pvpMeuHeroClass = meuHeroClass;
        pvpMeuNome = meuNome;
        pvpEventosTurno = [];
        pvpReplayRodando = false;
        pvpFinalizando = false;
        pvpPartidaConcluida = false;
        pvpProcessandoMorte = false;
        pvpAguardandoOponente = false;
        pvpMinhaAposta = { xp: room.aposta?.xp || 0, gold: room.aposta?.gold || 0 };

        try { mode = 'PVP'; } catch(e) {}
        window.mode = 'PVP';
        playerCount = 2;
        playerConfigs[0].active = true;
        playerConfigs[0].class = room.criador.heroiClass;
        playerConfigs[0].name = room.criador.nome;
        playerConfigs[1].active = true;
        playerConfigs[1].class = meuHeroClass;
        playerConfigs[1].name = meuNome;

        pvpFecharPainel();
        pvpMostrarGameScreen();

        const _origInitGame = window.initGame;
        window.initGame = async function() {
            const prevStory = window._storyMode;
            window._storyMode = false;

            try {
                await _origInitGame.apply(this, arguments);
            } finally {
                window.initGame = _origInitGame;
                window._storyMode = prevStory;
            }

            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

            try {
                const doc = await pvpFbDb.collection(PVP_ROOMS).doc(roomId).get();
                if (doc.exists) pvpRoomData = { id: doc.id, ...doc.data() };
            } catch (e) {}

            pvpRebuildPlayers();
            pvpInstalarListener();
            setTimeout(() => pvpInjetarUI(), 500);
        };

        if (typeof initGame === 'function') {
            await initGame();
        }

        pvpLog('Entrou na sala. Aguardando turno do criador.');
    } catch (e) {
        console.error('[pvp] ERRO em pvpEntrarSala:', e);
        alert('Erro ao entrar: ' + e.message);
    }
}

// =================================================================
// 10. REBUILD PLAYERS
// =================================================================
function pvpRebuildPlayers() {
    if (!window._pvpMode) return;

    const rd = pvpRoomData || {};
    const heroCriador = rd.criador?.heroiClass || playerConfigs[0].class || 'Tupa';
    const heroOponente = rd.oponente?.heroiClass || playerConfigs[1].class || 'Tupa';

    const estadoPlayers = rd.estadoJogo?.players || [];
    const p0Data = estadoPlayers[0] || {};
    const p1Data = estadoPlayers[1] || {};

    players.length = 0;

    players.push({
        id: 0,
        x: p0Data.x ?? 3,
        y: p0Data.y ?? 7,
        hp: p0Data.hp ?? (STORY_HERO_CLASSES[heroCriador]?.hp || 16),
        maxHp: p0Data.maxHp ?? (STORY_HERO_CLASSES[heroCriador]?.hp || 16),
        class: heroCriador,
        element: p0Data.element || 'FOGO',
        name: rd.criador?.nome || 'Criador',
        skillUsed: p0Data.skillUsed || false,
        dead: p0Data.dead || false,
        bonusAtk: p0Data.bonusAtk || 0,
        placeholder: false,
    });

    players.push({
        id: 1,
        x: p1Data.x ?? 4,
        y: p1Data.y ?? 0,
        hp: p1Data.hp ?? (STORY_HERO_CLASSES[heroOponente]?.hp || 16),
        maxHp: p1Data.maxHp ?? (STORY_HERO_CLASSES[heroOponente]?.hp || 16),
        class: rd.oponente?.heroiClass || heroOponente,
        element: p1Data.element || 'FOGO',
        name: rd.oponente?.nome || 'aguardando...',
        skillUsed: p1Data.skillUsed || false,
        dead: p1Data.dead || false,
        bonusAtk: p1Data.bonusAtk || 0,
        placeholder: !rd.oponente?.uid,
    });

    // Tokens
    const board = document.getElementById('board');
    if (board) {
        board.querySelectorAll('.token').forEach(t => t.remove());
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

    // Grid + amulets
    if (rd.estadoJogo?.grid) {
        for (let i = 0; i < 64; i++) {
            if (rd.estadoJogo.grid[i]) grid[i] = rd.estadoJogo.grid[i];
        }
    }
    if (rd.estadoJogo?.amulets) {
        amulets.length = 0;
        rd.estadoJogo.amulets.forEach(a => amulets.push(a));
    }

    // ⭐ Sincroniza o "boss" com o adversário (para o bossCard mostrar o adv)
    const advIdx = pvpAdversarioIdx();
    const adv = players[advIdx];
    if (adv) {
        boss.x = adv.x;
        boss.y = adv.y;
        boss.hp = adv.hp;
        boss.maxHp = adv.maxHp;
        boss.dead = adv.dead;
        boss.type = adv.class;  // guarda a classe do herói
    }

    window.currentPlayerIdx = pvpMeuIdx();
    window.editingIdx = pvpMeuIdx();

    // Aplica bônus de nível + equipamento
    players.forEach(p => {
        if (typeof getHeroBonusFromLevel === 'function') {
            const b = getHeroBonusFromLevel(p.class) || {};
            if (b.hp > 0 && !p.levelBonusApplied) {
                p.maxHp += b.hp; p.hp = p.maxHp; p.levelBonusApplied = true;
            }
        }
        if (typeof applyHeroEquipment === 'function' && !p.equipApplied) {
            try { applyHeroEquipment(p); p.equipApplied = true; } catch(e) {}
        }
    });

    pvpRenderTudo();
    pvpAtualizarUI();
}

function pvpRenderTudo() {
    if (typeof updateVisuals === 'function') updateVisuals();
    if (typeof updateHeroCard === 'function') updateHeroCard();
    if (typeof updateAllSpriteDirections === 'function') updateAllSpriteDirections();
    if (typeof updateHeaderBossName === 'function') updateHeaderBossName();

    // ⭐ Boss card = adversário
    const advIdx = pvpAdversarioIdx();
    const adv = players[advIdx];
    if (adv) {
        const spriteEl = document.getElementById('bossCardSprite');
        const nameEl = document.getElementById('bossCardName');
        const hpEl = document.getElementById('bossCardHp');
        if (spriteEl && SPRITES[adv.class]) spriteEl.src = SPRITES[adv.class];
        if (nameEl) nameEl.textContent = adv.name || 'Adversário';
        if (hpEl) hpEl.innerHTML = `HP: <b>${adv.hp}</b> / ${adv.maxHp}`;
    }

    // Tokens mortos
    players.forEach((p, i) => {
        const tok = document.getElementById(`tokenP${i}`);
        if (tok) {
            if (p.dead) tok.classList.add('dead');
            else tok.classList.remove('dead');
        }
    });
}

function pvpAtualizarUI() {
    const banner = document.getElementById('pvpBanner');
    if (!banner) return;
    if (pvpReplayRodando) return;

    if (pvpAguardandoOponente) {
        banner.innerHTML = `
            <span class="coop-banner-icon">⏳</span>
            <span class="coop-banner-text">AGUARDANDO OPONENTE</span>
            <span class="coop-banner-hint">Você jogará quando alguém entrar</span>
        `;
        banner.classList.add('waiting');
        banner.classList.remove('active');
        return;
    }

    const meuIdx = pvpMeuIdx();
    const eu = players[meuIdx];

    if (eu?.dead) {
        banner.innerHTML = `
            <span class="coop-banner-icon">💀</span>
            <span class="coop-banner-text">VOCÊ PERDEU</span>
            <span class="coop-banner-hint">Aguardando fim da partida</span>
        `;
        banner.classList.add('waiting');
        banner.classList.remove('active');
        return;
    }

    if (!pvpEhMeuTurno()) {
        const advIdx = pvpAdversarioIdx();
        const adv = players[advIdx];
        const nomeAdv = adv?.name || 'adversário';
        banner.innerHTML = `
            <span class="coop-banner-icon">⏳</span>
            <span class="coop-banner-text">AGUARDANDO ${nomeAdv.toUpperCase()}</span>
            <span class="coop-banner-hint">Sua vez vem a seguir</span>
        `;
        banner.classList.add('waiting');
        banner.classList.remove('active');
    } else {
        banner.innerHTML = `
            <span class="coop-banner-icon">🎯</span>
            <span class="coop-banner-text">SEU TURNO</span>
            <span class="coop-banner-hint">Jogue e clique em "JOGAR TURNO"</span>
        `;
        banner.classList.add('active');
        banner.classList.remove('waiting');
    }
}

function pvpInjetarUI() {
    // Badge
    const header = document.querySelector('.game-title');
    if (header && !header.querySelector('#pvpBadge')) {
        const badge = document.createElement('span');
        badge.className = 'coop-badge';
        badge.id = 'pvpBadge';
        badge.textContent = pvpRole === 'criador' ? '⚔️ PVP · Criador' : '⚔️ PVP · Oponente';
        badge.style.marginLeft = '8px';
        header.appendChild(badge);
    }

    // Botão sair
    const acoes = document.querySelector('.game-header-actions');
    if (acoes && !acoes.querySelector('.pvp-sair-btn')) {
        const btn = document.createElement('button');
        btn.className = 'coop-sair-btn pvp-sair-btn';
        btn.innerHTML = '🚪 SAIR';
        btn.onclick = () => {
            if (confirm('Sair da partida?')) pvpSairParaAldeia();
        };
        acoes.insertBefore(btn, acoes.firstChild);
    }

    // Banner topo
    const main = document.querySelector('.game-main');
    if (main && !document.getElementById('pvpBanner')) {
        const banner = document.createElement('div');
        banner.id = 'pvpBanner';
        banner.className = 'coop-banner';
        main.parentNode.insertBefore(banner, main);
    }

    // Renomeia "Boss" no painel
    const bossTitle = document.querySelector('#bossSectionWrapper .status-section-title');
    if (bossTitle) bossTitle.textContent = 'Adversário';

    pvpAtualizarUI();
}

// =================================================================
// 11. CAPTURAR ESTADO
// =================================================================
function pvpCapturarEstado() {
    return {
        grid: [...grid],
        amulets: [...amulets],
        players: players.map(p => ({
            id: p.id, x: p.x, y: p.y, hp: p.hp, maxHp: p.maxHp,
            class: p.class, element: p.element, name: p.name,
            skillUsed: p.skillUsed, dead: p.dead, bonusAtk: p.bonusAtk || 0,
        })),
    };
}

// =================================================================
// 12. HANDLE SELECT
// =================================================================
function pvpHandleSelect(idx) {
    if (!window._pvpMode) return;
    if (pvpPartidaConcluida || pvpReplayRodando) return;
    if (pvpAguardandoOponente) return;
    if (!gameActive || arcadeBossTransition) return;

    const meuIdx = pvpMeuIdx();
    const p = players[meuIdx];
    if (!p || p.placeholder || p.dead) return;
    if (!pvpEhMeuTurno()) { pvpLog('Clique bloqueado: não é meu turno'); return; }

    // Solo Sagrado
    if (skillActive) {
        grid[idx] = p.element;
        const tile = document.querySelectorAll('#grid .tile')[idx];
        if (tile) tile.className = `tile bg-${p.element}`;
        p.skillUsed = true;
        skillActive = false;
        document.querySelectorAll('#grid .tile').forEach(t => t.classList.remove('skill-mode'));
        if (typeof addLog === 'function') addLog(`✨ ${p.name} usou SOLO SAGRADO!`);
        pvpRegistrarEvento({ tipo: 'skill', x: idx % 8, y: Math.floor(idx / 8), em: Date.now() });
        pvpAtualizarUI();
        return;
    }

    const x = idx % 8, y = Math.floor(idx / 8);
    if (typeof isOccupied === 'function' && isOccupied(x, y, p.id)) return;
    if (x === p.x && y === p.y) return;

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
    pvpHabilitarBotoes();
}

// =================================================================
// 13. EXECUTE ACTION
// =================================================================
async function pvpExecuteAction() {
    if (!window._pvpMode) return;
    if (pvpPartidaConcluida || pvpReplayRodando) return;
    if (pvpAguardandoOponente) return;

    const meuIdx = pvpMeuIdx();
    const active = players[meuIdx];
    if (!active || active.placeholder || active.dead) return;
    if (!pvpEhMeuTurno()) return;

    pvpLog('executeAction. active =', active.name, '| path =', path?.length);

    if (!path || path.length === 0) {
        pvpLog('Path vazio, passando turno');
        await pvpPublicarEstado();
        return;
    }

    pvpEventosTurno = [];

    try {
        await pvpExecutarAcaoManual(active);
    } catch (e) {
        console.error('[pvp] Erro na execução:', e);
    }
}

async function pvpExecutarAcaoManual(active) {
    // ⭐ O alvo é o adv
    const advIdx = pvpAdversarioIdx();
    const target = players[advIdx];

    if (!target) { pvpLog('Sem alvo.'); return; }

    const info = CLASS_DB[active.class] || { atk: 2, min: 0 };
    const heroData = STORY_HERO_CLASSES[active.class] || { role: 'Guerreiro' };
    const usedPath = [...path];
    const threshold = parseInt(document.getElementById('bravely_tiles')?.value) || 9;
    const isBravely = usedPath.length >= threshold;

    // Formas
    let skillAtkBonus = 0;
    const shape = (typeof detectShape === 'function') ? detectShape(usedPath) : null;
    if (shape && RANKING.shapes[shape] !== undefined) RANKING.shapes[shape]++;
    if (shape) {
        if (shape === "LINHA") { skillAtkBonus = 2; active.hp = Math.min(active.maxHp, active.hp + 1); if (typeof showHealEffect === 'function') showHealEffect(active.x, active.y, 1); }
        if (shape === "L") { active.hp = Math.min(active.maxHp, active.hp + 2); if (typeof showHealEffect === 'function') showHealEffect(active.x, active.y, 2); }
        if (shape === "ZIGZAG") skillAtkBonus = 3;
        if (shape === "QUADRADO") active.skillUsed = false;
    }

    // Bônus de nível + arma
    let levelBonus = { atk: 0 };
    if (typeof getHeroBonusFromLevel === 'function') {
        levelBonus = getHeroBonusFromLevel(active.class) || levelBonus;
    }

    let weaponElementBonus = 0;
    if (typeof getHeroEquipment === 'function' && typeof getWeaponById === 'function') {
        const eq = getHeroEquipment(active.class);
        if (eq?.arma && usedPath.length > 0) {
            const w = getWeaponById(eq.arma);
            if (w) {
                const tileEl = grid[usedPath[0]];
                if (w.elemento === 'ANY') {
                    if (tileEl === active.element) weaponElementBonus = w.elementoBonus || 0;
                } else if (tileEl === w.elemento) {
                    weaponElementBonus = w.elementoBonus || 0;
                }
            }
        }
    }

    const titleAtkBonus = active.titleBonus?.ATK || 0;
    const tileBonus = (usedPath.length > 0 && grid[usedPath[0]] === active.element) ? 1 : 0;
    const totalAtk = info.atk + (active.bonusAtk || 0) + (levelBonus.atk || 0) + tileBonus + skillAtkBonus + titleAtkBonus + weaponElementBonus;

    pvpLog('Ação:', active.name, '| totalAtk:', totalAtk, '| role:', heroData.role);

    pvpRegistrarEvento({ tipo: 'preparar', atk: totalAtk, em: Date.now() });

    if (heroData.role === 'Guerreiro') {
        // ⭐ Guerreiro: ataca só adjacente
        const dealDmg = () => {
            if (target.dead) return;
            if ((Math.abs(active.x - target.x) + Math.abs(active.y - target.y)) <= 1) {
                if (typeof playSfx === 'function') playSfx('atkg');
                pvpApplyDmg(target, totalAtk);
                if (typeof spawnSwordEffect === 'function') spawnSwordEffect(target.x, target.y);
                pvpRegistrarEvento({ tipo: 'attack', dmg: totalAtk, alvoX: target.x, alvoY: target.y, em: Date.now() });
            }
        };
        dealDmg();
        for (const idx of usedPath) {
            active.x = idx % 8;
            active.y = Math.floor(idx / 8);
            pvpRegistrarEvento({ tipo: 'move', x: active.x, y: active.y, em: Date.now() });
            if (typeof checkAmulet === 'function') checkAmulet(active, active.x, active.y);
            pvpRenderTudo();
            if (typeof isOccupied === 'function' && isOccupied(active.x, active.y, active.id)) break;
            dealDmg();
            await pvpSleep(120);
        }
    } else {
        // ⭐ Mago/Arqueiro: só ataca se usedPath >= info.min
        for (const idx of usedPath) {
            active.x = idx % 8;
            active.y = Math.floor(idx / 8);
            pvpRegistrarEvento({ tipo: 'move', x: active.x, y: active.y, em: Date.now() });
            if (typeof checkAmulet === 'function') checkAmulet(active, active.x, active.y);
            pvpRenderTudo();
            if (typeof isOccupied === 'function' && isOccupied(active.x, active.y, active.id)) break;
            await pvpSleep(100);
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
            pvpApplyDmg(target, totalAtk + extra);
            pvpRegistrarEvento({ tipo: 'attack', dmg: totalAtk + extra, alvoX: target.x, alvoY: target.y, em: Date.now() });
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
        pvpRegistrarEvento({ tipo: 'bravely', em: Date.now() });
    }

    path = [];
    if (typeof renderPath === 'function') renderPath();
    RANKING.turns++;
    pvpRegistrarEvento({ tipo: 'fim', em: Date.now() });

    await pvpPublicarEstado();
}

// =================================================================
// 14. APLICAR DANO
// =================================================================
function pvpApplyDmg(t, amt) {
    if (!t || t.dead) return;
    t.hp = Math.max(0, t.hp - amt);
    if (typeof showDmgEffect === 'function') showDmgEffect(t.x, t.y, amt);

    if (t.hp <= 0) {
        t.dead = true;
        const tok = document.getElementById(`tokenP${t.id}`);
        if (tok) tok.classList.add('dead');

        // ⭐ Se EU morri, publico minha morte (o outro venceu)
        const meuIdx = pvpMeuIdx();
        if (t.id === meuIdx) {
            pvpLog('EU morri. Publicando derrota...');
            pvpProcessarMinhaMorte();
        }
    }

    if (typeof updateVisuals === 'function') updateVisuals();
    if (typeof updateHeroCard === 'function') updateHeroCard();
    pvpRenderTudo();
}

// =================================================================
// 15. PROCESSAR MINHA MORTE
// =================================================================
async function pvpProcessarMinhaMorte() {
    if (pvpPartidaConcluida) return;
    pvpPartidaConcluida = true;
    pvpProcessandoMorte = true;

    const advIdx = pvpAdversarioIdx();
    const advUid = pvpRole === 'criador'
        ? pvpRoomData?.oponente?.uid
        : pvpRoomData?.criador?.uid;

    if (pvpRoomId) {
        try {
            await pvpFbDb.collection(PVP_ROOMS).doc(pvpRoomId).update({
                status: 'concluida',
                vencedor: advUid || 'unknown',
                vencedorRole: pvpRole === 'criador' ? 'oponente' : 'criador',
                'estadoJogo.players': players.map(p => ({
                    id: p.id, x: p.x, y: p.y, hp: p.hp, maxHp: p.maxHp,
                    class: p.class, element: p.element, name: p.name,
                    skillUsed: p.skillUsed, dead: p.dead, bonusAtk: p.bonusAtk || 0,
                })),
                atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
            });
            pvpLog('Minha morte publicada. Vencedor:', advUid);
        } catch (e) {
            console.error('[pvp] Erro ao publicar morte:', e);
        }
    }

    pvpProcessandoMorte = false;
}

// =================================================================
// 16. PUBLICAR ESTADO
// =================================================================
async function pvpPublicarEstado() {
    if (pvpPartidaConcluida) return;
    if (!window._pvpMode || !pvpRole) return;
    if (pvpPublishingLock) return;
    if (pvpAguardandoOponente) return;
    if (!pvpRoomId) return;

    pvpPublishingLock = true;

    try {
        const estado = pvpCapturarEstado();
        const eventos = [...pvpEventosTurno];
        const proximoTurno = pvpRole === 'criador' ? 'oponente' : 'criador';
        const proximoStatus = pvpRole === 'criador' ? 'turno_oponente' : 'turno_criador';

        await pvpFbDb.collection(PVP_ROOMS).doc(pvpRoomId).update({
            'estadoJogo.grid': estado.grid,
            'estadoJogo.amulets': estado.amulets,
            'estadoJogo.players': estado.players,
            'estadoJogo.turnoDe': proximoTurno,
            'estadoJogo.eventosTurno': eventos,
            'estadoJogo.ultimaAcao': {
                tipo: 'turno_' + pvpRole,
                resumo: `${players[pvpMeuIdx()]?.name} jogou`,
                em: Date.now(),
            },
            status: proximoStatus,
            atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
        });

        pvpLog('Estado publicado. Próximo turno:', proximoTurno, '| eventos:', eventos.length);
        pvpEventosTurno = [];
        pvpPausar();
    } catch (e) {
        console.error('[pvp] Erro ao publicar:', e);
    } finally {
        pvpPublishingLock = false;
    }
}

// =================================================================
// 17. LISTENER
// =================================================================
function pvpInstalarListener() {
    if (!pvpRoomId) return;
    if (pvpListenerUnsub) { pvpListenerUnsub(); pvpListenerUnsub = null; }

    pvpLog('Instalando listener:', pvpRoomId);

    let ultimoHash = '';

    pvpListenerUnsub = pvpFbDb.collection(PVP_ROOMS).doc(pvpRoomId)
        .onSnapshot(async doc => {
            if (!doc.exists) {
                if (window._pvpMode) { alert('Sala cancelada.'); pvpSairParaAldeia(); }
                return;
            }

            const data = doc.data();
            pvpRoomData = { id: doc.id, ...data };
            if (!window._pvpMode) return;

            if (data.status === 'cancelada') {
                alert('O criador cancelou.');
                pvpSairParaAldeia();
                return;
            }

            if (data.status === 'pausada') { pvpPausar(); return; }

            if (data.status === 'concluida') {
                if (!pvpFinalizando && !pvpReplayRodando) {
                    const euVenco = data.vencedor === pvpMeuUid();
                    setTimeout(() => pvpFinalizar(euVenco), 500);
                }
                return;
            }

            // ⭐ Oponente entrou (criador detecta)
            if (pvpRole === 'criador' && data.oponente?.heroiClass && pvpAguardandoOponente) {
                pvpAguardandoOponente = false;
                pvpLog('Oponente entrou! Rebuild.');

                // Atualiza players[1]
                players[1].class = data.oponente.heroiClass;
                players[1].name = data.oponente.nome;
                players[1].placeholder = false;
                players[1].maxHp = STORY_HERO_CLASSES[data.oponente.heroiClass]?.hp || 16;
                players[1].hp = players[1].maxHp;

                // Recria token
                const oldTok = document.getElementById('tokenP1');
                if (oldTok) oldTok.remove();
                const board = document.getElementById('board');
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

                if (typeof showToast === 'function') showToast('⚔️', `${data.oponente.nome} entrou!`, '⚔️');

                pvpRenderTudo();

                // Libera o turno do criador
                setTimeout(() => pvpDesbloquear(), 800);
            }

            // Replay
            const eventos = data.estadoJogo?.eventosTurno || [];
            const hash = JSON.stringify(eventos);
            if (eventos.length > 0 && hash !== ultimoHash && !pvpReplayRodando) {
                ultimoHash = hash;
                const meuUid = pvpMeuUid();
                const outros = eventos.filter(e => e.uid && e.uid !== meuUid);
                if (outros.length > 0) await pvpReproduzirEventos(eventos);
            }

            // Aplica estado
            pvpAplicarEstadoDoRoom(data);

            // É meu turno?
            const meuIdx = pvpMeuIdx();
            const euMorri = players[meuIdx]?.dead;

            if (euMorri) { pvpPausar(); return; }
            if (pvpAguardandoOponente) { pvpPausar(); return; }

            if (pvpEhMeuTurno()) {
                pvpLog('É meu turno');
                const ua = data.estadoJogo?.ultimaAcao;
                if (ua?.resumo) {
                    const outroNome = pvpRole === 'criador'
                        ? data.oponente?.nome : data.criador?.nome;
                    pvpMostrarResumoAcao(ua.resumo, outroNome);
                }
                setTimeout(() => pvpDesbloquear(), 500);
            } else {
                pvpPausar();
            }
        }, err => console.warn('[pvp] Listener err:', err));
}

function pvpAplicarEstadoDoRoom(room) {
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

    if (room.estadoJogo.players && players.length >= 2) {
        room.estadoJogo.players.forEach((pData, i) => {
            if (!players[i]) return;
            players[i].x = pData.x;
            players[i].y = pData.y;
            players[i].hp = pData.hp;
            players[i].maxHp = pData.maxHp;
            players[i].dead = pData.dead;
            players[i].bonusAtk = pData.bonusAtk || 0;

            const tok = document.getElementById(`tokenP${i}`);
            if (tok) {
                if (pData.dead) tok.classList.add('dead');
                else tok.classList.remove('dead');
            }
        });
    }

    pvpRenderTudo();
}

// =================================================================
// 18. REPLAY DE EVENTOS
// =================================================================
async function pvpReproduzirEventos(eventos) {
    if (!eventos || eventos.length === 0) return;
    if (pvpReplayRodando) return;

    const meuUid = pvpMeuUid();
    const outros = eventos.filter(e => e.uid && e.uid !== meuUid);
    if (outros.length === 0) return;

    pvpReplayRodando = true;
    pvpLog('Reproduzindo', outros.length, 'eventos');

    const gridEl = document.getElementById('grid');
    if (gridEl) gridEl.style.pointerEvents = 'none';

    const banner = document.getElementById('pvpBanner');
    if (banner) {
        banner.innerHTML = `
            <span class="coop-banner-icon">🎬</span>
            <span class="coop-banner-text">REPRODUZINDO ADVERSÁRIO</span>
            <span class="coop-banner-hint">Aguarde...</span>
        `;
        banner.classList.add('waiting');
        banner.classList.remove('active');
    }

    const tempCaptura = window._pvpCapturandoEventos;
    window._pvpCapturandoEventos = false;

    try {
        for (const ev of outros) {
            if (!window._pvpMode) break;
            try { await pvpReproduzirEvento(ev); } catch (e) { console.warn('[pvp] Erro replay:', e); }
        }
    } finally {
        window._pvpCapturandoEventos = tempCaptura;
        if (gridEl) gridEl.style.pointerEvents = '';
        pvpReplayRodando = false;
        pvpAtualizarUI();
    }
}

async function pvpReproduzirEvento(ev) {
    const s = (typeof getStep === 'function') ? getStep() : 59;
    const advIdx = pvpAdversarioIdx();
    const tok = document.getElementById(`tokenP${advIdx}`);

    switch (ev.tipo) {
        case 'move':
            if (tok) {
                tok.style.transition = 'left 0.15s, top 0.15s';
                tok.style.left = (ev.x * s + 8) + 'px';
                tok.style.top = (ev.y * s + 8) + 'px';
            }
            await pvpSleep(150);
            break;
        case 'attack':
            if (typeof showDmgEffect === 'function') showDmgEffect(ev.alvoX, ev.alvoY, ev.dmg);
            if (typeof spawnSwordEffect === 'function') spawnSwordEffect(ev.alvoX, ev.alvoY);
            await pvpSleep(300);
            break;
        case 'skill': {
            const tile = document.querySelectorAll('#grid .tile')[ev.y * 8 + ev.x];
            if (tile) {
                tile.classList.add('coop-skill-flash');
                setTimeout(() => tile.classList.remove('coop-skill-flash'), 500);
            }
            await pvpSleep(400);
            break;
        }
        case 'bravely':
            if (typeof showPoderAncestralEffect === 'function') showPoderAncestralEffect();
            await pvpSleep(1000);
            break;
        case 'fim':
            await pvpSleep(200);
            break;
    }
}

// =================================================================
// 19. HABILITAR / DESBLOQUEAR / PAUSAR
// =================================================================
function pvpHabilitarBotoes() {
    const btnPlay = document.getElementById('btnPlay');
    const btnSkill = document.getElementById('btnSkill');
    const meuIdx = pvpMeuIdx();
    const p = players[meuIdx];

    if (pvpAguardandoOponente || (p && p.dead) || !pvpEhMeuTurno()) {
        if (btnPlay) btnPlay.disabled = true;
        if (btnSkill) btnSkill.disabled = true;
        return;
    }

    if (btnPlay) btnPlay.disabled = false;
    if (btnSkill) {
        if (p && !p.skillUsed) btnSkill.disabled = false;
    }
}

function pvpDesbloquear() {
    if (pvpReplayRodando) return;
    if (pvpAguardandoOponente) return;

    const meuIdx = pvpMeuIdx();
    const p = players[meuIdx];
    if (p?.dead) { pvpAtualizarUI(); return; }

    window.currentPlayerIdx = meuIdx;
    window.editingIdx = meuIdx;

    const gridEl = document.getElementById('grid');
    if (gridEl) { gridEl.style.pointerEvents = ''; gridEl.style.opacity = ''; }

    pvpHabilitarBotoes();
    pvpAtualizarUI();
}

function pvpPausar() {
    if (pvpReplayRodando) return;
    const btnPlay = document.getElementById('btnPlay');
    const btnSkill = document.getElementById('btnSkill');
    if (btnPlay) btnPlay.disabled = true;
    if (btnSkill) btnSkill.disabled = true;
    const gridEl = document.getElementById('grid');
    if (gridEl) gridEl.style.pointerEvents = 'none';
    pvpAtualizarUI();
}

function pvpBloquearTurno() {
    const btnPlay = document.getElementById('btnPlay');
    const btnSkill = document.getElementById('btnSkill');
    if (btnPlay) btnPlay.disabled = true;
    if (btnSkill) btnSkill.disabled = true;
    const gridEl = document.getElementById('grid');
    if (gridEl) gridEl.style.pointerEvents = 'none';
    pvpAtualizarUI();
}

function pvpMostrarResumoAcao(resumo, quem) {
    if (!resumo) return;
    const old = document.getElementById('coopResumo');
    if (old) old.remove();
    const el = document.createElement('div');
    el.id = 'coopResumo';
    el.className = 'coop-resumo';
    el.innerHTML = `
        <span class="coop-resumo-icon">📢</span>
        <div>
            <div class="coop-resumo-quem">${quem || 'Adversário'} jogou</div>
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

// =================================================================
// 20. FINALIZAR
// =================================================================
async function pvpFinalizar(euVenco) {
    if (pvpFinalizando) return;
    pvpFinalizando = true;
    pvpPartidaConcluida = true;

    pvpLog('pvpFinalizar. euVenco =', euVenco);

    if (typeof stopAllAudio === 'function') { try { stopAllAudio(); } catch(e) {} }

    // Aposta
    const aposta = pvpRoomData?.aposta || pvpMinhaAposta || { xp: 0, gold: 0 };
    const apostaXP = aposta.xp || 0;
    const apostaGold = aposta.gold || 0;

    try {
        if (euVenco && (apostaXP > 0 || apostaGold > 0)) {
            pvpCreditar(apostaXP, apostaGold);
            pvpLog(`Prêmio: +${apostaXP} XP, +${apostaGold} gold`);
        } else if (!euVenco && (apostaXP > 0 || apostaGold > 0)) {
            pvpDebitar(apostaXP, apostaGold);
            pvpLog(`Aposta perdida: -${apostaXP} XP, -${apostaGold} gold`);
        }
    } catch(e) { console.error('[pvp] Erro aposta:', e); }

    if (pvpListenerUnsub) { pvpListenerUnsub(); pvpListenerUnsub = null; }

    // Espera replay
    let t = 0;
    while (pvpReplayRodando && t < 20) { await pvpSleep(200); t++; }
    await pvpSleep(1500);

    // Purificação + tela
    try {
        const advIdx = pvpAdversarioIdx();
        const adv = players[advIdx];
        const meuIdx = pvpMeuIdx();
        const eu = players[meuIdx];

        const board = document.getElementById('board');
        if (board) {
            const alvo = euVenco ? adv : eu;
            if (alvo) {
                const s = (typeof getStep === 'function') ? getStep() : 59;
                const ov = document.createElement('div');
                ov.className = 'purificacao-overlay active';
                ov.style.zIndex = '300';
                board.appendChild(ov);
                const cx = alvo.x * s + s / 2 + 8;
                ov.innerHTML = `
                    <div class="purificacao-darken"></div>
                    <div class="purificacao-feixe" style="left:${cx}px;width:${s*2}px;height:100%;"></div>
                    <div class="purificacao-halo" style="left:${cx}px;top:${alvo.y*s+s/2+8}px;animation-duration:2600ms;"></div>
                `;
                try { if (typeof playSfx === 'function') playSfx('skill1'); } catch(e) {}
                await pvpSleep(2800);
                if (ov.parentNode) ov.parentNode.removeChild(ov);
            }
        }

        if (euVenco && typeof showPoderAncestralEffect === 'function') {
            try { showPoderAncestralEffect(); } catch(e) {}
        }
        await pvpSleep(1000);

        try { if (typeof playSfx === 'function') playSfx(euVenco ? 'win' : 'gameover'); } catch(e) {}

        const overlay = document.getElementById('gameOverlay');
        if (!overlay) { alert(euVenco ? '🏆 VITÓRIA!' : '💀 DERROTA...'); pvpFinalizando = false; return; }

        const advNome = adv?.name || 'Adversário';
        const temAposta = apostaXP > 0 || apostaGold > 0;
        const xpFinal = euVenco ? apostaXP : -apostaXP;
        const goldFinal = euVenco ? apostaGold : -apostaGold;

        overlay.innerHTML = `
            <div class="victory-panel ${!euVenco ? 'defeat' : ''}">
                <div class="victory-scroll-top">
                    <h1 class="victory-title ${!euVenco ? 'defeat' : ''}">
                        ${euVenco ? '🏆' : '💀'} ${euVenco ? 'VITÓRIA PVP' : 'DERROTA PVP'}
                    </h1>
                </div>
                <div class="victory-body">
                    <div class="victory-boss-image-wrap">
                        <div class="victory-boss-halo"></div>
                        <img src="${SPRITES[euVenco ? eu.class : adv.class] || ''}" class="victory-boss-image" onerror="this.style.display='none'">
                    </div>
                    <div class="victory-boss-name">${euVenco ? `Você venceu ${advNome}!` : `${advNome} venceu!`}</div>
                    <div class="victory-boss-subtitle">${euVenco ? 'Sua estratégia foi superior.' : 'Melhor sorte na próxima.'}</div>
                    ${temAposta ? `
                        <div class="victory-lore" style="margin-top:16px;">
                            ${euVenco
                                ? `🔥 Você levou a aposta: <b>+${apostaXP} XP</b> e <b>+${apostaGold} ouro</b>`
                                : `💸 Você perdeu a aposta: <b>-${apostaXP} XP</b> e <b>-${apostaGold} ouro</b>`}
                        </div>
                    ` : ''}
                    <div class="victory-stats">
                        <div class="victory-stat">
                            <div class="victory-stat-value">${euVenco ? '🏆' : '💀'}</div>
                            <div class="victory-stat-label">${euVenco ? 'Vitória' : 'Derrota'}</div>
                        </div>
                        ${temAposta ? `
                            <div class="victory-stat">
                                <div class="victory-stat-value">${xpFinal > 0 ? '+' : ''}${xpFinal}</div>
                                <div class="victory-stat-label">XP</div>
                            </div>
                            <div class="victory-stat">
                                <div class="victory-stat-value">${goldFinal > 0 ? '+' : ''}${goldFinal}</div>
                                <div class="victory-stat-label">Ouro</div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="victory-actions">
                        <button class="victory-btn" onclick="pvpSairParaAldeia()">🏠 VOLTAR À ALDEIA</button>
                        <button class="victory-btn secondary" onclick="pvpAbrirPainel()">⚔️ NOVO DUELO</button>
                    </div>
                </div>
            </div>
        `;
        overlay.classList.add('active');
        overlay.style.display = 'flex';
        pvpLog('Tela final exibida.');
    } catch(e) {
        console.error('[pvp] Erro tela final:', e);
        alert(euVenco ? '🏆 VITÓRIA!' : '💀 DERROTA...');
    }

    pvpFinalizando = false;
}

// =================================================================
// 21. SAIR / CONTINUAR / CANCELAR
// =================================================================
async function pvpSairParaAldeia() {
    try { if (typeof stopAllAudio === 'function') stopAllAudio(); } catch(e) {}

    if (pvpRoomId && pvpRole === 'criador' && !pvpPartidaConcluida) {
        try {
            await pvpFbDb.collection(PVP_ROOMS).doc(pvpRoomId).update({
                status: 'pausada',
                atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
            });
        } catch(e) {}
    }

    window._pvpMode = false;
    pvpRole = null;
    pvpRoomId = null;
    pvpRoomData = null;
    pvpEventosTurno = [];
    pvpReplayRodando = false;
    pvpAguardandoOponente = false;
    pvpPartidaConcluida = false;
    pvpFinalizando = false;

    if (pvpListenerUnsub) { pvpListenerUnsub(); pvpListenerUnsub = null; }

    ['pvpBanner', 'coopResumo', 'pvpBadge'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });
    document.querySelectorAll('.coop-sair-btn, .pvp-sair-btn').forEach(el => el.remove());

    const bossTitle = document.querySelector('#bossSectionWrapper .status-section-title');
    if (bossTitle) bossTitle.textContent = 'Boss';

    const gridEl = document.getElementById('grid');
    if (gridEl) { gridEl.style.pointerEvents = ''; gridEl.style.opacity = ''; }

    if (typeof showStoryScreen === 'function') {
        showStoryScreen();
        setTimeout(() => {
            if (typeof renderAldeiaScreen === 'function') renderAldeiaScreen();
        }, 100);
    }
}

async function pvpContinuarSala(roomId) {
    try {
        if (!pvpUser) { const ok = await pvpInit(); if (!ok) return; }
        const doc = await pvpFbDb.collection(PVP_ROOMS).doc(roomId).get();
        if (!doc.exists) { alert('Sala não encontrada.'); return; }
        const room = { id: doc.id, ...doc.data() };

        const isC = room.criador?.uid === pvpUser.uid;
        const isO = room.oponente?.uid === pvpUser.uid;
        if (!isC && !isO) { alert('Você não participa.'); return; }

        if (room.status === 'pausada') {
            const turnoDe = room.estadoJogo?.turnoDe || 'criador';
            await pvpFbDb.collection(PVP_ROOMS).doc(roomId).update({
                status: turnoDe === 'criador' ? 'turno_criador' : 'turno_oponente',
                atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
            });
        }

        window._pvpMode = true;
        pvpRole = isC ? 'criador' : 'oponente';
        pvpRoomId = roomId;
        pvpRoomData = room;
        pvpMeuHeroClass = isC ? room.criador.heroiClass : room.oponente?.heroiClass;
        pvpMeuNome = isC ? room.criador.nome : room.oponente?.nome;
        pvpEventosTurno = [];
        pvpReplayRodando = false;
        pvpFinalizando = false;
        pvpPartidaConcluida = false;
        pvpAguardandoOponente = !room.oponente?.uid;

        try { mode = 'PVP'; } catch(e) {}
        window.mode = 'PVP';
        playerCount = 2;
        playerConfigs[0].active = true;
        playerConfigs[0].class = room.criador.heroiClass;
        playerConfigs[0].name = room.criador.nome;
        playerConfigs[1].active = true;
        playerConfigs[1].class = room.oponente?.heroiClass || room.criador.heroiClass;
        playerConfigs[1].name = room.oponente?.nome || 'aguardando...';

        pvpFecharPainel();
        pvpMostrarGameScreen();

        const _origInitGame = window.initGame;
        window.initGame = async function() {
            const prevStory = window._storyMode;
            window._storyMode = false;
            try {
                await _origInitGame.apply(this, arguments);
            } finally {
                window.initGame = _origInitGame;
                window._storyMode = prevStory;
            }
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            pvpRebuildPlayers();
            pvpInstalarListener();
            setTimeout(() => pvpInjetarUI(), 500);
        };

        if (typeof initGame === 'function') await initGame();
    } catch (e) {
        console.error('[pvp] Erro continuar:', e);
        alert('Erro: ' + e.message);
    }
}

async function pvpCancelarSala(roomId) {
    if (!confirm('Cancelar e deletar esta partida?')) return;
    try {
        await pvpFbDb.collection(PVP_ROOMS).doc(roomId).update({
            status: 'cancelada',
            atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
        });
        await pvpSleep(1000);
        await pvpFbDb.collection(PVP_ROOMS).doc(roomId).delete();
        pvpFecharPainel();
        setTimeout(() => pvpAbrirPainel(), 300);
    } catch(e) { alert('Erro: ' + e.message); }
}

// =================================================================
// 22. HOOKS
// =================================================================
(function instalarHooks() {
    const check = setInterval(() => {
        if (typeof window.handleSelect !== 'function') return;
        if (typeof window.executeAction !== 'function') return;
        clearInterval(check);
        if (window._pvpHooksV3) return;
        window._pvpHooksV3 = true;

        const _origHandle = window.handleSelect;
        const _origExec = window.executeAction;
        const _origManage = window.manageTurns;

        window.handleSelect = function(idx) {
            if (window._pvpMode) return pvpHandleSelect(idx);
            return _origHandle.apply(this, arguments);
        };

        window.executeAction = async function() {
            if (window._pvpMode) return pvpExecuteAction();
            return _origExec.apply(this, arguments);
        };

        window.manageTurns = function() {
            if (window._pvpMode) {
                pvpLog('manageTurns bloqueado');
                return;
            }
            return _origManage.apply(this, arguments);
        };

        pvpLog('Hooks V3 instalados.');
    }, 200);
})();

// =================================================================
// 23. BOTÃO NA ALDEIA
// =================================================================
(function botaoNaAldeia() {
    const check = setInterval(() => {
        if (typeof window.renderAldeiaScreen !== 'function') return;
        clearInterval(check);
        if (window._pvpAldeiaBtnV3) return;
        window._pvpAldeiaBtnV3 = true;

        const _orig = window.renderAldeiaScreen;
        window.renderAldeiaScreen = function() {
            _orig.apply(this, arguments);
            const gridEl = document.querySelector('.story-ald-grid');
            if (!gridEl || gridEl.querySelector('.pvp-aldeia-card')) return;

            const card = document.createElement('div');
            card.className = 'story-ald-location pvp-aldeia-card';
            card.onclick = () => pvpAbrirPainel();
            card.innerHTML = `
                <div class="story-ald-loc-icon">⚔️</div>
                <div class="story-ald-loc-info">
                    <div class="story-ald-loc-name">PVP ONLINE</div>
                    <div class="story-ald-loc-desc">Duelo 1v1 online</div>
                </div>
            `;
            gridEl.appendChild(card);
        };
    }, 300);
})();

// =================================================================
// 24. BOOT
// =================================================================
(async function boot() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => pvpInit());
    } else {
        pvpInit();
    }
    pvpLog('pvp.js V3.0 carregado.');
})();

// =================================================================
// EXPOR
// =================================================================
window.pvpAbrirPainel = pvpAbrirPainel;
window.pvpFecharPainel = pvpFecharPainel;
window.pvpCriarSala = pvpCriarSala;
window.pvpEntrarSala = pvpEntrarSala;
window.pvpContinuarSala = pvpContinuarSala;
window.pvpCancelarSala = pvpCancelarSala;
window.pvpSairParaAldeia = pvpSairParaAldeia;

console.log('✅ pvp.js V3.0 (baseado no coop) carregado.');
// =================================================================
// pvp.js — PATCH V3.1 (CORREÇÃO DO DESFECHO)
// -----------------------------------------------------------------
// Corrige:
//   • Ninguém publicava "concluida" quando o adv morria
//   • Monitor de segurança a cada 1s
//   • Fecha o listener assim que detecta fim
// =================================================================

(function patchPvpV31() {
    if (window._pvpV31) return;
    window._pvpV31 = true;

    // ================================================================
    // FIX 1: pvpApplyDmg — publicar quando o ADVERSÁRIO morre
    // ================================================================
    const _origApplyDmg = window.pvpApplyDmg;
    if (typeof _origApplyDmg === 'function') {
        window.pvpApplyDmg = function(t, amt) {
            if (!t || t.dead) return;

            t.hp = Math.max(0, t.hp - amt);
            if (typeof showDmgEffect === 'function') showDmgEffect(t.x, t.y, amt);

            if (t.hp <= 0) {
                t.dead = true;
                const tok = document.getElementById(`tokenP${t.id}`);
                if (tok) tok.classList.add('dead');

                const meuIdx = pvpMeuIdx();
                const advIdx = pvpAdversarioIdx();

                // ⭐ SE O ADVERSÁRIO MORREU → eu sou o vencedor
                if (t.id === advIdx) {
                    console.log('[V3.1] ADVERSÁRIO morreu. Eu venci. Publicando...');
                    pvpProcessarVitoria();
                }
                // Se EU morri → o adversário venceu (ele publica)
                else if (t.id === meuIdx) {
                    console.log('[V3.1] EU morri. Publicando derrota...');
                    pvpProcessarMinhaMorte();
                }
            }

            if (typeof updateVisuals === 'function') updateVisuals();
            if (typeof updateHeroCard === 'function') updateHeroCard();
            pvpRenderTudo();
        };
    }

    // ================================================================
    // FIX 2: pvpProcessarVitoria — público, publica "concluida"
    // ================================================================
    window.pvpProcessarVitoria = async function() {
        if (pvpPartidaConcluida) return;
        pvpPartidaConcluida = true;
        pvpProcessandoMorte = true;

        const advIdx = pvpAdversarioIdx();
        const advUid = pvpRole === 'criador'
            ? pvpRoomData?.oponente?.uid
            : pvpRoomData?.criador?.uid;

        // Salva o vencedor no save (só o vencedor recebe)
        const aposta = pvpRoomData?.aposta || pvpMinhaAposta || { xp: 0, gold: 0 };
        if (aposta.xp > 0 || aposta.gold > 0) {
            pvpCreditar(aposta.xp, aposta.gold);
            console.log(`[V3.1] Prêmio creditado: +${aposta.xp} XP, +${aposta.gold} gold`);
        }

        if (pvpRoomId) {
            try {
                await pvpFbDb.collection(PVP_ROOMS).doc(pvpRoomId).update({
                    status: 'concluida',
                    vencedor: pvpMeuUid(),
                    vencedorRole: pvpRole,
                    'estadoJogo.players': players.map(p => ({
                        id: p.id, x: p.x, y: p.y, hp: p.hp, maxHp: p.maxHp,
                        class: p.class, element: p.element, name: p.name,
                        skillUsed: p.skillUsed, dead: p.dead, bonusAtk: p.bonusAtk || 0,
                    })),
                    atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
                });
                console.log('[V3.1] Vitória publicada. Vencedor:', pvpMeuUid());
            } catch (e) {
                console.error('[V3.1] Erro ao publicar vitória:', e);
            }
        }

        pvpProcessandoMorte = false;
    };

    // ================================================================
    // FIX 3: pvpProcessarMinhaMorte — público
    // ================================================================
    window.pvpProcessarMinhaMorte = async function() {
        if (pvpPartidaConcluida) return;
        pvpPartidaConcluida = true;
        pvpProcessandoMorte = true;

        const advUid = pvpRole === 'criador'
            ? pvpRoomData?.oponente?.uid
            : pvpRoomData?.criador?.uid;

        // Salva a derrota no save (só o perdedor paga)
        const aposta = pvpRoomData?.aposta || pvpMinhaAposta || { xp: 0, gold: 0 };
        if (aposta.xp > 0 || aposta.gold > 0) {
            pvpDebitar(aposta.xp, aposta.gold);
            console.log(`[V3.1] Aposta debitada: -${aposta.xp} XP, -${aposta.gold} gold`);
        }

        if (pvpRoomId) {
            try {
                await pvpFbDb.collection(PVP_ROOMS).doc(pvpRoomId).update({
                    status: 'concluida',
                    vencedor: advUid || 'unknown',
                    vencedorRole: pvpRole === 'criador' ? 'oponente' : 'criador',
                    'estadoJogo.players': players.map(p => ({
                        id: p.id, x: p.x, y: p.y, hp: p.hp, maxHp: p.maxHp,
                        class: p.class, element: p.element, name: p.name,
                        skillUsed: p.skillUsed, dead: p.dead, bonusAtk: p.bonusAtk || 0,
                    })),
                    atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
                });
                console.log('[V3.1] Derrota publicada. Vencedor:', advUid);
            } catch (e) {
                console.error('[V3.1] Erro ao publicar derrota:', e);
            }
        }

        pvpProcessandoMorte = false;
    };

    // ================================================================
    // FIX 4: Monitor de segurança — verifica a cada 1s
    // ================================================================
    setInterval(() => {
        if (!window._pvpMode) return;
        if (pvpPartidaConcluida || pvpFinalizando) return;
        if (pvpAguardandoOponente) return;
        if (!players || players.length < 2) return;

        const meuIdx = pvpMeuIdx();
        const advIdx = pvpAdversarioIdx();
        const eu = players[meuIdx];
        const adv = players[advIdx];

        if (!eu || !adv) return;

        // Se o adv morreu e eu estou vivo → eu venço
        if (adv.dead && !eu.dead && !pvpProcessandoMorte) {
            console.log('[V3.1] Monitor: adv morto. Publicando vitória.');
            pvpProcessarVitoria();
            return;
        }

        // Se eu morri → publico derrota
        if (eu.dead && !pvpProcessandoMorte) {
            console.log('[V3.1] Monitor: eu morri. Publicando derrota.');
            pvpProcessarMinhaMorte();
            return;
        }
    }, 1000);

    // ================================================================
    // FIX 5: listener — fecha imediatamente ao detectar 'concluida'
    // ================================================================
    const _origInstalar = window.pvpInstalarListener;
    // (não precisa mexer — o listener já trata 'concluida')

    // ================================================================
    // FIX 6: Força a aposta ser aplicada só UMA vez
    // ================================================================
    window._pvpApostaAplicada = false;

    const _origFinalizar = window.pvpFinalizar;
    if (typeof _origFinalizar === 'function') {
        window.pvpFinalizar = async function(euVenco) {
            if (window._pvpApostaAplicada) {
                console.log('[V3.1] Finalizar já rodou, ignorando.');
                return;
            }
            window._pvpApostaAplicada = true;

            // A aposta já foi aplicada em pvpProcessarVitoria/Morte
            // Aqui só mostramos a tela

            if (pvpFinalizando) return;
            pvpFinalizando = true;
            pvpPartidaConcluida = true;

            console.log('[V3.1] pvpFinalizar. euVenco =', euVenco);

            if (typeof stopAllAudio === 'function') { try { stopAllAudio(); } catch(e) {} }

            if (pvpListenerUnsub) { pvpListenerUnsub(); pvpListenerUnsub = null; }

            let t = 0;
            while (pvpReplayRodando && t < 20) { await pvpSleep(200); t++; }
            await pvpSleep(1500);

            try {
                const advIdx = pvpAdversarioIdx();
                const adv = players[advIdx];
                const meuIdx = pvpMeuIdx();
                const eu = players[meuIdx];

                const board = document.getElementById('board');
                if (board) {
                    const alvo = euVenco ? adv : eu;
                    if (alvo) {
                        const s = (typeof getStep === 'function') ? getStep() : 59;
                        const ov = document.createElement('div');
                        ov.className = 'purificacao-overlay active';
                        ov.style.zIndex = '300';
                        board.appendChild(ov);
                        const cx = alvo.x * s + s / 2 + 8;
                        ov.innerHTML = `
                            <div class="purificacao-darken"></div>
                            <div class="purificacao-feixe" style="left:${cx}px;width:${s*2}px;height:100%;"></div>
                            <div class="purificacao-halo" style="left:${cx}px;top:${alvo.y*s+s/2+8}px;animation-duration:2600ms;"></div>
                        `;
                        try { if (typeof playSfx === 'function') playSfx('skill1'); } catch(e) {}
                        await pvpSleep(2800);
                        if (ov.parentNode) ov.parentNode.removeChild(ov);
                    }
                }

                if (euVenco && typeof showPoderAncestralEffect === 'function') {
                    try { showPoderAncestralEffect(); } catch(e) {}
                }
                await pvpSleep(1000);

                try { if (typeof playSfx === 'function') playSfx(euVenco ? 'win' : 'gameover'); } catch(e) {}

                const overlay = document.getElementById('gameOverlay');
                if (!overlay) { alert(euVenco ? '🏆 VITÓRIA!' : '💀 DERROTA...'); pvpFinalizando = false; return; }

                const advNome = adv?.name || 'Adversário';
                const aposta = pvpRoomData?.aposta || pvpMinhaAposta || { xp: 0, gold: 0 };
                const apostaXP = aposta.xp || 0;
                const apostaGold = aposta.gold || 0;
                const temAposta = apostaXP > 0 || apostaGold > 0;
                const xpFinal = euVenco ? apostaXP : -apostaXP;
                const goldFinal = euVenco ? apostaGold : -apostaGold;

                overlay.innerHTML = `
                    <div class="victory-panel ${!euVenco ? 'defeat' : ''}">
                        <div class="victory-scroll-top">
                            <h1 class="victory-title ${!euVenco ? 'defeat' : ''}">
                                ${euVenco ? '🏆' : '💀'} ${euVenco ? 'VITÓRIA PVP' : 'DERROTA PVP'}
                            </h1>
                        </div>
                        <div class="victory-body">
                            <div class="victory-boss-image-wrap">
                                <div class="victory-boss-halo"></div>
                                <img src="${SPRITES[euVenco ? eu.class : adv.class] || ''}" class="victory-boss-image" onerror="this.style.display='none'">
                            </div>
                            <div class="victory-boss-name">${euVenco ? `Você venceu ${advNome}!` : `${advNome} venceu!`}</div>
                            <div class="victory-boss-subtitle">${euVenco ? 'Sua estratégia foi superior.' : 'Melhor sorte na próxima.'}</div>
                            ${temAposta ? `
                                <div class="victory-lore" style="margin-top:16px;">
                                    ${euVenco
                                        ? `🔥 Você levou a aposta: <b>+${apostaXP} XP</b> e <b>+${apostaGold} ouro</b>`
                                        : `💸 Você perdeu a aposta: <b>-${apostaXP} XP</b> e <b>-${apostaGold} ouro</b>`}
                                </div>
                            ` : ''}
                            <div class="victory-stats">
                                <div class="victory-stat">
                                    <div class="victory-stat-value">${euVenco ? '🏆' : '💀'}</div>
                                    <div class="victory-stat-label">${euVenco ? 'Vitória' : 'Derrota'}</div>
                                </div>
                                ${temAposta ? `
                                    <div class="victory-stat">
                                        <div class="victory-stat-value">${xpFinal > 0 ? '+' : ''}${xpFinal}</div>
                                        <div class="victory-stat-label">XP</div>
                                    </div>
                                    <div class="victory-stat">
                                        <div class="victory-stat-value">${goldFinal > 0 ? '+' : ''}${goldFinal}</div>
                                        <div class="victory-stat-label">Ouro</div>
                                    </div>
                                ` : ''}
                            </div>
                            <div class="victory-actions">
                                <button class="victory-btn" onclick="pvpSairParaAldeia()">🏠 VOLTAR À ALDEIA</button>
                                <button class="victory-btn secondary" onclick="pvpAbrirPainel()">⚔️ NOVO DUELO</button>
                            </div>
                        </div>
                    </div>
                `;
                overlay.classList.add('active');
                overlay.style.display = 'flex';
                console.log('[V3.1] Tela final exibida.');
            } catch(e) {
                console.error('[V3.1] Erro tela final:', e);
                alert(euVenco ? '🏆 VITÓRIA!' : '💀 DERROTA...');
            }

            pvpFinalizando = false;
        };
    }

    console.log('✅ [pvp] Patch V3.1 (desfecho forçado) instalado.');
    console.log('   • pvpApplyDmg publica quando o ADV morre');
    console.log('   • Monitor a cada 1s força publicação');
    console.log('   • Aposta aplicada só uma vez');
})();
// =================================================================
// pvp.js — PATCH V3.2 (reset de flags entre partidas)
// -----------------------------------------------------------------
// Corrige:
//   • _pvpApostaAplicada não era resetada entre partidas
//     → 2ª partida na mesma aba nunca mostrava a tela final
// =================================================================

(function patchPvpV32() {
    if (window._pvpV32) return;
    window._pvpV32 = true;

    // Função para resetar TODAS as flags entre partidas
    function pvpResetEstadoPartida() {
        window._pvpApostaAplicada = false;
        pvpFinalizando = false;
        pvpPartidaConcluida = false;
        pvpProcessandoMorte = false;
        pvpReplayRodando = false;
        pvpPublishingLock = false;
        pvpAguardandoOponente = false;

        // Fecha o overlay de fim de jogo, se estiver aberto
        const overlay = document.getElementById('gameOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.display = 'none';
            overlay.innerHTML = '';
        }

        // Reseta o winner global
        window._endGameShowing = false;

        console.log('[V3.2] Flags resetadas para nova partida.');
    }

    // ================================================================
    // FIX 1: resetar no criar sala
    // ================================================================
    const _origCriar = window.pvpCriarSala;
    if (typeof _origCriar === 'function') {
        window.pvpCriarSala = async function() {
            pvpResetEstadoPartida();
            return _origCriar.apply(this, arguments);
        };
    }

    // ================================================================
    // FIX 2: resetar no entrar sala
    // ================================================================
    const _origEntrar = window.pvpEntrarSala;
    if (typeof _origEntrar === 'function') {
        window.pvpEntrarSala = async function() {
            pvpResetEstadoPartida();
            return _origEntrar.apply(this, arguments);
        };
    }

    // ================================================================
    // FIX 3: resetar no continuar sala
    // ================================================================
    const _origContinuar = window.pvpContinuarSala;
    if (typeof _origContinuar === 'function') {
        window.pvpContinuarSala = async function() {
            pvpResetEstadoPartida();
            return _origContinuar.apply(this, arguments);
        };
    }

    // ================================================================
    // FIX 4: resetar também no pvpSairParaAldeia
    // ================================================================
    const _origSair = window.pvpSairParaAldeia;
    if (typeof _origSair === 'function') {
        window.pvpSairParaAldeia = async function() {
            const r = await _origSair.apply(this, arguments);
            pvpResetEstadoPartida();
            return r;
        };
    }

    // ================================================================
    // FIX 5: monitor de segurança (se travar por algum motivo)
    // ================================================================
    setInterval(() => {
        if (!window._pvpMode) return;
        if (pvpPartidaConcluida || pvpFinalizando) return;
        if (pvpAguardandoOponente) return;
        if (!players || players.length < 2) return;

        const meuIdx = pvpMeuIdx();
        const advIdx = pvpAdversarioIdx();
        const eu = players[meuIdx];
        const adv = players[advIdx];
        if (!eu || !adv) return;

        // Se o adv morreu e eu estou vivo → publico vitória (se ainda não publiquei)
        if (adv.dead && !eu.dead && !pvpProcessandoMorte) {
            console.log('[V3.2] Monitor: adv morto sem publicação. Forçando.');
            if (typeof window.pvpProcessarVitoria === 'function') {
                window.pvpProcessarVitoria();
            }
        }

        // Se eu morri → publico derrota
        if (eu.dead && !pvpProcessandoMorte) {
            console.log('[V3.2] Monitor: eu morri. Publicando derrota.');
            if (typeof window.pvpProcessarMinhaMorte === 'function') {
                window.pvpProcessarMinhaMorte();
            }
        }
    }, 1000);

    console.log('✅ [pvp] Patch V3.2 (reset entre partidas) instalado.');
})();
// =================================================================
// pvp.js — PATCH ÚNICO V5.0 (herois novos + estética)
// -----------------------------------------------------------------
// Base: pvp.js V3.0 + patches V3.1 + V3.2
//
// Este patch ÚNICO resolve:
//   ✅ Heróis novos funcionam (CLASS_DB completo)
//   ✅ Sprites dos heróis novos aparecem
//   ✅ Nome do save como identidade
//   ✅ Poder Ancestral NÃO aparece no fim
//   ✅ Hue-rotate só se heróis iguais
//
// NÃO TOCA EM:
//   ❌ pvpPublicarEstado (mantém V3.1/V3.2)
//   ❌ pvpAplicarEstadoDoRoom (mantém V3.1/V3.2)
//   ❌ pvpExecutarAcaoManual (mantém V3.1/V3.2)
//   ❌ pvpProcessarVitoria/Morte (mantém V3.1/V3.2)
//   ❌ pvpFinalizar (mantém V3.1/V3.2)
// =================================================================

(function patchPvpV50() {
    if (window._pvpV50) return;
    window._pvpV50 = true;

    // ================================================================
    // FIX A: Garantir CLASS_DB completo (heróis novos)
    // ================================================================
    function pvpGarantirClassDBCompleto() {
        if (typeof CLASS_DB === 'undefined' || typeof STORY_HERO_CLASSES === 'undefined') {
            return false;
        }

        let adicionados = 0;
        Object.values(STORY_HERO_CLASSES).forEach(hero => {
            if (!hero?.className) return;
            if (CLASS_DB[hero.className]) return;

            CLASS_DB[hero.className] = {
                hp: hero.hp,
                atk: hero.atk,
                min: hero.range || 0,
                role: hero.role,
                element: hero.element,
                spriteKey: hero.spriteKey,
                paKey: hero.paKey,
            };
            adicionados++;
        });

        if (adicionados > 0) {
            console.log(`[V5.0] CLASS_DB: ${adicionados} heróis adicionados. Total: ${Object.keys(CLASS_DB).length}`);
        }
        return true;
    }

    // ================================================================
    // FIX B: Importar sprites dos heróis novos
    // ================================================================
    function pvpImportarSpritesNovos() {
        if (typeof SPRITES === 'undefined' || typeof SPRITES_STORY === 'undefined') return 0;
        if (typeof STORY_HERO_CLASSES === 'undefined') return 0;

        let importados = 0;
        Object.values(STORY_HERO_CLASSES).forEach(hero => {
            if (!hero?.className) return;
            if (SPRITES[hero.className]) return;  // já tem

            let url = null;
            if (hero.spriteKey && SPRITES_STORY[hero.spriteKey]) {
                url = SPRITES_STORY[hero.spriteKey];
            }
            if (!url) {
                const key = 'heroi_' + hero.className;
                if (SPRITES_STORY[key]) url = SPRITES_STORY[key];
            }
            if (url) {
                SPRITES[hero.className] = url;
                importados++;
            }
        });

        if (importados > 0) {
            console.log(`[V5.0] Sprites importados: ${importados}`);
        }
        return importados;
    }

    // ================================================================
    // FIX C: Sincronizar nome do save no localStorage (uma vez)
    // ================================================================
    function pvpSincronizarNomeSave() {
        let nome = null;
        if (typeof STORY_CURRENT_SAVE_NAME !== 'undefined' && STORY_CURRENT_SAVE_NAME) {
            nome = String(STORY_CURRENT_SAVE_NAME).trim();
        } else if (typeof STORY_PROGRESS !== 'undefined' && STORY_PROGRESS.saveName) {
            nome = String(STORY_PROGRESS.saveName).trim();
        }

        if (nome) {
            const atual = localStorage.getItem('coop_player_name');
            if (atual !== nome) {
                localStorage.setItem('coop_player_name', nome);
                console.log(`[V5.0] Nome do save: "${atual}" → "${nome}"`);
            }
        }
    }

    // ================================================================
    // FIX D: Suprimir Poder Ancestral no fim (flag global)
    // ================================================================
    window._pvpMostrandoFimDeJogo = false;

    const _origShowPA = window.showPoderAncestralEffect;
    if (typeof _origShowPA === 'function' && !window._pvpPAWrappedV50) {
        window._pvpPAWrappedV50 = true;
        window.showPoderAncestralEffect = function() {
            if (window._pvpMostrandoFimDeJogo) {
                return;
            }
            return _origShowPA.apply(this, arguments);
        };
    }

    // Ativa quando fim de jogo começa — intercepta os 2 gatilhos
    const _origProcVit = window.pvpProcessarVitoria;
    if (typeof _origProcVit === 'function' && !window._pvpProcVitV50) {
        window._pvpProcVitV50 = true;
        window.pvpProcessarVitoria = async function() {
            window._pvpMostrandoFimDeJogo = true;
            return _origProcVit.apply(this, arguments);
        };
    }

    const _origProcMorte = window.pvpProcessarMinhaMorte;
    if (typeof _origProcMorte === 'function' && !window._pvpProcMorteV50) {
        window._pvpProcMorteV50 = true;
        window.pvpProcessarMinhaMorte = async function() {
            window._pvpMostrandoFimDeJogo = true;
            return _origProcMorte.apply(this, arguments);
        };
    }

    // Desativa quando nova partida começa
    const _origRebuild = window.pvpRebuildPlayers;
    if (typeof _origRebuild === 'function' && !window._pvpRebuildV50) {
        window._pvpRebuildV50 = true;
        window.pvpRebuildPlayers = function() {
            if (!pvpPartidaConcluida && !pvpFinalizando) {
                window._pvpMostrandoFimDeJogo = false;
            }
            // Garante CLASS_DB completo ANTES de reconstruir players
            pvpGarantirClassDBCompleto();
            pvpImportarSpritesNovos();

            const r = _origRebuild.apply(this, arguments);

            // Ajusta hue-rotate dos tokens (só se heróis iguais)
            setTimeout(() => {
                if (!players || players.length < 2) return;
                const mesmoHeroi = players[0].class === players[1].class;

                players.forEach((p, i) => {
                    const tok = document.getElementById(`tokenP${i}`);
                    if (!tok) return;
                    tok.classList.remove('p-hue-0', 'p-hue-1', 'p-hue-2', 'p-hue-3');
                    if (mesmoHeroi) tok.classList.add(`p-hue-${i}`);

                    // Garante sprite correto
                    const img = tok.querySelector('img');
                    if (img && SPRITES[p.class] && img.src !== SPRITES[p.class]) {
                        img.src = SPRITES[p.class];
                    }
                });
            }, 80);

            return r;
        };
    }

    // ================================================================
    // FIX E: Forçar nome do save nos players (durante rebuild)
    // ================================================================
    function pvpForcarNomeSaveNoPlayerLocal() {
        if (!window._pvpMode) return;
        const nome = localStorage.getItem('coop_player_name');
        if (!nome) return;

        const meuIdx = pvpMeuIdx();
        if (players[meuIdx]) players[meuIdx].name = nome;
        if (playerConfigs[meuIdx]) playerConfigs[meuIdx].name = nome;

        // Só re-renderiza se o nome estiver errado
        const nameEl = document.getElementById('turnDisplayName');
        if (nameEl && !nameEl.textContent.includes(nome)) {
            if (typeof updateHeroCard === 'function') updateHeroCard();
        }
    }

    // Aplica depois do rebuild (com delay pra não interferir no turno)
    const _origRebuild2 = window.pvpRebuildPlayers;
    if (typeof _origRebuild2 === 'function' && !window._pvpRebuild2V50) {
        window._pvpRebuild2V50 = true;
        window.pvpRebuildPlayers = function() {
            const r = _origRebuild2.apply(this, arguments);
            setTimeout(() => pvpForcarNomeSaveNoPlayerLocal(), 200);
            return r;
        };
    }

    // Reforço leve — só quando NÃO está em turno ativo
    setInterval(() => {
        if (!window._pvpMode) return;
        if (pvpPartidaConcluida || pvpFinalizando) return;
        if (typeof path !== 'undefined' && path.length > 0) return;  // não mexer durante movimento

        const gridEl = document.getElementById('grid');
        if (gridEl && gridEl.style.pointerEvents === 'none') return; // replay rolando

        pvpForcarNomeSaveNoPlayerLocal();
    }, 3000);

    // ================================================================
    // FIX F: Blindar pvpCriarSala e pvpEntrarSala contra herói inválido
    // ================================================================
    function pvpSanitizarHeroClass() {
        let cls = pvpMeuHeroClass;
        if (!cls || !CLASS_DB[cls]) {
            cls = (STORY_PROGRESS?.selectedHeroes?.[0]) || 'Tupa';
            if (!CLASS_DB[cls]) cls = 'Tupa';
        }
        pvpMeuHeroClass = cls;
        return cls;
    }

    const _origCriar = window.pvpCriarSala;
    if (typeof _origCriar === 'function' && !window._pvpCriarV50) {
        window._pvpCriarV50 = true;
        window.pvpCriarSala = async function() {
            pvpGarantirClassDBCompleto();
            pvpImportarSpritesNovos();
            pvpSincronizarNomeSave();
            pvpSanitizarHeroClass();
            try {
                return await _origCriar.apply(this, arguments);
            } catch (e) {
                console.error('[V5.0] Erro ao criar:', e);
                alert('Erro: ' + e.message);
            }
        };
    }

    const _origEntrar = window.pvpEntrarSala;
    if (typeof _origEntrar === 'function' && !window._pvpEntrarV50) {
        window._pvpEntrarV50 = true;
        window.pvpEntrarSala = async function(roomId) {
            pvpGarantirClassDBCompleto();
            pvpImportarSpritesNovos();
            pvpSincronizarNomeSave();
            pvpSanitizarHeroClass();
            try {
                return await _origEntrar.apply(this, arguments);
            } catch (e) {
                console.error('[V5.0] Erro ao entrar:', e);
                alert('Erro: ' + e.message);
            }
        };
    }

    // ================================================================
    // Diagnóstico
    // ================================================================
    pvpGarantirClassDBCompleto();
    pvpImportarSpritesNovos();
    pvpSincronizarNomeSave();

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [pvp] Patch ÚNICO V5.0 instalado');
    console.log('═══════════════════════════════════════════════════');
    console.log('📊 CLASS_DB: ' + Object.keys(CLASS_DB).length + ' heróis');
    console.log('📊 Nome do jogador: ' + (localStorage.getItem('coop_player_name') || 'Jogador'));
    console.log('📊 Herói selecionado: ' + (pvpMeuHeroClass || '(não definido)'));
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// pvp.js — PATCH V36.3 (Compatibilidade com Stats Nível 11)
// =================================================================
(function compatStat11Pvp() {
    if (window._compatStat11Pvp) return;
    window._compatStat11Pvp = true;

    const _origPvpExec = window.pvpExecutarAcaoManual;
    if (typeof _origPvpExec === 'function') {
        window.pvpExecutarAcaoManual = async function(active) {
            if (!active) return _origPvpExec.apply(this, arguments);

            const bonus = (typeof getHeroBonusFromLevel === 'function')
                ? getHeroBonusFromLevel(active.class) : null;
            
            if (!bonus || (!bonus.range && !bonus.paThreshold && !bonus.formAtk && !bonus.bonusElemento)) {
                return _origPvpExec.apply(this, arguments);
            }

            const info = CLASS_DB[active.class];
            const bravelyEl = document.getElementById('bravely_tiles');
            const origMin = info?.min;
            const origThreshold = bravelyEl?.value;
            const origBonusAtk = active.bonusAtk || 0;
            let modificouBonus = false;

            try {
                if (info && bonus.range) info.min = Math.max(0, (info.min || 0) + bonus.range);
                if (bravelyEl && bonus.paThreshold) bravelyEl.value = Math.max(3, parseInt(bravelyEl.value) + bonus.paThreshold);

                let bonusTemp = 0;
                if (bonus.formAtk > 0 && path.length > 0 && typeof detectShape === 'function') {
                    if (detectShape([...path])) bonusTemp += bonus.formAtk;
                }
                if (bonus.bonusElemento > 0 && path.length > 0 && grid[path[0]] === active.element) {
                    bonusTemp += bonus.bonusElemento;
                }

                if (bonusTemp > 0) {
                    active.bonusAtk = origBonusAtk + bonusTemp;
                    modificouBonus = true;
                }

                return await _origPvpExec.apply(this, arguments);
            } finally {
                if (info && origMin !== undefined) info.min = origMin;
                if (bravelyEl && origThreshold !== undefined) bravelyEl.value = origThreshold;
                if (modificouBonus) active.bonusAtk = origBonusAtk;
            }
        };
        console.log('✅ [V36.3] Stats Nível 11 aplicados no PVP.');
    }
})();
// =================================================================
// ⚔️ PVP V10.34 — CORREÇÃO EXCLUSIVA DO HP NO PVP (Anti-Herança)
// -----------------------------------------------------------------
// 1. Quando o P2 entra, ele ignora o HP do Firestore (do P1) e 
//    calcula o próprio HP real baseado no Nível/Equipamento.
// 2. Protege o P2 de ter a vida sobrescrita pelo listener.
// =================================================================

(function fixPvpHpV1034() {
    if (window._fixPvpHpV1034) return;
    window._fixPvpHpV1034 = true;

    console.log('✅ [V10.34] Aplicando blindagem de HP exclusiva no PVP...');

    // 1. Força o HP correto ANTES do jogo montar o tabuleiro do P2
    const _origPvpRebuild = window.pvpRebuildPlayers;
    if (typeof _origPvpRebuild === 'function') {
        window.pvpRebuildPlayers = function() {
            // Se eu sou o P2 e a sala já tem os dados de ambos
            if (pvpRole === 'oponente' && pvpRoomData?.estadoJogo?.players) {
                const p2Data = pvpRoomData.estadoJogo.players[1];
                const meuHeroi = pvpRoomData.oponente?.heroiClass || 'Tupa';
                
                if (p2Data) {
                    // Calcula o HP real do P2
                    let baseHp = (STORY_HERO_CLASSES[meuHeroi]?.hp) || 8;
                    if (typeof getHeroBonusFromLevel === 'function') {
                        baseHp += getHeroBonusFromLevel(meuHeroi).hp || 0;
                    }
                    
                    // Sobrescreve o HP do P1 que veio no Firestore com o HP real do P2
                    p2Data.class = meuHeroi;
                    p2Data.hp = baseHp;
                    p2Data.maxHp = baseHp;
                    console.log(`[V10.34] P2 ignorou HP do P1 e calculou o próprio: ${baseHp}`);
                }
            }
            return _origPvpRebuild.apply(this, arguments);
        };
    }

    // 2. Protege o P2 de ter a vida sobrescrita pela nuvem durante o jogo
    const _origAplicar = window.pvpAplicarEstadoDoRoom;
    if (typeof _origAplicar === 'function') {
        window.pvpAplicarEstadoDoRoom = function(room) {
            if (pvpRole === 'oponente' && room?.estadoJogo?.players && players.length >= 2) {
                const p2Data = room.estadoJogo.players[1];
                const meuHeroi = pvpRoomData?.oponente?.heroiClass || 'Tupa';
                
                // Se o Firestore mandar um HP diferente do meu (ex: 15 do P1)
                if (p2Data && p2Data.hp !== players[1].hp) {
                    let baseHp = (STORY_HERO_CLASSES[meuHeroi]?.hp) || 8;
                    if (typeof getHeroBonusFromLevel === 'function') {
                        baseHp += getHeroBonusFromLevel(meuHeroi).hp || 0;
                    }
                    
                    // Restaura a vida local do P2 e ignora a do Firestore
                    players[1].hp = baseHp;
                    players[1].maxHp = baseHp;
                    p2Data.hp = baseHp;
                    p2Data.maxHp = baseHp;
                }
            }
            return _origAplicar.apply(this, arguments);
        };
    }

    console.log('✅ [V10.34] Blindagem aplicada. O P2 não herda mais a vida do P1.');
})();

