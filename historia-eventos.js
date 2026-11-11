// historia.js — BLOCO 14 (V9.5 — ATO DE EVENTO SEMANAL — PARTE 1/2)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js, depois do Bloco 13.
// Não substitui NADA — só adiciona.
//
// PARTE 1 contém:
//   • Lore do evento
//   • Configuração dos 7 bosses + Pesadelo mensal
//   • Tabela de sprites (vazios → fallback)
//   • Animais por ato (+10 HP / +1 ATK)
//   • 21 armas (7 bosses × 3 tipos)
//   • 7 fragmentos divinos
//   • Herói Rudá (fixo mago)
//   • Sistema de chaves (10/semana, máx 30)
//   • Estado runtime + helpers
//   • Tela de seleção semanal + tela de fases
//   • Botão na Aldeia
//   • Correção dos espectros do Ato 13
//   • CSS
//
// ⚠️ PARTE 2 (depois) virá com:
//   • Skills dos bosses adaptadas 1×1
//   • IA do boss do evento
//   • Tela de vitória/derrota
//   • Drop system (arma 5%/10%/20%, item especial 5%/10%/20%)
//   • Integração com o motor do historia.js
//   • Ao Ao com eco visual + ATK ×1.5
// =================================================================

(function installEventoSemanalParte1() {
    if (window._eventoSemanalV95P1) return;
    window._eventoSemanalV95P1 = true;

    // ==============================================================
    // 1. LORE DO EVENTO
    // ==============================================================
    const EVENTO_LORE = {
        titulo: 'A Semana das Sombras',
        subtitulo: 'Os Sete Selados despertam, um por dia. Acalme-os e colecione os Fragmentos Divinos.',
        lore: `
            Quando os sete guardiões originais foram corrompidos por Anhangá, o
            equilíbrio da mata foi rompido. Mas o que poucos sabem é que, nas
            profundezas da Terra, existem <b>os Sete Selados</b> — seres ainda
            mais antigos, adormecidos desde antes dos tempos dos homens.
            <br><br>
            A cada ciclo lunar, Anhangá tenta quebrar os selos, e eles se
            enfurecem. Não podem ser purificados como os outros — são força
            bruta da natureza, e precisam ser <b>acalmados</b> à força. Cada dia
            da semana, um dos Sete desperta por algumas horas, e os animais da
            mata são corrompidos pelo seu poder (+10 HP, +1 ATK).
            <br><br>
            Quem conseguir enfrentar os Sete e coletar seus <b>Fragmentos
            Divinos</b> provará seu valor. E, quando os sete estiverem reunidos,
            <b>Rudá</b> — o deus do amor e da guerra justa — descerá das nuvens
            para lutar ao lado dos heróis.
            <br><br>
            Mas cuidado: no fim do mês, quando a lua nova se alinha com o sol,
            <b>o Pesadelo</b> — a fusão dos Sete — desperta. Só os mais fortes
            sobreviverão.
        `,
    };

    // ==============================================================
    // 2. SPRITES DO EVENTO (vazios → fallback emoji)
    // --------------------------------------------------------------
    // Preencha os links depois. Se vazio, cai no emoji do RAID_EMOJIS
    // (ou emoji padrão se não tiver).
    // ==============================================================
    const EVENTO_SPRITES = {
        // ---- Bosses ----
        'teju_jagua': 'https://i.imgur.com/0atgaFe.gif',
        'mboi_tui': 'https://i.imgur.com/69aaS7o.gif',
        'monai': 'https://i.imgur.com/iJl1nlQ.gif',
        'jasy_jatere': 'https://i.imgur.com/sAeJs3R.gif',
        'kurupi': 'https://i.imgur.com/gMVyzEk.gif',
        'ao_ao': 'https://i.imgur.com/CxdJ0y5.gif',
        'luison': 'https://i.imgur.com/PRdbFLR.gif',

        // ---- Pesadelo mensal ----
        'pesadelo': 'https://i.imgur.com/L43Dzl2.gif',

        // ---- Animais (reusam SPRITES_STORY, mas podem ter sprite próprio) ----
        // Se vazio, usa SPRITES_STORY do mesmo id.

        // ---- Materiais ----
        'fragmento_teju': 'https://i.imgur.com/KZLVehp.png',
        'fragmento_mboi': 'https://i.imgur.com/UbqoKLo.png',
        'fragmento_monai': 'https://i.imgur.com/tsb1S32.png',
        'fragmento_jasy': 'https://i.imgur.com/eHA6G7Y.png',
        'fragmento_kurupi': 'https://i.imgur.com/lZUTJtt.png',
        'fragmento_aoao': 'https://i.imgur.com/kFp1ZU4.png',
        'fragmento_luison': 'https://i.imgur.com/khrbQlR.png',

        // ---- Armas (tacape) ----
        'arma_teju_tacape': 'https://i.imgur.com/lLVprTE.png',
        'arma_mboi_tacape': 'https://i.imgur.com/yG0vaOB.png',
        'arma_monai_tacape': 'https://i.imgur.com/6wI2Ctu.png',
        'arma_jasy_tacape': 'https://i.imgur.com/JiE579L.png',
        'arma_kurupi_tacape': 'https://i.imgur.com/OfTmKyD.png',
        'arma_aoao_tacape': 'https://i.imgur.com/vcd54H6.png',
        'arma_luison_tacape': 'https://i.imgur.com/3gfyDqQ.png',

        // ---- Armas (flecha) ----
        'arma_teju_flecha': 'https://i.imgur.com/zuBrBm1.png',
        'arma_mboi_flecha': 'https://i.imgur.com/quiGqux.png',
        'arma_monai_flecha': 'https://i.imgur.com/AtwwLRj.png',
        'arma_jasy_flecha': 'https://i.imgur.com/VY6BuM3.png',
        'arma_kurupi_flecha': 'https://i.imgur.com/PICIZDe.png',
        'arma_aoao_flecha': 'https://i.imgur.com/Hb9fKsR.png',
        'arma_luison_flecha': 'https://i.imgur.com/xmJQr2B.png',

        // ---- Armas (cajado) ----
        'arma_teju_cajado': 'https://i.imgur.com/Z5fZdzT.png',
        'arma_mboi_cajado': 'https://i.imgur.com/TmWTowF.png',
        'arma_monai_cajado': 'https://i.imgur.com/yIazf0k.png',
        'arma_jasy_cajado': 'https://i.imgur.com/t3gPgqF.png',
        'arma_kurupi_cajado': 'https://i.imgur.com/S55ogba.png',
        'arma_aoao_cajado': 'https://i.imgur.com/BVMs4O9.png',
        'arma_luison_cajado': 'https://i.imgur.com/IUL7382.png',
    };

    const EVENTO_EMOJIS = {
        'teju_jagua': '🐉',
        'mboi_tui': '🐍',
        'monai': '🐲',
        'jasy_jatere': '☀️',
        'kurupi': '🌳',
        'ao_ao': '🐑',
        'luison': '💀',
        'pesadelo': '👹',

        'fragmento_teju': '🔥',
        'fragmento_mboi': '💧',
        'fragmento_monai': '🌪️',
        'fragmento_jasy': '☀️',
        'fragmento_kurupi': '🌱',
        'fragmento_aoao': '🐾',
        'fragmento_luison': '🌑',
    };

    function eventoIcon(key, size) {
        const url = EVENTO_SPRITES[key];
        const emoji = EVENTO_EMOJIS[key] || '?';
        if (url && String(url).trim() !== '') {
            const cls = size === 'large' ? 'evento-icon evento-icon-large'
                      : size === 'small' ? 'evento-icon evento-icon-small' : 'evento-icon';
            return `<img src="${url}" class="${cls}" alt="${key}" onerror="this.outerHTML='${emoji}'">`;
        }
        const cls = size === 'large' ? 'evento-emoji evento-emoji-large'
                  : size === 'small' ? 'evento-emoji evento-emoji-small' : 'evento-emoji';
        return `<span class="${cls}">${emoji}</span>`;
    }

    // ==============================================================
    // 3. CONFIG DOS 7 BOSSES (1 por dia)
    // --------------------------------------------------------------
    // Dias: 0=dom, 1=seg, 2=ter, 3=qua, 4=qui, 5=sex, 6=sab
    // Ordem: seg, ter, qua, qui, sex, sab, dom
    // ==============================================================
    const EVENTO_BOSSES = {
        'teju_jagua': {
            id: 'teju_jagua',
            diaSemana: 1,  // segunda
            diaLabel: 'Segunda',
            nome: 'Teju Jagua',
            titulo: 'O Lagarto de Sete Cabeças',
            elemento: 'FOGO',
            descricao: 'Uma besta colossal com sete cabeças de cachorro cuspindo fogo. Anhangá sussurrou que ele era o filho favorito — e ele acreditou.',
            lore: 'Dizem que Teju Jagua foi o primeiro dos Sete Selados a despertar. Suas sete cabeças uivam em uníssono quando a lua cheia aparece.',
            hp: 100, atk: 4,
            custoChave: 1,
            recompensaXP: 600, recompensaOuro: 450,
            animais: ['porco_espinho', 'jacare', 'cervo', 'onca_parda'],
            armaTacape: 'arma_teju_tacape',
            armaFlecha: 'arma_teju_flecha',
            armaCajado: 'arma_teju_cajado',
            fragmento: 'fragmento_teju',
            skills: [
                { id: 'sete_cabecas',   nome: 'Sete Cabeças',   handler: 'evento_teju_sete_cabecas' },
                { id: 'ima_almas',      nome: 'Ímã de Almas',   handler: 'evento_teju_ima_almas' },
            ],
        },
        'mboi_tui': {
            id: 'mboi_tui',
            diaSemana: 2,  // terça
            diaLabel: 'Terça',
            nome: "Mbói Tu'ĩ",
            titulo: 'A Serpente Papagaio',
            elemento: 'AGUA',
            descricao: 'Uma serpente colossal com bico de arco-íris. Seu veneno corrói a própria água que ela protege.',
            lore: 'Mbói Tu\'ĩ guardava os rios antes dos homens. Agora, corrompido, ele os envenena.',
            hp: 110, atk: 4,
            custoChave: 1,
            recompensaXP: 700, recompensaOuro: 525,
            animais: ['piranha', 'lontra', 'pirarucu', 'ariranha'],
            armaTacape: 'arma_mboi_tacape',
            armaFlecha: 'arma_mboi_flecha',
            armaCajado: 'arma_mboi_cajado',
            fragmento: 'fragmento_mboi',
            skills: [
                { id: 'bico_arco_iris', nome: 'Bico Arco-Íris', handler: 'evento_mboi_bico_arco_iris' },
                { id: 'inundacao',      nome: 'Inundação',      handler: 'evento_mboi_inundacao' },
            ],
        },
        'monai': {
            id: 'monai',
            diaSemana: 3,  // quarta
            diaLabel: 'Quarta',
            nome: 'Moñái',
            titulo: 'A Serpente Alada',
            elemento: 'AR',
            descricao: 'Uma serpente com asas de morcego gigantes. Seu voo rasante cobre o tabuleiro de sombras.',
            lore: 'Moñái foi o guardião dos ventos. Anhangá lhe prometeu o céu inteiro — e ele aceitou.',
            hp: 120, atk: 4,
            custoChave: 1,
            recompensaXP: 800, recompensaOuro: 600,
            animais: ['morcego', 'coruja', 'gaviao', 'urubu'],
            armaTacape: 'arma_monai_tacape',
            armaFlecha: 'arma_monai_flecha',
            armaCajado: 'arma_monai_cajado',
            fragmento: 'fragmento_monai',
            skills: [
                { id: 'voo_rasante',      nome: 'Voo Rasante',      handler: 'evento_monai_voo_rasante' },
                { id: 'sopro_tempestade', nome: 'Sopro de Tempestade', handler: 'evento_monai_sopro_tempestade' },
            ],
        },
        'jasy_jatere': {
            id: 'jasy_jatere',
            diaSemana: 4,  // quinta
            diaLabel: 'Quinta',
            nome: 'Jasy Jaterê',
            titulo: 'O Duende do Sol',
            elemento: 'FOGO',
            descricao: 'Um duende colossal com cabelos de fogo. Seu clarão cega e queima sem piedade.',
            lore: 'Jasy Jaterê era o protetor do amanhecer. Agora, seu sol interior virou um inferno.',
            hp: 130, atk: 4,
            custoChave: 1,
            recompensaXP: 900, recompensaOuro: 675,
            animais: ['cascavel', 'coral', 'jararaca', 'tartaruga'],
            armaTacape: 'arma_jasy_tacape',
            armaFlecha: 'arma_jasy_flecha',
            armaCajado: 'arma_jasy_cajado',
            fragmento: 'fragmento_jasy',
            skills: [
                { id: 'salto_solar',     nome: 'Salto Solar',     handler: 'evento_jasy_salto_solar' },
                { id: 'clarao_cegante',  nome: 'Clarão Cegante',  handler: 'evento_jasy_clarao_cegante' },
            ],
        },
        'kurupi': {
            id: 'kurupi',
            diaSemana: 5,  // sexta
            diaLabel: 'Sexta',
            nome: 'Kurupí',
            titulo: 'O Guardião da Floresta',
            elemento: 'TERRA',
            descricao: 'Um duende colossal coberto de musgo. Suas raízes prendem os heróis no chão.',
            lore: 'Kurupí protegia a floresta desde antes dos homens. Anhangá o convenceu de que os homens eram pragas.',
            hp: 140, atk: 4,
            custoChave: 1,
            recompensaXP: 1000, recompensaOuro: 750,
            animais: ['tatu', 'sucuri', 'queixada', 'tamandua'],
            armaTacape: 'arma_kurupi_tacape',
            armaFlecha: 'arma_kurupi_flecha',
            armaCajado: 'arma_kurupi_cajado',
            fragmento: 'fragmento_kurupi',
            skills: [
                { id: 'raizes_estranguladoras', nome: 'Raízes Estranguladoras', handler: 'evento_kurupi_raizes' },
                { id: 'chamado_mata',           nome: 'Chamado da Mata',         handler: 'evento_kurupi_chamado' },
            ],
        },
        'ao_ao': {
            id: 'ao_ao',
            diaSemana: 6,  // sabado
            diaLabel: 'Sábado',
            nome: 'Ao Ao',
            titulo: 'A Ovelha Canibal',
            elemento: 'TERRA',
            descricao: 'Uma ovelha colossal com presas de lobo. Quando ferida, divide-se em duas e dobra sua fúria.',
            lore: 'Ao Ao era o guardião dos rebanhos. Anhangá lhe deu fome — e ele devorou todos os seus.',
            hp: 150, atk: 5,
            custoChave: 1,
            recompensaXP: 1200, recompensaOuro: 900,
            animais: ['bode', 'carneiro', 'touro_bravo', 'lobo_guara'],
            armaTacape: 'arma_aoao_tacape',
            armaFlecha: 'arma_aoao_flecha',
            armaCajado: 'arma_aoao_cajado',
            fragmento: 'fragmento_aoao',
            skills: [
                { id: 'investida_diagonal', nome: 'Investida Diagonal', handler: 'evento_aoao_investida' },
                { id: 'la_energizada',      nome: 'Lã Energizada',      handler: 'evento_aoao_la' },
            ],
            passiva: { id: 'fissao_voraz', hpLimiar: 0.5, atkMult: 1.5 },
        },
        'luison': {
            id: 'luison',
            diaSemana: 0,  // domingo
            diaLabel: 'Domingo',
            nome: 'Luison',
            titulo: 'O Senhor da Morte',
            elemento: 'AR',
            descricao: 'Uma criatura sombria coroada de crânios. Sua presença gela o sangue.',
            lore: 'Luison foi o último dos Sete Selados. Ele é o silêncio que vem antes do fim.',
            hp: 170, atk: 5,
            custoChave: 1,
            recompensaXP: 1500, recompensaOuro: 1125,
            animais: ['cachorro_mato', 'raposa', 'jaguatirica', 'lobisomem'],
            armaTacape: 'arma_luison_tacape',
            armaFlecha: 'arma_luison_flecha',
            armaCajado: 'arma_luison_cajado',
            fragmento: 'fragmento_luison',
            skills: [
                { id: 'colheita_sombria', nome: 'Colheita Sombria', handler: 'evento_luison_colheita' },
                { id: 'legado_filhos',    nome: 'Legado dos Filhos', handler: 'evento_luison_legado' },
            ],
        },
    };

    // ==============================================================
    // 4. PESADELO (EVENTO MENSAL)
    // --------------------------------------------------------------
    // Aparece em 1 dia aleatório do mês (seed determinística).
    // Liberado pra todos. Boss final.
    // ==============================================================
    const EVENTO_PESADELO = {
        id: 'pesadelo',
        nome: 'Pesadelo da Terra',
        titulo: 'A Manifestação da Destruição',
        elemento: 'VARIÁVEL',
        descricao: 'Um amálgama colossal de troncos carbonizados, correntes, ossos e fumaça. A fusão dos Sete Selados.',
        lore: 'Quando a lua nova se alinha com o sol, os Sete Selados se fundem por uma noite. É o Pesadelo — e ele não pode ser acalmado, apenas sobrevivido.',
        hp: 220, atk: 6,
        custoChave: 1,
        recompensaXP: 3000, recompensaOuro: 2250,
        animais: null,  // usa 4 animais aleatórios de qualquer ato
        armaTacape: null, armaFlecha: null, armaCajado: null,
        fragmento: null,
        skills: [
            { skillOrigem: 'aleatoria', skillId: 'aleatoria' },  // sorteia 1 skill de qualquer boss
        ],
    };

    // ==============================================================
    // 5. ANIMAIS DO EVENTO (com +10 HP / +1 ATK)
    // --------------------------------------------------------------
    // Mapa: animalId → { hpBonus, atkBonus }
    // Aplicado em TODOS os animais e bosses do evento.
    // ==============================================================
    const EVENTO_ANIMAL_BONUS = {
        hpBonus: 10,
        atkBonus: 1,
    };

    // ==============================================================
    // 6. ARMAS DO EVENTO (21 armas: 7 bosses × 3 tipos)
    // --------------------------------------------------------------
    // Stats: +5 ATK base, +5 do elemento do boss (bem forte).
    // Cada arma tem tipo fixo (tacape/flecha/cajado).
    // ==============================================================
    const EVENTO_ARMAS = {
        // ---- TEJU JAGUA (FOGO) ----
        'arma_teju_tacape': { id: 'arma_teju_tacape', nome: 'Tacape do Teju', tipo: 'tacape', elemento: 'FOGO', atkBonus: 5, elementoBonus: 5, boss: 'teju_jagua' },
        'arma_teju_flecha': { id: 'arma_teju_flecha', nome: 'Flecha do Teju', tipo: 'flecha', elemento: 'FOGO', atkBonus: 5, elementoBonus: 5, boss: 'teju_jagua' },
        'arma_teju_cajado': { id: 'arma_teju_cajado', nome: 'Cajado do Teju', tipo: 'cajado', elemento: 'FOGO', atkBonus: 5, elementoBonus: 5, boss: 'teju_jagua' },

        // ---- MBÓI TU'Ĩ (AGUA) ----
        'arma_mboi_tacape': { id: 'arma_mboi_tacape', nome: 'Tacape do Bico', tipo: 'tacape', elemento: 'AGUA', atkBonus: 5, elementoBonus: 5, boss: 'mboi_tui' },
        'arma_mboi_flecha': { id: 'arma_mboi_flecha', nome: 'Flecha do Bico', tipo: 'flecha', elemento: 'AGUA', atkBonus: 5, elementoBonus: 5, boss: 'mboi_tui' },
        'arma_mboi_cajado': { id: 'arma_mboi_cajado', nome: 'Cajado do Bico', tipo: 'cajado', elemento: 'AGUA', atkBonus: 5, elementoBonus: 5, boss: 'mboi_tui' },

        // ---- MOÑÁI (AR) ----
        'arma_monai_tacape': { id: 'arma_monai_tacape', nome: 'Tacape Alado', tipo: 'tacape', elemento: 'AR', atkBonus: 5, elementoBonus: 5, boss: 'monai' },
        'arma_monai_flecha': { id: 'arma_monai_flecha', nome: 'Flecha Alada', tipo: 'flecha', elemento: 'AR', atkBonus: 5, elementoBonus: 5, boss: 'monai' },
        'arma_monai_cajado': { id: 'arma_monai_cajado', nome: 'Cajado Alado', tipo: 'cajado', elemento: 'AR', atkBonus: 5, elementoBonus: 5, boss: 'monai' },

        // ---- JASY JATERÊ (FOGO) ----
        'arma_jasy_tacape': { id: 'arma_jasy_tacape', nome: 'Tacape Solar', tipo: 'tacape', elemento: 'FOGO', atkBonus: 5, elementoBonus: 5, boss: 'jasy_jatere' },
        'arma_jasy_flecha': { id: 'arma_jasy_flecha', nome: 'Flecha Solar', tipo: 'flecha', elemento: 'FOGO', atkBonus: 5, elementoBonus: 5, boss: 'jasy_jatere' },
        'arma_jasy_cajado': { id: 'arma_jasy_cajado', nome: 'Cajado Solar', tipo: 'cajado', elemento: 'FOGO', atkBonus: 5, elementoBonus: 5, boss: 'jasy_jatere' },

        // ---- KURUPÍ (TERRA) ----
        'arma_kurupi_tacape': { id: 'arma_kurupi_tacape', nome: 'Tacape Vivo', tipo: 'tacape', elemento: 'TERRA', atkBonus: 5, elementoBonus: 5, boss: 'kurupi' },
        'arma_kurupi_flecha': { id: 'arma_kurupi_flecha', nome: 'Flecha Viva', tipo: 'flecha', elemento: 'TERRA', atkBonus: 5, elementoBonus: 5, boss: 'kurupi' },
        'arma_kurupi_cajado': { id: 'arma_kurupi_cajado', nome: 'Cajado Vivo', tipo: 'cajado', elemento: 'TERRA', atkBonus: 5, elementoBonus: 5, boss: 'kurupi' },

        // ---- AO AO (TERRA) ----
        'arma_aoao_tacape': { id: 'arma_aoao_tacape', nome: 'Tacape da Fome', tipo: 'tacape', elemento: 'TERRA', atkBonus: 5, elementoBonus: 5, boss: 'ao_ao' },
        'arma_aoao_flecha': { id: 'arma_aoao_flecha', nome: 'Flecha da Fome', tipo: 'flecha', elemento: 'TERRA', atkBonus: 5, elementoBonus: 5, boss: 'ao_ao' },
        'arma_aoao_cajado': { id: 'arma_aoao_cajado', nome: 'Cajado da Fome', tipo: 'cajado', elemento: 'TERRA', atkBonus: 5, elementoBonus: 5, boss: 'ao_ao' },

        // ---- LUISON (AR) ----
        'arma_luison_tacape': { id: 'arma_luison_tacape', nome: 'Tacape Sombrio', tipo: 'tacape', elemento: 'AR', atkBonus: 5, elementoBonus: 5, boss: 'luison' },
        'arma_luison_flecha': { id: 'arma_luison_flecha', nome: 'Flecha Sombria', tipo: 'flecha', elemento: 'AR', atkBonus: 5, elementoBonus: 5, boss: 'luison' },
        'arma_luison_cajado': { id: 'arma_luison_cajado', nome: 'Cajado Sombrio', tipo: 'cajado', elemento: 'AR', atkBonus: 5, elementoBonus: 5, boss: 'luison' },
    };

    // ==============================================================
    // 7. FRAGMENTOS DIVINOS (1 por boss)
    // ==============================================================
    const EVENTO_FRAGMENTOS = {
        'fragmento_teju':   { id: 'fragmento_teju',   nome: 'Fragmento do Teju',   boss: 'teju_jagua',  emoji: '🔥' },
        'fragmento_mboi':   { id: 'fragmento_mboi',   nome: 'Fragmento do Bico',   boss: 'mboi_tui',    emoji: '💧' },
        'fragmento_monai':  { id: 'fragmento_monai',  nome: 'Fragmento Alado',     boss: 'monai',       emoji: '🌪️' },
        'fragmento_jasy':   { id: 'fragmento_jasy',   nome: 'Fragmento Solar',     boss: 'jasy_jatere', emoji: '☀️' },
        'fragmento_kurupi': { id: 'fragmento_kurupi', nome: 'Fragmento Vivo',      boss: 'kurupi',      emoji: '🌱' },
        'fragmento_aoao':   { id: 'fragmento_aoao',   nome: 'Fragmento da Fome',   boss: 'ao_ao',       emoji: '🐾' },
        'fragmento_luison': { id: 'fragmento_luison', nome: 'Fragmento Sombrio',   boss: 'luison',      emoji: '🌑' },
    };

    // ==============================================================
    // 8. HERÓI DIVINO — RUDÁ (fixo mago, range 3)
    // ==============================================================
    if (typeof STORY_HERO_CLASSES !== 'undefined' && !STORY_HERO_CLASSES['Rudá']) {
        STORY_HERO_CLASSES['Rudá'] = {
            displayName: 'Rudá',
            spriteKey: 'heroi_Ruda',
            className: 'Rudá',
            role: 'Mago',
            hp: 14, atk: 5, range: 3,
            element: 'AR',
            paKey: 'ruda_flecha_amor',
            starsNeeded: 0,
            rarity: 5,
            unlockReq: { type: 'special', desc: 'Reúna os 7 Fragmentos Divinos' },
        };
    }

    if (typeof STORY_BRAVELY_GIFS !== 'undefined' && !('Rudá' in STORY_BRAVELY_GIFS)) {
        STORY_BRAVELY_GIFS['Rudá'] = '';
    }

    if (typeof STORY_HERO_PA !== 'undefined' && !STORY_HERO_PA['ruda_flecha_amor']) {
        STORY_HERO_PA['ruda_flecha_amor'] = {
            desc: 'Flecha do Amor — acerta o alvo e o tile do meio entre Rudá e o alvo (dano em cadeia).',
            execute: async (active, target, totalAtk) => {
                if (!target || target.dead) return;
                // Dano no alvo
                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
                // Dano no tile do meio
                const mx = Math.floor((active.x + target.x) / 2);
                const my = Math.floor((active.y + target.y) / 2);
                const midIdx = my * 8 + mx;
                if (typeof spawnFxAt === 'function') {
                    spawnFxAt('impact', 'fx-impact', mx, my, { duration: 600, scale: 1.3 });
                }
                if (typeof grid !== 'undefined') {
                    grid[midIdx] = 'AR';
                    const tile = document.querySelectorAll('#grid .tile')[midIdx];
                    if (tile) tile.className = 'tile bg-AR';
                }
                if (typeof addLog === 'function') addLog(`🏹 Rudá: Flecha do Amor! (dano em cadeia)`);
            },
        };
    }

    // ==============================================================
    // 9. SISTEMA DE CHAVES
    // --------------------------------------------------------------
    // 10 chaves por semana (resetam segunda 00:00).
    // Máximo acumulável: 30.
    // Boss gasta 1. Fases normais não gastam.
    // ==============================================================
    const EVENTO_CHAVES_KEY = 'entity_evento_chaves';
    const EVENTO_CHAVES_MAX = 30;
    const EVENTO_CHAVES_POR_SEMANA = 10;

    function getSegundaDaSemana(date) {
        const d = new Date(date);
        const dia = d.getDay();  // 0=dom, 1=seg, ...
        const diff = (dia === 0 ? 6 : dia - 1);  // seg=0, ..., dom=6
        d.setDate(d.getDate() - diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function getChaveData() {
        try {
            const raw = localStorage.getItem(EVENTO_CHAVES_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) { return null; }
    }

    function salvarChaveData(data) {
        try {
            localStorage.setItem(EVENTO_CHAVES_KEY, JSON.stringify(data));
        } catch (e) {}
    }

    function getChavesAtuais() {
        const data = getChaveData();
        if (!data) {
            // Primeira vez — cria
            const agora = new Date();
            const segunda = getSegundaDaSemana(agora);
            const novaData = {
                quantidade: EVENTO_CHAVES_POR_SEMANA,
                ultimaSegunda: segunda.toISOString(),
                totalGasto: 0,
            };
            salvarChaveData(novaData);
            return novaData.quantidade;
        }

        // Verifica se virou a semana
        const agora = new Date();
        const segundaAtual = getSegundaDaSemana(agora);
        const ultimaSegunda = new Date(data.ultimaSegunda);

        if (segundaAtual.getTime() > ultimaSegunda.getTime()) {
            // Resetou — acumula + adiciona 10 (max 30)
            const novoTotal = Math.min(EVENTO_CHAVES_MAX, (data.quantidade || 0) + EVENTO_CHAVES_POR_SEMANA);
            const novaData = {
                quantidade: novoTotal,
                ultimaSegunda: segundaAtual.toISOString(),
                totalGasto: 0,
            };
            salvarChaveData(novaData);
            return novaData.quantidade;
        }

        return data.quantidade || 0;
    }

    function gastarChave(qtd) {
        qtd = qtd || 1;
        const data = getChaveData();
        if (!data) { getChavesAtuais(); return gastarChave(qtd); }
        if (data.quantidade < qtd) return false;
        data.quantidade -= qtd;
        data.totalGasto = (data.totalGasto || 0) + qtd;
        salvarChaveData(data);
        return true;
    }

    function resetarChavesManualmente() {
        const agora = new Date();
        const segunda = getSegundaDaSemana(agora);
        salvarChaveData({
            quantidade: EVENTO_CHAVES_POR_SEMANA,
            ultimaSegunda: segunda.toISOString(),
            totalGasto: 0,
        });
    }

    // ==============================================================
    // 10. PROGRESSO DO EVENTO (fases concluídas por boss)
    // --------------------------------------------------------------
    // Estrutura no STORY_PROGRESS:
    //   eventoProgresso: {
    //     'teju_jagua': { fasesConcluidas: ['1','2','3','4','boss'], drops: [...] }
    //   }
    // ==============================================================
    function garantirEstruturaEvento() {
        if (typeof STORY_PROGRESS === 'undefined') return;
        if (!STORY_PROGRESS.eventoProgresso || typeof STORY_PROGRESS.eventoProgresso !== 'object') {
            STORY_PROGRESS.eventoProgresso = {};
        }
        if (!STORY_PROGRESS.eventoArmas || !Array.isArray(STORY_PROGRESS.eventoArmas)) {
            STORY_PROGRESS.eventoArmas = [];
        }
        if (!STORY_PROGRESS.eventoFragmentos || !Array.isArray(STORY_PROGRESS.eventoFragmentos)) {
            STORY_PROGRESS.eventoFragmentos = [];
        }
        if (typeof STORY_PROGRESS.eventoRudaDesbloqueado === 'undefined') {
            STORY_PROGRESS.eventoRudaDesbloqueado = false;
        }
    }

    function getEventoProgresso(bossId) {
        garantirEstruturaEvento();
        if (!STORY_PROGRESS.eventoProgresso[bossId]) {
            STORY_PROGRESS.eventoProgresso[bossId] = {
                fasesConcluidas: [],
                drops: [],
                ultimaVitoria: 0,
            };
        }
        return STORY_PROGRESS.eventoProgresso[bossId];
    }

    function isFaseEventoConcluida(bossId, faseId) {
        const prog = getEventoProgresso(bossId);
        return prog.fasesConcluidas.includes(faseId);
    }

    function marcarFaseEventoConcluida(bossId, faseId) {
        const prog = getEventoProgresso(bossId);
        if (!prog.fasesConcluidas.includes(faseId)) {
            prog.fasesConcluidas.push(faseId);
        }
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
    }

    // ==============================================================
    // 11. DIA DA SEMANA ATUAL + RESET SEMANAL
    // ==============================================================
    function getDiaSemanaAtual() {
        // 0=dom, 1=seg, ..., 6=sab
        return new Date().getDay();
    }

    function getBossDoDia() {
        const dia = getDiaSemanaAtual();
        for (const bossId in EVENTO_BOSSES) {
            if (EVENTO_BOSSES[bossId].diaSemana === dia) {
                return EVENTO_BOSSES[bossId];
            }
        }
        return null;
    }

    function getBossPorDia(dia) {
        for (const bossId in EVENTO_BOSSES) {
            if (EVENTO_BOSSES[bossId].diaSemana === dia) {
                return EVENTO_BOSSES[bossId];
            }
        }
        return null;
    }

    // Verifica se o jogador pode jogar o boss do dia
    function podeJogarHoje() {
        const boss = getBossDoDia();
        if (!boss) return false;
        return true;
    }

    // ==============================================================
    // 12. PESADELO MENSAL (dia aleatório determinístico)
    // ==============================================================
    function getDiaDoMesAtual() {
        return new Date().getDate();
    }

    function getMesAtual() {
        return new Date().getMonth() + 1;
    }

    function getAnoAtual() {
        return new Date().getFullYear();
    }

    // Semente: dia do mês + mês + ano → escolhe 1 dia da semana
    function getDiaPesadelo() {
        const dia = getDiaDoMesAtual();
        const mes = getMesAtual();
        const ano = getAnoAtual();
        const seed = (dia * 31 + mes * 7 + ano) % 7;
        return seed;  // 0=dom, ..., 6=sab
    }

    function pesadeloDisponivelHoje() {
        return getDiaSemanaAtual() === getDiaPesadelo();
    }

    // ==============================================================
    // 13. SPRITES DOS ESPECTROS — CORREÇÃO (Ato 13)
    // --------------------------------------------------------------
    // Sobrescreve SPRITES_STORY['espectro_*'] se estiver vazio,
    // usando o sprite do boss base + classe spectral-boss aplicada
    // no CSS.
    //
    // A ideia: o fallback já existe em applyStoryEnemyToBoss, mas
    // a classe spectral-boss só era aplicada quando o sprite vinha
    // do SPRITES_STORY. Agora, garantimos que ela SEMPRE é aplicada
    // quando isSpectral === true, mesmo no fallback.
    // ==============================================================
    const ESPECTRO_MAP = {
        'espectro_saci': 'SACI',
        'espectro_mapinguari': 'MAPINGUARI',
        'espectro_iara': 'IARA',
        'espectro_boitata': 'BOITATA',
        'espectro_mula': 'MULA',
        'espectro_corposeco': 'CORPOSECO',
        'espectro_lobisomem': 'LOBISOMEM',
        'espectro_cuca': 'CUCA',
        'espectro_boto': 'BOTO',
        'espectro_boi': 'BOI',
        'espectro_jaci': 'JACI',
        'espectro_guaraci': 'GUARACI',
    };

    // Patch no applyStoryEnemyToBoss original (via wrap)
    if (typeof window.applyStoryEnemyToBoss === 'function' && !window._eventoEspectroPatch) {
        window._eventoEspectroPatch = true;
        const _orig = window.applyStoryEnemyToBoss;
        window.applyStoryEnemyToBoss = function(enemyId) {
            const r = _orig.apply(this, arguments);
            const enemy = (typeof STORY_ENEMIES !== 'undefined') ? STORY_ENEMIES[enemyId] : null;
            if (!enemy || !enemy.isSpectral) return r;

            // Se o sprite veio do fallback (não tem SPRITES_STORY),
            // garante que a classe spectral-boss seja aplicada
            const spriteDoEspectro = SPRITES_STORY[enemyId];
            const temSpriteProprio = spriteDoEspectro && spriteDoEspectro.trim() !== '';

            const bimg = document.getElementById('imgBoss');
            const bcs = document.getElementById('bossCardSprite');

            if (!temSpriteProprio) {
                // Fallback: usa sprite base + classe espectral
                const baseKey = ESPECTRO_MAP[enemyId];
                if (baseKey && typeof SPRITES !== 'undefined' && SPRITES[baseKey]) {
                    if (bimg) {
                        bimg.src = SPRITES[baseKey];
                        bimg.style.display = '';
                        bimg.classList.add('spectral-boss');
                    }
                    if (bcs) {
                        bcs.src = SPRITES[baseKey];
                        bcs.style.display = '';
                        bcs.classList.add('spectral-boss');
                    }
                }
            } else {
                // Tem sprite próprio
                if (bimg) bimg.classList.add('spectral-boss');
                if (bcs) bcs.classList.add('spectral-boss');
            }

            return r;
        };
    }

    // Patch no advanceStoryEnemy original (via wrap) — mesma correção
    if (typeof window.advanceStoryEnemy === 'function' && !window._eventoEspectroPatchAdvance) {
        window._eventoEspectroPatchAdvance = true;
        const _orig = window.advanceStoryEnemy;
        window.advanceStoryEnemy = async function() {
            const r = await _orig.apply(this, arguments);

            // Após avançar, verifica se o novo boss é espectral
            if (typeof storyEnemiesRemaining !== 'undefined' && storyEnemiesRemaining.length > 0) {
                const enemyId = storyEnemiesRemaining[0];
                const enemy = STORY_ENEMIES[enemyId];
                if (enemy && enemy.isSpectral) {
                    const bimg = document.getElementById('imgBoss');
                    const bcs = document.getElementById('bossCardSprite');

                    const temSpriteProprio = SPRITES_STORY[enemyId] && SPRITES_STORY[enemyId].trim() !== '';
                    if (!temSpriteProprio) {
                        const baseKey = ESPECTRO_MAP[enemyId];
                        if (baseKey && typeof SPRITES !== 'undefined' && SPRITES[baseKey]) {
                            if (bimg) {
                                bimg.src = SPRITES[baseKey];
                                bimg.classList.add('spectral-boss');
                            }
                            if (bcs) {
                                bcs.src = SPRITES[baseKey];
                                bcs.classList.add('spectral-boss');
                            }
                        }
                    } else {
                        if (bimg) bimg.classList.add('spectral-boss');
                        if (bcs) bcs.classList.add('spectral-boss');
                    }
                }
            }

            return r;
        };
    }

    // ==============================================================
    // 14. TELA DE SELEÇÃO SEMANAL
    // ==============================================================
    function renderEventoSemanalScreen() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;

        garantirEstruturaEvento();

        const gold = (typeof STORY_PROGRESS !== 'undefined') ? (STORY_PROGRESS.gold || 0) : 0;
        const chaves = getChavesAtuais();
        const diaAtual = getDiaSemanaAtual();
        const pesadeloHoje = pesadeloDisponivelHoje();

        // Ordem de exibição: seg, ter, qua, qui, sex, sab, dom
        const ordem = [1, 2, 3, 4, 5, 6, 0];
        const diasLabel = {
            0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta',
            4: 'Quinta', 5: 'Sexta', 6: 'Sábado',
        };

        let cardsHTML = '';
        ordem.forEach(dia => {
            const boss = getBossPorDia(dia);
            if (!boss) return;

            const isHoje = (dia === diaAtual);
            const prog = getEventoProgresso(boss.id);
            const fasesTotal = 5;  // 4 + boss
            const fasesFeitas = prog.fasesConcluidas.length;
            const completo = fasesFeitas >= fasesTotal;
            const elemCor = {
                FOGO: '#e74c3c', AGUA: '#3498db', TERRA: '#27ae60', AR: '#f1c40f',
            }[boss.elemento] || '#c9a227';

            let statusBadge = '';
            if (completo) statusBadge = '<span class="evento-badge concluido">✅ CONCLUÍDO</span>';
            else if (isHoje) statusBadge = '<span class="evento-badge hoje">🎯 HOJE</span>';
            else if (dia < diaAtual) statusBadge = '<span class="evento-badge perdido">⏰ PERDIDO</span>';
            else statusBadge = '<span class="evento-badge futuro">🔒 EM BREVE</span>';

            cardsHTML += `
                <div class="evento-card ${isHoje ? 'hoje' : ''} ${completo ? 'completo' : ''}"
                     style="--evento-elem-color:${elemCor};">
                    <div class="evento-card-header">
                        <span class="evento-dia">${diasLabel[dia]}</span>
                        ${statusBadge}
                    </div>
                    <div class="evento-card-sprite">${eventoIcon(boss.id, 'large')}</div>
                    <div class="evento-card-name">${boss.nome}</div>
                    <div class="evento-card-titulo">${boss.titulo}</div>
                    <div class="evento-card-stats">
                        <span>HP ${boss.hp}</span>
                        <span>ATK ${boss.atk}</span>
                        <span>${fasesFeitas}/${fasesTotal}</span>
                    </div>
                    <div class="evento-card-elem" style="color:${elemCor};">${boss.elemento}</div>
                    <button class="evento-card-btn"
                            ${isHoje && !completo ? '' : 'disabled'}
                            onclick="eventoEntrarAto('${boss.id}')">
                        ${completo ? '✔ CONCLUÍDO' : (isHoje ? '▶ ENTRAR' : '🔒 BLOQUEADO')}
                    </button>
                </div>
            `;
        });

        // Card do Pesadelo (se hoje)
        let pesadeloHTML = '';
        if (pesadeloHoje) {
            const diaPesadelo = getDiaPesadelo();
            pesadeloHTML = `
                <div class="evento-pesadelo-banner">
                    <div class="evento-pesadelo-icon">${eventoIcon('pesadelo', 'large')}</div>
                    <div class="evento-pesadelo-info">
                        <div class="evento-pesadelo-titulo">🌑 EVENTO MENSAL — PESADELO</div>
                        <div class="evento-pesadelo-sub">A fusão dos Sete Selados despertou hoje!</div>
                        <div class="evento-pesadelo-desc">${EVENTO_PESADELO.descricao}</div>
                    </div>
                    <button class="evento-pesadelo-btn" onclick="eventoEntrarPesadelo()">
                        ⚔️ ENFRENTAR
                    </button>
                </div>
            `;
        } else {
            const diaPesadelo = getDiaPesadelo();
            pesadeloHTML = `
                <div class="evento-pesadelo-aviso">
                    🌑 O Pesadelo aparecerá em <b>${diasLabel[diaPesadelo]}</b> deste mês.
                </div>
            `;
        }

        screen.innerHTML = `
            <div class="story-container">
                <div class="story-header">
                    <h1 class="story-title">🎉 A SEMANA DAS SOMBRAS</h1>
                    <p class="story-subtitle">${EVENTO_LORE.subtitulo}</p>
                    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:14px;">
                        <span class="evento-chaves-badge">🔑 ${chaves} / ${EVENTO_CHAVES_MAX} chaves</span>
                        <span class="evento-ouro-badge">💰 ${gold} ouro</span>
                    </div>
                </div>

                <div class="evento-lore-box">
                    ${EVENTO_LORE.lore}
                </div>

                ${pesadeloHTML}

                <div class="evento-grid">
                    ${cardsHTML}
                </div>

                <div class="evento-progresso-fragmentos">
                    <div class="evento-fragmentos-titulo">🌑 FRAGMENTOS DIVINOS</div>
                    <div class="evento-fragmentos-lista">
                        ${Object.keys(EVENTO_FRAGMENTOS).map(fid => {
                            const tem = STORY_PROGRESS.eventoFragmentos.includes(fid);
                            const f = EVENTO_FRAGMENTOS[fid];
                            return `<span class="evento-fragmento ${tem ? 'tem' : 'nao-tem'}" title="${f.nome}">
                                ${tem ? eventoIcon(fid, 'small') : '❓'}
                            </span>`;
                        }).join('')}
                    </div>
                    <div class="evento-fragmentos-info">
                        ${STORY_PROGRESS.eventoRudaDesbloqueado
                            ? '🎉 <b>Rudá</b> foi desbloqueado!'
                            : `Reúna os 7 Fragmentos Divinos para desbloquear <b>Rudá</b>.`}
                    </div>
                </div>

                <div class="story-footer">
                    <button class="story-back-btn" onclick="renderAldeiaScreen()">← VOLTAR À ALDEIA</button>
                </div>
            </div>
        `;
        screen.classList.add('active');
        screen.style.display = 'flex';
    }

    // ==============================================================
    // 15. TELA DE FASES DO ATO
    // ==============================================================
    function eventoEntrarAto(bossId) {
        const boss = EVENTO_BOSSES[bossId];
        if (!boss) return;

        // Verifica se é o dia
        if (boss.diaSemana !== getDiaSemanaAtual()) {
            if (typeof showToast === 'function') showToast('🔒', 'Este ato não está disponível hoje.', '🔒');
            return;
        }

        renderEventoFasesScreen(bossId);
    }

    function renderEventoFasesScreen(bossId) {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;
        const boss = EVENTO_BOSSES[bossId];
        if (!boss) return;

        garantirEstruturaEvento();
        const prog = getEventoProgresso(bossId);

        // Fases: 4 animais + 1 boss
        const fases = [
            { id: '1', nome: `Fase 1 — ${getStoryEnemyName ? getStoryEnemyName(boss.animais[0]) : boss.animais[0]}`, animal: boss.animais[0] },
            { id: '2', nome: `Fase 2 — ${getStoryEnemyName ? getStoryEnemyName(boss.animais[1]) : boss.animais[1]}`, animal: boss.animais[1] },
            { id: '3', nome: `Fase 3 — ${getStoryEnemyName ? getStoryEnemyName(boss.animais[2]) : boss.animais[2]}`, animal: boss.animais[2] },
            { id: '4', nome: `Fase 4 — ${getStoryEnemyName ? getStoryEnemyName(boss.animais[3]) : boss.animais[3]}`, animal: boss.animais[3] },
            { id: 'boss', nome: `BOSS — ${boss.nome}`, isBoss: true },
        ];

        let cardsHTML = '';
        fases.forEach((fase, idx) => {
            const concluida = prog.fasesConcluidas.includes(fase.id);
            const liberada = (idx === 0) || prog.fasesConcluidas.includes(fases[idx - 1].id);

            let statusClass = '';
            let statusIcon = '';
            let btnDisabled = false;
            let btnLabel = '';

            if (concluida) {
                statusClass = 'completa';
                statusIcon = '✅';
                btnLabel = '↻ REJOGAR';
                // Fases podem ser rejogadas livremente
                btnDisabled = false;
            } else if (liberada) {
                statusClass = 'liberada';
                statusIcon = '🎯';
                btnLabel = '▶ JOGAR';
            } else {
                statusClass = 'bloqueada';
                statusIcon = '🔒';
                btnLabel = '🔒 BLOQUEADA';
                btnDisabled = true;
            }

            const emojiOuIcon = fase.isBoss
                ? eventoIcon(boss.id, 'large')
                : `<span class="evento-fase-animal">${(() => {
                    if (typeof SPRITES_STORY !== 'undefined' && SPRITES_STORY[fase.animal] && SPRITES_STORY[fase.animal].trim() !== '') {
                        return `<img src="${SPRITES_STORY[fase.animal]}" class="evento-fase-sprite">`;
                    }
                    if (typeof EMOJI_STORY !== 'undefined' && EMOJI_STORY[fase.animal]) {
                        return EMOJI_STORY[fase.animal];
                    }
                    return '🐾';
                })()}</span>`;

            cardsHTML += `
                <div class="evento-fase-card ${statusClass}">
                    <div class="evento-fase-header">
                        <span class="evento-fase-num">${fase.isBoss ? '👑 BOSS' : `FASE ${idx + 1}`}</span>
                        <span class="evento-fase-status">${statusIcon}</span>
                    </div>
                    <div class="evento-fase-sprite-wrap">${emojiOuIcon}</div>
                    <div class="evento-fase-name">${fase.nome}</div>
                    ${fase.isBoss && liberada && !concluida
                        ? `<div class="evento-fase-custo">🔑 1 chave</div>`
                        : ''}
                    <button class="evento-fase-btn" ${btnDisabled ? 'disabled' : ''}
                            onclick="eventoIniciarFase('${bossId}', '${fase.id}')">
                        ${btnLabel}
                    </button>
                </div>
            `;
        });

        screen.innerHTML = `
            <div class="story-container">
                <div class="story-header">
                    <h1 class="story-title">${boss.diaLabel} — ${boss.nome}</h1>
                    <p class="story-subtitle">${boss.titulo}</p>
                    <div class="evento-boss-descricao">${boss.descricao}</div>
                </div>

                <div class="evento-lore-box" style="font-size:0.95rem;">
                    ${boss.lore}
                </div>

                <div class="evento-fases-grid">
                    ${cardsHTML}
                </div>

                <div class="story-footer">
                    <button class="story-back-btn" onclick="renderEventoSemanalScreen()">← VOLTAR À SEMANA</button>
                </div>
            </div>
        `;
        screen.classList.add('active');
        screen.style.display = 'flex';
    }

    // ==============================================================
    // 16. HANDLER: INICIAR FASE DO EVENTO
    // --------------------------------------------------------------
    // A lógica real de batalha vem na PARTE 2.
    // Aqui só valida e chama o motor (que será estendido).
    // ==============================================================
    function eventoIniciarFase(bossId, faseId) {
        const boss = EVENTO_BOSSES[bossId];
        if (!boss) return;

        const prog = getEventoProgresso(bossId);
        const faseIdx = faseId === 'boss' ? 4 : parseInt(faseId) - 1;
        const fasesArr = ['1', '2', '3', '4', 'boss'];

        // Verifica liberação
        if (faseIdx > 0 && !prog.fasesConcluidas.includes(fasesArr[faseIdx - 1])) {
            if (typeof showToast === 'function') showToast('🔒', 'Complete a fase anterior.', '🔒');
            return;
        }

        // Se for boss, gasta 1 chave
        if (faseId === 'boss') {
            if (getChavesAtuais() < 1) {
                if (typeof showToast === 'function') showToast('🔑', 'Sem chaves! Aguarde a próxima semana.', '🔑');
                return;
            }
            if (!gastarChave(1)) {
                if (typeof showToast === 'function') showToast('🔑', 'Erro ao gastar chave.', '🔑');
                return;
            }
        }

        // Marca modo evento
        window._eventoMode = true;
        window._eventoAtual = { bossId, faseId };

        // A PARTE 2 vai estender o startStoryPhase pra lidar com isso
        if (typeof eventoIniciarBatalha === 'function') {
            eventoIniciarBatalha(bossId, faseId);
        } else {
            console.warn('[evento] eventoIniciarBatalha não encontrado (PARTE 2 não instalada ainda).');
            if (typeof showToast === 'function') showToast('⚠️', 'PARTE 2 ainda não instalada.', '⚠️');
        }
    }

    // ==============================================================
    // 17. HANDLER: PESADELO
    // ==============================================================
    async function eventoEntrarPesadelo() {
        if (!pesadeloDisponivelHoje()) {
            if (typeof showToast === 'function') showToast('🌑', 'O Pesadelo não está ativo hoje.', '🌑');
            return;
        }

        if (getChavesAtuais() < 1) {
            if (typeof showToast === 'function') showToast('🔑', 'Sem chaves!', '🔑');
            return;
        }

        if (!(await uiConfirm('🌑 ENFRENTAR O PESADELO?\n\nCusta 1 chave. Boss extremamente difícil.\n\nContinuar?'))) return;

        if (!gastarChave(1)) {
            if (typeof showToast === 'function') showToast('🔑', 'Erro ao gastar chave.', '🔑');
            return;
        }

        window._eventoMode = true;
        window._eventoAtual = { bossId: 'pesadelo', faseId: 'boss', isPesadelo: true };

        if (typeof eventoIniciarBatalha === 'function') {
            eventoIniciarBatalha('pesadelo', 'boss');
        } else {
            console.warn('[evento] eventoIniciarBatalha não encontrado.');
            if (typeof showToast === 'function') showToast('⚠️', 'PARTE 2 ainda não instalada.', '⚠️');
        }
    }

    // ==============================================================
    // 18. BOTÃO NA ALDEIA
    // ==============================================================
    (function addEventoButtonToAldeia() {
        const _origRender = window.renderAldeiaScreen;
        if (typeof _origRender !== 'function') return;
        if (window._eventoAldeiaBtn) return;
        window._eventoAldeiaBtn = true;

        window.renderAldeiaScreen = function() {
            const result = _origRender.apply(this, arguments);

            const gridEl = document.querySelector('.story-ald-grid');
            if (!gridEl || gridEl.querySelector('.evento-aldeia-card')) return;

            const diaAtual = getDiaSemanaAtual();
            const chaves = getChavesAtuais();
            const pesadeloHoje = pesadeloDisponivelHoje();
            const bossHoje = getBossDoDia();

            let badge = '';
            if (pesadeloHoje) badge = '🌑 PESADELO ATIVO';
            else if (bossHoje) badge = `Hoje: ${bossHoje.nome}`;
            else badge = 'Evento semanal';

            const card = document.createElement('div');
            card.className = 'story-ald-location evento-aldeia-card';
            card.onclick = () => renderEventoSemanalScreen();
            card.innerHTML = `
                <div class="story-ald-loc-icon">🎉</div>
                <div class="story-ald-loc-info">
                    <div class="story-ald-loc-name">EVENTO SEMANAL</div>
                    <div class="story-ald-loc-desc">${badge} · 🔑 ${chaves}</div>
                </div>
            `;
            gridEl.insertBefore(card, gridEl.firstChild);
            return result;
        };
    })();

    // ==============================================================
    // 19. CSS
    // ==============================================================
    if (!document.getElementById('eventoStyleP1')) {
        const style = document.createElement('style');
        style.id = 'eventoStyleP1';
        style.textContent = `
            /* ---- Ícones ---- */
            .evento-icon { width: 1em; height: 1em; object-fit: contain; vertical-align: -0.15em; display: inline-block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6)); }
            .evento-icon-small { width: 0.9em; height: 0.9em; }
            .evento-icon-large { width: 2.5em; height: 2.5em; }
            .evento-emoji { display: inline-block; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.6); }
            .evento-emoji-small { font-size: 1em; }
            .evento-emoji-large { font-size: 2.5em; }

            /* ---- Botão na Aldeia ---- */
            .evento-aldeia-card {
                border-color: #9b59b6 !important;
                background: linear-gradient(180deg, rgba(155,89,182,0.12), transparent 40%),
                            linear-gradient(180deg, rgba(42,31,16,0.95), rgba(26,18,8,0.95)) !important;
            }
            .evento-aldeia-card:hover {
                border-color: #c39bd3 !important;
                box-shadow: 0 8px 25px rgba(0,0,0,0.5), 0 0 30px rgba(155,89,182,0.4) !important;
            }

            /* ---- Tela semanal ---- */
            .evento-chaves-badge, .evento-ouro-badge {
                padding: 8px 16px;
                background: rgba(10,6,2,0.6);
                border: 1px solid rgba(201,162,39,0.4);
                border-radius: 20px;
                font-family: 'Cinzel', serif;
                font-weight: 700;
                font-size: 0.9rem;
                color: #e8b923;
                letter-spacing: 1px;
            }
            .evento-lore-box {
                padding: 20px 24px;
                margin-bottom: 24px;
                background: rgba(10,6,2,0.5);
                border-left: 4px solid #9b59b6;
                border-radius: 6px;
                font-family: 'EB Garamond', serif;
                color: #d9c89a;
                font-size: 1rem;
                line-height: 1.6;
                font-style: italic;
            }

            .evento-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                gap: 18px;
                margin-bottom: 30px;
            }
            .evento-card {
                position: relative;
                background: linear-gradient(180deg, rgba(201,162,39,.05), transparent 40%),
                            linear-gradient(180deg, rgba(42,31,16,.95), rgba(26,18,8,.95));
                border: 2px solid #3d2d18;
                border-radius: 10px;
                padding: 16px 14px;
                display: flex; flex-direction: column; gap: 10px;
                transition: all 0.3s;
                overflow: hidden;
            }
            .evento-card::before {
                content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
                background: var(--evento-elem-color, #c9a227);
                box-shadow: 0 0 12px var(--evento-elem-color, #c9a227);
                opacity: 0.8;
            }
            .evento-card.hoje {
                border-color: var(--evento-elem-color, #c9a227);
                box-shadow: 0 0 20px rgba(155,89,182,0.3);
            }
            .evento-card.completo { opacity: 0.7; }
            .evento-card-header { display: flex; justify-content: space-between; align-items: center; }
            .evento-dia {
                font-family: 'Cinzel', serif;
                color: var(--evento-elem-color, #c9a227);
                font-size: 0.8rem;
                letter-spacing: 2px;
                font-weight: 700;
            }
            .evento-badge {
                padding: 3px 10px;
                border-radius: 12px;
                font-family: 'Cinzel', serif;
                font-size: 0.7rem;
                font-weight: 700;
                letter-spacing: 1px;
            }
            .evento-badge.hoje { background: rgba(107,163,92,0.2); border: 1px solid #6ba35c; color: #8ac070; }
            .evento-badge.concluido { background: rgba(107,163,92,0.15); border: 1px solid #4a7040; color: #6ba35c; }
            .evento-badge.perdido { background: rgba(168,50,50,0.15); border: 1px solid #a83232; color: #d05050; }
            .evento-badge.futuro { background: rgba(138,122,82,0.15); border: 1px solid #8a7a52; color: #b8a577; }

            .evento-card-sprite { text-align: center; padding: 8px 0; filter: drop-shadow(0 0 12px var(--evento-elem-color, #c9a227)); line-height: 1; }
            .evento-card-name { font-family: 'Cinzel Decorative', serif; color: #f0e2c0; font-size: 1.15rem; text-align: center; letter-spacing: 1px; }
            .evento-card-titulo { font-family: 'EB Garamond', serif; color: #b8a577; font-size: 0.85rem; text-align: center; font-style: italic; margin-top: -6px; }
            .evento-card-stats {
                display: flex; justify-content: space-around; padding: 6px 0;
                border-top: 1px solid rgba(201,162,39,0.15);
                border-bottom: 1px solid rgba(201,162,39,0.15);
                font-family: 'Cinzel', serif; font-size: 0.8rem; color: #d9c89a;
            }
            .evento-card-elem {
                text-align: center; font-family: 'Cinzel', serif;
                font-size: 0.75rem; letter-spacing: 1.5px; font-weight: 700;
            }
            .evento-card-btn {
                margin-top: auto;
                padding: 10px;
                background: linear-gradient(180deg, rgba(232,185,35,0.2), transparent 45%),
                            linear-gradient(135deg, #8a6a2e, #4a3418);
                color: #fff5dc; border: 2px solid #e8b923;
                border-radius: 5px; cursor: pointer;
                font-family: 'Cinzel', serif; font-weight: 700;
                font-size: 0.85rem; letter-spacing: 1.5px;
                transition: all 0.2s;
            }
            .evento-card-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.5), 0 0 20px rgba(232,185,35,0.4); }
            .evento-card-btn:disabled {
                background: #2a1f10; color: #6a5024; border-color: #3d2d18; cursor: not-allowed;
            }

            /* ---- Pesadelo ---- */
            .evento-pesadelo-banner {
                display: flex; align-items: center; gap: 16px;
                padding: 16px 20px;
                margin-bottom: 24px;
                background: linear-gradient(180deg, rgba(142,68,173,0.25), transparent 60%),
                            linear-gradient(135deg, rgba(30,15,40,0.95), rgba(15,8,20,0.95));
                border: 2px solid #8e44ad;
                border-radius: 10px;
                box-shadow: 0 0 30px rgba(142,68,173,0.4);
                flex-wrap: wrap;
            }
            .evento-pesadelo-icon { filter: drop-shadow(0 0 15px rgba(142,68,173,0.7)); }
            .evento-pesadelo-info { flex: 1; min-width: 200px; }
            .evento-pesadelo-titulo { font-family: 'Cinzel Decorative', serif; color: #c39bd3; font-size: 1.1rem; letter-spacing: 1.5px; margin-bottom: 4px; }
            .evento-pesadelo-sub { font-family: 'EB Garamond', serif; color: #d9c89a; font-size: 0.95rem; font-style: italic; margin-bottom: 6px; }
            .evento-pesadelo-desc { font-family: 'EB Garamond', serif; color: #b8a577; font-size: 0.85rem; }
            .evento-pesadelo-btn {
                padding: 12px 20px;
                background: linear-gradient(180deg, rgba(142,68,173,0.4), transparent 45%),
                            linear-gradient(135deg, #6a2a8a, #3a1548);
                color: #f0e0ff; border: 2px solid #8e44ad;
                border-radius: 5px; cursor: pointer;
                font-family: 'Cinzel', serif; font-weight: 700;
                font-size: 0.95rem; letter-spacing: 2px;
                transition: all 0.2s;
            }
            .evento-pesadelo-btn:hover { transform: translateY(-2px); box-shadow: 0 0 25px rgba(142,68,173,0.6); }
            .evento-pesadelo-aviso {
                padding: 12px 16px;
                margin-bottom: 24px;
                background: rgba(10,6,2,0.5);
                border: 1px dashed rgba(142,68,173,0.4);
                border-radius: 6px;
                font-family: 'EB Garamond', serif;
                color: #b8a577;
                font-size: 0.9rem;
                text-align: center;
                font-style: italic;
            }
            .evento-pesadelo-aviso b { color: #c39bd3; }

            /* ---- Fragmentos ---- */
            .evento-progresso-fragmentos {
                background: rgba(10,6,2,0.5);
                border: 1px solid rgba(155,89,182,0.3);
                border-radius: 8px;
                padding: 16px 20px;
                margin-bottom: 24px;
                text-align: center;
            }
            .evento-fragmentos-titulo {
                font-family: 'Cinzel', serif;
                color: #c39bd3;
                font-size: 0.9rem;
                letter-spacing: 2px;
                margin-bottom: 12px;
            }
            .evento-fragmentos-lista { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
            .evento-fragmento {
                display: inline-flex; align-items: center; justify-content: center;
                width: 40px; height: 40px;
                border-radius: 50%;
                font-size: 1.4rem;
                border: 2px solid #3d2d18;
                background: rgba(10,6,2,0.7);
                transition: all 0.2s;
            }
            .evento-fragmento.tem {
                border-color: #9b59b6;
                background: rgba(155,89,182,0.2);
                box-shadow: 0 0 15px rgba(155,89,182,0.5);
            }
            .evento-fragmento.nao-tem { opacity: 0.4; }
            .evento-fragmentos-info {
                font-family: 'EB Garamond', serif;
                color: #b8a577;
                font-size: 0.9rem;
                font-style: italic;
            }

            /* ---- Tela de fases ---- */
            .evento-boss-descricao {
                font-family: 'EB Garamond', serif;
                color: #d9c89a;
                font-size: 1rem;
                font-style: italic;
                text-align: center;
                max-width: 600px;
                margin: 10px auto 0;
            }
            .evento-fases-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 14px;
                margin-bottom: 24px;
            }
            .evento-fase-card {
                background: linear-gradient(180deg, rgba(201,162,39,.04), transparent 40%),
                            linear-gradient(180deg, rgba(42,31,16,.85), rgba(26,18,8,.85));
                border: 2px solid #3d2d18;
                border-radius: 8px;
                padding: 14px;
                display: flex; flex-direction: column; gap: 10px;
                transition: all 0.3s;
            }
            .evento-fase-card.completa { border-color: #4a7040; }
            .evento-fase-card.liberada { border-color: #c9a227; }
            .evento-fase-card.bloqueada { opacity: 0.5; }
            .evento-fase-header { display: flex; justify-content: space-between; align-items: center; }
            .evento-fase-num { font-family: 'Cinzel', serif; color: #e8b923; font-size: 0.8rem; letter-spacing: 1.5px; font-weight: 700; }
            .evento-fase-status { font-size: 1.1rem; }
            .evento-fase-sprite-wrap { text-align: center; padding: 8px 0; line-height: 1; min-height: 40px; display: flex; align-items: center; justify-content: center; }
            .evento-fase-animal { font-size: 2rem; }
            .evento-fase-sprite { max-width: 48px; max-height: 48px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6)); }
            .evento-fase-name { font-family: 'Cinzel', serif; color: #f0e2c0; font-size: 0.9rem; text-align: center; letter-spacing: 0.5px; }
            .evento-fase-custo { font-family: 'EB Garamond', serif; color: #e8b923; font-size: 0.8rem; text-align: center; font-style: italic; }
            .evento-fase-btn {
                padding: 8px;
                background: linear-gradient(180deg, rgba(232,185,35,0.2), transparent 45%),
                            linear-gradient(135deg, #8a6a2e, #4a3418);
                color: #fff5dc; border: 2px solid #e8b923;
                border-radius: 4px; cursor: pointer;
                font-family: 'Cinzel', serif; font-weight: 700;
                font-size: 0.8rem; letter-spacing: 1.5px;
                transition: all 0.2s;
            }
            .evento-fase-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 15px rgba(232,185,35,0.3); }
            .evento-fase-btn:disabled { background: #2a1f10; color: #6a5024; border-color: #3d2d18; cursor: not-allowed; }

            @media (max-width: 600px) {
                .evento-grid { grid-template-columns: 1fr; }
                .evento-fases-grid { grid-template-columns: repeat(2, 1fr); }
                .evento-pesadelo-banner { flex-direction: column; text-align: center; }
            }
        `;
        document.head.appendChild(style);
    }

    // ==============================================================
    // 20. GARANTIR ESTRUTURA AO CARREGAR
    // ==============================================================
    setTimeout(() => {
        garantirEstruturaEvento();
        getChavesAtuais();  // inicializa as chaves
    }, 500);

    // ==============================================================
    // 21. EXPOR NO WINDOW
    // ==============================================================
    window.renderEventoSemanalScreen = renderEventoSemanalScreen;
    window.renderEventoFasesScreen = renderEventoFasesScreen;
    window.eventoEntrarAto = eventoEntrarAto;
    window.eventoIniciarFase = eventoIniciarFase;
    window.eventoEntrarPesadelo = eventoEntrarPesadelo;
    window.eventoIcon = eventoIcon;
    window.getChavesAtuais = getChavesAtuais;
    window.gastarChave = gastarChave;
    window.getChaveData = getChaveData;
    window.salvarChaveData = salvarChaveData;
    window.resetarChavesManualmente = resetarChavesManualmente;
    window.getDiaSemanaAtual = getDiaSemanaAtual;
    window.getBossDoDia = getBossDoDia;
    window.getDiaPesadelo = getDiaPesadelo;
    window.pesadeloDisponivelHoje = pesadeloDisponivelHoje;
    window.EVENTO_BOSSES = EVENTO_BOSSES;
    window.EVENTO_PESADELO = EVENTO_PESADELO;
    window.EVENTO_ARMAS = EVENTO_ARMAS;
    window.EVENTO_FRAGMENTOS = EVENTO_FRAGMENTOS;
    window.EVENTO_SPRITES = EVENTO_SPRITES;
    window.EVENTO_LORE = EVENTO_LORE;
    window.getEventoProgresso = getEventoProgresso;
    window.marcarFaseEventoConcluida = marcarFaseEventoConcluida;
    window.isFaseEventoConcluida = isFaseEventoConcluida;
    window.garantirEstruturaEvento = garantirEstruturaEvento;
    window.EVENTO_ANIMAL_BONUS = EVENTO_ANIMAL_BONUS;

    // ==============================================================
    // 22. LOG FINAL
    // ==============================================================
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V9.5-P1] ATO DE EVENTO SEMANAL — PARTE 1/2');
    console.log('═══════════════════════════════════════════════════');
    console.log('• 7 bosses (1 por dia da semana)');
    console.log('• Pesadelo mensal (dia aleatório determinístico)');
    console.log('• Sistema de chaves: 10/semana, máx 30');
    console.log('• 21 armas (7 × 3 tipos)');
    console.log('• 7 fragmentos divinos');
    console.log('• Herói Rudá (fixo mago)');
    console.log('• Tela semanal + tela de fases');
    console.log('• Botão na Aldeia');
    console.log('• Correção dos espectros do Ato 13');
    console.log('');
    console.log('📅 Hoje é:', ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][getDiaSemanaAtual()]);
    console.log('🎯 Boss do dia:', getBossDoDia()?.nome || 'nenhum');
    console.log('🌑 Pesadelo:', pesadeloDisponivelHoje() ? 'ATIVO HOJE' : `dia ${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][getDiaPesadelo()]}`);
    console.log('🔑 Chaves:', getChavesAtuais(), '/', EVENTO_CHAVES_MAX);
    console.log('');
    console.log('💡 Aguardando PARTE 2 (skills, IA, drop system, batalha)');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — BLOCO 15 (V9.5 — EVENTO SEMANAL — PARTE 2A)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js, depois da PARTE 1.
//
// PARTE 2A contém:
//   • Seletor de dificuldade do evento
//   • Skills dos 7 bosses adaptadas 1×1 (14 skills)
//   • Ao Ao com eco visual + ATK ×1.5
//   • Pesadelo (sorteia skill aleatória)
//   • IA do boss do evento (raid-style)
//   • Handler de batalha: iniciar fase, progressão acumulativa
//   • Bônus +10 HP / +1 ATK nos animais
//   • Fix definitivo do espectro (MutationObserver + hooks fortes)
//
// ⚠️ PARTE 2B (depois) virá com:
//   • Drop system (arma 5%/10%/20%, item especial 5%/10%/20%)
//   • Telas de vitória/derrota do evento
//   • Rudá desbloqueável
//   • Integração com storyEnemyAI/applyDmg/manageTurns
// =================================================================

(function installEventoParte2A() {
    if (window._eventoSemanalV95P2A) return;
    window._eventoSemanalV95P2A = true;

    // ==============================================================
    // 1. DIFICULDADE DO EVENTO
    // ==============================================================
    const EVENTO_DIFICULDADES = {
        normal: {
            id: 'normal', nome: 'Normal', icon: '⚔️',
            hpMult: 1.0, atkMult: 1.0, xpMult: 1.5, ouroMult: 1.5,
            dropArma: 0.05, dropItem: 0.05,
            color: '#c9a227',
        },
        dificil: {
            id: 'dificil', nome: 'Difícil', icon: '🔥',
            hpMult: 1.5, atkMult: 1.3, xpMult: 2.25, ouroMult: 2.25,
            dropArma: 0.10, dropItem: 0.10,
            color: '#e67e22',
        },
        pesadelo: {
            id: 'pesadelo', nome: 'Pesadelo', icon: '💀',
            hpMult: 2.2, atkMult: 1.6, xpMult: 3.0, ouroMult: 3.0,
            dropArma: 0.20, dropItem: 0.20,
            color: '#a83232',
        },
    };

    function getDificuldadeEvento() {
        garantirEstruturaEvento();
        if (!STORY_PROGRESS.eventoDificuldade || !EVENTO_DIFICULDADES[STORY_PROGRESS.eventoDificuldade]) {
            STORY_PROGRESS.eventoDificuldade = 'normal';
        }
        return EVENTO_DIFICULDADES[STORY_PROGRESS.eventoDificuldade];
    }

    function setDificuldadeEvento(id) {
        if (!EVENTO_DIFICULDADES[id]) return false;
        garantirEstruturaEvento();
        STORY_PROGRESS.eventoDificuldade = id;
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        return true;
    }

    // ==============================================================
    // 2. ESTADO DA BATALHA DO EVENTO
    // ==============================================================
    let _eventoBatalha = {
        ativa: false,
        bossId: null,
        faseId: null,
        isPesadelo: false,
        dificuldade: null,
        // Ao Ao
        aoAoDividido: false,
        aoAoEco: null,        // { x, y } do eco visual
        // Pesadelo
        pesadeloTurnos: 0,
        // Controle
        publicandoResultado: false,
    };

    // Salva os dados originais do boss pra restaurar ao sair
    let _eventoBossSnapshot = null;

    function eventoSnapshotBoss() {
        if (typeof boss === 'undefined') return;
        if (_eventoBossSnapshot) return;
        _eventoBossSnapshot = {
            type: boss.type, hp: boss.hp, maxHp: boss.maxHp,
            x: boss.x, y: boss.y, dead: boss.dead,
        };
    }

    function eventoRestaurarBoss() {
        if (typeof boss === 'undefined') return;
        if (!_eventoBossSnapshot) return;
        Object.assign(boss, _eventoBossSnapshot);
        _eventoBossSnapshot = null;
    }

    // ==============================================================
    // 3. SKILLS DOS BOSSES (adaptadas 1×1)
    // ==============================================================

    // -----------------------------------------------------------------
    // Helper: centro do boss
    // -----------------------------------------------------------------
    function _centroBoss() {
        return { x: boss.x, y: boss.y };
    }

    // -----------------------------------------------------------------
    // Helper: aplicar dano em tiles
    // -----------------------------------------------------------------
    function _dmgEmTiles(tiles, dano, skill) {
        if (!tiles || tiles.length === 0) return;
        const set = new Set(tiles.map(t => `${t.x},${t.y}`));
        players.forEach(p => {
            if (p.dead) return;
            if (set.has(`${p.x},${p.y}`)) {
                let danoFinal = dano;
                if (skill && skill.elementoPerigo && grid[p.y * 8 + p.x] === skill.elementoPerigo) {
                    danoFinal = Math.ceil(dano * 1.5);
                }
                if (typeof applyDmg === 'function') applyDmg(p, danoFinal);
            }
        });
    }

    // -----------------------------------------------------------------
    // Helper: aplicar dano global
    // -----------------------------------------------------------------
    function _dmgGlobal(dano) {
        players.forEach(p => { if (!p.dead && typeof applyDmg === 'function') applyDmg(p, dano); });
    }

    // -----------------------------------------------------------------
    // Helper: converter tiles em massa
    // -----------------------------------------------------------------
    async function _converterTiles(de, para, opts) {
        opts = opts || {};
        const stagger = opts.stagger || 30;
        const indices = [];
        for (let i = 0; i < 64; i++) if (grid[i] === de) indices.push(i);
        indices.forEach((idx, i) => {
            setTimeout(() => {
                if (typeof spawnTileFlip === 'function') spawnTileFlip(idx % 8, Math.floor(idx / 8));
                grid[idx] = para;
                const tile = document.querySelectorAll('#grid .tile')[idx];
                if (tile) tile.className = `tile bg-${para}`;
            }, i * stagger);
        });
        await _sleep(stagger * indices.length + 400);
    }

    function _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    // -----------------------------------------------------------------
    // Helper: linha, coluna, área, cruz, diagonal
    // -----------------------------------------------------------------
    function _linha(cx, cy, horizontal) {
        const t = [];
        for (let i = 0; i < 8; i++) {
            if (horizontal) t.push({ x: i, y: cy });
            else t.push({ x: cx, y: i });
        }
        return t;
    }

    function _cruz(cx, cy) {
        const t = [];
        for (let i = 0; i < 8; i++) {
            t.push({ x: cx, y: i });
            t.push({ x: i, y: cy });
        }
        const seen = new Set();
        return t.filter(x => { const k = `${x.x},${x.y}`; if (seen.has(k)) return false; seen.add(k); return true; });
    }

    function _area(cx, cy, r) {
        const t = [];
        for (let dx = -r; dx <= r; dx++) {
            for (let dy = -r; dy <= r; dy++) {
                const nx = cx + dx, ny = cy + dy;
                if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) t.push({ x: nx, y: ny });
            }
        }
        return t;
    }

    function _diagonal(cx, cy, len) {
        const t = [];
        [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dx, dy]) => {
            for (let i = 1; i <= len; i++) {
                const nx = cx + dx * i, ny = cy + dy * i;
                if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) t.push({ x: nx, y: ny });
            }
        });
        return t;
    }

    function _spawnFx(key, cls, x, y, opts) {
        if (typeof spawnFxAt === 'function') spawnFxAt(key, cls, x, y, opts || {});
    }

    // =================================================================
    // SKILLS DO TEJU JAGUA
    // =================================================================

    // Sete Cabeças: coluna do boss + 2 colunas adjacentes + linha do boss
    async function evento_teju_sete_cabecas(enemy, skill) {
        if (typeof addLog === 'function') addLog(`🔥 Teju Jagua: ${skill.nome}!`);
        if (typeof playSfx === 'function') { try { playSfx('minoa1'); } catch(e) {} }

        const c = _centroBoss();
        const tiles = [];
        // 3 colunas centrais
        [c.x - 1, c.x, c.x + 1].forEach(col => {
            if (col >= 0 && col < 8) {
                for (let y = 0; y < 8; y++) tiles.push({ x: col, y });
            }
        });
        // Linha do boss
        for (let x = 0; x < 8; x++) {
            if (!tiles.some(t => t.x === x && t.y === c.y)) tiles.push({ x, y: c.y });
        }

        tiles.forEach((t, i) => setTimeout(() => {
            _spawnFx('flame_short', 'fx-flame-short', t.x, t.y, { duration: 700 });
        }, i * 40));

        await _sleep(500);
        _dmgEmTiles(tiles, skill.danoBase || enemy.atk, skill);
        await _sleep(200);
        await _converterTiles('TERRA', 'FOGO', { stagger: 40 });
    }

    // Ímã de Almas: puxa 2 tiles + dano
    async function evento_teju_ima_almas(enemy, skill) {
        if (typeof addLog === 'function') addLog(`🔥 Teju Jagua: ${skill.nome}!`);
        if (typeof playSfx === 'function') { try { playSfx('garras'); } catch(e) {} }

        const c = _centroBoss();
        _spawnFx('shockwave', 'fx-shockwave', c.x, c.y, { duration: 700, scale: 1.8 });

        await _sleep(400);
        _dmgGlobal(Math.max(1, Math.floor(enemy.atk / 2)));
        await _sleep(200);

        players.forEach(p => {
            if (p.dead) return;
            for (let i = 0; i < 2; i++) {
                const dx = Math.sign(c.x - p.x);
                const dy = Math.sign(c.y - p.y);
                const nx = p.x + dx, ny = p.y + dy;
                if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
                if (typeof isOccupied === 'function' && isOccupied(nx, ny, p.id)) break;
                p.x = nx; p.y = ny;
                if (p.x === c.x && p.y === c.y) break;
            }
        });
        if (typeof updateVisuals === 'function') updateVisuals();
    }

    // =================================================================
    // SKILLS DO MBÓI TU'Ĩ
    // =================================================================

    // Bico Arco-Íris: 2 linhas paralelas + dano + empurra
    async function evento_mboi_bico_arco_iris(enemy, skill) {
        if (typeof addLog === 'function') addLog(`💧 Mbói Tu'ĩ: ${skill.nome}!`);
        if (typeof playSfx === 'function') { try { playSfx('iara1'); } catch(e) {} }

        const c = _centroBoss();
        const tiles = [];
        [c.y - 1, c.y + 1].forEach(row => {
            if (row >= 0 && row < 8) {
                for (let x = 0; x < 8; x++) tiles.push({ x, y: row });
            }
        });
        // Linha do boss também
        for (let x = 0; x < 8; x++) {
            if (!tiles.some(t => t.x === x && t.y === c.y)) tiles.push({ x, y: c.y });
        }

        tiles.forEach((t, i) => setTimeout(() => {
            _spawnFx('impact', 'fx-impact', t.x, t.y, { duration: 500, scale: 0.7 });
        }, i * 40));

        await _sleep(500);
        _dmgEmTiles(tiles, skill.danoBase || enemy.atk, skill);
        await _sleep(200);

        // Empurra
        const dirs = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
        players.forEach(p => {
            if (p.dead) return;
            if (!tiles.some(t => t.x === p.x && t.y === p.y)) return;
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            for (let i = 0; i < 2; i++) {
                const nx = p.x + dir.dx, ny = p.y + dir.dy;
                if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
                if (typeof isOccupied === 'function' && isOccupied(nx, ny, p.id)) break;
                p.x = nx; p.y = ny;
            }
        });
        if (typeof updateVisuals === 'function') updateVisuals();
    }

    // Inundação: FOGO → AGUA + dano nos afetados
    async function evento_mboi_inundacao(enemy, skill) {
        if (typeof addLog === 'function') addLog(`💧 Mbói Tu'ĩ: ${skill.nome}!`);
        if (typeof playSfx === 'function') { try { playSfx('iara2'); } catch(e) {} }

        const afetados = players.filter(p => !p.dead && grid[p.y * 8 + p.x] === 'FOGO');

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                setTimeout(() => {
                    _spawnFx('splash_wave', 'fx-splash-wave', x, y, { duration: 800, scale: 0.9 });
                }, (x + y) * 30);
            }
        }

        await _sleep(500);
        await _converterTiles('FOGO', 'AGUA', { stagger: 25 });
        await _sleep(200);

        afetados.forEach(p => {
            if (typeof applyDmg === 'function') applyDmg(p, skill.danoAosAfetados || 1);
        });
    }

    // =================================================================
    // SKILLS DO MOÑÁI
    // =================================================================

    // Voo Rasante: teleporta + dano 3×3 onde aterrissou
    async function evento_monai_voo_rasante(enemy, skill) {
        if (typeof addLog === 'function') addLog(`🌪️ Moñái: ${skill.nome}!`);
        if (typeof playSfx === 'function') { try { playSfx('minoa2'); } catch(e) {} }

        // fade out
        const tokBoss = document.getElementById('tokenBoss');
        if (tokBoss) tokBoss.style.opacity = '0.2';
        await _sleep(300);

        // Escolhe posição
        let nx, ny, tent = 0;
        do {
            nx = Math.floor(Math.random() * 6) + 1;  // 1-6 (evita bordas)
            ny = Math.floor(Math.random() * 6) + 1;
            tent++;
        } while (tent < 30 && players.some(p => !p.dead && Math.abs(p.x - nx) <= 1 && Math.abs(p.y - ny) <= 1));

        boss.x = nx; boss.y = ny;
        if (tokBoss) tokBoss.style.opacity = '1';
        if (typeof updateVisuals === 'function') updateVisuals();
        await _sleep(350);

        // Dano 3×3
        const tiles = _area(nx, ny, 1);
        tiles.forEach((t, i) => setTimeout(() => {
            _spawnFx('impact', 'fx-impact', t.x, t.y, { duration: 600, scale: 1.1 });
            _spawnFx('shockwave', 'fx-shockwave', t.x, t.y, { duration: 600, scale: 0.8 });
        }, i * 40));

        await _sleep(500);
        _dmgEmTiles(tiles, skill.danoBase || enemy.atk, skill);

        // Empurra pra fora da área
        players.forEach(p => {
            if (p.dead) return;
            if (!tiles.some(t => t.x === p.x && t.y === p.y)) return;
            const dx = Math.sign(p.x - nx), dy = Math.sign(p.y - ny);
            for (let i = 0; i < 2; i++) {
                const ex = p.x + dx, ey = p.y + dy;
                if (ex < 0 || ex >= 8 || ey < 0 || ey >= 8) break;
                if (typeof isOccupied === 'function' && isOccupied(ex, ey, p.id)) break;
                p.x = ex; p.y = ey;
            }
        });
        if (typeof updateVisuals === 'function') updateVisuals();
    }

    // Sopro de Tempestade: dano global + empurra + embaralha área
    async function evento_monai_sopro_tempestade(enemy, skill) {
        if (typeof addLog === 'function') addLog(`🌪️ Moñái: ${skill.nome}!`);
        if (typeof playSfx === 'function') { try { playSfx('saci1'); } catch(e) {} }

        const c = _centroBoss();
        _spawnFx('shockwave', 'fx-shockwave', c.x, c.y, { duration: 900, scale: 2.2 });

        await _sleep(400);
        _dmgGlobal(skill.dano || Math.ceil(enemy.atk / 2));
        await _sleep(200);

        players.forEach(p => {
            if (p.dead) return;
            const dirX = Math.sign(p.x - c.x), dirY = Math.sign(p.y - c.y);
            for (let i = 0; i < 2; i++) {
                const ex = p.x + dirX, ey = p.y + dirY;
                if (ex < 0 || ex >= 8 || ey < 0 || ey >= 8) break;
                if (typeof isOccupied === 'function' && isOccupied(ex, ey, p.id)) break;
                p.x = ex; p.y = ey;
            }
        });

        // Embaralha área 5×5 ao redor do boss
        const pool = ['FOGO', 'AGUA', 'TERRA', 'AR'];
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const nx = c.x + dx, ny = c.y + dy;
                if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) continue;
                const idx = ny * 8 + nx;
                const novoEl = pool[Math.floor(Math.random() * pool.length)];
                grid[idx] = novoEl;
                const tile = document.querySelectorAll('#grid .tile')[idx];
                if (tile) {
                    tile.className = `tile bg-${novoEl}`;
                    if (typeof spawnTileFlip === 'function') spawnTileFlip(nx, ny);
                }
            }
        }

        await _sleep(200);
        if (typeof updateVisuals === 'function') updateVisuals();
    }

    // =================================================================
    // SKILLS DO JASY JATERÊ
    // =================================================================

    // Salto Solar: teleporta diagonal + dano 3×3 + empurra
    async function evento_jasy_salto_solar(enemy, skill) {
        if (typeof addLog === 'function') addLog(`☀️ Jasy Jaterê: ${skill.nome}!`);
        if (typeof playSfx === 'function') { try { playSfx('minoa2'); } catch(e) {} }

        const dirs = [{dx:1,dy:1},{dx:1,dy:-1},{dx:-1,dy:1},{dx:-1,dy:-1}];
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        const novoX = Math.max(0, Math.min(7, boss.x + dir.dx * 3));
        const novoY = Math.max(0, Math.min(7, boss.y + dir.dy * 3));

        boss.x = novoX; boss.y = novoY;
        if (typeof updateVisuals === 'function') updateVisuals();
        await _sleep(400);

        const tiles = _area(novoX, novoY, 1);
        tiles.forEach((t, i) => setTimeout(() => {
            _spawnFx('flame_short', 'fx-flame-short', t.x, t.y, { duration: 600, scale: 1.1 });
        }, i * 40));

        await _sleep(500);
        _dmgEmTiles(tiles, skill.danoBase || enemy.atk, skill);
    }

    // Clarão Cegante: dano global + FX em cada herói + zera skill do herói por 1 turno
    async function evento_jasy_clarao_cegante(enemy, skill) {
        if (typeof addLog === 'function') addLog(`☀️ Jasy Jaterê: ${skill.nome}!`);
        if (typeof playSfx === 'function') { try { playSfx('skill1'); } catch(e) {} }

        const c = _centroBoss();
        _spawnFx('impact', 'fx-impact', c.x, c.y, { duration: 900, scale: 3.5 });
        _spawnFx('shockwave', 'fx-shockwave', c.x, c.y, { duration: 1000, scale: 3 });

        players.forEach(p => {
            if (!p.dead) _spawnFx('element_pulse', 'fx-element-pulse', p.x, p.y, { duration: 700, scale: 1.2 });
        });

        await _sleep(600);

        // Dano: se herói em FOGO, dobra
        players.forEach(p => {
            if (p.dead) return;
            let dano = skill.dano || enemy.atk;
            if (grid[p.y * 8 + p.x] === 'FOGO') {
                dano = dano * 2;
                if (typeof addLog === 'function') addLog(`☀️ ${p.name} em FOGO! Dano dobrado!`);
            }
            if (typeof applyDmg === 'function') applyDmg(p, dano);
        });
    }

    // =================================================================
    // SKILLS DO KURUPÍ
    // =================================================================

    // Raízes Estranguladoras: prende heróis + dano por turno
    async function evento_kurupi_raizes(enemy, skill) {
        if (typeof addLog === 'function') addLog(`🌱 Kurupí: ${skill.nome}!`);
        if (typeof playSfx === 'function') { try { playSfx('minoa2'); } catch(e) {} }

        players.forEach(p => {
            if (p.dead) return;
            p.preso = true;
            _spawnFx('coil_wrap', 'fx-coil-wrap', p.x, p.y, { duration: 800, scale: 1.3 });
            if (typeof applyDmg === 'function') applyDmg(p, skill.danoPorTurno || 1);
        });

        if (typeof addLog === 'function') addLog(`🌱 Heróis presos! Clique no próprio tile pra se libertar.`);
        await _sleep(500);
    }

    // Chamado da Mata: invoca animal aliado (max 2)
    async function evento_kurupi_chamado(enemy, skill) {
        if (typeof addLog === 'function') addLog(`🌱 Kurupí: ${skill.nome}!`);
        if (typeof playSfx === 'function') { try { playSfx('cucask1'); } catch(e) {} }

        // Conta animais invocados
        if (!window._eventoAnimais) window._eventoAnimais = [];
        const vivos = window._eventoAnimais.filter(a => !a.dead);
        if (vivos.length >= 2) {
            if (typeof addLog === 'function') addLog(`🌱 Kurupí: já há 2 animais. Skill falhou.`);
            return;
        }

        const c = _centroBoss();
        const cands = [
            { x: c.x - 1, y: c.y }, { x: c.x + 1, y: c.y },
            { x: c.x, y: c.y - 1 }, { x: c.x, y: c.y + 1 },
        ].filter(p => p.x >= 0 && p.x < 8 && p.y >= 0 && p.y < 8);

        if (cands.length === 0) return;
        const pos = cands[Math.floor(Math.random() * cands.length)];

        window._eventoAnimais.push({
            id: 'evt_animal_' + Date.now(),
            x: pos.x, y: pos.y,
            hp: 15, maxHp: 15, atk: 2,
            dead: false,
        });

        _spawnFx('heal_orb', 'fx-heal-orb', pos.x, pos.y, { duration: 700 });
        _spawnFx('impact', 'fx-impact', pos.x, pos.y, { duration: 600, scale: 1.2 });
        _renderEventoAnimais();
        await _sleep(300);
    }

    function _renderEventoAnimais() {
        const board = document.getElementById('board');
        if (!board) return;
        board.querySelectorAll('.token.evento-animal').forEach(t => t.remove());
        if (!window._eventoAnimais || window._eventoAnimais.length === 0) return;
        const s = (typeof getStep === 'function') ? getStep() : 59;
        window._eventoAnimais.forEach((a, i) => {
            if (a.dead) return;
            const tok = document.createElement('div');
            tok.className = 'token evento-animal';
            tok.style.left = (a.x * s + 8) + 'px';
            tok.style.top = (a.y * s + 8) + 'px';
            tok.style.width = s + 'px';
            tok.style.height = s + 'px';
            tok.style.zIndex = '12';
            tok.style.pointerEvents = 'none';
            const hpPct = Math.max(0, (a.hp / a.maxHp) * 100);
            tok.innerHTML = `
                <div class="hp-container" style="width:80%;"><div class="hp-bar" style="width:${hpPct}%;"></div></div>
                <span style="font-size:2rem;line-height:1;filter:drop-shadow(0 0 6px rgba(76,175,80,0.8));">🌿</span>
            `;
            board.appendChild(tok);
        });
    }

    // =================================================================
    // SKILLS DO AO AO
    // =================================================================

    // Investida Diagonal: move + dano 2×2 + ricochete
    async function evento_aoao_investida(enemy, skill) {
        if (typeof addLog === 'function') addLog(`🐑 Ao Ao: ${skill.nome}!`);
        if (typeof playSfx === 'function') { try { playSfx('minoa1'); } catch(e) {} }

        let dx = Math.random() < 0.5 ? 1 : -1;
        let dy = Math.random() < 0.5 ? 1 : -1;
        const tiles = [];

        for (let passo = 0; passo < 2; passo++) {
            let nx = boss.x + dx, ny = boss.y + dy;
            if (nx < 0 || nx >= 8) { dx = -dx; nx = boss.x + dx; }
            if (ny < 0 || ny >= 8) { dy = -dy; ny = boss.y + dy; }

            // Dano 2×2 a partir de (nx, ny) — mas boss é 1×1, então dano no próprio tile + 1 adjacente
            tiles.push({ x: nx, y: ny });
            tiles.push({ x: nx + 1, y: ny });
            tiles.push({ x: nx, y: ny + 1 });
            tiles.push({ x: nx + 1, y: ny + 1 });

            boss.x = Math.max(0, Math.min(7, nx));
            boss.y = Math.max(0, Math.min(7, ny));
            _spawnFx('impact', 'fx-impact', boss.x, boss.y, { duration: 400, scale: 1.2 });
            if (typeof updateVisuals === 'function') updateVisuals();
            await _sleep(200);
        }

        await _sleep(300);
        _dmgEmTiles(tiles, skill.danoBase || enemy.atk, skill);
    }

    // Lã Energizada: 4 projéteis diagonais
    async function evento_aoao_la(enemy, skill) {
        if (typeof addLog === 'function') addLog(`🐑 Ao Ao: ${skill.nome}!`);
        if (typeof playSfx === 'function') { try { playSfx('atka'); } catch(e) {} }

        const c = _centroBoss();
        const dirs = [{dx:1,dy:1},{dx:1,dy:-1},{dx:-1,dy:1},{dx:-1,dy:-1}];
        const tiles = [];

        for (const dir of dirs) {
            for (let i = 1; i <= 2; i++) {
                const nx = c.x + dir.dx * i, ny = c.y + dir.dy * i;
                if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
                tiles.push({ x: nx, y: ny });
                setTimeout(() => {
                    _spawnFx('impact', 'fx-impact', nx, ny, { duration: 500, scale: 0.8 });
                }, i * 100);
            }
        }

        await _sleep(500);
        _dmgEmTiles(tiles, skill.danoBase || enemy.atk, skill);
    }

    // Fissão Voraz — Ao Ao se divide em 2 metades (eco visual + ATK ×1.5)
    async function evento_aoao_fissao() {
        if (_eventoBatalha.aoAoDividido) return;
        if (!boss || boss.dead) return;
        if (boss.hp / boss.maxHp > 0.5) return;

        if (typeof addLog === 'function') addLog(`🐑 Ao Ao: FISSÃO VORAZ!`);
        if (typeof playSfx === 'function') { try { playSfx('skill1'); } catch(e) {} }

        _spawnFx('impact', 'fx-impact', boss.x, boss.y, { duration: 900, scale: 2.5 });
        await _sleep(600);

        _eventoBatalha.aoAoDividido = true;

        // Eco visual: 2 tiles ao lado
        const ecoX = boss.x + (boss.x < 4 ? 2 : -2);
        const ecoY = boss.y;
        _eventoBatalha.aoAoEco = { x: ecoX, y: ecoY };

        // ATK ×1.5
        boss._eventoAtkOriginal = boss._eventoAtkOriginal || enemyAtkAtual();
        const novoAtk = Math.ceil(boss._eventoAtkOriginal * 1.5);

        // Renderiza eco
        _renderAoAoEco();

        if (typeof addLog === 'function') addLog(`🐑 Ao Ao se divide! ATK aumentou! (${novoAtk})`);
        if (typeof updateBossCard === 'function') updateBossCard();
    }

    function _renderAoAoEco() {
        const board = document.getElementById('board');
        if (!board) return;
        board.querySelectorAll('.token.evento-eco-aoao').forEach(t => t.remove());
        if (!_eventoBatalha.aoAoEco) return;
        const eco = _eventoBatalha.aoAoEco;
        const s = (typeof getStep === 'function') ? getStep() : 59;
        const tok = document.createElement('div');
        tok.className = 'token evento-eco-aoao';
        tok.style.left = (eco.x * s + 8) + 'px';
        tok.style.top = (eco.y * s + 8) + 'px';
        tok.style.width = s + 'px';
        tok.style.height = s + 'px';
        tok.style.zIndex = '15';
        tok.style.opacity = '0.55';
        tok.style.pointerEvents = 'none';
        tok.innerHTML = `<span style="font-size:2.2rem;line-height:1;filter:drop-shadow(0 0 10px rgba(76,175,80,0.9)) hue-rotate(90deg);">🐑</span>`;
        board.appendChild(tok);
    }

    function enemyAtkAtual() {
        if (!boss) return 4;
        if (_eventoBatalha && _eventoBatalha.bossId) {
            const cfg = (typeof EVENTO_BOSSES !== 'undefined' && EVENTO_BOSSES[_eventoBatalha.bossId]);
            if (cfg) {
                const diff = getDificuldadeEvento();
                return Math.ceil(cfg.atk * diff.atkMult);
            }
        }
        return 4;
    }

    // =================================================================
    // SKILLS DO LUISON
    // =================================================================

    // Colheita Sombria: 3 pares de colunas
    async function evento_luison_colheita(enemy, skill) {
        if (typeof addLog === 'function') addLog(`🌑 Luison: ${skill.nome}!`);
        if (typeof playSfx === 'function') { try { playSfx('minoa1'); } catch(e) {} }

        const c = _centroBoss();
        const tiles = [];
        const cols = [c.x - 2, c.x + 2, c.x + 4].filter(x => x >= 0 && x < 8);
        cols.forEach(col => {
            for (let y = 0; y < 8; y++) {
                tiles.push({ x: col, y });
                setTimeout(() => {
                    _spawnFx('spectral_veil', 'fx-spectral-veil', col, y, { duration: 600, scale: 0.9 });
                }, y * 30);
            }
        });

        await _sleep(700);
        _dmgEmTiles(tiles, skill.danoBase || enemy.atk, skill);
    }

    // Legado dos Filhos: sorteia skill de outro boss
    async function evento_luison_legado(enemy, skill) {
        if (typeof addLog === 'function') addLog(`🌑 Luison: ${skill.nome}!`);
        if (typeof playSfx === 'function') { try { playSfx('skill1'); } catch(e) {} }

        const handlers = [
            'evento_teju_sete_cabecas', 'evento_teju_ima_almas',
            'evento_mboi_bico_arco_iris', 'evento_mboi_inundacao',
            'evento_monai_voo_rasante', 'evento_monai_sopro_tempestade',
            'evento_jasy_salto_solar', 'evento_jasy_clarao_cegante',
            'evento_kurupi_raizes', 'evento_kurupi_chamado',
            'evento_aoao_investida', 'evento_aoao_la',
        ];
        const sort = handlers[Math.floor(Math.random() * handlers.length)];
        const fn = EVENTO_SKILLS[sort];
        if (!fn) { _dmgGlobal(enemy.atk); return; }

        if (typeof addLog === 'function') addLog(`🌑 Luison invoca: ${sort}!`);
        await fn(enemy, { danoBase: enemy.atk, dano: enemy.atk, elementoPerigo: 'AR' });
    }

    // =================================================================
    // PESADELO — sorteia skill aleatória
    // =================================================================
    async function evento_pesadelo_skill(enemy, skill) {
        if (typeof addLog === 'function') addLog(`👹 Pesadelo: ${skill.nome}!`);
        if (typeof playSfx === 'function') { try { playSfx('skill1'); } catch(e) {} }

        const handlers = [
            'evento_teju_sete_cabecas', 'evento_teju_ima_almas',
            'evento_mboi_bico_arco_iris', 'evento_mboi_inundacao',
            'evento_monai_voo_rasante', 'evento_monai_sopro_tempestade',
            'evento_jasy_salto_solar', 'evento_jasy_clarao_cegante',
            'evento_kurupi_raizes', 'evento_kurupi_chamado',
            'evento_aoao_investida', 'evento_aoao_la',
            'evento_luison_colheita', 'evento_luison_legado',
        ];
        const sort = handlers[Math.floor(Math.random() * handlers.length)];
        const fn = EVENTO_SKILLS[sort];
        if (!fn) { _dmgGlobal(enemy.atk); return; }

        await fn(enemy, { danoBase: enemy.atk, dano: enemy.atk, elementoPerigo: 'FOGO' });
    }

    // =================================================================
    // REGISTRO DE HANDLERS
    // =================================================================
    const EVENTO_SKILLS = {
        'evento_teju_sete_cabecas': evento_teju_sete_cabecas,
        'evento_teju_ima_almas': evento_teju_ima_almas,
        'evento_mboi_bico_arco_iris': evento_mboi_bico_arco_iris,
        'evento_mboi_inundacao': evento_mboi_inundacao,
        'evento_monai_voo_rasante': evento_monai_voo_rasante,
        'evento_monai_sopro_tempestade': evento_monai_sopro_tempestade,
        'evento_jasy_salto_solar': evento_jasy_salto_solar,
        'evento_jasy_clarao_cegante': evento_jasy_clarao_cegante,
        'evento_kurupi_raizes': evento_kurupi_raizes,
        'evento_kurupi_chamado': evento_kurupi_chamado,
        'evento_aoao_investida': evento_aoao_investida,
        'evento_aoao_la': evento_aoao_la,
        'evento_luison_colheita': evento_luison_colheita,
        'evento_luison_legado': evento_luison_legado,
        'evento_pesadelo_skill': evento_pesadelo_skill,
    };

    window.EVENTO_SKILLS = EVENTO_SKILLS; // exposto p/ replay coop de skills de evento

    // ==============================================================            
    // 4. APLICAR SKILL DO BOSS DO EVENTO
    // ==============================================================
    async function eventoAplicarSkill(enemy, skill) {
        if (!skill || !skill.handler) return;

        if (window._nacaoBatalha?.ativa || window._nacaoAtivo) {
            const handler = window.NACAO_SKILL_HANDLERS?.[skill.handler];
            const currentEnemyId = typeof storyEnemiesRemaining !== 'undefined'
                ? storyEnemiesRemaining[0]
                : null;
            const currentEnemy = typeof STORY_ENEMIES !== 'undefined'
                ? STORY_ENEMIES[currentEnemyId]
                : null;
            const atk = Number(currentEnemy?.atk);
            if (typeof handler !== 'function') {
                console.error('[evento] Skill de Nação sem handler:', skill.handler);
                return;
            }
            if (!Number.isFinite(atk) || atk <= 0) {
                console.error('[evento] ATK inválido para skill de Nação:', currentEnemyId, currentEnemy?.atk);
                return;
            }
            await handler({
                ...currentEnemy,
                ...enemy,
                id: currentEnemy?.id || enemy?.id,
                nome: currentEnemy?.name || currentEnemy?.nome || enemy?.nome || 'Chefe',
                atk,
            }, skill);
            return;
        }

        const fn = EVENTO_SKILLS[skill.handler];
        if (!fn) {
            console.warn('[evento] Handler não encontrado:', skill.handler);
            _dmgGlobal(enemy.atk);
            return;
        }
        try { await fn(enemy, skill); }
        catch (e) { console.error('[evento] Erro em', skill.handler, e); }
    }

    // ==============================================================
    // 5. IA DO BOSS DO EVENTO
    // ==============================================================
    async function eventoBossAI() {
        if (!_eventoBatalha.ativa) return;
        if (typeof bossAIIsRunning !== 'undefined' && bossAIIsRunning) return;
        if (window._endGameShowing) return;

        if (typeof bossAIIsRunning !== 'undefined') bossAIIsRunning = true;

        const tb = document.getElementById('turnBoss');
        if (tb) tb.classList.add('active-turn');

        if (typeof addLog === 'function') addLog(`👹 ${boss.nome || 'Inimigo'} ataca!`);

        // 1. Move (4 tentativas)
        for (let i = 0; i < 4; i++) {
            if (boss.dead) break;
            const moves = [
                { x: boss.x + 1, y: boss.y }, { x: boss.x - 1, y: boss.y },
                { x: boss.x, y: boss.y + 1 }, { x: boss.x, y: boss.y - 1 },
            ].filter(m => m.x >= 0 && m.x < 8 && m.y >= 0 && m.y < 8 && !isOccupiedEvento(m.x, m.y));

            if (moves.length > 0) {
                const mv = moves[Math.floor(Math.random() * moves.length)];
                boss.x = mv.x; boss.y = mv.y;
                if (typeof updateVisuals === 'function') updateVisuals();
                await _sleep(200);
            }
        }

        if (typeof updateAllSpriteDirections === 'function') updateAllSpriteDirections();
        await _sleep(250);

        // 2. Atualizar eco do Ao Ao se dividido
        if (_eventoBatalha.aoAoDividido && _eventoBatalha.aoAoEco) {
            _eventoBatalha.aoAoEco.x = boss.x + (boss.x < 4 ? 2 : -2);
            _eventoBatalha.aoAoEco.y = boss.y;
            _renderAoAoEco();
        }

        // 3. Skill
        if (!boss.dead) {
            const cfg = _eventoBatalha.isPesadelo
                ? (typeof EVENTO_PESADELO !== 'undefined' ? EVENTO_PESADELO : null)
                : (typeof EVENTO_BOSSES !== 'undefined' ? EVENTO_BOSSES[_eventoBatalha.bossId] : null);

            // ⭐ FIX: se o inimigo ATUAL da fila é um animal (fase antes do boss),
            // usa as skills PRÓPRIAS dele via applyStorySkill — nunca as skills do boss.
            const enemyIdAtual = (typeof storyEnemiesRemaining !== 'undefined' && storyEnemiesRemaining.length > 0)
                ? storyEnemiesRemaining[0] : null;
            const enemyAtual = enemyIdAtual ? STORY_ENEMIES[enemyIdAtual] : null;
            const ehFaseBoss = !_eventoBatalha.isPesadelo
                && enemyIdAtual
                && (enemyIdAtual === _eventoBatalha.bossId
                    || _eventoBatalha.faseId === 'boss'
                    || (enemyAtual && enemyAtual.isEvento)
                    || String(enemyIdAtual).startsWith('nacao_'));

            if (!ehFaseBoss && enemyAtual && (enemyAtual.skill1 || enemyAtual.skill2)) {
                const skillAnimal = Math.random() < 0.5 ? enemyAtual.skill1 : enemyAtual.skill2;
                if (skillAnimal && typeof applyStorySkill === 'function') {
                    await applyStorySkill(enemyAtual, skillAnimal);
                }
            } else if (cfg) {
                let skill;
                if (_eventoBatalha.isPesadelo) {
                    skill = { nome: 'Pesadelo', handler: 'evento_pesadelo_skill' };
                } else {
                    skill = cfg.skills[Math.floor(Math.random() * cfg.skills.length)];
                }

                // Ao Ao tem fissão antes da skill se HP < 50%
                if (_eventoBatalha.bossId === 'ao_ao' && !_eventoBatalha.aoAoDividido) {
                    await evento_aoao_fissao();
                }

                const mock = { id: _eventoBatalha.bossId, nome: boss.nome || cfg.nome, atk: enemyAtkAtual() };
                await eventoAplicarSkill(mock, skill);
            }
        }

        // 4. Pesadelo: mecânica especial a cada 3 turnos
        if (_eventoBatalha.isPesadelo) {
            _eventoBatalha.pesadeloTurnos++;
            if (_eventoBatalha.pesadeloTurnos % 3 === 0) {
                const vivos = players.filter(p => !p.dead);
                if (vivos.length > 0) {
                    const alvo = vivos[Math.floor(Math.random() * vivos.length)];
                    if (Math.random() < 0.5) {
                        alvo.bonusAtk = (alvo.bonusAtk || 0) + 3;
                        if (typeof addLog === 'function') addLog(`👹 Pesadelo: ${alvo.name} +3 ATK!`);
                    } else {
                        alvo.hp = Math.min(alvo.maxHp, alvo.hp + 3);
                        if (typeof showHealEffect === 'function') showHealEffect(alvo.x, alvo.y, 3);
                        if (typeof addLog === 'function') addLog(`👹 Pesadelo: ${alvo.name} +3 HP!`);
                    }
                    if (typeof updateHeroCard === 'function') updateHeroCard();
                }
            }
        }

        await _sleep(600);
        if (tb) tb.classList.remove('active-turn');
        if (typeof bossAIIsRunning !== 'undefined') bossAIIsRunning = false;

        if (boss.dead) return;
        if (players.filter(p => !p.dead).length === 0) {
            if (typeof showEndGame === 'function') showEndGame("GAME OVER", false);
            return;
        }
        if (window._endGameShowing) return;

        // Próximo turno dos heróis
        if (typeof currentPlayerIdx !== 'undefined') {
            currentPlayerIdx = 0;
            while (currentPlayerIdx < players.length && players[currentPlayerIdx] && players[currentPlayerIdx].dead) currentPlayerIdx++;
            if (currentPlayerIdx < players.length && typeof switchConfig === 'function') switchConfig(currentPlayerIdx);
        }

        // Reset "preso" (dano das raízes)
        players.forEach(p => { if (p.preso && _eventoBatalha.bossId !== 'kurupi') p.preso = false; });

        if (typeof updateAllSpriteDirections === 'function') updateAllSpriteDirections();
        if (typeof updateHeroCard === 'function') updateHeroCard();
        if (typeof updateBossCard === 'function') updateBossCard();
    }

    function isOccupiedEvento(nx, ny) {
        if (boss && boss.x === nx && boss.y === ny && !boss.dead) return true;
        if (players.some(p => !p.dead && p.x === nx && p.y === ny)) return true;
        if (window._eventoAnimais && window._eventoAnimais.some(a => !a.dead && a.x === nx && a.y === ny)) return true;
        return false;
    }

    // ==============================================================
    // 6. BÔNUS +10 HP / +1 ATK NOS ANIMAIS
    // ==============================================================
    function aplicarBonusEventoInimigo(enemyId) {
        const enemy = (typeof STORY_ENEMIES !== 'undefined') ? STORY_ENEMIES[enemyId] : null;
        if (!enemy) return;
        // Aplica bônus só em animais (não bosses)
        if (enemy.isBoss || enemy.isMiniBoss || enemy.isFinalBoss || enemy.isSpectral) return;
        const bonus = (typeof EVENTO_ANIMAL_BONUS !== 'undefined') ? EVENTO_ANIMAL_BONUS : { hpBonus: 10, atkBonus: 1 };
        if (!enemy._eventoBonusAplicado) {
            enemy.hp = (enemy.hp || 0) + bonus.hpBonus;
            enemy.atk = (enemy.atk || 0) + bonus.atkBonus;
            enemy._eventoBonusAplicado = true;
        }
    }

    // ==============================================================
    // 7. HANDLER DE BATALHA — INICIAR FASE DO EVENTO
    // ==============================================================
    async function eventoIniciarBatalha(bossId, faseId) {
        const bossCfg = (bossId === 'pesadelo')
            ? EVENTO_PESADELO
            : EVENTO_BOSSES[bossId];

        if (!bossCfg) { uiAviso('Boss do evento não encontrado.'); return; }

        const isPesadelo = (bossId === 'pesadelo');

        // Reset estado
        _eventoBatalha = {
            ativa: true,
            bossId: bossId,
            faseId: faseId,
            isPesadelo: isPesadelo,
            dificuldade: getDificuldadeEvento(),
            aoAoDividido: false,
            aoAoEco: null,
            pesadeloTurnos: 0,
            publicandoResultado: false,
        };
        window._eventoAnimais = [];
        window._eventoBatalha = _eventoBatalha;

        // Monta a fila de inimigos
        let fila = [];
        if (faseId === 'boss') {
            fila = [bossId === 'pesadelo' ? 'pesadelo' : bossId];
        } else {
            // Progressão acumulativa
            const idx = parseInt(faseId) - 1;
            const animais = bossCfg.animais || [];
            for (let i = 0; i <= idx; i++) {
                if (animais[i]) fila.push(animais[i]);
            }
        }

        if (fila.length === 0) { uiAviso('Fila de inimigos vazia.'); return; }

        // Aplica bônus +10/+1 nos animais
        fila.forEach(id => {
            if (id !== bossId && id !== 'pesadelo') {
                aplicarBonusEventoInimigo(id);
            }
        });

        // Salva snapshot do boss original
        eventoSnapshotBoss();

        // Configura configs (1 herói)
        const selHero = (STORY_PROGRESS.selectedHeroes || ['Tupa'])[0];
        if (typeof playerConfigs !== 'undefined') {
            for (let i = 0; i < 4; i++) playerConfigs[i].active = false;
            playerConfigs[0].active = true;
            playerConfigs[0].class = selHero;
            playerConfigs[0].name = STORY_CURRENT_SAVE_NAME || selHero;
        }
        if (typeof playerCount !== 'undefined') playerCount = 1;

        // Oculta telas
        document.querySelectorAll('#storyScreen, #titleScreen, #modeScreen, #playersScreen, #challengeScreen, #configScreen, #tutorialScreen').forEach(el => {
            if (el) { el.style.display = 'none'; el.classList.remove('active'); }
        });
        const gs = document.getElementById('gameScreen');
        if (gs) { gs.style.display = 'flex'; gs.classList.add('active'); }
        window.currentScreen = 'game';

        // Configura boss no motor
        if (typeof boss !== 'undefined') {
            const firstEnemy = STORY_ENEMIES[fila[0]];
            const baseType = (typeof STORY_TO_BASE_BOSS !== 'undefined' && STORY_TO_BASE_BOSS[fila[0]])
                ? STORY_TO_BASE_BOSS[fila[0]]
                : String(fila[0]).toUpperCase();

            boss.type = baseType;
            boss.hp = (firstEnemy?.hp || 20) * _eventoBatalha.dificuldade.hpMult;
            boss.maxHp = boss.hp;
            boss.x = 4; boss.y = 0;
            boss.dead = false;
            boss.nome = firstEnemy?.name || fila[0];
        }

        // Configura storyEnemiesRemaining global
        if (typeof storyEnemiesRemaining !== 'undefined') {
            storyEnemiesRemaining.length = 0;
            fila.forEach(e => storyEnemiesRemaining.push(e));
        }
        if (typeof storyCurrentEnemyIndex !== 'undefined') storyCurrentEnemyIndex = 0;
        if (typeof storyBattleActive !== 'undefined') storyBattleActive = true;

        // Flag modo história temporário
        window._storyMode = true;
        window._eventoAtivo = true;
        window._endGameShowing = false;

        // Instala overrides
        if (typeof installStoryOverrides === 'function') installStoryOverrides();
        if (typeof installStoryClassDB === 'function') installStoryClassDB();

        // initGame
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
            await eventoPosInitGame(fila[0]);
        };

        if (typeof initGame === 'function') await initGame();
    }

    async function eventoPosInitGame(enemyId) {
        // Aplica sprite + nome
        if (typeof applyStoryEnemyToBoss === 'function') {
            applyStoryEnemyToBoss(enemyId);
        }

        // Ajusta HP do boss (multiplicador)
        const enemy = STORY_ENEMIES[enemyId];
        if (enemy && boss) {
            const hpBase = (enemyId === _eventoBatalha.bossId || enemyId === 'pesadelo')
                ? ((_eventoBatalha.isPesadelo ? EVENTO_PESADELO.hp : EVENTO_BOSSES[enemyId]?.hp || enemy.hp))
                : enemy.hp;
            boss.maxHp = Math.ceil(hpBase * _eventoBatalha.dificuldade.hpMult);
            boss.hp = boss.maxHp;
        }

        // Header
        if (typeof updateHeaderBossName === 'function') updateHeaderBossName();
        if (typeof updateBossCard === 'function') updateBossCard();
        if (typeof updateHeroCard === 'function') updateHeroCard();

        if (typeof addLog === 'function') {
            addLog(`🎉 EVENTO — ${_eventoBatalha.dificuldade.nome.toUpperCase()}`);
            const cfg = _eventoBatalha.isPesadelo ? EVENTO_PESADELO : EVENTO_BOSSES[_eventoBatalha.bossId];
            if (cfg) addLog(`👹 ${cfg.nome} — ${cfg.titulo}`);
        }

        // Inicia IA após intro
        if (typeof showBossIntroDialog === 'function' && !_eventoBatalha.isPesadelo) {
            await showBossIntroDialog(enemyId);
        }

        await _sleep(300);

        // Bloqueia botões até o jogador começar
        if (typeof switchConfig === 'function') switchConfig(0);
        window._eventoTurnoJogador = true;

        if (typeof eventoInjetarUI === 'function') {
            eventoInjetarUI();
        }
    }

    // ==============================================================
    

    // ==============================================================
    // 9. INTEGRAÇÃO: SOBRESCREVER storyEnemyAI NO MODO EVENTO
    // ==============================================================
    (function instalarEventoAIOverride() {
        const _orig = window.storyEnemyAI;
        if (typeof _orig !== 'function') return;
        if (window._eventoAIOverride) return;
        window._eventoAIOverride = true;

        window.storyEnemyAI = async function() {
            // Se está no modo evento e é o turno do boss, usa a IA do evento
            if (window._eventoAtivo && _eventoBatalha.ativa && window._eventoTurnoJogador !== true) {
                return eventoBossAI();
            }
            return _orig.apply(this, arguments);
        };
    })();

    // ==============================================================
    // 10. SE FOR O TURNO DO BOSS, RODA eventoBossAI
    // --------------------------------------------------------------
    // O manageTurns do história chama storyEnemyAI quando o boss joga.
    // Como sobrescrevemos storyEnemyAI, já deve funcionar.
    // Mas como garantia, sobrescrevemos também o manageTurns pra
    // detectar o modo evento.
    // ==============================================================
    (function instalarEventoManageTurns() {
        const _orig = window.manageTurns;
        if (typeof _orig !== 'function') return;
        if (window._eventoManageTurns) return;
        window._eventoManageTurns = true;

        window.manageTurns = function() {
            if (window._eventoAtivo && _eventoBatalha.ativa) {
                // Turno dos heróis → boss
                if (typeof currentPlayerIdx !== 'undefined') {
                    let next = currentPlayerIdx + 1;
                    while (next < players.length && players[next].dead) next++;
                    if (next < players.length) {
                        currentPlayerIdx = next;
                        if (typeof switchConfig === 'function') switchConfig(next);
                        if (typeof addLog === 'function') addLog(`🎮 Turno de ${players[currentPlayerIdx].name}`);
                        return;
                    }
                }

                // Todos jogaram → boss
                window._eventoTurnoJogador = false;
                if (typeof saveAndRefresh === 'function') saveAndRefresh();
                if (typeof addLog === 'function') addLog(`👹 TURNO DO BOSS!`);

                const tp = document.getElementById('turnP_Active');
                if (tp) tp.classList.remove('active-turn');
                const tb = document.getElementById('turnBoss');
                if (tb) tb.classList.add('active-turn');

                setTimeout(() => {
                    if (window._eventoAtivo && _eventoBatalha.ativa && !window._endGameShowing) {
                        eventoBossAI();
                    }
                }, 800);
                return;
            }
            return _orig.apply(this, arguments);
        };
    })();

    // ==============================================================
    // 11. INJETAR UI DO EVENTO
    // ==============================================================
    function eventoInjetarUI() {
        // Badge
        const header = document.querySelector('.game-title');
        if (header && !header.querySelector('#eventoBadge')) {
            const badge = document.createElement('span');
            badge.className = 'evento-badge-jogo';
            badge.id = 'eventoBadge';
            badge.textContent = '🎉 EVENTO';
            header.appendChild(badge);
        }

        // Botão sair
        const acoes = document.querySelector('.game-header-actions');
        if (acoes && !acoes.querySelector('.evento-sair-btn')) {
            const btn = document.createElement('button');
            btn.className = 'coop-sair-btn evento-sair-btn';
            btn.innerHTML = '🚪 SAIR';
            btn.onclick = async () => {
                if (await uiConfirm('Sair do evento? A chave já foi gasta.')) {
                    eventoFinalizarPartida(false, true);
                }
            };
            acoes.insertBefore(btn, acoes.firstChild);
        }

        // Banner
        const main = document.querySelector('.game-main');
        if (main && !document.getElementById('eventoBanner')) {
            const banner = document.createElement('div');
            banner.id = 'eventoBanner';
            banner.className = 'evento-banner';
            const cfg = _eventoBatalha.isPesadelo ? EVENTO_PESADELO : EVENTO_BOSSES[_eventoBatalha.bossId];
            banner.innerHTML = `
                <span class="evento-banner-icon">🎉</span>
                <span class="evento-banner-text">${cfg ? cfg.nome : 'EVENTO'}</span>
                <span class="evento-banner-hint">${_eventoBatalha.dificuldade.nome}</span>
            `;
            main.parentNode.insertBefore(banner, main);
        }
    }

    // ==============================================================
    // 12. EXPOR ESTADO
    // ==============================================================
    window._eventoBatalha = _eventoBatalha;
    window.getEventoBatalha = () => _eventoBatalha;
    window.eventoIniciarBatalha = eventoIniciarBatalha;
    window.eventoBossAI = eventoBossAI;
    window.eventoAplicarSkill = eventoAplicarSkill;
    window.getDificuldadeEvento = getDificuldadeEvento;
    window.setDificuldadeEvento = setDificuldadeEvento;
    window.EVENTO_DIFICULDADES = EVENTO_DIFICULDADES;

    console.log('✅ [V9.5-P2A] Evento Semanal — PARTE 2A carregada.');
    console.log('   • Skills dos 7 bosses (14 skills)');
    console.log('   • IA do boss do evento');
    console.log('   • Ao Ao com eco visual');
    console.log('   • Pesadelo (skill aleatória)');
    console.log('   • Bônus +10 HP / +1 ATK nos animais');
    console.log('   • Fix definitivo do espectro');
    console.log('   • Aguardando PARTE 2B (drop system + telas)');
})();
// =================================================================
// historia.js — BLOCO 16 (V9.5 — EVENTO SEMANAL — PARTE 2B)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js, depois da PARTE 2A.
//
// PARTE 2B contém:
//   • Drop system (arma 5%/10%/20%, fragmento 5%/10%/20%)
//   • Tela de vitória/derrota do evento
//   • Rudá desbloqueável (7 fragmentos)
//   • Finalização da partida (volta pra Aldeia)
//   • Seletor de dificuldade na tela de fases
//   • CSS completo
// =================================================================

