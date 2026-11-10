// ================================================================
// ↩️ BOTÃO VOLTAR DO CELULAR + NAVEGAÇÃO ENTRE TELAS — V1.0
// ----------------------------------------------------------------
// O QUE FAZ:
//   1) O botão voltar do aparelho (Android / gesto do iPhone) volta
//      para a TELA ANTERIOR do jogo, em vez de sair do jogo.
//   2) Corrige os botões "← VOLTAR" que estavam indo direto para a
//      Aldeia quando deviam voltar um passo (ex.: Conquistas → Perfil,
//      Bestiário/Ajuda abertos de dentro do Perfil).
//
// COMO FUNCIONA:
//   Cada tela do jogo vira um "passo" no histórico do navegador.
//   A Aldeia é o passo zero: nela, o botão voltar sai do jogo (normal).
//
// ⚠️ NÃO altera a lógica do jogo: só observa a tela que apareceu.
// ================================================================
(function navegacaoVoltarV1() {
    'use strict';
    if (window._navegacaoVoltarAtivo) return;
    window._navegacaoVoltarAtivo = true;

    // ---------------------------------------------------------
    // 1) Catálogo: nome da tela → como desenhar de novo
    // ---------------------------------------------------------
    const TELAS = {
        aldeia:      { fn: 'renderAldeiaScreen',       titulo: /ALDEIA/i },
        atos:        { fn: 'renderAtosScreen',         titulo: /ATOS/i },
        oca:         { fn: 'renderOcaScreenFiltered',  titulo: /OCA/i },
        loja:        { fn: 'renderLojaScreenCompleta', titulo: /CURANDEIRO|MERCADOR|REGATÃO|ESCAMBO|LOJA/i },
        ritual:      { fn: 'renderRitualScreen',       titulo: /RITUAL/i },
        bestiario:   { fn: 'renderBestiaryScreen',     titulo: /BESTI/i },
        tesouraria:  { fn: 'renderTesourariaScreen',   titulo: /TESOURARIA/i },
        eventos:     { fn: 'renderEventosHubScreen',   titulo: /EVENTOS/i },
        nacoes:      { fn: 'renderSeteNacoesScreen',   titulo: /SETE NA/i },
        conquistas:  { fn: 'renderConquistasScreen',   titulo: /CONQUISTAS/i },
        perfil:      { fn: '_abrirTelaPerfilV3',       titulo: /PERFIL/i },
        ajuda:       { fn: 'renderAjudaScreen',        titulo: /PERFIL E AJUDA/i },
        coop:        { fn: 'coopAbrirPainel',          titulo: /COOP/i },
        pvp:         { fn: 'pvpAbrirPainel',           titulo: /PVP/i },
        raidMenu:    { fn: 'raidSoloOpenMenu',         titulo: /RAIDS?$|PREPARAR RAID/i },
    };

    // tela → tela de cima (usada quando o botão "voltar" da tela está errado)
    const PAI = {
        conquistas: 'perfil',
        ajuda: 'perfil',
        perfil: 'aldeia',
        bestiario: 'aldeia',
        ritual: 'aldeia',
        tesouraria: 'aldeia',
        oca: 'aldeia',
        atos: 'aldeia',
        loja: 'aldeia',
        eventos: 'aldeia',
        nacoes: 'eventos',
        coop: 'aldeia',
        pvp: 'aldeia',
        raidMenu: 'eventos',
        aldeia: null,
    };

    function chamar(nomeTela) {
        const cfg = TELAS[nomeTela];
        if (!cfg) return false;
        const fn = window[cfg.fn];
        if (typeof fn !== 'function') return false;
        try { fn(); return true; } catch (e) {
            console.warn('[voltar] falhou ao abrir', nomeTela, e);
            return false;
        }
    }

    // ---------------------------------------------------------
    // 2) Descobrir em que tela o jogo está
    // ---------------------------------------------------------
    let telaAtual = 'aldeia';

    function detectarTela() {
        const screen = document.getElementById('storyScreen');
        if (!screen || !screen.classList.contains('active')) return null;
        const titulo = (screen.querySelector('.story-title')?.textContent || '').toUpperCase();
        if (!titulo.trim()) return null;

        // ordem importa: o mais específico primeiro
        if (/PERFIL E AJUDA/.test(titulo)) return 'ajuda';
        if (/CONQUISTAS/.test(titulo)) return 'conquistas';
        if (/PERFIL/.test(titulo)) return 'perfil';
        if (/TESOURARIA/.test(titulo)) return 'tesouraria';
        if (/RITUAL/.test(titulo)) return 'ritual';
        if (/BESTI/.test(titulo)) return 'bestiario';
        if (/SETE NA/.test(titulo)) return 'nacoes';
        if (/^.*EVENTOS$/.test(titulo.trim()) && !/SEMANA/.test(titulo)) return 'eventos';
        if (/CURANDEIRO|MERCADOR|REGAT|ESCAMBO|LOJA/.test(titulo)) return 'loja';
        if (/OCA/.test(titulo)) return 'oca';
        if (/ATOS/.test(titulo)) return 'atos';
        if (/COOP/.test(titulo)) return 'coop';
        if (/PVP/.test(titulo)) return 'pvp';
        if (/ALDEIA/.test(titulo)) return 'aldeia';
        return null;
    }

    // ---------------------------------------------------------
    // 3) Pilha de navegação + histórico do navegador
    // ---------------------------------------------------------
    const pilha = ['aldeia'];
    let suprimir = 0;   // quantas mudanças de tela ignorar (o voltar desenha 1..3 telas)

    function registrar(nomeTela, { voltando = false } = {}) {
        if (!nomeTela) return;

        // voltar para uma tela que já está na pilha = desempilha até ela
        // (evita "Aldeia, Conquistas" quando a pilha era "Aldeia, Perfil")
        if (!voltando) {
            const idx = pilha.lastIndexOf(nomeTela);
            if (idx >= 0 && idx < pilha.length - 1) {
                pilha.length = idx + 1;
                return;
            }
        }

        if (nomeTela === pilha[pilha.length - 1] && !voltando) return;

        if (voltando) {
            // já voltamos de fato: só acerta a pilha
            if (pilha[pilha.length - 1] !== nomeTela) {
                const idx = pilha.lastIndexOf(nomeTela);
                if (idx >= 0) pilha.length = idx + 1;
                else pilha.push(nomeTela);
            }
            return;
        }

        pilha.push(nomeTela);
        // guarda mais um passo no histórico do navegador
        try {
            history.pushState({ tela: nomeTela, passo: pilha.length }, '', location.href);
        } catch (e) { /* file:// em alguns navegadores bloqueia; segue sem */ }
    }

    // o botão voltar do aparelho dispara popstate
    window.addEventListener('popstate', (ev) => {
        // na Aldeia, deixa o navegador seguir o caminho dele (sai do jogo)
        if (pilha.length <= 1) return;

        const anterior = pilha[pilha.length - 2] || 'aldeia';
        pilha.pop();
        // o "voltar" pode desenhar 1 tela (ou 2: Aldeia + tela), com atrasos
        suprimir = 3;
        setTimeout(() => { suprimir = 0; }, 1200);
        if (!chamar(anterior)) {
            // fallback: Aldeia
            if (typeof window.renderAldeiaScreen === 'function') window.renderAldeiaScreen();
        }
    });

    // ---------------------------------------------------------
    // 4) Observa a tela que o jogo monta
    // ---------------------------------------------------------
    function iniciar() {
        const screen = document.getElementById('storyScreen');
        if (!screen) { setTimeout(iniciar, 500); return; }

        const observer = new MutationObserver(() => {
            const tela = detectarTela();
            if (!tela) return;
            telaAtual = tela;
            if (suprimir > 0) { suprimir--; return; }   // quem agiu foi o voltar
            registrar(tela);
        });
        observer.observe(screen, { childList: true, subtree: false });

        // estado inicial
        try { history.replaceState({ tela: 'aldeia', passo: 0 }, '', location.href); } catch (e) {}
        registrar('aldeia', { voltando: true });
    }
    iniciar();

    // ---------------------------------------------------------
    // 5) Corrige os botões "← VOLTAR" que pulam telas
    //    (Conquistas/Ajuda abertos de dentro do Perfil iam para a Aldeia)
    // ---------------------------------------------------------
    const _paiOriginal = window._conqVoltarPerfil;
    window._conqVoltarPerfil = function () {
        // se o Perfil está a um passo atrás, volta para ele
        const idx = pilha.lastIndexOf('perfil');
        if (idx >= 0 && idx === pilha.length - 2 && typeof window._abrirTelaPerfilV3 === 'function') {
            window._abrirTelaPerfilV3();
            return;
        }
        if (typeof _paiOriginal === 'function') return _paiOriginal.apply(this, arguments);
        if (typeof window._abrirTelaPerfilV3 === 'function') return window._abrirTelaPerfilV3();
        if (typeof window.renderAldeiaScreen === 'function') return window.renderAldeiaScreen();
    };

    // o botão "VOLTAR À ALDEIA" da Ajuda, quando aberta do Perfil
    document.addEventListener('click', (e) => {
        const btn = e.target && e.target.closest && e.target.closest('.story-back-btn');
        if (!btn) return;
        const txt = (btn.textContent || '').toUpperCase();
        const acao = btn.getAttribute('onclick') || '';
        if (!txt.includes('VOLTAR')) return;

        const telaAgora = detectarTela();
        if (!telaAgora) return;
        const pai = PAI[telaAgora];
        const vaiPraAldeia = acao.includes('renderAldeiaScreen');
        if (!vaiPraAldeia) return;

        // se o pai verdadeiro não é a Aldeia e ele está na pilha, volta pra ele
        if (pai && pai !== 'aldeia') {
            const idx = pilha.lastIndexOf(pai);
            if (idx >= 0 && idx === pilha.length - 2) {
                e.preventDefault();
                e.stopImmediatePropagation();
                suprimir = 3;
                setTimeout(() => { suprimir = 0; }, 1200);
                pilha.pop();
                chamar(pai);
            }
        }
    }, true);

    // ---------------------------------------------------------
    // 6) API para o console (testar)
    // ---------------------------------------------------------
    window.voltarJogo = {
        pilha: () => pilha.slice(),
        tela: () => detectarTela(),
        voltar() { history.back(); },
        irPara(nome) { chamar(nome); }
    };

    console.log('[voltar] navegação ativa — o botão voltar do aparelho volta uma tela por vez.');
})();
