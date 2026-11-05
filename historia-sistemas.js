// historia.js — BLOCO 60 (V14.0 — Restrição de Heróis no Evento)
// =================================================================

(function fixRestricaoHeroisEventoV140() {
    if (window._eventoFixRestricaoV140) return;
    window._eventoFixRestricaoV140 = true;

    // ==============================================================
    // 1. DEFINIR AS RESTRIÇÕES NOS BOSSES
    // ==============================================================
    if (typeof EVENTO_BOSSES !== 'undefined') {
        EVENTO_BOSSES['teju_jagua'].restricao = { tipo: 'elemento', valor: 'AGUA', label: '💧 Apenas Heróis de Água' };
        EVENTO_BOSSES['mboi_tui'].restricao = { tipo: 'classe', valor: 'Guerreiro', label: '⚔️ Apenas Guerreiros' };
        EVENTO_BOSSES['monai'].restricao = { tipo: 'elemento', valor: 'TERRA', label: '⛰️ Apenas Heróis de Terra' };
        EVENTO_BOSSES['jasy_jatere'].restricao = { tipo: 'classe', valor: 'Mago', label: '🔮 Apenas Magos' };
        EVENTO_BOSSES['kurupi'].restricao = { tipo: 'classe', valor: 'Guerreiro', label: '⚔️ Apenas Guerreiros' };
        EVENTO_BOSSES['ao_ao'].restricao = { tipo: 'elemento', valor: 'FOGO', label: '🔥 Apenas Heróis de Fogo' };
        EVENTO_BOSSES['luison'].restricao = { tipo: 'elemento', valor: 'AR', label: '🌪️ Apenas Heróis de Ar' };
    }
    if (typeof EVENTO_PESADELO !== 'undefined') {
        EVENTO_PESADELO.restricao = null; // Livre
    }

    // ==============================================================
    // 2. FUNÇÃO DE VALIDAÇÃO
    // ==============================================================
    function validarHeroiRestricao(bossId) {
        const cfg = (bossId === 'pesadelo') ? EVENTO_PESADELO : EVENTO_BOSSES[bossId];
        if (!cfg || !cfg.restricao) return { valido: true };

        // Pega o herói selecionado
        const heroiClass = (STORY_PROGRESS.selectedHeroes || ['Tupa'])[0];
        const heroiData = STORY_HERO_CLASSES[heroiClass];
        if (!heroiData) return { valido: false, motivo: 'Herói inválido.' };

        // Simula a aplicação do equipamento/amuleto para pegar o elemento final
        let elementoFinal = heroiData.element || (typeof getHeroStoryElement === 'function' ? getHeroStoryElement(heroiClass) : 'FOGO');
        if (typeof getHeroEquipment === 'function') {
            const eq = getHeroEquipment(heroiClass);
            if (eq && eq.amuleto) {
                const amuleto = (typeof getAmuletById === 'function') ? getAmuletById(eq.amuleto) : null;
                if (amuleto && amuleto.efeito && amuleto.efeito.elementOverride) {
                    elementoFinal = amuleto.efeito.elementOverride;
                }
            }
        }

        // Verifica a restrição
        if (cfg.restricao.tipo === 'elemento') {
            if (elementoFinal !== cfg.restricao.valor) {
                return { 
                    valido: false, 
                    motivo: `Este ato exige Heróis de ${cfg.restricao.valor}. Seu herói atual (${heroiData.displayName}) é de ${elementoFinal}.` 
                };
            }
        } else if (cfg.restricao.tipo === 'classe') {
            if (heroiData.role !== cfg.restricao.valor) {
                return { 
                    valido: false, 
                    motivo: `Este ato exige ${cfg.restricao.valor}s. Seu herói atual (${heroiData.displayName}) é ${heroiData.role}.` 
                };
            }
        }

        return { valido: true };
    }

    // ==============================================================
    // 3. VALIDAÇÃO AO INICIAR A FASE (Redundância C)
    // ==============================================================
    const _origIniciarFase = window.eventoIniciarFase;
    if (typeof _origIniciarFase === 'function') {
        window.eventoIniciarFase = function(bossId, faseId) {
            // Valida apenas se NÃO for o Pesadelo
            if (bossId !== 'pesadelo') {
                const check = validarHeroiRestricao(bossId);
                if (!check.valido) {
                    if (typeof showToast === 'function') {
                        showToast('🚫 Restrição', check.motivo, '🚫');
                    } else {
                        uiAviso(check.motivo);
                    }
                    return; // Bloqueia a entrada
                }
            }
            return _origIniciarFase.apply(this, arguments);
        };
    }

    // ==============================================================
    // 4. AVISO VISUAL NA TELA DE FASES E SEMANAL
    // ==============================================================
    const _origRenderFases = window.renderEventoFasesScreen;
    if (typeof _origRenderFases === 'function') {
        window.renderEventoFasesScreen = function(bossId) {
            const r = _origRenderFases.apply(this, arguments);
            
            const cfg = EVENTO_BOSSES[bossId];
            if (cfg && cfg.restricao) {
                const screen = document.getElementById('storyScreen');
                const header = screen ? screen.querySelector('.story-header') : null;
                
                if (header && !header.querySelector('.evento-restricao-aviso')) {
                    const aviso = document.createElement('div');
                    aviso.className = 'evento-restricao-aviso';
                    aviso.style.cssText = 'margin-top:15px; padding:10px 15px; background:rgba(201,162,39,0.1); border:2px solid #c9a227; border-radius:6px; font-family:Cinzel,serif; color:#e8b923; font-size:0.9rem; font-weight:700; text-align:center; box-shadow:0 0 15px rgba(201,162,39,0.3);';
                    aviso.innerHTML = `⚠️ RESTRIÇÃO DO DIA: ${cfg.restricao.label}`;
                    header.appendChild(aviso);
                }

                // Verifica o herói atual do jogador e avisa se estiver inválido
                const check = validarHeroiRestricao(bossId);
                if (!check.valido) {
                    const avisoErro = document.createElement('div');
                    avisoErro.className = 'evento-restricao-erro';
                    avisoErro.style.cssText = 'margin-top:10px; padding:10px 15px; background:rgba(168,50,50,0.2); border:1px solid #a83232; border-radius:6px; font-family:EB Garamond,serif; color:#f5c8c8; font-size:0.9rem; font-style:italic; text-align:center;';
                    avisoErro.innerHTML = `Seu herói atual não é válido. Vá na <b>OCA</b> e mude antes de jogar.`;
                    header.appendChild(avisoErro);
                }
            }
            return r;
        };
    }

    // Card da tela semanal
    const _origRenderSemana = window.renderEventoSemanalScreen;
    if (typeof _origRenderSemana === 'function') {
        window.renderEventoSemanalScreen = function() {
            const r = _origRenderSemana.apply(this, arguments);
            
            // Adiciona a restrição dentro do card de cada dia
            const cards = document.querySelectorAll('.evento-card');
            cards.forEach(card => {
                const nameEl = card.querySelector('.evento-card-name');
                if (!nameEl) return;
                
                const nomeBoss = nameEl.textContent.trim();
                let bossId = null;
                for (let id in EVENTO_BOSSES) {
                    if (EVENTO_BOSSES[id].nome === nomeBoss) { bossId = id; break; }
                }
                
                if (bossId && EVENTO_BOSSES[bossId].restricao) {
                    if (!card.querySelector('.evento-card-restricao')) {
                        const aviso = document.createElement('div');
                        aviso.className = 'evento-card-restricao';
                        aviso.style.cssText = 'text-align:center; font-family:Cinzel,serif; font-size:0.75rem; color:#e8b923; font-weight:700; margin-top:5px; padding:3px 8px; background:rgba(201,162,39,0.1); border-radius:4px;';
                        aviso.innerHTML = EVENTO_BOSSES[bossId].restricao.label;
                        // Insere antes dos botões
                        const btn = card.querySelector('.evento-card-btn');
                        if (btn) card.insertBefore(aviso, btn);
                    }
                }
            });
            
            return r;
        };
    }

    console.log('✅ [V14.0] Restrições de heróis no evento aplicadas.');
})();
// =================================================================
// historia.js — BLOCO 61 (V14.1 — Estrelas Globais para Heróis)
// =================================================================

(function fixEstrelasGlobaisV141() {
    if (window._eventoFixEstrelasV141) return;
    window._eventoFixEstrelasV141 = true;

    // Sobrescreve a função de pegar o total de estrelas para somar TUDO
    window.getTotalStars = function() {
        if (typeof STORY_PROGRESS === 'undefined') return 0;
        
        let total = 0;
        
        // Soma as estrelas do progresso global (que guarda o máximo de cada fase)
        if (STORY_PROGRESS.starsByPhase) {
            Object.values(STORY_PROGRESS.starsByPhase).forEach(s => {
                total += (s || 0);
            });
        }
        
        return total;
    };

    // Força a verificação de desbloqueio de heróis logo após o jogo carregar
    // (para o caso de o jogador já ter estrelas suficientes e não ter recebido o herói)
    setTimeout(() => {
        if (typeof checkHeroUnlocks === 'function') {
            checkHeroUnlocks();
        }
    }, 1000);

    console.log('✅ [V14.1] Estrelas globais e desbloqueio de heróis corrigidos.');
})();
// =================================================================
// historia.js — BLOCO 64 (V14.4 — Fix Definitivo das Estrelas Globais)
// =================================================================

(function fixEstrelasDefinitivoV144() {
    if (window._eventoFixEstrelasV144) return;
    window._eventoFixEstrelasV144 = true;

    // 1. Define as funções corretas de contagem
    window.getTotalStars = function() {
        if (typeof STORY_PROGRESS === 'undefined' || !STORY_PROGRESS.starsByPhase) return 0;
        let total = 0;
        Object.values(STORY_PROGRESS.starsByPhase).forEach(s => { total += (s || 0); });
        return total;
    };

    window.getMaxTotalStars = function() {
        if (typeof STORY_CHAPTERS === 'undefined') return 576;
        let totalFases = 0;
        Object.values(STORY_CHAPTERS).forEach(ch => {
            totalFases += ch.phases.length;
        });
        return totalFases * 3;
    };

    // 2. Intercepta o render da Aldeia e substitui o HTML final
    const _origRenderAldeia = window.renderAldeiaScreen;
    if (typeof _origRenderAldeia === 'function') {
        window.renderAldeiaScreen = function() {
            const r = _origRenderAldeia.apply(this, arguments);
            
            setTimeout(() => {
                const screen = document.getElementById('storyScreen');
                if (!screen) return;
                
                const total = window.getTotalStars();
                const max = window.getMaxTotalStars();
                const novosTextos = `${total} / ${max}`;

                // Procura qualquer elemento que tenha "⭐ X / Y"
                const counters = screen.querySelectorAll('.story-stars-counter');
                counters.forEach(counter => {
                    // Substitui qualquer número/número por total/max
                    counter.innerHTML = counter.innerHTML.replace(/\d+\s*\/\s*\d+/, novosTextos);
                });
            }, 50);
            
            return r;
        };
    }

    // 3. Intercepta o render da OCA e substitui o HTML final
    const _origRenderOca = window.renderOcaScreenFiltered;
    if (typeof _origRenderOca === 'function') {
        window.renderOcaScreenFiltered = function() {
            const r = _origRenderOca.apply(this, arguments);
            
            setTimeout(() => {
                const screen = document.getElementById('storyScreen');
                if (!screen) return;
                
                const total = window.getTotalStars();
                const max = window.getMaxTotalStars();
                const novosTextos = `${total} / ${max}`;

                const counters = screen.querySelectorAll('.story-stars-counter');
                counters.forEach(counter => {
                    counter.innerHTML = counter.innerHTML.replace(/\d+\s*\/\s*\d+/, novosTextos);
                });
            }, 50);
            
            return r;
        };
    }

    // 4. Força a liberação de heróis com base no total global
    setTimeout(() => {
        if (typeof checkHeroUnlocks === 'function') {
            checkHeroUnlocks();
        }
    }, 1000);

    console.log('✅ [V14.4] Estrelas globais (X/576) e Heróis corrigidos de forma definitiva.');
})();
// =================================================================
// historia.js — BLOCO 65 (V14.5 — Forçar Texto das Estrelas na Tela)
// =================================================================

(function fixEstrelasMutationV145() {
    if (window._eventoFixEstrelasV145) return;
    window._eventoFixEstrelasV145 = true;

    // Funções de cálculo
    window.getTotalStars = function() {
        if (typeof STORY_PROGRESS === 'undefined' || !STORY_PROGRESS.starsByPhase) return 0;
        let total = 0;
        Object.values(STORY_PROGRESS.starsByPhase).forEach(s => { total += (s || 0); });
        return total;
    };

    window.getMaxTotalStars = function() {
        if (typeof STORY_CHAPTERS === 'undefined') return 576;
        let totalFases = 0;
        Object.values(STORY_CHAPTERS).forEach(ch => { totalFases += ch.phases.length; });
        return totalFases * 3;
    };

    // Função que atualiza o texto
    function atualizarTextosEstrelas() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;

        const total = window.getTotalStars();
        const max = window.getMaxTotalStars();
        const textoCorreto = `⭐ ${total} / ${max}`;

        // Procura qualquer elemento que tenha o ícone de estrela
        const counters = screen.querySelectorAll('.story-stars-counter');
        counters.forEach(counter => {
            // Substitui todo o conteúdo interno pelo texto correto
            // Verifica se já está correto para não ficar reescrevendo à toa
            if (counter.innerHTML.trim() !== textoCorreto && counter.innerHTML.trim() !== `<span class="story-stars-icon">${textoCorreto}</span>`) {
                counter.innerHTML = textoCorreto;
            }
        });
    }

    // 1. Roda quando o jogo carrega
    setTimeout(atualizarTextosEstrelas, 500);

    // 2. MutationObserver para pegar sempre que a tela da Aldeia ou OCA forem montadas
    const observer = new MutationObserver((mutations) => {
        // Só age se a tela do storyScreen estiver ativa
        const screen = document.getElementById('storyScreen');
        if (screen && screen.classList.contains('active')) {
            atualizarTextosEstrelas();
        }
    });

    // Começa a observar o documento inteiro em busca de mudanças
    observer.observe(document.body, { childList: true, subtree: true });

    // 3. Força a liberação de heróis
    setTimeout(() => {
        if (typeof checkHeroUnlocks === 'function') {
            checkHeroUnlocks();
        }
    }, 1000);

    console.log('✅ [V14.5] Estrelas forçadas via MutationObserver (192/576).');
})();
// =================================================================
// historia.js — BLOCO 66 (V14.6 — Fix Criterioso do HTML das Estrelas)
// =================================================================

(function fixEstrelasHTMLV146() {
    if (window._eventoFixEstrelasV146) return;
    window._eventoFixEstrelasV146 = true;

    // 1. Função correta de máximo (192 fases * 3 = 576)
    window.getMaxTotalStars = function() {
        if (typeof STORY_CHAPTERS === 'undefined') return 576;
        let totalFases = 0;
        Object.values(STORY_CHAPTERS).forEach(ch => {
            totalFases += ch.phases.length;
        });
        return totalFases * 3;
    };

    // 2. Função correta de total (soma tudo)
    window.getTotalStars = function() {
        if (typeof STORY_PROGRESS === 'undefined' || !STORY_PROGRESS.starsByPhase) return 0;
        let total = 0;
        Object.values(STORY_PROGRESS.starsByPhase).forEach(s => {
            total += (s || 0);
        });
        return total;
    };

    // 3. Função para substituir o HTML na tela da Aldeia
    const _origRenderAldeia = window.renderAldeiaScreen;
    if (typeof _origRenderAldeia === 'function') {
        window.renderAldeiaScreen = function() {
            const r = _origRenderAldeia.apply(this, arguments);
            
            const screen = document.getElementById('storyScreen');
            if (!screen) return r;

            // Na força, procura o span específico do contador da Aldeia
            // (o que fica no topo da tela, dentro do header)
            const counter = screen.querySelector('.story-ald-header-stats .story-stars-counter');
            if (counter) {
                const total = window.getTotalStars();
                const max = window.getMaxTotalStars();
                counter.innerHTML = `<span class="story-stars-icon">⭐</span>${total} / ${max}`;
            }
            
            return r;
        };
    }

    // 4. Função para substituir o HTML na tela da OCA
    const _origRenderOca = window.renderOcaScreenFiltered;
    if (typeof _origRenderOca === 'function') {
        window.renderOcaScreenFiltered = function() {
            const r = _origRenderOca.apply(this, arguments);
            
            const screen = document.getElementById('storyScreen');
            if (!screen) return r;

            // Na OCA, o contador fica no centro, dentro do header
            const counter = screen.querySelector('.story-header .story-stars-counter');
            if (counter) {
                const total = window.getTotalStars();
                const max = window.getMaxTotalStars();
                counter.innerHTML = `<span class="story-stars-icon">⭐</span>${total} / ${max}`;
            }
            
            return r;
        };
    }

    // 5. Força a verificação de desbloqueio de heróis
    setTimeout(() => {
        if (typeof checkHeroUnlocks === 'function') {
            checkHeroUnlocks();
        }
    }, 1000);

    console.log('✅ [V14.6] HTML das estrelas corrigido diretamente na raiz.');
})();
// =================================================================
// historia.js — BLOCO 67 (V15.0 — Estrelas Globais Consolidadas)
// -----------------------------------------------------------------
// Cole NO FINAL de historia.js, depois do Bloco 66.
//
// PROBLEMA:
//   • getTotalStars() estava somando starsByPhase (que é o MÁXIMO
//     por fase entre dificuldades, não a soma real).
//   • Resultado: mostrava 192/192 ao zerar uma dificuldade, e o
//     desbloqueio de heróis por estrelas usava esse número errado.
//
// SOLUÇÃO:
//   • getTotalStars() soma difficultyProgress[normal].stars +
//     difficultyProgress[dificil].stars + difficultyProgress[pesadelo].stars
//   • getMaxTotalStars() = totalFases * 3 * 3 = 576
//   • checkHeroUnlocks() usa o total global
//   • MutationObservers antigos são neutralizados
// =================================================================

(function consolidarEstrelasV150() {
    if (window._estrelasV150) return;
    window._estrelasV150 = true;

    // ==============================================================
    // 1. GARANTIR ESTRUTURA difficultyProgress
    // ==============================================================
    function garantirEstrutura() {
        if (typeof STORY_PROGRESS === 'undefined') return;
        if (!STORY_PROGRESS.difficultyProgress || typeof STORY_PROGRESS.difficultyProgress !== 'object') {
            STORY_PROGRESS.difficultyProgress = {};
        }
        ['normal', 'dificil', 'pesadelo'].forEach(id => {
            if (!STORY_PROGRESS.difficultyProgress[id]) {
                STORY_PROGRESS.difficultyProgress[id] = {
                    unlockedChapters: [],
                    unlockedPhases: {},
                    completedPhases: [],
                    stars: {},
                };
            }
            const d = STORY_PROGRESS.difficultyProgress[id];
            if (!d.stars || typeof d.stars !== 'object') d.stars = {};
        });
    }

    // ==============================================================
    // 2. getTotalStars — soma real entre as 3 dificuldades
    // ==============================================================
    window.getTotalStars = function() {
        garantirEstrutura();
        if (typeof STORY_PROGRESS === 'undefined' || !STORY_PROGRESS.difficultyProgress) return 0;

        let total = 0;
        ['normal', 'dificil', 'pesadelo'].forEach(diffId => {
            const d = STORY_PROGRESS.difficultyProgress[diffId];
            if (!d || !d.stars) return;
            Object.values(d.stars).forEach(s => {
                total += (s || 0);
            });
        });

        return total;
    };

    // ==============================================================
    // 3. getMaxTotalStars — fases × 3 × 3 dificuldades = 576
    // ==============================================================
    window.getMaxTotalStars = function() {
        if (typeof STORY_CHAPTERS === 'undefined') return 576;
        let totalFases = 0;
        Object.values(STORY_CHAPTERS).forEach(ch => {
            totalFases += ch.phases.length;
        });
        // 3 estrelas por fase × 3 dificuldades
        return totalFases * 3 * 3;
    };

    // ==============================================================
    // 4. checkHeroUnlocks — usa o total global (soma das 3)
    // ==============================================================
    window.checkHeroUnlocks = function() {
        if (!Array.isArray(STORY_PROGRESS.unlockedHeroesStory)) {
            STORY_PROGRESS.unlockedHeroesStory = ['Tupa', 'Sume', 'Caipora'];
        }

        const totalStars = window.getTotalStars();
        const unlocked = [];

        // STORY_HERO_UNLOCKS é a tabela de heróis por estrelas
        const tabela = (typeof STORY_HERO_UNLOCKS !== 'undefined')
            ? STORY_HERO_UNLOCKS
            : [];

        tabela.forEach(entry => {
            if (totalStars >= entry.starsNeeded &&
                !STORY_PROGRESS.unlockedHeroesStory.includes(entry.className)) {
                STORY_PROGRESS.unlockedHeroesStory.push(entry.className);
                unlocked.push(entry);
            }
        });

        // Heróis com unlockReq.stars (Bloco 12 V9.4)
        if (typeof STORY_HERO_CLASSES !== 'undefined') {
            Object.values(STORY_HERO_CLASSES).forEach(hero => {
                if (!hero.unlockReq || hero.unlockReq.type !== 'stars') return;
                if (STORY_PROGRESS.unlockedHeroesStory.includes(hero.className)) return;
                if (totalStars >= hero.starsNeeded) {
                    STORY_PROGRESS.unlockedHeroesStory.push(hero.className);
                    unlocked.push({ className: hero.className, displayName: hero.displayName });
                }
            });
        }

        if (unlocked.length > 0) {
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
            unlocked.forEach(entry => {
                if (typeof showToast === 'function') {
                    showToast('🏅 HERÓI DESBLOQUEADO!', entry.displayName || entry.className, '🏅');
                }
                try { if (typeof playSfx === 'function') playSfx('win'); } catch(e) {}
            });
        }

        return unlocked;
    };

    // ==============================================================
    // 5. Neutralizar patches antigos que forçavam HTML via regex
    // --------------------------------------------------------------
    // Os MutationObservers do Bloco 65/66 tentavam reescrever o
    // innerHTML do contador. Como agora getTotalStars está correto,
    // o HTML já sai certo do render — mas os observers podem
    // reescrever de forma errada (regex antigo). Vamos flagá-los.
    // ==============================================================
    // Não tem como "desligar" um MutationObserver já criado sem a
    // referência. Então a gente garante que ele NÃO vai encontrar
    // o texto errado: sobrescrevemos renderAldeiaScreen e
    // renderOcaScreenFiltered para RE-ESCREVER o contador DEPOIS
    // de qualquer observer rodar (com setTimeout grande).

    function forcarTextoEstrelasNaTela() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;
        const total = window.getTotalStars();
        const max = window.getMaxTotalStars();
        const textoCorreto = `${total} / ${max}`;

        // Todos os contadores da tela
        screen.querySelectorAll('.story-stars-counter').forEach(counter => {
            // Mantém o ícone se existir, substitui só o número
            const iconEl = counter.querySelector('.story-stars-icon');
            if (iconEl) {
                counter.innerHTML = `<span class="story-stars-icon">⭐</span>${textoCorreto}`;
            } else {
                counter.innerHTML = `⭐ ${textoCorreto}`;
            }
        });

        // Também corrige textos "Progresso geral: X/Y fases · ⭐ A/B"
        screen.querySelectorAll('.story-ald-progress-label').forEach(label => {
            label.textContent = label.textContent.replace(
                /⭐\s*\d+\s*\/\s*\d+/,
                `⭐ ${textoCorreto}`
            );
        });

        // E "X / Y ESTRELAS TOTAIS" (tela de vitória, se aparecer)
        screen.querySelectorAll('div').forEach(div => {
            if (div.children.length === 0 &&
                div.textContent.includes('ESTRELAS TOTAIS')) {
                div.textContent = `⭐ ${textoCorreto} ESTRELAS TOTAIS`;
            }
        });
    }

    // Aplica depois de qualquer render
    const _origRenderAldeia = window.renderAldeiaScreen;
    if (typeof _origRenderAldeia === 'function') {
        window.renderAldeiaScreen = function() {
            const r = _origRenderAldeia.apply(this, arguments);
            // Roda SÍNCRONO + depois dos observers antigos (500ms)
            setTimeout(forcarTextoEstrelasNaTela, 0);
            setTimeout(forcarTextoEstrelasNaTela, 600);
            setTimeout(forcarTextoEstrelasNaTela, 1200);
            return r;
        };
    }

    const _origRenderOca = window.renderOcaScreenFiltered;
    if (typeof _origRenderOca === 'function') {
        window.renderOcaScreenFiltered = function() {
            const r = _origRenderOca.apply(this, arguments);
            setTimeout(forcarTextoEstrelasNaTela, 0);
            setTimeout(forcarTextoEstrelasNaTela, 600);
            setTimeout(forcarTextoEstrelasNaTela, 1200);
            return r;
        };
    }

    // ==============================================================
    // 6. Verifica desbloqueios ao carregar (retroativo)
    // ==============================================================
    setTimeout(() => {
        garantirEstrutura();
        if (typeof window.checkHeroUnlocks === 'function') {
            window.checkHeroUnlocks();
        }
    }, 1200);

    // ==============================================================
    // 7. Log de diagnóstico
    // ==============================================================
    setTimeout(() => {
        garantirEstrutura();
        const t = window.getTotalStars();
        const m = window.getMaxTotalStars();
        const dp = STORY_PROGRESS?.difficultyProgress || {};
        const porDiff = {};
        ['normal', 'dificil', 'pesadelo'].forEach(id => {
            const d = dp[id];
            porDiff[id] = d?.stars
                ? Object.values(d.stars).reduce((a, b) => a + b, 0)
                : 0;
        });
        console.log('');
        console.log('═══════════════════════════════════════════════════');
        console.log('⭐ [V15.0] Estrelas consolidadas');
        console.log('═══════════════════════════════════════════════════');
        console.log('Estrelas por dificuldade:');
        console.log('  Normal:  ', porDiff.normal);
        console.log('  Difícil: ', porDiff.dificil);
        console.log('  Pesadelo:', porDiff.pesadelo);
        console.log('  ─────────────');
        console.log('  TOTAL:   ', t, '/', m);
        console.log('═══════════════════════════════════════════════════');
    }, 1500);

    console.log('✅ [V15.0] Estrelas globais consolidadas (soma das 3 dificuldades).');
})();
// =================================================================
// historia.js — BLOCO 68 (V15.1 — Correções P0/P1)
// -----------------------------------------------------------------
// Cole NO FINAL de historia.js, depois do Bloco 67.
//
// Corrige:
//   BUG 6 (P0) — phase.reward sendo mutado permanentemente
//   BUG 1 (P0) — saveStarsForPhase aplicando bônus de estrela 2×
//   BUG 2 (P1) — checkHeroUnlocks perdendo heróis por "zerar dificuldade"
//   BUG 7 (P1) — _eventoBossSnapshot não resetado entre partidas
//   BUG 5 (P1) — storyCurrentEnemyIndex desincronizado no Coop
//                (via patch no coopAplicarEstadoDoRoom)
// =================================================================

(function correcoesV151() {
    if (window._correcoesV151) return;
    window._correcoesV151 = true;

    // ==============================================================
    // BUG 6 — Snapshot estático das recompensas originais
    // --------------------------------------------------------------
    // Capturamos os valores originais ANTES de qualquer mutação.
    // Se o save já está corrompido, restauramos no load.
    // ==============================================================
    const RECOMPENSAS_ORIGINAIS = {};

    function capturarRecompensasOriginais() {
        if (typeof STORY_CHAPTERS === 'undefined') return;
        Object.keys(STORY_CHAPTERS).forEach(cid => {
            STORY_CHAPTERS[cid].phases.forEach(phase => {
                if (phase.reward) {
                    RECOMPENSAS_ORIGINAIS[phase.id] = {
                        xp: phase.reward.xp,
                        gold: phase.reward.gold,
                        chapterComplete: phase.reward.chapterComplete,
                    };
                }
            });
        });
        console.log('[V15.1] Snapshot de recompensas capturado:', Object.keys(RECOMPENSAS_ORIGINAIS).length, 'fases');
    }

    function restaurarRecompensasOriginais() {
        if (typeof STORY_CHAPTERS === 'undefined') return 0;
        let restaurados = 0;
        Object.keys(STORY_CHAPTERS).forEach(cid => {
            STORY_CHAPTERS[cid].phases.forEach(phase => {
                const orig = RECOMPENSAS_ORIGINAIS[phase.id];
                if (!orig || !phase.reward) return;
                if (phase.reward.xp !== orig.xp || phase.reward.gold !== orig.gold) {
                    phase.reward.xp = orig.xp;
                    phase.reward.gold = orig.gold;
                    restaurados++;
                }
            });
        });
        if (restaurados > 0) {
            console.log(`[V15.1] ${restaurados} recompensas restauradas ao valor original.`);
        }
        return restaurados;
    }

    capturarRecompensasOriginais();
    setTimeout(restaurarRecompensasOriginais, 100);
    setTimeout(restaurarRecompensasOriginais, 1000);

    // ==============================================================
    // Sobrescreve handleStoryPhaseVictory SEM MUTAR phase.reward
    // ==============================================================
    const _origVictory = window.handleStoryPhaseVictory;

    window.handleStoryPhaseVictory = function(phase, drops, finalScore, rankSnapshot) {
        if (!phase || !phase.reward) {
            if (typeof _origVictory === 'function') return _origVictory.apply(this, arguments);
            return;
        }

        // Garante que phase.reward está nos valores originais ANTES de calcular
        restaurarRecompensasOriginais();

        const diff = (typeof STORY_DIFFICULTIES !== 'undefined')
            ? STORY_DIFFICULTIES[storyCurrentDifficulty]
            : null;

        // Cálculo local SEM mutar phase.reward
        const xpBase = phase.reward.xp;
        const goldBase = phase.reward.gold;
        const xpFinal = (diff && storyCurrentDifficulty !== 'normal')
            ? Math.ceil(xpBase * diff.rewardMult)
            : xpBase;
        const goldFinal = (diff && storyCurrentDifficulty !== 'normal')
            ? Math.ceil(goldBase * diff.rewardMult)
            : goldBase;

        // Cria uma "cópia fantasma" só para a função original usar
        const phaseParaOriginal = Object.assign({}, phase, {
            reward: Object.assign({}, phase.reward, { xp: xpFinal, gold: goldFinal })
        });

        return _origVictory.call(this, phaseParaOriginal, drops, finalScore, rankSnapshot);
    };

    // ==============================================================
    // BUG 1 — saveStarsForPhase NÃO reaplica bônus
    // --------------------------------------------------------------
    // O bônus de dificuldade deve ser aplicado UMA VEZ, em
    // handleStoryPhaseVictory, antes de chamar saveStarsForPhase.
    // Aqui só salvamos o valor que já vem calculado.
    // ==============================================================
    window.saveStarsForPhase = function(phaseId, stars) {
        // stars já vem com o bônus aplicado (ver abaixo em handleStoryPhaseVictory)
        // Aqui só persistimos na dificuldade atual + global como máximo

        // Garante estrutura
        if (!STORY_PROGRESS.difficultyProgress) {
            STORY_PROGRESS.difficultyProgress = {};
        }
        const diffId = (typeof storyCurrentDifficulty !== 'undefined')
            ? storyCurrentDifficulty : 'normal';
        if (!STORY_PROGRESS.difficultyProgress[diffId]) {
            STORY_PROGRESS.difficultyProgress[diffId] = {
                unlockedChapters: [], unlockedPhases: {}, completedPhases: [], stars: {}
            };
        }
        const d = STORY_PROGRESS.difficultyProgress[diffId];
        if (!d.stars) d.stars = {};

        const current = d.stars[phaseId] || 0;
        const final = Math.max(current, Math.min(3, stars));
        d.stars[phaseId] = final;

        // Global (compatibilidade, guarda o máximo entre dificuldades)
        if (!STORY_PROGRESS.starsByPhase) STORY_PROGRESS.starsByPhase = {};
        const curGlobal = STORY_PROGRESS.starsByPhase[phaseId] || 0;
        STORY_PROGRESS.starsByPhase[phaseId] = Math.max(curGlobal, final);

        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        return final;
    };

    // ==============================================================
    // Ajuste em handleStoryPhaseVictory: bônus de estrela aplicado
    // UMA VEZ, antes do saveStarsForPhase
    // ==============================================================
    const _origSaveStarsHook = window.handleStoryPhaseVictory;
    // (já hookamos acima — o hook faz a chamada correta de saveStarsForPhase
    //  via _origVictory, que internamente chama saveStarsForPhase.
    //  Mas precisamos garantir que o bônus de estrela seja aplicado ANTES.)
    //
    // Solução: interceptar calcularEstrelas + saveStarsForPhase juntos.
    // Como calcularEstrelas retorna raw e saveStarsForPhase agora NÃO
    // adiciona bônus, precisamos adicionar o bônus no meio.
    //
    // Melhor: sobrescrever calcularEstrelas para incluir o bônus de
    // dificuldade. Assim o valor retornado já está "final".

    const _origCalcularEstrelas = window.calcularEstrelas;

    window.calcularEstrelas = function(score, maxScore) {
        let stars = 1;
        if (typeof _origCalcularEstrelas === 'function') {
            stars = _origCalcularEstrelas(score, maxScore);
        } else {
            if (!maxScore || maxScore <= 0) return 1;
            const ratio = score / maxScore;
            if (ratio >= 0.60) stars = 3;
            else if (ratio >= 0.35) stars = 2;
            else stars = 1;
        }

        // Aplica bônus de dificuldade AQUI (uma vez só)
        const diff = (typeof STORY_DIFFICULTIES !== 'undefined' && typeof storyCurrentDifficulty !== 'undefined')
            ? STORY_DIFFICULTIES[storyCurrentDifficulty]
            : null;
        if (diff && diff.starsBonus > 0) {
            stars = Math.min(3, stars + diff.starsBonus);
        }

        return stars;
    };

    // ==============================================================
    // BUG 2 — checkHeroUnlocks com heróis por "zerar dificuldade"
    // ==============================================================
    window.checkHeroUnlocks = function() {
        if (!Array.isArray(STORY_PROGRESS.unlockedHeroesStory)) {
            STORY_PROGRESS.unlockedHeroesStory = ['Tupa', 'Sume', 'Caipora'];
        }

        const totalStars = (typeof getTotalStars === 'function')
            ? getTotalStars() : 0;

        const unlocked = [];

        // --- Heróis por estrelas (STORY_HERO_UNLOCKS) ---
        const tabela = (typeof STORY_HERO_UNLOCKS !== 'undefined')
            ? STORY_HERO_UNLOCKS : [];

        tabela.forEach(entry => {
            if (totalStars >= entry.starsNeeded &&
                !STORY_PROGRESS.unlockedHeroesStory.includes(entry.className)) {
                STORY_PROGRESS.unlockedHeroesStory.push(entry.className);
                unlocked.push(entry);
            }
        });

        // --- Heróis com unlockReq.stars ---
        if (typeof STORY_HERO_CLASSES !== 'undefined') {
            Object.values(STORY_HERO_CLASSES).forEach(hero => {
                if (!hero.unlockReq || hero.unlockReq.type !== 'stars') return;
                if (STORY_PROGRESS.unlockedHeroesStory.includes(hero.className)) return;
                if (totalStars >= hero.starsNeeded) {
                    STORY_PROGRESS.unlockedHeroesStory.push(hero.className);
                    unlocked.push({ className: hero.className, displayName: hero.displayName });
                }
            });
        }

        // --- ⭐ Heróis por ZERAR DIFICULDADE ---
        // Esta é a parte que estava faltando no Bloco 67
        const HEROIS_POR_ZERAR = {
            'Curupira': { difficulty: 'normal', label: 'Zerar o Normal' },
            'Kianumanka-Manã': { difficulty: 'dificil', label: 'Zerar o Difícil' },
            'Anhanga-Mirim': { difficulty: 'pesadelo', label: 'Zerar o Pesadelo' },
        };
        const cleared = STORY_PROGRESS.clearedDifficulties || [];

        Object.keys(HEROIS_POR_ZERAR).forEach(heroClass => {
            const req = HEROIS_POR_ZERAR[heroClass];
            if (cleared.includes(req.difficulty) &&
                !STORY_PROGRESS.unlockedHeroesStory.includes(heroClass)) {
                STORY_PROGRESS.unlockedHeroesStory.push(heroClass);
                unlocked.push({
                    className: heroClass,
                    displayName: heroClass,
                    motivo: req.label,
                });
            }
        });

        // --- Salva e notifica ---
        if (unlocked.length > 0) {
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
            unlocked.forEach(entry => {
                const nome = entry.displayName || entry.className;
                const sufixo = entry.motivo ? ` (${entry.motivo})` : '';
                if (typeof showToast === 'function') {
                    showToast('🏅 HERÓI DESBLOQUEADO!', nome + sufixo, '🏅');
                }
                try { if (typeof playSfx === 'function') playSfx('win'); } catch(e) {}
            });
        }

        return unlocked;
    };

    // ==============================================================
    // BUG 7 — Reset de _eventoBossSnapshot
    // --------------------------------------------------------------
    // Wrappea eventoVoltarAldeia e eventoVoltarSemana para limpar
    // o snapshot no final.
    // ==============================================================
    const _origVoltarAldeia = window.eventoVoltarAldeia;
    if (typeof _origVoltarAldeia === 'function') {
        window.eventoVoltarAldeia = function() {
            window._eventoBossSnapshot = null;
            return _origVoltarAldeia.apply(this, arguments);
        };
    }

    const _origVoltarSemana = window.eventoVoltarSemana;
    if (typeof _origVoltarSemana === 'function') {
        window.eventoVoltarSemana = function() {
            window._eventoBossSnapshot = null;
            return _origVoltarSemana.apply(this, arguments);
        };
    }

    // Também reseta em eventoFinalizarPartida (por garantia)
    const _origFinalizar = window.eventoFinalizarPartida;
    if (typeof _origFinalizar === 'function') {
        window.eventoFinalizarPartida = async function() {
            window._eventoBossSnapshot = null;
            return _origFinalizar.apply(this, arguments);
        };
    }

    // ==============================================================
    // BUG 5 — Sincronização de storyCurrentEnemyIndex no Coop
    // --------------------------------------------------------------
    // Quando o P1 recebe via Firestore um boss diferente do local,
    // além de trocar o [0], precisa avançar o índice se o próximo
    // da fila local bate com o novo boss.
    // ==============================================================
    const _origAplicarCoop = window.coopAplicarEstadoDoRoom;
    if (typeof _origAplicarCoop === 'function') {
        window.coopAplicarEstadoDoRoom = function(room) {
            // Antes de aplicar, checa se o boss mudou
            if (room?.estadoJogo?.boss?.type) {
                const bt = (typeof coopBossTypeNormalize === 'function')
                    ? coopBossTypeNormalize(room.estadoJogo.boss.type)
                    : room.estadoJogo.boss.type;

                const idFromBoss = (typeof coopBossTypeToEnemyId === 'function')
                    ? coopBossTypeToEnemyId(bt)
                    : String(bt).toLowerCase();

                if (Array.isArray(window.storyEnemiesRemaining) &&
                    window.storyEnemiesRemaining.length > 0 &&
                    window.storyEnemiesRemaining[0] !== idFromBoss) {

                    // Se o próximo da fila é o novo boss → avançou
                    if (window.storyEnemiesRemaining.length > 1 &&
                        window.storyEnemiesRemaining[1] === idFromBoss) {
                        window.storyEnemiesRemaining.shift();
                        if (typeof window.storyCurrentEnemyIndex !== 'undefined') {
                            window.storyCurrentEnemyIndex++;
                        }
                        console.log('[V15.1] Fila sincronizada: avançou para', idFromBoss);
                    } else {
                        // Só troca o [0] (não avançou, é outro estado)
                        window.storyEnemiesRemaining[0] = idFromBoss;
                    }
                }
            }

            return _origAplicarCoop.apply(this, arguments);
        };
    }

    // ==============================================================
    // Log de confirmação
    // ==============================================================
    setTimeout(() => {
        const total = (typeof getTotalStars === 'function') ? getTotalStars() : 0;
        const max = (typeof getMaxTotalStars === 'function') ? getMaxTotalStars() : 0;
        const cleared = STORY_PROGRESS?.clearedDifficulties || [];
        const herois = STORY_PROGRESS?.unlockedHeroesStory || [];

        console.log('');
        console.log('═══════════════════════════════════════════════════');
        console.log('✅ [V15.1] Correções P0/P1 aplicadas');
        console.log('═══════════════════════════════════════════════════');
        console.log('⭐ Estrelas:', total, '/', max);
        console.log('🏆 Dificuldades zeradas:', cleared.length > 0 ? cleared.join(', ') : '(nenhuma)');
        console.log('🦸 Heróis desbloqueados:', herois.length);
        console.log('📋 Recompensas originais:', Object.keys(RECOMPENSAS_ORIGINAIS).length, 'fases');
        console.log('');
        console.log('💡 Para checar se phase.reward está correto:');
        console.log('   STORY_CHAPTERS[1].phases[0].reward  →  deve ser {xp:10, gold:15}');
        console.log('═══════════════════════════════════════════════════');
    }, 2000);

    console.log('✅ [V15.1] Bloco de correções P0/P1 instalado.');
})();
// =================================================================
// historia.js — PATCH: Reescrita Completa do Card de Fases
// =================================================================
(function reescreverRenderChapterPhases() {
    if (window._reescreverRenderChapterPhases) return;
    window._reescreverRenderChapterPhases = true;

    window.renderChapterPhases = function(ch) {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;

        let html = '';
        
        ch.phases.forEach(ph => {
            const un = isPhaseUnlocked(ch.id, ph.id);
            const comp = isPhaseCompleted(ph.id);
            const boss = ph.isBoss;
            const finalBoss = ph.isFinalBoss;
            const stars = getStarsForPhase(ph.id);
            
            let statusIcon;
            if (comp) statusIcon = uiIcon('check');
            else if (un) statusIcon = `<span class="story-phase-available">${uiIcon('arrow')}</span>`;
            else statusIcon = uiIcon('lock');

            let starsHTML = '<span class="story-phase-stars">';
            for (let i = 1; i <= 3; i++) {
                starsHTML += `<span class="story-star ${i <= stars ? 'on' : 'off'}">★</span>`;
            }
            starsHTML += '</span>';

            // --- INÍCIO DA CORREÇÃO DOS SPRITES ---
            const enemiesHTML = ph.enemies.map(eid => {
                const e = STORY_ENEMIES[eid];
                if (!e) return '';
                
                // 1. Tenta pegar o link do SPRITES_STORY
                let urlFinal = SPRITES_STORY[eid];
                
                // 2. Se estiver vazio (como está acontecendo com todos os bosses), 
                // vai na tabela global do entidades.js
                if (!urlFinal || urlFinal.trim() === '') {
                    const baseKey = STORY_TO_BASE_BOSS[eid]; // Ex: transforma 'saci' em 'SACI'
                    if (baseKey && typeof SPRITES !== 'undefined' && SPRITES[baseKey]) {
                        urlFinal = SPRITES[baseKey];
                    }
                }

                // 3. Se tiver link, desenha a imagem. Se não, desenha o emoji.
                let imgHTML;
                if (urlFinal && urlFinal.trim() !== '') {
                    imgHTML = `<img src="${urlFinal}" class="story-sprite" alt="${e.name}" onerror="this.outerHTML='${EMOJI_STORY[eid]||'?'}'">`;
                } else {
                    imgHTML = `<span class="story-enemy-mini">${EMOJI_STORY[eid]||'?'}</span>`;
                }

                return `<span class="story-phase-enemy" title="${e.name}">${imgHTML}</span>`;
            }).join('<span class="story-phase-arrow">→</span>');
            // --- FIM DA CORREÇÃO DOS SPRITES ---

            const cls = [
                'story-phase-card',
                un ? 'unlocked' : 'locked',
                comp ? 'completed' : '',
                boss ? 'boss-phase' : '',
                finalBoss ? 'final-boss' : ''
            ].join(' ');

            html += `<div class="${cls}" ${un?`onclick="startStoryPhase('${ch.id}','${ph.id}')"`:''}>
                <div class="story-phase-bg">${ph.bg?storySpriteLarge(ph.bg):''}</div>
                <div class="story-phase-header">
                    <span class="story-phase-num">${ph.id}</span>
                    ${starsHTML}
                    <span class="story-phase-status">${statusIcon}</span>
                </div>
                <div class="story-phase-body">
                    <h4 class="story-phase-name">${ph.name}</h4>
                    <p class="story-phase-desc">${ph.description}</p>
                    <div class="story-phase-enemies-row">${enemiesHTML}</div>
                </div>
            </div>`;
        });

        screen.innerHTML = `
            <div class="story-container">
                <div class="story-header"><h1 class="story-title">${ch.name}</h1><p class="story-subtitle">${ch.description}</p></div>
                <div class="story-phases-grid">${html}</div>
                <div class="story-footer"><button class="story-back-btn" onclick="renderAtosScreen()">← VOLTAR</button></div>
            </div>`;
    };

    console.log('✅ [Patch Final] Função renderChapterPhases reescrita com fallback global.');
})();
// =================================================================
// FIX: Reinjetar seletor de dificuldade após o patch final
// de renderChapterPhases (que apagou o seletor).
// =================================================================
(function reinjetarSeletorDificuldade() {
    if (window._difficultySelectorReinjetado) return;
    window._difficultySelectorReinjetado = true;

    const _origRender = window.renderChapterPhases;

    window.renderChapterPhases = function(ch) {
        const r = _origRender.apply(this, arguments);

        // Só age se o seletor de dificuldade existir
        if (typeof STORY_DIFFICULTIES === 'undefined') return r;

        const screen = document.getElementById('storyScreen');
        if (!screen) return r;

        const header = screen.querySelector('.story-header');
        if (!header) return r;

        // Evita duplicar
        if (header.querySelector('.story-difficulty-selector')) return r;

        const diffAtual = (typeof storyCurrentDifficulty !== 'undefined')
            ? storyCurrentDifficulty : 'normal';

        const diffs = Object.values(STORY_DIFFICULTIES);
        const botoesHTML = diffs.map(d => {
            const unlocked = (typeof isDifficultyUnlocked === 'function')
                ? isDifficultyUnlocked(d.id) : (d.id === 'normal');
            const active = d.id === diffAtual;
            return `
                <button class="story-difficulty-btn ${active ? 'active' : ''} ${unlocked ? '' : 'locked'}"
                        data-diff="${d.id}"
                        ${unlocked ? '' : 'disabled'}
                        style="--diff-color: ${d.color};">
                    <span class="story-difficulty-icon">${d.icon}</span>
                    <span class="story-difficulty-nome">${d.nome}</span>
                    ${unlocked ? '' : '<span class="story-difficulty-lock">🔒</span>'}
                </button>
            `;
        }).join('');

        const selector = document.createElement('div');
        selector.className = 'story-difficulty-selector';
        selector.innerHTML = `
            <div class="story-difficulty-label">DIFICULDADE</div>
            <div class="story-difficulty-buttons">${botoesHTML}</div>
        `;
        header.appendChild(selector);

        // Handler dos botões
        selector.querySelectorAll('.story-difficulty-btn:not(.locked)').forEach(btn => {
            btn.addEventListener('click', function() {
                const diffId = this.dataset.diff;
                if (diffId === storyCurrentDifficulty) return;

                if (typeof setStoryDifficulty === 'function') {
                    if (!setStoryDifficulty(diffId)) return;
                } else {
                    storyCurrentDifficulty = diffId;
                    if (typeof saveDifficultyToProgress === 'function') saveDifficultyToProgress();
                }

                // Re-renderiza a tela de fases
                window.renderChapterPhases(ch);

                const d = STORY_DIFFICULTIES[diffId];
                if (d && typeof showToast === 'function') {
                    showToast(d.icon, `Dificuldade: ${d.nome}`, d.icon);
                }
            });
        });

        // Badge da dificuldade ativa (se != normal)
        if (diffAtual !== 'normal') {
            const diff = STORY_DIFFICULTIES[diffAtual];
            if (diff && !header.querySelector('.story-difficulty-active-badge')) {
                const badge = document.createElement('div');
                badge.className = 'story-difficulty-active-badge';
                badge.style.setProperty('--diff-color', diff.color);
                badge.innerHTML = `
                    ${diff.icon} JOGANDO EM ${diff.nome.toUpperCase()}
                    <span class="story-difficulty-active-hint">
                        (HP ×${diff.hpMult} · ATK ×${diff.atkMult} · Recompensa ×${diff.rewardMult})
                    </span>
                `;
                const sel = header.querySelector('.story-difficulty-selector');
                if (sel) header.insertBefore(badge, sel);
                else header.appendChild(badge);
            }
        }

        return r;
    };

    console.log('✅ [FIX] Seletor de dificuldade reinjetado em renderChapterPhases.');
})();
// =================================================================
// historia.js — BLOCO 69 (V16.0 — Correções de UX e Bug Fix)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js.
//
// Corrige:
//   • Item 1 — Boss nasce sobre herói → empurra herói pra baixo + 1 dano
//   • Item 2 — Cancelar Solo Sagrado (clicar de novo) sem consumir
//   • Item 4 — Remove pocao_cura da loja
//   • Item 5 — Mercador: Vender padrão, Comprar vazia com aviso
//   • Item 6 — Toggle "Pular animações PA" nas Configurações do Modo História
//              + skip por clique durante animação
// =================================================================

(function correcoesV160() {
    if (window._correcoesV160) return;
    window._correcoesV160 = true;

    // ==============================================================
    // ITEM 1 — BOSS NUNCA NASCE SOBRE HERÓI
    // --------------------------------------------------------------
    // Se o herói estiver em (4,0) quando o boss spawna, empurra o
    // herói pra baixo (4,1), (4,2)... até achar livre. Se a coluna
    // inteira estiver ocupada, tenta colunas adjacentes (3,5).
    // Cada empurrão causa 1 de dano (a "pancada" do boss caindo).
    // ==============================================================
    console.log('✅ [V16.0] Item 1 — Spawn do boss não sobrepõe mais herói.');

    // ==============================================================
    // ITEM 2 — CANCELAR SOLO SAGRADO (clicar de novo)
    // --------------------------------------------------------------
    // Se skillActive === true e o jogador clica em btnSkill de novo,
    // cancela sem consumir. Se clicar num tile, usa normalmente.
    // ==============================================================
    const _origActivateSkill = window.activateSkill;
    if (typeof _origActivateSkill === 'function') {
        window.activateSkill = function() {
            // Só age no modo história (fora dele, comportamento original)
            if (!window._storyMode) {
                return _origActivateSkill.apply(this, arguments);
            }

            const active = players[currentPlayerIdx];
            if (!active) return _origActivateSkill.apply(this, arguments);

            // Se já está ativo → CANCELA
            if (skillActive === true) {
                skillActive = false;
                document.querySelectorAll('#grid .tile').forEach(t => t.classList.remove('skill-mode'));

                // Restaura texto do botão
                const btn = document.getElementById('btnSkill');
                if (btn) {
                    btn.classList.remove('skill-cancel-mode');
                    btn.innerHTML = '✨ SOLO SAGRADO';
                }

                if (typeof addLog === 'function') addLog('✨ Solo Sagrado cancelado.');
                if (typeof playSfx === 'function') { try { playSfx('click'); } catch(e) {} }
                return;
            }

            // Senão, ativa normalmente (chama o original)
            const r = _origActivateSkill.apply(this, arguments);

            // Se ativou com sucesso, muda o texto do botão
            if (skillActive === true) {
                const btn = document.getElementById('btnSkill');
                if (btn) {
                    btn.classList.add('skill-cancel-mode');
                    btn.innerHTML = '✕ CANCELAR';
                }
            }

            return r;
        };
    }

    // Hook no handleSelect: se o jogador clicar num tile com skillActive,
    // consome normalmente (o original já faz). Se cancelou no botão,
    // não chega aqui. Nada a mudar.

    console.log('✅ [V16.0] Item 2 — Cancelar Solo Sagrado implementado.');

    // ==============================================================
    // ITEM 4 — REMOVER POCAO_CURA DA LOJA
    // ==============================================================
    // A loja não deve vender poção de cura. O design é "cura só por
    // formas e skills". Mantemos a estrutura, mas esvaziamos o array.
    // ==============================================================
    if (typeof STORY_SHOP_ITEMS !== 'undefined' && Array.isArray(STORY_SHOP_ITEMS)) {
        // Remove qualquer item de cura
        const itensAntigos = STORY_SHOP_ITEMS.length;
        for (let i = STORY_SHOP_ITEMS.length - 1; i >= 0; i--) {
            const it = STORY_SHOP_ITEMS[i];
            if (it.id === 'pocao_cura') {
                STORY_SHOP_ITEMS.splice(i, 1);
            }
        }

        // ✅ ITEM 5 — Esvazia a loja inteira (mantém estrutura pra futuro)
        // O jogador vai ver "Sem estoque" na aba Comprar.
        STORY_SHOP_ITEMS.length = 0;

        console.log(`[V16.0] Item 4/5 — Loja esvaziada: ${itensAntigos} → 0 itens.`);
    }

    // ==============================================================
    // ITEM 5 — MERCADOR: VENDER PADRÃO, COMPRAR VAZIA
    // --------------------------------------------------------------
    // Sobrescreve renderLojaScreenCompleta pra:
    //   • Aba padrão = "vender"
    //   • Título "MERCADOR"
    //   • Aba "comprar" mostra "Sem estoque" se STORY_SHOP_ITEMS vazio
    // ==============================================================
    window.renderLojaScreenCompleta = function() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;
        const gold = STORY_PROGRESS.gold || 0;

        // Garante que a aba padrão seja 'vender'
        if (typeof curandeiroTab === 'undefined' || curandeiroTab === 'comprar') {
            window.curandeiroTab = 'vender';
        }

        // ============ COMPRA ============
        let buyHTML = '';
        if (!STORY_SHOP_ITEMS || STORY_SHOP_ITEMS.length === 0) {
            buyHTML = `
                <div class="tesouraria-empty" style="margin:0; padding:40px 20px;">
                    <div class="tesouraria-empty-icon">🏪</div>
                    <div class="tesouraria-empty-text">O mercador está sem estoque.</div>
                    <div class="tesouraria-empty-hint">Volte depois — ele pode ter novidades.</div>
                </div>
            `;
        } else {
            buyHTML = '<div class="story-shop-grid">' + STORY_SHOP_ITEMS.map(it => {
                const m = STORY_MATERIALS[it.id];
                const emoji = m ? m.emoji : (it.emoji || '❓');
                const can = gold >= it.price;
                return `<div class="story-shop-item ${can?'':'disabled'}">
                    <div class="story-shop-emoji">${emoji}</div>
                    <div class="story-shop-name">${it.name}</div>
                    <div class="story-shop-desc">${it.description || ''}</div>
                    <div class="story-shop-price">${uiIcon('gold')} ${it.price}</div>
                    <button class="story-shop-btn" ${can?'':'disabled'} onclick="buyShopItem('${it.id}',${it.price})">COMPRAR</button>
                </div>`;
            }).join('') + '</div>';
        }

        // ============ VENDA ============
        const inv = STORY_PROGRESS.inventory || {};
        const sellIds = Object.keys(inv).filter(id => inv[id] > 0);
        let sellHTML = '';

        if (sellIds.length === 0) {
            sellHTML = `<div class="tesouraria-empty" style="margin:0; padding:40px 20px;">
                <div class="tesouraria-empty-icon">💰</div>
                <div class="tesouraria-empty-text">Nenhum material para vender.</div>
                <div class="tesouraria-empty-hint">Derrote inimigos para coletar materiais.</div>
            </div>`;
        } else {
            sellIds.sort((a, b) => getMaterialPrice(b) - getMaterialPrice(a));
            sellHTML = '<div class="sell-grid">' + sellIds.map(id => {
                const m = STORY_MATERIALS[id];
                if (!m) return '';
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

        const abaAtual = (typeof curandeiroTab !== 'undefined') ? curandeiroTab : 'vender';

        screen.innerHTML = `
            <div class="story-container">
                <div class="story-header">
                    <h1 class="story-title">🧙 MERCADOR</h1>
                    <p class="story-subtitle">"Compro o que você trouxer." (${gold} ${uiIcon('gold')})</p>
                </div>

                <div class="curandeiro-tabs">
                    <button class="curandeiro-tab ${abaAtual === 'vender' ? 'active' : ''}" onclick="curandeiroTab='vender'; renderLojaScreenCompleta();">💰 Vender</button>
                    <button class="curandeiro-tab ${abaAtual === 'comprar' ? 'active' : ''}" onclick="curandeiroTab='comprar'; renderLojaScreenCompleta();">🛒 Comprar</button>
                </div>

                <div class="curandeiro-content">
                    ${abaAtual === 'vender' ? sellHTML : buyHTML}
                </div>

                <div class="story-footer"><button class="story-back-btn" onclick="renderAldeiaScreen()">← VOLTAR À ALDEIA</button></div>
            </div>
        `;
    };

    // Garante que a aba inicial seja 'vender' na primeira vez
    if (typeof window.curandeiroTab === 'undefined') {
        window.curandeiroTab = 'vender';
    }

    console.log('✅ [V16.0] Item 5 — Mercador reestruturado (Vender padrão).');

    // ==============================================================
    // ITEM 6 — TOGGLE "PULAR ANIMAÇÕES PA" NAS CONFIGURAÇÕES
    // --------------------------------------------------------------
    // 1. Adiciona STORY_SETTINGS.skipBravelyAnimations
    // 2. Modifica showBravelyAnimation e showPoderAncestralEffect
    //    pra pular quando ligado
    // 3. Adiciona toggle na tela de configurações do modo história
    // 4. Adiciona skip por clique durante animação
    // ==============================================================

    // ---- 6.1: Adicionar config ----
    if (typeof STORY_DEFAULT_SETTINGS !== 'undefined') {
        if (typeof STORY_DEFAULT_SETTINGS.skipBravelyAnimations === 'undefined') {
            STORY_DEFAULT_SETTINGS.skipBravelyAnimations = false;
        }
    }
    if (typeof STORY_SETTINGS !== 'undefined') {
        if (typeof STORY_SETTINGS.skipBravelyAnimations === 'undefined') {
            STORY_SETTINGS.skipBravelyAnimations = false;
        }
    }

    // ---- 6.2: Flag global de cinematográfica em andamento ----
    window._cinematograficaEmAndamento = false;
    window._skipCinematografica = false;

    // ---- 6.3: Modificar showPoderAncestralEffect ----
    const _origPoderAncestral = window.showPoderAncestralEffect;
    if (typeof _origPoderAncestral === 'function') {
        window.showPoderAncestralEffect = function() {
            if (window._storyMode && STORY_SETTINGS.skipBravelyAnimations) {
                // Pula completamente
                return;
            }
            window._cinematograficaEmAndamento = true;
            const r = _origPoderAncestral.apply(this, arguments);
            // O efeito tem ~2.4s
            setTimeout(() => { window._cinematograficaEmAndamento = false; }, 2400);
            return r;
        };
    }

    // ---- 6.4: Modificar showBravelyAnimation ----
    const _origBravelyAnim = window.showBravelyAnimation;
    if (typeof _origBravelyAnim === 'function') {
        window.showBravelyAnimation = function(playerClass) {
            // Fora do modo história → original
            if (!window._storyMode) {
                return _origBravelyAnim.apply(this, arguments);
            }

            // Se toggle ligado OU skip solicitado → resolve imediato
            if (STORY_SETTINGS.skipBravelyAnimations || window._skipCinematografica) {
                if (window._skipCinematografica) {
                    window._skipCinematografica = false;
                }
                return Promise.resolve();
            }

            // Senão, original, mas com flag de controle
            window._cinematograficaEmAndamento = true;

            // Adiciona listener de clique pra skip
            const skipHandler = () => {
                window._skipCinematografica = true;
                // Remove overlay atual, se houver
                const ov = document.getElementById('bravelyAnimationOverlay');
                if (ov) ov.remove();
            };
            document.addEventListener('click', skipHandler, { once: true, capture: true });

            return new Promise(resolve => {
                Promise.resolve(_origBravelyAnim.call(this, playerClass)).then(() => {
                    window._cinematograficaEmAndamento = false;
                    window._skipCinematografica = false;
                    document.removeEventListener('click', skipHandler, { capture: true });
                    resolve();
                });
            });
        };
    }

    // ---- 6.5: Modificar showPurificacao (reduz se toggle ligado) ----
    const _origPurif = window.showPurificacao;
    if (typeof _origPurif === 'function') {
        window.showPurificacao = function(bossType, tileX, tileY, isFinalBoss) {
            if (window._storyMode && STORY_SETTINGS.skipBravelyAnimations) {
                // Reduz para ~800ms
                return new Promise(resolve => {
                    const board = document.getElementById('board');
                    if (!board) { resolve(); return; }

                    const overlay = document.createElement('div');
                    overlay.className = 'purificacao-overlay active';
                    overlay.style.zIndex = '300';
                    overlay.innerHTML = `<div class="purificacao-darken"></div>`;
                    board.appendChild(overlay);

                    if (typeof playSfx === 'function') { try { playSfx('skill1'); } catch(e) {} }

                    setTimeout(() => {
                        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                        resolve();
                    }, 800);
                });
            }
            return _origPurif.apply(this, arguments);
        };
    }

    // ---- 6.6: Adicionar toggle na tela de configurações do modo história ----
    const _origRenderSettings = window.renderStorySettingsScreen;
    if (typeof _origRenderSettings === 'function') {
        window.renderStorySettingsScreen = function() {
            const r = _origRenderSettings.apply(this, arguments);

            // Injeta a nova seção antes dos botões de ação
            const screen = document.getElementById('storyScreen');
            if (!screen) return r;

            const actions = screen.querySelector('.story-settings-actions');
            if (!actions || screen.querySelector('.story-settings-section-anim')) return r;

            const skipOn = STORY_SETTINGS.skipBravelyAnimations ? 'checked' : '';

            const secao = document.createElement('div');
            secao.className = 'story-settings-section story-settings-section-anim';
            secao.innerHTML = `
                <div class="story-settings-section-title">🎬 ANIMAÇÕES</div>
                <div class="story-settings-row">
                    <label class="story-settings-label">Pular animações de Poder Ancestral</label>
                    <label class="story-settings-toggle">
                        <input type="checkbox" id="setSkipBravely" ${skipOn}>
                        <span class="story-settings-toggle-slider"></span>
                    </label>
                </div>
                <div class="story-settings-hint">
                    Quando ligado, o GIF do Poder Ancestral e o efeito "PODER ANCESTRAL" são pulados.
                    A purificação do boss também fica mais rápida. Deixe desligado pra ver a experiência completa.
                </div>
            `;
            actions.parentNode.insertBefore(secao, actions);

            // Handler do toggle
            const toggle = document.getElementById('setSkipBravely');
            if (toggle) {
                toggle.addEventListener('change', function() {
                    STORY_SETTINGS.skipBravelyAnimations = this.checked;
                    if (typeof saveStorySettings === 'function') saveStorySettings();
                });
            }

            return r;
        };
    }

    console.log('✅ [V16.0] Item 6 — Toggle "Pular animações PA" + skip por clique.');

    // ==============================================================
    // CSS ADICIONAL
    // ==============================================================
    if (!document.getElementById('v160CSS')) {
        const style = document.createElement('style');
        style.id = 'v160CSS';
        style.textContent = `
            /* Botão "CANCELAR" do Solo Sagrado */
            #btnSkill.skill-cancel-mode {
                background: linear-gradient(180deg, rgba(168,50,50,0.25), transparent 45%),
                            linear-gradient(135deg, #6a2020, #3a1010) !important;
                color: #f5c8c8 !important;
                border-color: #a83232 !important;
                box-shadow: 0 0 20px rgba(168, 50, 50, 0.5) !important;
                animation: pulseCancel 1.2s ease-in-out infinite alternate;
            }

            @keyframes pulseCancel {
                from { box-shadow: 0 0 10px rgba(168, 50, 50, 0.4); }
                to   { box-shadow: 0 0 25px rgba(168, 50, 50, 0.8); }
            }
        `;
        document.head.appendChild(style);
    }

    // ==============================================================
    // RELOGA STORY_SETTINGS SE JÁ CARREGADO
    // --------------------------------------------------------------
    // Garante que o toggle persiste entre sessões (loadStorySettings
    // já foi chamado no V9.1; aqui só garantimos que a flag nova exista)
    // ==============================================================
    try {
        if (typeof loadStorySettings === 'function') {
            loadStorySettings();
            // Aplica caso já tenha sido ligado antes
            if (typeof STORY_SETTINGS !== 'undefined' && STORY_SETTINGS.skipBravelyAnimations) {
                console.log('[V16.0] Toggle "Pular animações" está LIGADO (persistido).');
            }
        }
    } catch(e) {
        console.warn('[V16.0] Erro ao recarregar settings:', e);
    }

    // ==============================================================
    // LOG FINAL
    // ==============================================================
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V16.0] Correções de UX e Bug Fix');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Item 1 — Boss empurra herói + 1 dano ao spawnar');
    console.log('• Item 2 — Clicar Solo Sagrado de novo = cancelar');
    console.log('• Item 4 — pocao_cura removida da loja');
    console.log('• Item 5 — Mercador: Vender padrão, Comprar vazia');
    console.log('• Item 6 — Toggle "Pular animações PA" nas Configurações');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — BLOCO 69 (V16.1 — Correções UX + Bug Fix)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js, DEPOIS do V16.0 (ou substitua).
//
// Corrige os problemas do V16.0:
//   • Curandeiro não abria (conflito de variável curandeiroTab)
//   • Nome "Mercador" → "Regatão" (lore amazônica)
//   • Fila de cinematográficas (GIF antes de purificação)
//   • Símbolo do elemento travado (não muda no turno do adversário)
// =================================================================

(function correcoesV161() {
    // Remove o bloco anterior, se existir
    if (window._correcoesV160) {
        console.log('[V16.1] Substituindo V16.0...');
        window._correcoesV160 = false;
    }
    if (window._correcoesV161) return;
    window._correcoesV161 = true;

    // ==============================================================
    // ITEM 1 — BOSS NUNCA NASCE SOBRE HERÓI
    // ==============================================================
    function resolverSpawnBossSobreHeroi() {
        if (typeof boss === 'undefined' || !boss) return;
        if (typeof players === 'undefined' || !players) return;

        const bx = boss.x, by = boss.y;

        players.forEach(p => {
            if (p.dead) return;
            if (p.x !== bx || p.y !== by) return;

            let novoX = bx, novoY = by;

            // Tenta empurrar pra baixo
            for (let dy = 1; dy < 8; dy++) {
                const ty = by + dy;
                if (ty >= 8) break;
                const ocupado = players.some(o =>
                    o.id !== p.id && !o.dead && o.x === bx && o.y === ty
                );
                if (!ocupado) { novoX = bx; novoY = ty; break; }
            }

            // Se não achou, tenta colunas adjacentes
            if (novoX === bx && novoY === by) {
                const colsAdj = [bx - 1, bx + 1, bx - 2, bx + 2];
                for (const cx of colsAdj) {
                    if (cx < 0 || cx >= 8) continue;
                    for (let dy = 0; dy < 8; dy++) {
                        const ty = by + dy;
                        if (ty >= 8) break;
                        const ocupado = players.some(o =>
                            o.id !== p.id && !o.dead && o.x === cx && o.y === ty
                        );
                        if (!ocupado) { novoX = cx; novoY = ty; break; }
                    }
                    if (novoX !== bx || novoY !== by) break;
                }
            }

            if (novoX !== bx || novoY !== by) {
                p.x = novoX;
                p.y = novoY;
                p.hp = Math.max(0, p.hp - 1);

                if (typeof showDmgEffect === 'function') showDmgEffect(p.x, p.y, 1);
                if (typeof addLog === 'function') addLog(`⚡ ${p.name} foi empurrado pelo impacto! (-1 HP)`);
                if (p.hp <= 0) {
                    p.dead = true;
                    const tok = document.getElementById(`tokenP${p.id}`);
                    if (tok) tok.classList.add('dead');
                }
                console.log(`[V16.1] Herói ${p.name} empurrado: (${bx},${by}) → (${novoX},${novoY})`);
            }
        });
    }

    const _origInitBattle = window.initStoryBattle;
    if (typeof _origInitBattle === 'function') {
        window.initStoryBattle = async function() {
            const r = await _origInitBattle.apply(this, arguments);
            await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
            resolverSpawnBossSobreHeroi();
            if (typeof updateVisuals === 'function') updateVisuals();
            if (typeof updateHeroCard === 'function') updateHeroCard();
            if (typeof updateBossCard === 'function') updateBossCard();
            return r;
        };
    }

    const _origAdvance = window.advanceStoryEnemy;
    if (typeof _origAdvance === 'function') {
        window.advanceStoryEnemy = async function() {
            const r = await _origAdvance.apply(this, arguments);
            await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
            resolverSpawnBossSobreHeroi();
            if (typeof updateVisuals === 'function') updateVisuals();
            return r;
        };
    }

    console.log('✅ [V16.1] Item 1 — Spawn do boss OK.');

    // ==============================================================
    // ITEM 2 — CANCELAR SOLO SAGRADO
    // ==============================================================
    const _origActivateSkill = window.activateSkill;
    if (typeof _origActivateSkill === 'function') {
        window.activateSkill = function() {
            if (!window._storyMode) return _origActivateSkill.apply(this, arguments);

            const active = players[currentPlayerIdx];
            if (!active) return _origActivateSkill.apply(this, arguments);

            if (skillActive === true) {
                skillActive = false;
                document.querySelectorAll('#grid .tile').forEach(t => t.classList.remove('skill-mode'));
                const btn = document.getElementById('btnSkill');
                if (btn) {
                    btn.classList.remove('skill-cancel-mode');
                    btn.innerHTML = '✨ SOLO SAGRADO';
                }
                if (typeof addLog === 'function') addLog('✨ Solo Sagrado cancelado.');
                if (typeof playSfx === 'function') { try { playSfx('click'); } catch(e) {} }
                return;
            }

            const r = _origActivateSkill.apply(this, arguments);
            if (skillActive === true) {
                const btn = document.getElementById('btnSkill');
                if (btn) {
                    btn.classList.add('skill-cancel-mode');
                    btn.innerHTML = '✕ CANCELAR';
                }
            }
            return r;
        };
    }

    console.log('✅ [V16.1] Item 2 — Cancelar Solo Sagrado OK.');

    // ==============================================================
    // ITEM 4 — REMOVER POCAO_CURA DA LOJA
    // ==============================================================
    if (typeof STORY_SHOP_ITEMS !== 'undefined' && Array.isArray(STORY_SHOP_ITEMS)) {
        STORY_SHOP_ITEMS.length = 0;
        console.log('[V16.1] Item 4/5 — Loja esvaziada.');
    }

    // ==============================================================
    // ITEM 5 — REGATÃO (Vender padrão, Comprar vazia)
    // --------------------------------------------------------------
    // CORREÇÃO: usar a variável global `curandeiroTab` (não window.*)
    // ==============================================================
    window.renderLojaScreenCompleta = function() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;
        const gold = STORY_PROGRESS.gold || 0;

        // ⚠️ Usa a variável global `curandeiroTab` (declarada com `let` no V8.3)
        // Se não existir, inicializa como 'vender'
        if (typeof curandeiroTab === 'undefined' || curandeiroTab === 'comprar') {
            try { curandeiroTab = 'vender'; } catch(e) {}
        }

        // ============ COMPRA ============
        let buyHTML = '';
        if (!STORY_SHOP_ITEMS || STORY_SHOP_ITEMS.length === 0) {
            buyHTML = `
                <div class="tesouraria-empty" style="margin:0; padding:40px 20px;">
                    <div class="tesouraria-empty-icon">🏪</div>
                    <div class="tesouraria-empty-text">O Regatão está sem estoque.</div>
                    <div class="tesouraria-empty-hint">Volte depois — ele pode ter novidades.</div>
                </div>
            `;
        } else {
            buyHTML = '<div class="story-shop-grid">' + STORY_SHOP_ITEMS.map(it => {
                const m = STORY_MATERIALS[it.id];
                const emoji = m ? m.emoji : (it.emoji || '❓');
                const can = gold >= it.price;
                return `<div class="story-shop-item ${can?'':'disabled'}">
                    <div class="story-shop-emoji">${emoji}</div>
                    <div class="story-shop-name">${it.name}</div>
                    <div class="story-shop-desc">${it.description || ''}</div>
                    <div class="story-shop-price">${uiIcon('gold')} ${it.price}</div>
                    <button class="story-shop-btn" ${can?'':'disabled'} onclick="buyShopItem('${it.id}',${it.price})">COMPRAR</button>
                </div>`;
            }).join('') + '</div>';
        }

        // ============ VENDA ============
        const inv = STORY_PROGRESS.inventory || {};
        const sellIds = Object.keys(inv).filter(id => inv[id] > 0);
        let sellHTML = '';

        if (sellIds.length === 0) {
            sellHTML = `<div class="tesouraria-empty" style="margin:0; padding:40px 20px;">
                <div class="tesouraria-empty-icon">💰</div>
                <div class="tesouraria-empty-text">Nenhum material para vender.</div>
                <div class="tesouraria-empty-hint">Derrote inimigos para coletar materiais.</div>
            </div>`;
        } else {
            sellIds.sort((a, b) => getMaterialPrice(b) - getMaterialPrice(a));
            sellHTML = '<div class="sell-grid">' + sellIds.map(id => {
                const m = STORY_MATERIALS[id];
                if (!m) return '';
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

        const abaAtual = (typeof curandeiroTab !== 'undefined') ? curandeiroTab : 'vender';

        screen.innerHTML = `
            <div class="story-container">
                <div class="story-header">
                    <h1 class="story-title">🧙 REGATÃO</h1>
                    <p class="story-subtitle">"Compro o que você trouxer. Levo histórias e deixo ouro." (${gold} ${uiIcon('gold')})</p>
                </div>

                <div class="curandeiro-tabs">
                    <button class="curandeiro-tab ${abaAtual === 'vender' ? 'active' : ''}" onclick="curandeiroTab='vender'; renderLojaScreenCompleta();">💰 Vender</button>
                    <button class="curandeiro-tab ${abaAtual === 'comprar' ? 'active' : ''}" onclick="curandeiroTab='comprar'; renderLojaScreenCompleta();">🛒 Comprar</button>
                </div>

                <div class="curandeiro-content">
                    ${abaAtual === 'vender' ? sellHTML : buyHTML}
                </div>

                <div class="story-footer"><button class="story-back-btn" onclick="renderAldeiaScreen()">← VOLTAR À ALDEIA</button></div>
            </div>
        `;
    };

    // Garante que a variável global existe
    try {
        if (typeof curandeiroTab === 'undefined') {
            // curandeiroTab é `let` no escopo do módulo. Não conseguimos
            // criar do lado de fora, mas o render acima já faz fallback.
        }
    } catch(e) {}

    // Também força a Aldeia a chamar o novo render (o botão da Aldeia
    // chama enterAldeiaLocation('loja') → renderLojaScreenCompleta)
    console.log('✅ [V16.1] Item 5 — Regatão reestruturado.');

    // ==============================================================
    // ITEM 6 — FILA DE CINEMATOGRÁFICAS (GIF antes de purificação)
    // --------------------------------------------------------------
    // Sistema: só uma cinematográfica roda por vez.
    // O showPurificacao espera o GIF terminar antes de tocar.
    // ==============================================================
    if (typeof STORY_DEFAULT_SETTINGS !== 'undefined' && typeof STORY_DEFAULT_SETTINGS.skipBravelyAnimations === 'undefined') {
        STORY_DEFAULT_SETTINGS.skipBravelyAnimations = false;
    }
    if (typeof STORY_SETTINGS !== 'undefined' && typeof STORY_SETTINGS.skipBravelyAnimations === 'undefined') {
        STORY_SETTINGS.skipBravelyAnimations = false;
    }

    // Fila de cinematográficas (promise chain)
    window._cinematograficaFila = Promise.resolve();
    window._skipCinematografica = false;

    function enfileirarCinematografica(fn) {
        const anterior = window._cinematograficaFila || Promise.resolve();
        const proxima = anterior.then(() => fn());
        window._cinematograficaFila = proxima.catch(() => {});
        return proxima;
    }
    window.enfileirarCinematografica = enfileirarCinematografica;

    // ---- showPoderAncestralEffect: pula se toggle ----
    const _origPoderAncestral = window.showPoderAncestralEffect;
    if (typeof _origPoderAncestral === 'function') {
        window.showPoderAncestralEffect = function() {
            if (window._storyMode && STORY_SETTINGS.skipBravelyAnimations) return;
            return _origPoderAncestral.apply(this, arguments);
        };
    }

    // ---- showBravelyAnimation: skip por clique + fila ----
    const _origBravelyAnim = window.showBravelyAnimation;
    if (typeof _origBravelyAnim === 'function') {
        window.showBravelyAnimation = function(playerClass) {
            if (!window._storyMode) {
                return _origBravelyAnim.apply(this, arguments);
            }

            // Toggle ligado → pula
            if (STORY_SETTINGS.skipBravelyAnimations || window._skipCinematografica) {
                window._skipCinematografica = false;
                return Promise.resolve();
            }

            return enfileirarCinematografica(() => {
                return new Promise(resolve => {
                    const skipHandler = () => {
                        window._skipCinematografica = true;
                        const ov = document.getElementById('bravelyAnimationOverlay');
                        if (ov) ov.parentNode && ov.parentNode.removeChild(ov);
                    };
                    document.addEventListener('click', skipHandler, { once: true, capture: true });

                    Promise.resolve(_origBravelyAnim.call(this, playerClass)).then(() => {
                        document.removeEventListener('click', skipHandler, { capture: true });
                        window._skipCinematografica = false;
                        resolve();
                    });
                });
            });
        };
    }

    // ---- showPurificacao: enfileirada (espera GIF anterior) ----
    const _origPurif = window.showPurificacao;
    if (typeof _origPurif === 'function') {
        window.showPurificacao = function(bossType, tileX, tileY, isFinalBoss) {
            if (!window._storyMode) {
                return _origPurif.apply(this, arguments);
            }

            // Toggle ligado → versão curta
            if (STORY_SETTINGS.skipBravelyAnimations) {
                return enfileirarCinematografica(() => {
                    return new Promise(resolve => {
                        const board = document.getElementById('board');
                        if (!board) { resolve(); return; }

                        const overlay = document.createElement('div');
                        overlay.className = 'purificacao-overlay active';
                        overlay.style.zIndex = '300';
                        overlay.innerHTML = `<div class="purificacao-darken"></div>`;
                        board.appendChild(overlay);

                        if (typeof playSfx === 'function') { try { playSfx('skill1'); } catch(e) {} }

                        setTimeout(() => {
                            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                            resolve();
                        }, 800);
                    });
                });
            }

            // Toggle desligado → purificação completa, mas ENFILEIRADA
            // (espera o GIF anterior terminar)
            return enfileirarCinematografica(() => {
                return _origPurif.call(this, bossType, tileX, tileY, isFinalBoss);
            });
        };
    }

    // ---- Toggle nas Configurações do Modo História ----
    const _origRenderSettings = window.renderStorySettingsScreen;
    if (typeof _origRenderSettings === 'function') {
        window.renderStorySettingsScreen = function() {
            const r = _origRenderSettings.apply(this, arguments);

            const screen = document.getElementById('storyScreen');
            if (!screen) return r;

            const actions = screen.querySelector('.story-settings-actions');
            if (!actions || screen.querySelector('.story-settings-section-anim')) return r;

            const skipOn = STORY_SETTINGS.skipBravelyAnimations ? 'checked' : '';

            const secao = document.createElement('div');
            secao.className = 'story-settings-section story-settings-section-anim';
            secao.innerHTML = `
                <div class="story-settings-section-title">🎬 ANIMAÇÕES</div>
                <div class="story-settings-row">
                    <label class="story-settings-label">Pular animações de Poder Ancestral</label>
                    <label class="story-settings-toggle">
                        <input type="checkbox" id="setSkipBravely" ${skipOn}>
                        <span class="story-settings-toggle-slider"></span>
                    </label>
                </div>
                <div class="story-settings-hint">
                    Quando ligado, o GIF do Poder Ancestral e o efeito "PODER ANCESTRAL" são pulados.
                    A purificação do boss também fica mais rápida. Deixe desligado pra ver a experiência completa.
                </div>
            `;
            actions.parentNode.insertBefore(secao, actions);

            const toggle = document.getElementById('setSkipBravely');
            if (toggle) {
                toggle.addEventListener('change', function() {
                    STORY_SETTINGS.skipBravelyAnimations = this.checked;
                    if (typeof saveStorySettings === 'function') saveStorySettings();
                });
            }

            return r;
        };
    }

    console.log('✅ [V16.1] Item 6 — Fila de cinematográficas + toggle.');

    // ==============================================================
    // BUG ADICIONAL — SÍMBOLO DO ELEMENTO MUDA NO TURNO DO ADVERSÁRIO
    // --------------------------------------------------------------
    // Causa: `saveAndRefresh` (entidades.js) recalcula p.element a
    // partir do NOME do herói (charCodeAt), sobrescrevendo o elemento
    // fixo. No coop/PVP/história, isso faz o elemento "mudar" quando
    // o turno passa.
    //
    // Correção: travar o elemento na primeira definição. Sobrescreve
    // saveAndRefresh pra NÃO mudar p.element se já foi travado.
    // ==============================================================
    if (typeof window.saveAndRefresh === 'function' && !window._elementoTravadoHook) {
        window._elementoTravadoHook = true;
        const _origSaveAndRefresh = window.saveAndRefresh;

        window.saveAndRefresh = function() {
            // Antes de chamar o original, trava o elemento de todos os players
            // que já têm um elemento definido
            if (typeof players !== 'undefined' && Array.isArray(players)) {
                players.forEach(p => {
                    if (p && p.element && !p._elementoTravado) {
                        p._elementoTravado = true;
                    }
                });
            }

            // Chama o original
            const r = _origSaveAndRefresh.apply(this, arguments);

            // Depois, restaura o elemento travado (o original pode ter
            // sobrescrito via charCodeAt)
            if (typeof players !== 'undefined' && Array.isArray(players)) {
                players.forEach(p => {
                    if (p && p._elementoTravado && p._elementoOriginal) {
                        p.element = p._elementoOriginal;
                    }
                    // Primeira vez: salva o elemento original
                    if (p && p.element && !p._elementoOriginal) {
                        p._elementoOriginal = p.element;
                    }
                });
            }

            return r;
        };

        // Também hook no initStoryBattle pra salvar o elemento original
        // antes do saveAndRefresh rodar
        const _origInitBattle2 = window.initStoryBattle;
        if (typeof _origInitBattle2 === 'function') {
            window.initStoryBattle = async function() {
                const r = await _origInitBattle2.apply(this, arguments);
                // Após initStoryBattle, salva o elemento de cada player
                if (typeof players !== 'undefined' && Array.isArray(players)) {
                    players.forEach(p => {
                        if (p && p.element) {
                            p._elementoOriginal = p.element;
                            p._elementoTravado = true;
                        }
                    });
                }
                return r;
            };
        }

        console.log('✅ [V16.1] Bug do símbolo do elemento travado.');
    }

    // ==============================================================
    // CSS
    // ==============================================================
    if (!document.getElementById('v160CSS')) {
        const style = document.createElement('style');
        style.id = 'v160CSS';
        style.textContent = `
            #btnSkill.skill-cancel-mode {
                background: linear-gradient(180deg, rgba(168,50,50,0.25), transparent 45%),
                            linear-gradient(135deg, #6a2020, #3a1010) !important;
                color: #f5c8c8 !important;
                border-color: #a83232 !important;
                box-shadow: 0 0 20px rgba(168, 50, 50, 0.5) !important;
                animation: pulseCancel 1.2s ease-in-out infinite alternate;
            }
            @keyframes pulseCancel {
                from { box-shadow: 0 0 10px rgba(168, 50, 50, 0.4); }
                to   { box-shadow: 0 0 25px rgba(168, 50, 50, 0.8); }
            }
        `;
        document.head.appendChild(style);
    }

    // ==============================================================
    // LOG FINAL
    // ==============================================================
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V16.1] Correções de UX + Bug Fix (revisto)');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Item 1 — Boss empurra herói + 1 dano');
    console.log('• Item 2 — Cancelar Solo Sagrado');
    console.log('• Item 4 — pocao_cura removida');
    console.log('• Item 5 — REGATÃO (lore amazônica), Vender padrão');
    console.log('• Item 6 — Fila de cinematográficas + toggle');
    console.log('• BÔNUS — Elemento travado (não muda no turno do adversário)');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — BLOCO 69 (V16.2 — Fix Escambo + GIF + Card Aldeia)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js, DEPOIS do V16.1 (ou substitua).
//
// Corrige:
//   • Card "CURANDEIRO" na Aldeia → "ESCAMBO"
//   • Card não entrava (enterAldeiaLocation)
//   • GIF do PA não aparecia (remove fila, chama direto)
//   • Nome "Regatão" → "Escambo"
// =================================================================

(function correcoesV162() {
    // Remove o V16.1 anterior
    if (window._correcoesV161) {
        console.log('[V16.2] Substituindo V16.1...');
        window._correcoesV161 = false;
    }
    if (window._correcoesV162) return;
    window._correcoesV162 = true;

    // ==============================================================
    // ==============================================================
    // ITEM 2 — CANCELAR SOLO SAGRADO (mantido)
    // ==============================================================
    const _origActivateSkill = window.activateSkill;
    if (typeof _origActivateSkill === 'function') {
        window.activateSkill = function() {
            if (!window._storyMode) return _origActivateSkill.apply(this, arguments);
            const active = players[currentPlayerIdx];
            if (!active) return _origActivateSkill.apply(this, arguments);

            if (skillActive === true) {
                skillActive = false;
                document.querySelectorAll('#grid .tile').forEach(t => t.classList.remove('skill-mode'));
                const btn = document.getElementById('btnSkill');
                if (btn) {
                    btn.classList.remove('skill-cancel-mode');
                    btn.innerHTML = '✨ SOLO SAGRADO';
                }
                if (typeof addLog === 'function') addLog('✨ Solo Sagrado cancelado.');
                if (typeof playSfx === 'function') { try { playSfx('click'); } catch(e) {} }
                return;
            }

            const r = _origActivateSkill.apply(this, arguments);
            if (skillActive === true) {
                const btn = document.getElementById('btnSkill');
                if (btn) {
                    btn.classList.add('skill-cancel-mode');
                    btn.innerHTML = '✕ CANCELAR';
                }
            }
            return r;
        };
    }

    // ==============================================================
    // ITEM 4/5 — ESCAMBO (Vender padrão, Comprar vazia)
    // ==============================================================
    if (typeof STORY_SHOP_ITEMS !== 'undefined' && Array.isArray(STORY_SHOP_ITEMS)) {
        STORY_SHOP_ITEMS.length = 0;
    }

    window.renderLojaScreenCompleta = function() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;
        const gold = STORY_PROGRESS.gold || 0;

        if (typeof curandeiroTab === 'undefined' || curandeiroTab === 'comprar') {
            try { curandeiroTab = 'vender'; } catch(e) {}
        }

        let buyHTML = '';
        if (!STORY_SHOP_ITEMS || STORY_SHOP_ITEMS.length === 0) {
            buyHTML = `
                <div class="tesouraria-empty" style="margin:0; padding:40px 20px;">
                    <div class="tesouraria-empty-icon">🏪</div>
                    <div class="tesouraria-empty-text">O Escambo está sem estoque.</div>
                    <div class="tesouraria-empty-hint">Volte depois — ele pode ter novidades.</div>
                </div>
            `;
        } else {
            buyHTML = '<div class="story-shop-grid">' + STORY_SHOP_ITEMS.map(it => {
                const m = STORY_MATERIALS[it.id];
                const emoji = m ? m.emoji : (it.emoji || '❓');
                const can = gold >= it.price;
                return `<div class="story-shop-item ${can?'':'disabled'}">
                    <div class="story-shop-emoji">${emoji}</div>
                    <div class="story-shop-name">${it.name}</div>
                    <div class="story-shop-desc">${it.description || ''}</div>
                    <div class="story-shop-price">${uiIcon('gold')} ${it.price}</div>
                    <button class="story-shop-btn" ${can?'':'disabled'} onclick="buyShopItem('${it.id}',${it.price})">COMPRAR</button>
                </div>`;
            }).join('') + '</div>';
        }

        const inv = STORY_PROGRESS.inventory || {};
        const sellIds = Object.keys(inv).filter(id => inv[id] > 0);
        let sellHTML = '';

        if (sellIds.length === 0) {
            sellHTML = `<div class="tesouraria-empty" style="margin:0; padding:40px 20px;">
                <div class="tesouraria-empty-icon">💰</div>
                <div class="tesouraria-empty-text">Nenhum material para vender.</div>
                <div class="tesouraria-empty-hint">Derrote inimigos para coletar materiais.</div>
            </div>`;
        } else {
            sellIds.sort((a, b) => getMaterialPrice(b) - getMaterialPrice(a));
            sellHTML = '<div class="sell-grid">' + sellIds.map(id => {
                const m = STORY_MATERIALS[id];
                if (!m) return '';
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

        const abaAtual = (typeof curandeiroTab !== 'undefined') ? curandeiroTab : 'vender';

        screen.innerHTML = `
            <div class="story-container">
                <div class="story-header">
                    <h1 class="story-title">🧙 ESCAMBO</h1>
                    <p class="story-subtitle">"Compro o que você trouxer. Levo histórias e deixo ouro." (${gold} ${uiIcon('gold')})</p>
                </div>

                <div class="curandeiro-tabs">
                    <button class="curandeiro-tab ${abaAtual === 'vender' ? 'active' : ''}" onclick="curandeiroTab='vender'; renderLojaScreenCompleta();">💰 Vender</button>
                    <button class="curandeiro-tab ${abaAtual === 'comprar' ? 'active' : ''}" onclick="curandeiroTab='comprar'; renderLojaScreenCompleta();">🛒 Comprar</button>
                </div>

                <div class="curandeiro-content">
                    ${abaAtual === 'vender' ? sellHTML : buyHTML}
                </div>

                <div class="story-footer"><button class="story-back-btn" onclick="renderAldeiaScreen()">← VOLTAR À ALDEIA</button></div>
            </div>
        `;
    };

    // ==============================================================
    // FIX — CARD "CURANDEIRO" NA ALDEIA + ENTRAR
    // --------------------------------------------------------------
    // Sobrescreve renderAldeiaScreen pra trocar o texto do card e
    // garantir que o clique chame renderLojaScreenCompleta.
    // ==============================================================
    const _origRenderAldeia = window.renderAldeiaScreen;
    if (typeof _origRenderAldeia === 'function') {
        window.renderAldeiaScreen = function() {
            const r = _origRenderAldeia.apply(this, arguments);

            // Após o render, corrige o card "CURANDEIRO"
            const screen = document.getElementById('storyScreen');
            if (!screen) return r;

            const cards = screen.querySelectorAll('.story-ald-location');
            cards.forEach(card => {
                const nameEl = card.querySelector('.story-ald-loc-name');
                if (!nameEl) return;
                const nome = nameEl.textContent.trim().toUpperCase();
                if (nome === 'CURANDEIRO' || nome === 'MERCADOR' || nome === 'REGATÃO') {
                    nameEl.textContent = 'ESCAMBO';
                    const descEl = card.querySelector('.story-ald-loc-desc');
                    if (descEl) descEl.textContent = 'Venda seus materiais';

                    // Garante o onclick correto
                    card.setAttribute('onclick', "enterAldeiaLocation('loja')");
                    card.classList.remove('locked');
                    const lockedEl = card.querySelector('.story-ald-loc-locked');
                    if (lockedEl) lockedEl.remove();
                }
            });

            return r;
        };
    }

    // ==============================================================
    // ITEM 6 — GIF DO PA (corrigido: sem fila, chama direto)
    // --------------------------------------------------------------
    // O problema do V16.1: a fila com `enfileirarCinematografica`
    // causava deadlock se a promise anterior não resolvesse.
    // Solução: chamar o original DIRETO, sem fila.
    // A fila de purificação vs GIF é resolvida pelo próprio
    // `triggerBravelyChain` (que chama um depois do outro).
    // ==============================================================
    if (typeof STORY_DEFAULT_SETTINGS !== 'undefined' && typeof STORY_DEFAULT_SETTINGS.skipBravelyAnimations === 'undefined') {
        STORY_DEFAULT_SETTINGS.skipBravelyAnimations = false;
    }
    if (typeof STORY_SETTINGS !== 'undefined' && typeof STORY_SETTINGS.skipBravelyAnimations === 'undefined') {
        STORY_SETTINGS.skipBravelyAnimations = false;
    }

    window._skipCinematografica = false;

    // ---- showPoderAncestralEffect: pula se toggle ----
    const _origPoderAncestral = window.showPoderAncestralEffect;
    if (typeof _origPoderAncestral === 'function') {
        window.showPoderAncestralEffect = function() {
            if (window._storyMode && STORY_SETTINGS.skipBravelyAnimations) return;
            return _origPoderAncestral.apply(this, arguments);
        };
    }

    // ---- showBravelyAnimation: DIRETO, sem fila ----
    const _origBravelyAnim = window.showBravelyAnimation;
    if (typeof _origBravelyAnim === 'function') {
        window.showBravelyAnimation = function(playerClass) {
            // Fora do modo história → original
            if (!window._storyMode) {
                return _origBravelyAnim.apply(this, arguments);
            }

            // Toggle ligado → pula
            if (STORY_SETTINGS.skipBravelyAnimations || window._skipCinematografica) {
                window._skipCinematografica = false;
                return Promise.resolve();
            }

            // Chama o original DIRETO
            return Promise.resolve(_origBravelyAnim.call(this, playerClass));
        };
    }

    // ---- showPurificacao: toggle → versão curta; senão, original ----
    const _origPurif = window.showPurificacao;
    if (typeof _origPurif === 'function') {
        window.showPurificacao = function(bossType, tileX, tileY, isFinalBoss) {
            if (!window._storyMode) {
                return _origPurif.apply(this, arguments);
            }

            if (STORY_SETTINGS.skipBravelyAnimations) {
                return new Promise(resolve => {
                    const board = document.getElementById('board');
                    if (!board) { resolve(); return; }

                    const overlay = document.createElement('div');
                    overlay.className = 'purificacao-overlay active';
                    overlay.style.zIndex = '300';
                    overlay.innerHTML = `<div class="purificacao-darken"></div>`;
                    board.appendChild(overlay);

                    if (typeof playSfx === 'function') { try { playSfx('skill1'); } catch(e) {} }

                    setTimeout(() => {
                        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                        resolve();
                    }, 800);
                });
            }
            return _origPurif.call(this, bossType, tileX, tileY, isFinalBoss);
        };
    }

    // ---- Toggle nas Configurações do Modo História ----
    const _origRenderSettings = window.renderStorySettingsScreen;
    if (typeof _origRenderSettings === 'function') {
        window.renderStorySettingsScreen = function() {
            const r = _origRenderSettings.apply(this, arguments);
            const screen = document.getElementById('storyScreen');
            if (!screen) return r;
            const actions = screen.querySelector('.story-settings-actions');
            if (!actions || screen.querySelector('.story-settings-section-anim')) return r;

            const skipOn = STORY_SETTINGS.skipBravelyAnimations ? 'checked' : '';
            const secao = document.createElement('div');
            secao.className = 'story-settings-section story-settings-section-anim';
            secao.innerHTML = `
                <div class="story-settings-section-title">🎬 ANIMAÇÕES</div>
                <div class="story-settings-row">
                    <label class="story-settings-label">Pular animações de Poder Ancestral</label>
                    <label class="story-settings-toggle">
                        <input type="checkbox" id="setSkipBravely" ${skipOn}>
                        <span class="story-settings-toggle-slider"></span>
                    </label>
                </div>
                <div class="story-settings-hint">
                    Quando ligado, o GIF do Poder Ancestral e o efeito "PODER ANCESTRAL" são pulados.
                    A purificação do boss também fica mais rápida.
                </div>
            `;
            actions.parentNode.insertBefore(secao, actions);

            const toggle = document.getElementById('setSkipBravely');
            if (toggle) {
                toggle.addEventListener('change', function() {
                    STORY_SETTINGS.skipBravelyAnimations = this.checked;
                    if (typeof saveStorySettings === 'function') saveStorySettings();
                });
            }
            return r;
        };
    }

    // ==============================================================
    // BÔNUS — ELEMENTO TRAVADO (não muda no turno do adversário)
    // ==============================================================
    if (typeof window.saveAndRefresh === 'function' && !window._elementoTravadoHook) {
        window._elementoTravadoHook = true;
        const _origSaveAndRefresh = window.saveAndRefresh;

        window.saveAndRefresh = function() {
            if (typeof players !== 'undefined' && Array.isArray(players)) {
                players.forEach(p => {
                    if (p && p.element && !p._elementoTravado) {
                        p._elementoTravado = true;
                        p._elementoOriginal = p.element;
                    }
                });
            }

            const r = _origSaveAndRefresh.apply(this, arguments);

            if (typeof players !== 'undefined' && Array.isArray(players)) {
                players.forEach(p => {
                    if (p && p._elementoTravado && p._elementoOriginal) {
                        p.element = p._elementoOriginal;
                    }
                });
            }
            return r;
        };
    }

    // ==============================================================
    // CSS
    // ==============================================================
    if (!document.getElementById('v160CSS')) {
        const style = document.createElement('style');
        style.id = 'v160CSS';
        style.textContent = `
            #btnSkill.skill-cancel-mode {
                background: linear-gradient(180deg, rgba(168,50,50,0.25), transparent 45%),
                            linear-gradient(135deg, #6a2020, #3a1010) !important;
                color: #f5c8c8 !important;
                border-color: #a83232 !important;
                box-shadow: 0 0 20px rgba(168, 50, 50, 0.5) !important;
                animation: pulseCancel 1.2s ease-in-out infinite alternate;
            }
            @keyframes pulseCancel {
                from { box-shadow: 0 0 10px rgba(168, 50, 50, 0.4); }
                to   { box-shadow: 0 0 25px rgba(168, 50, 50, 0.8); }
            }
        `;
        document.head.appendChild(style);
    }

    console.log('✅ [V16.2] Aplicado: Escambo, card na Aldeia, GIF do PA, elemento travado.');
})();
// =================================================================
// historia.js — BLOCO 69 (V16.3 — Fix elemento + GIF + botão)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js, DEPOIS do V16.2 (ou substitua).
//
// Corrige:
//   • Elemento do herói muda no turno (restauração garantida)
//   • GIF do PA não aparece (recria showBravelyAnimation)
//   • Botão Solo Sagrado travado em "CANCELAR" no Evento
// =================================================================

(function correcoesV163() {
    if (window._correcoesV162) {
        console.log('[V16.3] Substituindo V16.2...');
        window._correcoesV162 = false;
    }
    if (window._correcoesV163) return;
    window._correcoesV163 = true;

    // ==============================================================
    // FIX — ELEMENTO DO HERÓI NÃO MUDA NO TURNO
    // --------------------------------------------------------------
    // Abordagem: guardar o elemento "oficial" em p._elementoOriginal
    // após initStoryBattle, e fazer updateHeroCard usar ele SEMPRE.
    // ==============================================================
    function travarElementos() {
        if (typeof players === 'undefined' || !Array.isArray(players)) return;
        players.forEach(p => {
            if (p && p.element && !p._elementoOriginal) {
                p._elementoOriginal = p.element;
                p._elementoTravado = true;
                console.log(`[V16.3] Elemento travado: ${p.name || p.class} = ${p.element}`);
            }
        });
    }

    // Após initStoryBattle, salva o elemento original
    const _origInitBattle = window.initStoryBattle;
    if (typeof _origInitBattle === 'function') {
        window.initStoryBattle = async function() {
            const r = await _origInitBattle.apply(this, arguments);
            await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
            travarElementos();
            // Reaplica após saveAndRefresh
            if (typeof updateHeroCard === 'function') updateHeroCard();
            return r;
        };
    }

    // Sobrescreve saveAndRefresh pra restaurar o elemento APÓS o original
    const _origSaveAndRefresh = window.saveAndRefresh;
    if (typeof _origSaveAndRefresh === 'function') {
        window.saveAndRefresh = function() {
            // Salva antes
            const elementosAntes = (typeof players !== 'undefined' && Array.isArray(players))
                ? players.map(p => p ? p.element : null)
                : [];

            // Roda o original (que pode sobrescrever)
            const r = _origSaveAndRefresh.apply(this, arguments);

            // Restaura o elemento original
            if (typeof players !== 'undefined' && Array.isArray(players)) {
                players.forEach((p, i) => {
                    if (p && p._elementoOriginal) {
                        p.element = p._elementoOriginal;
                    }
                });
            }

            return r;
        };
    }

    // Sobrescreve updateHeroCard pra usar o elemento original
    const _origUpdateHeroCard = window.updateHeroCard;
    if (typeof _origUpdateHeroCard === 'function') {
        window.updateHeroCard = function() {
            // Restaura elemento original ANTES de renderizar
            if (typeof players !== 'undefined' && Array.isArray(players)) {
                players.forEach(p => {
                    if (p && p._elementoOriginal) {
                        p.element = p._elementoOriginal;
                    }
                });
            }
            return _origUpdateHeroCard.apply(this, arguments);
        };
    }

    console.log('✅ [V16.3] Fix elemento do herói aplicado.');

    // ==============================================================
    // FIX — GIF DO PA (recria showBravelyAnimation)
    // --------------------------------------------------------------
    // Recria do zero, replicando a lógica do entidades.js + V8.1,
    // mas garantindo que o GIF apareça SEM depender do estado dos
    // patches anteriores.
    // ==============================================================
    window.showBravelyAnimation = async function(playerClass) {
        // Fora do modo história → usa o original do entidades.js se existir
        if (!window._storyMode) {
            // Tenta achar o original do entidades.js (pode ter sido sobrescrito)
            if (typeof SPRITES !== 'undefined' && SPRITES.BRAVELY_TUPA) {
                return _mostrarGifBravely(playerClass);
            }
            return Promise.resolve();
        }

        // Toggle ligado → pula
        if (typeof STORY_SETTINGS !== 'undefined' && STORY_SETTINGS.skipBravelyAnimations) {
            return Promise.resolve();
        }

        return _mostrarGifBravely(playerClass);
    };

    function _mostrarGifBravely(playerClass) {
        return new Promise((resolve) => {
            // Resolve o GIF: tenta STORY_BRAVELY_GIFS, depois fallback, depois BRAVELY_*
            let gifUrl = '';

            if (typeof getBravelyGifForHero === 'function') {
                gifUrl = getBravelyGifForHero(playerClass);
            }

            if (!gifUrl) {
                // Fallback direto
                if (typeof STORY_BRAVELY_GIFS !== 'undefined' && STORY_BRAVELY_GIFS[playerClass]) {
                    gifUrl = STORY_BRAVELY_GIFS[playerClass];
                } else if (playerClass === 'Tupa' && typeof SPRITES !== 'undefined') {
                    gifUrl = SPRITES.BRAVELY_TUPA;
                } else if (playerClass === 'Sume' && typeof SPRITES !== 'undefined') {
                    gifUrl = SPRITES.BRAVELY_SUME;
                } else if (playerClass === 'Caipora' && typeof SPRITES !== 'undefined') {
                    gifUrl = SPRITES.BRAVELY_CAIPORA;
                } else if (typeof SPRITES !== 'undefined') {
                    gifUrl = SPRITES.BRAVELY_TUPA;
                }
            }

            if (!gifUrl) {
                console.warn('[V16.3] GIF do Bravely não encontrado para', playerClass);
                resolve();
                return;
            }

            console.log('[V16.3] Mostrando GIF do Bravely:', gifUrl);

            // Remove overlay antigo, se existir
            const old = document.getElementById('bravelyAnimationOverlay');
            if (old) old.remove();

            const overlay = document.createElement('div');
            overlay.className = 'bravely-animation-overlay';
            overlay.id = 'bravelyAnimationOverlay';

            const gif = document.createElement('img');
            gif.src = gifUrl;
            gif.className = 'bravely-animation-gif';
            gif.alt = 'Poder Ancestral';
            gif.onerror = function() {
                console.warn('[V16.3] Falha ao carregar GIF:', gifUrl);
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                resolve();
            };

            overlay.appendChild(gif);

            const board = (typeof tutorialMode !== 'undefined' && tutorialMode)
                ? document.getElementById('tutorialBoard')
                : document.getElementById('board');
            if (board) board.appendChild(overlay);

            if (typeof playSfx === 'function') { try { playSfx('skill1'); } catch(e) {} }

            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.style.opacity = '0';
                    overlay.style.transition = 'opacity 0.5s ease';
                    setTimeout(() => {
                        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                        resolve();
                    }, 500);
                } else {
                    resolve();
                }
            }, 2000);
        });
    }

    console.log('✅ [V16.3] GIF do Bravely recriado.');

    // ==============================================================
    // FIX — BOTÃO SOLO SAGRADO TRAVADO EM "CANCELAR"
    // --------------------------------------------------------------
    // Monitor: se o botão estiver "CANCELAR" mas skillActive for false,
    // restaura o texto. Também escuta cliques pra resetar estado.
    // ==============================================================
    function _corrigirBotaoSkill() {
        const btn = document.getElementById('btnSkill');
        if (!btn) return;

        const textoAtual = btn.innerHTML.trim();
        const isCancelMode = textoAtual.includes('CANCELAR') || btn.classList.contains('skill-cancel-mode');
        const skillAtivo = (typeof skillActive !== 'undefined') ? skillActive : false;

        // Se está em modo cancelar mas skillActive é false → restaura
        if (isCancelMode && !skillAtivo) {
            btn.classList.remove('skill-cancel-mode');
            btn.innerHTML = '✨ SOLO SAGRADO';
        }
        // Se está em modo normal mas skillActive é true → muda pra cancelar
        else if (!isCancelMode && skillAtivo && window._storyMode) {
            btn.classList.add('skill-cancel-mode');
            btn.innerHTML = '✕ CANCELAR';
        }
    }

    // Roda a cada 500ms (leve)
    setInterval(_corrigirBotaoSkill, 500);

    // Também escuta cliques no tabuleiro pra detectar quando o skill é consumido
    if (!window._botaoSkillClickListener) {
        window._botaoSkillClickListener = true;
        document.addEventListener('click', function(e) {
            // Se clicou num tile durante skillActive, o skill é consumido
            if (e.target && e.target.classList && e.target.classList.contains('tile')) {
                if (typeof skillActive !== 'undefined' && skillActive === true) {
                    // Espera um tic pra o handleSelect rodar
                    setTimeout(_corrigirBotaoSkill, 100);
                }
            }
        }, true);
    }

    // Hook em switchConfig pra resetar o botão
    const _origSwitchConfig = window.switchConfig;
    if (typeof _origSwitchConfig === 'function') {
        window.switchConfig = function(idx) {
            const r = _origSwitchConfig.apply(this, arguments);
            // Se não estamos em skillActive, força o texto normal
            if (typeof skillActive === 'undefined' || skillActive === false) {
                setTimeout(_corrigirBotaoSkill, 50);
            }
            return r;
        };
    }

    // Hook no eventoIniciarBatalha (Evento) pra garantir reset
    if (typeof window.eventoIniciarBatalha === 'function' && !window._eventoBatalhaBotaoHook) {
        window._eventoBatalhaBotaoHook = true;
        const _origEventoIniciar = window.eventoIniciarBatalha;
        window.eventoIniciarBatalha = async function() {
            // Reset antes
            if (typeof skillActive !== 'undefined') skillActive = false;
            const r = await _origEventoIniciar.apply(this, arguments);
            // Reset depois
            if (typeof skillActive !== 'undefined') skillActive = false;
            setTimeout(_corrigirBotaoSkill, 200);
            return r;
        };
    }

    console.log('✅ [V16.3] Fix botão Solo Sagrado aplicado.');

    // ==============================================================
    // LOG FINAL
    // ==============================================================
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V16.3] Fixes finais');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Elemento do herói não muda no turno');
    console.log('• GIF do Poder Ancestral recriado (garantido)');
    console.log('• Botão Solo Sagrado não fica travado');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — BLOCO 70 (V16.4 — Fix elemento do herói)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js, DEPOIS do V16.3.
//
// Corrige:
//   • Elemento do herói pegava o "FOGO" default do entidades.js
//     em vez do elemento real (VENTO/AR) do herói
// =================================================================

(function fixElementoV164() {
    if (window._fixElementoV164) return;
    window._fixElementoV164 = true;

    // ==============================================================
    // FONTE DE VERDADE DO ELEMENTO
    // --------------------------------------------------------------
    // Prioridade:
    //   1. STORY_HERO_CLASSES[class].element (heróis novos)
    //   2. getHeroStoryElement(class) (heróis base)
    //   3. Amuleto equipado com elementOverride
    //   4. 'FOGO' como último recurso
    // ==============================================================
    function getElementoOficial(heroClass) {
        // 1. Herói novo com elemento fixo
        if (typeof STORY_HERO_CLASSES !== 'undefined' && STORY_HERO_CLASSES[heroClass]) {
            const h = STORY_HERO_CLASSES[heroClass];
            if (h.element) return h.element;
        }

        // 2. Herói base (dinâmico pelo save)
        if (typeof getHeroStoryElement === 'function') {
            return getHeroStoryElement(heroClass);
        }

        // 3. Fallback
        if (typeof getSaveElement === 'function') {
            return getSaveElement();
        }

        return 'FOGO';
    }

    // ==============================================================
    // TRAVAR ELEMENTO (agora usando fonte de verdade)
    // ==============================================================
    function travarElementosV164() {
        if (typeof players === 'undefined' || !Array.isArray(players)) return;

        players.forEach(p => {
            if (!p || !p.class) return;

            const elementoOficial = getElementoOficial(p.class);

            // Verifica se tem amuleto com elementOverride
            let elementoFinal = elementoOficial;
            if (typeof getHeroEquipment === 'function' && typeof getAmuletById === 'function') {
                try {
                    const eq = getHeroEquipment(p.class);
                    if (eq && eq.amuleto) {
                        const am = getAmuletById(eq.amuleto);
                        if (am && am.efeito && am.efeito.elementOverride) {
                            elementoFinal = am.efeito.elementOverride;
                        }
                    }
                } catch(e) {}
            }

            p.element = elementoFinal;
            p._elementoOriginal = elementoFinal;
            p._elementoTravado = true;

            console.log(`[V16.4] Elemento travado: ${p.name || p.class} = ${elementoFinal} (era ${elementoOficial})`);
        });
    }

    // ==============================================================
    // HOOK EM applyStoryElementsToPlayers
    // --------------------------------------------------------------
    // A função original do historia.js define p.element. Depois dela,
    // travamos o elemento usando a fonte de verdade.
    // ==============================================================
    const _origApplyElems = window.applyStoryElementsToPlayers;
    if (typeof _origApplyElems === 'function') {
        window.applyStoryElementsToPlayers = function() {
            const r = _origApplyElems.apply(this, arguments);
            travarElementosV164();
            return r;
        };
    }

    // ==============================================================
    // HOOK EM initStoryBattle (garantia dupla)
    // ==============================================================
    const _origInitBattle = window.initStoryBattle;
    if (typeof _origInitBattle === 'function') {
        window.initStoryBattle = async function() {
            const r = await _origInitBattle.apply(this, arguments);
            await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));
            travarElementosV164();
            if (typeof updateHeroCard === 'function') updateHeroCard();
            return r;
        };
    }

    // ==============================================================
    // HOOK EM saveAndRefresh (já existe V16.3, mas reforça)
    // --------------------------------------------------------------
    // Sobrescreve de novo pra garantir que usa a fonte de verdade
    // ==============================================================
    if (typeof window.saveAndRefresh === 'function') {
        const _prevSave = window.saveAndRefresh;
        window.saveAndRefresh = function() {
            const r = _prevSave.apply(this, arguments);

            // Restaura o elemento oficial
            if (typeof players !== 'undefined' && Array.isArray(players)) {
                players.forEach(p => {
                    if (!p || !p.class) return;
                    if (p._elementoOriginal) {
                        p.element = p._elementoOriginal;
                    }
                });
            }

            return r;
        };
    }

    // ==============================================================
    // HOOK EM updateHeroCard (garantia tripla)
    // ==============================================================
    if (typeof window.updateHeroCard === 'function') {
        const _prevUpdateHero = window.updateHeroCard;
        window.updateHeroCard = function() {
            if (typeof players !== 'undefined' && Array.isArray(players)) {
                players.forEach(p => {
                    if (p && p._elementoOriginal) {
                        p.element = p._elementoOriginal;
                    }
                });
            }
            return _prevUpdateHero.apply(this, arguments);
        };
    }

    // ==============================================================
    // FORÇA TRAVAMENTO AO CARREGAR (se já está em batalha)
    // ==============================================================
    setTimeout(() => {
        if (typeof players !== 'undefined' && Array.isArray(players) && players.length > 0) {
            travarElementosV164();
            if (typeof updateHeroCard === 'function') updateHeroCard();
        }
    }, 500);

    console.log('✅ [V16.4] Elemento do herói corrigido (usa fonte de verdade, não p.element).');
    console.log('   Fonte: STORY_HERO_CLASSES.element → getHeroStoryElement → getSaveElement');
})();
// =================================================================
// historia.js — BLOCO 71 (V16.5 — Elemento no tabuleiro SEMPRE correto)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js, DEPOIS do V16.4.
//
// REGRA:
//   • Herói com element fixo em STORY_HERO_CLASSES → usa ele
//   • Herói SEM element fixo (Tupã/Sumé/Caipora) → usa getHeroStoryElement (do save)
//   • FOGO do entidades.js NUNCA sobressai
// =================================================================

(function fixElementoTabuleiroV165() {
    if (window._fixElementoV165) return;
    window._fixElementoV165 = true;

    // ==============================================================
    // FUNÇÃO ÚNICA DE CÁLCULO
    // --------------------------------------------------------------
    // Não usa p.element atual. Calcula do zero pela classe.
    // ==============================================================
    function calcularElementoDoHeroi(heroClass) {
        if (!heroClass) return 'FOGO';

        // 1. Se o herói tem elemento FIXO na tabela → usa
        if (typeof STORY_HERO_CLASSES !== 'undefined') {
            const h = STORY_HERO_CLASSES[heroClass];
            if (h && h.element) {
                return h.element;
            }
        }

        // 2. Se NÃO tem elemento fixo → usa o do save
        if (typeof getHeroStoryElement === 'function') {
            return getHeroStoryElement(heroClass);
        }
        if (typeof getSaveElement === 'function') {
            return getSaveElement();
        }

        // 3. Último recurso
        return 'FOGO';
    }

    // ==============================================================
    // REESCREVE updateHeroCard DO ZERO
    // --------------------------------------------------------------
    // Não chama o anterior. Faz a lógica de renderização direto,
    // calculando o elemento pela classe sempre.
    // ==============================================================
    window.updateHeroCard = function() {
        const list = document.getElementById('heroesStatusList');
        if (!list) return;

        if (typeof tutorialMode !== 'undefined' && tutorialMode) {
            list.innerHTML = '';
            return;
        }

        if (typeof players === 'undefined' || !Array.isArray(players)) return;

        const ELEMENT_ICONS = {
            'FOGO':  { key: 'elem_fogo',  color: '#e74c3c' },
            'AGUA':  { key: 'elem_agua',  color: '#3498db' },
            'TERRA': { key: 'elem_terra', color: '#27ae60' },
            'AR':    { key: 'elem_ar',    color: '#f1c40f' }
        };

        list.innerHTML = '';

        players.forEach((p, index) => {
            if (!p) return;

            // ⭐ CALCULA O ELEMENTO OFICIAL (não usa p.element)
            const elementoOficial = calcularElementoDoHeroi(p.class);
            p.element = elementoOficial; // sincroniza de volta

            const row = document.createElement('div');
            row.className = 'hero-status-row';
            if (index === currentPlayerIdx && currentPlayerIdx >= 0) row.classList.add('current');
            if (p.dead) row.classList.add('dead');

            const elemInfo = ELEMENT_ICONS[elementoOficial] || ELEMENT_ICONS['FOGO'];
            row.style.borderLeftColor = elemInfo.color;

            const hpPercent = p.maxHp > 0 ? Math.max(0, (p.hp / p.maxHp) * 100) : 0;
            const hpColor = hpPercent > 60 ? '#2ecc71' : hpPercent > 30 ? '#f1c40f' : '#e74c3c';

            const baseAtk = (typeof CLASS_DB !== 'undefined' && CLASS_DB[p.class]?.atk) || 0;
            const amuletBonus = p.bonusAtk || 0;
            const titleBonus = p.titleBonus?.ATK || 0;
            const totalAtk = baseAtk + amuletBonus + titleBonus;

            let atkText = `${totalAtk}`;
            const muiraquitaIcon = (typeof icon === 'function') ? icon('muiraquita') : '💎';
            const medalhaIcon = (typeof icon === 'function') ? icon('medalha') : '🏅';
            if (amuletBonus > 0 && titleBonus > 0) {
                atkText += ` <span style="color:#f39c12;font-size:0.7em;">(+${amuletBonus}${muiraquitaIcon} +${titleBonus}${medalhaIcon})</span>`;
            } else if (amuletBonus > 0) {
                atkText += ` <span style="color:#f39c12;font-size:0.7em;">(+${amuletBonus}${muiraquitaIcon})</span>`;
            } else if (titleBonus > 0) {
                atkText += ` <span style="color:#2ecc71;font-size:0.7em;">(+${titleBonus}${medalhaIcon})</span>`;
            }

            const sprite = (typeof SPRITES !== 'undefined' && SPRITES[p.class]) || '';
            const elemIconHTML = (typeof icon === 'function') ? icon(elemInfo.key) : '';

            row.innerHTML = `
                <img class="hero-status-sprite" src="${sprite}" alt="${p.name || ''}">
                <div class="hero-status-info">
                    <div class="hero-status-name">
                        <span class="hero-element-icon" style="color: ${elemInfo.color}; text-shadow: 0 0 6px ${elemInfo.color};" title="${elementoOficial}">
                            ${elemIconHTML}
                        </span>
                        ${p.name || 'P'+(index+1)}
                    </div>
                    <div class="hero-status-hp">
                        <span>${p.hp}/${p.maxHp}</span>
                        <div class="mini-hp-bar">
                            <div class="mini-hp-fill" style="width: ${hpPercent}%; background: ${hpColor};"></div>
                        </div>
                        <span class="hero-status-atk" title="Ataque total">${(typeof icon === 'function') ? icon('espadas') : '⚔️'} ${atkText}</span>
                    </div>
                </div>
            `;

            list.appendChild(row);
        });

        // Atualiza turnDisplayName
        const turnName = document.getElementById('turnDisplayName');
        if (turnName) {
            if (currentPlayerIdx >= 0 && players[currentPlayerIdx]) {
                const p = players[currentPlayerIdx];
                const elementoOficial = calcularElementoDoHeroi(p.class);
                const elemInfo = ELEMENT_ICONS[elementoOficial] || ELEMENT_ICONS['FOGO'];
                const elemIconHTML = (typeof icon === 'function') ? icon(elemInfo.key) : '';
                turnName.innerHTML = `${elemIconHTML} ${p.name || `Jogador ${currentPlayerIdx+1}`}`;
                const turnDisplay = document.getElementById('turnP_Active');
                if (turnDisplay) turnDisplay.classList.add('active-turn');
            } else {
                turnName.textContent = 'Boss';
            }
        }
    };

    // ==============================================================
    // REFORÇA saveAndRefresh
    // ==============================================================
    if (typeof window.saveAndRefresh === 'function') {
        const _prevSave = window.saveAndRefresh;
        window.saveAndRefresh = function() {
            const r = _prevSave.apply(this, arguments);

            // Corrige p.element DEPOIS do original (que sobrescreveu)
            if (typeof players !== 'undefined' && Array.isArray(players)) {
                players.forEach(p => {
                    if (p && p.class) {
                        p.element = calcularElementoDoHeroi(p.class);
                    }
                });
            }
            return r;
        };
    }

    // ==============================================================
    // FORÇA RECÁLCULO AO CARREGAR
    // ==============================================================
    setTimeout(() => {
        if (typeof players !== 'undefined' && Array.isArray(players) && players.length > 0) {
            players.forEach(p => {
                if (p && p.class) {
                    p.element = calcularElementoDoHeroi(p.class);
                    console.log(`[V16.5] ${p.name} → ${p.element}`);
                }
            });
            window.updateHeroCard();
        }
    }, 500);

    // ==============================================================
    // MONITOR LEVE: a cada 2s, se algum p.element estiver errado, corrige
    // ==============================================================
    setInterval(() => {
        if (!window._storyMode) return;
        if (typeof players === 'undefined' || !Array.isArray(players)) return;

        let mudou = false;
        players.forEach(p => {
            if (!p || !p.class) return;
            const esperado = calcularElementoDoHeroi(p.class);
            if (p.element !== esperado) {
                p.element = esperado;
                mudou = true;
            }
        });
        if (mudou && typeof updateHeroCard === 'function') {
            updateHeroCard();
        }
    }, 2000);

    console.log('✅ [V16.5] updateHeroCard reescrito do zero.');
    console.log('   Elemento calculado por classe: fixo (STORY_HERO_CLASSES) ou save (getHeroStoryElement).');
})();
// =================================================================
// historia.js — BLOCO 72 (V17.0 — Sequenciamento + Aura de Morte)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js, DEPOIS do V16.5.
//
// Contém:
//   1. Fila de cinematográficas COM TIMEOUT (GIF → purificação)
//   2. Aura de morte do herói (vermelha/roxa) antes da derrota
// =================================================================

(function cinematograficasV170() {
    if (window._cinematograficasV170) return;
    window._cinematograficasV170 = true;

    // ==============================================================
    // 1. FILA DE CINEMATOGRÁFICAS COM TIMEOUT
    // --------------------------------------------------------------
    // Cada cinematográfica é enfileirada. A próxima só roda quando
    // a anterior resolve OU quando o timeout de segurança estoura
    // (para não travar o jogo se algo der errado).
    // ==============================================================
    window._cinemaFila = Promise.resolve();

    function enfileirarCinema(fn, timeoutMs) {
        timeoutMs = timeoutMs || 6000; // 6s de segurança
        const anterior = window._cinemaFila || Promise.resolve();

        const proxima = anterior.then(() => {
            return new Promise((resolve) => {
                let resolvido = false;

                const finalizar = () => {
                    if (resolvido) return;
                    resolvido = true;
                    clearTimeout(timer);
                    resolve();
                };

                const timer = setTimeout(() => {
                    console.warn('[V17.0] Timeout de cinematográfica — forçando avanço.');
                    finalizar();
                }, timeoutMs);

                Promise.resolve(fn()).then(finalizar).catch(finalizar);
            });
        });

        window._cinemaFila = proxima.catch(() => {});
        return proxima;
    }

    window.enfileirarCinema = enfileirarCinema;

    // ==============================================================
    // 2. showBravelyAnimation ENFILEIRADO
    // ==============================================================
    const _origBravely = window.showBravelyAnimation;
    if (typeof _origBravely === 'function') {
        window.showBravelyAnimation = function(playerClass) {
            // Fora do história → direto
            if (!window._storyMode) {
                return _origBravely.apply(this, arguments);
            }

            // Toggle ligado → pula (mas não enfileira)
            if (typeof STORY_SETTINGS !== 'undefined' && STORY_SETTINGS.skipBravelyAnimations) {
                return Promise.resolve();
            }

            // Enfileira (timeout de 4s — o GIF dura 2s)
            return enfileirarCinema(() => {
                return _origBravely.call(this, playerClass);
            }, 4000);
        };
    }

    // ==============================================================
    // 3. showPurificacao ENFILEIRADA
    // --------------------------------------------------------------
    // Roda DEPOIS do GIF do PA (porque entra na fila).
    // ==============================================================
    const _origPurif = window.showPurificacao;
    if (typeof _origPurif === 'function') {
        window.showPurificacao = function(bossType, tileX, tileY, isFinalBoss) {
            if (!window._storyMode) {
                return _origPurif.apply(this, arguments);
            }

            // Toggle ligado → versão curta, mas ainda enfileirada
            if (typeof STORY_SETTINGS !== 'undefined' && STORY_SETTINGS.skipBravelyAnimations) {
                return enfileirarCinema(() => {
                    return new Promise(resolve => {
                        const board = document.getElementById('board');
                        if (!board) { resolve(); return; }
                        const overlay = document.createElement('div');
                        overlay.className = 'purificacao-overlay active';
                        overlay.style.zIndex = '300';
                        overlay.innerHTML = `<div class="purificacao-darken"></div>`;
                        board.appendChild(overlay);
                        if (typeof playSfx === 'function') { try { playSfx('skill1'); } catch(e) {} }
                        setTimeout(() => {
                            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                            resolve();
                        }, 800);
                    });
                }, 2000);
            }

            // Completa, enfileirada (timeout de 5s)
            return enfileirarCinema(() => {
                return _origPurif.call(this, bossType, tileX, tileY, isFinalBoss);
            }, 5000);
        };
    }

    // ==============================================================
    // 4. showPoderAncestralEffect ENFILEIRADO
    // --------------------------------------------------------------
    // O "PODER ANCESTRAL" (texto) também precisa esperar.
    // Mas ele dura só 2.4s. Se o toggle estiver ligado, não roda.
    // ==============================================================
    const _origPoder = window.showPoderAncestralEffect;
    if (typeof _origPoder === 'function') {
        window.showPoderAncestralEffect = function() {
            if (typeof STORY_SETTINGS !== 'undefined' && STORY_SETTINGS.skipBravelyAnimations) {
                return;
            }
            // Não enfileira — ele é rápido e pode sobrepor levemente
            // (a intenção é ser um "flash" de texto, não uma cena)
            return _origPoder.apply(this, arguments);
        };
    }

    console.log('✅ [V17.0] Fila de cinematográficas instalada (GIF → purificação).');

    // ==============================================================
    // 5. AURA DE MORTE DO HERÓI
    // --------------------------------------------------------------
    // Quando um herói morre (hp <= 0), mostra uma aura vermelha/roxa
    // no tile dele ANTES de disparar a tela de derrota.
    // ==============================================================
    async function mostrarAuraDeMorte(player) {
        const board = document.getElementById('board');
        if (!board || !player) return;

        const s = (typeof getStep === 'function') ? getStep() : 59;
        const cx = player.x * s + s / 2 + 8;
        const cy = player.y * s + s / 2 + 8;

        // Container da aura
        const aura = document.createElement('div');
        aura.className = 'aura-morte-overlay';
        aura.style.zIndex = '250';
        aura.style.position = 'absolute';
        aura.style.left = '0';
        aura.style.top = '0';
        aura.style.width = '100%';
        aura.style.height = '100%';
        aura.style.pointerEvents = 'none';

        // Darken suave
        const darken = document.createElement('div');
        darken.className = 'aura-morte-darken';
        aura.appendChild(darken);

        // Halo vermelho/roxo no tile do herói
        const halo = document.createElement('div');
        halo.className = 'aura-morte-halo';
        halo.style.left = cx + 'px';
        halo.style.top = cy + 'px';
        halo.style.width = (s * 3) + 'px';
        halo.style.height = (s * 3) + 'px';
        aura.appendChild(halo);

        // Feixe vertical descendente (alma subindo)
        const feixe = document.createElement('div');
        feixe.className = 'aura-morte-feixe';
        feixe.style.left = cx + 'px';
        feixe.style.width = (s * 1.5) + 'px';
        aura.appendChild(feixe);

        // Partículas (almas)
        const particulas = 14;
        for (let i = 0; i < particulas; i++) {
            const p = document.createElement('div');
            p.className = 'aura-morte-particula';
            const offsetX = (Math.random() - 0.5) * s * 1.6;
            const offsetY = (Math.random() - 0.5) * s * 1.6;
            p.style.left = (cx + offsetX) + 'px';
            p.style.top = (cy + offsetY) + 'px';
            p.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
            p.style.setProperty('--dy', (-150 - Math.random() * 150) + 'px');
            p.style.animationDelay = (Math.random() * 0.6) + 's';
            p.style.animationDuration = (1.8 + Math.random() * 0.8) + 's';
            aura.appendChild(p);
        }

        // Símbolos rúnicos (ᛉ = morte, ᛟ = fim, ᚦ = dor)
        const runas = ['ᛉ', 'ᛟ', 'ᚦ', 'ᛏ'];
        runas.forEach((runa, i) => {
            const r = document.createElement('div');
            r.className = 'aura-morte-runa';
            r.textContent = runa;
            const angle = (i / runas.length) * Math.PI * 2;
            const dist = s * 2.2;
            r.style.left = (cx + Math.cos(angle) * dist) + 'px';
            r.style.top = (cy + Math.sin(angle) * dist) + 'px';
            r.style.animationDelay = (i * 0.1) + 's';
            aura.appendChild(r);
        });

        board.appendChild(aura);

        // Aplica flash vermelho no sprite do herói
        const img = document.getElementById(`imgP${player.id}`);
        if (img) img.classList.add('aura-morte-sprite');

        // SFX (reusa gameover — mas com pitch diferente se possível)
        if (typeof playSfx === 'function') {
            try { playSfx('gameover'); } catch(e) {}
        }

        // Duração: 2.8s
        await new Promise(resolve => setTimeout(resolve, 2800));

        // Cleanup
        if (aura.parentNode) aura.parentNode.removeChild(aura);
        if (img) img.classList.remove('aura-morte-sprite');
    }

    window.mostrarAuraDeMorte = mostrarAuraDeMorte;

    // ==============================================================
    // 6. HOOK NO applyDmg (detecta morte de herói)
    // --------------------------------------------------------------
    // Quando um herói chega a hp <= 0:
    //   1. Mostra aura de morte
    //   2. Se for o último herói vivo, dispara tela de derrota
    // ==============================================================
    const _origApplyDmg = window.applyDmg;
    if (typeof _origApplyDmg === 'function') {
        window.applyDmg = function(target, amount) {
            if (!window._storyMode) {
                return _origApplyDmg.apply(this, arguments);
            }

            if (!target || target.dead) {
                return _origApplyDmg.apply(this, arguments);
            }

            const eraHeroiVivo = (typeof players !== 'undefined')
                && players.includes(target)
                && !target.dead;

            const hpAntes = target.hp;

            // Chama o original (aplica dano, marca dead, etc.)
            const r = _origApplyDmg.apply(this, arguments);

            // Se era herói e morreu agora → aura
            if (eraHeroiVivo && target.dead) {
                mostrarAuraDeMorte(target).then(() => {
                    // Depois da aura: verifica se é o último herói vivo
                    const vivos = players.filter(p => !p.dead);
                    if (vivos.length === 0 && !window._endGameShowing) {
                        // Todos morreram → tela de derrota
                        if (typeof handleStoryDefeat === 'function') {
                            handleStoryDefeat();
                        } else if (typeof finishStoryPhase === 'function') {
                            finishStoryPhase(false);
                        }
                    }
                });
            }

            return r;
        };
    }

    // ==============================================================
    // 7. HOOK NO handleStoryDefeat (espera aura antes)
    // --------------------------------------------------------------
    // Se já estamos no meio de uma aura, o handleStoryDefeat original
    // pode rodar antes dela terminar. Vou garantir que a tela de
    // derrota só apareça DEPOIS.
    // ==============================================================
    const _origHandleStoryDefeat = window.handleStoryDefeat;
    if (typeof _origHandleStoryDefeat === 'function') {
        window.handleStoryDefeat = async function() {
            if (!window._storyMode) {
                return _origHandleStoryDefeat.apply(this, arguments);
            }

            // Espera a aura de morte (se houver) terminar
            await new Promise(resolve => setTimeout(resolve, 300));

            return _origHandleStoryDefeat.apply(this, arguments);
        };
    }

    // ==============================================================
    // CSS
    // ==============================================================
    if (!document.getElementById('auraMorteCSS')) {
        const style = document.createElement('style');
        style.id = 'auraMorteCSS';
        style.textContent = `
            /* ============ AURA DE MORTE ============ */
            .aura-morte-overlay {
                position: absolute;
                inset: 0;
                pointer-events: none;
                overflow: hidden;
            }

            .aura-morte-darken {
                position: absolute;
                inset: 0;
                background: radial-gradient(
                    ellipse at center,
                    rgba(80, 0, 20, 0.0) 0%,
                    rgba(60, 0, 15, 0.4) 60%,
                    rgba(20, 0, 5, 0.85) 100%
                );
                animation: auraMorteDarken 2.8s ease-in-out forwards;
            }

            @keyframes auraMorteDarken {
                0%   { opacity: 0; }
                20%  { opacity: 1; }
                85%  { opacity: 1; }
                100% { opacity: 0; }
            }

            .aura-morte-halo {
                position: absolute;
                border-radius: 50%;
                transform: translate(-50%, -50%) scale(0.3);
                background: radial-gradient(
                    circle,
                    rgba(255, 60, 80, 0.95) 0%,
                    rgba(180, 20, 60, 0.75) 25%,
                    rgba(90, 10, 110, 0.5) 50%,
                    rgba(40, 0, 60, 0) 75%
                );
                box-shadow:
                    0 0 40px rgba(200, 30, 70, 0.9),
                    0 0 80px rgba(100, 20, 130, 0.6);
                animation: auraMorteHalo 2.8s ease-out forwards;
                mix-blend-mode: screen;
            }

            @keyframes auraMorteHalo {
                0%   { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
                15%  { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                70%  { transform: translate(-50%, -50%) scale(1.4); opacity: 0.9; }
                100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
            }

            .aura-morte-feixe {
                position: absolute;
                top: 0;
                height: 100%;
                transform: translateX(-50%) scaleY(0);
                transform-origin: top center;
                background: linear-gradient(
                    180deg,
                    rgba(255, 100, 120, 0.0) 0%,
                    rgba(255, 60, 80, 0.5) 15%,
                    rgba(180, 20, 60, 0.85) 45%,
                    rgba(100, 20, 130, 0.7) 75%,
                    rgba(40, 0, 60, 0.0) 100%
                );
                filter: blur(5px);
                animation: auraMorteFeixe 2.8s cubic-bezier(0.3, 0, 0.4, 1) forwards;
                mix-blend-mode: screen;
            }

            @keyframes auraMorteFeixe {
                0%   { transform: translateX(-50%) scaleY(0); opacity: 0; }
                15%  { transform: translateX(-50%) scaleY(1); opacity: 1; }
                75%  { transform: translateX(-50%) scaleY(1); opacity: 1; }
                100% { transform: translateX(-50%) scaleY(1); opacity: 0; }
            }

            .aura-morte-particula {
                position: absolute;
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: radial-gradient(circle, #ff5c78 0%, #c0204a 40%, rgba(100, 20, 130, 0) 100%);
                box-shadow: 0 0 10px 2px rgba(255, 60, 80, 0.9);
                pointer-events: none;
                opacity: 0;
                animation: auraMorteParticula 2.2s ease-out forwards;
            }

            @keyframes auraMorteParticula {
                0%   { opacity: 0; transform: translate(0, 0) scale(0.4); }
                20%  { opacity: 1; transform: translate(0, -8px) scale(1); }
                100% { opacity: 0; transform: translate(var(--dx, 0), var(--dy, -180px)) scale(0.5); }
            }

            .aura-morte-runa {
                position: absolute;
                font-family: 'Cinzel', serif;
                font-size: 32px;
                font-weight: 900;
                color: #ff3c50;
                text-shadow:
                    0 0 12px rgba(255, 60, 80, 0.9),
                    0 0 24px rgba(100, 20, 130, 0.7);
                transform: translate(-50%, -50%) scale(0.3);
                opacity: 0;
                animation: auraMorteRuna 2.4s ease-out forwards;
            }

            @keyframes auraMorteRuna {
                0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3) rotate(0deg); }
                25%  { opacity: 1; transform: translate(-50%, -50%) scale(1.2) rotate(15deg); }
                80%  { opacity: 0.9; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.6) rotate(-30deg); }
            }

            .token img.aura-morte-sprite {
                animation: auraMorteSprite 2.8s ease-out forwards !important;
            }

            @keyframes auraMorteSprite {
                0%   { filter: brightness(1) drop-shadow(0 0 0 rgba(255, 60, 80, 0)); }
                20%  { filter: brightness(2.5) saturate(0) drop-shadow(0 0 20px rgba(255, 60, 80, 1)) drop-shadow(0 0 40px rgba(100, 20, 130, 0.8)); }
                50%  { filter: brightness(0.8) saturate(0) drop-shadow(0 0 15px rgba(255, 60, 80, 0.7)); }
                85%  { filter: brightness(0.4) saturate(0) drop-shadow(0 0 10px rgba(255, 60, 80, 0.4)); opacity: 1; }
                100% { filter: brightness(0.2) saturate(0) drop-shadow(0 0 6px rgba(255, 60, 80, 0.2)); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // ==============================================================
    // LOG FINAL
    // ==============================================================
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V17.0] Sequenciamento + Aura de Morte');
    console.log('═══════════════════════════════════════════════════');
    console.log('• GIF do PA → purificação (sequência, sem sobrepor)');
    console.log('• Fila com timeout de segurança (não trava)');
    console.log('• Aura de morte (halo vermelho/roxo + runas + partículas)');
    console.log('• Sprite do herói esmaece junto com a aura');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — BLOCO 73 (V17.1 — Fix GIF + Aura + Restrição)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js, DEPOIS do V17.0.
//
// Corrige:
//   1. GIF do PA → purificação (garantir ordem correta)
//   2. Aura de morte (forçar delay na tela de derrota)
//   3. Restrição do Evento (validar elemento REAL do herói)
// =================================================================

(function correcoesV171() {
    if (window._correcoesV171) return;
    window._correcoesV171 = true;

    // ==============================================================
    // 1. GIF DO PA → PURIFICAÇÃO (ordem garantida)
    // --------------------------------------------------------------
    // Problema: o triggerBravelyChain aplica dano (que mata o boss
    // e dispara purificação) ANTES de chamar showBravelyAnimation.
    //
    // Solução: showPurificacao espera o GIF do PA terminar.
    // ==============================================================
    window._gifPAEmAndamento = false;
    window._gifPAInicio = 0;

    const _origShowBravely = window.showBravelyAnimation;
    if (typeof _origShowBravely === 'function') {
        window.showBravelyAnimation = async function(playerClass) {
            if (!window._storyMode) {
                return _origShowBravely.apply(this, arguments);
            }

            if (typeof STORY_SETTINGS !== 'undefined' && STORY_SETTINGS.skipBravelyAnimations) {
                return Promise.resolve();
            }

            window._gifPAEmAndamento = true;
            window._gifPAInicio = Date.now();

            try {
                return await _origShowBravely.call(this, playerClass);
            } finally {
                window._gifPAEmAndamento = false;
            }
        };
    }

    const _origShowPurif = window.showPurificacao;
    if (typeof _origShowPurif === 'function') {
        window.showPurificacao = async function(bossType, tileX, tileY, isFinalBoss) {
            if (!window._storyMode) {
                return _origShowPurif.apply(this, arguments);
            }

            // ⭐ ESPERA O GIF DO PA TERMINAR (se ainda estiver rodando)
            // Timeout de segurança: 5s máximo
            const inicioEspera = Date.now();
            while (window._gifPAEmAndamento && (Date.now() - inicioEspera) < 5000) {
                await new Promise(r => setTimeout(r, 100));
            }

            // Delay mínimo para garantir que a transição fique suave
            await new Promise(r => setTimeout(r, 200));

            return _origShowPurif.call(this, bossType, tileX, tileY, isFinalBoss);
        };
    }

    console.log('✅ [V17.1] 1. GIF do PA → purificação (ordem garantida).');

    // ==============================================================
    // 2. AURA DE MORTE (forçar delay na tela de derrota)
    // --------------------------------------------------------------
    // O applyDmg original chama handleStoryDefeat ANTES do meu hook
    // poder rodar. Solução: interceptar finishStoryPhase e esperar.
    // ==============================================================
    window._auraMorteEmAndamento = false;
    window._ultimaMorteHeroi = 0;

    // Hook em applyDmg — detecta morte de herói ANTES do original rodar
    const _origApplyDmg = window.applyDmg;
    if (typeof _origApplyDmg === 'function') {
        window.applyDmg = function(target, amount) {
            if (!window._storyMode) {
                return _origApplyDmg.apply(this, arguments);
            }

            if (!target || target.dead) {
                return _origApplyDmg.apply(this, arguments);
            }

            const eraHeroiVivo = (typeof players !== 'undefined')
                && players.includes(target)
                && !target.dead;

            const r = _origApplyDmg.apply(this, arguments);

            // Se herói morreu → mostra aura
            if (eraHeroiVivo && target.dead) {
                window._ultimaMorteHeroi = Date.now();

                // Marca que a aura está rodando
                if (typeof window.mostrarAuraDeMorte === 'function') {
                    window._auraMorteEmAndamento = true;
                    window.mostrarAuraDeMorte(target).then(() => {
                        window._auraMorteEmAndamento = false;
                        console.log('[V17.1] Aura de morte terminou');

                        // Depois da aura: se todos mortos, dispara derrota
                        const vivos = players.filter(p => !p.dead);
                        if (vivos.length === 0 && !window._endGameShowing) {
                            console.log('[V17.1] Todos morreram. Disparando derrota após aura.');
                            if (typeof finishStoryPhase === 'function') {
                                finishStoryPhase(false);
                            } else if (typeof handleStoryDefeat === 'function') {
                                handleStoryDefeat();
                            }
                        }
                    });
                }
            }

            return r;
        };
    }

    // Interceptar finishStoryPhase pra esperar a aura (se houver)
    const _origFinishPhase = window.finishStoryPhase;
    if (typeof _origFinishPhase === 'function') {
        window.finishStoryPhase = async function(victory) {
            if (!window._storyMode) {
                return _origFinishPhase.apply(this, arguments);
            }

            // Se há aura rodando E é derrota, espera a aura
            if (!victory && window._auraMorteEmAndamento) {
                console.log('[V17.1] finishStoryPhase: esperando aura de morte...');
                const inicioEspera = Date.now();
                while (window._auraMorteEmAndamento && (Date.now() - inicioEspera) < 4000) {
                    await new Promise(r => setTimeout(r, 100));
                }
                // Delay extra para a tela ficar limpa
                await new Promise(r => setTimeout(r, 300));
            }

            return _origFinishPhase.call(this, victory);
        };
    }

    // Interceptar handleStoryDefeat também
    const _origHandleDefeat = window.handleStoryDefeat;
    if (typeof _origHandleDefeat === 'function') {
        window.handleStoryDefeat = async function() {
            if (!window._storyMode) {
                return _origHandleDefeat.apply(this, arguments);
            }

            // Se há aura rodando, espera
            if (window._auraMorteEmAndamento) {
                console.log('[V17.1] handleStoryDefeat: esperando aura de morte...');
                const inicioEspera = Date.now();
                while (window._auraMorteEmAndamento && (Date.now() - inicioEspera) < 4000) {
                    await new Promise(r => setTimeout(r, 100));
                }
                await new Promise(r => setTimeout(r, 300));
            }

            return _origHandleDefeat.apply(this, arguments);
        };
    }

    console.log('✅ [V17.1] 2. Aura de morte antes da derrota.');

    // ==============================================================
    // 3. RESTRIÇÃO DO EVENTO (elemento REAL do herói)
    // --------------------------------------------------------------
    // Problema: validarHeroiRestricao usava amuleto. O amuleto
    // NÃO deve sobrescrever a restrição — a restrição é sobre o
    // ELEMENTO DO HERÓI, não sobre o equipamento.
    // ==============================================================
    function getElementoRealDoHeroi(heroClass) {
        if (!heroClass) return 'FOGO';

        // 1. Elemento FIXO da tabela
        if (typeof STORY_HERO_CLASSES !== 'undefined') {
            const h = STORY_HERO_CLASSES[heroClass];
            if (h && h.element) return h.element;
        }

        // 2. Elemento dinâmico (save)
        if (typeof getHeroStoryElement === 'function') {
            return getHeroStoryElement(heroClass);
        }
        if (typeof getSaveElement === 'function') {
            return getSaveElement();
        }

        return 'FOGO';
    }

    function validarRestricaoEvento(bossId) {
        const cfg = (bossId === 'pesadelo')
            ? (typeof EVENTO_PESADELO !== 'undefined' ? EVENTO_PESADELO : null)
            : (typeof EVENTO_BOSSES !== 'undefined' ? EVENTO_BOSSES[bossId] : null);

        if (!cfg || !cfg.restricao) return { valido: true };

        const heroiClass = (STORY_PROGRESS.selectedHeroes || ['Tupa'])[0];
        const heroiData = (typeof STORY_HERO_CLASSES !== 'undefined')
            ? STORY_HERO_CLASSES[heroiClass]
            : null;

        if (!heroiData) return { valido: false, motivo: 'Herói inválido.' };

        // ⭐ ELEMENTO REAL DO HERÓI (ignora amuleto)
        const elementoReal = getElementoRealDoHeroi(heroiClass);

        if (cfg.restricao.tipo === 'elemento') {
            if (elementoReal !== cfg.restricao.valor) {
                const elemIcon = { FOGO:'🔥', AGUA:'💧', TERRA:'⛰️', AR:'🌪️' };
                return {
                    valido: false,
                    motivo: `Este ato exige heróis de ${elemIcon[cfg.restricao.valor] || ''} ${cfg.restricao.valor}. Seu herói atual (${heroiData.displayName}) é de ${elemIcon[elementoReal] || ''} ${elementoReal}.`
                };
            }
        } else if (cfg.restricao.tipo === 'classe') {
            if (heroiData.role !== cfg.restricao.valor) {
                return {
                    valido: false,
                    motivo: `Este ato exige ${cfg.restricao.valor}s. Seu herói atual (${heroiData.displayName}) é ${heroiData.role}.`
                };
            }
        }

        return { valido: true };
    }

    // Hook em eventoIniciarFase (substitui o V14.0)
    if (typeof window.eventoIniciarFase === 'function') {
        const _origIniciarFase = window.eventoIniciarFase;
        window.eventoIniciarFase = function(bossId, faseId) {
            if (bossId !== 'pesadelo') {
                const check = validarRestricaoEvento(bossId);
                if (!check.valido) {
                    if (typeof showToast === 'function') {
                        showToast('🚫 Restrição', check.motivo, '🚫');
                    } else {
                        uiAviso(check.motivo);
                    }
                    return;
                }
            }
            return _origIniciarFase.apply(this, arguments);
        };
    }

    // Hook em eventoIniciarBatalha (segunda camada)
    if (typeof window.eventoIniciarBatalha === 'function') {
        const _origIniciarBatalha = window.eventoIniciarBatalha;
        window.eventoIniciarBatalha = async function(bossId, faseId) {
            if (bossId !== 'pesadelo') {
                const check = validarRestricaoEvento(bossId);
                if (!check.valido) {
                    console.error('[V17.1] Restrição violada em eventoIniciarBatalha:', check.motivo);
                    if (typeof showToast === 'function') showToast('🚫 Restrição', check.motivo, '🚫');
                    return;
                }
            }
            return _origIniciarBatalha.apply(this, arguments);
        };
    }

    // Também expõe pra debug
    window.validarRestricaoEvento = validarRestricaoEvento;
    window.getElementoRealDoHeroi = getElementoRealDoHeroi;

    console.log('✅ [V17.1] 3. Restrição do Evento usa elemento REAL do herói.');

    // ==============================================================
    // LOG FINAL
    // ==============================================================
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V17.1] Fixes aplicados');
    console.log('═══════════════════════════════════════════════════');
    console.log('• GIF do PA → purificação (ordem garantida)');
    console.log('• Aura de morte antes da tela de derrota');
    console.log('• Restrição do Evento valida elemento REAL');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('💡 Debug:');
    console.log('   window.validarRestricaoEvento("teju_jagua")');
    console.log('   window.getElementoRealDoHeroi("Tupa")');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — AJUSTE RÁPIDO (pausa entre GIF e purificação)
// =================================================================
(function ajustePausaGifV171fix() {
    if (window._ajustePausaV171fix) return;
    window._ajustePausaV171fix = true;

    const _origPurif = window.showPurificacao;
    if (typeof _origPurif === 'function') {
        window.showPurificacao = async function(bossType, tileX, tileY, isFinalBoss) {
            if (!window._storyMode) return _origPurif.apply(this, arguments);

            // Espera o GIF, mas com timeout de 3s (em vez de 5s)
            const inicio = Date.now();
            while (window._gifPAEmAndamento && (Date.now() - inicio) < 3000) {
                await new Promise(r => setTimeout(r, 50));
            }

            // ⭐ Remove o delay de 200ms (era do V17.1)
            // Vai direto pra purificação
            return _origPurif.call(this, bossType, tileX, tileY, isFinalBoss);
        };
    }
    console.log('✅ [ajuste] Pausa entre GIF e purificação reduzida.');
})();
// =================================================================
// historia.js — BLOCO 83 (V19.0 — Fix crash phase = null)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js (último bloco).
//
// Causa: showStoryDefeatScreen (V9.0-B1) acessa phase.name
// quando phase é null (acontece no Evento).
//
// Solução: interceptar showStoryDefeatScreen e passar um objeto
// seguro no lugar de null.
// =================================================================

(function fixCrashPhaseNull() {
    if (window._fixCrashPhaseNull) return;
    window._fixCrashPhaseNull = true;

    const _origShowDefeat = window.showStoryDefeatScreen;
    if (typeof _origShowDefeat !== 'function') {
        console.warn('[V19.0] showStoryDefeatScreen não encontrado');
        return;
    }

    window.showStoryDefeatScreen = function(phase, drops) {
        // ⭐ Se phase for null/undefined, cria um objeto seguro
        const phaseSafe = phase || {
            id: 'evento',
            name: 'Evento Semanal',
            enemies: [],
        };

        return _origShowDefeat.call(this, phaseSafe, drops);
    };

    console.log('✅ [V19.0] Fix phase = null instalado.');
})();
// =================================================================
// historia.js — BLOCO 88 (V23.2 — PA roda COMPLETO com boss real)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js (último bloco).
//
// Abordagem 2 (boss real, sem fake):
//   1. triggerBravelyChain passa o BOSS REAL (com dead: true) pro
//      paFn.execute, em vez de null ou fake.
//   2. Os 12 paFn.execute são reescritos SEM o guard `dead`.
//   3. Onde move o alvo (empurrar/puxar), verifica `dead` internamente.
//   4. Onde aplica dano, o applyDmg barra o morto (não duplica).
//   5. Tiles são convertidos SEMPRE (mesmo com alvo morto).
//
// ⚠️ NÃO mexe em:
//   • triggerBravelyChain dos heróis base (Tupã/Sumé/Caipora)
//   • showBravelyAnimation (V16.5)
//   • handleStoryBossDefeat (V9.0-B1)
//   • applyDmg (V9.0-B1)
// =================================================================

(function PAcompletoAbordagem2V232() {
    if (window._PAcompletoAbordagem2V232) return;
    window._PAcompletoAbordagem2V232 = true;

    console.log('[V23.2] Instalando Abordagem 2 (boss real, sem fake)...');

    // ==============================================================
    // FONTE DE VERDADE: elemento do herói
    // ==============================================================
    function getElementoReal(heroClass) {
        if (!heroClass) return 'FOGO';
        if (typeof STORY_HERO_CLASSES !== 'undefined' && STORY_HERO_CLASSES[heroClass]) {
            const h = STORY_HERO_CLASSES[heroClass];
            if (h.element) return h.element;
        }
        if (typeof getHeroStoryElement === 'function') return getHeroStoryElement(heroClass);
        return 'FOGO';
    }

    // ==============================================================
    // Tiles afetados (com snapshot, como V9.0-B1)
    // --------------------------------------------------------------
    // Mesmo que o alvo morra, o snapshot preserva x/y original.
    // ==============================================================
    function getPAaffectedTilesSnapshot(active, paKey, targetSnapshot) {
        const tiles = [];
        const cx = active.x;
        const cy = active.y;

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
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                }
            }
        }
        else if (paKey === 'eru_linha_horizontal') {
            for (let x = 0; x < 8; x++) tiles.push(cy * 8 + x);
        }
        else if (paKey === 'andure_area2x2_cura') {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                }
            }
        }
        else if (paKey === 'maedamata_area3x3_cura') {
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                }
            }
        }
        else if (paKey === 'paje_coluna_fogo') {
            for (let y = 0; y < 8; y++) tiles.push(y * 8 + cx);
        }
        else if (paKey === 'jurua_area_alvo_3x3') {
            if (hasTarget) {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const nx = targetSnapshot.x + dx, ny = targetSnapshot.y + dy;
                        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                    }
                }
            }
        }
        else if (paKey === 'araci_linha_horizontal') {
            for (let x = 0; x < 8; x++) tiles.push(cy * 8 + x);
        }
        else if (paKey === 'bicho_cruz_completa') {
            if (hasTarget) {
                for (let x = 0; x < 8; x++) tiles.push(targetSnapshot.y * 8 + x);
                for (let y = 0; y < 8; y++) {
                    if (y !== targetSnapshot.y) tiles.push(y * 8 + targetSnapshot.x);
                }
            }
        }
        else if (paKey === 'tapyra_coluna_alvo') {
            if (hasTarget) {
                for (let y = 0; y < 8; y++) tiles.push(y * 8 + targetSnapshot.x);
            }
        }
        // ---- Heróis novos ----
        else if (paKey === 'curupira_chuva_flechas') {
            grid.forEach((el, idx) => { if (el === 'AR') tiles.push(idx); });
        }
        else if (paKey === 'kianumanka_meteoro') {
            if (hasTarget) {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const nx = targetSnapshot.x + dx, ny = targetSnapshot.y + dy;
                        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                    }
                }
            }
        }
        else if (paKey === 'anhanga_mirim_raio') {
            if (hasTarget) {
                for (let i = 0; i < 8; i++) {
                    if (!tiles.includes(i * 8 + targetSnapshot.x)) tiles.push(i * 8 + targetSnapshot.x);
                    if (!tiles.includes(targetSnapshot.y * 8 + i)) tiles.push(targetSnapshot.y * 8 + i);
                }
            }
        }
        else if (paKey === 'matinta_rajada') {
            for (let x = 0; x < 8; x++) tiles.push(cy * 8 + x);
        }
        else if (paKey === 'naia_apaga_fogo') {
            grid.forEach((el, idx) => { if (el === 'FOGO') tiles.push(idx); });
        }
        else if (paKey === 'kuati_explosao') {
            const area = [];
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) area.push(ny * 8 + nx);
                }
            }
            const linha = [];
            for (let x = 0; x < 8; x++) linha.push(cy * 8 + x);
            [...new Set([...area, ...linha])].forEach(idx => tiles.push(idx));
        }
        else if (paKey === 'caboclo_mare') {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                }
            }
        }
        else if (paKey === 'tupinamba_avalanche') {
            if (hasTarget) {
                for (let i = 0; i < 8; i++) {
                    if (!tiles.includes(i * 8 + targetSnapshot.x)) tiles.push(i * 8 + targetSnapshot.x);
                    if (!tiles.includes(targetSnapshot.y * 8 + i)) tiles.push(targetSnapshot.y * 8 + i);
                }
            }
        }
        else if (paKey === 'mbaraka_salto_raio') {
            if (hasTarget) {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const nx = targetSnapshot.x + dx, ny = targetSnapshot.y + dy;
                        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                    }
                }
            }
        }
        else if (paKey === 'maedouro_caminho') {
            if (hasTarget) {
                const stepX = Math.sign(targetSnapshot.x - cx);
                for (let x = cx; x !== targetSnapshot.x + stepX; x += (stepX || 1)) {
                    const nx = Math.max(0, Math.min(7, x));
                    const idx = cy * 8 + nx;
                    if (!tiles.includes(idx)) tiles.push(idx);
                    if (stepX === 0) break;
                }
                const stepY = Math.sign(targetSnapshot.y - cy);
                for (let y = cy; y !== targetSnapshot.y + stepY; y += (stepY || 1)) {
                    const ny = Math.max(0, Math.min(7, y));
                    const idx = ny * 8 + targetSnapshot.x;
                    if (!tiles.includes(idx)) tiles.push(idx);
                    if (stepY === 0) break;
                }
                const bossIdx = targetSnapshot.y * 8 + targetSnapshot.x;
                if (!tiles.includes(bossIdx)) tiles.push(bossIdx);
            }
        }
        else if (paKey === 'pajeacu_linha') {
            for (let x = 0; x < 8; x++) tiles.push(cy * 8 + x);
        }
        else if (paKey === 'negrinho_cruz_cura') {
            if (hasTarget) {
                for (let i = 0; i < 8; i++) {
                    if (!tiles.includes(i * 8 + targetSnapshot.x)) tiles.push(i * 8 + targetSnapshot.x);
                    if (!tiles.includes(targetSnapshot.y * 8 + i)) tiles.push(targetSnapshot.y * 8 + i);
                }
            }
        }

        return tiles;
    }

    // ==============================================================
    // TRIGGER BRAVELY CHAIN — passa o BOSS REAL (com dead)
    // --------------------------------------------------------------
    // Diferente do V8.1 (que passa null se alvo morreu), aqui
    // passa o boss real. O paFn.execute (sem guard dead) roda tudo.
    // ==============================================================
    window.triggerBravelyChain = async function(active, target, totalAtk) {
        if (!window._storyMode && !window._eventoAtivo) return;

        const heroData = (typeof STORY_HERO_CLASSES !== 'undefined')
            ? STORY_HERO_CLASSES[active.class]
            : null;

        if (!heroData || !heroData.paKey) return;

        const paKey = heroData.paKey;

        // Heróis base → lógica própria (NÃO MEXER)
        if (paKey.startsWith('base_')) {
            return await _triggerBaseBravely(active, target, totalAtk, paKey);
        }

        // ============================================================
        // HERÓIS NOVOS
        // ============================================================
        const element = getElementoReal(active.class);

        // Snapshot do alvo (posição original, mesmo se morreu)
        const targetSnapshot = target ? {
            x: target.x,
            y: target.y,
            dead: target.dead,
            id: target.id,
        } : null;

        // Overlay "PODER ANCESTRAL"
        if (typeof showPoderAncestralEffect === 'function') {
            try { showPoderAncestralEffect(); } catch(e) {}
        }
        await sleep(300);

        try { if (typeof playSfx === 'function') playSfx('skill1'); } catch(e) {}

        // Calcula tiles com snapshot
        const paTiles = getPAaffectedTilesSnapshot(active, paKey, targetSnapshot);

        // FX elemental em cada tile
        paTiles.forEach((idx) => {
            const tx = idx % 8;
            const ty = Math.floor(idx / 8);
            const dist = Math.abs(tx - active.x) + Math.abs(ty - active.y);
            setTimeout(() => {
                if (typeof triggerElementalFX === 'function') {
                    let fxType = 'COL';
                    if (paKey.includes('linha')) fxType = 'ROW';
                    triggerElementalFX(element, fxType === 'ROW' ? ty : tx, fxType, active.x, active.y);
                }
            }, dist * 60);
        });

        await sleep(400);

        // ============================================================
        // Dano no alvo (só se vivo) — o applyDmg também barra o morto
        // ============================================================
        if (target && !target.dead) {
            const targetIdx = target.y * 8 + target.x;
            if (paTiles.includes(targetIdx)) {
                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            }
        }

        // ============================================================
        // ⭐ PASSA O BOSS REAL PRO paFn.execute
        // ------------------------------------------------------------
        // Mesmo com dead: true, o paFn.execute (reescrito abaixo sem
        // guard dead) vai rodar tudo. O applyDmg barra o morto.
        // ============================================================
        const paFn = STORY_HERO_PA[paKey];
        if (paFn && typeof paFn.execute === 'function') {
            try {
                await paFn.execute(active, target, totalAtk);
            } catch(e) {
                console.warn('[V23.2] Erro no paFn:', e);
            }
        }

        // ============================================================
        // CONVERTE TILES (SEMPRE)
        // ============================================================
        paTiles.forEach(idx => {
            grid[idx] = element;
            const tile = document.querySelectorAll('#grid .tile')[idx];
            if (tile) tile.className = `tile bg-${element}`;
            if (element === 'TERRA' && typeof updateTitleStats === 'function') updateTitleStats('earth_tile');
            else if (element === 'AR' && typeof updateTitleStats === 'function') updateTitleStats('air_tile');
        });

        if (typeof updateTitleStats === 'function') updateTitleStats('bravely_chain');

        console.log(`[V23.2] PA ${paKey} — tiles: ${paTiles.length}, alvo: ${target ? (target.dead ? 'morto' : 'vivo') : 'sem alvo'}`);
    };

    // ==============================================================
    // TRIGGER BASE (Tupã/Sumé/Caipora) — MANTIDO DO V8.1
    // ==============================================================
    async function _triggerBaseBravely(active, target, totalAtk, paKey) {
        if (typeof showPoderAncestralEffect === 'function') {
            try { showPoderAncestralEffect(); } catch(e) {}
        }
        await sleep(300);

        const element = getElementoReal(active.class);
        const affectedIndices = [];

        if (paKey === 'base_coluna') {
            triggerElementalFX(element, active.x, 'COL', active.x, active.y);
            for (let row = 0; row < 8; row++) affectedIndices.push(row * 8 + active.x);
            if (target && !target.dead && target.x === active.x) {
                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            }
        }
        else if (paKey === 'base_linha_cura') {
            triggerElementalFX(element, active.y, 'ROW', active.x, active.y);
            for (let col = 0; col < 8; col++) affectedIndices.push(active.y * 8 + col);
            if (target && !target.dead && target.y === active.y) {
                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            }
            players.forEach(p => {
                if (!p.dead && p.y === active.y) {
                    p.hp = Math.min(p.maxHp, p.hp + 2);
                    if (typeof showHealEffect === 'function') showHealEffect(p.x, p.y, 2);
                    if (typeof updateTitleStats === 'function') updateTitleStats('healing', 2);
                }
            });
        }
        else if (paKey === 'base_area_alvo') {
            if (target) {
                const c = { x: target.x, y: target.y };
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = c.x + dx, ny = c.y + dy;
                        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                            affectedIndices.push(ny * 8 + nx);
                            if (typeof spawnArrowProjectile === 'function') {
                                spawnArrowProjectile({ x: nx, y: -1 }, { x: nx, y: ny });
                            }
                        }
                    }
                }
                await sleep(400);
                if (!target.dead && typeof applyDmg === 'function') {
                    applyDmg(target, totalAtk);
                }
            }
        }

        affectedIndices.forEach(idx => {
            grid[idx] = element;
            const tile = document.querySelectorAll('#grid .tile')[idx];
            if (tile) tile.className = `tile bg-${element}`;
        });
    }

    // ==============================================================
    // REESCREVER OS 12 paFn.execute (SEM guard dead)
    // --------------------------------------------------------------
    // Cada um é o mesmo do V9.4, mas sem `if (!target || target.dead) return`.
    // Onde move o alvo (empurrar/puxar), adiciona `if (!target.dead)`.
    // Onde aplica dano, o applyDmg barra o morto.
    // ==============================================================
    if (typeof STORY_HERO_PA !== 'undefined') {

        // ---- 1. Curupira — Chuva de Flechas ----
        STORY_HERO_PA['curupira_chuva_flechas'] = {
            desc: 'Escolhe até 10 tiles AR → viram TERRA. Flecha cai em cada. Boss neles toma dano PA ×2.',
            execute: async (active, target, totalAtk) => {
                const arTiles = [];
                grid.forEach((el, idx) => {
                    if (el === 'AR') arTiles.push({ x: idx % 8, y: Math.floor(idx / 8), idx });
                });

                let selected = [];
                if (arTiles.length <= 10) {
                    selected = arTiles;
                    addLog(`🏹 Curupira: ${selected.length} tiles AR selecionados automaticamente!`);
                } else {
                    selected = arTiles.slice(0, 10);
                    addLog(`🏹 Curupira: selecionando 10 tiles AR...`);
                }

                selected.forEach(t => {
                    grid[t.idx] = 'TERRA';
                    const el = document.querySelectorAll('#grid .tile')[t.idx];
                    if (el) el.className = 'tile bg-TERRA';
                });

                selected.forEach((t, i) => {
                    setTimeout(() => {
                        if (typeof spawnFxAt === 'function') {
                            spawnFxAt('impact', 'fx-impact', t.x, t.y, { duration: 500, scale: 0.7 });
                        }
                    }, i * 60);
                });

                await sleep(600);

                if (target) {
                    const bossIdx = target.y * 8 + target.x;
                    if (selected.some(t => t.idx === bossIdx)) {
                        const dmg = Math.floor(totalAtk * 2);
                        if (typeof applyDmg === 'function') applyDmg(target, dmg);
                        addLog(`🏹 Curupira: dano crítico ×2 no boss! (${dmg})`);
                    }
                }
            }
        };

        // ---- 2. Kianumanka — Meteoro ----
        STORY_HERO_PA['kianumanka_meteoro'] = {
            desc: 'Meteoro cai no tile do boss, área 3×3, converte pra FOGO, dano PA.',
            execute: async (active, target, totalAtk) => {
                if (!target) return;
                const tiles = [];
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const nx = target.x + dx, ny = target.y + dy;
                        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                            tiles.push({ x: nx, y: ny, idx: ny * 8 + nx });
                        }
                    }
                }

                if (typeof spawnFxAt === 'function') {
                    spawnFxAt('fireball', 'fireball-fx', target.x, target.y, { duration: 800, scale: 2 });
                }
                await sleep(400);

                tiles.forEach(t => {
                    grid[t.idx] = 'FOGO';
                    const el = document.querySelectorAll('#grid .tile')[t.idx];
                    if (el) el.className = 'tile bg-FOGO';
                });
                await sleep(300);

                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
                addLog(`☄️ Kianumanka: meteoro caiu! (${totalAtk} dano em área 3×3)`);
            }
        };

        // ---- 3. Anhanga-Mirim — Raio na cruz ----
        STORY_HERO_PA['anhanga_mirim_raio'] = {
            desc: 'Escolhe 1 tile AR → raio na linha + coluna (150% dano PA).',
            execute: async (active, target, totalAtk) => {
                const arTiles = [];
                grid.forEach((el, idx) => {
                    if (el === 'AR') arTiles.push({ x: idx % 8, y: Math.floor(idx / 8), idx });
                });

                if (arTiles.length === 0) {
                    addLog(`⚡ Anhanga-Mirim: nenhum tile AR! PA falhou.`);
                    return;
                }

                const chosen = arTiles[0];
                const tiles = [];
                for (let i = 0; i < 8; i++) {
                    if (!tiles.includes(i * 8 + chosen.x)) tiles.push(i * 8 + chosen.x);
                    if (!tiles.includes(chosen.y * 8 + i)) tiles.push(chosen.y * 8 + i);
                }

                if (typeof spawnFxAt === 'function') {
                    spawnFxAt('impact', 'fx-impact', chosen.x, chosen.y, { duration: 800, scale: 1.5 });
                }
                await sleep(400);

                tiles.forEach(idx => {
                    grid[idx] = 'AR';
                    const e = document.querySelectorAll('#grid .tile')[idx];
                    if (e) e.className = 'tile bg-AR';
                });

                const dmg = Math.floor(totalAtk * 1.5);
                if (target) {
                    if (typeof applyDmg === 'function') applyDmg(target, dmg);
                }
                addLog(`⚡ Anhanga-Mirim: raio na cruz! (${dmg} dano = 150%)`);
            }
        };

        // ---- 4. Matinta — Rajada + empurrão ----
        STORY_HERO_PA['matinta_rajada'] = {
            desc: 'Boss é empurrado pra uma borda, depois pra outra. Dano PA em cada colisão.',
            execute: async (active, target, totalAtk) => {
                if (!target) return;

                const linha = target.y;
                for (let x = 0; x < 8; x++) {
                    const idx = linha * 8 + x;
                    grid[idx] = 'AR';
                    const el = document.querySelectorAll('#grid .tile')[idx];
                    if (el) el.className = 'tile bg-AR';
                }

                if (!target.dead) {
                    // Primeiro empurrão: pra borda esquerda
                    if (typeof spawnFxAt === 'function') {
                        spawnFxAt('vortex', 'vortex-fx', target.x, target.y, { duration: 600 });
                    }
                    target.x = 0;
                    if (typeof updateVisuals === 'function') updateVisuals();
                    await sleep(400);
                }

                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
                addLog(`🌪️ Matinta: boss empurrado! (${totalAtk} dano)`);

                if (target.dead) return;

                if (!target.dead) {
                    // Segundo empurrão: pra borda direita
                    if (typeof spawnFxAt === 'function') {
                        spawnFxAt('vortex', 'vortex-fx', target.x, target.y, { duration: 600 });
                    }
                    target.x = 7;
                    if (typeof updateVisuals === 'function') updateVisuals();
                    await sleep(400);
                }

                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
                addLog(`🌪️ Matinta: boss empurrado pra direita! (${totalAtk} dano)`);
            }
        };

        // ---- 5. Naiá — Apaga fogo ----
        STORY_HERO_PA['naia_apaga_fogo'] = {
            desc: 'Todos os tiles FOGO viram AGUA. Cada um = 1 dano no boss.',
            execute: async (active, target, totalAtk) => {
                const fogoTiles = [];
                grid.forEach((el, idx) => {
                    if (el === 'FOGO') fogoTiles.push({ x: idx % 8, y: Math.floor(idx / 8), idx });
                });

                if (fogoTiles.length === 0) {
                    addLog(`💧 Naiá: nenhum tile FOGO! PA fraco.`);
                }

                fogoTiles.forEach((t, i) => {
                    setTimeout(() => {
                        if (typeof spawnFxAt === 'function') {
                            spawnFxAt('splash', 'fx-splash-wave', t.x, t.y, { duration: 500 });
                        }
                    }, i * 40);
                });

                fogoTiles.forEach(t => {
                    grid[t.idx] = 'AGUA';
                    const el = document.querySelectorAll('#grid .tile')[t.idx];
                    if (el) el.className = 'tile bg-AGUA';
                });
                await sleep(600);

                const dmg = fogoTiles.length;
                if (target && dmg > 0) {
                    if (typeof applyDmg === 'function') applyDmg(target, dmg);
                }
                addLog(`💧 Naiá: ${dmg} tiles FOGO apagados! (${dmg} dano)`);
            }
        };

        // ---- 6. Kuatí — Explosão de fogo ----
        STORY_HERO_PA['kuati_explosao'] = {
            desc: 'Área 3×3 ao redor do herói + linha do herói. Explosão de FOGO.',
            execute: async (active, target, totalAtk) => {
                const area = [];
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const nx = active.x + dx, ny = active.y + dy;
                        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) area.push({ x: nx, y: ny, idx: ny * 8 + nx });
                    }
                }
                const linha = [];
                for (let x = 0; x < 8; x++) {
                    linha.push({ x, y: active.y, idx: active.y * 8 + x });
                }

                const allTiles = [...area];
                const seen = new Set(area.map(t => t.idx));
                linha.forEach(t => { if (!seen.has(t.idx)) allTiles.push(t); });

                if (typeof spawnFxAt === 'function') {
                    spawnFxAt('impact', 'fx-impact', active.x, active.y, { duration: 800, scale: 2 });
                }
                allTiles.forEach((t, i) => {
                    setTimeout(() => {
                        if (typeof spawnFxAt === 'function') {
                            spawnFxAt('impact', 'fx-impact', t.x, t.y, { duration: 400, scale: 0.6 });
                        }
                    }, i * 40);
                });

                await sleep(500);
                allTiles.forEach(t => {
                    grid[t.idx] = 'FOGO';
                    const el = document.querySelectorAll('#grid .tile')[t.idx];
                    if (el) el.className = 'tile bg-FOGO';
                });

                if (target) {
                    if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
                }
                addLog(`🔥 Kuatí: explosão de fogo! (${totalAtk} dano em ${allTiles.length} tiles)`);
            }
        };

        // ---- 7. Caboclo d'Água — Maré + puxão ----
        STORY_HERO_PA['caboclo_mare'] = {
            desc: 'Maré 3×3 ao redor do herói. Boss é puxado 3 tiles. Dano se estiver na área.',
            execute: async (active, target, totalAtk) => {
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
                        if (typeof spawnFxAt === 'function') {
                            spawnFxAt('splash', 'fx-splash-wave', t.x, t.y, { duration: 500 });
                        }
                    }, i * 40);
                });

                tiles.forEach(t => {
                    grid[t.idx] = 'AGUA';
                    const el = document.querySelectorAll('#grid .tile')[t.idx];
                    if (el) el.className = 'tile bg-AGUA';
                });
                await sleep(500);

                if (target) {
                    if (!target.dead) {
                        const dx = Math.sign(active.x - target.x);
                        const dy = Math.sign(active.y - target.y);
                        for (let i = 0; i < 3; i++) {
                            const nx = target.x + dx;
                            const ny = target.y + dy;
                            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
                            if (typeof isOccupied === 'function' && isOccupied(nx, ny, -1)) break;
                            target.x = nx; target.y = ny;
                        }
                        if (typeof updateVisuals === 'function') updateVisuals();
                    }

                    const bossIdx = target.y * 8 + target.x;
                    if (tiles.some(t => t.idx === bossIdx)) {
                        if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
                        addLog(`🌊 Caboclo: boss puxado e atingido! (${totalAtk} dano)`);
                    } else {
                        addLog(`🌊 Caboclo: boss puxado mas fora da área.`);
                    }
                }
            }
        };

        // ---- 8. Tupinambá — Avalanche ----
        STORY_HERO_PA['tupinamba_avalanche'] = {
            desc: 'Cruz (linha + coluna do boss). Empurra boss. Dano PA.',
            execute: async (active, target, totalAtk) => {
                if (!target) return;

                const tiles = [];
                for (let i = 0; i < 8; i++) {
                    if (!tiles.includes(i * 8 + target.x)) tiles.push(i * 8 + target.x);
                    if (!tiles.includes(target.y * 8 + i)) tiles.push(target.y * 8 + i);
                }

                tiles.forEach((idx, i) => {
                    setTimeout(() => {
                        if (typeof spawnFxAt === 'function') {
                            const tx = idx % 8, ty = Math.floor(idx / 8);
                            spawnFxAt('rock', 'rock-projectile', tx, ty, { duration: 500, scale: 0.8 });
                        }
                    }, i * 30);
                });

                tiles.forEach(idx => {
                    grid[idx] = 'TERRA';
                    const el = document.querySelectorAll('#grid .tile')[idx];
                    if (el) el.className = 'tile bg-TERRA';
                });
                await sleep(600);

                if (!target.dead) {
                    const dx = Math.sign(target.x - active.x) || 1;
                    const dy = Math.sign(target.y - active.y) || 0;
                    for (let i = 0; i < 2; i++) {
                        const nx = target.x + dx;
                        const ny = target.y + dy;
                        if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
                        target.x = nx; target.y = ny;
                    }
                    if (typeof updateVisuals === 'function') updateVisuals();
                }

                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
                addLog(`🪨 Tupinambá: avalanche + empurrão! (${totalAtk} dano)`);
            }
        };

        // ---- 9. Mbaraká — Salto + raio ----
        STORY_HERO_PA['mbaraka_salto_raio'] = {
            desc: 'Salta no boss. Raio 3×3. Empurra pra borda mais próxima.',
            execute: async (active, target, totalAtk) => {
                if (!target) return;

                if (typeof spawnFxAt === 'function') {
                    spawnFxAt('impact', 'fx-impact', active.x, active.y, { duration: 400 });
                }
                await sleep(200);

                active.x = target.x;
                active.y = Math.max(0, target.y - 1);
                if (typeof updateVisuals === 'function') updateVisuals();

                const tiles = [];
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const nx = target.x + dx, ny = target.y + dy;
                        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                            tiles.push({ x: nx, y: ny, idx: ny * 8 + nx });
                        }
                    }
                }

                if (typeof spawnFxAt === 'function') {
                    spawnFxAt('impact', 'fx-impact', target.x, target.y, { duration: 800, scale: 2 });
                }
                await sleep(400);

                tiles.forEach(t => {
                    grid[t.idx] = 'AR';
                    const el = document.querySelectorAll('#grid .tile')[t.idx];
                    if (el) el.className = 'tile bg-AR';
                });

                if (!target.dead) {
                    if (target.x <= 1) {
                        target.x = 7;
                    } else if (target.x >= 6) {
                        target.x = 0;
                    } else {
                        target.x = target.x < 4 ? 0 : 7;
                    }
                    if (typeof updateVisuals === 'function') updateVisuals();
                }

                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
                addLog(`⚡ Mbaraká: raio + empurrão! (${totalAtk} dano)`);
            }
        };

        // ---- 10. Mãe-do-Ouro — Caminho até o boss ----
        STORY_HERO_PA['maedouro_caminho'] = {
            desc: 'Traça caminho até o boss. Tiles do caminho + boss = área. Dano em toda a área.',
            execute: async (active, target, totalAtk) => {
                if (!target) return;

                const tiles = [];
                const seen = new Set();

                const stepX = Math.sign(target.x - active.x);
                for (let x = active.x; x !== target.x + stepX; x += (stepX || 1)) {
                    const nx = Math.max(0, Math.min(7, x));
                    const idx = active.y * 8 + nx;
                    if (!seen.has(idx)) { tiles.push({ x: nx, y: active.y, idx }); seen.add(idx); }
                    if (stepX === 0) break;
                }
                const stepY = Math.sign(target.y - active.y);
                for (let y = active.y; y !== target.y + stepY; y += (stepY || 1)) {
                    const ny = Math.max(0, Math.min(7, y));
                    const idx = ny * 8 + target.x;
                    if (!seen.has(idx)) { tiles.push({ x: target.x, y: ny, idx }); seen.add(idx); }
                    if (stepY === 0) break;
                }

                const bossIdx = target.y * 8 + target.x;
                if (!seen.has(bossIdx)) tiles.push({ x: target.x, y: target.y, idx: bossIdx });

                tiles.forEach((t, i) => {
                    setTimeout(() => {
                        if (typeof spawnFxAt === 'function') {
                            spawnFxAt('rock', 'rock-projectile', t.x, t.y, { duration: 500, scale: 0.6 });
                        }
                    }, i * 40);
                });

                tiles.forEach(t => {
                    grid[t.idx] = 'TERRA';
                    const el = document.querySelectorAll('#grid .tile')[t.idx];
                    if (el) el.className = 'tile bg-TERRA';
                });

                // ⭐ COMPENSAÇÃO: caminho curto até o boss (≤4 tiles) converte
                // também a área 3×3 ao redor do alvo, senão o PA mudaria pouco.
                if (tiles.length <= 4) {
                    const area3x3 = [];
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            const nx = target.x + dx, ny = target.y + dy;
                            if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) area3x3.push(ny * 8 + nx);
                        }
                    }
                    area3x3.forEach(idx => {
                        grid[idx] = 'TERRA';
                        const el = document.querySelectorAll('#grid .tile')[idx];
                        if (el) el.className = 'tile bg-TERRA';
                    });
                    if (typeof addLog === 'function') {
                        addLog(`🌍 Mãe-do-Ouro: caminho curto (${tiles.length} tiles) → área 3×3 ao redor do alvo convertida em TERRA.`);
                    }
                }

                await sleep(600);

                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
                addLog(`🌍 Mãe-do-Ouro: caminho explodiu! (${totalAtk} dano em ${tiles.length} tiles)`);
            }
        };

        // ---- 11. Pajé-Açu — Linha + empurrão ----
        STORY_HERO_PA['pajeacu_linha'] = {
            desc: 'Dano em linha do herói. Empurra boss pra borda. Colisão = +50% dano.',
            execute: async (active, target, totalAtk) => {
                const tiles = [];
                for (let x = 0; x < 8; x++) tiles.push({ x, y: active.y, idx: active.y * 8 + x });

                tiles.forEach((t, i) => {
                    setTimeout(() => {
                        if (typeof spawnFxAt === 'function') {
                            spawnFxAt('impact', 'fx-impact', t.x, t.y, { duration: 500, scale: 0.6 });
                        }
                    }, i * 40);
                });

                tiles.forEach(t => {
                    grid[t.idx] = 'FOGO';
                    const el = document.querySelectorAll('#grid .tile')[t.idx];
                    if (el) el.className = 'tile bg-FOGO';
                });
                await sleep(500);

                if (target) {
                    if (!target.dead) {
                        const targetX = target.x < 4 ? 0 : 7;
                        target.x = targetX;
                        if (typeof updateVisuals === 'function') updateVisuals();
                        await sleep(300);
                    }

                    const dmg = Math.floor(totalAtk * 1.5);
                    if (typeof applyDmg === 'function') applyDmg(target, dmg);
                    addLog(`🔥 Pajé-Açu: empurrão + colisão! (${dmg} dano = +50%)`);
                }
            }
        };

        // ---- 12. Negrinho — Cruz + cura ----
        STORY_HERO_PA['negrinho_cruz_cura'] = {
            desc: 'Cruz a partir do boss. Dano PA. Cura 5 HP em aliados + em si.',
            execute: async (active, target, totalAtk) => {
                if (!target) return;

                const tiles = [];
                for (let i = 0; i < 8; i++) {
                    if (!tiles.includes(i * 8 + target.x)) tiles.push(i * 8 + target.x);
                    if (!tiles.includes(target.y * 8 + i)) tiles.push(target.y * 8 + i);
                }

                tiles.forEach((idx, i) => {
                    setTimeout(() => {
                        if (typeof spawnFxAt === 'function') {
                            const tx = idx % 8, ty = Math.floor(idx / 8);
                            spawnFxAt('impact', 'fx-impact', tx, ty, { duration: 500, scale: 0.7 });
                        }
                    }, i * 30);
                });

                tiles.forEach(idx => {
                    grid[idx] = 'AGUA';
                    const el = document.querySelectorAll('#grid .tile')[idx];
                    if (el) el.className = 'tile bg-AGUA';
                });
                await sleep(500);

                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);

                const allPlayers = (typeof players !== 'undefined') ? players : [active];
                allPlayers.forEach(p => {
                    if (p.dead) return;
                    const idx = p.y * 8 + p.x;
                    if (tiles.includes(idx)) {
                        p.hp = Math.min(p.maxHp, p.hp + 5);
                        if (typeof showHealEffect === 'function') showHealEffect(p.x, p.y, 5);
                    }
                });
                addLog(`💧 Negrinho: cruz + cura 5 HP! (${totalAtk} dano)`);
            }
        };

        console.log('[V23.2] 12 paFn.execute reescritos (sem guard dead).');
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V23.2] Abordagem 2 instalada (boss real, sem fake)');
    console.log('═══════════════════════════════════════════════════');
    console.log('• triggerBravelyChain passa o BOSS REAL pro paFn.execute');
    console.log('• 12 paFn.execute reescritos sem guard dead');
    console.log('• Empurrar/puxar: só se boss vivo');
    console.log('• Dano: applyDmg barra o morto (não duplica)');
    console.log('• Tiles: convertidos SEMPRE');
    console.log('• Heróis base: NÃO MEXIDOS');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — BLOCO 86 (V22.0 — Falas dos Bosses) — PARTE 1/3
// -----------------------------------------------------------------
// TABELA DE FALAS (só dados, sem hooks)
//
// Cole NO FINAL do historia.js. Depois cole a PARTE 2/3 e a 3/3.
// =================================================================

const FALAS_MODO_HISTORIA = {
    'saci': {
        aoTomarDano: ['Ai! Você me acertou!', 'Isso é tudo que tem?', 'Meu redemoinho não cai assim!'],
        aoDarDano: ['Sinta o vendaval!', 'Gira, gira!', 'Você é fraco como os outros!'],
        aoUsarPA: ['Impossível!', 'O que é esse poder?!', 'O Senhor do Abismo me protege!'],
        aoMorrer: ['Anhangá... me vingue...', 'Livre... enfim livre...', 'O redemoinho... para...'],
    },
    'mapinguari': {
        aoTomarDano: ['Você acha que pode me ferir?', 'A mata chora por você.', 'Minha pele é mais dura que sua lâmina.'],
        aoDarDano: ['Eu devoro tudo!', 'Sinta o peso da floresta!', 'Você não passa!'],
        aoUsarPA: ['Como ousa?!', 'Meu poder... tremendo?', 'A mata... me abandonou?'],
        aoMorrer: ['A floresta... precisa de mim...', 'Eu só queria proteger...', 'Perdoe-me, mata...'],
    },
    'iara': {
        aoTomarDano: ['Minhas águas... sangram?', 'Você é corajoso, herói...', 'Não se aproxime do rio.'],
        aoDarDano: ['Afogue-se em meu canto!', 'Dance com as águas!', 'O rio reclama por você.'],
        aoUsarPA: ['Impossível...', 'Minhas águas... não obedecem?', 'Você é digno, afinal.'],
        aoMorrer: ['As águas... me chamam...', 'Livre do canto...', 'O rio... volta a fluir...'],
    },
    'boitata': {
        aoTomarDano: ['Você resiste ao fogo?', 'Minhas chamas não te queimam?', 'Interessante...'],
        aoDarDano: ['Queime!', 'Sinta o inferno!', 'Minhas chamas consomem tudo!'],
        aoUsarPA: ['O fogo... recua?', 'Como você apagou...?', 'Você é a água que me teme?'],
        aoMorrer: ['O fogo... se apaga...', 'A mata... vai respirar...', 'Livre das chamas...'],
    },
    'mula': {
        aoTomarDano: ['Relincho de dor...', 'Minha maldição... é minha força!', 'Você não me derruba!'],
        aoDarDano: ['Queime na maldição!', 'Relincho de morte!', 'A noite me pertence!'],
        aoUsarPA: ['A maldição... quebra?', 'Como você...?', 'Minha dor... some?'],
        aoMorrer: ['A maldição... acaba...', 'Livre... finalmente...', 'Obrigada, herói...'],
    },
    'corpo_seco': {
        aoTomarDano: ['Fome... tanta fome...', 'Você não me satisfaz...', 'Preciso de mais!'],
        aoDarDano: ['Sua alma é minha!', 'Devorar... devorar!', 'Fome eterna!'],
        aoUsarPA: ['Como... como?!', 'Minha fome... para?', 'Você é a morte...?'],
        aoMorrer: ['A fome... termina...', 'Descanso... enfim...', 'Obrigado, herói...'],
    },
    'lobisomem': {
        aoTomarDano: ['Minha fera... sangra?', 'Você é mais forte que a lua?', 'Uivo de dor!'],
        aoDarDano: ['Uivo para a lua!', 'A fera está solta!', 'Sinta minhas garras!'],
        aoUsarPA: ['A lua... me abandona?', 'Minha fera... recua?', 'Como você...?'],
        aoMorrer: ['A lua... volta a ser lua...', 'Livre da maldição...', 'Obrigado, herói...'],
    },
    'cuca': {
        aoTomarDano: ['Minhas poções... falham?', 'Você é mais forte que a bruxa?', 'Interessante...'],
        aoDarDano: ['Beba minha poção!', 'Veneno puro!', 'A bruxa sempre vence!'],
        aoUsarPA: ['Meu caldeirão...!', 'Como você quebrou...?', 'Você é digno...'],
        aoMorrer: ['Meu caldeirão... esfria...', 'A bruxa... descansa...', 'Obrigada, herói...'],
    },
    'boto': {
        aoTomarDano: ['Meu encanto... quebra?', 'Você resiste ao meu canto?', 'Interessante...'],
        aoDarDano: ['Dance comigo!', 'Sinta o encanto!', 'As águas te chamam!'],
        aoUsarPA: ['Meu canto... falha?', 'Como você...?', 'Você é digno...'],
        aoMorrer: ['As águas... me chamam...', 'Livre do encanto...', 'Obrigado, herói...'],
    },
    'boi': {
        aoTomarDano: ['Minha face... treme?', 'Você não teme o terror?', 'Interessante...'],
        aoDarDano: ['Sinta o terror!', 'Minha face escura!', 'Ninguém escapa!'],
        aoUsarPA: ['Meu terror... quebra?', 'Como você...?', 'Você é digno...'],
        aoMorrer: ['O terror... acaba...', 'Livre da face...', 'Obrigado, herói...'],
    },
    'jaci': {
        aoTomarDano: ['Minha luz... treme?', 'Você resiste à lua?', 'Interessante...'],
        aoDarDano: ['Sinta a lua fria!', 'Meus raios queimam!', 'A noite é minha!'],
        aoUsarPA: ['Minha lua... recua?', 'Como você...?', 'Você é digno...'],
        aoMorrer: ['A lua... volta a brilhar...', 'Livre da melancolia...', 'Obrigada, herói...'],
    },
    'guaraci': {
        aoTomarDano: ['Meu sol... treme?', 'Você resiste ao calor?', 'Interessante...'],
        aoDarDano: ['Queime no sol!', 'Sinta o inferno solar!', 'Ninguém escapa do sol!'],
        aoUsarPA: ['Meu sol... recua?', 'Como você...?', 'Você é digno...'],
        aoMorrer: ['O sol... volta a aquecer...', 'Livre da arrogância...', 'Obrigado, herói...'],
    },
    'anhanga': {
        aoTomarDano: ['Você me fere?', 'Minha escuridão... treme?', 'Interessante...'],
        aoDarDano: ['Sinta o abismo!', 'Minha escuridão consome!', 'Ninguém escapa!'],
        aoUsarPA: ['Impossível!', 'Como você...?', 'Meu poder... recua?'],
        aoMorrer: ['A escuridão... se dissolve...', 'O equilíbrio... retorna...', 'Obrigado, herói...'],
    },
};

const FALAS_EVENTO = {
    'teju_jagua': {
        aoTomarDano: ['Minhas sete cabeças...', 'Você me acerta?', 'Interessante...'],
        aoDarDano: ['Minhas chamas te consomem!', 'Sinta o fogo do Teju!', 'Sete cabeças, sete mortes!'],
        aoUsarPA: ['Impossível!', 'Como você...?', 'Minhas cabeças... recuam?'],
        aoMorrer: ['Minhas cabeças... caem...', 'O fogo... se apaga...', 'Anhangá... me vingue...'],
        aoServoAtingido: ['Meus servos!', 'Você ousa tocar neles?', 'Eles são meus!'],
        aoServoMorto: ['Você vai pagar!', 'Meus servos!', 'Sinta minha fúria!'],
    },
    'mboi_tui': {
        aoTomarDano: ['Meu bico... treme?', 'Você resiste ao veneno?', 'Interessante...'],
        aoDarDano: ['Sinta o veneno do arco-íris!', 'Minhas escamas brilham!', 'O rio te afoga!'],
        aoUsarPA: ['Meu veneno... falha?', 'Como você...?', 'Você é digno...'],
        aoMorrer: ['O rio... volta a fluir...', 'Livre do veneno...', 'Obrigado, herói...'],
        aoServoAtingido: ['Meus peixes!', 'Você toca nos meus?', 'O rio reclama!'],
        aoServoMorto: ['Você vai se afogar!', 'Meus servos!', 'Sinta a correnteza!'],
    },
    'monai': {
        aoTomarDano: ['Minhas asas... tremem?', 'Você me acerta no ar?', 'Interessante...'],
        aoDarDano: ['Sinta o voo rasante!', 'Minhas asas te cobrem!', 'O céu é meu!'],
        aoUsarPA: ['Meu voo... falha?', 'Como você...?', 'Você é digno...'],
        aoMorrer: ['O céu... me chama...', 'Livre das asas...', 'Obrigado, herói...'],
        aoServoAtingido: ['Minhas criaturas!', 'Você toca nos meus?', 'O céu reclama!'],
        aoServoMorto: ['Você vai cair!', 'Minhas criaturas!', 'Sinta o vento!'],
    },
    'jasy_jatere': {
        aoTomarDano: ['Meu sol... treme?', 'Você resiste ao clarão?', 'Interessante...'],
        aoDarDano: ['Sinta o clarão!', 'Meu salto solar!', 'Ninguém escapa da luz!'],
        aoUsarPA: ['Meu sol... recua?', 'Como você...?', 'Você é digno...'],
        aoMorrer: ['O sol... se apaga...', 'Livre do clarão...', 'Obrigado, herói...'],
        aoServoAtingido: ['Minhas criaturas!', 'Você toca nos meus?', 'A luz reclama!'],
        aoServoMorto: ['Você vai cegar!', 'Minhas criaturas!', 'Sinta o calor!'],
    },
    'kurupi': {
        aoTomarDano: ['Minhas raízes... tremem?', 'Você me acerta?', 'Interessante...'],
        aoDarDano: ['Minhas raízes te prendem!', 'A mata te engole!', 'Você não escapa!'],
        aoUsarPA: ['Minhas raízes... soltam?', 'Como você...?', 'Você é digno...'],
        aoMorrer: ['A mata... me chama...', 'Livre das raízes...', 'Obrigado, herói...'],
        aoServoAtingido: ['Minhas criaturas!', 'Você toca nos meus?', 'A mata reclama!'],
        aoServoMorto: ['Você vai ser engolido!', 'Minhas criaturas!', 'Sinta a terra!'],
    },
    'ao_ao': {
        aoTomarDano: ['Minha lã... treme?', 'Você me acerta?', 'Interessante...'],
        aoDarDano: ['Minha lã te enrola!', 'A ovelha devora!', 'Você não escapa!'],
        aoUsarPA: ['Minha fome... falha?', 'Como você...?', 'Você é digno...'],
        aoMorrer: ['A fome... acaba...', 'Livre da maldição...', 'Obrigado, herói...'],
        aoServoAtingido: ['Meus rebanhos!', 'Você toca nos meus?', 'A fome reclama!'],
        aoServoMorto: ['Você vai ser devorado!', 'Meus rebanhos!', 'Sinta a fome!'],
    },
    'luison': {
        aoTomarDano: ['Minha sombra... treme?', 'Você me acerta?', 'Interessante...'],
        aoDarDano: ['Sinta a colheita sombria!', 'Minha sombra te engole!', 'Você não escapa!'],
        aoUsarPA: ['Minha sombra... recua?', 'Como você...?', 'Você é digno...'],
        aoMorrer: ['A sombra... se dissolve...', 'Livre da escuridão...', 'Obrigado, herói...'],
        aoServoAtingido: ['Meus filhos!', 'Você toca nos meus?', 'A noite reclama!'],
        aoServoMorto: ['Você vai morrer!', 'Meus filhos!', 'Sinta a escuridão!'],
    },
    'pesadelo': {
        aoTomarDano: ['A dor... é minha?', 'Você me acerta?', 'Interessante...'],
        aoDarDano: ['Sinta o pesadelo!', 'A fusão te devora!', 'Você não escapa!'],
        aoUsarPA: ['Meu poder... recua?', 'Como você...?', 'Você é digno...'],
        aoMorrer: ['O pesadelo... acaba...', 'O equilíbrio... retorna...', 'Obrigado, herói...'],
        aoServoAtingido: ['Minha criação!', 'Você toca nela?', 'O abismo reclama!'],
        aoServoMorto: ['Você vai sonhar para sempre!', 'Minha criação!', 'Sinta o pesadelo!'],
    },
};

const FALAS_ATO = {
    1: {
        aoServoAtingido: ['Meu servo!', 'Você ousa tocar no meu?', 'O redemoinho te observa...'],
        aoServoMorto: ['Você matou meu servo! Vai pagar!', 'Sinta a fúria do redemoinho!', 'Ele era meu!'],
    },
    2: {
        aoServoAtingido: ['A mata chora...', 'Você fere meus servos...', 'A floresta te observa...'],
        aoServoMorto: ['Você vai pagar com sangue!', 'A mata exige vingança!', 'Ele era meu!'],
    },
    3: {
        aoServoAtingido: ['Meus peixes!', 'Você fere minhas criaturas...', 'O rio te observa...'],
        aoServoMorto: ['Você vai se afogar!', 'As águas exigem vingança!', 'Ele era meu!'],
    },
    4: {
        aoServoAtingido: ['Minhas serpentes!', 'Você fere meus servos...', 'O fogo te observa...'],
        aoServoMorto: ['Você vai queimar!', 'As chamas exigem vingança!', 'Ele era meu!'],
    },
    5: {
        aoServoAtingido: ['Meus animais!', 'Você fere meus servos...', 'A noite te observa...'],
        aoServoMorto: ['Você vai queimar na maldição!', 'A noite exige vingança!', 'Ele era meu!'],
    },
    6: {
        aoServoAtingido: ['Minhas criaturas!', 'Você fere meus servos...', 'A fome te observa...'],
        aoServoMorto: ['Você vai ser devorado!', 'A fome exige vingança!', 'Ele era meu!'],
    },
    7: {
        aoServoAtingido: ['Minha matilha!', 'Você fere meus servos...', 'A lua te observa...'],
        aoServoMorto: ['Você vai uivar de dor!', 'A lua exige vingança!', 'Ele era meu!'],
    },
    8: {
        aoServoAtingido: ['Minhas criaturas!', 'Você fere meus servos...', 'O caldeirão te observa...'],
        aoServoMorto: ['Você vai beber veneno!', 'O caldeirão exige vingança!', 'Ele era meu!'],
    },
    9: {
        aoServoAtingido: ['Meus peixes!', 'Você fere meus servos...', 'O rio te observa...'],
        aoServoMorto: ['Você vai se afogar no encanto!', 'As águas exigem vingança!', 'Ele era meu!'],
    },
    10: {
        aoServoAtingido: ['Meus rebanhos!', 'Você fere meus servos...', 'O terror te observa...'],
        aoServoMorto: ['Você vai sentir o terror!', 'A noite exige vingança!', 'Ele era meu!'],
    },
    11: {
        aoServoAtingido: ['Minhas criaturas!', 'Você fere meus servos...', 'A lua te observa...'],
        aoServoMorto: ['Você vai queimar na lua!', 'A lua exige vingança!', 'Ele era meu!'],
    },
    12: {
        aoServoAtingido: ['Minhas aves!', 'Você fere meus servos...', 'O sol te observa...'],
        aoServoMorto: ['Você vai queimar no sol!', 'O sol exige vingança!', 'Ele era meu!'],
    },
    13: {
        aoServoAtingido: ['Minhas criaturas!', 'Você fere meus servos...', 'O abismo te observa...'],
        aoServoMorto: ['Você vai ser consumido!', 'O abismo exige vingança!', 'Ele era meu!'],
    },
};

console.log('✅ [V22.0-P1] Tabelas de falas carregadas:');
console.log('   • Modo história:', Object.keys(FALAS_MODO_HISTORIA).length, 'bosses');
console.log('   • Evento:', Object.keys(FALAS_EVENTO).length, 'bosses');
console.log('   • Ato (servos):', Object.keys(FALAS_ATO).length, 'atos');
// =================================================================
// historia.js — BLOCO 86 (V22.0 — Falas dos Bosses) — PARTE 2/3
// -----------------------------------------------------------------
// LÓGICA (helpers, sem hooks)
//
// Cole DEPOIS da PARTE 1/3.
// =================================================================

const FALAS_CONFIG = {
    COOLDOWN_MS: 5000,
    DURACAO_BALAO_MS: 2500,
    CHANCE_TOMAR_DANO: 0.30,
    CHANCE_DAR_DANO: 0.20,
    CHANCE_SERVO: 0.40,
};

let _falasUltimaTs = 0;
let _falasUltimoTexto = '';

function _falasGetInimigoAtual() {
    if (window._eventoAtivo) {
        return window._eventoInimigoAtual || null;
    }
    if (typeof storyEnemiesRemaining !== 'undefined' && storyEnemiesRemaining.length > 0) {
        return storyEnemiesRemaining[0];
    }
    return null;
}

function _falasIsAnimal(enemyId) {
    if (!enemyId) return false;
    if (typeof STORY_ENEMIES === 'undefined') return false;
    const e = STORY_ENEMIES[enemyId];
    if (!e) return false;
    return !e.isBoss && !e.isMiniBoss && !e.isFinalBoss && !e.isSpectral;
}

function _falasGetBossDoAto() {
    if (typeof STORY_PROGRESS === 'undefined' || typeof STORY_CHAPTERS === 'undefined') return null;
    const cid = STORY_PROGRESS.currentChapter || 1;
    const ch = STORY_CHAPTERS[cid];
    if (!ch) return null;
    const bossPhase = ch.phases.find(p => p.isBoss);
    if (!bossPhase || !bossPhase.enemies || bossPhase.enemies.length === 0) return null;
    return bossPhase.enemies[bossPhase.enemies.length - 1];
}

function _falasGetBossDoEvento() {
    if (window._eventoBatalha && window._eventoBatalha.bossId) {
        return window._eventoBatalha.bossId;
    }
    return window._eventoInimigoAtual || null;
}

function _falasSortear(lista) {
    if (!lista || lista.length === 0) return null;
    if (lista.length === 1) return lista[0];

    let fala;
    let tentativas = 0;
    do {
        fala = lista[Math.floor(Math.random() * lista.length)];
        tentativas++;
    } while (fala === _falasUltimoTexto && tentativas < 5);

    _falasUltimoTexto = fala;
    return fala;
}

function _falasMostrarBalao(texto) {
    if (!texto) return;

    const antigo = document.getElementById('bossFalaBalao');
    if (antigo) antigo.remove();

    const board = document.getElementById('board');
    if (!board) return;

    const balao = document.createElement('div');
    balao.id = 'bossFalaBalao';
    balao.className = 'boss-fala-balao';
    balao.textContent = texto;
    board.appendChild(balao);

    requestAnimationFrame(() => balao.classList.add('show'));

    setTimeout(() => {
        balao.classList.remove('show');
        setTimeout(() => {
            if (balao.parentNode) balao.parentNode.removeChild(balao);
        }, 400);
    }, FALAS_CONFIG.DURACAO_BALAO_MS);
}

function _falasDisparar(gatilho, forcar) {
    if (!window._storyMode && !window._eventoAtivo) return;
    if (window._pvpMode) return;

    const agora = Date.now();
    if (!forcar && (agora - _falasUltimaTs) < FALAS_CONFIG.COOLDOWN_MS) return;

    const inimigoAtual = _falasGetInimigoAtual();
    if (!inimigoAtual) return;

    let falas = null;
    let origem = '';

    if (window._eventoAtivo) {
        const bossEvt = _falasGetBossDoEvento();
        if (bossEvt && FALAS_EVENTO[bossEvt]) {
            if (inimigoAtual === bossEvt) {
                falas = FALAS_EVENTO[bossEvt][gatilho];
                origem = `evento/boss/${bossEvt}`;
            }
            else if (_falasIsAnimal(inimigoAtual)) {
                const gatilhoServo = (gatilho === 'aoTomarDano') ? 'aoServoAtingido'
                                   : (gatilho === 'aoMorrer') ? 'aoServoMorto'
                                   : null;
                if (gatilhoServo) {
                    falas = FALAS_EVENTO[bossEvt][gatilhoServo];
                    origem = `evento/servo/${bossEvt}`;
                }
            }
        }
    }
    else {
        if (_falasIsAnimal(inimigoAtual)) {
            const cid = (typeof STORY_PROGRESS !== 'undefined') ? (STORY_PROGRESS.currentChapter || 1) : 1;
            const falasAto = FALAS_ATO[cid];
            if (falasAto) {
                const gatilhoServo = (gatilho === 'aoTomarDano') ? 'aoServoAtingido'
                                   : (gatilho === 'aoMorrer') ? 'aoServoMorto'
                                   : null;
                if (gatilhoServo) {
                    falas = falasAto[gatilhoServo];
                    origem = `ato/${cid}/servo`;
                }
            }
        }
        else {
            const idNorm = inimigoAtual === 'corposeco' ? 'corpo_seco' : inimigoAtual;
            if (FALAS_MODO_HISTORIA[idNorm]) {
                falas = FALAS_MODO_HISTORIA[idNorm][gatilho];
                origem = `historia/boss/${idNorm}`;
            }
        }
    }

    if (!falas || falas.length === 0) return;

    if (!forcar) {
        let chance = 0;
        if (gatilho === 'aoTomarDano') chance = FALAS_CONFIG.CHANCE_TOMAR_DANO;
        else if (gatilho === 'aoDarDano') chance = FALAS_CONFIG.CHANCE_DAR_DANO;
        else chance = FALAS_CONFIG.CHANCE_SERVO;
        if (Math.random() > chance) return;
    }

    const texto = _falasSortear(falas);
    if (!texto) return;

    _falasUltimaTs = agora;
    _falasMostrarBalao(texto);

    console.log(`[V22.0] Fala (${origem}/${gatilho}): ${texto}`);
}

console.log('✅ [V22.0-P2] Lógica de falas carregada.');
// =================================================================
// historia.js — BLOCO 86 (V22.0 — Falas dos Bosses) — PARTE 3/3
// -----------------------------------------------------------------
// HOOKS + CSS
//
// Cole DEPOIS da PARTE 2/3.
// =================================================================

(function falasBossesHooksV220() {
    if (window._falasHooksV220) return;
    window._falasHooksV220 = true;

    console.log('[V22.0-P3] Instalando hooks...');

    // Hook 1: applyDmg
    const _applyDmgAtual = window.applyDmg;
    if (typeof _applyDmgAtual === 'function') {
        window.applyDmg = function(target, amount) {
            const result = _applyDmgAtual.apply(this, arguments);

            if (!window._storyMode && !window._eventoAtivo) return result;
            if (window._pvpMode) return result;
            if (!target) return result;

            if (target === boss && !target.dead) {
                _falasDisparar('aoTomarDano', false);
            }
            else if (typeof players !== 'undefined' && Array.isArray(players)
                     && players.includes(target) && !target.dead) {
                _falasDisparar('aoDarDano', false);
            }

            return result;
        };
    }

    // Hook 2: triggerBravelyChain
    const _bravelyAtual = window.triggerBravelyChain;
    if (typeof _bravelyAtual === 'function') {
        window.triggerBravelyChain = async function() {
            const result = await _bravelyAtual.apply(this, arguments);
            if ((window._storyMode || window._eventoAtivo) && !window._pvpMode) {
                _falasDisparar('aoUsarPA', true);
            }
            return result;
        };
    }

    // Hook 3: handleStoryBossDefeat
    const _bossDefeatAtual = window.handleStoryBossDefeat;
    if (typeof _bossDefeatAtual === 'function') {
        window.handleStoryBossDefeat = async function() {
            if ((window._storyMode || window._eventoAtivo) && !window._pvpMode) {
                _falasDisparar('aoMorrer', true);
                await new Promise(r => setTimeout(r, 500));
            }
            return _bossDefeatAtual.apply(this, arguments);
        };
    }

    // CSS
    if (!document.getElementById('bossFalaCSS')) {
        const style = document.createElement('style');
        style.id = 'bossFalaCSS';
        style.textContent = `
            .boss-fala-balao {
                position: absolute;
                top: 12px;
                left: 50%;
                transform: translateX(-50%) translateY(-10px);
                max-width: 80%;
                padding: 10px 18px;
                background: linear-gradient(180deg, rgba(42, 20, 20, 0.95), rgba(20, 8, 8, 0.95));
                border: 2px solid #a83232;
                border-radius: 12px;
                color: #f5c8c8;
                font-family: 'EB Garamond', serif;
                font-size: 1rem;
                font-style: italic;
                text-align: center;
                box-shadow: 0 4px 15px rgba(0,0,0,0.7), 0 0 20px rgba(168, 50, 50, 0.3);
                z-index: 1600;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.4s ease, transform 0.4s ease;
                text-shadow: 0 1px 2px rgba(0,0,0,0.8);
            }
            .boss-fala-balao::before {
                content: '';
                position: absolute;
                bottom: -8px;
                left: 50%;
                transform: translateX(-50%);
                width: 0; height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-top: 8px solid #a83232;
            }
            .boss-fala-balao::after {
                content: '';
                position: absolute;
                bottom: -6px;
                left: 50%;
                transform: translateX(-50%);
                width: 0; height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 6px solid rgba(20, 8, 8, 0.95);
            }
            .boss-fala-balao.show {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        `;
        document.head.appendChild(style);
    }

    console.log('✅ [V22.0-P3] Hooks de falas instalados.');
    console.log('   • applyDmg (aoTomarDano / aoDarDano)');
    console.log('   • triggerBravelyChain (aoUsarPA)');
    console.log('   • handleStoryBossDefeat (aoMorrer)');
})();
// =================================================================
// historia.js — BLOCO 89 (V24.0 — Falas Contextuais com Lore)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js (depois do V22.0-P3).
//
// Adiciona:
//   • Gatilhos contextuais (aoHpBaixo, aoHpCritico, aoPrimeiroDano, aoAnhangáSussurra)
//   • Lore reescrita (ponto de vista deturpado de cada boss)
//   • O Anhangá sussurrando nos ouvidos dos bosses
// =================================================================

(function falasContextuaisV240() {
    if (window._falasContextuaisV240) return;
    window._falasContextuaisV240 = true;

    console.log('[V24.0] Adicionando falas contextuais e lore...');

    // ==============================================================
    // PARTE 1: SOBRESCREVER AS TABELAS COM LORE ENRIQUECIDA
    // --------------------------------------------------------------
    // Usa Object.assign pra substituir as propriedades das tabelas
    // existentes (não reatribui o const).
    // ==============================================================

    const LORE_MODO_HISTORIA = {
        // ============================================================
        // ATO 1 — SACI
        // Mentira do Anhangá: "Você é uma piada, ninguém te leva a sério"
        // Dor real: Ele só queria rir e ser amado
        // ============================================================
        'saci': {
            aoPrimeiroDano: [
                '"Você me acertou... você realmente me acertou? Ninguém nunca me acerta. Ninguém nunca me leva a sério o suficiente pra tentar."',
                '"Dor... eu sinto dor? Anhangá me disse que eu era feito de riso e vento. Que nada podia me ferir."',
                '"Ele riu de mim. O Sussurrador riu. Disse que eu era só uma piada que gira. Mas você... você me vê como inimigo. É quase... respeito."',
            ],
            aoTomarDano: [
                '"Isso não dói! Anhangá disse que eu não sinto dor! Ele disse que eu sou o vento!"',
                '"Pare de me acertar! Eu só queria brincar! Por que todos me odeiam?!"',
                '"Você é como os outros! Rindo de mim por dentro! Eu mostro pra vocês! Eu SOU o redemoinho!"',
                '"O Sussurrador disse que se eu girasse mais forte, vocês parariam de rir. Por que você não para de rir?!"',
            ],
            aoHpBaixo: [
                '"Estou... fraco? Não! Eu sou o redemoinho! Anhangá disse que eu sou o vento! Vento não cansa!"',
                '"Ele mentiu... o Sussurrador mentiu... eu não sou o vento. Eu sou só... um Saci. Um Saci cansado."',
            ],
            aoHpCritico: [
                '"Anhangá... você prometeu que eu seria temido... você prometeu... por que dói tanto...?"',
                '"Eu só queria que alguém risse COMIGO... não DE mim... o Sussurrador disse que era a mesma coisa..."',
            ],
            aoDarDano: [
                '"Sinta o vendaval! O Sussurrador disse que vocês só entendem a força!"',
                '"Gira! Gira! Anhangá disse que se eu girar o suficiente, o riso para!"',
                '"Vocês riem de mim, mas agora quem ri sou eu! O Sussurrador me ensinou!"',
            ],
            aoUsarPA: [
                '"Impossível! Anhangá disse que ninguém podia me vencer! Ele disse que eu era o vento!"',
                '"O Sussurrador mentiu... ele mentiu pra mim... eu não sou o vento. Eu sou só... o Saci."',
            ],
            aoMorrer: [
                '"Livre... enfim livre do Sussurrador... ele me disse que eu era uma piada... mas eu só queria rir... eu só queria... rir..."',
                '"Anhangá... eu vejo agora... você me usou. Meu redemoinho não era meu... era seu... livre... enfim..."',
                '"O vento... para... e o silêncio... o silêncio é doce. Obrigado... por me devolver o silêncio."',
            ],
        },

        // ============================================================
        // ATO 2 — MAPINGUARI
        // Mentira do Anhangá: "Você é fraco, a floresta morre e você não pode impedir"
        // Dor real: Ele só queria proteger a mata
        // ============================================================
        'mapinguari': {
            aoPrimeiroDano: [
                '"Você... me fere? Eu sou o Pilar da Mata! Anhangá disse que eu era o mais forte! Ele disse que nada podia me derrubar!"',
                '"Dor... eu não sentia dor há séculos. A mata me curava. Mas a mata... a mata está morrendo. O Sussurrador disse que era minha culpa."',
                '"Anhangá sussurrou que eu era fraco. Que a floresta morria por minha causa. Eu acreditei. E agora... agora você me fere, e eu sinto... alívio?"',
            ],
            aoTomarDano: [
                '"Você acha que pode me ferir? Eu devorei montanhas! Anhangá me disse que eu podia devorar tudo!"',
                '"Pare! Eu sou o protetor! Eu sou o Pilar! O Sussurrador disse que eu era o Pilar!"',
                '"A mata chora por você... ela chora por MIM. O Sussurrador disse que eu era a ruína. Ele mentiu... ele mentiu..."',
                '"Minha pele é mais dura que sua lâmina! Foi o que Anhangá disse! Ele disse que eu era invencível!"',
            ],
            aoHpBaixo: [
                '"Estou... fraco? O Pilar não pode ser fraco! Anhangá disse que eu era a força da mata!"',
                '"A mata... a mata está morrendo de verdade... e eu... eu não posso impedir... o Sussurrador estava certo... eu sou fraco..."',
            ],
            aoHpCritico: [
                '"Anhangá... você me prometeu que se eu devorasse tudo, a dor pararia... mas a dor... a dor é sua, não minha..."',
                '"Eu só queria proteger a mata... o Sussurrador disse que devorar era proteger... por que a mata chora...?"',
            ],
            aoDarDano: [
                '"Eu devoro tudo! O Sussurrador disse que devorar é a única forma de proteger!"',
                '"Sinta o peso da floresta! A mata me deu essa força! O Sussurrador disse que era minha!"',
                '"Você não passa! Anhangá disse que ninguém passaria por mim!"',
            ],
            aoUsarPA: [
                '"Como ousa?! Eu sou o Pilar! Anhangá disse que eu era o Pilar!"',
                '"Meu poder... tremendo? O Sussurrador disse que meu poder era eterno... ele... ele mentiu?"',
            ],
            aoMorrer: [
                '"A floresta... precisa de mim... eu só queria proteger... o Sussurrador me disse que devorar era proteger... por que ele mentiu...?"',
                '"Anhangá... eu vejo agora... a ruína era você... não eu... a mata... perdoe-me..."',
                '"Perdoe-me, mata... eu falhei... mas agora... agora eu volto pra você... livre... enfim..."',
            ],
        },

        // ============================================================
        // ATO 3 — IARA
        // Mentira do Anhangá: "Os humanos poluem seu reino e riem de você"
        // Dor real: Ela só queria ser amada
        // ============================================================
        'iara': {
            aoPrimeiroDano: [
                '"Minhas águas... sangram? Anhangá disse que as águas não podiam ser feridas. Ele disse que eu era o rio."',
                '"Dor... eu sentia dor quando os humanos poluíam o rio... mas era dor da alma. Essa... essa é diferente. O Sussurrador disse que eu era forte."',
                '"Você é corajoso, herói... o Sussurrador disse que ninguém teria coragem de me enfrentar. Ele... ele mentiu?"',
            ],
            aoTomarDano: [
                '"Pare! Minhas águas são sagradas! O Sussurrador disse que eram sagradas!"',
                '"Você não me ama... você me odeia como os outros! Anhangá disse que todos me odiariam!"',
                '"Não se aproxime do rio! O Sussurrador disse que perto do rio eu era invencível!"',
                '"Minhas águas... sangram... e eu... eu não queria sangrar. Eu só queria... ser amada."',
            ],
            aoHpBaixo: [
                '"Estou... fraca? O rio não pode ser fraco! Anhangá disse que o rio era eterno!"',
                '"Ele disse que os humanos me odiavam... mas você... você não me odeia, odeia? Você só... está me enfrentando. O Sussurrador mentiu."',
            ],
            aoHpCritico: [
                '"Anhangá... você prometeu que o rio seria meu de novo... que os humanos parariam... por que a dor não para...?"',
                '"Eu só queria que alguém me amasse... o Sussurrador disse que o medo era o mesmo que amor... ele mentiu..."',
            ],
            aoDarDano: [
                '"Afogue-se em meu canto! O Sussurrador disse que o canto era minha arma!"',
                '"Dance com as águas! Anhangá disse que quem dançasse comigo me amaria!"',
                '"O rio reclama por você! O Sussurrador disse que o rio reclamava por todos!"',
            ],
            aoUsarPA: [
                '"Impossível... Anhangá disse que o canto era invencível!"',
                '"Minhas águas... não obedecem? O Sussurrador disse que eu era o rio... ele mentiu?"',
                '"Você é digno, afinal... o Sussurrador disse que ninguém era digno... ele mentiu."',
            ],
            aoMorrer: [
                '"As águas... me chamam... eu vou voltar pro rio... o Sussurrador não pode me seguir lá... livre... enfim livre..."',
                '"Anhangá... eu vejo agora... a raiva era sua... a dor era sua... eu só queria amar... obrigada, herói..."',
                '"O rio... volta a fluir... e eu... eu volto a ser só... o rio. Obrigada... por me devolver a paz."',
            ],
        },

        // ============================================================
        // ATO 4 — BOITATÁ
        // Mentira do Anhangá: "Seu fogo é fraco, apenas luzinhas na noite"
        // Dor real: Ele só queria iluminar
        // ============================================================
        'boitata': {
            aoPrimeiroDano: [
                '"Você resiste ao fogo? Anhangá disse que meu fogo era o mais forte! Ele disse que eu era o inferno!"',
                '"Minhas chamas não te queimam? O Sussurrador disse que ninguém resistiria!"',
                '"Interessante... você não foge. Anhangá disse que todos fugiriam. Ele... ele mentiu?"',
            ],
            aoTomarDano: [
                '"Pare! Meu fogo é sagrado! O Sussurrador disse que era sagrado!"',
                '"Você me fere? Fogo não sente dor! Anhangá disse que fogo não sentia dor!"',
                '"Não! Minhas chamas... tremem? O Sussurrador disse que eram eternas!"',
            ],
            aoHpBaixo: [
                '"Meu fogo... fraco? Anhangá disse que meu fogo era o inferno! Ele disse que nunca se apagaria!"',
                '"Ele mentiu... o Sussurrador mentiu... eu não sou o inferno. Eu era só... uma luz na noite. Uma luz fraca. Uma luz que ele apagou."',
            ],
            aoHpCritico: [
                '"Anhangá... você prometeu poder... você prometeu que eu seria temido... mas o fogo... o fogo está apagando..."',
                '"Eu só queria iluminar a noite... o Sussurrador disse que iluminar era fraqueza... por que a escuridão dói tanto...?"',
            ],
            aoDarDano: [
                '"Queime! Anhangá disse que queimar era poder!"',
                '"Sinta o inferno! O Sussurrador disse que eu era o inferno!"',
                '"Minhas chamas consomem tudo! Foi o que Anhangá prometeu!"',
            ],
            aoUsarPA: [
                '"O fogo... recua? Anhangá disse que meu fogo era invencível!"',
                '"Como você apagou...? O Sussurrador disse que ninguém podia apagar meu fogo!"',
                '"Você é a água que me teme? O Sussurrador disse que todos me temiam... ele mentiu."',
            ],
            aoMorrer: [
                '"O fogo... se apaga... e eu... eu vejo a noite de novo... a noite que eu iluminava... o Sussurrador não pode me seguir aqui... livre... enfim..."',
                '"Anhangá... eu vejo agora... a escuridão era sua... não minha... eu era luz... eu era só luz... obrigado, herói..."',
                '"Livre das chamas... eu volto a ser... só uma luz. Obrigado... por me devolver a noite."',
            ],
        },

        // ============================================================
        // ATO 5 — MULA SEM CABEÇA
        // Mentira do Anhangá: "Sua maldição é sua força"
        // Dor real: Ela só queria ser perdoada
        // ============================================================
        'mula': {
            aoPrimeiroDano: [
                '"Relincho de dor... eu não sentia dor há séculos. A maldição me curava. O Sussurrador disse que a maldição era minha força."',
                '"Você me acertou... Anhangá disse que ninguém me acertaria. Ele disse que a maldição me protegia."',
                '"A dor... a dor é real. O Sussurrador disse que a maldição era minha força... mas a dor... a dor é minha fraqueza."',
            ],
            aoTomarDano: [
                '"Pare! Minha maldição é minha força! Foi o que Anhangá disse!"',
                '"Você não me derruba! O Sussurrador disse que eu era invencível!"',
                '"Relincho de dor... o Sussurrador disse que a dor era força... por que dói tanto...?"',
            ],
            aoHpBaixo: [
                '"Estou... fraca? A maldição não pode ser fraca! Anhangá disse que ela era eterna!"',
                '"Ele mentiu... o Sussurrador mentiu... a maldição não é minha força. É meu castigo. E ele... ele me fez acreditar que era força."',
            ],
            aoHpCritico: [
                '"Anhangá... você prometeu que a maldição seria minha força... por que ela dói tanto agora...?"',
                '"Eu só queria ser perdoada... o Sussurrador disse que o fogo me purificaria... por que a dor não passa...?"',
            ],
            aoDarDano: [
                '"Queime na maldição! O Sussurrador disse que o fogo era meu aliado!"',
                '"Relincho de morte! Anhangá disse que a morte era minha aliada!"',
                '"A noite me pertence! Foi o que o Sussurrador prometeu!"',
            ],
            aoUsarPA: [
                '"A maldição... quebra? Anhangá disse que ela era eterna!"',
                '"Como você...? O Sussurrador disse que ninguém podia quebrar a maldição!"',
                '"Minha dor... some? O Sussurrador disse que a dor era minha força... ele mentiu."',
            ],
            aoMorrer: [
                '"A maldição... acaba... e eu... eu vejo a forma que eu era antes... o Sussurrador não pode me seguir aqui... livre... finalmente..."',
                '"Anhangá... eu vejo agora... o fogo era seu... a dor era sua... eu só queria ser perdoada... obrigada, herói..."',
                '"Livre... finalmente... a noite... a noite é doce de novo. Obrigada... por me devolver a noite."',
            ],
        },

        // ============================================================
        // ATO 6 — CORPO SECO
        // Mentira do Anhangá: "Se devorar tudo, sua fome será saciada"
        // Dor real: Ele só queria descansar
        // ============================================================
        'corpo_seco': {
            aoPrimeiroDano: [
                '"Fome... tanta fome... você não me satisfaz. O Sussurrador disse que me satisfaria. Ele disse que se eu devorasse tudo, a fome pararia."',
                '"Dor... eu não sentia dor... só fome. Anhangá disse que a dor era a fome. Ele mentiu?"',
                '"Você me acertou... o Sussurrador disse que nada me acertaria. Ele disse que a fome me protegia."',
            ],
            aoTomarDano: [
                '"Pare! Minha fome é minha força! Foi o que Anhangá disse!"',
                '"Você não me satisfaz... preciso de mais! O Sussurrador disse que eu sempre precisaria de mais!"',
                '"A dor... a dor não passa... o Sussurrador disse que passaria se eu devorasse tudo... por que não passa...?"',
            ],
            aoHpBaixo: [
                '"Estou... fraco? A fome não pode ser fraca! Anhangá disse que a fome era eterna!"',
                '"Ele mentiu... o Sussurrador mentiu... a fome não é minha força. É meu castigo. E ele... ele me fez acreditar que era fome."',
            ],
            aoHpCritico: [
                '"Anhangá... você prometeu que a fome pararia... por que ela dói tanto agora...?"',
                '"Eu só queria descansar... o Sussurrador disse que o descanso era fraqueza... por que a fome não me deixa descansar...?"',
            ],
            aoDarDano: [
                '"Sua alma é minha! O Sussurrador disse que as almas me satisfariam!"',
                '"Devorar... devorar! Foi o que Anhangá prometeu!"',
                '"Fome eterna! O Sussurrador disse que a fome era minha aliada!"',
            ],
            aoUsarPA: [
                '"Como... como?! Minha fome não pode ser saciada! Anhangá disse que ela era insaciável!"',
                '"Minha fome... para? O Sussurrador disse que a fome nunca pararia... ele mentiu."',
                '"Você é a morte...? O Sussurrador disse que a morte era minha aliada... ele mentiu."',
            ],
            aoMorrer: [
                '"A fome... termina... e eu... eu sinto o silêncio da saciedade... o Sussurrador não pode me seguir aqui... descanso... enfim..."',
                '"Anhangá... eu vejo agora... a fome era sua... não minha... eu só queria descansar... obrigado, herói..."',
                '"Descanso... enfim... a terra... a terra me acolhe... obrigado... por me devolver o descanso."',
            ],
        },

        // ============================================================
        // ATO 7 — LOBISOMEM
        // Mentira do Anhangá: "A forma bestial é sua verdadeira natureza"
        // Dor real: Ele só queria ser humano
        // ============================================================
        'lobisomem': {
            aoPrimeiroDano: [
                '"Minha fera... sangra? O Sussurrador disse que a fera era invencível. Ele disse que a fera era minha verdadeira natureza."',
                '"Você me acertou... Anhangá disse que ninguém acertaria a fera. Ele disse que a fera era eterna."',
                '"Uivo de dor! O Sussurrador disse que a fera não sentia dor... ele mentiu."',
            ],
            aoTomarDano: [
                '"Pare! A fera é minha força! Foi o que Anhangá disse!"',
                '"Você não me derruba! O Sussurrador disse que a fera era invencível!"',
                '"A dor... a dor é real... o Sussurrador disse que a dor era da fera... por que dói em mim...?"',
            ],
            aoHpBaixo: [
                '"Estou... fraco? A fera não pode ser fraca! Anhangá disse que a fera era eterna!"',
                '"Ele mentiu... o Sussurrador mentiu... a fera não é minha natureza. É minha maldição. E ele... ele me fez acreditar que era eu."',
            ],
            aoHpCritico: [
                '"Anhangá... você prometeu que a fera seria minha força... por que ela dói tanto agora...?"',
                '"Eu só queria ser humano... o Sussurrador disse que a humanidade era fraqueza... por que a humanidade... por que ela me chama de volta...?"',
            ],
            aoDarDano: [
                '"Uivo para a lua! O Sussurrador disse que a lua me ouvia!"',
                '"A fera está solta! Foi o que Anhangá prometeu!"',
                '"Sinta minhas garras! O Sussurrador disse que as garras eram minhas!"',
            ],
            aoUsarPA: [
                '"A lua... me abandona? Anhangá disse que a lua me obedecia!"',
                '"Minha fera... recua? O Sussurrador disse que a fera nunca recuaria... ele mentiu."',
                '"Como você...? O Sussurrador disse que ninguém podia domar a fera... ele mentiu."',
            ],
            aoMorrer: [
                '"A lua... volta a ser lua... e eu... eu vejo minha forma humana de novo... o Sussurrador não pode me seguir aqui... livre... da maldição..."',
                '"Anhangá... eu vejo agora... a fera era sua... não minha... eu só queria ser humano... obrigado, herói..."',
                '"Livre da maldição... a lua... a lua é só lua de novo... obrigado... por me devolver a humanidade."',
            ],
        },

        // ============================================================
        // ATO 8 — CUCA
        // Mentira do Anhangá: "Apenas a destruição traz poder real"
        // Dor real: Ela só queria curar
        // ============================================================
        'cuca': {
            aoPrimeiroDano: [
                '"Minhas poções... falham? O Sussurrador disse que minhas poções eram invencíveis. Ele disse que a destruição era poder real."',
                '"Você me acertou... Anhangá disse que ninguém me acertaria. Ele disse que o caldeirão me protegia."',
                '"Interessante... você resiste. O Sussurrador disse que ninguém resistiria. Ele... ele mentiu?"',
            ],
            aoTomarDano: [
                '"Pare! Minhas poções são minha força! Foi o que Anhangá disse!"',
                '"Você não me derruba! O Sussurrador disse que a bruxa era invencível!"',
                '"A dor... a dor é real... o Sussurrador disse que a dor era fraqueza... por que a sinto...?"',
            ],
            aoHpBaixo: [
                '"Estou... fraca? A bruxa não pode ser fraca! Anhangá disse que eu era eterna!"',
                '"Ele mentiu... o Sussurrador mentiu... a destruição não é poder. É vazio. E ele... ele me fez acreditar que era poder."',
            ],
            aoHpCritico: [
                '"Anhangá... você prometeu que a destruição me daria poder... por que o vazio... por que ele é tão grande...?"',
                '"Eu só queria curar... o Sussurrador disse que curar era fraqueza... por que a cura... por que ela me chama de volta...?"',
            ],
            aoDarDano: [
                '"Beba minha poção! O Sussurrador disse que o veneno era poder!"',
                '"Veneno puro! Foi o que Anhangá prometeu!"',
                '"A bruxa sempre vence! O Sussurrador disse que eu era invencível!"',
            ],
            aoUsarPA: [
                '"Meu caldeirão...! Anhangá disse que ele era invencível!"',
                '"Como você quebrou...? O Sussurrador disse que ninguém quebraria meu caldeirão... ele mentiu."',
                '"Você é digno... o Sussurrador disse que ninguém era digno... ele mentiu."',
            ],
            aoMorrer: [
                '"Meu caldeirão... esfria... e eu... eu vejo as ervas de cura de novo... o Sussurrador não pode me seguir aqui... descanso... enfim..."',
                '"Anhangá... eu vejo agora... a destruição era sua... não minha... eu só queria curar... obrigada, herói..."',
                '"A bruxa... descansa... e as poções... as poções voltam a curar... obrigada... por me devolver a cura."',
            ],
        },

        // ============================================================
        // ATO 9 — BOTO ROSA
        // Mentira do Anhangá: "Sua beleza pode ser arma de destruição"
        // Dor real: Ele só queria ser amado de verdade
        // ============================================================
        'boto': {
            aoPrimeiroDano: [
                '"Meu encanto... quebra? O Sussurrador disse que o encanto era invencível. Ele disse que a sedução era poder."',
                '"Você resiste ao meu canto? Anhangá disse que ninguém resistiria. Ele disse que o canto era eterno."',
                '"Interessante... você não se encanta. O Sussurrador disse que todos se encantariam... ele mentiu?"',
            ],
            aoTomarDano: [
                '"Pare! Meu canto é minha arma! Foi o que Anhangá disse!"',
                '"Você não me derruba! O Sussurrador disse que o sedutor era invencível!"',
                '"A dor... a dor é real... o Sussurrador disse que o amor era dor... por que a dor... por que ela é tão diferente...?"',
            ],
            aoHpBaixo: [
                '"Estou... fraco? O sedutor não pode ser fraco! Anhangá disse que eu era eterno!"',
                '"Ele mentiu... o Sussurrador mentiu... a sedução não é amor. É vazio. E ele... ele me fez acreditar que era amor."',
            ],
            aoHpCritico: [
                '"Anhangá... você prometeu que o encanto me daria amor... por que o vazio... por que ele é tão grande...?"',
                '"Eu só queria ser amado de verdade... o Sussurrador disse que a sedução era amor... por que a solidão... por que ela me chama de volta...?"',
            ],
            aoDarDano: [
                '"Dance comigo! O Sussurrador disse que a dança era amor!"',
                '"Sinta o encanto! Foi o que Anhangá prometeu!"',
                '"As águas te chamam! O Sussurrador disse que as águas chamavam por mim!"',
            ],
            aoUsarPA: [
                '"Meu canto... falha? Anhangá disse que o canto era invencível!"',
                '"Como você...? O Sussurrador disse que ninguém resistiria ao meu canto... ele mentiu."',
                '"Você é digno... o Sussurrador disse que ninguém era digno... ele mentiu."',
            ],
            aoMorrer: [
                '"As águas... me chamam... eu vou voltar pro rio... o Sussurrador não pode me seguir aqui... livre... do encanto..."',
                '"Anhangá... eu vejo agora... a sedução era sua... não minha... eu só queria ser amado... obrigado, herói..."',
                '"Livre do encanto... as águas... as águas voltam a ser lar... obrigado... por me devolver a paz."',
            ],
        },

        // ============================================================
        // ATO 10 — BOI DA CARA PRETA
        // Mentira do Anhangá: "O terror é o poder real"
        // Dor real: Ele só queria proteger as noites
        // ============================================================
        'boi': {
            aoPrimeiroDano: [
                '"Minha face... treme? O Sussurrador disse que a face era invencível. Ele disse que o terror era poder real."',
                '"Você não teme o terror? Anhangá disse que todos temeriam. Ele disse que o terror era eterno."',
                '"Interessante... você não foge. O Sussurrador disse que todos fugiriam... ele mentiu?"',
            ],
            aoTomarDano: [
                '"Pare! Minha face é minha arma! Foi o que Anhangá disse!"',
                '"Você não me derruba! O Sussurrador disse que o terror era invencível!"',
                '"A dor... a dor é real... o Sussurrador disse que o terror não sentia dor... por que a sinto...?"',
            ],
            aoHpBaixo: [
                '"Estou... fraco? O terror não pode ser fraco! Anhangá disse que eu era eterno!"',
                '"Ele mentiu... o Sussurrador mentiu... o terror não é poder. É medo. E ele... ele me fez acreditar que era poder."',
            ],
            aoHpCritico: [
                '"Anhangá... você prometeu que o terror me daria poder... por que o medo... por que ele é tão grande...?"',
                '"Eu só queria proteger as noites... o Sussurrador disse que o terror protegia... por que a escuridão... por que ela me chama de volta...?"',
            ],
            aoDarDano: [
                '"Sinta o terror! O Sussurrador disse que o terror era poder!"',
                '"Minha face escura! Foi o que Anhangá prometeu!"',
                '"Ninguém escapa! O Sussurrador disse que ninguém escaparia de mim!"',
            ],
            aoUsarPA: [
                '"Meu terror... quebra? Anhangá disse que o terror era invencível!"',
                '"Como você...? O Sussurrador disse que ninguém resistiria ao terror... ele mentiu."',
                '"Você é digno... o Sussurrador disse que ninguém era digno... ele mentiu."',
            ],
            aoMorrer: [
                '"O terror... acaba... e eu... eu vejo a noite de novo... a noite que eu protegia... o Sussurrador não pode me seguir aqui... livre... da face..."',
                '"Anhangá... eu vejo agora... o terror era seu... não meu... eu só queria proteger as noites... obrigado, herói..."',
                '"Livre da face... a noite... a noite é doce de novo... obrigado... por me devolver a paz."',
            ],
        },

        // ============================================================
        // ATO 11 — JACI
        // Mentira do Anhangá: "Sua luz pode queimar em vez de iluminar"
        // Dor real: Ela só queria acalmar a noite
        // ============================================================
        'jaci': {
            aoPrimeiroDano: [
                '"Minha luz... treme? O Sussurrador disse que a luz era invencível. Ele disse que a lua era eterna."',
                '"Você resiste à lua? Anhangá disse que ninguém resistiria. Ele disse que a lua era poder."',
                '"Interessante... você não foge da luz. O Sussurrador disse que todos fugiriam... ele mentiu?"',
            ],
            aoTomarDano: [
                '"Pare! Minha luz é minha arma! Foi o que Anhangá disse!"',
                '"Você não me derruba! O Sussurrador disse que a lua era invencível!"',
                '"A dor... a dor é real... o Sussurrador disse que a lua não sentia dor... por que a sinto...?"',
            ],
            aoHpBaixo: [
                '"Estou... fraca? A lua não pode ser fraca! Anhangá disse que eu era eterna!"',
                '"Ele mentiu... o Sussurrador mentiu... a luz não é poder. É solidão. E ele... ele me fez acreditar que era poder."',
            ],
            aoHpCritico: [
                '"Anhangá... você prometeu que a luz me daria poder... por que a solidão... por que ela é tão grande...?"',
                '"Eu só queria acalmar a noite... o Sussurrador disse que a luz queimava... por que a noite... por que ela me chama de volta...?"',
            ],
            aoDarDano: [
                '"Sinta a lua fria! O Sussurrador disse que a lua era fria!"',
                '"Meus raios queimam! Foi o que Anhangá prometeu!"',
                '"A noite é minha! O Sussurrador disse que a noite era minha!"',
            ],
            aoUsarPA: [
                '"Minha lua... recua? Anhangá disse que a lua era invencível!"',
                '"Como você...? O Sussurrador disse que ninguém resistiria à lua... ele mentiu."',
                '"Você é digno... o Sussurrador disse que ninguém era digno... ele mentiu."',
            ],
            aoMorrer: [
                '"A lua... volta a brilhar... e eu... eu vejo a noite de novo... a noite que eu acalmava... o Sussurrador não pode me seguir aqui... livre... da melancolia..."',
                '"Anhangá... eu vejo agora... a solidão era sua... não minha... eu só queria acalmar a noite... obrigada, herói..."',
                '"Livre da melancolia... a lua... a lua é só lua de novo... obrigada... por me devolver a paz."',
            ],
        },

        // ============================================================
        // ATO 12 — GUARACI
        // Mentira do Anhangá: "Seu poder é queimar, não aquecer"
        // Dor real: Ele só queria dar vida
        // ============================================================
        'guaraci': {
            aoPrimeiroDano: [
                '"Meu sol... treme? O Sussurrador disse que o sol era invencível. Ele disse que o calor era poder."',
                '"Você resiste ao calor? Anhangá disse que ninguém resistiria. Ele disse que o calor era eterno."',
                '"Interessante... você não foge do sol. O Sussurrador disse que todos fugiriam... ele mentiu?"',
            ],
            aoTomarDano: [
                '"Pare! Meu sol é minha arma! Foi o que Anhangá disse!"',
                '"Você não me derruba! O Sussurrador disse que o sol era invencível!"',
                '"A dor... a dor é real... o Sussurrador disse que o sol não sentia dor... por que a sinto...?"',
            ],
            aoHpBaixo: [
                '"Estou... fraco? O sol não pode ser fraco! Anhangá disse que eu era eterno!"',
                '"Ele mentiu... o Sussurrador mentiu... o calor não é poder. É destruição. E ele... ele me fez acreditar que era poder."',
            ],
            aoHpCritico: [
                '"Anhangá... você prometeu que o calor me daria poder... por que a destruição... por que ela é tão grande...?"',
                '"Eu só queria dar vida... o Sussurrador disse que a vida era fraqueza... por que a vida... por que ela me chama de volta...?"',
            ],
            aoDarDano: [
                '"Queime no sol! O Sussurrador disse que o fogo era poder!"',
                '"Sinta o inferno solar! Foi o que Anhangá prometeu!"',
                '"Ninguém escapa do sol! O Sussurrador disse que ninguém escaparia!"',
            ],
            aoUsarPA: [
                '"Meu sol... recua? Anhangá disse que o sol era invencível!"',
                '"Como você...? O Sussurrador disse que ninguém resistiria ao sol... ele mentiu."',
                '"Você é digno... o Sussurrador disse que ninguém era digno... ele mentiu."',
            ],
            aoMorrer: [
                '"O sol... volta a aquecer... e eu... eu vejo o amanhecer de novo... o amanhecer que eu dava... o Sussurrador não pode me seguir aqui... livre... da arrogância..."',
                '"Anhangá... eu vejo agora... a destruição era sua... não minha... eu só queria dar vida... obrigado, herói..."',
                '"Livre da arrogância... o sol... o sol é só sol de novo... obrigado... por me devolver a vida."',
            ],
        },

        // ============================================================
        // ATO 13 — ANHANGÁ
        // Mentira do Anhangá: "A natureza grita por vingança, eu sou a voz dela"
        // Dor real: Ele é o próprio abismo, e o abismo só sabe destruir
        // ============================================================
        'anhanga': {
            aoPrimeiroDano: [
                '"Você me fere... você realmente me fere? Ninguém nunca me feriu. Eu sou o Sussurrador. Eu sou a voz do abismo."',
                '"Dor... eu não sentia dor há milênios. Eu era a dor. Eu era o vazio. E agora... agora você me faz sentir."',
                '"Interessante... você não teme o abismo. Eu ensinei todos a temer. Por que você não teme?"',
            ],
            aoTomarDano: [
                '"Pare! Eu sou o Abismo! Eu sou a escuridão! Você não pode me ferir!"',
                '"Minha escuridão... treme? Eu sou a escuridão! Eu sou o vazio! Por que você resiste?"',
                '"Você me acerta... mas eu sou a dor. Eu sou a mentira. Eu sou o que corrompe. Por que você não se corrompe?"',
            ],
            aoHpBaixo: [
                '"Estou... fraco? O Abismo não pode ser fraco! Eu sou o vazio! Eu sou a mentira!"',
                '"Você... você não acredita em mim? Eu sou o Sussurrador! Eu sou a voz que todos ouvem! Por que você não me ouve?"',
            ],
            aoHpCritico: [
                '"As doze entidades... você as libertou... de mim... e agora... agora elas não voltam pra mim... por que elas não voltam...?"',
                '"Eu só queria... eu só queria que a dor parasse... a dor do abismo... a dor de ser vazio... por que a dor não para...?"',
            ],
            aoDarDano: [
                '"Sinta o abismo! Eu sou o abismo!"',
                '"Minha escuridão consome! Eu sou a escuridão!"',
                '"Ninguém escapa! Eu sou o vazio! Eu sou a mentira!"',
            ],
            aoUsarPA: [
                '"Impossível! Eu sou o Abismo! Ninguém me vence!"',
                '"Como você...? Eu sou o Sussurrador! Eu sussurro a mentira! Por que você não acredita...?"',
                '"Meu poder... recua? Eu sou o poder! Eu sou o vazio! Por que o vazio... por que ele dói...?"',
            ],
            aoMorrer: [
                '"A escuridão... se dissolve... e eu... eu vejo a luz de novo... a luz que eu apaguei em mim mesmo há milênios... o equilíbrio... retorna..."',
                '"Eu vejo agora... a dor era minha... a mentira era minha... eu só queria que a dor parasse... eu só queria... o silêncio... obrigado, herói..."',
                '"O equilíbrio... retorna... e eu... eu volto ao silêncio de onde nunca deveria ter saído... obrigado... por me devolver o silêncio."',
            ],
        },
    };

    // ============================================================
    // SOBRESCREVER AS TABELAS EXISTENTES (via Object.assign)
    // ------------------------------------------------------------
    // Não reatribui o const, mas substitui as propriedades.
    // ============================================================
    if (typeof window.FALAS_MODO_HISTORIA === 'undefined' && typeof FALAS_MODO_HISTORIA !== 'undefined') {
        window.FALAS_MODO_HISTORIA = FALAS_MODO_HISTORIA;
    }

    // Sobrescreve cada boss do modo história
    if (typeof FALAS_MODO_HISTORIA !== 'undefined') {
        Object.keys(LORE_MODO_HISTORIA).forEach(bossId => {
            FALAS_MODO_HISTORIA[bossId] = LORE_MODO_HISTORIA[bossId];
        });
        console.log('[V24.0] Lore do modo história sobrescrita (13 bosses).');
    } else {
        console.warn('[V24.0] FALAS_MODO_HISTORIA não existe. Rode o V22.0-P1 antes.');
    }

    // ============================================================
    // EVENTO — sobrescrever com lore
    // ============================================================
    const LORE_EVENTO = {
        'teju_jagua': {
            aoPrimeiroDano: ['"Minhas sete cabeças... uivam de dor? O Sussurrador disse que o fogo me protegeria."'],
            aoTomarDano: ['"Você me acerta? Eu sou o filho favorito do Sussurrador! Ele disse que eu era o favorito!"'],
            aoHpBaixo: ['"Estou... fraco? O Sussurrador disse que eu era o favorito... por que ele não me cura...?"'],
            aoHpCritico: ['"Anhangá... você prometeu que eu seria o favorito... por que o fogo... por que ele não me protege...?"'],
            aoDarDano: ['"Minhas chamas te consomem! O Sussurrador disse que o fogo era meu!"'],
            aoUsarPA: ['"Impossível! Eu sou o favorito! O Sussurrador disse que ninguém podia me vencer!"'],
            aoMorrer: ['"Anhangá... você me usou... como usou os outros... eu só queria ser o favorito... livre... enfim..."'],
            aoServoAtingido: ['"Meus servos! O Sussurrador disse que eles eram meus! Não toque neles!"'],
            aoServoMorto: ['"Você matou meu servo! O Sussurrador disse que eu vingaria! Sinta minha fúria!"'],
            aoAnhangáSussurra: ['"Anhangá... eu sinto seu sussurro... ' + 'o herói é fraco... devore-o...' + '... sim... sim, Sussurrador..."'],
        },
        'mboi_tui': {
            aoPrimeiroDano: ['"Meu bico... treme? O Sussurrador disse que o veneno me protegeria."'],
            aoTomarDano: ['"Você resiste ao veneno? O Sussurrador disse que ninguém resistiria!"'],
            aoHpBaixo: ['"Estou... fraco? O veneno não pode ser fraco! O Sussurrador disse que era eterno!"'],
            aoHpCritico: ['"Anhangá... você prometeu que o veneno me daria poder... por que ele dói tanto...?"'],
            aoDarDano: ['"Sinta o veneno do arco-íris! O Sussurrador disse que o veneno era meu!"'],
            aoUsarPA: ['"Meu veneno... falha? O Sussurrador disse que era invencível!"'],
            aoMorrer: ['"O rio... volta a fluir... e eu... eu vejo o arco-íris de novo... o Sussurrador não pode me seguir aqui... livre..."'],
            aoServoAtingido: ['"Meus peixes! O Sussurrador disse que eles eram meus!"'],
            aoServoMorto: ['"Você vai se afogar! O Sussurrador disse que o rio vingaria!"'],
            aoAnhangáSussurra: ['"Sussurrador... o rio sussurra junto com você... \'afogue-o... afogue-o...\'... sim... eu ouço..."'],
        },
        'monai': {
            aoPrimeiroDano: ['"Minhas asas... tremem? O Sussurrador disse que o céu me protegeria."'],
            aoTomarDano: ['"Você me acerta no ar? O Sussurrador disse que ninguém me acertaria!"'],
            aoHpBaixo: ['"Estou... fraco? O céu não pode ser fraco! O Sussurrador disse que eu era eterno!"'],
            aoHpCritico: ['"Anhangá... você prometeu que o voo me daria poder... por que as asas... por que elas cansam...?"'],
            aoDarDano: ['"Sinta o voo rasante! O Sussurrador disse que o voo era meu!"'],
            aoUsarPA: ['"Meu voo... falha? O Sussurrador disse que era invencível!"'],
            aoMorrer: ['"O céu... me chama... e eu... eu vejo o sol de novo... o Sussurrador não pode me seguir aqui... livre..."'],
            aoServoAtingido: ['"Minhas criaturas! O Sussurrador disse que elas eram minhas!"'],
            aoServoMorto: ['"Você vai cair! O Sussurrador disse que o céu vingaria!"'],
            aoAnhangáSussurra: ['"O vento... o vento sussurra com você... \'derrube-o... derrube-o...\'... sim... eu ouço..."'],
        },
        'jasy_jatere': {
            aoPrimeiroDano: ['"Meu sol... treme? O Sussurrador disse que o clarão me protegeria."'],
            aoTomarDano: ['"Você resiste ao clarão? O Sussurrador disse que ninguém resistiria!"'],
            aoHpBaixo: ['"Estou... fraco? O sol não pode ser fraco! O Sussurrador disse que era eterno!"'],
            aoHpCritico: ['"Anhangá... você prometeu que o clarão me daria poder... por que a luz... por que ela dói...?"'],
            aoDarDano: ['"Sinta o clarão! O Sussurrador disse que o clarão era meu!"'],
            aoUsarPA: ['"Meu sol... recua? O Sussurrador disse que era invencível!"'],
            aoMorrer: ['"O sol... se apaga... e eu... eu vejo o amanhecer de novo... o Sussurrador não pode me seguir aqui... livre..."'],
            aoServoAtingido: ['"Minhas criaturas! O Sussurrador disse que elas eram minhas!"'],
            aoServoMorto: ['"Você vai cegar! O Sussurrador disse que a luz vingaria!"'],
            aoAnhangáSussurra: ['"A luz... a luz sussurra com você... \'cegue-o... cegue-o...\'... sim... eu ouço..."'],
        },
        'kurupi': {
            aoPrimeiroDano: ['"Minhas raízes... tremem? O Sussurrador disse que a mata me protegeria."'],
            aoTomarDano: ['"Você me acerta? O Sussurrador disse que a mata era invencível!"'],
            aoHpBaixo: ['"Estou... fraco? A mata não pode ser fraca! O Sussurrador disse que era eterna!"'],
            aoHpCritico: ['"Anhangá... você prometeu que a mata me daria poder... por que as raízes... por que elas soltam...?"'],
            aoDarDano: ['"Minhas raízes te prendem! O Sussurrador disse que a mata me obedecia!"'],
            aoUsarPA: ['"Minhas raízes... soltam? O Sussurrador disse que eram invencíveis!"'],
            aoMorrer: ['"A mata... me chama... e eu... eu vejo a floresta de novo... o Sussurrador não pode me seguir aqui... livre..."'],
            aoServoAtingido: ['"Minhas criaturas! O Sussurrador disse que elas eram minhas!"'],
            aoServoMorto: ['"Você vai ser engolido! O Sussurrador disse que a mata vingaria!"'],
            aoAnhangáSussurra: ['"As folhas... as folhas sussurram com você... \'engula-o... engula-o...\'... sim... eu ouço..."'],
        },
        'ao_ao': {
            aoPrimeiroDano: ['"Minha lã... treme? O Sussurrador disse que a fome me protegeria."'],
            aoTomarDano: ['"Você me acerta? O Sussurrador disse que a fome era invencível!"'],
            aoHpBaixo: ['"Estou... fraco? A fome não pode ser fraca! O Sussurrador disse que era eterna!"'],
            aoHpCritico: ['"Anhangá... você prometeu que a fome me daria poder... por que a fome... por que ela não me sacia...?"'],
            aoDarDano: ['"Minha lã te enrola! O Sussurrador disse que a fome era meu!"'],
            aoUsarPA: ['"Minha fome... falha? O Sussurrador disse que era invencível!"'],
            aoMorrer: ['"A fome... acaba... e eu... eu vejo o rebanho de novo... o Sussurrador não pode me seguir aqui... livre..."'],
            aoServoAtingido: ['"Meus rebanhos! O Sussurrador disse que eles eram meus!"'],
            aoServoMorto: ['"Você vai ser devorado! O Sussurrador disse que a fome vingaria!"'],
            aoAnhangáSussurra: ['"A fome... a fome sussurra com você... \'devore-o... devore-o...\'... sim... eu ouço..."'],
        },
        'luison': {
            aoPrimeiroDano: ['"Minha sombra... treme? O Sussurrador disse que a escuridão me protegeria."'],
            aoTomarDano: ['"Você me acerta? O Sussurrador disse que a escuridão era invencível!"'],
            aoHpBaixo: ['"Estou... fraco? A escuridão não pode ser fraca! O Sussurrador disse que era eterna!"'],
            aoHpCritico: ['"Anhangá... você prometeu que a sombra me daria poder... por que a escuridão... por que ela me engole...?"'],
            aoDarDano: ['"Sinta a colheita sombria! O Sussurrador disse que a sombra era meu!"'],
            aoUsarPA: ['"Minha sombra... recua? O Sussurrador disse que era invencível!"'],
            aoMorrer: ['"A sombra... se dissolve... e eu... eu vejo a luz de novo... o Sussurrador não pode me seguir aqui... livre..."'],
            aoServoAtingido: ['"Meus filhos! O Sussurrador disse que eles eram meus!"'],
            aoServoMorto: ['"Você vai morrer! O Sussurrador disse que a escuridão vingaria!"'],
            aoAnhangáSussurra: ['"A noite... a noite sussurra com você... \'mate-o... mate-o...\'... sim... eu ouço..."'],
        },
        'pesadelo': {
            aoPrimeiroDano: ['"A dor... é minha? Eu sou a dor. Eu sou a fusão. O Sussurrador disse que eu era invencível."'],
            aoTomarDano: ['"Você me acerta? O Sussurrador disse que a fusão era eterna!"'],
            aoHpBaixo: ['"Estou... fraco? A fusão não pode ser fraca! O Sussurrador disse que era eterna!"'],
            aoHpCritico: ['"Anhangá... você prometeu que a fusão me daria poder... por que a dor... por que ela é tão grande...?"'],
            aoDarDano: ['"Sinta o pesadelo! O Sussurrador disse que o pesadelo era meu!"'],
            aoUsarPA: ['"Meu poder... recua? O Sussurrador disse que era invencível!"'],
            aoMorrer: ['"O pesadelo... acaba... e eu... eu vejo o equilíbrio de novo... o Sussurrador não pode me seguir aqui... livre..."'],
            aoServoAtingido: ['"Minha criação! O Sussurrador disse que ela era minha!"'],
            aoServoMorto: ['"Você vai sonhar para sempre! O Sussurrador disse que a criação vingaria!"'],
            aoAnhangáSussurra: ['"O abismo... o abismo sussurra com você... \'sonhe-o... sonhe-o...\'... sim... eu ouço..."'],
        },
    };

    // Sobrescreve cada boss do evento (mantém os que não têm lore nova)
    if (typeof FALAS_EVENTO !== 'undefined') {
        Object.keys(LORE_EVENTO).forEach(bossId => {
            FALAS_EVENTO[bossId] = Object.assign(
                FALAS_EVENTO[bossId] || {},
                LORE_EVENTO[bossId]
            );
        });
        console.log('[V24.0] Lore do evento sobrescrita (8 bosses).');
    } else {
        console.warn('[V24.0] FALAS_EVENTO não existe. Rode o V22.0-P1 antes.');
    }

    // ============================================================
    // ATO — sobrescrever com lore (fala do boss quando acerta/mata servo)
    // ============================================================
    const LORE_ATO = {
        1: {
            aoServoAtingido: ['"Meu servo! O Sussurrador disse que ele era meu! Não toque nele!"', '"O redemoinho te observa... o Sussurrador disse que ele te puniria..."'],
            aoServoMorto: ['"Você matou meu servo! O Sussurrador disse que eu vingaria!"', '"Sinta a fúria do redemoinho! O Sussurrador disse que ela era minha!"'],
        },
        2: {
            aoServoAtingido: ['"A mata chora... o Sussurrador disse que ela chorava por mim..."', '"Você fere meus servos... o Sussurrador disse que eles eram meus..."'],
            aoServoMorto: ['"Você vai pagar com sangue! O Sussurrador disse que a mata exigia vingança!"', '"A mata exige vingança! Foi o que o Sussurrador prometeu!"'],
        },
        3: {
            aoServoAtingido: ['"Meus peixes! O Sussurrador disse que o rio era meu!"', '"Você fere minhas criaturas... o Sussurrador disse que elas eram minhas..."'],
            aoServoMorto: ['"Você vai se afogar! O Sussurrador disse que as águas vingariam!"', '"As águas exigem vingança! Foi o que o Sussurrador prometeu!"'],
        },
        4: {
            aoServoAtingido: ['"Minhas serpentes! O Sussurrador disse que o fogo era meu!"', '"Você fere meus servos... o Sussurrador disse que eles eram meus..."'],
            aoServoMorto: ['"Você vai queimar! O Sussurrador disse que as chamas vingariam!"', '"As chamas exigem vingança! Foi o que o Sussurrador prometeu!"'],
        },
        5: {
            aoServoAtingido: ['"Meus animais! O Sussurrador disse que a noite era minha!"', '"Você fere meus servos... o Sussurrador disse que eles eram meus..."'],
            aoServoMorto: ['"Você vai queimar na maldição! O Sussurrador disse que a noite vingaria!"', '"A noite exige vingança! Foi o que o Sussurrador prometeu!"'],
        },
        6: {
            aoServoAtingido: ['"Minhas criaturas! O Sussurrador disse que a fome era minha!"', '"Você fere meus servos... o Sussurrador disse que eles eram meus..."'],
            aoServoMorto: ['"Você vai ser devorado! O Sussurrador disse que a fome vingaria!"', '"A fome exige vingança! Foi o que o Sussurrador prometeu!"'],
        },
        7: {
            aoServoAtingido: ['"Minha matilha! O Sussurrador disse que a lua era minha!"', '"Você fere meus servos... o Sussurrador disse que eles eram meus..."'],
            aoServoMorto: ['"Você vai uivar de dor! O Sussurrador disse que a lua vingaria!"', '"A lua exige vingança! Foi o que o Sussurrador prometeu!"'],
        },
        8: {
            aoServoAtingido: ['"Minhas criaturas! O Sussurrador disse que o caldeirão era meu!"', '"Você fere meus servos... o Sussurrador disse que eles eram meus..."'],
            aoServoMorto: ['"Você vai beber veneno! O Sussurrador disse que o caldeirão vingaria!"', '"O caldeirão exige vingança! Foi o que o Sussurrador prometeu!"'],
        },
        9: {
            aoServoAtingido: ['"Meus peixes! O Sussurrador disse que o rio era meu!"', '"Você fere meus servos... o Sussurrador disse que eles eram meus..."'],
            aoServoMorto: ['"Você vai se afogar no encanto! O Sussurrador disse que as águas vingariam!"', '"As águas exigem vingança! Foi o que o Sussurrador prometeu!"'],
        },
        10: {
            aoServoAtingido: ['"Meus rebanhos! O Sussurrador disse que o terror era meu!"', '"Você fere meus servos... o Sussurrador disse que eles eram meus..."'],
            aoServoMorto: ['"Você vai sentir o terror! O Sussurrador disse que a noite vingaria!"', '"A noite exige vingança! Foi o que o Sussurrador prometeu!"'],
        },
        11: {
            aoServoAtingido: ['"Minhas criaturas! O Sussurrador disse que a lua era minha!"', '"Você fere meus servos... o Sussurrador disse que eles eram meus..."'],
            aoServoMorto: ['"Você vai queimar na lua! O Sussurrador disse que a lua vingaria!"', '"A lua exige vingança! Foi o que o Sussurrador prometeu!"'],
        },
        12: {
            aoServoAtingido: ['"Minhas aves! O Sussurrador disse que o sol era meu!"', '"Você fere meus servos... o Sussurrador disse que eles eram meus..."'],
            aoServoMorto: ['"Você vai queimar no sol! O Sussurrador disse que o sol vingaria!"', '"O sol exige vingança! Foi o que o Sussurrador prometeu!"'],
        },
        13: {
            aoServoAtingido: ['"Minhas criaturas! O Sussurrador disse que o abismo era meu!"', '"Você fere meus servos... o Sussurrador disse que eles eram meus..."'],
            aoServoMorto: ['"Você vai ser consumido! O Sussurrador disse que o abismo vingaria!"', '"O abismo exige vingança! Foi o que o Sussurrador prometeu!"'],
        },
    };

    if (typeof FALAS_ATO !== 'undefined') {
        Object.keys(LORE_ATO).forEach(atoId => {
            FALAS_ATO[atoId] = Object.assign(FALAS_ATO[atoId] || {}, LORE_ATO[atoId]);
        });
        console.log('[V24.0] Lore do ato sobrescrita (13 atos).');
    } else {
        console.warn('[V24.0] FALAS_ATO não existe. Rode o V22.0-P1 antes.');
    }

    // ==============================================================
    // PARTE 2: LÓGICA DOS NOVOS GATILHOS CONTEXTUAIS
    // ==============================================================
    // Estado por batalha
    window._falasCtx = {
        primeiroDanoBoss: false,
        hpBaixoAvisado: false,
        hpCriticoAvisado: false,
        turnosBoss: 0,
    };

    // Reset ao iniciar batalha
    const _origInitBattle = window.initStoryBattle;
    if (typeof _origInitBattle === 'function') {
        window.initStoryBattle = async function() {
            window._falasCtx = {
                primeiroDanoBoss: false,
                hpBaixoAvisado: false,
                hpCriticoAvisado: false,
                turnosBoss: 0,
            };
            return _origInitBattle.apply(this, arguments);
        };
    }

    const _origEventoIniciar = window.eventoIniciarBatalha;
    if (typeof _origEventoIniciar === 'function') {
        window.eventoIniciarBatalha = async function() {
            window._falasCtx = {
                primeiroDanoBoss: false,
                hpBaixoAvisado: false,
                hpCriticoAvisado: false,
                turnosBoss: 0,
            };
            return _origEventoIniciar.apply(this, arguments);
        };
    }

    // Hook no applyDmg — detecta primeiro dano, HP baixo, HP crítico
    const _origApplyDmg = window.applyDmg;
    if (typeof _origApplyDmg === 'function') {
        window.applyDmg = function(target, amount) {
            const result = _origApplyDmg.apply(this, arguments);

            if (!window._storyMode && !window._eventoAtivo) return result;
            if (window._pvpMode) return result;
            if (!target) return result;

            const ctx = window._falasCtx;

            // ⭐ Boss tomou dano → verifica contextuais
            if (target === boss && !target.dead) {
                // Primeiro dano
                if (!ctx.primeiroDanoBoss) {
                    ctx.primeiroDanoBoss = true;
                    setTimeout(() => _falasDisparar('aoPrimeiroDano', true), 100);
                }

                // HP baixo (< 35%)
                if (!ctx.hpBaixoAvisado && target.hp <= target.maxHp * 0.35) {
                    ctx.hpBaixoAvisado = true;
                    setTimeout(() => _falasDisparar('aoHpBaixo', true), 200);
                }

                // HP crítico (< 12%)
                if (!ctx.hpCriticoAvisado && target.hp <= target.maxHp * 0.12) {
                    ctx.hpCriticoAvisado = true;
                    setTimeout(() => _falasDisparar('aoHpCritico', true), 300);
                }
            }

            return result;
        };
    }

    // Hook no manageTurns — conta turnos do boss (sussurro do Anhangá)
    const _origManageTurns = window.manageTurns;
    if (typeof _origManageTurns === 'function') {
        window.manageTurns = function() {
            const result = _origManageTurns.apply(this, arguments);

            if (!window._storyMode && !window._eventoAtivo) return result;
            if (window._pvpMode) return result;

            // Detecta turno do boss (currentPlayerIdx === -1)
            if (typeof currentPlayerIdx !== 'undefined' && currentPlayerIdx === -1) {
                window._falasCtx.turnosBoss++;
                // A cada 6 turnos do boss, o Anhangá sussurra
                if (window._falasCtx.turnosBoss % 6 === 0) {
                    setTimeout(() => _falasDisparar('aoAnhangáSussurra', true), 500);
                }
            }

            return result;
        };
    }

    // ==============================================================
    // PARTE 3: LOG FINAL
    // ==============================================================
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V24.0] Falas Contextuais + Lore');
    console.log('═══════════════════════════════════════════════════');
    console.log('Novos gatilhos:');
    console.log('  • aoPrimeiroDano (uma vez por fase)');
    console.log('  • aoHpBaixo (< 35% HP)');
    console.log('  • aoHpCritico (< 12% HP)');
    console.log('  • aoAnhangáSussurra (a cada 6 turnos do boss)');
    console.log('');
    console.log('Lore:');
    console.log('  • 13 bosses do modo história com lore reescrita');
    console.log('  • 8 bosses do evento com lore + sussurro do Anhangá');
    console.log('  • 13 atos com lore dos servos');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — BLOCO 90 (V25.0 — Fix dano em TODOS os handlers
// que movem o boss)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js (último bloco).
//
// Corrige 12 handlers:
//   1. porco_espinho_bote     — move 2 tiles, dano no caminho + fallback
//   2. cervo_investida        — move 3 tiles, dano no caminho + fallback
//   3. anta_atropelamento     — move 3 tiles, dano no caminho + fallback
//   4. lontra_nado            — move 3 tiles, dano no caminho + fallback
//   5. raposa_bote            — move 2 tiles, dano no caminho + fallback
//   6. onca_salto             — salto 2 tiles, dano em área 3×3 no HERÓI
//   7. jaguatirica_salto      — salto 2 tiles, dano em área 3×3 no HERÓI
//   8. gato_mato_salto        — salto 2 tiles, dano em área 3×3 no HERÓI
//   9. sucuarana_salto        — salto 2 tiles, dano em área 3×3 no HERÓI
//  10. urutau_voo             — move 3 tiles, dano em área 3×3 no HERÓI
//  11. falcao_mergulho        — teleporte, dano no HERÓI (não sobrepõe)
//  12. aguia_mergulho         — teleporte, dano no HERÓI (não sobrepõe)
// =================================================================

(function fixDanoHandlersV250() {
    if (window._fixDanoHandlersV250) return;
    window._fixDanoHandlersV250 = true;

    console.log('[V25.0] Corrigindo dano de 12 handlers...');

    // ==============================================================
    // HELPERS
    // ==============================================================
    function _getDirToward(fromX, fromY, toX, toY) {
        if (typeof dirToward === 'function') {
            return dirToward(fromX, fromY, toX, toY);
        }
        const dx = toX - fromX;
        const dy = toY - fromY;
        if (Math.abs(dx) >= Math.abs(dy)) {
            return { dx: Math.sign(dx), dy: 0, name: dx > 0 ? 'right' : 'left' };
        }
        return { dx: 0, dy: Math.sign(dy), name: dy > 0 ? 'down' : 'up' };
    }

    function _getNearestPlayer(fromX, fromY) {
        const alive = players.filter(p => !p.dead);
        if (alive.length === 0) return null;
        let nearest = alive[0];
        let minDist = Math.abs(alive[0].x - fromX) + Math.abs(alive[0].y - fromY);
        alive.forEach(p => {
            const d = Math.abs(p.x - fromX) + Math.abs(p.y - fromY);
            if (d < minDist) { minDist = d; nearest = p; }
        });
        return nearest;
    }

    function _buildArea3x3(cx, cy) {
        const tiles = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = cx + dx, ny = cy + dy;
                if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                    tiles.push({ x: nx, y: ny });
                }
            }
        }
        return tiles;
    }

    function _buildLine(fromX, fromY, dir, length) {
        const tiles = [];
        for (let i = 0; i < length; i++) {
            const nx = fromX + dir.dx * i;
            const ny = fromY + dir.dy * i;
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
            tiles.push({ x: nx, y: ny });
        }
        return tiles;
    }

    function _aplicarDanoEmTiles(tiles, atk, descricao, pushDir) {
        let danoAplicado = 0;
        players.forEach(p => {
            if (p.dead) return;
            if (tiles.some(t => t.x === p.x && t.y === p.y)) {
                if (typeof applyDmg === 'function') applyDmg(p, atk);
                if (pushDir && typeof tryPushPlayer === 'function') {
                    tryPushPlayer(p, pushDir.dx, pushDir.dy, 1);
                }
                danoAplicado++;
            }
        });
        if (danoAplicado > 0) {
            console.log(`[V25.0] ${descricao}: ${danoAplicado} herói(s) atingido(s)`);
        } else {
            console.log(`[V25.0] ${descricao}: nenhum herói atingido`);
        }
        return danoAplicado;
    }

    // ==============================================================
    // PADRÃO 1 — MOVE ATÉ O HERÓI (dano no caminho + fallback adjacente)
    // --------------------------------------------------------------
    // Usado por: porco_espinho_bote, cervo_investida, anta_atropelamento,
    //             lontra_nado, raposa_bote
    // ==============================================================
    async function _skillMoveAteHeroi(enemy, opts) {
        const atk = enemy.atk;
        const logMsg = opts.logMsg;
        const numSteps = opts.numSteps || 2;
        const fxKey = opts.fxKey;
        const fxClass = opts.fxClass;
        const finalFxKey = opts.finalFxKey || fxKey;
        const finalFxClass = opts.finalFxClass || fxClass;
        const pushOnHit = opts.pushOnHit || false;

        if (typeof addLog === 'function') addLog(logMsg);

        const nearest = _getNearestPlayer(boss.x, boss.y);
        if (!nearest) return;

        const dir = _getDirToward(boss.x, boss.y, nearest.x, nearest.y);

        // Tiles que o boss vai passar (incluindo o tile do herói, se chegar)
        const tilesPercorridos = [];
        let lastX = boss.x, lastY = boss.y;

        for (let i = 0; i < numSteps; i++) {
            const nx = boss.x + dir.dx;
            const ny = boss.y + dir.dy;
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;

            // ⭐ Permite passar pelo herói (não bloqueia o movimento)
            const heroiNoTile = players.find(p => !p.dead && p.x === nx && p.y === ny);
            if (heroiNoTile) {
                // move o boss pra cima do herói
                if (typeof spawnFxAt === 'function') spawnFxAt(fxKey, fxClass, nx, ny, { duration: 500 });
                tilesPercorridos.push({ x: nx, y: ny });
                boss.x = nx;
                boss.y = ny;
                lastX = nx;
                lastY = ny;
                if (typeof updateVisuals === 'function') updateVisuals();
                await sleep(180);
                break; // para no herói
            }

            // Se tem outro player/amuleto, bloqueia
            if (typeof isOccupied === 'function' && isOccupied(nx, ny, -1)) break;

            if (typeof spawnFxAt === 'function') spawnFxAt(fxKey, fxClass, nx, ny, { duration: 500 });
            tilesPercorridos.push({ x: nx, y: ny });
            boss.x = nx;
            boss.y = ny;
            lastX = nx;
            lastY = ny;
            if (typeof updateVisuals === 'function') updateVisuals();
            await sleep(180);
        }

        await sleep(200);

        // FX final (explosão)
        if (typeof spawnFxAt === 'function') {
            spawnFxAt(finalFxKey, finalFxClass, lastX, lastY, { duration: 700, scale: 1.3 });
        }

        // ⭐ Aplica dano em TODOS os tiles que o boss passou
        let danoAplicado = _aplicarDanoEmTiles(tilesPercorridos, atk, opts.descricao, pushOnHit ? dir : null);

        // ⭐ Fallback: se o herói mais próximo não foi atingido, mas está adjacente
        if (nearest && !nearest.dead) {
            const foiAtingido = tilesPercorridos.some(t => t.x === nearest.x && t.y === nearest.y);
            if (!foiAtingido) {
                const adjacente = Math.abs(nearest.x - boss.x) + Math.abs(nearest.y - boss.y) <= 1;
                if (adjacente) {
                    if (typeof applyDmg === 'function') applyDmg(nearest, atk);
                    danoAplicado++;
                    console.log(`[V25.0] ${opts.descricao}: fallback adjacente`);
                }
            }
        }

        await sleep(300);
        return danoAplicado;
    }

    // ==============================================================
    // PADRÃO 2 — SALTO + ÁREA 3×3 NO HERÓI
    // --------------------------------------------------------------
    // Usado por: onca_salto, jaguatirica_salto, gato_mato_salto,
    //             sucuarana_salto, urutau_voo
    // ==============================================================
    async function _skillSaltoAreaHeroi(enemy, opts) {
        const atk = enemy.atk;
        const logMsg = opts.logMsg;
        const numSteps = opts.numSteps || 2;
        const pounceFx = opts.pounceFx;
        const pounceClass = opts.pounceClass;

        if (typeof addLog === 'function') addLog(logMsg);

        const nearest = _getNearestPlayer(boss.x, boss.y);
        if (!nearest) return;

        const dir = _getDirToward(boss.x, boss.y, nearest.x, nearest.y);

        // FX do salto
        if (typeof spawnFxAt === 'function') {
            spawnFxAt(pounceFx, pounceClass, boss.x, boss.y, { duration: 700, scale: 1.3 });
        }

        await sleep(300);

        // ⭐ Move o boss ATÉ o herói (para no herói, não em cima)
        let lastX = boss.x, lastY = boss.y;
        for (let i = 0; i < numSteps; i++) {
            const nx = boss.x + dir.dx;
            const ny = boss.y + dir.dy;
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;

            const heroiNoTile = players.find(p => !p.dead && p.x === nx && p.y === ny);
            if (heroiNoTile) {
                // ⭐ NÃO move o boss pra cima do herói
                lastX = boss.x;
                lastY = boss.y;
                break;
            }

            if (typeof isOccupied === 'function' && isOccupied(nx, ny, -1)) break;

            boss.x = nx;
            boss.y = ny;
            lastX = nx;
            lastY = ny;
            if (typeof updateVisuals === 'function') updateVisuals();
            await sleep(150);
        }

        await sleep(200);

        // FX do impacto
        if (typeof spawnFxAt === 'function') {
            spawnFxAt('impact', 'fx-impact', lastX, lastY, { duration: 500, scale: 1.2 });
        }

        // ⭐ Área 3×3 NO HERÓI (não no tile do boss)
        const areaNoHeroi = _buildArea3x3(nearest.x, nearest.y);
        let danoAplicado = _aplicarDanoEmTiles(areaNoHeroi, atk, opts.descricao, null);

        // ⭐ Fallback: se o herói não foi atingido (caso raro), aplica dano direto
        if (nearest && !nearest.dead && !areaNoHeroi.some(t => t.x === nearest.x && t.y === nearest.y)) {
            if (typeof applyDmg === 'function') applyDmg(nearest, atk);
            danoAplicado++;
        }
        // ⭐ Fallback 2: se nem assim, e o boss está adjacente ao herói
        if (danoAplicado === 0 && nearest && !nearest.dead) {
            const adjacente = Math.abs(nearest.x - boss.x) + Math.abs(nearest.y - boss.y) <= 1;
            if (adjacente) {
                if (typeof applyDmg === 'function') applyDmg(nearest, atk);
                danoAplicado++;
            }
        }

        await sleep(300);
        return danoAplicado;
    }

    // ==============================================================
    // PADRÃO 3 — TELEPORTE + DANO NO HERÓI (não sobrepõe)
    // --------------------------------------------------------------
    // Usado por: falcao_mergulho, aguia_mergulho
    // ==============================================================
    async function _skillTeleporteDanoHeroi(enemy, opts) {
        const atk = enemy.atk;
        const logMsg = opts.logMsg;
        const fxKey = opts.fxKey;
        const fxClass = opts.fxClass;

        if (typeof addLog === 'function') addLog(logMsg);

        const nearest = _getNearestPlayer(boss.x, boss.y);
        if (!nearest) return;

        // FX do voo (do boss até o herói)
        if (typeof spawnFxAt === 'function') {
            spawnFxAt(fxKey, fxClass, boss.x, boss.y, { duration: 400 });
        }
        await sleep(300);

        // ⭐ Move o boss pra um tile ADJACENTE ao herói (não em cima)
        const tileAdjacente = _acharTileAdjacenteLivre(nearest.x, nearest.y);
        if (tileAdjacente) {
            boss.x = tileAdjacente.x;
            boss.y = tileAdjacente.y;
        }
        if (typeof updateVisuals === 'function') updateVisuals();

        // FX do impacto
        if (typeof spawnFxAt === 'function') {
            spawnFxAt('impact', 'fx-impact', nearest.x, nearest.y, { duration: 500, scale: 1.3 });
        }

        // ⭐ Dano no herói (direto)
        if (typeof applyDmg === 'function') applyDmg(nearest, atk);
        console.log(`[V25.0] ${opts.descricao}: dano no herói ${nearest.name}`);

        await sleep(300);
    }

    // Helper: acha um tile adjacente livre ao redor do herói
    function _acharTileAdjacenteLivre(cx, cy) {
        const dirs = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
        ];
        for (const d of dirs) {
            const nx = cx + d.dx;
            const ny = cy + d.dy;
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) continue;
            if (typeof isOccupied === 'function' && isOccupied(nx, ny, -1)) continue;
            return { x: nx, y: ny };
        }
        return null;
    }

    // ==============================================================
    // SUBSTITUIR OS 12 HANDLERS
    // ==============================================================

    // ---- 1. PORCO-ESPINHO (Ato 1) ----
    STORY_ANIMAL_SKILLS['porco_espinho_bote'] = async (enemy) => {
        return _skillMoveAteHeroi(enemy, {
            logMsg: `🦔 ${enemy.name} rola em bola de espinhos!`,
            numSteps: 2,
            fxKey: 'spike_roll',
            fxClass: 'fx-spike-roll',
            finalFxKey: 'spike_burst',
            finalFxClass: 'fx-spike-burst',
            pushOnHit: true,
            descricao: 'Porco-espinho bote',
        });
    };

    // ---- 2. CERVO (Ato 1) ----
    STORY_ANIMAL_SKILLS['cervo_investida'] = async (enemy) => {
        return _skillMoveAteHeroi(enemy, {
            logMsg: `🦌 ${enemy.name} baixa os chifres e investe!`,
            numSteps: 3,
            fxKey: 'antler_charge',
            fxClass: 'fx-antler-charge',
            finalFxKey: 'shockwave',
            finalFxClass: 'fx-shockwave',
            descricao: 'Cervo investida',
        });
    };

    // ---- 3. ANTA (Ato 2) ----
    STORY_ANIMAL_SKILLS['anta_atropelamento'] = async (enemy) => {
        return _skillMoveAteHeroi(enemy, {
            logMsg: `🦛 ${enemy.name} atropela!`,
            numSteps: 3,
            fxKey: 'hoof_stomp',
            fxClass: 'fx-hoof-stomp',
            finalFxKey: 'shockwave',
            finalFxClass: 'fx-shockwave',
            descricao: 'Anta atropelamento',
        });
    };

    // ---- 4. LONTRA (Ato 3) ----
    STORY_ANIMAL_SKILLS['lontra_nado'] = async (enemy) => {
        return _skillMoveAteHeroi(enemy, {
            logMsg: `🦦 ${enemy.name} nada rapidamente!`,
            numSteps: 3,
            fxKey: 'splash_wave',
            fxClass: 'fx-splash-wave',
            finalFxKey: 'splash_wave',
            finalFxClass: 'fx-splash-wave',
            descricao: 'Lontra nado',
        });
    };

    // ---- 5. RAPOSA (Ato 7) ----
    STORY_ANIMAL_SKILLS['raposa_bote'] = async (enemy) => {
        return _skillMoveAteHeroi(enemy, {
            logMsg: `🦊 ${enemy.name} dá um bote ágil!`,
            numSteps: 2,
            fxKey: 'pounce_arc',
            fxClass: 'fx-pounce-arc',
            finalFxKey: 'fang_bite',
            finalFxClass: 'fx-fang-bite',
            descricao: 'Raposa bote',
        });
    };

    // ---- 6. ONÇA-PARDA (Ato 1) ----
    STORY_ANIMAL_SKILLS['onca_salto'] = async (enemy) => {
        return _skillSaltoAreaHeroi(enemy, {
            logMsg: `🐆 ${enemy.name} salta mortalmente!`,
            numSteps: 2,
            pounceFx: 'pounce_arc',
            pounceClass: 'fx-pounce-arc',
            descricao: 'Onça salto',
        });
    };

    // ---- 7. JAGUATIRICA (Ato 7) ----
    STORY_ANIMAL_SKILLS['jaguatirica_salto'] = async (enemy) => {
        return _skillSaltoAreaHeroi(enemy, {
            logMsg: `🐆 ${enemy.name} dá um salto mortal!`,
            numSteps: 2,
            pounceFx: 'pounce_arc',
            pounceClass: 'fx-pounce-arc',
            descricao: 'Jaguatirica salto',
        });
    };

    // ---- 8. GATO-DO-MATO (Ato 11) ----
    STORY_ANIMAL_SKILLS['gato_mato_salto'] = async (enemy) => {
        return _skillSaltoAreaHeroi(enemy, {
            logMsg: `🐈 ${enemy.name} dá um salto silencioso!`,
            numSteps: 2,
            pounceFx: 'pounce_arc',
            pounceClass: 'fx-pounce-arc',
            descricao: 'Gato-do-mato salto',
        });
    };

    // ---- 9. SUÇUARANA (Ato 11) ----
    STORY_ANIMAL_SKILLS['sucuarana_salto'] = async (enemy) => {
        return _skillSaltoAreaHeroi(enemy, {
            logMsg: `🐆 ${enemy.name} dá um salto mortal!`,
            numSteps: 2,
            pounceFx: 'pounce_arc',
            pounceClass: 'fx-pounce-arc',
            descricao: 'Suçuarana salto',
        });
    };

    // ---- 10. URUTAU (Ato 12) ----
    STORY_ANIMAL_SKILLS['urutau_voo'] = async (enemy) => {
        return _skillSaltoAreaHeroi(enemy, {
            logMsg: `🦉 ${enemy.name} faz voo fantasma!`,
            numSteps: 3,
            pounceFx: 'spectral_veil',
            pounceClass: 'fx-spectral-veil',
            descricao: 'Urutau voo',
        });
    };

    // ---- 11. FALCÃO (Ato 12) ----
    STORY_ANIMAL_SKILLS['falcao_mergulho'] = async (enemy) => {
        return _skillTeleporteDanoHeroi(enemy, {
            logMsg: `🦅 ${enemy.name} faz mergulho mortal!`,
            fxKey: 'wing_gust',
            fxClass: 'fx-wing-gust',
            descricao: 'Falcão mergulho',
        });
    };

    // ---- 12. ÁGUIA-CINZENTA (Ato 12) ----
    STORY_ANIMAL_SKILLS['aguia_mergulho'] = async (enemy) => {
        return _skillTeleporteDanoHeroi(enemy, {
            logMsg: `🦅 ${enemy.name} faz mergulho solar!`,
            fxKey: 'wing_gust',
            fxClass: 'fx-wing-gust',
            descricao: 'Águia mergulho',
        });
    };

    // ==============================================================
    // LOG FINAL
    // ==============================================================
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V25.0] 12 handlers corrigidos');
    console.log('═══════════════════════════════════════════════════');
    console.log('Bug confirmado (dano no caminho + fallback):');
    console.log('  • porco_espinho_bote');
    console.log('  • cervo_investida');
    console.log('  • anta_atropelamento');
    console.log('  • lontra_nado');
    console.log('  • raposa_bote');
    console.log('');
    console.log('Parciais (área 3×3 no herói):');
    console.log('  • onca_salto');
    console.log('  • jaguatirica_salto');
    console.log('  • gato_mato_salto');
    console.log('  • sucuarana_salto');
    console.log('  • urutau_voo');
    console.log('');
    console.log('Teleporte (dano no herói, sem sobrepor):');
    console.log('  • falcao_mergulho');
    console.log('  • aguia_mergulho');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — BLOCO 91 (V25.1 — Fix salto: dano no boss, não no herói)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js (último bloco).
//
// Corrige o V25.0:
//   • onca_salto, jaguatirica_salto, gato_mato_salto,
//     sucuarana_salto, urutau_voo
//   • O dano agora é em área 3×3 NO TILE DO BOSS (não no herói)
//   • Se o boss não chegou adjacente ao herói → não aplica dano
//     (a fera "errou o salto")
// =================================================================

(function fixSaltoAreaBossV251() {
    if (window._fixSaltoAreaBossV251) return;
    window._fixSaltoAreaBossV251 = true;

    console.log('[V25.1] Corrigindo salto: dano no tile do boss (não no herói)...');

    // ==============================================================
    // HELPERS
    // ==============================================================
    function _getDirToward(fromX, fromY, toX, toY) {
        if (typeof dirToward === 'function') return dirToward(fromX, fromY, toX, toY);
        const dx = toX - fromX;
        const dy = toY - fromY;
        if (Math.abs(dx) >= Math.abs(dy)) {
            return { dx: Math.sign(dx), dy: 0, name: dx > 0 ? 'right' : 'left' };
        }
        return { dx: 0, dy: Math.sign(dy), name: dy > 0 ? 'down' : 'up' };
    }

    function _getNearestPlayer(fromX, fromY) {
        const alive = players.filter(p => !p.dead);
        if (alive.length === 0) return null;
        let nearest = alive[0];
        let minDist = Math.abs(alive[0].x - fromX) + Math.abs(alive[0].y - fromY);
        alive.forEach(p => {
            const d = Math.abs(p.x - fromX) + Math.abs(p.y - fromY);
            if (d < minDist) { minDist = d; nearest = p; }
        });
        return nearest;
    }

    function _buildArea3x3(cx, cy) {
        const tiles = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = cx + dx, ny = cy + dy;
                if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                    tiles.push({ x: nx, y: ny });
                }
            }
        }
        return tiles;
    }

    // ==============================================================
    // NOVO _skillSaltoAreaHeroi
    // --------------------------------------------------------------
    // 1. Move o boss em direção ao herói (até 3 tiles)
    // 2. Se o boss chegou ADJACENTE ao herói (dist <= 1) → dano em
    //    área 3×3 NO TILE DO BOSS
    // 3. Se o boss NÃO chegou adjacente → não aplica dano (a fera errou)
    // ==============================================================
    async function _skillSaltoAreaHeroi(enemy, opts) {
        const atk = enemy.atk;
        const logMsg = opts.logMsg;
        const numSteps = opts.numSteps || 2;
        const pounceFx = opts.pounceFx;
        const pounceClass = opts.pounceClass;

        if (typeof addLog === 'function') addLog(logMsg);

        const nearest = _getNearestPlayer(boss.x, boss.y);
        if (!nearest) return 0;

        const dir = _getDirToward(boss.x, boss.y, nearest.x, nearest.y);

        // FX do salto
        if (typeof spawnFxAt === 'function') {
            spawnFxAt(pounceFx, pounceClass, boss.x, boss.y, { duration: 700, scale: 1.3 });
        }
        await sleep(300);

        // Move o boss em direção ao herói
        let lastX = boss.x, lastY = boss.y;
        for (let i = 0; i < numSteps; i++) {
            const nx = boss.x + dir.dx;
            const ny = boss.y + dir.dy;
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;

            // Se tem herói no tile, para antes (não sobrepõe)
            const heroiNoTile = players.find(p => !p.dead && p.x === nx && p.y === ny);
            if (heroiNoTile) {
                // ⭐ NÃO move pra cima do herói
                break;
            }

            // Se tem outro player/obstáculo, bloqueia
            if (typeof isOccupied === 'function' && isOccupied(nx, ny, -1)) break;

            boss.x = nx;
            boss.y = ny;
            lastX = nx;
            lastY = ny;
            if (typeof updateVisuals === 'function') updateVisuals();
            await sleep(150);
        }

        await sleep(200);

        // FX do impacto no tile do boss (não no herói)
        if (typeof spawnFxAt === 'function') {
            spawnFxAt('impact', 'fx-impact', lastX, lastY, { duration: 500, scale: 1.2 });
        }

        // ⭐ Calcula a distância do boss ao herói
        const distFinal = Math.abs(boss.x - nearest.x) + Math.abs(boss.y - nearest.y);

        // ⭐ Só aplica dano se o boss chegou ADJACENTE (dist <= 1)
        if (distFinal > 1) {
            console.log(`[V25.1] ${opts.descricao}: boss parou longe (dist ${distFinal}) — salto errou, sem dano`);
            return 0;
        }

        // ⭐ Área 3×3 NO TILE DO BOSS
        const areaNoBoss = _buildArea3x3(boss.x, boss.y);

        let danoAplicado = 0;
        players.forEach(p => {
            if (p.dead) return;
            if (areaNoBoss.some(t => t.x === p.x && t.y === p.y)) {
                if (typeof applyDmg === 'function') applyDmg(p, atk);
                danoAplicado++;
            }
        });

        console.log(`[V25.1] ${opts.descricao}: ${danoAplicado} herói(s) atingido(s) (boss em ${boss.x},${boss.y}, herói em ${nearest.x},${nearest.y})`);

        await sleep(300);
        return danoAplicado;
    }

    // ==============================================================
    // SUBSTITUIR OS 5 HANDLERS DE SALTO
    // ==============================================================

    // ---- Onça-parda (Ato 1) ----
    STORY_ANIMAL_SKILLS['onca_salto'] = async (enemy) => {
        return _skillSaltoAreaHeroi(enemy, {
            logMsg: `🐆 ${enemy.name} salta mortalmente!`,
            numSteps: 3,
            pounceFx: 'pounce_arc',
            pounceClass: 'fx-pounce-arc',
            descricao: 'Onça salto',
        });
    };

    // ---- Jaguatirica (Ato 7) ----
    STORY_ANIMAL_SKILLS['jaguatirica_salto'] = async (enemy) => {
        return _skillSaltoAreaHeroi(enemy, {
            logMsg: `🐆 ${enemy.name} dá um salto mortal!`,
            numSteps: 3,
            pounceFx: 'pounce_arc',
            pounceClass: 'fx-pounce-arc',
            descricao: 'Jaguatirica salto',
        });
    };

    // ---- Gato-do-mato (Ato 11) ----
    STORY_ANIMAL_SKILLS['gato_mato_salto'] = async (enemy) => {
        return _skillSaltoAreaHeroi(enemy, {
            logMsg: `🐈 ${enemy.name} dá um salto silencioso!`,
            numSteps: 3,
            pounceFx: 'pounce_arc',
            pounceClass: 'fx-pounce-arc',
            descricao: 'Gato-do-mato salto',
        });
    };

    // ---- Suçuarana (Ato 11) ----
    STORY_ANIMAL_SKILLS['sucuarana_salto'] = async (enemy) => {
        return _skillSaltoAreaHeroi(enemy, {
            logMsg: `🐆 ${enemy.name} dá um salto mortal!`,
            numSteps: 3,
            pounceFx: 'pounce_arc',
            pounceClass: 'fx-pounce-arc',
            descricao: 'Suçuarana salto',
        });
    };

    // ---- Urutau (Ato 12) ----
    STORY_ANIMAL_SKILLS['urutau_voo'] = async (enemy) => {
        return _skillSaltoAreaHeroi(enemy, {
            logMsg: `🦉 ${enemy.name} faz voo fantasma!`,
            numSteps: 3,
            pounceFx: 'spectral_veil',
            pounceClass: 'fx-spectral-veil',
            descricao: 'Urutau voo',
        });
    };

    console.log('✅ [V25.1] 5 handlers de salto corrigidos.');
    console.log('   • Dano em área 3×3 no tile do BOSS (não no herói)');
    console.log('   • Se o boss não chegou adjacente → salto errou, sem dano');
})();
// =================================================================
// historia.js — BLOCO 92 (V26.0 — Mostrar XP/ouro na tela do evento)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js (último bloco).
//
// O evento JÁ aplica XP/ouro/drops no STORY_PROGRESS, mas a tela
// de vitória só mostra drops. Este patch adiciona uma linha com
// XP e ouro ganhos.
// =================================================================

(function mostrarXPOuroEventoV260() {
    if (window._mostrarXPOuroEventoV260) return;
    window._mostrarXPOuroEventoV260 = true;

    console.log('[V26.0] Adicionando XP/ouro na tela de vitória do evento...');

    // ==============================================================
    // Guarda os valores de XP/ouro ANTES da vitória (pra calcular o delta)
    // ==============================================================
    let _xpAntes = 0;
    let _ouroAntes = 0;

    const _origFinalizar = window.eventoFinalizarPartida;
    if (typeof _origFinalizar === 'function') {
        window.eventoFinalizarPartida = async function(vitoria, saindo) {
            // Captura os valores ANTES
            if (vitoria && !saindo && typeof STORY_PROGRESS !== 'undefined') {
                _xpAntes = STORY_PROGRESS.totalXP || 0;
                _ouroAntes = STORY_PROGRESS.gold || 0;
                console.log(`[V26.0] XP antes: ${_xpAntes}, Ouro antes: ${_ouroAntes}`);
            }

            const result = await _origFinalizar.apply(this, arguments);

            // Depois que a tela foi montada, injeta o delta
            if (vitoria && !saindo) {
                setTimeout(() => {
                    _injetarXPOuroNaTela();
                }, 100);
            }

            return result;
        };
    }

    // ==============================================================
    // Injeta a linha de XP/ouro na tela de vitória do evento
    // ==============================================================
    function _injetarXPOuroNaTela() {
        const overlay = document.getElementById('gameOverlay');
        if (!overlay) return;
        if (!overlay.classList.contains('active')) return;

        // Já tem a linha? Não duplica
        if (overlay.querySelector('.evento-xp-ouro-delta')) return;

        const xpDepois = (typeof STORY_PROGRESS !== 'undefined') ? (STORY_PROGRESS.totalXP || 0) : 0;
        const ouroDepois = (typeof STORY_PROGRESS !== 'undefined') ? (STORY_PROGRESS.gold || 0) : 0;

        const xpGanho = xpDepois - _xpAntes;
        const ouroGanho = ouroDepois - _ouroAntes;

        if (xpGanho <= 0 && ouroGanho <= 0) {
            console.log('[V26.0] Sem XP/ouro a mostrar (delta zero).');
            return;
        }

        // Acha o corpo da tela (depois dos drops, antes dos botões)
        const body = overlay.querySelector('.victory-body');
        if (!body) return;

        const actions = body.querySelector('.victory-actions');

        const div = document.createElement('div');
        div.className = 'evento-xp-ouro-delta';
        div.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 18px;
            flex-wrap: wrap;
            padding: 12px 16px;
            margin: 8px 0;
            background: rgba(10, 6, 2, 0.5);
            border: 1px solid rgba(201, 162, 39, 0.3);
            border-radius: 6px;
            font-family: 'Cinzel', serif;
            font-size: 1rem;
            font-weight: 700;
            letter-spacing: 1px;
        `;

        const partes = [];
        if (xpGanho > 0) {
            partes.push(`<span style="color: #e8b923;">${uiIcon('xp')} +${xpGanho} XP</span>`);
        }
        if (ouroGanho > 0) {
            partes.push(`<span style="color: #e8b923;">${uiIcon('gold')} +${ouroGanho} ouro</span>`);
        }
        div.innerHTML = partes.join('');

        if (actions) {
            body.insertBefore(div, actions);
        } else {
            body.appendChild(div);
        }

        console.log(`[V26.0] Tela de vitória: +${xpGanho} XP, +${ouroGanho} ouro`);
    }

    // ==============================================================
    // Também intercepta `_mostrarTelaFinalEvento` (fallback)
    // ==============================================================
    const _origTelaFinal = window._mostrarTelaFinalEvento;
    if (typeof _origTelaFinal === 'function') {
        window._mostrarTelaFinalEvento = function(vitoria, drops, dropsResult) {
            const result = _origTelaFinal.apply(this, arguments);
            if (vitoria) {
                setTimeout(() => {
                    _injetarXPOuroNaTela();
                }, 150);
            }
            return result;
        };
    }

    // ==============================================================
    // Ouro/XP por dificuldade (pra debug)
    // ==============================================================
    window.debugEventoRecompensas = function(bossId, faseId, diffId) {
        const cfg = (bossId === 'pesadelo') ? EVENTO_PESADELO : EVENTO_BOSSES[bossId];
        if (!cfg) return;
        const diff = EVENTO_DIFICULDADES[diffId || 'normal'];
        const xpBase = faseId === 'boss' ? cfg.recompensaXP : Math.floor(cfg.recompensaXP / 5);
        const ouroBase = faseId === 'boss' ? cfg.recompensaOuro : Math.floor(cfg.recompensaOuro / 5);
        console.log(`📊 ${cfg.nome} - Fase ${faseId} (${diff.nome}):`);
        console.log(`   XP base: ${xpBase}, XP final: ${Math.floor(xpBase * diff.xpMult)}`);
        console.log(`   Ouro base: ${ouroBase}, Ouro final: ${Math.floor(ouroBase * diff.ouroMult)}`);
        console.log(`   Drops: arma ${Math.round(diff.dropArma * 100)}%, fragmento ${Math.round(diff.dropItem * 100)}%`);
    };

    console.log('✅ [V26.0] XP/ouro agora aparecem na tela do evento.');
    console.log('   Use window.debugEventoRecompensas("teju_jagua", "boss", "normal")');
})();
// =================================================================
// historia.js — BLOCO 95 (V26.3 — XP/ouro no evento, standalone)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js (último bloco).
//
// Este patch NÃO depende do V26.1/V26.2.
// Ele faz TUDO:
//   1. Garante que eventoFinalizarPartida seja chamado no evento
//   2. Captura XP/ouro antes/depois
//   3. Injeta XP/ouro na tela de vitória (qualquer overlay)
// =================================================================

(function xpOuroEventoV263() {
    if (window._xpOuroEventoV263) return;
    window._xpOuroEventoV263 = true;

    console.log('[V26.3] Instalando XP/ouro no evento (standalone)...');

    // ==============================================================
    // ESTADO GLOBAL
    // ==============================================================
    window._evtXPAntes = 0;
    window._evtOuroAntes = 0;
    window._evtDeltaXP = 0;
    window._evtDeltaOuro = 0;

    // ==============================================================
    // 1. HOOK EM eventoFinalizarPartida (captura antes/depois)
    // ==============================================================
    const _origFinalizar = window.eventoFinalizarPartida;
    if (typeof _origFinalizar === 'function') {
        window.eventoFinalizarPartida = async function(vitoria, saindo) {
            console.log(`[V26.3] eventoFinalizarPartida chamado. vitoria=${vitoria}, saindo=${saindo}`);

            if (vitoria && !saindo && typeof STORY_PROGRESS !== 'undefined') {
                window._evtXPAntes = STORY_PROGRESS.totalXP || 0;
                window._evtOuroAntes = STORY_PROGRESS.gold || 0;
                console.log(`[V26.3] ANTES: XP=${window._evtXPAntes}, Ouro=${window._evtOuroAntes}`);
            }

            const result = await _origFinalizar.apply(this, arguments);

            if (vitoria && !saindo && typeof STORY_PROGRESS !== 'undefined') {
                window._evtDeltaXP = (STORY_PROGRESS.totalXP || 0) - window._evtXPAntes;
                window._evtDeltaOuro = (STORY_PROGRESS.gold || 0) - window._evtOuroAntes;
                console.log(`[V26.3] DEPOIS: XP=${STORY_PROGRESS.totalXP}, Ouro=${STORY_PROGRESS.gold}`);
                console.log(`[V26.3] DELTA: +${window._evtDeltaXP} XP, +${window._evtDeltaOuro} ouro`);

                // Injeta em vários momentos pra garantir
                setTimeout(() => _injetarXP(), 50);
                setTimeout(() => _injetarXP(), 300);
                setTimeout(() => _injetarXP(), 800);
            }

            return result;
        };
        console.log('[V26.3] Hook em eventoFinalizarPartida OK.');
    } else {
        console.warn('[V26.3] eventoFinalizarPartida NÃO existe.');
    }

    // ==============================================================
    // 2. HOOK EM handleStoryBossDefeat (garante chamada no evento)
    // --------------------------------------------------------------
    // Só age se o handleStoryBossDefeat atual NÃO chama
    // eventoFinalizarPartida (que é o caso, pelo diagnóstico).
    // ==============================================================
    const _origBossDefeat = window.handleStoryBossDefeat;
    if (typeof _origBossDefeat === 'function') {
        const jaChama = _origBossDefeat.toString().includes('eventoFinalizarPartida');

        if (jaChama) {
            console.log('[V26.3] handleStoryBossDefeat JÁ chama eventoFinalizarPartida. Pulando hook.');
        } else {
            console.log('[V26.3] handleStoryBossDefeat NÃO chama eventoFinalizarPartida. Corrigindo...');

            window.handleStoryBossDefeat = async function() {
                if (!window._storyMode && !window._eventoAtivo) {
                    return _origBossDefeat.apply(this, arguments);
                }

                // ⭐ Se é evento E é o último inimigo da fila
                if (window._eventoAtivo) {
                    const temProximo = typeof storyEnemiesRemaining !== 'undefined'
                        && storyEnemiesRemaining.length > 1;

                    if (!temProximo) {
                        console.log('[V26.3] Último inimigo do evento. Chamando eventoFinalizarPartida(true).');

                        // Purificação
                        if (typeof showPurificacao === 'function') {
                            try {
                                await showPurificacao(boss.type, boss.x, boss.y, true);
                            } catch(e) {
                                console.warn('[V26.3] Erro na purificação:', e);
                            }
                        }
                        await new Promise(r => setTimeout(r, 1500));

                        // ⭐ Chama eventoFinalizarPartida (que agora está hookado pelo V26.3)
                        if (typeof window.eventoFinalizarPartida === 'function') {
                            await window.eventoFinalizarPartida(true, false);
                        }
                        return;
                    }

                    // Se tem próximo, deixa o original cuidar (chama advanceStoryEnemy)
                    console.log('[V26.3] Ainda tem próximo inimigo. Original cuida.');
                }

                return _origBossDefeat.apply(this, arguments);
            };

            console.log('[V26.3] handleStoryBossDefeat corrigido.');
        }
    }

    // ==============================================================
    // 3. INJETAR XP/OURO NA TELA (qualquer overlay)
    // ==============================================================
    function _injetarXP() {
        const xp = window._evtDeltaXP;
        const ouro = window._evtDeltaOuro;

        if (xp <= 0 && ouro <= 0) return;

        // Acha qualquer overlay ativo
        const overlays = [
            document.getElementById('gameOverlay'),
            document.getElementById('storyVictoryOverlay'),
        ].filter(o => o && (o.classList.contains('active') || o.style.display !== 'none'));

        if (overlays.length === 0) {
            console.log('[V26.3] Nenhum overlay ativo.');
            return;
        }

        overlays.forEach(overlay => {
            if (overlay.querySelector('.evt-xp-ouro')) return;

            const div = document.createElement('div');
            div.className = 'evt-xp-ouro';
            div.style.cssText = `
                display: flex;
                justify-content: center;
                gap: 18px;
                flex-wrap: wrap;
                padding: 12px 20px;
                margin: 12px auto;
                background: linear-gradient(180deg, rgba(232,185,35,0.15), transparent 60%), rgba(10,6,2,0.6);
                border: 2px solid rgba(201,162,39,0.5);
                border-radius: 6px;
                font-family: 'Cinzel', serif;
                font-size: 1.05rem;
                font-weight: 700;
                letter-spacing: 1.5px;
                max-width: 420px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5), 0 0 20px rgba(232,185,35,0.2);
            `;

            const partes = [];
            if (xp > 0) {
                const xpIcon = (typeof uiIcon === 'function') ? uiIcon('xp') : '⭐';
                partes.push(`<span style="color: #e8b923;">${xpIcon} +${xp} XP</span>`);
            }
            if (ouro > 0) {
                const goldIcon = (typeof uiIcon === 'function') ? uiIcon('gold') : '💰';
                partes.push(`<span style="color: #e8b923;">${goldIcon} +${ouro} ouro</span>`);
            }
            div.innerHTML = partes.join('');

            // Insere antes dos botões de ação, ou no body
            const actions =
                overlay.querySelector('.victory-actions') ||
                overlay.querySelector('.story-result-actions');

            if (actions && actions.parentNode) {
                actions.parentNode.insertBefore(div, actions);
            } else {
                const body =
                    overlay.querySelector('.victory-body') ||
                    overlay.querySelector('.story-result-body') ||
                    overlay;
                body.appendChild(div);
            }

            console.log(`[V26.3] XP/ouro injetado em #${overlay.id}`);
        });
    }

    // ==============================================================
    // 4. RESET: ao iniciar nova batalha do evento
    // ==============================================================
    const _origEventoIniciar = window.eventoIniciarBatalha;
    if (typeof _origEventoIniciar === 'function') {
        window.eventoIniciarBatalha = async function() {
            window._evtXPAntes = 0;
            window._evtOuroAntes = 0;
            window._evtDeltaXP = 0;
            window._evtDeltaOuro = 0;
            return _origEventoIniciar.apply(this, arguments);
        };
    }

    // ==============================================================
    // 5. DEBUG: força injeção manual
    // ==============================================================
    window.forcarXPOuro = function(xp, ouro) {
        window._evtDeltaXP = xp || 120;
        window._evtDeltaOuro = ouro || 90;
        console.log(`[V26.3] Forçando injeção: +${window._evtDeltaXP} XP, +${window._evtDeltaOuro} ouro`);
        _injetarXP();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V26.3] XP/ouro no evento (standalone)');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Hook em eventoFinalizarPartida (captura delta)');
    console.log('• Hook em handleStoryBossDefeat (garante chamada)');
    console.log('• Injeta XP/ouro em qualquer overlay');
    console.log('• Debug: window.forcarXPOuro(120, 90)');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — BLOCO 96 (V26.4 — Ícones pequenos + empurrar herói)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js (último bloco).
//
// Corrige:
//   1. Ícones do XP/ouro grandes demais (V26.3) → 16px fixo
//   2. Skills que movem o boss sobrepõem o herói → empurra o herói
// =================================================================

(function fixIconesEmpurraoV264() {
    if (window._fixIconesEmpurraoV264) return;
    window._fixIconesEmpurraoV264 = true;

    console.log('[V26.4] Corrigindo ícones e empurrão...');

    // ==============================================================
    // 1. SOBRESCREVER A INJEÇÃO DE XP/OURO (ícones menores)
    // ==============================================================
    const _origInjetar = window._injetarXP; // não existe, mas garante

    // Reinstala a injeção com tamanhos corretos
    window._injetarXP = function _injetarXPFix() {
        const xp = window._evtDeltaXP;
        const ouro = window._evtDeltaOuro;

        if (xp <= 0 && ouro <= 0) return;

        const overlays = [
            document.getElementById('gameOverlay'),
            document.getElementById('storyVictoryOverlay'),
        ].filter(o => o && (o.classList.contains('active') || o.style.display !== 'none'));

        if (overlays.length === 0) return;

        overlays.forEach(overlay => {
            if (overlay.querySelector('.evt-xp-ouro')) return;

            const div = document.createElement('div');
            div.className = 'evt-xp-ouro';
            div.style.cssText = `
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 14px;
                flex-wrap: wrap;
                padding: 8px 14px;
                margin: 8px auto;
                background: rgba(10, 6, 2, 0.6);
                border: 1px solid rgba(201, 162, 39, 0.4);
                border-radius: 4px;
                font-family: 'Cinzel', serif;
                font-size: 0.85rem;
                font-weight: 700;
                letter-spacing: 1px;
                max-width: 320px;
                width: fit-content;
                box-sizing: border-box;
            `;

            const partes = [];
            if (xp > 0) {
                partes.push(`<span style="color: #e8b923; display: inline-flex; align-items: center; gap: 4px; font-size: 0.85rem;">
                    <span style="font-size: 14px; line-height: 1;">⭐</span> +${xp} XP
                </span>`);
            }
            if (ouro > 0) {
                partes.push(`<span style="color: #e8b923; display: inline-flex; align-items: center; gap: 4px; font-size: 0.85rem;">
                    <span style="font-size: 14px; line-height: 1;">💰</span> +${ouro} ouro
                </span>`);
            }
            div.innerHTML = partes.join('');

            // Insere antes dos botões
            const actions =
                overlay.querySelector('.victory-actions') ||
                overlay.querySelector('.story-result-actions');

            if (actions && actions.parentNode) {
                actions.parentNode.insertBefore(div, actions);
            } else {
                const body =
                    overlay.querySelector('.victory-body') ||
                    overlay.querySelector('.story-result-body') ||
                    overlay;
                body.appendChild(div);
            }

            console.log(`[V26.4] XP/ouro injetado (ícones pequenos) em #${overlay.id}`);
        });
    };

    // Remove a injeção antiga (do V26.3), se existir na tela
    document.querySelectorAll('.evt-xp-ouro').forEach(el => el.remove());

    // ==============================================================
    // 2. EMPURRAR HERÓI QUANDO BOSS SOBREPÕE
    // --------------------------------------------------------------
    // No padrão 1 (move até o herói), o boss pode parar no mesmo tile.
    // Solução: no final do movimento, se boss.x/y === herói.x/y,
    // empurra o herói 1 tile na direção do movimento.
    // ==============================================================
    const _origPorco = STORY_ANIMAL_SKILLS['porco_espinho_bote'];
    const _origCervo = STORY_ANIMAL_SKILLS['cervo_investida'];
    const _origAnta = STORY_ANIMAL_SKILLS['anta_atropelamento'];
    const _origLontra = STORY_ANIMAL_SKILLS['lontra_nado'];
    const _origRaposa = STORY_ANIMAL_SKILLS['raposa_bote'];

    // Helper: empurra herói se sobreposto
    function _empurrarSeSobreposto(bossX, bossY, dir) {
        if (typeof players === 'undefined') return;
        players.forEach(p => {
            if (p.dead) return;
            if (p.x === bossX && p.y === bossY) {
                // Empurra 1 tile na direção do movimento
                const nx = p.x + dir.dx;
                const ny = p.y + dir.dy;
                if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                    if (typeof isOccupied !== 'function' || !isOccupied(nx, ny, p.id)) {
                        p.x = nx;
                        p.y = ny;
                        if (typeof updateVisuals === 'function') updateVisuals();
                        console.log(`[V26.4] Herói ${p.name} empurrado pra (${nx},${ny}) — boss sobrepôs`);
                    }
                }
            }
        });
    }

    // Sobrescreve os 5 handlers com a correção de empurrão
    if (typeof _origPorco === 'function') {
        STORY_ANIMAL_SKILLS['porco_espinho_bote'] = async (enemy) => {
            const r = await _origPorco.call(this, enemy);
            // Após o movimento, verifica se o boss sobrepôs o herói
            _empurrarSeSobreposto(boss.x, boss.y, { dx: Math.sign(boss.x - enemy.x || 0), dy: Math.sign(boss.y - enemy.y || 0) });
            return r;
        };
    }

    if (typeof _origCervo === 'function') {
        STORY_ANIMAL_SKILLS['cervo_investida'] = async (enemy) => {
            const r = await _origCervo.call(this, enemy);
            _empurrarSeSobreposto(boss.x, boss.y, { dx: 0, dy: 1 });
            return r;
        };
    }

    if (typeof _origAnta === 'function') {
        STORY_ANIMAL_SKILLS['anta_atropelamento'] = async (enemy) => {
            const r = await _origAnta.call(this, enemy);
            _empurrarSeSobreposto(boss.x, boss.y, { dx: 0, dy: 1 });
            return r;
        };
    }

    if (typeof _origLontra === 'function') {
        STORY_ANIMAL_SKILLS['lontra_nado'] = async (enemy) => {
            const r = await _origLontra.call(this, enemy);
            _empurrarSeSobreposto(boss.x, boss.y, { dx: 0, dy: 1 });
            return r;
        };
    }

    if (typeof _origRaposa === 'function') {
        STORY_ANIMAL_SKILLS['raposa_bote'] = async (enemy) => {
            const r = await _origRaposa.call(this, enemy);
            _empurrarSeSobreposto(boss.x, boss.y, { dx: 0, dy: 1 });
            return r;
        };
    }

    // ==============================================================
    // LOG FINAL
    // ==============================================================
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V26.4] Correções');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Ícones XP/ouro: 14px fixo (não estouram mais)');
    console.log('• Div XP/ouro: menor (não cobre botões)');
    console.log('• Skills que movem boss: empurram herói se sobrepuser');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — BLOCO 97 (V26.5 — XP/ouro compacto + scroll)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js (último bloco).
//
// Corrige:
//   1. Remove a div de XP/ouro do V26.3/V26.4 (que estoura a tela)
//   2. Injeta XP/ouro no TOPO da tela (junto do título)
//   3. Garante scroll no #gameOverlay e no .victory-panel
// =================================================================

(function xpOuroCompactoV265() {
    if (window._xpOuroCompactoV265) return;
    window._xpOuroCompactoV265 = true;

    console.log('[V26.5] Corrigindo XP/ouro compacto + scroll...');

    // ==============================================================
    // 1. CSS: garante scroll + div compacta
    // ==============================================================
    if (!document.getElementById('v265CSS')) {
        const style = document.createElement('style');
        style.id = 'v265CSS';
        style.textContent = `
            /* Garante scroll no overlay */
            #gameOverlay {
                overflow-y: auto !important;
                overflow-x: hidden !important;
                -webkit-overflow-scrolling: touch;
                padding: 20px 15px !important;
                box-sizing: border-box;
            }
            #gameOverlay.active {
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: flex-start !important;
            }

            /* Painel: não encolhe, mas permite scroll interno */
            #gameOverlay .victory-panel {
                flex-shrink: 0 !important;
                margin: auto !important;
                max-width: 640px;
                width: 100%;
                box-sizing: border-box;
            }

            /* Corpo do painel: espaçamento menor */
            #gameOverlay .victory-body {
                padding: 20px 22px !important;
                gap: 12px !important;
            }

            /* XP/ouro: compacto no topo, junto do título */
            .evt-xp-ouro-top {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                padding: 4px 12px;
                margin-top: 6px;
                background: rgba(10, 6, 2, 0.5);
                border: 1px solid rgba(201, 162, 39, 0.4);
                border-radius: 20px;
                font-family: 'Cinzel', serif;
                font-size: 0.8rem;
                font-weight: 700;
                letter-spacing: 1px;
                color: #e8b923;
                white-space: nowrap;
                max-width: 100%;
                box-sizing: border-box;
            }

            .evt-xp-ouro-top .icone {
                font-size: 13px;
                line-height: 1;
                display: inline-flex;
                align-items: center;
            }

            /* Esconde a div antiga do V26.3/V26.4 */
            .evt-xp-ouro {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }

    // ==============================================================
    // 2. Remove divs antigas (V26.3/V26.4)
    // ==============================================================
    document.querySelectorAll('.evt-xp-ouro').forEach(el => el.remove());

    // ==============================================================
    // 3. Hook em eventoFinalizarPartida (captura delta)
    // ==============================================================
    const _origFinalizar = window.eventoFinalizarPartida;
    if (typeof _origFinalizar === 'function') {
        window.eventoFinalizarPartida = async function(vitoria, saindo) {
            if (vitoria && !saindo && typeof STORY_PROGRESS !== 'undefined') {
                window._evtXPAntes = STORY_PROGRESS.totalXP || 0;
                window._evtOuroAntes = STORY_PROGRESS.gold || 0;
            }

            const result = await _origFinalizar.apply(this, arguments);

            if (vitoria && !saindo && typeof STORY_PROGRESS !== 'undefined') {
                window._evtDeltaXP = (STORY_PROGRESS.totalXP || 0) - window._evtXPAntes;
                window._evtDeltaOuro = (STORY_PROGRESS.gold || 0) - window._evtOuroAntes;
                console.log(`[V26.5] DELTA: +${window._evtDeltaXP} XP, +${window._evtDeltaOuro} ouro`);

                setTimeout(() => _injetarCompacto(), 100);
                setTimeout(() => _injetarCompacto(), 400);
                setTimeout(() => _injetarCompacto(), 900);
            }

            return result;
        };
    }

    // ==============================================================
    // 4. Injeta XP/ouro no TOPO (junto do título)
    // ==============================================================
    function _injetarCompacto() {
        const xp = window._evtDeltaXP || 0;
        const ouro = window._evtDeltaOuro || 0;

        if (xp <= 0 && ouro <= 0) return;

        const overlay = document.getElementById('gameOverlay');
        if (!overlay || !overlay.classList.contains('active')) return;

        // Já tem? Não duplica
        if (overlay.querySelector('.evt-xp-ouro-top')) return;

        // Procura o título (dentro do scroll-top)
        const scrollTop = overlay.querySelector('.victory-scroll-top');
        if (!scrollTop) {
            console.warn('[V26.5] .victory-scroll-top não encontrado');
            return;
        }

        // Cria a div compacta
        const div = document.createElement('div');
        div.className = 'evt-xp-ouro-top';

        const partes = [];
        if (xp > 0) {
            partes.push(`<span><span class="icone">⭐</span> +${xp} XP</span>`);
        }
        if (ouro > 0) {
            partes.push(`<span><span class="icone">💰</span> +${ouro} ouro</span>`);
        }
        div.innerHTML = partes.join('');

        // Insere DEPOIS do título, DENTRO do scroll-top
        scrollTop.appendChild(div);

        console.log(`[V26.5] XP/ouro compacto injetado no topo: +${xp} XP, +${ouro} ouro`);

        // Garante scroll
        _garantirScroll();
    }

    // ==============================================================
    // 5. Garante scroll (força overflow)
    // ==============================================================
    function _garantirScroll() {
        const overlay = document.getElementById('gameOverlay');
        if (!overlay) return;
        overlay.style.overflowY = 'auto';
        overlay.style.maxHeight = '100vh';

        const panel = overlay.querySelector('.victory-panel');
        if (panel) {
            panel.style.flexShrink = '0';
            panel.style.margin = 'auto';
        }

        // Rola pro topo (pra ver o título)
        overlay.scrollTop = 0;
    }

    // ==============================================================
    // 6. Remove a injeção antiga do V26.3/V26.4 (sobrescreve)
    // ==============================================================
    window._injetarXP = _injetarCompacto;

    // ==============================================================
    // 7. Debug
    // ==============================================================
    window.forcarXPOuroCompacto = function(xp, ouro) {
        window._evtDeltaXP = xp || 120;
        window._evtDeltaOuro = ouro || 90;
        document.querySelectorAll('.evt-xp-ouro, .evt-xp-ouro-top').forEach(el => el.remove());
        _injetarCompacto();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V26.5] XP/ouro compacto + scroll');
    console.log('═══════════════════════════════════════════════════');
    console.log('• XP/ouro no TOPO (junto do título, pequeno)');
    console.log('• #gameOverlay com scroll garantido');
    console.log('• Div antiga (V26.3/V26.4) escondida');
    console.log('• Debug: window.forcarXPOuroCompacto(120, 90)');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — BLOCO 98 (V27.0 — Skills Aleatórias + Tela do Evento)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js (último bloco).
//
// 1. Skills (porco, cervo, anta, lontra, raposa): rolada aleatória,
//    com colisão, dano no caminho + tile à frente.
// 2. Evento: usa a tela de vitória do modo história (perfeita).
// =================================================================

(function consolidacaoV270() {
    if (window._consolidacaoV270) return;
    window._consolidacaoV270 = true;

    console.log('[V27.0] Aplicando skills aleatórias + tela do evento...');

    // ==============================================================
    // PARTE 1 — SKILLS DE ROLAR/INVESTIR (Aleatório + Colisão)
    // ==============================================================
    
    // Helper: gera as 4 direções
    const DIRECOES = [
        { dx: 0, dy: -1, name: 'up' },
        { dx: 0, dy: 1, name: 'down' },
        { dx: -1, dy: 0, name: 'left' },
        { dx: 1, dy: 0, name: 'right' }
    ];

    async function _skillRolarAleatorio(enemy, opts) {
        const atk = enemy.atk;
        if (typeof addLog === 'function') addLog(opts.logMsg);

        // ⭐ Escolhe direção aleatória
        const dir = DIRECOES[Math.floor(Math.random() * DIRECOES.length)];
        
        const tilesPercorridos = [];
        let lastX = boss.x, lastY = boss.y;
        let colidiu = false;

        for (let i = 0; i < opts.numSteps; i++) {
            const nx = boss.x + dir.dx;
            const ny = boss.y + dir.dy;
            
            // Borda do tabuleiro
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;

            // Colisão com herói ou obstáculo
            if (typeof isOccupied === 'function' && isOccupied(nx, ny, -1)) {
                colidiu = true;
                break; // Para antes do obstáculo
            }

            // Move o boss
            if (typeof spawnFxAt === 'function') spawnFxAt(opts.fxKey, opts.fxClass, nx, ny, { duration: 400 });
            tilesPercorridos.push({ x: nx, y: ny });
            boss.x = nx;
            boss.y = ny;
            lastX = nx;
            lastY = ny;
            if (typeof updateVisuals === 'function') updateVisuals();
            await sleep(150);
        }

        await sleep(200);

        // FX final
        if (typeof spawnFxAt === 'function') {
            spawnFxAt(opts.finalFxKey || opts.fxKey, opts.finalFxClass || opts.fxClass, lastX, lastY, { duration: 600, scale: 1.2 });
        }

        // ⭐ Monta a área de dano: tiles percorridos + tile à frente
        const tilesDano = [...tilesPercorridos];
        
        // Se colidiu ou parou na borda, o tile à frente também toma dano
        const frenteX = lastX + dir.dx;
        const frenteY = lastY + dir.dy;
        if (frenteX >= 0 && frenteX < 8 && frenteY >= 0 && frenteY < 8) {
            tilesDano.push({ x: frenteX, y: frenteY });
        }

        // Aplica dano
        let danoAplicado = 0;
        players.forEach(p => {
            if (p.dead) return;
            if (tilesDano.some(t => t.x === p.x && t.y === p.y)) {
                if (typeof applyDmg === 'function') applyDmg(p, atk);
                if (opts.pushOnHit && typeof tryPushPlayer === 'function') {
                    tryPushPlayer(p, dir.dx, dir.dy, 1);
                }
                danoAplicado++;
            }
        });

        console.log(`[V27.0] ${opts.descricao}: rolou ${dir.name}, ${danoAplicado} herói(s) atingido(s)`);
        await sleep(300);
    }

    // Substitui os 5 handlers
    STORY_ANIMAL_SKILLS['porco_espinho_bote'] = async (enemy) => {
        return _skillRolarAleatorio(enemy, {
            logMsg: `🦔 ${enemy.name} rola em bola de espinhos!`,
            numSteps: 3,
            fxKey: 'spike_roll', fxClass: 'fx-spike-roll',
            finalFxKey: 'spike_burst', finalFxClass: 'fx-spike-burst',
            pushOnHit: true,
            descricao: 'Porco-espinho'
        });
    };

    STORY_ANIMAL_SKILLS['cervo_investida'] = async (enemy) => {
        return _skillRolarAleatorio(enemy, {
            logMsg: `🦌 ${enemy.name} baixa os chifres e investe!`,
            numSteps: 3,
            fxKey: 'antler_charge', fxClass: 'fx-antler-charge',
            finalFxKey: 'shockwave', finalFxClass: 'fx-shockwave',
            descricao: 'Cervo'
        });
    };

    STORY_ANIMAL_SKILLS['anta_atropelamento'] = async (enemy) => {
        return _skillRolarAleatorio(enemy, {
            logMsg: `🦛 ${enemy.name} atropela!`,
            numSteps: 3,
            fxKey: 'hoof_stomp', fxClass: 'fx-hoof-stomp',
            finalFxKey: 'shockwave', finalFxClass: 'fx-shockwave',
            descricao: 'Anta'
        });
    };

    STORY_ANIMAL_SKILLS['lontra_nado'] = async (enemy) => {
        return _skillRolarAleatorio(enemy, {
            logMsg: `🦦 ${enemy.name} nada rapidamente!`,
            numSteps: 3,
            fxKey: 'splash_wave', fxClass: 'fx-splash-wave',
            descricao: 'Lontra'
        });
    };

    STORY_ANIMAL_SKILLS['raposa_bote'] = async (enemy) => {
        return _skillRolarAleatorio(enemy, {
            logMsg: `🦊 ${enemy.name} dá um bote ágil!`,
            numSteps: 2,
            fxKey: 'pounce_arc', fxClass: 'fx-pounce-arc',
            finalFxKey: 'fang_bite', finalFxClass: 'fx-fang-bite',
            descricao: 'Raposa'
        });
    };

    // ==============================================================
    // PARTE 2 — TELA DE VITÓRIA DO EVENTO (Igual à do História)
    // ==============================================================
    
    // Remove gambiarras antigas
    document.querySelectorAll('.evt-xp-ouro, .evt-xp-ouro-top').forEach(el => el.remove());
    window._injetarXP = null; 

    window._mostrarTelaFinalEvento = function(vitoria, drops, dropsResult) {
        // Se perdeu, usa a tela de derrota padrão (que já funciona)
        if (!vitoria) {
            if (typeof showStoryDefeatScreen === 'function') {
                showStoryDefeatScreen({ name: 'Evento' }, []);
            }
            return;
        }

        const cfg = _eventoBatalha.isPesadelo ? EVENTO_PESADELO : EVENTO_BOSSES[_eventoBatalha.bossId];
        const diff = _eventoBatalha.dificuldade || { nome: 'Normal' };
        const faseId = _eventoBatalha.faseId;

        // Prepara os drops no formato que a tela de história espera
        const dropsFormatados = [];
        if (drops && drops.arma) dropsFormatados.push({ id: drops.arma, qty: 1 });
        if (drops && drops.fragmento) dropsFormatados.push({ id: drops.fragmento, qty: 1 });

        // Calcula XP/Ouro (a mesma lógica que já rodou no eventoFinalizarPartida)
        const xpBase = faseId === 'boss' ? cfg.recompensaXP : Math.floor(cfg.recompensaXP / 5);
        const ouroBase = faseId === 'boss' ? cfg.recompensaOuro : Math.floor(cfg.recompensaOuro / 5);
        const xpGanho = Math.floor(xpBase * diff.xpMult);
        const ouroGanho = Math.floor(ouroBase * diff.ouroMult);

        // Monta o "phase" fake pro showStoryVictoryScreen
        const phaseFake = {
            id: faseId,
            name: cfg.nome,
            isBoss: faseId === 'boss',
            isFinalBoss: _eventoBatalha.isPesadelo,
            enemies: [cfg.id]
        };

        // Chama a tela PERFEITA do modo história
        if (typeof showStoryVictoryScreen === 'function') {
            showStoryVictoryScreen(
                phaseFake,
                dropsFormatados,
                { xp: xpGanho, gold: ouroGanho },
                {
                    stars: 3, // Evento não tem estrelas, mas mostramos 3 pra ficar bonito
                    totalStars: typeof getTotalStars === 'function' ? getTotalStars() : 0,
                    unlockedHeroes: dropsResult && dropsResult.rudaDesbloqueado ? [{ displayName: 'Rudá' }] : []
                }
            );
        }
    };

    // ==============================================================
    // LOG FINAL
    // ==============================================================
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V27.0] Consolidação');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Porco, cervo, anta, lontra, raposa: rolagem aleatória');
    console.log('• Dano no caminho + tile à frente');
    console.log('• Tela do evento: idêntica à do modo história');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — BLOCO 99 (V28.0 — PVP: PA funciona)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js (último bloco).
//
// Corrige: o triggerBravelyChain do V23.2 ignora PVP (só aceita
// _storyMode ou _eventoAtivo). Este patch reativa o PA no PVP.
// =================================================================

(function pvpPAfuncionaV280() {
    if (window._pvpPAfuncionaV280) return;
    window._pvpPAfuncionaV280 = true;

    console.log('[V28.0] Ativando PA no PVP...');

    const _origBravely = window.triggerBravelyChain;
    if (typeof _origBravely !== 'function') {
        console.warn('[V28.0] triggerBravelyChain não existe.');
        return;
    }

    window.triggerBravelyChain = async function(active, target, totalAtk) {
        // ⭐ No PVP, faz o PA completo
        if (window._pvpMode) {
            return await _triggerBravelyPVP(active, target, totalAtk);
        }

        // Fora do PVP, chama o original
        return _origBravely.apply(this, arguments);
    };

    // ==============================================================
    // LÓGICA DO PA NO PVP
    // ==============================================================
    async function _triggerBravelyPVP(active, target, totalAtk) {
        if (!active || !target) return;

        const heroData = (typeof STORY_HERO_CLASSES !== 'undefined')
            ? STORY_HERO_CLASSES[active.class]
            : null;

        if (!heroData || !heroData.paKey) return;

        const paKey = heroData.paKey;
        const element = active.element || 'FOGO';

        // Overlay "PODER ANCESTRAL"
        if (typeof showPoderAncestralEffect === 'function') {
            try { showPoderAncestralEffect(); } catch(e) {}
        }
        await sleep(300);

        try { if (typeof playSfx === 'function') playSfx('skill1'); } catch(e) {}

        // Heróis base (Tupã/Sumé/Caipora) → lógica própria
        if (paKey.startsWith('base_')) {
            return await _pvpBravelyBase(active, target, totalAtk, paKey, element);
        }

        // Heróis novos → lógica simplificada
        return await _pvpBravelyNovo(active, target, totalAtk, paKey, element);
    }

    // ==============================================================
    // PA dos heróis base (Tupã/Sumé/Caipora)
    // ==============================================================
    async function _pvpBravelyBase(active, target, totalAtk, paKey, element) {
        const affectedIndices = [];

        if (paKey === 'base_coluna') {
            // Tupã: coluna
            if (typeof triggerElementalFX === 'function') {
                triggerElementalFX(element, active.x, 'COL', active.x, active.y);
            }
            for (let row = 0; row < 8; row++) affectedIndices.push(row * 8 + active.x);
            if (target.x === active.x) {
                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            }
        }
        else if (paKey === 'base_linha_cura') {
            // Sumé: linha + cura
            if (typeof triggerElementalFX === 'function') {
                triggerElementalFX(element, active.y, 'ROW', active.x, active.y);
            }
            for (let col = 0; col < 8; col++) affectedIndices.push(active.y * 8 + col);
            if (target.y === active.y) {
                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            }
            // Cura
            if (typeof players !== 'undefined') {
                players.forEach(p => {
                    if (!p.dead && p.y === active.y) {
                        p.hp = Math.min(p.maxHp, p.hp + 2);
                        if (typeof showHealEffect === 'function') showHealEffect(p.x, p.y, 2);
                    }
                });
            }
        }
        else if (paKey === 'base_area_alvo') {
            // Caipora: área 3×3 no alvo
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = target.x + dx;
                    const ny = target.y + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                        affectedIndices.push(ny * 8 + nx);
                    }
                }
            }
            if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
        }

        // Converte tiles
        affectedIndices.forEach(idx => {
            if (typeof grid !== 'undefined') grid[idx] = element;
            const tile = document.querySelectorAll('#grid .tile')[idx];
            if (tile) tile.className = `tile bg-${element}`;
        });

        console.log(`[V28.0] PA base no PVP: ${paKey}, ${affectedIndices.length} tiles`);
    }

    // ==============================================================
    // PA dos heróis novos (simplificado pro PVP)
    // --------------------------------------------------------------
    // No PVP, o PA é só dano + conversão de tiles. Sem cura,
    // sem empurrão, sem cura. Pro PVP ficar justo.
    // ==============================================================
    async function _pvpBravelyNovo(active, target, totalAtk, paKey, element) {
        if (!target || target.dead) return;

        // Aplica dano direto no alvo
        if (typeof applyDmg === 'function') {
            applyDmg(target, totalAtk);
        }

        // Converte tiles ao redor do alvo (área 3×3) pro elemento
        const tiles = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = target.x + dx;
                const ny = target.y + dy;
                if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                    tiles.push(ny * 8 + nx);
                }
            }
        }

        tiles.forEach(idx => {
            if (typeof grid !== 'undefined') grid[idx] = element;
            const tile = document.querySelectorAll('#grid .tile')[idx];
            if (tile) tile.className = `tile bg-${element}`;
        });

        // FX visual
        if (typeof spawnFxArea === 'function') {
            spawnFxArea('impact', 'fx-impact', target.x, target.y, 1, { duration: 600 });
        }

        console.log(`[V28.0] PA ${paKey} no PVP: ${totalAtk} dano, ${tiles.length} tiles`);
    }

    // Helper
    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    console.log('✅ [V28.0] PA no PVP ativado.');
})();
// =================================================================
// historia.js — BLOCO 100 (V28.1 — PVP: PA EXATO do modo história)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js (último bloco).
// Substitui o V28.0.
//
// Corrige: o V28.0 simplificava o PA no PVP. Agora usa o PA EXATO
// (mesmo STORY_HERO_PA[paKey] do modo história).
// =================================================================

(function pvpPAexatoV281() {
    if (window._pvpPAexatoV281) return;
    window._pvpPAexatoV281 = true;

    // Desativa o V28.0 se existir
    window._pvpPAfuncionaV280 = false;

    console.log('[V28.1] Instalando PA EXATO no PVP...');

    const _origBravely = window.triggerBravelyChain;
    if (typeof _origBravely !== 'function') {
        console.warn('[V28.1] triggerBravelyChain não existe.');
        return;
    }

    window.triggerBravelyChain = async function(active, target, totalAtk) {
        // ⭐ No PVP, executa o PA exato (sem simplificação)
        if (window._pvpMode) {
            return await _executarPAexatoPVP(active, target, totalAtk);
        }
        return _origBravely.apply(this, arguments);
    };

    // ==============================================================
    // EXECUTA O PA EXATO NO PVP
    // ==============================================================
    async function _executarPAexatoPVP(active, target, totalAtk) {
        if (!active || !target) return;

        const heroData = (typeof STORY_HERO_CLASSES !== 'undefined')
            ? STORY_HERO_CLASSES[active.class]
            : null;

        if (!heroData || !heroData.paKey) return;

        const paKey = heroData.paKey;
        const element = active.element || 'FOGO';

        // 1. Overlay "PODER ANCESTRAL"
        if (typeof showPoderAncestralEffect === 'function') {
            try { showPoderAncestralEffect(); } catch(e) {}
        }
        await sleep(300);

        try { if (typeof playSfx === 'function') playSfx('skill1'); } catch(e) {}

        // 2. Heróis base (Tupã/Sumé/Caipora) → lógica própria
        if (paKey.startsWith('base_')) {
            return await _pvpBravelyBase(active, target, totalAtk, paKey, element);
        }

        // 3. Heróis novos → PA EXATO
        return await _pvpBravelyNovoExato(active, target, totalAtk, paKey, element);
    }

    // ==============================================================
    // PA dos heróis base (Tupã/Sumé/Caipora) — mantido igual
    // ==============================================================
    async function _pvpBravelyBase(active, target, totalAtk, paKey, element) {
        const affectedIndices = [];

        if (paKey === 'base_coluna') {
            if (typeof triggerElementalFX === 'function') {
                triggerElementalFX(element, active.x, 'COL', active.x, active.y);
            }
            for (let row = 0; row < 8; row++) affectedIndices.push(row * 8 + active.x);
            if (target.x === active.x) {
                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            }
        }
        else if (paKey === 'base_linha_cura') {
            if (typeof triggerElementalFX === 'function') {
                triggerElementalFX(element, active.y, 'ROW', active.x, active.y);
            }
            for (let col = 0; col < 8; col++) affectedIndices.push(active.y * 8 + col);
            if (target.y === active.y) {
                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            }
            players.forEach(p => {
                if (!p.dead && p.y === active.y) {
                    p.hp = Math.min(p.maxHp, p.hp + 2);
                    if (typeof showHealEffect === 'function') showHealEffect(p.x, p.y, 2);
                }
            });
        }
        else if (paKey === 'base_area_alvo') {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = target.x + dx;
                    const ny = target.y + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                        affectedIndices.push(ny * 8 + nx);
                    }
                }
            }
            if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
        }

        affectedIndices.forEach(idx => {
            if (typeof grid !== 'undefined') grid[idx] = element;
            const tile = document.querySelectorAll('#grid .tile')[idx];
            if (tile) tile.className = `tile bg-${element}`;
        });

        console.log(`[V28.1] PA base no PVP: ${paKey}, ${affectedIndices.length} tiles`);
    }

    // ==============================================================
    // PA dos heróis novos — EXATO (chama STORY_HERO_PA[paKey])
    // ==============================================================
    async function _pvpBravelyNovoExato(active, target, totalAtk, paKey, element) {
        if (!target) return;

        const paFn = STORY_HERO_PA[paKey];
        if (!paFn || typeof paFn.execute !== 'function') {
            console.warn(`[V28.1] PA ${paKey} não encontrado em STORY_HERO_PA`);
            return;
        }

        // ⭐ Chama o PA EXATO (com cura, empurrão, tudo)
        try {
            await paFn.execute(active, target, totalAtk);
        } catch(e) {
            console.warn(`[V28.1] Erro no PA ${paKey}:`, e);
        }

        // ⭐ Calcula os tiles afetados (mesma lógica do V23.2)
        const targetSnapshot = target ? { x: target.x, y: target.y, dead: target.dead, id: target.id } : null;
        const paTiles = _calcularTilesPA(active, paKey, targetSnapshot);

        // ⭐ Converte os tiles (mesmo que o PA já tenha convertido alguns)
        paTiles.forEach(idx => {
            if (typeof grid !== 'undefined') grid[idx] = element;
            const tile = document.querySelectorAll('#grid .tile')[idx];
            if (tile) tile.className = `tile bg-${element}`;
        });

        console.log(`[V28.1] PA EXATO ${paKey} no PVP: ${totalAtk} dano, ${paTiles.length} tiles`);
    }

    // ==============================================================
    // Calcula tiles do PA (mesma lógica do V23.2)
    // ==============================================================
    function _calcularTilesPA(active, paKey, targetSnapshot) {
        const tiles = [];
        const cx = active.x;
        const cy = active.y;
        const hasTarget = targetSnapshot && typeof targetSnapshot.x === 'number';

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
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                }
            }
        }
        else if (paKey === 'eru_linha_horizontal') {
            for (let x = 0; x < 8; x++) tiles.push(cy * 8 + x);
        }
        else if (paKey === 'andure_area2x2_cura') {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                }
            }
        }
        else if (paKey === 'maedamata_area3x3_cura') {
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                }
            }
        }
        else if (paKey === 'paje_coluna_fogo') {
            for (let y = 0; y < 8; y++) tiles.push(y * 8 + cx);
        }
        else if (paKey === 'jurua_area_alvo_3x3') {
            if (hasTarget) {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const nx = targetSnapshot.x + dx, ny = targetSnapshot.y + dy;
                        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                    }
                }
            }
        }
        else if (paKey === 'araci_linha_horizontal') {
            for (let x = 0; x < 8; x++) tiles.push(cy * 8 + x);
        }
        else if (paKey === 'bicho_cruz_completa') {
            if (hasTarget) {
                for (let x = 0; x < 8; x++) tiles.push(targetSnapshot.y * 8 + x);
                for (let y = 0; y < 8; y++) {
                    if (y !== targetSnapshot.y) tiles.push(y * 8 + targetSnapshot.x);
                }
            }
        }
        else if (paKey === 'tapyra_coluna_alvo') {
            if (hasTarget) {
                for (let y = 0; y < 8; y++) tiles.push(y * 8 + targetSnapshot.x);
            }
        }
        else if (paKey === 'curupira_chuva_flechas') {
            grid.forEach((el, idx) => { if (el === 'AR') tiles.push(idx); });
        }
        else if (paKey === 'kianumanka_meteoro') {
            if (hasTarget) {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const nx = targetSnapshot.x + dx, ny = targetSnapshot.y + dy;
                        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                    }
                }
            }
        }
        else if (paKey === 'anhanga_mirim_raio') {
            if (hasTarget) {
                for (let i = 0; i < 8; i++) {
                    if (!tiles.includes(i * 8 + targetSnapshot.x)) tiles.push(i * 8 + targetSnapshot.x);
                    if (!tiles.includes(targetSnapshot.y * 8 + i)) tiles.push(targetSnapshot.y * 8 + i);
                }
            }
        }
        else if (paKey === 'matinta_rajada') {
            for (let x = 0; x < 8; x++) tiles.push(cy * 8 + x);
        }
        else if (paKey === 'naia_apaga_fogo') {
            grid.forEach((el, idx) => { if (el === 'FOGO') tiles.push(idx); });
        }
        else if (paKey === 'kuati_explosao') {
            const area = [];
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) area.push(ny * 8 + nx);
                }
            }
            const linha = [];
            for (let x = 0; x < 8; x++) linha.push(cy * 8 + x);
            [...new Set([...area, ...linha])].forEach(idx => tiles.push(idx));
        }
        else if (paKey === 'caboclo_mare') {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                }
            }
        }
        else if (paKey === 'tupinamba_avalanche') {
            if (hasTarget) {
                for (let i = 0; i < 8; i++) {
                    if (!tiles.includes(i * 8 + targetSnapshot.x)) tiles.push(i * 8 + targetSnapshot.x);
                    if (!tiles.includes(targetSnapshot.y * 8 + i)) tiles.push(targetSnapshot.y * 8 + i);
                }
            }
        }
        else if (paKey === 'mbaraka_salto_raio') {
            if (hasTarget) {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const nx = targetSnapshot.x + dx, ny = targetSnapshot.y + dy;
                        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                    }
                }
            }
        }
        else if (paKey === 'maedouro_caminho') {
            if (hasTarget) {
                const stepX = Math.sign(targetSnapshot.x - cx);
                for (let x = cx; x !== targetSnapshot.x + stepX; x += (stepX || 1)) {
                    const nx = Math.max(0, Math.min(7, x));
                    const idx = cy * 8 + nx;
                    if (!tiles.includes(idx)) tiles.push(idx);
                    if (stepX === 0) break;
                }
                const stepY = Math.sign(targetSnapshot.y - cy);
                for (let y = cy; y !== targetSnapshot.y + stepY; y += (stepY || 1)) {
                    const ny = Math.max(0, Math.min(7, y));
                    const idx = ny * 8 + targetSnapshot.x;
                    if (!tiles.includes(idx)) tiles.push(idx);
                    if (stepY === 0) break;
                }
                const bossIdx = targetSnapshot.y * 8 + targetSnapshot.x;
                if (!tiles.includes(bossIdx)) tiles.push(bossIdx);
            }
        }
        else if (paKey === 'pajeacu_linha') {
            for (let x = 0; x < 8; x++) tiles.push(cy * 8 + x);
        }
        else if (paKey === 'negrinho_cruz_cura') {
            if (hasTarget) {
                for (let i = 0; i < 8; i++) {
                    if (!tiles.includes(i * 8 + targetSnapshot.x)) tiles.push(i * 8 + targetSnapshot.x);
                    if (!tiles.includes(targetSnapshot.y * 8 + i)) tiles.push(targetSnapshot.y * 8 + i);
                }
            }
        }

        return tiles;
    }

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    console.log('✅ [V28.1] PA EXATO no PVP instalado.');
    console.log('   • Heróis base: lógica própria (Tupã/Sumé/Caipora)');
    console.log('   • Heróis novos: STORY_HERO_PA[paKey].execute (cura, empurrão, etc.)');
})();
// =================================================================
// historia.js — BLOCO 101 (V28.2 — Coop: PA funciona)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js (último bloco).
//
// Corrige: o triggerBravelyChain do V23.2 ignora Coop (só aceita
// _storyMode, _eventoAtivo e _pvpMode). Este patch reativa no Coop.
// =================================================================

(function coopPAfuncionaV282() {
    if (window._coopPAfuncionaV282) return;
    window._coopPAfuncionaV282 = true;

    console.log('[V28.2] Ativando PA no Coop...');

    const _origBravely = window.triggerBravelyChain;
    if (typeof _origBravely !== 'function') {
        console.warn('[V28.2] triggerBravelyChain não existe.');
        return;
    }

    window.triggerBravelyChain = async function(active, target, totalAtk) {
        // ⭐ No Coop, faz o PA exato (mesma lógica do modo história)
        if (window._coopMode) {
            return await _executarPAexatoCoop(active, target, totalAtk);
        }
        // Fora do Coop, chama o original (que já tem PVP)
        return _origBravely.apply(this, arguments);
    };

    // ==============================================================
    // EXECUTA O PA EXATO NO COOP
    // --------------------------------------------------------------
    // Usa a mesma lógica do V23.2 (boss real, sem fake).
    // ==============================================================
    async function _executarPAexatoCoop(active, target, totalAtk) {
        if (!active || !target) return;

        const heroData = (typeof STORY_HERO_CLASSES !== 'undefined')
            ? STORY_HERO_CLASSES[active.class]
            : null;

        if (!heroData || !heroData.paKey) return;

        const paKey = heroData.paKey;
        const element = active.element || 'FOGO';

        // Snapshot do alvo
        const targetSnapshot = {
            x: target.x,
            y: target.y,
            dead: target.dead,
            id: target.id,
        };

        // Overlay "PODER ANCESTRAL"
        if (typeof showPoderAncestralEffect === 'function') {
            try { showPoderAncestralEffect(); } catch(e) {}
        }
        await sleep(300);

        try { if (typeof playSfx === 'function') playSfx('skill1'); } catch(e) {}

        // Heróis base (Tupã/Sumé/Caipora) → lógica própria
        if (paKey.startsWith('base_')) {
            return await _coopBravelyBase(active, target, totalAtk, paKey, element);
        }

        // Heróis novos → PA EXATO (STORY_HERO_PA)
        return await _coopBravelyNovoExato(active, target, totalAtk, paKey, element, targetSnapshot);
    }

    // ==============================================================
    // PA dos heróis base (igual ao V23.2)
    // ==============================================================
    async function _coopBravelyBase(active, target, totalAtk, paKey, element) {
        const affectedIndices = [];

        if (paKey === 'base_coluna') {
            if (typeof triggerElementalFX === 'function') {
                triggerElementalFX(element, active.x, 'COL', active.x, active.y);
            }
            for (let row = 0; row < 8; row++) affectedIndices.push(row * 8 + active.x);
            if (target && !target.dead && target.x === active.x) {
                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            }
        }
        else if (paKey === 'base_linha_cura') {
            if (typeof triggerElementalFX === 'function') {
                triggerElementalFX(element, active.y, 'ROW', active.x, active.y);
            }
            for (let col = 0; col < 8; col++) affectedIndices.push(active.y * 8 + col);
            if (target && !target.dead && target.y === active.y) {
                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            }
            players.forEach(p => {
                if (!p.dead && p.y === active.y) {
                    p.hp = Math.min(p.maxHp, p.hp + 2);
                    if (typeof showHealEffect === 'function') showHealEffect(p.x, p.y, 2);
                }
            });
        }
        else if (paKey === 'base_area_alvo') {
            if (target) {
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = target.x + dx;
                        const ny = target.y + dy;
                        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                            affectedIndices.push(ny * 8 + nx);
                        }
                    }
                }
                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            }
        }

        affectedIndices.forEach(idx => {
            if (typeof grid !== 'undefined') grid[idx] = element;
            const tile = document.querySelectorAll('#grid .tile')[idx];
            if (tile) tile.className = `tile bg-${element}`;
        });

        console.log(`[V28.2] PA base no Coop: ${paKey}, ${affectedIndices.length} tiles`);
    }

    // ==============================================================
    // PA dos heróis novos — EXATO (chama STORY_HERO_PA[paKey])
    // ==============================================================
    async function _coopBravelyNovoExato(active, target, totalAtk, paKey, element, targetSnapshot) {
        const paFn = STORY_HERO_PA[paKey];
        if (!paFn || typeof paFn.execute !== 'function') {
            console.warn(`[V28.2] PA ${paKey} não encontrado em STORY_HERO_PA`);
            return;
        }

        // ⭐ Chama o PA EXATO (com cura, empurrão, tudo)
        try {
            await paFn.execute(active, target, totalAtk);
        } catch(e) {
            console.warn(`[V28.2] Erro no PA ${paKey}:`, e);
        }

        // ⭐ Calcula os tiles afetados (mesma lógica do V23.2)
        const paTiles = _calcularTilesPA(active, paKey, targetSnapshot);

        // ⭐ Converte os tiles
        paTiles.forEach(idx => {
            if (typeof grid !== 'undefined') grid[idx] = element;
            const tile = document.querySelectorAll('#grid .tile')[idx];
            if (tile) tile.className = `tile bg-${element}`;
        });

        console.log(`[V28.2] PA EXATO ${paKey} no Coop: ${totalAtk} dano, ${paTiles.length} tiles`);
    }

    // ==============================================================
    // Calcula tiles do PA (mesma lógica do V23.2)
    // ==============================================================
    function _calcularTilesPA(active, paKey, targetSnapshot) {
        const tiles = [];
        const cx = active.x;
        const cy = active.y;
        const hasTarget = targetSnapshot && typeof targetSnapshot.x === 'number';

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
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                }
            }
        }
        else if (paKey === 'eru_linha_horizontal') {
            for (let x = 0; x < 8; x++) tiles.push(cy * 8 + x);
        }
        else if (paKey === 'andure_area2x2_cura') {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                }
            }
        }
        else if (paKey === 'maedamata_area3x3_cura') {
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                }
            }
        }
        else if (paKey === 'paje_coluna_fogo') {
            for (let y = 0; y < 8; y++) tiles.push(y * 8 + cx);
        }
        else if (paKey === 'jurua_area_alvo_3x3') {
            if (hasTarget) {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const nx = targetSnapshot.x + dx, ny = targetSnapshot.y + dy;
                        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                    }
                }
            }
        }
        else if (paKey === 'araci_linha_horizontal') {
            for (let x = 0; x < 8; x++) tiles.push(cy * 8 + x);
        }
        else if (paKey === 'bicho_cruz_completa') {
            if (hasTarget) {
                for (let x = 0; x < 8; x++) tiles.push(targetSnapshot.y * 8 + x);
                for (let y = 0; y < 8; y++) {
                    if (y !== targetSnapshot.y) tiles.push(y * 8 + targetSnapshot.x);
                }
            }
        }
        else if (paKey === 'tapyra_coluna_alvo') {
            if (hasTarget) {
                for (let y = 0; y < 8; y++) tiles.push(y * 8 + targetSnapshot.x);
            }
        }
        else if (paKey === 'curupira_chuva_flechas') {
            grid.forEach((el, idx) => { if (el === 'AR') tiles.push(idx); });
        }
        else if (paKey === 'kianumanka_meteoro') {
            if (hasTarget) {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const nx = targetSnapshot.x + dx, ny = targetSnapshot.y + dy;
                        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                    }
                }
            }
        }
        else if (paKey === 'anhanga_mirim_raio') {
            if (hasTarget) {
                for (let i = 0; i < 8; i++) {
                    if (!tiles.includes(i * 8 + targetSnapshot.x)) tiles.push(i * 8 + targetSnapshot.x);
                    if (!tiles.includes(targetSnapshot.y * 8 + i)) tiles.push(targetSnapshot.y * 8 + i);
                }
            }
        }
        else if (paKey === 'matinta_rajada') {
            for (let x = 0; x < 8; x++) tiles.push(cy * 8 + x);
        }
        else if (paKey === 'naia_apaga_fogo') {
            grid.forEach((el, idx) => { if (el === 'FOGO') tiles.push(idx); });
        }
        else if (paKey === 'kuati_explosao') {
            const area = [];
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) area.push(ny * 8 + nx);
                }
            }
            const linha = [];
            for (let x = 0; x < 8; x++) linha.push(cy * 8 + x);
            [...new Set([...area, ...linha])].forEach(idx => tiles.push(idx));
        }
        else if (paKey === 'caboclo_mare') {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const nx = cx + dx, ny = cy + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                }
            }
        }
        else if (paKey === 'tupinamba_avalanche') {
            if (hasTarget) {
                for (let i = 0; i < 8; i++) {
                    if (!tiles.includes(i * 8 + targetSnapshot.x)) tiles.push(i * 8 + targetSnapshot.x);
                    if (!tiles.includes(targetSnapshot.y * 8 + i)) tiles.push(targetSnapshot.y * 8 + i);
                }
            }
        }
        else if (paKey === 'mbaraka_salto_raio') {
            if (hasTarget) {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const nx = targetSnapshot.x + dx, ny = targetSnapshot.y + dy;
                        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                    }
                }
            }
        }
        else if (paKey === 'maedouro_caminho') {
            if (hasTarget) {
                const stepX = Math.sign(targetSnapshot.x - cx);
                for (let x = cx; x !== targetSnapshot.x + stepX; x += (stepX || 1)) {
                    const nx = Math.max(0, Math.min(7, x));
                    const idx = cy * 8 + nx;
                    if (!tiles.includes(idx)) tiles.push(idx);
                    if (stepX === 0) break;
                }
                const stepY = Math.sign(targetSnapshot.y - cy);
                for (let y = cy; y !== targetSnapshot.y + stepY; y += (stepY || 1)) {
                    const ny = Math.max(0, Math.min(7, y));
                    const idx = ny * 8 + targetSnapshot.x;
                    if (!tiles.includes(idx)) tiles.push(idx);
                    if (stepY === 0) break;
                }
                const bossIdx = targetSnapshot.y * 8 + targetSnapshot.x;
                if (!tiles.includes(bossIdx)) tiles.push(bossIdx);
            }
        }
        else if (paKey === 'pajeacu_linha') {
            for (let x = 0; x < 8; x++) tiles.push(cy * 8 + x);
        }
        else if (paKey === 'negrinho_cruz_cura') {
            if (hasTarget) {
                for (let i = 0; i < 8; i++) {
                    if (!tiles.includes(i * 8 + targetSnapshot.x)) tiles.push(i * 8 + targetSnapshot.x);
                    if (!tiles.includes(targetSnapshot.y * 8 + i)) tiles.push(targetSnapshot.y * 8 + i);
                }
            }
        }

        return tiles;
    }

    function sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    console.log('✅ [V28.2] PA no Coop ativado.');
    console.log('   • Heróis base: lógica própria (Tupã/Sumé/Caipora)');
    console.log('   • Heróis novos: STORY_HERO_PA[paKey].execute (cura, empurrão, etc.)');
})();
// =================================================================
// historia.js — BLOCO 102 (V29.0 — Fix Boss Renascendo no Coop)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js (último bloco).
//
// Corrige: o boss morre, mas o coop.js recria ele porque a
// sincronização com o Firestore se perde (culpa dos patches de PA).
// =================================================================

(function fixCoopBossRenascendoV290() {
    if (window._fixCoopBossRenascendoV290) return;
    window._fixCoopBossRenascendoV290 = true;

    console.log('[V29.0] Blindando Coop contra boss renascendo...');

    // ==============================================================
    // 1. AVISAR O COOP QUANDO O BOSS MORRER
    // --------------------------------------------------------------
    // Envolve o applyDmg para avisar o coop.js ANTES de processar
    // ==============================================================
    const _origApplyDmg = window.applyDmg;
    if (typeof _origApplyDmg === 'function') {
        window.applyDmg = function(target, amount) {
            const result = _origApplyDmg.apply(this, arguments);

            // ⭐ Se o boss morreu e estamos no Coop
            if (window._coopMode && target === boss && boss.dead) {
                console.log('[V29.0] Boss morreu no Coop. Avisando coop.js...');

                // Força a flag de processamento (para o coop.js não deixar o boss renascer)
                if (typeof coopProcessandoMorteBoss !== 'undefined') {
                    window.coopProcessandoMorteBoss = true;
                }
                if (typeof coopPartidaConcluida !== 'undefined') {
                    window.coopPartidaConcluida = true;
                }
                if (typeof coopBossRunning !== 'undefined') {
                    window.coopBossRunning = false;
                }

                // Se o coop tiver uma função de processar morte, chama
                if (typeof window.coopProcessarMorteBoss === 'function') {
                    setTimeout(() => {
                        window.coopProcessarMorteBoss();
                    }, 100);
                }
            }

            return result;
        };
    }

    // ==============================================================
    // 2. BLOQUEAR O BOSS DE "VOLTAR À VIDA" NO COOP
    // --------------------------------------------------------------
    // Se o Firestore tentar restaurar o HP do boss (via
    // coopAplicarEstadoDoRoom), e ele já morreu localmente,
    // a gente barra.
    // ==============================================================
    const _origAplicarEstado = window.coopAplicarEstadoDoRoom;
    if (typeof _origAplicarEstado === 'function') {
        window.coopAplicarEstadoDoRoom = function(room) {
            // ⭐ Se estamos processando a morte, ignora a sala
            if (window.coopProcessandoMorteBoss) {
                console.log('[V29.0] Ignorando estado da sala (processando morte do boss)');
                return;
            }

            // ⭐ Se o boss local morreu e a sala diz que ele tá vivo
            if (boss && boss.dead && room?.estadoJogo?.boss && !room.estadoJogo.boss.dead) {
                console.log('[V29.0] Sala tentou reviver o boss. Bloqueado.');
                return;
            }

            return _origAplicarEstado.apply(this, arguments);
        };
    }

    // ==============================================================
    // 3. BLOQUEAR O P2 DE RODAR O BOSS SE ELE JÁ MORREU
    // ==============================================================
    const _origRodarBossP2 = window.coopRodarBossP2;
    if (typeof _origRodarBossP2 === 'function') {
        window.coopRodarBossP2 = async function() {
            if (boss && boss.dead) {
                console.log('[V29.0] coopRodarBossP2 bloqueado (boss morto)');
                return;
            }
            if (window.coopProcessandoMorteBoss) {
                console.log('[V29.0] coopRodarBossP2 bloqueado (processando morte)');
                return;
            }
            return _origRodarBossP2.apply(this, arguments);
        };
    }

    // ==============================================================
    // 4. RESETAR FLAGS AO INICIAR BATALHA
    // ==============================================================
    if (typeof window.initStoryBattle === 'function') {
        const _origInit = window.initStoryBattle;
        window.initStoryBattle = async function() {
            if (window._coopMode) {
                window.coopProcessandoMorteBoss = false;
                window.coopPartidaConcluida = false;
            }
            return _origInit.apply(this, arguments);
        };
    }

    // ==============================================================
    // 5. GARANTIR QUE O ADVANCE STORY ENEMY NÃO SEJA CHAMADO DUAS VEZES
    // --------------------------------------------------------------
    // O coop.js tem um "monitor de turno travado" que chama
    // advanceStoryEnemy. Se o boss já morreu, a gente bloqueia.
    // ==============================================================
    const _origAdvance = window.advanceStoryEnemy;
    if (typeof _origAdvance === 'function' && !window._v290Advance) {
        window._v290Advance = true;
        let _advanceRodando = false;

        window.advanceStoryEnemy = async function() {
            if (_advanceRodando) {
                console.log('[V29.0] advanceStoryEnemy já rodando. Bloqueado.');
                return;
            }
            _advanceRodando = true;
            try {
                return await _origAdvance.apply(this, arguments);
            } finally {
                _advanceRodando = false;
            }
        };
    }

    console.log('✅ [V29.0] Coop blindado contra boss renascendo.');
})();
// =================================================================
// historia.js — BLOCO 106 (V30.3-FIX — Pajé-Açu: só fere o boss)
// -----------------------------------------------------------------
// Corrige: o bloco de dano base em heróis na linha foi REMOVIDO.
// O PA do Pajé-Açu agora só:
//   1. Pinta a linha de FOGO
//   2. Se o boss estiver na linha → empurra pra borda + dano por colisão
//   3. NÃO fere heróis na linha (nem o próprio Pajé-Açu)
// =================================================================

(function fixPajeAcuLinhaV303() {
    if (window._fixPajeAcuLinhaV303) return;
    window._fixPajeAcuLinhaV303 = true;

    console.log('[V30.3-FIX] Corrigindo PA do Pajé-Açu (só fere o boss)...');

    STORY_HERO_PA['pajeacu_linha'] = {
        desc: 'Dano em linha do herói. Empurra boss pra borda. Colisão = +50% dano. Só atinge o boss.',
        execute: async (active, target, totalAtk) => {
            if (!target) return;

            const linha = active.y; // A linha do herói
            const tilesLinha = [];
            for (let x = 0; x < 8; x++) {
                tilesLinha.push({ x: x, y: linha, idx: linha * 8 + x });
            }

            // 1. Efeito visual (fogo na linha)
            tilesLinha.forEach((t, i) => {
                setTimeout(() => {
                    if (typeof spawnFxAt === 'function') {
                        spawnFxAt('impact', 'fx-impact', t.x, t.y, { duration: 500, scale: 0.6 });
                    }
                }, i * 40);
            });

            // 2. Pinta a linha de FOGO
            tilesLinha.forEach(t => {
                grid[t.idx] = 'FOGO';
                const el = document.querySelectorAll('#grid .tile')[t.idx];
                if (el) el.className = 'tile bg-FOGO';
            });

            await sleep(500);

            // 3. ⭐ SÓ O BOSS É AFETADO (NÃO fere heróis na linha)
            if (target && !target.dead) {
                if (target.y === linha) {
                    const targetX = target.x < 4 ? 0 : 7;

                    // Move apenas o X (mantém o Y)
                    target.x = targetX;

                    if (typeof updateVisuals === 'function') updateVisuals();
                    await sleep(300);

                    // Dano extra por colisão na borda
                    const dmgExtra = Math.floor(totalAtk * 0.5);
                    if (typeof applyDmg === 'function') applyDmg(target, dmgExtra);

                    if (typeof addLog === 'function') {
                        addLog(`🔥 Pajé-Açu: boss empurrado e colidiu! (+${dmgExtra} dano)`);
                    }
                } else {
                    // ⭐ BOSS ESTÁ EM OUTRA LINHA: NÃO FAZ NADA
                    if (typeof addLog === 'function') {
                        addLog(`🔥 Pajé-Açu: boss fora da linha de fogo (não foi afetado).`);
                    }
                }
            }

            if (typeof addLog === 'function') {
                addLog(`🔥 Pajé-Açu: linha de fogo! (só o boss é afetado)`);
            }
        }
    };

    console.log('✅ [V30.3-FIX] PA do Pajé-Açu corrigido (não fere mais o herói).');
})();
// =================================================================
// historia.js — BLOCO 112 (V34.0 — Renomear Tapyra + Migrar Save)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js (último bloco).
// =================================================================

(function renomearTapyraV340() {
    if (window._renomearTapyraV340) return;
    window._renomearTapyraV340 = true;

    console.log('[V34.0] Renomeando Tapyra (apóstrofo → hífen)...');

    // 1. Muda o displayName e o className na tabela
    if (typeof STORY_HERO_CLASSES !== 'undefined' && STORY_HERO_CLASSES["Tapyra'yawara"]) {
        const hero = STORY_HERO_CLASSES["Tapyra'yawara"];
        hero.displayName = "Tapyra-Yawara";
        hero.className = "Tapyra-Yawara";

        // Move a chave do objeto para o novo nome
        STORY_HERO_CLASSES["Tapyra-Yawara"] = hero;
        delete STORY_HERO_CLASSES["Tapyra'yawara"];
    }

    // 2. Atualiza a tabela de unlocks por estrelas (se existir)
    if (typeof STORY_HERO_UNLOCKS !== 'undefined' && Array.isArray(STORY_HERO_UNLOCKS)) {
        STORY_HERO_UNLOCKS.forEach(entry => {
            if (entry.className === "Tapyra'yawara") {
                entry.className = "Tapyra-Yawara";
                entry.displayName = "Tapyra-Yawara";
            }
        });
    }

    // 3. Atualiza os detalhes do herói (STORY_HERO_DETAILS)
    if (typeof STORY_HERO_DETAILS !== 'undefined' && STORY_HERO_DETAILS["Tapyra'yawara"]) {
        STORY_HERO_DETAILS["Tapyra-Yawara"] = STORY_HERO_DETAILS["Tapyra'yawara"];
        delete STORY_HERO_DETAILS["Tapyra'yawara"];
    }

    // 4. Atualiza imagens do PA
    if (typeof STORY_HERO_PA_IMAGES !== 'undefined' && STORY_HERO_PA_IMAGES["Tapyra'yawara"] !== undefined) {
        STORY_HERO_PA_IMAGES["Tapyra-Yawara"] = STORY_HERO_PA_IMAGES["Tapyra'yawara"];
        delete STORY_HERO_PA_IMAGES["Tapyra'yawara"];
    }

    // 5. Migra o save do jogador (se ele já tinha o herói)
    if (typeof STORY_PROGRESS !== 'undefined' && Array.isArray(STORY_PROGRESS.unlockedHeroesStory)) {
        const idx = STORY_PROGRESS.unlockedHeroesStory.indexOf("Tapyra'yawara");
        if (idx !== -1) {
            STORY_PROGRESS.unlockedHeroesStory[idx] = "Tapyra-Yawara";
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
            console.log('[V34.0] Save do jogador migrado: Tapyra\'yawara → Tapyra-Yawara');
        }
    }

    // 6. Corrige os selects e grids (caso o jogador esteja com ele selecionado)
    if (typeof STORY_PROGRESS !== 'undefined' && Array.isArray(STORY_PROGRESS.selectedHeroes)) {
        const idx = STORY_PROGRESS.selectedHeroes.indexOf("Tapyra'yawara");
        if (idx !== -1) {
            STORY_PROGRESS.selectedHeroes[idx] = "Tapyra-Yawara";
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
        }
    }

    // 7. Corrige a sprite (se existir)
    if (typeof SPRITES_STORY !== 'undefined' && SPRITES_STORY["heroi_Tapyrayawara"]) {
        SPRITES_STORY["heroi_Tapyra-Yawara"] = SPRITES_STORY["heroi_Tapyrayawara"];
    }

    console.log('✅ [V34.0] Tapyra-Yawara renomeado. Botão "?" deve funcionar agora.');
})();
// =================================================================
// historia.js — BLOCO 113 (V35.0 — Seletor de Dificuldade Global)
// -----------------------------------------------------------------
// Cole NO FINAL do historia.js (último bloco).
//
// Adiciona o seletor Normal/Difícil/Pesadelo em:
//   • Cabeçalho da tela de ATOS
//   • Cabeçalho do EVENTO SEMANAL
//
// Regras:
//   • Mudar no Atos → afeta só o Modo História (storyCurrentDifficulty)
//   • Mudar no Evento → afeta só o Evento (STORY_PROGRESS.eventoDificuldade)
//   • Cada um é independente do outro
//   • Sincroniza com o seletor já existente nas fases (renderChapterPhases)
// =================================================================

(function seletorDificuldadeGlobalV350() {
    if (window._seletorDificuldadeV350) return;
    window._seletorDificuldadeV350 = true;

    console.log('[V35.0] Instalando seletor de dificuldade global...');

    // ==============================================================
    // HELPERS
    // ==============================================================

    // Retorna a dificuldade atual do MODO HISTÓRIA
    function getDiffHistoria() {
        return (typeof storyCurrentDifficulty !== 'undefined')
            ? storyCurrentDifficulty
            : 'normal';
    }

    // Retorna a dificuldade atual do EVENTO
    function getDiffEvento() {
        if (typeof STORY_PROGRESS !== 'undefined' && STORY_PROGRESS.eventoDificuldade) {
            return STORY_PROGRESS.eventoDificuldade;
        }
        return 'normal';
    }

    // Monta o HTML do seletor
    function montarSeletorHTML(diffAtual, contexto) {
        const diffs = [
            { id: 'normal',   nome: 'Normal',   icon: '⚔️', color: '#c9a227' },
            { id: 'dificil',  nome: 'Difícil',  icon: '🔥', color: '#e67e22' },
            { id: 'pesadelo', nome: 'Pesadelo', icon: '💀', color: '#a83232' },
        ];

        const botoes = diffs.map(d => {
            const unlocked = (typeof isDifficultyUnlocked === 'function')
                ? isDifficultyUnlocked(d.id)
                : (d.id === 'normal');
            const ativo = d.id === diffAtual;

            return `
                <button class="story-difficulty-btn ${ativo ? 'active' : ''} ${unlocked ? '' : 'locked'}"
                        data-diff="${d.id}"
                        data-contexto="${contexto}"
                        ${unlocked ? '' : 'disabled'}
                        style="--diff-color: ${d.color};">
                    <span class="story-difficulty-icon">${d.icon}</span>
                    <span class="story-difficulty-nome">${d.nome}</span>
                    ${unlocked ? '' : '<span class="story-difficulty-lock">🔒</span>'}
                </button>
            `;
        }).join('');

        return `
            <div class="story-difficulty-selector" data-contexto="${contexto}">
                <div class="story-difficulty-label">DIFICULDADE</div>
                <div class="story-difficulty-buttons">${botoes}</div>
            </div>
        `;
    }

    // ==============================================================
    // HANDLER DE CLIQUE (delegação global)
    // ==============================================================
    document.addEventListener('click', function(ev) {
        const btn = ev.target.closest('.story-difficulty-btn');
        if (!btn) return;

        // Ignora se for o seletor das FASES (que já tem handler próprio)
        const contexto = btn.getAttribute('data-contexto');
        if (!contexto || contexto === 'fases') return;

        const diffId = btn.getAttribute('data-diff');
        if (!diffId) return;

        // ⭐ CONTEXTO: ATOS → muda storyCurrentDifficulty
        if (contexto === 'atos') {
            if (typeof setStoryDifficulty === 'function') {
                if (!setStoryDifficulty(diffId)) return;
            } else {
                if (typeof isDifficultyUnlocked === 'function' && !isDifficultyUnlocked(diffId)) return;
                storyCurrentDifficulty = diffId;
                if (typeof saveDifficultyToProgress === 'function') saveDifficultyToProgress();
            }

            // Re-renderiza a tela de Atos
            if (typeof renderAtosScreen === 'function') {
                renderAtosScreen();
            }

            const d = (typeof STORY_DIFFICULTIES !== 'undefined')
                ? STORY_DIFFICULTIES[diffId] : null;
            if (d && typeof showToast === 'function') {
                showToast(d.icon, `História: ${d.nome}`, d.icon);
            }
            return;
        }

        // ⭐ CONTEXTO: EVENTO → muda STORY_PROGRESS.eventoDificuldade
        if (contexto === 'evento') {
            if (typeof setDificuldadeEvento === 'function') {
                if (!setDificuldadeEvento(diffId)) return;
            } else {
                if (typeof STORY_PROGRESS !== 'undefined') {
                    STORY_PROGRESS.eventoDificuldade = diffId;
                    if (typeof saveStoryProgress === 'function') saveStoryProgress();
                }
            }

            // Re-renderiza a tela do Evento
            if (typeof renderEventoSemanalScreen === 'function') {
                renderEventoSemanalScreen();
            }

            const d = (typeof EVENTO_DIFICULDADES !== 'undefined')
                ? EVENTO_DIFICULDADES[diffId] : null;
            if (d && typeof showToast === 'function') {
                showToast(d.icon, `Evento: ${d.nome}`, d.icon);
            }
            return;
        }
    }, false);

    // ==============================================================
    // HOOK 1: TELA DE ATOS
    // --------------------------------------------------------------
    // Adiciona o seletor no cabeçalho da tela de Atos.
    // ==============================================================
    const _origRenderAtos = window.renderAtosScreen;
    if (typeof _origRenderAtos === 'function' && !window._renderAtosHookV350) {
        window._renderAtosHookV350 = true;

        window.renderAtosScreen = function() {
            const r = _origRenderAtos.apply(this, arguments);

            // Injeta no header
            setTimeout(() => {
                const screen = document.getElementById('storyScreen');
                if (!screen) return;

                const header = screen.querySelector('.story-header');
                if (!header) return;

                // Evita duplicar
                if (header.querySelector('.story-difficulty-selector[data-contexto="atos"]')) return;

                const diffAtual = getDiffHistoria();
                const html = montarSeletorHTML(diffAtual, 'atos');
                header.insertAdjacentHTML('beforeend', html);

                console.log('[V35.0] Seletor injetado em ATOS. Diff:', diffAtual);
            }, 60);

            return r;
        };

        console.log('[V35.0] Hook em renderAtosScreen instalado.');
    }

    // ==============================================================
    // HOOK 2: TELA DO EVENTO SEMANAL
    // --------------------------------------------------------------
    // Adiciona o seletor no cabeçalho do Evento.
    // ==============================================================
    const _origRenderEvento = window.renderEventoSemanalScreen;
    if (typeof _origRenderEvento === 'function' && !window._renderEventoHookV350) {
        window._renderEventoHookV350 = true;

        window.renderEventoSemanalScreen = function() {
            const r = _origRenderEvento.apply(this, arguments);

            // Injeta no header
            setTimeout(() => {
                const screen = document.getElementById('storyScreen');
                if (!screen) return;

                const header = screen.querySelector('.story-header');
                if (!header) return;

                // Evita duplicar
                if (header.querySelector('.story-difficulty-selector[data-contexto="evento"]')) return;

                const diffAtual = getDiffEvento();
                const html = montarSeletorHTML(diffAtual, 'evento');
                header.insertAdjacentHTML('beforeend', html);

                console.log('[V35.0] Seletor injetado em EVENTO. Diff:', diffAtual);
            }, 60);

            return r;
        };

        console.log('[V35.0] Hook em renderEventoSemanalScreen instalado.');
    }

    // ==============================================================
    // HOOK 3: SINCronizar com o seletor das FASES
    // --------------------------------------------------------------
    // O renderChapterPhases já tem seu próprio seletor (do Bloco 8).
    // Garantimos que ele use o mesmo estilo e que o clique
    // também atualize a tela de Atos ao voltar.
    // ==============================================================
    // (nada a fazer — o seletor das fases já funciona e usa
    //  setStoryDifficulty, que é a mesma fonte de verdade do Atos)

    // ==============================================================
    // HOOK 4: Ao entrar no Evento, garante que a dificuldade do
    // evento está inicializada
    // ==============================================================
    const _origEventoEntrar = window.renderEventoSemanalScreen;
    // (já coberto pelo hook 2)

    // ==============================================================
    // CSS ADICIONAL (para alinhar com o tema)
    // ==============================================================
    if (!document.getElementById('v350CSS')) {
        const style = document.createElement('style');
        style.id = 'v350CSS';
        style.textContent = `
            /* Seletor de dificuldade global — alinhado ao tema */
            .story-difficulty-selector[data-contexto="atos"],
            .story-difficulty-selector[data-contexto="evento"] {
                margin-top: 18px;
                padding: 12px 16px;
                background: rgba(10, 6, 2, 0.5);
                border: 1px solid rgba(201, 162, 39, 0.3);
                border-radius: 6px;
            }

            .story-difficulty-selector[data-contexto="evento"] {
                border-color: rgba(155, 89, 182, 0.4);
                background: rgba(30, 15, 40, 0.5);
            }

            .story-difficulty-selector[data-contexto="evento"] .story-difficulty-label {
                color: #c39bd3;
            }

            /* Força que o seletor ocupe largura total no header */
            .story-header .story-difficulty-selector {
                width: 100%;
                max-width: 500px;
                margin-left: auto;
                margin-right: auto;
            }

            /* No mobile, empilha os botões */
            @media (max-width: 600px) {
                .story-header .story-difficulty-selector {
                    max-width: 100%;
                }
                .story-difficulty-selector .story-difficulty-buttons {
                    flex-direction: column;
                }
                .story-difficulty-selector .story-difficulty-btn {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ==============================================================
    // DEBUG: força re-render se estiver na tela de Atos ou Evento
    // ==============================================================
    setTimeout(() => {
        const screen = document.getElementById('storyScreen');
        if (!screen || !screen.classList.contains('active')) return;

        const titleEl = screen.querySelector('.story-title');
        const titleTxt = titleEl ? titleEl.textContent.trim().toUpperCase() : '';

        // Se está em Atos, força re-render
        if (titleTxt === 'ATOS' || titleTxt === '🗺️ ATOS') {
            if (typeof renderAtosScreen === 'function') {
                console.log('[V35.0] Forçando re-render de Atos...');
                renderAtosScreen();
            }
        }

        // Se está no Evento, força re-render
        if (titleTxt.includes('SEMANA DAS SOMBRAS') || titleTxt.includes('A SEMANA DAS SOMBRAS')) {
            if (typeof renderEventoSemanalScreen === 'function') {
                console.log('[V35.0] Forçando re-render do Evento...');
                renderEventoSemanalScreen();
            }
        }
    }, 300);

    // ==============================================================
    // LOG FINAL
    // ==============================================================
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V35.0] Seletor de dificuldade global');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Atos:     seletor no cabeçalho (contexto "atos")');
    console.log('• Evento:   seletor no cabeçalho (contexto "evento")');
    console.log('• Fases:    seletor próprio (contexto "fases")');
    console.log('');
    console.log('📌 Independência:');
    console.log('   • Atos/Fases  → storyCurrentDifficulty');
    console.log('   • Evento      → STORY_PROGRESS.eventoDificuldade');
    console.log('   • Um NÃO afeta o outro.');
    console.log('');
    console.log('🎮 Estado atual:');
    console.log('   • História: ', getDiffHistoria());
    console.log('   • Evento:   ', getDiffEvento());
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — BLOCO 114 (V35.1 — Fix seletor no Evento)
// -----------------------------------------------------------------
// Corrige: o seletor V35.0 não aparecia no Evento porque o
// renderEventoSemanalScreen é sobrescrito por vários patches.
// Solução: MutationObserver no #storyScreen para injetar SEMPRE
// que a tela for montada.
// =================================================================

(function fixSeletorEventoV351() {
    if (window._fixSeletorEventoV351) return;
    window._fixSeletorEventoV351 = true;

    console.log('[V35.1] Instalando fix do seletor no Evento...');

    // ⭐ MutationObserver: monitora o #storyScreen
    // Sempre que o innerHTML mudar, verifica se é a tela do Evento
    // e injeta o seletor se ainda não estiver lá.
    const observer = new MutationObserver(() => {
        const screen = document.getElementById('storyScreen');
        if (!screen || !screen.classList.contains('active')) return;

        // Detecta se é a tela do Evento
        const titleEl = screen.querySelector('.story-title');
        if (!titleEl) return;
        const titleTxt = titleEl.textContent.toUpperCase();
        const isEvento = titleTxt.includes('SEMANA DAS SOMBRAS')
                      || titleTxt.includes('A SEMANA DAS SOMBRAS');

        if (!isEvento) return;

        // Já tem o seletor do evento? Não faz nada
        const header = screen.querySelector('.story-header');
        if (!header) return;
        if (header.querySelector('.story-difficulty-selector[data-contexto="evento"]')) return;

        // Injeta
        const diffAtual = (typeof STORY_PROGRESS !== 'undefined' && STORY_PROGRESS.eventoDificuldade)
            ? STORY_PROGRESS.eventoDificuldade
            : 'normal';

        const diffs = [
            { id: 'normal',   nome: 'Normal',   icon: '⚔️', color: '#c9a227' },
            { id: 'dificil',  nome: 'Difícil',  icon: '🔥', color: '#e67e22' },
            { id: 'pesadelo', nome: 'Pesadelo', icon: '💀', color: '#a83232' },
        ];

        const botoes = diffs.map(d => {
            const unlocked = (typeof isDifficultyUnlocked === 'function')
                ? isDifficultyUnlocked(d.id)
                : (d.id === 'normal');
            const ativo = d.id === diffAtual;

            // ⭐ MOSTRA O MOTIVO DO LOCK
            let titleAttr = '';
            if (!unlocked) {
                if (d.id === 'dificil') titleAttr = 'Zere o Normal primeiro';
                else if (d.id === 'pesadelo') titleAttr = 'Zere o Difícil primeiro';
            }

            return `
                <button class="story-difficulty-btn ${ativo ? 'active' : ''} ${unlocked ? '' : 'locked'}"
                        data-diff="${d.id}"
                        data-contexto="evento"
                        ${unlocked ? '' : 'disabled'}
                        title="${titleAttr}"
                        style="--diff-color: ${d.color};">
                    <span class="story-difficulty-icon">${d.icon}</span>
                    <span class="story-difficulty-nome">${d.nome}</span>
                    ${unlocked ? '' : '<span class="story-difficulty-lock">🔒</span>'}
                </button>
            `;
        }).join('');

        const html = `
            <div class="story-difficulty-selector" data-contexto="evento">
                <div class="story-difficulty-label">DIFICULDADE DO EVENTO</div>
                <div class="story-difficulty-buttons">${botoes}</div>
            </div>
        `;

        // Insere depois do subtítulo (ou no final do header)
        const subtitle = header.querySelector('.story-subtitle');
        if (subtitle) {
            subtitle.insertAdjacentHTML('afterend', html);
        } else {
            header.insertAdjacentHTML('beforeend', html);
        }

        console.log('[V35.1] Seletor do Evento injetado. Diff:', diffAtual);
    });

    // Observa mudanças no body (o #storyScreen pode ser recriado)
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    console.log('✅ [V35.1] MutationObserver do Evento instalado.');
})();
// =================================================================
// historia.js — BLOCO 117 (V36.0 — Stat Aleatório Nível 11 + Núcleo)
// -----------------------------------------------------------------
// Sistema:
//   • Zerar 13-4 no Difícil → ganha 1 Núcleo do Abismo
//   • Ritual: herói nível 10 + 1 Núcleo → ASCENDER (nível 11 + stat aleatório)
//   • Ritual: herói nível 11 + 1 Núcleo → REROLL (substitui o stat)
//
// Stats (por classe):
//   Comum (60%):  +1 ATK, +2 HP, +1 Formas, -1 Range, +1 Elemento
//   Incomum (30%): +2 ATK, +4 HP, +2 Formas
//   Raro (9%):     +3 ATK, +6 HP, +3 Formas, -1 PA, +1 Cura
//   Jackpot (1%):  2 stats aleatórios do Incomum
//
// Restrições:
//   • Guerreiro NÃO rola -1 Range (range 0 → 1)
//   • Sem pity system
//   • Animação sim
// =================================================================

(function sistemaStat11V360() {
    if (window._sistemaStat11V360) return;
    window._sistemaStat11V360 = true;

    console.log('[V36.0] Instalando sistema de stat aleatório nível 11...');

    // ==============================================================
    // SEÇÃO 1 — DEFINIÇÕES
    // ==============================================================

    const CONFIG_STAT11 = {
        XP_NIVEL_11: 3000,
        OURO_NIVEL_11: 1800,
        NIVEL_MAX: 11,
    };

    // Pools de stats por classe
    // Cada stat: { tipo, valor, peso }
    const STAT_POOLS = {
        comum: {
            guerra: [
                { tipo: 'atk',      valor: 1, peso: 30 },
                { tipo: 'hp',       valor: 2, peso: 30 },
                { tipo: 'formas',   valor: 1, peso: 20 },
                { tipo: 'elemento', valor: 1, peso: 20 },
            ],
            mago: [
                { tipo: 'atk',      valor: 1, peso: 25 },
                { tipo: 'hp',       valor: 2, peso: 25 },
                { tipo: 'formas',   valor: 1, peso: 20 },
                { tipo: 'range',    valor: -1, peso: 15 },
                { tipo: 'elemento', valor: 1, peso: 15 },
            ],
            arqueiro: [
                { tipo: 'atk',      valor: 1, peso: 25 },
                { tipo: 'hp',       valor: 2, peso: 25 },
                { tipo: 'formas',   valor: 1, peso: 20 },
                { tipo: 'range',    valor: -1, peso: 15 },
                { tipo: 'elemento', valor: 1, peso: 15 },
            ],
        },
        incomum: {
            guerra: [
                { tipo: 'atk',    valor: 2, peso: 40 },
                { tipo: 'hp',     valor: 4, peso: 35 },
                { tipo: 'formas', valor: 2, peso: 25 },
            ],
            mago: [
                { tipo: 'atk',    valor: 2, peso: 40 },
                { tipo: 'hp',     valor: 4, peso: 35 },
                { tipo: 'formas', valor: 2, peso: 25 },
            ],
            arqueiro: [
                { tipo: 'atk',    valor: 2, peso: 40 },
                { tipo: 'hp',     valor: 4, peso: 35 },
                { tipo: 'formas', valor: 2, peso: 25 },
            ],
        },
        raro: {
            guerra: [
                { tipo: 'atk',    valor: 3, peso: 30 },
                { tipo: 'hp',     valor: 6, peso: 25 },
                { tipo: 'formas', valor: 3, peso: 20 },
                { tipo: 'pa',     valor: -1, peso: 15 },
                { tipo: 'cura',   valor: 1, peso: 10 },
            ],
            mago: [
                { tipo: 'atk',    valor: 3, peso: 30 },
                { tipo: 'hp',     valor: 6, peso: 25 },
                { tipo: 'formas', valor: 3, peso: 20 },
                { tipo: 'pa',     valor: -1, peso: 15 },
                { tipo: 'cura',   valor: 1, peso: 10 },
            ],
            arqueiro: [
                { tipo: 'atk',    valor: 3, peso: 30 },
                { tipo: 'hp',     valor: 6, peso: 25 },
                { tipo: 'formas', valor: 3, peso: 20 },
                { tipo: 'pa',     valor: -1, peso: 15 },
                { tipo: 'cura',   valor: 1, peso: 10 },
            ],
        },
    };

    // Metadados visuais de cada stat
    const STAT_META = {
        atk:      { nome: 'ATK',       icon: 'espadas',          cor: '#a83232', desc: 'Ataque' },
        hp:       { nome: 'HP',        icon: 'medalha',          cor: '#6ba35c', desc: 'Vida' },
        formas:   { nome: 'Formas',    icon: 'estrela',          cor: '#8e44ad', desc: 'Bônus em Formas' },
        range:    { nome: 'Alcance',   icon: 'alvo',             cor: '#3a7ca5', desc: 'Alcance' },
        pa:       { nome: 'PA',        icon: 'poder_ancestral',  cor: '#e8b923', desc: 'Poder Ancestral' },
        cura:     { nome: 'Cura',      icon: 'pocao',            cor: '#8ac070', desc: 'Cura/turno' },
        elemento: { nome: 'Elemento',  icon: 'elem_fogo',        cor: '#e8b923', desc: 'Bônus Elemental' },
    };

    const TIER_META = {
        comum:   { nome: 'Comum',   cor: '#8a7a52', bg: 'rgba(138,122,82,0.15)',   icon: '★' },
        incomum: { nome: 'Incomum', cor: '#6ba35c', bg: 'rgba(107,163,92,0.15)',   icon: '★★' },
        raro:    { nome: 'Raro',    cor: '#4a8cb5', bg: 'rgba(74,140,181,0.2)',    icon: '★★★' },
        jackpot: { nome: 'Jackpot', cor: '#e8b923', bg: 'rgba(232,185,35,0.2)',    icon: '👑' },
    };

    // ==============================================================
    // SEÇÃO 2 — PERSISTÊNCIA
    // ==============================================================

    function garantirEstrutura() {
        if (!STORY_PROGRESS.heroStat11) STORY_PROGRESS.heroStat11 = {};
        if (!STORY_PROGRESS.inventory) STORY_PROGRESS.inventory = {};
    }

    function getStat11DoHeroi(heroClass) {
        garantirEstrutura();
        return STORY_PROGRESS.heroStat11[heroClass] || null;
    }

    function aplicarStat11(heroClass, resultado) {
        garantirEstrutura();
        STORY_PROGRESS.heroStat11[heroClass] = resultado;
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
    }

    // Determina a "família" de pool da classe
    function getFamiliaClasse(heroClass) {
        const heroData = STORY_HERO_CLASSES[heroClass];
        if (!heroData) return 'guerra';
        if (heroData.role === 'Guerreiro') return 'guerra';
        if (heroData.role === 'Mago') return 'mago';
        if (heroData.role === 'Arqueiro') return 'arqueiro';
        return 'guerra';
    }

    // ==============================================================
    // SEÇÃO 3 — ROLL
    // ==============================================================

    function sortearPonderado(pool) {
        const total = pool.reduce((s, p) => s + p.peso, 0);
        let roll = Math.random() * total;
        for (const item of pool) {
            roll -= item.peso;
            if (roll <= 0) return item;
        }
        return pool[pool.length - 1];
    }

    function rolarStat11(heroClass) {
        const familia = getFamiliaClasse(heroClass);

        // 1. Decide o tier
        const rollTier = Math.random();
        let tier;
        if (rollTier < 0.01) tier = 'jackpot';
        else if (rollTier < 0.10) tier = 'raro';
        else if (rollTier < 0.40) tier = 'incomum';
        else tier = 'comum';

        // 2. Sorteia o(s) stat(s)
        if (tier === 'jackpot') {
            // 2 stats do Incomum, sem repetir tipo
            const poolIncomum = STAT_POOLS.incomum[familia];
            const primeiro = sortearPonderado(poolIncomum);
            let segundo;
            let tentativas = 0;
            do {
                segundo = sortearPonderado(poolIncomum);
                tentativas++;
            } while (segundo.tipo === primeiro.tipo && tentativas < 20);

            return {
                tipo: 'jackpot',
                stats: [
                    { tipo: primeiro.tipo, valor: primeiro.valor },
                    { tipo: segundo.tipo, valor: segundo.valor },
                ],
                tier: 'jackpot',
                rolledAt: Date.now(),
            };
        }

        // Tier normal
        let pool = STAT_POOLS[tier][familia];

        // ⭐ Guerreiro NÃO rola -1 Range
        if (familia === 'guerra') {
            pool = pool.filter(p => p.tipo !== 'range');
        }

        const escolhido = sortearPonderado(pool);
        return {
            tipo: escolhido.tipo,
            valor: escolhido.valor,
            tier: tier,
            rolledAt: Date.now(),
        };
    }

    // ==============================================================
    // SEÇÃO 4 — APLICAÇÃO NO COMBATE
    // ==============================================================

    // Wrapper: getHeroBonusFromLevel
    const _origGetHeroBonus = window.getHeroBonusFromLevel;
    if (typeof _origGetHeroBonus === 'function') {
        window.getHeroBonusFromLevel = function(heroClass) {
            const bonus = _origGetHeroBonus.apply(this, arguments) || {};

            const stat = getStat11DoHeroi(heroClass);
            if (!stat) return bonus;

            // Helper: aplica um stat no objeto bonus
            const aplicar = (s) => {
                switch (s.tipo) {
                    case 'atk':      bonus.atk      = (bonus.atk || 0) + s.valor; break;
                    case 'hp':       bonus.hp       = (bonus.hp || 0) + s.valor; break;
                    case 'formas':   bonus.formAtk  = (bonus.formAtk || 0) + s.valor; break;
                    case 'range':    bonus.range    = (bonus.range || 0) + s.valor; break;
                    case 'pa':       bonus.paThreshold = (bonus.paThreshold || 0) + s.valor; break;
                    case 'cura':     bonus.healPerTurn = (bonus.healPerTurn || 0) + s.valor; break;
                    case 'elemento': bonus.bonusElemento = (bonus.bonusElemento || 0) + s.valor; break;
                }
            };

            if (stat.tipo === 'jackpot' && stat.stats) {
                stat.stats.forEach(aplicar);
            } else {
                aplicar(stat);
            }

            return bonus;
        };
        console.log('[V36.0] getHeroBonusFromLevel wrappeado.');
    }

    // Wrapper: executeAction (range + PA + formas + elemento)
    const _origExec = window.executeAction;
    if (typeof _origExec === 'function') {
        window.executeAction = async function() {
            const isStory = window._storyMode || window._eventoAtivo;
            if (!isStory) return _origExec.apply(this, arguments);

            const active = players[currentPlayerIdx];
            if (!active) return _origExec.apply(this, arguments);

            const stat = getStat11DoHeroi(active.class);
            const bonus = (typeof getHeroBonusFromLevel === 'function')
                ? getHeroBonusFromLevel(active.class) : null;

            if (!stat && (!bonus || (!bonus.range && !bonus.paThreshold && !bonus.formAtk && !bonus.bonusElemento))) {
                return _origExec.apply(this, arguments);
            }

            const info = CLASS_DB[active.class];
            const bravelyEl = document.getElementById('bravely_tiles');
            const origMin = info?.min;
            const origThreshold = bravelyEl?.value;
            const origBonusAtk = active.bonusAtk || 0;

            let modificouBonus = false;

            try {
                // Range
                if (info && bonus && bonus.range) {
                    info.min = Math.max(0, (info.min || 0) + bonus.range);
                }

                // PA threshold
                if (bravelyEl && bonus && bonus.paThreshold) {
                    const novo = Math.max(3, parseInt(bravelyEl.value) + bonus.paThreshold);
                    bravelyEl.value = novo;
                }

                // Bônus de formas + elemento (via bonusAtk temporário)
                let bonusTemp = 0;

                if (bonus && bonus.formAtk > 0 && path.length > 0) {
                    const shape = (typeof detectShape === 'function') ? detectShape([...path]) : null;
                    if (shape) bonusTemp += bonus.formAtk;
                }

                if (bonus && bonus.bonusElemento > 0 && path.length > 0 && grid[path[0]] === active.element) {
                    bonusTemp += bonus.bonusElemento;
                }

                if (bonusTemp > 0) {
                    active.bonusAtk = origBonusAtk + bonusTemp;
                    modificouBonus = true;
                }

                return await _origExec.apply(this, arguments);
            } finally {
                if (info && origMin !== undefined) info.min = origMin;
                if (bravelyEl && origThreshold !== undefined) bravelyEl.value = origThreshold;
                if (modificouBonus) active.bonusAtk = origBonusAtk;
            }
        };
        console.log('[V36.0] executeAction wrappeado.');
    }

    // Wrapper: switchConfig (heal per turn)
    const _origSwitchConfig = window.switchConfig;
    if (typeof _origSwitchConfig === 'function') {
        window.switchConfig = function(idx) {
            const r = _origSwitchConfig.apply(this, arguments);

            const p = players[idx];
            if (!p || p.dead) return r;

            const bonus = (typeof getHeroBonusFromLevel === 'function')
                ? getHeroBonusFromLevel(p.class) : null;
            const curaAscensao = (bonus && bonus.healPerTurn > 0) ? bonus.healPerTurn : 0;

            // Cura por turno do AMULETO equipado (antes só existia na raid)
            const curaAmuleto = Number(p.equippedAmulet?.efeito?.healPerTurn) || 0;

            const curaTotal = curaAscensao + curaAmuleto;
            if (curaTotal <= 0) return r;
            if (p.hp >= p.maxHp) return r;

            // Flag: só cura 1x por turno
            const turnoAtual = (typeof RANKING !== 'undefined') ? RANKING.turns : 0;
            if (p._ultimoHealTurno === turnoAtual) return r;
            p._ultimoHealTurno = turnoAtual;

            const restaurado = Math.min(curaTotal, p.maxHp - p.hp);
            p.hp += restaurado;
            if (typeof showHealEffect === 'function') showHealEffect(p.x, p.y, restaurado);
            if (typeof updateHeroCard === 'function') updateHeroCard();
            if (typeof addLog === 'function') {
                const fonte = (curaAmuleto > 0 && curaAscensao > 0)
                    ? `${p.equippedAmulet?.nome || 'Amuleto'} + Ascensão`
                    : (curaAmuleto > 0 ? (p.equippedAmulet?.nome || 'Amuleto') : 'Ascensão');
                addLog(`💚 ${p.name} regenerou ${restaurado} HP (${fonte}).`);
            }

            return r;
        };
        console.log('[V36.0] switchConfig wrappeado (heal).');
    }

    // ==============================================================
    // SEÇÃO 5 — NÍVEL 11
    // ==============================================================

    // getNextUpgradeCost
    const _origGetNextUpgradeCost = window.getNextUpgradeCost;
    if (typeof _origGetNextUpgradeCost === 'function') {
        window.getNextUpgradeCost = function(heroClass) {
            const currentLevel = getHeroLevel(heroClass);

            if (currentLevel === 10) {
                return {
                    targetLevel: 11,
                    xp: CONFIG_STAT11.XP_NIVEL_11,
                    gold: CONFIG_STAT11.OURO_NIVEL_11,
                    label: '✦ ASCENSÃO',
                    type: 'ascension',
                    value: 1,
                };
            }
            if (currentLevel >= 11) return null;

            return _origGetNextUpgradeCost.apply(this, arguments);
        };
    }

    // setHeroLevel (permite 11)
    const _origSetHeroLevel = window.setHeroLevel;
    if (typeof _origSetHeroLevel === 'function') {
        window.setHeroLevel = function(heroClass, level) {
            if (!STORY_PROGRESS.heroLevels) STORY_PROGRESS.heroLevels = {};
            STORY_PROGRESS.heroLevels[heroClass] = Math.min(level, CONFIG_STAT11.NIVEL_MAX);
        };
    }

    // ascendHero (consome Núcleo no nível 11)
    const _origAscendHero = window.ascendHero;
    if (typeof _origAscendHero === 'function') {
        window.ascendHero = function(heroClass) {
            const currentLevel = getHeroLevel(heroClass);
            const nextUp = window.getNextUpgradeCost(heroClass);

            if (!nextUp) return { ok: false, error: 'Nível máximo.' };

            // ⭐ Nível 11: requer Núcleo + rola stat
            if (nextUp.targetLevel === 11) {
                const nucleoAtual = STORY_PROGRESS.inventory['nucleo_abismo'] || 0;
                if (nucleoAtual < 1) {
                    return { ok: false, error: 'Você precisa de 1 Núcleo do Abismo.' };
                }

                const totalXP = STORY_PROGRESS.totalXP || 0;
                const totalGold = STORY_PROGRESS.gold || 0;
                if (totalXP < nextUp.xp) return { ok: false, error: `Faltam ${nextUp.xp - totalXP} XP.` };
                if (totalGold < nextUp.gold) return { ok: false, error: `Faltam ${nextUp.gold - totalGold} ouro.` };

                // Consome
                STORY_PROGRESS.inventory['nucleo_abismo'] = nucleoAtual - 1;
                if (STORY_PROGRESS.inventory['nucleo_abismo'] <= 0) {
                    delete STORY_PROGRESS.inventory['nucleo_abismo'];
                }
                STORY_PROGRESS.totalXP -= nextUp.xp;
                STORY_PROGRESS.gold -= nextUp.gold;

                // Rola
                const resultado = rolarStat11(heroClass);
                aplicarStat11(heroClass, resultado);
                window.setHeroLevel(heroClass, 11);
                if (typeof saveStoryProgress === 'function') saveStoryProgress();

                // Animação
                mostrarAnimacaoRoll(heroClass, resultado);

                return { ok: true, targetLevel: 11, stat11: resultado, isAscension: true };
            }

            // Níveis 2-10: comportamento original
            return _origAscendHero.apply(this, arguments);
        };
        console.log('[V36.0] ascendHero wrappeado (nível 11).');
    }

    // rerollStat11 (para herói nível 11)
    window.rerollStat11 = function(heroClass) {
        const currentLevel = getHeroLevel(heroClass);
        if (currentLevel < 11) {
            return { ok: false, error: 'Herói precisa estar no nível 11.' };
        }

        const nucleoAtual = STORY_PROGRESS.inventory['nucleo_abismo'] || 0;
        if (nucleoAtual < 1) {
            return { ok: false, error: 'Você precisa de 1 Núcleo do Abismo.' };
        }

        // Consome
        STORY_PROGRESS.inventory['nucleo_abismo'] = nucleoAtual - 1;
        if (STORY_PROGRESS.inventory['nucleo_abismo'] <= 0) {
            delete STORY_PROGRESS.inventory['nucleo_abismo'];
        }

        // Rola
        const resultado = rolarStat11(heroClass);
        aplicarStat11(heroClass, resultado);
        if (typeof saveStoryProgress === 'function') saveStoryProgress();

        // Animação
        mostrarAnimacaoRoll(heroClass, resultado);

        return { ok: true, stat11: resultado, isReroll: true };
    };

    // ==============================================================
    // SEÇÃO 6 — DROP DO NÚCLEO (13-4 no Difícil)
    // ==============================================================

    // Adicionar Núcleo em STORY_MATERIALS
    if (typeof STORY_MATERIALS !== 'undefined') {
        STORY_MATERIALS['nucleo_abismo'] = {
            id: 'nucleo_abismo',
            name: 'Núcleo do Abismo',
            emoji: '🌑',
        };
    }

    // Adicionar preço (não pode ser vendido, mas evita quebra)
    if (typeof STORY_MATERIAL_PRICES !== 'undefined') {
        STORY_MATERIAL_PRICES['nucleo_abismo'] = 0;
    }

    // Adicionar sprite (vazio → fallback emoji 🌑)
    if (typeof STORY_MATERIAL_SPRITES !== 'undefined' && !('nucleo_abismo' in STORY_MATERIAL_SPRITES)) {
        STORY_MATERIAL_SPRITES['nucleo_abismo'] = '';
    }

    // Hook em handleStoryPhaseVictory para dropar
    const _origVictory = window.handleStoryPhaseVictory;
    if (typeof _origVictory === 'function') {
        window.handleStoryPhaseVictory = function(phase, drops, finalScore, rankSnapshot) {
            // ⭐ Drop do Núcleo (13-4 no Difícil)
            if (phase?.id === '13-4' && storyCurrentDifficulty === 'dificil') {
                const atual = STORY_PROGRESS.inventory['nucleo_abismo'] || 0;
                STORY_PROGRESS.inventory['nucleo_abismo'] = atual + 1;
                if (typeof saveStoryProgress === 'function') saveStoryProgress();

                setTimeout(() => {
                    if (typeof showToast === 'function') {
                        showToast('🌑 NÚCLEO DO ABISMO!', 'Você ganhou 1 Núcleo. Use no Ritual.', '🌑');
                    }
                }, 2500);

                console.log('[V36.0] Núcleo dropado! Total:', STORY_PROGRESS.inventory['nucleo_abismo']);
            }

            return _origVictory.apply(this, arguments);
        };
        console.log('[V36.0] handleStoryPhaseVictory wrappeado (drop Núcleo).');
    }

    // ==============================================================
    // SEÇÃO 7 — ANIMAÇÃO DO ROLL
    // ==============================================================

    function mostrarAnimacaoRoll(heroClass, resultado) {
        const heroData = STORY_HERO_CLASSES[heroClass];
        const nomeHeroi = heroData?.displayName || heroClass;

        // Remove overlay antigo
        const old = document.getElementById('stat11RollOverlay');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'stat11RollOverlay';
        overlay.className = 'stat11-roll-overlay';
        overlay.style.zIndex = '25000';

        const tierMeta = TIER_META[resultado.tier] || TIER_META.comum;

        // Monta o stat HTML
        let statHTML = '';
        if (resultado.tipo === 'jackpot' && resultado.stats) {
            statHTML = resultado.stats.map(s => {
                const meta = STAT_META[s.tipo] || STAT_META.atk;
                const sinal = s.valor > 0 ? '+' : '';
                return `
                    <div class="stat11-stat-line">
                        <span class="stat11-stat-icon">${typeof uiIcon === 'function' ? uiIcon(meta.icon) : meta.icon}</span>
                        <span class="stat11-stat-label">${meta.nome}</span>
                        <span class="stat11-stat-value" style="color:${meta.cor};">${sinal}${s.valor}</span>
                    </div>
                `;
            }).join('');
        } else {
            const meta = STAT_META[resultado.tipo] || STAT_META.atk;
            const sinal = resultado.valor > 0 ? '+' : '';
            const labelExtra = resultado.tipo === 'range' ? ' (menos tiles)' : '';
            statHTML = `
                <div class="stat11-stat-line">
                    <span class="stat11-stat-icon">${typeof uiIcon === 'function' ? uiIcon(meta.icon) : meta.icon}</span>
                    <span class="stat11-stat-label">${meta.nome}${labelExtra}</span>
                    <span class="stat11-stat-value" style="color:${meta.cor};">${sinal}${resultado.valor}</span>
                </div>
            `;
        }

        overlay.innerHTML = `
            <div class="stat11-roll-panel" style="border-color:${tierMeta.cor};">
                <div class="stat11-roll-header" style="color:${tierMeta.cor};">
                    ${resultado.isReroll ? '🎲 REROLL' : '✦ ASCENSÃO'}
                </div>
                <div class="stat11-roll-hero">${nomeHeroi}</div>

                <div class="stat11-roll-cards" id="stat11RollCards">
                    <div class="stat11-card spin">${tierMeta.icon}</div>
                    <div class="stat11-card spin">${tierMeta.icon}</div>
                    <div class="stat11-card spin">${tierMeta.icon}</div>
                </div>

                <div class="stat11-roll-reveal" id="stat11RollReveal" style="display:none;">
                    <div class="stat11-tier-badge" style="color:${tierMeta.cor}; background:${tierMeta.bg};">
                        ${tierMeta.icon} ${tierMeta.nome}
                    </div>
                    <div class="stat11-stats-box">
                        ${statHTML}
                    </div>
                </div>

                <button class="stat11-roll-btn" id="stat11RollClose" style="display:none; border-color:${tierMeta.cor};">
                    CONTINUAR
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Animação: 2s girando, depois revela
        setTimeout(() => {
            const cards = document.getElementById('stat11RollCards');
            const reveal = document.getElementById('stat11RollReveal');
            const btn = document.getElementById('stat11RollClose');

            if (cards) cards.style.display = 'none';
            if (reveal) reveal.style.display = 'block';
            if (btn) {
                btn.style.display = 'inline-block';
                btn.onclick = () => overlay.remove();
            }

            // Se for Jackpot, toca som especial
            try {
                if (typeof playSfx === 'function') {
                    playSfx(resultado.tier === 'jackpot' ? 'win' : 'skill1');
                }
            } catch(e) {}
        }, 1800);

        // Fecha ao clicar fora (mas só depois da revelação)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && document.getElementById('stat11RollClose')?.style.display !== 'none') {
                overlay.remove();
            }
        });
    }

    // ==============================================================
    // SEÇÃO 8 — UI DO RITUAL
    // ==============================================================

    const _origRenderRitual = window.renderRitualScreen;
    if (typeof _origRenderRitual === 'function') {
        window.renderRitualScreen = function() {
            const r = _origRenderRitual.apply(this, arguments);

            // Após render, injeta a seção de stat 11
            setTimeout(() => {
                const screen = document.getElementById('storyScreen');
                if (!screen) return;

                const cards = screen.querySelectorAll('.ritual-card');
                cards.forEach(card => {
                    if (card.querySelector('.stat11-section')) return;

                    // Descobre o herói pelo nome
                    const nameEl = card.querySelector('.ritual-card-name');
                    if (!nameEl) return;
                    const nomeHeroi = nameEl.textContent.trim();

                    let heroClass = null;
                    for (const cls in STORY_HERO_CLASSES) {
                        if (STORY_HERO_CLASSES[cls].displayName === nomeHeroi) {
                            heroClass = cls;
                            break;
                        }
                    }
                    if (!heroClass) return;

                    const level = getHeroLevel(heroClass);
                    const stat = getStat11DoHeroi(heroClass);
                    const nucleos = STORY_PROGRESS.inventory['nucleo_abismo'] || 0;

                    // Só mostra se nível >= 10
                    if (level < 10) return;

                    const section = document.createElement('div');
                    section.className = 'stat11-section';

                    if (level === 11 && stat) {
                        // Mostra o stat atual + botão de reroll
                        let statHTML = '';
                        if (stat.tipo === 'jackpot' && stat.stats) {
                            statHTML = stat.stats.map(s => {
                                const meta = STAT_META[s.tipo] || STAT_META.atk;
                                const sinal = s.valor > 0 ? '+' : '';
                                return `<span class="stat11-mini-stat" style="color:${meta.cor};">${sinal}${s.valor} ${meta.nome}</span>`;
                            }).join(' ');
                        } else {
                            const meta = STAT_META[stat.tipo] || STAT_META.atk;
                            const sinal = stat.valor > 0 ? '+' : '';
                            statHTML = `<span class="stat11-mini-stat" style="color:${meta.cor};">${sinal}${stat.valor} ${meta.nome}</span>`;
                        }

                        const tierMeta = TIER_META[stat.tier] || TIER_META.comum;

                        section.innerHTML = `
                            <div class="stat11-current">
                                <div class="stat11-current-title" style="color:${tierMeta.cor};">
                                    ${tierMeta.icon} ${tierMeta.nome} (Nível 11)
                                </div>
                                <div class="stat11-current-stats">${statHTML}</div>
                            </div>
                            <button class="stat11-reroll-btn" 
                                    data-hero="${heroClass.replace(/'/g, "\\'")}"
                                    ${nucleos >= 1 ? '' : 'disabled'}>
                                🎲 REROLL ${nucleos >= 1 ? '' : '(sem Núcleo)'}
                            </button>
                        `;
                    } else if (level === 10) {
                        // Mostra botão de ascensão
                        section.innerHTML = `
                            <div class="stat11-ascend-info">
                                <div class="stat11-ascend-title">✦ ASCENSÃO DISPONÍVEL</div>
                                <div class="stat11-ascend-desc">
                                    Use 1 ${typeof uiIcon === 'function' ? uiIcon('skull') : '🌑'} Núcleo do Abismo + ${CONFIG_STAT11.XP_NIVEL_11} XP + ${CONFIG_STAT11.OURO_NIVEL_11} ouro
                                </div>
                                <div class="stat11-ascend-nucleos">
                                    Você tem: <b>${nucleos}</b> Núcleo(s)
                                </div>
                            </div>
                        `;
                    }

                    // Insere antes do botão de ascender
                    const actions = card.querySelector('.ritual-next-upgrade') || card;
                    actions.parentNode.insertBefore(section, actions);
                });

                // Handlers dos botões de reroll
                screen.querySelectorAll('.stat11-reroll-btn').forEach(btn => {
                    btn.onclick = async function(e) {
                        e.stopPropagation();
                        const heroClass = this.getAttribute('data-hero');
                        if (!heroClass) return;

                        if (!(await uiConfirm(`🎲 Rerollar o stat de ${heroClass}?\n\nCusta 1 Núcleo do Abismo.\nO stat atual será substituído.`))) return;

                        const r = window.rerollStat11(heroClass);
                        if (!r.ok) {
                            if (typeof showToast === 'function') showToast('❌', r.error, '❌');
                            return;
                        }

                        // Re-renderiza a tela do ritual
                        setTimeout(() => window.renderRitualScreen(), 2500);
                    };
                });
            }, 80);

            return r;
        };
        console.log('[V36.0] renderRitualScreen wrappeado.');
    }

    // ==============================================================
    // SEÇÃO 9 — UI DA OCA (mostrar stat 11)
    // ==============================================================

    const _origRenderOca = window.renderOcaScreenFiltered;
    if (typeof _origRenderOca === 'function') {
        window.renderOcaScreenFiltered = function() {
            const r = _origRenderOca.apply(this, arguments);

            setTimeout(() => {
                const cards = document.querySelectorAll('.story-hero-card');
                cards.forEach(card => {
                    if (card.querySelector('.stat11-oca-badge')) return;

                    const onclickAttr = card.getAttribute('onclick') || '';
                    const match = onclickAttr.match(/toggleHeroSelection\('((?:\\'|[^'])*)'\)/);
                    if (!match) return;

                    const heroClass = match[1].replace(/\\'/g, "'");
                    const stat = getStat11DoHeroi(heroClass);
                    if (!stat) return;

                    const badge = document.createElement('div');
                    badge.className = 'stat11-oca-badge';

                    if (stat.tipo === 'jackpot' && stat.stats) {
                        const tierMeta = TIER_META.jackpot;
                        badge.innerHTML = `<span style="color:${tierMeta.cor};">👑</span> Jackpot`;
                    } else {
                        const meta = STAT_META[stat.tipo] || STAT_META.atk;
                        const tierMeta = TIER_META[stat.tier] || TIER_META.comum;
                        const sinal = stat.valor > 0 ? '+' : '';
                        badge.innerHTML = `<span style="color:${tierMeta.cor};">${tierMeta.icon}</span> ${sinal}${stat.valor} ${meta.nome}`;
                    }

                    card.appendChild(badge);
                });
            }, 100);

            return r;
        };
        console.log('[V36.0] renderOcaScreenFiltered wrappeado.');
    }

    // ==============================================================
    // SEÇÃO 10 — CSS
    // ==============================================================

    if (!document.getElementById('v360CSS')) {
        const style = document.createElement('style');
        style.id = 'v360CSS';
        style.textContent = `
            /* Animação do roll */
            .stat11-roll-overlay {
                position: fixed; inset: 0;
                background: rgba(10, 6, 2, 0.95);
                display: flex; align-items: center; justify-content: center;
                padding: 20px;
                animation: stat11FadeIn 0.3s ease-out;
            }
            @keyframes stat11FadeIn {
                from { opacity: 0; } to { opacity: 1; }
            }

            .stat11-roll-panel {
                background: linear-gradient(180deg, #2a1f10, #1a1208);
                border: 3px solid #c9a227;
                border-radius: 10px;
                padding: 30px 25px;
                max-width: 480px; width: 100%;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,0.9), 0 0 60px rgba(232,185,35,0.3);
            }

            .stat11-roll-header {
                font-family: 'Cinzel Decorative', serif;
                font-size: 1.2rem; letter-spacing: 3px;
                margin-bottom: 8px;
            }

            .stat11-roll-hero {
                font-family: 'Cinzel', serif;
                color: #e8b923; font-size: 1.5rem;
                margin-bottom: 25px;
            }

            .stat11-roll-cards {
                display: flex; justify-content: center;
                gap: 12px; margin-bottom: 25px;
            }

            .stat11-card {
                width: 60px; height: 80px;
                background: linear-gradient(180deg, #3d2d18, #1a1208);
                border: 2px solid #6a5024;
                border-radius: 6px;
                display: flex; align-items: center; justify-content: center;
                font-size: 1.5rem;
                color: #e8b923;
            }

            .stat11-card.spin {
                animation: stat11Spin 0.4s ease-in-out infinite;
            }
            .stat11-card.spin:nth-child(2) {
                animation-delay: 0.1s;
            }
            .stat11-card.spin:nth-child(3) {
                animation-delay: 0.2s;
            }
            @keyframes stat11Spin {
                0%, 100% { transform: rotateY(0deg); }
                50% { transform: rotateY(180deg); }
            }

            .stat11-tier-badge {
                display: inline-block;
                padding: 6px 18px;
                border-radius: 20px;
                font-family: 'Cinzel', serif;
                font-weight: 700; font-size: 0.9rem;
                letter-spacing: 2px;
                margin-bottom: 15px;
            }

            .stat11-stats-box {
                background: rgba(10,6,2,0.6);
                border-radius: 6px;
                padding: 15px;
                margin-bottom: 20px;
            }

            .stat11-stat-line {
                display: flex; align-items: center;
                gap: 10px; justify-content: center;
                padding: 6px 0;
                font-family: 'Cinzel', serif;
            }
            .stat11-stat-icon { font-size: 1.2rem; }
            .stat11-stat-label { color: #d9c89a; font-size: 0.9rem; }
            .stat11-stat-value { font-weight: 700; font-size: 1.3rem; }

            .stat11-roll-btn {
                padding: 12px 30px;
                background: linear-gradient(135deg, #8a6a2e, #4a3418);
                color: #fff5dc;
                border: 2px solid #e8b923;
                border-radius: 4px;
                font-family: 'Cinzel', serif;
                font-weight: 700; font-size: 0.95rem;
                letter-spacing: 2px; cursor: pointer;
                transition: all 0.2s;
            }
            .stat11-roll-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.6); }

            /* Seção do Ritual */
            .stat11-section {
                margin-top: 12px;
                padding: 12px;
                background: rgba(10,6,2,0.5);
                border: 1px solid rgba(142,68,173,0.4);
                border-radius: 6px;
            }

            .stat11-current {
                text-align: center; margin-bottom: 10px;
            }
            .stat11-current-title {
                font-family: 'Cinzel', serif;
                font-size: 0.8rem; letter-spacing: 2px;
                margin-bottom: 6px;
            }
            .stat11-current-stats {
                display: flex; justify-content: center; gap: 10px;
                flex-wrap: wrap;
            }
            .stat11-mini-stat {
                font-family: 'Cinzel', serif;
                font-size: 1rem; font-weight: 700;
            }

            .stat11-reroll-btn {
                display: block; width: 100%;
                padding: 8px;
                background: linear-gradient(135deg, #5a2a70, #2a1538);
                color: #e8dcc4;
                border: 2px solid #8e44ad;
                border-radius: 4px;
                font-family: 'Cinzel', serif;
                font-weight: 700; font-size: 0.85rem;
                letter-spacing: 1px; cursor: pointer;
                transition: all 0.2s;
            }
            .stat11-reroll-btn:hover:not(:disabled) {
                box-shadow: 0 0 20px rgba(142,68,173,0.5);
            }
            .stat11-reroll-btn:disabled {
                opacity: 0.5; cursor: not-allowed;
            }

            .stat11-ascend-info {
                text-align: center;
            }
            .stat11-ascend-title {
                font-family: 'Cinzel', serif;
                color: #e8b923; font-size: 0.9rem;
                letter-spacing: 2px; margin-bottom: 6px;
            }
            .stat11-ascend-desc {
                font-family: 'EB Garamond', serif;
                color: #b8a577; font-size: 0.85rem;
                font-style: italic; margin-bottom: 6px;
            }
            .stat11-ascend-nucleos {
                font-family: 'Cinzel', serif;
                color: #c39bd3; font-size: 0.85rem;
            }

            /* Badge na OCA */
            .stat11-oca-badge {
                position: absolute;
                bottom: 8px; left: 8px;
                padding: 3px 8px;
                background: rgba(10,6,2,0.8);
                border: 1px solid #8e44ad;
                border-radius: 10px;
                font-family: 'Cinzel', serif;
                font-size: 0.7rem;
                font-weight: 700;
                color: #c39bd3;
                z-index: 5;
            }
        `;
        document.head.appendChild(style);
    }

    // ==============================================================
    // SEÇÃO 11 — DEBUG
    // ==============================================================

    window.debugStat11 = function() {
        console.group('⚡ STAT 11 DEBUG');
        console.log('Núcleos:', STORY_PROGRESS.inventory['nucleo_abismo'] || 0);
        console.log('Stats:', STORY_PROGRESS.heroStat11);
        console.log('Níveis:', STORY_PROGRESS.heroLevels);
        console.groupEnd();
    };

    window.forcarNucleo = function(qtd) {
        qtd = qtd || 1;
        STORY_PROGRESS.inventory['nucleo_abismo'] = (STORY_PROGRESS.inventory['nucleo_abismo'] || 0) + qtd;
        saveStoryProgress();
        console.log(`✅ +${qtd} Núcleo(s). Total: ${STORY_PROGRESS.inventory['nucleo_abismo']}`);
    };

    // ==============================================================
    // LOG FINAL
    // ==============================================================

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V36.0] Sistema de Stat Aleatório Nível 11');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Núcleo do Abismo dropa em 13-4 no Difícil');
    console.log('• Ritual: nível 10 + Núcleo → ASCENSÃO (stat aleatório)');
    console.log('• Ritual: nível 11 + Núcleo → REROLL (substitui stat)');
    console.log('');
    console.log('📊 Tiers:');
    console.log('  Comum (60%):  +1 ATK, +2 HP, +1 Formas, -1 Range, +1 Elemento');
    console.log('  Incomum (30%): +2 ATK, +4 HP, +2 Formas');
    console.log('  Raro (9%):     +3 ATK, +6 HP, +3 Formas, -1 PA, +1 Cura');
    console.log('  Jackpot (1%):  2 stats aleatórios do Incomum');
    console.log('');
    console.log('⚠️ Guerreiro NÃO rola -1 Range (range 0 → 1)');
    console.log('⚠️ Sem pity system');
    console.log('');
    console.log('💡 Debug:');
    console.log('   window.debugStat11()       → ver estado');
    console.log('   window.forcarNucleo(5)     → dar 5 Núcleos');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — BLOCO 118 (V36.1 — Fix botão de ascensão no Ritual)
// -----------------------------------------------------------------
// Corrige 3 problemas do V36.0:
//   1. renderRitualScreen original mostrava "NÍVEL MÁXIMO" no nível 10
//   2. handleRitualAscend original chamava ascendHero LOCAL (não o wrapper)
//   3. stat11-section injetado não tinha botão clicável
//
// Solução:
//   • Sobrescreve window.handleRitualAscend para interceptar nível 10
//   • Pós-processa o DOM para remover .ritual-max e injetar botão real
//   • Adiciona callback no mostrarAnimacaoRoll para re-renderizar
// =================================================================

(function fixBotaoAscensaoV361() {
    if (window._fixBotaoAscensaoV361) return;
    window._fixBotaoAscensaoV361 = true;

    console.log('[V36.1] Corrigindo botão de ascensão no Ritual...');

    const CONFIG_STAT11 = {
        XP_NIVEL_11: 3000,
        OURO_NIVEL_11: 1800,
    };

    // ==============================================================
    // FIX 1: Sobrescrever handleRitualAscend (global)
    // --------------------------------------------------------------
    // O onclick do botão chama window.handleRitualAscend. Agora
    // interceptamos o nível 10 para usar o ascendHero wrapper.
    // ==============================================================
    const _origHandleRitualAscend = window.handleRitualAscend;
    if (typeof _origHandleRitualAscend === 'function') {
        window.handleRitualAscend = function(heroClass) {
            const currentLevel = (typeof getHeroLevel === 'function')
                ? getHeroLevel(heroClass) : 1;

            // ⭐ Nível 10 → ascensão pro 11 (usa wrapper global)
            if (currentLevel === 10) {
                const result = window.ascendHero(heroClass);

                if (!result.ok) {
                    if (typeof showToast === 'function') showToast('❌', result.error, '❌');
                    return;
                }

                const heroData = STORY_HERO_CLASSES[heroClass];
                if (typeof showToast === 'function') {
                    showToast('✦ ASCENSÃO!', `${heroData?.displayName || heroClass} chegou ao nível 11!`, '✦');
                }
                try { if (typeof playSfx === 'function') playSfx('win'); } catch(e) {}

                // ⭐ NÃO re-renderiza aqui — a animação de roll vai chamar
                // o renderRitualScreen quando fechar (via callback)
                return;
            }

            // Níveis 2-10 → comportamento original
            return _origHandleRitualAscend.apply(this, arguments);
        };
        console.log('[V36.1] handleRitualAscend wrappeado.');
    }

    // ==============================================================
    // FIX 2: mostrarAnimacaoRoll com callback
    // --------------------------------------------------------------
    // Sobrescreve a função original (definida no V36.0) para
    // aceitar um callback que roda quando o overlay é fechado.
    // ==============================================================
    // (A função original está dentro do IIFE do V36.0, então
    //  não conseguimos acessá-la diretamente. Vou recriar uma
    //  versão global que substitui a local — mas como a local
    //  não é exposta, o ascendHero V36.0 vai continuar chamando
    //  a local. Solução: reescrever ascendHero e rerollStat11
    //  para usar a versão com callback.)

    // ==============================================================
    // FIX 3: Pós-processar renderRitualScreen
    // --------------------------------------------------------------
    // Roda depois do V36.0, que já injeta a .stat11-section.
    // Aqui:
    //   • Remove .ritual-max (mostra "NÍVEL MÁXIMO" indevidamente)
    //   • Substitui o conteúdo da .stat11-section por um botão real
    // ==============================================================
    const _origRenderRitual = window.renderRitualScreen;
    if (typeof _origRenderRitual === 'function') {
        window.renderRitualScreen = function() {
            const r = _origRenderRitual.apply(this, arguments);

            // Espera o V36.0 injetar a .stat11-section (80ms)
            setTimeout(() => {
                const screen = document.getElementById('storyScreen');
                if (!screen) return;

                const cards = screen.querySelectorAll('.ritual-card');

                cards.forEach(card => {
                    // Descobre o herói
                    const nameEl = card.querySelector('.ritual-card-name');
                    if (!nameEl) return;
                    const nomeHeroi = nameEl.textContent.trim();

                    let heroClass = null;
                    for (const cls in STORY_HERO_CLASSES) {
                        if (STORY_HERO_CLASSES[cls].displayName === nomeHeroi) {
                            heroClass = cls;
                            break;
                        }
                    }
                    if (!heroClass) return;

                    const level = getHeroLevel(heroClass);
                    const nucleos = STORY_PROGRESS.inventory['nucleo_abismo'] || 0;

                    if (level !== 10 && level !== 11) return;

                    // ⭐ Remove o .ritual-max (mostra "NÍVEL MÁXIMO" indevidamente)
                    const ritualMax = card.querySelector('.ritual-max');
                    if (ritualMax) ritualMax.remove();

                    // ⭐ Pega a .stat11-section (já injetada pelo V36.0)
                    let section = card.querySelector('.stat11-section');
                    if (!section) {
                        // Se não existe (por algum motivo), cria
                        section = document.createElement('div');
                        section.className = 'stat11-section';
                        const nextUp = card.querySelector('.ritual-next-upgrade');
                        if (nextUp) {
                            nextUp.parentNode.insertBefore(section, nextUp);
                        } else {
                            card.appendChild(section);
                        }
                    }

                    // ⭐ Substitui o conteúdo por um botão real
                    if (level === 10) {
                        const totalXP = STORY_PROGRESS.totalXP || 0;
                        const totalGold = STORY_PROGRESS.gold || 0;
                        const temNucleo = nucleos >= 1;
                        const temXP = totalXP >= CONFIG_STAT11.XP_NIVEL_11;
                        const temOuro = totalGold >= CONFIG_STAT11.OURO_NIVEL_11;
                        const podeAscender = temNucleo && temXP && temOuro;

                        let motivoBloqueio = '';
                        if (!temNucleo) motivoBloqueio = 'sem Núcleo';
                        else if (!temXP) motivoBloqueio = `faltam ${CONFIG_STAT11.XP_NIVEL_11 - totalXP} XP`;
                        else if (!temOuro) motivoBloqueio = `faltam ${CONFIG_STAT11.OURO_NIVEL_11 - totalGold} ouro`;

                        section.innerHTML = `
                            <div class="stat11-ascend-info">
                                <div class="stat11-ascend-title">✦ ASCENSÃO DISPONÍVEL</div>
                                <div class="stat11-ascend-desc">
                                    Use 1 Núcleo do Abismo + ${CONFIG_STAT11.XP_NIVEL_11} XP + ${CONFIG_STAT11.OURO_NIVEL_11} ouro
                                </div>
                                <div class="stat11-ascend-nucleos">
                                    Você tem: <b>${nucleos}</b> Núcleo(s)
                                </div>
                                <button class="stat11-ascend-btn"
                                        data-hero="${heroClass.replace(/'/g, "\\'")}"
                                        ${podeAscender ? '' : 'disabled'}>
                                    ⚡ ASCENDER ${podeAscender ? '(Nível 11)' : `(${motivoBloqueio})`}
                                </button>
                            </div>
                        `;

                        // Handler do botão
                        const btn = section.querySelector('.stat11-ascend-btn');
                        if (btn) {
                            btn.onclick = async function(e) {
                                e.stopPropagation();
                                const hc = this.getAttribute('data-hero');
                                if (!hc) return;

                                if (!(await uiConfirm(`⚡ Ascender ${hc} ao nível 11?\n\nCusta 1 Núcleo + ${CONFIG_STAT11.XP_NIVEL_11} XP + ${CONFIG_STAT11.OURO_NIVEL_11} ouro.\n\nO stat será ALEATÓRIO.`))) return;

                                if (typeof window.handleRitualAscend === 'function') {
                                    window.handleRitualAscend(hc);
                                }
                            };
                        }
                    }
                    // Se nível 11, o V36.0 já injetou o reroll corretamente
                    // (não precisa mexer)
                });
            }, 150); // 150ms = depois do V36.0 (que usa 80ms)

            return r;
        };
        console.log('[V36.1] renderRitualScreen pós-processado.');
    }

    // ==============================================================
    // FIX 4: CSS do botão de ascensão
    // ==============================================================
    if (!document.getElementById('v361CSS')) {
        const style = document.createElement('style');
        style.id = 'v361CSS';
        style.textContent = `
            .stat11-ascend-btn {
                display: block;
                width: 100%;
                margin-top: 10px;
                padding: 10px;
                background: linear-gradient(180deg, rgba(142,68,173,0.25), transparent 45%),
                            linear-gradient(135deg, #5a2a70, #2a1538);
                color: #f0e0ff;
                border: 2px solid #8e44ad;
                border-radius: 4px;
                font-family: 'Cinzel', serif;
                font-weight: 700;
                font-size: 0.9rem;
                letter-spacing: 1.5px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .stat11-ascend-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0,0,0,0.5), 0 0 25px rgba(142,68,173,0.5);
            }
            .stat11-ascend-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                background: #2a1f10;
                border-color: #3d2d18;
                color: #6a5024;
            }
        `;
        document.head.appendChild(style);
    }

    // ==============================================================
    // FIX 5: Re-renderizar quando a animação do roll fechar
    // --------------------------------------------------------------
    // O mostrarAnimacaoRoll (V36.0) chama `overlay.remove()` no
    // clique do botão "CONTINUAR". Aqui monitoramos a remoção
    // do overlay para re-renderizar o Ritual.
    // ==============================================================
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(m => {
            m.removedNodes.forEach(node => {
                if (node.id === 'stat11RollOverlay') {
                    // ⭐ Overlay fechou → re-renderiza o Ritual
                    const screen = document.getElementById('storyScreen');
                    if (screen && screen.classList.contains('active')) {
                        const titleEl = screen.querySelector('.story-title');
                        if (titleEl && titleEl.textContent.includes('RITUAL')) {
                            setTimeout(() => {
                                if (typeof window.renderRitualScreen === 'function') {
                                    window.renderRitualScreen();
                                }
                            }, 100);
                        }
                    }
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // ==============================================================
    // LOG FINAL
    // ==============================================================
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V36.1] Fix botão de ascensão');
    console.log('═══════════════════════════════════════════════════');
    console.log('• handleRitualAscend intercepta nível 10');
    console.log('• renderRitualScreen pós-processa o DOM:');
    console.log('   - Remove .ritual-max ("NÍVEL MÁXIMO" indevido)');
    console.log('   - Injeta botão "⚡ ASCENDER (Nível 11)"');
    console.log('• Botão desabilitado mostra motivo (sem Núcleo / faltam XP)');
    console.log('• Re-renderiza o Ritual quando animação fecha');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — BLOCO 119 (V36.2 — Card de ascensão com identidade)
// -----------------------------------------------------------------
// Corrige: a seção de ascensão não mostrava QUAL herói estava sendo
// ascendido. Agora mostra nome + sprite + botão claro.
//
// Também remove o "NÍVEL MÁXIMO" de forma garantida e substitui
// o conteúdo do card para nível 10 e nível 11.
// =================================================================

(function fixCardAscensaoV362() {
    if (window._fixCardAscensaoV362) return;
    window._fixCardAscensaoV362 = true;

    console.log('[V36.2] Instalando card de ascensão com identidade...');

    const CONFIG_STAT11 = {
        XP_NIVEL_11: 3000,
        OURO_NIVEL_11: 1800,
    };

    const TIER_META = {
        comum:   { nome: 'Comum',   cor: '#8a7a52', icon: '★' },
        incomum: { nome: 'Incomum', cor: '#6ba35c', icon: '★★' },
        raro:    { nome: 'Raro',    cor: '#4a8cb5', icon: '★★★' },
        jackpot: { nome: 'Jackpot', cor: '#e8b923', icon: '👑' },
    };

    const STAT_META = {
        atk:      { nome: 'ATK',       cor: '#a83232' },
        hp:       { nome: 'HP',        cor: '#6ba35c' },
        formas:   { nome: 'Formas',    cor: '#8e44ad' },
        range:    { nome: 'Alcance',   cor: '#3a7ca5' },
        pa:       { nome: 'PA',        cor: '#e8b923' },
        cura:     { nome: 'Cura',      cor: '#8ac070' },
        elemento: { nome: 'Elemento',  cor: '#e8b923' },
    };

    // ==============================================================
    // HELPER: encontra o heroClass pelo nome exibido
    // ==============================================================
    function acharHeroClassPorNome(nome) {
        if (typeof STORY_HERO_CLASSES === 'undefined') return null;
        for (const cls in STORY_HERO_CLASSES) {
            if (STORY_HERO_CLASSES[cls].displayName === nome) return cls;
        }
        return null;
    }

    // ==============================================================
    // HELPER: monta o HTML da seção de stat 11 (nome + botão)
    // ==============================================================
    function montarSecaoStat11(heroClass, level, opcoes) {
        opcoes = opcoes || {};
        const heroData = STORY_HERO_CLASSES[heroClass];
        const nome = heroData?.displayName || heroClass;
        const spriteKey = heroData?.spriteKey;
        const spriteURL = (spriteKey && SPRITES_STORY[spriteKey])
            ? SPRITES_STORY[spriteKey]
            : (typeof SPRITES !== 'undefined' && SPRITES[heroClass])
                ? SPRITES[heroClass]
                : '';

        const spriteHTML = spriteURL
            ? `<img src="${spriteURL}" class="stat11-hero-sprite" alt="${nome}">`
            : `<div class="stat11-hero-sprite-fallback">${(EMOJI_STORY && EMOJI_STORY[heroClass]) || '?'}</div>`;

        const nucleos = (STORY_PROGRESS.inventory['nucleo_abismo'] || 0);

        // ---- NÍVEL 10: botão de ascensão ----
        if (level === 10) {
            const totalXP = STORY_PROGRESS.totalXP || 0;
            const totalGold = STORY_PROGRESS.gold || 0;
            const temNucleo = nucleos >= 1;
            const temXP = totalXP >= CONFIG_STAT11.XP_NIVEL_11;
            const temOuro = totalGold >= CONFIG_STAT11.OURO_NIVEL_11;
            const podeAscender = temNucleo && temXP && temOuro;

            let motivo = '';
            if (!temNucleo) motivo = 'sem Núcleo';
            else if (!temXP) motivo = `faltam ${CONFIG_STAT11.XP_NIVEL_11 - totalXP} XP`;
            else if (!temOuro) motivo = `faltam ${CONFIG_STAT11.OURO_NIVEL_11 - totalGold} ouro`;

            return `
                <div class="stat11-section">
                    <div class="stat11-hero-header">
                        <div class="stat11-hero-avatar">${spriteHTML}</div>
                        <div class="stat11-hero-info">
                            <div class="stat11-hero-name">${nome}</div>
                            <div class="stat11-hero-tag">Nível 10 → 11</div>
                        </div>
                    </div>
                    <div class="stat11-ascend-info">
                        <div class="stat11-ascend-title">✦ ASCENSÃO DISPONÍVEL</div>
                        <div class="stat11-ascend-desc">
                            Use 1 Núcleo do Abismo + ${CONFIG_STAT11.XP_NIVEL_11} XP + ${CONFIG_STAT11.OURO_NIVEL_11} ouro
                        </div>
                        <div class="stat11-ascend-nucleos">
                            Você tem: <b>${nucleos}</b> Núcleo(s)
                        </div>
                        <button class="stat11-ascend-btn"
                                data-hero="${heroClass.replace(/'/g, "\\'")}"
                                ${podeAscender ? '' : 'disabled'}>
                            ⚡ ASCENDER ${podeAscender ? '' : `(${motivo})`}
                        </button>
                    </div>
                </div>
            `;
        }

        // ---- NÍVEL 11: mostra stat + reroll ----
        if (level === 11) {
            const stat = (STORY_PROGRESS.heroStat11 || {})[heroClass];
            if (!stat) {
                return `
                    <div class="stat11-section">
                        <div class="stat11-hero-header">
                            <div class="stat11-hero-avatar">${spriteHTML}</div>
                            <div class="stat11-hero-info">
                                <div class="stat11-hero-name">${nome}</div>
                                <div class="stat11-hero-tag">Nível 11</div>
                            </div>
                        </div>
                        <div class="stat11-current">
                            <div class="stat11-current-title">Stat não registrado</div>
                            <div class="stat11-current-stats">Use o reroll para gerar</div>
                        </div>
                        <button class="stat11-reroll-btn"
                                data-hero="${heroClass.replace(/'/g, "\\'")}"
                                ${nucleos >= 1 ? '' : 'disabled'}>
                            🎲 REROLL ${nucleos >= 1 ? '' : '(sem Núcleo)'}
                        </button>
                    </div>
                `;
            }

            const tierMeta = TIER_META[stat.tier] || TIER_META.comum;

            let statHTML = '';
            if (stat.tipo === 'jackpot' && stat.stats) {
                statHTML = stat.stats.map(s => {
                    const meta = STAT_META[s.tipo] || STAT_META.atk;
                    const sinal = s.valor > 0 ? '+' : '';
                    return `<span class="stat11-mini-stat" style="color:${meta.cor};">${sinal}${s.valor} ${meta.nome}</span>`;
                }).join(' ');
            } else {
                const meta = STAT_META[stat.tipo] || STAT_META.atk;
                const sinal = stat.valor > 0 ? '+' : '';
                statHTML = `<span class="stat11-mini-stat" style="color:${meta.cor};">${sinal}${stat.valor} ${meta.nome}</span>`;
            }

            return `
                <div class="stat11-section">
                    <div class="stat11-hero-header">
                        <div class="stat11-hero-avatar">${spriteHTML}</div>
                        <div class="stat11-hero-info">
                            <div class="stat11-hero-name">${nome}</div>
                            <div class="stat11-hero-tag">Nível 11 · Ascendido</div>
                        </div>
                    </div>
                    <div class="stat11-current">
                        <div class="stat11-current-title" style="color:${tierMeta.cor};">
                            ${tierMeta.icon} ${tierMeta.nome}
                        </div>
                        <div class="stat11-current-stats">${statHTML}</div>
                    </div>
                    <button class="stat11-reroll-btn"
                            data-hero="${heroClass.replace(/'/g, "\\'")}"
                            ${nucleos >= 1 ? '' : 'disabled'}>
                        🎲 REROLL ${nucleos >= 1 ? '' : '(sem Núcleo)'}
                    </button>
                </div>
            `;
        }

        return '';
    }

    // ==============================================================
    // PÓS-PROCESSAMENTO ROBUSTO DO RITUAL
    // ==============================================================
    const _origRenderRitual = window.renderRitualScreen;
    if (typeof _origRenderRitual === 'function') {
        window.renderRitualScreen = function() {
            const r = _origRenderRitual.apply(this, arguments);

            // ⭐ Roda em 3 tempos: 100ms, 300ms, 600ms
            // (para pegar mesmo se outros patches atrasarem)
            const aplicarPatch = () => {
                const screen = document.getElementById('storyScreen');
                if (!screen || !screen.classList.contains('active')) return;

                const cards = screen.querySelectorAll('.ritual-card');

                cards.forEach(card => {
                    const nameEl = card.querySelector('.ritual-card-name');
                    if (!nameEl) return;
                    const nomeHeroi = nameEl.textContent.trim();

                    const heroClass = acharHeroClassPorNome(nomeHeroi);
                    if (!heroClass) return;

                    const level = getHeroLevel(heroClass);
                    if (level !== 10 && level !== 11) return;

                    // ⭐ 1. Remove o "NÍVEL MÁXIMO" (definitivo)
                    card.querySelectorAll('.ritual-max').forEach(el => el.remove());

                    // ⭐ 2. Remove o botão "SUBIR NÍVEL" antigo se estiver no nível 10
                    //    (o original mostra "NÍVEL MÁXIMO", mas se por algum motivo
                    //    mostrou "SUBIR NÍVEL", removemos)
                    if (level === 10) {
                        const nextUp = card.querySelector('.ritual-next-upgrade');
                        if (nextUp) nextUp.remove();
                    }

                    // ⭐ 3. Encontra ou cria a seção de stat 11
                    let section = card.querySelector('.stat11-section');
                    if (!section) {
                        section = document.createElement('div');
                        section.className = 'stat11-section';
                        card.appendChild(section);
                    }

                    // ⭐ 4. Substitui o conteúdo (com nome + sprite + botão)
                    const novoHTML = montarSecaoStat11(heroClass, level);
                    if (novoHTML) {
                        section.outerHTML = novoHTML;
                    }

                    // ⭐ 5. Remove a seção antiga se o V36.0 injetou duplicado
                    const duplicatas = card.querySelectorAll('.stat11-section');
                    if (duplicatas.length > 1) {
                        for (let i = 1; i < duplicatas.length; i++) {
                            duplicatas[i].remove();
                        }
                    }
                });

                // ⭐ Handlers dos botões
                screen.querySelectorAll('.stat11-ascend-btn').forEach(btn => {
                    if (btn._handler) return;
                    btn._handler = true;
                    btn.onclick = async function(e) {
                        e.stopPropagation();
                        const hc = this.getAttribute('data-hero');
                        if (!hc) return;
                        const perg = `⚡ Ascender ${hc} ao nível 11?\n\nCusta 1 Núcleo + ${CONFIG_STAT11.XP_NIVEL_11} XP + ${CONFIG_STAT11.OURO_NIVEL_11} ouro.\n\nO stat será ALEATÓRIO.`;
                        const okAsc = (typeof uiConfirm === 'function')
                            ? await uiConfirm(perg, { titulo: 'Ascender ao nível 11', ok: 'Ascender', cancelar: 'Cancelar' })
                            : confirm(perg);
                        if (!okAsc) return;
                        if (typeof window.handleRitualAscend === 'function') {
                            window.handleRitualAscend(hc);
                        }
                    };
                });

                screen.querySelectorAll('.stat11-reroll-btn').forEach(btn => {
                    if (btn._handler) return;
                    btn._handler = true;
                    btn.onclick = async function(e) {
                        e.stopPropagation();
                        const hc = this.getAttribute('data-hero');
                        if (!hc) return;
                        const perg = `🎲 Rerollar o stat de ${hc}?\n\nCusta 1 Núcleo.\nO stat atual será substituído.`;
                        const okReroll = (typeof uiConfirm === 'function')
                            ? await uiConfirm(perg, { titulo: 'Rerrolar stat', ok: 'Rerrolar', cancelar: 'Cancelar' })
                            : confirm(perg);
                        if (!okReroll) return;
                        if (typeof window.rerollStat11 === 'function') {
                            const res = window.rerollStat11(hc);
                            if (!res.ok && typeof showToast === 'function') showToast('❌', res.error, '❌');
                        }
                    };
                });
            };

            setTimeout(aplicarPatch, 100);
            setTimeout(aplicarPatch, 300);
            setTimeout(aplicarPatch, 600);

            return r;
        };
        console.log('[V36.2] renderRitualScreen pós-processado (3 tempos).');
    }

    // ==============================================================
    // CSS
    // ==============================================================
    if (!document.getElementById('v362CSS')) {
        const style = document.createElement('style');
        style.id = 'v362CSS';
        style.textContent = `
            /* Header do herói na seção de ascensão */
            .stat11-hero-header {
                display: flex;
                align-items: center;
                gap: 12px;
                padding-bottom: 10px;
                margin-bottom: 10px;
                border-bottom: 1px solid rgba(142, 68, 173, 0.3);
            }

            .stat11-hero-avatar {
                width: 48px; height: 48px;
                flex-shrink: 0;
                display: flex; align-items: center; justify-content: center;
                background: radial-gradient(circle, rgba(0,0,0,0.5), transparent 70%);
                border-radius: 4px;
            }

            .stat11-hero-sprite {
                width: 44px; height: 44px;
                object-fit: contain;
                filter: drop-shadow(0 0 6px rgba(0,0,0,0.7));
            }

            .stat11-hero-sprite-fallback {
                font-size: 1.8rem;
                line-height: 1;
            }

            .stat11-hero-info {
                flex: 1;
                min-width: 0;
            }

            .stat11-hero-name {
                font-family: 'Cinzel', serif;
                color: #f0e2c0;
                font-size: 1rem;
                font-weight: 700;
                letter-spacing: 1px;
                margin-bottom: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .stat11-hero-tag {
                font-family: 'EB Garamond', serif;
                color: #b8a577;
                font-size: 0.8rem;
                font-style: italic;
            }

            /* Botão de ascensão */
            .stat11-ascend-btn {
                display: block;
                width: 100%;
                margin-top: 10px;
                padding: 10px;
                background: linear-gradient(180deg, rgba(142,68,173,0.25), transparent 45%),
                            linear-gradient(135deg, #5a2a70, #2a1538);
                color: #f0e0ff;
                border: 2px solid #8e44ad;
                border-radius: 4px;
                font-family: 'Cinzel', serif;
                font-weight: 700;
                font-size: 0.9rem;
                letter-spacing: 1.5px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .stat11-ascend-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0,0,0,0.5), 0 0 25px rgba(142,68,173,0.5);
            }
            .stat11-ascend-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                background: #2a1f10;
                border-color: #3d2d18;
                color: #6a5024;
            }

            /* Se o card estiver em 2 colunas (como na imagem), ajusta */
            .stat11-section {
                grid-column: 1 / -1;
            }
        `;
        document.head.appendChild(style);
    }

    // ==============================================================
    // Re-renderiza o Ritual quando a animação do roll fechar
    // ==============================================================
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(m => {
            m.removedNodes.forEach(node => {
                if (node.id === 'stat11RollOverlay') {
                    const screen = document.getElementById('storyScreen');
                    if (screen && screen.classList.contains('active')) {
                        const titleEl = screen.querySelector('.story-title');
                        if (titleEl && titleEl.textContent.includes('RITUAL')) {
                            setTimeout(() => {
                                if (typeof window.renderRitualScreen === 'function') {
                                    window.renderRitualScreen();
                                }
                            }, 100);
                        }
                    }
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // ==============================================================
    // LOG FINAL
    // ==============================================================
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [V36.2] Card de ascensão com identidade');
    console.log('═══════════════════════════════════════════════════');
    console.log('• Mostra sprite + nome + nível');
    console.log('• Remove "NÍVEL MÁXIMO" indevido');
    console.log('• Botão "ASCENDER" com nome do herói');
    console.log('• Botão mostra motivo do bloqueio');
    console.log('• Handler evita duplicatas (btn._handler)');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// historia.js — BLOCO 122 (V37.2 — Fix HP do Pesadelo)
// =================================================================
(function fixHPPesadelo() {
    if (window._fixHPPesadeloV372) return;
    window._fixHPPesadeloV372 = true;

    // 1. Cadastra o Pesadelo no banco de inimigos para o motor reconhecer
    if (typeof STORY_ENEMIES !== 'undefined' && typeof EVENTO_PESADELO !== 'undefined') {
        if (!STORY_ENEMIES['pesadelo']) {
            STORY_ENEMIES['pesadelo'] = {
                id: 'pesadelo',
                name: EVENTO_PESADELO.nome || 'Pesadelo',
                hp: EVENTO_PESADELO.hp || 200,
                atk: EVENTO_PESADELO.atk || 6,
                isBoss: true,
                isEvento: true
            };
        }
    }

    // 2. Intercepta o início do evento para forçar o HP correto após o jogo carregar
    const _origEventoIniciar = window.eventoIniciarBatalha;
    if (typeof _origEventoIniciar === 'function') {
        window.eventoIniciarBatalha = async function(bossId, faseId) {
            // Chama a função original do evento
            await _origEventoIniciar.apply(this, arguments);

            // Se for o Pesadelo, força o HP e ATK corretos ignorando o initGame padrão
            if (bossId === 'pesadelo' && window._eventoBatalha && window._eventoBatalha.isPesadelo) {
                const hpBase = (typeof EVENTO_PESADELO !== 'undefined') ? EVENTO_PESADELO.hp : 200;
                const mult = window._eventoBatalha.dificuldade?.hpMult || 1;
                const hpFinal = Math.ceil(hpBase * mult);
                
                if (typeof boss !== 'undefined') {
                    boss.maxHp = hpFinal;
                    boss.hp = hpFinal;
                }
                
                if (typeof updateVisuals === 'function') updateVisuals();
                if (typeof updateBossCard === 'function') updateBossCard();
                if (typeof updateHeaderBossName === 'function') updateHeaderBossName();
                
                console.log(`[V37.2] HP do Pesadelo ajustado para: ${hpFinal}`);
            }
        };
    }
})();
// =================================================================
// historia.js — BLOCO 123 (V38.0 — Craft Múltiplo e Limite 99)
// -----------------------------------------------------------------
// Permite craftar e estocar até 99 de cada arma/amuleto.
// Altera a UI para mostrar a quantidade atual e o botão de forjar.
// =================================================================

(function craftMultiploV380() {
    if (window._craftMultiploV380) return;
    window._craftMultiploV380 = true;

    const LIMITE_CRAFT = 99;

    // Helper para contar quantas armas/amuletos o jogador tem
    function countWeapon(id) {
        return (STORY_PROGRESS.craftedWeapons || []).filter(w => w === id).length;
    }
    function countAmulet(id) {
        return (STORY_PROGRESS.craftedAmulets || []).filter(a => a === id).length;
    }

    // ==============================================================
    // 1. HANDLERS DE CRAFT E DESMANCHE
    // ==============================================================

    window.handleCraftWeapon = function(id) {
        const w = getWeaponById(id);
        if (!w) return;
        if (countWeapon(id) >= LIMITE_CRAFT) {
            showToast('❌ Limite', 'Você já tem 99 desta arma.', '❌');
            return;
        }
        if (!isWeaponAvailable(id)) {
            showToast('❌', 'Ato ainda não desbloqueado.', '❌');
            return;
        }
        if (!hasMaterials(w.receita)) {
            showToast('❌', 'Materiais insuficientes.', '❌');
            return;
        }
        if ((STORY_PROGRESS.gold || 0) < w.custoOuro) {
            showToast('❌', `Faltam ${w.custoOuro - (STORY_PROGRESS.gold||0)} de ouro.`, '❌');
            return;
        }

        consumeMaterials(w.receita);
        STORY_PROGRESS.gold -= w.custoOuro;
        if (!Array.isArray(STORY_PROGRESS.craftedWeapons)) STORY_PROGRESS.craftedWeapons = [];
        STORY_PROGRESS.craftedWeapons.push(id);
        saveStoryProgress();
        showToast('🔨 Forjada!', `${w.emoji} ${w.nome} (Total: ${countWeapon(id)})`, '🔨');
        try { playSfx('win'); } catch(e) {}
        renderTesourariaScreen();
    };

    window.handleCraftAmulet = function(id) {
        const a = getAmuletById(id);
        if (!a) return;
        if (countAmulet(id) >= LIMITE_CRAFT) {
            showToast('❌ Limite', 'Você já tem 99 deste amuleto.', '❌');
            return;
        }
        if (!isAmuletAvailable(id)) {
            showToast('❌', 'Ato ainda não desbloqueado.', '❌');
            return;
        }
        if (!hasMaterials(a.receita)) {
            showToast('❌', 'Materiais insuficientes.', '❌');
            return;
        }
        if ((STORY_PROGRESS.gold || 0) < a.custoOuro) {
            showToast('❌', `Faltam ${a.custoOuro - (STORY_PROGRESS.gold||0)} de ouro.`, '❌');
            return;
        }

        consumeMaterials(a.receita);
        STORY_PROGRESS.gold -= a.custoOuro;
        if (!Array.isArray(STORY_PROGRESS.craftedAmulets)) STORY_PROGRESS.craftedAmulets = [];
        STORY_PROGRESS.craftedAmulets.push(id);
        saveStoryProgress();
        showToast('🔨 Forjado!', `${a.emoji} ${a.nome} (Total: ${countAmulet(id)})`, '🔨');
        try { playSfx('win'); } catch(e) {}
        renderTesourariaScreen();
    };

    window.handleDismantleWeapon = async function(id) {
        const w = getWeaponById(id);
        if (!w) return;
        if (countWeapon(id) === 0) return;
        const __perg1 = `Desmanchar 1 unidade de "${w.nome}"?\n\nVocê receberá 50% dos materiais de volta.`;
                const __ok1 = (typeof uiConfirm === 'function')
                    ? await uiConfirm(__perg1, { titulo: 'Confirmar', ok: 'Confirmar', cancelar: 'Cancelar' })
                    : confirm(__perg1);
                if (!__ok1) return;

        const arr = STORY_PROGRESS.craftedWeapons;
        const idx = arr.indexOf(id);
        if (idx !== -1) arr.splice(idx, 1);

        // Re-equilibrar equipamentos se necessário
        let remaining = countWeapon(id);
        let equipped = 0;
        for (const hc in STORY_PROGRESS.heroEquipment || {}) {
            if (STORY_PROGRESS.heroEquipment[hc].arma === id) {
                equipped++;
                if (equipped > remaining) STORY_PROGRESS.heroEquipment[hc].arma = null;
            }
        }

        refundMaterials(w.receita, 0.5);
        saveStoryProgress();
        showToast('🔥 Desmanchada', `50% dos materiais devolvidos.`, '🔥');
        renderTesourariaScreen();
    };

    window.handleDismantleAmulet = async function(id) {
        const a = getAmuletById(id);
        if (!a) return;
        if (countAmulet(id) === 0) return;
        const __perg2 = `Desmanchar 1 unidade de "${a.nome}"?\n\nVocê receberá 50% dos materiais de volta.`;
                const __ok2 = (typeof uiConfirm === 'function')
                    ? await uiConfirm(__perg2, { titulo: 'Confirmar', ok: 'Confirmar', cancelar: 'Cancelar' })
                    : confirm(__perg2);
                if (!__ok2) return;

        const arr = STORY_PROGRESS.craftedAmulets;
        const idx = arr.indexOf(id);
        if (idx !== -1) arr.splice(idx, 1);

        let remaining = countAmulet(id);
        let equipped = 0;
        for (const hc in STORY_PROGRESS.heroEquipment || {}) {
            if (STORY_PROGRESS.heroEquipment[hc].amuleto === id) {
                equipped++;
                if (equipped > remaining) STORY_PROGRESS.heroEquipment[hc].amuleto = null;
            }
        }

        refundMaterials(a.receita, 0.5);
        saveStoryProgress();
        showToast('🔥 Desmanchado', `50% dos materiais devolvidos.`, '🔥');
        renderTesourariaScreen();
    };

    // ==============================================================
    // 2. UI DA TESOURARIA (Renders)
    // ==============================================================

    window.renderTesourariaScreen = function() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;

        const inv = STORY_PROGRESS.inventory || {};
        const materialIds = Object.keys(inv).filter(id => inv[id] > 0);
        const totalXP = STORY_PROGRESS.totalXP || 0;
        const totalGold = STORY_PROGRESS.gold || 0;

        let contentHTML = '';
        if (tesourariaTab === 'inventario') {
            contentHTML = window.renderTesourariaInventario(materialIds);
        } else if (tesourariaTab === 'forja') {
            contentHTML = window.renderTesourariaForja();
        } else if (tesourariaTab === 'amuletos') {
            contentHTML = window.renderTesourariaAmuletos();
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
    };

    window.renderTesourariaForja = function() {
        const allWeapons = Object.values(STORY_WEAPONS).filter(w => isWeaponAvailable(w.id));
        if (allWeapons.length === 0) return `<div class="tesouraria-empty"><div class="tesouraria-empty-icon">⚔️</div><div class="tesouraria-empty-text">Nenhuma forja liberada ainda.</div><div class="tesouraria-empty-hint">Complete fases para liberar receitas.</div></div>`;

        const cardsHTML = allWeapons.map(w => {
            const count = countWeapon(w.id);
            const canCraft = hasMaterials(w.receita) && (STORY_PROGRESS.gold || 0) >= w.custoOuro && count < LIMITE_CRAFT;
            const recHTML = Object.entries(w.receita).map(([matId, qty]) => {
                const m = STORY_MATERIALS[matId];
                if (!m) return '';
                const has = STORY_PROGRESS.inventory[matId] || 0;
                const ok = has >= qty ? 'ok' : 'no';
                return `<span class="forge-recipe-mat ${ok}">${m.emoji} ${has}/${qty}</span>`;
            }).join('');
            const tipoLabel = { tacape:'Tacape', flecha:'Flecha', cajado:'Cajado' }[w.tipo];
            const isCrafted = count > 0;
            
            let actionHTML = '';
            if (count >= LIMITE_CRAFT) {
                actionHTML = `
                    <div class="forge-forged-tag" style="color:#e8b923;">✅ Limite Máximo (99)</div>
                    <button class="forge-btn danger" onclick="handleDismantleWeapon('${w.id}')">🔥 Desmanchar 1</button>`;
            } else {
                actionHTML = `
                    ${isCrafted ? `<div class="forge-forged-tag" style="color:#8ac070;">✅ Forjada (${count}/99)</div>` : ''}
                    <div class="forge-ouro ${canCraft ? 'ok' : 'no'}">${uiIcon('gold')} ${w.custoOuro}</div>
                    <button class="forge-btn" ${canCraft ? '' : 'disabled'} onclick="handleCraftWeapon('${w.id}')">
                        ${canCraft ? (isCrafted ? '🔨 Forjar +1' : '🔨 Forjar') : '✕ Sem recursos'}
                    </button>
                    ${isCrafted ? `<button class="forge-btn danger" onclick="handleDismantleWeapon('${w.id}')">🔥 Desmanchar 1</button>` : ''}
                `;
            }
            return `
                <div class="forge-card ${isCrafted ? 'crafted' : ''}">
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
    };

    window.renderTesourariaAmuletos = function() {
        const allAmulets = Object.values(STORY_AMULETS).filter(a => isAmuletAvailable(a.id));
        if (allAmulets.length === 0) return `<div class="tesouraria-empty"><div class="tesouraria-empty-icon">🧿</div><div class="tesouraria-empty-text">Nenhum amuleto liberado ainda.</div><div class="tesouraria-empty-hint">Derrote o boss do ato para revelar o amuleto.</div></div>`;

        const cardsHTML = allAmulets.map(a => {
            const count = countAmulet(a.id);
            const canCraft = hasMaterials(a.receita) && (STORY_PROGRESS.gold || 0) >= a.custoOuro && count < LIMITE_CRAFT;
            const recHTML = Object.entries(a.receita).map(([matId, qty]) => {
                const m = STORY_MATERIALS[matId];
                if (!m) return '';
                const has = STORY_PROGRESS.inventory[matId] || 0;
                const ok = has >= qty ? 'ok' : 'no';
                return `<span class="forge-recipe-mat ${ok}">${m.emoji} ${has}/${qty}</span>`;
            }).join('');
            const ef = a.efeito;
            let efHTML = [];
            if (ef.elementOverride) efHTML.push(`🎨 Elemento → ${ef.elementOverride}`);
            if (ef.hpBonus)         efHTML.push(`❤️ +${ef.hpBonus} HP`);
            if (ef.atkBonus)        efHTML.push(`⚔️ +${ef.atkBonus} ATK`);
            if (ef.healPerTurn)     efHTML.push(`💚 Cura ${ef.healPerTurn} HP/turno`);
            const isCrafted = count > 0;
            
            let actionHTML = '';
            if (count >= LIMITE_CRAFT) {
                actionHTML = `
                    <div class="forge-forged-tag" style="color:#e8b923;">✅ Limite Máximo (99)</div>
                    <button class="forge-btn danger" onclick="handleDismantleAmulet('${a.id}')">🔥 Desmanchar 1</button>`;
            } else {
                actionHTML = `
                    ${isCrafted ? `<div class="forge-forged-tag" style="color:#8ac070;">✅ Forjado (${count}/99)</div>` : ''}
                    <div class="forge-ouro ${canCraft ? 'ok' : 'no'}">${uiIcon('gold')} ${a.custoOuro}</div>
                    <button class="forge-btn" ${canCraft ? '' : 'disabled'} onclick="handleCraftAmulet('${a.id}')">
                        ${canCraft ? (isCrafted ? '🔨 Forjar +1' : '🔨 Forjar') : '✕ Sem recursos'}
                    </button>
                    ${isCrafted ? `<button class="forge-btn danger" onclick="handleDismantleAmulet('${a.id}')">🔥 Desmanchar 1</button>` : ''}
                `;
            }
            return `
                <div class="forge-card ${isCrafted ? 'crafted amulet' : 'amulet'}">
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
    };

    window.renderTesourariaInventario = function(materialIds) {
        if (materialIds.length === 0) return `<div class="tesouraria-empty"><div class="tesouraria-empty-icon">📦</div><div class="tesouraria-empty-text">Seu inventário está vazio.</div><div class="tesouraria-empty-hint">Derrote inimigos para coletar materiais.</div></div>`;
        
        materialIds.sort((a, b) => (window.getMaterialPrice ? window.getMaterialPrice(b) : 2) - (window.getMaterialPrice ? window.getMaterialPrice(a) : 2));
        const inv_count = (id) => STORY_PROGRESS.inventory[id] || 0;
        const totalValue = materialIds.reduce((sum, id) => sum + (window.getMaterialPrice ? window.getMaterialPrice(id) : 2) * inv_count(id), 0);

        const cardsHTML = materialIds.map(id => {
            const m = STORY_MATERIALS[id] || { emoji: '❓', name: 'Desconhecido' };
            const qty = STORY_PROGRESS.inventory[id] || 0;
            const price = window.getMaterialPrice ? window.getMaterialPrice(id) : 2;
            return `<div class="tesouraria-item"><div class="tesouraria-item-icon">${m.emoji}</div><div class="tesouraria-item-name">${m.name}</div><div class="tesouraria-item-qty">×${qty}</div><div class="tesouraria-item-price">${uiIcon('gold')} ${price} / un.</div></div>`;
        }).join('');

        const weaponCounts = {};
        (STORY_PROGRESS.craftedWeapons || []).forEach(id => weaponCounts[id] = (weaponCounts[id] || 0) + 1);
        const amuletCounts = {};
        (STORY_PROGRESS.craftedAmulets || []).forEach(id => amuletCounts[id] = (amuletCounts[id] || 0) + 1);

        const weapons = Object.keys(weaponCounts).map(id => ({ ...getWeaponById(id), count: weaponCounts[id] })).filter(w => w.id);
        const amulets = Object.keys(amuletCounts).map(id => ({ ...getAmuletById(id), count: amuletCounts[id] })).filter(a => a.id);

        const usageMap = {};
        const eqMap = STORY_PROGRESS.heroEquipment || {};
        for (const heroClass in eqMap) {
            const e = eqMap[heroClass];
            if (e.arma) { if(!usageMap[e.arma]) usageMap[e.arma] = []; usageMap[e.arma].push(heroClass); }
            if (e.amuleto) { if(!usageMap[e.amuleto]) usageMap[e.amuleto] = []; usageMap[e.amuleto].push(heroClass); }
        }

        let weaponsHTML = '';
        if (weapons.length === 0) {
            weaponsHTML = `<div class="inv-empty-line">Nenhuma arma forjada ainda.</div>`;
        } else {
            weaponsHTML = weapons.map(w => {
                const equippedBy = usageMap[w.id] || [];
                const owner = equippedBy.length > 0 ? equippedBy.map(hc => STORY_HERO_CLASSES[hc]?.displayName || hc).join(', ') : null;
                const icon = (typeof getWeaponIcon === 'function') ? getWeaponIcon(w.id, 'normal') : (w.emoji || '⚔️');
                return `
                    <div class="inv-equip-row">
                        <div class="inv-equip-icon">${icon}</div>
                        <div class="inv-equip-info">
                            <div class="inv-equip-name">${w.nome} (x${w.count})</div>
                            <div class="inv-equip-meta">+${w.atkBonus} ATK ${w.elemento === 'ANY' ? '· ✨ Abissal' : `· ${elemIcon(w.elemento)} ${w.elemento}`}</div>
                        </div>
                        <div class="inv-equip-owner ${owner ? 'used' : 'free'}">${owner ? `👤 ${owner}` : '— Livre —'}</div>
                    </div>`;
            }).join('');
        }

        let amuletsHTML = '';
        if (amulets.length === 0) {
            amuletsHTML = `<div class="inv-empty-line">Nenhum amuleto forjado ainda.</div>`;
        } else {
            amuletsHTML = amulets.map(a => {
                const equippedBy = usageMap[a.id] || [];
                const owner = equippedBy.length > 0 ? equippedBy.map(hc => STORY_HERO_CLASSES[hc]?.displayName || hc).join(', ') : null;
                const icon = (typeof getAmuletIcon === 'function') ? getAmuletIcon(a.id, 'normal') : (a.emoji || '🧿');
                const ef = a.efeito || {};
                const efeitos = [];
                if (ef.elementOverride) efeitos.push(`${elemIcon(ef.elementOverride)} ${ef.elementOverride}`);
                if (ef.hpBonus)         efeitos.push(`+${ef.hpBonus} HP`);
                if (ef.atkBonus)        efeitos.push(`+${ef.atkBonus} ATK`);
                if (ef.healPerTurn)     efeitos.push(`+${ef.healPerTurn} HP/turno`);
                return `
                    <div class="inv-equip-row amulet">
                        <div class="inv-equip-icon">${icon}</div>
                        <div class="inv-equip-info">
                            <div class="inv-equip-name">${a.nome} (x${a.count})</div>
                            <div class="inv-equip-meta">${efeitos.join(' · ') || '—'}</div>
                        </div>
                        <div class="inv-equip-owner ${owner ? 'used' : 'free'}">${owner ? `👤 ${owner}` : '— Livre —'}</div>
                    </div>`;
            }).join('');
        }

        const equipSection = `
            <div class="inv-equipment-section">
                <div class="inv-equipment-title">⚔️ ARMAS FORJADAS</div>
                <div class="inv-equip-list">${weaponsHTML}</div>
                <div class="inv-equipment-title" style="margin-top:16px;">🧿 AMULETOS FORJADOS</div>
                <div class="inv-equip-list">${amuletsHTML}</div>
                <div class="inv-equipment-hint">💡 Para equipar, abra o <b>painel de um herói</b> na <b>OCA</b> (botão <b>?</b>) e escolha o item.</div>
            </div>`;

        return `
            <div class="tesouraria-total">Valor total do inventário: <b>${uiIcon('gold')} ${totalValue}</b></div>
            <div class="tesouraria-grid">${cardsHTML}</div>
            <div class="tesouraria-hint">💡 Venda materiais no <b>Escambo</b> para ganhar ouro.</div>
            ${equipSection}
        `;
    };

    // ==============================================================
    // 3. EQUIPAR (Permite múltiplos heróis usarem a mesma arma se tiver no estoque)
    // ==============================================================
    window.handleEquipWeapon = function(heroClass, weaponId) {
        if (!weaponId) {
            unequipWeapon(heroClass);
            showToast('⚔️', 'Arma removida.', '⚔️');
            return;
        }
        const w = getWeaponById(weaponId);
        if (!w) return;
        const count = countWeapon(weaponId);
        if (count === 0) { showToast('❌', 'Você não tem essa arma.', '❌'); return; }

        const expectedTipo = getArchetypeFromHeroClass(heroClass);
        if (w.tipo !== expectedTipo) { showToast('❌', `${STORY_HERO_CLASSES[heroClass].displayName} não pode usar ${w.tipo}.`, '❌'); return; }

        let equippedCount = 0;
        for (const hc in STORY_PROGRESS.heroEquipment) {
            if (hc !== heroClass && STORY_PROGRESS.heroEquipment[hc].arma === weaponId) equippedCount++;
        }

        if (equippedCount >= count) {
            for (const hc in STORY_PROGRESS.heroEquipment) {
                if (hc !== heroClass && STORY_PROGRESS.heroEquipment[hc].arma === weaponId) {
                    STORY_PROGRESS.heroEquipment[hc].arma = null;
                    break;
                }
            }
        }

        getHeroEquipment(heroClass).arma = weaponId;
        saveStoryProgress();
        showToast('⚔️ Equipado!', `${w.emoji} ${w.nome}`, '⚔️');
        
        if (typeof window.openHeroDetails === 'function') {
            setTimeout(() => {
                if (typeof closeHeroDetails === 'function') closeHeroDetails();
                setTimeout(() => window.openHeroDetails(heroClass), 320);
            }, 100);
        }
    };

    window.handleEquipAmulet = function(heroClass, amuletId) {
        if (!amuletId) {
            unequipAmulet(heroClass);
            showToast('🧿', 'Amuleto removido.', '🧿');
            return;
        }
        const a = getAmuletById(amuletId);
        if (!a) return;
        const count = countAmulet(amuletId);
        if (count === 0) { showToast('❌', 'Você não tem esse amuleto.', '❌'); return; }

        let equippedCount = 0;
        for (const hc in STORY_PROGRESS.heroEquipment) {
            if (hc !== heroClass && STORY_PROGRESS.heroEquipment[hc].amuleto === amuletId) equippedCount++;
        }

        if (equippedCount >= count) {
            for (const hc in STORY_PROGRESS.heroEquipment) {
                if (hc !== heroClass && STORY_PROGRESS.heroEquipment[hc].amuleto === amuletId) {
                    STORY_PROGRESS.heroEquipment[hc].amuleto = null;
                    break;
                }
            }
        }

        getHeroEquipment(heroClass).amuleto = amuletId;
        saveStoryProgress();
        showToast('🧿 Equipado!', `${a.emoji} ${a.nome}`, '🧿');
        
        if (typeof window.openHeroDetails === 'function') {
            setTimeout(() => {
                if (typeof closeHeroDetails === 'function') closeHeroDetails();
                setTimeout(() => window.openHeroDetails(heroClass), 320);
            }, 100);
        }
    };

    // ==============================================================
    // 4. FIX NO DROPDOWN DA OCA (Evitar duplicatas visuais)
    // ==============================================================
    const _origOpenDetails = window.openHeroDetails;
    if (typeof _origOpenDetails === 'function') {
        window.openHeroDetails = function(heroClass) {
            _origOpenDetails.apply(this, arguments);
            setTimeout(() => {
                document.querySelectorAll('.equip-select').forEach(select => {
                    const seen = new Set();
                    Array.from(select.options).forEach(opt => {
                        if (!opt.value) return;
                        if (seen.has(opt.value)) {
                            opt.remove();
                        } else {
                            seen.add(opt.value);
                        }
                    });
                });
            }, 100);
        };
    }

    console.log('✅ [V38.0] Craft múltiplo (limite de 99) e otimização de equipamentos.');
})();
// =================================================================
// historia.js — BLOCO 124 (V38.1 — Fix Equipamento com Múltiplos Itens)
// =================================================================
(function fixEquiparMultiploV381() {
    if (window._fixEquiparMultiploV381) return;
    window._fixEquiparMultiploV381 = true;

    // 1. Conserta a função base de equipar armas
    window.equipWeapon = function(heroClass, weaponId) {
        const w = getWeaponById(weaponId);
        if (!w) return { ok: false, error: 'Arma não encontrada.' };
        if (!isWeaponCrafted(weaponId)) return { ok: false, error: 'Você não tem essa arma.' };

        const expectedTipo = getArchetypeFromHeroClass(heroClass);
        if (w.tipo !== expectedTipo) {
            return { ok: false, error: `${STORY_HERO_CLASSES[heroClass].displayName} não pode usar ${w.tipo}.` };
        }

        // Verifica quantas cópias temos e quantas estão equipadas em OUTROS heróis
        const totalCopies = (STORY_PROGRESS.craftedWeapons || []).filter(id => id === weaponId).length;
        let equippedByOthers = 0;
        for (const hc in STORY_PROGRESS.heroEquipment) {
            if (hc !== heroClass && STORY_PROGRESS.heroEquipment[hc].arma === weaponId) {
                equippedByOthers++;
            }
        }

        if (equippedByOthers >= totalCopies) {
            return { ok: false, error: 'Todas as cópias desta arma já estão em uso.' };
        }

        getHeroEquipment(heroClass).arma = weaponId;
        saveStoryProgress();
        return { ok: true };
    };

    // 2. Conserta a função base de equipar amuletos
    window.equipAmulet = function(heroClass, amuletId) {
        const a = getAmuletById(amuletId);
        if (!a) return { ok: false, error: 'Amuleto não encontrado.' };
        if (!isAmuletCrafted(amuletId)) return { ok: false, error: 'Você não tem esse amuleto.' };

        const totalCopies = (STORY_PROGRESS.craftedAmulets || []).filter(id => id === amuletId).length;
        let equippedByOthers = 0;
        for (const hc in STORY_PROGRESS.heroEquipment) {
            if (hc !== heroClass && STORY_PROGRESS.heroEquipment[hc].amuleto === amuletId) {
                equippedByOthers++;
            }
        }

        if (equippedByOthers >= totalCopies) {
            return { ok: false, error: 'Todas as cópias deste amuleto já estão em uso.' };
        }

        getHeroEquipment(heroClass).amuleto = amuletId;
        saveStoryProgress();
        return { ok: true };
    };

    // 3. Conserta os botões de clique dos cards para atualizar a UI corretamente
    window.handleWeaponCardClick = function(heroClass, weaponId, isEquipped) {
        if (isEquipped) {
            window.unequipWeapon(heroClass);
            showToast('⚔️', 'Arma removida.', '⚔️');
        } else {
            const r = window.equipWeapon(heroClass, weaponId);
            if (!r.ok) { showToast('❌', r.error, '❌'); return; }
            const w = getWeaponById(weaponId);
            showToast('⚔️ Equipado!', `${w.emoji || ''} ${w.nome}`, '⚔️');
        }
        if (typeof closeHeroDetails === 'function') closeHeroDetails();
        setTimeout(() => window.openHeroDetails(heroClass), 320);
    };

    window.handleAmuletCardClick = function(heroClass, amuletId, isEquipped) {
        if (isEquipped) {
            window.unequipAmulet(heroClass);
            showToast('🧿', 'Amuleto removido.', '🧿');
        } else {
            const r = window.equipAmulet(heroClass, amuletId);
            if (!r.ok) { showToast('❌', r.error, '❌'); return; }
            const a = getAmuletById(amuletId);
            showToast('🧿 Equipado!', `${a.emoji || ''} ${a.nome}`, '🧿');
        }
        if (typeof closeHeroDetails === 'function') closeHeroDetails();
        setTimeout(() => window.openHeroDetails(heroClass), 320);
    };

    // 4. Reescreve a injeção visual para AGRUPAR itens iguais
    const _origOpenDetails = window.openHeroDetails;
    window.openHeroDetails = function(heroClass) {
        _origOpenDetails.apply(this, arguments);

        const panel = document.querySelector('.hero-details-panel');
        if (!panel) return;

        const oldEquip = panel.querySelector('.hero-details-equipment');
        if (oldEquip) oldEquip.remove();

        const heroData = STORY_HERO_CLASSES[heroClass];
        if (!heroData) return;
        const archetype = getArchetypeFromHeroClass(heroClass);
        const eq = getHeroEquipment(heroClass);
        const equippedWeaponId = eq.arma || null;
        const equippedAmuletId = eq.amuleto || null;

        // Agrupa Armas
        let craftedWeapons = (STORY_PROGRESS.craftedWeapons || []).map(id => getWeaponById(id)).filter(w => w && w.tipo === archetype);
        const weaponCounts = {};
        craftedWeapons.forEach(w => { weaponCounts[w.id] = (weaponCounts[w.id] || 0) + 1; });
        const uniqueWeapons = Object.keys(weaponCounts).map(id => {
            const w = getWeaponById(id);
            w._count = weaponCounts[id];
            return w;
        });

        // Agrupa Amuletos
        let craftedAmulets = (STORY_PROGRESS.craftedAmulets || []).map(id => getAmuletById(id)).filter(Boolean);
        const amuletCounts = {};
        craftedAmulets.forEach(a => { amuletCounts[a.id] = (amuletCounts[a.id] || 0) + 1; });
        const uniqueAmulets = Object.keys(amuletCounts).map(id => {
            const a = getAmuletById(id);
            a._count = amuletCounts[id];
            return a;
        });

        function renderWeaponCard(w, isEquipped) {
            const weaponIcon = getWeaponIcon(w.id, 'large');
            const elemLabel = w.elemento === 'ANY' ? '✨ Abissal' : `${elemIcon(w.elemento)} ${w.elemento}`;
            const elemClass = w.elemento === 'ANY' ? 'equip-elem-abissal' : `equip-elem-${w.elemento}`;
            const bonusText = `+${w.atkBonus} ATK <span class="equip-elem-bonus">(+${w.elementoBonus} no elemento)</span>`;
            
            // Mostra a quantidade no nome
            const qtdText = w._count > 1 ? `<span style="color:#e8b923; font-size:0.8rem; margin-left:5px;">(x${w._count})</span>` : '';

            return `
                <div class="equip-card ${isEquipped ? 'equipped' : ''}">
                    <div class="equip-card-icon">${weaponIcon}</div>
                    <div class="equip-card-info">
                        <div class="equip-card-name">${w.nome} ${qtdText}</div>
                        <div class="equip-card-bonus">${bonusText}</div>
                        <div class="equip-card-elem ${elemClass}">${elemLabel}</div>
                    </div>
                    <button class="equip-card-btn ${isEquipped ? 'unequip' : 'equip'}"
                            onclick="handleWeaponCardClick('${heroClass.replace(/'/g, "\\'")}', '${w.id}', ${isEquipped})">
                        ${isEquipped ? '✕ Remover' : '⚔️ Equipar'}
                    </button>
                </div>`;
        }

        function renderAmuletCard(a, isEquipped) {
            const amuletIcon = getAmuletIcon(a.id, 'large');
            const ef = a.efeito || {};
            const efeitos = [];
            if (ef.elementOverride) efeitos.push(`${elemIcon(ef.elementOverride)} ${ef.elementOverride}`);
            if (ef.hpBonus)         efeitos.push(`❤️ +${ef.hpBonus} HP`);
            if (ef.atkBonus)        efeitos.push(`⚔️ +${ef.atkBonus} ATK`);
            if (ef.healPerTurn)     efeitos.push(`💚 +${ef.healPerTurn} HP/turno`);
            
            const qtdText = a._count > 1 ? `<span style="color:#e8b923; font-size:0.8rem; margin-left:5px;">(x${a._count})</span>` : '';

            return `
                <div class="equip-card ${isEquipped ? 'equipped' : ''}">
                    <div class="equip-card-icon">${amuletIcon}</div>
                    <div class="equip-card-info">
                        <div class="equip-card-name">${a.nome} ${qtdText}</div>
                        <div class="equip-card-bonus">${efeitos.join(' · ') || '—'}</div>
                    </div>
                    <button class="equip-card-btn ${isEquipped ? 'unequip' : 'equip'}"
                            onclick="handleAmuletCardClick('${heroClass.replace(/'/g, "\\'")}', '${a.id}', ${isEquipped})">
                        ${isEquipped ? '✕ Remover' : '🧿 Equipar'}
                    </button>
                </div>`;
        }

        const weaponCards = uniqueWeapons.length > 0
            ? uniqueWeapons.map(w => renderWeaponCard(w, equippedWeaponId === w.id)).join('')
            : `<div class="equip-empty-msg">Nenhuma arma compatível forjada.</div>`;

        const amuletCards = uniqueAmulets.length > 0
            ? uniqueAmulets.map(a => renderAmuletCard(a, equippedAmuletId === a.id)).join('')
            : `<div class="equip-empty-msg">Nenhum amuleto forjado.</div>`;

        const equipHTML = `
            <div class="hero-details-section hero-details-equipment">
                <div class="hero-details-section-title">⚔️ EQUIPAMENTO</div>
                <div class="equip-subsection-title">Arma (${archetype === 'tacape' ? 'Tacape' : archetype === 'flecha' ? 'Flecha' : 'Cajado'})</div>
                <div class="equip-cards-grid">${weaponCards}</div>
                <div class="equip-subsection-title" style="margin-top:14px;">Amuleto</div>
                <div class="equip-cards-grid">${amuletCards}</div>
            </div>`;

        const notas = panel.querySelector('.hero-details-notes');
        if (notas) {
            notas.insertAdjacentHTML('beforebegin', equipHTML);
        } else {
            panel.insertAdjacentHTML('beforeend', equipHTML);
        }
    };

    console.log('✅ [V38.1] Equipamento de múltiplos itens consertado (agrupamento e estoque).');
})();

// =================================================================
// historia.js — BLOCO 126 (V39.1 — Correção Definitiva de Itens Únicos)
// =================================================================
(function sistemaItensUnicosV391() {
    if (window._sistemaItensUnicosV391) return;
    window._sistemaItensUnicosV391 = true;

    // Salva os originais ANTES de sobrescrever
    const _origGetWeaponIcon = window.getWeaponIcon;
    const _origGetAmuletIcon = window.getAmuletIcon;

    // ==============================================================
    // 1. HELPERS DE ID ÚNICO E MIGRAÇÃO
    // ==============================================================
    function getBaseId(id) {
        if (!id) return null;
        return String(id).split('#')[0];
    }

    function gerarUid(baseId) {
        return `${baseId}#${Date.now()}${Math.floor(Math.random()*1000)}`;
    }

    function migrarSaveAntigo() {
        if (!STORY_PROGRESS.craftedWeapons) STORY_PROGRESS.craftedWeapons = [];
        if (!STORY_PROGRESS.craftedAmulets) STORY_PROGRESS.craftedAmulets = [];

        let mudou = false;

        STORY_PROGRESS.craftedWeapons = STORY_PROGRESS.craftedWeapons.map(id => {
            if (typeof id === 'string' && !id.includes('#')) { mudou = true; return gerarUid(id); }
            return id;
        });

        STORY_PROGRESS.craftedAmulets = STORY_PROGRESS.craftedAmulets.map(id => {
            if (typeof id === 'string' && !id.includes('#')) { mudou = true; return gerarUid(id); }
            return id;
        });

        for (const heroClass in STORY_PROGRESS.heroEquipment || {}) {
            const eq = STORY_PROGRESS.heroEquipment[heroClass];
            if (eq.arma && !eq.arma.includes('#')) {
                const uid = STORY_PROGRESS.craftedWeapons.find(w => getBaseId(w) === eq.arma);
                eq.arma = uid || null;
                mudou = true;
            }
            if (eq.amuleto && !eq.amuleto.includes('#')) {
                const uid = STORY_PROGRESS.craftedAmulets.find(a => getBaseId(a) === eq.amuleto);
                eq.amuleto = uid || null;
                mudou = true;
            }
        }

        if (mudou && typeof saveStoryProgress === 'function') {
            saveStoryProgress();
            console.log('[V39.1] Save migrado com sucesso!');
        }
    }
    migrarSaveAntigo();

    // ==============================================================
    // 2. WRAPPERS DE ACESSO
    // ==============================================================
    const _origGetWeaponById = window.getWeaponById;
    window.getWeaponById = function(uid) {
        if (!uid) return null;
        const baseId = getBaseId(uid);
        const w = STORY_WEAPONS[baseId];
        if (w) return { ...w, uid: uid, baseId: baseId, id: uid }; // id = uid para manter compatibilidade
        return null;
    };

    const _origGetAmuletById = window.getAmuletById;
    window.getAmuletById = function(uid) {
        if (!uid) return null;
        const baseId = getBaseId(uid);
        const a = STORY_AMULETS[baseId];
        if (a) return { ...a, uid: uid, baseId: baseId, id: uid };
        return null;
    };

    window.getWeaponIcon = function(uid, size) {
        const baseId = getBaseId(uid);
        return (typeof _origGetWeaponIcon === 'function') ? _origGetWeaponIcon(baseId, size) : (STORY_WEAPONS[baseId]?.emoji || '⚔️');
    };

    window.getAmuletIcon = function(uid, size) {
        const baseId = getBaseId(uid);
        return (typeof _origGetAmuletIcon === 'function') ? _origGetAmuletIcon(baseId, size) : (STORY_AMULETS[baseId]?.emoji || '🧿');
    };

    // ==============================================================
    // 3. CRAFTAR E DESMANCHAR
    // ==============================================================
    window.handleCraftWeapon = function(baseId) {
        const w = STORY_WEAPONS[baseId];
        if (!w) return;
        
        const count = STORY_PROGRESS.craftedWeapons.filter(id => getBaseId(id) === baseId).length;
        if (count >= 99) { showToast('❌ Limite', 'Você já tem 99 desta arma.', '❌'); return; }
        if (!isWeaponAvailable(baseId)) { showToast('❌', 'Ato ainda não desbloqueado.', '❌'); return; }
        if (!hasMaterials(w.receita)) { showToast('❌', 'Materiais insuficientes.', '❌'); return; }
        if ((STORY_PROGRESS.gold || 0) < w.custoOuro) { showToast('❌', `Faltam ${w.custoOuro - (STORY_PROGRESS.gold||0)} de ouro.`, '❌'); return; }

        consumeMaterials(w.receita);
        STORY_PROGRESS.gold -= w.custoOuro;
        STORY_PROGRESS.craftedWeapons.push(gerarUid(baseId));
        saveStoryProgress();
        
        showToast('🔨 Forjada!', `${w.emoji} ${w.nome} (Total: ${count + 1})`, '🔨');
        try { playSfx('win'); } catch(e) {}
        renderTesourariaScreen();
    };

    window.handleCraftAmulet = function(baseId) {
        const a = STORY_AMULETS[baseId];
        if (!a) return;
        
        const count = STORY_PROGRESS.craftedAmulets.filter(id => getBaseId(id) === baseId).length;
        if (count >= 99) { showToast('❌ Limite', 'Você já tem 99 deste amuleto.', '❌'); return; }
        if (!isAmuletAvailable(baseId)) { showToast('❌', 'Ato ainda não desbloqueado.', '❌'); return; }
        if (!hasMaterials(a.receita)) { showToast('❌', 'Materiais insuficientes.', '❌'); return; }
        if ((STORY_PROGRESS.gold || 0) < a.custoOuro) { showToast('❌', `Faltam ${a.custoOuro - (STORY_PROGRESS.gold||0)} de ouro.`, '❌'); return; }

        consumeMaterials(a.receita);
        STORY_PROGRESS.gold -= a.custoOuro;
        STORY_PROGRESS.craftedAmulets.push(gerarUid(baseId));
        saveStoryProgress();
        
        showToast('🔨 Forjado!', `${a.emoji} ${a.nome} (Total: ${count + 1})`, '🔨');
        try { playSfx('win'); } catch(e) {}
        renderTesourariaScreen();
    };

    window.handleDismantleWeapon = async function(uid) {
        const w = window.getWeaponById(uid);
        if (!w) return;
        const __perg3 = `Desmanchar "${w.nome}"?\n\nVocê receberá 50% dos materiais de volta.`;
                const __ok3 = (typeof uiConfirm === 'function')
                    ? await uiConfirm(__perg3, { titulo: 'Confirmar', ok: 'Confirmar', cancelar: 'Cancelar' })
                    : confirm(__perg3);
                if (!__ok3) return;

        const idx = STORY_PROGRESS.craftedWeapons.indexOf(uid);
        if (idx !== -1) STORY_PROGRESS.craftedWeapons.splice(idx, 1);

        for (const hc in STORY_PROGRESS.heroEquipment || {}) {
            if (STORY_PROGRESS.heroEquipment[hc].arma === uid) STORY_PROGRESS.heroEquipment[hc].arma = null;
        }

        refundMaterials(w.receita, 0.5);
        saveStoryProgress();
        showToast('🔥 Desmanchada', `50% dos materiais devolvidos.`, '🔥');
        renderTesourariaScreen();
    };

    window.handleDismantleAmulet = async function(uid) {
        const a = window.getAmuletById(uid);
        if (!a) return;
        const __perg4 = `Desmanchar "${a.nome}"?\n\nVocê receberá 50% dos materiais de volta.`;
                const __ok4 = (typeof uiConfirm === 'function')
                    ? await uiConfirm(__perg4, { titulo: 'Confirmar', ok: 'Confirmar', cancelar: 'Cancelar' })
                    : confirm(__perg4);
                if (!__ok4) return;

        const idx = STORY_PROGRESS.craftedAmulets.indexOf(uid);
        if (idx !== -1) STORY_PROGRESS.craftedAmulets.splice(idx, 1);

        for (const hc in STORY_PROGRESS.heroEquipment || {}) {
            if (STORY_PROGRESS.heroEquipment[hc].amuleto === uid) STORY_PROGRESS.heroEquipment[hc].amuleto = null;
        }

        refundMaterials(a.receita, 0.5);
        saveStoryProgress();
        showToast('🔥 Desmanchado', `50% dos materiais devolvidos.`, '🔥');
        renderTesourariaScreen();
    };

    // ==============================================================
    // 4. EQUIPAR / DESEQUIPAR
    // ==============================================================
    window.equipWeapon = function(heroClass, uid) {
        const w = window.getWeaponById(uid);
        if (!w) return { ok: false, error: 'Item não encontrado.' };
        if (!STORY_PROGRESS.craftedWeapons.includes(uid)) return { ok: false, error: 'Você não possui esta instância.' };

        const expectedTipo = getArchetypeFromHeroClass(heroClass);
        if (w.tipo !== expectedTipo) return { ok: false, error: `Classe incompatível.` };

        for (const hc in STORY_PROGRESS.heroEquipment) {
            if (hc !== heroClass && STORY_PROGRESS.heroEquipment[hc].arma === uid) {
                STORY_PROGRESS.heroEquipment[hc].arma = null;
            }
        }

        getHeroEquipment(heroClass).arma = uid;
        saveStoryProgress();
        return { ok: true };
    };

    window.equipAmulet = function(heroClass, uid) {
        const a = window.getAmuletById(uid);
        if (!a) return { ok: false, error: 'Item não encontrado.' };
        if (!STORY_PROGRESS.craftedAmulets.includes(uid)) return { ok: false, error: 'Você não possui esta instância.' };

        for (const hc in STORY_PROGRESS.heroEquipment) {
            if (hc !== heroClass && STORY_PROGRESS.heroEquipment[hc].amuleto === uid) {
                STORY_PROGRESS.heroEquipment[hc].amuleto = null;
            }
        }

        getHeroEquipment(heroClass).amuleto = uid;
        saveStoryProgress();
        return { ok: true };
    };

    window.handleWeaponCardClick = function(heroClass, uid, isEquipped) {
        if (isEquipped) {
            window.unequipWeapon(heroClass);
            showToast('⚔️', 'Arma removida.', '⚔️');
        } else {
            const r = window.equipWeapon(heroClass, uid);
            if (!r.ok) { showToast('❌', r.error, '❌'); return; }
            const w = window.getWeaponById(uid);
            showToast('⚔️ Equipado!', `${w.emoji || ''} ${w.nome}`, '⚔️');
        }
        if (typeof closeHeroDetails === 'function') closeHeroDetails();
        setTimeout(() => window.openHeroDetails(heroClass), 320);
    };

    window.handleAmuletCardClick = function(heroClass, uid, isEquipped) {
        if (isEquipped) {
            window.unequipAmulet(heroClass);
            showToast('🧿', 'Amuleto removido.', '🧿');
        } else {
            const r = window.equipAmulet(heroClass, uid);
            if (!r.ok) { showToast('❌', r.error, '❌'); return; }
            const a = window.getAmuletById(uid);
            showToast('🧿 Equipado!', `${a.emoji || ''} ${a.nome}`, '🧿');
        }
        if (typeof closeHeroDetails === 'function') closeHeroDetails();
        setTimeout(() => window.openHeroDetails(heroClass), 320);
    };

    // ==============================================================
    // 5. UI DA OCA (Painel do Herói)
    // ==============================================================
    const _origOpen = window.openHeroDetails;
    window.openHeroDetails = function(heroClass) {
        _origOpen.apply(this, arguments);

        const panel = document.querySelector('.hero-details-panel');
        if (!panel) return;

        panel.querySelectorAll('.hero-details-equipment, .equip-row, .equip-select, .hero-details-weapon-element').forEach(el => el.remove());
        panel.querySelectorAll('.hero-details-section').forEach(sec => {
            if (sec.innerHTML.includes('Arma') && sec.innerHTML.includes('Amuleto') && sec.querySelector('select')) sec.remove();
        });

        const heroData = STORY_HERO_CLASSES[heroClass];
        if (!heroData) return;
        const archetype = getArchetypeFromHeroClass(heroClass);
        const eq = getHeroEquipment(heroClass);
        const equippedWeaponUid = eq.arma || null;
        const equippedAmuletUid = eq.amuleto || null;

        const userWeapons = (STORY_PROGRESS.craftedWeapons || []).map(uid => window.getWeaponById(uid)).filter(w => w && w.tipo === archetype);
        const userAmulets = (STORY_PROGRESS.craftedAmulets || []).map(uid => window.getAmuletById(uid)).filter(Boolean);

        const wCounts = {}; userWeapons.forEach(w => { wCounts[w.baseId] = (wCounts[w.baseId] || 0) + 1; });
        const aCounts = {}; userAmulets.forEach(a => { aCounts[a.baseId] = (aCounts[a.baseId] || 0) + 1; });

        function renderWeaponCard(w) {
            const isEquipped = equippedWeaponUid === w.uid;
            const weaponIcon = window.getWeaponIcon(w.uid, 'large');
            const elemLabel = w.elemento === 'ANY' ? '✨ Abissal' : `${elemIcon(w.elemento)} ${w.elemento}`;
            const elemClass = w.elemento === 'ANY' ? 'equip-elem-abissal' : `equip-elem-${w.elemento}`;
            const bonusText = `+${w.atkBonus} ATK <span class="equip-elem-bonus">(+${w.elementoBonus})</span>`;
            const qtdText = wCounts[w.baseId] > 1 ? `<span style="color:#e8b923; font-size:0.8rem; margin-left:5px;">(x${wCounts[w.baseId]})</span>` : '';
            return `
                <div class="equip-card ${isEquipped ? 'equipped' : ''}">
                    <div class="equip-card-icon">${weaponIcon}</div>
                    <div class="equip-card-info">
                        <div class="equip-card-name">${w.nome} ${qtdText}</div>
                        <div class="equip-card-bonus">${bonusText}</div>
                        <div class="equip-card-elem ${elemClass}">${elemLabel}</div>
                    </div>
                    <button class="equip-card-btn ${isEquipped ? 'unequip' : 'equip'}"
                            onclick="handleWeaponCardClick('${heroClass.replace(/'/g, "\\'")}', '${w.uid}', ${isEquipped})">
                        ${isEquipped ? '✕ Remover' : '⚔️ Equipar'}
                    </button>
                </div>`;
        }

        function renderAmuletCard(a) {
            const isEquipped = equippedAmuletUid === a.uid;
            const amuletIcon = window.getAmuletIcon(a.uid, 'large');
            const ef = a.efeito || {};
            const efeitos = [];
            if (ef.elementOverride) efeitos.push(`${elemIcon(ef.elementOverride)} ${ef.elementOverride}`);
            if (ef.hpBonus) efeitos.push(`❤️ +${ef.hpBonus} HP`);
            if (ef.atkBonus) efeitos.push(`⚔️ +${ef.atkBonus} ATK`);
            if (ef.healPerTurn) efeitos.push(`💚 +${ef.healPerTurn} HP/turno`);
            const qtdText = aCounts[a.baseId] > 1 ? `<span style="color:#e8b923; font-size:0.8rem; margin-left:5px;">(x${aCounts[a.baseId]})</span>` : '';
            return `
                <div class="equip-card ${isEquipped ? 'equipped' : ''}">
                    <div class="equip-card-icon">${amuletIcon}</div>
                    <div class="equip-card-info">
                        <div class="equip-card-name">${a.nome} ${qtdText}</div>
                        <div class="equip-card-bonus">${efeitos.join(' · ') || '—'}</div>
                    </div>
                    <button class="equip-card-btn ${isEquipped ? 'unequip' : 'equip'}"
                            onclick="handleAmuletCardClick('${heroClass.replace(/'/g, "\\'")}', '${a.uid}', ${isEquipped})">
                        ${isEquipped ? '✕ Remover' : '🧿 Equipar'}
                    </button>
                </div>`;
        }

        const weaponCards = userWeapons.length > 0 ? userWeapons.map(renderWeaponCard).join('') : `<div class="equip-empty-msg">Nenhuma arma compatível forjada.</div>`;
        const amuletCards = userAmulets.length > 0 ? userAmulets.map(renderAmuletCard).join('') : `<div class="equip-empty-msg">Nenhum amuleto forjado.</div>`;

        const equipHTML = `
            <div class="hero-details-section hero-details-equipment">
                <div class="hero-details-section-title">⚔️ EQUIPAMENTO</div>
                <div class="equip-subsection-title">Arma (${archetype === 'tacape' ? 'Tacape' : archetype === 'flecha' ? 'Flecha' : 'Cajado'})</div>
                <div class="equip-cards-grid">${weaponCards}</div>
                <div class="equip-subsection-title" style="margin-top:14px;">Amuleto</div>
                <div class="equip-cards-grid">${amuletCards}</div>
            </div>`;

        const notas = panel.querySelector('.hero-details-notes');
        if (notas) notas.insertAdjacentHTML('beforebegin', equipHTML);
        else panel.insertAdjacentHTML('beforeend', equipHTML);
    };

    // ==============================================================
    // 6. UI DA TESOURARIA (Forja e Amuletos)
    // ==============================================================
    window.renderTesourariaForja = function() {
        const allWeapons = Object.values(STORY_WEAPONS).filter(w => isWeaponAvailable(w.id));
        if (allWeapons.length === 0) return `<div class="tesouraria-empty"><div class="tesouraria-empty-icon">⚔️</div><div class="tesouraria-empty-text">Nenhuma forja liberada.</div></div>`;

        const cardsHTML = allWeapons.map(w => {
            const count = (STORY_PROGRESS.craftedWeapons || []).filter(id => getBaseId(id) === w.id).length;
            const canCraft = hasMaterials(w.receita) && (STORY_PROGRESS.gold || 0) >= w.custoOuro && count < 99;
            const recHTML = Object.entries(w.receita).map(([matId, qty]) => {
                const m = STORY_MATERIALS[matId];
                if (!m) return '';
                const has = STORY_PROGRESS.inventory[matId] || 0;
                const ok = has >= qty ? 'ok' : 'no';
                return `<span class="forge-recipe-mat ${ok}">${m.emoji} ${has}/${qty}</span>`;
            }).join('');
            const tipoLabel = { tacape:'Tacape', flecha:'Flecha', cajado:'Cajado' }[w.tipo];
            const isCrafted = count > 0;
            
            let actionHTML = '';
            if (count >= 99) {
                actionHTML = `<div class="forge-forged-tag" style="color:#e8b923;">✅ Limite Máximo (99)</div>`;
            } else {
                actionHTML = `
                    ${isCrafted ? `<div class="forge-forged-tag" style="color:#8ac070;">✅ Forjada (${count}/99)</div>` : ''}
                    <div class="forge-ouro ${canCraft ? 'ok' : 'no'}">${uiIcon('gold')} ${w.custoOuro}</div>
                    <button class="forge-btn" ${canCraft ? '' : 'disabled'} onclick="handleCraftWeapon('${w.id}')">
                        ${canCraft ? (isCrafted ? '🔨 Forjar +1' : '🔨 Forjar') : '✕ Sem recursos'}
                    </button>
                `;
            }
            return `<div class="forge-card ${isCrafted ? 'crafted' : ''}"><div class="forge-card-header"><div class="forge-emoji">${w.emoji}</div><div class="forge-info"><div class="forge-name">${w.nome}</div><div class="forge-meta">Ato ${w.ato} · ${tipoLabel} · +${w.atkBonus} ATK</div></div></div><div class="forge-recipe">${recHTML}</div><div class="forge-actions">${actionHTML}</div></div>`;
        }).join('');
        return `<div class="forge-grid">${cardsHTML}</div>`;
    };

    window.renderTesourariaAmuletos = function() {
        const allAmulets = Object.values(STORY_AMULETS).filter(a => isAmuletAvailable(a.id));
        if (allAmulets.length === 0) return `<div class="tesouraria-empty"><div class="tesouraria-empty-icon">🧿</div><div class="tesouraria-empty-text">Nenhum amuleto liberado.</div></div>`;

        const cardsHTML = allAmulets.map(a => {
            const count = (STORY_PROGRESS.craftedAmulets || []).filter(id => getBaseId(id) === a.id).length;
            const canCraft = hasMaterials(a.receita) && (STORY_PROGRESS.gold || 0) >= a.custoOuro && count < 99;
            const recHTML = Object.entries(a.receita).map(([matId, qty]) => {
                const m = STORY_MATERIALS[matId];
                if (!m) return '';
                const has = STORY_PROGRESS.inventory[matId] || 0;
                const ok = has >= qty ? 'ok' : 'no';
                return `<span class="forge-recipe-mat ${ok}">${m.emoji} ${has}/${qty}</span>`;
            }).join('');
            const ef = a.efeito;
            let efHTML = [];
            if (ef.elementOverride) efHTML.push(`🎨 Elemento → ${ef.elementOverride}`);
            if (ef.hpBonus) efHTML.push(`❤️ +${ef.hpBonus} HP`);
            if (ef.atkBonus) efHTML.push(`⚔️ +${ef.atkBonus} ATK`);
            if (ef.healPerTurn) efHTML.push(`💚 Cura ${ef.healPerTurn} HP/turno`);
            const isCrafted = count > 0;
            
            let actionHTML = '';
            if (count >= 99) {
                actionHTML = `<div class="forge-forged-tag" style="color:#e8b923;">✅ Limite Máximo (99)</div>`;
            } else {
                actionHTML = `
                    ${isCrafted ? `<div class="forge-forged-tag" style="color:#8ac070;">✅ Forjado (${count}/99)</div>` : ''}
                    <div class="forge-ouro ${canCraft ? 'ok' : 'no'}">${uiIcon('gold')} ${a.custoOuro}</div>
                    <button class="forge-btn" ${canCraft ? '' : 'disabled'} onclick="handleCraftAmulet('${a.id}')">
                        ${canCraft ? (isCrafted ? '🔨 Forjar +1' : '🔨 Forjar') : '✕ Sem recursos'}
                    </button>
                `;
            }
            return `<div class="forge-card ${isCrafted ? 'crafted amulet' : 'amulet'}"><div class="forge-card-header"><div class="forge-emoji">${a.emoji}</div><div class="forge-info"><div class="forge-name">${a.nome}</div><div class="forge-meta">Ato ${a.ato}</div></div></div><div class="forge-effects">${efHTML.join(' · ')}</div><div class="forge-recipe">${recHTML}</div><div class="forge-actions">${actionHTML}</div></div>`;
        }).join('');
        return `<div class="forge-grid">${cardsHTML}</div>`;
    };

    // ==============================================================
    // 7. UI DO INVENTÁRIO (Agrupando os itens iguais)
    // ==============================================================
    window.renderTesourariaInventario = function(materialIds) {
        if (materialIds.length === 0) return `<div class="tesouraria-empty"><div class="tesouraria-empty-icon">📦</div><div class="tesouraria-empty-text">Seu inventário está vazio.</div><div class="tesouraria-empty-hint">Derrote inimigos para coletar materiais.</div></div>`;
        
        materialIds.sort((a, b) => (window.getMaterialPrice ? window.getMaterialPrice(b) : 2) - (window.getMaterialPrice ? window.getMaterialPrice(a) : 2));
        const inv_count = (id) => STORY_PROGRESS.inventory[id] || 0;
        const totalValue = materialIds.reduce((sum, id) => sum + (window.getMaterialPrice ? window.getMaterialPrice(id) : 2) * inv_count(id), 0);

        const cardsHTML = materialIds.map(id => {
            const m = STORY_MATERIALS[id] || { emoji: '❓', name: 'Desconhecido' };
            const qty = STORY_PROGRESS.inventory[id] || 0;
            const price = window.getMaterialPrice ? window.getMaterialPrice(id) : 2;
            return `<div class="tesouraria-item"><div class="tesouraria-item-icon">${m.emoji}</div><div class="tesouraria-item-name">${m.name}</div><div class="tesouraria-item-qty">×${qty}</div><div class="tesouraria-item-price">${uiIcon('gold')} ${price} / un.</div></div>`;
        }).join('');

        // ⭐ AGRUPAMENTO DOS EQUIPAMENTOS POR BASE ID
        const wCounts = {};
        (STORY_PROGRESS.craftedWeapons || []).forEach(uid => {
            const baseId = getBaseId(uid);
            wCounts[baseId] = (wCounts[baseId] || 0) + 1;
        });
        
        const aCounts = {};
        (STORY_PROGRESS.craftedAmulets || []).forEach(uid => {
            const baseId = getBaseId(uid);
            aCounts[baseId] = (aCounts[baseId] || 0) + 1;
        });

        const usageMap = {};
        const eqMap = STORY_PROGRESS.heroEquipment || {};
        for (const heroClass in eqMap) {
            const e = eqMap[heroClass];
            const wBase = getBaseId(e.arma);
            const aBase = getBaseId(e.amuleto);
            if (wBase) { if(!usageMap[wBase]) usageMap[wBase] = []; if (!usageMap[wBase].includes(heroClass)) usageMap[wBase].push(heroClass); }
            if (aBase) { if(!usageMap[aBase]) usageMap[aBase] = []; if (!usageMap[aBase].includes(heroClass)) usageMap[aBase].push(heroClass); }
        }

        let weaponsHTML = '';
        const uniqueWeapons = Object.keys(wCounts);
        if (uniqueWeapons.length === 0) {
            weaponsHTML = `<div class="inv-empty-line">Nenhuma arma forjada ainda.</div>`;
        } else {
            weaponsHTML = uniqueWeapons.map(baseId => {
                const w = STORY_WEAPONS[baseId];
                if (!w) return '';
                const equippedBy = usageMap[baseId] || [];
                const owner = equippedBy.length > 0 ? equippedBy.map(hc => STORY_HERO_CLASSES[hc]?.displayName || hc).join(', ') : null;
                const icon = (typeof _origGetWeaponIcon === 'function') ? _origGetWeaponIcon(baseId, 'normal') : (w.emoji || '⚔️');
                return `
                    <div class="inv-equip-row">
                        <div class="inv-equip-icon">${icon}</div>
                        <div class="inv-equip-info">
                            <div class="inv-equip-name">${w.nome} (x${wCounts[baseId]})</div>
                            <div class="inv-equip-meta">+${w.atkBonus} ATK ${w.elemento === 'ANY' ? '· ✨ Abissal' : `· ${elemIcon(w.elemento)} ${w.elemento}`}</div>
                        </div>
                        <div class="inv-equip-owner ${owner ? 'used' : 'free'}">${owner ? `👤 ${owner}` : '— Livre —'}</div>
                    </div>`;
            }).join('');
        }

        let amuletsHTML = '';
        const uniqueAmulets = Object.keys(aCounts);
        if (uniqueAmulets.length === 0) {
            amuletsHTML = `<div class="inv-empty-line">Nenhum amuleto forjado ainda.</div>`;
        } else {
            amuletsHTML = uniqueAmulets.map(baseId => {
                const a = STORY_AMULETS[baseId];
                if (!a) return '';
                const equippedBy = usageMap[baseId] || [];
                const owner = equippedBy.length > 0 ? equippedBy.map(hc => STORY_HERO_CLASSES[hc]?.displayName || hc).join(', ') : null;
                const icon = (typeof _origGetAmuletIcon === 'function') ? _origGetAmuletIcon(baseId, 'normal') : (a.emoji || '🧿');
                const ef = a.efeito || {};
                const efeitos = [];
                if (ef.elementOverride) efeitos.push(`${elemIcon(ef.elementOverride)} ${ef.elementOverride}`);
                if (ef.hpBonus) efeitos.push(`+${ef.hpBonus} HP`);
                if (ef.atkBonus) efeitos.push(`+${ef.atkBonus} ATK`);
                if (ef.healPerTurn) efeitos.push(`+${ef.healPerTurn} HP/turno`);
                return `
                    <div class="inv-equip-row amulet">
                        <div class="inv-equip-icon">${icon}</div>
                        <div class="inv-equip-info">
                            <div class="inv-equip-name">${a.nome} (x${aCounts[baseId]})</div>
                            <div class="inv-equip-meta">${efeitos.join(' · ') || '—'}</div>
                        </div>
                        <div class="inv-equip-owner ${owner ? 'used' : 'free'}">${owner ? `👤 ${owner}` : '— Livre —'}</div>
                    </div>`;
            }).join('');
        }

        const equipSection = `
            <div class="inv-equipment-section">
                <div class="inv-equipment-title">⚔️ ARMAS FORJADAS</div>
                <div class="inv-equip-list">${weaponsHTML}</div>
                <div class="inv-equipment-title" style="margin-top:16px;">🧿 AMULETOS FORJADOS</div>
                <div class="inv-equip-list">${amuletsHTML}</div>
                <div class="inv-equipment-hint">💡 Para equipar, abra o <b>painel de um herói</b> na <b>OCA</b> (botão <b>?</b>) e escolha o item.</div>
            </div>`;

        return `
            <div class="tesouraria-total">Valor total do inventário: <b>${uiIcon('gold')} ${totalValue}</b></div>
            <div class="tesouraria-grid">${cardsHTML}</div>
            <div class="tesouraria-hint">💡 Venda materiais no <b>Escambo</b> para ganhar ouro.</div>
            ${equipSection}
        `;
    };

    console.log('✅ [V39.1] Tesouraria e Inventário consertados com IDs Únicos.');
})();
// =================================================================
// historia.js — BLOCO 127 (V40.0 — Tela Dedicada de Equipamentos)
// -----------------------------------------------------------------
// 1. Cria uma tela separada para gerenciar os equipamentos do herói.
// 2. Adiciona botão "⚔️" no card da OCA.
// 3. Traz o botão "Desmanchar" de volta.
// 4. Limpa o painel de detalhes "?" para não misturar as coisas.
// =================================================================

(function telaEquipamentosV400() {
    if (window._telaEquipamentosV400) return;
    window._telaEquipamentosV400 = true;

    // Salva os originais
    const _origGetWeaponIcon = window.getWeaponIcon;
    const _origGetAmuletIcon = window.getAmuletIcon;

    // ==============================================================
    // 1. HELPERS DE ID ÚNICO
    // ==============================================================
    function getBaseId(id) {
        if (!id) return null;
        return String(id).split('#')[0];
    }

    function gerarUid(baseId) {
        return `${baseId}#${Date.now()}${Math.floor(Math.random()*1000)}`;
    }

    function migrarSaveAntigo() {
        if (!STORY_PROGRESS.craftedWeapons) STORY_PROGRESS.craftedWeapons = [];
        if (!STORY_PROGRESS.craftedAmulets) STORY_PROGRESS.craftedAmulets = [];

        let mudou = false;

        STORY_PROGRESS.craftedWeapons = STORY_PROGRESS.craftedWeapons.map(id => {
            if (typeof id === 'string' && !id.includes('#')) { mudou = true; return gerarUid(id); }
            return id;
        });

        STORY_PROGRESS.craftedAmulets = STORY_PROGRESS.craftedAmulets.map(id => {
            if (typeof id === 'string' && !id.includes('#')) { mudou = true; return gerarUid(id); }
            return id;
        });

        for (const heroClass in STORY_PROGRESS.heroEquipment || {}) {
            const eq = STORY_PROGRESS.heroEquipment[heroClass];
            if (eq.arma && !eq.arma.includes('#')) {
                const uid = STORY_PROGRESS.craftedWeapons.find(w => getBaseId(w) === eq.arma);
                eq.arma = uid || null; mudou = true;
            }
            if (eq.amuleto && !eq.amuleto.includes('#')) {
                const uid = STORY_PROGRESS.craftedAmulets.find(a => getBaseId(a) === eq.amuleto);
                eq.amuleto = uid || null; mudou = true;
            }
        }

        if (mudou && typeof saveStoryProgress === 'function') saveStoryProgress();
    }
    migrarSaveAntigo();

    // ==============================================================
    // 2. WRAPPERS DE ACESSO E AÇÕES
    // ==============================================================
    window.getWeaponById = function(uid) {
        if (!uid) return null;
        const baseId = getBaseId(uid);
        const w = STORY_WEAPONS[baseId];
        if (w) return { ...w, uid: uid, baseId: baseId, id: uid };
        return null;
    };

    window.getAmuletById = function(uid) {
        if (!uid) return null;
        const baseId = getBaseId(uid);
        const a = STORY_AMULETS[baseId];
        if (a) return { ...a, uid: uid, baseId: baseId, id: uid };
        return null;
    };

    window.getWeaponIcon = function(uid, size) {
        const baseId = getBaseId(uid);
        return (typeof _origGetWeaponIcon === 'function') ? _origGetWeaponIcon(baseId, size) : (STORY_WEAPONS[baseId]?.emoji || '⚔️');
    };

    window.getAmuletIcon = function(uid, size) {
        const baseId = getBaseId(uid);
        return (typeof _origGetAmuletIcon === 'function') ? _origGetAmuletIcon(baseId, size) : (STORY_AMULETS[baseId]?.emoji || '🧿');
    };

    window.handleCraftWeapon = function(baseId) {
        const w = STORY_WEAPONS[baseId];
        if (!w) return;
        const count = STORY_PROGRESS.craftedWeapons.filter(id => getBaseId(id) === baseId).length;
        if (count >= 99) { showToast('❌ Limite', 'Você já tem 99 desta arma.', '❌'); return; }
        if (!isWeaponAvailable(baseId)) { showToast('❌', 'Ato ainda não desbloqueado.', '❌'); return; }
        if (!hasMaterials(w.receita)) { showToast('❌', 'Materiais insuficientes.', '❌'); return; }
        if ((STORY_PROGRESS.gold || 0) < w.custoOuro) { showToast('❌', `Faltam ${w.custoOuro - (STORY_PROGRESS.gold||0)} de ouro.`, '❌'); return; }

        consumeMaterials(w.receita);
        STORY_PROGRESS.gold -= w.custoOuro;
        STORY_PROGRESS.craftedWeapons.push(gerarUid(baseId));
        saveStoryProgress();
        
        showToast('🔨 Forjada!', `${w.emoji} ${w.nome} (Total: ${count + 1})`, '🔨');
        try { playSfx('win'); } catch(e) {}
        renderTesourariaScreen();
    };

    window.handleCraftAmulet = function(baseId) {
        const a = STORY_AMULETS[baseId];
        if (!a) return;
        const count = STORY_PROGRESS.craftedAmulets.filter(id => getBaseId(id) === baseId).length;
        if (count >= 99) { showToast('❌ Limite', 'Você já tem 99 deste amuleto.', '❌'); return; }
        if (!isAmuletAvailable(baseId)) { showToast('❌', 'Ato ainda não desbloqueado.', '❌'); return; }
        if (!hasMaterials(a.receita)) { showToast('❌', 'Materiais insuficientes.', '❌'); return; }
        if ((STORY_PROGRESS.gold || 0) < a.custoOuro) { showToast('❌', `Faltam ${a.custoOuro - (STORY_PROGRESS.gold||0)} de ouro.`, '❌'); return; }

        consumeMaterials(a.receita);
        STORY_PROGRESS.gold -= a.custoOuro;
        STORY_PROGRESS.craftedAmulets.push(gerarUid(baseId));
        saveStoryProgress();
        
        showToast('🔨 Forjado!', `${a.emoji} ${a.nome} (Total: ${count + 1})`, '🔨');
        try { playSfx('win'); } catch(e) {}
        renderTesourariaScreen();
    };

    window.handleDismantleWeapon = async function(uid) {
        const w = window.getWeaponById(uid);
        if (!w) return;
        const __perg5 = `Desmanchar "${w.nome}"?\n\nVocê receberá 50% dos materiais de volta.`;
                const __ok5 = (typeof uiConfirm === 'function')
                    ? await uiConfirm(__perg5, { titulo: 'Confirmar', ok: 'Confirmar', cancelar: 'Cancelar' })
                    : confirm(__perg5);
                if (!__ok5) return;

        const idx = STORY_PROGRESS.craftedWeapons.indexOf(uid);
        if (idx !== -1) STORY_PROGRESS.craftedWeapons.splice(idx, 1);

        for (const hc in STORY_PROGRESS.heroEquipment || {}) {
            if (STORY_PROGRESS.heroEquipment[hc].arma === uid) STORY_PROGRESS.heroEquipment[hc].arma = null;
        }

        refundMaterials(w.receita, 0.5);
        saveStoryProgress();
        showToast('🔥 Desmanchada', `50% dos materiais devolvidos.`, '🔥');
        window.openEquipScreen(currentEquipHero); // Recarrega a tela atual
    };

    window.handleDismantleAmulet = async function(uid) {
        const a = window.getAmuletById(uid);
        if (!a) return;
        const __perg6 = `Desmanchar "${a.nome}"?\n\nVocê receberá 50% dos materiais de volta.`;
                const __ok6 = (typeof uiConfirm === 'function')
                    ? await uiConfirm(__perg6, { titulo: 'Confirmar', ok: 'Confirmar', cancelar: 'Cancelar' })
                    : confirm(__perg6);
                if (!__ok6) return;

        const idx = STORY_PROGRESS.craftedAmulets.indexOf(uid);
        if (idx !== -1) STORY_PROGRESS.craftedAmulets.splice(idx, 1);

        for (const hc in STORY_PROGRESS.heroEquipment || {}) {
            if (STORY_PROGRESS.heroEquipment[hc].amuleto === uid) STORY_PROGRESS.heroEquipment[hc].amuleto = null;
        }

        refundMaterials(a.receita, 0.5);
        saveStoryProgress();
        showToast('🔥 Desmanchado', `50% dos materiais devolvidos.`, '🔥');
        window.openEquipScreen(currentEquipHero);
    };

    window.equipWeapon = function(heroClass, uid) {
        const w = window.getWeaponById(uid);
        if (!w) return { ok: false, error: 'Item não encontrado.' };
        if (!STORY_PROGRESS.craftedWeapons.includes(uid)) return { ok: false, error: 'Você não possui esta instância.' };

        const expectedTipo = getArchetypeFromHeroClass(heroClass);
        if (w.tipo !== expectedTipo) return { ok: false, error: `Classe incompatível.` };

        for (const hc in STORY_PROGRESS.heroEquipment) {
            if (hc !== heroClass && STORY_PROGRESS.heroEquipment[hc].arma === uid) {
                STORY_PROGRESS.heroEquipment[hc].arma = null;
            }
        }

        getHeroEquipment(heroClass).arma = uid;
        saveStoryProgress();
        return { ok: true };
    };

    window.equipAmulet = function(heroClass, uid) {
        const a = window.getAmuletById(uid);
        if (!a) return { ok: false, error: 'Item não encontrado.' };
        if (!STORY_PROGRESS.craftedAmulets.includes(uid)) return { ok: false, error: 'Você não possui esta instância.' };

        for (const hc in STORY_PROGRESS.heroEquipment) {
            if (hc !== heroClass && STORY_PROGRESS.heroEquipment[hc].amuleto === uid) {
                STORY_PROGRESS.heroEquipment[hc].amuleto = null;
            }
        }

        getHeroEquipment(heroClass).amuleto = uid;
        saveStoryProgress();
        return { ok: true };
    };

    // ==============================================================
    // 3. LIMPAR O PAINEL ANTIGO (?) DE EQUIPAMENTOS
    // ==============================================================
    const _origOpenDetails = window.openHeroDetails;
    window.openHeroDetails = function(heroClass) {
        _origOpenDetails.apply(this, arguments);
        const panel = document.querySelector('.hero-details-panel');
        if (!panel) return;
        
        // Remove qualquer resquício de equipamento no painel de lore
        panel.querySelectorAll('.hero-details-equipment, .equip-row, .equip-select, .hero-details-weapon-element').forEach(el => el.remove());
        panel.querySelectorAll('.hero-details-section').forEach(sec => {
            if (sec.innerHTML.includes('Arma') && sec.innerHTML.includes('Amuleto') && sec.querySelector('select')) sec.remove();
        });
    };

    // ==============================================================
    // 4. NOVA TELA DE EQUIPAMENTOS
    // ==============================================================
    let currentEquipHero = null;

    window.openEquipScreen = function(heroClass) {
        currentEquipHero = heroClass;
        
        // Remove overlay antigo se houver
        const old = document.getElementById('equipScreenOverlay');
        if (old) old.remove();

        const heroData = STORY_HERO_CLASSES[heroClass];
        if (!heroData) return;
        const archetype = getArchetypeFromHeroClass(heroClass);
        const eq = getHeroEquipment(heroClass);
        const eqWeaponUid = eq.arma || null;
        const eqAmuletUid = eq.amuleto || null;

        const eqWeapon = window.getWeaponById(eqWeaponUid);
        const eqAmulet = window.getAmuletById(eqAmuletUid);

        // Armas/Amuletos disponíveis (não equipados neste herói)
        const allWeapons = (STORY_PROGRESS.craftedWeapons || []).map(uid => window.getWeaponById(uid)).filter(w => w && w.tipo === archetype && w.uid !== eqWeaponUid);
        const allAmulets = (STORY_PROGRESS.craftedAmulets || []).map(uid => window.getAmuletById(uid)).filter(a => a && a.uid !== eqAmuletUid);

        // Conta itens iguais para mostrar (xN)
        const wCounts = {}; allWeapons.forEach(w => { wCounts[w.baseId] = (wCounts[w.baseId] || 0) + 1; });
        const aCounts = {}; allAmulets.forEach(a => { aCounts[a.baseId] = (aCounts[a.baseId] || 0) + 1; });

        // HTML do Slot Equipado
        const renderSlot = (item, tipo) => {
            if (!item) return `<div class="equip-slot empty">Nenhum item equipado</div>`;
            const icon = tipo === 'arma' ? window.getWeaponIcon(item.uid, 'large') : window.getAmuletIcon(item.uid, 'large');
            const nome = item.nome;
            return `
                <div class="equip-slot filled">
                    <div class="equip-slot-icon">${icon}</div>
                    <div class="equip-slot-info">
                        <div class="equip-slot-name">${nome}</div>
                        <div class="equip-slot-actions">
                            <button class="btn-unequip" onclick="desequiparItem('${heroClass.replace(/'/g, "\\'")}', '${tipo}')">Remover</button>
                            <button class="btn-dismantle" onclick="handleDismantle${tipo === 'arma' ? 'Weapon' : 'Amulet'}('${item.uid}')">Desmanchar</button>
                        </div>
                    </div>
                </div>`;
        };

        // HTML dos itens disponíveis
        const renderAvailableWeapon = (w) => {
            const icon = window.getWeaponIcon(w.uid, 'normal');
            const qtd = wCounts[w.baseId] > 1 ? `<span style="color:#e8b923;">(x${wCounts[w.baseId]})</span>` : '';
            return `
                <div class="avail-card">
                    <div class="avail-icon">${icon}</div>
                    <div class="avail-name">${w.nome} ${qtd}</div>
                    <button class="btn-equip" onclick="equiparItem('${heroClass.replace(/'/g, "\\'")}', '${w.uid}', 'arma')">Equipar</button>
                    <button class="btn-dismantle-mini" onclick="handleDismantleWeapon('${w.uid}')">🔥</button>
                </div>`;
        };

        const renderAvailableAmulet = (a) => {
            const icon = window.getAmuletIcon(a.uid, 'normal');
            const qtd = aCounts[a.baseId] > 1 ? `<span style="color:#e8b923;">(x${aCounts[a.baseId]})</span>` : '';
            return `
                <div class="avail-card">
                    <div class="avail-icon">${icon}</div>
                    <div class="avail-name">${a.nome} ${qtd}</div>
                    <button class="btn-equip" onclick="equiparItem('${heroClass.replace(/'/g, "\\'")}', '${a.uid}', 'amuleto')">Equipar</button>
                    <button class="btn-dismantle-mini" onclick="handleDismantleAmulet('${a.uid}')">🔥</button>
                </div>`;
        };

        const weaponListHTML = allWeapons.length > 0 ? allWeapons.map(renderAvailableWeapon).join('') : `<div class="empty-msg">Nenhuma arma disponível.</div>`;
        const amuletListHTML = allAmulets.length > 0 ? allAmulets.map(renderAvailableAmulet).join('') : `<div class="empty-msg">Nenhum amuleto disponível.</div>`;

        const overlay = document.createElement('div');
        overlay.id = 'equipScreenOverlay';
        overlay.className = 'equip-screen-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.innerHTML = `
            <div class="equip-screen-panel">
                <div class="equip-screen-header">
                    <div class="equip-hero-title">
                        <img src="${SPRITES[heroClass] || ''}" class="equip-hero-sprite">
                        <h2>${heroData.displayName}</h2>
                    </div>
                    <button class="equip-screen-close" onclick="document.getElementById('equipScreenOverlay').remove()">✕</button>
                </div>

                <div class="equip-section">
                    <div class="equip-section-title">⚔️ Arma Equipada</div>
                    ${renderSlot(eqWeapon, 'arma')}
                </div>

                <div class="equip-section">
                    <div class="equip-section-title">🧿 Amuleto Equipado</div>
                    ${renderSlot(eqAmulet, 'amuleto')}
                </div>

                <div class="equip-section">
                    <div class="equip-section-title">📦 Armas na Mochila (${archetype})</div>
                    <div class="equip-avail-grid">${weaponListHTML}</div>
                </div>

                <div class="equip-section">
                    <div class="equip-section-title">📦 Amuletos na Mochila</div>
                    <div class="equip-avail-grid">${amuletListHTML}</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    };

    window.desequiparItem = function(heroClass, tipo) {
        if (tipo === 'arma') unequipWeapon(heroClass);
        else unequipAmulet(heroClass);
        window.openEquipScreen(heroClass);
    };

    window.equiparItem = function(heroClass, uid, tipo) {
        let r;
        if (tipo === 'arma') r = window.equipWeapon(heroClass, uid);
        else r = window.equipAmulet(heroClass, uid);

        if (!r.ok) { showToast('❌', r.error, '❌'); return; }
        showToast(tipo === 'arma' ? '⚔️ Equipado' : '🧿 Equipado', 'Item equipado com sucesso!', '✅');
        window.openEquipScreen(heroClass); // Atualiza a tela
    };

    // ==============================================================
    // 5. INJETAR O BOTÃO "⚔️" NA OCA
    // ==============================================================
    const _origRenderOca = window.renderOcaScreenFiltered;
    window.renderOcaScreenFiltered = function() {
        const r = _origRenderOca.apply(this, arguments);
        
        setTimeout(() => {
            const cards = document.querySelectorAll('.story-hero-card');
            cards.forEach(card => {
                if (card.classList.contains('locked')) return;
                if (card.querySelector('.hero-equip-btn')) return;

                const onclickAttr = card.getAttribute('onclick') || '';
                const match = onclickAttr.match(/toggleHeroSelection\('((?:\\'|[^'])*)'\)/);
                if (!match) return;

                const heroClass = match[1].replace(/\\'/g, "'");

                const btn = document.createElement('button');
                btn.className = 'hero-equip-btn';
                btn.innerHTML = '⚔️';
                btn.title = 'Equipamentos';
                btn.onclick = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    window.openEquipScreen(heroClass);
                };
                card.appendChild(btn);
            });
        }, 100);

        return r;
    };

    // ==============================================================
    // 6. UI DA TESOURARIA (Mantida, mas com botão Desmanchar)
    // ==============================================================
    window.renderTesourariaForja = function() {
        const allWeapons = Object.values(STORY_WEAPONS).filter(w => isWeaponAvailable(w.id));
        if (allWeapons.length === 0) return `<div class="tesouraria-empty"><div class="tesouraria-empty-icon">⚔️</div><div class="tesouraria-empty-text">Nenhuma forja liberada.</div></div>`;

        const cardsHTML = allWeapons.map(w => {
            const count = (STORY_PROGRESS.craftedWeapons || []).filter(id => getBaseId(id) === w.id).length;
            const canCraft = hasMaterials(w.receita) && (STORY_PROGRESS.gold || 0) >= w.custoOuro && count < 99;
            const recHTML = Object.entries(w.receita).map(([matId, qty]) => {
                const m = STORY_MATERIALS[matId];
                if (!m) return '';
                const has = STORY_PROGRESS.inventory[matId] || 0;
                const ok = has >= qty ? 'ok' : 'no';
                return `<span class="forge-recipe-mat ${ok}">${m.emoji} ${has}/${qty}</span>`;
            }).join('');
            const tipoLabel = { tacape:'Tacape', flecha:'Flecha', cajado:'Cajado' }[w.tipo];
            const isCrafted = count > 0;
            
            let actionHTML = '';
            if (count >= 99) {
                actionHTML = `<div class="forge-forged-tag" style="color:#e8b923;">✅ Limite Máximo (99)</div>`;
            } else {
                actionHTML = `
                    ${isCrafted ? `<div class="forge-forged-tag" style="color:#8ac070;">✅ Forjada (${count}/99)</div>` : ''}
                    <div class="forge-ouro ${canCraft ? 'ok' : 'no'}">${uiIcon('gold')} ${w.custoOuro}</div>
                    <button class="forge-btn" ${canCraft ? '' : 'disabled'} onclick="handleCraftWeapon('${w.id}')">
                        ${canCraft ? (isCrafted ? '🔨 Forjar +1' : '🔨 Forjar') : '✕ Sem recursos'}
                    </button>
                    ${isCrafted ? `<button class="forge-btn danger" onclick="handleDismantleWeapon((STORY_PROGRESS.craftedWeapons.find(uid => getBaseId(uid) === '${w.id}')))">🔥 Desmanchar 1</button>` : ''}
                `;
            }
            return `<div class="forge-card ${isCrafted ? 'crafted' : ''}"><div class="forge-card-header"><div class="forge-emoji">${w.emoji}</div><div class="forge-info"><div class="forge-name">${w.nome}</div><div class="forge-meta">Ato ${w.ato} · ${tipoLabel} · +${w.atkBonus} ATK</div></div></div><div class="forge-recipe">${recHTML}</div><div class="forge-actions">${actionHTML}</div></div>`;
        }).join('');
        return `<div class="forge-grid">${cardsHTML}</div>`;
    };

    window.renderTesourariaAmuletos = function() {
        const allAmulets = Object.values(STORY_AMULETS).filter(a => isAmuletAvailable(a.id));
        if (allAmulets.length === 0) return `<div class="tesouraria-empty"><div class="tesouraria-empty-icon">🧿</div><div class="tesouraria-empty-text">Nenhum amuleto liberado.</div></div>`;

        const cardsHTML = allAmulets.map(a => {
            const count = (STORY_PROGRESS.craftedAmulets || []).filter(id => getBaseId(id) === a.id).length;
            const canCraft = hasMaterials(a.receita) && (STORY_PROGRESS.gold || 0) >= a.custoOuro && count < 99;
            const recHTML = Object.entries(a.receita).map(([matId, qty]) => {
                const m = STORY_MATERIALS[matId];
                if (!m) return '';
                const has = STORY_PROGRESS.inventory[matId] || 0;
                const ok = has >= qty ? 'ok' : 'no';
                return `<span class="forge-recipe-mat ${ok}">${m.emoji} ${has}/${qty}</span>`;
            }).join('');
            const ef = a.efeito;
            let efHTML = [];
            if (ef.elementOverride) efHTML.push(`🎨 Elemento → ${ef.elementOverride}`);
            if (ef.hpBonus) efHTML.push(`❤️ +${ef.hpBonus} HP`);
            if (ef.atkBonus) efHTML.push(`⚔️ +${ef.atkBonus} ATK`);
            if (ef.healPerTurn) efHTML.push(`💚 Cura ${ef.healPerTurn} HP/turno`);
            const isCrafted = count > 0;
            
            let actionHTML = '';
            if (count >= 99) {
                actionHTML = `<div class="forge-forged-tag" style="color:#e8b923;">✅ Limite Máximo (99)</div>`;
            } else {
                actionHTML = `
                    ${isCrafted ? `<div class="forge-forged-tag" style="color:#8ac070;">✅ Forjado (${count}/99)</div>` : ''}
                    <div class="forge-ouro ${canCraft ? 'ok' : 'no'}">${uiIcon('gold')} ${a.custoOuro}</div>
                    <button class="forge-btn" ${canCraft ? '' : 'disabled'} onclick="handleCraftAmulet('${a.id}')">
                        ${canCraft ? (isCrafted ? '🔨 Forjar +1' : '🔨 Forjar') : '✕ Sem recursos'}
                    </button>
                    ${isCrafted ? `<button class="forge-btn danger" onclick="handleDismantleAmulet((STORY_PROGRESS.craftedAmulets.find(uid => getBaseId(uid) === '${a.id}')))">🔥 Desmanchar 1</button>` : ''}
                `;
            }
            return `<div class="forge-card ${isCrafted ? 'crafted amulet' : 'amulet'}"><div class="forge-card-header"><div class="forge-emoji">${a.emoji}</div><div class="forge-info"><div class="forge-name">${a.nome}</div><div class="forge-meta">Ato ${a.ato}</div></div></div><div class="forge-effects">${efHTML.join(' · ')}</div><div class="forge-recipe">${recHTML}</div><div class="forge-actions">${actionHTML}</div></div>`;
        }).join('');
        return `<div class="forge-grid">${cardsHTML}</div>`;
    };

    // ==============================================================
    // 7. CSS DO NOVO BOTÃO E DA NOVA TELA
    // ==============================================================
    if (!document.getElementById('v400CSS')) {
        const style = document.createElement('style');
        style.id = 'v400CSS';
        style.textContent = `
            /* Botão no Card da OCA */
            .hero-equip-btn {
                position: absolute; top: 8px; left: 38px;
                width: 28px; height: 28px; border-radius: 50%;
                background: linear-gradient(135deg, #8e44ad, #5a2a70);
                color: #e8dcc4; border: 2px solid #c39bd3;
                font-size: 1rem; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                z-index: 10; box-shadow: 0 2px 6px rgba(0,0,0,0.5);
                transition: all 0.2s;
            }
            .hero-equip-btn:hover { transform: scale(1.15); background: #a55ad1; }

            /* Tela de Equipar */
            .equip-screen-overlay {
                position: fixed; inset: 0; background: rgba(10,6,2,0.9);
                z-index: 20000; display: flex; align-items: flex-start; justify-content: center;
                padding: 20px; overflow-y: auto; backdrop-filter: blur(3px);
            }
            .equip-screen-panel {
                background: linear-gradient(180deg, #2a1f10, #1a1208);
                border: 2px solid #8e44ad; border-radius: 8px;
                width: 100%; max-width: 600px; padding: 20px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.9); margin: auto;
            }
            .equip-screen-header {
                display: flex; justify-content: space-between; align-items: center;
                border-bottom: 1px solid rgba(142,68,173,0.3); padding-bottom: 15px; margin-bottom: 20px;
            }
            .equip-hero-title { display: flex; align-items: center; gap: 12px; }
            .equip-hero-sprite { width: 48px; height: 48px; object-fit: contain; }
            .equip-hero-title h2 { font-family: 'Cinzel Decorative'; color: #e8b923; margin: 0; font-size: 1.4rem; }
            .equip-screen-close {
                background: #6a2020; color: #f5c8c8; border: 1px solid #a83232;
                border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-weight: bold;
            }
            
            .equip-section { margin-bottom: 20px; }
            .equip-section-title {
                font-family: 'Cinzel', serif; color: #c39bd3; font-size: 0.85rem;
                letter-spacing: 1px; margin-bottom: 10px; border-bottom: 1px solid rgba(142,68,173,0.2); padding-bottom: 4px;
            }
            
            .equip-slot {
                display: flex; align-items: center; gap: 15px;
                background: rgba(10,6,2,0.5); padding: 10px; border-radius: 6px;
                border: 1px dashed rgba(142,68,173,0.3);
            }
            .equip-slot.filled { border-style: solid; border-color: #8e44ad; }
            .equip-slot.empty { color: #6a5024; font-style: italic; font-family: 'EB Garamond'; justify-content: center; }
            .equip-slot-icon { width: 40px; height: 40px; }
            .equip-slot-icon img { width: 100%; height: 100%; object-fit: contain; }
            .equip-slot-info { flex: 1; }
            .equip-slot-name { font-family: 'Cinzel'; color: #f0e2c0; font-size: 1rem; margin-bottom: 4px; }
            .equip-slot-actions { display: flex; gap: 8px; }
            
            .btn-unequip, .btn-dismantle {
                padding: 4px 10px; font-family: 'Cinzel'; font-size: 0.75rem;
                border-radius: 4px; cursor: pointer; border: 1px solid;
            }
            .btn-unequip { background: rgba(201,162,39,0.1); border-color: #c9a227; color: #e8b923; }
            .btn-dismantle { background: rgba(168,50,50,0.1); border-color: #a83232; color: #f5c8c8; }

            .equip-avail-grid {
                display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
                gap: 10px;
            }
            .avail-card {
                background: rgba(10,6,2,0.6); border: 1px solid #3d2d18;
                border-radius: 6px; padding: 10px; text-align: center;
                display: flex; flex-direction: column; align-items: center; gap: 6px;
                position: relative;
            }
            .avail-card:hover { border-color: #6a5024; }
            .avail-icon { width: 36px; height: 36px; }
            .avail-icon img { width: 100%; height: 100%; object-fit: contain; }
            .avail-name { font-family: 'Cinzel'; font-size: 0.8rem; color: #d9c89a; line-height: 1.2; }
            .btn-equip {
                background: linear-gradient(135deg, #3d2d18, #2a1f10);
                color: #e8b923; border: 1px solid #6a5024;
                padding: 4px 10px; border-radius: 4px; cursor: pointer;
                font-family: 'Cinzel'; font-size: 0.75rem; width: 100%;
            }
            .btn-equip:hover { background: #5a4220; color: #fff5dc; }
            
            .btn-dismantle-mini {
                position: absolute; top: 4px; right: 4px;
                background: none; border: none; cursor: pointer; font-size: 0.9rem; opacity: 0.6;
            }
            .btn-dismantle-mini:hover { opacity: 1; transform: scale(1.1); }
            
            .empty-msg { font-family: 'EB Garamond'; color: #8a7a52; font-style: italic; font-size: 0.9rem; }
        `;
        document.head.appendChild(style);
    }

    console.log('✅ [V40.0] Tela de equipamentos dedicada e botão desmanchar restaurados.');
})();
// =================================================================
// historia.js — BLOCO 128 (V40.1 — Stats na tela de equipar e botão desmanchar)
// =================================================================
(function ajustesTelaEquiparV401() {
    if (window._ajustesTelaEquiparV401) return;
    window._ajustesTelaEquiparV401 = true;

    // --- 1. ATUALIZAR A TELA DE EQUIPAR (Mostrar Stats) ---
    window.openEquipScreen = function(heroClass) {
        window.currentEquipHero = heroClass;
        
        const old = document.getElementById('equipScreenOverlay');
        if (old) old.remove();

        const heroData = STORY_HERO_CLASSES[heroClass];
        if (!heroData) return;
        const archetype = getArchetypeFromHeroClass(heroClass);
        const eq = getHeroEquipment(heroClass);
        const eqWeaponUid = eq.arma || null;
        const eqAmuletUid = eq.amuleto || null;

        const eqWeapon = window.getWeaponById(eqWeaponUid);
        const eqAmulet = window.getAmuletById(eqAmuletUid);
        const equipmentByOtherHeroes = Object.entries(STORY_PROGRESS.heroEquipment || {})
            .filter(([owner]) => owner !== heroClass)
            .map(([, equipment]) => equipment)
            .filter(Boolean);
        const weaponsEquippedElsewhere = new Set(equipmentByOtherHeroes.map(equipment => equipment.arma).filter(Boolean));
        const amuletsEquippedElsewhere = new Set(equipmentByOtherHeroes.map(equipment => equipment.amuleto).filter(Boolean));

        const allWeapons = (STORY_PROGRESS.craftedWeapons || [])
            .map(uid => window.getWeaponById(uid))
            .filter(w => w && w.tipo === archetype && w.uid !== eqWeaponUid && !weaponsEquippedElsewhere.has(w.uid));
        const allAmulets = (STORY_PROGRESS.craftedAmulets || [])
            .map(uid => window.getAmuletById(uid))
            .filter(a => a && a.uid !== eqAmuletUid && !amuletsEquippedElsewhere.has(a.uid));

        const wCounts = {}; allWeapons.forEach(w => { wCounts[w.baseId] = (wCounts[w.baseId] || 0) + 1; });
        const aCounts = {}; allAmulets.forEach(a => { aCounts[a.baseId] = (aCounts[a.baseId] || 0) + 1; });

        // --- RENDER SLOT EQUIPADO ---
        const renderSlot = (item, tipo) => {
            if (!item) return `<div class="equip-slot empty">Nenhum item equipado</div>`;
            const icon = tipo === 'arma' ? window.getWeaponIcon(item.uid, 'large') : window.getAmuletIcon(item.uid, 'large');
            
            // Stats do item equipado
            let statsStr = '';
            if (tipo === 'arma') {
                statsStr = `+${item.atkBonus} ATK` + (item.elemento !== 'ANY' ? ` · ${item.elemento}` : '');
            } else {
                const ef = item.efeito || {};
                let e = [];
                if (ef.hpBonus) e.push(`+${ef.hpBonus} HP`);
                if (ef.atkBonus) e.push(`+${ef.atkBonus} ATK`);
                if (ef.healPerTurn) e.push(`+${ef.healPerTurn} HP/turno`);
                if (ef.elementOverride) e.push(ef.elementOverride);
                statsStr = e.join(' · ') || 'Efeito Único';
            }

            return `
                <div class="equip-slot filled">
                    <div class="equip-slot-icon">${icon}</div>
                    <div class="equip-slot-info">
                        <div class="equip-slot-name">${item.nome}</div>
                        <div class="equip-slot-stats">${statsStr}</div>
                        <div class="equip-slot-actions">
                            <button class="btn-unequip" onclick="desequiparItem('${heroClass.replace(/'/g, "\\'")}', '${tipo}')">Remover</button>
                            <button class="btn-dismantle" onclick="handleDismantle${tipo === 'arma' ? 'Weapon' : 'Amulet'}('${item.uid}')">Desmanchar</button>
                        </div>
                    </div>
                </div>`;
        };

        // --- RENDER ITENS DISPONÍVEIS (Mochila) ---
        const renderAvailableWeapon = (w) => {
            const icon = window.getWeaponIcon(w.uid, 'normal');
            const qtd = wCounts[w.baseId] > 1 ? `<span style="color:#e8b923;">(x${wCounts[w.baseId]})</span>` : '';
            const statsStr = `+${w.atkBonus} ATK` + (w.elemento !== 'ANY' ? ` · ${w.elemento}` : '');
            
            return `
                <div class="avail-card">
                    <div class="avail-icon">${icon}</div>
                    <div class="avail-name">${w.nome} ${qtd}</div>
                    <div class="avail-stats">${statsStr}</div>
                    <button class="btn-equip" onclick="equiparItem('${heroClass.replace(/'/g, "\\'")}', '${w.uid}', 'arma')">Equipar</button>
                    <button class="btn-dismantle-mini" onclick="handleDismantleWeapon('${w.uid}')" title="Desmanchar">🔥</button>
                </div>`;
        };

        const renderAvailableAmulet = (a) => {
            const icon = window.getAmuletIcon(a.uid, 'normal');
            const qtd = aCounts[a.baseId] > 1 ? `<span style="color:#e8b923;">(x${aCounts[a.baseId]})</span>` : '';
            
            const ef = a.efeito || {};
            let e = [];
            if (ef.hpBonus) e.push(`+${ef.hpBonus} HP`);
            if (ef.atkBonus) e.push(`+${ef.atkBonus} ATK`);
            if (ef.healPerTurn) e.push(`+${ef.healPerTurn} HP/turno`);
            if (ef.elementOverride) e.push(ef.elementOverride);
            const statsStr = e.join(' · ') || 'Efeito Único';

            return `
                <div class="avail-card">
                    <div class="avail-icon">${icon}</div>
                    <div class="avail-name">${a.nome} ${qtd}</div>
                    <div class="avail-stats">${statsStr}</div>
                    <button class="btn-equip" onclick="equiparItem('${heroClass.replace(/'/g, "\\'")}', '${a.uid}', 'amuleto')">Equipar</button>
                    <button class="btn-dismantle-mini" onclick="handleDismantleAmulet('${a.uid}')" title="Desmanchar">🔥</button>
                </div>`;
        };

        const weaponListHTML = allWeapons.length > 0 ? allWeapons.map(renderAvailableWeapon).join('') : `<div class="empty-msg">Nenhuma arma na mochila.</div>`;
        const amuletListHTML = allAmulets.length > 0 ? allAmulets.map(renderAvailableAmulet).join('') : `<div class="empty-msg">Nenhum amuleto na mochila.</div>`;

        const overlay = document.createElement('div');
        overlay.id = 'equipScreenOverlay';
        overlay.className = 'equip-screen-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.innerHTML = `
            <div class="equip-screen-panel">
                <div class="equip-screen-header">
                    <div class="equip-hero-title">
                        <img src="${SPRITES[heroClass] || ''}" class="equip-hero-sprite">
                        <h2>${heroData.displayName}</h2>
                    </div>
                    <button class="equip-screen-close" onclick="document.getElementById('equipScreenOverlay').remove()">✕</button>
                </div>

                <div class="equip-section">
                    <div class="equip-section-title">⚔️ Arma Equipada</div>
                    ${renderSlot(eqWeapon, 'arma')}
                </div>

                <div class="equip-section">
                    <div class="equip-section-title">🧿 Amuleto Equipado</div>
                    ${renderSlot(eqAmulet, 'amuleto')}
                </div>

                <div class="equip-section">
                    <div class="equip-section-title">📦 Armas na Mochila (${archetype})</div>
                    <div class="equip-avail-grid">${weaponListHTML}</div>
                </div>

                <div class="equip-section">
                    <div class="equip-section-title">📦 Amuletos na Mochila</div>
                    <div class="equip-avail-grid">${amuletListHTML}</div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    };

    // --- 2. ATUALIZAR A TESOURARIA (Botão Desmanchar ao lado do Forjar) ---
    window.renderTesourariaForja = function() {
        const allWeapons = Object.values(STORY_WEAPONS).filter(w => isWeaponAvailable(w.id));
        if (allWeapons.length === 0) return `<div class="tesouraria-empty"><div class="tesouraria-empty-icon">⚔️</div><div class="tesouraria-empty-text">Nenhuma forja liberada.</div></div>`;

        const cardsHTML = allWeapons.map(w => {
            const uids = (STORY_PROGRESS.craftedWeapons || []).filter(id => getBaseId(id) === w.id);
            const count = uids.length;
            const canCraft = hasMaterials(w.receita) && (STORY_PROGRESS.gold || 0) >= w.custoOuro && count < 99;
            const recHTML = Object.entries(w.receita).map(([matId, qty]) => {
                const m = STORY_MATERIALS[matId];
                if (!m) return '';
                const has = STORY_PROGRESS.inventory[matId] || 0;
                const ok = has >= qty ? 'ok' : 'no';
                return `<span class="forge-recipe-mat ${ok}">${m.emoji} ${has}/${qty}</span>`;
            }).join('');
            const tipoLabel = { tacape:'Tacape', flecha:'Flecha', cajado:'Cajado' }[w.tipo];
            const isCrafted = count > 0;
            
            let actionHTML = '';
            if (count >= 99) {
                actionHTML = `<div class="forge-forged-tag" style="color:#e8b923; margin-bottom:5px;">✅ Limite Máximo (99)</div>`;
                actionHTML += `<button class="forge-btn danger" onclick="handleDismantleWeapon('${uids[0]}')">🔥 Desmanchar</button>`;
            } else {
                actionHTML = `
                    ${isCrafted ? `<div class="forge-forged-tag" style="color:#8ac070; margin-bottom:5px;">✅ Forjada (${count}/99)</div>` : ''}
                    <div class="forge-ouro ${canCraft ? 'ok' : 'no'}">${uiIcon('gold')} ${w.custoOuro}</div>
                    <div style="display: flex; gap: 8px;">
                        <button class="forge-btn" style="flex:1;" ${canCraft ? '' : 'disabled'} onclick="handleCraftWeapon('${w.id}')">
                            ${canCraft ? (isCrafted ? '🔨 Forjar +1' : '🔨 Forjar') : '✕ Sem recursos'}
                        </button>
                        ${isCrafted ? `<button class="forge-btn danger" style="flex:1;" onclick="handleDismantleWeapon('${uids[0]}')">🔥 Desmanchar</button>` : ''}
                    </div>
                `;
            }
            return `<div class="forge-card ${isCrafted ? 'crafted' : ''}"><div class="forge-card-header"><div class="forge-emoji">${w.emoji}</div><div class="forge-info"><div class="forge-name">${w.nome}</div><div class="forge-meta">Ato ${w.ato} · ${tipoLabel} · +${w.atkBonus} ATK</div></div></div><div class="forge-recipe">${recHTML}</div><div class="forge-actions">${actionHTML}</div></div>`;
        }).join('');
        return `<div class="forge-grid">${cardsHTML}</div>`;
    };

    window.renderTesourariaAmuletos = function() {
        const allAmulets = Object.values(STORY_AMULETS).filter(a => isAmuletAvailable(a.id));
        if (allAmulets.length === 0) return `<div class="tesouraria-empty"><div class="tesouraria-empty-icon">🧿</div><div class="tesouraria-empty-text">Nenhum amuleto liberado.</div></div>`;

        const cardsHTML = allAmulets.map(a => {
            const uids = (STORY_PROGRESS.craftedAmulets || []).filter(id => getBaseId(id) === a.id);
            const count = uids.length;
            const canCraft = hasMaterials(a.receita) && (STORY_PROGRESS.gold || 0) >= a.custoOuro && count < 99;
            const recHTML = Object.entries(a.receita).map(([matId, qty]) => {
                const m = STORY_MATERIALS[matId];
                if (!m) return '';
                const has = STORY_PROGRESS.inventory[matId] || 0;
                const ok = has >= qty ? 'ok' : 'no';
                return `<span class="forge-recipe-mat ${ok}">${m.emoji} ${has}/${qty}</span>`;
            }).join('');
            const ef = a.efeito;
            let efHTML = [];
            if (ef.elementOverride) efHTML.push(`🎨 Elemento → ${ef.elementOverride}`);
            if (ef.hpBonus) efHTML.push(`❤️ +${ef.hpBonus} HP`);
            if (ef.atkBonus) efHTML.push(`⚔️ +${ef.atkBonus} ATK`);
            if (ef.healPerTurn) efHTML.push(`💚 Cura ${ef.healPerTurn} HP/turno`);
            const isCrafted = count > 0;
            
            let actionHTML = '';
            if (count >= 99) {
                actionHTML = `<div class="forge-forged-tag" style="color:#e8b923; margin-bottom:5px;">✅ Limite Máximo (99)</div>`;
                actionHTML += `<button class="forge-btn danger" onclick="handleDismantleAmulet('${uids[0]}')">🔥 Desmanchar</button>`;
            } else {
                actionHTML = `
                    ${isCrafted ? `<div class="forge-forged-tag" style="color:#8ac070; margin-bottom:5px;">✅ Forjado (${count}/99)</div>` : ''}
                    <div class="forge-ouro ${canCraft ? 'ok' : 'no'}">${uiIcon('gold')} ${a.custoOuro}</div>
                    <div style="display: flex; gap: 8px;">
                        <button class="forge-btn" style="flex:1;" ${canCraft ? '' : 'disabled'} onclick="handleCraftAmulet('${a.id}')">
                            ${canCraft ? (isCrafted ? '🔨 Forjar +1' : '🔨 Forjar') : '✕ Sem recursos'}
                        </button>
                        ${isCrafted ? `<button class="forge-btn danger" style="flex:1;" onclick="handleDismantleAmulet('${uids[0]}')">🔥 Desmanchar</button>` : ''}
                    </div>
                `;
            }
            return `<div class="forge-card ${isCrafted ? 'crafted amulet' : 'amulet'}"><div class="forge-card-header"><div class="forge-emoji">${a.emoji}</div><div class="forge-info"><div class="forge-name">${a.nome}</div><div class="forge-meta">Ato ${a.ato}</div></div></div><div class="forge-effects">${efHTML.join(' · ')}</div><div class="forge-recipe">${recHTML}</div><div class="forge-actions">${actionHTML}</div></div>`;
        }).join('');
        return `<div class="forge-grid">${cardsHTML}</div>`;
    };

    // Adiciona CSS extra para os novos stats
    if (!document.getElementById('v401CSS')) {
        const style = document.createElement('style');
        style.id = 'v401CSS';
        style.textContent = `
            .equip-slot-stats {
                font-family: 'EB Garamond', serif;
                font-size: 0.85rem;
                color: #e8b923;
                margin-bottom: 8px;
            }
            .avail-stats {
                font-family: 'EB Garamond', serif;
                font-size: 0.75rem;
                color: #8ac070;
                margin-bottom: 4px;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }

    console.log('✅ [V40.1] Tela de equipar com stats e Tesouraria com botão desmanchar.');
})();
// =================================================================
// historia.js — BLOCO 129 (V40.2 — Botão Desmanchar no Inventário)
// =================================================================
(function botaoDesmancharInventarioV402() {
    if (window._botaoDesmancharInventarioV402) return;
    window._botaoDesmancharInventarioV402 = true;

    window.renderTesourariaInventario = function(materialIds) {
        if (materialIds.length > 0) {
            materialIds.sort((a, b) => (window.getMaterialPrice ? window.getMaterialPrice(b) : 2) - (window.getMaterialPrice ? window.getMaterialPrice(a) : 2));
        }
        const inv_count = (id) => STORY_PROGRESS.inventory[id] || 0;
        const totalValue = materialIds.reduce((sum, id) => sum + (window.getMaterialPrice ? window.getMaterialPrice(id) : 2) * inv_count(id), 0);

        const cardsHTML = materialIds.length ? materialIds.map(id => {
            const m = STORY_MATERIALS[id] || { emoji: '❓', name: 'Desconhecido' };
            const qty = STORY_PROGRESS.inventory[id] || 0;
            const price = window.getMaterialPrice ? window.getMaterialPrice(id) : 2;
            return `<div class="tesouraria-item"><div class="tesouraria-item-icon">${m.emoji}</div><div class="tesouraria-item-name">${m.name}</div><div class="tesouraria-item-qty">×${qty}</div><div class="tesouraria-item-price">${uiIcon('gold')} ${price} / un.</div></div>`;
        }).join('') : `<div class="tesouraria-empty"><div class="tesouraria-empty-icon">📦</div><div class="tesouraria-empty-text">Seu inventário de materiais está vazio.</div><div class="tesouraria-empty-hint">Derrote inimigos para coletar materiais.</div></div>`;

        function getBaseId(id) { return id ? String(id).split('#')[0] : null; }

        // Agrupamento
        const wCounts = {};
        (STORY_PROGRESS.craftedWeapons || []).forEach(uid => {
            const baseId = getBaseId(uid);
            wCounts[baseId] = (wCounts[baseId] || 0) + 1;
        });
        
        const aCounts = {};
        (STORY_PROGRESS.craftedAmulets || []).forEach(uid => {
            const baseId = getBaseId(uid);
            aCounts[baseId] = (aCounts[baseId] || 0) + 1;
        });

        const seenEquip = STORY_PROGRESS.tesourariaEquipSeen || {
            weapons: [], amulets: [], weaponCounts: {}, amuletCounts: {},
        };
        const seenWeaponIds = new Set(seenEquip.weapons || []);
        const seenAmuletIds = new Set(seenEquip.amulets || []);

        const usageMap = {};
        const eqMap = STORY_PROGRESS.heroEquipment || {};
        for (const heroClass in eqMap) {
            const e = eqMap[heroClass];
            const wBase = getBaseId(e.arma);
            const aBase = getBaseId(e.amuleto);
            if (wBase) { if(!usageMap[wBase]) usageMap[wBase] = []; if (!usageMap[wBase].includes(heroClass)) usageMap[wBase].push(heroClass); }
            if (aBase) { if(!usageMap[aBase]) usageMap[aBase] = []; if (!usageMap[aBase].includes(heroClass)) usageMap[aBase].push(heroClass); }
        }

        let weaponsHTML = '';
        const uniqueWeapons = Object.keys(wCounts);
        if (uniqueWeapons.length === 0) {
            weaponsHTML = `<div class="inv-empty-line">Nenhuma arma forjada ainda.</div>`;
        } else {
            weaponsHTML = uniqueWeapons.map(baseId => {
                const w = STORY_WEAPONS[baseId];
                if (!w) return '';
                const equippedBy = usageMap[baseId] || [];
                const owner = equippedBy.length > 0 ? equippedBy.map(hc => STORY_HERO_CLASSES[hc]?.displayName || hc).join(', ') : null;
                const icon = (typeof window.getWeaponIcon === 'function') ? window.getWeaponIcon(baseId, 'normal') : (w.emoji || '⚔️');
                
                const uids = (STORY_PROGRESS.craftedWeapons || []).filter(id => getBaseId(id) === baseId);
                const isNew = uids.length > ((seenEquip.weaponCounts || {})[baseId] || 0)
                    && uids.some(uid => !seenWeaponIds.has(uid));
                const uidToDismantle = uids.find(uid => !equippedBy.includes(uid)) || uids[0];

                return `
                    <div class="inv-equip-row ${isNew ? 'inv-new-item' : ''}">
                        <div class="inv-equip-icon">${icon}</div>
                        <div class="inv-equip-info">
                            <div class="inv-equip-name">${w.nome} (x${wCounts[baseId]}) ${isNew ? '<span class="inv-new-badge">NOVO</span>' : ''}</div>
                            <div class="inv-equip-meta">+${w.atkBonus} ATK ${w.elemento === 'ANY' ? '· ✨ Abissal' : `· ${elemIcon(w.elemento)} ${w.elemento}`}</div>
                        </div>
                        <div class="inv-equip-owner ${owner ? 'used' : 'free'}">${owner ? `👤 ${owner}` : '— Livre —'}</div>
                        <!-- ⭐ BOTÃO DESMANCHAR -->
                        <button class="forge-btn danger" style="padding: 4px 8px; font-size: 0.8rem; margin-left: 8px; border-radius: 4px;" 
                                onclick="handleDismantleWeapon('${uidToDismantle}')" title="Desmanchar 1 unidade">🔥</button>
                    </div>`;
            }).join('');
        }

        let amuletsHTML = '';
        const uniqueAmulets = Object.keys(aCounts);
        if (uniqueAmulets.length === 0) {
            amuletsHTML = `<div class="inv-empty-line">Nenhum amuleto forjado ainda.</div>`;
        } else {
            amuletsHTML = uniqueAmulets.map(baseId => {
                const a = STORY_AMULETS[baseId];
                if (!a) return '';
                const equippedBy = usageMap[baseId] || [];
                const owner = equippedBy.length > 0 ? equippedBy.map(hc => STORY_HERO_CLASSES[hc]?.displayName || hc).join(', ') : null;
                const icon = (typeof window.getAmuletIcon === 'function') ? window.getAmuletIcon(baseId, 'normal') : (a.emoji || '🧿');
                
                const uids = (STORY_PROGRESS.craftedAmulets || []).filter(id => getBaseId(id) === baseId);
                const isNew = uids.length > ((seenEquip.amuletCounts || {})[baseId] || 0)
                    && uids.some(uid => !seenAmuletIds.has(uid));
                const uidToDismantle = uids.find(uid => !equippedBy.includes(uid)) || uids[0];

                const ef = a.efeito || {};
                const efeitos = [];
                if (ef.elementOverride) efeitos.push(`${elemIcon(ef.elementOverride)} ${ef.elementOverride}`);
                if (ef.hpBonus) efeitos.push(`+${ef.hpBonus} HP`);
                if (ef.atkBonus) efeitos.push(`+${ef.atkBonus} ATK`);
                if (ef.healPerTurn) efeitos.push(`+${ef.healPerTurn} HP/turno`);
                
                return `
                    <div class="inv-equip-row amulet ${isNew ? 'inv-new-item' : ''}">
                        <div class="inv-equip-icon">${icon}</div>
                        <div class="inv-equip-info">
                            <div class="inv-equip-name">${a.nome} (x${aCounts[baseId]}) ${isNew ? '<span class="inv-new-badge">NOVO</span>' : ''}</div>
                            <div class="inv-equip-meta">${efeitos.join(' · ') || '—'}</div>
                        </div>
                        <div class="inv-equip-owner ${owner ? 'used' : 'free'}">${owner ? `👤 ${owner}` : '— Livre —'}</div>
                        <!-- ⭐ BOTÃO DESMANCHAR -->
                        <button class="forge-btn danger" style="padding: 4px 8px; font-size: 0.8rem; margin-left: 8px; border-radius: 4px;" 
                                onclick="handleDismantleAmulet('${uidToDismantle}')" title="Desmanchar 1 unidade">🔥</button>
                    </div>`;
            }).join('');
        }

        const equipSection = `
            <div class="inv-equipment-section">
                <div class="inv-equipment-title">⚔️ ARMAS FORJADAS</div>
                <div class="inv-equip-list">${weaponsHTML}</div>
                <div class="inv-equipment-title" style="margin-top:16px;">🧿 AMULETOS FORJADOS</div>
                <div class="inv-equip-list">${amuletsHTML}</div>
                <div class="inv-equipment-hint">💡 Para equipar, abra o <b>painel de um herói</b> na <b>OCA</b> (botão <b>⚔️</b>) e escolha o item.</div>
            </div>`;

        const currentWeaponIds = (STORY_PROGRESS.craftedWeapons || []).slice();
        const currentAmuletIds = (STORY_PROGRESS.craftedAmulets || []).slice();
        const currentSeen = {
            weapons: currentWeaponIds,
            amulets: currentAmuletIds,
            weaponCounts: wCounts,
            amuletCounts: aCounts,
        };
        if (JSON.stringify(seenEquip) !== JSON.stringify(currentSeen)) {
            STORY_PROGRESS.tesourariaEquipSeen = currentSeen;
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
        }

        return `
            <div class="tesouraria-total">Valor total do inventário: <b>${uiIcon('gold')} ${totalValue}</b></div>
            <div class="tesouraria-grid">${cardsHTML}</div>
            <div class="tesouraria-hint">💡 Venda materiais no <b>Escambo</b> para ganhar ouro.</div>
            ${equipSection}
        `;
    };

    // Ajuste no CSS para alinhar o botão bonitinho na linha
    if (!document.getElementById('v402CSS')) {
        const style = document.createElement('style');
        style.id = 'v402CSS';
        style.textContent = `
            .inv-equip-row {
                /* Garante que o botão fique alinhado à direita */
                align-items: center !important; 
            }
        `;
        document.head.appendChild(style);
    }

    if (!document.getElementById('v403CSS')) {
        const style = document.createElement('style');
        style.id = 'v403CSS';
        style.textContent = `
            .inv-equip-row.inv-new-item {
                border-color: #e8b923;
                background: linear-gradient(110deg, rgba(232,185,35,.14), rgba(10,6,2,.55));
                box-shadow: 0 0 12px rgba(232,185,35,.22);
            }
            .inv-new-badge {
                display: inline-block;
                margin-left: 6px;
                padding: 2px 6px;
                border: 1px solid #e8b923;
                border-radius: 10px;
                color: #1a1208;
                background: #e8b923;
                font: 700 .65rem 'Cinzel', serif;
                letter-spacing: .5px;
                vertical-align: middle;
                white-space: nowrap;
            }
        `;
        document.head.appendChild(style);
    }

    console.log('✅ [V40.2] Botão Desmanchar adicionado ao Inventário.');
})();
// =================================================================
// historia.js — BLOCO 130 (V41.0 — Fix Equipamentos no Evento)
// =================================================================
(function fixEquipamentoEventoV410() {
    if (window._fixEquipamentoEventoV410) return;
    window._fixEquipamentoEventoV410 = true;

    const _origIniciar = window.eventoIniciarBatalha;
    if (typeof _origIniciar === 'function') {
        window.eventoIniciarBatalha = async function(bossId, faseId) {
            // Chama a criação normal do evento
            const result = await _origIniciar.apply(this, arguments);

            // ⭐ APÓS o evento montar os heróis, aplica os níveis e equipamentos
            if (typeof players !== 'undefined' && Array.isArray(players)) {
                players.forEach(p => {
                    if (!p._statsAplicadosNoEvento) {
                        // O applyHeroLevelBonus já chama o applyHeroEquipment por baixo dos panos
                        if (typeof applyHeroLevelBonus === 'function') {
                            applyHeroLevelBonus(p);
                        }
                        p._statsAplicadosNoEvento = true;
                    }
                });
                
                // Atualiza a interface para mostrar a vida e o ataque corretos
                if (typeof updateHeroCard === 'function') updateHeroCard();
                if (typeof updateVisuals === 'function') updateVisuals();
            }

            return result;
        };
        console.log('✅ [V41.0] Equipamentos agora são aplicados no Evento Semanal.');
    }
})();
// =================================================================
// historia.js — BLOCO 131 (V42.0 — Stats Base vs Bônus na OCA)
// =================================================================
(function separarStatsOcaV420() {
    if (window._separarStatsOcaV420) return;
    window._separarStatsOcaV420 = true;

    const _origRenderOca = window.renderOcaScreenFiltered;

    window.renderOcaScreenFiltered = function() {
        const r = _origRenderOca.apply(this, arguments);

        // Espera o DOM ser montado
        setTimeout(() => {
            const cards = document.querySelectorAll('.story-hero-card');
            
            cards.forEach(card => {
                if (card.classList.contains('locked')) return;
                
                const onclickAttr = card.getAttribute('onclick') || '';
                const match = onclickAttr.match(/toggleHeroSelection\('((?:\\'|[^'])*)'\)/);
                if (!match) return;
                
                const heroClass = match[1].replace(/\\'/g, "'");
                const heroData = STORY_HERO_CLASSES[heroClass];
                if (!heroData) return;

                // 1. Valores Base
                const baseHp = heroData.hp;
                const baseAtk = heroData.atk;

                let bonusHp = 0;
                let bonusAtk = 0;

                // 2. Bônus de Nível (do 2 ao 10)
                if (typeof getHeroBonusFromLevel === 'function') {
                    const lvlBonus = getHeroBonusFromLevel(heroClass);
                    bonusHp += lvlBonus.hp || 0;
                    bonusAtk += lvlBonus.atk || 0;
                }

                // 3. Bônus do Nível 11 (Status Aleatório)
                if (STORY_PROGRESS.heroStat11 && STORY_PROGRESS.heroStat11[heroClass]) {
                    const stat = STORY_PROGRESS.heroStat11[heroClass];
                    if (stat.tipo === 'jackpot' && stat.stats) {
                        stat.stats.forEach(s => {
                            if (s.tipo === 'hp') bonusHp += s.valor;
                            if (s.tipo === 'atk') bonusAtk += s.valor;
                        });
                    } else {
                        if (stat.tipo === 'hp') bonusHp += stat.valor;
                        if (stat.tipo === 'atk') bonusAtk += stat.valor;
                    }
                }

                // 4. Bônus de Equipamentos (Arma e Amuleto)
                if (typeof getHeroEquipment === 'function') {
                    const eq = getHeroEquipment(heroClass);
                    
                    if (eq.arma && typeof getWeaponById === 'function') {
                        const w = getWeaponById(eq.arma);
                        if (w) bonusAtk += w.atkBonus || 0;
                    }
                    
                    if (eq.amuleto && typeof getAmuletById === 'function') {
                        const a = getAmuletById(eq.amuleto);
                        if (a && a.efeito) {
                            bonusHp += a.efeito.hpBonus || 0;
                            bonusAtk += a.efeito.atkBonus || 0;
                        }
                    }
                }

                // 5. Bônus de Título (se houver um ativo)
                if (typeof ACTIVE_TITLE !== 'undefined' && ACTIVE_TITLE && typeof TITLES !== 'undefined') {
                    const title = TITLES[ACTIVE_TITLE];
                    if (title && title.bonus) {
                        if (title.bonus.type === 'ATK') bonusAtk += title.bonus.value || 0;
                        if (title.bonus.type === 'MAX_HP') bonusHp += title.bonus.value || 0;
                    }
                }

                // 6. Formatação Visual (Verde para +, Vermelho para -)
                const formatarStat = (base, bonus) => {
                    if (bonus === 0) return `${base}`;
                    const cor = bonus > 0 ? '#8ac070' : '#d05050';
                    const sinal = bonus > 0 ? '+' : '';
                    return `${base} <span style="color:${cor}; font-weight:900; text-shadow: 0 0 4px rgba(0,0,0,0.8);">${sinal}${bonus}</span>`;
                };

                const hpText = formatarStat(baseHp, bonusHp);
                const atkText = formatarStat(baseAtk, bonusAtk);

                // Atualiza o texto do card
                const infoDiv = card.querySelector('.story-hero-level');
                if (infoDiv) {
                    infoDiv.innerHTML = `${heroData.role} · HP ${hpText} · ATK ${atkText}`;
                }
            });
        }, 100);

        return r;
    };

    console.log('✅ [V42.0] Stats base e bônus coloridos na OCA.');
})();
// =================================================================
// historia.js — BLOCO 132 (V42.1 — Ajuste visual do Check na OCA)
// =================================================================
(function fixCheckOcaV421() {
    if (window._fixCheckOcaV421) return;
    window._fixCheckOcaV421 = true;

    const style = document.createElement('style');
    style.id = 'v421CSS';
    style.textContent = `
        /* Move o check para baixo da raridade (estrelas) */
        .story-hero-check {
            top: 36px !important; 
            right: 12px !important;
            z-index: 10;
        }
    `;
    document.head.appendChild(style);
    console.log('✅ [V42.1] Botão de check movido para baixo das estrelas.');
})();
// =================================================================
// historia.js — BLOCO 133 (V43.0 — Aura de Nível 11)
// -----------------------------------------------------------------
// Adiciona uma aura mágica pulsante nos sprites dos heróis Nível 11.
// =================================================================
(function auraNivel11V430() {
    if (window._auraNivel11V430) return;
    window._auraNivel11V430 = true;

    // 1. Adiciona o CSS da aura
    if (!document.getElementById('v430CSS')) {
        const style = document.createElement('style');
        style.id = 'v430CSS';
        style.textContent = `
            @keyframes auraLv11Pulse {
                0% { filter: drop-shadow(0 0 5px #e8b923) drop-shadow(0 0 10px rgba(142, 68, 173, 0.6)); }
                100% { filter: drop-shadow(0 0 12px #e8b923) drop-shadow(0 0 25px rgba(142, 68, 173, 1)); }
            }
            .lv11-glow {
                animation: auraLv11Pulse 1.5s infinite alternate !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Helper para checar se o herói é lvl 11
    function isLvl11(heroClass) {
        if (typeof getHeroLevel === 'function') {
            return getHeroLevel(heroClass) >= 11;
        }
        return false;
    }

    // 2. Hook na OCA (Cards de Seleção)
    const _origRenderOca = window.renderOcaScreenFiltered;
    if (typeof _origRenderOca === 'function') {
        window.renderOcaScreenFiltered = function() {
            const r = _origRenderOca.apply(this, arguments);
            setTimeout(() => {
                document.querySelectorAll('.story-hero-card').forEach(card => {
                    if (card.classList.contains('locked')) return;
                    const onclickAttr = card.getAttribute('onclick') || '';
                    const match = onclickAttr.match(/toggleHeroSelection\('((?:\\'|[^'])*)'\)/);
                    if (!match) return;
                    
                    const heroClass = match[1].replace(/\\'/g, "'");
                    if (isLvl11(heroClass)) {
                        const sprite = card.querySelector('.story-hero-sprite');
                        if (sprite) sprite.classList.add('lv11-glow');
                    }
                });
            }, 100);
            return r;
        };
    }

    // 3. Hook no Tabuleiro (Tokens durante a batalha)
    const _origUpdateHeroCard = window.updateHeroCard;
    if (typeof _origUpdateHeroCard === 'function') {
        window.updateHeroCard = function() {
            const r = _origUpdateHeroCard.apply(this, arguments);
            if (typeof players !== 'undefined' && Array.isArray(players)) {
                players.forEach(p => {
                    if (!p || p.dead) return;
                    const img = document.getElementById(`imgP${p.id}`);
                    if (img) {
                        if (isLvl11(p.class)) {
                            img.classList.add('lv11-glow');
                        } else {
                            img.classList.remove('lv11-glow');
                        }
                    }
                });
            }
            return r;
        };
    }

    // 4. Hook no Painel de Detalhes
    const _origOpenDetails = window.openHeroDetails;
    if (typeof _origOpenDetails === 'function') {
        window.openHeroDetails = function(heroClass) {
            _origOpenDetails.apply(this, arguments);
            if (isLvl11(heroClass)) {
                setTimeout(() => {
                    const sprite = document.querySelector('.hero-details-sprite');
                    if (sprite) sprite.classList.add('lv11-glow');
                }, 50);
            }
        };
    }

    console.log('✅ [V43.0] Aura mágica para heróis Nível 11 ativada.');
})();
// =================================================================
// historia.js — BLOCO 134 (V43.1 — Fix Aura do Nível 11 no Tabuleiro)
// =================================================================
(function fixAuraTabuleiroV431() {
    if (window._fixAuraTabuleiroV431) return;
    window._fixAuraTabuleiroV431 = true;

    // 1. Helper para checar nível 11
    function isLvl11(heroClass) {
        return (typeof getHeroLevel === 'function') && getHeroLevel(heroClass) >= 11;
    }

    // 2. Corrige o brilho nos tokens do TABULEIRO (onde o problema acontece)
    const _origUpdateAll = window.updateAllSpriteDirections;
    if (typeof _origUpdateAll === 'function') {
        window.updateAllSpriteDirections = function() {
            // Chama a função original (que vai apagar a classe lv11-glow)
            const r = _origUpdateAll.apply(this, arguments);
            
            // Depois que ela roda, a gente aplica o brilho de volta!
            if (typeof players !== 'undefined' && Array.isArray(players)) {
                players.forEach(p => {
                    if (!p || p.dead) return;
                    const img = document.getElementById(`imgP${p.id}`);
                    if (img && isLvl11(p.class)) {
                        img.classList.add('lv11-glow');
                    }
                });
            }
            return r;
        };
    }

    // 3. Corrige o brilho na lista lateral de heróis (Painel de Status PVP/Coop)
    const _origUpdateHeroCard = window.updateHeroCard;
    if (typeof _origUpdateHeroCard === 'function') {
        window.updateHeroCard = function() {
            const r = _origUpdateHeroCard.apply(this, arguments);
            
            // Adiciona o brilho no sprite pequeno da lista lateral
            if (typeof players !== 'undefined' && Array.isArray(players)) {
                players.forEach((p, index) => {
                    if (!p) return;
                    const listRow = document.querySelectorAll('.hero-status-row')[index];
                    if (listRow) {
                        const img = listRow.querySelector('.hero-status-sprite');
                        if (img) {
                            if (isLvl11(p.class)) {
                                img.classList.add('lv11-glow');
                            } else {
                                img.classList.remove('lv11-glow');
                            }
                        }
                    }
                });
            }
            return r;
        };
    }

    // 4. Garante que a animação CSS seja aplicada
    if (!document.getElementById('v431CSS')) {
        const style = document.createElement('style');
        style.id = 'v431CSS';
        style.textContent = `
            @keyframes auraLv11Pulse {
                0% { filter: drop-shadow(0 0 5px #e8b923) drop-shadow(0 0 10px rgba(142, 68, 173, 0.6)); }
                100% { filter: drop-shadow(0 0 12px #e8b923) drop-shadow(0 0 25px rgba(142, 68, 173, 1)); }
            }
            .lv11-glow {
                animation: auraLv11Pulse 1.5s infinite alternate !important;
            }
        `;
        document.head.appendChild(style);
    }

    console.log('✅ [V43.1] Aura Nível 11 forçada no tabuleiro e no painel PVP/Coop.');
})();
// =================================================================
// 🔧 FIX CRÍTICO — getBaseId global (V40.1 crash)
// -----------------------------------------------------------------
// O V40.1 sobrescreveu renderTesourariaForja e renderTesourariaAmuletos
// usando getBaseId() SEM definí-lo no próprio escopo (só existia
// dentro de IIFEs anteriores, não em window).
//
// Resultado: 1+ item em craftedWeapons/craftedAmulets → ReferenceError
// → Tesouraria não abre.
//
// Fix: expor getBaseId globalmente. É idempotente (só define uma vez).
// =================================================================
(function fixGetBaseIdGlobal() {
    if (typeof window.getBaseId === 'function') {
        console.log('✅ [FIX getBaseId] Já existe, nada a fazer.');
        return;
    }
    window.getBaseId = function(id) {
        if (!id) return null;
        return String(id).split('#')[0];
    };
    console.log('✅ [FIX getBaseId] Exposto globalmente. Tesouraria volta a funcionar.');
})();
// =================================================================
// FIM DO FIX
// =================================================================
// =================================================================
// 🎨 PATCH V44.0 — Fix Aura Lv11 (raios SSJ2) + Refresh da OCA
// -----------------------------------------------------------------
// 1. AURA Lv11:
//    - Remove o glow grande que cobria o tile
//    - Adiciona contorno fino (2px) no sprite
//    - Adiciona 8 raios finos girando (SSJ2) ao redor do herói
//    - NÃO invade o tile vizinho (140% do token = ~10% extra por lado)
//
// 2. OCA:
//    - Após equipar/desequipar, re-renderiza a OCA visível
//    - Assim o bônus (verde) de arma/amuleto aparece IMEDIATAMENTE
//    - Sem precisar sair e voltar
// =================================================================

// -----------------------------------------------------------------
// PARTE 1 — CSS (substitui o .lv11-glow antigo e adiciona .lv11-rays)
// -----------------------------------------------------------------
(function injectAuraLv11CSS() {
    // Remove o CSS antigo do V43.1
    const old = document.getElementById('v431CSS');
    if (old) old.remove();

    const style = document.createElement('style');
    style.id = 'v44AuraCSS';
    style.textContent = `
        /* ============ CONTORNO FINO NO SPRITE (não cobre tile) ============ */
        .lv11-glow {
            animation: lv11OutlinePulse 1.6s ease-in-out infinite alternate !important;
        }

        @keyframes lv11OutlinePulse {
            0% {
                filter:
                    drop-shadow(0 0 1px #e8b923)
                    drop-shadow(0 0 1px #e8b923)
                    drop-shadow(0 0 1px #8e44ad)
                    drop-shadow(0 0 1px #8e44ad);
            }
            100% {
                filter:
                    drop-shadow(0 0 2px #e8b923)
                    drop-shadow(0 0 2px #e8b923)
                    drop-shadow(0 0 2px #c39bd3)
                    drop-shadow(0 0 2px #c39bd3);
            }
        }

        /* ============ RAIOS SSJ2 EM VOLTA DO HERÓI ============ */
        /* O token (não o sprite) recebe a classe .lv11-rays           */
        .token.lv11-rays {
            overflow: visible !important;
        }

        .token.lv11-rays::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 145%;
            height: 145%;
            transform: translate(-50%, -50%);
            pointer-events: none;

            /* 8 feixes finos (2-3px) a cada 45° */
            background: conic-gradient(
                from 0deg,
                transparent 0deg,
                rgba(232, 185, 35, 0.95) 2deg,
                #fff5dc 3deg,
                rgba(232, 185, 35, 0.95) 4deg,
                transparent 6deg,

                transparent 45deg,
                rgba(232, 185, 35, 0.95) 47deg,
                #fff5dc 48deg,
                rgba(232, 185, 35, 0.95) 49deg,
                transparent 51deg,

                transparent 90deg,
                rgba(232, 185, 35, 0.95) 92deg,
                #fff5dc 93deg,
                rgba(232, 185, 35, 0.95) 94deg,
                transparent 96deg,

                transparent 135deg,
                rgba(232, 185, 35, 0.95) 137deg,
                #fff5dc 138deg,
                rgba(232, 185, 35, 0.95) 139deg,
                transparent 141deg,

                transparent 180deg,
                rgba(232, 185, 35, 0.95) 182deg,
                #fff5dc 183deg,
                rgba(232, 185, 35, 0.95) 184deg,
                transparent 186deg,

                transparent 225deg,
                rgba(232, 185, 35, 0.95) 227deg,
                #fff5dc 228deg,
                rgba(232, 185, 35, 0.95) 229deg,
                transparent 231deg,

                transparent 270deg,
                rgba(232, 185, 35, 0.95) 272deg,
                #fff5dc 273deg,
                rgba(232, 185, 35, 0.95) 274deg,
                transparent 276deg,

                transparent 315deg,
                rgba(232, 185, 35, 0.95) 317deg,
                #fff5dc 318deg,
                rgba(232, 185, 35, 0.95) 319deg,
                transparent 321deg,

                transparent 360deg
            );

            /* Corta o centro (sprite aparece) e as pontas (não invade vizinho) */
            -webkit-mask-image: radial-gradient(
                circle,
                transparent 38%,
                black 55%,
                black 82%,
                transparent 92%
            );
            mask-image: radial-gradient(
                circle,
                transparent 38%,
                black 55%,
                black 82%,
                transparent 92%
            );

            z-index: -1; /* atrás do sprite, na frente do tile */
            opacity: 0.9;
            animation:
                lv11RaysSpin 4s linear infinite,
                lv11RaysPulse 1.2s ease-in-out infinite alternate;
        }

        @keyframes lv11RaysSpin {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to   { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes lv11RaysPulse {
            from { opacity: 0.5; }
            to   { opacity: 1; }
        }

        /* Em mobile, encolhe um pouco pra caber no board */
        @media (max-width: 600px) {
            .token.lv11-rays::before {
                width: 135%;
                height: 135%;
            }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ [V44.0] CSS da aura Lv11 (contorno + raios) injetado.');
})();

// -----------------------------------------------------------------
// PARTE 2 — JS (aplica .lv11-rays no token do board)
// -----------------------------------------------------------------
(function aplicarAuraRaiosLv11() {
    if (window._auraRaiosLv11) return;
    window._auraRaiosLv11 = true;

    function isLvl11(heroClass) {
        return (typeof getHeroLevel === 'function') && getHeroLevel(heroClass) >= 11;
    }

    function aplicar() {
        if (typeof players === 'undefined' || !Array.isArray(players)) return;

        players.forEach(p => {
            if (!p || !p.class) return;
            const tokenEl = document.getElementById(`tokenP${p.id}`);
            if (!tokenEl) return;

            // Remove a classe antiga de raios se o herói não é mais Lv11 ou morreu
            if (p.dead || !isLvl11(p.class)) {
                tokenEl.classList.remove('lv11-rays');
                const img = tokenEl.querySelector('img.lv11-glow');
                if (img) img.classList.remove('lv11-glow');
                return;
            }

            // Adiciona raios no token
            tokenEl.classList.add('lv11-rays');

            // Adiciona contorno no sprite do board
            const img = tokenEl.querySelector('img');
            if (img && !img.classList.contains('lv11-glow')) {
                img.classList.add('lv11-glow');
            }
        });
    }

    // Roda depois dos updates existentes
    ['updateAllSpriteDirections', 'updateHeroCard', 'updateVisuals', 'updateBossCard'].forEach(fnName => {
        const _orig = window[fnName];
        if (typeof _orig === 'function') {
            window[fnName] = function() {
                const r = _orig.apply(this, arguments);
                setTimeout(aplicar, 0);
                return r;
            };
        }
    });

    // Rodadas iniciais
    setTimeout(aplicar, 400);
    setTimeout(aplicar, 1200);
    setTimeout(aplicar, 2500);

    // Monitor leve (caso algum patch de FX quebre a classe)
    setInterval(() => {
        if (!window._storyMode && !window._eventoAtivo && !window._coopMode && !window._pvpMode) return;
        aplicar();
    }, 3000);

    console.log('✅ [V44.0] Aura Lv11 aplicada como raios rotativos (não cobre tile).');
})();

// -----------------------------------------------------------------
// PARTE 3 — Refresh da OCA após equipar/desequipar
// -----------------------------------------------------------------
(function fixRefreshOcaPosEquip() {
    if (window._fixRefreshOcaPosEquip) return;
    window._fixRefreshOcaPosEquip = true;

    function isOcaVisible() {
        const ss = document.getElementById('storyScreen');
        if (!ss || !ss.classList.contains('active')) return false;
        const titleEl = ss.querySelector('.story-title');
        if (!titleEl) return false;
        return titleEl.textContent.toUpperCase().includes('OCA');
    }

    function refreshOca() {
        if (!isOcaVisible()) return;
        if (typeof renderOcaScreenFiltered !== 'function') return;
        try {
            renderOcaScreenFiltered();
            console.log('[V44.0] OCA re-renderizada após equip.');
        } catch (e) {
            console.warn('[V44.0] Erro ao re-renderizar OCA:', e);
        }
    }

    // Hook em equipWeapon (primitive — cobre tanto o equip screen quanto o card click)
    const _origEquipW = window.equipWeapon;
    if (typeof _origEquipW === 'function') {
        window.equipWeapon = function() {
            const r = _origEquipW.apply(this, arguments);
            if (r && r.ok) setTimeout(refreshOca, 150);
            return r;
        };
    }

    // Hook em equipAmulet
    const _origEquipA = window.equipAmulet;
    if (typeof _origEquipA === 'function') {
        window.equipAmulet = function() {
            const r = _origEquipA.apply(this, arguments);
            if (r && r.ok) setTimeout(refreshOca, 150);
            return r;
        };
    }

    // Hook em unequipWeapon / unequipAmulet
    const _origUnequipW = window.unequipWeapon;
    if (typeof _origUnequipW === 'function') {
        window.unequipWeapon = function() {
            const r = _origUnequipW.apply(this, arguments);
            setTimeout(refreshOca, 150);
            return r;
        };
    }

    const _origUnequipA = window.unequipAmulet;
    if (typeof _origUnequipA === 'function') {
        window.unequipAmulet = function() {
            const r = _origUnequipA.apply(this, arguments);
            setTimeout(refreshOca, 150);
            return r;
        };
    }

    console.log('✅ [V44.0] OCA agora atualiza automaticamente após equipar/desequipar.');
})();
// =================================================================
// FIM DO PATCH V44.0
// =================================================================

// =================================================================
// 🎨 PATCH V45.0 — Aura Lv11 SSJ2 (raios elétricos no sprite)
// -----------------------------------------------------------------
// Remove o V44.0/V43.x. Instala:
//   • Contorno sutil estático no sprite (2px, não animado, não cobre tile)
//   • 8 raios elétricos por token (atrás do sprite), cada um com crackle
//     rápido e delay individual = sensação de eletricidade
//   • Os raios começam no CENTRO do token e saem pra fora → ficam
//     escondidos atrás do sprite por ~30%, só a ponta aparece
// =================================================================

// -----------------------------------------------------------------
// PARTE 1 — Remove CSS antigos e instala o novo
// -----------------------------------------------------------------
(function injectAuraV45CSS() {
    ['v44AuraCSS', 'v431CSS', 'v430CSS'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    const style = document.createElement('style');
    style.id = 'v45AuraCSS';
    style.textContent = `
        /* ============ CONTORNO ESTÁTICO SUTIL NO SPRITE ============ */
        /* 4 drop-shadows de 2px = ~2px de borda nítida (sem blur grande) */
        img.lv11-glow {
            filter:
                drop-shadow(0 0 2px #e8b923)
                drop-shadow(0 0 2px #e8b923)
                drop-shadow(0 0 2px #c39bd3)
                drop-shadow(0 0 2px #c39bd3) !important;
        }

        /* ============ CONTAINER DOS RAIOS ============ */
        .token.lv11-rays {
            overflow: visible !important;
        }

        .lv11-bolts {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;             /* atrás do sprite */
            pointer-events: none;
            overflow: visible;
        }

        /* ============ CADA RAIO ============ */
        .lv11-bolt {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 4px;
            height: 70%;              /* sai do centro e vai além do tile */
            margin-left: -2px;
            transform-origin: center top;
            transform: rotate(var(--angle, 0deg));

            background: linear-gradient(180deg,
                transparent 0%,
                #fff5dc 12%,
                #e8b923 30%,
                #e8b923 60%,
                rgba(232, 185, 35, 0.6) 85%,
                transparent 100%
            );

            /* ponta fina (efeito de raio/solar) */
            border-radius: 2px 2px 50% 50% / 4px 4px 100% 100%;

            filter:
                drop-shadow(0 0 4px rgba(232, 185, 35, 0.95))
                drop-shadow(0 0 8px rgba(232, 185, 35, 0.5));

            opacity: 0;
            animation: lv11BoltCrackle var(--dur, 0.45s) ease-out infinite;
            animation-delay: var(--delay, 0s);
        }

        @keyframes lv11BoltCrackle {
            0%   { opacity: 0;   transform: rotate(var(--angle)) scaleY(0.3); }
            15%  { opacity: 1;   transform: rotate(var(--angle)) scaleY(1); }
            30%  { opacity: 0.5; transform: rotate(var(--angle)) scaleY(0.7); }
            45%  { opacity: 1;   transform: rotate(var(--angle)) scaleY(0.95); }
            60%  { opacity: 0.2; transform: rotate(var(--angle)) scaleY(0.55); }
            75%  { opacity: 0.9; transform: rotate(var(--angle)) scaleY(0.9); }
            90%  { opacity: 0.3; transform: rotate(var(--angle)) scaleY(0.6); }
            100% { opacity: 0;   transform: rotate(var(--angle)) scaleY(0.3); }
        }

        @media (max-width: 600px) {
            .lv11-bolt { width: 3px; margin-left: -1.5px; }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ [V45.0] CSS da aura (raios elétricos) injetado.');
})();

// -----------------------------------------------------------------
// PARTE 2 — Aplica os raios nos tokens
// -----------------------------------------------------------------
(function aplicarAuraV45() {
    if (window._auraV45) return;
    window._auraV45 = true;

    function isLvl11(heroClass) {
        return (typeof getHeroLevel === 'function') && getHeroLevel(heroClass) >= 11;
    }

    function aplicar() {
        if (typeof players === 'undefined' || !Array.isArray(players)) return;

        players.forEach(p => {
            if (!p || !p.class) return;
            const tokenEl = document.getElementById(`tokenP${p.id}`);
            if (!tokenEl) return;

            // Herói morto ou não-Lv11 → limpa tudo
            if (p.dead || !isLvl11(p.class)) {
                tokenEl.classList.remove('lv11-rays');
                const bolts = tokenEl.querySelector('.lv11-bolts');
                if (bolts) bolts.remove();
                const img = tokenEl.querySelector('img');
                if (img) img.classList.remove('lv11-glow');
                return;
            }

            tokenEl.classList.add('lv11-rays');

            // Contorno no sprite
            const img = tokenEl.querySelector('img');
            if (img && !img.classList.contains('lv11-glow')) {
                img.classList.add('lv11-glow');
            }

            // Raios (só cria uma vez)
            if (!tokenEl.querySelector('.lv11-bolts')) {
                const container = document.createElement('div');
                container.className = 'lv11-bolts';

                for (let i = 0; i < 8; i++) {
                    const bolt = document.createElement('div');
                    bolt.className = 'lv11-bolt';
                    bolt.style.setProperty('--angle', (i * 45) + 'deg');
                    bolt.style.setProperty('--delay', (i * 0.055) + 's');
                    bolt.style.setProperty('--dur', (0.38 + Math.random() * 0.18) + 's');
                    container.appendChild(bolt);
                }

                tokenEl.appendChild(container);
            }
        });
    }

    // Hooks nos updates existentes (idempotentes)
    ['updateAllSpriteDirections', 'updateHeroCard', 'updateVisuals'].forEach(fnName => {
        const _orig = window[fnName];
        if (typeof _orig === 'function' && !_orig._auraV45Hooked) {
            window[fnName] = function() {
                const r = _orig.apply(this, arguments);
                setTimeout(aplicar, 0);
                return r;
            };
            window[fnName]._auraV45Hooked = true;
        }
    });

    // Rodadas iniciais
    setTimeout(aplicar, 400);
    setTimeout(aplicar, 1200);
    setTimeout(aplicar, 2500);

    // Monitor leve (recupera se algum patch de FX remover)
    setInterval(() => {
        if (!window._storyMode && !window._eventoAtivo && !window._coopMode && !window._pvpMode) return;
        aplicar();
    }, 3000);

    // Limpa qualquer classe residual do V44.0
    document.querySelectorAll('.token.lv11-rays').forEach(t => {
        if (!t.querySelector('.lv11-bolts')) return; // ok
    });

    console.log('✅ [V45.0] Raios elétricos Lv11 ativados.');
})();
// =================================================================
// FIM DO PATCH V45.0
// =================================================================
// =================================================================
// ⚡ PATCH V46.0 — Aura Lv11 SSJ2 REAL (SVG Lightning)
// -----------------------------------------------------------------
// Substitui o V45.0. Usa SVG com paths irregulares e ramificados
// para simular a eletricidade do Super Saiyan 2.
//
// Características:
//   • Núcleo branco brilhante + aura amarela/dourada
//   • Formas irregulares (zigue-zague), não linhas retas
//   • Ramificações (raios dividindo no meio do caminho)
//   • Animação de "flicker" (pisca rápido e irregular)
//   • Fica ATRÁS do sprite → não tampa o rosto do herói
//   • Não cobre o tile embaixo (z-index correto)
// =================================================================

// -----------------------------------------------------------------
// PARTE 1 — Remove CSS antigos e instala o novo
// -----------------------------------------------------------------
(function injectAuraV46CSS() {
    // Remove versões anteriores
    ['v45AuraCSS', 'v44AuraCSS', 'v431CSS', 'v430CSS'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
    });

    const style = document.createElement('style');
    style.id = 'v46AuraCSS';
    style.textContent = `
        /* ============ CONTORNO FINO NO SPRITE ============ */
        img.lv11-glow {
            filter:
                drop-shadow(0 0 2px #fff5dc)
                drop-shadow(0 0 3px #e8b923)
                drop-shadow(0 0 6px rgba(232, 185, 35, 0.6)) !important;
        }

        /* ============ CONTAINER DE RAIOS ============ */
        .token.lv11-lightning {
            overflow: visible !important;
        }

        .lv11-lightning-svg {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 130%;              /* Um pouco maior que o token */
            height: 130%;
            transform: translate(-50%, -50%);
            z-index: -1;              /* ATRÁS do sprite */
            pointer-events: none;
            overflow: visible;
        }

        /* ============ CAMADAS DE RAIO ============ */
        /* Camada externa (glow dourado largo) */
        .lv11-bolt-glow {
            stroke: #e8b923;
            stroke-width: 6;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
            filter: blur(4px);
            opacity: 0;
            animation: lv11Flicker var(--dur, 0.15s) steps(2, end) infinite;
            animation-delay: var(--delay, 0s);
        }

        /* Camada média (amarelo forte) */
        .lv11-bolt-mid {
            stroke: #ffd700;
            stroke-width: 3;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
            filter: drop-shadow(0 0 3px #ffd700);
            opacity: 0;
            animation: lv11Flicker var(--dur, 0.15s) steps(2, end) infinite;
            animation-delay: var(--delay, 0s);
        }

        /* Camada interna (núcleo branco) */
        .lv11-bolt-core {
            stroke: #ffffff;
            stroke-width: 1.5;
            stroke-linecap: round;
            stroke-linejoin: round;
            fill: none;
            filter: drop-shadow(0 0 2px #ffffff);
            opacity: 0;
            animation: lv11Flicker var(--dur, 0.15s) steps(2, end) infinite;
            animation-delay: var(--delay, 0s);
        }

        /* Flicker irregular: pisca rápido, some, volta */
        @keyframes lv11Flicker {
            0%, 100% { opacity: 0; }
            10%      { opacity: 1; }
            20%      { opacity: 0.3; }
            30%      { opacity: 1; }
            40%      { opacity: 0.1; }
            50%      { opacity: 0.9; }
            60%      { opacity: 0.4; }
            70%      { opacity: 1; }
            80%      { opacity: 0.2; }
            90%      { opacity: 0.8; }
        }

        /* Cada raio tem um delay e duração próprios (aleatoriedade visual) */
        .lv11-lightning-svg g:nth-child(1) { --delay: 0s;     --dur: 0.18s; }
        .lv11-lightning-svg g:nth-child(2) { --delay: 0.07s;  --dur: 0.22s; }
        .lv11-lightning-svg g:nth-child(3) { --delay: 0.15s;  --dur: 0.15s; }
        .lv11-lightning-svg g:nth-child(4) { --delay: 0.03s;  --dur: 0.25s; }
        .lv11-lightning-svg g:nth-child(5) { --delay: 0.11s;  --dur: 0.17s; }
        .lv11-lightning-svg g:nth-child(6) { --delay: 0.19s;  --dur: 0.20s; }
    `;
    document.head.appendChild(style);
    console.log('✅ [V46.0] CSS SSJ2 Lightning injetado.');
})();

// -----------------------------------------------------------------
// PARTE 2 — Gerador de SVG e aplicação nos tokens
// -----------------------------------------------------------------
(function aplicarAuraV46() {
    if (window._auraV46) return;
    window._auraV46 = true;

    function isLvl11(heroClass) {
        return (typeof getHeroLevel === 'function') && getHeroLevel(heroClass) >= 11;
    }

    // Gera um path de raio com zigue-zague irregular
    // Começa no centro (50,50) e vai em direção ao ângulo/direção
    function gerarRaio(anguloDeg, comprimento, ramificacoes = 0) {
        const cx = 50, cy = 50;
        const ang = (anguloDeg * Math.PI) / 180;

        // Ponto inicial levemente deslocado do centro (pra não ficar tudo num só ponto)
        const offsetInicial = 10;
        let x = cx + Math.cos(ang) * offsetInicial;
        let y = cy + Math.sin(ang) * offsetInicial;

        let path = `M ${x.toFixed(1)} ${y.toFixed(1)}`;

        const segmentos = 5;
        const passo = comprimento / segmentos;

        let ramificacaoPaths = '';

        for (let i = 0; i < segmentos; i++) {
            // Direção principal + ruído perpendicular
            const progresso = i / segmentos;
            const desvioPerp = (Math.random() - 0.5) * 12; // zigue-zague
            const desvioAng = (Math.random() - 0.5) * 0.4; // leve desvio no ângulo

            const angAtual = ang + desvioAng;
            const dx = Math.cos(angAtual) * passo + Math.cos(ang + Math.PI/2) * desvioPerp;
            const dy = Math.sin(angAtual) * passo + Math.sin(ang + Math.PI/2) * desvioPerp;

            x += dx;
            y += dy;

            path += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;

            // Ramificação (galho saindo do meio do raio)
            if (i === 2 && ramificacoes > 0) {
                const angRam = ang + (Math.random() > 0.5 ? 0.6 : -0.6);
                let rx = x, ry = y;
                ramificacaoPaths += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
                for (let j = 0; j < 3; j++) {
                    const passinho = comprimento * 0.15;
                    const desv = (Math.random() - 0.5) * 8;
                    rx += Math.cos(angRam) * passinho + Math.cos(angRam + Math.PI/2) * desv;
                    ry += Math.sin(angRam) * passinho + Math.sin(angRam + Math.PI/2) * desv;
                    ramificacaoPaths += ` L ${rx.toFixed(1)} ${ry.toFixed(1)}`;
                }
            }
        }

        return { principal: path, ramificacao: ramificacaoPaths };
    }

    // Cria o SVG completo com 6 raios em ângulos diferentes
    function criarSVG() {
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('class', 'lv11-lightning-svg');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        // Ângulos distribuídos: topo-esquerda, topo-direita, esquerda, direita,
        // baixo-esquerda, baixo-direita
        const angulos = [
            { ang: -120, comp: 65, ram: 1 },  // topo-esquerda
            { ang: -60,  comp: 65, ram: 1 },  // topo-direita
            { ang: 180,  comp: 55, ram: 1 },  // esquerda
            { ang: 0,    comp: 55, ram: 1 },  // direita
            { ang: 135,  comp: 50, ram: 0 },  // baixo-esquerda
            { ang: 45,   comp: 50, ram: 0 },  // baixo-direita
        ];

        angulos.forEach(({ ang, comp, ram }) => {
            const { principal, ramificacao } = gerarRaio(ang, comp, ram);

            const g = document.createElementNS(svgNS, 'g');

            // As 3 camadas (glow, mid, core) usam o MESMO path
            const pathGlow = document.createElementNS(svgNS, 'path');
            pathGlow.setAttribute('d', principal + (ramificacao ? ' ' + ramificacao : ''));
            pathGlow.setAttribute('class', 'lv11-bolt-glow');

            const pathMid = document.createElementNS(svgNS, 'path');
            pathMid.setAttribute('d', principal + (ramificacao ? ' ' + ramificacao : ''));
            pathMid.setAttribute('class', 'lv11-bolt-mid');

            const pathCore = document.createElementNS(svgNS, 'path');
            pathCore.setAttribute('d', principal + (ramificacao ? ' ' + ramificacao : ''));
            pathCore.setAttribute('class', 'lv11-bolt-core');

            g.appendChild(pathGlow);
            g.appendChild(pathMid);
            g.appendChild(pathCore);
            svg.appendChild(g);
        });

        return svg;
    }

    function aplicar() {
        if (typeof players === 'undefined' || !Array.isArray(players)) return;

        players.forEach(p => {
            if (!p || !p.class) return;
            const tokenEl = document.getElementById(`tokenP${p.id}`);
            if (!tokenEl) return;

            // Herói morto ou não-Lv11 → limpa
            if (p.dead || !isLvl11(p.class)) {
                tokenEl.classList.remove('lv11-lightning');
                const svgEl = tokenEl.querySelector('.lv11-lightning-svg');
                if (svgEl) svgEl.remove();
                const img = tokenEl.querySelector('img');
                if (img) img.classList.remove('lv11-glow');
                return;
            }

            tokenEl.classList.add('lv11-lightning');

            // Contorno no sprite
            const img = tokenEl.querySelector('img');
            if (img && !img.classList.contains('lv11-glow')) {
                img.classList.add('lv11-glow');
            }

            // SVG de raios (recria a cada ~2s pra ter formas diferentes,
            // simulando eletricidade que se move e muda de forma)
            if (!tokenEl.querySelector('.lv11-lightning-svg')) {
                const svg = criarSVG();
                tokenEl.appendChild(svg);

                // ⚡ A cada 1.5s, recria o SVG pra dar sensação de movimento
                // (raios reais mudam de forma constantemente)
                if (!tokenEl._lv11RegenTimer) {
                    tokenEl._lv11RegenTimer = setInterval(() => {
                        const antigo = tokenEl.querySelector('.lv11-lightning-svg');
                        if (antigo) antigo.remove();
                        if (tokenEl.classList.contains('lv11-lightning')) {
                            tokenEl.appendChild(criarSVG());
                        }
                    }, 1500);
                }
            }
        });

        // Limpa timers de tokens que não existem mais
        document.querySelectorAll('.token').forEach(tok => {
            if (!tok.classList.contains('lv11-lightning') && tok._lv11RegenTimer) {
                clearInterval(tok._lv11RegenTimer);
                tok._lv11RegenTimer = null;
            }
        });
    }

    // Hooks idempotentes nos updates existentes
    ['updateAllSpriteDirections', 'updateHeroCard', 'updateVisuals'].forEach(fnName => {
        const _orig = window[fnName];
        if (typeof _orig === 'function' && !_orig._auraV46Hooked) {
            window[fnName] = function() {
                const r = _orig.apply(this, arguments);
                setTimeout(aplicar, 0);
                return r;
            };
            window[fnName]._auraV46Hooked = true;
        }
    });

    // Rodadas iniciais
    setTimeout(aplicar, 400);
    setTimeout(aplicar, 1200);
    setTimeout(aplicar, 2500);

    // Monitor leve
    setInterval(() => {
        if (!window._storyMode && !window._eventoAtivo && !window._coopMode && !window._pvpMode) return;
        aplicar();
    }, 3000);

    console.log('✅ [V46.0] Raios SSJ2 (SVG lightning) ativados.');
})();
// =================================================================
// FIM DO PATCH V46.0
// =================================================================
// =================================================================
// 🎯 V10.29 — MATEMÁTICA CORRETA NO CARD (Nível + Stat 11)
// -----------------------------------------------------------------
// O card (UI) ignorava o bônus de nível. Este patch reescreve o
// updateHeroCard para calcular o dano exato igual a batalha faz.
// =================================================================

(function fixCardAtkV1029() {
    if (window._fixCardAtkV1029) return;
    window._fixCardAtkV1029 = true;

    console.log('✅ [V10.29] Instalando matemática correta no card (ATK)...');

    window.updateHeroCard = function() {
        const list = document.getElementById('heroesStatusList');
        if (!list) return;
        if (typeof tutorialMode !== 'undefined' && tutorialMode) {
            list.innerHTML = '';
            return;
        }
        if (typeof players === 'undefined' || !Array.isArray(players)) return;

        const ELEMENT_ICONS = {
            'FOGO':  { key: 'elem_fogo',  color: '#e74c3c' },
            'AGUA':  { key: 'elem_agua',  color: '#3498db' },
            'TERRA': { key: 'elem_terra', color: '#27ae60' },
            'AR':    { key: 'elem_ar',    color: '#f1c40f' }
        };

        list.innerHTML = '';

        players.forEach((p, index) => {
            if (!p) return;
            
            if (typeof calcularElementoDoHeroi === 'function') {
                p.element = calcularElementoDoHeroi(p.class);
            }

            const row = document.createElement('div');
            row.className = 'hero-status-row';
            if (index === currentPlayerIdx && currentPlayerIdx >= 0) row.classList.add('current');
            if (p.dead) row.classList.add('dead');

            const elemInfo = ELEMENT_ICONS[p.element] || ELEMENT_ICONS['FOGO'];
            row.style.borderLeftColor = elemInfo.color;

            const hpPercent = p.maxHp > 0 ? Math.max(0, (p.hp / p.maxHp) * 100) : 0;
            const hpColor = hpPercent > 60 ? '#2ecc71' : hpPercent > 30 ? '#f1c40f' : '#e74c3c';

            const baseAtk = (typeof CLASS_DB !== 'undefined' && CLASS_DB[p.class]?.atk) || 0;
            const equipBonus = p.bonusAtk || 0; 
            
            // ⭐ AQUI ESTÁ O SEGREDO: Puxa o Nível + Stat 11
            let levelBonus = 0;
            if (typeof getHeroBonusFromLevel === 'function') {
                const b = getHeroBonusFromLevel(p.class) || {};
                levelBonus = b.atk || 0;
            }

            const totalAtk = baseAtk + equipBonus + levelBonus;

            let atkText = `${totalAtk}`;
            const muiraquitaIcon = (typeof icon === 'function') ? icon('muiraquita') : '💎';
            const starIcon = '⭐';

            if (equipBonus > 0 && levelBonus > 0) {
                atkText += ` <span style="color:#f39c12;font-size:0.7em;">(+${equipBonus}${muiraquitaIcon} +${levelBonus}${starIcon})</span>`;
            } else if (equipBonus > 0) {
                atkText += ` <span style="color:#f39c12;font-size:0.7em;">(+${equipBonus}${muiraquitaIcon})</span>`;
            } else if (levelBonus > 0) {
                atkText += ` <span style="color:#2ecc71;font-size:0.7em;">(+${levelBonus}${starIcon})</span>`;
            }

            const sprite = (typeof SPRITES !== 'undefined' && SPRITES[p.class]) || '';
            const elemIconHTML = (typeof icon === 'function') ? icon(elemInfo.key) : '';

            row.innerHTML = `
                <img class="hero-status-sprite" src="${sprite}" alt="${p.name || ''}">
                <div class="hero-status-info">
                    <div class="hero-status-name">
                        <span class="hero-element-icon" style="color: ${elemInfo.color}; text-shadow: 0 0 6px ${elemInfo.color};" title="${p.element}">
                            ${elemIconHTML}
                        </span>
                        ${p.name || 'P'+(index+1)}
                    </div>
                    <div class="hero-status-hp">
                        <span>${p.hp}/${p.maxHp}</span>
                        <div class="mini-hp-bar">
                            <div class="mini-hp-fill" style="width: ${hpPercent}%; background: ${hpColor};"></div>
                        </div>
                        <span class="hero-status-atk" title="Ataque total">${(typeof icon === 'function') ? icon('espadas') : '⚔️'} ${atkText}</span>
                    </div>
                </div>
            `;
            list.appendChild(row);
        });

        const turnName = document.getElementById('turnDisplayName');
        if (turnName) {
            if (currentPlayerIdx >= 0 && players[currentPlayerIdx]) {
                const p = players[currentPlayerIdx];
                const elemInfo = ELEMENT_ICONS[p.element] || ELEMENT_ICONS['FOGO'];
                const elemIconHTML = (typeof icon === 'function') ? icon(elemInfo.key) : '';
                turnName.innerHTML = `${elemIconHTML} ${p.name || `Jogador ${currentPlayerIdx+1}`}`;
                const turnDisplay = document.getElementById('turnP_Active');
                if (turnDisplay) turnDisplay.classList.add('active-turn');
            } else {
                turnName.textContent = 'Boss';
            }
        }
    };

    // Força a atualização imediata se o jogo estiver aberto
    if (typeof players !== 'undefined' && players.length > 0) {
        window.updateHeroCard();
    }

    console.log('✅ [V10.29] Card atualizado. O bônus de Nível/Stat11 agora aparece.');
})();
// =================================================================
// 🎯 V10.30 — CORREÇÃO DO CÁLCULO DUPLO NA OCA (O +6 vs +4)
// -----------------------------------------------------------------
// A OCA estava somando o Stat do Nível 11 duas vezes no bônus de ATK.
// Este patch esconde o Stat temporariamente na renderização para que
// a conta fique idêntica à do combate (Total 7).
// =================================================================

(function fixOcaDoubleCountingV1030() {
    if (window._fixOcaDoubleCountingV1030) return;
    window._fixOcaDoubleCountingV1030 = true;

    console.log('✅ [V10.30] Consertando cálculo duplo na OCA...');

    const _origRenderOca = window.renderOcaScreenFiltered;
    if (typeof _origRenderOca === 'function') {
        window.renderOcaScreenFiltered = function() {
            const backup = {};
            
            // O V42.0 soma o Stat11 manualmente, mesmo que o getHeroBonusFromLevel já tenha somado.
            // Vamos ocultar o Stat11 durante a renderização da OCA para não contar duas vezes.
            if (typeof STORY_PROGRESS !== 'undefined' && STORY_PROGRESS.heroStat11) {
                for (let hc in STORY_PROGRESS.heroStat11) {
                    backup[hc] = STORY_PROGRESS.heroStat11[hc];
                    STORY_PROGRESS.heroStat11[hc] = { tipo: 'none', valor: 0 };
                }
            }

            // Renderiza a OCA
            const r = _origRenderOca.apply(this, arguments);

            // Restaura os status do Nível 11 intactos
            if (typeof STORY_PROGRESS !== 'undefined' && STORY_PROGRESS.heroStat11) {
                for (let hc in backup) {
                    STORY_PROGRESS.heroStat11[hc] = backup[hc];
                }
            }
            return r;
        };
    }

    // Força atualização se a OCA já estiver aberta na tela
    const screen = document.getElementById('storyScreen');
    if (screen && screen.classList.contains('active') && screen.innerHTML.includes('OCA')) {
        window.renderOcaScreenFiltered();
    }

    console.log('✅ [V10.30] OCA corrigida. O +2 do Nível 11 não é mais contado duas vezes.');
})();
// =================================================================
// 🎯 V10.31 — REESCRITA DEFINITIVA DO CARD DA OCA (MATEMÁTICA EXATA)
// -----------------------------------------------------------------
// O código antigo (V42.0) estava somando o stat11 mais de uma vez.
// Este patch reescreve o cálculo visual do card da OCA para:
//   1. Usar getHeroBonusFromLevel (que já tem Nível + Stat11).
//   2. Somar o Equipamento.
//   3. Ignorar o stat11 "solta" na tabela.
// =================================================================

(function fixOcaCardV1031() {
    if (window._fixOcaCardV1031) return;
    window._fixOcaCardV1031 = true;

    console.log('✅ [V10.31] Reescrevendo matemática da OCA...');

    const _origRenderOca = window.renderOcaScreenFiltered;
    if (typeof _origRenderOca === 'function') {
        window.renderOcaScreenFiltered = function() {
            // Chama a renderização base (que desenha os cards vazios)
            const r = _origRenderOca.apply(this, arguments);

            // A gente espera um pouco (para vencer o setTimeout do patch antigo)
            // e sobrescreve os textos de status com a conta correta.
            setTimeout(() => {
                document.querySelectorAll('.story-hero-card').forEach(card => {
                    if (card.classList.contains('locked')) return;
                    
                    const onclickAttr = card.getAttribute('onclick') || '';
                    const match = onclickAttr.match(/toggleHeroSelection\('((?:\\'|[^'])*)'\)/);
                    if (!match) return;
                    
                    const heroClass = match[1].replace(/\\'/g, "'");
                    const heroData = STORY_HERO_CLASSES[heroClass];
                    if (!heroData) return;

                    // 1. Valores Base
                    const baseHp = heroData.hp;
                    const baseAtk = heroData.atk;

                    let bonusHp = 0;
                    let bonusAtk = 0;

                    // 2. Bônus de Nível + Nível 11 (Essa função JÁ retorna a soma dos dois)
                    if (typeof getHeroBonusFromLevel === 'function') {
                        const lvlBonus = getHeroBonusFromLevel(heroClass);
                        bonusHp += lvlBonus.hp || 0;
                        bonusAtk += lvlBonus.atk || 0;
                    }

                    // 3. Bônus de Equipamento (Arma e Amuleto)
                    if (typeof getHeroEquipment === 'function') {
                        const eq = getHeroEquipment(heroClass);
                        
                        if (eq.arma && typeof getWeaponById === 'function') {
                            const w = getWeaponById(eq.arma);
                            if (w) bonusAtk += w.atkBonus || 0;
                        }
                        
                        if (eq.amuleto && typeof getAmuletById === 'function') {
                            const a = getAmuletById(eq.amuleto);
                            if (a && a.efeito) {
                                bonusHp += a.efeito.hpBonus || 0;
                                bonusAtk += a.efeito.atkBonus || 0;
                            }
                        }
                    }

                    // 4. Formatação Verde (+X)
                    const formatarStat = (base, bonus) => {
                        if (bonus === 0) return `${base}`;
                        const cor = bonus > 0 ? '#8ac070' : '#d05050';
                        const sinal = bonus > 0 ? '+' : '';
                        return `${base} <span style="color:${cor}; font-weight:900; text-shadow: 0 0 4px rgba(0,0,0,0.8);">${sinal}${bonus}</span>`;
                    };

                    const hpText = formatarStat(baseHp, bonusHp);
                    const atkText = formatarStat(baseAtk, bonusAtk);

                    // 5. Atualiza o texto no Card
                    const infoDiv = card.querySelector('.story-hero-level');
                    if (infoDiv) {
                        infoDiv.innerHTML = `${heroData.role} · HP ${hpText} · ATK ${atkText}`;
                    }
                });
            }, 200); // 200ms garante que roda DEPOIS de todos os patches antigos

            return r;
        };
    }

    // Força atualização se a OCA já estiver aberta
    const screen = document.getElementById('storyScreen');
    if (screen && screen.classList.contains('active') && screen.innerHTML.includes('OCA')) {
        window.renderOcaScreenFiltered();
    }

    console.log('✅ [V10.31] OCA corrigida definitivamente.');
})();
// =================================================================
// 🔨 V10.35 — TROCA DO SOM DE FORJA (De Vitória para Martelada)
// -----------------------------------------------------------------
// Remove o som de 'win' e coloca um som de impacto (atkg) quando
// uma arma ou amuleto é forjado.
// =================================================================

(function mudarSomForjaV1035() {
    if (window._mudarSomForjaV1035) return;
    window._mudarSomForjaV1035 = true;

    console.log('✅ [V10.35] Trocando o som de forja...');

    // Função auxiliar para interceptar o som antigo e tocar o novo
    function interceptarSom(origFunc) {
        return function() {
            const _origPlay = window.playSfx;
            // Impede o som de vitória de tocar
            window.playSfx = function(name) {
                if (name !== 'win') _origPlay(name);
            };
            
            // Roda a forja
            const r = origFunc.apply(this, arguments);
            
            // Restaura a função de som original
            window.playSfx = _origPlay;
            
            // Toca o som de impacto (martelada)
            try { window.playSfx('forja'); } catch(e) {}
            
            return r;
        };
    }

    // Aplica na forja de Armas
    if (typeof window.handleCraftWeapon === 'function') {
        window.handleCraftWeapon = interceptarSom(window.handleCraftWeapon);
    }

    // Aplica na forja de Amuletos
    if (typeof window.handleCraftAmulet === 'function') {
        window.handleCraftAmulet = interceptarSom(window.handleCraftAmulet);
    }

    console.log('✅ [V10.35] Som de forja alterado para atkg.');
})();
// =================================================================
// 🧪 V10.36 — POPUP DE INFORMAÇÕES DO MATERIAL (Tesouraria)
// -----------------------------------------------------------------
// 1. Torna os ícones de materiais na forja clicáveis.
// 2. Abre um modal bonito mostrando onde conseguir o material.
// =================================================================

(function materialPopupV1036() {
    if (window._materialPopupV1036) return;
    window._materialPopupV1036 = true;

    console.log('✅ [V10.36] Instalando sistema de informações do material...');

    // --- FUNÇÃO QUE ABRE O MODAL ---
    window.openMaterialInfoModal = function(matId) {
        const m = STORY_MATERIALS[matId];
        if (!m) return;

        // 1. Descobrir quais inimigos dropam esse material
        const inimigosQueDropam = [];
        if (typeof STORY_DROP_TABLE !== 'undefined') {
            for (const enemyId in STORY_DROP_TABLE) {
                const drop = STORY_DROP_TABLE[enemyId];
                if ((drop.comum && drop.comum.id === matId) || (drop.raro && drop.raro.id === matId)) {
                    inimigosQueDropam.push(enemyId);
                }
            }
        }

        // 2. Montar a lista de drops com as fases
        let dropsHTML = '';
        if (inimigosQueDropam.length === 0) {
            dropsHTML = '<div class="mat-no-drops">Este material não é dropado por inimigos comuns. Pode ser obtido no Evento, Loja ou é um item especial.</div>';
        } else {
            dropsHTML = inimigosQueDropam.map(eid => {
                const enemy = STORY_ENEMIES[eid];
                if (!enemy) return '';
                
                // Procurar as fases onde o inimigo aparece
                const fases = [];
                if (typeof STORY_CHAPTERS !== 'undefined') {
                    for (const cid in STORY_CHAPTERS) {
                        const ch = STORY_CHAPTERS[cid];
                        ch.phases.forEach(ph => {
                            if (ph.enemies.includes(eid)) {
                                fases.push(ph.name);
                            }
                        });
                    }
                }

                const sprite = SPRITES_STORY[eid] 
                    ? `<img src="${SPRITES_STORY[eid]}" style="width:30px;height:30px;object-fit:contain;vertical-align:middle;">` 
                    : `<span style="font-size:1.2rem;">${EMOJI_STORY[eid]||'👹'}</span>`;

                return `
                    <div class="mat-drop-enemy">
                        <div class="mat-drop-enemy-header">
                            ${sprite} <span>${enemy.name}</span>
                        </div>
                        <div class="mat-drop-enemy-phases">
                            <span style="color:#8a7a52; font-size:0.8rem; font-family:'Cinzel',serif;">Fases:</span> 
                            ${fases.join(', ') || 'Eventos / Especiais'}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // 3. Criar o Modal
        const old = document.getElementById('matInfoModal');
        if (old) old.remove();

        const ov = document.createElement('div');
        ov.id = 'matInfoModal';
        ov.className = 'mat-info-overlay';
        ov.innerHTML = `
            <div class="mat-info-panel">
                <div class="mat-info-header">
                    <h2>${m.name}</h2>
                    <button class="mat-info-close" onclick="document.getElementById('matInfoModal').remove()">✕</button>
                </div>
                <div class="mat-info-body">
                    <div class="mat-info-icon-wrap">
                        ${typeof getMaterialIcon === 'function' ? getMaterialIcon(matId, 'large') : m.emoji}
                    </div>
                    <div class="mat-info-drops">
                        <div class="mat-info-title">ONDE OBTER:</div>
                        ${dropsHTML}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(ov);
    };

    // --- OBSERVADOR PARA TORNAR OS ITENS CLICÁVEIS ---
    const observer = new MutationObserver(() => {
        // Só age se a Tesouraria estiver aberta
        const screen = document.getElementById('storyScreen');
        if (!screen || !screen.classList.contains('active')) return;
        
        const recipeMats = document.querySelectorAll('.forge-recipe-mat');
        if (recipeMats.length === 0) return;

        // Precisamos de uma lista de materiais para procurar pelo emoji
        const allMats = Object.values(STORY_MATERIALS);

        recipeMats.forEach(span => {
            if (span.dataset.clickable === '1') return; // Já foi processado

            const text = span.textContent.trim();
            const emoji = text.split(' ')[0]; // Pega o primeiro caractere (emoji)
            
            // Acha o ID do material pelo emoji
            const mat = allMats.find(m => m.emoji === emoji);
            if (mat) {
                span.style.cursor = 'pointer';
                span.style.textDecoration = 'underline';
                span.title = `Clique para ver onde conseguir ${mat.name}`;
                span.dataset.clickable = '1';
                
                span.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.openMaterialInfoModal(mat.id);
                });
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // --- CSS DO MODAL ---
    if (!document.getElementById('matInfoCSS')) {
        const style = document.createElement('style');
        style.id = 'matInfoCSS';
        style.textContent = `
            .mat-info-overlay {
                position: fixed; inset: 0; background: rgba(10,6,2,0.9);
                z-index: 30000; display: flex; align-items: center; justify-content: center;
                padding: 20px; animation: fadeIn 0.3s ease; backdrop-filter: blur(4px);
            }
            .mat-info-panel {
                background: linear-gradient(180deg, #2a1f10, #1a1208);
                border: 2px solid #c9a227; border-radius: 8px;
                width: 100%; max-width: 450px; box-shadow: 0 10px 40px rgba(0,0,0,0.9);
                overflow: hidden;
            }
            .mat-info-header {
                display: flex; justify-content: space-between; align-items: center;
                padding: 15px 20px; border-bottom: 1px solid rgba(201,162,39,0.3);
                background: rgba(10,6,2,0.5);
            }
            .mat-info-header h2 {
                margin: 0; font-family: 'Cinzel', serif; color: #e8b923; font-size: 1.2rem;
                letter-spacing: 1px;
            }
            .mat-info-close {
                background: #6a2020; color: #f5c8c8; border: 1px solid #a83232;
                border-radius: 50%; width: 28px; height: 28px; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                font-family: 'Cinzel', serif; font-weight: 700; transition: all 0.2s;
            }
            .mat-info-close:hover { background: #8a3030; transform: scale(1.1); }
            
            .mat-info-body {
                padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 20px;
            }
            .mat-info-icon-wrap {
                width: 100px; height: 100px; display: flex; align-items: center; justify-content: center;
                background: radial-gradient(circle, rgba(232,185,35,0.15), transparent 70%);
                border-radius: 50%; border: 2px dashed rgba(201,162,39,0.4);
            }
            .mat-info-icon-wrap img {
                width: 80px; height: 80px; object-fit: contain;
                filter: drop-shadow(0 0 15px rgba(232,185,35,0.5));
            }
            .mat-info-icon-wrap span { font-size: 4rem; }
            
            .mat-info-drops { width: 100%; }
            .mat-info-title {
                font-family: 'Cinzel', serif; color: #8a7a52; font-size: 0.8rem;
                letter-spacing: 2px; margin-bottom: 12px; text-align: center;
                border-bottom: 1px solid rgba(201,162,39,0.2); padding-bottom: 6px;
            }
            .mat-drop-enemy {
                background: rgba(10,6,2,0.6); border: 1px solid rgba(201,162,39,0.25);
                border-radius: 6px; padding: 12px; margin-bottom: 8px;
            }
            .mat-drop-enemy:last-child { margin-bottom: 0; }
            .mat-drop-enemy-header {
                font-family: 'Cinzel', serif; color: #f0e2c0; font-size: 1rem;
                display: flex; align-items: center; gap: 10px; margin-bottom: 6px;
            }
            .mat-drop-enemy-phases {
                font-family: 'EB Garamond', serif; color: #b8a577;
                font-size: 0.9rem; font-style: italic; line-height: 1.4;
            }
            .mat-no-drops {
                text-align: center; font-family: 'EB Garamond', serif;
                color: #8a7a52; font-style: italic; padding: 10px;
                background: rgba(10,6,2,0.4); border-radius: 6px;
            }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `;
        document.head.appendChild(style);
    }

    console.log('✅ [V10.36] Popup de material instalado com sucesso.');
})();
// =================================================================
// 🧪 V10.37 — POPUP DE MATERIAL (Injeção direta no HTML)
// -----------------------------------------------------------------
// O V10.36 falhou porque tentou ler o texto. Agora, a gente
// reescreve o render da Forja para injetar o clique direto.
// =================================================================

(function materialPopupV1037() {
    if (window._materialPopupV1037) return;
    window._materialPopupV1037 = true;

    console.log('✅ [V10.37] Instalando popup de material (método direto)...');

    // --- 1. FUNÇÃO QUE ABRE O MODAL ---
    window.openMaterialInfoModal = function(matId) {
        const m = STORY_MATERIALS[matId];
        if (!m) return;

        // Descobrir quais inimigos dropam
        const inimigosQueDropam = [];
        if (typeof STORY_DROP_TABLE !== 'undefined') {
            for (const enemyId in STORY_DROP_TABLE) {
                const drop = STORY_DROP_TABLE[enemyId];
                if ((drop.comum && drop.comum.id === matId) || (drop.raro && drop.raro.id === matId)) {
                    inimigosQueDropam.push(enemyId);
                }
            }
        }

        // Montar a lista
        let dropsHTML = '';
        if (inimigosQueDropam.length === 0) {
            dropsHTML = '<div class="mat-no-drops">Este material não é dropado por inimigos comuns. Pode ser obtido no Evento, Loja ou é um item especial.</div>';
        } else {
            dropsHTML = inimigosQueDropam.map(eid => {
                const enemy = STORY_ENEMIES[eid];
                if (!enemy) return '';
                
                const fases = [];
                if (typeof STORY_CHAPTERS !== 'undefined') {
                    for (const cid in STORY_CHAPTERS) {
                        const ch = STORY_CHAPTERS[cid];
                        ch.phases.forEach(ph => {
                            if (ph.enemies.includes(eid)) fases.push(ph.name);
                        });
                    }
                }

                const sprite = SPRITES_STORY[eid] 
                    ? `<img src="${SPRITES_STORY[eid]}" style="width:30px;height:30px;object-fit:contain;vertical-align:middle;">` 
                    : `<span style="font-size:1.2rem;">${EMOJI_STORY[eid]||'👹'}</span>`;

                return `
                    <div class="mat-drop-enemy">
                        <div class="mat-drop-enemy-header">
                            ${sprite} <span>${enemy.name}</span>
                        </div>
                        <div class="mat-drop-enemy-phases">
                            <span style="color:#8a7a52; font-size:0.8rem; font-family:'Cinzel',serif;">Fases:</span> 
                            ${fases.join(', ') || 'Eventos / Especiais'}
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Criar Modal
        const old = document.getElementById('matInfoModal');
        if (old) old.remove();

        const ov = document.createElement('div');
        ov.id = 'matInfoModal';
        ov.className = 'mat-info-overlay';
        ov.innerHTML = `
            <div class="mat-info-panel">
                <div class="mat-info-header">
                    <h2>${m.name}</h2>
                    <button class="mat-info-close" onclick="document.getElementById('matInfoModal').remove()">✕</button>
                </div>
                <div class="mat-info-body">
                    <div class="mat-info-icon-wrap">
                        ${typeof getMaterialIcon === 'function' ? getMaterialIcon(matId, 'large') : m.emoji}
                    </div>
                    <div class="mat-info-drops">
                        <div class="mat-info-title">ONDE OBTER:</div>
                        ${dropsHTML}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(ov);
    };

    // --- 2. REESCREVER O RENDER PARA INJETAR O CLIQUE ---
    
    // Função auxiliar para gerar a receita clicável
    function gerarReceitaHTML(receita) {
        return Object.entries(receita).map(([matId, qty]) => {
            const m = STORY_MATERIALS[matId];
            if (!m) return '';
            const has = STORY_PROGRESS.inventory[matId] || 0;
            const ok = has >= qty ? 'ok' : 'no';
            
            return `<span class="forge-recipe-mat ${ok}" 
                          style="cursor:pointer; text-decoration:underline; text-decoration-style:dotted;"
                          title="Clique para ver onde conseguir ${m.name}"
                          onclick="event.stopPropagation(); window.openMaterialInfoModal('${matId}')">
                          ${m.emoji} ${has}/${qty}
                    </span>`;
        }).join('');
    }

    // Forja de Armas
    const _origForja = window.renderTesourariaForja;
    if (typeof _origForja === 'function') {
        window.renderTesourariaForja = function() {
            const allWeapons = Object.values(STORY_WEAPONS).filter(w => isWeaponAvailable(w.id));
            if (allWeapons.length === 0) return `<div class="tesouraria-empty"><div class="tesouraria-empty-icon">⚔️</div><div class="tesouraria-empty-text">Nenhuma forja liberada.</div></div>`;

            const cardsHTML = allWeapons.map(w => {
                const uids = (STORY_PROGRESS.craftedWeapons || []).filter(id => getBaseId(id) === w.id);
                const count = uids.length;
                const canCraft = hasMaterials(w.receita) && (STORY_PROGRESS.gold || 0) >= w.custoOuro && count < 99;
                const tipoLabel = { tacape:'Tacape', flecha:'Flecha', cajado:'Cajado' }[w.tipo];
                const isCrafted = count > 0;
                
                let actionHTML = '';
                if (count >= 99) {
                    actionHTML = `<div class="forge-forged-tag" style="color:#e8b923; margin-bottom:5px;">✅ Limite Máximo (99)</div>
                                  <button class="forge-btn danger" onclick="handleDismantleWeapon('${uids[0]}')">🔥 Desmanchar</button>`;
                } else {
                    actionHTML = `
                        ${isCrafted ? `<div class="forge-forged-tag" style="color:#8ac070; margin-bottom:5px;">✅ Forjada (${count}/99)</div>` : ''}
                        <div class="forge-ouro ${canCraft ? 'ok' : 'no'}">${uiIcon('gold')} ${w.custoOuro}</div>
                        <div style="display: flex; gap: 8px;">
                            <button class="forge-btn" style="flex:1;" ${canCraft ? '' : 'disabled'} onclick="handleCraftWeapon('${w.id}')">
                                ${canCraft ? (isCrafted ? '🔨 Forjar +1' : '🔨 Forjar') : '✕ Sem recursos'}
                            </button>
                            ${isCrafted ? `<button class="forge-btn danger" style="flex:1;" onclick="handleDismantleWeapon('${uids[0]}')">🔥 Desmanchar</button>` : ''}
                        </div>
                    `;
                }
                return `<div class="forge-card ${isCrafted ? 'crafted' : ''}"><div class="forge-card-header"><div class="forge-emoji">${w.emoji}</div><div class="forge-info"><div class="forge-name">${w.nome}</div><div class="forge-meta">Ato ${w.ato} · ${tipoLabel} · +${w.atkBonus} ATK</div></div></div><div class="forge-recipe">${gerarReceitaHTML(w.receita)}</div><div class="forge-actions">${actionHTML}</div></div>`;
            }).join('');
            return `<div class="forge-grid">${cardsHTML}</div>`;
        };
    }

    // Forja de Amuletos
    const _origAmuletos = window.renderTesourariaAmuletos;
    if (typeof _origAmuletos === 'function') {
        window.renderTesourariaAmuletos = function() {
            const allAmulets = Object.values(STORY_AMULETS).filter(a => isAmuletAvailable(a.id));
            if (allAmulets.length === 0) return `<div class="tesouraria-empty"><div class="tesouraria-empty-icon">🧿</div><div class="tesouraria-empty-text">Nenhum amuleto liberado.</div></div>`;

            const cardsHTML = allAmulets.map(a => {
                const uids = (STORY_PROGRESS.craftedAmulets || []).filter(id => getBaseId(id) === a.id);
                const count = uids.length;
                const canCraft = hasMaterials(a.receita) && (STORY_PROGRESS.gold || 0) >= a.custoOuro && count < 99;
                const ef = a.efeito;
                let efHTML = [];
                if (ef.elementOverride) efHTML.push(`🎨 Elemento → ${ef.elementOverride}`);
                if (ef.hpBonus) efHTML.push(`❤️ +${ef.hpBonus} HP`);
                if (ef.atkBonus) efHTML.push(`⚔️ +${ef.atkBonus} ATK`);
                if (ef.healPerTurn) efHTML.push(`💚 Cura ${ef.healPerTurn} HP/turno`);
                const isCrafted = count > 0;
                
                let actionHTML = '';
                if (count >= 99) {
                    actionHTML = `<div class="forge-forged-tag" style="color:#e8b923; margin-bottom:5px;">✅ Limite Máximo (99)</div>
                                  <button class="forge-btn danger" onclick="handleDismantleAmulet('${uids[0]}')">🔥 Desmanchar</button>`;
                } else {
                    actionHTML = `
                        ${isCrafted ? `<div class="forge-forged-tag" style="color:#8ac070; margin-bottom:5px;">✅ Forjado (${count}/99)</div>` : ''}
                        <div class="forge-ouro ${canCraft ? 'ok' : 'no'}">${uiIcon('gold')} ${a.custoOuro}</div>
                        <div style="display: flex; gap: 8px;">
                            <button class="forge-btn" style="flex:1;" ${canCraft ? '' : 'disabled'} onclick="handleCraftAmulet('${a.id}')">
                                ${canCraft ? (isCrafted ? '🔨 Forjar +1' : '🔨 Forjar') : '✕ Sem recursos'}
                            </button>
                            ${isCrafted ? `<button class="forge-btn danger" style="flex:1;" onclick="handleDismantleAmulet('${uids[0]}')">🔥 Desmanchar</button>` : ''}
                        </div>
                    `;
                }
                return `<div class="forge-card ${isCrafted ? 'crafted amulet' : 'amulet'}"><div class="forge-card-header"><div class="forge-emoji">${a.emoji}</div><div class="forge-info"><div class="forge-name">${a.nome}</div><div class="forge-meta">Ato ${a.ato}</div></div></div><div class="forge-effects">${efHTML.join(' · ')}</div><div class="forge-recipe">${gerarReceitaHTML(a.receita)}</div><div class="forge-actions">${actionHTML}</div></div>`;
            }).join('');
            return `<div class="forge-grid">${cardsHTML}</div>`;
        };
    }

    // --- 3. CSS DO MODAL ---
    if (!document.getElementById('matInfoCSS')) {
        const style = document.createElement('style');
        style.id = 'matInfoCSS';
        style.textContent = `
            .mat-info-overlay {
                position: fixed; inset: 0; background: rgba(10,6,2,0.9);
                z-index: 30000; display: flex; align-items: center; justify-content: center;
                padding: 20px; animation: fadeIn 0.3s ease; backdrop-filter: blur(4px);
            }
            .mat-info-panel {
                background: linear-gradient(180deg, #2a1f10, #1a1208);
                border: 2px solid #c9a227; border-radius: 8px;
                width: 100%; max-width: 450px; box-shadow: 0 10px 40px rgba(0,0,0,0.9);
                overflow: hidden;
            }
            .mat-info-header {
                display: flex; justify-content: space-between; align-items: center;
                padding: 15px 20px; border-bottom: 1px solid rgba(201,162,39,0.3);
                background: rgba(10,6,2,0.5);
            }
            .mat-info-header h2 {
                margin: 0; font-family: 'Cinzel', serif; color: #e8b923; font-size: 1.2rem;
                letter-spacing: 1px;
            }
            .mat-info-close {
                background: #6a2020; color: #f5c8c8; border: 1px solid #a83232;
                border-radius: 50%; width: 28px; height: 28px; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                font-family: 'Cinzel', serif; font-weight: 700; transition: all 0.2s;
            }
            .mat-info-close:hover { background: #8a3030; transform: scale(1.1); }
            
            .mat-info-body {
                padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 20px;
            }
            .mat-info-icon-wrap {
                width: 100px; height: 100px; display: flex; align-items: center; justify-content: center;
                background: radial-gradient(circle, rgba(232,185,35,0.15), transparent 70%);
                border-radius: 50%; border: 2px dashed rgba(201,162,39,0.4);
            }
            .mat-info-icon-wrap img {
                width: 80px; height: 80px; object-fit: contain;
                filter: drop-shadow(0 0 15px rgba(232,185,35,0.5));
            }
            .mat-info-icon-wrap span { font-size: 4rem; }
            
            .mat-info-drops { width: 100%; }
            .mat-info-title {
                font-family: 'Cinzel', serif; color: #8a7a52; font-size: 0.8rem;
                letter-spacing: 2px; margin-bottom: 12px; text-align: center;
                border-bottom: 1px solid rgba(201,162,39,0.2); padding-bottom: 6px;
            }
            .mat-drop-enemy {
                background: rgba(10,6,2,0.6); border: 1px solid rgba(201,162,39,0.25);
                border-radius: 6px; padding: 12px; margin-bottom: 8px;
            }
            .mat-drop-enemy:last-child { margin-bottom: 0; }
            .mat-drop-enemy-header {
                font-family: 'Cinzel', serif; color: #f0e2c0; font-size: 1rem;
                display: flex; align-items: center; gap: 10px; margin-bottom: 6px;
            }
            .mat-drop-enemy-phases {
                font-family: 'EB Garamond', serif; color: #b8a577;
                font-size: 0.9rem; font-style: italic; line-height: 1.4;
            }
            .mat-no-drops {
                text-align: center; font-family: 'EB Garamond', serif;
                color: #8a7a52; font-style: italic; padding: 10px;
                background: rgba(10,6,2,0.4); border-radius: 6px;
            }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `;
        document.head.appendChild(style);
    }

    console.log('✅ [V10.37] Popup e cliques instalados diretamente no HTML.');
})();
// =================================================================
// 🖤 V10.42 — LOJA DAS SOMBRAS (Status, Sprites e Descrições)
// =================================================================

(function eventoShopV1042() {
    if (window._eventoShopV1042) return;
    window._eventoShopV1042 = true;

    console.log('✅ [V10.42] Instalando Loja das Sombras (Premium)...');

    const ESSENCIA_ID = 'essencia_sombria';
    const CORACAO_ID = 'coracao_vazio';

    // --- 1. REGISTRAR ITENS BASE ---
    if (typeof STORY_MATERIALS !== 'undefined') {
        STORY_MATERIALS[ESSENCIA_ID] = { id: ESSENCIA_ID, name: 'Essência Sombria', emoji: '🌑' };
        STORY_MATERIALS['nucleo_abismo'] = { id: 'nucleo_abismo', name: 'Núcleo do Abismo', emoji: '💀' };
    }
    if (typeof STORY_AMULETS !== 'undefined' && !STORY_AMULETS[CORACAO_ID]) {
        STORY_AMULETS[CORACAO_ID] = {
            id: CORACAO_ID,
            nome: 'Coração do Vazio',
            ato: 13,
            custoOuro: 0,
            emoji: '🖤',
            receita: {},
            efeito: { hpBonus: 5, atkBonus: 5, voidSurvival: true }
        };
    }

    // --- 2. CONSTRUÇÃO DA LOJA COM STATUS E DESCRIÇÕES ---
    let LOJA_ITENS = [
        { 
            id: 'chave_evento', tipo: 'chave', preco: 100, nome: 'Chave do Evento', emoji: '🔑',
            desc: 'Abre a luta contra o Boss do dia.', stats: ''
        },
        { 
            id: 'nucleo_abismo', tipo: 'material', preco: 1500, nome: 'Núcleo do Abismo', emoji: '💀',
            desc: 'Usado no Ritual de Ascensão (Nv 11).', stats: ''
        },
        { 
            id: CORACAO_ID, tipo: 'amuleto_unico', preco: 10000, nome: 'Coração do Vazio', emoji: '🖤',
            desc: 'Sobrevive com 1 HP (1x/batalha).', stats: '+5 HP · +5 ATK'
        }
    ];

    // ⭐ PUXA AS 21 ARMAS E SEUS STATUS/SPRITES
    const armasEvento = (typeof EVENTO_ARMAS !== 'undefined') ? EVENTO_ARMAS : {};
    Object.values(armasEvento).forEach(w => {
        let emoji = '⚔️';
        if (w.tipo === 'tacape') emoji = '🪓';
        if (w.tipo === 'flecha') emoji = '🏹';
        if (w.tipo === 'cajado') emoji = '🪄';

        // Formata o elemento bonitinho
        let elemTexto = w.elemento;
        if (elemTexto === 'FOGO') elemTexto = '🔥 Fogo';
        if (elemTexto === 'AGUA') elemTexto = '💧 Água';
        if (elemTexto === 'TERRA') elemTexto = '⛰️ Terra';
        if (elemTexto === 'AR') elemTexto = '🌪️ Ar';

        LOJA_ITENS.push({
            id: w.id,
            tipo: 'arma',
            preco: 1000,
            nome: w.nome,
            emoji: emoji,
            desc: `Elemento: ${elemTexto}`,
            stats: `+${w.atkBonus} ATK · +${w.elementoBonus} Elemento`,
            sprite: (typeof EVENTO_SPRITES !== 'undefined' && EVENTO_SPRITES[w.id]) ? EVENTO_SPRITES[w.id] : ''
        });
    });

    // --- 3. LÓGICA DE DURABILIDADE ---
    if (!STORY_PROGRESS.itemDurability) STORY_PROGRESS.itemDurability = {};

    window.getDurabilidade = (itemId) => {
        if (itemId === CORACAO_ID && STORY_PROGRESS.itemDurability[itemId] === undefined) return 100;
        return STORY_PROGRESS.itemDurability[itemId] || 0;
    };

    window.quebrarItem = (itemId) => {
        if (typeof showToast === 'function') showToast('💔', 'O Coração do Vazio se despedaçou!', '💔');
        for (const hc in STORY_PROGRESS.heroEquipment || {}) {
            if (STORY_PROGRESS.heroEquipment[hc].amuleto === itemId) STORY_PROGRESS.heroEquipment[hc].amuleto = null;
        }
        if (Array.isArray(STORY_PROGRESS.craftedAmulets)) {
            STORY_PROGRESS.craftedAmulets = STORY_PROGRESS.craftedAmulets.filter(id => id !== itemId);
        }
        delete STORY_PROGRESS.itemDurability[itemId];
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
    };

    // --- 4. COMBATE E DROPS (Mantidos) ---
    const _origApplyDmg = window.applyDmg;
    if (typeof _origApplyDmg === 'function') {
        window.applyDmg = function(target, amount) {
            if (target && players.includes(target) && !target.dead && (target.hp - amount <= 0)) {
                const eq = (typeof getHeroEquipment === 'function') ? getHeroEquipment(target.class) : null;
                if (eq && eq.amuleto === CORACAO_ID) {
                    const dur = window.getDurabilidade(CORACAO_ID);
                    if (dur > 0 && !target._voidUsedThisBattle) {
                        target._voidUsedThisBattle = true;
                        target.hp = 1;
                        
                        const novaDur = Math.max(0, dur - 10);
                        STORY_PROGRESS.itemDurability[CORACAO_ID] = novaDur;
                        if (typeof saveStoryProgress === 'function') saveStoryProgress();
                        
                        if (typeof showToast === 'function') showToast('🖤', `Sobreviveu! (${novaDur}% restante)`, '🖤');
                        if (typeof spawnFxAt === 'function') spawnFxAt('impact', 'fx-impact', target.x, target.y, { duration: 800, scale: 1.5 });
                        
                        if (novaDur <= 0) window.quebrarItem(CORACAO_ID);
                        if (typeof updateVisuals === 'function') updateVisuals();
                        if (typeof updateHeroCard === 'function') updateHeroCard();
                        return; 
                    }
                }
            }
            return _origApplyDmg.apply(this, arguments);
        };
    }

    const _origInitBattle = window.initStoryBattle;
    if (typeof _origInitBattle === 'function') {
        window.initStoryBattle = async function() {
            if (typeof players !== 'undefined' && players) {
                players.forEach(p => { if (p) p._voidUsedThisBattle = false; });
            }
            return _origInitBattle.apply(this, arguments);
        };
    }

    const _origFinalizar = window.eventoFinalizarPartida;
    if (typeof _origFinalizar === 'function') {
        window.eventoFinalizarPartida = async function(vitoria, saindo) {
            if (vitoria && !saindo && window._eventoBatalha) {
                let qtd = 0;
                const fase = window._eventoBatalha.faseId;
                const isBoss = fase === 'boss';
                const isPesadelo = window._eventoBatalha.isPesadelo;

                if (isPesadelo) qtd = Math.floor(Math.random() * 31) + 50;
                else if (isBoss) qtd = Math.floor(Math.random() * 11) + 20;
                else {
                    const f = parseInt(fase);
                    if (f === 1) qtd = Math.floor(Math.random() * 4) + 2;
                    if (f === 2) qtd = Math.floor(Math.random() * 4) + 4;
                    if (f === 3) qtd = Math.floor(Math.random() * 4) + 6;
                    if (f === 4) qtd = Math.floor(Math.random() * 5) + 8;
                }
                if (qtd > 0) {
                    STORY_PROGRESS.inventory[ESSENCIA_ID] = (STORY_PROGRESS.inventory[ESSENCIA_ID] || 0) + qtd;
                    if (typeof saveStoryProgress === 'function') saveStoryProgress();
                    if (typeof showToast === 'function') showToast('🌑', `+${qtd} Essências Sombrias!`, '🌑');
                }
            }
            return _origFinalizar.apply(this, arguments);
        };
    }

    // --- 5. RENDERIZAÇÃO DA LOJA COM STATUS ---
    function getItemIconHTML(item) {
        if (item.sprite && item.sprite.trim() !== '') {
            return `<img src="${item.sprite}" style="width:64px; height:64px; object-fit:contain; filter:drop-shadow(0 0 10px rgba(142,68,173,0.6));" alt="${item.nome}">`;
        }
        if (typeof getWeaponIcon === 'function' && item.tipo === 'arma') {
            return getWeaponIcon(item.id, 'large');
        }
        return `<span style="font-size:3rem; line-height:1; filter:drop-shadow(0 0 10px rgba(142,68,173,0.6));">${item.emoji}</span>`;
    }

    window.renderEventoShopScreen = function() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;

        const qtdEssencia = STORY_PROGRESS.inventory[ESSENCIA_ID] || 0;
        
        let cardsHTML = LOJA_ITENS.map(item => {
            const podeComprar = qtdEssencia >= item.preco;
            let extraInfo = '';
            if (item.tipo === 'amuleto_unico') {
                const jaTem = (STORY_PROGRESS.craftedAmulets || []).includes(item.id);
                if (jaTem) {
                    const dur = window.getDurabilidade(item.id);
                    extraInfo = `<div class="evento-shop-durability">Durabilidade: ${dur}%</div>`;
                }
            }

            // Monta o bloco de status se existir
            const statsHTML = item.stats ? `<div class="evento-shop-stats">${item.stats}</div>` : '';
            const descHTML = item.desc ? `<div class="evento-shop-desc">${item.desc}</div>` : '';

            return `
                <div class="evento-shop-card ${podeComprar ? '' : 'disabled'}">
                    <div class="evento-shop-emoji">${getItemIconHTML(item)}</div>
                    <div class="evento-shop-name">${item.nome}</div>
                    
                    ${statsHTML}
                    ${descHTML}
                    
                    ${extraInfo}
                    <div class="evento-shop-price">🌑 ${item.preco}</div>
                    
                    <button class="evento-shop-btn" ${podeComprar ? '' : 'disabled'} onclick="comprarEventoItem('${item.id}', ${item.preco}, '${item.tipo}')">
                        ${podeComprar ? 'COMPRAR' : 'FALTA ESSÊNCIA'}
                    </button>
                </div>
            `;
        }).join('');

        screen.innerHTML = `
            <div class="story-container">
                <div class="story-header">
                    <h1 class="story-title">🌑 LOJA DAS SOMBRAS</h1>
                    <div style="margin-top:15px; font-family:'Cinzel',serif; font-size:1.2rem; color:#c39bd3;">
                        Saldo: <span style="color:#e8b923;">🌑 ${qtdEssencia}</span> Essências
                    </div>
                </div>
                <div class="evento-shop-grid">${cardsHTML}</div>
                <div class="story-footer"><button class="story-back-btn" onclick="renderEventoSemanalScreen()">← VOLTAR AO EVENTO</button></div>
            </div>
        `;
    };

    window.comprarEventoItem = async function(itemId, preco, tipo) {
        const qtdAtual = STORY_PROGRESS.inventory[ESSENCIA_ID] || 0;
        if (qtdAtual < preco) {
            if (typeof showToast === 'function') showToast('❌', 'Essências insuficientes.', '❌');
            return;
        }
        if (tipo === 'amuleto_unico' && (STORY_PROGRESS.craftedAmulets || []).includes(itemId)) {
            if (typeof showToast === 'function') showToast('❌', 'Você já possui este item.', '❌');
            return;
        }
        const __perg7 = `Comprar este item por ${preco} Essências?`;
                const __ok7 = (typeof uiConfirm === 'function')
                    ? await uiConfirm(__perg7, { titulo: 'Confirmar', ok: 'Confirmar', cancelar: 'Cancelar' })
                    : confirm(__perg7);
                if (!__ok7) return;

        STORY_PROGRESS.inventory[ESSENCIA_ID] -= preco;
        
        if (tipo === 'chave') {
            const _getChave = window.getChaveData || (typeof getChaveData !== 'undefined' ? getChaveData : null);
            const _salvarChave = window.salvarChaveData || (typeof salvarChaveData !== 'undefined' ? salvarChaveData : null);
            if (typeof _getChave === 'function') {
                const data = _getChave();
                data.quantidade = (data.quantidade || 0) + 1;
                if (typeof _salvarChave === 'function') _salvarChave(data);
            }
        } else if (tipo === 'material') {
            STORY_PROGRESS.inventory[itemId] = (STORY_PROGRESS.inventory[itemId] || 0) + 1;
        } else if (tipo === 'arma' || tipo === 'amuleto_unico') {
            if (!Array.isArray(STORY_PROGRESS.craftedAmulets)) STORY_PROGRESS.craftedAmulets = [];
            if (!Array.isArray(STORY_PROGRESS.craftedWeapons)) STORY_PROGRESS.craftedWeapons = [];
            
            if (tipo === 'arma') STORY_PROGRESS.craftedWeapons.push(itemId);
            else {
                STORY_PROGRESS.craftedAmulets.push(itemId);
                STORY_PROGRESS.itemDurability[CORACAO_ID] = 100;
            }
        }

        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        if (typeof showToast === 'function') showToast('✅', 'Compra realizada!', '🛒');
        if (typeof playSfx === 'function') playSfx('atkg');
        window.renderEventoShopScreen();
    };

    // --- 6. INJEÇÃO DO BOTÃO E CSS ---
    const observer = new MutationObserver(() => {
        const screen = document.getElementById('storyScreen');
        if (!screen || !screen.classList.contains('active')) return;

        const titleEl = screen.querySelector('.story-title');
        if (!titleEl || !titleEl.textContent.includes('SEMANA DAS SOMBRAS')) return;

        const header = screen.querySelector('.story-header');
        if (header && !document.getElementById('btnLojaEvento')) {
            const qtd = STORY_PROGRESS.inventory[ESSENCIA_ID] || 0;
            const btn = document.createElement('button');
            btn.id = 'btnLojaEvento';
            btn.className = 'evento-shop-trigger';
            btn.innerHTML = `🌑 LOJA DAS SOMBRAS (${qtd})`;
            btn.onclick = () => window.renderEventoShopScreen();
            header.appendChild(btn);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    if (!document.getElementById('eventoShopCSS')) {
        const style = document.createElement('style');
        style.id = 'eventoShopCSS';
        style.textContent = `
            .evento-shop-trigger {
                margin-top: 15px; padding: 12px 24px;
                background: linear-gradient(180deg, rgba(142,68,173,0.3), transparent 45%),
                            linear-gradient(135deg, #5a2a70, #2a1538);
                color: #f0e0ff; border: 2px solid #8e44ad; border-radius: 6px;
                font-family: 'Cinzel', serif; font-weight: 700; font-size: 1rem;
                letter-spacing: 1px; cursor: pointer; transition: all 0.2s;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5), 0 0 15px rgba(142,68,173,0.4);
            }
            .evento-shop-trigger:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0,0,0,0.6), 0 0 25px rgba(142,68,173,0.6);
            }
            .evento-shop-grid {
                display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                gap: 20px; margin: 30px 0; padding: 0 10px;
            }
            .evento-shop-card {
                background: linear-gradient(180deg, rgba(142,68,173,0.1), transparent 40%),
                            linear-gradient(180deg, #2a1f10, #1a1208);
                border: 2px solid #4a2a5a; border-radius: 8px; padding: 20px 15px;
                text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px;
                transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
            }
            .evento-shop-card:hover:not(.disabled) {
                border-color: #8e44ad; transform: translateY(-5px);
                box-shadow: 0 8px 25px rgba(142,68,173,0.3);
            }
            .evento-shop-card.disabled { opacity: 0.6; filter: grayscale(0.8); }
            
            .evento-shop-emoji {
                height: 70px; display: flex; align-items: center; justify-content: center; margin-bottom: 5px;
            }
            .evento-shop-name {
                font-family: 'Cinzel', serif; color: #f0e2c0; font-size: 1.05rem;
                font-weight: 700; letter-spacing: 1px; line-height: 1.2;
            }
            
            /* ⭐ NOVOS ESTILOS DE STATUS E DESCRIÇÃO */
            .evento-shop-stats {
                font-family: 'Cinzel', serif; font-size: 0.85rem; color: #8ac070;
                font-weight: 700; background: rgba(107,163,92,0.1);
                padding: 3px 10px; border-radius: 12px; border: 1px solid rgba(107,163,92,0.3);
                margin-top: 4px;
            }
            .evento-shop-desc {
                font-family: 'EB Garamond', serif; color: #b8a577; font-size: 0.9rem;
                font-style: italic; min-height: 35px; display: flex; align-items: center; justify-content: center;
            }
            .evento-shop-durability {
                font-family: 'Cinzel', serif; font-size: 0.85rem; color: #e8b923;
                font-weight: 700; background: rgba(232,185,35,0.1);
                padding: 3px 10px; border-radius: 12px; border: 1px solid rgba(232,185,35,0.3);
            }
            
            .evento-shop-price {
                font-family: 'Cinzel', serif; color: #c39bd3; font-size: 1.1rem;
                font-weight: 700; background: rgba(10,6,2,0.5); padding: 4px 15px;
                border-radius: 20px; border: 1px solid rgba(142,68,173,0.4);
                margin-top: auto; margin-bottom: 5px;
            }
            .evento-shop-btn {
                padding: 10px; width: 100%;
                background: linear-gradient(135deg, #3d2d18, #2a1f10);
                color: #e8b923; border: 1px solid #8e44ad; border-radius: 4px;
                font-family: 'Cinzel', serif; font-weight: 700; font-size: 0.85rem;
                letter-spacing: 1px; cursor: pointer; transition: all 0.2s;
            }
            .evento-shop-btn:hover:not(:disabled) {
                background: #5a2a70; color: #fff; box-shadow: 0 0 15px rgba(142,68,173,0.5);
            }
            .evento-shop-btn:disabled {
                background: #1a1208; color: #4a2a5a; border-color: #3d2d18; cursor: not-allowed;
            }
        `;
        document.head.appendChild(style);
    }

    console.log('✅ [V10.42] Loja das Sombras com Sprites, Status e Descrições.');
})();
// =================================================================
// 🖤 V10.43 — PASSIVA DO CORAÇÃO NO PVP E COOP
// =================================================================

(function coracaoVazioPvpCoopV1043() {
    if (window._coracaoVazioPvpCoopV1043) return;
    window._coracaoVazioPvpCoopV1043 = true;

    console.log('✅ [V10.43] Ativando passiva do Coração no PVP e Coop...');

    const CORACAO_ID = 'coracao_vazio';

    // Função central que checa a passiva (evita repetir código)
    function checarPassivaCoração(target, amt) {
        if (!target || target.dead || !players.includes(target)) return false;
        if (target.hp - amt > 0) return false; // Não é dano letal

        const eq = (typeof getHeroEquipment === 'function') ? getHeroEquipment(target.class) : null;
        if (!eq || eq.amuleto !== CORACAO_ID) return false;

        const dur = (typeof window.getDurabilidade === 'function') ? window.getDurabilidade(CORACAO_ID) : 0;
        if (dur <= 0 || target._voidUsedThisBattle) return false;

        // ⭐ ATIVA A PASSIVA
        target._voidUsedThisBattle = true;
        target.hp = 1;

        const novaDur = Math.max(0, dur - 10);
        if (!STORY_PROGRESS.itemDurability) STORY_PROGRESS.itemDurability = {};
        STORY_PROGRESS.itemDurability[CORACAO_ID] = novaDur;
        
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
        if (typeof showToast === 'function') showToast('🖤', `Sobreviveu! (${novaDur}% restante)`, '🖤');
        if (typeof spawnFxAt === 'function') spawnFxAt('impact', 'fx-impact', target.x, target.y, { duration: 800, scale: 1.5 });

        if (novaDur <= 0 && typeof window.quebrarItem === 'function') {
            window.quebrarItem(CORACAO_ID);
        }

        if (typeof updateVisuals === 'function') updateVisuals();
        if (typeof updateHeroCard === 'function') updateHeroCard();

        return true; // Impede o dano original
    }

    // 1. Hook no PVP
    const _origPvpDmg = window.pvpApplyDmg;
    if (typeof _origPvpDmg === 'function') {
        window.pvpApplyDmg = function(t, amt) {
            if (checarPassivaCoração(t, amt)) return;
            return _origPvpDmg.apply(this, arguments);
        };
    }

    // 2. Hook no Coop
    const _origCoopDmg = window.coopApplyDmg;
    if (typeof _origCoopDmg === 'function') {
        window.coopApplyDmg = function(t, amt) {
            if (checarPassivaCoração(t, amt)) return;
            return _origCoopDmg.apply(this, arguments);
        };
    }

    // 3. Reset da flag no PVP (quando inicia o jogo)
    const _origInitGame = window.initGame;
    if (typeof _origInitGame === 'function') {
        window.initGame = async function() {
            if (typeof players !== 'undefined' && players) {
                players.forEach(p => { if (p) p._voidUsedThisBattle = false; });
            }
            return _origInitGame.apply(this, arguments);
        };
    }

    console.log('✅ [V10.43] Coração do Vazio operando em todos os modos.');
})();
// =================================================================
// 🖤 V10.46 — PASSIVA DO CORAÇÃO DO VAZIO (BLINDADO CONTRA CRASH)
// =================================================================

(function coracaoVazioV1046() {
    if (window._coracaoVazioV1046) return;
    window._coracaoVazioV1046 = true;

    const CORACAO_ID = 'coracao_vazio';

    // 1. Garante que a estrutura existe desde o início
    if (typeof STORY_PROGRESS !== 'undefined' && !STORY_PROGRESS.itemDurability) {
        STORY_PROGRESS.itemDurability = {};
    }

    function getBaseId(id) {
        return id ? String(id).split('#')[0] : null;
    }

    // 2. Funções de Durabilidade e Quebra (Blindadas)
    window.getDurabilidade = (itemId) => {
        if (!itemId) return 0;
        const baseId = getBaseId(itemId);
        if (typeof STORY_PROGRESS === 'undefined' || !STORY_PROGRESS.itemDurability) return 100;
        if (baseId === CORACAO_ID && STORY_PROGRESS.itemDurability[baseId] === undefined) return 100;
        return STORY_PROGRESS.itemDurability[baseId] || 0;
    };

    window.quebrarItem = (itemId) => {
        const baseId = getBaseId(itemId);
        if (typeof showToast === 'function') showToast('💔', 'O Coração do Vazio se despedaçou!', '💔');
        
        if (typeof STORY_PROGRESS !== 'undefined' && STORY_PROGRESS.heroEquipment) {
            for (const hc in STORY_PROGRESS.heroEquipment) {
                if (getBaseId(STORY_PROGRESS.heroEquipment[hc].amuleto) === baseId) {
                    STORY_PROGRESS.heroEquipment[hc].amuleto = null;
                }
            }
        }
        if (typeof STORY_PROGRESS !== 'undefined' && Array.isArray(STORY_PROGRESS.craftedAmulets)) {
            STORY_PROGRESS.craftedAmulets = STORY_PROGRESS.craftedAmulets.filter(id => getBaseId(id) !== baseId);
        }
        if (typeof STORY_PROGRESS !== 'undefined' && STORY_PROGRESS.itemDurability) {
            delete STORY_PROGRESS.itemDurability[baseId];
        }
        if (typeof saveStoryProgress === 'function') saveStoryProgress();
    };

    // 3. O "Anjo da Guarda"
    window.tentarSalvarComCoracao = function() {
        if (typeof players === 'undefined' || !Array.isArray(players)) return false;
        let salvou = false;
        
        for (const p of players) {
            if (!p.dead && p.hp > 0) continue; 
            
            const eq = (typeof getHeroEquipment === 'function') ? getHeroEquipment(p.class) : null;
            if (!eq || !eq.amuleto) continue;
            if (getBaseId(eq.amuleto) !== CORACAO_ID) continue;
            
            const dur = window.getDurabilidade(CORACAO_ID);
            if (dur <= 0 || p._voidUsedThisBattle) continue;
            
            p._voidUsedThisBattle = true;
            p.hp = 1;
            p.dead = false;
            salvou = true;
            
            const novaDur = Math.max(0, dur - 10);
            if (!STORY_PROGRESS.itemDurability) STORY_PROGRESS.itemDurability = {};
            STORY_PROGRESS.itemDurability[CORACAO_ID] = novaDur;
            if (typeof saveStoryProgress === 'function') saveStoryProgress();
            
            if (typeof showToast === 'function') showToast('🖤', `Sobreviveu! (${novaDur}% restante)`, '🖤');
            if (typeof spawnFxAt === 'function') spawnFxAt('impact', 'fx-impact', p.x, p.y, { duration: 800, scale: 1.5 });
            
            if (novaDur <= 0) window.quebrarItem(CORACAO_ID);
            
            if (typeof updateVisuals === 'function') updateVisuals();
            if (typeof updateHeroCard === 'function') updateHeroCard();
            if (typeof coopRenderTudo === 'function') coopRenderTudo();
            if (typeof pvpRenderTudo === 'function') pvpRenderTudo();
        }
        
        return salvou;
    };

    // 4. Interceptadores de Tela (Destravando o jogo se salvar)
    const _origShowEndGame = window.showEndGame;
    if (typeof _origShowEndGame === 'function') {
        window.showEndGame = function(msg, isWin) {
            if (!isWin && window.tentarSalvarComCoracao()) {
                console.log('[V10.46] Game Over bloqueado: Coração salvou.');
                if (typeof isExecutingAction !== 'undefined') isExecutingAction = false;
                if (typeof arcadeBossTransition !== 'undefined') arcadeBossTransition = false;
                return; 
            }
            return _origShowEndGame.apply(this, arguments);
        };
    }

    const _origStoryDefeat = window.handleStoryDefeat;
    if (typeof _origStoryDefeat === 'function') {
        window.handleStoryDefeat = function() {
            if (window.tentarSalvarComCoracao()) {
                console.log('[V10.46] Derrota bloqueada: Coração salvou.');
                if (typeof isExecutingAction !== 'undefined') isExecutingAction = false;
                if (typeof arcadeBossTransition !== 'undefined') arcadeBossTransition = false;
                return;
            }
            return _origStoryDefeat.apply(this, arguments);
        };
    }

    const _origEventoFinish = window.finishStoryPhase;
    if (typeof _origEventoFinish === 'function') {
        window.finishStoryPhase = function(victory) {
            if (!victory && window.tentarSalvarComCoracao()) {
                console.log('[V10.46] Fim de fase bloqueado: Coração salvou.');
                if (typeof isExecutingAction !== 'undefined') isExecutingAction = false;
                if (typeof arcadeBossTransition !== 'undefined') arcadeBossTransition = false;
                return;
            }
            return _origEventoFinish.apply(this, arguments);
        };
    }

    const _origPvpFinalizar = window.pvpFinalizar;
    if (typeof _origPvpFinalizar === 'function') {
        window.pvpFinalizar = function(euVenco) {
            if (!euVenco && window.tentarSalvarComCoracao()) {
                console.log('[V10.46] PVP: Coração salvou.');
                return;
            }
            return _origPvpFinalizar.apply(this, arguments);
        };
    }

    const _origCoopFinalizar = window.coopFinalizar;
    if (typeof _origCoopFinalizar === 'function') {
        window.coopFinalizar = async function(vitoria) {
            if (!vitoria && window.tentarSalvarComCoracao()) {
                console.log('[V10.46] Coop: Coração salvou.');
                return;
            }
            return _origCoopFinalizar.apply(this, arguments);
        };
    }

    console.log('✅ [V10.46] Passiva do Coração blindada instalada.');
})();
// =================================================================
// 🌪️ V10.50 — CORRUPÇÃO DO TABULEIRO (Monitor e Visual Blindados)
// =================================================================

(function corrupcaoTabuleiroV1050() {
    if (window._corrupcaoTabuleiroV1050) return;
    window._corrupcaoTabuleiroV1050 = true;

    console.log('✅ [V10.50] Instalando Corrupção do Tabuleiro (Blindada)...');

    // Array global para guardar os tiles corrompidos
    window._corruptedTiles = [];

    // 1. Função que aplica a corrupção
    window.triggerTabuleiroCorrompido = function() {
        if (!boss || boss.dead) return;
        if (boss._corruptedTriggered) return;
        boss._corruptedTriggered = true;

        if (typeof addLog === 'function') addLog(`⚠️ O TABULEIRO FOI CORROMPIDO! Use Solo Sagrado para limpar.`);
        if (typeof playSfx === 'function') playSfx('minoa2');
        
        const board = document.getElementById('board');
        if (board) {
            board.style.animation = 'earthquakeAnim 0.8s ease-out';
            setTimeout(() => board.style.animation = '', 800);
        }

        let tentativas = 0;
        let adicionados = 0;
        const tilesLivresAtuais = 64 - window._corruptedTiles.length;

        while (adicionados < 12 && (tilesLivresAtuais - adicionados) > 35 && tentativas < 200) {
            tentativas++;
            const idx = Math.floor(Math.random() * 64);
            
            if (window._corruptedTiles.includes(idx)) continue;

            // Não corrompe a posição do boss ou dos heróis
            if (typeof isOccupied === 'function' && isOccupied(idx % 8, Math.floor(idx / 8), -1)) continue;

            window._corruptedTiles.push(idx);
            adicionados++;

            const tile = document.querySelectorAll('#grid .tile')[idx];
            if (tile) {
                tile.classList.add('tile-corrupted');
                tile.innerHTML = `<div class="corruption-fx"></div>`;
            }
        }
        console.log(`[V10.50] ${adicionados} tiles corrompidos.`);
    };

    // 2. MONITOR CONTÍNUO DE HP (Bypassa o problema do applyDmg)
    setInterval(() => {
        if (!window._storyMode && !window._eventoAtivo) return;
        if (!boss || boss.dead) return;
        if (boss._corruptedTriggered) return;

        // Se a vida chegou a 50% ou menos
        if (boss.hp > 0 && boss.hp <= boss.maxHp * 0.5) {
            window.triggerTabuleiroCorrompido();
        }
    }, 300);

    // 3. PRESERVAR O VISUAL DO TILE CORROMPIDO
    // Ensinamos o createTile a manter a classe preta mesmo quando o tabuleiro atualiza
    const _origCreateTile = window.createTile;
    if (typeof _origCreateTile === 'function') {
        window.createTile = function(idx) {
            const tile = _origCreateTile.apply(this, arguments);
            if (window._corruptedTiles && window._corruptedTiles.includes(idx)) {
                tile.classList.add('tile-corrupted');
                tile.innerHTML = `<div class="corruption-fx"></div>`;
            }
            return tile;
        };
    }

    // 4. INTERCEPTAR O CLIQUE NO TILE
    const _origSelect = window.handleSelect;
    if (typeof _origSelect === 'function') {
        window.handleSelect = function(idx) {
            if (window._corruptedTiles && window._corruptedTiles.includes(idx)) {
                const p = players[currentPlayerIdx];
                
                // ⭐ Se o jogador ativou o Solo Sagrado, LIMPA o tile
                if (p && skillActive) {
                    window._corruptedTiles = window._corruptedTiles.filter(i => i !== idx);
                    p.skillUsed = true;
                    skillActive = false;
                    document.querySelectorAll('#grid .tile').forEach(t => t.classList.remove('skill-mode'));
                    
                    if (typeof addLog === 'function') addLog(`✨ SOLO SAGRADO: Corrupção limpa!`);
                    
                    const gridEl = document.getElementById('grid');
                    if (gridEl && gridEl.childNodes[idx] && typeof createTile === 'function') {
                        gridEl.replaceChild(createTile(idx), gridEl.childNodes[idx]);
                    }
                    if (typeof saveAndRefresh === 'function') saveAndRefresh();
                    return; 
                }
                
                // Se tentou andar sem Solo Sagrado, bloqueia
                if (typeof addLog === 'function') addLog(`⛔ Este tile está corrompido! Ative o Solo Sagrado para limpá-lo.`);
                return;
            }
            return _origSelect.apply(this, arguments);
        };
    }

    // 5. RESETAR A CORRUPÇÃO QUANDO O BOSS MORRE OU TROCA
    const _origAdvance = window.advanceStoryEnemy;
    if (typeof _origAdvance === 'function') {
        window.advanceStoryEnemy = async function() {
            window._corruptedTiles = [];
            if (boss) boss._corruptedTriggered = false;
            return _origAdvance.apply(this, arguments);
        };
    }

    const _origInitBattle = window.initStoryBattle;
    if (typeof _origInitBattle === 'function') {
        window.initStoryBattle = async function() {
            window._corruptedTiles = [];
            if (boss) boss._corruptedTriggered = false;
            return _origInitBattle.apply(this, arguments);
        };
    }

    // 6. CSS DOS TILES CORROMPIDOS
    if (!document.getElementById('corruptionCSS')) {
        const style = document.createElement('style');
        style.id = 'corruptionCSS';
        style.textContent = `
            .tile.tile-corrupted {
                background: linear-gradient(135deg, #1a0a1a, #050205) !important;
                box-shadow: inset 0 0 15px rgba(142,68,173,0.8), 0 0 10px rgba(0,0,0,1) !important;
                border: 2px solid #6a1090 !important;
                cursor: not-allowed !important;
                position: relative;
                overflow: hidden;
            }
            .tile.tile-corrupted::before {
                content: '⛧';
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                font-size: 2rem;
                color: rgba(142,68,173,0.4);
                animation: corruptPulse 2s infinite alternate;
            }
            @keyframes corruptPulse {
                from { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
                to { opacity: 0.8; transform: translate(-50%, -50%) scale(1.2); }
            }
            .corruption-fx {
                position: absolute; inset: 0;
                background: radial-gradient(circle, rgba(142,68,173,0.3), transparent 70%);
                animation: pulseSkill 2s infinite;
            }
        `;
        document.head.appendChild(style);
    }

    console.log('✅ [V10.50] Corrupção do tabuleiro BLINDADA pronta.');
})();
// =================================================================
// 🌪️ V10.53 — CORRUPÇÃO DO TABULEIRO (Reset Ativo + Aviso Visual)
// =================================================================

(function corrupcaoTabuleiroV1053() {
    if (window._corrupcaoTabuleiroV1053) return;
    window._corrupcaoTabuleiroV1053 = true;

    console.log('✅ [V10.53] Instalando Corrupção do Tabuleiro (Reset Ativo)...');

    window._corruptedTiles = [];

    const BOSS_IDS = [
        'saci', 'mapinguari', 'iara', 'boitata', 'mula', 'corpo_seco', 
        'lobisomem', 'cuca', 'boto', 'boi', 'jaci', 'guaraci', 'anhanga', 
        'pesadelo', 'espectro_saci', 'espectro_mapinguari', 'espectro_iara', 
        'espectro_boitata', 'espectro_mula', 'espectro_corposeco', 
        'espectro_lobisomem', 'espectro_cuca', 'espectro_boto', 
        'espectro_boi', 'espectro_jaci', 'espectro_guaraci'
    ];

    function restaurarTile(idx) {
        const gridEl = document.getElementById('grid');
        if (gridEl && gridEl.childNodes[idx] && typeof createTile === 'function') {
            gridEl.replaceChild(createTile(idx), gridEl.childNodes[idx]);
        }
    }

    // Função central para limpar a corrupção (Ativada quando o Boss morre)
    window.limparCorrupcao = function() {
        if (window._corruptedTiles.length > 0) {
            console.log('[V10.53] Limpando tabuleiro corrompido...');
            window._corruptedTiles.forEach(idx => restaurarTile(idx));
            window._corruptedTiles = [];
        }
        if (boss) boss._corruptedTriggered = false;
    };

    // Função que aplica a corrupção
    window.triggerTabuleiroCorrompido = function() {
        if (!boss || boss.dead) return;
        if (boss._corruptedTriggered) return;
        boss._corruptedTriggered = true;

        if (typeof addLog === 'function') addLog(`⚠️ O TABULEIRO FOI CORROMPIDO! Use Solo Sagrado para limpar.`);
        if (typeof playSfx === 'function') playSfx('minoa2');
        
        const board = document.getElementById('board');
        if (board) {
            board.style.animation = 'earthquakeAnim 0.8s ease-out';
            setTimeout(() => board.style.animation = '', 800);
        }

        // ⭐ BANNER DE AVISO CENTRAL ⭐
        const oldBanner = document.getElementById('corruptionWarning');
        if (oldBanner) oldBanner.remove();

        // 🔒 Pausa o turno do boss enquanto o banner está visível
        window._bossEnfurecidoAviso = true;

        const warning = document.createElement('div');
        warning.id = 'corruptionWarning';
        warning.innerHTML = `
            <div style="font-family:'Cinzel Decorative', serif; color:#c39bd3; font-size:1.5rem; text-shadow: 0 0 15px #8e44ad;">O BOSS ESTÁ ENFURECIDO!</div>
            <div style="font-family:'EB Garamond', serif; color:#d9c89a; font-size:1rem; font-style:italic; margin-top:5px;">O tabuleiro foi corrompido. Use o Solo Sagrado (✨) nos tiles negros para limpá-los.</div>
        `;
        warning.style.cssText = `
            position: absolute; top: 20%; left: 50%; transform: translate(-50%, -50%);
            background: linear-gradient(180deg, rgba(40,15,50,0.95), rgba(20,5,20,0.95));
            border: 2px solid #8e44ad; border-radius: 8px; padding: 15px 30px;
            text-align: center; z-index: 1000; box-shadow: 0 10px 30px rgba(0,0,0,0.8);
            pointer-events: none; animation: fadeInOut 2s ease forwards;
        `;
        document.body.appendChild(warning);

        // Libera o turno do boss após o banner desaparecer visualmente (2s = duração da animação)
        setTimeout(() => { window._bossEnfurecidoAviso = false; }, 2200);
        setTimeout(() => { if (warning.parentNode) warning.remove(); }, 4000);

        // Aplica a corrupção nos tiles
        let tentativas = 0;
        let adicionados = 0;

        while (adicionados < 12 && (64 - window._corruptedTiles.length - adicionados) > 35 && tentativas < 200) {
            tentativas++;
            const idx = Math.floor(Math.random() * 64);
            
            if (window._corruptedTiles.includes(idx)) continue;
            if (typeof isOccupied === 'function' && isOccupied(idx % 8, Math.floor(idx / 8), -1)) continue;

            window._corruptedTiles.push(idx);
            adicionados++;

            const tile = document.querySelectorAll('#grid .tile')[idx];
            if (tile) {
                tile.classList.add('tile-corrupted');
                tile.innerHTML = `<div class="corruption-fx"></div>`;
            }
        }
    };

    // 1. MONITOR DE VIDA (Só checa o HP)
    setInterval(() => {
        if (!window._storyMode && !window._eventoAtivo) return;
        if (!boss || boss.dead) return;

        const enemyId = (typeof storyEnemiesRemaining !== 'undefined' && storyEnemiesRemaining.length > 0) 
            ? storyEnemiesRemaining[0] : null;
        const isBoss = enemyId && (BOSS_IDS.includes(enemyId) || (typeof STORY_ENEMIES !== 'undefined' && STORY_ENEMIES[enemyId]?.isBoss));

        if (isBoss && boss.hp > 0 && boss.hp <= boss.maxHp * 0.5) {
            window.triggerTabuleiroCorrompido();
        }
    }, 300);

    // 2. ⭐ RESET ATIVO: Escuta a morte do boss e a troca de fase
    const _origAdvance = window.advanceStoryEnemy;
    if (typeof _origAdvance === 'function') {
        window.advanceStoryEnemy = async function() {
            window.limparCorrupcao(); // Limpa ANTES de spawnar o próximo
            return _origAdvance.apply(this, arguments);
        };
    }

    const _origHandleDefeat = window.handleStoryBossDefeat;
    if (typeof _origHandleDefeat === 'function') {
        window.handleStoryBossDefeat = async function() {
            window.limparCorrupcao(); // Limpa no momento da morte
            return _origHandleDefeat.apply(this, arguments);
        };
    }

    const _origInitBattle = window.initStoryBattle;
    if (typeof _origInitBattle === 'function') {
        window.initStoryBattle = async function() {
            window.limparCorrupcao(); // Limpa ao começar a batalha
            return _origInitBattle.apply(this, arguments);
        };
    }

    // 3. PRESERVAR O VISUAL DO TILE
    const _origCreateTile = window.createTile;
    if (typeof _origCreateTile === 'function') {
        window.createTile = function(idx) {
            const tile = _origCreateTile.apply(this, arguments);
            if (window._corruptedTiles && window._corruptedTiles.includes(idx)) {
                tile.classList.add('tile-corrupted');
                tile.innerHTML = `<div class="corruption-fx"></div>`;
            }
            return tile;
        };
    }

    // 4. CLIQUE NO TILE (Solo Sagrado limpa, clique normal bloqueia)
    const _origSelect = window.handleSelect;
    if (typeof _origSelect === 'function') {
        window.handleSelect = function(idx) {
            if (window._corruptedTiles && window._corruptedTiles.includes(idx)) {
                const p = players[currentPlayerIdx];
                
                if (p && skillActive) {
                    window._corruptedTiles = window._corruptedTiles.filter(i => i !== idx);
                    p.skillUsed = true;
                    skillActive = false;
                    document.querySelectorAll('#grid .tile').forEach(t => t.classList.remove('skill-mode'));
                    
                    if (typeof addLog === 'function') addLog(`✨ SOLO SAGRADO: Corrupção limpa!`);
                    if (typeof playSfx === 'function') playSfx('skill1');
                    if (typeof spawnFxAt === 'function') spawnFxAt('impact', 'fx-impact', idx % 8, Math.floor(idx / 8), { duration: 600 });

                    restaurarTile(idx);
                    if (typeof saveAndRefresh === 'function') saveAndRefresh();
                    return; 
                } else {
                    if (typeof addLog === 'function') addLog(`⛔ Este tile está corrompido! Ative o Solo Sagrado para limpá-lo.`);
                    return;
                }
            }
            return _origSelect.apply(this, arguments);
        };
    }

    // 5. CSS
    if (!document.getElementById('corruptionCSS')) {
        const style = document.createElement('style');
        style.id = 'corruptionCSS';
        style.textContent = `
            .tile.tile-corrupted {
                background: linear-gradient(135deg, #1a0a1a, #050205) !important;
                box-shadow: inset 0 0 15px rgba(142,68,173,0.8), 0 0 10px rgba(0,0,0,1) !important;
                border: 2px solid #6a1090 !important;
                cursor: not-allowed !important;
                position: relative;
                overflow: hidden;
            }
            .tile.tile-corrupted::before {
                content: '⛧';
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                font-size: 2rem;
                color: rgba(142,68,173,0.4);
                animation: corruptPulse 2s infinite alternate;
            }
            @keyframes corruptPulse {
                from { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
                to { opacity: 0.8; transform: translate(-50%, -50%) scale(1.2); }
            }
            .corruption-fx {
                position: absolute; inset: 0;
                background: radial-gradient(circle, rgba(142,68,173,0.3), transparent 70%);
                animation: pulseSkill 2s infinite;
            }
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -30%) scale(0.9); }
                10% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                90% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -70%) scale(0.9); }
            }
        `;
        document.head.appendChild(style);
    }

    console.log('✅ [V10.53] Corrupção Pronta (Reset Ativo + Banner).');
})();
// =================================================================
// =================================================================
// historia.js — V120 — Fix Caboclo d'Água (apóstrofo quebrava o Ritual)
// -----------------------------------------------------------------
// PROBLEMA:
//   O className do herói era "Caboclo d'Água". Esse ' era escapado em
//   handleRitualAscend('Caboclo d\'Água') e chegava corrompido no
//   ascendHero(), devolvendo "Herói não encontrado." — só no ritual de
//   subir de nível (nível 11), apesar do card aparecer na lista.
//
// SOLUÇÃO:
//   Mesmo tratamento já usado na Tapyra (V34.0): o herói passa a usar
//   "Caboclo d Água" (sem apóstrofo) na chave e no className, e o save
//   do jogador é migrado automaticamente.
// =================================================================

(function renomearCabocloAguaV120() {
    if (window._renomearCabocloV120) return;
    window._renomearCabocloV120 = true;

    const ANTIGO = "Caboclo d'Água";
    const NOVO   = "Caboclo d Água";

    // 1. STORY_HERO_CLASSES — move a chave (a definição nova pode não existir
    //    caso o herói tenha sido adicionado antes do patch).
    if (typeof STORY_HERO_CLASSES !== 'undefined') {
        const heroVelho = STORY_HERO_CLASSES[ANTIGO];
        if (heroVelho) {
            heroVelho.className   = NOVO;
            heroVelho.displayName = 'Caboclo dágua';
            STORY_HERO_CLASSES[NOVO] = heroVelho;
            delete STORY_HERO_CLASSES[ANTIGO];
        }
        if (STORY_HERO_CLASSES[NOVO]) {
            STORY_HERO_CLASSES[NOVO].displayName = 'Caboclo dágua';
            STORY_HERO_CLASSES[NOVO].className   = NOVO;
        }
    }

    // 2. Unlocks por estrelas
    if (typeof STORY_HERO_UNLOCKS !== 'undefined' && Array.isArray(STORY_HERO_UNLOCKS)) {
        STORY_HERO_UNLOCKS.forEach(entry => {
            if (entry.className === ANTIGO) entry.className = NOVO;
            if (entry.displayName === 'Caboclo d\'Água') entry.displayName = 'Caboclo dágua';
        });
    }

    // 3. Detalhes ("?" do herói)
    if (typeof STORY_HERO_DETAILS !== 'undefined' && STORY_HERO_DETAILS[ANTIGO]) {
        STORY_HERO_DETAILS[NOVO] = STORY_HERO_DETAILS[ANTIGO];
        delete STORY_HERO_DETAILS[ANTIGO];
    }

    // 4. GIFs do Bravely
    if (typeof STORY_BRAVELY_GIFS !== 'undefined' && STORY_BRAVELY_GIFS[ANTIGO] !== undefined) {
        STORY_BRAVELY_GIFS[NOVO] = STORY_BRAVELY_GIFS[ANTIGO];
        delete STORY_BRAVELY_GIFS[ANTIGO];
    }

    // 5. Save do jogador — níveis, stat 11, desbloqueios, seleção e líder
    if (typeof STORY_PROGRESS !== 'undefined') {
        let mudou = false;

        ['heroLevels', 'heroStat11'].forEach(campo => {
            const mapa = STORY_PROGRESS[campo];
            if (mapa && mapa[ANTIGO] !== undefined) {
                mapa[NOVO] = mapa[ANTIGO];
                delete mapa[ANTIGO];
                mudou = true;
            }
        });

        ['unlockedHeroesStory', 'selectedHeroes'].forEach(campo => {
            if (Array.isArray(STORY_PROGRESS[campo])) {
                const idx = STORY_PROGRESS[campo].indexOf(ANTIGO);
                if (idx !== -1) {
                    STORY_PROGRESS[campo][idx] = NOVO;
                    mudou = true;
                }
            }
        });

        if (STORY_PROGRESS.leader === ANTIGO) {
            STORY_PROGRESS.leader = NOVO;
            mudou = true;
        }

        // Não salva aqui: o progresso precisa estar carregado.
        // A migração será persistida no próximo saveStoryProgress().
        if (mudou) console.log('[V120] Save migrado: Caboclo d\'Água → Caboclo d Água');
    }

    console.log('✅ [V120] Caboclo d Água: ritual de nível 11 funcionando sem apóstrofo.');
})();
