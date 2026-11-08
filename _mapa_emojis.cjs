// _mapa_emojis.cjs — mapeia emojis usados nos scripts ATIVOS do jogo
// e compara com o catálogo A_EMOJIS / A_EMOJIS_SPRITES do assets.js
const fs = require('fs');
const path = require('path');

const DIR = 'C:/Users/JonatAna/Desktop/pj entidades';
const ATIVOS = ['entidades.js','historia.js','historia-progresso.js','historia-atmosfera-herois.js',
  'historia-eventos.js','historia-sistemas.js','historia-combate.js','historia-expedicoes.js',
  'nacoes.js','fx.js','coop.js','pvp.js','raid.js','ui-confirm.js','aldeia.js','conquistas.js',
  'conhecimento.js','ajuda.js','historia-pa-morte.js','visual-stats-10x.js','assets.js','raid-solo.js','intro.js'];

const EMOJI_RE = /(\p{Extended_Pictographic}(\uFE0F|\u200D\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*|\p{Regional_Indicator}{2})/gu;

// ---------- 1. catálogo atual do assets.js ----------
const assetsSrc = fs.readFileSync(path.join(DIR, 'assets.js'), 'utf8');
const catalogo = new Set();
const catBlock = assetsSrc.slice(assetsSrc.indexOf('const A_EMOJIS = {};'), assetsSrc.indexOf('].forEach(group =>'));
for (const m of catBlock.matchAll(/'([^']*\p{Extended_Pictographic}[^']*)'/gu)) {
  for (const e of m[1].match(EMOJI_RE) || []) catalogo.add(e);
}
const spritesBlock = assetsSrc.slice(assetsSrc.indexOf('const A_EMOJIS_SPRITES = {'), assetsSrc.indexOf('// Aplica as substituições'));
const sprites = {};
for (const m of spritesBlock.matchAll(/^\s*'([^']+)':\s*'([^']*)'/gmu)) sprites[m[1]] = m[2];

// ---------- 2. emojis usados ----------
const usos = {}; // emoji -> [{arq, linha, texto}]
const soComentario = {}; // emoji -> contagem

for (const arq of ATIVOS) {
  if (arq === 'assets.js') continue;
  const linhas = fs.readFileSync(path.join(DIR, arq), 'utf8').split(/\r?\n/);
  linhas.forEach((linha, i) => {
    const achados = linha.match(EMOJI_RE);
    if (!achados) return;
    const t = linha.trim();
    const comentario = /^(\/\/|\*|\/\*|<!--)/.test(t) || (t.includes('//') && t.indexOf('//') < linha.search(EMOJI_RE));
    for (const e of achados) {
      if (comentario) { soComentario[e] = (soComentario[e] || 0) + 1; continue; }
      (usos[e] = usos[e] || []).push({ arq, linha: i + 1, texto: t.slice(0, 150) });
    }
  });
}

// ---------- 3. relatório ----------
const todos = [...new Set([...Object.keys(usos), ...Object.keys(soComentario)])];
const faltando = todos.filter(e => !catalogo.has(e)).sort();
const noCatSemSprite = [...catalogo].filter(e => !(sprites[e] && sprites[e].trim())).sort();

let out = '';
out += `EMOJIS USADOS NOS SCRIPTS ATIVOS: ${Object.keys(usos).length}\n`;
out += `CATÁLOGO A_EMOJIS: ${catalogo.size}   COM SPRITE: ${Object.keys(sprites).filter(k=>sprites[k]).length}\n`;
out += `\n=== FORA DO CATÁLOGO (nunca serão substituídos) — ${faltando.length} ===\n`;
for (const e of faltando) {
  const lista = (usos[e] || []);
  out += `\n${e}  U+${[...e].map(c=>c.codePointAt(0).toString(16).toUpperCase()).join(' ')}  (${lista.length} uso(s)${soComentario[e]?` + ${soComentario[e]} em comentário`:''})\n`;
  lista.slice(0, 6).forEach(u => out += `    ${u.arq}:${u.linha}  ${u.texto}\n`);
  if (lista.length > 6) out += `    ... +${lista.length - 6}\n`;
}

out += `\n=== NO CATÁLOGO, MAS SEM SPRITE (só emoji) — ${noCatSemSprite.length} ===\n`;
out += noCatSemSprite.join(' ') + '\n';

out += `\n=== TODOS OS EMOJIS E ONDE APARECEM (resumo) ===\n`;
for (const e of Object.keys(usos).sort((a,b)=>usos[b].length-usos[a].length)) {
  const arqs = [...new Set(usos[e].map(u=>u.arq))];
  out += `${e}\t${usos[e].length}\t${catalogo.has(e) ? (sprites[e]?'SPRITE':'catálogo-vazio') : 'FORA'}\t${arqs.join(',')}\n`;
}

fs.writeFileSync('C:/Users/JonatAna/.abacusai-bot/bot-home/entidades/relatorio-emojis.txt', out, 'utf8');
console.log(out.slice(0, 6000));
