// historia.js — V8.2 — MEGA BLOCO
// -----------------------------------------------------------------
// Contém:
//   1. Sistema de Níveis + Ritual de Ascensão (Ritual na Aldeia)
//   2. Bestiário do Modo História (silhueta até derrotar + filtros)
//   3. Filtros na OCA (Todos / Guerreiros / Magos / Arqueiros)
//   4. Integração do bônus de nível no executeAction (ATK / Formas / PA)
//
// ⚠️ Colar NO FINAL do historia.js — sem substituir nada.
// =================================================================

// =================================================================
// 1. SISTEMA DE NÍVEIS + RITUAL
// =================================================================

const STORY_LEVEL_UPGRADES = {
    2:  { xp: 80,   gold: 40,  label: '+1 HP',                       type: 'hp',      value: 1 },
    3:  { xp: 120,  gold: 60,  label: 'Sem bônus — degrau',          type: 'none',    value: 0 },
    4:  { xp: 200,  gold: 100, label: '+1 ATK',                       type: 'atk',     value: 1 },
    5:  { xp: 300,  gold: 150, label: 'Sem bônus — degrau',          type: 'none',    value: 0 },
    6:  { xp: 450,  gold: 220, label: '+1 ATK em Formas',             type: 'formAtk', value: 1 },
    7:  { xp: 650,  gold: 320, label: 'Sem bônus — degrau',          type: 'none',    value: 0 },
    8:  { xp: 900,  gold: 450, label: '+1 ATK no Poder Ancestral',    type: 'paAtk',   value: 1 },
    9:  { xp: 1250, gold: 620, label: 'Sem bônus — degrau',          type: 'none',    value: 0 },
    10: { xp: 1750, gold: 870, label: '+2 HP',                        type: 'hp',      value: 2 },
};

const STORY_MAX_LEVEL = 10;

function getHeroLevel(heroClass) {
    if (!STORY_PROGRESS.heroLevels) STORY_PROGRESS.heroLevels = {};
    return STORY_PROGRESS.heroLevels[heroClass] || 1;
}

function setHeroLevel(heroClass, level) {
    if (!STORY_PROGRESS.heroLevels) STORY_PROGRESS.heroLevels = {};
    STORY_PROGRESS.heroLevels[heroClass] = Math.min(level, STORY_MAX_LEVEL);
}

function getNextUpgradeCost(heroClass) {
    const currentLevel = getHeroLevel(heroClass);
    if (currentLevel >= STORY_MAX_LEVEL) return null;
    const nextLevel = currentLevel + 1;
    const up = STORY_LEVEL_UPGRADES[nextLevel];
    if (!up) return null;
    return { targetLevel: nextLevel, ...up };
}

function getHeroBonusFromLevel(heroClass) {
    const currentLevel = getHeroLevel(heroClass);
    const bonus = { hp: 0, atk: 0, formAtk: 0, paAtk: 0 };
    for (let lv = 1; lv <= currentLevel; lv++) {
        const up = STORY_LEVEL_UPGRADES[lv];
        if (!up || up.type === 'none') continue;
        if (up.type === 'hp')       bonus.hp      += up.value;
        if (up.type === 'atk')      bonus.atk     += up.value;
        if (up.type === 'formAtk')  bonus.formAtk += up.value;
        if (up.type === 'paAtk')    bonus.paAtk   += up.value;
    }
    return bonus;
}

function applyHeroLevelBonus(player) {
    if (!player) return;
    const bonus = getHeroBonusFromLevel(player.class);
    if (bonus.hp > 0) {
        player.maxHp += bonus.hp;
        player.hp = player.maxHp;
    }
    player.levelBonusAtk     = bonus.atk;
    player.levelBonusFormAtk = bonus.formAtk;
    player.levelBonusPaAtk   = bonus.paAtk;
}

function ascendHero(heroClass) {
    const heroData = STORY_HERO_CLASSES[heroClass];
    if (!heroData) return { ok: false, error: 'Herói não encontrado.' };

    const nextUp = getNextUpgradeCost(heroClass);
    if (!nextUp) return { ok: false, error: 'Este herói já está no nível máximo.' };

    const totalXP   = STORY_PROGRESS.totalXP || 0;
    const totalGold = STORY_PROGRESS.gold    || 0;

    if (totalXP < nextUp.xp) {
        return { ok: false, error: `XP insuficiente. Faltam ${nextUp.xp - totalXP} XP.` };
    }
    if (totalGold < nextUp.gold) {
        return { ok: false, error: `Ouro insuficiente. Faltam ${nextUp.gold - totalGold} de ouro.` };
    }

    STORY_PROGRESS.totalXP -= nextUp.xp;
    STORY_PROGRESS.gold    -= nextUp.gold;

    setHeroLevel(heroClass, nextUp.targetLevel);
    saveStoryProgress();

    return { ok: true, targetLevel: nextUp.targetLevel, label: nextUp.label };
}

function renderRitualScreen() {
    const screen = document.getElementById('storyScreen');
    if (!screen) return;

    const unlockedList = STORY_PROGRESS.unlockedHeroesStory || ['Tupa','Sume','Caipora'];
    const totalXP   = STORY_PROGRESS.totalXP || 0;
    const totalGold = STORY_PROGRESS.gold    || 0;

    const allHeroes = Object.values(STORY_HERO_CLASSES).filter(h => {
        return h.starsNeeded === 0 || unlockedList.includes(h.className);
    });

    let cardsHTML = '';
    if (allHeroes.length === 0) {
        cardsHTML = '<div style="text-align:center;padding:40px;color:#8a7a52;">Nenhum herói desbloqueado ainda.</div>';
    } else {
        allHeroes.forEach(hero => {
            const level    = getHeroLevel(hero.className);
            const nextUp   = getNextUpgradeCost(hero.className);
            const maxLvl   = level >= STORY_MAX_LEVEL;
            const bonus    = getHeroBonusFromLevel(hero.className);

            let spriteSrc = '';
            if (hero.spriteKey) {
                const url = SPRITES_STORY[hero.spriteKey];
                spriteSrc = url && url.trim() !== '' ? url : '';
            } else if (typeof SPRITES !== 'undefined' && SPRITES[hero.className]) {
                spriteSrc = SPRITES[hero.className];
            }
            const emoji = hero.spriteKey ? (EMOJI_STORY[hero.spriteKey] || '?') : '';
            const spriteHTML = spriteSrc
                ? `<img src="${spriteSrc}" class="ritual-hero-sprite" alt="${hero.displayName}">`
                : `<div class="ritual-hero-sprite" style="display:flex;align-items:center;justify-content:center;font-size:3rem;">${emoji}</div>`;

            let bonusLine = [];
            if (bonus.hp > 0)      bonusLine.push(`+${bonus.hp} HP`);
            if (bonus.atk > 0)     bonusLine.push(`+${bonus.atk} ATK`);
            if (bonus.formAtk > 0) bonusLine.push(`+${bonus.formAtk} ATK Formas`);
            if (bonus.paAtk > 0)   bonusLine.push(`+${bonus.paAtk} ATK PA`);
            const bonusText = bonusLine.length > 0
                ? `<div class="ritual-bonus-line">Bônus: ${bonusLine.join(' · ')}</div>`
                : `<div class="ritual-bonus-line" style="opacity:.5;">Nenhum bônus ainda</div>`;

            let nextBlockHTML;
            if (maxLvl) {
                nextBlockHTML = `
                    <div class="ritual-max">
                        <div class="ritual-max-icon">👑</div>
                        <div class="ritual-max-text">NÍVEL MÁXIMO</div>
                    </div>`;
            } else {
                const canAfford = totalXP >= nextUp.xp && totalGold >= nextUp.gold;
                const isBonus   = nextUp.type !== 'none';
                const bonusClass = isBonus ? 'ritual-next-bonus' : 'ritual-next-bonus ritual-next-nobonus';
                nextBlockHTML = `
                    <div class="ritual-next-upgrade">
                        <div class="ritual-next-label">
                            <span class="ritual-next-level">Nv ${nextUp.targetLevel}</span>
                            <span class="${bonusClass}">${nextUp.label}</span>
                        </div>
                        <div class="ritual-cost-row">
                            <span class="ritual-cost ${totalXP >= nextUp.xp ? 'ok' : 'no'}">
                                ${uiIcon('xp')} ${nextUp.xp} XP
                            </span>
                            <span class="ritual-cost ${totalGold >= nextUp.gold ? 'ok' : 'no'}">
                                ${uiIcon('gold')} ${nextUp.gold}
                            </span>
                        </div>
                        <button class="ritual-ascend-btn" 
                                ${canAfford ? '' : 'disabled'}
                                onclick="handleRitualAscend('${hero.className.replace(/'/g, "\\'")}')">
                            ${canAfford ? (isBonus ? '✦ ASCENDER' : '↗ SUBIR NÍVEL') : '✕ SEM RECURSOS'}
                        </button>
                    </div>`;
            }

            cardsHTML += `
                <div class="ritual-card">
                    <div class="ritual-card-header">
                        ${spriteHTML}
                        <div class="ritual-card-info">
                            <div class="ritual-card-name">${hero.displayName}</div>
                            <div class="ritual-card-role">${hero.role}</div>
                            <div class="ritual-card-level">Nível <b>${level}</b> / ${STORY_MAX_LEVEL}</div>
                        </div>
                    </div>
                    ${bonusText}
                    ${nextBlockHTML}
                </div>`;
        });
    }

    screen.innerHTML = `
        <div class="story-container">
            <div class="story-header">
                <h1 class="story-title">🏛️ RITUAL DE ASCENSÃO</h1>
                <p class="story-subtitle">Use XP e Ouro para elevar seus heróis aos níveis ancestrais.</p>
                <div style="text-align:center;margin-top:15px;display:flex;gap:15px;justify-content:center;flex-wrap:wrap;">
                    <span class="story-stars-counter" style="background:rgba(58,42,24,.9);border:1px solid #6a5024;padding:8px 14px;border-radius:20px;font-family:'Cinzel',serif;font-weight:700;color:#e8b923;">
                        ${uiIcon('xp')} ${totalXP} XP
                    </span>
                    <span class="story-stars-counter" style="background:rgba(58,42,24,.9);border:1px solid #6a5024;padding:8px 14px;border-radius:20px;font-family:'Cinzel',serif;font-weight:700;color:#e8b923;">
                        ${uiIcon('gold')} ${totalGold}
                    </span>
                </div>
            </div>
            <div class="ritual-grid">${cardsHTML}</div>
            <div class="story-footer"><button class="story-back-btn" onclick="renderAldeiaScreen()">← VOLTAR À ALDEIA</button></div>
        </div>
    `;
}

function handleRitualAscend(heroClass) {
    const result = ascendHero(heroClass);
    if (!result.ok) {
        showToast('❌ Não foi possível', result.error, '❌');
        return;
    }
    const heroData = STORY_HERO_CLASSES[heroClass];
    const isBonus = result.label && result.label !== 'Sem bônus — degrau';
    const msg = isBonus
        ? `${heroData.displayName} chegou ao nível ${result.targetLevel} — ${result.label}`
        : `${heroData.displayName} chegou ao nível ${result.targetLevel}`;

    showToast(
        isBonus ? '✦ ASCENSÃO CONCLUÍDA!' : '↗ NÍVEL AUMENTADO',
        msg,
        isBonus ? '✦' : '↗'
    );
    try { if (typeof playSfx === 'function') playSfx('win'); } catch(e) {}
    renderRitualScreen();
}

// Hook: aplica bônus de nível ao herói em batalha
(function patchInitStoryBattleForLevels() {
    const _origInitBattle = window.initStoryBattle;
    if (typeof _origInitBattle !== 'function') return;
    window.initStoryBattle = async function() {
        await _origInitBattle.apply(this, arguments);
        if (Array.isArray(players)) {
            players.forEach(p => {
                applyHeroLevelBonus(p);
                applyHeroEquipment(p);
            });
            if (typeof updateHeroCard === 'function') updateHeroCard();
            if (typeof updateVisuals === 'function') updateVisuals();
        }
    };
})();

// =================================================================
// 2. BESTIÁRIO DO MODO HISTÓRIA
// =================================================================
// Silhueta até derrotar. Filtros por Ato e por tipo.
// =================================================================

let bestiaryFilterAto  = 'all';
let bestiaryFilterTipo = 'all';

// Descrições únicas dos animais (o bestiário mostra "lore curta")
const STORY_ENEMY_LORE = {
    // Ato 1
    porco_espinho: 'Pequeno, espinhoso, mas agora movido por fúria cega. Anhangá sussurrou em seus ouvidos que todo animal da mata era seu inimigo.',
    jacare: 'Guardião do vau, transformado em predador implacável. Sua bocarra não conhece mais a piedade do rio.',
    cervo: 'A criatura mais gentil da mata. A sombra do Sussurrador o enlouqueceu — seus chifres agora procuram carne.',
    onca_parda: 'A caçadora que reina no topo da cadeia. Seu silêncio é a última coisa que muitos ouvem.',
    saci: 'O Senhor do Redemoinho. Brincalhão por natureza, agora gira com a fúria que não é dele.',
    // Ato 2
    tamandua: 'Farejador de raízes, protetor silencioso da mata fechada. Suas garras agora abrem trincheiras de dor.',
    anta: 'A muralha viva. Seu peso abre clareiras — antes para a floresta respirar, agora para esmagar.',
    queixada: 'A manada faminta. Sozinho é fraco, em bando é implacável. A fúria coletiva é sua arma.',
    sucuri: 'A devoradora das águas. Enrola, quebra e digere. Nada que respira escapa da sua bocarra.',
    mapinguari: 'O Pilar da Mata. Antigo protetor corrompido — devora o que jurou proteger.',
    // Ato 3
    piranha: 'A primeira mandíbula. Pequena, mas em cardume é a morte certa para qualquer um que ouse entrar na água.',
    lontra: 'A brincalhona afogada. Sorri enquanto arrasta incautos para o fundo.',
    ariranha: 'A matilha do fundo. Caçavam para viver — agora matam por prazer.',
    pirarucu: 'O gigante calmo das águas fundas. Silêncio é fraqueza, ensinou Anhangá. Agora devora tudo.',
    iara: 'A sedutora dos rios. Seu canto afoga — e ela canta com prazer.',
    // Ato 4
    cascavel: 'O chocalho do inferno. Avisava antes de morder; agora ataca sem aviso.',
    coral: 'A mentira colorida. Cores vivas, veneno mortal — e agora, nenhuma piedade.',
    jararaca: 'A traiçoeira do mato. Não morde por defesa — morde por vontade.',
    tartaruga: 'A fortaleza antiga. Impérios nasceram e caíram aos seus pés. Agora esmaga com o peso da eternidade.',
    boitata: 'A serpente de fogo. Antes iluminava a noite — agora consome tudo em seu caminho.',
    // Ato 5
    bode: 'O corno amaldiçoado. Carregava a culpa dos outros — agora cobra de todos.',
    carneiro: 'A lã ensanguentada. Manso por natureza, violento por corrupção.',
    cavalo_selvagem: 'O corcel sem dono. Nunca aceitou sela — agora não aceita nada.',
    touro_bravo: 'O furioso do curral. Força bruta transformada em caçador.',
    mula: 'A maldição da noite. Relincha fogo e dor sobre quem cruza seu caminho.',
    // Ato 6
    urubu: 'A sombra do céu. Esperava a morte dos outros — agora a provoca.',
    carcaara: 'A lâmina voadora. Predador dos predadores — caça à luz do dia.',
    tatu: 'A armadura cavadora. Cavava tocas; agora cava armadilhas mortais.',
    lobo_guara: 'O uivo da solidão. Uiva chamando a morte — e ela vem.',
    corpo_seco: 'O devorador de almas. Fome infinita, saciada apenas com vidas.',
    // Ato 7
    cachorro_mato: 'O primeiro uivo. A lua o observa — e ele responde com fúria.',
    raposa: 'A astuta sedenta. Enganava por diversão; agora engana para matar.',
    guaxinim: 'O ladrão da noite. Invadia acampamentos; agora invade sonhos.',
    jaguatirica: 'A caçadora silenciosa. Salta antes do alvo piscar.',
    lobisomem: 'A maldição da lua. Besta interior libertada — sem volta.',
    // Ato 8
    morcego: 'O filho da noite. Drena sonhos antes do sangue.',
    coruja: 'O olho da bruxa. Sabe tudo — e agora julga tudo.',
    sapo_cururu: 'A poção viva. Veneno ambulante — onde toca, mata.',
    seriema: 'A guardiã do caldeirão. Instinto guardião corrompido em tirania.',
    cuca: 'A bruxa da floresta. Conhecimento transformado em destruição.',
    // Ato 9
    tucunare: 'O rei do rio. Defende seu trono mordendo antes que outro peixe respire.',
    piraiba: 'O fantasma das profundezas. Solidão transformada em fúria.',
    dourada: 'O tesouro maldito. Cega quem a olha — e ataca no reflexo.',
    peixe_boi: 'A muralha viva. Paciência virou concreto.',
    boto: 'O sedutor das águas. Encanto transformado em arma de destruição.',
    // Ato 10
    bufalo: 'O titã negro. Montanha viva que esmaga cercas, casas, homens.',
    vaca_louca: 'A lamentação. Tristeza feita carne — mugido virou grito de guerra.',
    cabra_preta: 'A portadora do azar. Cada passo envenena a terra.',
    zebu: 'O touro de mil guerras. Paciência envenenada por arrogância.',
    boi: 'O terrível das sombras. Terror puro em forma de mugido.',
    // Ato 11
    gato_mato: 'O filho da mata fria. Silêncio puro transformado em malícia.',
    mariposa_gigante: 'A asa lunar. Buscava a lua — agora ela a busca de volta.',
    quati: 'O bando vermelho. Ataca em círculo, fechando o cerco.',
    sucuarana: 'A senhora das alturas. Rainha silenciosa — agora com arrogância divina.',
    jaci: 'A deusa da lua corrompida. Sua luz queima em vez de iluminar.',
    // Ato 12
    gaviao: 'O caçador do céu. Caça pela glória, não pela fome.',
    falcao: 'O mergulhador mortal. Velocidade transformada em divindade.',
    urutau: 'A ave fantasma. Existe e não existe ao mesmo tempo.',
    aguia_cinzenta: 'A águia do trono. Soberania virou tirania.',
    guaraci: 'O sol devorador. Calor transformado em inferno.',
    // Ato 13 — Espectros
    espectro_saci: 'O eco do Senhor do Redemoinho. Reassimilado pelo abismo.',
    espectro_mapinguari: 'O eco do Pilar da Mata. Devorador de novo.',
    espectro_iara: 'O eco do Canto. Água purificada voltou a ser armadilha.',
    espectro_boitata: 'O eco da Serpente de Fogo. Luz que só destrói.',
    espectro_mula: 'O eco da Maldição. Relincho do abismo.',
    espectro_corposeco: 'O eco da Fome. Inquieto, insaciável.',
    espectro_lobisomem: 'O eco da Lua. Fera solta para sempre.',
    espectro_cuca: 'O eco das Poções. Veneno puro.',
    espectro_boto: 'O eco do Encanto. Sorriso que esconde lâmina.',
    espectro_boi: 'O eco do Terror. Face do abismo.',
    espectro_jaci: 'O eco da Lua Fria. Brilho que queima.',
    espectro_guaraci: 'O eco do Sol Negro. Amanhecer que não existe.',
    anhanga: 'O Senhor do Abismo. A própria manifestação do mal que corrompeu a mata.'
};

function getEnemyAtoFromId(enemyId) {
    for (const cid in STORY_CHAPTERS) {
        const ch = STORY_CHAPTERS[cid];
        for (const ph of ch.phases) {
            if (ph.enemies.includes(enemyId)) return parseInt(cid);
        }
    }
    return null;
}

