// ================================================================
// 🆕 SELO "NOVO" — V1.0
// ----------------------------------------------------------------
// Marca com um selo "NOVO" o que o jogador ainda não viu:
//   • itens/materiais novos no inventário (Tesouraria)
//   • heróis desbloqueados na Oca
//   • conquistas desbloqueadas
//   • níveis novos de Bestiário
//
// O selo some quando você ABRE a tela onde o item aparece e fica
// salvo no save (STORY_PROGRESS.vistos) — na próxima vez não aparece.
//
// NADA da lógica do jogo é alterada: este arquivo só observa as
// telas, coloca o selo e anota o que já foi visto.
// Para desligar tudo: window.A_SELO_NOVO_ATIVO = false
// ================================================================
(function seloNovoV1() {
    'use strict';
    if (window._seloNovoAtivo) return;
    window._seloNovoAtivo = true;
    if (window.A_SELO_NOVO_ATIVO === false) return;

    // ---------------------------------------------------------
    // 1) CSS do selo
    // ---------------------------------------------------------
    if (!document.getElementById('seloNovoCSS')) {
        const st = document.createElement('style');
        st.id = 'seloNovoCSS';
        st.textContent = `
        .selo-novo {
            position: absolute;
            top: -8px; right: -8px;
            z-index: 5;
            padding: 3px 8px;
            font-family: 'Cinzel', serif;
            font-size: .62rem;
            font-weight: 900;
            letter-spacing: .08em;
            color: #1a1208;
            background: linear-gradient(180deg, #ffe07a, #e8b923 55%, #c9a227);
            border: 1.5px solid #7a5f1a;
            border-radius: 999px;
            box-shadow: 0 0 12px rgba(232,185,35,.75), 0 2px 4px rgba(0,0,0,.5);
            pointer-events: none;
            animation: seloNovoPulsa 1.6s ease-in-out infinite;
            white-space: nowrap;
        }
        .selo-novo::before {
            content: '';
            position: absolute; inset: 0;
            border-radius: 999px;
            box-shadow: inset 0 0 8px rgba(255,255,255,.55);
        }
        @keyframes seloNovoPulsa {
            0%, 100% { transform: scale(1);    box-shadow: 0 0 10px rgba(232,185,35,.55), 0 2px 4px rgba(0,0,0,.5); }
            50%      { transform: scale(1.08); box-shadow: 0 0 18px rgba(255,224,122,.95), 0 2px 4px rgba(0,0,0,.5); }
        }
        /* o selo precisa de um pai posicionado */
        .tesouraria-item, .story-hero-card, .conq-card, .bestiary-card { position: relative; }
        /* tooltip do "memória de selos" no Perfil */
        .selo-novo-resumo {
            display:inline-flex; align-items:center; gap:6px;
            margin-top:8px; padding:4px 10px;
            font-family:'EB Garamond', serif; font-size:.8rem;
            color:#d9c89a; background:rgba(42,31,16,.75);
            border:1px solid #3d2d18; border-radius:999px;
        }
        `;
        document.head.appendChild(st);
    }

    // ---------------------------------------------------------
    // 2) A memória fica no SAVE (STORY_PROGRESS.vistos)
    // ---------------------------------------------------------
    function save() {
        if (typeof saveStoryProgress === 'function') {
            try { saveStoryProgress(); } catch (e) {}
        }
    }

    function getVistos() {
        if (typeof STORY_PROGRESS === 'undefined' || !STORY_PROGRESS) return null;
        if (!STORY_PROGRESS.vistos || typeof STORY_PROGRESS.vistos !== 'object') {
            STORY_PROGRESS.vistos = {};
        }
        const v = STORY_PROGRESS.vistos;
        if (!Array.isArray(v.itens))   v.itens = [];
        if (!Array.isArray(v.herois))  v.herois = [];
        if (!Array.isArray(v.conquistas)) v.conquistas = [];
        if (typeof v.bestiario !== 'object' || v.bestiario === null) v.bestiario = {};
        if (!Array.isArray(v.__migradoDe)) v.__migradoDe = [];
        return v;
    }

    // ---------------------------------------------------------
    // 3) Primeira vez no save: o que já existe NÃO ganha selo
    //    (senão o jogador antigo veria o jogo inteiro como "novo")
    // ---------------------------------------------------------
    function migrarUmaVez() {
        const v = getVistos();
        if (!v || v.__migradoDe.includes('v1')) return;
        try {
            if (typeof STORY_PROGRESS !== 'undefined' && STORY_PROGRESS) {
                Object.keys(STORY_PROGRESS.inventory || {}).forEach(id => {
                    if ((STORY_PROGRESS.inventory[id] || 0) > 0 && !v.itens.includes(id)) v.itens.push(id);
                });
                (STORY_PROGRESS.unlockedHeroesStory || []).forEach(h => {
                    if (!v.herois.includes(h)) v.herois.push(h);
                });
                Object.keys(STORY_PROGRESS.achievements || {}).forEach(id => {
                    if (!v.conquistas.includes(id)) v.conquistas.push(id);
                });
                // bestiário: marca o nível atual como visto
                const ids = (typeof STORY_PROGRESS.knowledge === 'object')
                    ? Object.keys(STORY_PROGRESS.knowledge || {}) : [];
                ids.forEach(id => { v.bestiario[id] = nivelBestiario(id); });
            }
        } catch (e) { /* sem save ainda: nada a migrar */ }
        v.__migradoDe.push('v1');
        save();
    }

    // ---------------------------------------------------------
    // 4) Ferramentas
    // ---------------------------------------------------------
    // O nível de conhecimento (bestiário) vem do save: STORY_PROGRESS.knowledge
    // (o getInfo do conhecimento.js é privado daquele arquivo)
    function nivelBestiario(id) {
        try {
            return (typeof STORY_PROGRESS !== 'undefined' && STORY_PROGRESS && STORY_PROGRESS.knowledge)
                ? (STORY_PROGRESS.knowledge[id] || 0) : 0;
        } catch (e) { return 0; }
    }

    // Lista de inimigos: vem do DOM do bestiário (o STORY_ENEMIES é uma
    // constante interna do historia.js, não fica em window).
    function idsDoBestiario() {
        const ids = new Set();
        document.querySelectorAll('.bestiary-card[data-enemy-id]').forEach(c => {
            const id = c.getAttribute('data-enemy-id');
            if (id) ids.add(id);
        });
        return [...ids];
    }

    // selos já mostrados nesta sessão: continuam na tela mesmo depois de
    // marcados como vistos (só somem na próxima visita)
    const jaMostrados = new Set();
    const chave = (tipo, id) => tipo + '::' + id;

    function ehNovo(tipo, id) {
        if (jaMostrados.has(chave(tipo, id))) return true;
        const v = getVistos();
        if (!v) return false;
        if (tipo === 'bestiario') {
            return nivelBestiario(id) > (v.bestiario[id] || 0);
        }
        return !v[tipo].includes(id);
    }

    // chamado quando o selo é realmente colocado na tela
    function anotarMostrado(tipo, id) {
        if (ehNovo(tipo, id)) jaMostrados.add(chave(tipo, id));
    }

    function marcarVisto(tipo, id) {
        const v = getVistos();
        if (!v) return false;
        if (tipo === 'bestiario') {
            const lvl = nivelBestiario(id);
            if (lvl <= (v.bestiario[id] || 0)) return false;
            v.bestiario[id] = lvl;
            return true;
        }
        if (v[tipo].includes(id)) return false;
        v[tipo].push(id);
        return true;
    }

    function criarSelo(texto) {
        const el = document.createElement('div');
        el.className = 'selo-novo';
        el.textContent = texto || 'NOVO';
        return el;
    }

    // quantos selos existem agora (para o resumo no Perfil)
    function contarPendentes() {
        const v = getVistos();
        if (!v) return 0;
        let n = 0;
        // itens no inventário
        Object.keys((typeof STORY_PROGRESS !== 'undefined' && STORY_PROGRESS.inventory) || {}).forEach(id => {
            if ((STORY_PROGRESS.inventory[id] || 0) > 0 && !v.itens.includes(id)) n++;
        });
        // heróis
        ((typeof STORY_PROGRESS !== 'undefined' && STORY_PROGRESS.unlockedHeroesStory) || []).forEach(h => {
            if (!v.herois.includes(h)) n++;
        });
        // conquistas
        Object.keys((typeof STORY_PROGRESS !== 'undefined' && STORY_PROGRESS.achievements) || {}).forEach(id => {
            if (!v.conquistas.includes(id)) n++;
        });
        // bestiário
        Object.keys((typeof STORY_PROGRESS !== 'undefined' && STORY_PROGRESS.knowledge) || {}).forEach(id => {
            if (nivelBestiario(id) > (v.bestiario[id] || 0)) n++;
        });
        return n;
    }

    // ---------------------------------------------------------
    // 5) TELAS — colocar o selo e, ao abrir, considerar visto
    // ---------------------------------------------------------
    const telas = {};

    // ---- 5.1 Tesouraria / inventário ----
    function aplicarSeloItens() {
        const v = getVistos();
        if (!v) return;
        document.querySelectorAll('.tesouraria-item').forEach(card => {
            const nomeEl = card.querySelector('.tesouraria-item-name');
            if (!nomeEl) return;
            const nome = nomeEl.textContent.trim();
            // acha o id pelo nome do material
            let matId = null;
            for (const id in (window.STORY_MATERIALS || {})) {
                if ((STORY_MATERIALS[id].name || '').trim() === nome) { matId = id; break; }
            }
            if (!matId) return;
            if (ehNovo('itens', matId) && !card.querySelector('.selo-novo')) {
                card.appendChild(criarSelo('NOVO'));
                anotarMostrado('itens', matId);
            }
        });
    }

    function marcarItensVistos() {
        const v = getVistos();
        if (!v) return false;
        let mudou = false;
        const inv = (typeof STORY_PROGRESS !== 'undefined' && STORY_PROGRESS.inventory) || {};
        document.querySelectorAll('.tesouraria-item').forEach(card => {
            const nomeEl = card.querySelector('.tesouraria-item-name');
            if (!nomeEl) return;
            const nome = nomeEl.textContent.trim();
            for (const id in (window.STORY_MATERIALS || {})) {
                if ((STORY_MATERIALS[id].name || '').trim() === nome && (inv[id] || 0) > 0) {
                    if (marcarVisto('itens', id)) mudou = true;
                }
            }
        });
        return mudou;
    }
    telas.itens = { aplicar: aplicarSeloItens, marcar: marcarItensVistos };

    // ---- 5.2 Heróis (Oca) ----
    function aplicarSeloHerois() {
        document.querySelectorAll('.story-hero-card').forEach(card => {
            if (card.classList.contains('locked')) return;
            const nomeEl = card.querySelector('.story-hero-name');
            if (!nomeEl) return;
            const nomeExibido = nomeEl.textContent.trim();
            // o nome exibido é o displayName; acha a classe correspondente
            let classe = null;
            for (const k in (window.STORY_HERO_CLASSES || {})) {
                if ((STORY_HERO_CLASSES[k].displayName || k).trim() === nomeExibido) { classe = k; break; }
            }
            if (!classe) return;
            if (ehNovo('herois', classe) && !card.querySelector('.selo-novo')) {
                card.appendChild(criarSelo('NOVO'));
                anotarMostrado('herois', classe);
            }
        });
    }

    function marcarHeroisVistos() {
        let mudou = false;
        document.querySelectorAll('.story-hero-card:not(.locked)').forEach(card => {
            const nomeEl = card.querySelector('.story-hero-name');
            if (!nomeEl) return;
            const nomeExibido = nomeEl.textContent.trim();
            for (const k in (window.STORY_HERO_CLASSES || {})) {
                if ((STORY_HERO_CLASSES[k].displayName || k).trim() === nomeExibido) {
                    if (marcarVisto('herois', k)) mudou = true;
                }
            }
        });
        return mudou;
    }
    telas.herois = { aplicar: aplicarSeloHerois, marcar: marcarHeroisVistos };

    // ---- 5.3 Conquistas ----
    function aplicarSeloConquistas() {
        document.querySelectorAll('.conq-card').forEach(card => {
            const nomeEl = card.querySelector('.conq-nome');
            if (!nomeEl) return;
            const nome = nomeEl.textContent.trim();
            if (!nome || nome === '???') return;
            const ach = (window.ACHIEVEMENTS || []).find(a => (a.nome || '').trim() === nome);
            if (!ach) return;
            if (ehNovo('conquistas', ach.id) && !card.querySelector('.selo-novo')) {
                card.appendChild(criarSelo('NOVA'));
                anotarMostrado('conquistas', ach.id);
            }
        });
    }

    function marcarConquistasVistas() {
        let mudou = false;
        document.querySelectorAll('.conq-card').forEach(card => {
            const nomeEl = card.querySelector('.conq-nome');
            if (!nomeEl) return;
            const nome = nomeEl.textContent.trim();
            const ach = (window.ACHIEVEMENTS || []).find(a => (a.nome || '').trim() === nome);
            if (ach && (window.isAchievementUnlocked && window.isAchievementUnlocked(ach.id))) {
                if (marcarVisto('conquistas', ach.id)) mudou = true;
            }
        });
        return mudou;
    }
    telas.conquistas = { aplicar: aplicarSeloConquistas, marcar: marcarConquistasVistas };

    // ---- 5.4 Bestiário ----
    function aplicarSeloBestiario() {
        document.querySelectorAll('.bestiary-card.unlocked[data-enemy-id]').forEach(card => {
            const id = card.getAttribute('data-enemy-id');
            if (!id) return;
            // o selo do nível (📖 Nível X / 🧠 DOMINADO) já existe; aqui é o "NOVO" do nível novo
            const badgeNivel = card.querySelector('.conhecimento-nivel-badge');
            if (badgeNivel && ehNovo('bestiario', id)) {
                if (!badgeNivel.querySelector('.selo-novo')) {
                    const s = criarSelo('NOVO');
                    s.style.position = 'static';
                    s.style.marginLeft = '6px';
                    s.style.fontSize = '.55rem';
                    s.style.animation = 'seloNovoPulsa 1.6s ease-in-out infinite';
                    badgeNivel.appendChild(s);
                    anotarMostrado('bestiario', id);
                }
            }
        });
    }

    function marcarBestiarioVisto() {
        let mudou = false;
        document.querySelectorAll('.bestiary-card.unlocked[data-enemy-id]').forEach(card => {
            const id = card.getAttribute('data-enemy-id');
            if (id && marcarVisto('bestiario', id)) mudou = true;
        });
        return mudou;
    }
    telas.bestiario = { aplicar: aplicarSeloBestiario, marcar: marcarBestiarioVisto };

    // ---------------------------------------------------------
    // 6) Descobrir qual tela está aberta e agir
    // ---------------------------------------------------------
    function detectarTela() {
        const screen = document.getElementById('storyScreen');
        if (!screen || !screen.classList.contains('active')) return null;
        const t = (screen.querySelector('.story-title')?.textContent || '').toUpperCase();

        // Bestiário: o título tem "️BESTIÁRIO" com um caractere invisível
        // (U+FE0F) grudado no emoji do livro, então comparar o texto
        // exato falha. Os cards são a prova mais confiável.
        if (screen.querySelector('.bestiary-card[data-enemy-id]')) return 'bestiario';
        if (screen.querySelector('.conq-card')) return 'conquistas';
        if (screen.querySelector('.story-hero-card')) return 'herois';
        if (screen.querySelector('.tesouraria-item')) return 'itens';

        if (t.includes('TESOURARIA')) return 'itens';
        if (t.includes('OCA')) return 'herois';
        if (t.includes('CONQUISTAS')) return 'conquistas';
        if (t.replace(/[^A-ZÁÉÍÓÚÂÊÔÃÕÇ]/g, '').includes('BESTIARIO')) return 'bestiario';
        return null;
    }

    function processarTela() {
        const nome = detectarTela();
        if (!nome) return;
        const tela = telas[nome];
        if (!tela) return;
        // 1) coloca os selos (para o jogador VER o que é novo agora)
        tela.aplicar();
        // 2) só marca como visto DEPOIS de um tempinho, para o selo
        //    aparecer pelo menos uma vez nesta visita
        setTimeout(() => {
            if (tela.marcar()) save();
        }, 1200);
    }

    // roda quando a #storyScreen muda (todo render do jogo troca o innerHTML)
    const observer = new MutationObserver((mutacoes) => {
        for (const m of mutacoes) {
            if (m.type === 'childList' && m.addedNodes.length) {
                clearTimeout(window._seloNovoTimer);
                window._seloNovoTimer = setTimeout(processarTela, 60);
                return;
            }
        }
    });
    const iniciar = () => {
        const screen = document.getElementById('storyScreen');
        if (!screen) { setTimeout(iniciar, 500); return; }
        observer.observe(screen, { childList: true, subtree: false, attributes: true, attributeFilter: ['class', 'style'] });
        processarTela();
    };
    iniciar();

    // ---------------------------------------------------------
    // 7) Resumo no Perfil do jogador (quantas novidades)
    // ---------------------------------------------------------
    const observerPerfil = new MutationObserver(() => {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;
        const t = (screen.querySelector('.story-title')?.textContent || '').toUpperCase();
        if (!t.includes('PERFIL')) return;
        if (screen.querySelector('.selo-novo-resumo')) return;
        const n = contarPendentes();
        if (!n) return;
        const box = document.createElement('div');
        box.className = 'selo-novo-resumo';
        box.innerHTML = '🆕 ' + n + ' novidade' + (n > 1 ? 's' : '') + ' para ver';
        const header = screen.querySelector('.story-header') || screen.firstElementChild;
        if (header) header.appendChild(box);
    });
    iniciarPerfil();
    function iniciarPerfil() {
        const screen = document.getElementById('storyScreen');
        if (!screen) { setTimeout(iniciarPerfil, 500); return; }
        observerPerfil.observe(screen, { childList: true, subtree: false });
    }

    // ---------------------------------------------------------
    // 8) API manual (console) — útil para testar
    // ---------------------------------------------------------
    const api = {};
    function apiDefine(nome, fn) {
        try {
            Object.defineProperty(api, nome, {
                value: fn, writable: true, enumerable: true, configurable: true
            });
        } catch (e) {
            api[nome] = fn;
        }
    }
    apiDefine('pendentes', contarPendentes);
    apiDefine('estado', getVistos);
    apiDefine('verificar', processarTela);
    apiDefine('telas', telas);
    // testa a aplicação sem depender do observador
    apiDefine('debug', function (tipo) {
        const tela = telas[tipo || 'bestiario'];
        if (!tela) return -1;
        tela.aplicar();
        return document.querySelectorAll('.selo-novo').length;
    });
    apiDefine('esquecerTudo', function () {
        const v = getVistos();
        if (!v) return;
        v.itens = []; v.herois = []; v.conquistas = []; v.bestiario = {};
        v.__migradoDe = ['v1'];
        save();
        console.log('[selo-novo] tudo marcado como novo de novo.');
    });
    window.seloNovo = api;

    // garante que a memória existe no save atual
    migrarUmaVez();
    console.log('[selo-novo] ativo.');
})();
