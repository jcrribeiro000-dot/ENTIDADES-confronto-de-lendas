/* =================================================================
 * calendario-tematico.js — V203 + V204 (Calendário de Anhangá)
 * -----------------------------------------------------------------
 * • 1 missão por dia, igual para todos os jogadores (seed da data)
 * • recompensa diária sorteada pela data (nunca fixa)
 * • 30 missões concluídas → baú com roleta + resgate manual
 * • progresso SEMANAL (7 dias corridos) para a aura temática
 * • versão visível no perfil do jogador
 *
 * Carregado por último em index.html. Não edita aldeia.js, historia.js
 * nem os arquivos de combate: apenas embrulha saveStoryProgress().
 * ================================================================= */
(function () {
    'use strict';
    if (window._calendarioTematicoV203) return;
    window._calendarioTematicoV203 = true;

    const VERSAO = (typeof window.VERSAO_JOGO === 'string') ? window.VERSAO_JOGO : 'v206';
    const DIAS_PARA_BAU = 30;
    const DIAS_PARA_AURA = 7;

    // ─────────────────────────────────────────────────────────────
    // MISSÕES — todas sempre atingíveis, nada de "subir nível" ou
    // "resgatar conquista" (podem esgotar) e nada de boss fixo.
    // ─────────────────────────────────────────────────────────────
    const MISSOES = [
        { id: 'atos3',   tipo: 'inimigos', meta: 3, texto: 'Derrote 3 inimigos nos atos',              icone: '⚔️' },
        { id: 'boss1',   tipo: 'boss',     meta: 1, texto: 'Derrote 1 boss (ato ou evento)',           icone: '👹' },
        { id: 'todos5',  tipo: 'qualquer', meta: 5, texto: 'Derrote 5 inimigos em qualquer conteúdo',  icone: '💀' },
        { id: 'craft1',  tipo: 'craft',    meta: 1, texto: 'Crie 1 arma em qualquer ato',              icone: '🔨' },
        { id: 'ato3',    tipo: 'ato',      meta: 3, texto: 'Derrote 3 inimigos de um mesmo ato',       icone: '🗺️' },
    ];

    // ─────────────────────────────────────────────────────────────
    // RECOMPENSAS DIÁRIAS — sorteadas pela data. Materiais sempre
    // em quantidade (10 ou 20), nunca 1.
    // ─────────────────────────────────────────────────────────────
    const MAT_COMUNS = ['espinho', 'couro_anta', 'garra_onca', 'escama_brilhante', 'flor_boto'];
    const MAT_RAROS = ['chifre_ancestral', 'garra_lendaria', 'escama_dourada'];

    const RECOMPENSAS = [
        { peso: 22, ouro: 600,  xp: 150, ess: 100, qtd: 10, texto: '600 ouro · 150 XP · 100 essência · 10 materiais' },
        { peso: 18, ouro: 800,  xp: 120, ess: 60,  qtd: 20, texto: '800 ouro · 120 XP · 60 essência · 20 materiais' },
        { peso: 12, ouro: 500,  xp: 0,   ess: 0,   qtd: 10, chave: 1, texto: '1 chave · 500 ouro · 10 materiais' },
        { peso: 12, ouro: 600,  xp: 0,   ess: 200, qtd: 20, texto: '200 essência · 600 ouro · 20 materiais' },
        { peso: 10, ouro: 2000, xp: 100, ess: 0,   qtd: 20, texto: '2.000 ouro · 100 XP · 20 materiais' },
        { peso: 10, ouro: 0,    xp: 0,   ess: 150, qtd: 10, raro: 1, texto: '150 essência · 1 material raro · 10 materiais' },
        { peso: 10, ouro: 700,  xp: 350, ess: 0,   qtd: 10, texto: '350 XP · 700 ouro · 10 materiais' },
        { peso: 5,  ouro: 500,  xp: 0,   ess: 0,   qtd: 10, nucleo: 1, texto: '1 Núcleo do Abismo · 500 ouro · 10 materiais' },
        { peso: 1,  ouro: 0,    xp: 0,   ess: 0,   qtd: 10, item: 1, texto: '1 item de evento antigo · 10 materiais' },
    ];

    // ─────────────────────────────────────────────────────────────
    // BAÚ — sem material de craft (decisão do usuário).
    // ─────────────────────────────────────────────────────────────
    const PREMIOS_BAU = [
        { id: 'ess5000',  peso: 24, nome: '5.000 essência sombria', icone: '🖤' },
        { id: 'chaves10', peso: 20, nome: '10 chaves do Sete Selados', icone: '🔑' },
        { id: 'nucleos3', peso: 16, nome: '3 Núcleos do Abismo', icone: '💀' },
        { id: 'arma',     peso: 13, nome: '1 arma de evento/ato', icone: '⚔️' },
        { id: 'amuleto',  peso: 11, nome: '1 amuleto de ato/Nações', icone: '📿' },
        { id: 'ess2000',  peso: 10, nome: '2.000 essência + 1.000 ouro', icone: '✨' },
        { id: 'coracao',  peso: 3,  nome: 'Coração do Vazio', icone: '🕳️' },
        { id: 'ess7500',  peso: 2,  nome: '7.500 essência sombria', icone: '💜' },
        { id: 'ess10000', peso: 1,  nome: '10.000 essência sombria (JACKPOT)', icone: '🏆' },
    ];

    // ─────────────────────────────────────────────────────────────
    // SAVE
    // ─────────────────────────────────────────────────────────────
    function garantirCheckin() {
        if (typeof STORY_PROGRESS === 'undefined' || !STORY_PROGRESS) return null;
        let c = STORY_PROGRESS.checkin;
        if (!c || c.versao !== 1) {
            c = {
                versao: 1,
                diaAtual: null,
                missao: null,
                diarias: 0,
                recompensa: null,
                recompensaCreditada: false,
                ba: null,
                semanas: {},
                auras: [],
                atos: {},
                historico: [],
            };
            STORY_PROGRESS.checkin = c;
        }
        c.semanas = c.semanas || {};
        c.auras = Array.isArray(c.auras) ? c.auras : [];
        c.atos = c.atos || {};
        c.historico = Array.isArray(c.historico) ? c.historico : [];
        return c;
    }
    window.calendarioGarantir = garantirCheckin;

    function salvar() {
        try {
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
        } catch (e) {}
    }

    function hojeStr(d) {
        const x = d instanceof Date ? d : new Date();
        return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
    }

    function seedData(d) {
        const x = d instanceof Date ? d : new Date();
        let h = x.getFullYear() * 10000 + (x.getMonth() + 1) * 100 + x.getDate();
        h = (h ^ (h >>> 7)) * 2654435761 >>> 0;
        h = (h ^ (h >>> 13)) * 1274126177 >>> 0;
        return (h ^ (h >>> 16)) >>> 0;
    }

    function sortearPonderado(lista, seed) {
        const total = lista.reduce((s, x) => s + (x.peso || 0), 0);
        let r = seed % total;
        for (const item of lista) {
            r -= (item.peso || 0);
            if (r < 0) return item;
        }
        return lista[lista.length - 1];
    }

    function getMissaoDoDia(d) {
        return MISSOES[seedData(d) % MISSOES.length];
    }
    function getRecompensaDoDia(d) {
        return sortearPonderado(RECOMPENSAS, seedData(d) >>> 3);
    }

    // ─────────────────────────────────────────────────────────────
    // CRÉDITOS
    // ─────────────────────────────────────────────────────────────
    function addInv(id, qtd) {
        if (!STORY_PROGRESS.inventory) STORY_PROGRESS.inventory = {};
        STORY_PROGRESS.inventory[id] = (STORY_PROGRESS.inventory[id] || 0) + qtd;
    }

    function darChaves(qtd) {
        try {
            if (typeof window.getChaveData !== 'function' || typeof window.salvarChaveData !== 'function') return false;
            const data = window.getChaveData() || { quantidade: 0, totalGasto: 0 };
            data.quantidade = Math.min(30, (data.quantidade || 0) + qtd);
            window.salvarChaveData(data);
            return true;
        } catch (e) { return false; }
    }

    function uid(base) {
        return String(base) + '#' + Date.now() + Math.floor(Math.random() * 1000000);
    }

    function itemAleatorioDe(pool, seed) {
        const ids = Object.keys(pool || {});
        if (!ids.length) return null;
        return ids[seed % ids.length];
    }

    function creditarRecompensaDiaria(rec) {
        if (!rec) return;
        if (rec.ouro) STORY_PROGRESS.gold = (STORY_PROGRESS.gold || 0) + rec.ouro;
        if (rec.xp) STORY_PROGRESS.totalXP = (STORY_PROGRESS.totalXP || 0) + rec.xp;
        if (rec.ess) addInv('essencia_sombria', rec.ess);
        if (rec.nucleo) addInv('nucleo_abismo', rec.nucleo);
        if (rec.chave) darChaves(rec.chave);
        if (rec.qtd) {
            const seed = seedData() >>> 5;
            for (let i = 0; i < rec.qtd; i++) addInv(MAT_COMUNS[(seed + i) % MAT_COMUNS.length], 1);
        }
        if (rec.raro) addInv(MAT_RAROS[seedData() % MAT_RAROS.length], 1);
        if (rec.item) {
            const arms = (typeof window.STORY_WEAPONS !== 'undefined') ? window.STORY_WEAPONS : {};
            const id = itemAleatorioDe(arms, seedData() >>> 7);
            if (id) {
                if (!Array.isArray(STORY_PROGRESS.craftedWeapons)) STORY_PROGRESS.craftedWeapons = [];
                STORY_PROGRESS.craftedWeapons.push(uid(id));
            }
        }
    }

    function creditarPremioBau(premio) {
        if (!premio) return;
        switch (premio.id) {
            case 'ess5000':  addInv('essencia_sombria', 5000); break;
            case 'ess7500':  addInv('essencia_sombria', 7500); break;
            case 'ess10000': addInv('essencia_sombria', 10000); break;
            case 'ess2000':  addInv('essencia_sombria', 2000); STORY_PROGRESS.gold = (STORY_PROGRESS.gold || 0) + 1000; break;
            case 'chaves10': darChaves(10); break;
            case 'nucleos3': addInv('nucleo_abismo', 3); break;
            case 'coracao':  addInv('coracao_vazio', 1); break;
            case 'arma': {
                const arms = (typeof window.STORY_WEAPONS !== 'undefined') ? window.STORY_WEAPONS : {};
                const id = itemAleatorioDe(arms, seedData() >>> 9);
                if (id) {
                    if (!Array.isArray(STORY_PROGRESS.craftedWeapons)) STORY_PROGRESS.craftedWeapons = [];
                    STORY_PROGRESS.craftedWeapons.push(uid(id));
                }
                break;
            }
            case 'amuleto': {
                const ams = (typeof window.STORY_AMULETS !== 'undefined') ? window.STORY_AMULETS : {};
                const id = itemAleatorioDe(ams, seedData() >>> 11);
                if (id) {
                    if (!Array.isArray(STORY_PROGRESS.craftedAmulets)) STORY_PROGRESS.craftedAmulets = [];
                    STORY_PROGRESS.craftedAmulets.push(uid(id));
                }
                break;
            }
        }
    }

    function som(nome) {
        try {
            if (typeof playSfx === 'function') playSfx(nome || 'win');
            else if (typeof window.playSfx === 'function') window.playSfx(nome || 'win');
        } catch (e) {}
    }
    function aviso(titulo, texto, icone) {
        try {
            if (typeof showToast === 'function') showToast(titulo, texto, icone || '📅');
        } catch (e) {}
    }

    function registrarDiaTema(c) {
        const tema = (typeof window.getTemaAtual === 'function') ? window.getTemaAtual() : null;
        if (!tema) return;
        const s = c.semanas[tema.id] || (c.semanas[tema.id] = { dias: [], auraPendente: false, auraResgatada: false });
        if (!Array.isArray(s.dias)) s.dias = [];
        const hoje = hojeStr();
        if (!s.dias.includes(hoje)) s.dias.push(hoje);
        if (s.dias.length >= DIAS_PARA_AURA && !s.auraPendente && !s.auraResgatada) {
            s.auraPendente = true;
            som('asas');
            aviso('✨ AURA TEMÁTICA!', tema.nome + ' — resgate no Calendário', tema.icone);
        }
    }

    function completarMissao(c) {
        if (!c.missao || c.missao.concluidaEm || c.recompensaCreditada) return;
        c.missao.concluidaEm = Date.now();
        if (!c.recompensa) c.recompensa = getRecompensaDoDia();
        creditarRecompensaDiaria(c.recompensa);
        c.recompensaCreditada = true;
        c.diarias = (c.diarias || 0) + 1;
        c.historico.push({ dia: hojeStr(), missao: c.missao.id, recompensa: c.recompensa.texto });
        if (c.historico.length > 90) c.historico = c.historico.slice(-90);

        registrarDiaTema(c);

        if (c.diarias >= DIAS_PARA_BAU) {
            if (!c.ba) {
                const premio = sortearPonderado(PREMIOS_BAU, (seedData() ^ (c.diarias * 7919)) >>> 0);
                c.ba = { prontoEm: Date.now(), premioId: premio.id, girado: false, resgatadoEm: null };
            }
            aviso('🎁 BAÚ DESBLOQUEADO!', 'Abra o Calendário para girar', '🎁');
        } else {
            aviso('✅ MISSÃO DIÁRIA CONCLUÍDA', c.recompensa.texto, c.missao.icone);
        }
        som('win');
        renderizarSeAberto();
    }

    // ─────────────────────────────────────────────────────────────
    // DETECÇÃO POR DELTA — um único wrapper, cobre atos/evento/craft
    // ─────────────────────────────────────────────────────────────
    function snapshot() {
        if (typeof STORY_PROGRESS === 'undefined' || !STORY_PROGRESS) return null;
        const p = STORY_PROGRESS;
        let eventBoss = 0, eventFases = 0;
        try {
            Object.values(p.eventoProgresso || {}).forEach(x => {
                const f = Array.isArray(x.fasesConcluidas) ? x.fasesConcluidas : [];
                if (f.includes('boss')) eventBoss++;
                eventFases += f.length;
            });
        } catch (e) {}
        const cap = (typeof storyCurrentPhase !== 'undefined' && storyCurrentPhase && storyCurrentPhase.chapter)
            || p.currentChapter || 1;
        return {
            inimigos: p.enemiesDefeated || 0,
            chefes: Array.isArray(p.bossesDefeated) ? p.bossesDefeated.length : 0,
            eventBoss, eventFases,
            armas: Array.isArray(p.craftedWeapons) ? p.craftedWeapons.length : 0,
            cap,
        };
    }

    function processarDelta(antes, depois) {
        const c = garantirCheckin();
        if (!c || !c.missao || c.missao.concluidaEm || c.missao.dia !== hojeStr()) return;
        const m = c.missao;
        const din = Math.max(0, depois.inimigos - antes.inimigos);
        const dchefe = Math.max(0, depois.chefes - antes.chefes) + Math.max(0, depois.eventBoss - antes.eventBoss);
        const darmas = Math.max(0, depois.armas - antes.armas);
        const dfases = Math.max(0, depois.eventFases - antes.eventFases);
        let prog = m.progresso || 0;

        if (m.tipo === 'inimigos' || m.tipo === 'qualquer') prog += din + (m.tipo === 'qualquer' ? dfases : 0);
        else if (m.tipo === 'boss') prog += dchefe;
        else if (m.tipo === 'craft') prog += darmas;
        else if (m.tipo === 'ato') {
            const chave = String(depois.cap);
            c.atos[chave] = (c.atos[chave] || 0) + din;
            prog = Math.max(prog, c.atos[chave]);
        }

        if (prog > 0) {
            m.progresso = Math.min(m.meta, prog);
            renderizarSeAberto();
        }
        if (m.progresso >= m.meta) completarMissao(c);
    }

    let _ultimoSnapshot = null;
    const _origSave = window.saveStoryProgress;
    window.saveStoryProgress = function () {
        const agora = snapshot();
        if (_ultimoSnapshot && agora) {
            try { processarDelta(_ultimoSnapshot, agora); } catch (e) { console.warn('[calendário] delta:', e); }
        }
        _ultimoSnapshot = agora;
        return typeof _origSave === 'function' ? _origSave.apply(this, arguments) : undefined;
    };

    function garantirMissaoDoDia() {
        const c = garantirCheckin();
        if (!c) return null;
        const hoje = hojeStr();
        if (!c.diaAtual || c.diaAtual !== hoje || !c.missao || c.missao.dia !== hoje) {
            const base = getMissaoDoDia();
            c.diaAtual = hoje;
            c.missao = { id: base.id, tipo: base.tipo, meta: base.meta, progresso: 0, dia: hoje, concluidaEm: null, texto: base.texto, icone: base.icone };
            c.recompensa = getRecompensaDoDia();
            c.recompensaCreditada = false;
            salvar();
        }
        return c;
    }
    window.calendarioGarantirHoje = garantirMissaoDoDia;

    // ─────────────────────────────────────────────────────────────
    // API PÚBLICA (usada pelo módulo de auras e por testes)
    // ─────────────────────────────────────────────────────────────
    window.calendarioEstado = function () {
        const c = garantirMissaoDoDia();
        if (!c) return null;
        return {
            versao: VERSAO,
          dia: c.diaAtual,
            missao: c.missao,
            recompensaTexto: c.recompensa ? c.recompensa.texto : '',
            diarias: c.diarias || 0,
            faltam: Math.max(0, DIAS_PARA_BAU - (c.diarias || 0)),
            bau: c.ba,
              semanas: c.semanas,
        };
    };
    window.calendarioPremiosBau = PREMIOS_BAU;
    window.calendarioMissaoDoDia = getMissaoDoDia;
    window.calendarioRecompensaDoDia = getRecompensaDoDia;
    window.calendarioSortear = sortearPonderado;
    window._calExtrasV206 = [];
    window.calendarioRegistrarExtra = function (fn) {
        if (typeof fn === 'function' && !window._calExtrasV206.includes(fn)) window._calExtrasV206.push(fn);
    };
    window.calendarioRenderizar = function () { renderizarPainel(); };
    window.calendarioAurasPendentes = function () {
        const c = garantirCheckin();
        if (!c) return [];
        return Object.keys(c.semanas)
            .filter(id => c.semanas[id] && c.semanas[id].auraPendente && !c.semanas[id].auraResgatada)
            .map(id => ({ temaId: id, tema: (typeof window.getTemaById === 'function') ? window.getTemaById(id) : null }))
            .filter(x => !!x.tema);
    };
    window.calendarioMarcarAuraResgatada = function (temaId) {
        const c = garantirCheckin();
        if (!c || !c.semanas[temaId]) return false;
        c.semanas[temaId].auraResgatada = true;
        c.semanas[temaId].auraPendente = false;
        salvar();
        renderizarSeAberto();
        return true;
    };

    function resgatarBau() {
        const c = garantirCheckin();
        if (!c || !c.ba || !c.ba.girado || c.ba.resgatadoEm) return false;
        const premio = PREMIOS_BAU.find(p => p.id === c.ba.premioId);
        creditarPremioBau(premio);
        c.ba.resgatadoEm = Date.now();
        salvar();
        som('win');
        aviso('🎁 PRÊMIO RESGATADO', premio ? premio.nome : '', '🎁');
        renderizarSeAberto();
        return true;
    }
    window.calendarioResgatarBau = resgatarBau;

    // ─────────────────────────────────────────────────────────────
    // UI
    // ─────────────────────────────────────────────────────────────
    const CSS = `
    <style id="calendarioV206CSS">
      #btnCalendarioV206{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;padding:0;flex:0 0 auto;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:linear-gradient(135deg,#2b2350,#3b2c6e);color:#fff;font-size:14px;line-height:1;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.35)}
      #btnCalendarioV206:hover{filter:brightness(1.15)}
      .cal-overlay{position:fixed;inset:0;z-index:60000;display:none;align-items:center;justify-content:center;padding:14px;background:rgba(3,4,10,.82)}
      .cal-overlay.active{display:flex}
      .cal-panel{width:min(560px,96vw);max-height:92vh;overflow:auto;border-radius:20px;border:1px solid rgba(255,255,255,.16);box-shadow:0 20px 70px rgba(0,0,0,.7);color:#fff;padding:16px;position:relative}
      .cal-panel h3{margin:0 0 4px;font-size:19px}
      .cal-sub{opacity:.82;font-size:12px;margin-bottom:12px}
      .cal-fechar{position:absolute;top:10px;right:12px;background:rgba(0,0,0,.35);border:0;color:#fff;width:30px;height:30px;border-radius:50%;font-size:17px;cursor:pointer}
      .cal-card{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:12px;margin-bottom:10px}
      .cal-missao{display:flex;align-items:center;gap:10px;font-weight:800}
      .cal-missao .icone{font-size:24px}
      .cal-barra{height:9px;border-radius:9px;background:rgba(0,0,0,.45);overflow:hidden;margin-top:9px}
      .cal-barra i{display:block;height:100%;background:linear-gradient(90deg,#7c4dff,#00e5ff);width:0}
      .cal-pequeno{font-size:11px;opacity:.8;margin-top:6px}
      .cal-linha{display:flex;justify-content:space-between;gap:8px;align-items:center;font-size:12px;margin:5px 0}
      .cal-btn{border:0;border-radius:12px;padding:10px 14px;font-weight:900;cursor:pointer;background:linear-gradient(135deg,#ffb300,#ff6f00);color:#1a1200}
      .cal-btn:disabled{opacity:.45;cursor:default}
      .cal-roleta{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:9px}
      .cal-premio{border-radius:10px;padding:8px 4px;text-align:center;font-size:10px;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.1);min-height:60px}
      .cal-premio .e{display:block;font-size:20px}
      .cal-premio.girando{background:linear-gradient(135deg,#ffd54f,#ff8f00);color:#1a1200;transform:scale(1.06);box-shadow:0 0 18px #ffb300}
      .cal-premio.venceu{background:linear-gradient(135deg,#00e5ff,#7c4dff);color:#fff;box-shadow:0 0 22px #00e5ff}
      .cal-versao{font-size:10px;opacity:.65;text-align:center;margin-top:10px}
      .perfil-versao-v206{display:inline-block;margin-left:8px;padding:2px 7px;border-radius:99px;background:linear-gradient(135deg,#7c4dff,#00e5ff);color:#fff;font-size:10px;font-weight:900;letter-spacing:.5px;vertical-align:middle}
      @media(max-width:480px){.cal-panel{padding:12px}.cal-roleta{grid-template-columns:repeat(3,1fr)}}
    </style>`;

    function injetarCSS() {
        if (!document.getElementById('calendarioV206CSS')) document.head.insertAdjacentHTML('beforeend', CSS);
    }

    function criarPainel() {
        if (document.getElementById('calendarioOverlay')) return document.getElementById('calendarioOverlay');
        const div = document.createElement('div');
        div.id = 'calendarioOverlay';
        div.className = 'cal-overlay';
        div.innerHTML = '<div class="cal-panel" id="calendarioPanel"></div>';
        document.body.appendChild(div);
        div.addEventListener('click', e => { if (e.target === div) fecharPainel(); });
        return div;
    }

    function renderizarSeAberto() {
        const ov = document.getElementById('calendarioOverlay');
        if (ov && ov.classList.contains('active')) renderizarPainel();
    }

    function renderizarPainel() {
        injetarCSS();
        const c = garantirMissaoDoDia();
        if (!c) return;
        const ov = criarPainel();
        const panel = document.getElementById('calendarioPanel');
        const tema = (typeof window.getTemaAtual === 'function') ? window.getTemaAtual() : null;
        const fundo = (typeof window.getFundoStyleTema === 'function') ? window.getFundoStyleTema(tema) : '';
        panel.setAttribute('style', fundo);

        const m = c.missao;
        const prog = Math.min(m.meta, m.progresso || 0);
        const pct = Math.round((prog / m.meta) * 100);
        const feita = !!m.concluidaEm;
        const pendentes = (typeof window.calendarioAurasPendentes === 'function') ? window.calendarioAurasPendentes() : [];
        const semana = tema ? (c.semanas[tema.id] || { dias: [] }) : { dias: [] };
        const diasSemana = Array.isArray(semana.dias) ? semana.dias.length : 0;
        const premio = c.ba ? PREMIOS_BAU.find(p => p.id === c.ba.premioId) : null;

        let html = '<button class="cal-fechar" onclick="window.calendarioFechar()">✕</button>';
        html += '<h3>' + (tema ? tema.icone + ' Calendário de Anhangá — ' + tema.nome : '📅 Calendário de Anhangá') + '</h3>';
        html += '<div class="cal-sub">Missão única do dia · igual para todos os jogadores</div>';

        html += '<div class="cal-card"><div class="cal-missao"><span class="icone">' + m.icone + '</span><span>' + m.texto + '</span></div>';
        html += '<div class="cal-barra"><i style="width:' + pct + '%"></i></div>';
        html += '<div class="cal-pequeno">' + (feita ? '✅ Concluída hoje' : prog + ' / ' + m.meta) + '</div></div>';

        html += '<div class="cal-card"><div class="cal-linha"><span>🎁 Recompensa de hoje</span><b>' + (feita ? c.recompensa.texto : '??? surpresa') + '</b></div>';
        html += '<div class="cal-linha"><span>📆 Missões concluídas</span><b>' + (c.diarias || 0) + ' / ' + DIAS_PARA_BAU + '</b></div>';
        html += '<div class="cal-barra"><i style="width:' + Math.round(((c.diarias || 0) / DIAS_PARA_BAU) * 100) + '%"></i></div></div>';

        if (tema) {
            html += '<div class="cal-card"><div class="cal-linha"><span>✨ Semana temática</span><b>' + diasSemana + ' / 7 dias</b></div>';
            html += '<div class="cal-pequeno">7 missões em 7 dias corridos liberam a aura <b>' + tema.aura + '</b>.</div></div>';
        }

        if (pendentes.length) {
            html += '<div class="cal-card"><b>✨ Aura pendente para resgate</b>';
            pendentes.forEach(p => {
                html += '<div class="cal-linha"><span>' + p.tema.icone + ' ' + p.tema.nome + '</span><button class="cal-btn" onclick="window.calendarioResgatarAura(\'' + p.temaId + '\')">RESGATAR</button></div>';
            });
            html += '</div>';
        }

        html += '<div class="cal-card"><b>🏆 Baú do mês</b>';
        if (!c.ba) {
            html += '<div class="cal-pequeno">Faltam ' + Math.max(0, DIAS_PARA_BAU - (c.diarias || 0)) + ' missões.</div>';
        } else {
            html += '<div class="cal-roleta" id="calRoleta">';
            PREMIOS_BAU.forEach(p => {
                html += '<div class="cal-premio" data-id="' + p.id + '"><span class="e">' + p.icone + '</span>' + p.nome + '</div>';
            });
            html += '</div>';
            html += '<div class="cal-linha" style="margin-top:10px"><span id="calResultado">' + (c.ba.resgatadoEm ? 'Resgatado: ' + (premio ? premio.nome : '') : (c.ba.girado ? 'Prêmio: ' + (premio ? premio.nome : '') : 'Clique para girar')) + '</span>';
            if (!c.ba.girado) html += '<button class="cal-btn" onclick="window.calendarioGirar()">ABRIR BAÚ</button>';
            else if (!c.ba.resgatadoEm) html += '<button class="cal-btn" onclick="window.calendarioResgatarBau()">RESGATAR</button>';
            html += '</div>';
        }
        html += '</div>';
        html += '<div class="cal-versao">' + VERSAO + ' · Calendário de Anhangá · fundos configuráveis em temas-catalogo.js</div>';
        try {
            (window._calExtrasV206 || []).forEach(fn => { html += fn(c) || ''; });
        } catch (e) {}
        panel.innerHTML = html;
        ov.classList.add('active');
    }

    function abrirPainel() {
        injetarCSS();
        renderizarPainel();
        som('click');
    }
    function fecharPainel() {
        const ov = document.getElementById('calendarioOverlay');
        if (ov) ov.classList.remove('active');
    }
    window.calendarioAbrir = abrirPainel;
    window.calendarioFechar = fecharPainel;

    function girarBau() {
        const c = garantirCheckin();
        if (!c || !c.ba || c.ba.girado || c.ba.resgatadoEm) return;
        c.ba.girado = true;
        salvar();
        som('chocalho');
        renderizarPainel();
        const itens = Array.from(document.querySelectorAll('#calRoleta .cal-premio'));
        if (!itens.length) return;
        const alvo = itens.find(el => el.dataset.id === c.ba.premioId) || itens[0];
        let passo = 0;
        const total = 26;
        const timer = setInterval(() => {
            itens.forEach(el => el.classList.remove('girando'));
            itens[passo % itens.length].classList.add('girando');
            passo++;
            if (passo >= total) {
                clearInterval(timer);
                itens.forEach(el => el.classList.remove('girando'));
                alvo.classList.add('venceu');
                const res = document.getElementById('calResultado');
                const premio = PREMIOS_BAU.find(p => p.id === c.ba.premioId);
                if (res) res.textContent = 'Prêmio: ' + (premio ? premio.nome : '');
                const btn = document.querySelector('#calendarioPanel .cal-btn[onclick*="calendarioResgatarBau"]');
                if (!btn) {
                    const linha = res ? res.parentElement : null;
                    if (linha) {
                        const b = document.createElement('button');
                        b.className = 'cal-btn';
                        b.textContent = 'RESGATAR';
                        b.onclick = window.calendarioResgatarBau;
                        linha.appendChild(b);
                    }
                }
                som('forja');
            }
        }, 70 + passo * 4);
    }
    window.calendarioGirar = girarBau;

    window.calendarioResgatarAura = function (temaId) {
        try {
            if (typeof window.aurasResgatar === 'function') window.aurasResgatar(temaId);
        } catch (e) {}
        window.calendarioMarcarAuraResgatada(temaId);
        renderizarSeAberto();
    };

    // ─────────────────────────────────────────────────────────────
    // BOTÃO NA ALDEIA + SELO DE VERSÃO NO PERFIL
    // ─────────────────────────────────────────────────────────────
    function injetarBotao() {
        injetarCSS();
        if (document.getElementById('btnCalendarioV206')) return;
        const hosts = ['.modern-ald-header', '.aldeia-top-bar', '#aldeiaVisualWrap'];
        let host = null;
        for (const sel of hosts) {
            const el = document.querySelector(sel);
            if (el) { host = el; break; }
        }
        if (!host) return;
        const b = document.createElement('button');
        b.id = 'btnCalendarioV206';
        b.innerHTML = '📅';
        b.title = 'Calendário de Anhangá';
        b.setAttribute('aria-label', 'Calendário de Anhangá');
        b.onclick = abrirPainel;
        host.appendChild(b);
    }

    function injetarVersaoPerfil() {
        injetarCSS();
        document.querySelectorAll('.perfil-versao-v206').forEach(el => el.remove());
        const alvos = ['#storyScreen .profile-name', '#storyScreen .profile-leader-title'];
        for (const sel of alvos) {
            const el = document.querySelector(sel);
            if (!el) continue;
            const badge = document.createElement('span');
            badge.className = 'perfil-versao-v206';
            badge.textContent = VERSAO;
            el.appendChild(badge);
            break;
        }
    }

    function instalarHooksUI() {
        const nomes = ['renderAldeiaScreen', '_abrirTelaPerfilV3'];
        nomes.forEach(nome => {
            const orig = window[nome];
            if (typeof orig !== 'function' || orig._calHookV206) return;
            window[nome] = function () {
                const r = orig.apply(this, arguments);
                setTimeout(() => { try { injetarBotao(); injetarVersaoPerfil(); } catch (e) {} }, 60);
                return r;
            };
            window[nome]._calHookV206 = true;
        });
    }

    function garantirUI() {
        window.calendarioUITicks = (window.calendarioUITicks || 0) + 1;
        try { injetarBotao(); injetarVersaoPerfil(); } catch (e) {}
    }
    window.calendarioInjetarUI = garantirUI;

    // boot
    injetarCSS();
    instalarHooksUI();
    document.addEventListener('DOMContentLoaded', () => setTimeout(garantirUI, 200));
    setTimeout(() => { try { garantirMissaoDoDia(); } catch (e) {} garantirUI(); }, 120);

    // A aldeia troca window.renderAldeiaScreen durante o init dela (que espera
    // SPRITES_STORY). Reinstalamos o hook e reinserimos o botão caso isso ocorra.
    setInterval(() => {
        instalarHooksUI();
        garantirUI();
    }, 500);

    console.log('✅ [V203/V204] Calendário de Anhangá ativo (' + VERSAO + ').');
})();