function getEnemyType(enemyId) {
    const e = STORY_ENEMIES[enemyId];
    if (!e) return 'unknown';
    if (e.isFinalBoss) return 'final';
    if (e.isBoss)      return 'boss';
    if (e.isMiniBoss)  return 'miniboss';
    if (e.isSpectral)  return 'espectral';
    return 'animal';
}

function isEnemyDiscovered(enemyId) {
    return (STORY_PROGRESS.enemiesDefeatedIds || []).includes(enemyId) ||
           (STORY_PROGRESS.bossesDefeated || []).includes(enemyId);
}

function getEnemySkillGrid(enemyId, skillKey) {
    const enemy = STORY_ENEMIES[enemyId];
    if (!enemy) return '';
    const skill = enemy[skillKey];
    if (!skill) return '';
    const handler = skill.handler || '';

    // Reaproveita o mini-grid adaptando o alcance da skill
    const gridSize = 8;
    const CX = 3, CY = 4;
    const afetados = Array.from({length: gridSize}, () => Array(gridSize).fill(false));

    // Mapa simplificado de handlers → padrões visuais
    // (mesmo estilo do painel do herói, mas com centro no inimigo)
    const h = handler.toLowerCase();
    const isLine = h.includes('bocada') || h.includes('mordida') || h.includes('investida') ||
                   h.includes('chifrada') || h.includes('bicada') || h.includes('cornada') ||
                   h.includes('coice') || h.includes('marrada') || h.includes('bote') ||
                   h.includes('nado') || h.includes('mergulho') || h.includes('voo') ||
                   h.includes('relincho') || h.includes('grito');
    const isArea = h.includes('area') || h.includes('pisada') || h.includes('pisoteada') ||
                   h.includes('casco') || h.includes('eco') || h.includes('garras') ||
                   h.includes('urro') || h.includes('uivo') || h.includes('po') ||
                   h.includes('veneno') || h.includes('corpulencia') || h.includes('empurrao') ||
                   h.includes('face') || h.includes('devora') || h.includes('frenesi') ||
                   h.includes('estouro') || h.includes('cura') || h.includes('onda') ||
                   h.includes('tempestade') || h.includes('erupcao');
    const isCross = h.includes('cruz') || h.includes('jatos') || h.includes('canto') ||
                    h.includes('cantico') || h.includes('ressonancia');
    const isDiagonal = h.includes('diagonal') || h.includes('vortices') || h.includes('tsunami') ||
                       h.includes('colunas') || h.includes('intercalado');
    const isColumn = h.includes('coluna') || h.includes('pilar') || h.includes('cavar');

    if (isColumn) {
        for (let y = 0; y < gridSize; y++) afetados[y][CX] = true;
    } else if (isCross) {
        for (let x = 0; x < gridSize; x++) afetados[CY][x] = true;
        for (let y = 0; y < gridSize; y++) afetados[y][CX] = true;
    } else if (isDiagonal) {
        for (let i = -3; i <= 3; i++) {
            if (i === 0) continue;
            if (CX + i >= 0 && CX + i < gridSize && CY + i >= 0 && CY + i < gridSize) afetados[CY + i][CX + i] = true;
            if (CX + i >= 0 && CX + i < gridSize && CY - i >= 0 && CY - i < gridSize) afetados[CY - i][CX + i] = true;
        }
    } else if (isArea) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = CX + dx, ny = CY + dy;
                if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) afetados[ny][nx] = true;
            }
        }
    } else if (isLine) {
        for (let i = 1; i <= 4; i++) {
            const ny = CY - i;
            if (ny >= 0) afetados[ny][CX] = true;
            const nx = CX + i;
            if (nx < gridSize) afetados[CY][nx] = true;
        }
    } else {
        // Padrão: 2 adjacentes
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = CX + dx, ny = CY + dy;
                if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) afetados[ny][nx] = true;
            }
        }
    }

    const ELEMENT_COLORS = { FOGO:'bg-FOGO', AGUA:'bg-AGUA', TERRA:'bg-TERRA', AR:'bg-AR' };
    // Escolhe um elemento "temático" baseado no inimigo (simplificado)
    const themeMap = {
        'espectro': 'AR',
        'anhanga': 'FOGO',
    };
    let themeEl = 'FOGO';
    if (enemyId.includes('espectro')) themeEl = 'AR';
    if (enemyId === 'anhanga') themeEl = 'FOGO';
    if (enemyId.includes('iara') || enemyId.includes('boto') || enemyId.includes('piranha') ||
        enemyId.includes('pirarucu') || enemyId.includes('lontra') || enemyId.includes('ariranha') ||
        enemyId.includes('tucunare') || enemyId.includes('piraiba') || enemyId.includes('dourada') ||
        enemyId.includes('peixe_boi') || enemyId.includes('sapo')) themeEl = 'AGUA';
    if (enemyId.includes('boitata') || enemyId.includes('mula') || enemyId.includes('guaraci') ||
        enemyId.includes('corpo_seco') || enemyId.includes('cuca')) themeEl = 'FOGO';
    if (enemyId.includes('jaci') || enemyId.includes('urutau') || enemyId.includes('gaviao') ||
        enemyId.includes('falcao') || enemyId.includes('morcego')) themeEl = 'AR';
    if (enemyId.includes('saci') || enemyId.includes('mapinguari') || enemyId.includes('tatu') ||
        enemyId.includes('anta') || enemyId.includes('teperesik') || enemyId.includes('queixada') ||
        enemyId.includes('sucuri') || enemyId.includes('tamandua') || enemyId.includes('cachorro') ||
        enemyId.includes('raposa') || enemyId.includes('guaxinim') || enemyId.includes('jaguatirica') ||
        enemyId.includes('lobisomem') || enemyId.includes('lobo_guara') || enemyId.includes('onca')) themeEl = 'TERRA';

    const baseClass = ELEMENT_COLORS[themeEl] || 'bg-FOGO';

    let html = '<div class="pa-mini-grid" style="grid-template-columns:repeat(8,18px);grid-template-rows:repeat(8,18px);gap:1px;">';
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const isEnemy = (x === CX && y === CY);
            const isAfetado = afetados[y][x];
            let cls = 'pa-mini-tile';
            if (isEnemy) cls += ' pa-mini-hero ' + baseClass;
            else if (isAfetado) cls += ' pa-mini-afetado ' + baseClass;
            else cls += ' pa-mini-vazio';
            html += `<div class="${cls}" style="width:18px;height:18px;font-size:11px;">${isEnemy ? '👹' : ''}</div>`;
        }
    }
    html += '</div>';
    return html;
}

