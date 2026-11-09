// =================================================================
// raid.js — V5.0 (REESCRITA ESTÁVEL)
// -----------------------------------------------------------------
// Filosofia:
//   • NÃO modifica entidades.js, historia.js, coop.js, pvp.js
//   • ESTENDE o motor do coop.js via hooks condicionais
//   • Reutiliza listeners, publicação e replay do coop
//   • Skills da raid são handlers isolados
//   • A IA do boss roda no P2 (igual ao coop)
//
// Carregar no index.html DEPOIS de coop.js e pvp.js:
//   <script src="entidades.js"></script>
//   <script src="historia.js"></script>
//   <script src="coop.js"></script>
//   <script src="pvp.js"></script>
//   <script src="raid.js"></script>
// =================================================================

// =================================================================
// 1. FLAG GLOBAL
// =================================================================
window._raidMode = false;

// =================================================================
// 2. SPRITES E EMOJIS (slots personalizáveis)
// =================================================================
const RAID_SPRITES = {
    'teju_jagua':'', 'mboi_tui':'', 'monai':'', 'jasy_jatere':'',
    'kurupi':'', 'ao_ao':'', 'luison':'', 'pesadelo':'',

    'escama_flamejante':'', 'pluma_arco_iris':'', 'asa_de_tempestade':'',
    'cabelo_solar':'', 'raiz_viva':'', 'la_negra':'',
    'sombra_solidificada':'', 'essencia_corrompida':'',

    'olho_de_cabeca':'', 'bico_petrificado':'', 'presa_do_vento':'',
    'coroa_do_sol':'', 'chifre_da_mata':'', 'presa_tripla':'',
    'cranio_menor':'', 'nucleo_do_pesadelo':'',

    'tacape_teju':'', 'flecha_teju':'', 'cajado_teju':'',
    'tacape_mboi':'', 'flecha_mboi':'', 'cajado_mboi':'',
    'tacape_monai':'', 'flecha_monai':'', 'cajado_monai':'',
    'tacape_jasy':'', 'flecha_jasy':'', 'cajado_jasy':'',
    'tacape_kurupi':'', 'flecha_kurupi':'', 'cajado_kurupi':'',
    'tacape_aoao':'', 'flecha_aoao':'', 'cajado_aoao':'',
    'tacape_luison':'', 'flecha_luison':'', 'cajado_luison':'',
    'tacape_pesadelo':'', 'flecha_pesadelo':'', 'cajado_pesadelo':'',
};

const RAID_EMOJIS = {
    'teju_jagua':'🐉', 'mboi_tui':'🐍', 'monai':'🐲', 'jasy_jatere':'☀️',
    'kurupi':'🌳', 'ao_ao':'🐑', 'luison':'💀', 'pesadelo':'👹',

    'escama_flamejante':'🔥', 'pluma_arco_iris':'🌈', 'asa_de_tempestade':'🌪️',
    'cabelo_solar':'✨', 'raiz_viva':'🌱', 'la_negra':'🧶',
    'sombra_solidificada':'🌑', 'essencia_corrompida':'🟣',

    'olho_de_cabeca':'👁️', 'bico_petrificado':'🦜', 'presa_do_vento':'🌬️',
    'coroa_do_sol':'👑', 'chifre_da_mata':'🦌', 'presa_tripla':'🦷',
    'cranio_menor':'☠️', 'nucleo_do_pesadelo':'💜',

    'tacape_teju':'🪓','flecha_teju':'🏹','cajado_teju':'🪄',
    'tacape_mboi':'🪓','flecha_mboi':'🏹','cajado_mboi':'🪄',
    'tacape_monai':'🪓','flecha_monai':'🏹','cajado_monai':'🪄',
    'tacape_jasy':'🪓','flecha_jasy':'🏹','cajado_jasy':'🪄',
    'tacape_kurupi':'🪓','flecha_kurupi':'🏹','cajado_kurupi':'🪄',
    'tacape_aoao':'🪓','flecha_aoao':'🏹','cajado_aoao':'🪄',
    'tacape_luison':'🪓','flecha_luison':'🏹','cajado_luison':'🪄',
    'tacape_pesadelo':'🪓','flecha_pesadelo':'🏹','cajado_pesadelo':'🪄',
};

function raidIcon(key, size) {
    const url = RAID_SPRITES[key];
    const emoji = RAID_EMOJIS[key] || '?';
    if (url && String(url).trim() !== '') {
        const cls = size === 'large' ? 'raid-icon raid-icon-large'
                  : size === 'small' ? 'raid-icon raid-icon-small' : 'raid-icon';
        return `<img src="${url}" class="${cls}" alt="${key}" onerror="this.outerHTML='${emoji}'">`;
    }
    const cls = size === 'large' ? 'raid-emoji raid-emoji-large'
              : size === 'small' ? 'raid-emoji raid-emoji-small' : 'raid-emoji';
    return `<span class="${cls}">${emoji}</span>`;
}
function raidEmoji(key) { return RAID_EMOJIS[key] || '?'; }

// =================================================================
// 3. SONS DAS SKILLS
// =================================================================
const RAID_SKILL_SOUNDS = {
    'raid_teju_sete_cabecas':'minoa1',
    'raid_teju_ima_almas':'garras',
    'raid_mboi_bico_arco_iris':'iara1',
    'raid_mboi_inundacao':'iara2',
    'raid_monai_voo_rasante':'minoa2',
    'raid_monai_sopro_tempestade':'saci1',
    'raid_jasy_salto_solar':'minoa2',
    'raid_jasy_clarao_cegante':'skill1',
    'raid_kurupi_raizes_estranguladoras':'minoa2',
    'raid_kurupi_chamado_mata':'cucask1',
    'raid_aoao_investida_diagonal':'minoa1',
    'raid_aoao_la_energizada':'atka',
    'raid_luison_colheita_sombria':'minoa1',
    'raid_luison_legado_filhos':'skill1',
    'raid_pesadelo_14_legados':'skill1',
    'raid_fissao_voraz':'minoa2',
    'raid_sussurro_anhanga':'skill1',
};

function raidTocarSom(handlerKey) {
    if (typeof playSfx !== 'function') return;
    const som = RAID_SKILL_SOUNDS[handlerKey] || 'skill1';
    try { playSfx(som); } catch (e) {}
}

// =================================================================
// 4. CONFIG DOS 8 RAID BOSSES
// =================================================================
const STORY_RAID_CONFIG = {
    'teju_jagua': {
        id:'teju_jagua', nome:'Teju Jagua', titulo:'O Lagarto de Sete Cabeças',
        elemento:'FOGO',
        descricao:'Uma besta colossal com sete cabeças de cachorro cuspindo fogo.',
        hp:100, atk:4, size:2,
        custoEntrada:800, recompensaOuro:1200, recompensaXP:500,
        desbloqueiaComAto:3,
        fragmentoComum:'escama_flamejante', fragmentoRaro:'olho_de_cabeca',
        armas:{tacape:'tacape_teju', flecha:'flecha_teju', cajado:'cajado_teju'},
        skills:[
            { id:'sete_cabecas', nome:'Sete Cabeças', handler:'raid_teju_sete_cabecas',
              danoBase:4, danoBonusElemento:0.5, elementoPerigo:'FOGO' },
            { id:'ima_almas', nome:'Ímã de Almas', handler:'raid_teju_ima_almas',
              dano:4, distanciaPuxao:2 },
        ],
    },
    'mboi_tui': {
        id:'mboi_tui', nome:"Mbói Tu'ĩ", titulo:'A Serpente Papagaio',
        elemento:'AGUA',
        descricao:'Uma serpente colossal com bico de arco-íris.',
        hp:110, atk:4, size:2,
        custoEntrada:1500, recompensaOuro:2250, recompensaXP:800,
        desbloqueiaComAto:5,
        fragmentoComum:'pluma_arco_iris', fragmentoRaro:'bico_petrificado',
        armas:{tacape:'tacape_mboi', flecha:'flecha_mboi', cajado:'cajado_mboi'},
        skills:[
            { id:'bico_arco_iris', nome:'Bico Arco-Íris', handler:'raid_mboi_bico_arco_iris',
              danoBase:4, danoBonusElemento:0.5, elementoPerigo:'AGUA' },
            { id:'inundacao', nome:'Inundação', handler:'raid_mboi_inundacao',
              danoAosAfetados:1 },
        ],
    },
    'monai': {
        id:'monai', nome:'Moñái', titulo:'A Serpente Alada',
        elemento:'AR',
        descricao:'Uma serpente com asas de morcego gigantes.',
        hp:120, atk:4, size:2,
        custoEntrada:2500, recompensaOuro:3750, recompensaXP:1200,
        desbloqueiaComAto:7,
        fragmentoComum:'asa_de_tempestade', fragmentoRaro:'presa_do_vento',
        armas:{tacape:'tacape_monai', flecha:'flecha_monai', cajado:'cajado_monai'},
        skills:[
            { id:'voo_rasante', nome:'Voo Rasante', handler:'raid_monai_voo_rasante',
              danoBase:4, danoBonusElemento:0.5, elementoPerigo:'AR' },
            { id:'sopro_tempestade', nome:'Sopro de Tempestade', handler:'raid_monai_sopro_tempestade',
              dano:2 },
        ],
    },
    'jasy_jatere': {
        id:'jasy_jatere', nome:'Jasy Jaterê', titulo:'O Duende do Sol',
        elemento:'FOGO',
        descricao:'Um duende colossal com cabelos de fogo.',
        hp:130, atk:4, size:2,
        custoEntrada:4000, recompensaOuro:6000, recompensaXP:1800,
        desbloqueiaComAto:9,
        fragmentoComum:'cabelo_solar', fragmentoRaro:'coroa_do_sol',
        armas:{tacape:'tacape_jasy', flecha:'flecha_jasy', cajado:'cajado_jasy'},
        skills:[
            { id:'salto_solar', nome:'Salto Solar', handler:'raid_jasy_salto_solar',
              danoBase:4, danoBonusElemento:0.5, elementoPerigo:'FOGO' },
            { id:'clarao_cegante', nome:'Clarão Cegante', handler:'raid_jasy_clarao_cegante',
              dano:4, danoDobradoElemento:'FOGO' },
        ],
    },
    'kurupi': {
        id:'kurupi', nome:'Kurupí', titulo:'O Guardião da Floresta',
        elemento:'TERRA',
        descricao:'Um duende colossal coberto de musgo.',
        hp:140, atk:4, size:2,
        custoEntrada:6000, recompensaOuro:9000, recompensaXP:2500,
        desbloqueiaComAto:11,
        fragmentoComum:'raiz_viva', fragmentoRaro:'chifre_da_mata',
        armas:{tacape:'tacape_kurupi', flecha:'flecha_kurupi', cajado:'cajado_kurupi'},
        skills:[
            { id:'raizes_estranguladoras', nome:'Raízes Estranguladoras', handler:'raid_kurupi_raizes_estranguladoras',
              numRaizes:8, danoPorTurnoPreso:1, danoBonusElemento:0.5, elementoPerigo:'TERRA' },
            { id:'chamado_mata', nome:'Chamado da Mata', handler:'raid_kurupi_chamado_mata',
              numAnimais:1, maxAnimais:2, animal:{hp:15, atk:2} },
        ],
    },
    'ao_ao': {
        id:'ao_ao', nome:'Ao Ao', titulo:'A Ovelha Canibal',
        elemento:'TERRA',
        descricao:'Uma ovelha colossal com presas de lobo.',
        hp:150, atk:5, size:2,
        custoEntrada:9000, recompensaOuro:13500, recompensaXP:3500,
        desbloqueiaComAto:13,
        fragmentoComum:'la_negra', fragmentoRaro:'presa_tripla',
        armas:{tacape:'tacape_aoao', flecha:'flecha_aoao', cajado:'cajado_aoao'},
        passiva:{ id:'fissao_voraz', hpParaDividir:0.5 },
        skills:[
            { id:'investida_diagonal', nome:'Investida Diagonal', handler:'raid_aoao_investida_diagonal',
              danoBase:5, danoBonusElemento:0.5, elementoPerigo:'TERRA', distanciaMovimento:2 },
            { id:'la_energizada', nome:'Lã Energizada', handler:'raid_aoao_la_energizada',
              danoBase:5, danoBonusElemento:0.5, elementoPerigo:'TERRA', numProjeteis:4, distanciaProjetil:2 },
        ],
    },
    'luison': {
        id:'luison', nome:'Luison', titulo:'O Senhor da Morte',
        elemento:'AR',
        descricao:'Uma criatura sombria coroada de crânios.',
        hp:170, atk:5, size:2,
        custoEntrada:13000, recompensaOuro:19500, recompensaXP:5000,
        desbloqueiaComAto:13, requerDificuldade:'dificil',
        fragmentoComum:'sombra_solidificada', fragmentoRaro:'cranio_menor',
        armas:{tacape:'tacape_luison', flecha:'flecha_luison', cajado:'cajado_luison'},
        skills:[
            { id:'colheita_sombria', nome:'Colheita Sombria', handler:'raid_luison_colheita_sombria',
              danoBase:5, danoBonusElemento:0.5, elementoPerigo:'AR', numPares:3, larguraPar:2, espacamento:2 },
            { id:'legado_filhos', nome:'Legado dos Filhos', handler:'raid_luison_legado_filhos',
              skillsDisponiveis:['sete_cabecas','ima_almas','bico_arco_iris','inundacao',
                                 'voo_rasante','sopro_tempestade','salto_solar','clarao_cegante',
                                 'raizes_estranguladoras','chamado_mata','investida_diagonal','la_energizada'] },
        ],
    },
    'pesadelo': {
        id:'pesadelo', nome:'Pesadelo da Terra', titulo:'A Manifestação da Destruição',
        elemento:'VARIÁVEL',
        descricao:'Um amálgama colossal de troncos carbonizados, correntes, ossos e fumaça.',
        hp:220, atk:6, size:2,
        custoEntrada:20000, recompensaOuro:30000, recompensaXP:8000,
        desbloqueiaComAto:13, requerDificuldade:'pesadelo',
        fragmentoComum:'essencia_corrompida', fragmentoRaro:'nucleo_do_pesadelo',
        armas:{tacape:'tacape_pesadelo', flecha:'flecha_pesadelo', cajado:'cajado_pesadelo'},
        passiva:{ id:'sussurro_anhanga', frequenciaTurnos:3 },
        skills:[
            { skillOrigem:'teju_jagua',  skillId:'sete_cabecas',           peso:1 },
            { skillOrigem:'teju_jagua',  skillId:'ima_almas',              peso:1 },
            { skillOrigem:'mboi_tui',    skillId:'bico_arco_iris',         peso:1 },
            { skillOrigem:'mboi_tui',    skillId:'inundacao',              peso:1 },
            { skillOrigem:'monai',       skillId:'voo_rasante',            peso:1 },
            { skillOrigem:'monai',       skillId:'sopro_tempestade',       peso:1 },
            { skillOrigem:'jasy_jatere', skillId:'salto_solar',            peso:1 },
            { skillOrigem:'jasy_jatere', skillId:'clarao_cegante',         peso:1 },
            { skillOrigem:'kurupi',      skillId:'raizes_estranguladoras', peso:1 },
            { skillOrigem:'kurupi',      skillId:'chamado_mata',           peso:1 },
            { skillOrigem:'ao_ao',       skillId:'investida_diagonal',     peso:1 },
            { skillOrigem:'ao_ao',       skillId:'la_energizada',          peso:1 },
            { skillOrigem:'luison',      skillId:'colheita_sombria',       peso:1 },
            { skillOrigem:'luison',      skillId:'legado_filhos',          peso:1 },
        ],
    },
};

// =================================================================
// 5. MATERIAIS E ARMAS DA RAID
// =================================================================
const RAID_MATERIAIS = {
    'escama_flamejante':{id:'escama_flamejante',nome:'Escama Flamejante',tipo:'comum',raid:'teju_jagua'},
    'pluma_arco_iris':{id:'pluma_arco_iris',nome:'Pluma Arco-Íris',tipo:'comum',raid:'mboi_tui'},
    'asa_de_tempestade':{id:'asa_de_tempestade',nome:'Asa de Tempestade',tipo:'comum',raid:'monai'},
    'cabelo_solar':{id:'cabelo_solar',nome:'Cabelo Solar',tipo:'comum',raid:'jasy_jatere'},
    'raiz_viva':{id:'raiz_viva',nome:'Raiz Viva',tipo:'comum',raid:'kurupi'},
    'la_negra':{id:'la_negra',nome:'Lã Negra',tipo:'comum',raid:'ao_ao'},
    'sombra_solidificada':{id:'sombra_solidificada',nome:'Sombra Solidificada',tipo:'comum',raid:'luison'},
    'essencia_corrompida':{id:'essencia_corrompida',nome:'Essência Corrompida',tipo:'comum',raid:'pesadelo'},
    'olho_de_cabeca':{id:'olho_de_cabeca',nome:'Olho de Cabeça',tipo:'raro',raid:'teju_jagua'},
    'bico_petrificado':{id:'bico_petrificado',nome:'Bico Petrificado',tipo:'raro',raid:'mboi_tui'},
    'presa_do_vento':{id:'presa_do_vento',nome:'Presa do Vento',tipo:'raro',raid:'monai'},
    'coroa_do_sol':{id:'coroa_do_sol',nome:'Coroa do Sol',tipo:'raro',raid:'jasy_jatere'},
    'chifre_da_mata':{id:'chifre_da_mata',nome:'Chifre da Mata',tipo:'raro',raid:'kurupi'},
    'presa_tripla':{id:'presa_tripla',nome:'Presa Tripla',tipo:'raro',raid:'ao_ao'},
    'cranio_menor':{id:'cranio_menor',nome:'Crânio Menor',tipo:'raro',raid:'luison'},
    'nucleo_do_pesadelo':{id:'nucleo_do_pesadelo',nome:'Núcleo do Pesadelo',tipo:'raro',raid:'pesadelo'},
};

