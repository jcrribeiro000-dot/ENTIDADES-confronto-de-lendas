// =================================================================
// ENTIDADES: Confronto de Lendas — MODO HISTÓRIA
// historia.js — V6.0
// =================================================================
//
// ⚠️ NÃO TOCA EM entidades.js
// Sobrescreve applyDmg/manageTurns/saveAndRefresh SÓ quando _storyMode === true.
//
// V6.0 — MUDANÇAS PRINCIPAIS:
//   • Skills ÚNICAS para cada animal dos 13 atos (nada mais genérico)
//   • Sistema STORY_FX_SPRITES com fallback CSS → sprite
//   • 27 efeitos visuais CSS novos + 12 helpers de FX
//   • STORY_ENEMIES reescrito com campo 'handler' (todos com 2 skills)
//   • applyStorySkill() delega pros handlers customizados
//
// V5.x — CORREÇÕES ACUMULADAS:
//   • B1 — playBossTheme no avanço de fase
//   • B2 — unlockAudio antes de iniciar batalha
//   • B4 — aldeia_bg aceita imagem
//   • B5 — loadStoryProgressByName NÃO libera todos os atos
//   • B6 — re-render da Aldeia após desbloqueio
//   • B7 — Sistema uiIcon() universal
//   • Desbloqueio de capítulo correto (sem pular atos)
//   • OCA — só permite 1 herói por vez
//
// ⏭️ Pendências anotadas (NÃO implementadas ainda):
//   • Sistema de estrelas por fase (reaproveitar calculateFinalScore)
//   • Aviso visual de "fase já concluída — recompensa reduzida"
//   • Botão "pular diálogo" nos overlays
//   • Substituir arcadeBossTransition por _storyTransitioning
//   • Unificar desbloqueio de capítulo (hoje em 2 lugares)
// =================================================================

// =================================================================
// 🎨 CSS — injetado IMEDIATAMENTE
// =================================================================
(function injectStoryCSS() {
    if (document.getElementById('storySystemStyle')) return;
    const style = document.createElement('style');
    style.id = 'storySystemStyle';
    style.textContent = `
        #storyScreen{position:fixed;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at top,rgba(201,162,39,.1),transparent 55%),linear-gradient(135deg,#1a1208,#2a1f10);z-index:9700;display:none;overflow-y:auto;padding:20px;flex-direction:column;align-items:center}
        #storyScreen.active{display:flex}
        .story-container{width:100%;max-width:1000px;padding:20px}
        .story-header{text-align:center;margin-bottom:40px}
        .story-title{font-family:'Cinzel Decorative',serif;color:#e8b923;font-size:2.2rem;margin-bottom:10px;text-shadow:0 0 20px rgba(232,185,35,.5),0 3px 0 rgba(0,0,0,.6);letter-spacing:2px}
        .story-subtitle{color:#b8a577;font-family:'EB Garamond',serif;font-size:1.15rem;font-style:italic;max-width:600px;margin:0 auto}
        .story-ald-eheader{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding:15px 25px;background:linear-gradient(180deg,rgba(201,162,39,.08),transparent 40%),linear-gradient(135deg,rgba(58,42,24,.9),rgba(26,18,8,.9));border:2px solid #6a5024;border-radius:8px;flex-wrap:wrap;gap:15px}
        .story-ald-header-title{display:flex;align-items:center;gap:12px}
        .story-ald-icon-lg{font-size:2rem;display:flex;align-items:center;justify-content:center}
        .story-ald-icon-lg img{width:40px;height:40px;object-fit:contain;filter:drop-shadow(0 0 8px rgba(232,185,35,.5))}
        .story-ald-title{font-family:'Cinzel Decorative',serif;color:#e8b923;font-size:1.8rem;letter-spacing:3px;margin:0;text-shadow:0 2px 6px rgba(0,0,0,.7)}
        .story-ald-header-stats{display:flex;gap:20px}
        .story-ald-stat{display:flex;align-items:center;gap:6px;padding:8px 14px;background:rgba(10,6,2,.6);border:1px solid rgba(201,162,39,.3);border-radius:6px}
        .story-ald-stat-icon{font-size:1.2rem;display:flex;align-items:center;justify-content:center}
        .story-ald-stat-icon img{width:24px;height:24px;object-fit:contain;filter:drop-shadow(0 0 4px rgba(232,185,35,.5))}
        .story-ald-stat-value{font-family:'Cinzel',serif;color:#e8b923;font-weight:700;font-size:1rem;letter-spacing:1px}
        .story-ald-save-info{display:flex;align-items:center;justify-content:center;gap:15px;flex-wrap:wrap;padding:12px 20px;margin-bottom:20px;background:rgba(10,6,2,.5);border:1px solid rgba(201,162,39,.25);border-radius:6px}
        .story-ald-save-name{display:flex;align-items:center;gap:8px;font-family:'Cinzel',serif}
        .story-ald-save-label{color:#8a7a52;font-size:.85rem;letter-spacing:2px}
        .story-ald-save-value{color:#f0e2c0;font-weight:700;letter-spacing:1px}
        .story-ald-save-element{font-family:'Cinzel',serif;font-weight:700;font-size:.9rem;padding:6px 12px;background:rgba(10,6,2,.6);border-radius:20px;border:1px solid rgba(201,162,39,.3);letter-spacing:1px;display:inline-flex;align-items:center;gap:6px}
        .story-ald-save-element img{width:20px;height:20px;object-fit:contain;filter:drop-shadow(0 0 4px rgba(232,185,35,.5))}
        .story-ald-change-save{padding:8px 16px;background:linear-gradient(135deg,#3d2d18,#2a1f10);color:#c8b787;border:1px solid #6a5024;border-radius:4px;cursor:pointer;font-family:'Cinzel',serif;font-weight:700;font-size:.8rem;letter-spacing:1.5px;transition:all .2s;display:inline-flex;align-items:center;gap:6px}
        .story-ald-change-save img{width:18px;height:18px;object-fit:contain}
        .story-ald-change-save:hover{background:linear-gradient(135deg,#5a4220,#3d2d18);color:#e8dcc4;border-color:#c9a227}
        .story-ald-subtitle{color:#b8a577;font-family:'EB Garamond',serif;font-size:1.05rem;font-style:italic;text-align:center;margin-bottom:30px}
        .story-ald-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-bottom:30px}
        .story-ald-location{background:linear-gradient(180deg,rgba(201,162,39,.06),transparent 40%),linear-gradient(180deg,rgba(42,31,16,.9),rgba(26,18,8,.9));border:2px solid #3d2d18;border-radius:8px;padding:20px;cursor:pointer;transition:all .3s;display:flex;align-items:center;gap:15px}
        .story-ald-location:hover:not(.locked){transform:translateY(-4px);border-color:#c9a227;box-shadow:0 8px 25px rgba(0,0,0,.5),0 0 25px rgba(201,162,39,.25)}
        .story-ald-location.locked{opacity:.55;cursor:not-allowed}
        .story-ald-loc-icon{font-size:2.5rem;line-height:1;filter:drop-shadow(0 0 8px rgba(232,185,35,.5));flex-shrink:0;display:flex;align-items:center;justify-content:center}
        .story-ald-loc-img{width:64px;height:64px;object-fit:contain;display:block;filter:drop-shadow(0 0 8px rgba(232,185,35,.5));flex-shrink:0}
        .story-ald-loc-info{flex:1}
        .story-ald-loc-name{font-family:'Cinzel',serif;color:#f0e2c0;font-size:1.15rem;letter-spacing:1.5px;margin-bottom:5px}
        .story-ald-loc-desc{color:#b8a577;font-family:'EB Garamond',serif;font-size:.9rem;font-style:italic;line-height:1.4}
        .story-ald-loc-locked{margin-top:6px;font-size:.75rem;color:#8a7a52;font-family:'Cinzel',serif;letter-spacing:1px}
        .story-ald-progress{background:rgba(10,6,2,.6);border:1px solid rgba(201,162,39,.2);border-radius:8px;padding:16px 20px;margin-bottom:20px}
        .story-ald-progress-label{font-family:'Cinzel',serif;color:#d9c89a;font-size:.9rem;letter-spacing:1px;margin-bottom:10px;text-align:center}
        .story-ald-progress-bar{background:#1a1208;height:10px;border-radius:5px;overflow:hidden;border:1px solid rgba(201,162,39,.25)}
        .story-ald-progress-fill{height:100%;background:linear-gradient(90deg,#4a7040,#8ac070);transition:width .5s}
        .story-ald-footer{display:flex;justify-content:center;margin-top:20px}
        .elem-FOGO{color:#e74c3c;text-shadow:0 0 8px rgba(231,76,60,.5)}
        .elem-AGUA{color:#3498db;text-shadow:0 0 8px rgba(52,152,219,.5)}
        .elem-TERRA{color:#27ae60;text-shadow:0 0 8px rgba(39,174,96,.5)}
        .elem-AR{color:#f1c40f;text-shadow:0 0 8px rgba(241,196,15,.5)}
        .story-chapters-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:25px;margin-bottom:30px}
        .story-chapter-card{background:linear-gradient(180deg,rgba(201,162,39,.06),transparent 40%),linear-gradient(180deg,rgba(42,31,16,.9),rgba(26,18,8,.9));border-radius:8px;border:2px solid #3d2d18;cursor:pointer;transition:all .3s;overflow:hidden;display:flex;flex-direction:column}
        .story-chapter-card.unlocked:hover{transform:translateY(-5px);border-color:#c9a227;box-shadow:0 10px 25px rgba(0,0,0,.5),0 0 25px rgba(201,162,39,.25)}
        .story-chapter-card.locked{opacity:.55;cursor:not-allowed}
        .story-chapter-cover{background:radial-gradient(circle at center,rgba(0,0,0,.4),rgba(0,0,0,.7));padding:30px;text-align:center;border-bottom:2px solid rgba(201,162,39,.2);min-height:140px;display:flex;align-items:center;justify-content:center}
        .story-chapter-info{padding:20px;flex:1;display:flex;flex-direction:column}
        .story-chapter-name{font-family:'Cinzel',serif;color:#f0e2c0;font-size:1.3rem;margin-bottom:10px;letter-spacing:1.5px}
        .story-chapter-desc{color:#b8a577;font-family:'EB Garamond',serif;font-size:.95rem;font-style:italic;line-height:1.5;flex:1;margin-bottom:15px}
        .story-chapter-progress{margin-top:auto}
        .story-chapter-progress-bar{background:#1a1208;height:8px;border-radius:4px;overflow:hidden;border:1px solid rgba(201,162,39,.2);margin-bottom:6px}
        .story-chapter-progress-fill{height:100%;background:linear-gradient(90deg,#4a7040,#8ac070);transition:width .4s}
        .story-chapter-progress-text{font-family:'EB Garamond',serif;font-size:.85rem;color:#8a7a52;text-align:right}
        .story-phases-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;margin-bottom:30px}
        .story-phase-card{background:linear-gradient(180deg,rgba(201,162,39,.04),transparent 40%),linear-gradient(180deg,rgba(42,31,16,.85),rgba(26,18,8,.85));border-radius:6px;border:2px solid #3d2d18;overflow:hidden;transition:all .3s;display:flex;flex-direction:column}
        .story-phase-card.unlocked{cursor:pointer}
        .story-phase-card.unlocked:hover{transform:translateY(-4px);border-color:#c9a227;box-shadow:0 8px 20px rgba(0,0,0,.5),0 0 20px rgba(201,162,39,.2)}
        .story-phase-card.locked{opacity:.5;cursor:not-allowed}
        .story-phase-card.completed{border-color:#4a7040}
        .story-phase-card.completed:hover{border-color:#8ac070}
        .story-phase-card.boss-phase{border-color:#a83232;background:linear-gradient(180deg,rgba(168,50,50,.15),transparent 45%),linear-gradient(180deg,rgba(42,20,20,.9),rgba(26,8,8,.9))}
        .story-phase-card.boss-phase.unlocked:hover{border-color:#d05050;box-shadow:0 8px 20px rgba(0,0,0,.5),0 0 25px rgba(208,80,80,.35)}
        .story-phase-card.final-boss{border-color:#8e44ad;background:linear-gradient(180deg,rgba(142,68,173,.2),transparent 45%),linear-gradient(180deg,rgba(30,15,40,.95),rgba(15,8,20,.95))}
        .story-phase-card.final-boss.unlocked:hover{border-color:#c39bd3;box-shadow:0 8px 20px rgba(0,0,0,.5),0 0 30px rgba(142,68,173,.6)}
        .story-phase-bg{background:radial-gradient(circle at center,rgba(0,0,0,.3),rgba(0,0,0,.6));padding:20px;text-align:center;border-bottom:1px solid rgba(201,162,39,.15);min-height:80px;display:flex;align-items:center;justify-content:center}
        .story-phase-header{display:flex;justify-content:space-between;align-items:center;padding:10px 15px;background:rgba(10,6,2,.5);border-bottom:1px solid rgba(201,162,39,.15)}
        .story-phase-num{font-family:'Cinzel',serif;font-size:.85rem;color:#e8b923;letter-spacing:1.5px;font-weight:700}
        .story-phase-status{font-size:1.1rem;display:inline-flex;align-items:center;justify-content:center}
        .story-phase-status img{width:22px;height:22px;object-fit:contain}
        .story-phase-available{color:#e8b923;animation:storyPulseArrow 1s ease-in-out infinite alternate;display:inline-flex;align-items:center;justify-content:center}
        .story-phase-available img{width:22px;height:22px;object-fit:contain}
        @keyframes storyPulseArrow{from{opacity:.6;transform:translateX(0)}to{opacity:1;transform:translateX(3px)}}
        .story-phase-body{padding:15px;flex:1;display:flex;flex-direction:column}
        .story-phase-name{font-family:'Cinzel',serif;color:#f0e2c0;font-size:1.05rem;margin-bottom:8px;letter-spacing:1px}
        .story-phase-desc{color:#b8a577;font-family:'EB Garamond',serif;font-size:.9rem;font-style:italic;line-height:1.4;margin-bottom:12px;flex:1}
        .story-phase-enemies-row{display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:wrap;padding-top:10px;border-top:1px solid rgba(201,162,39,.1)}
        .story-phase-enemy{font-size:1.5rem;line-height:1;display:inline-flex;align-items:center;justify-content:center}
        .story-phase-enemy img{width:32px;height:32px;object-fit:contain;filter:drop-shadow(0 0 3px rgba(0,0,0,.6))}
        .story-phase-arrow{color:#8a7a52;font-size:.85rem;margin:0 2px}
        .story-enemy-mini{font-size:1.3rem}
        .story-heroes-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:20px;margin-bottom:30px}
        .story-hero-card{background:linear-gradient(180deg,rgba(201,162,39,.05),transparent 40%),linear-gradient(180deg,rgba(42,31,16,.9),rgba(26,18,8,.9));border:2px solid #3d2d18;border-radius:8px;padding:20px 15px;text-align:center;cursor:pointer;transition:all .3s;position:relative}
        .story-hero-card:hover{transform:translateY(-4px);border-color:#6a5024}
        .story-hero-card.selected{border-color:#e8b923;background:linear-gradient(180deg,rgba(232,185,35,.15),transparent 50%),linear-gradient(180deg,rgba(58,42,24,.9),rgba(26,18,8,.9));box-shadow:0 0 25px rgba(232,185,35,.35)}
        .story-hero-sprite{width:80px;height:80px;object-fit:contain;display:block;margin:0 auto 12px;filter:drop-shadow(0 0 6px rgba(0,0,0,.7))}
        .story-hero-name{font-family:'Cinzel',serif;color:#f0e2c0;font-size:1rem;letter-spacing:1px;margin-bottom:4px}
        .story-hero-element{font-family:'Cinzel',serif;font-size:.8rem;font-weight:700;letter-spacing:1px;margin-bottom:6px;display:inline-flex;align-items:center;gap:4px;justify-content:center}
        .story-hero-element img{width:16px;height:16px;object-fit:contain}
        .story-hero-level{font-family:'EB Garamond',serif;color:#e8b923;font-size:.85rem;font-weight:700;margin-bottom:2px}
        .story-hero-xp{font-family:'EB Garamond',serif;color:#8a7a52;font-size:.8rem}
        .story-hero-check{position:absolute;top:10px;right:10px;font-size:1.2rem}
        .story-hero-check img{width:22px;height:22px;object-fit:contain}
        .story-shop-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;margin-bottom:30px}
        .story-shop-item{background:linear-gradient(180deg,rgba(201,162,39,.05),transparent 40%),linear-gradient(180deg,rgba(42,31,16,.9),rgba(26,18,8,.9));border:2px solid #3d2d18;border-radius:8px;padding:20px 15px;text-align:center;transition:all .3s;display:flex;flex-direction:column}
        .story-shop-item:hover:not(.disabled){transform:translateY(-4px);border-color:#c9a227}
        .story-shop-item.disabled{opacity:.55}
        .story-shop-emoji{font-size:2.5rem;line-height:1;margin-bottom:10px;filter:drop-shadow(0 0 8px rgba(232,185,35,.4));display:flex;align-items:center;justify-content:center}
        .story-shop-emoji img{width:48px;height:48px;object-fit:contain}
        .story-shop-name{font-family:'Cinzel',serif;color:#f0e2c0;font-size:1rem;margin-bottom:6px;letter-spacing:1px}
        .story-shop-desc{color:#b8a577;font-family:'EB Garamond',serif;font-size:.85rem;font-style:italic;flex:1;margin-bottom:12px}
        .story-shop-price{font-family:'Cinzel',serif;color:#e8b923;font-size:1rem;font-weight:700;margin-bottom:12px;display:inline-flex;align-items:center;gap:6px;justify-content:center}
        .story-shop-price img{width:20px;height:20px;object-fit:contain}
        .story-shop-btn{padding:10px 16px;background:linear-gradient(180deg,rgba(232,185,35,.2),transparent 45%),linear-gradient(135deg,#6a5024,#3d2d18);color:#f0e2c0;border:2px solid #c9a227;border-radius:4px;font-family:'Cinzel',serif;font-weight:700;font-size:.9rem;letter-spacing:1.5px;cursor:pointer;transition:all .2s}
        .story-shop-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 6px 15px rgba(0,0,0,.5),0 0 15px rgba(232,185,35,.35)}
        .story-shop-btn:disabled{background:#2a1f10;color:#6a5024;border-color:#3d2d18;cursor:not-allowed}
        .story-placeholder{text-align:center;padding:60px 20px;background:rgba(10,6,2,.5);border:2px dashed #3d2d18;border-radius:8px;margin-bottom:30px}
        .story-placeholder-icon{font-size:4rem;line-height:1;margin-bottom:20px;opacity:.6;display:flex;align-items:center;justify-content:center}
        .story-placeholder-icon img{width:80px;height:80px;object-fit:contain;filter:drop-shadow(0 0 8px rgba(232,185,35,.4))}
        .story-placeholder-text{font-family:'EB Garamond',serif;color:#8a7a52;font-size:1.1rem;font-style:italic}
        .story-footer{display:flex;justify-content:center;gap:15px;padding:15px 20px;background:rgba(10,6,2,.6);border-radius:8px;border:1px solid rgba(201,162,39,.2);flex-wrap:wrap;margin-top:20px}
        .story-back-btn{padding:12px 24px;background:linear-gradient(135deg,#3d2d18,#2a1f10);color:#c8b787;border:2px solid #6a5024;border-radius:4px;cursor:pointer;font-family:'Cinzel',serif;font-weight:700;font-size:.95rem;letter-spacing:1.5px;transition:all .2s}
        .story-back-btn:hover{background:linear-gradient(135deg,#5a4220,#3d2d18);color:#e8dcc4;border-color:#c9a227}
        .story-sprite{width:32px;height:32px;object-fit:contain;vertical-align:middle;filter:drop-shadow(0 0 4px rgba(0,0,0,.6))}
        .story-sprite-large{width:64px;height:64px;object-fit:contain;filter:drop-shadow(0 0 8px rgba(0,0,0,.6))}
        .story-emoji{font-size:1.5rem;line-height:1}
        .story-emoji-large{font-size:3rem;line-height:1;filter:drop-shadow(0 0 8px rgba(0,0,0,.5))}
        .story-boss-emoji{font-size:2.5rem;line-height:1;filter:drop-shadow(0 0 10px rgba(0,0,0,.8));animation:storyBossFloat 2s ease-in-out infinite;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}
        @keyframes storyBossFloat{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-55%) scale(1.05)}}
        .story-mini-boss{border-left:4px solid #a83232!important}
        .story-save-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(10,6,2,.95);z-index:10005;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto}
        .story-save-panel{background:radial-gradient(circle at top,rgba(232,185,35,.1),transparent 50%),linear-gradient(180deg,#2a1f10,#1a1208);border:3px solid #c9a227;border-radius:10px;padding:30px 25px;max-width:460px;width:100%;text-align:center;box-shadow:0 0 60px rgba(232,185,35,.3)}
        .story-save-header{font-family:'Cinzel Decorative',serif;color:#e8b923;font-size:1.4rem;letter-spacing:3px;margin-bottom:10px;text-shadow:0 0 15px rgba(232,185,35,.6)}
        .story-save-hint{font-family:'EB Garamond',serif;color:#b8a577;font-size:.9rem;font-style:italic;margin-bottom:20px}
        .story-save-input-wrap{display:flex;gap:8px;margin-bottom:15px}
        .story-save-input{flex:1;padding:12px 14px;background:#1a1208;color:#f0e2c0;border:2px solid #6a5024;border-radius:4px;font-family:'EB Garamond',serif;font-size:1rem;letter-spacing:1px;outline:none;transition:border-color .2s}
        .story-save-input:focus{border-color:#e8b923;box-shadow:0 0 12px rgba(232,185,35,.4)}
        .story-save-confirm-btn{padding:12px 20px;background:linear-gradient(180deg,rgba(232,185,35,.25),transparent 45%),linear-gradient(135deg,#8a6a2e,#4a3418);color:#fff5dc;border:2px solid #e8b923;border-radius:4px;cursor:pointer;font-family:'Cinzel',serif;font-weight:700;font-size:.85rem;letter-spacing:1.5px;transition:all .2s}
        .story-save-confirm-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.6),0 0 25px rgba(232,185,35,.4)}
        .story-save-element-preview{margin-bottom:20px;padding:12px;background:rgba(10,6,2,.5);border:1px solid rgba(201,162,39,.2);border-radius:6px;min-height:50px;display:flex;align-items:center;justify-content:center;gap:10px}
        .story-save-element-label{font-family:'Cinzel',serif;color:#8a7a52;font-size:.8rem;letter-spacing:2px}
        .story-save-element-value{font-family:'Cinzel',serif;font-size:1.1rem;font-weight:700;letter-spacing:1.5px;display:inline-flex;align-items:center;gap:6px}
        .story-save-element-value img{width:24px;height:24px;object-fit:contain}
        .story-save-element-empty{color:#6a5024;font-family:'EB Garamond',serif;font-style:italic;font-size:.9rem}
        .story-save-section{margin-bottom:15px;text-align:left}
        .story-save-section-title{font-family:'Cinzel',serif;color:#8a7a52;font-size:.8rem;letter-spacing:2px;margin-bottom:10px}
        .story-save-list{display:flex;flex-direction:column;gap:8px;max-height:180px;overflow-y:auto}
        .story-save-item{background:rgba(10,6,2,.6);border:1px solid rgba(201,162,39,.25);border-radius:4px;padding:10px 14px;cursor:pointer;transition:all .2s;text-align:left}
        .story-save-item:hover{border-color:#e8b923;background:rgba(201,162,39,.1);transform:translateX(3px)}
        .story-save-item-name{font-family:'Cinzel',serif;color:#f0e2c0;font-size:.95rem;font-weight:700;margin-bottom:3px}
        .story-save-item-stats{font-family:'EB Garamond',serif;color:#8a7a52;font-size:.8rem}
        .story-save-cancel-btn{margin-top:15px;padding:10px 20px;background:transparent;color:#8a7a52;border:1px solid #6a5024;border-radius:4px;cursor:pointer;font-family:'Cinzel',serif;font-weight:700;font-size:.85rem;letter-spacing:1.5px;transition:all .2s}
        .story-save-cancel-btn:hover{background:rgba(10,6,2,.6);color:#c8b787;border-color:#c9a227}
        .story-purification-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(10,6,2,.92);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px}
        .story-purification-panel{background:radial-gradient(circle at top,rgba(232,185,35,.15),transparent 60%),linear-gradient(180deg,#2a1f10,#1a1208);border:3px solid #c9a227;border-radius:10px;padding:30px 25px;max-width:500px;width:100%;text-align:center;box-shadow:0 0 60px rgba(232,185,35,.3)}
        .story-purification-header{font-family:'Cinzel Decorative',serif;color:#e8b923;font-size:1.3rem;letter-spacing:3px;margin-bottom:20px;text-shadow:0 0 15px rgba(232,185,35,.6)}
        .story-purification-sprite{margin-bottom:15px;min-height:80px;display:flex;align-items:center;justify-content:center}
        .story-purification-img{width:100px;height:100px;object-fit:contain;filter:drop-shadow(0 0 20px rgba(232,185,35,.7));animation:storySpriteFloat 2s ease-in-out infinite}
        .story-purification-emoji{font-size:4rem;line-height:1;filter:drop-shadow(0 0 20px rgba(232,185,35,.7));animation:storySpriteFloat 2s ease-in-out infinite}
        @keyframes storySpriteFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-8px) scale(1.05)}}
        .story-purification-name{font-family:'Cinzel',serif;color:#f0e2c0;font-size:1.2rem;margin-bottom:15px;letter-spacing:2px}
        .story-purification-text{font-family:'EB Garamond',serif;color:#d9c89a;font-size:1rem;line-height:1.6;font-style:italic;padding:15px;background:rgba(10,6,2,.5);border-left:3px solid #c9a227;border-radius:4px;margin-bottom:20px;text-align:left}
        .story-purification-btn{padding:14px 30px;background:linear-gradient(180deg,rgba(232,185,35,.25),transparent 45%),linear-gradient(135deg,#8a6a2e,#4a3418);color:#fff5dc;border:2px solid #e8b923;border-radius:4px;cursor:pointer;font-family:'Cinzel',serif;font-weight:700;font-size:1rem;letter-spacing:1.5px;transition:all .2s;box-shadow:0 4px 15px rgba(0,0,0,.5)}
        .story-purification-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.6),0 0 25px rgba(232,185,35,.5)}
        .story-result-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(10,6,2,.95);z-index:10002;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto}
        .story-result-panel{background:linear-gradient(180deg,rgba(201,162,39,.05),transparent 25%),linear-gradient(180deg,#2a1f10,#1a1208 60%,#0d0805);border:3px solid #c9a227;border-radius:8px;max-width:620px;width:100%;margin:auto;box-shadow:0 20px 60px rgba(0,0,0,.9);overflow:hidden}
        .story-result-panel.defeat{border-color:#a83232}
        .story-result-scroll-top{background:linear-gradient(180deg,#d9c89a,#b8a577 50%,#8a7a52);padding:18px 30px;text-align:center;border-bottom:3px solid #8a7018}
        .story-result-scroll-top.defeat{background:linear-gradient(180deg,#d9a0a0,#b88080 50%,#8a5a5a);border-bottom:3px solid #6a2020}
        .story-result-title{font-family:'Cinzel Decorative',serif;font-size:1.6rem;color:#1a1208;letter-spacing:3px;margin:0;display:inline-flex;align-items:center;gap:10px;justify-content:center}
        .story-result-title img{width:32px;height:32px;object-fit:contain}
        .story-result-title.defeat{color:#3a1010}
        .story-result-body{padding:25px;display:flex;flex-direction:column;align-items:center;gap:18px}
        .story-result-subtitle{font-family:'EB Garamond',serif;color:#d9c89a;font-size:1.05rem;font-style:italic;text-align:center;line-height:1.5}
        .story-result-section-title{font-family:'Cinzel',serif;color:#8a7a52;font-size:.8rem;letter-spacing:2px;text-transform:uppercase;margin-top:8px;display:inline-flex;align-items:center;gap:6px}
        .story-result-section-title img{width:18px;height:18px;object-fit:contain}
        .story-result-drops-grid{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;width:100%}
        .story-result-drop{background:rgba(10,6,2,.6);border:2px solid rgba(201,162,39,.4);border-radius:6px;padding:12px 16px;text-align:center;min-width:90px;transition:all .2s}
        .story-result-drop:hover{border-color:#e8b923;transform:translateY(-3px);box-shadow:0 6px 15px rgba(232,185,35,.3)}
        .story-result-drop-emoji{font-size:2rem;line-height:1;margin-bottom:6px;display:flex;align-items:center;justify-content:center}
        .story-result-drop-emoji img{width:40px;height:40px;object-fit:contain}
        .story-result-drop-name{font-family:'EB Garamond',serif;color:#d9c89a;font-size:.85rem;margin-bottom:4px}
        .story-result-drop-qty{font-family:'Cinzel',serif;color:#e8b923;font-weight:700;font-size:.9rem}
        .story-result-no-drops{color:#8a7a52;font-family:'EB Garamond',serif;font-style:italic;font-size:.95rem}
        .story-result-xp{font-family:'Cinzel Decorative',serif;color:#e8b923;font-size:1.4rem;text-shadow:0 0 15px rgba(232,185,35,.5);margin-top:8px;text-align:center;display:inline-flex;align-items:center;gap:8px;justify-content:center}
        .story-result-xp img{width:26px;height:26px;object-fit:contain}
        .story-result-actions{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;width:100%;margin-top:10px}
        .story-result-btn{padding:14px 24px;border-radius:4px;font-family:'Cinzel',serif;font-weight:700;font-size:.95rem;letter-spacing:1.5px;cursor:pointer;transition:all .2s;border:2px solid transparent;display:inline-flex;align-items:center;gap:8px}
        .story-result-btn img{width:20px;height:20px;object-fit:contain}
        .story-result-btn.primary{background:linear-gradient(180deg,rgba(232,185,35,.25),transparent 45%),linear-gradient(135deg,#8a6a2e,#4a3418);color:#fff5dc;border-color:#e8b923}
        .story-result-btn.primary:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.6),0 0 25px rgba(232,185,35,.4)}
        .story-result-btn.secondary{background:linear-gradient(180deg,rgba(201,162,39,.08),transparent 40%),linear-gradient(135deg,#3d2d18,#2a1f10);color:#c8b787;border-color:#6a5024}
        .story-result-btn.secondary:hover{background:linear-gradient(180deg,rgba(201,162,39,.2),transparent 45%),linear-gradient(135deg,#5a4220,#3a2a14);color:#f0e2c0;border-color:#c9a227}
        @media (max-width:600px){
            .story-title{font-size:1.6rem}
            .story-ald-title{font-size:1.4rem}
            .story-chapters-grid,.story-phases-grid,.story-shop-grid{grid-template-columns:1fr}
            .story-heroes-grid{grid-template-columns:repeat(2,1fr)}
            .story-result-title{font-size:1.3rem}
            .story-save-input-wrap{flex-direction:column}
        }
        /* ===== DIÁLOGO DO BOSS ===== */
        .story-saci-dialog-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(10,6,2,.92);z-index:10003;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto;animation:storyFadeIn .4s ease}
        @keyframes storyFadeIn{from{opacity:0}to{opacity:1}}
        .story-saci-dialog{background:radial-gradient(circle at top,rgba(142,68,173,.18),transparent 55%),linear-gradient(180deg,#2a1f10 0%,#1a1208 100%);border:3px solid #8e44ad;border-radius:10px;padding:30px 25px;max-width:620px;width:100%;box-shadow:0 0 60px rgba(142,68,173,.4);animation:storyPanelIn .5s cubic-bezier(.25,.8,.3,1)}
        .story-saci-dialog.a2{background:radial-gradient(circle at top,rgba(74,122,58,.22),transparent 55%),linear-gradient(180deg,#1f1a10 0%,#0d1208 100%);border-color:#4a7a3a;box-shadow:0 0 60px rgba(74,122,58,.5)}
        .story-saci-dialog.a2 .story-saci-dialog-img{border-color:#4a7a3a;box-shadow:0 0 25px rgba(74,122,58,.6);filter:drop-shadow(0 0 8px rgba(74,122,58,.6))}
        .story-saci-dialog.a2 .story-saci-dialog-title{color:#a8d090;text-shadow:0 0 15px rgba(74,122,58,.8),0 2px 4px rgba(0,0,0,.8)}
        .story-saci-dialog.a2 .story-saci-dialog-subtitle{color:#7fb068}
        .story-saci-dialog.a2 .story-saci-dialog-text{border-left-color:#4a7a3a}
        .story-saci-dialog.a2 .story-saci-dialog-text::before{color:#4a7a3a}
        .story-saci-dialog.a2 .story-saci-dialog-btn{background:linear-gradient(180deg,rgba(74,122,58,.3),transparent 45%),linear-gradient(135deg,#3a5a2c,#1e3a14);border-color:#4a7a3a;color:#e0f0d0}
        .story-saci-dialog.a2 .story-saci-dialog-btn:hover{background:linear-gradient(180deg,rgba(74,122,58,.45),transparent 45%),linear-gradient(135deg,#4a7040,#2a4520);box-shadow:0 6px 20px rgba(0,0,0,.6),0 0 25px rgba(74,122,58,.5)}
        .story-saci-dialog.a3{background:radial-gradient(circle at top,rgba(58,124,165,.22),transparent 55%),linear-gradient(180deg,#0f1a20 0%,#081015 100%);border-color:#3a7ca5;box-shadow:0 0 60px rgba(58,124,165,.5)}
        .story-saci-dialog.a3 .story-saci-dialog-img{border-color:#3a7ca5;box-shadow:0 0 25px rgba(58,124,165,.6);filter:drop-shadow(0 0 8px rgba(58,124,165,.6))}
        .story-saci-dialog.a3 .story-saci-dialog-title{color:#a0d0e8;text-shadow:0 0 15px rgba(58,124,165,.8),0 2px 4px rgba(0,0,0,.8)}
        .story-saci-dialog.a3 .story-saci-dialog-subtitle{color:#7fb0c8}
        .story-saci-dialog.a3 .story-saci-dialog-text{border-left-color:#3a7ca5}
        .story-saci-dialog.a3 .story-saci-dialog-text::before{color:#3a7ca5}
        .story-saci-dialog.a3 .story-saci-dialog-btn{background:linear-gradient(180deg,rgba(58,124,165,.3),transparent 45%),linear-gradient(135deg,#2a5570,#1a3a50);border-color:#3a7ca5;color:#d0e8f5}
        .story-saci-dialog.a3 .story-saci-dialog-btn:hover{background:linear-gradient(180deg,rgba(58,124,165,.45),transparent 45%),linear-gradient(135deg,#3a6a90,#2a5570);box-shadow:0 6px 20px rgba(0,0,0,.6),0 0 25px rgba(58,124,165,.5)}
        .story-saci-dialog.a4{background:radial-gradient(circle at top,rgba(232,110,35,.25),transparent 55%),linear-gradient(180deg,#2a1408 0%,#1a0a04 100%);border-color:#e67e22;box-shadow:0 0 60px rgba(232,110,35,.5)}
        .story-saci-dialog.a4 .story-saci-dialog-img{border-color:#e67e22;box-shadow:0 0 25px rgba(232,110,35,.6);filter:drop-shadow(0 0 8px rgba(232,110,35,.6))}
        .story-saci-dialog.a4 .story-saci-dialog-title{color:#f5b070;text-shadow:0 0 15px rgba(232,110,35,.8),0 2px 4px rgba(0,0,0,.8)}
        .story-saci-dialog.a4 .story-saci-dialog-subtitle{color:#d09060}
        .story-saci-dialog.a4 .story-saci-dialog-text{border-left-color:#e67e22}
        .story-saci-dialog.a4 .story-saci-dialog-text::before{color:#e67e22}
        .story-saci-dialog.a4 .story-saci-dialog-btn{background:linear-gradient(180deg,rgba(232,110,35,.3),transparent 45%),linear-gradient(135deg,#7a4a1a,#4a2a0a);border-color:#e67e22;color:#f5dcb8}
        .story-saci-dialog.a4 .story-saci-dialog-btn:hover{background:linear-gradient(180deg,rgba(232,110,35,.45),transparent 45%),linear-gradient(135deg,#9a5a20,#5a3a10);box-shadow:0 6px 20px rgba(0,0,0,.6),0 0 25px rgba(232,110,35,.5)}
        .story-saci-dialog.a5{background:radial-gradient(circle at top,rgba(168,50,50,.25),transparent 55%),linear-gradient(180deg,#2a0a0a 0%,#150505 100%);border-color:#a83232;box-shadow:0 0 60px rgba(168,50,50,.5)}
        .story-saci-dialog.a5 .story-saci-dialog-img{border-color:#a83232;box-shadow:0 0 25px rgba(168,50,50,.6);filter:drop-shadow(0 0 8px rgba(168,50,50,.6))}
        .story-saci-dialog.a5 .story-saci-dialog-title{color:#f5a0a0;text-shadow:0 0 15px rgba(168,50,50,.8),0 2px 4px rgba(0,0,0,.8)}
        .story-saci-dialog.a5 .story-saci-dialog-subtitle{color:#d08080}
        .story-saci-dialog.a5 .story-saci-dialog-text{border-left-color:#a83232}
        .story-saci-dialog.a5 .story-saci-dialog-text::before{color:#a83232}
        .story-saci-dialog.a5 .story-saci-dialog-btn{background:linear-gradient(180deg,rgba(168,50,50,.3),transparent 45%),linear-gradient(135deg,#6a2020,#3a1010);border-color:#a83232;color:#f5c8c8}
        .story-saci-dialog.a5 .story-saci-dialog-btn:hover{background:linear-gradient(180deg,rgba(168,50,50,.45),transparent 45%),linear-gradient(135deg,#8a3030,#4a1414);box-shadow:0 6px 20px rgba(0,0,0,.6),0 0 25px rgba(168,50,50,.5)}
        .story-saci-dialog.a6{background:radial-gradient(circle at top,rgba(149,165,166,.2),transparent 55%),linear-gradient(180deg,#1a1a1a 0%,#0a0a0a 100%);border-color:#95a5a6;box-shadow:0 0 60px rgba(149,165,166,.4)}
        .story-saci-dialog.a6 .story-saci-dialog-img{border-color:#95a5a6;box-shadow:0 0 25px rgba(149,165,166,.5);filter:drop-shadow(0 0 8px rgba(149,165,166,.5))}
        .story-saci-dialog.a6 .story-saci-dialog-title{color:#d0d8d8;text-shadow:0 0 15px rgba(149,165,166,.7),0 2px 4px rgba(0,0,0,.8)}
        .story-saci-dialog.a6 .story-saci-dialog-subtitle{color:#a0b0b0}
        .story-saci-dialog.a6 .story-saci-dialog-text{border-left-color:#95a5a6}
        .story-saci-dialog.a6 .story-saci-dialog-text::before{color:#95a5a6}
        .story-saci-dialog.a6 .story-saci-dialog-btn{background:linear-gradient(180deg,rgba(149,165,166,.2),transparent 45%),linear-gradient(135deg,#4a5555,#2a3333);border-color:#95a5a6;color:#e0e8e8}
        .story-saci-dialog.a6 .story-saci-dialog-btn:hover{background:linear-gradient(180deg,rgba(149,165,166,.35),transparent 45%),linear-gradient(135deg,#5a6565,#3a4545);box-shadow:0 6px 20px rgba(0,0,0,.6),0 0 25px rgba(149,165,166,.5)}
        .story-saci-dialog.a7{background:radial-gradient(circle at top,rgba(52,73,94,.25),transparent 55%),linear-gradient(180deg,#0f1520 0%,#080d15 100%);border-color:#34495e;box-shadow:0 0 60px rgba(52,73,94,.5)}
        .story-saci-dialog.a7 .story-saci-dialog-img{border-color:#34495e;box-shadow:0 0 25px rgba(52,73,94,.6);filter:drop-shadow(0 0 8px rgba(52,73,94,.6))}
        .story-saci-dialog.a7 .story-saci-dialog-title{color:#a8c0d8;text-shadow:0 0 15px rgba(52,73,94,.8),0 2px 4px rgba(0,0,0,.8)}
        .story-saci-dialog.a7 .story-saci-dialog-subtitle{color:#88a0c0}
        .story-saci-dialog.a7 .story-saci-dialog-text{border-left-color:#34495e}
        .story-saci-dialog.a7 .story-saci-dialog-text::before{color:#34495e}
        .story-saci-dialog.a7 .story-saci-dialog-btn{background:linear-gradient(180deg,rgba(52,73,94,.3),transparent 45%),linear-gradient(135deg,#2a3a50,#151f30);border-color:#34495e;color:#d0e0f0}
        .story-saci-dialog.a7 .story-saci-dialog-btn:hover{background:linear-gradient(180deg,rgba(52,73,94,.45),transparent 45%),linear-gradient(135deg,#3a4a60,#1f2f40);box-shadow:0 6px 20px rgba(0,0,0,.6),0 0 25px rgba(52,73,94,.5)}
        .story-saci-dialog.a8{background:radial-gradient(circle at top,rgba(142,68,173,.25),transparent 55%),linear-gradient(180deg,#1f0a2a 0%,#0f0515 100%);border-color:#8e44ad;box-shadow:0 0 60px rgba(142,68,173,.5)}
        .story-saci-dialog.a8 .story-saci-dialog-img{border-color:#8e44ad;box-shadow:0 0 25px rgba(142,68,173,.6);filter:drop-shadow(0 0 8px rgba(142,68,173,.6))}
        .story-saci-dialog.a8 .story-saci-dialog-title{color:#d0a0e8;text-shadow:0 0 15px rgba(142,68,173,.8),0 2px 4px rgba(0,0,0,.8)}
        .story-saci-dialog.a8 .story-saci-dialog-subtitle{color:#b080c8}
        .story-saci-dialog.a8 .story-saci-dialog-text{border-left-color:#8e44ad}
        .story-saci-dialog.a8 .story-saci-dialog-text::before{color:#8e44ad}
        .story-saci-dialog.a8 .story-saci-dialog-btn{background:linear-gradient(180deg,rgba(142,68,173,.3),transparent 45%),linear-gradient(135deg,#5a2a70,#3a1548);border-color:#8e44ad;color:#e8d0f5}
        .story-saci-dialog.a8 .story-saci-dialog-btn:hover{background:linear-gradient(180deg,rgba(142,68,173,.45),transparent 45%),linear-gradient(135deg,#7a3a90,#4a1a58);box-shadow:0 6px 20px rgba(0,0,0,.6),0 0 25px rgba(142,68,173,.5)}
        .story-saci-dialog.a9{background:radial-gradient(circle at top,rgba(232,67,147,.25),transparent 55%),linear-gradient(180deg,#2a0a1a 0%,#150508 100%);border-color:#e84393;box-shadow:0 0 60px rgba(232,67,147,.5)}
        .story-saci-dialog.a9 .story-saci-dialog-img{border-color:#e84393;box-shadow:0 0 25px rgba(232,67,147,.6);filter:drop-shadow(0 0 8px rgba(232,67,147,.6))}
        .story-saci-dialog.a9 .story-saci-dialog-title{color:#f5a8c8;text-shadow:0 0 15px rgba(232,67,147,.8),0 2px 4px rgba(0,0,0,.8)}
        .story-saci-dialog.a9 .story-saci-dialog-subtitle{color:#d088a8}
        .story-saci-dialog.a9 .story-saci-dialog-text{border-left-color:#e84393}
        .story-saci-dialog.a9 .story-saci-dialog-text::before{color:#e84393}
        .story-saci-dialog.a9 .story-saci-dialog-btn{background:linear-gradient(180deg,rgba(232,67,147,.3),transparent 45%),linear-gradient(135deg,#7a2048,#4a1028);border-color:#e84393;color:#f5d0e0}
        .story-saci-dialog.a9 .story-saci-dialog-btn:hover{background:linear-gradient(180deg,rgba(232,67,147,.45),transparent 45%),linear-gradient(135deg,#9a2a58,#5a1838);box-shadow:0 6px 20px rgba(0,0,0,.6),0 0 25px rgba(232,67,147,.5)}
        .story-saci-dialog.a10{background:radial-gradient(circle at top,rgba(44,62,80,.25),transparent 55%),linear-gradient(180deg,#0a0f15 0%,#05080d 100%);border-color:#2c3e50;box-shadow:0 0 60px rgba(44,62,80,.6)}
        .story-saci-dialog.a10 .story-saci-dialog-img{border-color:#2c3e50;box-shadow:0 0 25px rgba(44,62,80,.7);filter:drop-shadow(0 0 8px rgba(44,62,80,.7))}
        .story-saci-dialog.a10 .story-saci-dialog-title{color:#a8b8c8;text-shadow:0 0 15px rgba(44,62,80,.9),0 2px 4px rgba(0,0,0,.8)}
        .story-saci-dialog.a10 .story-saci-dialog-subtitle{color:#7f8f9f}
        .story-saci-dialog.a10 .story-saci-dialog-text{border-left-color:#2c3e50}
        .story-saci-dialog.a10 .story-saci-dialog-text::before{color:#2c3e50}
        .story-saci-dialog.a10 .story-saci-dialog-btn{background:linear-gradient(180deg,rgba(44,62,80,.35),transparent 45%),linear-gradient(135deg,#1a2530,#0d1218);border-color:#2c3e50;color:#d0e0f0}
        .story-saci-dialog.a10 .story-saci-dialog-btn:hover{background:linear-gradient(180deg,rgba(44,62,80,.5),transparent 45%),linear-gradient(135deg,#2a3540,#151f28);box-shadow:0 6px 20px rgba(0,0,0,.6),0 0 25px rgba(44,62,80,.5)}
        .story-saci-dialog.a11{background:radial-gradient(circle at top,rgba(241,196,15,.2),transparent 55%),linear-gradient(180deg,#1a1505 0%,#0d0a02 100%);border-color:#f1c40f;box-shadow:0 0 60px rgba(241,196,15,.4)}
        .story-saci-dialog.a11 .story-saci-dialog-img{border-color:#f1c40f;box-shadow:0 0 25px rgba(241,196,15,.5);filter:drop-shadow(0 0 8px rgba(241,196,15,.5))}
        .story-saci-dialog.a11 .story-saci-dialog-title{color:#f5e0a0;text-shadow:0 0 15px rgba(241,196,15,.8),0 2px 4px rgba(0,0,0,.8)}
        .story-saci-dialog.a11 .story-saci-dialog-subtitle{color:#d0b070}
        .story-saci-dialog.a11 .story-saci-dialog-text{border-left-color:#f1c40f}
        .story-saci-dialog.a11 .story-saci-dialog-text::before{color:#f1c40f}
        .story-saci-dialog.a11 .story-saci-dialog-btn{background:linear-gradient(180deg,rgba(241,196,15,.25),transparent 45%),linear-gradient(135deg,#7a6020,#4a3a10);border-color:#f1c40f;color:#f5ecd0}
        .story-saci-dialog.a11 .story-saci-dialog-btn:hover{background:linear-gradient(180deg,rgba(241,196,15,.4),transparent 45%),linear-gradient(135deg,#9a7828,#5a4818);box-shadow:0 6px 20px rgba(0,0,0,.6),0 0 25px rgba(241,196,15,.5)}
        .story-saci-dialog.a12{background:radial-gradient(circle at top,rgba(230,126,34,.25),transparent 55%),linear-gradient(180deg,#2a1505 0%,#150a02 100%);border-color:#e67e22;box-shadow:0 0 60px rgba(230,126,34,.5)}
        .story-saci-dialog.a12 .story-saci-dialog-img{border-color:#e67e22;box-shadow:0 0 25px rgba(230,126,34,.6);filter:drop-shadow(0 0 8px rgba(230,126,34,.6))}
        .story-saci-dialog.a12 .story-saci-dialog-title{color:#f5b878;text-shadow:0 0 15px rgba(230,126,34,.8),0 2px 4px rgba(0,0,0,.8)}
        .story-saci-dialog.a12 .story-saci-dialog-subtitle{color:#d09858}
        .story-saci-dialog.a12 .story-saci-dialog-text{border-left-color:#e67e22}
        .story-saci-dialog.a12 .story-saci-dialog-text::before{color:#e67e22}
        .story-saci-dialog.a12 .story-saci-dialog-btn{background:linear-gradient(180deg,rgba(230,126,34,.3),transparent 45%),linear-gradient(135deg,#7a4a1a,#4a2a0a);border-color:#e67e22;color:#f5dcb8}
        .story-saci-dialog.a12 .story-saci-dialog-btn:hover{background:linear-gradient(180deg,rgba(230,126,34,.45),transparent 45%),linear-gradient(135deg,#9a5a20,#5a3a10);box-shadow:0 6px 20px rgba(0,0,0,.6),0 0 25px rgba(230,126,34,.5)}
        .story-saci-dialog.a13{background:radial-gradient(circle at top,rgba(80,20,120,.35),transparent 55%),linear-gradient(180deg,#1a0825 0%,#0a0412 100%);border-color:#6a1090;box-shadow:0 0 80px rgba(106,16,144,.7)}
        .story-saci-dialog.a13 .story-saci-dialog-img{border-color:#6a1090;box-shadow:0 0 30px rgba(106,16,144,.8);filter:drop-shadow(0 0 10px rgba(106,16,144,.8))}
        .story-saci-dialog.a13 .story-saci-dialog-title{color:#c080e0;text-shadow:0 0 20px rgba(106,16,144,1),0 2px 4px rgba(0,0,0,.8)}
        .story-saci-dialog.a13 .story-saci-dialog-subtitle{color:#9050b0}
        .story-saci-dialog.a13 .story-saci-dialog-text{border-left-color:#6a1090}
        .story-saci-dialog.a13 .story-saci-dialog-text::before{color:#6a1090}
        .story-saci-dialog.a13 .story-saci-dialog-btn{background:linear-gradient(180deg,rgba(106,16,144,.4),transparent 45%),linear-gradient(135deg,#3a0855,#1a0328);border-color:#6a1090;color:#e0c0f5}
        .story-saci-dialog.a13 .story-saci-dialog-btn:hover{background:linear-gradient(180deg,rgba(106,16,144,.55),transparent 45%),linear-gradient(135deg,#5a1870,#2a0840);box-shadow:0 6px 20px rgba(0,0,0,.6),0 0 30px rgba(106,16,144,.6)}
        @keyframes storyPanelIn{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}
        .story-saci-dialog-header{display:flex;align-items:center;justify-content:center;gap:20px;margin-bottom:20px;flex-wrap:wrap}
        .story-saci-dialog-img{width:110px;height:110px;object-fit:contain;border-radius:6px;border:3px solid #8e44ad;background:radial-gradient(circle,rgba(0,0,0,.5),transparent 70%);box-shadow:0 0 25px rgba(142,68,173,.5);filter:drop-shadow(0 0 8px rgba(142,68,173,.6))}
        .story-saci-dialog-title-wrap{text-align:left}
        .story-saci-dialog-title{font-family:'Cinzel Decorative',serif;color:#c39bd3;font-size:1.6rem;letter-spacing:2px;text-shadow:0 0 15px rgba(142,68,173,.7),0 2px 4px rgba(0,0,0,.8);margin:0}
        .story-saci-dialog-subtitle{color:#a569c9;font-family:'EB Garamond',serif;font-size:1rem;font-style:italic;margin-top:4px}
        .story-saci-dialog-text{color:#e8dcc4;font-family:'EB Garamond',serif;font-size:1.1rem;line-height:1.7;padding:20px;background:rgba(10,6,2,.6);border-radius:4px;border-left:4px solid #8e44ad;text-align:left;margin-bottom:20px;font-style:italic;position:relative}
        .story-saci-dialog-text::before{content:'"';position:absolute;top:-8px;left:8px;font-family:'Cinzel Decorative',serif;font-size:3rem;color:#8e44ad;opacity:.5;line-height:1}
        .story-saci-dialog-btn{padding:14px 36px;background:linear-gradient(180deg,rgba(142,68,173,.25),transparent 45%),linear-gradient(135deg,#5a2a70,#3a1548);color:#f0e0ff;border:2px solid #8e44ad;border-radius:4px;cursor:pointer;font-family:'Cinzel',serif;font-weight:700;font-size:1rem;letter-spacing:2px;transition:all .3s;box-shadow:0 4px 15px rgba(0,0,0,.5);display:block;margin:0 auto}
        .story-saci-dialog-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.6),0 0 25px rgba(142,68,173,.5);background:linear-gradient(180deg,rgba(142,68,173,.35),transparent 45%),linear-gradient(135deg,#7a3a90,#4a1a58)}
        @media (max-width:600px){
            .story-saci-dialog-img{width:80px;height:80px}
            .story-saci-dialog-title{font-size:1.2rem}
            .story-saci-dialog-text{font-size:1rem;padding:15px}
        }
        .spectral-boss {
            opacity: 0.65;
            filter: hue-rotate(220deg) saturate(0.7) brightness(1.15) drop-shadow(0 0 8px rgba(142,68,173,.7));
            animation: spectralPulse 2s ease-in-out infinite;
        }
        @keyframes spectralPulse {
            0%,100% { opacity: 0.65; filter: hue-rotate(220deg) saturate(0.7) brightness(1.15) drop-shadow(0 0 8px rgba(142,68,173,.7)); }
            50%     { opacity: 0.8;  filter: hue-rotate(240deg) saturate(0.8) brightness(1.3) drop-shadow(0 0 14px rgba(142,68,173,.9)); }
        }
    `;
    document.head.appendChild(style);
})();

// =================================================================
// 🎨 SPRITES / EMOJIS
// =================================================================
const SPRITES_STORY = {
    // --- Ato 1 — Inimigos ---
    'porco_espinho':'https://i.imgur.com/vO5J9ft.gif',
    'jacare':'https://i.imgur.com/oTZzXX2.gif',
    'cervo':'https://i.imgur.com/iH2bRRx.gif',
    'onca_parda':'https://i.imgur.com/jN7AuyW.gif',
    // --- Ato 2 — Inimigos ---
    'tamandua':'https://i.imgur.com/8Breoi9.gif',
    'anta':'https://i.imgur.com/0avAEnD.gif',
    'queixada':'https://i.imgur.com/0fsGkKs.gif',
    'sucuri':'https://i.imgur.com/0dt6Jk2.gif',
    // --- Ato 3 — Iara (rio) ---
    'piranha':'https://i.imgur.com/KKOPhc5.gif',
    'lontra':'https://i.imgur.com/wOHYX2a.gif',
    'ariranha':'https://i.imgur.com/7obkFIq.gif',
    'pirarucu':'https://i.imgur.com/4dHWgkT.gif',
    // --- Ato 4 — Boitatá (caverna) ---
    'cascavel':'https://i.imgur.com/4QjmPV2.gif',
    'coral':'https://i.imgur.com/8kstFde.gif',
    'jararaca':'https://i.imgur.com/5Ll9B9h.gif',
    'tartaruga':'https://i.imgur.com/wr0u1rt.gif',
    // --- Ato 5 — Mula (campos) ---
    'bode':'https://i.imgur.com/vknDxdA.gif',
    'carneiro':'https://i.imgur.com/UlmnSrt.gif',
    'cavalo_selvagem':'https://i.imgur.com/Y8LuBY1.gif',
    'touro_bravo':'https://i.imgur.com/YAGfZmd.gif',
    // --- Ato 6 — Corpo Seco (sertão) ---
    'urubu':'https://i.imgur.com/h4N8ZzS.gif',
    'carcara':'https://i.imgur.com/1A2lqg8.gif',
    'tatu':'',
    'lobo_guara':'',
    // --- Ato 7 — Lobisomem (mata fria) ---
    'cachorro_mato':'',
    'raposa':'',
    'guaxinim':'',
    'jaguatirica':'',
    // --- Ato 8 — Cuca (pântano) ---
    'morcego':'',
    'coruja':'',
    'sapo_cururu':'',
    'seriema':'',
    // --- Ato 9 — Boto (água doce) ---
    'tucunare':'',
    'piraiba':'',
    'dourada':'',
    'peixe_boi':'',
    // --- Ato 10 — Boi (pasto) ---
    'bufalo':'',
    'vaca_louca':'',
    'cabra_preta':'',
    'zebu':'',
    // --- Ato 11 — Jaci (montanha) ---
    'gato_mato':'',
    'mariposa_gigante':'',
    'quati':'',
    'sucuarana':'',
    // --- Ato 12 — Guaraci (planalto) ---
    'gaviao':'',
    'falcao':'',
    'urutau':'',
    'aguia_cinzenta':'',
    // --- Ato 13 — Espectros ---
    'espectro_saci':'',
    'espectro_mapinguari':'',
    'espectro_iara':'',
    'espectro_boitata':'',
    'espectro_mula':'',
    'espectro_corposeco':'',
    'espectro_lobisomem':'',
    'espectro_cuca':'',
    'espectro_boto':'',
    'espectro_boi':'',
    'espectro_jaci':'',
    'espectro_guaraci':'',

    // --- Cenários ---
    'bg_1_1':'https://i.imgur.com/OWIsmOc.png','bg_1_2':'https://i.imgur.com/XBd9za6.png',
    'bg_1_3':'https://i.imgur.com/iNDxFfh.png','bg_1_4':'https://i.imgur.com/A25ehvZ.png',
    'bg_1_boss':'https://i.imgur.com/s6xi6kN.png',
    'bg_2_1':'','bg_2_2':'','bg_2_3':'','bg_2_4':'','bg_2_boss':'',
    'bg_3_1':'','bg_3_2':'','bg_3_3':'','bg_3_4':'','bg_3_boss':'',
    'bg_4_1':'','bg_4_2':'','bg_4_3':'','bg_4_4':'','bg_4_boss':'',
    'bg_5_1':'','bg_5_2':'','bg_5_3':'','bg_5_4':'','bg_5_boss':'',
    'bg_6_1':'','bg_6_2':'','bg_6_3':'','bg_6_4':'','bg_6_boss':'',
    'bg_7_1':'','bg_7_2':'','bg_7_3':'','bg_7_4':'','bg_7_boss':'',
    'bg_8_1':'','bg_8_2':'','bg_8_3':'','bg_8_4':'','bg_8_boss':'',
    'bg_9_1':'','bg_9_2':'','bg_9_3':'','bg_9_4':'','bg_9_boss':'',
    'bg_10_1':'','bg_10_2':'','bg_10_3':'','bg_10_4':'','bg_10_boss':'',
    'bg_11_1':'','bg_11_2':'','bg_11_3':'','bg_11_4':'','bg_11_boss':'',
    'bg_12_1':'','bg_12_2':'','bg_12_3':'','bg_12_4':'','bg_12_boss':'',
    'bg_13_1':'','bg_13_2':'','bg_13_3':'','bg_13_4':'',

    // --- Capas ---
    'capa_ato1':'https://i.imgur.com/pEXoYe0.jpeg','capa_ato2':'https://i.imgur.com/tkn3w1A.jpeg',
    'capa_ato3':'https://i.imgur.com/enf4Ffa.jpeg','capa_ato4':'https://i.imgur.com/BNl5IGf.jpeg',
    'capa_ato5':'https://i.imgur.com/TCeWp2u.jpeg','capa_ato6':'https://i.imgur.com/1hsYJGY.jpeg',
    'capa_ato7':'https://i.imgur.com/Ajkb19b.jpeg','capa_ato8':'https://i.imgur.com/clamKCi.jpeg',
    'capa_ato9':'https://i.imgur.com/N2a1yXT.jpeg','capa_ato10':'https://i.imgur.com/13DFRys.jpeg',
    'capa_ato11':'https://i.imgur.com/wAdrEXH.jpeg','capa_ato12':'https://i.imgur.com/cFTni7W.jpeg',
    'capa_ato13':'https://i.imgur.com/J3lDlLS.jpeg',

    // --- Aldeia ---
    'aldeia_bg':'https://i.imgur.com/ld3V2eD.png','aldeia_atos':'https://i.imgur.com/BrloIjF.png',
    'aldeia_oca':'https://i.imgur.com/419FdCx.png','aldeia_loja':'https://i.imgur.com/dFSunKa.png',
    'aldeia_ritual':'https://i.imgur.com/wb2Nu4l.png','aldeia_bestiario':'https://i.imgur.com/RQn91EK.png',
    'aldeia_tesouraria':'https://i.imgur.com/vrurP0D.png',

    // --- Armas ---
    'arma_cajado':'','arma_arco':'','arma_manopla':'',

    // --- Ícones UI (B7) ---
    'ui_gold':'https://i.imgur.com/LIfKWB8.png',
    'ui_xp':'https://i.imgur.com/sksvz3H.png',
    'ui_swap':'https://i.imgur.com/12PFW5I.png',
    'ui_home':'https://i.imgur.com/ld3V2eD.png',
    'ui_play':'https://i.imgur.com/mXodqS6.png',
    'ui_gift':'https://i.imgur.com/a5t2pWl.png',
    'ui_crown':'',
    'ui_sparkle':'',
    'ui_skull':'https://i.imgur.com/GPSPBly.png',
    'ui_lock':'https://i.imgur.com/wGgq9l7.png',
    'ui_check':'https://i.imgur.com/Y0g5RoY.png',
    'ui_arrow':'https://i.imgur.com/mXodqS6.png',
    'ui_warn':'',
    'ui_medal':'https://i.imgur.com/ViAr1EO.png',
    'elem_fogo':'https://i.imgur.com/JouEZbM.png',
    'elem_agua':'https://i.imgur.com/tMRUv48.png',
    'elem_terra':'https://i.imgur.com/ZVPQ9iH.png',
    'elem_ar':'https://i.imgur.com/HLqTdbd.png',
    // Aliases
    'icon_story':'https://i.imgur.com/aL5KByZ.png','icon_locked':'https://i.imgur.com/wGgq9l7.png','icon_unlocked':'',
    'icon_skull':'https://i.imgur.com/GPSPBly.png','icon_drop':'https://i.imgur.com/a5t2pWl.png','icon_gold':'https://i.imgur.com/LIfKWB8.png'
};

const EMOJI_STORY = {
    // --- Ato 1 ---
    'porco_espinho':'🦔','jacare':'🐊','cervo':'🦌','onca_parda':'🐆','saci':'👺',
    // --- Ato 2 ---
    'tamandua':'🐜','anta':'🦛','queixada':'🐗','sucuri':'🐍','mapinguari':'🦥',
    // --- Ato 3 ---
    'piranha':'🐟','lontra':'🦦','ariranha':'🦦','pirarucu':'🐠','iara':'🧜‍♀️',
    // --- Ato 4 ---
    'cascavel':'🐍','coral':'🐍','jararaca':'🐍','tartaruga':'🐢','boitata':'🔥',
    // --- Ato 5 ---
    'bode':'🐐','carneiro':'🐏','cavalo_selvagem':'🐎','touro_bravo':'🐂','mula':'🐴',
    // --- Ato 6 ---
    'urubu':'🦅','carcara':'🦅','tatu':'🦔','lobo_guara':'🐺','corpo_seco':'💀',
    // --- Ato 7 ---
    'cachorro_mato':'🐕','raposa':'🦊','guaxinim':'🦝','jaguatirica':'🐆','lobisomem':'🐺',
    // --- Ato 8 ---
    'morcego':'🦇','coruja':'🦉','sapo_cururu':'🐸','seriema':'🐦','cuca':'🧙‍♀️',
    // --- Ato 9 ---
    'tucunare':'🐟','piraiba':'🐟','dourada':'🐟','peixe_boi':'🦭','boto':'🐬',
    // --- Ato 10 ---
    'bufalo':'🐃','vaca_louca':'🐄','cabra_preta':'🐐','zebu':'🐂','boi':'🐂',
    // --- Ato 11 ---
    'gato_mato':'🐈','mariposa_gigante':'🦋','quati':'🦝','sucuarana':'🐆','jaci':'🌙',
    // --- Ato 12 ---
    'gaviao':'🦅','falcao':'🦅','urutau':'🦉','aguia_cinzenta':'🦅','guaraci':'☀️',
    // --- Ato 13 — Espectros ---
    'espectro_saci':'👺','espectro_mapinguari':'🦥','espectro_iara':'🧜‍♀️','espectro_boitata':'🔥',
    'espectro_mula':'🐴','espectro_corposeco':'💀','espectro_lobisomem':'🐺','espectro_cuca':'🧙‍♀️',
    'espectro_boto':'🐬','espectro_boi':'🐂','espectro_jaci':'🌙','espectro_guaraci':'☀️',
    'anhanga':'👹',

    // --- Cenários ---
    'bg_1_1':'🌲','bg_1_2':'🏞️','bg_1_3':'🌳','bg_1_4':'🌲','bg_1_boss':'🌪️',
    'bg_2_1':'🌿','bg_2_2':'🌳','bg_2_3':'🌲','bg_2_4':'🪨','bg_2_boss':'🌋',
    'bg_3_1':'💧','bg_3_2':'🌊','bg_3_3':'🏞️','bg_3_4':'🌊','bg_3_boss':'🌊',
    'bg_4_1':'🕯️','bg_4_2':'🕳️','bg_4_3':'🔥','bg_4_4':'🌋','bg_4_boss':'🔥',
    'bg_5_1':'🌾','bg_5_2':'🌾','bg_5_3':'🏚️','bg_5_4':'🌙','bg_5_boss':'🔥',
    'bg_6_1':'🏜️','bg_6_2':'💀','bg_6_3':'🏜️','bg_6_4':'🦴','bg_6_boss':'💀',
    'bg_7_1':'🌙','bg_7_2':'🌲','bg_7_3':'❄️','bg_7_4':'🌕','bg_7_boss':'🌕',
    'bg_8_1':'🌫️','bg_8_2':'🍄','bg_8_3':'🕸️','bg_8_4':'🧪','bg_8_boss':'🧙',
    'bg_9_1':'🌊','bg_9_2':'💧','bg_9_3':'🌊','bg_9_4':'🌌','bg_9_boss':'🐬',
    'bg_10_1':'🌾','bg_10_2':'🐂','bg_10_3':'🌙','bg_10_4':'🌑','bg_10_boss':'🐂',
    'bg_11_1':'🏔️','bg_11_2':'🌙','bg_11_3':'⭐','bg_11_4':'🌑','bg_11_boss':'🌙',
    'bg_12_1':'☀️','bg_12_2':'🔥','bg_12_3':'🌵','bg_12_4':'🏜️','bg_12_boss':'☀️',
    'bg_13_1':'🌪️','bg_13_2':'🌋','bg_13_3':'🌙','bg_13_4':'👹',

    // --- Capas ---
    'capa_ato1':'📖','capa_ato2':'📕','capa_ato3':'📘','capa_ato4':'📙','capa_ato5':'📗',
    'capa_ato6':'📓','capa_ato7':'📔','capa_ato8':'📒','capa_ato9':'📓','capa_ato10':'📕',
    'capa_ato11':'📘','capa_ato12':'📙','capa_ato13':'📕',

    // --- Aldeia ---
    'aldeia_bg':'🏘️','aldeia_atos':'🗺️','aldeia_oca':'🏠','aldeia_loja':'🧙',
    'aldeia_ritual':'⚗️','aldeia_bestiario':'📖','aldeia_tesouraria':'🏆',

    // --- Armas ---
    'arma_cajado':'🪄','arma_arco':'🏹','arma_manopla':'🪓',

    // --- Ícones UI (B7) ---
    'ui_gold':'💰','ui_xp':'⭐','ui_swap':'🔄','ui_home':'🏘️','ui_play':'▶',
    'ui_gift':'🎁','ui_crown':'👑','ui_sparkle':'✨','ui_skull':'💀','ui_lock':'🔒',
    'ui_check':'✅','ui_arrow':'▶','ui_warn':'⚠️','ui_medal':'🏅',
    'elem_fogo':'🔥','elem_agua':'💧','elem_terra':'⛰️','elem_ar':'🌪️',
    // Aliases
    'icon_story':'📖','icon_locked':'🔒','icon_unlocked':'✅',
    'icon_skull':'💀','icon_drop':'💎','icon_gold':'💰'
};

// Mapeamento pro jogo base (reusa sprite/tema/lógica)
const STORY_TO_BASE_BOSS = {
    'saci': 'SACI','mapinguari': 'MAPINGUARI','iara': 'IARA','boitata': 'BOITATA',
    'mula': 'MULA','corpo_seco': 'CORPOSECO','lobisomem': 'LOBISOMEM','cuca': 'CUCA',
    'boto': 'BOTO','boi': 'BOI','jaci': 'JACI','guaraci': 'GUARACI','anhanga': 'ANHANGA',
    'porco_espinho': null, 'jacare': null, 'cervo': null, 'onca_parda': null,
    'tamandua': null, 'anta': null, 'queixada': null, 'sucuri': null,
    'piranha': null, 'lontra': null, 'ariranha': null, 'pirarucu': null,
    'cascavel': null, 'coral': null, 'jararaca': null, 'tartaruga': null,
    'bode': null, 'carneiro': null, 'cavalo_selvagem': null, 'touro_bravo': null,
    'urubu': null, 'carcara': null, 'tatu': null, 'lobo_guara': null,
    'cachorro_mato': null, 'raposa': null, 'guaxinim': null, 'jaguatirica': null,
    'morcego': null, 'coruja': null, 'sapo_cururu': null, 'seriema': null,
    'tucunare': null, 'piraiba': null, 'dourada': null, 'peixe_boi': null,
    'bufalo': null, 'vaca_louca': null, 'cabra_preta': null, 'zebu': null,
    'gato_mato': null, 'mariposa_gigante': null, 'quati': null, 'sucuarana': null,
    'gaviao': null, 'falcao': null, 'urutau': null, 'aguia_cinzenta': null,
    'espectro_saci': 'SACI','espectro_mapinguari': 'MAPINGUARI','espectro_iara': 'IARA',
    'espectro_boitata': 'BOITATA','espectro_mula': 'MULA','espectro_corposeco': 'CORPOSECO',
    'espectro_lobisomem': 'LOBISOMEM','espectro_cuca': 'CUCA','espectro_boto': 'BOTO',
    'espectro_boi': 'BOI','espectro_jaci': 'JACI','espectro_guaraci': 'GUARACI'
};

const SPECTRAL_IDS = [
    'espectro_saci','espectro_mapinguari','espectro_iara','espectro_boitata',
    'espectro_mula','espectro_corposeco','espectro_lobisomem','espectro_cuca',
    'espectro_boto','espectro_boi','espectro_jaci','espectro_guaraci'
];

// =================================================================
// 🎯 SISTEMA UNIVERSAL DE ÍCONES (B7)
// =================================================================

function uiIcon(nome, extraCls){
    const spriteKey = nome.startsWith('ui_') || nome.startsWith('elem_') || nome.startsWith('icon_') ? nome : 'ui_' + nome;
    const url = SPRITES_STORY[spriteKey];
    const emoji = EMOJI_STORY[spriteKey] || '?';
    const cls = extraCls ? `ui-icon ${extraCls}` : 'ui-icon';
    if(url && url.trim() !== ''){
        return `<img src="${url}" class="${cls}" alt="${nome}" onerror="this.outerHTML='${emoji.replace(/'/g,"\\'")}'">`;
    }
    return `<span class="${cls} ui-icon-emoji">${emoji}</span>`;
}

function elemIcon(elemento){
    const map = {FOGO:'elem_fogo', AGUA:'elem_agua', TERRA:'elem_terra', AR:'elem_ar'};
    return uiIcon(map[elemento] || 'elem_fogo');
}

function storySprite(key){
    const url = SPRITES_STORY[key];
    return (url && url.trim()!=='')
        ? `<img src="${url}" class="story-sprite" alt="${key}" onerror="this.outerHTML='${EMOJI_STORY[key]||'?'}'">`
        : `<span class="story-emoji">${EMOJI_STORY[key]||'?'}</span>`;
}

function storySpriteLarge(key){
    const url = SPRITES_STORY[key];
    return (url && url.trim()!=='')
        ? `<img src="${url}" class="story-sprite-large" alt="${key}" onerror="this.outerHTML='<span class=\\'story-emoji-large\\'>${EMOJI_STORY[key]||'?'}</span>'">`
        : `<span class="story-emoji-large">${EMOJI_STORY[key]||'?'}</span>`;
}

// =================================================================
// 💾 SAVE (B5 — sem liberação geral)
// =================================================================
const STORY_SAVE_KEY_CURRENT = 'entity_story_current_save';
const STORY_SAVE_PREFIX = 'entity_story_save_';

function createEmptyStoryProgress(){
    return {
        saveName:'', createdAt:Date.now(),
        unlockedChapters:[1],
        unlockedPhases:{1:['1-1']},
        completedPhases:[], currentChapter:1,
        inventory:{}, totalXP:0, gold:0, enemiesDefeated:0, bossesDefeated:[],
        unlockedHeroes:['Tupa','Sume','Caipora'], selectedHeroes:['Tupa'],
        heroLevels:{Tupa:1,Sume:1,Caipora:1}, heroXP:{Tupa:0,Sume:0,Caipora:0},
        craftedWeapons:[], phasesEverCompleted:[]
    };
}

let STORY_PROGRESS = createEmptyStoryProgress();
let STORY_CURRENT_SAVE_NAME = null;

function getSaveKey(n){ return STORY_SAVE_PREFIX + n.toLowerCase().trim(); }

function saveStoryProgress(){
    if(!STORY_CURRENT_SAVE_NAME) return;
    try {
        localStorage.setItem(getSaveKey(STORY_CURRENT_SAVE_NAME), JSON.stringify(STORY_PROGRESS));
        localStorage.setItem(STORY_SAVE_KEY_CURRENT, STORY_CURRENT_SAVE_NAME);
    } catch(e){ console.warn('save falhou', e); }
}

// ⚡ B5 — NÃO libera todos os atos ao carregar
function loadStoryProgressByName(saveName){
    try {
        const raw = localStorage.getItem(getSaveKey(saveName));
        if(!raw) return false;
        const loaded = JSON.parse(raw);
        STORY_PROGRESS = Object.assign(createEmptyStoryProgress(), loaded);

        if(!Array.isArray(STORY_PROGRESS.unlockedChapters) || STORY_PROGRESS.unlockedChapters.length === 0){
            STORY_PROGRESS.unlockedChapters = [1];
        }
        if(!STORY_PROGRESS.unlockedPhases || Object.keys(STORY_PROGRESS.unlockedPhases).length === 0){
            STORY_PROGRESS.unlockedPhases = {1:['1-1']};
        }

        STORY_CURRENT_SAVE_NAME = STORY_PROGRESS.saveName || saveName;
        localStorage.setItem(STORY_SAVE_KEY_CURRENT, STORY_CURRENT_SAVE_NAME);
        return true;
    } catch(e){ console.warn('load falhou', e); return false; }
}

function createNewStorySave(saveName){
    STORY_PROGRESS = createEmptyStoryProgress();
    STORY_PROGRESS.saveName = saveName;
    STORY_CURRENT_SAVE_NAME = saveName;
    saveStoryProgress();
}

function listStorySaves(){
    const saves = [];
    try {
        for(let i=0;i<localStorage.length;i++){
            const key = localStorage.key(i);
            if(key && key.startsWith(STORY_SAVE_PREFIX)){
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    saves.push({
                        name: data.saveName || key.replace(STORY_SAVE_PREFIX,''),
                        gold: data.gold||0,
                        xp: data.totalXP||0,
                        completed: (data.completedPhases||[]).length,
                        createdAt: data.createdAt||0
                    });
                } catch(e){}
            }
        }
    } catch(e){}
    saves.sort((a,b)=>b.createdAt-a.createdAt);
    return saves;
}

function getLastUsedSaveName(){
    try { return localStorage.getItem(STORY_SAVE_KEY_CURRENT) || null; }
    catch(e){ return null; }
}

// =================================================================
// 🎨 ELEMENTO por nome do save
// =================================================================
const HERO_FIXED_ELEMENTS = {};

function getElementFromName(name){
    if(!name) return 'FOGO';
    let s = 0;
    for(let i=0;i<name.length;i++) s += name.charCodeAt(i);
    const C = (typeof COLORS !== 'undefined' && Array.isArray(COLORS)) ? COLORS : ['FOGO','AGUA','TERRA','AR'];
    return C[s % 4];
}
function getSaveElement(){
    return STORY_CURRENT_SAVE_NAME ? getElementFromName(STORY_CURRENT_SAVE_NAME) : 'FOGO';
}
function getHeroStoryElement(heroClass){
    if(HERO_FIXED_ELEMENTS[heroClass]) return HERO_FIXED_ELEMENTS[heroClass];
    return getSaveElement();
}

// =================================================================
// 🎁 HELPERS DE INVENTÁRIO / PROGRESSO
// =================================================================
function addMaterial(id,q=1){ STORY_PROGRESS.inventory[id] = (STORY_PROGRESS.inventory[id]||0)+q; }
function removeMaterial(id,q=1){
    if(!STORY_PROGRESS.inventory[id] || STORY_PROGRESS.inventory[id]<q) return false;
    STORY_PROGRESS.inventory[id]-=q;
    if(STORY_PROGRESS.inventory[id]<=0) delete STORY_PROGRESS.inventory[id];
    return true;
}
function addGold(a){ STORY_PROGRESS.gold = Math.max(0,(STORY_PROGRESS.gold||0)+a); }
function spendGold(a){
    if((STORY_PROGRESS.gold||0)<a) return false;
    STORY_PROGRESS.gold-=a; return true;
}
function isPhaseUnlocked(cid,pid){ return (STORY_PROGRESS.unlockedPhases[cid]||[]).includes(pid); }
function isPhaseCompleted(pid){ return STORY_PROGRESS.completedPhases.includes(pid); }
function unlockPhase(cid,pid){
    if(!STORY_PROGRESS.unlockedPhases[cid]) STORY_PROGRESS.unlockedPhases[cid]=[];
    if(!STORY_PROGRESS.unlockedPhases[cid].includes(pid)) STORY_PROGRESS.unlockedPhases[cid].push(pid);
    saveStoryProgress();
}
function completePhase(cid,pid,nextPid){
    if(!STORY_PROGRESS.completedPhases.includes(pid)) STORY_PROGRESS.completedPhases.push(pid);
    if(!STORY_PROGRESS.phasesEverCompleted.includes(pid)) STORY_PROGRESS.phasesEverCompleted.push(pid);
    if(nextPid) unlockPhase(cid,nextPid);
    saveStoryProgress();
}
function getStoryEnemyName(id){ return STORY_ENEMIES[id]?.name || id; }

// =================================================================
// 🗺️ CAPÍTULOS (13 atos)
// =================================================================
const STORY_CHAPTERS = {
    1:{id:1,name:'Ato 1 — O Caminho do Redemoinho',description:'O Saci, corrompido por Anhangá, comanda os animais da mata. Atravesse o território dos bichos enfeitiçados para purificar o Senhor do Redemoinho.',capa:'capa_ato1',phases:[
        {id:'1-1',name:'Trilha dos Espinhos',bg:'bg_1_1',enemies:['porco_espinho'],description:'O primeiro guardião do caminho.',reward:{xp:10,gold:15}},
        {id:'1-2',name:'Vau do Rio',bg:'bg_1_2',enemies:['porco_espinho','jacare'],description:'Dois guardiões protegem o vau.',reward:{xp:20,gold:25}},
        {id:'1-3',name:'Bosque Sagrado',bg:'bg_1_3',enemies:['porco_espinho','jacare','cervo'],description:'Três guardiões.',reward:{xp:30,gold:40}},
        {id:'1-4',name:'Coração da Mata',bg:'bg_1_4',enemies:['porco_espinho','jacare','cervo','onca_parda'],description:'A onça-parda também caiu.',reward:{xp:50,gold:60}},
        {id:'1-BOSS',name:'Redemoinho',bg:'bg_1_boss',isBoss:true,enemies:['porco_espinho','jacare','cervo','onca_parda','saci'],description:'Enfrente o Saci.',reward:{xp:100,gold:100,chapterComplete:true}}
    ]},
    2:{id:2,name:'Ato 2 — Mata Fechada',description:'O Mapinguari, o gigante protetor das árvores, foi consumido pela frustração. Agora ele devora o que jurou proteger. Atravesse a mata fechada e liberte o Pilar da Floresta.',capa:'capa_ato2',phases:[
        {id:'2-1',name:'Trilha das Raízes',bg:'bg_2_1',enemies:['tamandua'],description:'A mata fechada começa aqui.',reward:{xp:20,gold:25}},
        {id:'2-2',name:'Clareira Selvagem',bg:'bg_2_2',enemies:['tamandua','anta'],description:'Dois guardiões bloqueiam o caminho.',reward:{xp:30,gold:40}},
        {id:'2-3',name:'Vale dos Ossos',bg:'bg_2_3',enemies:['tamandua','anta','queixada'],description:'Três servos do Devorador.',reward:{xp:45,gold:55}},
        {id:'2-4',name:'Águas Turvas',bg:'bg_2_4',enemies:['tamandua','anta','queixada','sucuri'],description:'A Sucuri Gigante protege a passagem.',reward:{xp:65,gold:80}},
        {id:'2-BOSS',name:'Toca do Devorador',bg:'bg_2_boss',isBoss:true,enemies:['tamandua','anta','queixada','sucuri','mapinguari'],description:'Enfrente o Mapinguari.',reward:{xp:150,gold:150,chapterComplete:true}}
    ]},
    3:{id:3,name:'Ato 3 — Águas Profundas',description:'A Iara, sedutora dos rios, foi envenenada pela raiva. Suas águas agora afogam sem piedade. Mergulhe no leito do rio e liberte o Canto da Perdição.',capa:'capa_ato3',phases:[
        {id:'3-1',name:'Margem Sombria',bg:'bg_3_1',enemies:['piranha'],description:'O rio começa a ficar turvo.',reward:{xp:25,gold:30}},
        {id:'3-2',name:'Remanso Profundo',bg:'bg_3_2',enemies:['piranha','lontra'],description:'Dois guardiões das águas.',reward:{xp:40,gold:50}},
        {id:'3-3',name:'Cachoeira Sagrada',bg:'bg_3_3',enemies:['piranha','lontra','ariranha'],description:'Três servos do Canto.',reward:{xp:60,gold:70}},
        {id:'3-4',name:'Foz do Rio',bg:'bg_3_4',enemies:['piranha','lontra','ariranha','pirarucu'],description:'O Pirarucu bloqueia a foz.',reward:{xp:80,gold:100}},
        {id:'3-BOSS',name:'Palácio Submerso',bg:'bg_3_boss',isBoss:true,enemies:['piranha','lontra','ariranha','pirarucu','iara'],description:'Enfrente a Iara.',reward:{xp:200,gold:200,chapterComplete:true}}
    ]},
    4:{id:4,name:'Ato 4 — Chamas da Noite',description:'O Boitatá, a serpente de fogo, aceitou o poder de Anhangá. Agora ele consome tudo em seu caminho. Atravesse as cavernas incandescentes e liberte a Serpente de Fogo.',capa:'capa_ato4',phases:[
        {id:'4-1',name:'Entrada da Caverna',bg:'bg_4_1',enemies:['cascavel'],description:'A escuridão sibila.',reward:{xp:30,gold:35}},
        {id:'4-2',name:'Galeria das Serpentes',bg:'bg_4_2',enemies:['cascavel','coral'],description:'Duas serpentes guardam a passagem.',reward:{xp:45,gold:55}},
        {id:'4-3',name:'Câmara Ardente',bg:'bg_4_3',enemies:['cascavel','coral','jararaca'],description:'Três servos do fogo.',reward:{xp:65,gold:80}},
        {id:'4-4',name:'Lago de Lava',bg:'bg_4_4',enemies:['cascavel','coral','jararaca','tartaruga'],description:'A Tartaruga Ancestral protege o lago.',reward:{xp:90,gold:110}},
        {id:'4-BOSS',name:'Coração de Fogo',bg:'bg_4_boss',isBoss:true,enemies:['cascavel','coral','jararaca','tartaruga','boitata'],description:'Enfrente o Boitatá.',reward:{xp:250,gold:250,chapterComplete:true}}
    ]},
    5:{id:5,name:'Ato 5 — A Maldição do Fogo',description:'A Mula sem Cabeça, amaldiçoada por seus pecados, foi consumida pela fúria. Agora relincha fogo e dor. Atravesse os campos em chamas e liberte o Relincho da Noite.',capa:'capa_ato5',phases:[
        {id:'5-1',name:'Pastagem Abandonada',bg:'bg_5_1',enemies:['bode'],description:'O primeiro servo da maldição.',reward:{xp:35,gold:40}},
        {id:'5-2',name:'Cerca Quebrada',bg:'bg_5_2',enemies:['bode','carneiro'],description:'Dois guardiões do campo.',reward:{xp:50,gold:60}},
        {id:'5-3',name:'Estábulo em Cinzas',bg:'bg_5_3',enemies:['bode','carneiro','cavalo_selvagem'],description:'Três servos da Mula.',reward:{xp:70,gold:90}},
        {id:'5-4',name:'Curral Amaldiçoado',bg:'bg_5_4',enemies:['bode','carneiro','cavalo_selvagem','touro_bravo'],description:'O Touro Bravo guarda o curral.',reward:{xp:100,gold:120}},
        {id:'5-BOSS',name:'Relincho Final',bg:'bg_5_boss',isBoss:true,enemies:['bode','carneiro','cavalo_selvagem','touro_bravo','mula'],description:'Enfrente a Mula sem Cabeça.',reward:{xp:300,gold:300,chapterComplete:true}}
    ]},
    6:{id:6,name:'Ato 6 — Ossos do Sertão',description:'O Corpo Seco, esqueleto faminto, foi tentado por Anhangá. Sua fome é infinita. Atravesse o sertão árido e liberte o Devorador de Almas.',capa:'capa_ato6',phases:[
        {id:'6-1',name:'Terra Rachada',bg:'bg_6_1',enemies:['urubu'],description:'O céu já não é azul aqui.',reward:{xp:40,gold:45}},
        {id:'6-2',name:'Cemitério Esquecido',bg:'bg_6_2',enemies:['urubu','carcara'],description:'Aves da morte guardam o caminho.',reward:{xp:55,gold:70}},
        {id:'6-3',name:'Cavernas Secas',bg:'bg_6_3',enemies:['urubu','carcara','tatu'],description:'Três servos da fome.',reward:{xp:75,gold:95}},
        {id:'6-4',name:'Vale dos Ossos',bg:'bg_6_4',enemies:['urubu','carcara','tatu','lobo_guara'],description:'O Lobo-Guará uiva para a morte.',reward:{xp:110,gold:130}},
        {id:'6-BOSS',name:'Covil do Faminto',bg:'bg_6_boss',isBoss:true,enemies:['urubu','carcara','tatu','lobo_guara','corpo_seco'],description:'Enfrente o Corpo Seco.',reward:{xp:350,gold:350,chapterComplete:true}}
    ]},
    7:{id:7,name:'Ato 7 — A Maldição da Lua',description:'O Lobisomem, amaldiçoado a se transformar, ouviu Anhangá. A lua agora desperta apenas ódio. Atravesse a mata fria e liberte a Maldição da Lua.',capa:'capa_ato7',phases:[
        {id:'7-1',name:'Mata Fria',bg:'bg_7_1',enemies:['cachorro_mato'],description:'O primeiro uivo ao longe.',reward:{xp:50,gold:55}},
        {id:'7-2',name:'Trilha do Uivo',bg:'bg_7_2',enemies:['cachorro_mato','raposa'],description:'Dois caçadores noturnos.',reward:{xp:65,gold:80}},
        {id:'7-3',name:'Bosque Enluarado',bg:'bg_7_3',enemies:['cachorro_mato','raposa','guaxinim'],description:'Três servos da lua.',reward:{xp:85,gold:105}},
        {id:'7-4',name:'Clareira do Ritual',bg:'bg_7_4',enemies:['cachorro_mato','raposa','guaxinim','jaguatirica'],description:'A Jaguatirica ronda o ritual.',reward:{xp:120,gold:150}},
        {id:'7-BOSS',name:'Lua Cheia',bg:'bg_7_boss',isBoss:true,enemies:['cachorro_mato','raposa','guaxinim','jaguatirica','lobisomem'],description:'Enfrente o Lobisomem.',reward:{xp:400,gold:400,chapterComplete:true}}
    ]},
    8:{id:8,name:'Ato 8 — Poções e Sombras',description:'A Cuca, a velha bruxa, foi corrompida por Anhangá. Suas poções agora são veneno puro. Atravesse o pântano enfeitiçado e liberte a Bruxa da Floresta.',capa:'capa_ato8',phases:[
        {id:'8-1',name:'Pântano Sombrio',bg:'bg_8_1',enemies:['morcego'],description:'A névoa esconde perigo.',reward:{xp:60,gold:65}},
        {id:'8-2',name:'Caverna dos Ecos',bg:'bg_8_2',enemies:['morcego','coruja'],description:'Olhos na escuridão.',reward:{xp:75,gold:90}},
        {id:'8-3',name:'Covil da Bruxa',bg:'bg_8_3',enemies:['morcego','coruja','sapo_cururu'],description:'Três servos da Cuca.',reward:{xp:95,gold:120}},
        {id:'8-4',name:'Caldeirão Fervente',bg:'bg_8_4',enemies:['morcego','coruja','sapo_cururu','seriema'],description:'A Seriema guarda o caldeirão.',reward:{xp:130,gold:160}},
        {id:'8-BOSS',name:'Ritual das Sombras',bg:'bg_8_boss',isBoss:true,enemies:['morcego','coruja','sapo_cururu','seriema','cuca'],description:'Enfrente a Cuca.',reward:{xp:450,gold:450,chapterComplete:true}}
    ]},
    9:{id:9,name:'Ato 9 — Canto das Águas',description:'O Boto Rosa, sedutor das águas doces, foi corrompido pela luxúria de Anhangá. Seus encantos são mortalmente perigosos. Atravesse o rio fundo e liberte o Sedutor das Águas.',capa:'capa_ato9',phases:[
        {id:'9-1',name:'Rio Calmo',bg:'bg_9_1',enemies:['tucunare'],description:'Mas o canto já se ouve.',reward:{xp:70,gold:75}},
        {id:'9-2',name:'Corredeira',bg:'bg_9_2',enemies:['tucunare','piraiba'],description:'Dois peixes guardam a correnteza.',reward:{xp:85,gold:100}},
        {id:'9-3',name:'Poço Fundo',bg:'bg_9_3',enemies:['tucunare','piraiba','dourada'],description:'Três servos das águas.',reward:{xp:105,gold:130}},
        {id:'9-4',name:'Remanso do Boto',bg:'bg_9_4',enemies:['tucunare','piraiba','dourada','peixe_boi'],description:'O Peixe-Boi protege o remanso.',reward:{xp:140,gold:170}},
        {id:'9-BOSS',name:'Canto Final',bg:'bg_9_boss',isBoss:true,enemies:['tucunare','piraiba','dourada','peixe_boi','boto'],description:'Enfrente o Boto Rosa.',reward:{xp:500,gold:500,chapterComplete:true}}
    ]},
    10:{id:10,name:'Ato 10 — Terror do Pasto',description:'O Boi da Cara Preta, guardião das trevas, foi consumido pelo medo. Seu verdadeiro terror se revela. Atravesse o pasto noturno e liberte o Terrível das Sombras.',capa:'capa_ato10',phases:[
        {id:'10-1',name:'Pasto Vazio',bg:'bg_10_1',enemies:['bufalo'],description:'O primeiro rugido.',reward:{xp:80,gold:85}},
        {id:'10-2',name:'Curral Abandonado',bg:'bg_10_2',enemies:['bufalo','vaca_louca'],description:'Dois guardiões do pasto.',reward:{xp:95,gold:110}},
        {id:'10-3',name:'Campo das Sombras',bg:'bg_10_3',enemies:['bufalo','vaca_louca','cabra_preta'],description:'Três servos do terror.',reward:{xp:115,gold:140}},
        {id:'10-4',name:'Curral da Morte',bg:'bg_10_4',enemies:['bufalo','vaca_louca','cabra_preta','zebu'],description:'O Zebu guarda o curral.',reward:{xp:150,gold:180}},
        {id:'10-BOSS',name:'Cara Preta',bg:'bg_10_boss',isBoss:true,enemies:['bufalo','vaca_louca','cabra_preta','zebu','boi'],description:'Enfrente o Boi da Cara Preta.',reward:{xp:550,gold:550,chapterComplete:true}}
    ]},
    11:{id:11,name:'Ato 11 — Luz Fria da Lua',description:'Jaci, deusa da lua, foi envenenada pela melancolia. Seus raios queimam em vez de iluminar. Suba a montanha noturna e liberte a Deusa da Lua.',capa:'capa_ato11',phases:[
        {id:'11-1',name:'Encosta da Montanha',bg:'bg_11_1',enemies:['gato_mato'],description:'A noite é mais fria aqui.',reward:{xp:90,gold:95}},
        {id:'11-2',name:'Floresta de Névoa',bg:'bg_11_2',enemies:['gato_mato','mariposa_gigante'],description:'Sombras em movimento.',reward:{xp:105,gold:120}},
        {id:'11-3',name:'Penhasco Prateado',bg:'bg_11_3',enemies:['gato_mato','mariposa_gigante','quati'],description:'Três servos da lua.',reward:{xp:125,gold:150}},
        {id:'11-4',name:'Pico Enluarado',bg:'bg_11_4',enemies:['gato_mato','mariposa_gigante','quati','sucuarana'],description:'A Suçuarana ronda o pico.',reward:{xp:160,gold:190}},
        {id:'11-BOSS',name:'Trono Lunar',bg:'bg_11_boss',isBoss:true,enemies:['gato_mato','mariposa_gigante','quati','sucuarana','jaci'],description:'Enfrente Jaci.',reward:{xp:600,gold:600,chapterComplete:true}}
    ]},
    12:{id:12,name:'Ato 12 — O Sol Devorador',description:'Guaraci, deus do sol, foi consumido pela arrogância. Seu sol queima sem piedade. Atravesse o planalto incandescente e liberte o Sol Devorador.',capa:'capa_ato12',phases:[
        {id:'12-1',name:'Planalto Ardente',bg:'bg_12_1',enemies:['gaviao'],description:'O calor é insuportável.',reward:{xp:100,gold:105}},
        {id:'12-2',name:'Ravina Seca',bg:'bg_12_2',enemies:['gaviao','falcao'],description:'Dois senhores do céu.',reward:{xp:115,gold:130}},
        {id:'12-3',name:'Vale do Urutau',bg:'bg_12_3',enemies:['gaviao','falcao','urutau'],description:'Três servos do sol.',reward:{xp:135,gold:160}},
        {id:'12-4',name:'Ninho da Águia',bg:'bg_12_4',enemies:['gaviao','falcao','urutau','aguia_cinzenta'],description:'A Águia-Cinzenta protege o ninho.',reward:{xp:170,gold:200}},
        {id:'12-BOSS',name:'Trono Solar',bg:'bg_12_boss',isBoss:true,enemies:['gaviao','falcao','urutau','aguia_cinzenta','guaraci'],description:'Enfrente Guaraci.',reward:{xp:700,gold:700,chapterComplete:true}}
    ]},
    13:{id:13,name:'Ato 13 — O Senhor do Abismo',description:'Anhangá reuniu os poderes que consumiu. Ele manifesta os doze guardiões como servos, e agora aguarda no abismo. Atravesse os portões do pesadelo e liberte o Senhor do Abismo.',capa:'capa_ato13',phases:[
        {id:'13-1',name:'Portão dos Corrompidos',bg:'bg_13_1',isBoss:true,enemies:['saci','mapinguari','iara','boitata'],description:'Os quatro primeiros guardiões te aguardam.',reward:{xp:200,gold:200}},
        {id:'13-2',name:'Portão dos Caídos',bg:'bg_13_2',isBoss:true,enemies:['mula','corpo_seco','lobisomem','cuca'],description:'Os quatro guardiões do meio.',reward:{xp:250,gold:250}},
        {id:'13-3',name:'Portão do Crepúsculo',bg:'bg_13_3',isBoss:true,enemies:['boto','boi','jaci','guaraci'],description:'Os quatro guardiões finais.',reward:{xp:300,gold:300}},
        {id:'13-4',name:'Abismo Final',bg:'bg_13_4',isBoss:true,isFinalBoss:true,enemies:['espectro_saci','espectro_mapinguari','espectro_iara','espectro_boitata','espectro_mula','espectro_corposeco','espectro_lobisomem','espectro_cuca','espectro_boto','espectro_boi','espectro_jaci','espectro_guaraci','anhanga'],description:'Os doze espectros + Anhangá. A batalha final.',reward:{xp:2000,gold:2000,chapterComplete:true}}
    ]}
};

// =================================================================
// 🎁 MATERIAIS / LOJA
// =================================================================
const STORY_MATERIALS = {
    espinho:{id:'espinho',name:'Espinho',emoji:'🌵'},espinho_raro:{id:'espinho_raro',name:'Espinho Raro',emoji:'🌵'},
    pele_jacare:{id:'pele_jacare',name:'Pele de Jacaré',emoji:'🟢'},escama_brilhante:{id:'escama_brilhante',name:'Escama Brilhante',emoji:'💚'},
    chifre_cervo:{id:'chifre_cervo',name:'Chifre de Cervo',emoji:'🦌'},chifre_ancestral:{id:'chifre_ancestral',name:'Chifre Ancestral',emoji:'🦌'},
    garra_onca:{id:'garra_onca',name:'Garra de Onça',emoji:'🐾'},garra_lendaria:{id:'garra_lendaria',name:'Garra Lendária',emoji:'🐾'},
    gorro_saci:{id:'gorro_saci',name:'Gorro do Saci',emoji:'🧣'},amuleto_saci:{id:'amuleto_saci',name:'Amuleto do Saci',emoji:'📿'},
    pocao_cura:{id:'pocao_cura',name:'Poção de Cura',emoji:'🧪'},
    pelo_tamandua:{id:'pelo_tamandua',name:'Pelo de Tamanduá',emoji:'🟤'},garra_tamandua:{id:'garra_tamandua',name:'Garra de Tamanduá',emoji:'🗡️'},
    couro_anta:{id:'couro_anta',name:'Couro de Anta',emoji:'🟫'},chifre_anta:{id:'chifre_anta',name:'Chifre de Anta',emoji:'🦏'},
    cera_queixada:{id:'cera_queixada',name:'Cera de Queixada',emoji:'⚫'},presa_queixada:{id:'presa_queixada',name:'Presa de Queixada',emoji:'🦷'},
    escama_sucuri:{id:'escama_sucuri',name:'Escama de Sucuri',emoji:'🐍'},pele_sucuri:{id:'pele_sucuri',name:'Pele de Sucuri',emoji:'🟩'},
    pelo_mapinguari:{id:'pelo_mapinguari',name:'Pelo do Mapinguari',emoji:'🦥'},amuleto_mapinguari:{id:'amuleto_mapinguari',name:'Amuleto do Mapinguari',emoji:'🪬'},
    escama_piranha:{id:'escama_piranha',name:'Escama de Piranha',emoji:'🐟'},dente_piranha:{id:'dente_piranha',name:'Dente de Piranha',emoji:'🦷'},
    pelo_lontra:{id:'pelo_lontra',name:'Pelo de Lontra',emoji:'🟫'},garra_lontra:{id:'garra_lontra',name:'Garra de Lontra',emoji:'🗡️'},
    pelo_ariranha:{id:'pelo_ariranha',name:'Pelo de Ariranha',emoji:'🟤'},dente_ariranha:{id:'dente_ariranha',name:'Dente de Ariranha',emoji:'🦷'},
    escama_pirarucu:{id:'escama_pirarucu',name:'Escama de Pirarucu',emoji:'🐠'},lingua_pirarucu:{id:'lingua_pirarucu',name:'Língua de Pirarucu',emoji:'👅'},
    joia_iara:{id:'joia_iara',name:'Joia da Iara',emoji:'💎'},amuleto_iara:{id:'amuleto_iara',name:'Amuleto da Iara',emoji:'🧜‍♀️'},
    pele_cascavel:{id:'pele_cascavel',name:'Pele de Cascavel',emoji:'🐍'},chocalho_cascavel:{id:'chocalho_cascavel',name:'Chocalho de Cascavel',emoji:'🔔'},
    anel_coral:{id:'anel_coral',name:'Anel de Coral',emoji:'🔴'},veneno_coral:{id:'veneno_coral',name:'Veneno de Coral',emoji:'🧪'},
    pele_jararaca:{id:'pele_jararaca',name:'Pele de Jararaca',emoji:'🐍'},presa_jararaca:{id:'presa_jararaca',name:'Presa de Jararaca',emoji:'🦷'},
    casco_tartaruga:{id:'casco_tartaruga',name:'Casco de Tartaruga',emoji:'🛡️'},ovo_tartaruga:{id:'ovo_tartaruga',name:'Ovo de Tartaruga',emoji:'🥚'},
    escama_boitata:{id:'escama_boitata',name:'Escama Flamejante',emoji:'🔥'},amuleto_boitata:{id:'amuleto_boitata',name:'Amuleto do Boitatá',emoji:'🪬'},
    chifre_bode:{id:'chifre_bode',name:'Chifre de Bode',emoji:'🐐'},pelo_bode:{id:'pelo_bode',name:'Pelo de Bode',emoji:'🟤'},
    la_carneiro:{id:'la_carneiro',name:'Lã de Carneiro',emoji:'☁️'},chifre_carneiro:{id:'chifre_carneiro',name:'Chifre de Carneiro',emoji:'🐏'},
    crina_cavalo:{id:'crina_cavalo',name:'Crina de Cavalo',emoji:'🟫'},casco_cavalo:{id:'casco_cavalo',name:'Casco de Cavalo',emoji:'🐎'},
    chifre_touro:{id:'chifre_touro',name:'Chifre de Touro',emoji:'🐂'},couro_touro:{id:'couro_touro',name:'Couro de Touro',emoji:'🟫'},
    ferradura_mula:{id:'ferradura_mula',name:'Ferradura da Mula',emoji:'🧲'},amuleto_mula:{id:'amuleto_mula',name:'Amuleto da Mula',emoji:'🪬'},
    pena_urubu:{id:'pena_urubu',name:'Pena de Urubu',emoji:'🪶'},bico_urubu:{id:'bico_urubu',name:'Bico de Urubu',emoji:'🦅'},
    pena_carcara:{id:'pena_carcara',name:'Pena de Carcará',emoji:'🪶'},garra_carcara:{id:'garra_carcara',name:'Garra de Carcará',emoji:'🗡️'},
    placa_tatu:{id:'placa_tatu',name:'Placa de Tatu',emoji:'🛡️'},garra_tatu:{id:'garra_tatu',name:'Garra de Tatu',emoji:'🗡️'},
    pelo_lobo_guara:{id:'pelo_lobo_guara',name:'Pelo de Lobo-Guará',emoji:'🐺'},presa_lobo_guara:{id:'presa_lobo_guara',name:'Presa de Lobo-Guará',emoji:'🦷'},
    osso_corpo_seco:{id:'osso_corpo_seco',name:'Osso Amaldiçoado',emoji:'🦴'},amuleto_corpo_seco:{id:'amuleto_corpo_seco',name:'Amuleto do Corpo Seco',emoji:'🪬'},
    pelo_cachorro_mato:{id:'pelo_cachorro_mato',name:'Pelo de Cachorro-do-Mato',emoji:'🐕'},presa_cachorro_mato:{id:'presa_cachorro_mato',name:'Presa de Cachorro-do-Mato',emoji:'🦷'},
    cauda_raposa:{id:'cauda_raposa',name:'Cauda de Raposa',emoji:'🦊'},pelo_raposa:{id:'pelo_raposa',name:'Pelo de Raposa',emoji:'🟠'},
    mascara_guaxinim:{id:'mascara_guaxinim',name:'Máscara de Guaxinim',emoji:'🦝'},garra_guaxinim:{id:'garra_guaxinim',name:'Garra de Guaxinim',emoji:'🗡️'},
    pelo_jaguatirica:{id:'pelo_jaguatirica',name:'Pelo de Jaguatirica',emoji:'🐆'},garra_jaguatirica:{id:'garra_jaguatirica',name:'Garra de Jaguatirica',emoji:'🗡️'},
    pelo_lobisomem:{id:'pelo_lobisomem',name:'Pelo de Lobisomem',emoji:'🐺'},amuleto_lobisomem:{id:'amuleto_lobisomem',name:'Amuleto do Lobisomem',emoji:'🌕'},
    asa_morcego:{id:'asa_morcego',name:'Asa de Morcego',emoji:'🦇'},presa_morcego:{id:'presa_morcego',name:'Presa de Morcego',emoji:'🦷'},
    pena_coruja:{id:'pena_coruja',name:'Pena de Coruja',emoji:'🪶'},olho_coruja:{id:'olho_coruja',name:'Olho de Coruja',emoji:'👁️'},
    pele_sapo:{id:'pele_sapo',name:'Pele de Sapo',emoji:'🐸'},veneno_sapo:{id:'veneno_sapo',name:'Veneno de Sapo',emoji:'🧪'},
    pena_seriema:{id:'pena_seriema',name:'Pena de Seriema',emoji:'🪶'},bico_seriema:{id:'bico_seriema',name:'Bico de Seriema',emoji:'🐦'},
    caldeirao_cuca:{id:'caldeirao_cuca',name:'Fragmento do Caldeirão',emoji:'🍯'},amuleto_cuca:{id:'amuleto_cuca',name:'Amuleto da Cuca',emoji:'🪬'},
    escama_tucunare:{id:'escama_tucunare',name:'Escama de Tucunaré',emoji:'🐟'},dente_tucunare:{id:'dente_tucunare',name:'Dente de Tucunaré',emoji:'🦷'},
    escama_piraiba:{id:'escama_piraiba',name:'Escama de Piraíba',emoji:'🐟'},lingua_piraiba:{id:'lingua_piraiba',name:'Língua de Piraíba',emoji:'👅'},
    escama_dourada:{id:'escama_dourada',name:'Escama Dourada',emoji:'✨'},barbatana_dourada:{id:'barbatana_dourada',name:'Barbatana Dourada',emoji:'🐟'},
    couro_peixe_boi:{id:'couro_peixe_boi',name:'Couro de Peixe-Boi',emoji:'🟫'},osso_peixe_boi:{id:'osso_peixe_boi',name:'Osso de Peixe-Boi',emoji:'🦴'},
    flor_boto:{id:'flor_boto',name:'Flor do Boto',emoji:'🌸'},amuleto_boto:{id:'amuleto_boto',name:'Amuleto do Boto',emoji:'🪬'},
    chifre_bufalo:{id:'chifre_bufalo',name:'Chifre de Búfalo',emoji:'🐃'},couro_bufalo:{id:'couro_bufalo',name:'Couro de Búfalo',emoji:'🟫'},
    sino_vaca:{id:'sino_vaca',name:'Sino da Vaca Louca',emoji:'🔔'},chifre_vaca:{id:'chifre_vaca',name:'Chifre da Vaca Louca',emoji:'🐄'},
    chifre_cabra:{id:'chifre_cabra',name:'Chifre de Cabra Preta',emoji:'🐐'},pelo_cabra:{id:'pelo_cabra',name:'Pelo de Cabra Preta',emoji:'⚫'},
    corcova_zebu:{id:'corcova_zebu',name:'Corcova de Zebu',emoji:'🐂'},chifre_zebu:{id:'chifre_zebu',name:'Chifre de Zebu',emoji:'🐂'},
    chifre_boi:{id:'chifre_boi',name:'Chifre do Boi da Cara Preta',emoji:'🐂'},amuleto_boi:{id:'amuleto_boi',name:'Amuleto do Boi da Cara Preta',emoji:'🌑'},
    pelo_gato_mato:{id:'pelo_gato_mato',name:'Pelo de Gato-do-Mato',emoji:'🐈'},garra_gato_mato:{id:'garra_gato_mato',name:'Garra de Gato-do-Mato',emoji:'🗡️'},
    asa_mariposa:{id:'asa_mariposa',name:'Asa de Mariposa Gigante',emoji:'🦋'},po_mariposa:{id:'po_mariposa',name:'Pó Lunar',emoji:'✨'},
    mascara_quati:{id:'mascara_quati',name:'Máscara de Quati',emoji:'🦝'},cauda_quati:{id:'cauda_quati',name:'Cauda de Quati',emoji:'🟤'},
    pelo_sucuarana:{id:'pelo_sucuarana',name:'Pelo de Suçuarana',emoji:'🐆'},garra_sucuarana:{id:'garra_sucuarana',name:'Garra de Suçuarana',emoji:'🗡️'},
    raio_lunar:{id:'raio_lunar',name:'Raio Lunar',emoji:'🌙'},amuleto_jaci:{id:'amuleto_jaci',name:'Amuleto da Jaci',emoji:'🌙'},
    pena_gaviao:{id:'pena_gaviao',name:'Pena de Gavião',emoji:'🪶'},garra_gaviao:{id:'garra_gaviao',name:'Garra de Gavião',emoji:'🗡️'},
    pena_falcao:{id:'pena_falcao',name:'Pena de Falcão',emoji:'🪶'},garra_falcao:{id:'garra_falcao',name:'Garra de Falcão',emoji:'🗡️'},
    pena_urutau:{id:'pena_urutau',name:'Pena de Urutau',emoji:'🪶'},olho_urutau:{id:'olho_urutau',name:'Olho de Urutau',emoji:'👁️'},
    pena_aguia:{id:'pena_aguia',name:'Pena de Águia',emoji:'🪶'},garra_aguia:{id:'garra_aguia',name:'Garra de Águia',emoji:'🗡️'},
    coroa_solar:{id:'coroa_solar',name:'Coroa Solar',emoji:'👑'},amuleto_guaraci:{id:'amuleto_guaraci',name:'Amuleto do Guaraci',emoji:'☀️'},
    fragmento_abismo:{id:'fragmento_abismo',name:'Fragmento do Abismo',emoji:'🕳️'},essencia_anhanga:{id:'essencia_anhanga',name:'Essência de Anhangá',emoji:'👹'}
};

const STORY_DROP_TABLE = {
    porco_espinho:{comum:{id:'espinho',chance:70},raro:{id:'espinho_raro',chance:10}},
    jacare:{comum:{id:'pele_jacare',chance:70},raro:{id:'escama_brilhante',chance:10}},
    cervo:{comum:{id:'chifre_cervo',chance:70},raro:{id:'chifre_ancestral',chance:10}},
    onca_parda:{comum:{id:'garra_onca',chance:80},raro:{id:'garra_lendaria',chance:15}},
    saci:{comum:{id:'gorro_saci',chance:100},raro:{id:'amuleto_saci',chance:30}},
    tamandua:{comum:{id:'pelo_tamandua',chance:70},raro:{id:'garra_tamandua',chance:12}},
    anta:{comum:{id:'couro_anta',chance:75},raro:{id:'chifre_anta',chance:12}},
    queixada:{comum:{id:'cera_queixada',chance:70},raro:{id:'presa_queixada',chance:15}},
    sucuri:{comum:{id:'escama_sucuri',chance:80},raro:{id:'pele_sucuri',chance:20}},
    mapinguari:{comum:{id:'pelo_mapinguari',chance:100},raro:{id:'amuleto_mapinguari',chance:40}},
    piranha:{comum:{id:'escama_piranha',chance:70},raro:{id:'dente_piranha',chance:12}},
    lontra:{comum:{id:'pelo_lontra',chance:70},raro:{id:'garra_lontra',chance:12}},
    ariranha:{comum:{id:'pelo_ariranha',chance:75},raro:{id:'dente_ariranha',chance:15}},
    pirarucu:{comum:{id:'escama_pirarucu',chance:80},raro:{id:'lingua_pirarucu',chance:20}},
    iara:{comum:{id:'joia_iara',chance:100},raro:{id:'amuleto_iara',chance:40}},
    cascavel:{comum:{id:'pele_cascavel',chance:70},raro:{id:'chocalho_cascavel',chance:12}},
    coral:{comum:{id:'anel_coral',chance:70},raro:{id:'veneno_coral',chance:12}},
    jararaca:{comum:{id:'pele_jararaca',chance:75},raro:{id:'presa_jararaca',chance:15}},
    tartaruga:{comum:{id:'casco_tartaruga',chance:80},raro:{id:'ovo_tartaruga',chance:20}},
    boitata:{comum:{id:'escama_boitata',chance:100},raro:{id:'amuleto_boitata',chance:40}},
    bode:{comum:{id:'chifre_bode',chance:70},raro:{id:'pelo_bode',chance:12}},
    carneiro:{comum:{id:'la_carneiro',chance:75},raro:{id:'chifre_carneiro',chance:12}},
    cavalo_selvagem:{comum:{id:'crina_cavalo',chance:75},raro:{id:'casco_cavalo',chance:15}},
    touro_bravo:{comum:{id:'chifre_touro',chance:80},raro:{id:'couro_touro',chance:20}},
    mula:{comum:{id:'ferradura_mula',chance:100},raro:{id:'amuleto_mula',chance:40}},
    urubu:{comum:{id:'pena_urubu',chance:70},raro:{id:'bico_urubu',chance:12}},
    carcaara:{comum:{id:'pena_carcara',chance:70},raro:{id:'garra_carcara',chance:15}},
    tatu:{comum:{id:'placa_tatu',chance:75},raro:{id:'garra_tatu',chance:12}},
    lobo_guara:{comum:{id:'pelo_lobo_guara',chance:80},raro:{id:'presa_lobo_guara',chance:20}},
    corpo_seco:{comum:{id:'osso_corpo_seco',chance:100},raro:{id:'amuleto_corpo_seco',chance:40}},
    cachorro_mato:{comum:{id:'pelo_cachorro_mato',chance:70},raro:{id:'presa_cachorro_mato',chance:12}},
    raposa:{comum:{id:'cauda_raposa',chance:70},raro:{id:'pelo_raposa',chance:12}},
    guaxinim:{comum:{id:'mascara_guaxinim',chance:75},raro:{id:'garra_guaxinim',chance:15}},
    jaguatirica:{comum:{id:'pelo_jaguatirica',chance:80},raro:{id:'garra_jaguatirica',chance:20}},
    lobisomem:{comum:{id:'pelo_lobisomem',chance:100},raro:{id:'amuleto_lobisomem',chance:40}},
    morcego:{comum:{id:'asa_morcego',chance:70},raro:{id:'presa_morcego',chance:12}},
    coruja:{comum:{id:'pena_coruja',chance:70},raro:{id:'olho_coruja',chance:15}},
    sapo_cururu:{comum:{id:'pele_sapo',chance:75},raro:{id:'veneno_sapo',chance:12}},
    seriema:{comum:{id:'pena_seriema',chance:80},raro:{id:'bico_seriema',chance:20}},
    cuca:{comum:{id:'caldeirao_cuca',chance:100},raro:{id:'amuleto_cuca',chance:40}},
    tucunare:{comum:{id:'escama_tucunare',chance:70},raro:{id:'dente_tucunare',chance:12}},
    piraiba:{comum:{id:'escama_piraiba',chance:75},raro:{id:'lingua_piraiba',chance:15}},
    dourada:{comum:{id:'escama_dourada',chance:75},raro:{id:'barbatana_dourada',chance:15}},
    peixe_boi:{comum:{id:'couro_peixe_boi',chance:80},raro:{id:'osso_peixe_boi',chance:20}},
    boto:{comum:{id:'flor_boto',chance:100},raro:{id:'amuleto_boto',chance:40}},
    bufalo:{comum:{id:'chifre_bufalo',chance:75},raro:{id:'couro_bufalo',chance:15}},
    vaca_louca:{comum:{id:'sino_vaca',chance:75},raro:{id:'chifre_vaca',chance:15}},
    cabra_preta:{comum:{id:'chifre_cabra',chance:70},raro:{id:'pelo_cabra',chance:12}},
    zebu:{comum:{id:'corcova_zebu',chance:80},raro:{id:'chifre_zebu',chance:20}},
    boi:{comum:{id:'chifre_boi',chance:100},raro:{id:'amuleto_boi',chance:40}},
    gato_mato:{comum:{id:'pelo_gato_mato',chance:75},raro:{id:'garra_gato_mato',chance:15}},
    mariposa_gigante:{comum:{id:'asa_mariposa',chance:75},raro:{id:'po_mariposa',chance:15}},
    quati:{comum:{id:'mascara_quati',chance:75},raro:{id:'cauda_quati',chance:15}},
    sucuarana:{comum:{id:'pelo_sucuarana',chance:80},raro:{id:'garra_sucuarana',chance:20}},
    jaci:{comum:{id:'raio_lunar',chance:100},raro:{id:'amuleto_jaci',chance:40}},
    gaviao:{comum:{id:'pena_gaviao',chance:75},raro:{id:'garra_gaviao',chance:15}},
    falcao:{comum:{id:'pena_falcao',chance:75},raro:{id:'garra_falcao',chance:15}},
    urutau:{comum:{id:'pena_urutau',chance:75},raro:{id:'olho_urutau',chance:15}},
    aguia_cinzenta:{comum:{id:'pena_aguia',chance:80},raro:{id:'garra_aguia',chance:20}},
    guaraci:{comum:{id:'coroa_solar',chance:100},raro:{id:'amuleto_guaraci',chance:40}},
    anhanga:{comum:{id:'fragmento_abismo',chance:100},raro:{id:'essencia_anhanga',chance:100}}
};

function rollStoryDrops(enemyId){
    const drops = [], table = STORY_DROP_TABLE[enemyId];
    if(!table) return drops;
    if(table.comum && Math.random()*100 < table.comum.chance) drops.push({id:table.comum.id,qty:1});
    if(table.raro  && Math.random()*100 < table.raro.chance)  drops.push({id:table.raro.id,qty:1});
    return drops;
}

const STORY_SHOP_ITEMS = [
    {id:'pocao_cura',name:'Poção de Cura',emoji:'🧪',price:15,description:'Recupera 5 HP.'},
    {id:'espinho',name:'Espinho',emoji:'🌵',price:5,description:'Material.'},
    {id:'pele_jacare',name:'Pele de Jacaré',emoji:'🟢',price:5,description:'Material.'},
    {id:'chifre_cervo',name:'Chifre de Cervo',emoji:'🦌',price:5,description:'Material.'},
    {id:'garra_onca',name:'Garra de Onça',emoji:'🐾',price:8,description:'Material.'},
    {id:'couro_anta',name:'Couro de Anta',emoji:'🟫',price:8,description:'Material.'},
    {id:'escama_sucuri',name:'Escama de Sucuri',emoji:'🐍',price:10,description:'Material.'},
    {id:'escama_pirarucu',name:'Escama de Pirarucu',emoji:'🐠',price:12,description:'Material.'},
    {id:'casco_tartaruga',name:'Casco de Tartaruga',emoji:'🛡️',price:14,description:'Material.'},
    {id:'coroa_solar',name:'Coroa Solar',emoji:'👑',price:50,description:'Material raro.'}
];

// =================================================================
// 🏁 FIM DA PARTE 1/5
// =================================================================
// =================================================================
// historia.js — V6.0 — Bloco 2/5
// Diálogos dos bosses + finais + purificação + STORY_ENEMIES (handlers)
// =================================================================

// =================================================================
// 💬 DIÁLOGOS DE ABERTURA — ATO 1 (Saci)
// =================================================================
const STORY_ENEMY_INTROS = {
    porco_espinho: {
        title: 'O Primeiro Servo',
        text: 'Ah, você chegou. Sente o cheiro de terra revirada? Soprei raiva nos espinhos deste pequeno… ele agora fere por MIM. Todo animal desta mata tem um sussurro meu por dentro. Este é o primeiro. Encare-o, se conseguir.'
    },
    jacare: {
        title: 'O Guardião do Vau',
        text: 'O rio era manso — eu o tornei faminto. Sussurrei ao jacaré que o mundo temia suas mandíbulas, e ele acreditou. Agora ele morde primeiro, pergunta depois. Meu bote é o teu fim, herói.'
    },
    cervo: {
        title: 'O Corredor Cego',
        text: 'Este cervo corria livre, sem malícia. Enchi sua cabeça de sombras — agora cada chifre busca carne, não folhas. Ele serve ao vendaval que eu sou. Você o derrota? Ou corre como ele costumava correr?'
    },
    onca_parda: {
        title: 'A Caçadora da Mata',
        text: 'A caçadora mais temida da floresta agora caça por MIM. Meu sussurro a tornou mais faminta do que qualquer fome verdadeira. Ela é o meu presente para você — a prova de que nem os mais fortes escapam do meu sopro.'
    },
    saci: {
        title: 'O Senhor do Redemoinho',
        text: 'Você libertou meus servos um por um… admirável. Mas eles eram só casca. Eu sou o vendaval por trás de cada sussurro, o redemoinho que gira dentro de cada bicho desta mata. E você… você não passa de uma folha. Encare-me.'
    }
};

// =================================================================
// 💬 DIÁLOGOS DE ABERTURA — ATO 2 (Mapinguari)
// =================================================================
const STORY_ENEMY_INTROS_A2 = {
    tamandua: {
        title: 'O Farejador das Raízes',
        text: 'Sinto teu cheiro, herói. Vem de longe. Eu já fui protetor desta mata — agora eu devoro o que ela cria. Sussurrei ao tamanduá que as formigas eram suas inimigas… e ele agora as caça com fúria cega. Passa por ele, se puder. A mata fechada começa aqui.'
    },
    anta: {
        title: 'A Muralha da Mata',
        text: 'A anta era a muralha viva que abria clareiras para a floresta respirar. Corrompi sua força — agora ela atropela em vez de abrir caminho. Sente o peso dela no chão? Esse peso é meu. Ela obedece. Ela devora.'
    },
    queixada: {
        title: 'A Manada Faminta',
        text: 'Sabe por que o queixada anda em bando? Porque sozinho ele é fraco. Sussurrei a ele que só a fúria coletiva o salvaria. Agora ele morde até o que não pode engolir. Cada presa que ele dilacera é oferenda pra mim. Você é a próxima.'
    },
    sucuri: {
        title: 'A Devoradora das Águas',
        text: 'A sucuri sempre foi a boca da mata — engolia o que precisava, respeitava o rio. Mas eu ensinei a ela que engolir era poder. Agora ela prende, quebra e digere tudo o que respira. Ela é a minha sombra sobre a água. Só assim você chegará até MIM.'
    },
    mapinguari: {
        title: 'O Devorador Despertado',
        text: 'Então chegou… o que libertou os fracos da mata dos redemoinhos agora ousa me enfrentar. Eu era o protetor. O pilar. A árvore mais velha. Anhangá me sussurrou: "Você é fraco, a floresta morre e você não pode impedir". E ele tinha razão. Então eu devorei a mim mesmo. Vem, herói — vou devorar-te também.'
    }
};

// =================================================================
// 💬 DIÁLOGOS DE ABERTURA — ATO 3 (Iara)
// =================================================================
const STORY_ENEMY_INTROS_A3 = {
    piranha: {
        title: 'A Primeira Mandíbula',
        text: 'Meus rios eram cristalinos. Agora, cada gota esconde uma boca. Sussurrei à piranha que a carne dos curiosos era doce — e ela acreditou. Toda criança que se aproxima da margem hoje encontra seus dentes. Você já está na água, herói.'
    },
    lontra: {
        title: 'A Brincalhona Afogada',
        text: 'A lontra era a alegria do rio — brincava, mergulhava, ria. Enchi sua cabeça de sombras. Agora ela arrasta incautos para o fundo, como se fosse brincadeira. Ela sorri enquanto afoga. Você vai sorrir também.'
    },
    ariranha: {
        title: 'A Matilha do Fundo',
        text: 'As ariranhas sempre caçaram em bando — mas caçavam pra viver. Sussurrei a elas que a matilha é a única lei. Agora matam por prazer. Seus olhos vermelhos veem você antes mesmo de você chegar. Elas não param até o rio secar.'
    },
    pirarucu: {
        title: 'O Gigante das Águas',
        text: 'O pirarucu era o senhor calmo das águas fundas. Mas eu lhe ensinei que o silêncio é fraqueza. Agora ele devora tudo — peixes, canoas, gente. Ele é meu trono submerso. Só passando por sua bocarra você chegará a MIM.'
    },
    iara: {
        title: 'O Canto da Perdição',
        text: 'Meus rios… tão sujos… tão poluídos… Os humanos riem de mim enquanto destroem meu lar. Anhangá me deu força para afogar todos eles. Venham, dancem em minhas águas! Eu canto o canto que afoga. E você, herói… vai cantar comigo?'
    }
};

// =================================================================
// 💬 DIÁLOGOS DE ABERTURA — ATO 4 (Boitatá)
// =================================================================
const STORY_ENEMY_INTROS_A4 = {
    cascavel: {
        title: 'O Chocalho do Inferno',
        text: 'A cascavel avisava antes de morder — era justa. Enchi sua cabeça com raiva surda. Agora ela ataca sem aviso. O chocalho dela é o som do fim se aproximando. Ouça, herói. É o teu réquiem.'
    },
    coral: {
        title: 'A Mentira Colorida',
        text: 'A coral sempre mentiu com beleza — cores vivas, veneno mortal. Sussurrei a ela que a mentira era sua natureza. Agora ela se enrola nos sonhos dos tolos e mata dormindo. Você dorme, herói? Aqui, todos dormem.'
    },
    jararaca: {
        title: 'A Traiçoeira do Mato',
        text: 'A jararaca era traiçoeira por instinto. Dei a ela propósito. Agora ela não morde por defesa — morde por vontade. Cada passo seu no mato é uma aposta. Você aposta bem, herói?'
    },
    tartaruga: {
        title: 'A Fortaleza Antiga',
        text: 'A tartaruga já viu impérios nascerem e caírem. Ela carrega séculos no casco. Enchi sua mente com fúria ancestral. Agora ela esmaga com o peso da eternidade. Nenhuma arma te salvará de sua paciência.'
    },
    boitata: {
        title: 'A Serpente de Fogo',
        text: 'Meu fogo era fraco… apenas luzes na escuridão. Anhangá me deu o verdadeiro poder do inferno! Agora vou consumir tudo que encontrar em meu caminho! Seu corpo vai virar cinza, herói — e o vento vai espalhar você pela mata.'
    }
};

// =================================================================
// 💬 DIÁLOGOS DE ABERTURA — ATO 5 (Mula sem Cabeça)
// =================================================================
const STORY_ENEMY_INTROS_A5 = {
    bode: {
        title: 'O Corno Amaldiçoado',
        text: 'O bode era o bode expiatório dos homens — levava a culpa de tudo. Sussurrei a ele que era hora de cobrar. Agora cada cornada é um julgamento. Você vai pagar pelos pecados dos outros, herói.'
    },
    carneiro: {
        title: 'A Lã Ensanguentada',
        text: 'O carneiro era manso, seguia o rebanho. Enchi sua cabeça com fúria cega. Agora ele tromba até quebrar — e o rebanho o segue. Ele é o pastor do inferno. Você é a ovelha desgarrada.'
    },
    cavalo_selvagem: {
        title: 'O Corcel Sem Dono',
        text: 'O cavalo selvagem nunca aceitou sela. Apreciei isso. Mas eu o ensinei a odiar quem tenta montá-lo. Agora ele pisa em tudo que se aproxima. Sente o galope, herói? É a tua sentença.'
    },
    touro_bravo: {
        title: 'O Furioso do Curral',
        text: 'O touro era a força bruta da fazenda. Sussurrei a ele que era hora de virar caçador. Agora ele persegue sem trégua. Seu chifre atravessa armaduras. Você tem coragem, herói? Ou vai correr?'
    },
    mula: {
        title: 'O Relincho da Noite',
        text: 'Relincho de dor… este é meu destino? Anhangá me mostrou que minha maldição pode ser minha força. Agora levarei fogo e dor a todos! Cada relincho meu é uma sentença. Sente, herói — a maldição se aproxima.'
    }
};

// =================================================================
// 💬 DIÁLOGOS DE ABERTURA — ATO 6 (Corpo Seco)
// =================================================================
const STORY_ENEMY_INTROS_A6 = {
    urubu: {
        title: 'A Sombra do Céu',
        text: 'O urubu sempre esperou a morte dos outros. Enchi sua paciência com fome ativa. Agora ele não espera — ele provoca. Sente o bater de asas? Ele já te marcou. Você é o próximo banquete.'
    },
    carcaara: {
        title: 'A Lâmina Voadora',
        text: 'O carcará é o predador dos predadores. Sussurrei a ele que os vivos são mais saborosos que os mortos. Agora ele caça em pleno dia. Sua sombra passa rápido — e a morte vem com ela.'
    },
    tatu: {
        title: 'A Armadura Cavadora',
        text: 'O tatu sempre se escondeu sob a terra. Ensinei a ele que o solo é seu trono. Agora ele cava armadilhas que engolem exércitos. Cada passo seu é um passo sobre o abismo. Cuidado, herói.'
    },
    lobo_guara: {
        title: 'O Uivo da Solidão',
        text: 'O lobo-guará uiva sozinho por natureza. Transformei sua solidão em raiva. Agora ele uiva chamando a morte — e ela vem. Você ouve o uivo, herói? Corre. Ele já te viu.'
    },
    corpo_seco: {
        title: 'O Devorador de Almas',
        text: 'Fome… tanta fome… Anhangá me prometeu que se eu devorasse tudo, minha fome seria saciada. Vou devorar suas almas! Cada osso seu vai ser meu troféu. Cada gota de sangue, meu vinho. Vem, herói — alimenta-me.'
    }
};

// =================================================================
// 💬 DIÁLOGOS DE ABERTURA — ATO 7 (Lobisomem)
// =================================================================
const STORY_ENEMY_INTROS_A7 = {
    cachorro_mato: {
        title: 'O Primeiro Uivo',
        text: 'O cachorro-do-mato era apenas um caçador comum. Sussurrei a ele que a lua o observava. Agora ele uiva para ela toda noite, pedindo poder. E ela responde. Você ouve o primeiro uivo, herói? É o começo da matilha.'
    },
    raposa: {
        title: 'A Astuta Sedenta',
        text: 'A raposa sempre foi esperta demais. Enchi sua astúcia com sede de sangue. Agora ela engana antes de matar — te faz rir antes do golpe. Você ri, herói? Aqui, os espertos choram.'
    },
    guaxinim: {
        title: 'O Ladrão da Noite',
        text: 'O guaxinim roubava comida dos acampamentos. Sussurrei a ele que roubar vidas era mais valioso. Agora ele invade sonhos antes de invadir corpos. Você dorme tranquilo, herói? Aqui, não.'
    },
    jaguatirica: {
        title: 'A Caçadora Silenciosa',
        text: 'A jaguatirica é a rainha dos saltos — mata antes do alvo piscar. Enchi seu silêncio com fome. Agora ela salta mais longe, mais alta, mais mortal. Sente o vento? Não é vento. É ela pulando.'
    },
    lobisomem: {
        title: 'A Maldição da Lua',
        text: 'A lua me amaldiçoa… mas Anhangá me mostrou que esta forma bestial é minha verdadeira natureza. Deixem a fera dentro de mim se libertar! Cada uivo meu quebra a noite. Você está pronto, herói? A lua está cheia.'
    }
};

// =================================================================
// 💬 DIÁLOGOS DE ABERTURA — ATO 8 (Cuca)
// =================================================================
const STORY_ENEMY_INTROS_A8 = {
    morcego: {
        title: 'O Filho da Noite',
        text: 'O morcego sempre viveu nas sombras. Sussurrei a ele que a escuridão era um lar, não um esconderijo. Agora ele voa livre, drenando sonhos antes de sangue. Você sonha, herói? Aqui, até os sonhos sangram.'
    },
    coruja: {
        title: 'O Olho da Bruxa',
        text: 'A coruja sempre soube tudo — a sabedoria silenciosa da noite. Envenenei seu conhecimento com vaidade. Agora ela observa só para julgar. E a bruxa vê através dela. Ela já te julgou, herói.'
    },
    sapo_cururu: {
        title: 'A Poção Viva',
        text: 'O sapo-cururu é veneno ambulante. Sussurrei a ele que o veneno é sua coroa. Agora tudo que toca seu lodo, morre. Cuidado com o chão que pisa, herói. O pântano está vivo.'
    },
    seriema: {
        title: 'A Guardiã do Caldeirão',
        text: 'A seriema vigia os campos há séculos. Corrompi seu instinto guardião. Agora ela protege o caldeirão como se fosse um filho. Ninguém passa. Nem você.'
    },
    cuca: {
        title: 'A Bruxa da Floresta',
        text: 'Meus conhecimentos eram fracos… poções de cura? Para quê? Anhangá me ensinou que apenas a destruição traz poder real. Prove minhas novas poções! Cada frasco meu carrega a essência do abismo.'
    }
};

// =================================================================
// 💬 DIÁLOGOS DE ABERTURA — ATO 9 (Boto Rosa)
// =================================================================
const STORY_ENEMY_INTROS_A9 = {
    tucunare: {
        title: 'O Rei do Rio',
        text: 'O tucunaré reina nas águas claras. Sussurrei a ele que seu trono é frágil. Agora ele morde antes que outro peixe respire. Cada mordida é defesa de território. Você é invasor, herói. Ele odeia invasores.'
    },
    piraiba: {
        title: 'O Fantasma das Profundezas',
        text: 'A piraíba é o maior peixe de couro do rio — o fantasma das profundezas. Envenenei sua solidão com fúria. Agora ela emerge do nada e engole barcos. Sente o rio se agitando, herói? Ela está perto.'
    },
    dourada: {
        title: 'O Tesouro Maldito',
        text: 'A dourada brilha como ouro nas águas. Sussurrei a ela que o brilho era poder. Agora ela cega quem a olha, e ataca no reflexo. Você olha o rio, herói? Não olhe demais. Ela já te cegou.'
    },
    peixe_boi: {
        title: 'A Muralha Viva',
        text: 'O peixe-boi é o gigante manso dos rios. Corrompi sua calma. Agora ele esmaga com o peso de um mundo. Sua paciência virou concreto. Você tem força, herói? Vai precisar.'
    },
    boto: {
        title: 'O Sedutor das Águas',
        text: 'As águas eram meu refúgio… minha beleza, minha arma. Anhangá mostrou que posso ser mais que um sedutor. Posso ser um destruidor! Sintam o poder das águas corrompidas! Venham, heróis — dancem no meu encanto final.'
    }
};

// =================================================================
// 💬 DIÁLOGOS DE ABERTURA — ATO 10 (Boi da Cara Preta)
// =================================================================
const STORY_ENEMY_INTROS_A10 = {
    bufalo: {
        title: 'O Titã Negro',
        text: 'O búfalo é a montanha viva dos campos. Sussurrei a ele que o pasto é pequeno demais. Agora ele esmaga cercas, casas, homens. Sente o chão tremer? Não é terremoto, herói. É ele.'
    },
    vaca_louca: {
        title: 'A Lamentação',
        text: 'A vaca louca é a tristeza feita carne. Transformei seu lamento em fúria. Agora cada mugido é um grito de guerra. Você ouve o grito, herói? Ele vem por você.'
    },
    cabra_preta: {
        title: 'A Portadora do Azar',
        text: 'A cabra preta sempre foi vista como mau agouro. Sussurrei a ela que o agouro é poder. Agora cada passo dela envenena a terra. Você anda sobre a morte, herói.'
    },
    zebu: {
        title: 'O Touro de Mil Guerras',
        text: 'O zebu carrega força de impérios. Envenenei sua paciência com arrogância. Agora ele marra sem parar. Cada chifre é uma sentença. Você é rápido, herói? Aqui, os lentos viram couro.'
    },
    boi: {
        title: 'O Terrível das Sombras',
        text: 'Minha face escura sempre assustou… mas era apenas casca. Anhangá me revelou meu verdadeiro poder: o terror puro! Sintam o medo que habita nas sombras! Cada mugido meu é a última coisa que muitos ouvem.'
    }
};

// =================================================================
// 💬 DIÁLOGOS DE ABERTURA — ATO 11 (Jaci)
// =================================================================
const STORY_ENEMY_INTROS_A11 = {
    gato_mato: {
        title: 'O Filho da Mata Fria',
        text: 'O gato-do-mato é silêncio puro. Envenenei seu silêncio com malícia. Agora ele caça entre as sombras — sempre entre as sombras. Sente seu olhar, herói? Ele está a um salto de distância.'
    },
    mariposa_gigante: {
        title: 'A Asa Lunar',
        text: 'A mariposa gigante sempre buscou a lua. Sussurrei a ela que a lua também a buscava. Agora ela voa em noites sem fim, espalhando pó lunar que enlouquece. Você respira o pó, herói? Já é tarde.'
    },
    quati: {
        title: 'O Bando Vermelho',
        text: 'O quati vive em bando, esperto e barulhento. Transformei seu bando em matilha. Agora eles atacam em círculo, fechando o cerco. Você está no centro, herói. Sempre esteve.'
    },
    sucuarana: {
        title: 'A Senhora das Alturas',
        text: 'A suçuarana — a puma — é a rainha silenciosa das montanhas. Corrompi seu silêncio com arrogância divina. Agora ela caminha como se fosse um deus. Cada passo dela marca território. Você invade o dela.'
    },
    jaci: {
        title: 'A Deusa da Lua Corrompida',
        text: 'Minha luz deveria guiar… acalmar… iluminar. Mas Anhangá mostrou que minha luz pode queimar em vez de iluminar. Sintam o frio ardente da lua corrompida! Cada raio meu carrega a solidão de mil sóis apagados.'
    }
};

// =================================================================
// 💬 DIÁLOGOS DE ABERTURA — ATO 12 (Guaraci)
// =================================================================
const STORY_ENEMY_INTROS_A12 = {
    gaviao: {
        title: 'O Caçador do Céu',
        text: 'O gavião reina nos ares. Envenenei sua visão de longo alcance com presunção. Agora ele caça pela glória, não pela fome. Cada voo dele é um desafio ao sol. Você olha pra cima, herói? Boa sorte.'
    },
    falcao: {
        title: 'O Mergulhador Mortal',
        text: 'O falcão é o caçador mais rápido do céu. Sussurrei a ele que a velocidade é um deus. Agora ele mergulha com fé cega — sem pensar, apenas matando. Sente o vento rasgando? Ele já caiu sobre você.'
    },
    urutau: {
        title: 'A Ave Fantasma',
        text: 'O urutau é o mestre do disfarce — parece um tronco, canta como um lamento. Transformei seu disfarce em ilusão real. Agora ele existe e não existe ao mesmo tempo. Você vê, herói? Ele já te confundiu.'
    },
    aguia_cinzenta: {
        title: 'A Águia do Trono',
        text: 'A águia-cinzenta é o símbolo dos reis. Corrompi sua soberania com vaidade eterna. Agora ela considera cada um de vocês seu súdito. Você não se ajoelha, herói? Então ela virá buscar seu tributo.'
    },
    guaraci: {
        title: 'O Sol Devorador',
        text: 'Meu sol aquecia… nutria… dava vida. Anhangá me ensinou que meu verdadeiro poder é queimar, não aquecer. Sintam o inferno solar que agora trago! Cada raio meu destrói em vez de criar. Abençoados são aqueles que não veem meu amanhecer.'
    }
};

// =================================================================
// 💬 DIÁLOGOS DE ABERTURA — ATO 13 (Anhangá)
// =================================================================
const STORY_ENEMY_INTROS_A13 = {
    saci: {
        title: 'O Espectro do Redemoinho',
        text: 'Você o libertou uma vez. Eu o reconsumi. A casca que gira agora é apenas eco do que ele foi. Cada servo que você purificou, eu reassimilei. Você não enfrenta doze bosses, herói. Enfrenta a soma de tudo que já venceu.'
    },
    mapinguari: {
        title: 'O Espectro do Devorador',
        text: 'O Pilar da Mata voltou a ser devorador. Sua força purificada me alimenta agora. Você não pode vencer o que já venceu — porque agora é maior.'
    },
    iara: {
        title: 'O Espectro do Canto',
        text: 'A sedutora canta novamente. Mas agora ela canta para MIM. Cada nota afoga mais fundo. A água que a purificou agora é minha.'
    },
    boitata: {
        title: 'O Espectro do Fogo',
        text: 'A Serpente de Fogo queimou para você uma vez. Agora ela queima para MIM. Sua luz não ilumina mais — apenas destrói.'
    },
    mula: {
        title: 'O Espectro do Relincho',
        text: 'A maldição dela agora é minha. Cada relincho é um chamado do abismo. Você não purificou nada — apenas me deu uma arma a mais.'
    },
    corpo_seco: {
        title: 'O Espectro da Fome',
        text: 'A fome do Corpo Seco era pequena. Eu a tornei infinita. Ele devora almas que você ainda nem conhece.'
    },
    lobisomem: {
        title: 'O Espectro da Lua',
        text: 'A maldição que você quebrou, eu refiz. A lua agora é minha aliada. A fera está solta de novo — e dessa vez, para sempre.'
    },
    cuca: {
        title: 'O Espectro das Poções',
        text: 'As poções dela eram fracas. Eu as tornei veneno puro. Cada frasco carrega a essência do abismo.'
    },
    boto: {
        title: 'O Espectro do Encanto',
        text: 'O encanto dele agora é meu. Cada sorriso esconde uma lâmina. Você cai no feitiço, herói? Todos caem.'
    },
    boi: {
        title: 'O Espectro do Terror',
        text: 'O terror dele era apenas casca. Eu o tornei real. A cara preta agora é a face do abismo.'
    },
    jaci: {
        title: 'O Espectro da Lua Fria',
        text: 'A lua dela agora é minha. Seu brilho é a última coisa que muitos veem. Você olha pra lua, herói? É a minha lua.'
    },
    guaraci: {
        title: 'O Espectro do Sol Negro',
        text: 'O sol dele agora é meu. Amanhecer? Não existe mais. Só a noite eterna que eu trago.'
    },
    anhanga: {
        title: 'O Senhor do Abismo',
        text: 'Por séculos observei a destruição que vocês, mortais, causam. Florestas queimadas, rios poluídos, ar contaminado… A natureza grita por vingança! Eu apenas dei voz ao seu ódio. Aqueles que corrompi eram apenas ferramentas. E agora, com o poder das doze entidades que você "purificou", eu me tornei completo. Venha, herói. Enfrente a soma de todos os seus erros.'
    }
};

// =================================================================
// 💬 DIÁLOGOS FINAIS (após derrotar cada boss)
// =================================================================
const STORY_SACI_FINAL_DIALOG = {
    title: 'A Libertação do Redemoinho',
    text: 'O vendaval cessa… e algo mais profundo se quebra. Não era só a mim que prendiam — era ELE. O Sussurrador. Anhangá. Enquanto eu girava, ele ria por dentro de mim. Manipulava cada servo, cada bicho, cada sussurro que eu pensava ser meu. Obrigado… por me devolver o silêncio. Agora eu sei quem sou. Agora a mata pode respirar de novo.'
};

const STORY_MAPINGUARI_FINAL_DIALOG = {
    title: 'A Libertação do Devorador',
    text: 'Minha fome… para. Minha boca… se fecha. Tudo que engoli, tudo que destruí — Anhangá ria por trás de cada mordida. Ele me disse que a floresta morria por minha fraqueza, e eu acreditei. Eu, o pilar da mata, virei ruína por dentro. Você me devolveu a fome que importa: a de proteger. Obrigado, herói. A mata fechada vai voltar a respirar.'
};

const STORY_IARA_FINAL_DIALOG = {
    title: 'A Libertação das Águas',
    text: 'Minhas águas… voltam a ser claras. Sinto o peso da raiva sumir do meu peito, e as canções que eu cantava pra afogar tornam-se canções de acalanto. Anhangá me envenenou com a dor que era minha — mas a dor não era minha, era dele. Você me devolveu o rio. Obrigada, herói. As águas vão lembrar de você.'
};

const STORY_BOITATA_FINAL_DIALOG = {
    title: 'A Libertação do Fogo',
    text: 'Meu fogo… se acalma. Não mais inferno, não mais consumo. Eu era luz — luz que protegia a mata na noite escura. Anhangá me disse que luz fraca não serve. Mentiu. Você me mostrou que minha luz é suficiente. Obrigado, herói. Volto a ser a serpente que brilha no escuro.'
};

const STORY_MULA_FINAL_DIALOG = {
    title: 'A Libertação da Maldição',
    text: 'Meu relincho… silencia. A dor de mil anos se desfaz em cinzas mansas. Anhangá me disse que era meu castigo por meus pecados, mas era o castigo dele que eu carregava. Você me tirou o fogo dos olhos e devolveu a mim o que eu era antes da maldição. Obrigada, herói. A noite já não é tão escura.'
};

const STORY_CORPO_SECO_FINAL_DIALOG = {
    title: 'A Libertação da Fome',
    text: 'Minha fome… para. Sinto o silêncio da saciedade que nunca tive. Anhangá me prometeu que devorar tudo saciaria meu vazio — mas o vazio era dele, não meu. Você me libertou da fome eterna. Agora posso finalmente descansar. Obrigado, herói. A terra vai me acolher em paz.'
};

const STORY_LOBISOMEM_FINAL_DIALOG = {
    title: 'A Libertação da Lua',
    text: 'A lua… não me amaldiçoa mais. Sinto meu corpo voltar a ser humano, e a fera dentro de mim dorme em paz. Anhangá me prometeu que a fera era minha verdadeira natureza — mentiu. A fera era a dor dele, projetada em mim. Você me devolveu a humanidade. Obrigado, herói. A lua agora é apenas lua.'
};

const STORY_CUCA_FINAL_DIALOG = {
    title: 'A Libertação das Poções',
    text: 'Meu caldeirão… esfria. As poções voltam a ser o que eram: cura, não veneno. Anhangá me ensinou que destruir era poder. Mentiu. Você me devolveu a sabedoria. Obrigada, herói. A bruxa volta a ser guardiã — não destruidora.'
};

const STORY_BOTO_FINAL_DIALOG = {
    title: 'A Libertação do Encanto',
    text: 'Meu canto… volta a ser melodia, não armadilha. Anhangá me disse que o encanto era fraqueza. Mentiu. Você me mostrou que encantar sem destruir é a verdadeira força. Obrigado, herói. As águas doces voltarão a ser lar.'
};

const STORY_BOI_FINAL_DIALOG = {
    title: 'A Libertação do Terror',
    text: 'Minha cara preta… volta a ser apenas um rosto. Não mais o rosto do medo. Anhangá me mostrou o terror como poder — mas era a minha dor que ele mostrava. Você me devolveu o rosto. Obrigado, herói. O pasto vai dormir em paz.'
};

const STORY_JACI_FINAL_DIALOG = {
    title: 'A Libertação da Lua Fria',
    text: 'Minha luz… recupera o calor. Não sou mais a lua que queima — volto a ser a lua que acolhe. Anhangá me envenenou com a solidão dele. Você me devolveu o silêncio da noite. Obrigada, herói. As estrelas vão brilhar de novo.'
};

const STORY_GUARACI_FINAL_DIALOG = {
    title: 'A Libertação do Sol',
    text: 'Meu fogo… aquece de novo em vez de queimar. Sinto o calor voltar a ser bênção, não maldição. Anhangá me ensinou que a arrogância era poder. Mentiu. Você me devolveu a humildade do sol. Obrigado, herói. O amanhecer vai ser doce outra vez.'
};

const STORY_ANHANGA_FINAL_DIALOG = {
    title: 'O Fim do Abismo',
    text: 'O véu de escuridão… se rasga. Não era eu que girava o redemoinho — era o vazio dentro de mim. As doze entidades que você libertou, você libertou de MIM também. Eu as usei, mas elas nunca foram minhas. Você as resgatou duas vezes, herói. A primeira, das minhas garras. A segunda, de si mesmas. A mata, o rio, o céu, o sol — tudo respira de novo. E eu… eu volto ao silêncio de onde nunca deveria ter saído. Obrigado. O equilíbrio retorna.'
};

const STORY_FINAL_DIALOGS = {
    saci: STORY_SACI_FINAL_DIALOG,
    mapinguari: STORY_MAPINGUARI_FINAL_DIALOG,
    iara: STORY_IARA_FINAL_DIALOG,
    boitata: STORY_BOITATA_FINAL_DIALOG,
    mula: STORY_MULA_FINAL_DIALOG,
    corpo_seco: STORY_CORPO_SECO_FINAL_DIALOG,
    lobisomem: STORY_LOBISOMEM_FINAL_DIALOG,
    cuca: STORY_CUCA_FINAL_DIALOG,
    boto: STORY_BOTO_FINAL_DIALOG,
    boi: STORY_BOI_FINAL_DIALOG,
    jaci: STORY_JACI_FINAL_DIALOG,
    guaraci: STORY_GUARACI_FINAL_DIALOG,
    anhanga: STORY_ANHANGA_FINAL_DIALOG
};

// =================================================================
// 📖 MENSAGENS DE PURIFICAÇÃO
// =================================================================
const STORY_PURIFICATION = {
    // Ato 1
    porco_espinho: 'O redemoinho que prendia o porco-espinho se desfaz em fumaça dourada. Ele não está morto — apenas livre. Ele te encara uma última vez, como se agradecesse, antes de correr de volta para a mata.',
    jacare: 'A água escura que envolvia o jacaré recua de volta para o rio. Ele pisca, tonto, e depois desliza manso pela correnteza — o mesmo jacaré de antes do sussurro. Ele está livre.',
    cervo: 'A sombra que cobria a cabeça do cervo se despedaça em luz. Ele sacode os chifres, inala o ar limpo, e parte num salto leve entre as árvores. Você não o matou — devolveu-lhe a liberdade.',
    onca_parda: 'A onça-parda cai de lado, e a raiva em seus olhos se apaga. Ela ergue a cabeça, olha para você — não como inimiga, mas como quem acorda de um pesadelo. Depois, some na mata. A caçadora voltou a ser dela mesma.',
    saci: 'O redemoinho se desfaz lentamente. O Saci cai no chão, tonto. Quando se levanta, seus olhos estão claros pela primeira vez em muito tempo. "O que… o que eu fiz?", ele murmura. Não era ele. Nunca foi ele. Você não o matou — libertou-o do Anhangá.',

    // Ato 2
    tamandua: 'A sombra que cobria o tamanduá se despedaça em luz. Ele para de furar o chão com fúria e ergue o focinho — cheirando o ar puro pela primeira vez em muito tempo. Depois, caminha manso de volta pra mata fechada. Livre.',
    anta: 'O peso sobrenatural que prendia a anta se dissolve. Ela balança a cabeça enorme, respira fundo, e segue em passo firme — não pra atropelar, mas pra abrir caminho como sempre fez. A muralha viva voltou a ser dela mesma.',
    queixada: 'A fúria coletiva que envolvia o queixada se desfaz. Ele para de rilhar os dentes, sacode a juba, e desaparece no mato com um grunhido grave — não de raiva, mas de alívio. A manada respira de novo.',
    sucuri: 'A correnteza escura que aprisionava a sucuri recua. Ela desliza lentamente de volta pra água, sem pressa, sem fome cega. Só uma cobra grande, respeitando o rio como sempre respeitou. Livre.',
    mapinguari: 'O gigante cai de joelhos. A boca que devorava tudo se fecha, e por um instante o silêncio é absoluto — até que ele fala, com uma voz que não se ouvia há muito tempo. Não era ele. Nunca foi. Você devolveu ao Pilar da Mata o direito de proteger.',

    // Ato 3
    piranha: 'O cardume se acalma. As piranhas param de ferver a água e voltam a nadar em paz. A primeira mandíbula que Anhangá corrompeu volta a ser apenas peixe.',
    lontra: 'A lontra para de arrastar para o fundo. Ela pisca, volta a rir, e mergulha brincando como sempre deveria ter feito. A alegria do rio voltou.',
    ariranha: 'A matilha do fundo se desfaz. As ariranhas voltam a caçar apenas por fome, e não por prazer. O vermelho dos olhos se apaga. A água respira de novo.',
    pirarucu: 'O gigante das águas fundas emerge devagar. Ele reconhece você como aliado, e se afasta manso, deixando o caminho livre. O trono submerso de Anhangá desmorona.',
    iara: 'As águas se acalmam. Iara ergue-se da correnteza, o cabelo molhado, o olhar sereno. Ela olha para você — não com raiva, mas com gratidão silenciosa. O canto dela volta a ser acalanto. Obrigada, herói.',

    // Ato 4
    cascavel: 'O chocalho silencia. A cascavel se enrola devagar, e o aviso volta a ser justo — não mais surdo. A serpente se afasta para as pedras. Ela era justa antes, e volta a ser.',
    coral: 'As cores da coral ficam vivas de novo, mas sem veneno — só beleza. Ela se enrola calma e dorme. A mentira colorida volta a ser apenas verdade disfarçada.',
    jararaca: 'A jararaca pisca devagar. A traição de Anhangá sai dos olhos dela, e ela volta a ser apenas o bicho do mato. Traiçoeira por instinto, não por maldade.',
    tartaruga: 'O casco antigo respira fundo. A tartaruga solta um suspiro de séculos, e o peso da fúria ancestral some. Ela te olha com gratidão de milênios, e caminha devagar para as sombras.',
    boitata: 'O fogo volta a brilhar manso. A serpente de luz se enrola no ar, e a floresta respira. Ela volta a iluminar em vez de queimar. A luz da noite voltou.',

    // Ato 5
    bode: 'O bode sacode os chifres. O peso de carregar culpa some, e ele volta a pastar tranquilo. O bode expiatório virou apenas bode.',
    carneiro: 'A lã para de brilhar vermelho. O carneiro tromba uma última vez no vazio, e depois se acalma. Ele segue o rebanho por escolha, não por maldição.',
    cavalo_selvagem: 'O galope cessa. O cavalo baixa a cabeça, respira fundo, e volta a correr livre pelos campos — sem ódio, só velocidade. O corcel sem dono voltou a ser livre de verdade.',
    touro_bravo: 'O touro baixa os chifres e, por um instante, parece refletir. Depois ele se afasta em passo firme, em direção à pastagem. O furioso do curral voltou a ser só touro.',
    mula: 'O fogo do relincho se apaga em faíscas mansas. A Mula sem Cabeça desaparece, e no lugar dela, por um instante, você vê uma mulher livre — que te agradece em silêncio antes de partir. A maldição foi quebrada.',

    // Ato 6
    urubu: 'A sombra do céu pousa no chão, e o urubu volta a ser apenas pássaro. A paciência dele volta a ser paciência — não fome ativa. A morte espera de novo, sem pressa.',
    carcaara: 'O carcará pousa manso. O dia volta a ser apenas dia, e não caçada. Ele olha o horizonte e voa para longe. A lâmina voadora guardou a lâmina.',
    tatu: 'A terra se fecha sob o tatu. Ele emerge devagar, tonto, e volta a cavar apenas tocas — não armadilhas. A armadura cavadora voltou a ser só bicho.',
    lobo_guara: 'O uivo silencia. O lobo-guará fica parado, olhando a lua por um instante. Depois ele uiva uma última vez — agora um uivo de paz — e desaparece no cerrado.',
    corpo_seco: 'A fome cessa. Os ossos do Corpo Seco se desfazem devagar em pó dourado, e no lugar deles resta apenas o silêncio de uma alma que finalmente encontra descanso. A terra o acolhe.',

    // Ato 7
    cachorro_mato: 'O cachorro-do-mato para de uivar. Ele te olha, abana a cauda, e some entre as árvores. O primeiro uivo se desfaz na noite. A matilha respira.',
    raposa: 'A raposa para de sorrir com malícia. Ela te encara, astuta mas calma, e some na mata com um salto elegante. A astúcia voltou a ser qualidade, não arma.',
    guaxinim: 'A máscara escura sai dos olhos do guaxinim. Ele pisca, sacode a cabeça, e foge pra toca. Os sonhos voltam a ser só sonhos. Ninguém mais sangra dormindo.',
    jaguatirica: 'A jaguatirica pousa no chão e fica imóvel por um instante. Depois ela ergue a cabeça, te olha sem fúria, e salta para longe — para a mata dela. A caçadora voltou a caçar por fome.',
    lobisomem: 'A lua prateia o corpo dele enquanto ele se ergue numa forma humana esquecida. Cai de joelhos, exausto, e a maldição se desfaz como orvalho ao amanhecer. Ele ergue os olhos pra você — e agradece.',

    // Ato 8
    morcego: 'O morcego pousa manso. A escuridão volta a ser só escuridão. Os sonhos param de sangrar. O filho da noite voltou a ser apenas noite.',
    coruja: 'A coruja pisca devagar, e a sabedoria volta a ser sabedoria. Sem vaidade, sem julgamento. Ela te observa por um instante e voa. A bruxa perdeu os olhos dela.',
    sapo_cururu: 'O lodo do sapo-cururu perde o veneno. Ele pula pra longe, voltando a ser só bicho do pântano. O chão respira de novo. A poção viva voltou a ser só vida.',
    seriema: 'A seriema para de proteger o caldeirão. Ela olha o céu, dá um grito de liberdade, e corre pra longe. A guardiã voltou a ser apenas ave.',
    cuca: 'O caldeirão se parte em mil pedaços, e as poções que derrama se transformam em ervas curativas sobre o solo. A velha bruxa desmorona em folhas secas, liberta de sua própria corrupção. Ela te olha por um instante — grata — antes de desaparecer.',

    // Ato 9
    tucunare: 'O tucunaré para de morder. Ele nada calmo, redesenhando o próprio território com paciência. O rei do rio voltou a reinar em paz.',
    piraiba: 'A piraíba emerge devagar e fica imóvel por um instante — como se te visse pela primeira vez como aliado. Depois ela mergulha, e o rio se acalma. O fantasma das profundezas voltou às sombras.',
    dourada: 'O brilho dourado para de cegar. A dourada nada manso, apenas bela. O tesouro voltou a ser apenas peixe.',
    peixe_boi: 'O peixe-boi solta um suspiro grave. Ele te olha com gratidão e se afasta lentamente, devolvendo o rio ao seu curso. A muralha viva voltou a ser bênção.',
    boto: 'Ele se despede com um sorriso triste e mergulha no rio. Quando ressurge, não é mais um sedutor, mas um guardião silencioso das águas — a beleza que sempre deveria ter sido sua. As águas doces voltaram a ser lar.',

    // Ato 10
    bufalo: 'O titã negro baixa a cabeça. O chão para de tremer. Ele se afasta em passo firme, voltando a ser só búfalo — e não montanha viva.',
    vaca_louca: 'O mugido vira apenas mugido. A vaca para no meio do pasto, olha o céu, e pasta mansamente. A lamentação virou silêncio.',
    cabra_preta: 'O agouro se desfaz. A cabra preta balança a cabeça, e o chão volta a ser apenas terra. O azar voltou a ser superstição.',
    zebu: 'O zebu finalmente para de marrar. Ele respira fundo, te encara com respeito, e se afasta lentamente. A paciência voltou a ser paciência.',
    boi: 'A face escura se dilui em névoa, revelando olhos serenos que finalmente encontram paz. Ele retorna à terra, devolvido ao seu papel de protetor das noites. O terror foi só casca.',

    // Ato 11
    gato_mato: 'O gato-do-mato para de te espreitar. Ele pisca, sem pressa, e desaparece nas sombras — mas agora são apenas sombras. A mata fria respira.',
    mariposa_gigante: 'A mariposa para de voar em círculos. Ela pousa numa pedra, e o pó lunar deixa de enlouquecer — volta a ser só pó. A lua voltou a ser apenas luz.',
    quati: 'O bando para de fechar o cerco. Os quatis se dispersam, voltando a ser apenas bando. Você pode sair do centro. Você sempre pôde.',
    sucuarana: 'A senhora das alturas para no meio do caminho. Ela te olha sem desafio, e retoma o passo em direção às montanhas — sem pressa, sem soberba. Ela voltou a ser a puma.',
    jaci: 'Seu brilho frio recupera o calor perdido. Ela sobe lentamente ao céu, iluminando novamente o mundo com a luz que sempre deveria ter sido sua — acalanto, não queimadura. A noite voltou a ser doce.',

    // Ato 12
    gaviao: 'O gavião pousa numa pedra alta. A presunção sai dos olhos dele. Ele bate as asas e voa pro horizonte — caçando pela fome, não pela glória. O céu voltou a ser só céu.',
    falcao: 'O falcão freia no meio do ar. Ele paira por um instante, te olha, e depois voa calmo. A velocidade voltou a ser ferramenta, não deus.',
    urutau: 'A ilusão se desfaz. O urutau volta a existir de verdade — pássaro, não fantasma. Ele canta uma última vez, e agora o canto é só canto.',
    aguia_cinzenta: 'A águia pousa no chão, num gesto de humildade. Ela dobra as asas e te cumprimenta com a cabeça. A soberania voltou a ser símbolo, não tirania.',
    guaraci: 'As chamas que o consumiam se rendem ao amanhecer. Ele retorna ao horizonte como o sol gentil que sempre foi, purificado da arrogância que o cegou. O sol voltou a aquecer.',

    // Ato 13
    saci: 'A casca espectral se desfaz. O verdadeiro Saci, em paz, aparece por um instante antes de desaparecer. Ele te agradece com os olhos. O eco voltou ao silêncio.',
    mapinguari: 'O espectro do Pilar se desfaz em folhas verdes que caem sobre você como bênção. A mata reconhece seu libertador.',
    iara: 'O espectro mergulha e se dissolve em água limpa. As águas doces fluem de novo. A canção voltou a acalantar.',
    boitata: 'O espectro se transforma em luz mansa. A serpente de fogo desaparece, deixando apenas o brilho da proteção antiga. A floresta respira.',
    mula: 'O espectro relincha uma última vez — mas agora é de alívio. Ele se desfaz, e a mulher livre que você libertou antes aparece brevemente para agradecer.',
    corpo_seco: 'O espectro se dissolve em pó claro. A alma que finalmente descansou retorna para acenar. A fome terminou de verdade.',
    lobisomem: 'O espectro volta à forma humana que você libertou. Ele te encara com gratidão e desaparece na luz da lua. A maldição foi quebrada para sempre.',
    cuca: 'O espectro se desfaz em folhas. A bruxa velha, em paz, te cumprimenta. O caldeirão nunca mais ferverá ódio.',
    boto: 'O espectro do sedutor se despede com um sorriso gentil. Ele mergulha e some. As águas voltaram a ser só águas.',
    boi: 'O espectro da cara preta se desfaz em névoa mansa. Os olhos serenos que você libertou aparecem por um instante e agradecem.',
    jaci: 'O espectro da lua corrompida se dissolve em luz prateada pura. A deusa, em paz, sobe ao céu pela última vez. O céu voltou a ser dela.',
    guaraci: 'O espectro do sol devorador se desfaz no amanhecer verdadeiro. Guaraci, em paz, volta ao horizonte. O dia voltou a ser doce.',
    anhanga: 'O Senhor do Abismo se dissolve em névoa. As doze entidades, agora plenamente livres, brilham por um instante ao redor de você antes de voltarem aos seus postos. A mata, o rio, o céu, o sol — tudo respira. O equilíbrio retorna. Você venceu.'
};

// =================================================================
// 👹 STORY_ENEMIES — Animais + bosses com HANDLERS únicos
// -----------------------------------------------------------------
// Cada skill aponta pra um 'handler' em STORY_ANIMAL_SKILLS.
// Os handlers são definidos nos Blocos 7B (Atos 1-7) e 7C (Atos 8-13).
// =================================================================
const STORY_ENEMIES = {
    // ---- ATO 1 ----
    porco_espinho: {id:'porco_espinho',name:'Porco-Espinho',hp:10,atk:2,
        skill1:{name:'Espinhos Erguidos',handler:'porco_espinho_espinhos'},
        skill2:{name:'Bote Rolante',handler:'porco_espinho_bote'}},
    jacare: {id:'jacare',name:'Jacaré',hp:12,atk:2,
        skill1:{name:'Bocada',handler:'jacare_bocada'},
        skill2:{name:'Giro de Cauda',handler:'jacare_giro'}},
    cervo: {id:'cervo',name:'Cervo',hp:12,atk:2,
        skill1:{name:'Investida',handler:'cervo_investida'},
        skill2:{name:'Chifrada',handler:'cervo_chifrada'}},
    onca_parda: {id:'onca_parda',name:'Onça-Parda',hp:20,atk:3,
        skill1:{name:'Garra Dupla',handler:'onca_garra_dupla'},
        skill2:{name:'Salto Mortal',handler:'onca_salto'}},
    saci: {id:'saci',name:'Saci',hp:30,atk:4,isBoss:true,
        skill1:{name:'Vórtices de Vento',handler:'saci_vortices'},
        skill2:{name:'Vórtices Diagonais',handler:'saci_diagonais'}},

    // ---- ATO 2 ----
    tamandua: {id:'tamandua',name:'Tamanduá-Bandeira',hp:14,atk:2,
        skill1:{name:'Garras Longas',handler:'tamandua_garras'},
        skill2:{name:'Bicada Perfurante',handler:'tamandua_bicada'}},
    anta: {id:'anta',name:'Anta',hp:20,atk:3,
        skill1:{name:'Pisada Pesada',handler:'anta_pisada'},
        skill2:{name:'Atropelamento',handler:'anta_atropelamento'}},
    queixada: {id:'queixada',name:'Queixada',hp:18,atk:3,
        skill1:{name:'Mordida em Linha',handler:'queixada_mordida'},
        skill2:{name:'Estouro de Manada',handler:'queixada_estouro'}},
    sucuri: {id:'sucuri',name:'Sucuri Gigante',hp:28,atk:3,isMiniBoss:true,
        skill1:{name:'Bocarra',handler:'sucuri_bocarra'},
        skill2:{name:'Caudada',handler:'sucuri_caudada'}},
    mapinguari: {id:'mapinguari',name:'Mapinguari',hp:40,atk:4,isBoss:true,
        skill1:{name:'Mordida Poderosa',handler:'mapinguari_mordida'},
        skill2:{name:'Pedras Rolantes',handler:'mapinguari_pedras'}},

    // ---- ATO 3 ----
    piranha: {id:'piranha',name:'Piranha',hp:12,atk:2,
        skill1:{name:'Cardume',handler:'piranha_cardume'},
        skill2:{name:'Frenesi',handler:'piranha_frenesi'}},
    lontra: {id:'lontra',name:'Lontra',hp:16,atk:2,
        skill1:{name:'Garras Aquáticas',handler:'lontra_garras'},
        skill2:{name:'Nado Veloz',handler:'lontra_nado'}},
    ariranha: {id:'ariranha',name:'Ariranha',hp:18,atk:3,
        skill1:{name:'Matilha Aquática',handler:'ariranha_matilha'},
        skill2:{name:'Bote do Rio',handler:'ariranha_bote'}},
    pirarucu: {id:'pirarucu',name:'Pirarucu',hp:26,atk:3,isMiniBoss:true,
        skill1:{name:'Bocarra',handler:'pirarucu_bocarra'},
        skill2:{name:'Caudada',handler:'pirarucu_caudada'}},
    iara: {id:'iara',name:'Iara',hp:40,atk:4,isBoss:true,
        skill1:{name:'Tsunami',handler:'iara_tsunami'},
        skill2:{name:'Jatos d\'Água',handler:'iara_jatos'}},

    // ---- ATO 4 ----
    cascavel: {id:'cascavel',name:'Cascavel',hp:14,atk:2,
        skill1:{name:'Chocalho Ameaçador',handler:'cascavel_chocalho'},
        skill2:{name:'Bote Peçonhento',handler:'cascavel_bote'}},
    coral: {id:'coral',name:'Cobra-Coral',hp:14,atk:2,
        skill1:{name:'Anéis Coloridos',handler:'coral_aneis'},
        skill2:{name:'Peçonha',handler:'coral_peconha'}},
    jararaca: {id:'jararaca',name:'Jararaca',hp:18,atk:3,
        skill1:{name:'Bote Traiçoeiro',handler:'jararaca_bote'},
        skill2:{name:'Enrolar',handler:'jararaca_enrolar'}},
    tartaruga: {id:'tartaruga',name:'Tartaruga-da-Amazônia',hp:28,atk:3,isMiniBoss:true,
        skill1:{name:'Casco Duro',handler:'tartaruga_casco'},
        skill2:{name:'Pancada Pesada',handler:'tartaruga_pancada'}},
    boitata: {id:'boitata',name:'Boitatá',hp:42,atk:4,isBoss:true,
        skill1:{name:'Colunas de Fogo',handler:'boitata_colunas'},
        skill2:{name:'Explosões de Fogo',handler:'boitata_explosoes'}},

    // ---- ATO 5 ----
    bode: {id:'bode',name:'Bode',hp:16,atk:2,
        skill1:{name:'Cornada',handler:'bode_cornada'},
        skill2:{name:'Marrada',handler:'bode_marrada'}},
    carneiro: {id:'carneiro',name:'Carneiro Selvagem',hp:18,atk:2,
        skill1:{name:'Trombada',handler:'carneiro_trombada'},
        skill2:{name:'Pisada',handler:'carneiro_pisada'}},
    cavalo_selvagem: {id:'cavalo_selvagem',name:'Cavalo Selvagem',hp:20,atk:3,
        skill1:{name:'Coice',handler:'cavalo_coice'},
        skill2:{name:'Relincho Furioso',handler:'cavalo_relincho'}},
    touro_bravo: {id:'touro_bravo',name:'Touro Bravo',hp:30,atk:3,isMiniBoss:true,
        skill1:{name:'Cornada Violenta',handler:'touro_cornada'},
        skill2:{name:'Pisoteada',handler:'touro_pisoteada'}},
    mula: {id:'mula',name:'Mula sem Cabeça',hp:42,atk:4,isBoss:true,
        skill1:{name:'Relincho Flamejante',handler:'mula_relincho'},
        skill2:{name:'Bolas de Fogo',handler:'mula_bolas'}},

    // ---- ATO 6 ----
    urubu: {id:'urubu',name:'Urubu',hp:14,atk:2,
        skill1:{name:'Voo Rasante',handler:'urubu_voo'},
        skill2:{name:'Bicada',handler:'urubu_bicada',dmg:1}},
    carcaara: {id:'carcaara',name:'Carcará',hp:16,atk:3,
        skill1:{name:'Garras Afiadas',handler:'carcara_garras'},
        skill2:{name:'Mergulho Mortal',handler:'carcara_mergulho'}},
    tatu: {id:'tatu',name:'Tatu',hp:18,atk:2,
        skill1:{name:'Casco Duro',handler:'tatu_casco'},
        skill2:{name:'Cavar Armadilha',handler:'tatu_cavar'}},
    lobo_guara: {id:'lobo_guara',name:'Lobo-Guará',hp:28,atk:3,isMiniBoss:true,
        skill1:{name:'Uivo',handler:'lobo_guara_uivo'},
        skill2:{name:'Bote Selvagem',handler:'lobo_guara_bote'}},
    corpo_seco: {id:'corpo_seco',name:'Corpo Seco',hp:44,atk:4,isBoss:true,
        skill1:{name:'Vapor Podre',handler:'corpo_seco_vapor'},
        skill2:{name:'Garras Rotas',handler:'corpo_seco_garras'}},

    // ---- ATO 7 ----
    cachorro_mato: {id:'cachorro_mato',name:'Cachorro-do-Mato',hp:16,atk:2,
        skill1:{name:'Mordida',handler:'cachorro_mordida'},
        skill2:{name:'Rosnado Feroz',handler:'cachorro_rosnado'}},
    raposa: {id:'raposa',name:'Raposa',hp:16,atk:2,
        skill1:{name:'Astúcia',handler:'raposa_astucia'},
        skill2:{name:'Bote Ágil',handler:'raposa_bote'}},
    guaxinim: {id:'guaxinim',name:'Guaxinim',hp:18,atk:3,
        skill1:{name:'Garras Noturnas',handler:'guaxinim_garras'},
        skill2:{name:'Ataque Surpresa',handler:'guaxinim_surpresa'}},
    jaguatirica: {id:'jaguatirica',name:'Jaguatirica',hp:30,atk:3,isMiniBoss:true,
        skill1:{name:'Garras Selvagens',handler:'jaguatirica_garras'},
        skill2:{name:'Salto Mortal',handler:'jaguatirica_salto'}},
    lobisomem: {id:'lobisomem',name:'Lobisomem',hp:46,atk:4,isBoss:true,
        skill1:{name:'Garras da Fera',handler:'lobisomem_garras'},
        skill2:{name:'Tremor Lunar',handler:'lobisomem_tremor'}},

    // ---- ATO 8 ----
    morcego: {id:'morcego',name:'Morcego',hp:14,atk:2,
        skill1:{name:'Voo Sombrio',handler:'morcego_voo'},
        skill2:{name:'Eco',handler:'morcego_eco'}},
    coruja: {id:'coruja',name:'Coruja',hp:16,atk:3,
        skill1:{name:'Garras Noturnas',handler:'coruja_garras'},
        skill2:{name:'Voo Silencioso',handler:'coruja_voo'}},
    sapo_cururu: {id:'sapo_cururu',name:'Sapo-Cururu',hp:18,atk:2,
        skill1:{name:'Veneno Espirrante',handler:'sapo_veneno'},
        skill2:{name:'Língua Pegajosa',handler:'sapo_lingua'}},
    seriema: {id:'seriema',name:'Seriema',hp:28,atk:3,isMiniBoss:true,
        skill1:{name:'Bicada Feroz',handler:'seriema_bicada'},
        skill2:{name:'Grito de Guerra',handler:'seriema_grito'}},
    cuca: {id:'cuca',name:'Cuca',hp:46,atk:5,isBoss:true,
        skill1:{name:'Poção Corrompida',handler:'cuca_pocao'},
        skill2:{name:'Poção Curativa',handler:'cuca_cura'}},

    // ---- ATO 9 ----
    tucunare: {id:'tucunare',name:'Tucunaré',hp:16,atk:2,
        skill1:{name:'Bote Aquático',handler:'tucunare_bote'},
        skill2:{name:'Cardume Aquático',handler:'tucunare_cardume'}},
    piraiba: {id:'piraiba',name:'Piraíba',hp:20,atk:3,
        skill1:{name:'Bocarra',handler:'piraiba_bocarra'},
        skill2:{name:'Caudada',handler:'piraiba_caudada'}},
    dourada: {id:'dourada',name:'Dourada',hp:20,atk:3,
        skill1:{name:'Escamas Douradas',handler:'dourada_escamas'},
        skill2:{name:'Nado Rápido',handler:'dourada_nado'}},
    peixe_boi: {id:'peixe_boi',name:'Peixe-Boi',hp:32,atk:3,isMiniBoss:true,
        skill1:{name:'Corpulência',handler:'peixe_boi_corpulencia'},
        skill2:{name:'Pancada na Água',handler:'peixe_boi_pancada'}},
    boto: {id:'boto',name:'Boto Rosa',hp:48,atk:5,isBoss:true,
        skill1:{name:'Corações Partidos',handler:'boto_coracoes'},
        skill2:{name:'Jatos em Cruz',handler:'boto_jatos'}},

    // ---- ATO 10 ----
    bufalo: {id:'bufalo',name:'Búfalo Selvagem',hp:20,atk:3,
        skill1:{name:'Marrada Selvagem',handler:'bufalo_marrada'},
        skill2:{name:'Pisoteada',handler:'bufalo_pisoteada'}},
    vaca_louca: {id:'vaca_louca',name:'Vaca Louca',hp:18,atk:3,
        skill1:{name:'Coice',handler:'vaca_coice'},
        skill2:{name:'Mugido de Fúria',handler:'vaca_mugido'}},
    cabra_preta: {id:'cabra_preta',name:'Cabra Preta',hp:16,atk:2,
        skill1:{name:'Cornada',handler:'cabra_cornada'},
        skill2:{name:'Bote Agourento',handler:'cabra_bote'}},
    zebu: {id:'zebu',name:'Zebu',hp:32,atk:4,isMiniBoss:true,
        skill1:{name:'Marrada Bruta',handler:'zebu_marrada'},
        skill2:{name:'Pisada Pesada',handler:'zebu_pisada'}},
    boi: {id:'boi',name:'Boi da Cara Preta',hp:50,atk:5,isBoss:true,
        skill1:{name:'Face Assustadora',handler:'boi_face'},
        skill2:{name:'Empurrão para as Bordas',handler:'boi_empurrao'}},

    // ---- ATO 11 ----
    gato_mato: {id:'gato_mato',name:'Gato-do-Mato',hp:18,atk:3,
        skill1:{name:'Garras Noturnas',handler:'gato_mato_garras'},
        skill2:{name:'Salto Silencioso',handler:'gato_mato_salto'}},
    mariposa_gigante: {id:'mariposa_gigante',name:'Mariposa Gigante',hp:16,atk:2,
        skill1:{name:'Pó Lunar',handler:'mariposa_po'},
        skill2:{name:'Voo Rasante',handler:'mariposa_voo'}},
    quati: {id:'quati',name:'Quati',hp:18,atk:3,
        skill1:{name:'Garras Afiadas',handler:'quati_garras'},
        skill2:{name:'Bote Rápido',handler:'quati_bote'}},
    sucuarana: {id:'sucuarana',name:'Suçuarana',hp:32,atk:4,isMiniBoss:true,
        skill1:{name:'Garra Fatal',handler:'sucuarana_garra'},
        skill2:{name:'Salto Mortal',handler:'sucuarana_salto'}},
    jaci: {id:'jaci',name:'Jaci',hp:50,atk:5,isBoss:true,
        skill1:{name:'Lua de Prata',handler:'jaci_lua'},
        skill2:{name:'Tempestade Lunar',handler:'jaci_tempestade'}},

    // ---- ATO 12 ----
    gaviao: {id:'gaviao',name:'Gavião',hp:18,atk:3,
        skill1:{name:'Voo Rasante',handler:'gaviao_voo'},
        skill2:{name:'Garras Cortantes',handler:'gaviao_garras'}},
    falcao: {id:'falcao',name:'Falcão',hp:20,atk:3,
        skill1:{name:'Mergulho Mortal',handler:'falcao_mergulho'},
        skill2:{name:'Garras do Vento',handler:'falcao_garras'}},
    urutau: {id:'urutau',name:'Urutau',hp:18,atk:3,
        skill1:{name:'Canto Sombrio',handler:'urutau_canto'},
        skill2:{name:'Voo Fantasma',handler:'urutau_voo'}},
    aguia_cinzenta: {id:'aguia_cinzenta',name:'Águia-Cinzenta',hp:34,atk:4,isMiniBoss:true,
        skill1:{name:'Garras Reais',handler:'aguia_garras'},
        skill2:{name:'Mergulho Solar',handler:'aguia_mergulho'}},
    guaraci: {id:'guaraci',name:'Guaraci',hp:52,atk:5,isBoss:true,
        skill1:{name:'Sol Devorador',handler:'guaraci_sol'},
        skill2:{name:'Onda de Calor',handler:'guaraci_onda'}},

    // ---- ATO 13 — Espectros ----
    espectro_saci: {id:'espectro_saci',name:'Espectro do Saci',hp:10,atk:2,isSpectral:true,
        skill1:{name:'Vórtices Etéreos',handler:'saci_vortices'},
        skill2:{name:'Vórtices Diagonais',handler:'saci_diagonais'}},
    espectro_mapinguari: {id:'espectro_mapinguari',name:'Espectro do Mapinguari',hp:10,atk:2,isSpectral:true,
        skill1:{name:'Mordida Espectral',handler:'mapinguari_mordida'},
        skill2:{name:'Pedras Etéreas',handler:'mapinguari_pedras'}},
    espectro_iara: {id:'espectro_iara',name:'Espectro da Iara',hp:10,atk:2,isSpectral:true,
        skill1:{name:'Tsunami Espectral',handler:'iara_tsunami'},
        skill2:{name:'Jatos Fantasmais',handler:'iara_jatos'}},
    espectro_boitata: {id:'espectro_boitata',name:'Espectro do Boitatá',hp:10,atk:2,isSpectral:true,
        skill1:{name:'Colunas Etéreas',handler:'boitata_colunas'},
        skill2:{name:'Explosões Fantasmais',handler:'boitata_explosoes'}},
    espectro_mula: {id:'espectro_mula',name:'Espectro da Mula sem Cabeça',hp:10,atk:2,isSpectral:true,
        skill1:{name:'Relincho Espectral',handler:'mula_relincho'},
        skill2:{name:'Bolas Fantasmais',handler:'mula_bolas'}},
    espectro_corposeco: {id:'espectro_corposeco',name:'Espectro do Corpo Seco',hp:10,atk:2,isSpectral:true,
        skill1:{name:'Vapor Etéreo',handler:'corpo_seco_vapor'},
        skill2:{name:'Garras Espectrais',handler:'corpo_seco_garras'}},
    espectro_lobisomem: {id:'espectro_lobisomem',name:'Espectro do Lobisomem',hp:10,atk:2,isSpectral:true,
        skill1:{name:'Garras Fantasmais',handler:'lobisomem_garras'},
        skill2:{name:'Tremor Espectral',handler:'lobisomem_tremor'}},
    espectro_cuca: {id:'espectro_cuca',name:'Espectro da Cuca',hp:10,atk:2,isSpectral:true,
        skill1:{name:'Poção Etérea',handler:'cuca_pocao'},
        skill2:{name:'Poção Fantasmal',handler:'cuca_cura'}},
    espectro_boto: {id:'espectro_boto',name:'Espectro do Boto Rosa',hp:10,atk:2,isSpectral:true,
        skill1:{name:'Corações Etéreos',handler:'boto_coracoes'},
        skill2:{name:'Jatos Fantasmais',handler:'boto_jatos'}},
    espectro_boi: {id:'espectro_boi',name:'Espectro do Boi da Cara Preta',hp:10,atk:2,isSpectral:true,
        skill1:{name:'Face Etérea',handler:'boi_face'},
        skill2:{name:'Empurrão Espectral',handler:'boi_empurrao'}},
    espectro_jaci: {id:'espectro_jaci',name:'Espectro da Jaci',hp:10,atk:2,isSpectral:true,
        skill1:{name:'Lua Etérea',handler:'jaci_lua'},
        skill2:{name:'Tempestade Fantasmal',handler:'jaci_tempestade'}},
    espectro_guaraci: {id:'espectro_guaraci',name:'Espectro do Guaraci',hp:10,atk:2,isSpectral:true,
        skill1:{name:'Sol Etéreo',handler:'guaraci_sol'},
        skill2:{name:'Onda Fantasmal',handler:'guaraci_onda'}},

    // ---- ATO 13 — FINAL ----
    anhanga: {id:'anhanga',name:'Anhangá',hp:60,atk:6,isBoss:true,isFinalBoss:true,
        skill1:{name:'Fogo Intercalado',handler:'anhanga_fogo'},
        skill2:{name:'Devorar Natureza',handler:'anhanga_devora'}}
};

// =================================================================
// 🏁 FIM DA PARTE 2/5
// =================================================================
// =================================================================
// historia.js — V6.0 — Bloco 3/5
// Sistema fxSprite() + 27 efeitos CSS + 12 helpers de FX
// =================================================================
//
// 📖 COMO FUNCIONA O SISTEMA DE FX
// -----------------------------------------------------------------
// Cada efeito tem um slot em STORY_FX_SPRITES.
//   • Se o slot estiver VAZIO → usa CSS puro (formas animadas)
//   • Se o slot tiver uma URL → usa o SPRITE (GIF/PNG) automaticamente
//
// Pra trocar CSS por sprite, basta preencher:
//   STORY_FX_SPRITES['spike_burst'] = 'https://i.imgur.com/xxxx.gif';
//
// Nenhum handler de skill precisa mudar — o sistema troca sozinho.
// =================================================================

// =================================================================
// 🎨 SLOTS DE SPRITES (preencha com URLs quando tiver os sprites)
// =================================================================
const STORY_FX_SPRITES = {
    spike_burst:      'https://i.imgur.com/rEKf5aV.png',
    spike_roll:       '',
    jaw_snap:         '',
    tail_whip:        '',
    antler_charge:    '',
    hoof_stomp:       '',
    pounce_arc:       '',
    claw_slash:       '',
    fang_bite:        '',
    wing_gust:        'https://i.imgur.com/UAoEfoT.png',
    peck_beak:        '',
    coil_wrap:        '',
    sting_venom:      '',
    splash_wave:      '',
    fin_slash:        '',
    tentacle_glow:    '',
    ground_crack:     '',
    shockwave:        '',
    fog_cloud:        '',
    swarm_cloud:      '',
    spectral_veil:    '',
    push_arrow:       '',
    pull_chain:       '',
    heal_orb:         '',
    tile_flip:        '',
    element_pulse:    '',
    flame_short:      '',
    impact:           '',
    heavy_slash:      '',
};

// =================================================================
// 🎨 HELPER fxSprite / fxElement
// =================================================================
function fxSprite(key, cssFallbackHTML) {
    const url = STORY_FX_SPRITES[key];
    if (url && String(url).trim() !== '') {
        return `<img src="${url}" class="story-fx story-fx--${key}" alt="${key}" data-fx="${key}">`;
    }
    return cssFallbackHTML;
}

function fxElement(key, cssFallbackHTML) {
    const url = STORY_FX_SPRITES[key];
    if (url && String(url).trim() !== '') {
        const img = document.createElement('img');
        img.src = url;
        img.className = `story-fx story-fx--${key}`;
        img.alt = key;
        img.dataset.fx = key;
        return img;
    }
    const tpl = document.createElement('template');
    tpl.innerHTML = cssFallbackHTML.trim();
    return tpl.content.firstElementChild;
}

// =================================================================
// 🎨 CSS DOS EFEITOS
// =================================================================
(function injectStoryFxCSS() {
    if (document.getElementById('storyFxStyle')) return;
    const style = document.createElement('style');
    style.id = 'storyFxStyle';
    style.textContent = `
        .story-fx {
            position: absolute;
            pointer-events: none;
            z-index: 55;
            transform-origin: center center;
            will-change: transform, opacity;
        }

        /* ============================================================
           🦔 PORCO-ESPINHO
           ============================================================ */
        .fx-spike-burst {
            position: absolute;
            width: 14px; height: 14px;
            background: radial-gradient(circle, #fff5dc 0%, #d9b840 40%, #8a7018 100%);
            border-radius: 50%;
            box-shadow: 0 0 12px #d9b840, 0 0 24px rgba(217,184,64,0.5);
            animation: fxSpikeBurst 0.6s ease-out forwards;
        }
        @keyframes fxSpikeBurst {
            0%   { transform: scale(0);   opacity: 0; }
            40%  { transform: scale(1.4); opacity: 1; }
            100% { transform: scale(2.2); opacity: 0; }
        }
        .fx-spike-travel {
            position: absolute;
            width: 8px; height: 8px;
            background: linear-gradient(135deg, #d9b840, #8a7018);
            border-radius: 50%;
            box-shadow: 0 0 8px #d9b840;
            z-index: 56;
            transition: left 0.25s linear, top 0.25s linear, opacity 0.25s;
        }

        .fx-spike-roll {
            position: absolute;
            width: 40px; height: 40px;
            background: radial-gradient(circle, #d9b840 0%, #8a7018 70%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 15px #d9b840;
            animation: fxSpikeRoll 0.5s linear forwards;
        }
        @keyframes fxSpikeRoll {
            0%   { transform: rotate(0deg) scale(0.8); opacity: 0.6; }
            50%  { transform: rotate(180deg) scale(1.1); opacity: 1; }
            100% { transform: rotate(360deg) scale(0.8); opacity: 0; }
        }

        /* ============================================================
           🐊 JACARÉ
           ============================================================ */
        .fx-jaw-snap {
            position: absolute;
            width: 100%; height: 100%;
            background:
                linear-gradient(180deg, transparent 30%, rgba(74,122,58,0.9) 48%, transparent 52%),
                linear-gradient(0deg, transparent 30%, rgba(74,122,58,0.9) 48%, transparent 52%);
            border-radius: 6px;
            animation: fxJawSnap 0.45s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes fxJawSnap {
            0%   { transform: scaleY(2.5); opacity: 0; }
            40%  { transform: scaleY(1);   opacity: 1; }
            70%  { transform: scaleY(0.85); opacity: 1; }
            100% { transform: scaleY(1);   opacity: 0; }
        }
        .fx-tail-whip {
            position: absolute;
            width: 200%; height: 200%;
            left: -50%; top: -50%;
            border: 4px solid rgba(74,122,58,0.8);
            border-top-color: transparent;
            border-bottom-color: transparent;
            border-radius: 50%;
            box-shadow: 0 0 15px rgba(74,122,58,0.6);
            animation: fxTailWhip 0.6s ease-out forwards;
        }
        @keyframes fxTailWhip {
            0%   { transform: rotate(0deg)   scale(0.4); opacity: 0; }
            50%  { transform: rotate(180deg) scale(1);   opacity: 1; }
            100% { transform: rotate(360deg) scale(1.1); opacity: 0; }
        }

        /* ============================================================
           🦌 CERVO
           ============================================================ */
        .fx-antler-charge {
            position: absolute;
            width: 100%; height: 100%;
            background:
                radial-gradient(circle at 20% 50%, rgba(217,184,64,0.9) 0%, transparent 30%),
                radial-gradient(circle at 80% 50%, rgba(217,184,64,0.9) 0%, transparent 30%);
            animation: fxAntlerCharge 0.5s ease-out forwards;
        }
        @keyframes fxAntlerCharge {
            0%   { transform: translateX(-30px); opacity: 0; }
            50%  { transform: translateX(0);     opacity: 1; }
            100% { transform: translateX(20px);  opacity: 0; }
        }

        /* ============================================================
           🐆 ONÇA / FELINOS
           ============================================================ */
        .fx-pounce-arc {
            position: absolute;
            width: 30px; height: 30px;
            background: radial-gradient(circle, #d9b840 0%, #8a3030 70%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 20px #d9b840;
            animation: fxPounceArc 0.65s cubic-bezier(0.4, 0, 0.3, 1) forwards;
        }
        @keyframes fxPounceArc {
            0%   { transform: translate(0, 0) scale(0.6); opacity: 0; }
            40%  { transform: translate(50%, -40px) scale(1.2); opacity: 1; }
            100% { transform: translate(100%, 0) scale(0.8); opacity: 0; }
        }
        .fx-claw-slash {
            position: absolute;
            width: 100%; height: 100%;
            background:
                linear-gradient(45deg, transparent 40%, rgba(217,80,80,0.95) 48%, rgba(255,255,255,1) 50%, rgba(217,80,80,0.95) 52%, transparent 60%),
                linear-gradient(-45deg, transparent 40%, rgba(217,80,80,0.95) 48%, rgba(255,255,255,1) 50%, rgba(217,80,80,0.95) 52%, transparent 60%);
            animation: fxClawSlash 0.4s ease-out forwards;
        }
        @keyframes fxClawSlash {
            0%   { transform: scale(0.3) rotate(-20deg); opacity: 0; }
            50%  { transform: scale(1.1) rotate(0deg);   opacity: 1; }
            100% { transform: scale(1.3) rotate(20deg);  opacity: 0; }
        }
        .fx-heavy-slash {
            position: absolute;
            width: 100%; height: 100%;
            background:
                linear-gradient(45deg, transparent 42%, rgba(255,80,80,0.95) 48%, rgba(255,255,255,1) 50%, rgba(255,80,80,0.95) 52%, transparent 58%);
            animation: fxHeavySlash 0.45s ease-out forwards;
        }
        @keyframes fxHeavySlash {
            0%   { transform: scale(0.5) rotate(-15deg); opacity: 0; }
            50%  { transform: scale(1.3) rotate(0deg);   opacity: 1; }
            100% { transform: scale(1.6) rotate(15deg);  opacity: 0; }
        }

        /* ============================================================
           🐺 CANÍDEOS — Mordida
           ============================================================ */
        .fx-fang-bite {
            position: absolute;
            width: 100%; height: 100%;
            background:
                radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.9) 0%, transparent 25%),
                radial-gradient(ellipse at 50% 80%, rgba(255,255,255,0.9) 0%, transparent 25%);
            animation: fxFangBite 0.45s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes fxFangBite {
            0%   { transform: scaleY(1.5); opacity: 0; }
            40%  { transform: scaleY(0.9); opacity: 1; }
            70%  { transform: scaleY(0.75); opacity: 1; }
            100% { transform: scaleY(1);   opacity: 0; }
        }

        /* ============================================================
           🦅 AVES
           ============================================================ */
        .fx-wing-gust {
            position: absolute;
            width: 100%; height: 100%;
            background:
                radial-gradient(ellipse at 30% 50%, rgba(217,184,64,0.7) 0%, transparent 40%),
                radial-gradient(ellipse at 70% 50%, rgba(217,184,64,0.7) 0%, transparent 40%);
            animation: fxWingGust 0.6s ease-out forwards;
        }
        @keyframes fxWingGust {
            0%   { transform: scaleX(0.3); opacity: 0; }
            50%  { transform: scaleX(1.2); opacity: 1; }
            100% { transform: scaleX(1.5); opacity: 0; }
        }
        .fx-peck-beak {
            position: absolute;
            width: 0; height: 0;
            border-left: 12px solid transparent;
            border-right: 12px solid transparent;
            border-top: 20px solid #d9b840;
            filter: drop-shadow(0 0 6px #d9b840);
            animation: fxPeckBeak 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes fxPeckBeak {
            0%   { transform: translateY(-20px) scale(0.5); opacity: 0; }
            50%  { transform: translateY(0)     scale(1);   opacity: 1; }
            100% { transform: translateY(8px)   scale(0.8); opacity: 0; }
        }

        /* ============================================================
           🐍 COBRAS
           ============================================================ */
        .fx-coil-wrap {
            position: absolute;
            width: 120%; height: 120%;
            left: -10%; top: -10%;
            border: 4px solid rgba(74,122,58,0.85);
            border-radius: 50%;
            box-shadow: 0 0 15px rgba(74,122,58,0.7), inset 0 0 15px rgba(74,122,58,0.5);
            animation: fxCoilWrap 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes fxCoilWrap {
            0%   { transform: rotate(0deg) scale(1.4); opacity: 0; }
            40%  { transform: rotate(90deg) scale(1);  opacity: 1; }
            80%  { transform: rotate(180deg) scale(0.85); opacity: 1; }
            100% { transform: rotate(220deg) scale(0.95); opacity: 0; }
        }
        .fx-sting-venom {
            position: absolute;
            width: 100%; height: 100%;
            background: radial-gradient(circle, rgba(107,163,92,0.9) 0%, rgba(74,122,58,0.5) 40%, transparent 70%);
            border-radius: 50%;
            animation: fxStingVenom 0.7s ease-out forwards;
        }
        @keyframes fxStingVenom {
            0%   { transform: scale(0);   opacity: 0; }
            40%  { transform: scale(1.3); opacity: 1; }
            100% { transform: scale(1.8); opacity: 0; }
        }

        /* ============================================================
           💧 ÁGUA / PEIXES
           ============================================================ */
        .fx-splash-wave {
            position: absolute;
            width: 100%; height: 100%;
            background: radial-gradient(circle at 50% 100%, rgba(74,140,181,0.9) 0%, rgba(74,140,181,0.5) 30%, transparent 70%);
            animation: fxSplashWave 0.7s ease-out forwards;
        }
        @keyframes fxSplashWave {
            0%   { transform: scaleY(0.3); opacity: 0; }
            40%  { transform: scaleY(1.2); opacity: 1; }
            100% { transform: scaleY(1.5); opacity: 0; }
        }
        .fx-fin-slash {
            position: absolute;
            width: 100%; height: 100%;
            background: linear-gradient(135deg, transparent 40%, rgba(74,140,181,0.95) 48%, rgba(200,230,245,1) 50%, rgba(74,140,181,0.95) 52%, transparent 60%);
            animation: fxFinSlash 0.4s ease-out forwards;
        }
        @keyframes fxFinSlash {
            0%   { transform: scale(0.4) rotate(-30deg); opacity: 0; }
            50%  { transform: scale(1.1) rotate(0deg);   opacity: 1; }
            100% { transform: scale(1.4) rotate(30deg);  opacity: 0; }
        }

        /* ============================================================
           🐘 PESADOS
           ============================================================ */
        .fx-hoof-stomp {
            position: absolute;
            width: 100%; height: 100%;
            background: radial-gradient(ellipse, rgba(139,90,43,0.8) 0%, transparent 60%);
            border-radius: 50%;
            animation: fxHoofStomp 0.5s ease-out forwards;
        }
        @keyframes fxHoofStomp {
            0%   { transform: scale(0.5); opacity: 0; }
            30%  { transform: scale(1.4); opacity: 1; }
            100% { transform: scale(1.8); opacity: 0; }
        }
        .fx-ground-crack {
            position: absolute;
            width: 100%; height: 100%;
            background:
                linear-gradient(0deg,   transparent 48%, rgba(74,60,30,0.95) 49%, rgba(74,60,30,0.95) 51%, transparent 52%),
                linear-gradient(60deg,  transparent 48%, rgba(74,60,30,0.95) 49%, rgba(74,60,30,0.95) 51%, transparent 52%),
                linear-gradient(-60deg, transparent 48%, rgba(74,60,30,0.95) 49%, rgba(74,60,30,0.95) 51%, transparent 52%);
            animation: fxGroundCrack 0.6s ease-out forwards;
        }
        @keyframes fxGroundCrack {
            0%   { opacity: 0; transform: scale(0.6); }
            40%  { opacity: 1; transform: scale(1.1); }
            100% { opacity: 0; transform: scale(1.2); }
        }
        .fx-shockwave {
            position: absolute;
            width: 100%; height: 100%;
            border: 3px solid rgba(217,184,64,0.85);
            border-radius: 50%;
            animation: fxShockwave 0.6s ease-out forwards;
        }
        @keyframes fxShockwave {
            0%   { transform: scale(0.2); opacity: 0; }
            30%  { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(2.5); opacity: 0; }
        }

        /* ============================================================
           🌫️ NÉVOA / ENXAME / ESPECTRAL
           ============================================================ */
        .fx-fog-cloud {
            position: absolute;
            width: 140%; height: 140%;
            left: -20%; top: -20%;
            background: radial-gradient(circle, rgba(200,200,220,0.7) 0%, rgba(200,200,220,0.3) 40%, transparent 70%);
            border-radius: 50%;
            filter: blur(6px);
            animation: fxFogCloud 0.9s ease-out forwards;
        }
        @keyframes fxFogCloud {
            0%   { transform: scale(0.4); opacity: 0; }
            40%  { transform: scale(1);   opacity: 0.9; }
            100% { transform: scale(1.6); opacity: 0; }
        }
        .fx-swarm-cloud {
            position: absolute;
            width: 120%; height: 120%;
            left: -10%; top: -10%;
            background:
                radial-gradient(circle at 20% 30%, rgba(168,50,50,0.9) 0%, transparent 15%),
                radial-gradient(circle at 70% 40%, rgba(168,50,50,0.9) 0%, transparent 15%),
                radial-gradient(circle at 40% 70%, rgba(168,50,50,0.9) 0%, transparent 15%),
                radial-gradient(circle at 80% 80%, rgba(168,50,50,0.9) 0%, transparent 15%),
                radial-gradient(circle at 50% 50%, rgba(168,50,50,0.5) 0%, transparent 40%);
            border-radius: 50%;
            animation: fxSwarmCloud 0.7s ease-out forwards;
        }
        @keyframes fxSwarmCloud {
            0%   { transform: scale(0.3) rotate(0deg); opacity: 0; }
            40%  { transform: scale(1.1) rotate(180deg); opacity: 1; }
            100% { transform: scale(1.4) rotate(360deg); opacity: 0; }
        }
        .fx-spectral-veil {
            position: absolute;
            width: 140%; height: 140%;
            left: -20%; top: -20%;
            background: radial-gradient(circle, rgba(142,68,173,0.9) 0%, rgba(142,68,173,0.5) 40%, transparent 70%);
            border-radius: 50%;
            filter: blur(4px);
            animation: fxSpectralVeil 0.8s ease-out forwards;
        }
        @keyframes fxSpectralVeil {
            0%   { transform: scale(0.4); opacity: 0; }
            40%  { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
        }
        .fx-tentacle-glow {
            position: absolute;
            width: 100%; height: 100%;
            background:
                linear-gradient(90deg, transparent 40%, rgba(200,128,224,0.9) 48%, rgba(255,255,255,1) 50%, rgba(200,128,224,0.9) 52%, transparent 60%),
                linear-gradient(0deg,  transparent 40%, rgba(200,128,224,0.9) 48%, rgba(255,255,255,1) 50%, rgba(200,128,224,0.9) 52%, transparent 60%);
            animation: fxTentacleGlow 0.6s ease-out forwards;
        }
        @keyframes fxTentacleGlow {
            0%   { transform: scale(0.5); opacity: 0; }
            40%  { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
        }

        /* ============================================================
           🎯 ÍCONES AUXILIARES
           ============================================================ */
        .fx-push-arrow {
            position: absolute;
            width: 100%; height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            color: #e8b923;
            text-shadow: 0 0 8px #000, 0 0 12px #e8b923;
            animation: fxPushArrow 0.5s ease-out forwards;
        }
        @keyframes fxPushArrow {
            0%   { transform: translate(0,0)   scale(0.6); opacity: 0; }
            40%  { transform: translate(8px,0) scale(1.2); opacity: 1; }
            100% { transform: translate(20px,0) scale(0.9); opacity: 0; }
        }
        .fx-pull-chain {
            position: absolute;
            width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent 30%, rgba(217,184,64,0.9) 48%, rgba(255,245,220,1) 50%, rgba(217,184,64,0.9) 52%, transparent 70%);
            animation: fxPullChain 0.5s ease-out forwards;
        }
        @keyframes fxPullChain {
            0%   { transform: translate(20px,0) scaleX(0.4); opacity: 0; }
            40%  { transform: translate(0,0)    scaleX(1);   opacity: 1; }
            100% { transform: translate(-15px,0) scaleX(0.6); opacity: 0; }
        }
        .fx-heal-orb {
            position: absolute;
            width: 100%; height: 100%;
            background: radial-gradient(circle, #7fc060 0%, #4a7040 50%, transparent 80%);
            border-radius: 50%;
            box-shadow: 0 0 20px #7fc060, inset 0 0 15px rgba(255,255,255,0.5);
            animation: fxHealOrb 0.8s ease-out forwards;
        }
        @keyframes fxHealOrb {
            0%   { transform: translateY(20px) scale(0.3); opacity: 0; }
            40%  { transform: translateY(0)    scale(1.1); opacity: 1; }
            100% { transform: translateY(-20px) scale(0.8); opacity: 0; }
        }
        .fx-tile-flip {
            position: absolute;
            width: 100%; height: 100%;
            background: rgba(232,185,35,0.4);
            border: 2px dashed rgba(232,185,35,0.9);
            animation: fxTileFlip 0.6s ease-out forwards;
        }
        @keyframes fxTileFlip {
            0%   { transform: rotateY(0deg)   scale(1);   opacity: 0; }
            40%  { transform: rotateY(90deg)  scale(1.1); opacity: 1; }
            100% { transform: rotateY(180deg) scale(1);   opacity: 0; }
        }
        .fx-element-pulse {
            position: absolute;
            width: 100%; height: 100%;
            border: 3px solid currentColor;
            border-radius: 50%;
            animation: fxElementPulse 0.7s ease-out forwards;
        }
        @keyframes fxElementPulse {
            0%   { transform: scale(0.3); opacity: 0; }
            40%  { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1.8); opacity: 0; }
        }
        .fx-flame-short {
            position: absolute;
            width: 100%; height: 100%;
            background: radial-gradient(circle at 50% 80%, #fff5dc 0%, #e8b923 20%, #a83232 50%, transparent 80%);
            animation: fxFlameShort 0.5s ease-out forwards;
        }
        @keyframes fxFlameShort {
            0%   { transform: scale(0.4); opacity: 0; }
            50%  { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1.4); opacity: 0; }
        }
        .fx-impact {
            position: absolute;
            width: 100%; height: 100%;
            background: radial-gradient(circle, rgba(255,245,220,0.95) 0%, rgba(232,185,35,0.6) 30%, transparent 70%);
            animation: fxImpact 0.4s ease-out forwards;
        }
        @keyframes fxImpact {
            0%   { transform: scale(0.2); opacity: 0; }
            40%  { transform: scale(1.3); opacity: 1; }
            100% { transform: scale(1.6); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
})();

// =================================================================
// 🧭 HELPERS DE POSICIONAMENTO
// =================================================================

function fxPos(x, y) {
    const s = (typeof getStep === 'function') ? getStep() : 59;
    const board = document.getElementById('board');
    let pad = 8;
    if (board) {
        const cs = getComputedStyle(board);
        const p = parseFloat(cs.padding || '8');
        if (!isNaN(p)) pad = p;
    }
    return { left: (x * s + pad), top: (y * s + pad), step: s, pad };
}

// =================================================================
// 🎬 spawnFxAt — FX único num tile
// =================================================================
function spawnFxAt(fxKey, cssClass, x, y, opts = {}) {
    const board = opts.appendTo || document.getElementById('board');
    if (!board) return null;

    const { left, top, step } = fxPos(x, y);
    const el = fxElement(fxKey, `<div class="${cssClass}"></div>`);
    if (!el) return null;

    el.style.left = left + 'px';
    el.style.top  = top + 'px';

    if (!el.style.width)  el.style.width  = step + 'px';
    if (!el.style.height) el.style.height = step + 'px';

    if (opts.scale)  el.style.transform = `scale(${opts.scale})`;
    if (opts.extraClass) el.classList.add(...String(opts.extraClass).split(' '));
    if (opts.delay)  el.style.animationDelay = opts.delay + 'ms';

    const duration = opts.duration || 800;
    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, duration);

    board.appendChild(el);
    return el;
}

// =================================================================
// 🎬 spawnFxLine — FX em linha reta
// =================================================================
function spawnFxLine(fxKey, cssClass, fromX, fromY, dir, length, opts = {}) {
    const results = [];
    const dx = dir === 'right' ? 1 : dir === 'left'  ? -1 : 0;
    const dy = dir === 'down'  ? 1 : dir === 'up'    ? -1 : 0;

    for (let i = 0; i < length; i++) {
        const nx = fromX + dx * (i + 1);
        const ny = fromY + dy * (i + 1);
        if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
        const delay = (opts.stagger || 0) * i;
        const el = spawnFxAt(fxKey, cssClass, nx, ny, {
            ...opts,
            delay: (opts.delay || 0) + delay,
        });
        results.push({ x: nx, y: ny, el });
    }
    return results;
}

// =================================================================
// 🎬 spawnFxArea — FX em área quadrada ao redor de (cx, cy)
// =================================================================
function spawnFxArea(fxKey, cssClass, cx, cy, radius, opts = {}) {
    const results = [];
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            if (!opts.includeCenter && dx === 0 && dy === 0) continue;
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) continue;
            const dist = Math.max(Math.abs(dx), Math.abs(dy));
            const delay = (opts.stagger || 0) * dist;
            const el = spawnFxAt(fxKey, cssClass, nx, ny, {
                ...opts,
                delay: (opts.delay || 0) + delay,
            });
            results.push({ x: nx, y: ny, el, dist });
        }
    }
    return results;
}

// =================================================================
// 🎬 spawnFxCross — FX em cruz (4 direções)
// =================================================================
function spawnFxCross(fxKey, cssClass, cx, cy, length, opts = {}) {
    const results = [];
    if (opts.includeCenter) {
        results.push({ x: cx, y: cy, el: spawnFxAt(fxKey, cssClass, cx, cy, opts) });
    }
    const dirs = [
        { dx:  1, dy:  0 },
        { dx: -1, dy:  0 },
        { dx:  0, dy:  1 },
        { dx:  0, dy: -1 },
    ];
    dirs.forEach(dir => {
        for (let i = 1; i <= length; i++) {
            const nx = cx + dir.dx * i;
            const ny = cy + dir.dy * i;
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
            const delay = (opts.stagger || 0) * i;
            const el = spawnFxAt(fxKey, cssClass, nx, ny, {
                ...opts,
                delay: (opts.delay || 0) + delay,
            });
            results.push({ x: nx, y: ny, el, dist: i, dir });
        }
    });
    return results;
}

// =================================================================
// 🎬 spawnFxDiagonal — FX nas 4 diagonais
// =================================================================
function spawnFxDiagonal(fxKey, cssClass, cx, cy, length, opts = {}) {
    const results = [];
    const dirs = [
        { dx:  1, dy:  1 },
        { dx:  1, dy: -1 },
        { dx: -1, dy:  1 },
        { dx: -1, dy: -1 },
    ];
    dirs.forEach(dir => {
        for (let i = 1; i <= length; i++) {
            const nx = cx + dir.dx * i;
            const ny = cy + dir.dy * i;
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
            const delay = (opts.stagger || 0) * i;
            const el = spawnFxAt(fxKey, cssClass, nx, ny, {
                ...opts,
                delay: (opts.delay || 0) + delay,
            });
            results.push({ x: nx, y: ny, el, dist: i, dir });
        }
    });
    return results;
}

// =================================================================
// 🎬 spawnTravelingFx — FX que viaja de A até B
// =================================================================
function spawnTravelingFx(fxKey, cssClass, fromX, fromY, toX, toY, opts = {}) {
    const board = opts.appendTo || document.getElementById('board');
    if (!board) return null;

    const from = fxPos(fromX, fromY);
    const el = fxElement(fxKey, `<div class="${cssClass}"></div>`);
    if (!el) return null;

    el.style.left = from.left + 'px';
    el.style.top  = from.top  + 'px';
    el.style.width  = from.step + 'px';
    el.style.height = from.step + 'px';
    el.style.transition = `left ${opts.duration || 250}ms linear, top ${opts.duration || 250}ms linear, opacity ${opts.duration || 250}ms`;

    if (opts.extraClass) el.classList.add(...String(opts.extraClass).split(' '));

    board.appendChild(el);

    setTimeout(() => {
        const to = fxPos(toX, toY);
        el.style.left = to.left + 'px';
        el.style.top  = to.top  + 'px';
    }, 30);

    setTimeout(() => {
        if (opts.fadeOut !== false) el.style.opacity = '0';
    }, (opts.duration || 250) + 30);

    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, (opts.duration || 250) + 350);

    return el;
}

// =================================================================
// 🎬 spawnPushArrow — seta visual de empurrão
// =================================================================
function spawnPushArrow(x, y, direction) {
    const arrowMap = { right: '▶', left: '◀', up: '▲', down: '▼' };
    const glyph = arrowMap[direction] || '▶';
    const board = document.getElementById('board');
    if (!board) return;

    const { left, top, step } = fxPos(x, y);
    const el = fxElement('push_arrow', `<div class="fx-push-arrow">${glyph}</div>`);
    el.style.left = left + 'px';
    el.style.top  = top + 'px';
    el.style.width  = step + 'px';
    el.style.height = step + 'px';

    const dx = direction === 'right' ? 1 : direction === 'left' ? -1 : 0;
    const dy = direction === 'down'  ? 1 : direction === 'up'   ? -1 : 0;

    if (el.style.transform) {
        el.style.transform = `translate(${dx * 20}px, ${dy * 20}px) scale(1.1)`;
    }

    board.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 600);
}

// =================================================================
// 🎬 spawnPullChain — corrente visual de puxão
// =================================================================
function spawnPullChain(fromX, fromY, toX, toY) {
    const board = document.getElementById('board');
    if (!board) return;

    const from = fxPos(fromX, fromY);
    const el = fxElement('pull_chain', '<div class="fx-pull-chain"></div>');
    el.style.left = from.left + 'px';
    el.style.top  = from.top  + 'px';
    el.style.width  = from.step + 'px';
    el.style.height = from.step + 'px';

    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    el.style.transform = `rotate(${angle}deg)`;

    board.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 600);
}

// =================================================================
// 🎬 spawnHealOrb — orbe de cura no boss
// =================================================================
function spawnHealOrb(x, y) {
    const board = document.getElementById('board');
    if (!board) return;
    const { left, top, step } = fxPos(x, y);
    const el = fxElement('heal_orb', '<div class="fx-heal-orb"></div>');
    el.style.left = left + 'px';
    el.style.top  = top  + 'px';
    el.style.width  = step + 'px';
    el.style.height = step + 'px';
    board.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 900);
}

// =================================================================
// 🎬 spawnTileFlip — tile virando
// =================================================================
function spawnTileFlip(x, y, delay = 0) {
    const board = document.getElementById('board');
    if (!board) return;
    const { left, top, step } = fxPos(x, y);
    const el = fxElement('tile_flip', '<div class="fx-tile-flip"></div>');
    el.style.left = left + 'px';
    el.style.top  = top  + 'px';
    el.style.width  = step + 'px';
    el.style.height = step + 'px';
    if (delay) el.style.animationDelay = delay + 'ms';
    board.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 800 + delay);
}

// =================================================================
// 🎬 spawnElementPulse — pulso de elemento
// =================================================================
function spawnElementPulse(x, y, elementColor) {
    const colorMap = {
        FOGO:  '#e74c3c',
        AGUA:  '#3498db',
        TERRA: '#27ae60',
        AR:    '#f1c40f',
    };
    const board = document.getElementById('board');
    if (!board) return;
    const { left, top, step } = fxPos(x, y);
    const el = fxElement('element_pulse', '<div class="fx-element-pulse"></div>');
    el.style.left = left + 'px';
    el.style.top  = top  + 'px';
    el.style.width  = step + 'px';
    el.style.height = step + 'px';
    el.style.color = colorMap[elementColor] || '#e8b923';
    board.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 800);
}

// =================================================================
// 🎬 spawnMovingSprite — move um sprite visualmente de A até B
// =================================================================
function spawnMovingSprite(fromX, fromY, toX, toY, sprite, opts = {}) {
    const board = document.getElementById('board');
    if (!board) return null;

    const from = fxPos(fromX, fromY);
    const to   = fxPos(toX, toY);

    const el = document.createElement('img');
    el.src = sprite;
    el.className = 'story-fx';
    el.style.left = from.left + 'px';
    el.style.top  = from.top  + 'px';
    el.style.width  = from.step + 'px';
    el.style.height = from.step + 'px';
    el.style.zIndex = '60';
    el.style.transition = `left ${opts.duration || 250}ms ease-in-out, top ${opts.duration || 250}ms ease-in-out, opacity 200ms`;

    if (opts.extraClass) el.classList.add(...String(opts.extraClass).split(' '));

    board.appendChild(el);

    setTimeout(() => {
        el.style.left = to.left + 'px';
        el.style.top  = to.top  + 'px';
    }, 30);

    setTimeout(() => {
        el.style.opacity = '0';
    }, (opts.duration || 250) + 100);

    setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
    }, (opts.duration || 250) + 400);

    return el;
}

// =================================================================
// 🧪 DEBUG — testa visualmente todos os efeitos
// =================================================================
window.storyTestFx = function() {
    const board = document.getElementById('board');
    if (!board) { console.warn('Board não disponível'); return; }

    const efectos = [
        ['spike_burst',     'fx-spike-burst'],
        ['spike_roll',      'fx-spike-roll'],
        ['jaw_snap',        'fx-jaw-snap'],
        ['tail_whip',       'fx-tail-whip'],
        ['antler_charge',   'fx-antler-charge'],
        ['pounce_arc',      'fx-pounce-arc'],
        ['claw_slash',      'fx-claw-slash'],
        ['fang_bite',       'fx-fang-bite'],
        ['wing_gust',       'fx-wing-gust'],
        ['peck_beak',       'fx-peck-beak'],
        ['coil_wrap',       'fx-coil-wrap'],
        ['sting_venom',     'fx-sting-venom'],
        ['splash_wave',     'fx-splash-wave'],
        ['fin_slash',       'fx-fin-slash'],
        ['hoof_stomp',      'fx-hoof-stomp'],
        ['ground_crack',    'fx-ground-crack'],
        ['shockwave',       'fx-shockwave'],
        ['fog_cloud',       'fx-fog-cloud'],
        ['swarm_cloud',     'fx-swarm-cloud'],
        ['spectral_veil',   'fx-spectral-veil'],
        ['tentacle_glow',   'fx-tentacle-glow'],
        ['heal_orb',        'fx-heal-orb'],
        ['tile_flip',       'fx-tile-flip'],
        ['element_pulse',   'fx-element-pulse'],
        ['flame_short',     'fx-flame-short'],
        ['impact',          'fx-impact'],
        ['heavy_slash',     'fx-heavy-slash'],
    ];

    console.log(`Testando ${efectos.length} efeitos...`);
    efectos.forEach(([key, cls], i) => {
        const x = i % 8;
        const y = Math.floor(i / 8) % 8;
        setTimeout(() => {
            spawnFxAt(key, cls, x, y, { duration: 1500 });
        }, i * 200);
    });
};

// =================================================================
// 🎯 HELPERS COMBATENTES (reutilizáveis pelas skills)
// =================================================================

// Aplica empurrão em um jogador — devolve true se moveu
function tryPushPlayer(p, dirX, dirY, distance = 1) {
    if (!p || p.dead) return false;
    let moved = false;
    for (let i = 0; i < distance; i++) {
        const nx = p.x + dirX;
        const ny = p.y + dirY;
        if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
        if (typeof isOccupied === 'function' && isOccupied(nx, ny, p.id)) break;
        p.x = nx;
        p.y = ny;
        moved = true;
    }
    if (moved) {
        if (typeof spawnPushArrow === 'function') spawnPushArrow(p.x, p.y, dirX > 0 ? 'right' : dirX < 0 ? 'left' : dirY > 0 ? 'down' : 'up');
        if (typeof updateVisuals === 'function') updateVisuals();
    }
    return moved;
}

// Aplica puxão em um jogador na direção de (toX, toY) — puxa em direção a esse ponto
function tryPullPlayer(p, toX, toY, distance = 1) {
    if (!p || p.dead) return false;
    const dirX = Math.sign(toX - p.x);
    const dirY = Math.sign(toY - p.y);
    let moved = false;
    for (let i = 0; i < distance; i++) {
        const nx = p.x + dirX;
        const ny = p.y + dirY;
        if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
        if (typeof isOccupied === 'function' && isOccupied(nx, ny, p.id)) break;
        p.x = nx;
        p.y = ny;
        moved = true;
        // Para se chegou no destino
        if (p.x === toX && p.y === toY) break;
    }
    if (moved) {
        if (typeof spawnPullChain === 'function') spawnPullChain(p.x, p.y, toX, toY);
        if (typeof updateVisuals === 'function') updateVisuals();
    }
    return moved;
}

// Encontra a direção cardeal mais próxima de um ponto
function dirToward(fromX, fromY, toX, toY) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    if (Math.abs(dx) >= Math.abs(dy)) return { dx: Math.sign(dx), dy: 0, name: dx > 0 ? 'right' : 'left' };
    return { dx: 0, dy: Math.sign(dy), name: dy > 0 ? 'down' : 'up' };
}

// Aplica dano em todos os jogadores que estejam em um conjunto de tiles
function damagePlayersAt(tiles, dmg) {
    if (!tiles || tiles.length === 0) return;
    const keySet = new Set(tiles.map(t => `${t.x},${t.y}`));
    players.forEach(p => {
        if (p.dead) return;
        if (keySet.has(`${p.x},${p.y}`)) {
            if (typeof applyDmg === 'function') applyDmg(p, dmg);
        }
    });
}

// Constrói lista de tiles em linha/cruz/área (para aplicar dano depois do FX)
function buildLineTiles(fromX, fromY, dir, length) {
    const tiles = [];
    const dx = dir === 'right' ? 1 : dir === 'left' ? -1 : 0;
    const dy = dir === 'down'  ? 1 : dir === 'up'   ? -1 : 0;
    for (let i = 1; i <= length; i++) {
        const nx = fromX + dx * i;
        const ny = fromY + dy * i;
        if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
        tiles.push({ x: nx, y: ny });
    }
    return tiles;
}

function buildCrossTiles(cx, cy, length, includeCenter = false) {
    const tiles = [];
    if (includeCenter) tiles.push({ x: cx, y: cy });
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => {
        for (let i = 1; i <= length; i++) {
            const nx = cx + dx * i;
            const ny = cy + dy * i;
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
            tiles.push({ x: nx, y: ny });
        }
    });
    return tiles;
}

function buildAreaTiles(cx, cy, radius, includeCenter = false) {
    const tiles = [];
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            if (!includeCenter && dx === 0 && dy === 0) continue;
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) continue;
            tiles.push({ x: nx, y: ny });
        }
    }
    return tiles;
}

function buildDiagonalTiles(cx, cy, length) {
    const tiles = [];
    [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dx, dy]) => {
        for (let i = 1; i <= length; i++) {
            const nx = cx + dx * i;
            const ny = cy + dy * i;
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
            tiles.push({ x: nx, y: ny });
        }
    });
    return tiles;
}

// =================================================================
// 🏁 FIM DA PARTE 3/5
// =================================================================
// =================================================================
// historia.js — V6.0 — Bloco 4/5
// STORY_ANIMAL_SKILLS — Handlers dos Atos 1 a 7
// -----------------------------------------------------------------
// Cada handler é async (enemy, skill) → executa FX + dano
// Regra: dano ≤ atk do animal (atk é teto)
//   • alvo único → atk cheio
//   • multi-alvo (4-8) → atk cheio (poucos)
//   • multi-alvo grande (9+) → atk - 1
//   • tabuleiro todo → 1 ou 2 fixo
// =================================================================

const STORY_ANIMAL_SKILLS = {};

// =================================================================
// 🦔 ATO 1 — PORCO-ESPINHO
// =================================================================
STORY_ANIMAL_SKILLS['porco_espinho_espinhos'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦔 ${enemy.name} eriça os espinhos!`);

    // FX: burst no porco + espinhos viajando em cruz até as bordas
    spawnFxAt('spike_burst', 'fx-spike-burst', boss.x, boss.y, { duration: 700 });

    const dirs = [
        { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
    ];
    const tilesAtk = []; // { x, y, dmg }

    dirs.forEach(dir => {
        let step = 0;
        while (true) {
            step++;
            const nx = boss.x + dir.dx * step;
            const ny = boss.y + dir.dy * step;
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;

            // FX: espinho viajando
            spawnTravelingFx('spike_burst', 'fx-spike-travel', boss.x, boss.y, nx, ny, {
                duration: 150 + step * 40,
            });

            // Dano: 2 no adjacente, 1 nos distantes (cai com distância)
            const dmg = step === 1 ? atk : Math.max(1, atk - 1);
            tilesAtk.push({ x: nx, y: ny, dmg });
        }
    });

    await sleep(400);

    // Aplica dano por tile (usa o dano específico por distância)
    const board = document.getElementById('board');
    const s = getStep();
    const pad = 8;

    tilesAtk.forEach(t => {
        spawnFxAt('spike_burst', 'fx-spike-burst', t.x, t.y, { duration: 500, scale: 0.7 });
    });

    // Aplica dano — pega o MAIOR dano que cada player recebeu (não empilha)
    const dmgPerPlayer = new Map();
    tilesAtk.forEach(t => {
        players.forEach(p => {
            if (p.dead) return;
            if (p.x === t.x && p.y === t.y) {
                const cur = dmgPerPlayer.get(p.id) || 0;
                if (t.dmg > cur) dmgPerPlayer.set(p.id, t.dmg);
            }
        });
    });
    dmgPerPlayer.forEach((dmg, pid) => {
        const p = players.find(pl => pl.id === pid);
        if (p) applyDmg(p, dmg);
    });

    await sleep(400);
};

STORY_ANIMAL_SKILLS['porco_espinho_bote'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦔 ${enemy.name} rola em bola de espinhos!`);

    // Acha o player mais próximo
    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    let lastX = boss.x, lastY = boss.y;

    // Rola 2 tiles
    for (let i = 0; i < 2; i++) {
        const nx = boss.x + dir.dx;
        const ny = boss.y + dir.dy;
        if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
        if (typeof isOccupied === 'function' && isOccupied(nx, ny, -1)) break;

        spawnFxAt('spike_roll', 'fx-spike-roll', nx, ny, { duration: 500 });
        boss.x = nx;
        boss.y = ny;
        lastX = nx;
        lastY = ny;
        if (typeof updateVisuals === 'function') updateVisuals();
        await sleep(180);
    }

    await sleep(200);

    // Dano no tile final
    spawnFxAt('spike_burst', 'fx-spike-burst', lastX, lastY, { duration: 700, scale: 1.3 });
    players.forEach(p => {
        if (!p.dead && p.x === lastX && p.y === lastY) {
            applyDmg(p, atk);
            // Empurra 1 tile na direção do movimento
            tryPushPlayer(p, dir.dx, dir.dy, 1);
        }
    });

    await sleep(300);
};

// =================================================================
// 🐊 ATO 1 — JACARÉ
// =================================================================
STORY_ANIMAL_SKILLS['jacare_bocada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐊 ${enemy.name} abre a bocarra!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('jaw_snap', 'fx-jaw-snap', t.x, t.y, { duration: 500 });
        }, i * 120);
    });

    await sleep(400);
    damagePlayersAt(tiles, atk);
    await sleep(300);
};

STORY_ANIMAL_SKILLS['jacare_giro'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐊 ${enemy.name} gira a cauda em 360°!`);

    spawnFxAt('tail_whip', 'fx-tail-whip', boss.x, boss.y, { duration: 700, scale: 1.5 });

    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('tail_whip', 'fx-tail-whip', t.x, t.y, { duration: 600 });
        }, i * 30);
    });

    await sleep(500);
    damagePlayersAt(tiles, atk);

    // Empurra cada player 1 tile pra fora
    players.forEach(p => {
        if (p.dead) return;
        if (tiles.some(t => t.x === p.x && t.y === p.y)) {
            const dx = Math.sign(p.x - boss.x);
            const dy = Math.sign(p.y - boss.y);
            tryPushPlayer(p, dx || 0, dy || 0, 1);
        }
    });

    await sleep(300);
};

// =================================================================
// 🦌 ATO 1 — CERVO
// =================================================================
STORY_ANIMAL_SKILLS['cervo_investida'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦌 ${enemy.name} baixa os chifres e investe!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    let targetX = boss.x;
    let targetY = boss.y;

    // Avança até 3 tiles em direção ao alvo
    for (let i = 0; i < 3; i++) {
        const nx = boss.x + dir.dx;
        const ny = boss.y + dir.dy;
        if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
        if (typeof isOccupied === 'function' && isOccupied(nx, ny, -1)) break;

        spawnFxAt('antler_charge', 'fx-antler-charge', nx, ny, { duration: 400 });
        boss.x = nx;
        boss.y = ny;
        targetX = nx;
        targetY = ny;
        if (typeof updateVisuals === 'function') updateVisuals();
        await sleep(150);
    }

    await sleep(200);
    spawnFxAt('shockwave', 'fx-shockwave', targetX, targetY, { duration: 600 });

    players.forEach(p => {
        if (!p.dead && p.x === targetX && p.y === targetY) {
            applyDmg(p, atk);
        }
    });

    await sleep(300);
};

STORY_ANIMAL_SKILLS['cervo_chifrada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦌 ${enemy.name} dá uma chifrada frontal!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 1);

    spawnFxAt('antler_charge', 'fx-antler-charge', boss.x, boss.y, { duration: 600 });

    await sleep(400);
    damagePlayersAt(tiles, atk);

    // Empurra quem foi acertado
    tiles.forEach(t => {
        players.forEach(p => {
            if (!p.dead && p.x === t.x && p.y === t.y) {
                tryPushPlayer(p, dir.dx, dir.dy, 1);
            }
        });
    });

    await sleep(300);
};

// =================================================================
// 🐆 ATO 1 — ONÇA-PARDA
// =================================================================
STORY_ANIMAL_SKILLS['onca_garra_dupla'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐆 ${enemy.name} ataca com garra dupla!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    // Onça ataca 2x no MESMO tile — total ≤ atk
    const dmg1 = Math.ceil(atk / 2);      // 2
    const dmg2 = Math.floor(atk / 2);     // 1
    const tx = nearest.x;
    const ty = nearest.y;

    // Hit 1
    spawnFxAt('claw_slash', 'fx-claw-slash', tx, ty, { duration: 400 });
    playSfx('garras');
    await sleep(250);
    players.forEach(p => {
        if (!p.dead && p.x === tx && p.y === ty) applyDmg(p, dmg1);
    });

    // Hit 2
    await sleep(180);
    spawnFxAt('claw_slash', 'fx-claw-slash', tx, ty, { duration: 400, scale: 1.2 });
    playSfx('garras');
    await sleep(250);
    players.forEach(p => {
        if (!p.dead && p.x === tx && p.y === ty) applyDmg(p, dmg2);
    });

    await sleep(200);
};

STORY_ANIMAL_SKILLS['onca_salto'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐆 ${enemy.name} salta mortalmente!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const fromX = boss.x;
    const fromY = boss.y;
    let landX = boss.x + dir.dx * 2;
    let landY = boss.y + dir.dy * 2;
    landX = Math.max(0, Math.min(7, landX));
    landY = Math.max(0, Math.min(7, landY));

    // FX de salto em arco
    spawnFxAt('pounce_arc', 'fx-pounce-arc', fromX, fromY, { duration: 700 });

    boss.x = landX;
    boss.y = landY;
    if (typeof updateVisuals === 'function') updateVisuals();
    await sleep(350);

    // Impacto no pouso — dano em área 1
    spawnFxAt('shockwave', 'fx-shockwave', landX, landY, { duration: 600, scale: 1.4 });
    spawnFxAt('impact', 'fx-impact', landX, landY, { duration: 500 });

    const tiles = buildAreaTiles(landX, landY, 1, true);
    // Multi-alvo (9 tiles) → atk - 1 (mín 1)
    const dmg = Math.max(1, atk - 1);
    await sleep(300);
    damagePlayersAt(tiles, dmg);

    await sleep(300);
};

// =================================================================
// 👺 ATO 1 — SACI (boss)
// =================================================================
STORY_ANIMAL_SKILLS['saci_vortices'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`💨 ${enemy.name} cria vórtices de vento nos tiles de AR!`);

    let count = 0;
    grid.forEach((element, idx) => {
        if (element === 'AR') {
            const x = idx % 8;
            const y = Math.floor(idx / 8);
            spawnFxAt('spectral_veil', 'fx-spectral-veil', x, y, { duration: 800, delay: count * 30 });
            // Só acerta quem estiver no tile AR → mantém atk cheio
            players.forEach(p => {
                if (!p.dead && p.x === x && p.y === y) {
                    setTimeout(() => applyDmg(p, atk), count * 30);
                }
            });
            count++;
        }
    });

    addLog(`💨 ${count} tiles de AR foram ativados!`);
    await sleep(700);
};

STORY_ANIMAL_SKILLS['saci_diagonais'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`💨 ${enemy.name} lança vórtices diagonais!`);

    const dirs = [
        { dx: 1, dy: 1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
    ];

    dirs.forEach(dir => {
        for (let step = 1; step < 8; step++) {
            const nx = boss.x + dir.dx * step;
            const ny = boss.y + dir.dy * step;
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
            spawnFxAt('spectral_veil', 'fx-spectral-veil', nx, ny, {
                duration: 800,
                delay: step * 80,
            });
            players.forEach(p => {
                if (!p.dead && p.x === nx && p.y === ny) {
                    setTimeout(() => applyDmg(p, atk), step * 80);
                }
            });
        }
    });

    await sleep(800);
};

// =================================================================
// 🐜 ATO 2 — TAMANDUÁ-BANDEIRA
// =================================================================
STORY_ANIMAL_SKILLS['tamandua_garras'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐜 ${enemy.name} ataca com garras longas!`);

    spawnFxAt('claw_slash', 'fx-claw-slash', boss.x, boss.y, { duration: 500, scale: 1.4 });

    // Atinge quem está a 1 tile (8 adjacentes) → atk cheio (poucos alvos)
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach(t => {
        spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 400, scale: 0.8 });
    });

    await sleep(450);
    damagePlayersAt(tiles, atk);
    await sleep(300);
};

STORY_ANIMAL_SKILLS['tamandua_bicada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐜 ${enemy.name} dá uma bicada perfurante!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('peck_beak', 'fx-peck-beak', t.x, t.y, { duration: 400 });
        }, i * 120);
    });

    await sleep(400);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🦛 ATO 2 — ANTA
// =================================================================
STORY_ANIMAL_SKILLS['anta_pisada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦛 ${enemy.name} dá uma pisada pesada!`);

    // Área 2 = 24 tiles → muitos alvos → atk - 1
    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t, i) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => {
            spawnFxAt('hoof_stomp', 'fx-hoof-stomp', t.x, t.y, { duration: 500 });
            if (dist === 1) spawnFxAt('ground_crack', 'fx-ground-crack', t.x, t.y, { duration: 500 });
        }, dist * 60 + i * 10);
    });

    await sleep(600);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(300);
};

STORY_ANIMAL_SKILLS['anta_atropelamento'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦛 ${enemy.name} atropela!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    let hit = false;

    for (let i = 0; i < 3; i++) {
        const nx = boss.x + dir.dx;
        const ny = boss.y + dir.dy;
        if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
        if (typeof isOccupied === 'function' && isOccupied(nx, ny, -1)) {
            // Achou um jogador — bate e para
            spawnFxAt('shockwave', 'fx-shockwave', nx, ny, { duration: 600 });
            players.forEach(p => {
                if (!p.dead && p.x === nx && p.y === ny) applyDmg(p, atk);
            });
            hit = true;
            break;
        }
        spawnFxAt('hoof_stomp', 'fx-hoof-stomp', nx, ny, { duration: 400 });
        boss.x = nx;
        boss.y = ny;
        if (typeof updateVisuals === 'function') updateVisuals();
        await sleep(140);
    }

    if (!hit) {
        spawnFxAt('ground_crack', 'fx-ground-crack', boss.x, boss.y, { duration: 500 });
    }
    await sleep(300);
};

// =================================================================
// 🐗 ATO 2 — QUEIXADA
// =================================================================
STORY_ANIMAL_SKILLS['queixada_mordida'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐗 ${enemy.name} morde em linha!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('fang_bite', 'fx-fang-bite', t.x, t.y, { duration: 500 });
        }, i * 130);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['queixada_estouro'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐗 ${enemy.name} provoca um estouro de manada!`);

    // Área 1 = 8 tiles → mantém atk cheio
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('impact', 'fx-impact', t.x, t.y, { duration: 500 });
        }, i * 40);
    });

    await sleep(500);
    damagePlayersAt(tiles, atk);

    // Empurra todos 1 tile pra fora
    players.forEach(p => {
        if (p.dead) return;
        if (tiles.some(t => t.x === p.x && t.y === p.y)) {
            const dx = Math.sign(p.x - boss.x);
            const dy = Math.sign(p.y - boss.y);
            tryPushPlayer(p, dx || 0, dy || 0, 1);
        }
    });

    await sleep(300);
};

// =================================================================
// 🐍 ATO 2 — SUCURI GIGANTE (mini-boss)
// =================================================================
STORY_ANIMAL_SKILLS['sucuri_bocarra'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐍 ${enemy.name} abre a bocarra!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('jaw_snap', 'fx-jaw-snap', t.x, t.y, { duration: 500, scale: 1.2 });
        }, i * 140);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['sucuri_caudada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐍 ${enemy.name} dá uma caudada devastadora!`);

    spawnFxAt('tail_whip', 'fx-tail-whip', boss.x, boss.y, { duration: 700, scale: 1.8 });

    // Área 1 = 8 tiles → atk cheio (poucos alvos)
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('tail_whip', 'fx-tail-whip', t.x, t.y, { duration: 500 });
        }, i * 40);
    });

    await sleep(500);
    damagePlayersAt(tiles, atk);

    // Empurra 2 tiles pra fora
    players.forEach(p => {
        if (p.dead) return;
        if (tiles.some(t => t.x === p.x && t.y === p.y)) {
            const dx = Math.sign(p.x - boss.x);
            const dy = Math.sign(p.y - boss.y);
            tryPushPlayer(p, dx || 0, dy || 0, 2);
        }
    });

    await sleep(300);
};

// =================================================================
// 🦥 ATO 2 — MAPINGUARI (boss)
// =================================================================
STORY_ANIMAL_SKILLS['mapinguari_mordida'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦥 ${enemy.name} dá uma mordida poderosa!`);

    spawnFxAt('fang_bite', 'fx-fang-bite', boss.x, boss.y, { duration: 600, scale: 1.6 });

    // Área 2 = 24 tiles → atk - 1
    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    await sleep(500);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(300);
};

STORY_ANIMAL_SKILLS['mapinguari_pedras'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦥 ${enemy.name} lança pedras em 3 linhas!`);

    // 3 linhas horizontais centradas no boss = 24 tiles → atk - 2 (mín 1) ou 2 fixo
    const rows = [boss.y - 1, boss.y, boss.y + 1].filter(y => y >= 0 && y < 8);
    const tiles = [];
    rows.forEach(y => {
        for (let x = 0; x < 8; x++) {
            tiles.push({ x, y });
            setTimeout(() => {
                spawnTravelingFx('spike_burst', 'fx-spike-travel',
                    boss.x, boss.y, x, y,
                    { duration: 300 + Math.abs(x - boss.x) * 30 });
            }, Math.abs(x - boss.x) * 40);
        }
    });

    await sleep(700);
    const dmg = Math.max(1, atk - 2);
    damagePlayersAt(tiles, dmg);
    await sleep(300);
};

// =================================================================
// 🐟 ATO 3 — PIRANHA
// =================================================================
STORY_ANIMAL_SKILLS['piranha_cardume'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐟 ${enemy.name} chama o cardume!`);

    // 3 linhas adjacentes em direção ao player mais próximo
    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const midTiles = buildLineTiles(boss.x, boss.y, dir.name, 3);
    const allTiles = [];
    midTiles.forEach(mt => {
        // Adiciona o tile e os adjacentes perpendiculares
        allTiles.push(mt);
        const perpX = dir.dy !== 0 ? 1 : 0;
        const perpY = dir.dx !== 0 ? 1 : 0;
        for (let k = -1; k <= 1; k++) {
            if (k === 0) continue;
            const nx = mt.x + perpX * k;
            const ny = mt.y + perpY * k;
            if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) allTiles.push({ x: nx, y: ny });
        }
    });

    allTiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('swarm_cloud', 'fx-swarm-cloud', t.x, t.y, { duration: 500 });
        }, i * 50);
    });

    await sleep(600);
    damagePlayersAt(allTiles, atk);
    await sleep(300);
};

STORY_ANIMAL_SKILLS['piranha_frenesi'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐟 ${enemy.name} entra em frenesi!`);

    // Dano cai com distância
    spawnFxAt('swarm_cloud', 'fx-swarm-cloud', boss.x, boss.y, { duration: 700, scale: 1.4 });

    const alive = players.filter(p => !p.dead);
    await sleep(400);

    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        let dmg = atk;
        if (d >= 3) dmg = Math.max(1, atk - 1);
        // Piranha é rápida — se está adjacente recebe atk cheio, longe recebe menos
        if (d === 1) dmg = atk;
        else if (d === 2) dmg = Math.max(1, atk - 0);
        else dmg = Math.max(1, atk - 1);
        applyDmg(p, dmg);
    });

    await sleep(300);
};

// =================================================================
// 🦦 ATO 3 — LONTRA
// =================================================================
STORY_ANIMAL_SKILLS['lontra_garras'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦦 ${enemy.name} ataca com garras aquáticas!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('fin_slash', 'fx-fin-slash', t.x, t.y, { duration: 400 });
        }, i * 130);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['lontra_nado'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦦 ${enemy.name} nada rapidamente!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);

    for (let i = 0; i < 3; i++) {
        const nx = boss.x + dir.dx;
        const ny = boss.y + dir.dy;
        if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
        if (typeof isOccupied === 'function' && isOccupied(nx, ny, -1)) break;
        spawnFxAt('splash_wave', 'fx-splash-wave', nx, ny, { duration: 500 });
        boss.x = nx;
        boss.y = ny;
        if (typeof updateVisuals === 'function') updateVisuals();
        await sleep(150);
    }

    await sleep(200);
    spawnFxAt('splash_wave', 'fx-splash-wave', boss.x, boss.y, { duration: 600, scale: 1.4 });

    players.forEach(p => {
        if (!p.dead && p.x === boss.x && p.y === boss.y) applyDmg(p, atk);
    });

    await sleep(300);
};

// =================================================================
// 🦦 ATO 3 — ARIRANHA
// =================================================================
STORY_ANIMAL_SKILLS['ariranha_matilha'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦦 ${enemy.name} chama a matilha!`);

    // Ataque em cruz (4 tiles) → atk cheio
    const tiles = buildCrossTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('swarm_cloud', 'fx-swarm-cloud', t.x, t.y, { duration: 500 });
            spawnFxAt('fang_bite', 'fx-fang-bite', t.x, t.y, { duration: 450 });
        }, i * 80);
    });

    await sleep(500);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['ariranha_bote'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦦 ${enemy.name} dá o bote do rio!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('splash_wave', 'fx-splash-wave', t.x, t.y, { duration: 500 });
        }, i * 130);
    });

    await sleep(400);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🐠 ATO 3 — PIRARUCU (mini-boss)
// =================================================================
STORY_ANIMAL_SKILLS['pirarucu_bocarra'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐠 ${enemy.name} dá a bocarra!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('jaw_snap', 'fx-jaw-snap', t.x, t.y, { duration: 500, scale: 1.3 });
        }, i * 140);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['pirarucu_caudada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐠 ${enemy.name} dá uma caudada!`);

    spawnFxAt('tail_whip', 'fx-tail-whip', boss.x, boss.y, { duration: 700, scale: 1.7 });

    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('splash_wave', 'fx-splash-wave', t.x, t.y, { duration: 500 });
        }, i * 40);
    });

    await sleep(500);
    damagePlayersAt(tiles, atk);

    // Empurra 2 tiles
    players.forEach(p => {
        if (p.dead) return;
        if (tiles.some(t => t.x === p.x && t.y === p.y)) {
            const dx = Math.sign(p.x - boss.x);
            const dy = Math.sign(p.y - boss.y);
            tryPushPlayer(p, dx || 0, dy || 0, 2);
        }
    });

    await sleep(300);
};

// =================================================================
// 🧜‍♀️ ATO 3 — IARA (boss)
// =================================================================
STORY_ANIMAL_SKILLS['iara_tsunami'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🌊 ${enemy.name} invoca um tsunami!`);

    // Tabuleiro todo → dano fixo baixo
    const board = document.getElementById('board');
    if (board) {
        const wave = document.createElement('div');
        wave.style.cssText = `position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(74,140,181,0.8),transparent);animation:tsunamiAnim 1.2s ease-out;z-index:55;pointer-events:none;`;
        board.appendChild(wave);
        setTimeout(() => wave.remove(), 1300);
    }

    await sleep(600);

    // Dano 1 no tabuleiro todo
    players.forEach(p => {
        if (!p.dead) {
            applyDmg(p, 1);
            // Empurra 1 tile pra fora
            const dx = p.x < 4 ? -1 : 1;
            const dy = p.y < 4 ? -1 : 1;
            if (Math.abs(p.x - 3.5) > Math.abs(p.y - 3.5)) {
                tryPushPlayer(p, dx, 0, 1);
            } else {
                tryPushPlayer(p, 0, dy, 1);
            }
        }
    });

    await sleep(400);
};

STORY_ANIMAL_SKILLS['iara_jatos'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`💧 ${enemy.name} lança jatos d'água em cruz!`);

    // Cruz completa — atinge linha e coluna do boss
    const tiles = [];
    for (let x = 0; x < 8; x++) tiles.push({ x, y: boss.y });
    for (let y = 0; y < 8; y++) if (y !== boss.y) tiles.push({ x: boss.x, y });

    // FX em cruz
    spawnFxAt('splash_wave', 'fx-splash-wave', boss.x, boss.y, { duration: 700 });
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('splash_wave', 'fx-splash-wave', t.x, t.y, { duration: 400, scale: 0.7 });
        }, i * 20);
    });

    await sleep(600);

    // Só atinge quem está na cruz → poucos alvos → mantém atk
    const cruxSet = new Set(tiles.map(t => `${t.x},${t.y}`));
    players.forEach(p => {
        if (p.dead) return;
        if (cruxSet.has(`${p.x},${p.y}`)) applyDmg(p, atk);
    });

    await sleep(300);
};

// =================================================================
// 🐍 ATO 4 — CASCAVEL
// =================================================================
STORY_ANIMAL_SKILLS['cascavel_chocalho'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐍 ${enemy.name} agita o chocalho e ataca tiles de AR!`);

    let count = 0;
    grid.forEach((element, idx) => {
        if (element === 'AR') {
            const x = idx % 8;
            const y = Math.floor(idx / 8);
            spawnFxAt('sting_venom', 'fx-sting-venom', x, y, { duration: 700, delay: count * 40 });
            players.forEach(p => {
                if (!p.dead && p.x === x && p.y === y) {
                    setTimeout(() => applyDmg(p, atk), count * 40);
                }
            });
            count++;
        }
    });

    addLog(`🐍 ${count} tiles de AR foram atingidos!`);
    await sleep(700);
};

STORY_ANIMAL_SKILLS['cascavel_bote'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐍 ${enemy.name} dá o bote peçonhento!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('sting_venom', 'fx-sting-venom', t.x, t.y, { duration: 600 });
            spawnFxAt('fang_bite', 'fx-fang-bite', t.x, t.y, { duration: 450 });
        }, i * 140);
    });

    await sleep(430);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🐍 ATO 4 — COBRA-CORAL
// =================================================================
STORY_ANIMAL_SKILLS['coral_aneis'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐍 ${enemy.name} enrola em anéis coloridos!`);

    // Ataque em 3 tiles: esquerda, direita e frente (V)
    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = [];
    const frontX = boss.x + dir.dx;
    const frontY = boss.y + dir.dy;
    if (frontX >= 0 && frontX < 8 && frontY >= 0 && frontY < 8) tiles.push({ x: frontX, y: frontY });
    // Laterais
    const perpX = dir.dy !== 0 ? 1 : 0;
    const perpY = dir.dx !== 0 ? 1 : 0;
    [[1,0],[-1,0]].forEach(([k]) => {
        const nx = frontX + perpX * k;
        const ny = frontY + perpY * k;
        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push({ x: nx, y: ny });
    });

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('coil_wrap', 'fx-coil-wrap', t.x, t.y, { duration: 600 });
        }, i * 100);
    });

    await sleep(450);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['coral_peconha'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐍 ${enemy.name} espirra peçonha!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('sting_venom', 'fx-sting-venom', t.x, t.y, { duration: 700 });
        }, i * 130);
    });

    await sleep(430);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🐍 ATO 4 — JARARACA
// =================================================================
STORY_ANIMAL_SKILLS['jararaca_bote'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐍 ${enemy.name} dá o bote traiçoeiro!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('fang_bite', 'fx-fang-bite', t.x, t.y, { duration: 500 });
            spawnFxAt('sting_venom', 'fx-sting-venom', t.x, t.y, { duration: 600 });
        }, i * 140);
    });

    await sleep(430);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['jararaca_enrolar'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐍 ${enemy.name} enrola e puxa!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    spawnFxAt('coil_wrap', 'fx-coil-wrap', nearest.x, nearest.y, { duration: 700, scale: 1.3 });
    await sleep(400);
    applyDmg(nearest, atk);
    // Puxa 1 tile na direção do boss
    tryPullPlayer(nearest, boss.x, boss.y, 1);

    await sleep(300);
};

// =================================================================
// 🐢 ATO 4 — TARTARUGA (mini-boss)
// =================================================================
STORY_ANIMAL_SKILLS['tartaruga_casco'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐢 ${enemy.name} ergue o casco duro!`);

    // Área 1 = 8 tiles → mantém atk cheio
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('shockwave', 'fx-shockwave', t.x, t.y, { duration: 600, scale: 0.9 });
        }, i * 40);
    });

    await sleep(500);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['tartaruga_pancada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐢 ${enemy.name} dá uma pancada pesada!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('hoof_stomp', 'fx-hoof-stomp', t.x, t.y, { duration: 500, scale: 1.3 });
            spawnFxAt('ground_crack', 'fx-ground-crack', t.x, t.y, { duration: 500 });
        }, i * 130);
    });

    await sleep(430);
    damagePlayersAt(tiles, atk);

    // Empurra 1 tile
    tiles.forEach(t => {
        players.forEach(p => {
            if (!p.dead && p.x === t.x && p.y === t.y) {
                tryPushPlayer(p, dir.dx, dir.dy, 1);
            }
        });
    });

    await sleep(300);
};

// =================================================================
// 🔥 ATO 4 — BOITATÁ (boss)
// =================================================================
STORY_ANIMAL_SKILLS['boitata_colunas'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🔥 ${enemy.name} lança colunas de fogo!`);

    const columns = [boss.x - 1, boss.x, boss.x + 1].filter(c => c >= 0 && c <= 7);

    columns.forEach(col => {
        // FX: coluna subindo
        if (typeof triggerFireColumn === 'function') {
            triggerFireColumn(col);
        } else {
            for (let y = 0; y < 8; y++) {
                spawnFxAt('flame_short', 'fx-flame-short', col, y, { duration: 500, delay: y * 30 });
            }
        }
    });

    await sleep(600);

    // Só atinge quem está nas colunas → mantém atk
    players.forEach(p => {
        if (!p.dead && columns.includes(p.x)) applyDmg(p, atk);
    });

    await sleep(300);
};

STORY_ANIMAL_SKILLS['boitata_explosoes'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🔥 ${enemy.name} invoca explosões em tiles de FOGO!`);

    let count = 0, attempts = 0;
    while (count < 5 && attempts < 50) {
        const idx = Math.floor(Math.random() * 64);
        if (grid[idx] === 'FOGO') {
            const x = idx % 8;
            const y = Math.floor(idx / 8);
            spawnFxAt('flame_short', 'fx-flame-short', x, y, { duration: 700, scale: 1.3 });
            players.forEach(p => {
                if (!p.dead && p.x === x && p.y === y) applyDmg(p, atk);
            });
            count++;
        }
        attempts++;
    }

    addLog(`🔥 ${count} explosões em tiles de FOGO!`);
    await sleep(600);
};

// =================================================================
// 🐐 ATO 5 — BODE
// =================================================================
STORY_ANIMAL_SKILLS['bode_cornada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐐 ${enemy.name} dá uma cornada!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 1);

    spawnFxAt('antler_charge', 'fx-antler-charge', boss.x + dir.dx, boss.y + dir.dy, { duration: 500 });

    await sleep(380);
    damagePlayersAt(tiles, atk);
    await sleep(220);
};

STORY_ANIMAL_SKILLS['bode_marrada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐐 ${enemy.name} dá uma marrada!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('antler_charge', 'fx-antler-charge', t.x, t.y, { duration: 450 });
        }, i * 130);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);

    tiles.forEach(t => {
        players.forEach(p => {
            if (!p.dead && p.x === t.x && p.y === t.y) {
                tryPushPlayer(p, dir.dx, dir.dy, 1);
            }
        });
    });

    await sleep(280);
};

// =================================================================
// 🐏 ATO 5 — CARNEIRO SELVAGEM
// =================================================================
STORY_ANIMAL_SKILLS['carneiro_trombada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐏 ${enemy.name} tromba!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('hoof_stomp', 'fx-hoof-stomp', t.x, t.y, { duration: 450 });
        }, i * 130);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['carneiro_pisada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐏 ${enemy.name} pisa com força!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('hoof_stomp', 'fx-hoof-stomp', t.x, t.y, { duration: 500 });
        }, i * 40);
    });

    await sleep(500);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🐎 ATO 5 — CAVALO SELVAGEM
// =================================================================
STORY_ANIMAL_SKILLS['cavalo_coice'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐎 ${enemy.name} dá um coice!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('hoof_stomp', 'fx-hoof-stomp', t.x, t.y, { duration: 450, scale: 1.2 });
        }, i * 130);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);

    tiles.forEach(t => {
        players.forEach(p => {
            if (!p.dead && p.x === t.x && p.y === t.y) {
                tryPushPlayer(p, dir.dx, dir.dy, 1);
            }
        });
    });

    await sleep(280);
};

STORY_ANIMAL_SKILLS['cavalo_relincho'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐎 ${enemy.name} relincha furiosamente!`);

    // Área 2 = 24 tiles → atk - 1
    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t, i) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => {
            spawnFxAt('shockwave', 'fx-shockwave', t.x, t.y, { duration: 500, scale: 0.8 });
        }, dist * 50);
    });

    await sleep(550);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

// =================================================================
// 🐂 ATO 5 — TOURO BRAVO (mini-boss)
// =================================================================
STORY_ANIMAL_SKILLS['touro_cornada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐂 ${enemy.name} dá uma cornada violenta!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('antler_charge', 'fx-antler-charge', t.x, t.y, { duration: 500, scale: 1.3 });
        }, i * 130);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);

    tiles.forEach(t => {
        players.forEach(p => {
            if (!p.dead && p.x === t.x && p.y === t.y) {
                tryPushPlayer(p, dir.dx, dir.dy, 1);
            }
        });
    });

    await sleep(280);
};

STORY_ANIMAL_SKILLS['touro_pisoteada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐂 ${enemy.name} pisoteia o chão!`);

    // Área 2 → atk - 1
    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t, i) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => {
            spawnFxAt('ground_crack', 'fx-ground-crack', t.x, t.y, { duration: 500 });
            if (dist === 1) spawnFxAt('hoof_stomp', 'fx-hoof-stomp', t.x, t.y, { duration: 500 });
        }, dist * 55);
    });

    await sleep(550);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

// =================================================================
// 🐴 ATO 5 — MULA SEM CABEÇA (boss)
// =================================================================
STORY_ANIMAL_SKILLS['mula_relincho'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐴 ${enemy.name} relincha fogo em 3 colunas!`);

    const columns = [boss.x - 1, boss.x, boss.x + 1].filter(c => c >= 0 && c <= 7);

    columns.forEach(col => {
        if (typeof triggerFireColumn === 'function') {
            triggerFireColumn(col);
        } else {
            for (let y = 0; y < 8; y++) {
                spawnFxAt('flame_short', 'fx-flame-short', col, y, { duration: 500, delay: y * 30 });
            }
        }
    });

    await sleep(600);

    players.forEach(p => {
        if (!p.dead && columns.includes(p.x)) applyDmg(p, atk);
    });

    await sleep(300);
};

STORY_ANIMAL_SKILLS['mula_bolas'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐴 ${enemy.name} lança bolas de fogo!`);

    const dirs = [
        { dx: 2, dy: 0 }, { dx: -2, dy: 0 },
        { dx: 0, dy: 2 }, { dx: 0, dy: -2 }
    ];

    dirs.forEach(dir => {
        const tx = boss.x + dir.dx;
        const ty = boss.y + dir.dy;
        if (tx < 0 || tx >= 8 || ty < 0 || ty >= 8) return;

        spawnTravelingFx('flame_short', 'fx-flame-short', boss.x, boss.y, tx, ty, {
            duration: 400,
        });
        players.forEach(p => {
            if (!p.dead && p.x === tx && p.y === ty) {
                setTimeout(() => applyDmg(p, atk), 420);
            }
        });
    });

    await sleep(800);
};

// =================================================================
// 🦅 ATO 6 — URUBU
// =================================================================
STORY_ANIMAL_SKILLS['urubu_voo'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦅 ${enemy.name} faz voo rasante!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('wing_gust', 'fx-wing-gust', t.x, t.y, { duration: 500 });
            spawnFxAt('peck_beak', 'fx-peck-beak', t.x, t.y, { duration: 400 });
        }, i * 130);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['urubu_bicada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦅 ${enemy.name} dá uma bicada!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    spawnFxAt('peck_beak', 'fx-peck-beak', nearest.x, nearest.y, { duration: 450, scale: 1.3 });

    await sleep(380);
    players.forEach(p => {
        if (!p.dead && p.x === nearest.x && p.y === nearest.y) applyDmg(p, atk);
    });
    await sleep(220);
};

// =================================================================
// 🦅 ATO 6 — CARCARÁ
// =================================================================
STORY_ANIMAL_SKILLS['carcara_garras'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦅 ${enemy.name} ataca com garras afiadas!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 450 });
        }, i * 40);
    });

    await sleep(480);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['carcara_mergulho'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦅 ${enemy.name} mergulha mortalmente!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 3);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('wing_gust', 'fx-wing-gust', t.x, t.y, { duration: 400, scale: 0.7 });
        }, i * 100);
    });

    await sleep(450);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🦔 ATO 6 — TATU
// =================================================================
STORY_ANIMAL_SKILLS['tatu_casco'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦔 ${enemy.name} endurece o casco!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('shockwave', 'fx-shockwave', t.x, t.y, { duration: 550, scale: 0.9 });
        }, i * 40);
    });

    await sleep(500);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['tatu_cavar'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦔 ${enemy.name} cava uma armadilha!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const tx = nearest.x;
    const ty = nearest.y;

    // FX: buraco abrindo
    spawnFxAt('ground_crack', 'fx-ground-crack', tx, ty, { duration: 600, scale: 1.3 });
    await sleep(400);

    // Dano se ainda estiver no tile
    players.forEach(p => {
        if (!p.dead && p.x === tx && p.y === ty) applyDmg(p, atk);
    });

    await sleep(280);
};

// =================================================================
// 🐺 ATO 6 — LOBO-GUARÁ (mini-boss)
// =================================================================
STORY_ANIMAL_SKILLS['lobo_guara_uivo'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐺 ${enemy.name} uiva!`);

    // Área 2 → atk - 1
    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t, i) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => {
            spawnFxAt('shockwave', 'fx-shockwave', t.x, t.y, { duration: 500, scale: 0.9 });
        }, dist * 55);
    });

    await sleep(550);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

STORY_ANIMAL_SKILLS['lobo_guara_bote'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐺 ${enemy.name} dá o bote selvagem!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('fang_bite', 'fx-fang-bite', t.x, t.y, { duration: 500 });
        }, i * 130);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 💀 ATO 6 — CORPO SECO (boss)
// =================================================================
STORY_ANIMAL_SKILLS['corpo_seco_vapor'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`💀 ${enemy.name} sopra vapor podre em 8 direções!`);

    // 8 tiles em volta (adjacentes e 2ª camada nas direções cardeais)
    const dirs = [
        { dx: 0, dy: -1 }, { dx: 0, dy: -2 },
        { dx: 0, dy: 1 }, { dx: 0, dy: 2 },
        { dx: -1, dy: 0 }, { dx: -2, dy: 0 },
        { dx: 1, dy: 0 }, { dx: 2, dy: 0 }
    ];

    const tiles = [];
    dirs.forEach(dir => {
        const tx = boss.x + dir.dx;
        const ty = boss.y + dir.dy;
        if (tx < 0 || tx >= 8 || ty < 0 || ty >= 8) return;
        tiles.push({ x: tx, y: ty });
        spawnFxAt('sting_venom', 'fx-sting-venom', tx, ty, { duration: 700 });
    });

    await sleep(600);
    damagePlayersAt(tiles, atk);
    await sleep(300);
};

STORY_ANIMAL_SKILLS['corpo_seco_garras'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`💀 ${enemy.name} ataca com garras em um quadrante!`);

    // Ataque em quadrante (área 3x3 em direção ao jogador mais próximo)
    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = [];
    const perpX = dir.dy !== 0 ? 1 : 0;
    const perpY = dir.dx !== 0 ? 1 : 0;

    for (let k = -1; k <= 1; k++) {
        for (let j = 1; j <= 2; j++) {
            const nx = boss.x + dir.dx * j + perpX * k;
            const ny = boss.y + dir.dy * j + perpY * k;
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) continue;
            tiles.push({ x: nx, y: ny });
        }
    }

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 500, scale: 1.1 });
            playSfx('garras');
        }, i * 60);
    });

    await sleep(500);
    // 6 tiles → atk + 0 (poucos alvos, mas dano aumentado é do boss original)
    // Respeitando regra: multi-alvo pequeno = atk cheio
    damagePlayersAt(tiles, atk);
    await sleep(300);
};

// =================================================================
// 🐕 ATO 7 — CACHORRO-DO-MATO
// =================================================================
STORY_ANIMAL_SKILLS['cachorro_mordida'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐕 ${enemy.name} morde!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('fang_bite', 'fx-fang-bite', t.x, t.y, { duration: 500 });
        }, i * 130);
    });

    await sleep(400);
    damagePlayersAt(tiles, atk);
    await sleep(220);
};

STORY_ANIMAL_SKILLS['cachorro_rosnado'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐕 ${enemy.name} rosna ferozmente!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('fang_bite', 'fx-fang-bite', t.x, t.y, { duration: 450, scale: 0.8 });
        }, i * 40);
    });

    await sleep(480);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🦊 ATO 7 — RAPOSA
// =================================================================
STORY_ANIMAL_SKILLS['raposa_astucia'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦊 ${enemy.name} usa de astúcia!`);

    // Raposa ataca por trás — pega o tile atrás do jogador mais próximo
    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('fang_bite', 'fx-fang-bite', t.x, t.y, { duration: 500, scale: 0.9 });
        }, i * 130);
    });

    await sleep(400);
    damagePlayersAt(tiles, atk);
    await sleep(220);
};

STORY_ANIMAL_SKILLS['raposa_bote'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦊 ${enemy.name} dá um bote ágil!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);

    // Raposa pula 2 tiles e ataca no destino
    for (let i = 0; i < 2; i++) {
        const nx = boss.x + dir.dx;
        const ny = boss.y + dir.dy;
        if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
        if (typeof isOccupied === 'function' && isOccupied(nx, ny, -1)) break;
        spawnFxAt('pounce_arc', 'fx-pounce-arc', nx, ny, { duration: 500, scale: 0.7 });
        boss.x = nx;
        boss.y = ny;
        if (typeof updateVisuals === 'function') updateVisuals();
        await sleep(160);
    }

    await sleep(200);
    players.forEach(p => {
        if (!p.dead && p.x === boss.x && p.y === boss.y) applyDmg(p, atk);
    });

    await sleep(280);
};

// =================================================================
// 🦝 ATO 7 — GUAXINIM
// =================================================================
STORY_ANIMAL_SKILLS['guaxinim_garras'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦝 ${enemy.name} ataca com garras noturnas!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 450 });
        }, i * 40);
    });

    await sleep(480);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['guaxinim_surpresa'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦝 ${enemy.name} ataca de surpresa!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 3);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('fang_bite', 'fx-fang-bite', t.x, t.y, { duration: 450 });
        }, i * 110);
    });

    await sleep(400);
    damagePlayersAt(tiles, atk);
    await sleep(220);
};

// =================================================================
// 🐆 ATO 7 — JAGUATIRICA (mini-boss)
// =================================================================
STORY_ANIMAL_SKILLS['jaguatirica_garras'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐆 ${enemy.name} ataca com garras selvagens!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t, i) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => {
            spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 500, scale: 0.9 });
        }, dist * 55);
    });

    await sleep(550);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

STORY_ANIMAL_SKILLS['jaguatirica_salto'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐆 ${enemy.name} dá um salto mortal!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const fromX = boss.x, fromY = boss.y;
    let landX = Math.max(0, Math.min(7, boss.x + dir.dx * 2));
    let landY = Math.max(0, Math.min(7, boss.y + dir.dy * 2));

    spawnFxAt('pounce_arc', 'fx-pounce-arc', fromX, fromY, { duration: 700, scale: 1.3 });

    boss.x = landX;
    boss.y = landY;
    if (typeof updateVisuals === 'function') updateVisuals();
    await sleep(350);

    spawnFxAt('shockwave', 'fx-shockwave', landX, landY, { duration: 600, scale: 1.4 });
    spawnFxAt('impact', 'fx-impact', landX, landY, { duration: 500 });

    const tiles = buildAreaTiles(landX, landY, 1, true);
    const dmg = Math.max(1, atk - 1);
    await sleep(300);
    damagePlayersAt(tiles, dmg);
    await sleep(300);
};

// =================================================================
// 🐺 ATO 7 — LOBISOMEM (boss)
// =================================================================
STORY_ANIMAL_SKILLS['lobisomem_garras'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐺 ${enemy.name} ataca com garras da fera!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 500, scale: 1.2 });
            playSfx('garras');
        }, i * 50);
    });

    await sleep(500);
    damagePlayersAt(tiles, atk);
    await sleep(280);
};

STORY_ANIMAL_SKILLS['lobisomem_tremor'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐺 ${enemy.name} faz a terra tremer!`);

    // Tremor: rachaduras em área 2 + puxa heróis para perto
    if (typeof triggerEarthquake === 'function') triggerEarthquake();
    await sleep(300);

    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t, i) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => {
            if (dist === 1) spawnFxAt('ground_crack', 'fx-ground-crack', t.x, t.y, { duration: 500 });
        }, dist * 55);
    });

    await sleep(450);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);

    // Puxa todos 1 tile na direção do boss
    players.forEach(p => {
        if (!p.dead) tryPullPlayer(p, boss.x, boss.y, 1);
    });

    await sleep(300);
};

// =================================================================
// 🏁 FIM DA PARTE 4/5
// =================================================================
// =================================================================
// historia.js — V6.0 — Bloco 5/5
// Handlers Atos 8-13 + applyStorySkill + morte + overrides + init
// =================================================================

// =================================================================
// 🦇 ATO 8 — MORCEGO
// =================================================================
STORY_ANIMAL_SKILLS['morcego_voo'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦇 ${enemy.name} faz voo sombrio!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('wing_gust', 'fx-wing-gust', t.x, t.y, { duration: 450 });
            spawnFxAt('swarm_cloud', 'fx-swarm-cloud', t.x, t.y, { duration: 500, scale: 0.8 });
        }, i * 130);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['morcego_eco'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦇 ${enemy.name} emite um eco estridente!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('shockwave', 'fx-shockwave', t.x, t.y, { duration: 500, scale: 0.9 });
            spawnFxAt('spectral_veil', 'fx-spectral-veil', t.x, t.y, { duration: 500, scale: 0.5 });
        }, i * 40);
    });

    await sleep(500);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🦉 ATO 8 — CORUJA
// =================================================================
STORY_ANIMAL_SKILLS['coruja_garras'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦉 ${enemy.name} ataca com garras noturnas!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 450 });
            spawnFxAt('fog_cloud', 'fx-fog-cloud', t.x, t.y, { duration: 600, scale: 0.7 });
        }, i * 45);
    });

    await sleep(500);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['coruja_voo'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦉 ${enemy.name} faz voo silencioso!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 3);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('fog_cloud', 'fx-fog-cloud', t.x, t.y, { duration: 500, scale: 0.7 });
        }, i * 100);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🐸 ATO 8 — SAPO-CURURU
// =================================================================
STORY_ANIMAL_SKILLS['sapo_veneno'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐸 ${enemy.name} espirra veneno em cruz!`);

    const tiles = buildCrossTiles(boss.x, boss.y, 2, false);

    spawnFxAt('sting_venom', 'fx-sting-venom', boss.x, boss.y, { duration: 700, scale: 1.5 });
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('sting_venom', 'fx-sting-venom', t.x, t.y, { duration: 700, scale: 0.8 });
        }, i * 50);
    });

    await sleep(600);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['sapo_lingua'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐸 ${enemy.name} lança a língua pegajosa!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('fin_slash', 'fx-fin-slash', t.x, t.y, { duration: 450, scale: 0.9 });
        }, i * 130);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);

    // Puxa o herói acertado 1 tile em direção ao sapo
    tiles.forEach(t => {
        players.forEach(p => {
            if (!p.dead && p.x === t.x && p.y === t.y) {
                tryPullPlayer(p, boss.x, boss.y, 1);
            }
        });
    });

    await sleep(250);
};

// =================================================================
// 🐦 ATO 8 — SERIEMA (mini-boss)
// =================================================================
STORY_ANIMAL_SKILLS['seriema_bicada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐦 ${enemy.name} dá uma bicada feroz!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('peck_beak', 'fx-peck-beak', t.x, t.y, { duration: 450, scale: 1.3 });
        }, i * 130);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['seriema_grito'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐦 ${enemy.name} dá um grito de guerra!`);

    // Área 2 → atk - 1
    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t, i) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => {
            spawnFxAt('shockwave', 'fx-shockwave', t.x, t.y, { duration: 500, scale: 0.9 });
        }, dist * 55);
    });

    await sleep(550);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

// =================================================================
// 🧙‍♀️ ATO 8 — CUCA (boss)
// =================================================================
STORY_ANIMAL_SKILLS['cuca_pocao'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🧙 ${enemy.name} lança uma poção corrompida em um quadrante!`);

    const qx = Math.random() < 0.5 ? 0 : 4;
    const qy = Math.random() < 0.5 ? 0 : 4;

    // 4x4 = 16 tiles → atk - 1
    const tiles = [];
    for (let x = qx; x < qx + 4; x++) {
        for (let y = qy; y < qy + 4; y++) {
            if (x < 0 || x >= 8 || y < 0 || y >= 8) continue;
            tiles.push({ x, y });
            spawnFxAt('sting_venom', 'fx-sting-venom', x, y, {
                duration: 700,
                delay: (x - qx) * 40 + (y - qy) * 40,
            });
        }
    }

    await sleep(700);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(300);
};

STORY_ANIMAL_SKILLS['cuca_cura'] = async (enemy, skill) => {
    addLog(`🧙 ${enemy.name} bebe uma poção curativa!`);

    spawnHealOrb(boss.x, boss.y);
    playSfx('cucask2');

    await sleep(600);
    boss.hp = Math.min(boss.maxHp, boss.hp + 2);
    if (typeof showHealEffect === 'function') showHealEffect(boss.x, boss.y, 2);
    if (typeof updateVisuals === 'function') updateVisuals();
    addLog(`💊 ${enemy.name} recuperou 2 HP!`);

    await sleep(400);
};

// =================================================================
// 🐟 ATO 9 — TUCUNARÉ
// =================================================================
STORY_ANIMAL_SKILLS['tucunare_bote'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐟 ${enemy.name} dá o bote aquático!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('splash_wave', 'fx-splash-wave', t.x, t.y, { duration: 500 });
            spawnFxAt('fang_bite', 'fx-fang-bite', t.x, t.y, { duration: 450 });
        }, i * 130);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['tucunare_cardume'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐟 ${enemy.name} chama o cardume!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('swarm_cloud', 'fx-swarm-cloud', t.x, t.y, { duration: 500 });
        }, i * 45);
    });

    await sleep(500);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🐟 ATO 9 — PIRAÍBA
// =================================================================
STORY_ANIMAL_SKILLS['piraiba_bocarra'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐟 ${enemy.name} dá a bocarra!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('jaw_snap', 'fx-jaw-snap', t.x, t.y, { duration: 500, scale: 1.3 });
        }, i * 130);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['piraiba_caudada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐟 ${enemy.name} dá uma caudada!`);

    spawnFxAt('tail_whip', 'fx-tail-whip', boss.x, boss.y, { duration: 700, scale: 1.6 });

    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('splash_wave', 'fx-splash-wave', t.x, t.y, { duration: 500, scale: 0.8 });
        }, i * 40);
    });

    await sleep(500);
    damagePlayersAt(tiles, atk);

    players.forEach(p => {
        if (p.dead) return;
        if (tiles.some(t => t.x === p.x && t.y === p.y)) {
            const dx = Math.sign(p.x - boss.x);
            const dy = Math.sign(p.y - boss.y);
            tryPushPlayer(p, dx || 0, dy || 0, 2);
        }
    });

    await sleep(300);
};

// =================================================================
// 🐟 ATO 9 — DOURADA
// =================================================================
STORY_ANIMAL_SKILLS['dourada_escamas'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐟 ${enemy.name} ergue as escamas douradas!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('fin_slash', 'fx-fin-slash', t.x, t.y, { duration: 450 });
            spawnFxAt('element_pulse', 'fx-element-pulse', t.x, t.y, { duration: 500, scale: 0.8 });
        }, i * 45);
    });

    await sleep(500);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['dourada_nado'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐟 ${enemy.name} nada rapidamente!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 3);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('splash_wave', 'fx-splash-wave', t.x, t.y, { duration: 400, scale: 0.7 });
        }, i * 100);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🦭 ATO 9 — PEIXE-BOI (mini-boss)
// =================================================================
STORY_ANIMAL_SKILLS['peixe_boi_corpulencia'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦭 ${enemy.name} usa a corpulência!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t, i) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => {
            spawnFxAt('splash_wave', 'fx-splash-wave', t.x, t.y, { duration: 500, scale: 0.9 });
        }, dist * 55);
    });

    await sleep(550);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

STORY_ANIMAL_SKILLS['peixe_boi_pancada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦭 ${enemy.name} dá uma pancada na água!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('splash_wave', 'fx-splash-wave', t.x, t.y, { duration: 500, scale: 1.2 });
            spawnFxAt('shockwave', 'fx-shockwave', t.x, t.y, { duration: 500, scale: 0.9 });
        }, i * 130);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🐬 ATO 9 — BOTO ROSA (boss)
// =================================================================
STORY_ANIMAL_SKILLS['boto_coracoes'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐬 ${enemy.name} quebra corações na área!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('impact', 'fx-impact', t.x, t.y, { duration: 500, scale: 1.1 });
            spawnFxAt('element_pulse', 'fx-element-pulse', t.x, t.y, { duration: 600, scale: 0.9 });
        }, i * 50);
    });

    await sleep(500);
    damagePlayersAt(tiles, atk);
    await sleep(280);
};

STORY_ANIMAL_SKILLS['boto_jatos'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐬 ${enemy.name} lança jatos em cruz!`);

    const tiles = [];
    for (let y = 0; y < 8; y++) tiles.push({ x: boss.x, y });
    for (let x = 0; x < 8; x++) if (x !== boss.x) tiles.push({ x, y: boss.y });

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('splash_wave', 'fx-splash-wave', t.x, t.y, { duration: 500, scale: 0.7 });
        }, i * 20);
    });

    await sleep(600);

    const cruxSet = new Set(tiles.map(t => `${t.x},${t.y}`));
    players.forEach(p => {
        if (p.dead) return;
        if (cruxSet.has(`${p.x},${p.y}`)) applyDmg(p, atk);
    });

    await sleep(280);
};

// =================================================================
// 🐃 ATO 10 — BÚFALO SELVAGEM
// =================================================================
STORY_ANIMAL_SKILLS['bufalo_marrada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐃 ${enemy.name} dá uma marrada selvagem!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('antler_charge', 'fx-antler-charge', t.x, t.y, { duration: 500 });
            spawnFxAt('hoof_stomp', 'fx-hoof-stomp', t.x, t.y, { duration: 500, scale: 0.9 });
        }, i * 130);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);

    tiles.forEach(t => {
        players.forEach(p => {
            if (!p.dead && p.x === t.x && p.y === t.y) {
                tryPushPlayer(p, dir.dx, dir.dy, 1);
            }
        });
    });

    await sleep(280);
};

STORY_ANIMAL_SKILLS['bufalo_pisoteada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐃 ${enemy.name} pisoteia o chão!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t, i) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => {
            spawnFxAt('ground_crack', 'fx-ground-crack', t.x, t.y, { duration: 500 });
            if (dist === 1) spawnFxAt('hoof_stomp', 'fx-hoof-stomp', t.x, t.y, { duration: 500 });
        }, dist * 55);
    });

    await sleep(550);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

// =================================================================
// 🐄 ATO 10 — VACA LOUCA
// =================================================================
STORY_ANIMAL_SKILLS['vaca_coice'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐄 ${enemy.name} dá um coice!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('hoof_stomp', 'fx-hoof-stomp', t.x, t.y, { duration: 450, scale: 1.2 });
        }, i * 130);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['vaca_mugido'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐄 ${enemy.name} dá um mugido de fúria!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('shockwave', 'fx-shockwave', t.x, t.y, { duration: 500, scale: 0.9 });
        }, i * 45);
    });

    await sleep(500);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🐐 ATO 10 — CABRA PRETA
// =================================================================
STORY_ANIMAL_SKILLS['cabra_cornada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐐 ${enemy.name} dá uma cornada!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 1);

    spawnFxAt('antler_charge', 'fx-antler-charge', boss.x + dir.dx, boss.y + dir.dy, { duration: 500, scale: 1.2 });

    await sleep(380);
    damagePlayersAt(tiles, atk);
    await sleep(220);
};

STORY_ANIMAL_SKILLS['cabra_bote'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐐 ${enemy.name} dá um bote agourento!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('antler_charge', 'fx-antler-charge', t.x, t.y, { duration: 450 });
        }, i * 130);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🐂 ATO 10 — ZEBU (mini-boss)
// =================================================================
STORY_ANIMAL_SKILLS['zebu_marrada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐂 ${enemy.name} dá uma marrada bruta!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('antler_charge', 'fx-antler-charge', t.x, t.y, { duration: 500, scale: 1.3 });
        }, i * 130);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['zebu_pisada'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐂 ${enemy.name} dá uma pisada pesada!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t, i) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => {
            spawnFxAt('ground_crack', 'fx-ground-crack', t.x, t.y, { duration: 500 });
            if (dist === 1) spawnFxAt('hoof_stomp', 'fx-hoof-stomp', t.x, t.y, { duration: 500, scale: 1.1 });
        }, dist * 55);
    });

    await sleep(550);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

// =================================================================
// 🐂 ATO 10 — BOI DA CARA PRETA (boss)
// =================================================================
STORY_ANIMAL_SKILLS['boi_face'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐂 ${enemy.name} mostra a face assustadora!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);

    // Face + embaralhar tiles
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('impact', 'fx-impact', t.x, t.y, { duration: 500, scale: 1.2 });
        }, i * 40);
    });

    await sleep(500);
    damagePlayersAt(tiles, atk);

    // Embaralha tiles ao redor
    tiles.forEach(t => {
        const idx = t.y * 8 + t.x;
        const newColor = COLORS[Math.floor(Math.random() * 4)];
        grid[idx] = newColor;
        const tile = document.querySelectorAll('#grid .tile')[idx];
        if (tile) tile.className = `tile bg-${newColor}`;
        spawnFxAt('tile_flip', 'fx-tile-flip', t.x, t.y, { duration: 600, delay: 50 });
    });

    addLog(`🌪️ Tiles ao redor foram embaralhados!`);
    await sleep(300);
};

STORY_ANIMAL_SKILLS['boi_empurrao'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐂 ${enemy.name} empurra os heróis para as bordas!`);

    players.forEach(p => {
        if (p.dead) return;
        let nx = p.x, ny = p.y;
        if (p.x < 4) nx = Math.max(0, p.x - 1);
        else nx = Math.min(7, p.x + 1);
        if (p.y < 4) ny = Math.max(0, p.y - 1);
        else ny = Math.min(7, p.y + 1);

        const dirX = Math.sign(nx - p.x);
        const dirY = Math.sign(ny - p.y);
        tryPushPlayer(p, dirX, dirY, 1);

        // Dano leve do empurrão
        applyDmg(p, Math.max(1, atk - 3));
    });

    await sleep(500);
};

// =================================================================
// 🐈 ATO 11 — GATO-DO-MATO
// =================================================================
STORY_ANIMAL_SKILLS['gato_mato_garras'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐈 ${enemy.name} ataca com garras noturnas!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 450 });
        }, i * 40);
    });

    await sleep(480);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['gato_mato_salto'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐈 ${enemy.name} dá um salto silencioso!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const fromX = boss.x, fromY = boss.y;
    const landX = Math.max(0, Math.min(7, boss.x + dir.dx * 2));
    const landY = Math.max(0, Math.min(7, boss.y + dir.dy * 2));

    spawnFxAt('pounce_arc', 'fx-pounce-arc', fromX, fromY, { duration: 600, scale: 1.1 });
    boss.x = landX;
    boss.y = landY;
    if (typeof updateVisuals === 'function') updateVisuals();
    await sleep(350);

    spawnFxAt('claw_slash', 'fx-claw-slash', landX, landY, { duration: 500, scale: 1.3 });

    const tiles = buildAreaTiles(landX, landY, 1, true);
    await sleep(250);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🦋 ATO 11 — MARIPOSA GIGANTE
// =================================================================
STORY_ANIMAL_SKILLS['mariposa_po'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦋 ${enemy.name} espalha pó lunar!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t, i) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => {
            spawnFxAt('fog_cloud', 'fx-fog-cloud', t.x, t.y, { duration: 700, scale: 0.9 });
            spawnFxAt('element_pulse', 'fx-element-pulse', t.x, t.y, { duration: 700, scale: 0.7 });
        }, dist * 55);
    });

    await sleep(600);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

STORY_ANIMAL_SKILLS['mariposa_voo'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦋 ${enemy.name} faz voo rasante!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 3);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('wing_gust', 'fx-wing-gust', t.x, t.y, { duration: 450, scale: 0.8 });
        }, i * 100);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🦝 ATO 11 — QUATI
// =================================================================
STORY_ANIMAL_SKILLS['quati_garras'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦝 ${enemy.name} ataca com garras afiadas!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 450, scale: 0.9 });
        }, i * 40);
    });

    await sleep(480);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['quati_bote'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦝 ${enemy.name} dá um bote rápido!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 2);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('fang_bite', 'fx-fang-bite', t.x, t.y, { duration: 450, scale: 0.9 });
        }, i * 130);
    });

    await sleep(400);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🐆 ATO 11 — SUÇUARANA (mini-boss)
// =================================================================
STORY_ANIMAL_SKILLS['sucuarana_garra'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐆 ${enemy.name} dá uma garra fatal!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t, i) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => {
            spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 500, scale: 1.1 });
        }, dist * 55);
    });

    await sleep(550);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

STORY_ANIMAL_SKILLS['sucuarana_salto'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🐆 ${enemy.name} dá um salto mortal!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const fromX = boss.x, fromY = boss.y;
    const landX = Math.max(0, Math.min(7, boss.x + dir.dx * 2));
    const landY = Math.max(0, Math.min(7, boss.y + dir.dy * 2));

    spawnFxAt('pounce_arc', 'fx-pounce-arc', fromX, fromY, { duration: 700, scale: 1.4 });
    boss.x = landX;
    boss.y = landY;
    if (typeof updateVisuals === 'function') updateVisuals();
    await sleep(350);

    spawnFxAt('shockwave', 'fx-shockwave', landX, landY, { duration: 600, scale: 1.4 });

    const tiles = buildAreaTiles(landX, landY, 1, true);
    const dmg = Math.max(1, atk - 1);
    await sleep(280);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

// =================================================================
// 🌙 ATO 11 — JACI (boss)
// =================================================================
STORY_ANIMAL_SKILLS['jaci_lua'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🌙 ${enemy.name} invoca a lua e ataca tiles de AR!`);

    spawnElementPulse(boss.x, boss.y, 'AR');

    await sleep(400);

    let count = 0;
    grid.forEach((element, idx) => {
        if (element === 'AR') {
            const x = idx % 8;
            const y = Math.floor(idx / 8);
            setTimeout(() => {
                spawnFxAt('element_pulse', 'fx-element-pulse', x, y, { duration: 700, scale: 1.2 });
                spawnFxAt('spectral_veil', 'fx-spectral-veil', x, y, { duration: 700, scale: 0.8 });
            }, count * 40);

            players.forEach(p => {
                if (!p.dead && p.x === x && p.y === y) {
                    setTimeout(() => applyDmg(p, atk), count * 40 + 200);
                }
            });
            count++;
        }
    });

    addLog(`🌙 ${count} tiles de AR foram atingidos!`);
    await sleep(700);
};

STORY_ANIMAL_SKILLS['jaci_tempestade'] = async (enemy, skill) => {
    addLog(`🌙 ${enemy.name} invoca uma tempestade lunar em todo o tabuleiro!`);

    const board = document.getElementById('board');
    if (board) {
        const storm = document.createElement('div');
        storm.style.cssText = `position:absolute;inset:0;background:linear-gradient(0deg,rgba(142,68,173,0),rgba(142,68,173,0.5),rgba(142,68,173,0));animation:stormAnim 1.5s ease-out;z-index:55;pointer-events:none;`;
        board.appendChild(storm);
        setTimeout(() => storm.remove(), 1600);
    }

    await sleep(600);

    players.forEach(p => {
        if (!p.dead) applyDmg(p, 1);
    });

    // Cura 1 HP
    boss.hp = Math.min(boss.maxHp, boss.hp + 1);
    spawnHealOrb(boss.x, boss.y);
    if (typeof showHealEffect === 'function') showHealEffect(boss.x, boss.y, 1);
    if (typeof updateVisuals === 'function') updateVisuals();
    addLog(`💊 ${enemy.name} recuperou 1 HP!`);

    await sleep(400);
};

// =================================================================
// 🦅 ATO 12 — GAVIÃO
// =================================================================
STORY_ANIMAL_SKILLS['gaviao_voo'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦅 ${enemy.name} faz voo rasante!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);
    const tiles = buildLineTiles(boss.x, boss.y, dir.name, 3);

    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('wing_gust', 'fx-wing-gust', t.x, t.y, { duration: 450 });
            spawnFxAt('peck_beak', 'fx-peck-beak', t.x, t.y, { duration: 400 });
        }, i * 100);
    });

    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['gaviao_garras'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦅 ${enemy.name} ataca com garras cortantes!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => {
        setTimeout(() => {
            spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 450, scale: 0.9 });
        }, i * 40);
    });

    await sleep(480);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🦅 ATO 12 — FALCÃO
// =================================================================
STORY_ANIMAL_SKILLS['falcao_mergulho'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦅 ${enemy.name} faz mergulho mortal!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const tx = nearest.x;
    const ty = nearest.y;
    const fromX = boss.x, fromY = boss.y;

    spawnTravelingFx('wing_gust', 'fx-wing-gust', fromX, fromY, tx, ty, { duration: 350 });
    spawnFxAt('impact', 'fx-impact', tx, ty, { duration: 500, delay: 350 });

    await sleep(420);
    players.forEach(p => {
        if (!p.dead && p.x === tx && p.y === ty) applyDmg(p, atk);
    });

    boss.x = tx;
    boss.y = ty;
    if (typeof updateVisuals === 'function') updateVisuals();

    await sleep(280);
};

STORY_ANIMAL_SKILLS['falcao_garras'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦅 ${enemy.name} ataca com garras do vento!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t, i) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => {
            spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 500, scale: 0.9 });
        }, dist * 55);
    });

    await sleep(550);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

// =================================================================
// 🦉 ATO 12 — URUTAU
// =================================================================
STORY_ANIMAL_SKILLS['urutau_canto'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦉 ${enemy.name} entoa um canto sombrio!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t, i) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => {
            spawnFxAt('spectral_veil', 'fx-spectral-veil', t.x, t.y, { duration: 700, scale: 0.8 });
        }, dist * 55);
    });

    await sleep(600);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

STORY_ANIMAL_SKILLS['urutau_voo'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦉 ${enemy.name} faz voo fantasma!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const dir = dirToward(boss.x, boss.y, nearest.x, nearest.y);

    // Teleporta 3 tiles
    for (let i = 0; i < 3; i++) {
        const nx = boss.x + dir.dx;
        const ny = boss.y + dir.dy;
        if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
        if (typeof isOccupied === 'function' && isOccupied(nx, ny, -1)) break;
        spawnFxAt('spectral_veil', 'fx-spectral-veil', nx, ny, { duration: 500, scale: 0.7 });
        boss.x = nx;
        boss.y = ny;
        if (typeof updateVisuals === 'function') updateVisuals();
        await sleep(130);
    }

    await sleep(200);
    spawnFxAt('impact', 'fx-impact', boss.x, boss.y, { duration: 500, scale: 1.2 });

    players.forEach(p => {
        if (!p.dead && Math.abs(p.x - boss.x) <= 1 && Math.abs(p.y - boss.y) <= 1) {
            applyDmg(p, atk);
        }
    });

    await sleep(280);
};

// =================================================================
// 🦅 ATO 12 — ÁGUIA-CINZENTA (mini-boss)
// =================================================================
STORY_ANIMAL_SKILLS['aguia_garras'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦅 ${enemy.name} ataca com garras reais!`);

    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t, i) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => {
            spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 500, scale: 1.1 });
        }, dist * 55);
    });

    await sleep(550);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

STORY_ANIMAL_SKILLS['aguia_mergulho'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦅 ${enemy.name} faz mergulho solar!`);

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    let nearest = alive[0];
    let minDist = Math.abs(alive[0].x - boss.x) + Math.abs(alive[0].y - boss.y);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        if (d < minDist) { minDist = d; nearest = p; }
    });

    const tx = nearest.x;
    const ty = nearest.y;
    const fromX = boss.x, fromY = boss.y;

    spawnTravelingFx('wing_gust', 'fx-wing-gust', fromX, fromY, tx, ty, { duration: 400 });
    spawnFxAt('element_pulse', 'fx-element-pulse', tx, ty, { duration: 700, delay: 400, scale: 1.3 });

    await sleep(500);
    // Atinge o alvo + 4 adjacentes
    const hitTiles = [{ x: tx, y: ty }].concat(buildCrossTiles(tx, ty, 1, false));
    // 5 tiles → mantém atk
    damagePlayersAt(hitTiles, atk);

    boss.x = tx;
    boss.y = ty;
    if (typeof updateVisuals === 'function') updateVisuals();

    await sleep(280);
};

// =================================================================
// ☀️ ATO 12 — GUARACI (boss)
// =================================================================
STORY_ANIMAL_SKILLS['guaraci_sol'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`☀️ ${enemy.name} invoca o sol e ataca tiles de FOGO!`);

    spawnElementPulse(boss.x, boss.y, 'FOGO');
    await sleep(400);

    let count = 0;
    grid.forEach((element, idx) => {
        if (element === 'FOGO') {
            const x = idx % 8;
            const y = Math.floor(idx / 8);
            setTimeout(() => {
                spawnFxAt('element_pulse', 'fx-element-pulse', x, y, { duration: 700, scale: 1.2 });
                spawnFxAt('flame_short', 'fx-flame-short', x, y, { duration: 600 });
            }, count * 40);

            players.forEach(p => {
                if (!p.dead && p.x === x && p.y === y) {
                    setTimeout(() => applyDmg(p, atk), count * 40 + 200);
                }
            });
            count++;
        }
    });

    addLog(`☀️ ${count} tiles de FOGO foram atingidos!`);
    await sleep(700);
};

STORY_ANIMAL_SKILLS['guaraci_onda'] = async (enemy, skill) => {
    addLog(`☀️ ${enemy.name} invoca uma onda de calor!`);

    const board = document.getElementById('board');
    if (board) {
        const wave = document.createElement('div');
        wave.style.cssText = `position:absolute;inset:0;background:linear-gradient(90deg,rgba(230,126,34,0),rgba(230,126,34,0.7),rgba(230,126,34,0));animation:heatWaveAnim 1.5s ease-out;z-index:55;pointer-events:none;`;
        board.appendChild(wave);
        setTimeout(() => wave.remove(), 1600);
    }

    await sleep(600);

    players.forEach(p => {
        if (!p.dead) applyDmg(p, 1);
    });

    boss.hp = Math.min(boss.maxHp, boss.hp + 1);
    spawnHealOrb(boss.x, boss.y);
    if (typeof showHealEffect === 'function') showHealEffect(boss.x, boss.y, 1);
    if (typeof updateVisuals === 'function') updateVisuals();
    addLog(`💊 ${enemy.name} recuperou 1 HP!`);

    await sleep(400);
};

// =================================================================
// 👹 ATO 13 — ANHANGÁ (final boss)
// =================================================================
STORY_ANIMAL_SKILLS['anhanga_fogo'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`👹 ${enemy.name}: "Sintam meu fogo intercalado!"`);

    // Colunas alternadas
    const cols = [];
    for (let col = boss.x; col < 8; col += 2) cols.push(col);
    for (let col = boss.x; col >= 0; col -= 2) cols.push(col);
    const unique = [...new Set(cols)];

    unique.forEach(col => {
        if (typeof triggerFireColumn === 'function') {
            triggerFireColumn(col);
        } else {
            for (let y = 0; y < 8; y++) {
                spawnFxAt('flame_short', 'fx-flame-short', col, y, { duration: 500, delay: y * 30 });
            }
        }
    });

    await sleep(600);

    players.forEach(p => {
        if (!p.dead && unique.includes(p.x)) applyDmg(p, atk);
    });

    await sleep(300);
};

STORY_ANIMAL_SKILLS['anhanga_devora'] = async (enemy, skill) => {
    addLog(`👹 ${enemy.name}: "Eu me alimento da natureza!"`);

    spawnFxAt('spectral_veil', 'fx-spectral-veil', boss.x, boss.y, { duration: 900, scale: 1.5 });
    spawnFxAt('tentacle_glow', 'fx-tentacle-glow', boss.x, boss.y, { duration: 800, scale: 1.4 });
    spawnHealOrb(boss.x, boss.y);
    playSfx('cucask2');

    await sleep(600);
    boss.hp = Math.min(boss.maxHp, boss.hp + 3);
    if (typeof showHealEffect === 'function') showHealEffect(boss.x, boss.y, 3);
    if (typeof updateVisuals === 'function') updateVisuals();
    addLog(`💊 ${enemy.name} recuperou 3 HP!`);

    await sleep(400);
};

// =================================================================
// 🎯 applyStorySkill — DELEGA pros handlers customizados
// =================================================================
async function applyStorySkill(enemy, skill){
    if (!enemy || !skill) return;
    const handlerName = skill.handler;
    if (!handlerName) {
        console.warn('[story] skill sem handler:', skill.name);
        return;
    }
    const handler = STORY_ANIMAL_SKILLS[handlerName];
    if (!handler) {
        console.warn('[story] handler não encontrado:', handlerName);
        // Fallback simples: dano no tile do herói mais próximo
        const alive = players.filter(p => !p.dead);
        if (alive.length > 0) applyDmg(alive[0], enemy.atk);
        return;
    }
    try {
        await handler(enemy, skill);
    } catch (e) {
        console.error('[story] erro no handler', handlerName, e);
    }
}

// =================================================================
// 📖 ESTADO RUNTIME DA FASE
// =================================================================
let storyCurrentPhase = null;
let storyCurrentEnemyIndex = 0;
let storyEnemiesRemaining = [];
let storyBattleActive = false;
let storyPendingDrops = [];

// =================================================================
// 💀 MORTE DO INIMIGO
// =================================================================
async function handleStoryBossDefeat(){
    if (!window._storyMode) return;
    if (window._storyPurificationShowing) return;
    window._storyPurificationShowing = true;

    const enemyId = storyEnemiesRemaining[0];
    if (!enemyId) { window._storyPurificationShowing = false; return; }

    const drops = rollStoryDrops(enemyId);
    let dropTxt = '';
    drops.forEach(d => {
        addMaterial(d.id, d.qty);
        const m = STORY_MATERIALS[d.id];
        if (m) dropTxt += ` ${m.emoji} ${m.name}×${d.qty}`;
        storyPendingDrops.push({ id: d.id, qty: d.qty });
    });
    saveStoryProgress();

    addLog(`💀 ${getStoryEnemyName(enemyId)} foi derrotado!`);
    addLog(dropTxt ? `${uiIcon('gift')} Drops:${dropTxt}` : `${uiIcon('gift')} Nenhum drop.`);

    STORY_PROGRESS.enemiesDefeated++;
    saveStoryProgress();

    // Purificação visual
    if (typeof showPurificacao === 'function') {
        try {
            await showPurificacao(boss.type, boss.x, boss.y, false);
        } catch(e) {
            console.warn('[story] showPurificacao falhou:', e);
        }
    }

    // Mensagem de purificação
    await showPurificationMessage(enemyId);

    // Se for boss, mostra diálogo final
    const isBoss = STORY_FINAL_DIALOGS[enemyId] !== undefined;
    if (isBoss) {
        await showBossFinalDialog(enemyId);
    }

    window._storyPurificationShowing = false;
    await advanceStoryEnemy();
}

// =================================================================
// 📖 OVERLAY DE TEXTO DE PURIFICAÇÃO
// =================================================================
function showPurificationMessage(enemyId){
    const msg = STORY_PURIFICATION[enemyId];
    if (!msg) return Promise.resolve();

    return new Promise(resolve => {
        const old = document.getElementById('storyPurificationOverlay');
        if (old) old.remove();

        const ov = document.createElement('div');
        ov.id = 'storyPurificationOverlay';
        ov.className = 'story-purification-overlay';
        ov.style.zIndex = '99999';

        const enemy = STORY_ENEMIES[enemyId];
        const name = enemy ? enemy.name : enemyId;
        let sprite = SPRITES_STORY[enemyId];
        if (!sprite || sprite.trim() === '') {
            const bk = STORY_TO_BASE_BOSS[enemyId];
            if (bk && typeof SPRITES !== 'undefined' && SPRITES[bk]) sprite = SPRITES[bk];
        }
        const spriteHTML = (sprite && sprite.trim() !== '')
            ? `<img src="${sprite}" class="story-purification-img" alt="${name}">`
            : `<span class="story-purification-emoji">${EMOJI_STORY[enemyId]||'?'}</span>`;

        ov.innerHTML = `
            <div class="story-purification-panel">
                <div class="story-purification-header">${uiIcon('sparkle')} PURIFICAÇÃO ${uiIcon('sparkle')}</div>
                <div class="story-purification-sprite">${spriteHTML}</div>
                <div class="story-purification-name">${name}</div>
                <div class="story-purification-text">${msg}</div>
                <button class="story-purification-btn" id="storyPurifContinue">CONTINUAR ${uiIcon('arrow')}</button>
            </div>`;
        document.body.appendChild(ov);

        let closed = false;
        const close = () => {
            if (closed) return;
            closed = true;
            if (ov.parentNode) ov.parentNode.removeChild(ov);
            resolve();
        };
        document.getElementById('storyPurifContinue').addEventListener('click', close);
        setTimeout(close, 8000);
    });
}

// =================================================================
// 🎯 AVANÇA PARA O PRÓXIMO INIMIGO
// =================================================================
async function advanceStoryEnemy(){
    if (!storyBattleActive) return;

    window._storyPurificationShowing = false;
    storyEnemiesRemaining.shift();
    storyCurrentEnemyIndex++;

    arcadeBossTransition = true;
    bossAIIsRunning = false;
    isExecutingAction = false;
    window._endGameShowing = false;

    if (storyEnemiesRemaining.length > 0) {
        const nextId = storyEnemiesRemaining[0];
        const nextE = STORY_ENEMIES[nextId];
        if (!nextE) { arcadeBossTransition = false; finishStoryPhase(true); return; }

        await sleep(500);

        const baseType = STORY_TO_BASE_BOSS[nextId] || nextId.toUpperCase();
        boss.type = baseType;
        boss.hp = nextE.hp;
        boss.maxHp = nextE.hp;
        boss.dead = false;
        boss.x = 4;
        boss.y = 0;

        const oldTok = document.getElementById('tokenBoss');
        if (oldTok) oldTok.remove();
        const oldEmo = document.getElementById('storyBossEmoji');
        if (oldEmo) oldEmo.remove();

        const board = document.getElementById('board');
        if (board) {
            const tok = document.createElement('div');
            tok.id = 'tokenBoss';
            tok.className = 'token';
            let sprite = SPRITES_STORY[nextId];
            if (!sprite || sprite.trim() === '') {
                const bk = STORY_TO_BASE_BOSS[nextId];
                if (bk && typeof SPRITES !== 'undefined' && SPRITES[bk]) sprite = SPRITES[bk];
            }
            const has = sprite && sprite.trim() !== '';
            const imgClass = nextE.isSpectral ? 'normal spectral-boss' : 'normal';
            const spriteHTML = has
                ? `<img id="imgBoss" src="${sprite}" class="${imgClass}">`
                : `<span id="storyBossEmoji" class="story-boss-emoji" style="${nextE.isSpectral ? 'opacity:.65;filter:hue-rotate(220deg) saturate(.7) brightness(1.15);' : ''}">${EMOJI_STORY[nextId]||'?'}</span>`;
            tok.innerHTML = `<div class="hp-container"><div id="hpBarBoss" class="hp-bar"></div></div>${spriteHTML}`;
            board.appendChild(tok);
        }

        applyStoryEnemyToBoss(nextId);

        const hb = document.getElementById('headerBossName');
        if (hb) {
            const tot = storyCurrentEnemyIndex + storyEnemiesRemaining.length;
            hb.textContent = `${nextE.name} (${storyCurrentEnemyIndex+1}/${tot})`;
        }

        updateVisuals();
        updateAllSpriteDirections();
        updateBossCard();
        updateHeroCard();
        addLog(`⚔️ ${nextE.name} entra em cena!`);

        if (typeof playBossTheme === 'function') {
            try { playBossTheme(); } catch(e) {}
        }

        await sleep(400);
        await showBossIntroDialog(nextId);
        await sleep(300);

        arcadeBossTransition = false;

        currentPlayerIdx = 0;
        while (currentPlayerIdx < players.length && players[currentPlayerIdx] && players[currentPlayerIdx].dead) currentPlayerIdx++;
        if (currentPlayerIdx < players.length && players[currentPlayerIdx]) {
            switchConfig(currentPlayerIdx);
            addLog(`🎮 Turno de ${players[currentPlayerIdx].name}`);
            document.getElementById('turnP_Active').classList.add('active-turn');
            document.getElementById('turnBoss').classList.remove('active-turn');
        } else {
            arcadeBossTransition = false;
            handleStoryDefeat();
        }
    } else {
        arcadeBossTransition = false;
        finishStoryPhase(true);
    }
}

// =================================================================
// 🎨 APLICA O INIMIGO NO BOSS (sprite + nome + hp)
// =================================================================
function applyStoryEnemyToBoss(enemyId){
    const enemy = STORY_ENEMIES[enemyId];
    if (!enemy) return;

    let sprite = SPRITES_STORY[enemyId];
    if (!sprite || sprite.trim() === '') {
        const bk = STORY_TO_BASE_BOSS[enemyId];
        if (bk && typeof SPRITES !== 'undefined' && SPRITES[bk]) sprite = SPRITES[bk];
    }
    const has = sprite && sprite.trim() !== '';

    const bimg = document.getElementById('imgBoss');
    if (bimg) {
        if (has) {
            bimg.src = sprite;
            bimg.style.display = '';
            if (enemy.isSpectral) bimg.classList.add('spectral-boss');
            else bimg.classList.remove('spectral-boss');
        } else {
            bimg.style.display = 'none';
        }
    }
    const bcs = document.getElementById('bossCardSprite');
    if (bcs) {
        if (has) {
            bcs.src = sprite;
            bcs.style.display = '';
            if (enemy.isSpectral) bcs.classList.add('spectral-boss');
            else bcs.classList.remove('spectral-boss');
        } else {
            bcs.style.display = 'none';
        }
    }
    const bcn = document.getElementById('bossCardName');
    if (bcn) bcn.textContent = enemy.name;
    const bch = document.getElementById('bossCardHp');
    if (bch) bch.innerHTML = `HP: <b>${boss.hp}</b> / ${boss.maxHp}`;
    const bsw = document.getElementById('bossSectionWrapper');
    if (bsw) {
        if (enemy.isBoss || enemy.isMiniBoss || enemy.isSpectral) bsw.classList.add('story-mini-boss');
        else bsw.classList.remove('story-mini-boss');
    }
}

// =================================================================
// 💀 DERROTA NA FASE
// =================================================================
function handleStoryDefeat(){
    if (!storyBattleActive) return;
    if (window._endGameShowing) return;
    window._endGameShowing = true;
    arcadeBossTransition = true;
    bossAIIsRunning = false;
    isExecutingAction = false;
    setTimeout(() => { arcadeBossTransition = false; finishStoryPhase(false); }, 800);
}

// =================================================================
// 🏁 FIM DA FASE
// =================================================================
function finishStoryPhase(victory){
    if (!storyBattleActive) return;

    storyBattleActive = false;
    window._storyMode = false;
    window._storyPurificationShowing = false;

    restoreBaseGameFunctions();

    const phase = storyCurrentPhase;
    const drops = [...storyPendingDrops];

    storyCurrentPhase = null;
    storyCurrentEnemyIndex = 0;
    storyEnemiesRemaining = [];
    storyPendingDrops = [];

    const gs = document.getElementById('gameScreen');
    if (gs) { gs.classList.remove('active'); gs.style.display = 'none'; }

    window._endGameShowing = false;
    arcadeBossTransition = false;
    bossAIIsRunning = false;
    isExecutingAction = false;

    if (typeof stopAllAudio === 'function') stopAllAudio();

    if (victory) handleStoryPhaseVictory(phase, drops);
    else handleStoryPhaseDefeat(phase, drops);
}

// =================================================================
// ✅ VITÓRIA DA FASE
// =================================================================
function handleStoryPhaseVictory(phase, drops){
    const cid = parseInt(String(phase.id).split('-')[0]) || 1;
    const nextId = getNextPhaseId(phase.id, cid);

    players.forEach(p => { if (!p.dead) p.hp = p.maxHp; });
    completePhase(cid, phase.id, nextId);

    // Desbloqueia próximo capítulo se for boss
    if (phase.isBoss) {
        const nextCid = cid + 1;
        if (STORY_CHAPTERS[nextCid]) {
            if (!STORY_PROGRESS.unlockedChapters.includes(nextCid)) {
                STORY_PROGRESS.unlockedChapters.push(nextCid);
            }
            if (!STORY_PROGRESS.unlockedPhases[nextCid]) STORY_PROGRESS.unlockedPhases[nextCid] = [];
            const firstPhase = STORY_CHAPTERS[nextCid].phases[0];
            if (firstPhase && !STORY_PROGRESS.unlockedPhases[nextCid].includes(firstPhase.id)) {
                STORY_PROGRESS.unlockedPhases[nextCid].push(firstPhase.id);
            }
            saveStoryProgress();
        }
    }

    const xp = (phase.reward && phase.reward.xp) || 0;
    const gr = (phase.reward && phase.reward.gold) || 0;
    const isReplay = STORY_PROGRESS.phasesEverCompleted.filter(id => id === phase.id).length > 1;
    const finalGold = isReplay ? Math.floor(gr * 0.5) : gr;

    STORY_PROGRESS.totalXP += xp;
    addGold(finalGold);

    if (phase.isBoss && phase.enemies.length > 0) {
        const last = phase.enemies[phase.enemies.length - 1];
        if (!STORY_PROGRESS.bossesDefeated.includes(last)) STORY_PROGRESS.bossesDefeated.push(last);
    }
    saveStoryProgress();

    showStoryVictoryScreen(phase, drops, { xp, gold: finalGold });
}

// =================================================================
// 💀 DERROTA DA FASE
// =================================================================
function handleStoryPhaseDefeat(phase, drops){
    players.forEach(p => { if (p.dead) p.dead = false; p.hp = p.maxHp; });
    saveStoryProgress();
    showStoryDefeatScreen(phase, drops);
}

// =================================================================
// 🗺️ PRÓXIMA FASE
// =================================================================
function getNextPhaseId(pid, cid){
    const ch = STORY_CHAPTERS[cid];
    if (!ch) return null;
    const idx = ch.phases.findIndex(p => p.id === pid);
    if (idx === -1 || idx >= ch.phases.length - 1) {
        const nextCid = cid + 1;
        if (STORY_CHAPTERS[nextCid]) {
            if (!STORY_PROGRESS.unlockedChapters.includes(nextCid)) {
                STORY_PROGRESS.unlockedChapters.push(nextCid);
            }
            const firstPhase = STORY_CHAPTERS[nextCid].phases[0];
            if (firstPhase) unlockPhase(nextCid, firstPhase.id);
            saveStoryProgress();
        }
        return null;
    }
    return ch.phases[idx + 1].id;
}

// =================================================================
// 🎯 OVERRIDES CONDICIONAIS (só em _storyMode)
// =================================================================
let _origApplyDmg = null;
let _origManageTurns = null;
let _origHandleBossDefeat = null;
let _origBossAI = null;
let _origSaveAndRefresh = null;
let _overridesInstalled = false;

function installStoryOverrides(){
    if (_overridesInstalled) return;

    if (typeof window.applyDmg === 'function') _origApplyDmg = window.applyDmg;
    if (typeof window.manageTurns === 'function') _origManageTurns = window.manageTurns;
    if (typeof window.handleBossDefeat === 'function') _origHandleBossDefeat = window.handleBossDefeat;
    if (typeof window.bossAI === 'function') _origBossAI = window.bossAI;
    if (typeof window.saveAndRefresh === 'function') _origSaveAndRefresh = window.saveAndRefresh;

    // ---- applyDmg ----
    window.applyDmg = function(t, amt){
        if (!window._storyMode || !_origApplyDmg) {
            return _origApplyDmg.apply(this, arguments);
        }
        if (t.dead) return;
        t.hp -= amt;
        showDmgEffect(t.x, t.y, amt);

        if (t.hp <= 0) {
            t.hp = 0;
            t.dead = true;
            if (t === boss) {
                handleStoryBossDefeat();
                updateVisuals();
                updateHeroCard();
                updateBossCard();
                return;
            } else if (players.every(p => p.dead)) {
                if (!window._endGameShowing) handleStoryDefeat();
            }
        }
        updateVisuals();
        updateHeroCard();
        updateBossCard();
        updateAllSpriteDirections();
    };

    // ---- manageTurns ----
    window.manageTurns = function(){
        if (!window._storyMode || !_origManageTurns) {
            return _origManageTurns.apply(this, arguments);
        }
        if (!gameActive || arcadeBossTransition) return;
        if (window._endGameShowing) return;

        let next = currentPlayerIdx + 1;
        while (next < players.length && players[next].dead) next++;

        if (next < players.length) {
            currentPlayerIdx = next;
            switchConfig(next);
            addLog(`🎮 Turno de ${players[currentPlayerIdx].name}`);
            const tb = document.getElementById('turnBoss');
            if (tb) tb.classList.remove('active-turn');
            const tp = document.getElementById('turnP_Active');
            if (tp) tp.classList.add('active-turn');
        } else {
            currentPlayerIdx = -1;
            if (typeof _origSaveAndRefresh === 'function') _origSaveAndRefresh();
            addLog(`👹 TURNO DO INIMIGO!`);
            const tp = document.getElementById('turnP_Active');
            if (tp) tp.classList.remove('active-turn');
            const tb = document.getElementById('turnBoss');
            if (tb) tb.classList.add('active-turn');

            setTimeout(() => {
                if (window._endGameShowing) return;
                if (gameActive && !boss.dead && players.some(p => !p.dead) && !arcadeBossTransition) {
                    storyEnemyAI();
                } else if (!players.some(p => !p.dead)) {
                    handleStoryDefeat();
                }
            }, 1000);
        }
        updateAllSpriteDirections();
        updateHeroCard();
        updateBossCard();
    };

    // ---- saveAndRefresh ----
    if (_origSaveAndRefresh) {
        window.saveAndRefresh = function(){
            if (!window._storyMode || !_origSaveAndRefresh) {
                return _origSaveAndRefresh.apply(this, arguments);
            }
            _origSaveAndRefresh.apply(this, arguments);
            players.forEach(p => {
                p.element = getHeroStoryElement(p.class);
            });
            if (typeof updateHeroCard === 'function') updateHeroCard();
        };
    }

    // ---- handleBossDefeat ----
    if (_origHandleBossDefeat) {
        window.handleBossDefeat = function(){
            if (window._storyMode) return handleStoryBossDefeat();
            return _origHandleBossDefeat.apply(this, arguments);
        };
    }

    // ---- bossAI ----
    if (_origBossAI) {
        window.bossAI = function(){
            if (window._storyMode) return storyEnemyAI();
            return _origBossAI.apply(this, arguments);
        };
    }
    _overridesInstalled = true;
}

function restoreBaseGameFunctions(){
    if (!_overridesInstalled) return;
    if (_origApplyDmg) window.applyDmg = _origApplyDmg;
    if (_origManageTurns) window.manageTurns = _origManageTurns;
    if (_origHandleBossDefeat) window.handleBossDefeat = _origHandleBossDefeat;
    if (_origBossAI) window.bossAI = _origBossAI;
    if (_origSaveAndRefresh) window.saveAndRefresh = _origSaveAndRefresh;
    _overridesInstalled = false;
}

// =================================================================
// 🎯 IA DO INIMIGO (espelha bossAI)
// =================================================================
async function storyEnemyAI(){
    if (bossAIIsRunning || arcadeBossTransition) return;
    if (!window._storyMode) return;
    if (window._endGameShowing) return;

    bossAIIsRunning = true;

    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) { bossAIIsRunning = false; return; }

    document.getElementById('turnBoss').classList.add('active-turn');

    const enemyId = storyEnemiesRemaining[0] || String(boss.type).toLowerCase();
    const enemy = STORY_ENEMIES[enemyId];
    if (!enemy) {
        console.error('[storyEnemyAI] Inimigo desconhecido:', enemyId);
        bossAIIsRunning = false;
        return;
    }

    addLog(`👹 ${enemy.name} ataca!`);

    const moveSteps = enemy.isSpectral ? 2 : 4;
    for (let i = 0; i < moveSteps; i++) {
        if (boss.dead) break;
        const moves = [
            { x: boss.x + 1, y: boss.y }, { x: boss.x - 1, y: boss.y },
            { x: boss.x, y: boss.y + 1 }, { x: boss.x, y: boss.y - 1 }
        ].filter(m => m.x >= 0 && m.x < 8 && m.y >= 0 && m.y < 8 && !isOccupied(m.x, m.y, -1));
        if (moves.length > 0) {
            const mv = moves[Math.floor(Math.random() * moves.length)];
            boss.x = mv.x;
            boss.y = mv.y;
            updateVisuals();
            await sleep(200);
        }
    }
    updateAllSpriteDirections();

    if (!boss.dead) {
        // Escolhe skill aleatória entre skill1/skill2
        const skill = Math.random() < 0.5 ? enemy.skill1 : enemy.skill2;
        if (skill) {
            await applyStorySkill(enemy, skill);
        }
    }

    await sleep(600);
    document.getElementById('turnBoss').classList.remove('active-turn');
    bossAIIsRunning = false;

    if (boss.dead) return;
    if (players.filter(p => !p.dead).length === 0) {
        if (!window._endGameShowing) handleStoryDefeat();
        return;
    }
    if (arcadeBossTransition) return;

    currentPlayerIdx = 0;
    while (currentPlayerIdx < players.length && players[currentPlayerIdx] && players[currentPlayerIdx].dead) currentPlayerIdx++;
    if (currentPlayerIdx < players.length && players[currentPlayerIdx]) {
        switchConfig(currentPlayerIdx);
        addLog(`🎮 Turno dos jogadores! Começa com ${players[currentPlayerIdx].name}`);
        document.getElementById('turnP_Active').classList.add('active-turn');
    }

    updateAllSpriteDirections();
    updateHeroCard();
    updateBossCard();
}

// =================================================================
// 🎬 DIÁLOGOS
// =================================================================
function showBossIntroDialog(enemyId){
    const cid = STORY_PROGRESS.currentChapter || 1;

    let introPool, bossName, themeClass;
    if (cid === 1) { introPool = STORY_ENEMY_INTROS; bossName = 'SACI'; themeClass = ''; }
    else if (cid === 2) { introPool = STORY_ENEMY_INTROS_A2; bossName = 'MAPINGUARI'; themeClass = 'a2'; }
    else if (cid === 3) { introPool = STORY_ENEMY_INTROS_A3; bossName = 'IARA'; themeClass = 'a3'; }
    else if (cid === 4) { introPool = STORY_ENEMY_INTROS_A4; bossName = 'BOITATÁ'; themeClass = 'a4'; }
    else if (cid === 5) { introPool = STORY_ENEMY_INTROS_A5; bossName = 'MULA SEM CABEÇA'; themeClass = 'a5'; }
    else if (cid === 6) { introPool = STORY_ENEMY_INTROS_A6; bossName = 'CORPO SECO'; themeClass = 'a6'; }
    else if (cid === 7) { introPool = STORY_ENEMY_INTROS_A7; bossName = 'LOBISOMEM'; themeClass = 'a7'; }
    else if (cid === 8) { introPool = STORY_ENEMY_INTROS_A8; bossName = 'CUCA'; themeClass = 'a8'; }
    else if (cid === 9) { introPool = STORY_ENEMY_INTROS_A9; bossName = 'BOTO ROSA'; themeClass = 'a9'; }
    else if (cid === 10) { introPool = STORY_ENEMY_INTROS_A10; bossName = 'BOI DA CARA PRETA'; themeClass = 'a10'; }
    else if (cid === 11) { introPool = STORY_ENEMY_INTROS_A11; bossName = 'JACI'; themeClass = 'a11'; }
    else if (cid === 12) { introPool = STORY_ENEMY_INTROS_A12; bossName = 'GUARACI'; themeClass = 'a12'; }
    else if (cid === 13) { introPool = STORY_ENEMY_INTROS_A13; bossName = 'ANHANGÁ'; themeClass = 'a13'; }
    else { introPool = STORY_ENEMY_INTROS; bossName = 'SACI'; themeClass = ''; }

    const intro = introPool[enemyId];
    if (!intro) return Promise.resolve();

    return new Promise(resolve => {
        const old = document.getElementById('storySaciDialogOverlay');
        if (old) old.remove();

        const ov = document.createElement('div');
        ov.id = 'storySaciDialogOverlay';
        ov.className = 'story-saci-dialog-overlay';
        ov.style.zIndex = '99998';

        let sprite = SPRITES_STORY[enemyId];
        if (!sprite || sprite.trim() === '') {
            const bk = STORY_TO_BASE_BOSS[enemyId];
            if (bk && typeof SPRITES !== 'undefined' && SPRITES[bk]) sprite = SPRITES[bk];
        }
        const hasSprite = sprite && sprite.trim() !== '';
        const enemyName = (STORY_ENEMIES[enemyId]?.name) || enemyId;

        const spriteHTML = hasSprite
            ? `<img src="${sprite}" class="story-saci-dialog-img" alt="${enemyName}">`
            : `<span style="font-size:4rem;line-height:1;">${EMOJI_STORY[enemyId]||'?'}</span>`;

        ov.innerHTML = `
            <div class="story-saci-dialog ${themeClass}">
                <div class="story-saci-dialog-header">
                    ${spriteHTML}
                    <div class="story-saci-dialog-title-wrap">
                        <h2 class="story-saci-dialog-title">${bossName}</h2>
                        <div class="story-saci-dialog-subtitle">${intro.title}</div>
                    </div>
                </div>
                <div class="story-saci-dialog-text">${intro.text}</div>
                <button class="story-saci-dialog-btn" id="storySaciDialogContinue">
                    CONTINUAR ${uiIcon('arrow')}
                </button>
            </div>`;

        document.body.appendChild(ov);

        let closed = false;
        const close = () => {
            if (closed) return;
            closed = true;
            if (ov.parentNode) ov.parentNode.removeChild(ov);
            resolve();
        };

        document.getElementById('storySaciDialogContinue').addEventListener('click', close);
        ov.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === 'Escape') close(); });
    });
}

function showBossFinalDialog(bossType){
    const finalData = STORY_FINAL_DIALOGS[bossType];
    if (!finalData) return Promise.resolve();

    const cid = STORY_PROGRESS.currentChapter || 1;
    const themeClass = (cid >= 2 && cid <= 13) ? 'a' + cid : '';

    return new Promise(resolve => {
        const old = document.getElementById('storySaciFinalOverlay');
        if (old) old.remove();

        const ov = document.createElement('div');
        ov.id = 'storySaciFinalOverlay';
        ov.className = 'story-saci-dialog-overlay';
        ov.style.zIndex = '99998';

        let sprite = SPRITES_STORY[bossType];
        if (!sprite || sprite.trim() === '') {
            const bk = STORY_TO_BASE_BOSS[bossType];
            if (bk && typeof SPRITES !== 'undefined' && SPRITES[bk]) sprite = SPRITES[bk];
        }
        const hasSprite = sprite && sprite.trim() !== '';
        const bossName = (STORY_ENEMIES[bossType]?.name) || bossType;
        const spriteHTML = hasSprite
            ? `<img src="${sprite}" class="story-saci-dialog-img" alt="${bossName}">`
            : `<span style="font-size:4rem;line-height:1;">${EMOJI_STORY[bossType]||'?'}</span>`;

        ov.innerHTML = `
            <div class="story-saci-dialog ${themeClass}">
                <div class="story-saci-dialog-header">
                    ${spriteHTML}
                    <div class="story-saci-dialog-title-wrap">
                        <h2 class="story-saci-dialog-title">${bossName.toUpperCase()}</h2>
                        <div class="story-saci-dialog-subtitle">${finalData.title}</div>
                    </div>
                </div>
                <div class="story-saci-dialog-text">${finalData.text}</div>
                <button class="story-saci-dialog-btn" id="storySaciFinalContinue">
                    CONTINUAR ${uiIcon('arrow')}
                </button>
            </div>`;

        document.body.appendChild(ov);

        let closed = false;
        const close = () => {
            if (closed) return;
            closed = true;
            if (ov.parentNode) ov.parentNode.removeChild(ov);
            resolve();
        };

        document.getElementById('storySaciFinalContinue').addEventListener('click', close);
        ov.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === 'Escape') close(); });
    });
}

// =================================================================
// 🚀 INICIAR UMA FASE
// =================================================================
function startStoryPhase(cid, pid){
    const ch = STORY_CHAPTERS[cid];
    if (!ch) return;
    const ph = ch.phases.find(p => p.id === pid);
    if (!ph) return;

    if (!STORY_PROGRESS.selectedHeroes || STORY_PROGRESS.selectedHeroes.length === 0) {
        STORY_PROGRESS.selectedHeroes = ['Tupa'];
        saveStoryProgress();
    }
    if (STORY_PROGRESS.selectedHeroes.length > 1) {
        STORY_PROGRESS.selectedHeroes = [STORY_PROGRESS.selectedHeroes[0]];
    }

    STORY_PROGRESS.currentChapter = parseInt(cid) || 1;
    saveStoryProgress();

    storyCurrentPhase = ph;
    storyCurrentEnemyIndex = 0;
    storyEnemiesRemaining = [...ph.enemies];
    storyBattleActive = true;
    storyPendingDrops = [];
    window._storyPurificationShowing = false;

    const s = document.getElementById('storyScreen');
    if (s) s.style.display = 'none';

    initStoryBattle();
}

// =================================================================
// ⚔️ INICIALIZA A BATALHA
// =================================================================
async function initStoryBattle(){
    if (storyEnemiesRemaining.length === 0) return;
    const enemyId = storyEnemiesRemaining[0];
    const enemy = STORY_ENEMIES[enemyId];
    if (!enemy) return;

    window._storyMode = true;
    window._endGameShowing = false;
    window._storyPurificationShowing = false;

    mode = 'BOSS';
    applyStoryHeroesToConfigs();

    const baseType = STORY_TO_BASE_BOSS[enemyId] || enemyId.toUpperCase();
    boss.type = baseType;
    boss.hp = enemy.hp;
    boss.maxHp = enemy.hp;
    boss.dead = false;
    boss.x = 4;
    boss.y = 0;

    ['titleScreen','storyScreen','modeScreen','challengeScreen','playersScreen','configScreen','tutorialScreen']
        .forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });

    const gs = document.getElementById('gameScreen');
    if (gs) { gs.style.display = 'flex'; gs.classList.add('active'); }
    currentScreen = 'game';

    installStoryOverrides();

    if (typeof unlockAudio === 'function') {
        try { unlockAudio(); } catch(e) {}
    }

    await initGame();

    boss.hp = enemy.hp;
    boss.maxHp = enemy.hp;

    applyStoryElementsToPlayers();
    applyStoryEnemyToBoss(enemyId);

    const hb = document.getElementById('headerBossName');
    if (hb) {
        const tot = storyEnemiesRemaining.length;
        hb.textContent = `${enemy.name} (1/${tot})`;
    }
    addLog(`⚔️ Fase ${storyCurrentPhase.id} — ${storyCurrentPhase.name}`);
    addLog(`🎯 Inimigo: ${enemy.name}`);
    addLog(`✨ Elemento do time: ${getSaveElement()}`);

    await sleep(500);
    await showBossIntroDialog(enemyId);
}

function applyStoryElementsToPlayers(){
    const saveEl = getSaveElement();
    players.forEach(p => {
        p.element = getHeroStoryElement(p.class);
    });
    if (typeof updateHeroCard === 'function') updateHeroCard();
}

function applyStoryHeroesToConfigs(){
    const sel = STORY_PROGRESS.selectedHeroes || ['Tupa'];
    for (let i = 0; i < 4; i++) playerConfigs[i].active = false;
    const max = Math.min(sel.length, 4);
    for (let i = 0; i < max; i++) {
        playerConfigs[i].active = true;
        playerConfigs[i].class = sel[i];
        playerConfigs[i].name = STORY_CURRENT_SAVE_NAME || sel[i];
    }
    playerCount = max;
}

// =================================================================
// 🎉 TELA DE VITÓRIA DA FASE
// =================================================================
function showStoryVictoryScreen(phase, drops, rewards){
    const old = document.getElementById('storyVictoryOverlay');
    if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'storyVictoryOverlay';
    ov.className = 'story-result-overlay';

    const groups = {};
    drops.forEach(d => { groups[d.id] = (groups[d.id] || 0) + d.qty; });
    let dropsHTML;
    const ids = Object.keys(groups);
    if (ids.length === 0) dropsHTML = '<div class="story-result-no-drops">Nenhum material.</div>';
    else {
        dropsHTML = '<div class="story-result-drops-grid">';
        ids.forEach(id => {
            const m = STORY_MATERIALS[id];
            if (!m) return;
            dropsHTML += `<div class="story-result-drop">
                <div class="story-result-drop-emoji">${m.emoji}</div>
                <div class="story-result-drop-name">${m.name}</div>
                <div class="story-result-drop-qty">×${groups[id]}</div>
            </div>`;
        });
        dropsHTML += '</div>';
    }

    const cid = STORY_PROGRESS.currentChapter || 1;
    const isBoss = phase.isBoss;
    const isFinal = phase.isFinalBoss;

    let title = `${uiIcon('sparkle')} FASE CONCLUÍDA!`;
    let sub = `${phase.name} superada.`;
    if (isFinal) {
        title = `${uiIcon('crown')} O ABISMO FOI FECHADO!`;
        sub = 'Anhangá foi derrotado. As doze entidades estão livres para sempre. A mata respira.';
    } else if (isBoss) {
        title = `${uiIcon('crown')} ATO COMPLETO!`;
        const lastEnemy = phase.enemies[phase.enemies.length - 1];
        const bossName = STORY_ENEMIES[lastEnemy]?.name || 'o guardião';
        sub = `${bossName} foi libertado da influência de Anhangá.`;
    }

    const nextId = getNextPhaseId(phase.id, cid);
    const nextPh = nextId ? STORY_CHAPTERS[cid].phases.find(p => p.id === nextId) : null;

    let extraHTML = '';
    if (isBoss && STORY_CHAPTERS[cid + 1] && !isFinal) {
        extraHTML = `
            <div style="text-align:center;padding:12px;background:rgba(201,162,39,.1);border:1px solid rgba(201,162,39,.3);border-radius:6px;margin-top:8px;">
                <div style="font-family:'Cinzel',serif;color:#e8b923;font-size:.9rem;letter-spacing:2px;">NOVO ATO DESBLOQUEADO</div>
                <div style="font-family:'EB Garamond',serif;color:#d9c89a;font-size:1rem;margin-top:4px;">${STORY_CHAPTERS[cid + 1].name}</div>
            </div>`;
    }

    ov.innerHTML = `
        <div class="story-result-panel victory">
            <div class="story-result-scroll-top"><h1 class="story-result-title">${title}</h1></div>
            <div class="story-result-body">
                <div class="story-result-subtitle">${sub}</div>
                ${extraHTML}
                <div class="story-result-section-title">${uiIcon('gift')} RECOMPENSAS</div>
                ${dropsHTML}
                <div class="story-result-xp">+${rewards.xp} XP | +${rewards.gold} ${uiIcon('gold')}</div>
                <div class="story-result-actions">
                    ${nextPh ? `<button class="story-result-btn primary" onclick="continueToNextPhase('${nextPh.id}')">PRÓXIMA FASE ${uiIcon('play')} ${nextPh.name}</button>` : ''}
                    <button class="story-result-btn secondary" onclick="returnFromStoryVictory()">${uiIcon('home')} VOLTAR À ALDEIA</button>
                </div>
            </div>
        </div>`;
    document.body.appendChild(ov);
    if (typeof playSfx === 'function') playSfx('win');
}

// =================================================================
// 💀 TELA DE DERROTA DA FASE
// =================================================================
function showStoryDefeatScreen(phase, drops){
    const old = document.getElementById('storyVictoryOverlay');
    if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'storyVictoryOverlay';
    ov.className = 'story-result-overlay';
    ov.innerHTML = `
        <div class="story-result-panel defeat">
            <div class="story-result-scroll-top defeat"><h1 class="story-result-title defeat">${uiIcon('skull')} DERROTA</h1></div>
            <div class="story-result-body">
                <div class="story-result-subtitle">Os heróis caíram em ${phase.name}.</div>
                <div class="story-result-actions">
                    <button class="story-result-btn primary" onclick="retryStoryPhase()">${uiIcon('swap')} TENTAR NOVAMENTE</button>
                    <button class="story-result-btn secondary" onclick="returnFromStoryVictory()">${uiIcon('home')} VOLTAR À ALDEIA</button>
                </div>
            </div>
        </div>`;
    document.body.appendChild(ov);
    if (typeof playSfx === 'function') playSfx('gameover');
}

function continueToNextPhase(nextId){
    const ov = document.getElementById('storyVictoryOverlay');
    if (ov) ov.remove();
    window._endGameShowing = false;
    window._storyPurificationShowing = false;
    startStoryPhase(STORY_PROGRESS.currentChapter || 1, nextId);
}

function returnFromStoryVictory(){
    const ov = document.getElementById('storyVictoryOverlay');
    if (ov) ov.remove();
    window._endGameShowing = false;
    window._storyPurificationShowing = false;
    restoreBaseGameFunctions();
    const gs = document.getElementById('gameScreen');
    if (gs) { gs.classList.remove('active'); gs.style.display = 'none'; }

    showStoryScreen();
    setTimeout(() => {
        const ss = document.getElementById('storyScreen');
        if (ss && ss.classList.contains('active')) renderAldeiaScreen();
    }, 50);
}

function retryStoryPhase(){
    const ov = document.getElementById('storyVictoryOverlay');
    if (ov) ov.remove();
    window._endGameShowing = false;
    window._storyPurificationShowing = false;
    const cid = STORY_PROGRESS.currentChapter || 1;
    if (storyCurrentPhase) startStoryPhase(cid, storyCurrentPhase.id);
    else returnFromStoryVictory();
}

// =================================================================
// 🏷️ MODAL DE NOME DO SAVE
// =================================================================
function showStorySaveNameModal(options = {}){
    const { allowCancel = true, title = 'NOVO SAVE' } = options;
    const old = document.getElementById('storySaveNameModal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'storySaveNameModal';
    modal.className = 'story-save-modal-overlay';

    const lastUsed = getLastUsedSaveName();
    const saves = listStorySaves();
    const savesHTML = saves.length ? `
        <div class="story-save-section">
            <div class="story-save-section-title">SAVES EXISTENTES</div>
            <div class="story-save-list">
                ${saves.map(s => `
                    <div class="story-save-item" onclick="loadStorySaveFromModal('${s.name.replace(/'/g,"\\'")}')">
                        <div class="story-save-item-name">${s.name}</div>
                        <div class="story-save-item-stats">${uiIcon('gold')} ${s.gold} · ${uiIcon('xp')} ${s.xp} XP · ${uiIcon('check')} ${s.completed} fases</div>
                    </div>
                `).join('')}
            </div>
        </div>` : '';

    modal.innerHTML = `
        <div class="story-save-panel">
            <div class="story-save-header">${title}</div>
            <div class="story-save-hint">O nome define o elemento dos seus heróis.</div>
            <div class="story-save-input-wrap">
                <input type="text" id="storySaveNameInput" class="story-save-input"
                       placeholder="Digite seu nome..." maxlength="20" autocomplete="off"
                       value="${lastUsed || ''}">
                <button class="story-save-confirm-btn" onclick="confirmStorySaveName()">CONFIRMAR</button>
            </div>
            <div id="storySaveElementPreview" class="story-save-element-preview"></div>
            ${savesHTML}
            ${allowCancel ? `<button class="story-save-cancel-btn" onclick="closeStorySaveNameModal()">← VOLTAR</button>` : ''}
        </div>
    `;
    document.body.appendChild(modal);

    setTimeout(() => {
        const inp = document.getElementById('storySaveNameInput');
        if (!inp) return;
        inp.focus();
        inp.select();
        inp.addEventListener('input', updateStorySaveElementPreview);
        inp.addEventListener('keydown', e => {
            if (e.key === 'Enter') confirmStorySaveName();
            if (e.key === 'Escape' && allowCancel) closeStorySaveNameModal();
        });
        updateStorySaveElementPreview();
    }, 60);
}

function updateStorySaveElementPreview(){
    const inp = document.getElementById('storySaveNameInput');
    const prev = document.getElementById('storySaveElementPreview');
    if (!inp || !prev) return;
    const name = inp.value.trim();
    if (!name) { prev.innerHTML = '<span class="story-save-element-empty">Digite um nome...</span>'; return; }
    const el = getElementFromName(name);
    prev.innerHTML = `
        <div class="story-save-element-label">ELEMENTO DO TIME:</div>
        <div class="story-save-element-value elem-${el}">${elemIcon(el)} ${el}</div>
    `;
}

function confirmStorySaveName(){
    const inp = document.getElementById('storySaveNameInput');
    if (!inp) return;
    const name = inp.value.trim();
    if (!name) { alert('Digite um nome para o save!'); return; }
    if (name.length < 2) { alert('O nome precisa ter pelo menos 2 caracteres.'); return; }

    const exists = listStorySaves().some(s => s.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        if (!confirm(`Já existe um save "${name}". Carregar?`)) return;
        loadStoryProgressByName(name);
    } else {
        createNewStorySave(name);
    }
    closeStorySaveNameModal();
    renderAldeiaScreen();
}

function loadStorySaveFromModal(name){
    loadStoryProgressByName(name);
    closeStorySaveNameModal();
    renderAldeiaScreen();
}

function closeStorySaveNameModal(){
    const m = document.getElementById('storySaveNameModal');
    if (m) m.remove();
    if (!STORY_CURRENT_SAVE_NAME) {
        const ss = document.getElementById('storyScreen');
        if (ss) { ss.style.display = 'none'; ss.classList.remove('active'); }
        if (typeof showScreen === 'function') showScreen('titleScreen');
        currentScreen = 'title';
    }
}

// =================================================================
// 🎯 ENTRADA NO MODO HISTÓRIA
// =================================================================
function showStoryScreen(){
    ['titleScreen','modeScreen','challengeScreen','playersScreen','gameScreen','configScreen','tutorialScreen']
        .forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });

    const screen = document.getElementById('storyScreen');
    if (!screen) { console.error('#storyScreen não encontrada'); return; }

    if (!STORY_CURRENT_SAVE_NAME) {
        const lastUsed = getLastUsedSaveName();
        if (lastUsed && loadStoryProgressByName(lastUsed)) {
            // carregou
        } else {
            screen.style.display = 'flex';
            screen.classList.add('active');
            currentScreen = 'story';
            showStorySaveNameModal({ allowCancel: true, title: 'NOVO SAVE' });
            return;
        }
    }

    screen.style.display = 'flex';
    screen.classList.add('active');
    currentScreen = 'story';
    renderAldeiaScreen();
}

function hideStoryScreen(){
    const s = document.getElementById('storyScreen');
    if (s) { s.style.display = 'none'; s.classList.remove('active'); }
    currentScreen = 'title';
    if (typeof showScreen === 'function') showScreen('titleScreen');
}

function changeStorySave(){
    showStorySaveNameModal({ allowCancel: true, title: 'TROCAR SAVE' });
}

function exitStoryToTitle(){
    saveStoryProgress();
    hideStoryScreen();
}

// =================================================================
// 🎨 ALDEIA
// =================================================================
function renderAldeiaScreen(){
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
                ${renderAldeiaBtn('ritual','RITUAL','Em breve',true)}
                ${renderAldeiaBtn('bestiario','BESTIÁRIO','Em breve',true)}
                ${renderAldeiaBtn('tesouraria','TESOURARIA','Em breve',true)}
            </div>
            <div class="story-ald-progress">
                <div class="story-ald-progress-label">Progresso geral: ${totalCompleted}/${totalPhases}</div>
                <div class="story-ald-progress-bar"><div class="story-ald-progress-fill" style="width:${pct}%"></div></div>
            </div>
            <div class="story-ald-footer">
                <button class="story-back-btn" onclick="exitStoryToTitle()">← VOLTAR AO MENU</button>
            </div>
        </div>
    `;
}

function renderAldeiaBtn(key, label, desc, locked = false){
    const spriteKey = 'aldeia_' + key;
    const url = SPRITES_STORY[spriteKey];
    let iconHTML;
    if (url && url.trim() !== '') {
        iconHTML = `<img src="${url}" class="story-ald-loc-img" alt="${label}" onerror="this.outerHTML='${EMOJI_STORY[spriteKey]||'?'}'">`;
    } else {
        iconHTML = EMOJI_STORY[spriteKey] || '❓';
    }
    return `
        <div class="story-ald-location ${locked?'locked':''}" ${locked?'':`onclick="enterAldeiaLocation('${key}')"`}>
            <div class="story-ald-loc-icon">${iconHTML}</div>
            <div class="story-ald-loc-info">
                <div class="story-ald-loc-name">${label}</div>
                <div class="story-ald-loc-desc">${desc}</div>
                ${locked?`<div class="story-ald-loc-locked">${uiIcon('lock')} Em breve</div>`:''}
            </div>
        </div>
    `;
}

function enterAldeiaLocation(key){
    if (key === 'atos') return renderAtosScreen();
    if (key === 'oca') return renderOcaScreen();
    if (key === 'loja') return renderLojaScreen();
    if (key === 'ritual') return renderPlaceholder(uiIcon('warn'), 'RITUAL', 'Em breve.');
    if (key === 'bestiario') return renderPlaceholder(uiIcon('story'), 'BESTIÁRIO', 'Em breve.');
    if (key === 'tesouraria') return renderPlaceholder(uiIcon('medal'), 'TESOURARIA', 'Em breve.');
}

// =================================================================
// 🗺️ ATOS / FASES
// =================================================================
function renderAtosScreen(){
    const screen = document.getElementById('storyScreen');
    if (!screen) return;
    let html = '';
    Object.values(STORY_CHAPTERS).forEach(ch => {
        const un = STORY_PROGRESS.unlockedChapters.includes(ch.id);
        const comp = ch.phases.filter(p => isPhaseCompleted(p.id)).length;
        const tot = ch.phases.length;
        const pct = Math.round((comp / tot) * 100);
        if (un) {
            html += `<div class="story-chapter-card unlocked" onclick="selectStoryChapter(${ch.id})">
                <div class="story-chapter-cover">${storySpriteLarge(ch.capa)}</div>
                <div class="story-chapter-info">
                    <h3 class="story-chapter-name">${ch.name}</h3>
                    <p class="story-chapter-desc">${ch.description}</p>
                    <div class="story-chapter-progress">
                        <div class="story-chapter-progress-bar"><div class="story-chapter-progress-fill" style="width:${pct}%"></div></div>
                        <div class="story-chapter-progress-text">${comp}/${tot} fases</div>
                    </div>
                </div>
            </div>`;
        } else {
            html += `<div class="story-chapter-card locked">
                <div class="story-chapter-cover">${storySpriteLarge('icon_locked')}</div>
                <div class="story-chapter-info">
                    <h3 class="story-chapter-name">${ch.name}</h3>
                    <p class="story-chapter-desc">Complete o ato anterior para desbloquear.</p>
                </div>
            </div>`;
        }
    });
    screen.innerHTML = `
        <div class="story-container">
            <div class="story-header"><h1 class="story-title">🗺️ ATOS</h1></div>
            <div class="story-chapters-grid">${html}</div>
            <div class="story-footer"><button class="story-back-btn" onclick="renderAldeiaScreen()">← VOLTAR À ALDEIA</button></div>
        </div>`;
}

function selectStoryChapter(id){
    const ch = STORY_CHAPTERS[id];
    if (!ch) return;
    renderChapterPhases(ch);
}

function renderChapterPhases(ch){
    const screen = document.getElementById('storyScreen');
    if (!screen) return;
    let html = '';
    ch.phases.forEach(ph => {
        const un = isPhaseUnlocked(ch.id, ph.id);
        const comp = isPhaseCompleted(ph.id);
        const boss = ph.isBoss;
        const finalBoss = ph.isFinalBoss;
        let statusIcon;
        if (comp) statusIcon = uiIcon('check');
        else if (un) statusIcon = `<span class="story-phase-available">${uiIcon('arrow')}</span>`;
        else statusIcon = uiIcon('lock');
        const enemiesHTML = ph.enemies.map(eid => {
            const e = STORY_ENEMIES[eid];
            if (!e) return '';
            return `<span class="story-phase-enemy" title="${e.name}">${SPRITES_STORY[eid]?storySprite(eid):`<span class="story-enemy-mini">${EMOJI_STORY[eid]||'?'}</span>`}</span>`;
        }).join('<span class="story-phase-arrow">→</span>');
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
}

// =================================================================
// 🏠 OCA / 🧙 LOJA / PLACEHOLDER
// =================================================================
function renderOcaScreen(){
    const screen = document.getElementById('storyScreen');
    if (!screen) return;
    const saveEl = getSaveElement();
    const html = STORY_PROGRESS.unlockedHeroes.map(hc => {
        const sp = (typeof SPRITES !== 'undefined' && SPRITES[hc]) || '';
        const sel = STORY_PROGRESS.selectedHeroes.includes(hc);
        const el = getHeroStoryElement(hc);
        const lv = STORY_PROGRESS.heroLevels[hc] || 1;
        const xp = STORY_PROGRESS.heroXP[hc] || 0;
        return `<div class="story-hero-card ${sel?'selected':''}" onclick="toggleHeroSelection('${hc}')">
            <img src="${sp}" class="story-hero-sprite" alt="${hc}">
            <div class="story-hero-name">${hc}</div>
            <div class="story-hero-element elem-${el}">${elemIcon(el)} ${el}</div>
            <div class="story-hero-level">Nível ${lv}</div>
            <div class="story-hero-xp">${xp} XP</div>
            ${sel?`<div class="story-hero-check">${uiIcon('check')}</div>`:''}
        </div>`;
    }).join('');
    screen.innerHTML = `
        <div class="story-container">
            <div class="story-header"><h1 class="story-title">🏠 OCA</h1>
            <p class="story-subtitle">Elemento do time: <b class="elem-${saveEl}">${saveEl}</b></p></div>
            <div class="story-heroes-grid">${html}</div>
            <div class="story-footer"><button class="story-back-btn" onclick="renderAldeiaScreen()">← VOLTAR À ALDEIA</button></div>
        </div>`;
}

function toggleHeroSelection(hc){
    STORY_PROGRESS.selectedHeroes = [hc];
    saveStoryProgress();
    renderOcaScreen();
}

function renderLojaScreen(){
    const screen = document.getElementById('storyScreen');
    if (!screen) return;
    const gold = STORY_PROGRESS.gold || 0;
    const html = STORY_SHOP_ITEMS.map(it => {
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
    screen.innerHTML = `
        <div class="story-container">
            <div class="story-header"><h1 class="story-title">🧙 CURANDEIRO</h1>
            <p class="story-subtitle">"Tenho o que precisa, se tiver ouro." (${gold} ${uiIcon('gold')})</p></div>
            <div class="story-shop-grid">${html}</div>
            <div class="story-footer"><button class="story-back-btn" onclick="renderAldeiaScreen()">← VOLTAR À ALDEIA</button></div>
        </div>`;
}

function buyShopItem(id, price){
    if (!spendGold(price)) { alert('Ouro insuficiente!'); return; }
    addMaterial(id, 1);
    saveStoryProgress();
    renderLojaScreen();
}

function renderPlaceholder(emoji, title, text){
    const screen = document.getElementById('storyScreen');
    if (!screen) return;
    screen.innerHTML = `
        <div class="story-container">
            <div class="story-header"><h1 class="story-title">${emoji} ${title}</h1></div>
            <div class="story-placeholder">
                <div class="story-placeholder-icon">${emoji}</div>
                <div class="story-placeholder-text">${text}</div>
            </div>
            <div class="story-footer"><button class="story-back-btn" onclick="renderAldeiaScreen()">← VOLTAR À ALDEIA</button></div>
        </div>`;
}

// =================================================================
// 🌐 EXPÕE NO WINDOW
// =================================================================
window.showStoryScreen = showStoryScreen;
window.hideStoryScreen = hideStoryScreen;
window.changeStorySave = changeStorySave;
window.confirmStorySaveName = confirmStorySaveName;
window.loadStorySaveFromModal = loadStorySaveFromModal;
window.closeStorySaveNameModal = closeStorySaveNameModal;
window.enterAldeiaLocation = enterAldeiaLocation;
window.selectStoryChapter = selectStoryChapter;
window.startStoryPhase = startStoryPhase;
window.toggleHeroSelection = toggleHeroSelection;
window.buyShopItem = buyShopItem;
window.continueToNextPhase = continueToNextPhase;
window.returnFromStoryVictory = returnFromStoryVictory;
window.retryStoryPhase = retryStoryPhase;
window.renderAldeiaScreen = renderAldeiaScreen;
window.uiIcon = uiIcon;
window.elemIcon = elemIcon;

// =================================================================
// 🚀 AUTO-INIT
// =================================================================
(function autoInit(){
    function init(){
        try {
            const last = getLastUsedSaveName();
            if (last) {
                loadStoryProgressByName(last);
                console.log(`📖 Save "${last}" restaurado.`);
            } else {
                console.log('📖 Nenhum save. O modal aparecerá ao entrar.');
            }
            console.log('📖 historia.js V6.0 pronto.');
        } catch(e) {
            console.error('❌ Erro no auto-init:', e);
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// =================================================================
// 🧪 TESTES (console)
// =================================================================
window.testStoryMode = function(){
    console.log('📖 Save:', STORY_CURRENT_SAVE_NAME);
    console.log('📖 Progresso:', STORY_PROGRESS);
    console.log('📖 Saves:', listStorySaves());
    console.log('📖 Elemento:', getSaveElement());
    console.log('📖 Capítulos:', Object.keys(STORY_CHAPTERS).length);
    console.log('📖 Inimigos:', Object.keys(STORY_ENEMIES).length);
    console.log('📖 Handlers:', Object.keys(STORY_ANIMAL_SKILLS).length);
    showStoryScreen();
};

window.resetStoryMode = function(){
    if (!confirm('Apagar TODOS os saves do Modo História?')) return;
    listStorySaves().forEach(s => {
        try { localStorage.removeItem(getSaveKey(s.name)); } catch(e) {}
    });
    try { localStorage.removeItem(STORY_SAVE_KEY_CURRENT); } catch(e) {}
    STORY_CURRENT_SAVE_NAME = null;
    STORY_PROGRESS = createEmptyStoryProgress();
    console.log('✅ Saves apagados.');
    showStoryScreen();
};

window.unlockAllStoryChapters = function(){
    Object.keys(STORY_CHAPTERS).forEach(k => {
        const cid = parseInt(k);
        if (!STORY_PROGRESS.unlockedChapters.includes(cid)) {
            STORY_PROGRESS.unlockedChapters.push(cid);
        }
        if (!STORY_PROGRESS.unlockedPhases[cid]) STORY_PROGRESS.unlockedPhases[cid] = [];
        STORY_CHAPTERS[cid].phases.forEach(p => {
            if (!STORY_PROGRESS.unlockedPhases[cid].includes(p.id)) {
                STORY_PROGRESS.unlockedPhases[cid].push(p.id);
            }
        });
    });
    saveStoryProgress();
    console.log('✅ Todos os capítulos e fases desbloqueados!');
    renderAldeiaScreen();
};

window.resetProgressToAct1 = function(){
    if (!confirm('Resetar progresso para o Ato 1? (mantém ouro, XP e materiais)')) return;
    STORY_PROGRESS.unlockedChapters = [1];
    STORY_PROGRESS.unlockedPhases = {1:['1-1']};
    STORY_PROGRESS.completedPhases = [];
    STORY_PROGRESS.currentChapter = 1;
    saveStoryProgress();
    console.log('✅ Progresso resetado para o Ato 1');
    renderAldeiaScreen();
};

window.testUiIcons = function(){
    const keys = [
        'ui_gold','ui_xp','ui_swap','ui_home','ui_play','ui_gift','ui_crown',
        'ui_sparkle','ui_skull','ui_lock','ui_check','ui_arrow','ui_warn','ui_medal',
        'elem_fogo','elem_agua','elem_terra','elem_ar',
        'aldeia_bg','aldeia_atos','aldeia_oca','aldeia_loja','aldeia_ritual',
        'aldeia_bestiario','aldeia_tesouraria',
        'capa_ato1','capa_ato2','capa_ato3','capa_ato4','capa_ato5','capa_ato6',
        'capa_ato7','capa_ato8','capa_ato9','capa_ato10','capa_ato11','capa_ato12','capa_ato13'
    ];
    const preenchidos = [];
    const vazios = [];
    keys.forEach(k => {
        const url = SPRITES_STORY[k];
        if (url && url.trim() !== '') {
            preenchidos.push(`✅ ${k} → ${url}`);
        } else {
            vazios.push(`⚪ ${k}`);
        }
    });
    console.log(`\n=== ÍCONES COM IMAGEM (${preenchidos.length}/${keys.length}) ===`);
    preenchidos.forEach(p => console.log(p));
    console.log(`\n=== AINDA EM EMOJI (${vazios.length}) ===`);
    vazios.forEach(v => console.log(v));
};

// =================================================================
// FIM — historia.js V6.0
// =================================================================
// =================================================================
// historia.js — V6.1 — Bloco 6/6 (FINAL)
// Sistema de som + bosses fiéis ao entidades.js + ajustes finais
// =================================================================
//
// 📌 REGRAS DESTE BLOCO:
//   • Bosses do modo história = cópia FIEL do bossAI() do entidades.js
//     (mesma IA, mesmo som, mesmo comportamento)
//   • Animais comuns = skills personalizadas + som por arquétipo
//   • Sistema de som com fallback (igual ao fxSprite)
//   • Espectros (Ato 13) espelham o boss original
// =================================================================

// =================================================================
// 🔊 SLOTS DE SOM POR SKILL (preencha com chave do sfx ou URL)
// -----------------------------------------------------------------
// Vazio = usa fallback por arquétipo (STORY_ARCHETYPE_SOUNDS)
// Preenchido = toca essa chave/nome
// =================================================================
const STORY_SKILL_SOUNDS = {
    // ---- ATO 1 ----
    porco_espinho_espinhos: '',
    porco_espinho_bote:     '',
    jacare_bocada:          '',
    jacare_giro:            '',
    cervo_investida:        '',
    cervo_chifrada:         '',
    onca_garra_dupla:       '',
    onca_salto:             '',
    // saci (boss) — não usa este sistema

    // ---- ATO 2 ----
    tamandua_garras:        '',
    tamandua_bicada:        '',
    anta_pisada:            '',
    anta_atropelamento:     '',
    queixada_mordida:       '',
    queixada_estouro:       '',
    sucuri_bocarra:         '',
    sucuri_caudada:         '',
    // mapinguari (boss)

    // ---- ATO 3 ----
    piranha_cardume:        '',
    piranha_frenesi:        '',
    lontra_garras:          '',
    lontra_nado:            '',
    ariranha_matilha:       '',
    ariranha_bote:          '',
    pirarucu_bocarra:       '',
    pirarucu_caudada:       '',
    // iara (boss)

    // ---- ATO 4 ----
    cascavel_chocalho:      '',
    cascavel_bote:          '',
    coral_aneis:            '',
    coral_peconha:          '',
    jararaca_bote:          '',
    jararaca_enrolar:       '',
    tartaruga_casco:        '',
    tartaruga_pancada:      '',
    // boitata (boss)

    // ---- ATO 5 ----
    bode_cornada:           '',
    bode_marrada:           '',
    carneiro_trombada:      '',
    carneiro_pisada:        '',
    cavalo_coice:           '',
    cavalo_relincho:        '',
    touro_cornada:          '',
    touro_pisoteada:        '',
    // mula (boss)

    // ---- ATO 6 ----
    urubu_voo:              '',
    urubu_bicada:           '',
    carcaara_garras:        '',
    carcaara_mergulho:      '',
    tatu_casco:             '',
    tatu_cavar:             '',
    lobo_guara_uivo:        '',
    lobo_guara_bote:        '',
    // corpo_seco (boss)

    // ---- ATO 7 ----
    cachorro_mordida:       '',
    cachorro_rosnado:       '',
    raposa_astucia:         '',
    raposa_bote:            '',
    guaxinim_garras:        '',
    guaxinim_surpresa:      '',
    jaguatirica_garras:     '',
    jaguatirica_salto:      '',
    // lobisomem (boss)

    // ---- ATO 8 ----
    morcego_voo:            '',
    morcego_eco:            '',
    coruja_garras:          '',
    coruja_voo:             '',
    sapo_veneno:            '',
    sapo_lingua:            '',
    seriema_bicada:         '',
    seriema_grito:          '',
    // cuca (boss)

    // ---- ATO 9 ----
    tucunare_bote:          '',
    tucunare_cardume:       '',
    piraiba_bocarra:        '',
    piraiba_caudada:        '',
    dourada_escamas:        '',
    dourada_nado:           '',
    peixe_boi_corpulencia:  '',
    peixe_boi_pancada:      '',
    // boto (boss)

    // ---- ATO 10 ----
    bufalo_marrada:         '',
    bufalo_pisoteada:       '',
    vaca_coice:             '',
    vaca_mugido:            '',
    cabra_cornada:          '',
    cabra_bote:             '',
    zebu_marrada:           '',
    zebu_pisada:            '',
    // boi (boss)

    // ---- ATO 11 ----
    gato_mato_garras:       '',
    gato_mato_salto:        '',
    mariposa_po:            '',
    mariposa_voo:           '',
    quati_garras:           '',
    quati_bote:             '',
    sucuarana_garra:        '',
    sucuarana_salto:        '',
    // jaci (boss)

    // ---- ATO 12 ----
    gaviao_voo:             '',
    gaviao_garras:          '',
    falcao_mergulho:        '',
    falcao_garras:          '',
    urutau_canto:           '',
    urutau_voo:             '',
    aguia_garras:           '',
    aguia_mergulho:         '',
    // guaraci (boss)

    // ---- ATO 13 — Anhangá ----
    // anhanga_fogo, anhanga_devora (boss — não usa este sistema)
};

// =================================================================
// 🔊 SONS POR ARQUÉTIPO (reaproveitáveis em vários animais)
// -----------------------------------------------------------------
// Valores = chave do objeto `sfx` do entidades.js
// Se a chave não existir lá, playSfx retorna silencioso (não quebra)
// =================================================================
const STORY_ARCHETYPE_SOUNDS = {
    // ---- Físicos ----
    som_mordida:        'minoa1',      // mordida pesada (jacaré, canídeos)
    som_mordida_rapida: 'atkg',        // mordida rápida (piranha, peixes)
    som_garra:          'garras',      // garras (felinos)
    som_garra_ave:      'atkg',        // garras de ave (bicada seca)
    som_bicada:         'atkg',        // bicada (aves)
    som_investida:      'minoa2',      // investida pesada
    som_pisada:         'minoa2',      // pisada pesada
    som_cornada:        'atkg',        // chifrada
    som_caudada:        'minoa1',      // caudada
    som_enrolar:        'minoa1',      // enrolar
    som_coice:          'atkg',        // coice
    som_relincho:       'skill1',      // relincho
    som_mugido:         'minoa2',      // mugido (boi, vaca)
    som_uivo:           'garras',      // uivo (lobo)
    som_rugido:         'minoa2',      // rugido (onça)

    // ---- Vento / Voo ----
    som_voo:            'saci1',       // asas batendo (aves, morcego)
    som_ventania:       'saci',        // rajada de vento (saci, mariposa)

    // ---- Água ----
    som_splash:         'iara2',       // splash de água
    som_nado:           'iara1',       // nado rápido
    som_bocarra:        'iara2',       // peixe abrindo bocarra

    // ---- Natural ----
    som_terra:          'minoa2',      // terra/rocha
    som_cavar:          'minoa2',      // cavar
    som_poeira:         'minoa2',      // poeira

    // ---- Mágico / Especial ----
    som_magia:          'skill1',      // magia genérica
    som_cura:           'cucask2',     // cura (poção)
    som_veneno:         'garras',      // veneno (peçonha)
    som_tempestade:     'skill1',      // tempestade
    som_luar:           'skill1',      // lunar
    som_solar:          'skill1',      // solar
    som_espectral:      'skill1',      // ataque espectral
};

// =================================================================
// 🎯 MAPA: handler → arquétipo
// =================================================================
const STORY_SKILL_FALLBACK_MAP = {
    // ---- ATO 1 ----
    porco_espinho_espinhos:  'som_garra',           // espinhos disparando
    porco_espinho_bote:      'som_investida',       // rolando
    jacare_bocada:           'som_mordida',
    jacare_giro:             'som_caudada',
    cervo_investida:         'som_investida',
    cervo_chifrada:          'som_cornada',
    onca_garra_dupla:        'som_garra',
    onca_salto:              'som_rugido',

    // ---- ATO 2 ----
    tamandua_garras:         'som_garra',
    tamandua_bicada:         'som_bicada',
    anta_pisada:             'som_pisada',
    anta_atropelamento:      'som_investida',
    queixada_mordida:        'som_mordida',
    queixada_estouro:        'som_pisada',
    sucuri_bocarra:          'som_bocarra',
    sucuri_caudada:          'som_caudada',

    // ---- ATO 3 ----
    piranha_cardume:         'som_mordida_rapida',
    piranha_frenesi:         'som_mordida_rapida',
    lontra_garras:           'som_garra',
    lontra_nado:             'som_nado',
    ariranha_matilha:        'som_mordida',
    ariranha_bote:           'som_bocarra',
    pirarucu_bocarra:        'som_bocarra',
    pirarucu_caudada:        'som_caudada',

    // ---- ATO 4 ----
    cascavel_chocalho:       'som_veneno',
    cascavel_bote:           'som_mordida_rapida',
    coral_aneis:             'som_enrolar',
    coral_peconha:           'som_veneno',
    jararaca_bote:           'som_mordida_rapida',
    jararaca_enrolar:        'som_enrolar',
    tartaruga_casco:         'som_pisada',
    tartaruga_pancada:       'som_pisada',

    // ---- ATO 5 ----
    bode_cornada:            'som_cornada',
    bode_marrada:            'som_cornada',
    carneiro_trombada:       'som_investida',
    carneiro_pisada:         'som_pisada',
    cavalo_coice:            'som_coice',
    cavalo_relincho:         'som_relincho',
    touro_cornada:           'som_cornada',
    touro_pisoteada:         'som_pisada',

    // ---- ATO 6 ----
    urubu_voo:               'som_voo',
    urubu_bicada:            'som_bicada',
    carcaara_garras:         'som_garra_ave',
    carcaara_mergulho:       'som_voo',
    tatu_casco:              'som_terra',
    tatu_cavar:              'som_cavar',
    lobo_guara_uivo:         'som_uivo',
    lobo_guara_bote:         'som_mordida',

    // ---- ATO 7 ----
    cachorro_mordida:        'som_mordida',
    cachorro_rosnado:        'som_rugido',
    raposa_astucia:          'som_mordida_rapida',
    raposa_bote:             'som_mordida',
    guaxinim_garras:         'som_garra',
    guaxinim_surpresa:       'som_mordida_rapida',
    jaguatirica_garras:      'som_garra',
    jaguatirica_salto:       'som_rugido',

    // ---- ATO 8 ----
    morcego_voo:             'som_voo',
    morcego_eco:             'som_espectral',
    coruja_garras:           'som_garra_ave',
    coruja_voo:              'som_voo',
    sapo_veneno:             'som_veneno',
    sapo_lingua:             'som_mordida_rapida',
    seriema_bicada:          'som_bicada',
    seriema_grito:           'som_rugido',

    // ---- ATO 9 ----
    tucunare_bote:           'som_bocarra',
    tucunare_cardume:        'som_mordida_rapida',
    piraiba_bocarra:         'som_bocarra',
    piraiba_caudada:         'som_caudada',
    dourada_escamas:         'som_splash',
    dourada_nado:            'som_nado',
    peixe_boi_corpulencia:   'som_splash',
    peixe_boi_pancada:       'som_splash',

    // ---- ATO 10 ----
    bufalo_marrada:          'som_investida',
    bufalo_pisoteada:        'som_pisada',
    vaca_coice:              'som_coice',
    vaca_mugido:             'som_mugido',
    cabra_cornada:           'som_cornada',
    cabra_bote:              'som_investida',
    zebu_marrada:            'som_investida',
    zebu_pisada:             'som_pisada',

    // ---- ATO 11 ----
    gato_mato_garras:        'som_garra',
    gato_mato_salto:         'som_rugido',
    mariposa_po:             'som_ventania',
    mariposa_voo:            'som_voo',
    quati_garras:            'som_garra',
    quati_bote:              'som_mordida_rapida',
    sucuarana_garra:         'som_garra',
    sucuarana_salto:         'som_rugido',

    // ---- ATO 12 ----
    gaviao_voo:              'som_voo',
    gaviao_garras:           'som_garra_ave',
    falcao_mergulho:         'som_voo',
    falcao_garras:           'som_garra_ave',
    urutau_canto:            'som_espectral',
    urutau_voo:              'som_voo',
    aguia_garras:            'som_garra_ave',
    aguia_mergulho:          'som_voo',
};

// =================================================================
// 🔊 FUNÇÃO UNIFICADA DE SOM
// =================================================================
function playSkillSound(handlerName) {
    // 1. Slot dedicado (do STORY_SKILL_SOUNDS)
    const dedicated = STORY_SKILL_SOUNDS[handlerName];
    if (dedicated && dedicated.trim() !== '') {
        if (typeof playSfx === 'function') playSfx(dedicated);
        return;
    }

    // 2. Arquétipo
    const archetype = STORY_SKILL_FALLBACK_MAP[handlerName];
    if (archetype && STORY_ARCHETYPE_SOUNDS[archetype]) {
        if (typeof playSfx === 'function') playSfx(STORY_ARCHETYPE_SOUNDS[archetype]);
        return;
    }

    // 3. Fallback final
    if (typeof playSfx === 'function') playSfx('skill1');
}

// =================================================================
// 🎯 HANDLERS DOS BOSSES — FIÉIS AO entidades.js
// -----------------------------------------------------------------
// Reaproveitamento literal da IA original. Não alterar comportamento.
// Vou reescrever os handlers dos bosses pra copiar o bossAI.
// =================================================================

// ---- SACI (Ato 1) ----
STORY_ANIMAL_SKILLS['saci_vortices'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js (bossAI — Saci — skill 1)
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    playSfx('saci1');
    addLog(`💨 Saci cria vórtices de vento!`);
    grid.forEach((element, idx) => {
        if (element === 'AR') {
            triggerVortex(idx % 8, Math.floor(idx / 8), 0, true);
            players.forEach(p => {
                if (!p.dead && p.x === idx % 8 && p.y === Math.floor(idx / 8)) applyDmg(p, bossAtk);
            });
        }
    });
    await sleep(700);
};

STORY_ANIMAL_SKILLS['saci_diagonais'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js (bossAI — Saci — skill 2)
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    playSfx('saci');
    addLog(`💨 Saci lança vórtices diagonais!`);
    const diagonals = [
        { dx: 1, dy: 1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
    ];
    diagonals.forEach(dir => {
        for (let step = 1; step < 8; step++) {
            let nx = boss.x + dir.dx * step, ny = boss.y + dir.dy * step;
            if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                triggerVortex(nx, ny, step * 100, true);
                players.forEach(p => {
                    if (!p.dead && p.x === nx && p.y === ny) setTimeout(() => applyDmg(p, bossAtk), step * 100);
                });
            }
        }
    });
    await sleep(700);
};

// ---- MAPINGUARI (Ato 2) ----
STORY_ANIMAL_SKILLS['mapinguari_mordida'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js (bossAI — Mapinguari — skill 1)
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    playSfx('minoa1');
    addLog(`🦥 Mapinguari dá uma mordida poderosa!`);
    triggerBite(boss.x, boss.y);
    await sleep(600);
    players.forEach(p => {
        if (!p.dead && Math.abs(p.x - boss.x) <= 2 && Math.abs(p.y - boss.y) <= 2) applyDmg(p, bossAtk);
    });
};

STORY_ANIMAL_SKILLS['mapinguari_pedras'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js (bossAI — Mapinguari — skill 2)
    playSfx('minoa2');
    addLog(`🦥 Mapinguari lança pedras!`);
    triggerRocks(boss.x, boss.y);
    await sleep(600);
    const rows = [boss.y - 1, boss.y, boss.y + 1];
    players.forEach(p => { if (!p.dead && rows.includes(p.y)) applyDmg(p, 2); });
};

// ---- IARA (Ato 3) ----
STORY_ANIMAL_SKILLS['iara_tsunami'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js (bossAI — Iara — skill 1)
    playSfx('iara1');
    addLog(`🌊 Iara invoca um tsunami!`);
    triggerTsunami();
    await sleep(500);
    players.forEach(p => {
        if (!p.dead) {
            applyDmg(p, 1);
            let dx = p.x < 4 ? -1 : 1, dy = p.y < 4 ? -1 : 1, nx = p.x, ny = p.y;
            if (Math.abs(p.x - 3.5) > Math.abs(p.y - 3.5)) {
                if (p.x + dx >= 0 && p.x + dx < 8) nx += dx;
            } else {
                if (p.y + dy >= 0 && p.y + dy < 8) ny += dy;
            }
            if (!isOccupied(nx, ny, p.id)) { p.x = nx; p.y = ny; }
        }
    });
    updateVisuals();
};

STORY_ANIMAL_SKILLS['iara_jatos'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js (bossAI — Iara — skill 2)
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    playSfx('iara2');
    addLog(`💧 Iara lança jatos d'água!`);
    triggerWaterJet(boss.x, boss.y);
    await sleep(600);
    players.forEach(p => {
        if (!p.dead && (p.x === boss.x || p.y === boss.y)) applyDmg(p, bossAtk);
    });
};

// ---- BOITATÁ (Ato 4) ----
STORY_ANIMAL_SKILLS['boitata_colunas'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    playSfx('skill1');
    addLog(`🔥 Boitatá lança colunas de fogo!`);
    const columns = [boss.x - 1, boss.x, boss.x + 1];
    columns.forEach(col => { if (col >= 0 && col <= 7) triggerFireColumn(col); });
    await sleep(600);
    players.forEach(p => { if (!p.dead && columns.includes(p.x)) applyDmg(p, bossAtk); });
};

STORY_ANIMAL_SKILLS['boitata_explosoes'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    playSfx('skill1');
    addLog(`🔥 Boitatá invoca explosões de fogo!`);
    let count = 0, attempts = 0;
    while (count < 5 && attempts < 50) {
        let idx = Math.floor(Math.random() * 64);
        if (grid[idx] === 'FOGO') {
            triggerFlare(idx % 8, Math.floor(idx / 8));
            players.forEach(p => {
                if (!p.dead && p.x === idx % 8 && p.y === Math.floor(idx / 8)) applyDmg(p, bossAtk);
            });
            count++;
        }
        attempts++;
    }
    await sleep(500);
};

// ---- MULA SEM CABEÇA (Ato 5) ----
STORY_ANIMAL_SKILLS['mula_relincho'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    playSfx('skill1');
    addLog(`🐴 Mula sem Cabeça relincha fogo em 3 colunas!`);
    const columns = [boss.x - 1, boss.x, boss.x + 1].filter(col => col >= 0 && col <= 7);
    columns.forEach(col => triggerFireColumn(col));
    await sleep(600);
    players.forEach(p => { if (!p.dead && columns.includes(p.x)) applyDmg(p, bossAtk); });
};

STORY_ANIMAL_SKILLS['mula_bolas'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    playSfx('skill1');
    addLog(`🐴 Mula sem Cabeça lança bolas de fogo!`);
    const directions = [
        { dx: 2, dy: 0 }, { dx: -2, dy: 0 },
        { dx: 0, dy: 2 }, { dx: 0, dy: -2 }
    ];
    directions.forEach(dir => {
        let targetX = boss.x + dir.dx;
        let targetY = boss.y + dir.dy;
        if (targetX >= 0 && targetX < 8 && targetY >= 0 && targetY < 8) {
            triggerFireball(boss.x, boss.y, targetX, targetY);
            players.forEach(p => {
                if (!p.dead && p.x === targetX && p.y === targetY) setTimeout(() => applyDmg(p, bossAtk), 400);
            });
        }
    });
    await sleep(700);
};

// ---- CORPO SECO (Ato 6) ----
STORY_ANIMAL_SKILLS['corpo_seco_vapor'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    playSfx('garras');
    addLog(`💀 Corpo Seco sopra vapor podre!`);
    const directions = [
        { dx: 0, dy: -1 }, { dx: 0, dy: -2 },
        { dx: 0, dy: 1 }, { dx: 0, dy: 2 },
        { dx: -1, dy: 0 }, { dx: -2, dy: 0 },
        { dx: 1, dy: 0 }, { dx: 2, dy: 0 }
    ];
    directions.forEach(dir => {
        let tileX = boss.x + dir.dx;
        let tileY = boss.y + dir.dy;
        if (tileX >= 0 && tileX < 8 && tileY >= 0 && tileY < 8) {
            triggerPoisonGas(tileX, tileY);
            players.forEach(p => {
                if (!p.dead && p.x === tileX && p.y === tileY) applyDmg(p, bossAtk);
            });
        }
    });
    await sleep(600);
};

STORY_ANIMAL_SKILLS['corpo_seco_garras'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    playSfx('garras');
    addLog(`💀 Corpo Seco ataca com garras!`);
    const attackDirections = ['left', 'right', 'up', 'down'];
    const direction = attackDirections[Math.floor(Math.random() * 4)];
    let targetTiles = [];
    switch (direction) {
        case 'left':
            for (let dx = -2; dx <= 0; dx++) for (let dy = -2; dy <= 2; dy++) targetTiles.push({ x: boss.x + dx, y: boss.y + dy });
            break;
        case 'right':
            for (let dx = 0; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) targetTiles.push({ x: boss.x + dx, y: boss.y + dy });
            break;
        case 'up':
            for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 0; dy++) targetTiles.push({ x: boss.x + dx, y: boss.y + dy });
            break;
        case 'down':
            for (let dx = -2; dx <= 2; dx++) for (let dy = 0; dy <= 2; dy++) targetTiles.push({ x: boss.x + dx, y: boss.y + dy });
            break;
    }
    targetTiles.forEach(tile => {
        if (tile.x >= 0 && tile.x < 8 && tile.y >= 0 && tile.y < 8) {
            triggerClawSpin(tile.x, tile.y);
            players.forEach(p => {
                if (!p.dead && p.x === tile.x && p.y === tile.y) applyDmg(p, bossAtk + 1);
            });
        }
    });
    await sleep(600);
};

// ---- LOBISOMEM (Ato 7) ----
STORY_ANIMAL_SKILLS['lobisomem_garras'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    playSfx('garras');
    addLog(`🐺 Lobisomem ataca com garras!`);
    triggerClawSpin(boss.x, boss.y);
    setTimeout(() => {
        players.forEach(p => {
            if (!p.dead && Math.abs(p.x - boss.x) <= 1 && Math.abs(p.y - boss.y) <= 1) applyDmg(p, bossAtk);
        });
    }, 300);
    await sleep(600);
};

STORY_ANIMAL_SKILLS['lobisomem_tremor'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js
    playSfx('minoa2');
    addLog(`🐺 Lobisomem treme a terra!`);
    triggerEarthquake();
    await sleep(400);
    for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
            if (dx === 0 && dy === 0) continue;
            const tileX = boss.x + dx;
            const tileY = boss.y + dy;
            if (tileX >= 0 && tileX < 8 && tileY >= 0 && tileY < 8) {
                triggerFlare(tileX, tileY);
                players.forEach(p => {
                    if (!p.dead && p.x === tileX && p.y === tileY) applyDmg(p, 2);
                });
            }
        }
    }
    players.forEach(p => {
        if (!p.dead) {
            let newX = p.x, newY = p.y;
            if (p.x < boss.x && !isOccupied(p.x + 1, p.y, p.id)) newX = p.x + 1;
            else if (p.x > boss.x && !isOccupied(p.x - 1, p.y, p.id)) newX = p.x - 1;
            if (p.y < boss.y && !isOccupied(newX, p.y + 1, p.id)) newY = p.y + 1;
            else if (p.y > boss.y && !isOccupied(newX, p.y - 1, p.id)) newY = p.y - 1;
            p.x = newX;
            p.y = newY;
        }
    });
    updateVisuals();
    addLog(`🐺 Heróis foram puxados para perto!`);
    await sleep(400);
};

// ---- CUCA (Ato 8) ----
STORY_ANIMAL_SKILLS['cuca_pocao'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    playSfx('cucask1');
    addLog(`🧙 Cuca lança poção em um quadrante!`);
    const quadrantX = Math.random() < 0.5 ? 0 : 4;
    const quadrantY = Math.random() < 0.5 ? 0 : 4;
    for (let x = quadrantX; x < quadrantX + 4; x++) {
        for (let y = quadrantY; y < quadrantY + 4; y++) {
            triggerPoisonGas(x, y);
        }
    }
    setTimeout(() => {
        for (let x = quadrantX; x < quadrantX + 4; x++) {
            for (let y = quadrantY; y < quadrantY + 4; y++) {
                if (x >= 0 && x < 8 && y >= 0 && y < 8) {
                    players.forEach(p => {
                        if (!p.dead && p.x === x && p.y === y) applyDmg(p, bossAtk);
                    });
                }
            }
        }
    }, 300);
    await sleep(600);
};

STORY_ANIMAL_SKILLS['cuca_cura'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js
    playSfx('cucask2');
    addLog(`🧙 Cuca bebe uma poção curativa!`);
    triggerPotion(boss.x, boss.y);
    await sleep(400);
    boss.hp = Math.min(boss.maxHp, boss.hp + 2);
    showHealEffect(boss.x, boss.y, 2);
    updateVisuals();
    addLog(`💊 Cuca recuperou 2 HP!`);
    await sleep(400);
};

// ---- BOTO ROSA (Ato 9) ----
STORY_ANIMAL_SKILLS['boto_coracoes'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 5;
    playSfx('boto_skill1');
    addLog(`🐬 Boto Rosa quebra corações na área!`);
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const tileX = boss.x + dx;
            const tileY = boss.y + dy;
            if (tileX >= 0 && tileX < 8 && tileY >= 0 && tileY < 8) {
                triggerBrokenHeart(tileX, tileY);
                players.forEach(p => {
                    if (!p.dead && p.x === tileX && p.y === tileY) applyDmg(p, bossAtk);
                });
            }
        }
    }
    await sleep(600);
};

STORY_ANIMAL_SKILLS['boto_jatos'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 5;
    playSfx('boto_skill2');
    addLog(`🐬 Boto Rosa lança jatos d'água em cruz!`);
    for (let y = 0; y < 8; y++) triggerWaterJet(boss.x, y);
    for (let x = 0; x < 8; x++) triggerWaterJet(x, boss.y);
    await sleep(600);
    players.forEach(p => {
        if (!p.dead && (p.x === boss.x || p.y === boss.y)) applyDmg(p, bossAtk);
    });
};

// ---- BOI DA CARA PRETA (Ato 10) ----
STORY_ANIMAL_SKILLS['boi_face'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 5;
    playSfx('boi_skill1');
    addLog(`🐂 Boi da Cara Preta mostra sua face assustadora!`);
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const tileX = boss.x + dx;
            const tileY = boss.y + dy;
            if (tileX >= 0 && tileX < 8 && tileY >= 0 && tileY < 8) {
                triggerScaryFace(tileX, tileY);
                players.forEach(p => {
                    if (!p.dead && p.x === tileX && p.y === tileY) applyDmg(p, bossAtk);
                });
            }
        }
    }
    const affectedIndices = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const tileX = boss.x + dx;
            const tileY = boss.y + dy;
            if (tileX >= 0 && tileX < 8 && tileY >= 0 && tileY < 8) {
                affectedIndices.push(tileY * 8 + tileX);
            }
        }
    }
    affectedIndices.forEach(idx => {
        const newColor = COLORS[Math.floor(Math.random() * 4)];
        grid[idx] = newColor;
        const tile = document.querySelectorAll('#grid .tile')[idx];
        if (tile) tile.className = `tile bg-${newColor}`;
    });
    addLog(`🌪️ Tiles ao redor foram embaralhados!`);
    await sleep(600);
};

STORY_ANIMAL_SKILLS['boi_empurrao'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js
    playSfx('boi_skill2');
    addLog(`🐂 Boi da Cara Preta empurra os heróis para as bordas!`);
    players.forEach(p => {
        if (!p.dead) {
            let nx = p.x, ny = p.y;
            if (p.x < 4) nx = Math.max(0, p.x - 1);
            else nx = Math.min(7, p.x + 1);
            if (p.y < 4) ny = Math.max(0, p.y - 1);
            else ny = Math.min(7, p.y + 1);
            let finalX = p.x, finalY = p.y;
            let stepX = p.x < nx ? 1 : -1;
            for (let x = p.x; x !== nx; x += stepX) {
                if (!isOccupied(x + stepX, p.y, p.id)) finalX = x + stepX;
                else break;
            }
            let stepY = p.y < ny ? 1 : -1;
            for (let y = p.y; y !== ny; y += stepY) {
                if (!isOccupied(finalX, y + stepY, p.id)) finalY = y + stepY;
                else break;
            }
            p.x = finalX;
            p.y = finalY;
        }
    });
    updateVisuals();
    addLog(`🌪️ Heróis foram empurrados para as bordas!`);
    await sleep(400);
    players.forEach(p => { if (!p.dead) applyDmg(p, 1); });
};

// ---- JACI (Ato 11) ----
STORY_ANIMAL_SKILLS['jaci_lua'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 5;
    playSfx('jaci_skill1');
    addLog(`🌙 Jaci invoca a lua e ataca todos os tiles de AR!`);
    triggerMoon(boss.x, boss.y);
    await sleep(400);
    let arTilesAttacked = 0;
    grid.forEach((element, idx) => {
        if (element === 'AR') {
            const x = idx % 8;
            const y = Math.floor(idx / 8);
            triggerMoonRay(x, y);
            arTilesAttacked++;
            players.forEach(p => {
                if (!p.dead && p.x === x && p.y === y) setTimeout(() => applyDmg(p, bossAtk), 200);
            });
        }
    });
    addLog(`🌪️ ${arTilesAttacked} tiles de AR foram atingidos!`);
    await sleep(600);
};

STORY_ANIMAL_SKILLS['jaci_tempestade'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js
    playSfx('jaci_skill2');
    addLog(`🌙 Jaci invoca uma tempestade em todo o tabuleiro!`);
    triggerStorm();
    await sleep(500);
    players.forEach(p => { if (!p.dead) applyDmg(p, 1); });
    boss.hp = Math.min(boss.maxHp, boss.hp + 1);
    showHealEffect(boss.x, boss.y, 1);
    updateVisuals();
    addLog(`💊 Jaci recuperou 1 HP!`);
    await sleep(400);
};

// ---- GUARACI (Ato 12) ----
STORY_ANIMAL_SKILLS['guaraci_sol'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 5;
    playSfx('guaraci_skill1');
    addLog(`☀️ Guaraci invoca o sol e ataca todos os tiles de FOGO!`);
    triggerSun(boss.x, boss.y);
    await sleep(400);
    let fireTilesAttacked = 0;
    grid.forEach((element, idx) => {
        if (element === 'FOGO') {
            const x = idx % 8;
            const y = Math.floor(idx / 8);
            triggerSunRay(x, y);
            fireTilesAttacked++;
            players.forEach(p => {
                if (!p.dead && p.x === x && p.y === y) setTimeout(() => applyDmg(p, bossAtk), 200);
            });
        }
    });
    addLog(`🔥 ${fireTilesAttacked} tiles de FOGO foram atingidos!`);
    await sleep(600);
};

STORY_ANIMAL_SKILLS['guaraci_onda'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js
    playSfx('guaraci_skill2');
    addLog(`☀️ Guaraci invoca uma onda de calor!`);
    triggerHeatWave();
    await sleep(500);
    players.forEach(p => { if (!p.dead) applyDmg(p, 1); });
    boss.hp = Math.min(boss.maxHp, boss.hp + 1);
    showHealEffect(boss.x, boss.y, 1);
    updateVisuals();
    addLog(`💊 Guaraci recuperou 1 HP!`);
    await sleep(400);
};

// ---- ANHANGÁ (Ato 13 — final) ----
STORY_ANIMAL_SKILLS['anhanga_fogo'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 6;
    playSfx('anhanga_skill1');
    addLog(`👹 ANHANGÁ: 'Sintam meu fogo intercalado!'`);
    const columnsToAttack = [];
    for (let col = boss.x; col < 8; col += 2) columnsToAttack.push(col);
    for (let col = boss.x; col >= 0; col -= 2) columnsToAttack.push(col);
    const uniqueColumns = [...new Set(columnsToAttack)];
    uniqueColumns.forEach(col => {
        if (col >= 0 && col <= 7) triggerFireColumn(col);
    });
    await sleep(600);
    players.forEach(p => {
        if (!p.dead && uniqueColumns.includes(p.x)) applyDmg(p, bossAtk);
    });
};

STORY_ANIMAL_SKILLS['anhanga_devora'] = async (enemy, skill) => {
    // ⚠️ CÓPIA FIEL do entidades.js
    playSfx('anhanga_skill2');
    addLog(`👹 ANHANGÁ: 'Eu me alimento da natureza!'`);
    const board = document.getElementById('board');
    const s = getStep();
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
    triggerPotion(boss.x, boss.y);
    await sleep(400);
    boss.hp = Math.min(boss.maxHp, boss.hp + 3);
    showHealEffect(boss.x, boss.y, 3);
    updateVisuals();
    addLog(`💊 Anhangá recuperou 3 HP!`);
    setTimeout(() => { if (suckEffect.parentNode) suckEffect.parentNode.removeChild(suckEffect); }, 1000);
};

// =================================================================
// 🎯 PATCH: substituir os playSfx avulsos dos animais por playSkillSound
// -----------------------------------------------------------------
// Não preciso reescrever os 86 handlers — só sobrescrevo o applyStorySkill
// pra chamar playSkillSound automaticamente no início da skill.
// =================================================================
const _origApplyStorySkill = applyStorySkill;
window.applyStorySkill = async function(enemy, skill) {
    if (!enemy || !skill) return;
    const handlerName = skill.handler;

    // Chama o som automaticamente ANTES do handler rodar
    // (bosses usam som próprio dentro do handler — não passa por aqui)
    const isBossSkill = bossIsStoryBoss(enemy.id) && handlerName && !STORY_SKILL_SOUNDS[handlerName]?.trim?.() &&
                        (handlerName.startsWith('saci_') || handlerName.startsWith('mapinguari_') ||
                         handlerName.startsWith('iara_') || handlerName.startsWith('boitata_') ||
                         handlerName.startsWith('mula_') || handlerName.startsWith('corpo_seco_') ||
                         handlerName.startsWith('lobisomem_') || handlerName.startsWith('cuca_') ||
                         handlerName.startsWith('boto_') || handlerName.startsWith('boi_') ||
                         handlerName.startsWith('jaci_') || handlerName.startsWith('guaraci_') ||
                         handlerName.startsWith('anhanga_'));

    if (!isBossSkill) {
        // Animais comuns → toca som por arquétipo
        playSkillSound(handlerName);
    }

    return _origApplyStorySkill.call(this, enemy, skill);
};

function bossIsStoryBoss(enemyId) {
    return [
        'saci', 'mapinguari', 'iara', 'boitata', 'mula', 'corpo_seco',
        'lobisomem', 'cuca', 'boto', 'boi', 'jaci', 'guaraci', 'anhanga'
    ].includes(enemyId);
}

// =================================================================
// 🌐 EXPÕE O SISTEMA DE SOM NO WINDOW (debug)
// =================================================================
window.STORY_SKILL_SOUNDS = STORY_SKILL_SOUNDS;
window.STORY_ARCHETYPE_SOUNDS = STORY_ARCHETYPE_SOUNDS;
window.STORY_SKILL_FALLBACK_MAP = STORY_SKILL_FALLBACK_MAP;
window.playSkillSound = playSkillSound;

// =================================================================
// 🧪 TESTES DE SOM (console)
// =================================================================
window.testStorySounds = function() {
    console.log('🔊 Sons por arquétipo disponíveis:');
    Object.keys(STORY_ARCHETYPE_SOUNDS).forEach(key => {
        const sfxKey = STORY_ARCHETYPE_SOUNDS[key];
        const exists = typeof sfx !== 'undefined' && sfx[sfxKey];
        console.log(`   ${exists ? '✅' : '⚠️ '} ${key} → sfx.${sfxKey} ${exists ? '' : '(não existe no entidades.js — toca silencioso)'}`);
    });
    console.log('\n🔊 Slots dedicados preenchidos:', 
        Object.entries(STORY_SKILL_SOUNDS).filter(([k,v]) => v && v.trim() !== '').length,
        'de', Object.keys(STORY_SKILL_SOUNDS).length);
};

window.testPlaySkillSound = function(handlerName) {
    console.log(`🔊 Tocando som para: ${handlerName}`);
    console.log(`   Slot dedicado: "${STORY_SKILL_SOUNDS[handlerName] || ''}"`);
    console.log(`   Arquétipo: ${STORY_SKILL_FALLBACK_MAP[handlerName] || 'nenhum'}`);
    const archetype = STORY_SKILL_FALLBACK_MAP[handlerName];
    const sfxKey = archetype ? STORY_ARCHETYPE_SOUNDS[archetype] : 'skill1';
    console.log(`   Chave usada: sfx.${sfxKey}`);
    playSkillSound(handlerName);
};

// =================================================================
// ✅ FIM DO ARQUIVO — historia.js V6.1
// =================================================================
// =================================================================
// historia.js — V6.1 — Bloco 6.1 (CORREÇÃO DE FX)
// Ajusta z-index e posicionamento dos efeitos para ficarem ACIMA dos tiles
// =================================================================

(function fixStoryFxZIndex() {
    // 1. Injeta CSS de correção
    if (!document.getElementById('storyFxFixStyle')) {
        const style = document.createElement('style');
        style.id = 'storyFxFixStyle';
        style.textContent = `
            /* Garante que todo FX fique acima dos tiles */
            #board, #tutorialBoard {
                isolation: isolate;
            }
            #board .story-fx,
            #tutorialBoard .story-fx {
                z-index: 200 !important;
            }
            #board .story-fx * ,
            #tutorialBoard .story-fx * {
                pointer-events: none;
            }
            /* Empurra a arrow e demais indicadores pra cima */
            .tutorial-arrow {
                z-index: 210 !important;
            }
            /* Aumenta z-index dos tokens também pra não ficarem sob FXs */
            #board .token {
                z-index: 150 !important;
            }
        `;
        document.head.appendChild(style);
    }

    // 2. Redireciona os FX para serem filhos do GRID (mesmo contexto dos tiles)
    // Em vez de #board → .grid
    function getFxContainer() {
        const grid = document.getElementById('grid');
        if (grid) return grid;
        return document.getElementById('board');
    }

    // 3. Sobrescreve fxPos pra funcionar com o grid
    const _origFxPos = window.fxPos;
    window.fxPos = function(x, y) {
        const s = (typeof getStep === 'function') ? getStep() : 59;
        // Pega padding do board (o wrapper), não do grid
        const board = document.getElementById('board');
        let pad = 8;
        if (board) {
            const cs = getComputedStyle(board);
            const p = parseFloat(cs.padding || '8');
            if (!isNaN(p)) pad = p;
        }
        return { left: (x * s + pad), top: (y * s + pad), step: s, pad };
    };

    // 4. Sobrescreve spawnFxAt pra usar o grid como container
    const _origSpawnFxAt = window.spawnFxAt;
    window.spawnFxAt = function(fxKey, cssClass, x, y, opts = {}) {
        // Força o container a ser o grid, mesmo se opts.appendTo for passado
        const container = getFxContainer();

        const { left, top, step } = fxPos(x, y);
        const el = fxElement(fxKey, `<div class="${cssClass}"></div>`);
        if (!el) return null;

        el.style.left = left + 'px';
        el.style.top  = top + 'px';

        if (!el.style.width)  el.style.width  = step + 'px';
        if (!el.style.height) el.style.height = step + 'px';

        el.style.zIndex = '200';

        if (opts.scale)  el.style.transform = `scale(${opts.scale})`;
        if (opts.extraClass) el.classList.add(...String(opts.extraClass).split(' '));
        if (opts.delay)  el.style.animationDelay = opts.delay + 'ms';

        const duration = opts.duration || 800;
        setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, duration);

        container.appendChild(el);
        return el;
    };

    console.log('✅ FX z-index corrigido — efeitos agora ficam acima dos tiles.');
})();
// =================================================================
// historia.js — V6.2 — Bloco 6.2
// Suporte a dmg customizado por skill (skill.dmg sobrescreve enemy.atk)
// =================================================================

(function patchDmgSupport() {
    // Guarda a função original
    const _origApplyStorySkill = window.applyStorySkill;

    // Patch no applyStorySkill: se a skill tem dmg, injeta um mini-override
    window.applyStorySkill = async function(enemy, skill) {
        if (!enemy || !skill) return;

        // Se a skill tem "dmg" próprio, cria um clone do enemy com atk = skill.dmg
        // Assim os handlers que leem enemy.atk pegam o valor customizado
        let effectiveEnemy = enemy;
        if (typeof skill.dmg === 'number' && skill.dmg > 0) {
            effectiveEnemy = Object.assign({}, enemy, { atk: skill.dmg });
        }

        return _origApplyStorySkill.call(this, effectiveEnemy, skill);
    };

    console.log('✅ Suporte a skill.dmg ativado.');
})();