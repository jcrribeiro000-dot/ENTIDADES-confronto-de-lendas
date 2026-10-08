// =================================================================
// ENTIDADES: Confronto de Lendas — MODO HISTÓRIA
// historia.js — V5.1
// Bloco 1/4 — CSS + Sprites + uiIcon + Save
// =================================================================
//
// ⚠️ NÃO TOCA EM entidades.js
// Sobrescreve applyDmg/manageTurns/saveAndRefresh SÓ quando _storyMode === true.
//
// V5.1 — CORREÇÕES:
//   • B4 — aldeia_bg aceita imagem
//   • B5 — loadStoryProgressByName NÃO libera todos os atos
//   • B7 — Sistema uiIcon() universal
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
    'jacare':'https://i.imgur.com/oTZzXX2.gif','cervo':'https://i.imgur.com/iH2bRRx.gif','onca_parda':'https://i.imgur.com/jN7AuyW.gif',
    // --- Ato 2 — Inimigos ---
    'tamandua':'https://i.imgur.com/8Breoi9.gif','anta':'https://i.imgur.com/0avAEnD.gif','queixada':'https://i.imgur.com/0fsGkKs.gif','sucuri':'https://i.imgur.com/0dt6Jk2.gif',
    // --- Ato 3 — Iara (rio) ---
    'piranha':'https://i.imgur.com/KKOPhc5.gif','lontra':'https://i.imgur.com/wOHYX2a.gif','ariranha':'https://i.imgur.com/7obkFIq.gif','pirarucu':'https://i.imgur.com/4dHWgkT.gif',
    // --- Ato 4 — Boitatá (caverna) ---
    'cascavel':'https://i.imgur.com/4QjmPV2.gif','coral':'https://i.imgur.com/8kstFde.gif','jararaca':'https://i.imgur.com/5Ll9B9h.gif','tartaruga':'https://i.imgur.com/wr0u1rt.gif',
    // --- Ato 5 — Mula (campos) ---
    'bode':'https://i.imgur.com/vknDxdA.gif','carneiro':'','cavalo_selvagem':'','touro_bravo':'',
    // --- Ato 6 — Corpo Seco (sertão) ---
    'urubu':'','carcara':'','tatu':'','lobo_guara':'',
    // --- Ato 7 — Lobisomem (mata fria) ---
    'cachorro_mato':'','raposa':'','guaxinim':'','jaguatirica':'',
    // --- Ato 8 — Cuca (pântano) ---
    'morcego':'','coruja':'','sapo_cururu':'','seriema':'',
    // --- Ato 9 — Boto (água doce) ---
    'tucunare':'','piraiba':'','dourada':'','peixe_boi':'',
    // --- Ato 10 — Boi (pasto) ---
    'bufalo':'','vaca_louca':'','cabra_preta':'','zebu':'',
    // --- Ato 11 — Jaci (montanha) ---
    'gato_mato':'','mariposa_gigante':'','quati':'','sucuarana':'',
    // --- Ato 12 — Guaraci (planalto) ---
    'gaviao':'','falcao':'','urutau':'','aguia_cinzenta':'',
    // --- Ato 13 — Espectros (usa sprite base, transparente via CSS) ---
    'espectro_saci':'','espectro_mapinguari':'','espectro_iara':'','espectro_boitata':'',
    'espectro_mula':'','espectro_corposeco':'','espectro_lobisomem':'','espectro_cuca':'',
    'espectro_boto':'','espectro_boi':'','espectro_jaci':'','espectro_guaraci':'',

    // --- Cenários ---
    'bg_1_1':'https://i.imgur.com/OWIsmOc.png','bg_1_2':'https://i.imgur.com/XBd9za6.png','bg_1_3':'https://i.imgur.com/iNDxFfh.png','bg_1_4':'https://i.imgur.com/A25ehvZ.png','bg_1_boss':'https://i.imgur.com/s6xi6kN.png',
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
    'capa_ato1':'https://i.imgur.com/pEXoYe0.jpeg','capa_ato2':'https://i.imgur.com/tkn3w1A.jpeg','capa_ato3':'https://i.imgur.com/enf4Ffa.jpeg','capa_ato4':'https://i.imgur.com/BNl5IGf.jpeg','capa_ato5':'https://i.imgur.com/TCeWp2u.jpeg',
    'capa_ato6':'https://i.imgur.com/1hsYJGY.jpeg','capa_ato7':'https://i.imgur.com/Ajkb19b.jpeg','capa_ato8':'https://i.imgur.com/clamKCi.jpeg','capa_ato9':'https://i.imgur.com/N2a1yXT.jpeg','capa_ato10':'https://i.imgur.com/13DFRys.jpeg',
    'capa_ato11':'https://i.imgur.com/wAdrEXH.jpeg','capa_ato12':'https://i.imgur.com/cFTni7W.jpeg','capa_ato13':'https://i.imgur.com/J3lDlLS.jpeg',

    // --- Aldeia ---
    'aldeia_bg':'https://i.imgur.com/ld3V2eD.png','aldeia_atos':'https://i.imgur.com/BrloIjF.png','aldeia_oca':'https://i.imgur.com/419FdCx.png','aldeia_loja':'https://i.imgur.com/dFSunKa.png',
    'aldeia_ritual':'https://i.imgur.com/wb2Nu4l.png','aldeia_bestiario':'https://i.imgur.com/RQn91EK.png','aldeia_tesouraria':'https://i.imgur.com/vrurP0D.png',

    // --- Armas ---
    'arma_cajado':'','arma_arco':'','arma_manopla':'',

    // --- Ícones UI (B7) ---
    'ui_gold':'https://i.imgur.com/LIfKWB8.png',       // 💰
    'ui_xp':'https://i.imgur.com/sksvz3H.png',         // ⭐
    'ui_swap':'https://i.imgur.com/12PFW5I.png',       // 🔄
    'ui_home':'https://i.imgur.com/ld3V2eD.png',       // 🏘️
    'ui_play':'https://i.imgur.com/mXodqS6.png',       // ▶
    'ui_gift':'https://i.imgur.com/a5t2pWl.png',       // 🎁
    'ui_crown':'',      // 👑
    'ui_sparkle':'',    // ✨
    'ui_skull':'https://i.imgur.com/GPSPBly.png',      // 💀
    'ui_lock':'https://i.imgur.com/wGgq9l7.png',       // 🔒
    'ui_check':'https://i.imgur.com/Y0g5RoY.png',      // ✅
    'ui_arrow':'https://i.imgur.com/mXodqS6.png',      // ▶ (seta dos cards)
    'ui_warn':'',       // ⚠️
    'ui_medal':'https://i.imgur.com/ViAr1EO.png',      // 🏅
    'elem_fogo':'https://i.imgur.com/JouEZbM.png',     // 🔥
    'elem_agua':'https://i.imgur.com/tMRUv48.png',     // 💧
    'elem_terra':'https://i.imgur.com/ZVPQ9iH.png',    // ⛰️
    'elem_ar':'https://i.imgur.com/HLqTdbd.png',       // 🌪️
    // Aliases (compatibilidade com código existente)
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

/**
 * Retorna HTML de um ícone (imagem ou emoji fallback).
 * Uso:
 *   uiIcon('gold')         → <img src="..." class="ui-icon"> ou 💰
 *   uiIcon('lock', '--lg') → versão maior
 */
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