const RAID_ARMAS = {
    'tacape_teju':{id:'tacape_teju',nome:'Tacape do Teju',tipo:'tacape',raid:'teju_jagua',atkBonus:4,elemento:'FOGO',elementoBonus:3,custoOuro:3000,receita:{escama_flamejante:3,olho_de_cabeca:1}},
    'flecha_teju':{id:'flecha_teju',nome:'Flecha do Teju',tipo:'flecha',raid:'teju_jagua',atkBonus:4,elemento:'FOGO',elementoBonus:3,custoOuro:3000,receita:{escama_flamejante:3,olho_de_cabeca:1}},
    'cajado_teju':{id:'cajado_teju',nome:'Cajado do Teju',tipo:'cajado',raid:'teju_jagua',atkBonus:4,elemento:'FOGO',elementoBonus:3,custoOuro:3000,receita:{escama_flamejante:3,olho_de_cabeca:1}},
    'tacape_mboi':{id:'tacape_mboi',nome:'Tacape do Bico',tipo:'tacape',raid:'mboi_tui',atkBonus:4,elemento:'AGUA',elementoBonus:3,custoOuro:4000,receita:{pluma_arco_iris:3,bico_petrificado:1}},
    'flecha_mboi':{id:'flecha_mboi',nome:'Flecha do Bico',tipo:'flecha',raid:'mboi_tui',atkBonus:4,elemento:'AGUA',elementoBonus:3,custoOuro:4000,receita:{pluma_arco_iris:3,bico_petrificado:1}},
    'cajado_mboi':{id:'cajado_mboi',nome:'Cajado do Bico',tipo:'cajado',raid:'mboi_tui',atkBonus:4,elemento:'AGUA',elementoBonus:3,custoOuro:4000,receita:{pluma_arco_iris:3,bico_petrificado:1}},
    'tacape_monai':{id:'tacape_monai',nome:'Tacape Alado',tipo:'tacape',raid:'monai',atkBonus:4,elemento:'AR',elementoBonus:3,custoOuro:5000,receita:{asa_de_tempestade:3,presa_do_vento:1}},
    'flecha_monai':{id:'flecha_monai',nome:'Flecha Alada',tipo:'flecha',raid:'monai',atkBonus:4,elemento:'AR',elementoBonus:3,custoOuro:5000,receita:{asa_de_tempestade:3,presa_do_vento:1}},
    'cajado_monai':{id:'cajado_monai',nome:'Cajado Alado',tipo:'cajado',raid:'monai',atkBonus:4,elemento:'AR',elementoBonus:3,custoOuro:5000,receita:{asa_de_tempestade:3,presa_do_vento:1}},
    'tacape_jasy':{id:'tacape_jasy',nome:'Tacape Solar',tipo:'tacape',raid:'jasy_jatere',atkBonus:4,elemento:'FOGO',elementoBonus:3,custoOuro:6000,receita:{cabelo_solar:3,coroa_do_sol:1}},
    'flecha_jasy':{id:'flecha_jasy',nome:'Flecha Solar',tipo:'flecha',raid:'jasy_jatere',atkBonus:4,elemento:'FOGO',elementoBonus:3,custoOuro:6000,receita:{cabelo_solar:3,coroa_do_sol:1}},
    'cajado_jasy':{id:'cajado_jasy',nome:'Cajado Solar',tipo:'cajado',raid:'jasy_jatere',atkBonus:4,elemento:'FOGO',elementoBonus:3,custoOuro:6000,receita:{cabelo_solar:3,coroa_do_sol:1}},
    'tacape_kurupi':{id:'tacape_kurupi',nome:'Tacape Vivo',tipo:'tacape',raid:'kurupi',atkBonus:4,elemento:'TERRA',elementoBonus:4,custoOuro:7500,receita:{raiz_viva:3,chifre_da_mata:1}},
    'flecha_kurupi':{id:'flecha_kurupi',nome:'Flecha Viva',tipo:'flecha',raid:'kurupi',atkBonus:4,elemento:'TERRA',elementoBonus:4,custoOuro:7500,receita:{raiz_viva:3,chifre_da_mata:1}},
    'cajado_kurupi':{id:'cajado_kurupi',nome:'Cajado Vivo',tipo:'cajado',raid:'kurupi',atkBonus:4,elemento:'TERRA',elementoBonus:4,custoOuro:7500,receita:{raiz_viva:3,chifre_da_mata:1}},
    'tacape_aoao':{id:'tacape_aoao',nome:'Tacape da Fome',tipo:'tacape',raid:'ao_ao',atkBonus:4,elemento:'TERRA',elementoBonus:4,custoOuro:9000,receita:{la_negra:3,presa_tripla:1}},
    'flecha_aoao':{id:'flecha_aoao',nome:'Flecha da Fome',tipo:'flecha',raid:'ao_ao',atkBonus:4,elemento:'TERRA',elementoBonus:4,custoOuro:9000,receita:{la_negra:3,presa_tripla:1}},
    'cajado_aoao':{id:'cajado_aoao',nome:'Cajado da Fome',tipo:'cajado',raid:'ao_ao',atkBonus:4,elemento:'TERRA',elementoBonus:4,custoOuro:9000,receita:{la_negra:3,presa_tripla:1}},
    'tacape_luison':{id:'tacape_luison',nome:'Tacape Sombrio',tipo:'tacape',raid:'luison',atkBonus:4,elemento:'AR',elementoBonus:5,custoOuro:12000,receita:{sombra_solidificada:3,cranio_menor:1}},
    'flecha_luison':{id:'flecha_luison',nome:'Flecha Sombria',tipo:'flecha',raid:'luison',atkBonus:4,elemento:'AR',elementoBonus:5,custoOuro:12000,receita:{sombra_solidificada:3,cranio_menor:1}},
    'cajado_luison':{id:'cajado_luison',nome:'Cajado Sombrio',tipo:'cajado',raid:'luison',atkBonus:4,elemento:'AR',elementoBonus:5,custoOuro:12000,receita:{sombra_solidificada:3,cranio_menor:1}},
    'tacape_pesadelo':{id:'tacape_pesadelo',nome:'Tacape do Pesadelo',tipo:'tacape',raid:'pesadelo',atkBonus:5,elemento:'ANY',elementoBonus:5,custoOuro:20000,receita:{essencia_corrompida:3,nucleo_do_pesadelo:1}},
    'flecha_pesadelo':{id:'flecha_pesadelo',nome:'Flecha do Pesadelo',tipo:'flecha',raid:'pesadelo',atkBonus:5,elemento:'ANY',elementoBonus:5,custoOuro:20000,receita:{essencia_corrompida:3,nucleo_do_pesadelo:1}},
    'cajado_pesadelo':{id:'cajado_pesadelo',nome:'Cajado do Pesadelo',tipo:'cajado',raid:'pesadelo',atkBonus:5,elemento:'ANY',elementoBonus:5,custoOuro:20000,receita:{essencia_corrompida:3,nucleo_do_pesadelo:1}},
};

// =================================================================
// 6. HELPERS DE CONFIG
// =================================================================
window.STORY_RAID_CONFIG = STORY_RAID_CONFIG;
window.RAID_SKILL_SOUNDS = RAID_SKILL_SOUNDS;
function raidGetConfig(raidId) { return STORY_RAID_CONFIG[raidId] || null; }
function raidListAll() {
    return ['teju_jagua','mboi_tui','monai','jasy_jatere','kurupi','ao_ao','luison','pesadelo']
        .map(id => STORY_RAID_CONFIG[id]).filter(Boolean);
}
function raidGetArma(id) { return RAID_ARMAS[id] || null; }
function raidGetMaterial(id) { return RAID_MATERIAIS[id] || null; }

function raidIsDesbloqueada(raidId) {
    const cfg = raidGetConfig(raidId);
    if (!cfg || typeof STORY_PROGRESS === 'undefined') return false;
    const atoAtual = Math.max(
        ...(STORY_PROGRESS.completedPhases || [])
            .map(pid => parseInt(String(pid).split('-')[0]))
            .filter(n => !isNaN(n)), 0);
    if (atoAtual < cfg.desbloqueiaComAto) return false;
    if (cfg.requerDificuldade) {
        if (!Array.isArray(STORY_PROGRESS.clearedDifficulties)) return false;
        if (!STORY_PROGRESS.clearedDifficulties.includes(cfg.requerDificuldade)) return false;
    }
    return true;
}

function raidMotivoBloqueio(raidId) {
    const cfg = raidGetConfig(raidId);
    if (!cfg) return 'Raid não encontrada.';
    if (typeof STORY_PROGRESS === 'undefined') return 'Sem save.';
    const atoAtual = Math.max(
        ...(STORY_PROGRESS.completedPhases || [])
            .map(pid => parseInt(String(pid).split('-')[0]))
            .filter(n => !isNaN(n)), 0);
    if (atoAtual < cfg.desbloqueiaComAto) return `Complete o Ato ${cfg.desbloqueiaComAto}.`;
    if (cfg.requerDificuldade &&
        !(STORY_PROGRESS.clearedDifficulties || []).includes(cfg.requerDificuldade)) {
        return `Zere o jogo no modo ${cfg.requerDificuldade}.`;
    }
    return null;
}

console.log('✅ raid.js V5.0 — Bloco 1/5 (dados) carregado.');
// =================================================================
// raid.js — V5.0 — Bloco 2/5
// Estado global + sistema 2×2 + snapshot do boss
// =================================================================

window.raidAtual = null;
window.raidBosses = [];
window.raidAnimais = [];
window.raidRaizes = [];
window.raidAoAoDividido = false;
window.raidPesadeloTurnos = 0;
window.raidBossRefGlobal = null;
window._raidFinalizando = false;
window._raidResolvingHeroAction = false;
window._raidPendingSkill = null;
window._raidBossSnapshot = null;

// -----------------------------------------------------------------
// Ocupação de tiles
// -----------------------------------------------------------------
function raidGetOccupiedTiles(b) {
    if (!b) return [];
    const sizeH = b.sizeH || b.size || 2;
    const sizeV = b.sizeV || b.size || 2;
    const out = [];
    for (let dx = 0; dx < sizeH; dx++)
        for (let dy = 0; dy < sizeV; dy++)
            out.push({ x: b.x + dx, y: b.y + dy });
    return out;
}

function raidIsTileOcupadoPorBoss(x, y) {
    for (const b of raidGetBosses()) {
        if (b.dead) continue;
        if (raidGetOccupiedTiles(b).some(t => t.x === x && t.y === y)) return true;
    }
    return false;
}

function raidIsTileOcupadoPorAnimal(x, y) {
    if (!window.raidAnimais) return false;
    return window.raidAnimais.some(a => !a.dead && a.x === x && a.y === y);
}

function raidGetBosses() {
    if (Array.isArray(window.raidBosses) && window.raidBosses.length > 0) {
        return window.raidBosses;
    }
    return [window.raidBossRefGlobal || (typeof boss !== 'undefined' ? boss : null)].filter(Boolean);
}

function raidGetBossPrimario() {
    const bs = raidGetBosses();
    return bs.find(b => !b.dead) || bs[0];
}

function raidGetBossCentro(b) {
    if (!b) return { x: 0, y: 0 };
    const sizeH = b.sizeH || b.size || 2;
    const sizeV = b.sizeV || b.size || 2;
    return {
        x: b.x + (sizeH - 1) / 2,
        y: b.y + (sizeV - 1) / 2,
    };
}

function raidBossPodeMoverPara(b, novoX, novoY) {
    if (!b) return false;
    const sizeH = b.sizeH || b.size || 2;
    const sizeV = b.sizeV || b.size || 2;
    if (novoX < 0 || novoX + sizeH > 8) return false;
    if (novoY < 0 || novoY + sizeV > 8) return false;

    for (const outro of raidGetBosses()) {
        if (outro === b || outro.dead) continue;
        const tilesOutro = raidGetOccupiedTiles(outro);
        for (let dx = 0; dx < sizeH; dx++)
            for (let dy = 0; dy < sizeV; dy++)
                if (tilesOutro.some(t => t.x === novoX + dx && t.y === novoY + dy)) return false;
    }

    for (let dx = 0; dx < sizeH; dx++)
        for (let dy = 0; dy < sizeV; dy++)
            if (raidIsTileOcupadoPorAnimal(novoX + dx, novoY + dy)) return false;

    if (Array.isArray(players)) {
        for (let dx = 0; dx < sizeH; dx++)
            for (let dy = 0; dy < sizeV; dy++)
                if (players.some(p => !p.dead && p.x === novoX + dx && p.y === novoY + dy)) return false;
    }

    return true;
}

// -----------------------------------------------------------------
// Snapshot do boss (restaurar ao sair do raid)
// -----------------------------------------------------------------
function raidSalvarSnapshotBoss() {
    if (typeof boss === 'undefined') return;
    if (window._raidBossSnapshot) return;
    window._raidBossSnapshot = {
        type: boss.type, hp: boss.hp, maxHp: boss.maxHp,
        x: boss.x, y: boss.y, dead: boss.dead,
    };
}

function raidRestaurarSnapshotBoss() {
    if (typeof boss === 'undefined') return;
    if (!window._raidBossSnapshot) return;
    Object.assign(boss, window._raidBossSnapshot);
    delete boss.size; delete boss.sizeH; delete boss.sizeV;
    delete boss.isBoss; delete boss.raidId; delete boss.nome;
    window._raidBossSnapshot = null;
}

// -----------------------------------------------------------------
// Configurar boss global como 2×2
// -----------------------------------------------------------------
function raidConfigurarBossGlobal(cfg) {
    if (typeof boss === 'undefined') return;
    raidSalvarSnapshotBoss();
    window.raidBossRefGlobal = boss;

    boss.type = cfg.id.toUpperCase();
    boss.hp = cfg.hp;
    boss.maxHp = cfg.hp;
    boss.x = 3;
    boss.y = 0;
    boss.dead = false;
    boss.size = 2;
    boss.sizeH = 2;
    boss.sizeV = 2;
    boss.isBoss = true;
    boss.raidId = cfg.id;
    boss.nome = cfg.nome;

    window.raidBosses = [boss];

    if (typeof SPRITES !== 'undefined' && !SPRITES[boss.type]) {
        SPRITES[boss.type] = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
}

// -----------------------------------------------------------------
// Renderização dos tokens
// -----------------------------------------------------------------
function raidRenderBosses() {
    const board = document.getElementById('board');
    if (!board) return;

    board.querySelectorAll('.token.raid-boss-token').forEach(t => t.remove());

    const bs = raidGetBosses();
    const s = (typeof getStep === 'function') ? getStep() : 59;
    const gap = s > 50 ? 4 : 2;

    bs.forEach((b, i) => {
        if (b.dead) return;
        const sizeH = b.sizeH || b.size || 2;
        const sizeV = b.sizeV || b.size || 2;

        const tok = document.createElement('div');
        tok.className = 'token raid-boss-token';
        tok.id = `raidBossToken_${i}`;
        tok.style.left = (b.x * s + 8) + 'px';
        tok.style.top = (b.y * s + 8) + 'px';
        tok.style.width = (sizeH * s + (sizeH - 1) * gap) + 'px';
        tok.style.height = (sizeV * s + (sizeV - 1) * gap) + 'px';

        const hpPct = Math.max(0, (b.hp / b.maxHp) * 100);
        const key = (b.type || 'teju_jagua').toLowerCase();

        tok.innerHTML = `
            <div class="hp-container" style="width:80%;">
                <div class="hp-bar" style="width:${hpPct}%;"></div>
            </div>
            <div class="raid-boss-sprite">${raidIcon(key, 'large')}</div>
        `;

        board.appendChild(tok);
    });
}

function raidAtualizarTokenBoss() {
    const bs = raidGetBosses();
    const s = (typeof getStep === 'function') ? getStep() : 59;
    const gap = s > 50 ? 4 : 2;

    bs.forEach((b, i) => {
        const tok = document.getElementById(`raidBossToken_${i}`);
        if (b.dead) { if (tok) tok.style.display = 'none'; return; }
        if (!tok) { raidRenderBosses(); return; }

        const sizeH = b.sizeH || b.size || 2;
        const sizeV = b.sizeV || b.size || 2;
        tok.style.display = '';
        tok.style.left = (b.x * s + 8) + 'px';
        tok.style.top = (b.y * s + 8) + 'px';
        tok.style.width = (sizeH * s + (sizeH - 1) * gap) + 'px';
        tok.style.height = (sizeV * s + (sizeV - 1) * gap) + 'px';

        const hpBar = tok.querySelector('.hp-bar');
        if (hpBar) hpBar.style.width = Math.max(0, (b.hp / b.maxHp) * 100) + '%';
    });
}

function raidRenderAnimais() {
    const board = document.getElementById('board');
    if (!board) return;
    board.querySelectorAll('.token.raid-animal').forEach(t => t.remove());
    if (!window.raidAnimais || window.raidAnimais.length === 0) return;

    const s = (typeof getStep === 'function') ? getStep() : 59;
    window.raidAnimais.forEach((a, i) => {
        if (a.dead) return;
        const tok = document.createElement('div');
        tok.className = 'token raid-animal';
        tok.id = `raidAnimalToken_${i}`;
        tok.style.left = (a.x * s + 8) + 'px';
        tok.style.top = (a.y * s + 8) + 'px';
        tok.style.width = s + 'px';
        tok.style.height = s + 'px';
        const hpPct = Math.max(0, (a.hp / a.maxHp) * 100);
        const emojiFallback = a.emoji || raidEmoji('kurupi');
        const spriteHTML = a.sprite
            ? `<img src="${a.sprite}" class="raid-animal-sprite" alt="${a.nome || 'Invocação'}"
                    style="width:100%;height:100%;object-fit:contain;"
                    onerror="this.outerHTML='&lt;span class=&quot;raid-animal-emoji&quot;&gt;${emojiFallback}&lt;/span&gt;'">`
            : `<span class="raid-animal-emoji">${emojiFallback}</span>`;
        tok.innerHTML = `
            <div class="hp-container" style="width:80%;"><div class="hp-bar" style="width:${hpPct}%;"></div></div>
            ${spriteHTML}
        `;
        board.appendChild(tok);
    });
}

function raidRenderRaizes() {
    const board = document.getElementById('board');
    if (!board) return;
    board.querySelectorAll('.token.raid-raiz').forEach(t => t.remove());
    if (!window.raidRaizes || window.raidRaizes.length === 0) return;

    const s = (typeof getStep === 'function') ? getStep() : 59;
    // Antes o emoji era fixo no código e ignorava o catálogo de assets.
    const raizAsset = (window.A_RAID_ASSETS?.skills?.pombero_raizes) || {};
    const raizEmoji = raizAsset.emoji || '🌿';
    const raizHTML = raizAsset.sprite
        ? `<img src="${raizAsset.sprite}" class="raid-raiz-sprite" alt="Raízes"
                style="width:100%;height:100%;object-fit:contain;"
                onerror="this.outerHTML='&lt;span class=&quot;raid-raiz-emoji&quot;&gt;${raizEmoji}&lt;/span&gt;'">`
        : `<span class="raid-raiz-emoji">${raizEmoji}</span>`;
    window.raidRaizes.forEach((r, i) => {
        const tok = document.createElement('div');
        tok.className = 'token raid-raiz';
        tok.id = `raidRaizToken_${i}`;
        tok.style.left = (r.x * s + 8) + 'px';
        tok.style.top = (r.y * s + 8) + 'px';
        tok.style.width = s + 'px';
        tok.style.height = s + 'px';
        tok.innerHTML = raizHTML;
        board.appendChild(tok);
    });
}

// -----------------------------------------------------------------
// Limpeza de estado
// -----------------------------------------------------------------
function raidLimparEstado() {
    if (window._raidRegionalConfigSnapshot) {
        Object.assign(
            window._raidRegionalConfigSnapshot.config,
            window._raidRegionalConfigSnapshot.values
        );
        window._raidRegionalConfigSnapshot = null;
    }
    if (window._raidRegionalRuntimeSnapshot) {
        if (typeof playerCount !== 'undefined') {
            playerCount = window._raidRegionalRuntimeSnapshot.playerCount;
        }
        window._raidRegionalRuntimeSnapshot = null;
    }

    window._raidMode = false;
    window.raidAtual = null;
    window.raidBosses = [];
    window.raidAnimais = [];
    window.raidRaizes = [];
    window.raidAoAoDividido = false;
    window.raidPesadeloTurnos = 0;
    window.raidBossRefGlobal = null;
    window._raidFinalizando = false;
    window._raidResolvingHeroAction = false;
    if (window._raidPendingSkill) raidClearSkillWarning(window._raidPendingSkill.tiles);
    window._raidPendingSkill = null;

    raidRestaurarSnapshotBoss();

    const board = document.getElementById('board');
    if (board) {
        board.querySelectorAll('.token.raid-boss-token, .token.raid-animal, .token.raid-raiz').forEach(t => t.remove());
        const tokOriginal = document.getElementById('tokenBoss');
        if (tokOriginal) tokOriginal.style.display = '';
    }

    const bossSection = document.getElementById('bossSectionWrapper');
    if (bossSection) bossSection.style.display = '';
    const bossSprite = document.getElementById('bossCardSprite');
    if (bossSprite) bossSprite.style.display = '';
    const bossTitle = document.querySelector('#bossSectionWrapper .status-section-title');
    if (bossTitle) bossTitle.textContent = 'Boss';
}

console.log('✅ raid.js V5.0 — Bloco 2/5 (2×2 + estado) carregado.');
// =================================================================
// raid.js — V5.0 — Bloco 3/5
// Handlers das skills + IA do boss (raidTurnoBoss)
// =================================================================

const RAID_SKILLS = {};

function raidSleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// -----------------------------------------------------------------
// Helpers de dano
// -----------------------------------------------------------------
function raidApplyDmgHero(hero, danoBase, skillCfg) {
    if (!hero || hero.dead) return;
    let danoFinal = danoBase;
    if (skillCfg && skillCfg.danoBonusElemento && skillCfg.elementoPerigo) {
        if (grid[hero.y * 8 + hero.x] === skillCfg.elementoPerigo) {
            danoFinal = Math.ceil(danoBase * (1 + skillCfg.danoBonusElemento));
        }
    }
    if (skillCfg && skillCfg.danoDobradoElemento) {
        if (grid[hero.y * 8 + hero.x] === skillCfg.danoDobradoElemento) {
            danoFinal = danoBase * 2;
        }
    }
    if (typeof applyDmg === 'function') applyDmg(hero, danoFinal);
}

function raidApplyDmgEmTiles(tiles, danoBase, skillCfg) {
    if (!tiles || tiles.length === 0) return;
    const set = new Set(tiles.map(t => `${t.x},${t.y}`));
    players.forEach(p => {
        if (p.dead) return;
        if (set.has(`${p.x},${p.y}`)) raidApplyDmgHero(p, danoBase, skillCfg);
    });
}

function raidGetTilesAround(cx, cy, radiusX, radiusY) {
    const tiles = [];
    for (let y = Math.max(0, cy - radiusY); y <= Math.min(7, cy + radiusY); y++) {
        for (let x = Math.max(0, cx - radiusX); x <= Math.min(7, cx + radiusX); x++) {
            tiles.push({ x, y });
        }
    }
    return tiles;
}

function raidGetBossAttackTiles(boss, shape) {
    if (!boss) return [];
    const footprint = raidGetOccupiedTiles(boss);
    const rows = new Set(footprint.map(tile => tile.y));
    const columns = new Set(footprint.map(tile => tile.x));
    const tiles = [];

    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const inRows = rows.has(y);
            const inColumns = columns.has(x);
            const onDiagonals = y - x === boss.y - boss.x
                || y + x === boss.y + boss.x + 1;
            if ((shape === 'rows' && inRows)
                || (shape === 'columns' && inColumns)
                || (shape === 'cross' && (inRows || inColumns))
                || (shape === 'diagonals' && onDiagonals)) {
                tiles.push({ x, y });
            }
        }
    }
    return tiles;
}

function raidClearSkillWarning(tiles) {
    const tileElements = document.querySelectorAll('#grid .tile');
    (tiles || []).forEach(tile => {
        const element = tileElements[tile.y * 8 + tile.x];
        if (element) {
            element.classList.remove('raid-danger-telegraph');
            element.removeAttribute('aria-label');
        }
    });
}

