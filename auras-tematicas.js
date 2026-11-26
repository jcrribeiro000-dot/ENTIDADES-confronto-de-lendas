/* =================================================================
 * auras-tematicas.js — V205 + V206
 * -----------------------------------------------------------------
 * • Aura = ITEM: resgatada na semana temática e aplicada em UM herói
 *   nível 11, por escolha do jogador. Nunca automática, nunca expira.
 * • 18 efeitos CSS próprios (forma + cor + vibração), não só troca de cor.
 * • Não edita historia-sistemas.js: embrulha os 4 pontos de render da
 *   aura clássica e troca .lv11-glow pela classe temática quando aplicada.
 * • Sem aura aplicada => aura clássica original intacta.
 * ================================================================= */
(function () {
    'use strict';
    if (window._aurasTematicasV205) return;
    window._aurasTematicasV205 = true;

    const TEMAS = (typeof window.TEMAS_CALENDARIO === 'object') ? window.TEMAS_CALENDARIO : [];
    const IDS = TEMAS.map(t => t.aura);
    const VEL = {};
    TEMAS.forEach(t => { VEL[t.aura] = t.vel || '1.2s'; });

    const CSS = `
    <style id="aurasTematicasCSS">
      .aura-tema{position:relative}
      .aura-tema::before,.aura-tema::after{content:'';position:absolute;inset:-4px;pointer-events:none;border-radius:inherit}

      /* 01 — Ano Novo: faíscas douradas explodindo para cima */
      .aura--luzes_ano_novo{animation:auraAnoNovo var(--aura-vel) infinite alternate}
      .aura--luzes_ano_novo::before{box-shadow:0 -12px 0 #f6d365,9px -7px 0 #fff,10px 2px 0 #ffb300,-8px -6px 0 #fff;animation:faiscaSubir var(--aura-vel) infinite ease-out}
      @keyframes auraAnoNovo{from{filter:drop-shadow(0 0 5px #f6d365)}to{filter:drop-shadow(0 0 18px #fff) drop-shadow(0 0 28px #f6d365)}}
      @keyframes faiscaSubir{from{transform:translateY(6px);opacity:.3}to{transform:translateY(-7px);opacity:1}}

      /* 02 — Carnaval: confete em espiral */
      .aura--carnaval_colorido{animation:auraCarnaval var(--aura-vel) infinite alternate}
      .aura--carnaval_colorido::before{box-shadow:0 -10px 0 #ff5fa2,8px -5px 0 #38e8d0,-8px -4px 0 #ffdf00,7px 4px 0 #7c4dff;animation:confeteGirar var(--aura-vel) infinite linear}
      @keyframes auraCarnaval{from{filter:drop-shadow(0 0 5px #ff5fa2)}to{filter:drop-shadow(0 0 16px #38e8d0)}}
      @keyframes confeteGirar{from{transform:rotate(0) translateY(5px)}to{transform:rotate(360deg) translateY(-5px)}}

      /* 03 — Dia da Mulher: onda suave + pétalas */
      .aura--iara_aguas{animation:auraIara var(--aura-vel) infinite alternate}
      .aura--iara_aguas::before{border:2px solid #7ad7f0;border-radius:50%;animation:ondaAgua var(--aura-vel) infinite ease-out}
      @keyframes auraIara{from{filter:drop-shadow(0 0 5px #7ad7f0)}to{filter:drop-shadow(0 0 17px #ffc0d9)}}
      @keyframes ondaAgua{from{transform:scale(.82);opacity:.9}to{transform:scale(1.28);opacity:0}}

      /* 04 — Dia da Água: dois anéis concêntricos, pulso lento */
      .aura--iara_ondas{animation:auraIara var(--aura-vel) infinite alternate}
      .aura--iara_ondas::before,.aura--iara_ondas::after{border:2px solid #4fc3f7;border-radius:50%;animation:ondaAgua var(--aura-vel) infinite ease-out}
      .aura--iara_ondas::after{animation-delay:calc(var(--aura-vel) / 2)}

      /* 05 — Páscoa: brilho pastel flutuando */
      .aura--luz_pascal{animation:auraPascal var(--aura-vel) infinite alternate}
      .aura--luz_pascal::before{box-shadow:0 -9px 0 #f7d6a0,9px 0 0 #f8bbd0,-8px 2px 0 #fff;animation:flutuar var(--aura-vel) infinite ease-in-out}
      @keyframes auraPascal{from{filter:drop-shadow(0 0 4px #f7d6a0)}to{filter:drop-shadow(0 0 15px #f8bbd0)}}
      @keyframes flutuar{0%,100%{transform:translateY(3px);opacity:.55}50%{transform:translateY(-5px);opacity:1}}

      /* 06 — Raízes e Liberdade: raios verdes nascendo do solo */
      .aura--guardiao_nacoes{animation:auraGuardiao var(--aura-vel) infinite alternate}
      .aura--guardiao_nacoes::before{inset:auto -6px -10px -6px;height:42%;background:repeating-linear-gradient(90deg,transparent 0 8px,#66bb6a 8px 10px,transparent 10px 17px);animation:raiosSolo var(--aura-vel) infinite alternate}
      @keyframes auraGuardiao{from{filter:drop-shadow(0 0 5px #66bb6a)}to{filter:drop-shadow(0 0 16px #ffd54f)}}
      @keyframes raiosSolo{from{transform:scaleY(.45);opacity:.45}to{transform:scaleY(1.15);opacity:1}}

      /* 07 — Dia das Mães: corações subindo */
      .aura--coracao_mae{animation:auraMae var(--aura-vel) infinite alternate}
      .aura--coracao_mae::before{content:'💗';inset:auto;font-size:15px;text-align:center;animation:coracaoSubir var(--aura-vel) infinite ease-out}
      @keyframes auraMae{from{filter:drop-shadow(0 0 5px #ff8fa3)}to{filter:drop-shadow(0 0 17px #ffd6a5)}}
      @keyframes coracaoSubir{from{transform:translateY(7px);opacity:.2}to{transform:translateY(-9px);opacity:1}}

      /* 08 — Curupira: folha girando + brasas */
      .aura--curupira_mata{animation:auraCurupira var(--aura-vel) infinite alternate}
      .aura--curupira_mata::before{content:'🍃';inset:auto;font-size:16px;text-align:center;animation:folhaGirar var(--aura-vel) infinite linear}
      .aura--curupira_mata::after{box-shadow:0 8px 0 #ff7043,6px 5px 0 #ff8c1a,-6px 5px 0 #ffb300;animation:brasa .7s infinite alternate}
      @keyframes auraCurupira{from{filter:drop-shadow(0 0 5px #2e7d32)}to{filter:drop-shadow(0 0 15px #ff7043)}}
      @keyframes folhaGirar{from{transform:rotate(0) translateY(-4px)}to{transform:rotate(360deg) translateY(4px)}}
      @keyframes brasa{from{opacity:.35}to{opacity:1}}

      /* 09 — Namorados: batimento cardíaco duplo */
      .aura--coracao_iara{animation:batimento var(--aura-vel) infinite}
      .aura--coracao_iara::before{content:'💘';inset:auto;font-size:15px;text-align:center;animation:batimento var(--aura-vel) infinite}
      @keyframes batimento{0%{filter:drop-shadow(0 0 4px #ff5e8a)}28%{filter:drop-shadow(0 0 14px #ffc1d9)}45%{filter:drop-shadow(0 0 6px #ff5e8a)}70%{filter:drop-shadow(0 0 13px #ffc1d9)}100%{filter:drop-shadow(0 0 5px #ff5e8a)}}

      /* 10 — São João: chama tremendo */
      .aura--fogo_sao_joao{animation:auraFogo var(--aura-vel) infinite alternate}
      .aura--fogo_sao_joao::before{content:'🔥';inset:auto;font-size:16px;text-align:center;animation:chamaFlicker .45s infinite alternate}
      @keyframes auraFogo{from{filter:drop-shadow(0 0 5px #ff8c1a)}to{filter:drop-shadow(0 0 20px #ffe066)}}
      @keyframes chamaFlicker{from{transform:translateY(3px) scale(.92)}to{transform:translateY(-4px) scale(1.08)}}

      /* 11 — Boitatá: serpente de fogo azul correndo */
      .aura--boitata_inverno{animation:auraBoitata var(--aura-vel) infinite alternate}
      .aura--boitata_inverno::before{border:3px solid #26c6da;border-left-color:transparent;border-top-color:transparent;border-radius:50%;animation:serpente 1.1s linear infinite}
      @keyframes auraBoitata{from{filter:drop-shadow(0 0 5px #26c6da)}to{filter:drop-shadow(0 0 18px #66bb6a)}}
      @keyframes serpente{from{transform:rotate(0)}to{transform:rotate(360deg)}}

      /* 12 — Dia dos Pais: anel de escudo firme */
      .aura--escudo_pai{animation:auraEscudo var(--aura-vel) infinite alternate}
      .aura--escudo_pai::before{border:2px solid #e6b325;border-radius:50%;animation:escudo var(--aura-vel) infinite alternate}
      @keyframes auraEscudo{from{filter:drop-shadow(0 0 5px #e6b325)}to{filter:drop-shadow(0 0 14px #fff3b0)}}
      @keyframes escudo{from{transform:scale(.9);opacity:.5}to{transform:scale(1.15);opacity:1}}

      /* 13 — Folclore: redemoinho roxo irregular */
      .aura--anhanga_folclore{animation:auraAnhanga var(--aura-vel) infinite alternate}
      .aura--anhanga_folclore::before{content:'👹';inset:auto;font-size:15px;text-align:center;animation:girarLento .9s infinite alternate}
      @keyframes auraAnhanga{from{filter:drop-shadow(0 0 5px #8e5bd0)}to{filter:drop-shadow(0 0 18px #69f0ae)}}
      @keyframes girarLento{from{transform:rotate(-12deg) scale(.94)}to{transform:rotate(12deg) scale(1.08)}}

      /* 14 — Independência: raios verde/amarelo girando */
      .aura--verde_amarela{animation:auraIndependencia var(--aura-vel) infinite alternate}
      .aura--verde_amarela::before{background:repeating-conic-gradient(#2e9e4f 0 14deg,#ffdf00 14deg 28deg);border-radius:50%;opacity:.32;animation:raiosGirar 2.4s linear infinite}
      @keyframes auraIndependencia{from{filter:drop-shadow(0 0 5px #2e9e4f)}to{filter:drop-shadow(0 0 18px #ffdf00)}}
      @keyframes raiosGirar{from{transform:rotate(0)}to{transform:rotate(360deg)}}

      /* 15 — Crianças: bolhas coloridas subindo */
      .aura--bolhas_anhanga{animation:auraCriancas var(--aura-vel) infinite alternate}
      .aura--bolhas_anhanga::before{box-shadow:0 -8px 0 #ff7043,8px -2px 0 #40c4ff,-7px 1px 0 #ffdf00,4px 7px 0 #69f0ae;animation:bolhasSubir var(--aura-vel) infinite ease-out}
      @keyframes auraCriancas{from{filter:drop-shadow(0 0 5px #ff7043)}to{filter:drop-shadow(0 0 15px #40c4ff)}}
      @keyframes bolhasSubir{from{transform:translateY(6px);opacity:.25}to{transform:translateY(-8px);opacity:1}}

      /* 16 — Saci: redemoinho rodopiante */
      .aura--saci_vermelho{animation:auraSaci var(--aura-vel) infinite alternate}
      .aura--saci_vermelho::before{border:3px dashed #d32f2f;border-radius:50%;animation:rodopio .6s linear infinite}
      @keyframes auraSaci{from{filter:drop-shadow(0 0 5px #d32f2f)}to{filter:drop-shadow(0 0 18px #ff5252)}}
      @keyframes rodopio{from{transform:rotate(0) scale(.95)}to{transform:rotate(360deg) scale(1.05)}}

      /* 17 — Sumé: anéis concêntricos graves */
      .aura--sume_ancestral{animation:auraSume var(--aura-vel) infinite alternate}
      .aura--sume_ancestral::before{border:2px solid #d4af37;border-radius:50%;animation:aneco var(--aura-vel) infinite ease-out}
      .aura--sume_ancestral::after{border:1px solid #fff8e1;border-radius:50%;animation:aneco var(--aura-vel) infinite ease-out;animation-delay:calc(var(--aura-vel) / 2)}
      @keyframes auraSume{from{filter:drop-shadow(0 0 6px #d4af37)}to{filter:drop-shadow(0 0 20px #fff8e1)}}
      @keyframes aneco{from{transform:scale(.72);opacity:.95}to{transform:scale(1.35);opacity:0}}

      /* 18 — Natal: luzes piscando em cascata */
      .aura--luzes_natal{animation:auraNatal var(--aura-vel) infinite alternate}
      .aura--luzes_natal::before{box-shadow:0 -10px 0 #e53935,9px -5px 0 #43a047,-8px -4px 0 #ffd54f,7px 4px 0 #e53935,-7px 3px 0 #43a047;animation:piscarNatal 1.1s infinite steps(1)}
      @keyframes auraNatal{from{filter:drop-shadow(0 0 5px #e53935)}to{filter:drop-shadow(0 0 18px #43a047)}}
      @keyframes piscarNatal{0%,49%{opacity:.25}50%,100%{opacity:1}}

      .aura-select-v206{max-width:100%;background:#151a2e;color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:8px;padding:5px 7px;font-size:11px}
      .aura-linha-v206{display:flex;gap:6px;align-items:center;justify-content:space-between;margin:6px 0;font-size:11px}
      .aura-btn-v206{border:0;border-radius:9px;padding:6px 9px;font-weight:800;font-size:10px;cursor:pointer;background:linear-gradient(135deg,#7c4dff,#00e5ff);color:#fff}
      .aura-btn-v206.remover{background:rgba(255,255,255,.12)}
      @media(prefers-reduced-motion:reduce){.aura-tema,.aura-tema::before,.aura-tema::after{animation-duration:.01ms!important;animation-iteration-count:1!important}}
    </style>`;

    function injetarCSS() {
        if (!document.getElementById('aurasTematicasCSS')) document.head.insertAdjacentHTML('beforeend', CSS);
    }

    function garantirAuras() {
        if (typeof window.calendarioGarantir !== 'function') return null;
        const c = window.calendarioGarantir();
        if (!c) return null;
        if (!Array.isArray(c.auras)) c.auras = [];
        return c;
    }

    function salvar() {
        try { if (typeof saveStoryProgress === 'function') saveStoryProgress(); } catch (e) {}
    }
    function som(nome) {
        try { if (typeof playSfx === 'function') playSfx(nome || 'purificacao'); } catch (e) {}
    }
    function aviso(titulo, texto, icone) {
        try { if (typeof showToast === 'function') showToast(titulo, texto, icone || '✨'); } catch (e) {}
    }

    function isLvl11(heroClass) {
        if (!heroClass) return false;
        try {
            if (typeof getHeroLevel === 'function') return getHeroLevel(heroClass) >= 11;
        } catch (e) {}
        const niveis = (typeof STORY_PROGRESS !== 'undefined' && STORY_PROGRESS.heroLevels) || {};
        return (niveis[heroClass] || 0) >= 11;
    }

    function getAuraAplicada(heroClass) {
        const c = garantirAuras();
        if (!c || !heroClass) return null;
        const item = c.auras.find(a => a.aplicadaEmHeroi === heroClass);
        return item ? item.id : null;
    }
    window.getAuraAplicada = getAuraAplicada;

    function heroisLv11() {
        const niveis = (typeof STORY_PROGRESS !== 'undefined' && STORY_PROGRESS.heroLevels) || {};
        return Object.keys(niveis).filter(h => isLvl11(h));
    }

    // ─────────────────────────────────────────────────────────────
    // RESGATE / APLICAÇÃO / REMOÇÃO
    // ─────────────────────────────────────────────────────────────
    window.aurasResgatar = function (temaId) {
        const tema = (typeof window.getTemaById === 'function') ? window.getTemaById(temaId) : null;
        const c = garantirAuras();
        if (!tema || !c) return false;
        if (!c.auras.some(a => a.id === tema.aura)) {
            c.auras.push({ id: tema.aura, temaId: tema.id, nome: tema.nome, icone: tema.icone, obtidaEm: Date.now(), aplicadaEmHeroi: null });
            salvar();
            som(tema.som);
            aviso('✨ AURA RESGATADA', tema.nome + ' — aplicável em herói nível 11', tema.icone);
        }
        reaplicarTudo();
        return true;
    };

    async function aplicar(auraId, heroId) {
        const c = garantirAuras();
        if (!c) return false;
        const item = c.auras.find(a => a.id === auraId);
        if (!item || !heroId || !isLvl11(heroId)) {
            aviso('✨ AURA', 'Escolha um herói nível 11.', '⚠️');
            return false;
        }
        const substitui = c.auras.some(a => a.aplicadaEmHeroi === heroId && a.id !== auraId);
        if (substitui && typeof window.uiConfirm === 'function') {
            const anterior = c.auras.find(a => a.aplicadaEmHeroi === heroId);
            const sim = await window.uiConfirm('A aura "' + (anterior ? anterior.nome : 'atual') + '" será substituída por "' + item.nome + '" no herói ' + heroId + '. Deseja continuar?', {
                titulo: 'Substituir aura temática', ok: 'Substituir', cancelar: 'Cancelar',
            });
            if (!sim) return false;
        }
        c.auras.forEach(a => { if (a.aplicadaEmHeroi === heroId) a.aplicadaEmHeroi = null; });
        item.aplicadaEmHeroi = heroId;
        salvar();
        som('purificacao');
        aviso('✨ AURA APLICADA', item.nome + ' → ' + heroId, item.icone || '✨');
        reaplicarTudo();
        if (typeof window.calendarioRenderizar === 'function') window.calendarioRenderizar();
        return true;
    }
    window.aurasAplicar = aplicar;

    function remover(auraId) {
        const c = garantirAuras();
        if (!c) return false;
        const item = c.auras.find(a => a.id === auraId);
        if (!item || !item.aplicadaEmHeroi) return false;
        item.aplicadaEmHeroi = null;
        salvar();
        som('click');
        reaplicarTudo();
        if (typeof window.calendarioRenderizar === 'function') window.calendarioRenderizar();
        return true;
    }
    window.aurasRemover = remover;

    // ─────────────────────────────────────────────────────────────
    // RENDER — substitui .lv11-glow quando há aura aplicada
    // ─────────────────────────────────────────────────────────────
    function aplicarClasse(el, heroClass, tokenEl) {
        if (!el) return;
        IDS.forEach(id => el.classList.remove('aura--' + id));
        el.classList.remove('aura-tema');
        const auraId = getAuraAplicada(heroClass);
        if (auraId) {
            // A regra antiga usa animation: ... !important; sem remover a classe
            // a aura clássica sempre venceria a temática.
            el.classList.remove('lv11-glow');
            el.classList.add('aura-tema', 'aura--' + auraId);
            el.style.setProperty('--aura-vel', VEL[auraId] || '1.2s');
            if (tokenEl) {
                tokenEl.classList.remove('lv11-rays');
                const bolts = tokenEl.querySelector ? tokenEl.querySelector('.lv11-bolts') : null;
                if (bolts && bolts.remove) bolts.remove();
            }
        } else if (isLvl11(heroClass)) {
            el.classList.add('lv11-glow');
        }
    }

    function aplicarTabuleiro() {
        if (typeof players === 'undefined' || !Array.isArray(players)) return;
        players.forEach(p => {
            if (!p || p.dead) return;
            aplicarClasse(document.getElementById('imgP' + p.id), p.class, document.getElementById('tokenP' + p.id));
        });
        document.querySelectorAll('.hero-status-sprite').forEach((img, i) => {
            if (players[i]) aplicarClasse(img, players[i].class);
        });
    }

    function aplicarOca() {
        document.querySelectorAll('.story-hero-card').forEach(card => {
            if (card.classList.contains('locked')) return;
            const attr = card.getAttribute('onclick') || '';
            const m = attr.match(/toggleHeroSelection\('((?:\\'|[^'])*)'\)/);
            if (!m) return;
            aplicarClasse(card.querySelector('.story-hero-sprite'), m[1].replace(/\\'/g, "'"));
        });
    }

    function reaplicarTudo() {
        try { aplicarOca(); } catch (e) {}
        try { aplicarTabuleiro(); } catch (e) {}
        try {
            const el = document.querySelector('.hero-details-sprite');
            if (el && window._auraHeroAtual) aplicarClasse(el, window._auraHeroAtual);
        } catch (e) {}
    }

    function instalarHook(nome, fn) {
        const orig = window[nome];
        if (typeof orig !== 'function' || orig._aurasHookV206) return;
        window[nome] = function () {
            const args = Array.prototype.slice.call(arguments);
            const r = orig.apply(this, args);
            setTimeout(() => { try { fn.apply(null, args); } catch (e) {} }, 40);
            return r;
        };
        window[nome]._aurasHookV206 = true;
    }

    function instalarHooks() {
        instalarHook('renderOcaScreenFiltered', aplicarOca);
        instalarHook('updateHeroCard', aplicarTabuleiro);
        instalarHook('updateAllSpriteDirections', aplicarTabuleiro);
        instalarHook('openHeroDetails', function (heroClass) {
            window._auraHeroAtual = heroClass;
            setTimeout(aplicarClasse, 50, document.querySelector('.hero-details-sprite'), heroClass);
        });
    }
    instalarHooks();

    // ─────────────────────────────────────────────────────────────
    // PAINEL — lista de auras + escolha do herói
    // ─────────────────────────────────────────────────────────────
    function painelExtra(c) {
        injetarCSS();
        const auras = (c && Array.isArray(c.auras)) ? c.auras : [];
        let html = '<div class="cal-card"><b>✨ Auras temáticas (item)</b>';
        const heroes = heroisLv11();
        if (!auras.length) {
            html += '<div class="cal-pequeno">Complete 7 missões em 7 dias corridos de uma semana temática para resgatar a aura.</div>';
            return html + '</div>';
        }
        html += '<div class="cal-linha"><span>Herói nível 11</span>';
        if (heroes.length) {
            html += '<select class="aura-select-v206" id="auraHeroV206">';
            heroes.forEach(h => { html += '<option value="' + h + '">' + h + '</option>'; });
            html += '</select>';
        } else {
            html += '<span class="cal-pequeno">nenhum herói nível 11</span>';
        }
        html += '</div>';
        auras.forEach(a => {
            html += '<div class="aura-linha-v206"><span>' + (a.icone || '✨') + ' ' + a.nome +
                (a.aplicadaEmHeroi ? ' → <b>' + a.aplicadaEmHeroi + '</b>' : '') + '</span><span>';
            if (heroes.length) {
                html += '<button class="aura-btn-v206" onclick="window.aurasAplicar(\'' + a.id + '\',document.getElementById(\'auraHeroV206\').value)">APLICAR</button> ';
            }
            if (a.aplicadaEmHeroi) {
                html += '<button class="aura-btn-v206 remover" onclick="window.aurasRemover(\'' + a.id + '\')">REMOVER</button>';
            }
            html += '</span></div>';
        });
        html += '<div class="cal-pequeno">A aura fica aplicada mesmo depois que a semana temática termina. Remover volta à aura clássica.</div>';
        return html + '</div>';
    }

    if (typeof window.calendarioRegistrarExtra === 'function') {
        window.calendarioRegistrarExtra(painelExtra);
    }
    setTimeout(() => { try { reaplicarTudo(); } catch (e) {} }, 180);

    // Os patches antigos da aura clássica reintroduzem .lv11-glow a cada 3s
    // durante a batalha. Enquanto existir aura temática aplicada, reaplicamos
    // mais rápido para a escolha do jogador prevalecer.
    setInterval(() => {
        try {
            instalarHooks();
            const c = garantirAuras();
            if (c && c.auras.some(a => a.aplicadaEmHeroi)) reaplicarTudo();
        } catch (e) {}
    }, 900);

    injetarCSS();
    console.log('✅ [V205/V206] ' + IDS.length + ' auras temáticas instaladas.');
})();