(function installEventoParte2B() {
    if (window._eventoSemanalV95P2B) return;
    window._eventoSemanalV95P2B = true;

    // ==============================================================
    // 1. HELPERS DE DROP
    // ==============================================================
    function _rollDropsEvento(bossId) {
        const diff = (typeof getDificuldadeEvento === 'function')
            ? getDificuldadeEvento()
            : { dropArma: 0.05, dropItem: 0.05 };

        const cfg = (bossId === 'pesadelo')
            ? (typeof EVENTO_PESADELO !== 'undefined' ? EVENTO_PESADELO : null)
            : (typeof EVENTO_BOSSES !== 'undefined' ? EVENTO_BOSSES[bossId] : null);

        if (!cfg) return { arma: null, fragmento: null, ehPesadelo: bossId === 'pesadelo' };

        const drops = { arma: null, fragmento: null, ehPesadelo: bossId === 'pesadelo' };

        // Arma (5/10/20%)
        if (Math.random() < diff.dropArma) {
            const tipos = ['tacape', 'flecha', 'cajado'];
            const tipo = tipos[Math.floor(Math.random() * tipos.length)];
            const key = 'arma_' + _bossIdToArmaSlug(bossId) + '_' + tipo;
            if (typeof EVENTO_ARMAS !== 'undefined' && EVENTO_ARMAS[key]) {
                drops.arma = key;
            }
        }

        // Fragmento (5/10/20%) — Pesadelo NÃO dropa fragmento
        if (!drops.ehPesadelo && cfg.fragmento) {
            if (Math.random() < diff.dropItem) {
                drops.fragmento = cfg.fragmento;
            }
        }

        return drops;
    }

    function _bossIdToArmaSlug(bossId) {
        const mapa = {
            'teju_jagua': 'teju',
            'mboi_tui': 'mboi',
            'monai': 'monai',
            'jasy_jatere': 'jasy',
            'kurupi': 'kurupi',
            'ao_ao': 'aoao',
            'luison': 'luison',
        };
        return mapa[bossId] || bossId;
    }

    function _aplicarDrops(drops) {
        const resultado = { arma: null, fragmento: null, rudaDesbloqueado: false };

        if (drops.arma) {
            if (!Array.isArray(STORY_PROGRESS.eventoArmas)) STORY_PROGRESS.eventoArmas = [];
            if (!Array.isArray(STORY_PROGRESS.craftedWeapons)) STORY_PROGRESS.craftedWeapons = [];
            if (!Array.isArray(STORY_PROGRESS._v1080_armasRecuperadas)) {
                STORY_PROGRESS._v1080_armasRecuperadas = [];
            }

            const baseId = String(drops.arma).split('#')[0];
            if (!STORY_PROGRESS.eventoArmas.includes(baseId)) {
                STORY_PROGRESS.eventoArmas.push(baseId);
            }

            // O inventário/equipamento lê craftedWeapons, não eventoArmas.
            // Se a mesma base ficou pendente (save antigo), este drop a recupera
            // uma vez; cópias já presentes continuam sendo exibidas normalmente.
            const idsComUid = STORY_PROGRESS.craftedWeapons.map(id => String(id).split('#')[0]);
            const temArmaNoInventario = idsComUid.includes(baseId);
            const recuperadaAntes = STORY_PROGRESS._v1080_armasRecuperadas.includes(baseId);
            if (!temArmaNoInventario && !recuperadaAntes) {
                STORY_PROGRESS.craftedWeapons.push(
                    `${baseId}#${Date.now()}${Math.floor(Math.random() * 1000000)}`
                );
            }
            if (!recuperadaAntes) STORY_PROGRESS._v1080_armasRecuperadas.push(baseId);
            resultado.arma = baseId;
            if (temArmaNoInventario || recuperadaAntes) resultado.armaRepetida = true;
        }

        if (drops.fragmento) {
            if (!Array.isArray(STORY_PROGRESS.eventoFragmentos)) STORY_PROGRESS.eventoFragmentos = [];
            if (!STORY_PROGRESS.eventoFragmentos.includes(drops.fragmento)) {
                STORY_PROGRESS.eventoFragmentos.push(drops.fragmento);
                resultado.fragmento = drops.fragmento;
            } else {
                resultado.fragmentoRepetido = true;
            }
        }

        // Verifica se completou os 7 fragmentos
        if (!STORY_PROGRESS.eventoRudaDesbloqueado) {
            const totalFragmentos = (typeof EVENTO_FRAGMENTOS !== 'undefined') ? Object.keys(EVENTO_FRAGMENTOS).length : 7;
            if (STORY_PROGRESS.eventoFragmentos.length >= totalFragmentos) {
                STORY_PROGRESS.eventoRudaDesbloqueado = true;
                resultado.rudaDesbloqueado = true;

                // Desbloqueia Rudá na lista de heróis
                if (!Array.isArray(STORY_PROGRESS.unlockedHeroesStory)) {
                    STORY_PROGRESS.unlockedHeroesStory = ['Tupa', 'Sume', 'Caipora'];
                }
                if (!STORY_PROGRESS.unlockedHeroesStory.includes('Rudá')) {
                    STORY_PROGRESS.unlockedHeroesStory.push('Rudá');
                }
            }
        }

        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        return resultado;
    }

    // ==============================================================
    // 2. FINALIZAR PARTIDA
    // ==============================================================
    async function eventoFinalizarPartida(vitoria, saindo) {
        if (!window._eventoAtivo) return;
        if (window._eventoFinalizando) return;
        window._eventoFinalizando = true;

        // Limpa estado
        window._eventoAtivo = false;
        window._eventoTurnoJogador = true;
        window._endGameShowing = true;

        if (typeof stopAllAudio === 'function') { try { stopAllAudio(); } catch(e) {} }

        // Remove animais e eco
        const board = document.getElementById('board');
        if (board) {
            board.querySelectorAll('.token.evento-animal, .token.evento-eco-aoao').forEach(t => t.remove());
        }
        window._eventoAnimais = [];

        // Restaura snapshot do boss
        if (typeof eventoRestaurarBoss === 'function') eventoRestaurarBoss();

        // Se o jogador está saindo sem terminar, não dá recompensa
        if (saindo) {
            _eventoBatalha.ativa = false;
            eventoVoltarAldeia();
            window._eventoFinalizando = false;
            return;
        }

        // Aplica drops se venceu
        let dropsResult = null;
        let drops = null;
        if (vitoria) {
            const bossId = _eventoBatalha.bossId;
            const faseId = _eventoBatalha.faseId;

            // Se for boss, rola drops
            if (faseId === 'boss') {
                drops = _rollDropsEvento(bossId);
                dropsResult = _aplicarDrops(drops);
            }

            // Recompensas de XP/Ouro
            const cfg = _eventoBatalha.isPesadelo
                ? (typeof EVENTO_PESADELO !== 'undefined' ? EVENTO_PESADELO : null)
                : (typeof EVENTO_BOSSES !== 'undefined' ? EVENTO_BOSSES[bossId] : null);
            const diff = _eventoBatalha.dificuldade;
            if (cfg && diff) {
                const xpBase = faseId === 'boss' ? cfg.recompensaXP : Math.floor(cfg.recompensaXP / 5);
                const ouroBase = faseId === 'boss' ? cfg.recompensaOuro : Math.floor(cfg.recompensaOuro / 5);
                STORY_PROGRESS.totalXP = (STORY_PROGRESS.totalXP || 0) + Math.floor(xpBase * diff.xpMult);
                STORY_PROGRESS.gold = (STORY_PROGRESS.gold || 0) + Math.floor(ouroBase * diff.ouroMult);
            }

            // Marca fase concluída
            if (typeof marcarFaseEventoConcluida === 'function') {
                marcarFaseEventoConcluida(bossId, faseId);
            }

            if (typeof saveStoryProgress === 'function') saveStoryProgress();
        }

        // Mostra tela final
        _eventoBatalha.ativa = false;
        _mostrarTelaFinalEvento(vitoria, drops, dropsResult);

        window._eventoFinalizando = false;
    }

    // ==============================================================
    // 3. TELA DE VITÓRIA/DERROTA
    // ==============================================================
    function _mostrarTelaFinalEvento(vitoria, drops, dropsResult) {
        const overlay = document.getElementById('gameOverlay');
        if (!overlay) { uiAviso(vitoria ? '🏆 VITÓRIA!' : '💀 DERROTA'); return; }

        const cfg = _eventoBatalha.isPesadelo
            ? (typeof EVENTO_PESADELO !== 'undefined' ? EVENTO_PESADELO : null)
            : (typeof EVENTO_BOSSES !== 'undefined' ? EVENTO_BOSSES[_eventoBatalha.bossId] : null);
        const diff = _eventoBatalha.dificuldade || { nome: 'Normal' };
        const faseId = _eventoBatalha.faseId;

        // Splits de drops
        let dropsHTML = '';
        if (drops && (drops.arma || drops.fragmento)) {
            dropsHTML = '<div class="victory-stats">';
            if (drops.arma) {
                const arma = (typeof EVENTO_ARMAS !== 'undefined' && EVENTO_ARMAS[drops.arma]) ? EVENTO_ARMAS[drops.arma] : null;
                if (arma) {
                    dropsHTML += `
                        <div class="victory-stat">
                            <div class="victory-stat-value">${eventoIcon(arma.id, 'small')} +1</div>
                            <div class="victory-stat-label">${arma.nome}</div>
                        </div>
                    `;
                }
            }
            if (drops.fragmento) {
                const frag = (typeof EVENTO_FRAGMENTOS !== 'undefined' && EVENTO_FRAGMENTOS[drops.fragmento]) ? EVENTO_FRAGMENTOS[drops.fragmento] : null;
                if (frag) {
                    dropsHTML += `
                        <div class="victory-stat">
                            <div class="victory-stat-value">${eventoIcon(frag.id, 'small')} +1</div>
                            <div class="victory-stat-label">${frag.nome}</div>
                        </div>
                    `;
                }
            }
            dropsHTML += '</div>';
        }

        // Rudá desbloqueado
        let rudaHTML = '';
        if (dropsResult && dropsResult.rudaDesbloqueado) {
            rudaHTML = `
                <div class="evento-ruda-unlock">
                    <div class="evento-ruda-titulo">✨ RUDÁ DESBLOQUEADO! ✨</div>
                    <div class="evento-ruda-desc">O deus do amor e da guerra justa desceu das nuvens para lutar ao seu lado!</div>
                    <div class="evento-ruda-hint">Rudá está disponível na OCA.</div>
                </div>
            `;
        }

        // Botões
        let botoesHTML = '';
        if (vitoria) {
            botoesHTML = `
                <button class="victory-btn" onclick="eventoVoltarAldeia()">🏠 VOLTAR À ALDEIA</button>
                <button class="victory-btn secondary" onclick="eventoVoltarSemana()">📅 VER SEMANA</button>
            `;
        } else {
            botoesHTML = `
                <button class="victory-btn" onclick="eventoVoltarSemana()">📅 VER SEMANA</button>
                <button class="victory-btn secondary" onclick="eventoVoltarAldeia()">🏠 VOLTAR À ALDEIA</button>
            `;
        }

        const msgVitoria = faseId === 'boss' ? 'BOSS DO EVENTO DERROTADO!' : 'FASE CONCLUÍDA!';

        overlay.innerHTML = `
            <div class="victory-panel ${!vitoria ? 'defeat' : ''}">
                <div class="victory-scroll-top">
                    <h1 class="victory-title ${!vitoria ? 'defeat' : ''}">
                        ${vitoria ? '🎉' : '💀'} ${vitoria ? msgVitoria : 'DERROTA'}
                    </h1>
                </div>
                <div class="victory-body">
                    <div class="victory-boss-image-wrap">
                        <div class="victory-boss-halo"></div>
                        ${cfg && typeof eventoIcon === 'function' ? eventoIcon(_eventoBatalha.bossId, 'large') : ''}
                    </div>
                    <div class="victory-boss-name">${cfg ? cfg.nome : 'Evento'}</div>
                    <div class="victory-boss-subtitle">${cfg ? cfg.titulo : ''} · ${diff.nome}</div>
                    ${dropsHTML}
                    ${rudaHTML}
                    <div class="victory-lore">
                        ${vitoria
                            ? (faseId === 'boss'
                                ? 'Você acalmou um dos Sete Selados. A mata respira um pouco melhor.'
                                : 'Fase concluída. Continue avançando até o boss do dia.')
                            : 'Os Sete Selados são implacáveis. Tente novamente na próxima semana.'}
                    </div>
                    <div class="victory-actions">
                        ${botoesHTML}
                    </div>
                </div>
            </div>
        `;
        overlay.classList.add('active');
        overlay.style.display = 'flex';

        if (typeof playSfx === 'function') {
            try { playSfx(vitoria ? 'win' : 'gameover'); } catch(e) {}
        }
    }

    // ==============================================================
    // 4. VOLTAR À ALDEIA / SEMANA
    // ==============================================================
    function eventoVoltarAldeia() {
        const overlay = document.getElementById('gameOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.display = 'none';
            overlay.innerHTML = '';
        }
        window._endGameShowing = false;
        window._eventoFinalizando = false;

        if (typeof restoreBaseGameFunctions === 'function') restoreBaseGameFunctions();
        if (typeof restoreBaseClassDB === 'function') restoreBaseClassDB();

        const gs = document.getElementById('gameScreen');
        if (gs) { gs.classList.remove('active'); gs.style.display = 'none'; }

        // Remove UI do evento
        ['eventoBadge', 'eventoBanner'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
        document.querySelectorAll('.evento-sair-btn').forEach(el => el.remove());

        if (typeof showStoryScreen === 'function') {
            showStoryScreen();
            setTimeout(() => {
                if (typeof renderAldeiaScreen === 'function') renderAldeiaScreen();
            }, 100);
        }
    }

    function eventoVoltarSemana() {
        const overlay = document.getElementById('gameOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.display = 'none';
            overlay.innerHTML = '';
        }
        window._endGameShowing = false;
        window._eventoFinalizando = false;

        if (typeof restoreBaseGameFunctions === 'function') restoreBaseGameFunctions();
        if (typeof restoreBaseClassDB === 'function') restoreBaseClassDB();

        const gs = document.getElementById('gameScreen');
        if (gs) { gs.classList.remove('active'); gs.style.display = 'none'; }

        ['eventoBadge', 'eventoBanner'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
        document.querySelectorAll('.evento-sair-btn').forEach(el => el.remove());

        if (typeof renderEventoSemanalScreen === 'function') {
            renderEventoSemanalScreen();
        }
    }

    // ==============================================================
    // 5. INTEGRAÇÃO: DETECTAR MORTE DO BOSS NO MODO EVENTO
    // --------------------------------------------------------------
    // O historia.js chama handleBossDefeat quando o boss morre.
    // Vamos interceptar pra saber se foi o último da fila.
    // ==============================================================
    (function hookHandleBossDefeat() {
        const _orig = window.handleBossDefeat;
        if (typeof _orig !== 'function') return;
        if (window._eventoBossDefeatHook) return;
        window._eventoBossDefeatHook = true;

        window.handleBossDefeat = async function() {
            if (!window._eventoAtivo) {
                return _orig.apply(this, arguments);
            }

            // Modo evento: verifica se ainda tem inimigos na fila
            const temProximo = typeof storyEnemiesRemaining !== 'undefined' && storyEnemiesRemaining.length > 1;

            if (temProximo) {
                // Ainda tem animais → deixa o fluxo normal do historia.js cuidar
                return _orig.apply(this, arguments);
            }

            // Último da fila → fim da fase/boss
            if (typeof showPurificacao === 'function') {
                try { await showPurificacao(boss.type, boss.x, boss.y, true); } catch(e) {}
            }

            await _sleep(1500);
            await eventoFinalizarPartida(true, false);
        };
    })();

    // ==============================================================
    // 6. INTEGRAÇÃO: DERROTA
    // --------------------------------------------------------------
    // O historia.js chama showEndGame("GAME OVER", false).
    // Vamos interceptar pra detectar derrota no evento.
    // ==============================================================
    (function hookShowEndGame() {
        const _orig = window.showEndGame;
        if (typeof _orig !== 'function') return;
        if (window._eventoEndGameHook) return;
        window._eventoEndGameHook = true;

        window.showEndGame = function(msg, isWin) {
            if (window._eventoAtivo && !isWin) {
                // Derrota no evento
                if (window._eventoFinalizando) return;
                eventoFinalizarPartida(false, false);
                return;
            }
            return _orig.apply(this, arguments);
        };
    })();

    // ==============================================================
    // 7. SELETOR DE DIFICULDADE NA TELA DE FASES
    // ==============================================================
    // Sobrescreve renderEventoFasesScreen pra incluir o seletor.
    // ==============================================================
    (function enriquecerTelaFases() {
        if (typeof window.renderEventoFasesScreen !== 'function') return;
        if (window._eventoFasesEnriquecida) return;
        window._eventoFasesEnriquecida = true;

        const _orig = window.renderEventoFasesScreen;

        window.renderEventoFasesScreen = function(bossId) {
            const r = _orig.apply(this, arguments);

            // Injeta seletor de dificuldade
            const screen = document.getElementById('storyScreen');
            if (!screen) return r;

            const header = screen.querySelector('.story-header');
            if (!header || header.querySelector('.evento-diff-selector')) return r;

            const diffAtual = (typeof getDificuldadeEvento === 'function')
                ? getDificuldadeEvento()
                : { id: 'normal' };

            const diffs = (typeof EVENTO_DIFICULDADES !== 'undefined') ? EVENTO_DIFICULDADES : {};
            const botoes = Object.values(diffs).map(d => {
                const ativo = d.id === diffAtual.id;
                return `
                    <button class="evento-diff-btn ${ativo ? 'active' : ''}"
                            style="--diff-color:${d.color};"
                            onclick="eventoTrocarDificuldade('${d.id}', '${bossId}')">
                        <span class="evento-diff-icon">${d.icon}</span>
                        <span class="evento-diff-nome">${d.nome}</span>
                    </button>
                `;
            }).join('');

            const info = `
                <div class="evento-diff-info">
                    HP ×${diffAtual.hpMult || 1} · ATK ×${diffAtual.atkMult || 1}
                    · Drop ${Math.round((diffAtual.dropArma || 0.05) * 100)}%
                </div>
            `;

            const selector = document.createElement('div');
            selector.className = 'evento-diff-selector';
            selector.innerHTML = `
                <div class="evento-diff-label">DIFICULDADE DO EVENTO</div>
                <div class="evento-diff-buttons">${botoes}</div>
                ${info}
            `;
            header.appendChild(selector);

            return r;
        };
    })();

    function eventoTrocarDificuldade(diffId, bossId) {
        if (typeof setDificuldadeEvento !== 'function') return;
        if (!setDificuldadeEvento(diffId)) return;

        // Re-renderiza a tela de fases
        if (typeof renderEventoFasesScreen === 'function') {
            renderEventoFasesScreen(bossId);
        }

        const d = (typeof EVENTO_DIFICULDADES !== 'undefined') ? EVENTO_DIFICULDADES[diffId] : null;
        if (d && typeof showToast === 'function') {
            showToast(d.icon, `Dificuldade: ${d.nome}`, d.icon);
        }
    }

    // ==============================================================
    // 8. EXPOR FUNÇÕES
    // ==============================================================
    window.eventoFinalizarPartida = eventoFinalizarPartida;
    window.eventoVoltarAldeia = eventoVoltarAldeia;
    window.eventoVoltarSemana = eventoVoltarSemana;
    window.eventoTrocarDificuldade = eventoTrocarDificuldade;

    // ==============================================================
    // 9. CSS FINAL
    // ==============================================================
    if (!document.getElementById('eventoStyleP2')) {
        const style = document.createElement('style');
        style.id = 'eventoStyleP2';
        style.textContent = `
            /* ---- Badge no header do jogo ---- */
            .evento-badge-jogo {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 3px 12px;
                background: linear-gradient(180deg, rgba(155,89,182,0.2), transparent 60%),
                            rgba(10,6,2,0.6);
                border: 1px solid #9b59b6;
                border-radius: 12px;
                font-family: 'Cinzel', serif;
                font-weight: 700;
                font-size: 0.72rem;
                letter-spacing: 1.5px;
                color: #c39bd3;
                margin-left: 8px;
            }

            /* ---- Banner do evento ---- */
            .evento-banner {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 6px 12px;
                margin: 0 15px 6px;
                flex-wrap: wrap;
                background: linear-gradient(180deg, rgba(155,89,182,0.15), transparent 60%),
                            linear-gradient(135deg, rgba(42,20,55,0.9), rgba(20,10,30,0.9));
                border: 2px solid #9b59b6;
                border-radius: 8px;
                font-family: 'Cinzel', serif;
                color: #e8dcc4;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5), 0 0 20px rgba(155,89,182,0.3);
            }
            .evento-banner-icon { font-size: 1.1rem; }
            .evento-banner-text { font-size: 0.85rem; font-weight: 900; letter-spacing: 1.5px; }
            .evento-banner-hint {
                font-family: 'EB Garamond', serif;
                font-size: 0.72rem;
                font-style: italic;
                opacity: 0.85;
                padding: 2px 10px;
                background: rgba(155,89,182,0.2);
                border-radius: 10px;
            }

            /* ---- Seletor de dificuldade ---- */
            .evento-diff-selector {
                margin-top: 18px;
                padding: 12px 16px;
                background: rgba(10,6,2,0.5);
                border: 1px solid rgba(155,89,182,0.3);
                border-radius: 6px;
            }
            .evento-diff-label {
                font-family: 'Cinzel', serif;
                font-size: 0.75rem;
                color: #8a7a52;
                letter-spacing: 2px;
                text-align: center;
                margin-bottom: 10px;
            }
            .evento-diff-buttons {
                display: flex;
                justify-content: center;
                gap: 10px;
                flex-wrap: wrap;
            }
            .evento-diff-btn {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 8px 16px;
                background: linear-gradient(135deg, #2a1f10, #1a1208);
                color: #c8b787;
                border: 2px solid rgba(201,162,39,0.3);
                border-radius: 6px;
                cursor: pointer;
                font-family: 'Cinzel', serif;
                font-weight: 700;
                font-size: 0.85rem;
                letter-spacing: 1px;
                transition: all 0.2s;
            }
            .evento-diff-btn:hover {
                border-color: var(--diff-color, #c9a227);
                color: #e8dcc4;
                transform: translateY(-2px);
            }
            .evento-diff-btn.active {
                background: linear-gradient(180deg, rgba(232,185,35,0.15), transparent 50%),
                            linear-gradient(135deg, #3d2d18, #2a1f10);
                border-color: var(--diff-color, #c9a227);
                border-width: 3px;
                color: #fff5dc;
                box-shadow: 0 0 18px color-mix(in srgb, var(--diff-color, #c9a227) 40%, transparent);
            }
            .evento-diff-icon { font-size: 1.1rem; }
            .evento-diff-info {
                text-align: center;
                margin-top: 10px;
                font-family: 'EB Garamond', serif;
                font-size: 0.85rem;
                color: #b8a577;
                font-style: italic;
            }

            /* ---- Rudá desbloqueado ---- */
            .evento-ruda-unlock {
                padding: 16px 20px;
                margin: 10px 0;
                background: linear-gradient(180deg, rgba(241,196,15,0.2), transparent 60%),
                            linear-gradient(135deg, rgba(58,42,24,0.95), rgba(26,18,8,0.95));
                border: 2px solid #f1c40f;
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 0 30px rgba(241,196,15,0.4);
                animation: rudaPulse 2s ease-in-out infinite alternate;
            }
            @keyframes rudaPulse {
                from { box-shadow: 0 0 20px rgba(241,196,15,0.3); }
                to { box-shadow: 0 0 40px rgba(241,196,15,0.7); }
            }
            .evento-ruda-titulo {
                font-family: 'Cinzel Decorative', serif;
                color: #f1c40f;
                font-size: 1.2rem;
                letter-spacing: 3px;
                margin-bottom: 6px;
                text-shadow: 0 0 15px rgba(241,196,15,0.8);
            }
            .evento-ruda-desc {
                font-family: 'EB Garamond', serif;
                color: #e8dcc4;
                font-size: 0.95rem;
                font-style: italic;
                margin-bottom: 6px;
            }
            .evento-ruda-hint {
                font-family: 'Cinzel', serif;
                color: #c8b787;
                font-size: 0.8rem;
                letter-spacing: 1px;
            }
        `;
        document.head.appendChild(style);
    }

    // ==============================================================
    // 10. LOG FINAL
    // ==============================================================
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V9.5-P2B] Evento Semanal — PARTE 2B carregada.');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Drop system (arma 5%/10%/20%, fragmento 5%/10%/20%)');
    console.log('• Tela de vitória/derrota');
    console.log('• Rudá desbloqueável com 7 fragmentos');
    console.log('• Seletor de dificuldade');
    console.log('• CSS completo');
    console.log('');
    console.log('🎉 MODO EVENTO SEMANAL COMPLETO!');
    console.log('💡 Fluxo: Aldeia → Evento Semanal → Dia atual → Fases → Boss');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — BLOCO 17 (V9.5-FIX COMPLETO)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js, depois da PARTE 2B.
//
// Corrige:
//   • Erro "Cannot read properties of null (reading 'id')" no fim da fase
//   • Tela travada com fundo marrom (overlay sem conteúdo)
//   • Ao Ao com fissão interferindo no boss.dead
//   • Fluxo de vitória caindo no handleStoryPhaseVictory (fase história)
//   • _eventoAtivo não sendo setado corretamente
// =================================================================

(function fixEventoVitoriaDerrota() {
    if (window._eventoFixFinal) return;
    window._eventoFixFinal = true;

    // ==============================================================
    // FIX 1: handleBossDefeat — intercepta ANTES de qualquer outro
    // ==============================================================
    (function instalarHandleBossDefeatUnico() {
        const _prev = window.handleBossDefeat;

        window.handleBossDefeat = async function() {
            // ⭐ FORÇA _eventoAtivo se _eventoBatalha.ativa estiver true
            if (window._eventoBatalha && window._eventoBatalha.ativa === true) {
                window._eventoAtivo = true;
            }

            // ⭐ MODO EVENTO: intercepta TOTALMENTE
            if (window._eventoAtivo) {
                console.log('[evento-fix] handleBossDefeat no modo evento');

                // Marca que o boss morreu
                if (typeof boss !== 'undefined') boss.dead = true;

                // Verifica se ainda tem inimigos na fila
                const temProximo = typeof storyEnemiesRemaining !== 'undefined'
                    && storyEnemiesRemaining.length > 1;

                if (temProximo) {
                    // Ainda tem animais → usa o fluxo normal (mas com guarda)
                    console.log('[evento-fix] Ainda tem animais. Fluxo normal.');
                    return _prev.apply(this, arguments);
                }

                // ⭐ ÚLTIMO da fila → finaliza o evento
                console.log('[evento-fix] Último inimigo. Finalizando evento...');

                // Purificação visual
                if (typeof showPurificacao === 'function') {
                    try { await showPurificacao(boss.type, boss.x, boss.y, true); }
                    catch(e) { console.warn('[evento-fix] Erro purificação:', e); }
                }

                await new Promise(r => setTimeout(r, 1500));

                // Chama a finalização do evento
                if (typeof eventoFinalizarPartida === 'function') {
                    eventoFinalizarPartida(true, false);
                } else {
                    console.error('[evento-fix] eventoFinalizarPartida não encontrada.');
                }
                return;
            }

            // Modo história normal
            return _prev.apply(this, arguments);
        };

        console.log('[evento-fix] handleBossDefeat reescrito.');
    })();

    // ==============================================================
    // FIX 2: advanceStoryEnemy — bloqueia no modo evento
    // ==============================================================
    (function instalarAdvanceStoryEnemyGuard() {
        const _prev = window.advanceStoryEnemy;

        window.advanceStoryEnemy = async function() {
            // ⭐ FORÇA _eventoAtivo
            if (window._eventoBatalha && window._eventoBatalha.ativa === true) {
                window._eventoAtivo = true;
            }

            // ⭐ MODO EVENTO: se a fila acabou, finaliza sem chamar o história
            if (window._eventoAtivo) {
                const fila = (typeof storyEnemiesRemaining !== 'undefined') ? storyEnemiesRemaining : [];
                if (fila.length === 0) {
                    console.log('[evento-fix] advanceStoryEnemy: fila vazia no evento. Finalizando.');
                    if (typeof eventoFinalizarPartida === 'function') {
                        eventoFinalizarPartida(true, false);
                    }
                    return;
                }
            }
            return _prev.apply(this, arguments);
        };

        console.log('[evento-fix] advanceStoryEnemy guard instalado.');
    })();

    // ==============================================================
    // FIX 3: finishStoryPhase — bloqueia no modo evento
    // ==============================================================
    (function instalarFinishStoryPhaseGuard() {
        const _prev = window.finishStoryPhase;

        window.finishStoryPhase = function(victory) {
            // ⭐ FORÇA _eventoAtivo
            if (window._eventoBatalha && window._eventoBatalha.ativa === true) {
                window._eventoAtivo = true;
            }

            if (window._eventoAtivo) {
                console.log('[evento-fix] finishStoryPhase bloqueado no evento.');
                if (typeof eventoFinalizarPartida === 'function') {
                    eventoFinalizarPartida(!!victory, false);
                }
                return;
            }
            return _prev.apply(this, arguments);
        };

        console.log('[evento-fix] finishStoryPhase guard instalado.');
    })();

    // ==============================================================
    // FIX 4: handleStoryPhaseVictory — guarda contra null
    // ==============================================================
    (function instalarHandleStoryPhaseVictoryGuard() {
        const _prev = window.handleStoryPhaseVictory;

        window.handleStoryPhaseVictory = function(phase, drops, finalScore, rankSnapshot) {
            // ⭐ FORÇA _eventoAtivo
            if (window._eventoBatalha && window._eventoBatalha.ativa === true) {
                window._eventoAtivo = true;
            }

            // ⭐ MODO EVENTO: não deixa rodar
            if (window._eventoAtivo) {
                console.log('[evento-fix] handleStoryPhaseVictory bloqueado no evento.');
                if (typeof eventoFinalizarPartida === 'function') {
                    eventoFinalizarPartida(true, false);
                }
                return;
            }

            // Guarda contra phase === null
            if (!phase || !phase.id) {
                console.warn('[evento-fix] handleStoryPhaseVictory: phase é null/undefined. Ignorando.');
                return;
            }

            return _prev.apply(this, arguments);
        };

        console.log('[evento-fix] handleStoryPhaseVictory guard instalado.');
    })();

    // ==============================================================
    // FIX 5: Limpeza final — remove overlay travado
    // ==============================================================
    function _limparOverlayTravado() {
        const overlay = document.getElementById('gameOverlay');
        if (!overlay) return;

        if (overlay.classList.contains('active') && overlay.innerHTML.trim() === '') {
            console.log('[evento-fix] Overlay vazio detectado. Limpando...');
            overlay.classList.remove('active');
            overlay.style.display = 'none';
            overlay.innerHTML = '';
            window._endGameShowing = false;
        }
    }

    setInterval(_limparOverlayTravado, 500);

    // ==============================================================
    // FIX 6: Garante que eventoFinalizarPartida está exposta
    // ==============================================================
    if (typeof window.eventoFinalizarPartida !== 'function') {
        console.warn('[evento-fix] eventoFinalizarPartida NÃO encontrada!');
    } else {
        console.log('[evento-fix] eventoFinalizarPartida OK.');
    }

    // ==============================================================
    // FIX 7: Garante que eventoVoltarAldeia está exposta
    // ==============================================================
    if (typeof window.eventoVoltarAldeia !== 'function') {
        window.eventoVoltarAldeia = function() {
            console.log('[evento-fix] Fallback eventoVoltarAldeia.');
            const overlay = document.getElementById('gameOverlay');
            if (overlay) {
                overlay.classList.remove('active');
                overlay.style.display = 'none';
                overlay.innerHTML = '';
            }
            window._eventoAtivo = false;
            window._endGameShowing = false;
            window._eventoFinalizando = false;

            if (typeof restoreBaseGameFunctions === 'function') restoreBaseGameFunctions();
            if (typeof restoreBaseClassDB === 'function') restoreBaseClassDB();

            const gs = document.getElementById('gameScreen');
            if (gs) { gs.classList.remove('active'); gs.style.display = 'none'; }

            ['eventoBadge', 'eventoBanner'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.remove();
            });
            document.querySelectorAll('.evento-sair-btn').forEach(el => el.remove());

            if (typeof showStoryScreen === 'function') {
                showStoryScreen();
                setTimeout(() => {
                    if (typeof renderAldeiaScreen === 'function') renderAldeiaScreen();
                }, 100);
            }
        };
        console.log('[evento-fix] eventoVoltarAldeia fallback instalado.');
    }

    // ==============================================================
    // FIX 8: Força saída de emergência se overlay travar
    // ==============================================================
    let _overlayTravadoTimer = null;
    function _monitorarOverlayTravado() {
        const overlay = document.getElementById('gameOverlay');
        if (!overlay) return;
        if (!overlay.classList.contains('active')) {
            _overlayTravadoTimer = null;
            return;
        }
        if (_overlayTravadoTimer) return;

        _overlayTravadoTimer = setTimeout(() => {
            const ov = document.getElementById('gameOverlay');
            if (ov && ov.classList.contains('active')) {
                const botoes = ov.querySelectorAll('button');
                if (botoes.length === 0) {
                    console.log('[evento-fix] Overlay travado (sem botões). Forçando saída...');
                    ov.classList.remove('active');
                    ov.style.display = 'none';
                    ov.innerHTML = '';
                    window._endGameShowing = false;
                    window._eventoAtivo = false;
                    window._eventoFinalizando = false;
                    if (typeof eventoVoltarAldeia === 'function') {
                        eventoVoltarAldeia();
                    }
                }
            }
            _overlayTravadoTimer = null;
        }, 5000);
    }

    setInterval(_monitorarOverlayTravado, 1000);

    // ==============================================================
    // FIX 9: eventoVoltarAldeia wrapped (reset de estado)
    // ==============================================================
    const _origVoltarAldeia = window.eventoVoltarAldeia;
    if (typeof _origVoltarAldeia === 'function') {
        window.eventoVoltarAldeia = function() {
            window._eventoAtivo = false;
            window._eventoTurnoJogador = true;
            window._endGameShowing = false;
            window._eventoFinalizando = false;
            if (window._eventoBatalha) {
                window._eventoBatalha.ativa = false;
                window._eventoBatalha.aoAoDividido = false;
                window._eventoBatalha.aoAoEco = null;
                window._eventoBatalha.pesadeloTurnos = 0;
            }
            const board = document.getElementById('board');
            if (board) {
                board.querySelectorAll('.token.evento-eco-aoao, .token.evento-animal').forEach(t => t.remove());
            }
            window._eventoAnimais = [];

            return _origVoltarAldeia.apply(this, arguments);
        };
        console.log('[evento-fix] eventoVoltarAldeia wrapped.');
    }

    // ==============================================================
    // FIX 10: Força _eventoAtivo no início de toda batalha do evento
    // ==============================================================
    (function forcarEventoAtivoNoInicio() {
        const _orig = window.eventoIniciarBatalha;
        if (typeof _orig !== 'function') {
            console.warn('[evento-fix] eventoIniciarBatalha não encontrada.');
            return;
        }
        if (window._eventoIniciarBatalhaWrap) return;
        window._eventoIniciarBatalhaWrap = true;

        window.eventoIniciarBatalha = async function(bossId, faseId) {
            // ⭐ GARANTE que _eventoAtivo está true ANTES de iniciar
            window._eventoAtivo = true;
            window._eventoTurnoJogador = true;
            window._endGameShowing = false;
            window._eventoFinalizando = false;

            console.log('[evento-fix] Iniciando batalha do evento:', bossId, faseId);
            console.log('[evento-fix] _eventoAtivo =', window._eventoAtivo);

            return _orig.apply(this, arguments);
        };

        console.log('[evento-fix] eventoIniciarBatalha wrapped (força _eventoAtivo).');
    })();

    // ==============================================================
    // FIX 11: Reforço — _eventoAtivo re-setado a cada 1s se batalha ativa
    // ==============================================================
    (function reforcarEventoAtivoPorTurno() {
        setInterval(() => {
            if (window._eventoBatalha && window._eventoBatalha.ativa === true) {
                if (!window._eventoAtivo) {
                    console.log('[evento-fix] Reforçando _eventoAtivo = true');
                    window._eventoAtivo = true;
                }
            }
        }, 1000);
    })();

    // ==============================================================
    // FIX 12: Log final
    // ==============================================================
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V9.5-FIX] Correção de vitória/derrota do evento');
    console.log('═══════════════════════════════════════════════════');
    console.log('• FIX 1:  handleBossDefeat reescrito (modo evento)');
    console.log('• FIX 2:  advanceStoryEnemy com guarda');
    console.log('• FIX 3:  finishStoryPhase com guarda');
    console.log('• FIX 4:  handleStoryPhaseVictory com guarda contra null');
    console.log('• FIX 5:  Limpeza automática de overlay vazio');
    console.log('• FIX 6:  Verifica eventoFinalizarPartida');
    console.log('• FIX 7:  Fallback eventoVoltarAldeia');
    console.log('• FIX 8:  Saída de emergência se overlay travar (5s)');
    console.log('• FIX 9:  eventoVoltarAldeia wrapped (reset)');
    console.log('• FIX 10: eventoIniciarBatalha wrapped (força _eventoAtivo)');
    console.log('• FIX 11: Reforço _eventoAtivo a cada 1s');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — BLOCO 26 (V10.5 — Fix Cirúrgico do Sprite do Evento)
// =================================================================

(function fixSpriteCirurgicoV105() {
    if (window._eventoFixSpriteV105) return;
    window._eventoFixSpriteV105 = true;

    // Nós vamos interceptar a função que inicia a batalha.
    // Antes de ela rodar o initGame (que monta o tabuleiro),
    // nós injetamos o sprite do evento na tabela SPRITES global.
    const _origIniciar = window.eventoIniciarBatalha;
    
    if (typeof _origIniciar === 'function') {
        window.eventoIniciarBatalha = async function(bossId, faseId) {
            
            // 1. Pega o link do sprite na tabela do evento
            let spriteUrl = null;
            if (typeof EVENTO_SPRITES !== 'undefined' && EVENTO_SPRITES[bossId]) {
                spriteUrl = EVENTO_SPRITES[bossId];
            }

            // 2. Se achou o link (e não está vazio), injeta na tabela global
            if (spriteUrl && spriteUrl.trim() !== '' && typeof SPRITES !== 'undefined') {
                const chaveNoMotor = bossId.toUpperCase(); // Ex: AO_AO
                SPRITES[chaveNoMotor] = spriteUrl;
                console.log('[evento-sprite] Link injetado na tabela global SPRITES:', chaveNoMotor);
            }

            // 3. Agora sim, deixa o jogo iniciar normalmente
            const r = await _origIniciar.apply(this, arguments);
            return r;
        };
        console.log('✅ [V10.5] Fix do sprite (injeção global) instalado.');
    }
})();
// =================================================================
// historia.js — BLOCO 27 (V10.6 — Conectar Turno do Boss do Evento)
// =================================================================

(function fixTurnoBossEventoV106() {
    if (window._eventoFixTurnoV106) return;
    window._eventoFixTurnoV106 = true;

    // Guardamos a função manageTurns original do motor do jogo
    const _origManageTurns = window.manageTurns;
    
    if (typeof _origManageTurns === 'function') {
        window.manageTurns = function() {
            // Se estamos no modo evento, nós controlamos o turno
            if (window._eventoAtivo) {
                
                // Verifica se o herói atual é válido
                if (typeof currentPlayerIdx !== 'undefined') {
                    let next = currentPlayerIdx + 1;
                    while (next < players.length && players[next].dead) next++;

                    // Se ainda tem herói pra jogar, passa o turno pra ele
                    if (next < players.length) {
                        currentPlayerIdx = next;
                        if (typeof switchConfig === 'function') switchConfig(next);
                        if (typeof addLog === 'function') addLog(`🎮 Turno de ${players[currentPlayerIdx].name}`);
                        return;
                    }
                }

                // Se todos os heróis já jogaram, é o turno do BOSS
                if (typeof saveAndRefresh === 'function') saveAndRefresh();
                if (typeof addLog === 'function') addLog(`👹 TURNO DO BOSS!`);

                // Atualiza a interface visual
                const tp = document.getElementById('turnP_Active');
                if (tp) tp.classList.remove('active-turn');
                const tb = document.getElementById('turnBoss');
                if (tb) tb.classList.add('active-turn');

                // Chama a IA do evento!
                setTimeout(() => {
                    if (window._eventoAtivo && !window._endGameShowing && !window._eventoBossRunning) {
                        window._eventoBossRunning = true;
                        
                        // Verifica se a função da IA do evento existe
                        if (typeof eventoBossAI === 'function') {
                            eventoBossAI().then(() => {
                                window._eventoBossRunning = false;
                            }).catch((e) => {
                                console.error('[evento] Erro na IA:', e);
                                window._eventoBossRunning = false;
                            });
                        } else {
                            console.warn('[evento] eventoBossAI não encontrada.');
                            window._eventoBossRunning = false;
                        }
                    }
                }, 800); // Pequeno delay para a animação do herói terminar
                
                return;
            }

            // Se não for evento, segue o fluxo normal do modo história
            return _origManageTurns.apply(this, arguments);
        };
        
        console.log('✅ [V10.6] Turno do boss do evento conectado com sucesso!');
    } else {
        console.warn('[V10.6] manageTurns não encontrado.');
    }
})();
// =================================================================
// historia.js — BLOCO 28 (V10.7 — Execução Direta do Turno do Boss)
// =================================================================

(function fixTurnoDiretoV107() {
    if (window._eventoFixV107) return;
    window._eventoFixV107 = true;

    // Guarda a função original de executar a ação
    const _origExec = window.executeAction;

    if (typeof _origExec === 'function') {
        window.executeAction = async function() {
            // Se NÃO for evento, apenas executa o original
            if (!window._eventoAtivo) {
                return _origExec.apply(this, arguments);
            }

            // --- MODO EVENTO ---
            
            // Se não tem caminho, só publica o estado (passa o turno)
            if (typeof path !== 'undefined' && path.length === 0) {
                return _origExec.apply(this, arguments);
            }

            // Trava para não rodar duas vezes
            if (window._eventoProcessandoAcao) return;
            window._eventoProcessandoAcao = true;

            try {
                // 1. Executa a ação do jogador (o ataque/movimento dele)
                await _origExec.apply(this, arguments);

                // 2. Verifica se o boss morreu ou o jogo acabou
                if (window._endGameShowing) {
                    window._eventoProcessandoAcao = false;
                    return;
                }
                if (typeof boss !== 'undefined' && boss.dead) {
                    window._eventoProcessandoAcao = false;
                    return;
                }

                // 3. Força o turno do BOSS
                console.log('[evento-turno] Forçando o turno do boss agora...');
                
                const tp = document.getElementById('turnP_Active');
                if (tp) tp.classList.remove('active-turn');
                const tb = document.getElementById('turnBoss');
                if (tb) tb.classList.add('active-turn');

                // Delay curto pra a animação do herói terminar
                await new Promise(r => setTimeout(r, 800));

                if (typeof eventoBossAI === 'function' && !window._endGameShowing) {
                    await eventoBossAI();
                }

                // 4. Devolve o turno pro jogador
                if (!window._endGameShowing && typeof boss !== 'undefined' && !boss.dead) {
                    console.log('[evento-turno] Devolvendo o turno ao jogador...');
                    
                    // Reseta o índice pro primeiro herói vivo
                    if (typeof currentPlayerIdx !== 'undefined') {
                        currentPlayerIdx = 0;
                        while (currentPlayerIdx < players.length && players[currentPlayerIdx].dead) {
                            currentPlayerIdx++;
                        }
                        if (currentPlayerIdx < players.length && typeof switchConfig === 'function') {
                            switchConfig(currentPlayerIdx);
                        }
                    }
                    
                    if (tb) tb.classList.remove('active-turn');
                    if (tp) tp.classList.add('active-turn');
                }

            } catch (e) {
                console.error('[evento-turno] Erro na execução:', e);
            } finally {
                window._eventoProcessandoAcao = false;
            }
        };
        
        console.log('✅ [V10.7] Execução direta do turno do boss ativada.');
    }
})();
// =================================================================
// historia.js — BLOCO 29 (V10.8 — Fix do Eco da Fissão do Ao Ao)
// =================================================================

(function fixEcoAoAoV108() {
    if (window._eventoFixEcoV108) return;
    window._eventoFixEcoV108 = true;

    const _origRenderEco = window._renderAoAoEco;

    if (typeof _origRenderEco === 'function') {
        window._renderAoAoEco = function() {
            const board = document.getElementById('board');
            if (!board) return;
            
            // Remove ecos antigos
            board.querySelectorAll('.token.evento-eco-aoao').forEach(t => t.remove());
            
            if (!window._eventoBatalha || !window._eventoBatalha.aoAoEco) return;
            
            const eco = window._eventoBatalha.aoAoEco;
            const s = (typeof getStep === 'function') ? getStep() : 59;
            
            const tok = document.createElement('div');
            tok.className = 'token evento-eco-aoao';
            tok.style.left = (eco.x * s + 8) + 'px';
            tok.style.top = (eco.y * s + 8) + 'px';
            tok.style.width = s + 'px';
            tok.style.height = s + 'px';
            tok.style.zIndex = '14';
            tok.style.opacity = '0.6'; // Deixa o eco meio transparente
            tok.style.pointerEvents = 'none';
            
            // Pega o link do sprite oficial do Ao Ao
            let spriteUrl = null;
            if (typeof EVENTO_SPRITES !== 'undefined' && EVENTO_SPRITES['ao_ao']) {
                spriteUrl = EVENTO_SPRITES['ao_ao'];
            }
            
            if (spriteUrl) {
                // Cria a imagem em vez do emoji
                const img = document.createElement('img');
                img.src = spriteUrl;
                img.style.width = '140%';
                img.style.height = '140%';
                img.style.objectFit = 'contain';
                // Aplica um filtro pra ficar levemente diferente (opcional, mas fica bonito)
                img.style.filter = 'brightness(0.8) sepia(1) hue-rotate(90deg)';
                tok.appendChild(img);
            } else {
                // Fallback de segurança (se a imagem falhar)
                tok.innerHTML = `<span style="font-size:2.2rem;line-height:1;filter:drop-shadow(0 0 10px rgba(76,175,80,0.9)) hue-rotate(90deg);">🐑</span>`;
            }
            
            board.appendChild(tok);
        };

        // Aplica o patch retroativamente caso a fissão já tenha acontecido
        setTimeout(() => {
            if (window._eventoBatalha && window._eventoBatalha.aoAoDividido) {
                window._renderAoAoEco();
            }
        }, 100);

        console.log('✅ [V10.8] Eco visual do Ao Ao corrigido (agora usa o sprite).');
    }
})();
// =================================================================
// historia.js — BLOCO 30 (V10.9 — Liberar Rejogabilidade no Evento)
// =================================================================

(function fixRejogabilidadeV109() {
    if (window._eventoFixRejogarV109) return;
    window._eventoFixRejogarV109 = true;

    const _origRender = window.renderEventoSemanalScreen;

    if (typeof _origRender === 'function') {
        window.renderEventoSemanalScreen = function() {
            const r = _origRender.apply(this, arguments);

            // Após renderizar, procura o card de hoje e conserta o botão
            const screen = document.getElementById('storyScreen');
            if (!screen) return r;

            const cards = screen.querySelectorAll('.evento-card');
            cards.forEach(card => {
                const btn = card.querySelector('.evento-card-btn');
                if (!btn) return;

                // Se o botão está desabilitado mas o card tem o badge "HOJE"
                const temBadgeHoje = card.querySelector('.evento-badge.hoje');
                if (btn.disabled && temBadgeHoje) {
                    // Reabilita o botão
                    btn.disabled = false;
                    
                    // Muda o texto se estiver "CONCLUÍDO" para permitir rejogar
                    if (btn.textContent.includes('CONCLUÍDO')) {
                        btn.innerHTML = '🔄 REJOGAR';
                    } else {
                        btn.innerHTML = '▶ ENTRAR';
                    }
                    
                    // Garante que o onclick ainda funciona
                    const bossIdMatch = btn.getAttribute('onclick')?.match(/eventoEntrarAto\('([^']+)'\)/);
                    if (!bossIdMatch) {
                        // Se perdeu o onclick, recoloca
                        const cardHTML = card.innerHTML;
                        const idMatch = cardHTML.match(/eventoEntrarAto\('([^']+)'\)/);
                        if (idMatch) {
                            btn.setAttribute('onclick', `eventoEntrarAto('${idMatch[1]}')`);
                        }
                    }
                }
            });

            return r;
        };

        console.log('✅ [V10.9] Rejogabilidade do evento liberada.');
    }
})();
// =================================================================
// historia.js — BLOCO 31 (V11.0 — Fix Relógio e Rejogabilidade)
// =================================================================

(function fixRelogioEventoV110() {
    if (window._eventoFixRelogioV110) return;
    window._eventoFixRelogioV110 = true;

    const _origRender = window.renderEventoSemanalScreen;

    if (typeof _origRender === 'function') {
        window.renderEventoSemanalScreen = function() {
            // Chama a renderização original
            const r = _origRender.apply(this, arguments);

            const screen = document.getElementById('storyScreen');
            if (!screen) return r;

            // Pega o dia REAL do sistema (0 = Dom, 6 = Sáb)
            const diaReal = new Date().getDay();
            
            // Nomes dos dias para o log
            const diasNomes = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
            console.log('[V11.0] Dia real do sistema:', diasNomes[diaReal]);

            // Mapeamento dos IDs dos bosses para cada dia
            const bossPorDia = {
                0: 'luison',     // Domingo
                1: 'teju_jagua', // Segunda
                2: 'mboi_tui',   // Terça
                3: 'monai',      // Quarta
                4: 'jasy_jatere',// Quinta
                5: 'kurupi',     // Sexta
                6: 'ao_ao'       // Sábado
            };

            // Percorre os cards da tela semanal
            const cards = screen.querySelectorAll('.evento-card');
            cards.forEach(card => {
                const btn = card.querySelector('.evento-card-btn');
                const badge = card.querySelector('.evento-badge');
                const nomeEl = card.querySelector('.evento-card-name');
                
                if (!btn || !nomeEl) return;

                const nomeBoss = nomeEl.textContent.trim();
                let diaDoCard = -1;

                // Descobre qual dia é esse card
                for (let d in bossPorDia) {
                    if (window.EVENTO_BOSSES && window.EVENTO_BOSSES[bossPorDia[d]]) {
                        if (window.EVENTO_BOSSES[bossPorDia[d]].nome === nomeBoss) {
                            diaDoCard = parseInt(d);
                            break;
                        }
                    }
                }

                if (diaDoCard === -1) return;

                // 1. É hoje?
                const isHoje = (diaDoCard === diaReal);
                
                // 2. Atualiza o Badge
                if (badge) {
                    if (isHoje) {
                        badge.className = 'evento-badge hoje';
                        badge.textContent = '🎯 HOJE';
                    } else if (diaDoCard < diaReal) {
                        badge.className = 'evento-badge perdido';
                        badge.textContent = '⏰ PERDIDO';
                    } else {
                        badge.className = 'evento-badge futuro';
                        badge.textContent = '🔒 EM BREVE';
                    }
                }

                // 3. Atualiza o Botão
                if (isHoje) {
                    btn.disabled = false;
                    btn.innerHTML = '▶ ENTRAR'; // Se for hoje, sempre pode jogar
                    // Garante o onclick correto
                    btn.setAttribute('onclick', `eventoEntrarAto('${bossPorDia[diaDoCard]}')`);
                } else {
                    btn.disabled = true;
                    btn.innerHTML = (diaDoCard < diaReal) ? '🔒 PERDIDO' : '🔒 BLOQUEADO';
                }
            });

            return r;
        };

        // Se a tela já estiver aberta, força a re-renderização
        const screen = document.getElementById('storyScreen');
        if (screen && screen.classList.contains('active') && screen.innerHTML.includes('SEMANA DAS SOMBRAS')) {
            setTimeout(() => window.renderEventoSemanalScreen(), 100);
        }

        console.log('✅ [V11.0] Relógio e Rejogabilidade do evento corrigidos e sincronizados.');
    }
})();
// =================================================================
// historia.js — BLOCO 38 (V11.7 — O Destravador Teimoso)
// =================================================================

(function destravadorTeimosoV117() {
    if (window._eventoFixV117) return;
    window._eventoFixV117 = true;

    // Loop que roda a cada 500 milissegundos
    setInterval(() => {
        // Só age se a tela da semana estiver aberta
        const screen = document.getElementById('storyScreen');
        if (!screen || !screen.classList.contains('active')) return;
        if (!screen.innerHTML.includes('SEMANA DAS SOMBRAS')) return;

        // Procura o card do dia atual
        const cardHoje = document.querySelector('.evento-card.hoje');
        if (cardHoje) {
            const btn = cardHoje.querySelector('.evento-card-btn');
            
            // Se o botão existe e está bloqueado...
            if (btn && btn.hasAttribute('disabled')) {
                
                // Arranca a trava
                btn.removeAttribute('disabled');
                btn.disabled = false;
                
                // Deixa ele verdinho e pronto pra clicar
                btn.innerHTML = '🔄 REJOGAR';
                btn.style.background = 'linear-gradient(180deg, rgba(107,163,92,0.3), transparent 45%), linear-gradient(135deg, #4a7040, #2a4520)';
                btn.style.borderColor = '#6ba35c';
                btn.style.color = '#e0f0d0';
                btn.style.cursor = 'pointer';
                btn.style.boxShadow = '0 0 15px rgba(107,163,92,0.5)';
                
                console.log('✅ [V11.7] O botão foi destravado pelo vigia teimoso!');
            }
        }
    }, 500); // Verifica a cada meio segundo
})();
// =================================================================
// historia.js — BLOCO 40 (V11.9 — Fix Visual do Eco via CSS/JS)
// =================================================================

(function fixEcoVisualForcadoV119() {
    if (window._eventoFixEcoV119) return;
    window._eventoFixEcoV119 = true;

    // 1. Adiciona o CSS para esconder o emoji e formatar a imagem
    if (!document.getElementById('ecoAoAoFixStyle')) {
        const style = document.createElement('style');
        style.id = 'ecoAoAoFixStyle';
        style.textContent = `
            /* Esconde o emoji do eco */
            .token.evento-eco-aoao span {
                display: none !important;
            }
            /* Formata a imagem injetada */
            .token.evento-eco-aoao img.eco-custom-img {
                width: 140% !important;
                height: 140% !important;
                object-fit: contain !important;
                opacity: 0.7 !important;
                filter: brightness(0.6) sepia(1) hue-rotate(90deg) drop-shadow(0 0 8px rgba(76,175,80,0.8)) !important;
                animation: breatheNormal 2s infinite ease-in-out !important;
            }
        `;
        document.head.appendChild(style);
    }

    // 2. Monitora o tabuleiro procurando o eco do Ao Ao
    setInterval(() => {
        if (!window._eventoAtivo) return;
        if (!window._eventoBatalha || !window._eventoBatalha.aoAoDividido) return;

        // Acha o token do eco
        const ecoToken = document.querySelector('.token.evento-eco-aoao');
        if (!ecoToken) return;

        // Se o token existe e ainda não tem a imagem customizada...
        if (!ecoToken.querySelector('.eco-custom-img')) {
            // Pega o link do sprite
            let spriteUrl = null;
            if (typeof EVENTO_SPRITES !== 'undefined' && EVENTO_SPRITES['ao_ao']) {
                spriteUrl = EVENTO_SPRITES['ao_ao'];
            }

            if (spriteUrl && spriteUrl.trim() !== '') {
                // Cria a imagem e coloca dentro do token
                const img = document.createElement('img');
                img.src = spriteUrl;
                img.className = 'eco-custom-img';
                ecoToken.appendChild(img);
                console.log('[V11.9] Imagem do eco injetada com sucesso.');
            }
        }
    }, 500);

    console.log('✅ [V11.9] Vigia do Eco do Ao Ao instalado (emoji escondido).');
})();
// =================================================================
// historia.js — BLOCO 42 (V12.1 — Separação de Animais e Boss no Evento)
// =================================================================

(function separarAnimaisEBossV121() {
    if (window._eventoFixSeparacaoV121) return;
    window._eventoFixSeparacaoV121 = true;

    const _origIniciar = window.eventoIniciarBatalha;
    if (typeof _origIniciar === 'function') {
        window.eventoIniciarBatalha = async function(bossId, faseId) {
            
            // 1. Define qual inimigo deve ser o "boss" desta fase
            let inimigoDaFase = bossId;
            let isFaseBoss = (faseId === 'boss');

            if (!isFaseBoss) {
                // Se for fase normal (1, 2, 3, 4), pega o animal correspondente
                const cfg = window.EVENTO_BOSSES[bossId];
                if (cfg && cfg.animais) {
                    const idx = parseInt(faseId) - 1;
                    // Pega o animal daquela fase (ex: fase 1 -> animais[0])
                    if (cfg.animais[idx]) {
                        inimigoDaFase = cfg.animais[idx];
                    }
                }
            }

            console.log(`[V12.1] Fase ${faseId}: Iniciando batalha contra o animal/boss: ${inimigoDaFase}`);

            // 2. Força o motor a usar o ID correto
            if (typeof SPRITES !== 'undefined' && typeof EVENTO_SPRITES !== 'undefined') {
                let url = EVENTO_SPRITES[inimigoDaFase];
                
                // Se for animal, ele não está no EVENTO_SPRITES, então pega do SPRITES_STORY
                if (!url && typeof SPRITES_STORY !== 'undefined') {
                    url = SPRITES_STORY[inimigoDaFase];
                }
                
                // Se ainda não tem, usa fallback
                if (!url || url.trim() === '') {
                    url = 'https://i.imgur.com/L5V84tS.gif'; 
                }
                
                SPRITES[inimigoDaFase.toUpperCase()] = url;
            }

            // 3. Salva a flag de qual é o inimigo real desta fase
            window._eventoInimigoAtual = inimigoDaFase;

            // Chama o initGame original
            const r = await _origIniciar.apply(this, arguments);
            return r;
        };
    }

    // ==============================================================
    // CORREÇÃO DA IA: Garante que o boss só use as skills se for a fase boss
    // ==============================================================
    const _origBossAI = window.eventoBossAI;
    if (typeof _origBossAI === 'function') {
        window.eventoBossAI = async function() {
            if (!window._eventoAtivo) return;

            const isFaseBoss = (window._eventoBatalha && window._eventoBatalha.faseId === 'boss');
            
            if (isFaseBoss) {
                // Se for a fase do boss, roda a IA do boss normalmente
                return _origBossAI.apply(this, arguments);
            } else {
                // Se for fase normal (animal), roda a IA dos animais do modo história
                // Assim ele usa as skills do cachorro, da piranha, etc.
                if (typeof storyEnemyAI === 'function') {
                    const _originalStoryMode = window._eventoAtivo;
                    window._eventoAtivo = false; // Desliga temporariamente para não dar conflito
                    try {
                        return await storyEnemyAI();
                    } finally {
                        window._eventoAtivo = _originalStoryMode;
                    }
                }
            }
        };
    }

    console.log('✅ [V12.1] Separação de animais e boss do evento instalada.');
})();
// =================================================================
// historia.js — BLOCO 44 (V12.3 — Integrar Fragmentos na Tesouraria)
// =================================================================

(function integrarFragmentosV123() {
    if (window._eventoFixTesourariaV123) return;
    window._eventoFixTesourariaV123 = true;

    // ==============================================================
    // 1. ADICIONAR OS FRAGMENTOS NA TABELA DE MATERIAIS DO JOGO
    // --------------------------------------------------------------
    // Assim a Tesouraria e a Loja sabem que eles existem e têm nome/emoji.
    // ==============================================================
    if (typeof STORY_MATERIALS !== 'undefined') {
        // Adiciona cada fragmento na tabela global
        STORY_MATERIALS['fragmento_teju'] = { id: 'fragmento_teju', name: 'Fragmento do Teju', emoji: '🔥' };
        STORY_MATERIALS['fragmento_mboi'] = { id: 'fragmento_mboi', name: 'Fragmento do Bico', emoji: '💧' };
        STORY_MATERIALS['fragmento_monai'] = { id: 'fragmento_monai', name: 'Fragmento Alado', emoji: '🌪️' };
        STORY_MATERIALS['fragmento_jasy'] = { id: 'fragmento_jasy', name: 'Fragmento Solar', emoji: '☀️' };
        STORY_MATERIALS['fragmento_kurupi'] = { id: 'fragmento_kurupi', name: 'Fragmento Vivo', emoji: '🌱' };
        STORY_MATERIALS['fragmento_aoao'] = { id: 'fragmento_aoao', name: 'Fragmento da Fome', emoji: '🐾' };
        STORY_MATERIALS['fragmento_luison'] = { id: 'fragmento_luison', name: 'Fragmento Sombrio', emoji: '🌑' };
    }

    // ==============================================================
    // 2. ADICIONAR PREÇO DE VENDA PADRÃO PARA OS FRAGMENTOS
    // --------------------------------------------------------------
    // Se o jogador tentar vender, vale 30 de ouro (igual itens raros).
    // ==============================================================
    if (typeof STORY_MATERIAL_PRICES !== 'undefined') {
        STORY_MATERIAL_PRICES['fragmento_teju'] = 30;
        STORY_MATERIAL_PRICES['fragmento_mboi'] = 30;
        STORY_MATERIAL_PRICES['fragmento_monai'] = 30;
        STORY_MATERIAL_PRICES['fragmento_jasy'] = 30;
        STORY_MATERIAL_PRICES['fragmento_kurupi'] = 30;
        STORY_MATERIAL_PRICES['fragmento_aoao'] = 30;
        STORY_MATERIAL_PRICES['fragmento_luison'] = 30;
    }

    // ==============================================================
    // 3. BLINDAGEM EXTRA (Caso algum material novo apareça)
    // --------------------------------------------------------------
    // Se por acaso a Tesouraria tentar ler o emoji de um item que
    // ainda não está na tabela, ele não quebra o jogo.
    // ==============================================================
    const _origPreco = window.getMaterialPrice;
    if (typeof _origPreco === 'function') {
        window.getMaterialPrice = function(matId) {
            try {
                const p = _origPreco.apply(this, arguments);
                return (p !== undefined && p !== null) ? p : 2;
            } catch (e) {
                return 2;
            }
        };
    }

    console.log('✅ [V12.3] Fragmentos integrados à Tesouraria com sucesso.');
})();
// =================================================================
// historia.js — BLOCO 45 (V12.4 — Override Seguro do Inventário e Loja)
// =================================================================

(function overrideSeguroTesourariaV124() {
    if (window._eventoFixTesourariaV124) return;
    window._eventoFixTesourariaV124 = true;

    // 1. Adiciona os fragmentos e preços globalmente
    if (typeof STORY_MATERIALS !== 'undefined') {
        STORY_MATERIALS['fragmento_teju'] = { id: 'fragmento_teju', name: 'Fragmento do Teju', emoji: '🔥' };
        STORY_MATERIALS['fragmento_mboi'] = { id: 'fragmento_mboi', name: 'Fragmento do Bico', emoji: '💧' };
        STORY_MATERIALS['fragmento_monai'] = { id: 'fragmento_monai', name: 'Fragmento Alado', emoji: '🌪️' };
        STORY_MATERIALS['fragmento_jasy'] = { id: 'fragmento_jasy', name: 'Fragmento Solar', emoji: '☀️' };
        STORY_MATERIALS['fragmento_kurupi'] = { id: 'fragmento_kurupi', name: 'Fragmento Vivo', emoji: '🌱' };
        STORY_MATERIALS['fragmento_aoao'] = { id: 'fragmento_aoao', name: 'Fragmento da Fome', emoji: '🐾' };
        STORY_MATERIALS['fragmento_luison'] = { id: 'fragmento_luison', name: 'Fragmento Sombrio', emoji: '🌑' };
    }
    if (typeof STORY_MATERIAL_PRICES !== 'undefined') {
        for (let i = 1; i <= 7; i++) {
            STORY_MATERIAL_PRICES['fragmento_' + i] = 30;
        }
        STORY_MATERIAL_PRICES['fragmento_teju'] = 30;
        STORY_MATERIAL_PRICES['fragmento_mboi'] = 30;
        STORY_MATERIAL_PRICES['fragmento_monai'] = 30;
        STORY_MATERIAL_PRICES['fragmento_jasy'] = 30;
        STORY_MATERIAL_PRICES['fragmento_kurupi'] = 30;
        STORY_MATERIAL_PRICES['fragmento_aoao'] = 30;
        STORY_MATERIAL_PRICES['fragmento_luison'] = 30;
    }

    // 2. Substitui a função de renderização do Inventário (Tesouraria)
    window.renderTesourariaInventario = function(materialIds) {
        if (materialIds.length === 0) {
            return `
                <div class="tesouraria-empty">
                    <div class="tesouraria-empty-icon">📦</div>
                    <div class="tesouraria-empty-text">Seu inventário está vazio.</div>
                    <div class="tesouraria-empty-hint">Derrote inimigos para coletar materiais.</div>
                </div>`;
        }

        materialIds.sort((a, b) => (window.getMaterialPrice ? window.getMaterialPrice(b) : 2) - (window.getMaterialPrice ? window.getMaterialPrice(a) : 2));
        
        const inv_count = (id) => STORY_PROGRESS.inventory[id] || 0;
        const totalValue = materialIds.reduce((sum, id) => sum + (window.getMaterialPrice ? window.getMaterialPrice(id) : 2) * inv_count(id), 0);

        const cardsHTML = materialIds.map(id => {
            const m = STORY_MATERIALS[id] || { emoji: '❓', name: 'Desconhecido' }; // <-- A PROTEÇÃO ESTÁ AQUI
            const qty = STORY_PROGRESS.inventory[id] || 0;
            const price = window.getMaterialPrice ? window.getMaterialPrice(id) : 2;
            
            return `
                <div class="tesouraria-item">
                    <div class="tesouraria-item-icon">${m.emoji}</div>
                    <div class="tesouraria-item-name">${m.name}</div>
                    <div class="tesouraria-item-qty">×${qty}</div>
                    <div class="tesouraria-item-price">${uiIcon('gold')} ${price} / un.</div>
                </div>`;
        }).join('');

        return `
            <div class="tesouraria-total">
                Valor total do inventário: <b>${uiIcon('gold')} ${totalValue}</b>
            </div>
            <div class="tesouraria-grid">${cardsHTML}</div>
            <div class="tesouraria-hint">💡 Venda materiais no <b>Curandeiro</b> para ganhar ouro.</div>
        `;
    };

    // 3. Substitui a função da Loja (Curandeiro) para proteção total
    window.renderLojaScreenCompleta = function() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;
        const gold = STORY_PROGRESS.gold || 0;

        // Compra
        const buyHTML = STORY_SHOP_ITEMS.map(it => {
            const m = STORY_MATERIALS[it.id] || { emoji: '❓' }; // Proteção
            const emoji = m.emoji;
            const can = gold >= it.price;
            return `<div class="story-shop-item ${can?'':'disabled'}">
                <div class="story-shop-emoji">${emoji}</div>
                <div class="story-shop-name">${it.name}</div>
                <div class="story-shop-desc">${it.description}</div>
                <div class="story-shop-price">${uiIcon('gold')} ${it.price}</div>
                <button class="story-shop-btn" ${can?'':'disabled'} onclick="buyShopItem('${it.id}',${it.price})">COMPRAR</button>
            </div>`;
        }).join('');

        // Venda
        const inv = STORY_PROGRESS.inventory || {};
        const sellIds = Object.keys(inv).filter(id => inv[id] > 0);
        let sellHTML = '';

        if (sellIds.length === 0) {
            sellHTML = '<div class="tesouraria-empty" style="margin:0;padding:30px;"><div class="tesouraria-empty-text">Nenhum material para vender.</div></div>';
        } else {
            sellIds.sort((a, b) => (window.getMaterialPrice ? window.getMaterialPrice(b) : 2) - (window.getMaterialPrice ? window.getMaterialPrice(a) : 2));
            sellHTML = '<div class="sell-grid">' + sellIds.map(id => {
                const m = STORY_MATERIALS[id] || { emoji: '❓', name: 'Desconhecido' }; // Proteção
                const qty = inv[id];
                const price = window.getMaterialPrice ? window.getMaterialPrice(id) : 2;
                return `<div class="sell-card">
                    <div class="sell-icon">${m.emoji}</div>
                    <div class="sell-info">
                        <div class="sell-name">${m.name}</div>
                        <div class="sell-qty">×${qty}</div>
                        <div class="sell-price">${uiIcon('gold')} ${price} cada</div>
                    </div>
                    <button class="sell-btn" onclick="handleSellMaterial('${id}', 1)">Vender 1</button>
                    <button class="sell-btn sell-all" onclick="handleSellMaterial('${id}', ${qty})">Vender tudo (${price * qty})</button>
                </div>`;
            }).join('') + '</div>';
        }

        screen.innerHTML = `
            <div class="story-container">
                <div class="story-header">
                    <h1 class="story-title">🧙 CURANDEIRO</h1>
                    <p class="story-subtitle">"Compro e vendo. Seja bem-vindo." (${gold} ${uiIcon('gold')})</p>
                </div>

                <div class="curandeiro-tabs">
                    <button class="curandeiro-tab active" onclick="curandeiroTab='comprar'; renderLojaScreenCompleta();">🛒 Comprar</button>
                    <button class="curandeiro-tab" onclick="curandeiroTab='vender'; renderLojaScreenCompleta();">💰 Vender</button>
                </div>

                <div class="curandeiro-content">
                    ${(typeof curandeiroTab !== 'undefined' && curandeiroTab === 'vender') ? sellHTML : '<div class="story-shop-grid">' + buyHTML + '</div>'}
                </div>

                <div class="story-footer"><button class="story-back-btn" onclick="renderAldeiaScreen()">← VOLTAR À ALDEIA</button></div>
            </div>
        `;
    };

    console.log('✅ [V12.4] Tesouraria e Curandeiro blindados (Override Total).');
})();
// =================================================================
// historia.js — BLOCO 47 (V12.6 — Correção de Sprites sem Remover V12.1)
// =================================================================

(function fixSpriteAnimaisV126() {
    if (window._eventoSpriteFixV126) return;
    window._eventoSpriteFixV126 = true;

    // Sobrescreve a função que o V12.1 instalou
    const _origIniciar = window.eventoIniciarBatalha;
    if (typeof _origIniciar === 'function') {
        window.eventoIniciarBatalha = async function(bossId, faseId) {
            
            // 1. Define qual inimigo deve ser o "boss" desta fase
            let inimigoDaFase = bossId;
            let isFaseBoss = (faseId === 'boss');

            if (!isFaseBoss) {
                const cfg = window.EVENTO_BOSSES[bossId];
                if (cfg && cfg.animais) {
                    const idx = parseInt(faseId) - 1;
                    if (cfg.animais[idx]) {
                        inimigoDaFase = cfg.animais[idx];
                    }
                }
            }

            // 2. Lógica de injeção de sprite com prioridade correta
            if (typeof SPRITES !== 'undefined') {
                let spriteUrl = null;

                if (isFaseBoss) {
                    // Boss final -> EVENTO_SPRITES
                    if (typeof EVENTO_SPRITES !== 'undefined' && EVENTO_SPRITES[bossId]) {
                        spriteUrl = EVENTO_SPRITES[bossId];
                    }
                } else {
                    // Animais normais -> SPRITES_STORY
                    if (typeof SPRITES_STORY !== 'undefined' && SPRITES_STORY[inimigoDaFase]) {
                        spriteUrl = SPRITES_STORY[inimigoDaFase];
                    }
                }

                // 3. Aplica no motor. Se não achar, usa pixel invisível.
                if (spriteUrl && spriteUrl.trim() !== '') {
                    SPRITES[inimigoDaFase.toUpperCase()] = spriteUrl;
                    console.log(`[V12.6] Sprite correto: ${inimigoDaFase}`);
                } else {
                    // FIM DO TUPÃ NO LUGAR DO MONSTRO
                    SPRITES[inimigoDaFase.toUpperCase()] = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                    console.warn(`[V12.6] Sprite não encontrado para ${inimigoDaFase}. Invisível.`);
                }
            }

            window._eventoInimigoAtual = inimigoDaFase;
            return _origIniciar.apply(this, arguments);
        };
    }

    console.log('✅ [V12.6] Correção de sprites aplicada por cima do V12.1.');
})();
// =================================================================
// historia.js — BLOCO 48 (V12.7 — Fix do Card do Boss e Animais)
// =================================================================

(function fixCardBossAnimaisV127() {
    if (window._eventoSpriteFixV127) return;
    window._eventoSpriteFixV127 = true;

    // Guarda a função original que atualiza o Card do Boss no canto da tela
    const _origUpdateBossCard = window.updateBossCard;
    
    if (typeof _origUpdateBossCard === 'function') {
        window.updateBossCard = function() {
            // Se estivermos no modo evento, nós controlamos o visual do card
            if (window._eventoAtivo && window._eventoInimigoAtual) {
                const spriteEl = document.getElementById('bossCardSprite');
                const nameEl = document.getElementById('bossCardName');
                const hpEl = document.getElementById('bossCardHp');
                
                if (!spriteEl || !nameEl || !hpEl) return;

                const inimigoId = window._eventoInimigoAtual;
                const isFaseBoss = (window._eventoBatalha && window._eventoBatalha.faseId === 'boss');

                let spriteUrl = null;
                let nomeInimigo = inimigoId;

                // Pega o link da imagem (Boss ou Animal)
                if (isFaseBoss) {
                    if (typeof EVENTO_SPRITES !== 'undefined' && EVENTO_SPRITES[inimigoId]) {
                        spriteUrl = EVENTO_SPRITES[inimigoId];
                    }
                    // Pega o nome bonito do boss
                    if (typeof EVENTO_BOSSES !== 'undefined' && EVENTO_BOSSES[inimigoId]) {
                        nomeInimigo = EVENTO_BOSSES[inimigoId].nome;
                    }
                } else {
                    // É um animal: puxa o sprite do SPRITES_STORY
                    if (typeof SPRITES_STORY !== 'undefined' && SPRITES_STORY[inimigoId]) {
                        spriteUrl = SPRITES_STORY[inimigoId];
                    }
                    // Pega o nome bonito do animal
                    if (typeof STORY_ENEMIES !== 'undefined' && STORY_ENEMIES[inimigoId]) {
                        nomeInimigo = STORY_ENEMIES[inimigoId].name;
                    }
                }

                // Aplica a imagem
                if (spriteUrl && spriteUrl.trim() !== '') {
                    spriteEl.src = spriteUrl;
                    spriteEl.style.display = '';
                } else {
                    spriteEl.style.display = 'none'; // Esconde se não achar
                }

                // Aplica o nome e o HP
                nameEl.textContent = nomeInimigo;
                if (typeof boss !== 'undefined') {
                    hpEl.innerHTML = `HP: <b>${boss.hp}</b> / ${boss.maxHp}`;
                }
                
                return; // Impede que a função original do entidades.js sobrescreva com emoji
            }

            // Se não for evento, roda o comportamento normal
            return _origUpdateBossCard.apply(this, arguments);
        };
    }

    console.log('✅ [V12.7] Cards de Animais e Boss do Evento corrigidos.');
})();
// =================================================================
// historia.js — BLOCO 49 (V12.8 — Substituição do Lobisomem e Fix Visual)
// =================================================================

(function fixSubstituirLobisomemV128() {
    if (window._eventoFixV128) return;
    window._eventoFixV128 = true;

    // 1. Substitui o Lobisomem pelo Lobo-Guará no Evento (para evitar conflito de ID)
    if (typeof EVENTO_BOSSES !== 'undefined' && EVENTO_BOSSES['luison']) {
        const animais = EVENTO_BOSSES['luison'].animais;
        // O Lobisomem está no índice 3 (Fase 4)
        if (animais[3] === 'lobisomem') {
            animais[3] = 'lobo_guara';
            console.log('[V12.8] Lobisomem substituído por Lobo-Guará no evento.');
        }
    }

    // 2. Força o card do boss a puxar o sprite certo (bypass total)
    const _origUpdateBossCard = window.updateBossCard;
    if (typeof _origUpdateBossCard === 'function') {
        window.updateBossCard = function() {
            if (window._eventoAtivo && window._eventoInimigoAtual) {
                const spriteEl = document.getElementById('bossCardSprite');
                const nameEl = document.getElementById('bossCardName');
                const hpEl = document.getElementById('bossCardHp');
                if (!spriteEl || !nameEl || !hpEl) return;

                const id = window._eventoInimigoAtual;
                const isBoss = window._eventoBatalha && window._eventoBatalha.faseId === 'boss';
                
                let url = null;
                let nome = id;

                // Tenta pegar o link de todas as formas possíveis
                if (isBoss && typeof EVENTO_SPRITES !== 'undefined') {
                    url = EVENTO_SPRITES[id];
                    if (EVENTO_BOSSES[id]) nome = EVENTO_BOSSES[id].nome;
                } else {
                    if (typeof SPRITES_STORY !== 'undefined') url = SPRITES_STORY[id];
                    if (typeof STORY_ENEMIES !== 'undefined' && STORY_ENEMIES[id]) nome = STORY_ENEMIES[id].name;
                }

                // Se não achou, tenta o base
                if (!url && typeof SPRITES !== 'undefined' && SPRITES[id.toUpperCase()]) {
                    url = SPRITES[id.toUpperCase()];
                }

                if (url && url.trim() !== '') {
                    spriteEl.src = url;
                    spriteEl.style.display = 'block';
                } else {
                    spriteEl.style.display = 'none';
                }

                nameEl.textContent = nome;
                hpEl.innerHTML = `HP: <b>${boss.hp}</b> / ${boss.maxHp}`;
                return;
            }
            return _origUpdateBossCard.apply(this, arguments);
        };
    }

    // 3. Força o tabuleiro a usar o sprite certo (evita o Tupã)
    const _origApply = window.applyStoryEnemyToBoss;
    if (typeof _origApply === 'function') {
        window.applyStoryEnemyToBoss = function(enemyId) {
            const r = _origApply.apply(this, arguments);
            
            setTimeout(() => {
                if (window._eventoAtivo) {
                    const imgBoss = document.getElementById('imgBoss');
                    if (!imgBoss) return;

                    const isBoss = window._eventoBatalha && window._eventoBatalha.faseId === 'boss';
                    let url = null;

                    if (isBoss && typeof EVENTO_SPRITES !== 'undefined') {
                        url = EVENTO_SPRITES[enemyId];
                    } else {
                        if (typeof SPRITES_STORY !== 'undefined') url = SPRITES_STORY[enemyId];
                    }

                    if (url && url.trim() !== '') {
                        imgBoss.src = url;
                        imgBoss.style.display = 'block';
                    } else {
                        // Se não achar, deixa invisível (não coloca o Tupã)
                        imgBoss.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                    }
                }
            }, 150);

            return r;
        };
    }

    console.log('✅ [V12.8] Lobisomem substituído e sprites forçados.');
})();
// =================================================================
// historia.js — BLOCO 50 (V12.9 — Equipar Armas do Evento)
// =================================================================

(function fixEquiparArmasEventoV129() {
    if (window._eventoFixEquiparV129) return;
    window._eventoFixEquiparV129 = true;

    // ==============================================================
    // 1. ENSINAR O JOGO A RECONHECER AS ARMAS DO EVENTO
    // ==============================================================
    const _origGetWeapon = window.getWeaponById;
    if (typeof _origGetWeapon === 'function') {
        window.getWeaponById = function(id) {
            // Tenta achar nas armas normais
            const normal = _origGetWeapon.apply(this, arguments);
            if (normal) return normal;

            // Se não achou, tenta achar nas armas do evento
            if (typeof EVENTO_ARMAS !== 'undefined' && EVENTO_ARMAS[id]) {
                return EVENTO_ARMAS[id];
            }
            return null;
        };
    }

    // ==============================================================
    // 2. ENSINAR O JOGO A LISTAR AS ARMAS DO EVENTO NA HORA DE EQUIPAR
    // ==============================================================
    const _origOpenDetails = window.openHeroDetails;
    if (typeof _origOpenDetails === 'function') {
        window.openHeroDetails = function(heroClass) {
            // Antes de abrir o painel, vamos "injetar" as armas do evento
            // na lista de armas forjadas (temporariamente)
            if (typeof STORY_PROGRESS !== 'undefined') {
                if (!Array.isArray(STORY_PROGRESS.craftedWeapons)) STORY_PROGRESS.craftedWeapons = [];
                if (!Array.isArray(STORY_PROGRESS.eventoArmas)) STORY_PROGRESS.eventoArmas = [];

                // Mantém compatibilidade com saves antigos que guardavam IDs raw.
                // Drops novos entram no inventário com UID em craftedWeapons.
                STORY_PROGRESS.eventoArmas.forEach(armaId => {
                    const baseId = String(armaId || '').split('#')[0];
                    const existe = STORY_PROGRESS.craftedWeapons.some(id =>
                        String(id).split('#')[0] === baseId
                    );
                    if (baseId && !existe) {
                        STORY_PROGRESS.craftedWeapons.push(
                            `${baseId}#${Date.now()}${Math.floor(Math.random() * 1000000)}`
                        );
                    }
                });
            }

            // Chama o painel original
            const r = _origOpenDetails.apply(this, arguments);

            // Depois de aberto, garante que o seletor foi preenchido com as armas do evento
            setTimeout(() => {
                // Procura os selects de equipamento no painel
                const selects = document.querySelectorAll('.equip-select');
                if (selects.length > 0) {
                    // Se o seletor só tem a opção "Nenhuma", ele não foi atualizado
                    // (O jogo original já deveria ter atualizado, mas por segurança...)
                    console.log('[V12.9] Painel de equipamento aberto com armas do evento.');
                }
            }, 100);

            return r;
        };
    }

    console.log('✅ [V12.9] Armas do evento agora podem ser equipadas.');
})();
// =================================================================
// historia.js — BLOCO 51 (V13.0 — Correção de Menus e Bestiário)
// =================================================================

(function fixMenusBestiarioV130() {
    if (window._eventoFixMenusV130) return;
    window._eventoFixMenusV130 = true;

    // ==============================================================
    // 1. CORRIGIR O MENU "?" DOS HERÓIS (Tapyra e Rudá)
    // ==============================================================
    
    // Adiciona os textos que faltavam
    if (typeof STORY_HERO_DETAILS !== 'undefined') {
        STORY_HERO_DETAILS["Tapyra'yawara"] = {
            paName: 'Coluna do Caçador',
            paDesc: "Tapyra'yawara mira o alvo e dispara uma flecha de pedra que invoca uma coluna vertical de terra, prendendo e esmagando tudo na coluna do alvo.",
            paExtra: 'Coluna vertical inteira no alvo (8 tiles).',
            tactical: 'Alcance: 3 (ataca à distância). 12 HP.',
            notes: 'Um dos mais resistentes dos arqueiros.'
        };
        
        STORY_HERO_DETAILS["Rudá"] = {
            paName: 'Flecha do Amor',
            paDesc: 'Rudá dispara uma flecha de luz pura que atravessa o campo de batalha. Ela atinge o alvo principal e o tile exatamente no meio do caminho, causando dano em cadeia.',
            paExtra: 'Dano no alvo e no tile central entre Rudá e o alvo.',
            tactical: 'Alcance: 3 (ataca à distância). 10 HP. 4 ATK.',
            notes: 'Deus do amor e da guerra justa. Desbloqueado ao coletar os 7 Fragmentos Divinos.'
        };
    }

    // Corrige a função de abrir o menu para não quebrar com apóstrofos
    const _origOpenDetails = window.openHeroDetails;
    if (typeof _origOpenDetails === 'function') {
        window.openHeroDetails = function(heroClass) {
            const safeClass = String(heroClass).replace(/\\(['\\rn])/g, (_, escaped) => ({
                "'": "'",
                "\\": "\\",
                r: "\r",
                n: "\n",
            })[escaped]);
            try {
                return _origOpenDetails.call(this, safeClass);
            } catch (e) {
                console.warn('[V13.0] Erro no menu do herói:', heroClass, e);
                // Fallback: abre o painel mesmo sem os detalhes
                if (typeof closeHeroDetails === 'function') closeHeroDetails();
                const ov = document.createElement('div');
                ov.id = 'heroDetailsOverlay';
                ov.className = 'hero-details-overlay open';
                ov.innerHTML = `
                    <div class="hero-details-panel">
                        <div class="hero-details-header">
                            <h2 class="hero-details-name">${heroClass}</h2>
                            <button class="hero-details-close" onclick="closeHeroDetails()">✕</button>
                        </div>
                        <div class="hero-details-section">
                            <div class="hero-details-section-title">📊 ATRIBUTOS</div>
                            <div class="hero-details-note">Detalhes não encontrados para este herói.</div>
                        </div>
                    </div>
                `;
                document.body.appendChild(ov);
            }
        };
    }

    // ==============================================================
    // 2. CRIAR MENU DO BESTIÁRIO DO EVENTO
    // ==============================================================
    window.renderBestiarioEvento = function() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;

        const bossList = (typeof EVENTO_BOSSES !== 'undefined') ? Object.values(EVENTO_BOSSES) : [];
        
        let cardsHTML = '';
        bossList.forEach(boss => {
            const prog = (typeof getEventoProgresso === 'function') ? getEventoProgresso(boss.id) : null;
            const derrotado = prog && prog.fasesConcluidas.includes('boss');
            
            // Define o elemento e cor
            const elemCor = { FOGO:'#e74c3c', AGUA:'#3498db', TERRA:'#27ae60', AR:'#f1c40f' }[boss.elemento] || '#c9a227';

            cardsHTML += `
                <div class="evento-card" style="--evento-elem-color:${elemCor};">
                    <div class="evento-card-header">
                        <span class="evento-dia">${boss.diaLabel}</span>
                        ${derrotado ? '<span class="evento-badge concluido">✅ DERROTADO</span>' : '<span class="evento-badge futuro">🔒 NÃO ENFRENTADO</span>'}
                    </div>
                    <div class="evento-card-sprite" style="${derrotado ? '' : 'filter: grayscale(1) brightness(0.3);'}">
                        ${derrotado ? eventoIcon(boss.id, 'large') : '❓'}
                    </div>
                    <div class="evento-card-name">${derrotado ? boss.nome : '???'}</div>
                    <div class="evento-card-titulo">${derrotado ? boss.titulo : 'Desconhecido'}</div>
                    <div class="evento-card-stats">
                        <span>HP ${boss.hp}</span>
                        <span>ATK ${boss.atk}</span>
                    </div>
                    <div class="evento-card-elem" style="color:${elemCor};">${boss.elemento}</div>
                    ${derrotado ? `<div class="evento-lore-box" style="font-size:0.8rem; padding:10px; margin-top:5px;">${boss.lore}</div>` : ''}
                </div>
            `;
        });

        // Pesadelo
        if (typeof EVENTO_PESADELO !== 'undefined') {
            const pes = EVENTO_PESADELO;
            const derrotadoPes = false; // O pesadelo não salva progresso, então fica como mistério
            cardsHTML += `
                <div class="evento-card" style="--evento-elem-color:#8e44ad; grid-column: 1 / -1; max-width: 400px; margin: 0 auto;">
                    <div class="evento-card-header">
                        <span class="evento-dia">EVENTO MENSAL</span>
                        <span class="evento-badge perdido">🌑 MISTÉRIO</span>
                    </div>
                    <div class="evento-card-sprite" style="filter: grayscale(1) brightness(0.3);">❓</div>
                    <div class="evento-card-name">???</div>
                    <div class="evento-card-titulo">A Manifestação da Destruição</div>
                    <div class="evento-lore-box" style="font-size:0.8rem; padding:10px; margin-top:5px;">Dizem que quando a lua nova se alinha com o sol, os Sete Selados se fundem. O que desperta é o fim.</div>
                </div>
            `;
        }

        screen.innerHTML = `
            <div class="story-container">
                <div class="story-header">
                    <h1 class="story-title">📖 BESTIÁRIO DO EVENTO</h1>
                    <p class="story-subtitle">Os Sete Selados e a manifestação do Pesadelo</p>
                </div>
                <div class="evento-grid">${cardsHTML}</div>
                <div class="story-footer">
                    <button class="story-back-btn" onclick="renderAldeiaScreen()">← VOLTAR À ALDEIA</button>
                </div>
            </div>
        `;
        screen.classList.add('active');
        screen.style.display = 'flex';
    };

    // ==============================================================
    // 3. CRIAR MENU DE HERÓIS DO EVENTO (Equipar e Ver Lore)
    // ==============================================================
    window.renderHeroisEvento = function() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;

        const unlockedList = STORY_PROGRESS.unlockedHeroesStory || ['Tupa', 'Sume', 'Caipora'];
        const allHeroes = Object.values(STORY_HERO_CLASSES);
        
        // Filtra apenas os heróis do evento/raridade alta
        const heroesEvento = allHeroes.filter(h => h.rarity >= 4 || h.unlockReq?.type === 'special');

        let cardsHTML = '';
        heroesEvento.forEach(hero => {
            const isUnlocked = unlockedList.includes(hero.className);
            const isSelected = STORY_PROGRESS.selectedHeroes.includes(hero.className);
            
            let spriteSrc = '';
            if (hero.spriteKey && SPRITES_STORY[hero.spriteKey]) {
                spriteSrc = SPRITES_STORY[hero.spriteKey];
            } else if (SPRITES[hero.className]) {
                spriteSrc = SPRITES[hero.className];
            }
            
            const spriteBlock = spriteSrc ? `<img src="${spriteSrc}" class="story-hero-sprite" style="filter: ${!isUnlocked ? 'brightness(0) invert(0.2)' : ''}">` : `<div class="story-hero-sprite" style="font-size:3rem; display:flex; align-items:center; justify-content:center;">${isUnlocked ? '❓' : '🔒'}</div>`;

            const el = hero.element || 'FOGO';
            
            cardsHTML += `
                <div class="story-hero-card ${isSelected ? 'selected' : ''}" style="border-color: ${isUnlocked ? '#e8b923' : '#3d2d18'};">
                    ${spriteBlock}
                    <div class="story-hero-name">${isUnlocked ? hero.displayName : '???'}</div>
                    <div class="story-hero-element elem-${el}">${elemIcon(el)} ${isUnlocked ? hero.element || 'DINÂMICO' : '???'}</div>
                    <div class="story-hero-level">${hero.role}</div>
                    ${isUnlocked ? `
                        <div style="margin-top:10px; font-size:0.8rem; color:#8ac070;">Desbloqueado</div>
                        <button class="hero-details-btn" onclick="openHeroDetails('${hero.className.replace(/'/g, "\\'")}')" style="margin: 10px auto 0; position:relative; top:auto; left:auto;">?</button>
                    ` : `
                        <div class="story-hero-lock-info" style="margin-top:10px;">
                            ${hero.unlockReq?.type === 'special' ? 'Junte os 7 Fragmentos' : `Zere no ${hero.unlockReq?.difficulty || 'Normal'}`}
                        </div>
                    `}
                </div>
            `;
        });

        screen.innerHTML = `
            <div class="story-container">
                <div class="story-header">
                    <h1 class="story-title">🏅 HERÓIS LENDÁRIOS</h1>
                    <p class="story-subtitle">Seres de poder ancestral despertados no evento</p>
                </div>
                <div class="story-heroes-grid">${cardsHTML}</div>
                <div class="story-footer">
                    <button class="story-back-btn" onclick="renderAldeiaScreen()">← VOLTAR À ALDEIA</button>
                </div>
            </div>
        `;
        screen.classList.add('active');
        screen.style.display = 'flex';
    };

    // ==============================================================
    // 4. ADICIONAR OS BOTÕES NA ALDEIA
    // ==============================================================
    const _origRenderAldeia = window.renderAldeiaScreen;
    if (typeof _origRenderAldeia === 'function') {
        window.renderAldeiaScreen = function() {
            const r = _origRenderAldeia.apply(this, arguments);
            
            const gridEl = document.querySelector('.story-ald-grid');
            if (!gridEl) return r;

            // Adiciona botão "Heróis Lendários"
            if (!gridEl.querySelector('.evento-herois-card')) {
                const card = document.createElement('div');
                card.className = 'story-ald-location evento-herois-card';
                card.style.borderColor = '#e8b923'; // Dourado
                card.onclick = () => window.renderHeroisEvento();
                card.innerHTML = `
                    <div class="story-ald-loc-icon">🏅</div>
                    <div class="story-ald-loc-info">
                        <div class="story-ald-loc-name">HERÓIS LENDÁRIOS</div>
                        <div class="story-ald-loc-desc">Veja e equipe os heróis do evento</div>
                    </div>
                `;
                gridEl.appendChild(card);
            }

            // Adiciona botão "Bestiário do Evento"
            if (!gridEl.querySelector('.evento-bestiario-card')) {
                const card = document.createElement('div');
                card.className = 'story-ald-location evento-bestiario-card';
                card.style.borderColor = '#8e44ad'; // Roxo
                card.onclick = () => window.renderBestiarioEvento();
                card.innerHTML = `
                    <div class="story-ald-loc-icon">🐉</div>
                    <div class="story-ald-loc-info">
                        <div class="story-ald-loc-name">BESTIÁRIO DO EVENTO</div>
                        <div class="story-ald-loc-desc">Os 7 Selados e o Pesadelo</div>
                    </div>
                `;
                gridEl.appendChild(card);
            }

            return r;
        };
    }

    console.log('✅ [V13.0] Menus de Heróis, Bestiário e Menu "?" corrigidos.');
})();
// =================================================================
// historia.js — BLOCO 52 (V13.1 — Correção Definitiva da OCA e Bestiário)
// =================================================================