function renderBestiaryScreen() {
    const screen = document.getElementById('storyScreen');
    if (!screen) return;

    const allEnemyIds = Object.keys(STORY_ENEMIES);

    // Conta descobertos
    const discovered = allEnemyIds.filter(id => isEnemyDiscovered(id));
    const total = allEnemyIds.length;

    // Aplica filtros
    let filtered = allEnemyIds.slice();
    if (bestiaryFilterAto !== 'all') {
        const atoNum = parseInt(bestiaryFilterAto);
        filtered = filtered.filter(id => getEnemyAtoFromId(id) === atoNum);
    }
    if (bestiaryFilterTipo !== 'all') {
        filtered = filtered.filter(id => getEnemyType(id) === bestiaryFilterTipo);
    }

    // Ordena por aparição (ato + ordem na fase)
    const enemyOrder = {};
    let orderCounter = 0;
    Object.values(STORY_CHAPTERS).forEach(ch => {
        ch.phases.forEach(ph => {
            ph.enemies.forEach(eid => {
                if (enemyOrder[eid] === undefined) enemyOrder[eid] = orderCounter++;
            });
        });
    });
    filtered.sort((a, b) => (enemyOrder[a] || 999) - (enemyOrder[b] || 999));

    let cardsHTML = '';
    if (filtered.length === 0) {
        cardsHTML = '<div style="text-align:center;padding:40px;color:#8a7a52;">Nenhum inimigo corresponde aos filtros.</div>';
    } else {
        filtered.forEach(enemyId => {
            const e = STORY_ENEMIES[enemyId];
            if (!e) return;
            const discovered = isEnemyDiscovered(enemyId);
            const ato = getEnemyAtoFromId(enemyId);
            const tipo = getEnemyType(enemyId);
            const tipoLabel = {
                'animal': 'Animal',
                'miniboss': 'Mini-Boss',
                'boss': 'Boss',
                'espectral': 'Espectro',
                'final': 'BOSS FINAL'
            }[tipo] || '?';

            // Sprite/emoji
            let spriteURL = SPRITES_STORY[enemyId];
            if (!spriteURL || spriteURL.trim() === '') {
                const bk = STORY_TO_BASE_BOSS[enemyId];
                if (bk && typeof SPRITES !== 'undefined' && SPRITES[bk]) spriteURL = SPRITES[bk];
            }
            const hasSprite = spriteURL && spriteURL.trim() !== '';
            const emoji = EMOJI_STORY[enemyId] || '?';

            let imgHTML;
            if (discovered) {
                imgHTML = hasSprite
                    ? `<img src="${spriteURL}" class="bestiary-sprite" alt="${e.name}">`
                    : `<div class="bestiary-sprite" style="display:flex;align-items:center;justify-content:center;font-size:3rem;">${emoji}</div>`;
            } else {
                // Silhueta: usa o emoji com filtro CSS escuro
                imgHTML = `<div class="bestiary-sprite bestiary-silhouette" style="display:flex;align-items:center;justify-content:center;font-size:3rem;">${emoji}</div>`;
            }

            if (!discovered) {
                // Card bloqueado (silhueta + ???)
                cardsHTML += `
                    <div class="bestiary-card locked" onclick="showToast('🔒 Selado', 'Derrote este inimigo para desbloquear.', '🔒')">
                        <div class="bestiary-card-header">
                            ${imgHTML}
                            <div class="bestiary-card-info">
                                <div class="bestiary-card-name">?????</div>
                                <div class="bestiary-card-meta">Ato ${ato || '?'} · ${tipoLabel}</div>
                            </div>
                        </div>
                        <div class="bestiary-card-locked">
                            <div class="bestiary-lock-icon">🔒</div>
                            <div class="bestiary-lock-text">Selado</div>
                        </div>
                    </div>`;
                return;
            }

            // Card desbloqueado
            const lore = STORY_ENEMY_LORE[enemyId] || '';
            const skill1HTML = e.skill1 ? getEnemySkillGrid(enemyId, 'skill1') : '';
            const skill2HTML = e.skill2 ? getEnemySkillGrid(enemyId, 'skill2') : '';

            // Drops
            const dropsTable = STORY_DROP_TABLE[enemyId];
            let dropsHTML = '';
            if (dropsTable) {
                const dropsList = [];
                if (dropsTable.comum) {
                    const m = STORY_MATERIALS[dropsTable.comum.id];
                    if (m) dropsList.push(`<span class="bestiary-drop"><span>${m.emoji}</span> ${m.name} <b>(${dropsTable.comum.chance}%)</b></span>`);
                }
                if (dropsTable.raro) {
                    const m = STORY_MATERIALS[dropsTable.raro.id];
                    if (m) dropsList.push(`<span class="bestiary-drop bestiary-drop-raro"><span>${m.emoji}</span> ${m.name} <b>(${dropsTable.raro.chance}%)</b></span>`);
                }
                dropsHTML = dropsList.length ? dropsList.join('') : '<span style="color:#8a7a52;font-style:italic;">Nenhum drop conhecido.</span>';
            } else {
                dropsHTML = '<span style="color:#8a7a52;font-style:italic;">Nenhum drop conhecido.</span>';
            }

            // Fases onde aparece
            const fases = [];
            Object.values(STORY_CHAPTERS).forEach(ch => {
                ch.phases.forEach(ph => {
                    if (ph.enemies.includes(enemyId)) fases.push(ph.id);
                });
            });

            cardsHTML += `
                <div class="bestiary-card unlocked ${tipo === 'final' ? 'bestiary-final' : ''} ${tipo === 'boss' ? 'bestiary-boss' : ''} ${tipo === 'miniboss' ? 'bestiary-miniboss' : ''}">
                    <div class="bestiary-card-header">
                        ${imgHTML}
                        <div class="bestiary-card-info">
                            <div class="bestiary-card-name">${e.name}</div>
                            <div class="bestiary-card-meta">Ato ${ato || '?'} · ${tipoLabel}</div>
                            <div class="bestiary-card-stats">
                                <span><b>HP</b> ${e.hp}</span>
                                <span><b>ATK</b> ${e.atk}</span>
                            </div>
                        </div>
                    </div>
                    ${lore ? `<div class="bestiary-card-lore">${lore}</div>` : ''}
                    <div class="bestiary-skills">
                        ${e.skill1 ? `
                            <div class="bestiary-skill">
                                <div class="bestiary-skill-header">
                                    <span class="bestiary-skill-name">${e.skill1.name}</span>
                                </div>
                                <div class="bestiary-skill-grid">${skill1HTML}</div>
                            </div>
                        ` : ''}
                        ${e.skill2 ? `
                            <div class="bestiary-skill">
                                <div class="bestiary-skill-header">
                                    <span class="bestiary-skill-name">${e.skill2.name}</span>
                                </div>
                                <div class="bestiary-skill-grid">${skill2HTML}</div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="bestiary-card-section">
                        <div class="bestiary-card-section-title">💎 Drops</div>
                        <div class="bestiary-drops">${dropsHTML}</div>
                    </div>
                    <div class="bestiary-card-section">
                        <div class="bestiary-card-section-title">📖 Aparece em</div>
                        <div class="bestiary-fases">${fases.map(f => `<span class="bestiary-fase">${f}</span>`).join('')}</div>
                    </div>
                </div>`;
        });
    }

    // Filtros
    const atosOptions = [];
    for (let i = 1; i <= 13; i++) {
        atosOptions.push(`<option value="${i}" ${bestiaryFilterAto == i ? 'selected' : ''}>Ato ${i}</option>`);
    }

    screen.innerHTML = `
        <div class="story-container">
            <div class="story-header">
                <h1 class="story-title">📖 BESTIÁRIO</h1>
                <p class="story-subtitle">${discovered.length} / ${total} inimigos descobertos</p>
            </div>
            <div class="bestiary-filters">
                <select class="bestiary-filter" onchange="bestiaryFilterAto = this.value; renderBestiaryScreen();">
                    <option value="all" ${bestiaryFilterAto === 'all' ? 'selected' : ''}>Todos os Atos</option>
                    ${atosOptions.join('')}
                </select>
                <select class="bestiary-filter" onchange="bestiaryFilterTipo = this.value; renderBestiaryScreen();">
                    <option value="all" ${bestiaryFilterTipo === 'all' ? 'selected' : ''}>Todos os Tipos</option>
                    <option value="animal" ${bestiaryFilterTipo === 'animal' ? 'selected' : ''}>Animais</option>
                    <option value="miniboss" ${bestiaryFilterTipo === 'miniboss' ? 'selected' : ''}>Mini-Bosses</option>
                    <option value="boss" ${bestiaryFilterTipo === 'boss' ? 'selected' : ''}>Bosses</option>
                    <option value="espectral" ${bestiaryFilterTipo === 'espectral' ? 'selected' : ''}>Espectros</option>
                    <option value="final" ${bestiaryFilterTipo === 'final' ? 'selected' : ''}>Boss Final</option>
                </select>
            </div>
            <div class="bestiary-grid">${cardsHTML}</div>
            <div class="story-footer"><button class="story-back-btn" onclick="renderAldeiaScreen()">← VOLTAR À ALDEIA</button></div>
        </div>
    `;
}

// =================================================================
// 3. FILTROS NA OCA
// =================================================================

let ocaFilterRole = 'all';

function renderOcaScreenFiltered() {
    const screen = document.getElementById('storyScreen');
    if (!screen) return;
    const saveEl = getSaveElement();

    const unlockedList = STORY_PROGRESS.unlockedHeroesStory || ['Tupa','Sume','Caipora'];
    const allHeroes = Object.values(STORY_HERO_CLASSES);

    let filtered = allHeroes.slice();
    if (ocaFilterRole !== 'all') {
        filtered = filtered.filter(h => h.role === ocaFilterRole);
    }

    const html = filtered.map(hero => {
        const isUnlocked = hero.starsNeeded === 0 || unlockedList.includes(hero.className);
        const isSelected = STORY_PROGRESS.selectedHeroes.includes(hero.className);

        let spriteSrc = '';
        if (hero.spriteKey) {
            const url = SPRITES_STORY[hero.spriteKey];
            spriteSrc = url && url.trim() !== '' ? url : '';
        } else if (typeof SPRITES !== 'undefined' && SPRITES[hero.className]) {
            spriteSrc = SPRITES[hero.className];
        }

        const emoji = hero.spriteKey ? (EMOJI_STORY[hero.spriteKey] || '?') : '';
        const el = hero.element || saveEl;
        const elDisplay = hero.element ? hero.element : `${saveEl} (dinâmico)`;

        if (!isUnlocked) {
            const spriteBlock = spriteSrc
                ? `<img src="${spriteSrc}" class="story-hero-sprite" alt="${hero.displayName}">`
                : `<div class="story-hero-sprite" style="display:flex;align-items:center;justify-content:center;font-size:3.5rem;">${emoji}</div>`;
            return `<div class="story-hero-card locked">
                ${spriteBlock}
                <div class="story-hero-name">?????</div>
                <div class="story-hero-element" style="color:#5a4a30;">${hero.role}</div>
                <div class="story-hero-lock-info">Desbloqueie com<br><b>${hero.starsNeeded} ⭐</b></div>
                <div class="story-hero-lock-icon">🔒</div>
            </div>`;
        }

        const spriteBlock = spriteSrc
            ? `<img src="${spriteSrc}" class="story-hero-sprite" alt="${hero.displayName}">`
            : `<div class="story-hero-sprite" style="display:flex;align-items:center;justify-content:center;font-size:3.5rem;">${emoji}</div>`;

        const lv = getHeroLevel(hero.className);

        return `<div class="story-hero-card ${isSelected ? 'selected' : ''}" onclick="toggleHeroSelection('${hero.className.replace(/'/g, "\\'")}')">
            ${spriteBlock}
            <div class="story-hero-name">${hero.displayName}</div>
            <div class="story-hero-element elem-${el}">${elemIcon(el)} ${elDisplay}</div>
            <div class="story-hero-level">${hero.role} · HP ${hero.hp} · ATK ${hero.atk}</div>
            <div class="story-hero-xp">Nível ${lv}</div>
            ${isSelected ? `<div class="story-hero-check">${uiIcon('check')}</div>` : ''}
        </div>`;
    }).join('');

    const totalStars = getTotalStars();
    const maxStars = getMaxTotalStars();

    screen.innerHTML = `
        <div class="story-container">
            <div class="story-header">
                <h1 class="story-title">🏠 OCA</h1>
                <p class="story-subtitle">Escolha 1 herói por fase</p>
                <div style="text-align:center;margin-top:10px;">
                    <span class="story-stars-counter"><span class="story-stars-icon">⭐</span>${totalStars} / ${maxStars}</span>
                </div>
            </div>
            <div class="oca-filters">
                <button class="oca-filter-btn ${ocaFilterRole === 'all' ? 'active' : ''}" onclick="ocaFilterRole='all'; renderOcaScreenFiltered();">Todos</button>
                <button class="oca-filter-btn ${ocaFilterRole === 'Guerreiro' ? 'active' : ''}" onclick="ocaFilterRole='Guerreiro'; renderOcaScreenFiltered();">⚔️ Guerreiros</button>
                <button class="oca-filter-btn ${ocaFilterRole === 'Mago' ? 'active' : ''}" onclick="ocaFilterRole='Mago'; renderOcaScreenFiltered();">🔮 Magos</button>
                <button class="oca-filter-btn ${ocaFilterRole === 'Arqueiro' ? 'active' : ''}" onclick="ocaFilterRole='Arqueiro'; renderOcaScreenFiltered();">🏹 Arqueiros</button>
            </div>
            <div class="story-heroes-grid">${html}</div>
            <div class="story-footer"><button class="story-back-btn" onclick="renderAldeiaScreen()">← VOLTAR À ALDEIA</button></div>
        </div>`;
}

// Re-aplica o botão "?" em cada card desbloqueado após render
(function patchOcaFiltersWithDetailsButton() {
    const _origRenderOcaFiltered = window.renderOcaScreenFiltered;
    window.renderOcaScreenFiltered = function() {
        _origRenderOcaFiltered.apply(this, arguments);

        const cards = document.querySelectorAll('.story-hero-card');
        cards.forEach(card => {
            if (card.classList.contains('locked')) return;
            if (card.querySelector('.hero-details-btn')) return;
            const onclickAttr = card.getAttribute('onclick') || '';
            const match = onclickAttr.match(/toggleHeroSelection\('((?:\\'|[^'])*)'\)/);
            if (!match) return;
            const heroClass = match[1].replace(/\\'/g, "'");

            const btn = document.createElement('button');
            btn.className = 'hero-details-btn';
            btn.innerHTML = '?';
            btn.title = 'Ver detalhes';
            btn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                openHeroDetails(heroClass);
            };
            card.appendChild(btn);
        });
    };
})();

// =================================================================
// 4. INTEGRAÇÃO DO BÔNUS DE NÍVEL NO executeAction
// =================================================================
(function integrateLevelBonusIntoExecuteAction() {
    const _exec = window.executeAction;
    if (typeof _exec !== 'function') return;

    window.executeAction = async function() {
        // Só age no modo história
        if (!window._storyMode) {
            return _exec.apply(this, arguments);
        }

        const active = players[currentPlayerIdx];
        if (!active) return _exec.apply(this, arguments);

        const heroData = STORY_HERO_CLASSES[active.class];
        if (!heroData || !heroData.paKey || heroData.paKey.startsWith('base_')) {
            return _exec.apply(this, arguments);
        }

        // Injeta os bônus de nível no totalAtk temporariamente
        // (o _exec vai usar info.atk + bonusAtk + ... — precisamos
        //  somar nossos bônus também)

        // Como o executeAction do bloco anterior já recalcula `totalAtk`,
        // vamos aplicar o bônus como um "bonusAtk" extra ANTES de chamar
        const bonus = getHeroBonusFromLevel(active.class);
        const origBonusAtk = active.bonusAtk || 0;

        // Bônus de ATK base (níveis pares "ATK")
        active.bonusAtk = origBonusAtk + (bonus.atk || 0);

        try {
            const result = await _exec.apply(this, arguments);
            return result;
        } finally {
            active.bonusAtk = origBonusAtk;
        }
    };
})();

// Integra bônus de Formas e PA no triggerBravelyChain
(function integrateLevelBonusIntoBravely() {
    const _brav = window.triggerBravelyChain;
    if (typeof _brav !== 'function') return;

    window.triggerBravelyChain = async function(active, target, totalAtk) {
        if (!window._storyMode || !active) {
            return _brav.apply(this, arguments);
        }

        const heroData = STORY_HERO_CLASSES[active.class];
        if (!heroData || !heroData.paKey || heroData.paKey.startsWith('base_')) {
            return _brav.apply(this, arguments);
        }

        // Bônus de PA vem do nível 8
        const bonus = getHeroBonusFromLevel(active.class);
        const paBonus = bonus.paAtk || 0;

        // Aumenta o totalAtk com o bônus de PA
        const boostedAtk = (totalAtk || 0) + paBonus;

        return _brav.call(this, active, target, boostedAtk);
    };
})();

// =================================================================
// 5. CSS DO MEGA BLOCO
// =================================================================
(function injectMegaBlockCSS() {
    if (document.getElementById('megaBlockStyle')) return;
    const style = document.createElement('style');
    style.id = 'megaBlockStyle';
    style.textContent = `
        /* ============ RITUAL ============ */
        .ritual-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 18px;
            margin-bottom: 30px;
        }
        .ritual-card {
            background: linear-gradient(180deg, rgba(201,162,39,.06), transparent 40%),
                        linear-gradient(180deg, rgba(42,31,16,.95), rgba(26,18,8,.95));
            border: 2px solid #3d2d18;
            border-radius: 8px;
            padding: 16px;
            transition: all 0.3s;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .ritual-card:hover {
            border-color: #6a5024;
            box-shadow: 0 4px 15px rgba(0,0,0,.4);
        }
        .ritual-card-header { display: flex; align-items: center; gap: 12px; }
        .ritual-hero-sprite {
            width: 64px; height: 64px; object-fit: contain;
            filter: drop-shadow(0 0 6px rgba(0,0,0,.7));
            flex-shrink: 0;
        }
        .ritual-card-info { flex: 1; min-width: 0; }
        .ritual-card-name {
            font-family: 'Cinzel', serif;
            color: #f0e2c0; font-size: 1.05rem;
            letter-spacing: 1px; margin-bottom: 2px;
        }
        .ritual-card-role {
            font-family: 'EB Garamond', serif;
            color: #b8a577; font-size: 0.85rem;
            font-style: italic; margin-bottom: 4px;
        }
        .ritual-card-level {
            font-family: 'Cinzel', serif;
            font-size: 0.8rem; color: #8a7a52;
            letter-spacing: 1px;
        }
        .ritual-card-level b { color: #e8b923; font-size: 1rem; }
        .ritual-bonus-line {
            font-family: 'EB Garamond', serif;
            font-size: 0.85rem; color: #8ac070;
            padding: 6px 10px;
            background: rgba(107,163,92,.1);
            border-left: 3px solid #6ba35c;
            border-radius: 4px;
        }
        .ritual-next-upgrade {
            background: rgba(10,6,2,.5);
            border: 1px solid rgba(201,162,39,.25);
            border-radius: 6px;
            padding: 12px;
            display: flex; flex-direction: column; gap: 10px;
        }
        .ritual-next-label {
            display: flex; justify-content: space-between;
            align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .ritual-next-level {
            font-family: 'Cinzel', serif; color: #e8b923;
            font-weight: 700; letter-spacing: 1px;
        }
        .ritual-next-bonus {
            font-family: 'EB Garamond', serif;
            color: #d9c89a; font-size: 0.9rem; font-weight: 600;
        }
        .ritual-next-nobonus {
            color: #8a7a52 !important; font-style: italic;
            font-weight: 400; font-size: 0.85rem;
        }
        .ritual-cost-row { display: flex; gap: 10px; justify-content: center; }
        .ritual-cost {
            display: inline-flex; align-items: center; gap: 4px;
            font-family: 'Cinzel', serif; font-size: 0.85rem;
            font-weight: 700; padding: 4px 10px;
            border-radius: 20px;
            background: rgba(10,6,2,.5);
            border: 1px solid rgba(201,162,39,.3);
        }
        .ritual-cost img { width: 16px; height: 16px; object-fit: contain; }
        .ritual-cost.ok { color: #8ac070; border-color: rgba(107,163,92,.5); }
        .ritual-cost.no { color: #d05050; border-color: rgba(168,50,50,.5); }
        .ritual-ascend-btn {
            padding: 10px 16px;
            background: linear-gradient(180deg, rgba(232,185,35,.25), transparent 45%),
                        linear-gradient(135deg, #8a6a2e, #4a3418);
            color: #fff5dc; border: 2px solid #e8b923;
            border-radius: 4px; cursor: pointer;
            font-family: 'Cinzel', serif; font-weight: 700;
            font-size: 0.9rem; letter-spacing: 2px;
            transition: all 0.2s;
            box-shadow: 0 3px 10px rgba(0,0,0,.5);
        }
        .ritual-ascend-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(0,0,0,.6), 0 0 25px rgba(232,185,35,.5);
        }
        .ritual-ascend-btn:disabled {
            background: #2a1f10; color: #6a5024;
            border-color: #3d2d18; cursor: not-allowed;
            box-shadow: none;
        }
        .ritual-max {
            text-align: center; padding: 12px;
            background: linear-gradient(180deg, rgba(232,185,35,.15), transparent 60%);
            border: 2px solid #e8b923; border-radius: 6px;
        }
        .ritual-max-icon { font-size: 2rem; line-height: 1; margin-bottom: 4px; }
        .ritual-max-text {
            font-family: 'Cinzel', serif; color: #e8b923;
            font-size: 0.9rem; letter-spacing: 3px; font-weight: 700;
        }

        /* ============ BESTIÁRIO ============ */
        .bestiary-filters {
            display: flex; gap: 12px; justify-content: center;
            flex-wrap: wrap; margin-bottom: 20px;
        }
        .bestiary-filter {
            padding: 10px 16px;
            background: linear-gradient(135deg, #3d2d18, #2a1f10);
            color: #e8dcc4; border: 1px solid #6a5024;
            border-radius: 4px; font-family: 'Cinzel', serif;
            font-size: 0.9rem; cursor: pointer;
        }
        .bestiary-filter:focus { outline: none; border-color: #e8b923; }

        .bestiary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
            gap: 18px;
            margin-bottom: 30px;
        }
        .bestiary-card {
            background: linear-gradient(180deg, rgba(201,162,39,.06), transparent 40%),
                        linear-gradient(180deg, rgba(42,31,16,.95), rgba(26,18,8,.95));
            border: 2px solid #3d2d18; border-radius: 8px;
            padding: 16px; transition: all 0.3s;
            display: flex; flex-direction: column; gap: 12px;
        }
        .bestiary-card.unlocked:hover { border-color: #6a5024; }
        .bestiary-card.locked { cursor: pointer; opacity: 0.85; }
        .bestiary-card.locked:hover { border-color: #4a3418; }
        .bestiary-card.bestiary-boss { border-color: #a83232; }
        .bestiary-card.bestiary-miniboss { border-color: #b87320; }
        .bestiary-card.bestiary-final {
            border-color: #8e44ad;
            background: linear-gradient(180deg, rgba(142,68,173,.15), transparent 45%),
                        linear-gradient(180deg, rgba(30,15,40,.95), rgba(15,8,20,.95));
        }

        .bestiary-card-header { display: flex; align-items: center; gap: 12px; }
        .bestiary-sprite {
            width: 72px; height: 72px; object-fit: contain;
            filter: drop-shadow(0 0 6px rgba(0,0,0,.7));
            flex-shrink: 0;
        }
        .bestiary-silhouette {
            filter: brightness(0) invert(0.15) drop-shadow(0 0 8px rgba(232,185,35,.3));
        }
        .bestiary-card-info { flex: 1; min-width: 0; }
        .bestiary-card-name {
            font-family: 'Cinzel', serif; color: #f0e2c0;
            font-size: 1.05rem; letter-spacing: 1px;
            margin-bottom: 2px;
        }
        .bestiary-card-meta {
            font-family: 'EB Garamond', serif;
            color: #b8a577; font-size: 0.85rem;
            font-style: italic; margin-bottom: 6px;
        }
        .bestiary-card-stats {
            display: flex; gap: 12px;
            font-family: 'Cinzel', serif; font-size: 0.85rem;
            color: #d9c89a;
        }
        .bestiary-card-stats b {
            color: #e8b923; margin-right: 4px;
        }
        .bestiary-card-lore {
            font-family: 'EB Garamond', serif;
            color: #b8a577; font-size: 0.9rem;
            font-style: italic; line-height: 1.5;
            padding: 8px 12px;
            background: rgba(10,6,2,.4);
            border-left: 3px solid #6a5024;
            border-radius: 4px;
        }
        .bestiary-card-section {
            display: flex; flex-direction: column; gap: 6px;
        }
        .bestiary-card-section-title {
            font-family: 'Cinzel', serif;
            color: #8a7a52; font-size: 0.75rem;
            letter-spacing: 2px; text-transform: uppercase;
        }
        .bestiary-drops { display: flex; flex-wrap: wrap; gap: 8px; }
        .bestiary-drop {
            display: inline-flex; align-items: center; gap: 4px;
            font-family: 'EB Garamond', serif;
            font-size: 0.85rem; color: #d9c89a;
            padding: 4px 10px;
            background: rgba(10,6,2,.5);
            border: 1px solid rgba(201,162,39,.25);
            border-radius: 20px;
        }
        .bestiary-drop b {
            color: #e8b923; font-family: 'Cinzel', serif;
            font-size: 0.75rem; margin-left: 4px;
        }
        .bestiary-drop-raro {
            border-color: rgba(142,68,173,.5);
            background: rgba(142,68,173,.1);
        }
        .bestiary-fases { display: flex; flex-wrap: wrap; gap: 6px; }
        .bestiary-fase {
            font-family: 'Cinzel', serif; font-size: 0.75rem;
            color: #e8b923; padding: 3px 8px;
            background: rgba(201,162,39,.1);
            border: 1px solid rgba(201,162,39,.3);
            border-radius: 12px;
        }
        .bestiary-card-locked {
            display: flex; flex-direction: column;
            align-items: center; gap: 4px;
            padding: 15px;
            background: rgba(10,6,2,.5);
            border-radius: 6px; opacity: 0.7;
        }
        .bestiary-lock-icon { font-size: 2rem; opacity: 0.5; }
        .bestiary-lock-text {
            font-family: 'Cinzel', serif;
            color: #8a7a52; font-size: 0.8rem;
            letter-spacing: 2px;
        }
        .bestiary-skills {
            display: flex; gap: 12px; flex-wrap: wrap;
        }
        .bestiary-skill {
            flex: 1; min-width: 140px;
            background: rgba(10,6,2,.4);
            padding: 8px; border-radius: 6px;
            border: 1px solid rgba(201,162,39,.15);
        }
        .bestiary-skill-header {
            display: flex; justify-content: space-between;
            align-items: center; margin-bottom: 6px;
        }
        .bestiary-skill-name {
            font-family: 'Cinzel', serif;
            color: #e8b923; font-size: 0.85rem;
            letter-spacing: 1px;
        }
        .bestiary-skill-grid {
            display: flex; justify-content: center;
        }

        /* ============ OCA FILTERS ============ */
        .oca-filters {
            display: flex; justify-content: center;
            gap: 10px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .oca-filter-btn {
            padding: 8px 18px;
            background: linear-gradient(135deg, #3d2d18, #2a1f10);
            color: #c8b787; border: 1px solid #6a5024;
            border-radius: 20px; cursor: pointer;
            font-family: 'Cinzel', serif;
            font-weight: 700; font-size: 0.85rem;
            letter-spacing: 1px;
            transition: all 0.2s;
        }
        .oca-filter-btn:hover {
            color: #e8dcc4; border-color: #c9a227;
        }
        .oca-filter-btn.active {
            background: linear-gradient(180deg, rgba(232,185,35,.2), transparent 45%),
                        linear-gradient(135deg, #6a5024, #3d2d18);
            color: #fff5dc;
            border-color: #e8b923;
            box-shadow: 0 0 15px rgba(232,185,35,.35);
        }

        @media (max-width: 600px) {
            .bestiary-grid { grid-template-columns: 1fr; }
            .bestiary-filters { flex-direction: column; align-items: center; }
            .bestiary-filter { width: 100%; max-width: 300px; }
            .ritual-grid { grid-template-columns: 1fr; }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS do Mega Bloco injetado.');
})();

// =================================================================
// 6. EXPOR NO WINDOW
// =================================================================
window.renderRitualScreen          = renderRitualScreen;
window.handleRitualAscend          = handleRitualAscend;
window.getHeroLevel                = getHeroLevel;
window.getHeroBonusFromLevel       = getHeroBonusFromLevel;
window.getNextUpgradeCost          = getNextUpgradeCost;
window.applyHeroLevelBonus         = applyHeroLevelBonus;
window.STORY_LEVEL_UPGRADES        = STORY_LEVEL_UPGRADES;
window.STORY_MAX_LEVEL             = STORY_MAX_LEVEL;

window.renderBestiaryScreen        = renderBestiaryScreen;
window.getEnemyAtoFromId           = getEnemyAtoFromId;
window.getEnemyType                = getEnemyType;
window.isEnemyDiscovered           = isEnemyDiscovered;

window.renderOcaScreenFiltered     = renderOcaScreenFiltered;

console.log('✅ historia.js V8.2 — MEGA BLOCO carregado (Ritual + Bestiário + Filtros + Bônus de Nível).');
// Desbloqueio retroativo do bestiário
(function fixBestiaryRetroactiveUnlock() {
    if (!window.STORY_PROGRESS) return;
    if (!Array.isArray(STORY_PROGRESS.enemiesDefeatedIds)) {
        STORY_PROGRESS.enemiesDefeatedIds = [];
    }
    if (Array.isArray(STORY_PROGRESS.bossesDefeated)) {
        STORY_PROGRESS.bossesDefeated.forEach(id => {
            if (!STORY_PROGRESS.enemiesDefeatedIds.includes(id)) {
                STORY_PROGRESS.enemiesDefeatedIds.push(id);
            }
        });
    }
    if (typeof saveStoryProgress === 'function') saveStoryProgress();
    console.log('✅ Bestiário retroativo OK.');
})();

// Registra nova derrota
(function fixBestiaryRegisterDefeat() {
    const _orig = window.handleStoryBossDefeat;
    if (typeof _orig !== 'function') return;
    window.handleStoryBossDefeat = async function() {
        const enemyId = (typeof storyEnemiesRemaining !== 'undefined' && storyEnemiesRemaining[0])
            ? storyEnemiesRemaining[0] : null;
        if (enemyId) {
            if (!Array.isArray(STORY_PROGRESS.enemiesDefeatedIds)) {
                STORY_PROGRESS.enemiesDefeatedIds = [];
            }
            if (!STORY_PROGRESS.enemiesDefeatedIds.includes(enemyId)) {
                STORY_PROGRESS.enemiesDefeatedIds.push(enemyId);
                if (typeof saveStoryProgress === 'function') saveStoryProgress();
            }
        }
        return _orig.apply(this, arguments);
    };
    console.log('✅ handleStoryBossDefeat reforçado.');
})();
// =================================================================
// 🔧 FIX ULTRA DEFINITIVO — intercepta clique direto no botão
// -----------------------------------------------------------------
// Não depende de enterAldeiaLocation.
// Intercepta o clique nos cards da Aldeia e redireciona
// para as funções corretas (Ritual, Bestiário, OCA com filtros).
//
// ⚠️ PRECISA ser o ÚLTIMO bloco do arquivo.
// =================================================================
(function fixAldeiaClickInterceptor() {

    // Marcador global pra não duplicar
    if (window._aldeiaClickInterceptorInstalled) {
        console.log('⚠️ Interceptor já instalado.');
        return;
    }
    window._aldeiaClickInterceptorInstalled = true;

    // Aguarda o DOM estar pronto
    function attach() {
        // Delegação de eventos no documento
        document.addEventListener('click', function(ev) {
            // Procura se o clique foi (ou está dentro de) um card da Aldeia
            const card = ev.target.closest('.story-ald-location');
            if (!card) return;

            // Se o card está locked, deixa passar (mostra aviso "em breve")
            if (card.classList.contains('locked')) return;

            // Pega o texto/ícone pra descobrir qual local é
            const nameEl = card.querySelector('.story-ald-loc-name');
            if (!nameEl) return;
            const nome = nameEl.textContent.trim().toUpperCase();

            let handled = false;

            // ---- RITUAL ----
            if (nome.includes('RITUAL')) {
                ev.preventDefault();
                ev.stopPropagation();
                if (typeof window.renderRitualScreen === 'function') {
                    window.renderRitualScreen();
                    handled = true;
                }
            }
            // ---- BESTIÁRIO ----
            else if (nome.includes('BESTI')) {
                ev.preventDefault();
                ev.stopPropagation();
                if (typeof window.renderBestiaryScreen === 'function') {
                    window.renderBestiaryScreen();
                    handled = true;
                }
            }
            // ---- OCA ----
            else if (nome === 'OCA') {
                ev.preventDefault();
                ev.stopPropagation();
                if (typeof window.renderOcaScreenFiltered === 'function') {
                    window.renderOcaScreenFiltered();
                    handled = true;
                } else if (typeof window.renderOcaScreen === 'function') {
                    window.renderOcaScreen();
                    handled = true;
                }
            }
            // ---- ATOS ----
            else if (nome.includes('ATOS')) {
                ev.preventDefault();
                ev.stopPropagation();
                if (typeof window.renderAtosScreen === 'function') {
                    window.renderAtosScreen();
                    handled = true;
                }
            }
            // ---- CURANDEIRO / LOJA ----
            else if (nome.includes('CURANDEIRO') || nome.includes('LOJA')) {
                ev.preventDefault();
                ev.stopPropagation();
                if (typeof window.renderLojaScreen === 'function') {
                    window.renderLojaScreen();
                    handled = true;
                }
            }

            if (handled) {
                console.log('[story] Clique interceptado:', nome);
            }
        }, true); // ← capture phase, roda ANTES do onclick do card

        console.log('✅ Interceptor de clique da Aldeia instalado.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attach);
    } else {
        attach();
    }
})();
// =================================================================
// 🔧 FIX — Destrava RITUAL e BESTIÁRIO na Aldeia
// -----------------------------------------------------------------
// O renderAldeiaScreen original passa locked=true para ritual e
// bestiario. Esta versão sobrescreve o render para mostrar eles
// destravados.
//
// ⚠️ Precisa ser o ÚLTIMO bloco do arquivo.
// =================================================================
(function fixAldeiaUnlockCards() {

    // Sobrescreve renderAldeiaScreen copiando a lógica original,
    // mas trocando locked=true por destravado em ritual e bestiario.
    window.renderAldeiaScreen = function() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;

        if (!STORY_CURRENT_SAVE_NAME || !STORY_PROGRESS.saveName) {
            screen.style.display = 'none';
            screen.classList.remove('active');
            showStorySaveNameModal({ allowCancel: true, title: 'NOVO SAVE' });
            return;
        }

        const gold = STORY_PROGRESS.gold || 0;
        const xp = STORY_PROGRESS.totalXP || 0;
        const stars = getTotalStars();
        const maxStars = getMaxTotalStars();
        const saveName = STORY_CURRENT_SAVE_NAME;
        const saveEl = getSaveElement();

        const allChapters = Object.values(STORY_CHAPTERS);
        let totalCompleted = 0, totalPhases = 0;
        allChapters.forEach(ch => {
            totalPhases += ch.phases.length;
            totalCompleted += ch.phases.filter(p => isPhaseCompleted(p.id)).length;
        });
        const pct = totalPhases > 0 ? Math.round((totalCompleted / totalPhases) * 100) : 0;

        const aldeiaBgHTML = SPRITES_STORY['aldeia_bg'] && SPRITES_STORY['aldeia_bg'].trim() !== ''
            ? `<img src="${SPRITES_STORY['aldeia_bg']}" alt="Aldeia" onerror="this.outerHTML='${EMOJI_STORY['aldeia_bg']||'🏘️'}'">`
            : EMOJI_STORY['aldeia_bg'];

        screen.innerHTML = `
            <div class="story-container">
                <div class="story-ald-eheader">
                    <div class="story-ald-header-title">
                        <span class="story-ald-icon-lg">${aldeiaBgHTML}</span>
                        <h1 class="story-ald-title">ALDEIA</h1>
                    </div>
                    <div class="story-ald-header-stats">
                        <div class="story-ald-stat"><span class="story-ald-stat-icon">${uiIcon('gold')}</span><span class="story-ald-stat-value">${gold}</span></div>
                        <div class="story-ald-stat"><span class="story-ald-stat-icon">${uiIcon('xp')}</span><span class="story-ald-stat-value">${xp} XP</span></div>
                        <div class="story-stars-counter"><span class="story-stars-icon">⭐</span>${stars} / ${maxStars}</div>
                    </div>
                </div>
                <div class="story-ald-save-info">
                    <div class="story-ald-save-name">
                        <span class="story-ald-save-label">SAVE:</span>
                        <span class="story-ald-save-value">${saveName}</span>
                    </div>
                    <div class="story-ald-save-element elem-${saveEl}">${elemIcon(saveEl)} ${saveEl}</div>
                    <button class="story-ald-change-save" onclick="changeStorySave()">${uiIcon('swap')} TROCAR SAVE</button>
                </div>
                <div class="story-ald-subtitle">O abrigo dos guardiões da mata.</div>
                <div class="story-ald-grid">
                    ${renderAldeiaBtn('atos','ATOS','Enfrente os corrompidos')}
                    ${renderAldeiaBtn('oca','OCA','Selecione os heróis')}
                    ${renderAldeiaBtn('loja','CURANDEIRO','Compre materiais')}
                    ${renderAldeiaBtn('ritual','RITUAL','Ascenda seus heróis')}
                    ${renderAldeiaBtn('bestiario','BESTIÁRIO','Inimigos descobertos')}
                    ${renderAldeiaBtn('tesouraria','TESOURARIA','Em breve',true)}
                </div>
                <div class="story-ald-progress">
                    <div class="story-ald-progress-label">Progresso geral: ${totalCompleted}/${totalPhases} fases · ⭐ ${stars}/${maxStars}</div>
                    <div class="story-ald-progress-bar"><div class="story-ald-progress-fill" style="width:${pct}%"></div></div>
                </div>
                <div class="story-ald-footer">
                    <button class="story-back-btn" onclick="exitStoryToTitle()">← VOLTAR AO MENU</button>
                </div>
            </div>
        `;
    };

    console.log('✅ RITUAL e BESTIÁRIO destravados na Aldeia.');

    // Se a Aldeia estiver aberta agora, re-renderiza
    const ss = document.getElementById('storyScreen');
    if (ss && ss.classList.contains('active')) {
        window.renderAldeiaScreen();
    }
})();
// =================================================================
// 🔧 FIX — Bestiário: padroes visuais PRECISOS das skills
// -----------------------------------------------------------------
// Substitui o getEnemySkillGrid antigo (que chutava pelo nome do
// handler) por uma tabela explícita, lendo o padrão real do
// STORY_ANIMAL_SKILLS.
//
// Formato de cada padrão:
//   { tipo: 'linha'|'area'|'cruz'|'diagonal'|'coluna'|'global'|'custom',
//     raio: N,          // pra 'area'
//     tiles: [{x,y}],   // pra 'custom' (coordenadas relativas ao boss)
//     elemento: 'X' }   // cor do grid
// =================================================================

const STORY_ENEMY_SKILL_PATTERNS = {
    // ============ ATO 1 ============
    'porco_espinho': {
        s1: { tipo:'cruz_infinita' },
        s2: { tipo:'move_destino', move:2, elemento:'TERRA' }
    },
    'jacare': {
        s1: { tipo:'linha', raio:2 },
        s2: { tipo:'area', raio:1 }
    },
    'cervo': {
        s1: { tipo:'move_destino', move:3 },
        s2: { tipo:'linha', raio:1 }
    },
    'onca_parda': {
        s1: { tipo:'custom', tiles:[{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:-1,y:1},{x:0,y:1},{x:1,y:1},{x:2,y:1}] },
        s2: { tipo:'move_destino_area', move:2, raio:1 }
    },
    'saci': {
        s1: { tipo:'global_elemento', elemento:'AR' },
        s2: { tipo:'diagonal_infinita' }
    },

    // ============ ATO 2 ============
    'tamandua': {
        s1: { tipo:'area', raio:1 },
        s2: { tipo:'linha', raio:2 }
    },
    'anta': {
        s1: { tipo:'area', raio:2 },
        s2: { tipo:'move_destino', move:3 }
    },
    'queixada': {
        s1: { tipo:'linha', raio:2 },
        s2: { tipo:'area', raio:1 }
    },
    'sucuri': {
        s1: { tipo:'linha', raio:2 },
        s2: { tipo:'area', raio:1 }
    },
    'mapinguari': {
        s1: { tipo:'area', raio:2 },
        s2: { tipo:'custom', tiles:[{x:-3,y:-1},{x:-2,y:-1},{x:-1,y:-1},{x:0,y:-1},{x:1,y:-1},{x:2,y:-1},{x:3,y:-1},{x:-3,y:0},{x:-2,y:0},{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0},{x:-3,y:1},{x:-2,y:1},{x:-1,y:1},{x:0,y:1},{x:1,y:1},{x:2,y:1},{x:3,y:1}] }
    },

    // ============ ATO 3 ============
    'piranha': {
        s1: { tipo:'custom', tiles:[{x:-1,y:-1},{x:0,y:-1},{x:1,y:-1},{x:-2,y:0},{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:2,y:0}] },
        s2: { tipo:'global' }
    },
    'lontra': {
        s1: { tipo:'linha', raio:2 },
        s2: { tipo:'move_destino', move:3 }
    },
    'ariranha': {
        s1: { tipo:'cruz', raio:1 },
        s2: { tipo:'linha', raio:2 }
    },
    'pirarucu': {
        s1: { tipo:'linha', raio:2 },
        s2: { tipo:'area', raio:1 }
    },
    'iara': {
        s1: { tipo:'global' },
        s2: { tipo:'cruz_infinita' }
    },

    // ============ ATO 4 ============
    'cascavel': {
        s1: { tipo:'global_elemento', elemento:'AR' },
        s2: { tipo:'linha', raio:2 }
    },
    'coral': {
        s1: { tipo:'custom', tiles:[{x:0,y:-1},{x:-1,y:0},{x:0,y:0},{x:1,y:0}] },
        s2: { tipo:'linha', raio:2 }
    },
    'jararaca': {
        s1: { tipo:'linha', raio:2 },
        s2: { tipo:'custom', tiles:[{x:0,y:0}] }
    },
    'tartaruga': {
        s1: { tipo:'area', raio:1 },
        s2: { tipo:'linha', raio:2 }
    },
    'boitata': {
        s1: { tipo:'custom', tiles:[{x:-1,y:-3},{x:0,y:-3},{x:1,y:-3},{x:-1,y:-2},{x:0,y:-2},{x:1,y:-2},{x:-1,y:-1},{x:0,y:-1},{x:1,y:-1},{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:-1,y:1},{x:0,y:1},{x:1,y:1},{x:-1,y:2},{x:0,y:2},{x:1,y:2},{x:-1,y:3},{x:0,y:3},{x:1,y:3}] },
        s2: { tipo:'custom', tiles:[{x:-2,y:-2},{x:2,y:-2},{x:-2,y:2},{x:2,y:2},{x:0,y:0}] }
    },

    // ============ ATO 5 ============
    'bode': {
        s1: { tipo:'linha', raio:1 },
        s2: { tipo:'linha', raio:2 }
    },
    'carneiro': {
        s1: { tipo:'linha', raio:2 },
        s2: { tipo:'area', raio:1 }
    },
    'cavalo_selvagem': {
        s1: { tipo:'linha', raio:2 },
        s2: { tipo:'area', raio:2 }
    },
    'touro_bravo': {
        s1: { tipo:'linha', raio:2 },
        s2: { tipo:'area', raio:2 }
    },
    'mula': {
        s1: { tipo:'custom', tiles:[{x:-1,y:-3},{x:0,y:-3},{x:1,y:-3},{x:-1,y:-2},{x:0,y:-2},{x:1,y:-2},{x:-1,y:-1},{x:0,y:-1},{x:1,y:-1},{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:-1,y:1},{x:0,y:1},{x:1,y:1},{x:-1,y:2},{x:0,y:2},{x:1,y:2},{x:-1,y:3},{x:0,y:3},{x:1,y:3}] },
        s2: { tipo:'custom', tiles:[{x:-2,y:0},{x:2,y:0},{x:0,y:-2},{x:0,y:2}] }
    },

    // ============ ATO 6 ============
    'urubu': {
        s1: { tipo:'linha', raio:2 },
        s2: { tipo:'custom', tiles:[{x:0,y:0}] }
    },
    'carcaara': {
        s1: { tipo:'area', raio:1 },
        s2: { tipo:'linha', raio:3 }
    },
    'tatu': {
        s1: { tipo:'area', raio:1 },
        s2: { tipo:'custom', tiles:[{x:0,y:0}] }
    },
    'lobo_guara': {
        s1: { tipo:'area', raio:2 },
        s2: { tipo:'linha', raio:2 }
    },
    'corpo_seco': {
        s1: { tipo:'custom', tiles:[{x:0,y:-1},{x:0,y:-2},{x:0,y:1},{x:0,y:2},{x:-1,y:0},{x:-2,y:0},{x:1,y:0},{x:2,y:0}] },
        s2: { tipo:'custom', tiles:[{x:-2,y:-2},{x:-1,y:-2},{x:0,y:-2},{x:1,y:-2},{x:2,y:-2},{x:-2,y:-1},{x:-1,y:-1},{x:0,y:-1},{x:1,y:-1},{x:2,y:-1},{x:-2,y:0},{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:-2,y:1},{x:-1,y:1},{x:0,y:1},{x:1,y:1},{x:2,y:1},{x:-2,y:2},{x:-1,y:2},{x:0,y:2},{x:1,y:2},{x:2,y:2}] }
    },

    // ============ ATO 7 ============
    'cachorro_mato': {
        s1: { tipo:'linha', raio:2 },
        s2: { tipo:'area', raio:1 }
    },
    'raposa': {
        s1: { tipo:'linha', raio:2 },
        s2: { tipo:'move_destino', move:2 }
    },
    'guaxinim': {
        s1: { tipo:'area', raio:1 },
        s2: { tipo:'linha', raio:3 }
    },
    'jaguatirica': {
        s1: { tipo:'area', raio:2 },
        s2: { tipo:'move_destino_area', move:2, raio:1 }
    },
    'lobisomem': {
        s1: { tipo:'area', raio:1 },
        s2: { tipo:'area', raio:2 }
    },

    // ============ ATO 8 ============
    'morcego': {
        s1: { tipo:'linha', raio:2 },
        s2: { tipo:'area', raio:1 }
    },
    'coruja': {
        s1: { tipo:'area', raio:1 },
        s2: { tipo:'linha', raio:3 }
    },
    'sapo_cururu': {
        s1: { tipo:'cruz', raio:2 },
        s2: { tipo:'linha', raio:2 }
    },
    'seriema': {
        s1: { tipo:'linha', raio:2 },
        s2: { tipo:'area', raio:2 }
    },
    'cuca': {
        s1: { tipo:'quadrante' },
        s2: { tipo:'cura' }
    },

    // ============ ATO 9 ============
    'tucunare': {
        s1: { tipo:'linha', raio:2 },
        s2: { tipo:'area', raio:1 }
    },
    'piraiba': {
        s1: { tipo:'linha', raio:2 },
        s2: { tipo:'area', raio:1 }
    },
    'dourada': {
        s1: { tipo:'area', raio:1 },
        s2: { tipo:'linha', raio:3 }
    },
    'peixe_boi': {
        s1: { tipo:'area', raio:2 },
        s2: { tipo:'linha', raio:2 }
    },
    'boto': {
        s1: { tipo:'area', raio:1 },
        s2: { tipo:'cruz_infinita' }
    },

    // ============ ATO 10 ============
    'bufalo': {
        s1: { tipo:'linha', raio:2 },
        s2: { tipo:'area', raio:2 }
    },
    'vaca_louca': {
        s1: { tipo:'linha', raio:2 },
        s2: { tipo:'area', raio:1 }
    },
    'cabra_preta': {
        s1: { tipo:'linha', raio:1 },
        s2: { tipo:'linha', raio:2 }
    },
    'zebu': {
        s1: { tipo:'linha', raio:2 },
        s2: { tipo:'area', raio:2 }
    },
    'boi': {
        s1: { tipo:'area', raio:1 },
        s2: { tipo:'custom', tiles:[{x:-3,y:-3},{x:-2,y:-3},{x:-1,y:-3},{x:0,y:-3},{x:1,y:-3},{x:2,y:-3},{x:3,y:-3},{x:-3,y:3},{x:-2,y:3},{x:-1,y:3},{x:0,y:3},{x:1,y:3},{x:2,y:3},{x:3,y:3},{x:-3,y:-2},{x:-3,y:-1},{x:-3,y:0},{x:-3,y:1},{x:-3,y:2},{x:3,y:-2},{x:3,y:-1},{x:3,y:0},{x:3,y:1},{x:3,y:2}] }
    },

    // ============ ATO 11 ============
    'gato_mato': {
        s1: { tipo:'area', raio:1 },
        s2: { tipo:'move_destino_area', move:2, raio:1 }
    },
    'mariposa_gigante': {
        s1: { tipo:'area', raio:2 },
        s2: { tipo:'linha', raio:3 }
    },
    'quati': {
        s1: { tipo:'area', raio:1 },
        s2: { tipo:'linha', raio:2 }
    },
    'sucuarana': {
        s1: { tipo:'area', raio:2 },
        s2: { tipo:'move_destino_area', move:2, raio:1 }
    },
    'jaci': {
        s1: { tipo:'global_elemento', elemento:'AR' },
        s2: { tipo:'global', cura: true }
    },

    // ============ ATO 12 ============
    'gaviao': {
        s1: { tipo:'linha', raio:3 },
        s2: { tipo:'area', raio:1 }
    },
    'falcao': {
        s1: { tipo:'custom', tiles:[{x:0,y:0}] },
        s2: { tipo:'area', raio:2 }
    },
    'urutau': {
        s1: { tipo:'area', raio:2 },
        s2: { tipo:'move_destino_area', move:3, raio:1 }
    },
    'aguia_cinzenta': {
        s1: { tipo:'area', raio:2 },
        s2: { tipo:'custom', tiles:[{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:0,y:-1},{x:0,y:1}] }
    },
    'guaraci': {
        s1: { tipo:'global_elemento', elemento:'FOGO' },
        s2: { tipo:'global', cura: true }
    },

    // ============ ATO 13 — Espectros ============
    'espectro_saci': { s1: { tipo:'global_elemento', elemento:'AR' }, s2: { tipo:'diagonal_infinita' } },
    'espectro_mapinguari': { s1: { tipo:'area', raio:2 }, s2: { tipo:'custom', tiles:[{x:-3,y:-1},{x:-2,y:-1},{x:-1,y:-1},{x:0,y:-1},{x:1,y:-1},{x:2,y:-1},{x:3,y:-1},{x:-3,y:0},{x:-2,y:0},{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0},{x:-3,y:1},{x:-2,y:1},{x:-1,y:1},{x:0,y:1},{x:1,y:1},{x:2,y:1},{x:3,y:1}] } },
    'espectro_iara': { s1: { tipo:'global' }, s2: { tipo:'cruz_infinita' } },
    'espectro_boitata': { s1: { tipo:'custom', tiles:[{x:-1,y:-3},{x:0,y:-3},{x:1,y:-3},{x:-1,y:-2},{x:0,y:-2},{x:1,y:-2},{x:-1,y:-1},{x:0,y:-1},{x:1,y:-1},{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:-1,y:1},{x:0,y:1},{x:1,y:1},{x:-1,y:2},{x:0,y:2},{x:1,y:2},{x:-1,y:3},{x:0,y:3},{x:1,y:3}] }, s2: { tipo:'custom', tiles:[{x:-2,y:-2},{x:2,y:-2},{x:-2,y:2},{x:2,y:2},{x:0,y:0}] } },
    'espectro_mula': { s1: { tipo:'custom', tiles:[{x:-1,y:-3},{x:0,y:-3},{x:1,y:-3},{x:-1,y:-2},{x:0,y:-2},{x:1,y:-2},{x:-1,y:-1},{x:0,y:-1},{x:1,y:-1},{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:-1,y:1},{x:0,y:1},{x:1,y:1},{x:-1,y:2},{x:0,y:2},{x:1,y:2},{x:-1,y:3},{x:0,y:3},{x:1,y:3}] }, s2: { tipo:'custom', tiles:[{x:-2,y:0},{x:2,y:0},{x:0,y:-2},{x:0,y:2}] } },
    'espectro_corposeco': { s1: { tipo:'custom', tiles:[{x:0,y:-1},{x:0,y:-2},{x:0,y:1},{x:0,y:2},{x:-1,y:0},{x:-2,y:0},{x:1,y:0},{x:2,y:0}] }, s2: { tipo:'custom', tiles:[{x:-2,y:-2},{x:-1,y:-2},{x:0,y:-2},{x:1,y:-2},{x:2,y:-2},{x:-2,y:-1},{x:-1,y:-1},{x:0,y:-1},{x:1,y:-1},{x:2,y:-1},{x:-2,y:0},{x:-1,y:0},{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:-2,y:1},{x:-1,y:1},{x:0,y:1},{x:1,y:1},{x:2,y:1},{x:-2,y:2},{x:-1,y:2},{x:0,y:2},{x:1,y:2},{x:2,y:2}] } },
    'espectro_lobisomem': { s1: { tipo:'area', raio:1 }, s2: { tipo:'area', raio:2 } },
    'espectro_cuca': { s1: { tipo:'quadrante' }, s2: { tipo:'cura' } },
    'espectro_boto': { s1: { tipo:'area', raio:1 }, s2: { tipo:'cruz_infinita' } },
    'espectro_boi': { s1: { tipo:'area', raio:1 }, s2: { tipo:'custom', tiles:[{x:-3,y:-3},{x:-2,y:-3},{x:-1,y:-3},{x:0,y:-3},{x:1,y:-3},{x:2,y:-3},{x:3,y:-3},{x:-3,y:3},{x:-2,y:3},{x:-1,y:3},{x:0,y:3},{x:1,y:3},{x:2,y:3},{x:3,y:3},{x:-3,y:-2},{x:-3,y:-1},{x:-3,y:0},{x:-3,y:1},{x:-3,y:2},{x:3,y:-2},{x:3,y:-1},{x:3,y:0},{x:3,y:1},{x:3,y:2}] } },
    'espectro_jaci': { s1: { tipo:'global_elemento', elemento:'AR' }, s2: { tipo:'global', cura: true } },
    'espectro_guaraci': { s1: { tipo:'global_elemento', elemento:'FOGO' }, s2: { tipo:'global', cura: true } },

    // ============ ATO 13 — Anhangá ============
    'anhanga': {
        s1: { tipo:'custom', tiles:[{x:0,y:-3},{x:0,y:-2},{x:0,y:-1},{x:0,y:0},{x:0,y:1},{x:0,y:2},{x:0,y:3},{x:2,y:-3},{x:2,y:-2},{x:2,y:-1},{x:2,y:0},{x:2,y:1},{x:2,y:2},{x:2,y:3},{x:-2,y:-3},{x:-2,y:-2},{x:-2,y:-1},{x:-2,y:0},{x:-2,y:1},{x:-2,y:2},{x:-2,y:3}] },
        s2: { tipo:'cura' }
    },
};

// =================================================================
// Desenha o mini-grid do alcance da skill (versão precisa)
// =================================================================
function getEnemySkillGridPrecise(enemyId, skillKey) {
    const enemy = STORY_ENEMIES[enemyId];
    if (!enemy) return '';
    const skill = enemy[skillKey];
    if (!skill) return '';

    const pattern = STORY_ENEMY_SKILL_PATTERNS[enemyId]?.[skillKey === 'skill1' ? 's1' : 's2'];
    if (!pattern) {
        // Fallback: usa o genérico antigo se não tiver pattern
        if (typeof getEnemySkillGrid === 'function') {
            return getEnemySkillGrid(enemyId, skillKey);
        }
        return '';
    }

    const gridSize = 8;
    const CX = 3, CY = 4;
    const afetados = Array.from({length: gridSize}, () => Array(gridSize).fill(false));

    // Elemento temático
    let themeEl = 'FOGO';
    if (pattern.elemento) themeEl = pattern.elemento;
    else if (enemyId.includes('espectro')) themeEl = 'AR';
    else if (enemyId.includes('iara') || enemyId.includes('boto') || enemyId.includes('piranha') ||
             enemyId.includes('pirarucu') || enemyId.includes('lontra') || enemyId.includes('ariranha') ||
             enemyId.includes('tucunare') || enemyId.includes('piraiba') || enemyId.includes('dourada') ||
             enemyId.includes('peixe_boi') || enemyId.includes('sapo')) themeEl = 'AGUA';
    else if (enemyId.includes('jaci') || enemyId.includes('urutau') || enemyId.includes('gaviao') ||
             enemyId.includes('falcao') || enemyId.includes('morcego') || enemyId.includes('mariposa')) themeEl = 'AR';
    else if (enemyId.includes('saci') || enemyId.includes('mapinguari') || enemyId.includes('tatu') ||
             enemyId.includes('anta') || enemyId.includes('queixada') || enemyId.includes('sucuri') ||
             enemyId.includes('tamandua') || enemyId.includes('cachorro') || enemyId.includes('raposa') ||
             enemyId.includes('guaxinim') || enemyId.includes('jaguatirica') || enemyId.includes('lobisomem') ||
             enemyId.includes('lobo_guara') || enemyId.includes('onca') || enemyId.includes('teperesik')) themeEl = 'TERRA';
    else if (enemyId.includes('boitata') || enemyId.includes('mula') || enemyId.includes('guaraci') ||
             enemyId.includes('corpo_seco') || enemyId.includes('cuca') || enemyId === 'anhanga') themeEl = 'FOGO';

    // Marca os tiles conforme o padrão
    const mark = (x, y) => {
        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) afetados[y][x] = true;
    };

    const t = pattern.tipo;
    if (t === 'linha') {
        // 4 direções cardeais até raio
        for (let i = 1; i <= (pattern.raio || 2); i++) {
            mark(CX + i, CY); mark(CX - i, CY); mark(CX, CY + i); mark(CX, CY - i);
        }
    } else if (t === 'area') {
        const r = pattern.raio || 1;
        for (let dx = -r; dx <= r; dx++) {
            for (let dy = -r; dy <= r; dy++) {
                if (dx === 0 && dy === 0) continue;
                mark(CX + dx, CY + dy);
            }
        }
    } else if (t === 'cruz') {
        for (let i = 1; i <= (pattern.raio || 1); i++) {
            mark(CX + i, CY); mark(CX - i, CY); mark(CX, CY + i); mark(CX, CY - i);
        }
    } else if (t === 'cruz_infinita') {
        for (let i = 1; i < gridSize; i++) {
            mark(CX + i, CY); mark(CX - i, CY); mark(CX, CY + i); mark(CX, CY - i);
        }
    } else if (t === 'diagonal_infinita') {
        for (let i = 1; i < gridSize; i++) {
            mark(CX + i, CY + i); mark(CX + i, CY - i);
            mark(CX - i, CY + i); mark(CX - i, CY - i);
        }
    } else if (t === 'global' || t === 'global_elemento') {
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (x !== CX || y !== CY) mark(x, y);
            }
        }
    } else if (t === 'quadrante') {
        // Quadrante 4×4 no canto superior esquerdo (representação)
        for (let y = 0; y <= 3; y++) {
            for (let x = 0; x <= 3; x++) {
                if (x !== CX || y !== CY) mark(x, y);
            }
        }
    } else if (t === 'cura') {
        // Mostra só o centro (auto-cura)
        mark(CX, CY);
    } else if (t === 'move_destino') {
        // Move + dano no destino
        const mv = pattern.move || 2;
        mark(CX, Math.max(0, CY - mv));
    } else if (t === 'move_destino_area') {
        const mv = pattern.move || 2;
        const ty = Math.max(0, CY - mv);
        const r = pattern.raio || 1;
        for (let dx = -r; dx <= r; dx++) {
            for (let dy = -r; dy <= r; dy++) {
                mark(CX + dx, ty + dy);
            }
        }
    } else if (t === 'custom') {
        (pattern.tiles || []).forEach(tile => mark(CX + tile.x, CY + tile.y));
    }

    const ELEMENT_COLORS = { FOGO:'bg-FOGO', AGUA:'bg-AGUA', TERRA:'bg-TERRA', AR:'bg-AR' };
    const baseClass = ELEMENT_COLORS[themeEl] || 'bg-FOGO';

    let html = '<div class="pa-mini-grid" style="grid-template-columns:repeat(8,18px);grid-template-rows:repeat(8,18px);gap:1px;">';
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const isEnemy = (x === CX && y === CY);
            const isAfetado = afetados[y][x];
            let cls = 'pa-mini-tile';
            if (isEnemy) cls += ' pa-mini-hero ' + baseClass;
            else if (isAfetado) cls += ' pa-mini-afetado ' + baseClass;
            else cls += ' pa-mini-vazio';
            html += `<div class="${cls}" style="width:18px;height:18px;font-size:11px;">${isEnemy ? '👹' : ''}</div>`;
        }
    }
    html += '</div>';
    return html;
}

// Substitui a função antiga pela nova
window.getEnemySkillGrid = getEnemySkillGridPrecise;
getEnemySkillGrid = getEnemySkillGridPrecise;

// Força o bestiário a re-renderizar se estiver aberto
(function refreshBestiaryIfOpen() {
    const ss = document.getElementById('storyScreen');
    if (ss && ss.classList.contains('active')) {
        // Só re-renderiza se estamos no bestiário (heurística)
        const title = ss.querySelector('.story-title');
        if (title && title.textContent.includes('BESTIÁRIO')) {
            if (typeof renderBestiaryScreen === 'function') renderBestiaryScreen();
        }
    }
})();

console.log('✅ Bestiário: padrões precisos das skills carregados.');
// =================================================================
// historia.js — V8.3 — TESOURARIA (Inventário + Forja + Amuletos)
// -----------------------------------------------------------------
// Contém:
//   1. Tabela de ARMAS (Tacape / Flecha / Cajado) — 39 armas
//   2. Tabela de AMULETOS — 13 amuletos (1 por ato, do boss)
//   3. Tabela de RECEITAS de craft (materiais + ouro)
//   4. Tabela de VENDA de materiais
//   5. UI da Tesouraria com 3 abas (Inventário / Forja / Amuletos)
//   6. Sistema de venda no Curandeiro (para materiais)
//   7. Sistema de equipar arma + amuleto por herói
//   8. Aplicação em batalha (ATK, HP, elemento, efeitos)
//   9. CSS completo
//
// ⚠️ Colar no FINAL do historia.js, sem substituir nada.
// =================================================================

// =================================================================
// 1. MATERIAIS — preço de venda
// =================================================================
// Preços: comum 2, raro 8, boss 30
const STORY_MATERIAL_PRICES = {
    // Comuns (drop 70-80%)
    espinho: 2, pele_jacare: 2, chifre_cervo: 2, garra_onca: 2,
    pelo_tamandua: 2, couro_anta: 2, cera_queixada: 2, escama_sucuri: 2,
    escama_piranha: 2, pelo_lontra: 2, pelo_ariranha: 2, escama_pirarucu: 2,
    pele_cascavel: 2, anel_coral: 2, pele_jararaca: 2, casco_tartaruga: 2,
    chifre_bode: 2, la_carneiro: 2, crina_cavalo: 2, chifre_touro: 2,
    pena_urubu: 2, pena_carcara: 2, placa_tatu: 2, pelo_lobo_guara: 2,
    pelo_cachorro_mato: 2, cauda_raposa: 2, mascara_guaxinim: 2, pelo_jaguatirica: 2,
    asa_morcego: 2, pena_coruja: 2, pele_sapo: 2, pena_seriema: 2,
    escama_tucunare: 2, escama_piraiba: 2, escama_dourada: 2, couro_peixe_boi: 2,
    chifre_bufalo: 2, sino_vaca: 2, chifre_cabra: 2, corcova_zebu: 2,
    pelo_gato_mato: 2, asa_mariposa: 2, mascara_quati: 2, pelo_sucuarana: 2,
    pena_gaviao: 2, pena_falcao: 2, pena_urutau: 2, pena_aguia: 2,

    // Raros (drop 10-40%)
    espinho_raro: 8, escama_brilhante: 8, chifre_ancestral: 8, garra_lendaria: 8,
    garra_tamandua: 8, chifre_anta: 8, presa_queixada: 8, pele_sucuri: 8,
    dente_piranha: 8, garra_lontra: 8, dente_ariranha: 8, lingua_pirarucu: 8,
    chocalho_cascavel: 8, veneno_coral: 8, presa_jararaca: 8, ovo_tartaruga: 8,
    pelo_bode: 8, chifre_carneiro: 8, casco_cavalo: 8, couro_touro: 8,
    bico_urubu: 8, garra_carcara: 8, garra_tatu: 8, presa_lobo_guara: 8,
    presa_cachorro_mato: 8, pelo_raposa: 8, garra_guaxinim: 8, garra_jaguatirica: 8,
    presa_morcego: 8, olho_coruja: 8, veneno_sapo: 8, bico_seriema: 8,
    dente_tucunare: 8, lingua_piraiba: 8, barbatana_dourada: 8, osso_peixe_boi: 8,
    couro_bufalo: 8, chifre_vaca: 8, pelo_cabra: 8, chifre_zebu: 8,
    garra_gato_mato: 8, po_mariposa: 8, cauda_quati: 8, garra_sucuarana: 8,
    garra_gaviao: 8, garra_falcao: 8, olho_urutau: 8, garra_aguia: 8,

    // Boss (drop 100%)
    gorro_saci: 30, amuleto_saci: 30,
    pelo_mapinguari: 30, amuleto_mapinguari: 30,
    joia_iara: 30, amuleto_iara: 30,
    escama_boitata: 30, amuleto_boitata: 30,
    ferradura_mula: 30, amuleto_mula: 30,
    osso_corpo_seco: 30, amuleto_corpo_seco: 30,
    pelo_lobisomem: 30, amuleto_lobisomem: 30,
    caldeirao_cuca: 30, amuleto_cuca: 30,
    flor_boto: 30, amuleto_boto: 30,
    chifre_boi: 30, amuleto_boi: 30,
    raio_lunar: 30, amuleto_jaci: 30,
    coroa_solar: 30, amuleto_guaraci: 30,
    fragmento_abismo: 30, essencia_anhanga: 30,
};

function getMaterialPrice(matId) {
    return STORY_MATERIAL_PRICES[matId] || 2;
}

// =================================================================
// 2. ARMAS — 3 arquétipos × 13 atos
// =================================================================
// Cada arma:
//   id, nome, tipo ('tacape'|'flecha'|'cajado'), ato, atkBonus,
//   custoOuro, receita (materiais), emoji
// =================================================================
const STORY_WEAPONS = {
    // ============ ATO 1 — Saci (Redemoinho) ============
    'tacape_1':  { id:'tacape_1',  nome:'Tacape do Redemoinho',   tipo:'tacape', ato:1, atkBonus:1, custoOuro:80,  emoji:'🪓', receita:{ espinho:3, pele_jacare:2 } },
    'flecha_1':  { id:'flecha_1',  nome:'Flecha do Redemoinho',   tipo:'flecha', ato:1, atkBonus:1, custoOuro:80,  emoji:'🏹', receita:{ espinho:3, chifre_cervo:2 } },
    'cajado_1':  { id:'cajado_1',  nome:'Cajado do Redemoinho',   tipo:'cajado', ato:1, atkBonus:1, custoOuro:80,  emoji:'🪄', receita:{ espinho:3, garra_onca:2 } },

    // ============ ATO 2 — Mapinguari ============
    'tacape_2':  { id:'tacape_2',  nome:'Tacape da Mata Fechada', tipo:'tacape', ato:2, atkBonus:1, custoOuro:80,  emoji:'🪓', receita:{ pelo_tamandua:3, couro_anta:2 } },
    'flecha_2':  { id:'flecha_2',  nome:'Flecha da Mata Fechada', tipo:'flecha', ato:2, atkBonus:1, custoOuro:80,  emoji:'🏹', receita:{ pelo_tamandua:3, cera_queixada:2 } },
    'cajado_2':  { id:'cajado_2',  nome:'Cajado da Mata Fechada', tipo:'cajado', ato:2, atkBonus:1, custoOuro:80,  emoji:'🪄', receita:{ pelo_tamandua:3, escama_sucuri:2 } },

    // ============ ATO 3 — Iara ============
    'tacape_3':  { id:'tacape_3',  nome:'Tacape do Rio',          tipo:'tacape', ato:3, atkBonus:1, custoOuro:80,  emoji:'🪓', receita:{ escama_piranha:3, pelo_lontra:2 } },
    'flecha_3':  { id:'flecha_3',  nome:'Flecha do Rio',          tipo:'flecha', ato:3, atkBonus:1, custoOuro:80,  emoji:'🏹', receita:{ escama_piranha:3, pelo_ariranha:2 } },
    'cajado_3':  { id:'cajado_3',  nome:'Cajado do Rio',          tipo:'cajado', ato:3, atkBonus:1, custoOuro:80,  emoji:'🪄', receita:{ escama_piranha:3, escama_pirarucu:2 } },

    // ============ ATO 4 — Boitatá ============
    'tacape_4':  { id:'tacape_4',  nome:'Tacape de Fogo',         tipo:'tacape', ato:4, atkBonus:1, custoOuro:150, emoji:'🪓', receita:{ pele_cascavel:3, anel_coral:2 } },
    'flecha_4':  { id:'flecha_4',  nome:'Flecha de Fogo',         tipo:'flecha', ato:4, atkBonus:1, custoOuro:150, emoji:'🏹', receita:{ pele_cascavel:3, pele_jararaca:2 } },
    'cajado_4':  { id:'cajado_4',  nome:'Cajado de Fogo',         tipo:'cajado', ato:4, atkBonus:1, custoOuro:150, emoji:'🪄', receita:{ pele_cascavel:3, casco_tartaruga:2 } },

    // ============ ATO 5 — Mula ============
    'tacape_5':  { id:'tacape_5',  nome:'Tacape do Curral',       tipo:'tacape', ato:5, atkBonus:1, custoOuro:150, emoji:'🪓', receita:{ chifre_bode:3, la_carneiro:2 } },
    'flecha_5':  { id:'flecha_5',  nome:'Flecha do Curral',       tipo:'flecha', ato:5, atkBonus:1, custoOuro:150, emoji:'🏹', receita:{ chifre_bode:3, crina_cavalo:2 } },
    'cajado_5':  { id:'cajado_5',  nome:'Cajado do Curral',       tipo:'cajado', ato:5, atkBonus:1, custoOuro:150, emoji:'🪄', receita:{ chifre_bode:3, chifre_touro:2 } },

    // ============ ATO 6 — Corpo Seco ============
    'tacape_6':  { id:'tacape_6',  nome:'Tacape do Sertão',       tipo:'tacape', ato:6, atkBonus:1, custoOuro:150, emoji:'🪓', receita:{ pena_urubu:3, pena_carcara:2 } },
    'flecha_6':  { id:'flecha_6',  nome:'Flecha do Sertão',       tipo:'flecha', ato:6, atkBonus:1, custoOuro:150, emoji:'🏹', receita:{ pena_urubu:3, placa_tatu:2 } },
    'cajado_6':  { id:'cajado_6',  nome:'Cajado do Sertão',       tipo:'cajado', ato:6, atkBonus:1, custoOuro:150, emoji:'🪄', receita:{ pena_urubu:3, pelo_lobo_guara:2 } },

    // ============ ATO 7 — Lobisomem ============
    'tacape_7':  { id:'tacape_7',  nome:'Tacape da Lua Cheia',    tipo:'tacape', ato:7, atkBonus:1, custoOuro:250, emoji:'🪓', receita:{ pelo_cachorro_mato:3, cauda_raposa:2 } },
    'flecha_7':  { id:'flecha_7',  nome:'Flecha da Lua Cheia',    tipo:'flecha', ato:7, atkBonus:1, custoOuro:250, emoji:'🏹', receita:{ pelo_cachorro_mato:3, mascara_guaxinim:2 } },
    'cajado_7':  { id:'cajado_7',  nome:'Cajado da Lua Cheia',    tipo:'cajado', ato:7, atkBonus:1, custoOuro:250, emoji:'🪄', receita:{ pelo_cachorro_mato:3, pelo_jaguatirica:2 } },

    // ============ ATO 8 — Cuca ============
    'tacape_8':  { id:'tacape_8',  nome:'Tacape do Pântano',      tipo:'tacape', ato:8, atkBonus:1, custoOuro:250, emoji:'🪓', receita:{ asa_morcego:3, pena_coruja:2 } },
    'flecha_8':  { id:'flecha_8',  nome:'Flecha do Pântano',      tipo:'flecha', ato:8, atkBonus:1, custoOuro:250, emoji:'🏹', receita:{ asa_morcego:3, pele_sapo:2 } },
    'cajado_8':  { id:'cajado_8',  nome:'Cajado do Pântano',      tipo:'cajado', ato:8, atkBonus:1, custoOuro:250, emoji:'🪄', receita:{ asa_morcego:3, pena_seriema:2 } },

    // ============ ATO 9 — Boto ============
    'tacape_9':  { id:'tacape_9',  nome:'Tacape do Remanso',      tipo:'tacape', ato:9, atkBonus:1, custoOuro:250, emoji:'🪓', receita:{ escama_tucunare:3, escama_piraiba:2 } },
    'flecha_9':  { id:'flecha_9',  nome:'Flecha do Remanso',      tipo:'flecha', ato:9, atkBonus:1, custoOuro:250, emoji:'🏹', receita:{ escama_tucunare:3, escama_dourada:2 } },
    'cajado_9':  { id:'cajado_9',  nome:'Cajado do Remanso',      tipo:'cajado', ato:9, atkBonus:1, custoOuro:250, emoji:'🪄', receita:{ escama_tucunare:3, couro_peixe_boi:2 } },

    // ============ ATO 10 — Boi ============
    'tacape_10': { id:'tacape_10', nome:'Tacape da Cara Preta',   tipo:'tacape', ato:10, atkBonus:1, custoOuro:400, emoji:'🪓', receita:{ chifre_bufalo:3, sino_vaca:2 } },
    'flecha_10': { id:'flecha_10', nome:'Flecha da Cara Preta',   tipo:'flecha', ato:10, atkBonus:1, custoOuro:400, emoji:'🏹', receita:{ chifre_bufalo:3, chifre_cabra:2 } },
    'cajado_10': { id:'cajado_10', nome:'Cajado da Cara Preta',   tipo:'cajado', ato:10, atkBonus:1, custoOuro:400, emoji:'🪄', receita:{ chifre_bufalo:3, corcova_zebu:2 } },

    // ============ ATO 11 — Jaci ============
    'tacape_11': { id:'tacape_11', nome:'Tacape Enluarado',       tipo:'tacape', ato:11, atkBonus:1, custoOuro:400, emoji:'🪓', receita:{ pelo_gato_mato:3, asa_mariposa:2 } },
    'flecha_11': { id:'flecha_11', nome:'Flecha Enluarada',       tipo:'flecha', ato:11, atkBonus:1, custoOuro:400, emoji:'🏹', receita:{ pelo_gato_mato:3, mascara_quati:2 } },
    'cajado_11': { id:'cajado_11', nome:'Cajado Enluarado',       tipo:'cajado', ato:11, atkBonus:1, custoOuro:400, emoji:'🪄', receita:{ pelo_gato_mato:3, pelo_sucuarana:2 } },

    // ============ ATO 12 — Guaraci ============
    'tacape_12': { id:'tacape_12', nome:'Tacape Solar',           tipo:'tacape', ato:12, atkBonus:1, custoOuro:400, emoji:'🪓', receita:{ pena_gaviao:3, pena_falcao:2 } },
    'flecha_12': { id:'flecha_12', nome:'Flecha Solar',           tipo:'flecha', ato:12, atkBonus:1, custoOuro:400, emoji:'🏹', receita:{ pena_gaviao:3, pena_urutau:2 } },
    'cajado_12': { id:'cajado_12', nome:'Cajado Solar',           tipo:'cajado', ato:12, atkBonus:1, custoOuro:400, emoji:'🪄', receita:{ pena_gaviao:3, pena_aguia:2 } },

    // ============ ATO 13 — Anhangá ============
    'tacape_13': { id:'tacape_13', nome:'Tacape do Abismo',       tipo:'tacape', ato:13, atkBonus:1, custoOuro:700, emoji:'🪓', receita:{ fragmento_abismo:2, essencia_anhanga:1 } },
    'flecha_13': { id:'flecha_13', nome:'Flecha do Abismo',       tipo:'flecha', ato:13, atkBonus:1, custoOuro:700, emoji:'🏹', receita:{ fragmento_abismo:2, essencia_anhanga:1 } },
    'cajado_13': { id:'cajado_13', nome:'Cajado do Abismo',       tipo:'cajado', ato:13, atkBonus:1, custoOuro:700, emoji:'🪄', receita:{ fragmento_abismo:2, essencia_anhanga:1 } },
};

// =================================================================
// 3. AMULETOS — 1 por ato, do boss
// =================================================================
// Cada amuleto:
//   id, nome, ato, custoOuro, receita (materiais + item único),
//   efeito: { elementOverride, hpBonus, atkBonus, healPerTurn }
// =================================================================
const STORY_AMULETS = {
    'amuleto_1':  { id:'amuleto_1',  nome:'Cachimbo do Saci',           ato:1,  custoOuro:150,  emoji:'🧿',
        receita:{ gorro_saci:1, espinho:3, pele_jacare:2 },
        efeito:{ elementOverride:'AR', hpBonus:2 } },

    'amuleto_2':  { id:'amuleto_2',  nome:'Presa do Mapinguari',        ato:2,  custoOuro:150,  emoji:'🧿',
        receita:{ pelo_mapinguari:1, pelo_tamandua:3, couro_anta:2 },
        efeito:{ hpBonus:3 } },

    'amuleto_3':  { id:'amuleto_3',  nome:'Concha da Iara',             ato:3,  custoOuro:150,  emoji:'🧿',
        receita:{ joia_iara:1, escama_piranha:3, escama_pirarucu:2 },
        efeito:{ elementOverride:'AGUA', hpBonus:2 } },

    'amuleto_4':  { id:'amuleto_4',  nome:'Escama do Boitatá',          ato:4,  custoOuro:250,  emoji:'🧿',
        receita:{ escama_boitata:1, pele_cascavel:3, casco_tartaruga:2 },
        efeito:{ elementOverride:'FOGO', hpBonus:2 } },

    'amuleto_5':  { id:'amuleto_5',  nome:'Ferradura da Mula',          ato:5,  custoOuro:250,  emoji:'🧿',
        receita:{ ferradura_mula:1, chifre_bode:3, chifre_touro:2 },
        efeito:{ atkBonus:1, hpBonus:2 } },

    'amuleto_6':  { id:'amuleto_6',  nome:'Osso do Corpo Seco',         ato:6,  custoOuro:250,  emoji:'🧿',
        receita:{ osso_corpo_seco:1, pena_urubu:3, pelo_lobo_guara:2 },
        efeito:{ hpBonus:3, healPerTurn:1 } },

    'amuleto_7':  { id:'amuleto_7',  nome:'Presa do Lobisomem',         ato:7,  custoOuro:400,  emoji:'🧿',
        receita:{ pelo_lobisomem:1, pelo_cachorro_mato:3, pelo_jaguatirica:2 },
        efeito:{ atkBonus:1, hpBonus:2 } },

    'amuleto_8':  { id:'amuleto_8',  nome:'Caldeirão da Cuca',          ato:8,  custoOuro:400,  emoji:'🧿',
        receita:{ caldeirao_cuca:1, asa_morcego:3, pena_coruja:2 },
        efeito:{ healPerTurn:2 } },

    'amuleto_9':  { id:'amuleto_9',  nome:'Flor do Boto',               ato:9,  custoOuro:400,  emoji:'🧿',
        receita:{ flor_boto:1, escama_tucunare:3, escama_dourada:2 },
        efeito:{ elementOverride:'AGUA', hpBonus:3 } },

    'amuleto_10': { id:'amuleto_10', nome:'Chifre do Boi da Cara Preta',ato:10, custoOuro:650,  emoji:'🧿',
        receita:{ chifre_boi:1, chifre_bufalo:3, corcova_zebu:2 },
        efeito:{ atkBonus:1, hpBonus:4 } },

    'amuleto_11': { id:'amuleto_11', nome:'Raio Lunar da Jaci',         ato:11, custoOuro:650,  emoji:'🧿',
        receita:{ raio_lunar:1, pelo_gato_mato:3, asa_mariposa:2 },
        efeito:{ elementOverride:'AR', hpBonus:3 } },

    'amuleto_12': { id:'amuleto_12', nome:'Coroa Solar do Guaraci',     ato:12, custoOuro:650,  emoji:'🧿',
        receita:{ coroa_solar:1, pena_gaviao:3, pena_aguia:2 },
        efeito:{ elementOverride:'FOGO', hpBonus:4 } },

    'amuleto_13': { id:'amuleto_13', nome:'Coração de Anhangá',         ato:13, custoOuro:1200, emoji:'🧿',
        receita:{ essencia_anhanga:1, fragmento_abismo:2 },
        efeito:{ atkBonus:2, hpBonus:5 } },
};

// =================================================================
// 4. HELPERS
// =================================================================

function getArchetypeFromHeroClass(heroClass) {
    const h = STORY_HERO_CLASSES[heroClass];
    if (!h) return null;
    if (h.role === 'Guerreiro') return 'tacape';
    if (h.role === 'Arqueiro')  return 'flecha';
    if (h.role === 'Mago')      return 'cajado';
    return null;
}

function getWeaponById(id) {
    return STORY_WEAPONS[id] || null;
}

function getAmuletById(id) {
    return STORY_AMULETS[id] || null;
}

function hasMaterials(recipe) {
    if (!recipe) return true;
    for (const [matId, qty] of Object.entries(recipe)) {
        const has = STORY_PROGRESS.inventory[matId] || 0;
        if (has < qty) return false;
    }
    return true;
}

function consumeMaterials(recipe) {
    if (!recipe) return;
    for (const [matId, qty] of Object.entries(recipe)) {
        STORY_PROGRESS.inventory[matId] -= qty;
        if (STORY_PROGRESS.inventory[matId] <= 0) {
            delete STORY_PROGRESS.inventory[matId];
        }
    }
}

function refundMaterials(recipe, percent = 0.5) {
    if (!recipe) return;
    for (const [matId, qty] of Object.entries(recipe)) {
        const refund = Math.floor(qty * percent);
        if (refund > 0) {
            addMaterial(matId, refund);
        }
    }
}

// =================================================================
// 5. CRAFTING
// =================================================================

function isWeaponCrafted(weaponId) {
    if (!Array.isArray(STORY_PROGRESS.craftedWeapons)) STORY_PROGRESS.craftedWeapons = [];
    return STORY_PROGRESS.craftedWeapons.includes(weaponId);
}

function isAmuletCrafted(amuletId) {
    if (!Array.isArray(STORY_PROGRESS.craftedAmulets)) STORY_PROGRESS.craftedAmulets = [];
    return STORY_PROGRESS.craftedAmulets.includes(amuletId);
}

function isWeaponAvailable(weaponId) {
    const w = getWeaponById(weaponId);
    if (!w) return false;
    // Disponível se o ato está desbloqueado
    return STORY_PROGRESS.unlockedChapters.includes(w.ato);
}

function isAmuletAvailable(amuletId) {
    const a = getAmuletById(amuletId);
    if (!a) return false;
    return STORY_PROGRESS.unlockedChapters.includes(a.ato);
}

function craftWeapon(weaponId) {
    const w = getWeaponById(weaponId);
    if (!w) return { ok:false, error:'Arma não encontrada.' };
    if (isWeaponCrafted(weaponId)) return { ok:false, error:'Você já forjou esta arma.' };
    if (!isWeaponAvailable(weaponId)) return { ok:false, error:'Ato ainda não desbloqueado.' };

    if (!hasMaterials(w.receita)) return { ok:false, error:'Materiais insuficientes.' };
    if ((STORY_PROGRESS.gold || 0) < w.custoOuro) return { ok:false, error:`Faltam ${w.custoOuro - (STORY_PROGRESS.gold||0)} de ouro.` };

    consumeMaterials(w.receita);
    STORY_PROGRESS.gold -= w.custoOuro;
    STORY_PROGRESS.craftedWeapons.push(weaponId);
    saveStoryProgress();
    return { ok:true };
}

function craftAmulet(amuletId) {
    const a = getAmuletById(amuletId);
    if (!a) return { ok:false, error:'Amuleto não encontrado.' };
    if (isAmuletCrafted(amuletId)) return { ok:false, error:'Você já forjou este amuleto.' };
    if (!isAmuletAvailable(amuletId)) return { ok:false, error:'Ato ainda não desbloqueado.' };

    if (!hasMaterials(a.receita)) return { ok:false, error:'Materiais insuficientes.' };
    if ((STORY_PROGRESS.gold || 0) < a.custoOuro) return { ok:false, error:`Faltam ${a.custoOuro - (STORY_PROGRESS.gold||0)} de ouro.` };

    consumeMaterials(a.receita);
    STORY_PROGRESS.gold -= a.custoOuro;
    STORY_PROGRESS.craftedAmulets.push(amuletId);
    saveStoryProgress();
    return { ok:true };
}

function dismantleWeapon(weaponId) {
    const w = getWeaponById(weaponId);
    if (!w) return { ok:false, error:'Arma não encontrada.' };
    if (!isWeaponCrafted(weaponId)) return { ok:false, error:'Você não tem essa arma.' };

    // Remove de quem estiver equipado
    for (const heroClass in STORY_PROGRESS.heroEquipment || {}) {
        if (STORY_PROGRESS.heroEquipment[heroClass].arma === weaponId) {
            STORY_PROGRESS.heroEquipment[heroClass].arma = null;
        }
    }

    refundMaterials(w.receita, 0.5);
    STORY_PROGRESS.craftedWeapons = STORY_PROGRESS.craftedWeapons.filter(id => id !== weaponId);
    saveStoryProgress();
    return { ok:true };
}

function dismantleAmulet(amuletId) {
    const a = getAmuletById(amuletId);
    if (!a) return { ok:false, error:'Amuleto não encontrado.' };
    if (!isAmuletCrafted(amuletId)) return { ok:false, error:'Você não tem esse amuleto.' };

    for (const heroClass in STORY_PROGRESS.heroEquipment || {}) {
        if (STORY_PROGRESS.heroEquipment[heroClass].amuleto === amuletId) {
            STORY_PROGRESS.heroEquipment[heroClass].amuleto = null;
        }
    }

    refundMaterials(a.receita, 0.5);
    STORY_PROGRESS.craftedAmulets = STORY_PROGRESS.craftedAmulets.filter(id => id !== amuletId);
    saveStoryProgress();
    return { ok:true };
}

// =================================================================
// 6. EQUIPAR / DESEQUIPAR
// =================================================================

function getHeroEquipment(heroClass) {
    if (!STORY_PROGRESS.heroEquipment) STORY_PROGRESS.heroEquipment = {};
    if (!STORY_PROGRESS.heroEquipment[heroClass]) {
        STORY_PROGRESS.heroEquipment[heroClass] = { arma: null, amuleto: null };
    }
    return STORY_PROGRESS.heroEquipment[heroClass];
}

function equipWeapon(heroClass, weaponId) {
    const w = getWeaponById(weaponId);
    if (!w) return { ok:false, error:'Arma não encontrada.' };
    if (!isWeaponCrafted(weaponId)) return { ok:false, error:'Você não tem essa arma.' };

    const expectedTipo = getArchetypeFromHeroClass(heroClass);
    if (w.tipo !== expectedTipo) {
        return { ok:false, error:`${STORY_HERO_CLASSES[heroClass].displayName} não pode usar ${w.tipo}.` };
    }

    // Se outro herói está usando, desequipa
    for (const hc in STORY_PROGRESS.heroEquipment) {
        if (hc !== heroClass && STORY_PROGRESS.heroEquipment[hc].arma === weaponId) {
            STORY_PROGRESS.heroEquipment[hc].arma = null;
        }
    }

    getHeroEquipment(heroClass).arma = weaponId;
    saveStoryProgress();
    return { ok:true };
}

function equipAmulet(heroClass, amuletId) {
    const a = getAmuletById(amuletId);
    if (!a) return { ok:false, error:'Amuleto não encontrado.' };
    if (!isAmuletCrafted(amuletId)) return { ok:false, error:'Você não tem esse amuleto.' };

    for (const hc in STORY_PROGRESS.heroEquipment) {
        if (hc !== heroClass && STORY_PROGRESS.heroEquipment[hc].amuleto === amuletId) {
            STORY_PROGRESS.heroEquipment[hc].amuleto = null;
        }
    }

    getHeroEquipment(heroClass).amuleto = amuletId;
    saveStoryProgress();
    return { ok:true };
}

function unequipWeapon(heroClass) {
    getHeroEquipment(heroClass).arma = null;
    saveStoryProgress();
}

function unequipAmulet(heroClass) {
    getHeroEquipment(heroClass).amuleto = null;
    saveStoryProgress();
}

// =================================================================
// 7. APLICAR EQUIPAMENTO EM BATALHA
// =================================================================
// Chamado junto com applyHeroLevelBonus no initStoryBattle.
// =================================================================
function applyHeroEquipment(player) {
    if (!player) return;
    const eq = getHeroEquipment(player.class);

    // Aplica arma
    if (eq.arma) {
        const w = getWeaponById(eq.arma);
        if (w) {
            player.bonusAtk = (player.bonusAtk || 0) + w.atkBonus;
            player.equippedWeapon = w;
        }
    }

    // Aplica amuleto
    if (eq.amuleto) {
        const a = getAmuletById(eq.amuleto);
        if (a) {
            const ef = a.efeito;
            if (ef.hpBonus) {
                player.maxHp += ef.hpBonus;
                player.hp = player.maxHp;
            }
            if (ef.atkBonus) {
                player.bonusAtk = (player.bonusAtk || 0) + ef.atkBonus;
            }
            if (ef.elementOverride) {
                player.element = ef.elementOverride;
            }
            player.equippedAmulet = a;
            player.healPerTurn = (player.healPerTurn || 0) + (ef.healPerTurn || 0);
        }
    }
}

// Hook: aplica equipamento ao criar players em batalha
(function hookApplyEquipment() {
    const _origApplyLevel = window.applyHeroLevelBonus;
    if (typeof _origApplyLevel === 'function') {
        window.applyHeroLevelBonus = function(player) {
            _origApplyLevel.apply(this, arguments);
            applyHeroEquipment(player);
        };
    } else {
        // Se não existe, criamos o hook direto no initStoryBattle
        const _origInit = window.initStoryBattle;
        if (typeof _origInit === 'function') {
            window.initStoryBattle = async function() {
                await _origInit.apply(this, arguments);
                if (Array.isArray(players)) {
                    players.forEach(p => applyHeroEquipment(p));
                    if (typeof updateHeroCard === 'function') updateHeroCard();
                }
            };
        }
    }
})();

// =================================================================
// 8. UI DA TESOURARIA (3 abas)
// =================================================================

let tesourariaTab = 'inventario';

function renderTesourariaScreen() {
    const screen = document.getElementById('storyScreen');
    if (!screen) return;

    // Mapa de materiais
    const inv = STORY_PROGRESS.inventory || {};
    const materialIds = Object.keys(inv).filter(id => inv[id] > 0);

    // Cabeçalho
    const totalXP = STORY_PROGRESS.totalXP || 0;
    const totalGold = STORY_PROGRESS.gold || 0;

    // Aba ativa
    let contentHTML = '';
    if (tesourariaTab === 'inventario') {
        contentHTML = renderTesourariaInventario(materialIds);
    } else if (tesourariaTab === 'forja') {
        contentHTML = renderTesourariaForja();
    } else if (tesourariaTab === 'amuletos') {
        contentHTML = renderTesourariaAmuletos();
    }

    screen.innerHTML = `
        <div class="story-container">
            <div class="story-header">
                <h1 class="story-title">🏛️ TESOURARIA</h1>
                <p class="story-subtitle">Inventário, forja e amuletos.</p>
                <div style="text-align:center;margin-top:15px;display:flex;gap:15px;justify-content:center;flex-wrap:wrap;">
                    <span class="story-stars-counter" style="background:rgba(58,42,24,.9);border:1px solid #6a5024;padding:8px 14px;border-radius:20px;font-family:'Cinzel',serif;font-weight:700;color:#e8b923;">
                        ${uiIcon('xp')} ${totalXP} XP
                    </span>
                    <span class="story-stars-counter" style="background:rgba(58,42,24,.9);border:1px solid #6a5024;padding:8px 14px;border-radius:20px;font-family:'Cinzel',serif;font-weight:700;color:#e8b923;">
                        ${uiIcon('gold')} ${totalGold}
                    </span>
                </div>
            </div>
            <div class="tesouraria-tabs">
                <button class="tesouraria-tab ${tesourariaTab === 'inventario' ? 'active' : ''}" onclick="tesourariaTab='inventario'; renderTesourariaScreen();">📦 Inventário</button>
                <button class="tesouraria-tab ${tesourariaTab === 'forja' ? 'active' : ''}" onclick="tesourariaTab='forja'; renderTesourariaScreen();">⚔️ Forja de Armas</button>
                <button class="tesouraria-tab ${tesourariaTab === 'amuletos' ? 'active' : ''}" onclick="tesourariaTab='amuletos'; renderTesourariaScreen();">🧿 Forja de Amuletos</button>
            </div>
            <div class="tesouraria-content">${contentHTML}</div>
            <div class="story-footer"><button class="story-back-btn" onclick="renderAldeiaScreen()">← VOLTAR À ALDEIA</button></div>
        </div>
    `;
}

// ---- Aba Inventário ----
function renderTesourariaInventario(materialIds) {
    if (materialIds.length === 0) {
        return `
            <div class="tesouraria-empty">
                <div class="tesouraria-empty-icon">📦</div>
                <div class="tesouraria-empty-text">Seu inventário está vazio.</div>
                <div class="tesouraria-empty-hint">Derrote inimigos nas fases para coletar materiais.</div>
            </div>`;
    }

    // Ordena por preço (decrescente)
    materialIds.sort((a, b) => getMaterialPrice(b) - getMaterialPrice(a));

    const totalValue = materialIds.reduce((sum, id) => sum + getMaterialPrice(id) * (inv_count(id) || 0), 0);

    function inv_count(id) { return STORY_PROGRESS.inventory[id] || 0; }

    const cardsHTML = materialIds.map(id => {
        const m = STORY_MATERIALS[id];
        const qty = STORY_PROGRESS.inventory[id];
        const price = getMaterialPrice(id);
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
}

// ---- Aba Forja ----
function renderTesourariaForja() {
    // Lista todas as armas dos atos desbloqueados
    const allWeapons = Object.values(STORY_WEAPONS).filter(w => isWeaponAvailable(w.id));

    if (allWeapons.length === 0) {
        return `<div class="tesouraria-empty">
            <div class="tesouraria-empty-icon">⚔️</div>
            <div class="tesouraria-empty-text">Nenhuma forja liberada ainda.</div>
            <div class="tesouraria-empty-hint">Complete fases para liberar receitas.</div>
        </div>`;
    }

    const cardsHTML = allWeapons.map(w => {
        const crafted = isWeaponCrafted(w.id);
        const canCraft = hasMaterials(w.receita) && (STORY_PROGRESS.gold || 0) >= w.custoOuro;

        // Lista de materiais
        const recHTML = Object.entries(w.receita).map(([matId, qty]) => {
            const m = STORY_MATERIALS[matId];
            if (!m) return '';
            const has = STORY_PROGRESS.inventory[matId] || 0;
            const ok = has >= qty ? 'ok' : 'no';
            return `<span class="forge-recipe-mat ${ok}">${m.emoji} ${has}/${qty}</span>`;
        }).join('');

        let actionHTML = '';
        if (crafted) {
            actionHTML = `
                <div class="forge-forged-tag">✅ Forjada</div>
                <button class="forge-btn danger" onclick="handleDismantleWeapon('${w.id}')">🔥 Desmanchar</button>`;
        } else {
            actionHTML = `
                <div class="forge-ouro ${canCraft ? 'ok' : 'no'}">${uiIcon('gold')} ${w.custoOuro}</div>
                <button class="forge-btn" ${canCraft ? '' : 'disabled'} onclick="handleCraftWeapon('${w.id}')">
                    ${canCraft ? '🔨 Forjar' : '✕ Sem recursos'}
                </button>`;
        }

        const tipoLabel = { tacape:'Tacape', flecha:'Flecha', cajado:'Cajado' }[w.tipo];

        return `
            <div class="forge-card ${crafted ? 'crafted' : ''}">
                <div class="forge-card-header">
                    <div class="forge-emoji">${w.emoji}</div>
                    <div class="forge-info">
                        <div class="forge-name">${w.nome}</div>
                        <div class="forge-meta">Ato ${w.ato} · ${tipoLabel} · +${w.atkBonus} ATK</div>
                    </div>
                </div>
                <div class="forge-recipe">${recHTML}</div>
                <div class="forge-actions">${actionHTML}</div>
            </div>`;
    }).join('');

    return `<div class="forge-grid">${cardsHTML}</div>`;
}

// ---- Aba Amuletos ----
function renderTesourariaAmuletos() {
    const allAmulets = Object.values(STORY_AMULETS).filter(a => isAmuletAvailable(a.id));

    if (allAmulets.length === 0) {
        return `<div class="tesouraria-empty">
            <div class="tesouraria-empty-icon">🧿</div>
            <div class="tesouraria-empty-text">Nenhum amuleto liberado ainda.</div>
            <div class="tesouraria-empty-hint">Derrote o boss do ato para revelar o amuleto.</div>
        </div>`;
    }

    const cardsHTML = allAmulets.map(a => {
        const crafted = isAmuletCrafted(a.id);
        const canCraft = hasMaterials(a.receita) && (STORY_PROGRESS.gold || 0) >= a.custoOuro;

        const recHTML = Object.entries(a.receita).map(([matId, qty]) => {
            const m = STORY_MATERIALS[matId];
            if (!m) return '';
            const has = STORY_PROGRESS.inventory[matId] || 0;
            const ok = has >= qty ? 'ok' : 'no';
            return `<span class="forge-recipe-mat ${ok}">${m.emoji} ${has}/${qty}</span>`;
        }).join('');

        // Efeitos em texto
        const ef = a.efeito;
        let efHTML = [];
        if (ef.elementOverride) efHTML.push(`🎨 Elemento → ${ef.elementOverride}`);
        if (ef.hpBonus)         efHTML.push(`❤️ +${ef.hpBonus} HP`);
        if (ef.atkBonus)        efHTML.push(`⚔️ +${ef.atkBonus} ATK`);
        if (ef.healPerTurn)     efHTML.push(`💚 Cura ${ef.healPerTurn} HP/turno`);

        let actionHTML = '';
        if (crafted) {
            actionHTML = `
                <div class="forge-forged-tag">✅ Forjado</div>
                <button class="forge-btn danger" onclick="handleDismantleAmulet('${a.id}')">🔥 Desmanchar</button>`;
        } else {
            actionHTML = `
                <div class="forge-ouro ${canCraft ? 'ok' : 'no'}">${uiIcon('gold')} ${a.custoOuro}</div>
                <button class="forge-btn" ${canCraft ? '' : 'disabled'} onclick="handleCraftAmulet('${a.id}')">
                    ${canCraft ? '🔨 Forjar' : '✕ Sem recursos'}
                </button>`;
        }

        return `
            <div class="forge-card ${crafted ? 'crafted amulet' : 'amulet'}">
                <div class="forge-card-header">
                    <div class="forge-emoji">${a.emoji}</div>
                    <div class="forge-info">
                        <div class="forge-name">${a.nome}</div>
                        <div class="forge-meta">Ato ${a.ato}</div>
                    </div>
                </div>
                <div class="forge-effects">${efHTML.join(' · ')}</div>
                <div class="forge-recipe">${recHTML}</div>
                <div class="forge-actions">${actionHTML}</div>
            </div>`;
    }).join('');

    return `<div class="forge-grid">${cardsHTML}</div>`;
}

// ---- Handlers ----
function handleCraftWeapon(id) {
    const r = craftWeapon(id);
    if (!r.ok) { showToast('❌ Não foi possível', r.error, '❌'); return; }
    const w = getWeaponById(id);
    showToast('🔨 Arma forjada!', `${w.emoji} ${w.nome}`, '🔨');
    try { playSfx('win'); } catch(e) {}
    renderTesourariaScreen();
}

function handleCraftAmulet(id) {
    const r = craftAmulet(id);
    if (!r.ok) { showToast('❌ Não foi possível', r.error, '❌'); return; }
    const a = getAmuletById(id);
    showToast('🔨 Amuleto forjado!', `${a.emoji} ${a.nome}`, '🔨');
    try { playSfx('win'); } catch(e) {}
    renderTesourariaScreen();
}

function handleDismantleWeapon(id) {
    const w = getWeaponById(id);
    if (!w) return;
    if (!confirm(`Desmanchar "${w.nome}"?\n\nVocê receberá 50% dos materiais de volta.`)) return;
    const r = dismantleWeapon(id);
    if (!r.ok) { showToast('❌ Não foi possível', r.error, '❌'); return; }
    showToast('🔥 Desmanchada', `50% dos materiais devolvidos.`, '🔥');
    renderTesourariaScreen();
}

function handleDismantleAmulet(id) {
    const a = getAmuletById(id);
    if (!a) return;
    if (!confirm(`Desmanchar "${a.nome}"?\n\nVocê receberá 50% dos materiais de volta.`)) return;
    const r = dismantleAmulet(id);
    if (!r.ok) { showToast('❌ Não foi possível', r.error, '❌'); return; }
    showToast('🔥 Desmanchado', `50% dos materiais devolvidos.`, '🔥');
    renderTesourariaScreen();
}

// =================================================================
// 9. CURANDEIRO — Venda de materiais
// =================================================================

function renderLojaScreenCompleta() {
    const screen = document.getElementById('storyScreen');
    if (!screen) return;
    const gold = STORY_PROGRESS.gold || 0;

    // Compra (itens fixos)
    const buyHTML = STORY_SHOP_ITEMS.map(it => {
        const m = STORY_MATERIALS[it.id];
        const emoji = m ? m.emoji : (it.emoji || '❓');
        const can = gold >= it.price;
        return `<div class="story-shop-item ${can?'':'disabled'}">
            <div class="story-shop-emoji">${emoji}</div>
            <div class="story-shop-name">${it.name}</div>
            <div class="story-shop-desc">${it.description}</div>
            <div class="story-shop-price">${uiIcon('gold')} ${it.price}</div>
            <button class="story-shop-btn" ${can?'':'disabled'} onclick="buyShopItem('${it.id}',${it.price})">COMPRAR</button>
        </div>`;
    }).join('');

    // Venda (inventário)
    const inv = STORY_PROGRESS.inventory || {};
    const sellIds = Object.keys(inv).filter(id => inv[id] > 0);

    let sellHTML = '';
    if (sellIds.length === 0) {
        sellHTML = '<div class="tesouraria-empty" style="margin:0;padding:30px;"><div class="tesouraria-empty-text">Nenhum material para vender.</div></div>';
    } else {
        sellIds.sort((a, b) => getMaterialPrice(b) - getMaterialPrice(a));
        sellHTML = '<div class="sell-grid">' + sellIds.map(id => {
            const m = STORY_MATERIALS[id];
            const qty = inv[id];
            const price = getMaterialPrice(id);
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
}

let curandeiroTab = 'comprar';

function handleSellMaterial(matId, qty) {
    const inv = STORY_PROGRESS.inventory[matId] || 0;
    if (inv < qty) { showToast('❌', 'Quantidade insuficiente.', '❌'); return; }
    const price = getMaterialPrice(matId) * qty;
    STORY_PROGRESS.inventory[matId] -= qty;
    if (STORY_PROGRESS.inventory[matId] <= 0) delete STORY_PROGRESS.inventory[matId];
    addGold(price);
    saveStoryProgress();
    const m = STORY_MATERIALS[matId];
    showToast('💰 Vendido!', `${m.emoji} ${m.name} ×${qty} → +${price} ouro`, '💰');
    renderLojaScreenCompleta();
}

// Hook: substitui renderLojaScreen pra usar a versão com abas
(function patchLojaWithSell() {
    if (typeof window.renderLojaScreen === 'function') {
        window.renderLojaScreen = renderLojaScreenCompleta;
    }
})();

// =================================================================
// 10. INTEGRAÇÃO NO PAINEL DE DETALHES DO HERÓI (equipar)
// =================================================================
(function patchHeroDetailsWithEquipment() {
    if (typeof window.openHeroDetails !== 'function') {
        console.warn('[story] openHeroDetails não existe, pulando patch de equipamento.');
        return;
    }

    const _origOpen = window.openHeroDetails;
    window.openHeroDetails = function(heroClass) {
        // Chama o original primeiro
        _origOpen.apply(this, arguments);

        // Depois injeta a seção de equipamento no painel
        const panel = document.querySelector('.hero-details-panel');
        if (!panel) return;

        const eq = getHeroEquipment(heroClass);
        const archetype = getArchetypeFromHeroClass(heroClass);

        // Armas compatíveis
        const availableWeapons = (STORY_PROGRESS.craftedWeapons || [])
            .map(id => getWeaponById(id))
            .filter(w => w && w.tipo === archetype);

        // Todos os amuletos forjados
        const availableAmulets = (STORY_PROGRESS.craftedAmulets || [])
            .map(id => getAmuletById(id))
            .filter(Boolean);

        const weaponOptions = ['<option value="">— Nenhuma —</option>']
            .concat(availableWeapons.map(w => `<option value="${w.id}" ${eq.arma === w.id ? 'selected' : ''}>${w.nome} (+${w.atkBonus} ATK)</option>`))
            .join('');

        const amuletOptions = ['<option value="">— Nenhum —</option>']
            .concat(availableAmulets.map(a => `<option value="${a.id}" ${eq.amuleto === a.id ? 'selected' : ''}>${a.nome}</option>`))
            .join('');

        const eqHTML = `
            <div class="hero-details-section">
                <div class="hero-details-section-title">⚔️ EQUIPAMENTO</div>
                <div class="equip-row">
                    <label class="equip-label">Arma</label>
                    <select class="equip-select" onchange="handleEquipWeapon('${heroClass.replace(/'/g,"\\'")}', this.value)">
                        ${weaponOptions}
                    </select>
                </div>
                <div class="equip-row">
                    <label class="equip-label">Amuleto</label>
                    <select class="equip-select" onchange="handleEquipAmulet('${heroClass.replace(/'/g,"\\'")}', this.value)">
                        ${amuletOptions}
                    </select>
                </div>
                ${availableWeapons.length === 0 && availableAmulets.length === 0
                    ? '<div class="equip-empty">Forje armas e amuletos na <b>Tesouraria</b> pra equipar aqui.</div>'
                    : ''}
            </div>`;

        // Insere antes da seção de NOTAS (último filho)
        const notas = panel.querySelector('.hero-details-notes');
        if (notas) {
            notas.insertAdjacentHTML('beforebegin', eqHTML);
        } else {
            panel.insertAdjacentHTML('beforeend', eqHTML);
        }
    };

    console.log('✅ Painel do herói patcheado com Equipamento.');
})();

function handleEquipWeapon(heroClass, weaponId) {
    if (!weaponId) {
        unequipWeapon(heroClass);
        showToast('⚔️', 'Arma removida.', '⚔️');
        return;
    }
    const r = equipWeapon(heroClass, weaponId);
    if (!r.ok) { showToast('❌', r.error, '❌'); return; }
    const w = getWeaponById(weaponId);
    showToast('⚔️ Equipado!', `${w.emoji} ${w.nome}`, '⚔️');
}

function handleEquipAmulet(heroClass, amuletId) {
    if (!amuletId) {
        unequipAmulet(heroClass);
        showToast('🧿', 'Amuleto removido.', '🧿');
        return;
    }
    const r = equipAmulet(heroClass, amuletId);
    if (!r.ok) { showToast('❌', r.error, '❌'); return; }
    const a = getAmuletById(amuletId);
    showToast('🧿 Equipado!', `${a.emoji} ${a.nome}`, '🧿');
}

// =================================================================
// 11. CSS
// =================================================================
(function injectTesourariaCSS() {
    if (document.getElementById('tesourariaStyle')) return;
    const style = document.createElement('style');
    style.id = 'tesourariaStyle';
    style.textContent = `
        /* ---- Tabs ---- */
        .tesouraria-tabs, .curandeiro-tabs {
            display: flex; justify-content: center;
            gap: 12px; flex-wrap: wrap; margin-bottom: 24px;
        }
        .tesouraria-tab, .curandeiro-tab {
            padding: 10px 20px;
            background: linear-gradient(135deg, #3d2d18, #2a1f10);
            color: #c8b787; border: 1px solid #6a5024;
            border-radius: 24px; cursor: pointer;
            font-family: 'Cinzel', serif;
            font-weight: 700; font-size: 0.9rem;
            letter-spacing: 1px; transition: all 0.2s;
        }
        .tesouraria-tab:hover, .curandeiro-tab:hover {
            color: #e8dcc4; border-color: #c9a227;
        }
        .tesouraria-tab.active, .curandeiro-tab.active {
            background: linear-gradient(180deg, rgba(232,185,35,.2), transparent 45%),
                        linear-gradient(135deg, #6a5024, #3d2d18);
            color: #fff5dc; border-color: #e8b923;
            box-shadow: 0 0 15px rgba(232,185,35,.35);
        }

        /* ---- Inventário ---- */
        .tesouraria-total {
            text-align: center;
            font-family: 'Cinzel', serif;
            color: #d9c89a; font-size: 1rem;
            padding: 12px;
            background: rgba(10,6,2,.5);
            border-radius: 6px;
            border: 1px solid rgba(201,162,39,.3);
            margin-bottom: 20px;
        }
        .tesouraria-total b { color: #e8b923; }
        .tesouraria-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 12px;
        }
        .tesouraria-item {
            background: rgba(10,6,2,.6);
            border: 1px solid rgba(201,162,39,.25);
            border-radius: 8px;
            padding: 12px 8px;
            text-align: center;
            transition: all 0.2s;
        }
        .tesouraria-item:hover {
            border-color: #c9a227;
            transform: translateY(-2px);
        }
        .tesouraria-item-icon { font-size: 2rem; line-height: 1; margin-bottom: 6px; }
        .tesouraria-item-name {
            font-family: 'EB Garamond', serif;
            color: #d9c89a; font-size: 0.85rem;
            margin-bottom: 4px;
            line-height: 1.2;
        }
        .tesouraria-item-qty {
            font-family: 'Cinzel', serif;
            color: #e8b923; font-weight: 700;
            font-size: 1rem; margin-bottom: 4px;
        }
        .tesouraria-item-price {
            font-family: 'Cinzel', serif;
            color: #8a7a52; font-size: 0.75rem;
        }
        .tesouraria-item-price img { width: 12px; height: 12px; vertical-align: middle; }

        .tesouraria-hint {
            text-align: center;
            font-family: 'EB Garamond', serif;
            color: #8a7a52; font-size: 0.9rem;
            font-style: italic;
            margin-top: 20px;
            padding: 10px;
        }

        /* ---- Empty ---- */
        .tesouraria-empty {
            text-align: center;
            padding: 60px 20px;
            background: rgba(10,6,2,.4);
            border: 2px dashed #3d2d18;
            border-radius: 8px;
        }
        .tesouraria-empty-icon { font-size: 4rem; opacity: 0.5; margin-bottom: 16px; }
        .tesouraria-empty-text {
            font-family: 'Cinzel', serif;
            color: #8a7a52; font-size: 1.1rem;
            margin-bottom: 8px;
        }
        .tesouraria-empty-hint {
            font-family: 'EB Garamond', serif;
            color: #6a5024; font-size: 0.9rem;
            font-style: italic;
        }

        /* ---- Forja ---- */
        .forge-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 16px;
        }
        .forge-card {
            background: linear-gradient(180deg, rgba(201,162,39,.06), transparent 40%),
                        linear-gradient(180deg, rgba(42,31,16,.95), rgba(26,18,8,.95));
            border: 2px solid #3d2d18;
            border-radius: 8px;
            padding: 14px;
            display: flex; flex-direction: column; gap: 10px;
            transition: all 0.3s;
        }
        .forge-card:hover { border-color: #6a5024; }
        .forge-card.crafted { border-color: #4a7040; }
        .forge-card.amulet { border-color: #6a2a8a; }
        .forge-card.amulet.crafted { border-color: #8a4aba; }

        .forge-card-header {
            display: flex; align-items: center; gap: 10px;
        }
        .forge-emoji { font-size: 2rem; line-height: 1; }
        .forge-info { flex: 1; min-width: 0; }
        .forge-name {
            font-family: 'Cinzel', serif;
            color: #f0e2c0; font-size: 1rem;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }
        .forge-meta {
            font-family: 'EB Garamond', serif;
            color: #b8a577; font-size: 0.8rem;
            font-style: italic;
        }
        .forge-effects {
            font-family: 'EB Garamond', serif;
            color: #8ac070; font-size: 0.85rem;
            padding: 6px 10px;
            background: rgba(107,163,92,.1);
            border-left: 3px solid #6ba35c;
            border-radius: 4px;
        }
        .forge-recipe {
            display: flex; flex-wrap: wrap; gap: 6px;
        }
        .forge-recipe-mat {
            display: inline-flex; align-items: center;
            gap: 4px; padding: 3px 8px;
            font-family: 'EB Garamond', serif;
            font-size: 0.8rem;
            background: rgba(10,6,2,.5);
            border-radius: 12px;
        }
        .forge-recipe-mat.ok { color: #8ac070; border: 1px solid rgba(107,163,92,.5); }
        .forge-recipe-mat.no { color: #d05050; border: 1px solid rgba(168,50,50,.5); }
        .forge-ouro {
            text-align: center;
            font-family: 'Cinzel', serif;
            font-size: 0.9rem; font-weight: 700;
            padding: 6px;
        }
        .forge-ouro.ok { color: #8ac070; }
        .forge-ouro.no { color: #d05050; }
        .forge-ouro img { width: 16px; height: 16px; vertical-align: middle; }
        .forge-actions {
            display: flex; flex-direction: column; gap: 6px;
            margin-top: auto;
        }
        .forge-forged-tag {
            text-align: center;
            font-family: 'Cinzel', serif;
            color: #8ac070; font-size: 0.85rem;
            letter-spacing: 1px;
        }
        .forge-btn {
            padding: 10px;
            background: linear-gradient(180deg, rgba(232,185,35,.25), transparent 45%),
                        linear-gradient(135deg, #8a6a2e, #4a3418);
            color: #fff5dc; border: 2px solid #e8b923;
            border-radius: 4px; cursor: pointer;
            font-family: 'Cinzel', serif; font-weight: 700;
            font-size: 0.9rem; letter-spacing: 1.5px;
            transition: all 0.2s;
        }
        .forge-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(0,0,0,.6), 0 0 25px rgba(232,185,35,.5);
        }
        .forge-btn:disabled {
            background: #2a1f10; color: #6a5024;
            border-color: #3d2d18; cursor: not-allowed;
        }
        .forge-btn.danger {
            background: linear-gradient(180deg, rgba(232,80,80,.2), transparent 45%),
                        linear-gradient(135deg, #6a2020, #3a1010);
            border-color: #a83232; color: #f5c8c8;
        }
        .forge-btn.danger:hover {
            box-shadow: 0 6px 18px rgba(0,0,0,.6), 0 0 25px rgba(168,50,50,.5);
        }

        /* ---- Venda no Curandeiro ---- */
        .sell-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 12px;
        }
        .sell-card {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 14px;
            background: rgba(10,6,2,.5);
            border: 1px solid rgba(201,162,39,.25);
            border-radius: 6px;
        }
        .sell-icon { font-size: 1.8rem; line-height: 1; }
        .sell-info { flex: 1; min-width: 0; }
        .sell-name {
            font-family: 'EB Garamond', serif;
            color: #d9c89a; font-size: 0.9rem;
        }
        .sell-qty {
            font-family: 'Cinzel', serif;
            color: #8a7a52; font-size: 0.75rem;
        }
        .sell-price {
            font-family: 'Cinzel', serif;
            color: #e8b923; font-size: 0.85rem;
            margin-top: 2px;
        }
        .sell-price img { width: 12px; height: 12px; vertical-align: middle; }
        .sell-btn {
            padding: 6px 10px;
            background: linear-gradient(135deg, #3d2d18, #2a1f10);
            color: #d9c89a; border: 1px solid #6a5024;
            border-radius: 4px; cursor: pointer;
            font-family: 'Cinzel', serif;
            font-weight: 700; font-size: 0.75rem;
            transition: all 0.2s;
        }
        .sell-btn:hover {
            color: #fff5dc; border-color: #c9a227;
        }
        .sell-btn.sell-all {
            background: linear-gradient(135deg, #4a7040, #2a4520);
            border-color: #6ba35c; color: #e0f0d0;
        }

        /* ---- Equipamento no painel do herói ---- */
        .equip-row {
            display: flex; flex-direction: column; gap: 4px;
            margin-bottom: 10px;
        }
        .equip-label {
            font-family: 'Cinzel', serif;
            color: #8a7a52; font-size: 0.75rem;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .equip-select {
            padding: 8px 10px;
            background: rgba(10,6,2,.6);
            color: #e8dcc4;
            border: 1px solid rgba(201,162,39,.3);
            border-radius: 4px;
            font-family: 'EB Garamond', serif;
            font-size: 0.9rem;
            cursor: pointer;
        }
        .equip-select:focus {
            outline: none; border-color: #e8b923;
        }
        .equip-empty {
            font-family: 'EB Garamond', serif;
            color: #8a7a52; font-size: 0.85rem;
            font-style: italic;
            padding: 8px 10px;
            background: rgba(10,6,2,.4);
            border-radius: 4px;
            margin-top: 6px;
        }

        @media (max-width: 600px) {
            .tesouraria-grid { grid-template-columns: repeat(2, 1fr); }
            .forge-grid { grid-template-columns: 1fr; }
            .sell-grid { grid-template-columns: 1fr; }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS da Tesouraria injetado.');
})();

// =================================================================
// 12. EXPOR NO WINDOW
// =================================================================
window.renderTesourariaScreen      = renderTesourariaScreen;
window.handleCraftWeapon           = handleCraftWeapon;
window.handleCraftAmulet           = handleCraftAmulet;
window.handleDismantleWeapon       = handleDismantleWeapon;
window.handleDismantleAmulet       = handleDismantleAmulet;
window.handleSellMaterial          = handleSellMaterial;
window.handleEquipWeapon           = handleEquipWeapon;
window.handleEquipAmulet           = handleEquipAmulet;
window.getMaterialPrice            = getMaterialPrice;
window.applyHeroEquipment          = applyHeroEquipment;
window.equipWeapon                 = equipWeapon;
window.equipAmulet                 = equipAmulet;
window.unequipWeapon               = unequipWeapon;
window.unequipAmulet               = unequipAmulet;
window.getHeroEquipment            = getHeroEquipment;
window.STORY_WEAPONS               = STORY_WEAPONS;
window.STORY_AMULETS               = STORY_AMULETS;
window.STORY_MATERIAL_PRICES       = STORY_MATERIAL_PRICES;

console.log('✅ historia.js V8.3 — TESOURARIA completa carregada.');
// Destrava TESOURARIA
(function unlockTesouraria() {
    const _orig = window.renderAldeiaScreen;
    if (typeof _orig !== 'function') return;
    window.renderAldeiaScreen = function() {
        const ss = document.getElementById('storyScreen');
        if (!ss) return;
        _orig.apply(this, arguments);

        // Re-renderiza trocando o cadeado da tesouraria
        const cards = ss.querySelectorAll('.story-ald-location');
        cards.forEach(card => {
            const name = card.querySelector('.story-ald-loc-name');
            if (name && name.textContent.trim().toUpperCase().includes('TESOURARIA')) {
                card.classList.remove('locked');
                const lockedEl = card.querySelector('.story-ald-loc-locked');
                if (lockedEl) lockedEl.remove();
                const descEl = card.querySelector('.story-ald-loc-desc');
                if (descEl) descEl.textContent = 'Inventário, forja e amuletos';
                card.setAttribute('onclick', "enterAldeiaLocation('tesouraria')");
            }
        });
    };
})();
// =================================================================
// 🎨 SPRITES DAS ARMAS E AMULETOS
// -----------------------------------------------------------------
// Mesma lógica do SPRITES_STORY:
//   • Link preenchido → usa o sprite
//   • Link vazio → cai no emoji
//
// Como preencher:
//   Cole o link entre as aspas. Deixe '' (vazio) pra usar o emoji.
// =================================================================

const STORY_WEAPON_SPRITES = {
    // ---- TACAPES ----
    'tacape_1':  'https://i.imgur.com/JeMUGif.png',  // ← cole o link aqui
    'tacape_2':  'https://i.imgur.com/bonFE6Q.png',
    'tacape_3':  'https://i.imgur.com/CKbLG63.png',
    'tacape_4':  'https://i.imgur.com/vDTc5ET.png',
    'tacape_5':  'https://i.imgur.com/0KV05fS.png',
    'tacape_6':  'https://i.imgur.com/7FI3hyM.png',
    'tacape_7':  'https://i.imgur.com/fc432IH.png',
    'tacape_8':  'https://i.imgur.com/60239w2.png',
    'tacape_9':  'https://i.imgur.com/o0wTy1Q.png',
    'tacape_10': 'https://i.imgur.com/iMlw6g5.png',
    'tacape_11': 'https://i.imgur.com/JO3VQKP.png',
    'tacape_12': 'https://i.imgur.com/yXW92BI.png',
    'tacape_13': 'https://i.imgur.com/AFY5TpJ.png',

    // ---- FLECHAS ----
    'flecha_1':  'https://i.imgur.com/W1SWNIm.png',
    'flecha_2':  'https://i.imgur.com/brvmlds.png',
    'flecha_3':  'https://i.imgur.com/s6UQFIB.png',
    'flecha_4':  'https://i.imgur.com/UZogzVw.png',
    'flecha_5':  'https://i.imgur.com/9RHZmRc.png',
    'flecha_6':  'https://i.imgur.com/V32dqsu.png',
    'flecha_7':  'https://i.imgur.com/V32dqsu.png',
    'flecha_8':  'https://i.imgur.com/gB6NQb6.png',
    'flecha_9':  'https://i.imgur.com/QEKCFfr.png',
    'flecha_10': 'https://i.imgur.com/lr6637l.png',
    'flecha_11': 'https://i.imgur.com/7e4xi88.png',
    'flecha_12': 'https://i.imgur.com/TlFeeUD.png',
    'flecha_13': 'https://i.imgur.com/jIrYoSM.png',

    // ---- CAJADOS ----
    'cajado_1':  'https://i.imgur.com/ektoPWs.png',
    'cajado_2':  'https://i.imgur.com/ghogsnB.png',
    'cajado_3':  'https://i.imgur.com/mncGqpv.png',
    'cajado_4':  'https://i.imgur.com/e8R6ily.png',
    'cajado_5':  'https://i.imgur.com/vtgLK9Y.png',
    'cajado_6':  'https://i.imgur.com/bfRaJq1.png',
    'cajado_7':  'https://i.imgur.com/aE7lwvY.png',
    'cajado_8':  'https://i.imgur.com/aKOdqRJ.png',
    'cajado_9':  'https://i.imgur.com/IoEtQGB.png',
    'cajado_10': 'https://i.imgur.com/0uKsLbe.png',
    'cajado_11': 'https://i.imgur.com/xzLYPZQ.png',
    'cajado_12': 'https://i.imgur.com/M7tBX5E.png',
    'cajado_13': 'https://i.imgur.com/uzAOiFu.png',
};

const STORY_AMULET_SPRITES = {
    'amuleto_1':  'https://i.imgur.com/wZNdnfe.png',  // ← cole o link aqui
    'amuleto_2':  'https://i.imgur.com/grxwdL7.png',
    'amuleto_3':  'https://i.imgur.com/1Au85vR.png',
    'amuleto_4':  'https://i.imgur.com/cBaWgUV.png',
    'amuleto_5':  'https://i.imgur.com/NCSB2In.png',
    'amuleto_6':  'https://i.imgur.com/nbWin30.png',
    'amuleto_7':  'https://i.imgur.com/SdrNTgW.png',
    'amuleto_8':  'https://i.imgur.com/MZqecGu.png',
    'amuleto_9':  'https://i.imgur.com/60PhZcr.png',
    'amuleto_10': 'https://i.imgur.com/GhVUlJ8.png',
    'amuleto_11': 'https://i.imgur.com/Ugx2s1z.png',
    'amuleto_12': 'https://i.imgur.com/rRwaKTH.png',
    'amuleto_13': 'https://i.imgur.com/oDtZdxA.png',
};

// Emojis de fallback (caso o sprite esteja vazio)
const STORY_WEAPON_EMOJIS = {
    // Padrão por tipo, caso o item específico não tenha emoji definido
    tacape: '🪓',
    flecha: '🏹',
    cajado: '🪄',
};
const STORY_AMULET_EMOJI_DEFAULT = '🧿';

// ---- Funções de resolução ----

function getWeaponIcon(weaponId, size = 'normal') {
    const w = STORY_WEAPONS[weaponId];
    if (!w) return '❓';

    const url = STORY_WEAPON_SPRITES[weaponId];
    const emoji = w.emoji || STORY_WEAPON_EMOJIS[w.tipo] || '⚔️';

    if (url && String(url).trim() !== '') {
        const cls = size === 'large' ? 'weapon-icon weapon-icon-large'
                  : size === 'small' ? 'weapon-icon weapon-icon-small'
                  : 'weapon-icon';
        return `<img src="${url}" class="${cls}" alt="${w.nome}" onerror="this.outerHTML='${emoji}'">`;
    }

    const cls = size === 'large' ? 'weapon-emoji weapon-emoji-large'
              : size === 'small' ? 'weapon-emoji weapon-emoji-small'
              : 'weapon-emoji';
    return `<span class="${cls}">${emoji}</span>`;
}

function getAmuletIcon(amuletId, size = 'normal') {
    const a = STORY_AMULETS[amuletId];
    if (!a) return '❓';

    const url = STORY_AMULET_SPRITES[amuletId];
    const emoji = a.emoji || STORY_AMULET_EMOJI_DEFAULT;

    if (url && String(url).trim() !== '') {
        const cls = size === 'large' ? 'weapon-icon weapon-icon-large'
                  : size === 'small' ? 'weapon-icon weapon-icon-small'
                  : 'weapon-icon';
        return `<img src="${url}" class="${cls}" alt="${a.nome}" onerror="this.outerHTML='${emoji}'">`;
    }

    const cls = size === 'large' ? 'weapon-emoji weapon-emoji-large'
              : size === 'small' ? 'weapon-emoji weapon-emoji-small'
              : 'weapon-emoji';
    return `<span class="${cls}">${emoji}</span>`;
}

// =================================================================
// 🔧 PATCH — Substitui o emoji direto pelos getWeaponIcon/getAmuletIcon
// =================================================================

// Patch no renderTesourariaForja
(function patchForgeIcons() {
    if (typeof window.renderTesourariaForja === 'function') {
        // Não temos acesso direto à função interna, então vamos
        // sobrescrever o renderTesourariaScreen inteiro
        // com uma versão que usa getWeaponIcon/getAmuletIcon
    }
})();

// Como as funções de render são internas, o jeito mais simples é
// sobrescrever os cards no DOM após render. Fazemos via MutationObserver.
(function patchForgeIconsViaObserver() {
    if (window._forgeIconObserverInstalled) return;
    window._forgeIconObserverInstalled = true;

    function patchCards() {
        // Patch nos cards de forja (armas)
        document.querySelectorAll('.forge-card').forEach(card => {
            const emojiEl = card.querySelector('.forge-emoji');
            if (!emojiEl || emojiEl.dataset.iconPatched === '1') return;

            // Descobre o nome da arma pelo texto
            const nameEl = card.querySelector('.forge-name');
            if (!nameEl) return;
            const nomeArma = nameEl.textContent.trim();

            // Procura a arma pelo nome
            const weaponId = Object.keys(STORY_WEAPONS).find(id => STORY_WEAPONS[id].nome === nomeArma);
            const amuletId = Object.keys(STORY_AMULETS).find(id => STORY_AMULETS[id].nome === nomeArma);

            let html = '';
            if (weaponId) html = getWeaponIcon(weaponId, 'large');
            else if (amuletId) html = getAmuletIcon(amuletId, 'large');

            if (html) {
                emojiEl.innerHTML = html;
                emojiEl.dataset.iconPatched = '1';
            }
        });

        // Patch nos selects de equipamento (painel de detalhes)
        document.querySelectorAll('.equip-select').forEach(sel => {
            // Não muda o texto do select (só o label do botão é texto),
            // então não precisa patchar aqui por enquanto
        });
    }

    const observer = new MutationObserver(() => {
        if (document.getElementById('storyScreen')?.classList.contains('active')) {
            patchCards();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('✅ Observer de ícones de arma/amuleto instalado.');
})();

// CSS pros ícones
(function injectWeaponIconCSS() {
    if (document.getElementById('weaponIconStyle')) return;
    const style = document.createElement('style');
    style.id = 'weaponIconStyle';
    style.textContent = `
        .weapon-icon {
            width: 1em;
            height: 1em;
            object-fit: contain;
            vertical-align: -0.15em;
            display: inline-block;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));
        }
        .weapon-icon-small { width: 0.85em; height: 0.85em; }
        .weapon-icon-large { width: 2em;   height: 2em; }

        .weapon-emoji { display: inline-block; line-height: 1; }
        .weapon-emoji-small { font-size: 0.85em; }
        .weapon-emoji-large { font-size: 2em; }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS dos ícones de arma/amuleto injetado.');
})();

console.log('✅ Tabelas de sprites de arma/amuleto carregadas.');
// =================================================================
