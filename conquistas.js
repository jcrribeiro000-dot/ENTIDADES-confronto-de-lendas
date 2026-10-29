// =================================================================
// conquistas.js — V1.0 — Sistema de Conquistas
// =================================================================
// 70 conquistas · 7 títulos cosméticos · 8 categorias
//
// 🖼️  SUBSTITUIR POR SPRITES:
//     Todos os ícones estão em SPRITES_CONQUISTAS (topo do arquivo).
//     Cole a URL no lugar do emoji — o sistema detecta se é URL e
//     renderiza como <img>, senão usa emoji.
//
//     MAPEAMENTO DE EMOJIS USADOS (pra você trocar):
//       🏆  trophy               — ícone de troféu (geral)
//       🗺️  cat_jornada          — categoria Jornada
//       🦸  cat_herois           — categoria Heróis
//       ⚔️  cat_colecao          — categoria Coleção
//       🔥  cat_combate          — categoria Combate
//       🎉  cat_selados          — categoria Sete Selados
//       🌎  cat_nacoes           — categoria Sete Nações
//       🤝  cat_social           — categoria Social
//       😈  cat_secretas         — categoria Secretas
//       🔒  icone_bloqueada      — overlay de bloqueio
//       ✅  icone_desbloqueada   — selo de desbloqueio
//       💰  recompensa_ouro      — recompensa ouro
//       ⭐  recompensa_xp        — recompensa XP
//       🌟  recompensa_ancestral — recompensa essência ancestral
//       💎  recompensa_sombria   — recompensa essência sombria
//       🗿  titulo_purificador   — título "Purificador do Abismo"
//       👑  titulo_estrelado     — título "Estrelado"
//       🧙  titulo_filho_sete    — título "Filho das Sete"
//       🌪️  titulo_filho_vento   — título "Filho do Vento"
//       💀  titulo_domador       — título "Domador do Abismo"
//       🔥  titulo_lenda_coliseu — título "Lenda do Coliseu"
//       🎉  titulo_sete_das_sete — título "Sete das Sete"
//
// Cole no index.html:
//   <script src="conquistas.js"></script>
// (depois de aldeia.js)
// =================================================================