/** Helper pra elementos (FOGO, AGUA, TERRA, AR) */
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
// 👹 INIMIGOS (continua igual — Ato 1 ao 13)
// =================================================================
const STORY_ENEMIES = {
    porco_espinho:{id:'porco_espinho',name:'Porco-Espinho',hp:10,atk:2,
        skill1:{name:'Espinhos Erguidos',type:'area_around',area:1,dmg:2},
        skill2:{name:'Bote',type:'dash_line',range:2,dmg:2}},
    jacare:{id:'jacare',name:'Jacaré',hp:12,atk:2,
        skill1:{name:'Bocada',type:'line_cardinal',range:2,dmg:2},
        skill2:{name:'Giro de Cauda',type:'area_around',area:1,dmg:2}},
    cervo:{id:'cervo',name:'Cervo',hp:12,atk:2,
        skill1:{name:'Investida',type:'charge',dmg:2},
        skill2:{name:'Chifrada',type:'area_around',area:1,dmg:2}},
    onca_parda:{id:'onca_parda',name:'Onça-Parda',hp:20,atk:3,
        skill1:{name:'Garra',type:'area_around',area:2,dmg:3},
        skill2:{name:'Salto',type:'jump',distance:2,dmg:3,area:1}},
    saci:{id:'saci',name:'Saci',hp:30,atk:4,isBoss:true},
    tamandua:{id:'tamandua',name:'Tamanduá-Bandeira',hp:14,atk:2,
        skill1:{name:'Garras Longas',type:'area_around',area:1,dmg:2},
        skill2:{name:'Bicada',type:'dash_line',range:2,dmg:2}},
    anta:{id:'anta',name:'Anta',hp:20,atk:3,
        skill1:{name:'Pisada Pesada',type:'area_around',area:2,dmg:3},
        skill2:{name:'Atropelamento',type:'charge',dmg:3}},
    queixada:{id:'queixada',name:'Queixada',hp:18,atk:3,
        skill1:{name:'Mordida em Linha',type:'line_cardinal',range:2,dmg:3},
        skill2:{name:'Estouro de Manada',type:'area_around',area:1,dmg:3}},
    sucuri:{id:'sucuri',name:'Sucuri Gigante',hp:28,atk:3,isMiniBoss:true,
        skill1:{name:'Constrição',type:'area_around',area:2,dmg:3},
        skill2:{name:'Engolir',type:'dash_line',range:2,dmg:3}},
    mapinguari:{id:'mapinguari',name:'Mapinguari',hp:40,atk:4,isBoss:true},
    piranha:{id:'piranha',name:'Piranha',hp:12,atk:2,
        skill1:{name:'Cardume',type:'area_around',area:1,dmg:2},
        skill2:{name:'Mordida Rápida',type:'dash_line',range:2,dmg:2}},
    lontra:{id:'lontra',name:'Lontra',hp:16,atk:2,
        skill1:{name:'Garras Aquáticas',type:'area_around',area:1,dmg:2},
        skill2:{name:'Nado Veloz',type:'dash_line',range:2,dmg:2}},
    ariranha:{id:'ariranha',name:'Ariranha',hp:18,atk:3,
        skill1:{name:'Matilha Aquática',type:'area_around',area:2,dmg:3},
        skill2:{name:'Bote do Rio',type:'charge',dmg:3}},
    pirarucu:{id:'pirarucu',name:'Pirarucu',hp:26,atk:3,isMiniBoss:true,
        skill1:{name:'Bocarra',type:'line_cardinal',range:2,dmg:3},
        skill2:{name:'Caudada',type:'area_around',area:2,dmg:3}},
    iara:{id:'iara',name:'Iara',hp:40,atk:4,isBoss:true},
    cascavel:{id:'cascavel',name:'Cascavel',hp:14,atk:2,
        skill1:{name:'Chocalho Ameaçador',type:'area_around',area:1,dmg:2},
        skill2:{name:'Bote Peçonhento',type:'dash_line',range:2,dmg:2}},
    coral:{id:'coral',name:'Cobra-Coral',hp:14,atk:2,
        skill1:{name:'Anéis Coloridos',type:'area_around',area:1,dmg:2},
        skill2:{name:'Peçonha',type:'line_cardinal',range:2,dmg:2}},
    jararaca:{id:'jararaca',name:'Jararaca',hp:18,atk:3,
        skill1:{name:'Bote Traiçoeiro',type:'dash_line',range:2,dmg:3},
        skill2:{name:'Enrolar',type:'area_around',area:1,dmg:3}},
    tartaruga:{id:'tartaruga',name:'Tartaruga-da-Amazônia',hp:28,atk:3,isMiniBoss:true,
        skill1:{name:'Casco Duro',type:'area_around',area:1,dmg:3},
        skill2:{name:'Pancada Pesada',type:'charge',dmg:3}},
    boitata:{id:'boitata',name:'Boitatá',hp:42,atk:4,isBoss:true},
    bode:{id:'bode',name:'Bode',hp:16,atk:2,
        skill1:{name:'Cornada',type:'area_around',area:1,dmg:2},
        skill2:{name:'Marrada',type:'dash_line',range:2,dmg:2}},
    carneiro:{id:'carneiro',name:'Carneiro Selvagem',hp:18,atk:2,
        skill1:{name:'Trombada',type:'dash_line',range:2,dmg:2},
        skill2:{name:'Pisada',type:'area_around',area:1,dmg:2}},
    cavalo_selvagem:{id:'cavalo_selvagem',name:'Cavalo Selvagem',hp:20,atk:3,
        skill1:{name:'Coice',type:'dash_line',range:2,dmg:3},
        skill2:{name:'Relincho Furioso',type:'area_around',area:2,dmg:3}},
    touro_bravo:{id:'touro_bravo',name:'Touro Bravo',hp:30,atk:3,isMiniBoss:true,
        skill1:{name:'Cornada Violenta',type:'dash_line',range:2,dmg:3},
        skill2:{name:'Pisoteada',type:'area_around',area:2,dmg:3}},
    mula:{id:'mula',name:'Mula sem Cabeça',hp:42,atk:4,isBoss:true},
    urubu:{id:'urubu',name:'Urubu',hp:14,atk:2,
        skill1:{name:'Voo Rasante',type:'dash_line',range:2,dmg:2},
        skill2:{name:'Bicada',type:'area_around',area:1,dmg:2}},
    carcaara:{id:'carcara',name:'Carcará',hp:16,atk:3,
        skill1:{name:'Garras Afiadas',type:'area_around',area:1,dmg:3},
        skill2:{name:'Voo Veloz',type:'dash_line',range:2,dmg:3}},
    tatu:{id:'tatu',name:'Tatu',hp:18,atk:2,
        skill1:{name:'Casco Duro',type:'area_around',area:1,dmg:2},
        skill2:{name:'Cavar',type:'charge',dmg:2}},
    lobo_guara:{id:'lobo_guara',name:'Lobo-Guará',hp:28,atk:3,isMiniBoss:true,
        skill1:{name:'Uivo',type:'area_around',area:2,dmg:3},
        skill2:{name:'Bote Selvagem',type:'dash_line',range:2,dmg:3}},
    corpo_seco:{id:'corpo_seco',name:'Corpo Seco',hp:44,atk:4,isBoss:true},
    cachorro_mato:{id:'cachorro_mato',name:'Cachorro-do-Mato',hp:16,atk:2,
        skill1:{name:'Mordida',type:'dash_line',range:2,dmg:2},
        skill2:{name:'Rosnado',type:'area_around',area:1,dmg:2}},
    raposa:{id:'raposa',name:'Raposa',hp:16,atk:2,
        skill1:{name:'Astúcia',type:'dash_line',range:2,dmg:2},
        skill2:{name:'Bote Ágil',type:'area_around',area:1,dmg:2}},
    guaxinim:{id:'guaxinim',name:'Guaxinim',hp:18,atk:3,
        skill1:{name:'Garras Noturnas',type:'area_around',area:1,dmg:3},
        skill2:{name:'Ataque Surpresa',type:'dash_line',range:2,dmg:3}},
    jaguatirica:{id:'jaguatirica',name:'Jaguatirica',hp:30,atk:3,isMiniBoss:true,
        skill1:{name:'Garras Selvagens',type:'area_around',area:2,dmg:3},
        skill2:{name:'Salto Mortal',type:'jump',distance:2,dmg:3,area:1}},
    lobisomem:{id:'lobisomem',name:'Lobisomem',hp:46,atk:4,isBoss:true},
    morcego:{id:'morcego',name:'Morcego',hp:14,atk:2,
        skill1:{name:'Voo Sombrio',type:'dash_line',range:2,dmg:2},
        skill2:{name:'Eco',type:'area_around',area:1,dmg:2}},
    coruja:{id:'coruja',name:'Coruja',hp:16,atk:3,
        skill1:{name:'Garras Noturnas',type:'area_around',area:1,dmg:3},
        skill2:{name:'Voo Silencioso',type:'dash_line',range:2,dmg:3}},
    sapo_cururu:{id:'sapo_cururu',name:'Sapo-Cururu',hp:18,atk:2,
        skill1:{name:'Veneno',type:'area_around',area:1,dmg:2},
        skill2:{name:'Língua',type:'line_cardinal',range:2,dmg:2}},
    seriema:{id:'seriema',name:'Seriema',hp:28,atk:3,isMiniBoss:true,
        skill1:{name:'Bicada Feroz',type:'dash_line',range:2,dmg:3},
        skill2:{name:'Grito',type:'area_around',area:2,dmg:3}},
    cuca:{id:'cuca',name:'Cuca',hp:46,atk:5,isBoss:true},
    tucunare:{id:'tucunare',name:'Tucunaré',hp:16,atk:2,
        skill1:{name:'Bote Aquático',type:'dash_line',range:2,dmg:2},
        skill2:{name:'Cardume',type:'area_around',area:1,dmg:2}},
    piraiba:{id:'piraiba',name:'Piraíba',hp:20,atk:3,
        skill1:{name:'Bocarra',type:'line_cardinal',range:2,dmg:3},
        skill2:{name:'Caudada',type:'area_around',area:2,dmg:3}},
    dourada:{id:'dourada',name:'Dourada',hp:20,atk:3,
        skill1:{name:'Escamas Douradas',type:'area_around',area:1,dmg:3},
        skill2:{name:'Nado Rápido',type:'dash_line',range:2,dmg:3}},
    peixe_boi:{id:'peixe_boi',name:'Peixe-Boi',hp:32,atk:3,isMiniBoss:true,
        skill1:{name:'Corpulência',type:'area_around',area:2,dmg:3},
        skill2:{name:'Pancada na Água',type:'charge',dmg:3}},
    boto:{id:'boto',name:'Boto Rosa',hp:48,atk:5,isBoss:true},
    bufalo:{id:'bufalo',name:'Búfalo Selvagem',hp:20,atk:3,
        skill1:{name:'Marrada Selvagem',type:'dash_line',range:2,dmg:3},
        skill2:{name:'Pisoteada',type:'area_around',area:2,dmg:3}},
    vaca_louca:{id:'vaca_louca',name:'Vaca Louca',hp:18,atk:3,
        skill1:{name:'Coice',type:'dash_line',range:2,dmg:3},
        skill2:{name:'Fúria',type:'area_around',area:1,dmg:3}},
    cabra_preta:{id:'cabra_preta',name:'Cabra Preta',hp:16,atk:2,
        skill1:{name:'Cornada',type:'area_around',area:1,dmg:2},
        skill2:{name:'Bote',type:'dash_line',range:2,dmg:2}},
    zebu:{id:'zebu',name:'Zebu',hp:32,atk:4,isMiniBoss:true,
        skill1:{name:'Marrada Bruta',type:'dash_line',range:2,dmg:4},
        skill2:{name:'Pisada Pesada',type:'area_around',area:2,dmg:4}},
    boi:{id:'boi',name:'Boi da Cara Preta',hp:50,atk:5,isBoss:true},
    gato_mato:{id:'gato_mato',name:'Gato-do-Mato',hp:18,atk:3,
        skill1:{name:'Garras Noturnas',type:'area_around',area:1,dmg:3},
        skill2:{name:'Salto Silencioso',type:'jump',distance:2,dmg:3,area:1}},
    mariposa_gigante:{id:'mariposa_gigante',name:'Mariposa Gigante',hp:16,atk:2,
        skill1:{name:'Pó Lunar',type:'area_around',area:2,dmg:2},
        skill2:{name:'Voo Rasante',type:'dash_line',range:2,dmg:2}},
    quati:{id:'quati',name:'Quati',hp:18,atk:3,
        skill1:{name:'Garras Afiadas',type:'area_around',area:1,dmg:3},
        skill2:{name:'Bote Rápido',type:'dash_line',range:2,dmg:3}},
    sucuarana:{id:'sucuarana',name:'Suçuarana',hp:32,atk:4,isMiniBoss:true,
        skill1:{name:'Garra Fatal',type:'area_around',area:2,dmg:4},
        skill2:{name:'Salto Mortal',type:'jump',distance:2,dmg:4,area:1}},
    jaci:{id:'jaci',name:'Jaci',hp:50,atk:5,isBoss:true},
    gaviao:{id:'gaviao',name:'Gavião',hp:18,atk:3,
        skill1:{name:'Voo Rasante',type:'dash_line',range:2,dmg:3},
        skill2:{name:'Garras',type:'area_around',area:1,dmg:3}},
    falcao:{id:'falcao',name:'Falcão',hp:20,atk:3,
        skill1:{name:'Mergulho Mortal',type:'dash_line',range:2,dmg:3},
        skill2:{name:'Garras Cortantes',type:'area_around',area:2,dmg:3}},
    urutau:{id:'urutau',name:'Urutau',hp:18,atk:3,
        skill1:{name:'Canto Sombrio',type:'area_around',area:2,dmg:3},
        skill2:{name:'Voo Silencioso',type:'dash_line',range:2,dmg:3}},
    aguia_cinzenta:{id:'aguia_cinzenta',name:'Águia-Cinzenta',hp:34,atk:4,isMiniBoss:true,
        skill1:{name:'Garras Reais',type:'area_around',area:2,dmg:4},
        skill2:{name:'Mergulho Solar',type:'dash_line',range:2,dmg:4}},
    guaraci:{id:'guaraci',name:'Guaraci',hp:52,atk:5,isBoss:true},
    espectro_saci:{id:'espectro_saci',name:'Espectro do Saci',hp:10,atk:2,isSpectral:true},
    espectro_mapinguari:{id:'espectro_mapinguari',name:'Espectro do Mapinguari',hp:10,atk:2,isSpectral:true},
    espectro_iara:{id:'espectro_iara',name:'Espectro da Iara',hp:10,atk:2,isSpectral:true},
    espectro_boitata:{id:'espectro_boitata',name:'Espectro do Boitatá',hp:10,atk:2,isSpectral:true},
    espectro_mula:{id:'espectro_mula',name:'Espectro da Mula sem Cabeça',hp:10,atk:2,isSpectral:true},
    espectro_corposeco:{id:'espectro_corposeco',name:'Espectro do Corpo Seco',hp:10,atk:2,isSpectral:true},
    espectro_lobisomem:{id:'espectro_lobisomem',name:'Espectro do Lobisomem',hp:10,atk:2,isSpectral:true},
    espectro_cuca:{id:'espectro_cuca',name:'Espectro da Cuca',hp:10,atk:2,isSpectral:true},
    espectro_boto:{id:'espectro_boto',name:'Espectro do Boto Rosa',hp:10,atk:2,isSpectral:true},
    espectro_boi:{id:'espectro_boi',name:'Espectro do Boi da Cara Preta',hp:10,atk:2,isSpectral:true},
    espectro_jaci:{id:'espectro_jaci',name:'Espectro da Jaci',hp:10,atk:2,isSpectral:true},
    espectro_guaraci:{id:'espectro_guaraci',name:'Espectro do Guaraci',hp:10,atk:2,isSpectral:true},
    anhanga:{id:'anhanga',name:'Anhangá',hp:60,atk:6,isBoss:true,isFinalBoss:true}
};

// =================================================================
// 🗺️ CAPÍTULOS (sem mudanças — 13 atos)
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