function raidCapturarEstadoCoop() {
    const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
    return {
        bosses: clone(raidGetBosses()),
        animals: clone(window.raidAnimais || []),
        roots: clone(window.raidRaizes || []),
        aoAoDividido: window.raidAoAoDividido === true,
        pesadeloTurnos: window.raidPesadeloTurnos || 0,
        pendingSkill: clone(window._raidPendingSkill),
    };
}

function raidAplicarEstadoCoop(state) {
    if (!state) return;

    raidClearSkillWarning(window._raidPendingSkill?.tiles || []);
    const primaryBoss = window.raidBossRefGlobal
        || (typeof boss !== 'undefined' ? boss : null);
    if (Array.isArray(state.bosses)) {
        window.raidBosses = state.bosses.map((snapshot, index) => {
            if (index === 0 && !snapshot.isFissaoMetade && primaryBoss) {
                Object.assign(primaryBoss, snapshot);
                return primaryBoss;
            }
            return { ...snapshot };
        });
    }
    window.raidAnimais = Array.isArray(state.animals) ? state.animals.map(animal => ({ ...animal })) : [];
    window.raidRaizes = Array.isArray(state.roots) ? state.roots.map(root => ({ ...root })) : [];
    window.raidAoAoDividido = state.aoAoDividido === true;
    window.raidPesadeloTurnos = Number(state.pesadeloTurnos) || 0;
    window._raidPendingSkill = state.pendingSkill
        ? JSON.parse(JSON.stringify(state.pendingSkill))
        : null;

    if (window._raidPendingSkill?.tiles) {
        const tileElements = document.querySelectorAll('#grid .tile');
        window._raidPendingSkill.tiles.forEach(tile => {
            const element = tileElements[tile.y * 8 + tile.x];
            if (!element) return;
            element.classList.add('raid-danger-telegraph');
            element.setAttribute(
                'aria-label',
                `Área ameaçada por ${window._raidPendingSkill.skill?.nome || 'habilidade do chefe'}`
            );
        });
    }

    raidRenderBosses();
    raidRenderAnimais();
    raidRenderRaizes();
}

function raidApplySkillImpact(tiles, options) {
    const gridElement = document.getElementById('grid');
    if (gridElement) {
        gridElement.classList.remove('raid-skill-impact');
        void gridElement.offsetWidth;
        gridElement.classList.add('raid-skill-impact');
        setTimeout(() => gridElement.classList.remove('raid-skill-impact'), 500);
    }

    const scale = options?.impactScale || 1.25;
    (tiles || []).forEach((tile, index) => {
        setTimeout(() => {
            if (typeof spawnFxAt === 'function') {
                spawnFxAt(options?.impactEffect || 'impact', options?.impactClass || 'fx-impact', tile.x, tile.y, {
                    duration: 750, scale,
                });
                if (index % 2 === 0) {
                    spawnFxAt('shockwave', 'fx-shockwave', tile.x, tile.y, {
                        duration: 850, scale: scale * 0.9,
                    });
                }
            }
        }, Math.min(index * 28, 280));
    });
}

async function raidTelegraphSkill(skill, tiles, options) {
    options = options || {};
    if (skill?._raidResolve) {
        const pending = window._raidPendingSkill;
        const markedTiles = pending?.tiles || skill._raidTiles || tiles;
        raidClearSkillWarning(markedTiles);
        window._raidPendingSkill = null;
        raidApplySkillImpact(markedTiles, options);
        return markedTiles;
    }

    const uniqueTiles = [...new Map((tiles || [])
        .filter(tile => Number.isInteger(tile.x) && Number.isInteger(tile.y)
            && tile.x >= 0 && tile.x < 8 && tile.y >= 0 && tile.y < 8)
        .map(tile => [`${tile.x},${tile.y}`, { x: tile.x, y: tile.y }])).values()];
    if (uniqueTiles.length === 0) return null;
    if (skill._raidTelegraph === false) {
        raidApplySkillImpact(uniqueTiles, options);
        return uniqueTiles;
    }

    const handler = raidEncontrarHandler(skill.id);
    if (!handler || !RAID_SKILLS[handler]) {
        console.warn('[raid] Não foi possível preparar a habilidade:', skill.id);
        return null;
    }

    window._raidPendingSkill = {
        handler,
        enemy: {
            id: window.raidAtual,
            type: window.raidAtual,
            atk: raidGetConfig(window.raidAtual)?.atk || skill.danoBase || 1,
        },
        skill: { ...skill, _raidPayload: options.payload || null },
        tiles: uniqueTiles,
    };
    const tileElements = document.querySelectorAll('#grid .tile');
    uniqueTiles.forEach(tile => {
        const element = tileElements[tile.y * 8 + tile.x];
        if (element) {
            element.classList.add('raid-danger-telegraph');
            element.setAttribute('aria-label', `Área ameaçada por ${skill.nome || 'habilidade do chefe'}`);
        }
    });
    if (typeof addLog === 'function') {
        addLog(`⚠️ ${skill.nome || 'O chefe prepara um ataque'}! A área marcada é perigosa — mova-se antes da próxima ação do chefe.`);
    }
    return null;
}

async function raidTransformarTiles(de, para, opts) {
    opts = opts || {};
    const stagger = opts.stagger || 30;
    const indices = [];
    const requestedTiles = Array.isArray(opts.tiles) ? new Set(opts.tiles.map(t => t.y * 8 + t.x)) : null;
    for (let i = 0; i < 64; i++) {
        if (grid[i] === de && (!requestedTiles || requestedTiles.has(i))) indices.push(i);
    }

    indices.forEach((idx, i) => {
        setTimeout(() => {
            if (typeof spawnTileFlip === 'function') spawnTileFlip(idx % 8, Math.floor(idx / 8));
            grid[idx] = para;
            const tile = document.querySelectorAll('#grid .tile')[idx];
            if (tile) tile.className = `tile bg-${para}`;
        }, i * stagger);
    });

    await raidSleep(stagger * indices.length + 400);
}

function raidEmbaralharTiles(tiles) {
    const pool = ['FOGO', 'AGUA', 'TERRA', 'AR'];
    const tileElements = document.querySelectorAll('#grid .tile');
    (tiles || []).forEach(({ x, y }) => {
        const idx = y * 8 + x;
        const novoEl = pool[Math.floor(Math.random() * pool.length)];
        grid[idx] = novoEl;
        const tile = tileElements[idx];
        if (tile) {
            tile.className = `tile bg-${novoEl}`;
            if (typeof spawnTileFlip === 'function') spawnTileFlip(x, y);
        }
    });
}

function raidAplicarDanoNoBoss(metade, amt) {
    if (!metade || metade.dead) return;
    metade.hp -= amt;
    if (typeof showDmgEffect === 'function') showDmgEffect(metade.x, metade.y, amt);

    if (metade.hp <= 0) {
        metade.hp = 0;
        metade.dead = true;

        if (window.raidAoAoDividido && metade.isFissaoMetade) {
            const sobrevivente = window.raidBosses.find(b => !b.dead && b !== metade);
            if (sobrevivente) {
                sobrevivente.hp = Math.min(sobrevivente.maxHp, sobrevivente.hp + 1);
                if (typeof raidAoAoReFusao === 'function') raidAoAoReFusao(sobrevivente);
            } else {
                if (!window._raidResolvingHeroAction && typeof raidHandleBossDefeat === 'function') {
                    raidHandleBossDefeat();
                }
            }
        } else {
            if (!window._raidResolvingHeroAction && typeof raidHandleBossDefeat === 'function') {
                raidHandleBossDefeat();
            }
        }
    }
    raidAtualizarTokenBoss();
    if (typeof updateVisuals === 'function') updateVisuals();
    if (typeof raidAtualizarBossCard === 'function') raidAtualizarBossCard();
}

// =================================================================
// HANDLERS — RAID 1 (TEJU JAGUA)
// =================================================================
RAID_SKILLS['raid_teju_sete_cabecas'] = async function(enemy, skill) {
    raidTocarSom('raid_teju_sete_cabecas');
    if (typeof addLog === 'function') addLog(`${raidEmoji('teju_jagua')} ${skill.nome}!`);

    const b = raidGetBossPrimario();
    const c = raidGetBossCentro(b);
    const cx = Math.floor(c.x), cy = Math.floor(c.y);

    const tiles = [];
    [cx, cx + 1].forEach(col => {
        if (col >= 0 && col < 8) {
            for (let y = 0; y < 8; y++) tiles.push({ x: col, y });
        }
    });
    [cy, cy + 1].forEach(row => {
        if (row >= 0 && row < 8) {
            for (let x = 0; x < 8; x++) tiles.push({ x, y: row });
        }
    });
    const marcados = await raidTelegraphSkill(skill, tiles, {
        impactScale: 1.55, impactEffect: 'flame_short', impactClass: 'fx-flame-short',
    });
    if (!marcados) return;
    raidApplyDmgEmTiles(marcados, skill.danoBase || 2, skill);
    await raidTransformarTiles('TERRA', 'FOGO', { stagger: 45, tiles: marcados });
};

RAID_SKILLS['raid_teju_ima_almas'] = async function(enemy, skill) {
    raidTocarSom('raid_teju_ima_almas');
    if (typeof addLog === 'function') addLog(`${raidEmoji('teju_jagua')} ${skill.nome}!`);

    const b = raidGetBossPrimario();
    const c = raidGetBossCentro(b);
    const cx = Math.floor(c.x), cy = Math.floor(c.y);

    const tiles = raidGetTilesAround(cx, cy, 2, 2);
    const marcados = await raidTelegraphSkill(skill, tiles, { impactScale: 1.7 });
    if (!marcados) return;
    raidApplyDmgEmTiles(marcados, skill.danoBase || 2, skill);

    const dist = skill.distanciaPuxao || 2;
    players.forEach(p => {
        if (p.dead) return;
        if (!marcados.some(tile => tile.x === p.x && tile.y === p.y)) return;
        const dirX = Math.sign(cx - p.x) || 0;
        const dirY = Math.sign(cy - p.y) || 0;
        for (let i = 0; i < dist; i++) {
            const nx = p.x + dirX, ny = p.y + dirY;
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
            if (raidIsTileOcupadoPorBoss(nx, ny)
                || (typeof isOccupied === 'function' && isOccupied(nx, ny, p.id))) break;
            p.x = nx; p.y = ny;
            if (p.x === cx && p.y === cy) break;
        }
    });

    if (typeof updateVisuals === 'function') updateVisuals();
    if (typeof updateAllSpriteDirections === 'function') updateAllSpriteDirections();
};

// =================================================================
// HANDLERS — RAID 2 (MBÓI TU'Ĩ)
// =================================================================
RAID_SKILLS['raid_mboi_bico_arco_iris'] = async function(enemy, skill) {
    raidTocarSom('raid_mboi_bico_arco_iris');
    if (typeof addLog === 'function') addLog(`${raidEmoji('mboi_tui')} ${skill.nome}!`);

    const b = raidGetBossPrimario();
    const c = raidGetBossCentro(b);
    const cx = Math.floor(c.x), cy = Math.floor(c.y);

    const target = players.find(player => !player.dead);
    if (!target) return;
    const tiles = raidGetTilesAround(target.x, target.y, 1, 1);
    const marcados = await raidTelegraphSkill(skill, tiles, {
        impactScale: 1.5, impactEffect: 'splash_wave', impactClass: 'fx-splash-wave',
    });
    if (!marcados) return;
    raidApplyDmgEmTiles(marcados, skill.danoBase || enemy.atk, skill);

    const dirs = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
    players.forEach(p => {
        if (p.dead) return;
        if (!marcados.some(t => t.x === p.x && t.y === p.y)) return;
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        for (let i = 0; i < 2; i++) {
            const nx = p.x + dir.dx, ny = p.y + dir.dy;
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
            if (raidIsTileOcupadoPorBoss(nx, ny)
                || (typeof isOccupied === 'function' && isOccupied(nx, ny, p.id))) break;
            p.x = nx; p.y = ny;
        }
    });
    if (typeof updateVisuals === 'function') updateVisuals();
};

RAID_SKILLS['raid_mboi_inundacao'] = async function(enemy, skill) {
    raidTocarSom('raid_mboi_inundacao');
    if (typeof addLog === 'function') addLog(`${raidEmoji('mboi_tui')} ${skill.nome}!`);

    const b = raidGetBossPrimario();
    const tiles = raidGetBossAttackTiles(b, skill.raidShape || 'columns');
    const marcados = await raidTelegraphSkill(skill, tiles, {
        impactScale: 1.7, impactEffect: 'splash_wave', impactClass: 'fx-splash-wave',
    });
    if (!marcados) return;
    raidApplyDmgEmTiles(marcados, skill.danoBase || 2, skill);
    await raidTransformarTiles('FOGO', 'AGUA', { stagger: 35, tiles: marcados });
};

// =================================================================
// HANDLERS — RAID 3 (MOÑÁI)
// =================================================================
RAID_SKILLS['raid_monai_voo_rasante'] = async function(enemy, skill) {
    raidTocarSom('raid_monai_voo_rasante');
    if (typeof addLog === 'function') addLog(`${raidEmoji('monai')} ${skill.nome}!`);

    const b = raidGetBossPrimario();
    let destination = skill._raidPayload?.bossPosition;
    if (!destination) {
        let nx = 0, ny = 0, tent = 0;
        do {
            nx = Math.floor(Math.random() * 5);
            ny = Math.floor(Math.random() * 5);
            tent++;
        } while (tent < 40 && players.some(p =>
            !p.dead && Math.abs(p.x - nx) <= 2 && Math.abs(p.y - ny) <= 2
        ));
        destination = { x: nx, y: ny };
    }

    // Pouso 4x4 (o dobro da area anterior).
    const tiles = [];
    for (let dx = 0; dx < 4; dx++) {
        for (let dy = 0; dy < 4; dy++) {
            tiles.push({ x: destination.x + dx, y: destination.y + dy });
        }
    }
    const marcados = await raidTelegraphSkill(skill, tiles, {
        payload: { bossPosition: destination },
        impactScale: 1.6,
    });
    if (!marcados) return;

    const token = document.getElementById('raidBossToken_0');
    if (token) token.style.opacity = '0.2';
    await raidSleep(250);
    b.x = destination.x;
    b.y = destination.y;
    if (token) token.style.opacity = '1';
    if (typeof updateVisuals === 'function') updateVisuals();
    raidApplyDmgEmTiles(marcados, skill.danoBase || enemy.atk, skill);

    players.forEach(p => {
        if (p.dead) return;
        if (!marcados.some(t => t.x === p.x && t.y === p.y)) return;
        const dirX = Math.sign(p.x - destination.x), dirY = Math.sign(p.y - destination.y);
        for (let i = 0; i < 2; i++) {
            const ex = p.x + dirX, ey = p.y + dirY;
            if (ex < 0 || ex >= 8 || ey < 0 || ey >= 8) break;
            if (raidIsTileOcupadoPorBoss(ex, ey)
                || (typeof isOccupied === 'function' && isOccupied(ex, ey, p.id))) break;
            p.x = ex; p.y = ey;
        }
    });
    if (typeof updateVisuals === 'function') updateVisuals();
};

RAID_SKILLS['raid_monai_sopro_tempestade'] = async function(enemy, skill) {
    raidTocarSom('raid_monai_sopro_tempestade');
    if (typeof addLog === 'function') addLog(`${raidEmoji('monai')} ${skill.nome}!`);

    const b = raidGetBossPrimario();
    const c = raidGetBossCentro(b);
    const cx = Math.floor(c.x), cy = Math.floor(c.y);

    const tiles = raidGetBossAttackTiles(b, skill.raidShape || 'rows');
    const marcados = await raidTelegraphSkill(skill, tiles, {
        impactScale: 1.8, impactEffect: 'splash_wave', impactClass: 'fx-splash-wave',
    });
    if (!marcados) return;
    raidApplyDmgEmTiles(marcados, skill.dano || Math.ceil(enemy.atk / 2), skill);

    players.forEach(p => {
        if (p.dead) return;
        if (!marcados.some(tile => tile.x === p.x && tile.y === p.y)) return;
        const dirX = Math.sign(p.x - cx), dirY = Math.sign(p.y - cy);
        for (let i = 0; i < 2; i++) {
            const ex = p.x + dirX, ey = p.y + dirY;
            if (ex < 0 || ex >= 8 || ey < 0 || ey >= 8) break;
            if (raidIsTileOcupadoPorBoss(ex, ey)
                || (typeof isOccupied === 'function' && isOccupied(ex, ey, p.id))) break;
            p.x = ex; p.y = ey;
        }
    });

    raidEmbaralharTiles(marcados);
    await raidSleep(200);
    if (typeof updateVisuals === 'function') updateVisuals();
};

// =================================================================
// HANDLERS — RAID 4 (JASY JATERÊ)
// =================================================================
RAID_SKILLS['raid_jasy_salto_solar'] = async function(enemy, skill) {
    raidTocarSom('raid_jasy_salto_solar');
    if (typeof addLog === 'function') addLog(`${raidEmoji('jasy_jatere')} ${skill.nome}!`);

    const b = raidGetBossPrimario();
    const dirs = [{dx:1,dy:1},{dx:1,dy:-1},{dx:-1,dy:1},{dx:-1,dy:-1}];
    let destination = skill._raidPayload?.bossPosition;
    if (!destination) {
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        destination = {
            x: Math.max(0, Math.min(6, b.x + dir.dx * 3)),
            y: Math.max(0, Math.min(6, b.y + dir.dy * 3)),
        };
    }
    const tiles = [];
    for (let dx = 0; dx < 2; dx++)
        for (let dy = 0; dy < 2; dy++)
            tiles.push({ x: destination.x + dx, y: destination.y + dy });

    const marcados = await raidTelegraphSkill(skill, tiles, {
        payload: { bossPosition: destination },
        impactScale: 1.6, impactEffect: 'flame_short', impactClass: 'fx-flame-short',
    });
    if (!marcados) return;
    b.x = destination.x;
    b.y = destination.y;
    if (typeof updateVisuals === 'function') updateVisuals();
    raidApplyDmgEmTiles(marcados, skill.danoBase || enemy.atk, skill);
};

RAID_SKILLS['raid_jasy_clarao_cegante'] = async function(enemy, skill) {
    raidTocarSom('raid_jasy_clarao_cegante');
    if (typeof addLog === 'function') addLog(`${raidEmoji('jasy_jatere')} ${skill.nome}!`);

    const b = raidGetBossPrimario();
    const c = raidGetBossCentro(b);
    const cx = Math.floor(c.x), cy = Math.floor(c.y);

    const tiles = raidGetBossAttackTiles(b, skill.raidShape || 'diagonals');
    const marcados = await raidTelegraphSkill(skill, tiles, {
        impactScale: 1.9, impactEffect: 'element_pulse', impactClass: 'fx-element-pulse',
    });
    if (!marcados) return;
    raidApplyDmgEmTiles(marcados, Math.max(1, Math.ceil((skill.dano || enemy.atk) / 2)), skill);
};

// =================================================================
// HANDLERS — RAID 5 (KURUPÍ)
// =================================================================
RAID_SKILLS['raid_kurupi_raizes_estranguladoras'] = async function(enemy, skill) {
    raidTocarSom('raid_kurupi_raizes_estranguladoras');
    if (typeof addLog === 'function') addLog(`${raidEmoji('kurupi')} ${skill.nome}!`);

    if (!window.raidRaizes) window.raidRaizes = [];
    const alvo = players.find(player => !player.dead);
    if (!alvo) return;
    const target = skill._raidPayload?.target || { x: alvo.x, y: alvo.y, heroId: alvo.id };

    // Área 3×3 centrada no herói: como ele é obrigado a se mover, marcar só o
    // tile atual deixava a skill sempre inofensiva.
    const area = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const nx = Math.max(0, Math.min(7, target.x + dx));
            const ny = Math.max(0, Math.min(7, target.y + dy));
            if (!area.some(t => t.x === nx && t.y === ny)) area.push({ x: nx, y: ny });
        }
    }

    const marcados = await raidTelegraphSkill(skill, area, {
        payload: { target },
        impactScale: 1.3,
    });
    if (!marcados) return;

    const preso = players.find(player => player.id === target.heroId && !player.dead
        && area.some(t => t.x === player.x && t.y === player.y));
    if (!preso) {
        if (typeof addLog === 'function') addLog('🌿 As raízes fecharam no vazio; você escapou!');
        return;
    }
    if (typeof spawnFxAt === 'function') {
        spawnFxAt('coil_wrap', 'fx-coil-wrap', preso.x, preso.y, { duration: 900, scale: 1.5 });
    }
    preso.preso = true;
    window.raidRaizes.push({ heroiId: preso.id, x: preso.x, y: preso.y });
    raidApplyDmgHero(preso, skill.danoBase || 2, skill);

    raidRenderRaizes();
    if (typeof updateVisuals === 'function') updateVisuals();
};

