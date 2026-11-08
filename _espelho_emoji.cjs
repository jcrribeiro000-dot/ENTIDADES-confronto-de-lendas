// _espelho_emoji.cjs — gera assets-emojis.js a partir de A_EMOJIS_SPRITES
// Uso:  node _espelho_emoji.cjs
// Lê "C:/Users/JonatAna/Desktop/pj entidades/assets.js" e escreve o espelho.
const fs = require('fs');
const path = require('path');

const DIR = 'C:/Users/JonatAna/Desktop/pj entidades';
const src = fs.readFileSync(path.join(DIR, 'assets.js'), 'utf8');
const ini = src.indexOf('const A_EMOJIS_SPRITES = {');
const fim = src.indexOf('// Aplica as substituições', ini);
const bloco = src.slice(ini, fim);

const mapa = {};
for (const m of bloco.matchAll(/^\s*'([^']+)':\s*'([^']*)'/gmu)) {
  if (m[2] && m[2].trim()) mapa[m[1]] = m[2].trim();
}

const linhas = Object.keys(mapa).map(e => `    '${e}': '${mapa[e]}',`).join('\n');
const out = `// assets-emojis.js — ESPELHO AUTOMÁTICO (gerado por _espelho_emoji.cjs)
// Não edite à mão: edite A_EMOJIS_SPRITES no assets.js e rode o script de novo.
// Serve para o index.html carregar a tabela em PRIMEIRO lugar.
window.A_EMOJIS_SPRITES = {
${linhas}
};
`;
fs.writeFileSync(path.join(DIR, 'assets-emojis.js'), out, 'utf8');
console.log(`assets-emojis.js escrito com ${Object.keys(mapa).length} emoji(s).`);
if (!Object.keys(mapa).length) console.log('(nenhuma URL preenchida ainda — o espelho está vazio de propósito)');
