(function installRegionalRaids() {
    'use strict';

    if (window._regionalRaidsInstalled) return;
    window._regionalRaidsInstalled = true;

    const DIFFICULTIES = {
        normal: { label: 'Normal', hp: 1, damage: 1, cost: 1, reward: 1, drop: 0.08 },
        dificil: { label: 'Difícil', hp: 1.45, damage: 1.35, cost: 1.5, reward: 1.5, drop: 0.12 },
        pesadelo: { label: 'Pesadelo', hp: 1.9, damage: 1.75, cost: 2, reward: 2, drop: 0.18 },
    };

    const RAID_DATA = [
        {
            id: 'cobra_norato', rank: 1, name: 'Cobra Norato', region: 'Amazônia',
            title: 'O Rio que Anda', element: 'AGUA', emoji: '🐍', hp: 90, atk: 3,
            entry: 5000, gold: 7000, xp: 1500,
            lore: 'Nas noites em que o rio parece correr contra a corrente, uma cobra imensa rompe a superfície. Anhangá distorceu as correntezas e a fez atacar qualquer embarcação. Os heróis precisam conter a enchente e libertar a passagem — não destruir o rio.',
            adaptation: 'Releitura do jogo inspirada na tradição amazônica de Honorato/Cobra Norato.',
            skills: [
                ['bico_arco_iris', 'Correnteza que Abraça', 'Marca uma área 3×3 sob o herói; saia antes da próxima ação do chefe.', 'telegraph'],
                ['inundacao', 'Redemoinho das Duas Margens', 'Atinge imediatamente duas colunas da arena e transforma os tiles de fogo nelas.', 'instant'],
            ],
            assetSkills: ['norato_correnteza', 'norato_redemoinho'],
        },
        {
            id: 'cabeca_cuia', rank: 2, name: 'Cabeça de Cuia', region: 'Cerrado',
            title: 'Fogo sob a Terra', element: 'TERRA', emoji: '🏺', hp: 115, atk: 4,
            entry: 8000, gold: 12000, xp: 2500,
            lore: 'Do leito do Parnaíba ergue-se uma cabeça enorme, marcada por uma maldição antiga. O fogo que a move dorme nas pedras quentes sob a terra e desperta quando o rio é ferido.',
            adaptation: 'Associada especialmente ao Piauí e ao rio Parnaíba; a ligação ao Cerrado é uma adaptação geográfica do jogo.',
            skills: [
                ['sete_cabecas', 'Fenda de Brasa', 'Abre duas linhas e duas colunas de fogo imediatamente; o dano é reduzido pela grande cobertura.', 'instant'],
                ['ima_almas', 'Turbilhão do Parnaíba', 'Marca a área ao redor do chefe; só quem permanecer nela é atingido e puxado.', 'telegraph'],
            ],
            assetSkills: ['cuia_fenda', 'cuia_turbilhao'],
        },
        {
            id: 'besta_fera', rank: 3, name: 'Besta-Fera', region: 'Caatinga',
            title: 'O Sertão que Engole', element: 'FOGO', emoji: '🐗', hp: 140, atk: 4,
            entry: 11000, gold: 17000, xp: 3500,
            lore: 'No sertão sem lua, passos pesados aparecem antes da criatura. A Besta-Fera é um presságio que tomou corpo: fome, medo e calor reunidos numa forma que atravessa a poeira sem deixar pegadas.',
            adaptation: 'A Besta-Fera tem versões regionais distintas; esta é uma interpretação fantástica do jogo para o sertão.',
            skills: [
                ['investida_diagonal', 'Investida da Fome', 'O chefe avança imediatamente por uma rota diagonal que atravessa a arena.', 'instant'],
                ['la_energizada', 'Varredura do Sertão', 'Marca os pontos dos projéteis diagonais; saia das casas antes do próximo turno do chefe.', 'telegraph'],
            ],
            assetSkills: ['besta_investida', 'besta_varredura'],
        },
        {
            id: 'pombero', rank: 4, name: 'Pombero', region: 'Mata Atlântica',
            title: 'A Mata que Escuta', element: 'AR', emoji: '🌿', hp: 165, atk: 5,
            entry: 14000, gold: 22000, xp: 4500,
            lore: 'Um assobio responde de dentro da mata, mas nunca vem do lugar esperado. Pombero conhece cada trilha e protege os animais; a corrupção transformou seu aviso em perseguição.',
            adaptation: 'Pombero pertence a tradições guarani de diversos territórios sul-americanos; sua presença aqui é uma adaptação narrativa.',
            skills: [
                ['raizes_estranguladoras', 'Raízes que Encontram', 'Marca o tile do herói; mover-se evita ser preso pelas raízes.', 'telegraph'],
                ['chamado_mata', 'Chamado da Mata', 'O assobio corta imediatamente duas colunas; o guardião também invoca um animal.', 'instant'],
            ],
            assetSkills: ['pombero_raizes', 'pombero_assobio'],
        },
        {
            id: 'minhocao_pantanal', rank: 5, name: 'Minhocão do Pantanal', region: 'Pantanal',
            title: 'O Fundo que se Move', element: 'AGUA', emoji: '🐉', hp: 190, atk: 5,
            entry: 17000, gold: 27000, xp: 5500,
            lore: 'Algo comprido demais para caber no rio desloca o fundo inteiro. O Minhocão rompe barrancos, afunda troncos e faz a água subir onde antes havia campo.',
            adaptation: 'Adaptação pantaneira inspirada em relatos históricos do Minhocão.',
            skills: [
                ['voo_rasante', 'O Fundo se Ergue', 'Marca o pouso 2×2 antes de o chefe irromper naquela posição.', 'telegraph'],
                ['sopro_tempestade', 'Cheia de Margem a Margem', 'A cheia atinge imediatamente duas linhas da arena e revolta esses tiles.', 'instant'],
            ],
            assetSkills: ['minhocao_fundo', 'minhocao_cheia'],
        },
        {
            id: 'minuano', rank: 6, name: 'Minuano', region: 'Pampas',
            title: 'O Vento que Não Dorme', element: 'AR', emoji: '🌬️', hp: 215, atk: 6,
            entry: 20000, gold: 32000, xp: 6500,
            lore: 'O vento frio que desce sobre os campos ganha forma quando uma frente de Anhangá aprisiona o horizonte. A vitória dissipa a tempestade e devolve o céu ao campo.',
            adaptation: 'Personificação fantástica de um vento regional, criada para a Raid.',
            skills: [
                ['salto_solar', 'Frente de Duas Lâminas', 'O pouso 2×2 do salto é marcado antes da queda.', 'telegraph'],
                ['clarao_cegante', 'Geada em Faixa', 'Duas diagonais de vento gelado cruzam a arena imediatamente.', 'instant'],
            ],
            assetSkills: ['minuano_frente', 'minuano_geada'],
        },
        {
            id: 'guajara', rank: 7, name: 'Guajará', region: 'Costa e mangue',
            title: 'A Maré sem Rosto', element: 'AGUA', emoji: '🦀', hp: 245, atk: 6,
            entry: 23000, gold: 38000, xp: 8000,
            lore: 'No encontro entre rio e mar, uma sombra cresce sob as raízes do mangue. Braços de água puxam barcos, raízes prendem os caminhos e o sal invade a terra doce.',
            adaptation: 'Interpretação de jogo inspirada no imaginário costeiro amazônico; os poderes são criações para esta Raid.',
            skills: [
                ['colheita_sombria', 'Voragem do Mangue', 'A maré marca uma área 3×3 no tile atual do herói; saia para escapar.', 'telegraph'],
                ['legado_filhos', 'Guardiões das Raízes', 'Duas linhas e duas colunas de água e raízes golpeiam imediatamente.', 'instant'],
            ],
            assetSkills: ['guajara_mare', 'guajara_voragem'],
        },
    ];

    const SKILL_SOURCES = {
        sete_cabecas: 'teju_jagua',
        ima_almas: 'teju_jagua',
        bico_arco_iris: 'mboi_tui',
        inundacao: 'mboi_tui',
        voo_rasante: 'monai',
        sopro_tempestade: 'monai',
        salto_solar: 'jasy_jatere',
        clarao_cegante: 'jasy_jatere',
        raizes_estranguladoras: 'kurupi',
        chamado_mata: 'kurupi',
        investida_diagonal: 'ao_ao',
        la_energizada: 'ao_ao',
        colheita_sombria: 'luison',
        legado_filhos: 'luison',
    };

    function safe(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
        })[char]);
    }

    function cloneSkill(id, name, text, element, timing) {
        const sourceConfig = window.STORY_RAID_CONFIG[SKILL_SOURCES[id]];
        const source = sourceConfig?.skills?.find(skill => skill.id === id);
        if (!source) throw new Error(`A habilidade Raid existente "${id}" não foi encontrada.`);
        return {
            ...source,
            nome: name,
            descricao: text,
            elementoPerigo: element,
            _raidTelegraph: timing === 'telegraph',
        };
    }

    function installConfigsAndAssets() {
        if (!window.STORY_RAID_CONFIG || !window.RAID_SPRITES || !window.RAID_EMOJIS) {
            throw new Error('O motor Raid V5 precisa ser carregado antes dos encontros regionais.');
        }

        RAID_DATA.forEach(raid => {
            const asset = window.A_RAID_ASSETS?.bosses?.[raid.id] || {};
            window.RAID_SPRITES[raid.id] = asset.sprite || '';
            window.RAID_EMOJIS[raid.id] = asset.emoji || raid.emoji;
            window.STORY_RAID_CONFIG[raid.id] = {
                id: raid.id,
                nome: raid.name,
                titulo: raid.title,
                elemento: raid.element,
                descricao: raid.lore,
                hp: raid.hp,
                atk: raid.atk,
                size: 2,
                custoEntrada: raid.entry,
                recompensaOuro: raid.gold,
                recompensaXP: raid.xp,
                desbloqueiaComAto: 1,
                skills: raid.skills.map(([id, name, text, timing]) =>
                    cloneSkill(id, name, text, raid.element, timing)
                ),
            };
        });

        const skillHandler = {
            sete_cabecas: 'raid_teju_sete_cabecas',
            ima_almas: 'raid_teju_ima_almas',
            bico_arco_iris: 'raid_mboi_bico_arco_iris',
            inundacao: 'raid_mboi_inundacao',
            voo_rasante: 'raid_monai_voo_rasante',
            sopro_tempestade: 'raid_monai_sopro_tempestade',
            salto_solar: 'raid_jasy_salto_solar',
            clarao_cegante: 'raid_jasy_clarao_cegante',
            raizes_estranguladoras: 'raid_kurupi_raizes_estranguladoras',
            chamado_mata: 'raid_kurupi_chamado_mata',
            investida_diagonal: 'raid_aoao_investida_diagonal',
            la_energizada: 'raid_aoao_la_energizada',
            colheita_sombria: 'raid_luison_colheita_sombria',
            legado_filhos: 'raid_luison_legado_filhos',
        };
        RAID_DATA.forEach(raid => {
            raid.skills.forEach(([id], index) => {
                const asset = window.A_RAID_ASSETS?.skills?.[raid.assetSkills[index]] || {};
                const handler = skillHandler[id];
                if (handler && asset.sound) window.RAID_SKILL_SOUNDS[handler] = asset.sound;
            });
        });
    }

    function weekKey() {
        const date = new Date();
        const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
        return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    }

    function unlockedHeroes() {
        const source = STORY_PROGRESS.unlockedHeroesStory || STORY_PROGRESS.selectedHeroes || [];
        return [...new Set(source)].filter(heroClass => STORY_HERO_CLASSES[heroClass]);
    }

    function selectedHero() {
        const selected = STORY_PROGRESS.selectedHeroes?.[0];
        return selected && unlockedHeroes().includes(selected) ? selected : null;
    }

    function costFor(raid, difficulty) {
        return Math.round(raid.entry * DIFFICULTIES[difficulty].cost);
    }

    function installRegionalStyles() {
        if (document.getElementById('regionalRaidStyle')) return;
        const style = document.createElement('style');
        style.id = 'regionalRaidStyle';
        style.textContent = `
            .raid-selecao-container {
                box-sizing: border-box;
                width: min(1200px, calc(100% - 24px));
                max-width: 1200px;
                margin: 24px auto;
                padding: 24px;
                background: linear-gradient(180deg, rgba(42,31,16,.97), rgba(20,14,8,.98));
                border: 2px solid #6a5024;
                border-radius: 12px;
                box-shadow: 0 12px 40px rgba(0,0,0,.7), 0 0 24px rgba(201,162,39,.12);
            }
            .raid-selecao-container > .story-header { margin-bottom: 22px; }
            .raid-selecao-container .story-subtitle { color: #c8b787; }
            .raid-preparation-panel {
                box-sizing: border-box;
                width: 100%;
                max-width: 900px;
                margin: 20px auto;
                padding: 0 22px 22px;
            }
            .raid-preparation-panel > .story-title { padding: 20px 12px 4px; text-align: center; }
            .raid-preparation-panel > p { color: #c8b787; text-align: center; line-height: 1.5; }
            .raid-preparation-panel .raid-modal-stats {
                grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
                padding: 12px 0;
                border-bottom: 0;
            }
            .raid-preparation-panel .raid-modal-stat {
                color: #e8dcc4;
                border: 1px solid rgba(230,126,34,.22);
            }
            .raid-preparation-panel select {
                box-sizing: border-box;
                width: 100%;
                margin-top: 8px;
                padding: 9px 10px;
                color: #fff5dc;
                background: #1a1208;
                border: 1px solid #8a6a2e;
                border-radius: 5px;
                font: 700 .9rem 'Cinzel', serif;
            }
            .raid-selected-hero {
                width: fit-content;
                margin: 8px auto 16px;
                padding: 10px 18px;
                color: #fff5dc;
                background: rgba(107,163,92,.12);
                border: 1px solid rgba(138,192,112,.55);
                border-radius: 6px;
                font: 700 .95rem 'Cinzel', serif;
                text-align: center;
            }
            #regionalRaidPrice {
                color: #e8b923;
                font: 700 .95rem 'Cinzel', serif;
                text-align: center;
            }
            .raid-preparation-panel .raid-modal-btn {
                display: block;
                width: min(100%, 420px);
                margin: 14px auto 0;
                transition: transform .2s, box-shadow .2s, filter .2s;
            }
            .raid-preparation-panel .raid-modal-btn:hover:not(:disabled) {
                filter: brightness(1.15);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0,0,0,.6), 0 0 25px rgba(230,126,34,.45);
            }
            .raid-preparation-panel .raid-modal-btn:disabled {
                color: #8a7a52;
                background: #2a1f10;
                border-color: #514127;
                cursor: not-allowed;
                opacity: .7;
            }
            .raid-portal {
                box-sizing: border-box;
                width: min(900px, calc(100% - 24px));
                margin: 0 auto 22px;
                padding: 16px 20px;
                text-align: center;
                background: linear-gradient(180deg, rgba(230,126,34,.14), transparent 70%), rgba(26,18,8,.94);
                border: 2px solid #8a6a2e;
                border-radius: 10px;
                box-shadow: 0 6px 20px rgba(0,0,0,.45);
            }
            .raid-portal h2 {
                margin: 0 0 5px;
                color: #f0c75e;
                font: 700 1rem 'Cinzel Decorative', serif;
                letter-spacing: 1.5px;
            }
            .raid-portal p {
                margin: 0 0 12px;
                color: #c8b787;
                font: italic .95rem 'EB Garamond', serif;
            }
            .raid-portal-button {
                padding: 10px 22px;
                color: #fff5dc;
                background: linear-gradient(180deg, rgba(232,185,35,.25), transparent 45%), linear-gradient(135deg, #8a6a2e, #4a3418);
                border: 2px solid #e8b923;
                border-radius: 6px;
                cursor: pointer;
                font: 700 .85rem 'Cinzel', serif;
                letter-spacing: 1px;
                transition: transform .2s, box-shadow .2s, filter .2s;
            }
            .raid-portal-button:hover {
                filter: brightness(1.15);
                transform: translateY(-2px);
                box-shadow: 0 6px 18px rgba(0,0,0,.5), 0 0 20px rgba(232,185,35,.4);
            }
            @media (max-width: 600px) {
                .raid-selecao-container { width: calc(100% - 12px); margin: 6px auto; padding: 14px; }
                .raid-preparation-panel { padding: 0 12px 16px; }
                .raid-portal { width: calc(100% - 12px); padding: 14px 10px; }
            }
        `;
        document.head.appendChild(style);
    }

    function renderMenu(selectedId) {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;
        const selected = RAID_DATA.find(raid => raid.id === selectedId);
        const heroClass = selectedHero();
        const currentWeek = weekKey();
        const gold = STORY_PROGRESS.gold || 0;
        const cards = RAID_DATA.map(raid => {
            const attempt = STORY_PROGRESS.raidAttempts?.[raid.id];
            const used = attempt?.week === currentWeek;
            const asset = window.A_RAID_ASSETS?.bosses?.[raid.id] || {};
            const icon = window.raidIcon(raid.id, 'large');
            return `
                <article class="raid-card ${used ? 'used' : 'unlocked'}">
                    <div class="raid-card-header"><div class="raid-card-num">RAID ${String(raid.rank).padStart(2, '0')} · ${safe(raid.region)}</div><div class="raid-card-elem">${safe(raid.element)}</div></div>
                    <div class="raid-card-sprite">${icon || safe(asset.emoji || raid.emoji)}</div>
                    <div class="raid-card-name">${safe(raid.name)}</div>
                    <div class="raid-card-title">${safe(raid.title)}</div>
                    <div class="raid-card-desc">${safe(raid.lore)}</div>
                    <div class="raid-card-desc">${safe(raid.adaptation)}</div>
                    ${used ? `<div class="raid-locked-msg">Tentativa da semana usada · ${safe(DIFFICULTIES[attempt.difficulty]?.label || attempt.difficulty)}</div>` : `<button class="raid-btn solo" onclick="window.raidSoloSelect('${raid.id}')">⚔️ PREPARAR RAID</button>`}
                </article>`;
        }).join('');

        let preparation = '';
        if (selected) {
            const attemptUsed = STORY_PROGRESS.raidAttempts?.[selected.id]?.week === currentWeek;
            const heroName = heroClass
                ? STORY_HERO_CLASSES[heroClass].displayName || heroClass
                : '';
            preparation = `
                <section class="raid-modal-panel raid-preparation-panel">
                    <h2 class="story-title">${safe(selected.name)} — Preparação</h2>
                    <p>${safe(selected.lore)}</p><p><i>${safe(selected.adaptation)}</i></p>
                    <div class="raid-modal-stats">
                        ${selected.skills.map(([id, name, text, timing]) => `<div class="raid-modal-stat"><b>${safe(name)}</b><br><small>${timing === 'telegraph' ? 'TELEGRAFADA · área escapável' : 'IMEDIATA · ataque tradicional'}</small><br>${safe(text)}</div>`).join('')}
                    </div>
                    ${heroClass ? `
                        <div class="raid-selected-hero">🛡️ Herói selecionado na Oca: ${safe(heroName)}</div>
                        <div class="raid-modal-stats">
                            <label class="raid-modal-stat">Dificuldade<select id="regionalRaidDifficulty">${Object.entries(DIFFICULTIES).map(([id, data]) => `<option value="${id}">${data.label}</option>`).join('')}</select></label>
                        </div>
                        <p id="regionalRaidPrice"></p>
                        <button class="raid-modal-btn confirmar" ${attemptUsed ? 'disabled' : ''} onclick="window.raidSoloStart('${selected.id}')">⚔️ INICIAR ENCONTRO</button>
                    ` : '<p>Selecione um herói desbloqueado na Oca antes de iniciar uma Raid.</p>'}
                </section>`;
        }

        screen.innerHTML = `
            <div class="story-container raid-selecao-container">
                <div class="story-header">
                    <h1 class="story-title">🌎 AS SETE PROVAÇÕES</h1>
                    <p class="story-subtitle">O combate usa o tabuleiro e as ações já existentes. Habilidades marcam o perigo com um turno de antecedência para você poder escapar.</p>
                    <p>Uma tentativa semanal por Raid, compartilhada entre dificuldades. Ouro: <b>${gold.toLocaleString('pt-BR')}</b></p>
                </div>
                ${preparation}
                <div class="raid-grid-selecao">${cards}</div>
                <div class="story-footer"><button class="story-back-btn" onclick="window.renderEventoSemanalScreen()">← VOLTAR A EVENTOS</button></div>
            </div>`;
        screen.classList.add('active');
        screen.style.display = 'flex';

        const difficulty = document.getElementById('regionalRaidDifficulty');
        if (difficulty && selected) {
            const updatePrice = () => {
                const scale = DIFFICULTIES[difficulty.value];
                document.getElementById('regionalRaidPrice').textContent =
                    `Entrada: ${costFor(selected, difficulty.value).toLocaleString('pt-BR')} ouro · ` +
                    `Vitória: ${Math.round(selected.gold * scale.reward).toLocaleString('pt-BR')} ouro + ` +
                    `${Math.round(selected.xp * scale.reward).toLocaleString('pt-BR')} XP`;
            };
            difficulty.addEventListener('change', updatePrice);
            updatePrice();
        }
    }

    function startRaid(raidId) {
        const difficulty = document.getElementById('regionalRaidDifficulty')?.value;
        if (!difficulty || !selectedHero()) return;
        window._regionalRaidContext = true;
        window.raidIniciarSoloViaCoop(raidId, {
            difficulty,
        });
    }

    function injectPortal() {
        const container = document.querySelector('#storyScreen .story-container');
        if (!container) return;
        let portal = container.querySelector('#regionalRaidPortal');
        if (!portal) {
            portal = document.createElement('section');
            portal.id = 'regionalRaidPortal';
            portal.className = 'raid-portal';
            portal.innerHTML = `
                <h2>⚔️ AS SETE PROVAÇÕES</h2>
                <p>Enfrente os sete guardiões regionais usando o combate Raid já existente.</p>
                <button class="raid-portal-button" onclick="window.raidSoloOpenMenu()">🌎 VER AS RAIDS</button>`;
        }
        const tabs = container.querySelector('.nacao-tabs-nav');
        const header = container.querySelector('.story-header');
        const anchor = tabs || header;
        if (anchor) anchor.insertAdjacentElement('afterend', portal);
        else container.prepend(portal);
    }

    function wrapEventScreen() {
        const original = window.renderEventoSemanalScreen;
        if (typeof original !== 'function' || original._regionalRaidsWrapped) return;
        const wrapped = function() {
            const result = original.apply(this, arguments);
            injectPortal();
            return result;
        };
        wrapped._regionalRaidsWrapped = true;
        window.renderEventoSemanalScreen = wrapped;
    }

    function registerRaidGear() {
        if (typeof STORY_WEAPONS === 'undefined' || typeof STORY_AMULETS === 'undefined') return;
        const weaponTypes = {
            tacape: { name: 'Tacape', emoji: '🪓' },
            flecha: { name: 'Flecha', emoji: '🏹' },
            cajado: { name: 'Cajado', emoji: '🪄' },
        };
        RAID_DATA.forEach(raid => {
            Object.entries(weaponTypes).forEach(([type, data]) => {
                const id = `raid_${raid.id}_${type}`;
                STORY_WEAPONS[id] = {
                    id, nome: `${data.name} de ${raid.name}`, tipo: type, ato: 1,
                    atkBonus: 3 + raid.rank, custoOuro: 0, emoji: data.emoji,
                    sprite: window.A_RAID_ASSETS?.weapons?.[id] || '',
                    raidOnly: true, raidId: raid.id, elemento: raid.element,
                    elementoBonus: 2 + Math.ceil(raid.rank / 2),
                    receita: { raid_drop_unavailable: 1 },
                };
            });
            const id = `raid_${raid.id}_amuleto`;
            STORY_AMULETS[id] = {
                id, nome: `Amuleto de ${raid.name}`, ato: 1, custoOuro: 0,
                emoji: '🔮', sprite: window.A_RAID_ASSETS?.amulets?.[id] || '',
                raidOnly: true, raidId: raid.id,
                efeito: {
                    atkBonus: Math.ceil(raid.rank / 3),
                    hpBonus: raid.rank + 3,
                    healPerTurn: Math.floor((raid.rank + 1) / 2),
                    elementOverride: raid.element,
                },
                receita: { raid_drop_unavailable: 1 },
            };
        });
        if (typeof isWeaponAvailable === 'function') {
            const original = isWeaponAvailable;
            window.isWeaponAvailable = id =>
                STORY_WEAPONS[id]?.raidOnly
                    ? (STORY_PROGRESS.craftedWeapons || []).includes(id)
                    : original(id);
        }
        if (typeof isAmuletAvailable === 'function') {
            const original = isAmuletAvailable;
            window.isAmuletAvailable = id =>
                STORY_AMULETS[id]?.raidOnly
                    ? (STORY_PROGRESS.craftedAmulets || []).includes(id)
                    : original(id);
        }
    }

    function grantRaidEquipment(config) {
        const difficultyId = STORY_PROGRESS.raidAttempts?.[config.id]?.difficulty || 'normal';
        const difficulty = DIFFICULTIES[difficultyId];
        if (!difficulty || Math.random() >= difficulty.drop) return null;

        const ownedWeapons = STORY_PROGRESS.craftedWeapons || [];
        const ownedAmulets = STORY_PROGRESS.craftedAmulets || [];
        const candidates = [
            ...['tacape', 'flecha', 'cajado']
                .map(type => `raid_${config.id}_${type}`)
                .filter(id => !ownedWeapons.includes(id)),
        ];
        const amuletId = `raid_${config.id}_amuleto`;
        if (!ownedAmulets.includes(amuletId)) candidates.push(amuletId);
        if (!candidates.length) return null;

        const id = candidates[Math.floor(Math.random() * candidates.length)];
        const isAmulet = id === amuletId;
        const owned = isAmulet ? STORY_PROGRESS.craftedAmulets : STORY_PROGRESS.craftedWeapons;
        if (!Array.isArray(owned)) {
            if (isAmulet) STORY_PROGRESS.craftedAmulets = [];
            else STORY_PROGRESS.craftedWeapons = [];
        }
        (isAmulet ? STORY_PROGRESS.craftedAmulets : STORY_PROGRESS.craftedWeapons).push(id);
        saveStoryProgress();

        const item = isAmulet ? STORY_AMULETS[id] : STORY_WEAPONS[id];
        return {
            nome: item.nome,
            emoji: item.emoji || '✨',
            sprite: item.sprite || '',
        };
    }

    window.raidSoloOpenMenu = () => renderMenu();
    window.raidSoloSelect = id => renderMenu(id);
    window.raidSoloStart = startRaid;
    window.onRegionalRaidVictory = grantRaidEquipment;
    window.RAID_SOLO_CONFIG = RAID_DATA;
    window.RAID_SOLO_DIFFICULTIES = DIFFICULTIES;

    installConfigsAndAssets();
    installRegionalStyles();
    registerRaidGear();
    wrapEventScreen();
    console.info('[Raid Regional] Sete encontros adaptados ao motor Raid V5.');
})();