RAID_SKILLS['raid_kurupi_chamado_mata'] = async function(enemy, skill) {
    raidTocarSom('raid_kurupi_chamado_mata');
    if (typeof addLog === 'function') addLog(`${raidEmoji('kurupi')} ${skill.nome}!`);

    if (!window.raidAnimais) window.raidAnimais = [];
    const b = raidGetBossPrimario();
    const tiles = raidGetBossAttackTiles(b, skill.raidShape || 'columns');
    const marcados = await raidTelegraphSkill(skill, tiles, {
        impactScale: 1.45, impactEffect: 'spectral_veil', impactClass: 'fx-spectral-veil',
    });
    if (!marcados) return;
    raidApplyDmgEmTiles(marcados, skill.danoBase || Math.max(1, Math.ceil(enemy.atk / 2)), skill);

    const maxAnimais = skill.maxAnimais || 2;
    if (window.raidAnimais.filter(a => !a.dead).length >= maxAnimais) return;
    const cands = [
        { x: b.x - 1, y: b.y }, { x: b.x + 2, y: b.y },
        { x: b.x, y: b.y - 1 }, { x: b.x, y: b.y + 2 },
    ].filter(c => c.x >= 0 && c.x < 8 && c.y >= 0 && c.y < 8
        && !players.some(player => !player.dead && player.x === c.x && player.y === c.y)
        && !raidIsTileOcupadoPorBoss(c.x, c.y)
        && !raidIsTileOcupadoPorAnimal(c.x, c.y));

    if (cands.length === 0) return;
    const pos = cands[Math.floor(Math.random() * cands.length)];

    const cabureAsset = (window.A_RAID_ASSETS?.summons?.pombero_cabure) || {};
    window.raidAnimais.push({
        id: 'animal_' + Date.now(),
        nome: 'Caburé',
        x: pos.x, y: pos.y,
        hp: skill.animal?.hp || 15, maxHp: skill.animal?.hp || 15,
        atk: 1,
        dead: false, isAnimal: true,
        emoji: cabureAsset.emoji || '🦉',
        sprite: cabureAsset.sprite || '',
    });
    if (typeof addLog === 'function') addLog('🦉 Pombero invoca um Caburé!');
    if (typeof spawnFxAt === 'function') {
        spawnFxAt('heal_orb', 'fx-heal-orb', pos.x, pos.y, { duration: 850, scale: 1.35 });
        spawnFxAt('shockwave', 'fx-shockwave', pos.x, pos.y, { duration: 850, scale: 1.1 });
    }
    raidRenderAnimais();
};

// =================================================================
// HANDLERS — RAID 6 (AO AO)
// =================================================================
RAID_SKILLS['raid_aoao_investida_diagonal'] = async function(enemy, skill) {
    raidTocarSom('raid_aoao_investida_diagonal');
    if (typeof addLog === 'function') addLog(`${raidEmoji('ao_ao')} ${skill.nome}!`);

    const b = raidGetBossPrimario();
    let pathPositions = skill._raidPayload?.pathPositions;
    if (!pathPositions) {
        let x = b.x, y = b.y;
        let dx = Math.random() < 0.5 ? 1 : -1;
        let dy = Math.random() < 0.5 ? 1 : -1;
        let ricochetes = 0;
        pathPositions = [];
        for (let passo = 0; passo < (skill.distanciaMovimento || 2); passo++) {
            let nx = x + dx, ny = y + dy;
            let ric = false;
            if (nx < 0 || nx > 6) { dx = -dx; nx = x + dx; ric = true; }
            if (ny < 0 || ny > 6) { dy = -dy; ny = y + dy; ric = true; }
            if (ric && ++ricochetes > 2) break;
            x = nx;
            y = ny;
            pathPositions.push({ x, y });
        }
    }

    const tiles = [];
    pathPositions.forEach(position => {
        for (let dx = 0; dx < 2; dx++)
            for (let dy = 0; dy < 2; dy++)
                tiles.push({ x: position.x + dx, y: position.y + dy });
    });
    const marcados = await raidTelegraphSkill(skill, tiles, {
        payload: { pathPositions },
        impactScale: 1.65,
    });
    if (!marcados) return;

    for (const position of pathPositions) {
        b.x = position.x;
        b.y = position.y;
        if (typeof updateVisuals === 'function') updateVisuals();
        await raidSleep(180);
    }
    raidApplyDmgEmTiles(marcados, skill.danoBase || enemy.atk, skill);
};

RAID_SKILLS['raid_aoao_la_energizada'] = async function(enemy, skill) {
    raidTocarSom('raid_aoao_la_energizada');
    if (typeof addLog === 'function') addLog(`${raidEmoji('ao_ao')} ${skill.nome}!`);

    const b = raidGetBossPrimario();
    const c = raidGetBossCentro(b);
    const cx = Math.floor(c.x), cy = Math.floor(c.y);

    const dirs = [{dx:1,dy:1},{dx:1,dy:-1},{dx:-1,dy:1},{dx:-1,dy:-1}];
    const tiles = [];
    const distProj = 8; // diagonais atravessam ate a borda do tabuleiro

    for (let pi = 0; pi < (skill.numProjeteis || 4); pi++) {
        const dir = dirs[pi % dirs.length];
        for (let i = 1; i <= distProj; i++) {
            const tx = cx + dir.dx * i, ty = cy + dir.dy * i;
            if (tx < 0 || tx >= 8 || ty < 0 || ty >= 8) break;
            tiles.push({ x: tx, y: ty });
        }
    }

    const marcados = await raidTelegraphSkill(skill, tiles, {
        impactScale: 1.3, impactEffect: 'impact', impactClass: 'fx-impact',
    });
    if (!marcados) return;
    raidApplyDmgEmTiles(marcados, skill.danoBase || 2, skill);
};

async function raidAoAoFissao() {
    if (window.raidAoAoDividido) return;
    const b = raidGetBossPrimario();
    if (!b) return;
    if (b.hp / b.maxHp > 0.5) return;

    raidTocarSom('raid_fissao_voraz');
    if (typeof addLog === 'function') addLog(`${raidEmoji('ao_ao')} FISSÃO VORAZ!`);

    if (typeof spawnFxAt === 'function') {
        spawnFxAt('impact', 'fx-impact', b.x, b.y, { duration: 900, scale: 2.5 });
    }

    await raidSleep(600);

    const hpMetade = Math.max(1, Math.floor(b.hp / 2));
    const m1 = { x: Math.max(0, b.x - 2), y: b.y, hp: hpMetade, maxHp: b.maxHp,
                 size:2, sizeH:2, sizeV:2, type:'ao_ao', dead:false, isFissaoMetade:true, id:'aoao_m1' };
    const m2 = { x: Math.min(6, b.x + 2), y: b.y, hp: hpMetade, maxHp: b.maxHp,
                 size:2, sizeH:2, sizeV:2, type:'ao_ao', dead:false, isFissaoMetade:true, id:'aoao_m2' };

    b.dead = true;
    window.raidAoAoDividido = true;
    window.raidBosses = [m1, m2];

    const tok = document.getElementById('raidBossToken_0');
    if (tok) tok.remove();

    raidRenderBosses();
    if (typeof raidAtualizarBossCard === 'function') raidAtualizarBossCard();
};

async function raidAoAoReFusao(metade) {
    if (!window.raidAoAoDividido) return;
    await raidSleep(400);
    metade.isFissaoMetade = false;
    metade.id = 'ao_ao';
    window.raidBosses = [metade];
    window.raidAoAoDividido = false;
    raidRenderBosses();
    if (typeof raidAtualizarBossCard === 'function') raidAtualizarBossCard();
}

// =================================================================
// HANDLERS — RAID 7 (LUISON)
// =================================================================
RAID_SKILLS['raid_luison_colheita_sombria'] = async function(enemy, skill) {
    raidTocarSom('raid_luison_colheita_sombria');
    if (typeof addLog === 'function') addLog(`${raidEmoji('luison')} ${skill.nome}!`);

    const target = players.find(player => !player.dead);
    if (!target) return;
    const tiles = raidGetTilesAround(target.x, target.y, 1, 1);
    const marcados = await raidTelegraphSkill(skill, tiles, {
        impactScale: 1.65, impactEffect: 'spectral_veil', impactClass: 'fx-spectral-veil',
    });
    if (!marcados) return;
    marcados.forEach((tile, index) => setTimeout(() => {
        if (typeof spawnFxAt === 'function') {
            spawnFxAt('spectral_veil', 'fx-spectral-veil', tile.x, tile.y, {
                duration: 850, scale: 1.1,
            });
        }
    }, Math.min(index * 30, 250)));
    raidApplyDmgEmTiles(marcados, skill.danoBase || 2, skill);
};

function raidEncontrarHandler(skillId) {
    const mapa = {
        'sete_cabecas':'raid_teju_sete_cabecas',
        'ima_almas':'raid_teju_ima_almas',
        'bico_arco_iris':'raid_mboi_bico_arco_iris',
        'inundacao':'raid_mboi_inundacao',
        'voo_rasante':'raid_monai_voo_rasante',
        'sopro_tempestade':'raid_monai_sopro_tempestade',
        'salto_solar':'raid_jasy_salto_solar',
        'clarao_cegante':'raid_jasy_clarao_cegante',
        'raizes_estranguladoras':'raid_kurupi_raizes_estranguladoras',
        'chamado_mata':'raid_kurupi_chamado_mata',
        'investida_diagonal':'raid_aoao_investida_diagonal',
        'la_energizada':'raid_aoao_la_energizada',
        'colheita_sombria':'raid_luison_colheita_sombria',
        'legado_filhos':'raid_luison_legado_filhos',
    };
    return mapa[skillId] || null;
}

RAID_SKILLS['raid_luison_legado_filhos'] = async function(enemy, skill) {
    raidTocarSom('raid_luison_legado_filhos');
    if (typeof addLog === 'function') addLog(`${raidEmoji('luison')} ${skill.nome}!`);

    const b = raidGetBossPrimario();
    const tiles = raidGetBossAttackTiles(b, skill.raidShape || 'cross');
    const marcados = await raidTelegraphSkill(skill, tiles, {
        impactScale: 1.65, impactEffect: 'spectral_veil', impactClass: 'fx-spectral-veil',
    });
    if (!marcados) return;
    raidApplyDmgEmTiles(marcados, skill.danoBase || 2, skill);
};

// =================================================================
// HANDLERS — RAID FINAL (PESADELO)
// =================================================================
RAID_SKILLS['raid_pesadelo_14_legados'] = async function(enemy, skill) {
    const cfg = raidGetConfig('pesadelo');
    if (!cfg) return;

    const esc = cfg.skills[Math.floor(Math.random() * cfg.skills.length)];
    if (!esc) return;

    const cfgOrigem = raidGetConfig(esc.skillOrigem);
    const elem = cfgOrigem?.elemento || 'FOGO';

    if (typeof addLog === 'function') addLog(`${raidEmoji('pesadelo')} Invoca: ${esc.skillId}!`);

    const hk = raidEncontrarHandler(esc.skillId);
    if (!hk || !RAID_SKILLS[hk]) {
        console.error('[raid] Legado do Pesadelo sem handler:', esc.skillId);
        if (typeof addLog === 'function') addLog('A habilidade invocada falhou; nenhum dano foi causado.');
        return;
    }

    const mock = { id: esc.skillId, nome: esc.skillId, danoBase: enemy.atk,
                   elementoPerigo: elem, danoBonusElemento: 0.5 };
    await RAID_SKILLS[hk](enemy, mock);
};

function raidPesadeloSussurro() {
    if (!window._raidMode) return;
    window.raidPesadeloTurnos = (window.raidPesadeloTurnos || 0) + 1;
    if (window.raidPesadeloTurnos % 3 !== 0) return;

    const vivos = players.filter(p => !p.dead);
    if (vivos.length === 0) return;

    raidTocarSom('raid_sussurro_anhanga');
    const alvo = vivos[Math.floor(Math.random() * vivos.length)];
    const tipo = Math.random() < 0.5 ? 'atk' : 'cura';

    if (tipo === 'atk') {
        alvo.bonusAtk = (alvo.bonusAtk || 0) + 3;
        if (typeof addLog === 'function') addLog(`${raidEmoji('pesadelo')} Anhangá: ${alvo.name} +3 ATK!`);
    } else {
        alvo.hp = Math.min(alvo.maxHp, alvo.hp + 3);
        if (typeof showHealEffect === 'function') showHealEffect(alvo.x, alvo.y, 3);
        if (typeof addLog === 'function') addLog(`${raidEmoji('pesadelo')} Anhangá: ${alvo.name} +3 HP!`);
    }
    if (typeof updateHeroCard === 'function') updateHeroCard();
}

// =================================================================
// APLICAR SKILL (entrypoint)
// =================================================================
async function raidApplySkill(enemy, skill) {
    if (!enemy || !skill) return;

    if (skill.skillOrigem && skill.skillId) {
        return RAID_SKILLS['raid_pesadelo_14_legados'](enemy, skill);
    }

    const hk = raidEncontrarHandler(skill.id);
    if (!hk || !RAID_SKILLS[hk]) {
        console.error('[raid] Handler não encontrado:', skill.id);
        if (typeof addLog === 'function') addLog(`⚠️ A habilidade ${skill.nome || skill.id} falhou; nenhum dano foi causado.`);
        return;
    }
    try { await RAID_SKILLS[hk](enemy, skill); }
    catch (e) { console.error('[raid] Erro em', hk, e); }
}

// =================================================================
// IA DO BOSS — TURNO
// =================================================================
async function raidTurnoBoss() {
    if (!window._raidMode) return;
    if (!window.raidAtual) return;
    if (window._endGameShowing) return;

    const cfg = raidGetConfig(window.raidAtual);
    if (!cfg) return;

    const tb = document.getElementById('turnBoss');
    if (tb) tb.classList.add('active-turn');

    const pendingSkill = window._raidPendingSkill;
    if (pendingSkill) {
        try {
            await raidApplySkill(pendingSkill.enemy, {
                ...pendingSkill.skill,
                _raidResolve: true,
                _raidTiles: pendingSkill.tiles,
            });
        } finally {
            if (window._raidPendingSkill === pendingSkill) {
                raidClearSkillWarning(pendingSkill.tiles);
                window._raidPendingSkill = null;
            }
        }
        await raidSleep(400);
        if (tb) tb.classList.remove('active-turn');
        return;
    }

    // 1. Mover bosses (4 tentativas)
    const bs = raidGetBosses().filter(b => !b.dead);
    for (const b of bs) {
        if (b.isFissaoMetade) continue;
        for (let i = 0; i < 4; i++) {
            const dirs = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
            const validos = dirs.filter(d => raidBossPodeMoverPara(b, b.x + d.dx, b.y + d.dy));
            if (validos.length === 0) break;
            const esc = validos[Math.floor(Math.random() * validos.length)];
            b.x += esc.dx; b.y += esc.dy;
            raidAtualizarTokenBoss();
            await raidSleep(160);
        }
    }

    if (typeof updateAllSpriteDirections === 'function') updateAllSpriteDirections();
    await raidSleep(250);

    // 2. Animais
    if (window.raidAnimais && window.raidAnimais.length > 0) {
        await raidTurnoAnimais();
    }

    // 3. Skill
    const atacante = bs[0];
    if (atacante && !atacante.dead) {
        const skill = cfg.skills[Math.floor(Math.random() * cfg.skills.length)];
        const mock = { id: cfg.id, nome: cfg.nome, atk: cfg.atk };
        await raidApplySkill(mock, skill);
    }

    // 4. Passivas
    if (window.raidAtual === 'ao_ao') await raidAoAoFissao();
    if (window.raidAtual === 'pesadelo') raidPesadeloSussurro();

    // 5. Dano das raízes
    if (cfg.skills.some(skill => skill.id === 'raizes_estranguladoras')
        && window.raidRaizes?.length > 0) {
        const dano = cfg.skills.find(skill => skill.id === 'raizes_estranguladoras')
            ?.danoPorTurnoPreso || 1;
        players.forEach(p => {
            if (!p.dead && p.preso) {
                if (typeof applyDmg === 'function') applyDmg(p, dano);
            }
        });
    }

    await raidSleep(400);
    if (tb) tb.classList.remove('active-turn');
}

async function raidTurnoAnimais() {
    if (!window.raidAnimais) return;
    for (const animal of window.raidAnimais) {
        if (animal.dead) continue;
        const vivos = players.filter(p => !p.dead);
        if (vivos.length === 0) break;

        let alvo = vivos[0], menor = Infinity;
        vivos.forEach(p => {
            const d = Math.abs(p.x - animal.x) + Math.abs(p.y - animal.y);
            if (d < menor) { menor = d; alvo = p; }
        });

        if (menor <= 1) {
            if (typeof applyDmg === 'function') applyDmg(alvo, animal.atk);
            if (typeof spawnFxAt === 'function') spawnFxAt('impact', 'fx-impact', alvo.x, alvo.y, { duration: 500 });
            await raidSleep(400);
        } else {
            // A invocacao anda ate 2 tiles por turno na direcao do heroi.
            for (let passo = 0; passo < 2; passo++) {
                const distAgora = Math.abs(alvo.x - animal.x) + Math.abs(alvo.y - animal.y);
                if (distAgora <= 1) break;
                const dx = Math.sign(alvo.x - animal.x);
                const dy = Math.sign(alvo.y - animal.y);
                const tent = [
                    { x: animal.x + dx, y: animal.y },
                    { x: animal.x, y: animal.y + dy },
                    { x: animal.x + dx, y: animal.y + dy },
                ];
                let moveu = false;
                for (const t of tent) {
                    if (t.x < 0 || t.x >= 8 || t.y < 0 || t.y >= 8) continue;
                    if (raidIsTileOcupadoPorBoss(t.x, t.y)) continue;
                    if (typeof isOccupied === 'function' && isOccupied(t.x, t.y, -99)) continue;
                    animal.x = t.x; animal.y = t.y;
                    moveu = true;
                    raidRenderAnimais();
                    await raidSleep(180);
                    break;
                }
                if (!moveu) break;
            }
        }
    }
}

console.log('✅ raid.js V5.0 — Bloco 3/5 (skills + IA) carregado.');
// =================================================================
// raid.js — V5.0 — Bloco 4/5
// Integração com o motor do coop.js
// -----------------------------------------------------------------
// Estratégia:
//   1. Hook no coopCriarSala: detecta se é raid (prefixo "Raid:")
//   2. Hook no coopEntrarSala: idem
//   3. coopPublicarEstado chamado → sala criada no Firestore
//   4. No listener, o coop detecta _raidMode e chama raidTurnoBoss
//      em vez de storyEnemyAI
// =================================================================

const RAID_COOP_PREFIX = 'Raid:';

// -----------------------------------------------------------------
// Helper: configurar modo raid antes de chamar coop.js
// -----------------------------------------------------------------
function raidPrepararModoRaid(raidId) {
    const cfg = raidGetConfig(raidId);
    if (!cfg) return false;

    window._raidMode = true;
    window.raidAtual = raidId;
    window.raidBosses = [];
    window.raidAnimais = [];
    window.raidRaizes = [];
    window.raidAoAoDividido = false;
    window.raidPesadeloTurnos = 0;
    window._raidFinalizando = false;
    window._raidPendingSkill = null;

    raidConfigurarBossGlobal(cfg);
    return true;
}

// -----------------------------------------------------------------
// Helper: iniciar batalha de raid (chamado quando o coop entra no tabuleiro)
// -----------------------------------------------------------------
async function raidIniciarBatalha(raidId) {
    const cfg = raidGetConfig(raidId);
    if (!cfg) return;

    window._raidMode = true;
    window.raidAtual = raidId;

    if (typeof boss !== 'undefined' && !boss.raidId) {
        raidConfigurarBossGlobal(cfg);
    }

    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    raidRenderBosses();
    raidInjetarUI();
}

// -----------------------------------------------------------------
// Hook 1: interceptar coopCriarSala pra raids
// -----------------------------------------------------------------
(function hookCoopCriarSala() {
    let tentativas = 0;
    const intervalo = setInterval(() => {
        tentativas++;
        if (tentativas > 100) { clearInterval(intervalo); return; }
        if (typeof window.coopCriarSala !== 'function') return;
        clearInterval(intervalo);

        const _orig = window.coopCriarSala;

        window.coopCriarSala = async function(atoId, faseId) {
            // Detecta raid (faseId começa com "Raid:")
            if (typeof faseId === 'string' && faseId.startsWith(RAID_COOP_PREFIX)) {
                const raidId = faseId.slice(RAID_COOP_PREFIX.length);
                const cfg = raidGetConfig(raidId);
                if (!cfg) { uiAviso('Raid inválida.'); return; }

                if (!raidTemOuroSuficiente(cfg.custoEntrada)) {
                    uiAviso('Ouro insuficiente.');
                    return;
                }
                if (!raidCobrarEntrada(cfg.custoEntrada)) {
                    uiAviso('Erro ao cobrar entrada.');
                    return;
                }

                raidPrepararModoRaid(raidId);

                // Chama o coop original com um id fake
                // O coop vai ler STORY_PROGRESS.selectedHeroes
                await _orig.call(this, 0, faseId);
                return;
            }
            return _orig.apply(this, arguments);
        };

        console.log('[raid] coopCriarSala hookado.');
    }, 100);
})();