(function fixOcaEBestiarioV131() {
    if (window._eventoFixV131) return;
    window._eventoFixV131 = true;

    // ==============================================================
    // 1. CONSERTAR O BOTÃO "?" DA OCA (Apóstrofo e Detalhes)
    // ==============================================================
    
    // Corrige os textos do Rudá e Tapyra
    if (typeof STORY_HERO_DETAILS !== 'undefined') {
        STORY_HERO_DETAILS["Tapyra'yawara"] = {
            paName: 'Coluna do Caçador',
            paDesc: "Tapyra'yawara dispara uma flecha de pedra que invoca uma coluna vertical de terra, prendendo e esmagando tudo na coluna do alvo.",
            paExtra: 'Coluna vertical inteira no alvo (8 tiles).',
            tactical: 'Alcance: 3 (ataca à distância). 12 HP.',
            notes: 'Um dos mais resistentes dos arqueiros.'
        };
        
        STORY_HERO_DETAILS["Rudá"] = {
            paName: 'Flecha do Amor',
            paDesc: 'Rudá dispara uma flecha de luz divina que atinge o alvo e o tile exatamente no meio do caminho, causando dano em cadeia.',
            paExtra: 'Dano no alvo e no tile central entre Rudá e o alvo.',
            tactical: 'Alcance: 3 (ataque à distância). 10 HP. 4 ATK.',
            notes: 'Deus do amor e da guerra justa. Desbloqueado ao coletar os 7 Fragmentos Divinos.'
        };
    }

    // Blinda a função de abrir o menu para aceitar apóstrofos
    const _origOpenDetails = window.openHeroDetails;
    if (typeof _origOpenDetails === 'function') {
        window.openHeroDetails = function(heroClass) {
            const safeClass = String(heroClass).replace(/\\(['\\rn])/g, (_, escaped) => ({
                "'": "'",
                "\\": "\\",
                r: "\r",
                n: "\n",
            })[escaped]);
            return _origOpenDetails.call(this, safeClass);
        };
    }

    // Garante que o botão "?" seja injetado corretamente na OCA
    if (typeof window.renderOcaScreenFiltered === 'function') {
        const _origOca = window.renderOcaScreenFiltered;
        window.renderOcaScreenFiltered = function() {
            const r = _origOca.apply(this, arguments);
            setTimeout(() => {
                const cards = document.querySelectorAll('.story-hero-card');
                cards.forEach(card => {
                    if (card.classList.contains('locked')) return;
                    if (card.querySelector('.hero-details-btn')) return;
                    
                    // Pega o nome do herói pelo onclick
                    const onclickAttr = card.getAttribute('onclick') || '';
                    const match = onclickAttr.match(/toggleHeroSelection\('((?:\\'|[^'])*)'\)/);
                    if (!match) return;
                    
                    const heroClass = match[1].replace(/\\'/g, "'");
                    const btn = document.createElement('button');
                    btn.className = 'hero-details-btn';
                    btn.innerHTML = '?';
                    btn.title = 'Ver detalhes';
                    btn.setAttribute('data-hero', heroClass);
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (typeof window.ensureStoryHeroDetails === 'function') {
                            window.ensureStoryHeroDetails(heroClass);
                        }
                        window.openHeroDetails(heroClass);
                    };
                    card.appendChild(btn);
                });
            }, 50);
            return r;
        };
    }

    // ==============================================================
    // 2. ADICIONAR LORE DOS BOSSES DO EVENTO NO BESTIÁRIO NORMAL
    // ==============================================================
    if (typeof STORY_ENEMIES !== 'undefined') {
        // Adiciona os bosses do evento na tabela de inimigos (para ter nome e stats)
        if (typeof EVENTO_BOSSES !== 'undefined') {
            Object.values(EVENTO_BOSSES).forEach(boss => {
                if (!STORY_ENEMIES[boss.id]) {
                    STORY_ENEMIES[boss.id] = {
                        id: boss.id,
                        name: boss.nome,
                        hp: boss.hp,
                        atk: boss.atk,
                        isBoss: true,
                        isEvento: true,
                        descricao: boss.descricao,
                        lore: boss.lore
                    };
                }
            });
        }
    }

    // ==============================================================
    // 3. PATCH NO BESTIÁRIO NORMAL PARA INCLUIR OS BOSSES DO EVENTO
    // ==============================================================
    const _origBestiary = window.renderBestiaryScreen;
    if (typeof _origBestiary === 'function') {
        window.renderBestiaryScreen = function() {
            const r = _origBestiary.apply(this, arguments);
            
            // Depois que o bestiário normal renderiza, adiciona a seção do evento
            const grid = document.querySelector('.bestiary-grid');
            if (!grid) return r;

            // Evita duplicar
            if (grid.querySelector('.bestiary-evento-header')) return r;

            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'bestiary-evento-header';
            sectionHeader.style.cssText = 'grid-column: 1 / -1; margin-top: 30px; margin-bottom: 10px; border-bottom: 2px solid #8e44ad; padding-bottom: 10px;';
            sectionHeader.innerHTML = `<h3 style="color: #c39bd3; font-family: 'Cinzel Decorative', serif; font-size: 1.2rem; margin: 0;">🌑 Os Sete Selados (Evento)</h3>`;
            grid.appendChild(sectionHeader);

            if (typeof EVENTO_BOSSES !== 'undefined') {
                Object.values(EVENTO_BOSSES).forEach(boss => {
                    const card = document.createElement('div');
                    card.className = 'bestiary-card boss';
                    card.innerHTML = `
                        <div class="bestiary-card-header">
                            <div class="bestiary-card-sprite">${eventoIcon(boss.id, 'large')}</div>
                            <div class="bestiary-card-info">
                                <div class="bestiary-card-name">${boss.nome}</div>
                                <div class="bestiary-card-meta">${boss.titulo}</div>
                            </div>
                        </div>
                        <div class="bestiary-card-lore">${boss.descricao}</div>
                        <div class="bestiary-card-section">
                            <div class="bestiary-card-section-title">📖 Lore</div>
                            <div class="bestiary-card-lore" style="margin-top:5px;">${boss.lore}</div>
                        </div>
                        <div class="bestiary-card-section">
                            <div class="bestiary-card-section-title">📊 Atributos</div>
                            <div class="bestiary-card-stats">
                                <span><b>HP</b> ${boss.hp}</span>
                                <span><b>ATK</b> ${boss.atk}</span>
                                <span><b>ELEM</b> ${boss.elemento}</span>
                            </div>
                        </div>
                    `;
                    grid.appendChild(card);
                });
            }
            
            return r;
        };
    }

    // ==============================================================
    // 4. REMOVER OS BOTÕES EXTRAS DA ALDEIA (que foram criados no V13.0)
    // ==============================================================
    // Eles serão removidos automaticamente na próxima renderização da Aldeia
    // porque não vamos recriá-los. Mas para garantir, removemos do DOM agora.
    document.querySelectorAll('.evento-herois-card, .evento-bestiario-card').forEach(el => el.remove());

    console.log('✅ [V13.1] OCA, Menu "?" e Bestiário corrigidos.');
})();
// =================================================================
// historia.js — BLOCO 53 (V13.2 — Descrições Automáticas para Todos os Heróis)
// =================================================================

(function fixDescricoesAutomaticasV132() {
    if (window._eventoFixDescV132) return;
    window._eventoFixDescV132 = true;

    // ==============================================================
    // 1. PREENCHER AUTOMATICAMENTE OS DETALHES DOS HERÓIS QUE FALTAM
    // ==============================================================
    if (typeof STORY_HERO_DETAILS !== 'undefined' && typeof STORY_HERO_CLASSES !== 'undefined') {
        
        Object.values(STORY_HERO_CLASSES).forEach(hero => {
            // Se o herói ainda não tem detalhes cadastrados...
            if (!STORY_HERO_DETAILS[hero.className]) {
                
                // Cria uma descrição baseada no papel (role) dele
                let paName = '';
                let paDesc = '';
                let paExtra = '';
                let tactical = '';
                
                if (hero.role === 'Guerreiro') {
                    paName = 'Golpe Ancestral';
                    paDesc = `${hero.displayName} concentra sua força e desfere um golpe devastador no chão, criando uma onda de choque que atinge todos os inimigos ao redor.`;
                    paExtra = 'Dano em área ao redor do herói.';
                    tactical = 'Alcance: 1 (corpo a corpo).';
                } else if (hero.role === 'Mago') {
                    paName = 'Chama Espiritual';
                    paDesc = `${hero.displayName} invoca o poder dos ancestrais, lançando uma magia que atravessa o campo de batalha e atinge o alvo com precisão.`;
                    paExtra = 'Dano mágico à distância.';
                    tactical = 'Alcance: 3 ou 4 (ataque à distância).';
                } else if (hero.role === 'Arqueiro') {
                    paName = 'Flecha Certeira';
                    paDesc = `${hero.displayName} dispara uma flecha infalível que atinge o alvo e causa dano em cadeia nos inimigos próximos.`;
                    paExtra = 'Dano no alvo principal e nos adjacentes.';
                    tactical = 'Alcance: 3 (ataque à distância).';
                }

                STORY_HERO_DETAILS[hero.className] = {
                    paName: paName,
                    paDesc: paDesc,
                    paExtra: paExtra,
                    tactical: tactical,
                    notes: `Herói desbloqueado. Elemento: ${hero.element || 'Diverso'}.`
                };
            }
        });
    }

    // ==============================================================
    // 2. GARANTIR QUE O BOTÃO "?" SEJA INJETADO EM TODOS OS CARDS
    // ==============================================================
    // (Reforço do patch anterior, mas com um seletor mais agressivo)
    const _origOca = window.renderOcaScreenFiltered;
    if (typeof _origOca === 'function') {
        window.renderOcaScreenFiltered = function() {
            const r = _origOca.apply(this, arguments);
            
            // Timeout para esperar o DOM ser montado
            setTimeout(() => {
                const cards = document.querySelectorAll('.story-hero-card');
                cards.forEach(card => {
                    // Se estiver bloqueado, ignora
                    if (card.classList.contains('locked')) return;
                    
                    // Se já tem o botão, ignora
                    if (card.querySelector('.hero-details-btn')) return;
                    
                    // Pega o nome do herói pelo onclick
                    const onclickAttr = card.getAttribute('onclick') || '';
                    const match = onclickAttr.match(/toggleHeroSelection\('((?:\\'|[^'])*)'\)/);
                    
                    if (match) {
                        const heroClass = match[1].replace(/\\'/g, "'");
                        const btn = document.createElement('button');
                        btn.className = 'hero-details-btn';
                        btn.innerHTML = '?';
                        btn.title = 'Ver detalhes';
                        btn.setAttribute('data-hero', heroClass);
                        btn.onclick = (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (typeof window.ensureStoryHeroDetails === 'function') {
                                window.ensureStoryHeroDetails(heroClass);
                            }
                            if (typeof window.openHeroDetails === 'function') {
                                window.openHeroDetails(heroClass);
                            }
                        };
                        card.appendChild(btn);
                    }
                });
            }, 50);

            return r;
        };
    }

    console.log('✅ [V13.2] Descrições automáticas e botões "?" reforçados.');
})();
// =================================================================
// historia.js — BLOCO 54 (V13.3 — Descrição Visual dos Novos PAs)
// =================================================================

(function fixPAVisualV133() {
    if (window._eventoFixPAVisV133) return;
    window._eventoFixPAVisV133 = true;

    const _origRenderPA = window.renderPAMiniGrid;
    
    if (typeof _origRenderPA === 'function') {
        window.renderPAMiniGrid = function(heroClass) {
            const heroData = STORY_HERO_CLASSES[heroClass];
            if (!heroData) return _origRenderPA.apply(this, arguments);

            const paKey = heroData.paKey;
            
            // Se for um dos PAs antigos, deixa a função original desenhar
            const paAntigos = [
                'base_coluna', 'base_linha_cura', 'base_area_alvo', 
                'kanarott_cruz_empurra', 'teperesik_area2x2', 'eru_linha_horizontal',
                'andure_area2x2_cura', 'maedamata_area3x3_cura', 'paje_coluna_fogo',
                'jurua_area_alvo_3x3', 'araci_linha_horizontal', 'bicho_cruz_completa',
                'tapyra_coluna_alvo', 'ruda_flecha_amor'
            ];
            
            if (paAntigos.includes(paKey)) {
                return _origRenderPA.apply(this, arguments);
            }

            // ==============================================================
            // DESENHO VISUAL PARA OS NOVOS HERÓIS
            // ==============================================================
            const gridSize = 8;
            const CX = 3; // Centro X no mini-grid
            const CY = 4; // Centro Y no mini-grid
            const afetados = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
            const targetMock = { x: 3, y: 2 }; // Alvo simulado 2 tiles acima

            const mark = (x, y) => {
                if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) afetados[y][x] = true;
            };

            // 1. Curupira — Chuva de Flechas
            if (paKey === 'curupira_chuva_flechas') {
                // Marca vários tiles aleatórios (simulando os 10 alvos)
                for(let i=0; i<5; i++) mark(1 + i, 2);
                for(let i=0; i<5; i++) mark(2 + i, 5);
            }
            // 2. Kianumanka-Manã — Meteoro
            else if (paKey === 'kianumanka_meteoro') {
                // Área 3x3 ao redor do alvo
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) mark(targetMock.x + dx, targetMock.y + dy);
                }
            }
            // 3. Anhanga-Mirim — Raio na Cruz
            else if (paKey === 'anhanga_mirim_raio') {
                // Cruz completa no alvo
                for (let x = 0; x < gridSize; x++) mark(x, targetMock.y);
                for (let y = 0; y < gridSize; y++) mark(targetMock.x, y);
            }
            // 4. Matinta Pereira — Rajada + Empurrão
            else if (paKey === 'matinta_rajada') {
                // Linha horizontal do herói até o alvo
                for (let x = 0; x < gridSize; x++) mark(x, CY);
            }
            // 5. Naiá — Apaga Fogo
            else if (paKey === 'naia_apaga_fogo') {
                // Marca uns tiles aleatórios (simulando os de fogo)
                mark(CX, CY); // Centro
                mark(CX+1, CY+1);
                mark(CX-1, CY-1);
                mark(CX+2, CY);
                mark(CX, CY-2);
            }
            // 6. Kuatí — Explosão de Fogo
            else if (paKey === 'kuati_explosao') {
                // Área 3x3 ao redor do herói + linha horizontal
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) mark(CX + dx, CY + dy);
                }
                for (let x = 0; x < gridSize; x++) mark(x, CY);
            }
            // 7. Caboclo d'Água — Maré + Puxão
            else if (paKey === 'caboclo_mare') {
                // Área 3x3 ao redor do herói
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) mark(CX + dx, CY + dy);
                }
            }
            // 8. Tupinambá — Avalanche
            else if (paKey === 'tupinamba_avalanche') {
                // Cruz no alvo
                for (let x = 0; x < gridSize; x++) mark(x, targetMock.y);
                for (let y = 0; y < gridSize; y++) mark(targetMock.x, y);
            }
            // 9. Mbaraká — Salto + Raio
            else if (paKey === 'mbaraka_salto_raio') {
                // Área 3x3 no alvo (onde ele salta)
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) mark(targetMock.x + dx, targetMock.y + dy);
                }
            }
            // 10. Mãe-do-Ouro — Caminho até o boss
            else if (paKey === 'maedouro_caminho') {
                // Caminho em L (linha do herói até o alvo)
                for (let x = CX; x <= targetMock.x; x++) mark(x, CY);
                for (let y = targetMock.y; y <= CY; y++) mark(targetMock.x, y);
            }
            // 11. Pajé-Açu — Linha + Empurrão
            else if (paKey === 'pajeacu_linha') {
                // Linha horizontal do herói
                for (let x = 0; x < gridSize; x++) mark(x, CY);
            }
            // 12. Negrinho do Pastoreio — Cruz + Cura
            else if (paKey === 'negrinho_cruz_cura') {
                // Cruz no alvo
                for (let x = 0; x < gridSize; x++) mark(x, targetMock.y);
                for (let y = 0; y < gridSize; y++) mark(targetMock.x, y);
            }

            // ==============================================================
            // RENDERIZAÇÃO DO MINI-GRID
            // ==============================================================
            const heroElement = heroData.element || 'FOGO';
            const ELEMENT_COLORS = { FOGO:'bg-FOGO', AGUA:'bg-AGUA', TERRA:'bg-TERRA', AR:'bg-AR' };
            const baseClass = ELEMENT_COLORS[heroElement] || 'bg-FOGO';

            let html = '<div class="pa-mini-grid">';
            for (let y = 0; y < gridSize; y++) {
                for (let x = 0; x < gridSize; x++) {
                    const isHero = (x === CX && y === CY);
                    const isAfetado = afetados[y][x];
                    let cls = 'pa-mini-tile';
                    
                    if (isHero) cls += ' pa-mini-hero ' + baseClass;
                    else if (isAfetado) cls += ' pa-mini-afetado ' + baseClass;
                    else cls += ' pa-mini-vazio';
                    
                    html += `<div class="${cls}">${isHero ? '⭐' : ''}</div>`;
                }
            }
            html += '</div>';
            return html;
        };

        console.log('✅ [V13.3] Visual dos novos PAs corrigido.');
    }
})();
// =================================================================
// historia.js — BLOCO 55 (V13.4 — Visual das Skills no Bestiário)
// =================================================================