(function conquistasDadosV10() {
    if (window._conquistasDadosV10) return;
    window._conquistasDadosV10 = true;

    // ═══════════════════════════════════════════════════════════
    // ⭐ ÍCONES — SUBSTITUA OS EMOJIS POR URLS AQUI
    // ═══════════════════════════════════════════════════════════
    window.SPRITES_CONQUISTAS = {
        // ─── Geral ───
        'trophy':              '🏆',
        'icone_bloqueada':     '🔒',
        'icone_desbloqueada':  '✅',

        // ─── Categorias ───
        'cat_jornada':         '🗺️',
        'cat_herois':          '🦸',
        'cat_colecao':         '⚔️',
        'cat_combate':         '🔥',
        'cat_selados':         '🎉',
        'cat_nacoes':          '🌎',
        'cat_social':          '🤝',
        'cat_secretas':        '😈',

        // ─── Recompensas ───
        'recompensa_ouro':      '💰',
        'recompensa_xp':        '⭐',
        'recompensa_ancestral': '🌟',
        'recompensa_sombria':   '💎',

        // ─── Títulos ───
        'titulo_purificador':   '🗿',
        'titulo_estrelado':     '👑',
        'titulo_filho_sete':    '🧙',
        'titulo_filho_vento':   '🌪️',
        'titulo_domador':       '💀',
        'titulo_lenda_coliseu': '🔥',
        'titulo_sete_das_sete': '🎉',
    };

    // ═══════════════════════════════════════════════════════════
    // SONS (trocar pra adicionar som próprio no futuro)
    // ═══════════════════════════════════════════════════════════
    window.ACHIEVEMENT_SOUNDS = {
        comum:      'win',
        raro:       'win',
        lendario:   'win',
        // secreta: 'win', // secreta usa a mesma do nível dela
    };

    // ═══════════════════════════════════════════════════════════
    // CATEGORIAS
    // ═══════════════════════════════════════════════════════════
    window.CONQUISTAS_CATEGORIAS = {
        jornada:  { nome: 'Jornada',       emojiKey: 'cat_jornada',  cor: '#c9a227' },
        herois:   { nome: 'Heróis',        emojiKey: 'cat_herois',   cor: '#4a8cb5' },
        colecao:  { nome: 'Coleção',       emojiKey: 'cat_colecao',  cor: '#8e44ad' },
        combate:  { nome: 'Combate',       emojiKey: 'cat_combate',  cor: '#a83232' },
        selados:  { nome: 'Sete Selados',  emojiKey: 'cat_selados',  cor: '#9b59b6' },
        nacoes:   { nome: 'Sete Nações',   emojiKey: 'cat_nacoes',   cor: '#27ae60' },
        social:   { nome: 'Social',        emojiKey: 'cat_social',   cor: '#3498db' },
        secretas: { nome: 'Secretas',      emojiKey: 'cat_secretas', cor: '#e67e22' },
    };

    // ═══════════════════════════════════════════════════════════
    // TÍTULOS COSMÉTICOS (desbloqueados por conquistas lendárias)
    // ═══════════════════════════════════════════════════════════
    window.TITULOS_COSMETICOS = {
        purificador:    { id: 'purificador',    nome: 'Purificador do Abismo', emojiKey: 'titulo_purificador',   cor: '#c39bd3', conquista: 'fechar_abismo' },
        estrelado:      { id: 'estrelado',      nome: 'Estrelado',             emojiKey: 'titulo_estrelado',     cor: '#e8b923', conquista: 'estrelado' },
        filho_sete:     { id: 'filho_sete',     nome: 'Filho das Sete',        emojiKey: 'titulo_filho_sete',    cor: '#8ac070', conquista: 'filho_sete' },
        filho_vento:    { id: 'filho_vento',    nome: 'Filho do Vento',        emojiKey: 'titulo_filho_vento',   cor: '#4a8cb5', conquista: 'filho_vento' },
        domador:        { id: 'domador',        nome: 'Domador do Abismo',     emojiKey: 'titulo_domador',       cor: '#8e44ad', conquista: 'domador_abismo' },
        lenda_coliseu:  { id: 'lenda_coliseu',  nome: 'Lenda do Coliseu',      emojiKey: 'titulo_lenda_coliseu', cor: '#a83232', conquista: 'lenda_coliseu' },
        sete_das_sete:  { id: 'sete_das_sete',  nome: 'Sete das Sete',         emojiKey: 'titulo_sete_das_sete', cor: '#27ae60', conquista: 'sete_das_sete' },
    };

    // ═══════════════════════════════════════════════════════════
    // HELPERS (usados nos conditions)
    // ═══════════════════════════════════════════════════════════
    const _totalFases = () => {
        if (typeof STORY_CHAPTERS === 'undefined') return 64;
        let n = 0;
        for (const cid in STORY_CHAPTERS) n += STORY_CHAPTERS[cid].phases.length;
        return n;
    };
    const _starsNaDiff = (diff) => {
        const d = STORY_PROGRESS?.difficultyProgress?.[diff]?.stars || {};
        let n = 0;
        for (const id in d) if ((d[id] || 0) >= 3) n++;
        return n;
    };
    const _armasNormais = () => {
        if (!Array.isArray(STORY_PROGRESS?.craftedWeapons)) return 0;
        if (typeof STORY_WEAPONS === 'undefined') return 0;
        const bases = new Set();
        STORY_PROGRESS.craftedWeapons.forEach(uid => {
            const base = String(uid).split('#')[0];
            if (STORY_WEAPONS[base]) bases.add(base);
        });
        return bases.size;
    };
    const _armasEvento = () => {
        if (!Array.isArray(STORY_PROGRESS?.craftedWeapons)) return 0;
        if (typeof EVENTO_ARMAS === 'undefined') return 0;
        const bases = new Set();
        STORY_PROGRESS.craftedWeapons.forEach(uid => {
            const base = String(uid).split('#')[0];
            if (EVENTO_ARMAS[base]) bases.add(base);
        });
        return bases.size;
    };
    const _amuletosNormais = () => {
        if (!Array.isArray(STORY_PROGRESS?.craftedAmulets)) return 0;
        if (typeof STORY_AMULETS === 'undefined') return 0;
        const bases = new Set();
        STORY_PROGRESS.craftedAmulets.forEach(uid => {
            const base = String(uid).split('#')[0];
            if (STORY_AMULETS[base]) bases.add(base);
        });
        return bases.size;
    };
    const _heroisDesbloqueados = () =>
        Array.isArray(STORY_PROGRESS?.unlockedHeroesStory) ? STORY_PROGRESS.unlockedHeroesStory.length : 0;
    const _heroisNivel11 = () => {
        if (!STORY_PROGRESS?.heroLevels) return 0;
        let n = 0;
        for (const hc in STORY_PROGRESS.heroLevels) if (STORY_PROGRESS.heroLevels[hc] >= 11) n++;
        return n;
    };
    const _heroisNivel10mais = () => {
        if (!STORY_PROGRESS?.heroLevels) return 0;
        let n = 0;
        for (const hc in STORY_PROGRESS.heroLevels) if (STORY_PROGRESS.heroLevels[hc] >= 10) n++;
        return n;
    };
    const _nacoesCompletas = () => {
        const prog = STORY_PROGRESS?.nacaoProgressoPorDificuldade || {};
        const uniq = new Set();
        for (const diff of ['normal', 'dificil', 'pesadelo']) {
            const bucket = prog[diff] || {};
            for (const id in bucket) {
                if ((bucket[id].fasesConcluidas || []).length >= 3) uniq.add(id);
            }
        }
        return uniq.size;
    };
    const _nacoesCompletasNaDiff = (diff) => {
        const bucket = STORY_PROGRESS?.nacaoProgressoPorDificuldade?.[diff] || {};
        let n = 0;
        for (const id in bucket) if ((bucket[id].fasesConcluidas || []).length >= 3) n++;
        return n;
    };
    const _bossesEventoDerrotados = () => {
        const ids = ['teju_jagua','mboi_tui','monai','jasy_jatere','kurupi','ao_ao','luison'];
        const prog = STORY_PROGRESS?.eventoProgresso || {};
        return ids.filter(id => (prog[id]?.fasesConcluidas || []).includes('boss')).length;
    };
    const _stat = (key, def) => (STORY_PROGRESS?.achievementStats?.[key] ?? def);

    // ═══════════════════════════════════════════════════════════
    // AS 70 CONQUISTAS
    // ═══════════════════════════════════════════════════════════
    window.ACHIEVEMENTS = [
        // ═══════════════════════════════════════════════════════
        // 🗺️ JORNADA (13)
        // ═══════════════════════════════════════════════════════
        { id: 'primeiro_passo', categoria: 'jornada', raridade: 'comum',
          nome: 'Primeiro Passo', desc: 'Vença a primeira fase do Modo História.',
          condicao: () => (STORY_PROGRESS?.phasesEverCompleted || []).includes('1-1'),
          recompensa: { ouro: 100, xp: 50 } },

        { id: 'purificador', categoria: 'jornada', raridade: 'comum',
          nome: 'Purificador', desc: 'Derrote o Saci no Ato 1.',
          condicao: () => (STORY_PROGRESS?.bossesDefeated || []).includes('saci'),
          recompensa: { ouro: 200, xp: 100 } },

        { id: 'fechar_abismo', categoria: 'jornada', raridade: 'lendario',
          nome: 'Fechar o Abismo', desc: 'Derrote Anhangá no Ato 13.',
          condicao: () => (STORY_PROGRESS?.bossesDefeated || []).includes('anhanga'),
          recompensa: { ouro: 2000, xp: 1000, essenciaAncestral: 10, essenciaSombria: 10 } },

        { id: 'incansavel', categoria: 'jornada', raridade: 'raro',
          nome: 'Incansável', desc: 'Zere os 13 atos no Normal.',
          condicao: () => (STORY_PROGRESS?.clearedDifficulties || []).includes('normal'),
          recompensa: { ouro: 800, xp: 500, essenciaAncestral: 5 } },

        { id: 'sem_piedade', categoria: 'jornada', raridade: 'lendario',
          nome: 'Sem Piedade', desc: 'Zere os 13 atos no Difícil.',
          condicao: () => (STORY_PROGRESS?.clearedDifficulties || []).includes('dificil'),
          recompensa: { ouro: 1500, xp: 800, essenciaAncestral: 15 } },

        { id: 'lenda_viva', categoria: 'jornada', raridade: 'lendario',
          nome: 'Lenda Viva', desc: 'Zere os 13 atos no Pesadelo.',
          condicao: () => (STORY_PROGRESS?.clearedDifficulties || []).includes('pesadelo'),
          recompensa: { ouro: 3000, xp: 1500, essenciaAncestral: 25 } },

        { id: 'perfeccionista_1', categoria: 'jornada', raridade: 'raro',
          nome: 'Perfeccionista I', desc: 'Todas as fases com 3 estrelas no Normal.',
          condicao: () => _starsNaDiff('normal') >= _totalFases(),
          progresso: () => ({ atual: _starsNaDiff('normal'), meta: _totalFases() }),
          recompensa: { ouro: 800, xp: 400 } },

        { id: 'perfeccionista_2', categoria: 'jornada', raridade: 'raro',
          nome: 'Perfeccionista II', desc: 'Todas as fases com 3 estrelas no Difícil.',
          condicao: () => _starsNaDiff('dificil') >= _totalFases(),
          progresso: () => ({ atual: _starsNaDiff('dificil'), meta: _totalFases() }),
          recompensa: { ouro: 1000, xp: 500 } },

        { id: 'perfeccionista_3', categoria: 'jornada', raridade: 'lendario',
          nome: 'Perfeccionista III', desc: 'Todas as fases com 3 estrelas no Pesadelo.',
          condicao: () => _starsNaDiff('pesadelo') >= _totalFases(),
          progresso: () => ({ atual: _starsNaDiff('pesadelo'), meta: _totalFases() }),
          recompensa: { ouro: 2000, xp: 1000 } },

        { id: 'estrelado', categoria: 'jornada', raridade: 'lendario',
          nome: 'Estrelado', desc: 'Todas as estrelas possíveis (576/576).',
          condicao: () => {
              const total = (typeof getTotalStars === 'function') ? getTotalStars() : 0;
              const max = (typeof getMaxTotalStars === 'function') ? getMaxTotalStars() : 576;
              return max > 0 && total >= max;
          },
          progresso: () => {
              const total = (typeof getTotalStars === 'function') ? getTotalStars() : 0;
              const max = (typeof getMaxTotalStars === 'function') ? getMaxTotalStars() : 576;
              return { atual: total, meta: max };
          },
          recompensa: { ouro: 5000, xp: 2000, essenciaAncestral: 15, essenciaSombria: 15 } },

        { id: 'anhanga_slayer', categoria: 'jornada', raridade: 'comum',
          nome: 'Anhangá Slayer', desc: 'Derrote Anhangá ao menos uma vez.',
          condicao: () => (STORY_PROGRESS?.achievementStats?.anhangáKilledBy || []).length >= 1,
          progresso: () => ({ atual: (STORY_PROGRESS?.achievementStats?.anhangáKilledBy || []).length, meta: 1 }),
          recompensa: { ouro: 500, xp: 200, materiais: [{ id: 'fragmento_abismo', qty: 2 }, { id: 'essencia_anhanga', qty: 1 }] } },

        { id: 'domador_abismo', categoria: 'jornada', raridade: 'raro',
          nome: 'Domador do Abismo', desc: 'Derrote Anhangá com 5 heróis diferentes.',
          condicao: () => (STORY_PROGRESS?.achievementStats?.anhangáKilledBy || []).length >= 5,
          progresso: () => ({ atual: (STORY_PROGRESS?.achievementStats?.anhangáKilledBy || []).length, meta: 5 }),
          recompensa: { ouro: 1000, xp: 500, materiais: [{ id: 'fragmento_abismo', qty: 3 }, { id: 'essencia_anhanga', qty: 2 }] } },

        { id: 'lenda_abismo', categoria: 'jornada', raridade: 'lendario',
          nome: 'Lenda do Abismo', desc: 'Derrote Anhangá com 10 heróis diferentes.',
          condicao: () => (STORY_PROGRESS?.achievementStats?.anhangáKilledBy || []).length >= 10,
          progresso: () => ({ atual: (STORY_PROGRESS?.achievementStats?.anhangáKilledBy || []).length, meta: 10 }),
          recompensa: { ouro: 2500, xp: 1200, materiais: [{ id: 'fragmento_abismo', qty: 5 }, { id: 'essencia_anhanga', qty: 3 }] } },

        // ═══════════════════════════════════════════════════════
        // 🦸 HERÓIS (10)
        // ═══════════════════════════════════════════════════════
        { id: 'reunidos', categoria: 'herois', raridade: 'comum',
          nome: 'Reunidos', desc: '10 heróis desbloqueados.',
          condicao: () => _heroisDesbloqueados() >= 10,
          progresso: () => ({ atual: _heroisDesbloqueados(), meta: 10 }),
          recompensa: { ouro: 300, xp: 150 } },

        { id: 'elenco_completo', categoria: 'herois', raridade: 'lendario',
          nome: 'Elenco Completo', desc: 'Todos os heróis desbloqueados.',
          condicao: () => {
              if (typeof STORY_HERO_CLASSES === 'undefined') return false;
              const total = Object.keys(STORY_HERO_CLASSES).length;
              return _heroisDesbloqueados() >= total && total > 0;
          },
          progresso: () => ({
              atual: _heroisDesbloqueados(),
              meta: (typeof STORY_HERO_CLASSES !== 'undefined') ? Object.keys(STORY_HERO_CLASSES).length : 0,
          }),
          recompensa: { ouro: 3000, xp: 1500, essenciaAncestral: 10, essenciaSombria: 10 } },

        { id: 'mestre', categoria: 'herois', raridade: 'comum',
          nome: 'Mestre', desc: 'Um herói no nível 10.',
          condicao: () => _heroisNivel10mais() >= 1,
          recompensa: { ouro: 300, xp: 100 } },

        { id: 'ascendido', categoria: 'herois', raridade: 'raro',
          nome: 'Ascendido', desc: 'Um herói no nível 11 (stat aleatório).',
          condicao: () => _heroisNivel11() >= 1,
          recompensa: { ouro: 800, xp: 400, essenciaAncestral: 3 } },

        { id: 'panteao', categoria: 'herois', raridade: 'raro',
          nome: 'Panteão', desc: '5 heróis no nível 11.',
          condicao: () => _heroisNivel11() >= 5,
          progresso: () => ({ atual: _heroisNivel11(), meta: 5 }),
          recompensa: { ouro: 1200, xp: 600, essenciaAncestral: 8 } },

        { id: 'todos_ascendidos', categoria: 'herois', raridade: 'lendario',
          nome: 'Todos Ascendidos', desc: 'Todos os heróis no nível 11.',
          condicao: () => {
              if (typeof STORY_HERO_CLASSES === 'undefined') return false;
              const total = Object.keys(STORY_HERO_CLASSES).length;
              return _heroisNivel11() >= total && total > 0;
          },
          progresso: () => ({
              atual: _heroisNivel11(),
              meta: (typeof STORY_HERO_CLASSES !== 'undefined') ? Object.keys(STORY_HERO_CLASSES).length : 0,
          }),
          recompensa: { ouro: 5000, xp: 2000, essenciaAncestral: 30 } },

        { id: 'jackpot', categoria: 'herois', raridade: 'raro',
          nome: 'Jackpot', desc: 'Role um stat tier Jackpot no nível 11.',
          condicao: () => _stat('jackpotsRolled', 0) >= 1,
          recompensa: { ouro: 500, xp: 200 } },

        { id: 'sortudo', categoria: 'herois', raridade: 'lendario',
          nome: 'Sortudo', desc: 'Role 3 stats Jackpot no total.',
          condicao: () => _stat('jackpotsRolled', 0) >= 3,
          progresso: () => ({ atual: _stat('jackpotsRolled', 0), meta: 3 }),
          recompensa: { ouro: 1500, xp: 500, essenciaAncestral: 10 } },

        { id: 'filho_sete', categoria: 'herois', raridade: 'lendario',
          nome: 'Filho das Sete', desc: 'Desbloqueie Abya.',
          condicao: () => STORY_PROGRESS?.abyaDesbloqueado === true,
          recompensa: { ouro: 2000, xp: 1000, essenciaAncestral: 15 } },

        { id: 'filho_vento', categoria: 'herois', raridade: 'lendario',
          nome: 'Filho do Vento', desc: 'Desbloqueie Rudá.',
          condicao: () => STORY_PROGRESS?.eventoRudaDesbloqueado === true,
          recompensa: { ouro: 2000, xp: 1000, essenciaSombria: 15 } },

        // ═══════════════════════════════════════════════════════
        // ⚔️ COLEÇÃO (10)
        // ═══════════════════════════════════════════════════════
        { id: 'primeira_forja', categoria: 'colecao', raridade: 'comum',
          nome: 'Primeira Forja', desc: 'Forje uma arma pela primeira vez.',
          condicao: () => _armasNormais() >= 1,
          recompensa: { ouro: 100, xp: 50 } },

        { id: 'armeiro', categoria: 'colecao', raridade: 'raro',
          nome: 'Armeiro', desc: 'Forje 10 armas normais.',
          condicao: () => _armasNormais() >= 10,
          progresso: () => ({ atual: _armasNormais(), meta: 10 }),
          recompensa: { ouro: 800, xp: 400 } },

        { id: 'ferreiro_lendario', categoria: 'colecao', raridade: 'lendario',
          nome: 'Ferreiro Lendário', desc: 'Forje todas as 21 armas normais.',
          condicao: () => _armasNormais() >= 21,
          progresso: () => ({ atual: _armasNormais(), meta: 21 }),
          recompensa: { ouro: 3000, xp: 1500, essenciaAncestral: 15 } },

        { id: 'forjador_evento', categoria: 'colecao', raridade: 'raro',
          nome: 'Forjador do Evento', desc: 'Forje uma arma do Evento.',
          condicao: () => _armasEvento() >= 1,
          recompensa: { ouro: 500, xp: 200, essenciaSombria: 3 } },

        { id: 'ferreiro_evento', categoria: 'colecao', raridade: 'lendario',
          nome: 'Ferreiro do Evento', desc: 'Forje todas as 21 armas do Evento.',
          condicao: () => _armasEvento() >= 21,
          progresso: () => ({ atual: _armasEvento(), meta: 21 }),
          recompensa: { ouro: 3000, xp: 1500, essenciaSombria: 20 } },

        { id: 'colecionador', categoria: 'colecao', raridade: 'raro',
          nome: 'Colecionador', desc: 'Forje 7 amuletos normais.',
          condicao: () => _amuletosNormais() >= 7,
          progresso: () => ({ atual: _amuletosNormais(), meta: 7 }),
          recompensa: { ouro: 800, xp: 400 } },

        { id: 'coracao_frio', categoria: 'colecao', raridade: 'lendario',
          nome: 'Coração Frio', desc: 'Obtenha o Coração do Vazio.',
          condicao: () => {
              const arr = STORY_PROGRESS?.craftedAmulets || [];
              return arr.some(id => String(id).split('#')[0] === 'coracao_vazio');
          },
          recompensa: { ouro: 2000, xp: 1000, essenciaSombria: 10 } },

        { id: 'fragmento_abismo', categoria: 'colecao', raridade: 'comum',
          nome: 'Fragmento do Abismo', desc: 'Consiga um Núcleo do Abismo.',
          condicao: () => (STORY_PROGRESS?.inventory?.['nucleo_abismo'] || 0) >= 1,
          recompensa: { ouro: 300, xp: 100 } },

        { id: 'heranca_ancestral', categoria: 'colecao', raridade: 'raro',
          nome: 'Herança Ancestral', desc: 'Reúna os 7 Fragmentos das Sete Nações.',
          condicao: () => (STORY_PROGRESS?.nacaoFragmentos || []).length >= 7,
          progresso: () => ({ atual: (STORY_PROGRESS?.nacaoFragmentos || []).length, meta: 7 }),
          recompensa: { ouro: 1000, xp: 500, essenciaAncestral: 5 } },

        { id: 'heranca_divina', categoria: 'colecao', raridade: 'raro',
          nome: 'Herança Divina', desc: 'Reúna os 7 Fragmentos Divinos do Evento.',
          condicao: () => (STORY_PROGRESS?.eventoFragmentos || []).length >= 7,
          progresso: () => ({ atual: (STORY_PROGRESS?.eventoFragmentos || []).length, meta: 7 }),
          recompensa: { ouro: 1000, xp: 500, essenciaSombria: 5 } },

        // ═══════════════════════════════════════════════════════
        // 🔥 COMBATE (12)
        // ═══════════════════════════════════════════════════════
        { id: 'primeira_forma', categoria: 'combate', raridade: 'comum',
          nome: 'Primeira Forma', desc: 'Execute uma forma LINHA.',
          condicao: () => (_stat('formasFeitas', {})?.LINHA || 0) >= 1,
          recompensa: { ouro: 100, xp: 50 } },

        { id: 'geometra', categoria: 'combate', raridade: 'raro',
          nome: 'Geômetra', desc: 'Execute as 4 formas (Linha, L, Zigzag, Quadrado).',
          condicao: () => {
              const f = _stat('formasFeitas', {}) || {};
              return (f.LINHA || 0) >= 1 && (f.L || 0) >= 1 && (f.ZIGZAG || 0) >= 1 && (f.QUADRADO || 0) >= 1;
          },
          progresso: () => {
              const f = _stat('formasFeitas', {}) || {};
              const nomes = ['LINHA','L','ZIGZAG','QUADRADO'];
              const feito = nomes.filter(n => (f[n] || 0) >= 1).length;
              return { atual: feito, meta: 4 };
          },
          recompensa: { ouro: 600, xp: 300 } },

        { id: 'chain_10', categoria: 'combate', raridade: 'comum',
          nome: 'Chain 10', desc: 'Um Bravely de 10+ tiles.',
          condicao: () => _stat('maxBravelyTiles', 0) >= 10,
          recompensa: { ouro: 300, xp: 100 } },

        { id: 'chain_master', categoria: 'combate', raridade: 'raro',
          nome: 'Chain Master', desc: 'Um Bravely de 20+ tiles.',
          condicao: () => _stat('maxBravelyTiles', 0) >= 20,
          recompensa: { ouro: 800, xp: 400 } },

        { id: 'chain_lendario', categoria: 'combate', raridade: 'lendario',
          nome: 'Chain Lendário', desc: 'Um Bravely de 30+ tiles.',
          condicao: () => _stat('maxBravelyTiles', 0) >= 30,
          recompensa: { ouro: 2000, xp: 1000, essenciaAncestral: 10 } },

        { id: 'aniquilador', categoria: 'combate', raridade: 'raro',
          nome: 'Aniquilador', desc: 'Um único golpe com 15+ de overkill.',
          condicao: () => _stat('maxOverkill', 0) >= 15,
          progresso: () => ({ atual: _stat('maxOverkill', 0), meta: 15 }),
          recompensa: { ouro: 800, xp: 400 } },

        { id: 'solo_sagrado', categoria: 'combate', raridade: 'comum',
          nome: 'Solo Sagrado', desc: 'Limpe uma corrupção com Solo Sagrado.',
          condicao: () => _stat('corruptedCleared', 0) >= 1,
          recompensa: { ouro: 200, xp: 100 } },

        { id: 'corrupcao_zero', categoria: 'combate', raridade: 'raro',
          nome: 'Corrupção Zero', desc: 'Limpe 10 tiles corrompidos no total.',
          condicao: () => _stat('corruptedCleared', 0) >= 10,
          progresso: () => ({ atual: _stat('corruptedCleared', 0), meta: 10 }),
          recompensa: { ouro: 800, xp: 400 } },

        { id: 'sussurro_silenciado', categoria: 'combate', raridade: 'raro',
          nome: 'Sussurro Silenciado', desc: 'Anhanga-Mirim purifica corrupção com o PA.',
          condicao: () => _stat('anhangaMirimPurificou', false) === true,
          recompensa: { ouro: 1000, xp: 500 } },

        { id: 'curupira_perfeito', categoria: 'combate', raridade: 'raro',
          nome: 'Curupira Perfeito', desc: 'Use o PA do Curupira com 10 tiles.',
          condicao: () => _stat('curupiraPerfect', false) === true,
          recompensa: { ouro: 600, xp: 300 } },

        { id: 'mae_mata_cura', categoria: 'combate', raridade: 'raro',
          nome: 'Cura em Área', desc: 'Mãe da Mata cura 3+ heróis com um único PA.',
          condicao: () => _stat('maeMataCurou3', false) === true,
          recompensa: { ouro: 800, xp: 400 } },

        { id: 'negrinho_milagreiro', categoria: 'combate', raridade: 'lendario',
          nome: 'Negrinho Milagreiro', desc: 'Reviva com Negrinho do Pastoreio.',
          condicao: () => _stat('negrinhoRevived', false) === true,
          recompensa: { ouro: 1500, xp: 800, essenciaSombria: 5, essenciaAncestral: 5 } },

        // ═══════════════════════════════════════════════════════
        // 🎉 SETE SELADOS (8)
        // ═══════════════════════════════════════════════════════
        { id: 'primeiro_selo', categoria: 'selados', raridade: 'comum',
          nome: 'Primeiro Selo', desc: 'Derrote o primeiro boss do Evento.',
          condicao: () => _bossesEventoDerrotados() >= 1,
          recompensa: { ouro: 200, xp: 100, essenciaSombria: 3 } },

        { id: 'ciclo_completo', categoria: 'selados', raridade: 'raro',
          nome: 'Ciclo Completo', desc: 'Derrote os 7 bosses do Evento.',
          condicao: () => _bossesEventoDerrotados() >= 7,
          progresso: () => ({ atual: _bossesEventoDerrotados(), meta: 7 }),
          recompensa: { ouro: 1500, xp: 800, essenciaSombria: 15 } },

        { id: 'pesadelo', categoria: 'selados', raridade: 'lendario',
          nome: 'Pesadelo', desc: 'Derrote o Pesadelo mensal.',
          condicao: () => {
              const p = STORY_PROGRESS?.eventoProgresso?.['pesadelo'];
              return (p?.fasesConcluidas || []).includes('boss');
          },
          recompensa: { ouro: 3000, xp: 1500, essenciaSombria: 30 } },

        { id: 'armas_evento_7', categoria: 'selados', raridade: 'raro',
          nome: 'Armas do Evento', desc: 'Forje 7 armas do Evento.',
          condicao: () => _armasEvento() >= 7,
          progresso: () => ({ atual: _armasEvento(), meta: 7 }),
          recompensa: { ouro: 800, xp: 400, essenciaSombria: 5 } },

        { id: 'fragmentos_divinos', categoria: 'selados', raridade: 'raro',
          nome: 'Fragmentos Divinos', desc: 'Reúna 7 Fragmentos Divinos.',
          condicao: () => (STORY_PROGRESS?.eventoFragmentos || []).length >= 7,
          progresso: () => ({ atual: (STORY_PROGRESS?.eventoFragmentos || []).length, meta: 7 }),
          recompensa: { ouro: 1000, xp: 500, essenciaSombria: 5 } },

        { id: 'chaves_master', categoria: 'selados', raridade: 'comum',
          nome: 'Chaves Master', desc: 'Use 30 chaves no total.',
          condicao: () => _stat('chavesUsed', 0) >= 30,
          progresso: () => ({ atual: _stat('chavesUsed', 0), meta: 30 }),
          recompensa: { ouro: 400, xp: 200, essenciaSombria: 3 } },

        { id: 'cacador_lendas', categoria: 'selados', raridade: 'lendario',
          nome: 'Caçador de Lendas', desc: 'Forje todas as 21 armas do Evento.',
          condicao: () => _armasEvento() >= 21,
          progresso: () => ({ atual: _armasEvento(), meta: 21 }),
          recompensa: { ouro: 3000, xp: 1500, essenciaSombria: 25 } },

        { id: 'coracao_noite', categoria: 'selados', raridade: 'raro',
          nome: 'Semente do Vento', desc: 'Compre uma Semente do Vento.',
          condicao: () => _stat('sementeVentoCompras', 0) >= 1,
          recompensa: { ouro: 800, xp: 400, essenciaSombria: 5 } },

        // ═══════════════════════════════════════════════════════
        // 🌎 SETE NAÇÕES (7)
        // ═══════════════════════════════════════════════════════
        { id: 'primeira_nacao', categoria: 'nacoes', raridade: 'comum',
          nome: 'Primeira Nação', desc: 'Complete as 3 fases de uma Nação.',
          condicao: () => _nacoesCompletas() >= 1,
          recompensa: { ouro: 300, xp: 100, essenciaAncestral: 3 } },

        { id: 'sete_das_sete', categoria: 'nacoes', raridade: 'raro',
          nome: 'Sete das Sete', desc: 'Complete as 7 Nações.',
          condicao: () => _nacoesCompletas() >= 7,
          progresso: () => ({ atual: _nacoesCompletas(), meta: 7 }),
          recompensa: { ouro: 1500, xp: 800, essenciaAncestral: 15 } },

        { id: 'nacao_dificil', categoria: 'nacoes', raridade: 'raro',
          nome: 'Nação no Difícil', desc: 'Complete uma Nação no Difícil.',
          condicao: () => _nacoesCompletasNaDiff('dificil') >= 1,
          recompensa: { ouro: 800, xp: 400, essenciaAncestral: 5 } },

        { id: 'nacao_pesadelo', categoria: 'nacoes', raridade: 'lendario',
          nome: 'Nação no Pesadelo', desc: 'Complete uma Nação no Pesadelo.',
          condicao: () => _nacoesCompletasNaDiff('pesadelo') >= 1,
          recompensa: { ouro: 2000, xp: 1000, essenciaAncestral: 15 } },

        { id: 'todas_dificil', categoria: 'nacoes', raridade: 'lendario',
          nome: 'Todas no Difícil', desc: 'Complete as 7 Nações no Difícil.',
          condicao: () => _nacoesCompletasNaDiff('dificil') >= 7,
          progresso: () => ({ atual: _nacoesCompletasNaDiff('dificil'), meta: 7 }),
          recompensa: { ouro: 3000, xp: 1500, essenciaAncestral: 30 } },

        { id: 'todas_pesadelo', categoria: 'nacoes', raridade: 'lendario',
          nome: 'Todas no Pesadelo', desc: 'Complete as 7 Nações no Pesadelo.',
          condicao: () => _nacoesCompletasNaDiff('pesadelo') >= 7,
          progresso: () => ({ atual: _nacoesCompletasNaDiff('pesadelo'), meta: 7 }),
          recompensa: { ouro: 5000, xp: 2000, essenciaAncestral: 50 } },

        { id: 'explorador_nacoes', categoria: 'nacoes', raridade: 'comum',
          nome: 'Explorador das Nações', desc: 'Jogue ao menos 1 fase em cada uma das 7 Nações.',
          condicao: () => {
              const prog = STORY_PROGRESS?.nacaoProgressoPorDificuldade || {};
              const uniq = new Set();
              for (const diff of ['normal','dificil','pesadelo']) {
                  const bucket = prog[diff] || {};
                  for (const id in bucket) {
                      if ((bucket[id].fasesConcluidas || []).length > 0) uniq.add(id);
                  }
              }
              return uniq.size >= 7;
          },
          progresso: () => {
              const prog = STORY_PROGRESS?.nacaoProgressoPorDificuldade || {};
              const uniq = new Set();
              for (const diff of ['normal','dificil','pesadelo']) {
                  const bucket = prog[diff] || {};
                  for (const id in bucket) {
                      if ((bucket[id].fasesConcluidas || []).length > 0) uniq.add(id);
                  }
              }
              return { atual: uniq.size, meta: 7 };
          },
          recompensa: { ouro: 400, xp: 200, essenciaAncestral: 3 } },

        // ═══════════════════════════════════════════════════════
        // 🤝 SOCIAL (5)
        // ═══════════════════════════════════════════════════════
        { id: 'duelista', categoria: 'social', raridade: 'comum',
          nome: 'Duelista', desc: 'Vença 10 batalhas PvP.',
          condicao: () => _stat('pvpVitorias', 0) >= 10,
          progresso: () => ({ atual: _stat('pvpVitorias', 0), meta: 10 }),
          recompensa: { ouro: 300, xp: 100, essenciaSombria: 3 } },

        { id: 'gladiador', categoria: 'social', raridade: 'raro',
          nome: 'Gladiador', desc: 'Vença 50 batalhas PvP.',
          condicao: () => _stat('pvpVitorias', 0) >= 50,
          progresso: () => ({ atual: _stat('pvpVitorias', 0), meta: 50 }),
          recompensa: { ouro: 1500, xp: 800, essenciaSombria: 10 } },

        { id: 'lenda_coliseu', categoria: 'social', raridade: 'lendario',
          nome: 'Lenda do Coliseu', desc: 'Vença 100 batalhas PvP.',
          condicao: () => _stat('pvpVitorias', 0) >= 100,
          progresso: () => ({ atual: _stat('pvpVitorias', 0), meta: 100 }),
          recompensa: { ouro: 3000, xp: 1500, essenciaSombria: 20 } },

        { id: 'em_sintonia', categoria: 'social', raridade: 'raro',
          nome: 'Em Sintonia', desc: 'Vença um Coop sem nenhum herói morrer.',
          condicao: () => _stat('coopSemMorte', 0) >= 1,
          recompensa: { ouro: 800, xp: 400, essenciaSombria: 5 } },

        { id: 'aliado', categoria: 'social', raridade: 'comum',
          nome: 'Aliado', desc: 'Jogue 10 partidas Coop.',
          condicao: () => _stat('coopVitorias', 0) >= 10,
          progresso: () => ({ atual: _stat('coopVitorias', 0), meta: 10 }),
          recompensa: { ouro: 300, xp: 100, essenciaSombria: 3 } },

        // ═══════════════════════════════════════════════════════
        // 😈 SECRETAS (5) — mostram ??? até desbloquear
        // ═══════════════════════════════════════════════════════
        { id: 'pacifista', categoria: 'secretas', raridade: 'raro', secreta: true,
          nome: 'Pacifista', descSecreta: 'Um feito estranho…',
          desc: 'Vença uma fase sem usar Solo Sagrado.',
          condicao: () => _stat('pacifistaVit', 0) >= 1,
          recompensa: { ouro: 500, xp: 200 } },

        { id: 'coracao_partido', categoria: 'secretas', raridade: 'lendario', secreta: true,
          nome: 'Coração Partido', descSecreta: 'Um feito estranho…',
          desc: 'Quebre o Coração do Vazio.',
          condicao: () => _stat('coracaoQuebrado', false) === true,
          recompensa: { ouro: 1000, xp: 500, essenciaSombria: 5 } },

        { id: 'madrugador', categoria: 'secretas', raridade: 'comum', secreta: true,
          nome: 'Madrugador', descSecreta: 'Um feito estranho…',
          desc: 'Vença uma fase antes das 6h.',
          condicao: () => _stat('madrugador', false) === true,
          recompensa: { ouro: 500, xp: 200 } },

        { id: 'noturno', categoria: 'secretas', raridade: 'comum', secreta: true,
          nome: 'Noturno', descSecreta: 'Um feito estranho…',
          desc: 'Vença uma fase depois das 23h.',
          condicao: () => _stat('noturno', false) === true,
          recompensa: { ouro: 500, xp: 200 } },

        { id: 'kamikaze', categoria: 'secretas', raridade: 'comum', secreta: true,
          nome: 'Kamikaze', descSecreta: 'Um feito estranho…',
          desc: 'Perca 10 vezes.',
          condicao: () => _stat('defeats', 0) >= 10,
          progresso: () => ({ atual: _stat('defeats', 0), meta: 10 }),
          recompensa: { ouro: 500, xp: 200 } },
    ];

    console.log(`✅ [conquistas] ${window.ACHIEVEMENTS.length} conquistas carregadas.`);
})();
// =================================================================
// conquistas.js — PARTE 2/4 — ENGINE
// =================================================================
(function conquistasEngineV10() {
    if (window._conquistasEngineV10) return;
    window._conquistasEngineV10 = true;

    const ACH = window.ACHIEVEMENTS;
    const TITULOS = window.TITULOS_COSMETICOS;
    const SONS = window.ACHIEVEMENT_SOUNDS;

    // ─────────────────────────────────────────────────────────────
    // ESTRUTURA NO SAVE
    // ─────────────────────────────────────────────────────────────
    function _garantirEstrutura() {
        if (typeof STORY_PROGRESS === 'undefined') return;
        if (!STORY_PROGRESS.achievements || typeof STORY_PROGRESS.achievements !== 'object') {
            STORY_PROGRESS.achievements = {};
        }
        if (!STORY_PROGRESS.achievementStats || typeof STORY_PROGRESS.achievementStats !== 'object') {
            STORY_PROGRESS.achievementStats = {};
        }
        const st = STORY_PROGRESS.achievementStats;
        // Inicializa defaults sem sobrescrever
        if (!Array.isArray(st.anhangáKilledBy))          st.anhangáKilledBy = [];
        if (typeof st.pvpVitorias !== 'number')          st.pvpVitorias = 0;
        if (typeof st.coopVitorias !== 'number')         st.coopVitorias = 0;
        if (typeof st.coopSemMorte !== 'number')         st.coopSemMorte = 0;
        if (typeof st._coopMorteThisBattle !== 'boolean')st._coopMorteThisBattle = false;
        if (typeof st.jackpotsRolled !== 'number')       st.jackpotsRolled = 0;
        if (typeof st.corruptedCleared !== 'number')     st.corruptedCleared = 0;
        if (!st.formasFeitas || typeof st.formasFeitas !== 'object') {
            st.formasFeitas = { LINHA: 0, L: 0, ZIGZAG: 0, QUADRADO: 0 };
        }
        if (typeof st.maxBravelyTiles !== 'number')      st.maxBravelyTiles = 0;
        if (typeof st.maxOverkill !== 'number')          st.maxOverkill = 0;
        if (typeof st.chavesUsed !== 'number')           st.chavesUsed = 0;
        if (typeof st.defeats !== 'number')              st.defeats = 0;
        if (typeof st.pacifistaVit !== 'number')         st.pacifistaVit = 0;
        if (typeof st.negrinhoRevived !== 'boolean')     st.negrinhoRevived = false;
        if (typeof st.anhangaMirimPurificou !== 'boolean') st.anhangaMirimPurificou = false;
        if (typeof st.curupiraPerfect !== 'boolean')     st.curupiraPerfect = false;
        if (typeof st.maeMataCurou3 !== 'boolean')       st.maeMataCurou3 = false;
        if (typeof st.coracaoQuebrado !== 'boolean')     st.coracaoQuebrado = false;
        if (typeof st.madrugador !== 'boolean')          st.madrugador = false;
        if (typeof st.noturno !== 'boolean')             st.noturno = false;
        if (typeof st.sementeVentoCompras !== 'number')  st.sementeVentoCompras = 0;

        if (!Array.isArray(STORY_PROGRESS.titlesOwned))   STORY_PROGRESS.titlesOwned = [];
        if (typeof STORY_PROGRESS.activeTitle === 'undefined') STORY_PROGRESS.activeTitle = null;
    }

    // ─────────────────────────────────────────────────────────────
    // UNLOCK
    // ─────────────────────────────────────────────────────────────
    function isUnlocked(id) {
        return !!(STORY_PROGRESS?.achievements?.[id]);
    }
    window.isAchievementUnlocked = isUnlocked;

    function _darRecompensas(rec) {
        if (!rec) return;
        if (rec.ouro) STORY_PROGRESS.gold = (STORY_PROGRESS.gold || 0) + rec.ouro;
        if (rec.xp)   STORY_PROGRESS.totalXP = (STORY_PROGRESS.totalXP || 0) + rec.xp;
        if (!STORY_PROGRESS.inventory) STORY_PROGRESS.inventory = {};
        if (rec.essenciaAncestral) {
            STORY_PROGRESS.inventory['essencia_ancestral'] =
                (STORY_PROGRESS.inventory['essencia_ancestral'] || 0) + rec.essenciaAncestral;
        }
        if (rec.essenciaSombria) {
            STORY_PROGRESS.inventory['essencia_sombria'] =
                (STORY_PROGRESS.inventory['essencia_sombria'] || 0) + rec.essenciaSombria;
        }
        if (Array.isArray(rec.materiais)) {
            rec.materiais.forEach(m => {
                if (!m || !m.id) return;
                STORY_PROGRESS.inventory[m.id] =
                    (STORY_PROGRESS.inventory[m.id] || 0) + (m.qty || 1);
            });
        }
    }

    function unlockAchievement(id, opts) {
        opts = opts || {};
        _garantirEstrutura();
        if (isUnlocked(id)) return false;

        const a = ACH.find(x => x.id === id);
        if (!a) return false;

        STORY_PROGRESS.achievements[id] = { unlockedAt: Date.now() };
        _darRecompensas(a.recompensa);

        // Desbloqueia título se houver
        for (const tid in TITULOS) {
            if (TITULOS[tid].conquista === id) {
                if (!STORY_PROGRESS.titlesOwned.includes(tid)) {
                    STORY_PROGRESS.titlesOwned.push(tid);
                    if (!STORY_PROGRESS.activeTitle) STORY_PROGRESS.activeTitle = tid;
                }
            }
        }

        // Toast + som
        if (!opts.silent) {
            try {
                const cls = a.raridade === 'lendario' ? 'conquista-toast-lendario'
                          : a.raridade === 'raro' ? 'conquista-toast-raro'
                          : 'conquista-toast-comum';
                const icone = (typeof window._conquistasIconHTML === 'function')
                    ? window._conquistasIconHTML('trophy')
                    : '🏆';
                if (typeof showToast === 'function') {
                    showToast(`🏆 CONQUISTA! ${a.secreta && !isUnlocked(id) ? '' : ''}`, a.nome, icone);
                }
                // Toast extra pra lendário (mensagem mais chamativa)
                if (a.raridade === 'lendario' && typeof showToast === 'function') {
                    setTimeout(() => showToast('✨ LENDÁRIA!', a.nome, '✨'), 800);
                }
                if (typeof playSfx === 'function') {
                    playSfx(SONS[a.raridade] || 'win');
                }
            } catch(e) {}
        } else if (opts.toasts) {
            opts.toasts.push({ id, nome: a.nome, raridade: a.raridade });
        }

        return true;
    }
    window.unlockAchievement = unlockAchievement;

    // ─────────────────────────────────────────────────────────────
    // CHECK (itera as 70)
    // ─────────────────────────────────────────────────────────────
    let _checkRunning = false;

    function checkAchievements(opts) {
        opts = opts || {};
        if (_checkRunning) return [];
        _checkRunning = true;
        _garantirEstrutura();

        const novos = [];
        try {
            for (const a of ACH) {
                if (isUnlocked(a.id)) continue;
                let passou = false;
                try { passou = a.condicao(); } catch (e) { passou = false; }
                if (passou) {
                    unlockAchievement(a.id, { silent: opts.silent, toasts: novos });
                }
            }
        } catch(e) {
            console.warn('[conquistas] check falhou:', e);
        } finally {
            _checkRunning = false;
        }

        if (novos.length > 0) {
            try {
                if (typeof saveStoryProgress === 'function') saveStoryProgress();
            } catch(e) {}
            if (opts.silent) {
                // Uma conquista agregada
                if (typeof showToast === 'function') {
                    showToast('🏆 CONQUISTAS',
                        `${novos.length} conquista${novos.length > 1 ? 's' : ''} desbloqueada${novos.length > 1 ? 's' : ''}`,
                        '🏆');
                }
            }
        }

        return novos;
    }
    window.checkAchievements = checkAchievements;

    // ─────────────────────────────────────────────────────────────
    // HOOK saveStoryProgress → check
    // ─────────────────────────────────────────────────────────────
    function _installSaveHook() {
        const cur = window.saveStoryProgress;
        if (typeof cur !== 'function' || cur._conquistasHook) return;
        const inner = cur;
        window.saveStoryProgress = function() {
            const r = inner.apply(this, arguments);
            try { checkAchievements(); } catch(e) {}
            return r;
        };
        window.saveStoryProgress._conquistasHook = true;
    }
    _installSaveHook();

    // ─────────────────────────────────────────────────────────────
    // HOOK load → check (retroatividade)
    // ─────────────────────────────────────────────────────────────
    function _installLoadHook() {
        const cur = window.loadStoryProgressByName;
        if (typeof cur !== 'function' || cur._conquistasHook) return;
        const inner = cur;
        window.loadStoryProgressByName = function() {
            const r = inner.apply(this, arguments);
            if (r) {
                setTimeout(() => {
                    try { checkAchievements({ silent: true }); } catch(e) {}
                }, 300);
            }
            return r;
        };
        window.loadStoryProgressByName._conquistasHook = true;
    }
    _installLoadHook();

    // ═══════════════════════════════════════════════════════════
    // HOOKS DE STAT TRACKING
    // ═══════════════════════════════════════════════════════════

    // Anhangá kills (por herói único)
    function _hookBossDefeat() {
        const cur = window.handleStoryBossDefeat;
        if (typeof cur !== 'function' || cur._conqHooked) return;
        const inner = cur;
        window.handleStoryBossDefeat = async function() {
            try {
                _garantirEstrutura();
                const enemyId = Array.isArray(storyEnemiesRemaining) && storyEnemiesRemaining[0];
                if (enemyId === 'anhanga') {
                    const active = players?.[currentPlayerIdx];
                    const cls = active?.class;
                    if (cls && !STORY_PROGRESS.achievementStats.anhangáKilledBy.includes(cls)) {
                        STORY_PROGRESS.achievementStats.anhangáKilledBy.push(cls);
                        console.log(`[conquistas] Anhangá derrotado por ${cls} (${STORY_PROGRESS.achievementStats.anhangáKilledBy.length} únicos)`);
                    }
                }
            } catch(e) {}
            return inner.apply(this, arguments);
        };
        window.handleStoryBossDefeat._conqHooked = true;
    }
    _hookBossDefeat();

    // applyDmg — maxOverkill
    function _hookApplyDmg() {
        const cur = window.applyDmg;
        if (typeof cur !== 'function' || cur._conqHooked) return;
        const inner = cur;
        window.applyDmg = function(target, amount) {
            try {
                _garantirEstrutura();
                if (target && target === boss && !target.dead && amount > target.hp) {
                    const ok = amount - target.hp;
                    if (ok > STORY_PROGRESS.achievementStats.maxOverkill) {
                        STORY_PROGRESS.achievementStats.maxOverkill = ok;
                    }
                }
            } catch(e) {}
            return inner.apply(this, arguments);
        };
        window.applyDmg._conqHooked = true;
    }
    _hookApplyDmg();

    // executeAction — formas + maxBravely + mae da mata + pacifista
    function _hookExecuteAction() {
        const cur = window.executeAction;
        if (typeof cur !== 'function' || cur._conqHooked) return;
        const inner = cur;
        window.executeAction = async function() {
            try {
                _garantirEstrutura();
                const p = players?.[currentPlayerIdx];
                const usedSolo = (typeof skillActive !== 'undefined' && skillActive === true);

                // Captura forma antes (path pode ser limpo)
                let shape = null;
                let tilesPath = 0;
                if (typeof path !== 'undefined' && Array.isArray(path) && path.length > 0) {
                    tilesPath = path.length;
                    try {
                        shape = (typeof detectShape === 'function') ? detectShape([...path]) : null;
                    } catch(e) {}
                }

                const r = await inner.apply(this, arguments);

                const st = STORY_PROGRESS.achievementStats;

                // Pacifista: usou solo sagrado?
                if (usedSolo && p) p._usedSoloSagrado = true;

                // Forma feita
                if (shape && st.formasFeitas[shape] !== undefined) {
                    st.formasFeitas[shape]++;
                }

                // Bravely max tiles
                if (tilesPath > st.maxBravelyTiles) {
                    const th = parseInt(document.getElementById('bravely_tiles')?.value) || 9;
                    if (tilesPath >= th) st.maxBravelyTiles = tilesPath;
                }

                return r;
            } catch(e) {
                console.warn('[conquistas] executeAction hook erro:', e);
                return inner.apply(this, arguments);
            }
        };
        window.executeAction._conqHooked = true;
    }
    _hookExecuteAction();

    // ascension / reroll — jackpots
    function _hookJackpots() {
        const curA = window.ascendHero;
        if (typeof curA === 'function' && !curA._conqHooked) {
            const inner = curA;
            window.ascendHero = function() {
                const r = inner.apply(this, arguments);
                try {
                    _garantirEstrutura();
                    if (r && r.ok && r.stat11 && r.stat11.tier === 'jackpot') {
                        STORY_PROGRESS.achievementStats.jackpotsRolled++;
                    }
                } catch(e) {}
                return r;
            };
            window.ascendHero._conqHooked = true;
        }
        const curR = window.rerollStat11;
        if (typeof curR === 'function' && !curR._conqHooked) {
            const inner = curR;
            window.rerollStat11 = function() {
                const r = inner.apply(this, arguments);
                try {
                    _garantirEstrutura();
                    if (r && r.ok && r.stat11 && r.stat11.tier === 'jackpot') {
                        STORY_PROGRESS.achievementStats.jackpotsRolled++;
                    }
                } catch(e) {}
                return r;
            };
            window.rerollStat11._conqHooked = true;
        }
    }
    _hookJackpots();

    // chaves usadas
    function _hookChaves() {
        const cur = window.gastarChave;
        if (typeof cur !== 'function' || cur._conqHooked) return;
        const inner = cur;
        window.gastarChave = function(qtd) {
            const r = inner.apply(this, arguments);
            try {
                if (r === true) {
                    _garantirEstrutura();
                    STORY_PROGRESS.achievementStats.chavesUsed += (qtd || 1);
                }
            } catch(e) {}
            return r;
        };
        window.gastarChave._conqHooked = true;
    }
    _hookChaves();

    // coração quebrado
    function _hookQuebrarItem() {
        const cur = window.quebrarItem;
        if (typeof cur !== 'function' || cur._conqHooked) return;
        const inner = cur;
        window.quebrarItem = function(id) {
            try {
                _garantirEstrutura();
                if (String(id).split('#')[0] === 'coracao_vazio') {
                    STORY_PROGRESS.achievementStats.coracaoQuebrado = true;
                }
            } catch(e) {}
            return inner.apply(this, arguments);
        };
        window.quebrarItem._conqHooked = true;
    }
    _hookQuebrarItem();

    // comprar semente do vento
    function _hookComprarEvento() {
        const cur = window.comprarEventoItem;
        if (typeof cur !== 'function' || cur._conqHooked) return;
        const inner = cur;
        window.comprarEventoItem = function(itemId, preco, tipo) {
            const r = inner.apply(this, arguments);
            try {
                if (itemId === 'semente_vento') {
                    _garantirEstrutura();
                    STORY_PROGRESS.achievementStats.sementeVentoCompras++;
                }
            } catch(e) {}
            return r;
        };
        window.comprarEventoItem._conqHooked = true;
    }
    _hookComprarEvento();

    // defeats + madrugador + noturno + pacifista
    function _hookFinishPhase() {
        const cur = window.finishStoryPhase;
        if (typeof cur !== 'function' || cur._conqHooked) return;
        const inner = cur;
        window.finishStoryPhase = function(victory) {
            try {
                _garantirEstrutura();
                const st = STORY_PROGRESS.achievementStats;
                if (!victory) {
                    st.defeats++;
                } else {
                    const hora = new Date().getHours();
                    if (hora >= 0 && hora < 6) st.madrugador = true;
                    if (hora >= 23) st.noturno = true;
                    // Pacifista: se ninguém usou Solo Sagrado
                    const algumUsou = (typeof players !== 'undefined' && Array.isArray(players))
                        ? players.some(p => p && p._usedSoloSagrado === true) : false;
                    if (!algumUsou) st.pacifistaVit++;
                    // Reset para próxima batalha
                    if (Array.isArray(players)) players.forEach(p => { if (p) p._usedSoloSagrado = false; });
                }
            } catch(e) {}
            return inner.apply(this, arguments);
        };
        window.finishStoryPhase._conqHooked = true;
    }
    _hookFinishPhase();

    // Reset pacifista + negrinho no início de batalha
    function _hookInitBattle() {
        const cur = window.initStoryBattle;
        if (typeof cur !== 'function' || cur._conqHooked) return;
        const inner = cur;
        window.initStoryBattle = async function() {
            try {
                if (typeof players !== 'undefined' && Array.isArray(players)) {
                    players.forEach(p => {
                        if (!p) return;
                        p._usedSoloSagrado = false;
                        if (p._negrinhoReviveUsed) {
                            _garantirEstrutura();
                            STORY_PROGRESS.achievementStats.negrinhoRevived = true;
                        }
                    });
                }
            } catch(e) {}
            return inner.apply(this, arguments);
        };
        window.initStoryBattle._conqHooked = true;
    }
    _hookInitBattle();

    // corrigir corrupção limpa (via solo sagrado ou purge)
    function _hookLimparCorrupcao() {
        const cur = window.limparCorrupcao;
        if (typeof cur !== 'function' || cur._conqHooked) return;
        const inner = cur;
        window.limparCorrupcao = function() {
            try {
                const qtAntes = Array.isArray(window._corruptedTiles) ? window._corruptedTiles.length : 0;
                const r = inner.apply(this, arguments);
                if (qtAntes > 0) {
                    _garantirEstrutura();
                    STORY_PROGRESS.achievementStats.corruptedCleared += qtAntes;
                }
                return r;
            } catch(e) {
                return inner.apply(this, arguments);
            }
        };
        window.limparCorrupcao._conqHooked = true;
    }
    _hookLimparCorrupcao();

    // addLog — intercepta logs específicos (curupira 10, anhanga purifica, mae da mata)
    function _hookAddLog() {
        const cur = window.addLog;
        if (typeof cur !== 'function' || cur._conqHooked) return;
        const inner = cur;
        window.addLog = function(msg) {
            try {
                if (typeof msg === 'string' && STORY_PROGRESS) {
                    _garantirEstrutura();
                    const st = STORY_PROGRESS.achievementStats;
                    if (msg.includes('Curupira') && msg.includes('tiles → TERRA')) {
                        const m = msg.match(/(\d+)\s+tiles\s*→\s*TERRA/);
                        if (m && parseInt(m[1]) >= 10) st.curupiraPerfect = true;
                    }
                    if (msg.includes('Anhanga-Mirim') && msg.includes('purificou')) {
                        st.anhangaMirimPurificou = true;
                    }
                    if (msg.includes('Mãe da Mata') && msg.includes('curou')) {
                        const m = msg.match(/curou\s+(\d+)/);
                        if (m && parseInt(m[1]) >= 3) st.maeMataCurou3 = true;
                    }
                }
            } catch(e) {}
            return inner.apply(this, arguments);
        };
        window.addLog._conqHooked = true;
    }
    _hookAddLog();

    // PvP / Coop (hooks condicionais + API pública)
    function _installSocialHooks() {
        const pvp = window.pvpFinalizar;
        if (typeof pvp === 'function' && !pvp._conqHooked) {
            const inner = pvp;
            window.pvpFinalizar = function(euVenco) {
                if (euVenco) {
                    _garantirEstrutura();
                    STORY_PROGRESS.achievementStats.pvpVitorias++;
                }
                return inner.apply(this, arguments);
            };
            window.pvpFinalizar._conqHooked = true;
        }
        const coop = window.coopFinalizar;
        if (typeof coop === 'function' && !coop._conqHooked) {
            const inner = coop;
            window.coopFinalizar = async function(vitoria) {
                if (vitoria) {
                    _garantirEstrutura();
                    STORY_PROGRESS.achievementStats.coopVitorias++;
                    if (!STORY_PROGRESS.achievementStats._coopMorteThisBattle) {
                        STORY_PROGRESS.achievementStats.coopSemMorte++;
                    }
                }
                return inner.apply(this, arguments);
            };
            window.coopFinalizar._conqHooked = true;
        }
    }
    _installSocialHooks();
    setInterval(_installSocialHooks, 1500);

    // API pública pra PvP/Coop (se funções não existirem)
    window.conquistaRegistrarPvP = function() {
        _garantirEstrutura();
        STORY_PROGRESS.achievementStats.pvpVitorias++;
    };
    window.conquistaRegistrarCoop = function(vitoria) {
        _garantirEstrutura();
        if (vitoria) STORY_PROGRESS.achievementStats.coopVitorias++;
    };
    window.conquistaRegistrarMorteCoop = function() {
        _garantirEstrutura();
        STORY_PROGRESS.achievementStats._coopMorteThisBattle = true;
    };
    window.conquistaResetCoop = function() {
        _garantirEstrutura();
        STORY_PROGRESS.achievementStats._coopMorteThisBattle = false;
    };

    // ─────────────────────────────────────────────────────────────
    // Reinstaladores (se patches tardios sobrescreverem)
    // ─────────────────────────────────────────────────────────────
    setInterval(() => {
        _installSaveHook();
        _installLoadHook();
        _hookBossDefeat();
        _hookApplyDmg();
        _hookExecuteAction();
        _hookJackpots();
        _hookChaves();
        _hookQuebrarItem();
        _hookComprarEvento();
        _hookFinishPhase();
        _hookInitBattle();
        _hookLimparCorrupcao();
        _hookAddLog();
    }, 2000);

    // ─────────────────────────────────────────────────────────────
    // Inicial
    // ─────────────────────────────────────────────────────────────
    _garantirEstrutura();

    console.log('✅ [conquistas] Engine instalado.');
})();
// =================================================================
// conquistas.js — PARTE 3/4 — UI
// =================================================================
(function conquistasUIV10() {
    if (window._conquistasUIV10) return;
    window._conquistasUIV10 = true;

    // ─────────────────────────────────────────────────────────────
    // Estado de filtros
    // ─────────────────────────────────────────────────────────────
    window._conquistasFiltro = window._conquistasFiltro || 'todos';
    window._conquistasFiltroStatus = window._conquistasFiltroStatus || 'todas';

    // ─────────────────────────────────────────────────────────────
    // Helper: emoji ou sprite
    // ─────────────────────────────────────────────────────────────
    window._conquistasIconHTML = function(key, size) {
        const raw = window.SPRITES_CONQUISTAS?.[key] || '?';
        const isURL = /^(https?:|data:|\.\/|\/)/.test(raw);
        const px = size === 'large' ? '1.6em' : size === 'small' ? '0.9em' : '1.1em';
        if (isURL) {
            return `<img src="${raw}" style="width:${px};height:${px};object-fit:contain;vertical-align:-0.15em;display:inline-block;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.6));" alt="${key}">`;
        }
        return `<span style="font-size:${px};line-height:1;">${raw}</span>`;
    };

    // ─────────────────────────────────────────────────────────────
    // Contadores
    // ─────────────────────────────────────────────────────────────
    window.contarConquistas = function() {
        const ACH = window.ACHIEVEMENTS || [];
        let desbloqueadas = 0;
        for (const a of ACH) {
            if (window.isAchievementUnlocked && window.isAchievementUnlocked(a.id)) desbloqueadas++;
        }
        return { desbloqueadas, total: ACH.length };
    };

    // ─────────────────────────────────────────────────────────────
    // Helpers de recompensa
    // ─────────────────────────────────────────────────────────────
    function _renderRecompensa(a) {
        const r = a.recompensa || {};
        const partes = [];
        if (r.ouro) partes.push(`<span class="conq-rw"><span class="conq-rw-icon">${window._conquistasIconHTML('recompensa_ouro','small')}</span>${r.ouro}</span>`);
        if (r.xp) partes.push(`<span class="conq-rw"><span class="conq-rw-icon">${window._conquistasIconHTML('recompensa_xp','small')}</span>${r.xp}</span>`);
        if (r.essenciaAncestral) partes.push(`<span class="conq-rw"><span class="conq-rw-icon">${window._conquistasIconHTML('recompensa_ancestral','small')}</span>${r.essenciaAncestral}</span>`);
        if (r.essenciaSombria) partes.push(`<span class="conq-rw"><span class="conq-rw-icon">${window._conquistasIconHTML('recompensa_sombria','small')}</span>${r.essenciaSombria}</span>`);
        if (Array.isArray(r.materiais)) {
            r.materiais.forEach(m => {
                const mat = STORY_MATERIALS?.[m.id];
                const iconHTML = mat
                    ? ((typeof getMaterialIcon === 'function') ? getMaterialIcon(m.id, 'small') : mat.emoji)
                    : '?';
                partes.push(`<span class="conq-rw"><span class="conq-rw-icon">${iconHTML}</span>${m.qty}</span>`);
            });
        }
        if (partes.length === 0) return '';
        return `<div class="conq-recompensa">${partes.join('')}</div>`;
    }

    // ─────────────────────────────────────────────────────────────
    // Card individual
    // ─────────────────────────────────────────────────────────────
    function _renderCard(a) {
        const unlocked = window.isAchievementUnlocked && window.isAchievementUnlocked(a.id);
        const meta = (window.CONQUISTAS_CATEGORIAS || {})[a.categoria] || {};
        const cor = meta.cor || '#c9a227';
        const ehSecreta = a.secreta === true;
        const nome = (ehSecreta && !unlocked) ? '???' : a.nome;
        const desc = (ehSecreta && !unlocked) ? (a.descSecreta || 'Um feito estranho…') : (a.desc || '');

        // Raridade
        const rarClass = `conq-raridade-${a.raridade}`;
        const rarLabel = { comum: 'Comum', raro: 'Raro', lendario: 'Lendário' }[a.raridade] || '';

        // Progresso
        let progHTML = '';
        if (!unlocked && typeof a.progresso === 'function') {
            try {
                const p = a.progresso();
                if (p && typeof p.atual === 'number' && typeof p.meta === 'number' && p.meta > 0) {
                    const pct = Math.min(100, Math.round((p.atual / p.meta) * 100));
                    progHTML = `
                        <div class="conq-progress">
                            <div class="conq-progress-bar"><div class="conq-progress-fill" style="width:${pct}%;"></div></div>
                            <div class="conq-progress-text">${p.atual} / ${p.meta}</div>
                        </div>`;
                }
            } catch(e) {}
        }

        // Selo de desbloqueado
        const seloHTML = unlocked
            ? `<div class="conq-selo">${window._conquistasIconHTML('icone_desbloqueada','small')}</div>`
            : `<div class="conq-selo conq-selo-lock">${window._conquistasIconHTML('icone_bloqueada','small')}</div>`;

        // Data de desbloqueio
        let dataHTML = '';
        if (unlocked) {
            const when = STORY_PROGRESS?.achievements?.[a.id]?.unlockedAt;
            if (when) {
                try {
                    const d = new Date(when);
                    dataHTML = `<div class="conq-data">${d.toLocaleDateString('pt-BR')}</div>`;
                } catch(e) {}
            }
        }

        return `
            <div class="conq-card conq-card-${a.raridade} ${unlocked ? 'conq-unlocked' : 'conq-locked'}" style="--conq-cor:${cor};">
                ${seloHTML}
                <div class="conq-card-header">
                    <span class="conq-icon">${window._conquistasIconHTML(meta.emojiKey || 'trophy', 'large')}</span>
                    <div class="conq-title-wrap">
                        <div class="conq-nome">${nome}</div>
                        <div class="conq-categoria">${meta.nome || a.categoria}</div>
                    </div>
                </div>
                <div class="conq-desc">${desc}</div>
                ${progHTML}
                ${_renderRecompensa(a)}
                <div class="conq-footer">
                    <span class="conq-raridade ${rarClass}">${rarLabel}</span>
                    ${dataHTML}
                </div>
            </div>`;
    }

    // ─────────────────────────────────────────────────────────────
    // TELA
    // ─────────────────────────────────────────────────────────────
    window.renderConquistasScreen = function() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;

        const ACH = window.ACHIEVEMENTS || [];
        const { desbloqueadas, total } = window.contarConquistas();

        // Filtros
        const filtroCat = window._conquistasFiltro || 'todos';
        const filtroStatus = window._conquistasFiltroStatus || 'todas';

        // Lista filtrada
        let lista = ACH.slice();
        if (filtroCat !== 'todos') lista = lista.filter(a => a.categoria === filtroCat);
        if (filtroStatus === 'desbloqueadas') lista = lista.filter(a => window.isAchievementUnlocked(a.id));
        if (filtroStatus === 'bloqueadas') lista = lista.filter(a => !window.isAchievementUnlocked(a.id));

        // Ordena: desbloqueadas primeiro, depois raridade (lendário, raro, comum), depois nome
        const rarPeso = { lendario: 3, raro: 2, comum: 1 };
        lista.sort((a, b) => {
            const ua = window.isAchievementUnlocked(a.id) ? 0 : 1;
            const ub = window.isAchievementUnlocked(b.id) ? 0 : 1;
            if (ua !== ub) return ua - ub;
            const pa = rarPeso[a.raridade] || 0;
            const pb = rarPeso[b.raridade] || 0;
            if (pa !== pb) return pb - pa;
            return (a.nome || '').localeCompare(b.nome || '');
        });

        // Cards
        let cardsHTML = '';
        if (lista.length === 0) {
            cardsHTML = `<div class="conq-empty">Nenhuma conquista neste filtro.</div>`;
        } else {
            cardsHTML = lista.map(_renderCard).join('');
        }

        // Filtros HTML — categorias
        const cats = [['todos', { nome: 'Todas', emojiKey: 'trophy' }]].concat(
            Object.entries(window.CONQUISTAS_CATEGORIAS || {})
        );
        const catFiltrosHTML = cats.map(([id, meta]) => {
            const label = id === 'todos' ? 'Todas' : (meta.nome || id);
            const icone = window._conquistasIconHTML(meta.emojiKey || 'trophy', 'small');
            return `<button class="conq-filter-btn ${filtroCat === id ? 'active' : ''}"
                            onclick="window._conqFiltrar('${id}')">${icone} ${label}</button>`;
        }).join('');

        // Filtros HTML — status
        const statusFiltrosHTML = [
            ['todas', 'Todas'],
            ['desbloqueadas', 'Desbloqueadas'],
            ['bloqueadas', 'Bloqueadas'],
        ].map(([id, label]) =>
            `<button class="conq-filter-btn ${filtroStatus === id ? 'active' : ''}"
                     onclick="window._conqFiltrarStatus('${id}')">${label}</button>`
        ).join('');

        screen.innerHTML = `
            <div class="story-container">
                <div class="story-header">
                    <h1 class="story-title">🏆 CONQUISTAS</h1>
                    <p class="story-subtitle">${desbloqueadas} de ${total} conquistas desbloqueadas</p>
                    <div class="conq-counter-bar">
                        <div class="conq-counter-fill" style="width:${total > 0 ? (desbloqueadas/total*100) : 0}%;"></div>
                    </div>
                </div>

                <div class="conq-filtros">
                    <div class="conq-filtros-row">${catFiltrosHTML}</div>
                    <div class="conq-filtros-row">${statusFiltrosHTML}</div>
                </div>

                <div class="conq-grid">${cardsHTML}</div>

                <div class="story-footer">
                    <button class="story-back-btn" onclick="window._conqVoltarPerfil()">← VOLTAR AO PERFIL</button>
                </div>
            </div>
        `;
        screen.classList.add('active');
        screen.style.display = 'flex';
    };

    // ─────────────────────────────────────────────────────────────
    // Handlers dos filtros
    // ─────────────────────────────────────────────────────────────
    window._conqFiltrar = function(cat) {
        window._conquistasFiltro = cat;
        window.renderConquistasScreen();
    };
    window._conqFiltrarStatus = function(status) {
        window._conquistasFiltroStatus = status;
        window.renderConquistasScreen();
    };
    window._conqVoltarPerfil = function() {
        if (typeof window._abrirTelaPerfilV3 === 'function') {
            window._abrirTelaPerfilV3();
        } else if (typeof renderAldeiaScreen === 'function') {
            renderAldeiaScreen();
        }
    };

    // ─────────────────────────────────────────────────────────────
    // CSS
    // ─────────────────────────────────────────────────────────────
    if (!document.getElementById('conquistasCSS')) {
        const s = document.createElement('style');
        s.id = 'conquistasCSS';
        s.textContent = `
            /* ─── Contador no header ─── */
            .conq-counter-bar {
                margin: 12px auto 0;
                width: 100%;
                max-width: 400px;
                height: 8px;
                background: rgba(10,6,2,0.6);
                border: 1px solid rgba(201,162,39,0.3);
                border-radius: 4px;
                overflow: hidden;
            }
            .conq-counter-fill {
                height: 100%;
                background: linear-gradient(90deg, #4a7040, #8ac070, #e8b923);
                transition: width 0.4s ease;
                box-shadow: 0 0 10px rgba(232,185,35,0.5);
            }

            /* ─── Filtros ─── */
            .conq-filtros {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 20px;
            }
            .conq-filtros-row {
                display: flex;
                gap: 8px;
                justify-content: center;
                flex-wrap: wrap;
            }
            .conq-filter-btn {
                padding: 6px 14px;
                background: linear-gradient(135deg, #3d2d18, #2a1f10);
                color: #c8b787;
                border: 1px solid #6a5024;
                border-radius: 16px;
                cursor: pointer;
                font-family: 'Cinzel', serif;
                font-weight: 700;
                font-size: 0.78rem;
                letter-spacing: 1px;
                transition: all 0.15s;
                display: inline-flex;
                align-items: center;
                gap: 5px;
            }
            .conq-filter-btn:hover {
                color: #f0e2c0;
                border-color: #c9a227;
            }
            .conq-filter-btn.active {
                background: linear-gradient(180deg, rgba(232,185,35,0.2), transparent 45%),
                            linear-gradient(135deg, #6a5024, #3d2d18);
                color: #fff5dc;
                border-color: #e8b923;
                box-shadow: 0 0 12px rgba(232,185,35,0.4);
            }

            /* ─── Grid de cards ─── */
            .conq-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                gap: 14px;
                margin-bottom: 30px;
            }

            /* ─── Card ─── */
            .conq-card {
                position: relative;
                background: linear-gradient(180deg, rgba(201,162,39,0.04), transparent 40%),
                            linear-gradient(180deg, rgba(42,31,16,0.95), rgba(26,18,8,0.95));
                border: 2px solid #3d2d18;
                border-radius: 8px;
                padding: 14px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                transition: all 0.2s;
                overflow: hidden;
            }
            .conq-card::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; height: 3px;
                background: var(--conq-cor, #c9a227);
                opacity: 0.7;
            }
            .conq-card:hover {
                border-color: var(--conq-cor, #c9a227);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0,0,0,0.5);
            }

            /* Raridade */
            .conq-card-comum     { border-color: #4a3a20; }
            .conq-card-raro      { border-color: #2a5570; }
            .conq-card-lendario  { border-color: #6a5024; box-shadow: 0 0 12px rgba(232,185,35,0.15); }

            .conq-locked {
                opacity: 0.65;
                filter: grayscale(0.3);
            }
            .conq-locked:hover {
                opacity: 0.85;
            }
            .conq-unlocked {
                opacity: 1;
                filter: none;
            }
            .conq-card-lendario.conq-unlocked {
                box-shadow: 0 0 20px rgba(232,185,35,0.4);
            }

            /* Selo */
            .conq-selo {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 26px;
                height: 26px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background: rgba(10,6,2,0.75);
                z-index: 2;
                filter: drop-shadow(0 0 4px rgba(0,0,0,0.8));
            }
            .conq-selo-lock { opacity: 0.55; }

            /* Header do card */
            .conq-card-header {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .conq-icon {
                width: 44px;
                height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 6px;
                background: radial-gradient(circle, rgba(0,0,0,0.4), transparent 70%);
                flex-shrink: 0;
            }
            .conq-title-wrap {
                flex: 1;
                min-width: 0;
            }
            .conq-nome {
                font-family: 'Cinzel', serif;
                color: #f0e2c0;
                font-size: 1rem;
                font-weight: 700;
                letter-spacing: 0.5px;
                line-height: 1.2;
                margin-bottom: 2px;
            }
            .conq-categoria {
                font-family: 'EB Garamond', serif;
                color: #b8a577;
                font-size: 0.8rem;
                font-style: italic;
            }

            /* Descrição */
            .conq-desc {
                font-family: 'EB Garamond', serif;
                color: #d9c89a;
                font-size: 0.88rem;
                line-height: 1.4;
                font-style: italic;
                min-height: 2.4em;
            }

            /* Progresso */
            .conq-progress {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .conq-progress-bar {
                height: 6px;
                background: rgba(10,6,2,0.6);
                border-radius: 3px;
                overflow: hidden;
                border: 1px solid rgba(201,162,39,0.2);
            }
            .conq-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4a7040, #8ac070);
                transition: width 0.3s ease;
            }
            .conq-progress-text {
                font-family: 'Cinzel', serif;
                color: #8ac070;
                font-size: 0.75rem;
                text-align: right;
                font-weight: 700;
            }

            /* Recompensas */
            .conq-recompensa {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                justify-content: center;
                padding: 8px;
                background: rgba(10,6,2,0.4);
                border-radius: 4px;
                border: 1px dashed rgba(201,162,39,0.2);
            }
            .conq-rw {
                display: inline-flex;
                align-items: center;
                gap: 3px;
                font-family: 'Cinzel', serif;
                color: #e8b923;
                font-size: 0.8rem;
                font-weight: 700;
            }
            .conq-rw-icon {
                display: inline-flex;
                align-items: center;
            }

            /* Footer */
            .conq-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: auto;
                padding-top: 8px;
                border-top: 1px solid rgba(201,162,39,0.15);
            }
            .conq-raridade {
                font-family: 'Cinzel', serif;
                font-size: 0.72rem;
                font-weight: 700;
                letter-spacing: 1px;
                padding: 2px 8px;
                border-radius: 10px;
                background: rgba(10,6,2,0.5);
            }
            .conq-raridade-comum     { color: #b8a577; border: 1px solid #4a3a20; }
            .conq-raridade-raro      { color: #6ab0d8; border: 1px solid #2a5570; }
            .conq-raridade-lendario  { color: #e8b923; border: 1px solid #6a5024; box-shadow: 0 0 6px rgba(232,185,35,0.3); }
            .conq-data {
                font-family: 'EB Garamond', serif;
                color: #8a7a52;
                font-size: 0.75rem;
                font-style: italic;
            }

            /* Empty */
            .conq-empty {
                grid-column: 1 / -1;
                text-align: center;
                padding: 40px;
                font-family: 'EB Garamond', serif;
                color: #8a7a52;
                font-style: italic;
            }

            @media (max-width: 600px) {
                .conq-grid { grid-template-columns: 1fr; }
            }
        `;
        document.head.appendChild(s);
    }

    console.log('✅ [conquistas] UI instalada.');
})();
// =================================================================
// conquistas.js — PARTE 4/4 — Integração Perfil + Títulos + Debug
// =================================================================
(function conquistasPerfilV10() {
    if (window._conquistasPerfilV10) return;
    window._conquistasPerfilV10 = true;

    // ─────────────────────────────────────────────────────────────
    // 1. Injetar botão "🏆 CONQUISTAS" no Perfil
    // ─────────────────────────────────────────────────────────────
    function _injetarBotaoConquistas() {
        const sectionCards = document.querySelectorAll('.profile-section-card');
        let injetou = false;

        sectionCards.forEach(card => {
            const title = card.querySelector('.profile-section-title');
            if (!title || !title.textContent.includes('CONQUISTAS')) return;

            const placeholder = card.querySelector('.profile-placeholder-box');
            if (!placeholder) return;

            const { desbloqueadas, total } = window.contarConquistas();
            placeholder.outerHTML = `
                <button class="profile-conquistas-btn" onclick="window.renderConquistasScreen()">
                    🏆 VER CONQUISTAS (${desbloqueadas}/${total})
                </button>
            `;
            injetou = true;
        });

        return injetou;
    }

    // Hook no _abrirTelaPerfilV3
    function _installPerfilHook() {
        const cur = window._abrirTelaPerfilV3;
        if (typeof cur !== 'function' || cur._conqHooked) return;
        const inner = cur;
        window._abrirTelaPerfilV3 = function() {
            const r = inner.apply(this, arguments);
            setTimeout(_injetarBotaoConquistas, 100);
            setTimeout(_injetarBotaoConquistas, 300);
            return r;
        };
        window._abrirTelaPerfilV3._conqHooked = true;
    }
    _installPerfilHook();
    setInterval(_installPerfilHook, 2000);

    // ─────────────────────────────────────────────────────────────
    // 2. Seletor de títulos no Perfil
    // ─────────────────────────────────────────────────────────────
    function _injetarSeletorTitulos() {
        const mainCard = document.querySelector('.profile-main-card');
        if (!mainCard) return;
        if (mainCard.querySelector('.profile-titulo-selector')) return;
        if (!Array.isArray(STORY_PROGRESS?.titlesOwned) || STORY_PROGRESS.titlesOwned.length === 0) return;

        const ativo = STORY_PROGRESS.activeTitle;
        const TITULOS = window.TITULOS_COSMETICOS || {};

        const opcoes = STORY_PROGRESS.titlesOwned
            .map(tid => {
                const t = TITULOS[tid];
                if (!t) return '';
                const sel = tid === ativo ? ' selected' : '';
                const icone = window._conquistasIconHTML(t.emojiKey, 'small');
                return `<option value="${tid}"${sel}>${t.nome}</option>`;
            })
            .join('');

        const div = document.createElement('div');
        div.className = 'profile-titulo-selector';
        div.innerHTML = `
            <label class="profile-titulo-label">🎖️ Título ativo:</label>
            <select class="profile-titulo-select" onchange="window._conqSetTitulo(this.value)">
                <option value="">— Nenhum —</option>
                ${opcoes}
            </select>
        `;

        const nameEl = mainCard.querySelector('.profile-name');
        if (nameEl && nameEl.parentNode) {
            nameEl.parentNode.insertBefore(div, nameEl.nextSibling);
        } else {
            mainCard.appendChild(div);
        }
    }

    function _installPerfilTitulosHook() {
        const cur = window._abrirTelaPerfilV3;
        if (typeof cur !== 'function' || cur._conqTitHooked) return;
        const inner = cur;
        window._abrirTelaPerfilV3 = function() {
            const r = inner.apply(this, arguments);
            setTimeout(_injetarSeletorTitulos, 150);
            setTimeout(_injetarSeletorTitulos, 350);
            return r;
        };
        window._abrirTelaPerfilV3._conqTitHooked = true;
    }
    _installPerfilTitulosHook();

    window._conqSetTitulo = function(tid) {
        STORY_PROGRESS.activeTitle = tid || null;
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        if (typeof showToast === 'function') {
            if (tid && window.TITULOS_COSMETICOS?.[tid]) {
                showToast('🎖️ Título alterado', window.TITULOS_COSMETICOS[tid].nome, '🎖️');
            } else {
                showToast('🎖️ Título removido', '', '🎖️');
            }
        }
        if (typeof window._abrirTelaPerfilV3 === 'function') {
            window._abrirTelaPerfilV3();
        }
    };

    // ─────────────────────────────────────────────────────────────
    // 3. CSS extra (botão + seletor de títulos)
    // ─────────────────────────────────────────────────────────────
    if (!document.getElementById('conquistasPerfilCSS')) {
        const s = document.createElement('style');
        s.id = 'conquistasPerfilCSS';
        s.textContent = `
            .profile-conquistas-btn {
                padding: 12px 20px;
                background: linear-gradient(180deg, rgba(232,185,35,0.25), transparent 45%),
                            linear-gradient(135deg, #8a6a2e, #4a3418);
                color: #fff5dc;
                border: 2px solid #e8b923;
                border-radius: 4px;
                font-family: 'Cinzel', serif;
                font-weight: 700;
                font-size: 0.9rem;
                letter-spacing: 1.5px;
                cursor: pointer;
                transition: all 0.2s;
                width: 100%;
                margin-top: 8px;
            }
            .profile-conquistas-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0,0,0,0.5), 0 0 25px rgba(232,185,35,0.4);
            }

            .profile-titulo-selector {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-top: 14px;
                padding: 10px 14px;
                background: rgba(10,6,2,0.6);
                border: 1px solid rgba(201,162,39,0.35);
                border-radius: 6px;
                flex-wrap: wrap;
            }
            .profile-titulo-label {
                font-family: 'Cinzel', serif;
                color: #b8a577;
                font-size: 0.85rem;
                letter-spacing: 1px;
            }
            .profile-titulo-select {
                flex: 1;
                min-width: 180px;
                padding: 6px 12px;
                background: rgba(10,6,2,0.7);
                color: #e8dcc4;
                border: 1px solid rgba(201,162,39,0.4);
                border-radius: 4px;
                font-family: 'EB Garamond', serif;
                font-size: 0.9rem;
                cursor: pointer;
            }
            .profile-titulo-select:focus {
                outline: none;
                border-color: #e8b923;
            }
        `;
        document.head.appendChild(s);
    }

    // ─────────────────────────────────────────────────────────────
    // 4. DEBUG
    // ─────────────────────────────────────────────────────────────
    window._debugConquistas = function() {
        const ACH = window.ACHIEVEMENTS || [];
        const { desbloqueadas, total } = window.contarConquistas();
        console.group('═══ [conquistas] ═══');
        console.log(`Total: ${desbloqueadas} / ${total}`);
        console.log('');
        console.log('Por categoria:');
        const porCat = {};
        const porRar = { comum: 0, raro: 0, lendario: 0 };
        ACH.forEach(a => {
            const unlocked = window.isAchievementUnlocked(a.id);
            if (!porCat[a.categoria]) porCat[a.categoria] = { total: 0, unlocked: 0 };
            porCat[a.categoria].total++;
            if (unlocked) {
                porCat[a.categoria].unlocked++;
                porRar[a.raridade]++;
            }
        });
        for (const cat in porCat) {
            console.log(`  ${cat}: ${porCat[cat].unlocked}/${porCat[cat].total}`);
        }
        console.log('');
        console.log('Por raridade (desbloqueadas):');
        console.log(`  Comum: ${porRar.comum}`);
        console.log(`  Raro: ${porRar.raro}`);
        console.log(`  Lendário: ${porRar.lendario}`);
        console.log('');
        console.log('AchievementStats:', STORY_PROGRESS?.achievementStats);
        console.log('');
        console.log('Títulos possuídos:', STORY_PROGRESS?.titlesOwned);
        console.log('Título ativo:', STORY_PROGRESS?.activeTitle);
        console.groupEnd();
    };

    window._forcarTodasConquistas = function() {
        if (!confirm('Desbloquear TODAS as conquistas? (só pra teste)')) return;
        const ACH = window.ACHIEVEMENTS || [];
        ACH.forEach(a => {
            if (!window.isAchievementUnlocked(a.id)) {
                window.unlockAchievement(a.id, { silent: true });
            }
        });
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        console.log(`✅ ${ACH.length} conquistas desbloqueadas.`);
        if (typeof window.renderConquistasScreen === 'function') window.renderConquistasScreen();
    };

    window._resetarConquistas = function() {
        if (!confirm('Resetar TODAS as conquistas? (só pra teste)')) return;
        STORY_PROGRESS.achievements = {};
        STORY_PROGRESS.achievementStats = {};
        STORY_PROGRESS.titlesOwned = [];
        STORY_PROGRESS.activeTitle = null;
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        console.log('✅ Conquistas resetadas.');
    };

    // ─────────────────────────────────────────────────────────────
    // 5. Rodada inicial (garantir estrutura + retroatividade)
    // ─────────────────────────────────────────────────────────────
    setTimeout(() => {
        try {
            if (typeof window.checkAchievements === 'function') {
                window.checkAchievements({ silent: true });
            }
        } catch(e) {}
    }, 1500);

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [conquistas] V1.0 completa');
    console.log('═══════════════════════════════════════════════════');
    console.log('• 70 conquistas · 7 títulos cosméticos · 8 categorias');
    console.log('• Retroatividade automática no load');
    console.log('• Botão no Perfil → tela de conquistas');
    console.log('');
    console.log('💡 Debug:');
    console.log('   window._debugConquistas()');
    console.log('   window._forcarTodasConquistas()');
    console.log('   window._resetarConquistas()');
    console.log('');
    console.log('🖼️ Substituir emojis:');
    console.log('   window.SPRITES_CONQUISTAS["trophy"] = "URL"');
    console.log('   (todas as keys estão no topo do arquivo)');
    console.log('═══════════════════════════════════════════════════');
})();