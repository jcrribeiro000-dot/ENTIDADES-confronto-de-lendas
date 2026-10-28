// =================================================================
// nacoes.js — V2.0 — AS SETE NAÇÕES (Reescrito sobre motor do Sete Selados)
// =================================================================
// • 7 nações × 3 deuses = 21 bosses únicos
// • 3 fases acumulativas: Fase 1=[deus1], Fase 2=[deus1,deus2], Fase 3=[deus1,deus2,deus3]
// • 21 armas (7×3: tacape/flecha/cajado) dropadas na Fase 3
// • 7 amuletos (dropados na Fase 3)
// • 7 fragmentos → desbloqueia Abya
// • Dificuldade por progresso (padrão historia.js)
// • Pesadelo mensal: 7 deuses finais em fila
// • Reaproveita 100% do motor do Sete Selados
// =================================================================
(function seteNacoesV2() {
    if (window._seteNacoesV2) return;
    window._seteNacoesV2 = true;

    // ═══════════════════════════════════════════════════════════
    // CONFIG
    // ═══════════════════════════════════════════════════════════
    const CONFIG = {
        custoEntrada: { normal: 500, dificil: 1000, pesadelo: 1500 },
        custoPesadelo: { normal: 1000, dificil: 2000, pesadelo: 3000 },
        heroId: 'Abya',
        moedaId: 'essencia_ancestral',
        dropArma:     { normal: 0.05, dificil: 0.10, pesadelo: 0.20 },
        dropFragmento:{ normal: 0.05, dificil: 0.10, pesadelo: 0.20 },
        dropAmuleto:  { normal: 0.05, dificil: 0.10, pesadelo: 0.20 },
        dropPesadeloArma:      0.35,
        dropPesadeloFragmento: 0.20,
        dropPesadeloAmuleto:   0.25,
    };

    const DIFF_LABEL = { normal: 'Normal', dificil: 'Difícil', pesadelo: 'Pesadelo' };
    const DIFF_COR   = { normal: '#c9a227', dificil: '#e67e22', pesadelo: '#a83232' };

    const XP_POR_FASE = { '1': 200, '2': 350, '3': 500 };
    const OURO_POR_FASE = { '1': 150, '2': 250, '3': 400 };

    // ═══════════════════════════════════════════════════════════
    // SPRITES / SONS (vazios = usa emoji/fallback)
    // ═══════════════════════════════════════════════════════════
    const SPRITES_NACAO = {
        nacao_yucahu:'https://i.imgur.com/X2UY7TU.gif', nacao_atabey:'https://i.imgur.com/I5G3k9X.gif', nacao_juracan:'https://i.imgur.com/KLFzINl.gif',
        nacao_quetzalcoatl:'https://i.imgur.com/AcQkgO1.gif', nacao_tezcatlipoca:'https://i.imgur.com/BPObfz2.gif', nacao_huitzilopochtli:'https://i.imgur.com/C3kd9mB.gif',
        nacao_kukulkan:'https://i.imgur.com/V3XmBYU.gif', nacao_chaac:'https://i.imgur.com/uT6TKbb.gif', nacao_ixchel:'https://i.imgur.com/I5G3k9X.gif',
        nacao_illapa:'https://i.imgur.com/9ICAqQE.gif', nacao_mamaquilla:'https://i.imgur.com/u2JCJgU.gif', nacao_supay:'https://i.imgur.com/kg1U6nB.gif',
        nacao_antu:'https://i.imgur.com/9qt8HIv.gif', nacao_pillan:'https://i.imgur.com/LRRy8eM.gif', nacao_wekufe:'https://i.imgur.com/I1cQwNe.gif',
        nacao_bochica:'https://i.imgur.com/Y0pwmcj.gif', nacao_bachue:'https://i.imgur.com/YlGSDD8.gif', nacao_chibchacum:'https://i.imgur.com/ZrD5m4C.gif',
        nacao_maii:'https://i.imgur.com/Ot6f7hV.gif', nacao_spiderwoman:'https://i.imgur.com/arKbQji.gif', nacao_hashchelti:'https://i.imgur.com/H5kJgxj.gif',
        heroi_Abya:'https://i.imgur.com/3gom0Dy.gif', essencia_ancestral:'https://i.imgur.com/Rigf9eE.png',
    };

    const EMOJIS_NACAO = {
        nacao_yucahu:'🌱', nacao_atabey:'💧', nacao_juracan:'🌪️',
        nacao_quetzalcoatl:'🐍', nacao_tezcatlipoca:'🪞', nacao_huitzilopochtli:'☀️',
        nacao_kukulkan:'🐉', nacao_chaac:'⚡', nacao_ixchel:'🌙',
        nacao_illapa:'⛈️', nacao_mamaquilla:'🌕', nacao_supay:'💀',
        nacao_antu:'🔆', nacao_pillan:'🌋', nacao_wekufe:'👻',
        nacao_bochica:'🪄', nacao_bachue:'🌊', nacao_chibchacum:'🏔️',
        nacao_maii:'🐺', nacao_spiderwoman:'🕷️', nacao_hashchelti:'⭐',
        heroi_Abya:'🌎', essencia_ancestral:'🌎',
        fragmento_nacao_tainos:'🌊', fragmento_nacao_astecas:'🔥',
        fragmento_nacao_maias:'🏺', fragmento_nacao_incas:'☀️',
        fragmento_nacao_mapuches:'🌋', fragmento_nacao_chibchas:'🏔️',
        fragmento_nacao_navajos:'🌵',
        amuleto_nacao_tainos:'🐚', amuleto_nacao_astecas:'🪞',
        amuleto_nacao_maias:'🟢', amuleto_nacao_incas:'🥇',
        amuleto_nacao_mapuches:'🔥', amuleto_nacao_chibchas:'🎭',
        amuleto_nacao_navajos:'🪶',
    };

    // ═══════════════════════════════════════════════════════════
    // 7 NAÇÕES × 3 DEUSES
    // ═══════════════════════════════════════════════════════════
    const NACOES = {
        tainos: {
            id:'tainos', nome:'Taínos', titulo:'O Arquipélago Sagrado',
            diaSemana: 1, diaLabel: 'Segunda',
            elemento: 'AGUA', corFundo: '#1a3a5a',
            descricao: 'Ilhas caribenhas banhadas pelo sol. Yúcahu criou a mandioca, Atabey gerou as águas, Juracán destruiu as terras.',
            lore: 'O primeiro povo a avistar o mar. Yúcahu, filho do amanhecer; Atabey, mãe do silêncio; Juracán, o olho que gira no céu. Anhangá corrompeu a tríade — ela agora destrói a própria criação.',
            deuses: ['nacao_yucahu', 'nacao_atabey', 'nacao_juracan'],
        },
        astecas: {
            id:'astecas', nome:'Astecas', titulo:'O Império do Espelho Fumegante',
            diaSemana: 2, diaLabel: 'Terça',
            elemento: 'FOGO', corFundo: '#3a1a0a',
            descricao: 'Terra do sacrifício e da obsidiana. Quetzalcóatl, Tezcatlipoca e Huitzilopochtli — três deuses que se odiavam — agora lutam lado a lado.',
            lore: 'Quetzalcóatl soprou a humanidade, Tezcatlipoca viu todos os destinos, Huitzilopochtli devorou o sol. Anhangá corrompeu a rivalidade antiga — os três agora atacam como um só.',
            deuses: ['nacao_quetzalcoatl', 'nacao_tezcatlipoca', 'nacao_huitzilopochtli'],
        },
        maias: {
            id:'maias', nome:'Maias', titulo:'A Selva dos Números Perdidos',
            diaSemana: 3, diaLabel: 'Quarta',
            elemento: 'TERRA', corFundo: '#1a3a1a',
            descricao: 'Templos que medem o tempo. Kukulkán desce em forma de serpente, Chaac lança as chuvas, Ixchel tece as medicinas.',
            lore: 'Os que contaram o tempo. Kukulkán desce ao equinócio, Chaac enche os cenotes, Ixchel cura com fios de lua. Anhangá quebrou o calendário — os três contam apenas morte.',
            deuses: ['nacao_kukulkan', 'nacao_chaac', 'nacao_ixchel'],
        },
        incas: {
            id:'incas', nome:'Incas', titulo:'A Cordilheira do Sol',
            diaSemana: 4, diaLabel: 'Quinta',
            elemento: 'AR', corFundo: '#2a2a3a',
            descricao: 'Pedra sobre pedra até tocar o céu. Illapa forja os raios, Mama Quilla chora prata, Supay governa o subsolo.',
            lore: 'Os filhos do sol. Illapa carrega o trovão em três nomes, Mama Quilla é irmã e esposa do sol, Supay reina no Ukhu Pacha. Anhangá desceu ao fundo da terra — e voltou com os três.',
            deuses: ['nacao_illapa', 'nacao_mamaquilla', 'nacao_supay'],
        },
        mapuches: {
            id:'mapuches', nome:'Mapuches', titulo:'A Terra dos Vulcões',
            diaSemana: 5, diaLabel: 'Sexta',
            elemento: 'FOGO', corFundo: '#3a2a1a',
            descricao: 'A Patagônia se ergue entre fumaça. Antü aquece o dia, Pillán ruge nos vulcões, Wekufe sussurra nas noites.',
            lore: 'O povo da terra. Antü pintou o mundo com luz, Pillán fez da montanha fogo, Wekufe é o espírito que sobra depois da morte. Anhangá prometeu a eles um inimigo comum — os três aceitaram.',
            deuses: ['nacao_antu', 'nacao_pillan', 'nacao_wekufe'],
        },
        chibchas: {
            id:'chibchas', nome:'Chibchas', titulo:'O Altiplano Dourado',
            diaSemana: 6, diaLabel: 'Sábado',
            elemento: 'TERRA', corFundo: '#2a2a0a',
            descricao: 'Os muiscas esculpiram ouro para o sol. Bochica ensinou o caminho, Bachué pariu os homens, Chibchacum carrega o mundo.',
            lore: 'O povo do ouro. Bochica veio do leste com um bastão, Bachué saiu da lagoa com um filho, Chibchacum sustenta a terra com as costas. Anhangá se infiltrou no ouro — agora a lagoa afoga os próprios filhos.',
            deuses: ['nacao_bochica', 'nacao_bachue', 'nacao_chibchacum'],
        },
        navajos: {
            id:'navajos', nome:'Navajos (Diné)', titulo:'A Terra Pintada',
            diaSemana: 0, diaLabel: 'Domingo',
            elemento: 'AR', corFundo: '#3a1a1a',
            descricao: "Desertos vermelhos e areias que curam. Ma'ii engana, Na'ashjé'íí tece, Hashch'é'íí ilumina.",
            lore: "O povo sagrado (Diné). Ma'ii é o coiote que engana até a si mesmo, Na'ashjé'íí teceu o mundo em quatro direções, Hashch'é'íí é o rosto do céu. Anhangá rasgou o tapete de areia — e a harmonia virou tormento.",
            deuses: ['nacao_maii', 'nacao_spiderwoman', 'nacao_hashchelti'],
        },
    };

    // ═══════════════════════════════════════════════════════════
    // 21 DEUSES (id, nome, elemento, hp, atk, skills, descricao)
    // ═══════════════════════════════════════════════════════════
    const DEUSES = {
        // ─── TAÍNOS ───
        nacao_yucahu: {
            id:'nacao_yucahu', nacao:'tainos', nome:'Yúcahu', titulo:'O Filho da Mandioca',
            elemento:'TERRA', hp:100, atk:4,
            descricao:'Criador da mandioca. A raiva apodreceu sua colheita.',
            skills:[
                { nome:'Raízes Traiçoeiras', handler:'nacao_yucahu_raizes' },
                { nome:'Colheita Podre',     handler:'nacao_yucahu_colheita' },
            ],
        },
        nacao_atabey: {
            id:'nacao_atabey', nacao:'tainos', nome:'Atabey', titulo:'A Mãe do Silêncio',
            elemento:'AGUA', hp:110, atk:4,
            descricao:'Mãe das águas. Sua calma se tornou afogamento.',
            skills:[
                { nome:'Maré Amarga',    handler:'nacao_atabey_mare' },
                { nome:'Canto Submerso', handler:'nacao_atabey_canto' },
            ],
        },
        nacao_juracan: {
            id:'nacao_juracan', nacao:'tainos', nome:'Juracán', titulo:'O Olho que Gira',
            elemento:'AR', hp:130, atk:5,
            descricao:'Senhor dos furacões. Sua fúria foi despertada.',
            skills:[
                { nome:'Olho do Furacão',     handler:'nacao_juracan_olho' },
                { nome:'Destruição Circular', handler:'nacao_juracan_destruicao' },
            ],
        },

        // ─── ASTECAS ───
        nacao_quetzalcoatl: {
            id:'nacao_quetzalcoatl', nacao:'astecas', nome:'Quetzalcóatl', titulo:'A Serpente Emplumada',
            elemento:'AR', hp:120, atk:5,
            descricao:'Deus que trouxe a escrita e o milho. Sua sabedoria virou tormento.',
            skills:[
                { nome:'Sopro de Vento',   handler:'nacao_quetzalcoatl_sopro' },
                { nome:'Voo Serpentino',   handler:'nacao_quetzalcoatl_voo' },
            ],
        },
        nacao_tezcatlipoca: {
            id:'nacao_tezcatlipoca', nacao:'astecas', nome:'Tezcatlipoca', titulo:'O Espelho Fumegante',
            elemento:'FOGO', hp:140, atk:5,
            descricao:'Deus da noite, do destino e do espelho. Seus reflexos cegam.',
            skills:[
                { nome:'Espelho Partido', handler:'nacao_tezcatlipoca_espelho' },
                { nome:'Fumaça Negra',    handler:'nacao_tezcatlipoca_fumaca' },
            ],
        },
        nacao_huitzilopochtli: {
            id:'nacao_huitzilopochtli', nacao:'astecas', nome:'Huitzilopochtli', titulo:'O Colibri do Sul',
            elemento:'FOGO', hp:160, atk:6,
            descricao:'Deus da guerra e do sol. Cada batalha alimenta sua fúria.',
            skills:[
                { nome:'Guerra Sagrada', handler:'nacao_huitzi_guerra' },
                { nome:'Sol Negro',      handler:'nacao_huitzi_sol' },
            ],
        },

        // ─── MAIAS ───
        nacao_kukulkan: {
            id:'nacao_kukulkan', nacao:'maias', nome:'Kukulkán', titulo:'A Serpente do Equinócio',
            elemento:'AR', hp:130, atk:5,
            descricao:'Desce a cada equinócio em Chichén Itzá. Sua descida agora é tempestade.',
            skills:[
                { nome:'Descida do Equinócio', handler:'nacao_kukulkan_descida' },
                { nome:'Sombra da Serpente',   handler:'nacao_kukulkan_sombra' },
            ],
        },
        nacao_chaac: {
            id:'nacao_chaac', nacao:'maias', nome:'Chaac', titulo:'O Machado da Chuva',
            elemento:'AGUA', hp:140, atk:5,
            descricao:'Deus da chuva e do relâmpago. Sua fúria cai em granizo.',
            skills:[
                { nome:'Chuva de Granizo', handler:'nacao_chaac_granizo' },
                { nome:'Machado Relâmpago', handler:'nacao_chaac_machado' },
            ],
        },
        nacao_ixchel: {
            id:'nacao_ixchel', nacao:'maias', nome:'Ixchel', titulo:'A Tecelã da Lua',
            elemento:'AGUA', hp:150, atk:5,
            descricao:'Deusa da medicina, do arco-íris e da lua. Seu tear virou armadilha.',
            skills:[
                { nome:'Tear Lunar',       handler:'nacao_ixchel_tear' },
                { nome:'Veneno Curativo',  handler:'nacao_ixchel_veneno' },
            ],
        },

        // ─── INCAS ───
        nacao_illapa: {
            id:'nacao_illapa', nacao:'incas', nome:'Illapa', titulo:'O Trovão de Três Nomes',
            elemento:'AR', hp:140, atk:5,
            descricao:'Senhor do trovão. Seus três nomes rugem em uníssono.',
            skills:[
                { nome:'Três Raios',         handler:'nacao_illapa_raios' },
                { nome:'Tempestade Andina',  handler:'nacao_illapa_tempestade' },
            ],
        },
        nacao_mamaquilla: {
            id:'nacao_mamaquilla', nacao:'incas', nome:'Mama Quilla', titulo:'A Mãe da Prata',
            elemento:'AGUA', hp:150, atk:5,
            descricao:'Deusa da lua, esposa do sol. Sua prata agora corta como navalha.',
            skills:[
                { nome:'Prata Líquida',  handler:'nacao_mamaquilla_prata' },
                { nome:'Eclipse Lunar',  handler:'nacao_mamaquilla_eclipse' },
            ],
        },
        nacao_supay: {
            id:'nacao_supay', nacao:'incas', nome:'Supay', titulo:'O Senhor do Submundo',
            elemento:'TERRA', hp:170, atk:6,
            descricao:'Governante do Ukhu Pacha. Ele vê através da terra.',
            skills:[
                { nome:'Abismo Andino', handler:'nacao_supay_abismo' },
                { nome:'Terremoto',     handler:'nacao_supay_terremoto' },
            ],
        },

        // ─── MAPUCHES ───
        nacao_antu: {
            id:'nacao_antu', nacao:'mapuches', nome:'Antü', titulo:'O Sol do Amanhecer',
            elemento:'FOGO', hp:140, atk:5,
            descricao:'O sol que iluminou a Patagônia. Seus raios queimam sem pausa.',
            skills:[
                { nome:'Amanhecer Ardente', handler:'nacao_antu_amanhecer' },
                { nome:'Chuva Solar',       handler:'nacao_antu_chuva' },
            ],
        },
        nacao_pillan: {
            id:'nacao_pillan', nacao:'mapuches', nome:'Pillán', titulo:'O Vulcão Vivo',
            elemento:'FOGO', hp:160, atk:6,
            descricao:'Espírito dos vulcões e trovões. Sua montanha cospe fogo sem cessar.',
            skills:[
                { nome:'Erupção Vulcânica', handler:'nacao_pillan_erupcao' },
                { nome:'Chuva de Cinzas',   handler:'nacao_pillan_cinzas' },
            ],
        },
        nacao_wekufe: {
            id:'nacao_wekufe', nacao:'mapuches', nome:'Wekufe', titulo:'O Espírito Sombrio',
            elemento:'TERRA', hp:170, atk:6,
            descricao:'Espírito maligno que sobra depois da morte. Agora ele se multiplicou.',
            skills:[
                { nome:'Enxame Espiritual', handler:'nacao_wekufe_enxame' },
                { nome:'Assombração',       handler:'nacao_wekufe_assombracao' },
            ],
        },

        // ─── CHIBCHAS ───
        nacao_bochica: {
            id:'nacao_bochica', nacao:'chibchas', nome:'Bochica', titulo:'O Civilizador',
            elemento:'TERRA', hp:140, atk:5,
            descricao:'O mestre que ensinou a tecelagem e a agricultura. Sua sabedoria julga.',
            skills:[
                { nome:'Bastão de Ouro',       handler:'nacao_bochica_bastao' },
                { nome:'Julgamento Ancestral', handler:'nacao_bochica_julgamento' },
            ],
        },
        nacao_bachue: {
            id:'nacao_bachue', nacao:'chibchas', nome:'Bachué', titulo:'A Mãe da Lagoa',
            elemento:'AGUA', hp:150, atk:5,
            descricao:'Deusa que saiu da lagoa de Iguaque. Suas águas agora afogam.',
            skills:[
                { nome:'Águas de Iguaque',  handler:'nacao_bachue_aguas' },
                { nome:'Abraço Submerso',   handler:'nacao_bachue_abraco' },
            ],
        },
        nacao_chibchacum: {
            id:'nacao_chibchacum', nacao:'chibchas', nome:'Chibchacum', titulo:'O Sustentador',
            elemento:'TERRA', hp:170, atk:6,
            descricao:'Deus que carrega o mundo nas costas. Sua raiva faz a terra tremer.',
            skills:[
                { nome:'Tremor Profundo', handler:'nacao_chibchacum_tremor' },
                { nome:'Peso do Mundo',   handler:'nacao_chibchacum_peso' },
            ],
        },

        // ─── NAVAJOS ───
        nacao_maii: {
            id:'nacao_maii', nacao:'navajos', nome:"Ma'ii", titulo:'O Coiote Trapaceiro',
            elemento:'TERRA', hp:140, atk:5,
            descricao:'O trickster que engana deuses. Seu riso agora é veneno.',
            skills:[
                { nome:'Trapaça',      handler:'nacao_maii_trapaca' },
                { nome:'Coiote Uiva',  handler:'nacao_maii_uivo' },
            ],
        },
        nacao_spiderwoman: {
            id:'nacao_spiderwoman', nacao:'navajos', nome:"Na'ashjé'íí", titulo:'A Mulher Aranha',
            elemento:'AR', hp:150, atk:5,
            descricao:'A tecelã do céu e da terra. Sua teia agora prende almas.',
            skills:[
                { nome:'Teia Celeste',    handler:'nacao_aranha_teia' },
                { nome:'Fios do Destino', handler:'nacao_aranha_fios' },
            ],
        },
        nacao_hashchelti: {
            id:'nacao_hashchelti', nacao:'navajos', nome:"Hashch'éíí", titulo:'O Rosto do Céu',
            elemento:'AR', hp:170, atk:6,
            descricao:'Deus do céu, da luz e das estrelas. Sua luz agora cega.',
            skills:[
                { nome:'Estrelas Cadentes', handler:'nacao_hashchelti_estrelas' },
                { nome:'Céu Rasgado',       handler:'nacao_hashchelti_ceu' },
            ],
        },
    };

    // ═══════════════════════════════════════════════════════════
    // 21 ARMAS (7 nações × 3 tipos)
    // ═══════════════════════════════════════════════════════════
    const ARMAS = {
        // TAÍNOS (AGUA)
        arma_nacao_tainos_tacape: { id:'arma_nacao_tainos_tacape', nome:'Macana da Colheita', tipo:'tacape', elemento:'TERRA', atkBonus:5, elementoBonus:5, boss:'nacao_tainos', emoji:'🪓' },
        arma_nacao_tainos_flecha: { id:'arma_nacao_tainos_flecha', nome:'Flecha da Maré', tipo:'flecha', elemento:'AGUA', atkBonus:5, elementoBonus:5, boss:'nacao_tainos', emoji:'🏹' },
        arma_nacao_tainos_cajado: { id:'arma_nacao_tainos_cajado', nome:'Cajado do Furacão', tipo:'cajado', elemento:'AR', atkBonus:5, elementoBonus:5, boss:'nacao_tainos', emoji:'🪄' },
        // ASTECAS (FOGO)
        arma_nacao_astecas_tacape: { id:'arma_nacao_astecas_tacape', nome:'Macuahuitl de Vento', tipo:'tacape', elemento:'AR', atkBonus:5, elementoBonus:5, boss:'nacao_astecas', emoji:'🪓' },
        arma_nacao_astecas_flecha: { id:'arma_nacao_astecas_flecha', nome:'Flecha do Espelho', tipo:'flecha', elemento:'FOGO', atkBonus:5, elementoBonus:5, boss:'nacao_astecas', emoji:'🏹' },
        arma_nacao_astecas_cajado: { id:'arma_nacao_astecas_cajado', nome:'Cajado do Sol Negro', tipo:'cajado', elemento:'FOGO', atkBonus:5, elementoBonus:5, boss:'nacao_astecas', emoji:'🪄' },
        // MAIAS (TERRA)
        arma_nacao_maias_tacape: { id:'arma_nacao_maias_tacape', nome:'Macuahuitl da Serpente', tipo:'tacape', elemento:'AR', atkBonus:5, elementoBonus:5, boss:'nacao_maias', emoji:'🪓' },
        arma_nacao_maias_flecha: { id:'arma_nacao_maias_flecha', nome:'Flecha da Chuva', tipo:'flecha', elemento:'AGUA', atkBonus:5, elementoBonus:5, boss:'nacao_maias', emoji:'🏹' },
        arma_nacao_maias_cajado: { id:'arma_nacao_maias_cajado', nome:'Cajado Lunar', tipo:'cajado', elemento:'AGUA', atkBonus:5, elementoBonus:5, boss:'nacao_maias', emoji:'🪄' },
        // INCAS (AR)
        arma_nacao_incas_tacape: { id:'arma_nacao_incas_tacape', nome:'Estrela do Trovão', tipo:'tacape', elemento:'AR', atkBonus:5, elementoBonus:5, boss:'nacao_incas', emoji:'🪓' },
        arma_nacao_incas_flecha: { id:'arma_nacao_incas_flecha', nome:'Flecha da Prata', tipo:'flecha', elemento:'AGUA', atkBonus:5, elementoBonus:5, boss:'nacao_incas', emoji:'🏹' },
        arma_nacao_incas_cajado: { id:'arma_nacao_incas_cajado', nome:'Cajado do Submundo', tipo:'cajado', elemento:'TERRA', atkBonus:5, elementoBonus:5, boss:'nacao_incas', emoji:'🪄' },
        // MAPUCHES (FOGO)
        arma_nacao_mapuches_tacape: { id:'arma_nacao_mapuches_tacape', nome:'Luma do Sol', tipo:'tacape', elemento:'FOGO', atkBonus:5, elementoBonus:5, boss:'nacao_mapuches', emoji:'🪓' },
        arma_nacao_mapuches_flecha: { id:'arma_nacao_mapuches_flecha', nome:'Flecha do Vulcão', tipo:'flecha', elemento:'FOGO', atkBonus:5, elementoBonus:5, boss:'nacao_mapuches', emoji:'🏹' },
        arma_nacao_mapuches_cajado: { id:'arma_nacao_mapuches_cajado', nome:'Cajado dos Espíritos', tipo:'cajado', elemento:'TERRA', atkBonus:5, elementoBonus:5, boss:'nacao_mapuches', emoji:'🪄' },
        // CHIBCHAS (TERRA)
        arma_nacao_chibchas_tacape: { id:'arma_nacao_chibchas_tacape', nome:'Macana Dourada', tipo:'tacape', elemento:'TERRA', atkBonus:5, elementoBonus:5, boss:'nacao_chibchas', emoji:'🪓' },
        arma_nacao_chibchas_flecha: { id:'arma_nacao_chibchas_flecha', nome:'Flecha da Lagoa', tipo:'flecha', elemento:'AGUA', atkBonus:5, elementoBonus:5, boss:'nacao_chibchas', emoji:'🏹' },
        arma_nacao_chibchas_cajado: { id:'arma_nacao_chibchas_cajado', nome:'Cajado do Terremoto', tipo:'cajado', elemento:'TERRA', atkBonus:5, elementoBonus:5, boss:'nacao_chibchas', emoji:'🪄' },
        // NAVAJOS (AR)
        arma_nacao_navajos_tacape: { id:'arma_nacao_navajos_tacape', nome:'Atlatl do Coiote', tipo:'tacape', elemento:'TERRA', atkBonus:5, elementoBonus:5, boss:'nacao_navajos', emoji:'🪓' },
        arma_nacao_navajos_flecha: { id:'arma_nacao_navajos_flecha', nome:'Flecha da Tecelã', tipo:'flecha', elemento:'AR', atkBonus:5, elementoBonus:5, boss:'nacao_navajos', emoji:'🏹' },
        arma_nacao_navajos_cajado: { id:'arma_nacao_navajos_cajado', nome:'Cajado do Céu', tipo:'cajado', elemento:'AR', atkBonus:5, elementoBonus:5, boss:'nacao_navajos', emoji:'🪄' },
    };

    // ═══════════════════════════════════════════════════════════
    // 7 AMULETOS (drops na Fase 3)
    // ═══════════════════════════════════════════════════════════
    const AMULETOS = {
        amuleto_nacao_tainos:   { id:'amuleto_nacao_tainos',   nome:'Colar de Conchas',     nacao:'tainos',   ato:0, custoOuro:0, emoji:'🐚', receita:{}, efeito:{ hpBonus:3, healPerTurn:1, elementOverride:'AGUA' } },
        amuleto_nacao_astecas:  { id:'amuleto_nacao_astecas',  nome:'Espelho de Obsidiana', nacao:'astecas',  ato:0, custoOuro:0, emoji:'🪞', receita:{}, efeito:{ atkBonus:2, hpBonus:2 } },
        amuleto_nacao_maias:    { id:'amuleto_nacao_maias',    nome:'Jade da Lua',          nacao:'maias',    ato:0, custoOuro:0, emoji:'🟢', receita:{}, efeito:{ hpBonus:4, elementOverride:'AGUA' } },
        amuleto_nacao_incas:    { id:'amuleto_nacao_incas',    nome:'Lágrima do Sol',       nacao:'incas',    ato:0, custoOuro:0, emoji:'🥇', receita:{}, efeito:{ atkBonus:3, elementOverride:'AR' } },
        amuleto_nacao_mapuches: { id:'amuleto_nacao_mapuches', nome:'Pedra do Vulcão',      nacao:'mapuches', ato:0, custoOuro:0, emoji:'🔥', receita:{}, efeito:{ atkBonus:3, hpBonus:1 } },
        amuleto_nacao_chibchas: { id:'amuleto_nacao_chibchas', nome:'Máscara de Ouro',      nacao:'chibchas', ato:0, custoOuro:0, emoji:'🎭', receita:{}, efeito:{ hpBonus:5, healPerTurn:2 } },
        amuleto_nacao_navajos:  { id:'amuleto_nacao_navajos',  nome:'Pena do Vento',        nacao:'navajos',  ato:0, custoOuro:0, emoji:'🪶', receita:{}, efeito:{ atkBonus:2, hpBonus:3, elementOverride:'AR' } },
    };

    // ═══════════════════════════════════════════════════════════
    // 7 FRAGMENTOS
    // ═══════════════════════════════════════════════════════════
    const FRAGMENTOS = {
        fragmento_nacao_tainos:   { id:'fragmento_nacao_tainos',   nome:'Fragmento Taíno',   nacao:'tainos',   emoji:'🌊' },
        fragmento_nacao_astecas:  { id:'fragmento_nacao_astecas',  nome:'Fragmento Asteca',  nacao:'astecas',  emoji:'🔥' },
        fragmento_nacao_maias:    { id:'fragmento_nacao_maias',    nome:'Fragmento Maia',    nacao:'maias',    emoji:'🏺' },
        fragmento_nacao_incas:    { id:'fragmento_nacao_incas',    nome:'Fragmento Inca',    nacao:'incas',    emoji:'☀️' },
        fragmento_nacao_mapuches: { id:'fragmento_nacao_mapuches', nome:'Fragmento Mapuche', nacao:'mapuches', emoji:'🌋' },
        fragmento_nacao_chibchas: { id:'fragmento_nacao_chibchas', nome:'Fragmento Muisca',  nacao:'chibchas', emoji:'🏔️' },
        fragmento_nacao_navajos:  { id:'fragmento_nacao_navajos',  nome:'Fragmento Diné',    nacao:'navajos',  emoji:'🌵' },
    };

    // ═══════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════
    const _sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const _log = (m) => { if (typeof addLog === 'function') addLog(m); };
    const _fx = (k, c, x, y, o) => { if (typeof spawnFxAt === 'function') spawnFxAt(k, c, x, y, o || {}); };
    const _dmg = (t, a) => { if (typeof applyDmg === 'function') applyDmg(t, a); };
    const _alive = () => (typeof players !== 'undefined' ? players.filter(p => p && !p.dead) : []);

    function _nearest(fromX, fromY) {
        const alive = _alive();
        if (alive.length === 0) return null;
        let best = alive[0], dist = Math.abs(alive[0].x - fromX) + Math.abs(alive[0].y - fromY);
        alive.forEach(p => {
            const d = Math.abs(p.x - fromX) + Math.abs(p.y - fromY);
            if (d < dist) { dist = d; best = p; }
        });
        return best;
    }
    function _linha(cx, cy, horiz) {
        const t = [];
        for (let i = 0; i < 8; i++) t.push(horiz ? { x:i, y:cy } : { x:cx, y:i });
        return t;
    }
    function _area(cx, cy, r) {
        const t = [];
        for (let dx = -r; dx <= r; dx++)
            for (let dy = -r; dy <= r; dy++) {
                const nx = cx+dx, ny = cy+dy;
                if (nx>=0 && nx<8 && ny>=0 && ny<8) t.push({ x:nx, y:ny });
            }
        return t;
    }
    function _cruz(cx, cy) {
        const t = _linha(cx, cy, true).concat(_linha(cx, cy, false));
        const seen = new Set();
        return t.filter(x => { const k = `${x.x},${x.y}`; if (seen.has(k)) return false; seen.add(k); return true; });
    }
    function _diagonal(cx, cy, len) {
        const t = [];
        [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dx,dy]) => {
            for (let i = 1; i <= len; i++) {
                const nx = cx+dx*i, ny = cy+dy*i;
                if (nx>=0 && nx<8 && ny>=0 && ny<8) t.push({ x:nx, y:ny });
            }
        });
        return t;
    }
    function _dmgEmTiles(tiles, dano) {
        const set = new Set(tiles.map(t => `${t.x},${t.y}`));
        let n = 0;
        _alive().forEach(p => { if (set.has(`${p.x},${p.y}`)) { _dmg(p, dano); n++; } });
        return n;
    }
    function _dmgGlobal(dano) { _alive().forEach(p => _dmg(p, dano)); }
    function _convert(tiles, el) {
        tiles.forEach(t => {
            if (typeof grid === 'undefined') return;
            grid[t.y*8 + t.x] = el;
            const tile = document.querySelectorAll('#grid .tile')[t.y*8 + t.x];
            if (tile) tile.className = `tile bg-${el}`;
        });
    }

    // ═══════════════════════════════════════════════════════════
    // REGISTRO NAS TABELAS GLOBAIS
    // ═══════════════════════════════════════════════════════════
    // 1. STORY_ENEMIES (21 deuses)
    Object.values(DEUSES).forEach(d => {
        if (typeof STORY_ENEMIES !== 'undefined') {
            STORY_ENEMIES[d.id] = {
                id: d.id, name: d.nome, hp: d.hp, atk: d.atk,
                isBoss: true, elemento: d.elemento,
                skill1: d.skills[0], skill2: d.skills[1],
                descricao: d.descricao,
            };
        }
    });

    // 2. EVENTO_BOSSES (7 nações + pesadelo, diaSemana: -1)
    Object.values(NACOES).forEach(n => {
        if (typeof EVENTO_BOSSES !== 'undefined') {
            EVENTO_BOSSES['nacao_' + n.id] = {
                id: 'nacao_' + n.id,
                nome: n.nome, titulo: n.titulo,
                diaSemana: -1, diaLabel: n.diaLabel,
                elemento: n.elemento, corFundo: n.corFundo,
                descricao: n.descricao, lore: n.lore,
                animais: n.deuses, // fila progressiva
                skills: [{ nome: 'Ataque', handler: 'nacao_default' }],
                restricao: null,
                isNacao: true,
                nacaoId: n.id,
            };
        }
    });
    if (typeof EVENTO_BOSSES !== 'undefined') {
        EVENTO_BOSSES['nacao_pesadelo'] = {
            id: 'nacao_pesadelo',
            nome: 'Pesadelo das Nações',
            titulo: 'A Fúria das Sete Terras',
            diaSemana: -1, diaLabel: 'Mensal',
            elemento: 'VARIAVEL',
            descricao: 'As sete divindades finais rugem em uníssono. A mata ancestral geme.',
            lore: 'Quando a lua nova se alinha com o sol, as sete terras despertam seus guardiões finais. Não podem ser acalmados individualmente — precisam cair juntos.',
            animais: [
                'nacao_juracan', 'nacao_huitzilopochtli', 'nacao_ixchel',
                'nacao_supay', 'nacao_pillan', 'nacao_chibchacum', 'nacao_hashchelti',
            ],
            skills: [{ nome: 'Ataque', handler: 'nacao_default' }],
            restricao: null,
            isNacao: true,
            isNacaoPesadelo: true,
        };
    }

    // 3. EVENTO_ARMAS (21 armas)
    if (typeof EVENTO_ARMAS !== 'undefined') {
        Object.assign(EVENTO_ARMAS, ARMAS);
    }
    if (typeof EVENTO_SPRITES !== 'undefined') {
        Object.keys(ARMAS).forEach(k => { if (!(k in EVENTO_SPRITES)) EVENTO_SPRITES[k] = ''; });
    }

    // 4. STORY_AMULETS (7 amuletos)
    if (typeof STORY_AMULETS !== 'undefined') {
        Object.assign(STORY_AMULETS, AMULETOS);
    }
    if (typeof STORY_AMULET_SPRITES !== 'undefined') {
        Object.keys(AMULETOS).forEach(k => { if (!(k in STORY_AMULET_SPRITES)) STORY_AMULET_SPRITES[k] = ''; });
    }

    // 5. STORY_MATERIALS (fragmentos + essência ancestral)
    if (typeof STORY_MATERIALS !== 'undefined') {
        STORY_MATERIALS[CONFIG.moedaId] = { id: CONFIG.moedaId, name: 'Essência Ancestral', emoji: '🌎' };
        Object.values(FRAGMENTOS).forEach(f => {
            STORY_MATERIALS[f.id] = { id: f.id, name: f.nome, emoji: f.emoji };
        });
    }
    if (typeof STORY_MATERIAL_PRICES !== 'undefined') {
        STORY_MATERIAL_PRICES[CONFIG.moedaId] = 0;
        Object.keys(FRAGMENTOS).forEach(k => { STORY_MATERIAL_PRICES[k] = 0; });
    }

    // 6. SPRITES_STORY
    if (typeof SPRITES_STORY !== 'undefined') {
        Object.assign(SPRITES_STORY, SPRITES_NACAO);
    }

    // 7. Exposição (compatibilidade + telas)
    window.NACOES = NACOES;
    window.NACAO_DEUSES = DEUSES;
    window.NACAO_ARMAS = ARMAS;
    window.NACAO_AMULETOS = AMULETOS;
    window.NACAO_FRAGMENTOS = FRAGMENTOS;
    window.NACAO_SPRITES = SPRITES_NACAO;
    window.NACAO_EMOJIS = EMOJIS_NACAO;
    window._nacaoConfig = CONFIG;
    window._nacaoHelpers = {
        _sleep, _log, _fx, _dmg, _alive, _nearest,
        _linha, _area, _cruz, _diagonal,
        _dmgEmTiles, _dmgGlobal, _convert,
    };

    // ═══════════════════════════════════════════════════════════
    // ABYA (herói exclusivo)
    // ═══════════════════════════════════════════════════════════
    if (typeof STORY_HERO_CLASSES !== 'undefined' && !STORY_HERO_CLASSES['Abya']) {
        STORY_HERO_CLASSES['Abya'] = {
            displayName:'Abya', spriteKey:'heroi_Abya', className:'Abya',
            role:'Mago', hp:16, atk:6, range:3, element:'TERRA',
            paKey:'abya_chamado_sete', starsNeeded:0, rarity:5,
            passive:'abya_eco_ancestral',
            unlockReq:{ type:'special', desc:'Reúna os 7 Fragmentos Ancestrais' },
        };
    }
    if (typeof PASSIVE_DISPLAY !== 'undefined') {
        PASSIVE_DISPLAY['abya_eco_ancestral'] = { name:'Eco Ancestral', desc:'Sobrevive com 1 HP (30%, 1×/batalha).' };
    }
    if (typeof STORY_HERO_PA !== 'undefined' && !STORY_HERO_PA['abya_chamado_sete']) {
        STORY_HERO_PA['abya_chamado_sete'] = {
            desc:'Chamado dos Sete — Cruz 15 tiles no alvo + dano PA.',
            execute: async (active, target, totalAtk) => {
                if (!target || target.dead) return;
                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
                const tiles = [];
                for (let i = 0; i < 8; i++) {
                    if (!tiles.includes(i*8 + target.x)) tiles.push(i*8 + target.x);
                    if (!tiles.includes(target.y*8 + i)) tiles.push(target.y*8 + i);
                }
                tiles.forEach(idx => {
                    if (typeof grid !== 'undefined') grid[idx] = 'TERRA';
                    const tile = document.querySelectorAll('#grid .tile')[idx];
                    if (tile) tile.className = 'tile bg-TERRA';
                });
            },
        };
    }

    // ═══════════════════════════════════════════════════════════
    // 42 HANDLERS (skills dos deuses — Parte 1b virá logo abaixo)
    // ═══════════════════════════════════════════════════════════
    // Placeholders (preenchidos na Parte 1b)
    // As 42 funções virão no próximo bloco.

    console.log('✅ [Sete Nações V2 - Parte 1a] Config + dados + registro OK');
    console.log('   • 7 nações · 21 deuses · 21 armas · 7 amuletos · 7 fragmentos · Abya');
    console.log('   • Próximo: colar Parte 1b (42 handlers de skill)');
})();
// =================================================================
// nacoes.js — V2.0 — PARTE 1b: 42 handlers de skill
// =================================================================
(function seteNacoesSkillsV2_1b() {
    if (window._seteNacoesSkillsV2_1b) return;
    window._seteNacoesSkillsV2_1b = true;

    if (!window.NACAO_SKILL_HANDLERS) window.NACAO_SKILL_HANDLERS = {};
    const H = window.NACAO_SKILL_HANDLERS;

    const helpers = window._nacaoHelpers || {};
    const { _sleep, _log, _fx, _dmg, _alive, _nearest,
            _linha, _area, _cruz, _diagonal,
            _dmgEmTiles, _dmgGlobal, _convert } = helpers;

    const getBoss = () => (typeof boss !== 'undefined' && boss) ? { x: boss.x, y: boss.y } : { x: 4, y: 0 };
    const sfx = (n) => { try { if (typeof playSfx === 'function') playSfx(n); } catch (e) {} };
    const pushIf = (p, dx, dy, d) => { try { if (typeof tryPushPlayer === 'function') tryPushPlayer(p, dx, dy, d); } catch(e) {} };
    const updateView = () => { if (typeof updateVisuals === 'function') updateVisuals(); };

    // ════════════════════════ TAÍNOS ════════════════════════
    // Yúcahu (TERRA) — criador da mandioca, corrompido
    H['nacao_yucahu_raizes'] = async (enemy, skill) => {
        _log(`🌱 ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa1');
        const c = getBoss();
        const tiles = _area(c.x, c.y, 2);
        tiles.forEach((t, i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:500,scale:0.7}), i*25));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk);
    };
    H['nacao_yucahu_colheita'] = async (enemy, skill) => {
        _log(`🌱 ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa2');
        const targets = _alive().slice(0, 3);
        targets.forEach((t, i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:1.2}), i*80));
        await _sleep(700);
        targets.forEach(t => _dmg(t, enemy.atk + 1));
        _convert(targets.map(t => ({x:t.x, y:t.y})), 'TERRA');
    };

    // Atabey (AGUA) — mãe das águas, corrompida em afogamento
    H['nacao_atabey_mare'] = async (enemy, skill) => {
        _log(`💧 ${enemy.nome}: ${skill.nome}!`);
        sfx('iara2');
        const c = getBoss();
        const tiles = _linha(c.x, c.y, true);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:500,scale:0.8}), i*25));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk);
        _alive().forEach(p => { if (tiles.some(t=>t.x===p.x&&t.y===p.y)) pushIf(p, p.x < c.x ? -1 : 1, 0, 1); });
        _convert(tiles, 'AGUA');
    };
    H['nacao_atabey_canto'] = async (enemy, skill) => {
        _log(`💧 ${enemy.nome}: ${skill.nome}!`);
        sfx('iara1');
        const c = getBoss();
        _fx('impact','fx-impact',c.x,c.y,{duration:800,scale:2});
        await _sleep(500);
        _dmgGlobal(Math.max(1, Math.floor(enemy.atk / 2)));
        _alive().forEach(p => {
            const dx = Math.sign(c.x - p.x), dy = Math.sign(c.y - p.y);
            for (let i = 0; i < 2; i++) {
                const nx = p.x + dx, ny = p.y + dy;
                if (nx<0||nx>=8||ny<0||ny>=8) break;
                if (nx === c.x && ny === c.y) break;
                if (typeof isOccupied === 'function' && isOccupied(nx, ny, p.id)) break;
                p.x = nx; p.y = ny;
            }
        });
        updateView();
    };

    // Juracán (AR) — senhor dos furacões
    H['nacao_juracan_olho'] = async (enemy, skill) => {
        _log(`🌪️ ${enemy.nome}: ${skill.nome}!`);
        sfx('saci1');
        const c = getBoss();
        for (let r = 1; r <= 2; r++) {
            const tiles = _area(c.x, c.y, r).filter(t => Math.max(Math.abs(t.x-c.x), Math.abs(t.y-c.y)) === r);
            tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:1 - r*0.15}), i*50));
        }
        await _sleep(700);
        _dmgGlobal(Math.max(1, Math.floor(enemy.atk / 2)));
        _alive().forEach(p => {
            const dx = Math.sign(c.x - p.x), dy = Math.sign(c.y - p.y);
            for (let i = 0; i < 3; i++) {
                const nx = p.x + dx, ny = p.y + dy;
                if (nx<0||nx>=8||ny<0||ny>=8) break;
                if (nx === c.x && ny === c.y) break;
                if (typeof isOccupied === 'function' && isOccupied(nx, ny, p.id)) break;
                p.x = nx; p.y = ny;
            }
        });
        updateView();
    };
    H['nacao_juracan_destruicao'] = async (enemy, skill) => {
        _log(`🌪️ ${enemy.nome}: ${skill.nome}!`);
        sfx('saci');
        const nx = Math.floor(Math.random()*6)+1, ny = Math.floor(Math.random()*6)+1;
        if (typeof boss !== 'undefined' && boss) { boss.x = nx; boss.y = ny; }
        updateView();
        await _sleep(300);
        const tiles = _area(nx, ny, 1);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:1.1}), i*40));
        await _sleep(500);
        _dmgEmTiles(tiles, enemy.atk);
        _convert(tiles, 'AR');
    };

    // ════════════════════════ ASTECAS ════════════════════════
    // Quetzalcóatl (AR) — serpente emplumada
    H['nacao_quetzalcoatl_sopro'] = async (enemy, skill) => {
        _log(`🐍 ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa2');
        const c = getBoss();
        const tiles = _diagonal(c.x, c.y, 7);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:500,scale:0.8}), i*30));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk);
        _convert(tiles, 'AR');
    };
    H['nacao_quetzalcoatl_voo'] = async (enemy, skill) => {
        _log(`🐍 ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa1');
        const c = getBoss();
        const target = _nearest(c.x, c.y);
        if (!target) return;
        if (typeof boss !== 'undefined' && boss) {
            boss.x = Math.max(0, Math.min(7, target.x + 1));
            boss.y = Math.max(0, Math.min(7, target.y + 1));
        }
        updateView();
        await _sleep(300);
        const tiles = _area(target.x, target.y, 1);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:1.1}), i*40));
        await _sleep(500);
        _dmgEmTiles(tiles, enemy.atk);
    };

    // Tezcatlipoca (FOGO) — espelho fumegante, deus da noite
    H['nacao_tezcatlipoca_espelho'] = async (enemy, skill) => {
        _log(`🪞 ${enemy.nome}: ${skill.nome}!`);
        sfx('skill1');
        const c = getBoss();
        const tiles = _cruz(c.x, c.y);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:500,scale:0.9}), i*25));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk);
    };
    H['nacao_tezcatlipoca_fumaca'] = async (enemy, skill) => {
        _log(`🪞 ${enemy.nome}: ${skill.nome}!`);
        sfx('skill1');
        const c = getBoss();
        const tiles = _area(c.x, c.y, 2);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:800,scale:1.0}), i*30));
        await _sleep(700);
        _dmgGlobal(Math.max(1, Math.floor(enemy.atk / 2)));
    };

    // Huitzilopochtli (FOGO) — colibri do sul, guerra e sol
    H['nacao_huitzi_guerra'] = async (enemy, skill) => {
        _log(`☀️ ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa1');
        const c = getBoss();
        const tiles = _cruz(c.x, c.y);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:1.2}), i*25));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk + 2);
    };
    H['nacao_huitzi_sol'] = async (enemy, skill) => {
        _log(`☀️ ${enemy.nome}: ${skill.nome}!`);
        sfx('skill1');
        const c = getBoss();
        _fx('impact','fx-impact',c.x,c.y,{duration:1000,scale:3});
        await _sleep(700);
        _dmgGlobal(enemy.atk);
        for (let i = 0; i < 64; i++) {
            if (typeof grid !== 'undefined') grid[i] = 'FOGO';
            const tile = document.querySelectorAll('#grid .tile')[i];
            if (tile) tile.className = 'tile bg-FOGO';
        }
    };

    // ════════════════════════ MAIAS ════════════════════════
    // Kukulkán (AR) — serpente do equinócio
    H['nacao_kukulkan_descida'] = async (enemy, skill) => {
        _log(`🐉 ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa1');
        const c = getBoss();
        const col = _linha(c.x, c.y, false);
        const diag = _diagonal(c.x, c.y, 4);
        const seen = new Set();
        const uniq = col.concat(diag).filter(t => { const k=`${t.x},${t.y}`; if (seen.has(k)) return false; seen.add(k); return true; });
        uniq.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:500,scale:0.9}), i*25));
        await _sleep(700);
        _dmgEmTiles(uniq, enemy.atk);
        _convert(uniq, 'AR');
    };
    H['nacao_kukulkan_sombra'] = async (enemy, skill) => {
        _log(`🐉 ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa2');
        const c = getBoss();
        const tiles = _diagonal(c.x, c.y, 7);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:500,scale:0.8}), i*30));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk);
    };

    // Chaac (AGUA) — machado da chuva, granizo e relâmpago
    H['nacao_chaac_granizo'] = async (enemy, skill) => {
        _log(`⚡ ${enemy.nome}: ${skill.nome}!`);
        sfx('iara2');
        const c = getBoss();
        const tiles = _area(c.x, c.y, 2);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:500,scale:0.7}), i*25));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk);
    };
    H['nacao_chaac_machado'] = async (enemy, skill) => {
        _log(`⚡ ${enemy.nome}: ${skill.nome}!`);
        sfx('skill1');
        const c = getBoss();
        const tiles = _linha(c.x, c.y, false);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:1.2}), i*40));
        await _sleep(700);
        _dmgEmTiles(tiles, enemy.atk + 2);
        _convert(tiles, 'AGUA');
    };

    // Ixchel (AGUA) — tecelã da lua, medicina e arco-íris
    H['nacao_ixchel_tear'] = async (enemy, skill) => {
        _log(`🌙 ${enemy.nome}: ${skill.nome}!`);
        sfx('skill1');
        const c = getBoss();
        const tiles = _area(c.x, c.y, 2);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:700,scale:0.8}), i*30));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk);
    };
    H['nacao_ixchel_veneno'] = async (enemy, skill) => {
        _log(`🌙 ${enemy.nome}: ${skill.nome}!`);
        sfx('iara2');
        const c = getBoss();
        _fx('impact','fx-impact',c.x,c.y,{duration:800,scale:1.5});
        await _sleep(500);
        _dmgGlobal(Math.max(1, Math.floor(enemy.atk / 2)));
        if (typeof boss !== 'undefined' && boss) {
            const cura = 3;
            boss.hp = Math.min(boss.maxHp, boss.hp + cura);
            if (typeof showHealEffect === 'function') showHealEffect(boss.x, boss.y, cura);
            if (typeof updateBossCard === 'function') updateBossCard();
        }
    };

    // ════════════════════════ INCAS ════════════════════════
    // Illapa (AR) — trovão de três nomes
    H['nacao_illapa_raios'] = async (enemy, skill) => {
        _log(`⛈️ ${enemy.nome}: ${skill.nome}!`);
        sfx('skill1');
        const c = getBoss();
        const cols = [c.x - 1, c.x, c.x + 1].filter(x => x >= 0 && x < 8);
        const tiles = [];
        cols.forEach(col => { for (let y = 0; y < 8; y++) tiles.push({x:col, y}); });
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:1.0}), i*20));
        await _sleep(700);
        _dmgEmTiles(tiles, enemy.atk);
        _convert(tiles, 'AR');
    };
    H['nacao_illapa_tempestade'] = async (enemy, skill) => {
        _log(`⛈️ ${enemy.nome}: ${skill.nome}!`);
        sfx('saci');
        const c = getBoss();
        _fx('impact','fx-impact',c.x,c.y,{duration:900,scale:2.5});
        await _sleep(600);
        _dmgGlobal(enemy.atk);
        const pool = ['FOGO','AGUA','TERRA','AR'];
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const nx = c.x + dx, ny = c.y + dy;
                if (nx<0||nx>=8||ny<0||ny>=8) continue;
                const idx = ny*8 + nx;
                const el = pool[Math.floor(Math.random()*4)];
                if (typeof grid !== 'undefined') grid[idx] = el;
                const tile = document.querySelectorAll('#grid .tile')[idx];
                if (tile) tile.className = `tile bg-${el}`;
            }
        }
    };

    // Mama Quilla (AGUA) — mãe da prata, deusa da lua
    H['nacao_mamaquilla_prata'] = async (enemy, skill) => {
        _log(`🌕 ${enemy.nome}: ${skill.nome}!`);
        sfx('iara2');
        const c = getBoss();
        const tiles = _area(c.x, c.y, 2);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:0.9}), i*25));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk);
        _convert(tiles, 'AGUA');
    };
    H['nacao_mamaquilla_eclipse'] = async (enemy, skill) => {
        _log(`🌕 ${enemy.nome}: ${skill.nome}!`);
        sfx('skill1');
        const c = getBoss();
        const tiles = _cruz(c.x, c.y);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:700,scale:1.0}), i*30));
        await _sleep(700);
        _dmgEmTiles(tiles, enemy.atk + 1);
    };

    // Supay (TERRA) — senhor do submundo
    H['nacao_supay_abismo'] = async (enemy, skill) => {
        _log(`💀 ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa1');
        const c = getBoss();
        _fx('impact','fx-impact',c.x,c.y,{duration:900,scale:2});
        await _sleep(500);
        _alive().forEach(p => {
            const dx = Math.sign(c.x - p.x), dy = Math.sign(c.y - p.y);
            for (let i = 0; i < 2; i++) {
                const nx = p.x + dx, ny = p.y + dy;
                if (nx<0||nx>=8||ny<0||ny>=8) break;
                if (nx === c.x && ny === c.y) break;
                if (typeof isOccupied === 'function' && isOccupied(nx, ny, p.id)) break;
                p.x = nx; p.y = ny;
            }
        });
        updateView();
        await _sleep(300);
        _dmgGlobal(enemy.atk);
    };
    H['nacao_supay_terremoto'] = async (enemy, skill) => {
        _log(`💀 ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa2');
        const c = getBoss();
        const tiles = _area(c.x, c.y, 2);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:700,scale:1.0}), i*25));
        await _sleep(700);
        _dmgEmTiles(tiles, enemy.atk);
        _convert(tiles, 'TERRA');
    };

    // ════════════════════════ MAPUCHES ════════════════════════
    // Antü (FOGO) — sol do amanhecer
    H['nacao_antu_amanhecer'] = async (enemy, skill) => {
        _log(`🔆 ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa1');
        const c = getBoss();
        const tiles = _linha(c.x, c.y, true);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:1.0}), i*25));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk);
        _convert(tiles, 'FOGO');
    };
    H['nacao_antu_chuva'] = async (enemy, skill) => {
        _log(`🔆 ${enemy.nome}: ${skill.nome}!`);
        sfx('skill1');
        const c = getBoss();
        const tiles = _area(c.x, c.y, 2);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:0.8}), i*30));
        await _sleep(700);
        _dmgEmTiles(tiles, enemy.atk);
        _convert(tiles, 'FOGO');
    };

    // Pillán (FOGO) — vulcão vivo
    H['nacao_pillan_erupcao'] = async (enemy, skill) => {
        _log(`🌋 ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa2');
        const c = getBoss();
        const tiles = _area(c.x, c.y, 1);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:700,scale:1.3}), i*40));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk + 2);
        _convert(tiles, 'FOGO');
    };
    H['nacao_pillan_cinzas'] = async (enemy, skill) => {
        _log(`🌋 ${enemy.nome}: ${skill.nome}!`);
        sfx('skill1');
        const c = getBoss();
        _fx('impact','fx-impact',c.x,c.y,{duration:1000,scale:2.5});
        await _sleep(700);
        _dmgGlobal(Math.max(1, Math.floor(enemy.atk / 2)));
        for (let i = 0; i < 64; i++) {
            if (typeof grid !== 'undefined') grid[i] = 'FOGO';
            const tile = document.querySelectorAll('#grid .tile')[i];
            if (tile) tile.className = 'tile bg-FOGO';
        }
    };

    // Wekufe (TERRA) — espírito sombrio
    H['nacao_wekufe_enxame'] = async (enemy, skill) => {
        _log(`👻 ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa1');
        const c = getBoss();
        const tiles = _area(c.x, c.y, 2);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:0.8}), i*30));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk);
    };
    H['nacao_wekufe_assombracao'] = async (enemy, skill) => {
        _log(`👻 ${enemy.nome}: ${skill.nome}!`);
        sfx('skill1');
        const c = getBoss();
        const tiles = _area(c.x, c.y, 1);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:800,scale:1.2}), i*40));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk + 1);
    };

    // ════════════════════════ CHIBCHAS ════════════════════════
    // Bochica (TERRA) — civilizador
    H['nacao_bochica_bastao'] = async (enemy, skill) => {
        _log(`🪄 ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa1');
        const c = getBoss();
        const tiles = _linha(c.x, c.y, true);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:1.0}), i*25));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk);
        _alive().forEach(p => { if (tiles.some(t=>t.x===p.x&&t.y===p.y)) pushIf(p, p.x < c.x ? -1 : 1, 0, 2); });
    };
    H['nacao_bochica_julgamento'] = async (enemy, skill) => {
        _log(`🪄 ${enemy.nome}: ${skill.nome}!`);
        sfx('skill1');
        const c = getBoss();
        _fx('impact','fx-impact',c.x,c.y,{duration:900,scale:2});
        await _sleep(600);
        _dmgGlobal(enemy.atk);
        for (let i = 0; i < 64; i++) {
            if (typeof grid !== 'undefined') grid[i] = 'TERRA';
            const tile = document.querySelectorAll('#grid .tile')[i];
            if (tile) tile.className = 'tile bg-TERRA';
        }
    };

    // Bachué (AGUA) — mãe da lagoa
    H['nacao_bachue_aguas'] = async (enemy, skill) => {
        _log(`🌊 ${enemy.nome}: ${skill.nome}!`);
        sfx('iara2');
        const c = getBoss();
        const tiles = _area(c.x, c.y, 2);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:0.9}), i*30));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk);
        _convert(tiles, 'AGUA');
        _alive().forEach(p => {
            if (tiles.some(t=>t.x===p.x&&t.y===p.y)) {
                const dx = Math.sign(c.x - p.x), dy = Math.sign(c.y - p.y);
                pushIf(p, dx, dy, 1);
            }
        });
    };
    H['nacao_bachue_abraco'] = async (enemy, skill) => {
        _log(`🌊 ${enemy.nome}: ${skill.nome}!`);
        sfx('iara1');
        const c = getBoss();
        const target = _nearest(c.x, c.y);
        if (!target) return;
        _fx('impact','fx-impact',target.x,target.y,{duration:900,scale:1.5});
        await _sleep(600);
        _dmg(target, enemy.atk + 2);
    };

    // Chibchacum (TERRA) — sustentador
    H['nacao_chibchacum_tremor'] = async (enemy, skill) => {
        _log(`🏔️ ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa2');
        const c = getBoss();
        const tiles = _cruz(c.x, c.y);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:1.0}), i*25));
        await _sleep(700);
        _dmgEmTiles(tiles, enemy.atk);
        _alive().forEach(p => {
            if (tiles.some(t=>t.x===p.x&&t.y===p.y)) {
                const dx = Math.sign(p.x - c.x), dy = Math.sign(p.y - c.y);
                pushIf(p, dx, dy, 1);
            }
        });
    };
    H['nacao_chibchacum_peso'] = async (enemy, skill) => {
        _log(`🏔️ ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa1');
        const c = getBoss();
        const tiles = _area(c.x, c.y, 2);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:800,scale:1.2}), i*30));
        await _sleep(700);
        _dmgEmTiles(tiles, enemy.atk + 1);
    };

    // ════════════════════════ NAVAJOS ════════════════════════
    // Ma'ii (TERRA) — coiote trapaceiro
    H['nacao_maii_trapaca'] = async (enemy, skill) => {
        _log(`🐺 ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa1');
        const c = getBoss();
        const target = _nearest(c.x, c.y);
        if (!target) return;
        if (typeof boss !== 'undefined' && boss) { boss.x = target.x; boss.y = target.y; }
        updateView();
        await _sleep(300);
        const tiles = _area(target.x, target.y, 1);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:1.2}), i*40));
        await _sleep(500);
        _dmgEmTiles(tiles, enemy.atk + 1);
    };
    H['nacao_maii_uivo'] = async (enemy, skill) => {
        _log(`🐺 ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa2');
        const c = getBoss();
        _fx('impact','fx-impact',c.x,c.y,{duration:800,scale:2});
        await _sleep(500);
        _dmgGlobal(enemy.atk);
    };

    // Na'ashjé'íí (AR) — mulher aranha
    H['nacao_aranha_teia'] = async (enemy, skill) => {
        _log(`🕷️ ${enemy.nome}: ${skill.nome}!`);
        sfx('skill1');
        const c = getBoss();
        const tiles = _area(c.x, c.y, 2);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:700,scale:0.8}), i*30));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk);
    };
    H['nacao_aranha_fios'] = async (enemy, skill) => {
        _log(`🕷️ ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa1');
        const c = getBoss();
        const tiles = _cruz(c.x, c.y);
        tiles.forEach((t,i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:0.9}), i*25));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk);
        _alive().forEach(p => {
            if (tiles.some(t=>t.x===p.x&&t.y===p.y)) {
                const dx = Math.sign(c.x - p.x), dy = Math.sign(c.y - p.y);
                pushIf(p, dx, dy, 1);
            }
        });
    };

    // Hashch'éíí (AR) — rosto do céu, estrelas
    H['nacao_hashchelti_estrelas'] = async (enemy, skill) => {
        _log(`⭐ ${enemy.nome}: ${skill.nome}!`);
        sfx('skill1');
        const c = getBoss();
        const tiles = [];
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(Math.random()*8);
            const y = Math.floor(Math.random()*8);
            if (!tiles.some(t=>t.x===x&&t.y===y)) tiles.push({x, y});
            setTimeout(() => _fx('impact','fx-impact',x,y,{duration:600,scale:1.0}), i*100);
        }
        await _sleep(700);
        _dmgEmTiles(tiles, enemy.atk + 1);
    };
    H['nacao_hashchelti_ceu'] = async (enemy, skill) => {
        _log(`⭐ ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa2');
        const c = getBoss();
        _fx('impact','fx-impact',c.x,c.y,{duration:1000,scale:3});
        await _sleep(700);
        _dmgGlobal(enemy.atk);
        for (let i = 0; i < 64; i++) {
            if (typeof grid !== 'undefined') grid[i] = 'AR';
            const tile = document.querySelectorAll('#grid .tile')[i];
            if (tile) tile.className = 'tile bg-AR';
        }
    };

    // Fallback: ataque básico (nunca é usado se registramos as skills certas)
    H['nacao_default'] = async (enemy, skill) => {
        _log(`👹 ${enemy.nome}: ataque básico!`);
        const c = getBoss();
        _dmgEmTiles(_area(c.x, c.y, 1), enemy.atk);
    };

    console.log('✅ [Sete Nações V2 — Parte 1b] 42 handlers + fallback registrados');
})();
// =================================================================
// nacoes.js — V2.0 — PARTE 2: motor, telas, hooks
// =================================================================
(function seteNacoesMotorV2_2() {
    if (window._seteNacoesMotorV2_2) return;
    window._seteNacoesMotorV2_2 = true;

    const CONFIG = window._nacaoConfig;
    const NACOES = window.NACOES;
    const DEUSES = window.NACAO_DEUSES;
    const ARMAS  = window.NACAO_ARMAS;
    const AMULETOS = window.NACAO_AMULETOS;
    const FRAGMENTOS = window.NACAO_FRAGMENTOS;
    const h = window._nacaoHelpers || {};
    const _sleep = h._sleep || ((ms)=>new Promise(r=>setTimeout(r,ms)));
    const _log = (m)=>{ if (typeof addLog==='function') addLog(m); };

    // ═══════════════════════════════════════════════════════════
    // PROGRESSO POR DIFICULDADE
    // ═══════════════════════════════════════════════════════════
    function _getWeek() {
        if (typeof window.getWeekId === 'function') return window.getWeekId();
        const d = new Date(); const dia = d.getDay();
        d.setDate(d.getDate() - (dia===0?6:dia-1));
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }

    function _garantirProgresso() {
        if (typeof STORY_PROGRESS === 'undefined') return;
        if (!STORY_PROGRESS.nacaoProgressoPorDificuldade) STORY_PROGRESS.nacaoProgressoPorDificuldade = {};
        ['normal','dificil','pesadelo'].forEach(d => {
            if (!STORY_PROGRESS.nacaoProgressoPorDificuldade[d]) {
                STORY_PROGRESS.nacaoProgressoPorDificuldade[d] = {};
            }
        });
        if (!Array.isArray(STORY_PROGRESS.nacaoArmas)) STORY_PROGRESS.nacaoArmas = [];
        if (!Array.isArray(STORY_PROGRESS.nacaoAmuletos)) STORY_PROGRESS.nacaoAmuletos = [];
        if (!Array.isArray(STORY_PROGRESS.nacaoFragmentos)) STORY_PROGRESS.nacaoFragmentos = [];
        if (typeof STORY_PROGRESS.abyaDesbloqueado === 'undefined') STORY_PROGRESS.abyaDesbloqueado = false;
        if (!Array.isArray(STORY_PROGRESS.unlockedHeroesStory)) STORY_PROGRESS.unlockedHeroesStory = ['Tupa','Sume','Caipora'];
    }

    function _getProg(nacaoId, diff) {
        _garantirProgresso();
        const semana = _getWeek();
        const d = STORY_PROGRESS.nacaoProgressoPorDificuldade[diff];
        if (!d[nacaoId] || d[nacaoId].semana !== semana) {
            d[nacaoId] = { fasesConcluidas: [], bossDerrotados: [], semana };
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
        }
        return d[nacaoId];
    }

    function _isFaseConcluida(nacaoId, faseId, diff) {
        return _getProg(nacaoId, diff).fasesConcluidas.includes(faseId);
    }

    function _marcarFaseConcluida(nacaoId, faseId, deusDerrotado, diff) {
        const prog = _getProg(nacaoId, diff);
        if (!prog.fasesConcluidas.includes(faseId)) prog.fasesConcluidas.push(faseId);
        if (deusDerrotado && !prog.bossDerrotados.includes(deusDerrotado)) prog.bossDerrotados.push(deusDerrotado);
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
    }

    function _getNacaoDoDia() {
        const dia = new Date().getDay();
        for (const id in NACOES) if (NACOES[id].diaSemana === dia) return NACOES[id];
        return null;
    }

    function _getNacaoPorDia(dia) {
        for (const id in NACOES) if (NACOES[id].diaSemana === dia) return NACOES[id];
        return null;
    }

    function _diasRestantes() {
        const hoje = new Date(); const dia = hoje.getDay();
        const dias = (dia === 1 ? 7 : (8 - dia) % 7) || 7;
        return `${dias} dia${dias>1?'s':''}`;
    }

    // ═══════════════════════════════════════════════════════════
    // PESADELO MENSAL
    // ═══════════════════════════════════════════════════════════
    function _getDiaPesadelo() {
        const d = new Date();
        const seed = (d.getDate()*31 + (d.getMonth()+1)*7 + d.getFullYear()) % 7;
        return seed;
    }
    function _pesadeloDisponivelHoje() {
        return new Date().getDay() === _getDiaPesadelo();
    }

    // ═══════════════════════════════════════════════════════════
    // DIFICULDADE
    // ═══════════════════════════════════════════════════════════
    function _getDif() {
        if (typeof storyCurrentDifficulty !== 'undefined') return storyCurrentDifficulty;
        return STORY_PROGRESS?.difficulty || 'normal';
    }

    // ═══════════════════════════════════════════════════════════
    // ENTRAR EM UMA NAÇÃO (validação de dia)
    // ═══════════════════════════════════════════════════════════
    function _entrarNaNacao(nacaoId) {
        const n = NACOES[nacaoId];
        if (!n) return;
        if (n.diaSemana !== new Date().getDay()) {
            if (typeof showToast === 'function') showToast('🔒', 'Esta nação não está disponível hoje.', '🔒');
            return;
        }
        window._nacaoAtual = nacaoId;
        renderFasesNacao(nacaoId);
    }
    window._nacaoEntrar = _entrarNaNacao;

    // ═══════════════════════════════════════════════════════════
    // INICIAR FASE (reaproveita eventoIniciarBatalha)
    // ═══════════════════════════════════════════════════════════
    async function _iniciarFaseNacao(nacaoId, faseId) {
        const n = NACOES[nacaoId];
        if (!n) return;
        if (window._nacaoBatalha?.ativa) return;

        const diff = _getDif();
        const custo = CONFIG.custoEntrada[diff];
        const gold = STORY_PROGRESS.gold || 0;
        if (gold < custo) {
            if (typeof showToast === 'function') showToast('💰', `Precisa ${custo} de ouro.`, '💰');
            return;
        }
        STORY_PROGRESS.gold -= custo;
        if (typeof saveStoryProgress === 'function') saveStoryProgress();

        const idx = parseInt(faseId) - 1;
        const fila = n.deuses.slice(0, idx + 1);

        window._nacaoBatalha = {
            ativa: true, nacaoId, faseId, dificuldade: diff,
            isNacao: true, isFinal: faseId === '3',
        };

        // Delega para o motor do Sete Selados (eventoIniciarBatalha)
        // usando o ID da nação como "bossId"
        if (typeof window.eventoIniciarBatalha === 'function') {
            try {
                await window.eventoIniciarBatalha('nacao_' + nacaoId, faseId);
            } catch (e) {
                console.error('[nacoes] erro em eventoIniciarBatalha:', e);
            }
        } else {
            console.error('[nacoes] eventoIniciarBatalha não disponível (historia.js não carregado?)');
        }
    }
    window._nacaoIniciarFase = _iniciarFaseNacao;

    async function _iniciarPesadelo() {
        if (!_pesadeloDisponivelHoje()) {
            if (typeof showToast === 'function') showToast('🌑', 'O Pesadelo não está ativo hoje.', '🌑');
            return;
        }
        const diff = _getDif();
        const custo = CONFIG.custoPesadelo[diff];
        const gold = STORY_PROGRESS.gold || 0;
        if (gold < custo) {
            if (typeof showToast === 'function') showToast('💰', `Precisa ${custo} de ouro.`, '💰');
            return;
        }
        if (!confirm(`🌑 ENFRENTAR O PESADELO?\n\nCusto: ${custo} ouro. 7 deuses finais em sequência.\n\nContinuar?`)) return;

        STORY_PROGRESS.gold -= custo;
        if (typeof saveStoryProgress === 'function') saveStoryProgress();

        window._nacaoBatalha = {
            ativa: true, nacaoId: 'pesadelo', faseId: 'pesadelo',
            dificuldade: diff, isNacao: true, isPesadeloNacao: true, isFinal: true,
        };

        if (typeof window.eventoIniciarBatalha === 'function') {
            try {
                await window.eventoIniciarBatalha('nacao_pesadelo', 'boss');
            } catch (e) { console.error('[nacoes] erro em eventoIniciarBatalha:', e); }
        }
    }
    window._nacaoIniciarPesadelo = _iniciarPesadelo;

    // ═══════════════════════════════════════════════════════════
    // HOOKS NO MOTOR DO SETE SELADOS
    // ═══════════════════════════════════════════════════════════

    // --- 1. Ativar flag _nacaoAtivo e _eventoAtivo quando iniciar ---
    const _origEventoIniciar = window.eventoIniciarBatalha;
    if (typeof _origEventoIniciar === 'function') {
        window.eventoIniciarBatalha = async function(bossId, faseId) {
            const isNacao = typeof bossId === 'string' && bossId.startsWith('nacao_');
            if (isNacao) {
                window._nacaoAtivo = true;
                window._eventoAtivo = true;
            }
            const r = await _origEventoIniciar.apply(this, arguments);
            return r;
        };
    }

    // --- 2. Sincronizar skills do enemy atual antes do boss AI ---
    const _origBossAI = window.eventoBossAI;
    if (typeof _origBossAI === 'function') {
        window.eventoBossAI = async function() {
            if (!window._nacaoAtivo) return _origBossAI.apply(this, arguments);

            // Sinc skills
            const nacaoId = window._nacaoBatalha?.nacaoId;
            const nacaoCfgId = 'nacao_' + nacaoId;
            const cfg = (typeof EVENTO_BOSSES !== 'undefined') ? EVENTO_BOSSES[nacaoCfgId] : null;
            if (cfg) {
                const enemyId = Array.isArray(window.storyEnemiesRemaining) && window.storyEnemiesRemaining[0];
                const enemy = enemyId && STORY_ENEMIES?.[enemyId];
                if (enemy && enemy.skill1 && enemy.skill2) {
                    cfg.skills = [enemy.skill1, enemy.skill2];
                }
            }
            return _origBossAI.apply(this, arguments);
        };
    }

    // --- 3. Usar NACAO_SKILL_HANDLERS em eventoAplicarSkill ---
    const _origApply = window.eventoAplicarSkill;
    if (typeof _origApply === 'function') {
        window.eventoAplicarSkill = async function(enemy, skill) {
            if (window._nacaoAtivo && skill && skill.handler) {
                const handler = window.NACAO_SKILL_HANDLERS?.[skill.handler];
                if (typeof handler === 'function') {
                    try { return await handler(enemy, skill); }
                    catch (e) { console.warn('[nacoes] handler erro:', e); return; }
                }
            }
            return _origApply.apply(this, arguments);
        };
    }

    // --- 4. Drops ao derrotar boss (fase 3 ou pesadelo) ---
    const _origDefeat = window.handleStoryBossDefeat;
    if (typeof _origDefeat === 'function') {
        window.handleStoryBossDefeat = async function() {
            if (!window._nacaoAtivo) return _origDefeat.apply(this, arguments);

            const enemyId = Array.isArray(window.storyEnemiesRemaining) && window.storyEnemiesRemaining[0];
            const b = window._nacaoBatalha || {};
            const nacaoId = b.nacaoId;
            const faseId = b.faseId;
            const diff = b.dificuldade || _getDif();

            // ⭐ Essências sempre (base × fase × diff)
            const essBase = { '1': 3, '2': 6, '3': 12 }[faseId] || 3;
            const essMult = { normal: 1.0, dificil: 1.5, pesadelo: 2.2 }[diff] || 1;
            const ess = Math.floor(essBase * essMult);
            STORY_PROGRESS.inventory[CONFIG.moedaId] =
                (STORY_PROGRESS.inventory[CONFIG.moedaId] || 0) + ess;
            _log(`🌎 +${ess} Essências Ancestrais`);

            // ⭐ Fase 3 ou Pesadelo: drop de arma/fragmento/amuleto
            const isDropFase = (faseId === '3') || b.isPesadeloNacao;

            if (isDropFase) {
                // Arma
                const chArma = b.isPesadeloNacao ? CONFIG.dropPesadeloArma : (CONFIG.dropArma[diff] || 0.10);
                if (Math.random() < chArma) {
                    const armasN = Object.values(ARMAS).filter(a => a.boss === 'nacao_' + nacaoId);
                    if (armasN.length > 0) {
                        const arma = armasN[Math.floor(Math.random() * armasN.length)];
                        if (!Array.isArray(STORY_PROGRESS.nacaoArmas)) STORY_PROGRESS.nacaoArmas = [];
                        STORY_PROGRESS.nacaoArmas.push(arma.id);
                        _log(`⚔️ Arma dropada: ${arma.nome}!`);
                        if (typeof showToast === 'function') showToast('⚔️', `Arma: ${arma.nome}`, '⚔️');
                    }
                } else if (b.isPesadeloNacao) {
                    // Pesadelo: chance de arma de QUALQUER nação
                    const todasArmas = Object.values(ARMAS);
                    if (Math.random() < 0.20 && todasArmas.length > 0) {
                        const arma = todasArmas[Math.floor(Math.random() * todasArmas.length)];
                        if (!Array.isArray(STORY_PROGRESS.nacaoArmas)) STORY_PROGRESS.nacaoArmas = [];
                        STORY_PROGRESS.nacaoArmas.push(arma.id);
                        _log(`⚔️ Arma (Pesadelo): ${arma.nome}!`);
                    }
                }

                // Fragmento
                const chFrag = b.isPesadeloNacao ? CONFIG.dropPesadeloFragmento : (CONFIG.dropFragmento[diff] || 0.10);
                if (Math.random() < chFrag && nacaoId !== 'pesadelo') {
                    const frag = 'fragmento_nacao_' + nacaoId;
                    if (!STORY_PROGRESS.nacaoFragmentos.includes(frag)) {
                        STORY_PROGRESS.nacaoFragmentos.push(frag);
                        _log(`🌎 FRAGMENTO ANCESTRAL dropado!`);
                        if (typeof showToast === 'function') showToast('🌎', `Fragmento: ${nacaoId}`, '🌎');
                        // Desbloqueio do Abya
                        if (STORY_PROGRESS.nacaoFragmentos.length >= 7 && !STORY_PROGRESS.abyaDesbloqueado) {
                            STORY_PROGRESS.abyaDesbloqueado = true;
                            if (!STORY_PROGRESS.unlockedHeroesStory.includes('Abya')) {
                                STORY_PROGRESS.unlockedHeroesStory.push('Abya');
                            }
                            _log(`🌟 ABYA DESPERTOU!`);
                            if (typeof showToast === 'function') showToast('🌟', 'ABYA DESPERTOU!', '🌟');
                        }
                    }
                }

                // Amuleto
                const chAmu = b.isPesadeloNacao ? CONFIG.dropPesadeloAmuleto : (CONFIG.dropAmuleto[diff] || 0.10);
                if (Math.random() < chAmu && nacaoId !== 'pesadelo') {
                    const amuId = 'amuleto_nacao_' + nacaoId;
                    if (!STORY_PROGRESS.nacaoAmuletos.includes(amuId)) {
                        STORY_PROGRESS.nacaoAmuletos.push(amuId);
                        _log(`🧿 AMULETO dropado: ${AMULETOS[amuId]?.nome || amuId}!`);
                        if (typeof showToast === 'function') showToast('🧿', `Amuleto: ${AMULETOS[amuId]?.nome || amuId}`, '🧿');
                    }
                }
            }

            if (typeof saveStoryProgress === 'function') saveStoryProgress();

            // Chama o original
            return _origDefeat.apply(this, arguments);
        };
    }

    // --- 5. Marcar fase concluída ao vencer a FILA inteira ---
    const _origFinish = window.finishStoryPhase;
    if (typeof _origFinish === 'function') {
        window.finishStoryPhase = function(victory) {
            if (!window._nacaoAtivo) return _origFinish.apply(this, arguments);

            const b = window._nacaoBatalha || {};
            if (victory && b.nacaoId && b.faseId && b.nacaoId !== 'pesadelo') {
                _marcarFaseConcluida(b.nacaoId, b.faseId, null, b.dificuldade || _getDif());
            }

            window._nacaoAtivo = false;
            window._eventoAtivo = false;
            window._nacaoBatalha = { ativa: false };

            return _origFinish.apply(this, arguments);
        };
    }

    // --- 6. Ao trocar de inimigo na fila, garantir skills sync (redundância) ---
    const _origAdvance = window.advanceStoryEnemy;
    if (typeof _origAdvance === 'function') {
        window.advanceStoryEnemy = async function() {
            const r = await _origAdvance.apply(this, arguments);
            if (!window._nacaoAtivo) return r;
            const nacaoId = window._nacaoBatalha?.nacaoId;
            const cfg = nacaoId && (typeof EVENTO_BOSSES !== 'undefined') ? EVENTO_BOSSES['nacao_' + nacaoId] : null;
            if (cfg) {
                const enemyId = Array.isArray(window.storyEnemiesRemaining) && window.storyEnemiesRemaining[0];
                const enemy = enemyId && STORY_ENEMIES?.[enemyId];
                if (enemy && enemy.skill1 && enemy.skill2) cfg.skills = [enemy.skill1, enemy.skill2];
            }
            return r;
        };
    }

    // ═══════════════════════════════════════════════════════════
    // TELAS
    // ═══════════════════════════════════════════════════════════
    function _icon(key, size) {
        const url = (typeof SPRITES_STORY !== 'undefined') ? SPRITES_STORY[key] : '';
        const emoji = window.NACAO_EMOJIS?.[key] || '❓';
        if (url && String(url).trim() !== '') {
            const cls = size === 'large' ? 'nacao-icon nacao-icon-lg' : 'nacao-icon';
            return `<img src="${url}" class="${cls}" alt="${key}" onerror="this.outerHTML='${emoji}'">`;
        }
        return `<span class="nacao-emoji ${size==='large'?'nacao-emoji-lg':''}">${emoji}</span>`;
    }
    window.nacaoIcon = _icon;

    // --- Tela principal: SETE NAÇÕES ---
    function renderSeteNacoesScreen() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;
        _garantirProgresso();

        const gold = STORY_PROGRESS.gold || 0;
        const essencias = STORY_PROGRESS.inventory[CONFIG.moedaId] || 0;
        const fragmentos = STORY_PROGRESS.nacaoFragmentos || [];
        const diff = _getDif();
        const diaHoje = new Date().getDay();
        const ordem = [1,2,3,4,5,6,0];
        const diasLabel = { 0:'Domingo', 1:'Segunda', 2:'Terça', 3:'Quarta', 4:'Quinta', 5:'Sexta', 6:'Sábado' };
        const pesHoje = _pesadeloDisponivelHoje();

        let cardsHTML = '';
        ordem.forEach(dia => {
            const n = _getNacaoPorDia(dia);
            if (!n) return;
            const isHoje = dia === diaHoje;
            const prog = _getProg(n.id, diff);
            const feitas = prog.fasesConcluidas.length;
            const completo = feitas >= 3;
            const temFrag = fragmentos.includes('fragmento_nacao_' + n.id);

            let badge = '';
            if (completo) badge = '<span class="nacao-badge concluido">✅ CONCLUÍDO</span>';
            else if (isHoje) badge = '<span class="nacao-badge hoje">🎯 HOJE</span>';
            else if (dia < diaHoje || (dia === 0 && diaHoje > 0)) badge = '<span class="nacao-badge perdido">⏰ PERDIDO</span>';
            else badge = '<span class="nacao-badge futuro">🔒 EM BREVE</span>';

            cardsHTML += `
                <div class="nacao-card ${isHoje?'hoje':''} ${completo?'completo':''}" style="--nacao-cor:${n.corFundo};">
                    <div class="nacao-card-header">
                        <span class="nacao-dia">${diasLabel[dia]}</span>
                        ${badge}
                    </div>
                    <div class="nacao-card-sprite">${_icon('nacao_' + n.deuses[0].replace('nacao_',''), 'large')}</div>
                    <div class="nacao-card-titulo">${n.titulo}</div>
                    <div class="nacao-card-nome">${n.nome}</div>
                    <div class="nacao-card-stats"><span>${feitas}/3 fases</span><span>${temFrag ? '🌎' : '—'}</span></div>
                    <div class="nacao-card-elem">${n.elemento}</div>
                    <button class="nacao-card-btn" ${isHoje && !completo ? '' : 'disabled'}
                            onclick="window._nacaoEntrar('${n.id}')">
                        ${completo ? '✔ CONCLUÍDO' : (isHoje ? '▶ ENTRAR' : '🔒 BLOQUEADO')}
                    </button>
                </div>
            `;
        });

        const fragsHTML = Object.keys(FRAGMENTOS).map(fid => {
            const tem = fragmentos.includes(fid);
            return `<span class="nacao-fragmento ${tem?'tem':'nao-tem'}" title="${FRAGMENTOS[fid].nome}">
                ${tem ? _icon(fid,'small') : '❓'}
            </span>`;
        }).join('');

        const pesHTML = pesHoje ? `
            <div class="nacao-pesadelo-banner">
                <div class="nacao-pesadelo-icon">${_icon('nacao_hashchelti','large')}</div>
                <div class="nacao-pesadelo-info">
                    <div class="nacao-pesadelo-titulo">🌑 PESADELO DAS NAÇÕES (MENSAL)</div>
                    <div class="nacao-pesadelo-sub">Os sete deuses finais despertaram hoje!</div>
                    <div class="nacao-pesadelo-desc">Custo: ${CONFIG.custoPesadelo[diff]} ouro. Chances altas de drop.</div>
                </div>
                <button class="nacao-pesadelo-btn" onclick="window._nacaoIniciarPesadelo()">⚔️ ENFRENTAR</button>
            </div>
        ` : `
            <div class="nacao-pesadelo-aviso">
                🌑 O Pesadelo das Nações aparecerá em <b>${diasLabel[_getDiaPesadelo()]}</b> deste mês.
            </div>
        `;

        screen.innerHTML = `
            <div class="story-container">
                <div class="story-header">
                    <h1 class="story-title">🌎 AS SETE NAÇÕES</h1>
                    <p class="story-subtitle">Sete povos, sete panteões. Anhangá transbordou para além da mata.</p>
                    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:14px;">
                        <span class="nacao-essencias-badge">${_icon('essencia_ancestral','small')} ${essencias} Essências</span>
                        <span class="nacao-ouro-badge">💰 ${gold} ouro</span>
                    </div>
                    <div style="text-align:center;margin-top:10px;font-size:.8rem;color:#8a7a52;font-style:italic;">
                        🔄 Reseta toda segunda-feira. Progresso expira em ${_diasRestantes()}
                    </div>
                </div>

                <div class="nacao-lore-box">
                    Após purificar Anhangá no <b>Ato 13</b>, o equilíbrio foi restaurado. Mas o Sussurrador teceu <b>fios de corrupção</b> por todos os povos ancestrais das Américas.
                    <br><br>
                    Os panteões de <b>sete nações pré-colombianas</b> agora rugem em sofrimento. Não são invasores — são irmãos dos espíritos brasileiros, ligados pela mesma terra primordial.
                    <br><br>
                    Cada nação tem <b>3 divindades</b>. Vença a primeira (Fase 1), depois duas (Fase 2), depois as três (Fase 3). Colete o <b>Fragmento</b> de cada nação para despertar <b>Abya</b>, o Filho das Sete.
                </div>

                ${pesHTML}

                <div class="nacao-grid">${cardsHTML}</div>

                <div class="nacao-progresso-fragmentos">
                    <div class="nacao-fragmentos-titulo">🌎 FRAGMENTOS ANCESTRAIS</div>
                    <div class="nacao-fragmentos-lista">${fragsHTML}</div>
                    <div class="nacao-fragmentos-info">
                        ${STORY_PROGRESS.abyaDesbloqueado
                            ? '🎉 <b>Abya</b> foi desbloqueado!'
                            : `Reúna os 7 Fragmentos para desbloquear <b>Abya</b>.`}
                    </div>
                </div>

                <div class="story-footer">
                    <button class="story-back-btn" onclick="window.renderLojaNacoes()">🛒 LOJA DAS NAÇÕES</button>
                    <button class="story-back-btn" onclick="window._semanaTab='selados'; window.renderEventoSemanalScreen();">← SETE SELADOS</button>
                    <button class="story-back-btn" onclick="renderAldeiaScreen()">← ALDEIA</button>
                </div>
            </div>
        `;
        screen.classList.add('active');
        screen.style.display = 'flex';
    }
    window.renderSeteNacoesScreen = renderSeteNacoesScreen;

    // --- Tela de fases da nação ---
    function renderFasesNacao(nacaoId) {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;
        const n = NACOES[nacaoId];
        if (!n) return;
        window._nacaoAtual = nacaoId;

        const prog = _getProg(nacaoId, _getDif());
        const deuses = n.deuses.map(id => DEUSES[id]);
        const diff = _getDif();
        const custo = CONFIG.custoEntrada[diff];

        const fasesInfo = [
            { id:'1', deuses:[deuses[0]], label:'Fase 1' },
            { id:'2', deuses:[deuses[0],deuses[1]], label:'Fase 2' },
            { id:'3', deuses:[deuses[0],deuses[1],deuses[2]], label:'Fase 3', final:true },
        ];

        let cardsHTML = '';
        fasesInfo.forEach((fase, idx) => {
            const concluida = prog.fasesConcluidas.includes(fase.id);
            const liberada = idx === 0 || prog.fasesConcluidas.includes(fasesInfo[idx-1].id);

            let statusClass='', statusIcon='', btnLabel='', btnDisabled=false;
            if (concluida) { statusClass='completa'; statusIcon='✅'; btnLabel=`↻ REJOGAR (${custo}💰)`; }
            else if (liberada) { statusClass='liberada'; statusIcon='🎯'; btnLabel=`▶ JOGAR (${custo}💰)`; }
            else { statusClass='bloqueada'; statusIcon='🔒'; btnLabel='🔒 BLOQUEADA'; btnDisabled=true; }

            const deusesHTML = fase.deuses.map(d => `<span class="nacao-fase-deus">${_icon(d.id,'normal')}</span>`).join('');

            cardsHTML += `
                <div class="nacao-fase-card ${statusClass}">
                    <div class="nacao-fase-header">
                        <span class="nacao-fase-num">${fase.label.toUpperCase()}</span>
                        <span class="nacao-fase-status">${statusIcon}</span>
                    </div>
                    <div class="nacao-fase-deuses">${deusesHTML}</div>
                    <div class="nacao-fase-nomes">${fase.deuses.map(d=>d.nome).join(' + ')}</div>
                    ${fase.final ? `<div class="nacao-fase-frag">🌎 Drop: Fragmento / Amuleto / Arma</div>` : ''}
                    <button class="nacao-fase-btn" ${btnDisabled?'disabled':''}
                            onclick="window._nacaoIniciarFase('${nacaoId}', '${fase.id}')">
                        ${btnLabel}
                    </button>
                </div>
            `;
        });

        const diffsHTML = ['normal','dificil','pesadelo'].map(d => `
            <button class="nacao-diff-btn ${d===diff?'active':''}"
                    style="--diff-cor:${window.DIFF_COR?.[d] || '#c9a227'};"
                    onclick="window._nacaoSelDiff('${d}')">
                ${window.DIFF_LABEL?.[d] || d}
            </button>
        `).join('');

        screen.innerHTML = `
            <div class="story-container">
                <div class="story-header">
                    <h1 class="story-title">${n.nome}</h1>
                    <p class="story-subtitle">${n.titulo}</p>
                    <div class="nacao-boss-descricao">${n.descricao}</div>
                </div>
                <div class="nacao-lore-box" style="font-size:.95rem;">${n.lore}</div>

                <div class="nacao-diff-selector">
                    <div class="nacao-diff-label">DIFICULDADE</div>
                    <div class="nacao-diff-buttons">${diffsHTML}</div>
                    <div class="nacao-diff-info">Custo: <b>${custo} 💰</b></div>
                </div>

                <div class="nacao-fases-grid">${cardsHTML}</div>

                <div class="story-footer">
                    <button class="story-back-btn" onclick="window.renderSeteNacoesScreen()">← VOLTAR ÀS NAÇÕES</button>
                </div>
            </div>
        `;
        screen.classList.add('active');
        screen.style.display = 'flex';
    }
    window.renderFasesNacao = renderFasesNacao;

    window._nacaoSelDiff = function(d) {
        if (typeof setStoryDifficulty === 'function') {
            setStoryDifficulty(d);
        } else {
            STORY_PROGRESS.difficulty = d;
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
        }
        if (window._nacaoAtual) renderFasesNacao(window._nacaoAtual);
    };

    // ═══════════════════════════════════════════════════════════
    // LOJA DAS NAÇÕES (simples — usa armas que dropam)
    // ═══════════════════════════════════════════════════════════
    function renderLojaNacoes() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;
        const ess = STORY_PROGRESS.inventory[CONFIG.moedaId] || 0;

        const armasHTML = Object.values(ARMAS).map(a => {
            const jaTem = (STORY_PROGRESS.nacaoArmas || []).includes(a.id);
            const preco = 80;
            const pode = ess >= preco && !jaTem;
            return `
                <div class="nacao-shop-card ${jaTem?'owned':''}">
                    <div class="nacao-shop-icon">${a.emoji || '⚔️'}</div>
                    <div class="nacao-shop-name">${a.nome}</div>
                    <div class="nacao-shop-meta">+${a.atkBonus} ATK · ${a.elemento}</div>
                    <div class="nacao-shop-price">🌎 ${preco}</div>
                    <button class="nacao-shop-btn" ${pode?'':'disabled'}
                            onclick="window._nacaoComprarArma('${a.id}')">
                        ${jaTem?'✅ ADQUIRIDA':(pode?'COMPRAR':'FALTA')}
                    </button>
                </div>`;
        }).join('');

        screen.innerHTML = `
            <div class="story-container">
                <div class="story-header">
                    <h1 class="story-title">🌎 LOJA DAS NAÇÕES</h1>
                    <div style="margin-top:15px;font-family:'Cinzel',serif;font-size:1.1rem;">
                        Saldo: <b style="color:#e8b923;">${ess} Essências Ancestrais</b>
                    </div>
                </div>
                <div class="nacao-shop-grid">${armasHTML}</div>
                <div class="story-footer">
                    <button class="story-back-btn" onclick="window.renderSeteNacoesScreen()">← VOLTAR</button>
                </div>
            </div>
        `;
        screen.classList.add('active');
        screen.style.display = 'flex';
    }
    window.renderLojaNacoes = renderLojaNacoes;

    window._nacaoComprarArma = function(id) {
        const a = ARMAS[id]; if (!a) return;
        if ((STORY_PROGRESS.nacaoArmas || []).includes(id)) return;
        const ess = STORY_PROGRESS.inventory[CONFIG.moedaId] || 0;
        if (ess < 80) return;
        STORY_PROGRESS.inventory[CONFIG.moedaId] -= 80;
        if (!Array.isArray(STORY_PROGRESS.nacaoArmas)) STORY_PROGRESS.nacaoArmas = [];
        STORY_PROGRESS.nacaoArmas.push(id);
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        if (typeof showToast === 'function') showToast('🌎', `Arma: ${a.nome}`, '🌎');
        renderLojaNacoes();
    };

    // ═══════════════════════════════════════════════════════════
    // HABILITAR O BOTÃO NA ALDEIA (abaixo do card existente)
    // ═══════════════════════════════════════════════════════════
    // Já existe o botão no evento semanal. Basta garantir que ele chame
    // renderSeteNacoesScreen quando clicado.

    // ═══════════════════════════════════════════════════════════
    // CSS
    // ═══════════════════════════════════════════════════════════
    if (!document.getElementById('nacoesV2CSS')) {
        const st = document.createElement('style');
        st.id = 'nacoesV2CSS';
        st.textContent = `
            .nacao-icon { width:1em; height:1em; object-fit:contain; vertical-align:-0.15em; display:inline-block; }
            .nacao-icon-lg { width:2.5em; height:2.5em; }
            .nacao-emoji { display:inline-block; line-height:1; }
            .nacao-emoji-lg { font-size:2.5em; }
            .nacao-badge { padding:3px 10px; border-radius:12px; font-family:'Cinzel',serif; font-size:.7rem; font-weight:700; letter-spacing:1px; }
            .nacao-badge.hoje { background:rgba(107,163,92,.2); border:1px solid #6ba35c; color:#8ac070; }
            .nacao-badge.concluido { background:rgba(107,163,92,.15); border:1px solid #4a7040; color:#6ba35c; }
            .nacao-badge.perdido { background:rgba(168,50,50,.15); border:1px solid #a83232; color:#d05050; }
            .nacao-badge.futuro { background:rgba(138,122,82,.15); border:1px solid #8a7a52; color:#b8a577; }
            .nacao-essencias-badge, .nacao-ouro-badge { padding:8px 16px; background:rgba(10,6,2,.6); border:1px solid rgba(201,162,39,.4); border-radius:20px; font-family:'Cinzel',serif; font-weight:700; font-size:.9rem; color:#e8b923; }
            .nacao-lore-box { padding:20px 24px; margin-bottom:24px; background:rgba(10,6,2,.5); border-left:4px solid #4a8cb5; border-radius:6px; font-family:'EB Garamond',serif; color:#d9c89a; font-size:1rem; line-height:1.6; font-style:italic; }
            .nacao-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:16px; margin-bottom:30px; }
            .nacao-card { position:relative; background:linear-gradient(180deg,rgba(201,162,39,.05),transparent 40%),linear-gradient(180deg,rgba(42,31,16,.95),rgba(26,18,8,.95)); border:2px solid #3d2d18; border-radius:10px; padding:16px 14px; display:flex; flex-direction:column; gap:8px; overflow:hidden; }
            .nacao-card::before { content:''; position:absolute; top:0; left:0; right:0; height:4px; background:var(--nacao-cor,#4a8cb5); box-shadow:0 0 12px var(--nacao-cor,#4a8cb5); }
            .nacao-card.hoje { border-color:#4a8cb5; box-shadow:0 0 20px rgba(74,140,181,.4); }
            .nacao-card.completo { opacity:.7; }
            .nacao-card-header { display:flex; justify-content:space-between; align-items:center; }
            .nacao-dia { font-family:'Cinzel',serif; color:#4a8cb5; font-size:.8rem; letter-spacing:2px; font-weight:700; }
            .nacao-card-sprite { text-align:center; padding:8px 0; line-height:1; }
            .nacao-card-titulo { font-family:'EB Garamond',serif; color:#b8a577; font-size:.85rem; font-style:italic; text-align:center; margin-top:-4px; }
            .nacao-card-nome { font-family:'Cinzel Decorative',serif; color:#f0e2c0; font-size:1.2rem; letter-spacing:1px; text-align:center; }
            .nacao-card-stats { display:flex; justify-content:space-around; padding:6px 0; border-top:1px solid rgba(201,162,39,.15); border-bottom:1px solid rgba(201,162,39,.15); font-family:'Cinzel',serif; font-size:.8rem; color:#d9c89a; }
            .nacao-card-elem { text-align:center; font-family:'Cinzel',serif; font-size:.75rem; letter-spacing:1.5px; color:#4a8cb5; }
            .nacao-card-btn { margin-top:auto; padding:10px; background:linear-gradient(180deg,rgba(232,185,35,.2),transparent 45%),linear-gradient(135deg,#8a6a2e,#4a3418); color:#fff5dc; border:2px solid #e8b923; border-radius:5px; cursor:pointer; font-family:'Cinzel',serif; font-weight:700; font-size:.85rem; letter-spacing:1.5px; }
            .nacao-card-btn:hover:not(:disabled){ transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,.5),0 0 20px rgba(232,185,35,.4); }
            .nacao-card-btn:disabled{ background:#2a1f10; color:#6a5024; border-color:#3d2d18; cursor:not-allowed; }
            .nacao-progresso-fragmentos{ background:rgba(10,6,2,.5); border:1px solid rgba(74,140,181,.3); border-radius:8px; padding:16px 20px; margin-bottom:24px; text-align:center; }
            .nacao-fragmentos-titulo{ font-family:'Cinzel',serif; color:#4a8cb5; font-size:.9rem; letter-spacing:2px; margin-bottom:12px; }
            .nacao-fragmentos-lista{ display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-bottom:10px; }
            .nacao-fragmento{ width:40px; height:40px; display:inline-flex; align-items:center; justify-content:center; border-radius:50%; font-size:1.4rem; border:2px solid #3d2d18; background:rgba(10,6,2,.7); }
            .nacao-fragmento.tem{ border-color:#4a8cb5; background:rgba(74,140,181,.2); box-shadow:0 0 15px rgba(74,140,181,.5); }
            .nacao-fragmento.nao-tem{ opacity:.4; }
            .nacao-fragmentos-info{ font-family:'EB Garamond',serif; color:#b8a577; font-size:.9rem; font-style:italic; }
            .nacao-boss-descricao{ font-family:'EB Garamond',serif; color:#d9c89a; font-size:1rem; font-style:italic; text-align:center; max-width:600px; margin:10px auto 0; }
            .nacao-diff-selector{ margin-bottom:20px; padding:14px 18px; background:rgba(10,6,2,.5); border:1px solid rgba(201,162,39,.3); border-radius:6px; }
            .nacao-diff-label{ font-family:'Cinzel',serif; font-size:.75rem; color:#8a7a52; letter-spacing:2px; text-align:center; margin-bottom:10px; }
            .nacao-diff-buttons{ display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-bottom:10px; }
            .nacao-diff-btn{ padding:8px 18px; background:linear-gradient(135deg,#2a1f10,#1a1208); color:#c8b787; border:2px solid rgba(201,162,39,.3); border-radius:6px; cursor:pointer; font-family:'Cinzel',serif; font-weight:700; font-size:.85rem; letter-spacing:1px; }
            .nacao-diff-btn.active{ background:linear-gradient(180deg,rgba(232,185,35,.15),transparent 50%),linear-gradient(135deg,#3d2d18,#2a1f10); border-color:var(--diff-cor,#c9a227); border-width:3px; color:#fff5dc; }
            .nacao-diff-info{ text-align:center; font-family:'EB Garamond',serif; font-size:.85rem; color:#b8a577; font-style:italic; }
            .nacao-fases-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:16px; margin-bottom:24px; }
            .nacao-fase-card{ background:linear-gradient(180deg,rgba(201,162,39,.04),transparent 40%),linear-gradient(180deg,rgba(42,31,16,.85),rgba(26,18,8,.85)); border:2px solid #3d2d18; border-radius:8px; padding:16px; display:flex; flex-direction:column; gap:10px; }
            .nacao-fase-card.completa{ border-color:#4a7040; }
            .nacao-fase-card.liberada{ border-color:#4a8cb5; }
            .nacao-fase-card.bloqueada{ opacity:.5; }
            .nacao-fase-header{ display:flex; justify-content:space-between; align-items:center; }
            .nacao-fase-num{ font-family:'Cinzel',serif; color:#4a8cb5; font-size:.85rem; letter-spacing:1.5px; font-weight:700; }
            .nacao-fase-status{ font-size:1.1rem; }
            .nacao-fase-deuses{ display:flex; justify-content:center; gap:8px; padding:10px 0; }
            .nacao-fase-deus{ font-size:2rem; }
            .nacao-fase-nomes{ font-family:'Cinzel',serif; color:#f0e2c0; font-size:.9rem; text-align:center; }
            .nacao-fase-frag{ font-family:'EB Garamond',serif; color:#e8b923; font-size:.85rem; text-align:center; font-style:italic; }
            .nacao-fase-btn{ padding:10px; margin-top:auto; background:linear-gradient(180deg,rgba(232,185,35,.2),transparent 45%),linear-gradient(135deg,#8a6a2e,#4a3418); color:#fff5dc; border:2px solid #e8b923; border-radius:4px; cursor:pointer; font-family:'Cinzel',serif; font-weight:700; font-size:.85rem; letter-spacing:1.5px; }
            .nacao-fase-btn:disabled{ background:#2a1f10; color:#6a5024; border-color:#3d2d18; cursor:not-allowed; }
            .nacao-pesadelo-banner{ display:flex; align-items:center; gap:16px; padding:16px 20px; margin-bottom:24px; background:linear-gradient(180deg,rgba(142,68,173,.25),transparent 60%),linear-gradient(135deg,rgba(30,15,40,.95),rgba(15,8,20,.95)); border:2px solid #8e44ad; border-radius:10px; box-shadow:0 0 30px rgba(142,68,173,.4); flex-wrap:wrap; }
            .nacao-pesadelo-icon{ filter:drop-shadow(0 0 15px rgba(142,68,173,.7)); }
            .nacao-pesadelo-info{ flex:1; min-width:200px; }
            .nacao-pesadelo-titulo{ font-family:'Cinzel Decorative',serif; color:#c39bd3; font-size:1.1rem; letter-spacing:1.5px; margin-bottom:4px; }
            .nacao-pesadelo-sub{ font-family:'EB Garamond',serif; color:#d9c89a; font-size:.95rem; font-style:italic; margin-bottom:6px; }
            .nacao-pesadelo-desc{ font-family:'EB Garamond',serif; color:#b8a577; font-size:.85rem; }
            .nacao-pesadelo-btn{ padding:12px 20px; background:linear-gradient(180deg,rgba(142,68,173,.4),transparent 45%),linear-gradient(135deg,#6a2a8a,#3a1548); color:#f0e0ff; border:2px solid #8e44ad; border-radius:5px; cursor:pointer; font-family:'Cinzel',serif; font-weight:700; font-size:.95rem; letter-spacing:2px; }
            .nacao-pesadelo-aviso{ padding:12px 16px; margin-bottom:24px; background:rgba(10,6,2,.5); border:1px dashed rgba(142,68,173,.4); border-radius:6px; font-family:'EB Garamond',serif; color:#b8a577; font-size:.9rem; text-align:center; font-style:italic; }
            .nacao-pesadelo-aviso b{ color:#c39bd3; }
            .nacao-shop-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px; margin-bottom:24px; }
            .nacao-shop-card{ background:linear-gradient(180deg,rgba(74,140,181,.08),transparent 40%),linear-gradient(180deg,#2a1f10,#1a1208); border:2px solid #2a4a6a; border-radius:8px; padding:16px 14px; display:flex; flex-direction:column; align-items:center; gap:8px; }
            .nacao-shop-card.owned{ border-color:#4a7040; opacity:.7; }
            .nacao-shop-icon{ font-size:2.5rem; }
            .nacao-shop-name{ font-family:'Cinzel',serif; color:#f0e2c0; font-size:.95rem; font-weight:700; text-align:center; }
            .nacao-shop-meta{ font-family:'EB Garamond',serif; color:#8ac070; font-size:.85rem; font-style:italic; }
            .nacao-shop-price{ font-family:'Cinzel',serif; color:#e8b923; font-size:1rem; font-weight:700; }
            .nacao-shop-btn{ width:100%; padding:8px; background:linear-gradient(180deg,rgba(74,140,181,.2),transparent 45%),linear-gradient(135deg,#2a4a6a,#1a2f45); color:#d0e8f5; border:1.5px solid #4a8cb5; border-radius:4px; cursor:pointer; font-family:'Cinzel',serif; font-weight:700; font-size:.8rem; letter-spacing:1px; }
            .nacao-shop-btn:disabled{ background:#2a1f10; color:#6a5024; border-color:#3d2d18; cursor:not-allowed; }
            @media (max-width:600px){ .nacao-grid,.nacao-fases-grid{grid-template-columns:1fr} .nacao-shop-grid{grid-template-columns:repeat(2,1fr)} }
        `;
        document.head.appendChild(st);
    }

    // ═══════════════════════════════════════════════════════════
    // HOOK NO renderEventoSemanalScreen PARA ADICIONAR BOTÃO DE SETE NAÇÕES
    // ═══════════════════════════════════════════════════════════
    // Já existe o sistema de abas (Sete Selados / Sete Nações) no historia.js
    // via window._semanaTab. Precisamos garantir que o botão existente
    // aponte para renderSeteNacoesScreen.

    // ═══════════════════════════════════════════════════════════
    // DEBUG
    // ═══════════════════════════════════════════════════════════
    window._debugNacoes = function() {
        console.group('=== SETE NAÇÕES V2 ===');
        console.log('Nação do dia:', _getNacaoDoDia()?.nome || '(nenhuma)');
        console.log('Dificuldade:', _getDif());
        console.log('Essências:', STORY_PROGRESS.inventory[CONFIG.moedaId] || 0);
        console.log('Fragmentos:', STORY_PROGRESS.nacaoFragmentos || []);
        console.log('Armas:', (STORY_PROGRESS.nacaoArmas || []).length, '/ 21');
        console.log('Amuletos:', (STORY_PROGRESS.nacaoAmuletos || []).length, '/ 7');
        console.log('Abya desbloqueado:', STORY_PROGRESS.abyaDesbloqueado);
        console.log('Semana:', _getWeek());
        console.log('Dia do Pesadelo:', ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][_getDiaPesadelo()]);
        console.log('Progresso:');
        Object.keys(NACOES).forEach(id => {
            const p = _getProg(id, _getDif());
            console.log(`  ${id}: ${p.fasesConcluidas.length}/3`);
        });
        console.groupEnd();
    };
    window._forcarEssencias = function(qtd) {
        STORY_PROGRESS.inventory[CONFIG.moedaId] = (STORY_PROGRESS.inventory[CONFIG.moedaId] || 0) + (qtd || 100);
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        console.log(`+${qtd||100} Essências`);
    };
    window._forcarTodosFragmentos = function() {
        Object.keys(FRAGMENTOS).forEach(fid => {
            if (!STORY_PROGRESS.nacaoFragmentos.includes(fid)) STORY_PROGRESS.nacaoFragmentos.push(fid);
        });
        STORY_PROGRESS.abyaDesbloqueado = true;
        if (!STORY_PROGRESS.unlockedHeroesStory.includes('Abya')) STORY_PROGRESS.unlockedHeroesStory.push('Abya');
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        console.log('🌎 Abya desbloqueado');
    };
    window._forcarNacao = function(id) {
        if (!NACOES[id]) return;
        window._semanaTab = 'nacoes';
        renderFasesNacao(id);
    };

    // ═══════════════════════════════════════════════════════════
    // LOG FINAL
    // ═══════════════════════════════════════════════════════════
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [Sete Nações V2 — Parte 2] Motor completo');
    console.log('═══════════════════════════════════════════════════');
    console.log('• init via eventoIniciarBatalha');
    console.log('• 3 fases acumulativas (1→2→3 deuses)');
    console.log('• Drops: essência sempre + arma/frag/amuleto na fase 3');
    console.log('• Progresso por dificuldade (padrão historia.js)');
    console.log('• Reset semanal segunda-feira');
    console.log('• Pesadelo mensal: 7 deuses finais em fila');
    console.log('');
    console.log('📅 Hoje:', ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][new Date().getDay()]);
    console.log('🌎 Nação do dia:', _getNacaoDoDia()?.nome || '(nenhuma)');
    console.log('📆 Semana:', _getWeek());
    console.log('');
    console.log('💡 Debug: window._debugNacoes()');
    console.log('💡 Forçar: window._forcarNacao("tainos")');
    console.log('💡 Essências: window._forcarEssencias(500)');
    console.log('💡 Fragmentos: window._forcarTodosFragmentos()');
    console.log('═══════════════════════════════════════════════════');

    // Inicializa
    _garantirProgresso();
})();
// =================================================================
// nacoes.js — V2.1 — Fix: abas "Sete Selados | Sete Nações" em ambas as telas
// -----------------------------------------------------------------
// • Reset _semanaTab para 'selados' ao clicar no card Evento Semanal da Aldeia
// • Injeta as abas no topo de AMBAS as telas (Sete Selados e Sete Nações)
// • Fallback de CSS caso o historia.js não tenha sido carregado antes
// =================================================================
(function fixTabsNacoesV21() {
    if (window._nacoesTabsV21) return;
    window._nacoesTabsV21 = true;

    // ─────────────────────────────────────────────────────────
    // 1. Reset _semanaTab ao clicar no card "Evento Semanal" da Aldeia
    //    (capture phase → roda ANTES do onclick original)
    // ─────────────────────────────────────────────────────────
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.evento-aldeia-card');
        if (card) {
            window._semanaTab = 'selados';
        }
    }, true);

    // ─────────────────────────────────────────────────────────
    // 2. Função que injeta as abas (recriada para não depender do historia.js)
    // ─────────────────────────────────────────────────────────
    function _injectTabsV2() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;
        if (!screen.classList.contains('active')) return;

        const titleEl = screen.querySelector('.story-title');
        if (!titleEl) return;
        const txt = titleEl.textContent.toUpperCase();

        let tabAtual = null;
        if (txt.includes('SEMANA DAS SOMBRAS')) tabAtual = 'selados';
        if (txt.includes('SETE NAÇÕES')) tabAtual = 'nacoes';
        if (!tabAtual) return;

        // Remove abas existentes (evita duplicata)
        document.querySelectorAll('.nacao-tabs-nav').forEach(t => t.remove());

        const container = screen.querySelector('.story-container');
        if (!container) return;
        const header = container.querySelector('.story-header');
        if (!header) return;

        const tabs = document.createElement('div');
        tabs.className = 'nacao-tabs-nav';
        tabs.innerHTML = `
            <button class="nacao-tab-btn ${tabAtual==='selados'?'active':''}" data-tab="selados">🌑 Sete Selados</button>
            <button class="nacao-tab-btn ${tabAtual==='nacoes'?'active':''}" data-tab="nacoes">🌎 Sete Nações</button>
        `;
        header.parentNode.insertBefore(tabs, header.nextSibling);

        tabs.querySelectorAll('.nacao-tab-btn').forEach(btn => {
            btn.onclick = () => {
                const tab = btn.getAttribute('data-tab');
                if (tab === 'nacoes') {
                    window._semanaTab = 'nacoes';
                    if (typeof window.renderSeteNacoesScreen === 'function') {
                        window.renderSeteNacoesScreen();
                    }
                } else {
                    window._semanaTab = 'selados';
                    if (typeof window.renderEventoSemanalScreen === 'function') {
                        window.renderEventoSemanalScreen();
                    }
                }
            };
        });
    }

    // ─────────────────────────────────────────────────────────
    // 3. Hook: renderSeteNacoesScreen (V2) — injeta após renderizar
    // ─────────────────────────────────────────────────────────
    const _origSete = window.renderSeteNacoesScreen;
    if (typeof _origSete === 'function' && !_origSete._v21) {
        window.renderSeteNacoesScreen = function() {
            const r = _origSete.apply(this, arguments);
            setTimeout(_injectTabsV2, 50);
            setTimeout(_injectTabsV2, 250);
            return r;
        };
        window.renderSeteNacoesScreen._v21 = true;
    }

    // ─────────────────────────────────────────────────────────
    // 4. Hook: renderEventoSemanalScreen — injeta após renderizar
    //    (redundância segura, o historia.js já tenta)
    // ─────────────────────────────────────────────────────────
    const _origEvento = window.renderEventoSemanalScreen;
    if (typeof _origEvento === 'function' && !_origEvento._v21) {
        window.renderEventoSemanalScreen = function() {
            const r = _origEvento.apply(this, arguments);
            setTimeout(_injectTabsV2, 100);
            setTimeout(_injectTabsV2, 350);
            return r;
        };
        window.renderEventoSemanalScreen._v21 = true;
    }

    // ─────────────────────────────────────────────────────────
    // 5. CSS de segurança (caso o historia.js não tenha rodado)
    // ─────────────────────────────────────────────────────────
    if (!document.getElementById('v21TabsCSS')) {
        const st = document.createElement('style');
        st.id = 'v21TabsCSS';
        st.textContent = `
            .nacao-tabs-nav {
                display: flex !important;
                justify-content: center;
                gap: 10px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            .nacao-tab-btn {
                padding: 10px 24px;
                background: linear-gradient(135deg, #3d2d18, #2a1f10);
                color: #c8b787;
                border: 2px solid #6a5024;
                border-radius: 24px;
                cursor: pointer;
                font-family: 'Cinzel', serif;
                font-weight: 700;
                font-size: .9rem;
                letter-spacing: 1px;
                transition: all .2s;
            }
            .nacao-tab-btn:hover {
                color: #e8dcc4;
                border-color: #c9a227;
            }
            .nacao-tab-btn.active {
                background:
                    linear-gradient(180deg, rgba(232,185,35,.2), transparent 45%),
                    linear-gradient(135deg, #6a5024, #3d2d18);
                color: #fff5dc;
                border-color: #e8b923;
                box-shadow: 0 0 15px rgba(232,185,35,.35);
            }
        `;
        document.head.appendChild(st);
    }

    // ─────────────────────────────────────────────────────────
    // 6. Aplica imediatamente se estiver na tela certa
    // ─────────────────────────────────────────────────────────
    setTimeout(_injectTabsV2, 200);
    setTimeout(_injectTabsV2, 800);

    // ─────────────────────────────────────────────────────────
    // 7. Watchdog leve (3s) — se estiver em Evento Semanal e os tabs sumiram, re-injeta
    // ─────────────────────────────────────────────────────────
    setInterval(() => {
        const screen = document.getElementById('storyScreen');
        if (!screen || !screen.classList.contains('active')) return;
        const titleEl = screen.querySelector('.story-title');
        if (!titleEl) return;
        const txt = titleEl.textContent.toUpperCase();
        if (!txt.includes('SEMANA DAS SOMBRAS') && !txt.includes('SETE NAÇÕES')) return;
        if (!document.querySelector('.nacao-tabs-nav')) {
            _injectTabsV2();
        }
    }, 3000);

    // ─────────────────────────────────────────────────────────
    // Debug
    // ─────────────────────────────────────────────────────────
    window._debugTabsV21 = function() {
        console.group('=== TABS V2.1 ===');
        console.log('_semanaTab:', window._semanaTab);
        console.log('Tabs no DOM?', !!document.querySelector('.nacao-tabs-nav'));
        const screen = document.getElementById('storyScreen');
        const title = screen?.querySelector('.story-title')?.textContent?.trim();
        console.log('Título atual:', title || '(nenhum)');
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V2.1] Abas Sete Selados / Sete Nações corrigidas');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Reset de _semanaTab ao clicar no card da Aldeia');
    console.log('• Abas injetadas em AMBAS as telas');
    console.log('• Watchdog de 3s re-injeta se sumirem');
    console.log('💡 Debug: window._debugTabsV21()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// nacoes.js — V2.2 — Restrição por raridade + balanceamento por dia
// =================================================================
(function nacoesV22() {
    if (window._nacoesV22) return;
    window._nacoesV22 = true;

    // ═══════════════════════════════════════════════════════
    // CONFIG: dia → { maxStars, hpMult, atkMult }
    //   maxStars = null → sem restrição
    //   hpMult/atkMult multiplicam o HP/ATK base do deus
    //   (depois da dificuldade Normal/Difícil/Pesadelo)
    // ═══════════════════════════════════════════════════════
    const DAY_CONFIG = {
        1: { maxStars: 1,    hpMult: 0.25, atkMult: 0.50 }, // Seg - Tainos
        2: { maxStars: 2,    hpMult: 0.40, atkMult: 0.60 }, // Ter - Astecas
        3: { maxStars: 3,    hpMult: 0.55, atkMult: 0.70 }, // Qua - Maias
        4: { maxStars: 4,    hpMult: 0.70, atkMult: 0.80 }, // Qui - Incas
        5: { maxStars: 5,    hpMult: 0.85, atkMult: 0.90 }, // Sex - Mapuches
        6: { maxStars: null, hpMult: 1.00, atkMult: 1.00 }, // Sáb - Chibchas
        0: { maxStars: null, hpMult: 1.00, atkMult: 1.00 }, // Dom - Navajos
    };
    window._nacaoDayConfig = DAY_CONFIG; // fácil de ajustar

    // ═══════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════
    function getHeroRarity(heroClass) {
        if (typeof window.getHeroRarity === 'function') return window.getHeroRarity(heroClass);
        const h = STORY_HERO_CLASSES?.[heroClass];
        if (!h) return 1;
        if (h.rarity) return h.rarity;
        if (h.starsNeeded === 0) return 1;
        if (h.starsNeeded < 100) return 2;
        return 3;
    }

    function getDiaDaNacao(nacaoId) {
        if (nacaoId === 'pesadelo') return -1;
        const n = window.NACOES?.[nacaoId];
        return n ? n.diaSemana : -1;
    }

    function getMultDia(nacaoId) {
        const cfg = DAY_CONFIG[getDiaDaNacao(nacaoId)];
        return cfg || { hpMult: 1, atkMult: 1 };
    }

    function validarRestricao(nacaoId) {
        const dia = getDiaDaNacao(nacaoId);
        const cfg = DAY_CONFIG[dia];
        if (!cfg || cfg.maxStars === null) return { valido: true };
        const selHero = (STORY_PROGRESS.selectedHeroes || ['Tupa'])[0];
        const rarity = getHeroRarity(selHero);
        const nome = STORY_HERO_CLASSES[selHero]?.displayName || selHero;
        if (rarity > cfg.maxStars) {
            return {
                valido: false,
                motivo: `Este dia é limitado a heróis até ${cfg.maxStars}★. ${nome} é ${rarity}★.`,
            };
        }
        return { valido: true };
    }

    // ═══════════════════════════════════════════════════════
    // 1. Validar restrição ao iniciar fase
    // ═══════════════════════════════════════════════════════
    const _origIniciar = window._nacaoIniciarFase;
    if (typeof _origIniciar === 'function' && !_origIniciar._v22) {
        window._nacaoIniciarFase = async function(nacaoId, faseId) {
            const check = validarRestricao(nacaoId);
            if (!check.valido) {
                if (typeof showToast === 'function') showToast('🚫', check.motivo, '🚫');
                return;
            }
            return _origIniciar.apply(this, arguments);
        };
        window._nacaoIniciarFase._v22 = true;
    }

    // ═══════════════════════════════════════════════════════
    // 2. HP: multiplicar ao criar o boss
    // ═══════════════════════════════════════════════════════
    const _origEvt = window.eventoIniciarBatalha;
    if (typeof _origEvt === 'function' && !_origEvt._v22) {
        window.eventoIniciarBatalha = async function(bossId, faseId) {
            const r = await _origEvt.apply(this, arguments);
            if (typeof bossId === 'string' && bossId.startsWith('nacao_') && bossId !== 'nacao_pesadelo') {
                const nacaoId = bossId.replace('nacao_', '');
                const mult = getMultDia(nacaoId);
                if (mult.hpMult !== 1 && typeof boss !== 'undefined' && boss) {
                    const orig = boss.maxHp;
                    boss.maxHp = Math.max(1, Math.ceil(orig * mult.hpMult));
                    boss.hp = boss.maxHp;
                    console.log(`[V2.2] Boss HP: ${orig} × ${mult.hpMult} = ${boss.maxHp}`);
                }
                if (typeof updateBossCard === 'function') updateBossCard();
                if (typeof updateVisuals === 'function') updateVisuals();
            }
            return r;
        };
        window.eventoIniciarBatalha._v22 = true;
    }

    // ═══════════════════════════════════════════════════════
    // 3. ATK: multiplicar no applyDmg (só nações)
    // ═══════════════════════════════════════════════════════
    const _origDmg = window.applyDmg;
    if (typeof _origDmg === 'function' && !_origDmg._v22) {
        window.applyDmg = function(target, amount) {
            if (window._nacaoAtivo && !window._nacaoBatalha?.isPesadeloNacao) {
                const nacaoId = window._nacaoBatalha?.nacaoId;
                if (nacaoId && nacaoId !== 'pesadelo') {
                    const playerHit = Array.isArray(players) && players.includes(target) && target && !target.dead;
                    if (playerHit) {
                        const mult = getMultDia(nacaoId);
                        if (mult.atkMult !== 1) {
                            amount = Math.max(1, Math.ceil(amount * mult.atkMult));
                        }
                    }
                }
            }
            return _origDmg.call(this, target, amount);
        };
        window.applyDmg._v22 = true;
    }

    // ═══════════════════════════════════════════════════════
    // 4. UI: mostrar restrição + bloqueio
    // ═══════════════════════════════════════════════════════
    const _origRenderFases = window.renderFasesNacao;
    if (typeof _origRenderFases === 'function' && !_origRenderFases._v22) {
        window.renderFasesNacao = function(nacaoId) {
            const r = _origRenderFases.apply(this, arguments);
            const cfg = DAY_CONFIG[getDiaDaNacao(nacaoId)];
            if (!cfg) return r;
            const screen = document.getElementById('storyScreen');
            const header = screen?.querySelector('.story-header');
            if (!header || header.querySelector('.nacao-restricao')) return r;

            const selHero = (STORY_PROGRESS.selectedHeroes || ['Tupa'])[0];
            const selRarity = getHeroRarity(selHero);
            const selData = STORY_HERO_CLASSES[selHero];
            const bloqueado = cfg.maxStars !== null && selRarity > cfg.maxStars;
            const restricaoTexto = cfg.maxStars === null
                ? '⚔️ Sem restrição de raridade'
                : `⭐ Apenas heróis até ${cfg.maxStars}★`;

            const alerta = document.createElement('div');
            alerta.className = 'nacao-restricao ' + (bloqueado ? 'bloqueado' : 'ok');
            alerta.innerHTML = `
                <div class="nacao-restricao-titulo">${restricaoTexto}</div>
                <div class="nacao-restricao-heroi">
                    Herói atual: <b>${selData?.displayName || selHero}</b> (${selRarity}★)
                    ${bloqueado ? ' — ❌ bloqueado' : ' — ✅ permitido'}
                </div>
                ${bloqueado ? `<div class="nacao-restricao-hint">Troque para um herói de raridade válida na OCA.</div>` : ''}
            `;
            header.appendChild(alerta);
            return r;
        };
        window.renderFasesNacao._v22 = true;
    }

    // ═══════════════════════════════════════════════════════
    // 5. CSS
    // ═══════════════════════════════════════════════════════
    if (!document.getElementById('v22RestricaoCSS')) {
        const st = document.createElement('style');
        st.id = 'v22RestricaoCSS';
        st.textContent = `
            .nacao-restricao { margin-top:14px; padding:10px 16px; border-radius:6px; text-align:center; font-family:'EB Garamond',serif; }
            .nacao-restricao.ok { background:rgba(107,163,92,.12); border:1px solid rgba(107,163,92,.4); color:#8ac070; }
            .nacao-restricao.bloqueado { background:rgba(168,50,50,.15); border:1px solid rgba(168,50,50,.5); color:#f5c8c8; }
            .nacao-restricao-titulo { font-family:'Cinzel',serif; font-size:.9rem; letter-spacing:1.5px; font-weight:700; margin-bottom:4px; }
            .nacao-restricao-heroi { font-size:.9rem; font-style:italic; }
            .nacao-restricao-hint { margin-top:6px; font-size:.8rem; opacity:.9; }
        `;
        document.head.appendChild(st);
    }

    // ═══════════════════════════════════════════════════════
    // 6. Debug
    // ═══════════════════════════════════════════════════════
    window._debugRestricaoV22 = function() {
        const dia = new Date().getDay();
        const cfg = DAY_CONFIG[dia];
        const selHero = (STORY_PROGRESS.selectedHeroes || ['Tupa'])[0];
        const rarity = getHeroRarity(selHero);
        console.group('=== V2.2 ===');
        console.log('Dia:', ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][dia]);
        console.log('maxStars:', cfg?.maxStars, '| HP ×', cfg?.hpMult, '| ATK ×', cfg?.atkMult);
        console.log('Herói:', selHero, '→', rarity + '★');
        console.log('Bloqueado?', cfg?.maxStars !== null && rarity > cfg?.maxStars);
        console.groupEnd();
    };

    // Expõe helper para ajustar multiplicadores em tempo real
    window._ajustarMultDia = function(dia, hp, atk) {
        if (DAY_CONFIG[dia]) {
            DAY_CONFIG[dia].hpMult = hp;
            DAY_CONFIG[dia].atkMult = atk;
            console.log(`Dia ${dia} → HP×${hp} ATK×${atk}`);
        }
    };

    console.log('✅ [V2.2] Restrição por raridade + multiplicadores por dia ativos.');
    console.log('   Seg: ≤1★ (HP×0.25 ATK×0.50) | Ter: ≤2★ | Qua: ≤3★ | Qui: ≤4★ | Sex: ≤5★');
    console.log('   Sáb/Dom: sem restrição (HP×1.0 ATK×1.0)');
    console.log('💡 Debug: window._debugRestricaoV22()');
})();
// =================================================================
// nacoes.js — V2.3 — Rebalanceamento de skills + Yúcahu reformulado
// -----------------------------------------------------------------
// • Yúcahu Skill 1: 5×5 → 3×3 (9 tiles)
// • Yúcahu Skill 2: dano em TODOS os tiles TERRA, metade do ATK
// • Fase 1 (Yúcahu/Quetzalcóatl/Kukulkán/Illapa/Antü/Bochica/Ma'ii): skills reduzidas
// • 4 diagonais → 1 diagonal (a que passa pelo herói mais próximo)
// • Cruz inteira → cruz de raio 3
// • "Todo tabuleiro vira X" mantido só em bosses de fase 3
// =================================================================
(function nacoesV23() {
    if (window._nacoesV23) return;
    window._nacoesV23 = true;

    const H = window.NACAO_SKILL_HANDLERS;
    if (!H) { console.warn('[V2.3] NACAO_SKILL_HANDLERS ausente'); return; }

    const h = window._nacaoHelpers || {};
    const { _sleep, _log, _fx, _dmg, _alive, _nearest,
            _linha, _area, _cruz, _diagonal,
            _dmgEmTiles, _dmgGlobal, _convert } = h;

    const getBoss = () => (typeof boss !== 'undefined' && boss) ? { x: boss.x, y: boss.y } : { x: 4, y: 0 };
    const sfx = (n) => { try { if (typeof playSfx === 'function') playSfx(n); } catch (e) {} };
    const pushIf = (p, dx, dy, d) => { try { if (typeof tryPushPlayer === 'function') tryPushPlayer(p, dx, dy, d); } catch(e) {} };
    const updateView = () => { if (typeof updateVisuals === 'function') updateVisuals(); };

    // ─── Helper: uma diagonal que passa mais perto do herói ───
    function diagonalProxima(c, target) {
        let best = [1, 1], bestDist = Infinity;
        [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dx, dy]) => {
            const d = Math.abs((target.x - c.x) * dy - (target.y - c.y) * dx);
            if (d < bestDist) { bestDist = d; best = [dx, dy]; }
        });
        const tiles = [];
        const [dx, dy] = best;
        for (let i = -7; i <= 7; i++) {
            const nx = c.x + dx * i, ny = c.y + dy * i;
            if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push({ x: nx, y: ny });
        }
        return tiles;
    }

    // ─── Helper: cruz de raio R ───
    function cruzRaio(c, r) {
        const tiles = [];
        for (let i = -r; i <= r; i++) {
            const nx = c.x + i, ny = c.y;
            if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push({ x: nx, y: ny });
            const nx2 = c.x, ny2 = c.y + i;
            if (i !== 0 && nx2 >= 0 && nx2 < 8 && ny2 >= 0 && ny2 < 8) tiles.push({ x: nx2, y: ny2 });
        }
        return tiles;
    }

    // ═══════════════════════════════════════════════════════
    // TAÍNOS
    // ═══════════════════════════════════════════════════════
    // Yúcahu Skill 1 — Raízes Traiçoeiras — 3×3 (era 5×5)
    H['nacao_yucahu_raizes'] = async (enemy, skill) => {
        _log(`🌱 ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa1');
        const c = getBoss();
        const tiles = _area(c.x, c.y, 1); // 3×3
        tiles.forEach((t, i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:500,scale:0.9}), i*40));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk);
    };

    // Yúcahu Skill 2 — Colheita Podre — dano em TODOS os tiles TERRA (metade do ATK)
    H['nacao_yucahu_colheita'] = async (enemy, skill) => {
        _log(`🌱 ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa2');
        const terraTiles = [];
        if (typeof grid !== 'undefined') {
            for (let i = 0; i < 64; i++) {
                if (grid[i] === 'TERRA') {
                    terraTiles.push({ x: i % 8, y: Math.floor(i / 8) });
                }
            }
        }
        terraTiles.forEach((t, i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:1.0}), i*30));
        await _sleep(700);
        const dano = Math.max(1, Math.ceil(enemy.atk / 2));
        _dmgEmTiles(terraTiles, dano);
        _log(`🌱 ${terraTiles.length} tiles TERRA atingidos (${dano} dano cada)`);
    };

    // ═══════════════════════════════════════════════════════
    // ASTECAS
    // ═══════════════════════════════════════════════════════
    // Quetzalcóatl Skill 1 — Sopro de Vento — 1 diagonal (era 4)
    H['nacao_quetzalcoatl_sopro'] = async (enemy, skill) => {
        _log(`🐍 ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa2');
        const c = getBoss();
        const target = _nearest(c.x, c.y);
        if (!target) return;
        const tiles = diagonalProxima(c, target);
        tiles.forEach((t, i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:500,scale:0.9}), i*30));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk);
        _convert(tiles, 'AR');
    };

    // ═══════════════════════════════════════════════════════
    // MAIAS
    // ═══════════════════════════════════════════════════════
    // Kukulkán Skill 1 — Descida do Equinócio — só coluna do boss (era coluna + diagonais)
    H['nacao_kukulkan_descida'] = async (enemy, skill) => {
        _log(`🐉 ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa1');
        const c = getBoss();
        const tiles = _linha(c.x, c.y, false);
        tiles.forEach((t, i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:500,scale:0.9}), i*30));
        await _sleep(700);
        _dmgEmTiles(tiles, enemy.atk);
        _convert(tiles, 'AR');
    };
    // Kukulkán Skill 2 — Sombra da Serpente — 1 diagonal (era 4)
    H['nacao_kukulkan_sombra'] = async (enemy, skill) => {
        _log(`🐉 ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa2');
        const c = getBoss();
        const target = _nearest(c.x, c.y);
        if (!target) return;
        const tiles = diagonalProxima(c, target);
        tiles.forEach((t, i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:500,scale:0.9}), i*30));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk);
    };

    // ═══════════════════════════════════════════════════════
    // INCAS
    // ═══════════════════════════════════════════════════════
    // Illapa Skill 1 — Três Raios — 1 coluna (era 3 colunas inteiras)
    H['nacao_illapa_raios'] = async (enemy, skill) => {
        _log(`⛈️ ${enemy.nome}: ${skill.nome}!`);
        sfx('skill1');
        const c = getBoss();
        const tiles = _linha(c.x, c.y, false);
        tiles.forEach((t, i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:1.0}), i*30));
        await _sleep(700);
        _dmgEmTiles(tiles, enemy.atk);
        _convert(tiles, 'AR');
    };

    // ═══════════════════════════════════════════════════════
    // MAPUCHES
    // ═══════════════════════════════════════════════════════
    // Antü Skill 2 — Chuva Solar — 3×3 (era 5×5)
    H['nacao_antu_chuva'] = async (enemy, skill) => {
        _log(`🔆 ${enemy.nome}: ${skill.nome}!`);
        sfx('skill1');
        const c = getBoss();
        const tiles = _area(c.x, c.y, 1);
        tiles.forEach((t, i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:0.9}), i*40));
        await _sleep(700);
        _dmgEmTiles(tiles, enemy.atk);
        _convert(tiles, 'FOGO');
    };

    // ═══════════════════════════════════════════════════════
    // CHIBCHAS
    // ═══════════════════════════════════════════════════════
    // Bochica Skill 1 — Bastão de Ouro — só 3 tiles à frente do herói mais próximo
    H['nacao_bochica_bastao'] = async (enemy, skill) => {
        _log(`🪄 ${enemy.nome}: ${skill.nome}!`);
        sfx('minoa1');
        const c = getBoss();
        const target = _nearest(c.x, c.y);
        if (!target) return;
        const dir = Math.sign(target.x - c.x) || 1;
        const tiles = [];
        for (let i = 0; i < 4; i++) {
            const nx = c.x + dir * i, ny = c.y;
            if (nx >= 0 && nx < 8) tiles.push({ x: nx, y: ny });
        }
        tiles.forEach((t, i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:1.0}), i*40));
        await _sleep(600);
        _dmgEmTiles(tiles, enemy.atk);
        _alive().forEach(p => {
            if (tiles.some(t => t.x === p.x && t.y === p.y)) pushIf(p, dir, 0, 2);
        });
    };

    // ═══════════════════════════════════════════════════════
    // NAVAJOS
    // ═══════════════════════════════════════════════════════
    // Ma'ii Skill 1 — Trapaça — 3×3 (já é 3×3, mantém)

    // ═══════════════════════════════════════════════════════
    // FASE 2 — reduzir 5×5 → 3×3 em todos
    // ═══════════════════════════════════════════════════════
    const _reduzir5x5Para3x3 = (handlerKey, elemento, empurra) => {
        H[handlerKey] = async (enemy, skill) => {
            _log(`👹 ${enemy.nome}: ${skill.nome}!`);
            sfx('skill1');
            const c = getBoss();
            const tiles = _area(c.x, c.y, 1); // 3×3
            tiles.forEach((t, i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:0.9}), i*40));
            await _sleep(600);
            _dmgEmTiles(tiles, enemy.atk);
            if (elemento) _convert(tiles, elemento);
            if (empurra) {
                _alive().forEach(p => {
                    if (tiles.some(t => t.x === p.x && t.y === p.y)) {
                        const dx = Math.sign(c.x - p.x), dy = Math.sign(c.y - p.y);
                        pushIf(p, dx, dy, 1);
                    }
                });
            }
        };
    };

    _reduzir5x5Para3x3('nacao_tezcatlipoca_fumaca', null, false);
    _reduzir5x5Para3x3('nacao_chaac_granizo', null, false);
    _reduzir5x5Para3x3('nacao_ixchel_tear', null, false);
    _reduzir5x5Para3x3('nacao_mamaquilla_prata', 'AGUA', false);
    _reduzir5x5Para3x3('nacao_supay_terremoto', 'TERRA', false);
    _reduzir5x5Para3x3('nacao_wekufe_enxame', null, false);
    _reduzir5x5Para3x3('nacao_bachue_aguas', 'AGUA', true);
    _reduzir5x5Para3x3('nacao_chibchacum_peso', null, false);
    _reduzir5x5Para3x3('nacao_aranha_teia', null, false);

    // ═══════════════════════════════════════════════════════
    // FASE 2/3 — Cruz inteira → cruz de raio 3
    // ═══════════════════════════════════════════════════════
    const _reduzirCruzInteira = (handlerKey, extraDano, empurra, elemento) => {
        H[handlerKey] = async (enemy, skill) => {
            _log(`👹 ${enemy.nome}: ${skill.nome}!`);
            sfx('minoa1');
            const c = getBoss();
            const tiles = cruzRaio(c, 3);
            tiles.forEach((t, i) => setTimeout(() => _fx('impact','fx-impact',t.x,t.y,{duration:600,scale:1.0}), i*25));
            await _sleep(650);
            _dmgEmTiles(tiles, enemy.atk + (extraDano || 0));
            if (elemento) _convert(tiles, elemento);
            if (empurra) {
                _alive().forEach(p => {
                    if (tiles.some(t => t.x === p.x && t.y === p.y)) {
                        const dx = Math.sign(c.x - p.x), dy = Math.sign(c.y - p.y);
                        pushIf(p, dx, dy, 1);
                    }
                });
            }
        };
    };

    _reduzirCruzInteira('nacao_tezcatlipoca_espelho', 0, false, null);
    _reduzirCruzInteira('nacao_huitzi_guerra', 2, false, null);
    _reduzirCruzInteira('nacao_mamaquilla_eclipse', 1, false, null);
    _reduzirCruzInteira('nacao_chibchacum_tremor', 0, true, null);
    _reduzirCruzInteira('nacao_aranha_fios', 0, true, null);

    // ═══════════════════════════════════════════════════════
    // "Tabuleiro inteiro vira X" — mantém dano global mas só 5×5 do tabuleiro
    // ═══════════════════════════════════════════════════════
    const _reduzirTabuleiroInteiro = (handlerKey, elemento) => {
        H[handlerKey] = async (enemy, skill) => {
            _log(`👹 ${enemy.nome}: ${skill.nome}!`);
            sfx('skill1');
            const c = getBoss();
            _fx('impact', 'fx-impact', c.x, c.y, { duration: 1000, scale: 3 });
            await _sleep(700);
            _dmgGlobal(enemy.atk);
            const tiles = _area(c.x, c.y, 2); // 5×5 ao redor do boss
            tiles.forEach(t => {
                if (typeof grid === 'undefined') return;
                grid[t.y * 8 + t.x] = elemento;
                const el = document.querySelectorAll('#grid .tile')[t.y * 8 + t.x];
                if (el) el.className = `tile bg-${elemento}`;
            });
        };
    };

    _reduzirTabuleiroInteiro('nacao_huitzi_sol', 'FOGO');
    _reduzirTabuleiroInteiro('nacao_pillan_cinzas', 'FOGO');
    _reduzirTabuleiroInteiro('nacao_bochica_julgamento', 'TERRA');
    _reduzirTabuleiroInteiro('nacao_hashchelti_ceu', 'AR');

    // ═══════════════════════════════════════════════════════
    // DEBUG
    // ═══════════════════════════════════════════════════════
    window._debugSkillsV23 = function() {
        console.group('=== V2.3 — Skills rebalanceadas ===');
        console.log('Yúcahu Skill 1:', 'Raízes Traiçoeiras (3×3)');
        console.log('Yúcahu Skill 2:', 'Colheita Podre (dano em tiles TERRA / 2)');
        console.log('Outros bosses fase 1: reduzidos');
        console.log('Bosses fase 2: 5×5 → 3×3, cruz inteira → cruz raio 3');
        console.log('Bosses fase 3: mantidos (só dano global reduzido)');
        console.log('');
        console.log('Handlers registrados:', Object.keys(H).length);
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V2.3] Skills rebalanceadas');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Yúcahu Skill 1: 5×5 → 3×3 (9 tiles em vez de 25)');
    console.log('• Yúcahu Skill 2: dano em TODOS os tiles TERRA (ATK/2)');
    console.log('• Fase 1 (7 bosses): áreas reduzidas');
    console.log('• Fase 2 (7 bosses): 5×5 → 3×3, cruz inteira → raio 3');
    console.log('• Fase 3 (7 bosses): mantidos com dano global controlado');
    console.log('💡 Debug: window._debugSkillsV23()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// nacoes.js — V2.4 — Fix: tiles corrompidos vazam entre partidas
// -----------------------------------------------------------------
// • Reseta _corruptedTiles em TODOS os pontos de entrada/saída de partida
// • Watchdog limpa corrupção órfã (fora de batalha ou com HP > 50%)
// =================================================================
(function fixCorrupcaoVazandoV24() {
    if (window._fixCorrupcaoVazandoV24) return;
    window._fixCorrupcaoVazandoV24 = true;

    // ─── Helper: reset incondicional de corrupção ───
    function _resetCorrupcaoTotal() {
        // 1. Limpa visual (restaura tiles a partir do grid)
        try {
            if (typeof window.limparCorrupcao === 'function') {
                window.limparCorrupcao();
            }
        } catch (e) {
            console.warn('[V2.4] limparCorrupcao falhou:', e);
        }

        // 2. Garantia dupla: zera o array mesmo se limpar falhou
        window._corruptedTiles = [];

        // 3. Reseta flag do boss
        if (typeof boss !== 'undefined' && boss) {
            boss._corruptedTriggered = false;
        }

        // 4. Remove classes residuais do DOM (caso o grid tenha sido recriado)
        document.querySelectorAll('.tile.tile-corrupted').forEach(t => {
            t.classList.remove('tile-corrupted');
            const fx = t.querySelector('.corruption-fx');
            if (fx) fx.remove();
        });
    }
    window._resetCorrupcaoTotalV24 = _resetCorrupcaoTotal;

    // ─── 1. Reset ANTES de iniciar batalha do evento/nações ───
    const _origIniciar = window.eventoIniciarBatalha;
    if (typeof _origIniciar === 'function' && !_origIniciar._v24) {
        window.eventoIniciarBatalha = async function(bossId, faseId) {
            _resetCorrupcaoTotal();
            return _origIniciar.apply(this, arguments);
        };
        window.eventoIniciarBatalha._v24 = true;
    }

    // ─── 2. Reset ANTES de iniciar fase das nações (redundância) ───
    const _origNacao = window._nacaoIniciarFase;
    if (typeof _origNacao === 'function' && !_origNacao._v24) {
        window._nacaoIniciarFase = async function() {
            _resetCorrupcaoTotal();
            return _origNacao.apply(this, arguments);
        };
        window._nacaoIniciarFase._v24 = true;
    }

    // ─── 3. Reset ao FINALIZAR partida (vitória ou derrota) ───
    const _origFinalizar = window.eventoFinalizarPartida;
    if (typeof _origFinalizar === 'function' && !_origFinalizar._v24) {
        window.eventoFinalizarPartida = async function() {
            const r = await _origFinalizar.apply(this, arguments);
            _resetCorrupcaoTotal();
            return r;
        };
        window.eventoFinalizarPartida._v24 = true;
    }

    // ─── 4. Reset no finishStoryPhase (cobre derrota solo) ───
    const _origFinish = window.finishStoryPhase;
    if (typeof _origFinish === 'function' && !_origFinish._v24) {
        window.finishStoryPhase = function(victory) {
            _resetCorrupcaoTotal();
            return _origFinish.apply(this, arguments);
        };
        window.finishStoryPhase._v24 = true;
    }

    // ─── 5. Reset no handleStoryDefeat ───
    const _origDefeat = window.handleStoryDefeat;
    if (typeof _origDefeat === 'function' && !_origDefeat._v24) {
        window.handleStoryDefeat = function() {
            _resetCorrupcaoTotal();
            return _origDefeat.apply(this, arguments);
        };
        window.handleStoryDefeat._v24 = true;
    }

    // ─── 6. WATCHDOG A: corrupção órfã fora de batalha ───
    setInterval(() => {
        const emBatalha = window._nacaoBatalha?.ativa
                       || window._eventoAtivo
                       || window._storyMode
                       || (typeof gameActive !== 'undefined' && gameActive);
        if (emBatalha) return;

        if (Array.isArray(window._corruptedTiles) && window._corruptedTiles.length > 0) {
            console.log('[V2.4] Watchdog: corrupção órfã (fora de batalha) — limpando');
            _resetCorrupcaoTotal();
        }
        // Também limpa classes visuais órfãs
        const orfaos = document.querySelectorAll('.tile.tile-corrupted');
        if (orfaos.length > 0) {
            orfaos.forEach(t => {
                t.classList.remove('tile-corrupted');
                const fx = t.querySelector('.corruption-fx');
                if (fx) fx.remove();
            });
        }
    }, 2000);

    // ─── 7. WATCHDOG B: corrupção incoerente com HP > 50% ───
    setInterval(() => {
        if (!window._nacaoBatalha?.ativa && !window._eventoAtivo && !window._storyMode) return;
        if (!Array.isArray(window._corruptedTiles) || window._corruptedTiles.length === 0) return;
        if (typeof boss === 'undefined' || !boss || boss.dead) return;

        // Se boss está acima de 50% mas ainda tem corrupção → inconsistência
        if (boss.hp > boss.maxHp * 0.5 && !boss._corruptedTriggered) {
            console.log('[V2.4] Watchdog: corrupção com HP > 50% — limpando');
            _resetCorrupcaoTotal();
        }
    }, 3000);

    // ─── 8. Reset inicial ao carregar ───
    setTimeout(_resetCorrupcaoTotal, 300);
    setTimeout(_resetCorrupcaoTotal, 1500);

    // ─── DEBUG ───
    window._debugCorrupcaoV24 = function() {
        console.group('=== V2.4 — Corrupção ===');
        console.log('V2.4 ativo?', window._fixCorrupcaoVazandoV24);
        console.log('_corruptedTiles:', window._corruptedTiles);
        console.log('Boss _corruptedTriggered:', boss?._corruptedTriggered);
        console.log('Em batalha?', {
            nacao: window._nacaoBatalha?.ativa,
            evento: window._eventoAtivo,
            story: window._storyMode,
            gameActive: typeof gameActive !== 'undefined' ? gameActive : '?'
        });
        console.log('Tiles .tile-corrupted no DOM:', document.querySelectorAll('.tile.tile-corrupted').length);
        console.groupEnd();
    };

    window._resetCorrupcaoManual = function() {
        _resetCorrupcaoTotal();
        console.log('✅ Corrupção resetada manualmente.');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V2.4] Fix: corrupção não vaza mais entre partidas');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Reset em: eventoIniciarBatalha, _nacaoIniciarFase');
    console.log('• Reset em: eventoFinalizarPartida, finishStoryPhase, handleStoryDefeat');
    console.log('• Watchdog A: corrupção órfã (fora de batalha)');
    console.log('• Watchdog B: corrupção com boss > 50% HP (inconsistência)');
    console.log('');
    console.log('💡 Debug: window._debugCorrupcaoV24()');
    console.log('💡 Reset manual: window._resetCorrupcaoManual()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// nacoes.js — V2.5 — Fix: fallback global + NaN no atk + skill Yúcahu
// =================================================================
(function nacoesV25() {
    if (window._nacoesV25) return;
    window._nacoesV25 = true;

    const h = window._nacaoHelpers || {};
    const { _area, _dmgEmTiles, _log } = h;
    const getBoss = () => (typeof boss !== 'undefined' && boss) ? { x: boss.x, y: boss.y } : { x: 4, y: 0 };

    // ═══════════════════════════════════════════════════════
    // FIX 1: eventoBossAI — sincronizar cfg.atk junto com skills
    // (fix do NaN em enemyAtkAtual)
    // ═══════════════════════════════════════════════════════
    const _origBossAI = window.eventoBossAI;
    if (typeof _origBossAI === 'function' && !_origBossAI._v25) {
        window.eventoBossAI = async function() {
            if (!window._nacaoAtivo) return _origBossAI.apply(this, arguments);

            const nacaoId = window._nacaoBatalha?.nacaoId;
            const nacaoCfgId = 'nacao_' + nacaoId;
            const cfg = (typeof EVENTO_BOSSES !== 'undefined') ? EVENTO_BOSSES[nacaoCfgId] : null;

            if (cfg) {
                const enemyId = Array.isArray(window.storyEnemiesRemaining) && window.storyEnemiesRemaining[0];
                const enemy = enemyId && STORY_ENEMIES?.[enemyId];
                if (enemy) {
                    if (enemy.skill1 && enemy.skill2) cfg.skills = [enemy.skill1, enemy.skill2];
                    if (typeof enemy.atk === 'number' && enemy.atk > 0) cfg.atk = enemy.atk;
                }
            }
            return _origBossAI.apply(this, arguments);
        };
        window.eventoBossAI._v25 = true;
    }

    // ═══════════════════════════════════════════════════════
    // FIX 2: eventoAplicarSkill — fallback SEGURO (3×3 no boss)
    // em vez de cair no _dmgGlobal original
    // ═══════════════════════════════════════════════════════
    const _origApply = window.eventoAplicarSkill;
    if (typeof _origApply === 'function' && !_origApply._v25) {
        window.eventoAplicarSkill = async function(enemy, skill) {
            if (window._nacaoAtivo && skill && skill.handler) {
                const handler = window.NACAO_SKILL_HANDLERS?.[skill.handler];

                if (typeof handler === 'function') {
                    try {
                        console.log(`[nacoes] Handler: ${skill.handler} (atk=${enemy.atk})`);
                        return await handler(enemy, skill);
                    } catch (e) {
                        console.warn('[nacoes] Handler erro:', e);
                        return;
                    }
                }

                // ⭐ Fallback SEGURO: 3×3 no boss (NÃO usa _dmgGlobal)
                console.warn(`[nacoes] Handler NÃO ENCONTRADO: ${skill.handler}. Usando fallback 3×3.`);
                const c = getBoss();
                const atk = (typeof enemy.atk === 'number' && enemy.atk > 0) ? enemy.atk : 4;
                if (typeof _dmgEmTiles === 'function' && typeof _area === 'function') {
                    _dmgEmTiles(_area(c.x, c.y, 1), atk);
                }
                return;
            }
            return _origApply.apply(this, arguments);
        };
        window.eventoAplicarSkill._v25 = true;
    }

    // ═══════════════════════════════════════════════════════
    // FIX 3 (OPÇÃO B): Skill 2 do Yúcahu limitada a 5×5 do boss
    // (só aplica se quiser — comente pra manter "todos tiles TERRA")
    // ═══════════════════════════════════════════════════════
    const MUDAR_SKILL_YUCAHU_PARA_5X5 = true; // ← mude pra false se quiser manter

    if (MUDAR_SKILL_YUCAHU_PARA_5X5 && window.NACAO_SKILL_HANDLERS) {
        window.NACAO_SKILL_HANDLERS['nacao_yucahu_colheita'] = async (enemy, skill) => {
            _log(`🌱 ${enemy.nome}: ${skill.nome}!`);
            try { if (typeof playSfx === 'function') playSfx('minoa2'); } catch(e) {}
            const c = getBoss();
            const area5x5 = _area(c.x, c.y, 2);
            const areaSet = new Set(area5x5.map(t => `${t.x},${t.y}`));
            const terraTiles = [];
            if (typeof grid !== 'undefined') {
                for (let i = 0; i < 64; i++) {
                    const x = i % 8, y = Math.floor(i / 8);
                    if (grid[i] === 'TERRA' && areaSet.has(`${x},${y}`)) {
                        terraTiles.push({ x, y });
                    }
                }
            }
            terraTiles.forEach((t, i) => setTimeout(() => {
                if (typeof spawnFxAt === 'function') spawnFxAt('impact','fx-impact',t.x,t.y,{duration:600,scale:1.0});
            }, i*30));
            await (h._sleep ? h._sleep(700) : new Promise(r => setTimeout(r, 700)));
            const dano = Math.max(1, Math.ceil((enemy.atk || 4) / 2));
            _dmgEmTiles(terraTiles, dano);
            _log(`🌱 ${terraTiles.length} tiles TERRA (na 5×5 do boss) atingidos (${dano} dano)`);
        };
    }

    // ═══════════════════════════════════════════════════════
    // DEBUG
    // ═══════════════════════════════════════════════════════
    window._debugV25 = function() {
        console.group('=== V2.5 ===');
        console.log('V2.5 ativo?', window._nacoesV25);
        const nacaoId = window._nacaoBatalha?.nacaoId;
        if (nacaoId) {
            const cfg = EVENTO_BOSSES?.['nacao_' + nacaoId];
            console.log('Nação:', nacaoId);
            console.log('cfg.atk:', cfg?.atk);
            console.log('cfg.skills:', cfg?.skills?.map(s => s.handler));
            const enemyId = storyEnemiesRemaining?.[0];
            const enemy = enemyId && STORY_ENEMIES?.[enemyId];
            console.log('enemy atual:', enemyId, 'atk:', enemy?.atk);
            console.log('Handlers registrados:', Object.keys(window.NACAO_SKILL_HANDLERS || {}).length);
        } else {
            console.log('(fora de batalha)');
        }
        console.log('Skill Yúcahu 5×5?', MUDAR_SKILL_YUCAHU_PARA_5X5);
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V2.5] Fix aplicado');
    console.log('═══════════════════════════════════════════════════');
    console.log('• cfg.atk sincronizado (fix do NaN)');
    console.log('• Fallback de handler vira 3×3 no boss (NÃO global)');
    console.log('• Skill 2 Yúcahu: só tiles TERRA dentro de 5×5 do boss');
    console.log('  (pra voltar: mude MUDAR_SKILL_YUCAHU_PARA_5X5 = false)');
    console.log('');
    console.log('💡 Debug: window._debugV25()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// nacoes.js — V2.6 — Correção: skill não cai mais em dano global
//                        + banner de skill + fix progresso + fix Abya/Rudá
// =================================================================
(function nacoesV26() {
    if (window._nacoesV26) return;
    window._nacoesV26 = true;

    // ═══════════════════════════════════════════════════════
    // FIX 1: eventoAplicarSkill — NUNCA cai em dano global
    // ═══════════════════════════════════════════════════════
    const _origApply = window.eventoAplicarSkill;
    if (typeof _origApply === 'function' && !_origApply._v26) {
        window.eventoAplicarSkill = async function(enemy, skill) {
            // Usa _nacaoBatalha.ativa (mais confiável que _nacaoAtivo)
            const emNacao = (window._nacaoBatalha?.ativa === true) || window._nacaoAtivo === true;

            if (emNacao && skill?.handler) {
                window._nacaoAtivo = true; // força (redundância)

                const handler = window.NACAO_SKILL_HANDLERS?.[skill.handler];
                const atkFinal = (typeof enemy.atk === 'number' && !isNaN(enemy.atk) && enemy.atk > 0)
                    ? enemy.atk : 4;

                console.log(`%c[V2.6 SKILL] ${enemy.nome} → ${skill.nome} (atk=${atkFinal})`,
                    'color:#e74c3c;font-weight:bold;');

                if (typeof handler === 'function') {
                    try {
                        return await handler({ ...enemy, atk: atkFinal }, skill);
                    } catch (e) {
                        console.error(`[V2.6] Handler ${skill.handler} falhou:`, e);
                    }
                } else {
                    console.warn(`[V2.6] Handler ${skill.handler} não encontrado. Fallback 3×3.`);
                }

                // Fallback SEGURO: 3×3 no boss (nunca global)
                const c = (typeof boss !== 'undefined' && boss) ? { x: boss.x, y: boss.y } : { x: 4, y: 0 };
                if (typeof spawnFxAt === 'function') {
                    spawnFxAt('impact', 'fx-impact', c.x, c.y, { duration: 800, scale: 1.5 });
                }
                if (typeof applyDmg === 'function' && typeof players !== 'undefined') {
                    players.forEach(p => {
                        if (!p.dead && Math.abs(p.x - c.x) <= 1 && Math.abs(p.y - c.y) <= 1) {
                            applyDmg(p, atkFinal);
                        }
                    });
                }
                return;
            }
            return _origApply.apply(this, arguments);
        };
        window.eventoAplicarSkill._v26 = true;
        console.log('[V2.6] eventoAplicarSkill protegido (fallback 3×3)');
    }

    // ═══════════════════════════════════════════════════════
    // FIX 2: Banner visual anunciando cada skill
    // ═══════════════════════════════════════════════════════
    if (!document.getElementById('nacaoSkillBannerCSS')) {
        const st = document.createElement('style');
        st.id = 'nacaoSkillBannerCSS';
        st.textContent = `
            @keyframes nacaoSkillBannerAnim {
                0%   { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                15%  { opacity: 1; transform: translateX(-50%) translateY(0); }
                85%  { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-5px); }
            }
            .nacao-skill-banner {
                position: fixed; top: 80px; left: 50%;
                padding: 12px 24px;
                background: linear-gradient(180deg, rgba(168,50,50,0.95), rgba(90,20,20,0.95));
                border: 2px solid #e74c3c; border-radius: 8px;
                color: #fff; font-family: 'Cinzel', serif; font-weight: 700;
                font-size: 1rem; text-shadow: 0 2px 4px rgba(0,0,0,0.9);
                letter-spacing: 1.5px; z-index: 99999; pointer-events: none;
                box-shadow: 0 4px 20px rgba(0,0,0,0.7), 0 0 30px rgba(231,76,60,0.5);
                animation: nacaoSkillBannerAnim 1.4s ease-out forwards;
            }
        `;
        document.head.appendChild(st);
    }

    const H = window.NACAO_SKILL_HANDLERS;
    if (H && !H._v26Wrapped) {
        const origHandlers = {};
        Object.keys(H).forEach(k => {
            if (k.startsWith('_')) return;
            origHandlers[k] = H[k];
            H[k] = async function(enemy, skill) {
                try {
                    const banner = document.createElement('div');
                    banner.className = 'nacao-skill-banner';
                    banner.innerHTML = `👹 ${enemy.nome} — ${skill.nome}`;
                    document.body.appendChild(banner);
                    setTimeout(() => banner.remove(), 1500);
                } catch (e) {}
                return origHandlers[k].apply(this, arguments);
            };
        });
        H._v26Wrapped = true;
        console.log('[V2.6] Banner adicionado aos handlers');
    }

    // ═══════════════════════════════════════════════════════
    // FIX 3: Progresso — marca com _nacaoBatalha.ativa
    // ═══════════════════════════════════════════════════════
    const _origFinish = window.finishStoryPhase;
    if (typeof _origFinish === 'function' && !_origFinish._v26Fix) {
        window.finishStoryPhase = function(victory) {
            const b = window._nacaoBatalha || {};
            const emNacao = b.ativa === true || window._nacaoAtivo === true;

            console.log(`[V2.6] finishStoryPhase(victory=${victory}, ativa=${b.ativa}, nacaoAtivo=${window._nacaoAtivo})`);

            if (emNacao && victory && b.nacaoId && b.faseId && b.nacaoId !== 'pesadelo') {
                try {
                    const diff = b.dificuldade || (typeof storyCurrentDifficulty !== 'undefined' ? storyCurrentDifficulty : 'normal');
                    if (!STORY_PROGRESS.nacaoProgressoPorDificuldade) STORY_PROGRESS.nacaoProgressoPorDificuldade = {};
                    if (!STORY_PROGRESS.nacaoProgressoPorDificuldade[diff]) STORY_PROGRESS.nacaoProgressoPorDificuldade[diff] = {};
                    const semana = (typeof window.getWeekId === 'function') ? window.getWeekId() : 'fallback';
                    const cur = STORY_PROGRESS.nacaoProgressoPorDificuldade[diff][b.nacaoId];
                    if (!cur || cur.semana !== semana) {
                        STORY_PROGRESS.nacaoProgressoPorDificuldade[diff][b.nacaoId] = { fasesConcluidas: [], bossDerrotados: [], semana };
                    }
                    const prog = STORY_PROGRESS.nacaoProgressoPorDificuldade[diff][b.nacaoId];
                    if (!prog.fasesConcluidas.includes(b.faseId)) prog.fasesConcluidas.push(b.faseId);
                    if (typeof saveStoryProgress === 'function') saveStoryProgress();
                    console.log(`%c[V2.6 ✅] Fase ${b.faseId} de ${b.nacaoId} marcada (diff=${diff})`,
                        'color:#27ae60;font-weight:bold;');
                } catch (e) { console.error('[V2.6] erro ao marcar:', e); }
            }

            if (emNacao) {
                    window._nacaoAtivo = false;
                    window._eventoAtivo = false;
                    window._nacaoBatalha = { ativa: false };
           }
            return _origFinish.apply(this, arguments);
        };
        window.finishStoryPhase._v26Fix = true;
    }

    // ═══════════════════════════════════════════════════════
    // FIX 4: Abya + Rudá (starsNeeded = null)
    // ═══════════════════════════════════════════════════════
    if (typeof STORY_HERO_CLASSES !== 'undefined') {
        if (STORY_HERO_CLASSES['Abya']) STORY_HERO_CLASSES['Abya'].starsNeeded = null;
        if (STORY_HERO_CLASSES['Rudá']) STORY_HERO_CLASSES['Rudá'].starsNeeded = null;
    }
    function _limparEspeciais() {
        if (typeof STORY_PROGRESS === 'undefined') return;
        if (!Array.isArray(STORY_PROGRESS.unlockedHeroesStory)) return;
        let mudou = false;
        if ((STORY_PROGRESS.nacaoFragmentos?.length || 0) < 7) {
            const idx = STORY_PROGRESS.unlockedHeroesStory.indexOf('Abya');
            if (idx !== -1) {
                STORY_PROGRESS.unlockedHeroesStory.splice(idx, 1);
                STORY_PROGRESS.abyaDesbloqueado = false;
                mudou = true;
                console.log('[V2.6] Abya removido (faltam fragmentos)');
            }
        }
        if ((STORY_PROGRESS.eventoFragmentos?.length || 0) < 7) {
            const idx = STORY_PROGRESS.unlockedHeroesStory.indexOf('Rudá');
            if (idx !== -1) {
                STORY_PROGRESS.unlockedHeroesStory.splice(idx, 1);
                STORY_PROGRESS.eventoRudaDesbloqueado = false;
                mudou = true;
                console.log('[V2.6] Rudá removido (faltam fragmentos)');
            }
        }
        if (mudou && typeof saveStoryProgress === 'function') saveStoryProgress();
    }
    _limparEspeciais();
    setTimeout(_limparEspeciais, 2000);

    // ═══════════════════════════════════════════════════════
    // FIX 5: Ouro — alert garantido + toast
    // ═══════════════════════════════════════════════════════
    const _origIniciar = window._nacaoIniciarFase;
    if (typeof _origIniciar === 'function' && !_origIniciar._v26) {
        window._nacaoIniciarFase = async function(nacaoId, faseId) {
            const diff = (typeof storyCurrentDifficulty !== 'undefined') ? storyCurrentDifficulty : 'normal';
            const custo = window._nacaoConfig?.custoEntrada?.[diff] || 500;
            const gold = STORY_PROGRESS.gold || 0;
            if (gold < custo) {
                console.warn(`[V2.6] Sem ouro: ${gold}/${custo}`);
                if (typeof showToast === 'function') {
                    showToast('💰', `Faltam ${custo - gold} de ouro!`, '💰');
                }
                alert(`💰 OURO INSUFICIENTE\n\nVocê tem: ${gold}\nPrecisa: ${custo}\nFaltam: ${custo - gold}\n\nGanhe ouro completando fases do modo história ou vendendo materiais no Curandeiro.`);
                return;
            }
            return _origIniciar.apply(this, arguments);
        };
        window._nacaoIniciarFase._v26 = true;
    }

    // ═══════════════════════════════════════════════════════
    // FIX 6: Debug helpers
    // ═══════════════════════════════════════════════════════
    window._forcarOuro = function(qtd) {
        STORY_PROGRESS.gold = (STORY_PROGRESS.gold || 0) + (qtd || 10000);
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        console.log(`💰 +${qtd||10000} ouro. Saldo: ${STORY_PROGRESS.gold}`);
    };
    window._forcarXP = function(qtd) {
        STORY_PROGRESS.totalXP = (STORY_PROGRESS.totalXP || 0) + (qtd || 10000);
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        console.log(`⭐ +${qtd||10000} XP. Total: ${STORY_PROGRESS.totalXP}`);
    };
    window._forcarTudo = function() {
        window._forcarOuro(50000);
        window._forcarXP(50000);
    };
    window._resetAbya = function() {
        STORY_PROGRESS.nacaoFragmentos = [];
        STORY_PROGRESS.abyaDesbloqueado = false;
        if (Array.isArray(STORY_PROGRESS.unlockedHeroesStory)) {
            STORY_PROGRESS.unlockedHeroesStory = STORY_PROGRESS.unlockedHeroesStory.filter(h => h !== 'Abya');
        }
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        console.log('🌎 Abya resetado');
    };
    window._resetRuda = function() {
        STORY_PROGRESS.eventoFragmentos = [];
        STORY_PROGRESS.eventoRudaDesbloqueado = false;
        if (Array.isArray(STORY_PROGRESS.unlockedHeroesStory)) {
            STORY_PROGRESS.unlockedHeroesStory = STORY_PROGRESS.unlockedHeroesStory.filter(h => h !== 'Rudá');
        }
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        console.log('🌑 Rudá resetado');
    };
    window._debugNacaoEstado = function() {
        console.group('=== V2.6 Estado ===');
        console.log('Ouro:', STORY_PROGRESS.gold);
        console.log('XP:', STORY_PROGRESS.totalXP);
        console.log('Fragmentos Nações:', STORY_PROGRESS.nacaoFragmentos?.length || 0);
        console.log('Fragmentos Selados:', STORY_PROGRESS.eventoFragmentos?.length || 0);
        console.log('Abya desbloqueado:', STORY_PROGRESS.abyaDesbloqueado);
        console.log('Rudá desbloqueado:', STORY_PROGRESS.eventoRudaDesbloqueado);
        console.log('Heróis desbloqueados:', STORY_PROGRESS.unlockedHeroesStory);
        console.log('');
        console.log('Progresso nações (por diff):');
        const prog = STORY_PROGRESS.nacaoProgressoPorDificuldade;
        if (prog) Object.keys(prog).forEach(d => console.log(`  [${d}]`, prog[d]));
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V2.6] Correções + FX visual + Debug');
    console.log('═══════════════════════════════════════════════════');
    console.log('🔧 Skill NUNCA cai em dano global (fallback = 3×3)');
    console.log('🎨 Banner visual mostra a skill usada');
    console.log('📋 Marcação de fase com log de diagnóstico');
    console.log('🌎 Abya e Rudá: starsNeeded=null (não mais liberado)');
    console.log('💰 Falta de ouro: alert visível');
    console.log('');
    console.log('💡 DEBUG:');
    console.log('  window._forcarTudo()        → +50k ouro +50k XP');
    console.log('  window._debugNacaoEstado()  → estado completo');
    console.log('  window._resetAbya()         → resetar Abya');
    console.log('  window._resetRuda()         → resetar Rudá');
    console.log('');
    console.log('📋 TESTE:');
    console.log('1. F12 (console)');
    console.log('2. window._forcarTudo()');
    console.log('3. Jogue fase 1');
    console.log('4. Observe [V2.6 SKILL] e banner no topo');
    console.log('5. Ao vencer, veja [V2.6 ✅] no console');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// nacoes.js — V2.7 — Fix DEFINITIVO: intercepta applyStorySkill
// -----------------------------------------------------------------
// • Corrige a causa raiz (V12.1 desvia pra storyEnemyAI → applyStorySkill)
// • Handlers também copiados pra STORY_ANIMAL_SKILLS (fallback duplo)
// • Sprites dos deuses: SVG fallback visível (emoji) em vez de invisível
// • Backup automático de XP contra zeragem
// =================================================================
(function nacoesV27() {
    if (window._nacoesV27) return;
    window._nacoesV27 = true;

    // ═══════════════════════════════════════════════════════
    // FIX 1 — INTERCEPTAR applyStorySkill (PONTO REAL DE FALHA)
    // ═══════════════════════════════════════════════════════
    const _origApplyStory = window.applyStorySkill;
    if (typeof _origApplyStory === 'function' && !_origApplyStory._v27) {
        window.applyStorySkill = async function(enemy, skill) {
            const emNacao = window._nacaoBatalha?.ativa === true;
            const ehNacaoHandler = skill?.handler && String(skill.handler).startsWith('nacao_');

            if (emNacao && ehNacaoHandler) {
                const handler = window.NACAO_SKILL_HANDLERS?.[skill.handler];

                if (typeof handler === 'function') {
                    console.log(`%c[V2.7 ✅] Handler chamado: ${skill.handler} (atk=${enemy.atk})`,
                        'color:#27ae60;font-weight:bold;');
                    try {
                        return await handler(enemy, skill);
                    } catch (e) {
                        console.error(`[V2.7] Handler ${skill.handler} falhou:`, e);
                        return;
                    }
                }

                // Handler não registrado → fallback SEGURO 3×3 (nunca dano direto em 1 herói)
                console.warn(`[V2.7] Handler ausente: ${skill.handler}. Fallback 3×3 no boss.`);
                const c = (typeof boss !== 'undefined' && boss) ? { x: boss.x, y: boss.y } : { x: 4, y: 0 };
                if (typeof spawnFxAt === 'function') {
                    spawnFxAt('impact', 'fx-impact', c.x, c.y, { duration: 800, scale: 1.5 });
                }
                if (typeof players !== 'undefined') {
                    players.forEach(p => {
                        if (!p.dead && Math.abs(p.x - c.x) <= 1 && Math.abs(p.y - c.y) <= 1) {
                            if (typeof applyDmg === 'function') applyDmg(p, enemy.atk);
                        }
                    });
                }
                return;
            }

            return _origApplyStory.apply(this, arguments);
        };
        window.applyStorySkill._v27 = true;
        console.log('[V2.7] applyStorySkill protegido (é AQUI que estava o bug)');
    }

    // ═══════════════════════════════════════════════════════
    // FIX 2 — Copiar handlers pra STORY_ANIMAL_SKILLS (fallback)
    // Mesmo se o hook falhar, o original acha.
    // ═══════════════════════════════════════════════════════
    if (window.STORY_ANIMAL_SKILLS && window.NACAO_SKILL_HANDLERS) {
        let copiados = 0;
        Object.keys(window.NACAO_SKILL_HANDLERS).forEach(k => {
            if (k.startsWith('_')) return;
            if (!window.STORY_ANIMAL_SKILLS[k]) {
                window.STORY_ANIMAL_SKILLS[k] = window.NACAO_SKILL_HANDLERS[k];
                copiados++;
            }
        });
        console.log(`[V2.7] ${copiados} handlers copiados pra STORY_ANIMAL_SKILLS (fallback)`);
    }

    // ═══════════════════════════════════════════════════════
    // FIX 3 — Sprites dos deuses com SVG fallback (emoji visível)
    // O V12.6 marcava "Invisível" porque SPRITES_STORY estava vazio.
    // ═══════════════════════════════════════════════════════
    if (typeof SPRITES_STORY !== 'undefined') {
        const emojis = window.NACAO_EMOJIS || {};
        let injetados = 0;
        Object.keys(emojis).forEach(k => {
            if (!SPRITES_STORY[k] || String(SPRITES_STORY[k]).trim() === '') {
                const emoji = emojis[k];
                const svg =
                    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">` +
                    `<text x="50" y="50" font-size="80" text-anchor="middle" dominant-baseline="central" ` +
                    `font-family="Arial,sans-serif">${emoji}</text></svg>`;
                try {
                    SPRITES_STORY[k] = 'data:image/svg+xml;base64,' +
                        btoa(unescape(encodeURIComponent(svg)));
                    injetados++;
                } catch (e) {}
            }
        });
        console.log(`[V2.7] ${injetados} sprites SVG (emoji) injetados`);
    }

    // ═══════════════════════════════════════════════════════
    // FIX 4 — Backup de XP contra zeragem
    // ═══════════════════════════════════════════════════════
    const _origSave = window.saveStoryProgress;
    if (typeof _origSave === 'function' && !_origSave._v27) {
        window.saveStoryProgress = function() {
            try {
                if (STORY_PROGRESS && STORY_PROGRESS.totalXP > 0) {
                    const prev = parseInt(localStorage.getItem('_xpBackupV27') || '0');
                    if (STORY_PROGRESS.totalXP > prev) {
                        localStorage.setItem('_xpBackupV27', String(STORY_PROGRESS.totalXP));
                    }
                }
            } catch (e) {}
            return _origSave.apply(this, arguments);
        };
        window.saveStoryProgress._v27 = true;
    }

    // Restaura XP se zerou (só se tinha antes)
    setTimeout(() => {
        try {
            const backup = parseInt(localStorage.getItem('_xpBackupV27') || '0');
            if (backup > 0 && STORY_PROGRESS && STORY_PROGRESS.totalXP === 0) {
                STORY_PROGRESS.totalXP = backup;
                if (typeof window.saveStoryProgress === 'function') window.saveStoryProgress();
                console.log(`%c[V2.7 ✅] XP restaurado do backup: ${backup}`,
                    'color:#27ae60;font-weight:bold;');
            }
        } catch (e) {}
    }, 2500);

    // ═══════════════════════════════════════════════════════
    // FIX 5 — Debug
    // ═══════════════════════════════════════════════════════
    window._debugV27 = function() {
        console.group('=== V2.7 DEBUG ===');
        console.log('V2.7 ativo?', window._nacoesV27);
        console.log('applyStorySkill hookado?', window.applyStorySkill?._v27);
        console.log('');
        console.log('_nacaoBatalha:', window._nacaoBatalha);
        console.log('_nacaoAtivo:', window._nacaoAtivo);
        console.log('_eventoAtivo:', window._eventoAtivo);
        console.log('');
        console.log('Enemy atual:', storyEnemiesRemaining?.[0]);
        const enemy = storyEnemiesRemaining?.[0] && STORY_ENEMIES?.[storyEnemiesRemaining[0]];
        if (enemy) {
            console.log('  nome:', enemy.nome, '| atk:', enemy.atk);
            console.log('  skill1:', enemy.skill1?.handler);
            console.log('  skill2:', enemy.skill2?.handler);
        }
        console.log('');
        console.log('Handlers NACAO_SKILL_HANDLERS:', Object.keys(window.NACAO_SKILL_HANDLERS || {}).length);
        console.log('Handlers STORY_ANIMAL_SKILLS (nacao_*):',
            Object.keys(window.STORY_ANIMAL_SKILLS || {}).filter(k => k.startsWith('nacao_')).length);
        console.log('');
        console.log('XP backup:', localStorage.getItem('_xpBackupV27'));
        console.log('XP atual:', STORY_PROGRESS?.totalXP);
        console.log('Ouro atual:', STORY_PROGRESS?.gold);
        console.groupEnd();
    };

    window._simularSkillNacao = async function(handlerKey) {
        if (!handlerKey) {
            console.log('Uso: _simularSkillNacao("nacao_yucahu_raizes")');
            return;
        }
        const enemy = {
            id: 'test', nome: 'Teste', atk: 4,
        };
        const skill = { nome: 'Teste', handler: handlerKey };
        console.log(`[teste] Chamando ${handlerKey}...`);
        try {
            await window.applyStorySkill(enemy, skill);
            console.log('[teste] OK');
        } catch (e) {
            console.error('[teste] falhou:', e);
        }
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V2.7] Fix DEFINITIVO do dano das skills');
    console.log('═══════════════════════════════════════════════════');
    console.log('🎯 Raiz: applyStorySkill (V12.1 desvia pra storyEnemyAI)');
    console.log('🎯 Handlers agora chamados corretamente');
    console.log('🎯 Fallback: 3×3 no boss (nunca dano em 1 herói)');
    console.log('🖼️ Sprites SVG (emoji) em vez de invisível');
    console.log('💾 Backup de XP contra zeragem');
    console.log('');
    console.log('📋 TESTE:');
    console.log('1. Jogue fase 1 da nação do dia');
    console.log('2. Console deve mostrar [V2.7 ✅] Handler chamado: nacao_yucahu_raizes');
    console.log('3. Banner no topo + FX na área + som');
    console.log('4. Ao vencer: [V2.6 ✅] Fase marcada');
    console.log('');
    console.log('💡 Debug: window._debugV27()');
    console.log('💡 Testar skill: window._simularSkillNacao("nacao_yucahu_raizes")');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// nacoes.js — V2.8 — FIX: recompensa de fase + backup + desbloqueio
// -----------------------------------------------------------------
// Causa raiz:
//   • handleStoryPhaseVictory recebe phase=null → retorna sem recompensa
//   • V17.0 do historia.js bloqueia finishStoryPhase quando
//     _eventoBatalha.ativa=true (contaminação do Sete Selados)
//
// Fix:
//   • Aplica XP + ouro + essência DIRETAMENTE no finishStoryPhase
//   • Zera _eventoBatalha.ativa antes de chamar _origFinish (desbloqueia)
//   • Mostra tela de vitória manualmente
//   • Backup automático de XP/ouro (restaura se zerar)
// =================================================================
(function nacoesV28() {
    if (window._nacoesV28) return;
    window._nacoesV28 = true;

    const CONFIG = window._nacaoConfig || { moedaId: 'essencia_ancestral' };
    const NACOES = window.NACOES || {};

    // ═══════════════════════════════════════════════════════
    // RECOMPENSA POR FASE
    // ═══════════════════════════════════════════════════════
    const XP_POR_FASE   = { '1': 200, '2': 350, '3': 500 };
    const OURO_POR_FASE = { '1': 150, '2': 250, '3': 400 };
    const ESS_POR_FASE  = { '1': 3,   '2': 6,   '3': 12 };

    // ═══════════════════════════════════════════════════════
    // BACKUP DE OURO/XP (contra qualquer zeragem)
    // ═══════════════════════════════════════════════════════
    const KEY_BK_OURO = '_nacaoOuroBackup';
    const KEY_BK_XP   = '_nacaoXPBackup';

    function backupOuroXP() {
        try {
            const g = STORY_PROGRESS?.gold || 0;
            const x = STORY_PROGRESS?.totalXP || 0;
            const gPrev = parseInt(localStorage.getItem(KEY_BK_OURO) || '0');
            const xPrev = parseInt(localStorage.getItem(KEY_BK_XP) || '0');
            if (g > gPrev) localStorage.setItem(KEY_BK_OURO, String(g));
            if (x > xPrev) localStorage.setItem(KEY_BK_XP, String(x));
        } catch (e) {}
    }

    function restaurarSeZerou() {
        try {
            const g = STORY_PROGRESS?.gold || 0;
            const x = STORY_PROGRESS?.totalXP || 0;
            const gBk = parseInt(localStorage.getItem(KEY_BK_OURO) || '0');
            const xBk = parseInt(localStorage.getItem(KEY_BK_XP) || '0');
            let mudou = false;
            if (g === 0 && gBk > 0) {
                STORY_PROGRESS.gold = gBk;
                console.log(`[V2.8] 💰 Ouro restaurado do backup: ${gBk}`);
                mudou = true;
            }
            if (x === 0 && xBk > 0) {
                STORY_PROGRESS.totalXP = xBk;
                console.log(`[V2.8] ⭐ XP restaurado do backup: ${xBk}`);
                mudou = true;
            }
            if (mudou && typeof saveStoryProgress === 'function') saveStoryProgress();
        } catch (e) {}
    }

    // Hook em saveStoryProgress: backup automático a cada save
    const _origSave = window.saveStoryProgress;
    if (typeof _origSave === 'function' && !_origSave._v28) {
        window.saveStoryProgress = function() {
            backupOuroXP();
            return _origSave.apply(this, arguments);
        };
        window.saveStoryProgress._v28 = true;
    }

    // ═══════════════════════════════════════════════════════
    // finishStoryPhase CUSTOMIZADO
    // ═══════════════════════════════════════════════════════
    const _origFinish = window.finishStoryPhase;
    if (typeof _origFinish === 'function' && !_origFinish._v28) {
        window.finishStoryPhase = function(victory) {
            const b = window._nacaoBatalha || {};
            const emNacao = b.ativa === true || window._nacaoAtivo === true;

            console.log(`[V2.8] finishStoryPhase(victory=${victory}, nacaoId=${b.nacaoId}, faseId=${b.faseId})`);

            if (emNacao) {
                // ⭐ ZERA flags ANTES (para o V17.0 do história.js NÃO bloquear)
                window._eventoAtivo = false;
                if (window._eventoBatalha && typeof window._eventoBatalha === 'object') {
                    window._eventoBatalha.ativa = false;
                }

                // ⭐ APLICA RECOMPENSA (vitória)
                if (victory && b.nacaoId && b.faseId && b.nacaoId !== 'pesadelo') {
                    const faseKey = String(b.faseId);
                    const diff = b.dificuldade || 'normal';
                    const mult = { normal: 1, dificil: 1.5, pesadelo: 2.2 }[diff] || 1;

                    const xpGanho   = Math.floor((XP_POR_FASE[faseKey] || 200) * mult);
                    const ouroGanho = Math.floor((OURO_POR_FASE[faseKey] || 150) * mult);
                    const essGanho  = Math.floor((ESS_POR_FASE[faseKey] || 3) * mult);

                    STORY_PROGRESS.totalXP = (STORY_PROGRESS.totalXP || 0) + xpGanho;
                    STORY_PROGRESS.gold    = (STORY_PROGRESS.gold || 0) + ouroGanho;
                    STORY_PROGRESS.inventory[CONFIG.moedaId] =
                        (STORY_PROGRESS.inventory[CONFIG.moedaId] || 0) + essGanho;

                    backupOuroXP();
                    if (typeof saveStoryProgress === 'function') saveStoryProgress();

                    console.log(`%c[V2.8 ✅] +${xpGanho} XP · +${ouroGanho} ouro · +${essGanho} essência`,
                        'color:#27ae60;font-weight:bold;font-size:12px;');
                    console.log(`   Saldo: XP=${STORY_PROGRESS.totalXP}, Ouro=${STORY_PROGRESS.gold}`);
                }

                // ⭐ Salva ANTES de chamar _origFinish
                if (typeof saveStoryProgress === 'function') saveStoryProgress();

                // ⭐ Chama _origFinish (com flags zeradas → não bloqueia)
                // Ele faz o reset de storyBattleActive, gameScreen etc.
                try {
                    _origFinish.call(this, victory);
                } catch (e) {
                    console.warn('[V2.8] _origFinish falhou (ok, continuando):', e);
                }

                // ⭐ Mostra tela de vitória (o _origFinish não faz com phase=null)
                if (victory) {
                    setTimeout(() => {
                        try {
                            const nacaoCfg = NACOES[b.nacaoId];
                            const fake = {
                                id: `${b.nacaoId}_${b.faseId}`,
                                name: `${nacaoCfg?.nome || b.nacaoId} — Fase ${b.faseId}`,
                                isBoss: b.faseId === '3',
                                isFinalBoss: false,
                                enemies: (nacaoCfg?.deuses || []).slice(0, parseInt(b.faseId)),
                            };
                            if (typeof showStoryVictoryScreen === 'function') {
                                showStoryVictoryScreen(
                                    fake,
                                    [],
                                    { xp: Math.floor((XP_POR_FASE[b.faseId] || 200) * ({normal:1,dificil:1.5,pesadelo:2.2}[b.dificuldade||'normal']||1)),
                                      gold: Math.floor((OURO_POR_FASE[b.faseId] || 150) * ({normal:1,dificil:1.5,pesadelo:2.2}[b.dificuldade||'normal']||1)) },
                                    {
                                        stars: 3,
                                        totalStars: (typeof getTotalStars === 'function') ? getTotalStars() : 0,
                                        unlockedHeroes: [],
                                    }
                                );
                            }
                        } catch (e) { console.warn('[V2.8] erro tela vitória:', e); }
                    }, 120);
                }

                // Reset flags
                window._nacaoAtivo = false;
                window._eventoAtivo = false;
                window._nacaoBatalha = { ativa: false };
                return;
            }

            return _origFinish.apply(this, arguments);
        };
        window.finishStoryPhase._v28 = true;
        console.log('[V2.8] finishStoryPhase substituído (com recompensa + tela de vitória)');
    }

    // ═══════════════════════════════════════════════════════
    // Zera _eventoBatalha do Sete Selados ao iniciar nação
    // ═══════════════════════════════════════════════════════
    const _origIniciar = window.eventoIniciarBatalha;
    if (typeof _origIniciar === 'function' && !_origIniciar._v28) {
        window.eventoIniciarBatalha = async function(bossId, faseId) {
            if (typeof bossId === 'string' && bossId.startsWith('nacao_')) {
                window._nacaoAtivo = true;
                window._eventoAtivo = true;
                if (window._eventoBatalha && typeof window._eventoBatalha === 'object') {
                    window._eventoBatalha.ativa = false;
                }
            }
            return _origIniciar.apply(this, arguments);
        };
        window.eventoIniciarBatalha._v28 = true;
    }

    // ═══════════════════════════════════════════════════════
    // Restauração + watchdog
    // ═══════════════════════════════════════════════════════
    setTimeout(restaurarSeZerou, 300);
    setTimeout(restaurarSeZerou, 2000);

    setInterval(() => {
        const g = STORY_PROGRESS?.gold || 0;
        const x = STORY_PROGRESS?.totalXP || 0;
        const gBk = parseInt(localStorage.getItem(KEY_BK_OURO) || '0');
        const xBk = parseInt(localStorage.getItem(KEY_BK_XP) || '0');
        if ((g === 0 && gBk > 0) || (x === 0 && xBk > 0)) {
            restaurarSeZerou();
        }
    }, 5000);

    // ═══════════════════════════════════════════════════════
    // DEBUG
    // ═══════════════════════════════════════════════════════
    window._debugV28 = function() {
        console.group('=== V2.8 ===');
        console.log('Ouro:', STORY_PROGRESS?.gold);
        console.log('XP:', STORY_PROGRESS?.totalXP);
        console.log('Essência:', STORY_PROGRESS?.inventory?.[CONFIG.moedaId]);
        console.log('Backup ouro:', localStorage.getItem(KEY_BK_OURO));
        console.log('Backup XP:', localStorage.getItem(KEY_BK_XP));
        console.log('');
        console.log('_nacaoBatalha:', window._nacaoBatalha);
        console.log('_eventoBatalha:', window._eventoBatalha ? { ativa: window._eventoBatalha.ativa, bossId: window._eventoBatalha.bossId } : null);
        console.log('');
        console.log('Fases concluídas (por diff):');
        const prog = STORY_PROGRESS?.nacaoProgressoPorDificuldade || {};
        Object.keys(prog).forEach(d => console.log(`  [${d}]`, prog[d]));
        console.groupEnd();
    };

    window._resetarBackupOuroXP = function() {
        localStorage.removeItem(KEY_BK_OURO);
        localStorage.removeItem(KEY_BK_XP);
        console.log('Backup resetado');
    };

    // Restaura o backup em estado limpo (útil pra testes)
    window._restaurarBackup = function() {
        restaurarSeZerou();
        window._debugV28();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V2.8] Recompensa + backup aplicados');
    console.log('═══════════════════════════════════════════════════');
    console.log('💰 Recompensa por fase:');
    console.log('   Fase 1: +200 XP  +150 ouro  +3 essência');
    console.log('   Fase 2: +350 XP  +250 ouro  +6 essência');
    console.log('   Fase 3: +500 XP  +400 ouro  +12 essência');
    console.log('   (×1.5 no Difícil, ×2.2 no Pesadelo)');
    console.log('');
    console.log('💾 Backup automático de ouro/XP a cada save');
    console.log('🔄 Restauração automática se zerar');
    console.log('🚪 finishStoryPhase zerado do Sete Selados (não bloqueia mais)');
    console.log('');
    console.log('📋 TESTE:');
    console.log('1. Jogue uma fase');
    console.log('2. Ao vencer, veja:');
    console.log('   [V2.8 ✅] +200 XP · +150 ouro · +3 essência');
    console.log('   Saldo: XP=..., Ouro=...');
    console.log('3. Tela de vitória deve aparecer');
    console.log('');
    console.log('💡 Debug: window._debugV28()');
    console.log('💡 Restaurar backup: window._restaurarBackup()');
    console.log('💡 Resetar backup: window._resetarBackupOuroXP()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// nacoes.js — V2.9 — Fix do NaN + recompensa simples + sem backup
// -----------------------------------------------------------------
// Causa do NaN:
//   eventoFinalizarPartida do Sete Selados roda:
//     xpBase = cfg.recompensaXP  → undefined para nações
//     totalXP += Math.floor(NaN * mult)  → NaN
//
// Fix:
//   1. Intercepta eventoFinalizarPartida para nações (bloqueia)
//   2. finishStoryPhase soma XP/ouro/essência (recompensa simples)
//   3. Object.defineProperty protege gold/totalXP de NaN
//   4. Desativa backup automático (você não quer)
// =================================================================
(function nacoesV29() {
    if (window._nacoesV29) return;
    window._nacoesV29 = true;

    // ═══════════════════════════════════════════════════════
    // 1. INTERCEPTAR eventoFinalizarPartida (a origem do NaN)
    // ═══════════════════════════════════════════════════════
    const _origFinalizar = window.eventoFinalizarPartida;
    if (typeof _origFinalizar === 'function' && !_origFinalizar._v29) {
        window.eventoFinalizarPartida = async function(vitoria, saindo) {
            const emNacao = (window._nacaoBatalha?.ativa === true) || (window._nacaoAtivo === true);

            if (emNacao) {
                console.log('%c[V2.9] eventoFinalizarPartida BLOQUEADO (é nação) — chamando finishStoryPhase',
                    'color:#27ae60;font-weight:bold;');

                // Zera contaminação do Sete Selados
                window._eventoAtivo = false;
                if (window._eventoBatalha && typeof window._eventoBatalha === 'object') {
                    window._eventoBatalha.ativa = false;
                }

                // Chama finishStoryPhase (V2.8 aplica recompensa + mostra tela)
                if (typeof window.finishStoryPhase === 'function') {
                    window.finishStoryPhase(vitoria);
                }
                return;
            }
            return _origFinalizar.apply(this, arguments);
        };
        window.eventoFinalizarPartida._v29 = true;
    }

    // ═══════════════════════════════════════════════════════
    // 2. PROTEÇÃO CONTRA NaN em gold e totalXP
    // -------------------------------------------------------------
    // DefineProperty com setter que ignora NaN, Infinity, undefined.
    // Assim, mesmo se algum código fizer `totalXP += NaN`,
    // o valor original é mantido.
    // ═══════════════════════════════════════════════════════
    function aplicarNaNProtection() {
        if (typeof STORY_PROGRESS === 'undefined') return;

        ['gold', 'totalXP'].forEach(prop => {
            try {
                const desc = Object.getOwnPropertyDescriptor(STORY_PROGRESS, prop);
                if (desc && desc.get && desc._v29Prot) return;

                let valorInterno = (typeof STORY_PROGRESS[prop] === 'number' && !isNaN(STORY_PROGRESS[prop]))
                    ? STORY_PROGRESS[prop] : 0;

                Object.defineProperty(STORY_PROGRESS, prop, {
                    get() { return valorInterno; },
                    set(v) {
                        if (typeof v === 'number' && isFinite(v) && !isNaN(v)) {
                            valorInterno = v;
                        } else {
                            console.warn(`[V2.9] Bloqueado ${prop} = ${v} (mantido ${valorInterno})`);
                        }
                    },
                    configurable: true,
                    enumerable: true,
                });
                const nd = Object.getOwnPropertyDescriptor(STORY_PROGRESS, prop);
                if (nd) Object.defineProperty(STORY_PROGRESS, prop, { ...nd, _v29Prot: true });
            } catch (e) {
                console.warn(`[V2.9] Não foi possível proteger ${prop}:`, e);
            }
        });
    }
    aplicarNaNProtection();
    setTimeout(aplicarNaNProtection, 500);
    setTimeout(aplicarNaNProtection, 2000);

    // Re-aplicar após load de save (STORY_PROGRESS é substituído)
    const _origLoad = window.loadStoryProgressByName;
    if (typeof _origLoad === 'function' && !_origLoad._v29) {
        window.loadStoryProgressByName = function() {
            const r = _origLoad.apply(this, arguments);
            if (r) setTimeout(aplicarNaNProtection, 100);
            return r;
        };
        window.loadStoryProgressByName._v29 = true;
    }

    // ═══════════════════════════════════════════════════════
    // 3. DESATIVAR BACKUP AUTOMÁTICO (você não quer)
    // -------------------------------------------------------------
    // Bloqueia escrita/leitura dos backups. O restaurarSeZerou
    // do V2.8 vai receber 0 e não vai fazer nada.
    // ═══════════════════════════════════════════════════════
    window._desativarBackupAuto = true;

    if (!Storage.prototype.setItem._v29) {
        const _origSet = Storage.prototype.setItem;
        Storage.prototype.setItem = function(key, value) {
            if ((key === '_nacaoOuroBackup' || key === '_nacaoXPBackup') && window._desativarBackupAuto) {
                return; // ignora
            }
            return _origSet.call(this, key, value);
        };
        Storage.prototype.setItem._v29 = true;
    }

    if (!Storage.prototype.getItem._v29) {
        const _origGet = Storage.prototype.getItem;
        Storage.prototype.getItem = function(key) {
            if ((key === '_nacaoOuroBackup' || key === '_nacaoXPBackup') && window._desativarBackupAuto) {
                return '0'; // restaurarSeZerou não encontra nada
            }
            return _origGet.call(this, key);
        };
        Storage.prototype.getItem._v29 = true;
    }

    // Limpa backups existentes
    try {
        localStorage.removeItem('_nacaoOuroBackup');
        localStorage.removeItem('_nacaoXPBackup');
        localStorage.removeItem('_xpBackupV27');
    } catch (e) {}

    // ═══════════════════════════════════════════════════════
    // 4. Garantir que valores atuais são numéricos (corrige NaN existente)
    // ═══════════════════════════════════════════════════════
    setTimeout(() => {
        if (typeof STORY_PROGRESS === 'undefined') return;
        let corrigido = false;

        if (typeof STORY_PROGRESS.gold !== 'number' || isNaN(STORY_PROGRESS.gold)) {
            STORY_PROGRESS.gold = 0;
            corrigido = true;
            console.log('[V2.9] gold corrigido para 0');
        }
        if (typeof STORY_PROGRESS.totalXP !== 'number' || isNaN(STORY_PROGRESS.totalXP)) {
            STORY_PROGRESS.totalXP = 0;
            corrigido = true;
            console.log('[V2.9] totalXP corrigido para 0');
        }
        if (corrigido && typeof saveStoryProgress === 'function') saveStoryProgress();
    }, 300);

    // ═══════════════════════════════════════════════════════
    // 5. DEBUG
    // ═══════════════════════════════════════════════════════
    window._debugV29 = function() {
        console.group('=== V2.9 ===');
        console.log('Ouro:', STORY_PROGRESS?.gold, '(tipo:', typeof STORY_PROGRESS?.gold + ')');
        console.log('XP:  ', STORY_PROGRESS?.totalXP, '(tipo:', typeof STORY_PROGRESS?.totalXP + ')');
        console.log('Backup automático:', window._desativarBackupAuto ? 'DESATIVADO' : 'ativo');
        const gBk = (() => { try { return localStorage.getItem('_nacaoOuroBackup'); } catch(e){ return null; } })();
        const xBk = (() => { try { return localStorage.getItem('_nacaoXPBackup'); } catch(e){ return null; } })();
        console.log('Backup ouro:', gBk);
        console.log('Backup XP:', xBk);
        console.log('');
        console.log('_nacaoBatalha.ativa:', window._nacaoBatalha?.ativa);
        console.log('_nacaoAtivo:', window._nacaoAtivo);
        console.log('_eventoAtivo:', window._eventoAtivo);
        console.groupEnd();
    };

    window._reativarBackup = function() {
        window._desativarBackupAuto = false;
        console.log('[V2.9] Backup reativado');
    };
    window._desativarBackup = function() {
        window._desativarBackupAuto = true;
        try {
            localStorage.removeItem('_nacaoOuroBackup');
            localStorage.removeItem('_nacaoXPBackup');
        } catch (e) {}
        console.log('[V2.9] Backup desativado e backups limpos');
    };

    // ═══════════════════════════════════════════════════════
    // LOG FINAL
    // ═══════════════════════════════════════════════════════
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V2.9] NaN corrigido + backup desativado');
    console.log('═══════════════════════════════════════════════════');
    console.log('🎯 eventoFinalizarPartida bloqueado para nações');
    console.log('🎯 gold e totalXP protegidos de NaN');
    console.log('🎯 Backup automático DESATIVADO');
    console.log('🎯 Recompensa agora é soma simples:');
    console.log('   XP  += 200/350/500 (×mult diff)');
    console.log('   Ouro += 150/250/400 (×mult diff)');
    console.log('   Essência += 3/6/12 (×mult diff)');
    console.log('');
    console.log('💡 Debug: window._debugV29()');
    console.log('💡 Reativar backup: window._reativarBackup()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// nacoes.js — V2.10 — Vitória corrigida: marca fase + sem estrelas
// -----------------------------------------------------------------
// 1. Marca fase e dá recompensa em eventoFinalizarPartida
// 2. Reseta flags ANTES de chamar finishStoryPhase (V2.6/V2.8 pulam)
// 3. Tela de vitória SIMPLES (sem estrelas, sem acumular)
// 4. Override showStoryVictoryScreen bloqueia estrelas de nação
// =================================================================
(function nacoesV210() {
    if (window._nacoesV210) return;
    window._nacoesV210 = true;

    const NACOES = window.NACOES || {};
    const CONFIG = window._nacaoConfig || { moedaId: 'essencia_ancestral' };

    // ═══════════════════════════════════════════════════════
    // 1. eventoFinalizarPartida — marca + recompensa + tela simples
    // ═══════════════════════════════════════════════════════
    const _origFinalizar = window.eventoFinalizarPartida;

    window.eventoFinalizarPartida = async function(vitoria, saindo) {
        const b = window._nacaoBatalha || {};
        const emNacao = b.ativa === true || window._nacaoAtivo === true;

        if (emNacao) {
            const snap = {
                nacaoId: b.nacaoId,
                faseId: b.faseId,
                dificuldade: b.dificuldade || 'normal',
                isPesadeloNacao: !!b.isPesadeloNacao,
            };

            let xpG = 0, ouG = 0, esG = 0;

            // ─── Marca fase + recompensa (VITÓRIA) ───
            if (vitoria && snap.nacaoId && snap.faseId && snap.nacaoId !== 'pesadelo') {
                try {
                    const diff = snap.dificuldade;
                    if (!STORY_PROGRESS.nacaoProgressoPorDificuldade) STORY_PROGRESS.nacaoProgressoPorDificuldade = {};
                    if (!STORY_PROGRESS.nacaoProgressoPorDificuldade[diff]) STORY_PROGRESS.nacaoProgressoPorDificuldade[diff] = {};

                    const semana = (typeof window.getWeekId === 'function') ? window.getWeekId() : 'fallback';
                    let cur = STORY_PROGRESS.nacaoProgressoPorDificuldade[diff][snap.nacaoId];
                    if (!cur || cur.semana !== semana) {
                        cur = { fasesConcluidas: [], bossDerrotados: [], semana };
                        STORY_PROGRESS.nacaoProgressoPorDificuldade[diff][snap.nacaoId] = cur;
                    }

                    if (!cur.fasesConcluidas.includes(snap.faseId)) {
                        cur.fasesConcluidas.push(snap.faseId);
                        console.log(`%c[V2.10 ✅] Fase ${snap.faseId} de ${snap.nacaoId} marcada (${diff})`,
                            'color:#27ae60;font-weight:bold;');
                    }

                    // ─── Recompensa ───
                    const XP    = { '1': 200, '2': 350, '3': 500 }[snap.faseId] || 200;
                    const OURO  = { '1': 150, '2': 250, '3': 400 }[snap.faseId] || 150;
                    const ESS   = { '1': 3,   '2': 6,   '3': 12 }[snap.faseId] || 3;
                    const mult  = { normal: 1, dificil: 1.5, pesadelo: 2.2 }[diff] || 1;

                    xpG = Math.floor(XP * mult);
                    ouG = Math.floor(OURO * mult);
                    esG = Math.floor(ESS * mult);

                    STORY_PROGRESS.totalXP = (STORY_PROGRESS.totalXP || 0) + xpG;
                    STORY_PROGRESS.gold    = (STORY_PROGRESS.gold    || 0) + ouG;
                    if (!STORY_PROGRESS.inventory) STORY_PROGRESS.inventory = {};
                    STORY_PROGRESS.inventory[CONFIG.moedaId] =
                        (STORY_PROGRESS.inventory[CONFIG.moedaId] || 0) + esG;

                    if (typeof saveStoryProgress === 'function') saveStoryProgress();

                    console.log(`%c[V2.10 ✅] +${xpG} XP · +${ouG} ouro · +${esG} essência`,
                        'color:#27ae60;font-weight:bold;');
                    console.log(`   Saldo: XP=${STORY_PROGRESS.totalXP} · Ouro=${STORY_PROGRESS.gold} · Essência=${STORY_PROGRESS.inventory[CONFIG.moedaId]}`);
                } catch (e) {
                    console.error('[V2.10] erro ao marcar/recompensar:', e);
                }
            }

            // ─── Reseta flags ANTES de chamar _origFinalizar ───
            window._nacaoAtivo = false;
            window._eventoAtivo = false;
            window._storyMode = false;
            if (window._eventoBatalha && typeof window._eventoBatalha === 'object') {
                window._eventoBatalha.ativa = false;
            }

            // ─── Chama _origFinalizar (só limpa telas, sem recompensa) ───
            try {
                if (typeof _origFinalizar === 'function') {
                    await _origFinalizar.call(this, vitoria, saindo);
                }
            } catch (e) {
                console.warn('[V2.10] _origFinalizar falhou (ok):', e);
            }

            // ─── Fecha tela de jogo ───
            const gs = document.getElementById('gameScreen');
            if (gs) { gs.classList.remove('active'); gs.style.display = 'none'; }

            const overlay = document.getElementById('gameOverlay');
            if (overlay) {
                overlay.classList.remove('active');
                overlay.style.display = 'none';
                overlay.innerHTML = '';
            }

            // ─── Mostra tela de vitória SIMPLES (sem estrelas) ───
            if (vitoria) {
                _mostrarTelaVitoriaSimples(snap, { xp: xpG, ouro: ouG, essencia: esG });
            } else {
                _mostrarTelaDerrotaSimples(snap);
            }

            window._nacaoBatalha = { ativa: false };
            return;
        }

        return typeof _origFinalizar === 'function'
            ? _origFinalizar.apply(this, arguments)
            : undefined;
    };
    window.eventoFinalizarPartida._v210 = true;

    // ═══════════════════════════════════════════════════════
    // 2. TELA DE VITÓRIA SIMPLES (sem estrelas)
    // ═══════════════════════════════════════════════════════
    function _mostrarTelaVitoriaSimples(snap, rewards) {
        const old = document.getElementById('nacaoVictoryOverlay');
        if (old) old.remove();

        const nacaoCfg = NACOES[snap.nacaoId];
        const proximaFase = String(parseInt(snap.faseId) + 1);
        const liberouProxima = (snap.faseId !== '3') && (parseInt(proximaFase) <= 3);
        const isFinalNacao = snap.faseId === '3';

        const spriteHTML = (typeof window.nacaoIcon === 'function' && nacaoCfg)
            ? window.nacaoIcon('nacao_' + (nacaoCfg.deuses?.[0] || '').replace('nacao_', ''), 'large')
            : (nacaoCfg?.nome?.[0] || '🌎');

        const ov = document.createElement('div');
        ov.id = 'nacaoVictoryOverlay';
        ov.style.cssText = `
            position: fixed; inset: 0;
            background: rgba(10,6,2,.95);
            z-index: 25000;
            display: flex; align-items: center; justify-content: center;
            padding: 20px; overflow-y: auto;
            animation: fadeIn 0.3s ease;
        `;

        ov.innerHTML = `
            <div style="
                background: linear-gradient(180deg, #2a1f10, #1a1208);
                border: 3px solid #c9a227;
                border-radius: 10px;
                max-width: 480px; width: 100%;
                padding: 24px; text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,.9), 0 0 40px rgba(232,185,35,.3);
            ">
                <div style="
                    font-family: 'Cinzel Decorative', serif;
                    color: #e8b923; font-size: 1.6rem;
                    letter-spacing: 3px; margin-bottom: 12px;
                    text-shadow: 0 0 15px rgba(232,185,35,.6);
                ">✅ FASE ${snap.faseId} CONCLUÍDA</div>

                <div style="font-size: 3rem; margin: 12px 0;">${spriteHTML}</div>

                <div style="
                    font-family: 'Cinzel', serif;
                    color: #f0e2c0; font-size: 1.1rem;
                    letter-spacing: 1px; margin-bottom: 20px;
                ">${nacaoCfg?.nome || snap.nacaoId} — Fase ${snap.faseId}</div>

                <div style="
                    background: rgba(10,6,2,.5);
                    border-radius: 6px;
                    padding: 16px;
                    margin-bottom: 18px;
                    display: flex; flex-direction: column; gap: 8px;
                ">
                    <div style="font-family:'Cinzel',serif; color:#e8b923; font-size:1rem;">
                        ⭐ +${rewards.xp} XP
                    </div>
                    <div style="font-family:'Cinzel',serif; color:#e8b923; font-size:1rem;">
                        💰 +${rewards.ouro} ouro
                    </div>
                    <div style="font-family:'Cinzel',serif; color:#e8b923; font-size:1rem;">
                        🌎 +${rewards.essencia} essência ancestral
                    </div>
                </div>

                ${liberouProxima ? `
                    <div style="
                        background: rgba(107,163,92,.12);
                        border: 1px solid rgba(107,163,92,.4);
                        border-radius: 6px;
                        padding: 10px;
                        margin-bottom: 18px;
                        font-family: 'Cinzel', serif;
                        color: #8ac070; font-size: .9rem;
                        letter-spacing: 1px;
                    ">
                        🎯 FASE ${proximaFase} DESBLOQUEADA
                    </div>
                ` : ''}

                ${isFinalNacao ? `
                    <div style="
                        background: rgba(232,185,35,.12);
                        border: 1px solid rgba(232,185,35,.4);
                        border-radius: 6px;
                        padding: 12px;
                        margin-bottom: 18px;
                        font-family: 'Cinzel', serif;
                        color: #e8b923; font-size: .95rem;
                        letter-spacing: 1px;
                    ">
                        👑 NAÇÃO COMPLETA!
                    </div>
                ` : ''}

                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    ${liberouProxima ? `
                        <button id="nacaoBtnProxima" style="
                            padding: 12px 24px;
                            background: linear-gradient(180deg, rgba(232,185,35,.25), transparent 45%),
                                        linear-gradient(135deg, #8a6a2e, #4a3418);
                            color: #fff5dc;
                            border: 2px solid #e8b923;
                            border-radius: 4px;
                            cursor: pointer;
                            font-family: 'Cinzel', serif;
                            font-weight: 700;
                            font-size: .95rem;
                            letter-spacing: 2px;
                        ">▶ FASE ${proximaFase}</button>
                    ` : ''}
                    <button id="nacaoBtnVoltar" style="
                        padding: 12px 24px;
                        background: rgba(10,6,2,.6);
                        color: #c8b787;
                        border: 2px solid #6a5024;
                        border-radius: 4px;
                        cursor: pointer;
                        font-family: 'Cinzel', serif;
                        font-weight: 700;
                        font-size: .95rem;
                        letter-spacing: 2px;
                    ">← VOLTAR</button>
                </div>
            </div>
        `;
        document.body.appendChild(ov);

        // Botão "próxima fase" → reinicia batalha direto
        const btnProx = document.getElementById('nacaoBtnProxima');
        if (btnProx) {
            btnProx.onclick = () => {
                ov.remove();
                if (typeof window._nacaoIniciarFase === 'function') {
                    window._nacaoIniciarFase(snap.nacaoId, proximaFase);
                }
            };
        }

        // Botão "voltar" → tela de fases da nação
        const btnVoltar = document.getElementById('nacaoBtnVoltar');
        if (btnVoltar) {
            btnVoltar.onclick = () => {
                ov.remove();
                if (typeof window.renderFasesNacao === 'function') {
                    window.renderFasesNacao(snap.nacaoId);
                } else if (typeof window.renderSeteNacoesScreen === 'function') {
                    window.renderSeteNacoesScreen();
                }
            };
        }
    }

    // ═══════════════════════════════════════════════════════
    // 3. TELA DE DERROTA SIMPLES
    // ═══════════════════════════════════════════════════════
    function _mostrarTelaDerrotaSimples(snap) {
        const old = document.getElementById('nacaoVictoryOverlay');
        if (old) old.remove();

        const nacaoCfg = NACOES[snap.nacaoId];
        const ov = document.createElement('div');
        ov.id = 'nacaoVictoryOverlay';
        ov.style.cssText = `
            position: fixed; inset: 0;
            background: rgba(10,6,2,.95);
            z-index: 25000;
            display: flex; align-items: center; justify-content: center;
            padding: 20px;
        `;
        ov.innerHTML = `
            <div style="
                background: linear-gradient(180deg, #2a1f10, #1a1208);
                border: 3px solid #a83232;
                border-radius: 10px;
                max-width: 420px; width: 100%;
                padding: 24px; text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,.9), 0 0 40px rgba(168,50,50,.4);
            ">
                <div style="font-family: 'Cinzel Decorative', serif; color: #d05050; font-size: 1.5rem; letter-spacing: 3px; margin-bottom: 12px;">
                    💀 DERROTA
                </div>
                <div style="font-family: 'EB Garamond', serif; color: #d9c89a; font-size: 1rem; font-style: italic; margin-bottom: 20px;">
                    Os heróis caíram em ${nacaoCfg?.nome || snap.nacaoId} — Fase ${snap.faseId}.
                </div>
                <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button id="nacaoBtnRetry" style="
                        padding: 12px 24px;
                        background: linear-gradient(180deg, rgba(232,185,35,.25), transparent 45%),
                                    linear-gradient(135deg, #8a6a2e, #4a3418);
                        color: #fff5dc;
                        border: 2px solid #e8b923;
                        border-radius: 4px;
                        cursor: pointer;
                        font-family: 'Cinzel', serif;
                        font-weight: 700;
                        font-size: .95rem;
                        letter-spacing: 2px;
                    ">↻ TENTAR NOVAMENTE</button>
                    <button id="nacaoBtnVoltar" style="
                        padding: 12px 24px;
                        background: rgba(10,6,2,.6);
                        color: #c8b787;
                        border: 2px solid #6a5024;
                        border-radius: 4px;
                        cursor: pointer;
                        font-family: 'Cinzel', serif;
                        font-weight: 700;
                        font-size: .95rem;
                        letter-spacing: 2px;
                    ">← VOLTAR</button>
                </div>
            </div>
        `;
        document.body.appendChild(ov);

        document.getElementById('nacaoBtnRetry').onclick = () => {
            ov.remove();
            if (typeof window._nacaoIniciarFase === 'function') {
                window._nacaoIniciarFase(snap.nacaoId, snap.faseId);
            }
        };
        document.getElementById('nacaoBtnVoltar').onclick = () => {
            ov.remove();
            if (typeof window.renderFasesNacao === 'function') {
                window.renderFasesNacao(snap.nacaoId);
            } else if (typeof window.renderSeteNacoesScreen === 'function') {
                window.renderSeteNacoesScreen();
            }
        };
    }

    // ═══════════════════════════════════════════════════════
    // 4. BLOQUEAR ESTRELAS de nação em qualquer tela
    // ═══════════════════════════════════════════════════════
    const _origVictoryScreen = window.showStoryVictoryScreen;
    if (typeof _origVictoryScreen === 'function' && !_origVictoryScreen._v210) {
        window.showStoryVictoryScreen = function(phase, drops, rewards, meta) {
            const ehNacao = phase?.id && (
                String(phase.id).includes('_nacao') ||
                (window._nacaoBatalha && window._nacaoBatalha.nacaoId)
            );
            if (ehNacao) {
                console.log('[V2.10] showStoryVictoryScreen bloqueado (é nação — sem estrelas)');
                return;
            }
            return _origVictoryScreen.apply(this, arguments);
        };
        window.showStoryVictoryScreen._v210 = true;
    }

    // ═══════════════════════════════════════════════════════
    // 5. finishStoryPhase — NÃO faz nada pra nação (V2.10 já tratou)
    // -------------------------------------------------------------
    // Mantemos o V2.8/V2.6 anteriores como "não-op" pra não duplicar
    // ═══════════════════════════════════════════════════════
    const _curFinish = window.finishStoryPhase;
    if (typeof _curFinish === 'function' && !_curFinish._v210) {
        window.finishStoryPhase = function(victory) {
            const emNacao = window._nacaoBatalha?.ativa === true || window._nacaoAtivo === true;
            if (emNacao) {
                console.log('[V2.10] finishStoryPhase ignorado (V2.10 trata via eventoFinalizarPartida)');
                return;
            }
            return _curFinish.apply(this, arguments);
        };
        window.finishStoryPhase._v210 = true;
    }

    // ═══════════════════════════════════════════════════════
    // 6. DEBUG
    // ═══════════════════════════════════════════════════════
    window._debugV210 = function() {
        console.group('=== V2.10 ===');
        console.log('Ouro:', STORY_PROGRESS?.gold);
        console.log('XP:', STORY_PROGRESS?.totalXP);
        console.log('Essência:', STORY_PROGRESS?.inventory?.[CONFIG.moedaId] || 0);
        console.log('');
        console.log('Progresso (por dificuldade):');
        const prog = STORY_PROGRESS?.nacaoProgressoPorDificuldade || {};
        Object.keys(prog).forEach(d => {
            console.log(`  [${d}]`);
            Object.keys(prog[d]).forEach(n => {
                const p = prog[d][n];
                console.log(`    ${n}: ${p.fasesConcluidas?.length || 0}/3 → [${(p.fasesConcluidas || []).join(', ')}] (semana ${p.semana})`);
            });
        });
        console.log('');
        console.log('_nacaoBatalha:', window._nacaoBatalha);
        console.log('_nacaoAtivo:', window._nacaoAtivo);
        console.log('_eventoAtivo:', window._eventoAtivo);
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V2.10] Vitória corrigida + sem estrelas');
    console.log('═══════════════════════════════════════════════════');
    console.log('🎯 eventoFinalizarPartida agora:');
    console.log('   1. Marca fase (por dificuldade)');
    console.log('   2. Dá XP + ouro + essência');
    console.log('   3. Mostra tela simples (sem estrelas)');
    console.log('   4. Botão "▶ Fase 2" na tela de vitória');
    console.log('');
    console.log('🚫 showStoryVictoryScreen bloqueado pra nações');
    console.log('🚫 Nenhuma estrela é acumulada');
    console.log('');
    console.log('💡 Debug: window._debugV210()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// nacoes.js — V2.11 — Fix: derrota travada + progresso não atualiza + som
// =================================================================
(function nacoesV211() {
    if (window._nacoesV211) return;
    window._nacoesV211 = true;

    const NACOES = window.NACOES || {};
    const CONFIG = window._nacaoConfig || { moedaId: 'essencia_ancestral' };

    // ═══════════════════════════════════════════════════════
    // 1. Garantir leitura correta do progresso
    // ═══════════════════════════════════════════════════════
    const _origGetProg = window._getProg; // Se existir
    function getProgSeguro(nacaoId, diff) {
        if (!STORY_PROGRESS.nacaoProgressoPorDificuldade) STORY_PROGRESS.nacaoProgressoPorDificuldade = {};
        if (!STORY_PROGRESS.nacaoProgressoPorDificuldade[diff]) STORY_PROGRESS.nacaoProgressoPorDificuldade[diff] = {};
        
        const d = STORY_PROGRESS.nacaoProgressoPorDificuldade[diff];
        if (!d[nacaoId]) {
            d[nacaoId] = { fasesConcluidas: [], bossDerrotados: [], semana: (typeof window.getWeekId === 'function' ? window.getWeekId() : 'fallback') };
        }
        return d[nacaoId];
    }

    // ═══════════════════════════════════════════════════════
    // 2. DERROTA E VITÓRIA: Desbloquear finishStoryPhase
    // ═══════════════════════════════════════════════════════
    const _curFinish = window.finishStoryPhase;
    if (typeof _curFinish === 'function' && !_curFinish._v211) {
        window.finishStoryPhase = function(victory) {
            const b = window._nacaoBatalha || {};
            const emNacao = b.ativa === true || window._nacaoAtivo === true;

            if (emNacao) {
                console.log(`[V2.11] finishStoryPhase(victory=${victory}) — tratando nacao`);

                window._nacaoAtivo = false;
                window._eventoAtivo = false;
                window._nacaoBatalha = { ativa: false };

                if (!victory) {
                    // TELA DE DERROTA
                    const snap = { nacaoId: b.nacaoId, faseId: b.faseId };
                    if (typeof _mostrarTelaDerrotaSimples === 'function') {
                        _mostrarTelaDerrotaSimples(snap);
                    } else {
                        // Fallback seguro se a função sumiu
                        const n = NACOES[snap.nacaoId];
                        const ov = document.createElement('div');
                        ov.style.cssText = 'position:fixed;inset:0;background:rgba(10,6,2,.95);z-index:25000;display:flex;align-items:center;justify-content:center;';
                        ov.innerHTML = `<div style="background:#2a1f10;padding:30px;border:2px solid #a83232;border-radius:8px;text-align:center;color:#d05050;font-family:Cinzel,serif;">
                            <h2>💀 DERROTA</h2>
                            <p style="color:#d9c89a;font-family:EB Garamond;">Os heróis caíram em ${n?.nome || snap.nacaoId} — Fase ${snap.faseId}.</p>
                            <button onclick="this.parentNode.parentNode.remove(); window.renderFasesNacao('${snap.nacaoId}');" style="margin-top:15px;padding:10px 20px;background:#8a6a2e;color:#fff;border:2px solid #e8b923;border-radius:4px;cursor:pointer;">VOLTAR</button>
                        </div>`;
                        document.body.appendChild(ov);
                    }
                }
                return;
            }
            return _curFinish.apply(this, arguments);
        };
        window.finishStoryPhase._v211 = true;
    }

    // ═══════════════════════════════════════════════════════
    // 3. Re-render Fases: Forçar atualização do progresso
    // ═══════════════════════════════════════════════════════
    const _origRenderFases = window.renderFasesNacao;
    if (typeof _origRenderFases === 'function' && !_origRenderFases._v211) {
        window.renderFasesNacao = function(nacaoId) {
            // Puxa o diff atual
            const diff = (typeof storyCurrentDifficulty !== 'undefined') ? storyCurrentDifficulty : (STORY_PROGRESS?.difficulty || 'normal');
            const prog = getProgSeguro(nacaoId, diff);
            
            console.log(`[V2.11] Renderizando ${nacaoId} [${diff}] — fases concluídas:`, prog.fasesConcluidas);

            const r = _origRenderFases.apply(this, arguments);
            return r;
        };
        window.renderFasesNacao._v211 = true;
    }

    // ═══════════════════════════════════════════════════════
    // 4. Vitória: Adicionar som de vitória
    // ═══════════════════════════════════════════════════════
    const _origMostrarVitoria = window._mostrarTelaVitoriaSimples;
    if (typeof _origMostrarVitoria === 'function' && !_origMostrarVitoria._v211) {
        window._mostrarTelaVitoriaSimples = function(snap, rewards) {
            try { if (typeof playSfx === 'function') playSfx('win'); } catch(e) {}
            return _origMostrarVitoria.apply(this, arguments);
        };
        window._mostrarTelaVitoriaSimples._v211 = true;
    }

    // ═══════════════════════════════════════════════════════
    // 5. Debug
    // ═══════════════════════════════════════════════════════
    window._debugV211 = function() {
        console.group('=== V2.11 ===');
        console.log('Progresso atual:', STORY_PROGRESS?.nacaoProgressoPorDificuldade);
        console.log('_nacaoBatalha:', window._nacaoBatalha);
        console.log('_nacaoAtivo:', window._nacaoAtivo);
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V2.11] Derrota + UI de fases + som');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Fim do travamento ao morrer na Fase 3');
    console.log('• Tela de derrota funcional');
    console.log('• Tela de fases mostra progresso real');
    console.log('• Som de vitória ativado');
    console.log('');
    console.log('💡 Debug: window._debugV211()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// nacoes.js — V2.12 — Fix progresso: tela de fases lê corretamente
// -----------------------------------------------------------------
// 1. Sobrescreve _getProg para NÃO apagar o progresso se a semana
//    for lida diferente. Apenas cria se não existir.
// 2. Garante que renderFasesNacao vai marcar 'completa' corretamente.
// =================================================================
(function nacoesV212() {
    if (window._nacoesV212) return;
    window._nacoesV212 = true;

    const CONFIG = window._nacaoConfig || {};

    // ═══════════════════════════════════════════════════════
    // 1. Substitui a leitura de progresso para ser "à prova de falhas"
    // ═══════════════════════════════════════════════════════
    function getProgSeguro(nacaoId, diff) {
        if (!STORY_PROGRESS.nacaoProgressoPorDificuldade) {
            STORY_PROGRESS.nacaoProgressoPorDificuldade = {};
        }
        if (!STORY_PROGRESS.nacaoProgressoPorDificuldade[diff]) {
            STORY_PROGRESS.nacaoProgressoPorDificuldade[diff] = {};
        }
        
        const d = STORY_PROGRESS.nacaoProgressoPorDificuldade[diff];
        
        // Se não existe, cria. Se existe, MANTÉM (mesmo que a semana seja diferente).
        if (!d[nacaoId]) {
            d[nacaoId] = {
                fasesConcluidas: [],
                bossDerrotados: [],
                semana: (typeof window.getWeekId === 'function' ? window.getWeekId() : 'fallback')
            };
        }
        
        return d[nacaoId];
    }

    // Tenta sobrescrever a variável global (no escopo da IIFE original)
    // Como não conseguimos acessar a IIFE, sobrescrevemos a função que a usa
    // reescrevendo o render.
    
    // ═══════════════════════════════════════════════════════
    // 2. Garantir que a renderização de fases use o progresso
    // ═══════════════════════════════════════════════════════
    const _origRender = window.renderFasesNacao;
    
    window.renderFasesNacao = function(nacaoId) {
        // Antes de chamar o original, injetamos o progresso correto
        // no objeto de progresso global
        const diff = (typeof storyCurrentDifficulty !== 'undefined') 
            ? storyCurrentDifficulty 
            : (STORY_PROGRESS?.difficulty || 'normal');
            
        const prog = getProgSeguro(nacaoId, diff);
        
        // ⚠️ Se o original for resetar por causa da semana, 
        // atualizamos a semana para a semana atual ANTES dele rodar.
        prog.semana = (typeof window.getWeekId === 'function' ? window.getWeekId() : 'fallback');
        
        console.log(`[V2.12] Injetando progresso em ${nacaoId} [${diff}]:`, prog.fasesConcluidas);
        
        const r = _origRender.apply(this, arguments);
        
        // Pós-processamento: se o DOM mostrou fase 1 como "liberada" mas 
        // o progresso diz que está concluída, forçamos o visual manualmente.
        setTimeout(() => {
            const screen = document.getElementById('storyScreen');
            if (!screen) return;
            
            const cards = screen.querySelectorAll('.nacao-fase-card');
            prog.fasesConcluidas.forEach(faseId => {
                const idx = parseInt(faseId) - 1;
                const card = cards[idx];
                if (!card) return;
                
                // Força classes visuais de "completa"
                card.classList.remove('liberada', 'bloqueada');
                card.classList.add('completa');
                
                // Atualiza o ícone de status
                const statusEl = card.querySelector('.nacao-fase-status');
                if (statusEl) statusEl.textContent = '✅';
                
                // Atualiza o texto do botão
                const btn = card.querySelector('.nacao-fase-btn');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = `↻ REJOGAR (${CONFIG.custoEntrada[diff] || 500}💰)`;
                    // Remove onclick antigo e re-adiciona
                    const nacaoArg = nacaoId.replace(/'/g, "\\'");
                    btn.setAttribute('onclick', `window._nacaoIniciarFase('${nacaoArg}', '${faseId}')`);
                }
            });
        }, 100);
        
        return r;
    };
    window.renderFasesNacao._v212 = true;

    // ═══════════════════════════════════════════════════════
    // 3. DEBUG
    // ═══════════════════════════════════════════════════════
    window._debugV212 = function() {
        console.group('=== V2.12 ===');
        console.log('Progresso por dificuldade:');
        const prog = STORY_PROGRESS?.nacaoProgressoPorDificuldade || {};
        Object.keys(prog).forEach(d => {
            console.log(`  [${d}]`);
            Object.keys(prog[d]).forEach(n => {
                const p = prog[d][n];
                console.log(`    ${n}: semana=${p.semana}, fases=[${(p.fasesConcluidas || []).join(', ')}]`);
            });
        });
        console.log('');
        console.log('Semana atual:', typeof window.getWeekId === 'function' ? window.getWeekId() : '?');
        console.log('Dificuldade atual:', typeof storyCurrentDifficulty !== 'undefined' ? storyCurrentDifficulty : '?');
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V2.12] Fix progresso na tela de fases');
    console.log('═══════════════════════════════════════════════════');
    console.log('• _getProg não apaga mais por diferença de semana');
    console.log('• renderFasesNacao força o visual "completo"');
    console.log('');
    console.log('💡 Debug: window._debugV212()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// nacoes.js — V2.13 — Renderização de fases 100% independente
// =================================================================
(function nacoesV213() {
    if (window._nacoesV213) return;
    window._nacoesV213 = true;

    window.renderFasesNacao = function(nacaoId) {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;
        const n = window.NACOES?.[nacaoId];
        if (!n) return;
        window._nacaoAtual = nacaoId;

        const diff = (typeof storyCurrentDifficulty !== 'undefined') 
            ? storyCurrentDifficulty 
            : (STORY_PROGRESS?.difficulty || 'normal');

        // Lê o progresso DIRETAMENTE, sem funções externas
        let prog = { fasesConcluidas: [] };
        if (STORY_PROGRESS?.nacaoProgressoPorDificuldade?.[diff]?.[nacaoId]) {
            prog = STORY_PROGRESS.nacaoProgressoPorDificuldade[diff][nacaoId];
        }
        
        // Garante que é um array válido
        if (!Array.isArray(prog.fasesConcluidas)) prog.fasesConcluidas = [];

        console.log(`%c[V2.13] Renderizando ${nacaoId} (${diff}). Concluídas: [${prog.fasesConcluidas.join(', ')}]`, 'color:#3498db;');

        const deuses = n.deuses.map(id => window.NACAO_DEUSES[id]);
        const custo = window._nacaoConfig?.custoEntrada?.[diff] || 500;

        const fasesInfo = [
            { id: '1', deuses: [deuses[0]], label: 'Fase 1' },
            { id: '2', deuses: [deuses[0], deuses[1]], label: 'Fase 2' },
            { id: '3', deuses: [deuses[0], deuses[1], deuses[2]], label: 'Fase 3', final: true },
        ];

        let cardsHTML = '';
        fasesInfo.forEach((fase, idx) => {
            // Verifica a conclusão baseado no array salvo
            const concluida = prog.fasesConcluidas.includes(fase.id);
            const liberada = idx === 0 || prog.fasesConcluidas.includes(fasesInfo[idx - 1].id);

            let statusClass = '', statusIcon = '', btnLabel = '', btnDisabled = false;
            if (concluida) {
                statusClass = 'completa'; statusIcon = '✅'; btnLabel = `↻ REJOGAR (${custo}💰)`;
            } else if (liberada) {
                statusClass = 'liberada'; statusIcon = '🎯'; btnLabel = `▶ JOGAR (${custo}💰)`;
            } else {
                statusClass = 'bloqueada'; statusIcon = '🔒'; btnLabel = '🔒 BLOQUEADA'; btnDisabled = true;
            }

            const deusesHTML = fase.deuses.map(d => 
                `<span class="nacao-fase-deus">${window.nacaoIcon ? window.nacaoIcon(d.id, 'normal') : d.nome}</span>`
            ).join('');

            cardsHTML += `
                <div class="nacao-fase-card ${statusClass}">
                    <div class="nacao-fase-header">
                        <span class="nacao-fase-num">${fase.label.toUpperCase()}</span>
                        <span class="nacao-fase-status">${statusIcon}</span>
                    </div>
                    <div class="nacao-fase-deuses">${deusesHTML}</div>
                    <div class="nacao-fase-nomes">${fase.deuses.map(d => d.nome).join(' + ')}</div>
                    ${fase.final ? `<div class="nacao-fase-frag">🌎 Drop: Fragmento / Amuleto / Arma</div>` : ''}
                    <button class="nacao-fase-btn" ${btnDisabled ? 'disabled' : ''}
                            onclick="window._nacaoIniciarFase('${nacaoId}', '${fase.id}')">
                        ${btnLabel}
                    </button>
                </div>
            `;
        });

        const diffsHTML = ['normal', 'dificil', 'pesadelo'].map(d => `
            <button class="nacao-diff-btn ${d === diff ? 'active' : ''}"
                    style="--diff-cor:${window.DIFF_COR?.[d] || '#c9a227'};"
                    onclick="window._nacaoSelDiff('${d}')">
                ${window.DIFF_LABEL?.[d] || d}
            </button>
        `).join('');

        // Restrição (V2.2)
        const selHero = (STORY_PROGRESS.selectedHeroes || ['Tupa'])[0];
        const selRarity = typeof window.getHeroRarity === 'function' ? window.getHeroRarity(selHero) : 1;
        const selData = window.STORY_HERO_CLASSES?.[selHero];
        const dayCfg = window._nacaoDayConfig?.[n.diaSemana] || { maxStars: null };
        const bloqueado = dayCfg.maxStars !== null && selRarity > dayCfg.maxStars;
        const restricaoTexto = dayCfg.maxStars === null
            ? '⚔️ Sem restrição de raridade'
            : `⭐ Apenas heróis até ${dayCfg.maxStars}★`;

        const restricaoHTML = `
            <div class="nacao-restricao ${bloqueado ? 'bloqueado' : 'ok'}" style="margin-top:14px; padding:10px 16px; border-radius:6px; text-align:center; font-family:'EB Garamond',serif; ${bloqueado ? 'background:rgba(168,50,50,.15); border:1px solid rgba(168,50,50,.5); color:#f5c8c8;' : 'background:rgba(107,163,92,.12); border:1px solid rgba(107,163,92,.4); color:#8ac070;'}">
                <div style="font-family:'Cinzel',serif; font-size:.9rem; letter-spacing:1.5px; font-weight:700; margin-bottom:4px;">${restricaoTexto}</div>
                <div style="font-size:.9rem; font-style:italic;">Herói atual: <b>${selData?.displayName || selHero}</b> (${selRarity}★) ${bloqueado ? ' — ❌ bloqueado' : ' — ✅ permitido'}</div>
                ${bloqueado ? `<div style="margin-top:6px; font-size:.8rem; opacity:.9;">Troque para um herói de raridade válida na OCA.</div>` : ''}
            </div>
        `;

        screen.innerHTML = `
            <div class="story-container">
                <div class="story-header">
                    <h1 class="story-title">${n.nome}</h1>
                    <p class="story-subtitle">${n.titulo}</p>
                    <div class="nacao-boss-descricao">${n.descricao}</div>
                    ${restricaoHTML}
                </div>
                <div class="nacao-lore-box" style="font-size:.95rem;">${n.lore}</div>

                <div class="nacao-diff-selector">
                    <div class="nacao-diff-label">DIFICULDADE</div>
                    <div class="nacao-diff-buttons">${diffsHTML}</div>
                    <div class="nacao-diff-info">Custo: <b>${custo} 💰</b></div>
                </div>

                <div class="nacao-fases-grid">${cardsHTML}</div>

                <div class="story-footer">
                    <button class="story-back-btn" onclick="window.renderSeteNacoesScreen()">← VOLTAR ÀS NAÇÕES</button>
                </div>
            </div>
        `;
        screen.classList.add('active');
        screen.style.display = 'flex';
    };
})();
// =================================================================
// historia.js — V2.14 — Fix desbloqueio de heróis por "Zerar Dificuldade"
// -----------------------------------------------------------------
// • Remove o "starsNeeded: 0" do Anhanga, Curupira e Kianumanka
// • Corrige o texto na OCA para mostrar a condição real
// =================================================================
(function fixDesbloqueioZerarV214() {
    if (window._fixDesbloqueioZerarV214) return;
    window._fixDesbloqueioZerarV214 = true;

    // 1. Corrige a flag para não liberar automaticamente
    const arrumarHeroi = (nome) => {
        if (typeof STORY_HERO_CLASSES !== 'undefined' && STORY_HERO_CLASSES[nome]) {
            STORY_HERO_CLASSES[nome].starsNeeded = null;
        }
    };
    arrumarHeroi('Anhanga-Mirim');
    arrumarHeroi('Curupira');
    arrumarHeroi('Kianumanka-Manã');

    // 2. Remove eles da lista de desbloqueados se o jogador não cumpriu a condição
    const validarDesbloqueios = () => {
        if (typeof STORY_PROGRESS === 'undefined') return;
        const cleared = STORY_PROGRESS.clearedDifficulties || [];
        let mudou = false;

        const regras = {
            'Curupira': 'normal',
            'Kianumanka-Manã': 'dificil',
            'Anhanga-Mirim': 'pesadelo'
        };

        for (const hero in regras) {
            if (!cleared.includes(regras[hero])) {
                const idx = STORY_PROGRESS.unlockedHeroesStory.indexOf(hero);
                if (idx !== -1) {
                    STORY_PROGRESS.unlockedHeroesStory.splice(idx, 1);
                    mudou = true;
                    console.log(`[V2.14] ${hero} bloqueado (não cumpriu ${regras[hero]})`);
                }
            }
        }
        if (mudou && typeof saveStoryProgress === 'function') saveStoryProgress();
    };
    validarDesbloqueios();

    // 3. Corrige o texto no card da OCA
    const _origRenderOca = window.renderOcaScreenFiltered;
    if (typeof _origRenderOca === 'function' && !_origRenderOca._v214) {
        window.renderOcaScreenFiltered = function() {
            const r = _origRenderOca.apply(this, arguments);
            
            setTimeout(() => {
                document.querySelectorAll('.story-hero-card.locked').forEach(card => {
                    const nameEl = card.querySelector('.story-hero-name');
                    if (!nameEl || nameEl.textContent !== '?????') return;
                    
                    // Descobre qual herói é
                    const html = card.innerHTML;
                    let heroiId = null;
                    for (const k in STORY_HERO_CLASSES) {
                        const h = STORY_HERO_CLASSES[k];
                        if (h.starsNeeded === null && h.role && html.includes(h.role)) {
                            // Verifica pelo ícone ou sprite
                            if (h.unlockReq && h.unlockReq.type === 'clear') {
                                // Tenta achar pelo role
                                if (h.role === 'Mago' || h.role === 'Arqueiro' || h.role === 'Guerreiro') {
                                    // Como é complexo, faremos um match de classe CSS se possível
                                }
                            }
                        }
                    }

                    // Solução mais simples: procurar pelo texto de lock original
                    const lockInfo = card.querySelector('.story-hero-lock-info');
                    if (lockInfo && lockInfo.textContent.includes('null')) {
                        // Precisamos saber QUAL herói é. Vamos usar o role do card.
                        const roleTxt = card.querySelector('.story-hero-element')?.textContent || '';
                        
                        let reqTxt = 'Condição Especial';
                        if (roleTxt.includes('Mago')) reqTxt = 'Zere no Pesadelo';
                        if (roleTxt.includes('Guerreiro')) reqTxt = 'Zere no Normal';
                        if (roleTxt.includes('Arqueiro')) reqTxt = 'Zere no Difícil';

                        // Correção manual baseada no sprite (se tiver)
                        const img = card.querySelector('img');
                        if (img && img.src) {
                            if (img.src.includes('AnhangaMirim')) reqTxt = 'Zere no Pesadelo';
                            if (img.src.includes('Curupira')) reqTxt = 'Zere no Normal';
                            if (img.src.includes('Kianumanka')) reqTxt = 'Zere no Difícil';
                        }

                        lockInfo.innerHTML = `Desbloqueie ao<br><b>${reqTxt}</b>`;
                    }
                });
            }, 100);
            
            return r;
        };
        window.renderOcaScreenFiltered._v214 = true;
    }

    // 4. Garante que o checkHeroUnlocks vai funcionar quando vencer
    const _origCheck = window.checkHeroUnlocks;
    if (typeof _origCheck === 'function' && !_origCheck._v214) {
        window.checkHeroUnlocks = function() {
            const r = _origCheck.apply(this, arguments);
            validarDesbloqueios();
            return r;
        };
        window.checkHeroUnlocks._v214 = true;
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V2.14] Fix: Heróis de Zerar Dificuldade');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Anhanga-Mirim (Pesadelo), Curupira (Normal) e');
    console.log('  Kianumanka-Manã (Difícil) não vêm mais liberados.');
    console.log('• Texto da OCA mostra a condição correta.');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// nacoes.js — V2.15 CORRIGIDA — Wrapper (não substitui mais a OCA)
// -----------------------------------------------------------------
// Antes: reescrevia renderOcaScreenFiltered por completo, matando:
//   • V9.4 (raridade)
//   • V42.0 (stats Lv 11 em verde)
//   • V43.1 (aura Lv 11)
//   • Sistema de líder (aldeia.js)
//
// Agora: apenas envelopa. Adiciona o texto de unlock via
// post-processing, sem tocar na estrutura renderizada.
// =================================================================
(function fixOcaV215_wrapper() {
    if (window._fixOcaV215_wrapper) return;
    window._fixOcaV215_wrapper = true;

    // 1. Trava starsNeeded = null nos heróis especiais
    const especiais = ['Abya', 'Rudá', 'Anhanga-Mirim', 'Curupira', 'Kianumanka-Manã'];
    especiais.forEach(h => {
        if (typeof STORY_HERO_CLASSES !== 'undefined' && STORY_HERO_CLASSES[h]) {
            STORY_HERO_CLASSES[h].starsNeeded = null;
        }
    });

    // 2. Valida desbloqueios (remove quem não deveria)
    const validarDesbloqueios = () => {
        if (typeof STORY_PROGRESS === 'undefined') return;
        const cleared = STORY_PROGRESS.clearedDifficulties || [];
        const fragsNacao = STORY_PROGRESS.nacaoFragmentos || [];
        const fragsEvento = STORY_PROGRESS.eventoFragmentos || [];

        const checar = (hero, condicao) => {
            if (!condicao) {
                const idx = STORY_PROGRESS.unlockedHeroesStory.indexOf(hero);
                if (idx !== -1) STORY_PROGRESS.unlockedHeroesStory.splice(idx, 1);
            }
        };
        checar('Anhanga-Mirim', cleared.includes('pesadelo'));
        checar('Curupira', cleared.includes('normal'));
        checar('Kianumanka-Manã', cleared.includes('dificil'));
        checar('Abya', STORY_PROGRESS.abyaDesbloqueado && fragsNacao.length >= 7);
        checar('Rudá', STORY_PROGRESS.eventoRudaDesbloqueado && fragsEvento.length >= 7);
    };
    validarDesbloqueios();

    // 3. ⭐ WRAPPER — só post-processing, sem reescrever
    const _orig = window.renderOcaScreenFiltered;
    if (typeof _orig === 'function' && !_orig._v215fix) {
        window.renderOcaScreenFiltered = function() {
            const r = _orig.apply(this, arguments);

            setTimeout(() => {
                document.querySelectorAll('.story-hero-card.locked').forEach(card => {
                    const heroClass = card.getAttribute('data-hero');
                    if (!heroClass) return;

                    const heroData = (typeof STORY_HERO_CLASSES !== 'undefined')
                        ? STORY_HERO_CLASSES[heroClass] : null;
                    if (!heroData) return;

                    const lockInfo = card.querySelector('.story-hero-lock-info');
                    if (!lockInfo) return;

                    let reqTxt = '???';
                    if (heroData.unlockReq) {
                        if (heroData.unlockReq.type === 'special') {
                            reqTxt = heroClass === 'Abya'
                                ? '7 Fragmentos Ancestrais'
                                : '7 Fragmentos do Evento';
                        } else if (heroData.unlockReq.type === 'clear') {
                            const diffs = { normal: 'Normal', dificil: 'Difícil', pesadelo: 'Pesadelo' };
                            reqTxt = `Zerar o ${diffs[heroData.unlockReq.difficulty] || heroData.unlockReq.difficulty}`;
                        } else if (heroData.unlockReq.type === 'stars') {
                            reqTxt = `${heroData.starsNeeded} ⭐`;
                        }
                    } else if (heroData.starsNeeded !== null && heroData.starsNeeded !== undefined) {
                        reqTxt = `${heroData.starsNeeded} ⭐`;
                    }

                    lockInfo.innerHTML = `Desbloqueie ao<br><b>${reqTxt}</b>`;
                });
            }, 150);

            return r;
        };
        window.renderOcaScreenFiltered._v215fix = true;
        console.log('[V2.15-FIX] OCA: wrapper aplicado (patches anteriores preservados)');
    }

    // 4. Hook checkHeroUnlocks (mantém o comportamento original)
    const _origCheck = window.checkHeroUnlocks;
    if (typeof _origCheck === 'function' && !_origCheck._v215fix) {
        window.checkHeroUnlocks = function() {
            const r = _origCheck.apply(this, arguments);
            validarDesbloqueios();
            return r;
        };
        window.checkHeroUnlocks._v215fix = true;
    }
})();
// Cole no final do nacoes.js
(function centralizarPrecoLojaV216() {
    if (window._centralizarPrecoLojaV216) return;
    window._centralizarPrecoLojaV216 = true;

    // ⭐ MUDE O PREÇO AQUI (apenas este número)
    window._nacaoConfig.precoArma = 1000; 

    const _origRender = window.renderLojaNacoes;
    window.renderLojaNacoes = function() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;
        const ess = STORY_PROGRESS.inventory[window._nacaoConfig.moedaId] || 0;
        const preco = window._nacaoConfig.precoArma;

        const armasHTML = Object.values(window.NACAO_ARMAS).map(a => {
            const jaTem = (STORY_PROGRESS.nacaoArmas || []).includes(a.id);
            const pode = ess >= preco && !jaTem;
            return `
                <div class="nacao-shop-card ${jaTem?'owned':''}">
                    <div class="nacao-shop-icon">${a.emoji || '⚔️'}</div>
                    <div class="nacao-shop-name">${a.nome}</div>
                    <div class="nacao-shop-meta">+${a.atkBonus} ATK · ${a.elemento}</div>
                    <div class="nacao-shop-price">🌎 ${preco}</div>
                    <button class="nacao-shop-btn" ${pode?'':'disabled'}
                            onclick="window._nacaoComprarArma('${a.id}')">
                        ${jaTem?'✅ ADQUIRIDA':(pode?'COMPRAR':'FALTA')}
                    </button>
                </div>`;
        }).join('');

        screen.innerHTML = `
            <div class="story-container">
                <div class="story-header">
                    <h1 class="story-title">🌎 LOJA DAS NAÇÕES</h1>
                    <div style="margin-top:15px;font-family:'Cinzel',serif;font-size:1.1rem;">
                        Saldo: <b style="color:#e8b923;">${ess} Essências Ancestrais</b>
                    </div>
                </div>
                <div class="nacao-shop-grid">${armasHTML}</div>
                <div class="story-footer">
                    <button class="story-back-btn" onclick="window.renderSeteNacoesScreen()">← VOLTAR</button>
                </div>
            </div>
        `;
        screen.classList.add('active');
        screen.style.display = 'flex';
    };

    window._nacaoComprarArma = function(id) {
        const a = window.NACAO_ARMAS[id]; if (!a) return;
        if ((STORY_PROGRESS.nacaoArmas || []).includes(id)) return;
        const ess = STORY_PROGRESS.inventory[window._nacaoConfig.moedaId] || 0;
        const preco = window._nacaoConfig.precoArma;
        
        if (ess < preco) {
            if (typeof showToast === 'function') showToast('❌', 'Essências insuficientes!', '❌');
            return;
        }
        STORY_PROGRESS.inventory[window._nacaoConfig.moedaId] -= preco;
        if (!Array.isArray(STORY_PROGRESS.nacaoArmas)) STORY_PROGRESS.nacaoArmas = [];
        STORY_PROGRESS.nacaoArmas.push(id);
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        if (typeof showToast === 'function') showToast('🌎', `Arma: ${a.nome}`, '🌎');
        window.renderLojaNacoes();
    };

    console.log('✅ [V2.16] Preço da Loja das Nações centralizado.');
})();
// =================================================================
// nacoes.js — V2.17 — Fix CRÍTICO: recursão em getEnemySkillGrid
// -----------------------------------------------------------------
// Causa: V25.0 (historia.js, Bloco 91) chama getEnemySkillGrid() dentro
// de getEnemySkillGridPrecise() como fallback. Como o V25.0 também faz
// window.getEnemySkillGrid = getEnemySkillGridPrecise, o fallback vira
// recursão infinita para QUALQUER inimigo sem pattern em
// STORY_ENEMY_SKILL_PATTERNS — incluindo os 21 bosses das nações e os
// 8 do evento. Resultado: RangeError, bestiário não abre.
//
// Fix: substituir getEnemySkillGrid por versão sem recursão + fallback
// 3×3 no centro + patterns visuais para os bosses de nação/evento.
// =================================================================
(function fixGetEnemySkillGridV217() {
    if (window._fixGetEnemySkillGridV217) return;
    window._fixGetEnemySkillGridV217 = true;

    // Referência à versão atual (que é a getEnemySkillGridPrecise do V25.0)
    const _preciseRef = window.getEnemySkillGrid;

    // -------------------------------------------------------------
    // Fallback genérico — 3×3 no centro, sem recursão
    // -------------------------------------------------------------
    function _fallbackGrid() {
        const gridSize = 8, CX = 3, CY = 4;
        const afetados = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = CX + dx, ny = CY + dy;
                if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) afetados[ny][nx] = true;
            }
        }
        let html = '<div class="pa-mini-grid" style="grid-template-columns:repeat(8,18px);grid-template-rows:repeat(8,18px);gap:1px;">';
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const isEnemy = (x === CX && y === CY);
                const isAfetado = afetados[y][x];
                let cls = 'pa-mini-tile';
                if (isEnemy) cls += ' pa-mini-hero bg-AR';
                else if (isAfetado) cls += ' pa-mini-afetado bg-AR';
                else cls += ' pa-mini-vazio';
                html += `<div class="${cls}" style="width:18px;height:18px;font-size:11px;">${isEnemy ? '👹' : ''}</div>`;
            }
        }
        html += '</div>';
        return html;
    }

    // -------------------------------------------------------------
    // Wrapper sem recursão
    // -------------------------------------------------------------
    window.getEnemySkillGrid = function(enemyId, skillKey) {
        const patterns = (typeof STORY_ENEMY_SKILL_PATTERNS !== 'undefined')
            ? STORY_ENEMY_SKILL_PATTERNS : {};
        const pattern = patterns[enemyId]?.[skillKey === 'skill1' ? 's1' : 's2'];

        // Com pattern → deixa o Precise fazer o trabalho (não vai recursar
        // porque ele só chama getEnemySkillGrid quando NÃO tem pattern)
        if (pattern && typeof _preciseRef === 'function') {
            try {
                return _preciseRef.call(this, enemyId, skillKey);
            } catch (e) {
                console.warn('[V2.17] Precise falhou:', enemyId, e);
                return _fallbackGrid();
            }
        }

        // Sem pattern → fallback, sem recursão
        return _fallbackGrid();
    };

    // Sincroniza a variável local (alguns patches podem chamar `getEnemySkillGrid` direto)
    try { getEnemySkillGrid = window.getEnemySkillGrid; } catch (e) {}

    // -------------------------------------------------------------
    // Patterns visuais para os 21 bosses de nação e 8 do evento
    // (opcional — sem isso, o bestiário deles mostra 3×3 genérico)
    // -------------------------------------------------------------
    if (typeof STORY_ENEMY_SKILL_PATTERNS !== 'undefined') {
        const PATTERNS_NACAO = {
            // Nações — todos os deuses usam padrões do Ato 1..13
            nacao_yucahu:           { s1: { tipo:'area', raio:1 },          s2: { tipo:'global' } },
            nacao_atabey:           { s1: { tipo:'linha', raio:3 },         s2: { tipo:'global' } },
            nacao_juracan:          { s1: { tipo:'area', raio:2 },          s2: { tipo:'area', raio:1 } },
            nacao_quetzalcoatl:     { s1: { tipo:'diagonal_infinita' },     s2: { tipo:'area', raio:1 } },
            nacao_tezcatlipoca:     { s1: { tipo:'cruz_infinita' },         s2: { tipo:'area', raio:2 } },
            nacao_huitzilopochtli:  { s1: { tipo:'cruz_infinita' },         s2: { tipo:'global' } },
            nacao_kukulkan:         { s1: { tipo:'linha', raio:7 },         s2: { tipo:'diagonal_infinita' } },
            nacao_chaac:            { s1: { tipo:'area', raio:2 },          s2: { tipo:'linha', raio:7 } },
            nacao_ixchel:           { s1: { tipo:'area', raio:2 },          s2: { tipo:'global' } },
            nacao_illapa:           { s1: { tipo:'linha', raio:7 },         s2: { tipo:'global' } },
            nacao_mamaquilla:       { s1: { tipo:'area', raio:2 },          s2: { tipo:'cruz_infinita' } },
            nacao_supay:            { s1: { tipo:'global' },                 s2: { tipo:'area', raio:2 } },
            nacao_antu:             { s1: { tipo:'linha', raio:7 },         s2: { tipo:'area', raio:2 } },
            nacao_pillan:           { s1: { tipo:'area', raio:1 },          s2: { tipo:'global' } },
            nacao_wekufe:           { s1: { tipo:'area', raio:2 },          s2: { tipo:'area', raio:1 } },
            nacao_bochica:          { s1: { tipo:'linha', raio:7 },         s2: { tipo:'global' } },
            nacao_bachue:           { s1: { tipo:'area', raio:2 },          s2: { tipo:'area', raio:1 } },
            nacao_chibchacum:       { s1: { tipo:'cruz_infinita' },         s2: { tipo:'area', raio:2 } },
            nacao_maii:             { s1: { tipo:'area', raio:1 },          s2: { tipo:'global' } },
            nacao_spiderwoman:      { s1: { tipo:'area', raio:2 },          s2: { tipo:'cruz_infinita' } },
            nacao_hashchelti:       { s1: { tipo:'custom', tiles:[{x:-2,y:-2},{x:2,y:-2},{x:-2,y:2},{x:2,y:2},{x:0,y:0}] }, s2: { tipo:'global' } },
            // Evento semanal
            teju_jagua:             { s1: { tipo:'cruz_infinita' },         s2: { tipo:'global' } },
            mboi_tui:               { s1: { tipo:'linha', raio:7 },         s2: { tipo:'global' } },
            monai:                  { s1: { tipo:'area', raio:1 },          s2: { tipo:'global' } },
            jasy_jatere:            { s1: { tipo:'area', raio:1 },          s2: { tipo:'global' } },
            kurupi:                 { s1: { tipo:'global' },                 s2: { tipo:'area', raio:1 } },
            ao_ao:                  { s1: { tipo:'diagonal_infinita' },     s2: { tipo:'custom', tiles:[{x:2,y:2},{x:-2,y:2},{x:2,y:-2},{x:-2,y:-2}] } },
            luison:                 { s1: { tipo:'custom', tiles:[{x:-3,y:0},{x:-2,y:0},{x:-1,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0}] }, s2: { tipo:'global' } },
            pesadelo:               { s1: { tipo:'global' },                 s2: { tipo:'global' } },
        };
        Object.assign(STORY_ENEMY_SKILL_PATTERNS, PATTERNS_NACAO);
        console.log('[V2.17] Patterns visuais adicionados para', Object.keys(PATTERNS_NACAO).length, 'bosses.');
    }

    // -------------------------------------------------------------
    // Teste rápido
    // -------------------------------------------------------------
    try {
        const test = window.getEnemySkillGrid('nacao_yucahu', 'skill1');
        console.log('[V2.17] Teste nacao_yucahu OK:', test.length > 50 ? 'renderizado' : 'FALHOU');
    } catch (e) {
        console.error('[V2.17] Teste falhou:', e);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V2.17] getEnemySkillGrid corrigido');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Recursão infinita removida (fallback sem recursão)');
    console.log('• Patterns visuais adicionados para bosses de nação + evento');
    console.log('• Bestiário deve abrir normalmente');
    console.log('═══════════════════════════════════════════════════');
})();
(function filtrarNacoesDoBestiarioV218() {
    if (window._filtrarNacoesDoBestiarioV218) return;
    window._filtrarNacoesDoBestiarioV218 = true;

    const _orig = window.renderBestiaryScreen;
    if (typeof _orig !== 'function') return;

    window.renderBestiaryScreen = function() {
        const r = _orig.apply(this, arguments);
        setTimeout(() => {
            const grid = document.querySelector('.bestiary-grid');
            if (!grid) return;
            // Remove cards de nação (id começando com nacao_)
            grid.querySelectorAll('.bestiary-card').forEach(card => {
                const nameEl = card.querySelector('.bestiary-card-name');
                if (!nameEl) return;
                // Os cards de nação aparecem como "???" — verifica data via título
                const titleEl = card.querySelector('.bestiary-card-meta');
                if (titleEl && titleEl.textContent.includes('· Boss') &&
                    titleEl.textContent.includes('Ato')) {
                    // Este padrão é do bestiário de nação mapeado como se fosse ato
                    // Deixa passar — só remove se casar com a assinatura específica
                }
                // Melhor: filtra pelo conteúdo do nome "???" E title contendo "Boss"
                if (nameEl.textContent.trim() === '???' &&
                    titleEl && titleEl.textContent.includes('Desconhecido')) {
                    // Card fantasma de nação no bestiário do evento
                    card.remove();
                }
            });
        }, 100);
        return r;
    };

    console.log('✅ [V2.18] Bestiário do evento: cards de nação fantasma removidos.');
})();
// =================================================================
// nacoes.js — V2.21 — Fix: #gameScreen fantasma + botão flutuante
// -----------------------------------------------------------------
// Sintoma: após vitória de fase de nação, #gameScreen continua com
// .active + display:flex escondido atrás do #storyScreen. Isso faz
// updateFloatingBtnVisibility (historia.js) esconder o botão de
// voltar, porque a lógica é "se #gameScreen.active, esconder botão".
//
// Causa: V2.11 (topo da cadeia finishStoryPhase) retorna cedo em
// vitória de nação, sem chamar V2.8/V2.6/_origFinish. E o único
// código que fecha #gameScreen está no V2.10, que só roda via
// eventoFinalizarPartida (fase BOSS e Pesadelo).
//
// Fix:
//   1. Wrappers em TODOS os renders de menu fecham #gameScreen
//   2. Safety net detecta gameScreen fantasma (ativo + sem batalha real)
//   3. Safety net re-mostra o botão flutuante quando #gameScreen está fechado
// =================================================================
(function limparGameScreenFantasmaV221() {
    if (window._limparGameScreenFantasmaV221) return;
    window._limparGameScreenFantasmaV221 = true;

    function _fecharGameScreen() {
        const gs = document.getElementById('gameScreen');
        if (!gs) return;
        gs.classList.remove('active');
        gs.style.display = 'none';
    }

    // ═════════════════════════════════════════════════════════
    // 1. Fechar #gameScreen ao renderizar telas de menu
    // ═════════════════════════════════════════════════════════
    ['renderAldeiaScreen', 'renderSeteNacoesScreen', 'renderFasesNacao',
     'renderOcaScreenFiltered', 'renderRitualScreen', 'renderAtosScreen',
     'renderChapterPhases', 'renderLojaNacoes', 'renderLojaScreenCompleta',
     'renderTesourariaScreen', 'renderBestiaryScreen', 'renderEventoSemanalScreen']
        .forEach(nome => {
            const _orig = window[nome];
            if (typeof _orig !== 'function' || _orig._v221) return;
            window[nome] = function() {
                _fecharGameScreen();
                return _orig.apply(this, arguments);
            };
            window[nome]._v221 = true;
        });

     // ═════════════════════════════════════════════════════════
    // 2. Safety net: detecta #gameScreen fantasma
    // ═════════════════════════════════════════════════════════
    setInterval(() => {
        const ss = document.getElementById('storyScreen');
        const gs = document.getElementById('gameScreen');
        if (!ss || !gs) return;
        if (!ss.classList.contains('active')) return;
        if (!gs.classList.contains('active')) return;

        const emBatalhaReal =
            window._storyMode === true ||
            window._eventoAtivo === true ||
            (window._nacaoBatalha && window._nacaoBatalha.ativa === true) ||
            window._nacaoAtivo === true;

        const emTransicao =
            document.getElementById('purificacaoOverlay') ||
            document.getElementById('storyPurificationOverlay') ||
            document.getElementById('storySaciFinalOverlay') ||
            document.getElementById('storySaciDialogOverlay') ||
            document.getElementById('storyVictoryOverlay') ||
            document.getElementById('nacaoVictoryOverlay') ||
            document.querySelector('.story-saci-dialog-overlay') ||
            document.querySelector('.story-result-overlay');

        if (!emBatalhaReal && !emTransicao) {
            console.log('[V2.21] #gameScreen fantasma — fechando');
            _fecharGameScreen();
        }
    }, 500);
    // ═════════════════════════════════════════════════════════
    // 3. Safety net: re-mostrar botão flutuante
    // ═════════════════════════════════════════════════════════
    setInterval(() => {
        const btn = document.getElementById('floatingBackBtn');
        const ss = document.getElementById('storyScreen');
        const gs = document.getElementById('gameScreen');
        if (!btn || !ss) return;

        const ssAtivo = ss.classList.contains('active') &&
                        getComputedStyle(ss).display !== 'none';
        if (!ssAtivo) {
            if (btn.style.display !== 'none') btn.style.display = 'none';
            return;
        }

        // #gameScreen "de verdade" visível?
        const gsAtivoReal = gs &&
                           gs.classList.contains('active') &&
                           getComputedStyle(gs).display !== 'none';

        // Aldeia tem título diferente (a tela principal não usa .story-title)
        const naAldeia = !!ss.querySelector('.story-ald-title') ||
                        (ss.querySelector('.story-title')?.textContent?.trim().toUpperCase() === 'ALDEIA');

        const shouldShow = !gsAtivoReal && !naAldeia;

        if (shouldShow && btn.style.display !== 'flex') {
            btn.style.display = 'flex';
        } else if (!shouldShow && btn.style.display !== 'none') {
            btn.style.display = 'none';
        }
    }, 500);

    // ═════════════════════════════════════════════════════════
    // 4. Debug
    // ═════════════════════════════════════════════════════════
    window._debugGameScreenV221 = function() {
        const gs = document.getElementById('gameScreen');
        const ss = document.getElementById('storyScreen');
        const btn = document.getElementById('floatingBackBtn');
        console.group('=== [V2.21] #gameScreen ===');
        console.log('gameScreen.active:', gs?.classList.contains('active'));
        console.log('gameScreen.display:', gs?.style.display);
        console.log('storyScreen.active:', ss?.classList.contains('active'));
        console.log('storyScreen.display:', ss?.style.display);
        console.log('botão display:', btn?.style.display);
        console.log('boss:', boss ? { hp: boss.hp, dead: boss.dead } : 'null');
        console.log('flags:', {
            _storyMode: window._storyMode,
            _eventoAtivo: window._eventoAtivo,
            _nacaoAtivo: window._nacaoAtivo,
            _nacaoBatalha: window._nacaoBatalha?.ativa,
        });
        console.groupEnd();
    };

    window._forcarFecharGameScreen = function() {
        _fecharGameScreen();
        console.log('✅ #gameScreen fechado');
    };

    console.log('✅ [V2.21] Fix #gameScreen fantasma');
    console.log('💡 Debug: window._debugGameScreenV221()');
    console.log('💡 Forçar: window._forcarFecharGameScreen()');
})();
// =================================================================
// nacoes.js — V2.22 — Fix: progresso de nação reseta ao voltar
// -----------------------------------------------------------------
// Causa: V2.0._getProg usa semana calculada ('2026-10-27') como
// fallback. V2.8/V2.10 usam 'fallback' literal. Quando getWeekId
// não está definido, os dois valores NUNCA batem → _getProg reseta
// o progresso toda vez que renderSeteNacoesScreen roda.
//
// Fix:
//   1. Define window.getWeekId (fallback consistente)
//   2. Migra saves antigos com 'fallback' pra semana atual
//   3. Safety net: preserva progresso se reset indevido for detectado
// =================================================================
(function fixSemanaNacoesV222() {
    if (window._fixSemanaNacoesV222) return;
    window._fixSemanaNacoesV222 = true;

    // ─────────────────────────────────────────────────────────────
    // 1. Define getWeekId se não existe (fallback consistente)
    // ─────────────────────────────────────────────────────────────
    if (typeof window.getWeekId !== 'function') {
        window.getWeekId = function() {
            const d = new Date();
            const dia = d.getDay();
            d.setDate(d.getDate() - (dia === 0 ? 6 : dia - 1));
            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        };
        console.log('[V2.22] window.getWeekId() definido (fallback consistente)');
    }

    // ─────────────────────────────────────────────────────────────
    // 2. Migra saves antigos com 'fallback' ou formato inválido
    // ─────────────────────────────────────────────────────────────
    function migrarSaves() {
        if (typeof STORY_PROGRESS === 'undefined') return 0;
        if (!STORY_PROGRESS.nacaoProgressoPorDificuldade) return 0;

        const semanaAtual = window.getWeekId();
        let migrados = 0;
        let preservados = 0;

        Object.keys(STORY_PROGRESS.nacaoProgressoPorDificuldade).forEach(diff => {
            const bucket = STORY_PROGRESS.nacaoProgressoPorDificuldade[diff];
            if (!bucket) return;

            Object.keys(bucket).forEach(nacaoId => {
                const prog = bucket[nacaoId];
                if (!prog) return;

                const semanaValida = /^\d{4}-\d{2}-\d{2}$/.test(prog.semana || '');

                if (!semanaValida) {
                    // 'fallback', null, undefined, formato inválido → força semana atual
                    prog.semana = semanaAtual;
                    migrados++;
                } else if (prog.semana === semanaAtual) {
                    // já está correto
                } else {
                    // semana válida mas diferente → mudança de semana REAL (não migra)
                    preservados++;
                }
            });
        });

        if (migrados > 0 && typeof saveStoryProgress === 'function') {
            saveStoryProgress();
            console.log(`[V2.22] ${migrados} progressos migrados pra semana ${semanaAtual}`);
        }

        return migrados;
    }

    migrarSaves();
    setTimeout(migrarSaves, 500);

    // ─────────────────────────────────────────────────────────────
    // 3. Re-migra após load de save
    // ─────────────────────────────────────────────────────────────
    const _origLoad = window.loadStoryProgressByName;
    if (typeof _origLoad === 'function' && !_origLoad._v222) {
        window.loadStoryProgressByName = function() {
            const r = _origLoad.apply(this, arguments);
            if (r) setTimeout(migrarSaves, 150);
            return r;
        };
        window.loadStoryProgressByName._v222 = true;
    }

    // ─────────────────────────────────────────────────────────────
    // 4. Safety net: preserva progresso se reset indevido
    // -------------------------------------------------------------
    // Observa STORY_PROGRESS.nacaoProgressoPorDificuldade. Se um
    // reset acontecer na MESMA semana (fasesConcluidas vira [] mas
    // semana continua igual), restaura do backup.
    // ─────────────────────────────────────────────────────────────
    let _snapshotAnterior = null;

    function _fazerSnapshot() {
        if (typeof STORY_PROGRESS === 'undefined') return;
        if (!STORY_PROGRESS.nacaoProgressoPorDificuldade) return;
        try {
            _snapshotAnterior = JSON.parse(JSON.stringify(
                STORY_PROGRESS.nacaoProgressoPorDificuldade
            ));
        } catch (e) {}
    }

    function _checarReset() {
        if (!_snapshotAnterior || typeof STORY_PROGRESS === 'undefined') return;
        const atual = STORY_PROGRESS.nacaoProgressoPorDificuldade;
        if (!atual) return;

        const semanaAtual = window.getWeekId();
        let corrigido = false;

        Object.keys(_snapshotAnterior).forEach(diff => {
            const antes = _snapshotAnterior[diff];
            const agora = atual[diff];
            if (!antes || !agora) return;

            Object.keys(antes).forEach(nacaoId => {
                const pAntes = antes[nacaoId];
                const pAgora = agora[nacaoId];
                if (!pAntes || !pAgora) return;

                // Reset suspeito: antes tinha fases, agora está vazio,
                // e a semana atual NÃO mudou.
                if (Array.isArray(pAntes.fasesConcluidas) &&
                    pAntes.fasesConcluidas.length > 0 &&
                    (!pAgora.fasesConcluidas || pAgora.fasesConcluidas.length === 0) &&
                    pAntes.semana === semanaAtual &&
                    pAgora.semana === semanaAtual) {

                    console.warn(`[V2.22] Reset suspeito detectado: ${diff}/${nacaoId}. Restaurando.`);
                    pAgora.fasesConcluidas = pAntes.fasesConcluidas.slice();
                    pAgora.bossDerrotados = (pAntes.bossDerrotados || []).slice();
                    corrigido = true;
                }
            });
        });

        if (corrigido && typeof saveStoryProgress === 'function') {
            saveStoryProgress();
        }
    }

    setTimeout(_fazerSnapshot, 800);

    // Snapshot a cada 3s; verifica reset a cada 1.5s
    setInterval(_fazerSnapshot, 3000);
    setInterval(_checarReset, 1500);

    // ─────────────────────────────────────────────────────────────
    // 5. Debug
    // ─────────────────────────────────────────────────────────────
    window._debugSemanaV222 = function() {
        console.group('=== [V2.22] Semana Nacoes ===');
        console.log('getWeekId():', window.getWeekId());
        console.log('Progresso atual:', JSON.parse(JSON.stringify(
            STORY_PROGRESS.nacaoProgressoPorDificuldade || {}
        )));
        console.log('Snapshot anterior:', _snapshotAnterior);
        console.groupEnd();
    };

    window._forcarMigrarSemana = function() {
        const n = migrarSaves();
        console.log(`✅ ${n} progressos migrados`);
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V2.22] Fix semana de nações');
    console.log('═══════════════════════════════════════════════════');
    console.log('• window.getWeekId() definido (fallback consistente)');
    console.log('• Saves antigos com "fallback" migrados');
    console.log('• Safety net restaura progresso se reset indevido');
    console.log('• Reset semanal REAL (segunda) continua funcionando');
    console.log('');
    console.log('💡 Debug:  window._debugSemanaV222()');
    console.log('💡 Forçar: window._forcarMigrarSemana()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// nacoes.js — V2.23 — Permitir rejogar nação completa
// -----------------------------------------------------------------
// Causa: renderSeteNacoesScreen desabilita o botão do card quando
// completo === true. Mas o _nacaoEntrar e _iniciarFaseNacao NÃO
// bloqueiam — o bloqueio é só visual. O jogador podia rejogar
// as fases dentro da nação, mas nunca conseguia entrar de novo
// depois de completar as 3, porque o card principal sumia o botão.
//
// Fix: post-processing nos cards completos — reabilita o botão
// e muda o texto pra "↻ REJOGAR".
// =================================================================
(function permitirRejogarV223() {
    if (window._permitirRejogarV223) return;
    window._permitirRejogarV223 = true;

    const _origRender = window.renderSeteNacoesScreen;
    if (typeof _origRender !== 'function') {
        console.warn('[V2.23] renderSeteNacoesScreen não existe.');
        return;
    }

    window.renderSeteNacoesScreen = function() {
        const r = _origRender.apply(this, arguments);

        setTimeout(() => {
            document.querySelectorAll('.nacao-card').forEach(card => {
                const badge = card.querySelector('.nacao-badge');
                const btn = card.querySelector('.nacao-card-btn');
                if (!badge || !btn) return;

                // Card concluído → liberar rejogo
                if (badge.classList.contains('concluido')) {
                    btn.disabled = false;
                    btn.textContent = '↻ REJOGAR';
                    // Estilo dourado (mesmo do ENTRAR)
                    btn.style.background =
                        'linear-gradient(180deg, rgba(232,185,35,.2), transparent 45%), ' +
                        'linear-gradient(135deg, #8a6a2e, #4a3418)';
                    btn.style.color = '#fff5dc';
                    btn.style.borderColor = '#e8b923';
                    btn.style.cursor = 'pointer';
                }
            });
        }, 60);

        return r;
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V2.23] Nação completa agora permite rejogar');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Card "CONCLUÍDO" agora mostra "↻ REJOGAR"');
    console.log('• Botão reabilitado quando completo');
    console.log('• Rejogar cobra o custo normal de ouro por fase');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// nacoes.js — V2.24 — Sprites das armas, amuletos e fragmentos
// -----------------------------------------------------------------
// Cole os links nas 3 tabelas abaixo. Elas são injetadas nas
// tabelas do historia.js:
//   • NACAO_ARMAS_SPRITES    → EVENTO_SPRITES
//   → renderizado em: Loja das Nações, Tesouraria, Equipar
//   • NACAO_AMULETOS_SPRITES → STORY_AMULET_SPRITES
//   → renderizado em: Tesouraria, Equipar
//   • NACAO_FRAGMENTOS_SPRITES → STORY_MATERIAL_SPRITES + SPRITES_STORY
//   → renderizado em: barra de progresso (renderSeteNacoesScreen) + Tesouraria
//
// ⚠️ Deixe '' (vazio) pra usar o emoji fallback.
// =================================================================
(function spritesNacoesV224() {
    if (window._spritesNacoesV224) return;
    window._spritesNacoesV224 = true;

    // ─────────────────────────────────────────────────────────────
    // 1. AS 21 ARMAS — cole os URLs entre as aspas
    // ─────────────────────────────────────────────────────────────
    const NACAO_ARMAS_SPRITES = {
        // TAÍNOS
        'arma_nacao_tainos_tacape': 'https://i.imgur.com/jErejeH.png',
        'arma_nacao_tainos_flecha': '',
        'arma_nacao_tainos_cajado': '',
        // ASTECAS
        'arma_nacao_astecas_tacape': 'https://i.imgur.com/puIbGum.png',
        'arma_nacao_astecas_flecha': '',
        'arma_nacao_astecas_cajado': '',
        // MAIAS
        'arma_nacao_maias_tacape': 'https://i.imgur.com/TrczXWd.png',
        'arma_nacao_maias_flecha': '',
        'arma_nacao_maias_cajado': '',
        // INCAS
        'arma_nacao_incas_tacape': 'https://i.imgur.com/WdogafC.png',
        'arma_nacao_incas_flecha': '',
        'arma_nacao_incas_cajado': '',
        // MAPUCHES
        'arma_nacao_mapuches_tacape': 'https://i.imgur.com/IhASPgP.png',
        'arma_nacao_mapuches_flecha': '',
        'arma_nacao_mapuches_cajado': '',
        // CHIBCHAS
        'arma_nacao_chibchas_tacape': 'https://i.imgur.com/OhKNR9r.png',
        'arma_nacao_chibchas_flecha': '',
        'arma_nacao_chibchas_cajado': '',
        // NAVAJOS
        'arma_nacao_navajos_tacape': 'https://i.imgur.com/UAth7wr.png',
        'arma_nacao_navajos_flecha': '',
        'arma_nacao_navajos_cajado': '',
    };

    // ─────────────────────────────────────────────────────────────
    // 2. OS 7 AMULETOS
    // ─────────────────────────────────────────────────────────────
    const NACAO_AMULETOS_SPRITES = {
        'amuleto_nacao_tainos': 'https://i.imgur.com/AeYbqVo.png',
        'amuleto_nacao_astecas': 'https://i.imgur.com/2jW3wj3.png',
        'amuleto_nacao_maias': 'https://i.imgur.com/BdlqNlg.png',
        'amuleto_nacao_incas': 'https://i.imgur.com/nZOkx6G.png',
        'amuleto_nacao_mapuches': 'https://i.imgur.com/hue6wua.png',
        'amuleto_nacao_chibchas': 'https://i.imgur.com/isHRv2k.png',
        'amuleto_nacao_navajos': 'https://i.imgur.com/Yea7J8a.png',
    };

    // ─────────────────────────────────────────────────────────────
    // 3. OS 7 FRAGMENTOS
    // ─────────────────────────────────────────────────────────────
    const NACAO_FRAGMENTOS_SPRITES = {
        'fragmento_nacao_tainos': 'https://i.imgur.com/K9fBYSO.png',
        'fragmento_nacao_astecas': 'https://i.imgur.com/CzyoCDQ.png',
        'fragmento_nacao_maias': 'https://i.imgur.com/iTFUNac.png',
        'fragmento_nacao_incas': 'https://i.imgur.com/v1R5JOA.png',
        'fragmento_nacao_mapuches': 'https://i.imgur.com/CVlMP9R.png',
        'fragmento_nacao_chibchas': 'https://i.imgur.com/AiXAuyL.png',
        'fragmento_nacao_navajos': 'https://i.imgur.com/N70E8gG.png',
    };

    // ─────────────────────────────────────────────────────────────
    // 4. INJETA nas tabelas do historia.js
    // ─────────────────────────────────────────────────────────────
    let injetados = 0;

    if (typeof EVENTO_SPRITES !== 'undefined') {
        Object.assign(EVENTO_SPRITES, NACAO_ARMAS_SPRITES);
        Object.keys(NACAO_ARMAS_SPRITES).forEach(k => {
            if (NACAO_ARMAS_SPRITES[k]) injetados++;
        });
    }

    if (typeof STORY_AMULET_SPRITES !== 'undefined') {
        Object.assign(STORY_AMULET_SPRITES, NACAO_AMULETOS_SPRITES);
        Object.keys(NACAO_AMULETOS_SPRITES).forEach(k => {
            if (NACAO_AMULETOS_SPRITES[k]) injetados++;
        });
    }

    if (typeof STORY_MATERIAL_SPRITES !== 'undefined') {
        Object.assign(STORY_MATERIAL_SPRITES, NACAO_FRAGMENTOS_SPRITES);
    }
    if (typeof SPRITES_STORY !== 'undefined') {
        Object.assign(SPRITES_STORY, NACAO_FRAGMENTOS_SPRITES);
        Object.keys(NACAO_FRAGMENTOS_SPRITES).forEach(k => {
            if (NACAO_FRAGMENTOS_SPRITES[k]) injetados++;
        });
    }

    console.log(`[V2.24] ${injetados} sprites injetados (armas + amuletos + fragmentos).`);
    if (injetados === 0) {
        console.log('[V2.24] Nenhum sprite configurado ainda. Cole os URLs no bloco V2.24.');
    }

    // ─────────────────────────────────────────────────────────────
    // 5. PATCH: Loja das Nações usa getWeaponIcon
    // -------------------------------------------------------------
    // V2.16 hardcoded "a.emoji || '⚔️'". Precisa usar o helper.
    // ─────────────────────────────────────────────────────────────
    const _origRenderLoja = window.renderLojaNacoes;
    if (typeof _origRenderLoja === 'function' && !_origRenderLoja._v224) {
        window.renderLojaNacoes = function() {
            const r = _origRenderLoja.apply(this, arguments);

            setTimeout(() => {
                const cards = document.querySelectorAll('.nacao-shop-card');
                cards.forEach(card => {
                    const nameEl = card.querySelector('.nacao-shop-name');
                    const iconEl = card.querySelector('.nacao-shop-icon');
                    if (!nameEl || !iconEl) return;
                    if (iconEl.dataset.iconPatched === '1') return;

                    // Acha a arma pelo nome
                    const arma = Object.values(window.NACAO_ARMAS || {}).find(a => a.nome === nameEl.textContent.trim());
                    if (!arma) return;

                    const url = NACAO_ARMAS_SPRITES[arma.id];
                    if (url && url.trim() !== '') {
                        iconEl.innerHTML = `<img src="${url}" alt="${arma.nome}" style="width:64px;height:64px;object-fit:contain;">`;
                    }
                    // Sem URL → deixa o emoji original

                    iconEl.dataset.iconPatched = '1';
                });
            }, 100);

            return r;
        };
        window.renderLojaNacoes._v224 = true;
    }

    // ─────────────────────────────────────────────────────────────
    // 6. PATCH: nacaoIcon aceita fragmentos via STORY_MATERIAL_SPRITES
    // -------------------------------------------------------------
    // renderSeteNacoesScreen usa nacaoIcon(fid) pra fragmentos,
    // mas nacaoIcon só olha SPRITES_STORY. Já cobrimos acima
    // (Object.assign SPRITES_STORY). Este patch é redundância
    // pra quando o URL está só em STORY_MATERIAL_SPRITES.
    // ─────────────────────────────────────────────────────────────
    const _origNacaoIcon = window.nacaoIcon;
    if (typeof _origNacaoIcon === 'function' && !_origNacaoIcon._v224) {
        window.nacaoIcon = function(key, size) {
            // Tenta material sprite primeiro (se for fragmento)
            if (typeof STORY_MATERIAL_SPRITES !== 'undefined' &&
                key.startsWith('fragmento_nacao_') &&
                STORY_MATERIAL_SPRITES[key] && STORY_MATERIAL_SPRITES[key].trim() !== '') {
                const url = STORY_MATERIAL_SPRITES[key];
                const cls = size === 'large' ? 'nacao-icon nacao-icon-lg' : 'nacao-icon';
                return `<img src="${url}" class="${cls}" alt="${key}">`;
            }
            return _origNacaoIcon.apply(this, arguments);
        };
        window.nacaoIcon._v224 = true;
    }

    // ─────────────────────────────────────────────────────────────
    // 7. Debug
    // ─────────────────────────────────────────────────────────────
    window._debugSpritesNacoes = function() {
        console.group('=== [V2.24] Sprites das nações ===');
        const armas = Object.keys(NACAO_ARMAS_SPRITES).filter(k => NACAO_ARMAS_SPRITES[k]);
        const amus  = Object.keys(NACAO_AMULETOS_SPRITES).filter(k => NACAO_AMULETOS_SPRITES[k]);
        const frags = Object.keys(NACAO_FRAGMENTOS_SPRITES).filter(k => NACAO_FRAGMENTOS_SPRITES[k]);
        console.log(`Armas: ${armas.length}/21 configuradas`);
        console.log(`Amuletos: ${amus.length}/7 configurados`);
        console.log(`Fragmentos: ${frags.length}/7 configurados`);
        console.log('');
        console.log('Exemplo de renderização:');
        if (typeof getWeaponIcon === 'function') {
            console.log('  arma_nacao_tainos_tacape →', getWeaponIcon('arma_nacao_tainos_tacape', 'normal').slice(0, 80));
        }
        if (typeof getAmuletIcon === 'function') {
            console.log('  amuleto_nacao_tainos →', getAmuletIcon('amuleto_nacao_tainos', 'normal').slice(0, 80));
        }
        if (typeof getMaterialIcon === 'function') {
            console.log('  fragmento_nacao_tainos →', getMaterialIcon('fragmento_nacao_tainos', 'normal').slice(0, 80));
        }
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V2.24] Sprites das nações');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Cole URLs nas 3 tabelas no topo do V2.24');
    console.log('• Loja das Nações renderiza armas via getWeaponIcon');
    console.log('• Barra de progresso renderiza fragmentos via nacaoIcon');
    console.log('');
    console.log('💡 Debug: window._debugSpritesNacoes()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// nacoes.js — V2.26 — Fundos temáticos das Sete Nações (wide + mobile)
// -----------------------------------------------------------------
// Cada nação tem 2 URLs:
//   • desktop: 16:9 ou mais (1920×1080, 2400×1350, 2560×1440)
//   • mobile:  vertical (1080×1920 ou 900×1600)
//
// Detecta mobile via viewport width <= 768px (ajustável).
// Escuta resize / orientationchange e troca automaticamente.
//
// ⚠️ Cole os URLs entre as aspas. Vazio = usa o CSS padrão.
// =================================================================
(function fundosNacoesV226() {
    if (window._fundosNacoesV226) return;
    window._fundosNacoesV226 = true;

    // ─────────────────────────────────────────────────────────────
    // ⭐ CONFIG — cole URLs aqui
    // ─────────────────────────────────────────────────────────────
    const BREAKPOINT_MOBILE = 768; // px — abaixo disso usa mobile

    const NACAO_BACKGROUNDS = {
        'evento': {
            desktop: 'https://i.imgur.com/T1TsRdi.jpeg',   // mapa wide 16:9
            mobile:  'https://i.imgur.com/c3ToOWA.jpeg',   // mapa vertical 9:16
        },
        'tainos': {
            desktop: 'https://i.imgur.com/4AcwFkH.jpeg',
            mobile:  'https://i.imgur.com/e6gWJAl.jpeg',
        },
        'astecas': {
            desktop: 'https://i.imgur.com/jPVCZqh.jpeg',
            mobile:  'https://i.imgur.com/iWk1dGR.jpeg',
        },
        'maias': {
            desktop: 'https://i.imgur.com/XjIC7Qc.jpeg',
            mobile:  'https://i.imgur.com/OIGo51j.jpeg',
        },
        'incas': {
            desktop: 'https://i.imgur.com/3N81mN4.jpeg',
            mobile:  'https://i.imgur.com/p1M0Gbz.jpeg',
        },
        'mapuches': {
            desktop: 'https://i.imgur.com/5EMgV8I.jpeg',
            mobile:  'https://i.imgur.com/P183zrN.jpeg',
        },
        'chibchas': {
            desktop: 'https://i.imgur.com/KqlUmqT.jpeg',
            mobile:  'https://i.imgur.com/ubOUWzH.jpeg',
        },
        'navajos': {
            desktop: 'https://i.imgur.com/6AwL4WC.jpeg',
            mobile:  'https://i.imgur.com/oKBPTmA.jpeg',
        },
    };

    // ─────────────────────────────────────────────────────────────
    // Utilitários
    // ─────────────────────────────────────────────────────────────
    function _isMobile() {
        return window.innerWidth <= BREAKPOINT_MOBILE;
    }

    function _resolverURL(chave) {
        const entry = NACAO_BACKGROUNDS[chave];
        if (!entry) return null;
        const url = _isMobile() ? entry.mobile : entry.desktop;
        if (!url || String(url).trim() === '') return null;
        return String(url).trim();
    }

    // ─────────────────────────────────────────────────────────────
    // Aplica / remove o fundo
    // ─────────────────────────────────────────────────────────────
    function _aplicarFundo(url) {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;

        if (url) {
            // Mobile: overlay mais escuro (texto pequeno precisa de mais contraste)
            const overlayAlpha = _isMobile()
                ? { top: 0.82, bottom: 0.94 }
                : { top: 0.78, bottom: 0.92 };

            screen.style.backgroundImage = `
                radial-gradient(ellipse at top, rgba(201,162,39,.12), transparent 55%),
                linear-gradient(rgba(10,6,2,${overlayAlpha.top}), rgba(10,6,2,${overlayAlpha.bottom})),
                url('${url}')
            `;
            screen.style.backgroundSize = 'auto, auto, cover';
            screen.style.backgroundPosition = 'center center';
            screen.style.backgroundRepeat = 'no-repeat';
            screen.style.backgroundAttachment = 'scroll';
        } else {
            screen.style.backgroundImage = '';
            screen.style.backgroundSize = '';
            screen.style.backgroundPosition = '';
            screen.style.backgroundRepeat = '';
            screen.style.backgroundAttachment = '';
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Descobre a chave do fundo baseado no título da tela
    // ─────────────────────────────────────────────────────────────
    function _resolverChave() {
        const screen = document.getElementById('storyScreen');
        if (!screen || !screen.classList.contains('active')) return null;
        const titleEl = screen.querySelector('.story-title');
        if (!titleEl) return null;

        const raw = titleEl.textContent || '';
        const title = raw.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\s]+/u, '').toUpperCase().trim();

        // Tela principal do evento
        if (title.includes('AS SETE NAÇÕES') || title === 'SETE NAÇÕES') return 'evento';

        // Loja das Nações (mantém a imagem do mapa)
        if (title.includes('LOJA DAS NAÇÕES')) return 'evento';

        // Fases de uma nação (título = nome da nação)
        if (typeof NACOES !== 'undefined') {
            for (const id in NACOES) {
                const nome = NACOES[id].nome.toUpperCase().trim();
                if (title === nome || title.startsWith(nome)) return id;
            }
        }

        return null; // qualquer outra tela → fundo padrão
    }

    // ─────────────────────────────────────────────────────────────
    // Atualiza o fundo (considera mobile/desktop + tela atual)
    // ─────────────────────────────────────────────────────────────
    let _ultimaChave = null;
    let _ultimaURL = null;

    function _atualizarFundo(force) {
        const chave = _resolverChave();
        const url = chave ? _resolverURL(chave) : null;

        // Se nada mudou e não é force, não faz nada
        if (!force && chave === _ultimaChave && url === _ultimaURL) return;
        _ultimaChave = chave;
        _ultimaURL = url;

        _aplicarFundo(url);
        if (url) {
            console.log(`[V2.26] Fundo: ${chave} (${_isMobile() ? 'mobile' : 'desktop'})`);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Observer no #storyScreen (sobrevive a wrappers)
    // ─────────────────────────────────────────────────────────────
    let _observer = null;

    function _instalarObserver() {
        const screen = document.getElementById('storyScreen');
        if (!screen) { setTimeout(_instalarObserver, 300); return; }

        if (_observer) _observer.disconnect();

        _observer = new MutationObserver(() => {
            _atualizarFundo(false);
        });

        _observer.observe(screen, {
            childList: true,
            subtree: true,
            characterData: true,
        });

        _atualizarFundo(true);
        console.log('[V2.26] Observer de fundo instalado.');
    }

    // ─────────────────────────────────────────────────────────────
    // Resize / orientationchange → troca desktop ↔ mobile
    // ─────────────────────────────────────────────────────────────
    let _resizeTimer = null;

    function _onResize() {
        clearTimeout(_resizeTimer);
        _resizeTimer = setTimeout(() => {
            _atualizarFundo(true); // force = re-aplica com a URL correta
        }, 150); // debounce
    }

    window.addEventListener('resize', _onResize);
    window.addEventListener('orientationchange', () => {
        setTimeout(() => _atualizarFundo(true), 250); // deixa o navegador reflowar
    });

    // matchMedia listener — mais preciso que resize pra trocar breakpoint
    try {
        const mq = window.matchMedia(`(max-width: ${BREAKPOINT_MOBILE}px)`);
        if (mq.addEventListener) {
            mq.addEventListener('change', () => _atualizarFundo(true));
        } else if (mq.addListener) {
            mq.addListener(() => _atualizarFundo(true));
        }
    } catch(e) {}

    // ─────────────────────────────────────────────────────────────
    // Watchdog 1: se o #storyScreen for recriado, reinstala
    // ─────────────────────────────────────────────────────────────
    setInterval(() => {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;
        if (!_observer) { _instalarObserver(); return; }
        if (screen !== _observer._screen) {
            _observer._screen = screen;
            _instalarObserver();
        }
    }, 2000);

    // ─────────────────────────────────────────────────────────────
    // Watchdog 2: aplica fundo em telas abertas por fora do observer
    // ─────────────────────────────────────────────────────────────
    setInterval(() => {
        const screen = document.getElementById('storyScreen');
        if (!screen || !screen.classList.contains('active')) return;
        _atualizarFundo(false);
    }, 1000);

    // ─────────────────────────────────────────────────────────────
    // Debug
    // ─────────────────────────────────────────────────────────────
    window._debugFundosV226 = function() {
        const screen = document.getElementById('storyScreen');
        const titleEl = screen?.querySelector('.story-title');
        const chave = _resolverChave();
        console.group('=== [V2.26] Fundos das Nações ===');
        console.log('Tela mobile?', _isMobile(), `(width: ${window.innerWidth}px)`);
        console.log('Título atual:', titleEl?.textContent?.trim() || '(sem título)');
        console.log('Chave resolvida:', chave || '(nenhuma)');
        if (chave) {
            const entry = NACAO_BACKGROUNDS[chave];
            console.log('  Desktop:', entry.desktop ? '✅' : '⬜');
            console.log('  Mobile: ', entry.mobile ? '✅' : '⬜');
            console.log('  Usando: ', _isMobile() ? 'mobile' : 'desktop');
        }
        console.log('');
        console.log('Background inline:', screen?.style.backgroundImage?.slice(0, 120) || '(vazio)');
        console.log('');
        console.log('Todas as URLs:');
        Object.keys(NACAO_BACKGROUNDS).forEach(k => {
            const e = NACAO_BACKGROUNDS[k];
            console.log(`  ${k.padEnd(10)} desktop:${e.desktop ? '✅' : '⬜'}  mobile:${e.mobile ? '✅' : '⬜'}`);
        });
        console.groupEnd();
    };

    window._testFundoNacao = function(id, forceMode) {
        if (!NACAO_BACKGROUNDS[id]) {
            console.warn(`[V2.26] Sem chave "${id}".`);
            return;
        }
        const modo = forceMode || (_isMobile() ? 'mobile' : 'desktop');
        const url = NACAO_BACKGROUNDS[id][modo];
        if (!url) {
            console.warn(`[V2.26] Chave "${id}" não tem URL para "${modo}".`);
            return;
        }
        _aplicarFundo(url);
        console.log(`[V2.26] Fundo aplicado: ${id} (${modo})`);
    };

    window._limparFundoNacao = function() {
        _aplicarFundo(null);
        console.log('[V2.26] Fundo limpo');
    };

    window._simularMobile = function() {
        // Útil pra testar sem redimensionar o navegador
        _aplicarFundo(null);
        _ultimaChave = null;
        _ultimaURL = null;
        _atualizarFundo(true);
    };

    // Inicia
    _instalarObserver();
    setTimeout(_instalarObserver, 1000);
    setTimeout(_instalarObserver, 3000);

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V2.26] Fundos temáticos das Sete Nações');
    console.log('   (wide + mobile)');
    console.log('═══════════════════════════════════════════════════');
    console.log(`• Breakpoint mobile: ${BREAKPOINT_MOBILE}px`);
    console.log('• Cole URLs no topo do V2.26 (desktop + mobile)');
    console.log('• Troca automática em resize/orientationchange');
    console.log('• Overlay mais escuro no mobile (legibilidade)');
    console.log('');
    console.log('💡 Debug:  window._debugFundosV226()');
    console.log('💡 Testar: window._testFundoNacao("tainos")');
    console.log('          window._testFundoNacao("tainos", "mobile")');
    console.log('💡 Limpar: window._limparFundoNacao()');
    console.log('═══════════════════════════════════════════════════');
})();