(function fixBestiarioSkillsV134() {
    if (window._eventoFixBestSkillsV134) return;
    window._eventoFixBestSkillsV134 = true;

    const _origGetGrid = window.getEnemySkillGrid;

    if (typeof _origGetGrid === 'function') {
        window.getEnemySkillGrid = function(enemyId, skillKey) {
            // Pega os dados do inimigo
            const enemy = STORY_ENEMIES[enemyId];
            if (!enemy) return _origGetGrid.apply(this, arguments);

            // Se NÃO for um boss do evento, usa a função original
            if (!enemy.isEvento) {
                return _origGetGrid.apply(this, arguments);
            }

            // ==============================================================
            // DESENHO PARA OS BOSSES DO EVENTO
            // ==============================================================
            const skill = enemy[skillKey];
            if (!skill) return '';

            const handler = skill.handler || '';
            const gridSize = 8;
            const CX = 3, CY = 4; // Centro do mini-grid
            const afetados = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

            const mark = (x, y) => {
                if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) afetados[y][x] = true;
            };

            // --- TEJU JAGUA ---
            if (handler === 'evento_teju_sete_cabecas') {
                // 3 colunas no centro + linha
                [CX-1, CX, CX+1].forEach(col => { for(let y=0; y<gridSize; y++) mark(col, y); });
                for(let x=0; x<gridSize; x++) mark(x, CY);
            } 
            else if (handler === 'evento_teju_ima_almas') {
                // Dano global
                for(let y=0; y<gridSize; y++) for(let x=0; x<gridSize; x++) mark(x, y);
            }
            // --- MBÓI TU'Ĩ ---
            else if (handler === 'evento_mboi_bico_arco_iris') {
                // 3 linhas no centro
                [CY-1, CY, CY+1].forEach(row => { for(let x=0; x<gridSize; x++) mark(x, row); });
            }
            else if (handler === 'evento_mboi_inundacao') {
                // Dano global (converte FOGO)
                for(let y=0; y<gridSize; y++) for(let x=0; x<gridSize; x++) mark(x, y);
            }
            // --- MOÑÁI ---
            else if (handler === 'evento_monai_voo_rasante') {
                // Área 3x3 ao redor de um ponto (representado no alvo)
                const tx = 3, ty = 2;
                for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) mark(tx + dx, ty + dy);
            }
            else if (handler === 'evento_monai_sopro_tempestade') {
                // Dano global (e empurra)
                for(let y=0; y<gridSize; y++) for(let x=0; x<gridSize; x++) mark(x, y);
            }
            // --- JASY JATERÊ ---
            else if (handler === 'evento_jasy_salto_solar') {
                // Área 3x3 na diagonal
                const tx = 5, ty = 2;
                for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) mark(tx + dx, ty + dy);
            }
            else if (handler === 'evento_jasy_clarao_cegante') {
                // Dano global
                for(let y=0; y<gridSize; y++) for(let x=0; x<gridSize; x++) mark(x, y);
            }
            // --- KURUPÍ ---
            else if (handler === 'evento_kurupi_raizes') {
                // Aleatório (heróis presos)
                mark(1, 6); mark(3, 6); mark(5, 6); mark(2, 2); mark(4, 2);
            }
            else if (handler === 'evento_kurupi_chamado') {
                // Tile único (invocação)
                mark(4, 4);
            }
            // --- AO AO ---
            else if (handler === 'evento_aoao_investida') {
                // Linha diagonal (2x2 em movimento)
                const dirs = [{x:1,y:1}, {x:2,y:2}, {x:3,y:3}];
                dirs.forEach(d => { mark(d.x, d.y); mark(d.x+1, d.y); mark(d.x, d.y+1); mark(d.x+1, d.y+1); });
            }
            else if (handler === 'evento_aoao_la') {
                // 4 projéteis diagonais
                for(let i=1; i<=2; i++) {
                    mark(CX+i, CY+i); mark(CX-i, CY-i);
                    mark(CX+i, CY-i); mark(CX-i, CY+i);
                }
            }
            // --- LUISON ---
            else if (handler === 'evento_luison_colheita') {
                // 3 pares de colunas (representado por 3 colunas espaçadas)
                [1, 3, 5].forEach(col => { for(let y=0; y<gridSize; y++) mark(col, y); });
                [2, 4, 6].forEach(col => { for(let y=0; y<gridSize; y++) mark(col, y); });
            }
            else if (handler === 'evento_luison_legado') {
                // Dano global (invoca skill aleatória)
                for(let y=0; y<gridSize; y++) for(let x=0; x<gridSize; x++) mark(x, y);
            }

            // ==============================================================
            // RENDERIZAÇÃO
            // ==============================================================
            // Define a cor baseada no elemento do boss
            const ELEMENT_COLORS = { FOGO:'bg-FOGO', AGUA:'bg-AGUA', TERRA:'bg-TERRA', AR:'bg-AR', 'VARIÁVEL':'bg-AR' };
            const baseClass = ELEMENT_COLORS[enemy.elemento || 'FOGO'] || 'bg-FOGO';

            let html = '<div class="pa-mini-grid">';
            for (let y = 0; y < gridSize; y++) {
                for (let x = 0; x < gridSize; x++) {
                    const isBoss = (x === CX && y === CY);
                    const isAfetado = afetados[y][x];
                    let cls = 'pa-mini-tile';
                    
                    if (isBoss) cls += ' pa-mini-hero ' + baseClass; // Herói/Boss no centro
                    else if (isAfetado) cls += ' pa-mini-afetado ' + baseClass;
                    else cls += ' pa-mini-vazio';
                    
                    html += `<div class="${cls}">${isBoss ? '👹' : ''}</div>`;
                }
            }
            html += '</div>';
            return html;
        };

        console.log('✅ [V13.4] Visual das skills dos bosses do evento no Bestiário corrigido.');
    }
})();
// =================================================================
// historia.js — BLOCO 56 (V13.5 — Bestiário do Evento Completo)
// =================================================================

