// =================================================================
// ajuda.js — V1.0 — Sistema Completo de Ajuda e Perfil
// -----------------------------------------------------------------
// Acesso: Aldeia → card "👤 PERFIL"
// Perfil do jogador + busca + 8 categorias + ~45 tópicos
//
// ⚠️ PvP e Coop NÃO estão cobertos ainda (arquivos não fornecidos).
//    Basta adicionar novos tópicos em HELP_DATA['multiplayer'].
// =================================================================
(function ajudaSistemaV1() {
    if (window._ajudaV1) return;
    window._ajudaV1 = true;

    // ═══════════════════════════════════════════════════════════
    // DATA — TODO O CONTEÚDO DE AJUDA AQUI
    // ═══════════════════════════════════════════════════════════
    const HELP_DATA = {
        basico: {
            label: '📖 Básico',
            icon: '📖',
            topics: [
                { id: 'o_que_e', titulo: 'O que é Confronto de Lendas?',
                  html: `É um jogo de estratégia por turnos onde você controla heróis de mitologias indígenas em uma jornada para restaurar o equilíbrio da natureza. Cada herói tem um papel (Guerreiro, Mago ou Arqueiro), um elemento (Fogo, Água, Terra ou Ar) e habilidades únicas.
                        <br><br>
                        Sua missão principal é derrotar <b>Anhangá</b>, o Senhor do Abismo, que corrompeu doze entidades guardiãs — do Saci ao Guaraci.` },

                { id: 'modos', titulo: 'Modos de jogo',
                  html: `<b>🗺️ Modo História:</b> Jornada principal. 13 atos, 130 fases, 13 bosses. A fonte de ouro, XP e materiais. Desbloqueia heróis, armas e amuletos.
                        <br><br>
                        <b>🌑 Evento Semanal (Sete Selados):</b> 7 bosses únicos, 1 por dia da semana. Boss final (Pesadelo) 1× ao mês. Dropa armas e fragmentos exclusivos.
                        <br><br>
                        <b>🌎 Sete Nações:</b> 7 panteões ancestrais (1 por dia da semana). 21 deuses no total. Sistema de 3 fases progressivas. Dropa equipamentos exclusivos das Nações.
                        <br><br>
                        <b>⛺ Expedições:</b> Envie heróis para farmar material em background enquanto você joga em outras telas.` },

                { id: 'moedas', titulo: 'Moedas e Recursos',
                  html: `<b>💰 Ouro:</b> Moeda principal. Ganha em fases, vende materiais no Escambo, recompensa de expedições. Usado pra forjar armas, upar níveis e pagar entrada de eventos.
                        <br><br>
                        <b>⭐ XP:</b> Experiência. Ganha nas mesmas fontes. Usado pra subir heróis de nível (1→10) e na Ascensão do nível 10→11.
                        <br><br>
                        <b>🌑 Essência Sombria:</b> Moeda do <b>Evento Semanal</b>. Dropa dos bosses dos Selados e do Pesadelo. Usada na Loja das Sombras e pra upar equipamentos dos Selados.
                        <br><br>
                        <b>🌎 Essência Ancestral:</b> Moeda do <b>Sete Nações</b>. Dropa dos deuses e do Pesadelo das Nações. Usada na Loja das Nações e pra upar equipamentos das Nações.
                        <br><br>
                        <b>⭐ Estrelas:</b> Conquista por fase (3 máx). Não é moeda — é progresso permanente. Desbloqueia heróis e slots de expedição.
                        <br><br>
                        <b>🌎 Fragmentos:</b> 7 Selados + 7 Nações = 14 fragmentos. Cada um desbloqueia um herói (Rudá e Abya).` },

                { id: 'progressao', titulo: 'Como progredir no jogo',
                  html: `Sugestão de progressão:
                        <br><br>
                        <b>1.</b> Complete o Ato 1 no Normal (fases 1-1 até 1-BOSS)
                        <br>
                        <b>2.</b> Use o ouro pra forjar a primeira arma (Tacape do Redemoinho, ~80 ouro)
                        <br>
                        <b>3.</b> Suba o herói pra nível 2-3 no Ritual
                        <br>
                        <b>4.</b> Complete 5-10 fases pra conseguir 20-30 estrelas → desbloqueia Kanarott e Juruá
                        <br>
                        <b>5.</b> Junte materiais pra forjar armas do Ato 2 (a partir do cap 2)
                        <br>
                        <b>6.</b> Entre em Expedições assim que tiver material suficiente pra enviar
                        <br>
                        <b>7.</b> Domine inimigos (Info 3) pra dobrar drops
                        <br>
                        <b>8.</b> Enfrente os eventos semanais quando tiver ouro e heróis de nível 5+` }
            ]
        },

        combate: {
            label: '⚔️ Combate',
            icon: '⚔️',
            topics: [
                { id: 'movimento', titulo: 'Movimento e alcance',
                  html: `Seu herói se move <b>ortogonalmente</b> (cima/baixo/esquerda/direita) e clica nos tiles pra traçar um caminho. O número de tiles no caminho determina o ataque.
                        <br><br>
                        <b>Guerreiro:</b> Precisa chegar <b>adjacente</b> ao inimigo pra atacar. Não tem alcance.
                        <br>
                        <b>Mago:</b> Alcance <b>3 a 4 tiles</b>. Precisa percorrer no mínimo 3-4 tiles no caminho pra atacar.
                        <br>
                        <b>Arqueiro:</b> Alcance <b>3 tiles</b>. Precisa percorrer no mínimo 3 tiles no caminho.
                        <br><br>
                        A <b>barra de preview</b> acima do tabuleiro mostra o dano estimado conforme você traça o caminho.` },

                { id: 'formas', titulo: 'Formas (Shapes)',
                  html: `Ao traçar exatamente <b>4 tiles</b>, o jogo detecta uma forma geométrica que dá bônus:
                        <br><br>
                        <b>🟦 LINHA</b> (4 em linha reta): +2 ATK e cura 1 HP
                        <br>
                        <b>🟪 L</b> (formato L): cura 2 HP
                        <br>
                        <b>🟨 ZIGZAG</b> (zigue-zague): +3 ATK
                        <br>
                        <b>🟪 QUADRADO</b> (2×2): recarrega o Solo Sagrado (skill)
                        <br><br>
                        As formas <b>se acumulam com o ATK base</b> — você não precisa sacrificar dano pra curar ou recarregar, ganha os dois.` },

                { id: 'bravely', titulo: 'Poder Ancestral (PA)',
                  html: `Se você percorrer <b>9+ tiles</b> no caminho (ou o número configurado), o herói ativa o <b>Poder Ancestral</b>:
                        <br><br>
                        • Uma animação épica é mostrada
                        <br>
                        • O dano é multiplicado e área de efeito expandida (varia por herói)
                        <br>
                        • Todos os tiles afetados são <b>convertidos</b> para o elemento do herói
                        <br><br>
                        <b>Dica:</b> nas Configurações você pode ativar "Pular animações de Poder Ancestral" pra acelerar o combate.
                        <br><br>
                        Cada herói tem uma PA única — alguns empurram, outros curam, outros aplicam dano em área. Veja o mini-grid no painel "?" do herói.` },

                { id: 'solo_sagrado', titulo: 'Solo Sagrado',
                  html: `Cada herói tem uma habilidade de <b>Solo Sagrado</b> que pode ser usada <b>uma vez por fase</b>.
                        <br><br>
                        <b>Como funciona:</b>
                        <br>
                        1. Clique no botão ✨ SOLO SAGRADO
                        <br>
                        2. Clique num tile do tabuleiro
                        <br>
                        3. Um pulso elemental limpa a área ao redor
                        <br><br>
                        <b>Usos principais:</b>
                        <br>
                        • <b>Purificar corrupção</b> (tiles negros com ⛧ — vindos de inimigos corrompidos)
                        <br>
                        • Converter tiles pra seu elemento (bônus de dano depois)
                        <br><br>
                        <b>Como recarregar:</b> forme um QUADRADO no caminho.` },

                { id: 'corrupcao', titulo: 'Corrupção do Tabuleiro',
                  html: `Quando um <b>boss</b> cai a <b>50% de HP</b>, ele enfurece e <b>corrompe 12 tiles</b> aleatórios do tabuleiro.
                        <br><br>
                        Tiles corrompidos:
                        <br>
                        • Ficam <b>negros com ⛧</b>
                        <br>
                        • Não podem ser atravessados
                        <br>
                        • São limpos por <b>Solo Sagrado</b>
                        <br><br>
                        <b>Dica:</b> guarde o Solo Sagrado pro momento certo. Usar cedo pode te deixar sem resposta quando a corrupção cair.` },

                { id: 'elementos', titulo: 'Elementos e fraqueza',
                  html: `Todo inimigo, herói e arma tem um dos 4 elementos. O ciclo de fraqueza é:
                        <br><br>
                        <b>🔥 FOGO</b> vence ⛰️ TERRA
                        <br>
                        <b>⛰️ TERRA</b> vence 🌪️ AR
                        <br>
                        <b>🌪️ AR</b> vence 💧 ÁGUA
                        <br>
                        <b>💧 ÁGUA</b> vence 🔥 FOGO
                        <br><br>
                        <b>No combate:</b>
                        <br>
                        • <b>+1 dano</b> se a arma for do seu elemento
                        <br>
                        • <b>+1 dano</b> se o inimigo é fraco contra o seu elemento
                        <br>
                        • <b>-1 dano</b> se sua arma é forte contra você
                        <br>
                        • <b>-1 dano</b> se o inimigo é forte contra você
                        <br>
                        • <b>-1 dano</b> se o tile que você pisa for forte contra você
                        <br><br>
                        Os bônus <b>se acumulam</b> com formas e PA.` },

                { id: 'passivas', titulo: 'Passivas dos heróis',
                  html: `Alguns heróis têm uma <b>passiva permanente</b> que funciona sempre que ele está vivo (não precisa ativar):
                        <br><br>
                        <b>Mãe da Mata:</b> +1 em toda cura que ela aplica
                        <br>
                        <b>Mãe-do-Ouro:</b> se o PA tiver menos de 4 tiles de caminho, vira explosão 3×3 no boss
                        <br>
                        <b>Matinta Pereira:</b> enquanto viva e adjacente ao boss, boss causa -1 dano
                        <br>
                        <b>Tupinambá:</b> reduz em 1 todo dano recebido
                        <br>
                        <b>Negrinho do Pastoreio:</b> 50% de chance de reviver com 1 HP (1× por batalha)
                        <br>
                        <b>Curupira:</b> 150% de dano em inimigos adjacentes
                        <br>
                        <b>Kianumanka-Manã:</b> 150% de dano se o inimigo está em tile de FOGO
                        <br>
                        <b>Rudá:</b> recupera 1 HP ao terminar turno em tile de AR
                        <br>
                        <b>Abya:</b> sobrevive com 1 HP (30% de chance, 1× por batalha)` },

                { id: 'lideranca', titulo: 'Liderança',
                  html: `Você escolhe <b>1 líder</b> na OCA. O líder gera um <b>buff passivo global</b> que funciona sempre (não precisa estar no time):
                        <br><br>
                        <b>Exemplos:</b>
                        <br>
                        • <b>Tupã:</b> +1 HP máximo a todos
                        <br>
                        • <b>Eru:</b> +1 ATK a todos
                        <br>
                        • <b>Pajé Anhanguera:</b> +2 ATK aos magos
                        <br>
                        • <b>Matinta Pereira:</b> +2 ATK aos arqueiros
                        <br>
                        • <b>Sume:</b> +8% XP em todas as batalhas
                        <br>
                        • <b>Mãe-do-Ouro:</b> +10% ouro em todas as batalhas
                        <br><br>
                        <b>Não afeta PvP nem Coop.</b> O bust do líder aparece em destaque na OCA.` }
            ]
        },

        itens: {
            label: '🎒 Itens',
            icon: '🎒',
            topics: [
                { id: 'armas', titulo: 'Armas',
                  html: `Cada herói usa <b>1 tipo</b> de arma conforme seu papel:
                        <br><br>
                        <b>🪓 Tacape</b> (Guerreiros)
                        <br>
                        <b>🏹 Flecha</b> (Arqueiros)
                        <br>
                        <b>🪄 Cajado</b> (Magos)
                        <br><br>
                        Cada arma tem:
                        <br>
                        • <b>ATK bônus</b> (soma direto no dano)
                        <br>
                        • <b>Elemento</b> (dá +1 dano se o tile inicial for do mesmo elemento)
                        <br>
                        • <b>Tier</b> (Simples / Aprimorado / Ancestral)
                        <br><br>
                        Armas dropam de bosses ou são forjadas na Tesouraria. Um herói só pode equipar 1 arma por vez, e do tipo compatível.` },

                { id: 'amuletos', titulo: 'Amuletos',
                  html: `Amuletos são <b>equipáveis por qualquer herói</b> (sem restrição de classe). Cada um dá um efeito único:
                        <br><br>
                        • <b>+X ATK</b> (dano extra)
                        <br>
                        • <b>+X HP</b> (vida extra)
                        <br>
                        • <b>Elemento fixo</b> (sobrescreve o elemento do herói)
                        <br>
                        • <b>Cura por turno</b> (regenera X HP cada turno)
                        <br>
                        • <b>Efeitos especiais</b> (ex: Coração do Vazio — sobrevive com 1 HP)
                        <br><br>
                        Cada herói pode equipar 1 amuleto por vez. Todos os amuletos dropam de bosses ou são forjados na Tesouraria.` },

                { id: 'tiers', titulo: 'Tiers de equipamento',
                  html: `Todo equipamento (arma e amuleto) tem 3 tiers possíveis:
                        <br><br>
                        <b>⚪ Simples</b> — tier 0 (padrão)
                        <br>
                        <b>🟣 Aprimorado</b> — +1 ATK / +1 HP / +1 em todos os bônus
                        <br>
                        <b>🟪 Ancestral</b> — +2 ATK / +2 HP / +2 em todos os bônus
                        <br><br>
                        <b>Como conseguir:</b>
                        <br>
                        • <b>Ao forjar:</b> 90% Simples, 9% Aprimorado, 1% Ancestral
                        <br>
                        • <b>Ao dropar:</b> o drop é sempre Simples (o RNG é só no craft)
                        <br>
                        • <b>Ao upar:</b> 100% garantido, mas custa muitos materiais
                        <br><br>
                        <b>Visual:</b> cada tier tem uma aura diferente (prata / lilás / roxa pulsante).` },

                { id: 'upgrade', titulo: 'Upgrade de equipamento',
                  html: `Na Tesouraria → Inventário, clique em <b>⬆️ UPAR</b> num item não equipado:
                        <br><br>
                        <b>Simples → Aprimorado:</b>
                        <br>
                        • Custa <b>10× a receita</b> + <b>10× o ouro</b>
                        <br>
                        • Se for item de evento/nação: <b>1000 Essências</b> (da moeda do evento)
                        <br><br>
                        <b>Aprimorado → Ancestral:</b>
                        <br>
                        • Custa <b>100× a receita</b> + <b>100× o ouro</b>
                        <br>
                        • Se for item de evento/nação: <b>10000 Essências</b> (da moeda do evento)
                        <br><br>
                        <b>⚠️ Regra:</b> precisa estar <b>desequipado</b> pra upar. Desequipe na OCA antes.
                        <br><br>
                        <b>Dica:</b> combine com <b>Conhecimento Info 3</b> (drop dobrado) pra acelerar o farm.` },

                { id: 'desmanchar', titulo: 'Desmanchar equipamento',
                  html: `Você pode <b>desmanchar</b> qualquer item não equipado pra recuperar <b>50% dos materiais</b> de todo o investimento (incluindo upgrades).
                        <br><br>
                        <b>Onde:</b>
                        <br>
                        • Tesouraria → Inventário → botão 🔥
                        <br>
                        • No painel do herói (se equipado)
                        <br><br>
                        <b>Exemplo:</b> se você upou uma arma pra Ancestral (investiu 111× a receita base), desmanchar devolve ~55× a receita.
                        <br><br>
                        <b>⚠️ Atenção:</b> o ouro investido <b>não é devolvido</b>. Só os materiais.` },

                { id: 'materiais', titulo: 'Materiais',
                  html: `Materiais são usados pra <b>forjar</b> e <b>upar</b> equipamentos. Vêm em 3 categorias:
                        <br><br>
                        <b>⚪ Comum:</b> chance de drop 70-80%. Ex: Espinho, Pele de Jacaré. Preço de venda: 2 ouro.
                        <br>
                        <b>🔵 Raro:</b> chance de drop 10-40%. Ex: Espinho Raro, Garra Lendária. Preço de venda: 8 ouro.
                        <br>
                        <b>🟣 Boss:</b> drop 100% de bosses. Ex: Gorro do Saci, Pelo do Mapinguari. Preço de venda: 30 ouro.
                        <br><br>
                        <b>Como conseguir:</b> derrote inimigos nas fases. Cada inimigo tem uma tabela de drop própria (veja no Bestiário com Info 3).
                        <br><br>
                        <b>Onde vender:</b> Escambo (antigo Curandeiro) na Aldeia.` },

                { id: 'itens_especiais', titulo: 'Itens especiais',
                  html: `<b>🌑 Núcleo do Abismo:</b> dropa em 13-4 no Difícil. Usado na Ascensão do nível 10→11 no Ritual. Também comprável na Loja das Sombras (1500 Essências).
                        <br><br>
                        <b>🖤 Coração do Vazio:</b> amuleto lendário da Loja das Sombras (10000 Essências) OU drop do Pesadelo. Sobrevive com 1 HP (1× por batalha, só solo/história). Durabilidade: 100% → 90% → 80% ... a cada uso. Quebra em 0%.
                        <br><br>
                        <b>🌪️ Semente do Vento:</b> consumível da Loja das Sombras (50 Essências). Reorganiza o tabuleiro inteiro sem afetar corrompidos. Máximo 1 por vez.
                        <br><br>
                        <b>🌎 Fragmentos:</b> 7 dos Selados + 7 das Nações. Cada conjunto completo desbloqueia um herói (Rudá / Abya).` }
            ]
        },

        herois: {
            label: '🦸 Heróis',
            icon: '🦸',
            topics: [
                { id: 'classes', titulo: 'Classes de herói',
                  html: `<b>⚔️ Guerreiro:</b> Alto HP, ataque corpo a corpo (adjacente). Bom pra tanque.
                        <br>
                        <b>🔮 Mago:</b> HP baixo, ataque à distância (3-4 tiles). Bom pra controle de área.
                        <br>
                        <b>🏹 Arqueiro:</b> HP médio, ataque à distância (3 tiles). Bom pra dano consistente.` },

                { id: 'desbloqueio', titulo: 'Como desbloquear heróis',
                  html: `Existem 4 formas de desbloquear heróis:
                        <br><br>
                        <b>1. Base (sempre disponíveis):</b> Tupã, Sumé, Caipora
                        <br><br>
                        <b>2. Por estrelas:</b> complete fases pra juntar estrelas. Kanarott (20⭐), Juruá (30⭐), Eru (60⭐), Teperesik (70⭐), Anduré (85⭐), Pajé Anhanguera (100⭐), Mãe da Mata (120⭐), Bicho Folharal (130⭐), Araci (140⭐), Tapyra-Yawara (170⭐)
                        <br><br>
                        <b>3. Por zerar dificuldade:</b> Curupira (zerar Normal), Kianumanka-Manã (zerar Difícil), Anhanga-Mirim (zerar Pesadelo)
                        <br><br>
                        <b>4. Por fragmentos:</b> Rudá (7 Fragmentos dos Selados), Abya (7 Fragmentos das Nações)
                        <br><br>
                        <b>Total: 26 heróis</b> jogáveis.` },

                { id: 'niveis', titulo: 'Níveis 1-10',
                  html: `Cada herói tem um nível individual (1 a 10). Subir de nível requer XP e ouro, e é feito no <b>Ritual de Ascensão</b> na Aldeia.
                        <br><br>
                        <b>Bônus por nível:</b>
                        <br>
                        • Nível 2: +1 HP
                        • Nível 4: +1 ATK
                        • Nível 6: +1 ATK em Formas
                        • Nível 8: +1 ATK no Poder Ancestral
                        • Nível 10: +2 HP
                        <br><br>
                        Os níveis <b>3, 5, 7, 9</b> são "degraus" (sem bônus direto) mas <b>não podem ser pulados</b> — você precisa deles pra chegar nos níveis 4, 6, 8, 10.
                        <br><br>
                        <b>Nível máximo: 11</b> (ver tópico próximo).` },

                { id: 'nivel11', titulo: 'Nível 11 — Stat Aleatório',
                  html: `Chegar ao nível 11 é um sistema especial de <b>Ascensão</b>:
                        <br><br>
                        <b>Requisitos:</b>
                        <br>
                        • Nível 10
                        <br>
                        • 3000 XP + 1800 ouro
                        <br>
                        • <b>1 Núcleo do Abismo</b>
                        <br><br>
                        <b>Recompensa:</b> um stat aleatório único e permanente. Pode ser:
                        <br>
                        • <b>Comum (60%):</b> +1 ATK, +2 HP, +1 Formas, -1 Alcance, +1 Elemento
                        <br>
                        • <b>Incomum (30%):</b> +2 ATK, +4 HP, +2 Formas
                        <br>
                        • <b>Raro (9%):</b> +3 ATK, +6 HP, +3 Formas, -1 PA, +1 Cura/turno
                        <br>
                        • <b>Jackpot (1%):</b> 2 stats aleatórios do Incomum
                        <br><br>
                        <b>Reroll:</b> se não gostou, gaste outro Núcleo pra sortear de novo. O stat anterior é <b>substituído</b>.
                        <br><br>
                        <b>Aura especial:</b> heróis nível 11 têm raios elétricos rotativos no tabuleiro.` }
            ]
        },

        historia: {
            label: '🗺️ História',
            icon: '🗺️',
            topics: [
                { id: 'estrutura', titulo: 'Estrutura do Modo História',
                  html: `São <b>13 atos</b>, cada um com <b>5 fases</b> = <b>65 fases por dificuldade</b>:
                        <br><br>
                        • 4 fases normais (inimigos comuns)
                        • 1 fase boss (boss principal do ato)
                        <br><br>
                        Cada fase pode ter <b>1 a 5 inimigos em sequência</b>. Você luta com todos, mas o dano persiste entre eles (não cura entre cada um).
                        <br><br>
                        Ao completar a <b>fase boss</b>, o próximo ato é desbloqueado automaticamente.` },

                { id: 'dificuldades', titulo: 'Dificuldades',
                  html: `Existem 3 dificuldades independentes:
                        <br><br>
                        <b>⚔️ Normal:</b> valores base. Desbloqueada desde o início.
                        <br><br>
                        <b>🔥 Difícil:</b> HP ×1.5, ATK ×1.3, recompensa ×1.5, +1 estrela de bônus. Desbloqueia ao zerar o Normal.
                        <br><br>
                        <b>💀 Pesadelo:</b> HP ×2.2, ATK ×1.6, recompensa ×2.5, +2 estrelas de bônus. Desbloqueia ao zerar o Difícil.
                        <br><br>
                        <b>⚠️ Atenção:</b> cada dificuldade tem <b>progresso independente</b> — complete o Ato 1 no Normal <b>não</b> desbloqueia o Ato 2 no Difícil. Você precisa rejogar tudo em cada dificuldade.
                        <br><br>
                        <b>Trocar dificuldade:</b> botão no topo da tela de Atos ou das fases.` },

                { id: 'estrelas', titulo: 'Sistema de estrelas',
                  html: `Cada fase dá até <b>3 estrelas</b>. A nota é calculada com base em:
                        <br>
                        • <b>Score de combate:</b> dano total causado, turnos usados, formas feitas, ultimates usados
                        <br>
                        • <b>Bônus de dificuldade:</b> Difícil +1 estrela, Pesadelo +2 estrelas
                        <br><br>
                        <b>Como funcionam:</b>
                        <br>
                        • <b>Progresso permanente:</b> a estrela recorde de cada fase fica salva
                        <br>
                        • <b>Não é moeda:</b> não pode ser "gasta"
                        <br>
                        • <b>Soma para desbloqueios:</b> heróis por estrelas + slots de expedição
                        <br><br>
                        <b>Total máximo:</b> 130 fases × 3 estrelas × 3 dificuldades = <b>1170 estrelas</b>.` },

                { id: 'replay', titulo: 'Rejogar fases',
                  html: `Você pode <b>rejogar qualquer fase</b> completada pra:
                        <br>
                        • Ganhar <b>material</b> dos drops de novo
                        <br>
                        • Farmar <b>XP e ouro</b> (metade se for replay)
                        <br>
                        • Testar heróis e builds diferentes
                        <br>
                        • Praticar Poder Ancestral
                        <br><br>
                        <b>⚠️ Replay não dá estrela nova.</b> A nota recorde é mantida — se você tirou 2 estrelas, precisa fazer uma pontuação maior que a anterior pra subir pra 3.` }
            ]
        },

        eventos: {
            label: '🌎 Eventos',
            icon: '🌎',
            topics: [
                { id: 'sete_selados', titulo: 'Evento Semanal — Sete Selados',
                  html: `<b>7 bosses únicos</b>, um por dia da semana:
                        <br>
                        • <b>Segunda:</b> Teju Jagua (Lagarto de 7 Cabeças)
                        <br>
                        • <b>Terça:</b> Mbói Tu'ĩ (Serpente Papagaio)
                        <br>
                        • <b>Quarta:</b> Moñái (Serpente Alada)
                        <br>
                        • <b>Quinta:</b> Jasy Jaterê (Duende do Sol)
                        <br>
                        • <b>Sexta:</b> Kurupí (Guardião da Floresta)
                        <br>
                        • <b>Sábado:</b> Ao Ao (Ovelha Canibal)
                        <br>
                        • <b>Domingo:</b> Luison (Senhor da Morte)
                        <br><br>
                        Cada boss tem <b>5 fases acumulativas</b> (Fase 1 = 1 animal, Fase 2 = 2 animais, ... Fase 5 = 4 animais + boss).
                        <br><br>
                        <b>Progresso:</b> reseta <b>toda segunda-feira</b>. Você tem a semana toda pra completar o boss do dia.
                        <br><br>
                        <b>Drops (Fase 5 / Boss):</b>
                        <br>
                        • Armas exclusivas (5-20% dependendo da dificuldade)
                        <br>
                        • Fragmentos (5-20%)
                        <br>
                        • Essências Sombrias (sempre) + Ouro + XP` },

                { id: 'pesadelo_selados', titulo: 'Pesadelo — Sete Selados',
                  html: `<b>1 vez por mês</b>, num dia aleatório (determinístico pela data).
                        <br><br>
                        É a <b>fusão dos 7 bosses</b> — você luta em sequência contra todos, no mesmo combate. HP total, ATK absurdo.
                        <br><br>
                        <b>Recompensas:</b>
                        <br>
                        • 50-80 Essências Sombrias
                        <br>
                        • 35% chance de arma (de qualquer nação)
                        <br>
                        • 20% chance de fragmento
                        <br>
                        • 25% chance de amuleto
                        <br>
                        • <b>Coração do Vazio</b> (chance igual à de fragmento)
                        <br><br>
                        <b>⚠️ Não dropa Núcleo do Abismo.</b>` },

                { id: 'sete_nacoes', titulo: 'Sete Nações',
                  html: `<b>7 nações</b>, uma por dia:
                        <br>
                        • <b>Segunda:</b> Taínos (Yúcahu, Atabey, Juracán)
                        <br>
                        • <b>Terça:</b> Astecas (Quetzalcóatl, Tezcatlipoca, Huitzilopochtli)
                        <br>
                        • <b>Quarta:</b> Maias (Kukulkán, Chaac, Ixchel)
                        <br>
                        • <b>Quinta:</b> Incas (Illapa, Mama Quilla, Supay)
                        <br>
                        • <b>Sexta:</b> Mapuches (Antü, Pillán, Wekufe)
                        <br>
                        • <b>Sábado:</b> Chibchas (Bochica, Bachué, Chibchacum)
                        <br>
                        • <b>Domingo:</b> Navajos (Ma'ii, Na'ashjé'íí, Hashch'é'íí)
                        <br><br>
                        Cada nação tem <b>3 deuses</b> em <b>3 fases acumulativas</b>:
                        <br>
                        • Fase 1: só o deus 1
                        <br>
                        • Fase 2: deus 1 + deus 2
                        <br>
                        • Fase 3: deus 1 + deus 2 + deus 3
                        <br><br>
                        <b>Custo de entrada:</b>
                        <br>
                        • Normal: 500 ouro
                        <br>
                        • Difícil: 1000 ouro
                        <br>
                        • Pesadelo: 1500 ouro
                        <br><br>
                        <b>Restrição de raridade por dia:</b>
                        <br>
                        • Segunda: até 1⭐
                        <br>
                        • Terça: até 2⭐
                        <br>
                        • Quarta: até 3⭐
                        <br>
                        • Quinta: até 4⭐
                        <br>
                        • Sexta: até 5⭐
                        <br>
                        • Sáb/Dom: sem restrição
                        <br><br>
                        <b>Drops (Fase 3):</b>
                        <br>
                        • Essências Ancestrais (sempre, escalonado por fase)
                        <br>
                        • 5-20% arma
                        <br>
                        • 5-20% fragmento
                        <br>
                        • 5-20% amuleto` },

                { id: 'pesadelo_nacoes', titulo: 'Pesadelo — Sete Nações',
                  html: `<b>1 vez por mês</b>, num dia aleatório. Você luta contra <b>7 deuses finais</b> em sequência:
                        <br>
                        Juracán · Huitzilopochtli · Ixchel · Supay · Pillán · Chibchacum · Hashch'é'íí
                        <br><br>
                        <b>Custo:</b> 1000 / 2000 / 3000 ouro (Normal / Difícil / Pesadelo)
                        <br><br>
                        <b>Recompensas:</b>
                        <br>
                        • 50-80 Essências Ancestrais
                        <br>
                        • 35% chance de arma (qualquer nação)
                        <br>
                        • 20% chance de fragmento
                        <br>
                        • 25% chance de amuleto` },

                { id: 'chaves', titulo: 'Chaves (Sete Selados)',
                  html: `O sistema de chaves é usado SÓ no <b>Evento dos Sete Selados</b>:
                        <br>
                        • Você ganha <b>10 chaves por semana</b> (reseta segunda)
                        <br>
                        • Máximo acumulável: <b>30 chaves</b>
                        <br>
                        • Cada fase de boss custa <b>1 chave</b>
                        <br>
                        • Fases de animal <b>não gastam chave</b>
                        <br><br>
                        <b>Como ganhar mais:</b>
                        <br>
                        • Aguarde a próxima segunda-feira (reset)
                        <br>
                        • Compre na Loja das Sombras (100 Essências Sombrias cada)
                        <br><br>
                        <b>⚠️ As Nações NÃO usam chaves.</b> Lá o custo é ouro.` }
            ]
        },

        progressao: {
            label: '🏆 Progressão',
            icon: '🏆',
            topics: [
                { id: 'expedicoes', titulo: 'Expedições',
                  html: `Envie heróis pra <b>farmar material em background</b>.
                        <br><br>
                        <b>Slots:</b>
                        <br>
                        • 3 slots iniciais
                        <br>
                        • +1 slot a cada 100 estrelas totais
                        <br>
                        • Máximo: 5 slots
                        <br><br>
                        <b>Como funciona:</b>
                        <br>
                        1. Clique em ⛺ no card do herói (na OCA)
                        <br>
                        2. Escolha a fase (deve estar completada)
                        <br>
                        3. Escolha a dificuldade
                        <br>
                        4. Pague o custo em ouro
                        <br>
                        5. Aguarde o tempo
                        <br>
                        6. Volte pra coletar
                        <br><br>
                        <b>Tempo:</b>
                        <br>
                        • Normal: 30 min
                        <br>
                        • Difícil: 1h
                        <br>
                        • Pesadelo: 2h
                        <br><br>
                        <b>Chance de sucesso:</b> calculada com base no poder do herói vs. dificuldade da fase. Mín 15% (30% no boss 13-4).
                        <br><br>
                        <b>Recompensa (sucesso):</b> 50% do XP/ouro da fase + drops normais
                        <br>
                        <b>Recompensa (falha):</b> 15% do XP (consolação)` },

                { id: 'conhecimento', titulo: 'Conhecimento dos Inimigos',
                  html: `Cada inimigo tem 3 níveis de conhecimento:
                        <br><br>
                        <b>📖 Info 1 (100%):</b> desbloqueia ao derrotar o inimigo pela 1ª vez. Mostra nome, HP, ATK, elemento e lore.
                        <br><br>
                        <b>📖 Info 2 (15% por vitória):</b> mostra as skills do inimigo + mini-grid 8×8 com o padrão de tiles de cada ataque.
                        <br><br>
                        <b>🧠 Info 3 (5% por vitória) — DOMINADO:</b> mostra os drops e as chances de drop.
                        <br><br>
                        <b>Bônus ao dominar:</b>
                        <br>
                        • Material dropado ×2 (chance continua igual)
                        <br>
                        • Essências Ancestral/Sombria ×2
                        <br>
                        • +10% XP e ouro (se o BOSS da fase é dominado)
                        <br><br>
                        <b>⚠️ Só rola Info 2 se já tem Info 1. Só rola Info 3 se já tem Info 2.</b>` },

                { id: 'bestiario', titulo: 'Bestiário',
                  html: `O <b>Bestiário</b> é uma enciclopédia de todos os inimigos que você já derrotou.
                        <br><br>
                        <b>Acesso:</b> Aldeia → card 📖 Bestiário
                        <br><br>
                        <b>O que mostra:</b>
                        <br>
                        • Silhueta até o 1º kill (Lv 0)
                        <br>
                        • Nome, HP, ATK, elemento, lore (Lv 1)
                        <br>
                        • Skills + mini-grid (Lv 2)
                        <br>
                        • Drops + chances (Lv 3)
                        <br><br>
                        <b>Filtros:</b>
                        <br>
                        • Por Ato (1 a 13)
                        <br>
                        • Por tipo (animal, mini-boss, boss, espectro, boss final)
                        <br><br>
                        <b>Bônus visual:</b> quando um inimigo é dominado, ele ganha badge dourado <b>🧠 DOMINADO</b>.` },

                { id: 'ritual', titulo: 'Ritual de Ascensão',
                  html: `O <b>Ritual de Ascensão</b> é onde você sobe os níveis dos heróis.
                        <br><br>
                        <b>Acesso:</b> Aldeia → card ⚖️ Ritual
                        <br><br>
                        <b>O que faz:</b>
                        <br>
                        • Níveis 2-10: paga XP + ouro, sobe 1 nível
                        <br>
                        • Nível 10→11: paga XP + ouro + Núcleo, rola stat aleatório
                        <br>
                        • Nível 11 (já ascendido): reroll de stat por 1 Núcleo
                        <br><br>
                        <b>Filtro por classe:</b> botões Todos / Guerreiros / Magos / Arqueiros.
                        <br><br>
                        <b>Card do herói:</b> mostra sprite, nível atual, bônus acumulados, próximo custo.` },

                { id: 'oca', titulo: 'OCA — Seleção de heróis',
                  html: `A <b>OCA</b> é onde você gerencia seus heróis.
                        <br><br>
                        <b>Acesso:</b> Aldeia → card 🏠 OCA
                        <br><br>
                        <b>O que faz:</b>
                        <br>
                        • Escolher o herói da próxima batalha (1 por fase)
                        <br>
                        • Ver todos os heróis desbloqueados
                        <br>
                        • Ver heróis bloqueados (com requisito de desbloqueio)
                        <br>
                        • Escolher o líder global
                        <br>
                        • Equipar armas e amuletos (botão ⚔️)
                        <br>
                        • Abrir painel de detalhes (botão ?)
                        <br>
                        • Ver as Expedições (botão ⛺)
                        <br>
                        • Filtrar por classe
                        <br><br>
                        <b>Bônus do líder:</b> veja tópico "Liderança" em Combate.` }
            ]
        },

        extras: {
            label: '💡 Extras',
            icon: '💡',
            topics: [
                { id: 'consumo', titulo: 'Recursos consumíveis em combate',
                  html: `<b>Corrupção de tabuleiro:</b> limpa com Solo Sagrado. Guarde para o momento certo.
                        <br><br>
                        <b>Semente do Vento:</b> reorganiza o tabuleiro sem afetar corrompidos. Bom pra forçar tiles que você precisa.
                        <br><br>
                        <b>Coração do Vazio:</b> sobrevive com 1 HP em dano fatal. Vale a pena equipar em heróis de HP baixo.
                        <br><br>
                        <b>⚠️ Esses consumíveis <u>não funcionam</u> em PvP nem Coop.</b>` },

                { id: 'dicas', titulo: 'Dicas rápidas',
                  html: `• <b>Formas não custam nada:</b> sempre tente fazer LINHA, L, ZIGZAG ou QUADRADO antes de atacar
                        <br><br>
                        • <b>Prepara o PA:</b> 9 tiles é o gatilho. Alinhe o caminho com o boss antes de confirmar
                        <br><br>
                        • <b>Não desperdice o Solo Sagrado cedo:</b> guarde pro corrompimento do boss
                        <br><br>
                        • <b>Combine elementos:</b> arma do seu elemento + boss fraco = até +2 dano base
                        <br><br>
                        • <b>Faça forma antes de PA:</b> LINHA/ZIGZAG dão +ATK, e o PA multiplica o total
                        <br><br>
                        • <b>Salve ouro:</b> o Ritual e o upgrade comem MUITO ouro. Priorize upar heróis pra nível 4 e 6 (bônus relevantes)
                        <br><br>
                        • <b>Domine os inimigos que você rejoga:</b> Info 3 dobra drops, e você rejoga toda fase pra farmar
                        <br><br>
                        • <b>Use expedições:</b> mesmo heróis fracos valem — a recompensa é passiva
                        <br><br>
                        • <b>Corrupção acontece só no boss:</b> não guarde Solo Sagrado em fases de animal` },

                { id: 'idiomas', titulo: 'Símbolos que você vai ver',
                  html: `• <b>⭐</b> = Estrelas (progresso)
                        <br>
                        • <b>💰</b> = Ouro
                        <br>
                        • <b>⭐ (com contador)</b> = XP
                        <br>
                        • <b>🌑</b> = Essência Sombria (Selados)
                        <br>
                        • <b>🌎</b> = Essência Ancestral (Nações)
                        <br>
                        • <b>🧠</b> = Conhecimento dominado (Info 3)
                        <br>
                        • <b>📖</b> = Conhecimento parcial (Info 1-2)
                        <br>
                        • <b>👑</b> = Líder / Rei / Boss
                        <br>
                        • <b>🧿</b> = Amuleto
                        <br>
                        • <b>⚔️</b> = Arma / Guerreiro
                        <br>
                        • <b>🏹</b> = Arqueiro / Flecha
                        <br>
                        • <b>🔮</b> = Mago / Cajado
                        <br>
                        • <b>✧ PA</b> = Poder Ancestral pronto (9+ tiles)
                        <br>
                        • <b>⛧</b> = Corrupção ativa no tile
                        <br>
                        • <b>?</b> = Botão de detalhes` },

                { id: 'salvamento', titulo: 'Salvamento e saves',
                  html: `O jogo salva automaticamente a cada ação relevante (drop, up, kill, compra).
                        <br><br>
                        <b>Múltiplos saves:</b> você pode ter vários saves paralelos. Cada um tem seu próprio progresso, ouro, heróis e estrelas.
                        <br><br>
                        <b>Trocar save:</b> Aldeia → botão 🔄 TROCAR SAVE no topo.
                        <br><br>
                        <b>Como salvar é feito:</b> o nome do save determina o elemento dos heróis base (Tupã, Sumé, Caipora). Ex: "Aline" pode dar ÁGUA, "Bruno" pode dar FOGO, dependendo do hash do nome.
                        <br><br>
                        <b>⚠️ Não apague o localStorage do navegador.</b> Você perde tudo.` }
            ]
        },

        multiplayer: {
            label: '👥 Multiplayer',
            icon: '👥',
            topics: [
                { id: 'pvp', titulo: 'PvP (Jogador vs Jogador)',
                  html: `⚠️ <b>Tópicos em construção.</b>
                        <br><br>
                        O modo PvP existe, mas não foram fornecidos detalhes ainda. Informações pendentes:
                        <br>
                        • Como entrar no PvP
                        • Regras específicas
                        • Ranking
                        • Recompensas
                        <br><br>
                        <b>Bônus conhecidos do PvP:</b>
                        <br>
                        • O <b>Coração do Vazio</b> NÃO funciona em PvP
                        • O <b>Poder Ancestral</b> funciona normalmente` },

                { id: 'coop', titulo: 'Coop (Cooperativo)',
                  html: `⚠️ <b>Tópicos em construção.</b>
                        <br><br>
                        O modo Coop existe, mas não foram fornecidos detalhes ainda. Informações pendentes:
                        <br>
                        • Como entrar
                        • Quantos jogadores
                        • Sincronização
                        • Recompensas
                        <br><br>
                        <b>Bônus conhecidos do Coop:</b>
                        <br>
                        • O <b>Coração do Vazio</b> NÃO funciona em Coop
                        • O <b>Poder Ancestral</b> funciona normalmente` }
            ]
        }
    };

    // ═══════════════════════════════════════════════════════════
    // ESTADO DA UI
    // ═══════════════════════════════════════════════════════════
    let _categoriaAtiva = 'basico';
    let _buscaTexto = '';

    // ═══════════════════════════════════════════════════════════
    // PERFIL DO JOGADOR
    // ═══════════════════════════════════════════════════════════
    function getPerfilStats() {
        if (typeof STORY_PROGRESS === 'undefined') return null;

        const saveName = (typeof STORY_CURRENT_SAVE_NAME === 'string')
            ? STORY_CURRENT_SAVE_NAME : '—';
        const gold = STORY_PROGRESS.gold || 0;
        const xp = STORY_PROGRESS.totalXP || 0;
        const stars = (typeof getTotalStars === 'function') ? getTotalStars() : 0;
        const maxStars = (typeof getMaxTotalStars === 'function') ? getMaxTotalStars() : 0;

        let totalFases = 0, fasesConcluidas = 0;
        if (typeof STORY_CHAPTERS !== 'undefined') {
            Object.values(STORY_CHAPTERS).forEach(ch => {
                totalFases += ch.phases.length;
                fasesConcluidas += ch.phases.filter(p =>
                    typeof isPhaseCompleted === 'function' && isPhaseCompleted(p.id)
                ).length;
            });
        }

        const heroisDesbloqueados = (STORY_PROGRESS.unlockedHeroesStory || ['Tupa']).length;
        const heroisTotal = (typeof STORY_HERO_CLASSES !== 'undefined')
            ? Object.keys(STORY_HERO_CLASSES).length : 0;

        const element = (typeof getSaveElement === 'function') ? getSaveElement() : '—';

        const essSom = STORY_PROGRESS.inventory?.essencia_sombria || 0;
        const essAnc = STORY_PROGRESS.inventory?.essencia_ancestral || 0;

        return {
            saveName, gold, xp, stars, maxStars,
            fasesConcluidas, totalFases,
            heroisDesbloqueados, heroisTotal,
            element, essSom, essAnc,
        };
    }

    function _renderPerfilTopo() {
        const p = getPerfilStats();
        if (!p) return '';

        const elClass = p.element.toLowerCase();
        const elLabel = ({ FOGO:'🔥 Fogo', AGUA:'💧 Água', TERRA:'⛰️ Terra', AR:'🌪️ Ar' })[p.element] || p.element;
        const pct = p.totalFases > 0 ? Math.round((p.fasesConcluidas / p.totalFases) * 100) : 0;

        return `
            <div class="ajuda-perfil">
                <div class="ajuda-perfil-header">
                    <div class="ajuda-perfil-avatar">👤</div>
                    <div class="ajuda-perfil-info">
                        <div class="ajuda-perfil-nome">${p.saveName}</div>
                        <div class="ajuda-perfil-elemento elem-${p.element}">${elLabel}</div>
                    </div>
                </div>
                <div class="ajuda-perfil-stats">
                    <div class="ajuda-perfil-stat"><span class="label">Ouro</span><span class="value">💰 ${p.gold}</span></div>
                    <div class="ajuda-perfil-stat"><span class="label">XP</span><span class="value">⭐ ${p.xp}</span></div>
                    <div class="ajuda-perfil-stat"><span class="label">Estrelas</span><span class="value">⭐ ${p.stars}/${p.maxStars}</span></div>
                    <div class="ajuda-perfil-stat"><span class="label">Essência Sombria</span><span class="value">🌑 ${p.essSom}</span></div>
                    <div class="ajuda-perfil-stat"><span class="label">Essência Ancestral</span><span class="value">🌎 ${p.essAnc}</span></div>
                    <div class="ajuda-perfil-stat"><span class="label">Heróis</span><span class="value">🦸 ${p.heroisDesbloqueados}/${p.heroisTotal}</span></div>
                </div>
                <div class="ajuda-perfil-progresso">
                    <div class="ajuda-perfil-progresso-label">Progresso Geral: ${p.fasesConcluidas}/${p.totalFases} fases (${pct}%)</div>
                    <div class="ajuda-perfil-progresso-bar">
                        <div class="ajuda-perfil-progresso-fill" style="width:${pct}%"></div>
                    </div>
                </div>
            </div>
        `;
    }

    // ═══════════════════════════════════════════════════════════
    // RENDER DO TÓPICO
    // ═══════════════════════════════════════════════════════════
    function _renderTopico(topico, catId, idx) {
        const id = `ajuda-topico-${catId}-${idx}`;
        return `
            <div class="ajuda-topico" id="${id}">
                <div class="ajuda-topico-header" onclick="window._ajudaToggleTopico('${id}')">
                    <span class="ajuda-topico-titulo">${topico.titulo}</span>
                    <span class="ajuda-topico-icon">▾</span>
                </div>
                <div class="ajuda-topico-conteudo" style="display:none;">
                    ${topico.html}
                </div>
            </div>
        `;
    }

    // ═══════════════════════════════════════════════════════════
    // FILTRO DE BUSCA
    // ═══════════════════════════════════════════════════════════
    function _topicoMatch(topico, query) {
        if (!query) return true;
        const q = query.toLowerCase();
        const titulo = topico.titulo.toLowerCase();
        const html = topico.html.toLowerCase().replace(/<[^>]*>/g, '');
        return titulo.includes(q) || html.includes(q);
    }

    // ═══════════════════════════════════════════════════════════
    // RENDER PRINCIPAL
    // ═══════════════════════════════════════════════════════════
    function renderAjudaScreen() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return;

        const q = _buscaTexto;
        const categorias = Object.keys(HELP_DATA);

        // Tabs de categorias
        const tabsHTML = categorias.map(catId => {
            const cat = HELP_DATA[catId];
            const ativo = catId === _categoriaAtiva;
            return `<button class="ajuda-tab ${ativo ? 'active' : ''}" data-cat="${catId}" onclick="window._ajudaSelCategoria('${catId}')">
                <span class="ajuda-tab-icon">${cat.icon}</span>
                <span class="ajuda-tab-label">${cat.label}</span>
            </button>`;
        }).join('');

        // Conteúdo
        let conteudoHTML = '';
        if (q) {
            // Busca global: mostra tópicos de todas as categorias
            const resultados = [];
            categorias.forEach(catId => {
                const cat = HELP_DATA[catId];
                cat.topics.forEach((t, i) => {
                    if (_topicoMatch(t, q)) {
                        resultados.push({
                            catLabel: cat.label,
                            catIcon: cat.icon,
                            catId,
                            topico: t,
                            idx: i,
                        });
                    }
                });
            });
            if (resultados.length === 0) {
                conteudoHTML = `<div class="ajuda-vazio">🔍 Nenhum resultado para "${q}"</div>`;
            } else {
                conteudoHTML = `
                    <div class="ajuda-resultados-header">${resultados.length} resultado(s) para "${q}"</div>
                    ${resultados.map(r => `
                        <div class="ajuda-resultado-categoria">${r.catIcon} ${r.catLabel}</div>
                        ${_renderTopico(r.topico, r.catId, r.idx)}
                    `).join('')}
                `;
            }
        } else {
            // Categoria única
            const cat = HELP_DATA[_categoriaAtiva];
            if (!cat) return;
            conteudoHTML = cat.topics.map((t, i) => _renderTopico(t, _categoriaAtiva, i)).join('');
        }

        screen.innerHTML = `
            <div class="story-container">
                <div class="story-header">
                    <h1 class="story-title">👤 PERFIL E AJUDA</h1>
                    <p class="story-subtitle">Tudo o que você precisa saber sobre o jogo.</p>
                </div>

                ${_renderPerfilTopo()}

                <div class="ajuda-busca-wrap">
                    <input type="text" class="ajuda-busca" id="ajudaBusca"
                        placeholder="🔍 Buscar tópico ou palavra-chave (ex: forma, PA, estrela, essência)"
                        value="${_buscaTexto.replace(/"/g, '&quot;')}"
                        oninput="window._ajudaBuscar(this.value)">
                </div>

                <div class="ajuda-tabs">${tabsHTML}</div>

                <div class="ajuda-conteudo">${conteudoHTML}</div>

                <div class="story-footer">
                    <button class="story-back-btn" onclick="renderAldeiaScreen()">← VOLTAR À ALDEIA</button>
                </div>
            </div>
        `;
        screen.classList.add('active');
        screen.style.display = 'flex';
    }
    window.renderAjudaScreen = renderAjudaScreen;

    // ═══════════════════════════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════════════════════════
    window._ajudaSelCategoria = function(catId) {
        _categoriaAtiva = catId;
        _buscaTexto = '';
        renderAjudaScreen();
    };

    window._ajudaToggleTopico = function(id) {
        const el = document.getElementById(id);
        if (!el) return;
        const conteudo = el.querySelector('.ajuda-topico-conteudo');
        const icon = el.querySelector('.ajuda-topico-icon');
        if (!conteudo) return;
        const isOpen = conteudo.style.display !== 'none';
        conteudo.style.display = isOpen ? 'none' : 'block';
        if (icon) icon.textContent = isOpen ? '▾' : '▴';
        el.classList.toggle('aberto', !isOpen);
    };

    window._ajudaBuscar = function(valor) {
        _buscaTexto = (valor || '').trim();
        // Re-renderiza só o bloco de conteúdo pra não perder foco do input
        const screen = document.getElementById('storyScreen');
        const container = screen?.querySelector('.ajuda-conteudo');
        if (!container) { renderAjudaScreen(); return; }

        const categorias = Object.keys(HELP_DATA);
        let conteudoHTML = '';

        if (_buscaTexto) {
            const resultados = [];
            categorias.forEach(catId => {
                const cat = HELP_DATA[catId];
                cat.topics.forEach((t, i) => {
                    if (_topicoMatch(t, _buscaTexto)) {
                        resultados.push({ catLabel: cat.label, catIcon: cat.icon, catId, topico: t, idx: i });
                    }
                });
            });
            if (resultados.length === 0) {
                conteudoHTML = `<div class="ajuda-vazio">🔍 Nenhum resultado para "${_buscaTexto}"</div>`;
            } else {
                conteudoHTML = `
                    <div class="ajuda-resultados-header">${resultados.length} resultado(s) para "${_buscaTexto}"</div>
                    ${resultados.map(r => `
                        <div class="ajuda-resultado-categoria">${r.catIcon} ${r.catLabel}</div>
                        ${_renderTopico(r.topico, r.catId, r.idx)}
                    `).join('')}
                `;
            }
        } else {
            const cat = HELP_DATA[_categoriaAtiva];
            if (cat) conteudoHTML = cat.topics.map((t, i) => _renderTopico(t, _categoriaAtiva, i)).join('');
        }
        container.innerHTML = conteudoHTML;
    };

    // ═══════════════════════════════════════════════════════════
    // CARD NA ALDEIA
    // ═══════════════════════════════════════════════════════════
    const _origRenderAldeia = window.renderAldeiaScreen;
    if (typeof _origRenderAldeia === 'function' && !_origRenderAldeia._ajuda) {
        window.renderAldeiaScreen = function() {
            const r = _origRenderAldeia.apply(this, arguments);
            setTimeout(_injetarCardAjuda, 100);
            setTimeout(_injetarCardAjuda, 400);
            return r;
        };
        window.renderAldeiaScreen._ajuda = true;
    }

    function _injetarCardAjuda() {
        const grid = document.querySelector('.story-ald-grid');
        if (!grid) return;
        if (grid.querySelector('.ajuda-aldeia-card')) return;

        const card = document.createElement('div');
        card.className = 'story-ald-location ajuda-aldeia-card';
        card.style.borderColor = '#4a8cb5';
        card.onclick = () => renderAjudaScreen();
        card.innerHTML = `
            <div class="story-ald-loc-icon">👤</div>
            <div class="story-ald-loc-info">
                <div class="story-ald-loc-name">PERFIL E AJUDA</div>
                <div class="story-ald-loc-desc">Tire todas as suas dúvidas</div>
            </div>
        `;
        grid.appendChild(card);
    }

    // ═══════════════════════════════════════════════════════════
    // CSS
    // ═══════════════════════════════════════════════════════════
    if (!document.getElementById('ajudaCSS')) {
        const st = document.createElement('style');
        st.id = 'ajudaCSS';
        st.textContent = `
            /* ───── Card na Aldeia ───── */
            .ajuda-aldeia-card {
                border-color: #4a8cb5 !important;
                background: linear-gradient(180deg, rgba(74,140,181,.12), transparent 40%),
                            linear-gradient(180deg, rgba(42,31,16,.95), rgba(26,18,8,.95)) !important;
            }
            .ajuda-aldeia-card:hover {
                border-color: #6ab0d8 !important;
                box-shadow: 0 8px 25px rgba(0,0,0,.5), 0 0 30px rgba(74,140,181,.4) !important;
            }

            /* ───── Perfil ───── */
            .ajuda-perfil {
                background: linear-gradient(180deg, rgba(201,162,39,.06), transparent 40%), rgba(10,6,2,.6);
                border: 2px solid rgba(201,162,39,.3);
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 20px;
            }
            .ajuda-perfil-header {
                display: flex;
                align-items: center;
                gap: 14px;
                margin-bottom: 16px;
                padding-bottom: 16px;
                border-bottom: 1px solid rgba(201,162,39,.2);
            }
            .ajuda-perfil-avatar {
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: radial-gradient(circle at 30% 30%, #e8b923, #4a3418);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.8rem;
                box-shadow: 0 0 20px rgba(232,185,35,.5);
            }
            .ajuda-perfil-info { flex: 1; min-width: 0; }
            .ajuda-perfil-nome {
                font-family: 'Cinzel Decorative', serif;
                color: #e8b923;
                font-size: 1.4rem;
                letter-spacing: 1px;
                margin-bottom: 4px;
                text-shadow: 0 0 10px rgba(232,185,35,.4);
            }
            .ajuda-perfil-elemento {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                font-family: 'Cinzel', serif;
                font-size: .85rem;
                font-weight: 700;
                letter-spacing: 1px;
                padding: 3px 10px;
                border-radius: 12px;
                background: rgba(10,6,2,.6);
                border: 1px solid rgba(201,162,39,.3);
            }
            .ajuda-perfil-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 8px;
                margin-bottom: 16px;
            }
            .ajuda-perfil-stat {
                display: flex;
                flex-direction: column;
                padding: 8px 12px;
                background: rgba(10,6,2,.5);
                border: 1px solid rgba(201,162,39,.15);
                border-radius: 6px;
                text-align: center;
            }
            .ajuda-perfil-stat .label {
                font-family: 'EB Garamond', serif;
                color: #8a7a52;
                font-size: .7rem;
                font-style: italic;
                margin-bottom: 3px;
            }
            .ajuda-perfil-stat .value {
                font-family: 'Cinzel', serif;
                color: #e8b923;
                font-weight: 700;
                font-size: .85rem;
            }
            .ajuda-perfil-progresso-label {
                font-family: 'EB Garamond', serif;
                color: #b8a577;
                font-size: .85rem;
                font-style: italic;
                text-align: center;
                margin-bottom: 8px;
            }
            .ajuda-perfil-progresso-bar {
                height: 10px;
                background: #1a1208;
                border-radius: 5px;
                overflow: hidden;
                border: 1px solid rgba(201,162,39,.25);
            }
            .ajuda-perfil-progresso-fill {
                height: 100%;
                background: linear-gradient(90deg, #4a8cb5, #6ab0d8);
                transition: width .4s;
                box-shadow: 0 0 10px rgba(106,176,216,.6);
            }

            /* ───── Busca ───── */
            .ajuda-busca-wrap { margin-bottom: 16px; }
            .ajuda-busca {
                width: 100%;
                padding: 12px 16px;
                background: rgba(10,6,2,.7);
                color: #e8dcc4;
                border: 2px solid rgba(74,140,181,.4);
                border-radius: 8px;
                font-family: 'EB Garamond', serif;
                font-size: 1rem;
                outline: none;
                transition: all .2s;
                box-sizing: border-box;
            }
            .ajuda-busca:focus {
                border-color: #6ab0d8;
                box-shadow: 0 0 12px rgba(106,176,216,.4);
            }
            .ajuda-busca::placeholder { color: #6a5a40; font-style: italic; }

            /* ───── Tabs de categoria ───── */
            .ajuda-tabs {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-bottom: 16px;
            }
            .ajuda-tab {
                padding: 8px 14px;
                background: linear-gradient(135deg, #3d2d18, #2a1f10);
                color: #c8b787;
                border: 1px solid #6a5024;
                border-radius: 20px;
                cursor: pointer;
                font-family: 'Cinzel', serif;
                font-weight: 700;
                font-size: .8rem;
                letter-spacing: .5px;
                transition: all .2s;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            .ajuda-tab:hover { color: #e8dcc4; border-color: #c9a227; }
            .ajuda-tab.active {
                background:
                    linear-gradient(180deg, rgba(106,176,216,.25), transparent 45%),
                    linear-gradient(135deg, #4a8cb5, #2a4a6a);
                color: #fff5dc;
                border-color: #6ab0d8;
                box-shadow: 0 0 15px rgba(106,176,216,.4);
            }
            .ajuda-tab-icon { font-size: 1rem; }

            /* ───── Tópicos ───── */
            .ajuda-conteudo {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-bottom: 20px;
            }
            .ajuda-topico {
                background: rgba(10,6,2,.6);
                border: 1px solid rgba(201,162,39,.2);
                border-radius: 6px;
                overflow: hidden;
                transition: all .2s;
            }
            .ajuda-topico.aberto {
                border-color: rgba(74,140,181,.5);
                box-shadow: 0 0 15px rgba(74,140,181,.15);
            }
            .ajuda-topico-header {
                padding: 12px 16px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
                transition: background .2s;
                background: linear-gradient(180deg, rgba(201,162,39,.04), transparent);
            }
            .ajuda-topico-header:hover { background: rgba(74,140,181,.1); }
            .ajuda-topico-titulo {
                font-family: 'Cinzel', serif;
                color: #e8b923;
                font-size: .95rem;
                font-weight: 700;
                letter-spacing: .5px;
            }
            .ajuda-topico-icon {
                color: #8a7a52;
                font-size: .9rem;
                transition: transform .2s;
            }
            .ajuda-topico.aberto .ajuda-topico-icon {
                color: #6ab0d8;
            }
            .ajuda-topico-conteudo {
                padding: 14px 18px;
                font-family: 'EB Garamond', serif;
                color: #d9c89a;
                font-size: .95rem;
                line-height: 1.6;
                border-top: 1px solid rgba(201,162,39,.15);
                background: rgba(0,0,0,.2);
            }
            .ajuda-topico-conteudo b { color: #e8b923; }
            .ajuda-topico-conteudo u { color: #f5c8c8; text-decoration: underline; }

            /* ───── Resultados da busca ───── */
            .ajuda-resultados-header {
                font-family: 'Cinzel', serif;
                color: #8a7a52;
                font-size: .8rem;
                letter-spacing: 2px;
                text-align: center;
                margin-bottom: 10px;
                padding: 6px;
            }
            .ajuda-resultado-categoria {
                font-family: 'Cinzel', serif;
                color: #6ab0d8;
                font-size: .75rem;
                letter-spacing: 1.5px;
                font-weight: 700;
                margin-top: 10px;
                margin-bottom: 6px;
                padding-bottom: 4px;
                border-bottom: 1px solid rgba(74,140,181,.3);
            }
            .ajuda-vazio {
                text-align: center;
                padding: 40px 20px;
                font-family: 'EB Garamond', serif;
                color: #8a7a52;
                font-style: italic;
                font-size: 1rem;
                background: rgba(10,6,2,.4);
                border-radius: 6px;
            }

            @media (max-width: 600px) {
                .ajuda-perfil-stats { grid-template-columns: repeat(2, 1fr); }
                .ajuda-perfil-nome { font-size: 1.15rem; }
                .ajuda-tab { font-size: .7rem; padding: 6px 10px; }
                .ajuda-topico-conteudo { font-size: .9rem; padding: 12px 14px; }
            }
        `;
        document.head.appendChild(st);
    }

    // ═══════════════════════════════════════════════════════════
    // DEBUG
    // ═══════════════════════════════════════════════════════════
    window._debugAjuda = function() {
        console.group('=== AJUDA V1 ===');
        console.log('V1 ativo?', window._ajudaV1);
        console.log('Categorias:', Object.keys(HELP_DATA).length);
        let total = 0;
        Object.entries(HELP_DATA).forEach(([k, v]) => {
            total += v.topics.length;
            console.log(`  ${v.icon} ${v.label}: ${v.topics.length} tópicos`);
        });
        console.log('Total de tópicos:', total);
        console.groupEnd();
    };

    window._ajudaAddCategoria = function(catId, catData) {
        HELP_DATA[catId] = catData;
        console.log(`Categoria "${catId}" adicionada`);
    };

    window._ajudaAddTopico = function(catId, topico) {
        if (!HELP_DATA[catId]) {
            console.warn('Categoria não existe:', catId);
            return;
        }
        HELP_DATA[catId].topics.push(topico);
        console.log(`Tópico "${topico.titulo}" adicionado em ${catId}`);
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [ajuda.js V1.0] Sistema de Ajuda + Perfil');
    console.log('═══════════════════════════════════════════════════');
    console.log('📖 9 categorias · ~45 tópicos');
    console.log('👤 Perfil com stats do save + progresso geral');
    console.log('🔍 Busca global filtra por palavra-chave');
    console.log('🗂️ Acordeão por tópico (clique pra expandir)');
    console.log('📱 Layout responsivo (mobile-friendly)');
    console.log('');
    console.log('⚠️ MULTIPLAYER (PvP/Coop) está como placeholder');
    console.log('   Envie os arquivos pvp.js/coop.js que eu completo');
    console.log('');
    console.log('💡 Adicionar conteúdo sem editar código:');
    console.log('   window._ajudaAddTopico("combate", {');
    console.log('     titulo: "Novo tópico",');
    console.log('     html: "Conteúdo em HTML"');
    console.log('   })');
    console.log('');
    console.log('💡 Debug: window._debugAjuda()');
    console.log('═══════════════════════════════════════════════════');
})();
// =================================================================
// 🆘 ajuda.js — PATCH V2.0 — Botão de Ajuda no Perfil do Jogador
// -----------------------------------------------------------------
// Adiciona seção "📖 AJUDA" na tela de Perfil do Jogador
// (window._abrirTelaPerfilV3, definida em aldeia.js V3.2).
//
// • 9 botões de categoria → abrem ajuda filtrada
// • Botão "📖 ABRIR AJUDA COMPLETA" → visão geral
//
// Deve ser carregado DEPOIS de aldeia.js. Se não for, tenta a cada 300ms.
// Cole NO FINAL do ajuda.js.
// =================================================================
(function ajudaNoPerfilV2() {
    if (window._ajudaNoPerfilV2) return;
    window._ajudaNoPerfilV2 = true;

    // ─────────────────────────────────────────────
    // 1. CSS
    // ─────────────────────────────────────────────
    if (!document.getElementById('ajudaPerfilV2CSS')) {
        const style = document.createElement('style');
        style.id = 'ajudaPerfilV2CSS';
        style.textContent = `
            .profile-help-section {
                background:
                    linear-gradient(180deg, rgba(58,124,165,.12), transparent 45%),
                    rgba(20,15,10,.85) !important;
                border-color: rgba(74,140,181,.4) !important;
            }
            .profile-help-categories {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));
                gap: 8px;
                margin: 14px 0;
            }
            .profile-help-cat-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                padding: 10px 6px;
                background: rgba(10,6,2,.55);
                border: 1px solid rgba(201,162,39,.25);
                border-radius: 8px;
                cursor: pointer;
                transition: all .2s;
                font-family: 'Cinzel', serif;
                font-size: .72rem;
                font-weight: 700;
                color: #d9c89a;
                letter-spacing: .5px;
                text-align: center;
                line-height: 1.2;
            }
            .profile-help-cat-btn:hover {
                background: rgba(74,140,181,.2);
                border-color: #6ab0d8;
                color: #fff5dc;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,.5);
            }
            .profile-help-cat-btn .cat-icon {
                font-size: 1.4rem;
                line-height: 1;
            }
            .profile-help-full-btn {
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #4a8cb5, #2a4a6a);
                color: #fff5dc;
                border: 2px solid #6ab0d8;
                border-radius: 8px;
                cursor: pointer;
                font-family: 'Cinzel', serif;
                font-weight: 700;
                font-size: .9rem;
                letter-spacing: 1.5px;
                transition: all .2s;
            }
            .profile-help-full-btn:hover {
                background: linear-gradient(135deg, #6ab0d8, #3a5a7a);
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(74,140,181,.5);
            }
            @media (max-width: 600px) {
                .profile-help-categories {
                    grid-template-columns: repeat(3, 1fr);
                }
                .profile-help-cat-btn { font-size: .65rem; padding: 8px 4px; }
                .profile-help-cat-btn .cat-icon { font-size: 1.2rem; }
            }
        `;
        document.head.appendChild(style);
    }

    // ─────────────────────────────────────────────
    // 2. Categorias (espelham o HELP_DATA)
    // ─────────────────────────────────────────────
    const CATEGORIAS = [
        { id: 'basico',      icon: '📖', label: 'Básico' },
        { id: 'combate',     icon: '⚔️', label: 'Combate' },
        { id: 'itens',       icon: '🎒', label: 'Itens' },
        { id: 'herois',      icon: '🦸', label: 'Heróis' },
        { id: 'historia',    icon: '🗺️', label: 'História' },
        { id: 'eventos',     icon: '🌎', label: 'Eventos' },
        { id: 'progressao',  icon: '🏆', label: 'Progressão' },
        { id: 'extras',      icon: '💡', label: 'Extras' },
        { id: 'multiplayer', icon: '👥', label: 'Multiplayer' },
    ];

    // ─────────────────────────────────────────────
    // 3. Injeção da seção no grid do perfil
    // ─────────────────────────────────────────────
    function _injetarSecao() {
        const screen = document.getElementById('storyScreen');
        if (!screen) return false;
        const grid = screen.querySelector('.profile-sections-grid');
        if (!grid) return false;
        if (grid.querySelector('.profile-help-section')) return true;

        const catsHTML = CATEGORIAS.map(c => `
            <button class="profile-help-cat-btn"
                    onclick="window._ajudaSelCategoria('${c.id}')">
                <span class="cat-icon">${c.icon}</span>
                <span>${c.label}</span>
            </button>
        `).join('');

        const section = document.createElement('div');
        section.className = 'profile-section-card profile-help-section';
        section.innerHTML = `
            <h3 class="profile-section-title">📖 AJUDA</h3>
            <p class="profile-section-desc">Tire suas dúvidas sobre mecânicas, heróis, itens e eventos.</p>
            <div class="profile-help-categories">${catsHTML}</div>
            <button class="profile-help-full-btn"
                    onclick="window.renderAjudaScreen()">
                📖 ABRIR AJUDA COMPLETA
            </button>
        `;
        grid.appendChild(section);
        console.log('[Ajuda V2] Seção AJUDA injetada no perfil.');
        return true;
    }

    // ─────────────────────────────────────────────
    // 4. Hook em _abrirTelaPerfilV3
    // ─────────────────────────────────────────────
    let _hookInstalado = false;

    function _instalarHook() {
        if (_hookInstalado) return true;
        const orig = window._abrirTelaPerfilV3;
        if (typeof orig !== 'function') return false;

        window._abrirTelaPerfilV3 = function() {
            const r = orig.apply(this, arguments);
            setTimeout(_injetarSecao, 50);
            setTimeout(_injetarSecao, 200);
            setTimeout(_injetarSecao, 500);
            return r;
        };
        window._abrirTelaPerfilV3._ajudaV2 = true;
        _hookInstalado = true;
        console.log('[Ajuda V2] Hook instalado em _abrirTelaPerfilV3.');
        return true;
    }

    // Tenta instalar agora; se não der, faz polling (aldeia.js pode carregar depois)
    if (!_instalarHook()) {
        let tentativas = 0;
        const timer = setInterval(() => {
            tentativas++;
            if (_instalarHook() || tentativas > 60) {
                clearInterval(timer);
                if (!_hookInstalado) {
                    console.warn('[Ajuda V2] _abrirTelaPerfilV3 não apareceu após 20s.');
                }
            }
        }, 300);
    }

    // ─────────────────────────────────────────────
    // 5. Fallback: se o perfil já estiver aberto
    // ─────────────────────────────────────────────
    setTimeout(() => {
        const screen = document.getElementById('storyScreen');
        if (screen?.querySelector('.profile-main-card')) _injetarSecao();
    }, 800);
    setTimeout(() => {
        const screen = document.getElementById('storyScreen');
        if (screen?.querySelector('.profile-main-card')) _injetarSecao();
    }, 2000);

    // ─────────────────────────────────────────────
    // 6. Debug
    // ─────────────────────────────────────────────
    window._debugAjudaPerfil = function() {
        const screen = document.getElementById('storyScreen');
        console.group('=== [Ajuda V2] Perfil ===');
        console.log('_abrirTelaPerfilV3 existe?', typeof window._abrirTelaPerfilV3 === 'function');
        console.log('Hook instalado?', _hookInstalado);
        console.log('Perfil aberto?', !!screen?.querySelector('.profile-main-card'));
        console.log('Seção AJUDA no perfil?', !!screen?.querySelector('.profile-help-section'));
        console.log('renderAjudaScreen disponível?', typeof window.renderAjudaScreen === 'function');
        console.log('_ajudaSelCategoria disponível?', typeof window._ajudaSelCategoria === 'function');
        console.groupEnd();
    };

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ [ajuda.js V2.0] Seção AJUDA no Perfil do Jogador');
    console.log('═══════════════════════════════════════════════════');
    console.log('• 9 botões de categoria (abrem ajuda filtrada)');
    console.log('• Botão "📖 ABRIR AJUDA COMPLETA"');
    console.log('• Aparece como 3ª seção no .profile-sections-grid');
    console.log('• Debug: window._debugAjudaPerfil()');
    console.log('═══════════════════════════════════════════════════');
})();