// ⚡ B5 — CORRIGIDO: NÃO libera todos os atos ao carregar
function loadStoryProgressByName(saveName){
    try {
        const raw = localStorage.getItem(getSaveKey(saveName));
        if(!raw) return false;
        const loaded = JSON.parse(raw);
        STORY_PROGRESS = Object.assign(createEmptyStoryProgress(), loaded);

        // ⚡ Garante valores padrão mínimos se o save estiver corrompido
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
// 🎁 HELPERS
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
function rollStoryDrops(enemyId){
    const drops = [], table = STORY_DROP_TABLE[enemyId];
    if(!table) return drops;
    if(table.comum && Math.random()*100 < table.comum.chance) drops.push({id:table.comum.id,qty:1});
    if(table.raro  && Math.random()*100 < table.raro.chance)  drops.push({id:table.raro.id,qty:1});
    return drops;
}
function getStoryEnemyName(id){ return STORY_ENEMIES[id]?.name || id; }
// =================================================================
// historia.js — V5.1 — Bloco 2/6
// Diálogos dos bosses (todos os 13 atos) + diálogos finais
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

// =================================================================
// 🗺️ MAPA: qual diálogo final usar por enemyId de boss
// =================================================================
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
// historia.js — V5.1 — Bloco 3/6
// Modal de save + Aldeia + navegação + atos/fases + OCA + loja
// Correções: B4 (aldeia_bg aceita imagem), B6 (re-render),
//            B7 (sistema uiIcon universal)
// =================================================================

// =================================================================
// 🏷️ MODAL DE NOME DO SAVE
// =================================================================
function showStorySaveNameModal(options={}){
    const { allowCancel=true, title='NOVO SAVE' } = options;
    const old = document.getElementById('storySaveNameModal');
    if(old) old.remove();

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
                       value="${lastUsed||''}">
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
        if(!inp) return;
        inp.focus(); inp.select();
        inp.addEventListener('input', updateStorySaveElementPreview);
        inp.addEventListener('keydown', e => {
            if(e.key==='Enter') confirmStorySaveName();
            if(e.key==='Escape' && allowCancel) closeStorySaveNameModal();
        });
        updateStorySaveElementPreview();
    }, 60);
}

function updateStorySaveElementPreview(){
    const inp = document.getElementById('storySaveNameInput');
    const prev = document.getElementById('storySaveElementPreview');
    if(!inp || !prev) return;
    const name = inp.value.trim();
    if(!name){ prev.innerHTML = '<span class="story-save-element-empty">Digite um nome...</span>'; return; }
    const el = getElementFromName(name);
    prev.innerHTML = `
        <div class="story-save-element-label">ELEMENTO DO TIME:</div>
        <div class="story-save-element-value elem-${el}">${elemIcon(el)} ${el}</div>
    `;
}