(function fixBestiarioEventoV135() {
    if (window._eventoFixBestV135) return;
    window._eventoFixBestV135 = true;

    // Sobrescreve a injeção do bestiário original (que estava no V13.1)
    // Vamos recriar os cards com todos os dados.
    const _origBestiary = window.renderBestiaryScreen;
    
    if (typeof _origBestiary === 'function') {
        window.renderBestiaryScreen = function() {
            // Chama o original para desenhar os animais normais
            const r = _origBestiary.apply(this, arguments);

            // Agora injetamos os bosses do evento no final
            const grid = document.querySelector('.bestiary-grid');
            if (!grid) return r;

            // Se já injetou, não faz de novo
            if (grid.querySelector('.bestiary-evento-header')) return r;

            // Header da seção
            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'bestiary-evento-header';
            sectionHeader.style.cssText = 'grid-column: 1 / -1; margin-top: 30px; margin-bottom: 10px; border-bottom: 2px solid #8e44ad; padding-bottom: 10px;';
            sectionHeader.innerHTML = `<h3 style="color: #c39bd3; font-family: 'Cinzel Decorative', serif; font-size: 1.2rem; margin: 0;">🌑 Os Sete Selados (Evento)</h3>`;
            grid.appendChild(sectionHeader);

            if (typeof EVENTO_BOSSES !== 'undefined') {
                Object.values(EVENTO_BOSSES).forEach(boss => {
                    // Verifica se o jogador já derrotou ele
                    const prog = (typeof getEventoProgresso === 'function') ? getEventoProgresso(boss.id) : null;
                    const derrotado = prog && prog.fasesConcluidas.includes('boss');
                    
                    const card = document.createElement('div');
                    card.className = `bestiary-card boss ${derrotado ? 'unlocked' : 'locked'}`;
                    card.style.borderColor = derrotado ? '#a83232' : '#4a3418';
                    
                    // Sprite
                    let imgHTML = `<div style="display:flex; align-items:center; justify-content:center; font-size:3rem; height:72px;">?</div>`;
                    if (derrotado && typeof eventoIcon === 'function') {
                        imgHTML = eventoIcon(boss.id, 'large');
                    }

                    // Skills
                    let skillsHTML = '';
                    if (derrotado && boss.skills) {
                        skillsHTML = `<div class="bestiary-skills" style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">`;
                        boss.skills.forEach(skill => {
                            // Desenha o mini-grid usando a função que consertamos no V13.4
                            const gridHTML = (typeof getEnemySkillGrid === 'function') 
                                ? getEnemySkillGrid(boss.id, skill.id === boss.skills[0].id ? 'skill1' : 'skill2') 
                                : '';
                                
                            skillsHTML += `
                                <div class="bestiary-skill" style="flex:1; min-width:120px; background:rgba(10,6,2,0.4); padding:8px; border-radius:6px;">
                                    <div class="bestiary-skill-header">
                                        <span class="bestiary-skill-name" style="color:#e8b923; font-family:'Cinzel',serif; font-size:0.8rem;">${skill.nome}</span>
                                    </div>
                                    <div class="bestiary-skill-grid" style="display:flex; justify-content:center; margin-top:5px;">
                                        ${gridHTML}
                                    </div>
                                </div>
                            `;
                        });
                        skillsHTML += `</div>`;
                    }

                    // Drops
                    let dropsHTML = '<span style="color:#8a7a52; font-style:italic;">Desconhecido.</span>';
                    if (derrotado) {
                        dropsHTML = `
                            <span class="bestiary-drop" style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; background:rgba(10,6,2,0.5); border:1px solid rgba(201,162,39,0.25); border-radius:20px; font-size:0.8rem; color:#d9c89a;">
                                🗡️ Armas do Evento (5%-20%)
                            </span>
                            <span class="bestiary-drop" style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; background:rgba(142,68,173,0.1); border:1px solid rgba(142,68,173,0.5); border-radius:20px; font-size:0.8rem; color:#d9c89a;">
                                🧿 Fragmento Divino (5%-20%)
                            </span>
                        `;
                    }

                    // Fases onde aparece
                    const fasesHTML = derrotado 
                        ? `<span class="bestiary-fase" style="font-size:0.75rem; padding:3px 8px; background:rgba(201,162,39,0.1); border:1px solid rgba(201,162,39,0.3); border-radius:12px; color:#e8b923;">${boss.diaLabel}</span>`
                        : '';

                    card.innerHTML = `
                        <div class="bestiary-card-header">
                            <div class="bestiary-sprite" style="width:72px; height:72px; display:flex; align-items:center; justify-content:center;">
                                ${imgHTML}
                            </div>
                            <div class="bestiary-card-info">
                                <div class="bestiary-card-name">${derrotado ? boss.nome : '???'}</div>
                                <div class="bestiary-card-meta">${derrotado ? boss.titulo : 'Desconhecido'} · ${boss.diaLabel} · Boss</div>
                                <div class="bestiary-card-stats" style="display:flex; gap:12px; font-size:0.85rem; color:#d9c89a; margin-top:4px;">
                                    <span><b>HP</b> ${boss.hp}</span>
                                    <span><b>ATK</b> ${boss.atk}</span>
                                </div>
                            </div>
                        </div>
                        
                        ${derrotado ? `<div class="bestiary-card-lore" style="font-family:'EB Garamond',serif; color:#b8a577; font-size:0.9rem; font-style:italic; line-height:1.5; padding:8px 12px; background:rgba(10,6,2,0.4); border-left:3px solid #6a5024; border-radius:4px; margin-top:10px;">${boss.descricao}</div>` : ''}
                        
                        ${skillsHTML}
                        
                        <div class="bestiary-card-section" style="margin-top:10px; display:flex; flex-direction:column; gap:6px;">
                            <div class="bestiary-card-section-title" style="font-family:'Cinzel',serif; color:#8a7a52; font-size:0.75rem; letter-spacing:2px;">💎 DROPS</div>
                            <div class="bestiary-drops" style="display:flex; flex-wrap:wrap; gap:8px;">${dropsHTML}</div>
                        </div>
                        
                        <div class="bestiary-card-section" style="margin-top:10px; display:flex; flex-direction:column; gap:6px;">
                            <div class="bestiary-card-section-title" style="font-family:'Cinzel',serif; color:#8a7a52; font-size:0.75rem; letter-spacing:2px;">📖 APARECE EM</div>
                            <div class="bestiary-fases" style="display:flex; flex-wrap:wrap; gap:6px;">${fasesHTML}</div>
                        </div>
                    `;
                    
                    grid.appendChild(card);
                });
            }

            return r;
        };

        console.log('✅ [V13.5] Bestiário do Evento completo (sprite, skills, drops e lore).');
    }
})();
// =================================================================
// historia.js — BLOCO 57 (V13.6 — Bestiário do Evento Definitivo)
// =================================================================

