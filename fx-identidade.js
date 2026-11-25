// =================================================================
// fx-identidade.js — V1 — Identidade visual temática de PAs e skills
// -----------------------------------------------------------------
// Camada SOMENTE VISUAL/SOM. Não altera dano, turno, IA, atos nem inimigos.
//
// Regras de ouro:
//   • Nunca chamar triggerElementalFX() por tile (bug do redemoinho global).
//   • 1 sprite por tile, no máximo 16 nós por skill.
//   • Intro global (showPoderAncestralEffect) continua; o FX temático é local.
//   • Tupã / Sumé / Caipora e Curupira seguem fluxos próprios e não são tocados.
//   • Desligar com ?skillFx=0
// =================================================================
(function instalarIdentidadeFX() {
    if (window._skillFxIdentityV1) return;

    const desligado = (function () {
        try { return new URLSearchParams(location.search).get('skillFx') === '0'; }
        catch (e) { return false; }
    })();

    if (desligado) {
        window._skillFxIdentityV1 = 'off';
        window.SKILL_FX_ENABLED = false;
        console.log('[FX-ID] Desligado por ?skillFx=0');
        return;
    }
    window._skillFxIdentityV1 = true;
    window.SKILL_FX_ENABLED = true;

    // ═══════════════════════════════════════════════════════════
    // 0. TABELAS REAIS DO PROJETO
    // ═══════════════════════════════════════════════════════════
    const T = {
        sprites: (typeof SPRITES !== 'undefined' && SPRITES) || {},
        story: (typeof SPRITES_STORY !== 'undefined' && SPRITES_STORY) || {},
        matsStory: (typeof STORY_MATERIAL_SPRITES !== 'undefined' && STORY_MATERIAL_SPRITES) || {},
        baseSprites: (typeof A_SPRITES !== 'undefined' && A_SPRITES) || {},
        baseMats: (typeof A_MATERIALS !== 'undefined' && A_MATERIALS) || {},
        cenarios: (typeof A_CENARIOS !== 'undefined' && A_CENARIOS) || {},
        evento: (typeof A_EVENTO !== 'undefined' && A_EVENTO) || {},
        nacao: window.NACAO_SPRITES || (typeof A_NACAO_SPRITES !== 'undefined' ? A_NACAO_SPRITES : {}),
        raid: (typeof A_RAID_ASSETS !== 'undefined' && A_RAID_ASSETS) || window.A_RAID_ASSETS || {},
    };

    function pick() {
        for (let i = 0; i < arguments.length; i++) {
            const v = arguments[i];
            if (!v) continue;
            if (typeof v === 'string') {
                if (v.trim()) return v.trim();
                continue;
            }
            if (typeof v === 'object') {
                const u = v.sprite || v.url || v.src;
                if (typeof u === 'string' && u.trim()) return u.trim();
            }
        }
        return '';
    }

    // SLOTS NOVOS DE STORY_FX_SPRITES — reaproveitando o que já existe.
    const SLOTS = {
        rock_fx: pick(T.baseSprites.RockFX, T.sprites.RockFX),
        vortex_fx: pick(T.baseSprites.VortexFX, T.sprites.VortexFX),
        claw_fx: pick(T.baseSprites.ClawFX, T.sprites.ClawFX),
        fireball_fx: pick(T.baseSprites.FireballFX, T.sprites.FireballFX),
        arrow_fx: pick(T.baseSprites.ArrowFX, T.sprites.ArrowFX),
        magic_fx: pick(T.baseSprites.MagicFX, T.sprites.MagicFX),
        poison_fx: pick(T.baseSprites.PoisonFX, T.sprites.PoisonFX),
        moon_fx: pick(T.baseSprites.MoonFX, T.sprites.MoonFX),
        sun_fx: pick(T.baseSprites.SunFX, T.sprites.SunFX),
        scary_face_fx: pick(T.baseSprites.ScaryFaceFX, T.sprites.ScaryFaceFX),
        potion_fx: pick(T.baseSprites.PotionFX, T.sprites.PotionFX),
        sword_fx: pick(T.baseSprites.SwordFX, T.sprites.SwordFX),
        muiraquita: pick(T.baseSprites.Muiraquita, T.sprites.Muiraquita),

        elem_fogo: pick(T.cenarios.elem_fogo, T.story.elem_fogo),
        elem_agua: pick(T.cenarios.elem_agua, T.story.elem_agua),
        elem_terra: pick(T.cenarios.elem_terra, T.story.elem_terra),
        elem_ar: pick(T.cenarios.elem_ar, T.story.elem_ar),

        chifre_ancestral: pick(T.baseMats.chifre_ancestral, T.matsStory.chifre_ancestral),
        garra_onca: pick(T.baseMats.garra_onca, T.matsStory.garra_onca),
        asa_morcego: pick(T.baseMats.asa_morcego, T.matsStory.asa_morcego),
        asa_mariposa: pick(T.baseMats.asa_mariposa, T.matsStory.asa_mariposa),
        veneno_sapo: pick(T.baseMats.veneno_sapo, T.matsStory.veneno_sapo),
        coroa_solar: pick(T.baseMats.coroa_solar, T.matsStory.coroa_solar),
        raio_lunar: pick(T.baseMats.raio_lunar, T.matsStory.raio_lunar),
        essencia_anhanga: pick(T.baseMats.essencia_anhanga, T.matsStory.essencia_anhanga),
        fragmento_abismo: pick(T.baseMats.fragmento_abismo, T.matsStory.fragmento_abismo),

        fragmento_teju: pick(T.evento.fragmento_teju, T.baseMats.fragmento_teju),
        fragmento_mboi: pick(T.evento.fragmento_mboi, T.baseMats.fragmento_mboi),
        fragmento_kurupi: pick(T.evento.fragmento_kurupi, T.baseMats.fragmento_kurupi),
        ao_ao: pick(T.evento.ao_ao),
        luison: pick(T.evento.luison),
        heroi_bicho: pick(T.story.heroi_BichoFolharal),
        nacao_spiderwoman: pick(T.nacao.nacao_spiderwoman),
        pombero_assobio: pick(T.raid.skills && T.raid.skills.pombero_assobio),
        lampiao_peixeira: pick(T.raid.skills && T.raid.skills.lampiao_peixeira),
    };

    if (typeof STORY_FX_SPRITES !== 'undefined' && STORY_FX_SPRITES) {
        Object.keys(SLOTS).forEach(k => {
            if (SLOTS[k] && !String(STORY_FX_SPRITES[k] || '').trim()) {
                STORY_FX_SPRITES[k] = SLOTS[k];
            }
        });
    }

    // ═══════════════════════════════════════════════════════════
    // 1. CSS CINEMATOGRÁFICO (leve)
    // ═══════════════════════════════════════════════════════════
    (function injectCSS() {
        if (document.getElementById('skillFxIdentityCSS')) return;
        const style = document.createElement('style');
        style.id = 'skillFxIdentityCSS';
        style.textContent = `
            .fx-id {
                position:absolute; pointer-events:none; z-index:55;
                object-fit:contain; animation-fill-mode:both;
                filter:drop-shadow(0 0 6px rgba(255,255,255,.35));
                will-change:transform,opacity;
            }
            .fx-id-burst { animation:fxIdBurst var(--id-dur,520ms) cubic-bezier(.2,.9,.2,1) both; }
            @keyframes fxIdBurst { 0%{transform:scale(.35);opacity:0} 45%{transform:scale(1.15);opacity:1} 100%{transform:scale(1.5);opacity:0} }

            .fx-id-pulse { animation:fxIdPulse var(--id-dur,480ms) ease-out both; }
            @keyframes fxIdPulse { 0%{transform:scale(.4);opacity:0} 50%{transform:scale(1.1);opacity:1} 100%{transform:scale(1.35);opacity:0} }

            .fx-id-sweep { animation:fxIdSweep var(--id-dur,460ms) ease-out both; transform-origin:left center; }
            @keyframes fxIdSweep { 0%{transform:scaleX(.2);opacity:0} 40%{transform:scaleX(1.1);opacity:1} 100%{transform:scaleX(1.35) translateX(8%);opacity:0} }

            .fx-id-fall { animation:fxIdFall var(--id-dur,540ms) cubic-bezier(.4,0,.6,1) both; }
            @keyframes fxIdFall { 0%{transform:translateY(-34px) scale(.6);opacity:0} 55%{transform:translateY(0) scale(1.1);opacity:1} 100%{transform:translateY(6px) scale(1.25);opacity:0} }

            .fx-id-wave { animation:fxIdWave var(--id-dur,560ms) ease-out both; transform-origin:bottom center; }
            @keyframes fxIdWave { 0%{transform:scaleY(.35) translateY(12px);opacity:0} 45%{transform:scaleY(1.15) translateY(0);opacity:1} 100%{transform:scaleY(1.4) translateY(-6px);opacity:0} }

            .fx-id-swirl { animation:fxIdSwirl var(--id-dur,580ms) linear both; }
            @keyframes fxIdSwirl { 0%{transform:rotate(0deg) scale(.55);opacity:0} 45%{transform:rotate(180deg) scale(1.05);opacity:1} 100%{transform:rotate(320deg) scale(.9);opacity:0} }

            .fx-id-veil { animation:fxIdVeil var(--id-dur,620ms) ease-out both; filter:blur(1px) saturate(1.25); }
            @keyframes fxIdVeil { 0%{transform:scale(.5);opacity:0} 45%{transform:scale(1.1);opacity:.95} 100%{transform:scale(1.4);opacity:0} }

            .fx-id-heal { animation:fxIdHeal var(--id-dur,620ms) ease-out both; }
            @keyframes fxIdHeal { 0%{transform:translateY(18px) scale(.45);opacity:0} 45%{transform:translateY(0) scale(1.08);opacity:1} 100%{transform:translateY(-18px) scale(.85);opacity:0} }

            .fx-id-telegraph { animation:fxIdTelegraph var(--id-dur,300ms) ease-in-out both; border:2px solid currentColor; border-radius:50%; }
            @keyframes fxIdTelegraph { 0%{transform:scale(.8);opacity:.25} 50%{transform:scale(1.1);opacity:.85} 100%{transform:scale(1);opacity:.35} }

            .fx-id-signature {
                position:absolute; z-index:70; display:flex; align-items:center; gap:6px;
                padding:3px 8px 3px 3px; border-radius:999px; pointer-events:none;
                background:linear-gradient(90deg,rgba(12,14,22,.94),rgba(12,14,22,.55));
                border:1px solid rgba(232,185,35,.85); box-shadow:0 0 14px rgba(232,185,35,.45);
                animation:fxIdSig 1050ms ease-out both; will-change:transform,opacity;
            }
            .fx-id-signature img { width:30px; height:30px; object-fit:contain; border-radius:50%; }
            .fx-id-signature-text { display:flex; flex-direction:column; line-height:1.05; color:#fff5dc; text-shadow:0 1px 2px #000; font-size:10px; }
            .fx-id-signature-text b { font-size:11px; }
            .fx-id-signature-text small { display:flex; align-items:center; gap:3px; font-size:8px; letter-spacing:.08em; color:#e8b923; }
            .fx-id-signature-el { width:12px !important; height:12px !important; }
            .fx-id-signature-el-txt { font-size:8px; color:#e8b923; }
            @keyframes fxIdSig { 0%{transform:translateY(8px) scale(.85);opacity:0} 18%{transform:translateY(0) scale(1);opacity:1} 75%{opacity:1} 100%{transform:translateY(-10px) scale(.96);opacity:0} }

            @media (max-width:600px){
                .fx-id { filter:none; }
                .fx-id-burst,.fx-id-fall,.fx-id-wave,.fx-id-swirl,.fx-id-veil,.fx-id-heal { animation-duration:420ms; }
                .fx-id-sweep { animation-duration:360ms; }
            }
            @media (prefers-reduced-motion:reduce){
                .fx-id { animation:fxIdFadeSimple 260ms ease-out both !important; filter:none !important; }
                .fx-id-signature { animation:fxIdFadeSimple 260ms ease-out both !important; }
                @keyframes fxIdFadeSimple { 0%{opacity:0} 50%{opacity:.8} 100%{opacity:0} }
            }
        `;
        document.head.appendChild(style);
    })();

    // ═══════════════════════════════════════════════════════════
    // 2. CONTRATO skillId → { sprite, motion, sound, ... }
    // ═══════════════════════════════════════════════════════════
    function mk(sprite, motion, sound, extra) {
        return Object.assign({
            sprite: sprite || 'impact',
            motion: motion || 'pulse',
            sound: sound || '',
            lead: 0,
            stagger: 25,
            duration: 520,
            maxTiles: 16,
            accent: '',
            playSound: true,
        }, extra || {});
    }

    const ARCH = {
        terra: mk('rock_fx', 'burst', 'coice', { stagger: 30, duration: 560, accent: 'chifre_ancestral' }),
        vento: mk('vortex_fx', 'swirl', 'asas', { stagger: 22, duration: 580, accent: 'asa_mariposa' }),
        garra: mk('claw_fx', 'pulse', 'garras', { stagger: 24, duration: 480, accent: 'garra_onca' }),
        fogo: mk('fireball_fx', 'fall', 'urro', { stagger: 28, duration: 540, accent: 'elem_fogo' }),
        agua: mk('elem_agua', 'wave', 'splash', { stagger: 26, duration: 560 }),
        flecha: mk('arrow_fx', 'sweep', 'asas', { stagger: 16, duration: 460 }),
        cura: mk('potion_fx', 'heal', 'purificacao', { stagger: 30, duration: 620, accent: 'sun_fx' }),
        sol: mk('sun_fx', 'burst', 'win', { stagger: 25, duration: 560, accent: 'coroa_solar' }),
        sombra: mk('scary_face_fx', 'veil', 'rosnado', { stagger: 30, duration: 640, accent: 'essencia_anhanga' }),
        magia: mk('magic_fx', 'veil', 'chocalho', { stagger: 26, duration: 580 }),
        veneno: mk('poison_fx', 'pulse', 'chocalho', { stagger: 24, duration: 560, accent: 'veneno_sapo' }),
        lua: mk('moon_fx', 'heal', 'purificacao', { stagger: 28, duration: 600, accent: 'raio_lunar' }),
        relampago: mk('elem_ar', 'burst', 'chifre', { stagger: 18, duration: 460, accent: 'sword_fx' }),
        pedra: mk('chifre_ancestral', 'burst', 'bote', { stagger: 30, duration: 560 }),
    };

    const PA_FX = {
        kanarott_cruz_empurra: mk('rock_fx', 'burst', 'coice', { stagger: 30, duration: 560, accent: 'chifre_ancestral' }),
        teperesik_area2x2: mk('chifre_ancestral', 'burst', 'urro', { stagger: 28, duration: 540 }),
        eru_linha_horizontal: mk('arrow_fx', 'sweep', 'asas', { stagger: 16, duration: 460 }),
        araci_linha_horizontal: mk('arrow_fx', 'sweep', 'asas', { stagger: 16, duration: 460 }),
        pajeacu_linha: mk('elem_ar', 'sweep', 'skill1', { stagger: 16, duration: 460 }),
        andure_area2x2_cura: mk('potion_fx', 'heal', 'purificacao', { stagger: 30, duration: 620 }),
        maedamata_area3x3_cura: mk('potion_fx', 'heal', 'purificacao', { stagger: 24, duration: 620, accent: 'sun_fx', maxTiles: 16 }),
        paje_coluna_fogo: mk('fireball_fx', 'fall', 'skill1', { stagger: 28, duration: 540, accent: 'elem_fogo' }),
        jurua_area_alvo_3x3: mk('claw_fx', 'pulse', 'felino', { stagger: 24, duration: 480, accent: 'garra_onca' }),
        // Prova conceitual: redemoinho LOCAL, só nos 15 tiles da cruz.
        bicho_cruz_completa: mk('vortex_fx', 'swirl', 'mariposa', { stagger: 22, duration: 580, accent: 'asa_mariposa', maxTiles: 15 }),
        tapyra_coluna_alvo: mk('rock_fx', 'burst', 'coice', { stagger: 28, duration: 560 }),
        anhanga_mirim_raio: mk('scary_face_fx', 'veil', 'rosnado', { stagger: 26, duration: 640, accent: 'essencia_anhanga' }),
        matinta_rajada: mk('asa_morcego', 'sweep', 'asas', { stagger: 18, duration: 480 }),
        maedouro_caminho: mk('sun_fx', 'heal', 'win', { stagger: 26, duration: 580, accent: 'coroa_solar' }),
        kianumanka_meteoro: mk('fireball_fx', 'fall', 'urro', { stagger: 28, duration: 560, accent: 'elem_fogo' }),
        naia_apaga_fogo: mk('elem_agua', 'wave', 'splash', { stagger: 24, duration: 560 }),
        kuati_explosao: mk('claw_fx', 'burst', 'garras', { stagger: 24, duration: 520, accent: 'garra_onca' }),
        caboclo_mare: mk('elem_agua', 'wave', 'splash', { stagger: 26, duration: 600 }),
        tupinamba_avalanche: mk('rock_fx', 'burst', 'bote', { stagger: 28, duration: 560, accent: 'chifre_ancestral' }),
        mbaraka_salto_raio: mk('magic_fx', 'veil', 'chocalho', { stagger: 24, duration: 560, accent: 'elem_ar' }),
        negrinho_cruz_cura: mk('potion_fx', 'heal', 'purificacao', { stagger: 26, duration: 620, accent: 'sun_fx' }),
        ruda_flecha_amor: mk('arrow_fx', 'sweep', 'asas', { stagger: 22, duration: 480, accent: 'muiraquita', maxTiles: 15 }),
    };

    const EVENTO_FX = {
        evento_teju_sete_cabecas: mk('fragmento_teju', 'fall', '', { stagger: 30, duration: 600, accent: 'fireball_fx' }),
        evento_teju_ima_almas: mk('magic_fx', 'veil', '', { stagger: 26, duration: 580, accent: 'pull_chain' }),
        evento_mboi_bico_arco_iris: mk('fragmento_mboi', 'wave', '', { stagger: 24, duration: 560 }),
        evento_mboi_inundacao: mk('elem_agua', 'wave', '', { stagger: 26, duration: 600 }),
        evento_monai_voo_rasante: mk('vortex_fx', 'sweep', '', { stagger: 18, duration: 480, accent: 'asa_morcego' }),
        evento_monai_sopro_tempestade: mk('vortex_fx', 'swirl', '', { stagger: 24, duration: 620 }),
        evento_jasy_salto_solar: mk('sun_fx', 'fall', '', { stagger: 26, duration: 560, accent: 'coroa_solar' }),
        evento_jasy_clarao_cegante: mk('sun_fx', 'burst', '', { stagger: 22, duration: 520 }),
        evento_kurupi_raizes: mk('coil_wrap', 'pulse', '', { stagger: 28, duration: 640, accent: 'fragmento_kurupi' }),
        evento_kurupi_chamado: mk('fragmento_kurupi', 'veil', '', { stagger: 30, duration: 640 }),
        evento_aoao_investida: mk('claw_fx', 'pulse', '', { stagger: 24, duration: 480 }),
        evento_aoao_la: mk('ao_ao', 'wave', '', { stagger: 26, duration: 600 }),
        evento_luison_colheita: mk('moon_fx', 'veil', '', { stagger: 28, duration: 620, accent: 'essencia_anhanga' }),
        evento_luison_legado: mk('luison', 'veil', '', { stagger: 30, duration: 660, accent: 'raio_lunar' }),
        evento_pesadelo_skill: mk('scary_face_fx', 'veil', '', { stagger: 26, duration: 660, accent: 'essencia_anhanga' }),
    };

    const RAID_FX = {
        raid_teju_sete_cabecas: mk('fragmento_teju', 'fall', '', { stagger: 28, duration: 560, accent: 'fireball_fx' }),
        raid_teju_ima_almas: mk('magic_fx', 'veil', '', { stagger: 26, duration: 580 }),
        raid_mboi_bico_arco_iris: mk('fragmento_mboi', 'wave', '', { stagger: 24, duration: 540 }),
        raid_mboi_inundacao: mk('elem_agua', 'wave', '', { stagger: 26, duration: 580 }),
        raid_monai_voo_rasante: mk('vortex_fx', 'sweep', '', { stagger: 18, duration: 460 }),
        raid_monai_sopro_tempestade: mk('vortex_fx', 'swirl', '', { stagger: 24, duration: 600, accent: 'asa_morcego' }),
        raid_jasy_salto_solar: mk('sun_fx', 'fall', '', { stagger: 26, duration: 540, accent: 'coroa_solar' }),
        raid_jasy_clarao_cegante: mk('sun_fx', 'burst', '', { stagger: 22, duration: 500 }),
        raid_kurupi_raizes_estranguladoras: mk('coil_wrap', 'pulse', '', { stagger: 28, duration: 620 }),
        raid_kurupi_chamado_mata: mk('fragmento_kurupi', 'veil', '', { stagger: 30, duration: 620 }),
        raid_aoao_investida_diagonal: mk('claw_fx', 'pulse', '', { stagger: 22, duration: 460 }),
        raid_aoao_la_energizada: mk('ao_ao', 'wave', '', { stagger: 24, duration: 580 }),
        raid_luison_colheita_sombria: mk('moon_fx', 'veil', '', { stagger: 28, duration: 620 }),
        raid_luison_legado_filhos: mk('luison', 'veil', '', { stagger: 30, duration: 640, accent: 'raio_lunar' }),
        raid_lampiao_tiro: mk('arrow_fx', 'burst', '', { stagger: 20, duration: 460, accent: 'fireball_fx' }),
        raid_lampiao_peixeira: mk('lampiao_peixeira', 'pulse', '', { stagger: 22, duration: 480, accent: 'claw_fx' }),
    };

    const NACAO_TEMA = {
        nacao_yucahu: 'terra', nacao_atabey: 'agua', nacao_juracan: 'vento',
        nacao_quetzalcoatl: 'vento', nacao_tezcatlipoca: 'sombra',
        nacao_huitzilopochtli: 'fogo', nacao_kukulkan: 'sombra',
        nacao_chaac: 'relampago', nacao_ixchel: 'lua', nacao_illapa: 'relampago',
        nacao_mamaquilla: 'lua', nacao_supay: 'sombra', nacao_antu: 'sol',
        nacao_pillan: 'fogo', nacao_wekufe: 'sombra', nacao_bochica: 'magia',
        nacao_bachue: 'agua', nacao_chibchacum: 'terra', nacao_maii: 'garra',
        nacao_spiderwoman: 'veneno', nacao_hashchelti: 'sol',
    };

    const SKILL_FX = Object.assign({}, ARCH, PA_FX, EVENTO_FX, RAID_FX);

    // 42 skills das Nações herdam o arquétipo do deus — sem 42 animações novas.
    const handlersNacao = window.NACAO_SKILL_HANDLERS || {};
    Object.keys(handlersNacao).forEach(id => {
        const prefixo = String(id).split('_').slice(0, 2).join('_'); // nacao + deus
        const tema = NACAO_TEMA[prefixo] || 'pulse';
        SKILL_FX[id] = ARCH[tema] || mk('magic_fx', 'pulse', 'chocalho');
    });

    window.SKILL_FX = SKILL_FX;

    // ═══════════════════════════════════════════════════════════
    // 3. PLAYER / RESOLVER
    // ═══════════════════════════════════════════════════════════
    window.getSkillFx = function (id) {
        if (!id) return null;
        return SKILL_FX[id] || null;
    };

    function normalizeTiles(tiles) {
        if (!Array.isArray(tiles)) return [];
        const out = [];
        tiles.forEach(t => {
            let x, y;
            if (typeof t === 'number') { x = t % 8; y = Math.floor(t / 8); }
            else if (t && typeof t === 'object') { x = t.x; y = t.y; }
            if (Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < 8 && y >= 0 && y < 8) {
                if (!out.some(o => o.x === x && o.y === y)) out.push({ x, y });
            }
        });
        return out;
    }

    function spawnTileFx(fx, tile, delay, opts) {
        if (typeof spawnFxAt !== 'function') return null;
        let el = null;
        try {
            el = spawnFxAt(fx.sprite, `fx-${fx.motion}`, tile.x, tile.y, {
                duration: fx.duration + delay + 120,
                delay,
                extraClass: `fx-id fx-id-${fx.motion}`,
            });
        } catch (e) {
            // fallback CSS puro: não quebra o combate nunca
            try {
                el = spawnFxAt('impact', `fx-${fx.motion}`, tile.x, tile.y, {
                    duration: fx.duration + delay + 120,
                    delay,
                    extraClass: `fx-id fx-id-${fx.motion}`,
                });
            } catch (e2) { return null; }
        }
        if (el) {
            try { el.style.setProperty('--id-dur', fx.duration + 'ms'); } catch (e) {}
            if (opts && opts.tint) el.style.color = opts.tint;
        }
        return el;
    }

    // Um tile só — usado pelos rediretores de evento/nação.
    window.playSkillFxTile = function (id, x, y, opts) {
        const fx = getSkillFx(id);
        if (!fx) return null;
        return spawnTileFx(fx, { x, y }, 0, opts || {});
    };

    // Sequência completa — usada por PA e raid (que já recebem a área).
    window.playSkillCinematic = function (id, tiles, opts) {
        opts = opts || {};
        const fx = getSkillFx(id);
        if (!fx) return 0;

        const lista = normalizeTiles(tiles);
        if (!lista.length) return 0;

        if (opts.playSound !== false && fx.sound && typeof playSfx === 'function') {
            try { playSfx(fx.sound); } catch (e) {}
        }

        const max = Math.min(fx.maxTiles || 16, 16);
        let alvo = lista;
        if (lista.length > max) {
            const passo = Math.ceil(lista.length / max);
            alvo = lista.filter((_, i) => i % passo === 0).slice(0, max);
        }

        alvo.forEach((tile, i) => {
            const delay = Math.min(i * (fx.stagger || 25), 400);
            spawnTileFx(fx, tile, delay, opts);
        });

        if (fx.accent && typeof STORY_FX_SPRITES !== 'undefined' && STORY_FX_SPRITES[fx.accent]) {
            const orig = (opts.target && typeof opts.target === 'object')
                ? opts.target
                : (opts.origin && typeof opts.origin === 'object')
                    ? opts.origin
                    : alvo[0];
            if (orig && Number.isInteger(orig.x) && Number.isInteger(orig.y)) {
                const ac = Object.assign({}, fx, { sprite: fx.accent, duration: 460 });
                spawnTileFx(ac, { x: orig.x, y: orig.y }, 0, opts);
            }
        }

        return alvo.length;
    };

    // ═══════════════════════════════════════════════════════════
    // 4. CONTEXTO COMPARTILHADO (evento / nações)
    // ═══════════════════════════════════════════════════════════
    let _token = 0;
    window._skillFxBegin = function (id) {
        _token++;
        window._skillFxIdentityCurrent = id || null;
        return _token;
    };
    window._skillFxEnd = function (tok) {
        if (tok === _token) window._skillFxIdentityCurrent = null;
    };

    // ═══════════════════════════════════════════════════════════
    // 5. DEBUG / TESTE
    // ═══════════════════════════════════════════════════════════
    window._debugSkillFx = function () {
        console.group('=== [FX-ID] Identidade visual ===');
        console.log('Ativo:', window._skillFxIdentityV1 === true);
        console.log('Skills mapeadas:', Object.keys(SKILL_FX).length);
        console.log('Slots com sprite:', Object.keys(SLOTS).filter(k => SLOTS[k]).length, '/', Object.keys(SLOTS).length);
        const bicho = SKILL_FX.bicho_cruz_completa;
        console.log('Bicho Folharal:', bicho ? `${bicho.sprite} / ${bicho.motion} / max ${bicho.maxTiles}` : 'sem mapa');
        console.groupEnd();
    };

    window._testSkillFx = function (id, quantidade) {
        const fx = getSkillFx(id);
        if (!fx) { console.warn('[FX-ID] skill sem mapa:', id); return; }
        const n = Math.min(quantidade || (fx.maxTiles || 15), 16);
        const tiles = [];
        for (let i = 0; i < n; i++) {
            const idx = Math.floor(Math.random() * 64);
            tiles.push(idx);
        }
        const criados = window.playSkillCinematic(id, tiles, { playSound: false });
        console.log(`[FX-ID] ${id}: ${criados} nó(s), sprite=${fx.sprite}, motion=${fx.motion}`);
        return criados;
    };

    window._skillFxNodeCount = function () {
        return document.querySelectorAll('.fx-id').length;
    };

    // Assinatura curta do PA: retrato do herói + elemento, sem GIF novo.
    window.showSkillSignature = function (active, paKey, element) {
        if (!getSkillFx(paKey) || !active) return;
        const board = document.getElementById('board');
        if (!board) return;

        const antigo = document.getElementById('fxIdSignature');
        if (antigo && antigo.parentNode) antigo.parentNode.removeChild(antigo);

        const heroData = (typeof STORY_HERO_CLASSES !== 'undefined' && STORY_HERO_CLASSES[active.class]) || {};
        const spriteKey = heroData.spriteKey;
        const heroSrc = (spriteKey && typeof SPRITES_STORY !== 'undefined' && SPRITES_STORY[spriteKey]) || '';

        const elKey = { FOGO: 'elem_fogo', AGUA: 'elem_agua', TERRA: 'elem_terra', AR: 'elem_ar' }[element];
        const elSrc = (elKey && typeof STORY_FX_SPRITES !== 'undefined' && STORY_FX_SPRITES[elKey]) || '';
        const elBadge = elSrc
            ? `<img class="fx-id-signature-el" src="${elSrc}" alt="">`
            : `<span class="fx-id-signature-el-txt">${element || ''}</span>`;

        const el = document.createElement('div');
        el.id = 'fxIdSignature';
        el.className = 'fx-id-signature';
        el.innerHTML =
            (heroSrc ? `<img src="${heroSrc}" alt="">` : '') +
            `<span class="fx-id-signature-text"><b>${heroData.displayName || active.class || 'Herói'}</b>` +
            `<small>${elBadge} PODER ANCESTRAL</small></span>`;

        const p = (typeof fxPos === 'function') ? fxPos(active.x, active.y) : { left: 0, top: 0 };
        el.style.left = (p.left + 4) + 'px';
        el.style.top = (p.top - 18) + 'px';
        board.appendChild(el);
        setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1050);
    };

    // Telegraph temático das raids — aviso fraco antes do impacto.
    window.playSkillTelegraph = function (id, tiles) {
        const fx = getSkillFx(id);
        if (!fx) return 0;
        const lista = normalizeTiles(tiles).slice(0, 16);
        lista.forEach((t, i) => {
            try {
                spawnFxAt(fx.sprite, `fx-${fx.motion}`, t.x, t.y, {
                    duration: 900 + i * 15,
                    delay: i * 15,
                    extraClass: 'fx-id fx-id-telegraph',
                });
            } catch (e) {}
        });
        return lista.length;
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [FX-ID] Identidade visual V1 instalada');
    console.log('• PA, Evento, Nações e Raids com sprite+som+CSS por skill');
    console.log('• Nunca usa triggerElementalFX por tile');
    console.log('• Máx. 16 nós por skill; mobile/reduced-motion respeitados');
    console.log('• Debug: _debugSkillFx() / _testSkillFx("bicho_cruz_completa",15)');
    console.log('═══════════════════════════════════════════════════');
})();
