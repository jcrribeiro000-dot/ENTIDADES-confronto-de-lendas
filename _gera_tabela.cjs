// _gera_tabela.cjs — gera TABELA-EMOJIS.md com a linha pronta de cada emoji
const fs = require('fs');
const DIR = 'C:/Users/JonatAna/Desktop/pj entidades';
const src = fs.readFileSync(DIR + '/assets.js', 'utf8');

const ini = src.indexOf('const A_EMOJIS = {};');
const fim = src.indexOf('].forEach(group =>');
const catalogo = new Set();
for (const m of src.slice(ini, fim).matchAll(/'([^']*)'/g)) m[1].split('|').forEach(e => catalogo.add(e));

// emoji -> descrição de onde aparece no jogo
const desc = {
  '🎉': 'card EVENTOS (aldeia) + título "EVENTOS" + Semana das Sombras',
  '⚔️': 'combate, PvP, raids, botões de luta',
  '🏆': 'título CONQUISTAS, troféus',
  '📖': 'bestiário (título e abas)',
  '🛠️': 'FORJA DE RAID (título e botão) — era fora do catálogo',
  '☠️': 'drop cranio_menor (raid) — era fora do catálogo',
  '💜': 'drop nucleo_do_pesadelo (raid) — era fora do catálogo',
  '🧶': 'drop la_negra (raid) — era fora do catálogo',
  '🌈': 'drop pluma_arco_iris (raid) — era fora do catálogo',
  '🌬️': 'chefe Minuano + drop presa_do_vento — era fora do catálogo',
  '🦀': 'chefe Guajará (raid solo) — era fora do catálogo',
  '💰': 'ouro (carteira, recompensas, lojas)',
  '⭐': 'XP e estrelas',
  '✅': 'confirmações e "concluído"',
  '❌': 'erros e cancelar',
  '⚠️': 'avisos',
  '🔒': 'bloqueado',
  '🔥': 'dano de fogo / elemento fogo',
  '🌑': 'essência sombria',
  '🌎': 'essência ancestral / fragmentos',
  '🧿': 'proteção / resistência',
  '🏹': 'arma de arco / flecha',
  '⛺': 'expedições',
  '🗺️': 'título ATOS / mapa',
  '🏛️': 'tesouraria',
  '⛩️': 'ritual de ascensão',
  '🧙': 'curandeiro / mercador',
  '🏠': 'oca',
  '🎮': 'coop',
  '👑': 'coroa / liderança',
  '💎': 'diamante / loot raro',
  '💀': 'morte / caveira',
  '✨': 'brilho / efeito',
  '🛡️': 'defesa',
  '🪓': 'tacape (arma)',
  '🪄': 'cajado (arma)',
  '🎁': 'recompensa / baú',
  '🎯': 'missão / objetivo',
  '💡': 'dica',
  '❓': 'desconhecido / bloqueado',
};

const linhas = [...catalogo].map(e => `| ${e} | ${desc[e] || '—'} | \`'${e}': '',\``);
fs.writeFileSync(
  'C:/Users/JonatAna/.abacusai-bot/bot-home/entidades/TABELA-EMOJIS.md',
  `# Tabela de emojis — colar URLs\n\n` +
  `Preencha a coluna da direita dentro de \`A_EMOJIS_SPRITES\` no **assets.js** (linhas do bloco de emojis),\n` +
  `ou cole a URL no espelho **assets-emojis.js**. Emoji com \`''\` continua emoji.\n\n` +
  `Total no catálogo: **${catalogo.size}**\n\n` +
  `| Emoji | Onde aparece | Linha pronta |\n|---|---|---|\n` + linhas.join('\n') + '\n',
  'utf8'
);
console.log('TABELA-EMOJIS.md gerada com', catalogo.size, 'emojis');
