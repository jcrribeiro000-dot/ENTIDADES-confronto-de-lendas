
    // ================= VARIÁVEIS GLOBAIS =================
    let currentScreen = 'intro'; // intro, title, config, mode, players, game
    let COLORS = ['FOGO', 'AGUA', 'TERRA', 'AR'];
    let SPRITES = {
        Tupa: "https://i.imgur.com/L5V84tS.gif",
        Sume: "https://i.imgur.com/qoKCarB.gif",
        Caipora: "https://i.imgur.com/eBfmPl5.gif",
        BOITATA: "https://i.imgur.com/4PEG3BL.gif",
        MAPINGUARI: "https://i.imgur.com/TWRsZmS.gif",
        SACI: "https://i.imgur.com/zpVmIss.gif",
        IARA: "https://i.imgur.com/NxMl4Cj.gif",
        // SEGUNDO DESAFIO
        MULA: "https://i.imgur.com/SpEsN9P.gif",
        CORPOSECO: "https://i.imgur.com/5Tkoqxg.gif",
        LOBISOMEM: "https://i.imgur.com/9DJBxmg.gif",
        CUCA: "https://i.imgur.com/v6SowAl.gif",
        // TERCEIRO DESAFIO - NOVOS BOSSES
        BOTO: "https://i.imgur.com/InSAq1W.gif",
        BOI: "https://i.imgur.com/tP2hyxJ.gif",
        JACI: "https://i.imgur.com/vnRilxj.gif",
        GUARACI: "https://i.imgur.com/ThXOwpQ.gif",
        ANHANGA: "https://i.imgur.com/BfWrmfP.gif",
        
        Muiraquita: "https://i.imgur.com/WAWqKeB.png",
        VortexFX: "https://i.imgur.com/XHq6PVm.png",
        SwordFX: "https://cdn-icons-png.flaticon.com/512/6720/6720973.png",
        ArrowFX: "https://cdn-icons-png.flaticon.com/128/3854/3854999.png",
        MagicFX: "https://cdn-icons-png.flaticon.com/128/4325/4325956.png",
        BiteFX: "https://cdn-icons-png.flaticon.com/512/3504/3504404.png",
        RockFX: "https://cdn-icons-png.flaticon.com/128/12912/12912366.png",
        // EFEITOS VISUAIS
        FireballFX: "https://cdn-icons-png.flaticon.com/512/1163/1163657.png",
        ClawFX: "https://cdn-icons-png.flaticon.com/512/4600/4600704.png",
        PotionFX: "https://i.imgur.com/1ngilGX.png",
        PoisonFX: "https://i.imgur.com/1ngilGX.png",
        // NOVOS EFEITOS PARA TERCEIRO DESAFIO
        BrokenHeartFX: "https://i.imgur.com/gFlYuI5.png",
        ScaryFaceFX: "https://i.imgur.com/ao8mHA6.png",
        MoonFX: "https://i.imgur.com/fFNsTAu.png",
        SunFX: "https://i.imgur.com/CKWHQa3.png",
        // ANIMAÇÕES DO BRAVELY CHAIN
        BRAVELY_TUPA: "https://i.imgur.com/pCrboAh.gif",
        BRAVELY_SUME: "https://i.imgur.com/jDxEk8j.gif",
        BRAVELY_CAIPORA: "https://i.imgur.com/xPUhbKG.gif"
    };
    
    // ================= VARIÁVEIS DO JOGO =================
    let audioUnlocked = false;
    let CLASS_DB = {}, grid = [], path = [], players = [], amulets = [];
    let boss = { x: 4, y: 0, hp: 0, maxHp: 0, type: 'BOITATA', dead: false };
    let currentPlayerIdx = 0, editingIdx = 0, gameActive = true, mode = "BOSS", skillActive = false;
    
    // ================= SISTEMA DE ARCADE ATUALIZADO =================
    const ARCADE_ORDER_FIRST = ['SACI', 'MAPINGUARI', 'IARA', 'BOITATA'];  // Primeiro desafio
    const ARCADE_ORDER_SECOND = ['MULA', 'CORPOSECO', 'LOBISOMEM', 'CUCA']; // Segundo desafio
    const ARCADE_ORDER_THIRD = ['BOTO', 'BOI', 'JACI', 'GUARACI']; // Terceiro desafio - NOVO
    
    let arcadeCurrentOrder = ARCADE_ORDER_FIRST;
    let arcadeIndex = 0;
    let bossAIIsRunning = false;
    let arcadeBossTransition = false;
    let isExecutingAction = false;
    let currentArcadeChallenge = 1; // 1 = primeiro desafio, 2 = segundo desafio, 3 = terceiro desafio
    
    // ================= SISTEMA DE JOGADORES =================
    let playerCount = 1; // Padrão: 1 jogador
    let playerConfigs = [
        { name: 'Jogador 1', class: 'Tupa', active: true },
        { name: 'Jogador 2', class: 'Tupa', active: false },
        { name: 'Jogador 3', class: 'Tupa', active: false },
        { name: 'Jogador 4', class: 'Tupa', active: false }
    ];
    
    // ================= LORE & NARRATIVA ATUALIZADA =================
    const LORE = {
        currentStage: 1,
        anhangáRevealed: false,
        bossLore: {
            'SACI': {
                title: 'O Travesso Corrompido',
                intro: 'O Saci, sempre brincalhão, ouviu os sussurros de Anhangá: "Você é apenas uma piada, ninguém te leva a sério". Agora, sua diversão se transformou em fúria cega.',
                clue: '...cuidado com as águas escuras...',
                dialog: 'SACI: "Risos? Não ouço mais risos... só sussurros. Ele me disse que sou uma piada, que ninguém me leva a sério. Agora vou mostrar que não sou piada nenhuma!"'
            },
            'MAPINGUARI': {
                title: 'O Devorador Despertado',
                intro: 'O gigante protetor das árvores foi consumido pela frustração. "Você é fraco, a floresta morre e você não pode impedir", ecoou em sua mente. Agora, ele devora o que jurado proteger.',
                clue: '...o fogo serpente queima com ódio puro...',
                dialog: 'MAPINGUARI: "As árvores choram... a floresta morre... e eu sou impotente! Anhangá mostrou que minha força pode ser usada para devorar, não para proteger. Agora vou devorar tudo!"'
            },
            'IARA': {
                title: 'O Canto da Perdição', 
                intro: 'Iara, sedutora dos rios, foi envenenada pela raiva. "Os humanos poluem seu reino e riem de você", sussurrou a sombra. Suas águas agora afogam sem piedade.',
                clue: '...o devorador da floresta ruge com fome...',
                dialog: 'IARA: "Meus rios... tão sujos... tão poluídos... Os humanos riem de mim enquanto destroem meu lar. Anhangá me deu força para afogar todos eles. Venham, dancem em minhas águas!"'
            },
            'BOITATA': {
                title: 'A Serpente de Fogo',
                intro: 'Anhangá ofereceu poder ao Boitatá: "Seu fogo é fraco, apenas luzinhas na noite". A serpente aceitou, tornando-se um inferno ambulante que consome tudo.',
                clue: '...ele vem... a sombra por trás de tudo...',
                dialog: 'BOITATÁ: "Meu fogo era fraco... apenas luzes na escuridão. Anhangá me deu o verdadeiro poder do inferno! Agora vou consumir tudo que encontrar em meu caminho!"'
            },
            // SEGUNDO DESAFIO
            'MULA': {
                title: 'O Relincho da Noite',
                intro: 'A Mula sem Cabeça, amaldiçoada por seus pecados, foi consumida pela fúria de Anhangá. "Sua forma é um castigo, aceite seu destino de destruição", sussurrou a sombra. Agora, ela relincha fogo e dor.',
                clue: '...a secura consome tudo...',
                dialog: 'MULA SEM CABEÇA: "Relincho de dor... este é meu destino? Anhangá me mostrou que minha maldição pode ser minha força. Agora levarei fogo e dor a todos!"'
            },
            'CORPOSECO': {
                title: 'O Devorador de Almas',
                intro: 'O Corpo Seco, esqueleto faminto, foi tentado por Anhangá: "Sua fome nunca será saciada, a menos que devore tudo ao seu redor". Agora, sua fome é infinita.',
                clue: '...o lobo uiva na lua cheia...',
                dialog: 'CORPO SECO: "Fome... tanta fome... Anhangá me prometeu que se eu devorasse tudo, minha fome seria saciada. Vou devorar suas almas!"'
            },
            'LOBISOMEM': {
                title: 'A Maldição da Lua',
                intro: 'O Lobisomem, amaldiçoado a se transformar, ouviu Anhangá: "Sua forma bestial é seu verdadeiro eu, liberte a fera". A lua agora desperta apenas ódio.',
                clue: '...a bruxa prepara suas poções...',
                dialog: 'LOBISOMEM: "A lua me amaldiçoa... mas Anhangá me mostrou que esta forma bestial é minha verdadeira natureza. Deixem a fera dentro de mim se libertar!"'
            },
            'CUCA': {
                title: 'A Bruxa da Floresta',
                intro: 'Cuca, a velha bruxa, foi corrompida por Anhangá: "Seu conhecimento é fraco, apenas a destruição traz poder real". Suas poções agora são veneno puro.',
                clue: '...Anhangá aguarda no final...',
                dialog: 'CUCA: "Meus conhecimentos eram fracos... poções de cura? Para quê? Anhangá me ensinou que apenas a destruição traz poder real. Prove minhas novas poções!"'
            },
            // TERCEIRO DESAFIO - NOVOS BOSSES
            'BOTO': {
                title: 'O Sedutor das Águas',
                intro: 'O Boto Rosa, sedutor das águas doces, foi corrompido pela luxúria de Anhangá. "Seu poder de sedução é fraco, use-o para destruir em vez de conquistar", sussurrou a sombra. Agora, seus encantos são mortalmente perigosos.',
                clue: '...o boi da cara preta observa...',
                dialog: 'BOTO ROSA: "As águas eram meu refúgio... minha beleza, minha arma. Anhangá mostrou que posso ser mais que um sedutor. Posso ser um destruidor! Sintam o poder das águas corrompidas!"'
            },
            'BOI': {
                title: 'O Terrível das Sombras',
                intro: 'O Boi da Cara Preta, guardião das trevas, foi consumido pelo medo. "Seu rosto assusta, mas é apenas máscara", riu Anhangá. Agora, seu verdadeiro terror se revela.',
                clue: '...a lua de Jaci brilha no céu...',
                dialog: 'BOI DA CARA PRETA: "Minha face escura sempre assustou... mas era apenas casca. Anhangá me revelou meu verdadeiro poder: o terror puro! Sintam o medo que habita nas sombras!"'
            },
            'JACI': {
                title: 'A Deusa da Lua Corrompida',
                intro: 'Jaci, deusa da lua, foi envenenada pela melancolia. "Sua luz é fria e inútil", zombou Anhangá. Agora, seus raios lunares queimam em vez de iluminar.',
                clue: '...o sol de Guaraci queima tudo...',
                dialog: 'JACI: "Minha luz deveria guiar... acalmar... iluminar. Mas Anhangá mostrou que minha luz pode queimar em vez de iluminar. Sintam o frio ardente da lua corrompida!"'
            },
            'GUARACI': {
                title: 'O Sol Devorador',
                intro: 'Guaraci, deus do sol, foi consumido pela arrogância. "Seu calor acolhedor é fraco", desafiou Anhangá. "Torne-se um inferno ambulante". Agora, seu sol queima sem piedade.',
                clue: '...ele vem... o verdadeiro mal...',
                dialog: 'GUARACI: "Meu sol aquecia... nutria... dava vida. Anhangá me ensinou que meu verdadeiro poder é queimar, não aquecer. Sintam o inferno solar que agora trago!"'
            },
            // BOSS FINAL
            'ANHANGA': {
                title: 'O Espírito do Mal',
                intro: 'Anhangá, a contraparte maligna de Tupã, é o espírito do mal na mitologia tupi-guaraní. Após corromper todos os outros seres da floresta, ele finalmente se revela para enfrentar os heróis pessoalmente.',
                clue: '...a escuridão sempre retorna...',
                dialog: 'ANHANGÁ: "Por séculos observei a destruição que vocês, mortais, causam. Florestas queimadas, rios poluídos, ar contaminado... A natureza grita por vingança! Eu apenas dei voz ao seu ódio. Aqueles que corrompi eram apenas ferramentas. Agora enfrentem o verdadeiro espírito da destruição!"'
            }
        },
        anhangáImage: 'https://i.ibb.co/cSr7cZG2/anhanga.png'
    };
    
    // ================= RANKING SYSTEM =================
    const RANKING = {
        turns: 0,
        ultimates: 0,
        amulets: 0,
        shapes: { LINHA:0, L:0, ZIGZAG:0, QUADRADO:0 },
        sent: false
    };
    
    let RANKING_CACHE = [];
    let LAST_RANKING_LOAD = 0;
    const RANKING_CACHE_TIME = 30000;

    // ================= SISTEMA DE TÍTULOS =================
    const TITLES = {
        'novato': {
            name: 'Novato da Floresta',
            icon: '🌱',
            description: 'Complete 3 jogos',
            bonus: { type: 'ATK', value: 0.5 },
            requirement: { type: 'games_played', target: 3 },
            category: 'basic',
            unlocked: false,
            progress: 0
        },
        
        'sobrevivente': {
            name: 'Sobrevivente',
            icon: '🛡️',
            description: 'Sobreviva com 1 HP em 3 jogos',
            bonus: { type: 'MAX_HP', value: 1 },
            requirement: { type: 'survive_1hp', target: 3 },
            category: 'basic',
            unlocked: false,
            progress: 0
        },
        
        'colecionador_basico': {
            name: 'Colecionador',
            icon: '💎',
            description: 'Colete 15 Muiraquitãs no total',
            bonus: { type: 'ATK', value: 0.5 },
            requirement: { type: 'total_amulets', target: 15 },
            category: 'basic',
            unlocked: false,
            progress: 0
        },
        
        'veterano': {
            name: 'Veterano',
            icon: '🎖️',
            description: 'Jogue 10 partidas',
            bonus: { type: 'MAX_HP', value: 2 },
            requirement: { type: 'games_played', target: 10 },
            category: 'basic',
            unlocked: false,
            progress: 0
        },
        
        'estrategista': {
            name: 'Estrategista',
            icon: '🧠',
            description: 'Execute 5 Bravely Chains',
            bonus: { type: 'ATK', value: 1 },
            requirement: { type: 'bravely_chains', target: 5 },
            category: 'basic',
            unlocked: false,
            progress: 0
        },
        
        'curandeiro': {
            name: 'Curandeiro',
            icon: '💚',
            description: 'Cure 30 HP total',
            bonus: { type: 'MAX_HP', value: 1 },
            requirement: { type: 'total_healing', target: 30 },
            category: 'basic',
            unlocked: false,
            progress: 0
        },
        
        'filho_do_fogo': {
            name: 'Filho do Fogo',
            icon: '🔥',
            description: 'Cause 30 dano com tiles de FOGO',
            bonus: { 
                type: 'ELEMENTAL_RESIST', 
                value: -1,
                element: 'FOGO'
            },
            requirement: { type: 'element_damage', element: 'FOGO', target: 30 },
            category: 'elemental',
            unlocked: false,
            progress: 0
        },
        
        'filho_da_agua': {
            name: 'Filho da Água',
            icon: '💧',
            description: 'Cure 15 HP com forma L (ÁGUA)',
            bonus: { 
                type: 'ELEMENTAL_RESIST', 
                value: -1,
                element: 'AGUA'
            },
            requirement: { type: 'water_healing', target: 15 },
            category: 'elemental',
            unlocked: false,
            progress: 0
        },
        
        'filho_da_terra': {
            name: 'Filho da Terra',
            icon: '🌍',
            description: 'Fortifique 10 tiles de TERRA',
            bonus: { 
                type: 'ELEMENTAL_RESIST', 
                value: -1,
                element: 'TERRA'
            },
            requirement: { type: 'earth_tiles', target: 10 },
            category: 'elemental',
            unlocked: false,
            progress: 0
        },
        
        'filho_do_ar': {
            name: 'Filho do Ar',
            icon: '💨',
            description: 'Mova-se por 30 tiles de AR',
            bonus: { 
                type: 'ELEMENTAL_RESIST', 
                value: -1,
                element: 'AR'
            },
            requirement: { type: 'air_tiles', target: 30 },
            category: 'elemental',
            unlocked: false,
            progress: 0
        },
        
        'aprendiz_tupa': {
            name: 'Aprendiz de Tupã',
            icon: '⚡',
            description: 'Cause 50 dano corpo-a-corpo como Tupã',
            bonus: { 
                type: 'CLASS_BONUS',
                value: 'tupa_melee',
                class: 'Tupa',
                desc: '+0.5 ATK corpo-a-corpo (Tupã)'
            },
            requirement: { type: 'class_damage', class: 'Tupa', target: 50 },
            category: 'class',
            unlocked: false,
            progress: 0
        },
        
        'aprendiz_sume': {
            name: 'Aprendiz de Sumé',
            icon: '📜',
            description: 'Cause 40 dano à distância como Sumé',
            bonus: { 
                type: 'CLASS_BONUS',
                value: 'sume_range',
                class: 'Sume',
                desc: '+0.5 ATK à distância (Sumé)'
            },
            requirement: { type: 'class_damage', class: 'Sume', target: 40 },
            category: 'class',
            unlocked: false,
            progress: 0
        },
        
        'aprendiz_caipora': {
            name: 'Aprendiz da Caipora',
            icon: '🏹',
            description: 'Cause 45 dano com flechas como Caipora',
            bonus: { 
                type: 'CLASS_BONUS',
                value: 'caipora_arrow',
                class: 'Caipora',
                desc: '+0.5 dano com flechas (Caipora)'
            },
            requirement: { type: 'class_damage', class: 'Caipora', target: 45 },
            category: 'class',
            unlocked: false,
            progress: 0
        },
        
        'cacador_de_bosses': {
            name: 'Caçador de Bosses',
            icon: '👹',
            description: 'Derrote 2 bosses diferentes',
            bonus: { 
                type: 'UNIQUE',
                value: 'boss_hunter',
                desc: '+1 ATK contra bosses'
            },
            requirement: { type: 'bosses_defeated', target: 2 },
            category: 'unique',
            unlocked: false,
            progress: 0
        },
        
        'mestre_das_formas': {
            name: 'Mestre das Formas',
            icon: '🔷',
            description: 'Execute todas as 4 formas especiais',
            bonus: { 
                type: 'UNIQUE',
                value: 'shape_master',
                desc: 'Formas dão +1 bônus extra'
            },
            requirement: { type: 'all_shapes', target: 1 },
            category: 'unique',
            unlocked: false,
            progress: 0
        },
        
        'rei_do_arcane': {
            name: 'Rei do Arcane',
            icon: '👑',
            description: 'Use 10 ultimates no total',
            bonus: { 
                type: 'UNIQUE',
                value: 'arcane_king',
                desc: 'Ultimate recarrega 1 turno mais rápido'
            },
            requirement: { type: 'ultimates_used', target: 10 },
            category: 'unique',
            unlocked: false,
            progress: 0
        }
    };

    // Estatísticas do jogador para títulos
    let PLAYER_STATS = {
        games_played: 0,
        survive_1hp: 0,
        total_amulets: 0,
        bravely_chains: 0,
        total_healing: 0,
        element_damage: { FOGO: 0, AGUA: 0, TERRA: 0, AR: 0 },
        water_healing: 0,
        earth_tiles: 0,
        air_tiles: 0,
        class_damage: { Tupa: 0, Sume: 0, Caipora: 0 },
        bosses_defeated: [],
        all_shapes: false,
        ultimates_used: 0,
        shapes_executed: { LINHA: 0, L: 0, QUADRADO: 0, ZIGZAG: 0 }
    };

    // Título ativo do jogador
    let ACTIVE_TITLE = null;

    // ================= NOVA FUNÇÃO: MOSTRAR DIALOGO DO BOSS =================
    async function showBossIntroDialog(bossType) {
        return new Promise((resolve) => {
            const lore = LORE.bossLore[bossType];
            if (!lore) {
                resolve();
                return;
            }
            
            const overlay = document.createElement('div');
            overlay.className = 'boss-dialog-overlay';
            overlay.id = 'bossDialogOverlay';
            
            const dialog = document.createElement('div');
            dialog.className = 'boss-dialog';
            
            dialog.innerHTML = `
                <div class="boss-dialog-header">
                    <img src="${SPRITES[bossType]}" class="boss-dialog-image" alt="${bossType}">
                    <div>
                        <h2 class="boss-dialog-title">${bossType}</h2>
                        <div class="boss-dialog-subtitle">${lore.title}</div>
                    </div>
                </div>
                <div class="boss-dialog-text">
                    ${lore.dialog}
                </div>
                <button class="boss-dialog-continue" onclick="closeBossDialog()">
                    CONTINUAR
                </button>
            `;
            
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);
            
            // Adicionar função para fechar o diálogo
            window.closeBossDialog = function() {
                const overlay = document.getElementById('bossDialogOverlay');
                if (overlay) {
                    overlay.style.opacity = '0';
                    overlay.style.transition = 'opacity 0.3s ease';
                    
                    setTimeout(() => {
                        if (overlay.parentNode) {
                            overlay.parentNode.removeChild(overlay);
                        }
                        resolve();
                    }, 300);
                }
            };
            
            // Permitir fechar com ESC
            overlay.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    closeBossDialog();
                }
            });
            
            // Focar no botão para permitir fechar com Enter
            setTimeout(() => {
                const button = dialog.querySelector('.boss-dialog-continue');
                if (button) button.focus();
            }, 100);
        });
    }

    // ================= FUNÇÕES DE INTRODUÇÃO =================
    function showIntro() {
    const introScreen = document.getElementById('introScreen');
    const titleScreen = document.getElementById('titleScreen');
    
    introScreen.style.display = 'flex';
    titleScreen.style.display = 'none';
    
    // 🔉 TOCAR SOM DA INTRO
    if (sfx.intro) {
        sfx.intro.volume = 0.4; // Volume mais baixo
        sfx.intro.currentTime = 0; // Reiniciar o som
        sfx.intro.play();
    }
    
    setTimeout(() => {
        introScreen.style.opacity = '0';
        
        setTimeout(() => {
            introScreen.style.display = 'none';
            titleScreen.style.display = 'flex';
            currentScreen = 'title';
            unlockAudio();
        }, 800);
    }, 3000);
}

    // ================= FUNÇÕES DE NAVEGAÇÃO =================
    function startGame() {
        hideScreen('titleScreen');
        showScreen('modeScreen');
        currentScreen = 'mode';
    }
    
    function showConfigScreen() {
        showScreen('configScreen');
        currentScreen = 'config';
        loadConfigToUI();
    }
    
    function hideConfig() {
        hideScreen('configScreen');
        showScreen('titleScreen');
        currentScreen = 'title';
    }
    
    function selectMode(selectedMode) {
        mode = selectedMode;
        
        if (mode === "PVP") {
            playerCount = 2;
            for (let i = 0; i < 4; i++) {
                playerConfigs[i].active = (i < 2);
            }
            showPlayersScreen();
        } else {
            showPlayersScreen();
        }
    }
    
    function showPlayersScreen() {
        hideScreen('modeScreen');
        showScreen('playersScreen');
        currentScreen = 'players';
        updatePlayersUI();
    }
    
    function backToModeSelection() {
        hideScreen('playersScreen');
        showScreen('modeScreen');
        currentScreen = 'mode';
    }
    
    function setPlayerCount(count) {
        playerCount = count;
        
        document.querySelectorAll('.player-count-btn').forEach((btn, index) => {
            if (index + 1 === count) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        for (let i = 0; i < 4; i++) {
            playerConfigs[i].active = (i < count);
        }
        
        updatePlayersUI();
    }
    
    function updatePlayersUI() {
        const grid = document.getElementById('playersGrid');
        grid.innerHTML = '';
        
        for (let i = 0; i < 4; i++) {
            const config = playerConfigs[i];
            const isActive = config.active;
            
            const card = document.createElement('div');
            card.className = `player-card ${isActive ? 'active' : ''}`;
            card.innerHTML = `
                <div class="player-card-header">
                    <div class="player-number">JOGADOR ${i + 1}</div>
                    <div class="player-status ${isActive ? '' : 'inactive'}">
                        ${isActive ? 'ATIVO' : 'INATIVO'}
                    </div>
                </div>
                <div class="player-form">
                    <input type="text" 
                           class="player-input player-name" 
                           value="${config.name}" 
                           placeholder="Nome do Jogador"
                           ${!isActive ? 'disabled' : ''}
                           oninput="updatePlayerConfig(${i}, 'name', this.value)">
                    
                    <select class="player-select player-class"
                            ${!isActive ? 'disabled' : ''}
                            onchange="updatePlayerConfig(${i}, 'class', this.value)">
                        <option value="Tupa" ${config.class === 'Tupa' ? 'selected' : ''}>Tupã</option>
                        <option value="Sume" ${config.class === 'Sume' ? 'selected' : ''}>Sumé</option>
                        <option value="Caipora" ${config.class === 'Caipora' ? 'selected' : ''}>Caipora</option>
                    </select>
                    
                    ${isActive ? `
                        <div class="player-stats-preview">
                            <div class="stat-row">
                                <span>HP:</span>
                                <span id="player${i}HP">${CLASS_DB[config.class]?.hp || 0}</span>
                            </div>
                            <div class="stat-row">
                                <span>ATK:</span>
                                <span id="player${i}ATK">${CLASS_DB[config.class]?.atk || 0}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
            
            grid.appendChild(card);
        }
        
        updateClassBase();
        for (let i = 0; i < 4; i++) {
            const config = playerConfigs[i];
            if (config.active && CLASS_DB[config.class]) {
                document.getElementById(`player${i}HP`).textContent = CLASS_DB[config.class].hp;
                document.getElementById(`player${i}ATK`).textContent = CLASS_DB[config.class].atk;
            }
        }
    }
    
    function updatePlayerConfig(index, field, value) {
        if (playerConfigs[index]) {
            playerConfigs[index][field] = value;
            
            if (field === 'class' && CLASS_DB[value]) {
                const hpEl = document.getElementById(`player${index}HP`);
                const atkEl = document.getElementById(`player${index}ATK`);
                if (hpEl && atkEl) {
                    hpEl.textContent = CLASS_DB[value].hp;
                    atkEl.textContent = CLASS_DB[value].atk;
                }
            }
        }
    }
    
    function startGameWithPlayers() {
        if (mode === "BOSS") {
            showBossSelection();
        } else if (mode === "ARCADE") {
            showArcadeChallengeSelection();
        } else if (mode === "PVP") {
            hideScreen('playersScreen');
            showScreen('gameScreen');
            currentScreen = 'game';
            initGameWithPlayers();
        }
    }
    
    function showBossSelection() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.95); z-index: 10001;
            display: flex; flex-direction: column; justify-content: center;
            align-items: center; color: white;
        `;
        
        // Obter bosses disponíveis (todos incluindo os novos)
        let bossesHTML = '';
        const allBosses = [
            { type: 'BOITATA', name: 'BOITATÁ', desc: 'A Serpente de Fogo', color: '#e74c3c', sprite: SPRITES.BOITATA },
            { type: 'MAPINGUARI', name: 'MAPINGUARI', desc: 'O Devorador', color: '#27ae60', sprite: SPRITES.MAPINGUARI },
            { type: 'SACI', name: 'SACI', desc: 'O Travesso', color: '#9b59b6', sprite: SPRITES.SACI },
            { type: 'IARA', name: 'IARA', desc: 'A Sedutora', color: '#3498db', sprite: SPRITES.IARA },
            { type: 'MULA', name: 'MULA', desc: 'O Relincho da Noite', color: '#e67e22', sprite: SPRITES.MULA },
            { type: 'CORPOSECO', name: 'CORPO SECO', desc: 'O Devorador de Almas', color: '#95a5a6', sprite: SPRITES.CORPOSECO },
            { type: 'LOBISOMEM', name: 'LOBISOMEM', desc: 'A Maldição da Lua', color: '#34495e', sprite: SPRITES.LOBISOMEM },
            { type: 'CUCA', name: 'CUCA', desc: 'A Bruxa da Floresta', color: '#8e44ad', sprite: SPRITES.CUCA },
            // NOVOS BOSSES DO TERCEIRO DESAFIO
            { type: 'BOTO', name: 'BOTO ROSA', desc: 'O Sedutor das Águas', color: '#e84393', sprite: SPRITES.BOTO },
            { type: 'BOI', name: 'BOI DA CARA PRETA', desc: 'O Terrível', color: '#2c3e50', sprite: SPRITES.BOI },
            { type: 'JACI', name: 'JACI', desc: 'A Deusa da Lua', color: '#f1c40f', sprite: SPRITES.JACI },
            { type: 'GUARACI', name: 'GUARACI', desc: 'O Deus do Sol', color: '#e67e22', sprite: SPRITES.GUARACI }
        ];
        
        allBosses.forEach(bossInfo => {
            bossesHTML += `
                <div style="background: #2c3e50; padding: 20px; border-radius: 10px; text-align: center; cursor: pointer; transition: all 0.3s; border: 2px solid #444;"
                     onclick="selectBoss('${bossInfo.type}'); this.parentElement.parentElement.remove();">
                    <img src="${bossInfo.sprite}" style="width: 100px; height: 100px; margin-bottom: 10px;">
                    <h3 style="color: ${bossInfo.color}; margin-bottom: 5px;">${bossInfo.name}</h3>
                    <p style="color: #ccc; font-size: 0.9rem;">${bossInfo.desc}</p>
                </div>
            `;
        });
        
        modal.innerHTML = `
            <h2 style="color: #f1c40f; font-size: 2.5rem; margin-bottom: 30px; text-align: center;">ESCOLHA O BOSS</h2>
            <div style="max-height: 70vh; overflow-y: auto; padding: 20px; width: 100%;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; width: 100%;">
                    ${bossesHTML}
                </div>
            </div>
            <button onclick="this.parentElement.remove();" 
                    style="padding: 12px 25px; background: #e74c3c; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; margin-top: 20px;">
                CANCELAR
            </button>
        `;
        
        document.body.appendChild(modal);
    }
    
    function showArcadeChallengeSelection() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.95); z-index: 10001;
            display: flex; flex-direction: column; justify-content: center;
            align-items: center; color: white;
        `;
        
        // Verificar progresso salvo
        const savedData = localStorage.getItem('entity_titles_data');
        let secondChallengeAvailable = false;
        let thirdChallengeAvailable = false;
        
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                const bossesDefeated = data.stats?.bosses_defeated || [];
                
                // Verificar primeiro desafio
                const firstChallengeBosses = ['SACI', 'MAPINGUARI', 'IARA', 'BOITATA'];
                secondChallengeAvailable = firstChallengeBosses.every(boss => bossesDefeated.includes(boss));
                
                // Verificar segundo desafio
                const secondChallengeBosses = ['MULA', 'CORPOSECO', 'LOBISOMEM', 'CUCA'];
                thirdChallengeAvailable = secondChallengeBosses.every(boss => bossesDefeated.includes(boss));
            } catch (e) {
                console.error("Erro ao verificar progresso:", e);
            }
        }
        
        modal.innerHTML = `
            <h2 style="color: #f1c40f; font-size: 2.5rem; margin-bottom: 30px; text-align: center;">ESCOLHA O DESAFIO ARCADE</h2>
            <div style="display: grid; grid-template-columns: ${secondChallengeAvailable ? '1fr 1fr 1fr' : '1fr'}; gap: 20px; width: 90%; max-width: 1000px; margin-bottom: 30px;">
                <div style="background: #2c3e50; padding: 25px; border-radius: 10px; text-align: center; cursor: pointer; transition: all 0.3s; border: 2px solid #444;"
                     onclick="selectArcadeChallenge(1); this.parentElement.parentElement.remove();">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🏆</div>
                    <h3 style="color: #f1c40f; margin-bottom: 5px;">DESAFIO 1</h3>
                    <p style="color: #ccc; font-size: 0.9rem; margin-bottom: 15px;">Enfrente os 4 bosses iniciais</p>
                    <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 15px;">
                        <img src="${SPRITES.SACI}" style="width: 40px; height: 40px; border-radius: 5px;" title="SACI">
                        <img src="${SPRITES.MAPINGUARI}" style="width: 40px; height: 40px; border-radius: 5px;" title="MAPINGUARI">
                        <img src="${SPRITES.IARA}" style="width: 40px; height: 40px; border-radius: 5px;" title="IARA">
                        <img src="${SPRITES.BOITATA}" style="width: 40px; height: 40px; border-radius: 5px;" title="BOITATÁ">
                    </div>
                    <div style="color: #2ecc71; font-size: 0.8rem;">✅ DISPONÍVEL</div>
                </div>
                
                ${secondChallengeAvailable ? `
                <div style="background: #2c3e50; padding: 25px; border-radius: 10px; text-align: center; cursor: pointer; transition: all 0.3s; border: 2px solid #9b59b6;"
                     onclick="selectArcadeChallenge(2); this.parentElement.parentElement.remove();">
                    <div style="font-size: 3rem; margin-bottom: 15px;">👑</div>
                    <h3 style="color: #9b59b6; margin-bottom: 5px;">DESAFIO 2</h3>
                    <p style="color: #ccc; font-size: 0.9rem; margin-bottom: 15px;">Enfrente os 4 novos bosses lendários</p>
                    <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 15px;">
                        <img src="${SPRITES.MULA}" style="width: 40px; height: 40px; border-radius: 5px;" title="MULA SEM CABEÇA">
                        <img src="${SPRITES.CORPOSECO}" style="width: 40px; height: 40px; border-radius: 5px;" title="CORPO SECO">
                        <img src="${SPRITES.LOBISOMEM}" style="width: 40px; height: 40px; border-radius: 5px;" title="LOBISOMEM">
                        <img src="${SPRITES.CUCA}" style="width: 40px; height: 40px; border-radius: 5px;" title="CUCA">
                    </div>
                    <div style="color: #9b59b6; font-size: 0.8rem;">⭐ DESBLOQUEADO</div>
                </div>
                ` : `
                <div style="background: #2c3e50; padding: 25px; border-radius: 10px; text-align: center; border: 2px dashed #7f8c8d; opacity: 0.7;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🔒</div>
                    <h3 style="color: #7f8c8d; margin-bottom: 5px;">DESAFIO 2</h3>
                    <p style="color: #aaa; font-size: 0.9rem; margin-bottom: 15px;">Complete o Desafio 1 para desbloquear</p>
                    <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 15px; opacity: 0.5;">
                        <img src="${SPRITES.MULA}" style="width: 40px; height: 40px; border-radius: 5px; filter: grayscale(100%);" title="MULA SEM CABEÇA">
                        <img src="${SPRITES.CORPOSECO}" style="width: 40px; height: 40px; border-radius: 5px; filter: grayscale(100%);" title="CORPO SECO">
                        <img src="${SPRITES.LOBISOMEM}" style="width: 40px; height: 40px; border-radius: 5px; filter: grayscale(100%);" title="LOBISOMEM">
                        <img src="${SPRITES.CUCA}" style="width: 40px; height: 40px; border-radius: 5px; filter: grayscale(100%);" title="CUCA">
                    </div>
                    <div style="color: #e74c3c; font-size: 0.8rem;">🔒 BLOQUEADO</div>
                </div>
                `}
                
                ${thirdChallengeAvailable ? `
                <div style="background: #2c3e50; padding: 25px; border-radius: 10px; text-align: center; cursor: pointer; transition: all 0.3s; border: 2px solid #e67e22;"
                     onclick="selectArcadeChallenge(3); this.parentElement.parentElement.remove();">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🔥</div>
                    <h3 style="color: #e67e22; margin-bottom: 5px;">DESAFIO 3</h3>
                    <p style="color: #ccc; font-size: 0.9rem; margin-bottom: 15px;">Enfrente os 4 bosses divinos corrompidos</p>
                    <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 15px;">
                        <img src="${SPRITES.BOTO}" style="width: 40px; height: 40px; border-radius: 5px;" title="BOTO ROSA">
                        <img src="${SPRITES.BOI}" style="width: 40px; height: 40px; border-radius: 5px;" title="BOI DA CARA PRETA">
                        <img src="${SPRITES.JACI}" style="width: 40px; height: 40px; border-radius: 5px;" title="JACI">
                        <img src="${SPRITES.GUARACI}" style="width: 40px; height: 40px; border-radius: 5px;" title="GUARACI">
                    </div>
                    <div style="color: #e67e22; font-size: 0.8rem;">🔥 DESAFIO FINAL</div>
                </div>
                ` : `
                <div style="background: #2c3e50; padding: 25px; border-radius: 10px; text-align: center; border: 2px dashed #e67e22; opacity: 0.7;">
                    <div style="font-size: 3rem; margin-bottom: 15px;">🔒</div>
                    <h3 style="color: #e67e22; margin-bottom: 5px;">DESAFIO 3</h3>
                    <p style="color: #aaa; font-size: 0.9rem; margin-bottom: 15px;">Complete o Desafio 2 para desbloquear</p>
                    <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 15px; opacity: 0.5;">
                        <img src="${SPRITES.BOTO}" style="width: 40px; height: 40px; border-radius: 5px; filter: grayscale(100%);" title="BOTO ROSA">
                        <img src="${SPRITES.BOI}" style="width: 40px; height: 40px; border-radius: 5px; filter: grayscale(100%);" title="BOI DA CARA PRETA">
                        <img src="${SPRITES.JACI}" style="width: 40px; height: 40px; border-radius: 5px; filter: grayscale(100%);" title="JACI">
                        <img src="${SPRITES.GUARACI}" style="width: 40px; height: 40px; border-radius: 5px; filter: grayscale(100%);" title="GUARACI">
                    </div>
                    <div style="color: #e74c3c; font-size: 0.8rem;">🔒 BLOQUEADO</div>
                </div>
                `}
            </div>
            <button onclick="this.parentElement.remove();" 
                    style="padding: 12px 25px; background: #e74c3c; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                CANCELAR
            </button>
        `;
        
        document.body.appendChild(modal);
    }
    
    function selectArcadeChallenge(challengeNumber) {
        currentArcadeChallenge = challengeNumber;
        
        if (challengeNumber === 1) {
            arcadeCurrentOrder = ARCADE_ORDER_FIRST;
        } else if (challengeNumber === 2) {
            arcadeCurrentOrder = ARCADE_ORDER_SECOND;
        } else {
            arcadeCurrentOrder = ARCADE_ORDER_THIRD;
        }
        
        arcadeIndex = 0;
        boss.type = arcadeCurrentOrder[arcadeIndex];
        
        hideScreen('playersScreen');
        showScreen('gameScreen');
        currentScreen = 'game';
        initGameWithPlayers();
    }
    
    function selectBoss(bossType) {
        boss.type = bossType;
        hideScreen('playersScreen');
        showScreen('gameScreen');
        currentScreen = 'game';
        initGameWithPlayers();
    }
    
    function initGameWithPlayers() {
        document.getElementById('currentModeDisplay').textContent = 
            mode === 'BOSS' ? 'BOSS' : mode === 'ARCADE' ? 'ARCADE' : 'PVP';
        
        document.getElementById('modeIndicator').textContent = 
            mode === 'BOSS' ? '👾 COOP' : mode === 'ARCADE' ? '🏆 ARCADE' : '⚔️ PVP';
        
        initGame();
    }
    
    function backToTitle() {
        if (currentScreen === 'game') {
            if (confirm('Deseja voltar ao menu? O progresso atual será perdido.')) {
                gameActive = false;
                hideScreen('gameScreen');
                showScreen('titleScreen');
                currentScreen = 'title';
                stopAllAudio();
            }
        } else {
            hideScreen(currentScreen + 'Screen');
            showScreen('titleScreen');
            currentScreen = 'title';
        }
    }
    
    function pauseGame() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 10001;
            display: flex; flex-direction: column; justify-content: center;
            align-items: center; color: white;
        `;
        
        modal.innerHTML = `
            <h2 style="color: #f1c40f; font-size: 2.5rem; margin-bottom: 30px;">JOGO PAUSADO</h2>
            <div style="display: flex; flex-direction: column; gap: 15px; width: 90%; max-width: 300px;">
                <button onclick="this.parentElement.parentElement.remove();" 
                        style="padding: 15px; background: #27ae60; color: white; border: none; border-radius: 8px; font-size: 1.2rem; cursor: pointer;">
                    CONTINUAR
                </button>
                <button onclick="restartGame(); this.parentElement.parentElement.remove();" 
                        style="padding: 15px; background: #3498db; color: white; border: none; border-radius: 8px; font-size: 1.2rem; cursor: pointer;">
                    REINICIAR
                </button>
                <button onclick="backToTitle();" 
                        style="padding: 15px; background: #e74c3c; color: white; border: none; border-radius: 8px; font-size: 1.2rem; cursor: pointer;">
                    MENU PRINCIPAL
                </button>
                <button onclick="showConfigScreen(); this.parentElement.parentElement.remove();" 
                        style="padding: 15px; background: #9b59b6; color: white; border: none; border-radius: 8px; font-size: 1.2rem; cursor: pointer;">
                    CONFIGURAÇÕES
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    function restartGame() {
        hideScreen('gameOverlay');
        initGame();
    }
    
    function showScreen(screenId) {
        document.getElementById(screenId).style.display = 'block';
    }
    
    function hideScreen(screenId) {
        document.getElementById(screenId).style.display = 'none';
    }

    // ================= FUNÇÕES DE CONFIGURAÇÃO =================
    function loadConfigToUI() {
        const slider = document.getElementById('amulet_chance_slider');
        const valueDisplay = document.getElementById('amulet_chance_value');
        const hiddenInput = document.getElementById('amulet_chance');
        
        slider.value = hiddenInput.value;
        valueDisplay.textContent = slider.value + '%';
        
        slider.addEventListener('input', function() {
            valueDisplay.textContent = this.value + '%';
            hiddenInput.value = this.value;
        });
        
        document.getElementById('musicToggle').checked = true;
        document.getElementById('sfxToggle').checked = true;
    }
    
    function saveConfig() {
        addLog('⚙️ Configurações salvas!');
        hideConfig();
    }
    
    function resetConfig() {
        document.getElementById('hp_Tupa').value = 16;
        document.getElementById('atk_Tupa').value = 3;
        document.getElementById('hp_Sume').value = 8;
        document.getElementById('atk_Sume').value = 2;
        document.getElementById('hp_Caipora').value = 10;
        document.getElementById('atk_Caipora').value = 2;
        document.getElementById('amulet_chance').value = 1;
        document.getElementById('amulet_chance_slider').value = 1;
        document.getElementById('amulet_chance_value').textContent = '1%';
        document.getElementById('bravely_tiles').value = 9;
        document.getElementById('hp_BOSS_cfg').value = 30;
        document.getElementById('atk_BOSS_cfg').value = 4;
        
        addLog('⚙️ Configurações restauradas para valores padrão!');
    }

    // ================= FUNÇÕES DO SISTEMA DE TÍTULOS =================
    function saveTitleData() {
        const data = {
            stats: PLAYER_STATS,
            titles: TITLES,
            activeTitle: ACTIVE_TITLE
        };
        localStorage.setItem('entity_titles_data', JSON.stringify(data));
    }

    function loadTitleData() {
        const saved = localStorage.getItem('entity_titles_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                Object.assign(PLAYER_STATS, data.stats || {});
                
                for (let id in data.titles) {
                    if (TITLES[id]) {
                        TITLES[id].unlocked = data.titles[id].unlocked || false;
                        TITLES[id].progress = data.titles[id].progress || 0;
                    }
                }
                
                ACTIVE_TITLE = data.activeTitle || null;
            } catch (e) {
                console.error("Erro ao carregar dados de títulos:", e);
            }
        }
    }

    function updateTitleStats(type, value = 1, elementOrClass = null) {
        switch(type) {
            case 'game_played':
                PLAYER_STATS.games_played++;
                break;
            case 'survive_1hp':
                PLAYER_STATS.survive_1hp++;
                break;
            case 'amulet_collected':
                PLAYER_STATS.total_amulets++;
                break;
            case 'bravely_chain':
                PLAYER_STATS.bravely_chains++;
                break;
            case 'healing':
                PLAYER_STATS.total_healing += value;
                break;
            case 'element_damage':
                if (elementOrClass && PLAYER_STATS.element_damage[elementOrClass] !== undefined) {
                    PLAYER_STATS.element_damage[elementOrClass] += value;
                }
                break;
            case 'water_healing':
                PLAYER_STATS.water_healing += value;
                break;
            case 'earth_tile':
                PLAYER_STATS.earth_tiles++;
                break;
            case 'air_tile':
                PLAYER_STATS.air_tiles++;
                break;
            case 'class_damage':
                if (elementOrClass && PLAYER_STATS.class_damage[elementOrClass] !== undefined) {
                    PLAYER_STATS.class_damage[elementOrClass] += value;
                }
                break;
            case 'boss_defeated':
                if (!PLAYER_STATS.bosses_defeated.includes(elementOrClass)) {
                    PLAYER_STATS.bosses_defeated.push(elementOrClass);
                }
                break;
            case 'shape_executed':
                if (elementOrClass && PLAYER_STATS.shapes_executed[elementOrClass] !== undefined) {
                    PLAYER_STATS.shapes_executed[elementOrClass]++;
                    if (Object.values(PLAYER_STATS.shapes_executed).every(count => count > 0)) {
                        PLAYER_STATS.all_shapes = true;
                    }
                }
                break;
            case 'ultimate_used':
                PLAYER_STATS.ultimates_used++;
                break;
        }
        
        checkTitleUnlocks();
        saveTitleData();
    }

    function checkTitleUnlocks() {
        let unlockedCount = 0;
        
        for (let id in TITLES) {
            const title = TITLES[id];
            if (title.unlocked) {
                unlockedCount++;
                continue;
            }
            
            const req = title.requirement;
            let progress = 0;
            let target = req.target;
            
            switch(req.type) {
                case 'games_played':
                    progress = PLAYER_STATS.games_played;
                    break;
                case 'survive_1hp':
                    progress = PLAYER_STATS.survive_1hp;
                    break;
                case 'total_amulets':
                    progress = PLAYER_STATS.total_amulets;
                    break;
                case 'bravely_chains':
                    progress = PLAYER_STATS.bravely_chains;
                    break;
                case 'total_healing':
                    progress = PLAYER_STATS.total_healing;
                    break;
                case 'element_damage':
                    progress = PLAYER_STATS.element_damage[req.element] || 0;
                    break;
                case 'water_healing':
                    progress = PLAYER_STATS.water_healing;
                    break;
                case 'earth_tiles':
                    progress = PLAYER_STATS.earth_tiles;
                    break;
                case 'air_tiles':
                    progress = PLAYER_STATS.air_tiles;
                    break;
                case 'class_damage':
                    progress = PLAYER_STATS.class_damage[req.class] || 0;
                    break;
                case 'bosses_defeated':
                    progress = PLAYER_STATS.bosses_defeated.length;
                    break;
                case 'all_shapes':
                    progress = PLAYER_STATS.all_shapes ? 1 : 0;
                    target = 1;
                    break;
                case 'ultimates_used':
                    progress = PLAYER_STATS.ultimates_used;
                    break;
            }
            
            title.progress = progress;
            
            if (progress >= target) {
                title.unlocked = true;
                unlockedCount++;
                
                if (gameActive) {
                    triggerTitleUnlock(title.name, title.icon);
                }
            }
        }
        
        return unlockedCount;
    }

    function triggerTitleUnlock(name, icon) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #2c3e50, #34495e);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            border-left: 4px solid #f1c40f;
            box-shadow: 0 5px 15px rgba(0,0,0,0.5);
            z-index: 10001;
            animation: slideIn 0.5s ease, fadeOut 0.5s ease 2.5s forwards;
            max-width: 300px;
            font-family: 'Segoe UI', sans-serif;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="font-size: 24px;">${icon}</div>
                <div>
                    <div style="font-weight: bold; font-size: 14px; color: #f1c40f;">TÍTULO DESBLOQUEADO!</div>
                    <div style="font-size: 13px; margin-top: 3px;">${name}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    function applyTitleBonus(player) {
        if (!ACTIVE_TITLE || !TITLES[ACTIVE_TITLE]) {
            return;
        }
        
        const title = TITLES[ACTIVE_TITLE];
        const bonus = title.bonus;
        
        player.titleBonus = player.titleBonus || {};
        
        switch(bonus.type) {
            case 'ATK':
                player.titleBonus.ATK = bonus.value;
                break;
                
            case 'MAX_HP':
                player.titleBonus.MAX_HP = bonus.value;
                player.maxHp += bonus.value;
                player.hp += bonus.value;
                break;
                
            case 'ELEMENTAL_RESIST':
                player.titleBonus.RESIST = player.titleBonus.RESIST || {};
                player.titleBonus.RESIST[bonus.element] = bonus.value;
                break;
                
            case 'CLASS_BONUS':
                if (player.class === bonus.class) {
                    player.titleBonus.CLASS = bonus;
                }
                break;
                
            case 'UNIQUE':
                player.titleBonus.UNIQUE = bonus;
                break;
        }
        
        updateVisuals();
    }

    function removeTitleBonus(player) {
        if (!player.titleBonus) return;
        
        if (player.titleBonus.MAX_HP) {
            player.maxHp -= player.titleBonus.MAX_HP;
            player.hp = Math.min(player.hp, player.maxHp);
        }
        
        player.titleBonus = null;
        updateVisuals();
    }

    function updateActiveTitle() {
        const select = document.getElementById('activeTitleSelect');
        const titleId = select.value;
        
        players.forEach(p => removeTitleBonus(p));
        
        ACTIVE_TITLE = titleId === 'none' ? null : titleId;
        
        if (ACTIVE_TITLE && gameActive) {
            players.forEach(p => applyTitleBonus(p));
        }
        
        updateTitlePreview();
        saveTitleData();
    }

    function updateTitlePreview() {
        const preview = document.getElementById('titlePreview');
        const desc = document.getElementById('activeTitleDesc');
        
        if (!ACTIVE_TITLE || !TITLES[ACTIVE_TITLE]) {
            preview.innerHTML = `
                <div style="font-size: 32px; margin-bottom: 5px;">❓</div>
                <div style="font-size: 16px; font-weight: bold; color: #2ecc71;">NENHUM TÍTULO</div>
                <div style="font-size: 12px; color: #aaa;">Sem bônus ativo</div>
            `;
            desc.textContent = 'Selecione um título para ativar seus bônus';
            return;
        }
        
        const title = TITLES[ACTIVE_TITLE];
        const bonus = title.bonus;
        
        let bonusText = '';
        switch(bonus.type) {
            case 'ATK':
                bonusText = `+${bonus.value} ATK`;
                break;
            case 'MAX_HP':
                bonusText = `+${bonus.value} HP Máximo`;
                break;
            case 'ELEMENTAL_RESIST':
                bonusText = `-${Math.abs(bonus.value)} dano de ${bonus.element}`;
                break;
            case 'CLASS_BONUS':
                bonusText = bonus.desc;
                break;
            case 'UNIQUE':
                bonusText = bonus.desc;
                break;
        }
        
        preview.innerHTML = `
            <div style="font-size: 32px; margin-bottom: 5px;">${title.icon}</div>
            <div style="font-size: 16px; font-weight: bold; color: #2ecc71;">${title.name}</div>
            <div style="font-size: 12px; color: #aaa; margin-top: 5px; padding: 5px; background: rgba(46, 204, 113, 0.1); border-radius: 4px;">
                ${bonusText}
            `;
        
        desc.textContent = title.description;
    }

    function showTitlesPanel() {
        document.getElementById('titlesModal').style.display = 'block';
        loadTitlesUI();
    }

    function closeTitlesPanel() {
        document.getElementById('titlesModal').style.display = 'none';
    }

    function loadTitlesUI() {
        const select = document.getElementById('activeTitleSelect');
        select.innerHTML = '<option value="none">Nenhum Título</option>';
        
        for (let id in TITLES) {
            if (TITLES[id].unlocked) {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = TITLES[id].name;
                if (ACTIVE_TITLE === id) option.selected = true;
                select.appendChild(option);
            }
        }
        
        switchTitleTab('basic');
        updateTitlePreview();
        updateProgress();
    }

    function switchTitleTab(category) {
        document.querySelectorAll('.title-tab-btn').forEach(btn => {
            btn.classList.remove('title-tab-active');
        });
        
        const buttons = document.querySelectorAll('.title-tab-btn');
        for (let btn of buttons) {
            if (btn.textContent.includes(category.toUpperCase()) || 
                (category === 'basic' && btn.textContent.includes('BÁSICOS')) ||
                (category === 'elemental' && btn.textContent.includes('ELEMENTAIS')) ||
                (category === 'class' && btn.textContent.includes('CLASSE')) ||
                (category === 'unique' && btn.textContent.includes('ÚNICOS'))) {
                btn.classList.add('title-tab-active');
                break;
            }
        }
        
        const filtered = Object.entries(TITLES).filter(([id, title]) => title.category === category);
        
        const content = document.getElementById('titlesContent');
        let html = '';
        
        if (filtered.length === 0) {
            html = '<div style="text-align: center; padding: 40px; color: #777;">Nenhum título nesta categoria.</div>';
        } else {
            filtered.forEach(([id, title]) => {
                const progress = title.progress || 0;
                const target = title.requirement.target;
                const percent = Math.min(Math.round((progress / target) * 100), 100);
                
                let bonusText = '';
                switch(title.bonus.type) {
                    case 'ATK':
                        bonusText = `+${title.bonus.value} ATK`;
                        break;
                    case 'MAX_HP':
                        bonusText = `+${title.bonus.value} HP Máximo`;
                        break;
                    case 'ELEMENTAL_RESIST':
                        bonusText = `-${Math.abs(title.bonus.value)} dano de ${title.bonus.element}`;
                        break;
                    case 'CLASS_BONUS':
                        bonusText = title.bonus.desc;
                        break;
                    case 'UNIQUE':
                        bonusText = title.bonus.desc;
                        break;
                }
                
                html += `
                    <div class="title-card ${title.unlocked ? 'unlocked' : 'locked'} ${category === 'unique' ? 'epic' : ''}">
                        <div class="title-header">
                            <div class="title-name">${title.icon} ${title.name}</div>
                            <div class="title-icon">${title.unlocked ? '✅' : '🔒'}</div>
                        </div>
                        <div class="title-description">${title.description}</div>
                        <div class="title-bonus">${bonusText}</div>
                        
                        ${!title.unlocked ? `
                            <div class="title-requirement">
                                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
                                    <span>Progresso: ${progress}/${target}</span>
                                    <span>${percent}%</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${percent}%"></div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
        }
        
        content.innerHTML = html;
        
        const titleCards = document.querySelectorAll('.title-card.unlocked');
        titleCards.forEach((card, index) => {
            const titleId = Object.keys(filtered)[index];
            if (titleId && TITLES[titleId]) {
                card.addEventListener('click', () => {
                    document.getElementById('activeTitleSelect').value = titleId;
                    updateActiveTitle();
                });
            }
        });
    }

    function updateProgress() {
        const totalTitles = Object.keys(TITLES).length;
        const unlockedCount = Object.values(TITLES).filter(t => t.unlocked).length;
        const percent = Math.round((unlockedCount / totalTitles) * 100);
        
        document.getElementById('progressCount').textContent = `${unlockedCount}/${totalTitles}`;
        document.getElementById('progressBar').style.width = `${percent}%`;
    }

    // ================= FUNÇÕES DO BESTIÁRIO ATUALIZADAS =================
    function showBestiaryModal() {
        const bestiaryModal = document.getElementById('bestiaryModal');
        
        // Verificar quais bosses estão disponíveis
        const savedData = localStorage.getItem('entity_titles_data');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                const bossesDefeated = data.stats?.bosses_defeated || [];
                
                // Mostrar novos bosses do segundo desafio se o primeiro foi completado
                const firstChallengeBosses = ['SACI', 'MAPINGUARI', 'IARA', 'BOITATA'];
                const hasDefeatedFirstChallenge = firstChallengeBosses.every(boss => bossesDefeated.includes(boss));
                
                const secondChallengeEntries = ['mulaEntry', 'corposecoEntry', 'lobisomemEntry', 'cucaEntry'];
                secondChallengeEntries.forEach(entryId => {
                    const entry = document.getElementById(entryId);
                    if (entry) {
                        if (hasDefeatedFirstChallenge) {
                            entry.style.display = 'block';
                            entry.classList.remove('locked-entry');
                        } else {
                            entry.style.display = 'block';
                            entry.classList.add('locked-entry');
                        }
                    }
                });
                
                // Mostrar novos bosses do terceiro desafio se o segundo foi completado
                const secondChallengeBosses = ['MULA', 'CORPOSECO', 'LOBISOMEM', 'CUCA'];
                const hasDefeatedSecondChallenge = secondChallengeBosses.every(boss => bossesDefeated.includes(boss));
                
                const thirdChallengeEntries = ['botoEntry', 'boiEntry', 'jaciEntry', 'guaraciEntry'];
                thirdChallengeEntries.forEach(entryId => {
                    const entry = document.getElementById(entryId);
                    if (entry) {
                        if (hasDefeatedSecondChallenge) {
                            entry.style.display = 'block';
                            entry.classList.remove('locked-entry');
                        } else {
                            entry.style.display = 'block';
                            entry.classList.add('locked-entry');
                        }
                    }
                });
            } catch (e) {
                console.error("Erro ao verificar bosses desbloqueados:", e);
            }
        }
        
        bestiaryModal.style.display = 'block';
    }

    function closeBestiaryModal() {
        document.getElementById('bestiaryModal').style.display = 'none';
    }

    // ================= FUNÇÕES DE RANKING =================
    function resetRankingStats() {
        RANKING.turns = 0;
        RANKING.ultimates = 0;
        RANKING.amulets = 0;
        RANKING.sent = false;
        for(let k in RANKING.shapes) RANKING.shapes[k] = 0;
    }

    function getDifficultyByHP(hp) {
        if(hp >= 60) return "INSANO";
        if(hp >= 50) return "DIFICIL";
        if(hp >= 40) return "MEDIO";
        return "FACIL";
    }

    function getPlayersLabel() {
        const alive = players.filter(p => !p.dead);
        if(alive.length === 1) return alive[0].name || "SOLO";
        return alive.map(p => p.name || `P${p.id+1}`).join("+");
    }

    function getRankingMetaString() {
        const diff = getDifficultyByHP(boss.maxHp).toLowerCase();
        const pc = `${players.length}p`;
        
        if(mode === "BOSS") {
            return `coop-${boss.type.toLowerCase()}-${diff}-${pc}`;
        }
        if(mode === "ARCADE") {
            const challenge = currentArcadeChallenge === 1 ? "first" : currentArcadeChallenge === 2 ? "second" : "third";
            return `arcade-${challenge}-${diff}-${pc}`;
        }
        return "";
    }

    function calculateFinalScore() {
        let base = 1000 + ((boss.maxHp - 30) * 50);
        let mult = 1;

        if(RANKING.turns <= 10) mult = 1.5;
        else if(RANKING.turns <= 20) mult = 1.25;
        else if(RANKING.turns <= 30) mult = 1.0;
        else mult = 0.8;

        let bonus =
            (RANKING.ultimates * 150) +
            (RANKING.amulets * 100) +
            (RANKING.shapes.LINHA * 50) +
            (RANKING.shapes.L * 75) +
            (RANKING.shapes.ZIGZAG * 100) +
            (RANKING.shapes.QUADRADO * 80);

        return Math.floor((base * mult) + bonus);
    }

    function sendScoreToDreamlo() {
        if(RANKING.sent) return;
        if(mode === "PVP") return;
        
        const metaText = getRankingMetaString();
        if(!metaText) return;
        
        const score = calculateFinalScore();
        const playerLabel = getPlayersLabel();
        
        const nameWithMeta = `${playerLabel.substring(0,15)} | ${metaText}`;
        
        RANKING.sent = true;

        const originalURL = 
            `http://dreamlo.com/lb/2xF2PddwTkWMAnom-drEWQetRWvH077ESYlrVT75GpDA/` +
            `add/${encodeURIComponent(nameWithMeta)}/${score}`;
        
        const proxiedURL = `https://corsproxy.io/?${encodeURIComponent(originalURL)}`;

        console.log("🎯 Enviando ranking via proxy:", { nameWithMeta, score });
        
        const img = new Image();
        img.src = proxiedURL;
        
        addLog(`🏆 ${score} pontos enviados!`);
        
        setTimeout(() => {
            if(document.getElementById("rankingModal").style.display === "block") {
                refreshRanking();
            }
        }, 2000);
    }

    function parseMetaFromName(fullName) {
        if (!fullName || !fullName.includes("|")) {
            return {
                displayName: fullName || "Desconhecido",
                mode: "UNKNOWN",
                boss: "NONE",
                difficulty: "FACIL",
                players: "1P",
                challenge: "none"
            };
        }
        
        const parts = fullName.split("|");
        const displayName = parts[0].trim();
        const meta = parts[1].trim();
        
        const metaParts = meta.split("-");
        
        const modeMap = {
            "coop": "COOP",
            "arcade": "ARCADE"
        };
        
        const diffMap = {
            "facil": "FÁCIL",
            "medio": "MÉDIO", 
            "dificil": "DIFÍCIL",
            "insano": "INSANO"
        };
        
        const bossMap = {
            "saci": "SACI",
            "boitata": "BOITATA",
            "mapinguari": "MAPINGUARI",
            "iara": "IARA",
            "mula": "MULA",
            "corposeco": "CORPOSECO",
            "lobisomem": "LOBISOMEM",
            "cuca": "CUCA",
            "boto": "BOTO",
            "boi": "BOI",
            "jaci": "JACI",
            "guaraci": "GUARACI",
            "anhanga": "ANHANGA",
            "none": "NONE"
        };
        
        const challengeMap = {
            "first": "PRIMEIRO",
            "second": "SEGUNDO",
            "third": "TERCEIRO",
            "none": "NONE"
        };
        
        return {
            displayName: displayName,
            mode: modeMap[metaParts[0]] || (metaParts[0] ? metaParts[0].toUpperCase() : "UNKNOWN"),
            boss: metaParts[0] === "arcade" ? challengeMap[metaParts[1]] || "NONE" : bossMap[metaParts[1]] || (metaParts[1] ? metaParts[1].toUpperCase() : "NONE"),
            difficulty: diffMap[metaParts[2]] || (metaParts[2] ? metaParts[2].toUpperCase() : "FÁCIL"),
            players: metaParts[3] ? metaParts[3].toUpperCase() : "1P",
            challenge: metaParts[0] === "arcade" ? challengeMap[metaParts[1]] || "NONE" : "NONE",
            metaString: meta
        };
    }

    function getModeDisplayName(mode) {
        const names = {
            "COOP": "👾 COOP (Boss)",
            "ARCADE": "🏆 Arcade (Rush)",
            "UNKNOWN": "❓ Desconhecido"
        };
        return names[mode] || mode;
    }

    function getDifficultyDisplayName(diff) {
        const names = {
            "FÁCIL": "FÁCIL",
            "MÉDIO": "MÉDIO", 
            "DIFÍCIL": "DIFÍCIL",
            "INSANO": "INSANO"
        };
        return names[diff] || diff;
    }

    function getDifficultyColor(diff) {
        const colors = {
            "FÁCIL": "#2ecc71",
            "MÉDIO": "#f1c40f",
            "DIFÍCIL": "#e67e22",
            "INSANO": "#e74c3c"
        };
        return colors[diff] || "#fff";
    }

    function loadRanking(forceRefresh = false) {
        const content = document.getElementById("rankingContent");
        const now = Date.now();
        
        if (!forceRefresh && RANKING_CACHE.length > 0 && (now - LAST_RANKING_LOAD) < RANKING_CACHE_TIME) {
            applyRankingFilters();
            return;
        }
        
        content.innerHTML = '<div style="text-align:center; padding:20px; color:#aaa;">Carregando ranking...</div>';
        
        const timestamp = new Date().getTime();
        const originalURL = `http://dreamlo.com/lb/694de7e88f40bbcf806761a4/json?t=${timestamp}`;
        const proxiedURL = `https://corsproxy.io/?${encodeURIComponent(originalURL)}`;
        
        fetch(proxiedURL)
            .then(response => response.json())
            .then(data => {
                if (!data || !data.dreamlo || !data.dreamlo.leaderboard) {
                    content.innerHTML = '<div style="text-align:center; padding:20px; color:#ccc;">Nenhum dado de ranking encontrado.</div>';
                    return;
                }
                
                let entries = data.dreamlo.leaderboard.entry;
                if (!entries) {
                    content.innerHTML = '<div style="text-align:center; padding:20px; color:#ccc;">Nenhuma pontuação registrada ainda.</div>';
                    return;
                }
                
                if (!Array.isArray(entries)) {
                    entries = [entries];
                }
                
                RANKING_CACHE = entries.map(entry => {
                    const meta = parseMetaFromName(entry.name);
                    return {
                        originalName: entry.name,
                        displayName: meta.displayName,
                        score: parseInt(entry.score),
                        date: entry.date || "",
                        ...meta
                    };
                });
                
                LAST_RANKING_LOAD = now;
                
                populateFilterOptions();
                applyRankingFilters();
            })
            .catch(error => {
                console.error("Erro ao carregar ranking:", error);
                content.innerHTML = '<div style="text-align:center; padding:20px; color:#e74c3c;">Erro ao carregar ranking. Verifique sua conexão.</div>';
            });
    }

    function refreshRanking() {
        RANKING_CACHE = [];
        LAST_RANKING_LOAD = 0;
        loadRanking(true);
    }

    function populateFilterOptions() {
        const modeFilter = document.getElementById("rf_mode");
        if (modeFilter) {
            const modes = [...new Set(RANKING_CACHE.map(e => e.mode))].filter(m => m && m !== "UNKNOWN");
            modeFilter.innerHTML = '<option value="">Todos os Modos</option>';
            modes.forEach(mode => {
                const option = document.createElement("option");
                option.value = mode;
                option.textContent = getModeDisplayName(mode);
                modeFilter.appendChild(option);
            });
        }
        
        const bossFilter = document.getElementById("rf_boss");
        if (bossFilter) {
            const bosses = [...new Set(RANKING_CACHE.map(e => e.boss))].filter(b => b && b !== "NONE" && b !== "PRIMEIRO" && b !== "SEGUNDO" && b !== "TERCEIRO");
            
            bossFilter.innerHTML = '<option value="">Todos os Bosses</option>';
            bosses.forEach(boss => {
                const option = document.createElement("option");
                option.value = boss;
                option.textContent = boss;
                bossFilter.appendChild(option);
            });
            
            // Adicionar desafios do Arcade
            const arcadeChallenges = [...new Set(RANKING_CACHE.filter(e => e.mode === "ARCADE").map(e => e.challenge))].filter(c => c && c !== "NONE");
            arcadeChallenges.forEach(challenge => {
                const option = document.createElement("option");
                option.value = challenge;
                option.textContent = `Desafio ${challenge}`;
                bossFilter.appendChild(option);
            });
        }
        
        const playersFilter = document.getElementById("rf_players");
        if (playersFilter) {
            const playerCounts = [...new Set(RANKING_CACHE.map(e => e.players))].sort();
            playersFilter.innerHTML = '<option value="">Todos</option>';
            playerCounts.forEach(pc => {
                const option = document.createElement("option");
                option.value = pc;
                option.textContent = pc;
                playersFilter.appendChild(option);
            });
        }
        
        const diffFilter = document.getElementById("rf_diff");
        if (diffFilter) {
            const diffs = [...new Set(RANKING_CACHE.map(e => e.difficulty))].sort();
            diffFilter.innerHTML = '<option value="">Todas</option>';
            diffs.forEach(diff => {
                const option = document.createElement("option");
                option.value = diff;
                option.textContent = getDifficultyDisplayName(diff);
                option.style.color = getDifficultyColor(diff);
                diffFilter.appendChild(option);
            });
        }
    }

    function applyRankingFilters() {
        const filters = {
            mode: document.getElementById("rf_mode")?.value || "",
            boss: document.getElementById("rf_boss")?.value || "",
            players: document.getElementById("rf_players")?.value || "",
            difficulty: document.getElementById("rf_diff")?.value || "",
            search: document.getElementById("rf_search")?.value || ""
        };
        
        let filtered = RANKING_CACHE;
        
        if (filters.mode) {
            filtered = filtered.filter(e => e.mode === filters.mode);
        }
        
        if (filters.boss) {
            if (filters.mode === "COOP") {
                filtered = filtered.filter(e => e.boss === filters.boss);
            } else if (filters.mode === "ARCADE") {
                if (filters.boss === "PRIMEIRO" || filters.boss === "SEGUNDO" || filters.boss === "TERCEIRO") {
                    filtered = filtered.filter(e => e.challenge === filters.boss);
                } else {
                    // Se for um nome de boss específico no arcade
                    filtered = filtered.filter(e => e.boss === filters.boss);
                }
            }
        }
        
        if (filters.players) {
            filtered = filtered.filter(e => e.players === filters.players);
        }
        
        if (filters.difficulty) {
            filtered = filtered.filter(e => e.difficulty === filters.difficulty);
        }
        
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(e => 
                e.displayName.toLowerCase().includes(searchLower) ||
                e.originalName.toLowerCase().includes(searchLower)
            );
        }
        
        filtered.sort((a, b) => b.score - a.score);
        
        renderRankingTable(filtered);
    }

    function renderRankingTable(entries) {
        const content = document.getElementById("rankingContent");
        
        if (entries.length === 0) {
            content.innerHTML = '<div style="text-align:center; padding:20px; color:#ccc;">Nenhuma pontuação encontrada com os filtros atuais.</div>';
            return;
        }
        
        let html = `
            <div style="margin-bottom: 10px; font-size: 12px; color: #aaa; display: flex; justify-content: space-between; align-items: center;">
                <div>Mostrando ${entries.length} de ${RANKING_CACHE.length} registros</div>
                <div style="font-size: 11px; color: #777;">Última atualização: ${new Date(LAST_RANKING_LOAD).toLocaleTimeString()}</div>
            </div>
            <div style="overflow-x: auto;">
            <table class="ranking-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Nome</th>
                        <th>Pontuação</th>
                        <th>Modo</th>
                        <th>Detalhes</th>
                        <th>Data</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        entries.forEach((entry, index) => {
            const medal = index < 3 ? ["🥇", "🥈", "🥉"][index] : `${index + 1}.`;
            const modeIcon = entry.mode === "COOP" ? "👾" : entry.mode === "ARCADE" ? "🏆" : "❓";
            
            let details = "";
            if (entry.mode === "COOP") {
                details = `${entry.boss} | ${entry.players} | ${getDifficultyDisplayName(entry.difficulty)}`;
            } else if (entry.mode === "ARCADE") {
                details = `Desafio ${entry.challenge} | ${entry.players} | ${getDifficultyDisplayName(entry.difficulty)}`;
            } else {
                details = `${entry.players}`;
            }
            
            const dateStr = entry.date ? entry.date.split(' ')[0] : "";
            
            html += `
                <tr>
                    <td style="font-weight: bold; width: 50px;">${medal}</td>
                    <td style="font-weight: bold;">${entry.displayName}</td>
                    <td style="color: #f1c40f; font-weight: bold;">${entry.score.toLocaleString()}</td>
                    <td>${modeIcon} ${getModeDisplayName(entry.mode)}</td>
                    <td style="font-size: 11px; color: #aaa;">${details}</td>
                    <td style="font-size: 10px; color: #777; width: 80px;">${dateStr}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
            </div>
        `;
        
        content.innerHTML = html;
    }

    function resetRankingFilters() {
        document.getElementById("rf_mode").value = "";
        document.getElementById("rf_boss").value = "";
        document.getElementById("rf_players").value = "";
        document.getElementById("rf_diff").value = "";
        document.getElementById("rf_search").value = "";
        applyRankingFilters();
    }

    function openRanking() {
        document.getElementById("rankingModal").style.display = "block";
        loadRanking();
    }

    function closeRanking() {
        document.getElementById("rankingModal").style.display = "none";
    }

    // ================= FUNÇÕES DO JOGO =================
    const sfx = { 
        skill1: new Audio("dramatic-synth-echo-43970.mp3"), atkg: new Audio("atkg.mp3"), atkm: new Audio("atkm.mp3"), atka: new Audio("atka.mp3"), 
        click: new Audio("click.mp3"), bgm: new Audio("fundoboss.mp3"), sacitema: new Audio("sacitema.mp3"), 
        mapinguaritema: new Audio("mapinguariteme.mp3"), boitatatema: new Audio("boitatatema.mp3"), iaratema: new Audio("iarateme.mp3"),
        minoa1: new Audio("minoa1.mp3"), minoa2: new Audio("minoa2.mp3"), saci: new Audio("saci.mp3"), saci1: new Audio("saci1.mp3"), 
        iara1: new Audio("iara1.mp3"), iara2: new Audio("iara2.mp3"), win: new Audio("win.mp3"), gameover: new Audio("gameover.mp3"),
        // SEGUNDO DESAFIO
        corposecotema: new Audio("corposeco.mp3"),
        lobisomemtema: new Audio("lobisomem.mp3"),
        cucatema: new Audio("cuca.mp3"),
        mulatema: new Audio("mulasemcabeca.mp3"),
        cucask1: new Audio("cucask1.mp3"),
        cucask2: new Audio("cucask2.mp3"),
        garras: new Audio("garras.mp3"),
        // TERCEIRO DESAFIO - NOVOS SONS
        boto_skill1: new Audio("boto_skill1.mp3"), // Será referenciado a skill1
        boto_skill2: null, // Será referenciado a iara2
        boi_skill1: new Audio("boi_skill1.mp3"), // Será referenciado a garras
        boi_skill2: new Audio("boi_skill2.mp3"), // Será referenciado a iara1
        jaci_skill1: null, // Será referenciado a saci1
        jaci_skill2: new Audio("jaciskill2.mp3"), // Será referenciado a cucask1
        guaraci_skill1: null, // Será referenciado a skill1
        guaraci_skill2: new Audio("guaraciskill2.mp3"), // Será referenciado a iara1
        // TEMAS DOS NOVOS BOSSES
        bototema: new Audio("boto.mp3"),
        boitema: new Audio("boi.mp3"),
        jacitema: new Audio("jaci.mp3"),
        guaracitema: new Audio("guaraci.mp3"),
        // BOSS FINAL
        anhanga_skill1: null, // Será referenciado a skill1
        anhanga_skill2: null, // Será referenciado a cucask2
        anhangatema: new Audio("anhanga.mp3"),
        intro: new Audio("intro.mp3")
    };

    // Referenciar sons existentes para evitar duplicação
    //sfx.boto_skill1 = sfx.skill1;
    sfx.boto_skill2 = sfx.iara2;
    //sfx.boi_skill1 = sfx.garras;
    //sfx.boi_skill2 = sfx.iara1;
    sfx.jaci_skill1 = sfx.saci1; 
    sfx.guaraci_skill1 = sfx.skill1;
    sfx.anhanga_skill1 = sfx.skill1;
    sfx.anhanga_skill2 = sfx.cucask2;

    [sfx.bgm, sfx.sacitema, sfx.mapinguaritema, sfx.boitatatema, sfx.iaratema, 
     sfx.corposecotema, sfx.lobisomemtema, sfx.cucatema, sfx.mulatema, 
     sfx.bototema, sfx.boitema, sfx.jacitema, sfx.guaracitema,
     sfx.anhangatema].forEach(track => { 
        track.loop = true; 
        track.volume = 0.3; 
    });
    
    let currentBGM = null;

    function unlockAudio() { 
        if (!audioUnlocked) { 
            Object.values(sfx).forEach(a => { 
                a.play().then(() => { 
                    a.pause(); 
                    if([sfx.bgm, sfx.sacitema, sfx.mapinguaritema, sfx.boitatatema, sfx.iaratema,
                       sfx.corposecotema, sfx.lobisomemtema, sfx.cucatema, sfx.mulatema,
                       sfx.bototema, sfx.boitema, sfx.jacitema, sfx.guaracitema,
                       sfx.anhangatema].includes(a)) a.currentTime = 0; 
                }).catch(()=>{}); 
            }); 
            audioUnlocked = true; 
            playBossTheme();
        } 
    }

    function playBossTheme() {
        if (!audioUnlocked) return;
        [sfx.bgm, sfx.sacitema, sfx.mapinguaritema, sfx.boitatatema, sfx.iaratema,
         sfx.corposecotema, sfx.lobisomemtema, sfx.cucatema, sfx.mulatema,
         sfx.bototema, sfx.boitema, sfx.jacitema, sfx.guaracitema,
         sfx.anhangatema].forEach(track => track.pause());
        if (mode === "BOSS" || mode === "ARCADE") {
            switch(boss.type) {
                case "SACI": currentBGM = sfx.sacitema; break;
                case "MAPINGUARI": currentBGM = sfx.mapinguaritema; break;
                case "BOITATA": currentBGM = sfx.boitatatema; break;
                case "IARA": currentBGM = sfx.iaratema; break;
                // SEGUNDO DESAFIO
                case "MULA": currentBGM = sfx.mulatema; break;
                case "CORPOSECO": currentBGM = sfx.corposecotema; break;
                case "LOBISOMEM": currentBGM = sfx.lobisomemtema; break;
                case "CUCA": currentBGM = sfx.cucatema; break;
                // TERCEIRO DESAFIO
                case "BOTO": currentBGM = sfx.bototema; break;
                case "BOI": currentBGM = sfx.boitema; break;
                case "JACI": currentBGM = sfx.jacitema; break;
                case "GUARACI": currentBGM = sfx.guaracitema; break;
                // BOSS FINAL
                case "ANHANGA": currentBGM = sfx.anhangatema; break;
                default: currentBGM = sfx.bgm;
            }
        } else currentBGM = sfx.bgm;
        if (currentBGM) { currentBGM.currentTime = 0; currentBGM.play(); }
    }

    function playSfx(name) { 
        if (!audioUnlocked || !sfx[name]) return; 
        const sound = sfx[name].cloneNode(); 
        sound.volume = 0.6; 
        sound.play(); 
    }

    function stopAllAudio() {
        Object.values(sfx).forEach(audio => {
            if (audio && typeof audio.pause === 'function') {
                audio.pause();
                audio.currentTime = 0;
            }
        });
    }

    function addLog(msg) { 
        const log = document.getElementById('log'); 
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `> ${msg}`;
        log.appendChild(entry); 
        log.scrollTop = log.scrollHeight; 
    }
    
    function updateClassBase() { 
        ['Tupa', 'Sume', 'Caipora'].forEach(cls => { 
            CLASS_DB[cls] = { 
                hp: parseInt(document.getElementById(`hp_${cls}`).value), 
                atk: parseInt(document.getElementById(`atk_${cls}`).value), 
                min: (cls === 'Sume' ? 4 : (cls === 'Caipora' ? 3 : 0)) 
            }; 
        }); 
    }
    
    // ================= FUNÇÃO PARA ATUALIZAR DIREÇÃO DOS SPRITES =================
    function updateAllSpriteDirections() {
        if (!gameActive) return;
        
        // Atualizar sprites dos jogadores
        players.forEach(player => {
            if (player.dead) return;
            
            const img = document.getElementById(`imgP${player.id}`);
            if (!img) return;
            
            let targetX, targetY;
            
            if (mode === "BOSS" || mode === "ARCADE") {
                if (boss.dead) {
                    img.className = 'normal';
                    return;
                }
                targetX = boss.x;
                targetY = boss.y;
            } else if (mode === "PVP") {
                const otherPlayer = players.find(p => p.id !== player.id && !p.dead);
                if (!otherPlayer) {
                    img.className = 'normal';
                    return;
                }
                targetX = otherPlayer.x;
                targetY = otherPlayer.y;
            } else {
                img.className = 'normal';
                return;
            }
            
            const shouldFlip = targetX < player.x;
            
            if (shouldFlip) {
                img.className = 'flipped';
            } else {
                img.className = 'normal';
            }
        });
        
        // Atualizar sprite do boss
        if (mode === "BOSS" || mode === "ARCADE") {
            const bossImg = document.getElementById('imgBoss');
            if (bossImg && !boss.dead) {
                const alivePlayers = players.filter(p => !p.dead);
                if (alivePlayers.length > 0) {
                    let nearestPlayer = alivePlayers[0];
                    let minDistance = Math.abs(boss.x - nearestPlayer.x) + Math.abs(boss.y - nearestPlayer.y);
                    
                    for (let i = 1; i < alivePlayers.length; i++) {
                        const distance = Math.abs(boss.x - alivePlayers[i].x) + Math.abs(boss.y - alivePlayers[i].y);
                        if (distance < minDistance) {
                            minDistance = distance;
                            nearestPlayer = alivePlayers[i];
                        }
                    }
                    
                    const shouldBossFlip = nearestPlayer.x < boss.x;
                    
                    // Tratamento especial para bosses que olham para esquerda
                    if (boss.type === "IARA" || boss.type === "CORPOSECO" || boss.type === "BOTO") {
                        if (shouldBossFlip) {
                            bossImg.className = boss.type === "IARA" ? 'iara-flipped' : 'flipped';
                        } else {
                            bossImg.className = boss.type === "IARA" ? 'iara-normal' : 'normal';
                        }
                    } else {
                        if (shouldBossFlip) {
                            bossImg.className = 'flipped';
                        } else {
                            bossImg.className = 'normal';
                        }
                    }
                }
            }
        }
    }
    
    // ================= NOVA FUNÇÃO: EXIBIR ANIMAÇÃO DO BRAVELY CHAIN =================
    async function showBravelyAnimation(playerClass) {
        return new Promise((resolve) => {
            let gifUrl = "";
            switch(playerClass) {
                case "Tupa":
                    gifUrl = SPRITES.BRAVELY_TUPA;
                    break;
                case "Sume":
                    gifUrl = SPRITES.BRAVELY_SUME;
                    break;
                case "Caipora":
                    gifUrl = SPRITES.BRAVELY_CAIPORA;
                    break;
                default:
                    gifUrl = SPRITES.BRAVELY_TUPA;
            }
            
            const overlay = document.createElement('div');
            overlay.className = 'bravely-animation-overlay';
            overlay.id = 'bravelyAnimationOverlay';
            
            const gif = document.createElement('img');
            gif.src = gifUrl;
            gif.className = 'bravely-animation-gif';
            gif.alt = 'Bravely Chain Animation';
            
            const text = document.createElement('div');
            text.style.cssText = `
                position: absolute;
                bottom: 20%;
                left: 0;
                width: 100%;
                text-align: center;
                color: gold;
                font-size: 32px;
                font-weight: bold;
                text-shadow: 0 0 10px #000;
                z-index: 10001;
            `;
            text.textContent = 'BRAVELY CHAIN!';
            
            overlay.appendChild(gif);
            overlay.appendChild(text);
            
            const board = document.getElementById('board');
            board.appendChild(overlay);
            
            playSfx('skill1');
            
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.style.opacity = '0';
                    overlay.style.transition = 'opacity 0.5s ease';
                    
                    setTimeout(() => {
                        if (overlay.parentNode) {
                            overlay.parentNode.removeChild(overlay);
                        }
                        resolve();
                    }, 500);
                } else {
                    resolve();
                }
            }, 2000);
        });
    }
    
    // ================= FUNÇÕES DE INICIALIZAÇÃO DO JOGO =================
    async function initGame() {
        LORE.currentStage = 1;
        LORE.anhangáRevealed = false;
        
        bossAIIsRunning = false;
        arcadeBossTransition = false;
        
        // RESETAR PROGRESSO DO ARCADE AO REINICIAR
        arcadeIndex = 0;
        if (mode === "ARCADE") {
            boss.type = arcadeCurrentOrder[arcadeIndex];
        }
        
        resetRankingStats();
        gameActive = true; 
        
        document.getElementById('currentModeDisplay').textContent = 
            mode === 'BOSS' ? 'BOSS' : mode === 'ARCADE' ? 'ARCADE' : 'PVP';
        
        document.getElementById('modeIndicator').textContent = 
            mode === 'BOSS' ? '👾 COOP' : mode === 'ARCADE' ? '🏆 ARCADE' : '⚔️ PVP';
        
        updateClassBase(); 
        grid = []; path = []; players = []; amulets = [];
        
        const gridEl = document.getElementById('grid'); 
        gridEl.innerHTML = ''; 
        for(let i=0; i<64; i++) gridEl.appendChild(createTile(i));
        
        const board = document.getElementById('board');
        document.querySelectorAll('.token').forEach(t => t.remove()); 
        
        // Criar jogadores
        for(let i=0; i<playerCount; i++) { 
            const config = playerConfigs[i];
            const initialHP = CLASS_DB[config.class].hp; 
            players.push({ 
                id: i, 
                x: 2 + i, 
                y: 7, 
                hp: initialHP, 
                maxHp: initialHP, 
                class: config.class, 
                element: 'FOGO', 
                name: config.name, 
                skillUsed: false, 
                dead: false, 
                bonusAtk: 0 
            }); 
            
            const token = document.createElement('div'); 
            token.id = `tokenP${i}`; 
            token.className = `token p-hue-${i}`; 
            token.innerHTML = `<div class="hp-container"><div id="hpBarP${i}" class="hp-bar"></div></div><img id="imgP${i}" src="${SPRITES[config.class]}" class="normal">`; 
            board.appendChild(token); 
        }
        
        if(mode === "BOSS" || mode === "ARCADE") {
            if(mode === "ARCADE") { 
                // Configurar boss baseado no desafio atual
                boss.type = arcadeCurrentOrder[arcadeIndex]; 
            }
            
            // Vida base do boss
            let baseBossHP = parseInt(document.getElementById('hp_BOSS_cfg').value) || 30;
            
            // Se for o Anhangá, adicionar +10 de vida
            if (boss.type === "ANHANGA") {
                boss.maxHp = baseBossHP + 9;
            } else {
                boss.maxHp = baseBossHP;
            }
            
            boss.hp = boss.maxHp; 
            boss.x = 4; 
            boss.y = 0; 
            boss.dead = false;
            
            document.getElementById('turnBoss').innerText = `${boss.type} BOSS`; 
            const bToken = document.createElement('div'); 
            bToken.id = `tokenBoss`; 
            bToken.className = `token`;
            
            // Aplicar classe correta baseada no tipo de boss
            let bossClass = 'normal';
            if (boss.type === "IARA") {
                bossClass = 'iara-normal';
            } else if (boss.type === "CORPOSECO" || boss.type === "BOTO") {
                bossClass = 'normal'; // Já olha para esquerda
            }
            
            bToken.innerHTML = `<div class="hp-container"><div id="hpBarBoss" class="hp-bar"></div></div><img id="imgBoss" src="${SPRITES[boss.type]}" class="${bossClass}">`; 
            board.appendChild(bToken);
            
            document.getElementById('bossNameDisplay').textContent = boss.type;
            document.getElementById('bossStatsDisplay').innerHTML = `HP: <b>${boss.hp}</b> / ${boss.maxHp}`;
            
            // Mostrar diálogo do boss no modo Arcade
            if (mode === "ARCADE") {
                await showBossIntroDialog(boss.type);
            }
        } else { 
            // Modo PVP
            if (players.length > 1) {
                players[0].x = 4;
                players[0].y = 7;
                players[1].x = 4; 
                players[1].y = 0; 
                
                players[0].hp = CLASS_DB[players[0].class].hp ; 
                players[0].maxHp = players[0].hp; 
                players[1].hp = CLASS_DB[players[1].class].hp ; 
                players[1].maxHp = players[1].hp; 
            }
            
            document.getElementById('turnBoss').innerText = 'PVP ADVERSÁRIO';
            if (players.length > 1) {
                document.getElementById('bossNameDisplay').textContent = players[1].name;
                document.getElementById('bossStatsDisplay').innerHTML = `HP: <b>${players[1].hp}</b> / ${players[1].maxHp}`;
            }
        }
        
        currentPlayerIdx = 0; 
        switchConfig(0); 
        updateVisuals(); 
        
        updateAllSpriteDirections();
        
        playBossTheme();
        
        document.getElementById('log').innerHTML = '<div class="log-entry">Bem-vindo ao jogo!</div>';
        
        loadTitleData();
        
        if (ACTIVE_TITLE && gameActive) {
            players.forEach(p => applyTitleBonus(p));
        }
        
        updateTitleStats('game_played');
        
        addLog(`🎮 Jogo iniciado no modo ${mode}!`);
        if (mode === "BOSS") {
            addLog(`👹 Boss selecionado: ${boss.type}`);
        } else if (mode === "ARCADE") {
            addLog(`🏆 Modo Arcade - Desafio ${currentArcadeChallenge}: ${boss.type}`);
        } else if (mode === "PVP") {
            addLog(`⚔️ Modo PVP iniciado! ${players[0].name} vs ${players[1].name}`);
        }
    }

    // ================= FUNÇÃO EXECUTEACTION - CORRIGIDA =================
    async function executeAction() {
        if(!gameActive || path.length === 0 || bossAIIsRunning || arcadeBossTransition || isExecutingAction) return;
        
        isExecutingAction = true;
        
        const active = players[currentPlayerIdx];
        const target = (mode === "BOSS" || mode === "ARCADE") ? boss : players.find(p => p.id !== active.id && !p.dead);
        const info = CLASS_DB[active.class], usedPath = [...path];
        const threshold = parseInt(document.getElementById('bravely_tiles').value) || 9;
        const isBravely = usedPath.length >= threshold;

        let skillAtkBonus = 0; const shape = detectShape(usedPath);
        if(shape && RANKING.shapes[shape] !== undefined){ 
            RANKING.shapes[shape]++; 
            updateTitleStats('shape_executed', 1, shape);
        }

        if(shape) {
            if(shape === "LINHA") { 
                skillAtkBonus = 2; 
                active.hp = Math.min(active.maxHp, active.hp + 1); 
                showHealEffect(active.x, active.y, 1); 
                updateTitleStats('healing', 1);
            }
            if(shape === "L") { 
                active.hp = Math.min(active.maxHp, active.hp + 2); 
                showHealEffect(active.x, active.y, 2); 
                updateTitleStats('healing', 2);
                if (grid[usedPath[0]] === 'AGUA') {
                    updateTitleStats('water_healing', 2);
                }
            }
            if(shape === "ZIGZAG") skillAtkBonus = 3;
            if(shape === "QUADRADO") active.skillUsed = false;
        }

        const titleAtkBonus = active.titleBonus?.ATK || 0;
        let totalAtk = info.atk + active.bonusAtk + (usedPath.length > 0 && grid[usedPath[0]] === active.element ? 1 : 0) + skillAtkBonus + titleAtkBonus;
        
        if(active.class === "Tupa") {
            const dealGueDmg = () => { 
                if(!target.dead && (Math.abs(active.x-target.x)+Math.abs(active.y-target.y)) <= 1) { 
                    playSfx('atkg'); 
                    applyDmg(target, totalAtk); 
                    spawnSwordEffect(target.x, target.y); 
                    
                    // ✅ VERIFICAR SE O BOSS MORREU
                    if (mode === "ARCADE" && boss.dead) {
                        console.log("⚡ Boss morto durante ataque de Tupã");
                        isExecutingAction = false;
                        return;
                    }
                }
            };
            
            dealGueDmg();
            
            for(const idx of usedPath) { 
                active.x = idx%8; 
                active.y = Math.floor(idx/8); 
                checkAmulet(active, active.x, active.y); 
                updateVisuals(); 
                
                if (isOccupied(active.x, active.y, active.id)) {
                    break;
                }
                
                dealGueDmg(); 
                await sleep(120); 
            }
        } else {
            for(const idx of usedPath) { 
                active.x = idx%8; 
                active.y = Math.floor(idx/8); 
                checkAmulet(active, active.x, active.y); 
                updateVisuals(); 
                
                if (isOccupied(active.x, active.y, active.id)) {
                    break;
                }
                
                await sleep(100); 
            }
            
            if (isBravely) {
                await showBravelyAnimation(active.class);
            }
            
            if(usedPath.length >= info.min && !target.dead) {
                let extra = usedPath.length - info.min; 
                playSfx(active.class === 'Sume' ? 'atkm' : 'atka'); 
                
                if (active.class === "Caipora") {
                    await spawnArrowProjectile(active, target);
                } else {
                    await spawnProjectile(active, target, 'Magic');
                }
                
                applyDmg(target, totalAtk + (active.class === "Sume" ? extra : Math.floor(extra/2)));
            }
        }

        usedPath.forEach(idx => { 
            const gridEl = document.getElementById('grid'); 
            gridEl.replaceChild(createTile(idx), gridEl.childNodes[idx]); 
        });

        if(isBravely) {
            if (active.class === "Tupa") {
                await showBravelyAnimation(active.class);
            }
            
            await triggerBravelyChain(active, target, totalAtk);
            updateTitleStats('bravely_chain');
            
            path = []; 
            renderPath();
            RANKING.turns++;
            
            // ✅ CORREÇÃO: Verificar se o boss morreu no bravely chain
            if (mode === "ARCADE" && boss.dead) {
                console.log("⚡ Boss morto no bravely chain, finalizando ação");
                isExecutingAction = false;
                return;
            }
            
            // ✅ CORREÇÃO: Apenar passar o turno se o boss ainda estiver vivo
            if (mode === "BOSS" || mode === "ARCADE") {
                isExecutingAction = false;
                
                if (mode === "ARCADE" && boss.dead) {
                    console.log("⚡ Boss morto, não passando turno");
                    return;
                }
                
                manageTurns();
                return;
            }
        }

        path = []; 
        renderPath();
        RANKING.turns++;

        // ✅ CORREÇÃO: Verificar se o boss morreu antes de passar turno
        if (mode === "ARCADE" && boss.dead) {
            console.log("⚡ Boss morto, finalizando ação");
            isExecutingAction = false;
            return;
        }

        // ✅ CORREÇÃO: Apenar passar turno se o jogo ainda estiver ativo
        if (gameActive) {
            manageTurns();
        }
        
        updateAllSpriteDirections();
        
        isExecutingAction = false;
    }

    async function triggerBravelyChain(active, target, totalAtk) {
        const pop = document.getElementById('bravelyPop');
        pop.innerText = "BRAVELY CHAIN!";
        pop.style.color = "gold";
        pop.style.display = 'block';
        pop.style.transform = 'translate(-50%, -50%) scale(1)';
        pop.style.transition = 'transform 0.5s ease-out';
        
        setTimeout(() => {
            pop.style.transform = 'translate(-50%, -50%) scale(1.5)';
            pop.style.opacity = '0';
        }, 500);
        
        setTimeout(() => {
            pop.style.display = 'none';
            pop.style.transform = 'translate(-50%, -50%) scale(0)';
            pop.style.opacity = '1';
        }, 1200);
        
        let affectedIndices = [];
        if(active.class === "Tupa") { 
            triggerElementalFX(active.element, active.x, 'COL', active.x, active.y); 
            for(let row=0; row<8; row++) affectedIndices.push(row * 8 + active.x); 
            if(!target.dead && target.x === active.x) applyDmg(target, totalAtk); 
        } 
        else if(active.class === "Sume") { 
            triggerElementalFX(active.element, active.y, 'ROW', active.x, active.y); 
            for(let col=0; col<8; col++) affectedIndices.push(active.y * 8 + col); 
            if(!target.dead && target.y === active.y) applyDmg(target, totalAtk); 
            
            players.forEach(p => { 
                if(!p.dead && p.y === active.y) { 
                    p.hp = Math.min(p.maxHp, p.hp+2); 
                    showHealEffect(p.x, p.y, 2); 
                    updateTitleStats('healing', 2);
                } 
            }); 
        }
        else if(active.class === "Caipora") { 
            playSfx('atka'); 
            for(let dy=-1; dy<=1; dy++) { 
                for(let dx=-1; dx<=1; dx++) { 
                    let nx = target.x + dx, ny = target.y + dy; 
                    if(nx >= 0 && nx < 8 && ny >= 0 && ny < 8) { 
                        affectedIndices.push(ny * 8 + nx); 
                        spawnArrowProjectile({x:nx, y:-1}, {x:nx, y:ny}); 
                    } 
                } 
            } 
            await sleep(400); 
            if(!target.dead) applyDmg(target, totalAtk); 
        }
        affectedIndices.forEach(idx => { 
            grid[idx] = active.element; 
            const tile = document.querySelectorAll('.tile')[idx]; 
            tile.className = `tile bg-${active.element}`; 
            if (active.element === 'TERRA') {
                updateTitleStats('earth_tile');
            } else if (active.element === 'AR') {
                updateTitleStats('air_tile');
            }
        });
    }

    // ================= FUNÇÃO MANAGE TURNS - CORRIGIDA =================
    function manageTurns() {
        if (!gameActive || arcadeBossTransition) return;

        // ✅ CORREÇÃO: Verificar se o boss morreu no modo Arcade
        if (mode === "ARCADE" && boss.dead) {
            console.log("⚡ Boss morto, não passando turno");
            return;
        }
        
        if (mode === "PVP") {
            let next = currentPlayerIdx + 1; 
            while(next < players.length && players[next].dead) next++;
            
            if(next < players.length) { 
                currentPlayerIdx = next; 
                switchConfig(next); 
                addLog(`🎮 Turno de ${players[currentPlayerIdx].name}`);
            } else { 
                currentPlayerIdx = 0; 
                while(currentPlayerIdx < players.length && players[currentPlayerIdx].dead) currentPlayerIdx++;
                if (currentPlayerIdx < players.length) {
                    switchConfig(currentPlayerIdx);
                    addLog(`🎮 Turno de ${players[currentPlayerIdx].name}`);
                }
            }
        } else if (mode === "BOSS" || mode === "ARCADE") {
            let nextPlayerIdx = currentPlayerIdx + 1;
            while(nextPlayerIdx < players.length && players[nextPlayerIdx].dead) {
                nextPlayerIdx++;
            }
            
            if(nextPlayerIdx < players.length) {
                currentPlayerIdx = nextPlayerIdx;
                switchConfig(nextPlayerIdx);
                addLog(`🎮 Turno de ${players[currentPlayerIdx].name}`);
                
                document.getElementById('turnBoss').classList.remove('active-turn');
                document.getElementById('turnP_Active').classList.add('active-turn');
            } else {
                currentPlayerIdx = -1;
                saveAndRefresh();
                
                addLog("👹 AGORA É O TURNO DO BOSS!");
                
                document.getElementById('turnP_Active').classList.remove('active-turn');
                document.getElementById('turnBoss').classList.add('active-turn');
                
                setTimeout(() => {
                    if(gameActive && !boss.dead && players.some(p => !p.dead) && !arcadeBossTransition) {
                        bossAI();
                    } else if (!players.some(p => !p.dead)) {
                        showEndGame("GAME OVER", false);
                    }
                }, 1000);
            }
        }
        
        updateAllSpriteDirections();
    }
    // ================= NOVAS FUNÇÕES PARA OS NOVOS BOSSES segundo =================
    function triggerFireball(startX, startY, endX, endY) {
        const board = document.getElementById('board');
        const s = getStep();
        
        const fireball = document.createElement('img');
        fireball.src = SPRITES.FireballFX;
        fireball.className = 'fireball-fx';
        fireball.style.width = (s * 1.5) + 'px';
        fireball.style.height = (s * 1.5) + 'px';
        fireball.style.left = (startX * s + 8) + 'px';
        fireball.style.top = (startY * s + 8) + 'px';
        fireball.style.zIndex = '60';
        
        board.appendChild(fireball);
        
        // Animação de movimento
        setTimeout(() => {
            fireball.style.left = (endX * s + 8) + 'px';
            fireball.style.top = (endY * s + 8) + 'px';
            
            // Criar explosão no destino
            setTimeout(() => {
                triggerFlare(endX, endY);
                
                // Dano em cruz
                const crossTiles = [
                    {x: endX, y: endY-1},
                    {x: endX, y: endY+1},
                    {x: endX-1, y: endY},
                    {x: endX+1, y: endY}
                ];
                
                crossTiles.forEach(tile => {
                    if(tile.x >= 0 && tile.x < 8 && tile.y >= 0 && tile.y < 8) {
                        triggerFlare(tile.x, tile.y);
                    }
                });
                
                fireball.remove();
            }, 300);
        }, 50);
        
        setTimeout(() => {
            if (fireball.parentNode) fireball.remove();
        }, 1000);
    }

    function triggerClawSpin(x, y) {
        const board = document.getElementById('board');
        const s = getStep();
        
        const claw = document.createElement('img');
        claw.src = SPRITES.ClawFX;
        claw.className = 'claw-spin-fx';
        claw.style.width = (s * 3) + 'px';
        claw.style.height = (s * 3) + 'px';
        claw.style.left = (x * s - s) + 'px';
        claw.style.top = (y * s - s) + 'px';
        claw.style.zIndex = '60';
        
        board.appendChild(claw);
        
        setTimeout(() => {
            if (claw.parentNode) claw.remove();
        }, 1000);
    }

    function triggerPotion(x, y) {
        const board = document.getElementById('board');
        const s = getStep();
        
        const potion = document.createElement('img');
        potion.src = SPRITES.PotionFX;
        potion.className = 'potion-fx';
        potion.style.width = (s * 1.5) + 'px';
        potion.style.height = (s * 1.5) + 'px';
        potion.style.left = (x * s + 8) + 'px';
        potion.style.top = (y * s + 8) + 'px';
        potion.style.zIndex = '60';
        
        board.appendChild(potion);
        
        setTimeout(() => {
            if (potion.parentNode) potion.remove();
        }, 600);
    }

    function triggerPoisonGas(x, y) {
        const board = document.getElementById('board');
        const s = getStep();
        
        const poison = document.createElement('div');
        poison.className = 'poison-gas-fx';
        poison.style.left = (x * s + 8) + 'px';
        poison.style.top = (y * s + 8) + 'px';
        poison.style.zIndex = '60';
        
        board.appendChild(poison);
        
        setTimeout(() => {
            if (poison.parentNode) poison.remove();
        }, 1200);
    }

    function triggerEarthquake() {
        const board = document.getElementById('board');
        
        const earthquake = document.createElement('div');
        earthquake.className = 'earthquake-fx';
        earthquake.style.zIndex = '40';
        
        board.appendChild(earthquake);
        
        setTimeout(() => {
            if (earthquake.parentNode) earthquake.remove();
        }, 800);
    }
    
    // ================= NOVA FUNÇÃO: ATAQUE DA CUCA COM QUADRANTES =================
    function triggerQuadrantPotionAttack() {
        const board = document.getElementById('board');
        const s = getStep();
        
        // Definir os 4 quadrantes do tabuleiro 8x8
        const quadrants = [
            { xStart: 0, xEnd: 3, yStart: 0, yEnd: 3, name: "Superior Esquerdo" },
            { xStart: 4, xEnd: 7, yStart: 0, yEnd: 3, name: "Superior Direito" },
            { xStart: 0, xEnd: 3, yStart: 4, yEnd: 7, name: "Inferior Esquerdo" },
            { xStart: 4, xEnd: 7, yStart: 4, yEnd: 7, name: "Inferior Direito" }
        ];
        
        // Escolher um quadrante aleatoriamente
        const quadrant = quadrants[Math.floor(Math.random() * 4)];
        
        addLog(`🧙‍♀️ Cuca lança uma poção no quadrante ${quadrant.name}!`);
        
        // Criar efeito visual para o quadrante inteiro
        const quadrantEffect = document.createElement('div');
        quadrantEffect.style.position = 'absolute';
        quadrantEffect.style.left = (quadrant.xStart * s) + 'px';
        quadrantEffect.style.top = (quadrant.yStart * s) + 'px';
        quadrantEffect.style.width = ((quadrant.xEnd - quadrant.xStart + 1) * s) + 'px';
        quadrantEffect.style.height = ((quadrant.yEnd - quadrant.yStart + 1) * s) + 'px';
        quadrantEffect.style.background = 'radial-gradient(circle, rgba(155, 89, 182, 0.7), rgba(155, 89, 182, 0.3), transparent)';
        quadrantEffect.style.borderRadius = '10px';
        quadrantEffect.style.boxShadow = '0 0 30px rgba(155, 89, 182, 0.8)';
        quadrantEffect.style.animation = 'potionAnim 0.8s ease-out';
        quadrantEffect.style.zIndex = '55';
        
        board.appendChild(quadrantEffect);
        
        // Adicionar efeito de poção em cada tile do quadrante
        for (let x = quadrant.xStart; x <= quadrant.xEnd; x++) {
            for (let y = quadrant.yStart; y <= quadrant.yEnd; y++) {
                setTimeout(() => {
                    triggerPotion(x, y);
                }, (x + y) * 50);
            }
        }
        
        setTimeout(() => {
            if (quadrantEffect.parentNode) quadrantEffect.remove();
        }, 1000);
        
        return quadrant;
    }

    // ================= NOVAS FUNÇÕES PARA OS NOVOS BOSSES terceiro=================
    function triggerBrokenHeart(x, y) {
        const board = document.getElementById('board');
        const s = getStep();
        
        const heart = document.createElement('img');
        heart.src = SPRITES.BrokenHeartFX;
        heart.className = 'broken-heart-fx';
        heart.style.width = (s * 2.5) + 'px';
        heart.style.height = (s * 2.5) + 'px';
        heart.style.left = (x * s - s * 0.75) + 'px';
        heart.style.top = (y * s - s * 0.75) + 'px';
        heart.style.zIndex = '60';
        
        board.appendChild(heart);
        
        setTimeout(() => {
            if (heart.parentNode) heart.remove();
        }, 1200);
    }

    function triggerScaryFace(x, y) {
        const board = document.getElementById('board');
        const s = getStep();
        
        const face = document.createElement('img');
        face.src = SPRITES.ScaryFaceFX;
        face.className = 'scary-face-fx';
        face.style.width = (s * 2.5) + 'px';
        face.style.height = (s * 2.5) + 'px';
        face.style.left = (x * s - s * 0.75) + 'px';
        face.style.top = (y * s - s * 0.75) + 'px';
        face.style.zIndex = '60';
        
        board.appendChild(face);
        
        setTimeout(() => {
            if (face.parentNode) face.remove();
        }, 1500);
    }

    function triggerMoon(x, y) {
        const board = document.getElementById('board');
        const s = getStep();
        
        const moon = document.createElement('img');
        moon.src = SPRITES.MoonFX;
        moon.className = 'moon-fx';
        moon.style.width = (s * 3) + 'px';
        moon.style.height = (s * 3) + 'px';
        moon.style.left = (x * s - s) + 'px';
        moon.style.top = (y * s - s) + 'px';
        moon.style.zIndex = '60';
        
        board.appendChild(moon);
        
        setTimeout(() => {
            if (moon.parentNode) moon.remove();
        }, 1500);
    }

    function triggerMoonRay(x, y) {
        const board = document.getElementById('board');
        const s = getStep();
        
        const ray = document.createElement('div');
        ray.className = 'moon-ray-fx';
        ray.style.left = (x * s + 8) + 'px';
        ray.style.top = (y * s + 8) + 'px';
        ray.style.zIndex = '60';
        
        board.appendChild(ray);
        
        setTimeout(() => {
            if (ray.parentNode) ray.remove();
        }, 800);
    }

    function triggerSun(x, y) {
        const board = document.getElementById('board');
        const s = getStep();
        
        const sun = document.createElement('img');
        sun.src = SPRITES.SunFX;
        sun.className = 'sun-fx';
        sun.style.width = (s * 3) + 'px';
        sun.style.height = (s * 3) + 'px';
        sun.style.left = (x * s - s) + 'px';
        sun.style.top = (y * s - s) + 'px';
        sun.style.zIndex = '60';
        
        board.appendChild(sun);
        
        setTimeout(() => {
            if (sun.parentNode) sun.remove();
        }, 1500);
    }

    function triggerSunRay(x, y) {
        const board = document.getElementById('board');
        const s = getStep();
        
        const ray = document.createElement('div');
        ray.className = 'sun-ray-fx';
        ray.style.left = (x * s + 8) + 'px';
        ray.style.top = (y * s + 8) + 'px';
        ray.style.zIndex = '60';
        
        board.appendChild(ray);
        
        setTimeout(() => {
            if (ray.parentNode) ray.remove();
        }, 800);
    }

    function triggerHeatWave() {
        const board = document.getElementById('board');
        
        const wave = document.createElement('div');
        wave.className = 'heat-wave-fx';
        wave.style.zIndex = '40';
        
        board.appendChild(wave);
        
        setTimeout(() => {
            if (wave.parentNode) wave.remove();
        }, 1500);
    }

    function triggerStorm() {
        const board = document.getElementById('board');
        
        const storm = document.createElement('div');
        storm.className = 'storm-fx';
        storm.style.zIndex = '40';
        
        board.appendChild(storm);
        
        setTimeout(() => {
            if (storm.parentNode) storm.remove();
        }, 1500);
    }

    // ================= BOSSAI ATUALIZADO COM TERCEIRO DESAFIO =================
    async function bossAI() {
        if (bossAIIsRunning || arcadeBossTransition) return;
        
        bossAIIsRunning = true;
        
        const alivePlayers = players.filter(p => !p.dead);
        if (alivePlayers.length === 0) {
            bossAIIsRunning = false;
            showEndGame("GAME OVER", false);
            return;
        }
        
        document.getElementById('turnBoss').classList.add('active-turn');
        const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value);
        
        addLog(`👹 ${boss.type} ataca!`);
        
        // Movimento do boss
        for(let i = 0; i < 4; i++) { 
            if(boss.dead) break; 
            
            let possibleMoves = [
                {x: boss.x + 1, y: boss.y},
                {x: boss.x - 1, y: boss.y},
                {x: boss.x, y: boss.y + 1},
                {x: boss.x, y: boss.y - 1}
            ].filter(m => m.x >= 0 && m.x < 8 && m.y >= 0 && m.y < 8 && !isOccupied(m.x, m.y, -1)); 
            
            if(possibleMoves.length > 0) { 
                let move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]; 
                boss.x = move.x; 
                boss.y = move.y; 
                updateVisuals(); 
                await sleep(250);
            } 
        }
        
        updateAllSpriteDirections();
        
        if(!boss.dead) {
            // Ataques específicos do boss
            if(boss.type === "BOITATA") { 
                if(Math.random() < 0.6) { 
                    playSfx('skill1'); 
                    addLog("🔥 Boitatá lança colunas de fogo!");
                    const columns = [boss.x-1, boss.x, boss.x+1]; 
                    columns.forEach(col => { 
                        if(col >= 0 && col <= 7) {
                            triggerFireColumn(col); 
                        }
                    }); 
                    await sleep(600);
                    players.forEach(p => { 
                        if(!p.dead && columns.includes(p.x)) {
                            applyDmg(p, bossAtk); 
                        }
                    }); 
                } else { 
                    playSfx('skill1'); 
                    addLog("🔥 Boitatá invoca explosões de fogo!");
                    let count = 0, attempts = 0; 
                    while(count < 5 && attempts < 50) { 
                        let idx = Math.floor(Math.random() * 64); 
                        if(grid[idx] === 'FOGO') { 
                            triggerFlare(idx % 8, Math.floor(idx / 8)); 
                            players.forEach(p => { 
                                if(!p.dead && p.x === idx % 8 && p.y === Math.floor(idx / 8)) {
                                    applyDmg(p, bossAtk); 
                                }
                            }); 
                            count++; 
                        } 
                        attempts++; 
                    } 
                } 
            }
            else if(boss.type === "MAPINGUARI") { 
                if(Math.random() < 0.5) { 
                    playSfx('minoa1'); 
                    addLog("🐻 Mapinguari dá uma mordida poderosa!");
                    triggerBite(boss.x, boss.y); 
                    await sleep(600);
                    players.forEach(p => { 
                        if(!p.dead && Math.abs(p.x - boss.x) <= 2 && Math.abs(p.y - boss.y) <= 2) {
                            applyDmg(p, bossAtk); 
                        }
                    }); 
                } else { 
                    playSfx('minoa2'); 
                    addLog("🪨 Mapinguari lança pedras!");
                    triggerRocks(boss.x, boss.y); 
                    await sleep(600);
                    const rows = [boss.y - 1, boss.y, boss.y + 1]; 
                    players.forEach(p => { 
                        if(!p.dead && rows.includes(p.y)) {
                            applyDmg(p, 2); 
                        }
                    }); 
                } 
            }
            else if(boss.type === "SACI") { 
                if(Math.random() < 0.5) { 
                    playSfx('saci1'); 
                    addLog("💨 Saci cria vórtices de vento!");
                    grid.forEach((element, idx) => { 
                        if(element === 'AR') { 
                            triggerVortex(idx % 8, Math.floor(idx / 8), 0, true); 
                            players.forEach(p => { 
                                if(!p.dead && p.x === idx % 8 && p.y === Math.floor(idx / 8)) {
                                    applyDmg(p, bossAtk); 
                                }
                            }); 
                        } 
                    }); 
                } else { 
                    playSfx('saci'); 
                    addLog("🌪️ Saci lança vórtices diagonais!");
                    const diagonals = [
                        {dx:1, dy:1}, {dx:1, dy:-1}, 
                        {dx:-1, dy:1}, {dx:-1, dy:-1}
                    ];
                    
                    diagonals.forEach(dir => { 
                        for(let step = 1; step < 8; step++) { 
                            let nx = boss.x + dir.dx * step, ny = boss.y + dir.dy * step; 
                            if(nx >= 0 && nx < 8 && ny >= 0 && ny < 8) { 
                                triggerVortex(nx, ny, step * 100, true); 
                                players.forEach(p => { 
                                    if(!p.dead && p.x === nx && p.y === ny) {
                                        setTimeout(() => applyDmg(p, bossAtk), step * 100); 
                                    }
                                }); 
                            } 
                        } 
                    }); 
                } 
            }
            else if(boss.type === "IARA") { 
                if(Math.random() < 0.5) { 
                    playSfx('iara1'); 
                    addLog("🌊 Iara invoca um tsunami!");
                    triggerTsunami(); 
                    await sleep(500);
                    players.forEach(p => { 
                        if(!p.dead) { 
                            applyDmg(p, 1); 
                            let dx = p.x < 4 ? -1 : 1, dy = p.y < 4 ? -1 : 1, nx = p.x, ny = p.y; 
                            if(Math.abs(p.x - 3.5) > Math.abs(p.y - 3.5)) { 
                                if(p.x + dx >= 0 && p.x + dx < 8) nx += dx; 
                            } else { 
                                if(p.y + dy >= 0 && p.y + dy < 8) ny += dy; 
                            } 
                            if (!isOccupied(nx, ny, p.id)) { 
                                p.x = nx; 
                                p.y = ny; 
                            } 
                        } 
                    }); 
                    updateVisuals(); 
                } else { 
                    playSfx('iara2'); 
                    addLog("💦 Iara lança jatos d'água!");
                    triggerWaterJet(boss.x, boss.y); 
                    await sleep(600);
                    players.forEach(p => { 
                        if(!p.dead && (p.x === boss.x || p.y === boss.y)) {
                            applyDmg(p, bossAtk); 
                        }
                    }); 
                } 
            }
            // SEGUNDO DESAFIO
            else if(boss.type === "MULA") { 
                if(Math.random() < 0.6) { 
                    playSfx('skill1'); 
                    addLog("🔥 Mula sem Cabeça relincha fogo em 3 colunas!");
                    const columns = [boss.x-1, boss.x, boss.x+1].filter(col => col >= 0 && col <= 7); 
                    columns.forEach(col => { 
                        triggerFireColumn(col); 
                    }); 
                    await sleep(600);
                    players.forEach(p => { 
                        if(!p.dead && columns.includes(p.x)) {
                            applyDmg(p, bossAtk); 
                        }
                    }); 
                } else { 
        playSfx('skill1'); 
        addLog("🔥 Mula sem Cabeça lança bolas de fogo!");
        
        // Adicione esta função NOVA antes do else if (em qualquer lugar das funções de efeito)
        // FUNÇÃO triggerFireball - SE NÃO EXISTIR, ADICIONE ANTES DO bossAI:
        // function triggerFireball(startX, startY, targetX, targetY) {
        //     const board = document.getElementById('board');
        //     const s = getStep();
        //     
        //     const fireball = document.createElement('img');
        //     fireball.src = SPRITES.FireballFX;
        //     fireball.className = 'fireball-fx';
        //     fireball.style.width = s + 'px';
        //     fireball.style.height = s + 'px';
        //     fireball.style.position = 'absolute';
        //     fireball.style.left = (startX * s) + 'px';
        //     fireball.style.top = (startY * s) + 'px';
        //     fireball.style.zIndex = '50';
        //     fireball.style.transition = 'all 0.3s ease-out';
        //     
        //     board.appendChild(fireball);
        //     
        //     setTimeout(() => {
        //         fireball.style.left = (targetX * s) + 'px';
        //         fireball.style.top = (targetY * s) + 'px';
        //     }, 10);
        //     
        //     setTimeout(() => {
        //         if (fireball.parentNode) fireball.remove();
        //         
        //         // Criar explosão em cruz
        //         const s = getStep();
        //         const centerExplosion = document.createElement('div');
        //         centerExplosion.className = 'flare-fx';
        //         centerExplosion.style.left = (targetX * s) + 'px';
        //         centerExplosion.style.top = (targetY * s) + 'px';
        //         centerExplosion.style.width = s + 'px';
        //         centerExplosion.style.height = s + 'px';
        //         board.appendChild(centerExplosion);
        //         
        //         // Explosões em cruz
        //         const crossOffsets = [
        //             {dx: 0, dy: -1}, {dx: 0, dy: 1},
        //             {dx: -1, dy: 0}, {dx: 1, dy: 0}
        //         ];
        //         
        //         crossOffsets.forEach(offset => {
        //             const x = targetX + offset.dx;
        //             const y = targetY + offset.dy;
        //             
        //             if(x >= 0 && x < 8 && y >= 0 && y < 8) {
        //                 const explosion = document.createElement('div');
        //                 explosion.className = 'flare-fx';
        //                 explosion.style.left = (x * s) + 'px';
        //                 explosion.style.top = (y * s) + 'px';
        //                 explosion.style.width = s + 'px';
        //                 explosion.style.height = s + 'px';
        //                 explosion.style.animationDelay = '0.1s';
        //                 board.appendChild(explosion);
        //                 
        //                 setTimeout(() => {
        //                     if (explosion.parentNode) explosion.remove();
        //                 }, 600);
        //             }
        //         });
        //         
        //         setTimeout(() => {
        //             if (centerExplosion.parentNode) centerExplosion.remove();
        //         }, 600);
        //     }, 310);
        //     
        //     setTimeout(() => {
        //         if (fireball.parentNode) fireball.remove();
        //     }, 1000);
        // }
        
        const directions = [
            {dx: 2, dy: 0},  // Direita
            {dx: -2, dy: 0}, // Esquerda
            {dx: 0, dy: 2},  // Baixo
            {dx: 0, dy: -2}  // Cima
        ];
        
        let attacksCount = 0;
        
        directions.forEach(dir => { 
            let targetX = boss.x + dir.dx;
            let targetY = boss.y + dir.dy;
            
            if(targetX >= 0 && targetX < 8 && targetY >= 0 && targetY < 8) {
                attacksCount++;
                
                // Se a função triggerFireball não existir, use este código direto:
                const board = document.getElementById('board');
                const s = getStep();
                
                const fireball = document.createElement('img');
                fireball.src = SPRITES.FireballFX;
                fireball.className = 'fireball-fx';
                fireball.style.width = s + 'px';
                fireball.style.height = s + 'px';
                fireball.style.position = 'absolute';
                fireball.style.left = (boss.x * s) + 'px';
                fireball.style.top = (boss.y * s) + 'px';
                fireball.style.zIndex = '50';
                fireball.style.transition = 'all 0.3s ease-out';
                
                board.appendChild(fireball);
                
                setTimeout(() => {
                    fireball.style.left = (targetX * s) + 'px';
                    fireball.style.top = (targetY * s) + 'px';
                }, 10);
                
                setTimeout(() => {
                    if (fireball.parentNode) fireball.remove();
                    
                    // Explosão central
                    const centerExplosion = document.createElement('div');
                    centerExplosion.className = 'flare-fx';
                    centerExplosion.style.left = (targetX * s) + 'px';
                    centerExplosion.style.top = (targetY * s) + 'px';
                    centerExplosion.style.width = s + 'px';
                    centerExplosion.style.height = s + 'px';
                    board.appendChild(centerExplosion);
                    
                    // Explosões em cruz
                    const crossOffsets = [
                        {dx: 0, dy: -1}, {dx: 0, dy: 1},
                        {dx: -1, dy: 0}, {dx: 1, dy: 0}
                    ];
                    
                    crossOffsets.forEach(offset => {
                        const x = targetX + offset.dx;
                        const y = targetY + offset.dy;
                        
                        if(x >= 0 && x < 8 && y >= 0 && y < 8) {
                            const explosion = document.createElement('div');
                            explosion.className = 'flare-fx';
                            explosion.style.left = (x * s) + 'px';
                            explosion.style.top = (y * s) + 'px';
                            explosion.style.width = s + 'px';
                            explosion.style.height = s + 'px';
                            explosion.style.animationDelay = '0.1s';
                            board.appendChild(explosion);
                            
                            setTimeout(() => {
                                if (explosion.parentNode) explosion.remove();
                            }, 600);
                        }
                    });
                    
                    setTimeout(() => {
                        if (centerExplosion.parentNode) centerExplosion.remove();
                    }, 600);
                    
                }, 310);
                
                setTimeout(() => {
                    if (fireball.parentNode) fireball.remove();
                }, 1000);
                
                // Dano após delay
                setTimeout(() => {
                    players.forEach(p => { 
                        if(!p.dead && p.x === targetX && p.y === targetY) {
                            applyDmg(p, bossAtk); 
                        }
                    });
                    
                    const crossTiles = [
                        {x: targetX, y: targetY-1},
                        {x: targetX, y: targetY+1},
                        {x: targetX-1, y: targetY},
                        {x: targetX+1, y: targetY}
                    ];
                    
                    crossTiles.forEach(tile => {
                        if(tile.x >= 0 && tile.x < 8 && tile.y >= 0 && tile.y < 8) {
                            players.forEach(p => { 
                                if(!p.dead && p.x === tile.x && p.y === tile.y) {
                                    applyDmg(p, Math.floor(bossAtk / 2)); 
                                }
                            });
                        }
                    });
                }, 350);
            }
        });
        
        if (attacksCount === 0) {
            addLog("🔥 Mula sem Cabeça lança colunas de fogo como alternativa!");
            const columns = [boss.x-1, boss.x, boss.x+1].filter(col => col >= 0 && col <= 7); 
            columns.forEach(col => { 
                triggerFireColumn(col); 
            }); 
            
            setTimeout(() => {
                players.forEach(p => { 
                    if(!p.dead && columns.includes(p.x)) {
                        applyDmg(p, bossAtk); 
                    }
                }); 
            }, 600);
        }
        
        await sleep(700);
    } 
}
else if(boss.type === "CORPOSECO") { 
    if(Math.random() < 0.5) { 
        playSfx('garras'); 
        addLog("💀 Corpo Seco sopra vapor podre!");
        
        const directions = [
            {dx: 0, dy: -1}, {dx: 0, dy: -2},
            {dx: 0, dy: 1}, {dx: 0, dy: 2},
            {dx: -1, dy: 0}, {dx: -2, dy: 0},
            {dx: 1, dy: 0}, {dx: 2, dy: 0}
        ];
        
        directions.forEach(dir => {
            let tileX = boss.x + dir.dx;
            let tileY = boss.y + dir.dy;
            if(tileX >= 0 && tileX < 8 && tileY >= 0 && tileY < 8) {
                triggerPoisonGas(tileX, tileY);
                players.forEach(p => { 
                    if(!p.dead && p.x === tileX && p.y === tileY) {
                        applyDmg(p, bossAtk); 
                    }
                });
            }
        });
        
        await sleep(600);
    } else { 
        playSfx('garras'); 
        addLog("💀 Corpo Seco ataca com garras!");
        
        const attackDirections = ['left', 'right', 'up', 'down'];
        const direction = attackDirections[Math.floor(Math.random() * 4)];
        let targetTiles = [];
        
        switch(direction) {
            case 'left':
                for(let dx = -2; dx <= 0; dx++) {
                    for(let dy = -2; dy <= 2; dy++) {
                        targetTiles.push({x: boss.x + dx, y: boss.y + dy});
                    }
                }
                break;
            case 'right':
                for(let dx = 0; dx <= 2; dx++) {
                    for(let dy = -2; dy <= 2; dy++) {
                        targetTiles.push({x: boss.x + dx, y: boss.y + dy});
                    }
                }
                break;
            case 'up':
                for(let dx = -2; dx <= 2; dx++) {
                    for(let dy = -2; dy <= 0; dy++) {
                        targetTiles.push({x: boss.x + dx, y: boss.y + dy});
                    }
                }
                break;
            case 'down':
                for(let dx = -2; dx <= 2; dx++) {
                    for(let dy = 0; dy <= 2; dy++) {
                        targetTiles.push({x: boss.x + dx, y: boss.y + dy});
                    }
                }
                break;
        }
        
        targetTiles.forEach(tile => {
            if(tile.x >= 0 && tile.x < 8 && tile.y >= 0 && tile.y < 8) {
                triggerClawSpin(tile.x, tile.y);
                players.forEach(p => { 
                    if(!p.dead && p.x === tile.x && p.y === tile.y) {
                        applyDmg(p, bossAtk + 1); 
                    }
                });
            }
        });
        
        await sleep(600);
    } 
}
else if(boss.type === "LOBISOMEM") { 
    if(Math.random() < 0.5) { 
        playSfx('garras'); 
        addLog("🐺 Lobisomem ataca com garras!");
        
        triggerClawSpin(boss.x, boss.y);
        
        // Aplicar dano após animação
        setTimeout(() => {
            players.forEach(p => { 
                if(!p.dead && Math.abs(p.x - boss.x) <= 1 && Math.abs(p.y - boss.y) <= 1) {
                    applyDmg(p, bossAtk); 
                }
            });
        }, 300);
        
        await sleep(600);
    } else { 
        playSfx('minoa2'); 
        addLog("🐺 Lobisomem treme a terra!");
        
        triggerEarthquake();
        await sleep(400);
        
        // Dano em área
        for(let dx = -2; dx <= 2; dx++) {
            for(let dy = -2; dy <= 2; dy++) {
                if(dx === 0 && dy === 0) continue;
                
                const tileX = boss.x + dx;
                const tileY = boss.y + dy;
                
                if(tileX >= 0 && tileX < 8 && tileY >= 0 && tileY < 8) {
                    triggerFlare(tileX, tileY);
                    players.forEach(p => { 
                        if(!p.dead && p.x === tileX && p.y === tileY) {
                            applyDmg(p, 2); 
                        }
                    });
                }
            }
        }
        
        // Movimento simples SEM LOOPS INFINITOS
        players.forEach(p => { 
            if(!p.dead) {
                // Mover 1 tile em direção ao lobisomem
                let newX = p.x;
                let newY = p.y;
                
                if(p.x < boss.x && !isOccupied(p.x + 1, p.y, p.id)) newX = p.x + 1;
                else if(p.x > boss.x && !isOccupied(p.x - 1, p.y, p.id)) newX = p.x - 1;
                
                if(p.y < boss.y && !isOccupied(newX, p.y + 1, p.id)) newY = p.y + 1;
                else if(p.y > boss.y && !isOccupied(newX, p.y - 1, p.id)) newY = p.y - 1;
                
                p.x = newX;
                p.y = newY;
            }
        });
        
        updateVisuals();
        addLog("🐺 Heróis foram puxados para perto!");
        await sleep(400);
    } 
}
else if(boss.type === "CUCA") { 
    if(Math.random() < 0.5) { 
        playSfx('cucask1'); 
        addLog("🧙‍♀️ Cuca lança poção em um quadrante!");
        
        // Escolher quadrante aleatório
        const quadrantX = Math.random() < 0.5 ? 0 : 4;
        const quadrantY = Math.random() < 0.5 ? 0 : 4;
        
        // Efeito visual no quadrante
        for(let x = quadrantX; x < quadrantX + 4; x++) {
            for(let y = quadrantY; y < quadrantY + 4; y++) {
                triggerPoisonGas(x, y);
            }
        }
        
        // Aplicar dano
        setTimeout(() => {
            for(let x = quadrantX; x < quadrantX + 4; x++) {
                for(let y = quadrantY; y < quadrantY + 4; y++) {
                    if(x >= 0 && x < 8 && y >= 0 && y < 8) {
                        players.forEach(p => { 
                            if(!p.dead && p.x === x && p.y === y) {
                                applyDmg(p, bossAtk); 
                            }
                        });
                    }
                }
            }
        }, 300);
        
        await sleep(600);
    } else { 
        playSfx('cucask2'); 
        addLog("🧙‍♀️ Cuca bebe uma poção curativa!");
        
        triggerPotion(boss.x, boss.y);
        await sleep(400);
        
        boss.hp = Math.min(boss.maxHp, boss.hp + 2);
        showHealEffect(boss.x, boss.y, 2);
        updateVisuals();
        addLog(`🧪 ${boss.type} recuperou 2 HP!`);
        
        await sleep(400);
    } 
}
            // TERCEIRO DESAFIO - NOVOS BOSSES
            else if(boss.type === "BOTO") { 
                if(Math.random() < 0.6) { 
                    playSfx('boto_skill1'); 
                    addLog("🐬 Boto Rosa quebra corações na área!");
                    
                    // Dano em 2 tiles ao redor do boss
                    for(let dx = -1; dx <= 1; dx++) {
                        for(let dy = -1; dy <= 1; dy++) {
                            if(dx === 0 && dy === 0) continue;
                            const tileX = boss.x + dx;
                            const tileY = boss.y + dy;
                            
                            if(tileX >= 0 && tileX < 8 && tileY >= 0 && tileY < 8) {
                                triggerBrokenHeart(tileX, tileY);
                                players.forEach(p => { 
                                    if(!p.dead && p.x === tileX && p.y === tileY) {
                                        applyDmg(p, bossAtk); 
                                    }
                                });
                            }
                        }
                    }
                    await sleep(600);
                } else { 
                    playSfx('boto_skill2'); 
                    addLog("🐬 Boto Rosa lança jatos d'água em cruz!");
                    
                    // Jato vertical
                    for(let y = 0; y < 8; y++) {
                        const tileX = boss.x;
                        const tileY = y;
                        triggerWaterJet(tileX, tileY);
                    }
                    
                    // Jato horizontal
                    for(let x = 0; x < 8; x++) {
                        const tileX = x;
                        const tileY = boss.y;
                        triggerWaterJet(tileX, tileY);
                    }
                    
                    await sleep(600);
                    
                    // Aplicar dano na linha e coluna
                    players.forEach(p => { 
                        if(!p.dead && (p.x === boss.x || p.y === boss.y)) {
                            applyDmg(p, bossAtk); 
                        }
                    });
                } 
            }
            else if(boss.type === "BOI") { 
                if(Math.random() < 0.5) { 
                    playSfx('boi_skill1'); 
                    addLog("🐂 Boi da Cara Preta mostra sua face assustadora!");
                    
                    // Dano em 2 tiles ao redor
                    for(let dx = -1; dx <= 1; dx++) {
                        for(let dy = -1; dy <= 1; dy++) {
                            if(dx === 0 && dy === 0) continue;
                            const tileX = boss.x + dx;
                            const tileY = boss.y + dy;
                            
                            if(tileX >= 0 && tileX < 8 && tileY >= 0 && tileY < 8) {
                                triggerScaryFace(tileX, tileY);
                                players.forEach(p => { 
                                    if(!p.dead && p.x === tileX && p.y === tileY) {
                                        applyDmg(p, bossAtk); 
                                    }
                                });
                            }
                        }
                    }
                    
                    // Embaralhar tiles atingidos
                    const affectedIndices = [];
                    for(let dx = -1; dx <= 1; dx++) {
                        for(let dy = -1; dy <= 1; dy++) {
                            const tileX = boss.x + dx;
                            const tileY = boss.y + dy;
                            if(tileX >= 0 && tileX < 8 && tileY >= 0 && tileY < 8) {
                                affectedIndices.push(tileY * 8 + tileX);
                            }
                        }
                    }
                    
                    // Embaralhar cores dos tiles
                    affectedIndices.forEach(idx => {
                        const newColor = COLORS[Math.floor(Math.random() * 4)];
                        grid[idx] = newColor;
                        const tile = document.querySelectorAll('.tile')[idx];
                        tile.className = `tile bg-${newColor}`;
                    });
                    
                    addLog("🌀 Tiles ao redor foram embaralhados!");
                    await sleep(600);
                    
                } else { 
                    playSfx('boi_skill2'); 
                    addLog("🐂 Boi da Cara Preta empurra os heróis para as bordas!");
                    
                    // Empurrar jogadores para as bordas
                    players.forEach(p => { 
                        if(!p.dead) {
                            let nx = p.x, ny = p.y;
                            
                            // Empurrar para borda mais próxima
                            if(p.x < 4) {
                                nx = Math.max(0, p.x - 1); // Empurrar para esquerda
                            } else {
                                nx = Math.min(7, p.x + 1); // Empurrar para direita
                            }
                            
                            if(p.y < 4) {
                                ny = Math.max(0, p.y - 1); // Empurrar para cima
                            } else {
                                ny = Math.min(7, p.y + 1); // Empurrar para baixo
                            }
                            
                            // Tentar mover para a borda, evitando ocupação
                            let finalX = p.x, finalY = p.y;
                            
                            // Mover horizontalmente primeiro
                            let stepX = p.x < nx ? 1 : -1;
                            for(let x = p.x; x !== nx; x += stepX) {
                                if(!isOccupied(x + stepX, p.y, p.id)) {
                                    finalX = x + stepX;
                                } else {
                                    break;
                                }
                            }
                            
                            // Mover verticalmente
                            let stepY = p.y < ny ? 1 : -1;
                            for(let y = p.y; y !== ny; y += stepY) {
                                if(!isOccupied(finalX, y + stepY, p.id)) {
                                    finalY = y + stepY;
                                } else {
                                    break;
                                }
                            }
                            
                            p.x = finalX;
                            p.y = finalY;
                        } 
                    });
                    
                    updateVisuals();
                    addLog("💨 Heróis foram empurrados para as bordas do tabuleiro!");
                    await sleep(400);
                    
                    // Dano após empurrar
                    players.forEach(p => { 
                        if(!p.dead) {
                            applyDmg(p, 1); 
                        }
                    });
                } 
            }
            else if(boss.type === "JACI") { 
                if(Math.random() < 0.6) { 
                    playSfx('jaci_skill1'); 
                    addLog("🌙 Jaci invoca a lua e ataca todos os tiles de AR!");
                    
                    // Efeito da lua
                    triggerMoon(boss.x, boss.y);
                    
                    await sleep(400);
                    
                    // Ataque em todos os tiles de AR
                    let arTilesAttacked = 0;
                    grid.forEach((element, idx) => { 
                        if(element === 'AR') { 
                            const x = idx % 8;
                            const y = Math.floor(idx / 8);
                            triggerMoonRay(x, y);
                            arTilesAttacked++;
                            
                            players.forEach(p => { 
                                if(!p.dead && p.x === x && p.y === y) {
                                    setTimeout(() => applyDmg(p, bossAtk), 200); 
                                }
                            });
                        } 
                    });
                    
                    addLog(`💨 ${arTilesAttacked} tiles de AR foram atingidos!`);
                    await sleep(600);
                    
                } else { 
                    playSfx('jaci_skill2'); 
                    addLog("⛈️ Jaci invoca uma tempestade em todo o tabuleiro!");
                    
                    // Efeito de tempestade
                    triggerStorm();
                    
                    await sleep(500);
                    
                    // Dano a todos os jogadores
                    players.forEach(p => { 
                        if(!p.dead) {
                            applyDmg(p, 1); 
                        }
                    });
                    
                    // Cura do boss
                    boss.hp = Math.min(boss.maxHp, boss.hp + 1);
                    showHealEffect(boss.x, boss.y, 1);
                    updateVisuals();
                    addLog(`💖 ${boss.type} recuperou 1 HP!`);
                    
                    await sleep(400);
                } 
            }
            else if(boss.type === "GUARACI") { 
                if(Math.random() < 0.6) { 
                    playSfx('guaraci_skill1'); 
                    addLog("☀️ Guaraci invoca o sol e ataca todos os tiles de FOGO!");
                    
                    // Efeito do sol
                    triggerSun(boss.x, boss.y);
                    
                    await sleep(400);
                    
                    // Ataque em todos os tiles de FOGO
                    let fireTilesAttacked = 0;
                    grid.forEach((element, idx) => { 
                        if(element === 'FOGO') { 
                            const x = idx % 8;
                            const y = Math.floor(idx / 8);
                            triggerSunRay(x, y);
                            fireTilesAttacked++;
                            
                            players.forEach(p => { 
                                if(!p.dead && p.x === x && p.y === y) {
                                    setTimeout(() => applyDmg(p, bossAtk), 200); 
                                }
                            });
                        } 
                    });
                    
                    addLog(`🔥 ${fireTilesAttacked} tiles de FOGO foram atingidos!`);
                    await sleep(600);
                    
                } else { 
                    playSfx('guaraci_skill2'); 
                    addLog("🔥 Guaraci invoca uma onda de calor!");
                    
                    // Efeito de onda de calor
                    triggerHeatWave();
                    
                    await sleep(500);
                    
                    // Dano a todos os jogadores
                    players.forEach(p => { 
                        if(!p.dead) {
                            applyDmg(p, 1); 
                        }
                    });
                    
                    // Cura do boss
                    boss.hp = Math.min(boss.maxHp, boss.hp + 1);
                    showHealEffect(boss.x, boss.y, 1);
                    updateVisuals();
                    addLog(`💖 ${boss.type} recuperou 1 HP!`);
                    
                    await sleep(400);
                } 
            }
            // BOSS FINAL: ANHANGÁ
            else if(boss.type === "ANHANGA") { 
                // 60% de chance para Skill 1, 40% para Skill 2
                if(Math.random() < 0.6) { 
                    playSfx('anhanga_skill1'); 
                    addLog("🔥 ANHANGÁ: 'Sintam meu fogo intercalado!'");
                    
                    // Atacar colunas alternadas a partir da posição do boss
                    const columnsToAttack = [];
                    
                    // Começar na coluna do boss e alternar
                    for (let col = boss.x; col < 8; col += 2) {
                        columnsToAttack.push(col);
                    }
                    for (let col = boss.x; col >= 0; col -= 2) {
                        columnsToAttack.push(col);
                    }
                    
                    // Remover duplicados
                    const uniqueColumns = [...new Set(columnsToAttack)];
                    
                    // Efeito visual nas colunas atacadas
                    uniqueColumns.forEach(col => {
                        if(col >= 0 && col <= 7) {
                            triggerFireColumn(col);
                        }
                    });
                    
                    await sleep(600);
                    
                    // Aplicar dano apenas nas colunas atacadas
                    players.forEach(p => { 
                        if(!p.dead && uniqueColumns.includes(p.x)) {
                            applyDmg(p, bossAtk ); // Dano aumentado para o boss final
                        }
                    });
                    
                } else { 
                    playSfx('anhanga_skill2'); 
                    addLog("💀 ANHANGÁ: 'Eu me alimento da natureza!'");
                    
                    // Efeito visual de sucção de energia
                    const board = document.getElementById('board');
                    const s = getStep();
                    
                    // Criar efeito de energia sendo sugada para o Anhangá
                    const suckEffect = document.createElement('div');
                    suckEffect.style.position = 'absolute';
                    suckEffect.style.left = (boss.x * s + 8) + 'px';
                    suckEffect.style.top = (boss.y * s + 8) + 'px';
                    suckEffect.style.width = '20px';
                    suckEffect.style.height = '20px';
                    suckEffect.style.background = 'radial-gradient(circle, #8e44ad, #9b59b6, transparent)';
                    suckEffect.style.borderRadius = '50%';
                    suckEffect.style.boxShadow = '0 0 20px #8e44ad';
                    suckEffect.style.animation = 'pulseSkill 0.8s infinite alternate';
                    suckEffect.style.zIndex = '55';
                    
                    board.appendChild(suckEffect);
                    
                    // Cura do Anhangá
                    triggerPotion(boss.x, boss.y);
                    await sleep(400);
                    boss.hp = Math.min(boss.maxHp, boss.hp + 3);
                    showHealEffect(boss.x, boss.y, 3);
                    updateVisuals();
                    addLog(`🧪 ${boss.type} recuperou 3 HP sugando energia da natureza!`);
                    
                    // Remover efeito
                    setTimeout(() => {
                        if (suckEffect.parentNode) suckEffect.remove();
                    }, 1000);
                } 
            }
        }
        
        await sleep(600); 
        document.getElementById('turnBoss').classList.remove('active-turn');
        
        bossAIIsRunning = false;
        
        // ✅ VERIFICAR SE O BOSS MORREU DURANTE O ATAQUE
        if (boss.dead) {
            console.log("⚡ Boss morreu durante o ataque do AI");
            return; // Não passa turno, handleBossDefeat será chamado
        }
        
        const stillAlivePlayers = players.filter(p => !p.dead);
        if (stillAlivePlayers.length === 0) {
            showEndGame("GAME OVER", false);
            return;
        }
        
        // ✅ VERIFICAR SE ESTÁ EM TRANSIÇÃO DE BOSS
        if (arcadeBossTransition) {
            console.log("⚡ Em transição de boss, não passando turno");
            return;
        }
        
        // ✅ DEFINIR TURNO DOS JOGADORES APÓS O BOSS ATACAR
        currentPlayerIdx = 0; 
        while (currentPlayerIdx < players.length && players[currentPlayerIdx] && players[currentPlayerIdx].dead) {
            currentPlayerIdx++;
        }
        
        if (currentPlayerIdx < players.length && players[currentPlayerIdx]) {
            switchConfig(currentPlayerIdx);
            addLog(`🎮 Turno dos jogadores! Começa com ${players[currentPlayerIdx].name}`);
            
            document.getElementById('turnP_Active').classList.add('active-turn');
        } else {
            showEndGame("GAME OVER", false);
        }
        
        updateAllSpriteDirections();
    }

    // ================= FUNÇÃO HANDLEBOSS DEFEAT - CORRIGIDA =================
    async function handleBossDefeat() {
        if (mode === "ARCADE") {
            // ✅ RESETAR IMEDIATAMENTE A FLAG DO BOSS AI
            bossAIIsRunning = false;
            
            const defeatedBoss = arcadeCurrentOrder[arcadeIndex];
            const clue = LORE.bossLore[defeatedBoss]?.clue || "...";
            
            addLog(`💬 ${defeatedBoss} sussurra antes de cair: "${clue}"`);
            
            updateTitleStats('boss_defeated', 1, defeatedBoss);
            
            arcadeIndex++; 
            LORE.currentStage++;
            
            // ✅ VERIFICAR SE COMPLETOU OS 4 BOSSES DO DESAFIO
            if (arcadeIndex >= arcadeCurrentOrder.length) {
                // Se for o quinto boss (Anhangá), mostrar vitória total
                if (boss.type === "ANHANGA") {
                    LORE.anhangáRevealed = true;
                    addLog("👑 DESAFIO FINAL COMPLETO!");
                    addLog("🎉 ANHANGÁ FOI DERROTADO!");
                    addLog("🏆 VOCÊ É O VERDADEIRO HERÓI DA FLORESTA!");
                    
                    showEndGame("VITÓRIA TOTAL!", true);
                    return;
                }
                
                // Se completou 4 bosses normais, adicionar Anhangá como quinto
                addLog("🔥 OS QUATRO BOSSES FORAM DERROTADOS!");
                addLog("👹 MAS ALGO SOMBRIO SE APROXIMA...");
                addLog("💀 ANHANGÁ, O ESPÍRITO DO MAL, DESPERTA!");
                
                // ✅ SETAR FLAG DE TRANSIÇÃO
                arcadeBossTransition = true;
                
                // Inicializar Anhangá como boss final
                boss.type = "ANHANGA";
                
                // Vida do Anhangá: 10 a mais que o boss normal
                const baseBossHP = parseInt(document.getElementById('hp_BOSS_cfg').value) || 30;
                boss.maxHp = baseBossHP + 9;
                boss.hp = boss.maxHp;
                boss.dead = false;
                boss.x = 4;
                boss.y = 0;
                
                // Atualizar sprite e interface
                const bossImg = document.getElementById('imgBoss');
                if (bossImg) bossImg.src = SPRITES.ANHANGA;
                document.getElementById('turnBoss').innerText = `${boss.type} BOSS FINAL`;
                document.getElementById('bossNameDisplay').textContent = "ANHANGA";
                
                updateVisuals();
                playBossTheme();
                updateAllSpriteDirections();
                
                // Mostrar diálogo do Anhangá
                await showBossIntroDialog("ANHANGA");
                
                // ✅ DEFINIR QUE OS HERÓIS ATACAM PRIMEIRO
                currentPlayerIdx = 0;
                while (currentPlayerIdx < players.length && players[currentPlayerIdx] && players[currentPlayerIdx].dead) {
                    currentPlayerIdx++;
                }
                
                if (currentPlayerIdx < players.length && players[currentPlayerIdx]) {
                    switchConfig(currentPlayerIdx);
                    addLog(`👹 BOSS FINAL: ANHANGA!`);
                    addLog(`🎮 ${players[currentPlayerIdx].name} ATACA PRIMEIRO!`);
                    
                    document.getElementById('turnP_Active').classList.add('active-turn');
                    document.getElementById('turnBoss').classList.remove('active-turn');
                    
                    saveAndRefresh();
                    updateAllSpriteDirections();
                }
                
                // ✅ RESETAR FLAG DE TRANSIÇÃO
                arcadeBossTransition = false;
                return;
            }
            
            // ✅ SETAR FLAG DE TRANSIÇÃO PARA PRÓXIMO BOSS
            arcadeBossTransition = true;
            
            // Próximo boss regular
            boss.type = arcadeCurrentOrder[arcadeIndex];
            
            // Ajustar vida para boss normal
            const baseBossHP = parseInt(document.getElementById('hp_BOSS_cfg').value) || 30;
            boss.maxHp = baseBossHP;
            boss.hp = boss.maxHp;
            boss.dead = false;
            boss.x = 4;
            boss.y = 0;
            
            document.getElementById('imgBoss').src = SPRITES[boss.type];
            document.getElementById('turnBoss').innerText = `${boss.type} BOSS`;
            
            updateAllSpriteDirections();
            updateVisuals();
            playBossTheme();
            
            // Mostrar diálogo do boss
            await showBossIntroDialog(boss.type);
            
            // ✅ GARANTIR QUE OS HERÓIS ATACAM PRIMEIRO
            currentPlayerIdx = 0;
            while (currentPlayerIdx < players.length && players[currentPlayerIdx] && players[currentPlayerIdx].dead) {
                currentPlayerIdx++;
            }
            
            if (currentPlayerIdx < players.length && players[currentPlayerIdx]) {
                switchConfig(currentPlayerIdx);
                addLog(`🔥 PRÓXIMO BOSS: ${boss.type}!`);
                addLog(`🎮 ${players[currentPlayerIdx].name} ATACA PRIMEIRO!`);
                
                document.getElementById('turnP_Active').classList.add('active-turn');
                document.getElementById('turnBoss').classList.remove('active-turn');
                
                saveAndRefresh();
                updateAllSpriteDirections();
            }
            
            // ✅ RESETAR FLAG DE TRANSIÇÃO
            arcadeBossTransition = false;
            
        } else if (mode === "BOSS") {
            showEndGame("BOSS DERROTADO!", true);
        }
    }

    // ================= FUNÇÕES AUXILIARES DO JOGO =================
    function saveAndRefresh() { 
        const p = players[editingIdx]; 
        if (!p) return; 
        p.name = document.getElementById('pName').value.toUpperCase(); 
        let s = 0; 
        for(let i = 0; i < p.name.length; i++) s += p.name.charCodeAt(i); 
        p.element = COLORS[s % 4]; 
        const ed = document.getElementById('pElem'); 
        ed.innerText = p.element; 
        ed.className = `element-display bg-${p.element}`; 
        
        const baseAtk = CLASS_DB[p.class].atk;
        const amuletBonus = p.bonusAtk || 0;
        const titleBonus = p.titleBonus?.ATK || 0;
        const totalAtk = baseAtk + amuletBonus + titleBonus;
        
        document.getElementById('pStatsDisplay').innerHTML = `
            HP: <b>${p.hp}</b> / ${p.maxHp} | 
            ATK: <b>${totalAtk}</b>
            ${titleBonus > 0 ? `<span style="color:#2ecc70; font-size:10px;"> (+${titleBonus} título)</span>` : ''}
        `; 
        
        const img = document.getElementById(`imgP${p.id}`); 
        if (img) img.src = SPRITES[p.class]; 
        
        const isMyTurn = (editingIdx === currentPlayerIdx && currentPlayerIdx >= 0); 
        document.getElementById('btnPlay').disabled = !isMyTurn; 
        document.getElementById('btnSkill').disabled = !isMyTurn || players[currentPlayerIdx]?.skillUsed; 
        
        const turnActive = document.getElementById('turnP_Active');
        if (turnActive) {
            turnActive.classList.toggle('active-turn', currentPlayerIdx >= 0); 
            turnActive.style.opacity = currentPlayerIdx >= 0 ? "1" : "0.7";
        }
        
        const titleBonusDisplay = document.getElementById('titleBonusDisplay');
        if (titleBonus > 0) {
            titleBonusDisplay.style.display = 'block';
            titleBonusDisplay.textContent = `+${titleBonus} ATK (Título)`;
        } else {
            titleBonusDisplay.style.display = 'none';
        }
        
        updateAllSpriteDirections();
    }
    
    function switchConfig(idx) { 
        editingIdx = idx; 
        const p = players[idx]; 
        if(!p) return; 
        document.getElementById('pName').value = p.name; 
        document.getElementById('pClass').value = p.class; 
        saveAndRefresh(); 
    }
    
    function resetPlayerHP() { 
        const p = players[editingIdx]; 
        p.class = document.getElementById('pClass').value; 
        p.hp = CLASS_DB[p.class].hp; 
        p.maxHp = p.hp; 
        saveAndRefresh(); 
        updateVisuals(); 
        updateAllSpriteDirections();
    }
    
    function createTile(idx) { 
        const c = COLORS[Math.floor(Math.random() * 4)]; 
        grid[idx] = c; 
        const chance = parseFloat(document.getElementById('amulet_chance').value) || 1; 
        amulets[idx] = (Math.random() * 100 < chance); 
        const tile = document.createElement('div'); 
        tile.className = `tile bg-${c}`; 
        tile.onclick = () => handleSelect(idx); 
        if(amulets[idx]) { 
            const img = document.createElement('img'); 
            img.src = SPRITES.Muiraquita; 
            img.className = 'amulet-img'; 
            tile.appendChild(img); 
        } 
        return tile; 
    }
    
    function isOccupied(nx, ny, excludeId) { 
        if ((mode === "BOSS" || mode === "ARCADE") && boss.x === nx && boss.y === ny && !boss.dead) return true; 
        return players.some(p => !p.dead && p.id !== excludeId && p.x === nx && p.y === ny); 
    }
    
    function checkAmulet(p, x, y) {
        const idx = y * 8 + x; 
        if(amulets[idx]) { 
            RANKING.amulets++;
            updateTitleStats('amulet_collected');
            
            amulets[idx] = false; 
            p.bonusAtk += 1; 
            const tile = document.querySelectorAll('.tile')[idx]; 
            if(tile) tile.innerHTML = ''; 
            addLog(`${p.name} Muiraquitã! +1 ATK.`); 
            saveAndRefresh(); 
        } 
    }
    
    function handleSelect(idx) { 
        if(!gameActive || arcadeBossTransition) return; 
        const p = players[currentPlayerIdx]; 
        if (skillActive) { 
            grid[idx] = p.element; 
            document.querySelectorAll('.tile')[idx].className = `tile bg-${p.element}`; 
            p.skillUsed = true; 
            skillActive = false; 
            document.querySelectorAll('.tile').forEach(t => t.classList.remove('skill-mode')); 
            addLog(`${p.name} Ultimate!`); 
            saveAndRefresh(); 
            return; 
        } 
        const x = idx % 8, y = Math.floor(idx / 8); 
        if(isOccupied(x, y, p.id) || (x === p.x && y === p.y)) return; 
        if(path.length === 0) { 
            if((Math.abs(x - p.x) + Math.abs(y - p.y)) === 1) { 
                path.push(idx); 
                playSfx('click'); 
            } 
        } else { 
            const lastIdx = path[path.length - 1]; 
            if(idx === lastIdx) { 
                path.pop(); 
                playSfx('click'); 
            } else if(!path.includes(idx) && grid[idx] === grid[lastIdx] && (Math.abs(x - lastIdx % 8) + Math.abs(y - Math.floor(lastIdx / 8))) === 1) { 
                path.push(idx); 
                playSfx('click'); 
            } 
        } 
        renderPath(); 
    }
    
    function renderPath() { 
        const threshold = parseInt(document.getElementById('bravely_tiles').value) || 9; 
        const isBravely = path.length >= threshold; 
        document.querySelectorAll('.tile').forEach((t, i) => { 
            t.classList.toggle('selected', path.includes(i)); 
            t.classList.toggle('bravely-ready', isBravely && path.includes(i)); 
        }); 
    }
    
    function detectShape(pIdxs) { 
        if(pIdxs.length !== 4) return null; 
        const coords = pIdxs.map(i => ({x: i % 8, y: Math.floor(i / 8)})); 
        const xs = coords.map(c => c.x), ys = coords.map(c => c.y); 
        const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys); 
        const w = maxX - minX, h = maxY - minY; 
        if (w === 0 || h === 0) return "LINHA"; 
        if (w === 1 && h === 1) return "QUADRADO"; 
        let vectors = []; 
        for(let i = 1; i < coords.length; i++) vectors.push({ dx: coords[i].x - coords[i-1].x, dy: coords[i].y - coords[i-1].y }); 
        let turns = 0; 
        for(let i = 1; i < vectors.length; i++) if (vectors[i].dx !== vectors[i-1].dx || vectors[i].dy !== vectors[i-1].dy) turns++; 
        if ((vectors[0].dx === vectors[1].dx && vectors[0].dy === vectors[1].dy || vectors[1].dx === vectors[2].dx && vectors[1].dy === vectors[2].dy) && turns === 1) return "L"; 
        if (turns === 2 && vectors[0].dx === vectors[2].dx && vectors[0].dy === vectors[2].dy) return "ZIGZAG"; 
        return null; 
    }
    
    function triggerElementalFX(element, pos, type, heroX, heroY) { 
        const s = getStep(); 
        const board = document.getElementById('board'); 
        if(element === 'FOGO') { 
            playSfx('skill1'); 
            const f = document.createElement('div'); 
            f.className = (type === 'COL') ? 'fire-column' : 'fire-row'; 
            if(type === 'COL') { 
                f.style.left = (pos * s + 8) + 'px'; 
                f.style.top = '0'; 
                f.style.height = '100%'; 
            } else { 
                f.style.top = (pos * s + 8) + 'px'; 
                f.style.left = '0'; 
                f.style.width = '100%'; 
            } 
            board.appendChild(f); 
            setTimeout(() => f.remove(), 1200); 
        } else if(element === 'AGUA') { 
            playSfx('iara2'); 
            
            const waterFX = document.createElement('div');
            waterFX.className = 'water-cross-fx';
            
            if(type === 'COL') {
                waterFX.style.width = s + 'px';
                waterFX.style.height = '100%';
                waterFX.style.left = (pos * s + 8) + 'px';
                waterFX.style.top = '0';
                waterFX.style.background = 'linear-gradient(0deg, transparent, rgba(255,255,255,0.9), rgba(52,152,219,1), rgba(255,255,255,0.9), transparent)';
            } else {
                waterFX.style.width = '100%';
                waterFX.style.height = s + 'px';
                waterFX.style.top = (pos * s + 8) + 'px';
                waterFX.style.left = '0';
                waterFX.style.background = 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), rgba(52,152,219,1), rgba(255,255,255,0.9), transparent)';
            }
            
            waterFX.style.boxShadow = '0 0 20px rgba(52, 152, 219, 0.8)';
            waterFX.style.borderRadius = '4px';
            waterFX.style.animation = 'waterCrossAnim 0.8s ease-out';
            waterFX.style.zIndex = '50';
            
            board.appendChild(waterFX);
            setTimeout(() => waterFX.remove(), 1200);
        } else if(element === 'TERRA') { 
            playSfx('minoa2'); 
            for(let i = 0; i < 8; i++) { 
                const tx = (type === 'COL') ? pos : i, ty = (type === 'COL') ? i : pos, dist = Math.abs(tx - heroX) + Math.abs(ty - heroY); 
                setTimeout(() => { 
                    const r = document.createElement('img'); 
                    r.src = SPRITES.RockFX; 
                    r.className = 'rock-projectile'; 
                    r.style.width = (s * 1.2) + 'px'; 
                    r.style.left = (tx * s + 8) + 'px'; 
                    r.style.top = (ty * s + 8) + 'px'; 
                    board.appendChild(r); 
                    setTimeout(() => { r.style.transform = 'scale(2) rotate(1080deg)'; r.style.opacity = '0'; }, 50); 
                    setTimeout(() => r.remove(), 450); 
                }, dist * 80); 
            } 
        } else if(element === 'AR') { 
            playSfx('saci1'); 
            for(let i = 0; i < 8; i++) { 
                const tx = (type === 'COL') ? pos : i, ty = (type === 'COL') ? i : pos, dist = Math.abs(tx - heroX) + Math.abs(ty - heroY); 
                triggerVortex(tx, ty, dist * 80, true); 
            } 
        } 
    }

    function showEndGame(msg, isWin) { 
        gameActive = false;
        console.log("🏁 Fim de jogo:", msg, "Venceu?", isWin);
        
        if (isWin) {
            players.forEach(p => {
                if (p.hp === 1 && !p.dead) {
                    updateTitleStats('survive_1hp');
                }
            });
        }
        
        if(isWin && (mode === "BOSS" || mode === "ARCADE")){ 
            console.log("📤 Chamando sendScoreToDreamlo...");
            sendScoreToDreamlo(); 
        }
        
        if(currentBGM) currentBGM.pause(); 
        const o = document.getElementById('gameOverlay'); 
        o.style.display = 'flex'; 
        document.getElementById('overlayTitle').innerText = msg; 
        document.getElementById('overlayTitle').className = isWin ? "win-text" : "lose-text"; 
        playSfx(isWin ? 'win' : 'gameover'); 
    }
    
    function applyDmg(t, amt) { 
        if(t.dead) return; 
        
        if (t.titleBonus?.RESIST) {
            const attacker = players[currentPlayerIdx];
            if (attacker && t.titleBonus.RESIST[attacker.element]) {
                amt += t.titleBonus.RESIST[attacker.element];
                amt = Math.max(amt, 0);
            }
        }
        
        t.hp -= amt; 
        showDmgEffect(t.x, t.y, amt); 
        
        if (gameActive && currentPlayerIdx >= 0 && path.length > 0) {
            const player = players[currentPlayerIdx];
            const element = grid[path[0]];
            
            if (player && element) {
                updateTitleStats('element_damage', amt, element);
                updateTitleStats('class_damage', amt, player.class);
            }
        }
        
        if(t.hp <= 0) { 
            t.hp = 0; 
            t.dead = true; 
            if(mode === "BOSS" || mode === "ARCADE") { 
                if(t === boss) handleBossDefeat(); 
                else if(players.every(p => p.dead)) showEndGame("GAME OVER", false); 
            } else showEndGame(`VITÓRIA DO ${players.find(p => !p.dead).name}`, true); 
            if(t.id !== undefined) document.getElementById(`tokenP${t.id}`).style.display = 'none'; 
        } 
        updateVisuals(); 
        
        if (mode === "BOSS" || mode === "ARCADE") {
            document.getElementById('bossStatsDisplay').innerHTML = `HP: <b>${boss.hp}</b> / ${boss.maxHp}`;
        } else if (t === players[1]) {
            document.getElementById('bossStatsDisplay').innerHTML = `HP: <b>${t.hp}</b> / ${t.maxHp}`;
        }
        
        updateAllSpriteDirections();
    }
    
    function triggerFireColumn(c) { 
        const f = document.createElement('div'); 
        f.className = 'fire-column'; 
        f.style.left = (c * getStep() + 8) + 'px'; 
        f.style.top = '0';
        f.style.height = '100%';
        document.getElementById('board').appendChild(f); 
        setTimeout(() => f.remove(), 1200); 
    }
    
    function triggerFlare(x, y) { 
        const f = document.createElement('div'); 
        f.className = 'flare-fx'; 
        const s = getStep(); 
        f.style.left = (x * s + 8) + 'px'; 
        f.style.top = (y * s + 8) + 'px'; 
        document.getElementById('board').appendChild(f); 
        setTimeout(() => f.remove(), 600); 
    }
    
    function triggerBite(x, y) { 
        const b = document.createElement('img'); 
        b.src = SPRITES.BiteFX; 
        b.className = 'bite-fx'; 
        const s = getStep(); 
        b.style.width = (s * 4) + 'px'; 
        b.style.height = (s * 4) + 'px'; 
        b.style.left = (x * s - s * 1.5 + 8) + 'px'; 
        b.style.top = (y * s - s * 1.5 + 8) + 'px'; 
        b.style.animation = 'biteAnim 0.7s forwards'; 
        document.getElementById('board').appendChild(b); 
        setTimeout(() => b.remove(), 700); 
    }
    
    function triggerRocks(x, y) { 
        const s = getStep(); 
        ['L', 'R'].forEach(d => { 
            const r = document.createElement('img'); 
            r.src = SPRITES.RockFX; 
            r.className = 'rock-projectile'; 
            r.style.width = (s * 2.5) + 'px'; 
            r.style.left = (x * s - s * 0.5) + 'px'; 
            r.style.top = (y * s - s * 0.5) + 'px'; 
            document.getElementById('board').appendChild(r); 
            setTimeout(() => { 
                r.style.left = (d === 'L' ? -400 : 800) + 'px'; 
                r.style.transform = 'rotate(720deg)'; 
                r.style.opacity = '0'; 
            }, 50); 
            setTimeout(() => r.remove(), 1000); 
        }); 
    }
    
    function triggerTsunami() { 
        const t = document.createElement('div'); 
        t.className = 'tsunami-fx'; 
        document.getElementById('board').appendChild(t); 
        setTimeout(() => t.remove(), 1200); 
    }
    
    function triggerVortex(x, y, d = 0, enhanced = false) { 
        setTimeout(() => { 
            const v = document.createElement('img'); 
            v.src = SPRITES.VortexFX; 
            v.className = 'vortex-fx';
            
            if (enhanced) {
                v.style.animation = 'vortexAnimEnhanced 0.3s linear infinite';
                v.style.filter = 'drop-shadow(0 0 12px #3498db) brightness(1.3)';
            }
            
            const s = getStep(); 
            v.style.width = (s * 1.3) + 'px'; 
            v.style.height = (s * 1.3) + 'px'; 
            v.style.left = (x * s + 8) + 'px'; 
            v.style.top = (y * s + 8) + 'px'; 
            
            document.getElementById('board').appendChild(v); 
            
            setTimeout(() => { 
                v.style.opacity = '0'; 
                v.style.transform = 'scale(0.5)'; 
            }, 700); 
            
            setTimeout(() => v.remove(), 1000); 
        }, d); 
    }
    
    function triggerWaterJet(bx, by) { 
        const board = document.getElementById('board');
        const s = getStep();
        const boardSize = s * 8;
        
        const vertical = document.createElement('div');
        vertical.className = 'water-cross-fx';
        vertical.style.width = s + 'px';
        vertical.style.height = boardSize + 'px';
        vertical.style.left = (bx * s + 8) + 'px';
        vertical.style.top = '8px';
        vertical.style.background = 'linear-gradient(0deg, transparent, rgba(255,255,255,0.9), rgba(52,152,219,1), rgba(255,255,255,0.9), transparent)';
        vertical.style.boxShadow = '0 0 20px rgba(52, 152, 219, 0.8)';
        vertical.style.borderRadius = '4px';
        vertical.style.animation = 'waterCrossAnim 0.8s ease-out';
        board.appendChild(vertical);
        
        const horizontal = document.createElement('div');
        horizontal.className = 'water-cross-fx';
        horizontal.style.width = boardSize + 'px';
        horizontal.style.height = s + 'px';
        horizontal.style.top = (by * s + 8) + 'px';
        horizontal.style.left = '8px';
        horizontal.style.background = 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), rgba(52,152,219,1), rgba(255,255,255,0.9), transparent)';
        horizontal.style.boxShadow = '0 0 20px rgba(52, 152, 219, 0.8)';
        horizontal.style.borderRadius = '4px';
        horizontal.style.animation = 'waterCrossAnim 0.8s ease-out';
        board.appendChild(horizontal);
        
        setTimeout(() => {
            if (vertical.parentNode) vertical.parentNode.removeChild(vertical);
            if (horizontal.parentNode) horizontal.parentNode.removeChild(horizontal);
        }, 800);
    }
    
    function getStep() { 
        return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--step')); 
    }
    
    function updateVisuals() { 
        const s = getStep(); 
        players.forEach(p => { 
            const t = document.getElementById(`tokenP${p.id}`); 
            if(t && !p.dead) { 
                t.style.left = (p.x * s + 8) + 'px'; 
                t.style.top = (p.y * s + 8) + 'px'; 
                const h = document.getElementById(`hpBarP${p.id}`); 
                if(h) h.style.width = (p.hp / p.maxHp) * 100 + '%'; 
            } 
        }); 
        if(mode === "BOSS" || mode === "ARCADE") { 
            const bt = document.getElementById('tokenBoss'); 
            if(bt) { 
                bt.style.left = (boss.x * s + 8) + 'px'; 
                bt.style.top = (boss.y * s + 8) + 'px'; 
                const bh = document.getElementById('hpBarBoss'); 
                if(bh) bh.style.width = (boss.hp / boss.maxHp) * 100 + '%'; 
            } 
            document.getElementById('bossStatsDisplay').innerHTML = `HP: <b>${boss.hp}</b> / ${boss.maxHp}`; 
        } else if (players[1]) {
            document.getElementById('bossStatsDisplay').innerHTML = `HP: <b>${players[1].hp}</b> / ${players[1].maxHp}`;
        }
    }
    
    function activateSkill() {
        RANKING.ultimates++;
        updateTitleStats('ultimate_used');
        
        if (!gameActive || players[currentPlayerIdx].skillUsed || arcadeBossTransition) return; 
        skillActive = true; 
        document.querySelectorAll('.tile').forEach(t => t.classList.add('skill-mode')); 
    }
    
    function showDmgEffect(x, y, a){ 
        const s = getStep(), f = document.createElement('div'); 
        f.className = 'dmg-float'; 
        f.innerText = `-${a}`; 
        f.style.left = (x * s + 20) + 'px'; 
        f.style.top = (y * s) + 'px'; 
        document.getElementById('board').appendChild(f); 
        setTimeout(() => f.remove(), 1200); 
    }
    
    function showHealEffect(x, y, a){ 
        const s = getStep(), f = document.createElement('div'); 
        f.className = 'heal-float'; 
        f.innerText = `+${a}`; 
        f.style.left = (x * s + 20) + 'px'; 
        f.style.top = (y * s) + 'px'; 
        document.getElementById('board').appendChild(f); 
        setTimeout(() => f.remove(), 1200); 
    }
    
    function spawnSwordEffect(x, y){ 
        const s = getStep(), i = document.createElement('img'); 
        i.src = SPRITES.SwordFX; 
        i.className = 'sword-fx'; 
        i.style.left = (x * s + 12) + 'px'; 
        i.style.top = (y * s + 12) + 'px'; 
        document.getElementById('board').appendChild(i); 
        setTimeout(() => i.remove(), 400); 
    }
    
    async function spawnProjectile(f, t, type){ 
        const s = getStep(), p = document.createElement('img'); 
        p.src = SPRITES[type + 'FX']; 
        p.className = 'projectile'; 
        p.style.left = (f.x * s + 20) + 'px'; 
        p.style.top = (f.y * s + 20) + 'px'; 
        document.getElementById('board').appendChild(p); 
        
        await sleep(50);
        
        p.style.left = (t.x * s + 20) + 'px'; 
        p.style.top = (t.y * s + 20) + 'px'; 
        
        await sleep(300);
        p.remove(); 
    }
    
    async function spawnArrowProjectile(f, t) {
        const s = getStep();
        const arrow = document.createElement('div');
        arrow.className = 'arrow-fx';
        arrow.style.left = (f.x * s + 20) + 'px';
        arrow.style.top = (f.y * s + 20) + 'px';
        
        const dx = t.x - f.x;
        const dy = t.y - f.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        arrow.style.transform = `rotate(${angle}deg)`;
        
        document.getElementById('board').appendChild(arrow);
        
        await sleep(50);
        
        arrow.style.left = (t.x * s + 20) + 'px';
        arrow.style.top = (t.y * s + 20) + 'px';
        
        await sleep(300);
        arrow.remove();
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ================= INICIALIZAÇÃO =================
    document.addEventListener("DOMContentLoaded", function() {
        showIntro();
        
        loadTitleData();
        checkTitleUnlocks();
    });

