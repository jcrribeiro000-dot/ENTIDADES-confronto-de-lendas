// historia.js — BLOCO V10.54 (FIX DEFINITIVO: corrupção ao morrer boss)
// -----------------------------------------------------------------
// BUG: limparCorrupcao() restaurava os tiles via createTile()
// enquanto _corruptedTiles ainda continha os índices. O hook em
// createTile re-adicionava .tile-corrupted durante a iteração.
//
// RESULTADO: após o boss morrer, os tiles negros permaneciam.
//
// FIX: limpar o array ANTES de iterar. Mesmo padrão do Solo Sagrado
// (que já funcionava corretamente).
// =================================================================

(function fixCorrupcaoV1054() {
    if (window._fixCorrupcaoV1054) return;
    window._fixCorrupcaoV1054 = true;

    // =============================================================
    // 1. REDEFINE limparCorrupcao com a ORDEM CORRETA
    // =============================================================
    window.limparCorrupcao = function() {
        if (!window._corruptedTiles || window._corruptedTiles.length === 0) {
            if (typeof boss !== 'undefined' && boss) boss._corruptedTriggered = false;
            return;
        }

        const qtd = window._corruptedTiles.length;
        console.log(`[V10.54] Limpando ${qtd} tiles corrompidos...`);

        // ⭐ PASSO 1: SALVA a lista, LIMPA o array ANTES
        // (evita que createTile re-corrompa durante o replaceChild)
        const tilesParaRestaurar = [...window._corruptedTiles];
        window._corruptedTiles = [];

        // ⭐ PASSO 2: agora restaura (createTile NÃO re-adiciona classe)
        const gridEl = document.getElementById('grid');
        if (gridEl && typeof createTile === 'function') {
            tilesParaRestaurar.forEach(idx => {
                if (gridEl.childNodes[idx]) {
                    gridEl.replaceChild(createTile(idx), gridEl.childNodes[idx]);
                }
            });
        }

        if (typeof boss !== 'undefined' && boss) {
            boss._corruptedTriggered = false;
        }

        console.log('[V10.54] Corrupção limpa com sucesso.');
    };

    // =============================================================
    // 2. REFORÇA hook em handleStoryBossDefeat
    //    (V10.53 já hookou, mas com a função nova agora funciona)
    // =============================================================
    const _currDefeat = window.handleStoryBossDefeat;
    if (typeof _currDefeat === 'function' && !_currDefeat._v1054) {
        const _innerDefeat = _currDefeat;
        window.handleStoryBossDefeat = async function() {
            // Limpa ANTES de qualquer animação/purificação
            window.limparCorrupcao();
            return _innerDefeat.apply(this, arguments);
        };
        window.handleStoryBossDefeat._v1054 = true;
        console.log('[V10.54] Hook handleStoryBossDefeat reforçado.');
    }

    // =============================================================
    // 3. REFORÇA hook em advanceStoryEnemy (backup)
    //    (chamado tanto pela morte normal quanto por Coop/sync)
    // =============================================================
    const _currAdvance = window.advanceStoryEnemy;
    if (typeof _currAdvance === 'function' && !_currAdvance._v1054) {
        const _innerAdvance = _currAdvance;
        window.advanceStoryEnemy = async function() {
            // Garante limpeza ANTES de spawnar o próximo boss
            window.limparCorrupcao();
            return _innerAdvance.apply(this, arguments);
        };
        window.advanceStoryEnemy._v1054 = true;
        console.log('[V10.54] Hook advanceStoryEnemy reforçado.');
    }

    // =============================================================
    // 4. Reforço em initStoryBattle (começo de fase)
    // =============================================================
    const _currInit = window.initStoryBattle;
    if (typeof _currInit === 'function' && !_currInit._v1054) {
        const _innerInit = _currInit;
        window.initStoryBattle = async function() {
            window.limparCorrupcao();
            return _innerInit.apply(this, arguments);
        };
        window.initStoryBattle._v1054 = true;
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.54] Corrupção ao morrer boss — CORRIGIDA');
    console.log('═══════════════════════════════════════════════════');
    console.log('• limparCorrupcao agora limpa o array ANTES de restaurar');
    console.log('• createTile não re-corrompe mais durante a limpeza');
    console.log('• Reset duplo: handleStoryBossDefeat + advanceStoryEnemy');
    console.log('• Solo Sagrado continua funcionando (mesmo padrão)');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia-combate.js — Armas equipadas nas animações de ataque
// =================================================================
(function storyEquippedWeaponAttacksV79() {
    if (window._storyEquippedWeaponAttacksV79) return;
    window._storyEquippedWeaponAttacksV79 = true;

    window._createStoryWeaponVisual = function(active, expectedRole) {
        if ((!window._storyMode && !window._eventoAtivo) ||
            window._pvpMode || window._coopMode || !active?.class) return null;

        const hero = typeof STORY_HERO_CLASSES !== 'undefined'
            ? STORY_HERO_CLASSES[active.class] : null;
        if (hero?.role !== expectedRole ||
            typeof window.getHeroEquipment !== 'function' ||
            typeof window.getWeaponIcon !== 'function') return null;

        const equipment = window.getHeroEquipment(active.class);
        if (!equipment?.arma) return null;

        const holder = document.createElement('span');
        holder.innerHTML = window.getWeaponIcon(equipment.arma, 'large');
        const visual = holder.firstElementChild;
        if (visual) {
            visual.removeAttribute('class');
            visual.setAttribute('aria-hidden', 'true');
            return visual;
        }

        const emoji = holder.textContent.trim();
        if (!emoji) return null;
        const fallback = document.createElement('span');
        fallback.textContent = emoji;
        fallback.setAttribute('aria-hidden', 'true');
        return fallback;
    };

    if (!document.getElementById('storyEquippedWeaponAttacksV79CSS')) {
        const style = document.createElement('style');
        style.id = 'storyEquippedWeaponAttacksV79CSS';
        style.textContent = `
            .flechaV79-sprite {
                filter: drop-shadow(0 0 4px var(--flecha-brilho, #fff))
                        drop-shadow(0 0 8px var(--flecha-cor, #7cf));
            }
            .flechaV79-energia {
                position: absolute;
                inset: 20% 5%;
                border-radius: 50%;
                pointer-events: none;
                background: linear-gradient(90deg, transparent, var(--flecha-brilho), transparent);
                box-shadow: 0 0 9px var(--flecha-cor);
                opacity: .8;
            }
            .story-weapon-melee,
            .story-weapon-cast {
                position: absolute;
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: none;
                z-index: 95;
                filter: drop-shadow(0 0 7px rgba(255, 220, 130, .9));
            }
            .story-weapon-melee img,
            .story-weapon-cast img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
            .story-weapon-melee span,
            .story-weapon-cast span {
                font-size: 34px;
                line-height: 1;
            }
            .story-weapon-melee {
                width: 46px;
                height: 46px;
                transition: left .16s ease-out, top .16s ease-out,
                            transform .16s ease-out, opacity .12s ease-in;
            }
            .story-weapon-cast {
                width: 46px;
                height: 46px;
                animation: storyWeaponCastV79 .18s ease-out both;
            }
            .story-weapon-cast-aura {
                position: absolute;
                inset: 0;
                border: 2px solid rgba(147, 222, 255, .9);
                border-radius: 50%;
                box-shadow: 0 0 16px #55caff, inset 0 0 12px #55caff;
                animation: storyWeaponAuraV79 .24s ease-out both;
            }
            @keyframes storyWeaponCastV79 {
                from { opacity: 0; transform: translateY(8px) rotate(-35deg) scale(.55); }
                to { opacity: 1; transform: translateY(-4px) rotate(12deg) scale(1.05); }
            }
            @keyframes storyWeaponAuraV79 {
                from { opacity: 0; transform: scale(.35); }
                40% { opacity: .9; }
                to { opacity: 0; transform: scale(1.45); }
            }
        `;
        document.head.appendChild(style);
    }

    const originalSwordEffect = window.spawnSwordEffect;
    if (typeof originalSwordEffect === 'function') {
        window.spawnSwordEffect = function(x, y) {
            const result = originalSwordEffect.apply(this, arguments);
            const active = typeof players !== 'undefined'
                ? players[currentPlayerIdx] : null;
            const weapon = window._createStoryWeaponVisual(active, 'Guerreiro');
            const board = document.getElementById('board');
            if (!weapon || !board || typeof window.getStep !== 'function') return result;

            const step = window.getStep();
            const fromX = (active.x + .5) * step + 8;
            const fromY = (active.y + .5) * step + 8;
            const toX = (x + .5) * step + 8;
            const toY = (y + .5) * step + 8;
            const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
            const slash = document.createElement('div');
            slash.className = 'story-weapon-melee';
            slash.style.left = `${fromX}px`;
            slash.style.top = `${fromY}px`;
            slash.style.transform = `translate(-50%, -50%) rotate(${angle - 70}deg) scale(.65)`;
            slash.appendChild(weapon);
            board.appendChild(slash);

            requestAnimationFrame(() => {
                slash.style.left = `${toX}px`;
                slash.style.top = `${toY}px`;
                slash.style.transform = `translate(-50%, -50%) rotate(${angle + 55}deg) scale(1.1)`;
            });
            setTimeout(() => {
                slash.style.transform = `translate(-50%, -50%) rotate(${angle + 135}deg) scale(.55)`;
                slash.style.opacity = '0';
            }, 130);
            setTimeout(() => slash.remove(), 310);
            return result;
        };
        window.spawnSwordEffect._storyEquippedWeaponV79 = true;
    }

    const originalProjectile = window.spawnProjectile;
    if (typeof originalProjectile === 'function') {
        window.spawnProjectile = async function(from, to, type) {
            const weapon = type === 'Magic'
                ? window._createStoryWeaponVisual(from, 'Mago')
                : null;
            const board = document.getElementById('board');
            if (!weapon || !board || typeof window.getStep !== 'function') {
                return originalProjectile.apply(this, arguments);
            }

            const step = window.getStep();
            const cast = document.createElement('div');
            cast.className = 'story-weapon-cast';
            cast.style.left = `${(from.x + .5) * step + 8}px`;
            cast.style.top = `${(from.y + .5) * step + 8}px`;
            cast.appendChild(weapon);

            const aura = document.createElement('span');
            aura.className = 'story-weapon-cast-aura';
            cast.appendChild(aura);
            board.appendChild(cast);
            setTimeout(() => cast.remove(), 360);
            await new Promise(resolve => setTimeout(resolve, 150));

            return originalProjectile.apply(this, arguments);
        };
        window.spawnProjectile._storyEquippedWeaponV79 = true;
    }

    console.log('✅ [V79] Animações dos ataques usam as armas equipadas.');
})();
// historia.js — V10.55 (FX CINEMATOGRÁFICO DA PURIFICAÇÃO)
// -----------------------------------------------------------------
// Quando os tiles corrompidos são limpos (morte do boss, troca de
// fase, ou Solo Sagrado em massa), dispara um efeito de purificação:
//
//   • Flash roxo no board inteiro
//   • Anel de choque expandindo do centro
//   • Fumaça roxa em cada tile (sobe e dissipa)
//   • Tile dissolve (brilha → escala → some)
//   • Cascata do centro pra fora (delay escalonado)
//   • Som: 'purificacao' + 'skill1' (camada dupla)
//
// ⚠️ Mantém a lógica do V10.54 intacta (limpa array ANTES de restaurar)
// =================================================================

(function limparCorrupcaoComFXV1055() {
    if (window._limparCorrupcaoComFXV1055) return;
    window._limparCorrupcaoComFXV1055 = true;

    // =============================================================
    // CSS
    // =============================================================
    if (!document.getElementById('corruptionPurgeCSS')) {
        const style = document.createElement('style');
        style.id = 'corruptionPurgeCSS';
        style.textContent = `
            /* ============ FLASH GLOBAL ROXO ============ */
            .corruption-purge-flash {
                position: absolute;
                inset: 0;
                pointer-events: none;
                z-index: 55;
                background: radial-gradient(circle at center,
                    rgba(200, 130, 230, 0.40) 0%,
                    rgba(142, 68, 173, 0.25) 35%,
                    rgba(90, 42, 112, 0.12) 60%,
                    transparent 80%);
                animation: corruptionPurgeFlash 1.4s ease-out forwards;
                mix-blend-mode: screen;
            }
            @keyframes corruptionPurgeFlash {
                0%   { opacity: 0; }
                12%  { opacity: 1; }
                100% { opacity: 0; }
            }

            /* ============ ANEL DE CHOQUE ============ */
            .corruption-purge-ring {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                border: 6px solid rgba(200, 130, 230, 0.95);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                z-index: 54;
                pointer-events: none;
                box-shadow:
                    0 0 30px rgba(180, 100, 220, 0.9),
                    0 0 60px rgba(142, 68, 173, 0.6),
                    inset 0 0 30px rgba(180, 100, 220, 0.5);
                animation: corruptionPurgeRing 1.2s cubic-bezier(0.25, 0.8, 0.3, 1) forwards;
            }
            @keyframes corruptionPurgeRing {
                0% {
                    width: 0;
                    height: 0;
                    opacity: 1;
                    border-width: 10px;
                }
                40% {
                    opacity: 0.9;
                    border-width: 5px;
                }
                100% {
                    width: 1200px;
                    height: 1200px;
                    opacity: 0;
                    border-width: 1px;
                }
            }

            /* ============ FUMAÇA ROXA (uma por tile) ============ */
            .corruption-smoke-fx {
                position: absolute;
                pointer-events: none;
                z-index: 65;
                border-radius: 50%;
                background: radial-gradient(circle,
                    rgba(210, 140, 240, 0.95) 0%,
                    rgba(142, 68, 173, 0.85) 25%,
                    rgba(90, 42, 112, 0.55) 55%,
                    rgba(40, 10, 60, 0.0) 85%);
                box-shadow:
                    0 0 30px rgba(180, 100, 220, 0.9),
                    0 0 60px rgba(142, 68, 173, 0.5);
                filter: blur(2px);
                animation: corruptionSmokeDissipate 1.2s cubic-bezier(0.25, 0.8, 0.3, 1) forwards;
                mix-blend-mode: screen;
            }
            @keyframes corruptionSmokeDissipate {
                0% {
                    transform: scale(0.5) translateY(0);
                    opacity: 0;
                    filter: blur(0);
                }
                15% {
                    transform: scale(1.15) translateY(-6px);
                    opacity: 1;
                    filter: blur(3px);
                }
                55% {
                    transform: scale(1.7) translateY(-28px);
                    opacity: 0.85;
                    filter: blur(7px);
                }
                100% {
                    transform: scale(2.9) translateY(-80px);
                    opacity: 0;
                    filter: blur(16px);
                }
            }

            /* ============ TILE DISSOLVE (brilha e some) ============ */
            .corruption-tile-dissolve {
                animation: corruptionTileDissolve 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
            }
            @keyframes corruptionTileDissolve {
                0% {
                    filter: brightness(1) hue-rotate(0deg);
                    transform: scale(1);
                    opacity: 1;
                }
                35% {
                    filter: brightness(4) hue-rotate(30deg);
                    transform: scale(1.15);
                    opacity: 1;
                }
                100% {
                    filter: brightness(6) hue-rotate(60deg);
                    transform: scale(1.5);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        console.log('[V10.55] CSS da purificação injetado.');
    }

    // =============================================================
    // SOBRESCREVE limparCorrupcao (mantendo a ordem correta do V10.54)
    // =============================================================
    window.limparCorrupcao = function() {
        if (!window._corruptedTiles || window._corruptedTiles.length === 0) {
            if (typeof boss !== 'undefined' && boss) boss._corruptedTriggered = false;
            return;
        }

        const tilesParaRestaurar = [...window._corruptedTiles];
        const qtd = tilesParaRestaurar.length;

        // ⭐ ORDEM CRÍTICA (V10.54): limpa o array ANTES de restaurar
        window._corruptedTiles = [];
        if (typeof boss !== 'undefined' && boss) boss._corruptedTriggered = false;

        const gridEl = document.getElementById('grid');
        const board = document.getElementById('board');
        if (!gridEl || !board || typeof createTile !== 'function') return;

        console.log(`[V10.55] Purificando ${qtd} tiles corrompidos (cascata).`);

        // ============== EFEITOS GLOBAIS ==============

        // 1. Flash roxo cobrindo o board
        const flash = document.createElement('div');
        flash.className = 'corruption-purge-flash';
        board.appendChild(flash);
        setTimeout(() => flash.remove(), 1400);

        // 2. Anel de choque expandindo do centro
        const ring = document.createElement('div');
        ring.className = 'corruption-purge-ring';
        board.appendChild(ring);
        setTimeout(() => ring.remove(), 1200);

        // 3. Som duplo (purificação + skill)
        if (typeof playSfx === 'function') {
            try { playSfx('purificacao'); } catch (e) {}
            setTimeout(() => {
                try { playSfx('skill1'); } catch (e) {}
            }, 250);
        }

        // ============== EFEITOS POR TILE ==============
        const s = (typeof getStep === 'function') ? getStep() : 59;

        // Ordena por distância do centro do board (cascata do meio pra fora)
        const cx = 3.5, cy = 3.5;
        const ordenados = tilesParaRestaurar.slice().sort((a, b) => {
            const ax = a % 8, ay = Math.floor(a / 8);
            const bx = b % 8, by = Math.floor(b / 8);
            const da = Math.hypot(ax - cx, ay - cy);
            const db = Math.hypot(bx - cx, by - cy);
            return da - db;
        });

        ordenados.forEach((idx, i) => {
            const delay = i * 55;   // cascata de ~55ms entre tiles
            const x = idx % 8;
            const y = Math.floor(idx / 8);

            // Fumaça roxa (no BOARD, não no tile — sobrevive à substituição)
            const smoke = document.createElement('div');
            smoke.className = 'corruption-smoke-fx';
            smoke.style.left   = (x * s + 8) + 'px';
            smoke.style.top    = (y * s + 8) + 'px';
            smoke.style.width  = s + 'px';
            smoke.style.height = s + 'px';
            smoke.style.animationDelay = delay + 'ms';
            board.appendChild(smoke);
            setTimeout(() => smoke.remove(), 1500 + delay);

            // Tile dissolve
            const tile = gridEl.childNodes[idx];
            if (tile) {
                setTimeout(() => {
                    if (gridEl.childNodes[idx] === tile) {
                        tile.classList.add('corruption-tile-dissolve');
                    }
                }, delay);
            }

            // Substitui após o fade (~500ms + delay)
            setTimeout(() => {
                if (gridEl.childNodes[idx]) {
                    gridEl.replaceChild(createTile(idx), gridEl.childNodes[idx]);
                }
            }, 500 + delay);
        });
    };

    // =============================================================
    // Log
    // =============================================================
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.55] Purificação cinematográfica — ATIVA');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Flash roxo no board');
    console.log('• Anel de choque expandindo do centro');
    console.log('• Fumaça roxa em cada tile');
    console.log('• Tile dissolve (brilha → escala → some)');
    console.log('• Cascata escalonada (~55ms entre tiles)');
    console.log('• Som: purificacao + skill1');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V10.56 (FIX DEFINITIVO: duplo som em skills de boss)
// -----------------------------------------------------------------
// Três correções:
//
//  1. bossIsStoryBoss agora reconhece pesadelo + 12 espectros
//     → applyStorySkill NÃO toca playSkillSound duplicado
//
//  2. Sons mapeados para os handlers dos Atos 8-12
//     → animais não caem mais no fallback skill1
//
//  3. limparCorrupcao (V10.55) NÃO toca skill1 depois da purificação
//     → transição pós-morte fica limpa (só purificacao)
// =================================================================

(function fixDuploSomV1056() {
    if (window._fixDuploSomV1056) return;
    window._fixDuploSomV1056 = true;

    // =============================================================
    // 1. RECONHECER PESADELO + ESPECTROS COMO BOSS
    // =============================================================
    const _bossesHistoria = [
        'saci', 'mapinguari', 'iara', 'boitata', 'mula', 'corpo_seco',
        'lobisomem', 'cuca', 'boto', 'boi', 'jaci', 'guaraci', 'anhanga',
        // ⭐ NOVOS
        'pesadelo',
        'espectro_saci', 'espectro_mapinguari', 'espectro_iara', 'espectro_boitata',
        'espectro_mula', 'espectro_corposeco', 'espectro_lobisomem', 'espectro_cuca',
        'espectro_boto', 'espectro_boi', 'espectro_jaci', 'espectro_guaraci',
    ];

    window.bossIsStoryBoss = function(enemyId) {
        return _bossesHistoria.includes(enemyId);
    };
    // Compatibilidade — alguns patches chamam como função local
    if (typeof bossIsStoryBoss !== 'undefined') {
        try { bossIsStoryBoss = window.bossIsStoryBoss; } catch(e) {}
    }

    console.log('[V10.56] bossIsStoryBoss atualizado:', _bossesHistoria.length, 'bosses reconhecidos.');

    // =============================================================
    // 2. MAPEAR SONS DOS ATOS 8-12 (animais)
    // =============================================================
    if (typeof STORY_SKILL_SOUNDS !== 'undefined') {
        Object.assign(STORY_SKILL_SOUNDS, {
            // Ato 8
            morcego_voo: 'asas', morcego_eco: 'skill1',
            coruja_garras: 'garras', coruja_voo: 'asas',
            sapo_veneno: 'bote', sapo_lingua: 'bote',
            seriema_bicada: 'atkg', seriema_grito: 'minoa2',

            // Ato 9
            tucunare_bote: 'splash', tucunare_cardume: 'splash',
            piraiba_bocarra: 'iara2', piraiba_caudada: 'splash',
            dourada_escamas: 'iara1', dourada_nado: 'splash',
            peixe_boi_corpulencia: 'minoa2', peixe_boi_pancada: 'splash',

            // Ato 10
            bufalo_marrada: 'chifre', bufalo_pisoteada: 'coice',
            vaca_coice: 'coice', vaca_mugido: 'minoa2',
            cabra_cornada: 'chifre', cabra_bote: 'bote',
            zebu_marrada: 'chifre', zebu_pisada: 'minoa2',

            // Ato 11
            gato_mato_garras: 'garras', gato_mato_salto: 'felino',
            mariposa_po: 'mariposa', mariposa_voo: 'mariposa',
            quati_garras: 'garras', quati_bote: 'bote',
            sucuarana_garra: 'garras', sucuarana_salto: 'felino',

            // Ato 12
            gaviao_voo: 'aguia', gaviao_garras: 'garras',
            falcao_mergulho: 'aguia', falcao_garras: 'garras',
            urutau_canto: 'skill1', urutau_voo: 'asas',
            aguia_garras: 'garras', aguia_mergulho: 'aguia',
        });
        console.log('[V10.56] Sons dos Atos 8-12 mapeados (48 handlers).');
    }

    // =============================================================
    // 3. limparCorrupcao SEM o skill1 extra (V10.55 mutado)
    // -------------------------------------------------------------
    // Mantém o FX cinematográfico, só remove o segundo som
    // =============================================================
    const _currLimpar = window.limparCorrupcao;
    if (typeof _currLimpar === 'function' && !_currLimpar._v1056) {
        // Preservamos o comportamento visual, mas substituindo o som
        const _origLimpar = _currLimpar;

        window.limparCorrupcao = function() {
            const tinhaCorrupcao = window._corruptedTiles && window._corruptedTiles.length > 0;
            if (!tinhaCorrupcao) {
                return _origLimpar.apply(this, arguments);
            }

            // Toca SOMENTE purificacao (não skill1)
            if (typeof playSfx === 'function') {
                try { playSfx('purificacao'); } catch(e) {}
            }

            // ⚠️ Temporariamente removemos o skill1 do setTimeout original.
            // Não temos controle dele, então executamos a lógica com flag.
            const _origPlaySfx = window.playSfx;
            let _bloqueado = false;

            window.playSfx = function(name) {
                if (_bloqueado && name === 'skill1') return;
                return _origPlaySfx.apply(this, arguments);
            };

            // Executa limpar (com FX + skill1 que V10.55 dispara em 250ms)
            const r = _origLimpar.apply(this, arguments);

            // Bloqueia skill1 por 500ms (janela do setTimeout 250 do V10.55)
            _bloqueado = true;
            setTimeout(() => {
                _bloqueado = false;
                window.playSfx = _origPlaySfx;
            }, 500);

            return r;
        };
        window.limparCorrupcao._v1056 = true;
        console.log('[V10.56] limparCorrupcao: skill1 extra bloqueado.');
    }

    // =============================================================
    // 4. Diagnóstico no console
    // =============================================================
    setTimeout(() => {
        console.log('');
        console.log('═══════════════════════════════════════════════════');
        console.log('✅ [V10.56] Fix do duplo som ativado');
        console.log('═══════════════════════════════════════════════════');
        console.log('• bossIsStoryBoss reconhece:', _bossesHistoria.length, 'bosses');
        console.log('   (inclui pesadelo + 12 espectros)');
        console.log('• Atos 8-12 mapeados (48 handlers)');
        console.log('• limparCorrupcao toca só purificacao');
        console.log('');
        console.log('💡 Teste rápido:');
        console.log('   bossIsStoryBoss("espectro_boitata") → true');
        console.log('   bossIsStoryBoss("saci")             → true');
        console.log('   bossIsStoryBoss("porco_espinho")    → false');
        console.log('═══════════════════════════════════════════════════');
    }, 1000);

    console.log('✅ [V10.56] Fix do duplo som instalado.');
})();
// =================================================================
// historia.js — V10.57 (Coração do Vazio: solo-only + FX cinemático)
// -----------------------------------------------------------------
// 1. Guard: passiva desativada em PvP e Coop
// 2. Escudo cinemático (hexágono roxo + flash + partículas + shake)
// 3. Descrição avisa: "apenas Solo e Modo História"
// =================================================================

(function coracaoVazioV1057() {
    if (window._coracaoVazioV1057) return;
    window._coracaoVazioV1057 = true;

    const CORACAO_ID = 'coracao_vazio';

    // =============================================================
    // 1. CSS
    // =============================================================
    if (!document.getElementById('coracaoShieldCSS')) {
        const style = document.createElement('style');
        style.id = 'coracaoShieldCSS';
        style.textContent = `
            .coracao-vazio-overlay {
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none;
                z-index: 250;
                overflow: hidden;
            }

            .coracao-shield {
                position: absolute;
                width: 70px; height: 70px;
                border-radius: 50%;
                transform: translate(-50%, -50%) scale(0);
                background: radial-gradient(circle,
                    rgba(180, 100, 240, 0.05) 0%,
                    rgba(142, 68, 173, 0.30) 35%,
                    rgba(90, 42, 112, 0.75) 65%,
                    rgba(40, 10, 60, 0.95) 100%);
                border: 3px solid #c39bd3;
                box-shadow:
                    0 0 30px rgba(180, 100, 240, 0.9),
                    0 0 60px rgba(142, 68, 173, 0.6),
                    inset 0 0 30px rgba(255, 240, 255, 0.3);
                animation: coracaoShieldExpand 1.8s cubic-bezier(0.25, 0.8, 0.3, 1) forwards;
            }
            @keyframes coracaoShieldExpand {
                0%   { transform: translate(-50%, -50%) scale(0);   opacity: 0; }
                15%  { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
                40%  { transform: translate(-50%, -50%) scale(1.5); opacity: 0.9; }
                100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
            }

            .coracao-flash {
                position: absolute; inset: 0;
                background: radial-gradient(circle at center,
                    rgba(200, 130, 240, 0.35) 0%,
                    rgba(142, 68, 173, 0.15) 40%,
                    transparent 70%);
                animation: coracaoFlash 0.8s ease-out forwards;
            }
            @keyframes coracaoFlash {
                0%   { opacity: 0; }
                15%  { opacity: 1; }
                100% { opacity: 0; }
            }

            .coracao-texto {
                position: absolute;
                transform: translate(-50%, -50%);
                font-family: 'Cinzel Decorative', serif;
                font-size: 1.3rem; font-weight: 900;
                letter-spacing: 3px;
                color: #e0c8f0;
                text-shadow:
                    0 0 15px rgba(180, 100, 240, 1),
                    0 0 30px rgba(142, 68, 173, 0.8),
                    0 2px 4px rgba(0, 0, 0, 0.9);
                animation: coracaoTextoFloat 2.2s ease-out forwards;
                white-space: nowrap; pointer-events: none;
            }
            @keyframes coracaoTextoFloat {
                0%   { opacity: 0; transform: translate(-50%, -30%); }
                20%  { opacity: 1; transform: translate(-50%, -50%); }
                80%  { opacity: 1; transform: translate(-50%, -50%); }
                100% { opacity: 0; transform: translate(-50%, -120%); }
            }

            .coracao-particula {
                position: absolute;
                width: 6px; height: 6px;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                background: radial-gradient(circle, #fff5dc 0%, #c39bd3 60%, transparent 100%);
                box-shadow: 0 0 10px rgba(180, 100, 240, 0.9);
                animation: coracaoParticula 1.2s ease-out forwards;
            }
            @keyframes coracaoParticula {
                0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
                20%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.4); }
            }

            @keyframes coracaoShake {
                0%, 100% { transform: translateX(0); }
                25%      { transform: translateX(-5px); }
                50%      { transform: translateX(5px); }
                75%      { transform: translateX(-3px); }
            }
        `;
        document.head.appendChild(style);
        console.log('[V10.57] CSS do escudo injetado.');
    }

    // =============================================================
    // 2. Função do escudo cinemático
    // =============================================================
    window.mostrarEscudoCoracao = async function(target) {
        const board = document.getElementById('board');
        if (!board || !target) return;

        const s = (typeof getStep === 'function') ? getStep() : 59;
        const cx = target.x * s + s / 2 + 8;
        const cy = target.y * s + s / 2 + 8;

        const container = document.createElement('div');
        container.className = 'coracao-vazio-overlay';

        const flash = document.createElement('div');
        flash.className = 'coracao-flash';
        container.appendChild(flash);

        const shield = document.createElement('div');
        shield.className = 'coracao-shield';
        shield.style.left = cx + 'px';
        shield.style.top  = cy + 'px';
        container.appendChild(shield);

        const texto = document.createElement('div');
        texto.className = 'coracao-texto';
        texto.textContent = '🖤 SOBREVIVEU';
        texto.style.left = cx + 'px';
        texto.style.top  = (cy - 60) + 'px';
        container.appendChild(texto);

        for (let i = 0; i < 16; i++) {
            const p = document.createElement('div');
            p.className = 'coracao-particula';
            const angle = (i / 16) * Math.PI * 2;
            const dist = 40 + Math.random() * 40;
            p.style.left = cx + 'px';
            p.style.top  = cy + 'px';
            p.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(1) + 'px');
            p.style.setProperty('--dy', (Math.sin(angle) * dist).toFixed(1) + 'px');
            p.style.animationDelay = (Math.random() * 0.15).toFixed(2) + 's';
            container.appendChild(p);
        }

        board.appendChild(container);

        if (typeof playSfx === 'function') {
            try { playSfx('purificacao'); } catch (e) {}
        }
        board.style.animation = 'coracaoShake 0.5s ease-out';
        setTimeout(() => { board.style.animation = ''; }, 500);

        setTimeout(() => { if (container.parentNode) container.remove(); }, 2200);
    };

    // =============================================================
    // 3. Guard + escudo no tentarSalvarComCoracao
    // =============================================================
    const _origSalvar = window.tentarSalvarComCoracao;

    window.tentarSalvarComCoracao = function() {
        // ⭐ Guard: NÃO funciona em PvP nem Coop
        if (window._pvpMode || window._coopMode) {
            console.log('[V10.57] Coração do Vazio desativado em PvP/Coop.');
            return false;
        }

        const salvou = _origSalvar ? _origSalvar.apply(this, arguments) : false;

        if (salvou && typeof players !== 'undefined' && Array.isArray(players)) {
            const heroiSalvo = players.find(p => {
                if (!p || p.dead) return false;
                if (p.hp !== 1) return false;
                const eq = (typeof getHeroEquipment === 'function') ? getHeroEquipment(p.class) : null;
                return eq && eq.amuleto && String(eq.amuleto).split('#')[0] === CORACAO_ID;
            });
            if (heroiSalvo) window.mostrarEscudoCoracao(heroiSalvo);
        }

        return salvou;
    };

    // =============================================================
    // 4. Guard nos hooks V10.43 (pvpApplyDmg / coopApplyDmg)
    // =============================================================
    const _instalarGuards = () => {
        if (typeof window.pvpApplyDmg === 'function' && !window.pvpApplyDmg._guardV1057) {
            const _orig = window.pvpApplyDmg;
            window.pvpApplyDmg = function(t, amt) { return _orig.apply(this, arguments); };
            window.pvpApplyDmg._guardV1057 = true;
        }
        if (typeof window.coopApplyDmg === 'function' && !window.coopApplyDmg._guardV1057) {
            const _orig = window.coopApplyDmg;
            window.coopApplyDmg = function(t, amt) { return _orig.apply(this, arguments); };
            window.coopApplyDmg._guardV1057 = true;
        }
    };

    _instalarGuards();
    setTimeout(_instalarGuards, 300);
    setTimeout(_instalarGuards, 1000);

    // =============================================================
    // 5. Atualizar descrição no card do Event Shop (MutationObserver)
    // =============================================================
    const _obs = new MutationObserver(() => {
        document.querySelectorAll('.evento-shop-card').forEach(card => {
            const nameEl = card.querySelector('.evento-shop-name');
            if (!nameEl || !nameEl.textContent.includes('Coração do Vazio')) return;
            const descEl = card.querySelector('.evento-shop-desc');
            if (descEl && !descEl.innerHTML.includes('Solo')) {
                descEl.innerHTML = 'Sobrevive com 1 HP.<br><span style="color:#d05050; font-size:0.8rem;">⚠️ Apenas Solo e Modo História</span>';
            }
        });
    });
    _obs.observe(document.body, { childList: true, subtree: true });

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.57] Coração do Vazio — Solo-Only + FX');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Guard em PvP/Coop (passiva não ativa)');
    console.log('• Escudo cinemático no herói salvo');
    console.log('• Descrição avisa: apenas Solo e Modo História');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V10.58 (Guard REAL da passiva em PvP/Coop)
// -----------------------------------------------------------------
// PROBLEMA:
//   O _instalarGuards do V10.57 apenas re-embrulha pvpApplyDmg/
//   coopApplyDmg. Se o hook V10.43 (checarPassivaCoração) estiver
//   ativo, a passiva ainda dispara — a proteção atual depende só
//   da ordem de carregamento (historia.js roda antes de pvp.js).
//
// SOLUÇÃO:
//   Wrapper que marca t._voidUsedThisBattle = true em PvP/Coop.
//   É o MESMO mecanismo que o checarPassivaCoração já usa como
//   "já gastou o Coração nesta batalha" — a passiva falha sozinha.
//
//   Não duplica lógica de dano. Não toca no V3.1 original.
//   Não afeta os STATS (+5 HP / +5 ATK continuam valendo).
// =================================================================

(function guardRealPassivaV1058() {
    if (window._guardRealPassivaV1058) return;
    window._guardRealPassivaV1058 = true;

    let instaladoPvp = false;
    let instaladoCoop = false;

    function instalar() {
        // ---- PvP ----
        const curPvp = window.pvpApplyDmg;
        if (typeof curPvp === 'function' && !curPvp._guardRealV1058) {
            const wrapped = function(t, amt) {
                if ((window._pvpMode || window._coopMode) && t) {
                    t._voidUsedThisBattle = true;
                }
                return curPvp.apply(this, arguments);
            };
            wrapped._guardRealV1058 = true;
            window.pvpApplyDmg = wrapped;
            if (!instaladoPvp) {
                instaladoPvp = true;
                console.log('[V10.58] Guard instalado em pvpApplyDmg.');
            }
        }

        // ---- Coop ----
        const curCoop = window.coopApplyDmg;
        if (typeof curCoop === 'function' && !curCoop._guardRealV1058) {
            const wrapped = function(t, amt) {
                if ((window._pvpMode || window._coopMode) && t) {
                    t._voidUsedThisBattle = true;
                }
                return curCoop.apply(this, arguments);
            };
            wrapped._guardRealV1058 = true;
            window.coopApplyDmg = wrapped;
            if (!instaladoCoop) {
                instaladoCoop = true;
                console.log('[V10.58] Guard instalado em coopApplyDmg.');
            }
        }
    }

    // Instalação retroativa (cobre ordem de carregamento)
    instalar();
    setTimeout(instalar, 200);
    setTimeout(instalar, 600);
    setTimeout(instalar, 1500);
    setTimeout(instalar, 3500);

    // Monitor: se algum patch substituir os wrappers, reinstala
    setInterval(() => {
        if (!window._pvpMode && !window._coopMode) return;
        instalar();
    }, 2000);

    // =============================================================
    // Diagnóstico: expõe função para debug manual
    // =============================================================
    window._debugPassivaBloqueada = function() {
        const emPvp = !!window._pvpMode;
        const emCoop = !!window._coopMode;
        const pvpGuard = window.pvpApplyDmg?._guardRealV1058 === true;
        const coopGuard = window.coopApplyDmg?._guardRealV1058 === true;

        console.log('═══ [V10.58] Status da passiva ═══');
        console.log('Modo PvP: ', emPvp);
        console.log('Modo Coop:', emCoop);
        console.log('Guard em pvpApplyDmg: ', pvpGuard);
        console.log('Guard em coopApplyDmg:', coopGuard);
        console.log('Passiva bloqueada:', (emPvp || emCoop) && (pvpGuard || coopGuard));
        console.log('═══════════════════════════════════');

        if (typeof players !== 'undefined' && Array.isArray(players)) {
            players.forEach(p => {
                if (!p) return;
                const eq = typeof getHeroEquipment === 'function'
                    ? getHeroEquipment(p.class) : null;
                const temCoracao = eq && eq.amuleto
                    && String(eq.amuleto).split('#')[0] === 'coracao_vazio';
                if (temCoracao) {
                    console.log(`🖤 ${p.name || p.class}: _voidUsedThisBattle = ${p._voidUsedThisBattle}`);
                }
            });
        }
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.58] Guard REAL da passiva ativado');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Usa o mesmo flag interno do checarPassivaCoração');
    console.log('• Não duplica lógica de dano (não injeta HP=0)');
    console.log('• Não afeta os STATS (+5 HP / +5 ATK)');
    console.log('• Instala retroativamente (cobre ordem de carregamento)');
    console.log('• Monitor de 2s em 2s (recupera se substituído)');
    console.log('');
    console.log('💡 Debug: window._debugPassivaBloqueada()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V10.60 (ATK de Nível para heróis base no História)
// -----------------------------------------------------------------
// PROBLEMA:
//   • Heróis novos (Kanarott, Eru, ...) → V36.0 aplica bonus.atk ✓
//   • Heróis base (Tupã, Sumé, Caipora) → ninguém aplica ✗
//   • PvP/Coop → V10.25 aplica ✓
//
// SOLUÇÃO:
//   Wrapper em executeAction que aplica bonus.atk em active.bonusAtk
//   para heróis base no Modo História (e Evento).
//
//   Não afeta PvP/Coop (V10.25 já cuidou — guard de entrada).
//   Não duplica heróis novos (V36.0 já cuidou — guard !isBaseHero).
// =================================================================

(function fixLevelAtkBaseHeroesV1060() {
    if (window._fixLevelAtkBaseHeroesV1060) return;
    window._fixLevelAtkBaseHeroesV1060 = true;

    const _exec = window.executeAction;
    if (typeof _exec !== 'function') {
        console.warn('[V10.60] executeAction não encontrado.');
        return;
    }

    window.executeAction = async function() {
        const isStory = !!window._storyMode;
        const isPvp   = !!window._pvpMode;
        const isCoop  = !!window._coopMode;

        // PvP/Coop: V10.25 já aplicou bonus.atk em initGame
        if (isPvp || isCoop) return _exec.apply(this, arguments);

        // Fora do história/evento (arcade, tutorial): não interfere
        // (o evento seta _storyMode = true, então é coberto)
        if (!isStory) return _exec.apply(this, arguments);

        const active = (typeof players !== 'undefined' && players)
            ? players[currentPlayerIdx] : null;
        if (!active) return _exec.apply(this, arguments);

        const heroData = (typeof STORY_HERO_CLASSES !== 'undefined')
            ? STORY_HERO_CLASSES[active.class] : null;

        // Só heróis base (Tupã, Sumé, Caipora). Heróis novos: V36.0 cuida.
        const isBaseHero = !heroData || !heroData.paKey
                        || heroData.paKey.startsWith('base_');
        if (!isBaseHero) return _exec.apply(this, arguments);

        // Pega bônus de nível
        const bonus = (typeof getHeroBonusFromLevel === 'function')
            ? getHeroBonusFromLevel(active.class) : null;
        if (!bonus || !bonus.atk || bonus.atk <= 0) {
            return _exec.apply(this, arguments);
        }

        // Aplica temporariamente em bonusAtk (que executeAction lê)
        const origBonusAtk = active.bonusAtk || 0;
        active.bonusAtk = origBonusAtk + bonus.atk;
        try {
            return await _exec.apply(this, arguments);
        } finally {
            active.bonusAtk = origBonusAtk;
        }
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.60] ATK de Nível — heróis base');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Cobre: Tupã, Sumé, Caipora (no Modo História + Evento)');
    console.log('• Não duplica: heróis novos (V36.0 já aplica)');
    console.log('• Não afeta: PvP/Coop (V10.25 já aplica)');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V10.61 (Corrupção só em bosses — fix no trigger)
// -----------------------------------------------------------------
// PROBLEMA:
//   V10.50 tem monitor sem filtro de boss, chamando trigger
//   a cada 300ms para QUALQUER inimigo abaixo de 50% HP.
//   V10.53 corrigiu só o próprio monitor, mas o de V10.50
//   continuou rodando e disparando corrupção em animais.
//
// SOLUÇÃO:
//   Guard DENTRO do triggerTabuleiroCorrompido. Nenhum monitor
//   consegue burlar — a validação está no ponto de entrada.
//
//   Para não spammar logs, quando bloqueado marcamos
//   boss._corruptedTriggered = true (o flag é resetado pelo
//   limparCorrupcao no advanceStoryEnemy).
// =================================================================

(function fixCorrupcaoSomenteBossV1061() {
    if (window._fixCorrupcaoSomenteBossV1061) return;
    window._fixCorrupcaoSomenteBossV1061 = true;

    // ⭐ Whitelist — só estes inimigos podem corromper o tabuleiro
    const BOSS_IDS = [
        // Story bosses (13 atos)
        'saci', 'mapinguari', 'iara', 'boitata', 'mula', 'corpo_seco',
        'lobisomem', 'cuca', 'boto', 'boi', 'jaci', 'guaraci', 'anhanga',
        // Espectros (Ato 13)
        'espectro_saci', 'espectro_mapinguari', 'espectro_iara', 'espectro_boitata',
        'espectro_mula', 'espectro_corposeco', 'espectro_lobisomem', 'espectro_cuca',
        'espectro_boto', 'espectro_boi', 'espectro_jaci', 'espectro_guaraci',
        // Evento semanal
        'teju_jagua', 'mboi_tui', 'monai', 'jasy_jatere', 'kurupi', 'ao_ao', 'luison',
        'pesadelo',
    ];

    function isBossAtual() {
        const enemyId = (typeof storyEnemiesRemaining !== 'undefined'
                         && storyEnemiesRemaining.length > 0)
            ? storyEnemiesRemaining[0] : null;

        if (!enemyId) return false;

        // 1. Whitelist
        if (BOSS_IDS.includes(enemyId)) return true;

        // 2. Fallback: tabela STORY_ENEMIES com isBoss = true
        if (typeof STORY_ENEMIES !== 'undefined' && STORY_ENEMIES[enemyId]) {
            const e = STORY_ENEMIES[enemyId];
            // Mini-bosses (isMiniBoss: true) NÃO contam — só isBoss
            if (e.isBoss === true) return true;
        }

        return false;
    }

    // =============================================================
    // Sobrescreve triggerTabuleiroCorrompido com o guard
    // =============================================================
    const _origTrigger = window.triggerTabuleiroCorrompido;

    window.triggerTabuleiroCorrompido = function() {
        if (!_origTrigger) {
            console.warn('[V10.61] triggerTabuleiroCorrompido original ausente.');
            return;
        }

        const enemyId = (typeof storyEnemiesRemaining !== 'undefined'
                         && storyEnemiesRemaining.length > 0)
            ? storyEnemiesRemaining[0] : '(nenhum)';

        if (!isBossAtual()) {
            // Marca para o monitor parar de chamar (resetado em advanceStoryEnemy)
            if (typeof boss !== 'undefined' && boss) {
                boss._corruptedTriggered = true;
            }
            console.log(`[V10.61] Corrupção bloqueada: "${enemyId}" não é boss.`);
            return;
        }

        // É boss → comportamento original
        return _origTrigger.apply(this, arguments);
    };

    // =============================================================
    // Diagnóstico
    // =============================================================
    window._debugCorrupcaoBoss = function() {
        const enemyId = (typeof storyEnemiesRemaining !== 'undefined'
                         && storyEnemiesRemaining.length > 0)
            ? storyEnemiesRemaining[0] : null;
        const e = (typeof STORY_ENEMIES !== 'undefined' && enemyId)
            ? STORY_ENEMIES[enemyId] : null;

        console.log('═══ [V10.61] Status da corrupção ═══');
        console.log('Inimigo atual:      ', enemyId);
        console.log('Na whitelist:       ', BOSS_IDS.includes(enemyId));
        console.log('isBoss na tabela:   ', e?.isBoss);
        console.log('isMiniBoss:         ', e?.isMiniBoss);
        console.log('Pode corromper:     ', isBossAtual());
        console.log('_corruptedTriggered:', boss?._corruptedTriggered);
        console.log('HP do boss:         ', boss ? `${boss.hp}/${boss.maxHp}` : '-');
        console.log('════════════════════════════════════');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.61] Corrupção — só bosses');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Guard dentro de triggerTabuleiroCorrompido');
    console.log('• Cobre: 13 bosses + 12 espectros + 8 do evento');
    console.log('• Exclui: animais normais + mini-bosses');
    console.log('');
    console.log('💡 Debug: window._debugCorrupcaoBoss()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V10.62 (Preview bar: tiles, forma, PA, dano estimado)
// -----------------------------------------------------------------
// Leitor passivo do estado. Nunca modifica nada.
// PvP/Coop: nunca aparece (guard).
// Se quebrar: barra some, jogo continua.
// =================================================================

(function previewBarV1062() {
    if (window._previewBarV1062) return;
    window._previewBarV1062 = true;

    // =============================================================
    // CSS
    // =============================================================
    if (!document.getElementById('previewBarCSS')) {
        const style = document.createElement('style');
        style.id = 'previewBarCSS';
        style.textContent = `
            .story-preview-bar {
                display: none;
                gap: 6px;
                justify-content: center;
                align-items: center;
                flex-wrap: wrap;
                width: 100%;
                max-width: calc((var(--tile-size) * 8) + (var(--gap) * 7) + 16px);
                margin: 0 auto;
                padding: 6px 10px;
                box-sizing: border-box;
                background: rgba(10, 6, 2, 0.7);
                border: 1px solid rgba(201, 162, 39, 0.35);
                border-radius: 6px;
                font-family: 'Cinzel', serif;
                font-size: 0.72rem;
                letter-spacing: 1px;
                min-height: 32px;
                animation: previewFadeIn 0.2s ease-out;
            }
            @keyframes previewFadeIn {
                from { opacity: 0; transform: translateY(4px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            .story-preview-bar .preview-chip {
                padding: 3px 9px;
                border-radius: 12px;
                background: rgba(10, 6, 2, 0.5);
                border: 1px solid rgba(201, 162, 39, 0.3);
                color: #e8dcc4;
                white-space: nowrap;
                display: inline-flex;
                align-items: center;
                gap: 3px;
            }
            .story-preview-bar .preview-chip.tiles {
                color: #c8b787;
            }
            .story-preview-bar .preview-chip.shape {
                background: rgba(58, 124, 165, 0.15);
            }
            .story-preview-bar .preview-chip.dano {
                color: #f0a8a8;
                border-color: rgba(168, 50, 50, 0.5);
                background: rgba(168, 50, 50, 0.12);
                font-weight: 700;
            }
            .story-preview-bar .preview-chip.heal {
                color: #8ac070;
                border-color: rgba(107, 163, 92, 0.5);
                background: rgba(107, 163, 92, 0.12);
            }
            .story-preview-bar .preview-chip.recarrega {
                color: #c39bd3;
                border-color: rgba(142, 68, 173, 0.5);
                background: rgba(142, 68, 173, 0.12);
            }
            .story-preview-bar .preview-chip.pa {
                color: #e8b923;
                border-color: #e8b923;
                background: rgba(232, 185, 35, 0.15);
                font-weight: 700;
                animation: previewPAPulse 1s ease-in-out infinite alternate;
            }
            @keyframes previewPAPulse {
                from { box-shadow: 0 0 4px rgba(232, 185, 35, 0.4); }
                to   { box-shadow: 0 0 12px rgba(232, 185, 35, 0.9); }
            }
            .story-preview-bar .preview-chip.dim {
                color: #8a7a52;
                border-color: rgba(138, 122, 82, 0.4);
                font-style: italic;
            }
            .story-preview-bar .preview-chip.help {
                cursor: help;
                color: #b8a577;
                padding: 2px 7px;
            }
        `;
        document.head.appendChild(style);
    }

    // =============================================================
    // ESTIMATIVA (só lê — nunca muta)
    // =============================================================
    function estimarPreview() {
        if (window._pvpMode || window._coopMode) return null;
        if (typeof path === 'undefined' || !path || path.length === 0) return null;
        if (typeof players === 'undefined' || !Array.isArray(players)) return null;

        const active = players[currentPlayerIdx];
        if (!active || active.dead) return null;

        const info = (typeof CLASS_DB !== 'undefined' && CLASS_DB[active.class])
            ? CLASS_DB[active.class] : { atk: 2, min: 0 };
        const heroData = (typeof STORY_HERO_CLASSES !== 'undefined' && STORY_HERO_CLASSES[active.class])
            ? STORY_HERO_CLASSES[active.class] : { role: 'Guerreiro', paKey: 'base_coluna' };
        const isBaseHero = !heroData.paKey || heroData.paKey.startsWith('base_');

        const usedPath = [...path];
        const threshold = parseInt(document.getElementById('bravely_tiles')?.value) || 9;
        const isBravely = usedPath.length >= threshold;
        const shape = (typeof detectShape === 'function') ? detectShape(usedPath) : null;

        // Bônus de nível
        let levelAtk = 0;
        if (typeof getHeroBonusFromLevel === 'function') {
            const b = getHeroBonusFromLevel(active.class);
            levelAtk = b?.atk || 0;
        }

        // Bônus de arma + elemento
        let weaponAtk = 0, weaponElem = 0;
        if (typeof getHeroEquipment === 'function' && typeof getWeaponById === 'function') {
            const eq = getHeroEquipment(active.class);
            if (eq?.arma) {
                const w = getWeaponById(eq.arma);
                if (w) {
                    weaponAtk = w.atkBonus || 0;
                    if (usedPath.length > 0) {
                        const tileEl = grid[usedPath[0]];
                        if (w.elemento === 'ANY') {
                            if (tileEl === active.element) weaponElem = w.elementoBonus || 0;
                        } else if (tileEl === w.elemento) {
                            weaponElem = w.elementoBonus || 0;
                        }
                    }
                }
            }
        }

        // Bônus de tile
        const tileBonus = (usedPath.length > 0 && grid[usedPath[0]] === active.element) ? 1 : 0;

        // Forma
        let shapeAtk = 0, heal = 0, recarrega = false;
        if (shape === 'LINHA')       { shapeAtk = 2; heal = 1; }
        else if (shape === 'L')      { heal = 2; }
        else if (shape === 'ZIGZAG') { shapeAtk = 3; }
        else if (shape === 'QUADRADO') { recarrega = true; }

        const titleAtk = active.titleBonus?.ATK || 0;
        const totalAtk = info.atk + (active.bonusAtk || 0) + levelAtk
                       + tileBonus + shapeAtk + titleAtk + weaponAtk + weaponElem;

        // Dano estimado
        let dano = 0, nota = '';
        if (heroData.role === 'Guerreiro') {
            dano = totalAtk;
            nota = 'por golpe adjacente';
        } else {
            if (usedPath.length >= (info.min || 0)) {
                const extra = usedPath.length - (info.min || 0);
                let extraDmg;
                if (isBaseHero) {
                    if (active.class === 'Sume') extraDmg = extra;
                    else if (active.class === 'Caipora') extraDmg = Math.floor(extra / 2);
                    else extraDmg = extra;
                } else {
                    extraDmg = extra;
                }
                dano = totalAtk + extraDmg;
            } else {
                const falta = (info.min || 0) - usedPath.length;
                nota = `precisa +${falta} tile${falta > 1 ? 's' : ''}`;
            }
        }

        return {
            tiles: usedPath.length, threshold, shape, isBravely,
            totalAtk, dano, nota, heal, recarrega, role: heroData.role,
        };
    }

    // =============================================================
    // RENDER
    // =============================================================
    const SHAPE_COLORS = {
        LINHA: '#3a7ca5', L: '#4a7a3a', ZIGZAG: '#c9a227', QUADRADO: '#8e44ad',
    };

    function renderPreviewBar() {
        const boardArea = document.querySelector('.board-area');
        if (!boardArea) return;

        let bar = document.getElementById('storyPreviewBar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'storyPreviewBar';
            bar.className = 'story-preview-bar';
            const actionsBar = boardArea.querySelector('.action-buttons-bar');
            if (actionsBar) boardArea.insertBefore(bar, actionsBar);
            else boardArea.appendChild(bar);
        }

        if (window._pvpMode || window._coopMode) { bar.style.display = 'none'; return; }

        let data;
        try { data = estimarPreview(); } catch (e) {
            console.warn('[V10.62] Erro na estimativa:', e);
            bar.style.display = 'none';
            return;
        }

        if (!data) { bar.style.display = 'none'; return; }
        bar.style.display = 'flex';

        const chips = [];
        chips.push(`<span class="preview-chip tiles">🎯 ${data.tiles} tile${data.tiles > 1 ? 's' : ''}</span>`);

        if (data.shape) {
            const cor = SHAPE_COLORS[data.shape] || '#c8b787';
            chips.push(`<span class="preview-chip shape" style="color:${cor}; border-color:${cor};">🟩 ${data.shape}</span>`);
        }

        if (data.isBravely) {
            chips.push(`<span class="preview-chip pa">⚡ PA ${data.tiles}/${data.threshold}</span>`);
        } else if (data.tiles >= Math.max(4, data.threshold - 3)) {
            chips.push(`<span class="preview-chip dim">⚡ ${data.tiles}/${data.threshold}</span>`);
        }

        if (data.dano > 0) {
            chips.push(`<span class="preview-chip dano">⚔️ ~${data.dano} dano</span>`);
            if (data.role === 'Guerreiro') {
                chips.push(`<span class="preview-chip dim">${data.nota}</span>`);
            }
        } else if (data.nota) {
            chips.push(`<span class="preview-chip dim">${data.nota}</span>`);
        }

        if (data.heal > 0)       chips.push(`<span class="preview-chip heal">💚 +${data.heal} HP</span>`);
        if (data.recarrega)      chips.push(`<span class="preview-chip recarrega">♻️ Recarrega</span>`);

        // Tooltip com o breakdown (desktop)
        const breakdown = `ATK base ${data.totalAtk}`;
        chips.push(`<span class="preview-chip help" title="${breakdown} · estimativa sujeita a ±2">?</span>`);

        bar.innerHTML = chips.join('');
    }

    // =============================================================
    // HOOKS
    // =============================================================
    const _installHook = () => {
        if (typeof window.renderPath !== 'function') return false;
        if (window.renderPath._previewV1062) return true;

        const _orig = window.renderPath;
        window.renderPath = function() {
            const r = _orig.apply(this, arguments);
            try { renderPreviewBar(); } catch (e) {}
            return r;
        };
        window.renderPath._previewV1062 = true;
        console.log('[V10.62] Hook em renderPath instalado.');
        return true;
    };

    if (!_installHook()) {
        const t = setInterval(() => { if (_installHook()) clearInterval(t); }, 200);
    }

    // Safety net: garante que a barra reflita mudanças mesmo se renderPath
    // for bypassado (ex: skills consumindo path sem chamar renderPath)
    setInterval(() => {
        try { renderPreviewBar(); } catch (e) {}
    }, 400);

    // Debug
    window._debugPreview = function() {
        console.log('═══ [V10.62] Preview ═══');
        console.log('Estimativa:', estimarPreview());
        console.log('Modo PvP:', window._pvpMode, '| Modo Coop:', window._coopMode);
        console.log('path:', path);
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.62] Barra de Preview instalada');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Mostra: tiles, forma, PA, dano estimado, cura, recarga');
    console.log('• Guard: invisível em PvP e Coop');
    console.log('• Não toca em executeAction nem no cálculo real');
    console.log('• Se quebrar: barra some, jogo continua');
    console.log('');
    console.log('💡 Debug: window._debugPreview()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V10.63 (Preview bar v2: guerreiro conta golpes)
// -----------------------------------------------------------------
// SUBSTITUI o V10.62. Cole APÓS o V10.62 (a barra dele é escondida
// automaticamente) ou APAGUE o V10.62 e use só este.
//
// Melhorias sobre V10.62:
//   • Guerreiro: N golpes × dano = total
//   • Guerreiro: detecta "mata" se o total ≥ HP do boss
//   • Guerreiro: detecta "não alcança o boss" se o path longe
// =================================================================

(function previewBarV2_V1063() {
    if (window._previewBarV1063) return;
    window._previewBarV1063 = true;

    // =============================================================
    // CSS
    // =============================================================
    if (!document.getElementById('previewBarV2CSS')) {
        const style = document.createElement('style');
        style.id = 'previewBarV2CSS';
        style.textContent = `
            /* Esconde a barra do V10.62 (se estiver instalado) */
            #storyPreviewBar { display: none !important; }

            .story-preview-bar {
                display: none;
                gap: 6px;
                justify-content: center;
                align-items: center;
                flex-wrap: wrap;
                width: 100%;
                max-width: calc((var(--tile-size) * 8) + (var(--gap) * 7) + 16px);
                margin: 0 auto;
                padding: 6px 10px;
                box-sizing: border-box;
                background: rgba(10, 6, 2, 0.7);
                border: 1px solid rgba(201, 162, 39, 0.35);
                border-radius: 6px;
                font-family: 'Cinzel', serif;
                font-size: 0.72rem;
                letter-spacing: 1px;
                min-height: 32px;
            }
            .story-preview-bar .preview-chip {
                padding: 3px 9px;
                border-radius: 12px;
                background: rgba(10, 6, 2, 0.5);
                border: 1px solid rgba(201, 162, 39, 0.3);
                color: #e8dcc4;
                white-space: nowrap;
                display: inline-flex;
                align-items: center;
                gap: 3px;
            }
            .story-preview-bar .preview-chip.tiles { color: #c8b787; }
            .story-preview-bar .preview-chip.shape { background: rgba(58, 124, 165, 0.15); }
            .story-preview-bar .preview-chip.dano {
                color: #f0a8a8;
                border-color: rgba(168, 50, 50, 0.5);
                background: rgba(168, 50, 50, 0.12);
                font-weight: 700;
            }
            .story-preview-bar .preview-chip.heal {
                color: #8ac070;
                border-color: rgba(107, 163, 92, 0.5);
                background: rgba(107, 163, 92, 0.12);
            }
            .story-preview-bar .preview-chip.recarrega {
                color: #c39bd3;
                border-color: rgba(142, 68, 173, 0.5);
                background: rgba(142, 68, 173, 0.12);
            }
            .story-preview-bar .preview-chip.pa {
                color: #e8b923;
                border-color: #e8b923;
                background: rgba(232, 185, 35, 0.15);
                font-weight: 700;
                animation: previewPAPulseV2 1s ease-in-out infinite alternate;
            }
            @keyframes previewPAPulseV2 {
                from { box-shadow: 0 0 4px rgba(232, 185, 35, 0.4); }
                to   { box-shadow: 0 0 12px rgba(232, 185, 35, 0.9); }
            }
            .story-preview-bar .preview-chip.dim {
                color: #8a7a52;
                border-color: rgba(138, 122, 82, 0.4);
                font-style: italic;
            }
            .story-preview-bar .preview-chip.kill {
                color: #d05050;
                border-color: rgba(208, 80, 80, 0.5);
                background: rgba(208, 80, 80, 0.15);
                font-weight: 700;
            }
            .story-preview-bar .preview-chip.help {
                cursor: help;
                color: #b8a577;
                padding: 2px 7px;
            }
        `;
        document.head.appendChild(style);
    }

    // =============================================================
    // Helper: conta golpes do guerreiro (mesma lógica do executeAction)
    // =============================================================
    function contarGolpesGuerreiro(active, usedPath) {
        if (typeof boss === 'undefined' || !boss || boss.dead) return 0;
        if (!active) return 0;

        const bAdj = (px, py) =>
            Math.abs(px - boss.x) + Math.abs(py - boss.y) <= 1;

        let golpes = 0;

        // Ataque inicial (antes de mover) — mesma chamada do executeAction
        if (bAdj(active.x, active.y)) golpes++;

        // Ataques ao longo do path
        let px = active.x, py = active.y;
        for (const idx of usedPath) {
            px = idx % 8;
            py = Math.floor(idx / 8);
            if (typeof isOccupied === 'function' && isOccupied(px, py, active.id)) break;
            if (bAdj(px, py)) golpes++;
        }

        return golpes;
    }

    // =============================================================
    // Estimativa (leitor passivo — nunca muta)
    // =============================================================
    function estimarPreview() {
        if (window._pvpMode || window._coopMode) return null;
        if (typeof path === 'undefined' || !path || path.length === 0) return null;
        if (typeof players === 'undefined' || !Array.isArray(players)) return null;

        const active = players[currentPlayerIdx];
        if (!active || active.dead) return null;

        const info = (typeof CLASS_DB !== 'undefined' && CLASS_DB[active.class])
            ? CLASS_DB[active.class] : { atk: 2, min: 0 };
        const heroData = (typeof STORY_HERO_CLASSES !== 'undefined' && STORY_HERO_CLASSES[active.class])
            ? STORY_HERO_CLASSES[active.class] : { role: 'Guerreiro', paKey: 'base_coluna' };
        const isBaseHero = !heroData.paKey || heroData.paKey.startsWith('base_');

        const usedPath = [...path];
        const threshold = parseInt(document.getElementById('bravely_tiles')?.value) || 9;
        const isBravely = usedPath.length >= threshold;
        const shape = (typeof detectShape === 'function') ? detectShape(usedPath) : null;

        let levelAtk = 0;
        if (typeof getHeroBonusFromLevel === 'function') {
            const b = getHeroBonusFromLevel(active.class);
            levelAtk = b?.atk || 0;
        }

        let weaponAtk = 0, weaponElem = 0;
        if (typeof getHeroEquipment === 'function' && typeof getWeaponById === 'function') {
            const eq = getHeroEquipment(active.class);
            if (eq?.arma) {
                const w = getWeaponById(eq.arma);
                if (w) {
                    weaponAtk = w.atkBonus || 0;
                    if (usedPath.length > 0) {
                        const tileEl = grid[usedPath[0]];
                        if (w.elemento === 'ANY') {
                            if (tileEl === active.element) weaponElem = w.elementoBonus || 0;
                        } else if (tileEl === w.elemento) {
                            weaponElem = w.elementoBonus || 0;
                        }
                    }
                }
            }
        }

        const tileBonus = (usedPath.length > 0 && grid[usedPath[0]] === active.element) ? 1 : 0;

        let shapeAtk = 0, heal = 0, recarrega = false;
        if (shape === 'LINHA') { shapeAtk = 2; heal = 1; }
        else if (shape === 'L') { heal = 2; }
        else if (shape === 'ZIGZAG') { shapeAtk = 3; }
        else if (shape === 'QUADRADO') { recarrega = true; }

        const titleAtk = active.titleBonus?.ATK || 0;
        const totalAtk = info.atk + (active.bonusAtk || 0) + levelAtk
                       + tileBonus + shapeAtk + titleAtk + weaponAtk + weaponElem;

        let dano = 0, nota = '', mata = false;

        if (heroData.role === 'Guerreiro') {
            const golpes = contarGolpesGuerreiro(active, usedPath);
            const totalBruto = totalAtk * golpes;
            const bHp = (typeof boss !== 'undefined' && boss) ? boss.hp : Infinity;
            mata = golpes > 0 && totalBruto >= bHp;

            if (golpes === 0) {
                dano = 0;
                nota = 'não alcança o boss';
            } else {
                dano = mata ? bHp : totalBruto;
                if (golpes === 1) {
                    nota = mata ? 'mata' : '1 golpe';
                } else {
                    nota = `${golpes}×${totalAtk}`;
                    if (mata) nota += ' · mata';
                }
            }
        } else {
            if (usedPath.length >= (info.min || 0)) {
                const extra = usedPath.length - (info.min || 0);
                let extraDmg;
                if (isBaseHero) {
                    if (active.class === 'Sume') extraDmg = extra;
                    else if (active.class === 'Caipora') extraDmg = Math.floor(extra / 2);
                    else extraDmg = extra;
                } else {
                    extraDmg = extra;
                }
                dano = totalAtk + extraDmg;
            } else {
                const falta = (info.min || 0) - usedPath.length;
                nota = `precisa +${falta} tile${falta > 1 ? 's' : ''}`;
            }
        }

        return {
            tiles: usedPath.length, threshold, shape, isBravely,
            totalAtk, dano, nota, heal, recarrega, role: heroData.role, mata,
        };
    }

    // =============================================================
    // Render
    // =============================================================
    const SHAPE_COLORS = {
        LINHA: '#3a7ca5', L: '#4a7a3a', ZIGZAG: '#c9a227', QUADRADO: '#8e44ad',
    };

    function renderPreviewBarV2() {
        const boardArea = document.querySelector('.board-area');
        if (!boardArea) return;

        let bar = document.getElementById('storyPreviewBarV2');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'storyPreviewBarV2';
            bar.className = 'story-preview-bar';
            const actionsBar = boardArea.querySelector('.action-buttons-bar');
            if (actionsBar) boardArea.insertBefore(bar, actionsBar);
            else boardArea.appendChild(bar);
        }

        if (window._pvpMode || window._coopMode) {
            bar.style.display = 'none';
            return;
        }

        let data;
        try { data = estimarPreview(); } catch (e) {
            console.warn('[V10.63] Erro na estimativa:', e);
            bar.style.display = 'none';
            return;
        }
        if (!data) { bar.style.display = 'none'; return; }

        bar.style.display = 'flex';

        const chips = [];
        chips.push(`<span class="preview-chip tiles">🎯 ${data.tiles} tile${data.tiles > 1 ? 's' : ''}</span>`);

        if (data.shape) {
            const cor = SHAPE_COLORS[data.shape] || '#c8b787';
            chips.push(`<span class="preview-chip shape" style="color:${cor}; border-color:${cor};">🟩 ${data.shape}</span>`);
        }

        if (data.isBravely) {
            chips.push(`<span class="preview-chip pa">⚡ PA ${data.tiles}/${data.threshold}</span>`);
        } else if (data.tiles >= Math.max(4, data.threshold - 3)) {
            chips.push(`<span class="preview-chip dim">⚡ ${data.tiles}/${data.threshold}</span>`);
        }

        if (data.dano > 0) {
            chips.push(`<span class="preview-chip dano">⚔️ ~${data.dano} dano</span>`);
        }
        if (data.nota) {
            const cls = data.mata ? 'kill' : 'dim';
            chips.push(`<span class="preview-chip ${cls}">${data.nota}</span>`);
        }

        if (data.heal > 0)  chips.push(`<span class="preview-chip heal">💚 +${data.heal} HP</span>`);
        if (data.recarrega) chips.push(`<span class="preview-chip recarrega">♻️ Recarrega</span>`);

        chips.push(`<span class="preview-chip help" title="ATK base ${data.totalAtk} · estimativa">?</span>`);

        bar.innerHTML = chips.join('');
    }

    // =============================================================
    // Hooks
    // =============================================================
    const _installHook = () => {
        if (typeof window.renderPath !== 'function') return false;
        if (window.renderPath._previewV1063) return true;

        const _orig = window.renderPath;
        window.renderPath = function() {
            const r = _orig.apply(this, arguments);
            try { renderPreviewBarV2(); } catch (e) {}
            return r;
        };
        window.renderPath._previewV1063 = true;
        console.log('[V10.63] Hook em renderPath instalado.');
        return true;
    };

    if (!_installHook()) {
        const t = setInterval(() => { if (_installHook()) clearInterval(t); }, 200);
    }

    setInterval(() => { try { renderPreviewBarV2(); } catch (e) {} }, 400);

    // Debug
    window._debugPreviewV2 = function() {
        console.log('═══ [V10.63] Preview v2 ═══');
        console.log('Estimativa:', estimarPreview());
        const golpes = (typeof players !== 'undefined' && players[currentPlayerIdx])
            ? contarGolpesGuerreiro(players[currentPlayerIdx], path || [])
            : 0;
        console.log('Golpes do guerreiro:', golpes);
        console.log('Path:', path);
        console.log('Boss:', boss ? `${boss.x},${boss.y} HP=${boss.hp}` : 'sem boss');
        console.log('PvP:', window._pvpMode, '| Coop:', window._coopMode);
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.63] Preview bar v2 — guerreiro com golpes');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Guerreiro: mostra N golpes × dano = total');
    console.log('• Guerreiro: detecta "mata" e "não alcança"');
    console.log('• V10.62 (se presente) é escondido via CSS');
    console.log('');
    console.log('💡 Debug: window._debugPreviewV2()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V10.64 (Formas piscam + cores distintas dos tiles)
// -----------------------------------------------------------------
// Complementa o V10.63 (não substitui):
//   • Troca as cores das formas (linha/L/zigzag/quadrado)
//   • Adiciona animação pulsante no chip .shape
//   • Chip .pa continua pulsando (já era do V10.63)
//   • Não afeta PvP/Coop (barra nem aparece lá)
// =================================================================

(function previewShapePulseV1064() {
    if (window._previewShapePulseV1064) return;
    window._previewShapePulseV1064 = true;

    const SHAPE_COLORS_V1064 = {
        LINHA:    '#c39bd3',  // lilás   — distinto do azul (AGUA)
        L:        '#e67e22',  // laranja — distinto do amarelo (AR) e vermelho (FOGO)
        ZIGZAG:   '#1abc9c',  // turquesa— distinto do verde (TERRA) e azul (AGUA)
        QUADRADO: '#e84393',  // magenta — distinto de tudo
    };

    // =============================================================
    // CSS
    // =============================================================
    if (!document.getElementById('previewShapePulseCSS')) {
        const style = document.createElement('style');
        style.id = 'previewShapePulseCSS';
        style.textContent = `
            /* Chip da forma: pulso suave */
            .story-preview-bar .preview-chip.shape {
                animation: shapePulseV1064 1.1s ease-in-out infinite alternate !important;
                font-weight: 700;
                transition: transform 0.2s;
            }
            @keyframes shapePulseV1064 {
                from {
                    box-shadow:
                        0 0 4px currentColor,
                        inset 0 0 3px rgba(255, 255, 255, 0.05);
                    transform: scale(1);
                }
                to {
                    box-shadow:
                        0 0 14px currentColor,
                        0 0 24px currentColor,
                        inset 0 0 8px rgba(255, 255, 255, 0.15);
                    transform: scale(1.07);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // =============================================================
    // Patch: reaplica as cores no chip .shape toda vez que bar renderiza
    // =============================================================
    const _patchShapeChip = () => {
        const bar = document.getElementById('storyPreviewBarV2');
        if (!bar) return;
        const chip = bar.querySelector('.preview-chip.shape');
        if (!chip) return;

        // Extrai o nome da forma do texto (ex: "🟩 LINHA" → "LINHA")
        const raw = chip.textContent.replace('🟩', '').trim();
        if (!raw) return;

        const cor = SHAPE_COLORS_V1064[raw];
        if (!cor) return;

        // Evita reaplicar (que dispararia loop de mutations)
        if (chip.getAttribute('data-shape') === raw) return;

        chip.style.color = cor;
        chip.style.borderColor = cor;
        chip.setAttribute('data-shape', raw);
    };

    // MutationObserver — dispara quando o V10.63 re-renderiza a barra
    try {
        const obs = new MutationObserver(() => {
            try { _patchShapeChip(); } catch (e) {}
        });
        obs.observe(document.body, { childList: true, subtree: true });
    } catch (e) {
        console.warn('[V10.64] MutationObserver falhou:', e);
    }

    // Rodadas iniciais (garantia)
    setTimeout(_patchShapeChip, 500);
    setTimeout(_patchShapeChip, 1500);
    setTimeout(_patchShapeChip, 3000);

    // =============================================================
    // Debug
    // =============================================================
    window._debugPreviewCores = function() {
        const bar = document.getElementById('storyPreviewBarV2');
        const chip = bar?.querySelector('.preview-chip.shape');
        console.log('═══ [V10.64] Cores do preview ═══');
        console.log('Chip da forma:', chip);
        console.log('data-shape:', chip?.getAttribute('data-shape'));
        console.log('Cor aplicada:', chip?.style.color);
        console.log('Cores esperadas:', SHAPE_COLORS_V1064);
        console.log('═══════════════════════════════════');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.64] Formas piscando com cores novas');
    console.log('═══════════════════════════════════════════════════');
    console.log('Cores (distintas dos tiles):');
    console.log('  LINHA    →', SHAPE_COLORS_V1064.LINHA, '(lilás)');
    console.log('  L        →', SHAPE_COLORS_V1064.L, '(laranja)');
    console.log('  ZIGZAG   →', SHAPE_COLORS_V1064.ZIGZAG, '(turquesa)');
    console.log('  QUADRADO →', SHAPE_COLORS_V1064.QUADRADO, '(magenta)');
    console.log('');
    console.log('• Só a forma pisca (dano/heal/PA continuam como antes)');
    console.log('• Chip do PA mantém o pulso dourado do V10.63');
    console.log('');
    console.log('💡 Debug: window._debugPreviewCores()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V10.64 (Forma pisca em prata — cor neutra)
// -----------------------------------------------------------------
// Aplica em CIMA do V10.63 (não substitui):
//   • Chip .shape pulsa em branco-prateado (neutro)
//   • Não usa cores de elemento (fogo/água/terra/ar)
//   • Não usa dourado (reservado pro PA)
//   • Não usa roxo (reservado pra corrupção)
//   • Glow suave — não ofusca os tiles ao redor
// =================================================================

(function previewShapePulseNeutralV1064() {
    if (window._previewShapePulseNeutralV1064) return;
    window._previewShapePulseNeutralV1064 = true;

    const NEUTRAL_COLOR = '#e8e8f0';  // prata (UI, não elemento)

    if (!document.getElementById('previewShapePulseNeutralCSS')) {
        const style = document.createElement('style');
        style.id = 'previewShapePulseNeutralCSS';
        style.textContent = `
            .story-preview-bar .preview-chip.shape {
                color: ${NEUTRAL_COLOR} !important;
                border-color: rgba(232, 232, 240, 0.45) !important;
                background: rgba(232, 232, 240, 0.06) !important;
                font-weight: 700;
                animation: shapePulseNeutral 1.1s ease-in-out infinite alternate !important;
                transition: transform 0.2s;
            }
            @keyframes shapePulseNeutral {
                from {
                    box-shadow: 0 0 3px rgba(232, 232, 240, 0.25);
                    transform: scale(1);
                }
                to {
                    box-shadow:
                        0 0 10px rgba(232, 232, 240, 0.7),
                        inset 0 0 4px rgba(232, 232, 240, 0.15);
                    transform: scale(1.06);
                }
            }
        `;
        document.head.appendChild(style);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.64] Forma pulsa em prata (neutro)');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Cor única:', NEUTRAL_COLOR, '(branco-prateado)');
    console.log('• Glow suave — não ofusca os tiles');
    console.log('• PA mantém o dourado pulsante (distinto)');
    console.log('• Sem conflito com FOGO/AGUA/TERRA/AR');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V10.65 (Tiles da forma piscam no TABULEIRO)
// -----------------------------------------------------------------
// Aplica em CIMA do V10.63 (o chip de preview continua lá).
//
// Comportamento:
//   • path === 4 e forma válida → os 4 tiles do path piscam em prata
//   • path !== 4 (0, 1, 2, 3, 5, 9...) → nenhum tile pisca
//   • PvP/Coop → nunca pisca (guard)
//
// Visual:
//   • Anel prateado ao redor do tile (pulsa)
//   • Brilho suave no interior (brightness 1 → 1.3)
//   • Não toca no background (elemento continua visível)
//   • Não conflita com .selected (gold do caminho) nem .bravely-ready
// =================================================================

(function tilesFlashFormaV1065() {
    if (window._tilesFlashFormaV1065) return;
    window._tilesFlashFormaV1065 = true;

    // =============================================================
    // CSS
    // =============================================================
    if (!document.getElementById('tilesFlashFormaCSS')) {
        const style = document.createElement('style');
        style.id = 'tilesFlashFormaCSS';
        style.textContent = `
            /* Brilho suave no tile (não muda o background) */
            .tile.shape-flash {
                animation: shapeFlashBrightness 0.9s ease-in-out infinite alternate;
            }
            @keyframes shapeFlashBrightness {
                from { filter: brightness(1); }
                to   { filter: brightness(1.35); }
            }

            /* Anel prateado pulsando por FORA do tile */
            .tile.shape-flash::after {
                content: '';
                position: absolute;
                inset: -4px;
                border: 2px solid rgba(232, 232, 240, 0.85);
                border-radius: 7px;
                pointer-events: none;
                box-shadow:
                    0 0 8px rgba(232, 232, 240, 0.6),
                    0 0 16px rgba(232, 232, 240, 0.3);
                animation: shapeFlashRing 0.9s ease-in-out infinite alternate;
                z-index: 4;
            }
            @keyframes shapeFlashRing {
                from { opacity: 0.4; transform: scale(1); }
                to   { opacity: 1;   transform: scale(1.05); }
            }
        `;
        document.head.appendChild(style);
    }

    // =============================================================
    // Aplicar / remover flash nos tiles
    // =============================================================
    function atualizarFlashForma() {
        const gridEl = document.getElementById('grid');
        if (!gridEl) return;

        // 1. Remove de todos
        gridEl.querySelectorAll('.tile.shape-flash').forEach(t => {
            t.classList.remove('shape-flash');
        });

        // 2. Guards
        if (window._pvpMode || window._coopMode) return;
        if (typeof path === 'undefined' || !path || path.length !== 4) return;
        if (typeof detectShape !== 'function') return;

        // 3. Forma válida?
        let shape = null;
        try { shape = detectShape(path); } catch (e) { return; }
        if (!shape) return;

        // 4. Aplica nos 4 tiles
        const tiles = gridEl.querySelectorAll('.tile');
        path.forEach(idx => {
            if (tiles[idx]) tiles[idx].classList.add('shape-flash');
        });
    }

    // =============================================================
    // Hook em renderPath (cobre todos os cliques / undo / reset)
    // =============================================================
    const _installHook = () => {
        if (typeof window.renderPath !== 'function') return false;
        if (window.renderPath._tilesFlashV1065) return true;

        const _orig = window.renderPath;
        window.renderPath = function() {
            const r = _orig.apply(this, arguments);
            try { atualizarFlashForma(); } catch (e) {}
            return r;
        };
        window.renderPath._tilesFlashV1065 = true;
        console.log('[V10.65] Hook em renderPath instalado.');
        return true;
    };

    if (!_installHook()) {
        const t = setInterval(() => { if (_installHook()) clearInterval(t); }, 200);
    }

    // Safety net — cobre casos em que renderPath não roda mas o path mudou
    // (ex: boss atacou, troca de turno, phase acabou)
    setInterval(() => {
        try { atualizarFlashForma(); } catch (e) {}
    }, 400);

    // =============================================================
    // Debug
    // =============================================================
    window._debugFlashForma = function() {
        const gridEl = document.getElementById('grid');
        const flashing = gridEl
            ? gridEl.querySelectorAll('.tile.shape-flash').length
            : 0;
        let shape = null;
        try { shape = (typeof path !== 'undefined' && path && path.length === 4) ? detectShape(path) : null; }
        catch (e) {}
        console.log('═══ [V10.65] Flash da forma ═══');
        console.log('Path length:', path?.length || 0);
        console.log('Forma detectada:', shape || '(nenhuma)');
        console.log('Tiles piscando:', flashing);
        console.log('PvP:', window._pvpMode, '| Coop:', window._coopMode);
        console.log('═════════════════════════════════');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.65] Tiles da forma piscam no tabuleiro');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Anel prateado ao redor dos tiles');
    console.log('• Brilho suave (brightness 1 → 1.35)');
    console.log('• Background do elemento intacto (FOGO/AGUA/.../AR)');
    console.log('• Só path === 4 + forma válida (comportamento do jogo)');
    console.log('• PvP/Coop: nunca pisca');
    console.log('');
    console.log('💡 Debug: window._debugFlashForma()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V10.66 (Preview dano CORRIGIDO + debug purificação)
// -----------------------------------------------------------------
// Fix do bug: weaponAtk era contado 2× (já estava em active.bonusAtk)
// Fix extra: weaponElem só para heróis novos (base não recebe)
//
// Substitui V10.63:
//   • Esconde storyPreviewBarV2 via CSS
//   • Nova barra storyPreviewBarV3 com cálculo correto
//   • V10.62/V10.63 continuam rodando (escondidos), sem conflito
// =================================================================

(function previewBarV3_V1066() {
    if (window._previewBarV1066) return;
    window._previewBarV1066 = true;

    // Esconde versões antigas
    if (!document.getElementById('previewV3CSS')) {
        const style = document.createElement('style');
        style.id = 'previewV3CSS';
        style.textContent = `
            #storyPreviewBar, #storyPreviewBarV2 { display: none !important; }

            .story-preview-bar-v3 {
                display: none;
                gap: 6px;
                justify-content: center;
                align-items: center;
                flex-wrap: wrap;
                width: 100%;
                max-width: calc((var(--tile-size) * 8) + (var(--gap) * 7) + 16px);
                margin: 0 auto;
                padding: 6px 10px;
                box-sizing: border-box;
                background: rgba(10, 6, 2, 0.7);
                border: 1px solid rgba(201, 162, 39, 0.35);
                border-radius: 6px;
                font-family: 'Cinzel', serif;
                font-size: 0.72rem;
                letter-spacing: 1px;
                min-height: 32px;
            }
            .story-preview-bar-v3 .preview-chip {
                padding: 3px 9px;
                border-radius: 12px;
                background: rgba(10, 6, 2, 0.5);
                border: 1px solid rgba(201, 162, 39, 0.3);
                color: #e8dcc4;
                white-space: nowrap;
                display: inline-flex;
                align-items: center;
                gap: 3px;
            }
            .story-preview-bar-v3 .preview-chip.tiles { color: #c8b787; }
            .story-preview-bar-v3 .preview-chip.shape {
                color: #e8e8f0 !important;
                border-color: rgba(232, 232, 240, 0.45) !important;
                background: rgba(232, 232, 240, 0.06) !important;
                font-weight: 700;
                animation: shapePulseV3 1.1s ease-in-out infinite alternate;
            }
            @keyframes shapePulseV3 {
                from { box-shadow: 0 0 3px rgba(232,232,240,0.25); transform: scale(1); }
                to   { box-shadow: 0 0 10px rgba(232,232,240,0.7); transform: scale(1.06); }
            }
            .story-preview-bar-v3 .preview-chip.dano {
                color: #f0a8a8;
                border-color: rgba(168, 50, 50, 0.5);
                background: rgba(168, 50, 50, 0.12);
                font-weight: 700;
            }
            .story-preview-bar-v3 .preview-chip.heal {
                color: #8ac070;
                border-color: rgba(107, 163, 92, 0.5);
                background: rgba(107, 163, 92, 0.12);
            }
            .story-preview-bar-v3 .preview-chip.recarrega {
                color: #c39bd3;
                border-color: rgba(142, 68, 173, 0.5);
                background: rgba(142, 68, 173, 0.12);
            }
            .story-preview-bar-v3 .preview-chip.pa {
                color: #e8b923;
                border-color: #e8b923;
                background: rgba(232, 185, 35, 0.15);
                font-weight: 700;
                animation: previewPAV3 1s ease-in-out infinite alternate;
            }
            @keyframes previewPAV3 {
                from { box-shadow: 0 0 4px rgba(232,185,35,0.4); }
                to   { box-shadow: 0 0 12px rgba(232,185,35,0.9); }
            }
            .story-preview-bar-v3 .preview-chip.dim {
                color: #8a7a52;
                border-color: rgba(138, 122, 82, 0.4);
                font-style: italic;
            }
            .story-preview-bar-v3 .preview-chip.kill {
                color: #d05050;
                border-color: rgba(208, 80, 80, 0.5);
                background: rgba(208, 80, 80, 0.15);
                font-weight: 700;
            }
            .story-preview-bar-v3 .preview-chip.help {
                cursor: help;
                color: #b8a577;
                padding: 2px 7px;
            }
        `;
        document.head.appendChild(style);
    }

    // =============================================================
    // Contar golpes do guerreiro
    // =============================================================
    function contarGolpesGuerreiro(active, usedPath) {
        if (typeof boss === 'undefined' || !boss || boss.dead) return 0;
        if (!active) return 0;
        const bAdj = (px, py) =>
            Math.abs(px - boss.x) + Math.abs(py - boss.y) <= 1;
        let golpes = 0;
        if (bAdj(active.x, active.y)) golpes++;
        let px = active.x, py = active.y;
        for (const idx of usedPath) {
            px = idx % 8;
            py = Math.floor(idx / 8);
            if (typeof isOccupied === 'function' && isOccupied(px, py, active.id)) break;
            if (bAdj(px, py)) golpes++;
        }
        return golpes;
    }

    // =============================================================
    // Estimativa CORRIGIDA
    // -------------------------------------------------------------
    // FIX: NÃO soma weaponAtk (já está em active.bonusAtk)
    // FIX: weaponElem só para heróis novos (V9.0-B2 pula base)
    // =============================================================
    function estimarPreviewV3() {
        if (window._pvpMode || window._coopMode) return null;
        if (typeof path === 'undefined' || !path || path.length === 0) return null;
        if (typeof players === 'undefined' || !Array.isArray(players)) return null;

        const active = players[currentPlayerIdx];
        if (!active || active.dead) return null;

        const info = (typeof CLASS_DB !== 'undefined' && CLASS_DB[active.class])
            ? CLASS_DB[active.class] : { atk: 2, min: 0 };
        const heroData = (typeof STORY_HERO_CLASSES !== 'undefined' && STORY_HERO_CLASSES[active.class])
            ? STORY_HERO_CLASSES[active.class] : { role: 'Guerreiro', paKey: 'base_coluna' };
        const isBaseHero = !heroData.paKey || heroData.paKey.startsWith('base_');

        const usedPath = [...path];
        const threshold = parseInt(document.getElementById('bravely_tiles')?.value) || 9;
        const isBravely = usedPath.length >= threshold;
        const shape = (typeof detectShape === 'function') ? detectShape(usedPath) : null;

        let levelAtk = 0;
        if (typeof getHeroBonusFromLevel === 'function') {
            const b = getHeroBonusFromLevel(active.class);
            levelAtk = b?.atk || 0;
        }

        // weaponElem: SÓ heróis novos (V9.0-B2 pula base). NÃO soma atkBonus.
        let weaponElem = 0;
        if (!isBaseHero && typeof getHeroEquipment === 'function' && typeof getWeaponById === 'function') {
            const eq = getHeroEquipment(active.class);
            if (eq?.arma && usedPath.length > 0) {
                const w = getWeaponById(eq.arma);
                if (w) {
                    const tileEl = grid[usedPath[0]];
                    if (w.elemento === 'ANY') {
                        if (tileEl === active.element) weaponElem = w.elementoBonus || 0;
                    } else if (tileEl === w.elemento) {
                        weaponElem = w.elementoBonus || 0;
                    }
                }
            }
        }

        const tileBonus = (usedPath.length > 0 && grid[usedPath[0]] === active.element) ? 1 : 0;

        let shapeAtk = 0, heal = 0, recarrega = false;
        if (shape === 'LINHA') { shapeAtk = 2; heal = 1; }
        else if (shape === 'L') { heal = 2; }
        else if (shape === 'ZIGZAG') { shapeAtk = 3; }
        else if (shape === 'QUADRADO') { recarrega = true; }

        const titleAtk = active.titleBonus?.ATK || 0;

        // ⭐ FIX: sem weaponAtk (já em active.bonusAtk)
        const totalAtk = info.atk + (active.bonusAtk || 0) + levelAtk
                       + tileBonus + shapeAtk + titleAtk + weaponElem;

        let dano = 0, nota = '', mata = false;

        if (heroData.role === 'Guerreiro') {
            const golpes = contarGolpesGuerreiro(active, usedPath);
            const totalBruto = totalAtk * golpes;
            const bHp = (typeof boss !== 'undefined' && boss) ? boss.hp : Infinity;
            mata = golpes > 0 && totalBruto >= bHp;

            if (golpes === 0) {
                dano = 0;
                nota = 'não alcança o boss';
            } else {
                dano = mata ? bHp : totalBruto;
                if (golpes === 1) {
                    nota = mata ? 'mata' : '1 golpe';
                } else {
                    nota = `${golpes}×${totalAtk}`;
                    if (mata) nota += ' · mata';
                }
            }
        } else {
            if (usedPath.length >= (info.min || 0)) {
                const extra = usedPath.length - (info.min || 0);
                let extraDmg;
                if (isBaseHero) {
                    if (active.class === 'Sume') extraDmg = extra;
                    else if (active.class === 'Caipora') extraDmg = Math.floor(extra / 2);
                    else extraDmg = extra;
                } else {
                    extraDmg = extra;
                }
                dano = totalAtk + extraDmg;
            } else {
                const falta = (info.min || 0) - usedPath.length;
                nota = `precisa +${falta} tile${falta > 1 ? 's' : ''}`;
            }
        }

        return {
            tiles: usedPath.length, threshold, shape, isBravely,
            totalAtk, dano, nota, heal, recarrega, role: heroData.role, mata,
        };
    }

    // =============================================================
    // Render
    // =============================================================
    function renderBarV3() {
        const boardArea = document.querySelector('.board-area');
        if (!boardArea) return;

        let bar = document.getElementById('storyPreviewBarV3');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'storyPreviewBarV3';
            bar.className = 'story-preview-bar-v3';
            const actionsBar = boardArea.querySelector('.action-buttons-bar');
            if (actionsBar) boardArea.insertBefore(bar, actionsBar);
            else boardArea.appendChild(bar);
        }

        if (window._pvpMode || window._coopMode) {
            bar.style.display = 'none';
            return;
        }

        let data;
        try { data = estimarPreviewV3(); } catch (e) {
            console.warn('[V10.66] Erro na estimativa:', e);
            bar.style.display = 'none';
            return;
        }
        if (!data) { bar.style.display = 'none'; return; }

        bar.style.display = 'flex';

        const chips = [];
        chips.push(`<span class="preview-chip tiles">🎯 ${data.tiles} tile${data.tiles > 1 ? 's' : ''}</span>`);

        if (data.shape) {
            chips.push(`<span class="preview-chip shape">🟩 ${data.shape}</span>`);
        }

        if (data.isBravely) {
            chips.push(`<span class="preview-chip pa">⚡ PA ${data.tiles}/${data.threshold}</span>`);
        } else if (data.tiles >= Math.max(4, data.threshold - 3)) {
            chips.push(`<span class="preview-chip dim">⚡ ${data.tiles}/${data.threshold}</span>`);
        }

        if (data.dano > 0) {
            chips.push(`<span class="preview-chip dano">⚔️ ~${data.dano} dano</span>`);
        }
        if (data.nota) {
            const cls = data.mata ? 'kill' : 'dim';
            chips.push(`<span class="preview-chip ${cls}">${data.nota}</span>`);
        }

        if (data.heal > 0)  chips.push(`<span class="preview-chip heal">💚 +${data.heal} HP</span>`);
        if (data.recarrega) chips.push(`<span class="preview-chip recarrega">♻️ Recarrega</span>`);

        chips.push(`<span class="preview-chip help" title="ATK base ${data.totalAtk} · estimativa">?</span>`);

        bar.innerHTML = chips.join('');
    }

    // Hooks
    const _install = () => {
        if (typeof window.renderPath !== 'function') return false;
        if (window.renderPath._previewV1066) return true;
        const _orig = window.renderPath;
        window.renderPath = function() {
            const r = _orig.apply(this, arguments);
            try { renderBarV3(); } catch (e) {}
            return r;
        };
        window.renderPath._previewV1066 = true;
        console.log('[V10.66] Hook renderPath instalado.');
        return true;
    };
    if (!_install()) {
        const t = setInterval(() => { if (_install()) clearInterval(t); }, 200);
    }

    setInterval(() => { try { renderBarV3(); } catch (e) {} }, 400);

    // =============================================================
    // Debug da purificação
    // =============================================================
    window._debugPurificacao = function() {
        console.log('═══ [Debug] Purificação ═══');
        console.log('_storyMode:        ', window._storyMode);
        console.log('_cinemaFila:       ', window._cinemaFila);
        console.log('_gifPAEmAndamento: ', window._gifPAEmAndamento);
        console.log('_processingBossDefeat:', window._processingBossDefeat);
        console.log('_storyPurificationShowing:', window._storyPurificationShowing);
        console.log('PvP:', window._pvpMode, '| Coop:', window._coopMode);
        console.log('Boss:', boss ? `type=${boss.type}, hp=${boss.hp}/${boss.maxHp}, dead=${boss.dead}` : 'null');
        console.log('storyEnemiesRemaining:', window.storyEnemiesRemaining);
        console.log('══════════════════════════');
    };

    window._debugPreviewV3 = function() {
        console.log('═══ [V10.66] Preview v3 ═══');
        const active = players?.[currentPlayerIdx];
        console.log('Estimativa:', estimarPreviewV3());
        console.log('active.bonusAtk:', active?.bonusAtk);
        console.log('active.equippedWeapon:', active?.equippedWeapon?.nome);
        console.log('══════════════════════════');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.66] Preview v3 — dano CORRIGIDO');
    console.log('═══════════════════════════════════════════════════');
    console.log('• weaponAtk removido (já em bonusAtk)');
    console.log('• weaponElem só para heróis novos');
    console.log('• Barra V10.62/V10.63 escondidas via CSS');
    console.log('');
    console.log('💡 Debug:');
    console.log('   window._debugPreviewV3()    → ver dano calculado');
    console.log('   window._debugPurificacao()  → ver estado da purificação');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V10.67 (Purificação reescrita — fix do ReferenceError)
// -----------------------------------------------------------------
// Bug confirmado:
//   V16.1 chama enfileirarCinema() (bare) → ReferenceError
//   → capturado silenciosamente pelo V17.0 → animação nunca cria
//
// Solução:
//   Substitui TODA a cadeia por uma versão única, robusta,
//   com try/catch defensivo e suporte ao toggle skipBravelyAnimations.
//
//   Mantém a mesma API (bossType, tileX, tileY, isFinalBoss).
//   Compatível com todos os call sites existentes.
// =================================================================

(function fixPurificacaoV1067() {
    if (window._fixPurificacaoV1067) return;
    window._fixPurificacaoV1067 = true;

    // =============================================================
    // Garantia de CSS (fallback se o index não carregou)
    // =============================================================
    if (!document.getElementById('purificacao-fallback-css')) {
        // Só injeta se o CSS existente não definir a animação
        const testEl = document.createElement('div');
        testEl.className = 'purificacao-feixe';
        document.body.appendChild(testEl);
        const hasAnim = getComputedStyle(testEl).animationName !== 'none';
        document.body.removeChild(testEl);

        if (!hasAnim) {
            console.warn('[V10.67] CSS de purificação ausente — injetando fallback.');
            const style = document.createElement('style');
            style.id = 'purificacao-fallback-css';
            style.textContent = `
                .purificacao-overlay {
                    position: absolute; inset: 0;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.4s ease;
                    z-index: 300;
                }
                .purificacao-overlay.active { opacity: 1; }
                .purificacao-darken {
                    position: absolute; inset: 0;
                    background: radial-gradient(ellipse at center,
                        rgba(10,6,2,0.3) 0%,
                        rgba(10,6,2,0.75) 100%);
                    animation: purifDarken 2.6s ease-in-out forwards;
                }
                @keyframes purifDarken {
                    0% { opacity: 0; } 15% { opacity: 1; }
                    85% { opacity: 1; } 100% { opacity: 0; }
                }
                .purificacao-feixe {
                    position: absolute; top: 0;
                    background: linear-gradient(180deg,
                        rgba(255,245,220,0) 0%,
                        rgba(255,245,220,0.5) 15%,
                        rgba(232,185,35,0.85) 45%,
                        rgba(255,245,220,0.95) 75%,
                        rgba(255,245,220,0) 100%);
                    filter: blur(6px);
                    transform-origin: top center;
                    animation: purifFeixe 2.6s cubic-bezier(0.3,0,0.4,1) forwards;
                    mix-blend-mode: screen;
                }
                @keyframes purifFeixe {
                    0% { transform: translateX(-50%) scaleY(0); opacity: 0; }
                    15% { transform: translateX(-50%) scaleY(1); opacity: 1; }
                    75% { transform: translateX(-50%) scaleY(1); opacity: 1; }
                    100% { transform: translateX(-50%) scaleY(1); opacity: 0; }
                }
                .purificacao-halo {
                    position: absolute;
                    width: 160px; height: 160px;
                    border-radius: 50%;
                    transform: translate(-50%, -50%) scale(0.3);
                    background: radial-gradient(circle,
                        rgba(255,250,235,0.95) 0%,
                        rgba(255,235,180,0.7) 25%,
                        rgba(232,185,35,0.5) 50%,
                        rgba(232,185,35,0) 75%);
                    animation: purifHalo 2.6s ease-out forwards;
                    mix-blend-mode: screen;
                    pointer-events: none;
                }
                @keyframes purifHalo {
                    0% { transform: translate(-50%,-50%) scale(0.3); opacity: 0; }
                    20% { transform: translate(-50%,-50%) scale(1.0); opacity: 1; }
                    70% { transform: translate(-50%,-50%) scale(1.2); opacity: 0.9; }
                    100% { transform: translate(-50%,-50%) scale(1.6); opacity: 0; }
                }
                .purificacao-particula {
                    position: absolute;
                    width: 6px; height: 6px;
                    border-radius: 50%;
                    background: radial-gradient(circle, #fff5dc 0%, #e8b923 50%, rgba(232,185,35,0) 100%);
                    box-shadow: 0 0 8px 2px rgba(232,185,35,0.8);
                    pointer-events: none;
                    animation: purifPart 2.2s ease-out forwards;
                    opacity: 0;
                }
                @keyframes purifPart {
                    0% { opacity: 0; transform: translate(0,0) scale(0.4); }
                    15% { opacity: 1; transform: translate(0,-10px) scale(1); }
                    100% { opacity: 0; transform: translate(var(--dx,0), var(--dy,-180px)) scale(0.6); }
                }
                img.purificacao-flash {
                    animation: purifFlash 2.4s ease-out forwards;
                }
                @keyframes purifFlash {
                    0% { filter: brightness(1); }
                    20% { filter: brightness(2.2) drop-shadow(0 0 20px rgba(255,245,220,1)); }
                    60% { filter: brightness(1.8) drop-shadow(0 0 15px rgba(255,245,220,0.8)); }
                    85% { filter: brightness(1.2); opacity: 1; }
                    100% { filter: brightness(0.6); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // =============================================================
    // Versão curta (skipBravelyAnimations ligado)
    // =============================================================
    function purificacaoCurta() {
        return new Promise((resolve) => {
            const board = document.getElementById('board');
            if (!board) { resolve(); return; }

            const overlay = document.createElement('div');
            overlay.className = 'purificacao-overlay active';
            overlay.id = 'purificacaoOverlay';
            overlay.innerHTML = `<div class="purificacao-darken"></div>`;
            board.appendChild(overlay);

            if (typeof playSfx === 'function') {
                try { playSfx('purificacao'); } catch (e) {}
            }

            setTimeout(() => {
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                resolve();
            }, 800);
        });
    }

    // =============================================================
    // Versão completa (feixe, halo, partículas, flash)
    // =============================================================
    function purificacaoCompleta(bossType, tileX, tileY, isFinalBoss) {
        return new Promise((resolve) => {
            const board = document.getElementById('board');
            if (!board) { resolve(); return; }

            const duration = isFinalBoss ? 3200 : 2600;

            // Som
            if (typeof playSfx === 'function') {
                try { playSfx('purificacao'); } catch (e) {}
            }

            // Overlay
            const overlay = document.createElement('div');
            overlay.className = 'purificacao-overlay active';
            overlay.id = 'purificacaoOverlay';
            board.appendChild(overlay);

            // Darken
            const darken = document.createElement('div');
            darken.className = 'purificacao-darken';
            overlay.appendChild(darken);

            // Posição (do tile do boss)
            const s = (typeof getStep === 'function') ? getStep() : 59;
            const bossCenterX = tileX * s + s / 2 + 8;
            const feixeWidth = s * 2;

            // Feixe vertical
            const feixe = document.createElement('div');
            feixe.className = 'purificacao-feixe';
            feixe.style.left = bossCenterX + 'px';
            feixe.style.width = feixeWidth + 'px';
            feixe.style.height = '100%';
            overlay.appendChild(feixe);

            // Halo
            const halo = document.createElement('div');
            halo.className = 'purificacao-halo';
            halo.style.left = bossCenterX + 'px';
            halo.style.top = (tileY * s + s / 2 + 8) + 'px';
            halo.style.animationDuration = duration + 'ms';
            overlay.appendChild(halo);

            // Partículas
            const particleCount = isFinalBoss ? 26 : 18;
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'purificacao-particula';
                const offsetX = (Math.random() - 0.5) * s * 1.8;
                const offsetY = (Math.random() - 0.5) * s * 1.8;
                const driftX = (Math.random() - 0.5) * 60;
                const driftY = -150 - Math.random() * 150;
                particle.style.left = (bossCenterX + offsetX) + 'px';
                particle.style.top = (tileY * s + s / 2 + 8 + offsetY) + 'px';
                particle.style.setProperty('--dx', driftX + 'px');
                particle.style.setProperty('--dy', driftY + 'px');
                particle.style.animationDelay = (Math.random() * 0.5) + 's';
                particle.style.animationDuration = (1.8 + Math.random() * 0.6) + 's';
                overlay.appendChild(particle);
            }

            // Flash no sprite do boss
            const bossImg = document.getElementById('imgBoss');
            if (bossImg) bossImg.classList.add('purificacao-flash');

            setTimeout(() => {
                if (bossImg) bossImg.classList.remove('purificacao-flash');
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                resolve();
            }, duration);
        });
    }

    // =============================================================
    // SUBSTITUI TODA A CADEIA POR UMA FUNÇÃO ÚNICA
    // -------------------------------------------------------------
    // Isso garante que nenhum wrapper antigo (V16.x/V17.x) interfira.
    // =============================================================
    window.showPurificacao = async function(bossType, tileX, tileY, isFinalBoss) {
        // Guard: fora do modo história
        if (!window._storyMode) return;

        // Guard: já tem uma animação rodando? Evita duplicata
        if (document.getElementById('purificacaoOverlay')) {
            return;
        }

        // Toggle: pular animações
        if (typeof STORY_SETTINGS !== 'undefined' && STORY_SETTINGS.skipBravelyAnimations) {
            return purificacaoCurta();
        }

        return purificacaoCompleta(bossType, tileX, tileY, isFinalBoss);
    };

    // =============================================================
    // Debug — mostra estado da purificação
    // =============================================================
    window._debugPurificacaoV1067 = function() {
        console.log('═══ [V10.67] Purificação ═══');
        console.log('Função atual:', window.showPurificacao.toString().substring(0, 80), '...');
        console.log('skipBravelyAnimations:', STORY_SETTINGS?.skipBravelyAnimations);
        console.log('Overlay ativo agora?', !!document.getElementById('purificacaoOverlay'));
        console.log('typeof enfileirarCinema:', typeof window.enfileirarCinema);
        console.log('typeof enfileirarCinema (bare):', typeof enfileirarCinema);
        console.log('══════════════════════════════');
    };

    // Teste manual — só funciona se estiver no modo história
    window._testPurificacao = async function() {
        if (!window._storyMode) {
            console.warn('[V10.67] Só funciona no Modo História.');
            return;
        }
        console.log('[V10.67] Testando purificação manual...');
        const bx = boss?.x ?? 4;
        const by = boss?.y ?? 0;
        await window.showPurificacao(boss?.type || 'BOITATA', bx, by, false);
        console.log('[V10.67] Purificação de teste concluída.');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.67] Purificação REESCRITA');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Cadeia de wrappers removida (era a causa do bug)');
    console.log('• Sem dependência de enfileirarCinema');
    console.log('• Respeita STORY_SETTINGS.skipBravelyAnimations');
    console.log('• CSS de fallback se o index não carregar');
        console.log('');
    console.log('💡 Debug:');
    console.log('   window._debugPurificacaoV1067()');
    console.log('   window._testPurificacao()      ← força uma purificação');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V10.68 (Preview v4: formAtk + bonusElemento)
// -----------------------------------------------------------------
// Complementa V10.66. Não substitui — só adiciona os bônus que
// faltavam no cálculo do preview:
//
//   • bonus.formAtk    (nível 6) → soma quando forma válida
//   • bonus.bonusElemento (nível 11 reroll) → soma quando tile inicial
//     bate o elemento do herói
//
// Mantém V10.66 intocado (a barra storyPreviewBarV3 continua lá,
// apenas com o cálculo corrigido).
// =================================================================

(function previewV4_FixFormAtkV1068() {
    if (window._previewV4FixV1068) return;
    window._previewV4FixV1068 = true;

    // =============================================================
    // Substitui apenas a função de estimativa (o resto do V10.66
    // continua funcionando — CSS, render, hooks)
    // =============================================================
    function estimarPreviewV4() {
        if (window._pvpMode || window._coopMode) return null;
        if (typeof path === 'undefined' || !path || path.length === 0) return null;
        if (typeof players === 'undefined' || !Array.isArray(players)) return null;

        const active = players[currentPlayerIdx];
        if (!active || active.dead) return null;

        const info = (typeof CLASS_DB !== 'undefined' && CLASS_DB[active.class])
            ? CLASS_DB[active.class] : { atk: 2, min: 0 };
        const heroData = (typeof STORY_HERO_CLASSES !== 'undefined' && STORY_HERO_CLASSES[active.class])
            ? STORY_HERO_CLASSES[active.class] : { role: 'Guerreiro', paKey: 'base_coluna' };
        const isBaseHero = !heroData.paKey || heroData.paKey.startsWith('base_');

        const usedPath = [...path];
        const threshold = parseInt(document.getElementById('bravely_tiles')?.value) || 9;
        const isBravely = usedPath.length >= threshold;
        const shape = (typeof detectShape === 'function') ? detectShape(usedPath) : null;

        // Bônus de nível (todos de uma vez)
        let levelAtk = 0;
        let levelFormAtk = 0;
        let levelElemBonus = 0;
        if (typeof getHeroBonusFromLevel === 'function') {
            const b = getHeroBonusFromLevel(active.class) || {};
            levelAtk = b.atk || 0;
            levelFormAtk = b.formAtk || 0;
            levelElemBonus = b.bonusElemento || 0;
        }

        // Bônus de arma (elemento apenas — atk já está em bonusAtk)
        let weaponElem = 0;
        if (!isBaseHero && typeof getHeroEquipment === 'function' && typeof getWeaponById === 'function') {
            const eq = getHeroEquipment(active.class);
            if (eq?.arma && usedPath.length > 0) {
                const w = getWeaponById(eq.arma);
                if (w) {
                    const tileEl = grid[usedPath[0]];
                    if (w.elemento === 'ANY') {
                        if (tileEl === active.element) weaponElem = w.elementoBonus || 0;
                    } else if (tileEl === w.elemento) {
                        weaponElem = w.elementoBonus || 0;
                    }
                }
            }
        }

        const tileBonus = (usedPath.length > 0 && grid[usedPath[0]] === active.element) ? 1 : 0;

        let shapeAtk = 0, heal = 0, recarrega = false;
        if (shape === 'LINHA') { shapeAtk = 2; heal = 1; }
        else if (shape === 'L') { heal = 2; }
        else if (shape === 'ZIGZAG') { shapeAtk = 3; }
        else if (shape === 'QUADRADO') { recarrega = true; }

        // ⭐ formAtk: só quando forma válida (V36.0 aplica via bonusAtk)
        const formAtkBonus = shape ? levelFormAtk : 0;

        // ⭐ bonusElemento: só quando tile inicial bate elemento do herói
        // (V36.0 aplica via bonusAtk)
        const elemAtkBonus = tileBonus > 0 ? levelElemBonus : 0;

        const titleAtk = active.titleBonus?.ATK || 0;

        const totalAtk = info.atk + (active.bonusAtk || 0) + levelAtk
                       + tileBonus + shapeAtk + formAtkBonus + elemAtkBonus
                       + titleAtk + weaponElem;

        let dano = 0, nota = '', mata = false;

        if (heroData.role === 'Guerreiro') {
            const golpes = contarGolpesGuerreiroLocal(active, usedPath);
            const totalBruto = totalAtk * golpes;
            const bHp = (typeof boss !== 'undefined' && boss) ? boss.hp : Infinity;
            mata = golpes > 0 && totalBruto >= bHp;

            if (golpes === 0) {
                dano = 0;
                nota = 'não alcança o boss';
            } else {
                dano = mata ? bHp : totalBruto;
                if (golpes === 1) {
                    nota = mata ? 'mata' : '1 golpe';
                } else {
                    nota = `${golpes}×${totalAtk}`;
                    if (mata) nota += ' · mata';
                }
            }
        } else {
            if (usedPath.length >= (info.min || 0)) {
                const extra = usedPath.length - (info.min || 0);
                let extraDmg;
                if (isBaseHero) {
                    if (active.class === 'Sume') extraDmg = extra;
                    else if (active.class === 'Caipora') extraDmg = Math.floor(extra / 2);
                    else extraDmg = extra;
                } else {
                    extraDmg = extra;
                }
                dano = totalAtk + extraDmg;
            } else {
                const falta = (info.min || 0) - usedPath.length;
                nota = `precisa +${falta} tile${falta > 1 ? 's' : ''}`;
            }
        }

        return {
            tiles: usedPath.length, threshold, shape, isBravely,
            totalAtk, dano, nota, heal, recarrega, role: heroData.role, mata,
        };
    }

    function contarGolpesGuerreiroLocal(active, usedPath) {
        if (typeof boss === 'undefined' || !boss || boss.dead) return 0;
        if (!active) return 0;
        const bAdj = (px, py) =>
            Math.abs(px - boss.x) + Math.abs(py - boss.y) <= 1;
        let golpes = 0;
        if (bAdj(active.x, active.y)) golpes++;
        let px = active.x, py = active.y;
        for (const idx of usedPath) {
            px = idx % 8;
            py = Math.floor(idx / 8);
            if (typeof isOccupied === 'function' && isOccupied(px, py, active.id)) break;
            if (bAdj(px, py)) golpes++;
        }
        return golpes;
    }

    // =============================================================
    // Exporta a estimativa nova para o V10.66 usar
    // =============================================================
    window._estimarPreviewV1066 = estimarPreviewV4;

    // =============================================================
    // Re-renderiza a barra com a função nova
    // =============================================================
    function renderComFix() {
        const boardArea = document.querySelector('.board-area');
        if (!boardArea) return;

        let bar = document.getElementById('storyPreviewBarV3');
        if (!bar) return; // V10.66 ainda não montou

        if (window._pvpMode || window._coopMode) {
            bar.style.display = 'none';
            return;
        }

        let data;
        try { data = estimarPreviewV4(); } catch (e) {
            bar.style.display = 'none';
            return;
        }
        if (!data) { bar.style.display = 'none'; return; }

        bar.style.display = 'flex';

        const chips = [];
        chips.push(`<span class="preview-chip tiles">🎯 ${data.tiles} tile${data.tiles > 1 ? 's' : ''}</span>`);
        if (data.shape) {
            chips.push(`<span class="preview-chip shape">🟩 ${data.shape}</span>`);
        }
        if (data.isBravely) {
            chips.push(`<span class="preview-chip pa">⚡ PA ${data.tiles}/${data.threshold}</span>`);
        } else if (data.tiles >= Math.max(4, data.threshold - 3)) {
            chips.push(`<span class="preview-chip dim">⚡ ${data.tiles}/${data.threshold}</span>`);
        }
        if (data.dano > 0) {
            chips.push(`<span class="preview-chip dano">⚔️ ~${data.dano} dano</span>`);
        }
        if (data.nota) {
            const cls = data.mata ? 'kill' : 'dim';
            chips.push(`<span class="preview-chip ${cls}">${data.nota}</span>`);
        }
        if (data.heal > 0)  chips.push(`<span class="preview-chip heal">💚 +${data.heal} HP</span>`);
        if (data.recarrega) chips.push(`<span class="preview-chip recarrega">♻️ Recarrega</span>`);
        chips.push(`<span class="preview-chip help" title="ATK base ${data.totalAtk} · estimativa">?</span>`);

        bar.innerHTML = chips.join('');
    }

    // Roda a cada 400ms, junto com o V10.66 (sobrescreve a cada ciclo)
    setInterval(() => { try { renderComFix(); } catch (e) {} }, 400);

    // Diagnóstico
    window._debugPreviewV4 = function() {
        const active = players?.[currentPlayerIdx];
        const bonus = (typeof getHeroBonusFromLevel === 'function' && active)
            ? getHeroBonusFromLevel(active.class) : null;
        console.log('═══ [V10.68] Preview v4 ═══');
        console.log('Herói:', active?.class, '| Level:', (typeof getHeroLevel === 'function') ? getHeroLevel(active?.class) : '?');
        console.log('Bônus de nível:', bonus);
        console.log('Estimativa:', estimarPreviewV4());
        console.log('══════════════════════════');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.68] Preview v4 — formAtk + bonusElemento');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Soma bonus.formAtk (nível 6) quando forma válida');
    console.log('• Soma bonus.bonusElemento (nível 11 reroll) quando');
    console.log('  tile inicial bate elemento do herói');
    console.log('• V10.66 continua ativo (barra storyPreviewBarV3)');
    console.log('');
    console.log('💡 Debug: window._debugPreviewV4()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V10.69 (Anhanga-Mirim: fix bug + 150% + clear corrupção)
// -----------------------------------------------------------------
// Bug:
//   V9.4 execute() convertia cruz no PRIMEIRO tile AR do board
//   V23.2 triggerBravelyChain convertia cruz no ALVO
//   → 2 cruzes (30 tiles), 2 danos (1× + 1.5×)
//
// Fix:
//   • execute() vira no-op (V23.2 cuida de tudo)
//   • triggerBravelyChain boosta totalAtk para 1.5×
//   • Pós-processo limpa corrupção DENTRO da cruz
// =================================================================

(function fixAnhangaMirimV1069() {
    if (window._fixAnhangaMirimV1069) return;
    window._fixAnhangaMirimV1069 = true;

    // =============================================================
    // 1. Substituir execute por no-op
    // =============================================================
    const _aplicarExecuteNoOp = () => {
        if (typeof STORY_HERO_PA === 'undefined') return false;
        STORY_HERO_PA['anhanga_mirim_raio'] = {
            desc: 'Cruz completa (15 tiles) — 150% de dano. Purifica corrupção dentro da cruz.',
            execute: async () => { /* V23.2 cuida do dano e da conversão */ },
        };
        return true;
    };
    _aplicarExecuteNoOp();
    setTimeout(_aplicarExecuteNoOp, 800);
    setTimeout(_aplicarExecuteNoOp, 2000);

    // =============================================================
    // 2. Wrapper em triggerBravelyChain
    // =============================================================
    const _cur = window.triggerBravelyChain;
    if (typeof _cur !== 'function') {
        console.warn('[V10.69] triggerBravelyChain ausente.');
        return;
    }
    if (_cur._v1069) return;

    window.triggerBravelyChain = async function(active, target, totalAtk) {
        const heroData = (typeof STORY_HERO_CLASSES !== 'undefined' && active)
            ? STORY_HERO_CLASSES[active.class] : null;
        const isAnhanga = heroData && heroData.paKey === 'anhanga_mirim_raio';

        if (!isAnhanga) {
            return _cur.apply(this, arguments);
        }

        const boostedAtk = Math.floor((totalAtk || 0) * 1.5);
        console.log('[V10.69] Anhanga-Mirim: dano 150% =', boostedAtk);

        const result = await _cur.call(this, active, target, boostedAtk);

        // Pós-processo: limpar corrupção DENTRO da cruz
        if (target && typeof target.x === 'number') {
            const paTiles = [];
            for (let i = 0; i < 8; i++) {
                if (!paTiles.includes(i * 8 + target.x)) paTiles.push(i * 8 + target.x);
                if (!paTiles.includes(target.y * 8 + i)) paTiles.push(target.y * 8 + i);
            }

            if (Array.isArray(window._corruptedTiles) && window._corruptedTiles.length > 0) {
                const corruptedInCross = paTiles.filter(idx =>
                    window._corruptedTiles.includes(idx)
                );

                if (corruptedInCross.length > 0) {
                    // Remove do array (evita re-corromper via createTile hook)
                    window._corruptedTiles = window._corruptedTiles.filter(
                        idx => !corruptedInCross.includes(idx)
                    );

                    const board = document.getElementById('board');
                    const s = (typeof getStep === 'function') ? getStep() : 59;

                    corruptedInCross.forEach((idx, i) => {
                        setTimeout(() => {
                            if (board) {
                                const smoke = document.createElement('div');
                                smoke.className = 'corruption-smoke-fx';
                                smoke.style.left = ((idx % 8) * s + 8) + 'px';
                                smoke.style.top = (Math.floor(idx / 8) * s + 8) + 'px';
                                smoke.style.width = s + 'px';
                                smoke.style.height = s + 'px';
                                board.appendChild(smoke);
                                setTimeout(() => smoke.remove(), 1500);
                            }
                        }, i * 60);
                    });

                    if (typeof addLog === 'function') {
                        addLog(`⚡ Anhanga-Mirim purificou ${corruptedInCross.length} corrupç${corruptedInCross.length === 1 ? 'ão' : 'ões'}!`);
                    }
                    if (typeof playSfx === 'function') {
                        try { playSfx('purificacao'); } catch (e) {}
                    }
                    console.log('[V10.69] Corrupção limpa na cruz:', corruptedInCross);
                }
            }
        }

        return result;
    };
    window.triggerBravelyChain._v1069 = true;

    // =============================================================
    // Debug
    // =============================================================
    window._debugAnhanga = function() {
        console.log('═══ [V10.69] Anhanga-Mirim ═══');
        console.log('execute é no-op?', STORY_HERO_PA?.['anhanga_mirim_raio']?.execute?.toString().includes('V23.2'));
        console.log('triggerBravelyChain wrapped?', window.triggerBravelyChain?._v1069);
        console.log('Corrupção atual:', window._corruptedTiles?.length || 0);
        console.log('══════════════════════════');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.69] Anhanga-Mirim corrigido');
    console.log('═══════════════════════════════════════════════════');
    console.log('• execute() = no-op (V23.2 cuida de dano + conversão)');
    console.log('• Dano boostado para 150% no triggerBravelyChain');
    console.log('• Pós-processo limpa corrupção DENTRO da cruz');
    console.log('• Sem dupla conversão de tiles');
    console.log('');
    console.log('💡 Debug: window._debugAnhanga()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V10.70 (Mãe da Mata 3×3 + cura all + passiva +1)
// -----------------------------------------------------------------
// Mudanças:
//   1. Mãe da Mata: promoção 3⭐ → 4⭐
//   2. Mãe da Mata: passiva "+1 em toda cura"
//   3. Mãe da Mata: PA 5×5 → 3×3, cura em si + aliados
//   4. Regra global: Anduré e Negrinho curam em si + aliados
//   5. Helper aplicarCuraComPassiva (extensível)
//
// Nota PvP/Coop: execute() funciona nos três modos, mas
// tile-pattern de PvP/Coop continua 5×5 (não tocado).
// =================================================================

(function fixMaeDaMataV1070() {
    if (window._fixMaeDaMataV1070) return;
    window._fixMaeDaMataV1070 = true;

    // =============================================================
    // 1. HELPER: aplicar cura com passiva
    // =============================================================
    window.aplicarCuraComPassiva = function(player, amount) {
        if (!player || player.dead) return 0;

        let bonus = 0;
        const heroData = (typeof STORY_HERO_CLASSES !== 'undefined')
            ? STORY_HERO_CLASSES[player.class] : null;
        if (heroData?.passive === 'mae_da_mata_cura_plus') {
            bonus = 1;
        }

        const total = amount + bonus;
        const hpAntes = player.hp;
        player.hp = Math.min(player.maxHp, player.hp + total);
        const curado = player.hp - hpAntes;

        if (curado > 0) {
            if (typeof showHealEffect === 'function') {
                showHealEffect(player.x, player.y, curado);
            }
        }
        if (typeof updateHeroCard === 'function') updateHeroCard();
        return curado;
    };

    // =============================================================
    // 2. PROMOÇÃO + PASSIVA
    // =============================================================
    const _registrarPassiva = () => {
        if (typeof STORY_HERO_CLASSES === 'undefined') return false;
        const mae = STORY_HERO_CLASSES['Mãe da Mata'];
        if (!mae) return false;
        mae.rarity = 4;
        mae.passive = 'mae_da_mata_cura_plus';
        return true;
    };
    if (_registrarPassiva()) {
        console.log('[V10.70] Mãe da Mata promovida a 4⭐ com passiva +1 cura.');
    }
    setTimeout(_registrarPassiva, 500);
    setTimeout(_registrarPassiva, 1500);

    // =============================================================
    // 3. REESCREVER OS 3 PAs DE CURA (execute function)
    // =============================================================
    function aplicarCuraEmArea(active, tiles, valorCura, nome) {
        if (typeof players === 'undefined' || !Array.isArray(players)) return 0;
        let curasFeitas = 0;
        players.forEach(p => {
            if (p.dead) return;
            if (tiles.some(t => t.x === p.x && t.y === p.y)) {
                const curado = window.aplicarCuraComPassiva(p, valorCura);
                if (curado > 0) curasFeitas++;
            }
        });
        if (curasFeitas > 0 && typeof addLog === 'function') {
            addLog(`💚 ${nome}: curou ${curasFeitas} herói(s) em ${tiles.length} tiles.`);
        }
        return curasFeitas;
    }

    const _substituirPAs = () => {
        if (typeof STORY_HERO_PA === 'undefined') return false;

        // --- Mãe da Mata ---
        STORY_HERO_PA['maedamata_area3x3_cura'] = {
            desc: 'Área 3×3 ao redor. Cura 4 HP (+1 passivo) em si + aliados. Converte pra TERRA.',
            execute: async (active) => {
                if (!active) return;

                const tiles = [];
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const nx = active.x + dx, ny = active.y + dy;
                        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                            tiles.push({ x: nx, y: ny, idx: ny * 8 + nx });
                        }
                    }
                }

                // FX heal orbs em cada tile
                tiles.forEach((t, i) => {
                    setTimeout(() => {
                        if (typeof spawnHealOrb === 'function') {
                            spawnHealOrb(t.x, t.y);
                        }
                    }, i * 60);
                });

                await sleep(500);

                // Cura em si + aliados
                aplicarCuraEmArea(active, tiles, 4, 'Mãe da Mata');

                // Converte pra TERRA
                tiles.forEach(t => {
                    if (typeof grid !== 'undefined') grid[t.idx] = 'TERRA';
                    const el = document.querySelectorAll('#grid .tile')[t.idx];
                    if (el) el.className = 'tile bg-TERRA';
                });

                if (typeof addLog === 'function') {
                    addLog(`🌳 Mãe da Mata: Floração Ancestral!`);
                }
                if (typeof updateVisuals === 'function') updateVisuals();
            }
        };

        // --- Anduré (regra global: cura si + aliados) ---
        STORY_HERO_PA['andure_area2x2_cura'] = {
            desc: 'Área 3×3 ao redor. Cura 3 HP em si + aliados.',
            execute: async (active) => {
                if (!active) return;

                const tiles = [];
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const nx = active.x + dx, ny = active.y + dy;
                        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                            tiles.push({ x: nx, y: ny, idx: ny * 8 + nx });
                        }
                    }
                }

                tiles.forEach((t, i) => {
                    setTimeout(() => {
                        if (typeof spawnHealOrb === 'function') {
                            spawnHealOrb(t.x, t.y);
                        }
                    }, i * 60);
                });

                await sleep(400);

                aplicarCuraEmArea(active, tiles, 3, 'Anduré');
                if (typeof updateVisuals === 'function') updateVisuals();
            }
        };

        // --- Negrinho (regra global: self sempre + aliados no cross) ---
        STORY_HERO_PA['negrinho_cruz_cura'] = {
            desc: 'Cruz no boss + dano PA. Cura 5 HP em si + aliados na cruz.',
            execute: async (active, target, totalAtk) => {
                if (!target) return;

                const tiles = [];
                for (let i = 0; i < 8; i++) {
                    if (!tiles.includes(i * 8 + target.x)) tiles.push(i * 8 + target.x);
                    if (!tiles.includes(target.y * 8 + i)) tiles.push(target.y * 8 + i);
                }

                // FX
                tiles.forEach((idx, i) => {
                    setTimeout(() => {
                        if (typeof spawnFxAt === 'function') {
                            const tx = idx % 8, ty = Math.floor(idx / 8);
                            spawnFxAt('impact', 'fx-impact', tx, ty, { duration: 500, scale: 0.7 });
                        }
                    }, i * 30);
                });

                // Converte pra AGUA
                tiles.forEach(idx => {
                    if (typeof grid !== 'undefined') grid[idx] = 'AGUA';
                    const el = document.querySelectorAll('#grid .tile')[idx];
                    if (el) el.className = 'tile bg-AGUA';
                });
                await sleep(500);

                // Dano no boss (V23.2 vai dar dano de novo — bug conhecido)
                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);

                // Cura: self SEMPRE + aliados na cruz
                if (typeof players !== 'undefined' && Array.isArray(players)) {
                    players.forEach(p => {
                        if (p.dead) return;
                        const idx = p.y * 8 + p.x;
                        if (p.id === active.id || tiles.includes(idx)) {
                            window.aplicarCuraComPassiva(p, 5);
                        }
                    });
                }

                if (typeof addLog === 'function') {
                    addLog(`💧 Negrinho: cruz + cura 5 HP (si + aliados)!`);
                }
                if (typeof updateVisuals === 'function') updateVisuals();
            }
        };

        return true;
    };
    if (_substituirPAs()) {
        console.log('[V10.70] PAs de cura (Mãe da Mata, Anduré, Negrinho) reescritos.');
    }
    setTimeout(_substituirPAs, 500);
    setTimeout(_substituirPAs, 1500);

    // =============================================================
    // 4. WRAPPER EM triggerBravelyChain (só para Mãe da Mata)
    // -------------------------------------------------------------
    // Pula V23.2 inteiro (sem damage/convert 5×5). Chama execute
    // (que já faz heal + convert 3×3).
    // =============================================================
    const _cur = window.triggerBravelyChain;
    if (typeof _cur === 'function' && !_cur._v1070) {
        const _inner = _cur;

        window.triggerBravelyChain = async function(active, target, totalAtk) {
            // PvP/Coop: não mexe (usa fluxo próprio)
            if (window._pvpMode || window._coopMode) {
                return _inner.apply(this, arguments);
            }

            const heroData = (typeof STORY_HERO_CLASSES !== 'undefined' && active)
                ? STORY_HERO_CLASSES[active.class] : null;
            const isMaeDaMata = heroData && heroData.paKey === 'maedamata_area3x3_cura';

            if (!isMaeDaMata) {
                return _inner.apply(this, arguments);
            }

            // Fluxo customizado só pra Mãe da Mata
            if (typeof showPoderAncestralEffect === 'function') {
                try { showPoderAncestralEffect(); } catch (e) {}
            }
            await sleep(300);
            try { if (typeof playSfx === 'function') playSfx('skill1'); } catch (e) {}

            const paFn = STORY_HERO_PA['maedamata_area3x3_cura'];
            if (paFn && typeof paFn.execute === 'function') {
                try { await paFn.execute(active, target, totalAtk); }
                catch (e) { console.warn('[V10.70] Erro em execute:', e); }
            }

            if (typeof updateTitleStats === 'function') updateTitleStats('bravely_chain');
        };
        window.triggerBravelyChain._v1070 = true;
    }

    // =============================================================
    // Debug
    // =============================================================
    window._debugMaeDaMata = function() {
        const mae = (typeof STORY_HERO_CLASSES !== 'undefined')
            ? STORY_HERO_CLASSES['Mãe da Mata'] : null;
        console.log('═══ [V10.70] Mãe da Mata ═══');
        console.log('rarity:', mae?.rarity);
        console.log('passive:', mae?.passive);
        console.log('aplicarCuraComPassiva?', typeof window.aplicarCuraComPassiva);
        console.log('triggerBravelyChain wrapped?', window.triggerBravelyChain?._v1070);
        console.log('══════════════════════════');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.70] Mãe da Mata + regra global de cura');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Mãe da Mata: 4⭐ + passiva +1 cura + PA 3×3');
    console.log('• Anduré: cura self + aliados (era só self)');
    console.log('• Negrinho: cura self sempre + aliados na cruz');
    console.log('');
    console.log('⚠️ PvP/Coop: cura em 3×3, mas tile-pattern ainda 5×5');
    console.log('⚠️ Negrinho: dano 2× (bug conhecido, não corrigido)');
    console.log('');
    console.log('💡 Debug: window._debugMaeDaMata()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V10.72 (Sistema de passivas + Mãe-do-Ouro + Matinta)
// =================================================================

(function sistemaPassivasV1072() {
    if (window._sistemaPassivasV1072) return;
    window._sistemaPassivasV1072 = true;

    // =============================================================
    // 1. Tabela central de passivas (display + metadata)
    // =============================================================
    window.PASSIVE_DISPLAY = window.PASSIVE_DISPLAY || {};
    Object.assign(window.PASSIVE_DISPLAY, {
        'mae_da_mata_cura_plus':     { name: 'Cura Plus',         desc: 'Toda cura que ela aplica é aumentada em +1 HP.' },
        'mae_do_ouro_rota_explosiva':{ name: 'Rota Explosiva',    desc: 'Se o PA tiver menos de 4 tiles, vira área 3×3 no boss.' },
        'matinta_medo':              { name: 'Aura de Medo',      desc: 'Enquanto viva e adjacente ao boss, o boss causa -1 de dano.' },
        'tupinamba_resistencia':     { name: 'Resistência Tribal',desc: 'Reduz em 1 todo dano recebido.' },
        'negrinho_revive':           { name: 'Ressurreição',      desc: '50% de chance de reviver com 1 HP (1x por batalha).' },
        'curupira_adjacente':        { name: 'Instinto Selvagem', desc: '150% de dano em inimigos adjacentes.' },
        'kianumanka_fogo':           { name: 'Chama Ancestral',   desc: '150% de dano se o inimigo estiver em tile de FOGO.' },
        'ruda_ar_regen':             { name: 'Toque do Amor',     desc: 'Recupera 1 HP ao terminar turno em tile de AR.' },
    });

    // =============================================================
    // 2. Promoção + passiva de Mãe-do-Ouro e Matinta
    // =============================================================
    const _reg = () => {
        if (typeof STORY_HERO_CLASSES === 'undefined') return;
        if (STORY_HERO_CLASSES['Mãe-do-Ouro']) {
            STORY_HERO_CLASSES['Mãe-do-Ouro'].rarity = 4;
            STORY_HERO_CLASSES['Mãe-do-Ouro'].passive = 'mae_do_ouro_rota_explosiva';
        }
        if (STORY_HERO_CLASSES['Matinta Pereira']) {
            STORY_HERO_CLASSES['Matinta Pereira'].rarity = 4;
            STORY_HERO_CLASSES['Matinta Pereira'].passive = 'matinta_medo';
        }
    };
    _reg();
    setTimeout(_reg, 500);
    setTimeout(_reg, 1500);

    // =============================================================
    // 3. Matinta — damage reduction hook
    // =============================================================
    const _applyDmg = window.applyDmg;
    if (typeof _applyDmg === 'function' && !_applyDmg._v1072Matinta) {
        const _inner = _applyDmg;
        window.applyDmg = function(target, amount) {
            if (!window._storyMode && !window._eventoAtivo) return _inner.apply(this, arguments);
            if (window._pvpMode || window._coopMode) return _inner.apply(this, arguments);

            // Matinta aura: boss -1 ATK enquanto adjacente a ela
            if (target && players && players.includes(target) && !target.dead) {
                const matinta = players.find(p => p && !p.dead && p.class === 'Matinta Pereira');
                if (matinta && boss && !boss.dead) {
                    const dist = Math.abs(matinta.x - boss.x) + Math.abs(matinta.y - boss.y);
                    if (dist <= 1) {
                        amount = Math.max(1, amount - 1);
                    }
                }
            }

            return _inner.call(this, target, amount);
        };
        window.applyDmg._v1072Matinta = true;
    }

    // =============================================================
    // 4. Mãe-do-Ouro — Rota Explosiva
    // =============================================================
    const _brav = window.triggerBravelyChain;
    if (typeof _brav === 'function' && !_brav._v1072MaeOuro) {
        const _innerBrav = _brav;
        window.triggerBravelyChain = async function(active, target, totalAtk) {
            if (window._pvpMode || window._coopMode) return _innerBrav.apply(this, arguments);

            const heroData = STORY_HERO_CLASSES[active?.class];
            if (!heroData || heroData.paKey !== 'maedouro_caminho') {
                return _innerBrav.apply(this, arguments);
            }

            // Path >= 4: fluxo normal
            const pathLen = (typeof path !== 'undefined' && path) ? path.length : 0;
            if (pathLen >= 4) return _innerBrav.apply(this, arguments);

            // Rota Explosiva: 3×3 ao redor do boss
            if (typeof showPoderAncestralEffect === 'function') {
                try { showPoderAncestralEffect(); } catch(e) {}
            }
            await sleep(300);
            try { playSfx('skill1'); } catch(e) {}

            if (!target || target.dead) return;

            const tiles = [];
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = target.x + dx, ny = target.y + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                }
            }

            tiles.forEach((idx, i) => {
                setTimeout(() => {
                    if (typeof spawnFxAt === 'function') {
                        spawnFxAt('rock', 'rock-projectile',
                            idx % 8, Math.floor(idx / 8),
                            { duration: 500, scale: 0.6 });
                    }
                }, i * 40);
            });

            await sleep(500);

            tiles.forEach(idx => {
                grid[idx] = 'TERRA';
                const el = document.querySelectorAll('#grid .tile')[idx];
                if (el) el.className = 'tile bg-TERRA';
            });

            if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            if (typeof addLog === 'function') addLog(`🌍 Mãe-do-Ouro: ROTA EXPLOSIVA (3×3)!`);
            if (typeof updateVisuals === 'function') updateVisuals();
            if (typeof updateTitleStats === 'function') updateTitleStats('bravely_chain');
        };
        window.triggerBravelyChain._v1072MaeOuro = true;
    }

    window._debugPassivasV1072 = function() {
        console.log('═══ [V10.72] Passivas ═══');
        console.log('Mãe-do-Ouro:', STORY_HERO_CLASSES?.['Mãe-do-Ouro']?.passive);
        console.log('Matinta:', STORY_HERO_CLASSES?.['Matinta Pereira']?.passive);
        console.log('PASSIVE_DISPLAY total:', Object.keys(window.PASSIVE_DISPLAY || {}).length);
    };

    console.log('✅ [V10.72] Sistema base + Mãe-do-Ouro + Matinta.');
})();
// =================================================================
// historia.js — V10.73 (Tupinambá + Negrinho + Kianumanka + Rudá)
// =================================================================

(function pacoteV1073() {
    if (window._pacoteV1073) return;
    window._pacoteV1073 = true;

    // =============================================================
    // 1. Promoções + passivas
    // =============================================================
    const _reg = () => {
        if (typeof STORY_HERO_CLASSES === 'undefined') return;
        if (STORY_HERO_CLASSES['Tupinambá']) {
            STORY_HERO_CLASSES['Tupinambá'].rarity = 4;
            STORY_HERO_CLASSES['Tupinambá'].passive = 'tupinamba_resistencia';
        }
        if (STORY_HERO_CLASSES['Negrinho do Pastoreio']) {
            STORY_HERO_CLASSES['Negrinho do Pastoreio'].rarity = 4;
            STORY_HERO_CLASSES['Negrinho do Pastoreio'].passive = 'negrinho_revive';
        }
        if (STORY_HERO_CLASSES['Kianumanka-Manã']) {
            STORY_HERO_CLASSES['Kianumanka-Manã'].passive = 'kianumanka_fogo';
        }
        if (STORY_HERO_CLASSES['Rudá']) {
            STORY_HERO_CLASSES['Rudá'].passive = 'ruda_ar_regen';
        }
    };
    _reg();
    setTimeout(_reg, 500);
    setTimeout(_reg, 1500);

    // =============================================================
    // 2. Tupinambá — damage reduction
    // =============================================================
    const _applyDmg = window.applyDmg;
    if (typeof _applyDmg === 'function' && !_applyDmg._v1073Tup) {
        const _inner = _applyDmg;
        window.applyDmg = function(target, amount) {
            if (!window._storyMode && !window._eventoAtivo) return _inner.apply(this, arguments);
            if (window._pvpMode || window._coopMode) return _inner.apply(this, arguments);

            if (target && target.class === 'Tupinambá' && !target.dead) {
                amount = Math.max(1, amount - 1);
            }

            return _inner.call(this, target, amount);
        };
        window.applyDmg._v1073Tup = true;
    }

    // =============================================================
    // 3. Negrinho — revive 50% (solo-only)
    // =============================================================
    const _defeat = window.handleStoryDefeat;
    if (typeof _defeat === 'function' && !_defeat._v1073Negrinho) {
        const _innerDefeat = _defeat;
        window.handleStoryDefeat = function() {
            if (window._pvpMode || window._coopMode) {
                return _innerDefeat.apply(this, arguments);
            }

            if (players && Array.isArray(players)) {
                const negrinho = players.find(p =>
                    p && p.class === 'Negrinho do Pastoreio' &&
                    p.dead && !p._negrinhoReviveUsed
                );
                if (negrinho && Math.random() < 0.5) {
                    negrinho.dead = false;
                    negrinho.hp = 1;
                    negrinho._negrinhoReviveUsed = true;

                    if (typeof showHealEffect === 'function')
                        showHealEffect(negrinho.x, negrinho.y, 1);
                    if (typeof updateVisuals === 'function') updateVisuals();
                    if (typeof updateHeroCard === 'function') updateHeroCard();
                    if (typeof addLog === 'function')
                        addLog(`💚 Negrinho do Pastoreio reviveu com 1 HP!`);
                    if (typeof playSfx === 'function') {
                        try { playSfx('purificacao'); } catch(e) {}
                    }
                    if (typeof spawnFxAt === 'function') {
                        spawnFxAt('impact', 'fx-impact', negrinho.x, negrinho.y,
                            { duration: 800, scale: 1.5 });
                    }
                    return;
                }
            }

            return _innerDefeat.apply(this, arguments);
        };
        window.handleStoryDefeat._v1073Negrinho = true;
    }

    // Reset do flag de revive quando nova batalha começa
    const _init = window.initStoryBattle;
    if (typeof _init === 'function' && !_init._v1073Reset) {
        const _innerInit = _init;
        window.initStoryBattle = async function() {
            if (players && Array.isArray(players)) {
                players.forEach(p => { if (p) p._negrinhoReviveUsed = false; });
            }
            return _innerInit.apply(this, arguments);
        };
        window.initStoryBattle._v1073Reset = true;
    }

    // =============================================================
    // 4. Curupira + Kianumanka — damage multiplier (via executeAction)
    // =============================================================
    const _exec = window.executeAction;
    if (typeof _exec === 'function' && !_exec._v1073Mult) {
        const _innerExec = _exec;
        window.executeAction = async function() {
            if (!window._storyMode && !window._eventoAtivo) {
                return _innerExec.apply(this, arguments);
            }

            const active = players?.[currentPlayerIdx];
            let mult = 1;
            let reason = '';

            if (active && boss && !boss.dead) {
                // Curupira: 1.5x se adjacente ao boss
                if (active.class === 'Curupira') {
                    const dist = Math.abs(active.x - boss.x) + Math.abs(active.y - boss.y);
                    if (dist <= 1) { mult = 1.5; reason = 'Instinto Selvagem'; }
                }
                // Kianumanka: 1.5x se boss em FOGO
                if (active.class === 'Kianumanka-Manã') {
                    const bossIdx = boss.y * 8 + boss.x;
                    if (grid[bossIdx] === 'FOGO') { mult = 1.5; reason = 'Chama Ancestral'; }
                }
            }

            if (mult > 1) {
                window._passiveAtkMultiplier = mult;
                if (reason && typeof addLog === 'function') addLog(`⭐ ${reason}!`);
            }

            try {
                return await _innerExec.apply(this, arguments);
            } finally {
                window._passiveAtkMultiplier = 1;
            }
        };
        window.executeAction._v1073Mult = true;
    }

    // Aplicar multiplicador no applyDmg (boss only)
    if (typeof window.applyDmg === 'function' && !window.applyDmg._v1073Mult) {
        const _innerApply = window.applyDmg;
        window.applyDmg = function(target, amount) {
            if (target === boss && window._passiveAtkMultiplier > 1) {
                amount = Math.floor(amount * window._passiveAtkMultiplier);
            }
            return _innerApply.call(this, target, amount);
        };
        window.applyDmg._v1073Mult = true;
    }

    // =============================================================
    // 5. Rudá — nova PA (cross escolhida) + passiva AR
    // =============================================================
    const _subPA = () => {
        if (typeof STORY_HERO_PA === 'undefined') return;
        STORY_HERO_PA['ruda_flecha_amor'] = {
            desc: 'Cruz 15 tiles em tile escolhido. Dano PA. Passiva: +1 HP ao terminar turno em AR.',
            execute: async () => { /* V10.73 wrapper cuida */ }
        };
    };
    _subPA();
    setTimeout(_subPA, 800);
    setTimeout(_subPA, 2000);

    // Selection UI
    let _rudaResolve = null;
    window._rudaSelecting = false;

    function abrirSelecaoRuda() {
        return new Promise((resolve) => {
            _rudaResolve = resolve;
            window._rudaSelecting = true;

            for (let i = 0; i < 64; i++) {
                const el = document.querySelectorAll('#grid .tile')[i];
                if (el) el.classList.add('ruda-eligible');
            }

            let bar = document.getElementById('rudaBar');
            if (bar) bar.remove();
            bar = document.createElement('div');
            bar.id = 'rudaBar';
            bar.className = 'curupira-bar';
            bar.innerHTML = `
                <span class="curupira-bar-icon">🏹</span>
                <span class="curupira-bar-text">FLECHA DO AMOR: escolha um tile para a cruz</span>
                <button class="curupira-bar-btn cancel" id="rudaCancelBtn">CANCELAR</button>
            `;
            const main = document.querySelector('.game-main');
            if (main) main.parentNode.insertBefore(bar, main);
            document.getElementById('rudaCancelBtn').onclick = () => finalizarRuda(true);
        });
    }

    function finalizarRuda(cancelado) {
        document.querySelectorAll('.ruda-eligible, .ruda-selected')
            .forEach(el => el.classList.remove('ruda-eligible', 'ruda-selected'));
        const bar = document.getElementById('rudaBar');
        if (bar) bar.remove();
        window._rudaSelecting = false;

        if (_rudaResolve) {
            const r = _rudaResolve;
            _rudaResolve = null;
            if (cancelado) r({ cancelado: true });
            // Else it's handled by handleSelect
        }
    }

    const _hs = window.handleSelect;
    if (typeof _hs === 'function' && !_hs._v1073Ruda) {
        const _innerHs = _hs;
        window.handleSelect = function(idx) {
            if (!window._rudaSelecting) return _innerHs.apply(this, arguments);

            const el = document.querySelectorAll('#grid .tile')[idx];
            if (!el || !el.classList.contains('ruda-eligible')) {
                return _innerHs.apply(this, arguments);
            }

            document.querySelectorAll('.ruda-eligible').forEach(e => e.classList.remove('ruda-eligible'));
            const bar = document.getElementById('rudaBar');
            if (bar) bar.remove();
            window._rudaSelecting = false;

            if (_rudaResolve) {
                const r = _rudaResolve;
                _rudaResolve = null;
                r({ cancelado: false, tile: { x: idx % 8, y: Math.floor(idx / 8) } });
            }
        };
        window.handleSelect._v1073Ruda = true;
    }

    // Wrapper triggerBravelyChain para Rudá
    const _brav = window.triggerBravelyChain;
    if (typeof _brav === 'function' && !_brav._v1073Ruda) {
        const _innerBrav = _brav;
        window.triggerBravelyChain = async function(active, target, totalAtk) {
            if (window._pvpMode || window._coopMode) return _innerBrav.apply(this, arguments);

            const heroData = STORY_HERO_CLASSES[active?.class];
            if (!heroData || heroData.paKey !== 'ruda_flecha_amor') {
                return _innerBrav.apply(this, arguments);
            }

            if (typeof showPoderAncestralEffect === 'function') {
                try { showPoderAncestralEffect(); } catch(e) {}
            }
            await sleep(300);
            try { playSfx('skill1'); } catch(e) {}

            const chosen = await abrirSelecaoRuda();
            if (chosen.cancelado) {
                if (typeof addLog === 'function') addLog('🏹 Rudá: PA cancelado.');
                return;
            }

            const tiles = [];
            for (let i = 0; i < 8; i++) {
                if (!tiles.includes(i * 8 + chosen.tile.x)) tiles.push(i * 8 + chosen.tile.x);
                if (!tiles.includes(chosen.tile.y * 8 + i)) tiles.push(chosen.tile.y * 8 + i);
            }

            tiles.forEach((idx, i) => {
                setTimeout(() => {
                    if (typeof spawnFxAt === 'function') {
                        spawnFxAt('impact', 'fx-impact',
                            idx % 8, Math.floor(idx / 8),
                            { duration: 500, scale: 0.7 });
                    }
                }, i * 30);
            });

            await sleep(500);

            if (target && !target.dead) {
                const bossIdx = target.y * 8 + target.x;
                if (tiles.includes(bossIdx)) {
                    if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
                }
            }

            tiles.forEach(idx => {
                grid[idx] = 'AR';
                const el = document.querySelectorAll('#grid .tile')[idx];
                if (el) el.className = 'tile bg-AR';
            });

            if (typeof addLog === 'function')
                addLog(`🏹 Rudá: Cruz de Ar em (${chosen.tile.x},${chosen.tile.y})!`);
            if (typeof updateVisuals === 'function') updateVisuals();
            if (typeof updateTitleStats === 'function') updateTitleStats('bravely_chain');
        };
        window.triggerBravelyChain._v1073Ruda = true;
    }

    // Rudá passiva: +1 HP ao terminar turno em AR
    const _execPassiva = window.executeAction;
    if (typeof _execPassiva === 'function' && !_execPassiva._v1073RudaPass) {
        const _innerExec = _execPassiva;
        window.executeAction = async function() {
            const r = await _innerExec.apply(this, arguments);

            if (!window._pvpMode && !window._coopMode) {
                const active = players?.[currentPlayerIdx];
                if (active?.class === 'Rudá' && !active.dead) {
                    const idx = active.y * 8 + active.x;
                    if (grid[idx] === 'AR') {
                        active.hp = Math.min(active.maxHp, active.hp + 1);
                        if (typeof showHealEffect === 'function')
                            showHealEffect(active.x, active.y, 1);
                        if (typeof updateHeroCard === 'function') updateHeroCard();
                    }
                }
            }

            return r;
        };
        window.executeAction._v1073RudaPass = true;
    }

    window._debugV1073 = function() {
        console.log('═══ [V10.73] Passivas ═══');
        ['Tupinambá', 'Negrinho do Pastoreio', 'Kianumanka-Manã', 'Rudá'].forEach(n => {
            console.log(`${n}:`, STORY_HERO_CLASSES?.[n]?.passive || '(sem)');
        });
    };

    console.log('✅ [V10.73] Tupinambá + Negrinho + Kianumanka + Rudá.');
})();
// =================================================================
// historia.js — V10.74 (UI: passiva no "?" + botão na batalha)
// =================================================================

(function uiPassivasV1074() {
    if (window._uiPassivasV1074) return;
    window._uiPassivasV1074 = true;

    // =============================================================
    // 1. CSS
    // =============================================================
    if (!document.getElementById('uiPassivasV1074CSS')) {
        const style = document.createElement('style');
        style.id = 'uiPassivasV1074CSS';
        style.textContent = `
            .hero-details-section.hero-details-passive {
                background: rgba(142, 68, 173, 0.08);
                border-left: 3px solid #8e44ad;
            }
            .hero-details-passive .hero-details-pa-name {
                color: #c39bd3;
                font-size: 1rem;
            }
            .hero-battle-details-btn {
                width: 22px; height: 22px;
                padding: 0;
                margin-left: auto;
                border-radius: 50%;
                background: linear-gradient(135deg, #3a7ca5, #1e4a70);
                color: #d0e8f5;
                border: 1px solid #4a8cb5;
                font-family: 'Cinzel', serif;
                font-weight: 900;
                font-size: 0.7rem;
                cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                flex-shrink: 0;
                transition: all 0.15s;
            }
            .hero-battle-details-btn:hover {
                transform: scale(1.15);
                background: linear-gradient(135deg, #4a8cb5, #2a5570);
                box-shadow: 0 0 10px rgba(74, 140, 181, 0.6);
            }
            .battle-hero-modal-overlay {
                position: fixed; inset: 0;
                background: rgba(10, 6, 2, 0.92);
                z-index: 21000;
                display: flex; align-items: center; justify-content: center;
                padding: 20px;
                animation: fadeInBH 0.2s;
            }
            @keyframes fadeInBH { from { opacity: 0; } to { opacity: 1; } }
            .battle-hero-modal-panel {
                background: linear-gradient(180deg, #2a1f10, #1a1208);
                border: 2px solid #c9a227;
                border-radius: 8px;
                max-width: 460px; width: 100%;
                max-height: 85vh; overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,0.9);
            }
            .battle-hero-modal-header {
                display: flex; align-items: center; gap: 12px;
                padding: 16px 20px;
                border-bottom: 2px solid rgba(201, 162, 39, 0.3);
                background: rgba(10, 6, 2, 0.5);
            }
            .battle-hero-modal-sprite { width: 48px; height: 48px; object-fit: contain; }
            .battle-hero-modal-name {
                font-family: 'Cinzel', serif;
                color: #e8b923; font-size: 1.1rem;
                letter-spacing: 1px; flex: 1;
            }
            .battle-hero-modal-close {
                width: 28px; height: 28px;
                background: #6a2020; color: #f5c8c8;
                border: 1px solid #a83232; border-radius: 50%;
                cursor: pointer; font-weight: 700;
            }
            .battle-hero-modal-body { padding: 16px 20px; }
            .battle-hero-modal-section {
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid rgba(201, 162, 39, 0.15);
            }
            .battle-hero-modal-section:last-child { border-bottom: none; }
            .battle-hero-modal-section-title {
                font-family: 'Cinzel', serif;
                color: #8a7a52; font-size: 0.75rem;
                letter-spacing: 2px; text-transform: uppercase;
                margin-bottom: 8px;
            }
            .battle-hero-modal-line {
                font-family: 'EB Garamond', serif;
                color: #d9c89a; font-size: 0.95rem;
                margin-bottom: 6px; line-height: 1.4;
            }
            .battle-hero-modal-line b { color: #e8b923; }
        `;
        document.head.appendChild(style);
    }

    // =============================================================
    // 2. Injeta passiva no painel "?" do herói
    // =============================================================
    const _openDetails = window.openHeroDetails;
    if (typeof _openDetails === 'function' && !_openDetails._v1074) {
        const _inner = _openDetails;
        window.openHeroDetails = function(heroClass) {
            _inner.apply(this, arguments);

            setTimeout(() => {
                const panel = document.querySelector('.hero-details-panel');
                if (!panel || panel.querySelector('.hero-details-passive')) return;

                const heroData = STORY_HERO_CLASSES[heroClass];
                if (!heroData?.passive) return;

                const meta = window.PASSIVE_DISPLAY?.[heroData.passive];
                if (!meta) return;

                const section = document.createElement('div');
                section.className = 'hero-details-section hero-details-passive';
                section.innerHTML = `
                    <div class="hero-details-section-title">⭐ PASSIVA</div>
                    <div class="hero-details-pa-name">${meta.name}</div>
                    <div class="hero-details-pa-desc">${meta.desc}</div>
                `;

                const notas = panel.querySelector('.hero-details-notes');
                if (notas) notas.parentNode.insertBefore(section, notas);
                else panel.appendChild(section);
            }, 150);
        };
        window.openHeroDetails._v1074 = true;
    }

    // =============================================================
    // 3. Botão "?" nos heróis durante a batalha
    // =============================================================
    function injetarBotoesBatalha() {
        const rows = document.querySelectorAll('.hero-status-row');
        rows.forEach((row, idx) => {
            if (row.querySelector('.hero-battle-details-btn')) return;
            const p = players?.[idx];
            if (!p) return;

            const btn = document.createElement('button');
            btn.className = 'hero-battle-details-btn';
            btn.textContent = '?';
            btn.title = 'Ver detalhes do herói';
            btn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                window.openBattleHeroDetails(idx);
            };
            row.appendChild(btn);
        });
    }

    window.openBattleHeroDetails = function(idx) {
        const p = players?.[idx];
        if (!p) return;

        const heroData = STORY_HERO_CLASSES[p.class];
        if (!heroData) return;

        const meta = window.PASSIVE_DISPLAY?.[heroData.passive];
        const equip = (typeof getHeroEquipment === 'function') ? getHeroEquipment(p.class) : null;
        const weapon = (equip?.arma && typeof getWeaponById === 'function') ? getWeaponById(equip.arma) : null;
        const amulet = (equip?.amuleto && typeof getAmuletById === 'function') ? getAmuletById(equip.amuleto) : null;

        const old = document.getElementById('battleHeroModal');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'battleHeroModal';
        overlay.className = 'battle-hero-modal-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const paDesc = (typeof STORY_HERO_PA !== 'undefined' && heroData.paKey)
            ? (STORY_HERO_PA[heroData.paKey]?.desc || '')
            : '';

        overlay.innerHTML = `
            <div class="battle-hero-modal-panel">
                <div class="battle-hero-modal-header">
                    <img src="${SPRITES[p.class] || ''}" class="battle-hero-modal-sprite">
                    <div class="battle-hero-modal-name">${heroData.displayName || p.class}</div>
                    <button class="battle-hero-modal-close" onclick="document.getElementById('battleHeroModal').remove()">✕</button>
                </div>
                <div class="battle-hero-modal-body">
                    <div class="battle-hero-modal-section">
                        <div class="battle-hero-modal-section-title">📊 Atributos</div>
                        <div class="battle-hero-modal-line">
                            HP: <b>${p.hp}</b> / ${p.maxHp}
                        </div>
                        <div class="battle-hero-modal-line">
                            Papel: <b>${heroData.role}</b>
                        </div>
                        <div class="battle-hero-modal-line">
                            Elemento: <b>${p.element || '—'}</b>
                        </div>
                    </div>

                    ${weapon ? `
                    <div class="battle-hero-modal-section">
                        <div class="battle-hero-modal-section-title">⚔️ Arma</div>
                        <div class="battle-hero-modal-line">${weapon.nome}</div>
                        <div class="battle-hero-modal-line">
                            +${weapon.atkBonus} ATK · ${weapon.elemento === 'ANY' ? '✨ Abissal' : weapon.elemento}
                        </div>
                    </div>` : ''}

                    ${amulet ? `
                    <div class="battle-hero-modal-section">
                        <div class="battle-hero-modal-section-title">🧿 Amuleto</div>
                        <div class="battle-hero-modal-line">${amulet.nome}</div>
                    </div>` : ''}

                    ${paDesc ? `
                    <div class="battle-hero-modal-section">
                        <div class="battle-hero-modal-section-title">⚡ Poder Ancestral</div>
                        <div class="battle-hero-modal-line">${paDesc}</div>
                    </div>` : ''}

                    ${meta ? `
                    <div class="battle-hero-modal-section">
                        <div class="battle-hero-modal-section-title">⭐ Passiva — ${meta.name}</div>
                        <div class="battle-hero-modal-line">${meta.desc}</div>
                    </div>` : ''}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    };

    // Observer para injetar botões quando a lista de heróis re-renderizar
    try {
        const obs = new MutationObserver(() => {
            if (window._pvpMode || window._coopMode) return;
            const list = document.getElementById('heroesStatusList');
            if (list && list.children.length > 0) {
                injetarBotoesBatalha();
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}

    // Rodadas iniciais
    setTimeout(injetarBotoesBatalha, 800);
    setTimeout(injetarBotoesBatalha, 2000);
    setTimeout(injetarBotoesBatalha, 4000);

    window._debugUIV1074 = function() {
        console.log('═══ [V10.74] UI ═══');
        console.log('Botões na batalha:', document.querySelectorAll('.hero-battle-details-btn').length);
        console.log('openBattleHeroDetails?', typeof window.openBattleHeroDetails);
        console.log('PASSIVE_DISPLAY total:', Object.keys(window.PASSIVE_DISPLAY || {}).length);
    };

    console.log('✅ [V10.74] UI: passiva no "?" + botão na batalha.');
})();
// =================================================================
// historia.js — V10.75 (Cards OCA + Batalha unificados)
// -----------------------------------------------------------------
// Problema:
//   • STORY_HERO_DETAILS ainda tem descrições antigas (5×5, só self)
//   • renderPAMiniGrid mostra tiles antigos
//   • Battle modal tinha conteúdo próprio (parcialmente atualizado)
//
// Fix:
//   1. Atualiza STORY_HERO_DETAILS para os 10 heróis alterados
//   2. Corrige renderPAMiniGrid para as PAs novas
//   3. Battle modal REUSA o mesmo conteúdo da OCA (fonte única)
// =================================================================

(function fixOCACardsV1075() {
    if (window._fixOCACardsV1075) return;
    window._fixOCACardsV1075 = true;

    // =============================================================
    // 1. STORY_HERO_DETAILS — mutação (Object.assign)
    // =============================================================
    if (typeof STORY_HERO_DETAILS !== 'undefined') {
        Object.assign(STORY_HERO_DETAILS, {
            'Mãe da Mata': {
                paName: 'Floração Ancestral',
                paDesc: 'Mãe da Mata abre os braços e o chão floresce em uma área 3×3 ao seu redor. Flores, trepadeiras e cogumelos luminosos brotam do solo enquanto ela cura as feridas de si mesma e de todos os aliados na área.',
                paExtra: 'Área 3×3 (9 tiles). Cura 4 HP em si + aliados.',
                tactical: 'Alcance: 4 (ataca à distância).',
                notes: 'Passiva: +1 em toda cura. Todos os PAs de cura afetam ela e aliados.'
            },
            'Anduré': {
                paName: 'Esfera Curativa',
                paDesc: 'Anduré levita e uma esfera de água pura se forma ao seu redor. A energia sagrada cura suas feridas e as de todos os aliados próximos.',
                paExtra: 'Área 3×3 (9 tiles). Cura 3 HP em si + aliados.',
                tactical: 'Alcance: 4 (ataca à distância).',
                notes: 'Todos os PAs de cura afetam ela e aliados.'
            },
            'Negrinho do Pastoreio': {
                paName: 'Cruz Curativa',
                paDesc: 'Negrinho invoca uma cruz de água pura a partir do alvo. O dano PA atinge o boss, e uma luz sagrada cura ele e todos os aliados na cruz.',
                paExtra: 'Cruz inteira (15 tiles). Cura 5 HP em si + aliados na cruz.',
                tactical: 'Alcance: 4 (ataca à distância).',
                notes: 'Passiva: 50% de chance de reviver com 1 HP (só solo/história).'
            },
            'Curupira': {
                paName: 'Chuva de Flechas',
                paDesc: 'Curupira escolhe até 10 tiles AR/AGUA/TERRA no tabuleiro. Cada um se transforma em TERRA, e flechas caem sobre eles. Se o boss estiver em um deles, o dano é dobrado.',
                paExtra: 'Até 10 tiles AR/AGUA/TERRA à sua escolha. Convertem pra TERRA. Dano ×2 se boss neles.',
                tactical: 'Alcance: 3 (ataca à distância).',
                notes: 'Passiva: 150% de dano contra inimigos adjacentes.'
            },
            'Anhanga-Mirim': {
                paName: 'Raio na Cruz',
                paDesc: 'Anhanga-Mirim concentra o poder das trevas e invoca uma cruz completa de raios a partir do alvo. O dano é devastador (150%) e a energia purifica qualquer corrupção dentro da cruz.',
                paExtra: 'Cruz completa (15 tiles) no alvo. Dano 150% PA. Purifica corrupção na cruz.',
                tactical: 'Alcance: 4 (ataca à distância). Herói de 5⭐.',
                notes: 'Difícil de conseguir (zerar Pesadelo). PA com utilidade única.'
            },
            'Rudá': {
                paName: 'Flecha do Amor',
                paDesc: 'Rudá dispara uma flecha de luz pura que escolhe qualquer tile do tabuleiro. Uma cruz completa de raios atinge tudo. Se o boss estiver nela, sofre dano PA.',
                paExtra: 'Cruz completa (15 tiles) em qualquer tile escolhido. Dano PA no boss se atingido.',
                tactical: 'Alcance: 3 (ataca à distância).',
                notes: 'Passiva: recupera 1 HP ao terminar turno em tile de AR.'
            },
            'Mãe-do-Ouro': {
                paName: 'Caminho Explosivo',
                paDesc: 'Mãe-do-Ouro traça um caminho de terra até o boss, explodindo tudo no percurso. Se o caminho for curto (< 4 tiles), o poder se concentra em uma explosão 3×3 ao redor do boss.',
                paExtra: 'Caminho herói→boss. Se path < 4: 3×3 no boss (passiva Rota Explosiva).',
                tactical: 'Alcance: 4 (ataca à distância).',
                notes: 'Passiva: Rota Explosiva ativa quando path é curto.'
            },
            'Kianumanka-Manã': {
                paName: 'Meteoro',
                paDesc: 'Kianumanka invoca um meteoro que cai sobre o boss. A área 3×3 ao redor dele é consumida por chamas, convertendo os tiles pra FOGO.',
                paExtra: 'Área 3×3 no boss. Converte pra FOGO. Dano PA.',
                tactical: 'Alcance: 1 (corpo a corpo). 16 HP.',
                notes: 'Passiva: 150% de dano se o boss estiver em tile de FOGO.'
            },
            'Tupinambá': {
                paName: 'Avalanche Tribal',
                paDesc: 'Tupinambá bate no chão e uma avalanche de pedras e terra desce sobre o boss em forma de cruz. O impacto empurra o inimigo pra longe.',
                paExtra: 'Cruz (linha + coluna do boss). Empurra 2 tiles. Dano PA.',
                tactical: 'Alcance: 1 (corpo a corpo). 20 HP.',
                notes: 'Passiva: reduz 1 de todo dano recebido.'
            },
            'Matinta Pereira': {
                paName: 'Rajada Fantasma',
                paDesc: 'Matinta Pereira usa sua natureza assombrada pra empurrar o inimigo de uma borda a outra do tabuleiro, causando dano PA em cada colisão.',
                paExtra: 'Empurra boss 2× (bordas opostas). Dano PA em cada colisão.',
                tactical: 'Alcance: 3 (ataca à distância).',
                notes: 'Passiva: enquanto viva e adjacente ao boss, boss causa -1 de dano.'
            }
        });
        console.log('[V10.75] STORY_HERO_DETAILS atualizado (10 heróis).');
    }

    // =============================================================
    // 2. renderPAMiniGrid — corrigido para as PAs novas
    // =============================================================
    const _origRenderPA = window.renderPAMiniGrid;
    if (typeof _origRenderPA === 'function' && !_origRenderPA._v1075) {
        window.renderPAMiniGrid = function(heroClass) {
            const heroData = (typeof STORY_HERO_CLASSES !== 'undefined')
                ? STORY_HERO_CLASSES[heroClass] : null;
            if (!heroData) return _origRenderPA.apply(this, arguments);

            const paKey = heroData.paKey;
            const gridSize = 8;
            const CX = 3, CY = 4;
            const targetMock = { x: 3, y: 2 };
            const afetados = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
            const mark = (x, y) => {
                if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) afetados[y][x] = true;
            };

            let custom = false;

            if (paKey === 'maedamata_area3x3_cura') {
                custom = true;
                for (let dx = -1; dx <= 1; dx++)
                    for (let dy = -1; dy <= 1; dy++) mark(CX + dx, CY + dy);
            }
            else if (paKey === 'andure_area2x2_cura') {
                custom = true;
                for (let dx = -1; dx <= 1; dx++)
                    for (let dy = -1; dy <= 1; dy++) mark(CX + dx, CY + dy);
            }
            else if (paKey === 'negrinho_cruz_cura' ||
                     paKey === 'anhanga_mirim_raio' ||
                     paKey === 'ruda_flecha_amor' ||
                     paKey === 'tupinamba_avalanche') {
                custom = true;
                for (let x = 0; x < gridSize; x++) mark(x, targetMock.y);
                for (let y = 0; y < gridSize; y++) mark(targetMock.x, y);
            }
            else if (paKey === 'curupira_chuva_flechas') {
                custom = true;
                // Espalhados pelo tabuleiro (amostra visual)
                [
                    {x:0,y:0},{x:2,y:1},{x:5,y:1},{x:7,y:2},
                    {x:1,y:3},{x:4,y:3},{x:6,y:4},{x:0,y:5},
                    {x:3,y:6},{x:5,y:6}
                ].forEach(t => mark(t.x, t.y));
            }
            else if (paKey === 'maedouro_caminho') {
                custom = true;
                // Caminho herói → alvo
                for (let x = CX; x <= targetMock.x; x++) mark(x, CY);
                for (let y = targetMock.y; y <= CY; y++) mark(targetMock.x, y);
                // Rota Explosiva (3×3 no alvo)
                for (let dx = -1; dx <= 1; dx++)
                    for (let dy = -1; dy <= 1; dy++) mark(targetMock.x + dx, targetMock.y + dy);
            }
            else if (paKey === 'kianumanka_meteoro') {
                custom = true;
                for (let dx = -1; dx <= 1; dx++)
                    for (let dy = -1; dy <= 1; dy++) mark(targetMock.x + dx, targetMock.y + dy);
            }
            else if (paKey === 'matinta_rajada') {
                custom = true;
                for (let x = 0; x < gridSize; x++) mark(x, CY);
            }

            if (!custom) return _origRenderPA.apply(this, arguments);

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
        window.renderPAMiniGrid._v1075 = true;
        console.log('[V10.75] renderPAMiniGrid atualizado.');
    }

    // =============================================================
    // 3. CSS unificado
    // =============================================================
    if (!document.getElementById('v1075CSS')) {
        const style = document.createElement('style');
        style.id = 'v1075CSS';
        style.textContent = `
            /* Battle modal: usa as classes .hero-details-* sem duplicar padding */
            .battle-hero-modal-body { padding: 0 !important; }
            .battle-hero-modal-body .hero-details-section { border-bottom: 1px solid rgba(201, 162, 39, 0.15); }
            .battle-hero-modal-body .hero-details-section:last-child { border-bottom: none; }
            .battle-hero-modal-body .hero-details-stat-value { font-size: 1rem; }
        `;
        document.head.appendChild(style);
    }

    // =============================================================
    // 4. openBattleHeroDetails — unificado com OCA
    // =============================================================
    window.openBattleHeroDetails = function(idx) {
        const p = players?.[idx];
        if (!p) return;

        const heroClass = p.class;
        const heroData = (typeof STORY_HERO_CLASSES !== 'undefined')
            ? STORY_HERO_CLASSES[heroClass] : null;
        if (!heroData) return;

        const details = STORY_HERO_DETAILS[heroClass] || {};
        const meta = window.PASSIVE_DISPLAY?.[heroData.passive];
        const equip = (typeof getHeroEquipment === 'function') ? getHeroEquipment(heroClass) : null;
        const weapon = (equip?.arma && typeof getWeaponById === 'function') ? getWeaponById(equip.arma) : null;
        const amulet = (equip?.amuleto && typeof getAmuletById === 'function') ? getAmuletById(equip.amuleto) : null;

        const old = document.getElementById('battleHeroModal');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'battleHeroModal';
        overlay.className = 'battle-hero-modal-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const spriteSrc = (typeof SPRITES !== 'undefined' && SPRITES[heroClass]) || '';
        const elColor = { FOGO:'#e74c3c', AGUA:'#3498db', TERRA:'#27ae60', AR:'#f1c40f' }[p.element] || '#c8b787';

        const statsHTML = `
            <div class="hero-details-stats">
                <div class="hero-details-stat">
                    <div class="hero-details-stat-label">HP</div>
                    <div class="hero-details-stat-value">${p.hp}/${p.maxHp}</div>
                </div>
                <div class="hero-details-stat">
                    <div class="hero-details-stat-label">ATK</div>
                    <div class="hero-details-stat-value">${(typeof CLASS_DB !== 'undefined' && CLASS_DB[heroClass]?.atk) ?? '?'}</div>
                </div>
                <div class="hero-details-stat">
                    <div class="hero-details-stat-label">Alcance</div>
                    <div class="hero-details-stat-value">${(heroData.range === 0) ? '1 (corpo)' : (heroData.range || '?')}</div>
                </div>
                <div class="hero-details-stat">
                    <div class="hero-details-stat-label">Papel</div>
                    <div class="hero-details-stat-value">${heroData.role}</div>
                </div>
            </div>
        `;

        const miniGrid = (typeof window.renderPAMiniGrid === 'function')
            ? window.renderPAMiniGrid(heroClass) : '';

        const equipHTML = (weapon || amulet) ? `
            <div class="hero-details-section">
                <div class="hero-details-section-title">⚔️ EQUIPAMENTO</div>
                ${weapon ? `<div class="battle-hero-modal-line">⚔️ <b>${weapon.nome}</b> — +${weapon.atkBonus} ATK · ${weapon.elemento === 'ANY' ? '✨ Abissal' : weapon.elemento}</div>` : ''}
                ${amulet ? `<div class="battle-hero-modal-line">🧿 <b>${amulet.nome}</b></div>` : ''}
            </div>
        ` : '';

        const paHTML = details.paName ? `
            <div class="hero-details-section">
                <div class="hero-details-section-title">⚡ PODER ANCESTRAL</div>
                <div class="hero-details-pa-name">${details.paName}</div>
                <div class="hero-details-pa-desc">${details.paDesc || ''}</div>
                ${details.paExtra ? `<div class="hero-details-pa-extra">${details.paExtra}</div>` : ''}
            </div>
        ` : '';

        const areaHTML = miniGrid ? `
            <div class="hero-details-section">
                <div class="hero-details-section-title">🎯 ÁREA AFETADA</div>
                <div class="hero-details-pa-image-wrap">${miniGrid}</div>
                <div class="hero-details-legend">
                    <span class="hero-details-legend-item"><span class="hero-details-legend-mark pa-mini-hero-mark">⭐</span> Herói</span>
                    <span class="hero-details-legend-item"><span class="hero-details-legend-mark pa-mini-afetado-mark"></span> Tile afetado</span>
                </div>
            </div>
        ` : '';

        const passiveHTML = meta ? `
            <div class="hero-details-section hero-details-passive">
                <div class="hero-details-section-title">⭐ PASSIVA — ${meta.name}</div>
                <div class="hero-details-pa-desc">${meta.desc}</div>
            </div>
        ` : '';

        const notesHTML = details.notes ? `
            <div class="hero-details-section hero-details-notes">
                <div class="hero-details-section-title">📝 NOTAS</div>
                <div class="hero-details-note">${details.notes}</div>
            </div>
        ` : '';

        overlay.innerHTML = `
            <div class="battle-hero-modal-panel">
                <div class="battle-hero-modal-header">
                    <img src="${spriteSrc}" class="battle-hero-modal-sprite" onerror="this.style.display='none'">
                    <div class="battle-hero-modal-name">
                        ${heroData.displayName || heroClass}
                        <span style="font-size:0.75rem; color:${elColor}; margin-left:6px;">${p.element || ''}</span>
                    </div>
                    <button class="battle-hero-modal-close" onclick="document.getElementById('battleHeroModal').remove()">✕</button>
                </div>
                <div class="battle-hero-modal-body">
                    <div class="hero-details-section">
                        <div class="hero-details-section-title">📊 ATRIBUTOS</div>
                        ${statsHTML}
                    </div>
                    ${equipHTML}
                    ${paHTML}
                    ${areaHTML}
                    ${passiveHTML}
                    ${notesHTML}
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.75] Cards OCA + Batalha unificados');
    console.log('═══════════════════════════════════════════════════');
    console.log('• STORY_HERO_DETAILS: 10 heróis atualizados');
    console.log('• renderPAMiniGrid: 8 PAs corrigidas (3×3, cruz, etc.)');
    console.log('• Battle modal usa o mesmo conteúdo da OCA');
    console.log('═══════════════════════════════════════════════════');
})();

// =================================================================
// historia.js — BLOCO V10.80 (Fix: armas evento + coração vazio + essências)
// -----------------------------------------------------------------
// Corrige:
//   BUG 1: Armas do evento não aparecem no inventário (ID raw)
//   BUG 2: Coração do Vazio craftável na Tesouraria
//   NOVO:  Pesadelo dropa Coração do Vazio (mesma chance dos raros)
//   NOVO:  Essências escalam por dificuldade (1x / 1.5x / 2x)
// =================================================================

(function fixEventoItensV1080() {
    if (window._fixEventoItensV1080) return;
    window._fixEventoItensV1080 = true;

    // =============================================================
    // 0. CORAÇÃO DO VAZIO EM STORY_MATERIALS (para display de drop)
    // =============================================================
    if (typeof STORY_MATERIALS !== 'undefined' && !STORY_MATERIALS['coracao_vazio']) {
        STORY_MATERIALS['coracao_vazio'] = {
            id: 'coracao_vazio',
            name: 'Coração do Vazio',
            emoji: '🖤'
        };
    }

    // =============================================================
    // 1. getWeaponById inclui EVENTO_ARMAS (BUG 1)
    // -------------------------------------------------------------
    // O V39.1 sobrescreveu e só olhava STORY_WEAPONS.
    // Armas do evento ficavam "invisíveis" no inventário.
    // =============================================================
    if (typeof window.getBaseId !== 'function') {
        window.getBaseId = function(id) {
            if (!id) return null;
            return String(id).split('#')[0];
        };
    }

    window.getWeaponById = function(uid) {
        if (!uid) return null;
        const baseId = window.getBaseId(uid);

        // Armas normais (Ato 1-13)
        if (typeof STORY_WEAPONS !== 'undefined' && STORY_WEAPONS[baseId]) {
            return { ...STORY_WEAPONS[baseId], uid: uid, baseId: baseId, id: uid };
        }
        // ⭐ Armas do EVENTO (21 armas)
        if (typeof EVENTO_ARMAS !== 'undefined' && EVENTO_ARMAS[baseId]) {
            return { ...EVENTO_ARMAS[baseId], uid: uid, baseId: baseId, id: uid };
        }
        return null;
    };

    // Ícone das armas do evento (usa EVENTO_SPRITES)
    window.getWeaponIcon = function(uid, size) {
        const baseId = window.getBaseId(uid);

        // 1. Sprite específico do evento
        if (typeof EVENTO_SPRITES !== 'undefined' && EVENTO_SPRITES[baseId]) {
            const url = EVENTO_SPRITES[baseId];
            if (url && url.trim() !== '') {
                const cls = size === 'large' ? 'weapon-icon weapon-icon-large'
                          : size === 'small' ? 'weapon-icon weapon-icon-small'
                          : 'weapon-icon';
                return `<img src="${url}" class="${cls}" alt="${baseId}">`;
            }
        }

        // 2. Arma normal
        if (typeof STORY_WEAPONS !== 'undefined' && STORY_WEAPONS[baseId]) {
            const w = STORY_WEAPONS[baseId];
            const emoji = w.emoji || '⚔️';
            const fs = size === 'large' ? '2em' : size === 'small' ? '0.85em' : '1em';
            return `<span style="font-size:${fs};">${emoji}</span>`;
        }

        // 3. Fallback
        return '⚔️';
    };

    // =============================================================
    // 2. isAmuletAvailable bloqueia coracao_vazio (BUG 2)
    // =============================================================
    const _origIsAmuletAvail = window.isAmuletAvailable;
    if (typeof _origIsAmuletAvail === 'function') {
        window.isAmuletAvailable = function(amuletId) {
            const baseId = window.getBaseId(amuletId);
            // Coração do Vazio é EXCLUSIVO da Loja das Sombras
            if (baseId === 'coracao_vazio') return false;
            return _origIsAmuletAvail.apply(this, arguments);
        };
    }

    // =============================================================
    // 3. MIGRAÇÃO: converte itens sem UID (V12.9 cria IDs raw)
    // -------------------------------------------------------------
    // Idempotente. Pode rodar várias vezes.
    // =============================================================
    window._migrarItensSemUID = function() {
        if (typeof STORY_PROGRESS === 'undefined') return false;
        let mudou = false;
        const getBase = window.getBaseId;

        function migrarArray(arr) {
            if (!Array.isArray(arr)) return arr;

            // Bases que JÁ têm UID (para detectar duplicatas)
            const basesComUID = new Set();
            arr.forEach(id => {
                if (typeof id === 'string' && id.includes('#')) {
                    basesComUID.add(getBase(id));
                }
            });

            const resultado = [];
            arr.forEach(id => {
                if (typeof id !== 'string') return;

                if (id.includes('#')) {
                    resultado.push(id); // Já tem UID
                } else {
                    const base = getBase(id);
                    if (basesComUID.has(base)) {
                        // Raw duplicado (já existe versão com UID) → descarta
                        mudou = true;
                    } else {
                        // Migra para UID
                        resultado.push(`${base}#${Date.now()}${Math.floor(Math.random()*1000000)}`);
                        mudou = true;
                    }
                }
            });
            return resultado;
        }

        STORY_PROGRESS.craftedWeapons = migrarArray(STORY_PROGRESS.craftedWeapons);
        STORY_PROGRESS.craftedAmulets = migrarArray(STORY_PROGRESS.craftedAmulets);

        // Atualiza referências em heroEquipment (raw → UID)
        if (STORY_PROGRESS.heroEquipment) {
            const weaponMap = new Map();
            const amuletMap = new Map();
            (STORY_PROGRESS.craftedWeapons || []).forEach(uid => {
                const base = getBase(uid);
                if (!weaponMap.has(base)) weaponMap.set(base, uid);
            });
            (STORY_PROGRESS.craftedAmulets || []).forEach(uid => {
                const base = getBase(uid);
                if (!amuletMap.has(base)) amuletMap.set(base, uid);
            });

            for (const hc in STORY_PROGRESS.heroEquipment) {
                const eq = STORY_PROGRESS.heroEquipment[hc];
                if (!eq) continue;

                if (eq.arma && !eq.arma.includes('#')) {
                    const base = getBase(eq.arma);
                    if (weaponMap.has(base)) {
                        eq.arma = weaponMap.get(base);
                    } else {
                        eq.arma = null;
                    }
                    mudou = true;
                }
                if (eq.amuleto && !eq.amuleto.includes('#')) {
                    const base = getBase(eq.amuleto);
                    if (amuletMap.has(base)) {
                        eq.amuleto = amuletMap.get(base);
                    } else {
                        eq.amuleto = null;
                    }
                    mudou = true;
                }
            }
        }

        // ⭐ SYNC: eventoArmas → craftedWeapons (com UID)
        // O _aplicarDrops (V9.5-P2B) empurra pra eventoArmas, não craftedWeapons.
        // Aqui garante que o item aparece no inventário.
        if (Array.isArray(STORY_PROGRESS.eventoArmas) && Array.isArray(STORY_PROGRESS.craftedWeapons)) {
            const basesWeapons = new Set(STORY_PROGRESS.craftedWeapons.map(getBase));
            STORY_PROGRESS.eventoArmas.forEach(baseId => {
                if (baseId && !basesWeapons.has(baseId)) {
                    STORY_PROGRESS.craftedWeapons.push(
                        `${baseId}#${Date.now()}${Math.floor(Math.random()*1000000)}`
                    );
                    mudou = true;
                }
            });
        }

        if (mudou && typeof saveStoryProgress === 'function') saveStoryProgress();
        return mudou;
    };

    // =============================================================
    // 4. Hook comprarEventoItem (loja usa UID)
    // =============================================================
    const _origComprar = window.comprarEventoItem;
    if (typeof _origComprar === 'function' && !_origComprar._v1080) {
        window.comprarEventoItem = function(itemId, preco, tipo) {
            const r = _origComprar.apply(this, arguments);
            window._migrarItensSemUID();
            return r;
        };
        window.comprarEventoItem._v1080 = true;
    }

    // =============================================================
    // 5. Hook eventoFinalizarPartida
    // -------------------------------------------------------------
    // • Roda ANTES do original (é o ÚLTIMO wrapper instalado)
    // • Roll Coração Vazio se Pesadelo venceu
    // • Após original: escala essências + migra itens
    // =============================================================
    const _origFinalizar = window.eventoFinalizarPartida;
    if (typeof _origFinalizar === 'function' && !_origFinalizar._v1080) {
        const _innerFinalizar = _origFinalizar;

        window.eventoFinalizarPartida = async function(vitoria, saindo) {
            // Reset
            window._pvCoracaoDropado = false;

            // Captura ANTES (para calcular delta de essência)
            const essenciaAntes = (STORY_PROGRESS?.inventory?.['essencia_sombria'] || 0);

            // ⭐ ROLL CORAÇÃO DO VAZIO (só Pesadelo, só vitória no boss final)
            if (vitoria && !saindo
                && window._eventoBatalha?.isPesadelo
                && window._eventoBatalha?.faseId === 'boss') {

                const diffId = STORY_PROGRESS.eventoDificuldade || 'normal';
                const diff = (typeof EVENTO_DIFICULDADES !== 'undefined')
                    ? EVENTO_DIFICULDADES[diffId] : null;
                // dropItem: 5% / 10% / 20% (mesma chance dos fragmentos raros)
                const chance = diff?.dropItem ?? 0.05;

                if (Math.random() < chance) {
                    if (!Array.isArray(STORY_PROGRESS.craftedAmulets)) {
                        STORY_PROGRESS.craftedAmulets = [];
                    }

                    const jaTem = STORY_PROGRESS.craftedAmulets.some(id =>
                        window.getBaseId(id) === 'coracao_vazio'
                    );

                    if (!jaTem) {
                        STORY_PROGRESS.craftedAmulets.push(
                            `coracao_vazio#${Date.now()}${Math.floor(Math.random()*1000000)}`
                        );
                        STORY_PROGRESS.itemDurability = STORY_PROGRESS.itemDurability || {};
                        STORY_PROGRESS.itemDurability['coracao_vazio'] = 100;
                        window._pvCoracaoDropado = true;

                        if (typeof showToast === 'function') {
                            showToast('🖤', 'Coração do Vazio dropado!', '🖤');
                        }
                        console.log('[V10.80] Coração Vazio dropado do Pesadelo!');
                    } else {
                        console.log('[V10.80] Coração Vazio já possuído. Drop ignorado.');
                    }
                }
            }

            // Chama o original (drops + finalização + tela)
            const result = await _innerFinalizar.apply(this, arguments);

            // ⭐ ESCALAR ESSÊNCIAS POR DIFICULDADE
            // O V10.42 já dropa; aqui a gente escala o delta
            if (vitoria && !saindo) {
                const essenciaDepois = (STORY_PROGRESS?.inventory?.['essencia_sombria'] || 0);
                const deltaOriginal = essenciaDepois - essenciaAntes;

                if (deltaOriginal > 0) {
                    const diffId = STORY_PROGRESS.eventoDificuldade || 'normal';
                    const multiplicador = {
                        normal:   1.0,
                        dificil:  2.5,
                        pesadelo: 5.0
                    }[diffId] ?? 1.0;

                    if (multiplicador !== 1.0) {
                        const deltaAjustado = Math.floor(deltaOriginal * multiplicador);
                        STORY_PROGRESS.inventory['essencia_sombria'] = essenciaAntes + deltaAjustado;
                        if (typeof saveStoryProgress === 'function') saveStoryProgress();
                        console.log(`[V10.80] Essência escalada: ${deltaOriginal} → ${deltaAjustado} (${diffId})`);
                    }
                }
            }

            // ⭐ Migra itens após tudo (drops usam ID raw)
            window._migrarItensSemUID();

            return result;
        };
        window.eventoFinalizarPartida._v1080 = true;
    }

    // =============================================================
    // 6. Hook _mostrarTelaFinalEvento (Coração no display)
    // =============================================================
    const _installMostrarHook = () => {
        if (typeof window._mostrarTelaFinalEvento !== 'function') return false;
        if (window._mostrarTelaFinalEvento._v1080) return true;

        const _origMostrar = window._mostrarTelaFinalEvento;

        window._mostrarTelaFinalEvento = function(vitoria, drops, dropsResult) {
            const _origVictory = window.showStoryVictoryScreen;
            let restored = false;
            const restore = () => {
                if (!restored) {
                    window.showStoryVictoryScreen = _origVictory;
                    restored = true;
                }
            };

            // Só intercepta se coração foi dropado
            if (vitoria && window._pvCoracaoDropado && typeof _origVictory === 'function') {
                window.showStoryVictoryScreen = function(phase, dropsFormatados, rewards, meta) {
                    if (Array.isArray(dropsFormatados)) {
                        dropsFormatados.push({ id: 'coracao_vazio', qty: 1 });
                    }
                    restore();
                    return _origVictory.call(this, phase, dropsFormatados, rewards, meta);
                };
            }

            try {
                return _origMostrar.apply(this, arguments);
            } finally {
                restore();
            }
        };
        window._mostrarTelaFinalEvento._v1080 = true;
        console.log('[V10.80] Hook _mostrarTelaFinalEvento instalado.');
        return true;
    };
    if (!_installMostrarHook()) {
        const t = setInterval(() => { if (_installMostrarHook()) clearInterval(t); }, 200);
    }

    // =============================================================
    // 7. Hooks de entrada (migração on-demand)
    // =============================================================
    const _origRenderTes = window.renderTesourariaScreen;
    if (typeof _origRenderTes === 'function' && !_origRenderTes._v1080) {
        window.renderTesourariaScreen = function() {
            window._migrarItensSemUID();
            return _origRenderTes.apply(this, arguments);
        };
        window.renderTesourariaScreen._v1080 = true;
    }

    const _origOpenEquip = window.openEquipScreen;
    if (typeof _origOpenEquip === 'function' && !_origOpenEquip._v1080) {
        window.openEquipScreen = function(heroClass) {
            window._migrarItensSemUID();
            const r = _origOpenEquip.apply(this, arguments);
            // Migra de novo (V12.9 pode ter empurrado raw durante a renderização)
            window._migrarItensSemUID();
            return r;
        };
        window.openEquipScreen._v1080 = true;
    }

    // =============================================================
    // 8. Migração inicial ao carregar (saves antigos)
    // =============================================================
    setTimeout(() => {
        if (window._migrarItensSemUID()) {
            console.log('[V10.80] Migração inicial concluída (saves antigos).');
        }
    }, 800);
    setTimeout(() => {
        window._migrarItensSemUID();
    }, 2500);

    // =============================================================
    // 9. Debug
    // =============================================================
    window._debugEventoItens = function() {
        console.log('═══ [V10.80] Evento Itens ═══');
        console.log('craftedWeapons:', STORY_PROGRESS?.craftedWeapons);
        console.log('craftedAmulets:', STORY_PROGRESS?.craftedAmulets);
        console.log('eventoArmas:', STORY_PROGRESS?.eventoArmas);
        console.log('essencia_sombria:', STORY_PROGRESS?.inventory?.['essencia_sombria']);
        console.log('coracao_vazio disponível?', window.isAmuletAvailable('coracao_vazio'));
        console.log('getWeaponById("arma_teju_tacape") →', window.getWeaponById('arma_teju_tacape'));
        console.log('getWeaponById("arma_teju_tacape#123") →', window.getWeaponById('arma_teju_tacape#123'));
        console.log('══════════════════════════════');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.80] Fix: Itens do Evento');
    console.log('═══════════════════════════════════════════════════');
    console.log('🐛 BUG 1 — Armas do evento no inventário:');
    console.log('   • getWeaponById agora busca em EVENTO_ARMAS');
    console.log('   • Migração sincroniza eventoArmas → craftedWeapons com UID');
    console.log('   • Ícone das armas do evento usa EVENTO_SPRITES');
    console.log('');
    console.log('🐛 BUG 2 — Coração do Vazio na Tesouraria:');
    console.log('   • isAmuletAvailable("coracao_vazio") agora retorna FALSE');
    console.log('');
    console.log('🎁 NOVO — Coração do Vazio como drop do Pesadelo:');
    console.log('   • Chance: 5% (normal) / 10% (difícil) / 20% (pesadelo)');
    console.log('   • Aparece na tela de vitória como drop');
    console.log('');
    console.log('💎 NOVO — Essências escalam por dificuldade:');
    console.log('   • Normal: ×1.0  |  Difícil: ×1.5  |  Pesadelo: ×2.0');
    console.log('');
    console.log('💡 Debug: window._debugEventoItens()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — BLOCO V10.81 (Fix sprites das armas)
// -----------------------------------------------------------------
// O V10.80 sobrescreveu getWeaponIcon e perdeu STORY_WEAPON_SPRITES
// (armas normais viravam emoji). Este patch restaura a prioridade:
//
//   1. STORY_WEAPON_SPRITES (armas normais, Ato 1-13)
//   2. EVENTO_SPRITES (armas do evento, 21 armas)
//   3. Emoji do item (fallback)
// =================================================================

(function fixWeaponSpritesV1081() {
    if (window._fixWeaponSpritesV1081) return;
    window._fixWeaponSpritesV1081 = true;

    // =============================================================
    // getWeaponIcon — agora com 3 camadas de prioridade
    // =============================================================
    window.getWeaponIcon = function(uid, size) {
        const baseId = (typeof window.getBaseId === 'function')
            ? window.getBaseId(uid)
            : (uid ? String(uid).split('#')[0] : null);

        if (!baseId) return '⚔️';

        const cls = size === 'large' ? 'weapon-icon weapon-icon-large'
                  : size === 'small' ? 'weapon-icon weapon-icon-small'
                  : 'weapon-icon';

        // ────────────────────────────────────────────────────────
        // 1. ARMA NORMAL → STORY_WEAPON_SPRITES
        // ────────────────────────────────────────────────────────
        if (typeof STORY_WEAPON_SPRITES !== 'undefined' && STORY_WEAPON_SPRITES[baseId]) {
            const url = STORY_WEAPON_SPRITES[baseId];
            if (url && String(url).trim() !== '') {
                const emoji = STORY_WEAPONS?.[baseId]?.emoji || '⚔️';
                return `<img src="${url}" class="${cls}" alt="${baseId}" onerror="this.outerHTML='${emoji}'">`;
            }
        }

        // ────────────────────────────────────────────────────────
        // 2. ARMA DO EVENTO → EVENTO_SPRITES
        // ────────────────────────────────────────────────────────
        if (typeof EVENTO_SPRITES !== 'undefined' && EVENTO_SPRITES[baseId]) {
            const url = EVENTO_SPRITES[baseId];
            if (url && String(url).trim() !== '') {
                const emoji = EVENTO_ARMAS?.[baseId]?.emoji
                           || (EVENTO_ARMAS?.[baseId]?.tipo === 'flecha' ? '🏹'
                             : EVENTO_ARMAS?.[baseId]?.tipo === 'cajado' ? '🪄'
                             : '⚔️');
                return `<img src="${url}" class="${cls}" alt="${baseId}" onerror="this.outerHTML='${emoji}'">`;
            }
        }

        // ────────────────────────────────────────────────────────
        // 3. FALLBACK → emoji
        // ────────────────────────────────────────────────────────
        const w = (typeof STORY_WEAPONS !== 'undefined') ? STORY_WEAPONS[baseId] : null;
        const evt = (typeof EVENTO_ARMAS !== 'undefined') ? EVENTO_ARMAS[baseId] : null;

        let emoji = '⚔️';
        if (w?.emoji) emoji = w.emoji;
        else if (evt?.emoji) emoji = evt.emoji;
        else if (evt?.tipo === 'flecha') emoji = '🏹';
        else if (evt?.tipo === 'cajado') emoji = '🪄';
        else if (evt?.tipo === 'tacape') emoji = '🪓';

        const fs = size === 'large' ? '2em' : size === 'small' ? '0.85em' : '1em';
        return `<span style="font-size:${fs}; display:inline-block; line-height:1;">${emoji}</span>`;
    };

    // =============================================================
    // getAmuletIcon — mesma coisa para amuletos (por garantia)
    // -------------------------------------------------------------
    // O V10.80 não tocou nisso, mas o V40.1 também não garante.
    // Aqui deixamos explícito.
    // =============================================================
    window.getAmuletIcon = function(uid, size) {
        const baseId = (typeof window.getBaseId === 'function')
            ? window.getBaseId(uid)
            : (uid ? String(uid).split('#')[0] : null);

        if (!baseId) return '🧿';

        const cls = size === 'large' ? 'weapon-icon weapon-icon-large'
                  : size === 'small' ? 'weapon-icon weapon-icon-small'
                  : 'weapon-icon';

        // 1. Sprite da tabela antiga
        if (typeof STORY_AMULET_SPRITES !== 'undefined' && STORY_AMULET_SPRITES[baseId]) {
            const url = STORY_AMULET_SPRITES[baseId];
            if (url && String(url).trim() !== '') {
                const emoji = STORY_AMULETS?.[baseId]?.emoji || '🧿';
                return `<img src="${url}" class="${cls}" alt="${baseId}" onerror="this.outerHTML='${emoji}'">`;
            }
        }

        // 2. Fallback emoji
        const a = (typeof STORY_AMULETS !== 'undefined') ? STORY_AMULETS[baseId] : null;
        const emoji = a?.emoji || '🧿';
        const fs = size === 'large' ? '2em' : size === 'small' ? '0.85em' : '1em';
        return `<span style="font-size:${fs}; display:inline-block; line-height:1;">${emoji}</span>`;
    };

    // =============================================================
    // Diagnóstico
    // =============================================================
    window._debugSprites = function() {
        console.log('═══ [V10.81] Sprites ═══');
        console.log('STORY_WEAPON_SPRITES:', Object.keys(STORY_WEAPON_SPRITES || {}).length);
        console.log('EVENTO_SPRITES (armas):',
            Object.keys(EVENTO_SPRITES || {}).filter(k => k.startsWith('arma_')).length);
        console.log('');
        console.log('Teste arma normal:');
        console.log('  tacape_1 →', window.getWeaponIcon('tacape_1', 'normal').substring(0, 60));
        console.log('Teste arma evento:');
        console.log('  arma_teju_tacape →', window.getWeaponIcon('arma_teju_tacape', 'normal').substring(0, 60));
        console.log('Teste com UID:');
        console.log('  arma_teju_tacape#123 →', window.getWeaponIcon('arma_teju_tacape#123', 'normal').substring(0, 60));
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.81] Sprites das armas restaurados');
    console.log('═══════════════════════════════════════════════════');
    console.log('Prioridade:');
    console.log('  1. STORY_WEAPON_SPRITES (armas normais)');
    console.log('  2. EVENTO_SPRITES (armas do evento)');
    console.log('  3. Emoji (último recurso)');
    console.log('');
    console.log('💡 Debug: window._debugSprites()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — BLOCO V10.82 (Fix: revive de arma desmanchada)
// -----------------------------------------------------------------
// O V10.80 sincronizava eventoArmas → craftedWeapons em CADA chamada
// de _migrarItensSemUID (que roda 2x no load + em cada render).
// Se o jogador desmanchasse uma arma já recuperada, ela voltava.
//
// Solução: cada base ID só é recuperada UMA VEZ por save. Depois
// disso, desmanchar é definitivo.
// =================================================================

(function fixReviveArmaDesmanchadaV1082() {
    if (window._fixReviveArmaDesmanchadaV1082) return;
    window._fixReviveArmaDesmanchadaV1082 = true;

    // Garante o array de controle no save
    if (typeof STORY_PROGRESS !== 'undefined' && !Array.isArray(STORY_PROGRESS._v1080_armasRecuperadas)) {
        STORY_PROGRESS._v1080_armasRecuperadas = [];
    }

    // Sobrescreve o _migrarItensSemUID com a lógica "recupera uma vez só"
    const _origMigrar = window._migrarItensSemUID;
    if (typeof _origMigrar === 'function' && !_origMigrar._v1082) {
        window._migrarItensSemUID = function() {
            if (typeof STORY_PROGRESS === 'undefined') return false;
            if (!Array.isArray(STORY_PROGRESS._v1080_armasRecuperadas)) {
                STORY_PROGRESS._v1080_armasRecuperadas = [];
            }

            let mudou = false;
            const getBase = window.getBaseId || (id => id ? String(id).split('#')[0] : null);

            // ---- 1. Migra raw → UID (delega ao original, que já faz certo) ----
            const mudouOriginal = _origMigrar.apply(this, arguments);
            if (mudouOriginal) mudou = true;

            // ---- 2. Sync eventoArmas → craftedWeapons (uma vez por base) ----
            if (Array.isArray(STORY_PROGRESS.eventoArmas) &&
                Array.isArray(STORY_PROGRESS.craftedWeapons)) {

                const basesWeapons = new Set(STORY_PROGRESS.craftedWeapons.map(getBase));

                STORY_PROGRESS.eventoArmas.forEach(baseId => {
                    if (!baseId) return;

                    // ⭐ Se já foi recuperada antes, pula (mesmo que o jogador
                    // tenha desmanchado depois). Desmanchar é definitivo.
                    if (STORY_PROGRESS._v1080_armasRecuperadas.includes(baseId)) {
                        return;
                    }

                    // Se o item não está no inventário → adiciona
                    if (!basesWeapons.has(baseId)) {
                        const novoUID = `${baseId}#${Date.now()}${Math.floor(Math.random()*1000000)}`;
                        STORY_PROGRESS.craftedWeapons.push(novoUID);
                        basesWeapons.add(baseId);
                        mudou = true;
                        console.log(`[V10.82] Arma recuperada uma vez: ${baseId}`);
                    }

                    // Marca como recuperada (mesmo que já estivesse lá)
                    STORY_PROGRESS._v1080_armasRecuperadas.push(baseId);
                    mudou = true;
                });
            }

            if (mudou && typeof saveStoryProgress === 'function') {
                saveStoryProgress();
            }
            return mudou;
        };
        window._migrarItensSemUID._v1082 = true;
        console.log('[V10.82] Sync eventoArmas limitado a uma recuperação por base.');
    }

    // Diagnóstico
    window._debugRecuperadas = function() {
        console.log('═══ [V10.82] Recuperadas ═══');
        console.log('_v1080_armasRecuperadas:', STORY_PROGRESS._v1080_armasRecuperadas);
        console.log('eventoArmas:', STORY_PROGRESS.eventoArmas);
        console.log('craftedWeapons:', STORY_PROGRESS.craftedWeapons);
        console.log('══════════════════════════════');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V10.82] Fix: arma desmanchada não volta mais');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Cada base ID é recuperada UMA VEZ por save');
    console.log('• Desmanchar depois da recuperação é definitivo');
    console.log('• Save antigo (sem a flag) roda o sync normalmente na 1ª vez');
    console.log('');
    console.log('💡 Debug: window._debugRecuperadas()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V50 — Fix UX: Ritual + Barra de Preview
// -----------------------------------------------------------------
// 1. Ritual: ao subir nível, mantém scroll no herói ascendido
//    + destaca o card com um flash dourado por 2s
// 2. Preview Bar: reserva espaço fixo, não empurra mais o tabuleiro
//    (a barra aparece no espaço reservado, sem mover nada)
//
// Cole NO FINAL do historia.js.
// =================================================================
(function fixUXRitualPreviewV50() {
    if (window._fixUXRitualPreviewV50) return;
    window._fixUXRitualPreviewV50 = true;

    // =============================================================
    // CSS
    // =============================================================
    if (!document.getElementById('fixUXV50CSS')) {
        const style = document.createElement('style');
        style.id = 'fixUXV50CSS';
        style.textContent = `
            /* ─── Ritual: destaque do card ascendido ─── */
            .ritual-card-highlight {
                animation: ritualCardFlashV50 2s ease-out;
            }
            @keyframes ritualCardFlashV50 {
                0% {
                    box-shadow: 0 0 0 rgba(232, 185, 35, 0);
                    transform: scale(1);
                }
                20% {
                    box-shadow:
                        0 0 30px rgba(232, 185, 35, 0.9),
                        inset 0 0 20px rgba(232, 185, 35, 0.3);
                    transform: scale(1.02);
                }
                100% {
                    box-shadow: 0 0 0 rgba(232, 185, 35, 0);
                    transform: scale(1);
                }
            }

            /* ─── Preview Bar: reserva espaço, não empurra nada ───
             * display: flex !important sobrescreve display:none inline
             * opacity: 0 por padrão (vazia), 1 quando tem conteúdo
             * min-height garante o espaço reservado sempre
             */
            #storyPreviewBarV3 {
                display: flex !important;
                min-height: 36px !important;
                opacity: 0;
                transition: opacity 0.15s;
                pointer-events: none;
            }
            #storyPreviewBarV3.preview-active {
                opacity: 1;
                pointer-events: auto;
            }
            /* Versões antigas: continua escondido */
            #storyPreviewBar,
            #storyPreviewBarV2 {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    // =============================================================
    // RITUAL: fixar scroll no herói ascendido
    // =============================================================
    let _ultimoAscendHero = null;
    let _ascendScrollTimer = null;

    function fixarScrollNoHeroi(heroClass, tentativa) {
        tentativa = tentativa || 0;
        if (tentativa > 25) {
            console.log('[V50] Desistiu de fixar scroll (25 tentativas).');
            return;
        }

        const heroData = window.STORY_HERO_CLASSES?.[heroClass];
        if (!heroData) return;
        const nome = heroData.displayName;

        const cards = document.querySelectorAll('.ritual-card');
        for (const card of cards) {
            const nameEl = card.querySelector('.ritual-card-name');
            if (nameEl && nameEl.textContent.trim() === nome) {
                try {
                    card.scrollIntoView({ block: 'center', behavior: 'smooth' });
                } catch (e) {
                    card.scrollIntoView(false);
                }
                card.classList.add('ritual-card-highlight');
                setTimeout(() => card.classList.remove('ritual-card-highlight'), 2200);
                console.log(`[V50] Scroll fixado em ${nome}`);
                return;
            }
        }
        // Ainda não achou — tenta de novo (render pode estar em andamento)
        _ascendScrollTimer = setTimeout(
            () => fixarScrollNoHeroi(heroClass, tentativa + 1),
            200
        );
    }

    const _origAscend = window.handleRitualAscend;
    if (typeof _origAscend === 'function' && !_origAscend._v50) {
        window.handleRitualAscend = function (heroClass) {
            _ultimoAscendHero = heroClass;
            if (_ascendScrollTimer) {
                clearTimeout(_ascendScrollTimer);
                _ascendScrollTimer = null;
            }
            const r = _origAscend.apply(this, arguments);
            setTimeout(() => {
                if (_ultimoAscendHero === heroClass) fixarScrollNoHeroi(heroClass);
            }, 1200);
            return r;
        };
        window.handleRitualAscend._v50 = true;
        console.log('[V50] handleRitualAscend: scroll fixado.');
    }

    const _origReroll = window.rerollStat11;
    if (typeof _origReroll === 'function' && !_origReroll._v50) {
        window.rerollStat11 = function (heroClass) {
            _ultimoAscendHero = heroClass;
            if (_ascendScrollTimer) {
                clearTimeout(_ascendScrollTimer);
                _ascendScrollTimer = null;
            }
            const r = _origReroll.apply(this, arguments);
            setTimeout(() => {
                if (_ultimoAscendHero === heroClass) fixarScrollNoHeroi(heroClass);
            }, 1200);
            return r;
        };
        window.rerollStat11._v50 = true;
    }

    // =============================================================
    // PREVIEW BAR: observa conteúdo e toggla .preview-active
    // =============================================================
    function instalarObserverPreview() {
        const boardArea = document.querySelector('.board-area');
        if (!boardArea) {
            setTimeout(instalarObserverPreview, 500);
            return;
        }

        const obs = new MutationObserver(() => {
            const bar = document.getElementById('storyPreviewBarV3');
            if (!bar) return;
            // Tem conteúdo real?
            const hasContent =
                bar.children.length > 0 ||
                bar.textContent.trim() !== '';
            bar.classList.toggle('preview-active', hasContent);
        });

        obs.observe(boardArea, { childList: true, subtree: true, characterData: true });
        console.log('[V50] Observer do preview bar instalado.');
    }
    instalarObserverPreview();

    // =============================================================
    // Debug
    // =============================================================
    window._debugV50UX = function () {
        console.log('═══ [V50] UX ═══');
        console.log('Último herói ascendido:', _ultimoAscendHero);
        console.log('Timer ativo?', !!_ascendScrollTimer);
        const bar = document.getElementById('storyPreviewBarV3');
        console.log('Preview bar existe?', !!bar);
        if (bar) {
            console.log('Barra tem classe preview-active?', bar.classList.contains('preview-active'));
            console.log('Barra display:', getComputedStyle(bar).display);
            console.log('Barra opacity:', getComputedStyle(bar).opacity);
            console.log('Barra min-height:', getComputedStyle(bar).minHeight);
            console.log('Barra filhos:', bar.children.length);
        }
        console.log('═══════════════');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V50] Fix UX instalado');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Ritual: scroll fixa no herói que subiu de nível');
    console.log('• Preview Bar: reserva espaço, não move o tabuleiro');
    console.log('• Debug: window._debugV50UX()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V50.1 — Fix definitivo do scroll no Ritual
// -----------------------------------------------------------------
// O V50 disparava o scroll 1.2s após o CLIQUE, mas o overlay da
// animação do roll só fecha quando o usuário clica em "CONTINUAR".
// Solução: esperar o overlay fechar via MutationObserver, depois
// aguardar o DOM estabilizar (render do V36.2 leva ~700ms) e por
// fim fazer o scroll no card certo.
//
// Cole NO FINAL do historia.js (depois do V50).
// =================================================================
(function fixScrollRitualV50_1() {
    if (window._fixScrollRitualV50_1) return;
    window._fixScrollRitualV50_1 = true;

    let _heroAlvoAscensao = null;
    let _observerOverlay = null;

    // -------------------------------------------------------------
    // Scroll preciso no card do herói (com fallback manual)
    // -------------------------------------------------------------
    function scrollPrecisoNoCard(heroClass) {
        const heroData = window.STORY_HERO_CLASSES?.[heroClass];
        if (!heroData) return false;
        const nome = heroData.displayName;

        const screen = document.getElementById('storyScreen');
        if (!screen) return false;

        const cards = document.querySelectorAll('.ritual-card');
        for (const card of cards) {
            const nameEl = card.querySelector('.ritual-card-name');
            if (!nameEl) continue;
            if (nameEl.textContent.trim() !== nome) continue;

            // 1. scrollIntoView como base
            try {
                card.scrollIntoView({ block: 'center', behavior: 'auto' });
            } catch (e) {}

            // 2. Ajuste fino manual (garante centralização)
            try {
                const cardRect = card.getBoundingClientRect();
                const screenRect = screen.getBoundingClientRect();
                const offsetIdeal = screenRect.top + (screenRect.height / 2) - (cardRect.height / 2);
                const delta = cardRect.top - offsetIdeal;
                if (Math.abs(delta) > 20) {
                    screen.scrollTop += delta;
                }
            } catch (e) {}

            // 3. Destaque visual
            card.classList.add('ritual-card-highlight');
            setTimeout(() => card.classList.remove('ritual-card-highlight'), 2500);

            console.log(`[V50.1] Scroll fixado em ${nome}`);
            return true;
        }
        return false;
    }

    // -------------------------------------------------------------
    // Aguarda o DOM do Ritual estabilizar antes de fazer o scroll
    // -------------------------------------------------------------
    function aguardarRitualEstabilizar() {
        let tentativas = 0;
        let ultimoCardCount = -1;
        let estabilizadoHa = 0;
        let scrollFeito = false;

        const tentar = () => {
            tentativas++;
            if (!_heroAlvoAscensao) return;

            const cards = document.querySelectorAll('.ritual-card');
            const count = cards.length;

            if (count === ultimoCardCount) {
                estabilizadoHa++;
            } else {
                ultimoCardCount = count;
                estabilizadoHa = 0;
            }

            // Faz scroll quando o DOM estabilizou por 3 ciclos (600ms)
            if (estabilizadoHa >= 3 && !scrollFeito) {
                scrollFeito = scrollPrecisoNoCard(_heroAlvoAscensao);
            }

            if (!scrollFeito && tentativas < 80) {
                setTimeout(tentar, 200);
                return;
            }

            // Re-verificação: se o DOM re-renderizar de novo (algum patch
            // tardio) e o card sair da tela, re-fixa.
            if (scrollFeito) {
                setTimeout(() => {
                    if (!_heroAlvoAscensao) return;
                    const screen = document.getElementById('storyScreen');
                    const heroData = window.STORY_HERO_CLASSES?.[_heroAlvoAscensao];
                    if (!screen || !heroData) return;

                    const cards = document.querySelectorAll('.ritual-card');
                    for (const card of cards) {
                        const nameEl = card.querySelector('.ritual-card-name');
                        if (!nameEl || nameEl.textContent.trim() !== heroData.displayName) continue;

                        const rect = card.getBoundingClientRect();
                        const sRect = screen.getBoundingClientRect();
                        if (rect.top < sRect.top + 50 || rect.bottom > sRect.bottom - 50) {
                            console.log('[V50.1] Card saiu da tela após render tardio — re-fixando');
                            scrollPrecisoNoCard(_heroAlvoAscensao);
                        }
                        break;
                    }
                }, 3000);
            }
        };

        setTimeout(tentar, 250);
    }

    // -------------------------------------------------------------
    // Observer que espera o overlay do roll FECHAR
    // -------------------------------------------------------------
    function monitorarOverlay() {
        if (_observerOverlay) _observerOverlay.disconnect();

        _observerOverlay = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.removedNodes) {
                    if (node.id === 'stat11RollOverlay') {
                        console.log('[V50.1] Overlay de roll fechou — aguardando render estabilizar');
                        // Espera V36.2 re-renderizar (100ms) + pós-processamentos (600ms)
                        setTimeout(aguardarRitualEstabilizar, 800);
                        return;
                    }
                }
            }
        });

        _observerOverlay.observe(document.body, { childList: true });
    }

    // -------------------------------------------------------------
    // Substitui handleRitualAscend
    // -------------------------------------------------------------
    const _origAscend = window.handleRitualAscend;
    if (typeof _origAscend === 'function' && !_origAscend._v50_1) {
        window.handleRitualAscend = function (heroClass) {
            _heroAlvoAscensao = heroClass;
            monitorarOverlay();
            return _origAscend.apply(this, arguments);
        };
        window.handleRitualAscend._v50_1 = true;
        console.log('[V50.1] handleRitualAscend: scroll aguarda overlay fechar.');
    }

    // -------------------------------------------------------------
    // Substitui rerollStat11
    // -------------------------------------------------------------
    const _origReroll = window.rerollStat11;
    if (typeof _origReroll === 'function' && !_origReroll._v50_1) {
        window.rerollStat11 = function (heroClass) {
            _heroAlvoAscensao = heroClass;
            monitorarOverlay();
            return _origReroll.apply(this, arguments);
        };
        window.rerollStat11._v50_1 = true;
    }

    // -------------------------------------------------------------
    // Debug
    // -------------------------------------------------------------
    window._debugV501 = function () {
        console.log('═══ [V50.1] ═══');
        console.log('Herói alvo:', _heroAlvoAscensao);
        console.log('Observer ativo?', !!_observerOverlay);
        console.log('Overlay de roll aberto agora?', !!document.getElementById('stat11RollOverlay'));
        console.log('Cards do Ritual no DOM:', document.querySelectorAll('.ritual-card').length);
        const screen = document.getElementById('storyScreen');
        if (screen) {
            console.log('storyScreen scrollTop:', screen.scrollTop);
            console.log('storyScreen scrollHeight:', screen.scrollHeight);
            console.log('storyScreen clientHeight:', screen.clientHeight);
        }
        console.log('═══════════════');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V50.1] Scroll do Ritual — fix definitivo');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Aguarda overlay do roll fechar (MutationObserver)');
    console.log('• Espera DOM estabilizar (3 ciclos × 200ms)');
    console.log('• Scroll preciso + re-verifica em 3s');
    console.log('• Debug: window._debugV501()');
    console.log('═══════════════════════════════════════════════════');
})();

// =================================================================
// historia.js — V62 — Curupira: seleção manual (patch único)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js (depois do V50.1).
//
// O que faz:
//   • execute() substituído (10 tiles manuais, corrompidos purificam)
//   • triggerBravelyChain substituído (bypass V23.2 pro Curupira)
//   • Limpa path + bloqueia cliques ANTES do GIF (mata o bug do
//     "caminho aleatório" do original)
//   • Overlay verde sobre "Jogar Turno" (só sobreposição, sem
//     bloquear/desbloquear a função)
//   • Sem botão de cancelar (clique no tile de novo desmarca)
// =================================================================
(function curupiraV62() {
    if (window._curupiraV62) return;
    window._curupiraV62 = true;

    const PA_KEY = 'curupira_chuva_flechas';
    const _sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const _corrompido = (idx) =>
        Array.isArray(window._corruptedTiles) && window._corruptedTiles.includes(idx);

    // ═══════════════════════════════════════════════════════════
    // ESTADO
    // ═══════════════════════════════════════════════════════════
    const st = {
        ativo: false,
        tiles: [],
        overlay: null,
        overlayTimer: null,
        resolve: null,
        captureHandler: null,
        preCapture: null,
    };
    window._curupiraV62State = st;

    // ═══════════════════════════════════════════════════════════
    // LOCALIZAR BOTÃO "JOGAR TURNO"
    // ═══════════════════════════════════════════════════════════
    function _findPlayBtn() {
        const ids = ['btnPlay','btnJogarTurno','btnExecutar','btnTurno','btnConfirmTurno','btnConfirmarAcao','btnJogar','btnExecute','btnAction'];
        for (const id of ids) {
            const el = document.getElementById(id);
            if (el && el.tagName === 'BUTTON') return el;
        }
        const all = document.querySelectorAll('button');
        for (const b of all) {
            const oc = b.getAttribute('onclick') || '';
            if (oc.includes('executeAction') && !oc.includes('activateSkill')) return b;
        }
        for (const b of all) {
            const txt = (b.textContent || '').trim().toUpperCase();
            if ((txt.includes('JOGAR TURNO') || txt === 'EXECUTAR' || txt.includes('EXECUTAR AÇÃO'))
                && !b.id.startsWith('curupiraV62')) return b;
        }
        return null;
    }

    // ═══════════════════════════════════════════════════════════
    // OVERLAY SOBRE O BOTÃO
    // ═══════════════════════════════════════════════════════════
    function _atualizarContador() {
        const el = document.getElementById('curupiraV62Confirm');
        if (!el) return;
        const n = st.tiles.length;
        const corr = st.tiles.filter(t => _corrompido(t.idx)).length;
        el.textContent = corr > 0
            ? `✓ CONFIRMAR (${n}/10) · ${corr}🖤`
            : `✓ CONFIRMAR (${n}/10)`;
    }

    function _posicionarOverlay() {
        if (!st.overlay) return;
        const btn = _findPlayBtn();
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        if (r.width < 5 || r.height < 5) return;
        st.overlay.style.left = (r.left - 2) + 'px';
        st.overlay.style.top = (r.top - 2) + 'px';
        st.overlay.style.width = (r.width + 4) + 'px';
        st.overlay.style.height = (r.height + 4) + 'px';
    }

    function _criarOverlay() {
        if (st.overlay) return;
        const ov = document.createElement('button');
        ov.id = 'curupiraV62Overlay';
        ov.type = 'button';
        ov.style.cssText = `
            position: fixed;
            z-index: 2147483647;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 12px;
            box-sizing: border-box;
            cursor: pointer;
            background: linear-gradient(180deg, rgba(107,163,92,.4), transparent 45%),
                        linear-gradient(135deg, #4a7040, #2a4520);
            color: #e0f0d0;
            border: 2px solid #6ba35c;
            border-radius: 6px;
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 0.9rem;
            letter-spacing: 1px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.9);
            box-shadow: 0 0 20px rgba(107,163,92,.7), 0 4px 15px rgba(0,0,0,.5);
            animation: curupiraV62Pulse 1s ease-in-out infinite alternate;
            user-select: none;
            -webkit-user-select: none;
        `;
        ov.innerHTML = `<span id="curupiraV62Confirm">✓ CONFIRMAR (0/10)</span>`;
        ov.onclick = (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            ev.stopImmediatePropagation();
            _confirmar();
        };
        document.body.appendChild(ov);
        st.overlay = ov;
        _posicionarOverlay();
        st.overlayTimer = setInterval(_posicionarOverlay, 150);
        window.addEventListener('resize', _posicionarOverlay);
        window.addEventListener('scroll', _posicionarOverlay, true);
    }

    function _removerOverlay() {
        if (st.overlayTimer) { clearInterval(st.overlayTimer); st.overlayTimer = null; }
        window.removeEventListener('resize', _posicionarOverlay);
        window.removeEventListener('scroll', _posicionarOverlay, true);
        if (st.overlay) { try { st.overlay.remove(); } catch(e) {} st.overlay = null; }
    }

    // ═══════════════════════════════════════════════════════════
    // TOGGLE DE TILE
    // ═══════════════════════════════════════════════════════════
    function _toggle(el, idx) {
        if (!st.ativo) return;
        const corr = _corrompido(idx);
        if (!corr && grid[idx] === 'FOGO') {
            if (typeof showToast === 'function') showToast('🏹', 'Não pode escolher FOGO comum!', '🏹');
            return;
        }
        const pos = st.tiles.findIndex(t => t.idx === idx);
        if (pos >= 0) {
            st.tiles.splice(pos, 1);
            el.classList.remove('curupiraV62-selected');
        } else {
            if (st.tiles.length >= 10) {
                if (typeof showToast === 'function') showToast('🏹', 'Máximo de 10 tiles!', '🏹');
                return;
            }
            st.tiles.push({ idx, x: idx % 8, y: Math.floor(idx / 8) });
            el.classList.add('curupiraV62-selected');
        }
        _atualizarContador();
    }

    // ═══════════════════════════════════════════════════════════
    // FECHAR SELEÇÃO
    // ═══════════════════════════════════════════════════════════
    function _fechar() {
        st.ativo = false;
        if (st.captureHandler) {
            window.removeEventListener('click', st.captureHandler, true);
            st.captureHandler = null;
        }
        if (st.preCapture) {
            window.removeEventListener('click', st.preCapture, true);
            st.preCapture = null;
        }
        document.querySelectorAll('.curupiraV62-eligible, .curupiraV62-selected')
            .forEach(el => el.classList.remove('curupiraV62-eligible', 'curupiraV62-selected'));
        _removerOverlay();
        const resolve = st.resolve;
        st.resolve = null;
        const tiles = st.tiles.slice();
        st.tiles = [];
        if (resolve) resolve({ tiles });
    }

    function _confirmar() {
        if (!st.ativo) return;
        if (st.tiles.length === 0) {
            if (typeof showToast === 'function') showToast('🏹', 'Escolha ao menos 1 tile!', '🏹');
            return;
        }
        _fechar();
    }

    // ═══════════════════════════════════════════════════════════
    // ABRIR SELEÇÃO
    // ═══════════════════════════════════════════════════════════
    function _abrirSelecao() {
        return new Promise((resolve) => {
            st.ativo = true;
            st.tiles = [];
            st.resolve = resolve;

            const elegiveis = [];
            for (let i = 0; i < 64; i++) {
                if (_corrompido(i) || grid[i] !== 'FOGO') elegiveis.push(i);
            }

            if (elegiveis.length === 0) {
                st.ativo = false;
                st.resolve = null;
                if (typeof showToast === 'function') showToast('🏹', 'Nenhum tile elegível!', '🏹');
                resolve({ tiles: [] });
                return;
            }

            const allTiles = document.querySelectorAll('#grid .tile');
            elegiveis.forEach(i => {
                if (allTiles[i]) allTiles[i].classList.add('curupiraV62-eligible');
            });

            _criarOverlay();

            // Capture handler da seleção
            st.captureHandler = (ev) => {
                if (!st.ativo) return;
                if (ev.target.closest('#curupiraV62Overlay')) return;
                const tile = ev.target.closest('#grid .tile');
                if (tile) {
                    ev.stopPropagation();
                    ev.preventDefault();
                    ev.stopImmediatePropagation();
                    const tiles = Array.from(document.querySelectorAll('#grid .tile'));
                    const idx = tiles.indexOf(tile);
                    if (idx !== -1) _toggle(tile, idx);
                } else {
                    ev.stopPropagation();
                    ev.preventDefault();
                    ev.stopImmediatePropagation();
                }
            };
            window.addEventListener('click', st.captureHandler, true);

            // Remove pre-capture (a seleção agora tem o seu próprio)
            if (st.preCapture) {
                window.removeEventListener('click', st.preCapture, true);
                st.preCapture = null;
            }

            if (typeof addLog === 'function') {
                const corr = elegiveis.filter(_corrompido).length;
                const extra = corr > 0 ? ` (${corr} corrompido${corr > 1 ? 's' : ''} purificável${corr > 1 ? 'eis' : ''})` : '';
                addLog(`🏹 Curupira: escolha até 10 tiles${extra}.`);
            }
        });
    }

    // ═══════════════════════════════════════════════════════════
    // EXECUTE NOVO
    // ═══════════════════════════════════════════════════════════
    async function _executeNovo(active, target, totalAtk) {
        try { if (typeof playSfx === 'function') playSfx('skill1'); } catch(e) {}

        const resultado = await _abrirSelecao();
        const selecionados = resultado.tiles;

        if (selecionados.length === 0) {
            if (typeof addLog === 'function') addLog('🏹 Curupira: nenhum tile escolhido.');
            return;
        }

        const bossIdx = (target && typeof target.x === 'number') ? (target.y * 8 + target.x) : -1;
        let danoTotal = 0;
        let purificados = 0;

        for (let i = 0; i < selecionados.length; i++) {
            const t = selecionados[i];
            const eraTerra = (grid[t.idx] === 'TERRA');
            const corr = _corrompido(t.idx);

            if (corr) {
                window._corruptedTiles = (window._corruptedTiles || []).filter(x => x !== t.idx);
                purificados++;
                const board = document.getElementById('board');
                const s = (typeof getStep === 'function') ? getStep() : 59;
                if (board) {
                    const smoke = document.createElement('div');
                    smoke.className = 'corruption-smoke-fx';
                    smoke.style.left = (t.x * s + 8) + 'px';
                    smoke.style.top = (t.y * s + 8) + 'px';
                    smoke.style.width = s + 'px';
                    smoke.style.height = s + 'px';
                    board.appendChild(smoke);
                    setTimeout(() => smoke.remove(), 1500);
                }
            }

            grid[t.idx] = 'TERRA';
            const el = document.querySelectorAll('#grid .tile')[t.idx];
            if (el) el.className = 'tile bg-TERRA';

            if (typeof spawnFxAt === 'function') {
                spawnFxAt('impact', 'fx-impact', t.x, t.y, { duration: 500, scale: 0.8, delay: i * 40 });
            }

            if (target && !target.dead && t.idx === bossIdx) {
                const dmg = eraTerra ? Math.floor(totalAtk * 2) : totalAtk;
                danoTotal += dmg;
                await _sleep(200);
                if (typeof applyDmg === 'function') applyDmg(target, dmg);
                if (typeof addLog === 'function') {
                    addLog(eraTerra
                        ? `🏹 Curupira: DANO ×2 (${dmg})! Boss já estava em TERRA.`
                        : `🏹 Curupira: dano ${dmg} no boss.`);
                }
            }
            await _sleep(80);
        }

        await _sleep(400);

        if (purificados > 0) {
            if (typeof addLog === 'function') addLog(`✨ Curupira purificou ${purificados} tile(s)!`);
            try { if (typeof playSfx === 'function') playSfx('purificacao'); } catch(e) {}
        }

        if (typeof addLog === 'function') {
            addLog(`🏹 Curupira: ${selecionados.length} tiles → TERRA.${danoTotal > 0 ? ` Dano: ${danoTotal}.` : ''}`);
        }
        if (typeof updateVisuals === 'function') updateVisuals();
        if (typeof updateTitleStats === 'function') updateTitleStats('bravely_chain');
    }

    // ═══════════════════════════════════════════════════════════
    // INSTALAR EXECUTE
    // ═══════════════════════════════════════════════════════════
    function _instalarExecute() {
        if (typeof STORY_HERO_PA === 'undefined') return;
        if (!STORY_HERO_PA[PA_KEY]) STORY_HERO_PA[PA_KEY] = {};
        if (STORY_HERO_PA[PA_KEY].execute === _executeNovo) return;
        STORY_HERO_PA[PA_KEY].execute = _executeNovo;
        STORY_HERO_PA[PA_KEY].desc = 'Escolha até 10 tiles (≠ FOGO comum). Corrompidos são purificados. Dano ×2 se boss em tile que já era TERRA.';
    }
    _instalarExecute();
    setTimeout(_instalarExecute, 500);
    setTimeout(_instalarExecute, 1500);
    setTimeout(_instalarExecute, 3000);

    // ═══════════════════════════════════════════════════════════
    // INSTALAR triggerBravelyChain
    // -------------------------------------------------------------
    // Para o Curupira: bypass TOTAL do V23.2 (sem dano duplicado,
    // sem conversão AR). Para os outros heróis: delega.
    //
    // Limpa path + bloqueia cliques ANTES do GIF (mata o bug do
    // "caminho aleatório" do original).
    // ═══════════════════════════════════════════════════════════
    function _instalarBravely() {
        const cur = window.triggerBravelyChain;
        if (typeof cur !== 'function') return;
        if (cur._v62Curupira) return;

        const wrapped = async function(active, target, totalAtk) {
            const heroData = (typeof STORY_HERO_CLASSES !== 'undefined' && active)
                ? STORY_HERO_CLASSES[active.class] : null;

            if (!heroData || heroData.paKey !== PA_KEY) {
                return cur.apply(this, arguments);
            }

            // ─── Curupira: fluxo próprio ───

            // ⭐ Limpa path IMEDIATAMENTE (evita que cliques durante o
            //    GIF adicionem tiles ao "caminho aleatório")
            try {
                if (typeof path !== 'undefined' && Array.isArray(path)) {
                    path.length = 0;
                    if (typeof renderPath === 'function') renderPath();
                }
            } catch(e) {}

            // ⭐ Pre-capture: bloqueia cliques em tiles ANTES do GIF
            //    (a seleção real substitui por outro capture)
            if (st.preCapture) window.removeEventListener('click', st.preCapture, true);
            st.preCapture = (ev) => {
                const tile = ev.target.closest('#grid .tile');
                if (tile) {
                    ev.stopPropagation();
                    ev.preventDefault();
                    ev.stopImmediatePropagation();
                }
            };
            window.addEventListener('click', st.preCapture, true);

            try {
                // GIF "PODER ANCESTRAL"
                if (typeof showPoderAncestralEffect === 'function') {
                    try { showPoderAncestralEffect(); } catch(e) {}
                }
                await _sleep(300);

                // Chama execute (que troca o preCapture pelo capture da seleção)
                const paFn = STORY_HERO_PA[PA_KEY];
                if (paFn && typeof paFn.execute === 'function') {
                    await paFn.execute(active, target, totalAtk);
                }
            } finally {
                // Limpeza de segurança
                if (st.preCapture) {
                    window.removeEventListener('click', st.preCapture, true);
                    st.preCapture = null;
                }
            }
        };
        wrapped._v62Curupira = true;
        window.triggerBravelyChain = wrapped;
    }
    _instalarBravely();
    setTimeout(_instalarBravely, 500);
    setTimeout(_instalarBravely, 1500);
    setTimeout(_instalarBravely, 3000);

    // ═══════════════════════════════════════════════════════════
    // DESCRIÇÃO NO PAINEL "?"
    // ═══════════════════════════════════════════════════════════
    function _atualizarDescricao() {
        if (typeof STORY_HERO_DETAILS === 'undefined') return;
        STORY_HERO_DETAILS['Curupira'] = {
            paName: 'Chuva de Flechas',
            paDesc: 'Curupira escolhe até 10 tiles no tabuleiro. Cada um se transforma em TERRA, e flechas caem sobre eles. Tiles corrompidos podem ser escolhidos — e são purificados. Se o boss estiver em um dos tiles escolhidos, toma dano PA — dobrado se o tile já era TERRA antes.',
            paExtra: 'Até 10 tiles (≠ FOGO comum, corrompidos OK). Convertem pra TERRA. Corrompidos são purificados. Dano ×2 se boss em tile que já era TERRA.',
            tactical: 'Alcance: 3 (ataca à distância).',
            notes: 'PA purifica corrupção dos tiles escolhidos.'
        };
    }
    _atualizarDescricao();
    setTimeout(_atualizarDescricao, 800);
    setTimeout(_atualizarDescricao, 2000);
    setTimeout(_atualizarDescricao, 4000);

    // ═══════════════════════════════════════════════════════════
    // CSS
    // ═══════════════════════════════════════════════════════════
    if (!document.getElementById('curupiraV62CSS')) {
        const s = document.createElement('style');
        s.id = 'curupiraV62CSS';
        s.textContent = `
            @keyframes curupiraV62Pulse {
                from { box-shadow: 0 0 15px rgba(107,163,92,.6), 0 4px 15px rgba(0,0,0,.5); }
                to   { box-shadow: 0 0 35px rgba(107,163,92,1), 0 4px 15px rgba(0,0,0,.5); }
            }
            #curupiraV62Overlay:hover { filter: brightness(1.1); }

            .curupiraV62-eligible {
                box-shadow: inset 0 0 0 2px rgba(74,140,181,.9) !important;
                cursor: pointer !important;
                animation: curupiraV62EligPulse 1s ease-in-out infinite alternate !important;
            }
            @keyframes curupiraV62EligPulse {
                from { box-shadow: inset 0 0 0 2px rgba(74,140,181,.5); }
                to   { box-shadow: inset 0 0 0 3px rgba(74,140,181,1), 0 0 12px rgba(74,140,181,.6); }
            }
            .curupiraV62-selected {
                box-shadow: inset 0 0 0 3px #e8b923, 0 0 20px rgba(232,185,35,.9) !important;
                transform: scale(1.05);
                z-index: 5;
            }
            .tile.tile-corrupted.curupiraV62-eligible {
                cursor: pointer !important;
            }
            .tile.tile-corrupted.curupiraV62-selected {
                background: linear-gradient(135deg, rgba(142,68,173,.4), rgba(39,174,96,.4)) !important;
                box-shadow: inset 0 0 0 3px #e8b923, 0 0 22px rgba(232,185,35,.9), 0 0 32px rgba(142,68,173,.7) !important;
            }
            .tile.tile-corrupted.curupiraV62-selected .corruption-fx { display: none !important; }
        `;
        document.head.appendChild(s);
    }

    // ═══════════════════════════════════════════════════════════
    // DEBUG
    // ═══════════════════════════════════════════════════════════
    window._debugCurupiraV62 = function() {
        console.log('═══ [V62] Curupira ═══');
        console.log('ativo:', st.ativo);
        console.log('tiles:', st.tiles.length, st.tiles);
        console.log('overlay:', !!document.getElementById('curupiraV62Overlay'));
        console.log('preCapture:', !!st.preCapture);
        console.log('captureHandler:', !!st.captureHandler);
        console.log('execute override?', STORY_HERO_PA?.[PA_KEY]?.execute === _executeNovo);
        console.log('bravely override?', window.triggerBravelyChain?._v62Curupira === true);
        console.log('corrupted:', window._corruptedTiles);
        console.log('════════════════════════');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V62] Curupira — seleção manual sobre o original');
    console.log('═══════════════════════════════════════════════════');
    console.log('• execute() substituído');
    console.log('• triggerBravelyChain bypassa V23.2 pro Curupira');
    console.log('• path limpo ANTES do GIF (mata bug do caminho)');
    console.log('• Cliques em tiles bloqueados durante execução');
    console.log('• Overlay verde sobre "Jogar Turno"');
    console.log('• SEM botão de cancelar (clique de novo desmarca)');
    console.log('');
    console.log('💡 Debug: window._debugCurupiraV62()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V63 — Curupira: auto-diagnóstico + reinstalação forçada
// -----------------------------------------------------------------
// Faz 3 coisas:
//   1. Substitui execute() e triggerBravelyChain do Curupira
//   2. REINSTALA a cada 100ms se algo sobrescrever
//   3. LOGA tudo no console: quando carrega, quando chama, quando abre
//
// Cole NO FINAL do historia.js.
// =================================================================
(function curupiraV63() {
    if (window._curupiraV63) return;
    window._curupiraV63 = true;

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V63] Curupira — carregando...');
    console.log('═══════════════════════════════════════════════════');

    const PA_KEY = 'curupira_chuva_flechas';
    const _sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const _corrompido = (idx) =>
        Array.isArray(window._corruptedTiles) && window._corruptedTiles.includes(idx);

    const st = {
        ativo: false,
        tiles: [],
        overlay: null,
        overlayTimer: null,
        resolve: null,
        captureHandler: null,
        preCapture: null,
    };

    // ─────────────────────────────────────────────────────────────
    // LOCALIZAR BOTÃO
    // ─────────────────────────────────────────────────────────────
    function _findPlayBtn() {
        const ids = ['btnPlay','btnJogarTurno','btnExecutar','btnTurno','btnConfirmTurno','btnConfirmarAcao','btnJogar','btnExecute','btnAction'];
        for (const id of ids) {
            const el = document.getElementById(id);
            if (el && el.tagName === 'BUTTON') return el;
        }
        const all = document.querySelectorAll('button');
        for (const b of all) {
            const oc = b.getAttribute('onclick') || '';
            if (oc.includes('executeAction') && !oc.includes('activateSkill')) return b;
        }
        for (const b of all) {
            const txt = (b.textContent || '').trim().toUpperCase();
            if ((txt.includes('JOGAR TURNO') || txt === 'EXECUTAR' || txt.includes('EXECUTAR AÇÃO'))
                && !b.id.startsWith('curupiraV63')) return b;
        }
        return null;
    }

    // ─────────────────────────────────────────────────────────────
    // OVERLAY
    // ─────────────────────────────────────────────────────────────
    function _atualizarContador() {
        const el = document.getElementById('curupiraV63Confirm');
        if (!el) return;
        const n = st.tiles.length;
        const corr = st.tiles.filter(t => _corrompido(t.idx)).length;
        el.textContent = corr > 0
            ? `✓ CONFIRMAR (${n}/10) · ${corr}🖤`
            : `✓ CONFIRMAR (${n}/10)`;
    }

    function _posicionarOverlay() {
        if (!st.overlay) return;
        const btn = _findPlayBtn();
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        if (r.width < 5 || r.height < 5) return;
        st.overlay.style.left = (r.left - 2) + 'px';
        st.overlay.style.top = (r.top - 2) + 'px';
        st.overlay.style.width = (r.width + 4) + 'px';
        st.overlay.style.height = (r.height + 4) + 'px';
    }

    function _criarOverlay() {
        if (st.overlay) return;
        const ov = document.createElement('button');
        ov.id = 'curupiraV63Overlay';
        ov.type = 'button';
        ov.style.cssText = `
            position: fixed; z-index: 2147483647;
            display: flex; align-items: center; justify-content: center;
            padding: 0 12px; box-sizing: border-box; cursor: pointer;
            background: linear-gradient(180deg, rgba(107,163,92,.4), transparent 45%),
                        linear-gradient(135deg, #4a7040, #2a4520);
            color: #e0f0d0; border: 2px solid #6ba35c; border-radius: 6px;
            font-family: 'Cinzel', serif; font-weight: 700; font-size: 0.9rem;
            letter-spacing: 1px; text-shadow: 0 1px 2px rgba(0,0,0,0.9);
            box-shadow: 0 0 20px rgba(107,163,92,.7), 0 4px 15px rgba(0,0,0,.5);
            animation: curupiraV63Pulse 1s ease-in-out infinite alternate;
            user-select: none;
        `;
        ov.innerHTML = `<span id="curupiraV63Confirm">✓ CONFIRMAR (0/10)</span>`;
        ov.onclick = (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            ev.stopImmediatePropagation();
            _confirmar();
        };
        document.body.appendChild(ov);
        st.overlay = ov;
        _posicionarOverlay();
        st.overlayTimer = setInterval(_posicionarOverlay, 150);
        window.addEventListener('resize', _posicionarOverlay);
        window.addEventListener('scroll', _posicionarOverlay, true);
        console.log('[V63] Overlay criado');
    }

    function _removerOverlay() {
        if (st.overlayTimer) { clearInterval(st.overlayTimer); st.overlayTimer = null; }
        window.removeEventListener('resize', _posicionarOverlay);
        window.removeEventListener('scroll', _posicionarOverlay, true);
        if (st.overlay) { try { st.overlay.remove(); } catch(e) {} st.overlay = null; }
    }

    // ─────────────────────────────────────────────────────────────
    // TOGGLE / CONFIRMAR
    // ─────────────────────────────────────────────────────────────
    function _toggle(el, idx) {
        if (!st.ativo) return;
        const corr = _corrompido(idx);
        if (!corr && grid[idx] === 'FOGO') {
            if (typeof showToast === 'function') showToast('🏹', 'Não pode escolher FOGO comum!', '🏹');
            return;
        }
        const pos = st.tiles.findIndex(t => t.idx === idx);
        if (pos >= 0) {
            st.tiles.splice(pos, 1);
            el.classList.remove('curupiraV63-selected');
        } else {
            if (st.tiles.length >= 10) {
                if (typeof showToast === 'function') showToast('🏹', 'Máximo de 10!', '🏹');
                return;
            }
            st.tiles.push({ idx, x: idx % 8, y: Math.floor(idx / 8) });
            el.classList.add('curupiraV63-selected');
        }
        _atualizarContador();
    }

    function _fechar() {
        st.ativo = false;
        if (st.captureHandler) {
            window.removeEventListener('click', st.captureHandler, true);
            st.captureHandler = null;
        }
        if (st.preCapture) {
            window.removeEventListener('click', st.preCapture, true);
            st.preCapture = null;
        }
        document.querySelectorAll('.curupiraV63-eligible, .curupiraV63-selected')
            .forEach(el => el.classList.remove('curupiraV63-eligible', 'curupiraV63-selected'));
        _removerOverlay();
        const resolve = st.resolve;
        st.resolve = null;
        const tiles = st.tiles.slice();
        st.tiles = [];
        if (resolve) resolve({ tiles });
    }

    function _confirmar() {
        if (!st.ativo) return;
        if (st.tiles.length === 0) {
            if (typeof showToast === 'function') showToast('🏹', 'Escolha ao menos 1 tile!', '🏹');
            return;
        }
        console.log('[V63] Confirmando PA com', st.tiles.length, 'tiles');
        _fechar();
    }

    // ─────────────────────────────────────────────────────────────
    // ABRIR SELEÇÃO
    // ─────────────────────────────────────────────────────────────
    function _abrirSelecao() {
        return new Promise((resolve) => {
            st.ativo = true;
            st.tiles = [];
            st.resolve = resolve;

            const elegiveis = [];
            for (let i = 0; i < 64; i++) {
                if (_corrompido(i) || grid[i] !== 'FOGO') elegiveis.push(i);
            }
            console.log('[V63] Seleção aberta. Elegíveis:', elegiveis.length,
                '| Corrompidos:', elegiveis.filter(_corrompido).length);

            if (elegiveis.length === 0) {
                st.ativo = false;
                st.resolve = null;
                if (typeof showToast === 'function') showToast('🏹', 'Nenhum tile elegível!', '🏹');
                resolve({ tiles: [] });
                return;
            }

            const allTiles = document.querySelectorAll('#grid .tile');
            elegiveis.forEach(i => {
                if (allTiles[i]) allTiles[i].classList.add('curupiraV63-eligible');
            });

            _criarOverlay();

            st.captureHandler = (ev) => {
                if (!st.ativo) return;
                if (ev.target.closest('#curupiraV63Overlay')) return;
                const tile = ev.target.closest('#grid .tile');
                if (tile) {
                    ev.stopPropagation();
                    ev.preventDefault();
                    ev.stopImmediatePropagation();
                    const tiles = Array.from(document.querySelectorAll('#grid .tile'));
                    const idx = tiles.indexOf(tile);
                    if (idx !== -1) _toggle(tile, idx);
                } else {
                    ev.stopPropagation();
                    ev.preventDefault();
                    ev.stopImmediatePropagation();
                }
            };
            window.addEventListener('click', st.captureHandler, true);

            if (st.preCapture) {
                window.removeEventListener('click', st.preCapture, true);
                st.preCapture = null;
            }

            if (typeof addLog === 'function') {
                const corr = elegiveis.filter(_corrompido).length;
                const extra = corr > 0 ? ` (${corr} corrompido${corr > 1 ? 's' : ''})` : '';
                addLog(`🏹 Curupira: escolha até 10 tiles${extra}.`);
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    // EXECUTE
    // ─────────────────────────────────────────────────────────────
    async function _executeNovo(active, target, totalAtk) {
        console.log('[V63] execute CHAMADO. class=', active?.class, 'totalAtk=', totalAtk);
        try { if (typeof playSfx === 'function') playSfx('skill1'); } catch(e) {}

        const resultado = await _abrirSelecao();
        const selecionados = resultado.tiles;
        console.log('[V63] execute: selecionados =', selecionados.length);

        if (selecionados.length === 0) {
            if (typeof addLog === 'function') addLog('🏹 Curupira: nenhum tile escolhido.');
            return;
        }

        const bossIdx = (target && typeof target.x === 'number') ? (target.y * 8 + target.x) : -1;
        let danoTotal = 0;
        let purificados = 0;

        for (let i = 0; i < selecionados.length; i++) {
            const t = selecionados[i];
            const eraTerra = (grid[t.idx] === 'TERRA');
            const corr = _corrompido(t.idx);

            if (corr) {
                window._corruptedTiles = (window._corruptedTiles || []).filter(x => x !== t.idx);
                purificados++;
                const board = document.getElementById('board');
                const s = (typeof getStep === 'function') ? getStep() : 59;
                if (board) {
                    const smoke = document.createElement('div');
                    smoke.className = 'corruption-smoke-fx';
                    smoke.style.left = (t.x * s + 8) + 'px';
                    smoke.style.top = (t.y * s + 8) + 'px';
                    smoke.style.width = s + 'px';
                    smoke.style.height = s + 'px';
                    board.appendChild(smoke);
                    setTimeout(() => smoke.remove(), 1500);
                }
            }

            grid[t.idx] = 'TERRA';
            const el = document.querySelectorAll('#grid .tile')[t.idx];
            if (el) el.className = 'tile bg-TERRA';

            if (typeof spawnFxAt === 'function') {
                spawnFxAt('impact', 'fx-impact', t.x, t.y, { duration: 500, scale: 0.8, delay: i * 40 });
            }

            if (target && !target.dead && t.idx === bossIdx) {
                const dmg = eraTerra ? Math.floor(totalAtk * 2) : totalAtk;
                danoTotal += dmg;
                await _sleep(200);
                if (typeof applyDmg === 'function') applyDmg(target, dmg);
                if (typeof addLog === 'function') {
                    addLog(eraTerra
                        ? `🏹 Curupira: DANO ×2 (${dmg})! Boss já estava em TERRA.`
                        : `🏹 Curupira: dano ${dmg} no boss.`);
                }
            }
            await _sleep(80);
        }

        await _sleep(400);

        if (purificados > 0) {
            if (typeof addLog === 'function') addLog(`✨ Curupira purificou ${purificados} tile(s)!`);
            try { if (typeof playSfx === 'function') playSfx('purificacao'); } catch(e) {}
        }

        if (typeof addLog === 'function') {
            addLog(`🏹 Curupira: ${selecionados.length} tiles → TERRA.${danoTotal > 0 ? ` Dano: ${danoTotal}.` : ''}`);
        }
        if (typeof updateVisuals === 'function') updateVisuals();
        if (typeof updateTitleStats === 'function') updateTitleStats('bravely_chain');
    }

    // ─────────────────────────────────────────────────────────────
    // WRAPPER triggerBravelyChain
    // ─────────────────────────────────────────────────────────────
    function _criarWrapperBravely(inner) {
        const wrapped = async function(active, target, totalAtk) {
            const heroData = (typeof STORY_HERO_CLASSES !== 'undefined' && active)
                ? STORY_HERO_CLASSES[active.class] : null;

            console.log('[V63] triggerBravelyChain CHAMADO. class=', active?.class,
                'paKey=', heroData?.paKey);

            if (!heroData || heroData.paKey !== PA_KEY) {
                return inner.apply(this, arguments);
            }

            // ⭐ Curupira: fluxo próprio
            try {
                if (typeof path !== 'undefined' && Array.isArray(path)) {
                    path.length = 0;
                    if (typeof renderPath === 'function') renderPath();
                }
            } catch(e) {}

            if (st.preCapture) window.removeEventListener('click', st.preCapture, true);
            st.preCapture = (ev) => {
                const tile = ev.target.closest('#grid .tile');
                if (tile) {
                    ev.stopPropagation();
                    ev.preventDefault();
                    ev.stopImmediatePropagation();
                }
            };
            window.addEventListener('click', st.preCapture, true);

            try {
                if (typeof showPoderAncestralEffect === 'function') {
                    try { showPoderAncestralEffect(); } catch(e) {}
                }
                await _sleep(300);

                const paFn = STORY_HERO_PA[PA_KEY];
                if (paFn && typeof paFn.execute === 'function') {
                    await paFn.execute(active, target, totalAtk);
                }
            } finally {
                if (st.preCapture) {
                    window.removeEventListener('click', st.preCapture, true);
                    st.preCapture = null;
                }
            }
        };
        wrapped._v63Curupira = true;
        return wrapped;
    }

    // ─────────────────────────────────────────────────────────────
    // REINSTALAÇÃO FORÇADA A CADA 100ms
    // ─────────────────────────────────────────────────────────────
    let _contadorExec = 0;
    let _contadorBrav = 0;

    function _ensureExecute() {
        if (typeof STORY_HERO_PA === 'undefined') return;
        if (!STORY_HERO_PA[PA_KEY]) STORY_HERO_PA[PA_KEY] = {};
        if (STORY_HERO_PA[PA_KEY].execute === _executeNovo) return;
        STORY_HERO_PA[PA_KEY].execute = _executeNovo;
        STORY_HERO_PA[PA_KEY].desc = 'Escolha até 10 tiles (≠ FOGO comum). Corrompidos são purificados. Dano ×2 se boss em tile que já era TERRA.';
        _contadorExec++;
        console.log(`[V63] execute REINSTALADO (${_contadorExec}ª vez)`);
    }

    function _ensureBravely() {
        const cur = window.triggerBravelyChain;
        if (typeof cur !== 'function') return;
        if (cur._v63Curupira === true) return;
        window.triggerBravelyChain = _criarWrapperBravely(cur);
        _contadorBrav++;
        console.log(`[V63] triggerBravelyChain REINSTALADO (${_contadorBrav}ª vez)`);
    }

    setInterval(() => {
        _ensureExecute();
        _ensureBravely();
    }, 100);

    // Instala imediatamente
    _ensureExecute();
    _ensureBravely();

    // ─────────────────────────────────────────────────────────────
    // DESCRIÇÃO NO "?"
    // ─────────────────────────────────────────────────────────────
    function _atualizarDescricao() {
        if (typeof STORY_HERO_DETAILS === 'undefined') return;
        STORY_HERO_DETAILS['Curupira'] = {
            paName: 'Chuva de Flechas',
            paDesc: 'Curupira escolhe até 10 tiles no tabuleiro. Cada um vira TERRA, e flechas caem sobre eles. Corrompidos são purificados. Se o boss estiver em um tile escolhido, toma dano PA — ×2 se já era TERRA antes.',
            paExtra: 'Até 10 tiles (≠ FOGO comum, corrompidos OK). Convertem pra TERRA. Corrompidos são purificados. Dano ×2 se boss em tile que já era TERRA.',
            tactical: 'Alcance: 3 (ataca à distância).',
            notes: 'PA purifica corrupção.'
        };
    }
    _atualizarDescricao();
    setTimeout(_atualizarDescricao, 500);
    setTimeout(_atualizarDescricao, 2000);

    // ─────────────────────────────────────────────────────────────
    // CSS
    // ─────────────────────────────────────────────────────────────
    if (!document.getElementById('curupiraV63CSS')) {
        const s = document.createElement('style');
        s.id = 'curupiraV63CSS';
        s.textContent = `
            @keyframes curupiraV63Pulse {
                from { box-shadow: 0 0 15px rgba(107,163,92,.6), 0 4px 15px rgba(0,0,0,.5); }
                to   { box-shadow: 0 0 35px rgba(107,163,92,1), 0 4px 15px rgba(0,0,0,.5); }
            }
            #curupiraV63Overlay:hover { filter: brightness(1.1); }
            .curupiraV63-eligible {
                box-shadow: inset 0 0 0 2px rgba(74,140,181,.9) !important;
                cursor: pointer !important;
                animation: curupiraV63EligPulse 1s ease-in-out infinite alternate !important;
            }
            @keyframes curupiraV63EligPulse {
                from { box-shadow: inset 0 0 0 2px rgba(74,140,181,.5); }
                to   { box-shadow: inset 0 0 0 3px rgba(74,140,181,1), 0 0 12px rgba(74,140,181,.6); }
            }
            .curupiraV63-selected {
                box-shadow: inset 0 0 0 3px #e8b923, 0 0 20px rgba(232,185,35,.9) !important;
                transform: scale(1.05);
                z-index: 5;
            }
            .tile.tile-corrupted.curupiraV63-eligible { cursor: pointer !important; }
            .tile.tile-corrupted.curupiraV63-selected {
                background: linear-gradient(135deg, rgba(142,68,173,.4), rgba(39,174,96,.4)) !important;
                box-shadow: inset 0 0 0 3px #e8b923, 0 0 22px rgba(232,185,35,.9), 0 0 32px rgba(142,68,173,.7) !important;
            }
            .tile.tile-corrupted.curupiraV63-selected .corruption-fx { display: none !important; }
        `;
        document.head.appendChild(s);
    }

    // ─────────────────────────────────────────────────────────────
    // DIAGNÓSTICO
    // ─────────────────────────────────────────────────────────────
    window._diagCurupira = function() {
        console.group('═══ DIAGNÓSTICO CURUPIRA ═══');
        console.log('V63 carregado?', window._curupiraV63 === true);
        console.log('');
        console.log('STORY_HERO_PA existe?', typeof STORY_HERO_PA !== 'undefined');
        console.log('  tem curupira_chuva_flechas?', STORY_HERO_PA?.[PA_KEY] !== undefined);
        console.log('  execute é meu?', STORY_HERO_PA?.[PA_KEY]?.execute === _executeNovo);
        console.log('  execute (início):', STORY_HERO_PA?.[PA_KEY]?.execute?.toString().slice(0, 100));
        console.log('');
        console.log('triggerBravelyChain tem _v63Curupira?',
            window.triggerBravelyChain?._v63Curupira === true);
        console.log('triggerBravelyChain (início):',
            window.triggerBravelyChain?.toString().slice(0, 100));
        console.log('');
        console.log('Reinstalações:');
        console.log('  execute:', _contadorExec);
        console.log('  bravely:', _contadorBrav);
        console.log('');
        console.log('Estado da seleção:');
        console.log('  ativo:', st.ativo);
        console.log('  tiles:', st.tiles.length);
        console.log('  overlay:', !!document.getElementById('curupiraV63Overlay'));
        console.log('');
        console.log('Botão "Jogar Turno":', _findPlayBtn()?.textContent?.trim().substring(0, 30) || 'NÃO ENCONTRADO');
        console.log('Corrompidos:', window._corruptedTiles);
        console.groupEnd();
    };

    console.log('');
    console.log('✅ [V63] Instalado.');
    console.log('   Reinstala execute/bravely a cada 100ms.');
    console.log('   Se outro patch sobrescrever, verá:');
    console.log('   "[V63] execute REINSTALADO (Nª vez)"');
    console.log('');
    console.log('💡 Diagnóstico: window._diagCurupira()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V65 — Curupira: PA overlay não sobrepõe telas críticas
// -----------------------------------------------------------------
// Reduz z-index do overlay PA de 2147483647 → 99997
// E esconde quando qualquer overlay crítico está visível.
//
// Cole NO FINAL do historia.js.
// =================================================================
(function curupiraV65() {
    if (window._curupiraV65) return;
    window._curupiraV65 = true;

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V65] Curupira — overlay PA controlado');
    console.log('═══════════════════════════════════════════════════');

    const Z_INDEX_PA = 99997;

    const IDS_PRIORITARIOS = [
        'storyPurificationOverlay',   // mensagem de purificação (99999)
        'storySaciDialogOverlay',     // diálogo de boss (99998)
        'storySaciFinalOverlay',      // diálogo final
        'storyVictoryOverlay',        // vitória/derrota (10002)
        'stat11RollOverlay',          // roll de stat (25000)
        'matInfoModal',               // modal de material (30000)
        'battleHeroModal',            // modal de herói em batalha (21000)
        'equipScreenOverlay',         // tela de equipamentos (20000)
        'heroDetailsOverlay',         // detalhes do herói (10050)
        'gameOverlay',                // game over do evento
    ];

    const SELECTORS_PRIORITARIOS = [
        '.story-purification-overlay',
        '.story-saci-dialog-overlay',
        '.story-result-overlay',
        '.battle-hero-modal-overlay',
        '.equip-screen-overlay',
        '.hero-details-overlay',
        '.stat11-roll-overlay',
        '.mat-info-overlay',
    ];

    function _estaVisivel(el) {
        if (!el) return false;
        const cs = getComputedStyle(el);
        if (cs.display === 'none') return false;
        if (cs.visibility === 'hidden') return false;
        if (parseFloat(cs.opacity) < 0.1) return false;
        const r = el.getBoundingClientRect();
        if (r.width < 5 || r.height < 5) return false;
        return true;
    }

    function _temOverlayCritico() {
        for (const id of IDS_PRIORITARIOS) {
            if (id === 'curupiraV63Overlay') continue;
            if (_estaVisivel(document.getElementById(id))) return id;
        }
        for (const sel of SELECTORS_PRIORITARIOS) {
            const el = document.querySelector(sel);
            if (_estaVisivel(el)) return sel;
        }
        return null;
    }

    let _lastHiddenState = null;

    function _atualizarOverlayPA() {
        const overlay = document.getElementById('curupiraV63Overlay');
        if (!overlay) return;

        // Ajusta z-index só uma vez
        if (overlay.style.zIndex !== String(Z_INDEX_PA)) {
            overlay.style.zIndex = String(Z_INDEX_PA);
        }

        const critico = _temOverlayCritico();

        if (critico) {
            if (overlay.style.display !== 'none') {
                overlay.style.display = 'none';
                if (_lastHiddenState !== critico) {
                    console.log(`[V65] PA overlay escondido (${critico} visível)`);
                    _lastHiddenState = critico;
                }
            }
        } else {
            if (overlay.style.display === 'none') {
                overlay.style.display = 'flex';
                if (_lastHiddenState !== null) {
                    console.log('[V65] PA overlay restaurado');
                    _lastHiddenState = null;
                }
            }
        }
    }

    setInterval(_atualizarOverlayPA, 120);

    window._debugOverlayPA = function() {
        const overlay = document.getElementById('curupiraV63Overlay');
        console.log('═══ [V65] Overlay PA ═══');
        console.log('Existe?', !!overlay);
        if (overlay) {
            console.log('  z-index:', overlay.style.zIndex);
            console.log('  display:', overlay.style.display);
        }
        console.log('Overlay crítico ativo?', _temOverlayCritico() || 'nenhum');
        console.log('═══════════════════════');
    };

    console.log('• z-index do PA:', Z_INDEX_PA);
    console.log('• Esconde quando: purificação / diálogo / vitória /');
    console.log('  stat roll / equip / hero details / game over estiverem visíveis');
    console.log('• Debug: window._debugOverlayPA()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V68 — Curupira: PA sempre abre, purificação clicável
// -----------------------------------------------------------------
// Substitui triggerBravelyChain do V63 (marca _v63Curupira = true
// para o V63 não reinstalar).
//
// • PA SEMPRE abre (sem guard de prioridade no trigger)
// • captureHandler NÃO bloqueia cliques quando prioridade visível
// • Overlay escondido quando prioridade visível (z-index 500)
// • PA continua aberto esperando confirmação depois que a
//   purificação fechar
//
// Cole NO FINAL do historia.js (depois do V63).
// =================================================================
(function curupiraV68() {
    if (window._curupiraV68) return;
    window._curupiraV68 = true;

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V68] Curupira — PA sempre abre, purificação clicável');
    console.log('═══════════════════════════════════════════════════');

    const PA_KEY = 'curupira_chuva_flechas';
    const _sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const _corrompido = (idx) =>
        Array.isArray(window._corruptedTiles) && window._corruptedTiles.includes(idx);

    // ─────────────────────────────────────────────────────────────
    // PRIORIDADE: overlays que NÃO devem ser bloqueados
    // ─────────────────────────────────────────────────────────────
    function _temPrioridadeVisivel() {
        const ids = [
            'storyPurificationOverlay',
            'storySaciDialogOverlay',
            'storySaciFinalOverlay',
            'storyVictoryOverlay',
            'stat11RollOverlay',
            'matInfoModal',
            'battleHeroModal',
            'equipScreenOverlay',
            'heroDetailsOverlay',
            'gameOverlay',
        ];
        for (const id of ids) {
            const el = document.getElementById(id);
            if (!el) continue;
            const cs = getComputedStyle(el);
            if (cs.display === 'none') continue;
            if (cs.visibility === 'hidden') continue;
            if (parseFloat(cs.opacity) < 0.1) continue;
            const r = el.getBoundingClientRect();
            if (r.width < 5 || r.height < 5) continue;
            return id;
        }
        return null;
    }

    const st = {
        ativo: false,
        tiles: [],
        overlay: null,
        overlayTimer: null,
        resolve: null,
        captureHandler: null,
        preCapture: null,
    };

    // ─────────────────────────────────────────────────────────────
    // LOCALIZAR BOTÃO
    // ─────────────────────────────────────────────────────────────
    function _findPlayBtn() {
        const ids = ['btnPlay','btnJogarTurno','btnExecutar','btnTurno','btnConfirmTurno','btnConfirmarAcao','btnJogar','btnExecute','btnAction'];
        for (const id of ids) {
            const el = document.getElementById(id);
            if (el && el.tagName === 'BUTTON') return el;
        }
        const all = document.querySelectorAll('button');
        for (const b of all) {
            const oc = b.getAttribute('onclick') || '';
            if (oc.includes('executeAction') && !oc.includes('activateSkill')) return b;
        }
        for (const b of all) {
            const txt = (b.textContent || '').trim().toUpperCase();
            if ((txt.includes('JOGAR TURNO') || txt === 'EXECUTAR' || txt.includes('EXECUTAR AÇÃO'))
                && !b.id.startsWith('curupiraV68')) return b;
        }
        return null;
    }

    // ─────────────────────────────────────────────────────────────
    // OVERLAY
    // ─────────────────────────────────────────────────────────────
    function _atualizarContador() {
        const el = document.getElementById('curupiraV68Confirm');
        if (!el) return;
        const n = st.tiles.length;
        const corr = st.tiles.filter(t => _corrompido(t.idx)).length;
        el.textContent = corr > 0
            ? `✓ CONFIRMAR (${n}/10) · ${corr}🖤`
            : `✓ CONFIRMAR (${n}/10)`;
    }

    function _posicionarOverlay() {
        if (!st.overlay) return;
        // Esconde quando prioridade visível
        if (_temPrioridadeVisivel()) {
            st.overlay.style.visibility = 'hidden';
            st.overlay.style.pointerEvents = 'none';
            return;
        }
        st.overlay.style.visibility = 'visible';
        st.overlay.style.pointerEvents = 'auto';
        const btn = _findPlayBtn();
        if (!btn) return;
        const r = btn.getBoundingClientRect();
        if (r.width < 5 || r.height < 5) return;
        st.overlay.style.left = (r.left - 2) + 'px';
        st.overlay.style.top = (r.top - 2) + 'px';
        st.overlay.style.width = (r.width + 4) + 'px';
        st.overlay.style.height = (r.height + 4) + 'px';
    }

    function _criarOverlay() {
        if (st.overlay) return;
        const ov = document.createElement('button');
        ov.id = 'curupiraV68Overlay';
        ov.type = 'button';
        ov.style.cssText = `
            position: fixed; z-index: 500;
            display: flex; align-items: center; justify-content: center;
            padding: 0 12px; box-sizing: border-box; cursor: pointer;
            background: linear-gradient(180deg, rgba(107,163,92,.4), transparent 45%),
                        linear-gradient(135deg, #4a7040, #2a4520);
            color: #e0f0d0; border: 2px solid #6ba35c; border-radius: 6px;
            font-family: 'Cinzel', serif; font-weight: 700; font-size: 0.9rem;
            letter-spacing: 1px; text-shadow: 0 1px 2px rgba(0,0,0,0.9);
            box-shadow: 0 0 20px rgba(107,163,92,.7), 0 4px 15px rgba(0,0,0,.5);
            animation: curupiraV68Pulse 1s ease-in-out infinite alternate;
            user-select: none;
        `;
        ov.innerHTML = `<span id="curupiraV68Confirm">✓ CONFIRMAR (0/10)</span>`;
        ov.onclick = (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            ev.stopImmediatePropagation();
            _confirmar();
        };
        document.body.appendChild(ov);
        st.overlay = ov;
        _posicionarOverlay();
        st.overlayTimer = setInterval(_posicionarOverlay, 150);
        window.addEventListener('resize', _posicionarOverlay);
        window.addEventListener('scroll', _posicionarOverlay, true);
    }

    function _removerOverlay() {
        if (st.overlayTimer) { clearInterval(st.overlayTimer); st.overlayTimer = null; }
        window.removeEventListener('resize', _posicionarOverlay);
        window.removeEventListener('scroll', _posicionarOverlay, true);
        if (st.overlay) { try { st.overlay.remove(); } catch(e) {} st.overlay = null; }
    }

    // ─────────────────────────────────────────────────────────────
    // TOGGLE / CONFIRMAR
    // ─────────────────────────────────────────────────────────────
    function _toggle(el, idx) {
        if (!st.ativo) return;
        const corr = _corrompido(idx);
        if (!corr && grid[idx] === 'FOGO') {
            if (typeof showToast === 'function') showToast('🏹', 'Não pode escolher FOGO comum!', '🏹');
            return;
        }
        const pos = st.tiles.findIndex(t => t.idx === idx);
        if (pos >= 0) {
            st.tiles.splice(pos, 1);
            el.classList.remove('curupiraV68-selected');
        } else {
            if (st.tiles.length >= 10) {
                if (typeof showToast === 'function') showToast('🏹', 'Máximo de 10!', '🏹');
                return;
            }
            st.tiles.push({ idx, x: idx % 8, y: Math.floor(idx / 8) });
            el.classList.add('curupiraV68-selected');
        }
        _atualizarContador();
    }

    function _fechar() {
        st.ativo = false;
        if (st.captureHandler) {
            window.removeEventListener('click', st.captureHandler, true);
            st.captureHandler = null;
        }
        if (st.preCapture) {
            window.removeEventListener('click', st.preCapture, true);
            st.preCapture = null;
        }
        document.querySelectorAll('.curupiraV68-eligible, .curupiraV68-selected')
            .forEach(el => el.classList.remove('curupiraV68-eligible', 'curupiraV68-selected'));
        _removerOverlay();
        const resolve = st.resolve;
        st.resolve = null;
        const tiles = st.tiles.slice();
        st.tiles = [];
        if (resolve) resolve({ tiles });
    }

    function _confirmar() {
        if (!st.ativo) return;
        if (st.tiles.length === 0) {
            if (typeof showToast === 'function') showToast('🏹', 'Escolha ao menos 1 tile!', '🏹');
            return;
        }
        _fechar();
    }

    // ─────────────────────────────────────────────────────────────
    // ABRIR SELEÇÃO (sem guard de prioridade)
    // ─────────────────────────────────────────────────────────────
    function _abrirSelecao() {
        return new Promise((resolve) => {
            st.ativo = true;
            st.tiles = [];
            st.resolve = resolve;

            const elegiveis = [];
            for (let i = 0; i < 64; i++) {
                if (_corrompido(i) || grid[i] !== 'FOGO') elegiveis.push(i);
            }
            if (elegiveis.length === 0) {
                st.ativo = false;
                st.resolve = null;
                if (typeof showToast === 'function') showToast('🏹', 'Nenhum tile elegível!', '🏹');
                resolve({ tiles: [] });
                return;
            }

            const allTiles = document.querySelectorAll('#grid .tile');
            elegiveis.forEach(i => {
                if (allTiles[i]) allTiles[i].classList.add('curupiraV68-eligible');
            });

            _criarOverlay();

            // ⭐ captureHandler RESPEITA prioridade (deixa passar, NÃO cancela PA)
            st.captureHandler = (ev) => {
                if (!st.ativo) return;

                // Se prioridade visível → deixa o clique passar
                if (_temPrioridadeVisivel()) {
                    return;
                }

                if (ev.target.closest('#curupiraV68Overlay')) return;

                const tile = ev.target.closest('#grid .tile');
                if (tile) {
                    ev.stopPropagation();
                    ev.preventDefault();
                    ev.stopImmediatePropagation();
                    const tiles = Array.from(document.querySelectorAll('#grid .tile'));
                    const idx = tiles.indexOf(tile);
                    if (idx !== -1) _toggle(tile, idx);
                } else {
                    ev.stopPropagation();
                    ev.preventDefault();
                    ev.stopImmediatePropagation();
                }
            };
            window.addEventListener('click', st.captureHandler, true);

            if (st.preCapture) {
                window.removeEventListener('click', st.preCapture, true);
                st.preCapture = null;
            }

            if (typeof addLog === 'function') {
                const corr = elegiveis.filter(_corrompido).length;
                const extra = corr > 0 ? ` (${corr} corrompido${corr > 1 ? 's' : ''})` : '';
                addLog(`🏹 Curupira: escolha até 10 tiles${extra}.`);
            }
        });
    }

    // ─────────────────────────────────────────────────────────────
    // FLUXO
    // ─────────────────────────────────────────────────────────────
    async function _fluxoCurupira(active, target, totalAtk) {
        try { if (typeof playSfx === 'function') playSfx('skill1'); } catch(e) {}

        const resultado = await _abrirSelecao();
        const selecionados = resultado.tiles;
        if (selecionados.length === 0) {
            if (typeof addLog === 'function') addLog('🏹 Curupira: nenhum tile escolhido.');
            return;
        }

        const bossIdx = (target && typeof target.x === 'number') ? (target.y * 8 + target.x) : -1;
        let danoTotal = 0;
        let purificados = 0;

        for (let i = 0; i < selecionados.length; i++) {
            const t = selecionados[i];
            const eraTerra = (grid[t.idx] === 'TERRA');
            const corr = _corrompido(t.idx);

            if (corr) {
                window._corruptedTiles = (window._corruptedTiles || []).filter(x => x !== t.idx);
                purificados++;
                const board = document.getElementById('board');
                const s = (typeof getStep === 'function') ? getStep() : 59;
                if (board) {
                    const smoke = document.createElement('div');
                    smoke.className = 'corruption-smoke-fx';
                    smoke.style.left = (t.x * s + 8) + 'px';
                    smoke.style.top = (t.y * s + 8) + 'px';
                    smoke.style.width = s + 'px';
                    smoke.style.height = s + 'px';
                    board.appendChild(smoke);
                    setTimeout(() => smoke.remove(), 1500);
                }
            }

            grid[t.idx] = 'TERRA';
            const el = document.querySelectorAll('#grid .tile')[t.idx];
            if (el) el.className = 'tile bg-TERRA';

            if (typeof spawnFxAt === 'function') {
                spawnFxAt('impact', 'fx-impact', t.x, t.y, { duration: 500, scale: 0.8, delay: i * 40 });
            }

            if (target && !target.dead && t.idx === bossIdx) {
                const dmg = eraTerra ? Math.floor(totalAtk * 2) : totalAtk;
                danoTotal += dmg;
                await _sleep(200);
                if (typeof applyDmg === 'function') applyDmg(target, dmg);
                if (typeof addLog === 'function') {
                    addLog(eraTerra
                        ? `🏹 Curupira: DANO ×2 (${dmg})! Boss já estava em TERRA.`
                        : `🏹 Curupira: dano ${dmg} no boss.`);
                }
            }
            await _sleep(80);
        }

        await _sleep(400);

        if (purificados > 0) {
            if (typeof addLog === 'function') addLog(`✨ Curupira purificou ${purificados} tile(s)!`);
            try { if (typeof playSfx === 'function') playSfx('purificacao'); } catch(e) {}
        }
        if (typeof addLog === 'function') {
            addLog(`🏹 Curupira: ${selecionados.length} tiles → TERRA.${danoTotal > 0 ? ` Dano: ${danoTotal}.` : ''}`);
        }
        if (typeof updateVisuals === 'function') updateVisuals();
        if (typeof updateTitleStats === 'function') updateTitleStats('bravely_chain');
    }

    // ─────────────────────────────────────────────────────────────
    // WRAPPER (PA SEMPRE abre, sem guard de prioridade)
    // ─────────────────────────────────────────────────────────────
    function _ensureBravely() {
        const cur = window.triggerBravelyChain;
        if (typeof cur !== 'function') return;
        if (cur._v68Curupira === true) return;

        const wrapped = async function(active, target, totalAtk) {
            const heroData = (typeof STORY_HERO_CLASSES !== 'undefined' && active)
                ? STORY_HERO_CLASSES[active.class] : null;
            if (!heroData || heroData.paKey !== PA_KEY) {
                return cur.apply(this, arguments);
            }

            try {
                if (typeof path !== 'undefined' && Array.isArray(path)) {
                    path.length = 0;
                    if (typeof renderPath === 'function') renderPath();
                }
            } catch(e) {}

            if (st.preCapture) window.removeEventListener('click', st.preCapture, true);
            st.preCapture = (ev) => {
                // Não bloqueia se prioridade visível
                if (_temPrioridadeVisivel()) return;
                const tile = ev.target.closest('#grid .tile');
                if (tile) {
                    ev.stopPropagation();
                    ev.preventDefault();
                    ev.stopImmediatePropagation();
                }
            };
            window.addEventListener('click', st.preCapture, true);

            try {
                if (typeof showPoderAncestralEffect === 'function') {
                    try { showPoderAncestralEffect(); } catch(e) {}
                }
                await _sleep(300);
                await _fluxoCurupira(active, target, totalAtk);
            } finally {
                if (st.preCapture) {
                    window.removeEventListener('click', st.preCapture, true);
                    st.preCapture = null;
                }
            }
        };
        // ⭐ Marcadores: impede V63/V67 de reinstalar
        wrapped._v63Curupira = true;
        wrapped._v67Curupira = true;
        wrapped._v68Curupira = true;
        window.triggerBravelyChain = wrapped;
    }

    _ensureBravely();
    setInterval(_ensureBravely, 100);

    // ─────────────────────────────────────────────────────────────
    // CSS
    // ─────────────────────────────────────────────────────────────
    if (!document.getElementById('curupiraV68CSS')) {
        const s = document.createElement('style');
        s.id = 'curupiraV68CSS';
        s.textContent = `
            @keyframes curupiraV68Pulse {
                from { box-shadow: 0 0 15px rgba(107,163,92,.6), 0 4px 15px rgba(0,0,0,.5); }
                to   { box-shadow: 0 0 35px rgba(107,163,92,1), 0 4px 15px rgba(0,0,0,.5); }
            }
            #curupiraV68Overlay:hover { filter: brightness(1.1); }
            .curupiraV68-eligible {
                box-shadow: inset 0 0 0 2px rgba(74,140,181,.9) !important;
                cursor: pointer !important;
                animation: curupiraV68EligPulse 1s ease-in-out infinite alternate !important;
            }
            @keyframes curupiraV68EligPulse {
                from { box-shadow: inset 0 0 0 2px rgba(74,140,181,.5); }
                to   { box-shadow: inset 0 0 0 3px rgba(74,140,181,1), 0 0 12px rgba(74,140,181,.6); }
            }
            .curupiraV68-selected {
                box-shadow: inset 0 0 0 3px #e8b923, 0 0 20px rgba(232,185,35,.9) !important;
                transform: scale(1.05);
                z-index: 5;
            }
            .tile.tile-corrupted.curupiraV68-eligible { cursor: pointer !important; }
            .tile.tile-corrupted.curupiraV68-selected {
                background: linear-gradient(135deg, rgba(142,68,173,.4), rgba(39,174,96,.4)) !important;
                box-shadow: inset 0 0 0 3px #e8b923, 0 0 22px rgba(232,185,35,.9), 0 0 32px rgba(142,68,173,.7) !important;
            }
            .tile.tile-corrupted.curupiraV68-selected .corruption-fx { display: none !important; }
        `;
        document.head.appendChild(s);
    }

    // ─────────────────────────────────────────────────────────────
    // DEBUG
    // ─────────────────────────────────────────────────────────────
    window._debugCurupiraV68 = function() {
        console.log('═══ [V68] Curupira ═══');
        console.log('Prioridade visível?', _temPrioridadeVisivel() || 'nenhuma');
        console.log('PA ativo?', st.ativo);
        console.log('Tiles:', st.tiles.length);
        console.log('Overlay existe?', !!document.getElementById('curupiraV68Overlay'));
        console.log('Overlay visível?', st.overlay?.style.visibility);
        console.log('triggerBravelyChain._v68Curupira:', window.triggerBravelyChain?._v68Curupira);
        console.log('═══════════════════════');
    };

    console.log('• PA SEMPRE abre (não cancela)');
    console.log('• captureHandler respeita prioridade (deixa cliques passar)');
    console.log('• Overlay escondido quando prioridade visível (z-index 500)');
    console.log('• Debug: window._debugCurupiraV68()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V69 — Correções de passivas
// -----------------------------------------------------------------
// 1. Curupira: re-declarar passive (UI volta a mostrar)
// 2. Kanarott: rarity 2 (sem passiva)
// 3. Anhanga-Mirim: Sombra Regenerativa (+1 HP por turno)
// 4. Rudá: fix do timing (+1 HP em AR agora funciona)
//
// Cole NO FINAL do historia.js.
// =================================================================
(function passivasV69() {
    if (window._passivasV69) return;
    window._passivasV69 = true;

    // ─────────────────────────────────────────────────────────────
    // 1. Curupira: passive re-declarada (UI)
    // ─────────────────────────────────────────────────────────────
    const _regCurupira = () => {
        if (typeof STORY_HERO_CLASSES === 'undefined') return;
        const c = STORY_HERO_CLASSES['Curupira'];
        if (!c) return;
        c.rarity = 4;
        c.passive = 'curupira_adjacente';
    };
    _regCurupira();
    setTimeout(_regCurupira, 500);
    setTimeout(_regCurupira, 1500);

    // ─────────────────────────────────────────────────────────────
    // 2. Kanarott: rarity 2 (sem passiva)
    // ─────────────────────────────────────────────────────────────
    const _regKanarott = () => {
        if (typeof STORY_HERO_CLASSES === 'undefined') return;
        const k = STORY_HERO_CLASSES['Kanarott'];
        if (!k) return;
        k.rarity = 2;
        delete k.passive;
    };
    _regKanarott();
    setTimeout(_regKanarott, 500);
    setTimeout(_regKanarott, 1500);

    // ─────────────────────────────────────────────────────────────
    // 3. Anhanga-Mirim: 5⭐ + passive regen
    // ─────────────────────────────────────────────────────────────
    const _regAnhanga = () => {
        if (typeof STORY_HERO_CLASSES === 'undefined') return;
        const a = STORY_HERO_CLASSES['Anhanga-Mirim'];
        if (!a) return;
        a.rarity = 5;
        a.passive = 'anhanga_mirim_regen';
    };
    _regAnhanga();
    setTimeout(_regAnhanga, 500);
    setTimeout(_regAnhanga, 1500);

    // ─────────────────────────────────────────────────────────────
    // 4. PASSIVE_DISPLAY
    // ─────────────────────────────────────────────────────────────
    const _regDisplay = () => {
        if (typeof window.PASSIVE_DISPLAY === 'undefined') window.PASSIVE_DISPLAY = {};
        window.PASSIVE_DISPLAY['anhanga_mirim_regen'] = {
            name: 'Sombra Regenerativa',
            desc: 'Recupera 1 HP no fim de cada turno.'
        };
        window.PASSIVE_DISPLAY['curupira_adjacente'] = window.PASSIVE_DISPLAY['curupira_adjacente'] || {
            name: 'Instinto Selvagem',
            desc: '150% de dano em inimigos adjacentes.'
        };
    };
    _regDisplay();
    setTimeout(_regDisplay, 500);
    setTimeout(_regDisplay, 1500);

    // ─────────────────────────────────────────────────────────────
    // 5. executeAction hook: regen por turno (Anhanga + Rudá)
    // ─────────────────────────────────────────────────────────────
    function _installExecHook() {
        const cur = window.executeAction;
        if (typeof cur !== 'function') return;
        if (cur._v69Passivas) return;

        const inner = cur;
        window.executeAction = async function() {
            // ⭐ Snapshot do herói ANTES (fix timing Rudá)
            const heroAgora = (typeof players !== 'undefined'
                                && Array.isArray(players)
                                && currentPlayerIdx >= 0)
                ? players[currentPlayerIdx] : null;

            const result = await inner.apply(this, arguments);

            // Fora do modo história / evento: não aplica
            if (!window._storyMode && !window._eventoAtivo) return result;
            if (window._pvpMode || window._coopMode) return result;
            if (!heroAgora || heroAgora.dead) return result;

// ⭐ Anhanga-Mirim: +1 HP por turno (só até 50% do maxHp)
if (heroAgora.class === 'Anhanga-Mirim' && heroAgora.hp < heroAgora.maxHp) {
    const limiar = Math.floor(heroAgora.maxHp * 0.5);
    if (heroAgora.hp < limiar) {
        heroAgora.hp = Math.min(heroAgora.maxHp, heroAgora.hp + 1);
        if (typeof showHealEffect === 'function') {
            showHealEffect(heroAgora.x, heroAgora.y, 1);
        }
        if (typeof updateHeroCard === 'function') updateHeroCard();
        if (typeof addLog === 'function') {
            addLog(`🌑 Anhanga-Mirim: +1 HP (Sombra Regenerativa).`);
        }
    }
}
            // ⭐ Rudá: +1 HP em tile AR
            if (heroAgora.class === 'Rudá') {
                const idx = heroAgora.y * 8 + heroAgora.x;
                if (grid[idx] === 'AR' && heroAgora.hp < heroAgora.maxHp) {
                    heroAgora.hp = Math.min(heroAgora.maxHp, heroAgora.hp + 1);
                    if (typeof showHealEffect === 'function') {
                        showHealEffect(heroAgora.x, heroAgora.y, 1);
                    }
                    if (typeof updateHeroCard === 'function') updateHeroCard();
                    if (typeof addLog === 'function') {
                        addLog(`💚 Rudá: +1 HP (Toque do Amor).`);
                    }
                }
            }

            return result;
        };
        window.executeAction._v69Passivas = true;
    }

    _installExecHook();
    setInterval(_installExecHook, 500);

    // ─────────────────────────────────────────────────────────────
    // Debug
    // ─────────────────────────────────────────────────────────────
    window._debugPassivasV69 = function() {
        console.group('=== PASSIVAS V69 ===');
        ['Curupira', 'Kanarott', 'Anhanga-Mirim', 'Rudá'].forEach(h => {
            const d = STORY_HERO_CLASSES?.[h];
            const meta = d?.passive ? window.PASSIVE_DISPLAY?.[d.passive] : null;
            console.log(`${h}: rarity=${d?.rarity}, passive=${d?.passive || 'nenhuma'}`,
                meta ? `→ "${meta.name}"` : '');
        });
        console.log('executeAction._v69Passivas:', window.executeAction?._v69Passivas);
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V69] Passivas corrigidas');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Curupira: passive re-declarada (UI volta a mostrar)');
    console.log('• Kanarott: rarity 2 (sem passiva)');
    console.log('• Anhanga-Mirim: Sombra Regenerativa (+1 HP/turno)');
    console.log('• Rudá: fix do timing (+1 HP em AR agora funciona)');
    console.log('');
    console.log('💡 Debug: window._debugPassivasV69()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V70 — Semente do Vento (consumível do evento)
// -----------------------------------------------------------------
// • Item da Loja das Sombras (50 essências)
// • Máximo 1 no inventário
// • Botão no canto sup-esq do Solo Sagrado (não bloqueia o resto)
// • Ao usar: reroll ponderado do tabuleiro (preserva corrompidos)
// • Não em PvP/Coop
//
// Cole NO FINAL do historia.js.
// =================================================================
(function sementeVentoV70() {
    if (window._sementeVentoV70) return;
    window._sementeVentoV70 = true;

    // ═══════════════════════════════════════════════════════════
    // SPRITES (cole os links aqui depois — deixe vazio pra emoji)
    // ═══════════════════════════════════════════════════════════
    const SPRITE_SEMENTE = 'https://i.imgur.com/iGSbGX6.png'; // ← colar link do PNG do item aqui
    const SPRITE_BOTAO   = 'https://i.imgur.com/l3S6ixw.png'; // ← colar link do ícone do botão (24x24)
    const EMOJI_SEMENTE = '🌪️';

    const _sementeIconHTML = () => SPRITE_SEMENTE
        ? `<img src="${SPRITE_SEMENTE}" style="width:100%;height:100%;object-fit:contain;" alt="Semente">`
        : `<span style="font-size:3rem;line-height:1;">${EMOJI_SEMENTE}</span>`;

    const _sementeBotaoHTML = () => SPRITE_BOTAO
        ? `<img src="${SPRITE_BOTAO}" style="width:100%;height:100%;object-fit:contain;pointer-events:none;" alt="Semente">`
        : `<span style="pointer-events:none;">${EMOJI_SEMENTE}</span>`;

    // ═══════════════════════════════════════════════════════════
    // 1. REGISTRAR O ITEM (pra Tesouraria/Loja não quebrar)
    // ═══════════════════════════════════════════════════════════
    if (typeof STORY_MATERIALS !== 'undefined') {
        STORY_MATERIALS['semente_vento'] = {
            id: 'semente_vento',
            name: 'Semente do Vento',
            emoji: EMOJI_SEMENTE,
        };
    }
    if (typeof STORY_MATERIAL_SPRITES !== 'undefined' && !('semente_vento' in STORY_MATERIAL_SPRITES)) {
        STORY_MATERIAL_SPRITES['semente_vento'] = ''; // ← trocar por SPRITE_SEMENTE depois
    }
    if (typeof STORY_MATERIAL_PRICES !== 'undefined') {
        STORY_MATERIAL_PRICES['semente_vento'] = 0; // não vendável
    }

    // ═══════════════════════════════════════════════════════════
    // 2. HOOK EM comprarEventoItem (bloqueio de duplicata)
    // ═══════════════════════════════════════════════════════════
    const _origComprar = window.comprarEventoItem;
    if (typeof _origComprar === 'function' && !_origComprar._v70Semente) {
        window.comprarEventoItem = function(itemId, preco, tipo) {
            if (itemId === 'semente_vento') {
                if ((STORY_PROGRESS.inventory['semente_vento'] || 0) >= 1) {
                    if (typeof showToast === 'function') showToast('❌', 'Você já possui uma Semente do Vento.', '❌');
                    return;
                }
                const result = _origComprar.apply(this, arguments);
                if (typeof renderEventoShopScreen === 'function') renderEventoShopScreen();
                return result;
            }
            return _origComprar.apply(this, arguments);
        };
        window.comprarEventoItem._v70Semente = true;
    }

    // ═══════════════════════════════════════════════════════════
    // 3. INJETAR CARD NA LOJA DO EVENTO
    // ═══════════════════════════════════════════════════════════
    function _injetarCardLoja() {
        const grid = document.querySelector('.evento-shop-grid');
        if (!grid) return;
        if (grid.querySelector('[data-item="semente_vento"]')) return;

        const tem = (STORY_PROGRESS.inventory['semente_vento'] || 0) >= 1;
        const essencias = STORY_PROGRESS.inventory['essencia_sombria'] || 0;
        const podeComprar = !tem && essencias >= 50;

        const card = document.createElement('div');
        card.setAttribute('data-item', 'semente_vento');
        card.className = `evento-shop-card ${podeComprar || tem ? '' : 'disabled'}`;
        card.innerHTML = `
            <div class="evento-shop-emoji">${_sementeIconHTML()}</div>
            <div class="evento-shop-name">Semente do Vento</div>
            <div class="evento-shop-stats">🌀 Reroll</div>
            <div class="evento-shop-desc">Reorganiza o tabuleiro (preserva corrompidos). Máximo 1 por vez.</div>
            ${tem ? `<div class="evento-shop-durability">✅ Você já possui</div>` : ''}
            <div class="evento-shop-price">🌑 50</div>
            <button class="evento-shop-btn" ${podeComprar ? '' : 'disabled'}
                onclick="comprarEventoItem('semente_vento', 50, 'material')">
                ${tem ? 'JÁ POSSUI' : podeComprar ? 'COMPRAR' : 'FALTA ESSÊNCIA'}
            </button>
        `;
        grid.appendChild(card);
    }

    const _origShop = window.renderEventoShopScreen;
    if (typeof _origShop === 'function') {
        window.renderEventoShopScreen = function() {
            const r = _origShop.apply(this, arguments);
            setTimeout(_injetarCardLoja, 50);
            setTimeout(_injetarCardLoja, 300);
            return r;
        };
    }

    // ═══════════════════════════════════════════════════════════
    // 4. BOTÃO NA BATALHA
    // ═══════════════════════════════════════════════════════════
    let _sementeBtn = null;
    let _sementeTimer = null;

    function _getSkillBtn() {
        return document.getElementById('btnSkill');
    }

    function _temPAativo() {
        return !!document.getElementById('curupiraV68Overlay');
    }

    function _atualizarBotaoSemente() {
        // Só solo/evento (nunca PvP/Coop)
        if (!window._storyMode && !window._eventoAtivo) { _removerBotao(); return; }
        if (window._pvpMode || window._coopMode) { _removerBotao(); return; }

        // Só se tiver o item
        const tem = (STORY_PROGRESS.inventory['semente_vento'] || 0) >= 1;
        if (!tem) { _removerBotao(); return; }

        // Se PA do Curupira estiver selecionando, esconde
        if (_temPAativo()) {
            if (_sementeBtn) _sementeBtn.style.display = 'none';
            return;
        }

        const skillBtn = _getSkillBtn();
        if (!skillBtn) { _removerBotao(); return; }

        // Skill button visível?
        const cs = getComputedStyle(skillBtn);
        if (cs.display === 'none' || cs.visibility === 'hidden') {
            if (_sementeBtn) _sementeBtn.style.display = 'none';
            return;
        }

        if (!_sementeBtn) _criarBotao();

        // Posiciona no canto superior esquerdo do Solo Sagrado
        const rect = skillBtn.getBoundingClientRect();
        if (rect.width < 5 || rect.height < 5) {
            _sementeBtn.style.display = 'none';
            return;
        }
        _sementeBtn.style.display = 'flex';
        _sementeBtn.style.left = (rect.left + 3) + 'px';
        _sementeBtn.style.top = (rect.top + 3) + 'px';
    }

    function _criarBotao() {
        if (_sementeBtn) return;
        const btn = document.createElement('button');
        btn.id = 'sementeVentoBtn';
        btn.type = 'button';
        btn.title = 'Semente do Vento — reorganizar o tabuleiro (não afeta corrompidos)';
        btn.style.cssText = `
            position: fixed;
            z-index: 400;
            width: 24px;
            height: 24px;
            padding: 0;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: radial-gradient(circle, #8a6a2e, #4a3418);
            border: 1.5px solid #e8b923;
            border-radius: 50%;
            color: #fff5dc;
            font-size: 14px;
            line-height: 1;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.6), 0 0 10px rgba(232,185,35,0.5);
            transition: transform 0.15s;
            user-select: none;
            -webkit-user-select: none;
            box-sizing: border-box;
            overflow: hidden;
        `;
        btn.innerHTML = _sementeBotaoHTML();
        btn.onclick = (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            ev.stopImmediatePropagation();
            _usarSemente();
        };
        btn.onmouseenter = () => { btn.style.transform = 'scale(1.15)'; };
        btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; };
        document.body.appendChild(btn);
        _sementeBtn = btn;
        _sementeTimer = setInterval(_atualizarBotaoSemente, 300);
    }

    function _removerBotao() {
        if (_sementeTimer) { clearInterval(_sementeTimer); _sementeTimer = null; }
        if (_sementeBtn) { try { _sementeBtn.remove(); } catch(e) {} _sementeBtn = null; }
    }

    // ═══════════════════════════════════════════════════════════
    // 5. USO DA SEMENTE
    // ═══════════════════════════════════════════════════════════
    function _usarSemente() {
        if ((STORY_PROGRESS.inventory['semente_vento'] || 0) < 1) {
            if (typeof showToast === 'function') showToast('❌', 'Você não tem Semente do Vento.', '❌');
            return;
        }
        if (!confirm('🌪️ Usar Semente do Vento?\n\nO tabuleiro inteiro será reorganizado.\nTiles corrompidos são preservados.\n\nContinuar?')) return;

        STORY_PROGRESS.inventory['semente_vento'] -= 1;
        if (STORY_PROGRESS.inventory['semente_vento'] <= 0) {
            delete STORY_PROGRESS.inventory['semente_vento'];
        }
        if (typeof saveStoryProgress === 'function') saveStoryProgress();

        _removerBotao();
        _executarReroll();

        try { if (typeof playSfx === 'function') playSfx('purificacao'); } catch(e) {}
    }

    // ═══════════════════════════════════════════════════════════
    // 6. REROLL PONDERADO (preserva corrompidos)
    // ═══════════════════════════════════════════════════════════
    function _executarReroll() {
        const corrompidos = new Set(Array.isArray(window._corruptedTiles) ? window._corruptedTiles : []);
        const elegiveis = [];
        for (let i = 0; i < 64; i++) if (!corrompidos.has(i)) elegiveis.push(i);

        const N = elegiveis.length;
        if (N === 0) {
            if (typeof showToast === 'function') showToast('⚠️', 'Todos os tiles estão corrompidos!', '⚠️');
            return;
        }

        const elementos = ['FOGO', 'AGUA', 'TERRA', 'AR'];
        const pool = [];

        // Mínimo garantido (anti-monotonia + anti-combo-quebrado)
        if (N >= 8) {
            elementos.forEach(el => { pool.push(el); pool.push(el); }); // 8 fixos
            for (let i = 8; i < N; i++) pool.push(elementos[Math.floor(Math.random() * 4)]);
        } else if (N >= 4) {
            elementos.forEach(el => pool.push(el)); // 4 fixos
            for (let i = 4; i < N; i++) pool.push(elementos[Math.floor(Math.random() * 4)]);
        } else {
            for (let i = 0; i < N; i++) pool.push(elementos[Math.floor(Math.random() * 4)]);
        }

        // Fisher-Yates
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        // Aplica cascata
        elegiveis.forEach((idx, i) => {
            const novoEl = pool[i];
            const x = idx % 8, y = Math.floor(idx / 8);
            setTimeout(() => {
                if (typeof spawnTileFlip === 'function') spawnTileFlip(x, y);
                grid[idx] = novoEl;
                const el = document.querySelectorAll('#grid .tile')[idx];
                if (el) el.className = `tile bg-${novoEl}`;
            }, i * 30);
        });

        if (typeof addLog === 'function') {
            addLog(`🌪️ Semente do Vento: tabuleiro reorganizado (${N} tiles, ${corrompidos.size} corrompidos preservados).`);
        }

        const duracao = elegiveis.length * 30;
        setTimeout(() => {
            if (typeof showToast === 'function') showToast('🌪️', 'Tabuleiro reorganizado!', '🌪️');
            if (typeof updateVisuals === 'function') updateVisuals();
        }, duracao + 200);
    }

    // ═══════════════════════════════════════════════════════════
    // 7. LOOPS DE ATUALIZAÇÃO
    // ═══════════════════════════════════════════════════════════
    setTimeout(_atualizarBotaoSemente, 500);
    setTimeout(_atualizarBotaoSemente, 1500);
    setTimeout(_atualizarBotaoSemente, 3000);
    setInterval(_atualizarBotaoSemente, 500);

    // Reposiciona em resize/scroll
    window.addEventListener('resize', _atualizarBotaoSemente);
    window.addEventListener('scroll', _atualizarBotaoSemente, true);

    // ═══════════════════════════════════════════════════════════
    // 8. DEBUG
    // ═══════════════════════════════════════════════════════════
    window._debugSementeVento = function() {
        console.group('=== SEMENTE DO VENTO ===');
        console.log('No inventário:', STORY_PROGRESS.inventory['semente_vento'] || 0);
        console.log('Botão existe no DOM?', !!document.getElementById('sementeVentoBtn'));
        console.log('Botão visível?', _sementeBtn?.style.display || '(não existe)');
        console.log('PA do Curupira ativo?', _temPAativo());
        console.log('Corrompidos:', (window._corruptedTiles || []).length);
        const skill = _getSkillBtn();
        if (skill) {
            const r = skill.getBoundingClientRect();
            console.log('Solo Sagrado rect:', { left: r.left, top: r.top, w: r.width, h: r.height });
        }
        console.groupEnd();
    };

    window._forcarSemente = function() {
        STORY_PROGRESS.inventory['semente_vento'] = 1;
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        _atualizarBotaoSemente();
        console.log('✅ Semente forçada no inventário');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V70] Semente do Vento');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Item na Loja das Sombras: 50 🌑');
    console.log('• Máximo 1 por vez');
    console.log('• Botão no canto sup-esq do Solo Sagrado');
    console.log('• Reroll ponderado (≥2 de cada elemento se ≥8 tiles)');
    console.log('• Corrompidos preservados');
    console.log('• Esconde durante seleção do PA do Curupira');
    console.log('');
    console.log('💡 Debug: window._debugSementeVento()');
    console.log('💡 Forçar item: window._forcarSemente()');
    console.log('');
    console.log('📸 SPRITES PRA COLAR DEPOIS:');
    console.log('   1. Card da Loja:');
    console.log('      STORY_MATERIAL_SPRITES["semente_vento"] = "URL"');
    console.log('   2. Ícone do botão na batalha:');
    console.log('      Edite o topo do V70: const SPRITE_BOTAO = "URL"');
    console.log('      (botão tem 24×24px — use PNG transparente)');
    console.log('   3. Card do item na Loja (grande):');
    console.log('      Edite o topo do V70: const SPRITE_SEMENTE = "URL"');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V71 — Dano Elemental (cumulativo)
// -----------------------------------------------------------------
// Ciclo: FOGO > TERRA > AR > AGUA > FOGO
//
// Bônus aplicados (cumulativos):
//   +1 arma do meu elemento
//   -1 arma que é forte contra mim
//   +1 inimigo fraco contra mim (eu > ele)
//   -1 inimigo forte contra mim (ele > eu)
//   -1 tile que é forte contra mim
//   (+1 tile do meu elemento já existe no V8.1)
//
// Mínimo 1 dano. Toggle: window._toggleDanoElemental()
// Só solo/história/evento (não PvP/Coop).
//
// Cole NO FINAL do historia.js.
// =================================================================
(function danoElementalV71() {
    if (window._danoElementalV71) return;
    window._danoElementalV71 = true;

    // ═══════════════════════════════════════════════════════════
    // CICLO
    // ═══════════════════════════════════════════════════════════
    const CICLO = {
        FOGO:  { forte: 'TERRA', fraco: 'AGUA' },
        TERRA: { forte: 'AR',    fraco: 'FOGO' },
        AR:    { forte: 'AGUA',  fraco: 'TERRA' },
        AGUA:  { forte: 'FOGO',  fraco: 'AR' },
    };

    // Narrativa temática (mostrada no tooltip)
    const TEMATICO = {
        'FOGO>TERRA':  'Fogo queima a terra',
        'TERRA>AR':    'Montanha bloqueia o vento',
        'AR>AGUA':     'Vento seca a água',
        'AGUA>FOGO':   'Rio apaga o fogo',
    };

    window._elementalBonusEnabled = true;

    // ═══════════════════════════════════════════════════════════
    // CÁLCULO
    // ═══════════════════════════════════════════════════════════
    function _calcBonus(heroi, arma, tile, alvo) {
        const b = { arma: 0, tile: 0, inimigo: 0, total: 0 };
        if (!CICLO[heroi]) return b;

        // Arma
        if (arma === heroi)                          b.arma = +1;
        else if (arma && CICLO[arma]?.forte === heroi) b.arma = -1;

        // Tile (o +1 do tile=meu elemento já existe no V8.1)
        if (tile && CICLO[tile]?.forte === heroi) b.tile = -1;

        // Inimigo
        if (alvo && CICLO[heroi]?.forte === alvo)      b.inimigo = +1;
        else if (alvo && CICLO[alvo]?.forte === heroi) b.inimigo = -1;

        b.total = b.arma + b.tile + b.inimigo;
        return b;
    }

    function _getContexto() {
        if (typeof players === 'undefined' || !Array.isArray(players)) return null;
        const active = players[currentPlayerIdx];
        if (!active || !active.element) return null;

        const heroi = active.element;

        // Tile
        let tile = null;
        if (typeof path !== 'undefined' && Array.isArray(path) && path.length > 0) {
            tile = grid[path[0]];
        } else if (typeof active.x === 'number') {
            tile = grid[active.y * 8 + active.x];
        }

        // Arma
        let arma = null;
        if (typeof getHeroEquipment === 'function' && typeof getWeaponById === 'function') {
            const eq = getHeroEquipment(active.class);
            if (eq?.arma) {
                const w = getWeaponById(eq.arma);
                arma = w?.elemento || null;
            }
        }

        // Alvo (boss)
        let alvo = null;
        if (typeof boss !== 'undefined' && boss && !boss.dead) {
            alvo = boss.elemento || boss.element || null;
            if (!alvo && typeof STORY_ENEMIES !== 'undefined') {
                const enemyId = Array.isArray(storyEnemiesRemaining) && storyEnemiesRemaining[0];
                if (enemyId) {
                    const e = STORY_ENEMIES[enemyId];
                    alvo = e?.elemento || e?.element || null;
                }
            }
        }

        return { active, heroi, arma, tile, alvo };
    }

    // ═══════════════════════════════════════════════════════════
    // APLICAÇÃO (hook em applyDmg, só quando boss recebe dano)
    // ═══════════════════════════════════════════════════════════
    const _applyDmgOrig = window.applyDmg;
    if (typeof _applyDmgOrig === 'function' && !_applyDmgOrig._v71Elem) {
        window.applyDmg = function(target, amount) {
            if (!window._elementalBonusEnabled) return _applyDmgOrig.apply(this, arguments);
            if (!window._storyMode && !window._eventoAtivo) return _applyDmgOrig.apply(this, arguments);
            if (window._pvpMode || window._coopMode) return _applyDmgOrig.apply(this, arguments);

            // Só boss recebendo dano
            if (typeof boss !== 'undefined' && target === boss && !target.dead) {
                const ctx = _getContexto();
                if (ctx) {
                    const b = _calcBonus(ctx.heroi, ctx.arma, ctx.tile, ctx.alvo);
                    if (b.total !== 0) {
                        const novoAmount = Math.max(1, amount + b.total);
                        if (typeof addLog === 'function') {
                            const partes = [];
                            if (b.arma)    partes.push(`arma${b.arma > 0 ? '+' : ''}${b.arma}`);
                            if (b.tile)    partes.push(`tile${b.tile > 0 ? '+' : ''}${b.tile}`);
                            if (b.inimigo) partes.push(`fraqueza${b.inimigo > 0 ? '+' : ''}${b.inimigo}`);
                            addLog(`⚗️ Elemental: ${amount} ${b.total > 0 ? '+' : ''}${b.total} = ${novoAmount} (${partes.join(', ')})`);
                        }
                        console.log(`[V71] Dano elemental: ${amount} → ${novoAmount}`, b);
                        return _applyDmgOrig.call(this, target, novoAmount);
                    }
                }
            }
            return _applyDmgOrig.apply(this, arguments);
        };
        window.applyDmg._v71Elem = true;
        console.log('[V71] Hook em applyDmg instalado.');
    }

    // ═══════════════════════════════════════════════════════════
    // DEBUG / TOGGLE
    // ═══════════════════════════════════════════════════════════
    window._debugDanoElemental = function() {
        console.group('=== DANO ELEMENTAL ===');
        console.log('Habilitado:', window._elementalBonusEnabled);
        console.log('Ciclo:', CICLO);
        console.log('Narrativa:', TEMATICO);
        const ctx = _getContexto();
        if (ctx) {
            console.log('Herói:', ctx.active.class, '→', ctx.heroi);
            console.log('Arma:', ctx.arma);
            console.log('Tile:', ctx.tile);
            console.log('Alvo:', ctx.alvo);
            const b = _calcBonus(ctx.heroi, ctx.arma, ctx.tile, ctx.alvo);
            console.log('Bônus:', b);
        } else {
            console.log('(sem contexto — herói não encontrado)');
        }
        console.groupEnd();
    };

    window._toggleDanoElemental = function() {
        window._elementalBonusEnabled = !window._elementalBonusEnabled;
        console.log('Dano elemental:', window._elementalBonusEnabled ? 'ON' : 'OFF');
        if (typeof showToast === 'function') {
            showToast(
                window._elementalBonusEnabled ? '⚗️' : '🚫',
                'Dano elemental ' + (window._elementalBonusEnabled ? 'ativado' : 'desativado'),
                window._elementalBonusEnabled ? '⚗️' : '🚫'
            );
        }
    };

    // ═══════════════════════════════════════════════════════════
    // CSS
    // ═══════════════════════════════════════════════════════════
    if (!document.getElementById('v71ElemCSS')) {
        const s = document.createElement('style');
        s.id = 'v71ElemCSS';
        s.textContent = `
            .story-preview-bar-v3 .preview-chip.elemental {
                font-weight: 700;
                padding: 3px 8px;
                border-radius: 12px;
                background: rgba(10, 6, 2, 0.5);
                border: 1px solid currentColor;
                font-size: 0.72rem;
                letter-spacing: 1px;
            }
        `;
        document.head.appendChild(s);
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V71] Dano Elemental');
    console.log('═══════════════════════════════════════════════════');
    console.log('Ciclo: FOGO > TERRA > AR > AGUA > FOGO');
    console.log('');
    console.log('  +1  arma do meu elemento');
    console.log('  -1  arma que é forte contra mim');
    console.log('  +1  inimigo fraco contra mim');
    console.log('  -1  inimigo forte contra mim');
    console.log('  -1  tile que é forte contra mim');
    console.log('  (+1 tile do meu elemento já existe no V8.1)');
    console.log('');
    console.log('Mínimo 1 dano. Não aplica em PvP/Coop.');
    console.log('');
    console.log('💡 Debug:  window._debugDanoElemental()');
    console.log('💡 Toggle: window._toggleDanoElemental()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V71.1 — Fix visual do chip elemental (sem piscar)
// -----------------------------------------------------------------
// Substitui o setInterval do V71 por um que SÓ ATUALIZA o chip
// existente (nunca remove/recria) → sem reflow, sem subir/descer.
//
// Cole NO FINAL do historia.js (depois do V71).
// =================================================================
(function fixChipElementalV71_1() {
    if (window._fixChipElementalV71_1) return;
    window._fixChipElementalV71_1 = true;

    // Espera o V71 carregar
    setTimeout(() => {
        if (typeof window._calcBonus !== 'function' && !window._danoElementalV71) {
            console.warn('[V71.1] V71 não encontrado. Cole o V71 primeiro.');
            return;
        }

        // ─────────────────────────────────────────────────────
        // Cria o chip UMA VEZ (se não existe)
        // ─────────────────────────────────────────────────────
        function _garantirChip() {
            const bar = document.getElementById('storyPreviewBarV3');
            if (!bar) return null;
            const chipDano = bar.querySelector('.preview-chip.dano');
            if (!chipDano) return null;

            let chip = bar.querySelector('.preview-chip.elemental');
            if (!chip) {
                chip = document.createElement('span');
                chip.className = 'preview-chip elemental';
                chip.style.cssText = `
                    display: none;
                    font-weight: 700;
                    padding: 3px 8px;
                    border-radius: 12px;
                    background: rgba(10, 6, 2, 0.5);
                    border: 1px solid currentColor;
                    font-size: 0.72rem;
                    letter-spacing: 1px;
                `;
                chipDano.after(chip);
            }
            return chip;
        }

        // ─────────────────────────────────────────────────────
        // Atualiza o chip (só texto, sem remove/recreate)
        // ─────────────────────────────────────────────────────
        let _ultimoTotal = null;
        let _ultimoDano = null;

        function _atualizarChip() {
            if (!window._elementalBonusEnabled) {
                const chip = document.querySelector('.preview-chip.elemental');
                if (chip) chip.style.display = 'none';
                return;
            }
            if (!window._storyMode && !window._eventoAtivo) return;
            if (window._pvpMode || window._coopMode) return;

            const bar = document.getElementById('storyPreviewBarV3');
            if (!bar) return;
            const chipDano = bar.querySelector('.preview-chip.dano');
            if (!chipDano) return;

            const ctx = (typeof window._getContextoV71 === 'function')
                ? window._getContextoV71()
                : null;
            if (!ctx) {
                const chip = bar.querySelector('.preview-chip.elemental');
                if (chip) chip.style.display = 'none';
                return;
            }

            const b = window._calcBonusV71(ctx.heroi, ctx.arma, ctx.tile, ctx.alvo);
            const chip = _garantirChip();
            if (!chip) return;

            // Se total = 0, esconde (sem remover do DOM)
            if (b.total === 0) {
                if (chip.style.display !== 'none') chip.style.display = 'none';
                return;
            }

            // Evita reflow se nada mudou
            if (_ultimoTotal === b.total && _ultimoDano === chipDano.textContent) return;
            _ultimoTotal = b.total;
            _ultimoDano = chipDano.textContent;

            // Atualiza o dano (sem recriar elemento)
            const match = chipDano.textContent.match(/~?(\d+)/);
            if (match) {
                // Precisamos saber o dano base original.
                // Vamos ler direto do DOM apenas o número e re-calcular.
                // O V71 já colocou o dano ajustado no chip — mas se o
                // V71 rodou 1ª vez, pode ter sobrescrito o valor base.
                // Solução: sempre mostrar o valor atual + delta caso o
                // valor base seja diferente do atual.
                // Como V71 roda a cada 410ms e já ajusta, aqui só
                // atualizamos o chip informativo.
            }

            chip.textContent = `${b.total > 0 ? '+' : ''}${b.total} elem`;
            chip.style.color = b.total > 0 ? '#8ac070' : '#d05050';
            chip.style.borderColor = b.total > 0 ? '#6ba35c' : '#a83232';
            chip.style.display = '';
            chip.title = `Arma ${b.arma > 0 ? '+' : ''}${b.arma} · Tile ${b.tile > 0 ? '+' : ''}${b.tile} · Fraqueza ${b.inimigo > 0 ? '+' : ''}${b.inimigo}`;
        }

        // ─────────────────────────────────────────────────────
        // Expor calc/getContexto do V71 (senão V71.1 não acessa)
        // ─────────────────────────────────────────────────────
        // O V71 os tem em escopo fechado. Vou reinstalar essa
        // parte do cálculo no V71.1 mesmo, pra garantir.
        const CICLO = {
            FOGO:  { forte: 'TERRA', fraco: 'AGUA' },
            TERRA: { forte: 'AR',    fraco: 'FOGO' },
            AR:    { forte: 'AGUA',  fraco: 'TERRA' },
            AGUA:  { forte: 'FOGO',  fraco: 'AR' },
        };

        window._calcBonusV71 = function(heroi, arma, tile, alvo) {
            const b = { arma: 0, tile: 0, inimigo: 0, total: 0 };
            if (!CICLO[heroi]) return b;
            if (arma === heroi)                           b.arma = +1;
            else if (arma && CICLO[arma]?.forte === heroi) b.arma = -1;
            if (tile && CICLO[tile]?.forte === heroi)     b.tile = -1;
            if (alvo && CICLO[heroi]?.forte === alvo)     b.inimigo = +1;
            else if (alvo && CICLO[alvo]?.forte === heroi) b.inimigo = -1;
            b.total = b.arma + b.tile + b.inimigo;
            return b;
        };

        window._getContextoV71 = function() {
            if (typeof players === 'undefined' || !Array.isArray(players)) return null;
            const active = players[currentPlayerIdx];
            if (!active || !active.element) return null;
            const heroi = active.element;
            let tile = null;
            if (typeof path !== 'undefined' && Array.isArray(path) && path.length > 0) {
                tile = grid[path[0]];
            } else if (typeof active.x === 'number') {
                tile = grid[active.y * 8 + active.x];
            }
            let arma = null;
            if (typeof getHeroEquipment === 'function' && typeof getWeaponById === 'function') {
                const eq = getHeroEquipment(active.class);
                if (eq?.arma) {
                    const w = getWeaponById(eq.arma);
                    arma = w?.elemento || null;
                }
            }
            let alvo = null;
            if (typeof boss !== 'undefined' && boss && !boss.dead) {
                alvo = boss.elemento || boss.element || null;
                if (!alvo && typeof STORY_ENEMIES !== 'undefined') {
                    const enemyId = Array.isArray(storyEnemiesRemaining) && storyEnemiesRemaining[0];
                    if (enemyId) {
                        const e = STORY_ENEMIES[enemyId];
                        alvo = e?.elemento || e?.element || null;
                    }
                }
            }
            return { active, heroi, arma, tile, alvo };
        };

        // ─────────────────────────────────────────────────────
        // Loop de atualização (só o chip, sem reflow)
        // ─────────────────────────────────────────────────────
        setInterval(_atualizarChip, 250);

        console.log('✅ [V71.1] Chip elemental sem flicker instalado.');
    }, 500);

    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V71.1] Fix visual do chip elemental');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Chip nunca é removido (só escondido com display:none)');
    console.log('• Sem reflow → botão não sobe/desce');
    console.log('• Debug: window._debugChipElemental()');
    console.log('═══════════════════════════════════════════════════');

    // Debug extra
    setTimeout(() => {
        window._debugChipElemental = function() {
            const chip = document.querySelector('.preview-chip.elemental');
            const ctx = window._getContextoV71?.();
            console.group('=== CHIP ELEMENTAL ===');
            console.log('Chip existe?', !!chip);
            if (chip) {
                console.log('  display:', chip.style.display || '(padrão)');
                console.log('  texto:', chip.textContent);
            }
            console.log('Contexto:', ctx);
            if (ctx) {
                const b = window._calcBonusV71(ctx.heroi, ctx.arma, ctx.tile, ctx.alvo);
                console.log('Bônus:', b);
            }
            console.groupEnd();
        };
    }, 1000);
})();
// =================================================================
// historia.js — V71.2 — Chip elemental estável (sem flicker)
// -----------------------------------------------------------------
// Problema: V71 original remove/recreate o chip a cada 410ms.
// Solução: CSS esconde chips do V71/V71.1 (que têm .elemental),
// e o V71.2 cria o seu com classe .v712-own (que ninguém toca).
//
// Cole NO FINAL do historia.js (depois do V71.1).
// =================================================================
(function fixChipV712() {
    if (window._fixChipV712) return;
    window._fixChipV712 = true;

    // ─────────────────────────────────────────────────────────
    // CSS: esconde chips do V71/V71.1, estiliza o do V71.2
    // ─────────────────────────────────────────────────────────
    if (!document.getElementById('v712ChipCSS')) {
        const s = document.createElement('style');
        s.id = 'v712ChipCSS';
        s.textContent = `
            /* Esconde os chips que o V71 original remove/recria */
            .story-preview-bar-v3 .preview-chip.elemental {
                display: none !important;
            }
            /* Chip do V71.2 (nunca é removido) */
            .story-preview-bar-v3 .preview-chip.v712-own {
                display: inline-block !important;
                font-family: 'Cinzel', serif;
                font-weight: 700;
                padding: 3px 8px;
                border-radius: 12px;
                background: rgba(10, 6, 2, 0.5);
                border: 1px solid currentColor;
                font-size: 0.72rem;
                letter-spacing: 1px;
                line-height: 1.3;
            }
        `;
        document.head.appendChild(s);
    }

    // ─────────────────────────────────────────────────────────
    // Ciclo + cálculo (réplica do V71)
    // ─────────────────────────────────────────────────────────
    const CICLO = {
        FOGO:  { forte: 'TERRA', fraco: 'AGUA' },
        TERRA: { forte: 'AR',    fraco: 'FOGO' },
        AR:    { forte: 'AGUA',  fraco: 'TERRA' },
        AGUA:  { forte: 'FOGO',  fraco: 'AR' },
    };

    function _calcBonus(heroi, arma, tile, alvo) {
        const b = { arma: 0, tile: 0, inimigo: 0, total: 0 };
        if (!CICLO[heroi]) return b;
        if (arma === heroi)                            b.arma = +1;
        else if (arma && CICLO[arma]?.forte === heroi) b.arma = -1;
        if (tile && CICLO[tile]?.forte === heroi)      b.tile = -1;
        if (alvo && CICLO[heroi]?.forte === alvo)      b.inimigo = +1;
        else if (alvo && CICLO[alvo]?.forte === heroi) b.inimigo = -1;
        b.total = b.arma + b.tile + b.inimigo;
        return b;
    }

    function _getContexto() {
        if (typeof players === 'undefined' || !Array.isArray(players)) return null;
        const active = players[currentPlayerIdx];
        if (!active || !active.element) return null;
        const heroi = active.element;

        let tile = null;
        if (typeof path !== 'undefined' && Array.isArray(path) && path.length > 0) {
            tile = grid[path[0]];
        } else if (typeof active.x === 'number') {
            tile = grid[active.y * 8 + active.x];
        }

        let arma = null;
        if (typeof getHeroEquipment === 'function' && typeof getWeaponById === 'function') {
            const eq = getHeroEquipment(active.class);
            if (eq?.arma) {
                const w = getWeaponById(eq.arma);
                arma = w?.elemento || null;
            }
        }

        let alvo = null;
        if (typeof boss !== 'undefined' && boss && !boss.dead) {
            alvo = boss.elemento || boss.element || null;
            if (!alvo && typeof STORY_ENEMIES !== 'undefined') {
                const enemyId = Array.isArray(storyEnemiesRemaining) && storyEnemiesRemaining[0];
                if (enemyId) {
                    const e = STORY_ENEMIES[enemyId];
                    alvo = e?.elemento || e?.element || null;
                }
            }
        }

        return { active, heroi, arma, tile, alvo };
    }

    // ─────────────────────────────────────────────────────────
    // Chip (NUNCA removido, só escondido)
    // ─────────────────────────────────────────────────────────
    let _chip = null;

    function _atualizar() {
        // Guards
        if (!window._elementalBonusEnabled
            || (!window._storyMode && !window._eventoAtivo)
            || window._pvpMode || window._coopMode) {
            if (_chip) _chip.style.display = 'none';
            return;
        }

        const bar = document.getElementById('storyPreviewBarV3');
        if (!bar) { _chip = null; return; }
        const chipDano = bar.querySelector('.preview-chip.dano');
        if (!chipDano) { _chip = null; return; }

        // Se o chip saiu do DOM (V8.1 re-renderizou o bar), recria
        if (_chip && !bar.contains(_chip)) _chip = null;

        if (!_chip) {
            _chip = document.createElement('span');
            _chip.className = 'preview-chip v712-own';
            _chip.style.display = 'none';
            chipDano.after(_chip);
        }

        const ctx = _getContexto();
        if (!ctx) { _chip.style.display = 'none'; return; }

        const b = _calcBonus(ctx.heroi, ctx.arma, ctx.tile, ctx.alvo);
        if (b.total === 0) {
            if (_chip.style.display !== 'none') _chip.style.display = 'none';
            return;
        }

        _chip.textContent = `${b.total > 0 ? '+' : ''}${b.total} elem`;
        _chip.style.color = b.total > 0 ? '#8ac070' : '#d05050';
        _chip.style.borderColor = b.total > 0 ? '#6ba35c' : '#a83232';
        _chip.style.display = 'inline-block';
        _chip.title = `Arma ${b.arma > 0 ? '+' : ''}${b.arma} · Tile ${b.tile > 0 ? '+' : ''}${b.tile} · Fraqueza ${b.inimigo > 0 ? '+' : ''}${b.inimigo}`;
    }

    // Loop principal (200ms — mais rápido que V71, o chip fica sempre fresco)
    setInterval(_atualizar, 200);

    // MutationObserver: recria chip imediatamente se removido
    setTimeout(() => {
        const bar = document.getElementById('storyPreviewBarV3');
        if (!bar) return;
        const observer = new MutationObserver(() => {
            if (_chip && !bar.contains(_chip)) _chip = null;
            _atualizar();
        });
        observer.observe(bar, { childList: true });
    }, 500);

    // ─────────────────────────────────────────────────────────
    // Debug
    // ─────────────────────────────────────────────────────────
    window._debugChipV712 = function() {
        console.group('=== CHIP V71.2 ===');
        console.log('Chip no DOM?', !!_chip && !!document.body.contains(_chip));
        if (_chip) {
            console.log('  display:', _chip.style.display);
            console.log('  texto:', _chip.textContent);
            console.log('  cor:', _chip.style.color);
        }
        const ctx = _getContexto();
        if (ctx) {
            const b = _calcBonus(ctx.heroi, ctx.arma, ctx.tile, ctx.alvo);
            console.log('Bônus calculado:', b);
        } else {
            console.log('(sem contexto)');
        }
        // Quantos chips elementais existem no DOM?
        const todos = document.querySelectorAll('.preview-chip.elemental, .preview-chip.v712-own');
        console.log('Total de chips elementais no DOM:', todos.length);
        todos.forEach((c, i) => {
            console.log(`  [${i}]`, c.className, '→ display:', getComputedStyle(c).display);
        });
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V71.2] Chip elemental estável');
    console.log('═══════════════════════════════════════════════════');
    console.log('• CSS esconde chips do V71/V71.1 (.elemental)');
    console.log('• V71.2 cria próprio chip (.v712-own) — nunca removido');
    console.log('• MutationObserver recria se o V8.1 re-renderizar');
    console.log('• Sem piscar (só atualiza conteúdo, sem reflow)');
    console.log('');
    console.log('💡 Debug: window._debugChipV712()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V72 — Elemento por Ato
// -----------------------------------------------------------------
// Cada ato tem um elemento temático. Todos os inimigos do ato
// herdam esse elemento. O V71 (dano elemental) usa isso pra
// calcular bônus/penalidade.
//
// • Seta STORY_ENEMIES[enemyId].elemento (não toca em .element)
// • Propaga pro boss em initStoryBattle e advanceStoryEnemy
// • Ato 13 = null (Anhangá, sem bônus elemental)
// • Só solo/história (PvP/Coop não passam por initStoryBattle)
//
// Cole NO FINAL do historia.js (depois do V71.2).
// =================================================================
(function elementoPorAtoV72() {
    if (window._elementoPorAtoV72) return;
    window._elementoPorAtoV72 = true;

    // ═══════════════════════════════════════════════════════════
    // MAPA ATO → ELEMENTO
    // ═══════════════════════════════════════════════════════════
    const ATO_ELEMENTO = {
        1:  'AR',    // Saci (redemoinho)
        2:  'TERRA', // Mapinguari (mata fechada)
        3:  'AGUA',  // Iara (rio)
        4:  'FOGO',  // Boitatá (fogo)
        5:  'FOGO',  // Mula (fogo da maldição)
        6:  'TERRA', // Corpo Seco (sertão)
        7:  'AR',    // Lobisomem (lua)
        8:  'AGUA',  // Cuca (poções)
        9:  'AGUA',  // Boto (rio)
        10: 'TERRA', // Boi (pasto)
        11: 'AR',    // Jaci (lua)
        12: 'FOGO',  // Guaraci (sol)
        13: null,    // Anhangá (variável — sem bônus)
    };

    // ═══════════════════════════════════════════════════════════
    // 1. APLICAR NOS INIMIGOS
    // ═══════════════════════════════════════════════════════════
    let _aplicados = 0;
    if (typeof STORY_CHAPTERS !== 'undefined' && typeof STORY_ENEMIES !== 'undefined') {
        Object.keys(STORY_CHAPTERS).forEach(cidStr => {
            const cid = parseInt(cidStr);
            const elem = ATO_ELEMENTO[cid];
            if (elem === undefined) return;

            const chapter = STORY_CHAPTERS[cid];
            chapter.phases.forEach(phase => {
                if (!Array.isArray(phase.enemies)) return;
                phase.enemies.forEach(enemyId => {
                    const enemy = STORY_ENEMIES[enemyId];
                    if (!enemy) return;

                    // ⚠️ Só seta se ainda não foi setado por este patch
                    if (enemy._v72Elem === true) return;

                    // ⚠️ Não sobrescreve `element` (inglês) — só `elemento`
                    enemy.elemento = elem;
                    enemy._v72Elem = true;
                    _aplicados++;
                });
            });
        });
        console.log(`[V72] Elemento por ato: ${_aplicados} inimigos mapeados`);
    } else {
        console.warn('[V72] STORY_CHAPTERS ou STORY_ENEMIES indisponíveis');
    }

    // ═══════════════════════════════════════════════════════════
    // 2. PROPAGAR PRO BOSS EM RUNTIME
    // ═══════════════════════════════════════════════════════════
    function _aplicarNoBoss() {
        if (typeof boss === 'undefined' || !boss) return;
        const enemyId = (typeof storyEnemiesRemaining !== 'undefined'
                         && Array.isArray(storyEnemiesRemaining)
                         && storyEnemiesRemaining.length > 0)
            ? storyEnemiesRemaining[0]
            : null;
        if (!enemyId) return;

        const enemy = (typeof STORY_ENEMIES !== 'undefined') ? STORY_ENEMIES[enemyId] : null;
        if (!enemy) return;

        // Só seta se mudou (evita writes redundantes)
        if (boss.elemento !== enemy.elemento) {
            boss.elemento = enemy.elemento;
            console.log(`[V72] boss.elemento = ${enemy.elemento || 'null'} (${enemyId})`);
        }
    }

    // initStoryBattle
    const _origInit = window.initStoryBattle;
    if (typeof _origInit === 'function' && !_origInit._v72Elem) {
        window.initStoryBattle = async function() {
            const r = await _origInit.apply(this, arguments);
            _aplicarNoBoss();
            return r;
        };
        window.initStoryBattle._v72Elem = true;
    } else {
        // Se não existia, instala um observer de segurança
        setTimeout(() => {
            if (typeof window.initStoryBattle === 'function' && !window.initStoryBattle._v72Elem) {
                const _i = window.initStoryBattle;
                window.initStoryBattle = async function() {
                    const r = await _i.apply(this, arguments);
                    _aplicarNoBoss();
                    return r;
                };
                window.initStoryBattle._v72Elem = true;
            }
        }, 500);
    }

    // advanceStoryEnemy
    const _origAdv = window.advanceStoryEnemy;
    if (typeof _origAdv === 'function' && !_origAdv._v72Elem) {
        window.advanceStoryEnemy = async function() {
            const r = await _origAdv.apply(this, arguments);
            _aplicarNoBoss();
            return r;
        };
        window.advanceStoryEnemy._v72Elem = true;
    }

    // Safety net: se o boss mudou mas o elemento ficou null, aplica
    setInterval(() => {
        if (!window._storyMode && !window._eventoAtivo) return;
        if (typeof boss === 'undefined' || !boss) return;
        if (!Array.isArray(storyEnemiesRemaining) || storyEnemiesRemaining.length === 0) return;
        const enemyId = storyEnemiesRemaining[0];
        const enemy = STORY_ENEMIES[enemyId];
        if (enemy && boss.elemento !== enemy.elemento) {
            boss.elemento = enemy.elemento;
        }
    }, 1500);

    // ═══════════════════════════════════════════════════════════
    // 3. DEBUG
    // ═══════════════════════════════════════════════════════════
    window._debugElementoPorAto = function() {
        console.group('=== ELEMENTO POR ATO (V72) ===');
        console.log('Ato → Elemento:', ATO_ELEMENTO);
        console.log('');
        Object.keys(STORY_CHAPTERS).forEach(cidStr => {
            const cid = parseInt(cidStr);
            const ch = STORY_CHAPTERS[cidStr];
            const inimigos = new Set();
            ch.phases.forEach(p => p.enemies.forEach(e => inimigos.add(e)));
            console.log(`Ato ${cid} (${ch.name}):`);
            inimigos.forEach(id => {
                const e = STORY_ENEMIES[id];
                console.log(`  ${id} → ${e?.elemento === null ? 'null (variável)' : e?.elemento || '(não setado)'}`);
            });
        });
        console.log('');
        console.log('Boss atual:', boss ? {
            type: boss.type,
            elemento: boss.elemento,
            enemyId: storyEnemiesRemaining?.[0],
        } : '(sem boss)');
        console.groupEnd();
    };

    // ═══════════════════════════════════════════════════════════
    // LOG
    // ═══════════════════════════════════════════════════════════
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V72] Elemento por Ato');
    console.log('═══════════════════════════════════════════════════');
    console.log('Ato 1 AR · Ato 2 TERRA · Ato 3 AGUA · Ato 4 FOGO');
    console.log('Ato 5 FOGO · Ato 6 TERRA · Ato 7 AR · Ato 8 AGUA');
    console.log('Ato 9 AGUA · Ato 10 TERRA · Ato 11 AR · Ato 12 FOGO');
    console.log('Ato 13 null (variável — sem bônus elemental)');
    console.log('');
    console.log('• Não sobrescreve boss.element (só boss.elemento)');
    console.log('• Só solo/história');
    console.log('• Safety net de 1.5s corrige se algum wrapper antigo');
    console.log('  limpar boss.elemento');
    console.log('');
    console.log('💡 Debug: window._debugElementoPorAto()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V73 — Flecha do arqueiro (animação caprichada)
// -----------------------------------------------------------------
// Substitui window.spawnArrowProjectile. Não depende do entidades.js.
//
// O que a animação faz:
//   1. Flecha SVG vetorial (ponta, haste, penas) — não usa sprite
//   2. Voo em arco parabólico (não linha reta) — satisfatório
//   3. Rotação da flecha acompanhando o arco
//   4. Trail de energia elemental (cor do elemento do herói)
//   5. Explosão de impacto: flash + anel + 12 partículas radiais
//   6. Shake leve no tabuleiro (classe CSS, não style inline)
//   7. ~450ms total (300 voo + 150 impacto) — não arrasta
//
// Fallback:
//   • Sem _storyMode/_eventoAtivo → delega pro original
//   • PvP/Coop → delega (sincronização própria)
//   • Sem board ou sem active/target → delega
//
// Cole NO FINAL do historia.js.
// =================================================================
(function flechaArqueiroV73() {
    if (window._flechaArqueiroV73) return;
    window._flechaArqueiroV73 = true;

    const _orig = window.spawnArrowProjectile;

    // ═══════════════════════════════════════════════════════════
    // PALETA POR ELEMENTO
    // ═══════════════════════════════════════════════════════════
    const CORES = {
        FOGO:  { principal: '#e74c3c', brilho: '#ffb088', secundaria: '#a83232' },
        AGUA:  { principal: '#3498db', brilho: '#a8d8f0', secundaria: '#1e5a80' },
        TERRA: { principal: '#27ae60', brilho: '#8ad8a0', secundaria: '#155a30' },
        AR:    { principal: '#f1c40f', brilho: '#fff0a0', secundaria: '#a08000' },
    };

    // ═══════════════════════════════════════════════════════════
    // SVG DA FLECHA
    // ═══════════════════════════════════════════════════════════
    function _svgFlecha(cor) {
        return `<svg viewBox="0 0 48 14" xmlns="http://www.w3.org/2000/svg"
                    style="width:100%;height:100%;display:block;
                           filter:drop-shadow(0 0 4px ${cor.brilho})
                                  drop-shadow(0 0 8px ${cor.principal}80);">
            <!-- haste (madeira escura) -->
            <rect x="10" y="6.2" width="30" height="1.6" fill="${cor.secundaria}" rx="0.8"/>
            <!-- haste interna (brilho) -->
            <rect x="10" y="6.6" width="30" height="0.8" fill="${cor.principal}" opacity="0.7"/>
            <!-- ponta (brilho) -->
            <polygon points="48,7 38,2.5 38,11.5" fill="${cor.brilho}"/>
            <polygon points="44,7 40,5 40,9" fill="${cor.principal}"/>
            <!-- penas -->
            <polygon points="10,7 2,2 5,7 2,12" fill="${cor.principal}" opacity="0.95"/>
            <polygon points="12,7 7,4 9,7 7,10" fill="${cor.brilho}" opacity="0.85"/>
            <!-- brilho central (energia) -->
            <circle cx="24" cy="7" r="1.8" fill="${cor.brilho}"/>
            <circle cx="24" cy="7" r="3" fill="${cor.principal}" opacity="0.35"/>
        </svg>`;
    }

    // ═══════════════════════════════════════════════════════════
    // CRIAÇÃO DE ELEMENTOS
    // ═══════════════════════════════════════════════════════════
    function _criarFlecha(cor, angulo, step, active) {
        const w = Math.max(28, Math.min(48, step * 0.7));
        const weapon = window._createStoryWeaponVisual?.(active, 'Arqueiro');
        const h = weapon ? w * 0.55 : w * 0.29;
        const el = document.createElement('div');
        el.style.cssText = `
            position: absolute;
            width: ${w}px;
            height: ${h}px;
            pointer-events: none;
            z-index: 70;
            transform-origin: center center;
            transform: rotate(${angulo}deg);
            will-change: left, top, transform;
        `;
        if (weapon) {
            weapon.classList.add('flechaV79-sprite');
            weapon.style.width = '100%';
            weapon.style.height = '100%';
            weapon.style.objectFit = 'contain';
            weapon.style.display = 'block';
            el.appendChild(weapon);

            const energia = document.createElement('span');
            energia.className = 'flechaV79-energia';
            energia.style.setProperty('--flecha-brilho', cor.brilho);
            energia.style.setProperty('--flecha-cor', cor.principal);
            el.appendChild(energia);
        } else {
            el.innerHTML = _svgFlecha(cor);
        }
        return el;
    }

    function _criarParticulaTrail(board, cx, cy, cor) {
        const size = 4 + Math.random() * 4;
        const p = document.createElement('div');
        p.style.cssText = `
            position: absolute;
            left: ${cx}px;
            top: ${cy}px;
            width: ${size}px;
            height: ${size}px;
            margin-left: -${size/2}px;
            margin-top: -${size/2}px;
            background: radial-gradient(circle, #ffffff, ${cor.brilho} 40%, ${cor.principal} 70%, transparent 100%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 68;
            box-shadow: 0 0 6px ${cor.principal};
            opacity: 0.9;
            transition: transform 0.4s ease-out, opacity 0.4s ease-out;
        `;
        board.appendChild(p);
        requestAnimationFrame(() => {
            p.style.transform = `translate(${(Math.random()-0.5)*14}px, ${(Math.random()-0.5)*14}px) scale(0.2)`;
            p.style.opacity = '0';
        });
        setTimeout(() => { if (p.parentNode) p.remove(); }, 450);
    }

    function _explosaoImpacto(board, cx, cy, cor) {
        // Flash central
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: absolute;
            left: ${cx}px; top: ${cy}px;
            width: 14px; height: 14px;
            margin-left: -7px; margin-top: -7px;
            background: radial-gradient(circle, #ffffff 0%, ${cor.brilho} 30%, ${cor.principal} 65%, transparent 100%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 76;
            animation: flechaV73Flash 0.5s ease-out forwards;
        `;
        board.appendChild(flash);
        setTimeout(() => { if (flash.parentNode) flash.remove(); }, 520);

        // Anel expandindo
        const ring = document.createElement('div');
        ring.style.cssText = `
            position: absolute;
            left: ${cx}px; top: ${cy}px;
            width: 8px; height: 8px;
            margin-left: -4px; margin-top: -4px;
            border: 2.5px solid ${cor.brilho};
            border-radius: 50%;
            pointer-events: none;
            z-index: 75;
            box-shadow: 0 0 18px ${cor.principal}, inset 0 0 8px ${cor.principal};
            animation: flechaV73Ring 0.6s cubic-bezier(0.25,0.8,0.3,1) forwards;
        `;
        board.appendChild(ring);
        setTimeout(() => { if (ring.parentNode) ring.remove(); }, 620);

        // 12 partículas radiais
        const N = 12;
        for (let i = 0; i < N; i++) {
            const angle = (i / N) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
            const dist = 30 + Math.random() * 25;
            const size = 3 + Math.random() * 4;
            const dx = Math.cos(angle) * dist;
            const dy = Math.sin(angle) * dist;
            const p = document.createElement('div');
            p.style.cssText = `
                position: absolute;
                left: ${cx}px; top: ${cy}px;
                width: ${size}px; height: ${size}px;
                margin-left: -${size/2}px; margin-top: -${size/2}px;
                background: radial-gradient(circle, #ffffff 0%, ${cor.brilho} 40%, ${cor.principal} 80%, transparent 100%);
                border-radius: 50%;
                pointer-events: none;
                z-index: 75;
                box-shadow: 0 0 8px ${cor.principal};
                transition: transform 0.55s cubic-bezier(0.25,0.8,0.3,1), opacity 0.55s ease-out;
            `;
            board.appendChild(p);
            requestAnimationFrame(() => {
                p.style.transform = `translate(${dx}px, ${dy}px) scale(0.15)`;
                p.style.opacity = '0';
            });
            setTimeout(() => { if (p.parentNode) p.remove(); }, 650);
        }
    }

    function _getElemento(active) {
        if (active?.element) return active.element;
        const heroClass = active?.class;
        if (!heroClass) return 'FOGO';
        if (typeof STORY_HERO_CLASSES !== 'undefined' && STORY_HERO_CLASSES[heroClass]?.element) {
            return STORY_HERO_CLASSES[heroClass].element;
        }
        if (typeof getHeroStoryElement === 'function') {
            try { return getHeroStoryElement(heroClass); } catch(e) {}
        }
        if (typeof getSaveElement === 'function') {
            try { return getSaveElement(); } catch(e) {}
        }
        return 'FOGO';
    }

    // ═══════════════════════════════════════════════════════════
    // FUNÇÃO PRINCIPAL
    // ═══════════════════════════════════════════════════════════
    window.spawnArrowProjectile = async function(active, target) {
        // Fora do história/evento → original
        if (!window._storyMode && !window._eventoAtivo) {
            if (typeof _orig === 'function') return _orig.apply(this, arguments);
            return Promise.resolve();
        }
        // PvP/Coop → original (sincronização própria)
        if (window._pvpMode || window._coopMode) {
            if (typeof _orig === 'function') return _orig.apply(this, arguments);
            return Promise.resolve();
        }
        // Sem dados → original
        if (!active || !target ||
            typeof active.x !== 'number' || typeof target.x !== 'number') {
            if (typeof _orig === 'function') return _orig.apply(this, arguments);
            return Promise.resolve();
        }

        const board = document.getElementById('board');
        if (!board) {
            if (typeof _orig === 'function') return _orig.apply(this, arguments);
            return Promise.resolve();
        }

        // ─── Elemento + cor ───
        const elem = _getElemento(active);
        const cor = CORES[elem] || CORES.FOGO;

        // ─── Posições (px dentro do board) ───
        const step = (typeof getStep === 'function') ? getStep() : 59;
        const pad = 8;
        const startX = active.x * step + pad + step / 2;
        const startY = active.y * step + pad + step / 2;
        const endX = target.x * step + pad + step / 2;
        const endY = target.y * step + pad + step / 2;

        // ─── Arco (ponto de controle da Bézier) ───
        const dx = endX - startX;
        const dy = endY - startY;
        const dist = Math.max(1, Math.sqrt(dx*dx + dy*dy));
        const perpX = -dy / dist;
        const perpY = dx / dist;
        const arco = Math.min(50, Math.max(20, dist * 0.35)); // arco perceptível
        const midX = (startX + endX) / 2 + perpX * arco;
        const midY = (startY + endY) / 2 + perpY * arco;

        // ─── Ângulo inicial ───
        const angInicial = Math.atan2(midY - startY, midX - startX) * (180 / Math.PI);

        // ─── Cria flecha ───
        const flecha = _criarFlecha(cor, angInicial, step, active);
        flecha.style.left = startX + 'px';
        flecha.style.top = startY + 'px';
        flecha.style.marginLeft = `-${parseFloat(flecha.style.width || 40) / 2}px`;
        flecha.style.marginTop = `-${parseFloat(flecha.style.height || 12) / 2}px`;
        board.appendChild(flecha);

        // ─── Animação via rAF (bezier quadrática) ───
        const duracao = 300;
        const startTime = performance.now();
        let ultimoTrail = -999;

        await new Promise((resolve) => {
            const animar = (now) => {
                const elapsed = now - startTime;
                const t = Math.min(1, elapsed / duracao);
                const it = 1 - t;

                // Bézier: P(t) = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2
                const px = it*it*startX + 2*it*t*midX + t*t*endX;
                const py = it*it*startY + 2*it*t*midY + t*t*endY;

                // Tangente (derivada) → ângulo
                const tx = 2*it*(midX - startX) + 2*t*(endX - midX);
                const ty = 2*it*(midY - startY) + 2*t*(endY - midY);
                const ang = Math.atan2(ty, tx) * (180 / Math.PI);

                flecha.style.left = px + 'px';
                flecha.style.top = py + 'px';
                flecha.style.transform = `rotate(${ang}deg)`;

                // Trail (a cada ~28ms)
                if (elapsed - ultimoTrail > 28) {
                    ultimoTrail = elapsed;
                    _criarParticulaTrail(board, px, py, cor);
                }

                if (t < 1) {
                    requestAnimationFrame(animar);
                } else {
                    if (flecha.parentNode) flecha.remove();
                    _explosaoImpacto(board, endX, endY, cor);
                    // Shake leve via classe CSS (não inline)
                    board.classList.add('flechaV73-shake');
                    setTimeout(() => board.classList.remove('flechaV73-shake'), 300);
                    // Espera impacto terminar
                    setTimeout(resolve, 150);
                }
            };
            requestAnimationFrame(animar);
        });
    };

    // ═══════════════════════════════════════════════════════════
    // CSS (keyframes da explosão + shake)
    // ═══════════════════════════════════════════════════════════
    if (!document.getElementById('flechaV73CSS')) {
        const s = document.createElement('style');
        s.id = 'flechaV73CSS';
        s.textContent = `
            @keyframes flechaV73Flash {
                0%   { transform: scale(0.2); opacity: 0; }
                30%  { transform: scale(1.4); opacity: 1; }
                60%  { transform: scale(1.1); opacity: 0.9; }
                100% { transform: scale(1.8); opacity: 0; }
            }
            @keyframes flechaV73Ring {
                0%   { transform: scale(0.3); opacity: 0; }
                20%  { transform: scale(1);   opacity: 1; }
                100% { transform: scale(6);   opacity: 0; }
            }
            @keyframes flechaV73ShakeKf {
                0%, 100% { transform: translateX(0); }
                20%      { transform: translateX(-2px); }
                40%      { transform: translateX(2px); }
                60%      { transform: translateX(-1.5px); }
                80%      { transform: translateX(1.5px); }
            }
            #board.flechaV73-shake {
                animation: flechaV73ShakeKf 0.25s ease-in-out;
            }
        `;
        document.head.appendChild(s);
    }

    // ═══════════════════════════════════════════════════════════
    // DEBUG
    // ═══════════════════════════════════════════════════════════
    window._debugFlechaV73 = function() {
        console.group('=== FLECHA V73 ===');
        console.log('Instalada?', window.spawnArrowProjectile?._v73 === true || 'verificando...');
        console.log('Original do entidades.js existia?', typeof _orig === 'function');
        console.log('Modo história:', window._storyMode);
        console.log('Modo evento:', window._eventoAtivo);
        console.log('PvP:', window._pvpMode, '| Coop:', window._coopMode);
        console.groupEnd();
    };
    window.spawnArrowProjectile._v73 = true;

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V73] Flecha do arqueiro (animação completa)');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Flecha SVG vetorial com brilho elemental');
    console.log('• Voo em arco parabólico (bezier quadrática)');
    console.log('• Rotação acompanhando a tangente do arco');
    console.log('• Trail de partículas durante o voo');
    console.log('• Impacto: flash + anel expandindo + 12 partículas radiais');
    console.log('• Shake leve no tabuleiro');
    console.log('• ~450ms total (300 voo + 150 impacto)');
    console.log('');
    console.log('Cores:');
    console.log('  FOGO  vermelho/laranja');
    console.log('  AGUA  azul');
    console.log('  TERRA verde');
    console.log('  AR    amarelo');
    console.log('');
    console.log('💡 Debug: window._debugFlechaV73()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V74 — Reduzir tempo do aviso "BOSS ESTÁ ENFURECIDO"
// -----------------------------------------------------------------
// O aviso do V10.53 dura 4s. Este patch reduz pra 1.8s (padrão).
// Ajuste DURACAO_MS abaixo pra mudar.
//
// Cole NO FINAL do historia.js.
// =================================================================
(function fixTempoWarningV74() {
    if (window._fixTempoWarningV74) return;
    window._fixTempoWarningV74 = true;

    // ═══════════════════════════════════════════════════════════
    // ⭐ AJUSTE AQUI (em milissegundos)
    // ═══════════════════════════════════════════════════════════
    const DURACAO_MS = 1800;
    // Sugestões:
    //   1200 → rápido
    //   1500 → ágil
    //   1800 → padrão (recomendado)
    //   2500 → mais calmo

    // ═══════════════════════════════════════════════════════════
    // Override da animação (CSS !important + keyframe novo)
    // ═══════════════════════════════════════════════════════════
    if (!document.getElementById('v74WarningCSS')) {
        const s = document.createElement('style');
        s.id = 'v74WarningCSS';
        s.textContent = `
            #corruptionWarning {
                animation: fadeInOutV74 ${DURACAO_MS}ms ease forwards !important;
            }
            @keyframes fadeInOutV74 {
                0%   { opacity: 0; transform: translate(-50%, -30%) scale(0.9); }
                10%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                85%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -70%) scale(0.9); }
            }
        `;
        document.head.appendChild(s);
    }

    // ═══════════════════════════════════════════════════════════
    // MutationObserver: remove antecipadamente
    // ═══════════════════════════════════════════════════════════
    const obs = new MutationObserver((mutations) => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.id === 'corruptionWarning') {
                    setTimeout(() => {
                        if (node.parentNode) node.remove();
                    }, DURACAO_MS);
                }
            }
        }
    });
    obs.observe(document.body, { childList: true });

    // ═══════════════════════════════════════════════════════════
    // Debug
    // ═══════════════════════════════════════════════════════════
    window._debugWarningV74 = function() {
        console.log('═══ [V74] Warning enfurecido ═══');
        console.log('Duração configurada:', DURACAO_MS, 'ms');
        console.log('Warning no DOM agora?', !!document.getElementById('corruptionWarning'));
        console.log('CSS ativo?', !!document.getElementById('v74WarningCSS'));
    };

    // Teste manual (só funciona no modo história)
    window._testWarningV74 = function() {
        if (!window._storyMode && !window._eventoAtivo) {
            console.warn('[V74] Teste só funciona no modo história/evento');
            return;
        }
        const w = document.createElement('div');
        w.id = 'corruptionWarning';
        w.innerHTML = `
            <div style="font-family:'Cinzel Decorative', serif; color:#c39bd3; font-size:1.5rem; text-shadow: 0 0 15px #8e44ad;">O BOSS ESTÁ ENFURECIDO!</div>
            <div style="font-family:'EB Garamond', serif; color:#d9c89a; font-size:1rem; font-style:italic; margin-top:5px;">O tabuleiro foi corrompido. Use o Solo Sagrado (✨) nos tiles negros para limpá-los.</div>
        `;
        w.style.cssText = `
            position: absolute; top: 20%; left: 50%; transform: translate(-50%, -50%);
            background: linear-gradient(180deg, rgba(40,15,50,0.95), rgba(20,5,20,0.95));
            border: 2px solid #8e44ad; border-radius: 8px; padding: 15px 30px;
            text-align: center; z-index: 1000; box-shadow: 0 10px 30px rgba(0,0,0,0.8);
            pointer-events: none;
        `;
        document.body.appendChild(w);
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V74] Aviso "BOSS ESTÁ ENFURECIDO" reduzido');
    console.log('═══════════════════════════════════════════════════');
    console.log(`• Duração: 4000ms → ${DURACAO_MS}ms`);
    console.log('• Pra mudar: edite DURACAO_MS no topo do V74');
    console.log('');
    console.log('💡 Debug: window._debugWarningV74()');
    console.log('💡 Teste: window._testWarningV74()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V75 — FX leve nos PAs (tile único, mobile-friendly)
// -----------------------------------------------------------------
// Bug: triggerElementalFX faz coluna/linha INTEIRA. Chamado uma vez
// por tile afetado → 240 elementos no Anhanga-Mirim (cruz 15 tiles).
//
// Fix: substitui triggerBravelyChain para heróis novos (exceto
// Curupira) por versão com 1 pulso leve por tile (spawnElementPulse).
// Redução: 240 → 15 elementos. ~16× mais leve.
//
// Aplica em: Kanarott, Teperesik, Eru, Anduré, Mãe da Mata,
//            Pajé Anhanguera, Juruá, Araci, Bicho Folharal,
//            Tapyra, Anhanga-Mirim, Matinta, Naiá, Kuatí,
//            Caboclo, Tupinambá, Mbaraká, Mãe-do-Ouro,
//            Pajé-Açu, Negrinho, Rudá
//
// NÃO afeta: Tupã, Sumé, Caipora (base), Curupira (V68 próprio)
//
// Cole NO FINAL do historia.js.
// =================================================================
(function fxLevePAV75() {
    if (window._fxLevePAV75) return;
    window._fxLevePAV75 = true;

    const _sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // ═══════════════════════════════════════════════════════════
    // CÁLCULO DE TILES (mesma lógica do V9.0-B1)
    // ═══════════════════════════════════════════════════════════
    function getPATiles(active, paKey, targetSnapshot) {
        const tiles = [];
        const cx = active.x, cy = active.y;
        const hasTarget = targetSnapshot
            && typeof targetSnapshot.x === 'number'
            && typeof targetSnapshot.y === 'number';

        if (paKey === 'kanarott_cruz_empurra') {
            for (let i = -2; i <= 2; i++) {
                const ny = cy + i;
                if (ny >= 0 && ny < 8) tiles.push(ny * 8 + cx);
            }
            for (let i = -2; i <= 2; i++) {
                if (i === 0) continue;
                const nx = cx + i;
                if (nx >= 0 && nx < 8) tiles.push(cy * 8 + nx);
            }
        }
        else if (paKey === 'teperesik_area2x2') {
            for (let dx = -1; dx <= 1; dx++)
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                }
        }
        else if (paKey === 'eru_linha_horizontal' || paKey === 'araci_linha_horizontal' || paKey === 'pajeacu_linha') {
            for (let x = 0; x < 8; x++) tiles.push(cy * 8 + x);
        }
        else if (paKey === 'andure_area2x2_cura') {
            for (let dx = -1; dx <= 1; dx++)
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                }
        }
        else if (paKey === 'maedamata_area3x3_cura') {
            for (let dx = -2; dx <= 2; dx++)
                for (let dy = -2; dy <= 2; dy++) {
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                }
        }
        else if (paKey === 'paje_coluna_fogo') {
            for (let y = 0; y < 8; y++) tiles.push(y * 8 + cx);
        }
        else if (paKey === 'jurua_area_alvo_3x3') {
            if (hasTarget) {
                for (let dx = -1; dx <= 1; dx++)
                    for (let dy = -1; dy <= 1; dy++) {
                        const nx = targetSnapshot.x + dx, ny = targetSnapshot.y + dy;
                        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                    }
            }
        }
        else if (paKey === 'bicho_cruz_completa' || paKey === 'anhanga_mirim_raio') {
            if (hasTarget) {
                for (let x = 0; x < 8; x++) tiles.push(targetSnapshot.y * 8 + x);
                for (let y = 0; y < 8; y++) {
                    if (y !== targetSnapshot.y) tiles.push(y * 8 + targetSnapshot.x);
                }
            }
        }
        else if (paKey === 'tapyra_coluna_alvo') {
            if (hasTarget) for (let y = 0; y < 8; y++) tiles.push(y * 8 + targetSnapshot.x);
        }
        else if (paKey === 'matinta_rajada') {
            for (let x = 0; x < 8; x++) tiles.push(cy * 8 + x);
        }
        else if (paKey === 'maedouro_caminho') {
            if (hasTarget) {
                const stepX = Math.sign(targetSnapshot.x - cx);
                for (let x = cx; x !== targetSnapshot.x + stepX; x += (stepX || 1)) {
                    const nx = Math.max(0, Math.min(7, x));
                    if (!tiles.includes(cy * 8 + nx)) tiles.push(cy * 8 + nx);
                    if (stepX === 0) break;
                }
                const stepY = Math.sign(targetSnapshot.y - cy);
                for (let y = cy; y !== targetSnapshot.y + stepY; y += (stepY || 1)) {
                    const ny = Math.max(0, Math.min(7, y));
                    if (!tiles.includes(ny * 8 + targetSnapshot.x)) tiles.push(ny * 8 + targetSnapshot.x);
                    if (stepY === 0) break;
                }
                if (!tiles.includes(targetSnapshot.y * 8 + targetSnapshot.x)) {
                    tiles.push(targetSnapshot.y * 8 + targetSnapshot.x);
                }
            }
        }

        return tiles;
    }

    window.getStoryPATiles = getPATiles;

    // ═══════════════════════════════════════════════════════════
    // FX LEVE — 1 pulso por tile (sem linha/coluna inteira)
    // ═══════════════════════════════════════════════════════════
    function _fxLeveTile(x, y, element, delay) {
        setTimeout(() => {
            if (typeof spawnElementPulse === 'function') {
                spawnElementPulse(x, y, element);
            } else if (typeof spawnFxAt === 'function') {
                spawnFxAt('element_pulse', 'fx-element-pulse', x, y, { duration: 500, scale: 0.8 });
            }
        }, delay);
    }

    // ═══════════════════════════════════════════════════════════
    // WRAPPER triggerBravelyChain
    // ═══════════════════════════════════════════════════════════
    const _orig = window.triggerBravelyChain;
    if (typeof _orig !== 'function') {
        console.warn('[V75] triggerBravelyChain não encontrado. Abortando.');
        return;
    }
    if (_orig._v75) return;

    const wrapped = async function(active, target, totalAtk) {
        // ─── Guardas ───
        if (!window._storyMode && !window._eventoAtivo) {
            return _orig.apply(this, arguments);
        }
        if (window._pvpMode || window._coopMode) {
            return _orig.apply(this, arguments);
        }

        const heroData = (typeof STORY_HERO_CLASSES !== 'undefined' && active)
            ? STORY_HERO_CLASSES[active.class] : null;
        if (!heroData || !heroData.paKey || heroData.paKey.startsWith('base_')) {
            return _orig.apply(this, arguments);
        }

        // Curupira tem fluxo próprio (V68) — delega
        if (heroData.paKey === 'curupira_chuva_flechas') {
            return _orig.apply(this, arguments);
        }

        // ─── Heróis novos: fluxo com FX leve ───
        const paKey = heroData.paKey;
        const element = active.element || 'FOGO';

        const targetSnapshot = target
            ? { x: target.x, y: target.y, dead: target.dead, id: target.id }
            : null;

        // 1. Overlay "PODER ANCESTRAL"
        if (typeof showPoderAncestralEffect === 'function') {
            try { showPoderAncestralEffect(); } catch(e) {}
        }
        await _sleep(300);

        // 2. Som
        try { if (typeof playSfx === 'function') playSfx('skill1'); } catch(e) {}

        // 3. Calcula tiles afetados
        const paTiles = getPATiles(active, paKey, targetSnapshot);

        // 4. ⭐ FX LEVE (1 pulso por tile, sem linha/coluna inteira)
        paTiles.forEach((idx, i) => {
            const tx = idx % 8, ty = Math.floor(idx / 8);
            _fxLeveTile(tx, ty, element, i * 40);
        });

        await _sleep(400);

        // 5. Dano no alvo (se ainda vivo)
        if (target && !target.dead) {
            const targetIdx = target.y * 8 + target.x;
            if (paTiles.includes(targetIdx)) {
                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            }
        }

        // 6. Efeitos extras do PA (cura, empurrão, etc.)
        const paFn = STORY_HERO_PA[paKey];
        if (paFn && typeof paFn.execute === 'function') {
            try { await paFn.execute(active, target, totalAtk); }
            catch (e) { console.warn('[V75] Erro no paFn:', e); }
        }

        // 7. Troca tiles (sem FX redundante — só conversão)
        paTiles.forEach(idx => {
            if (typeof grid !== 'undefined') grid[idx] = element;
            const tile = document.querySelectorAll('#grid .tile')[idx];
            if (tile) tile.className = `tile bg-${element}`;
            if (element === 'TERRA' && typeof updateTitleStats === 'function') updateTitleStats('earth_tile');
            else if (element === 'AR' && typeof updateTitleStats === 'function') updateTitleStats('air_tile');
        });

        if (typeof updateTitleStats === 'function') updateTitleStats('bravely_chain');
    };

    // ⭐ Marcadores para os outros setInterval não reinstalarem por cima
    wrapped._v75 = true;
    wrapped._v63Curupira = true;
    wrapped._v67Curupira = true;
    wrapped._v68Curupira = true;

    window.triggerBravelyChain = wrapped;

    // ═══════════════════════════════════════════════════════════
    // DEBUG
    // ═══════════════════════════════════════════════════════════
    window._debugFXleveV75 = function() {
        console.group('=== FX LEVE V75 ===');
        console.log('V75 ativo?', window._fxLevePAV75 === true);
        console.log('triggerBravelyChain._v75:', window.triggerBravelyChain?._v75 === true);
        console.log('triggerBravelyChain._v68Curupira:', window.triggerBravelyChain?._v68Curupira === true);
        console.log('spawnElementPulse existe?', typeof spawnElementPulse === 'function');
        console.groupEnd();
    };

    // Teste manual: roda o FX leve em N tiles aleatórios
    window._testFXleveV75 = function(quantidade) {
        quantidade = quantidade || 15;
        const elementos = ['FOGO', 'AGUA', 'TERRA', 'AR'];
        for (let i = 0; i < quantidade; i++) {
            const idx = Math.floor(Math.random() * 64);
            const x = idx % 8, y = Math.floor(idx / 8);
            const el = elementos[Math.floor(Math.random() * 4)];
            _fxLeveTile(x, y, el, i * 40);
        }
        console.log(`[V75] Teste: ${quantidade} pulsos leves disparados`);
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V75] FX leve nos PAs (mobile-friendly)');
    console.log('═══════════════════════════════════════════════════');
    console.log('• 1 pulso leve por tile (não mais linha/coluna inteira)');
    console.log('• Anhanga-Mirim: 240 → 15 elementos (~16× mais leve)');
    console.log('• Aplica em todos os heróis novos');
    console.log('• NÃO afeta: base (Tupã/Sumé/Caipora) nem Curupira (V68)');
    console.log('• Não afeta PvP/Coop');
    console.log('');
    console.log('💡 Debug: window._debugFXleveV75()');
    console.log('💡 Teste: window._testFXleveV75(15)');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V77 — Anhangá Fase 2 (versão limpa)
// -----------------------------------------------------------------
// Um bloco, um setInterval. Sem herança de V76.x.
//
// Fluxo:
//   • Anhangá cai a 50% HP
//   • V10.53 dispara corrupção + warning "enfurecido"
//   • V77 espera o warning sumir
//   • V77 dispara fase 2: ATK 6→8 (com dificuldade) + sprite + msg
//   • V77 persiste visual a cada tick (não perde pra updateVisuals)
//   • Ao sair da luta: reset automático
//
// Cole NO FINAL do historia.js (depois do V75).
// =================================================================
(function anhangaFase2V77() {
    if (window._anhangaFase2V77) return;
    window._anhangaFase2V77 = true;

    const ANHANGA_ID = 'anhanga';
    const ATK_BASE = 6;
    const ATK_FASE2_BASE = 8;
    const HP_THRESHOLD = 0.5;

    const FILTRO_BOSS = 'hue-rotate(280deg) saturate(1.6) brightness(1.2) drop-shadow(0 0 15px rgba(142,68,173,0.9))';
    const FILTRO_CARD = 'hue-rotate(280deg) saturate(1.6) brightness(1.2)';

    // Slot de sprite (opcional)
    if (typeof SPRITES_STORY !== 'undefined' && !('anhanga_fase2' in SPRITES_STORY)) {
        SPRITES_STORY['anhanga_fase2'] = '';
    }

    let _fase2Ativa = false;

    // ═══════════════════════════════════════════════════════════
    // DETECÇÃO — 4 fallbacks
    // ═══════════════════════════════════════════════════════════
    function isAnhanga() {
        if (Array.isArray(window.storyEnemiesRemaining)
            && window.storyEnemiesRemaining[0] === ANHANGA_ID) return true;

        if (typeof boss !== 'undefined' && boss) {
            const tipo = (boss.type || '').toString().toUpperCase();
            if (tipo === 'ANHANGA') return true;
            const nome = (boss.nome || boss.name || '').toString();
            if (/anhanga/i.test(nome)) return true;
        }

        const bimg = document.getElementById('imgBoss');
        if (bimg && bimg.src && bimg.src.toLowerCase().includes('anhanga')) return true;

        return false;
    }

    // ═══════════════════════════════════════════════════════════
    // ATK com dificuldade
    // ═══════════════════════════════════════════════════════════
    function calcAtkFinal(baseAtk) {
        const diff = (typeof STORY_DIFFICULTIES !== 'undefined'
                      && typeof storyCurrentDifficulty !== 'undefined')
            ? STORY_DIFFICULTIES[storyCurrentDifficulty] : null;
        if (diff && storyCurrentDifficulty !== 'normal') {
            return Math.ceil(baseAtk * diff.atkMult);
        }
        return baseAtk;
    }

    function applyAtk(baseAtk) {
        const atkFinal = calcAtkFinal(baseAtk);
        const atkInput = document.getElementById('atk_BOSS_cfg');
        if (atkInput) {
            atkInput.dataset.originalAtk = baseAtk;
            atkInput.value = atkFinal;
        }
        if (typeof STORY_ENEMIES !== 'undefined' && STORY_ENEMIES[ANHANGA_ID]) {
            STORY_ENEMIES[ANHANGA_ID].atk = baseAtk;
        }
        if (typeof boss !== 'undefined' && boss) {
            boss.atk = atkFinal;
        }
        return atkFinal;
    }

    // ═══════════════════════════════════════════════════════════
    // Visual
    // ═══════════════════════════════════════════════════════════
    function applyVisual() {
        const novo = (typeof SPRITES_STORY !== 'undefined')
            ? SPRITES_STORY['anhanga_fase2'] : '';
        const bimg = document.getElementById('imgBoss');
        const bcs = document.getElementById('bossCardSprite');

        if (novo && novo.trim() !== '') {
            if (bimg && bimg.src !== novo) bimg.src = novo;
            if (bcs && bcs.src !== novo) bcs.src = novo;
        } else {
            if (bimg && bimg.style.filter !== FILTRO_BOSS) bimg.style.filter = FILTRO_BOSS;
            if (bimg && bimg.style.transform !== 'scale(1.15)') bimg.style.transform = 'scale(1.15)';
            if (bcs && bcs.style.filter !== FILTRO_CARD) bcs.style.filter = FILTRO_CARD;
        }
    }

    function clearVisual() {
        const bimg = document.getElementById('imgBoss');
        const bcs = document.getElementById('bossCardSprite');
        if (bimg) {
            bimg.style.filter = '';
            bimg.style.transform = '';
            bimg.style.transition = '';
        }
        if (bcs) bcs.style.filter = '';
    }

    // ═══════════════════════════════════════════════════════════
    // Trigger
    // ═══════════════════════════════════════════════════════════
    function triggerFase2() {
        if (_fase2Ativa) return;
        _fase2Ativa = true;

        const atkFinal = applyAtk(ATK_FASE2_BASE);

        const bimg = document.getElementById('imgBoss');
        if (bimg) bimg.style.transition = 'transform 0.5s ease-out, filter 0.5s ease-out';
        applyVisual();

        if (typeof addLog === 'function') {
            addLog(`👹 ANHANGÁ DESPERTA! ATK ${ATK_BASE} → ${ATK_FASE2_BASE} (final: ${atkFinal}).`);
        }

        showMessage();

        try { if (typeof playSfx === 'function') playSfx('purificacao'); } catch(e) {}
        setTimeout(() => {
            try { if (typeof playSfx === 'function') playSfx('skill1'); } catch(e) {}
        }, 300);

        const board = document.getElementById('board');
        if (board) {
            board.style.animation = 'v77Shake 0.6s ease-out';
            setTimeout(() => { board.style.animation = ''; }, 700);
        }

        if (typeof updateBossCard === 'function') updateBossCard();
        if (typeof updateVisuals === 'function') updateVisuals();

        // Reaplica visual após updates (que podem ter sobrescrito)
        setTimeout(applyVisual, 100);
        setTimeout(applyVisual, 500);

        console.log(`[V77] Fase 2 ativa. ATK final=${atkFinal}`);
    }

    function showMessage() {
        const old = document.getElementById('anhangaFase2Warning');
        if (old) old.remove();

        const w = document.createElement('div');
        w.id = 'anhangaFase2Warning';
        w.innerHTML = `
            <div style="font-family:'Cinzel Decorative', serif; color:#c39bd3; font-size:1.5rem; text-shadow: 0 0 15px #8e44ad;">👹 ANHANGÁ DESPERTA!</div>
            <div style="font-family:'EB Garamond', serif; color:#d9c89a; font-size:1rem; font-style:italic; margin-top:5px;">O Senhor do Abismo revela seu verdadeiro poder.</div>
        `;
        w.style.cssText = `
            position: absolute; top: 20%; left: 50%; transform: translate(-50%, -50%);
            background: linear-gradient(180deg, rgba(40,15,50,0.95), rgba(20,5,20,0.95));
            border: 2px solid #8e44ad; border-radius: 8px; padding: 15px 30px;
            text-align: center; z-index: 1000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 30px rgba(142,68,173,0.6);
            pointer-events: none;
            animation: v77Fade 2.5s ease forwards;
        `;
        document.body.appendChild(w);
        setTimeout(() => { if (w.parentNode) w.remove(); }, 2600);
    }

    function reset() {
        if (!_fase2Ativa) return;
        _fase2Ativa = false;
        applyAtk(ATK_BASE);
        clearVisual();
        if (typeof updateBossCard === 'function') updateBossCard();
        if (typeof updateVisuals === 'function') updateVisuals();
        console.log('[V77] Saiu da luta do Anhangá — resetado');
    }

    // ═══════════════════════════════════════════════════════════
    // SETINTERVAL ÚNICO (monitora + persiste + reseta)
    // ═══════════════════════════════════════════════════════════
    setInterval(() => {
        if (!window._storyMode && !window._eventoAtivo) { if (_fase2Ativa) reset(); return; }
        if (window._pvpMode || window._coopMode) { if (_fase2Ativa) reset(); return; }

        if (!isAnhanga()) { if (_fase2Ativa) reset(); return; }

        if (typeof boss === 'undefined' || !boss || boss.dead) { if (_fase2Ativa) reset(); return; }

        // Já ativa: só persiste visual
        if (_fase2Ativa) { applyVisual(); return; }

        // Ainda acima de 50%: aguarda
        if (boss.hp > boss.maxHp * HP_THRESHOLD) return;

        // Warning "enfurecido" ainda na tela: aguarda
        if (document.getElementById('corruptionWarning')) return;

        // Todas condições OK: dispara
        triggerFase2();
    }, 400);

    // ═══════════════════════════════════════════════════════════
    // CSS
    // ═══════════════════════════════════════════════════════════
    if (!document.getElementById('v77CSS')) {
        const s = document.createElement('style');
        s.id = 'v77CSS';
        s.textContent = `
            @keyframes v77Fade {
                0%   { opacity: 0; transform: translate(-50%, -30%) scale(0.9); }
                10%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                85%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -70%) scale(0.9); }
            }
            @keyframes v77Shake {
                0%, 100% { transform: translateX(0); }
                20%      { transform: translateX(-4px); }
                40%      { transform: translateX(4px); }
                60%      { transform: translateX(-3px); }
                80%      { transform: translateX(3px); }
            }
        `;
        document.head.appendChild(s);
    }

    // ═══════════════════════════════════════════════════════════
    // Debug
    // ═══════════════════════════════════════════════════════════
    window._debugAnhangaV77 = function() {
        const atkInput = document.getElementById('atk_BOSS_cfg');
        const diff = (typeof STORY_DIFFICULTIES !== 'undefined')
            ? STORY_DIFFICULTIES[storyCurrentDifficulty] : null;
        console.group('=== ANHANGÁ FASE 2 (V77) ===');
        console.log('V77 ativo?', window._anhangaFase2V77 === true);
        console.log('É Anhangá?', isAnhanga());
        console.log('Fase 2 ativa?', _fase2Ativa);
        console.log('');
        console.log('Dificuldade:', storyCurrentDifficulty || 'normal', '| ATK mult:', diff?.atkMult);
        console.log('');
        if (typeof boss !== 'undefined' && boss) {
            console.log('Boss HP:', boss.hp, '/', boss.maxHp,
                `(${((boss.hp/boss.maxHp)*100).toFixed(1)}%)`);
            console.log('Boss ATK:', boss.atk);
            console.log('Boss type:', boss.type);
        }
        console.log('atk_BOSS_cfg.value:', atkInput?.value);
        console.log('atk_BOSS_cfg.originalAtk:', atkInput?.dataset?.originalAtk);
        console.log('STORY_ENEMIES.anhanga.atk:', STORY_ENEMIES?.anhanga?.atk);
        console.log('Warning enfurecido?', !!document.getElementById('corruptionWarning'));
        console.log('Warning fase 2?', !!document.getElementById('anhangaFase2Warning'));
        console.log('Sprite custom?', SPRITES_STORY?.['anhanga_fase2'] ? 'SIM' : 'não (filtro CSS)');
        console.groupEnd();
    };

    window._forcarFase2Anhanga = function() {
        if (!isAnhanga()) {
            console.warn('[V77] Não está na luta do Anhangá');
            return;
        }
        _fase2Ativa = false;
        triggerFase2();
    };

    window._resetFase2Anhanga = function() {
        _fase2Ativa = false;
        applyAtk(ATK_BASE);
        clearVisual();
        if (typeof updateBossCard === 'function') updateBossCard();
        console.log('[V77] Resetado');
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V77] Anhangá Fase 2 (versão limpa)');
    console.log('═══════════════════════════════════════════════════');
    console.log('• UM bloco, UM setInterval (400ms)');
    console.log('• Detecção robusta (fila, type, nome, sprite)');
    console.log('• ATK 6 → 8 com dificuldade:');
    console.log('   Normal: 8 | Difícil: 11 | Pesadelo: 13');
    console.log('• Visual persistente');
    console.log('• Reset automático ao sair');
    console.log('');
    console.log('💡 Debug:  window._debugAnhangaV77()');
    console.log('💡 Forçar:  window._forcarFase2Anhanga()');
    console.log('💡 Resetar: window._resetFase2Anhanga()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V77.2 — Anhangá Fase 2 via substituição de sprite
// -----------------------------------------------------------------
// Solução definitiva: troca SPRITES_STORY['anhanga'] quando fase 2
// ativa. Todo código que faz imgBoss.src = SPRITES_STORY['anhanga']
// automaticamente pega o sprite novo. Sem filtro CSS. Sem loop.
//
// • Se você tem sprite da fase 2 → cola URL em SPRITES_STORY['anhanga_fase2']
// • Se NÃO tem → usa o mesmo sprite original (só o popup + ATK mudam)
//
// Cole NO FINAL do historia.js (depois do V77).
// =================================================================
(function spriteFase2V77_2() {
    if (window._spriteFase2V77_2) return;
    window._spriteFase2V77_2 = true;

    console.log('[V77.2] Instalando troca de sprite da fase 2');
    SPRITES_STORY['anhanga_fase2'] = 'https://i.imgur.com/y3owdBe.gif';

    // ─────────────────────────────────────────────────────────
    // Guarda o sprite original do Anhangá (só uma vez)
    // ─────────────────────────────────────────────────────────
    if (!window._anhangaSpriteOriginal) {
        window._anhangaSpriteOriginal =
            (typeof SPRITES_STORY !== 'undefined') ? SPRITES_STORY['anhanga'] : '';
    }

    // ─────────────────────────────────────────────────────────
    // Detecta fase 2 ativa
    // ─────────────────────────────────────────────────────────
    function _faseAtiva() {
        if (!window._storyMode && !window._eventoAtivo) return false;
        if (window._pvpMode || window._coopMode) return false;
        if (typeof boss === 'undefined' || !boss || boss.dead) return false;

        const tipo = (boss.type || '').toString().toUpperCase();
        if (tipo !== 'ANHANGA') return false;

        const atkInput = document.getElementById('atk_BOSS_cfg');
        const atkBase = parseInt(atkInput?.dataset?.originalAtk) || 6;
        return atkBase === 8;
    }

    // ─────────────────────────────────────────────────────────
    // Troca o SPRITES_STORY['anhanga'] para o sprite da fase 2
    // ─────────────────────────────────────────────────────────
    let _spriteTrocado = false;

    function _aplicarTrocaSprite() {
        if (_spriteTrocado) return;
        if (!_faseAtiva()) return;

        const novo = (typeof SPRITES_STORY !== 'undefined')
            ? SPRITES_STORY['anhanga_fase2'] : '';

        // Só troca se tiver URL custom. Senão, não mexe (fica o original).
        if (!novo || novo.trim() === '') {
            console.log('[V77.2] Sem sprite custom da fase 2 — mantendo sprite original');
            console.log('[V77.2] 💡 Cole a URL em: SPRITES_STORY["anhanga_fase2"]');
            _spriteTrocado = true; // marca pra não tentar de novo
            return;
        }

        if (typeof SPRITES_STORY !== 'undefined') {
            SPRITES_STORY['anhanga'] = novo;
        }

        // Força atualização imediata do imgBoss (senão só atualiza no próximo tick)
        const bimg = document.getElementById('imgBoss');
        if (bimg) {
            bimg.src = novo;
            // Transform pra dar "scale" (opcional, mas fica bonito)
            bimg.style.transform = 'scale(1.15)';
            bimg.style.transition = 'transform 0.5s ease-out';
        }
        const bcs = document.getElementById('bossCardSprite');
        if (bcs) bcs.src = novo;

        _spriteTrocado = true;
        console.log('[V77.2] ✅ Sprite da fase 2 aplicado');
    }

    function _restaurarSprite() {
        if (!_spriteTrocado) return;
        if (typeof SPRITES_STORY !== 'undefined') {
            SPRITES_STORY['anhanga'] = window._anhangaSpriteOriginal || '';
        }
        _spriteTrocado = false;
        console.log('[V77.2] Sprite original restaurado');
    }

    // ─────────────────────────────────────────────────────────
    // Loop de 300ms (leve, sem mutation observer)
    // ─────────────────────────────────────────────────────────
    setInterval(() => {
        const ativa = _faseAtiva();
        if (ativa && !_spriteTrocado) {
            _aplicarTrocaSprite();
        } else if (!ativa && _spriteTrocado) {
            _restaurarSprite();
        }
    }, 300);

    // ─────────────────────────────────────────────────────────
    // Debug
    // ─────────────────────────────────────────────────────────
    window._debugSpriteFase2 = function() {
        console.group('=== SPRITE FASE 2 (V77.2) ===');
        console.log('Fase 2 ativa?', _faseAtiva());
        console.log('Sprite trocado?', _spriteTrocado);
        console.log('SPRITES_STORY.anhanga:', SPRITES_STORY?.['anhanga']?.substring(0, 60));
        console.log('SPRITES_STORY.anhanga_fase2:', SPRITES_STORY?.['anhanga_fase2']?.substring(0, 60) || '(vazio)');
        const bimg = document.getElementById('imgBoss');
        console.log('imgBoss.src:', bimg?.src?.substring(0, 60));
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V77.2] Troca de sprite da fase 2');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Substitui SPRITES_STORY["anhanga"] quando fase 2 ativa');
    console.log('• Restaura quando sai');
    console.log('• Sem filtro CSS, sem mutation observer, sem loop');
    console.log('');
    console.log('📸 Para usar sprite custom:');
    console.log('   SPRITES_STORY["anhanga_fase2"] = "https://i.imgur.com/SEU_SPRITE.gif";');
    console.log('');
    console.log('💡 Sem sprite custom: só popup + ATK (não muda visual)');
    console.log('');
    console.log('💡 Debug: window._debugSpriteFase2()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — V77.3 — Faz o V77 respeitar o sprite trocado
// -----------------------------------------------------------------
// Problema: V77 (trigger original) aplica filtro CSS por cima do
// sprite trocado pelo V77.2. Precisa espelhar SPRITES_STORY
// ['anhanga_fase2'] = SPRITES_STORY['anhanga'] quando V77.2 trocou.
//
// Cole NO FINAL do historia.js (depois do V77 e V77.2).
// =================================================================
(function fixV77_3() {
    if (window._fixV77_3) return;
    window._fixV77_3 = true;

    setInterval(() => {
        if (typeof SPRITES_STORY === 'undefined') return;
        if (!window._spriteFase2V77_2) return;
        if (!window._anhangaSpriteOriginal) return;

        // Se o sprite original mudou (V77.2 ativo), espelha em 'anhanga_fase2'
        if (SPRITES_STORY['anhanga'] !== window._anhangaSpriteOriginal) {
            if (SPRITES_STORY['anhanga_fase2'] !== SPRITES_STORY['anhanga']) {
                SPRITES_STORY['anhanga_fase2'] = SPRITES_STORY['anhanga'];
                console.log('[V77.3] Sprite fase2 espelhado → V77 usará sprite em vez de filtro');
            }
        }
    }, 300);

    console.log('✅ [V77.3] Fix: V77 respeita sprite do V77.2');
})();
// =================================================================
// historia.js — V78 — Tabela de fraqueza visível
// -----------------------------------------------------------------
// Injeta a tabela do ciclo elemental no painel "?" do herói
// (funciona na OCA e no modal de batalha).
//
// • Destaca o elemento do herói atual
// • Mostra o que ele vence (+1) e o que perde (-1)
// • Tabela completa dos 4 elementos embaixo
// • Usa os sprites de elemento já existentes (elem_fogo, etc)
//
// Cole NO FINAL do historia.js.
// =================================================================
(function tabelaFraquezaV78() {
    if (window._tabelaFraquezaV78) return;
    window._tabelaFraquezaV78 = true;

    // ═══════════════════════════════════════════════════════════
    // CICLO (mesma estrutura do V71)
    // ═══════════════════════════════════════════════════════════
    const CICLO = {
        FOGO:  { forte: 'TERRA', fraco: 'AGUA'  },
        TERRA: { forte: 'AR',    fraco: 'FOGO'  },
        AR:    { forte: 'AGUA',  fraco: 'TERRA' },
        AGUA:  { forte: 'FOGO',  fraco: 'AR'    },
    };

    function _elemNome(el) {
        return { FOGO: 'Fogo', AGUA: 'Água', TERRA: 'Terra', AR: 'Ar' }[el] || el;
    }

    function _getElementoHeroi(heroClass) {
        const heroData = (typeof STORY_HERO_CLASSES !== 'undefined')
            ? STORY_HERO_CLASSES[heroClass] : null;
        if (!heroData) return null;
        if (heroData.element) return heroData.element;
        if (typeof getHeroStoryElement === 'function') {
            try { return getHeroStoryElement(heroClass); } catch(e) {}
        }
        return null;
    }

    function _icone(el) {
        return (typeof elemIcon === 'function') ? elemIcon(el) : el;
    }

    // ═══════════════════════════════════════════════════════════
    // HTML DA TABELA
    // ═══════════════════════════════════════════════════════════
    function _buildHTML(elementoAtual) {
        // Bloco "seu elemento"
        let heroHighlight = '';
        if (elementoAtual && CICLO[elementoAtual]) {
            const c = CICLO[elementoAtual];
            heroHighlight = `
                <div style="
                    padding: 10px 14px;
                    background: linear-gradient(180deg, rgba(232,185,35,.1), transparent 100%);
                    border: 1px solid rgba(232,185,35,.35);
                    border-radius: 6px;
                    margin-bottom: 12px;
                ">
                    <div style="font-family:'Cinzel',serif; color:#8a7a52; font-size:0.75rem; letter-spacing:2px; margin-bottom:8px;">SEU ELEMENTO</div>
                    <div style="display:flex; align-items:center; gap:8px; font-family:'Cinzel',serif; font-weight:700; font-size:1.1rem; margin-bottom:10px; color:#e8b923;">
                        ${_icone(elementoAtual)}
                        <span>${_elemNome(elementoAtual)}</span>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px; font-family:'EB Garamond',serif; font-size:0.9rem;">
                        <div style="color:#8ac070;">
                            ⚔️ <b>Forte contra:</b>
                            ${_icone(c.forte)} ${_elemNome(c.forte)}
                            <span style="color:#6ba35c; font-size:0.78rem; margin-left:4px;">(+1 dano)</span>
                        </div>
                        <div style="color:#d05050;">
                            🛡️ <b>Fraco contra:</b>
                            ${_icone(c.fraco)} ${_elemNome(c.fraco)}
                            <span style="color:#a83232; font-size:0.78rem; margin-left:4px;">(-1 dano)</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Tabela completa (4 elementos)
        const linhas = ['FOGO', 'TERRA', 'AR', 'AGUA'].map(el => {
            const c = CICLO[el];
            const destaque = el === elementoAtual
                ? 'background: rgba(232,185,35,.08); border-left: 3px solid #e8b923;'
                : 'border-left: 3px solid transparent;';
            return `
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 7px 10px;
                    border-radius: 4px;
                    font-family: 'EB Garamond', serif;
                    font-size: 0.85rem;
                    ${destaque}
                ">
                    <span style="min-width: 76px; display: inline-flex; align-items: center; gap: 4px; color:#d9c89a;">
                        ${_icone(el)} ${_elemNome(el)}
                    </span>
                    <span style="color:#8ac070; display: inline-flex; align-items: center; gap: 4px;">
                        vence ${_icone(c.forte)} <span style="font-size:0.78rem;">${_elemNome(c.forte)}</span>
                    </span>
                    <span style="color:#d05050; display: inline-flex; align-items: center; gap: 4px; margin-left:auto;">
                        perde ${_icone(c.fraco)} <span style="font-size:0.78rem;">${_elemNome(c.fraco)}</span>
                    </span>
                </div>
            `;
        }).join('');

        return `
            <div class="hero-details-section-title">🎯 CICLO ELEMENTAL</div>
            ${heroHighlight}
            <div style="
                background: rgba(10,6,2,.5);
                border-radius: 6px;
                padding: 8px;
                display: flex;
                flex-direction: column;
                gap: 2px;
            ">
                ${linhas}
            </div>
            <div class="hero-details-note" style="margin-top:10px; font-size:0.8rem;">
                💡 <b>Arma</b> do seu elemento: +1. Arma do seu contra-elemento: -1.<br>
                💡 <b>Tile</b> onde você pisa for do seu contra-elemento: -1.
            </div>
        `;
    }

    // ═══════════════════════════════════════════════════════════
    // INJETAR
    // ═══════════════════════════════════════════════════════════
    function _injetar(heroClass) {
        const panel = document.querySelector('.hero-details-panel');
        if (!panel) return;
        if (panel.querySelector('.hero-weakness-section')) return;

        const element = _getElementoHeroi(heroClass);
        if (!element) return;

        const section = document.createElement('div');
        section.className = 'hero-details-section hero-weakness-section';
        section.innerHTML = _buildHTML(element);

        // Insere antes de "NOTAS" ou no final
        const notas = panel.querySelector('.hero-details-notes');
        if (notas && notas.parentNode === panel) {
            panel.insertBefore(section, notas);
        } else {
            panel.appendChild(section);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // HOOK: painel "?" da OCA
    // ═══════════════════════════════════════════════════════════
    const _origOpen = window.openHeroDetails;
    if (typeof _origOpen === 'function' && !_origOpen._v78) {
        window.openHeroDetails = function(heroClass) {
            const r = _origOpen.apply(this, arguments);
            setTimeout(() => _injetar(heroClass), 100);
            setTimeout(() => _injetar(heroClass), 300);
            return r;
        };
        window.openHeroDetails._v78 = true;
        console.log('[V78] Hook em openHeroDetails (OCA)');
    }

    // ═══════════════════════════════════════════════════════════
    // HOOK: painel "?" da batalha
    // ═══════════════════════════════════════════════════════════
    const _origBattle = window.openBattleHeroDetails;
    if (typeof _origBattle === 'function' && !_origBattle._v78) {
        window.openBattleHeroDetails = function(idx) {
            const r = _origBattle.apply(this, arguments);
            const player = (typeof players !== 'undefined' && Array.isArray(players))
                ? players[idx] : null;
            if (player && player.class) {
                setTimeout(() => _injetar(player.class), 100);
                setTimeout(() => _injetar(player.class), 300);
            }
            return r;
        };
        window.openBattleHeroDetails._v78 = true;
        console.log('[V78] Hook em openBattleHeroDetails (batalha)');
    }

    // ═══════════════════════════════════════════════════════════
    // CSS
    // ═══════════════════════════════════════════════════════════
    if (!document.getElementById('v78CSS')) {
        const s = document.createElement('style');
        s.id = 'v78CSS';
        s.textContent = `
            .hero-details-panel .hero-weakness-section {
                background: rgba(58, 42, 24, 0.15);
            }
            .hero-details-panel .hero-weakness-section .hero-details-section-title {
                color: #c39bd3;
            }
            .hero-details-panel .hero-weakness-section span img,
            .hero-details-panel .hero-weakness-section .ui-icon {
                width: 18px;
                height: 18px;
                object-fit: contain;
                vertical-align: middle;
                filter: drop-shadow(0 0 3px rgba(0,0,0,0.6));
            }
        `;
        document.head.appendChild(s);
    }

    // ═══════════════════════════════════════════════════════════
    // DEBUG
    // ═══════════════════════════════════════════════════════════
    window._debugTabelaFraqueza = function() {
        console.group('=== TABELA FRAQUEZA V78 ===');
        console.log('V78 ativo?', window._tabelaFraquezaV78 === true);
        console.log('CICLO:', CICLO);
        const panel = document.querySelector('.hero-details-panel');
        console.log('Painel aberto?', !!panel);
        console.log('Seção injetada?', !!panel?.querySelector('.hero-weakness-section'));
        console.groupEnd();
    };

    // Teste manual (abre painel fake, sem herói real)
    window._testTabelaFraqueza = function(elemento) {
        elemento = elemento || 'FOGO';
        const existing = document.getElementById('testTabelaFraqueza');
        if (existing) existing.remove();
        const div = document.createElement('div');
        div.id = 'testTabelaFraqueza';
        div.className = 'hero-details-panel';
        div.style.cssText = 'position:fixed;top:20px;right:20px;width:400px;max-height:80vh;overflow-y:auto;background:linear-gradient(180deg,#2a1f10,#1a1208);border:2px solid #c9a227;border-radius:8px;padding:0;z-index:99999;';
        const section = document.createElement('div');
        section.className = 'hero-details-section hero-weakness-section';
        section.style.padding = '16px 20px';
        section.innerHTML = _buildHTML(elemento);
        div.appendChild(section);
        document.body.appendChild(div);
        console.log(`[V78] Teste: tabela com elemento ${elemento} aberta no canto.`);
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V78] Tabela de fraqueza visível');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Injeta no painel "?" (OCA e batalha)');
    console.log('• Usa sprites elem_fogo/agua/terra/ar');
    console.log('• Destaca o elemento do herói');
    console.log('');
    console.log('💡 Debug:  window._debugTabelaFraqueza()');
    console.log('💡 Teste:  window._testTabelaFraqueza("FOGO")');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