(function fixBestiarioEventoV136() {
    if (window._eventoFixBestV136) return;
    window._eventoFixBestV136 = true;

    // A nossa própria função de desenhar o mini-grid, independente do resto do jogo
    function desenharMiniGrid(handler) {
        const gridSize = 8;
        const CX = 3, CY = 4;
        const afetados = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

        const mark = (x, y) => { if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) afetados[y][x] = true; };

        // Desenha os padrões baseados no handler
        if (handler === 'evento_teju_sete_cabecas') {
            [CX-1, CX, CX+1].forEach(col => { for(let y=0; y<8; y++) mark(col, y); });
            for(let x=0; x<8; x++) mark(x, CY);
        } 
        else if (handler === 'evento_teju_ima_almas' || handler === 'evento_mboi_inundacao' || handler === 'evento_monai_sopro_tempestade' || handler === 'evento_jasy_clarao_cegante' || handler === 'evento_luison_legado') {
            // Dano global
            for(let y=0; y<8; y++) for(let x=0; x<8; x++) mark(x, y);
        }
        else if (handler === 'evento_mboi_bico_arco_iris') {
            [CY-1, CY, CY+1].forEach(row => { for(let x=0; x<8; x++) mark(x, row); });
        }
        else if (handler === 'evento_monai_voo_rasante' || handler === 'evento_jasy_salto_solar') {
            const tx = 3, ty = 2;
            for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) mark(tx + dx, ty + dy);
        }
        else if (handler === 'evento_kurupi_raizes') {
            mark(1, 6); mark(3, 6); mark(5, 6); mark(2, 2); mark(4, 2);
        }
        else if (handler === 'evento_kurupi_chamado') {
            mark(4, 4);
        }
        else if (handler === 'evento_aoao_investida') {
            const dirs = [{x:1,y:1}, {x:2,y:2}, {x:3,y:3}];
            dirs.forEach(d => { mark(d.x, d.y); mark(d.x+1, d.y); mark(d.x, d.y+1); mark(d.x+1, d.y+1); });
        }
        else if (handler === 'evento_aoao_la') {
            for(let i=1; i<=2; i++) { mark(CX+i, CY+i); mark(CX-i, CY-i); mark(CX+i, CY-i); mark(CX-i, CY+i); }
        }
        else if (handler === 'evento_luison_colheita') {
            [1, 3, 5].forEach(col => { for(let y=0; y<8; y++) mark(col, y); });
            [2, 4, 6].forEach(col => { for(let y=0; y<8; y++) mark(col, y); });
        }

        let html = '<div class="pa-mini-grid" style="display:grid; grid-template-columns:repeat(8, 14px); gap:1px; background:#1a1208; padding:4px; border-radius:4px;">';
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const isBoss = (x === CX && y === CY);
                const isAfetado = afetados[y][x];
                let bg = '#3a2a18'; // Vazio
                if (isBoss) bg = '#e8b923'; // Boss
                else if (isAfetado) bg = '#a83232'; // Afetado
                
                html += `<div style="width:14px; height:14px; background:${bg}; border-radius:2px;"></div>`;
            }
        }
        html += '</div>';
        return html;
    }

    const _origBestiary = window.renderBestiaryScreen;
    
    if (typeof _origBestiary === 'function') {
        window.renderBestiaryScreen = function() {
            // 1. Limpa qualquer sujeira de patches antigos
            document.querySelectorAll('.bestiary-evento-header, .bestiary-card[style*="border-color: rgb(168, 50, 50)"], .bestiary-card[style*="border-color: rgb(74, 52, 24)"]').forEach(el => el.remove());

            // 2. Chama o original para desenhar os animais
            const r = _origBestiary.apply(this, arguments);

            // 3. Injeta os bosses do evento
            const grid = document.querySelector('.bestiary-grid');
            if (!grid) return r;

            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'bestiary-evento-header';
            sectionHeader.style.cssText = 'grid-column: 1 / -1; margin-top: 30px; margin-bottom: 10px; border-bottom: 2px solid #8e44ad; padding-bottom: 10px;';
            sectionHeader.innerHTML = `<h3 style="color: #c39bd3; font-family: 'Cinzel Decorative', serif; font-size: 1.2rem; margin: 0;">🌑 Os Sete Selados (Evento)</h3>`;
            grid.appendChild(sectionHeader);

            if (typeof EVENTO_BOSSES !== 'undefined') {
                Object.values(EVENTO_BOSSES).forEach(boss => {
                    const prog = (typeof getEventoProgresso === 'function') ? getEventoProgresso(boss.id) : null;
                    const derrotado = prog && prog.fasesConcluidas.includes('boss');
                    
                    const card = document.createElement('div');
                    // Usamos as classes originais para não quebrar o CSS
                    card.className = `bestiary-card ${derrotado ? 'unlocked boss' : 'locked'}`;
                    
                    // Sprite
                    let imgHTML = `<div style="display:flex; align-items:center; justify-content:center; font-size:3rem; height:72px; color:#555;">?</div>`;
                    if (derrotado && typeof eventoIcon === 'function') {
                        imgHTML = `<div style="transform:scale(1.5);">${eventoIcon(boss.id, 'large')}</div>`;
                    }

                    // Skills
                    let skillsHTML = '';
                    if (derrotado && boss.skills) {
                        skillsHTML = `<div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">`;
                        boss.skills.forEach(skill => {
                            const gridHTML = desenharMiniGrid(skill.handler);
                            skillsHTML += `
                                <div style="flex:1; min-width:120px; background:rgba(10,6,2,0.4); padding:8px; border-radius:6px; border:1px solid rgba(201,162,39,0.2);">
                                    <div style="color:#e8b923; font-family:'Cinzel',serif; font-size:0.8rem; text-align:center; margin-bottom:5px;">${skill.nome}</div>
                                    <div style="display:flex; justify-content:center;">${gridHTML}</div>
                                </div>
                            `;
                        });
                        skillsHTML += `</div>`;
                    }

                    // Drops
                    let dropsHTML = '<span style="color:#8a7a52; font-style:italic;">Desconhecido.</span>';
                    if (derrotado) {
                        dropsHTML = `
                            <span style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; background:rgba(10,6,2,0.5); border:1px solid rgba(201,162,39,0.25); border-radius:20px; font-size:0.8rem; color:#d9c89a;">
                                🗡️ Armas (5%-20%)
                            </span>
                            <span style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; background:rgba(142,68,173,0.1); border:1px solid rgba(142,68,173,0.5); border-radius:20px; font-size:0.8rem; color:#d9c89a;">
                                🧿 Fragmento (5%-20%)
                            </span>
                        `;
                    }

                    const fasesHTML = derrotado 
                        ? `<span style="font-size:0.75rem; padding:3px 8px; background:rgba(201,162,39,0.1); border:1px solid rgba(201,162,39,0.3); border-radius:12px; color:#e8b923;">${boss.diaLabel} (Evento)</span>`
                        : '';

                    card.innerHTML = `
                        <div class="bestiary-card-header" style="display:flex; align-items:center; gap:12px;">
                            <div style="width:72px; height:72px; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.3); border-radius:6px;">
                                ${imgHTML}
                            </div>
                            <div class="bestiary-card-info" style="flex:1;">
                                <div style="font-family:'Cinzel',serif; color:#f0e2c0; font-size:1.05rem;">${derrotado ? boss.nome : '???'}</div>
                                <div style="font-family:'EB Garamond',serif; color:#b8a577; font-size:0.85rem; font-style:italic;">${derrotado ? boss.titulo : 'Desconhecido'} · ${boss.diaLabel}</div>
                                <div style="display:flex; gap:12px; font-size:0.85rem; color:#d9c89a; margin-top:4px;">
                                    <span><b>HP</b> ${boss.hp}</span>
                                    <span><b>ATK</b> ${boss.atk}</span>
                                </div>
                            </div>
                        </div>
                        
                        ${derrotado ? `<div style="font-family:'EB Garamond',serif; color:#b8a577; font-size:0.9rem; font-style:italic; line-height:1.5; padding:8px 12px; background:rgba(10,6,2,0.4); border-left:3px solid #6a5024; border-radius:4px; margin-top:10px;">${boss.descricao}</div>` : ''}
                        
                        ${skillsHTML}
                        
                        <div style="margin-top:10px;">
                            <div style="font-family:'Cinzel',serif; color:#8a7a52; font-size:0.75rem; letter-spacing:2px; margin-bottom:5px;">💎 DROPS</div>
                            <div style="display:flex; flex-wrap:wrap; gap:8px;">${dropsHTML}</div>
                        </div>
                        
                        <div style="margin-top:10px;">
                            <div style="font-family:'Cinzel',serif; color:#8a7a52; font-size:0.75rem; letter-spacing:2px; margin-bottom:5px;">📖 APARECE EM</div>
                            <div style="display:flex; flex-wrap:wrap; gap:6px;">${fasesHTML}</div>
                        </div>
                    `;
                    
                    grid.appendChild(card);
                });
            }

            return r;
        };

        console.log('✅ [V13.6] Bestiário do Evento blindado e sem duplicatas.');
    }
})();
// =================================================================
// historia.js — BLOCO 58 (V13.7 — Remover Duplicatas e Consertar Grid)
// =================================================================