function confirmStorySaveName(){
    const inp = document.getElementById('storySaveNameInput');
    if(!inp) return;
    const name = inp.value.trim();
    if(!name){ alert('Digite um nome para o save!'); return; }
    if(name.length<2){ alert('O nome precisa ter pelo menos 2 caracteres.'); return; }

    const exists = listStorySaves().some(s => s.name.toLowerCase() === name.toLowerCase());
    if(exists){
        if(!confirm(`Já existe um save "${name}". Carregar?`)) return;
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
    if(m) m.remove();
    if(!STORY_CURRENT_SAVE_NAME){
        const ss = document.getElementById('storyScreen');
        if(ss){ ss.style.display='none'; ss.classList.remove('active'); }
        if(typeof showScreen === 'function') showScreen('titleScreen');
        currentScreen = 'title';
    }
}

// =================================================================
// 🎯 ENTRADA NO MODO HISTÓRIA
// =================================================================
function showStoryScreen(){
    ['titleScreen','modeScreen','challengeScreen','playersScreen','gameScreen','configScreen','tutorialScreen']
        .forEach(id => { const el = document.getElementById(id); if(el) el.style.display='none'; });

    const screen = document.getElementById('storyScreen');
    if(!screen){ console.error('#storyScreen não encontrada'); return; }

    if(!STORY_CURRENT_SAVE_NAME){
        const lastUsed = getLastUsedSaveName();
        if(lastUsed && loadStoryProgressByName(lastUsed)){
            // ok, carregou
        } else {
            screen.style.display = 'flex';
            screen.classList.add('active');
            currentScreen = 'story';
            showStorySaveNameModal({ allowCancel:true, title:'NOVO SAVE' });
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
    if(s){ s.style.display='none'; s.classList.remove('active'); }
    currentScreen = 'title';
    if(typeof showScreen === 'function') showScreen('titleScreen');
}

function changeStorySave(){
    showStorySaveNameModal({ allowCancel:true, title:'TROCAR SAVE' });
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
    if(!screen) return;

    if(!STORY_CURRENT_SAVE_NAME || !STORY_PROGRESS.saveName){
        screen.style.display = 'none';
        screen.classList.remove('active');
        showStorySaveNameModal({ allowCancel:true, title:'NOVO SAVE' });
        return;
    }

    const gold = STORY_PROGRESS.gold||0;
    const xp = STORY_PROGRESS.totalXP||0;
    const saveName = STORY_CURRENT_SAVE_NAME;
    const saveEl = getSaveElement();

    // Progresso geral (todos os capítulos definidos)
    const allChapters = Object.values(STORY_CHAPTERS);
    let totalCompleted = 0, totalPhases = 0;
    allChapters.forEach(ch => {
        totalPhases += ch.phases.length;
        totalCompleted += ch.phases.filter(p=>isPhaseCompleted(p.id)).length;
    });
    const pct = totalPhases > 0 ? Math.round((totalCompleted/totalPhases)*100) : 0;

    // ⚡ B4 — aldeia_bg agora aceita imagem via SPRITES_STORY (fallback pra emoji)
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

// ⚡ Aceita imagem via SPRITES_STORY['aldeia_*'] com fallback pra emoji
function renderAldeiaBtn(key, label, desc, locked=false){
    const spriteKey = 'aldeia_' + key;
    const url = SPRITES_STORY[spriteKey];
    let iconHTML;
    if(url && url.trim() !== ''){
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
    if(key==='atos') return renderAtosScreen();
    if(key==='oca') return renderOcaScreen();
    if(key==='loja') return renderLojaScreen();
    if(key==='ritual') return renderPlaceholder(uiIcon('warn'),'RITUAL','Em breve.');
    if(key==='bestiario') return renderPlaceholder(uiIcon('story'),'BESTIÁRIO','Em breve.');
    if(key==='tesouraria') return renderPlaceholder(uiIcon('medal'),'TESOURARIA','Em breve.');
}

// =================================================================
// 🗺️ ATOS / FASES
// =================================================================
function renderAtosScreen(){
    const screen = document.getElementById('storyScreen');
    if(!screen) return;
    let html = '';
    Object.values(STORY_CHAPTERS).forEach(ch => {
        const un = STORY_PROGRESS.unlockedChapters.includes(ch.id);
        const comp = ch.phases.filter(p=>isPhaseCompleted(p.id)).length;
        const tot = ch.phases.length;
        const pct = Math.round((comp/tot)*100);
        if(un){
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
    const ch = STORY_CHAPTERS[id]; if(!ch) return;
    renderChapterPhases(ch);
}

function renderChapterPhases(ch){
    const screen = document.getElementById('storyScreen');
    if(!screen) return;
    let html = '';
    ch.phases.forEach(ph => {
        const un = isPhaseUnlocked(ch.id, ph.id);
        const comp = isPhaseCompleted(ph.id);
        const boss = ph.isBoss;
        const finalBoss = ph.isFinalBoss;
        let statusIcon;
        if(comp) statusIcon = uiIcon('check');
        else if(un) statusIcon = `<span class="story-phase-available">${uiIcon('arrow')}</span>`;
        else statusIcon = uiIcon('lock');
        const enemiesHTML = ph.enemies.map(eid => {
            const e = STORY_ENEMIES[eid]; if(!e) return '';
            return `<span class="story-phase-enemy" title="${e.name}">${SPRITES_STORY[eid]?storySprite(eid):`<span class="story-enemy-mini">${EMOJI_STORY[eid]||'?'}</span>`}</span>`;
        }).join('<span class="story-phase-arrow">→</span>');
        const cls = [
            'story-phase-card',
            un?'unlocked':'locked',
            comp?'completed':'',
            boss?'boss-phase':'',
            finalBoss?'final-boss':''
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
    const screen = document.getElementById('storyScreen'); if(!screen) return;
    const saveEl = getSaveElement();
    const html = STORY_PROGRESS.unlockedHeroes.map(hc => {
        const sp = (typeof SPRITES !== 'undefined' && SPRITES[hc]) || '';
        const sel = STORY_PROGRESS.selectedHeroes.includes(hc);
        const el = getHeroStoryElement(hc);
        const lv = STORY_PROGRESS.heroLevels[hc]||1;
        const xp = STORY_PROGRESS.heroXP[hc]||0;
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
    const i = STORY_PROGRESS.selectedHeroes.indexOf(hc);
    if(i>=0){ if(STORY_PROGRESS.selectedHeroes.length>1) STORY_PROGRESS.selectedHeroes.splice(i,1); }
    else STORY_PROGRESS.selectedHeroes.push(hc);
    saveStoryProgress(); renderOcaScreen();
}

function renderLojaScreen(){
    const screen = document.getElementById('storyScreen'); if(!screen) return;
    const gold = STORY_PROGRESS.gold||0;
    const html = STORY_SHOP_ITEMS.map(it => {
        const m = STORY_MATERIALS[it.id];
        const emoji = m ? m.emoji : (it.emoji||'❓');
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
    if(!spendGold(price)){ alert('Ouro insuficiente!'); return; }
    addMaterial(id,1); saveStoryProgress(); renderLojaScreen();
}

function renderPlaceholder(emoji, title, text){
    const screen = document.getElementById('storyScreen'); if(!screen) return;
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
// historia.js — V5.1 — Bloco 4/6
// showBossIntroDialog + showBossFinalDialog + applyStorySkill + IA
// =================================================================

// =================================================================
// 💬 MOSTRA DIÁLOGO DO BOSS QUANDO UM INIMIGO ENTRA EM CENA
// =================================================================
function showBossIntroDialog(enemyId){
    const cid = STORY_PROGRESS.currentChapter || 1;

    let introPool, bossName, themeClass;
    if(cid === 1){ introPool = STORY_ENEMY_INTROS; bossName = 'SACI'; themeClass = ''; }
    else if(cid === 2){ introPool = STORY_ENEMY_INTROS_A2; bossName = 'MAPINGUARI'; themeClass = 'a2'; }
    else if(cid === 3){ introPool = STORY_ENEMY_INTROS_A3; bossName = 'IARA'; themeClass = 'a3'; }
    else if(cid === 4){ introPool = STORY_ENEMY_INTROS_A4; bossName = 'BOITATÁ'; themeClass = 'a4'; }
    else if(cid === 5){ introPool = STORY_ENEMY_INTROS_A5; bossName = 'MULA SEM CABEÇA'; themeClass = 'a5'; }
    else if(cid === 6){ introPool = STORY_ENEMY_INTROS_A6; bossName = 'CORPO SECO'; themeClass = 'a6'; }
    else if(cid === 7){ introPool = STORY_ENEMY_INTROS_A7; bossName = 'LOBISOMEM'; themeClass = 'a7'; }
    else if(cid === 8){ introPool = STORY_ENEMY_INTROS_A8; bossName = 'CUCA'; themeClass = 'a8'; }
    else if(cid === 9){ introPool = STORY_ENEMY_INTROS_A9; bossName = 'BOTO ROSA'; themeClass = 'a9'; }
    else if(cid === 10){ introPool = STORY_ENEMY_INTROS_A10; bossName = 'BOI DA CARA PRETA'; themeClass = 'a10'; }
    else if(cid === 11){ introPool = STORY_ENEMY_INTROS_A11; bossName = 'JACI'; themeClass = 'a11'; }
    else if(cid === 12){ introPool = STORY_ENEMY_INTROS_A12; bossName = 'GUARACI'; themeClass = 'a12'; }
    else if(cid === 13){ introPool = STORY_ENEMY_INTROS_A13; bossName = 'ANHANGÁ'; themeClass = 'a13'; }
    else { introPool = STORY_ENEMY_INTROS; bossName = 'SACI'; themeClass = ''; }

    const intro = introPool[enemyId];
    if(!intro) return Promise.resolve();

    return new Promise(resolve => {
        const old = document.getElementById('storySaciDialogOverlay');
        if(old) old.remove();

        const ov = document.createElement('div');
        ov.id = 'storySaciDialogOverlay';
        ov.className = 'story-saci-dialog-overlay';
        ov.style.zIndex = '99998';

        let sprite = SPRITES_STORY[enemyId];
        if(!sprite || sprite.trim()===''){
            const bk = STORY_TO_BASE_BOSS[enemyId];
            if(bk && typeof SPRITES !== 'undefined' && SPRITES[bk]) sprite = SPRITES[bk];
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
            if(closed) return;
            closed = true;
            if(ov.parentNode) ov.parentNode.removeChild(ov);
            resolve();
        };

        document.getElementById('storySaciDialogContinue').addEventListener('click', close);
        ov.addEventListener('keydown', e => { if(e.key==='Enter'||e.key==='Escape') close(); });
    });
}

// =================================================================
// 💬 DIÁLOGO FINAL DO BOSS
// =================================================================
function showBossFinalDialog(bossType){
    const finalData = STORY_FINAL_DIALOGS[bossType];
    if(!finalData) return Promise.resolve();

    const cid = STORY_PROGRESS.currentChapter || 1;
    const themeClass = (cid >= 2 && cid <= 13) ? 'a' + cid : '';

    return new Promise(resolve => {
        const old = document.getElementById('storySaciFinalOverlay');
        if(old) old.remove();

        const ov = document.createElement('div');
        ov.id = 'storySaciFinalOverlay';
        ov.className = 'story-saci-dialog-overlay';
        ov.style.zIndex = '99998';

        let sprite = SPRITES_STORY[bossType];
        if(!sprite || sprite.trim()===''){
            const bk = STORY_TO_BASE_BOSS[bossType];
            if(bk && typeof SPRITES !== 'undefined' && SPRITES[bk]) sprite = SPRITES[bk];
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
            if(closed) return;
            closed = true;
            if(ov.parentNode) ov.parentNode.removeChild(ov);
            resolve();
        };

        document.getElementById('storySaciFinalContinue').addEventListener('click', close);
        ov.addEventListener('keydown', e => { if(e.key==='Enter'||e.key==='Escape') close(); });
    });
}

// =================================================================
// 🎯 APLICA SKILL DO INIMIGO (animais comuns — Ato 1 a Ato 12)
// =================================================================
async function applyStorySkill(enemy, skill){
    const board = document.getElementById('board');
    if(!board) return;
    addLog(`⚔️ ${enemy.name} usa ${skill.name}!`);

    const soundMap = {
        'Espinhos Erguidos':'garras','Bote':'atkg','Bocada':'minoa1',
        'Giro de Cauda':'garras','Investida':'minoa2','Chifrada':'garras',
        'Garra':'garras','Salto':'atkg',
        'Garras Longas':'garras','Bicada':'atkg','Pisada Pesada':'minoa2',
        'Atropelamento':'minoa2','Mordida em Linha':'minoa1',
        'Estouro de Manada':'garras','Constrição':'minoa1','Engolir':'atkg',
        'Cardume':'garras','Mordida Rápida':'atkg','Garras Aquáticas':'garras',
        'Nado Veloz':'atkg','Matilha Aquática':'garras','Bote do Rio':'atkg',
        'Bocarra':'minoa1','Caudada':'minoa2',
        'Chocalho Ameaçador':'garras','Bote Peçonhento':'atkg','Anéis Coloridos':'garras',
        'Peçonha':'minoa1','Bote Traiçoeiro':'atkg','Enrolar':'minoa1',
        'Casco Duro':'garras','Pancada Pesada':'minoa2',
        'Cornada':'garras','Marrada':'atkg','Trombada':'atkg','Pisada':'minoa2',
        'Coice':'atkg','Relincho Furioso':'garras','Cornada Violenta':'atkg','Pisoteada':'minoa2',
        'Voo Rasante':'atkg','Garras Afiadas':'garras','Voo Veloz':'atkg',
        'Cavar':'minoa2','Uivo':'garras','Bote Selvagem':'atkg',
        'Mordida':'atkg','Rosnado':'garras','Astúcia':'atkg','Bote Ágil':'atkg',
        'Garras Noturnas':'garras','Ataque Surpresa':'atkg','Garras Selvagens':'garras','Salto Mortal':'atkg',
        'Voo Sombrio':'atkg','Eco':'garras','Voo Silencioso':'atkg','Veneno':'minoa1',
        'Língua':'minoa1','Bicada Feroz':'atkg','Grito':'garras',
        'Bote Aquático':'atkg','Escamas Douradas':'garras','Nado Rápido':'atkg',
        'Corpulência':'minoa2','Pancada na Água':'minoa2',
        'Marrada Selvagem':'atkg','Fúria':'garras','Marrada Bruta':'atkg',
        'Pó Lunar':'minoa1','Bote Rápido':'atkg','Garra Fatal':'garras',
        'Garras':'garras','Mergulho Mortal':'atkg','Garras Cortantes':'garras',
        'Canto Sombrio':'garras','Garras Reais':'garras','Mergulho Solar':'atkg'
    };
    playSfx(soundMap[skill.name] || 'skill1');

    // ---- AREA_AROUND ----
    if(skill.type==='area_around'){
        const r = skill.area, tiles = [];
        for(let dx=-r;dx<=r;dx++) for(let dy=-r;dy<=r;dy++){
            const tx=boss.x+dx, ty=boss.y+dy;
            if(tx>=0&&tx<8&&ty>=0&&ty<8) tiles.push({x:tx,y:ty});
        }
        tiles.forEach((t,i) => setTimeout(() => {
            const skillName = skill.name.toLowerCase();
            if(skillName.includes('veneno') || skillName.includes('peçonha') || skillName.includes('pó')){
                triggerPoisonGas(t.x,t.y);
            } else if(skillName.includes('garra') || skillName.includes('mordida') || skillName.includes('uivo')){
                triggerClawSpin(t.x,t.y);
            } else {
                triggerFlare(t.x,t.y);
            }
        }, i*40));
        await sleep(500);
        players.forEach(p => {
            if(p.dead) return;
            const d = Math.max(Math.abs(p.x-boss.x), Math.abs(p.y-boss.y));
            if(d<=r) applyDmg(p, skill.dmg);
        });
        await sleep(400);
    }

    // ---- LINE_CARDINAL ----
    else if(skill.type==='line_cardinal'){
        const dirs = [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}];
        const dir = dirs[Math.floor(Math.random()*4)];
        const tiles = [];
        for(let s=1;s<=skill.range;s++){
            const tx=boss.x+dir.dx*s, ty=boss.y+dir.dy*s;
            if(tx<0||tx>=8||ty<0||ty>=8) break;
            tiles.push({x:tx,y:ty});
        }
        tiles.forEach((t,i) => setTimeout(() => {
            if(i===0) triggerBite(t.x,t.y);
            else triggerFlare(t.x,t.y);
        }, i*100));
        await sleep(500);
        tiles.forEach(t => players.forEach(p => {
            if(!p.dead && p.x===t.x && p.y===t.y) applyDmg(p, skill.dmg);
        }));
        await sleep(400);
    }

    // ---- DASH_LINE ----
    else if(skill.type==='dash_line'){
        const dirs = [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}];
        const dir = dirs[Math.floor(Math.random()*4)];
        for(let s=1;s<=skill.range;s++){
            const nx=boss.x+dir.dx*s, ny=boss.y+dir.dy*s;
            if(nx<0||nx>=8||ny<0||ny>=8) break;
            const hit = players.find(p => !p.dead && p.x===nx && p.y===ny);
            if(hit){
                if(typeof spawnArrowProjectile==='function') spawnArrowProjectile({x:boss.x,y:boss.y},{x:nx,y:ny});
                applyDmg(hit, skill.dmg);
                await sleep(300); break;
            }
            boss.x=nx; boss.y=ny; updateVisuals(); await sleep(120);
        }
        await sleep(300);
    }

    // ---- CHARGE ----
    else if(skill.type==='charge'){
        const dirs = [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}];
        const dir = dirs[Math.floor(Math.random()*4)];
        if(typeof triggerEarthquake==='function') triggerEarthquake();
        await sleep(200);
        let target = null;
        for(let s=1;s<8;s++){
            const nx=boss.x+dir.dx*s, ny=boss.y+dir.dy*s;
            if(nx<0||nx>=8||ny<0||ny>=8) break;
            const f = players.find(p => !p.dead && p.x===nx && p.y===ny);
            if(f){ target={x:nx-dir.dx,y:ny-dir.dy}; break; }
        }
        if(!target){
            let lx=boss.x, ly=boss.y;
            for(let s=1;s<8;s++){
                const nx=boss.x+dir.dx*s, ny=boss.y+dir.dy*s;
                if(nx<0||nx>=8||ny<0||ny>=8) break;
                lx=nx; ly=ny;
            }
            target={x:lx,y:ly};
        }
        const steps = Math.max(Math.abs(target.x-boss.x), Math.abs(target.y-boss.y));
        for(let i=0;i<steps;i++){
            boss.x+=dir.dx; boss.y+=dir.dy;
            triggerFlare(boss.x,boss.y); updateVisuals(); await sleep(100);
        }
        await sleep(300);
        const fx=boss.x+dir.dx, fy=boss.y+dir.dy;
        players.forEach(p => { if(!p.dead && p.x===fx && p.y===fy) applyDmg(p, skill.dmg); });
        await sleep(300);
    }

    // ---- JUMP ----
    else if(skill.type==='jump'){
        const ox=boss.x, oy=boss.y;
        const dirs = [{dx:0,dy:-1},{dx:0,dy:1},{dx:-1,dy:0},{dx:1,dy:0}];
        const dir = dirs[Math.floor(Math.random()*4)];
        const tx=ox+dir.dx*skill.distance, ty=oy+dir.dy*skill.distance;
        if(tx<0||tx>=8||ty<0||ty>=8) return;
        triggerClawSpin(ox,oy); await sleep(200);
        boss.x=tx; boss.y=ty; updateVisuals();
        triggerClawSpin(tx,ty); triggerFlare(tx,ty);
        const r = skill.area;
        for(let dx=-r;dx<=r;dx++) for(let dy=-r;dy<=r;dy++){
            const nx=tx+dx, ny=ty+dy;
            if(nx>=0&&nx<8&&ny>=0&&ny<8&&(dx!==0||dy!==0)) setTimeout(()=>triggerFlare(nx,ny),100);
        }
        await sleep(500);
        players.forEach(p => {
            if(p.dead) return;
            const d = Math.max(Math.abs(p.x-tx), Math.abs(p.y-ty));
            if(d<=r) applyDmg(p, skill.dmg);
        });
        await sleep(400);
        boss.x=ox; boss.y=oy; updateVisuals();
        triggerFlare(ox,oy); await sleep(300);
    }
}

// =================================================================
// 👺 SKILLS LITERAIS DOS BOSSES (copiadas do entidades.js — bossAI)
// =================================================================

// ---- SACI ----
async function executeSaciOriginalAI(){
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    if(Math.random() < 0.5) { 
        playSfx('saci1'); 
        addLog(`💨 Saci cria vórtices de vento!`);
        grid.forEach((element, idx) => { 
            if(element === 'AR') { 
                triggerVortex(idx % 8, Math.floor(idx / 8), 0, true); 
                players.forEach(p => { 
                    if(!p.dead && p.x === idx % 8 && p.y === Math.floor(idx / 8)) applyDmg(p, bossAtk); 
                }); 
            } 
        }); 
    } else { 
        playSfx('saci'); 
        addLog(`💨 Saci lança vórtices diagonais!`);
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
                        if(!p.dead && p.x === nx && p.y === ny) setTimeout(() => applyDmg(p, bossAtk), step * 100); 
                    }); 
                } 
            } 
        }); 
    }
    await sleep(700);
}

// ---- MAPINGUARI ----
async function executeMapinguariOriginalAI(){
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    if(Math.random() < 0.5) { 
        playSfx('minoa1'); 
        addLog(`🦥 Mapinguari dá uma mordida poderosa!`);
        triggerBite(boss.x, boss.y); 
        await sleep(600);
        players.forEach(p => { 
            if(!p.dead && Math.abs(p.x - boss.x) <= 2 && Math.abs(p.y - boss.y) <= 2) applyDmg(p, bossAtk); 
        }); 
    } else { 
        playSfx('minoa2'); 
        addLog(`🦥 Mapinguari lança pedras!`);
        triggerRocks(boss.x, boss.y); 
        await sleep(600);
        const rows = [boss.y - 1, boss.y, boss.y + 1]; 
        players.forEach(p => { if(!p.dead && rows.includes(p.y)) applyDmg(p, 2); }); 
    }
}

// ---- IARA ----
async function executeIaraOriginalAI(){
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    if(Math.random() < 0.5) { 
        playSfx('iara1'); 
        addLog(`🌊 Iara invoca um tsunami!`);
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
                if (!isOccupied(nx, ny, p.id)) { p.x = nx; p.y = ny; } 
            } 
        }); 
        updateVisuals(); 
    } else { 
        playSfx('iara2'); 
        addLog(`💧 Iara lança jatos d'água!`);
        triggerWaterJet(boss.x, boss.y); 
        await sleep(600);
        players.forEach(p => { 
            if(!p.dead && (p.x === boss.x || p.y === boss.y)) applyDmg(p, bossAtk); 
        }); 
    }
}

// ---- BOITATÁ ----
async function executeBoitataOriginalAI(){
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    if(Math.random() < 0.6) { 
        playSfx('skill1'); 
        addLog(`🔥 Boitatá lança colunas de fogo!`);
        const columns = [boss.x-1, boss.x, boss.x+1]; 
        columns.forEach(col => { if(col >= 0 && col <= 7) triggerFireColumn(col); }); 
        await sleep(600);
        players.forEach(p => { if(!p.dead && columns.includes(p.x)) applyDmg(p, bossAtk); }); 
    } else { 
        playSfx('skill1'); 
        addLog(`🔥 Boitatá invoca explosões de fogo!`);
        let count = 0, attempts = 0; 
        while(count < 5 && attempts < 50) { 
            let idx = Math.floor(Math.random() * 64); 
            if(grid[idx] === 'FOGO') { 
                triggerFlare(idx % 8, Math.floor(idx / 8)); 
                players.forEach(p => { 
                    if(!p.dead && p.x === idx % 8 && p.y === Math.floor(idx / 8)) applyDmg(p, bossAtk); 
                }); 
                count++; 
            } 
            attempts++; 
        } 
    }
    await sleep(500);
}

// ---- MULA SEM CABEÇA ----
async function executeMulaOriginalAI(){
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    if(Math.random() < 0.6) { 
        playSfx('skill1'); 
        addLog(`🐴 Mula sem Cabeça relincha fogo em 3 colunas!`);
        const columns = [boss.x-1, boss.x, boss.x+1].filter(col => col >= 0 && col <= 7); 
        columns.forEach(col => triggerFireColumn(col)); 
        await sleep(600);
        players.forEach(p => { if(!p.dead && columns.includes(p.x)) applyDmg(p, bossAtk); }); 
    } else { 
        playSfx('skill1'); 
        addLog(`🐴 Mula sem Cabeça lança bolas de fogo!`);
        const directions = [
            {dx: 2, dy: 0}, {dx: -2, dy: 0},
            {dx: 0, dy: 2}, {dx: 0, dy: -2}
        ];
        directions.forEach(dir => { 
            let targetX = boss.x + dir.dx;
            let targetY = boss.y + dir.dy;
            if(targetX >= 0 && targetX < 8 && targetY >= 0 && targetY < 8) {
                triggerFireball(boss.x, boss.y, targetX, targetY);
                players.forEach(p => { 
                    if(!p.dead && p.x === targetX && p.y === targetY) setTimeout(() => applyDmg(p, bossAtk), 400); 
                });
            }
        });
        await sleep(700);
    }
}

// ---- CORPO SECO ----
async function executeCorpoSecoOriginalAI(){
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    if(Math.random() < 0.5) { 
        playSfx('garras'); 
        addLog(`💀 Corpo Seco sopra vapor podre!`);
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
                    if(!p.dead && p.x === tileX && p.y === tileY) applyDmg(p, bossAtk); 
                });
            }
        });
        await sleep(600);
    } else { 
        playSfx('garras'); 
        addLog(`💀 Corpo Seco ataca com garras!`);
        const attackDirections = ['left', 'right', 'up', 'down'];
        const direction = attackDirections[Math.floor(Math.random() * 4)];
        let targetTiles = [];
        switch(direction) {
            case 'left':
                for(let dx = -2; dx <= 0; dx++) for(let dy = -2; dy <= 2; dy++) targetTiles.push({x: boss.x + dx, y: boss.y + dy});
                break;
            case 'right':
                for(let dx = 0; dx <= 2; dx++) for(let dy = -2; dy <= 2; dy++) targetTiles.push({x: boss.x + dx, y: boss.y + dy});
                break;
            case 'up':
                for(let dx = -2; dx <= 2; dx++) for(let dy = -2; dy <= 0; dy++) targetTiles.push({x: boss.x + dx, y: boss.y + dy});
                break;
            case 'down':
                for(let dx = -2; dx <= 2; dx++) for(let dy = 0; dy <= 2; dy++) targetTiles.push({x: boss.x + dx, y: boss.y + dy});
                break;
        }
        targetTiles.forEach(tile => {
            if(tile.x >= 0 && tile.x < 8 && tile.y >= 0 && tile.y < 8) {
                triggerClawSpin(tile.x, tile.y);
                players.forEach(p => { 
                    if(!p.dead && p.x === tile.x && p.y === tile.y) applyDmg(p, bossAtk + 1); 
                });
            }
        });
        await sleep(600);
    }
}