// -----------------------------------------------------------------
// Hook 2: interceptar coopEntrarSala pra raids
// -----------------------------------------------------------------
(function hookCoopEntrarSala() {
    let tentativas = 0;
    const intervalo = setInterval(() => {
        tentativas++;
        if (tentativas > 100) { clearInterval(intervalo); return; }
        if (typeof window.coopEntrarSala !== 'function') return;
        clearInterval(intervalo);

        const _orig = window.coopEntrarSala;

        window.coopEntrarSala = async function(roomId) {
            // Lê a sala pra ver se é raid
            try {
                const doc = await fbDb.collection(COOP_ROOMS).doc(roomId).get();
                if (doc.exists) {
                    const data = doc.data();
                    if (typeof data.fase === 'string' && data.fase.startsWith(RAID_COOP_PREFIX)) {
                        const raidId = data.fase.slice(RAID_COOP_PREFIX.length);
                        raidPrepararModoRaid(raidId);
                    }
                }
            } catch (e) {}
            return _orig.apply(this, arguments);
        };

        console.log('[raid] coopEntrarSala hookado.');
    }, 100);
})();

// -----------------------------------------------------------------
// Hook 3: interceptar coopProcessarMorteBoss pra drops de raid
// -----------------------------------------------------------------
(function hookCoopProcessarMorteBoss() {
    let tentativas = 0;
    const intervalo = setInterval(() => {
        tentativas++;
        if (tentativas > 100) { clearInterval(intervalo); return; }
        if (typeof window.coopProcessarMorteBoss !== 'function') return;
        clearInterval(intervalo);

        // Substituímos SÓ quando estamos em raid
        const _orig = window.coopProcessarMorteBoss;

        window.coopProcessarMorteBoss = async function() {
            if (window._raidMode && window.raidAtual) {
                return raidProcessarMorteBossCoop();
            }
            return _orig.apply(this, arguments);
        };

        console.log('[raid] coopProcessarMorteBoss hookado.');
    }, 100);
})();

// -----------------------------------------------------------------
// Drop de raid (em coop) — só quem iniciou a sala recebe drop
// -----------------------------------------------------------------
async function raidProcessarMorteBossCoop() {
    if (coopProcessandoMorteBoss) return;
    if (coopPartidaConcluida) return;

    coopProcessandoMorteBoss = true;

    try {
        await raidSleep(800);

        const cfg = raidGetConfig(window.raidAtual);
        const drops = [];

        // Drop: apenas o criador recebe (ele pagou a entrada)
        if (cfg && coopRole === 'criador') {
            if (window._regionalRaidContext) {
                raidCreditarRecompensa(cfg.recompensaXP || 0, cfg.recompensaOuro || 0);
                if (typeof window.onRegionalRaidVictory === 'function') {
                    window._regionalRaidWonEquipment = window.onRegionalRaidVictory(cfg);
                }
                if (typeof window.registrarConhecimentoRaid === 'function') {
                    window._regionalRaidKnowledgeResult = window.registrarConhecimentoRaid(cfg.id);
                }
            }
            if (cfg.fragmentoComum) {
                const qtd = 1 + Math.floor(Math.random() * 3);
                drops.push({ id: cfg.fragmentoComum, qty: qtd });
                if (typeof addMaterial === 'function') addMaterial(cfg.fragmentoComum, qtd);
            }
            if (cfg.fragmentoRaro && Math.random() < 0.30) {
                drops.push({ id: cfg.fragmentoRaro, qty: 1 });
                if (typeof addMaterial === 'function') addMaterial(cfg.fragmentoRaro, 1);
            }
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
        }

        if (cfg && coopRole === 'criador' && window._regionalRaidContext
            && typeof window.registrarRegionalRaidVictory === 'function') {
            window.registrarRegionalRaidVictory(cfg.id, STORY_PROGRESS.raidAttempts?.[cfg.id]?.difficulty
                || window._regionalRaidDifficulty || 'normal');
        }

        if (typeof showPurificacao === 'function') {
            try { await showPurificacao(boss.type, boss.x, boss.y, false); } catch (e) {}
        }

        // Publica vitória
        if (coopRoomId) {
            try {
                await fbDb.collection(COOP_ROOMS).doc(coopRoomId).update({
                    status: 'concluida',
                    vencedor: 'jogadores',
                    drops: drops,
                    'estadoJogo.boss': {
                        x: boss.x, y: boss.y, hp: boss.hp, maxHp: boss.maxHp,
                        type: boss.type, dead: true,
                    },
                    atualizadaEm: firebase.firestore.FieldValue.serverTimestamp(),
                });
            } catch (e) {}
        }

        coopPartidaConcluida = true;
    } catch (e) {
        console.error('[raid] Erro em raidProcessarMorteBossCoop:', e);
    } finally {
        coopProcessandoMorteBoss = false;
    }
}

// -----------------------------------------------------------------
// Helpers de economia
// -----------------------------------------------------------------
function raidTemOuroSuficiente(custo) {
    if (typeof STORY_PROGRESS === 'undefined') return false;
    return (STORY_PROGRESS.gold || 0) >= custo;
}

function raidCobrarEntrada(custo) {
    if (typeof STORY_PROGRESS === 'undefined') return false;
    if ((STORY_PROGRESS.gold || 0) < custo) return false;
    STORY_PROGRESS.gold -= custo;
    if (typeof saveStoryProgress === 'function') saveStoryProgress();
    return true;
}

function raidCreditarRecompensa(xp, ouro) {
    if (typeof STORY_PROGRESS === 'undefined') return;
    STORY_PROGRESS.totalXP = (STORY_PROGRESS.totalXP || 0) + xp;
    STORY_PROGRESS.gold = (STORY_PROGRESS.gold || 0) + ouro;
    if (typeof saveStoryProgress === 'function') saveStoryProgress();
}

console.log('✅ raid.js V5.0 — Bloco 4/5 (integração com coop.js) carregado.');
// =================================================================
// raid.js — V5.0 — Bloco 5/5 (UI + CSS + Boot)
// =================================================================

