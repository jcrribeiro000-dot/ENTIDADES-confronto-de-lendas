/* =================================================================
 * temas-catalogo.js — V206
 * Catálogo LOCAL dos temas semanais do Calendário de Anhangá.
 *
 * AQUI VOCÊ COLOCA A URL DO FUNDO DE CADA TEMA:
 *   altere apenas o campo `fundoUrl` de cada tema abaixo.
 *   Ex.: fundoUrl: './fundos/natal.jpg'
 *   Deixando '' o painel usa o gradiente/ícone padrão do tema.
 *
 * Datas são sempre LOCAIS (meia-noite do navegador). Nada de UTC.
 * Nenhuma dependência de rede, áudio externo ou imagem nova.
 * ================================================================= */
(function () {
    'use strict';
    if (window._temasCatalogoV206) return;
    window._temasCatalogoV206 = true;

    // 🎨 Paleta: usada pelo CSS das auras e pelo fundo do painel.
    // 🔊 Som: nomes já existentes em entidades.js (playSfx).
    const TEMAS = [
        { id: 'ano_novo',        nome: 'Ano Novo',            aura: 'luzes_ano_novo',   icone: '🎆', inicio: '12-27', fim: '01-02', cor: '#f6d365', cor2: '#ffffff', vel: '1.1s', som: 'win',        fundoUrl: '' },
        { id: 'carnaval',        nome: 'Carnaval',            aura: 'carnaval_colorido',icone: '🎭', tipo: 'carnaval',                        cor: '#ff5fa2', cor2: '#38e8d0', vel: '0.55s', som: 'chocalho', fundoUrl: '' },
        { id: 'mulher',          nome: 'Dia da Mulher',       aura: 'iara_aguas',       icone: '🌸', inicio: '03-06', fim: '03-12', cor: '#7ad7f0', cor2: '#ffc0d9', vel: '1.8s', som: 'asas',      fundoUrl: '' },
        { id: 'aguas',           nome: 'Dia da Água',         aura: 'iara_ondas',       icone: '💧', inicio: '03-16', fim: '03-22', cor: '#4fc3f7', cor2: '#a5f3fc', vel: '2.2s', som: 'purificacao', fundoUrl: '' },
        { id: 'pascoa',          nome: 'Páscoa',              aura: 'luz_pascal',       icone: '🐰', tipo: 'pascoa',                          cor: '#f7d6a0', cor2: '#f8bbd0', vel: '1.6s', som: 'win',        fundoUrl: '' },
        { id: 'raizes',          nome: 'Raízes e Liberdade',  aura: 'guardiao_nacoes',  icone: '🌿', inicio: '04-17', fim: '04-23', cor: '#66bb6a', cor2: '#ffd54f', vel: '0.9s', som: 'forja',      fundoUrl: '' },
        { id: 'maes',            nome: 'Dia das Mães',        aura: 'coracao_mae',      icone: '💗', tipo: 'maes',                           cor: '#ff8fa3', cor2: '#ffd6a5', vel: '1.3s', som: 'asas',      fundoUrl: '' },
        { id: 'curupira',        nome: 'Curupira da Mata',    aura: 'curupira_mata',    icone: '🍃', inicio: '05-18', fim: '05-24', cor: '#2e7d32', cor2: '#ff7043', vel: '0.75s', som: 'purificacao', fundoUrl: '' },
        { id: 'namorados',       nome: 'Dia dos Namorados',   aura: 'coracao_iara',     icone: '💘', inicio: '06-06', fim: '06-12', cor: '#ff5e8a', cor2: '#ffc1d9', vel: '1.0s', som: 'asas',      fundoUrl: '' },
        { id: 'sao_joao',        nome: 'São João',            aura: 'fogo_sao_joao',    icone: '🔥', inicio: '06-19', fim: '06-25', cor: '#ff8c1a', cor2: '#ffe066', vel: '0.45s', som: 'chocalho',  fundoUrl: '' },
        { id: 'amizade_fogo',    nome: 'Amizade e Fogo',      aura: 'boitata_inverno',  icone: '🔵', inicio: '07-20', fim: '07-26', cor: '#26c6da', cor2: '#66bb6a', vel: '1.4s', som: 'purificacao', fundoUrl: '' },
        { id: 'pais',            nome: 'Dia dos Pais',        aura: 'escudo_pai',       icone: '🛡️', tipo: 'pais',                           cor: '#e6b325', cor2: '#fff3b0', vel: '1.5s', som: 'forja',      fundoUrl: '' },
        { id: 'folclore',        nome: 'Dia do Folclore',     aura: 'anhanga_folclore', icone: '👹', inicio: '08-20', fim: '08-26', cor: '#8e5bd0', cor2: '#69f0ae', vel: '0.8s', som: 'purificacao', fundoUrl: '' },
        { id: 'independencia',   nome: 'Independência',       aura: 'verde_amarela',    icone: '🇧🇷', inicio: '09-03', fim: '09-09', cor: '#2e9e4f', cor2: '#ffdf00', vel: '1.2s', som: 'win',        fundoUrl: '' },
        { id: 'criancas',        nome: 'Dia das Crianças',    aura: 'bolhas_anhanga',   icone: '🎈', inicio: '10-08', fim: '10-14', cor: '#ff7043', cor2: '#40c4ff', vel: '0.7s', som: 'chocalho',  fundoUrl: '' },
        { id: 'saci',            nome: 'Dia do Saci',         aura: 'saci_vermelho',    icone: '🌀', inicio: '10-25', fim: '10-31', cor: '#d32f2f', cor2: '#424242', vel: '0.6s', som: 'chocalho',  fundoUrl: '' },
        { id: 'consciencia',     nome: 'Consciência Negra',   aura: 'sume_ancestral',   icone: '✨', inicio: '11-17', fim: '11-23', cor: '#d4af37', cor2: '#fff8e1', vel: '2.0s', som: 'purificacao', fundoUrl: '' },
        { id: 'natal',           nome: 'Natal',               aura: 'luzes_natal',      icone: '🎄', inicio: '12-20', fim: '12-26', cor: '#e53935', cor2: '#43a047', vel: '0.95s', som: 'win',        fundoUrl: '' },
    ];

    function fixedDate(ano, mmdd) {
        const p = String(mmdd).split('-');
        return new Date(ano, Number(p[0]) - 1, Number(p[1]));
    }

    // Páscoa gregoriana (algoritmo de Meeus/Jones/Butcher).
    function pascoa(ano) {
        const a = ano % 19;
        const b = Math.floor(ano / 100);
        const c = ano % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const mes = Math.floor((h + l - 7 * m + 114) / 31);
        const dia = ((h + l - 7 * m + 114) % 31) + 1;
        return new Date(ano, mes - 1, dia);
    }

    function segundoDomingo(ano, mesIndex) {
        const primeiro = new Date(ano, mesIndex, 1);
        const dia = 1 + ((7 - primeiro.getDay()) % 7) + 7;
        return new Date(ano, mesIndex, dia);
    }

    function addDias(d, n) {
        const x = new Date(d.getTime());
        x.setDate(x.getDate() + n);
        return x;
    }

    function getJanelaTema(tema, ano) {
        let inicio, fim;
        if (tema.tipo === 'carnaval') {
            const terca = addDias(pascoa(ano), -47);
            fim = terca;
            inicio = addDias(fim, -6);
        } else if (tema.tipo === 'pascoa') {
            fim = pascoa(ano);
            inicio = addDias(fim, -6);
        } else if (tema.tipo === 'maes') {
            fim = segundoDomingo(ano, 4);
            inicio = addDias(fim, -6);
        } else if (tema.tipo === 'pais') {
            fim = segundoDomingo(ano, 7);
            inicio = addDias(fim, -6);
        } else {
            inicio = fixedDate(ano, tema.inicio);
            fim = fixedDate(ano, tema.fim);
            if (fim.getTime() < inicio.getTime()) fim = fixedDate(ano + 1, tema.fim);
        }
        inicio.setHours(0, 0, 0, 0);
        fim.setHours(23, 59, 59, 999);
        return { inicio, fim };
    }

    function getTemaAtual(data) {
        const d = data instanceof Date ? data : new Date();
        const ano = d.getFullYear();
        for (const tema of TEMAS) {
            for (const a of [ano - 1, ano, ano + 1]) {
                const janela = getJanelaTema(tema, a);
                if (d >= janela.inicio && d <= janela.fim) return tema;
            }
        }
        return null;
    }

    function getTemaById(id) {
        return TEMAS.find(t => t.id === id) || null;
    }

    function getFundoStyle(tema) {
        const t = tema || getTemaAtual();
        if (!t) return '';
        if (t.fundoUrl && String(t.fundoUrl).trim()) {
            const url = String(t.fundoUrl).trim().replace(/"/g, '%22');
            return `background-image: linear-gradient(180deg, rgba(8,10,20,.55), rgba(8,10,20,.88)), url("${url}");background-size:cover;background-position:center;`;
        }
        return `background-image: radial-gradient(circle at 20% 0%, ${t.cor}44, transparent 55%), linear-gradient(160deg, #101426, #0a0d18);`;
    }

    window.TEMAS_CALENDARIO = TEMAS;
    window.getTemaAtual = getTemaAtual;
    window.getTemaById = getTemaById;
    window.getJanelaTema = getJanelaTema;
    window.getFundoStyleTema = getFundoStyle;
    window.VERSAO_JOGO = 'v206';

    console.log('✅ [V206] Catálogo local de ' + TEMAS.length + ' temas carregado.');
})();