// ---- LOBISOMEM ----
async function executeLobisomemOriginalAI(){
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    if(Math.random() < 0.5) { 
        playSfx('garras'); 
        addLog(`🐺 Lobisomem ataca com garras!`);
        triggerClawSpin(boss.x, boss.y);
        setTimeout(() => {
            players.forEach(p => { 
                if(!p.dead && Math.abs(p.x - boss.x) <= 1 && Math.abs(p.y - boss.y) <= 1) applyDmg(p, bossAtk); 
            });
        }, 300);
        await sleep(600);
    } else { 
        playSfx('minoa2'); 
        addLog(`🐺 Lobisomem treme a terra!`);
        triggerEarthquake();
        await sleep(400);
        for(let dx = -2; dx <= 2; dx++) {
            for(let dy = -2; dy <= 2; dy++) {
                if(dx === 0 && dy === 0) continue;
                const tileX = boss.x + dx;
                const tileY = boss.y + dy;
                if(tileX >= 0 && tileX < 8 && tileY >= 0 && tileY < 8) {
                    triggerFlare(tileX, tileY);
                    players.forEach(p => { 
                        if(!p.dead && p.x === tileX && p.y === tileY) applyDmg(p, 2); 
                    });
                }
            }
        }
        players.forEach(p => { 
            if(!p.dead) {
                let newX = p.x, newY = p.y;
                if(p.x < boss.x && !isOccupied(p.x + 1, p.y, p.id)) newX = p.x + 1;
                else if(p.x > boss.x && !isOccupied(p.x - 1, p.y, p.id)) newX = p.x - 1;
                if(p.y < boss.y && !isOccupied(newX, p.y + 1, p.id)) newY = p.y + 1;
                else if(p.y > boss.y && !isOccupied(newX, p.y - 1, p.id)) newY = p.y - 1;
                p.x = newX;
                p.y = newY;
            }
        });
        updateVisuals();
        addLog(`🐺 Heróis foram puxados para perto!`);
        await sleep(400);
    }
}

// ---- CUCA ----
async function executeCucaOriginalAI(){
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    if(Math.random() < 0.5) { 
        playSfx('cucask1'); 
        addLog(`🧙 Cuca lança poção em um quadrante!`);
        const quadrantX = Math.random() < 0.5 ? 0 : 4;
        const quadrantY = Math.random() < 0.5 ? 0 : 4;
        for(let x = quadrantX; x < quadrantX + 4; x++) {
            for(let y = quadrantY; y < quadrantY + 4; y++) {
                triggerPoisonGas(x, y);
            }
        }
        setTimeout(() => {
            for(let x = quadrantX; x < quadrantX + 4; x++) {
                for(let y = quadrantY; y < quadrantY + 4; y++) {
                    if(x >= 0 && x < 8 && y >= 0 && y < 8) {
                        players.forEach(p => { 
                            if(!p.dead && p.x === x && p.y === y) applyDmg(p, bossAtk); 
                        });
                    }
                }
            }
        }, 300);
        await sleep(600);
    } else { 
        playSfx('cucask2'); 
        addLog(`🧙 Cuca bebe uma poção curativa!`);
        triggerPotion(boss.x, boss.y);
        await sleep(400);
        boss.hp = Math.min(boss.maxHp, boss.hp + 2);
        showHealEffect(boss.x, boss.y, 2);
        updateVisuals();
        addLog(`💊 Cuca recuperou 2 HP!`);
        await sleep(400);
    }
}

// ---- BOTO ROSA ----
async function executeBotoOriginalAI(){
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    if(Math.random() < 0.6) { 
        playSfx('boto_skill1'); 
        addLog(`🐬 Boto Rosa quebra corações na área!`);
        for(let dx = -1; dx <= 1; dx++) {
            for(let dy = -1; dy <= 1; dy++) {
                if(dx === 0 && dy === 0) continue;
                const tileX = boss.x + dx;
                const tileY = boss.y + dy;
                if(tileX >= 0 && tileX < 8 && tileY >= 0 && tileY < 8) {
                    triggerBrokenHeart(tileX, tileY);
                    players.forEach(p => { 
                        if(!p.dead && p.x === tileX && p.y === tileY) applyDmg(p, bossAtk); 
                    });
                }
            }
        }
        await sleep(600);
    } else { 
        playSfx('boto_skill2'); 
        addLog(`🐬 Boto Rosa lança jatos d'água em cruz!`);
        for(let y = 0; y < 8; y++) triggerWaterJet(boss.x, y);
        for(let x = 0; x < 8; x++) triggerWaterJet(x, boss.y);
        await sleep(600);
        players.forEach(p => { 
            if(!p.dead && (p.x === boss.x || p.y === boss.y)) applyDmg(p, bossAtk); 
        });
    }
}

// ---- BOI DA CARA PRETA ----
async function executeBoiOriginalAI(){
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    if(Math.random() < 0.5) { 
        playSfx('boi_skill1'); 
        addLog(`🐂 Boi da Cara Preta mostra sua face assustadora!`);
        for(let dx = -1; dx <= 1; dx++) {
            for(let dy = -1; dy <= 1; dy++) {
                if(dx === 0 && dy === 0) continue;
                const tileX = boss.x + dx;
                const tileY = boss.y + dy;
                if(tileX >= 0 && tileX < 8 && tileY >= 0 && tileY < 8) {
                    triggerScaryFace(tileX, tileY);
                    players.forEach(p => { 
                        if(!p.dead && p.x === tileX && p.y === tileY) applyDmg(p, bossAtk); 
                    });
                }
            }
        }
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
        affectedIndices.forEach(idx => {
            const newColor = COLORS[Math.floor(Math.random() * 4)];
            grid[idx] = newColor;
            const tile = document.querySelectorAll('#grid .tile')[idx];
            if (tile) tile.className = `tile bg-${newColor}`;
        });
        addLog(`🌪️ Tiles ao redor foram embaralhados!`);
        await sleep(600);
    } else { 
        playSfx('boi_skill2'); 
        addLog(`🐂 Boi da Cara Preta empurra os heróis para as bordas!`);
        players.forEach(p => { 
            if(!p.dead) {
                let nx = p.x, ny = p.y;
                if(p.x < 4) nx = Math.max(0, p.x - 1);
                else nx = Math.min(7, p.x + 1);
                if(p.y < 4) ny = Math.max(0, p.y - 1);
                else ny = Math.min(7, p.y + 1);
                let finalX = p.x, finalY = p.y;
                let stepX = p.x < nx ? 1 : -1;
                for(let x = p.x; x !== nx; x += stepX) {
                    if(!isOccupied(x + stepX, p.y, p.id)) finalX = x + stepX;
                    else break;
                }
                let stepY = p.y < ny ? 1 : -1;
                for(let y = p.y; y !== ny; y += stepY) {
                    if(!isOccupied(finalX, y + stepY, p.id)) finalY = y + stepY;
                    else break;
                }
                p.x = finalX;
                p.y = finalY;
            } 
        });
        updateVisuals();
        addLog(`🌪️ Heróis foram empurrados para as bordas!`);
        await sleep(400);
        players.forEach(p => { if(!p.dead) applyDmg(p, 1); });
    }
}