// =================================================================
// 1. MODAL DE ENTRADA
// =================================================================
function raidAbrirModalEntrada(raidId, tipo) {
    const cfg = raidGetConfig(raidId);
    if (!cfg) return;

    if (!raidTemOuroSuficiente(cfg.custoEntrada)) {
        uiAviso(`Ouro insuficiente!\n\nVocê tem ${STORY_PROGRESS.gold || 0}.\nPrecisa de ${cfg.custoEntrada}.`);
        return;
    }

    const heroAtual = (STORY_PROGRESS.selectedHeroes || ['Tupa'])[0];
    const heroData = STORY_HERO_CLASSES[heroAtual];

    const old = document.getElementById('raidModalEntrada');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'raidModalEntrada';
    modal.className = 'raid-modal-overlay';
    modal.innerHTML = `
        <div class="raid-modal-panel">
            <div class="raid-modal-header">
                <h2>${tipo === 'coop' ? '🎮 CRIAR SALA RAID' : '⚔️ ENTRAR SOLO'}</h2>
                <button class="raid-modal-close" onclick="document.getElementById('raidModalEntrada').remove()">✕</button>
            </div>
            <div class="raid-modal-boss-preview">
                <div class="raid-modal-boss-sprite">${raidIcon(cfg.id, 'large')}</div>
                <div class="raid-modal-boss-info">
                    <div class="raid-modal-boss-name">${cfg.nome}</div>
                    <div class="raid-modal-boss-title">${cfg.titulo}</div>
                    <div class="raid-modal-boss-elem">${cfg.elemento}</div>
                </div>
            </div>
            <div class="raid-modal-stats">
                <div class="raid-modal-stat">
                    <div class="raid-modal-stat-label">HP</div>
                    <div class="raid-modal-stat-value">${cfg.hp}</div>
                </div>
                <div class="raid-modal-stat">
                    <div class="raid-modal-stat-label">ATK</div>
                    <div class="raid-modal-stat-value">${cfg.atk}</div>
                </div>
                <div class="raid-modal-stat">
                    <div class="raid-modal-stat-label">Custo</div>
                    <div class="raid-modal-stat-value">💰 ${cfg.custoEntrada}</div>
                </div>
                <div class="raid-modal-stat">
                    <div class="raid-modal-stat-label">XP</div>
                    <div class="raid-modal-stat-value">⭐ ${cfg.recompensaXP}</div>
                </div>
            </div>
            <div class="raid-modal-hero">
                <div class="raid-modal-hero-label">SEU HERÓI</div>
                <div class="raid-modal-hero-name">${heroData?.displayName || heroAtual}</div>
            </div>
            <div class="raid-modal-aviso">
                ${tipo === 'coop'
                    ? '⚠️ VOCÊ paga a entrada. Seu amigo entra de graça e recebe recompensa cheia.'
                    : '⚠️ Se perder, você perde o custo de entrada.'}
            </div>
            <div class="raid-modal-actions">
                <button class="raid-modal-btn cancelar" onclick="document.getElementById('raidModalEntrada').remove()">CANCELAR</button>
                <button class="raid-modal-btn confirmar" id="raidModalConfirmar">${tipo === 'coop' ? '🎮 CRIAR' : '⚔️ ENTRAR'}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('raidModalConfirmar').onclick = () => {
        modal.remove();
        if (tipo === 'coop') {
            // Chama coopCriarSala com o prefixo "Raid:"
            if (typeof coopCriarSala === 'function') {
                coopCriarSala(0, RAID_COOP_PREFIX + raidId);
            }
        } else {
            // Solo: cria a sala automaticamente e entra como P1
            raidIniciarSoloViaCoop(raidId);
        }
    };
}

// =================================================================
// 2. SOLO VIA COOP (não reimplementa motor)
// -----------------------------------------------------------------
// Truque: solo = sala coop com "convidado" fake (nós mesmos)
// =================================================================
async function raidIniciarSoloViaCoop(raidId, options = {}) {
    const cfg = raidGetConfig(raidId);
    if (!cfg) return;
    const multiplayer = options.coop === true;
    const isResume = options.resume === true;
    const isCoopHost = !multiplayer || coopRole === 'criador';
    window._regionalRaidKnowledgeResult = null;
    window._regionalRaidWonEquipment = null;

    const difficulty = options.difficulty || 'normal';
    window._regionalRaidDifficulty = difficulty;
    const difficultyScale = {
        normal: { hp: 1, damage: 1, cost: 1, reward: 1 },
        dificil: { hp: 1.45, damage: 1.35, cost: 1.5, reward: 1.5 },
        pesadelo: { hp: 1.9, damage: 1.75, cost: 2, reward: 2 },
    }[difficulty];
    if (!difficultyScale) {
        uiAviso('Dificuldade de Raid inválida.');
        return;
    }

    const heroClass = (STORY_PROGRESS.selectedHeroes || ['Tupa'])[0];
    const unlockedHeroes = new Set(STORY_PROGRESS.unlockedHeroesStory || STORY_PROGRESS.selectedHeroes || []);
    if (!heroClass || !unlockedHeroes.has(heroClass) || !STORY_HERO_CLASSES[heroClass]) {
        uiAviso('Selecione um herói desbloqueado na Oca antes de iniciar uma Raid.');
        return;
    }

    const attempt = STORY_PROGRESS.raidAttempts?.[raidId];
    const today = new Date();
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const weekKey = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    if (attempt?.week === weekKey && !isResume) {
        uiAviso('Esta Raid já teve sua tentativa semanal consumida, independentemente da dificuldade.');
        return;
    }

    const entryCost = Math.round(cfg.custoEntrada * difficultyScale.cost);
    if (isCoopHost && !isResume && !raidTemOuroSuficiente(entryCost)) {
        uiAviso('Ouro insuficiente.');
        return;
    }

    const heroName = STORY_HERO_CLASSES[heroClass].displayName || heroClass;
    if (!multiplayer) {
        const okEntradaRaid = await uiConfirm(
            `⚔️ ENTRAR NO RAID\n\n${cfg.nome} — ${cfg.titulo}\n` +
            `Dificuldade: ${difficulty === 'dificil' ? 'Difícil' : difficulty === 'pesadelo' ? 'Pesadelo' : 'Normal'}\n` +
            `Herói: ${heroName}\nCusto: ${entryCost} ouro\n\n` +
            `A entrada e a tentativa semanal são consumidas ao começar. Continuar?`,
            { titulo: 'Entrar no raid', ok: 'Entrar', cancelar: 'Cancelar' }
        );
        if (!okEntradaRaid) return;
    }

    if (isCoopHost && !isResume && !raidCobrarEntrada(entryCost)) {
        uiAviso('Erro ao cobrar.');
        return;
    }

    if (!isResume) {
        if (!STORY_PROGRESS.raidAttempts || typeof STORY_PROGRESS.raidAttempts !== 'object') {
            STORY_PROGRESS.raidAttempts = {};
        }
        STORY_PROGRESS.raidAttempts[raidId] = {
            week: weekKey,
            difficulty,
            heroes: [heroClass],
            startedAt: Date.now(),
        };
    }

    const originalConfig = {
        hp: cfg.hp,
        atk: cfg.atk,
        custoEntrada: cfg.custoEntrada,
        recompensaOuro: cfg.recompensaOuro,
        recompensaXP: cfg.recompensaXP,
        skills: JSON.parse(JSON.stringify(cfg.skills || [])),
    };
    window._raidRegionalConfigSnapshot = { config: cfg, values: originalConfig };
    cfg.hp = Math.round(cfg.hp * difficultyScale.hp);
    cfg.atk = Math.max(1, Math.round(cfg.atk * difficultyScale.damage));
    cfg.custoEntrada = entryCost;
    cfg.recompensaOuro = Math.round(cfg.recompensaOuro * difficultyScale.reward);
    cfg.recompensaXP = Math.round(cfg.recompensaXP * difficultyScale.reward);
    cfg.skills = cfg.skills.map(skill => {
        const scaled = { ...skill };
        ['dano', 'danoBase', 'danoPorTurnoPreso'].forEach(key => {
            if (Number.isFinite(scaled[key])) {
                scaled[key] = Math.max(1, Math.round(scaled[key] * difficultyScale.damage));
            }
        });
        return scaled;
    });
    saveStoryProgress();
    window._regionalRaidWonEquipment = null;

    // Configura modo raid
    raidPrepararModoRaid(raidId);
    raidRole = null;
    raidRoomId = null;
    if (!multiplayer) {
        if (typeof coopRole !== 'undefined') coopRole = null;
        if (typeof coopRoomId !== 'undefined') coopRoomId = null;
    }
    if (typeof playerCount !== 'undefined') {
        window._raidRegionalRuntimeSnapshot = { playerCount };
        playerCount = multiplayer ? 2 : 1;
    }

    // Configura playerConfigs
    if (typeof playerConfigs !== 'undefined') {
        for (let i = 0; i < 4; i++) playerConfigs[i].active = false;
        playerConfigs[0].active = true;
        playerConfigs[0].class = heroClass;
        playerConfigs[0].name = heroName;
        if (multiplayer) {
            const partnerClass = coopRole === 'criador'
                ? (window._coopOponenteHeroClass || 'Tupa')
                : (window._coopCriadorHeroClass || 'Tupa');
            playerConfigs[1].active = true;
            playerConfigs[1].class = partnerClass;
            playerConfigs[1].name = STORY_HERO_CLASSES[partnerClass]?.displayName || partnerClass;
        }
    }

    // Inicia a batalha (usa startStoryPhase com uma fase falsa)
    if (typeof startStoryPhase === 'function') {
        // Cria uma fase fake temporária
        const fakeChapter = 99;
        if (!STORY_CHAPTERS[fakeChapter]) {
            STORY_CHAPTERS[fakeChapter] = {
                id: fakeChapter, name: 'Raid', description: 'Raid',
                capa: '', phases: [{
                    id: 'raid_solo', name: cfg.nome, bg: '', enemies: [],
                    description: cfg.descricao, reward: { xp: cfg.recompensaXP, gold: cfg.recompensaOuro }
                }]
            };
        }
        // Não chama startStoryPhase (que tenta rodar IA de história).
        // Chama initGame direto:
    }

    // Chama initGame direto
    document.querySelectorAll('#storyScreen, #titleScreen, #modeScreen, #playersScreen, #challengeScreen, #configScreen, #tutorialScreen').forEach(el => {
        if (el) { el.style.display = 'none'; el.classList.remove('active'); }
    });
    const gs = document.getElementById('gameScreen');
    if (gs) { gs.style.display = 'flex'; gs.classList.add('active'); }
    window.currentScreen = 'game';

    raidConfigurarBossGlobal(cfg);

    const _origInitGame = window.initGame;
    window.initGame = async function() {
        await _origInitGame.apply(this, arguments);
        window.initGame = _origInitGame;
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        raidConfigurarBossGlobal(cfg);
        raidRenderBosses();
        if (typeof updateHeroCard === 'function') updateHeroCard();
        raidInjetarUI();
        raidInstalarHooksSolo();
    };

    if (typeof initGame === 'function') await initGame();
}

// -----------------------------------------------------------------
// Hooks para solo (sem Firestore)
// -----------------------------------------------------------------
let _raidSoloHooksInstalados = false;

function raidInstalarHooksSolo() {
    if (_raidSoloHooksInstalados) return;
    _raidSoloHooksInstalados = true;

    // Intercepta cliques no grid
    document.addEventListener('click', raidOnTileClickCapture, true);
    document.addEventListener('click', raidOnPlayClickCapture, true);
    document.addEventListener('click', raidOnSkillClickCapture, true);
    console.log('[raid] Hooks de solo instalados.');
}

function raidOnTileClickCapture(ev) {
    if (!window._raidMode) return;
    if (coopRole || raidRole) return; // está em coop
    const tile = ev.target.closest('#grid .tile');
    if (!tile) return;
    ev.stopPropagation(); ev.preventDefault();
    const tiles = Array.from(document.querySelectorAll('#grid .tile'));
    const idx = tiles.indexOf(tile);
    if (idx < 0) return;
    raidHandleTileClickSolo(idx);
}

function raidOnPlayClickCapture(ev) {
    if (!window._raidMode) return;
    if (coopRole || raidRole) return;
    if (!ev.target.closest('#btnPlay')) return;
    ev.stopPropagation(); ev.preventDefault();
    raidExecuteActionSolo();
}

function raidOnSkillClickCapture(ev) {
    if (!window._raidMode) return;
    if (coopRole || raidRole) return;
    if (!ev.target.closest('#btnSkill')) return;
    ev.stopPropagation(); ev.preventDefault();
    raidAtivarSkillSolo();
}

// -----------------------------------------------------------------
// Solo: clique no tile
// -----------------------------------------------------------------
function raidHandleTileClickSolo(idx) {
    if (!window._raidMode) return;
    if (!gameActive || arcadeBossTransition) return;
    if (window._raidTurnoRodando) return;

    const p = players[currentPlayerIdx];
    if (!p || p.dead) return;

    // Solo Sagrado
    if (skillActive) {
        grid[idx] = p.element;
        const tile = document.querySelectorAll('#grid .tile')[idx];
        if (tile) tile.className = `tile bg-${p.element}`;
        p.skillUsed = true;
        skillActive = false;
        document.querySelectorAll('#grid .tile').forEach(t => t.classList.remove('skill-mode'));
        if (typeof addLog === 'function') addLog(`✨ ${p.name} usou SOLO SAGRADO!`);
        return;
    }

    // Preso
    if (p.preso) {
        const x = idx % 8, y = Math.floor(idx / 8);
        if (x === p.x && y === p.y) {
            p.preso = false;
            if (typeof addLog === 'function') addLog(`🌿 ${p.name} se libertou!`);
            if (window.raidRaizes) window.raidRaizes = window.raidRaizes.filter(r => r.heroiId !== p.id);
            raidRenderRaizes();
            return;
        }
        return;
    }

    const x = idx % 8, y = Math.floor(idx / 8);
    if (raidIsTileOcupadoPorBoss(x, y)) return;
    if (raidIsTileOcupadoPorAnimal(x, y)) return;
    if (players.some(pl => !pl.dead && pl.id !== p.id && pl.x === x && pl.y === y)) return;
    if (x === p.x && y === p.y) return;

    if (path.length === 0) {
        if ((Math.abs(x - p.x) + Math.abs(y - p.y)) === 1) {
            path.push(idx);
            if (typeof playSfx === 'function') playSfx('click');
        }
    } else {
        const lastIdx = path[path.length - 1];
        if (idx === lastIdx) { path.pop(); if (typeof playSfx === 'function') playSfx('click'); }
        else if (!path.includes(idx) && grid[idx] === grid[lastIdx] &&
                 (Math.abs(x - lastIdx % 8) + Math.abs(y - Math.floor(lastIdx / 8))) === 1) {
            path.push(idx); if (typeof playSfx === 'function') playSfx('click');
        }
    }

    if (typeof renderPath === 'function') renderPath();
}

function raidAtivarSkillSolo() {
    if (!window._raidMode || coopRole || raidRole) return;
    if (!gameActive) return;
    const p = players[currentPlayerIdx];
    if (!p || p.skillUsed || p.dead) return;
    skillActive = true;
    document.querySelectorAll('#grid .tile').forEach(t => t.classList.add('skill-mode'));
}

async function raidExecuteActionSolo() {
    if (!window._raidMode || coopRole || raidRole) return;
    if (window._raidTurnoRodando) return;
    const active = players[currentPlayerIdx];
    if (!active || active.dead) return;
    if (path.length === 0) return;

    window._raidTurnoRodando = true;
    window._raidResolvingHeroAction = true;
    try {
        await raidExecutarAcao(active);
    } catch (e) {
        console.error('[raid] Erro:', e);
    } finally {
        window._raidResolvingHeroAction = false;
        window._raidTurnoRodando = false;
    }

    // O PA e o golpe terminam antes de verificar vitória ou avançar o turno.
    await raidAposTurnoSolo();
}

function raidGetTargetForPoderAncestral(active, target) {
    if (!target) return target;

    const heroData = STORY_HERO_CLASSES[active.class];
    const paKey = heroData?.paKey;
    const occupiedTiles = raidGetOccupiedTiles(target);
    let hitTile = null;

    if (paKey === 'base_coluna') {
        hitTile = occupiedTiles.find(tile => tile.x === active.x) || null;
    } else if (paKey === 'base_linha_cura') {
        hitTile = occupiedTiles.find(tile => tile.y === active.y) || null;
    } else if (typeof window.getStoryPATiles === 'function') {
        const snapshots = [
            { x: target.x, y: target.y, dead: target.dead, id: target.id },
            ...occupiedTiles.map(tile => ({
                x: tile.x, y: tile.y, dead: target.dead, id: target.id,
            })),
        ];
        for (const snapshot of snapshots) {
            const affectedTiles = window.getStoryPATiles(active, paKey, snapshot);
            hitTile = occupiedTiles.find(tile =>
                affectedTiles.includes(tile.y * 8 + tile.x)
            ) || null;
            if (hitTile) break;
        }
    }

    if (!hitTile || typeof Proxy !== 'function') return target;

    let targetX = hitTile.x;
    let targetY = hitTile.y;
    return new Proxy(target, {
        get(bossTarget, property, receiver) {
            if (property === 'x') return targetX;
            if (property === 'y') return targetY;
            return Reflect.get(bossTarget, property, receiver);
        },
        set(bossTarget, property, value, receiver) {
            if (property === 'x') {
                bossTarget.x += Number(value) - targetX;
                targetX = Number(value);
                return true;
            }
            if (property === 'y') {
                bossTarget.y += Number(value) - targetY;
                targetY = Number(value);
                return true;
            }
            return Reflect.set(bossTarget, property, value, receiver);
        },
    });
}

async function raidExecutarPoderAncestral(active, target, totalAtk) {
    const storyModeAnterior = window._storyMode;
    const applyDmgOriginal = window.applyDmg;
    const targetForPoderAncestral = raidGetTargetForPoderAncestral(active, target);
    window._storyMode = true;

    if (typeof applyDmgOriginal === 'function') {
        window.applyDmg = function(alvo, dano) {
            const raidBoss = raidGetBosses().find(b =>
                b === alvo || (alvo === targetForPoderAncestral && b === target)
            );
            if (raidBoss) return raidAplicarDanoNoBoss(raidBoss, dano);

            window._storyMode = storyModeAnterior;
            try {
                return applyDmgOriginal.apply(this, arguments);
            } finally {
                window._storyMode = true;
            }
        };
    }

    try {
        if (typeof showBravelyAnimation === 'function') {
            await showBravelyAnimation(active.class);
        }
        if (typeof triggerBravelyChain === 'function') {
            await triggerBravelyChain(active, targetForPoderAncestral, totalAtk);
        }
    } finally {
        if (typeof applyDmgOriginal === 'function') window.applyDmg = applyDmgOriginal;
        window._storyMode = storyModeAnterior;
    }
}

async function raidExecutarAcao(active) {
    const info = CLASS_DB[active.class] || { atk: 2, min: 0 };
    const heroData = STORY_HERO_CLASSES[active.class] || { role: 'Guerreiro' };
    const usedPath = [...path];
    const threshold = parseInt(document.getElementById('bravely_tiles')?.value) || 9;
    const isBravely = usedPath.length >= threshold;

    let skillAtkBonus = 0;
    const shape = (typeof detectShape === 'function') ? detectShape(usedPath) : null;
    if (shape) {
        if (shape === 'LINHA') { skillAtkBonus = 2; active.hp = Math.min(active.maxHp, active.hp + 1); if (typeof showHealEffect === 'function') showHealEffect(active.x, active.y, 1); }
        if (shape === 'L') { active.hp = Math.min(active.maxHp, active.hp + 2); if (typeof showHealEffect === 'function') showHealEffect(active.x, active.y, 2); }
        if (shape === 'ZIGZAG') skillAtkBonus = 3;
        if (shape === 'QUADRADO') active.skillUsed = false;
    }

    let levelBonus = { atk: 0 };
    if (typeof getHeroBonusFromLevel === 'function') levelBonus = getHeroBonusFromLevel(active.class) || levelBonus;

    let weaponElementBonus = 0;
    if (typeof getHeroEquipment === 'function' && typeof getWeaponById === 'function') {
        const eq = getHeroEquipment(active.class);
        if (eq?.arma && usedPath.length > 0) {
            const w = getWeaponById(eq.arma);
            if (w) {
                const tileEl = grid[usedPath[0]];
                if (w.elemento === 'ANY') { if (tileEl === active.element) weaponElementBonus = w.elementoBonus || 0; }
                else if (tileEl === w.elemento) weaponElementBonus = w.elementoBonus || 0;
            }
        }
    }

    const titleAtkBonus = active.titleBonus?.ATK || 0;
    const tileBonus = (usedPath.length > 0 && grid[usedPath[0]] === active.element) ? 1 : 0;
    const totalAtk = info.atk + (active.bonusAtk || 0) + (levelBonus.atk || 0) + tileBonus + skillAtkBonus + titleAtkBonus + weaponElementBonus;

    if (heroData.role === 'Guerreiro') {
        const deal = () => {
            const b = raidGetBossPrimario();
            if (!b || b.dead) return;
            const tiles = raidGetOccupiedTiles(b);
            if (tiles.some(t => Math.abs(active.x - t.x) + Math.abs(active.y - t.y) <= 1)) {
                if (typeof playSfx === 'function') playSfx('atkg');
                raidAplicarDanoNoBoss(b, totalAtk);
                if (typeof spawnSwordEffect === 'function') spawnSwordEffect(b.x, b.y);
            }
        };
        deal();
        for (const idx of usedPath) {
            active.x = idx % 8; active.y = Math.floor(idx / 8);
            if (typeof checkAmulet === 'function') checkAmulet(active, active.x, active.y);
            if (typeof updateVisuals === 'function') updateVisuals();
            if (raidIsTileOcupadoPorBoss(active.x, active.y)) break;
            if (raidIsTileOcupadoPorAnimal(active.x, active.y)) break;
            if (typeof isOccupied === 'function' && isOccupied(active.x, active.y, active.id)) break;
            deal();
            await raidSleep(120);
        }
    } else {
        for (const idx of usedPath) {
            active.x = idx % 8; active.y = Math.floor(idx / 8);
            if (typeof checkAmulet === 'function') checkAmulet(active, active.x, active.y);
            if (typeof updateVisuals === 'function') updateVisuals();
            if (raidIsTileOcupadoPorBoss(active.x, active.y)) break;
            if (raidIsTileOcupadoPorAnimal(active.x, active.y)) break;
            if (typeof isOccupied === 'function' && isOccupied(active.x, active.y, active.id)) break;
            await raidSleep(100);
        }
        const b = raidGetBossPrimario();
        if (usedPath.length >= (info.min || 0) && b && !b.dead) {
            const extra = usedPath.length - (info.min || 0);
            if (heroData.role === 'Arqueiro') {
                if (typeof spawnArrowProjectile === 'function') await spawnArrowProjectile(active, { x: b.x, y: b.y });
                if (typeof playSfx === 'function') playSfx('atka');
            } else {
                if (typeof spawnProjectile === 'function') await spawnProjectile(active, { x: b.x, y: b.y }, 'Magic');
                if (typeof playSfx === 'function') playSfx('atkm');
            }
            raidAplicarDanoNoBoss(b, totalAtk + extra);
        }
    }

    usedPath.forEach(idx => {
        const gridEl = document.getElementById('grid');
        if (gridEl.childNodes[idx] && typeof createTile === 'function') {
            gridEl.replaceChild(createTile(idx), gridEl.childNodes[idx]);
        }
    });

    if (isBravely) {
        const b = raidGetBossPrimario();
        await raidExecutarPoderAncestral(active, b, totalAtk);
    }

    path = [];
    if (typeof renderPath === 'function') renderPath();
}

async function raidAposTurnoSolo() {
    if (!window._raidMode || coopRole || raidRole) return;
    if (!gameActive || window._endGameShowing) return;

    // Verifica vitória
    const bs = raidGetBosses().filter(b => !b.dead);
    if (bs.length === 0) {
        return raidHandleBossDefeat();
    }

    // Verifica derrota
    if (!players.some(p => !p.dead)) {
        return raidHandleDefeat();
    }

    const nextHero = players.findIndex((player, index) =>
        index > currentPlayerIdx && !player.dead
    );
    if (nextHero !== -1) {
        currentPlayerIdx = nextHero;
        if (typeof switchConfig === 'function') switchConfig(currentPlayerIdx);
        if (typeof updateHeroCard === 'function') updateHeroCard();
        return;
    }

    // Turno do boss
    window._raidTurnoRodando = true;
    try {
        await raidSleep(800);
        await raidTurnoBoss();
    } finally {
        window._raidTurnoRodando = false;
    }

    if (!players.some(p => !p.dead)) return raidHandleDefeat();
    if (raidGetBosses().every(b => b.dead)) return raidHandleBossDefeat();

    // Próximo turno dos heróis
    currentPlayerIdx = 0;
    while (currentPlayerIdx < players.length && players[currentPlayerIdx].dead) currentPlayerIdx++;
    if (currentPlayerIdx < players.length && typeof switchConfig === 'function') switchConfig(currentPlayerIdx);

    // Reseta "perdeProximoTurno"
    players.forEach(p => { if (p.perdeProximoTurno) p.perdeProximoTurno = false; });

    if (typeof updateAllSpriteDirections === 'function') updateAllSpriteDirections();
    if (typeof updateHeroCard === 'function') updateHeroCard();
    if (typeof raidAtualizarBossCard === 'function') raidAtualizarBossCard();
}

function raidAtualizarBossCard() {
    if (!window._raidMode) return;
    const cfg = raidGetConfig(window.raidAtual);
    if (!cfg) return;

    const name = document.getElementById('bossCardName');
    const hp = document.getElementById('bossCardHp');
    const sprite = document.getElementById('bossCardSprite');
    if (sprite) sprite.style.display = 'none';
    if (name) name.textContent = cfg.nome;
    if (hp) {
        const bs = raidGetBosses().filter(b => !b.dead);
        const hpTotal = bs.reduce((s, b) => s + b.hp, 0);
        const hpMax = bs.reduce((s, b) => s + b.maxHp, 0);
        const suf = bs.length > 1 ? ` (${bs.length} metades)` : '';
        hp.innerHTML = `HP: <b>${hpTotal}</b> / ${hpMax}${suf}`;
    }
}

// =================================================================
// 3. FINALIZAR PARTIDA (solo)
// =================================================================
async function raidHandleBossDefeat() {
    if (window._raidFinalizando) return;
    window._raidFinalizando = true;

    const cfg = raidGetConfig(window.raidAtual);
    if (typeof addLog === 'function') addLog(`${raidEmoji(window.raidAtual)} ${cfg?.nome} derrotado!`);

    if (cfg) raidCreditarRecompensa(cfg.recompensaXP, cfg.recompensaOuro);
    window._regionalRaidWonEquipment = null;
    window._regionalRaidKnowledgeResult = null;
    if (window._regionalRaidContext && cfg
        && typeof window.onRegionalRaidVictory === 'function') {
        window._regionalRaidWonEquipment = window.onRegionalRaidVictory(cfg);
    }
    if (window._regionalRaidContext && cfg
        && typeof window.registrarConhecimentoRaid === 'function') {
        window._regionalRaidKnowledgeResult = window.registrarConhecimentoRaid(cfg.id);
    }
    if (window._regionalRaidContext && cfg && coopRole !== 'oponente'
        && typeof window.registrarRegionalRaidVictory === 'function') {
        window.registrarRegionalRaidVictory(cfg.id, STORY_PROGRESS.raidAttempts?.[cfg.id]?.difficulty
            || window._regionalRaidDifficulty || 'normal');
    }

    const drops = []
    if (cfg) {
        if (cfg.fragmentoComum) {
            const qtd = 1 + Math.floor(Math.random() * 3);
            drops.push({ id: cfg.fragmentoComum, qty: qtd });
            if (typeof addMaterial === 'function') addMaterial(cfg.fragmentoComum, qtd);
        }
        if (cfg.fragmentoRaro && Math.random() < 0.30) {
            drops.push({ id: cfg.fragmentoRaro, qty: 1 });
            if (typeof addMaterial === 'function') addMaterial(cfg.fragmentoRaro, 1);
        }
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
    }

    if (typeof showPurificacao === 'function') {
        try { await showPurificacao(boss.type, boss.x, boss.y, true); } catch (e) {}
    }

    raidMostrarTelaFinal(true, cfg, drops);
}

function raidHandleDefeat() {
    if (window._raidFinalizando) return;
    window._raidFinalizando = true;
    raidMostrarTelaFinal(false, raidGetConfig(window.raidAtual));
}

function raidMostrarTelaFinal(vitoria, cfg, drops) {
    const overlay = document.getElementById('gameOverlay');
    if (!overlay) {
        uiAviso(vitoria ? '🏆 VITÓRIA!' : '💀 DERROTA');
        return;
    }

    let dropsHTML = '';
    if (drops && drops.length > 0) {
        dropsHTML = '<div class="victory-stats">';
        drops.forEach(d => {
            const m = raidGetMaterial(d.id);
            if (!m) return;
            dropsHTML += `
                <div class="victory-stat">
                    <div class="victory-stat-value">${raidIcon(d.id, 'large')} ×${d.qty}</div>
                    <div class="victory-stat-label">${m.nome}</div>
                </div>`;
        });
        dropsHTML += '</div>';
    }
    const equipment = window._regionalRaidWonEquipment;
    const equipmentHTML = equipment
        ? `<div class="victory-lore">${equipment.emoji} <b>${equipment.nome}</b> caiu como recompensa rara e foi para a Tesouraria.</div>`
        : '';
    const knowledge = vitoria && window._regionalRaidKnowledgeResult;
    const knowledgeHTML = knowledge
        ? `<div class="victory-lore">📖 Conhecimento do chefe: nível ${knowledge.nivel}${knowledge.nivel === 3 ? ' · DOMINADO' : ''}${knowledge.mudou ? ' (novo)' : ''}. Consulte o Bestiário.</div>`
        : '';

    overlay.innerHTML = `
        <div class="victory-panel ${!vitoria ? 'defeat' : ''}">
            <div class="victory-scroll-top">
                <h1 class="victory-title ${!vitoria ? 'defeat' : ''}">
                    ${vitoria ? '🏆' : '💀'} ${vitoria ? 'RAID CONCLUÍDO' : 'DERROTA NO RAID'}
                </h1>
            </div>
            <div class="victory-body">
                <div class="victory-boss-image-wrap">
                    <div class="victory-boss-halo"></div>
                    ${raidIcon(window.raidAtual, 'large')}
                </div>
                <div class="victory-boss-name">${cfg?.nome || 'Raid'}</div>
                <div class="victory-boss-subtitle">${cfg?.titulo || ''}</div>
                ${dropsHTML}
                ${equipmentHTML}
                ${knowledgeHTML}
                ${vitoria
                    ? `<div class="victory-lore">Recompensa: +${cfg?.recompensaXP || 0} XP e +${cfg?.recompensaOuro || 0} ouro.</div>`
                    : `<div class="victory-lore">Custo de entrada perdido: ${cfg?.custoEntrada || 0} ouro.</div>`}
                <div class="victory-actions">
                    <button class="victory-btn" id="raidVoltarBtn">${window._regionalRaidContext ? '🌎 VOLTAR A EVENTOS' : '🏠 VOLTAR À ALDEIA'}</button>
                </div>
            </div>
        </div>
    `;
    overlay.classList.add('active');
    overlay.style.display = 'flex';

    document.getElementById('raidVoltarBtn').onclick = () => {
        const returnToEvents = window._regionalRaidContext;
        window._regionalRaidContext = false;
        window._regionalRaidWonEquipment = null;
        window._regionalRaidKnowledgeResult = null;
        overlay.classList.remove('active');
        overlay.style.display = 'none';
        overlay.innerHTML = '';
        raidLimparEstado();
        _raidSoloHooksInstalados = false;
        document.removeEventListener('click', raidOnTileClickCapture, true);
        document.removeEventListener('click', raidOnPlayClickCapture, true);
        document.removeEventListener('click', raidOnSkillClickCapture, true);
        // Remove elementos de UI
        ['raidBadge', 'raidBanner', 'raidResumo'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
        document.querySelectorAll('.raid-sair-btn, .raid-salas-btn').forEach(el => el.remove());
        const gs = document.getElementById('gameScreen');
        if (gs) { gs.classList.remove('active'); gs.style.display = 'none'; }
        if (typeof showStoryScreen === 'function') {
            showStoryScreen();
            setTimeout(() => {
                if (returnToEvents && typeof window.renderEventoSemanalScreen === 'function') {
                    window.renderEventoSemanalScreen();
                } else if (typeof renderAldeiaScreen === 'function') {
                    renderAldeiaScreen();
                }
            }, 100);
        }
    };

    if (typeof playSfx === 'function') playSfx(vitoria ? 'win' : 'gameover');
}
window.raidMostrarTelaFinal = raidMostrarTelaFinal;

// =================================================================
// 4. UI DO RAID (durante a batalha)
// =================================================================
function raidInjetarUI() {
    // Badge
    const header = document.querySelector('.game-title');
    if (header && !header.querySelector('#raidBadge')) {
        const badge = document.createElement('span');
        badge.className = 'raid-badge';
        badge.id = 'raidBadge';
        badge.textContent = '⚔️ RAID';
        header.appendChild(badge);
    }

    // Botão sair
    const acoes = document.querySelector('.game-header-actions');
    if (acoes && !coopRole && !raidRole && !acoes.querySelector('.raid-sair-btn')) {
        const btn = document.createElement('button');
        btn.className = 'raid-sair-btn';
        btn.innerHTML = '🚪 SAIR';
        btn.onclick = async () => {
            if (await uiConfirm('Sair da raid?')) {
                const returnToEvents = window._regionalRaidContext;
                window._regionalRaidContext = false;
                raidLimparEstado();
                _raidSoloHooksInstalados = false;
                document.removeEventListener('click', raidOnTileClickCapture, true);
                document.removeEventListener('click', raidOnPlayClickCapture, true);
                document.removeEventListener('click', raidOnSkillClickCapture, true);
                ['raidBadge', 'raidBanner', 'raidResumo'].forEach(id => {
                    const el = document.getElementById(id); if (el) el.remove();
                });
                document.querySelectorAll('.raid-sair-btn, .raid-salas-btn').forEach(el => el.remove());
                const gs = document.getElementById('gameScreen');
                if (gs) { gs.classList.remove('active'); gs.style.display = 'none'; }
                if (typeof showStoryScreen === 'function') {
                    showStoryScreen();
                    setTimeout(() => {
                        if (returnToEvents && typeof window.renderEventoSemanalScreen === 'function') {
                            window.renderEventoSemanalScreen();
                        } else if (typeof renderAldeiaScreen === 'function') {
                            renderAldeiaScreen();
                        }
                    }, 100);
                }
            }
        };
        acoes.insertBefore(btn, acoes.firstChild);
    }

    // Banner
    const main = document.querySelector('.game-main');
    if (main && !document.getElementById('raidBanner')) {
        const banner = document.createElement('div');
        banner.id = 'raidBanner';
        banner.className = 'raid-banner active';
        const cfg = raidGetConfig(window.raidAtual);
        banner.innerHTML = `
            <span class="raid-banner-icon">⚔️</span>
            <span class="raid-banner-text">${cfg?.nome || ''}</span>
            <span class="raid-banner-hint">${cfg?.titulo || ''}</span>
        `;
        main.parentNode.insertBefore(banner, main);
    }

    raidAtualizarBossCard();
}

// =================================================================
// 5. TELA DE SELEÇÃO
// =================================================================
function raidAbrirTelaSelecao() {
    const screen = document.getElementById('storyScreen');
    if (!screen) return;

    const gold = (typeof STORY_PROGRESS !== 'undefined') ? (STORY_PROGRESS.gold || 0) : 0;
    const raids = raidListAll();

    let cardsHTML = '';
    raids.forEach((cfg, idx) => {
        const desbloqueada = raidIsDesbloqueada(cfg.id);
        const motivo = raidMotivoBloqueio(cfg.id);
        const podeEntrar = desbloqueada && gold >= cfg.custoEntrada;

        const elemCor = { FOGO:'#e74c3c', AGUA:'#3498db', TERRA:'#27ae60',
                          AR:'#f1c40f', 'VARIÁVEL':'#8e44ad' }[cfg.elemento] || '#c9a227';

        cardsHTML += `
            <div class="raid-card ${desbloqueada ? 'unlocked' : 'locked'}" style="--raid-elem-color:${elemCor};">
                <div class="raid-card-header">
                    <div class="raid-card-num">RAID ${idx + 1}</div>
                    <div class="raid-card-elem">${cfg.elemento}</div>
                </div>
                <div class="raid-card-sprite">${raidIcon(cfg.id, 'large')}</div>
                <div class="raid-card-name">${cfg.nome}</div>
                <div class="raid-card-title">${cfg.titulo}</div>
                <div class="raid-card-desc">${cfg.descricao}</div>
                <div class="raid-card-stats">
                    <div class="raid-stat"><span class="raid-stat-label">HP</span><span class="raid-stat-value">${cfg.hp}</span></div>
                    <div class="raid-stat"><span class="raid-stat-label">ATK</span><span class="raid-stat-value">${cfg.atk}</span></div>
                    <div class="raid-stat"><span class="raid-stat-label">Custo</span><span class="raid-stat-value">💰 ${cfg.custoEntrada}</span></div>
                    <div class="raid-stat"><span class="raid-stat-label">Prêmio</span><span class="raid-stat-value">💰 ${cfg.recompensaOuro}</span></div>
                </div>
                <div class="raid-card-actions">
                    ${desbloqueada ? `
                        <button class="raid-btn solo" ${podeEntrar ? '' : 'disabled'} onclick="raidAbrirModalEntrada('${cfg.id}', 'solo')">⚔️ SOLO</button>
                        <button class="raid-btn coop" ${podeEntrar ? '' : 'disabled'} onclick="raidAbrirModalEntrada('${cfg.id}', 'coop')">🎮 COOP</button>
                    ` : `<div class="raid-locked-msg">🔒 ${motivo || 'Bloqueada'}</div>`}
                </div>
            </div>
        `;
    });

    screen.innerHTML = `
        <div class="story-container">
            <div class="story-header">
                <h1 class="story-title">⚔️ MODO RAID</h1>
                <p class="story-subtitle">Enfrente os 8 bosses colossais.</p>
                <div style="text-align:center;margin-top:10px;">
                    <span class="story-stars-counter" style="background:rgba(58,42,24,.9);border:1px solid #6a5024;padding:8px 14px;border-radius:20px;font-family:'Cinzel',serif;font-weight:700;color:#e8b923;">💰 ${gold} ouro</span>
                </div>
            </div>
            <div class="raid-grid-selecao">${cardsHTML}</div>
            <div class="story-footer">
                <button class="story-back-btn" onclick="renderAldeiaScreen()">← VOLTAR À ALDEIA</button>
                <button class="story-back-btn" onclick="raidAbrirTelaForja()" style="margin-left:10px;">🛠️ FORJA</button>
            </div>
        </div>
    `;
    screen.classList.add('active');
    screen.style.display = 'flex';
}

// =================================================================
// 6. TELA DE FORJA
// =================================================================
function raidAbrirTelaForja() {
    const screen = document.getElementById('storyScreen');
    if (!screen) return;

    const gold = STORY_PROGRESS.gold || 0;
    const inv = STORY_PROGRESS.inventory || {};
    if (!Array.isArray(STORY_PROGRESS.raidArmasForjadas)) STORY_PROGRESS.raidArmasForjadas = [];

    const armas = Object.values(RAID_ARMAS);

    let cardsHTML = '';
    armas.forEach(arma => {
        const forjada = STORY_PROGRESS.raidArmasForjadas.includes(arma.id);
        const pode = raidPodeForjar(arma, inv, gold);
        const elemCor = { FOGO:'#e74c3c', AGUA:'#3498db', TERRA:'#27ae60',
                          AR:'#f1c40f', 'ANY':'#8e44ad' }[arma.elemento] || '#c9a227';

        const recHTML = Object.entries(arma.receita).map(([mid, qty]) => {
            const m = raidGetMaterial(mid);
            if (!m) return '';
            const tem = inv[mid] || 0;
            return `<span class="raid-forja-mat ${tem >= qty ? 'ok' : 'no'}">${raidIcon(mid, 'small')} ${tem}/${qty}</span>`;
        }).join('');

        cardsHTML += `
            <div class="raid-forja-card ${forjada ? 'forjada' : ''}" style="--arma-elem-color:${elemCor};">
                <div class="raid-forja-header">
                    <div class="raid-forja-icon">${raidIcon(arma.id, 'large')}</div>
                    <div class="raid-forja-info">
                        <div class="raid-forja-nome">${arma.nome}</div>
                        <div class="raid-forja-tipo">${arma.tipo.toUpperCase()} · ${arma.elemento}</div>
                        <div class="raid-forja-raid">${raidGetConfig(arma.raid)?.nome || arma.raid}</div>
                    </div>
                </div>
                <div class="raid-forja-stats">
                    <div class="raid-forja-stat"><span>ATK</span><b>+${arma.atkBonus}</b></div>
                    <div class="raid-forja-stat"><span>ELEM</span><b>+${arma.elementoBonus}</b></div>
                </div>
                <div class="raid-forja-receita">${recHTML}</div>
                <div class="raid-forja-custo">💰 ${arma.custoOuro}</div>
                <div class="raid-forja-action">
                    ${forjada
                        ? '<div class="raid-forja-tag">✅ FORJADA</div>'
                        : `<button class="raid-forja-btn" ${pode ? '' : 'disabled'} onclick="raidForjarArma('${arma.id}')">${pode ? '🔨 FORJAR' : '✕ SEM RECURSOS'}</button>`}
                </div>
            </div>
        `;
    });

    screen.innerHTML = `
        <div class="story-container">
            <div class="story-header">
                <h1 class="story-title">🛠️ FORJA DE RAID</h1>
                <p class="story-subtitle">Forje as 24 armas lendárias.</p>
                <div style="text-align:center;margin-top:10px;">
                    <span class="story-stars-counter" style="background:rgba(58,42,24,.9);border:1px solid #6a5024;padding:8px 14px;border-radius:20px;font-family:'Cinzel',serif;font-weight:700;color:#e8b923;">💰 ${gold} ouro</span>
                </div>
            </div>
            <div class="raid-forja-grid">${cardsHTML}</div>
            <div class="story-footer">
                <button class="story-back-btn" onclick="raidAbrirTelaSelecao()">← VOLTAR ÀS RAIDS</button>
            </div>
        </div>
    `;
    screen.classList.add('active');
    screen.style.display = 'flex';
}

function raidPodeForjar(arma, inv, gold) {
    if (gold < arma.custoOuro) return false;
    for (const [mid, qty] of Object.entries(arma.receita)) if ((inv[mid] || 0) < qty) return false;
    return true;
}

async function raidForjarArma(armaId) {
    const arma = raidGetArma(armaId);
    if (!arma) return;
    if (!Array.isArray(STORY_PROGRESS.raidArmasForjadas)) STORY_PROGRESS.raidArmasForjadas = [];
    if (STORY_PROGRESS.raidArmasForjadas.includes(armaId)) { uiAviso('Você já forjou.'); return; }
    if ((STORY_PROGRESS.gold || 0) < arma.custoOuro) { uiAviso('Ouro insuficiente.'); return; }
    for (const [mid, qty] of Object.entries(arma.receita)) {
        if ((STORY_PROGRESS.inventory[mid] || 0) < qty) { uiAviso('Materiais insuficientes.'); return; }
    }
    if (!(await uiConfirm(`Forjar ${arma.nome}?`))) return;

    STORY_PROGRESS.gold -= arma.custoOuro;
    for (const [mid, qty] of Object.entries(arma.receita)) {
        STORY_PROGRESS.inventory[mid] -= qty;
        if (STORY_PROGRESS.inventory[mid] <= 0) delete STORY_PROGRESS.inventory[mid];
    }
    STORY_PROGRESS.raidArmasForjadas.push(armaId);
    if (typeof saveStoryProgress === 'function') saveStoryProgress();
    if (typeof showToast === 'function') showToast('🔨 Arma forjada!', arma.nome, '🔨');
    if (typeof playSfx === 'function') playSfx('win');
    raidAbrirTelaForja();
}

// =================================================================
// 7. BOTÃO RAID NA ALDEIA (MutationObserver)
// =================================================================
(function raidAldeiaObserver() {
    const obs = new MutationObserver(() => {
        const ss = document.getElementById('storyScreen');
        if (!ss || !ss.classList.contains('active') || ss.style.display === 'none') return;
        if (!document.querySelector('.story-ald-grid')) return;

        const gridEl = document.querySelector('.story-ald-grid');
        if (gridEl && !gridEl.querySelector('.raid-aldeia-card')) {
            const card = document.createElement('div');
            card.className = 'story-ald-location raid-aldeia-card';
            card.onclick = () => raidAbrirTelaSelecao();
            card.innerHTML = `
                <div class="story-ald-loc-icon">⚔️</div>
                <div class="story-ald-loc-info">
                    <div class="story-ald-loc-name">RAID</div>
                    <div class="story-ald-loc-desc">Enfrente os 8 bosses colossais</div>
                </div>
            `;
            gridEl.insertBefore(card, gridEl.firstChild);
        }

        const footer = document.querySelector('.story-ald-footer');
        if (footer && !footer.querySelector('.raid-forja-footer-btn')) {
            const btn = document.createElement('button');
            btn.className = 'story-back-btn raid-forja-footer-btn';
            btn.style.marginLeft = '10px';
            btn.innerHTML = '🛠️ FORJA DE RAID';
            btn.onclick = () => raidAbrirTelaForja();
            footer.appendChild(btn);
        }
    });
    obs.observe(document.body, { childList: true, subtree: true });
})();

// =================================================================
// 8. CSS
// =================================================================
(function raidCSS() {
    if (document.getElementById('raidStyle')) return;
    const style = document.createElement('style');
    style.id = 'raidStyle';
    style.textContent = `
        .raid-icon { width:1em; height:1em; object-fit:contain; vertical-align:-0.15em; display:inline-block; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6)); }
        .raid-icon-small { width:0.85em; height:0.85em; }
        .raid-icon-large { width:2.5em; height:2.5em; }
        .raid-emoji { display:inline-block; line-height:1; text-shadow:0 2px 4px rgba(0,0,0,0.6); }
        .raid-emoji-small { font-size:0.85em; }
        .raid-emoji-large { font-size:2.5em; }
        .tile.raid-danger-telegraph {
            z-index: 18;
            background-color: rgba(255, 58, 24, .24) !important;
            background-blend-mode: screen;
            border: 2px solid rgba(255, 235, 155, .92) !important;
            outline: 1px solid rgba(255, 54, 35, .72);
            box-shadow: inset 0 0 0 2px rgba(255, 255, 255, .16), 0 0 10px rgba(255, 72, 26, .72) !important;
            animation: raidDangerPulse .58s ease-in-out infinite alternate;
        }
        .tile.raid-danger-telegraph::after {
            content: '!';
            position: absolute;
            top: 2px;
            right: 2px;
            width: 14px;
            height: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            color: #fff8df;
            background: rgba(118, 18, 8, .78);
            font: 900 11px/1 Arial, sans-serif;
            text-shadow: 0 1px 3px #4a0800;
            pointer-events: none;
        }
        #grid.raid-skill-impact { animation: raidGridImpact .42s ease-out; }
        @keyframes raidDangerPulse {
            from { filter: brightness(.96) saturate(1.08); }
            to { filter: brightness(1.12) saturate(1.3); }
        }
        @keyframes raidGridImpact {
            0% { transform: translate(0, 0); filter: brightness(1); }
            20% { transform: translate(-4px, 2px); filter: brightness(1.65); }
            45% { transform: translate(4px, -2px); }
            70% { transform: translate(-2px, -1px); }
            100% { transform: translate(0, 0); filter: brightness(1); }
        }

        .raid-aldeia-card { border-color:#e67e22!important; background:linear-gradient(180deg,rgba(230,126,34,0.12),transparent 40%),linear-gradient(180deg,rgba(42,31,16,0.95),rgba(26,18,8,0.95))!important; }
        .raid-aldeia-card:hover { border-color:#f39c12!important; box-shadow:0 8px 25px rgba(0,0,0,0.5),0 0 30px rgba(230,126,34,0.4)!important; }
        .raid-forja-footer-btn { border-color:#e67e22!important; color:#f39c12!important; }

        .raid-grid-selecao { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:22px; margin-bottom:30px; }
        .raid-card { position:relative; background:linear-gradient(180deg,rgba(201,162,39,.05),transparent 40%),linear-gradient(180deg,rgba(42,31,16,.95),rgba(26,18,8,.95)); border:2px solid #3d2d18; border-radius:10px; padding:18px 16px; display:flex; flex-direction:column; gap:12px; transition:all 0.3s; overflow:hidden; }
        .raid-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--raid-elem-color,#c9a227); box-shadow:0 0 12px var(--raid-elem-color,#c9a227); opacity:0.8; }
        .raid-card.unlocked:hover { transform:translateY(-4px); border-color:var(--raid-elem-color,#c9a227); box-shadow:0 10px 25px rgba(0,0,0,0.5),0 0 30px color-mix(in srgb,var(--raid-elem-color,#c9a227) 40%,transparent); }
        .raid-card.locked { opacity:0.6; }
        .raid-card-header { display:flex; justify-content:space-between; align-items:center; font-family:'Cinzel',serif; font-size:0.75rem; letter-spacing:1.5px; }
        .raid-card-num { color:var(--raid-elem-color,#c9a227); font-weight:700; }
        .raid-card-elem { padding:3px 10px; background:rgba(10,6,2,0.5); border:1px solid var(--raid-elem-color,#c9a227); border-radius:12px; color:var(--raid-elem-color,#c9a227); font-weight:700; font-size:0.7rem; }
        .raid-card-sprite { text-align:center; padding:12px 0; filter:drop-shadow(0 0 15px var(--raid-elem-color,#c9a227)); line-height:1; }
        .raid-card-name { font-family:'Cinzel Decorative',serif; color:#f0e2c0; font-size:1.25rem; text-align:center; letter-spacing:1.5px; text-shadow:0 2px 6px rgba(0,0,0,0.8); }
        .raid-card-title { font-family:'EB Garamond',serif; color:var(--raid-elem-color,#c9a227); font-size:0.9rem; text-align:center; font-style:italic; margin-top:-8px; }
        .raid-card-desc { font-family:'EB Garamond',serif; color:#b8a577; font-size:0.85rem; line-height:1.4; font-style:italic; text-align:center; padding:0 6px; flex-grow:1; }
        .raid-card-stats { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; padding:10px; background:rgba(10,6,2,0.5); border-radius:6px; border:1px solid rgba(201,162,39,0.2); }
        .raid-stat { display:flex; flex-direction:column; align-items:center; gap:2px; }
        .raid-stat-label { font-family:'Cinzel',serif; color:#8a7a52; font-size:0.65rem; letter-spacing:1px; text-transform:uppercase; }
        .raid-stat-value { font-family:'Cinzel',serif; color:#e8b923; font-weight:700; font-size:0.95rem; }
        .raid-card-actions { display:flex; gap:8px; margin-top:auto; }
        .raid-btn { flex:1; padding:10px 8px; border-radius:5px; cursor:pointer; font-family:'Cinzel',serif; font-weight:700; font-size:0.85rem; letter-spacing:1px; transition:all 0.2s; border:2px solid transparent; }
        .raid-btn.solo { background:linear-gradient(180deg,rgba(232,185,35,0.2),transparent 45%),linear-gradient(135deg,#8a6a2e,#4a3418); color:#fff5dc; border-color:#e8b923; }
        .raid-btn.coop { background:linear-gradient(180deg,rgba(230,126,34,0.25),transparent 45%),linear-gradient(135deg,#d35400,#7a4a1a); color:#fff5dc; border-color:#e67e22; }
        .raid-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,0.5); }
        .raid-btn:disabled { background:#2a1f10; color:#6a5024; border-color:#3d2d18; cursor:not-allowed; opacity:0.7; }
        .raid-locked-msg { width:100%; padding:12px; text-align:center; font-family:'EB Garamond',serif; font-size:0.85rem; color:#d09060; font-style:italic; background:rgba(10,6,2,0.5); border:1px dashed rgba(208,144,96,0.5); border-radius:6px; }

        .raid-modal-overlay { position:fixed; inset:0; background:rgba(10,6,2,0.95); z-index:21000; display:flex; align-items:center; justify-content:center; padding:20px; overflow-y:auto; }
        .raid-modal-panel { background:radial-gradient(circle at top,rgba(230,126,34,0.12),transparent 50%),linear-gradient(180deg,#2a1f10,#1a1208); border:3px solid #e67e22; border-radius:12px; max-width:500px; width:100%; box-shadow:0 20px 60px rgba(0,0,0,0.9),0 0 80px rgba(230,126,34,0.3); overflow:hidden; }
        .raid-modal-header { display:flex; justify-content:space-between; align-items:center; padding:16px 22px; background:linear-gradient(180deg,rgba(230,126,34,0.2),transparent 60%); border-bottom:2px solid rgba(230,126,34,0.4); }
        .raid-modal-header h2 { font-family:'Cinzel Decorative',serif; color:#f39c12; font-size:1.2rem; letter-spacing:2px; margin:0; }
        .raid-modal-close { padding:6px 14px; background:linear-gradient(135deg,#6a2020,#3a1010); color:#f5c8c8; border:1px solid #a83232; border-radius:4px; cursor:pointer; font-family:'Cinzel',serif; font-weight:700; font-size:0.75rem; }
        .raid-modal-boss-preview { display:flex; align-items:center; gap:14px; padding:18px 22px; background:rgba(10,6,2,0.5); border-bottom:1px solid rgba(230,126,34,0.2); }
        .raid-modal-boss-sprite { line-height:1; filter:drop-shadow(0 0 15px rgba(230,126,34,0.7)); }
        .raid-modal-boss-name { font-family:'Cinzel Decorative',serif; color:#f0e2c0; font-size:1.15rem; letter-spacing:1.5px; margin-bottom:3px; }
        .raid-modal-boss-title { font-family:'EB Garamond',serif; color:#b8a577; font-size:0.85rem; font-style:italic; margin-bottom:6px; }
        .raid-modal-boss-elem { display:inline-block; padding:3px 10px; background:rgba(230,126,34,0.15); border:1px solid rgba(230,126,34,0.5); border-radius:12px; color:#f39c12; font-family:'Cinzel',serif; font-size:0.7rem; font-weight:700; }
        .raid-modal-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; padding:16px 22px; border-bottom:1px solid rgba(230,126,34,0.15); }
        .raid-modal-stat { text-align:center; padding:8px; background:rgba(10,6,2,0.4); border-radius:5px; }
        .raid-modal-stat-label { font-family:'Cinzel',serif; color:#8a7a52; font-size:0.65rem; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px; }
        .raid-modal-stat-value { font-family:'Cinzel',serif; color:#e8b923; font-weight:700; font-size:1rem; }
        .raid-modal-hero { padding:14px 22px; background:rgba(230,126,34,0.08); border-bottom:1px solid rgba(230,126,34,0.15); }
        .raid-modal-hero-label { font-family:'Cinzel',serif; color:#8a7a52; font-size:0.7rem; letter-spacing:2px; text-transform:uppercase; margin-bottom:4px; }
        .raid-modal-hero-name { font-family:'Cinzel Decorative',serif; color:#f0e2c0; font-size:1.1rem; }
        .raid-modal-aviso { padding:14px 22px; font-family:'EB Garamond',serif; color:#d09060; font-size:0.9rem; font-style:italic; line-height:1.45; text-align:center; background:rgba(230,126,34,0.08); }
        .raid-modal-actions { display:flex; gap:12px; padding:18px 22px; }
        .raid-modal-btn { flex:1; padding:12px 16px; border-radius:6px; cursor:pointer; font-family:'Cinzel',serif; font-weight:700; font-size:0.9rem; letter-spacing:1.5px; transition:all 0.2s; border:2px solid transparent; }
        .raid-modal-btn.cancelar { background:linear-gradient(135deg,#3d2d18,#2a1f10); color:#c8b787; border-color:#6a5024; }
        .raid-modal-btn.confirmar { background:linear-gradient(180deg,rgba(230,126,34,0.25),transparent 45%),linear-gradient(135deg,#d35400,#7a4a1a); color:#fff5dc; border-color:#e67e22; }
        .raid-modal-btn.confirmar:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.6),0 0 25px rgba(230,126,34,0.6); }

        .raid-forja-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:16px; margin-bottom:30px; }
        .raid-forja-card { position:relative; background:linear-gradient(180deg,rgba(201,162,39,.05),transparent 40%),linear-gradient(180deg,rgba(42,31,16,.95),rgba(26,18,8,.95)); border:2px solid #3d2d18; border-radius:8px; padding:14px; display:flex; flex-direction:column; gap:10px; }
        .raid-forja-card::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--arma-elem-color,#c9a227); opacity:0.8; border-radius:8px 8px 0 0; }
        .raid-forja-card:hover { border-color:var(--arma-elem-color,#c9a227); transform:translateY(-3px); box-shadow:0 8px 20px rgba(0,0,0,0.5); }
        .raid-forja-card.forjada { border-color:#4a7040; }
        .raid-forja-header { display:flex; align-items:center; gap:10px; }
        .raid-forja-icon { line-height:1; filter:drop-shadow(0 0 8px var(--arma-elem-color,#c9a227)); }
        .raid-forja-nome { font-family:'Cinzel',serif; color:#f0e2c0; font-size:0.95rem; font-weight:700; margin-bottom:3px; }
        .raid-forja-tipo { font-family:'Cinzel',serif; color:var(--arma-elem-color,#c9a227); font-size:0.7rem; letter-spacing:1px; font-weight:700; margin-bottom:2px; }
        .raid-forja-raid { font-family:'EB Garamond',serif; color:#8a7a52; font-size:0.75rem; font-style:italic; }
        .raid-forja-stats { display:flex; justify-content:space-around; padding:6px 0; border-top:1px solid rgba(201,162,39,0.15); border-bottom:1px solid rgba(201,162,39,0.15); }
        .raid-forja-stat { display:flex; align-items:center; gap:6px; font-family:'Cinzel',serif; font-size:0.85rem; }
        .raid-forja-stat span { color:#8a7a52; font-size:0.7rem; letter-spacing:1px; }
        .raid-forja-stat b { color:#8ac070; }
        .raid-forja-receita { display:flex; flex-wrap:wrap; gap:6px; }
        .raid-forja-mat { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; font-family:'EB Garamond',serif; font-size:0.78rem; background:rgba(10,6,2,0.5); border-radius:12px; }
        .raid-forja-mat.ok { color:#8ac070; border:1px solid rgba(107,163,92,0.5); }
        .raid-forja-mat.no { color:#d05050; border:1px solid rgba(168,50,50,0.5); }
        .raid-forja-custo { text-align:center; font-family:'Cinzel',serif; color:#e8b923; font-size:0.9rem; font-weight:700; padding:4px; }
        .raid-forja-btn { width:100%; padding:10px; background:linear-gradient(180deg,rgba(232,185,35,0.25),transparent 45%),linear-gradient(135deg,#8a6a2e,#4a3418); color:#fff5dc; border:2px solid #e8b923; border-radius:5px; cursor:pointer; font-family:'Cinzel',serif; font-weight:700; font-size:0.85rem; letter-spacing:1.5px; }
        .raid-forja-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,0.5),0 0 20px rgba(232,185,35,0.4); }
        .raid-forja-btn:disabled { background:#2a1f10; color:#6a5024; border-color:#3d2d18; cursor:not-allowed; }
        .raid-forja-tag { text-align:center; font-family:'Cinzel',serif; color:#8ac070; font-size:0.85rem; padding:10px; background:rgba(107,163,92,0.1); border:1px solid rgba(107,163,92,0.4); border-radius:5px; }

        .raid-badge { display:inline-flex; align-items:center; gap:4px; padding:4px 12px; background:linear-gradient(180deg,rgba(230,126,34,0.2),transparent 60%),rgba(10,6,2,0.6); border:1px solid #e67e22; border-radius:12px; font-family:'Cinzel',serif; font-weight:700; font-size:0.72rem; letter-spacing:1.5px; color:#f39c12; margin-left:8px; }
        .raid-sair-btn { padding:8px 14px; background:linear-gradient(135deg,#6a2020,#3a1010); color:#f5c8c8; border:1px solid #a83232; border-radius:4px; cursor:pointer; font-family:'Cinzel',serif; font-weight:700; font-size:0.8rem; letter-spacing:1px; }
        .raid-banner { display:flex; align-items:center; justify-content:center; gap:12px; padding:12px 20px; margin:0 15px 10px; background:linear-gradient(180deg,rgba(230,126,34,0.15),transparent 60%),linear-gradient(135deg,rgba(74,52,24,0.9),rgba(42,31,16,0.9)); border:2px solid #e67e22; border-radius:8px; font-family:'Cinzel',serif; color:#e8dcc4; box-shadow:0 4px 15px rgba(0,0,0,0.5); }
        .raid-banner.active { background:linear-gradient(180deg,rgba(107,163,92,0.2),transparent 60%),linear-gradient(135deg,rgba(42,69,32,0.9),rgba(26,47,20,0.9)); border-color:#6ba35c; }
        .raid-banner-icon { font-size:1.5rem; }
        .raid-banner-text { font-size:1rem; font-weight:900; letter-spacing:2px; }
        .raid-banner-hint { font-family:'EB Garamond',serif; font-size:0.8rem; font-style:italic; opacity:0.85; }

        .token.raid-boss-token { display:flex; align-items:center; justify-content:center; padding:0; z-index:15; }
        .token.raid-boss-token .raid-boss-sprite { width:100%; height:100%; display:flex; align-items:center; justify-content:center; filter:drop-shadow(0 0 12px rgba(230,126,34,0.7)); }
        .token.raid-boss-token .raid-boss-sprite img { width:100%; height:100%; object-fit:contain; }
        .token.raid-boss-token .raid-boss-sprite .raid-emoji-large { font-size:5rem; line-height:1; }
        .token.raid-boss-token .hp-container { position:absolute; top:-12px; width:80%; height:8px; }
        .token.raid-animal { z-index:12; }
        .token.raid-animal .raid-animal-emoji { font-size:2.2rem; line-height:1; filter:drop-shadow(0 0 6px rgba(76,175,80,0.8)); }
        .token.raid-raiz { z-index:11; pointer-events:none; }
        .token.raid-raiz .raid-raiz-emoji { font-size:2rem; line-height:1; filter:drop-shadow(0 0 8px rgba(76,175,80,0.9)); }
        .token.preso { filter:saturate(0.5) brightness(0.8) hue-rotate(80deg); }

        @media (max-width:700px) {
            .raid-grid-selecao, .raid-forja-grid { grid-template-columns:1fr; }
            .raid-modal-stats { grid-template-columns:repeat(2,1fr); }
            .raid-modal-panel { max-width:100%; }
        }
    `;
    document.head.appendChild(style);
})();

// =================================================================
// 9. GARANTIR CAMPOS NO SAVE
// =================================================================
(function raidGarantirSave() {
    if (typeof STORY_PROGRESS === 'undefined') return;
    let mudou = false;
    if (!Array.isArray(STORY_PROGRESS.raidArmasForjadas)) { STORY_PROGRESS.raidArmasForjadas = []; mudou = true; }
    if (mudou && typeof saveStoryProgress === 'function') saveStoryProgress();
})();

// =================================================================
// 10. EXPOR
// =================================================================
window.raidAbrirTelaSelecao = raidAbrirTelaSelecao;
window.raidAbrirModalEntrada = raidAbrirModalEntrada;
window.raidAbrirTelaForja = raidAbrirTelaForja;
window.raidForjarArma = raidForjarArma;
window.raidIcon = raidIcon;
window.raidEmoji = raidEmoji;
window.raidGetConfig = raidGetConfig;
window.raidApplySkill = raidApplySkill;
window.raidTurnoBoss = raidTurnoBoss;
window.raidCapturarEstadoCoop = raidCapturarEstadoCoop;
window.raidAplicarEstadoCoop = raidAplicarEstadoCoop;
window.raidLimparEstado = raidLimparEstado;
window.raidIniciarSoloViaCoop = raidIniciarSoloViaCoop;
window.RAID_SPRITES = RAID_SPRITES;
window.RAID_EMOJIS = RAID_EMOJIS;

console.log('✅ raid.js V5.0 — Bloco 5/5 (UI + CSS) carregado.');
console.log('⚔️ Modo RAID pronto. Aldeia → ⚔️ RAID');
// =================================================================
// raid.js — PATCH V5.1 (Fix do tokenBoss fantasma + IA)
// -----------------------------------------------------------------
// Corrige:
//   1. tokenBoss original (1×1) que ficava visível e "andando"
//   2. updateVisuals reposicionando o token fantasma
//   3. updateBossCard/updateHeaderBossName mostrando dados errados
//   4. IA do boss que rodava mesmo sem o raid estar 100% configurado
// =================================================================

(function raidPatchV51() {
    if (window._raidPatchV51) return;
    window._raidPatchV51 = true;

    console.log('🔧 [raid V5.1] Aplicando correções do token fantasma...');

    // ================================================================
    // FIX 1: Esconde o tokenBoss original ao entrar no raid
    // ================================================================
    const _origConfigurar = window.raidConfigurarBossGlobal;
    if (typeof _origConfigurar === 'function') {
        window.raidConfigurarBossGlobal = function(cfg) {
            const r = _origConfigurar.apply(this, arguments);

            // Esconde o token do boss ORIGINAL
            const tokOriginal = document.getElementById('tokenBoss');
            if (tokOriginal) {
                tokOriginal.style.display = 'none';
                tokOriginal.style.visibility = 'hidden';
                tokOriginal.style.pointerEvents = 'none';
            }

            return r;
        };
    }

    // ================================================================
    // FIX 2: Intercepta updateVisuals pra não mexer no tokenBoss
    //         durante a raid
    // ================================================================
    const _origUpdateVisuals = window.updateVisuals;
    if (typeof _origUpdateVisuals === 'function' && !window._raidV51UpdateVisuals) {
        window._raidV51UpdateVisuals = true;

        window.updateVisuals = function() {
            // Chama o original primeiro
            const r = _origUpdateVisuals.apply(this, arguments);

            // Se está em raid, garante que o tokenBoss original
            // continua escondido (o updateVisuals pode tê-lo reexibido)
            if (window._raidMode) {
                const tokOriginal = document.getElementById('tokenBoss');
                if (tokOriginal) {
                    tokOriginal.style.display = 'none';
                    tokOriginal.style.visibility = 'hidden';
                    tokOriginal.style.pointerEvents = 'none';
                }
            }

            return r;
        };

        console.log('[raid V5.1] updateVisuals interceptado.');
    }

    // ================================================================
    // FIX 3: Intercepta updateBossCard no modo raid
    // ================================================================
    const _origUpdateBossCard = window.updateBossCard;
    if (typeof _origUpdateBossCard === 'function' && !window._raidV51BossCard) {
        window._raidV51BossCard = true;

        window.updateBossCard = function() {
            // Em raid, usa nossa função customizada
            if (window._raidMode && typeof raidAtualizarBossCard === 'function') {
                return raidAtualizarBossCard();
            }
            return _origUpdateBossCard.apply(this, arguments);
        };

        console.log('[raid V5.1] updateBossCard interceptado.');
    }

    // ================================================================
    // FIX 4: Intercepta updateHeaderBossName no modo raid
    // ================================================================
    const _origUpdateHeader = window.updateHeaderBossName;
    if (typeof _origUpdateHeader === 'function' && !window._raidV51Header) {
        window._raidV51Header = true;

        window.updateHeaderBossName = function() {
            if (window._raidMode) {
                const cfg = raidGetConfig(window.raidAtual);
                const headerBoss = document.getElementById('headerBossName');
                if (headerBoss && cfg) {
                    headerBoss.textContent = `⚔️ ${cfg.nome}`;
                    headerBoss.style.display = 'inline-block';
                }
                return;
            }
            return _origUpdateHeader.apply(this, arguments);
        };

        console.log('[raid V5.1] updateHeaderBossName interceptado.');
    }

    // ================================================================
    // FIX 5: Intercepta updateAllSpriteDirections pra não flipar
    //         o token fantasma
    // ================================================================
    const _origUpdateDirections = window.updateAllSpriteDirections;
    if (typeof _origUpdateDirections === 'function' && !window._raidV51Directions) {
        window._raidV51Directions = true;

        window.updateAllSpriteDirections = function() {
            const r = _origUpdateDirections.apply(this, arguments);
            if (window._raidMode) {
                const tokOriginal = document.getElementById('tokenBoss');
                if (tokOriginal) tokOriginal.style.display = 'none';
            }
            return r;
        };
    }

    // ================================================================
    // FIX 6: Guard no raidTurnoBoss — verifica se está tudo pronto
    // ================================================================
    const _origTurnoBoss = window.raidTurnoBoss;
    if (typeof _origTurnoBoss === 'function' && !window._raidV51Turno) {
        window._raidV51Turno = true;

        window.raidTurnoBoss = async function() {
            // Guards
            if (!window._raidMode) {
                console.warn('[raid V5.1] raidTurnoBoss abortado: não está em raid.');
                return;
            }
            if (!window.raidAtual) {
                console.warn('[raid V5.1] raidTurnoBoss abortado: raidAtual nulo.');
                return;
            }
            if (!window.raidBosses || window.raidBosses.length === 0) {
                console.warn('[raid V5.1] raidTurnoBoss abortado: sem bosses.');
                return;
            }
            if (typeof window._endGameShowing !== 'undefined' && window._endGameShowing) {
                console.warn('[raid V5.1] raidTurnoBoss abortado: fim de jogo ativo.');
                return;
            }

            console.log('[raid V5.1] raidTurnoBoss executando. Bosses:', window.raidBosses.length);
            return _origTurnoBoss.apply(this, arguments);
        };
    }

    // ================================================================
    // FIX 7: Hook no applyDmg — garante que o dano vai pro boss certo
    // ================================================================
    const _origApplyDmg = window.applyDmg;
    if (typeof _origApplyDmg === 'function' && !window._raidV51ApplyDmg) {
        window._raidV51ApplyDmg = true;

        window.applyDmg = function(target, amt) {
            // Se está em raid E o target é o `boss` global,
            // redireciona pra metade correta
            if (window._raidMode && typeof boss !== 'undefined' && target === boss) {
                // Pega o boss primário vivo
                const bs = raidGetBosses().filter(b => !b.dead);
                if (bs.length > 0) {
                    // Aplica em cada metade proporcionalmente? Não.
                    // Aplica na primeira metade viva (o "primário")
                    const alvo = bs[0];
                    if (alvo !== boss) {
                        // É uma metade separada
                        console.log('[raid V5.1] Redirecionando dano pra metade:', alvo.id);
                        return _origApplyDmg.call(this, alvo, amt);
                    }
                }
            }
            return _origApplyDmg.apply(this, arguments);
        };

        console.log('[raid V5.1] applyDmg interceptado.');
    }

    // ================================================================
    // FIX 8: Esconde o tokenBoss original IMEDIATAMENTE
    //         (caso já esteja visível)
    // ================================================================
    if (window._raidMode) {
        const tok = document.getElementById('tokenBoss');
        if (tok) {
            tok.style.display = 'none';
            tok.style.visibility = 'hidden';
        }
    }

    console.log('✅ [raid V5.1] Token fantasma corrigido.');
    console.log('   • tokenBoss original escondido');
    console.log('   • updateVisuals/updateBossCard/updateHeader interceptados');
    console.log('   • raidTurnoBoss com guards fortes');
    console.log('   • applyDmg redireciona pra metade correta');
})();
// =================================================================
// raid.js — PATCH V5.2 (Fix definitivo da IA + token fantasma)
// -----------------------------------------------------------------
// Causa raiz identificada:
//   • bossAI original do entidades.js continua ativo no raid
//   • raidTurnoBoss NÃO está sendo chamado no modo SOLO
//   • raidAtualizarTokenBoss só é chamado dentro de raidTurnoBoss
//   • tokenBoss original é 1×1 e segue boss.x/y (o "fantasma")
//
// Correções:
//   1. Bloqueia bossAI do entidades.js durante raid
//   2. Bloqueia manageTurns do entidades.js durante raid
//   3. Chama raidTurnoBoss no solo
//   4. remove() do tokenBoss original (não só esconde)
//   5. updateVisuals sempre sincroniza raidBossToken com boss.x/y
// =================================================================

(function raidPatchV52() {
    if (window._raidPatchV52) return;
    window._raidPatchV52 = true;

    console.log('🔧 [raid V5.2] Aplicando correções definitivas...');

    // ================================================================
    // FIX 1: Remove o tokenBoss original de vez (não esconde)
    // ================================================================
    function raidRemoverTokenBossOriginal() {
        const tok = document.getElementById('tokenBoss');
        if (tok && tok.parentNode) {
            tok.parentNode.removeChild(tok);
            console.log('[raid V5.2] tokenBoss original REMOVIDO do DOM.');
        }
    }

    // Substitui o "esconder" por "remover"
    const _origConfigurar = window.raidConfigurarBossGlobal;
    if (typeof _origConfigurar === 'function') {
        window.raidConfigurarBossGlobal = function(cfg) {
            const r = _origConfigurar.apply(this, arguments);
            raidRemoverTokenBossOriginal();
            return r;
        };
    }

    // ================================================================
    // FIX 2: Bloqueia bossAI original durante raid
    // ================================================================
    if (typeof window.bossAI === 'function' && !window._raidV52BossAI) {
        window._raidV52BossAI = true;
        const _origBossAI = window.bossAI;

        window.bossAI = async function() {
            if (window._raidMode) {
                console.log('[raid V5.2] bossAI original BLOQUEADO (raid mode).');
                return;
            }
            return _origBossAI.apply(this, arguments);
        };
        console.log('[raid V5.2] bossAI original bloqueado.');
    }

    // ================================================================
    // FIX 3: Bloqueia manageTurns original durante raid
    // ================================================================
    if (typeof window.manageTurns === 'function' && !window._raidV52Manage) {
        window._raidV52Manage = true;
        const _origManage = window.manageTurns;

        window.manageTurns = function() {
            if (window._raidMode) {
                // Não faz nada — o raid controla os turnos
                console.log('[raid V5.2] manageTurns original BLOQUEADO (raid mode).');
                return;
            }
            return _origManage.apply(this, arguments);
        };
        console.log('[raid V5.2] manageTurns original bloqueado.');
    }

    // ================================================================
    // FIX 4: updateVisuals SEMPRE sincroniza raidBossToken
    //        (sem recursão)
    // ================================================================
    if (typeof window.updateVisuals === 'function' && !window._raidV52UpdateVisuals) {
        window._raidV52UpdateVisuals = true;
        const _origUpdateVisuals = window.updateVisuals;

        window.updateVisuals = function() {
            const r = _origUpdateVisuals.apply(this, arguments);

            if (window._raidMode && !window._raidV52InUpdate) {
                window._raidV52InUpdate = true;
                try {
                    // Remove qualquer tokenBoss residual
                    raidRemoverTokenBossOriginal();

                    // Sincroniza o token 2×2 com boss.x/y
                    if (typeof raidAtualizarTokenBoss === 'function') {
                        raidAtualizarTokenBoss();
                    }
                } catch (e) {
                    console.warn('[raid V5.2] Erro no sync do token:', e);
                } finally {
                    window._raidV52InUpdate = false;
                }
            }
            return r;
        };
        console.log('[raid V5.2] updateVisuals sincronizado com raidBossToken.');
    }

    // ================================================================
    // FIX 6: Reforça raidTurnoBoss — se não mover nenhum boss,
    //        ainda assim tenta a skill
    // ================================================================
    if (typeof window.raidTurnoBoss === 'function' && !window._raidV52Turno) {
        window._raidV52Turno = true;
        const _origTurno = window.raidTurnoBoss;

        window.raidTurnoBoss = async function() {
            console.log('[raid V5.2] raidTurnoBoss iniciando...');
            console.log('   raidAtual:', window.raidAtual);
            console.log('   raidBosses:', window.raidBosses?.length);
            console.log('   bosses vivos:', raidGetBosses().filter(b => !b.dead).length);

            if (!window.raidMode && !window._raidMode) return;

            const cfg = raidGetConfig(window.raidAtual);
            if (!cfg) {
                console.warn('[raid V5.2] raidTurnoBoss: cfg não encontrado.');
                return;
            }
            console.log('   cfg:', cfg.nome, '| skills:', cfg.skills?.length);

            const r = await _origTurno.apply(this, arguments);
            console.log('[raid V5.2] raidTurnoBoss finalizado.');
            return r;
        };
    }

    // ================================================================
    // FIX 7: Remove tokenBoss residual agora
    // ================================================================
    if (window._raidMode) {
        raidRemoverTokenBossOriginal();
    }

    console.log('✅ [raid V5.2] Correções aplicadas:');
    console.log('   • bossAI original bloqueado');
    console.log('   • manageTurns original bloqueado');
    console.log('   • tokenBoss original REMOVIDO');
    console.log('   • updateVisuals sincroniza raidBossToken');
})();