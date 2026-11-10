// ================================================================
// 🎓 ATO 0 — TREINAMENTO EM FASES (0-1 a 0-4) — V1.0
// ----------------------------------------------------------------
// Amplia o tutorial antigo (9 lições de Tupã) para um conjunto de
// FASES, como os Atos, cada uma ensinando as mecânicas de um herói:
//
//   0-1  TUPÃ    — o tutorial de hoje (movimento, caminho, formas,
//                  Solo Sagrado, Muiraquitã, Poder Ancestral)
//   0-2  CAIPORA — ataque à distância (alcance 3), área 3×3,
//                  bônus de dano por tile percorrido, Bravely/9 tiles
//   0-3  TUPÃ    — combate corpo a corpo (Guerreiro): só bate quem
//                  está colado, cada tile percorrido soma dano,
//                  e o Poder Ancestral atinge a COLUNA inteira
//   0-4  SUMÉ    — ataque mágico à distância (alcance 4), forma
//                  LINHA cura 1 de HP, e o PA atinge a LINHA inteira
//
// NADA da lógica do jogo é alterada: as lições usam as funções que o
// tutorial já tinha (setup/check/hint) e um "alvo" desenhado só na
// tela do tutorial.
// ================================================================
(function atoTutorialFases() {
    'use strict';
    if (window._atoTutorialFases) return;
    window._atoTutorialFases = true;

    // ---------------------------------------------------------
    // 1) CONFIGURAÇÃO DAS FASES
    // ---------------------------------------------------------
    const FASES = [
        {
            id: '0-1', heroi: 'Tupa', nome: 'Tupã — O Primeiro Passo',
            resumo: 'Movimento, caminhos, formas, Solo Sagrado e Poder Ancestral.',
            desc: 'O treinamento de sempre: aprenda a andar, encadear tiles, montar formas e despertar o Poder Ancestral.',
            licoes: ['move', 'path', 'linha', 'l', 'zigzag', 'quadrado', 'pa', 'solo', 'muiraquita'],
        },
        {
            id: '0-2', heroi: 'Caipora', nome: 'Caipora — A Flecha que Atravessa',
            resumo: 'Ataque à distância, área 3×3 e o bônus de cada tile.',
            desc: 'A Caipora atinge de longe (alcance 3). Aprenda o alcance, o dano que cresce a cada tile percorrido e a flecha que cai em área.',
            licoes: ['alcance', 'bonus_tiles', 'area_caipora', 'bravely'],
        },
        {
            id: '0-3', heroi: 'Tupa', nome: 'Tupã — O Golpe Colado',
            resumo: 'Corpo a corpo: só acerta quem está ao lado, e o PA abre a coluna.',
            desc: 'Tupã é Guerreiro: bate com força, mas só em quem está colado nele. E o Poder Ancestral dele varre a COLUNA inteira.',
            licoes: ['corpo_a_corpo', 'guerreiro_pa'],
        },
        {
            id: '0-4', heroi: 'Sume', nome: 'Sumé — A Magia que Cura',
            resumo: 'Ataque à distância (4), LINHA que cura e PA em linha inteira.',
            desc: 'Sumé atinge de longe (alcance 4) e a forma LINHA cura o herói. O Poder Ancestral dele atinge a LINHA inteira do tabuleiro.',
            licoes: ['alcance_sume', 'linha_cura', 'sume_pa'],
        },
    ];

    const CHAVE_PROGRESSO = 'entity_tutorial_fases';

    function lerProgresso() {
        try {
            const raw = localStorage.getItem(CHAVE_PROGRESSO);
            return raw ? JSON.parse(raw) : { fases: {}, licoes: {} };
        } catch (e) { return { fases: {}, licoes: {} }; }
    }
    function salvarProgresso(p) {
        try { localStorage.setItem(CHAVE_PROGRESSO, JSON.stringify(p)); } catch (e) {}
    }
    function faseConcluida(id) {
        const p = lerProgresso();
        return !!(p.fases && p.fases[id] && p.fases[id].concluida);
    }
    function marcarFaseConcluida(id) {
        const p = lerProgresso();
        p.fases = p.fases || {};
        p.fases[id] = { concluida: true, quando: Date.now() };
        salvarProgresso(p);
        // a 0-1 é o tutorial antigo: mantém a chave que o jogo já lê
        if (id === '0-1') {
            try {
                localStorage.setItem('entity_tutorial_data', JSON.stringify({
                    completed: true, lastLesson: 9, timestamp: Date.now()
                }));
            } catch (e) {}
        }
    }

    // ---------------------------------------------------------
    // 2) O "ALVO" — inimigo desenhado na tela do tutorial
    // ---------------------------------------------------------
    const alvo = { x: -1, y: -1, hp: 0, maxHp: 0, vivo: false, nome: 'Alvo' };

    function colocarAlvo(x, y, hp, nome) {
        alvo.x = x; alvo.y = y; alvo.hp = hp; alvo.maxHp = hp; alvo.vivo = true; alvo.nome = nome || 'Alvo';
        desenharAlvo();
    }
    function limparAlvo() {
        alvo.vivo = false;
        const el = document.getElementById('tutorialAlvo');
        if (el) el.remove();
    }
    function desenharAlvo() {
        const board = document.getElementById('tutorialBoard');
        if (!board || !alvo.vivo) return;
        const s = getStep();
        let el = document.getElementById('tutorialAlvo');
        if (!el) {
            el = document.createElement('div');
            el.id = 'tutorialAlvo';
            el.style.cssText = 'position:absolute;width:52px;height:52px;border-radius:50%;' +
                'display:flex;align-items:center;justify-content:center;font-size:1.7rem;' +
                'background:radial-gradient(circle,#8a2b1f,#3a0f0a);border:2px solid #d05050;' +
                'box-shadow:0 0 18px rgba(208,80,80,.7);z-index:6;pointer-events:none;transition:left .15s,top .15s;';
            el.textContent = '👹';
            board.appendChild(el);
        }
        el.style.left = (alvo.x * s + 4) + 'px';
        el.style.top = (alvo.y * s + 4) + 'px';
        el.title = `${alvo.nome} — ${alvo.hp}/${alvo.maxHp} HP`;
    }
    function alvoVivo() { return alvo.vivo && alvo.hp > 0; }

    // ---------------------------------------------------------
    // 3) PAINEL DE STATUS (HP do alvo, bônus de dano, aviso)
    // ---------------------------------------------------------
    function painel() {
        let box = document.getElementById('tutorialPainel');
        if (box) return box;
        const inst = document.getElementById('tutorialInstruction');
        if (!inst) return null;
        box = document.createElement('div');
        box.id = 'tutorialPainel';
        box.style.cssText = 'flex:1 0 100%;width:100%;margin-top:10px;display:flex;gap:10px;' +
            'flex-wrap:wrap;align-items:center;justify-content:center;' +
            'font-family:"EB Garamond",serif;font-size:.92rem;color:#d9c89a;';
        inst.appendChild(box);
        return box;
    }
    function atualizarPainel() {
        const box = painel();
        if (!box) return;
        const p = players[0];
        const partes = [];
        if (alvo.vivo) {
            const pct = Math.max(0, Math.round((alvo.hp / alvo.maxHp) * 100));
            partes.push(`<span style="display:inline-flex;align-items:center;gap:6px;">
                👹 <b>${alvo.nome}</b>
                <span style="display:inline-block;width:90px;height:8px;background:#1a1208;border:1px solid #8a2b1f;border-radius:4px;overflow:hidden;">
                    <span style="display:block;height:100%;width:${pct}%;background:linear-gradient(90deg,#a83232,#d05050);"></span>
                </span>
                ${alvo.hp}/${alvo.maxHp}</span>`);
        }
        if (p) {
            const bonus = Math.max(0, (path ? path.length : 0) - 1);
            partes.push(`<span>⚔️ ATK base <b>${(CLASS_DB[p.class] || {}).atk || '?'}</b></span>`);
            if (bonus > 0) partes.push(`<span style="color:#e8b923;">🔥 +${bonus} de bônus (${path.length} tiles)</span>`);
            partes.push(`<span>❤️ HP <b>${p.hp}/${p.maxHp}</b></span>`);
        }
        box.innerHTML = partes.join('<span style="opacity:.35;">|</span>');
    }

    // ---------------------------------------------------------
    // 4) DETECTAR O QUE O JOGADOR FEZ (lido do próprio estado)
    // ---------------------------------------------------------
    // chamado no lugar de executeAction() quando estamos numa lição nova
    async function executarTurnoDaFase() {
        const li = TUTORIAL_LESSONS[tutorialLessonIndex];
        if (!li || !li._nova) return false;
        const p = players[0];
        if (!p) return false;
        const usados = [...path];
        if (!usados.length) return false;

        // 1) anda
        for (const idx of usados) {
            p.x = idx % 8;
            p.y = Math.floor(idx / 8);
            updateTutorialVisuals();
            await sleep(110);
        }

        // 2) conta as ações desta lição
        window._faseAcoes = window._faseAcoes || {};
        window._faseAcoes[li._nova] = window._faseAcoes[li._nova] || {};
        const reg = window._faseAcoes[li._nova];
        reg.tilesPercorridos = usados.length;
        reg.bonus = Math.max(0, usados.length - 1);
        reg.forma = detectShape(usados);
        reg.distanciaAoAlvo = alvoVivo() ? Math.abs(p.x - alvo.x) + Math.abs(p.y - alvo.y) : null;
        if (alvoVivo()) {
            const info = CLASS_DB[p.class] || {};
            // no jogo: Guerreiro (min 0) só acerta colado; mago/arqueiro
            // precisam percorrer pelo menos info.min tiles
            const colado = Math.abs(p.x - alvo.x) + Math.abs(p.y - alvo.y) <= 1;
            reg.alcancou = (info.min || 0) > 0
                ? usados.length >= info.min
                : colado;
            reg.alcance = info.min || 0;
        }

        // 3) o ataque (se a lição pede)
        if (li._ataca && alvoVivo()) {
            const info = CLASS_DB[p.class] || {};
            const extra = Math.max(0, usados.length - (info.min || 0));
            const dano = (info.atk || 0) + reg.bonus + (li._bonusExtra || 0) +
                (p.class === 'Sume' ? extra : Math.floor(extra / 2));
            const acertou = li._regraAcerto ? li._regraAcerto(reg, p) : reg.alcancou;
            if (acertou) {
                alvo.hp = Math.max(0, alvo.hp - dano);
                showDmgEffect(alvo.x, alvo.y, dano);
                if (alvo.hp <= 0) {
                    alvo.vivo = false;
                    const el = document.getElementById('tutorialAlvo');
                    if (el) el.style.opacity = '0';
                }
                reg.acertou = true;
                reg.danoCausado = dano;
            } else {
                reg.acertou = false;
                if (typeof addLog === 'function') {
                    addLog('❌ Fora de alcance — o ataque não chegou.');
                }
            }
        }

        // 3.5) efeito especial da lição (ex.: área 3x3 da Caipora)
        if (li._apos === 'area' && reg.acertou) {
            efeitoPoderAncestral('area3x3', p);
        }

        // 4) formas e PA (efeito visual simples na tela do tutorial)
        if (reg.forma) aplicarEfeitoDaForma(reg.forma);
        if (li._poderAncestral && usados.length >= (li._tilesPA || 9)) {
            reg.pa = true;
            efeitoPoderAncestral(li._paAlvo || 'coluna', p);
        }

        path = [];
        if (typeof renderTutorialPath === 'function') renderTutorialPath();
        updateTutorialVisuals();
        atualizarPainel();
        desenharAlvo();
        checkTutorialObjective();
        return true;
    }

    function aplicarEfeitoDaForma(forma) {
        const p = players[0];
        if (!p) return;
        if (forma === 'LINHA') {
            const antes = p.hp;
            p.hp = Math.min(p.maxHp, p.hp + 1);
            if (p.hp > antes) showHealEffect(p.x, p.y, 1);
        }
        if (forma === 'ZIGZAG') {
            // no jogo: +3 de dano
            window._faseAcoes = window._faseAcoes || {};
        }
    }

    function efeitoPoderAncestral(tipo, p) {
        const board = document.getElementById('tutorialBoard');
        if (!board) return;
        const s = getStep();
        const cor = 'rgba(232,185,35,.35)';
        const pintar = (x, y) => {
            const d = document.createElement('div');
            d.style.cssText = `position:absolute;left:${x * s}px;top:${y * s}px;width:${s - 4}px;height:${s - 4}px;` +
                `background:${cor};border-radius:6px;z-index:3;pointer-events:none;transition:opacity .6s;`;
            board.appendChild(d);
            setTimeout(() => { d.style.opacity = '0'; }, 900);
            setTimeout(() => d.remove(), 1600);
        };
        if (tipo === 'coluna') for (let y = 0; y < 8; y++) pintar(p.x, y);
        if (tipo === 'linha') for (let x = 0; x < 8; x++) pintar(x, p.y);
        if (tipo === 'area3x3') {
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                const nx = alvo.x + dx, ny = alvo.y + dy;
                if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) pintar(nx, ny);
            }
        }
    }

    // ---------------------------------------------------------
    // 5) AS LIÇÕES NOVAS
    //    Cada uma: setup (prepara tabuleiro/alvo), check (objetivo)
    // ---------------------------------------------------------
    function pintarTile(idx, cor) {
        grid[idx] = cor;
        const t = document.querySelectorAll('#tutorialGrid .tile')[idx];
        if (t) t.className = `tile bg-${cor}`;
    }

    const LICOES_NOVAS = {
        // ---------- CAIPORA ----------
        alcance: {
            title: 'LIÇÃO 1 — ALCANCE (CAIPORA)',
            instruction: 'A Caipora ataca de LONGE (alcance 3). Ande alguns tiles até ficar a até 3 casas do inimigo e clique em ▶ JOGAR TURNO para acertá-lo.',
            _nova: 'alcance', _ataca: true,
            setup() {
                for (let x = 4; x <= 7; x++) pintarTile(7 * 8 + x, 'TERRA');
                colocarAlvo(6, 7, 6, 'Servo');
            },
            check() { const r = (window._faseAcoes || {}).alcance || {}; return r.acertou === true; },
        },
        bonus_tiles: {
            title: 'LIÇÃO 2 — BÔNUS POR TILE',
            instruction: 'Cada tile que você PERCORRE soma dano. Faça um caminho de 4 tiles ou mais até o inimigo e veja o número do dano crescer no painel.',
            _nova: 'bonus_tiles', _ataca: true,
            setup() {
                for (let x = 3; x <= 7; x++) pintarTile(7 * 8 + x, 'TERRA');
                for (let x = 3; x <= 7; x++) pintarTile(6 * 8 + x, 'TERRA');
                colocarAlvo(5, 6, 14, 'Servo');
            },
            check() {
                const r = (window._faseAcoes || {}).bonus_tiles || {};
                return r.acertou === true && (r.tilesPercorridos || 0) >= 4;
            },
        },
        area_caipora: {
            title: 'LIÇÃO 3 — ÁREA 3×3',
            instruction: 'Quando a Caipora acerta, a flecha cai em ÁREA: todos os 9 tiles ao redor do inimigo são atingidos e mudam de elemento. Acerte o alvo para ver.',
            _nova: 'area_caipora', _ataca: true, _apos: 'area',
            setup() {
                for (let x = 2; x <= 7; x++) pintarTile(7 * 8 + x, 'TERRA');
                for (let x = 2; x <= 7; x++) pintarTile(6 * 8 + x, 'TERRA');
                colocarAlvo(5, 6, 8, 'Servo');
            },
            check() { const r = (window._faseAcoes || {}).area_caipora || {}; return r.acertou === true; },
        },
        bravely: {
            title: 'LIÇÃO 4 — BRAVELY (9 TILES)',
            instruction: 'Percorrer 9 tiles num único turno dispara o BRAVELY: uma corrente de ataques. Faça um caminho de 9 tiles e clique em ▶ JOGAR TURNO.',
            _nova: 'bravely', _ataca: false,
            setup() {
                for (let y = 4; y <= 7; y++) for (let x = 0; x <= 7; x++) pintarTile(y * 8 + x, 'TERRA');
                colocarAlvo(7, 4, 30, 'Servo');
            },
            check() { const r = (window._faseAcoes || {}).bravely || {}; return r.tilesPercorridos >= 9; },
        },

        // ---------- TUPÃ (GUERREIRO) ----------
        corpo_a_corpo: {
            title: 'LIÇÃO 1 — CORPO A CORPO',
            instruction: 'O Guerreiro só acerta quem está COLADO nele (um tile ao lado). Chegue ao lado do inimigo e clique em ▶ JOGAR TURNO.',
            _nova: 'corpo_a_corpo', _ataca: true,
            setup() {
                for (let x = 4; x <= 7; x++) pintarTile(7 * 8 + x, 'FOGO');
                colocarAlvo(7, 7, 10, 'Servo');
            },
            check() { const r = (window._faseAcoes || {}).corpo_a_corpo || {}; return r.acertou === true; },
        },
        guerreiro_pa: {
            title: 'LIÇÃO 2 — PODER ANCESTRAL DO GUERREIRO',
            instruction: 'Com 9 tiles percorridos, o Poder Ancestral do Tupã desperta e atinge a COLUNA inteira. Faça o caminho longo e clique em ▶ JOGAR TURNO.',
            _nova: 'guerreiro_pa', _ataca: false, _poderAncestral: true, _paAlvo: 'coluna',
            setup() {
                for (let y = 3; y <= 7; y++) for (let x = 0; x <= 7; x++) pintarTile(y * 8 + x, 'FOGO');
                colocarAlvo(4, 4, 30, 'Servo');
            },
            check() { const r = (window._faseAcoes || {}).guerreiro_pa || {}; return r.pa === true; },
        },

        // ---------- SUMÉ (MAGO) ----------
        alcance_sume: {
            title: 'LIÇÃO 1 — ALCANCE MÁGICO (SUMÉ)',
            instruction: 'Sumé atinge de longe: alcance 4. Chegue a até 4 casas do inimigo e clique em ▶ JOGAR TURNO.',
            _nova: 'alcance_sume', _ataca: true,
            setup() {
                for (let x = 3; x <= 7; x++) pintarTile(7 * 8 + x, 'AGUA');
                colocarAlvo(7, 7, 6, 'Servo');
            },
            check() { const r = (window._faseAcoes || {}).alcance_sume || {}; return r.acertou === true; },
        },
        linha_cura: {
            title: 'LIÇÃO 2 — FORMA LINHA QUE CURA',
            instruction: 'Monte uma LINHA de 4 tiles do mesmo elemento. No Sumé, a LINHA também CURA 1 de HP — olhe seu HP no painel antes e depois.',
            _nova: 'linha_cura', _ataca: false,
            setup() {
                for (let x = 3; x <= 7; x++) pintarTile(7 * 8 + x, 'AGUA');
                players[0].hp = Math.max(1, players[0].maxHp - 4);
                updateTutorialVisuals();
            },
            check() {
                const r = (window._faseAcoes || {}).linha_cura || {};
                return r.forma === 'LINHA';
            },
        },
        sume_pa: {
            title: 'LIÇÃO 3 — PODER ANCESTRAL DO MAGO',
            instruction: 'O Poder Ancestral do Sumé atinge a LINHA inteira. Faça 9 tiles num turno e clique em ▶ JOGAR TURNO.',
            _nova: 'sume_pa', _ataca: false, _poderAncestral: true, _paAlvo: 'linha',
            setup() {
                for (let y = 3; y <= 7; y++) for (let x = 0; x <= 7; x++) pintarTile(y * 8 + x, 'AGUA');
                colocarAlvo(6, 5, 30, 'Servo');
            },
            check() { const r = (window._faseAcoes || {}).sume_pa || {}; return r.pa === true; },
        },
    };

    // nomes usados no FASES[].licoes → índice em TUTORIAL_LESSONS
    const MAPA_NOMES = {
        move: 0, path: 1, linha: 2, l: 3, zigzag: 4, quadrado: 5, pa: 6, solo: 7, muiraquita: 8,
    };

    // ---------------------------------------------------------
    // 6) MONTAR A LISTA DE LIÇÕES DA FASE ATUAL
    // ---------------------------------------------------------
    let faseAtual = 0;
    let licoesDaFase = [];

    function montarLicoes(fase) {
        const lista = [];
        fase.licoes.forEach(nome => {
            if (MAPA_NOMES[nome] !== undefined) {
                const base = TUTORIAL_LESSONS[MAPA_NOMES[nome]];
                if (base) lista.push(base);
            } else if (LICOES_NOVAS[nome]) {
                lista.push(LICOES_NOVAS[nome]);
            }
        });
        return lista;
    }

    // ---------------------------------------------------------
    // 7) ABRIR UMA FASE
    // ---------------------------------------------------------
    window.abrirFaseTutorial = function (indiceFase) {
        faseAtual = Math.max(0, Math.min(FASES.length - 1, indiceFase || 0));
        const fase = FASES[faseAtual];

        // usa a tela do tutorial que já existe
        const tut = document.getElementById('tutorialScreen');
        if (!tut) { console.warn('[Ato0] tela do tutorial não encontrada'); return; }

        // esconde a tela de Atos
        const ss = document.getElementById('storyScreen');
        if (ss) { ss.style.display = 'none'; ss.classList.remove('active'); }

        tutorialMode = true;
        gameActive = true;
        window.tutorialMode = true;
        window.gameActive = true;
        currentScreen = 'tutorial';

        // herói da fase
        const info = (typeof STORY_HERO_CLASSES !== 'undefined' && STORY_HERO_CLASSES[fase.heroi]) || {};
        playerCount = 1;
        playerConfigs[0].active = true;
        playerConfigs[0].class = fase.heroi;
        playerConfigs[0].name = info.displayName || fase.heroi;

        licoesDaFase = montarLicoes(fase);
        // troca a lista global que o motor do tutorial lê
        TUTORIAL_LESSONS.length = 0;
        licoesDaFase.forEach(l => TUTORIAL_LESSONS.push(l));

        // cabeçalho
        const titulo = document.querySelector('.tutorial-header-title');
        if (titulo) titulo.textContent = `🎓 ATO 0 · FASE ${fase.id} — ${fase.nome.toUpperCase()}`;
        const total = document.getElementById('tutorialLessonTotal');
        if (total) total.textContent = licoesDaFase.length;

        // limpa overlay de conclusão anterior
        const ov = document.querySelector('.tutorial-complete');
        if (ov) ov.remove();

        tut.classList.add('active');
        tut.style.display = 'flex';

        // monta o tabuleiro e a primeira lição
        limparAlvo();
        window._faseAcoes = {};
        initTutorialGrid();
        // o herói certo no tabuleiro
        const img = document.getElementById('imgP0');
        if (img) {
            const spr = (typeof SPRITES !== 'undefined') ? (SPRITES[fase.heroi] || '') : '';
            if (spr) img.src = spr;
        }
        players[0].class = fase.heroi;
        players[0].element = (CLASS_DB[fase.heroi] || {}).element || 'FOGO';
        loadTutorialLesson(0);
        setTimeout(atualizarPainel, 60);
    };

    // ---------------------------------------------------------
    // 8) CONCLUIR A FASE (volta para a tela de Atos)
    // ---------------------------------------------------------
    const _finishOriginal = window.finishTutorial;
    window.finishTutorial = function () {
        // se não estamos numa fase nova, deixa o comportamento antigo
        const fase = FASES[faseAtual];
        if (!fase) return typeof _finishOriginal === 'function' ? _finishOriginal.apply(this, arguments) : undefined;

        marcarFaseConcluida(fase.id);
        tutorialMode = false;
        window.tutorialMode = false;
        gameActive = false;
        window.gameActive = false;

        const tut = document.getElementById('tutorialScreen');
        if (tut) { tut.classList.remove('active'); tut.style.display = 'none'; }

        // devolve a lista original de lições
        TUTORIAL_LESSONS.length = 0;
        LISTA_ORIGINAL.forEach(l => TUTORIAL_LESSONS.push(l));

        // volta para a tela de Atos
        const ss = document.getElementById('storyScreen');
        if (ss) { ss.style.display = 'flex'; ss.classList.add('active'); }
        if (typeof window.renderAtosScreen === 'function') window.renderAtosScreen();
    };

    // guarda a lista original (9 lições do tutorial antigo)
    const LISTA_ORIGINAL = TUTORIAL_LESSONS.slice();

    // ---------------------------------------------------------
    // 9) O TURNO DAS LIÇÕES NOVAS
    //    (intercepta o executeAction do tutorial)
    // ---------------------------------------------------------
    const _execOriginal = window.executeAction;
    if (typeof _execOriginal === 'function') {
        window.executeAction = function () {
            if (tutorialMode) {
                const li = TUTORIAL_LESSONS[tutorialLessonIndex];
                if (li && li._nova) {
                    executarTurnoDaFase();
                    return;
                }
            }
            return _execOriginal.apply(this, arguments);
        };
    }

    // o painel precisa acompanhar a seleção de tiles
    const _loadOriginal = window.loadTutorialLesson;
    if (typeof _loadOriginal === 'function') {
        window.loadTutorialLesson = function () {
            const r = _loadOriginal.apply(this, arguments);
            setTimeout(atualizarPainel, 60);
            return r;
        };
    }

    const _checkOriginal = window.checkTutorialObjective;
    document.addEventListener('click', () => {
        setTimeout(atualizarPainel, 30);
    }, true);

    // ---------------------------------------------------------
    // 10) O CARD DO ATO 0 NA TELA DE ATOS
    //     (substitui o card antigo, agora abre a lista de fases)
    // ---------------------------------------------------------
    window.entrarTutorialDaAldeia = function () {
        const ss = document.getElementById('storyScreen');
        if (ss) { ss.style.display = 'flex'; ss.classList.add('active'); }
        window.renderFasesAto0();
    };

    window.renderFasesAto0 = function () {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;
        const concluidas = FASES.filter(f => faseConcluida(f.id)).length;

        const cards = FASES.map((f, i) => {
            const feito = faseConcluida(f.id);
            const liberada = i === 0 || faseConcluida(FASES[i - 1].id);
            const info = (typeof STORY_HERO_CLASSES !== 'undefined' && STORY_HERO_CLASSES[f.heroi]) || {};
            const spr = (typeof SPRITES !== 'undefined') ? (SPRITES[f.heroi] || '') : '';
            const sprite = spr
                ? `<img src="${spr}" style="width:100%;height:150px;object-fit:contain;filter:drop-shadow(0 5px 14px rgba(0,0,0,.7))" onerror="this.style.display='none'">`
                : `<div style="height:150px;display:flex;align-items:center;justify-content:center;font-size:4rem;">🎓</div>`;
            return `<div class="story-phase-card ${liberada ? 'unlocked' : 'locked'} ${feito ? 'completed' : ''}"
                        ${liberada ? `onclick="window.abrirFaseTutorial(${i})"` : ''}>
                <div class="story-phase-bg">${sprite}</div>
                <div class="story-phase-header">
                    <span class="story-phase-num">${f.id}</span>
                    <span class="story-phase-stars">${feito ? '✅' : (liberada ? '▶' : '🔒')}</span>
                </div>
                <div class="story-phase-body">
                    <h4 class="story-phase-name">${f.nome}</h4>
                    <p class="story-phase-desc">${f.desc}</p>
                    <div class="story-phase-enemies-row" style="font-size:.85rem;color:#8ac070;">
                        ${f.resumo}
                    </div>
                </div>
            </div>`;
        }).join('');

        screen.innerHTML = `
            <div class="story-container">
                <div class="story-header">
                    <h1 class="story-title">🎓 ATO 0 — O TREINAMENTO</h1>
                    <p class="story-subtitle">Quatro fases curtas. Cada uma apresenta as mecânicas de um herói.</p>
                    <div style="text-align:center;margin-top:10px;color:#8ac070;font-family:'EB Garamond',serif;">
                        ${concluidas} de ${FASES.length} fases concluídas
                    </div>
                </div>
                <div class="story-phases-grid">${cards}</div>
                <div class="story-footer">
                    <button class="story-back-btn" onclick="renderAtosScreen()">← VOLTAR AOS ATOS</button>
                </div>
            </div>`;
        screen.classList.add('active');
        screen.style.display = 'flex';
    };

    // ---------------------------------------------------------
    // 11) CSS do painel e do alvo
    // ---------------------------------------------------------
    if (!document.getElementById('atoTutorialCSS')) {
        const st = document.createElement('style');
        st.id = 'atoTutorialCSS';
        st.textContent = `
            #tutorialPainel { width: 100%; justify-content: center; }
            #tutorialAlvo { transition: left .15s, top .15s, opacity .3s; }
            .tutorial-instruction { flex-wrap: wrap; }
        `;
        document.head.appendChild(st);
    }

    console.log('[Ato0] treinamento em 4 fases carregado —', FASES.map(f => f.id).join(', '));
})();