// ---- JACI ----
async function executeJaciOriginalAI(){
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    if(Math.random() < 0.6) { 
        playSfx('jaci_skill1'); 
        addLog(`🌙 Jaci invoca a lua e ataca todos os tiles de AR!`);
        triggerMoon(boss.x, boss.y);
        await sleep(400);
        let arTilesAttacked = 0;
        grid.forEach((element, idx) => { 
            if(element === 'AR') { 
                const x = idx % 8;
                const y = Math.floor(idx / 8);
                triggerMoonRay(x, y);
                arTilesAttacked++;
                players.forEach(p => { 
                    if(!p.dead && p.x === x && p.y === y) setTimeout(() => applyDmg(p, bossAtk), 200); 
                });
            } 
        });
        addLog(`🌪️ ${arTilesAttacked} tiles de AR foram atingidos!`);
        await sleep(600);
    } else { 
        playSfx('jaci_skill2'); 
        addLog(`🌙 Jaci invoca uma tempestade em todo o tabuleiro!`);
        triggerStorm();
        await sleep(500);
        players.forEach(p => { if(!p.dead) applyDmg(p, 1); });
        boss.hp = Math.min(boss.maxHp, boss.hp + 1);
        showHealEffect(boss.x, boss.y, 1);
        updateVisuals();
        addLog(`💊 Jaci recuperou 1 HP!`);
        await sleep(400);
    }
}

// ---- GUARACI ----
async function executeGuaraciOriginalAI(){
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    if(Math.random() < 0.6) { 
        playSfx('guaraci_skill1'); 
        addLog(`☀️ Guaraci invoca o sol e ataca todos os tiles de FOGO!`);
        triggerSun(boss.x, boss.y);
        await sleep(400);
        let fireTilesAttacked = 0;
        grid.forEach((element, idx) => { 
            if(element === 'FOGO') { 
                const x = idx % 8;
                const y = Math.floor(idx / 8);
                triggerSunRay(x, y);
                fireTilesAttacked++;
                players.forEach(p => { 
                    if(!p.dead && p.x === x && p.y === y) setTimeout(() => applyDmg(p, bossAtk), 200); 
                });
            } 
        });
        addLog(`🔥 ${fireTilesAttacked} tiles de FOGO foram atingidos!`);
        await sleep(600);
    } else { 
        playSfx('guaraci_skill2'); 
        addLog(`☀️ Guaraci invoca uma onda de calor!`);
        triggerHeatWave();
        await sleep(500);
        players.forEach(p => { if(!p.dead) applyDmg(p, 1); });
        boss.hp = Math.min(boss.maxHp, boss.hp + 1);
        showHealEffect(boss.x, boss.y, 1);
        updateVisuals();
        addLog(`💊 Guaraci recuperou 1 HP!`);
        await sleep(400);
    }
}

// ---- ANHANGÁ ----
async function executeAnhangaOriginalAI(){
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 6;
    if(Math.random() < 0.6) { 
        playSfx('anhanga_skill1'); 
        addLog(`👹 ANHANGÁ: 'Sintam meu fogo intercalado!'`);
        const columnsToAttack = [];
        for (let col = boss.x; col < 8; col += 2) columnsToAttack.push(col);
        for (let col = boss.x; col >= 0; col -= 2) columnsToAttack.push(col);
        const uniqueColumns = [...new Set(columnsToAttack)];
        uniqueColumns.forEach(col => {
            if(col >= 0 && col <= 7) triggerFireColumn(col);
        });
        await sleep(600);
        players.forEach(p => { 
            if(!p.dead && uniqueColumns.includes(p.x)) applyDmg(p, bossAtk); 
        });
    } else { 
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
    }
}

// =================================================================
// 🎯 MAPA: qual IA usar por enemyId
// =================================================================
const BOSS_AI_MAP = {
    saci: executeSaciOriginalAI,
    mapinguari: executeMapinguariOriginalAI,
    iara: executeIaraOriginalAI,
    boitata: executeBoitataOriginalAI,
    mula: executeMulaOriginalAI,
    corpo_seco: executeCorpoSecoOriginalAI,
    lobisomem: executeLobisomemOriginalAI,
    cuca: executeCucaOriginalAI,
    boto: executeBotoOriginalAI,
    boi: executeBoiOriginalAI,
    jaci: executeJaciOriginalAI,
    guaraci: executeGuaraciOriginalAI,
    anhanga: executeAnhangaOriginalAI
};

// =================================================================
// 🎯 ESCOLHE A IA DO BOSS/INIMIGO
// =================================================================
async function executeBossAI(enemy){
    // Espectros: usa IA do boss original
    if(enemy.isSpectral){
        const baseId = enemy.id.replace('espectro_', '');
        const aiFn = BOSS_AI_MAP[baseId];
        if(aiFn){
            await aiFn();
            return;
        }
    }
    // Bosses: usa IA própria
    const aiFn = BOSS_AI_MAP[enemy.id];
    if(aiFn){
        await aiFn();
        return;
    }
    // Animais comuns: skill1/skill2 aleatória
    const sk = Math.random()<0.5 ? enemy.skill1 : enemy.skill2;
    if(sk) await applyStorySkill(enemy, sk);
}

// =================================================================
// 🎯 IA DO INIMIGO (espelha bossAI)
// =================================================================
async function storyEnemyAI(){
    if(bossAIIsRunning || arcadeBossTransition) return;
    if(!window._storyMode) return;
    if(window._endGameShowing) return;

    bossAIIsRunning = true;

    const alive = players.filter(p => !p.dead);
    if(alive.length===0){ bossAIIsRunning=false; return; }

    document.getElementById('turnBoss').classList.add('active-turn');

    const enemyId = storyEnemiesRemaining[0] || String(boss.type).toLowerCase();
    const enemy = STORY_ENEMIES[enemyId];
    if(!enemy){
        console.error('[storyEnemyAI] Inimigo desconhecido:', enemyId);
        bossAIIsRunning = false; return;
    }

    addLog(`👹 ${enemy.name} ataca!`);

    // Espectros: movimento mais curto (2 passos em vez de 4)
    const moveSteps = enemy.isSpectral ? 2 : 4;
    for(let i=0;i<moveSteps;i++){
        if(boss.dead) break;
        const moves = [
            {x:boss.x+1,y:boss.y},{x:boss.x-1,y:boss.y},
            {x:boss.x,y:boss.y+1},{x:boss.x,y:boss.y-1}
        ].filter(m => m.x>=0&&m.x<8&&m.y>=0&&m.y<8&&!isOccupied(m.x,m.y,-1));
        if(moves.length>0){
            const mv = moves[Math.floor(Math.random()*moves.length)];
            boss.x=mv.x; boss.y=mv.y; updateVisuals(); await sleep(200);
        }
    }
    updateAllSpriteDirections();

    if(!boss.dead){
        await executeBossAI(enemy);
    }

    await sleep(600);
    document.getElementById('turnBoss').classList.remove('active-turn');
    bossAIIsRunning = false;

    if(boss.dead) return;
    if(players.filter(p=>!p.dead).length===0){
        if(!window._endGameShowing) handleStoryDefeat();
        return;
    }
    if(arcadeBossTransition) return;

    currentPlayerIdx = 0;
    while(currentPlayerIdx<players.length && players[currentPlayerIdx] && players[currentPlayerIdx].dead) currentPlayerIdx++;
    if(currentPlayerIdx<players.length && players[currentPlayerIdx]){
        switchConfig(currentPlayerIdx);
        addLog(`🎮 Turno dos jogadores! Começa com ${players[currentPlayerIdx].name}`);
        document.getElementById('turnP_Active').classList.add('active-turn');
    }

    updateAllSpriteDirections();
    updateHeroCard();
    updateBossCard();
}
// =================================================================
// historia.js — V5.1 — Bloco 5/6
// Morte + purificação + overrides + iniciar fase + resultado
// Correções: B1, B2, B6, B7
// =================================================================

// =================================================================
// 📖 ESTADO RUNTIME
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
    console.log('[historia] handleStoryBossDefeat chamada');
    if(!window._storyMode) return;
    if(window._storyPurificationShowing) {
        console.log('[historia] purificação já mostrando, ignorando');
        return;
    }
    window._storyPurificationShowing = true;

    const enemyId = storyEnemiesRemaining[0];
    console.log('[historia] enemyId:', enemyId);
    if(!enemyId){ window._storyPurificationShowing=false; return; }

    const drops = rollStoryDrops(enemyId);
    let dropTxt = '';
    drops.forEach(d => {
        addMaterial(d.id, d.qty);
        const m = STORY_MATERIALS[d.id];
        if(m) dropTxt += ` ${m.emoji} ${m.name}×${d.qty}`;
        storyPendingDrops.push({id:d.id, qty:d.qty});
    });
    saveStoryProgress();

    addLog(`💀 ${getStoryEnemyName(enemyId)} foi derrotado!`);
    addLog(dropTxt ? `${uiIcon('gift')} Drops:${dropTxt}` : `${uiIcon('gift')} Nenhum drop.`);

    STORY_PROGRESS.enemiesDefeated++;
    saveStoryProgress();

    // ---- Efeito visual + sonoro de purificação ----
    if(typeof showPurificacao === 'function'){
        try {
            console.log('[historia] chamando showPurificacao para:', boss.type, boss.x, boss.y);
            await showPurificacao(boss.type, boss.x, boss.y, false);
            console.log('[historia] showPurificacao terminou');
        } catch(e) {
            console.warn('[historia] showPurificacao falhou:', e);
        }
    } else {
        console.warn('[historia] showPurificacao não disponível');
    }

    // ---- Overlay de texto de purificação ----
    console.log('[historia] mostrando mensagem de purificação para:', enemyId);
    await showPurificationMessage(enemyId);
    console.log('[historia] purificação fechada, avançando...');

    // ---- Se for boss (qualquer um): diálogo final ----
    const isBoss = STORY_FINAL_DIALOGS[enemyId] !== undefined;
    if(isBoss){
        console.log('[historia] mostrando diálogo final do boss:', enemyId);
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
    if(!msg){
        console.log('[historia] sem mensagem de purificação para:', enemyId);
        return Promise.resolve();
    }

    return new Promise(resolve => {
        const old = document.getElementById('storyPurificationOverlay');
        if(old) old.remove();

        const ov = document.createElement('div');
        ov.id = 'storyPurificationOverlay';
        ov.className = 'story-purification-overlay';
        ov.style.zIndex = '99999';

        const enemy = STORY_ENEMIES[enemyId];
        const name = enemy ? enemy.name : enemyId;
        let sprite = SPRITES_STORY[enemyId];
        if(!sprite || sprite.trim()===''){
            const bk = STORY_TO_BASE_BOSS[enemyId];
            if(bk && typeof SPRITES !== 'undefined' && SPRITES[bk]) sprite = SPRITES[bk];
        }
        const spriteHTML = (sprite && sprite.trim()!=='')
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
            if(closed) return;
            closed = true;
            if(ov.parentNode) ov.parentNode.removeChild(ov);
            resolve();
        };
        document.getElementById('storyPurifContinue').addEventListener('click', close);
        setTimeout(close, 8000);
    });
}