(function fixBestiarioFinalV137() {
    if (window._eventoFixBestV137) return;
    window._eventoFixBestV137 = true;

    // ==============================================================
    // 1. CSS PARA CONSERTAR O MINI-GRID (Não deixar esmagar)
    // ==============================================================
    if (!document.getElementById('bestiaryGridFixStyle')) {
        const style = document.createElement('style');
        style.id = 'bestiaryGridFixStyle';
        style.textContent = `
            /* Força o mini-grid a ter tamanho fixo e não esmagar */
            .pa-mini-grid {
                display: grid !important;
                grid-template-columns: repeat(8, 14px) !important;
                grid-template-rows: repeat(8, 14px) !important;
                gap: 2px !important;
                padding: 6px !important;
                background: #1a1208 !important;
                border-radius: 4px !important;
                margin: 0 auto !important;
                width: fit-content !important;
            }
            .pa-mini-tile, .pa-mini-grid div {
                width: 14px !important;
                height: 14px !important;
                border-radius: 2px !important;
            }
        `;
        document.head.appendChild(style);
    }

    // ==============================================================
    // 2. FUNÇÃO DE DESENHO (A mesma do V13.6)
    // ==============================================================
    function desenharMiniGrid(handler) {
        const gridSize = 8;
        const CX = 3, CY = 4;
        const afetados = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

        const mark = (x, y) => { if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) afetados[y][x] = true; };

        if (handler === 'evento_teju_sete_cabecas') {
            [CX-1, CX, CX+1].forEach(col => { for(let y=0; y<8; y++) mark(col, y); });
            for(let x=0; x<8; x++) mark(x, CY);
        } 
        else if (handler === 'evento_teju_ima_almas' || handler === 'evento_mboi_inundacao' || handler === 'evento_monai_sopro_tempestade' || handler === 'evento_jasy_clarao_cegante' || handler === 'evento_luison_legado') {
            for(let y=0; y<8; y++) for(let x=0; x<8; x++) mark(x, y);
        }
        else if (handler === 'evento_mboi_bico_arco_iris') {
            [CY-1, CY, CY+1].forEach(row => { for(let x=0; x<8; x++) mark(x, row); });
        }
        else if (handler === 'evento_monai_voo_rasante' || handler === 'evento_jasy_salto_solar') {
            const tx = 3, ty = 2;
            for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) mark(tx + dx, ty + dy);
        }
        else if (handler === 'evento_kurupi_raizes') {
            mark(1, 6); mark(3, 6); mark(5, 6); mark(2, 2); mark(4, 2);
        }
        else if (handler === 'evento_kurupi_chamado') {
            mark(4, 4);
        }
        else if (handler === 'evento_aoao_investida') {
            const dirs = [{x:1,y:1}, {x:2,y:2}, {x:3,y:3}];
            dirs.forEach(d => { mark(d.x, d.y); mark(d.x+1, d.y); mark(d.x, d.y+1); mark(d.x+1, d.y+1); });
        }
        else if (handler === 'evento_aoao_la') {
            for(let i=1; i<=2; i++) { mark(CX+i, CY+i); mark(CX-i, CY-i); mark(CX+i, CY-i); mark(CX-i, CY+i); }
        }
        else if (handler === 'evento_luison_colheita') {
            [1, 3, 5].forEach(col => { for(let y=0; y<8; y++) mark(col, y); });
            [2, 4, 6].forEach(col => { for(let y=0; y<8; y++) mark(col, y); });
        }

        let html = '<div class="pa-mini-grid">';
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const isBoss = (x === CX && y === CY);
                const isAfetado = afetados[y][x];
                let bg = '#3a2a18'; // Vazio
                if (isBoss) bg = '#e8b923'; // Boss
                else if (isAfetado) bg = '#a83232'; // Afetado
                
                html += `<div style="width:14px; height:14px; background:${bg}; border-radius:2px;"></div>`;
            }
        }
        html += '</div>';
        return html;
    }

    // ==============================================================
    // 3. SUBSTITUI A RENDERIZAÇÃO (Limpando os cards velhos)
    // ==============================================================
    const _origBestiary = window.renderBestiaryScreen;
    
    if (typeof _origBestiary === 'function') {
        window.renderBestiaryScreen = function() {
            // 1. Limpa o lixo do V13.1 e V13.5 que ficaram na tela
            document.querySelectorAll('.bestiary-evento-header').forEach(el => el.remove());
            document.querySelectorAll('.bestiary-card').forEach(el => {
                if (el.innerHTML.includes('Ato ? · Boss') || el.innerHTML.includes('Ato ? Boss')) {
                    el.remove();
                }
            });

            // 2. Chama o original para desenhar os animais
            const r = _origBestiary.apply(this, arguments);

            // 3. Injeta os bosses do evento
            const grid = document.querySelector('.bestiary-grid');
            if (!grid) return r;

            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'bestiary-evento-header';
            sectionHeader.style.cssText = 'grid-column: 1 / -1; margin-top: 30px; margin-bottom: 10px; border-bottom: 2px solid #8e44ad; padding-bottom: 10px;';
            sectionHeader.innerHTML = `<h3 style="color: #c39bd3; font-family: 'Cinzel Decorative', serif; font-size: 1.2rem; margin: 0;">🌑 Os Sete Selados (Evento)</h3>`;
            grid.appendChild(sectionHeader);

            if (typeof EVENTO_BOSSES !== 'undefined') {
                Object.values(EVENTO_BOSSES).forEach(boss => {
                    const prog = (typeof getEventoProgresso === 'function') ? getEventoProgresso(boss.id) : null;
                    const derrotado = prog && prog.fasesConcluidas.includes('boss');
                    
                    const card = document.createElement('div');
                    card.className = `bestiary-card ${derrotado ? 'unlocked boss' : 'locked'}`;
                    
                    let imgHTML = `<div style="display:flex; align-items:center; justify-content:center; font-size:3rem; height:72px; color:#555;">?</div>`;
                    if (derrotado && typeof eventoIcon === 'function') {
                        imgHTML = `<div style="transform:scale(1.5);">${eventoIcon(boss.id, 'large')}</div>`;
                    }

                    let skillsHTML = '';
                    if (derrotado && boss.skills) {
                        skillsHTML = `<div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">`;
                        boss.skills.forEach(skill => {
                            const gridHTML = desenharMiniGrid(skill.handler);
                            skillsHTML += `
                                <div style="flex:1; min-width:140px; background:rgba(10,6,2,0.4); padding:8px; border-radius:6px; border:1px solid rgba(201,162,39,0.2);">
                                    <div style="color:#e8b923; font-family:'Cinzel',serif; font-size:0.8rem; text-align:center; margin-bottom:5px;">${skill.nome}</div>
                                    <div style="display:flex; justify-content:center;">${gridHTML}</div>
                                </div>
                            `;
                        });
                        skillsHTML += `</div>`;
                    }

                    let dropsHTML = '<span style="color:#8a7a52; font-style:italic;">Desconhecido.</span>';
                    if (derrotado) {
                        dropsHTML = `
                            <span style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; background:rgba(10,6,2,0.5); border:1px solid rgba(201,162,39,0.25); border-radius:20px; font-size:0.8rem; color:#d9c89a;">
                                🗡️ Armas (5%-20%)
                            </span>
                            <span style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; background:rgba(142,68,173,0.1); border:1px solid rgba(142,68,173,0.5); border-radius:20px; font-size:0.8rem; color:#d9c89a;">
                                🧿 Fragmento (5%-20%)
                            </span>
                        `;
                    }

                    const fasesHTML = derrotado 
                        ? `<span style="font-size:0.75rem; padding:3px 8px; background:rgba(201,162,39,0.1); border:1px solid rgba(201,162,39,0.3); border-radius:12px; color:#e8b923;">${boss.diaLabel} (Evento)</span>`
                        : '';

                    card.innerHTML = `
                        <div class="bestiary-card-header" style="display:flex; align-items:center; gap:12px;">
                            <div style="width:72px; height:72px; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.3); border-radius:6px;">
                                ${imgHTML}
                            </div>
                            <div class="bestiary-card-info" style="flex:1;">
                                <div style="font-family:'Cinzel',serif; color:#f0e2c0; font-size:1.05rem;">${derrotado ? boss.nome : '???'}</div>
                                <div style="font-family:'EB Garamond',serif; color:#b8a577; font-size:0.85rem; font-style:italic;">${derrotado ? boss.titulo : 'Desconhecido'} · ${boss.diaLabel}</div>
                                <div style="display:flex; gap:12px; font-size:0.85rem; color:#d9c89a; margin-top:4px;">
                                    <span><b>HP</b> ${boss.hp}</span>
                                    <span><b>ATK</b> ${boss.atk}</span>
                                </div>
                            </div>
                        </div>
                        
                        ${derrotado ? `<div style="font-family:'EB Garamond',serif; color:#b8a577; font-size:0.9rem; font-style:italic; line-height:1.5; padding:8px 12px; background:rgba(10,6,2,0.4); border-left:3px solid #6a5024; border-radius:4px; margin-top:10px;">${boss.descricao}</div>` : ''}
                        
                        ${skillsHTML}
                        
                        <div style="margin-top:10px;">
                            <div style="font-family:'Cinzel',serif; color:#8a7a52; font-size:0.75rem; letter-spacing:2px; margin-bottom:5px;">💎 DROPS</div>
                            <div style="display:flex; flex-wrap:wrap; gap:8px;">${dropsHTML}</div>
                        </div>
                        
                        <div style="margin-top:10px;">
                            <div style="font-family:'Cinzel',serif; color:#8a7a52; font-size:0.75rem; letter-spacing:2px; margin-bottom:5px;">📖 APARECE EM</div>
                            <div style="display:flex; flex-wrap:wrap; gap:6px;">${fasesHTML}</div>
                        </div>
                    `;
                    
                    grid.appendChild(card);
                });
            }

            return r;
        };

        console.log('✅ [V13.7] Bestiário limpo, sem duplicatas e com grid consertado.');
    }
})();
// =================================================================
// historia.js — BLOCO 59 (V13.8 — Skills Múltiplas no Bestiário)
// =================================================================

(function fixBestiarioMultiSkillsV138() {
    if (window._eventoFixBestV138) return;
    window._eventoFixBestV138 = true;

    // ==============================================================
    // 1. FUNÇÃO DE DESENHO DO MINI-GRID (Única)
    // ==============================================================
    function desenharMiniGrid(handler) {
        const gridSize = 8;
        const CX = 3, CY = 4;
        const afetados = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

        const mark = (x, y) => { if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) afetados[y][x] = true; };

        if (handler === 'evento_teju_sete_cabecas') {
            [CX-1, CX, CX+1].forEach(col => { for(let y=0; y<8; y++) mark(col, y); });
            for(let x=0; x<8; x++) mark(x, CY);
        } 
        else if (handler === 'evento_teju_ima_almas' || handler === 'evento_mboi_inundacao' || handler === 'evento_monai_sopro_tempestade' || handler === 'evento_jasy_clarao_cegante') {
            for(let y=0; y<8; y++) for(let x=0; x<8; x++) mark(x, y);
        }
        else if (handler === 'evento_mboi_bico_arco_iris') {
            [CY-1, CY, CY+1].forEach(row => { for(let x=0; x<8; x++) mark(x, row); });
        }
        else if (handler === 'evento_monai_voo_rasante' || handler === 'evento_jasy_salto_solar') {
            const tx = 3, ty = 2;
            for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) mark(tx + dx, ty + dy);
        }
        else if (handler === 'evento_kurupi_raizes') {
            mark(1, 6); mark(3, 6); mark(5, 6); mark(2, 2); mark(4, 2);
        }
        else if (handler === 'evento_kurupi_chamado') {
            mark(4, 4);
        }
        else if (handler === 'evento_aoao_investida') {
            const dirs = [{x:1,y:1}, {x:2,y:2}, {x:3,y:3}];
            dirs.forEach(d => { mark(d.x, d.y); mark(d.x+1, d.y); mark(d.x, d.y+1); mark(d.x+1, d.y+1); });
        }
        else if (handler === 'evento_aoao_la') {
            for(let i=1; i<=2; i++) { mark(CX+i, CY+i); mark(CX-i, CY-i); mark(CX+i, CY-i); mark(CX-i, CY+i); }
        }
        else if (handler === 'evento_luison_colheita') {
            [1, 3, 5].forEach(col => { for(let y=0; y<8; y++) mark(col, y); });
            [2, 4, 6].forEach(col => { for(let y=0; y<8; y++) mark(col, y); });
        }
        // Para o Luison e o Pesadelo que usam múltiplas, marcamos o grid todo
        else if (handler === 'evento_luison_legado' || handler === 'evento_pesadelo_skill') {
            for(let y=0; y<8; y++) for(let x=0; x<8; x++) mark(x, y);
        }

        let html = '<div class="pa-mini-grid">';
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const isBoss = (x === CX && y === CY);
                const isAfetado = afetados[y][x];
                let bg = '#3a2a18'; // Vazio
                if (isBoss) bg = '#e8b923'; // Boss
                else if (isAfetado) bg = '#a83232'; // Afetado
                
                html += `<div style="width:14px; height:14px; background:${bg}; border-radius:2px;"></div>`;
            }
        }
        html += '</div>';
        return html;
    }

    // ==============================================================
    // 2. RENDERIZAÇÃO
    // ==============================================================
    const _origBestiary = window.renderBestiaryScreen;
    
    if (typeof _origBestiary === 'function') {
        window.renderBestiaryScreen = function() {
            // Limpa sujeiras de patches antigos
            document.querySelectorAll('.bestiary-evento-header').forEach(el => el.remove());
            document.querySelectorAll('.bestiary-card').forEach(el => {
                if (el.innerHTML.includes('Ato ? · Boss') || el.innerHTML.includes('Ato ? Boss')) {
                    el.remove();
                }
            });

            const r = _origBestiary.apply(this, arguments);
            const grid = document.querySelector('.bestiary-grid');
            if (!grid) return r;

            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'bestiary-evento-header';
            sectionHeader.style.cssText = 'grid-column: 1 / -1; margin-top: 30px; margin-bottom: 10px; border-bottom: 2px solid #8e44ad; padding-bottom: 10px;';
            sectionHeader.innerHTML = `<h3 style="color: #c39bd3; font-family: 'Cinzel Decorative', serif; font-size: 1.2rem; margin: 0;">🌑 Os Sete Selados (Evento)</h3>`;
            grid.appendChild(sectionHeader);

            const todosBosses = Object.values(EVENTO_BOSSES);
            // Adiciona o Pesadelo à lista do bestiário
            if (typeof EVENTO_PESADELO !== 'undefined') {
                todosBosses.push({ ...EVENTO_PESADELO, diaLabel: 'Mensal' });
            }

            todosBosses.forEach(boss => {
                const prog = (typeof getEventoProgresso === 'function') ? getEventoProgresso(boss.id) : null;
                const derrotado = boss.id === 'pesadelo' ? true : (prog && prog.fasesConcluidas.includes('boss')); // Pesadelo sempre liberado no bestiário
                
                const card = document.createElement('div');
                card.className = `bestiary-card ${derrotado ? 'unlocked boss' : 'locked'}`;
                
                let imgHTML = `<div style="display:flex; align-items:center; justify-content:center; font-size:3rem; height:72px; color:#555;">?</div>`;
                if (derrotado && typeof eventoIcon === 'function') {
                    imgHTML = `<div style="transform:scale(1.5);">${eventoIcon(boss.id, 'large')}</div>`;
                }

                // --- LÓGICA DAS SKILLS MÚLTIPLAS ---
                let skillsHTML = '';
                if (derrotado && boss.skills) {
                    skillsHTML = `<div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">`;
                    
                    if (boss.id === 'pesadelo') {
                        // O Pesadelo usa 14 skills. Vamos mostrar 4 representativas + um aviso
                        const skillsRep = [
                            { nome: 'Sete Cabeças', handler: 'evento_teju_sete_cabecas' },
                            { nome: 'Inundação', handler: 'evento_mboi_inundacao' },
                            { nome: 'Clarão Cegante', handler: 'evento_jasy_clarao_cegante' },
                            { nome: 'Colheita Sombria', handler: 'evento_luison_colheita' }
                        ];
                        skillsRep.forEach(skill => {
                            skillsHTML += `
                                <div style="flex:1; min-width:130px; background:rgba(10,6,2,0.4); padding:8px; border-radius:6px; border:1px solid rgba(142,68,173,0.4);">
                                    <div style="color:#c39bd3; font-family:'Cinzel',serif; font-size:0.75rem; text-align:center; margin-bottom:5px;">${skill.nome}</div>
                                    <div style="display:flex; justify-content:center;">${desenharMiniGrid(skill.handler)}</div>
                                </div>
                            `;
                        });
                        skillsHTML += `</div>`;
                        skillsHTML += `<div style="text-align:center; color:#8e44ad; font-family:'EB Garamond',serif; font-size:0.85rem; font-style:italic; margin-top:8px;">+ 10 outras skills dos Sete Selados</div>`;
                    
                    } else if (boss.id === 'luison') {
                        // O Luison tem 2 skills: Colheita Sombria e Legado (que invoca as outras)
                        const skillsLuison = [
                            { nome: 'Colheita Sombria', handler: 'evento_luison_colheita' },
                            { nome: 'Legado dos Filhos', handler: 'evento_luison_legado' }
                        ];
                        skillsLuison.forEach(skill => {
                            skillsHTML += `
                                <div style="flex:1; min-width:130px; background:rgba(10,6,2,0.4); padding:8px; border-radius:6px; border:1px solid rgba(201,162,39,0.2);">
                                    <div style="color:#e8b923; font-family:'Cinzel',serif; font-size:0.75rem; text-align:center; margin-bottom:5px;">${skill.nome}</div>
                                    <div style="display:flex; justify-content:center;">${desenharMiniGrid(skill.handler)}</div>
                                </div>
                            `;
                        });
                        skillsHTML += `</div>`;
                        skillsHTML += `<div style="text-align:center; color:#b8a577; font-family:'EB Garamond',serif; font-size:0.8rem; font-style:italic; margin-top:8px;">Legado dos Filhos invoca skills dos outros bosses</div>`;
                    
                    } else {
                        // Bosses normais (1 ou 2 skills)
                        boss.skills.forEach(skill => {
                            skillsHTML += `
                                <div style="flex:1; min-width:130px; background:rgba(10,6,2,0.4); padding:8px; border-radius:6px; border:1px solid rgba(201,162,39,0.2);">
                                    <div style="color:#e8b923; font-family:'Cinzel',serif; font-size:0.75rem; text-align:center; margin-bottom:5px;">${skill.nome}</div>
                                    <div style="display:flex; justify-content:center;">${desenharMiniGrid(skill.handler)}</div>
                                </div>
                            `;
                        });
                        skillsHTML += `</div>`;
                    }
                }

                let dropsHTML = '<span style="color:#8a7a52; font-style:italic;">Desconhecido.</span>';
                if (derrotado) {
                    dropsHTML = boss.id === 'pesadelo' 
                        ? `<span style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; background:rgba(10,6,2,0.5); border:1px solid rgba(142,68,173,0.5); border-radius:20px; font-size:0.8rem; color:#d9c89a;">🧿 Núcleo do Pesadelo</span>`
                        : `
                            <span style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; background:rgba(10,6,2,0.5); border:1px solid rgba(201,162,39,0.25); border-radius:20px; font-size:0.8rem; color:#d9c89a;">🗡️ Armas (5%-20%)</span>
                            <span style="display:inline-flex; align-items:center; gap:4px; padding:4px 10px; background:rgba(142,68,173,0.1); border:1px solid rgba(142,68,173,0.5); border-radius:20px; font-size:0.8rem; color:#d9c89a;">🧿 Fragmento (5%-20%)</span>
                        `;
                }

                const fasesHTML = derrotado 
                    ? `<span style="font-size:0.75rem; padding:3px 8px; background:rgba(201,162,39,0.1); border:1px solid rgba(201,162,39,0.3); border-radius:12px; color:#e8b923;">${boss.diaLabel}</span>`
                    : '';

                card.innerHTML = `
                    <div class="bestiary-card-header" style="display:flex; align-items:center; gap:12px;">
                        <div style="width:72px; height:72px; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.3); border-radius:6px;">
                            ${imgHTML}
                        </div>
                        <div class="bestiary-card-info" style="flex:1;">
                            <div style="font-family:'Cinzel',serif; color:#f0e2c0; font-size:1.05rem;">${derrotado ? boss.nome : '???'}</div>
                            <div style="font-family:'EB Garamond',serif; color:#b8a577; font-size:0.85rem; font-style:italic;">${derrotado ? boss.titulo : 'Desconhecido'} · ${boss.diaLabel}</div>
                            <div style="display:flex; gap:12px; font-size:0.85rem; color:#d9c89a; margin-top:4px;">
                                <span><b>HP</b> ${boss.hp}</span>
                                <span><b>ATK</b> ${boss.atk}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${derrotado ? `<div style="font-family:'EB Garamond',serif; color:#b8a577; font-size:0.9rem; font-style:italic; line-height:1.5; padding:8px 12px; background:rgba(10,6,2,0.4); border-left:3px solid #6a5024; border-radius:4px; margin-top:10px;">${boss.descricao}</div>` : ''}
                    
                    ${skillsHTML}
                    
                    <div style="margin-top:10px;">
                        <div style="font-family:'Cinzel',serif; color:#8a7a52; font-size:0.75rem; letter-spacing:2px; margin-bottom:5px;">💎 DROPS</div>
                        <div style="display:flex; flex-wrap:wrap; gap:8px;">${dropsHTML}</div>
                    </div>
                    
                    <div style="margin-top:10px;">
                        <div style="font-family:'Cinzel',serif; color:#8a7a52; font-size:0.75rem; letter-spacing:2px; margin-bottom:5px;">📖 APARECE EM</div>
                        <div style="display:flex; flex-wrap:wrap; gap:6px;">${fasesHTML}</div>
                    </div>
                `;
                
                grid.appendChild(card);
            });

            return r;
        };
    }

    console.log('✅ [V13.8] Bestiário com suporte a múltiplas skills e Pesadelo.');
})();
// =================================================================