// =================================================================
// 🎯 AVANÇA PARA O PRÓXIMO INIMIGO
// Correções B1 (playBossTheme) + B6 (re-render)
// =================================================================
async function advanceStoryEnemy(){
    if(!storyBattleActive) return;

    window._storyPurificationShowing = false;
    storyEnemiesRemaining.shift();
    storyCurrentEnemyIndex++;

    arcadeBossTransition = true;
    bossAIIsRunning = false;
    isExecutingAction = false;
    window._endGameShowing = false;

    if(storyEnemiesRemaining.length > 0){
        const nextId = storyEnemiesRemaining[0];
        const nextE = STORY_ENEMIES[nextId];
        if(!nextE){ arcadeBossTransition=false; finishStoryPhase(true); return; }

        await sleep(500);

        const baseType = STORY_TO_BASE_BOSS[nextId] || nextId.toUpperCase();
        boss.type = baseType;
        boss.hp = nextE.hp;
        boss.maxHp = nextE.hp;
        boss.dead = false;
        boss.x = 4; boss.y = 0;

        const oldTok = document.getElementById('tokenBoss');
        if(oldTok) oldTok.remove();
        const oldEmo = document.getElementById('storyBossEmoji');
        if(oldEmo) oldEmo.remove();

        const board = document.getElementById('board');
        if(board){
            const tok = document.createElement('div');
            tok.id = 'tokenBoss';
            tok.className = 'token';
            let sprite = SPRITES_STORY[nextId];
            if(!sprite || sprite.trim()===''){
                const bk = STORY_TO_BASE_BOSS[nextId];
                if(bk && typeof SPRITES !== 'undefined' && SPRITES[bk]) sprite = SPRITES[bk];
            }
            const has = sprite && sprite.trim()!=='';
            const imgClass = nextE.isSpectral ? 'normal spectral-boss' : 'normal';
            const spriteHTML = has
                ? `<img id="imgBoss" src="${sprite}" class="${imgClass}">`
                : `<span id="storyBossEmoji" class="story-boss-emoji" style="${nextE.isSpectral?'opacity:.65;filter:hue-rotate(220deg) saturate(.7) brightness(1.15);':''}">${EMOJI_STORY[nextId]||'?'}</span>`;
            tok.innerHTML = `<div class="hp-container"><div id="hpBarBoss" class="hp-bar"></div></div>${spriteHTML}`;
            board.appendChild(tok);
        }

        applyStoryEnemyToBoss(nextId);

        const hb = document.getElementById('headerBossName');
        if(hb){
            const tot = storyCurrentEnemyIndex + storyEnemiesRemaining.length;
            hb.textContent = `${nextE.name} (${storyCurrentEnemyIndex+1}/${tot})`;
        }

        updateVisuals();
        updateAllSpriteDirections();
        updateBossCard();
        updateHeroCard();
        addLog(`⚔️ ${nextE.name} entra em cena!`);

        // ⚡ B1 — Toca o tema do próximo inimigo
        if(typeof playBossTheme === 'function'){
            try { playBossTheme(); } catch(e){ console.warn('[historia] playBossTheme falhou:', e); }
        }

        // ---- Diálogo do boss apresentando o novo inimigo ----
        await sleep(400);
        console.log('[historia] mostrando diálogo do boss para:', nextId);
        await showBossIntroDialog(nextId);
        console.log('[historia] diálogo do boss fechado');

        await sleep(300);

        arcadeBossTransition = false;

        currentPlayerIdx = 0;
        while(currentPlayerIdx<players.length && players[currentPlayerIdx] && players[currentPlayerIdx].dead) currentPlayerIdx++;
        if(currentPlayerIdx<players.length && players[currentPlayerIdx]){
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
// 🎨 APLICA O INIMIGO NO BOSS
// =================================================================
function applyStoryEnemyToBoss(enemyId){
    const enemy = STORY_ENEMIES[enemyId]; if(!enemy) return;
    let sprite = SPRITES_STORY[enemyId];
    if(!sprite || sprite.trim()===''){
        const bk = STORY_TO_BASE_BOSS[enemyId];
        if(bk && typeof SPRITES !== 'undefined' && SPRITES[bk]) sprite = SPRITES[bk];
    }
    const has = sprite && sprite.trim()!=='';
    const bimg = document.getElementById('imgBoss');
    if(bimg){
        if(has){
            bimg.src = sprite;
            bimg.style.display = '';
            if(enemy.isSpectral){
                bimg.classList.add('spectral-boss');
            } else {
                bimg.classList.remove('spectral-boss');
            }
        } else {
            bimg.style.display='none';
        }
    }
    const bcs = document.getElementById('bossCardSprite');
    if(bcs){
        if(has){
            bcs.src = sprite;
            bcs.style.display = '';
            if(enemy.isSpectral){
                bcs.classList.add('spectral-boss');
            } else {
                bcs.classList.remove('spectral-boss');
            }
        } else {
            bcs.style.display='none';
        }
    }
    const bcn = document.getElementById('bossCardName');
    if(bcn) bcn.textContent = enemy.name;
    const bch = document.getElementById('bossCardHp');
    if(bch) bch.innerHTML = `HP: <b>${boss.hp}</b> / ${boss.maxHp}`;
    const bsw = document.getElementById('bossSectionWrapper');
    if(bsw){
        if(enemy.isBoss || enemy.isMiniBoss || enemy.isSpectral) bsw.classList.add('story-mini-boss');
        else bsw.classList.remove('story-mini-boss');
    }
}

// =================================================================
// 💀 DERROTA NA FASE
// =================================================================
function handleStoryDefeat(){
    if(!storyBattleActive) return;
    if(window._endGameShowing) return;
    window._endGameShowing = true;
    arcadeBossTransition = true;
    bossAIIsRunning = false;
    isExecutingAction = false;
    setTimeout(() => { arcadeBossTransition=false; finishStoryPhase(false); }, 800);
}

// =================================================================
// 🏁 FIM DA FASE
// =================================================================
function finishStoryPhase(victory){
    if(!storyBattleActive) return;

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
    if(gs){ gs.classList.remove('active'); gs.style.display='none'; }

    window._endGameShowing = false;
    arcadeBossTransition = false;
    bossAIIsRunning = false;
    isExecutingAction = false;

    if(typeof stopAllAudio === 'function') stopAllAudio();

    if(victory) handleStoryPhaseVictory(phase, drops);
    else handleStoryPhaseDefeat(phase, drops);
}

// =================================================================
// ✅ VITÓRIA DA FASE
// Correções B6 (re-render)
// =================================================================
function handleStoryPhaseVictory(phase, drops){
    const cid = STORY_PROGRESS.currentChapter || 1;
    const nextId = getNextPhaseId(phase.id, cid);
    players.forEach(p => { if(!p.dead) p.hp = p.maxHp; });
    completePhase(cid, phase.id, nextId);

    // ⚡ B6 — Garante que o desbloqueio do próximo capítulo seja aplicado
    if(phase.isBoss){
        const nextCid = cid + 1;
        if(STORY_CHAPTERS[nextCid]){
            if(!STORY_PROGRESS.unlockedChapters.includes(nextCid)){
                STORY_PROGRESS.unlockedChapters.push(nextCid);
                console.log(`[historia] Capítulo ${nextCid} desbloqueado!`);
            }
            if(!STORY_PROGRESS.unlockedPhases[nextCid]) STORY_PROGRESS.unlockedPhases[nextCid] = [];
            const firstPhase = STORY_CHAPTERS[nextCid].phases[0];
            if(firstPhase && !STORY_PROGRESS.unlockedPhases[nextCid].includes(firstPhase.id)){
                STORY_PROGRESS.unlockedPhases[nextCid].push(firstPhase.id);
                console.log(`[historia] Fase ${firstPhase.id} desbloqueada!`);
            }
            saveStoryProgress();
        }
    }

    const xp = (phase.reward && phase.reward.xp) || 0;
    const gr = (phase.reward && phase.reward.gold) || 0;
    const isReplay = STORY_PROGRESS.phasesEverCompleted.filter(id=>id===phase.id).length > 1;
    const finalGold = isReplay ? Math.floor(gr*0.5) : gr;

    STORY_PROGRESS.totalXP += xp;
    addGold(finalGold);

    if(phase.isBoss && phase.enemies.length>0){
        const last = phase.enemies[phase.enemies.length-1];
        if(!STORY_PROGRESS.bossesDefeated.includes(last)) STORY_PROGRESS.bossesDefeated.push(last);
    }
    saveStoryProgress();

    // ⚡ B6 — Força re-render da tela atual antes de mostrar o resultado
    // (garante que quando o jogador fechar o overlay, a tela esteja atualizada)
    setTimeout(() => {
        // Se o jogador já estiver de volta na Aldeia, re-renderiza
        const storyScreen = document.getElementById('storyScreen');
        if(storyScreen && storyScreen.classList.contains('active')){
            if(currentScreen === 'story'){
                renderAldeiaScreen();
            } else if(currentScreen === 'atos'){
                renderAtosScreen();
            }
        }
    }, 100);

    showStoryVictoryScreen(phase, drops, {xp, gold: finalGold});
}

// =================================================================
// 💀 DERROTA DA FASE
// =================================================================
function handleStoryPhaseDefeat(phase, drops){
    players.forEach(p => { if(p.dead) p.dead=false; p.hp = p.maxHp; });
    saveStoryProgress();
    showStoryDefeatScreen(phase, drops);
}

// =================================================================
// 🗺️ PRÓXIMA FASE / DESBLOQUEIO DE CAPÍTULO
// =================================================================
function getNextPhaseId(pid, cid){
    const ch = STORY_CHAPTERS[cid]; if(!ch) return null;
    const idx = ch.phases.findIndex(p => p.id===pid);
    if(idx===-1 || idx>=ch.phases.length-1){
        // Fim de capítulo: desbloqueia o próximo
        const nextCid = cid + 1;
        if(STORY_CHAPTERS[nextCid]){
            if(!STORY_PROGRESS.unlockedChapters.includes(nextCid)){
                STORY_PROGRESS.unlockedChapters.push(nextCid);
            }
            const firstPhase = STORY_CHAPTERS[nextCid].phases[0];
            if(firstPhase) unlockPhase(nextCid, firstPhase.id);
            saveStoryProgress();
            console.log(`[historia] Capítulo ${nextCid} desbloqueado!`);
        }
        return null;
    }
    return ch.phases[idx+1].id;
}

// =================================================================
// 🎯 OVERRIDES (só ativas em _storyMode)
// =================================================================
let _origApplyDmg = null;
let _origManageTurns = null;
let _origHandleBossDefeat = null;
let _origBossAI = null;
let _origSaveAndRefresh = null;
let _overridesInstalled = false;

function installStoryOverrides(){
    if(_overridesInstalled) return;

    if(typeof window.applyDmg === 'function') _origApplyDmg = window.applyDmg;
    if(typeof window.manageTurns === 'function') _origManageTurns = window.manageTurns;
    if(typeof window.handleBossDefeat === 'function') _origHandleBossDefeat = window.handleBossDefeat;
    if(typeof window.bossAI === 'function') _origBossAI = window.bossAI;
    if(typeof window.saveAndRefresh === 'function') _origSaveAndRefresh = window.saveAndRefresh;

    // ---- applyDmg história ----
    window.applyDmg = function(t, amt){
        if(!window._storyMode || !_origApplyDmg){
            return _origApplyDmg.apply(this, arguments);
        }
        if(t.dead) return;
        t.hp -= amt;
        showDmgEffect(t.x, t.y, amt);

        if(t.hp <= 0){
            t.hp = 0; t.dead = true;
            if(t === boss){
                handleStoryBossDefeat();
                updateVisuals();
                updateHeroCard();
                updateBossCard();
                return;
            } else if(players.every(p => p.dead)){
                if(!window._endGameShowing) handleStoryDefeat();
            }
        }
        updateVisuals();
        updateHeroCard();
        updateBossCard();
        updateAllSpriteDirections();
    };

    // ---- manageTurns história ----
    window.manageTurns = function(){
        if(!window._storyMode || !_origManageTurns){
            return _origManageTurns.apply(this, arguments);
        }
        if(!gameActive || arcadeBossTransition) return;
        if(window._endGameShowing) return;

        let next = currentPlayerIdx + 1;
        while(next<players.length && players[next].dead) next++;

        if(next < players.length){
            currentPlayerIdx = next;
            switchConfig(next);
            addLog(`🎮 Turno de ${players[currentPlayerIdx].name}`);
            const tb = document.getElementById('turnBoss');
            if(tb) tb.classList.remove('active-turn');
            const tp = document.getElementById('turnP_Active');
            if(tp) tp.classList.add('active-turn');
        } else {
            currentPlayerIdx = -1;
            if(typeof _origSaveAndRefresh === 'function') _origSaveAndRefresh();
            addLog(`👹 TURNO DO INIMIGO!`);
            const tp = document.getElementById('turnP_Active');
            if(tp) tp.classList.remove('active-turn');
            const tb = document.getElementById('turnBoss');
            if(tb) tb.classList.add('active-turn');

            setTimeout(() => {
                if(window._endGameShowing) return;
                if(gameActive && !boss.dead && players.some(p=>!p.dead) && !arcadeBossTransition){
                    storyEnemyAI();
                } else if(!players.some(p=>!p.dead)){
                    handleStoryDefeat();
                }
            }, 1000);
        }
        updateAllSpriteDirections();
        updateHeroCard();
        updateBossCard();
    };

    // ---- saveAndRefresh história ----
    if(_origSaveAndRefresh){
        window.saveAndRefresh = function(){
            if(!window._storyMode || !_origSaveAndRefresh){
                return _origSaveAndRefresh.apply(this, arguments);
            }
            _origSaveAndRefresh.apply(this, arguments);
            players.forEach(p => {
                p.element = getHeroStoryElement(p.class);
            });
            if(typeof updateHeroCard === 'function') updateHeroCard();
        };
    }

    if(_origHandleBossDefeat){
        window.handleBossDefeat = function(){
            if(window._storyMode) return handleStoryBossDefeat();
            return _origHandleBossDefeat.apply(this, arguments);
        };
    }
    if(_origBossAI){
        window.bossAI = function(){
            if(window._storyMode) return storyEnemyAI();
            return _origBossAI.apply(this, arguments);
        };
    }
    _overridesInstalled = true;
}

// =================================================================
// 🎯 RESTAURA AS FUNÇÕES ORIGINAIS
// =================================================================
function restoreBaseGameFunctions(){
    if(!_overridesInstalled) return;
    if(_origApplyDmg) window.applyDmg = _origApplyDmg;
    if(_origManageTurns) window.manageTurns = _origManageTurns;
    if(_origHandleBossDefeat) window.handleBossDefeat = _origHandleBossDefeat;
    if(_origBossAI) window.bossAI = _origBossAI;
    if(_origSaveAndRefresh) window.saveAndRefresh = _origSaveAndRefresh;
    _overridesInstalled = false;
}

// =================================================================
// 🚀 INICIAR UMA FASE
// =================================================================
function startStoryPhase(cid, pid){
    const ch = STORY_CHAPTERS[cid]; if(!ch) return;
    const ph = ch.phases.find(p => p.id===pid); if(!ph) return;

    if(!STORY_PROGRESS.selectedHeroes || STORY_PROGRESS.selectedHeroes.length===0){
        STORY_PROGRESS.selectedHeroes = ['Tupa'];
        saveStoryProgress();
    }

    STORY_PROGRESS.currentChapter = cid;
    saveStoryProgress();

    storyCurrentPhase = ph;
    storyCurrentEnemyIndex = 0;
    storyEnemiesRemaining = [...ph.enemies];
    storyBattleActive = true;
    storyPendingDrops = [];
    window._storyPurificationShowing = false;

    const s = document.getElementById('storyScreen');
    if(s) s.style.display='none';

    initStoryBattle();
}

// =================================================================
// ⚔️ INICIALIZA A BATALHA
// Correções B2 (unlockAudio)
// =================================================================
async function initStoryBattle(){
    if(storyEnemiesRemaining.length===0) return;
    const enemyId = storyEnemiesRemaining[0];
    const enemy = STORY_ENEMIES[enemyId]; if(!enemy) return;

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
    boss.x = 4; boss.y = 0;

    ['titleScreen','storyScreen','modeScreen','challengeScreen','playersScreen','configScreen','tutorialScreen']
        .forEach(id => { const el = document.getElementById(id); if(el) el.style.display='none'; });

    const gs = document.getElementById('gameScreen');
    if(gs){ gs.style.display='flex'; gs.classList.add('active'); }
    currentScreen = 'game';

    installStoryOverrides();

    // ⚡ B2 — Garante que o áudio está liberado antes de iniciar
    if(typeof unlockAudio === 'function'){
        try { unlockAudio(); } catch(e){ console.warn('[historia] unlockAudio falhou:', e); }
    }

    await initGame();

    // ⚡ Re-aplica o HP do inimigo (initGame sobrescreve com hp_BOSS_cfg)
    boss.hp = enemy.hp;
    boss.maxHp = enemy.hp;
    console.log(`[historia] HP re-aplicado após initGame: ${boss.hp}/${boss.maxHp}`);

    applyStoryElementsToPlayers();

    applyStoryEnemyToBoss(enemyId);

    const hb = document.getElementById('headerBossName');
    if(hb){
        const tot = storyEnemiesRemaining.length;
        hb.textContent = `${enemy.name} (1/${tot})`;
    }
    addLog(`⚔️ Fase ${storyCurrentPhase.id} — ${storyCurrentPhase.name}`);
    addLog(`🎯 Inimigo: ${enemy.name}`);
    addLog(`✨ Elemento do time: ${getSaveElement()}`);

    // ---- Diálogo de abertura do boss ----
    await sleep(500);
    console.log('[historia] mostrando diálogo de abertura do boss para:', enemyId);
    await showBossIntroDialog(enemyId);
    console.log('[historia] diálogo de abertura fechado');
}

// =================================================================
// ✨ APLICA O ELEMENTO DO SAVE EM TODOS OS PLAYERS
// =================================================================
function applyStoryElementsToPlayers(){
    const saveEl = getSaveElement();
    players.forEach(p => {
        p.element = getHeroStoryElement(p.class);
        console.log(`[historia] ${p.class} → elemento ${p.element} (save: ${saveEl})`);
    });
    if(typeof updateHeroCard === 'function') updateHeroCard();
}

// =================================================================
// 👥 APLICA OS HERÓIS SELECIONADOS
// =================================================================
function applyStoryHeroesToConfigs(){
    const sel = STORY_PROGRESS.selectedHeroes || ['Tupa'];
    for(let i=0;i<4;i++) playerConfigs[i].active = false;
    const max = Math.min(sel.length, 4);
    for(let i=0;i<max;i++){
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
    if(old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'storyVictoryOverlay';
    ov.className = 'story-result-overlay';

    const groups = {};
    drops.forEach(d => { groups[d.id] = (groups[d.id]||0) + d.qty; });
    let dropsHTML;
    const ids = Object.keys(groups);
    if(ids.length===0) dropsHTML = '<div class="story-result-no-drops">Nenhum material.</div>';
    else {
        dropsHTML = '<div class="story-result-drops-grid">';
        ids.forEach(id => {
            const m = STORY_MATERIALS[id]; if(!m) return;
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
    if(isFinal){
        title = `${uiIcon('crown')} O ABISMO FOI FECHADO!`;
        sub = 'Anhangá foi derrotado. As doze entidades estão livres para sempre. A mata respira.';
    } else if(isBoss){
        title = `${uiIcon('crown')} ATO COMPLETO!`;
        const lastEnemy = phase.enemies[phase.enemies.length-1];
        const bossName = STORY_ENEMIES[lastEnemy]?.name || 'o guardião';
        sub = `${bossName} foi libertado da influência de Anhangá.`;
    }

    const nextId = getNextPhaseId(phase.id, cid);
    const nextPh = nextId ? STORY_CHAPTERS[cid].phases.find(p=>p.id===nextId) : null;

    // Aviso de novo ato desbloqueado
    let extraHTML = '';
    if(isBoss && STORY_CHAPTERS[cid + 1] && !isFinal){
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
    if(typeof playSfx === 'function') playSfx('win');
}

// =================================================================
// 💀 TELA DE DERROTA DA FASE
// =================================================================
function showStoryDefeatScreen(phase, drops){
    const old = document.getElementById('storyVictoryOverlay');
    if(old) old.remove();
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
    if(typeof playSfx === 'function') playSfx('gameover');
}

// =================================================================
// 🎯 BOTÕES DAS TELAS DE RESULTADO
// =================================================================
function continueToNextPhase(nextId){
    const ov = document.getElementById('storyVictoryOverlay');
    if(ov) ov.remove();
    window._endGameShowing = false;
    window._storyPurificationShowing = false;
    startStoryPhase(STORY_PROGRESS.currentChapter||1, nextId);
}

function returnFromStoryVictory(){
    const ov = document.getElementById('storyVictoryOverlay');
    if(ov) ov.remove();
    window._endGameShowing = false;
    window._storyPurificationShowing = false;
    restoreBaseGameFunctions();
    const gs = document.getElementById('gameScreen');
    if(gs){ gs.classList.remove('active'); gs.style.display='none'; }

    // ⚡ B6 — Força re-render da Aldeia para refletir desbloqueios
    showStoryScreen();

    // Re-renderiza a Aldeia (caso a tela já esteja visível)
    setTimeout(() => {
        const ss = document.getElementById('storyScreen');
        if(ss && ss.classList.contains('active')){
            renderAldeiaScreen();
        }
    }, 50);
}

function retryStoryPhase(){
    const ov = document.getElementById('storyVictoryOverlay');
    if(ov) ov.remove();
    window._endGameShowing = false;
    window._storyPurificationShowing = false;
    const cid = STORY_PROGRESS.currentChapter||1;
    if(storyCurrentPhase) startStoryPhase(cid, storyCurrentPhase.id);
    else returnFromStoryVictory();
}
// =================================================================
// historia.js — V5.1 — Bloco 6/6 (FINAL)
// Auto-init + exposição no window + testes
// =================================================================

// =================================================================
// 🌐 EXPÕE NO WINDOW (garante disponibilidade global)
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
            if(last){
                loadStoryProgressByName(last);
                console.log(`📖 Save "${last}" restaurado.`);
            } else {
                console.log('📖 Nenhum save. O modal aparecerá ao entrar.');
            }
            console.log('📖 historia.js V5.1 pronto.');
        } catch(e){
            console.error('❌ Erro no auto-init:', e);
        }
    }
    if(document.readyState === 'loading'){
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
    showStoryScreen();
};

window.resetStoryMode = function(){
    if(!confirm('Apagar TODOS os saves do Modo História?')) return;
    listStorySaves().forEach(s => {
        try { localStorage.removeItem(getSaveKey(s.name)); } catch(e){}
    });
    try { localStorage.removeItem(STORY_SAVE_KEY_CURRENT); } catch(e){}
    STORY_CURRENT_SAVE_NAME = null;
    STORY_PROGRESS = createEmptyStoryProgress();
    console.log('✅ Saves apagados.');
    showStoryScreen();
};

// Atalho pra desbloquear todos os capítulos (útil pra testar)
window.unlockAllStoryChapters = function(){
    Object.keys(STORY_CHAPTERS).forEach(k => {
        const cid = parseInt(k);
        if(!STORY_PROGRESS.unlockedChapters.includes(cid)){
            STORY_PROGRESS.unlockedChapters.push(cid);
        }
        if(!STORY_PROGRESS.unlockedPhases[cid]) STORY_PROGRESS.unlockedPhases[cid] = [];
        STORY_CHAPTERS[cid].phases.forEach(p => {
            if(!STORY_PROGRESS.unlockedPhases[cid].includes(p.id)){
                STORY_PROGRESS.unlockedPhases[cid].push(p.id);
            }
        });
    });
    saveStoryProgress();
    console.log('✅ Todos os capítulos e fases desbloqueados!');
    renderAldeiaScreen();
};

// Reseta o save atual pra Ato 1 (útil depois de aplicar B5)
window.resetProgressToAct1 = function(){
    if(!confirm('Resetar progresso para o Ato 1? (mantém ouro, XP e materiais)')) return;
    STORY_PROGRESS.unlockedChapters = [1];
    STORY_PROGRESS.unlockedPhases = {1:['1-1']};
    STORY_PROGRESS.completedPhases = [];
    STORY_PROGRESS.currentChapter = 1;
    saveStoryProgress();
    console.log('✅ Progresso resetado para o Ato 1');
    renderAldeiaScreen();
};

// Verifica quais ícones estão preenchidos (imagem) e quais usam emoji
window.testUiIcons = function(){
    const keys = [
        // UI
        'ui_gold','ui_xp','ui_swap','ui_home','ui_play','ui_gift','ui_crown',
        'ui_sparkle','ui_skull','ui_lock','ui_check','ui_arrow','ui_warn','ui_medal',
        // Elementos
        'elem_fogo','elem_agua','elem_terra','elem_ar',
        // Aldeia
        'aldeia_bg','aldeia_atos','aldeia_oca','aldeia_loja','aldeia_ritual',
        'aldeia_bestiario','aldeia_tesouraria',
        // Capas
        'capa_ato1','capa_ato2','capa_ato3','capa_ato4','capa_ato5','capa_ato6',
        'capa_ato7','capa_ato8','capa_ato9','capa_ato10','capa_ato11','capa_ato12','capa_ato13'
    ];
    const preenchidos = [];
    const vazios = [];
    keys.forEach(k => {
        const url = SPRITES_STORY[k];
        if(url && url.trim() !== ''){
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
// FIM — historia.js V5.1
// =================================================================