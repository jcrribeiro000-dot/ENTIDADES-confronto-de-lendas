// =================================================================
// ENTIDADES: Confronto de Lendas — MODO HISTÓRIA
// historia.js — V8.1 (arquivo completo, sem patches empilhados)
// =================================================================
//
// ⚠️ NÃO TOCA EM entidades.js
// Sobrescreve applyDmg/manageTurns/saveAndRefresh SÓ quando _storyMode === true.
//
// O QUE MUDOU NA V8.1 (em relação à V7.0 + patches V7.2/V7.6/V8.0):
//   • triggerBravelyChain para heróis novos: ÚNICA fonte de verdade
//   • executeAction para heróis novos: ÚNICA fonte de verdade
//     - Guerreiro ataca SÓ tile adjacente a cada passo
//     - Mago/Arqueiro ataca à distância
//     - Bravely SEMPRE chama showBravelyAnimation + triggerBravelyChain
//   • installStoryOverrides NÃO sobrescreve mais executeAction
//   • Sistema de estrelas: limiares generosos (60%/35%/15%) + mínimo 1
//   • Todos os patches V7.x/V8.0 antigos foram REMOVIDOS e integrados
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
        .story-phase-header{display:flex;justify-content:space-between;align-items:center;padding:10px 15px;background:rgba(10,6,2,.5);border-bottom:1px solid rgba(201,162,39,.15);gap:8px}
        .story-phase-num{font-family:'Cinzel',serif;font-size:.85rem;color:#e8b923;letter-spacing:1.5px;font-weight:700}
        .story-phase-stars{display:flex;gap:2px;font-size:.9rem;line-height:1}
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
        .story-star{display:inline-block;font-size:1em;line-height:1;filter:drop-shadow(0 0 3px rgba(0,0,0,.6))}
        .story-star.on{color:#e8b923;text-shadow:0 0 6px rgba(232,185,35,.7)}
        .story-star.off{color:#4a3a20;opacity:.6}
        .story-stars-counter{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;background:linear-gradient(135deg,rgba(58,42,24,.9),rgba(26,18,8,.9));border:1px solid #6a5024;border-radius:20px;font-family:'Cinzel',serif;font-weight:700;font-size:.95rem;color:#e8b923;letter-spacing:1px}
        .story-stars-counter .story-stars-icon{font-size:1.15em;filter:drop-shadow(0 0 6px rgba(232,185,35,.6))}
        .story-stars-big{display:flex;justify-content:center;gap:14px;font-size:3.5rem;line-height:1;margin:10px 0;letter-spacing:4px}
        .story-stars-big .story-star{opacity:0;transform:scale(0.3);transition:opacity .3s ease-out,transform .3s cubic-bezier(.34,1.56,.64,1)}
        .story-stars-big .story-star.show{opacity:1;transform:scale(1)}
        .story-stars-big .story-star.big-on{color:#e8b923;text-shadow:0 0 15px rgba(232,185,35,.9),0 0 30px rgba(232,185,35,.5)}
        .story-stars-big .story-star.big-off{color:#3a2d18;opacity:.5}
        .story-stars-big .story-star.big-off.show{opacity:.5}
        .story-heroes-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:20px;margin-bottom:30px}
        .story-hero-card{background:linear-gradient(180deg,rgba(201,162,39,.05),transparent 40%),linear-gradient(180deg,rgba(42,31,16,.9),rgba(26,18,8,.9));border:2px solid #3d2d18;border-radius:8px;padding:20px 15px;text-align:center;cursor:pointer;transition:all .3s;position:relative}
        .story-hero-card:hover:not(.locked){transform:translateY(-4px);border-color:#6a5024}
        .story-hero-card.selected{border-color:#e8b923;background:linear-gradient(180deg,rgba(232,185,35,.15),transparent 50%),linear-gradient(180deg,rgba(58,42,24,.9),rgba(26,18,8,.9));box-shadow:0 0 25px rgba(232,185,35,.35)}
        .story-hero-card.locked{cursor:not-allowed;background:linear-gradient(180deg,rgba(20,15,10,.9),rgba(10,6,2,.95));border-color:#2a1f10;opacity:.75}
        .story-hero-sprite{width:80px;height:80px;object-fit:contain;display:block;margin:0 auto 12px;filter:drop-shadow(0 0 6px rgba(0,0,0,.7))}
        .story-hero-card.locked .story-hero-sprite{filter:brightness(0) invert(0.15) drop-shadow(0 0 8px rgba(232,185,35,.3));opacity:.85}
        .story-hero-name{font-family:'Cinzel',serif;color:#f0e2c0;font-size:1rem;letter-spacing:1px;margin-bottom:4px}
        .story-hero-card.locked .story-hero-name{color:#5a4a30;font-style:italic}
        .story-hero-element{font-family:'Cinzel',serif;font-size:.8rem;font-weight:700;letter-spacing:1px;margin-bottom:6px;display:inline-flex;align-items:center;gap:4px;justify-content:center}
        .story-hero-element img{width:16px;height:16px;object-fit:contain}
        .story-hero-level{font-family:'EB Garamond',serif;color:#e8b923;font-size:.85rem;font-weight:700;margin-bottom:2px}
        .story-hero-xp{font-family:'EB Garamond',serif;color:#8a7a52;font-size:.8rem}
        .story-hero-check{position:absolute;top:10px;right:10px;font-size:1.2rem}
        .story-hero-check img{width:22px;height:22px;object-fit:contain}
        .story-hero-lock-info{font-family:'EB Garamond',serif;font-size:.85rem;font-style:italic;color:#8a7a52;margin-top:6px;line-height:1.3}
        .story-hero-lock-info b{color:#e8b923;font-family:'Cinzel',serif;font-style:normal}
        .story-hero-lock-icon{position:absolute;top:10px;right:10px;font-size:1.1rem;opacity:.7}
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
        .story-toast{position:fixed;top:20px;right:20px;background:linear-gradient(135deg,#2c3e50,#34495e);color:white;padding:15px 20px;border-radius:8px;border-left:4px solid #f1c40f;box-shadow:0 5px 15px rgba(0,0,0,.5);z-index:10010;max-width:320px;transform:translateX(120%);transition:transform .35s cubic-bezier(.34,1.56,.64,1);animation:storyToastIn .35s cubic-bezier(.34,1.56,.64,1) forwards}
        @keyframes storyToastIn{from{transform:translateX(120%)}to{transform:translateX(0)}}
        .story-toast .toast-title{font-family:'Cinzel',serif;font-weight:700;font-size:.8rem;letter-spacing:2px;color:#f1c40f;margin-bottom:4px}
        .story-toast .toast-body{font-family:'EB Garamond',serif;font-size:.95rem;line-height:1.35}
        .story-toast .toast-icon{font-size:1.6rem;flex-shrink:0}
        .story-toast .toast-wrap{display:flex;align-items:center;gap:12px}
        @media (max-width:600px){
            .story-title{font-size:1.6rem}
            .story-ald-title{font-size:1.4rem}
            .story-chapters-grid,.story-phases-grid,.story-shop-grid{grid-template-columns:1fr}
            .story-heroes-grid{grid-template-columns:repeat(2,1fr)}
            .story-result-title{font-size:1.3rem}
            .story-save-input-wrap{flex-direction:column}
            .story-stars-big{font-size:2.4rem;gap:10px}
            .story-toast{right:10px;left:10px;max-width:none}
        }
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
    // --- Ato 2 ---
    'tamandua':'https://i.imgur.com/8Breoi9.gif',
    'anta':'https://i.imgur.com/0avAEnD.gif',
    'queixada':'https://i.imgur.com/0fsGkKs.gif',
    'sucuri':'https://i.imgur.com/0dt6Jk2.gif',
    // --- Ato 3 ---
    'piranha':'https://i.imgur.com/KKOPhc5.gif',
    'lontra':'https://i.imgur.com/wOHYX2a.gif',
    'ariranha':'https://i.imgur.com/7obkFIq.gif',
    'pirarucu':'https://i.imgur.com/4dHWgkT.gif',
    // --- Ato 4 ---
    'cascavel':'https://i.imgur.com/4QjmPV2.gif',
    'coral':'https://i.imgur.com/8kstFde.gif',
    'jararaca':'https://i.imgur.com/5Ll9B9h.gif',
    'tartaruga':'https://i.imgur.com/wr0u1rt.gif',
    // --- Ato 5 ---
    'bode':'https://i.imgur.com/vknDxdA.gif',
    'carneiro':'https://i.imgur.com/UlmnSrt.gif',
    'cavalo_selvagem':'https://i.imgur.com/Y8LuBY1.gif',
    'touro_bravo':'https://i.imgur.com/YAGfZmd.gif',
    // --- Ato 6 ---
    'urubu':'https://i.imgur.com/h4N8ZzS.gif',
    'carcara':'https://i.imgur.com/1A2lqg8.gif',
    'tatu':'https://i.imgur.com/5unG9x9.gif',
    'lobo_guara':'https://i.imgur.com/f7KgIRB.gif',
    // --- Ato 7 ---
    'cachorro_mato':'https://i.imgur.com/easvBrN.gif',
    'raposa':'https://i.imgur.com/rwNleG8.gif',
    'guaxinim':'https://i.imgur.com/pFcDvhd.gif',
    'jaguatirica':'',
    // --- Ato 8 ---
    'morcego':'',
    'coruja':'',
    'sapo_cururu':'',
    'seriema':'',
    // --- Ato 9 ---
    'tucunare':'',
    'piraiba':'',
    'dourada':'',
    'peixe_boi':'',
    // --- Ato 10 ---
    'bufalo':'',
    'vaca_louca':'',
    'cabra_preta':'',
    'zebu':'',
    // --- Ato 11 ---
    'gato_mato':'',
    'mariposa_gigante':'',
    'quati':'',
    'sucuarana':'',
    // --- Ato 12 ---
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

    // --- HERÓIS NOVOS ---
    'heroi_Kanarott':'https://i.imgur.com/6Y2qBQh.gif',
    'heroi_Jurua':'https://i.imgur.com/R8Tf3nI.gif',
    'heroi_BichoFolharal':'https://i.imgur.com/NCbRRFK.gif',
    'heroi_Eru':'https://i.imgur.com/WJZUsKI.gif',
    'heroi_Teperesik':'https://i.imgur.com/SzgasL5.gif',
    'heroi_Andure':'https://i.imgur.com/XKsY67z.gif',
    'heroi_PajeAnhanguera':'https://i.imgur.com/gpb5vvQ.gif',
    'heroi_MaeDaMata':'https://i.imgur.com/MjcLAzy.gif',
    'heroi_Araci':'https://i.imgur.com/x8gAPJH.gif',
    'heroi_Tapyrayawara':'https://i.imgur.com/m0tdSWA.gif',

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

    // --- Ícones UI ---
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
    'ui_star':'',
    'ui_star_empty':'',
    'elem_fogo':'https://i.imgur.com/JouEZbM.png',
    'elem_agua':'https://i.imgur.com/tMRUv48.png',
    'elem_terra':'https://i.imgur.com/ZVPQ9iH.png',
    'elem_ar':'https://i.imgur.com/HLqTdbd.png',
    'icon_story':'https://i.imgur.com/aL5KByZ.png','icon_locked':'https://i.imgur.com/wGgq9l7.png','icon_unlocked':'',
    'icon_skull':'https://i.imgur.com/GPSPBly.png','icon_drop':'https://i.imgur.com/a5t2pWl.png','icon_gold':'https://i.imgur.com/LIfKWB8.png'
};

// =================================================================
// 🔤 EMOJIS (fallback)
// =================================================================
const EMOJI_STORY = {
    'porco_espinho':'🦔','jacare':'🐊','cervo':'🦌','onca_parda':'🐆','saci':'👺',
    'tamandua':'🐜','anta':'🦛','queixada':'🐗','sucuri':'🐍','mapinguari':'🦥',
    'piranha':'🐟','lontra':'🦦','ariranha':'🦦','pirarucu':'🐠','iara':'🧜‍♀️',
    'cascavel':'🐍','coral':'🐍','jararaca':'🐍','tartaruga':'🐢','boitata':'🔥',
    'bode':'🐐','carneiro':'🐏','cavalo_selvagem':'🐎','touro_bravo':'🐂','mula':'🐴',
    'urubu':'🦅','carcara':'🦅','tatu':'🦔','lobo_guara':'🐺','corpo_seco':'💀',
    'cachorro_mato':'🐕','raposa':'🦊','guaxinim':'🦝','jaguatirica':'🐆','lobisomem':'🐺',
    'morcego':'🦇','coruja':'🦉','sapo_cururu':'🐸','seriema':'🐦','cuca':'🧙‍♀️',
    'tucunare':'🐟','piraiba':'🐟','dourada':'🐟','peixe_boi':'🦭','boto':'🐬',
    'bufalo':'🐃','vaca_louca':'🐄','cabra_preta':'🐐','zebu':'🐂','boi':'🐂',
    'gato_mato':'🐈','mariposa_gigante':'🦋','quati':'🦝','sucuarana':'🐆','jaci':'🌙',
    'gaviao':'🦅','falcao':'🦅','urutau':'🦉','aguia_cinzenta':'🦅','guaraci':'☀️',
    'espectro_saci':'👺','espectro_mapinguari':'🦥','espectro_iara':'🧜‍♀️','espectro_boitata':'🔥',
    'espectro_mula':'🐴','espectro_corposeco':'💀','espectro_lobisomem':'🐺','espectro_cuca':'🧙‍♀️',
    'espectro_boto':'🐬','espectro_boi':'🐂','espectro_jaci':'🌙','espectro_guaraci':'☀️',
    'anhanga':'👹',
    'heroi_Kanarott':'🦅','heroi_Jurua':'🐆','heroi_BichoFolharal':'🐿️','heroi_Eru':'🦌',
    'heroi_Teperesik':'🐢','heroi_Andure':'🐬','heroi_PajeAnhanguera':'🦉','heroi_MaeDaMata':'🌳',
    'heroi_Araci':'🦜','heroi_Tapyrayawara':'🐆',
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
    'capa_ato1':'📖','capa_ato2':'📕','capa_ato3':'📘','capa_ato4':'📙','capa_ato5':'📗',
    'capa_ato6':'📓','capa_ato7':'📔','capa_ato8':'📒','capa_ato9':'📓','capa_ato10':'📕',
    'capa_ato11':'📘','capa_ato12':'📙','capa_ato13':'📕',
    'aldeia_bg':'🏘️','aldeia_atos':'🗺️','aldeia_oca':'🏠','aldeia_loja':'🧙',
    'aldeia_ritual':'⚗️','aldeia_bestiario':'📖','aldeia_tesouraria':'🏆',
    'arma_cajado':'🪄','arma_arco':'🏹','arma_manopla':'🪓',
    'ui_gold':'💰','ui_xp':'⭐','ui_swap':'🔄','ui_home':'🏘️','ui_play':'▶',
    'ui_gift':'🎁','ui_crown':'👑','ui_sparkle':'✨','ui_skull':'💀','ui_lock':'🔒',
    'ui_check':'✅','ui_arrow':'▶','ui_warn':'⚠️','ui_medal':'🏅',
    'ui_star':'⭐','ui_star_empty':'☆',
    'elem_fogo':'🔥','elem_agua':'💧','elem_terra':'⛰️','elem_ar':'🌪️',
    'icon_story':'📖','icon_locked':'🔒','icon_unlocked':'✅',
    'icon_skull':'💀','icon_drop':'💎','icon_gold':'💰'
};

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

// =================================================================
// 🎯 SISTEMA UNIVERSAL DE ÍCONES
// =================================================================
function uiIcon(nome, extraCls){
    const spriteKey = nome.startsWith('ui_') || nome.startsWith('elem_') || nome.startsWith('icon_') || nome.startsWith('heroi_') ? nome : 'ui_' + nome;
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
// 💾 SAVE
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
        unlockedHeroes:['Tupa','Sume','Caipora'],
        selectedHeroes:['Tupa'],
        heroLevels:{Tupa:1,Sume:1,Caipora:1}, heroXP:{Tupa:0,Sume:0,Caipora:0},
        craftedWeapons:[], phasesEverCompleted:[],
        starsByPhase:{},
        unlockedHeroesStory:['Tupa','Sume','Caipora'],
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
        if(!STORY_PROGRESS.starsByPhase || typeof STORY_PROGRESS.starsByPhase !== 'object'){
            STORY_PROGRESS.starsByPhase = {};
        }
        if(!Array.isArray(STORY_PROGRESS.unlockedHeroesStory)){
            STORY_PROGRESS.unlockedHeroesStory = ['Tupa','Sume','Caipora'];
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
                        stars: Object.values(data.starsByPhase || {}).reduce((a,b)=>a+b, 0),
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
const HERO_FIXED_ELEMENTS = {
    'Kanarott': 'TERRA','Teperesik': 'TERRA','Eru': 'FOGO','Anduré': 'AGUA',
    'Mãe da Mata': 'TERRA','Pajé Anhanguera': 'FOGO','Juruá': 'TERRA',
    'Araci': 'AR','Bicho Folharal': 'AR',"Tapyra'yawara": 'TERRA',
};

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
// 🎯 SISTEMA DE ESTRELAS — CONFIGURAÇÃO (V8.1 — limiares generosos)
// =================================================================
const STORY_STARS_CONFIG = {
    MAX_STARS_PER_PHASE: 3,
    THRESHOLD_3_STARS: 0.60,
    THRESHOLD_2_STARS: 0.35,
    THRESHOLD_1_STAR:  0.15,
    REF_ULTIMATE_BONUS: 150,
    REF_AMULET_BONUS: 100,
    REF_SHAPE_LINHA: 50,
    REF_SHAPE_L: 75,
    REF_SHAPE_ZIGZAG: 100,
    REF_SHAPE_QUADRADO: 80,
    REF_MAX_TURNS_MULT: 1.5,
    REF_MAX_ULTIMATES: 1,
    REF_MAX_AMULETS: 2,
};

function calcularMaxScorePossivel(cid, phase) {
    if (!phase || !phase.enemies || phase.enemies.length === 0) return 100;
    const lastEnemyId = phase.enemies[phase.enemies.length - 1];
    const lastEnemy = STORY_ENEMIES[lastEnemyId];
    const bossHp = lastEnemy ? lastEnemy.hp : 30;
    const baseRaw = 1000 + ((bossHp - 30) * 50);
    const base = Math.max(100, baseRaw);
    const baseMult = base * 1.5;
    const ultimatesBonus = 1 * 150;
    const amuletsBonus   = 2 * 100;
    const shapesBonus    = 100;
    return Math.floor(baseMult + ultimatesBonus + amuletsBonus + shapesBonus);
}

function calcularEstrelas(score, maxScore) {
    if (!maxScore || maxScore <= 0) return 1;
    const ratio = score / maxScore;
    if (ratio >= 0.60) return 3;
    if (ratio >= 0.35) return 2;
    return 1;
}

function getStarsForPhase(phaseId) {
    return STORY_PROGRESS.starsByPhase[phaseId] || 0;
}

function saveStarsForPhase(phaseId, stars) {
    const current = getStarsForPhase(phaseId);
    const effective = Math.max(current, stars);
    STORY_PROGRESS.starsByPhase[phaseId] = effective;
    return effective;
}

function getTotalStars() {
    return Object.values(STORY_PROGRESS.starsByPhase || {}).reduce((a,b)=>a+b, 0);
}

function getMaxTotalStars() {
    let totalPhases = 0;
    Object.values(STORY_CHAPTERS).forEach(ch => { totalPhases += ch.phases.length; });
    return totalPhases * STORY_STARS_CONFIG.MAX_STARS_PER_PHASE;
}

// =================================================================
// 🏅 DESBLOQUEIO DE HERÓIS POR ESTRELAS
// =================================================================
const STORY_HERO_UNLOCKS = [
    { className: 'Kanarott',        displayName: 'Kanarott',        starsNeeded: 10  },
    { className: 'Juruá',           displayName: 'Juruá',           starsNeeded: 20  },
    { className: 'Bicho Folharal',  displayName: 'Bicho Folharal',  starsNeeded: 30  },
    { className: 'Eru',             displayName: 'Eru',             starsNeeded: 45  },
    { className: 'Teperesik',       displayName: 'Teperesik',       starsNeeded: 60  },
    { className: 'Anduré',          displayName: 'Anduré',          starsNeeded: 75  },
    { className: 'Pajé Anhanguera', displayName: 'Pajé Anhanguera', starsNeeded: 90  },
    { className: 'Mãe da Mata',     displayName: 'Mãe da Mata',     starsNeeded: 110 },
    { className: 'Araci',           displayName: 'Araci',           starsNeeded: 130 },
    { className: "Tapyra'yawara",   displayName: "Tapyra'yawara",   starsNeeded: 150 },
];

function checkHeroUnlocks() {
    if (!Array.isArray(STORY_PROGRESS.unlockedHeroesStory)) {
        STORY_PROGRESS.unlockedHeroesStory = ['Tupa','Sume','Caipora'];
    }
    const totalStars = getTotalStars();
    const unlocked = [];
    STORY_HERO_UNLOCKS.forEach(entry => {
        if (totalStars >= entry.starsNeeded && !STORY_PROGRESS.unlockedHeroesStory.includes(entry.className)) {
            STORY_PROGRESS.unlockedHeroesStory.push(entry.className);
            unlocked.push(entry);
        }
    });
    if (unlocked.length > 0) {
        saveStoryProgress();
        unlocked.forEach(entry => {
            showToast('🏅 HERÓI DESBLOQUEADO!', entry.displayName, '🏅');
            try {
                if (typeof playSfx === 'function') playSfx('win');
            } catch(e) {}
        });
    }
    return unlocked;
}

function showToast(title, body, icon='⭐', durationMs = 4000) {
    try {
        const toast = document.createElement('div');
        toast.className = 'story-toast';
        toast.innerHTML = `
            <div class="toast-wrap">
                <div class="toast-icon">${icon}</div>
                <div>
                    <div class="toast-title">${title}</div>
                    <div class="toast-body">${body}</div>
                </div>
            </div>`;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.transition = 'transform .35s ease-in, opacity .35s ease-in';
            toast.style.transform = 'translateX(120%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 400);
        }, durationMs);
    } catch(e) {
        console.warn('showToast falhou:', e);
    }
}
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
    2:{id:2,name:'Ato 2 — Mata Fechada',description:'O Mapinguari, o gigante protetor das árvores, foi consumido pela frustração. Agora ele devora o que jurou proteger.',capa:'capa_ato2',phases:[
        {id:'2-1',name:'Trilha das Raízes',bg:'bg_2_1',enemies:['tamandua'],description:'A mata fechada começa aqui.',reward:{xp:20,gold:25}},
        {id:'2-2',name:'Clareira Selvagem',bg:'bg_2_2',enemies:['tamandua','anta'],description:'Dois guardiões bloqueiam o caminho.',reward:{xp:30,gold:40}},
        {id:'2-3',name:'Vale dos Ossos',bg:'bg_2_3',enemies:['tamandua','anta','queixada'],description:'Três servos do Devorador.',reward:{xp:45,gold:55}},
        {id:'2-4',name:'Águas Turvas',bg:'bg_2_4',enemies:['tamandua','anta','queixada','sucuri'],description:'A Sucuri Gigante protege a passagem.',reward:{xp:65,gold:80}},
        {id:'2-BOSS',name:'Toca do Devorador',bg:'bg_2_boss',isBoss:true,enemies:['tamandua','anta','queixada','sucuri','mapinguari'],description:'Enfrente o Mapinguari.',reward:{xp:150,gold:150,chapterComplete:true}}
    ]},
    3:{id:3,name:'Ato 3 — Águas Profundas',description:'A Iara, sedutora dos rios, foi envenenada pela raiva. Suas águas agora afogam sem piedade.',capa:'capa_ato3',phases:[
        {id:'3-1',name:'Margem Sombria',bg:'bg_3_1',enemies:['piranha'],description:'O rio começa a ficar turvo.',reward:{xp:25,gold:30}},
        {id:'3-2',name:'Remanso Profundo',bg:'bg_3_2',enemies:['piranha','lontra'],description:'Dois guardiões das águas.',reward:{xp:40,gold:50}},
        {id:'3-3',name:'Cachoeira Sagrada',bg:'bg_3_3',enemies:['piranha','lontra','ariranha'],description:'Três servos do Canto.',reward:{xp:60,gold:70}},
        {id:'3-4',name:'Foz do Rio',bg:'bg_3_4',enemies:['piranha','lontra','ariranha','pirarucu'],description:'O Pirarucu bloqueia a foz.',reward:{xp:80,gold:100}},
        {id:'3-BOSS',name:'Palácio Submerso',bg:'bg_3_boss',isBoss:true,enemies:['piranha','lontra','ariranha','pirarucu','iara'],description:'Enfrente a Iara.',reward:{xp:200,gold:200,chapterComplete:true}}
    ]},
    4:{id:4,name:'Ato 4 — Chamas da Noite',description:'O Boitatá, a serpente de fogo, aceitou o poder de Anhangá. Agora ele consome tudo em seu caminho.',capa:'capa_ato4',phases:[
        {id:'4-1',name:'Entrada da Caverna',bg:'bg_4_1',enemies:['cascavel'],description:'A escuridão sibila.',reward:{xp:30,gold:35}},
        {id:'4-2',name:'Galeria das Serpentes',bg:'bg_4_2',enemies:['cascavel','coral'],description:'Duas serpentes guardam a passagem.',reward:{xp:45,gold:55}},
        {id:'4-3',name:'Câmara Ardente',bg:'bg_4_3',enemies:['cascavel','coral','jararaca'],description:'Três servos do fogo.',reward:{xp:65,gold:80}},
        {id:'4-4',name:'Lago de Lava',bg:'bg_4_4',enemies:['cascavel','coral','jararaca','tartaruga'],description:'A Tartaruga Ancestral protege o lago.',reward:{xp:90,gold:110}},
        {id:'4-BOSS',name:'Coração de Fogo',bg:'bg_4_boss',isBoss:true,enemies:['cascavel','coral','jararaca','tartaruga','boitata'],description:'Enfrente o Boitatá.',reward:{xp:250,gold:250,chapterComplete:true}}
    ]},
    5:{id:5,name:'Ato 5 — A Maldição do Fogo',description:'A Mula sem Cabeça, amaldiçoada por seus pecados, foi consumida pela fúria.',capa:'capa_ato5',phases:[
        {id:'5-1',name:'Pastagem Abandonada',bg:'bg_5_1',enemies:['bode'],description:'O primeiro servo da maldição.',reward:{xp:35,gold:40}},
        {id:'5-2',name:'Cerca Quebrada',bg:'bg_5_2',enemies:['bode','carneiro'],description:'Dois guardiões do campo.',reward:{xp:50,gold:60}},
        {id:'5-3',name:'Estábulo em Cinzas',bg:'bg_5_3',enemies:['bode','carneiro','cavalo_selvagem'],description:'Três servos da Mula.',reward:{xp:70,gold:90}},
        {id:'5-4',name:'Curral Amaldiçoado',bg:'bg_5_4',enemies:['bode','carneiro','cavalo_selvagem','touro_bravo'],description:'O Touro Bravo guarda o curral.',reward:{xp:100,gold:120}},
        {id:'5-BOSS',name:'Relincho Final',bg:'bg_5_boss',isBoss:true,enemies:['bode','carneiro','cavalo_selvagem','touro_bravo','mula'],description:'Enfrente a Mula sem Cabeça.',reward:{xp:300,gold:300,chapterComplete:true}}
    ]},
    6:{id:6,name:'Ato 6 — Ossos do Sertão',description:'O Corpo Seco, esqueleto faminto, foi tentado por Anhangá. Sua fome é infinita.',capa:'capa_ato6',phases:[
        {id:'6-1',name:'Terra Rachada',bg:'bg_6_1',enemies:['urubu'],description:'O céu já não é azul aqui.',reward:{xp:40,gold:45}},
        {id:'6-2',name:'Cemitério Esquecido',bg:'bg_6_2',enemies:['urubu','carcaara'],description:'Aves da morte guardam o caminho.',reward:{xp:55,gold:70}},
        {id:'6-3',name:'Cavernas Secas',bg:'bg_6_3',enemies:['urubu','carcaara','tatu'],description:'Três servos da fome.',reward:{xp:75,gold:95}},
        {id:'6-4',name:'Vale dos Ossos',bg:'bg_6_4',enemies:['urubu','carcaara','tatu','lobo_guara'],description:'O Lobo-Guará uiva para a morte.',reward:{xp:110,gold:130}},
        {id:'6-BOSS',name:'Covil do Faminto',bg:'bg_6_boss',isBoss:true,enemies:['urubu','carcaara','tatu','lobo_guara','corpo_seco'],description:'Enfrente o Corpo Seco.',reward:{xp:350,gold:350,chapterComplete:true}}
    ]},
    7:{id:7,name:'Ato 7 — A Maldição da Lua',description:'O Lobisomem, amaldiçoado a se transformar, ouviu Anhangá. A lua agora desperta apenas ódio.',capa:'capa_ato7',phases:[
        {id:'7-1',name:'Mata Fria',bg:'bg_7_1',enemies:['cachorro_mato'],description:'O primeiro uivo ao longe.',reward:{xp:50,gold:55}},
        {id:'7-2',name:'Trilha do Uivo',bg:'bg_7_2',enemies:['cachorro_mato','raposa'],description:'Dois caçadores noturnos.',reward:{xp:65,gold:80}},
        {id:'7-3',name:'Bosque Enluarado',bg:'bg_7_3',enemies:['cachorro_mato','raposa','guaxinim'],description:'Três servos da lua.',reward:{xp:85,gold:105}},
        {id:'7-4',name:'Clareira do Ritual',bg:'bg_7_4',enemies:['cachorro_mato','raposa','guaxinim','jaguatirica'],description:'A Jaguatirica ronda o ritual.',reward:{xp:120,gold:150}},
        {id:'7-BOSS',name:'Lua Cheia',bg:'bg_7_boss',isBoss:true,enemies:['cachorro_mato','raposa','guaxinim','jaguatirica','lobisomem'],description:'Enfrente o Lobisomem.',reward:{xp:400,gold:400,chapterComplete:true}}
    ]},
    8:{id:8,name:'Ato 8 — Poções e Sombras',description:'A Cuca, a velha bruxa, foi corrompida por Anhangá. Suas poções agora são veneno puro.',capa:'capa_ato8',phases:[
        {id:'8-1',name:'Pântano Sombrio',bg:'bg_8_1',enemies:['morcego'],description:'A névoa esconde perigo.',reward:{xp:60,gold:65}},
        {id:'8-2',name:'Caverna dos Ecos',bg:'bg_8_2',enemies:['morcego','coruja'],description:'Olhos na escuridão.',reward:{xp:75,gold:90}},
        {id:'8-3',name:'Covil da Bruxa',bg:'bg_8_3',enemies:['morcego','coruja','sapo_cururu'],description:'Três servos da Cuca.',reward:{xp:95,gold:120}},
        {id:'8-4',name:'Caldeirão Fervente',bg:'bg_8_4',enemies:['morcego','coruja','sapo_cururu','seriema'],description:'A Seriema guarda o caldeirão.',reward:{xp:130,gold:160}},
        {id:'8-BOSS',name:'Ritual das Sombras',bg:'bg_8_boss',isBoss:true,enemies:['morcego','coruja','sapo_cururu','seriema','cuca'],description:'Enfrente a Cuca.',reward:{xp:450,gold:450,chapterComplete:true}}
    ]},
    9:{id:9,name:'Ato 9 — Canto das Águas',description:'O Boto Rosa, sedutor das águas doces, foi corrompido pela luxúria de Anhangá.',capa:'capa_ato9',phases:[
        {id:'9-1',name:'Rio Calmo',bg:'bg_9_1',enemies:['tucunare'],description:'Mas o canto já se ouve.',reward:{xp:70,gold:75}},
        {id:'9-2',name:'Corredeira',bg:'bg_9_2',enemies:['tucunare','piraiba'],description:'Dois peixes guardam a correnteza.',reward:{xp:85,gold:100}},
        {id:'9-3',name:'Poço Fundo',bg:'bg_9_3',enemies:['tucunare','piraiba','dourada'],description:'Três servos das águas.',reward:{xp:105,gold:130}},
        {id:'9-4',name:'Remanso do Boto',bg:'bg_9_4',enemies:['tucunare','piraiba','dourada','peixe_boi'],description:'O Peixe-Boi protege o remanso.',reward:{xp:140,gold:170}},
        {id:'9-BOSS',name:'Canto Final',bg:'bg_9_boss',isBoss:true,enemies:['tucunare','piraiba','dourada','peixe_boi','boto'],description:'Enfrente o Boto Rosa.',reward:{xp:500,gold:500,chapterComplete:true}}
    ]},
    10:{id:10,name:'Ato 10 — Terror do Pasto',description:'O Boi da Cara Preta, guardião das trevas, foi consumido pelo medo.',capa:'capa_ato10',phases:[
        {id:'10-1',name:'Pasto Vazio',bg:'bg_10_1',enemies:['bufalo'],description:'O primeiro rugido.',reward:{xp:80,gold:85}},
        {id:'10-2',name:'Curral Abandonado',bg:'bg_10_2',enemies:['bufalo','vaca_louca'],description:'Dois guardiões do pasto.',reward:{xp:95,gold:110}},
        {id:'10-3',name:'Campo das Sombras',bg:'bg_10_3',enemies:['bufalo','vaca_louca','cabra_preta'],description:'Três servos do terror.',reward:{xp:115,gold:140}},
        {id:'10-4',name:'Curral da Morte',bg:'bg_10_4',enemies:['bufalo','vaca_louca','cabra_preta','zebu'],description:'O Zebu guarda o curral.',reward:{xp:150,gold:180}},
        {id:'10-BOSS',name:'Cara Preta',bg:'bg_10_boss',isBoss:true,enemies:['bufalo','vaca_louca','cabra_preta','zebu','boi'],description:'Enfrente o Boi da Cara Preta.',reward:{xp:550,gold:550,chapterComplete:true}}
    ]},
    11:{id:11,name:'Ato 11 — Luz Fria da Lua',description:'Jaci, deusa da lua, foi envenenada pela melancolia. Seus raios queimam em vez de iluminar.',capa:'capa_ato11',phases:[
        {id:'11-1',name:'Encosta da Montanha',bg:'bg_11_1',enemies:['gato_mato'],description:'A noite é mais fria aqui.',reward:{xp:90,gold:95}},
        {id:'11-2',name:'Floresta de Névoa',bg:'bg_11_2',enemies:['gato_mato','mariposa_gigante'],description:'Sombras em movimento.',reward:{xp:105,gold:120}},
        {id:'11-3',name:'Penhasco Prateado',bg:'bg_11_3',enemies:['gato_mato','mariposa_gigante','quati'],description:'Três servos da lua.',reward:{xp:125,gold:150}},
        {id:'11-4',name:'Pico Enluarado',bg:'bg_11_4',enemies:['gato_mato','mariposa_gigante','quati','sucuarana'],description:'A Suçuarana ronda o pico.',reward:{xp:160,gold:190}},
        {id:'11-BOSS',name:'Trono Lunar',bg:'bg_11_boss',isBoss:true,enemies:['gato_mato','mariposa_gigante','quati','sucuarana','jaci'],description:'Enfrente Jaci.',reward:{xp:600,gold:600,chapterComplete:true}}
    ]},
    12:{id:12,name:'Ato 12 — O Sol Devorador',description:'Guaraci, deus do sol, foi consumido pela arrogância. Seu sol queima sem piedade.',capa:'capa_ato12',phases:[
        {id:'12-1',name:'Planalto Ardente',bg:'bg_12_1',enemies:['gaviao'],description:'O calor é insuportável.',reward:{xp:100,gold:105}},
        {id:'12-2',name:'Ravina Seca',bg:'bg_12_2',enemies:['gaviao','falcao'],description:'Dois senhores do céu.',reward:{xp:115,gold:130}},
        {id:'12-3',name:'Vale do Urutau',bg:'bg_12_3',enemies:['gaviao','falcao','urutau'],description:'Três servos do sol.',reward:{xp:135,gold:160}},
        {id:'12-4',name:'Ninho da Águia',bg:'bg_12_4',enemies:['gaviao','falcao','urutau','aguia_cinzenta'],description:'A Águia-Cinzenta protege o ninho.',reward:{xp:170,gold:200}},
        {id:'12-BOSS',name:'Trono Solar',bg:'bg_12_boss',isBoss:true,enemies:['gaviao','falcao','urutau','aguia_cinzenta','guaraci'],description:'Enfrente Guaraci.',reward:{xp:700,gold:700,chapterComplete:true}}
    ]},
    13:{id:13,name:'Ato 13 — O Senhor do Abismo',description:'Anhangá reuniu os poderes que consumiu. Ele manifesta os doze guardiões como servos, e agora aguarda no abismo.',capa:'capa_ato13',phases:[
        {id:'13-1',name:'Portão dos Corrompidos',bg:'bg_13_1',isBoss:true,enemies:['saci','mapinguari','iara','boitata'],description:'Os quatro primeiros guardiões te aguardam.',reward:{xp:200,gold:200}},
        {id:'13-2',name:'Portão dos Caídos',bg:'bg_13_2',isBoss:true,enemies:['mula','corpo_seco','lobisomem','cuca'],description:'Os quatro guardiões do meio.',reward:{xp:250,gold:250}},
        {id:'13-3',name:'Portão do Crepúsculo',bg:'bg_13_3',isBoss:true,enemies:['boto','boi','jaci','guaraci'],description:'Os quatro guardiões finais.',reward:{xp:300,gold:300}},
        {id:'13-4',name:'Abismo Final',bg:'bg_13_4',isBoss:true,isFinalBoss:true,enemies:['espectro_saci','espectro_mapinguari','espectro_iara','espectro_boitata','espectro_mula','espectro_corposeco','espectro_lobisomem','espectro_cuca','espectro_boto','espectro_boi','espectro_jaci','espectro_guaraci','anhanga'],description:'Os doze espectros + Anhangá. A batalha final.',reward:{xp:2000,gold:2000,chapterComplete:true}}
    ]}
};

// =================================================================
// 🎁 MATERIAIS
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
// 🦸 TABELA DE HERÓIS DO MODO HISTÓRIA
// =================================================================
const STORY_HERO_CLASSES = {
    'Tupa': {
        displayName: 'Tupã', spriteKey: null, className: 'Tupa',
        role: 'Guerreiro', hp: 16, atk: 3, range: 0,
        element: null, paKey: 'base_coluna', starsNeeded: 0,
    },
    'Sume': {
        displayName: 'Sumé', spriteKey: null, className: 'Sume',
        role: 'Mago', hp: 8, atk: 2, range: 4,
        element: null, paKey: 'base_linha_cura', starsNeeded: 0,
    },
    'Caipora': {
        displayName: 'Caipora', spriteKey: null, className: 'Caipora',
        role: 'Arqueiro', hp: 10, atk: 2, range: 3,
        element: null, paKey: 'base_area_alvo', starsNeeded: 0,
    },
    'Kanarott': {
        displayName: 'Kanarott', spriteKey: 'heroi_Kanarott', className: 'Kanarott',
        role: 'Guerreiro', hp: 14, atk: 4, range: 0,
        element: 'TERRA', paKey: 'kanarott_cruz_empurra', starsNeeded: 10,
    },
    'Teperesik': {
        displayName: 'Teperesik', spriteKey: 'heroi_Teperesik', className: 'Teperesik',
        role: 'Guerreiro', hp: 20, atk: 2, range: 0,
        element: 'TERRA', paKey: 'teperesik_area2x2', starsNeeded: 60,
    },
    'Eru': {
        displayName: 'Eru', spriteKey: 'heroi_Eru', className: 'Eru',
        role: 'Guerreiro', hp: 12, atk: 5, range: 0,
        element: 'FOGO', paKey: 'eru_linha_horizontal', starsNeeded: 45,
    },
    'Anduré': {
        displayName: 'Anduré', spriteKey: 'heroi_Andure', className: 'Anduré',
        role: 'Mago', hp: 10, atk: 1, range: 4,
        element: 'AGUA', paKey: 'andure_area2x2_cura', starsNeeded: 75,
    },
    'Mãe da Mata': {
        displayName: 'Mãe da Mata', spriteKey: 'heroi_MaeDaMata', className: 'Mãe da Mata',
        role: 'Mago', hp: 11, atk: 1, range: 4,
        element: 'TERRA', paKey: 'maedamata_area3x3_cura', starsNeeded: 110,
    },
    'Pajé Anhanguera': {
        displayName: 'Pajé Anhanguera', spriteKey: 'heroi_PajeAnhanguera', className: 'Pajé Anhanguera',
        role: 'Mago', hp: 9, atk: 3, range: 4,
        element: 'FOGO', paKey: 'paje_coluna_fogo', starsNeeded: 90,
    },
    'Juruá': {
        displayName: 'Juruá', spriteKey: 'heroi_Jurua', className: 'Juruá',
        role: 'Arqueiro', hp: 11, atk: 3, range: 3,
        element: 'TERRA', paKey: 'jurua_area_alvo_3x3', starsNeeded: 20,
    },
    'Araci': {
        displayName: 'Araci', spriteKey: 'heroi_Araci', className: 'Araci',
        role: 'Arqueiro', hp: 9, atk: 2, range: 3,
        element: 'AR', paKey: 'araci_linha_horizontal', starsNeeded: 130,
    },
    'Bicho Folharal': {
        displayName: 'Bicho Folharal', spriteKey: 'heroi_BichoFolharal', className: 'Bicho Folharal',
        role: 'Arqueiro', hp: 10, atk: 2, range: 3,
        element: 'AR', paKey: 'bicho_cruz_completa', starsNeeded: 30,
    },
    "Tapyra'yawara": {
        displayName: "Tapyra'yawara", spriteKey: 'heroi_Tapyrayawara', className: "Tapyra'yawara",
        role: 'Arqueiro', hp: 12, atk: 3, range: 3,
        element: 'TERRA', paKey: 'tapyra_coluna_alvo', starsNeeded: 150,
    },
};

// =================================================================
// 💬 DIÁLOGOS — ATO 1 (Saci)
// =================================================================
const STORY_ENEMY_INTROS = {
    porco_espinho: {title:'O Primeiro Servo',text:'Ah, você chegou. Sente o cheiro de terra revirada? Soprei raiva nos espinhos deste pequeno… ele agora fere por MIM. Todo animal desta mata tem um sussurro meu por dentro. Este é o primeiro. Encare-o, se conseguir.'},
    jacare: {title:'O Guardião do Vau',text:'O rio era manso — eu o tornei faminto. Sussurrei ao jacaré que o mundo temia suas mandíbulas, e ele acreditou. Agora ele morde primeiro, pergunta depois. Meu bote é o teu fim, herói.'},
    cervo: {title:'O Corredor Cego',text:'Este cervo corria livre, sem malícia. Enchi sua cabeça de sombras — agora cada chifre busca carne, não folhas. Ele serve ao vendaval que eu sou. Você o derrota? Ou corre como ele costumava correr?'},
    onca_parda: {title:'A Caçadora da Mata',text:'A caçadora mais temida da floresta agora caça por MIM. Meu sussurro a tornou mais faminta do que qualquer fome verdadeira. Ela é o meu presente para você — a prova de que nem os mais fortes escapam do meu sopro.'},
    saci: {title:'O Senhor do Redemoinho',text:'Você libertou meus servos um por um… admirável. Mas eles eram só casca. Eu sou o vendaval por trás de cada sussurro, o redemoinho que gira dentro de cada bicho desta mata. E você… você não passa de uma folha. Encare-me.'}
};

// =================================================================
// 💬 DIÁLOGOS — ATO 2 (Mapinguari)
// =================================================================
const STORY_ENEMY_INTROS_A2 = {
    tamandua:{title:'O Farejador das Raízes',text:'Sinto teu cheiro, herói. Vem de longe. Eu já fui protetor desta mata — agora eu devoro o que ela cria. Sussurrei ao tamanduá que as formigas eram suas inimigas… e ele agora as caça com fúria cega. Passa por ele, se puder. A mata fechada começa aqui.'},
    anta:{title:'A Muralha da Mata',text:'A anta era a muralha viva que abria clareiras para a floresta respirar. Corrompi sua força — agora ela atropela em vez de abrir caminho. Sente o peso dela no chão? Esse peso é meu. Ela obedece. Ela devora.'},
    queixada:{title:'A Manada Faminta',text:'Sabe por que o queixada anda em bando? Porque sozinho ele é fraco. Sussurrei a ele que só a fúria coletiva o salvaria. Agora ele morde até o que não pode engolir. Cada presa que ele dilacera é oferenda pra mim. Você é a próxima.'},
    sucuri:{title:'A Devoradora das Águas',text:'A sucuri sempre foi a boca da mata — engolia o que precisava, respeitava o rio. Mas eu ensinei a ela que engolir era poder. Agora ela prende, quebra e digere tudo o que respira. Ela é a minha sombra sobre a água. Só assim você chegará até MIM.'},
    mapinguari:{title:'O Devorador Despertado',text:'Então chegou… o que libertou os fracos da mata dos redemoinhos agora ousa me enfrentar. Eu era o protetor. O pilar. A árvore mais velha. Anhangá me sussurrou: "Você é fraco, a floresta morre e você não pode impedir". E ele tinha razão. Então eu devorei a mim mesmo. Vem, herói — vou devorar-te também.'}
};

// =================================================================
// 💬 DIÁLOGOS — ATO 3 (Iara)
// =================================================================
const STORY_ENEMY_INTROS_A3 = {
    piranha:{title:'A Primeira Mandíbula',text:'Meus rios eram cristalinos. Agora, cada gota esconde uma boca. Sussurrei à piranha que a carne dos curiosos era doce — e ela acreditou. Toda criança que se aproxima da margem hoje encontra seus dentes. Você já está na água, herói.'},
    lontra:{title:'A Brincalhona Afogada',text:'A lontra era a alegria do rio — brincava, mergulhava, ria. Enchi sua cabeça de sombras. Agora ela arrasta incautos para o fundo, como se fosse brincadeira. Ela sorri enquanto afoga. Você vai sorrir também.'},
    ariranha:{title:'A Matilha do Fundo',text:'As ariranhas sempre caçaram em bando — mas caçavam pra viver. Sussurrei a elas que a matilha é a única lei. Agora matam por prazer. Seus olhos vermelhos veem você antes mesmo de você chegar. Elas não param até o rio secar.'},
    pirarucu:{title:'O Gigante das Águas',text:'O pirarucu era o senhor calmo das águas fundas. Mas eu lhe ensinei que o silêncio é fraqueza. Agora ele devora tudo — peixes, canoas, gente. Ele é meu trono submerso. Só passando por sua bocarra você chegará a MIM.'},
    iara:{title:'O Canto da Perdição',text:'Meus rios… tão sujos… tão poluídos… Os humanos riem de mim enquanto destroem meu lar. Anhangá me deu força para afogar todos eles. Venham, dancem em minhas águas! Eu canto o canto que afoga. E você, herói… vai cantar comigo?'}
};

// =================================================================
// 💬 DIÁLOGOS — ATO 4 (Boitatá)
// =================================================================
const STORY_ENEMY_INTROS_A4 = {
    cascavel:{title:'O Chocalho do Inferno',text:'A cascavel avisava antes de morder — era justa. Enchi sua cabeça com raiva surda. Agora ela ataca sem aviso. O chocalho dela é o som do fim se aproximando. Ouça, herói. É o teu réquiem.'},
    coral:{title:'A Mentira Colorida',text:'A coral sempre mentiu com beleza — cores vivas, veneno mortal. Sussurrei a ela que a mentira era sua natureza. Agora ela se enrola nos sonhos dos tolos e mata dormindo. Você dorme, herói? Aqui, todos dormem.'},
    jararaca:{title:'A Traiçoeira do Mato',text:'A jararaca era traiçoeira por instinto. Dei a ela propósito. Agora ela não morde por defesa — morde por vontade. Cada passo seu no mato é uma aposta. Você aposta bem, herói?'},
    tartaruga:{title:'A Fortaleza Antiga',text:'A tartaruga já viu impérios nascerem e caírem. Ela carrega séculos no casco. Enchi sua mente com fúria ancestral. Agora ela esmaga com o peso da eternidade. Nenhuma arma te salvará de sua paciência.'},
    boitata:{title:'A Serpente de Fogo',text:'Meu fogo era fraco… apenas luzes na escuridão. Anhangá me deu o verdadeiro poder do inferno! Agora vou consumir tudo que encontrar em meu caminho! Seu corpo vai virar cinza, herói — e o vento vai espalhar você pela mata.'}
};

// =================================================================
// 💬 DIÁLOGOS — ATO 5 (Mula)
// =================================================================
const STORY_ENEMY_INTROS_A5 = {
    bode:{title:'O Corno Amaldiçoado',text:'O bode era o bode expiatório dos homens — levava a culpa de tudo. Sussurrei a ele que era hora de cobrar. Agora cada cornada é um julgamento. Você vai pagar pelos pecados dos outros, herói.'},
    carneiro:{title:'A Lã Ensanguentada',text:'O carneiro era manso, seguia o rebanho. Enchi sua cabeça com fúria cega. Agora ele tromba até quebrar — e o rebanho o segue. Ele é o pastor do inferno. Você é a ovelha desgarrada.'},
    cavalo_selvagem:{title:'O Corcel Sem Dono',text:'O cavalo selvagem nunca aceitou sela. Apreciei isso. Mas eu o ensinei a odiar quem tenta montá-lo. Agora ele pisa em tudo que se aproxima. Sente o galope, herói? É a tua sentença.'},
    touro_bravo:{title:'O Furioso do Curral',text:'O touro era a força bruta da fazenda. Sussurrei a ele que era hora de virar caçador. Agora ele persegue sem trégua. Seu chifre atravessa armaduras. Você tem coragem, herói? Ou vai correr?'},
    mula:{title:'O Relincho da Noite',text:'Relincho de dor… este é meu destino? Anhangá me mostrou que minha maldição pode ser minha força. Agora levarei fogo e dor a todos! Cada relincho meu é uma sentença. Sente, herói — a maldição se aproxima.'}
};

// =================================================================
// 💬 DIÁLOGOS — ATO 6 (Corpo Seco)
// =================================================================
const STORY_ENEMY_INTROS_A6 = {
    urubu:{title:'A Sombra do Céu',text:'O urubu sempre esperou a morte dos outros. Enchi sua paciência com fome ativa. Agora ele não espera — ele provoca. Sente o bater de asas? Ele já te marcou. Você é o próximo banquete.'},
    carcaara:{title:'A Lâmina Voadora',text:'O carcará é o predador dos predadores. Sussurrei a ele que os vivos são mais saborosos que os mortos. Agora ele caça em pleno dia. Sua sombra passa rápido — e a morte vem com ela.'},
    tatu:{title:'A Armadura Cavadora',text:'O tatu sempre se escondeu sob a terra. Ensinei a ele que o solo é seu trono. Agora ele cava armadilhas que engolem exércitos. Cada passo seu é um passo sobre o abismo. Cuidado, herói.'},
    lobo_guara:{title:'O Uivo da Solidão',text:'O lobo-guará uiva sozinho por natureza. Transformei sua solidão em raiva. Agora ele uiva chamando a morte — e ela vem. Você ouve o uivo, herói? Corre. Ele já te viu.'},
    corpo_seco:{title:'O Devorador de Almas',text:'Fome… tanta fome… Anhangá me prometeu que se eu devorasse tudo, minha fome seria saciada. Vou devorar suas almas! Cada osso seu vai ser meu troféu. Cada gota de sangue, meu vinho. Vem, herói — alimenta-me.'}
};

// =================================================================
// 💬 DIÁLOGOS — ATO 7 (Lobisomem)
// =================================================================
const STORY_ENEMY_INTROS_A7 = {
    cachorro_mato:{title:'O Primeiro Uivo',text:'O cachorro-do-mato era apenas um caçador comum. Sussurrei a ele que a lua o observava. Agora ele uiva para ela toda noite, pedindo poder. E ela responde. Você ouve o primeiro uivo, herói? É o começo da matilha.'},
    raposa:{title:'A Astuta Sedenta',text:'A raposa sempre foi esperta demais. Enchi sua astúcia com sede de sangue. Agora ela engana antes de matar — te faz rir antes do golpe. Você ri, herói? Aqui, os espertos choram.'},
    guaxinim:{title:'O Ladrão da Noite',text:'O guaxinim roubava comida dos acampamentos. Sussurrei a ele que roubar vidas era mais valioso. Agora ele invade sonhos antes de invadir corpos. Você dorme tranquilo, herói? Aqui, não.'},
    jaguatirica:{title:'A Caçadora Silenciosa',text:'A jaguatirica é a rainha dos saltos — mata antes do alvo piscar. Enchi seu silêncio com fome. Agora ela salta mais longe, mais alta, mais mortal. Sente o vento? Não é vento. É ela pulando.'},
    lobisomem:{title:'A Maldição da Lua',text:'A lua me amaldiçoa… mas Anhangá me mostrou que esta forma bestial é minha verdadeira natureza. Deixem a fera dentro de mim se libertar! Cada uivo meu quebra a noite. Você está pronto, herói? A lua está cheia.'}
};

// =================================================================
// 💬 DIÁLOGOS — ATO 8 (Cuca)
// =================================================================
const STORY_ENEMY_INTROS_A8 = {
    morcego:{title:'O Filho da Noite',text:'O morcego sempre viveu nas sombras. Sussurrei a ele que a escuridão era um lar, não um esconderijo. Agora ele voa livre, drenando sonhos antes de sangue. Você sonha, herói? Aqui, até os sonhos sangram.'},
    coruja:{title:'O Olho da Bruxa',text:'A coruja sempre soube tudo — a sabedoria silenciosa da noite. Envenenei seu conhecimento com vaidade. Agora ela observa só para julgar. E a bruxa vê através dela. Ela já te julgou, herói.'},
    sapo_cururu:{title:'A Poção Viva',text:'O sapo-cururu é veneno ambulante. Sussurrei a ele que o veneno é sua coroa. Agora tudo que toca seu lodo, morre. Cuidado com o chão que pisa, herói. O pântano está vivo.'},
    seriema:{title:'A Guardiã do Caldeirão',text:'A seriema vigia os campos há séculos. Corrompi seu instinto guardião. Agora ela protege o caldeirão como se fosse um filho. Ninguém passa. Nem você.'},
    cuca:{title:'A Bruxa da Floresta',text:'Meus conhecimentos eram fracos… poções de cura? Para quê? Anhangá me ensinou que apenas a destruição traz poder real. Prove minhas novas poções! Cada frasco meu carrega a essência do abismo.'}
};

// =================================================================
// 💬 DIÁLOGOS — ATO 9 (Boto)
// =================================================================
const STORY_ENEMY_INTROS_A9 = {
    tucunare:{title:'O Rei do Rio',text:'O tucunaré reina nas águas claras. Sussurrei a ele que seu trono é frágil. Agora ele morde antes que outro peixe respire. Cada mordida é defesa de território. Você é invasor, herói. Ele odeia invasores.'},
    piraiba:{title:'O Fantasma das Profundezas',text:'A piraíba é o maior peixe de couro do rio — o fantasma das profundezas. Envenenei sua solidão com fúria. Agora ela emerge do nada e engole barcos. Sente o rio se agitando, herói? Ela está perto.'},
    dourada:{title:'O Tesouro Maldito',text:'A dourada brilha como ouro nas águas. Sussurrei a ela que o brilho era poder. Agora ela cega quem a olha, e ataca no reflexo. Você olha o rio, herói? Não olhe demais. Ela já te cegou.'},
    peixe_boi:{title:'A Muralha Viva',text:'O peixe-boi é o gigante manso dos rios. Corrompi sua calma. Agora ele esmaga com o peso de um mundo. Sua paciência virou concreto. Você tem força, herói? Vai precisar.'},
    boto:{title:'O Sedutor das Águas',text:'As águas eram meu refúgio… minha beleza, minha arma. Anhangá mostrou que posso ser mais que um sedutor. Posso ser um destruidor! Sintam o poder das águas corrompidas! Venham, heróis — dancem no meu encanto final.'}
};

// =================================================================
// 💬 DIÁLOGOS — ATO 10 (Boi)
// =================================================================
const STORY_ENEMY_INTROS_A10 = {
    bufalo:{title:'O Titã Negro',text:'O búfalo é a montanha viva dos campos. Sussurrei a ele que o pasto é pequeno demais. Agora ele esmaga cercas, casas, homens. Sente o chão tremer? Não é terremoto, herói. É ele.'},
    vaca_louca:{title:'A Lamentação',text:'A vaca louca é a tristeza feita carne. Transformei seu lamento em fúria. Agora cada mugido é um grito de guerra. Você ouve o grito, herói? Ele vem por você.'},
    cabra_preta:{title:'A Portadora do Azar',text:'A cabra preta sempre foi vista como mau agouro. Sussurrei a ela que o agouro é poder. Agora cada passo dela envenena a terra. Você anda sobre a morte, herói.'},
    zebu:{title:'O Touro de Mil Guerras',text:'O zebu carrega força de impérios. Envenenei sua paciência com arrogância. Agora ele marra sem parar. Cada chifre é uma sentença. Você é rápido, herói? Aqui, os lentos viram couro.'},
    boi:{title:'O Terrível das Sombras',text:'Minha face escura sempre assustou… mas era apenas casca. Anhangá me revelou meu verdadeiro poder: o terror puro! Sintam o medo que habita nas sombras! Cada mugido meu é a última coisa que muitos ouvem.'}
};

// =================================================================
// 💬 DIÁLOGOS — ATO 11 (Jaci)
// =================================================================
const STORY_ENEMY_INTROS_A11 = {
    gato_mato:{title:'O Filho da Mata Fria',text:'O gato-do-mato é silêncio puro. Envenenei seu silêncio com malícia. Agora ele caça entre as sombras — sempre entre as sombras. Sente seu olhar, herói? Ele está a um salto de distância.'},
    mariposa_gigante:{title:'A Asa Lunar',text:'A mariposa gigante sempre buscou a lua. Sussurrei a ela que a lua também a buscava. Agora ela voa em noites sem fim, espalhando pó lunar que enlouquece. Você respira o pó, herói? Já é tarde.'},
    quati:{title:'O Bando Vermelho',text:'O quati vive em bando, esperto e barulhento. Transformei seu bando em matilha. Agora eles atacam em círculo, fechando o cerco. Você está no centro, herói. Sempre esteve.'},
    sucuarana:{title:'A Senhora das Alturas',text:'A suçuarana — a puma — é a rainha silenciosa das montanhas. Corrompi seu silêncio com arrogância divina. Agora ela caminha como se fosse um deus. Cada passo dela marca território. Você invade o dela.'},
    jaci:{title:'A Deusa da Lua Corrompida',text:'Minha luz deveria guiar… acalmar… iluminar. Mas Anhangá mostrou que minha luz pode queimar em vez de iluminar. Sintam o frio ardente da lua corrompida! Cada raio meu carrega a solidão de mil sóis apagados.'}
};

// =================================================================
// 💬 DIÁLOGOS — ATO 12 (Guaraci)
// =================================================================
const STORY_ENEMY_INTROS_A12 = {
    gaviao:{title:'O Caçador do Céu',text:'O gavião reina nos ares. Envenenei sua visão de longo alcance com presunção. Agora ele caça pela glória, não pela fome. Cada voo dele é um desafio ao sol. Você olha pra cima, herói? Boa sorte.'},
    falcao:{title:'O Mergulhador Mortal',text:'O falcão é o caçador mais rápido do céu. Sussurrei a ele que a velocidade é um deus. Agora ele mergulha com fé cega — sem pensar, apenas matando. Sente o vento rasgando? Ele já caiu sobre você.'},
    urutau:{title:'A Ave Fantasma',text:'O urutau é o mestre do disfarce — parece um tronco, canta como um lamento. Transformei seu disfarce em ilusão real. Agora ele existe e não existe ao mesmo tempo. Você vê, herói? Ele já te confundiu.'},
    aguia_cinzenta:{title:'A Águia do Trono',text:'A águia-cinzenta é o símbolo dos reis. Corrompi sua soberania com vaidade eterna. Agora ela considera cada um de vocês seu súdito. Você não se ajoelha, herói? Então ela virá buscar seu tributo.'},
    guaraci:{title:'O Sol Devorador',text:'Meu sol aquecia… nutria… dava vida. Anhangá me ensinou que meu verdadeiro poder é queimar, não aquecer. Sintam o inferno solar que agora trago! Cada raio meu destrói em vez de criar. Abençoados são aqueles que não veem meu amanhecer.'}
};

// =================================================================
// 💬 DIÁLOGOS — ATO 13 (Anhangá + Espectros)
// =================================================================
const STORY_ENEMY_INTROS_A13 = {
    saci:{title:'O Espectro do Redemoinho',text:'Você o libertou uma vez. Eu o reconsumi. A casca que gira agora é apenas eco do que ele foi. Cada servo que você purificou, eu reassimilei. Você não enfrenta doze bosses, herói. Enfrenta a soma de tudo que já venceu.'},
    mapinguari:{title:'O Espectro do Devorador',text:'O Pilar da Mata voltou a ser devorador. Sua força purificada me alimenta agora. Você não pode vencer o que já venceu — porque agora é maior.'},
    iara:{title:'O Espectro do Canto',text:'A sedutora canta novamente. Mas agora ela canta para MIM. Cada nota afoga mais fundo. A água que a purificou agora é minha.'},
    boitata:{title:'O Espectro do Fogo',text:'A Serpente de Fogo queimou para você uma vez. Agora ela queima para MIM. Sua luz não ilumina mais — apenas destrói.'},
    mula:{title:'O Espectro do Relincho',text:'A maldição dela agora é minha. Cada relincho é um chamado do abismo. Você não purificou nada — apenas me deu uma arma a mais.'},
    corpo_seco:{title:'O Espectro da Fome',text:'A fome do Corpo Seco era pequena. Eu a tornei infinita. Ele devora almas que você ainda nem conhece.'},
    lobisomem:{title:'O Espectro da Lua',text:'A maldição que você quebrou, eu refiz. A lua agora é minha aliada. A fera está solta de novo — e dessa vez, para sempre.'},
    cuca:{title:'O Espectro das Poções',text:'As poções dela eram fracas. Eu as tornei veneno puro. Cada frasco carrega a essência do abismo.'},
    boto:{title:'O Espectro do Encanto',text:'O encanto dele agora é meu. Cada sorriso esconde uma lâmina. Você cai no feitiço, herói? Todos caem.'},
    boi:{title:'O Espectro do Terror',text:'O terror dele era apenas casca. Eu o tornei real. A cara preta agora é a face do abismo.'},
    jaci:{title:'O Espectro da Lua Fria',text:'A lua dela agora é minha. Seu brilho é a última coisa que muitos veem. Você olha pra lua, herói? É a minha lua.'},
    guaraci:{title:'O Espectro do Sol Negro',text:'O sol dele agora é meu. Amanhecer? Não existe mais. Só a noite eterna que eu trago.'},
    anhanga:{title:'O Senhor do Abismo',text:'Por séculos observei a destruição que vocês, mortais, causam. Florestas queimadas, rios poluídos, ar contaminado… A natureza grita por vingança! Eu apenas dei voz ao seu ódio. Aqueles que corrompi eram apenas ferramentas. E agora, com o poder das doze entidades que você "purificou", eu me tornei completo. Venha, herói. Enfrente a soma de todos os seus erros.'}
};

// =================================================================
// 💬 DIÁLOGOS FINAIS
// =================================================================
const STORY_FINAL_DIALOGS = {
    saci:{title:'A Libertação do Redemoinho',text:'O vendaval cessa… e algo mais profundo se quebra. Não era só a mim que prendiam — era ELE. O Sussurrador. Anhangá. Enquanto eu girava, ele ria por dentro de mim. Manipulava cada servo, cada bicho, cada sussurro que eu pensava ser meu. Obrigado… por me devolver o silêncio. Agora eu sei quem sou. Agora a mata pode respirar de novo.'},
    mapinguari:{title:'A Libertação do Devorador',text:'Minha fome… para. Minha boca… se fecha. Tudo que engoli, tudo que destruí — Anhangá ria por trás de cada mordida. Ele me disse que a floresta morria por minha fraqueza, e eu acreditei. Eu, o pilar da mata, virei ruína por dentro. Você me devolveu a fome que importa: a de proteger. Obrigado, herói. A mata fechada vai voltar a respirar.'},
    iara:{title:'A Libertação das Águas',text:'Minhas águas… voltam a ser claras. Sinto o peso da raiva sumir do meu peito, e as canções que eu cantava pra afogar tornam-se canções de acalanto. Anhangá me envenenou com a dor que era minha — mas a dor não era minha, era dele. Você me devolveu o rio. Obrigada, herói. As águas vão lembrar de você.'},
    boitata:{title:'A Libertação do Fogo',text:'Meu fogo… se acalma. Não mais inferno, não mais consumo. Eu era luz — luz que protegia a mata na noite escura. Anhangá me disse que luz fraca não serve. Mentiu. Você me mostrou que minha luz é suficiente. Obrigado, herói. Volto a ser a serpente que brilha no escuro.'},
    mula:{title:'A Libertação da Maldição',text:'Meu relincho… silencia. A dor de mil anos se desfaz em cinzas mansas. Anhangá me disse que era meu castigo por meus pecados, mas era o castigo dele que eu carregava. Você me tirou o fogo dos olhos e devolveu a mim o que eu era antes da maldição. Obrigada, herói. A noite já não é tão escura.'},
    corpo_seco:{title:'A Libertação da Fome',text:'Minha fome… para. Sinto o silêncio da saciedade que nunca tive. Anhangá me prometeu que devorar tudo saciaria meu vazio — mas o vazio era dele, não meu. Você me libertou da fome eterna. Agora posso finalmente descansar. Obrigado, herói. A terra vai me acolher em paz.'},
    lobisomem:{title:'A Libertação da Lua',text:'A lua… não me amaldiçoa mais. Sinto meu corpo voltar a ser humano, e a fera dentro de mim dorme em paz. Anhangá me prometeu que a fera era minha verdadeira natureza — mentiu. A fera era a dor dele, projetada em mim. Você me devolveu a humanidade. Obrigado, herói. A lua agora é apenas lua.'},
    cuca:{title:'A Libertação das Poções',text:'Meu caldeirão… esfria. As poções voltam a ser o que eram: cura, não veneno. Anhangá me ensinou que destruir era poder. Mentiu. Você me devolveu a sabedoria. Obrigada, herói. A bruxa volta a ser guardiã — não destruidora.'},
    boto:{title:'A Libertação do Encanto',text:'Meu canto… volta a ser melodia, não armadilha. Anhangá me disse que o encanto era fraqueza. Mentiu. Você me mostrou que encantar sem destruir é a verdadeira força. Obrigado, herói. As águas doces voltarão a ser lar.'},
    boi:{title:'A Libertação do Terror',text:'Minha cara preta… volta a ser apenas um rosto. Não mais o rosto do medo. Anhangá me mostrou o terror como poder — mas era a minha dor que ele mostrava. Você me devolveu o rosto. Obrigado, herói. O pasto vai dormir em paz.'},
    jaci:{title:'A Libertação da Lua Fria',text:'Minha luz… recupera o calor. Não sou mais a lua que queima — volto a ser a lua que acolhe. Anhangá me envenenou com a solidão dele. Você me devolveu o silêncio da noite. Obrigada, herói. As estrelas vão brilhar de novo.'},
    guaraci:{title:'A Libertação do Sol',text:'Meu fogo… aquece de novo em vez de queimar. Sinto o calor voltar a ser bênção, não maldição. Anhangá me ensinou que a arrogância era poder. Mentiu. Você me devolveu a humildade do sol. Obrigado, herói. O amanhecer vai ser doce outra vez.'},
    anhanga:{title:'O Fim do Abismo',text:'O véu de escuridão… se rasga. Não era eu que girava o redemoinho — era o vazio dentro de mim. As doze entidades que você libertou, você libertou de MIM também. Eu as usei, mas elas nunca foram minhas. Você as resgatou duas vezes, herói. A primeira, das minhas garras. A segunda, de si mesmas. A mata, o rio, o céu, o sol — tudo respira de novo. E eu… eu volto ao silêncio de onde nunca deveria ter saído. Obrigado. O equilíbrio retorna.'}
};

// =================================================================
// 📖 MENSAGENS DE PURIFICAÇÃO
// =================================================================
const STORY_PURIFICATION = {
    porco_espinho:'O redemoinho que prendia o porco-espinho se desfaz em fumaça dourada. Ele não está morto — apenas livre. Ele te encara uma última vez, como se agradecesse, antes de correr de volta para a mata.',
    jacare:'A água escura que envolvia o jacaré recua de volta para o rio. Ele pisca, tonto, e depois desliza manso pela correnteza — o mesmo jacaré de antes do sussurro. Ele está livre.',
    cervo:'A sombra que cobria a cabeça do cervo se despedaça em luz. Ele sacode os chifres, inala o ar limpo, e parte num salto leve entre as árvores. Você não o matou — devolveu-lhe a liberdade.',
    onca_parda:'A onça-parda cai de lado, e a raiva em seus olhos se apaga. Ela ergue a cabeça, olha para você — não como inimiga, mas como quem acorda de um pesadelo. Depois, some na mata. A caçadora voltou a ser dela mesma.',
    saci:'O redemoinho se desfaz lentamente. O Saci cai no chão, tonto. Quando se levanta, seus olhos estão claros pela primeira vez em muito tempo. "O que… o que eu fiz?", ele murmura. Não era ele. Nunca foi ele. Você não o matou — libertou-o do Anhangá.',
    tamandua:'A sombra que cobria o tamanduá se despedaça em luz. Ele para de furar o chão com fúria e ergue o focinho — cheirando o ar puro pela primeira vez em muito tempo. Depois, caminha manso de volta pra mata fechada. Livre.',
    anta:'O peso sobrenatural que prendia a anta se dissolve. Ela balança a cabeça enorme, respira fundo, e segue em passo firme — não pra atropelar, mas pra abrir caminho como sempre fez. A muralha viva voltou a ser dela mesma.',
    queixada:'A fúria coletiva que envolvia o queixada se desfaz. Ele para de rilhar os dentes, sacode a juba, e desaparece no mato com um grunhido grave — não de raiva, mas de alívio. A manada respira de novo.',
    sucuri:'A correnteza escura que aprisionava a sucuri recua. Ela desliza lentamente de volta pra água, sem pressa, sem fome cega. Só uma cobra grande, respeitando o rio como sempre respeitou. Livre.',
    mapinguari:'O gigante cai de joelhos. A boca que devorava tudo se fecha, e por um instante o silêncio é absoluto — até que ele fala, com uma voz que não se ouvia há muito tempo. Não era ele. Nunca foi. Você devolveu ao Pilar da Mata o direito de proteger.',
    piranha:'O cardume se acalma. As piranhas param de ferver a água e voltam a nadar em paz. A primeira mandíbula que Anhangá corrompeu volta a ser apenas peixe.',
    lontra:'A lontra para de arrastar para o fundo. Ela pisca, volta a rir, e mergulha brincando como sempre deveria ter feito. A alegria do rio voltou.',
    ariranha:'A matilha do fundo se desfaz. As ariranhas voltam a caçar apenas por fome, e não por prazer. O vermelho dos olhos se apaga. A água respira de novo.',
    pirarucu:'O gigante das águas fundas emerge devagar. Ele reconhece você como aliado, e se afasta manso, deixando o caminho livre. O trono submerso de Anhangá desmorona.',
    iara:'As águas se acalmam. Iara ergue-se da correnteza, o cabelo molhado, o olhar sereno. Ela olha para você — não com raiva, mas com gratidão silenciosa. O canto dela volta a ser acalanto. Obrigada, herói.',
    cascavel:'O chocalho silencia. A cascavel se enrola devagar, e o aviso volta a ser justo — não mais surdo. A serpente se afasta para as pedras. Ela era justa antes, e volta a ser.',
    coral:'As cores da coral ficam vivas de novo, mas sem veneno — só beleza. Ela se enrola calma e dorme. A mentira colorida volta a ser apenas verdade disfarçada.',
    jararaca:'A jararaca pisca devagar. A traição de Anhangá sai dos olhos dela, e ela volta a ser apenas o bicho do mato. Traiçoeira por instinto, não por maldade.',
    tartaruga:'O casco antigo respira fundo. A tartaruga solta um suspiro de séculos, e o peso da fúria ancestral some. Ela te olha com gratidão de milênios, e caminha devagar para as sombras.',
    boitata:'O fogo volta a brilhar manso. A serpente de luz se enrola no ar, e a floresta respira. Ela volta a iluminar em vez de queimar. A luz da noite voltou.',
    bode:'O bode sacode os chifres. O peso de carregar culpa some, e ele volta a pastar tranquilo. O bode expiatório virou apenas bode.',
    carneiro:'A lã para de brilhar vermelho. O carneiro tromba uma última vez no vazio, e depois se acalma. Ele segue o rebanho por escolha, não por maldição.',
    cavalo_selvagem:'O galope cessa. O cavalo baixa a cabeça, respira fundo, e volta a correr livre pelos campos — sem ódio, só velocidade. O corcel sem dono voltou a ser livre de verdade.',
    touro_bravo:'O touro baixa os chifres e, por um instante, parece refletir. Depois ele se afasta em passo firme, em direção à pastagem. O furioso do curral voltou a ser só touro.',
    mula:'O fogo do relincho se apaga em faíscas mansas. A Mula sem Cabeça desaparece, e no lugar dela, por um instante, você vê uma mulher livre — que te agradece em silêncio antes de partir. A maldição foi quebrada.',
    urubu:'A sombra do céu pousa no chão, e o urubu volta a ser apenas pássaro. A paciência dele volta a ser paciência — não fome ativa. A morte espera de novo, sem pressa.',
    carcaara:'O carcará pousa manso. O dia volta a ser apenas dia, e não caçada. Ele olha o horizonte e voa para longe. A lâmina voadora guardou a lâmina.',
    tatu:'A terra se fecha sob o tatu. Ele emerge devagar, tonto, e volta a cavar apenas tocas — não armadilhas. A armadura cavadora voltou a ser só bicho.',
    lobo_guara:'O uivo silencia. O lobo-guará fica parado, olhando a lua por um instante. Depois ele uiva uma última vez — agora um uivo de paz — e desaparece no cerrado.',
    corpo_seco:'A fome cessa. Os ossos do Corpo Seco se desfazem devagar em pó dourado, e no lugar deles resta apenas o silêncio de uma alma que finalmente encontra descanso. A terra o acolhe.',
    cachorro_mato:'O cachorro-do-mato para de uivar. Ele te olha, abana a cauda, e some entre as árvores. O primeiro uivo se desfaz na noite. A matilha respira.',
    raposa:'A raposa para de sorrir com malícia. Ela te encara, astuta mas calma, e some na mata com um salto elegante. A astúcia voltou a ser qualidade, não arma.',
    guaxinim:'A máscara escura sai dos olhos do guaxinim. Ele pisca, sacode a cabeça, e foge pra toca. Os sonhos voltam a ser só sonhos. Ninguém mais sangra dormindo.',
    jaguatirica:'A jaguatirica pousa no chão e fica imóvel por um instante. Depois ela ergue a cabeça, te olha sem fúria, e salta para longe — para a mata dela. A caçadora voltou a caçar por fome.',
    lobisomem:'A lua prateia o corpo dele enquanto ele se ergue numa forma humana esquecida. Cai de joelhos, exausto, e a maldição se desfaz como orvalho ao amanhecer. Ele ergue os olhos pra você — e agradece.',
    morcego:'O morcego pousa manso. A escuridão volta a ser só escuridão. Os sonhos param de sangrar. O filho da noite voltou a ser apenas noite.',
    coruja:'A coruja pisca devagar, e a sabedoria volta a ser sabedoria. Sem vaidade, sem julgamento. Ela te observa por um instante e voa. A bruxa perdeu os olhos dela.',
    sapo_cururu:'O lodo do sapo-cururu perde o veneno. Ele pula pra longe, voltando a ser só bicho do pântano. O chão respira de novo. A poção viva voltou a ser só vida.',
    seriema:'A seriema para de proteger o caldeirão. Ela olha o céu, dá um grito de liberdade, e corre pra longe. A guardiã voltou a ser apenas ave.',
    cuca:'O caldeirão se parte em mil pedaços, e as poções que derrama se transformam em ervas curativas sobre o solo. A velha bruxa desmorona em folhas secas, liberta de sua própria corrupção. Ela te olha por um instante — grata — antes de desaparecer.',
    tucunare:'O tucunaré para de morder. Ele nada calmo, redesenhando o próprio território com paciência. O rei do rio voltou a reinar em paz.',
    piraiba:'A piraíba emerge devagar e fica imóvel por um instante — como se te visse pela primeira vez como aliado. Depois ela mergulha, e o rio se acalma. O fantasma das profundezas voltou às sombras.',
    dourada:'O brilho dourado para de cegar. A dourada nada manso, apenas bela. O tesouro voltou a ser apenas peixe.',
    peixe_boi:'O peixe-boi solta um suspiro grave. Ele te olha com gratidão e se afasta lentamente, devolvendo o rio ao seu curso. A muralha viva voltou a ser bênção.',
    boto:'Ele se despede com um sorriso triste e mergulha no rio. Quando ressurge, não é mais um sedutor, mas um guardião silencioso das águas — a beleza que sempre deveria ter sido sua. As águas doces voltaram a ser lar.',
    bufalo:'O titã negro baixa a cabeça. O chão para de tremer. Ele se afasta em passo firme, voltando a ser só búfalo — e não montanha viva.',
    vaca_louca:'O mugido vira apenas mugido. A vaca para no meio do pasto, olha o céu, e pasta mansamente. A lamentação virou silêncio.',
    cabra_preta:'O agouro se desfaz. A cabra preta balança a cabeça, e o chão volta a ser apenas terra. O azar voltou a ser superstição.',
    zebu:'O zebu finalmente para de marrar. Ele respira fundo, te encara com respeito, e se afasta lentamente. A paciência voltou a ser paciência.',
    boi:'A face escura se dilui em névoa, revelando olhos serenos que finalmente encontram paz. Ele retorna à terra, devolvido ao seu papel de protetor das noites. O terror foi só casca.',
    gato_mato:'O gato-do-mato para de te espreitar. Ele pisca, sem pressa, e desaparece nas sombras — mas agora são apenas sombras. A mata fria respira.',
    mariposa_gigante:'A mariposa para de voar em círculos. Ela pousa numa pedra, e o pó lunar deixa de enlouquecer — volta a ser só pó. A lua voltou a ser apenas luz.',
    quati:'O bando para de fechar o cerco. Os quatis se dispersam, voltando a ser apenas bando. Você pode sair do centro. Você sempre pôde.',
    sucuarana:'A senhora das alturas para no meio do caminho. Ela te olha sem desafio, e retoma o passo em direção às montanhas — sem pressa, sem soberba. Ela voltou a ser a puma.',
    jaci:'Seu brilho frio recupera o calor perdido. Ela sobe lentamente ao céu, iluminando novamente o mundo com a luz que sempre deveria ter sido sua — acalanto, não queimadura. A noite voltou a ser doce.',
    gaviao:'O gavião pousa numa pedra alta. A presunção sai dos olhos dele. Ele bate as asas e voa pro horizonte — caçando pela fome, não pela glória. O céu voltou a ser só céu.',
    falcao:'O falcão freia no meio do ar. Ele paira por um instante, te olha, e depois voa calmo. A velocidade voltou a ser ferramenta, não deus.',
    urutau:'A ilusão se desfaz. O urutau volta a existir de verdade — pássaro, não fantasma. Ele canta uma última vez, e agora o canto é só canto.',
    aguia_cinzenta:'A águia pousa no chão, num gesto de humildade. Ela dobra as asas e te cumprimenta com a cabeça. A soberania voltou a ser símbolo, não tirania.',
    guaraci:'As chamas que o consumiam se rendem ao amanhecer. Ele retorna ao horizonte como o sol gentil que sempre foi, purificado da arrogância que o cegou. O sol voltou a aquecer.',
    espectro_saci:'A casca espectral se desfaz. O verdadeiro Saci, em paz, aparece por um instante antes de desaparecer. Ele te agradece com os olhos. O eco voltou ao silêncio.',
    espectro_mapinguari:'O espectro do Pilar se desfaz em folhas verdes que caem sobre você como bênção. A mata reconhece seu libertador.',
    espectro_iara:'O espectro mergulha e se dissolve em água limpa. As águas doces fluem de novo. A canção voltou a acalantar.',
    espectro_boitata:'O espectro se transforma em luz mansa. A serpente de fogo desaparece, deixando apenas o brilho da proteção antiga. A floresta respira.',
    espectro_mula:'O espectro relincha uma última vez — mas agora é de alívio. Ele se desfaz, e a mulher livre que você libertou antes aparece brevemente para agradecer.',
    espectro_corposeco:'O espectro se dissolve em pó claro. A alma que finalmente descansou retorna para acenar. A fome terminou de verdade.',
    espectro_lobisomem:'O espectro volta à forma humana que você libertou. Ele te encara com gratidão e desaparece na luz da lua. A maldição foi quebrada para sempre.',
    espectro_cuca:'O espectro se desfaz em folhas. A bruxa velha, em paz, te cumprimenta. O caldeirão nunca mais ferverá ódio.',
    espectro_boto:'O espectro do sedutor se despede com um sorriso gentil. Ele mergulha e some. As águas voltaram a ser só águas.',
    espectro_boi:'O espectro da cara preta se desfaz em névoa mansa. Os olhos serenos que você libertou aparecem por um instante e agradecem.',
    espectro_jaci:'O espectro da lua corrompida se dissolve em luz prateada pura. A deusa, em paz, sobe ao céu pela última vez. O céu voltou a ser dela.',
    espectro_guaraci:'O espectro do sol devorador se desfaz no amanhecer verdadeiro. Guaraci, em paz, volta ao horizonte. O dia voltou a ser doce.',
    anhanga:'O Senhor do Abismo se dissolve em névoa. As doze entidades, agora plenamente livres, brilham por um instante ao redor de você antes de voltarem aos seus postos. A mata, o rio, o céu, o sol — tudo respira. O equilíbrio retorna. Você venceu.'
};

// =================================================================
// 👹 STORY_ENEMIES — Animais + bosses
// =================================================================
const STORY_ENEMIES = {
    porco_espinho: {id:'porco_espinho',name:'Porco-Espinho',hp:10,atk:2,skill1:{name:'Espinhos Erguidos',handler:'porco_espinho_espinhos'},skill2:{name:'Bote Rolante',handler:'porco_espinho_bote'}},
    jacare: {id:'jacare',name:'Jacaré',hp:12,atk:2,skill1:{name:'Bocada',handler:'jacare_bocada'},skill2:{name:'Giro de Cauda',handler:'jacare_giro'}},
    cervo: {id:'cervo',name:'Cervo',hp:12,atk:2,skill1:{name:'Investida',handler:'cervo_investida'},skill2:{name:'Chifrada',handler:'cervo_chifrada'}},
    onca_parda: {id:'onca_parda',name:'Onça-Parda',hp:20,atk:3,skill1:{name:'Garra Dupla',handler:'onca_garra_dupla'},skill2:{name:'Salto Mortal',handler:'onca_salto'}},
    saci: {id:'saci',name:'Saci',hp:30,atk:4,isBoss:true,skill1:{name:'Vórtices de Vento',handler:'saci_vortices'},skill2:{name:'Vórtices Diagonais',handler:'saci_diagonais'}},
    tamandua: {id:'tamandua',name:'Tamanduá-Bandeira',hp:14,atk:2,skill1:{name:'Garras Longas',handler:'tamandua_garras'},skill2:{name:'Bicada Perfurante',handler:'tamandua_bicada'}},
    anta: {id:'anta',name:'Anta',hp:20,atk:3,skill1:{name:'Pisada Pesada',handler:'anta_pisada'},skill2:{name:'Atropelamento',handler:'anta_atropelamento'}},
    queixada: {id:'queixada',name:'Queixada',hp:18,atk:3,skill1:{name:'Mordida em Linha',handler:'queixada_mordida'},skill2:{name:'Estouro de Manada',handler:'queixada_estouro'}},
    sucuri: {id:'sucuri',name:'Sucuri Gigante',hp:28,atk:3,isMiniBoss:true,skill1:{name:'Bocarra',handler:'sucuri_bocarra'},skill2:{name:'Caudada',handler:'sucuri_caudada'}},
    mapinguari: {id:'mapinguari',name:'Mapinguari',hp:40,atk:4,isBoss:true,skill1:{name:'Mordida Poderosa',handler:'mapinguari_mordida'},skill2:{name:'Pedras Rolantes',handler:'mapinguari_pedras'}},
    piranha: {id:'piranha',name:'Piranha',hp:12,atk:2,skill1:{name:'Cardume',handler:'piranha_cardume'},skill2:{name:'Frenesi',handler:'piranha_frenesi'}},
    lontra: {id:'lontra',name:'Lontra',hp:16,atk:2,skill1:{name:'Garras Aquáticas',handler:'lontra_garras'},skill2:{name:'Nado Veloz',handler:'lontra_nado'}},
    ariranha: {id:'ariranha',name:'Ariranha',hp:18,atk:3,skill1:{name:'Matilha Aquática',handler:'ariranha_matilha'},skill2:{name:'Bote do Rio',handler:'ariranha_bote'}},
    pirarucu: {id:'pirarucu',name:'Pirarucu',hp:26,atk:3,isMiniBoss:true,skill1:{name:'Bocarra',handler:'pirarucu_bocarra'},skill2:{name:'Caudada',handler:'pirarucu_caudada'}},
    iara: {id:'iara',name:'Iara',hp:40,atk:4,isBoss:true,skill1:{name:'Tsunami',handler:'iara_tsunami'},skill2:{name:'Jatos d\'Água',handler:'iara_jatos'}},
    cascavel: {id:'cascavel',name:'Cascavel',hp:14,atk:2,skill1:{name:'Chocalho Ameaçador',handler:'cascavel_chocalho'},skill2:{name:'Bote Peçonhento',handler:'cascavel_bote'}},
    coral: {id:'coral',name:'Cobra-Coral',hp:14,atk:2,skill1:{name:'Anéis Coloridos',handler:'coral_aneis'},skill2:{name:'Peçonha',handler:'coral_peconha'}},
    jararaca: {id:'jararaca',name:'Jararaca',hp:18,atk:3,skill1:{name:'Bote Traiçoeiro',handler:'jararaca_bote'},skill2:{name:'Enrolar',handler:'jararaca_enrolar'}},
    tartaruga: {id:'tartaruga',name:'Tartaruga-da-Amazônia',hp:28,atk:3,isMiniBoss:true,skill1:{name:'Casco Duro',handler:'tartaruga_casco'},skill2:{name:'Pancada Pesada',handler:'tartaruga_pancada'}},
    boitata: {id:'boitata',name:'Boitatá',hp:42,atk:4,isBoss:true,skill1:{name:'Colunas de Fogo',handler:'boitata_colunas'},skill2:{name:'Explosões de Fogo',handler:'boitata_explosoes'}},
    bode: {id:'bode',name:'Bode',hp:16,atk:2,skill1:{name:'Cornada',handler:'bode_cornada'},skill2:{name:'Marrada',handler:'bode_marrada'}},
    carneiro: {id:'carneiro',name:'Carneiro Selvagem',hp:18,atk:2,skill1:{name:'Trombada',handler:'carneiro_trombada'},skill2:{name:'Pisada',handler:'carneiro_pisada'}},
    cavalo_selvagem: {id:'cavalo_selvagem',name:'Cavalo Selvagem',hp:20,atk:3,skill1:{name:'Coice',handler:'cavalo_coice'},skill2:{name:'Relincho Furioso',handler:'cavalo_relincho'}},
    touro_bravo: {id:'touro_bravo',name:'Touro Bravo',hp:30,atk:3,isMiniBoss:true,skill1:{name:'Cornada Violenta',handler:'touro_cornada'},skill2:{name:'Pisoteada',handler:'touro_pisoteada'}},
    mula: {id:'mula',name:'Mula sem Cabeça',hp:42,atk:4,isBoss:true,skill1:{name:'Relincho Flamejante',handler:'mula_relincho'},skill2:{name:'Bolas de Fogo',handler:'mula_bolas'}},
    urubu: {id:'urubu',name:'Urubu',hp:14,atk:2,skill1:{name:'Voo Rasante',handler:'urubu_voo'},skill2:{name:'Bicada',handler:'urubu_bicada'}},
    carcaara: {id:'carcaara',name:'Carcará',hp:16,atk:3,skill1:{name:'Garras Afiadas',handler:'carcara_garras'},skill2:{name:'Mergulho Mortal',handler:'carcara_mergulho'}},
    tatu: {id:'tatu',name:'Tatu',hp:18,atk:2,skill1:{name:'Casco Duro',handler:'tatu_casco'},skill2:{name:'Cavar Armadilha',handler:'tatu_cavar'}},
    lobo_guara: {id:'lobo_guara',name:'Lobo-Guará',hp:28,atk:3,isMiniBoss:true,skill1:{name:'Uivo',handler:'lobo_guara_uivo'},skill2:{name:'Bote Selvagem',handler:'lobo_guara_bote'}},
    corpo_seco: {id:'corpo_seco',name:'Corpo Seco',hp:44,atk:4,isBoss:true,skill1:{name:'Vapor Podre',handler:'corpo_seco_vapor'},skill2:{name:'Garras Rotas',handler:'corpo_seco_garras'}},
    cachorro_mato: {id:'cachorro_mato',name:'Cachorro-do-Mato',hp:16,atk:2,skill1:{name:'Mordida',handler:'cachorro_mordida'},skill2:{name:'Rosnado Feroz',handler:'cachorro_rosnado'}},
    raposa: {id:'raposa',name:'Raposa',hp:16,atk:2,skill1:{name:'Astúcia',handler:'raposa_astucia'},skill2:{name:'Bote Ágil',handler:'raposa_bote'}},
    guaxinim: {id:'guaxinim',name:'Guaxinim',hp:18,atk:3,skill1:{name:'Garras Noturnas',handler:'guaxinim_garras'},skill2:{name:'Ataque Surpresa',handler:'guaxinim_surpresa'}},
    jaguatirica: {id:'jaguatirica',name:'Jaguatirica',hp:30,atk:3,isMiniBoss:true,skill1:{name:'Garras Selvagens',handler:'jaguatirica_garras'},skill2:{name:'Salto Mortal',handler:'jaguatirica_salto'}},
    lobisomem: {id:'lobisomem',name:'Lobisomem',hp:46,atk:4,isBoss:true,skill1:{name:'Garras da Fera',handler:'lobisomem_garras'},skill2:{name:'Tremor Lunar',handler:'lobisomem_tremor'}},
    morcego: {id:'morcego',name:'Morcego',hp:14,atk:2,skill1:{name:'Voo Sombrio',handler:'morcego_voo'},skill2:{name:'Eco',handler:'morcego_eco'}},
    coruja: {id:'coruja',name:'Coruja',hp:16,atk:3,skill1:{name:'Garras Noturnas',handler:'coruja_garras'},skill2:{name:'Voo Silencioso',handler:'coruja_voo'}},
    sapo_cururu: {id:'sapo_cururu',name:'Sapo-Cururu',hp:18,atk:2,skill1:{name:'Veneno Espirrante',handler:'sapo_veneno'},skill2:{name:'Língua Pegajosa',handler:'sapo_lingua'}},
    seriema: {id:'seriema',name:'Seriema',hp:28,atk:3,isMiniBoss:true,skill1:{name:'Bicada Feroz',handler:'seriema_bicada'},skill2:{name:'Grito de Guerra',handler:'seriema_grito'}},
    cuca: {id:'cuca',name:'Cuca',hp:46,atk:5,isBoss:true,skill1:{name:'Poção Corrompida',handler:'cuca_pocao'},skill2:{name:'Poção Curativa',handler:'cuca_cura'}},
    tucunare: {id:'tucunare',name:'Tucunaré',hp:16,atk:2,skill1:{name:'Bote Aquático',handler:'tucunare_bote'},skill2:{name:'Cardume Aquático',handler:'tucunare_cardume'}},
    piraiba: {id:'piraiba',name:'Piraíba',hp:20,atk:3,skill1:{name:'Bocarra',handler:'piraiba_bocarra'},skill2:{name:'Caudada',handler:'piraiba_caudada'}},
    dourada: {id:'dourada',name:'Dourada',hp:20,atk:3,skill1:{name:'Escamas Douradas',handler:'dourada_escamas'},skill2:{name:'Nado Rápido',handler:'dourada_nado'}},
    peixe_boi: {id:'peixe_boi',name:'Peixe-Boi',hp:32,atk:3,isMiniBoss:true,skill1:{name:'Corpulência',handler:'peixe_boi_corpulencia'},skill2:{name:'Pancada na Água',handler:'peixe_boi_pancada'}},
    boto: {id:'boto',name:'Boto Rosa',hp:48,atk:5,isBoss:true,skill1:{name:'Corações Partidos',handler:'boto_coracoes'},skill2:{name:'Jatos em Cruz',handler:'boto_jatos'}},
    bufalo: {id:'bufalo',name:'Búfalo Selvagem',hp:20,atk:3,skill1:{name:'Marrada Selvagem',handler:'bufalo_marrada'},skill2:{name:'Pisoteada',handler:'bufalo_pisoteada'}},
    vaca_louca: {id:'vaca_louca',name:'Vaca Louca',hp:18,atk:3,skill1:{name:'Coice',handler:'vaca_coice'},skill2:{name:'Mugido de Fúria',handler:'vaca_mugido'}},
    cabra_preta: {id:'cabra_preta',name:'Cabra Preta',hp:16,atk:2,skill1:{name:'Cornada',handler:'cabra_cornada'},skill2:{name:'Bote Agourento',handler:'cabra_bote'}},
    zebu: {id:'zebu',name:'Zebu',hp:32,atk:4,isMiniBoss:true,skill1:{name:'Marrada Bruta',handler:'zebu_marrada'},skill2:{name:'Pisada Pesada',handler:'zebu_pisada'}},
    boi: {id:'boi',name:'Boi da Cara Preta',hp:50,atk:5,isBoss:true,skill1:{name:'Face Assustadora',handler:'boi_face'},skill2:{name:'Empurrão para as Bordas',handler:'boi_empurrao'}},
    gato_mato: {id:'gato_mato',name:'Gato-do-Mato',hp:18,atk:3,skill1:{name:'Garras Noturnas',handler:'gato_mato_garras'},skill2:{name:'Salto Silencioso',handler:'gato_mato_salto'}},
    mariposa_gigante: {id:'mariposa_gigante',name:'Mariposa Gigante',hp:16,atk:2,skill1:{name:'Pó Lunar',handler:'mariposa_po'},skill2:{name:'Voo Rasante',handler:'mariposa_voo'}},
    quati: {id:'quati',name:'Quati',hp:18,atk:3,skill1:{name:'Garras Afiadas',handler:'quati_garras'},skill2:{name:'Bote Rápido',handler:'quati_bote'}},
    sucuarana: {id:'sucuarana',name:'Suçuarana',hp:32,atk:4,isMiniBoss:true,skill1:{name:'Garra Fatal',handler:'sucuarana_garra'},skill2:{name:'Salto Mortal',handler:'sucuarana_salto'}},
    jaci: {id:'jaci',name:'Jaci',hp:50,atk:5,isBoss:true,skill1:{name:'Lua de Prata',handler:'jaci_lua'},skill2:{name:'Tempestade Lunar',handler:'jaci_tempestade'}},
    gaviao: {id:'gaviao',name:'Gavião',hp:18,atk:3,skill1:{name:'Voo Rasante',handler:'gaviao_voo'},skill2:{name:'Garras Cortantes',handler:'gaviao_garras'}},
    falcao: {id:'falcao',name:'Falcão',hp:20,atk:3,skill1:{name:'Mergulho Mortal',handler:'falcao_mergulho'},skill2:{name:'Garras do Vento',handler:'falcao_garras'}},
    urutau: {id:'urutau',name:'Urutau',hp:18,atk:3,skill1:{name:'Canto Sombrio',handler:'urutau_canto'},skill2:{name:'Voo Fantasma',handler:'urutau_voo'}},
    aguia_cinzenta: {id:'aguia_cinzenta',name:'Águia-Cinzenta',hp:34,atk:4,isMiniBoss:true,skill1:{name:'Garras Reais',handler:'aguia_garras'},skill2:{name:'Mergulho Solar',handler:'aguia_mergulho'}},
    guaraci: {id:'guaraci',name:'Guaraci',hp:52,atk:5,isBoss:true,skill1:{name:'Sol Devorador',handler:'guaraci_sol'},skill2:{name:'Onda de Calor',handler:'guaraci_onda'}},
    espectro_saci: {id:'espectro_saci',name:'Espectro do Saci',hp:10,atk:2,isSpectral:true,skill1:{name:'Vórtices Etéreos',handler:'saci_vortices'},skill2:{name:'Vórtices Diagonais',handler:'saci_diagonais'}},
    espectro_mapinguari: {id:'espectro_mapinguari',name:'Espectro do Mapinguari',hp:10,atk:2,isSpectral:true,skill1:{name:'Mordida Espectral',handler:'mapinguari_mordida'},skill2:{name:'Pedras Etéreas',handler:'mapinguari_pedras'}},
    espectro_iara: {id:'espectro_iara',name:'Espectro da Iara',hp:10,atk:2,isSpectral:true,skill1:{name:'Tsunami Espectral',handler:'iara_tsunami'},skill2:{name:'Jatos Fantasmais',handler:'iara_jatos'}},
    espectro_boitata: {id:'espectro_boitata',name:'Espectro do Boitatá',hp:10,atk:2,isSpectral:true,skill1:{name:'Colunas Etéreas',handler:'boitata_colunas'},skill2:{name:'Explosões Fantasmais',handler:'boitata_explosoes'}},
    espectro_mula: {id:'espectro_mula',name:'Espectro da Mula sem Cabeça',hp:10,atk:2,isSpectral:true,skill1:{name:'Relincho Espectral',handler:'mula_relincho'},skill2:{name:'Bolas Fantasmais',handler:'mula_bolas'}},
    espectro_corposeco: {id:'espectro_corposeco',name:'Espectro do Corpo Seco',hp:10,atk:2,isSpectral:true,skill1:{name:'Vapor Etéreo',handler:'corpo_seco_vapor'},skill2:{name:'Garras Espectrais',handler:'corpo_seco_garras'}},
    espectro_lobisomem: {id:'espectro_lobisomem',name:'Espectro do Lobisomem',hp:10,atk:2,isSpectral:true,skill1:{name:'Garras Fantasmais',handler:'lobisomem_garras'},skill2:{name:'Tremor Espectral',handler:'lobisomem_tremor'}},
    espectro_cuca: {id:'espectro_cuca',name:'Espectro da Cuca',hp:10,atk:2,isSpectral:true,skill1:{name:'Poção Etérea',handler:'cuca_pocao'},skill2:{name:'Poção Fantasmal',handler:'cuca_cura'}},
    espectro_boto: {id:'espectro_boto',name:'Espectro do Boto Rosa',hp:10,atk:2,isSpectral:true,skill1:{name:'Corações Etéreos',handler:'boto_coracoes'},skill2:{name:'Jatos Fantasmais',handler:'boto_jatos'}},
    espectro_boi: {id:'espectro_boi',name:'Espectro do Boi da Cara Preta',hp:10,atk:2,isSpectral:true,skill1:{name:'Face Etérea',handler:'boi_face'},skill2:{name:'Empurrão Espectral',handler:'boi_empurrao'}},
    espectro_jaci: {id:'espectro_jaci',name:'Espectro da Jaci',hp:10,atk:2,isSpectral:true,skill1:{name:'Lua Etérea',handler:'jaci_lua'},skill2:{name:'Tempestade Fantasmal',handler:'jaci_tempestade'}},
    espectro_guaraci: {id:'espectro_guaraci',name:'Espectro do Guaraci',hp:10,atk:2,isSpectral:true,skill1:{name:'Sol Etéreo',handler:'guaraci_sol'},skill2:{name:'Onda Fantasmal',handler:'guaraci_onda'}},
    anhanga: {id:'anhanga',name:'Anhangá',hp:60,atk:6,isBoss:true,isFinalBoss:true,skill1:{name:'Fogo Intercalado',handler:'anhanga_fogo'},skill2:{name:'Devorar Natureza',handler:'anhanga_devora'}}
};
// =================================================================
// 🎨 SLOTS DE SPRITES DE FX
// =================================================================
const STORY_FX_SPRITES = {
    spike_burst:'https://i.imgur.com/rEKf5aV.png',
    spike_roll:'https://i.imgur.com/jMfwakW.png',
    jaw_snap:'https://i.imgur.com/xSvWvNx.png',
    tail_whip:'https://i.imgur.com/H5ZbfwL.png',
    antler_charge:'https://i.imgur.com/jSLWgto.png',
    hoof_stomp:'https://i.imgur.com/SdClPec.png',
    pounce_arc:'https://i.imgur.com/23VkeNf.png',
    claw_slash:'https://i.imgur.com/23VkeNf.png',
    fang_bite:'https://i.imgur.com/LGPJ1nD.png',
    wing_gust:'https://i.imgur.com/ZLoFtuS.png',
    peck_beak:'https://i.imgur.com/9NqS6ye.png',
    coil_wrap:'https://i.imgur.com/WqNakSK.png',
    sting_venom:'https://i.imgur.com/GcHFnVX.png',
    splash_wave:'https://i.imgur.com/4kfuSUg.png',
    fin_slash:'https://i.imgur.com/HbejI8O.png',
    tentacle_glow:'',
    ground_crack:'https://i.imgur.com/z7IdFsb.png',
    shockwave:'https://i.imgur.com/9cKQQ07.png',
    fog_cloud:'https://i.imgur.com/DJIefCf.png',
    swarm_cloud:'https://i.imgur.com/6IRNOli.png',
    spectral_veil:'',
    push_arrow:'',
    pull_chain:'',
    heal_orb:'',
    tile_flip:'',
    element_pulse:'https://i.imgur.com/9Zxsavx.png',
    flame_short:'https://i.imgur.com/taNG7Pw.png',
    impact:'https://i.imgur.com/sOtm43e.png',
    heavy_slash:'',
};
// =================================================================
// 🎬 GIFs do PODER ANCESTRAL dos heróis
// -----------------------------------------------------------------
// Como funciona:
//   • Se o link estiver preenchido → usa o GIF
//   • Se o link estiver VAZIO → cai no GIF fallback (por arquétipo)
//     - Guerreiro → GIF do Tupã
//     - Mago     → GIF do Sumé
//     - Arqueiro → GIF do Caipora
//   • Heróis base (Tupã/Sumé/Caipora) usam os GIFs originais do entidades.js
//
// Como preencher:
//   Basta colar o link entre as aspas. Deixe '' (vazio) para usar o fallback.
// =================================================================
const STORY_BRAVELY_GIFS = {
    // ---- BASE (já vêm do entidades.js) ----
    'Tupa':    '',   // usa BRAVELY_TUPA original
    'Sume':    '',   // usa BRAVELY_SUME original
    'Caipora': '',   // usa BRAVELY_CAIPORA original

    // ---- GUERREIROS ----
    'Kanarott':  '',  // ← cole o link aqui
    'Teperesik': '',  // ← cole o link aqui
    'Eru':       '',  // ← cole o link aqui

    // ---- MAGOS ----
    'Anduré':          '',  // ← cole o link aqui
    'Mãe da Mata':     '',  // ← cole o link aqui
    'Pajé Anhanguera': '',  // ← cole o link aqui

    // ---- ARQUEIROS ----
    'Juruá':          '',  // ← cole o link aqui
    'Araci':          '',  // ← cole o link aqui
    'Bicho Folharal': '',  // ← cole o link aqui
    "Tapyra'yawara":  '',  // ← cole o link aqui
};

// Fallback por arquétipo (usado quando o link acima está vazio)
const STORY_BRAVELY_FALLBACK = {
    'Guerreiro': 'Tupa',
    'Mago':      'Sume',
    'Arqueiro':  'Caipora',
};

// =================================================================
// 🎬 Resolve qual GIF usar para o Bravely de um herói
// -----------------------------------------------------------------
// Prioridade:
//   1. Link em STORY_BRAVELY_GIFS (se preenchido)
//   2. Fallback por arquétipo (Guerreiro→Tupã, etc)
//   3. GIF padrão do entidades.js (BRAVELY_TUPA)
// =================================================================
function getBravelyGifForHero(heroClass) {
    // 1. Link direto na tabela?
    const direct = STORY_BRAVELY_GIFS[heroClass];
    if (direct && String(direct).trim() !== '') {
        return direct;
    }

    // 2. Heróis base → usa os GIFs originais do entidades.js
    if (heroClass === 'Tupa')   return (typeof SPRITES !== 'undefined' && SPRITES.BRAVELY_TUPA)   || '';
    if (heroClass === 'Sume')   return (typeof SPRITES !== 'undefined' && SPRITES.BRAVELY_SUME)   || '';
    if (heroClass === 'Caipora')return (typeof SPRITES !== 'undefined' && SPRITES.BRAVELY_CAIPORA)|| '';

    // 3. Fallback por arquétipo
    const heroData = (typeof STORY_HERO_CLASSES !== 'undefined') ? STORY_HERO_CLASSES[heroClass] : null;
    if (heroData && heroData.role) {
        const fallbackClass = STORY_BRAVELY_FALLBACK[heroData.role];
        if (fallbackClass && typeof SPRITES !== 'undefined') {
            const key = 'BRAVELY_' + fallbackClass.toUpperCase();
            if (SPRITES[key]) return SPRITES[key];
        }
    }

    // 4. Último recurso: GIF do Tupã
    if (typeof SPRITES !== 'undefined' && SPRITES.BRAVELY_TUPA) return SPRITES.BRAVELY_TUPA;
    return '';
}
// =================================================================
// 🎬 Override do showBravelyAnimation — usa STORY_BRAVELY_GIFS
// =================================================================
(function installStoryBravelyAnimation() {

    // Guarda o original (do entidades.js)
    const _origShowBravely = window.showBravelyAnimation;

    window.showBravelyAnimation = async function(playerClass) {
        // Fora do modo história → original
        if (!window._storyMode || !_origShowBravely) {
            return _origShowBravely.apply(this, arguments);
        }

        // Modo história → usa nossa tabela
        return new Promise((resolve) => {
            const gifUrl = getBravelyGifForHero(playerClass);

            // Se não achou nenhum GIF (nem fallback), usa o original
            if (!gifUrl) {
                return _origShowBravely.apply(this, arguments).then(resolve);
            }

            const overlay = document.createElement('div');
            overlay.className = 'bravely-animation-overlay';
            overlay.id = 'bravelyAnimationOverlay';

            const gif = document.createElement('img');
            gif.src = gifUrl;
            gif.className = 'bravely-animation-gif';
            gif.alt = 'Poder Ancestral';
            gif.onerror = function() {
                // Se o GIF falhar, cai no original
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                _origShowBravely.apply(window, [playerClass]).then(resolve);
            };

            overlay.appendChild(gif);

            const board = tutorialMode ? document.getElementById('tutorialBoard') : document.getElementById('board');
            if (board) board.appendChild(overlay);

            try { playSfx('skill1'); } catch(e) {}

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
    };

    console.log('✅ showBravelyAnimation sobrescrito — usa STORY_BRAVELY_GIFS.');
})();

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
        .story-fx { position: absolute; pointer-events: none; z-index: 55; transform-origin: center center; will-change: transform, opacity; }
        .fx-spike-burst { position:absolute;width:14px;height:14px;background:radial-gradient(circle,#fff5dc 0%,#d9b840 40%,#8a7018 100%);border-radius:50%;box-shadow:0 0 12px #d9b840,0 0 24px rgba(217,184,64,0.5);animation:fxSpikeBurst 0.6s ease-out forwards; }
        @keyframes fxSpikeBurst { 0%{transform:scale(0);opacity:0;} 40%{transform:scale(1.4);opacity:1;} 100%{transform:scale(2.2);opacity:0;} }
        .fx-spike-travel { position:absolute;width:8px;height:8px;background:linear-gradient(135deg,#d9b840,#8a7018);border-radius:50%;box-shadow:0 0 8px #d9b840;z-index:56;transition:left 0.25s linear,top 0.25s linear,opacity 0.25s; }
        .fx-spike-roll { position:absolute;width:40px;height:40px;background:radial-gradient(circle,#d9b840 0%,#8a7018 70%,transparent 100%);border-radius:50%;box-shadow:0 0 15px #d9b840;animation:fxSpikeRoll 0.5s linear forwards; }
        @keyframes fxSpikeRoll { 0%{transform:rotate(0deg) scale(0.8);opacity:0.6;} 50%{transform:rotate(180deg) scale(1.1);opacity:1;} 100%{transform:rotate(360deg) scale(0.8);opacity:0;} }
        .fx-jaw-snap { position:absolute;width:100%;height:100%;background:linear-gradient(180deg,transparent 30%,rgba(74,122,58,0.9) 48%,transparent 52%),linear-gradient(0deg,transparent 30%,rgba(74,122,58,0.9) 48%,transparent 52%);border-radius:6px;animation:fxJawSnap 0.45s cubic-bezier(0.4,0,0.2,1) forwards; }
        @keyframes fxJawSnap { 0%{transform:scaleY(2.5);opacity:0;} 40%{transform:scaleY(1);opacity:1;} 70%{transform:scaleY(0.85);opacity:1;} 100%{transform:scaleY(1);opacity:0;} }
        .fx-tail-whip { position:absolute;width:200%;height:200%;left:-50%;top:-50%;border:4px solid rgba(74,122,58,0.8);border-top-color:transparent;border-bottom-color:transparent;border-radius:50%;box-shadow:0 0 15px rgba(74,122,58,0.6);animation:fxTailWhip 0.6s ease-out forwards; }
        @keyframes fxTailWhip { 0%{transform:rotate(0deg) scale(0.4);opacity:0;} 50%{transform:rotate(180deg) scale(1);opacity:1;} 100%{transform:rotate(360deg) scale(1.1);opacity:0;} }
        .fx-antler-charge { position:absolute;width:100%;height:100%;background:radial-gradient(circle at 20% 50%,rgba(217,184,64,0.9) 0%,transparent 30%),radial-gradient(circle at 80% 50%,rgba(217,184,64,0.9) 0%,transparent 30%);animation:fxAntlerCharge 0.5s ease-out forwards; }
        @keyframes fxAntlerCharge { 0%{transform:translateX(-30px);opacity:0;} 50%{transform:translateX(0);opacity:1;} 100%{transform:translateX(20px);opacity:0;} }
        .fx-pounce-arc { position:absolute;width:30px;height:30px;background:radial-gradient(circle,#d9b840 0%,#8a3030 70%,transparent 100%);border-radius:50%;box-shadow:0 0 20px #d9b840;animation:fxPounceArc 0.65s cubic-bezier(0.4,0,0.3,1) forwards; }
        @keyframes fxPounceArc { 0%{transform:translate(0,0) scale(0.6);opacity:0;} 40%{transform:translate(50%,-40px) scale(1.2);opacity:1;} 100%{transform:translate(100%,0) scale(0.8);opacity:0;} }
        .fx-claw-slash { position:absolute;width:100%;height:100%;background:linear-gradient(45deg,transparent 40%,rgba(217,80,80,0.95) 48%,rgba(255,255,255,1) 50%,rgba(217,80,80,0.95) 52%,transparent 60%),linear-gradient(-45deg,transparent 40%,rgba(217,80,80,0.95) 48%,rgba(255,255,255,1) 50%,rgba(217,80,80,0.95) 52%,transparent 60%);animation:fxClawSlash 0.4s ease-out forwards; }
        @keyframes fxClawSlash { 0%{transform:scale(0.3) rotate(-20deg);opacity:0;} 50%{transform:scale(1.1) rotate(0deg);opacity:1;} 100%{transform:scale(1.3) rotate(20deg);opacity:0;} }
        .fx-heavy-slash { position:absolute;width:100%;height:100%;background:linear-gradient(45deg,transparent 42%,rgba(255,80,80,0.95) 48%,rgba(255,255,255,1) 50%,rgba(255,80,80,0.95) 52%,transparent 58%);animation:fxHeavySlash 0.45s ease-out forwards; }
        @keyframes fxHeavySlash { 0%{transform:scale(0.5) rotate(-15deg);opacity:0;} 50%{transform:scale(1.3) rotate(0deg);opacity:1;} 100%{transform:scale(1.6) rotate(15deg);opacity:0;} }
        .fx-fang-bite { position:absolute;width:100%;height:100%;background:radial-gradient(ellipse at 50% 20%,rgba(255,255,255,0.9) 0%,transparent 25%),radial-gradient(ellipse at 50% 80%,rgba(255,255,255,0.9) 0%,transparent 25%);animation:fxFangBite 0.45s cubic-bezier(0.4,0,0.2,1) forwards; }
        @keyframes fxFangBite { 0%{transform:scaleY(1.5);opacity:0;} 40%{transform:scaleY(0.9);opacity:1;} 70%{transform:scaleY(0.75);opacity:1;} 100%{transform:scaleY(1);opacity:0;} }
        .fx-wing-gust { position:absolute;width:100%;height:100%;background:radial-gradient(ellipse at 30% 50%,rgba(217,184,64,0.7) 0%,transparent 40%),radial-gradient(ellipse at 70% 50%,rgba(217,184,64,0.7) 0%,transparent 40%);animation:fxWingGust 0.6s ease-out forwards; }
        @keyframes fxWingGust { 0%{transform:scaleX(0.3);opacity:0;} 50%{transform:scaleX(1.2);opacity:1;} 100%{transform:scaleX(1.5);opacity:0;} }
        .fx-peck-beak { position:absolute;width:0;height:0;border-left:12px solid transparent;border-right:12px solid transparent;border-top:20px solid #d9b840;filter:drop-shadow(0 0 6px #d9b840);animation:fxPeckBeak 0.35s cubic-bezier(0.4,0,0.2,1) forwards; }
        @keyframes fxPeckBeak { 0%{transform:translateY(-20px) scale(0.5);opacity:0;} 50%{transform:translateY(0) scale(1);opacity:1;} 100%{transform:translateY(8px) scale(0.8);opacity:0;} }
        .fx-coil-wrap { position:absolute;width:120%;height:120%;left:-10%;top:-10%;border:4px solid rgba(74,122,58,0.85);border-radius:50%;box-shadow:0 0 15px rgba(74,122,58,0.7),inset 0 0 15px rgba(74,122,58,0.5);animation:fxCoilWrap 0.7s cubic-bezier(0.4,0,0.2,1) forwards; }
        @keyframes fxCoilWrap { 0%{transform:rotate(0deg) scale(1.4);opacity:0;} 40%{transform:rotate(90deg) scale(1);opacity:1;} 80%{transform:rotate(180deg) scale(0.85);opacity:1;} 100%{transform:rotate(220deg) scale(0.95);opacity:0;} }
        .fx-sting-venom { position:absolute;width:100%;height:100%;background:radial-gradient(circle,rgba(107,163,92,0.9) 0%,rgba(74,122,58,0.5) 40%,transparent 70%);border-radius:50%;animation:fxStingVenom 0.7s ease-out forwards; }
        @keyframes fxStingVenom { 0%{transform:scale(0);opacity:0;} 40%{transform:scale(1.3);opacity:1;} 100%{transform:scale(1.8);opacity:0;} }
        .fx-splash-wave { position:absolute;width:100%;height:100%;background:radial-gradient(circle at 50% 100%,rgba(74,140,181,0.9) 0%,rgba(74,140,181,0.5) 30%,transparent 70%);animation:fxSplashWave 0.7s ease-out forwards; }
        @keyframes fxSplashWave { 0%{transform:scaleY(0.3);opacity:0;} 40%{transform:scaleY(1.2);opacity:1;} 100%{transform:scaleY(1.5);opacity:0;} }
        .fx-fin-slash { position:absolute;width:100%;height:100%;background:linear-gradient(135deg,transparent 40%,rgba(74,140,181,0.95) 48%,rgba(200,230,245,1) 50%,rgba(74,140,181,0.95) 52%,transparent 60%);animation:fxFinSlash 0.4s ease-out forwards; }
        @keyframes fxFinSlash { 0%{transform:scale(0.4) rotate(-30deg);opacity:0;} 50%{transform:scale(1.1) rotate(0deg);opacity:1;} 100%{transform:scale(1.4) rotate(30deg);opacity:0;} }
        .fx-hoof-stomp { position:absolute;width:100%;height:100%;background:radial-gradient(ellipse,rgba(139,90,43,0.8) 0%,transparent 60%);border-radius:50%;animation:fxHoofStomp 0.5s ease-out forwards; }
        @keyframes fxHoofStomp { 0%{transform:scale(0.5);opacity:0;} 30%{transform:scale(1.4);opacity:1;} 100%{transform:scale(1.8);opacity:0;} }
        .fx-ground-crack { position:absolute;width:100%;height:100%;background:linear-gradient(0deg,transparent 48%,rgba(74,60,30,0.95) 49%,rgba(74,60,30,0.95) 51%,transparent 52%),linear-gradient(60deg,transparent 48%,rgba(74,60,30,0.95) 49%,rgba(74,60,30,0.95) 51%,transparent 52%),linear-gradient(-60deg,transparent 48%,rgba(74,60,30,0.95) 49%,rgba(74,60,30,0.95) 51%,transparent 52%);animation:fxGroundCrack 0.6s ease-out forwards; }
        @keyframes fxGroundCrack { 0%{opacity:0;transform:scale(0.6);} 40%{opacity:1;transform:scale(1.1);} 100%{opacity:0;transform:scale(1.2);} }
        .fx-shockwave { position:absolute;width:100%;height:100%;border:3px solid rgba(217,184,64,0.85);border-radius:50%;animation:fxShockwave 0.6s ease-out forwards; }
        @keyframes fxShockwave { 0%{transform:scale(0.2);opacity:0;} 30%{transform:scale(1.2);opacity:1;} 100%{transform:scale(2.5);opacity:0;} }
        .fx-fog-cloud { position:absolute;width:140%;height:140%;left:-20%;top:-20%;background:radial-gradient(circle,rgba(200,200,220,0.7) 0%,rgba(200,200,220,0.3) 40%,transparent 70%);border-radius:50%;filter:blur(6px);animation:fxFogCloud 0.9s ease-out forwards; }
        @keyframes fxFogCloud { 0%{transform:scale(0.4);opacity:0;} 40%{transform:scale(1);opacity:0.9;} 100%{transform:scale(1.6);opacity:0;} }
        .fx-swarm-cloud { position:absolute;width:120%;height:120%;left:-10%;top:-10%;background:radial-gradient(circle at 20% 30%,rgba(168,50,50,0.9) 0%,transparent 15%),radial-gradient(circle at 70% 40%,rgba(168,50,50,0.9) 0%,transparent 15%),radial-gradient(circle at 40% 70%,rgba(168,50,50,0.9) 0%,transparent 15%),radial-gradient(circle at 80% 80%,rgba(168,50,50,0.9) 0%,transparent 15%),radial-gradient(circle at 50% 50%,rgba(168,50,50,0.5) 0%,transparent 40%);border-radius:50%;animation:fxSwarmCloud 0.7s ease-out forwards; }
        @keyframes fxSwarmCloud { 0%{transform:scale(0.3) rotate(0deg);opacity:0;} 40%{transform:scale(1.1) rotate(180deg);opacity:1;} 100%{transform:scale(1.4) rotate(360deg);opacity:0;} }
        .fx-spectral-veil { position:absolute;width:140%;height:140%;left:-20%;top:-20%;background:radial-gradient(circle,rgba(142,68,173,0.9) 0%,rgba(142,68,173,0.5) 40%,transparent 70%);border-radius:50%;filter:blur(4px);animation:fxSpectralVeil 0.8s ease-out forwards; }
        @keyframes fxSpectralVeil { 0%{transform:scale(0.4);opacity:0;} 40%{transform:scale(1.1);opacity:1;} 100%{transform:scale(1.5);opacity:0;} }
        .fx-push-arrow { position:absolute;width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:28px;color:#e8b923;text-shadow:0 0 8px #000,0 0 12px #e8b923;animation:fxPushArrow 0.5s ease-out forwards; }
        @keyframes fxPushArrow { 0%{transform:translate(0,0) scale(0.6);opacity:0;} 40%{transform:translate(8px,0) scale(1.2);opacity:1;} 100%{transform:translate(20px,0) scale(0.9);opacity:0;} }
        .fx-pull-chain { position:absolute;width:100%;height:100%;background:linear-gradient(90deg,transparent 30%,rgba(217,184,64,0.9) 48%,rgba(255,245,220,1) 50%,rgba(217,184,64,0.9) 52%,transparent 70%);animation:fxPullChain 0.5s ease-out forwards; }
        @keyframes fxPullChain { 0%{transform:translate(20px,0) scaleX(0.4);opacity:0;} 40%{transform:translate(0,0) scaleX(1);opacity:1;} 100%{transform:translate(-15px,0) scaleX(0.6);opacity:0;} }
        .fx-heal-orb { position:absolute;width:100%;height:100%;background:radial-gradient(circle,#7fc060 0%,#4a7040 50%,transparent 80%);border-radius:50%;box-shadow:0 0 20px #7fc060,inset 0 0 15px rgba(255,255,255,0.5);animation:fxHealOrb 0.8s ease-out forwards; }
        @keyframes fxHealOrb { 0%{transform:translateY(20px) scale(0.3);opacity:0;} 40%{transform:translateY(0) scale(1.1);opacity:1;} 100%{transform:translateY(-20px) scale(0.8);opacity:0;} }
        .fx-tile-flip { position:absolute;width:100%;height:100%;background:rgba(232,185,35,0.4);border:2px dashed rgba(232,185,35,0.9);animation:fxTileFlip 0.6s ease-out forwards; }
        @keyframes fxTileFlip { 0%{transform:rotateY(0deg) scale(1);opacity:0;} 40%{transform:rotateY(90deg) scale(1.1);opacity:1;} 100%{transform:rotateY(180deg) scale(1);opacity:0;} }
        .fx-element-pulse { position:absolute;width:100%;height:100%;border:3px solid currentColor;border-radius:50%;animation:fxElementPulse 0.7s ease-out forwards; }
        @keyframes fxElementPulse { 0%{transform:scale(0.3);opacity:0;} 40%{transform:scale(1.2);opacity:1;} 100%{transform:scale(1.8);opacity:0;} }
        .fx-flame-short { position:absolute;width:100%;height:100%;background:radial-gradient(circle at 50% 80%,#fff5dc 0%,#e8b923 20%,#a83232 50%,transparent 80%);animation:fxFlameShort 0.5s ease-out forwards; }
        @keyframes fxFlameShort { 0%{transform:scale(0.4);opacity:0;} 50%{transform:scale(1.2);opacity:1;} 100%{transform:scale(1.4);opacity:0;} }
        .fx-impact { position:absolute;width:100%;height:100%;background:radial-gradient(circle,rgba(255,245,220,0.95) 0%,rgba(232,185,35,0.6) 30%,transparent 70%);animation:fxImpact 0.4s ease-out forwards; }
        @keyframes fxImpact { 0%{transform:scale(0.2);opacity:0;} 40%{transform:scale(1.3);opacity:1;} 100%{transform:scale(1.6);opacity:0;} }
    `;
    document.head.appendChild(style);
})();

// =================================================================
// 🧭 HELPERS DE POSICIONAMENTO E FX
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
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, duration);
    board.appendChild(el);
    return el;
}

function spawnFxLine(fxKey, cssClass, fromX, fromY, dir, length, opts = {}) {
    const results = [];
    const dx = dir === 'right' ? 1 : dir === 'left'  ? -1 : 0;
    const dy = dir === 'down'  ? 1 : dir === 'up'    ? -1 : 0;
    for (let i = 0; i < length; i++) {
        const nx = fromX + dx * (i + 1);
        const ny = fromY + dy * (i + 1);
        if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
        const delay = (opts.stagger || 0) * i;
        const el = spawnFxAt(fxKey, cssClass, nx, ny, { ...opts, delay: (opts.delay || 0) + delay });
        results.push({ x: nx, y: ny, el });
    }
    return results;
}

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
            const el = spawnFxAt(fxKey, cssClass, nx, ny, { ...opts, delay: (opts.delay || 0) + delay });
            results.push({ x: nx, y: ny, el, dist });
        }
    }
    return results;
}

function spawnFxCross(fxKey, cssClass, cx, cy, length, opts = {}) {
    const results = [];
    if (opts.includeCenter) {
        results.push({ x: cx, y: cy, el: spawnFxAt(fxKey, cssClass, cx, cy, opts) });
    }
    const dirs = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
    dirs.forEach(dir => {
        for (let i = 1; i <= length; i++) {
            const nx = cx + dir.dx * i;
            const ny = cy + dir.dy * i;
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
            const delay = (opts.stagger || 0) * i;
            const el = spawnFxAt(fxKey, cssClass, nx, ny, { ...opts, delay: (opts.delay || 0) + delay });
            results.push({ x: nx, y: ny, el, dist: i, dir });
        }
    });
    return results;
}

function spawnFxDiagonal(fxKey, cssClass, cx, cy, length, opts = {}) {
    const results = [];
    const dirs = [{dx:1,dy:1},{dx:1,dy:-1},{dx:-1,dy:1},{dx:-1,dy:-1}];
    dirs.forEach(dir => {
        for (let i = 1; i <= length; i++) {
            const nx = cx + dir.dx * i;
            const ny = cy + dir.dy * i;
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
            const delay = (opts.stagger || 0) * i;
            const el = spawnFxAt(fxKey, cssClass, nx, ny, { ...opts, delay: (opts.delay || 0) + delay });
            results.push({ x: nx, y: ny, el, dist: i, dir });
        }
    });
    return results;
}

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
    board.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 600);
}

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

function spawnElementPulse(x, y, elementColor) {
    const colorMap = { FOGO:'#e74c3c', AGUA:'#3498db', TERRA:'#27ae60', AR:'#f1c40f' };
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
    setTimeout(() => { el.style.opacity = '0'; }, (opts.duration || 250) + 100);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, (opts.duration || 250) + 400);
    return el;
}

// =================================================================
// 🎯 HELPERS COMBATENTES
// =================================================================
function tryPushPlayer(p, dirX, dirY, distance = 1) {
    if (!p || p.dead) return false;
    let moved = false;
    for (let i = 0; i < distance; i++) {
        const nx = p.x + dirX;
        const ny = p.y + dirY;
        if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
        if (typeof isOccupied === 'function' && isOccupied(nx, ny, p.id)) break;
        p.x = nx; p.y = ny; moved = true;
    }
    if (moved) {
        if (typeof spawnPushArrow === 'function') spawnPushArrow(p.x, p.y, dirX > 0 ? 'right' : dirX < 0 ? 'left' : dirY > 0 ? 'down' : 'up');
        if (typeof updateVisuals === 'function') updateVisuals();
    }
    return moved;
}

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
        p.x = nx; p.y = ny; moved = true;
        if (p.x === toX && p.y === toY) break;
    }
    if (moved) {
        if (typeof spawnPullChain === 'function') spawnPullChain(p.x, p.y, toX, toY);
        if (typeof updateVisuals === 'function') updateVisuals();
    }
    return moved;
}

function dirToward(fromX, fromY, toX, toY) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    if (Math.abs(dx) >= Math.abs(dy)) return { dx: Math.sign(dx), dy: 0, name: dx > 0 ? 'right' : 'left' };
    return { dx: 0, dy: Math.sign(dy), name: dy > 0 ? 'down' : 'up' };
}

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
// 🦸 CLASS_DB ESTENDIDO
// =================================================================
function buildStoryClassDB() {
    const db = {};
    Object.values(STORY_HERO_CLASSES).forEach(hero => {
        db[hero.className] = {
            hp: hero.hp,
            atk: hero.atk,
            min: hero.range || 0,
            role: hero.role,
            element: hero.element,
            spriteKey: hero.spriteKey,
            paKey: hero.paKey,
        };
    });
    return db;
}

function installStoryClassDB() {
    try {
        const storyDB = buildStoryClassDB();
        if (!window._origClassDB) {
            window._origClassDB = Object.assign({}, CLASS_DB);
        }
        Object.keys(CLASS_DB).forEach(k => delete CLASS_DB[k]);
        Object.assign(CLASS_DB, storyDB);

        if (typeof SPRITES !== 'undefined') {
            Object.values(STORY_HERO_CLASSES).forEach(hero => {
                if (hero.className && hero.spriteKey) {
                    const url = SPRITES_STORY[hero.spriteKey];
                    if (url && url.trim() !== '') {
                        SPRITES[hero.className] = url;
                    } else {
                        SPRITES[hero.className] = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                    }
                }
            });
        }
    } catch(e) {
        console.warn('[story] Falha ao instalar CLASS_DB estendido:', e);
    }
}

function restoreBaseClassDB() {
    try {
        if (window._origClassDB) {
            Object.keys(CLASS_DB).forEach(k => delete CLASS_DB[k]);
            Object.assign(CLASS_DB, window._origClassDB);
        }
    } catch(e) {}
}

// =================================================================
// 🎯 PODER ANCESTRAL DOS HERÓIS NOVOS — efeitos EXTRA
// =================================================================
const STORY_HERO_PA = {
    'kanarott_cruz_empurra': {
        desc: 'Cruz 5×5 + empurra boss 2 tiles',
        execute: async (active, target) => {
            if (target && !target.dead) {
                const dx = Math.sign(target.x - active.x) || 0;
                const dy = Math.sign(target.y - active.y) || 0;
                for (let k = 0; k < 2; k++) {
                    const nx = target.x + dx;
                    const ny = target.y + dy;
                    if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
                    if (isOccupied(nx, ny, -1)) break;
                    target.x = nx;
                    target.y = ny;
                }
                updateVisuals();
                addLog(`⚔️ Kanarott empurra o inimigo!`);
            }
            await sleep(200);
        }
    },
    'teperesik_area2x2': { desc: 'Área 3×3 (dano já aplicado)', execute: async () => { await sleep(100); } },
    'eru_linha_horizontal': { desc: 'Linha horizontal (dano já aplicado)', execute: async () => { await sleep(100); } },
    'andure_area2x2_cura': {
        desc: 'Área 3×3 + cura 3 HP em si mesmo',
        execute: async (active, target) => {
            active.hp = Math.min(active.maxHp, active.hp + 3);
            if (typeof showHealEffect === 'function') showHealEffect(active.x, active.y, 3);
            if (typeof updateHeroCard === 'function') updateHeroCard();
            addLog(`💧 Anduré cura 3 HP!`);
            await sleep(300);
        }
    },
    'maedamata_area3x3_cura': {
        desc: 'Área 5×5 + cura 4 HP em si mesmo',
        execute: async (active, target) => {
            active.hp = Math.min(active.maxHp, active.hp + 4);
            if (typeof showHealEffect === 'function') showHealEffect(active.x, active.y, 4);
            if (typeof updateHeroCard === 'function') updateHeroCard();
            addLog(`🌳 Mãe da Mata cura 4 HP!`);
            await sleep(300);
        }
    },
    'paje_coluna_fogo': {
        desc: 'Coluna + dobra dano se boss em FOGO',
        execute: async (active, target) => {
            if (target && !target.dead) {
                const targetIdx = target.y * 8 + target.x;
                if (grid[targetIdx] === 'FOGO') {
                    const extraDmg = active.totalAtk || 3;
                    applyDmg(target, extraDmg);
                    addLog(`🔥 Alvo em FOGO! Dano dobrado (+${extraDmg})!`);
                }
            }
            await sleep(200);
        }
    },
    'jurua_area_alvo_3x3': { desc: 'Área 3×3 no alvo', execute: async () => { await sleep(100); } },
    'araci_linha_horizontal': { desc: 'Linha horizontal', execute: async () => { await sleep(100); } },
    'bicho_cruz_completa': { desc: 'Cruz completa no alvo', execute: async () => { await sleep(100); } },
    'tapyra_coluna_alvo': { desc: 'Coluna vertical no alvo', execute: async () => { await sleep(100); } },
};

// =================================================================
// 🎯 HANDLERS DOS ATOS 1-7
// =================================================================
const STORY_ANIMAL_SKILLS = {};

// ATO 1 — PORCO-ESPINHO
STORY_ANIMAL_SKILLS['porco_espinho_espinhos'] = async (enemy, skill) => {
    const atk = enemy.atk;
    addLog(`🦔 ${enemy.name} eriça os espinhos!`);
    spawnFxAt('spike_burst', 'fx-spike-burst', boss.x, boss.y, { duration: 700 });
    const dirs = [{dx:1,dy:0},{dx:-1,dy:0},{dx:0,dy:1},{dx:0,dy:-1}];
    const tilesAtk = [];
    dirs.forEach(dir => {
        let step = 0;
        while (true) {
            step++;
            const nx = boss.x + dir.dx * step;
            const ny = boss.y + dir.dy * step;
            if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
            spawnTravelingFx('spike_burst', 'fx-spike-travel', boss.x, boss.y, nx, ny, { duration: 150 + step * 40 });
            const dmg = step === 1 ? atk : Math.max(1, atk - 1);
            tilesAtk.push({ x: nx, y: ny, dmg });
        }
    });
    await sleep(400);
    tilesAtk.forEach(t => { spawnFxAt('spike_burst', 'fx-spike-burst', t.x, t.y, { duration: 500, scale: 0.7 }); });
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
    for (let i = 0; i < 2; i++) {
        const nx = boss.x + dir.dx;
        const ny = boss.y + dir.dy;
        if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
        if (isOccupied(nx, ny, -1)) break;
        spawnFxAt('spike_roll', 'fx-spike-roll', nx, ny, { duration: 500 });
        boss.x = nx; boss.y = ny;
        lastX = nx; lastY = ny;
        updateVisuals();
        await sleep(180);
    }
    await sleep(200);
    spawnFxAt('spike_burst', 'fx-spike-burst', lastX, lastY, { duration: 700, scale: 1.3 });
    players.forEach(p => {
        if (!p.dead && p.x === lastX && p.y === lastY) {
            applyDmg(p, atk);
            tryPushPlayer(p, dir.dx, dir.dy, 1);
        }
    });
    await sleep(300);
};

// ATO 1 — JACARÉ
STORY_ANIMAL_SKILLS['jacare_bocada'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('jaw_snap', 'fx-jaw-snap', t.x, t.y, { duration: 500 }); }, i * 120); });
    await sleep(400);
    damagePlayersAt(tiles, atk);
    await sleep(300);
};

STORY_ANIMAL_SKILLS['jacare_giro'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐊 ${enemy.name} gira a cauda em 360°!`);
    spawnFxAt('tail_whip', 'fx-tail-whip', boss.x, boss.y, { duration: 700, scale: 1.5 });
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('tail_whip', 'fx-tail-whip', t.x, t.y, { duration: 600 }); }, i * 30); });
    await sleep(500);
    damagePlayersAt(tiles, atk);
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

// ATO 1 — CERVO
STORY_ANIMAL_SKILLS['cervo_investida'] = async (enemy) => {
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
    let targetX = boss.x, targetY = boss.y;
    for (let i = 0; i < 3; i++) {
        const nx = boss.x + dir.dx;
        const ny = boss.y + dir.dy;
        if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
        if (isOccupied(nx, ny, -1)) break;
        spawnFxAt('antler_charge', 'fx-antler-charge', nx, ny, { duration: 400 });
        boss.x = nx; boss.y = ny;
        targetX = nx; targetY = ny;
        updateVisuals();
        await sleep(150);
    }
    await sleep(200);
    spawnFxAt('shockwave', 'fx-shockwave', targetX, targetY, { duration: 600 });
    players.forEach(p => { if (!p.dead && p.x === targetX && p.y === targetY) applyDmg(p, atk); });
    await sleep(300);
};

STORY_ANIMAL_SKILLS['cervo_chifrada'] = async (enemy) => {
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
    tiles.forEach(t => {
        players.forEach(p => {
            if (!p.dead && p.x === t.x && p.y === t.y) tryPushPlayer(p, dir.dx, dir.dy, 1);
        });
    });
    await sleep(300);
};

// ATO 1 — ONÇA-PARDA
STORY_ANIMAL_SKILLS['onca_garra_dupla'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐆 ${enemy.name} ataca com garra dupla!`);
    const alive = players.filter(p => !p.dead);
    if (alive.length === 0) return;
    const hero = alive[0];
    const dir = dirToward(boss.x, boss.y, hero.x, hero.y);
    const tiles = [];
    const anchorX = boss.x + dir.dx * 2;
    const anchorY = boss.y + dir.dy * 2;
    for (let dx = -1; dx <= 2; dx++) {
        for (let dy = -1; dy <= 2; dy++) {
            const fx = anchorX + dx;
            const fy = anchorY + dy;
            if (fx < 0 || fx >= 8 || fy < 0 || fy >= 8) continue;
            tiles.push({ x: fx, y: fy });
        }
    }
    tiles.forEach((t, i) => {
        setTimeout(() => { spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 400, scale: 0.85 }); }, i * 25);
    });
    await sleep(350);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['onca_salto'] = async (enemy) => {
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
    const fromX = boss.x, fromY = boss.y;
    let landX = Math.max(0, Math.min(7, boss.x + dir.dx * 2));
    let landY = Math.max(0, Math.min(7, boss.y + dir.dy * 2));
    spawnFxAt('pounce_arc', 'fx-pounce-arc', fromX, fromY, { duration: 700 });
    boss.x = landX; boss.y = landY;
    updateVisuals();
    await sleep(350);
    spawnFxAt('shockwave', 'fx-shockwave', landX, landY, { duration: 600, scale: 1.4 });
    spawnFxAt('impact', 'fx-impact', landX, landY, { duration: 500 });
    const tiles = buildAreaTiles(landX, landY, 1, true);
    const dmg = Math.max(1, atk - 1);
    await sleep(300);
    damagePlayersAt(tiles, dmg);
    await sleep(300);
};

// ATO 1 — SACI
STORY_ANIMAL_SKILLS['saci_vortices'] = async () => {
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

STORY_ANIMAL_SKILLS['saci_diagonais'] = async () => {
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    playSfx('saci');
    addLog(`💨 Saci lança vórtices diagonais!`);
    const diagonals = [{dx:1,dy:1},{dx:1,dy:-1},{dx:-1,dy:1},{dx:-1,dy:-1}];
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

// ATO 2 — TAMANDUÁ
STORY_ANIMAL_SKILLS['tamandua_garras'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐜 ${enemy.name} ataca com garras longas!`);
    spawnFxAt('claw_slash', 'fx-claw-slash', boss.x, boss.y, { duration: 500, scale: 1.4 });
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach(t => { spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 400, scale: 0.8 }); });
    await sleep(450);
    damagePlayersAt(tiles, atk);
    await sleep(300);
};

STORY_ANIMAL_SKILLS['tamandua_bicada'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('peck_beak', 'fx-peck-beak', t.x, t.y, { duration: 400 }); }, i * 120); });
    await sleep(400);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// ATO 2 — ANTA
STORY_ANIMAL_SKILLS['anta_pisada'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🦛 ${enemy.name} dá uma pisada pesada!`);
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

STORY_ANIMAL_SKILLS['anta_atropelamento'] = async (enemy) => {
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
        if (isOccupied(nx, ny, -1)) {
            spawnFxAt('shockwave', 'fx-shockwave', nx, ny, { duration: 600 });
            players.forEach(p => { if (!p.dead && p.x === nx && p.y === ny) applyDmg(p, atk); });
            hit = true;
            break;
        }
        spawnFxAt('hoof_stomp', 'fx-hoof-stomp', nx, ny, { duration: 400 });
        boss.x = nx; boss.y = ny;
        updateVisuals();
        await sleep(140);
    }
    if (!hit) spawnFxAt('ground_crack', 'fx-ground-crack', boss.x, boss.y, { duration: 500 });
    await sleep(300);
};

// ATO 2 — QUEIXADA
STORY_ANIMAL_SKILLS['queixada_mordida'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('fang_bite', 'fx-fang-bite', t.x, t.y, { duration: 500 }); }, i * 130); });
    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['queixada_estouro'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐗 ${enemy.name} provoca um estouro de manada!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('impact', 'fx-impact', t.x, t.y, { duration: 500 }); }, i * 40); });
    await sleep(500);
    damagePlayersAt(tiles, atk);
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

// ATO 2 — SUCURI
STORY_ANIMAL_SKILLS['sucuri_bocarra'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('jaw_snap', 'fx-jaw-snap', t.x, t.y, { duration: 500, scale: 1.2 }); }, i * 140); });
    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['sucuri_caudada'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐍 ${enemy.name} dá uma caudada devastadora!`);
    spawnFxAt('tail_whip', 'fx-tail-whip', boss.x, boss.y, { duration: 700, scale: 1.8 });
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('tail_whip', 'fx-tail-whip', t.x, t.y, { duration: 500 }); }, i * 40); });
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

// ATO 2 — MAPINGUARI
STORY_ANIMAL_SKILLS['mapinguari_mordida'] = async () => {
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    playSfx('minoa1');
    addLog(`🦥 Mapinguari dá uma mordida poderosa!`);
    triggerBite(boss.x, boss.y);
    await sleep(600);
    players.forEach(p => {
        if (!p.dead && Math.abs(p.x - boss.x) <= 2 && Math.abs(p.y - boss.y) <= 2) applyDmg(p, bossAtk);
    });
};

STORY_ANIMAL_SKILLS['mapinguari_pedras'] = async () => {
    playSfx('minoa2');
    addLog(`🦥 Mapinguari lança pedras!`);
    triggerRocks(boss.x, boss.y);
    await sleep(600);
    const rows = [boss.y - 1, boss.y, boss.y + 1];
    players.forEach(p => { if (!p.dead && rows.includes(p.y)) applyDmg(p, 2); });
};

// ATO 3 — PIRANHA
STORY_ANIMAL_SKILLS['piranha_cardume'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐟 ${enemy.name} chama o cardume!`);
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
    allTiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('swarm_cloud', 'fx-swarm-cloud', t.x, t.y, { duration: 500 }); }, i * 50); });
    await sleep(600);
    damagePlayersAt(allTiles, atk);
    await sleep(300);
};

STORY_ANIMAL_SKILLS['piranha_frenesi'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐟 ${enemy.name} entra em frenesi!`);
    spawnFxAt('swarm_cloud', 'fx-swarm-cloud', boss.x, boss.y, { duration: 700, scale: 1.4 });
    const alive = players.filter(p => !p.dead);
    await sleep(400);
    alive.forEach(p => {
        const d = Math.abs(p.x - boss.x) + Math.abs(p.y - boss.y);
        let dmg = atk;
        if (d > 2) dmg = Math.max(1, atk - 1);
        applyDmg(p, dmg);
    });
    await sleep(300);
};

// ATO 3 — LONTRA
STORY_ANIMAL_SKILLS['lontra_garras'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('fin_slash', 'fx-fin-slash', t.x, t.y, { duration: 400 }); }, i * 130); });
    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['lontra_nado'] = async (enemy) => {
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
        if (isOccupied(nx, ny, -1)) break;
        spawnFxAt('splash_wave', 'fx-splash-wave', nx, ny, { duration: 500 });
        boss.x = nx; boss.y = ny;
        updateVisuals();
        await sleep(150);
    }
    await sleep(200);
    spawnFxAt('splash_wave', 'fx-splash-wave', boss.x, boss.y, { duration: 600, scale: 1.4 });
    players.forEach(p => { if (!p.dead && p.x === boss.x && p.y === boss.y) applyDmg(p, atk); });
    await sleep(300);
};

// ATO 3 — ARIRANHA
STORY_ANIMAL_SKILLS['ariranha_matilha'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🦦 ${enemy.name} chama a matilha!`);
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

STORY_ANIMAL_SKILLS['ariranha_bote'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('splash_wave', 'fx-splash-wave', t.x, t.y, { duration: 500 }); }, i * 130); });
    await sleep(400);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// ATO 3 — PIRARUCU
STORY_ANIMAL_SKILLS['pirarucu_bocarra'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('jaw_snap', 'fx-jaw-snap', t.x, t.y, { duration: 500, scale: 1.3 }); }, i * 140); });
    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['pirarucu_caudada'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐠 ${enemy.name} dá uma caudada!`);
    spawnFxAt('tail_whip', 'fx-tail-whip', boss.x, boss.y, { duration: 700, scale: 1.7 });
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('splash_wave', 'fx-splash-wave', t.x, t.y, { duration: 500 }); }, i * 40); });
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

// ATO 3 — IARA
STORY_ANIMAL_SKILLS['iara_tsunami'] = async () => {
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

STORY_ANIMAL_SKILLS['iara_jatos'] = async () => {
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    playSfx('iara2');
    addLog(`💧 Iara lança jatos d'água!`);
    triggerWaterJet(boss.x, boss.y);
    await sleep(600);
    players.forEach(p => {
        if (!p.dead && (p.x === boss.x || p.y === boss.y)) applyDmg(p, bossAtk);
    });
};

// ATO 4 — CASCAVEL
STORY_ANIMAL_SKILLS['cascavel_chocalho'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐍 ${enemy.name} agita o chocalho e ataca tiles de AR!`);
    let count = 0;
    grid.forEach((element, idx) => {
        if (element === 'AR') {
            const x = idx % 8;
            const y = Math.floor(idx / 8);
            spawnFxAt('sting_venom', 'fx-sting-venom', x, y, { duration: 700, delay: count * 40 });
            players.forEach(p => {
                if (!p.dead && p.x === x && p.y === y) setTimeout(() => applyDmg(p, atk), count * 40);
            });
            count++;
        }
    });
    addLog(`🐍 ${count} tiles de AR foram atingidos!`);
    await sleep(700);
};

STORY_ANIMAL_SKILLS['cascavel_bote'] = async (enemy) => {
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

// ATO 4 — COBRA-CORAL
STORY_ANIMAL_SKILLS['coral_aneis'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐍 ${enemy.name} enrola em anéis coloridos!`);
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
    const perpX = dir.dy !== 0 ? 1 : 0;
    const perpY = dir.dx !== 0 ? 1 : 0;
    [[1,0],[-1,0]].forEach(([k]) => {
        const nx = frontX + perpX * k;
        const ny = frontY + perpY * k;
        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push({ x: nx, y: ny });
    });
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('coil_wrap', 'fx-coil-wrap', t.x, t.y, { duration: 600 }); }, i * 100); });
    await sleep(450);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['coral_peconha'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('sting_venom', 'fx-sting-venom', t.x, t.y, { duration: 700 }); }, i * 130); });
    await sleep(430);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// ATO 4 — JARARACA
STORY_ANIMAL_SKILLS['jararaca_bote'] = async (enemy) => {
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

STORY_ANIMAL_SKILLS['jararaca_enrolar'] = async (enemy) => {
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
    tryPullPlayer(nearest, boss.x, boss.y, 1);
    await sleep(300);
};

// ATO 4 — TARTARUGA
STORY_ANIMAL_SKILLS['tartaruga_casco'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐢 ${enemy.name} ergue o casco duro!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('shockwave', 'fx-shockwave', t.x, t.y, { duration: 600, scale: 0.9 }); }, i * 40); });
    await sleep(500);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['tartaruga_pancada'] = async (enemy) => {
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
    tiles.forEach(t => {
        players.forEach(p => {
            if (!p.dead && p.x === t.x && p.y === t.y) tryPushPlayer(p, dir.dx, dir.dy, 1);
        });
    });
    await sleep(300);
};

// ATO 4 — BOITATÁ
STORY_ANIMAL_SKILLS['boitata_colunas'] = async () => {
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    playSfx('skill1');
    addLog(`🔥 Boitatá lança colunas de fogo!`);
    const columns = [boss.x - 1, boss.x, boss.x + 1];
    columns.forEach(col => { if (col >= 0 && col <= 7) triggerFireColumn(col); });
    await sleep(600);
    players.forEach(p => { if (!p.dead && columns.includes(p.x)) applyDmg(p, bossAtk); });
};

STORY_ANIMAL_SKILLS['boitata_explosoes'] = async () => {
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

// ATO 5 — BODE
STORY_ANIMAL_SKILLS['bode_cornada'] = async (enemy) => {
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

STORY_ANIMAL_SKILLS['bode_marrada'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('antler_charge', 'fx-antler-charge', t.x, t.y, { duration: 450 }); }, i * 130); });
    await sleep(420);
    damagePlayersAt(tiles, atk);
    tiles.forEach(t => {
        players.forEach(p => {
            if (!p.dead && p.x === t.x && p.y === t.y) tryPushPlayer(p, dir.dx, dir.dy, 1);
        });
    });
    await sleep(280);
};

// ATO 5 — CARNEIRO
STORY_ANIMAL_SKILLS['carneiro_trombada'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('hoof_stomp', 'fx-hoof-stomp', t.x, t.y, { duration: 450 }); }, i * 130); });
    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['carneiro_pisada'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐏 ${enemy.name} pisa com força!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('hoof_stomp', 'fx-hoof-stomp', t.x, t.y, { duration: 500 }); }, i * 40); });
    await sleep(500);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// ATO 5 — CAVALO SELVAGEM
STORY_ANIMAL_SKILLS['cavalo_coice'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('hoof_stomp', 'fx-hoof-stomp', t.x, t.y, { duration: 450, scale: 1.2 }); }, i * 130); });
    await sleep(420);
    damagePlayersAt(tiles, atk);
    tiles.forEach(t => {
        players.forEach(p => {
            if (!p.dead && p.x === t.x && p.y === t.y) tryPushPlayer(p, dir.dx, dir.dy, 1);
        });
    });
    await sleep(280);
};

STORY_ANIMAL_SKILLS['cavalo_relincho'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐎 ${enemy.name} relincha furiosamente!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => { spawnFxAt('shockwave', 'fx-shockwave', t.x, t.y, { duration: 500, scale: 0.8 }); }, dist * 50);
    });
    await sleep(550);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

// ATO 5 — TOURO BRAVO
STORY_ANIMAL_SKILLS['touro_cornada'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('antler_charge', 'fx-antler-charge', t.x, t.y, { duration: 500, scale: 1.3 }); }, i * 130); });
    await sleep(420);
    damagePlayersAt(tiles, atk);
    tiles.forEach(t => {
        players.forEach(p => {
            if (!p.dead && p.x === t.x && p.y === t.y) tryPushPlayer(p, dir.dx, dir.dy, 1);
        });
    });
    await sleep(280);
};

STORY_ANIMAL_SKILLS['touro_pisoteada'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐂 ${enemy.name} pisoteia o chão!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t) => {
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

// ATO 5 — MULA
STORY_ANIMAL_SKILLS['mula_relincho'] = async () => {
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    playSfx('skill1');
    addLog(`🐴 Mula sem Cabeça relincha fogo em 3 colunas!`);
    const columns = [boss.x - 1, boss.x, boss.x + 1].filter(col => col >= 0 && col <= 7);
    columns.forEach(col => triggerFireColumn(col));
    await sleep(600);
    players.forEach(p => { if (!p.dead && columns.includes(p.x)) applyDmg(p, bossAtk); });
};

STORY_ANIMAL_SKILLS['mula_bolas'] = async () => {
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    playSfx('skill1');
    addLog(`🐴 Mula sem Cabeça lança bolas de fogo!`);
    const directions = [{dx:2,dy:0},{dx:-2,dy:0},{dx:0,dy:2},{dx:0,dy:-2}];
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

// ATO 6 — URUBU
STORY_ANIMAL_SKILLS['urubu_voo'] = async (enemy) => {
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

STORY_ANIMAL_SKILLS['urubu_bicada'] = async (enemy) => {
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
    players.forEach(p => { if (!p.dead && p.x === nearest.x && p.y === nearest.y) applyDmg(p, atk); });
    await sleep(220);
};

// ATO 6 — CARCARÁ
STORY_ANIMAL_SKILLS['carcara_garras'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🦅 ${enemy.name} ataca com garras afiadas!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 450 }); }, i * 40); });
    await sleep(480);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['carcara_mergulho'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('wing_gust', 'fx-wing-gust', t.x, t.y, { duration: 400, scale: 0.7 }); }, i * 100); });
    await sleep(450);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// ATO 6 — TATU
STORY_ANIMAL_SKILLS['tatu_casco'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🦔 ${enemy.name} endurece o casco!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('shockwave', 'fx-shockwave', t.x, t.y, { duration: 550, scale: 0.9 }); }, i * 40); });
    await sleep(500);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['tatu_cavar'] = async (enemy) => {
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
    spawnFxAt('ground_crack', 'fx-ground-crack', tx, ty, { duration: 600, scale: 1.3 });
    await sleep(400);
    players.forEach(p => { if (!p.dead && p.x === tx && p.y === ty) applyDmg(p, atk); });
    await sleep(280);
};

// ATO 6 — LOBO-GUARÁ
STORY_ANIMAL_SKILLS['lobo_guara_uivo'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐺 ${enemy.name} uiva!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => { spawnFxAt('shockwave', 'fx-shockwave', t.x, t.y, { duration: 500, scale: 0.9 }); }, dist * 55);
    });
    await sleep(550);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

STORY_ANIMAL_SKILLS['lobo_guara_bote'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('fang_bite', 'fx-fang-bite', t.x, t.y, { duration: 500 }); }, i * 130); });
    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// ATO 6 — CORPO SECO
STORY_ANIMAL_SKILLS['corpo_seco_vapor'] = async () => {
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    playSfx('garras');
    addLog(`💀 Corpo Seco sopra vapor podre!`);
    const directions = [{dx:0,dy:-1},{dx:0,dy:-2},{dx:0,dy:1},{dx:0,dy:2},{dx:-1,dy:0},{dx:-2,dy:0},{dx:1,dy:0},{dx:2,dy:0}];
    directions.forEach(dir => {
        let tileX = boss.x + dir.dx;
        let tileY = boss.y + dir.dy;
        if (tileX >= 0 && tileX < 8 && tileY >= 0 && tileY < 8) {
            triggerPoisonGas(tileX, tileY);
            players.forEach(p => { if (!p.dead && p.x === tileX && p.y === tileY) applyDmg(p, bossAtk); });
        }
    });
    await sleep(600);
};

STORY_ANIMAL_SKILLS['corpo_seco_garras'] = async () => {
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 4;
    playSfx('garras');
    addLog(`💀 Corpo Seco ataca com garras!`);
    const attackDirections = ['left', 'right', 'up', 'down'];
    const direction = attackDirections[Math.floor(Math.random() * 4)];
    let targetTiles = [];
    switch (direction) {
        case 'left': for (let dx = -2; dx <= 0; dx++) for (let dy = -2; dy <= 2; dy++) targetTiles.push({ x: boss.x + dx, y: boss.y + dy }); break;
        case 'right': for (let dx = 0; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) targetTiles.push({ x: boss.x + dx, y: boss.y + dy }); break;
        case 'up': for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 0; dy++) targetTiles.push({ x: boss.x + dx, y: boss.y + dy }); break;
        case 'down': for (let dx = -2; dx <= 2; dx++) for (let dy = 0; dy <= 2; dy++) targetTiles.push({ x: boss.x + dx, y: boss.y + dy }); break;
    }
    targetTiles.forEach(tile => {
        if (tile.x >= 0 && tile.x < 8 && tile.y >= 0 && tile.y < 8) {
            triggerClawSpin(tile.x, tile.y);
            players.forEach(p => { if (!p.dead && p.x === tile.x && p.y === tile.y) applyDmg(p, bossAtk + 1); });
        }
    });
    await sleep(600);
};

// ATO 7 — CACHORRO-DO-MATO
STORY_ANIMAL_SKILLS['cachorro_mordida'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('fang_bite', 'fx-fang-bite', t.x, t.y, { duration: 500 }); }, i * 130); });
    await sleep(400);
    damagePlayersAt(tiles, atk);
    await sleep(220);
};

STORY_ANIMAL_SKILLS['cachorro_rosnado'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐕 ${enemy.name} rosna ferozmente!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('fang_bite', 'fx-fang-bite', t.x, t.y, { duration: 450, scale: 0.8 }); }, i * 40); });
    await sleep(480);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// ATO 7 — RAPOSA
STORY_ANIMAL_SKILLS['raposa_astucia'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🦊 ${enemy.name} usa de astúcia!`);
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('fang_bite', 'fx-fang-bite', t.x, t.y, { duration: 500, scale: 0.9 }); }, i * 130); });
    await sleep(400);
    damagePlayersAt(tiles, atk);
    await sleep(220);
};

STORY_ANIMAL_SKILLS['raposa_bote'] = async (enemy) => {
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
    for (let i = 0; i < 2; i++) {
        const nx = boss.x + dir.dx;
        const ny = boss.y + dir.dy;
        if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
        if (isOccupied(nx, ny, -1)) break;
        spawnFxAt('pounce_arc', 'fx-pounce-arc', nx, ny, { duration: 500, scale: 0.7 });
        boss.x = nx; boss.y = ny;
        updateVisuals();
        await sleep(160);
    }
    await sleep(200);
    players.forEach(p => { if (!p.dead && p.x === boss.x && p.y === boss.y) applyDmg(p, atk); });
    await sleep(280);
};

// ATO 7 — GUAXINIM
STORY_ANIMAL_SKILLS['guaxinim_garras'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🦝 ${enemy.name} ataca com garras noturnas!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 450 }); }, i * 40); });
    await sleep(480);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['guaxinim_surpresa'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('fang_bite', 'fx-fang-bite', t.x, t.y, { duration: 450 }); }, i * 110); });
    await sleep(400);
    damagePlayersAt(tiles, atk);
    await sleep(220);
};

// ATO 7 — JAGUATIRICA
STORY_ANIMAL_SKILLS['jaguatirica_garras'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐆 ${enemy.name} ataca com garras selvagens!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => { spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 500, scale: 0.9 }); }, dist * 55);
    });
    await sleep(550);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

STORY_ANIMAL_SKILLS['jaguatirica_salto'] = async (enemy) => {
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
    boss.x = landX; boss.y = landY;
    updateVisuals();
    await sleep(350);
    spawnFxAt('shockwave', 'fx-shockwave', landX, landY, { duration: 600, scale: 1.4 });
    spawnFxAt('impact', 'fx-impact', landX, landY, { duration: 500 });
    const tiles = buildAreaTiles(landX, landY, 1, true);
    const dmg = Math.max(1, atk - 1);
    await sleep(300);
    damagePlayersAt(tiles, dmg);
    await sleep(300);
};

// ATO 7 — LOBISOMEM
STORY_ANIMAL_SKILLS['lobisomem_garras'] = async () => {
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

STORY_ANIMAL_SKILLS['lobisomem_tremor'] = async () => {
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
                players.forEach(p => { if (!p.dead && p.x === tileX && p.y === tileY) applyDmg(p, 2); });
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
            p.x = newX; p.y = newY;
        }
    });
    updateVisuals();
    addLog(`🐺 Heróis foram puxados para perto!`);
    await sleep(400);
};

// =================================================================
// 🎯 applyStorySkill
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
        const alive = players.filter(p => !p.dead);
        if (alive.length > 0) applyDmg(alive[0], enemy.atk);
        return;
    }
    try {
        let effectiveEnemy = enemy;
        if (typeof skill.dmg === 'number' && skill.dmg > 0) {
            effectiveEnemy = Object.assign({}, enemy, { atk: skill.dmg });
        }
        const isBossSkill = bossIsStoryBoss(enemy.id);
        if (!isBossSkill) {
            try { playSkillSound(handlerName); } catch(e) {}
        }
        await handler(effectiveEnemy, skill);
    } catch (e) {
        console.error('[story] erro no handler', handlerName, e);
    }
}

// =================================================================
// 🔊 SISTEMA DE SOM POR ARQUÉTIPO
// =================================================================
const STORY_SKILL_SOUNDS = {
    porco_espinho_espinhos:'',porco_espinho_bote:'',jacare_bocada:'',jacare_giro:'',
    cervo_investida:'',cervo_chifrada:'',onca_garra_dupla:'',onca_salto:'',
    tamandua_garras:'',tamandua_bicada:'',anta_pisada:'',anta_atropelamento:'',
    queixada_mordida:'',queixada_estouro:'',sucuri_bocarra:'',sucuri_caudada:'',
    piranha_cardume:'',piranha_frenesi:'',lontra_garras:'',lontra_nado:'',
    ariranha_matilha:'',ariranha_bote:'',pirarucu_bocarra:'',pirarucu_caudada:'',
    cascavel_chocalho:'',cascavel_bote:'',coral_aneis:'',coral_peconha:'',
    jararaca_bote:'',jararaca_enrolar:'',tartaruga_casco:'',tartaruga_pancada:'',
    bode_cornada:'',bode_marrada:'',carneiro_trombada:'',carneiro_pisada:'',
    cavalo_coice:'',cavalo_relincho:'',touro_cornada:'',touro_pisoteada:'',
    urubu_voo:'',urubu_bicada:'',carcaara_garras:'',carcaara_mergulho:'',
    tatu_casco:'',tatu_cavar:'',lobo_guara_uivo:'',lobo_guara_bote:'',
    cachorro_mordida:'',cachorro_rosnado:'',raposa_astucia:'',raposa_bote:'',
    guaxinim_garras:'',guaxinim_surpresa:'',jaguatirica_garras:'',jaguatirica_salto:'',
    morcego_voo:'',morcego_eco:'',coruja_garras:'',coruja_voo:'',
    sapo_veneno:'',sapo_lingua:'',seriema_bicada:'',seriema_grito:'',
    tucunare_bote:'',tucunare_cardume:'',piraiba_bocarra:'',piraiba_caudada:'',
    dourada_escamas:'',dourada_nado:'',peixe_boi_corpulencia:'',peixe_boi_pancada:'',
    bufalo_marrada:'',bufalo_pisoteada:'',vaca_coice:'',vaca_mugido:'',
    cabra_cornada:'',cabra_bote:'',zebu_marrada:'',zebu_pisada:'',
    gato_mato_garras:'',gato_mato_salto:'',mariposa_po:'',mariposa_voo:'',
    quati_garras:'',quati_bote:'',sucuarana_garra:'',sucuarana_salto:'',
    gaviao_voo:'',gaviao_garras:'',falcao_mergulho:'',falcao_garras:'',
    urutau_canto:'',urutau_voo:'',aguia_garras:'',aguia_mergulho:'',
};

const STORY_ARCHETYPE_SOUNDS = {
    som_mordida: 'minoa1', som_mordida_rapida: 'atkg', som_garra: 'garras',
    som_garra_ave: 'atkg', som_bicada: 'atkg', som_investida: 'minoa2',
    som_pisada: 'minoa2', som_cornada: 'atkg', som_caudada: 'minoa1',
    som_enrolar: 'minoa1', som_coice: 'atkg', som_relincho: 'skill1',
    som_mugido: 'minoa2', som_uivo: 'garras', som_rugido: 'minoa2',
    som_voo: 'saci1', som_ventania: 'saci', som_splash: 'iara2',
    som_nado: 'iara1', som_bocarra: 'iara2', som_terra: 'minoa2',
    som_cavar: 'minoa2', som_poeira: 'minoa2', som_magia: 'skill1',
    som_cura: 'cucask2', som_veneno: 'garras', som_tempestade: 'skill1',
    som_luar: 'skill1', som_solar: 'skill1', som_espectral: 'skill1',
};

const STORY_SKILL_FALLBACK_MAP = {
    porco_espinho_espinhos:'som_garra', porco_espinho_bote:'som_investida',
    jacare_bocada:'som_mordida', jacare_giro:'som_caudada',
    cervo_investida:'som_investida', cervo_chifrada:'som_cornada',
    onca_garra_dupla:'som_garra', onca_salto:'som_rugido',
    tamandua_garras:'som_garra', tamandua_bicada:'som_bicada',
    anta_pisada:'som_pisada', anta_atropelamento:'som_investida',
    queixada_mordida:'som_mordida', queixada_estouro:'som_pisada',
    sucuri_bocarra:'som_bocarra', sucuri_caudada:'som_caudada',
    piranha_cardume:'som_mordida_rapida', piranha_frenesi:'som_mordida_rapida',
    lontra_garras:'som_garra', lontra_nado:'som_nado',
    ariranha_matilha:'som_mordida', ariranha_bote:'som_bocarra',
    pirarucu_bocarra:'som_bocarra', pirarucu_caudada:'som_caudada',
    cascavel_chocalho:'som_veneno', cascavel_bote:'som_mordida_rapida',
    coral_aneis:'som_enrolar', coral_peconha:'som_veneno',
    jararaca_bote:'som_mordida_rapida', jararaca_enrolar:'som_enrolar',
    tartaruga_casco:'som_pisada', tartaruga_pancada:'som_pisada',
    bode_cornada:'som_cornada', bode_marrada:'som_cornada',
    carneiro_trombada:'som_investida', carneiro_pisada:'som_pisada',
    cavalo_coice:'som_coice', cavalo_relincho:'som_relincho',
    touro_cornada:'som_cornada', touro_pisoteada:'som_pisada',
    urubu_voo:'som_voo', urubu_bicada:'som_bicada',
    carcaara_garras:'som_garra_ave', carcaara_mergulho:'som_voo',
    tatu_casco:'som_terra', tatu_cavar:'som_cavar',
    lobo_guara_uivo:'som_uivo', lobo_guara_bote:'som_mordida',
    cachorro_mordida:'som_mordida', cachorro_rosnado:'som_rugido',
    raposa_astucia:'som_mordida_rapida', raposa_bote:'som_mordida',
    guaxinim_garras:'som_garra', guaxinim_surpresa:'som_mordida_rapida',
    jaguatirica_garras:'som_garra', jaguatirica_salto:'som_rugido',
};

function playSkillSound(handlerName) {
    const dedicated = STORY_SKILL_SOUNDS[handlerName];
    if (dedicated && dedicated.trim() !== '') {
        if (typeof playSfx === 'function') playSfx(dedicated);
        return;
    }
    const archetype = STORY_SKILL_FALLBACK_MAP[handlerName];
    if (archetype && STORY_ARCHETYPE_SOUNDS[archetype]) {
        if (typeof playSfx === 'function') playSfx(STORY_ARCHETYPE_SOUNDS[archetype]);
        return;
    }
    if (typeof playSfx === 'function') playSfx('skill1');
}

function bossIsStoryBoss(enemyId) {
    return ['saci','mapinguari','iara','boitata','mula','corpo_seco','lobisomem','cuca','boto','boi','jaci','guaraci','anhanga'].includes(enemyId);
}
// =================================================================
// 🦇 ATO 8 — MORCEGO
// =================================================================
STORY_ANIMAL_SKILLS['morcego_voo'] = async (enemy) => {
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

STORY_ANIMAL_SKILLS['morcego_eco'] = async (enemy) => {
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
STORY_ANIMAL_SKILLS['coruja_garras'] = async (enemy) => {
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

STORY_ANIMAL_SKILLS['coruja_voo'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('fog_cloud', 'fx-fog-cloud', t.x, t.y, { duration: 500, scale: 0.7 }); }, i * 100); });
    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🐸 ATO 8 — SAPO-CURURU
// =================================================================
STORY_ANIMAL_SKILLS['sapo_veneno'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐸 ${enemy.name} espirra veneno em cruz!`);
    const tiles = buildCrossTiles(boss.x, boss.y, 2, false);
    spawnFxAt('sting_venom', 'fx-sting-venom', boss.x, boss.y, { duration: 700, scale: 1.5 });
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('sting_venom', 'fx-sting-venom', t.x, t.y, { duration: 700, scale: 0.8 }); }, i * 50); });
    await sleep(600);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['sapo_lingua'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('fin_slash', 'fx-fin-slash', t.x, t.y, { duration: 450, scale: 0.9 }); }, i * 130); });
    await sleep(420);
    damagePlayersAt(tiles, atk);
    tiles.forEach(t => {
        players.forEach(p => {
            if (!p.dead && p.x === t.x && p.y === t.y) tryPullPlayer(p, boss.x, boss.y, 1);
        });
    });
    await sleep(250);
};

// =================================================================
// 🐦 ATO 8 — SERIEMA
// =================================================================
STORY_ANIMAL_SKILLS['seriema_bicada'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('peck_beak', 'fx-peck-beak', t.x, t.y, { duration: 450, scale: 1.3 }); }, i * 130); });
    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['seriema_grito'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐦 ${enemy.name} dá um grito de guerra!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => { spawnFxAt('shockwave', 'fx-shockwave', t.x, t.y, { duration: 500, scale: 0.9 }); }, dist * 55);
    });
    await sleep(550);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

// =================================================================
// 🧙‍♀️ ATO 8 — CUCA
// =================================================================
STORY_ANIMAL_SKILLS['cuca_pocao'] = async () => {
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
                    players.forEach(p => { if (!p.dead && p.x === x && p.y === y) applyDmg(p, bossAtk); });
                }
            }
        }
    }, 300);
    await sleep(600);
};

STORY_ANIMAL_SKILLS['cuca_cura'] = async () => {
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

// =================================================================
// 🐟 ATO 9 — TUCUNARÉ
// =================================================================
STORY_ANIMAL_SKILLS['tucunare_bote'] = async (enemy) => {
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

STORY_ANIMAL_SKILLS['tucunare_cardume'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐟 ${enemy.name} chama o cardume!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('swarm_cloud', 'fx-swarm-cloud', t.x, t.y, { duration: 500 }); }, i * 45); });
    await sleep(500);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🐟 ATO 9 — PIRAÍBA
// =================================================================
STORY_ANIMAL_SKILLS['piraiba_bocarra'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('jaw_snap', 'fx-jaw-snap', t.x, t.y, { duration: 500, scale: 1.3 }); }, i * 130); });
    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['piraiba_caudada'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐟 ${enemy.name} dá uma caudada!`);
    spawnFxAt('tail_whip', 'fx-tail-whip', boss.x, boss.y, { duration: 700, scale: 1.6 });
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('splash_wave', 'fx-splash-wave', t.x, t.y, { duration: 500, scale: 0.8 }); }, i * 40); });
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
STORY_ANIMAL_SKILLS['dourada_escamas'] = async (enemy) => {
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

STORY_ANIMAL_SKILLS['dourada_nado'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('splash_wave', 'fx-splash-wave', t.x, t.y, { duration: 400, scale: 0.7 }); }, i * 100); });
    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🦭 ATO 9 — PEIXE-BOI
// =================================================================
STORY_ANIMAL_SKILLS['peixe_boi_corpulencia'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🦭 ${enemy.name} usa a corpulência!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => { spawnFxAt('splash_wave', 'fx-splash-wave', t.x, t.y, { duration: 500, scale: 0.9 }); }, dist * 55);
    });
    await sleep(550);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

STORY_ANIMAL_SKILLS['peixe_boi_pancada'] = async (enemy) => {
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
// 🐬 ATO 9 — BOTO ROSA
// =================================================================
STORY_ANIMAL_SKILLS['boto_coracoes'] = async () => {
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
                players.forEach(p => { if (!p.dead && p.x === tileX && p.y === tileY) applyDmg(p, bossAtk); });
            }
        }
    }
    await sleep(600);
};

STORY_ANIMAL_SKILLS['boto_jatos'] = async () => {
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 5;
    playSfx('boto_skill2');
    addLog(`🐬 Boto Rosa lança jatos d'água em cruz!`);
    for (let y = 0; y < 8; y++) triggerWaterJet(boss.x, y);
    for (let x = 0; x < 8; x++) triggerWaterJet(x, boss.y);
    await sleep(600);
    players.forEach(p => { if (!p.dead && (p.x === boss.x || p.y === boss.y)) applyDmg(p, bossAtk); });
};

// =================================================================
// 🐃 ATO 10 — BÚFALO SELVAGEM
// =================================================================
STORY_ANIMAL_SKILLS['bufalo_marrada'] = async (enemy) => {
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
            if (!p.dead && p.x === t.x && p.y === t.y) tryPushPlayer(p, dir.dx, dir.dy, 1);
        });
    });
    await sleep(280);
};

STORY_ANIMAL_SKILLS['bufalo_pisoteada'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐃 ${enemy.name} pisoteia o chão!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t) => {
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
STORY_ANIMAL_SKILLS['vaca_coice'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('hoof_stomp', 'fx-hoof-stomp', t.x, t.y, { duration: 450, scale: 1.2 }); }, i * 130); });
    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['vaca_mugido'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐄 ${enemy.name} dá um mugido de fúria!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('shockwave', 'fx-shockwave', t.x, t.y, { duration: 500, scale: 0.9 }); }, i * 45); });
    await sleep(500);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🐐 ATO 10 — CABRA PRETA
// =================================================================
STORY_ANIMAL_SKILLS['cabra_cornada'] = async (enemy) => {
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

STORY_ANIMAL_SKILLS['cabra_bote'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('antler_charge', 'fx-antler-charge', t.x, t.y, { duration: 450 }); }, i * 130); });
    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🐂 ATO 10 — ZEBU
// =================================================================
STORY_ANIMAL_SKILLS['zebu_marrada'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('antler_charge', 'fx-antler-charge', t.x, t.y, { duration: 500, scale: 1.3 }); }, i * 130); });
    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['zebu_pisada'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐂 ${enemy.name} dá uma pisada pesada!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t) => {
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
// 🐂 ATO 10 — BOI DA CARA PRETA
// =================================================================
STORY_ANIMAL_SKILLS['boi_face'] = async () => {
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
                players.forEach(p => { if (!p.dead && p.x === tileX && p.y === tileY) applyDmg(p, bossAtk); });
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

STORY_ANIMAL_SKILLS['boi_empurrao'] = async () => {
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

// =================================================================
// 🐈 ATO 11 — GATO-DO-MATO
// =================================================================
STORY_ANIMAL_SKILLS['gato_mato_garras'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐈 ${enemy.name} ataca com garras noturnas!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 450 }); }, i * 40); });
    await sleep(480);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['gato_mato_salto'] = async (enemy) => {
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
    boss.x = landX; boss.y = landY;
    updateVisuals();
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
STORY_ANIMAL_SKILLS['mariposa_po'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🦋 ${enemy.name} espalha pó lunar!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t) => {
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

STORY_ANIMAL_SKILLS['mariposa_voo'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('wing_gust', 'fx-wing-gust', t.x, t.y, { duration: 450, scale: 0.8 }); }, i * 100); });
    await sleep(420);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🦝 ATO 11 — QUATI
// =================================================================
STORY_ANIMAL_SKILLS['quati_garras'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🦝 ${enemy.name} ataca com garras afiadas!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 450, scale: 0.9 }); }, i * 40); });
    await sleep(480);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

STORY_ANIMAL_SKILLS['quati_bote'] = async (enemy) => {
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
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('fang_bite', 'fx-fang-bite', t.x, t.y, { duration: 450, scale: 0.9 }); }, i * 130); });
    await sleep(400);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🐆 ATO 11 — SUÇUARANA
// =================================================================
STORY_ANIMAL_SKILLS['sucuarana_garra'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🐆 ${enemy.name} dá uma garra fatal!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => { spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 500, scale: 1.1 }); }, dist * 55);
    });
    await sleep(550);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

STORY_ANIMAL_SKILLS['sucuarana_salto'] = async (enemy) => {
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
    boss.x = landX; boss.y = landY;
    updateVisuals();
    await sleep(350);
    spawnFxAt('shockwave', 'fx-shockwave', landX, landY, { duration: 600, scale: 1.4 });
    const tiles = buildAreaTiles(landX, landY, 1, true);
    const dmg = Math.max(1, atk - 1);
    await sleep(280);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

// =================================================================
// 🌙 ATO 11 — JACI
// =================================================================
STORY_ANIMAL_SKILLS['jaci_lua'] = async () => {
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

STORY_ANIMAL_SKILLS['jaci_tempestade'] = async () => {
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

// =================================================================
// 🦅 ATO 12 — GAVIÃO
// =================================================================
STORY_ANIMAL_SKILLS['gaviao_voo'] = async (enemy) => {
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

STORY_ANIMAL_SKILLS['gaviao_garras'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🦅 ${enemy.name} ataca com garras cortantes!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 1, false);
    tiles.forEach((t, i) => { setTimeout(() => { spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 450, scale: 0.9 }); }, i * 40); });
    await sleep(480);
    damagePlayersAt(tiles, atk);
    await sleep(250);
};

// =================================================================
// 🦅 ATO 12 — FALCÃO
// =================================================================
STORY_ANIMAL_SKILLS['falcao_mergulho'] = async (enemy) => {
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
    players.forEach(p => { if (!p.dead && p.x === tx && p.y === ty) applyDmg(p, atk); });
    boss.x = tx; boss.y = ty;
    updateVisuals();
    await sleep(280);
};

STORY_ANIMAL_SKILLS['falcao_garras'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🦅 ${enemy.name} ataca com garras do vento!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => { spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 500, scale: 0.9 }); }, dist * 55);
    });
    await sleep(550);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

// =================================================================
// 🦉 ATO 12 — URUTAU
// =================================================================
STORY_ANIMAL_SKILLS['urutau_canto'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🦉 ${enemy.name} entoa um canto sombrio!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => { spawnFxAt('spectral_veil', 'fx-spectral-veil', t.x, t.y, { duration: 700, scale: 0.8 }); }, dist * 55);
    });
    await sleep(600);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

STORY_ANIMAL_SKILLS['urutau_voo'] = async (enemy) => {
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
    for (let i = 0; i < 3; i++) {
        const nx = boss.x + dir.dx;
        const ny = boss.y + dir.dy;
        if (nx < 0 || nx >= 8 || ny < 0 || ny >= 8) break;
        if (isOccupied(nx, ny, -1)) break;
        spawnFxAt('spectral_veil', 'fx-spectral-veil', nx, ny, { duration: 500, scale: 0.7 });
        boss.x = nx; boss.y = ny;
        updateVisuals();
        await sleep(130);
    }
    await sleep(200);
    spawnFxAt('impact', 'fx-impact', boss.x, boss.y, { duration: 500, scale: 1.2 });
    players.forEach(p => { if (!p.dead && Math.abs(p.x - boss.x) <= 1 && Math.abs(p.y - boss.y) <= 1) applyDmg(p, atk); });
    await sleep(280);
};

// =================================================================
// 🦅 ATO 12 — ÁGUIA-CINZENTA
// =================================================================
STORY_ANIMAL_SKILLS['aguia_garras'] = async (enemy) => {
    const atk = enemy.atk;
    addLog(`🦅 ${enemy.name} ataca com garras reais!`);
    const tiles = buildAreaTiles(boss.x, boss.y, 2, false);
    tiles.forEach((t) => {
        const dist = Math.max(Math.abs(t.x - boss.x), Math.abs(t.y - boss.y));
        setTimeout(() => { spawnFxAt('claw_slash', 'fx-claw-slash', t.x, t.y, { duration: 500, scale: 1.1 }); }, dist * 55);
    });
    await sleep(550);
    const dmg = Math.max(1, atk - 1);
    damagePlayersAt(tiles, dmg);
    await sleep(280);
};

STORY_ANIMAL_SKILLS['aguia_mergulho'] = async (enemy) => {
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
    const hitTiles = [{ x: tx, y: ty }].concat(buildCrossTiles(tx, ty, 1, false));
    damagePlayersAt(hitTiles, atk);
    boss.x = tx; boss.y = ty;
    updateVisuals();
    await sleep(280);
};

// =================================================================
// ☀️ ATO 12 — GUARACI
// =================================================================
STORY_ANIMAL_SKILLS['guaraci_sol'] = async () => {
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

STORY_ANIMAL_SKILLS['guaraci_onda'] = async () => {
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

// =================================================================
// 👹 ATO 13 — ANHANGÁ
// =================================================================
STORY_ANIMAL_SKILLS['anhanga_fogo'] = async () => {
    const bossAtk = parseInt(document.getElementById('atk_BOSS_cfg').value) || 6;
    playSfx('anhanga_skill1');
    addLog(`👹 ANHANGÁ: 'Sintam meu fogo intercalado!'`);
    const columnsToAttack = [];
    for (let col = boss.x; col < 8; col += 2) columnsToAttack.push(col);
    for (let col = boss.x; col >= 0; col -= 2) columnsToAttack.push(col);
    const uniqueColumns = [...new Set(columnsToAttack)];
    uniqueColumns.forEach(col => { if (col >= 0 && col <= 7) triggerFireColumn(col); });
    await sleep(600);
    players.forEach(p => { if (!p.dead && uniqueColumns.includes(p.x)) applyDmg(p, bossAtk); });
};

STORY_ANIMAL_SKILLS['anhanga_devora'] = async () => {
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

    if (typeof showPurificacao === 'function') {
        try { await showPurificacao(boss.type, boss.x, boss.y, false); } catch(e) {}
    }

    await showPurificationMessage(enemyId);

    const isBoss = STORY_FINAL_DIALOGS[enemyId] !== undefined;
    if (isBoss) await showBossFinalDialog(enemyId);

    window._storyPurificationShowing = false;
    await advanceStoryEnemy();
}

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
        boss.x = 4; boss.y = 0;

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

        if (typeof playBossTheme === 'function') { try { playBossTheme(); } catch(e) {} }

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

function handleStoryDefeat(){
    if (!storyBattleActive) return;
    if (window._endGameShowing) return;
    window._endGameShowing = true;
    arcadeBossTransition = true;
    bossAIIsRunning = false;
    isExecutingAction = false;
    setTimeout(() => { arcadeBossTransition = false; finishStoryPhase(false); }, 800);
}

function finishStoryPhase(victory){
    if (!storyBattleActive) return;

    storyBattleActive = false;
    window._storyMode = false;
    window._storyPurificationShowing = false;

    restoreBaseGameFunctions();
    restoreBaseClassDB();

    const phase = storyCurrentPhase;
    const drops = [...storyPendingDrops];
    const finalScore = (typeof calculateFinalScore === 'function') ? calculateFinalScore() : 0;
    const rankSnapshot = {
        turns: RANKING.turns,
        ultimates: RANKING.ultimates,
        amulets: RANKING.amulets,
        shapes: Object.assign({}, RANKING.shapes)
    };

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

    if (victory) handleStoryPhaseVictory(phase, drops, finalScore, rankSnapshot);
    else handleStoryPhaseDefeat(phase, drops);
}

function handleStoryPhaseVictory(phase, drops, finalScore, rankSnapshot){
    const cid = parseInt(String(phase.id).split('-')[0]) || 1;
    const nextId = getNextPhaseId(phase.id, cid);

    players.forEach(p => { if (!p.dead) p.hp = p.maxHp; });
    completePhase(cid, phase.id, nextId);

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

    const maxScore = calcularMaxScorePossivel(cid, phase);
    const stars = calcularEstrelas(finalScore, maxScore);
    const effectiveStars = saveStarsForPhase(phase.id, stars);
    const totalStars = getTotalStars();
    saveStoryProgress();

    const unlockedHeroes = checkHeroUnlocks();

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

    showStoryVictoryScreen(phase, drops, { xp, gold: finalGold }, {
        stars: effectiveStars,
        starsJustEarned: stars,
        score: finalScore,
        maxScore: maxScore,
        totalStars: totalStars,
        unlockedHeroes: unlockedHeroes,
        rankSnapshot: rankSnapshot
    });
}

function handleStoryPhaseDefeat(phase, drops){
    players.forEach(p => { if (p.dead) p.dead = false; p.hp = p.maxHp; });
    saveStoryProgress();
    showStoryDefeatScreen(phase, drops);
}

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
// 🎯 OVERRIDES CONDICIONAIS (SEM executeAction — V8.1 cuida)
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

    window.applyDmg = function(t, amt){
        if (!window._storyMode || !_origApplyDmg) return _origApplyDmg.apply(this, arguments);
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

    window.manageTurns = function(){
        if (!window._storyMode || !_origManageTurns) return _origManageTurns.apply(this, arguments);
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

    if (_origSaveAndRefresh) {
        window.saveAndRefresh = function(){
            if (!window._storyMode || !_origSaveAndRefresh) return _origSaveAndRefresh.apply(this, arguments);
            _origSaveAndRefresh.apply(this, arguments);
            players.forEach(p => {
                const heroData = STORY_HERO_CLASSES[p.class];
                if (heroData && heroData.element) {
                    p.element = heroData.element;
                } else {
                    p.element = getHeroStoryElement(p.class);
                }
            });
            if (typeof updateHeroCard === 'function') updateHeroCard();
        };
    }

    if (_origHandleBossDefeat) {
        window.handleBossDefeat = function(){
            if (window._storyMode) return handleStoryBossDefeat();
            return _origHandleBossDefeat.apply(this, arguments);
        };
    }

    if (_origBossAI) {
        window.bossAI = function(){
            if (window._storyMode) return storyEnemyAI();
            return _origBossAI.apply(this, arguments);
        };
    }

    // ⚠️ NÃO sobrescrevemos executeAction aqui.
    // O executeAction para heróis novos é instalado no bloco final do arquivo
    // (installStoryExecuteAction), que também cuida do triggerBravelyChain.

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
// 🎯 IA DO INIMIGO
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
    if (!enemy) { bossAIIsRunning = false; return; }

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
            boss.x = mv.x; boss.y = mv.y;
            updateVisuals();
            await sleep(200);
        }
    }
    updateAllSpriteDirections();

    if (!boss.dead) {
        const skill = Math.random() < 0.5 ? enemy.skill1 : enemy.skill2;
        if (skill) await applyStorySkill(enemy, skill);
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
// 🎬 DIÁLOGOS DE ABERTURA/FINAL
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
// 🚀 INICIAR FASE
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
    boss.x = 4; boss.y = 0;

    ['titleScreen','storyScreen','modeScreen','challengeScreen','playersScreen','configScreen','tutorialScreen']
        .forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });

    const gs = document.getElementById('gameScreen');
    if (gs) { gs.style.display = 'flex'; gs.classList.add('active'); }
    currentScreen = 'game';

    installStoryOverrides();
    installStoryClassDB();

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
        const heroData = STORY_HERO_CLASSES[p.class];
        if (heroData && heroData.element) p.element = heroData.element;
        else p.element = getHeroStoryElement(p.class);
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
        const heroData = STORY_HERO_CLASSES[sel[i]];
        playerConfigs[i].name = heroData ? heroData.displayName : (STORY_CURRENT_SAVE_NAME || sel[i]);
    }
    playerCount = max;
}

// =================================================================
// 🎉 TELA DE VITÓRIA (com estrelas animadas)
// =================================================================
function showStoryVictoryScreen(phase, drops, rewards, meta){
    const old = document.getElementById('storyVictoryOverlay');
    if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'storyVictoryOverlay';
    ov.className = 'story-result-overlay';

    const stars = meta.stars;
    const totalStars = meta.totalStars;
    const maxStars = getMaxTotalStars();

    let starsHTML = '<div class="story-stars-big">';
    for (let i = 1; i <= 3; i++) {
        const on = i <= stars;
        starsHTML += `<span class="story-star ${on ? 'big-on' : 'big-off'}" data-star="${i}">★</span>`;
    }
    starsHTML += '</div>';

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

    let heroUnlockHTML = '';
    if (meta.unlockedHeroes && meta.unlockedHeroes.length > 0) {
        heroUnlockHTML = meta.unlockedHeroes.map(h => `
            <div style="text-align:center;padding:12px;background:rgba(107,163,92,.15);border:1px solid rgba(107,163,92,.4);border-radius:6px;margin-top:8px;">
                <div style="font-family:'Cinzel',serif;color:#8ac070;font-size:.9rem;letter-spacing:2px;">🏅 HERÓI DESBLOQUEADO</div>
                <div style="font-family:'EB Garamond',serif;color:#f0e2c0;font-size:1.1rem;margin-top:4px;font-weight:700;">${h.displayName}</div>
            </div>
        `).join('');
    }

    ov.innerHTML = `
        <div class="story-result-panel victory">
            <div class="story-result-scroll-top"><h1 class="story-result-title">${title}</h1></div>
            <div class="story-result-body">
                ${starsHTML}
                <div style="text-align:center;font-family:'Cinzel',serif;font-size:.85rem;color:#8a7a52;letter-spacing:1.5px;">
                    ⭐ ${totalStars} / ${maxStars} ESTRELAS TOTAIS
                </div>
                <div class="story-result-subtitle">${sub}</div>
                ${extraHTML}
                ${heroUnlockHTML}
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

    setTimeout(() => {
        const starEls = ov.querySelectorAll('.story-stars-big .story-star');
        starEls.forEach((el, i) => {
            const starNum = i + 1;
            if (starNum <= stars) {
                setTimeout(() => el.classList.add('show'), starNum * 300);
            } else {
                el.classList.add('show');
            }
        });
    }, 200);

    if (typeof playSfx === 'function') playSfx('win');
}

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
    restoreBaseClassDB();
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
                        <div class="story-save-item-stats">${uiIcon('gold')} ${s.gold} · ${uiIcon('xp')} ${s.xp} XP · ⭐ ${s.stars||0}</div>
                    </div>
                `).join('')}
            </div>
        </div>` : '';

    modal.innerHTML = `
        <div class="story-save-panel">
            <div class="story-save-header">${title}</div>
            <div class="story-save-hint">O nome define o elemento dos heróis base.</div>
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
        <div class="story-save-element-label">ELEMENTO DOS HERÓIS BASE:</div>
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
                ${renderAldeiaBtn('ritual','RITUAL','Em breve',true)}
                ${renderAldeiaBtn('bestiario','BESTIÁRIO','Em breve',true)}
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

    const totalStars = getTotalStars();
    const maxStars = getMaxTotalStars();

    let html = '';
    Object.values(STORY_CHAPTERS).forEach(ch => {
        const un = STORY_PROGRESS.unlockedChapters.includes(ch.id);
        const comp = ch.phases.filter(p => isPhaseCompleted(p.id)).length;
        const tot = ch.phases.length;
        const pct = Math.round((comp / tot) * 100);
        let chapStars = 0;
        ch.phases.forEach(p => { chapStars += getStarsForPhase(p.id); });
        const chapMax = tot * 3;

        if (un) {
            html += `<div class="story-chapter-card unlocked" onclick="selectStoryChapter(${ch.id})">
                <div class="story-chapter-cover">${storySpriteLarge(ch.capa)}</div>
                <div class="story-chapter-info">
                    <h3 class="story-chapter-name">${ch.name}</h3>
                    <p class="story-chapter-desc">${ch.description}</p>
                    <div class="story-chapter-progress">
                        <div class="story-chapter-progress-bar"><div class="story-chapter-progress-fill" style="width:${pct}%"></div></div>
                        <div class="story-chapter-progress-text">${comp}/${tot} fases · ⭐ ${chapStars}/${chapMax}</div>
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
            <div class="story-header">
                <h1 class="story-title">🗺️ ATOS</h1>
                <div style="text-align:center;margin-top:10px;">
                    <span class="story-stars-counter"><span class="story-stars-icon">⭐</span>${totalStars} / ${maxStars}</span>
                </div>
            </div>
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
}

// =================================================================
// 🏠 OCA
// =================================================================
function renderOcaScreen(){
    const screen = document.getElementById('storyScreen');
    if (!screen) return;
    const saveEl = getSaveElement();

    const unlockedList = STORY_PROGRESS.unlockedHeroesStory || ['Tupa','Sume','Caipora'];
    const allHeroes = Object.values(STORY_HERO_CLASSES);

    const html = allHeroes.map(hero => {
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
                <div class="story-hero-lock-info">
                    Desbloqueie com<br><b>${hero.starsNeeded} ⭐</b>
                </div>
                <div class="story-hero-lock-icon">🔒</div>
            </div>`;
        }

        const spriteBlock = spriteSrc
            ? `<img src="${spriteSrc}" class="story-hero-sprite" alt="${hero.displayName}">`
            : `<div class="story-hero-sprite" style="display:flex;align-items:center;justify-content:center;font-size:3.5rem;">${emoji}</div>`;

        const lv = STORY_PROGRESS.heroLevels[hero.className] || 1;
        const xp = STORY_PROGRESS.heroXP[hero.className] || 0;

        return `<div class="story-hero-card ${isSelected ? 'selected' : ''}" onclick="toggleHeroSelection('${hero.className}')">
            ${spriteBlock}
            <div class="story-hero-name">${hero.displayName}</div>
            <div class="story-hero-element elem-${el}">${elemIcon(el)} ${elDisplay}</div>
            <div class="story-hero-level">${hero.role} · HP ${hero.hp} · ATK ${hero.atk}</div>
            <div class="story-hero-xp">Nível ${lv} · ${xp} XP</div>
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
            <div class="story-heroes-grid">${html}</div>
            <div class="story-footer"><button class="story-back-btn" onclick="renderAldeiaScreen()">← VOLTAR À ALDEIA</button></div>
        </div>`;
}

function toggleHeroSelection(heroClass){
    const unlockedList = STORY_PROGRESS.unlockedHeroesStory || ['Tupa','Sume','Caipora'];
    const heroData = STORY_HERO_CLASSES[heroClass];
    if (!heroData) return;
    const isUnlocked = heroData.starsNeeded === 0 || unlockedList.includes(heroClass);
    if (!isUnlocked) return;

    STORY_PROGRESS.selectedHeroes = [heroClass];
    saveStoryProgress();
    renderOcaScreen();
}

// =================================================================
// 🧙 LOJA
// =================================================================
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
window.playSkillSound = playSkillSound;
window.showToast = showToast;
window.getTotalStars = getTotalStars;

console.log('✅ historia.js — Parte 5/6 carregada.');
// =================================================================
// historia.js — V8.1 — BLOCOS FINAIS DE CORREÇÃO
// =================================================================
// ⚠️ Este bloco PRECISA vir por último no arquivo.
// Ele sobrescreve triggerBravelyChain e executeAction para heróis novos,
// corrigindo:
//   • Guerreiro atacando à distância (agora ataca SÓ adjacente)
//   • PA sem animação / sem som
//   • Bravely sem chamar showBravelyAnimation
// =================================================================

// =================================================================
// V8.1 — triggerBravelyChain para heróis novos
// =================================================================
(function installStoryBravelyChain() {

    const _origBravelyChain = window.triggerBravelyChain;

    window.triggerBravelyChain = async function(active, target, totalAtk) {
        // Fora do modo história → original
        if (!window._storyMode || !_origBravelyChain) {
            return _origBravelyChain.apply(this, arguments);
        }

        const heroData = STORY_HERO_CLASSES[active.class];
        // Herói base → original (Tupã/Sumé/Caipora)
        if (!heroData || !heroData.paKey || heroData.paKey.startsWith('base_')) {
            return _origBravelyChain.apply(this, arguments);
        }

        // ============================================================
        // HERÓI NOVO — animação + FX + dano + efeitos extras
        // ============================================================
        const element = active.element || 'FOGO';
        const paKey = heroData.paKey;

        // 1. Overlay "PODER ANCESTRAL"
        if (typeof showPoderAncestralEffect === 'function') {
            try { showPoderAncestralEffect(); } catch(e) {}
        }
        await sleep(300);

        // 2. Toca o som de skill
        try { playSfx('skill1'); } catch(e) {}

        // 3. Calcula os tiles afetados pelo PA
        const paTiles = getPAaffectedTiles(active, paKey, target);

        // 4. FX elemental em cada tile
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

        // 5. Dano no alvo (se estiver em algum tile do PA)
        if (target && !target.dead) {
            const targetIdx = target.y * 8 + target.x;
            if (paTiles.includes(targetIdx)) {
                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            }
        }

        // 6. Efeitos EXTRAS únicos (empurrar, curar, dobro se em FOGO)
        const paFn = STORY_HERO_PA[paKey];
        if (paFn && typeof paFn.execute === 'function') {
            try { await paFn.execute(active, target, totalAtk); }
            catch(e) { console.warn('[story] Erro no efeito extra do PA:', e); }
        }

        // 7. Trocar tiles afetados pelo elemento do herói
        paTiles.forEach(idx => {
            grid[idx] = element;
            const tile = document.querySelectorAll('#grid .tile')[idx];
            if (tile) tile.className = `tile bg-${element}`;
            if (element === 'TERRA' && typeof updateTitleStats === 'function') updateTitleStats('earth_tile');
            else if (element === 'AR' && typeof updateTitleStats === 'function') updateTitleStats('air_tile');
        });

        // 8. Registra estatística
        if (typeof updateTitleStats === 'function') updateTitleStats('bravely_chain');
    };

    // ================================================================
    // 🎯 Tiles afetados pelo PA (forma de cada herói)
    // ================================================================
    function getPAaffectedTiles(active, paKey, target) {
        const tiles = [];
        const cx = active.x;
        const cy = active.y;

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
            if (target && !target.dead) {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const nx = target.x + dx, ny = target.y + dy;
                        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) tiles.push(ny * 8 + nx);
                    }
                }
            }
        }
        else if (paKey === 'araci_linha_horizontal') {
            for (let x = 0; x < 8; x++) tiles.push(cy * 8 + x);
        }
        else if (paKey === 'bicho_cruz_completa') {
            if (target && !target.dead) {
                for (let x = 0; x < 8; x++) tiles.push(target.y * 8 + x);
                for (let y = 0; y < 8; y++) if (y !== target.y) tiles.push(y * 8 + target.x);
            }
        }
        else if (paKey === 'tapyra_coluna_alvo') {
            if (target && !target.dead) {
                for (let y = 0; y < 8; y++) tiles.push(y * 8 + target.x);
            }
        }

        return tiles;
    }

    console.log('✅ V8.1 — triggerBravelyChain para heróis novos instalado.');
})();

// =================================================================
// V8.1 — executeAction para heróis novos
// -----------------------------------------------------------------
// • Guerreiro: move e ataca SÓ tile adjacente a cada passo
// • Mago/Arqueiro: move e ataca à distância se usedPath >= min
// • Bravely: SEMPRE chama showBravelyAnimation + triggerBravelyChain
// =================================================================
(function installStoryExecuteAction() {

    const _exec = window.executeAction;

    window.executeAction = async function() {
        if (!window._storyMode) {
            return _exec.apply(this, arguments);
        }

        if (!gameActive || path.length === 0 || arcadeBossTransition || isExecutingAction) return;
        if (bossAIIsRunning) return;

        const active = players[currentPlayerIdx];
        if (!active) return;

        const heroData = STORY_HERO_CLASSES[active.class];
        // Herói base → executeAction original
        if (!heroData || !heroData.paKey || heroData.paKey.startsWith('base_')) {
            return _exec.apply(this, arguments);
        }

        // ============================================
        // HERÓI NOVO
        // ============================================
        isExecutingAction = true;

        const target = (mode === "BOSS" || mode === "ARCADE")
            ? boss
            : players.find(p => p.id !== active.id && !p.dead);

        const info = CLASS_DB[active.class];
        const usedPath = [...path];
        const threshold = parseInt(document.getElementById('bravely_tiles').value) || 9;
        const isBravely = usedPath.length >= threshold;

        // --- Detectar forma ---
        let skillAtkBonus = 0;
        const shape = (typeof detectShape === 'function') ? detectShape(usedPath) : null;
        if (shape && RANKING.shapes[shape] !== undefined) {
            RANKING.shapes[shape]++;
            if (typeof updateTitleStats === 'function') updateTitleStats('shape_executed', 1, shape);
        }
        if (shape) {
            if (shape === "LINHA") {
                skillAtkBonus = 2;
                active.hp = Math.min(active.maxHp, active.hp + 1);
                if (typeof showHealEffect === 'function') showHealEffect(active.x, active.y, 1);
                if (typeof updateTitleStats === 'function') updateTitleStats('healing', 1);
            }
            if (shape === "L") {
                skillAtkBonus = 0;
                active.hp = Math.min(active.maxHp, active.hp + 2);
                if (typeof showHealEffect === 'function') showHealEffect(active.x, active.y, 2);
                if (typeof updateTitleStats === 'function') updateTitleStats('healing', 2);
            }
            if (shape === "ZIGZAG") skillAtkBonus = 3;
            if (shape === "QUADRADO") active.skillUsed = false;
        }

        const titleAtkBonus = active.titleBonus?.ATK || 0;
        const tileBonus = (usedPath.length > 0 && grid[usedPath[0]] === active.element) ? 1 : 0;
        const totalAtk = info.atk + (active.bonusAtk || 0) + tileBonus + skillAtkBonus + titleAtkBonus;

        // ============================================
        // GUERREIRO — ataca SÓ ADJACENTE a cada passo
        // ============================================
        if (heroData.role === 'Guerreiro') {
            const dealAdjacentDmg = () => {
                if (!target || target.dead) return;
                const dist = Math.abs(active.x - target.x) + Math.abs(active.y - target.y);
                if (dist <= 1) {
                    try { playSfx('atkg'); } catch(e) {}
                    if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
                    if (typeof spawnSwordEffect === 'function') spawnSwordEffect(target.x, target.y);
                }
            };

            dealAdjacentDmg();

            for (const idx of usedPath) {
                active.x = idx % 8;
                active.y = Math.floor(idx / 8);
                if (typeof checkAmulet === 'function') checkAmulet(active, active.x, active.y);
                if (typeof updateVisuals === 'function') updateVisuals();
                if (typeof updateHeroCard === 'function') updateHeroCard();
                if (typeof isOccupied === 'function' && isOccupied(active.x, active.y, active.id)) break;
                dealAdjacentDmg();
                await sleep(120);
            }
        }
        // ============================================
        // MAGO / ARQUEIRO — ataca à distância
        // ============================================
        else {
            for (const idx of usedPath) {
                active.x = idx % 8;
                active.y = Math.floor(idx / 8);
                if (typeof checkAmulet === 'function') checkAmulet(active, active.x, active.y);
                if (typeof updateVisuals === 'function') updateVisuals();
                if (typeof updateHeroCard === 'function') updateHeroCard();
                if (typeof isOccupied === 'function' && isOccupied(active.x, active.y, active.id)) break;
                await sleep(100);
            }

            if (usedPath.length >= info.min && target && !target.dead) {
                const extra = usedPath.length - info.min;
                if (heroData.role === 'Arqueiro') {
                    if (typeof spawnArrowProjectile === 'function') await spawnArrowProjectile(active, target);
                    try { playSfx('atka'); } catch(e) {}
                } else {
                    if (typeof spawnProjectile === 'function') await spawnProjectile(active, target, 'Magic');
                    try { playSfx('atkm'); } catch(e) {}
                }
                if (typeof applyDmg === 'function') applyDmg(target, totalAtk + extra);
            }
        }

        // --- Limpar tiles usados ---
        usedPath.forEach(idx => {
            const gridEl = document.getElementById('grid');
            if (gridEl.childNodes[idx] && typeof createTile === 'function') {
                gridEl.replaceChild(createTile(idx), gridEl.childNodes[idx]);
            }
        });

        // ============================================
        // BRAVELY (PA)
        // ============================================
        if (isBravely) {
            if (typeof showBravelyAnimation === 'function') {
                await showBravelyAnimation(active.class);
            }
            if (typeof triggerBravelyChain === 'function') {
                await triggerBravelyChain(active, target, totalAtk);
            }

            path = [];
            if (typeof renderPath === 'function') renderPath();
            RANKING.turns++;
            isExecutingAction = false;

            if (mode === "ARCADE" && boss.dead) return;
            if (mode === "BOSS" || mode === "ARCADE") {
                if (gameActive && typeof manageTurns === 'function') manageTurns();
                return;
            }
        }

        path = [];
        if (typeof renderPath === 'function') renderPath();
        RANKING.turns++;

        if (mode === "ARCADE" && boss.dead) { isExecutingAction = false; return; }
        if (gameActive && typeof manageTurns === 'function') manageTurns();

        if (typeof updateAllSpriteDirections === 'function') updateAllSpriteDirections();
        if (typeof updateHeroCard === 'function') updateHeroCard();
        isExecutingAction = false;
    };

    console.log('✅ V8.1 — executeAction para heróis novos instalado.');
})();

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
            console.log('📖 historia.js V8.1 pronto.');
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
    console.log('📖 Elemento base:', getSaveElement());
    console.log('📖 Capítulos:', Object.keys(STORY_CHAPTERS).length);
    console.log('📖 Inimigos:', Object.keys(STORY_ENEMIES).length);
    console.log('📖 Handlers:', Object.keys(STORY_ANIMAL_SKILLS).length);
    console.log('📖 Heróis:', Object.keys(STORY_HERO_CLASSES).length);
    console.log('📖 Estrelas totais:', getTotalStars(), '/', getMaxTotalStars());
    showStoryScreen();
};

window.testStarSystem = function(){
    console.log('⭐ Total de estrelas:', getTotalStars(), '/', getMaxTotalStars());
    console.log('⭐ Estrelas por fase:', STORY_PROGRESS.starsByPhase);
    console.log('⭐ Heróis desbloqueados:', STORY_PROGRESS.unlockedHeroesStory);
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

window.giveStars = function(count){
    count = parseInt(count) || 10;
    const completed = STORY_PROGRESS.completedPhases;
    if (completed.length === 0) {
        alert('Complete pelo menos 1 fase antes de dar estrelas.');
        return;
    }
    let given = 0;
    for (const pid of completed) {
        if (given >= count) break;
        const cur = getStarsForPhase(pid);
        if (cur < 3) {
            STORY_PROGRESS.starsByPhase[pid] = Math.min(3, cur + (count - given));
            given += (STORY_PROGRESS.starsByPhase[pid] - cur);
        }
    }
    saveStoryProgress();
    checkHeroUnlocks();
    console.log(`✅ ${given} estrelas adicionadas. Total: ${getTotalStars()}`);
    renderAldeiaScreen();
};

// =================================================================
// FIM — historia.js V8.1
// =================================================================
console.log('✅ historia.js — Parte 6/6 (V8.1) carregada. Arquivo completo.');
// =================================================================
// 🔧 FIX DE Z-INDEX — Efeitos acima do tabuleiro
// =================================================================
(function fixStoryFxZIndex() {
    if (document.getElementById('storyFxZIndexFix')) return;
    const style = document.createElement('style');
    style.id = 'storyFxZIndexFix';
    style.textContent = `
        /* O board vira o stacking context raiz */
        #board {
            position: relative !important;
            z-index: 0 !important;
            isolation: isolate;  /* força stacking context isolado */
        }

        /* O grid fica na base */
        #board > .grid {
            position: relative;
            z-index: 1 !important;
        }

        /* Tokens (heróis + boss) ficam acima do grid, mas abaixo dos FX */
        #board > .token {
            z-index: 10 !important;
        }

        /* Todos os FX do historia.js ficam acima de tudo */
        #board > .story-fx,
        #board > .fx-spike-burst,
        #board > .fx-spike-travel,
        #board > .fx-spike-roll,
        #board > .fx-jaw-snap,
        #board > .fx-tail-whip,
        #board > .fx-antler-charge,
        #board > .fx-pounce-arc,
        #board > .fx-claw-slash,
        #board > .fx-heavy-slash,
        #board > .fx-fang-bite,
        #board > .fx-wing-gust,
        #board > .fx-peck-beak,
        #board > .fx-coil-wrap,
        #board > .fx-sting-venom,
        #board > .fx-splash-wave,
        #board > .fx-fin-slash,
        #board > .fx-hoof-stomp,
        #board > .fx-ground-crack,
        #board > .fx-shockwave,
        #board > .fx-fog-cloud,
        #board > .fx-swarm-cloud,
        #board > .fx-spectral-veil,
        #board > .fx-push-arrow,
        #board > .fx-pull-chain,
        #board > .fx-heal-orb,
        #board > .fx-tile-flip,
        #board > .fx-element-pulse,
        #board > .fx-flame-short,
        #board > .fx-impact {
            z-index: 50 !important;
            pointer-events: none !important;
        }

        /* FX do entidades.js (base) também sobem */
        #board > .fire-column,
        #board > .fire-row,
        #board > .flare-fx,
        #board > .bite-fx,
        #board > .rock-projectile,
        #board > .tsunami-fx,
        #board > .vortex-fx,
        #board > .pororoca-fx,
        #board > .water-cross-fx,
        #board > .sword-fx,
        #board > .projectile,
        #board > .arrow-fx,
        #board > .fireball-fx,
        #board > .claw-spin-fx,
        #board > .potion-fx,
        #board > .poison-gas-fx,
        #board > .earthquake-fx,
        #board > .broken-heart-fx,
        #board > .scary-face-fx,
        #board > .moon-fx,
        #board > .moon-ray-fx,
        #board > .sun-fx,
        #board > .sun-ray-fx,
        #board > .heat-wave-fx,
        #board > .storm-fx {
            z-index: 50 !important;
            pointer-events: none !important;
        }

        /* Números flutuantes de dano/cura — sempre acima de tudo */
        #board > .dmg-float,
        #board > .heal-float {
            z-index: 80 !important;
        }

        /* Bravely GIF overlay — topo absoluto */
        #board > .bravely-animation-overlay {
            z-index: 200 !important;
        }

        /* Poder Ancestral — topo absoluto */
        #board > .poder-ancestral-vignette,
        #board > .poder-ancestral-text,
        #board > .poder-ancestral-runes,
        #board > .poder-ancestral-burst {
            z-index: 150 !important;
        }

        /* Purificação — acima de tudo */
        #board > .purificacao-overlay {
            z-index: 300 !important;
        }

        /* Tutorial (mesma lógica) */
        #tutorialBoard {
            position: relative !important;
            isolation: isolate;
        }
        #tutorialBoard > .grid { z-index: 1 !important; }
        #tutorialBoard > .token { z-index: 10 !important; }
        #tutorialBoard > .story-fx,
        #tutorialBoard > .dmg-float,
        #tutorialBoard > .heal-float {
            z-index: 50 !important;
        }
    `;
    document.head.appendChild(style);
    console.log('✅ Fix de z-index dos FX aplicado.');
})();
// =================================================================
// 🔧 FIX — Insere FX sempre como ÚLTIMO filho do #board
// =================================================================
(function fixStoryFxInsertion() {
    const board = document.getElementById('board');
    if (!board) return;

    // Observer que garante que o .grid fique sempre na primeira posição
    const observer = new MutationObserver(() => {
        const grid = board.querySelector(':scope > .grid');
        if (grid && grid !== board.firstElementChild) {
            board.insertBefore(grid, board.firstElementChild);
        }
    });
    observer.observe(board, { childList: true });

    console.log('✅ Fix de ordem de inserção dos FX aplicado.');
})();
// =================================================================
// 📖 PAINEL DE DETALHES DO HERÓI — OCA
// -----------------------------------------------------------------
// Adiciona botão "?" no card do herói na OCA.
// Ao clicar, abre painel lateral com:
//   • Stats detalhados (HP, ATK, alcance, papel, elemento)
//   • Descrição do Poder Ancestral
//   • Mini-grid 8×8 mostrando os tiles afetados pelo PA
//   • Números: quantos tiles ativa o ATK, tiles de caminho, etc.
//
// Slot opcional de imagem real do PA: STORY_HERO_PA_IMAGES.
// Se o link estiver vazio, cai no mini-grid (visual).
// =================================================================

// =================================================================
// 🎨 Slot de imagens reais do PA (opcional)
// -----------------------------------------------------------------
// Preencha com o link de uma imagem/gif do PA.
// Se vazio, usa o mini-grid visual.
// =================================================================
const STORY_HERO_PA_IMAGES = {
    'Tupa':              '',
    'Sume':              '',
    'Caipora':           '',
    'Kanarott':          '',
    'Juruá':             '',
    'Bicho Folharal':    '',
    'Eru':               '',
    'Teperesik':         '',
    'Anduré':            '',
    'Mãe da Mata':       '',
    'Pajé Anhanguera':   '',
    'Araci':             '',
    "Tapyra'yawara":     '',
};

// =================================================================
// 📖 Metadados de cada herói (descrições, táticas, números)
// =================================================================
const STORY_HERO_DETAILS = {
    // ---- BASE ----
    'Tupa': {
        paName: 'Coluna de Fogo',
        paDesc: 'Tupã ergue o cajado e invoca uma coluna vertical do elemento dele que atravessa o tabuleiro de cima a baixo. Todos os inimigos na coluna são atingidos.',
        paExtra: 'Afeta 8 tiles. Também empurra tiles para o elemento do herói.',
        tactical: 'Alcance: 1 (corpo a corpo). Cada tile do caminho até 1 do alvo causa dano.',
        notes: 'Herói base — elemento definido pelo nome do save.'
    },
    'Sume': {
        paName: 'Linha Curativa',
        paDesc: 'Sumé abre os braços e envia uma onda horizontal de luz. Toda a linha é atingida e todos os heróis na mesma linha são curados.',
        paExtra: 'Cura +2 HP em todos os aliados na linha. Afeta 8 tiles.',
        tactical: 'Alcance: 4 (ataca à distância). Precisa de 4+ tiles de caminho.',
        notes: 'Herói base — elemento definido pelo nome do save.'
    },
    'Caipora': {
        paName: 'Chuva de Flechas',
        paDesc: 'Caipora dispara uma saraivada de flechas que cai em área 3×3 ao redor do alvo.',
        paExtra: 'Afeta 9 tiles ao redor do alvo. Dano concentrado.',
        tactical: 'Alcance: 3 (ataca à distância). Precisa de 3+ tiles de caminho.',
        notes: 'Herói base — elemento definido pelo nome do save.'
    },

    // ---- GUERREIROS ----
    'Kanarott': {
        paName: 'Cruz do Guerreiro',
        paDesc: 'Kanarott bate a borduna no chão. Uma cruz de pedra irrompe do solo, atravessando o tabuleiro em 5 tiles na horizontal e 5 na vertical, empurrando tudo que estiver no caminho.',
        paExtra: 'Empurra o alvo 2 tiles para trás. Afeta 9 tiles em cruz.',
        tactical: 'Alcance: 1 (corpo a corpo). Cada tile do caminho adjacente ao alvo causa dano.',
        notes: 'Empurra o inimigo para longe do centro da cruz.'
    },
    'Teperesik': {
        paName: 'Fortaleza de Pedra',
        paDesc: 'Teperesik se ancora no chão e ergue um bloco quadrado de pedra e musgo ao seu redor. Uma muralha protetora que também esmaga os inimigos próximos.',
        paExtra: 'Área 3×3 (8 tiles ao redor). Dano de esmagamento.',
        tactical: 'Alcance: 1 (corpo a corpo). Alto HP (20).',
        notes: 'Tanque. Não se move longe do centro.'
    },
    'Eru': {
        paName: 'Chama Horizontal',
        paDesc: 'Eru eleva seu machado de pedra e uma parede de fogo corre horizontalmente por todo o tabuleiro, queimando tudo em seu caminho.',
        paExtra: 'Afeta 8 tiles em linha horizontal. Dano em todos.',
        tactical: 'Alcance: 1 (corpo a corpo). ATK 5 — o guerreiro mais forte.',
        notes: 'Forte, mas HP baixo (12). Deve atacar e recuar.'
    },

    // ---- MAGOS ----
    'Anduré': {
        paName: 'Esfera Curativa',
        paDesc: 'Anduré levita e uma esfera de água pura se forma ao seu redor, curando suas feridas enquanto protege a área.',
        paExtra: 'Área 3×3 (9 tiles com o centro). Cura +3 HP em si mesmo.',
        tactical: 'Alcance: 4 (ataca à distância). Precisar 4+ tiles.',
        notes: 'Suporte curador. Recarrega rápido.'
    },
    'Mãe da Mata': {
        paName: 'Floração Ancestral',
        paDesc: 'Mãe da Mata abre os braços e o chão floresce em um raio enorme. Flores, trepadeiras e cogumelos luminosos brotam do solo enquanto ela cura as feridas dos aliados.',
        paExtra: 'Área 5×5 (25 tiles). Cura +4 HP em si mesma.',
        tactical: 'Alcance: 4 (ataca à distância). O PA com maior área.',
        notes: 'Cura mais forte do jogo. Área gigante.'
    },
    'Pajé Anhanguera': {
        paName: 'Pilar de Fogo Sagrado',
        paDesc: 'O Pajé entoa um canto ancestral e uma coluna de fogo sagrado desce do céu, atravessando todo o tabuleiro. Se o alvo estiver em um tile de FOGO, o dano é dobrado.',
        paExtra: 'Coluna vertical inteira (8 tiles). Dano dobrado se alvo em FOGO.',
        tactical: 'Alcance: 4 (ataca à distância). Depende do tabuleiro.',
        notes: 'Sinergia com tiles de FOGO. ATK 3 (o mais alto dos magos).'
    },

    // ---- ARQUEIROS ----
    'Juruá': {
        paName: 'Flecha em Área',
        paDesc: 'Juruá dispara uma flecha especial que explode em área 3×3 ao atingir o alvo, causando dano a tudo ao redor.',
        paExtra: 'Área 3×3 centrada no alvo.',
        tactical: 'Alcance: 3 (ataca à distância). Precisa 3+ tiles.',
        notes: 'Excelente contra múltiplos inimigos.'
    },
    'Araci': {
        paName: 'Lâmina do Vento',
        paDesc: 'Araci dispara uma flecha que corta o ar em linha reta horizontal, criando uma lâmina de vento que atravessa o tabuleiro.',
        paExtra: 'Linha horizontal inteira (8 tiles).',
        tactical: 'Alcance: 3 (ataca à distância). Rápida.',
        notes: 'Ideal contra linhas de inimigos.'
    },
    'Bicho Folharal': {
        paName: 'Cruz Completa',
        paDesc: 'Bicho Folharal dispara uma flecha que se divide em quatro, criando uma cruz perfeita de vento ao redor do alvo — linha horizontal + coluna vertical.',
        paExtra: 'Cruz completa: 8 tiles na horizontal + 7 na vertical (15 tiles).',
        tactical: 'Alcance: 3 (ataca à distância). O PA com maior cobertura.',
        notes: 'Não sobra inimigo em linha reta.'
    },
    "Tapyra'yawara": {
        paName: 'Coluna do Caçador',
        paDesc: "Tapyra'yawara mira o alvo e dispara uma flecha de pedra que invoca uma coluna vertical de terra, prendendo e esmagando tudo na coluna do alvo.",
        paExtra: 'Coluna vertical inteira no alvo (8 tiles).',
        tactical: 'Alcance: 3 (ataca à distância). 12 HP.',
        notes: 'Um dos mais resistentes dos arqueiros.'
    },
};

// =================================================================
// 🎯 Mini-grid visual — desenha os tiles afetados pelo PA
// =================================================================
function renderPAMiniGrid(heroClass) {
    const heroData = STORY_HERO_CLASSES[heroClass];
    if (!heroData) return '';

    // Centro (posição do herói) — para o mini-grid fica em (3, 4)
    const CX = 3;
    const CY = 4;
    const gridSize = 8;

    // Matriz 8×8 de flags
    const afetados = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

    const paKey = heroData.paKey;
    const targetMock = { x: 3, y: 2 };  // alvo fica 2 tiles acima do herói

    // ---- Define os tiles afetados por cada PA ----
    if (paKey === 'base_coluna' || paKey === 'paje_coluna_fogo' || paKey === 'tapyra_coluna_alvo') {
        // Coluna vertical — se for no alvo, usa coluna do alvo; senão, coluna do herói
        const col = (paKey === 'tapyra_coluna_alvo') ? targetMock.x : CX;
        for (let y = 0; y < gridSize; y++) afetados[y][col] = true;
    }
    else if (paKey === 'base_linha_cura' || paKey === 'eru_linha_horizontal' || paKey === 'araci_linha_horizontal') {
        // Linha horizontal no herói
        for (let x = 0; x < gridSize; x++) afetados[CY][x] = true;
    }
    else if (paKey === 'base_area_alvo') {
        // Área 3×3 no alvo
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = targetMock.x + dx;
                const ny = targetMock.y + dy;
                if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) afetados[ny][nx] = true;
            }
        }
    }
    else if (paKey === 'kanarott_cruz_empurra') {
        // Cruz 5×5
        for (let i = -2; i <= 2; i++) {
            const ny = CY + i;
            if (ny >= 0 && ny < gridSize) afetados[ny][CX] = true;
        }
        for (let i = -2; i <= 2; i++) {
            if (i === 0) continue;
            const nx = CX + i;
            if (nx >= 0 && nx < gridSize) afetados[CY][nx] = true;
        }
    }
    else if (paKey === 'teperesik_area2x2') {
        // Área 3×3 (sem centro)
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const nx = CX + dx;
                const ny = CY + dy;
                if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) afetados[ny][nx] = true;
            }
        }
    }
    else if (paKey === 'andure_area2x2_cura') {
        // Área 3×3 (com centro)
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = CX + dx;
                const ny = CY + dy;
                if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) afetados[ny][nx] = true;
            }
        }
    }
    else if (paKey === 'maedamata_area3x3_cura') {
        // Área 5×5
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
                const nx = CX + dx;
                const ny = CY + dy;
                if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) afetados[ny][nx] = true;
            }
        }
    }
    else if (paKey === 'jurua_area_alvo_3x3') {
        // Área 3×3 no alvo
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = targetMock.x + dx;
                const ny = targetMock.y + dy;
                if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) afetados[ny][nx] = true;
            }
        }
    }
    else if (paKey === 'bicho_cruz_completa') {
        // Cruz completa no alvo
        for (let x = 0; x < gridSize; x++) afetados[targetMock.y][x] = true;
        for (let y = 0; y < gridSize; y++) afetados[y][targetMock.x] = true;
    }

    // ---- Desenha o mini-grid usando as mesmas classes dos tiles ----
    const ELEMENT_COLORS = {
        FOGO:  'bg-FOGO',
        AGUA:  'bg-AGUA',
        TERRA: 'bg-TERRA',
        AR:    'bg-AR',
    };

    // Elemento mostrado no grid
    const heroElement = heroData.element || 'FOGO';
    const baseClass = ELEMENT_COLORS[heroElement] || 'bg-FOGO';

    let html = '<div class="pa-mini-grid">';
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const isHero = (x === CX && y === CY);
            const isAfetado = afetados[y][x];

            let cls = 'pa-mini-tile';
            if (isHero) {
                cls += ' pa-mini-hero ' + baseClass;
            } else if (isAfetado) {
                cls += ' pa-mini-afetado ' + baseClass;
            } else {
                cls += ' pa-mini-vazio';
            }

            html += `<div class="${cls}">${isHero ? '⭐' : ''}</div>`;
        }
    }
    html += '</div>';
    return html;
}

// =================================================================
// 📖 Painel lateral de detalhes do herói
// =================================================================
function openHeroDetails(heroClass) {
    const heroData = STORY_HERO_CLASSES[heroClass];
    if (!heroData) return;

    const details = STORY_HERO_DETAILS[heroClass];
    if (!details) return;

    // Fecha se já estiver aberto
    closeHeroDetails();

    // Elemento mostrado
    const saveEl = getSaveElement();
    const el = heroData.element || saveEl;
    const elDisplay = heroData.element ? heroData.element : `${saveEl} (dinâmico)`;

    // Sprite do herói
    let spriteSrc = '';
    if (heroData.spriteKey) {
        const url = SPRITES_STORY[heroData.spriteKey];
        spriteSrc = url && url.trim() !== '' ? url : '';
    } else if (typeof SPRITES !== 'undefined' && SPRITES[heroClass]) {
        spriteSrc = SPRITES[heroClass];
    }

    const spriteHTML = spriteSrc
        ? `<img src="${spriteSrc}" class="hero-details-sprite" alt="${heroData.displayName}">`
        : `<div class="hero-details-sprite" style="display:flex;align-items:center;justify-content:center;font-size:4rem;">${EMOJI_STORY[heroData.spriteKey] || '?'}</div>`;

    // Imagem real do PA (opcional)
    const paImageUrl = STORY_HERO_PA_IMAGES[heroClass];
    const hasPaImage = paImageUrl && paImageUrl.trim() !== '';

    const paImageHTML = hasPaImage
        ? `<div class="hero-details-pa-image-wrap"><img src="${paImageUrl}" class="hero-details-pa-image" alt="${details.paName}" onerror="this.parentNode.innerHTML='${renderPAMiniGrid(heroClass).replace(/'/g, "\\'")}'"></div>`
        : `<div class="hero-details-pa-image-wrap">${renderPAMiniGrid(heroClass)}</div>`;

    // Overlay + painel
    const overlay = document.createElement('div');
    overlay.id = 'heroDetailsOverlay';
    overlay.className = 'hero-details-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) closeHeroDetails(); };

    const panel = document.createElement('div');
    panel.className = 'hero-details-panel';

    panel.innerHTML = `
        <div class="hero-details-header">
            ${spriteHTML}
            <div class="hero-details-title-wrap">
                <h2 class="hero-details-name">${heroData.displayName}</h2>
                <div class="hero-details-role elem-${el}">${elemIcon(el)} ${heroData.role} · ${elDisplay}</div>
            </div>
            <button class="hero-details-close" onclick="closeHeroDetails()">✕</button>
        </div>

        <div class="hero-details-section">
            <div class="hero-details-section-title">📊 ATRIBUTOS</div>
            <div class="hero-details-stats">
                <div class="hero-details-stat">
                    <div class="hero-details-stat-label">HP</div>
                    <div class="hero-details-stat-value">${heroData.hp}</div>
                </div>
                <div class="hero-details-stat">
                    <div class="hero-details-stat-label">ATK</div>
                    <div class="hero-details-stat-value">${heroData.atk}</div>
                </div>
                <div class="hero-details-stat">
                    <div class="hero-details-stat-label">Alcance</div>
                    <div class="hero-details-stat-value">${heroData.range === 0 ? '1 (corpo)' : heroData.range}</div>
                </div>
                <div class="hero-details-stat">
                    <div class="hero-details-stat-label">Papel</div>
                    <div class="hero-details-stat-value">${heroData.role}</div>
                </div>
            </div>
            <div class="hero-details-note">${details.tactical}</div>
        </div>

        <div class="hero-details-section">
            <div class="hero-details-section-title">⚡ PODER ANCESTRAL</div>
            <div class="hero-details-pa-name">${details.paName}</div>
            <div class="hero-details-pa-desc">${details.paDesc}</div>
            <div class="hero-details-pa-extra">${details.paExtra}</div>
        </div>

        <div class="hero-details-section">
            <div class="hero-details-section-title">🎯 ÁREA AFETADA</div>
            ${paImageHTML}
            <div class="hero-details-legend">
                <span class="hero-details-legend-item"><span class="hero-details-legend-mark pa-mini-hero-mark">⭐</span> Herói</span>
                <span class="hero-details-legend-item"><span class="hero-details-legend-mark pa-mini-afetado-mark"></span> Tile afetado</span>
                <span class="hero-details-legend-item"><span class="hero-details-legend-mark pa-mini-vazio-mark"></span> Não afetado</span>
            </div>
        </div>

        <div class="hero-details-section hero-details-notes">
            <div class="hero-details-section-title">📝 NOTAS</div>
            <div class="hero-details-note">${details.notes}</div>
        </div>
    `;

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // Pequeno delay pra animação do painel
    requestAnimationFrame(() => overlay.classList.add('open'));
}

function closeHeroDetails() {
    const ov = document.getElementById('heroDetailsOverlay');
    if (!ov) return;
    ov.classList.remove('open');
    setTimeout(() => {
        if (ov.parentNode) ov.parentNode.removeChild(ov);
    }, 300);
}

// =================================================================
// 🎨 Modifica o card do herói na OCA para incluir o botão "?"
// -----------------------------------------------------------------
// Sobrescreve renderOcaScreen (do bloco anterior) para adicionar o botão.
// =================================================================
(function patchOcaScreenWithDetailsButton() {
    const _origRenderOcaScreen = window.renderOcaScreen;

    window.renderOcaScreen = function() {
        // Chama a versão original
        if (typeof _origRenderOcaScreen === 'function') {
            _origRenderOcaScreen.apply(this, arguments);
        }

        // Depois de renderizar, injeta o botão "?" em cada card desbloqueado
        const cards = document.querySelectorAll('.story-hero-card');
        cards.forEach(card => {
            if (card.classList.contains('locked')) return;
            if (card.querySelector('.hero-details-btn')) return;  // já tem

            // Descobre qual herói é esse card
            const onclickAttr = card.getAttribute('onclick') || '';
            const match = onclickAttr.match(/toggleHeroSelection\('([^']+)'\)/);
            if (!match) return;
            const heroClass = match[1];

            // Cria o botão
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

    console.log('✅ OCA patcheada com botão de detalhes.');
})();

// =================================================================
// 🌐 Expõe no window
// =================================================================
window.openHeroDetails = openHeroDetails;
window.closeHeroDetails = closeHeroDetails;
window.renderPAMiniGrid = renderPAMiniGrid;
window.STORY_HERO_DETAILS = STORY_HERO_DETAILS;
window.STORY_HERO_PA_IMAGES = STORY_HERO_PA_IMAGES;

console.log('✅ Painel de detalhes do herói carregado.');
// =================================================================
// 🎨 CSS do painel de detalhes do herói
// =================================================================
(function injectHeroDetailsCSS() {
    if (document.getElementById('heroDetailsStyle')) return;
    const style = document.createElement('style');
    style.id = 'heroDetailsStyle';
    style.textContent = `
        /* ---- Botão "?" no card ---- */
        .hero-details-btn {
            position: absolute;
            top: 8px;
            left: 8px;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3a7ca5, #1e4a70);
            color: #d0e8f5;
            border: 2px solid #4a8cb5;
            font-family: 'Cinzel', serif;
            font-weight: 900;
            font-size: 1rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            z-index: 10;
            box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        }
        .hero-details-btn:hover {
            transform: scale(1.15);
            background: linear-gradient(135deg, #4a8cb5, #2a5570);
            border-color: #6ab0d8;
            box-shadow: 0 4px 12px rgba(74, 140, 181, 0.5);
        }
        .hero-details-btn:active { transform: scale(0.95); }

        /* ---- Overlay ---- */
        .hero-details-overlay {
            position: fixed;
            inset: 0;
            background: rgba(10, 6, 2, 0.85);
            z-index: 10050;
            display: flex;
            justify-content: flex-end;
            opacity: 0;
            transition: opacity 0.3s ease;
            backdrop-filter: blur(3px);
        }
        .hero-details-overlay.open { opacity: 1; }

        /* ---- Painel lateral ---- */
        .hero-details-panel {
            width: 100%;
            max-width: 460px;
            height: 100%;
            background:
                radial-gradient(ellipse at top, rgba(201, 162, 39, 0.06), transparent 50%),
                linear-gradient(180deg, #2a1f10 0%, #1a1208 100%);
            border-left: 3px solid #c9a227;
            overflow-y: auto;
            padding: 0;
            transform: translateX(100%);
            transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.3, 1);
            box-shadow: -15px 0 40px rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            scrollbar-width: thin;
            scrollbar-color: #6a5024 transparent;
        }
        .hero-details-overlay.open .hero-details-panel {
            transform: translateX(0);
        }
        .hero-details-panel::-webkit-scrollbar { width: 6px; }
        .hero-details-panel::-webkit-scrollbar-thumb {
            background: #6a5024;
            border-radius: 3px;
        }

        /* ---- Cabeçalho ---- */
        .hero-details-header {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 20px;
            background:
                linear-gradient(180deg, rgba(232, 185, 35, 0.1), transparent 100%),
                rgba(10, 6, 2, 0.5);
            border-bottom: 2px solid rgba(201, 162, 39, 0.3);
            position: relative;
            flex-shrink: 0;
        }
        .hero-details-sprite {
            width: 72px;
            height: 72px;
            object-fit: contain;
            filter: drop-shadow(0 0 8px rgba(232, 185, 35, 0.5));
            flex-shrink: 0;
        }
        .hero-details-title-wrap {
            flex: 1;
            min-width: 0;
        }
        .hero-details-name {
            font-family: 'Cinzel Decorative', serif;
            color: #e8b923;
            font-size: 1.4rem;
            letter-spacing: 2px;
            margin: 0 0 4px 0;
            text-shadow: 0 2px 6px rgba(0, 0, 0, 0.8);
            line-height: 1.1;
        }
        .hero-details-role {
            font-family: 'Cinzel', serif;
            font-size: 0.85rem;
            letter-spacing: 1px;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        .hero-details-role img {
            width: 18px;
            height: 18px;
            object-fit: contain;
        }
        .hero-details-close {
            position: absolute;
            top: 12px;
            right: 12px;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6a2020, #3a1010);
            color: #f5c8c8;
            border: 1px solid #a83232;
            font-family: 'Cinzel', serif;
            font-weight: 900;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .hero-details-close:hover {
            background: linear-gradient(135deg, #8a3030, #4a1414);
            transform: rotate(90deg);
        }

        /* ---- Seções ---- */
        .hero-details-section {
            padding: 16px 20px;
            border-bottom: 1px solid rgba(201, 162, 39, 0.15);
        }
        .hero-details-section:last-child { border-bottom: none; }

        .hero-details-section-title {
            font-family: 'Cinzel', serif;
            color: #e8b923;
            font-size: 0.8rem;
            letter-spacing: 2px;
            margin-bottom: 12px;
            text-transform: uppercase;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        /* ---- Stats em grade ---- */
        .hero-details-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 12px;
        }
        .hero-details-stat {
            background: rgba(10, 6, 2, 0.6);
            border: 1px solid rgba(201, 162, 39, 0.25);
            border-radius: 6px;
            padding: 8px 4px;
            text-align: center;
            transition: all 0.2s;
        }
        .hero-details-stat:hover {
            border-color: #c9a227;
            background: rgba(201, 162, 39, 0.08);
        }
        .hero-details-stat-label {
            font-family: 'Cinzel', serif;
            font-size: 0.65rem;
            color: #8a7a52;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .hero-details-stat-value {
            font-family: 'Cinzel', serif;
            font-size: 1.1rem;
            color: #e8b923;
            font-weight: 700;
            line-height: 1;
        }

        /* ---- Nome do PA ---- */
        .hero-details-pa-name {
            font-family: 'Cinzel Decorative', serif;
            color: #c39bd3;
            font-size: 1.1rem;
            letter-spacing: 1.5px;
            margin-bottom: 10px;
            text-shadow: 0 0 10px rgba(142, 68, 173, 0.5);
        }
        .hero-details-pa-desc {
            font-family: 'EB Garamond', serif;
            color: #e8dcc4;
            font-size: 1rem;
            line-height: 1.55;
            margin-bottom: 10px;
            font-style: italic;
        }
        .hero-details-pa-extra {
            font-family: 'EB Garamond', serif;
            color: #8ac070;
            font-size: 0.9rem;
            line-height: 1.45;
            padding: 10px 12px;
            background: rgba(107, 163, 92, 0.1);
            border-left: 3px solid #6ba35c;
            border-radius: 4px;
            font-weight: 600;
        }
        .hero-details-note {
            font-family: 'EB Garamond', serif;
            color: #b8a577;
            font-size: 0.9rem;
            line-height: 1.45;
            font-style: italic;
            padding: 8px 12px;
            background: rgba(10, 6, 2, 0.4);
            border-left: 3px solid #6a5024;
            border-radius: 4px;
        }

        /* ---- Mini-grid 8×8 ---- */
        .hero-details-pa-image-wrap {
            display: flex;
            justify-content: center;
            padding: 15px;
            background: rgba(10, 6, 2, 0.5);
            border: 1px solid rgba(201, 162, 39, 0.2);
            border-radius: 8px;
            margin-bottom: 12px;
            min-height: 200px;
            align-items: center;
        }
        .hero-details-pa-image {
            max-width: 100%;
            max-height: 280px;
            object-fit: contain;
            border-radius: 6px;
            filter: drop-shadow(0 0 15px rgba(232, 185, 35, 0.5));
        }

        .pa-mini-grid {
            display: grid;
            grid-template-columns: repeat(8, 24px);
            grid-template-rows: repeat(8, 24px);
            gap: 2px;
            padding: 8px;
            background: linear-gradient(180deg, #1f1608, #0d0805);
            border: 2px solid #3d2d18;
            border-radius: 6px;
            box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.6);
        }
        .pa-mini-tile {
            width: 24px;
            height: 24px;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            transition: transform 0.2s;
            position: relative;
        }
        .pa-mini-hero {
            border: 2px solid #e8b923;
            box-shadow:
                0 0 10px rgba(232, 185, 35, 0.9),
                inset 0 0 6px rgba(255, 255, 255, 0.3);
            transform: scale(1.15);
            z-index: 3;
            font-size: 13px;
            line-height: 1;
        }
        .pa-mini-afetado {
            opacity: 0.95;
            box-shadow:
                inset 0 0 6px rgba(0, 0, 0, 0.4),
                0 0 4px rgba(232, 185, 35, 0.4);
            border: 1px solid rgba(232, 185, 35, 0.5);
        }
        .pa-mini-vazio {
            background: rgba(10, 6, 2, 0.5);
            border: 1px solid rgba(61, 45, 24, 0.6);
        }

        /* ---- Legenda ---- */
        .hero-details-legend {
            display: flex;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
            font-family: 'EB Garamond', serif;
            font-size: 0.8rem;
            color: #b8a577;
        }
        .hero-details-legend-item {
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        .hero-details-legend-mark {
            display: inline-block;
            width: 16px;
            height: 16px;
            border-radius: 3px;
        }
        .pa-mini-hero-mark {
            background: linear-gradient(135deg, #b73a3a, #8a2424);
            border: 2px solid #e8b923;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #fff;
            line-height: 1;
        }
        .pa-mini-afetado-mark {
            background: linear-gradient(135deg, #b73a3a, #8a2424);
            opacity: 0.95;
            border: 1px solid rgba(232, 185, 35, 0.5);
        }
        .pa-mini-vazio-mark {
            background: rgba(10, 6, 2, 0.5);
            border: 1px solid rgba(61, 45, 24, 0.6);
        }

        /* ---- Notas finais ---- */
        .hero-details-notes {
            background: rgba(201, 162, 39, 0.03);
        }

        /* ---- Responsivo ---- */
        @media (max-width: 600px) {
            .hero-details-panel { max-width: 100%; }
            .hero-details-name { font-size: 1.15rem; }
            .hero-details-sprite { width: 56px; height: 56px; }
            .hero-details-stats { grid-template-columns: repeat(2, 1fr); }
            .pa-mini-grid {
                grid-template-columns: repeat(8, 18px);
                grid-template-rows: repeat(8, 18px);
                gap: 1px;
            }
            .pa-mini-tile { width: 18px; height: 18px; font-size: 11px; }
            .pa-mini-hero { font-size: 10px; }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS do painel de detalhes injetado.');
})();
// =================================================================
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

// Hook: substitui o enterAldeiaLocation para abrir o Ritual
(function patchEnterAldeiaLocationForRitual() {
    const _orig = window.enterAldeiaLocation;
    window.enterAldeiaLocation = function(key) {
        if (key === 'ritual') return renderRitualScreen();
        return _orig.apply(this, arguments);
    };
})();

// Hook: aplica bônus de nível ao herói em batalha
(function patchInitStoryBattleForLevels() {
    const _origInitBattle = window.initStoryBattle;
    if (typeof _origInitBattle !== 'function') return;
    window.initStoryBattle = async function() {
        await _origInitBattle.apply(this, arguments);
        if (Array.isArray(players)) {
            players.forEach(p => applyHeroLevelBonus(p));
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

// Hook: substitui o enterAldeiaLocation para abrir o Bestiário
(function patchEnterAldeiaLocationForBestiary() {
    const _orig = window.enterAldeiaLocation;
    window.enterAldeiaLocation = function(key) {
        if (key === 'bestiario') return renderBestiaryScreen();
        return _orig.apply(this, arguments);
    };
})();

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

// Hook: substitui o enterAldeiaLocation para a OCA usar filtros
(function patchEnterAldeiaLocationForOcaFilters() {
    const _orig = window.enterAldeiaLocation;
    window.enterAldeiaLocation = function(key) {
        if (key === 'oca') return renderOcaScreenFiltered();
        return _orig.apply(this, arguments);
    };
})();

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
            const match = onclickAttr.match(/toggleHeroSelection\('([^']+)'\)/);
            if (!match) return;
            const heroClass = match[1];

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

// Hook: substitui enterAldeiaLocation para Tesouraria
(function patchEnterAldeiaForTesouraria() {
    const _orig = window.enterAldeiaLocation;
    window.enterAldeiaLocation = function(key) {
        if (key === 'tesouraria') {
            return renderTesourariaScreen();
        }
        return _orig.apply(this, arguments);
    };
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
// historia.js — V8.5 — ATMOSFERA DO TABULEIRO (versão limpa)
// -----------------------------------------------------------------
// Um único CSS, sem conflitos, com posicionamento correto das
// partículas (percentual relativo ao container pai via top/bottom).
// =================================================================

// =================================================================
// 1. MAPA DE ATMOSFERA POR ATO
// =================================================================
const STORY_ATO_ATMOSPHERE = {
    1:  'atm-folhas',
    2:  'atm-nevoa-ambar',
    3:  'atm-agua',
    4:  'atm-brasas',
    5:  'atm-chamas',
    6:  'atm-poeira',
    7:  'atm-luar',
    8:  'atm-fumaca-roxa',
    9:  'atm-rio-bolhas',
    10: 'atm-tempestade',
    11: 'atm-estrelas',
    12: 'atm-sol',
    13: 'atm-abismo',
};

// =================================================================
// 2. CSS LIMPO
// =================================================================
(function injectCleanAtmosphereCSS() {
    const old = document.getElementById('atmosphereStyleClean');
    if (old) old.remove();

    const style = document.createElement('style');
    style.id = 'atmosphereStyleClean';
    style.textContent = `
        /* ============ BOARD ============ */
        #board {
            position: relative;
        }

        /* ============ CAMADAS ============ */
        #board > .board-atmosphere {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            border-radius: 6px;
            overflow: hidden;
            z-index: 0;
        }
        #board > .board-particles {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
            border-radius: 6px;
            z-index: 3;
        }
        #board > .grid {
            position: relative;
            z-index: 1;
        }
        #board > .token {
            z-index: 10;
        }
        #board > .story-fx,
        #board > [class*="fx-"] {
            z-index: 50;
        }

        /* ============ PARTÍCULAS ============ */
        .atm-particle {
            position: absolute;
            pointer-events: none;
            opacity: 0;
            will-change: top, bottom, left, transform, opacity;
        }

        /* 1. FOLHAS */
        .atm-particle.pt-folha {
            top: -30px;
            width: var(--p-size, 8px);
            height: var(--p-size, 8px);
            background: linear-gradient(135deg, #6a8a4a, #3a5020);
            border-radius: 50% 10% 50% 10%;
            box-shadow: 0 0 4px rgba(0,0,0,0.4);
            animation: folhaFall linear infinite;
        }
        @keyframes folhaFall {
            0%   { top: -30px;             transform: translateX(0) rotate(0deg); opacity: 0; }
            10%  { opacity: 0.85; }
            50%  { top: 50%;               transform: translateX(20px) rotate(180deg); opacity: 0.9; }
            90%  { opacity: 0.7; }
            100% { top: calc(100% + 30px); transform: translateX(-15px) rotate(360deg); opacity: 0; }
        }

        /* 2. NÉVOA ÂMBAR */
        .atm-particle.pt-poeira-ambar {
            bottom: -30px;
            width: var(--p-size, 5px);
            height: var(--p-size, 5px);
            background: radial-gradient(circle, #d9b840, rgba(217,184,64,0));
            border-radius: 50%;
            animation: poeiraFlutua ease-in-out infinite;
        }
        @keyframes poeiraFlutua {
            0%   { bottom: -30px;             transform: translateX(0) scale(0.6); opacity: 0; }
            30%  { opacity: 0.9; }
            50%  { bottom: 40%;               transform: translateX(15px) scale(1.1); opacity: 0.7; }
            80%  { opacity: 0.6; }
            100% { bottom: calc(100% + 30px); transform: translateX(-10px) scale(0.7); opacity: 0; }
        }

        /* 3. ÁGUA (BOLHAS) */
        .atm-particle.pt-bolha {
            bottom: -20px;
            width: var(--p-size, 8px);
            height: var(--p-size, 8px);
            background: radial-gradient(circle at 30% 30%, rgba(200,230,245,0.9), rgba(74,140,181,0.5) 60%, transparent 100%);
            border: 1px solid rgba(200,230,245,0.4);
            border-radius: 50%;
            animation: bolhaSobe ease-in infinite;
        }
        @keyframes bolhaSobe {
            0%   { bottom: -20px;             transform: translateX(0) scale(0.5); opacity: 0; }
            20%  { opacity: 0.9; }
            80%  { opacity: 0.7; }
            100% { bottom: calc(100% + 20px); transform: translateX(10px) scale(1.2); opacity: 0; }
        }

        /* 4. BRASAS */
        .atm-particle.pt-brasa {
            bottom: -20px;
            width: var(--p-size, 5px);
            height: var(--p-size, 5px);
            background: radial-gradient(circle, #fff5dc 0%, #e67e22 40%, #a83232 80%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 6px rgba(232, 110, 35, 0.8);
            animation: brasaSubindo ease-out infinite;
        }
        @keyframes brasaSubindo {
            0%   { bottom: -20px;             transform: translateX(0) scale(0.4); opacity: 0; }
            15%  { opacity: 1; }
            70%  { opacity: 0.9; }
            100% { bottom: calc(100% + 20px); transform: translateX(20px) scale(0.3); opacity: 0; }
        }

        /* 5. FAÍSCAS */
        .atm-particle.pt-faisca {
            bottom: -10px;
            width: var(--p-size, 4px);
            height: var(--p-size, 4px);
            background: #e8b923;
            border-radius: 50%;
            box-shadow: 0 0 8px #e8b923, 0 0 14px rgba(232,185,35,0.6);
            animation: faiscaPula ease-out infinite;
        }
        @keyframes faiscaPula {
            0%   { bottom: -10px;             transform: translateX(0) scale(0.3); opacity: 0; }
            20%  { opacity: 1; }
            60%  { opacity: 0.8; }
            100% { bottom: calc(100% + 10px); transform: translateX(30px) scale(0.2); opacity: 0; }
        }

        /* 6. POEIRA */
        .atm-particle.pt-poeira {
            left: -30px;
            width: var(--p-size, 6px);
            height: var(--p-size, 6px);
            background: radial-gradient(circle, rgba(180, 140, 90, 0.8), rgba(139,90,43,0));
            border-radius: 50%;
            animation: poeiraHorizontal linear infinite;
        }
        @keyframes poeiraHorizontal {
            0%   { left: -30px;              transform: translateY(0) scale(0.6); opacity: 0; }
            20%  { opacity: 0.7; }
            80%  { opacity: 0.6; }
            100% { left: calc(100% + 30px);  transform: translateY(-10px) scale(0.9); opacity: 0; }
        }

        /* 7. LUAR */
        .atm-particle.pt-luar {
            bottom: -20px;
            width: var(--p-size, 5px);
            height: var(--p-size, 5px);
            background: radial-gradient(circle, #d0e0f0, rgba(168,192,216,0));
            border-radius: 50%;
            box-shadow: 0 0 6px rgba(168,192,216,0.8);
            animation: luarSobe ease-in-out infinite;
        }
        @keyframes luarSobe {
            0%   { bottom: -20px;             transform: scale(0.5); opacity: 0; }
            30%  { opacity: 0.8; }
            70%  { opacity: 0.7; }
            100% { bottom: calc(100% + 20px); transform: scale(1); opacity: 0; }
        }

        /* 8. FUMAÇA ROXA + COGUMELOS */
        .atm-particle.pt-fumaca {
            bottom: -30px;
            width: var(--p-size, 14px);
            height: var(--p-size, 14px);
            background: radial-gradient(circle, rgba(142,68,173,0.7) 0%, rgba(90,42,112,0.4) 40%, transparent 75%);
            border-radius: 50%;
            filter: blur(3px);
            animation: fumacaSobe ease-in-out infinite;
        }
        @keyframes fumacaSobe {
            0%   { bottom: -30px;             transform: translateX(0) scale(0.5); opacity: 0; }
            30%  { opacity: 0.6; }
            70%  { opacity: 0.5; }
            100% { bottom: calc(100% + 30px); transform: translateX(20px) scale(1.4); opacity: 0; }
        }
        .atm-particle.pt-cogumelo {
            top: 50%;
            width: var(--p-size, 7px);
            height: var(--p-size, 7px);
            background: radial-gradient(circle, #c080e0 0%, #8e44ad 60%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(192,128,224,0.9);
            animation: cogumeloPisca ease-in-out infinite;
        }
        @keyframes cogumeloPisca {
            0%, 100% { opacity: 0.3; transform: scale(0.7); }
            50%      { opacity: 1;   transform: scale(1.2); }
        }

        /* 9. RIO */
        .atm-particle.pt-bolha-rio {
            bottom: -20px;
            width: var(--p-size, 8px);
            height: var(--p-size, 8px);
            background: radial-gradient(circle at 30% 30%, rgba(232,67,147,0.7), rgba(52,152,219,0.4) 60%, transparent 100%);
            border: 1px solid rgba(232, 67, 147, 0.5);
            border-radius: 50%;
            animation: bolhaRioSobe ease-in infinite;
        }
        @keyframes bolhaRioSobe {
            0%   { bottom: -20px;             transform: translateX(0) scale(0.5); opacity: 0; }
            20%  { opacity: 0.9; }
            80%  { opacity: 0.7; }
            100% { bottom: calc(100% + 20px); transform: translateX(-10px) scale(1.3); opacity: 0; }
        }

        /* 10. GOTAS */
        .atm-particle.pt-gota {
            top: -20px;
            width: 2px;
            height: 10px;
            background: linear-gradient(180deg, transparent, rgba(168, 192, 216, 0.9));
            animation: gotaCai linear infinite;
        }
        @keyframes gotaCai {
            0%   { top: -20px;             opacity: 0; }
            10%  { opacity: 0.9; }
            100% { top: calc(100% + 20px); opacity: 0.5; }
        }

        /* 11. ESTRELAS */
        .atm-particle.pt-estrela {
            top: 30%;
            width: var(--p-size, 5px);
            height: var(--p-size, 5px);
            background: radial-gradient(circle, #fff5dc, #f1c40f 60%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 8px #f1c40f;
            animation: estrelaPisca ease-in-out infinite;
        }
        @keyframes estrelaPisca {
            0%, 100% { opacity: 0.2; transform: scale(0.7); }
            50%      { opacity: 1;   transform: scale(1.3); }
        }

        /* 12. SOL */
        .atm-particle.pt-sol {
            bottom: -20px;
            width: var(--p-size, 7px);
            height: var(--p-size, 7px);
            background: radial-gradient(circle, #fff5dc 0%, #e8b923 50%, #a83232 100%);
            border-radius: 50%;
            box-shadow: 0 0 12px rgba(232, 185, 35, 0.9);
            animation: solFaisca ease-out infinite;
        }
        @keyframes solFaisca {
            0%   { bottom: -20px;             transform: translateX(0) scale(0.4); opacity: 0; }
            20%  { opacity: 1; }
            60%  { opacity: 0.9; }
            100% { bottom: calc(100% + 20px); transform: translateX(25px) scale(0.3); opacity: 0; }
        }

        /* 13. ABISMO */
        .atm-particle.pt-abismo {
            top: 40%;
            width: var(--p-size, 6px);
            height: var(--p-size, 6px);
            background: radial-gradient(circle, #c080e0, #6a1090 60%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 12px rgba(106, 16, 144, 0.9);
            animation: abismoFlutua ease-in-out infinite;
        }
        @keyframes abismoFlutua {
            0%, 100% { transform: translate(0, 0) scale(0.7); opacity: 0.5; }
            50%      { transform: translate(10px, -15px) scale(1.2); opacity: 1; }
        }

        /* ============ FUNDOS POR ATO ============ */
        .board-atmosphere.atm-folhas-bg {
            background: radial-gradient(ellipse at center, rgba(74,107,58,0.10) 0%, rgba(74,107,58,0.05) 40%, transparent 70%);
        }
        .board-atmosphere.atm-nevoa-ambar-bg {
            background:
                radial-gradient(ellipse at top, rgba(217,184,64,0.10), transparent 55%),
                radial-gradient(ellipse at bottom, rgba(74,60,30,0.20), transparent 60%);
        }
        .board-atmosphere.atm-agua-bg {
            background: linear-gradient(180deg, rgba(52,152,219,0.08) 0%, rgba(52,152,219,0.18) 50%, rgba(52,152,219,0.08) 100%);
        }
        .board-atmosphere.atm-brasas-bg {
            background: radial-gradient(ellipse at bottom, rgba(232,110,35,0.20) 0%, rgba(168,50,50,0.10) 40%, transparent 75%);
        }
        .board-atmosphere.atm-chamas-bg {
            background:
                linear-gradient(90deg, rgba(168,50,50,0.20) 0%, transparent 15%, transparent 85%, rgba(168,50,50,0.20) 100%),
                radial-gradient(ellipse at bottom, rgba(232,110,35,0.15), transparent 60%);
        }
        .board-atmosphere.atm-poeira-bg {
            background:
                radial-gradient(ellipse at top, rgba(217,184,64,0.06), transparent 55%),
                linear-gradient(180deg, rgba(139,90,43,0.10), rgba(74,60,30,0.15));
        }
        .board-atmosphere.atm-luar-bg {
            background:
                radial-gradient(ellipse at top, rgba(168,192,216,0.15), transparent 55%),
                linear-gradient(180deg, rgba(52,73,94,0.10), rgba(15,21,32,0.20));
        }
        .board-atmosphere.atm-fumaca-roxa-bg {
            background:
                radial-gradient(circle at 25% 70%, rgba(142,68,173,0.15), transparent 40%),
                radial-gradient(circle at 75% 30%, rgba(90,42,112,0.15), transparent 40%),
                linear-gradient(180deg, rgba(31,10,42,0.10), rgba(15,5,21,0.20));
        }
        .board-atmosphere.atm-rio-bolhas-bg {
            background: linear-gradient(180deg, rgba(232,67,147,0.05) 0%, rgba(52,152,219,0.12) 50%, rgba(232,67,147,0.08) 100%);
        }
        .board-atmosphere.atm-tempestade-bg {
            background:
                radial-gradient(ellipse at top, rgba(44,62,80,0.20), transparent 55%),
                linear-gradient(180deg, rgba(10,15,21,0.20), rgba(5,8,13,0.30));
        }
        .board-atmosphere.atm-estrelas-bg {
            background:
                radial-gradient(ellipse at top, rgba(241,196,15,0.10), transparent 55%),
                radial-gradient(ellipse at bottom, rgba(168,192,216,0.10), transparent 60%),
                linear-gradient(180deg, rgba(26,21,5,0.10), rgba(13,10,2,0.15));
        }
        .board-atmosphere.atm-sol-bg {
            background:
                radial-gradient(ellipse at top, rgba(230,126,34,0.20), transparent 60%),
                linear-gradient(180deg, rgba(217,184,64,0.10), rgba(168,50,50,0.10));
        }
        .board-atmosphere.atm-abismo-bg {
            background:
                radial-gradient(ellipse at center, rgba(80,20,120,0.20), transparent 60%),
                linear-gradient(180deg, rgba(26,8,37,0.20), rgba(10,4,18,0.30));
        }

        @media (prefers-reduced-motion: reduce) {
            .atm-particle { animation: none !important; }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS limpo da atmosfera injetado.');
})();

// =================================================================
// 3. GERADOR DE PARTÍCULAS
// =================================================================
function generateParticlesForAto(cid) {
    const atmClass = STORY_ATO_ATMOSPHERE[cid];
    if (!atmClass) return '';

    const makeParticles = (count, cls, opts = {}) => {
        let html = '';
        for (let i = 0; i < count; i++) {
            const left = Math.random() * 100;
            const delay = Math.random() * 6;
            const duration = 4 + Math.random() * 4;
            const size = opts.sizeMin + Math.random() * (opts.sizeMax - opts.sizeMin);

            html += `<div class="atm-particle ${cls}"
                          style="left:${left}%;animation-delay:-${delay}s;animation-duration:${duration}s;--p-size:${size}px;"></div>`;
        }
        return html;
    };

    switch (atmClass) {
        case 'atm-folhas':      return makeParticles(14, 'pt-folha',         { sizeMin:6,  sizeMax:12 });
        case 'atm-nevoa-ambar': return makeParticles(12, 'pt-poeira-ambar',  { sizeMin:3,  sizeMax:6  });
        case 'atm-agua':        return makeParticles(16, 'pt-bolha',         { sizeMin:4,  sizeMax:10 });
        case 'atm-brasas':      return makeParticles(18, 'pt-brasa',         { sizeMin:3,  sizeMax:6  });
        case 'atm-chamas':      return makeParticles(20, 'pt-faisca',        { sizeMin:2,  sizeMax:5  });
        case 'atm-poeira':      return makeParticles(14, 'pt-poeira',        { sizeMin:4,  sizeMax:8  });
        case 'atm-luar':        return makeParticles(12, 'pt-luar',          { sizeMin:3,  sizeMax:6  });
        case 'atm-fumaca-roxa': return makeParticles(10, 'pt-fumaca',        { sizeMin:8,  sizeMax:16 })
                                     + makeParticles(8,  'pt-cogumelo',      { sizeMin:5,  sizeMax:9  });
        case 'atm-rio-bolhas':  return makeParticles(20, 'pt-bolha-rio',     { sizeMin:4,  sizeMax:10 });
        case 'atm-tempestade':  return makeParticles(24, 'pt-gota',          { sizeMin:2,  sizeMax:4  });
        case 'atm-estrelas':    return makeParticles(20, 'pt-estrela',       { sizeMin:3,  sizeMax:7  });
        case 'atm-sol':         return makeParticles(16, 'pt-sol',           { sizeMin:4,  sizeMax:9  });
        case 'atm-abismo':      return makeParticles(16, 'pt-abismo',        { sizeMin:4,  sizeMax:8  });
        default:                return '';
    }
}

// =================================================================
// 4. APLICAR / LIMPAR ATMOSFERA
// =================================================================
function clearBoardAtmosphere() {
    const board = document.getElementById('board');
    if (!board) return;

    board.querySelectorAll(':scope > .board-atmosphere, :scope > .board-particles').forEach(el => el.remove());

    board.classList.forEach(cls => {
        if (cls.startsWith('atm-')) board.classList.remove(cls);
    });
    board.classList.remove('has-atmosphere');
}

function applyBoardAtmosphere(cid) {
    const board = document.getElementById('board');
    if (!board) return;
    if (!window._storyMode) return;
    if (!cid) return;

    clearBoardAtmosphere();

    const atmClass = STORY_ATO_ATMOSPHERE[cid];
    if (!atmClass) return;

    board.classList.add(atmClass);
    board.classList.add('has-atmosphere');

    // Camada de fundo
    const atmos = document.createElement('div');
    atmos.className = 'board-atmosphere ' + atmClass + '-bg';
    board.appendChild(atmos);

    // Camada de partículas
    const part = document.createElement('div');
    part.className = 'board-particles ' + atmClass + '-pt';
    part.innerHTML = generateParticlesForAto(cid);
    board.appendChild(part);

    // Reorganiza a ordem no DOM (grid primeiro, atmosfera, partículas)
    const grid = board.querySelector(':scope > .grid');
    if (grid && grid !== board.firstElementChild) {
        board.insertBefore(grid, board.firstElementChild);
    }

    console.log('[atmosfera] Aplicada no Ato', cid, '→', atmClass);
}

// =================================================================
// 5. HOOKS
// =================================================================
(function hookAtmosphereInit() {
    const _origInit = window.initStoryBattle;
    if (typeof _origInit !== 'function') return;

    window.initStoryBattle = async function() {
        await _origInit.apply(this, arguments);
        // Espera dois frames pra garantir que o DOM está pronto
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const cid = STORY_PROGRESS.currentChapter || 1;
        applyBoardAtmosphere(cid);
    };
})();

(function hookAtmosphereCleanup() {
    const _origFinish = window.finishStoryPhase;
    if (typeof _origFinish === 'function') {
        window.finishStoryPhase = function() {
            clearBoardAtmosphere();
            return _origFinish.apply(this, arguments);
        };
    }
    const _origReturn = window.returnFromStoryVictory;
    if (typeof _origReturn === 'function') {
        window.returnFromStoryVictory = function() {
            clearBoardAtmosphere();
            return _origReturn.apply(this, arguments);
        };
    }
})();

// =================================================================
// 6. TESTES
// =================================================================
window.testAtmosphere = function(cid) {
    cid = parseInt(cid) || 1;
    applyBoardAtmosphere(cid);
    console.log('[atmosfera] Testando Ato', cid);
};
window.clearAtmosphere = function() {
    clearBoardAtmosphere();
    console.log('[atmosfera] Limpa.');
};

console.log('✅ historia.js V8.5 — Atmosfera LIMPA carregada.');
// =================================================================
// historia.js — V8.6 — Fixes:
//   1. Sprite do boss não some na lateral
//   2. Bravely continua mesmo se o boss morrer (versão SEGURA)
// -----------------------------------------------------------------
// Importante: esta versão NÃO sobrescreve executeAction.
// Só intercepta o triggerBravelyChain quando o target está morto.
// =================================================================

// =================================================================
// FIX 1 — updateBossCard usa SPRITES_STORY no modo história
// =================================================================
(function fixBossCardSprite() {
    const _origUpdateBossCard = window.updateBossCard;
    if (typeof _origUpdateBossCard !== 'function') return;

    window.updateBossCard = function() {
        // Fora do modo história → original
        if (!window._storyMode) {
            return _origUpdateBossCard.apply(this, arguments);
        }

        const spriteEl = document.getElementById('bossCardSprite');
        const nameEl   = document.getElementById('bossCardName');
        const hpEl     = document.getElementById('bossCardHp');

        if (!spriteEl || !nameEl || !hpEl) return;

        // Pega o ID do inimigo atual da fila da história
        const enemyId = (typeof storyEnemiesRemaining !== 'undefined' && storyEnemiesRemaining[0])
            ? storyEnemiesRemaining[0]
            : null;

        if (!enemyId) {
            spriteEl.style.display = 'none';
            nameEl.textContent = '—';
            hpEl.innerHTML = 'HP: — / —';
            return;
        }

        const enemy = STORY_ENEMIES[enemyId];
        if (!enemy) return;

        // Resolve o sprite (mesma lógica do applyStoryEnemyToBoss)
        let sprite = SPRITES_STORY[enemyId];
        if (!sprite || sprite.trim() === '') {
            const bk = STORY_TO_BASE_BOSS[enemyId];
            if (bk && typeof SPRITES !== 'undefined' && SPRITES[bk]) sprite = SPRITES[bk];
        }
        const has = sprite && sprite.trim() !== '';

        if (has) {
            if (spriteEl.src !== sprite) spriteEl.src = sprite;
            spriteEl.style.display = '';
            spriteEl.classList.remove('spectral-boss');
            if (enemy.isSpectral) spriteEl.classList.add('spectral-boss');
        } else {
            spriteEl.style.display = 'none';
        }

        nameEl.textContent = enemy.name;
        hpEl.innerHTML = `HP: <b>${boss.hp}</b> / ${boss.maxHp}`;
    };

    console.log('✅ updateBossCard sobrescrito — sprite do boss sempre visível.');
})();

// =================================================================
// FIX 2 — Bravely continua quando o boss morre (VERSÃO SEGURA)
// -----------------------------------------------------------------
// Intercepta só o triggerBravelyChain, sem tocar no executeAction.
// Se o target estiver morto, espera a transição e redireciona
// pro próximo inimigo.
// =================================================================
(function fixBravelyOnDeadTarget() {
    const _origBravely = window.triggerBravelyChain;
    if (typeof _origBravely !== 'function') return;

    window.triggerBravelyChain = async function(active, target, totalAtk) {
        // Fora do modo história → original
        if (!window._storyMode) {
            return _origBravely.apply(this, arguments);
        }

        // Se o target está vivo, chama o original normalmente
        if (target && !target.dead) {
            return _origBravely.apply(this, arguments);
        }

        // Target morto ou nulo → espera transição e redireciona
        console.log('[fix bravely] target morto, aguardando próximo...');

        let attempts = 0;
        while (arcadeBossTransition && attempts < 30) {
            await sleep(150);
            attempts++;
        }

        // Pega o novo target (boss atual vivo)
        const novoTarget = (mode === "BOSS" || mode === "ARCADE")
            ? boss
            : players.find(p => p.id !== active.id && !p.dead);

        // Se há um novo target vivo, redireciona
        if (novoTarget && !novoTarget.dead) {
            console.log('[fix bravely] redirecionando pra novo target:', novoTarget.name || novoTarget.class);
            return _origBravely.call(this, active, novoTarget, totalAtk);
        }

        // Se não há, apenas ignora
        console.log('[fix bravely] nenhum target vivo, pulando PA');
    };

    console.log('✅ fixBravelyOnDeadTarget instalado (versão segura).');
})();

console.log('✅ historia.js V8.6 — Fixes aplicados (sprite boss + PA continuado).');
// =================================================================
// 🎨 TABELA DE SPRITES DOS MATERIAIS DROPADOS
// -----------------------------------------------------------------
// Nova tabela dedicada só pra materiais (drops).
// Mesmo padrão de STORY_WEAPON_SPRITES e STORY_AMULET_SPRITES.
//
// Como preencher:
//   Cole o link entre as aspas. Se vazio, cai no emoji do SPRITES_STORY
//   antigo (que também tem fallback pro STORY_MATERIALS.emoji).
//
// Prioridade de resolução:
//   1. STORY_MATERIAL_SPRITES (esta tabela)
//   2. SPRITES_STORY (tabela antiga, se por acaso tiver link lá)
//   3. STORY_MATERIALS.emoji (emoji do material)
// =================================================================
const STORY_MATERIAL_SPRITES = {
    // ============ ATO 1 — Mata do Saci ============
    'espinho':         'https://i.imgur.com/lEnuaey.png',  // ← Espinho
    'espinho_raro':    'https://i.imgur.com/YNUNntc.png',  // ← Espinho Raro
    'pele_jacare':     'https://i.imgur.com/BG6eT8i.png',  // ← Pele de Jacaré
    'escama_brilhante':'https://i.imgur.com/FKvYzZ3.png',  // ← Escama Brilhante
    'chifre_cervo':    'https://i.imgur.com/I41gtiJ.png',  // ← Chifre de Cervo
    'chifre_ancestral':'https://i.imgur.com/8kPnUtX.png',  // ← Chifre Ancestral
    'garra_onca':      'https://i.imgur.com/TLwSsmn.png',  // ← Garra de Onça
    'garra_lendaria':  'https://i.imgur.com/8yK7V89.png',  // ← Garra Lendária
    // Boss
    'gorro_saci':      'https://i.imgur.com/5KCdWWZ.png',  // ← Gorro do Saci
    'amuleto_saci':    'https://i.imgur.com/wZNdnfe.png',  // ← Amuleto do Saci

    // ============ ATO 2 — Mata Fechada ============
    'pelo_tamandua':   'https://i.imgur.com/nkvQ3EG.png',  // ← Pelo de Tamanduá
    'garra_tamandua':  '',  // ← Garra de Tamanduá
    'couro_anta':      'https://i.imgur.com/WDIf5e7.png',  // ← Couro de Anta
    'chifre_anta':     '',  // ← Chifre de Anta
    'cera_queixada':   'https://i.imgur.com/lp2iykt.png',  // ← Cera de Queixada
    'presa_queixada':  '',  // ← Presa de Queixada
    'escama_sucuri':   'https://i.imgur.com/ITchbmQ.png',  // ← Escama de Sucuri
    'pele_sucuri':     '',  // ← Pele de Sucuri
    // Boss
    'pelo_mapinguari': 'https://i.imgur.com/Mgy0IG8.png',  // ← Pelo do Mapinguari
    'amuleto_mapinguari':'https://i.imgur.com/grxwdL7.png',// ← Amuleto do Mapinguari

    // ============ ATO 3 — Águas Profundas ============
    'escama_piranha':  'https://i.imgur.com/kgoUTpU.png',  // ← Escama de Piranha
    'dente_piranha':   'https://i.imgur.com/3zk4fmC.png',  // ← Dente de Piranha
    'pelo_lontra':     'https://i.imgur.com/kI3a2zX.png',  // ← Pelo de Lontra
    'garra_lontra':    '',  // ← Garra de Lontra
    'pelo_ariranha':   'https://i.imgur.com/zCM98NX.png',  // ← Pelo de Ariranha
    'dente_ariranha':  '',  // ← Dente de Ariranha
    'escama_pirarucu': 'https://i.imgur.com/XpUjh4G.png',  // ← Escama de Pirarucu
    'lingua_pirarucu': '',  // ← Língua de Pirarucu
    // Boss
    'joia_iara':       'https://i.imgur.com/j2zjNYG.png',  // ← Joia da Iara
    'amuleto_iara':    'https://i.imgur.com/1Au85vR.png',  // ← Amuleto da Iara

    // ============ ATO 4 — Chamas da Noite ============
    'pele_cascavel':    'https://i.imgur.com/l8tPijz.png',  // ← Pele de Cascavel
    'chocalho_cascavel':'',  // ← Chocalho de Cascavel
    'anel_coral':       'https://i.imgur.com/ecZV4QI.png',  // ← Anel de Coral
    'veneno_coral':     '',  // ← Veneno de Coral
    'pele_jararaca':    'https://i.imgur.com/hOJwfmd.png',  // ← Pele de Jararaca
    'presa_jararaca':   '',  // ← Presa de Jararaca
    'casco_tartaruga':  'https://i.imgur.com/O4HKJzr.png',  // ← Casco de Tartaruga
    'ovo_tartaruga':    '',  // ← Ovo de Tartaruga
    // Boss
    'escama_boitata':   'https://i.imgur.com/9NBxzxu.png',  // ← Escama Flamejante
    'amuleto_boitata':  'https://i.imgur.com/cBaWgUV.png',  // ← Amuleto do Boitatá

    // ============ ATO 5 — Maldição do Fogo ============
    'chifre_bode':      'https://i.imgur.com/PEUng6v.png',  // ← Chifre de Bode
    'pelo_bode':        '',  // ← Pelo de Bode
    'la_carneiro':      'https://i.imgur.com/RDgvubw.png',  // ← Lã de Carneiro
    'chifre_carneiro':  '',  // ← Chifre de Carneiro
    'crina_cavalo':     'https://i.imgur.com/4YV8EKn.png',  // ← Crina de Cavalo
    'casco_cavalo':     '',  // ← Casco de Cavalo
    'chifre_touro':     'https://i.imgur.com/YRtPJ8l.png',  // ← Chifre de Touro
    'couro_touro':      '',  // ← Couro de Touro
    // Boss
    'ferradura_mula':   'https://i.imgur.com/j0KDfvl.png',  // ← Ferradura da Mula
    'amuleto_mula':     'https://i.imgur.com/NCSB2In.png',  // ← Amuleto da Mula

    // ============ ATO 6 — Ossos do Sertão ============
    'pena_urubu':         'https://i.imgur.com/rXrxotX.png',  // ← Pena de Urubu
    'bico_urubu':         '',  // ← Bico de Urubu
    'pena_carcara':       'https://i.imgur.com/WZ6M71Z.png',  // ← Pena de Carcará
    'garra_carcara':      '',  // ← Garra de Carcará
    'placa_tatu':         'https://i.imgur.com/PWN8WJN.png',  // ← Placa de Tatu
    'garra_tatu':         '',  // ← Garra de Tatu
    'pelo_lobo_guara':    'https://i.imgur.com/SACZHLY.png',  // ← Pelo de Lobo-Guará
    'presa_lobo_guara':   '',  // ← Presa de Lobo-Guará
    // Boss
    'osso_corpo_seco':    'https://i.imgur.com/yCGLbk6.png',  // ← Osso Amaldiçoado
    'amuleto_corpo_seco': 'https://i.imgur.com/nbWin30.png',  // ← Amuleto do Corpo Seco

    // ============ ATO 7 — Maldição da Lua ============
    'pelo_cachorro_mato': 'https://i.imgur.com/CzuZlmm.png',  // ← Pelo de Cachorro-do-Mato
    'presa_cachorro_mato':'',  // ← Presa de Cachorro-do-Mato
    'cauda_raposa':       'https://i.imgur.com/VA8rW74.png',  // ← Cauda de Raposa
    'pelo_raposa':        '',  // ← Pelo de Raposa
    'mascara_guaxinim':   'https://i.imgur.com/hpcbhjV.png',  // ← Máscara de Guaxinim
    'garra_guaxinim':     '',  // ← Garra de Guaxinim
    'pelo_jaguatirica':   'https://i.imgur.com/PJpgkA5.png',  // ← Pelo de Jaguatirica
    'garra_jaguatirica':  '',  // ← Garra de Jaguatirica
    // Boss
    'pelo_lobisomem':     'https://i.imgur.com/Q6GTFIi.png',  // ← Pelo de Lobisomem
    'amuleto_lobisomem':  'https://i.imgur.com/SdrNTgW.png',  // ← Amuleto do Lobisomem

    // ============ ATO 8 — Poções e Sombras ============
    'asa_morcego':        'https://i.imgur.com/ZGi0F9K.png',  // ← Asa de Morcego
    'presa_morcego':      '',  // ← Presa de Morcego
    'pena_coruja':        'https://i.imgur.com/5vpxoKa.png',  // ← Pena de Coruja
    'olho_coruja':        '',  // ← Olho de Coruja
    'pele_sapo':          'https://i.imgur.com/Oug9mNH.png',  // ← Pele de Sapo
    'veneno_sapo':        '',  // ← Veneno de Sapo
    'pena_seriema':       'https://i.imgur.com/udfo4lA.png',  // ← Pena de Seriema
    'bico_seriema':       '',  // ← Bico de Seriema
    // Boss
    'caldeirao_cuca':     'https://i.imgur.com/D73xfFj.png',  // ← Fragmento do Caldeirão
    'amuleto_cuca':       'https://i.imgur.com/MZqecGu.png',  // ← Amuleto da Cuca

    // ============ ATO 9 — Canto das Águas ============
    'escama_tucunare':    'https://i.imgur.com/ATGdiol.png',  // ← Escama de Tucunaré
    'dente_tucunare':     '',  // ← Dente de Tucunaré
    'escama_piraiba':     'https://i.imgur.com/ow8TFQ9.png',  // ← Escama de Piraíba
    'lingua_piraiba':     '',  // ← Língua de Piraíba
    'escama_dourada':     'https://i.imgur.com/oJEjSCR.png',  // ← Escama Dourada
    'barbatana_dourada':  '',  // ← Barbatana Dourada
    'couro_peixe_boi':    'https://i.imgur.com/hMxADzR.png',  // ← Couro de Peixe-Boi
    'osso_peixe_boi':     '',  // ← Osso de Peixe-Boi
    // Boss
    'flor_boto':          'https://i.imgur.com/VjU6qOb.png',  // ← Flor do Boto
    'amuleto_boto':       'https://i.imgur.com/60PhZcr.png',  // ← Amuleto do Boto

    // ============ ATO 10 — Terror do Pasto ============
    'chifre_bufalo':      'https://i.imgur.com/81JTkR3.png',  // ← Chifre de Búfalo
    'couro_bufalo':       '',  // ← Couro de Búfalo
    'sino_vaca':          'https://i.imgur.com/eC6RONh.png',  // ← Sino da Vaca Louca
    'chifre_vaca':        '',  // ← Chifre da Vaca Louca
    'chifre_cabra':       'https://i.imgur.com/2Ef2uzL.png',  // ← Chifre de Cabra Preta
    'pelo_cabra':         '',  // ← Pelo de Cabra Preta
    'corcova_zebu':       'https://i.imgur.com/ricPmaF.png',  // ← Corcova de Zebu
    'chifre_zebu':        '',  // ← Chifre de Zebu
    // Boss
    'chifre_boi':         'https://i.imgur.com/HaNOyts.png',  // ← Chifre do Boi da Cara Preta
    'amuleto_boi':        'https://i.imgur.com/GhVUlJ8.png',  // ← Amuleto do Boi da Cara Preta

    // ============ ATO 11 — Luz Fria da Lua ============
    'pelo_gato_mato':     'https://i.imgur.com/KKWzAjN.png',  // ← Pelo de Gato-do-Mato
    'garra_gato_mato':    '',  // ← Garra de Gato-do-Mato
    'asa_mariposa':       'https://i.imgur.com/tVh2HIp.png',  // ← Asa de Mariposa Gigante
    'po_mariposa':        '',  // ← Pó Lunar
    'mascara_quati':      'https://i.imgur.com/u3u0t9f.png',  // ← Máscara de Quati
    'cauda_quati':        '',  // ← Cauda de Quati
    'pelo_sucuarana':     'https://i.imgur.com/VxUQeoh.png',  // ← Pelo de Suçuarana
    'garra_sucuarana':    '',  // ← Garra de Suçuarana
    // Boss
    'raio_lunar':         'https://i.imgur.com/rRMX5zO.png',  // ← Raio Lunar
    'amuleto_jaci':       'https://i.imgur.com/Ugx2s1z.png',  // ← Amuleto da Jaci

    // ============ ATO 12 — O Sol Devorador ============
    'pena_gaviao':        'https://i.imgur.com/uKsKkCO.png',  // ← Pena de Gavião
    'garra_gaviao':       '',  // ← Garra de Gavião
    'pena_falcao':        'https://i.imgur.com/e0Jl4m6.png',  // ← Pena de Falcão
    'garra_falcao':       '',  // ← Garra de Falcão
    'pena_urutau':        'https://i.imgur.com/RJ5R30X.png',  // ← Pena de Urutau
    'olho_urutau':        '',  // ← Olho de Urutau
    'pena_aguia':         'https://i.imgur.com/Voa3glg.png',  // ← Pena de Águia
    'garra_aguia':        '',  // ← Garra de Águia
    // Boss
    'coroa_solar':        'https://i.imgur.com/eU5rrOA.png',  // ← Coroa Solar
    'amuleto_guaraci':    'https://i.imgur.com/rRwaKTH.png',  // ← Amuleto do Guaraci

    // ============ ATO 13 — O Senhor do Abismo ============
    'fragmento_abismo':   'https://i.imgur.com/mEsrwkS.png',  // ← Fragmento do Abismo
    'essencia_anhanga':   'https://i.imgur.com/cfBkyLL.png',  // ← Essência de Anhangá

    // ============ Consumíveis ============
    'pocao_cura':         '',  // ← Poção de Cura
};

// =================================================================
// 🔧 RESOLUÇÃO DE SPRITE — função unificada
// -----------------------------------------------------------------
// Prioridade:
//   1. STORY_MATERIAL_SPRITES (nova tabela)
//   2. SPRITES_STORY (tabela antiga)
//   3. Emoji do STORY_MATERIALS
// =================================================================
function getMaterialIcon(matId, size = 'normal') {
    const m = STORY_MATERIALS[matId];
    if (!m) return '<span style="opacity:0.5;">?</span>';

    // 1. Tabela nova
    let url = STORY_MATERIAL_SPRITES[matId];

    // 2. Tabela antiga (compatibilidade)
    if (!url || String(url).trim() === '') {
        url = (typeof SPRITES_STORY !== 'undefined') ? SPRITES_STORY[matId] : '';
    }

    // 3. Emoji de fallback
    const emoji = m.emoji || '❓';

    if (url && String(url).trim() !== '') {
        const cls = size === 'large' ? 'material-icon material-icon-large'
                  : size === 'small' ? 'material-icon material-icon-small'
                  : 'material-icon';
        return `<img src="${url}" class="${cls}" alt="${m.name}" onerror="this.outerHTML='${emoji}'">`;
    }

    const cls = size === 'large' ? 'material-emoji material-emoji-large'
              : size === 'small' ? 'material-emoji material-emoji-small'
              : 'material-emoji';
    return `<span class="${cls}">${emoji}</span>`;
}

// =================================================================
// 🎨 CSS dos ícones de material
// =================================================================
(function injectMaterialIconCSS() {
    if (document.getElementById('materialIconStyle')) return;
    const style = document.createElement('style');
    style.id = 'materialIconStyle';
    style.textContent = `
        .material-icon {
            width: 1em;
            height: 1em;
            object-fit: contain;
            vertical-align: -0.15em;
            display: inline-block;
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
        }
        .material-icon-small { width: 0.85em; height: 0.85em; }
        .material-icon-large { width: 2em;    height: 2em; }

        .material-emoji { display: inline-block; line-height: 1; }
        .material-emoji-small { font-size: 0.85em; }
        .material-emoji-large { font-size: 2em; }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS dos ícones de material injetado.');
})();

// =================================================================
// 🔧 PATCH — Substitui os usos diretos de .emoji por getMaterialIcon
// -----------------------------------------------------------------
// Aplica em: Tesouraria (inventário + receitas), Loja (venda),
// Resultado de vitória (drops).
// =================================================================

// Patch 1 — Cards do inventário na Tesouraria
(function patchTesourariaInventoryIcons() {
    if (window._tesourariaInvIconObserver) return;
    window._tesourariaInvIconObserver = true;

    const patchCards = () => {
        document.querySelectorAll('.tesouraria-item').forEach(card => {
            if (card.dataset.iconPatched === '1') return;
            const iconEl = card.querySelector('.tesouraria-item-icon');
            const nameEl = card.querySelector('.tesouraria-item-name');
            if (!iconEl || !nameEl) return;

            const matName = nameEl.textContent.trim();
            const matId = Object.keys(STORY_MATERIALS).find(id => STORY_MATERIALS[id].name === matName);
            if (!matId) return;

            iconEl.innerHTML = getMaterialIcon(matId, 'large');
            iconEl.dataset.iconPatched = '1';
            card.dataset.iconPatched = '1';
        });
    };

    const observer = new MutationObserver(() => {
        const ss = document.getElementById('storyScreen');
        if (ss?.classList.contains('active')) patchCards();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('✅ Observer de ícones do inventário instalado.');
})();

// Patch 2 — Receitas da Forja
(function patchForgeRecipeIcons() {
    if (window._forgeRecipeIconObserver) return;
    window._forgeRecipeIconObserver = true;

    const patchRecipes = () => {
        document.querySelectorAll('.forge-recipe-mat').forEach(el => {
            if (el.dataset.iconPatched === '1') return;
            // Pega o texto pra descobrir qual material é
            const text = el.textContent.trim();
            // Formato: "🦔 3/5" — pega o nome
            const matId = Object.keys(STORY_MATERIALS).find(id => {
                const m = STORY_MATERIALS[id];
                return text.includes(m.name) || text.includes(m.emoji);
            });
            if (!matId) return;

            const m = STORY_MATERIALS[matId];
            const has = STORY_PROGRESS.inventory[matId] || 0;
            // Recalcula o "requerido" pela classe de cor
            const qty = text.match(/(\d+)\/(\d+)/);
            if (!qty) return;
            const qtyHas = qty[1], qtyNeed = qty[2];
            const okClass = el.classList.contains('ok') ? 'ok' : 'no';

            el.innerHTML = `${getMaterialIcon(matId, 'small')} ${qtyHas}/${qtyNeed}`;
            el.classList.remove('ok', 'no');
            el.classList.add(okClass);
            el.dataset.iconPatched = '1';
        });
    };

    const observer = new MutationObserver(() => {
        const ss = document.getElementById('storyScreen');
        if (ss?.classList.contains('active')) patchRecipes();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('✅ Observer de ícones das receitas instalado.');
})();

// Patch 3 — Cards de venda no Curandeiro
(function patchSellIcons() {
    if (window._sellIconObserver) return;
    window._sellIconObserver = true;

    const patchSell = () => {
        document.querySelectorAll('.sell-card').forEach(card => {
            if (card.dataset.iconPatched === '1') return;
            const iconEl = card.querySelector('.sell-icon');
            const nameEl = card.querySelector('.sell-name');
            if (!iconEl || !nameEl) return;

            const matName = nameEl.textContent.trim();
            const matId = Object.keys(STORY_MATERIALS).find(id => STORY_MATERIALS[id].name === matName);
            if (!matId) return;

            iconEl.innerHTML = getMaterialIcon(matId, 'large');
            iconEl.dataset.iconPatched = '1';
            card.dataset.iconPatched = '1';
        });
    };

    const observer = new MutationObserver(() => {
        const ss = document.getElementById('storyScreen');
        if (ss?.classList.contains('active')) patchSell();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('✅ Observer de ícones de venda instalado.');
})();

// Patch 4 — Drops na tela de vitória
(function patchVictoryDropIcons() {
    if (window._victoryDropIconObserver) return;
    window._victoryDropIconObserver = true;

    const patchVictory = () => {
        document.querySelectorAll('.story-result-drop').forEach(card => {
            if (card.dataset.iconPatched === '1') return;
            const iconEl = card.querySelector('.story-result-drop-emoji');
            const nameEl = card.querySelector('.story-result-drop-name');
            if (!iconEl || !nameEl) return;

            const matName = nameEl.textContent.trim();
            const matId = Object.keys(STORY_MATERIALS).find(id => STORY_MATERIALS[id].name === matName);
            if (!matId) return;

            iconEl.innerHTML = getMaterialIcon(matId, 'large');
            iconEl.dataset.iconPatched = '1';
            card.dataset.iconPatched = '1';
        });
    };

    const observer = new MutationObserver(() => {
        const ov = document.getElementById('storyVictoryOverlay');
        if (ov) patchVictory();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    console.log('✅ Observer de ícones de drops instalado.');
})();

// =================================================================
// 🌐 Expõe no window
// =================================================================
window.STORY_MATERIAL_SPRITES = STORY_MATERIAL_SPRITES;
window.getMaterialIcon = getMaterialIcon;

console.log('✅ Tabela de sprites dos materiais carregada.');
// =================================================================
// 🔧 UX — Botão flutuante "VOLTAR" nas telas longas
// -----------------------------------------------------------------
// Adiciona um botão fixo no topo da tela do storyScreen,
// sempre visível independente do scroll.
//
// Aparece em: Bestiário, OCA, Forja, Ritual, Atos, Fases, Loja
// Não aparece em: Aldeia (já tem botão no topo), telas de batalha
// =================================================================
(function addFloatingBackButton() {

    // Evita duplicar
    if (document.getElementById('floatingBackBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'floatingBackBtn';
    btn.className = 'floating-back-btn';
    btn.innerHTML = '← VOLTAR À ALDEIA';
    btn.style.display = 'none'; // só aparece quando faz sentido
    document.body.appendChild(btn);

    // Ação do clique: decide pra onde voltar
    btn.onclick = function() {
        const ss = document.getElementById('storyScreen');
        if (!ss) return;

        const titleEl = ss.querySelector('.story-title');
        const title = titleEl ? titleEl.textContent.trim().toUpperCase() : '';

        // Se estamos em sub-tela (Bestiário, OCA, Forja, etc) → volta pra Aldeia
        if (title.includes('BESTIÁRIO') ||
            title.includes('OCA') ||
            title.includes('TESOURARIA') ||
            title.includes('RITUAL') ||
            title.includes('CURANDEIRO') ||
            title.includes('ATOS')) {
            if (typeof renderAldeiaScreen === 'function') {
                renderAldeiaScreen();
            }
            return;
        }

        // Fases de um ato → volta pra lista de atos
        if (title.includes('ATO ')) {
            if (typeof renderAtosScreen === 'function') {
                renderAtosScreen();
            }
            return;
        }

        // Fallback: volta pra Aldeia
        if (typeof renderAldeiaScreen === 'function') {
            renderAldeiaScreen();
        }
    };

    // ============================================================
    // Mostra/esconde o botão conforme a tela atual
    // ============================================================
    function updateFloatingBtnVisibility() {
        const ss = document.getElementById('storyScreen');
        const btn = document.getElementById('floatingBackBtn');
        if (!ss || !btn) return;

        // Só mostra se a storyScreen estiver ativa
        const isActive = ss.classList.contains('active') &&
                         getComputedStyle(ss).display !== 'none';

        if (!isActive) {
            btn.style.display = 'none';
            return;
        }

        // Não mostra na Aldeia (já tem botão no rodapé e a tela é curta)
        const titleEl = ss.querySelector('.story-title');
        const title = titleEl ? titleEl.textContent.trim().toUpperCase() : '';

        const naAldeia = title === 'ALDEIA';
        const emBatalha = document.getElementById('gameScreen')?.classList.contains('active');

        if (naAldeia || emBatalha) {
            btn.style.display = 'none';
        } else {
            btn.style.display = 'flex';
        }
    }

    // Observa mudanças no DOM pra atualizar visibilidade
    const observer = new MutationObserver(() => {
        updateFloatingBtnVisibility();
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });

    // Chama uma vez pra iniciar
    setTimeout(updateFloatingBtnVisibility, 100);

    console.log('✅ Botão flutuante "VOLTAR" instalado.');
})();

// =================================================================
// 🎨 CSS do botão flutuante
// =================================================================
(function injectFloatingBackBtnCSS() {
    if (document.getElementById('floatingBackBtnStyle')) return;
    const style = document.createElement('style');
    style.id = 'floatingBackBtnStyle';
    style.textContent = `
        .floating-back-btn {
            position: fixed;
            top: 16px;
            left: 16px;
            z-index: 9800;
            padding: 10px 18px;
            background:
                linear-gradient(180deg, rgba(232, 185, 35, 0.15), transparent 45%),
                linear-gradient(135deg, #6a5024 0%, #4a3418 60%, #2a1f10 100%);
            color: #f0e2c0;
            border: 2px solid #c9a227;
            border-radius: 4px;
            cursor: pointer;
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 0.85rem;
            letter-spacing: 1.5px;
            transition: all 0.2s;
            box-shadow:
                0 4px 15px rgba(0, 0, 0, 0.6),
                0 0 20px rgba(201, 162, 39, 0.2);
            align-items: center;
            gap: 6px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
            -webkit-tap-highlight-color: transparent;
        }

        .floating-back-btn:hover {
            background:
                linear-gradient(180deg, rgba(232, 185, 35, 0.3), transparent 45%),
                linear-gradient(135deg, #8a6a2e 0%, #6a4a20 60%, #3a2a14 100%);
            border-color: #e8b923;
            color: #fff5dc;
            transform: translateY(-2px);
            box-shadow:
                0 6px 20px rgba(0, 0, 0, 0.7),
                0 0 30px rgba(232, 185, 35, 0.4);
        }

        .floating-back-btn:active {
            transform: translateY(0);
            box-shadow:
                0 3px 10px rgba(0, 0, 0, 0.6),
                0 0 15px rgba(201, 162, 39, 0.3);
        }

        /* Em mobile, ajusta o tamanho pra não cobrir conteúdo importante */
        @media (max-width: 600px) {
            .floating-back-btn {
                top: 10px;
                left: 10px;
                padding: 8px 14px;
                font-size: 0.75rem;
                letter-spacing: 1px;
            }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS do botão flutuante injetado.');
})();

console.log('✅ Botão flutuante "VOLTAR" pronto pra uso.');
// =================================================================
// historia.js — BLOCO CORRETIVO 1 (V9.0 — Correções Críticas)
// -----------------------------------------------------------------
// Cole NO FINAL de historia.js, sem substituir nada.
//
// Contém:
//   1. handleStoryBossDefeat exposta corretamente em window
//      (corrige o hook quebrado do bestiário)
//   2. Reset de _storyPurificationShowing movido para advanceStoryEnemy
//      (corrige travamento de purificação em mortes em cadeia)
//   3. PA (triggerBravelyChain) SEMPRE dispara, mesmo com alvo morto
//      (corrige o PA não aparecer quando o boss morre no ataque base)
//   4. Botão flutuante "VOLTAR" reduzido
//   5. Registro de derrota no bestiário dentro do próprio
//      handleStoryBossDefeat (não depende mais de hook externo)
// =================================================================

// =================================================================
// 1 + 5. handleStoryBossDefeat — reescrita robusta
// -----------------------------------------------------------------
// Sobrescreve a versão anterior (que estava exposta errada).
// Agora:
//   • Exposta corretamente em window
//   • Registra a derrota no bestiário ANTES de qualquer transição
//   • Reset de _storyPurificationShowing movido pro finally
//   • Guarda contra dupla execução usando o ID do inimigo atual
// =================================================================
(function installRobustHandleStoryBossDefeat() {
    // Guarda a versão anterior (que era local, não estava em window)
    const _orig = window.handleStoryBossDefeat;

    window.handleStoryBossDefeat = async function() {
        if (!window._storyMode) {
            if (typeof _orig === 'function') return _orig.apply(this, arguments);
            return;
        }

        // ---- GUARD anti-duplicação ----
        // Usa o ID do inimigo atual como chave. Se já estamos processando
        // a morte desse inimigo, ignora a chamada duplicada.
        const enemyId = (typeof storyEnemiesRemaining !== 'undefined' && storyEnemiesRemaining[0])
            ? storyEnemiesRemaining[0]
            : null;

        if (!enemyId) return;

        if (window._processingBossDefeat === enemyId) {
            console.log('[story] handleStoryBossDefeat ignorado (duplicado):', enemyId);
            return;
        }
        window._processingBossDefeat = enemyId;

        try {
            // ---- REGISTRO NO BESTIÁRIO (antes de tudo) ----
            if (!Array.isArray(STORY_PROGRESS.enemiesDefeatedIds)) {
                STORY_PROGRESS.enemiesDefeatedIds = [];
            }
            if (!STORY_PROGRESS.enemiesDefeatedIds.includes(enemyId)) {
                STORY_PROGRESS.enemiesDefeatedIds.push(enemyId);
                saveStoryProgress();
                console.log('[story] Inimigo registrado no bestiário:', enemyId);
            }

            // ---- DROPS ----
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
            if (dropTxt) {
                addLog(`${uiIcon('gift')} Drops:${dropTxt}`);
            } else {
                addLog(`${uiIcon('gift')} Nenhum drop.`);
            }

            STORY_PROGRESS.enemiesDefeated = (STORY_PROGRESS.enemiesDefeated || 0) + 1;
            saveStoryProgress();

            // ---- PURIFICAÇÃO VISUAL ----
            if (typeof showPurificacao === 'function') {
                try {
                    await showPurificacao(boss.type, boss.x, boss.y, false);
                } catch(e) {
                    console.warn('[story] Erro na purificação visual:', e);
                }
            }

            // ---- MENSAGEM DE PURIFICAÇÃO ----
            await showPurificationMessage(enemyId);

            // ---- DIÁLOGO FINAL (só bosses com epílogo) ----
            const isBoss = STORY_FINAL_DIALOGS[enemyId] !== undefined;
            if (isBoss) {
                await showBossFinalDialog(enemyId);
            }

            // ---- AVANÇA PARA O PRÓXIMO INIMIGO ----
            await advanceStoryEnemy();

        } catch (e) {
            console.error('[story] Erro em handleStoryBossDefeat:', e);
        } finally {
            // Libera o guard pra permitir a próxima morte
            window._processingBossDefeat = null;
        }
    };

    console.log('✅ handleStoryBossDefeat robusta instalada.');
})();

// =================================================================
// 2. advanceStoryEnemy — reset correto de _storyPurificationShowing
// -----------------------------------------------------------------
// A versão anterior resetava dentro do próprio handleStoryBossDefeat,
// o que travava purificações em cadeia. Agora o reset acontece aqui,
// que é o ponto natural (após a transição para o próximo inimigo).
// =================================================================
(function patchAdvanceStoryEnemyReset() {
    const _origAdvance = window.advanceStoryEnemy;
    if (typeof _origAdvance !== 'function') {
        console.warn('[story] advanceStoryEnemy não encontrada, pulando patch.');
        return;
    }

    window.advanceStoryEnemy = async function() {
        // Reseta o flag ANTES de qualquer transição
        window._storyPurificationShowing = false;

        try {
            return await _origAdvance.apply(this, arguments);
        } catch (e) {
            console.error('[story] Erro em advanceStoryEnemy:', e);
            window._storyPurificationShowing = false;
        }
    };

    console.log('✅ advanceStoryEnemy patcheada — reset de purificação correto.');
})();

// =================================================================
// 3. PA dispara SEMPRE, mesmo com alvo morto
// -----------------------------------------------------------------
// Reinstala o triggerBravelyChain pra funcionar corretamente quando
// o boss morre no ataque base antes do PA executar.
//
// Estratégia:
//   • Salva a referência do alvo original ANTES de qualquer dano
//   • Se o alvo morrer no meio do caminho, ainda assim converte os
//     tiles afetados pelo PA (efeito estratégico)
//   • Efeitos extras (empurrar, curar, dobro se em FOGO) só rodam
//     se houver alvo vivo
//   • Se o PA estava em execução e o boss morreu, redireciona pro
//     próximo boss se ele já estiver no board
// =================================================================
(function installBravelyAlwaysFires() {
    // Guarda a versão atual (do bloco V8.1 anterior)
    const _origBravely = window.triggerBravelyChain;
    if (typeof _origBravely !== 'function') {
        console.warn('[story] triggerBravelyChain não encontrada, pulando patch.');
        return;
    }

    window.triggerBravelyChain = async function(active, target, totalAtk) {
        // Fora do modo história → original
        if (!window._storyMode) {
            return _origBravely.apply(this, arguments);
        }

        const heroData = STORY_HERO_CLASSES[active.class];
        // Herói base → original (Tupã/Sumé/Caipora)
        if (!heroData || !heroData.paKey || heroData.paKey.startsWith('base_')) {
            return _origBravely.apply(this, arguments);
        }

        // ============================================================
        // HERÓI NOVO — versão robusta
        // ============================================================
        const element = active.element || 'FOGO';
        const paKey = heroData.paKey;

        // ---- Salva o snapshot do alvo original ----
        // Mesmo que o alvo morra no meio do PA, guardamos a posição
        // original pra calcular os tiles corretamente.
        const targetSnapshot = target ? {
            x: target.x,
            y: target.y,
            dead: target.dead,
            id: target.id
        } : null;

        // ---- 1. Overlay "PODER ANCESTRAL" ----
        if (typeof showPoderAncestralEffect === 'function') {
            try { showPoderAncestralEffect(); } catch(e) {}
        }
        await sleep(300);

        // ---- 2. Som ----
        try { playSfx('skill1'); } catch(e) {}

        // ---- 3. Calcula os tiles afetados pelo PA ----
        // IMPORTANTE: usa o snapshot do alvo, não o estado atual.
        // Isso garante que mesmo se o alvo morreu, os tiles são calculados.
        const paTiles = getPAaffectedTilesWithSnapshot(active, paKey, targetSnapshot);

        // ---- 4. FX elemental em cada tile ----
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

        // ---- 5. Dano no alvo (se ainda estiver vivo) ----
        // Só aplica dano se o alvo original ainda estiver vivo.
        // Se morreu no ataque base, o PA não causa mais dano — mas
        // ainda converte tiles (o efeito estratégico).
        if (target && !target.dead) {
            const targetIdx = target.y * 8 + target.x;
            if (paTiles.includes(targetIdx)) {
                if (typeof applyDmg === 'function') applyDmg(target, totalAtk);
            }
        }

        // ---- 6. Efeitos EXTRAS únicos ----
        // Só rodam se houver alvo vivo. Usa o snapshot pra posição.
        const targetForExtras = (target && !target.dead) ? target : null;
        const paFn = STORY_HERO_PA[paKey];
        if (paFn && typeof paFn.execute === 'function') {
            try {
                // Para o PA do Kanarott (empurrar), precisamos de um alvo vivo.
                // Se o alvo morreu, passamos um "target fake" com a posição
                // original pra que os efeitos de cura ainda rodem.
                const targetArg = targetForExtras || (targetSnapshot ? {
                    x: targetSnapshot.x,
                    y: targetSnapshot.y,
                    dead: true,  // marca como morto pra evitar empurrar
                    id: targetSnapshot.id
                } : null);

                await paFn.execute(active, targetArg, totalAtk);
            } catch(e) {
                console.warn('[story] Erro no efeito extra do PA:', e);
            }
        }

        // ---- 7. Trocar tiles afetados pelo elemento do herói ----
        // ESSENCIAL: sempre converte os tiles, independente do alvo.
        // É aqui que está o valor estratégico do PA com alvo morto.
        paTiles.forEach(idx => {
            grid[idx] = element;
            const tile = document.querySelectorAll('#grid .tile')[idx];
            if (tile) tile.className = `tile bg-${element}`;
            if (element === 'TERRA' && typeof updateTitleStats === 'function') {
                updateTitleStats('earth_tile');
            } else if (element === 'AR' && typeof updateTitleStats === 'function') {
                updateTitleStats('air_tile');
            }
        });

        // ---- 8. Estatística ----
        if (typeof updateTitleStats === 'function') updateTitleStats('bravely_chain');

        console.log('[story] PA executado. Tiles convertidos:', paTiles.length,
                    '| Alvo vivo:', targetForExtras ? 'sim' : 'não');

        // ---- 9. Se o boss morreu durante o PA, o fluxo de vitória ----
        // ---- já foi disparado por applyDmg. Não faz nada aqui. ----
    };

    // ================================================================
    // getPAaffectedTiles COM SNAPSHOT
    // Mesma lógica do V8.1, mas aceita um objeto snapshot do alvo
    // (que pode estar morto) em vez de exigir o objeto vivo.
    // ================================================================
    function getPAaffectedTilesWithSnapshot(active, paKey, targetSnapshot) {
        const tiles = [];
        const cx = active.x;
        const cy = active.y;

        // Helper: verifica se o alvo snapshot existe e está no tabuleiro
        const hasTarget = targetSnapshot &&
                          typeof targetSnapshot.x === 'number' &&
                          typeof targetSnapshot.y === 'number';

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

        return tiles;
    }

    console.log('✅ triggerBravelyChain robusta instalada — PA dispara com alvo vivo ou morto.');
})();

// =================================================================
// 4. Botão flutuante "VOLTAR" reduzido
// -----------------------------------------------------------------
// Reduz padding, fonte, e em telas pequenas troca o texto por só "←".
// =================================================================
(function shrinkFloatingBackBtn() {
    // Remove o CSS antigo (se existir)
    const oldStyle = document.getElementById('floatingBackBtnStyle');
    if (oldStyle) oldStyle.remove();

    // Injeta o CSS novo
    const style = document.createElement('style');
    style.id = 'floatingBackBtnStyle';
    style.textContent = `
        .floating-back-btn {
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 9800;
            padding: 6px 12px;
            background:
                linear-gradient(180deg, rgba(232, 185, 35, 0.15), transparent 45%),
                linear-gradient(135deg, #6a5024 0%, #4a3418 60%, #2a1f10 100%);
            color: #f0e2c0;
            border: 1.5px solid #c9a227;
            border-radius: 20px;
            cursor: pointer;
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 0.7rem;
            letter-spacing: 1px;
            transition: all 0.2s;
            box-shadow:
                0 3px 10px rgba(0, 0, 0, 0.6),
                0 0 15px rgba(201, 162, 39, 0.2);
            display: flex;
            align-items: center;
            gap: 5px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
            -webkit-tap-highlight-color: transparent;
            line-height: 1;
            opacity: 0.9;
        }

        .floating-back-btn:hover {
            background:
                linear-gradient(180deg, rgba(232, 185, 35, 0.3), transparent 45%),
                linear-gradient(135deg, #8a6a2e 0%, #6a4a20 60%, #3a2a14 100%);
            border-color: #e8b923;
            color: #fff5dc;
            transform: translateY(-1px);
            box-shadow:
                0 4px 15px rgba(0, 0, 0, 0.7),
                0 0 22px rgba(232, 185, 35, 0.4);
            opacity: 1;
        }

        .floating-back-btn:active {
            transform: translateY(0);
            box-shadow:
                0 2px 8px rgba(0, 0, 0, 0.6),
                0 0 10px rgba(201, 162, 39, 0.3);
        }

        /* Em telas muito pequenas, esconde o texto e mostra só a seta */
        @media (max-width: 600px) {
            .floating-back-btn {
                top: 8px;
                left: 8px;
                padding: 7px 11px;
                font-size: 1rem;
                letter-spacing: 0;
                border-radius: 50%;
                width: 34px;
                height: 34px;
                justify-content: center;
            }
            .floating-back-btn .fb-text {
                display: none;
            }
        }
    `;
    document.head.appendChild(style);

    // Reposiciona o botão: em vez de "← VOLTAR À ALDEIA" fixo,
    // coloca o texto num span pra poder escondê-lo em telas pequenas.
    const btn = document.getElementById('floatingBackBtn');
    if (btn) {
        // Guarda a ação do clique
        const clickHandler = btn.onclick;

        // Reescreve o conteúdo com o span
        btn.innerHTML = '←<span class="fb-text"> VOLTAR</span>';

        // Restaura o handler
        if (clickHandler) btn.onclick = clickHandler;
    }

    console.log('✅ Botão flutuante reduzido.');
})();

// =================================================================
// 5. Registro retroativo do bestiário
// -----------------------------------------------------------------
// Sincroniza bossesDefeated antigos com enemiesDefeatedIds.
// Roda uma vez ao carregar.
// =================================================================
(function syncBestiaryRetroactive() {
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
    console.log('✅ Bestiário retroativo sincronizado.');
})();

console.log('✅ BLOCO CORRETIVO 1 (V9.0) carregado com sucesso.');
// =================================================================
// historia.js — BLOCO CORRETIVO 2 (V9.0 — Armas Escaladas)
// -----------------------------------------------------------------
// Cole NO FINAL de historia.js, depois do Bloco 1.
//
// Contém:
//   1. STORY_WEAPONS reescrita com:
//      • atkBonus escalonado por ato (1/2/3)
//      • elemento (AR/TERRA/AGUA/FOGO/ANY)
//   2. Hook no executeAction pra aplicar bônus elemental da arma
//      (EMPILHA com o bônus do elemento do herói — Opção A)
//   3. Painel de detalhes do herói mostra o elemento da arma
//   4. Tooltip/legenda explicando o bônus
// =================================================================

// =================================================================
// 1. ELEMENTO POR ATO (baseado no boss)
// =================================================================
const STORY_ATO_ELEMENT = {
    1:  'AR',      // Saci (redemoinho)
    2:  'TERRA',   // Mapinguari
    3:  'AGUA',    // Iara
    4:  'FOGO',    // Boitatá
    5:  'FOGO',    // Mula sem Cabeça
    6:  'TERRA',   // Corpo Seco
    7:  'AR',      // Lobisomem
    8:  'AGUA',    // Cuca (poções)
    9:  'AGUA',    // Boto Rosa
    10: 'TERRA',   // Boi da Cara Preta
    11: 'AR',      // Jaci
    12: 'FOGO',    // Guaraci
    13: 'ANY',     // Anhangá — conta pra qualquer elemento do herói
};

// =================================================================
// 2. TABELA DE ATK POR ATO (escala)
// =================================================================
const STORY_ATO_ATK_SCALE = {
    1: 1, 2: 1, 3: 1, 4: 1,
    5: 2, 6: 2, 7: 2, 8: 2,
    9: 3, 10: 3, 11: 3, 12: 3,
    13: 3,
};

// =================================================================
// 3. REESCREVE STORY_WEAPONS
// -----------------------------------------------------------------
// Cada arma ganha:
//   • atkBonus:      ATK base (fixo, sempre soma)
//   • elemento:      elemento que dá o bônus extra quando o tile bate
//   • elementoBonus: valor do bônus extra (mesmo do atkBonus por enquanto)
//
// O elemento é aplicado a TODAS as armas do mesmo ato.
// =================================================================
(function rewriteWeaponsTable() {
    if (typeof STORY_WEAPONS === 'undefined') {
        console.warn('[story] STORY_WEAPONS não encontrada, pulando Bloco 2.');
        return;
    }

    // Itera todas as armas e adiciona elemento + elementoBonus
    Object.keys(STORY_WEAPONS).forEach(weaponId => {
        const w = STORY_WEAPONS[weaponId];
        const ato = w.ato;
        const elemento = STORY_ATO_ELEMENT[ato] || 'ANY';
        const atkBonus = STORY_ATO_ATK_SCALE[ato] || 1;

        // Atualiza os campos
        w.atkBonus = atkBonus;
        w.elemento = elemento;
        w.elementoBonus = atkBonus;  // mesmo valor, empilha com o do herói
    });

    console.log('[story] STORY_WEAPONS reescrita com elemento + escala de ATK.');
    console.log('[story] Amostra:', {
        tacape_1: STORY_WEAPONS.tacape_1,
        tacape_5: STORY_WEAPONS.tacape_5,
        tacape_9: STORY_WEAPONS.tacape_9,
        tacape_13: STORY_WEAPONS.tacape_13,
    });
})();

// =================================================================
// 4. HOOK NO executeAction — aplica bônus elemental da arma
// -----------------------------------------------------------------
// EMPILHA com o bônus do elemento do herói (Opção A).
//
// Regra:
//   • Tile do elemento do HERÓI  → +1 (já existia)
//   • Tile do elemento da ARMA   → +atkBonus (novo, empilha)
//   • Arma do Ato 13 (ANY)       → +3 sempre que o tile for do
//                                   elemento do herói
// =================================================================
(function hookWeaponElementalBonus() {
    const _exec = window.executeAction;
    if (typeof _exec !== 'function') {
        console.warn('[story] executeAction não encontrada, pulando hook de bônus elemental.');
        return;
    }

    window.executeAction = async function() {
        // Fora do modo história → original
        if (!window._storyMode) {
            return _exec.apply(this, arguments);
        }

        // Só age em herói novo
        const active = players[currentPlayerIdx];
        if (!active) return _exec.apply(this, arguments);

        const heroData = STORY_HERO_CLASSES[active.class];
        if (!heroData || !heroData.paKey || heroData.paKey.startsWith('base_')) {
            return _exec.apply(this, arguments);
        }

        // Aplica o bônus elemental da arma manipulando `active.bonusAtk`
        // temporariamente. O `_exec` recalcula `totalAtk` internamente,
        // então somamos aqui antes de chamá-la.
        const weapon = active.equippedWeapon;
        const eq = (typeof getHeroEquipment === 'function') ? getHeroEquipment(active.class) : null;
        const weaponId = eq && eq.arma ? eq.arma : null;
        const w = weaponId && typeof getWeaponById === 'function' ? getWeaponById(weaponId) : null;

        // Se não tem arma equipada, não faz nada
        if (!w) {
            return _exec.apply(this, arguments);
        }

        // Detecta se o tile inicial do caminho bate com o elemento da arma
        let weaponElementBonus = 0;
        if (path.length > 0) {
            const firstTileElement = grid[path[0]];
            const weaponElem = w.elemento;

            if (weaponElem === 'ANY') {
                // Ato 13: conta se o tile for do elemento do HERÓI
                if (firstTileElement === active.element) {
                    weaponElementBonus = w.elementoBonus || 0;
                }
            } else if (firstTileElement === weaponElem) {
                // Bônus normal: tile bate com o elemento da arma
                weaponElementBonus = w.elementoBonus || 0;
            }
        }

        if (weaponElementBonus > 0) {
            // Salva o valor original
            const origBonusAtk = active.bonusAtk || 0;
            // Soma o bônus elemental da arma (o _exec vai usar info.atk + bonusAtk + tileBonus...)
            active.bonusAtk = origBonusAtk + weaponElementBonus;

            addLog(`⚔️ Bônus elemental da arma (${w.elemento === 'ANY' ? 'abissal' : w.elemento}): +${weaponElementBonus} ATK!`);

            try {
                return await _exec.apply(this, arguments);
            } finally {
                // Restaura
                active.bonusAtk = origBonusAtk;
            }
        }

        return _exec.apply(this, arguments);
    };

    console.log('✅ Hook de bônus elemental da arma instalado.');
})();

// =================================================================
// 5. PAINEL DE DETALHES DO HERÓI — mostra o elemento da arma
// -----------------------------------------------------------------
// Sobrescreve o patchHeroDetailsWithEquipment pra incluir o elemento
// da arma e a legenda de bônus elemental.
// =================================================================
(function enhanceHeroDetailsWithWeaponElement() {
    if (typeof window.openHeroDetails !== 'function') {
        console.warn('[story] openHeroDetails não existe, pulando enriquecimento.');
        return;
    }

    const _origOpen = window.openHeroDetails;
    window.openHeroDetails = function(heroClass) {
        _origOpen.apply(this, arguments);

        const panel = document.querySelector('.hero-details-panel');
        if (!panel) return;

        const eq = (typeof getHeroEquipment === 'function') ? getHeroEquipment(heroClass) : null;
        if (!eq || !eq.arma) return;

        const w = (typeof getWeaponById === 'function') ? getWeaponById(eq.arma) : null;
        if (!w || !w.elemento) return;

        // Remove versão anterior (se houver)
        const oldSection = panel.querySelector('.hero-details-weapon-element');
        if (oldSection) oldSection.remove();

        // Monta a seção nova
        const elemDisplay = w.elemento === 'ANY'
            ? `✨ ${w.elementoBonus} ATK sempre que o tile for do elemento do herói`
            : `${elemIcon(w.elemento)} ${w.elemento} (+${w.elementoBonus} ATK quando o tile for deste elemento)`;

        const sectionHTML = `
            <div class="hero-details-section hero-details-weapon-element">
                <div class="hero-details-section-title">⚔️ BÔNUS ELEMENTAL DA ARMA</div>
                <div class="hero-details-weapon-element-line">
                    <span class="hero-details-weapon-element-label">Arma:</span>
                    <span class="hero-details-weapon-element-value">${w.emoji || '⚔️'} ${w.nome}</span>
                </div>
                <div class="hero-details-weapon-element-line">
                    <span class="hero-details-weapon-element-label">Elemento:</span>
                    <span class="hero-details-weapon-element-value">${elemDisplay}</span>
                </div>
                <div class="hero-details-note" style="margin-top:8px;">
                    💡 Os bônus do <b>elemento do herói</b> e do <b>elemento da arma</b> <b>empilham</b>.
                    Se o tile bater com os dois, você ganha os dois bônus.
                </div>
            </div>`;

        // Insere antes da seção de NOTAS (último filho) ou no final
        const notas = panel.querySelector('.hero-details-notes');
        if (notas) {
            notas.insertAdjacentHTML('beforebegin', sectionHTML);
        } else {
            panel.insertAdjacentHTML('beforeend', sectionHTML);
        }
    };

    console.log('✅ Painel do herói enriquecido com elemento da arma.');
})();

// =================================================================
// 6. CSS auxiliar do elemento da arma
// =================================================================
(function injectWeaponElementCSS() {
    if (document.getElementById('weaponElementStyle')) return;
    const style = document.createElement('style');
    style.id = 'weaponElementStyle';
    style.textContent = `
        .hero-details-weapon-element-line {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            padding: 6px 8px;
            background: rgba(10, 6, 2, 0.4);
            border-radius: 4px;
            margin-bottom: 6px;
            font-family: 'EB Garamond', serif;
            font-size: 0.9rem;
        }
        .hero-details-weapon-element-line:last-child {
            margin-bottom: 0;
        }
        .hero-details-weapon-element-label {
            color: #8a7a52;
            font-weight: 700;
            letter-spacing: 1px;
            font-size: 0.8rem;
            text-transform: uppercase;
        }
        .hero-details-weapon-element-value {
            color: #e8dcc4;
            text-align: right;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .hero-details-weapon-element-value img {
            width: 18px;
            height: 18px;
            object-fit: contain;
            vertical-align: middle;
        }
        .hero-details-weapon-element {
            background: rgba(201, 162, 39, 0.04);
            border-top: 1px solid rgba(201, 162, 39, 0.2);
        }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS do elemento da arma injetado.');
})();

// =================================================================
// 7. EXPÕE NO WINDOW
// =================================================================
window.STORY_ATO_ELEMENT = STORY_ATO_ELEMENT;
window.STORY_ATO_ATK_SCALE = STORY_ATO_ATK_SCALE;

console.log('✅ BLOCO CORRETIVO 2 (V9.0 — Armas Escaladas) carregado.');
// =================================================================
// historia.js — BLOCO CORRETIVO 3 (V9.0 — Equipamento Visual)
// -----------------------------------------------------------------
// Cole NO FINAL de historia.js, depois do Bloco 2.
//
// Contém:
//   1. Substitui o <select> de equipamento por uma GRADE DE CARDS
//      visuais no painel de detalhes do herói
//   2. Nova aba "⚔️ Equipamentos" no Inventário da Tesouraria
//      (mostra armas/amuletos forjados, quem está usando, e permite
//       equipar/desequipar diretamente de lá)
//   3. CSS completo dos cards
// =================================================================

// =================================================================
// 1. SOBRESCREVE openHeroDetails pra usar cards visuais
// -----------------------------------------------------------------
// Remove a seção de equipamento baseada em <select> e injeta uma
// grade de cards com sprite + nome + bônus + botão equipar/desequipar.
// =================================================================
(function installVisualEquipmentInHeroDetails() {
    if (typeof window.openHeroDetails !== 'function') {
        console.warn('[story] openHeroDetails não existe, pulando Bloco 3.');
        return;
    }

    // Guarda a versão atual (que já injeta a seção "BÔNUS ELEMENTAL DA ARMA")
    const _origOpen = window.openHeroDetails;

    window.openHeroDetails = function(heroClass) {
        _origOpen.apply(this, arguments);

        const panel = document.querySelector('.hero-details-panel');
        if (!panel) return;

        // Remove a seção de equipamento antiga (com <select>)
        const oldEquip = panel.querySelector('.hero-details-equipment');
        if (oldEquip) oldEquip.remove();

        // Remove a seção de elemento da arma antiga (vamos refazer junto)
        const oldWeaponElem = panel.querySelector('.hero-details-weapon-element');
        if (oldWeaponElem) oldWeaponElem.remove();

        // ---- Monta os dados ----
        const heroData = STORY_HERO_CLASSES[heroClass];
        if (!heroData) return;

        const archetype = getArchetypeFromHeroClass(heroClass);
        const eq = getHeroEquipment(heroClass);

        // Armas compatíveis forjadas
        const craftedWeapons = (STORY_PROGRESS.craftedWeapons || [])
            .map(id => getWeaponById(id))
            .filter(w => w && w.tipo === archetype);

        // Todos os amuletos forjados
        const craftedAmulets = (STORY_PROGRESS.craftedAmulets || [])
            .map(id => getAmuletById(id))
            .filter(Boolean);

        // Equipamento atual
        const equippedWeaponId = eq.arma || null;
        const equippedAmuletId = eq.amuleto || null;

        // ---- Monta a seção de EQUIPAMENTO (cards) ----
        const weaponCards = craftedWeapons.length > 0
            ? craftedWeapons.map(w => renderWeaponEquipCard(w, equippedWeaponId, heroClass)).join('')
            : `<div class="equip-empty-msg">Nenhuma arma compatível forjada. Vá à <b>Tesouraria → Forja de Armas</b>.</div>`;

        const amuletCards = craftedAmulets.length > 0
            ? craftedAmulets.map(a => renderAmuletEquipCard(a, equippedAmuletId, heroClass)).join('')
            : `<div class="equip-empty-msg">Nenhum amuleto forjado. Vá à <b>Tesouraria → Forja de Amuletos</b>.</div>`;

        const equipHTML = `
            <div class="hero-details-section hero-details-equipment">
                <div class="hero-details-section-title">⚔️ EQUIPAMENTO</div>

                <div class="equip-subsection-title">Arma (${archetype === 'tacape' ? 'Tacape' : archetype === 'flecha' ? 'Flecha' : 'Cajado'})</div>
                <div class="equip-cards-grid">
                    ${weaponCards}
                </div>

                <div class="equip-subsection-title" style="margin-top:14px;">Amuleto</div>
                <div class="equip-cards-grid">
                    ${amuletCards}
                </div>
            </div>`;

        // Insere antes da seção de NOTAS (último filho) ou no final
        const notas = panel.querySelector('.hero-details-notes');
        if (notas) {
            notas.insertAdjacentHTML('beforebegin', equipHTML);
        } else {
            panel.insertAdjacentHTML('beforeend', equipHTML);
        }
    };

    // ---- Helper: card de ARMA ----
    function renderWeaponEquipCard(w, equippedId, heroClass) {
        const isEquipped = equippedId === w.id;
        const weaponIcon = (typeof getWeaponIcon === 'function')
            ? getWeaponIcon(w.id, 'large')
            : (w.emoji || '⚔️');

        // Elemento da arma
        const elemLabel = w.elemento === 'ANY'
            ? '✨ Abissal'
            : `${elemIcon(w.elemento)} ${w.elemento}`;
        const elemClass = w.elemento === 'ANY' ? 'equip-elem-abissal' : `equip-elem-${w.elemento}`;

        // Bônus
        const bonusText = `+${w.atkBonus} ATK <span class="equip-elem-bonus">(+${w.elementoBonus} ${w.elemento === 'ANY' ? 'com elemento do herói' : 'no elemento'})</span>`;

        return `
            <div class="equip-card ${isEquipped ? 'equipped' : ''}" data-weapon-id="${w.id}">
                <div class="equip-card-icon">${weaponIcon}</div>
                <div class="equip-card-info">
                    <div class="equip-card-name">${w.nome}</div>
                    <div class="equip-card-bonus">${bonusText}</div>
                    <div class="equip-card-elem ${elemClass}">${elemLabel}</div>
                </div>
                <button class="equip-card-btn ${isEquipped ? 'unequip' : 'equip'}"
                        onclick="handleWeaponCardClick('${heroClass.replace(/'/g, "\\'")}', '${w.id}', ${isEquipped})">
                    ${isEquipped ? '✕ Remover' : '⚔️ Equipar'}
                </button>
            </div>`;
    }

    // ---- Helper: card de AMULETO ----
    function renderAmuletEquipCard(a, equippedId, heroClass) {
        const isEquipped = equippedId === a.id;
        const amuletIcon = (typeof getAmuletIcon === 'function')
            ? getAmuletIcon(a.id, 'large')
            : (a.emoji || '🧿');

        // Efeitos resumidos
        const ef = a.efeito || {};
        const efeitos = [];
        if (ef.elementOverride) efeitos.push(`${elemIcon(ef.elementOverride)} ${ef.elementOverride}`);
        if (ef.hpBonus)         efeitos.push(`❤️ +${ef.hpBonus} HP`);
        if (ef.atkBonus)        efeitos.push(`⚔️ +${ef.atkBonus} ATK`);
        if (ef.healPerTurn)     efeitos.push(`💚 +${ef.healPerTurn} HP/turno`);
        const efeitosText = efeitos.join(' · ') || '—';

        return `
            <div class="equip-card ${isEquipped ? 'equipped' : ''}" data-amulet-id="${a.id}">
                <div class="equip-card-icon">${amuletIcon}</div>
                <div class="equip-card-info">
                    <div class="equip-card-name">${a.nome}</div>
                    <div class="equip-card-bonus">${efeitosText}</div>
                </div>
                <button class="equip-card-btn ${isEquipped ? 'unequip' : 'equip'}"
                        onclick="handleAmuletCardClick('${heroClass.replace(/'/g, "\\'")}', '${a.id}', ${isEquipped})">
                    ${isEquipped ? '✕ Remover' : '🧿 Equipar'}
                </button>
            </div>`;
    }

    console.log('✅ Painel do herói agora usa CARDS visuais de equipamento.');
})();

// =================================================================
// 2. HANDLERS dos botões dos cards
// =================================================================
window.handleWeaponCardClick = function(heroClass, weaponId, isEquipped) {
    if (isEquipped) {
        // Desequipar
        if (typeof unequipWeapon === 'function') {
            unequipWeapon(heroClass);
            showToast('⚔️', 'Arma removida.', '⚔️');
        }
    } else {
        // Equipar
        if (typeof equipWeapon === 'function') {
            const r = equipWeapon(heroClass, weaponId);
            if (!r.ok) {
                showToast('❌', r.error, '❌');
                return;
            }
            const w = getWeaponById(weaponId);
            showToast('⚔️ Equipado!', `${w.emoji || ''} ${w.nome}`, '⚔️');
        }
    }
    // Reabre o painel pra atualizar
    if (typeof window.openHeroDetails === 'function') {
        setTimeout(() => {
            // Fecha o antigo
            if (typeof closeHeroDetails === 'function') closeHeroDetails();
            // Reabre depois da animação
            setTimeout(() => window.openHeroDetails(heroClass), 320);
        }, 100);
    }
};

window.handleAmuletCardClick = function(heroClass, amuletId, isEquipped) {
    if (isEquipped) {
        if (typeof unequipAmulet === 'function') {
            unequipAmulet(heroClass);
            showToast('🧿', 'Amuleto removido.', '🧿');
        }
    } else {
        if (typeof equipAmulet === 'function') {
            const r = equipAmulet(heroClass, amuletId);
            if (!r.ok) {
                showToast('❌', r.error, '❌');
                return;
            }
            const a = getAmuletById(amuletId);
            showToast('🧿 Equipado!', `${a.emoji || ''} ${a.nome}`, '🧿');
        }
    }
    if (typeof window.openHeroDetails === 'function') {
        setTimeout(() => {
            if (typeof closeHeroDetails === 'function') closeHeroDetails();
            setTimeout(() => window.openHeroDetails(heroClass), 320);
        }, 100);
    }
};

// =================================================================
// 3. INVENTÁRIO DA TESOURARIA — nova aba "Equipamentos"
// -----------------------------------------------------------------
// Sobrescreve renderTesourariaInventario pra incluir os equipamentos.
// =================================================================
(function enhanceTesourariaInventory() {
    if (typeof window.renderTesourariaInventario !== 'function') {
        console.warn('[story] renderTesourariaInventario não existe, pulando.');
        return;
    }

    // Sobrescreve a aba de Inventário pra adicionar uma seção de equipamentos
    const _origInv = window.renderTesourariaInventario;

    window.renderTesourariaInventario = function(materialIds) {
        // Chama a versão original (que renderiza os materiais)
        const materialHTML = _origInv.apply(this, arguments);

        // Monta a seção de equipamentos
        const weapons = (STORY_PROGRESS.craftedWeapons || [])
            .map(id => getWeaponById(id))
            .filter(Boolean);

        const amulets = (STORY_PROGRESS.craftedAmulets || [])
            .map(id => getAmuletById(id))
            .filter(Boolean);

        // Descobre quem está usando cada equipamento
        const usageMap = {};
        const eqMap = STORY_PROGRESS.heroEquipment || {};
        for (const heroClass in eqMap) {
            const e = eqMap[heroClass];
            if (e.arma) usageMap[e.arma] = heroClass;
            if (e.amuleto) usageMap[e.amuleto] = heroClass;
        }

        let weaponsHTML = '';
        if (weapons.length === 0) {
            weaponsHTML = `<div class="inv-empty-line">Nenhuma arma forjada ainda.</div>`;
        } else {
            weaponsHTML = weapons.map(w => {
                const equippedBy = usageMap[w.id];
                const owner = equippedBy
                    ? (STORY_HERO_CLASSES[equippedBy]?.displayName || equippedBy)
                    : null;
                const icon = (typeof getWeaponIcon === 'function')
                    ? getWeaponIcon(w.id, 'normal')
                    : (w.emoji || '⚔️');
                return `
                    <div class="inv-equip-row">
                        <div class="inv-equip-icon">${icon}</div>
                        <div class="inv-equip-info">
                            <div class="inv-equip-name">${w.nome}</div>
                            <div class="inv-equip-meta">
                                +${w.atkBonus} ATK
                                ${w.elemento === 'ANY' ? '· ✨ Abissal' : `· ${elemIcon(w.elemento)} ${w.elemento}`}
                            </div>
                        </div>
                        <div class="inv-equip-owner ${owner ? 'used' : 'free'}">
                            ${owner ? `👤 ${owner}` : '— Livre —'}
                        </div>
                    </div>`;
            }).join('');
        }

        let amuletsHTML = '';
        if (amulets.length === 0) {
            amuletsHTML = `<div class="inv-empty-line">Nenhum amuleto forjado ainda.</div>`;
        } else {
            amuletsHTML = amulets.map(a => {
                const equippedBy = usageMap[a.id];
                const owner = equippedBy
                    ? (STORY_HERO_CLASSES[equippedBy]?.displayName || equippedBy)
                    : null;
                const icon = (typeof getAmuletIcon === 'function')
                    ? getAmuletIcon(a.id, 'normal')
                    : (a.emoji || '🧿');
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
                            <div class="inv-equip-name">${a.nome}</div>
                            <div class="inv-equip-meta">${efeitos.join(' · ') || '—'}</div>
                        </div>
                        <div class="inv-equip-owner ${owner ? 'used' : 'free'}">
                            ${owner ? `👤 ${owner}` : '— Livre —'}
                        </div>
                    </div>`;
            }).join('');
        }

        const equipSection = `
            <div class="inv-equipment-section">
                <div class="inv-equipment-title">⚔️ ARMAS FORJADAS</div>
                <div class="inv-equip-list">${weaponsHTML}</div>

                <div class="inv-equipment-title" style="margin-top:16px;">🧿 AMULETOS FORJADOS</div>
                <div class="inv-equip-list">${amuletsHTML}</div>

                <div class="inv-equipment-hint">
                    💡 Para equipar, abra o <b>painel de um herói</b> na <b>OCA</b> (botão <b>?</b>) e escolha o item.
                </div>
            </div>`;

        return materialHTML + equipSection;
    };

    console.log('✅ Inventário da Tesouraria enriquecido com equipamentos.');
})();

// =================================================================
// 4. CSS DOS CARDS DE EQUIPAMENTO
// =================================================================
(function injectEquipCardsCSS() {
    if (document.getElementById('equipCardsStyle')) return;
    const style = document.createElement('style');
    style.id = 'equipCardsStyle';
    style.textContent = `
        /* ============ CARDS NO PAINEL DO HERÓI ============ */
        .equip-subsection-title {
            font-family: 'Cinzel', serif;
            color: #e8b923;
            font-size: 0.75rem;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1px solid rgba(201, 162, 39, 0.2);
        }

        .equip-cards-grid {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .equip-card {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background: rgba(10, 6, 2, 0.55);
            border: 2px solid rgba(201, 162, 39, 0.25);
            border-radius: 6px;
            transition: all 0.2s;
        }

        .equip-card:hover {
            border-color: rgba(201, 162, 39, 0.5);
            background: rgba(10, 6, 2, 0.75);
        }

        .equip-card.equipped {
            border-color: #6ba35c;
            background:
                linear-gradient(180deg, rgba(107, 163, 92, 0.12), transparent 60%),
                rgba(10, 6, 2, 0.6);
            box-shadow: 0 0 12px rgba(107, 163, 92, 0.25);
        }

        .equip-card-icon {
            width: 44px;
            height: 44px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: radial-gradient(circle, rgba(0,0,0,0.5), transparent 70%);
            border-radius: 4px;
        }

        .equip-card-icon img {
            width: 40px;
            height: 40px;
            object-fit: contain;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.7));
        }

        .equip-card-icon .weapon-emoji,
        .equip-card-icon .weapon-emoji-large {
            font-size: 2rem;
            line-height: 1;
        }

        .equip-card-info {
            flex: 1;
            min-width: 0;
        }

        .equip-card-name {
            font-family: 'Cinzel', serif;
            color: #f0e2c0;
            font-size: 0.9rem;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
            line-height: 1.15;
        }

        .equip-card-bonus {
            font-family: 'EB Garamond', serif;
            color: #8ac070;
            font-size: 0.78rem;
            line-height: 1.3;
        }

        .equip-elem-bonus {
            color: #c8b787;
            font-style: italic;
            font-size: 0.72rem;
        }

        .equip-card-elem {
            font-family: 'Cinzel', serif;
            font-size: 0.7rem;
            letter-spacing: 1px;
            margin-top: 4px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            border-radius: 10px;
            background: rgba(10, 6, 2, 0.5);
            border: 1px solid rgba(201, 162, 39, 0.3);
        }

        .equip-card-elem img {
            width: 12px;
            height: 12px;
            object-fit: contain;
        }

        .equip-elem-FOGO   { color: #e74c3c; border-color: rgba(231, 76, 60, 0.5); }
        .equip-elem-AGUA   { color: #3498db; border-color: rgba(52, 152, 219, 0.5); }
        .equip-elem-TERRA  { color: #27ae60; border-color: rgba(39, 174, 96, 0.5); }
        .equip-elem-AR     { color: #f1c40f; border-color: rgba(241, 196, 15, 0.5); }
        .equip-elem-abissal{ color: #c39bd3; border-color: rgba(195, 155, 211, 0.6);
                              background: linear-gradient(180deg, rgba(142, 68, 173, 0.2), transparent 70%); }

        .equip-card-btn {
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 0.75rem;
            letter-spacing: 1px;
            transition: all 0.2s;
            flex-shrink: 0;
            white-space: nowrap;
        }

        .equip-card-btn.equip {
            background:
                linear-gradient(180deg, rgba(232, 185, 35, 0.2), transparent 45%),
                linear-gradient(135deg, #8a6a2e, #4a3418);
            color: #fff5dc;
            border: 1.5px solid #e8b923;
        }

        .equip-card-btn.equip:hover {
            transform: translateY(-1px);
            box-shadow: 0 3px 10px rgba(0,0,0,0.5), 0 0 15px rgba(232, 185, 35, 0.4);
        }

        .equip-card-btn.unequip {
            background:
                linear-gradient(180deg, rgba(168, 50, 50, 0.15), transparent 45%),
                linear-gradient(135deg, #6a2020, #3a1010);
            color: #f5c8c8;
            border: 1.5px solid #a83232;
        }

        .equip-card-btn.unequip:hover {
            transform: translateY(-1px);
            box-shadow: 0 3px 10px rgba(0,0,0,0.5), 0 0 15px rgba(168, 50, 50, 0.4);
        }

        .equip-empty-msg {
            font-family: 'EB Garamond', serif;
            color: #8a7a52;
            font-size: 0.85rem;
            font-style: italic;
            padding: 10px;
            background: rgba(10, 6, 2, 0.4);
            border-left: 3px solid #6a5024;
            border-radius: 4px;
            line-height: 1.4;
        }

        /* ============ SEÇÃO DE EQUIPAMENTOS NO INVENTÁRIO ============ */
        .inv-equipment-section {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 2px solid rgba(201, 162, 39, 0.25);
        }

        .inv-equipment-title {
            font-family: 'Cinzel', serif;
            color: #e8b923;
            font-size: 0.9rem;
            letter-spacing: 2px;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 1px solid rgba(201, 162, 39, 0.2);
        }

        .inv-equip-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .inv-equip-row {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            background: rgba(10, 6, 2, 0.5);
            border: 1px solid rgba(201, 162, 39, 0.2);
            border-left: 3px solid #c9a227;
            border-radius: 5px;
            transition: all 0.2s;
        }

        .inv-equip-row:hover {
            border-left-color: #e8b923;
            background: rgba(10, 6, 2, 0.7);
        }

        .inv-equip-row.amulet {
            border-left-color: #8e44ad;
        }

        .inv-equip-row.amulet:hover {
            border-left-color: #c39bd3;
        }

        .inv-equip-icon {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            background: radial-gradient(circle, rgba(0,0,0,0.4), transparent 70%);
            border-radius: 4px;
        }

        .inv-equip-icon img {
            width: 36px;
            height: 36px;
            object-fit: contain;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));
        }

        .inv-equip-icon .weapon-emoji,
        .inv-equip-icon .weapon-emoji-large {
            font-size: 1.8rem;
            line-height: 1;
        }

        .inv-equip-info {
            flex: 1;
            min-width: 0;
        }

        .inv-equip-name {
            font-family: 'Cinzel', serif;
            color: #f0e2c0;
            font-size: 0.92rem;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
            line-height: 1.15;
        }

        .inv-equip-meta {
            font-family: 'EB Garamond', serif;
            color: #b8a577;
            font-size: 0.8rem;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            flex-wrap: wrap;
        }

        .inv-equip-meta img {
            width: 14px;
            height: 14px;
            object-fit: contain;
            vertical-align: middle;
        }

        .inv-equip-owner {
            font-family: 'EB Garamond', serif;
            font-size: 0.82rem;
            padding: 4px 10px;
            border-radius: 12px;
            white-space: nowrap;
            flex-shrink: 0;
        }

        .inv-equip-owner.used {
            background: rgba(107, 163, 92, 0.15);
            border: 1px solid rgba(107, 163, 92, 0.4);
            color: #8ac070;
        }

        .inv-equip-owner.free {
            background: rgba(10, 6, 2, 0.4);
            border: 1px dashed rgba(201, 162, 39, 0.3);
            color: #8a7a52;
            font-style: italic;
        }

        .inv-empty-line {
            font-family: 'EB Garamond', serif;
            color: #8a7a52;
            font-size: 0.85rem;
            font-style: italic;
            padding: 10px;
            background: rgba(10, 6, 2, 0.3);
            border-radius: 4px;
            text-align: center;
        }

        .inv-equipment-hint {
            margin-top: 16px;
            padding: 12px;
            background: rgba(201, 162, 39, 0.06);
            border-left: 3px solid #c9a227;
            border-radius: 4px;
            font-family: 'EB Garamond', serif;
            color: #d9c89a;
            font-size: 0.88rem;
            font-style: italic;
            line-height: 1.5;
        }

        /* Responsivo */
        @media (max-width: 600px) {
            .equip-card {
                flex-wrap: wrap;
            }
            .equip-card-btn {
                width: 100%;
                margin-top: 6px;
            }
            .inv-equip-row {
                flex-wrap: wrap;
            }
            .inv-equip-owner {
                width: 100%;
                text-align: center;
                margin-top: 4px;
            }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS dos cards de equipamento injetado.');
})();

// =================================================================
// 5. EXPÕE NO WINDOW
// =================================================================
// (handlers já expostos no item 2)

console.log('✅ BLOCO CORRETIVO 3 (V9.0 — Equipamento Visual) carregado.');
// =================================================================
// historia.js — BLOCO CORRETIVO 4 (V9.0 — Atmosfera Intensificada)
// -----------------------------------------------------------------
// Cole NO FINAL de historia.js, depois do Bloco 3.
//
// Contém:
//   1. Tint por ato (tinge o tabuleiro inteiro com mix-blend-mode)
//   2. Vinheta temática nas bordas
//   3. Partículas intensificadas (~40% mais + maiores)
//   4. Substitui applyBoardAtmosphere por versão mais rica
// =================================================================

// =================================================================
// 1. TABELA DE TINT POR ATO
// -----------------------------------------------------------------
// Cada ato tem:
//   • tintCor:    cor base do tint (aplicado via overlay)
//   • tintMix:    mix-blend-mode do tint
//   • tintOpac:   opacidade máxima do tint
//   • vinhetaCor: cor da vinheta (radial escuro nas bordas)
//   • vinhetaOpac: opacidade da vinheta
// =================================================================
const STORY_ATO_TINT = {
    1:  { tintCor: 'rgba(74, 138, 58, 0.28)',   tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(20, 40, 15, 0.75)',  vinhetaOpac: 1 },
    2:  { tintCor: 'rgba(139, 100, 40, 0.32)',  tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(40, 30, 10, 0.8)',   vinhetaOpac: 1 },
    3:  { tintCor: 'rgba(58, 124, 165, 0.35)',  tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(15, 35, 55, 0.8)',   vinhetaOpac: 1 },
    4:  { tintCor: 'rgba(200, 60, 20, 0.32)',   tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(50, 12, 5, 0.8)',    vinhetaOpac: 1 },
    5:  { tintCor: 'rgba(230, 110, 35, 0.35)',  tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(45, 18, 5, 0.8)',    vinhetaOpac: 1 },
    6:  { tintCor: 'rgba(180, 140, 90, 0.35)',  tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(45, 35, 20, 0.8)',   vinhetaOpac: 1 },
    7:  { tintCor: 'rgba(80, 110, 150, 0.35)',  tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(15, 25, 45, 0.85)',  vinhetaOpac: 1 },
    8:  { tintCor: 'rgba(142, 68, 173, 0.35)',  tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(35, 10, 55, 0.85)',  vinhetaOpac: 1 },
    9:  { tintCor: 'rgba(232, 67, 147, 0.28)',  tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(45, 10, 35, 0.8)',   vinhetaOpac: 1 },
    10: { tintCor: 'rgba(44, 62, 80, 0.45)',    tintMix: 'multiply',   tintOpac: 1,    vinhetaCor: 'rgba(5, 10, 20, 0.9)',    vinhetaOpac: 1 },
    11: { tintCor: 'rgba(241, 196, 15, 0.28)',  tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(40, 35, 5, 0.8)',    vinhetaOpac: 1 },
    12: { tintCor: 'rgba(255, 165, 40, 0.35)',  tintMix: 'overlay',    tintOpac: 1,    vinhetaCor: 'rgba(50, 25, 5, 0.85)',   vinhetaOpac: 1 },
    13: { tintCor: 'rgba(80, 20, 120, 0.40)',   tintMix: 'multiply',   tintOpac: 1,    vinhetaCor: 'rgba(15, 0, 25, 0.95)',   vinhetaOpac: 1 },
};

// =================================================================
// 2. CSS NOVO (substitui o anterior)
// =================================================================
(function injectIntenseAtmosphereCSS() {
    // Remove o antigo
    const old = document.getElementById('atmosphereStyleClean');
    if (old) old.remove();

    const style = document.createElement('style');
    style.id = 'atmosphereStyleClean';
    style.textContent = `
        /* ============ BOARD ============ */
        #board {
            position: relative;
        }

        /* ============ CAMADAS ============ */
        #board > .board-atmosphere {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            border-radius: 6px;
            overflow: hidden;
            z-index: 0;
        }

        #board > .board-tint {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            border-radius: 6px;
            overflow: hidden;
            z-index: 2;
            transition: opacity 0.6s ease;
        }

        #board > .board-vignette {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            border-radius: 6px;
            overflow: hidden;
            z-index: 3;
        }

        #board > .board-particles {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
            border-radius: 6px;
            z-index: 4;
        }

        #board > .grid {
            position: relative;
            z-index: 1;
        }

        #board > .token {
            z-index: 10;
        }

        #board > .story-fx,
        #board > [class*="fx-"] {
            z-index: 50;
        }

        /* ============ PARTÍCULAS ============ */
        .atm-particle {
            position: absolute;
            pointer-events: none;
            opacity: 0;
            will-change: top, bottom, left, transform, opacity;
        }

        /* 1. FOLHAS */
        .atm-particle.pt-folha {
            top: -30px;
            width: var(--p-size, 12px);
            height: var(--p-size, 12px);
            background: linear-gradient(135deg, #6a8a4a, #3a5020);
            border-radius: 50% 10% 50% 10%;
            box-shadow: 0 0 6px rgba(0,0,0,0.5);
            animation: folhaFall linear infinite;
        }
        @keyframes folhaFall {
            0%   { top: -30px;             transform: translateX(0) rotate(0deg); opacity: 0; }
            10%  { opacity: 0.95; }
            50%  { top: 50%;               transform: translateX(30px) rotate(180deg); opacity: 1; }
            90%  { opacity: 0.85; }
            100% { top: calc(100% + 30px); transform: translateX(-20px) rotate(360deg); opacity: 0; }
        }

        /* 2. NÉVOA ÂMBAR */
        .atm-particle.pt-poeira-ambar {
            bottom: -30px;
            width: var(--p-size, 8px);
            height: var(--p-size, 8px);
            background: radial-gradient(circle, #e8b923, rgba(217,184,64,0));
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(232, 185, 35, 0.7);
            animation: poeiraFlutua ease-in-out infinite;
        }
        @keyframes poeiraFlutua {
            0%   { bottom: -30px;             transform: translateX(0) scale(0.6); opacity: 0; }
            30%  { opacity: 1; }
            50%  { bottom: 40%;               transform: translateX(20px) scale(1.3); opacity: 0.9; }
            80%  { opacity: 0.75; }
            100% { bottom: calc(100% + 30px); transform: translateX(-15px) scale(0.7); opacity: 0; }
        }

        /* 3. ÁGUA (BOLHAS) */
        .atm-particle.pt-bolha {
            bottom: -20px;
            width: var(--p-size, 12px);
            height: var(--p-size, 12px);
            background: radial-gradient(circle at 30% 30%, rgba(200,230,245,0.95), rgba(74,140,181,0.6) 60%, transparent 100%);
            border: 1.5px solid rgba(200,230,245,0.6);
            border-radius: 50%;
            box-shadow: 0 0 8px rgba(74, 140, 181, 0.6);
            animation: bolhaSobe ease-in infinite;
        }
        @keyframes bolhaSobe {
            0%   { bottom: -20px;             transform: translateX(0) scale(0.5); opacity: 0; }
            20%  { opacity: 1; }
            80%  { opacity: 0.85; }
            100% { bottom: calc(100% + 20px); transform: translateX(15px) scale(1.4); opacity: 0; }
        }

        /* 4. BRASAS */
        .atm-particle.pt-brasa {
            bottom: -20px;
            width: var(--p-size, 8px);
            height: var(--p-size, 8px);
            background: radial-gradient(circle, #fff5dc 0%, #e67e22 40%, #a83232 80%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 12px rgba(232, 110, 35, 1), 0 0 20px rgba(232, 110, 35, 0.6);
            animation: brasaSubindo ease-out infinite;
        }
        @keyframes brasaSubindo {
            0%   { bottom: -20px;             transform: translateX(0) scale(0.4); opacity: 0; }
            15%  { opacity: 1; }
            70%  { opacity: 0.95; }
            100% { bottom: calc(100% + 20px); transform: translateX(25px) scale(0.3); opacity: 0; }
        }

        /* 5. FAÍSCAS */
        .atm-particle.pt-faisca {
            bottom: -10px;
            width: var(--p-size, 6px);
            height: var(--p-size, 6px);
            background: #e8b923;
            border-radius: 50%;
            box-shadow: 0 0 12px #e8b923, 0 0 22px rgba(232,185,35,0.8);
            animation: faiscaPula ease-out infinite;
        }
        @keyframes faiscaPula {
            0%   { bottom: -10px;             transform: translateX(0) scale(0.3); opacity: 0; }
            20%  { opacity: 1; }
            60%  { opacity: 0.9; }
            100% { bottom: calc(100% + 10px); transform: translateX(35px) scale(0.2); opacity: 0; }
        }

        /* 6. POEIRA */
        .atm-particle.pt-poeira {
            left: -30px;
            width: var(--p-size, 10px);
            height: var(--p-size, 10px);
            background: radial-gradient(circle, rgba(200, 160, 100, 0.9), rgba(139,90,43,0));
            border-radius: 50%;
            box-shadow: 0 0 8px rgba(200, 160, 100, 0.6);
            animation: poeiraHorizontal linear infinite;
        }
        @keyframes poeiraHorizontal {
            0%   { left: -30px;              transform: translateY(0) scale(0.6); opacity: 0; }
            20%  { opacity: 0.9; }
            80%  { opacity: 0.75; }
            100% { left: calc(100% + 30px);  transform: translateY(-15px) scale(1); opacity: 0; }
        }

        /* 7. LUAR */
        .atm-particle.pt-luar {
            bottom: -20px;
            width: var(--p-size, 8px);
            height: var(--p-size, 8px);
            background: radial-gradient(circle, #d0e0f0, rgba(168,192,216,0));
            border-radius: 50%;
            box-shadow: 0 0 12px rgba(168,192,216,1), 0 0 24px rgba(168,192,216,0.6);
            animation: luarSobe ease-in-out infinite;
        }
        @keyframes luarSobe {
            0%   { bottom: -20px;             transform: scale(0.5); opacity: 0; }
            30%  { opacity: 0.95; }
            70%  { opacity: 0.85; }
            100% { bottom: calc(100% + 20px); transform: scale(1.2); opacity: 0; }
        }

        /* 8. FUMAÇA ROXA + COGUMELOS */
        .atm-particle.pt-fumaca {
            bottom: -30px;
            width: var(--p-size, 20px);
            height: var(--p-size, 20px);
            background: radial-gradient(circle, rgba(142,68,173,0.85) 0%, rgba(90,42,112,0.55) 40%, transparent 75%);
            border-radius: 50%;
            filter: blur(4px);
            animation: fumacaSobe ease-in-out infinite;
        }
        @keyframes fumacaSobe {
            0%   { bottom: -30px;             transform: translateX(0) scale(0.5); opacity: 0; }
            30%  { opacity: 0.75; }
            70%  { opacity: 0.65; }
            100% { bottom: calc(100% + 30px); transform: translateX(25px) scale(1.6); opacity: 0; }
        }
        .atm-particle.pt-cogumelo {
            top: 50%;
            width: var(--p-size, 10px);
            height: var(--p-size, 10px);
            background: radial-gradient(circle, #c080e0 0%, #8e44ad 60%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 15px rgba(192,128,224,1), 0 0 28px rgba(142,68,173,0.6);
            animation: cogumeloPisca ease-in-out infinite;
        }
        @keyframes cogumeloPisca {
            0%, 100% { opacity: 0.35; transform: scale(0.7); }
            50%      { opacity: 1;   transform: scale(1.4); }
        }

        /* 9. RIO */
        .atm-particle.pt-bolha-rio {
            bottom: -20px;
            width: var(--p-size, 12px);
            height: var(--p-size, 12px);
            background: radial-gradient(circle at 30% 30%, rgba(232,67,147,0.85), rgba(52,152,219,0.55) 60%, transparent 100%);
            border: 1.5px solid rgba(232, 67, 147, 0.7);
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(232, 67, 147, 0.6);
            animation: bolhaRioSobe ease-in infinite;
        }
        @keyframes bolhaRioSobe {
            0%   { bottom: -20px;             transform: translateX(0) scale(0.5); opacity: 0; }
            20%  { opacity: 1; }
            80%  { opacity: 0.85; }
            100% { bottom: calc(100% + 20px); transform: translateX(-15px) scale(1.5); opacity: 0; }
        }

        /* 10. GOTAS */
        .atm-particle.pt-gota {
            top: -20px;
            width: 3px;
            height: 14px;
            background: linear-gradient(180deg, transparent, rgba(168, 192, 216, 1));
            box-shadow: 0 0 4px rgba(168, 192, 216, 0.8);
            animation: gotaCai linear infinite;
        }
        @keyframes gotaCai {
            0%   { top: -20px;             opacity: 0; }
            10%  { opacity: 1; }
            100% { top: calc(100% + 20px); opacity: 0.6; }
        }

        /* 11. ESTRELAS */
        .atm-particle.pt-estrela {
            top: 30%;
            width: var(--p-size, 8px);
            height: var(--p-size, 8px);
            background: radial-gradient(circle, #fff5dc, #f1c40f 60%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 12px #f1c40f, 0 0 24px rgba(241, 196, 15, 0.6);
            animation: estrelaPisca ease-in-out infinite;
        }
        @keyframes estrelaPisca {
            0%, 100% { opacity: 0.25; transform: scale(0.7); }
            50%      { opacity: 1;   transform: scale(1.5); }
        }

        /* 12. SOL */
        .atm-particle.pt-sol {
            bottom: -20px;
            width: var(--p-size, 10px);
            height: var(--p-size, 10px);
            background: radial-gradient(circle, #fff5dc 0%, #e8b923 50%, #a83232 100%);
            border-radius: 50%;
            box-shadow: 0 0 18px rgba(232, 185, 35, 1), 0 0 35px rgba(232, 185, 35, 0.6);
            animation: solFaisca ease-out infinite;
        }
        @keyframes solFaisca {
            0%   { bottom: -20px;             transform: translateX(0) scale(0.4); opacity: 0; }
            20%  { opacity: 1; }
            60%  { opacity: 0.95; }
            100% { bottom: calc(100% + 20px); transform: translateX(30px) scale(0.3); opacity: 0; }
        }

        /* 13. ABISMO */
        .atm-particle.pt-abismo {
            top: 40%;
            width: var(--p-size, 10px);
            height: var(--p-size, 10px);
            background: radial-gradient(circle, #c080e0, #6a1090 60%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 18px rgba(106, 16, 144, 1), 0 0 32px rgba(142, 68, 173, 0.7);
            animation: abismoFlutua ease-in-out infinite;
        }
        @keyframes abismoFlutua {
            0%, 100% { transform: translate(0, 0) scale(0.7); opacity: 0.5; }
            50%      { transform: translate(15px, -20px) scale(1.4); opacity: 1; }
        }

        /* ============ FUNDOS POR ATO (INTENSIFICADOS) ============ */
        .board-atmosphere.atm-folhas-bg {
            background:
                radial-gradient(ellipse at 30% 20%, rgba(120, 180, 90, 0.25) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 80%, rgba(74, 107, 58, 0.20) 0%, transparent 55%);
        }
        .board-atmosphere.atm-nevoa-ambar-bg {
            background:
                radial-gradient(ellipse at top, rgba(217,184,64,0.28), transparent 55%),
                radial-gradient(ellipse at bottom, rgba(139, 100, 40, 0.30), transparent 60%);
        }
        .board-atmosphere.atm-agua-bg {
            background:
                linear-gradient(180deg, rgba(52,152,219,0.20) 0%, rgba(52,152,219,0.35) 50%, rgba(52,152,219,0.20) 100%),
                radial-gradient(ellipse at bottom, rgba(20, 60, 100, 0.4), transparent 60%);
        }
        .board-atmosphere.atm-brasas-bg {
            background:
                radial-gradient(ellipse at bottom, rgba(232,110,35,0.45) 0%, rgba(168,50,50,0.25) 40%, transparent 75%);
        }
        .board-atmosphere.atm-chamas-bg {
            background:
                linear-gradient(90deg, rgba(232,110,35,0.35) 0%, transparent 20%, transparent 80%, rgba(232,110,35,0.35) 100%),
                radial-gradient(ellipse at bottom, rgba(255,80,20,0.4), transparent 60%);
        }
        .board-atmosphere.atm-poeira-bg {
            background:
                radial-gradient(ellipse at top, rgba(217,184,64,0.20), transparent 55%),
                linear-gradient(180deg, rgba(200, 160, 100, 0.25), rgba(139,90,43,0.35));
        }
        .board-atmosphere.atm-luar-bg {
            background:
                radial-gradient(ellipse at top, rgba(168,192,216,0.35), transparent 55%),
                linear-gradient(180deg, rgba(80,110,150,0.25), rgba(20,30,50,0.40));
        }
        .board-atmosphere.atm-fumaca-roxa-bg {
            background:
                radial-gradient(circle at 25% 70%, rgba(142,68,173,0.40), transparent 45%),
                radial-gradient(circle at 75% 30%, rgba(90,42,112,0.40), transparent 45%),
                linear-gradient(180deg, rgba(80,20,120,0.25), rgba(35,10,55,0.40));
        }
        .board-atmosphere.atm-rio-bolhas-bg {
            background:
                linear-gradient(180deg, rgba(232,67,147,0.18) 0%, rgba(52,152,219,0.30) 50%, rgba(232,67,147,0.20) 100%),
                radial-gradient(ellipse at top, rgba(255, 100, 180, 0.20), transparent 60%);
        }
        .board-atmosphere.atm-tempestade-bg {
            background:
                radial-gradient(ellipse at top, rgba(44,62,80,0.50), transparent 55%),
                linear-gradient(180deg, rgba(20,30,45,0.45), rgba(5,10,20,0.55));
        }
        .board-atmosphere.atm-estrelas-bg {
            background:
                radial-gradient(ellipse at top, rgba(241,196,15,0.22), transparent 55%),
                radial-gradient(ellipse at bottom, rgba(168,192,216,0.22), transparent 60%),
                linear-gradient(180deg, rgba(60, 50, 15, 0.20), rgba(20, 15, 5, 0.30));
        }
        .board-atmosphere.atm-sol-bg {
            background:
                radial-gradient(ellipse at top, rgba(255, 180, 40, 0.40), transparent 60%),
                linear-gradient(180deg, rgba(255, 140, 30, 0.30), rgba(168, 50, 30, 0.30));
        }
        .board-atmosphere.atm-abismo-bg {
            background:
                radial-gradient(ellipse at center, rgba(120, 30, 180, 0.45), transparent 60%),
                linear-gradient(180deg, rgba(50, 10, 80, 0.45), rgba(15, 0, 25, 0.55));
        }

        @media (prefers-reduced-motion: reduce) {
            .atm-particle { animation: none !important; }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS intensificado da atmosfera injetado.');
})();

// =================================================================
// 3. GERADOR DE PARTÍCULAS — versão intensificada
// =================================================================
function generateParticlesIntense(cid) {
    const atmClass = STORY_ATO_ATMOSPHERE[cid];
    if (!atmClass) return '';

    const makeParticles = (count, cls, opts = {}) => {
        let html = '';
        for (let i = 0; i < count; i++) {
            const left = Math.random() * 100;
            const delay = Math.random() * 6;
            const duration = 4 + Math.random() * 4;
            const size = opts.sizeMin + Math.random() * (opts.sizeMax - opts.sizeMin);

            html += `<div class="atm-particle ${cls}"
                          style="left:${left}%;animation-delay:-${delay}s;animation-duration:${duration}s;--p-size:${size}px;"></div>`;
        }
        return html;
    };

    // Contagem +40%, tamanho +30%
    switch (atmClass) {
        case 'atm-folhas':      return makeParticles(20, 'pt-folha',        { sizeMin:8,  sizeMax:16 });
        case 'atm-nevoa-ambar': return makeParticles(18, 'pt-poeira-ambar', { sizeMin:5,  sizeMax:9  });
        case 'atm-agua':        return makeParticles(24, 'pt-bolha',        { sizeMin:6,  sizeMax:13 });
        case 'atm-brasas':      return makeParticles(26, 'pt-brasa',        { sizeMin:4,  sizeMax:9  });
        case 'atm-chamas':      return makeParticles(28, 'pt-faisca',       { sizeMin:3,  sizeMax:7  });
        case 'atm-poeira':      return makeParticles(20, 'pt-poeira',       { sizeMin:6,  sizeMax:11 });
        case 'atm-luar':        return makeParticles(18, 'pt-luar',         { sizeMin:5,  sizeMax:9  });
        case 'atm-fumaca-roxa': return makeParticles(14, 'pt-fumaca',       { sizeMin:12, sizeMax:22 })
                                     + makeParticles(12, 'pt-cogumelo',     { sizeMin:7,  sizeMax:12 });
        case 'atm-rio-bolhas':  return makeParticles(28, 'pt-bolha-rio',    { sizeMin:6,  sizeMax:13 });
        case 'atm-tempestade':  return makeParticles(32, 'pt-gota',         { sizeMin:2,  sizeMax:4  });
        case 'atm-estrelas':    return makeParticles(28, 'pt-estrela',      { sizeMin:5,  sizeMax:10 });
        case 'atm-sol':         return makeParticles(24, 'pt-sol',          { sizeMin:6,  sizeMax:12 });
        case 'atm-abismo':      return makeParticles(24, 'pt-abismo',       { sizeMin:6,  sizeMax:11 });
        default:                return '';
    }
}

// =================================================================
// 4. clearBoardAtmosphere — remove as novas camadas também
// =================================================================
function clearBoardAtmosphereIntense() {
    const board = document.getElementById('board');
    if (!board) return;

    board.querySelectorAll(':scope > .board-atmosphere, :scope > .board-tint, :scope > .board-vignette, :scope > .board-particles').forEach(el => el.remove());

    board.classList.forEach(cls => {
        if (cls.startsWith('atm-')) board.classList.remove(cls);
    });
    board.classList.remove('has-atmosphere');
}

// =================================================================
// 5. applyBoardAtmosphere — versão intensificada
// =================================================================
function applyBoardAtmosphereIntense(cid) {
    const board = document.getElementById('board');
    if (!board) return;
    if (!window._storyMode) return;
    if (!cid) return;

    clearBoardAtmosphereIntense();

    const atmClass = STORY_ATO_ATMOSPHERE[cid];
    if (!atmClass) return;

    const tintCfg = STORY_ATO_TINT[cid];
    if (!tintCfg) return;

    board.classList.add(atmClass);
    board.classList.add('has-atmosphere');

    // ---- Camada 1: fundo temático ----
    const atmos = document.createElement('div');
    atmos.className = 'board-atmosphere ' + atmClass + '-bg';
    board.appendChild(atmos);

    // ---- Camada 2: tint colorido (por cima do grid) ----
    const tint = document.createElement('div');
    tint.className = 'board-tint';
    tint.style.background = tintCfg.tintCor;
    tint.style.mixBlendMode = tintCfg.tintMix;
    tint.style.opacity = tintCfg.tintOpac;
    board.appendChild(tint);

    // ---- Camada 3: vinheta ----
    const vin = document.createElement('div');
    vin.className = 'board-vignette';
    vin.style.background = `radial-gradient(ellipse at center, transparent 30%, ${tintCfg.vinhetaCor} 100%)`;
    vin.style.opacity = tintCfg.vinhetaOpac;
    board.appendChild(vin);

    // ---- Camada 4: partículas ----
    const part = document.createElement('div');
    part.className = 'board-particles ' + atmClass + '-pt';
    part.innerHTML = generateParticlesIntense(cid);
    board.appendChild(part);

    // Reorganiza a ordem no DOM: grid primeiro
    const grid = board.querySelector(':scope > .grid');
    if (grid && grid !== board.firstElementChild) {
        board.insertBefore(grid, board.firstElementChild);
    }

    console.log('[atmosfera] Aplicada (intensa) no Ato', cid, '→', atmClass, '| tint:', tintCfg.tintCor);
}

// =================================================================
// 6. HOOKS — substitui applyBoardAtmosphere e clearBoardAtmosphere
// =================================================================
(function hookIntenseAtmosphere() {
    // Expõe as novas funções
    window.applyBoardAtmosphere = applyBoardAtmosphereIntense;
    window.clearBoardAtmosphere = clearBoardAtmosphereIntense;

    // Reinstala o hook do initStoryBattle (já existia, mas agora usa a versão nova)
    const _origInit = window.initStoryBattle;
    if (typeof _origInit === 'function') {
        // Marca que já foi hookado por este bloco
        if (!window._intenseAtmosphereHookInstalled) {
            window._intenseAtmosphereHookInstalled = true;

            window.initStoryBattle = async function() {
                await _origInit.apply(this, arguments);
                await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
                const cid = STORY_PROGRESS.currentChapter || 1;
                applyBoardAtmosphereIntense(cid);
            };
        }
    }

    // Reinstala o hook de cleanup
    const _origFinish = window.finishStoryPhase;
    if (typeof _origFinish === 'function' && !window._intenseAtmosphereCleanupInstalled) {
        window._intenseAtmosphereCleanupInstalled = true;
        window.finishStoryPhase = function() {
            clearBoardAtmosphereIntense();
            return _origFinish.apply(this, arguments);
        };
    }

    const _origReturn = window.returnFromStoryVictory;
    if (typeof _origReturn === 'function' && !window._intenseAtmosphereReturnInstalled) {
        window._intenseAtmosphereReturnInstalled = true;
        window.returnFromStoryVictory = function() {
            clearBoardAtmosphereIntense();
            return _origReturn.apply(this, arguments);
        };
    }
})();

// =================================================================
// 7. TESTES
// =================================================================
window.testAtmosphere = function(cid) {
    cid = parseInt(cid) || 1;
    applyBoardAtmosphereIntense(cid);
    console.log('[atmosfera] Testando Ato', cid);
};
window.clearAtmosphere = function() {
    clearBoardAtmosphereIntense();
    console.log('[atmosfera] Limpa.');
};

console.log('✅ BLOCO CORRETIVO 4 (V9.0 — Atmosfera Intensificada) carregado.');
// =================================================================
// historia.js — BLOCO CORRETIVO 5 (V9.0 — Consolidação Final)
// -----------------------------------------------------------------
// Cole NO FINAL de historia.js, depois do Bloco 4.
//
// Contém:
//   1. Ajuste do Ato 2 (Mata Fechada) — atmosfera correta
//   2. Re-log de versão consolidada (V9.0)
//   3. Sistema de "reconstrução de save" leve:
//      • Garante que todos os campos novos existem
//      • Corrige saves antigos que não têm enemiesDefeatedIds
//   4. Estatísticas de debug úteis no console
// =================================================================

// =================================================================
// 1. AJUSTE DO ATO 2 — Mata Fechada (era nevoa-ambar)
// -----------------------------------------------------------------
// Substitui a atmosfera do Ato 2:
//   • Remove partículas de poeira amarela subindo
//   • Adiciona folhas caindo + névoa densa escura no fundo
//   • Tint mais escuro/verde musgo
// =================================================================
(function fixAto2Atmosphere() {
    // 1.1 — Atualiza o mapa de atmosfera
    if (typeof STORY_ATO_ATMOSPHERE !== 'undefined') {
        STORY_ATO_ATMOSPHERE[2] = 'atm-mata-fechada';
    }

    // 1.2 — Atualiza o tint
    if (typeof STORY_ATO_TINT !== 'undefined') {
        STORY_ATO_TINT[2] = {
            tintCor: 'rgba(30, 60, 25, 0.38)',   // verde musgo escuro
            tintMix: 'multiply',                  // escurece em vez de overlay
            tintOpac: 1,
            vinhetaCor: 'rgba(10, 25, 8, 0.9)',   // vinheta muito escura
            vinhetaOpac: 1
        };
    }

    // 1.3 — Injeta o CSS da nova atmosfera do Ato 2
    if (!document.getElementById('ato2AtmosphereStyle')) {
        const style = document.createElement('style');
        style.id = 'ato2AtmosphereStyle';
        style.textContent = `
            /* ============ FUNDO DA MATA FECHADA ============ */
            .board-atmosphere.atm-mata-fechada-bg {
                background:
                    radial-gradient(ellipse at 50% 10%, rgba(80, 130, 60, 0.35) 0%, transparent 45%),
                    radial-gradient(ellipse at 20% 90%, rgba(20, 50, 15, 0.55) 0%, transparent 55%),
                    radial-gradient(ellipse at 80% 90%, rgba(20, 50, 15, 0.55) 0%, transparent 55%),
                    linear-gradient(180deg, rgba(30, 60, 25, 0.40), rgba(10, 25, 8, 0.55));
            }

            /* ============ PARTÍCULAS DA MATA FECHADA ============ */

            /* Folhas verdes caindo lentamente */
            .atm-particle.pt-folha-mata {
                top: -30px;
                width: var(--p-size, 12px);
                height: var(--p-size, 12px);
                background: linear-gradient(135deg, #4a6b3a 0%, #2d4523 60%, #1a2f14 100%);
                border-radius: 60% 20% 70% 20%;
                box-shadow:
                    0 0 4px rgba(0, 0, 0, 0.7),
                    inset 0 0 3px rgba(120, 180, 90, 0.4);
                animation: folhaMataFall linear infinite;
            }
            @keyframes folhaMataFall {
                0%   { top: -30px;             transform: translateX(0) rotate(0deg) scale(0.9); opacity: 0; }
                10%  { opacity: 1; }
                30%  { transform: translateX(-25px) rotate(120deg) scale(1); }
                60%  { transform: translateX(20px) rotate(280deg) scale(1); }
                90%  { opacity: 0.9; }
                100% { top: calc(100% + 30px); transform: translateX(-10px) rotate(420deg) scale(0.95); opacity: 0; }
            }

            /* Névoa densa subindo (mais escura que a do Ato 1) */
            .atm-particle.pt-nevoa-mata {
                bottom: -40px;
                width: var(--p-size, 24px);
                height: var(--p-size, 24px);
                background: radial-gradient(circle, rgba(80, 110, 70, 0.7) 0%, rgba(40, 70, 30, 0.5) 40%, transparent 75%);
                border-radius: 50%;
                filter: blur(5px);
                animation: nevoaMataSobe ease-in-out infinite;
            }
            @keyframes nevoaMataSobe {
                0%   { bottom: -40px;             transform: translateX(0) scale(0.5); opacity: 0; }
                25%  { opacity: 0.7; }
                60%  { opacity: 0.55; }
                100% { bottom: calc(100% + 40px); transform: translateX(30px) scale(1.8); opacity: 0; }
            }

            /* Esporos brilhantes (pequenos pontos verdes-claros) */
            .atm-particle.pt-esporo {
                top: 40%;
                width: var(--p-size, 6px);
                height: var(--p-size, 6px);
                background: radial-gradient(circle, #a8e088 0%, #6ba35c 60%, transparent 100%);
                border-radius: 50%;
                box-shadow: 0 0 8px rgba(168, 224, 136, 0.8);
                animation: esporoPisca ease-in-out infinite;
            }
            @keyframes esporoPisca {
                0%, 100% { opacity: 0.3; transform: scale(0.8); }
                50%      { opacity: 1;   transform: scale(1.4); }
            }

            /* Galhos/gravetos flutuando (raros) */
            .atm-particle.pt-graveto {
                top: -20px;
                width: var(--p-size, 4px);
                height: calc(var(--p-size, 4px) * 3);
                background: linear-gradient(180deg, #6a4a20, #3a2a14);
                border-radius: 1px;
                box-shadow: 0 0 3px rgba(0, 0, 0, 0.6);
                animation: gravetoFall linear infinite;
            }
            @keyframes gravetoFall {
                0%   { top: -20px;             transform: translateX(0) rotate(0deg); opacity: 0; }
                15%  { opacity: 0.85; }
                50%  { transform: translateX(-30px) rotate(180deg); }
                100% { top: calc(100% + 20px); transform: translateX(20px) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // 1.4 — Substitui generateParticlesIntense pra tratar o novo Ato 2
    const _origGenerate = window.generateParticlesIntense;
    if (typeof _origGenerate === 'function' && !window._ato2ParticlesPatched) {
        window._ato2ParticlesPatched = true;

        window.generateParticlesIntense = function(cid) {
            if (parseInt(cid) === 2) {
                // Ato 2 — Mata Fechada
                const makeP = (count, cls, opts = {}) => {
                    let html = '';
                    for (let i = 0; i < count; i++) {
                        const left = Math.random() * 100;
                        const delay = Math.random() * 6;
                        const duration = 5 + Math.random() * 4;
                        const size = opts.sizeMin + Math.random() * (opts.sizeMax - opts.sizeMin);
                        html += `<div class="atm-particle ${cls}"
                                      style="left:${left}%;animation-delay:-${delay}s;animation-duration:${duration}s;--p-size:${size}px;"></div>`;
                    }
                    return html;
                };
                return makeP(16, 'pt-folha-mata', { sizeMin: 8, sizeMax: 16 })
                     + makeP(14, 'pt-nevoa-mata', { sizeMin: 16, sizeMax: 28 })
                     + makeP(12, 'pt-esporo',     { sizeMin: 4, sizeMax: 8 })
                     + makeP(4,  'pt-graveto',    { sizeMin: 3, sizeMax: 6 });
            }
            return _origGenerate.apply(this, arguments);
        };
    }

    console.log('✅ Ato 2 corrigido — Mata Fechada com folhas, névoa e esporos.');
})();

// =================================================================
// 2. RECONSTRUÇÃO DE SAVE — garante todos os campos novos
// -----------------------------------------------------------------
// Roda uma vez ao carregar. Corrige saves antigos que possam ter
// ficado sem campos novos introduzidos pelos blocos V9.0.
// =================================================================
(function rebuildSaveIntegrity() {
    if (typeof STORY_PROGRESS === 'undefined') return;

    let changed = false;

    // 2.1 — Bestiário
    if (!Array.isArray(STORY_PROGRESS.enemiesDefeatedIds)) {
        STORY_PROGRESS.enemiesDefeatedIds = [];
        changed = true;
    }
    if (Array.isArray(STORY_PROGRESS.bossesDefeated)) {
        STORY_PROGRESS.bossesDefeated.forEach(id => {
            if (!STORY_PROGRESS.enemiesDefeatedIds.includes(id)) {
                STORY_PROGRESS.enemiesDefeatedIds.push(id);
                changed = true;
            }
        });
    }

    // 2.2 — Equipamentos por herói
    if (!STORY_PROGRESS.heroEquipment || typeof STORY_PROGRESS.heroEquipment !== 'object') {
        STORY_PROGRESS.heroEquipment = {};
        changed = true;
    }

    // 2.3 — Armas e amuletos forjados
    if (!Array.isArray(STORY_PROGRESS.craftedWeapons)) {
        STORY_PROGRESS.craftedWeapons = [];
        changed = true;
    }
    if (!Array.isArray(STORY_PROGRESS.craftedAmulets)) {
        STORY_PROGRESS.craftedAmulets = [];
        changed = true;
    }

    // 2.4 — Níveis e XP de heróis
    if (!STORY_PROGRESS.heroLevels || typeof STORY_PROGRESS.heroLevels !== 'object') {
        STORY_PROGRESS.heroLevels = {};
        changed = true;
    }
    if (!STORY_PROGRESS.heroXP || typeof STORY_PROGRESS.heroXP !== 'object') {
        STORY_PROGRESS.heroXP = {};
        changed = true;
    }

    // 2.5 — Estrelas
    if (!STORY_PROGRESS.starsByPhase || typeof STORY_PROGRESS.starsByPhase !== 'object') {
        STORY_PROGRESS.starsByPhase = {};
        changed = true;
    }

    // 2.6 — Heróis desbloqueados na história
    if (!Array.isArray(STORY_PROGRESS.unlockedHeroesStory)) {
        STORY_PROGRESS.unlockedHeroesStory = ['Tupa', 'Sume', 'Caipora'];
        changed = true;
    }

    // 2.7 — Capítulos e fases desbloqueados
    if (!Array.isArray(STORY_PROGRESS.unlockedChapters) || STORY_PROGRESS.unlockedChapters.length === 0) {
        STORY_PROGRESS.unlockedChapters = [1];
        changed = true;
    }
    if (!STORY_PROGRESS.unlockedPhases || Object.keys(STORY_PROGRESS.unlockedPhases).length === 0) {
        STORY_PROGRESS.unlockedPhases = { 1: ['1-1'] };
        changed = true;
    }

    // 2.8 — Fases completadas
    if (!Array.isArray(STORY_PROGRESS.completedPhases)) {
        STORY_PROGRESS.completedPhases = [];
        changed = true;
    }
    if (!Array.isArray(STORY_PROGRESS.phasesEverCompleted)) {
        STORY_PROGRESS.phasesEverCompleted = [];
        changed = true;
    }

    // 2.9 — Inventário
    if (!STORY_PROGRESS.inventory || typeof STORY_PROGRESS.inventory !== 'object') {
        STORY_PROGRESS.inventory = {};
        changed = true;
    }

    // 2.10 — Seleção de heróis
    if (!Array.isArray(STORY_PROGRESS.selectedHeroes) || STORY_PROGRESS.selectedHeroes.length === 0) {
        STORY_PROGRESS.selectedHeroes = ['Tupa'];
        changed = true;
    }

    if (changed && typeof saveStoryProgress === 'function') {
        saveStoryProgress();
        console.log('✅ Save reconstruído (campos ausentes corrigidos).');
    }
})();

// =================================================================
// 3. EXPÕE FERRAMENTAS DE DEBUG
// =================================================================
window.storyDebug = {
    // Mostra um resumo completo do estado atual
    dump: function() {
        console.group('📖 STORY DEBUG');
        console.log('Save ativo:', STORY_CURRENT_SAVE_NAME);
        console.log('Progresso:', STORY_PROGRESS);
        console.log('Elemento base:', getSaveElement());
        console.log('Estrelas:', getTotalStars(), '/', getMaxTotalStars());
        console.log('Heróis desbloqueados:', STORY_PROGRESS.unlockedHeroesStory);
        console.log('Armas forjadas:', STORY_PROGRESS.craftedWeapons);
        console.log('Amuletos forjados:', STORY_PROGRESS.craftedAmulets);
        console.log('Equipamentos:', STORY_PROGRESS.heroEquipment);
        console.log('Bestiário (IDs descobertos):', STORY_PROGRESS.enemiesDefeatedIds);
        console.log('Estados de herói (níveis):', STORY_PROGRESS.heroLevels);
        console.groupEnd();
    },

    // Testa uma arma específica
    testWeapon: function(weaponId) {
        const w = getWeaponById(weaponId);
        if (!w) {
            console.warn('Arma não encontrada:', weaponId);
            return;
        }
        console.group(`⚔️ ${w.nome}`);
        console.log('ID:', w.id);
        console.log('Tipo:', w.tipo);
        console.log('Ato:', w.ato);
        console.log('ATK base:', w.atkBonus);
        console.log('Elemento:', w.elemento);
        console.log('Bônus elemental:', w.elementoBonus);
        console.log('Custo ouro:', w.custoOuro);
        console.log('Receita:', w.receita);
        console.groupEnd();
    },

    // Lista todas as armas de um tipo
    listWeapons: function(tipo) {
        const filtered = Object.values(STORY_WEAPONS).filter(w => !tipo || w.tipo === tipo);
        console.table(filtered.map(w => ({
            id: w.id,
            nome: w.nome,
            ato: w.ato,
            tipo: w.tipo,
            atkBase: w.atkBonus,
            elem: w.elemento,
            elemBonus: w.elementoBonus,
            ouro: w.custoOuro,
        })));
    },

    // Simula o bônus de uma arma num tile específico
    simulateBonus: function(weaponId, tileElement, heroElement) {
        const w = getWeaponById(weaponId);
        if (!w) return;
        let weaponBonus = 0;
        if (w.elemento === 'ANY') {
            if (tileElement === heroElement) weaponBonus = w.elementoBonus;
        } else if (tileElement === w.elemento) {
            weaponBonus = w.elementoBonus;
        }
        const heroBonus = (tileElement === heroElement) ? 1 : 0;
        console.log(`⚔️ Simulação — ${w.nome}`);
        console.log(`Tile: ${tileElement} | Herói: ${heroElement} | Arma: ${w.elemento}`);
        console.log(`ATK base da arma: +${w.atkBonus}`);
        console.log(`Bônus elemental da arma: +${weaponBonus}`);
        console.log(`Bônus elemental do herói: +${heroBonus}`);
        console.log(`🎯 TOTAL extra: +${w.atkBonus + weaponBonus + heroBonus}`);
    },
};

// =================================================================
// 4. LOG FINAL CONSOLIDADO
// =================================================================
console.log('');
console.log('═══════════════════════════════════════════════════');
console.log('📖 historia.js — V9.0 CONSOLIDADO');
console.log('═══════════════════════════════════════════════════');
console.log('Blocos aplicados:');
console.log('  ✅ V8.x — Base do Modo História (13 atos)');
console.log('  ✅ V8.2 — Ritual, Bestiário, Filtros, Níveis');
console.log('  ✅ V8.3 — Tesouraria (Armas, Amuletos, Forja)');
console.log('  ✅ V8.5 — Atmosfera temática');
console.log('  ✅ V8.6 — Fixes (sprite boss + PA continuado)');
console.log('  ✅ V9.0-B1 — PA robusto, bestiário, purificação');
console.log('  ✅ V9.0-B2 — Armas escaladas + elemento');
console.log('  ✅ V9.0-B3 — Equipamento visual (cards)');
console.log('  ✅ V9.0-B4 — Atmosfera intensificada');
console.log('  ✅ V9.0-B5 — Consolidação final');
console.log('');
console.log('💡 Comandos úteis no console:');
console.log('   window.storyDebug.dump()              → resumo do estado');
console.log('   window.storyDebug.listWeapons()       → tabela de armas');
console.log('   window.storyDebug.listWeapons("tacape") → só tacapes');
console.log('   window.storyDebug.testWeapon("tacape_13") → detalhe de 1 arma');
console.log('   window.storyDebug.simulateBonus("tacape_1", "AR", "TERRA")');
console.log('   window.testAtmosphere(4)              → testa atmosfera do Ato 4');
console.log('   window.resetStoryMode()               → apaga todos os saves');
console.log('═══════════════════════════════════════════════════');
console.log('');
// =================================================================
// historia.js — BLOCO CORRETIVO 6 (V9.0 — Fix Esporos Ato 2)
// -----------------------------------------------------------------
// Corrige os esporos do Ato 2 que estavam estáticos numa fileira.
// Agora eles flutuam livremente pelo tabuleiro em todas as direções.
// =================================================================

(function fixEsporosAto2() {
    // Remove o CSS anterior dos esporos (se existir)
    const oldStyle = document.getElementById('ato2AtmosphereStyle');
    if (oldStyle) oldStyle.remove();

    // Injeta o CSS corrigido
    const style = document.createElement('style');
    style.id = 'ato2AtmosphereStyle';
    style.textContent = `
        /* ============ FUNDO DA MATA FECHADA ============ */
        .board-atmosphere.atm-mata-fechada-bg {
            background:
                radial-gradient(ellipse at 50% 10%, rgba(80, 130, 60, 0.35) 0%, transparent 45%),
                radial-gradient(ellipse at 20% 90%, rgba(20, 50, 15, 0.55) 0%, transparent 55%),
                radial-gradient(ellipse at 80% 90%, rgba(20, 50, 15, 0.55) 0%, transparent 55%),
                linear-gradient(180deg, rgba(30, 60, 25, 0.40), rgba(10, 25, 8, 0.55));
        }

        /* ============ PARTÍCULAS DA MATA FECHADA ============ */

        /* Folhas verdes caindo lentamente */
        .atm-particle.pt-folha-mata {
            top: -30px;
            width: var(--p-size, 12px);
            height: var(--p-size, 12px);
            background: linear-gradient(135deg, #4a6b3a 0%, #2d4523 60%, #1a2f14 100%);
            border-radius: 60% 20% 70% 20%;
            box-shadow:
                0 0 4px rgba(0, 0, 0, 0.7),
                inset 0 0 3px rgba(120, 180, 90, 0.4);
            animation: folhaMataFall linear infinite;
        }
        @keyframes folhaMataFall {
            0%   { top: -30px;             transform: translateX(0) rotate(0deg) scale(0.9); opacity: 0; }
            10%  { opacity: 1; }
            30%  { transform: translateX(-25px) rotate(120deg) scale(1); }
            60%  { transform: translateX(20px) rotate(280deg) scale(1); }
            90%  { opacity: 0.9; }
            100% { top: calc(100% + 30px); transform: translateX(-10px) rotate(420deg) scale(0.95); opacity: 0; }
        }

        /* Névoa densa subindo */
        .atm-particle.pt-nevoa-mata {
            bottom: -40px;
            width: var(--p-size, 24px);
            height: var(--p-size, 24px);
            background: radial-gradient(circle, rgba(80, 110, 70, 0.7) 0%, rgba(40, 70, 30, 0.5) 40%, transparent 75%);
            border-radius: 50%;
            filter: blur(5px);
            animation: nevoaMataSobe ease-in-out infinite;
        }
        @keyframes nevoaMataSobe {
            0%   { bottom: -40px;             transform: translateX(0) scale(0.5); opacity: 0; }
            25%  { opacity: 0.7; }
            60%  { opacity: 0.55; }
            100% { bottom: calc(100% + 40px); transform: translateX(30px) scale(1.8); opacity: 0; }
        }

        /* ✨ ESPOROS — agora flutuam livremente pelo tabuleiro */
        .atm-particle.pt-esporo {
            /* Posição inicial vem do style inline (left + top aleatórios) */
            width: var(--p-size, 6px);
            height: var(--p-size, 6px);
            background: radial-gradient(circle, #a8e088 0%, #6ba35c 60%, transparent 100%);
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(168, 224, 136, 1), 0 0 20px rgba(107, 163, 92, 0.6);
            animation: esporoFlutua ease-in-out infinite;
        }
        @keyframes esporoFlutua {
            0% {
                opacity: 0;
                transform: translate(0, 0) scale(0.4);
            }
            15% {
                opacity: 0.4;
            }
            35% {
                opacity: 1;
                transform: translate(calc(var(--drift-x, 20px) * 0.4), calc(var(--drift-y, -20px) * 0.5)) scale(1.2);
            }
            65% {
                opacity: 0.9;
                transform: translate(calc(var(--drift-x, 20px) * 0.8), calc(var(--drift-y, -20px) * 0.85)) scale(0.9);
            }
            85% {
                opacity: 0.5;
            }
            100% {
                opacity: 0;
                transform: translate(var(--drift-x, 20px), var(--drift-y, -20px)) scale(0.4);
            }
        }

        /* Galhos/gravetos flutuando (raros) */
        .atm-particle.pt-graveto {
            top: -20px;
            width: var(--p-size, 4px);
            height: calc(var(--p-size, 4px) * 3);
            background: linear-gradient(180deg, #6a4a20, #3a2a14);
            border-radius: 1px;
            box-shadow: 0 0 3px rgba(0, 0, 0, 0.6);
            animation: gravetoFall linear infinite;
        }
        @keyframes gravetoFall {
            0%   { top: -20px;             transform: translateX(0) rotate(0deg); opacity: 0; }
            15%  { opacity: 0.85; }
            50%  { transform: translateX(-30px) rotate(180deg); }
            100% { top: calc(100% + 20px); transform: translateX(20px) rotate(360deg); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Sobrescreve o gerador de partículas do Ato 2
    // pra dar posição inicial aleatória (left E top) + direção de drift aleatória.
    const _origGen = window.generateParticlesIntense;
    if (typeof _origGen === 'function') {
        window.generateParticlesIntense = function(cid) {
            if (parseInt(cid) === 2) {
                // ---- Helper genérico ----
                const makeP = (count, cls, opts = {}) => {
                    let html = '';
                    for (let i = 0; i < count; i++) {
                        const left = Math.random() * 100;
                        const delay = Math.random() * 6;
                        const duration = opts.minDur + Math.random() * (opts.maxDur - opts.minDur);
                        const size = opts.sizeMin + Math.random() * (opts.sizeMax - opts.sizeMin);
                        html += `<div class="atm-particle ${cls}"
                                      style="left:${left}%;animation-delay:-${delay}s;animation-duration:${duration}s;--p-size:${size}px;"></div>`;
                    }
                    return html;
                };

                // ---- Helper SÓ pros esporos: posição inicial 2D + drift 2D ----
                const makeEsporos = (count) => {
                    let html = '';
                    for (let i = 0; i < count; i++) {
                        const left = Math.random() * 90 + 5;      // 5% a 95%
                        const top = Math.random() * 80 + 10;      // 10% a 90%
                        const delay = Math.random() * 8;
                        const duration = 6 + Math.random() * 5;   // 6s a 11s
                        const size = 4 + Math.random() * 5;       // 4px a 9px
                        // Direção de drift aleatória: -40px a +40px em X, -50px a +20px em Y
                        const driftX = (Math.random() * 80 - 40).toFixed(1);
                        const driftY = (Math.random() * 70 - 50).toFixed(1);
                        html += `<div class="atm-particle pt-esporo"
                                      style="left:${left}%;top:${top}%;
                                             animation-delay:-${delay}s;
                                             animation-duration:${duration}s;
                                             --p-size:${size}px;
                                             --drift-x:${driftX}px;
                                             --drift-y:${driftY}px;"></div>`;
                    }
                    return html;
                };

                // ---- Monta as 4 camadas ----
                // Folhas caem de cima pra baixo
                let html = makeP(16, 'pt-folha-mata', { sizeMin: 8, sizeMax: 16, minDur: 5, maxDur: 9 });
                // Névoa sobe de baixo pra cima
                html += makeP(14, 'pt-nevoa-mata', { sizeMin: 16, sizeMax: 28, minDur: 5, maxDur: 9 });
                // Esporos flutuam livremente (posição 2D + drift 2D)
                html += makeEsporos(16);
                // Gravetos caem de cima pra baixo
                html += makeP(4, 'pt-graveto', { sizeMin: 3, sizeMax: 6, minDur: 4, maxDur: 8 });

                return html;
            }
            return _origGen.apply(this, arguments);
        };
    }

    console.log('✅ Esporos do Ato 2 corrigidos — flutuam livremente.');
})();

console.log('✅ BLOCO CORRETIVO 6 (V9.0 — Fix Esporos Ato 2) carregado.');
// =================================================================
// historia.js — BLOCO 7 (V9.1 — Configurações do Modo História)
// -----------------------------------------------------------------
// Cole NO FINAL de historia.js, depois do Bloco 6.
//
// Contém:
//   1. Estrutura de configurações persistidas em localStorage
//   2. Tela de Configurações do Modo História (acessível pela Aldeia)
//   3. Slider de Intensidade da Atmosfera (aplica em tempo real)
//   4. Sliders de Volume (Música e Efeitos)
//   5. Toggle de Auto-Save visual
//   6. Botão "CONFIGURAÇÕES" na Aldeia
// =================================================================

// =================================================================
// 1. ESTRUTURA DE CONFIGURAÇÕES
// =================================================================
const STORY_SETTINGS_KEY = 'entity_story_settings';

const STORY_DEFAULT_SETTINGS = {
    atmosphereIntensity: 100,   // 0 a 150 (%)
    musicVolume: 70,            // 0 a 100 (%)
    sfxVolume: 80,              // 0 a 100 (%)
    autoSaveNotify: true,       // mostra "💾 Salvo!"
};

let STORY_SETTINGS = { ...STORY_DEFAULT_SETTINGS };

function loadStorySettings() {
    try {
        const raw = localStorage.getItem(STORY_SETTINGS_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            STORY_SETTINGS = { ...STORY_DEFAULT_SETTINGS, ...parsed };
        }
    } catch(e) {
        console.warn('[settings] Falha ao carregar, usando padrão:', e);
    }
}

function saveStorySettings() {
    try {
        localStorage.setItem(STORY_SETTINGS_KEY, JSON.stringify(STORY_SETTINGS));
    } catch(e) {
        console.warn('[settings] Falha ao salvar:', e);
    }
}

// Aplica as configurações no jogo (chamado ao iniciar e ao mudar)
function applyStorySettings() {
    // ---- 1. Intensidade da atmosfera ----
    applyAtmosphereIntensity(STORY_SETTINGS.atmosphereIntensity);

    // ---- 2. Volume da música ----
    applyMusicVolume(STORY_SETTINGS.musicVolume);

    // ---- 3. Volume dos efeitos ----
    applySfxVolume(STORY_SETTINGS.sfxVolume);
}

function applyAtmosphereIntensity(pct) {
    // Multiplica a opacidade dos elementos de atmosfera
    // O CSS da atmosfera usa var(--atm-intensity, 1) como multiplicador
    const root = document.documentElement;
    const factor = Math.max(0, Math.min(1.5, pct / 100));
    root.style.setProperty('--atm-intensity', factor.toString());

    // Também aplica nas camadas diretamente (fallback, se o CSS não usar var)
    const tints = document.querySelectorAll('#board > .board-tint');
    const vins = document.querySelectorAll('#board > .board-vignette');
    const parts = document.querySelectorAll('#board > .board-particles');
    const atms = document.querySelectorAll('#board > .board-atmosphere');

    tints.forEach(el => el.style.opacity = factor);
    vins.forEach(el => el.style.opacity = factor);
    parts.forEach(el => el.style.opacity = factor);
    atms.forEach(el => el.style.opacity = Math.min(1, factor));

    console.log(`[settings] Atmosfera: ${pct}% (fator ${factor})`);
}

function applyMusicVolume(pct) {
    const vol = Math.max(0, Math.min(100, pct)) / 100;
    // Aplica em TODAS as faixas de música do sfx
    if (typeof sfx !== 'undefined') {
        const musicTracks = [
            'bgm', 'sacitema', 'mapinguaritema', 'boitatatema', 'iaratema',
            'corposecotema', 'lobisomemtema', 'cucatema', 'mulatema',
            'bototema', 'boitema', 'jacitema', 'guaracitema', 'anhangatema'
        ];
        musicTracks.forEach(k => {
            if (sfx[k]) sfx[k].volume = 0.3 * vol; // 0.3 era o volume original
        });
    }
    console.log(`[settings] Música: ${pct}%`);
}

function applySfxVolume(pct) {
    // Guarda globalmente pra ser usado no playSfx
    window._sfxVolumeMultiplier = Math.max(0, Math.min(100, pct)) / 100;
    console.log(`[settings] Efeitos: ${pct}%`);
}

// =================================================================
// 2. HOOK NO playSfx — respeita o volume configurado
// =================================================================
(function hookSfxVolume() {
    const _origPlaySfx = window.playSfx;
    if (typeof _origPlaySfx !== 'function') return;

    window.playSfx = function(name) {
        if (!audioUnlocked || !sfx[name]) return;
        const sound = sfx[name].cloneNode();
        const baseVol = 0.6;
        const mult = (typeof window._sfxVolumeMultiplier === 'number')
            ? window._sfxVolumeMultiplier
            : 1;
        sound.volume = baseVol * mult;
        sound.play().catch(() => {});
    };

    console.log('✅ playSfx agora respeita o volume configurado.');
})();

// =================================================================
// 3. AUTO-SAVE VISUAL
// =================================================================
(function installAutoSaveFeedback() {
    const _origSave = window.saveStoryProgress;
    if (typeof _origSave !== 'function') return;

    let saveIndicatorTimeout = null;

    window.saveStoryProgress = function() {
        try {
            _origSave.apply(this, arguments);

            // Só mostra o feedback se a opção estiver ligada
            if (!STORY_SETTINGS.autoSaveNotify) return;

            // Cria/atualiza o indicador
            let indicator = document.getElementById('storySaveIndicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'storySaveIndicator';
                indicator.className = 'story-save-indicator';
                indicator.innerHTML = '💾 Salvo!';
                document.body.appendChild(indicator);
            }

            // Reinicia a animação
            indicator.classList.remove('show');
            void indicator.offsetWidth; // força reflow
            indicator.classList.add('show');

            // Esconde depois de 2s
            clearTimeout(saveIndicatorTimeout);
            saveIndicatorTimeout = setTimeout(() => {
                indicator.classList.remove('show');
            }, 2000);

        } catch(e) {
            console.warn('[autosave] Erro:', e);
        }
    };

    console.log('✅ Auto-save visual instalado.');
})();

// =================================================================
// 4. TELA DE CONFIGURAÇÕES DO MODO HISTÓRIA
// =================================================================
function renderStorySettingsScreen() {
    const screen = document.getElementById('storyScreen');
    if (!screen) return;

    // Garante que as configs estão carregadas
    loadStorySettings();

    screen.innerHTML = `
        <div class="story-container">
            <div class="story-header">
                <h1 class="story-title">⚙️ CONFIGURAÇÕES</h1>
                <p class="story-subtitle">Ajuste a experiência do Modo História</p>
            </div>

            <div class="story-settings-panel">

                <!-- ATMOSFERA -->
                <div class="story-settings-section">
                    <div class="story-settings-section-title">🎨 ATMOSFERA DO TABULEIRO</div>
                    <div class="story-settings-row">
                        <label class="story-settings-label">Intensidade</label>
                        <div class="story-settings-slider-wrap">
                            <input type="range" id="setAtmIntensity" class="story-settings-slider"
                                   min="0" max="150" step="5"
                                   value="${STORY_SETTINGS.atmosphereIntensity}">
                            <span id="setAtmIntensityVal" class="story-settings-value">${STORY_SETTINGS.atmosphereIntensity}%</span>
                        </div>
                    </div>
                    <div class="story-settings-hint">
                        Controla o tint, a vinheta e as partículas temáticas de cada ato.
                        Reduza se o tabuleiro ficar difícil de ver em telas pequenas.
                    </div>
                </div>

                <!-- ÁUDIO -->
                <div class="story-settings-section">
                    <div class="story-settings-section-title">🔊 ÁUDIO</div>

                    <div class="story-settings-row">
                        <label class="story-settings-label">Música</label>
                        <div class="story-settings-slider-wrap">
                            <input type="range" id="setMusicVol" class="story-settings-slider"
                                   min="0" max="100" step="5"
                                   value="${STORY_SETTINGS.musicVolume}">
                            <span id="setMusicVolVal" class="story-settings-value">${STORY_SETTINGS.musicVolume}%</span>
                        </div>
                    </div>

                    <div class="story-settings-row">
                        <label class="story-settings-label">Efeitos</label>
                        <div class="story-settings-slider-wrap">
                            <input type="range" id="setSfxVol" class="story-settings-slider"
                                   min="0" max="100" step="5"
                                   value="${STORY_SETTINGS.sfxVolume}">
                            <span id="setSfxVolVal" class="story-settings-value">${STORY_SETTINGS.sfxVolume}%</span>
                        </div>
                    </div>
                </div>

                <!-- FEEDBACK -->
                <div class="story-settings-section">
                    <div class="story-settings-section-title">💬 FEEDBACK</div>
                    <div class="story-settings-row">
                        <label class="story-settings-label">Notificação de Auto-Save</label>
                        <label class="story-settings-toggle">
                            <input type="checkbox" id="setAutoSave" ${STORY_SETTINGS.autoSaveNotify ? 'checked' : ''}>
                            <span class="story-settings-toggle-slider"></span>
                        </label>
                    </div>
                    <div class="story-settings-hint">
                        Mostra um aviso "💾 Salvo!" toda vez que o jogo salvar o progresso.
                    </div>
                </div>

                <!-- BOTÕES -->
                <div class="story-settings-actions">
                    <button class="story-settings-btn primary" onclick="resetStorySettings()">
                        ↺ RESTAURAR PADRÃO
                    </button>
                    <button class="story-settings-btn" onclick="renderAldeiaScreen()">
                        ← VOLTAR À ALDEIA
                    </button>
                </div>
            </div>
        </div>
    `;

    // ---- Handlers dos sliders (tempo real) ----
    const atmSlider = document.getElementById('setAtmIntensity');
    const atmVal = document.getElementById('setAtmIntensityVal');
    if (atmSlider) {
        atmSlider.addEventListener('input', function() {
            const v = parseInt(this.value);
            atmVal.textContent = v + '%';
            STORY_SETTINGS.atmosphereIntensity = v;
            applyAtmosphereIntensity(v);
            saveStorySettings();
        });
    }

    const musSlider = document.getElementById('setMusicVol');
    const musVal = document.getElementById('setMusicVolVal');
    if (musSlider) {
        musSlider.addEventListener('input', function() {
            const v = parseInt(this.value);
            musVal.textContent = v + '%';
            STORY_SETTINGS.musicVolume = v;
            applyMusicVolume(v);
            saveStorySettings();
        });
    }

    const sfxSlider = document.getElementById('setSfxVol');
    const sfxVal = document.getElementById('setSfxVolVal');
    if (sfxSlider) {
        sfxSlider.addEventListener('input', function() {
            const v = parseInt(this.value);
            sfxVal.textContent = v + '%';
            STORY_SETTINGS.sfxVolume = v;
            applySfxVolume(v);
            saveStorySettings();

            // Toca um som de teste pra feedback
            if (typeof playSfx === 'function') {
                clearTimeout(window._sfxTestTimer);
                window._sfxTestTimer = setTimeout(() => playSfx('click'), 100);
            }
        });
    }

    const autosaveToggle = document.getElementById('setAutoSave');
    if (autosaveToggle) {
        autosaveToggle.addEventListener('change', function() {
            STORY_SETTINGS.autoSaveNotify = this.checked;
            saveStorySettings();
        });
    }
}

function resetStorySettings() {
    STORY_SETTINGS = { ...STORY_DEFAULT_SETTINGS };
    saveStorySettings();
    applyStorySettings();
    renderStorySettingsScreen();
    showToast('⚙️', 'Configurações restauradas.', '⚙️');
}

// =================================================================
// 5. BOTÃO NA ALDEIA
// -----------------------------------------------------------------
// Sobrescreve renderAldeiaScreen pra adicionar o botão de config.
// =================================================================
(function addSettingsButtonToAldeia() {
    const _origRender = window.renderAldeiaScreen;
    if (typeof _origRender !== 'function') {
        console.warn('[settings] renderAldeiaScreen não encontrada.');
        return;
    }

    window.renderAldeiaScreen = function() {
        _origRender.apply(this, arguments);

        // Procura o footer da Aldeia e injeta o botão
        const footer = document.querySelector('.story-ald-footer');
        if (!footer) return;

        // Evita duplicar
        if (footer.querySelector('.story-settings-btn-ald')) return;

        const btn = document.createElement('button');
        btn.className = 'story-back-btn story-settings-btn-ald';
        btn.style.marginLeft = '10px';
        btn.innerHTML = '⚙️ CONFIGURAÇÕES';
        btn.onclick = () => {
            if (typeof renderStorySettingsScreen === 'function') {
                renderStorySettingsScreen();
            }
        };
        footer.appendChild(btn);
    };

    console.log('✅ Botão de Configurações adicionado à Aldeia.');
})();

// =================================================================
// 6. CSS
// =================================================================
(function injectSettingsCSS() {
    if (document.getElementById('storySettingsStyle')) return;
    const style = document.createElement('style');
    style.id = 'storySettingsStyle';
    style.textContent = `
        /* ---- Painel de Configurações ---- */
        .story-settings-panel {
            max-width: 640px;
            margin: 0 auto 30px;
            display: flex;
            flex-direction: column;
            gap: 18px;
        }

        .story-settings-section {
            background:
                linear-gradient(180deg, rgba(201, 162, 39, 0.04), transparent 40%),
                linear-gradient(180deg, rgba(42, 31, 16, 0.9), rgba(26, 18, 8, 0.9));
            border: 2px solid #3d2d18;
            border-radius: 8px;
            padding: 18px 20px;
        }

        .story-settings-section-title {
            font-family: 'Cinzel', serif;
            color: #e8b923;
            font-size: 0.85rem;
            letter-spacing: 2px;
            margin-bottom: 14px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(201, 162, 39, 0.2);
            text-transform: uppercase;
        }

        .story-settings-row {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 12px;
            flex-wrap: wrap;
        }

        .story-settings-row:last-child { margin-bottom: 0; }

        .story-settings-label {
            font-family: 'EB Garamond', serif;
            color: #d9c89a;
            font-size: 1rem;
            min-width: 130px;
            flex-shrink: 0;
        }

        .story-settings-slider-wrap {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 200px;
        }

        .story-settings-slider {
            flex: 1;
            -webkit-appearance: none;
            height: 8px;
            background: #1a1208;
            border-radius: 4px;
            outline: none;
            border: 1px solid #6a5024;
            cursor: pointer;
        }

        .story-settings-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle at 30% 30%, #e8b923, #8a7018);
            border: 2px solid #1a1208;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 8px rgba(232, 185, 35, 0.5);
        }

        .story-settings-slider::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: radial-gradient(circle at 30% 30%, #e8b923, #8a7018);
            border: 2px solid #1a1208;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 8px rgba(232, 185, 35, 0.5);
        }

        .story-settings-value {
            font-family: 'Cinzel', serif;
            color: #e8b923;
            font-weight: 700;
            font-size: 0.95rem;
            min-width: 55px;
            text-align: right;
            letter-spacing: 1px;
        }

        .story-settings-hint {
            font-family: 'EB Garamond', serif;
            color: #8a7a52;
            font-size: 0.85rem;
            font-style: italic;
            line-height: 1.4;
            padding: 8px 12px;
            background: rgba(10, 6, 2, 0.4);
            border-left: 3px solid #6a5024;
            border-radius: 4px;
            margin-top: 4px;
        }

        /* ---- Toggle ---- */
        .story-settings-toggle {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 26px;
            cursor: pointer;
        }

        .story-settings-toggle input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .story-settings-toggle-slider {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: #3a2a18;
            border: 1px solid #6a5024;
            border-radius: 34px;
            transition: 0.3s;
        }

        .story-settings-toggle-slider:before {
            content: "";
            position: absolute;
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background: radial-gradient(circle at 30% 30%, #d9c89a, #8a7a52);
            border-radius: 50%;
            transition: 0.3s;
        }

        .story-settings-toggle input:checked + .story-settings-toggle-slider {
            background: #3a5a2c;
            border-color: #6ba35c;
        }

        .story-settings-toggle input:checked + .story-settings-toggle-slider:before {
            transform: translateX(24px);
            background: radial-gradient(circle at 30% 30%, #c8e0a8, #4a7040);
        }

        /* ---- Botões ---- */
        .story-settings-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 20px;
        }

        .story-settings-btn {
            padding: 12px 24px;
            background: linear-gradient(135deg, #3d2d18, #2a1f10);
            color: #c8b787;
            border: 2px solid #6a5024;
            border-radius: 4px;
            cursor: pointer;
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 0.9rem;
            letter-spacing: 1.5px;
            transition: all 0.2s;
        }

        .story-settings-btn:hover {
            background: linear-gradient(135deg, #5a4220, #3d2d18);
            color: #e8dcc4;
            border-color: #c9a227;
        }

        .story-settings-btn.primary {
            background:
                linear-gradient(180deg, rgba(232, 185, 35, 0.2), transparent 45%),
                linear-gradient(135deg, #8a6a2e, #4a3418);
            color: #fff5dc;
            border-color: #e8b923;
        }

        /* ---- Auto-save indicator ---- */
        .story-save-indicator {
            position: fixed;
            bottom: 24px;
            right: 24px;
            padding: 10px 18px;
            background:
                linear-gradient(180deg, rgba(107, 163, 92, 0.25), transparent 60%),
                linear-gradient(135deg, #2a4520, #1a2f14);
            color: #e0f0d0;
            border: 2px solid #6ba35c;
            border-radius: 24px;
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 0.85rem;
            letter-spacing: 1.5px;
            box-shadow:
                0 4px 15px rgba(0, 0, 0, 0.6),
                0 0 20px rgba(107, 163, 92, 0.3);
            z-index: 9500;
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.3s, transform 0.3s;
            pointer-events: none;
        }

        .story-save-indicator.show {
            opacity: 1;
            transform: translateY(0);
        }

        @media (max-width: 600px) {
            .story-settings-row {
                flex-direction: column;
                align-items: flex-start;
            }
            .story-settings-label {
                min-width: 0;
            }
            .story-settings-slider-wrap {
                width: 100%;
            }
            .story-save-indicator {
                bottom: 12px;
                right: 12px;
                padding: 8px 14px;
                font-size: 0.75rem;
            }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS das Configurações injetado.');
})();

// =================================================================
// 7. INICIALIZAÇÃO
// =================================================================
loadStorySettings();
applyStorySettings();

console.log('✅ BLOCO CORRETIVO 7 (V9.1 — Configurações) carregado.');
// =================================================================
// historia.js — BLOCO 8 (V9.1 — Dificuldade Progressiva)
// -----------------------------------------------------------------
// Cole NO FINAL de historia.js, depois do Bloco 7.
//
// Contém:
//   1. Definição dos modos de dificuldade
//   2. Desbloqueio progressivo (Normal → Difícil → Pesadelo)
//   3. Aplicação dos multiplicadores em batalha
//   4. Recompensas escaladas
//   5. Seletor de dificuldade na tela de fases
//   6. Selo de dificuldade nas fases concluídas
// =================================================================

// =================================================================
// 1. DEFINIÇÃO DAS DIFICULDADES
// =================================================================
const STORY_DIFFICULTIES = {
    'normal': {
        id: 'normal',
        nome: 'Normal',
        desc: 'A jornada original.',
        icon: '⚔️',
        hpMult: 1.0,
        atkMult: 1.0,
        rewardMult: 1.0,
        starsBonus: 0,
        color: '#c9a227',
        unlockedBy: null,
    },
    'dificil': {
        id: 'dificil',
        nome: 'Difícil',
        desc: 'Inimigos mais resistentes.',
        icon: '🔥',
        hpMult: 1.5,
        atkMult: 1.3,
        rewardMult: 1.5,
        starsBonus: 1,
        color: '#e67e22',
        unlockedBy: 'zerar',  // requer ter zerado o jogo no modo anterior
    },
    'pesadelo': {
        id: 'pesadelo',
        nome: 'Pesadelo',
        desc: 'O abismo em sua forma mais pura.',
        icon: '💀',
        hpMult: 2.2,
        atkMult: 1.6,
        rewardMult: 2.5,
        starsBonus: 2,
        color: '#a83232',
        unlockedBy: 'dificil',  // requer ter zerado no Difícil
    },
};

// Dificuldade atual (carregada do save)
let storyCurrentDifficulty = 'normal';

// =================================================================
// 2. CARREGAR / SALVAR DIFICULDADE NO SAVE
// =================================================================
(function initDifficultyFromSave() {
    if (!STORY_PROGRESS) return;
    if (!STORY_PROGRESS.difficulty) {
        STORY_PROGRESS.difficulty = 'normal';
    }
    if (!STORY_PROGRESS.difficultyProgress) {
        // Estrutura: { normal: { completed: [], stars: {} }, dificil: {...}, pesadelo: {...} }
        STORY_PROGRESS.difficultyProgress = {
            normal: { completed: [], stars: {} },
            dificil: { completed: [], stars: {} },
            pesadelo: { completed: [], stars: {} },
        };
    }
    if (!STORY_PROGRESS.clearedDifficulties) {
        // Lista de dificuldades já zeradas
        STORY_PROGRESS.clearedDifficulties = [];
    }

    storyCurrentDifficulty = STORY_PROGRESS.difficulty || 'normal';
    console.log('[dificuldade] Carregada:', storyCurrentDifficulty);
})();

function saveDifficultyToProgress() {
    if (!STORY_PROGRESS) return;
    STORY_PROGRESS.difficulty = storyCurrentDifficulty;
    saveStoryProgress();
}

// =================================================================
// 3. VERIFICAR SE UMA DIFICULDADE ESTÁ DESBLOQUEADA
// =================================================================
function isDifficultyUnlocked(diffId) {
    if (diffId === 'normal') return true;

    const diff = STORY_DIFFICULTIES[diffId];
    if (!diff) return false;

    const required = diff.unlockedBy;
    if (!required) return true;

    // 'zerar' → requer ter completado o Ato 13 em QUALQUER dificuldade
    if (required === 'zerar') {
        return (STORY_PROGRESS.clearedDifficulties || []).length > 0;
    }

    // 'dificil' → requer ter zerado no Difícil
    if (required === 'dificil') {
        return (STORY_PROGRESS.clearedDifficulties || []).includes('dificil');
    }

    return false;
}

// =================================================================
// 4. APLICAR MULTIPLICADORES EM BATALHA
// -----------------------------------------------------------------
// Hook no initStoryBattle pra escalar HP/ATK do inimigo atual.
// =================================================================
(function hookDifficultyInBattle() {
    const _origInit = window.initStoryBattle;
    if (typeof _origInit !== 'function') {
        console.warn('[dificuldade] initStoryBattle não encontrada.');
        return;
    }

    window.initStoryBattle = async function() {
        await _origInit.apply(this, arguments);

        // Aplica multiplicadores no inimigo atual
        applyDifficultyToCurrentEnemy();

        // Aplica no header/boss card
        if (typeof updateBossCard === 'function') updateBossCard();
        if (typeof updateHeaderBossName === 'function') updateHeaderBossName();

        // Log de aviso
        const diff = STORY_DIFFICULTIES[storyCurrentDifficulty];
        if (diff && storyCurrentDifficulty !== 'normal') {
            addLog(`${diff.icon} DIFICULDADE: ${diff.nome.toUpperCase()}`);
            addLog(`HP do inimigo ×${diff.hpMult} · ATK ×${diff.atkMult}`);
        }
    };

    console.log('✅ Hook de dificuldade em batalha instalado.');
})();

function applyDifficultyToCurrentEnemy() {
    if (!window._storyMode) return;
    if (!storyEnemiesRemaining || storyEnemiesRemaining.length === 0) return;

    const diff = STORY_DIFFICULTIES[storyCurrentDifficulty];
    if (!diff || storyCurrentDifficulty === 'normal') return;

    // Multiplica o HP atual (que foi setado pelo initStoryBattle)
    if (boss && boss.maxHp) {
        const origMaxHp = boss.maxHp;
        const newMaxHp = Math.ceil(origMaxHp * diff.hpMult);
        boss.maxHp = newMaxHp;
        boss.hp = newMaxHp;
    }

    // Multiplica o ATK (aplicado quando o inimigo atacar)
    // O ATK vem do input atk_BOSS_cfg, multiplicado pelo diff
    const atkInput = document.getElementById('atk_BOSS_cfg');
    if (atkInput) {
        const origAtk = parseInt(atkInput.value) || 4;
        // Guarda o original pra não multiplicar de novo
        if (!atkInput.dataset.originalAtk) {
            atkInput.dataset.originalAtk = origAtk;
        }
        const baseAtk = parseInt(atkInput.dataset.originalAtk);
        atkInput.value = Math.ceil(baseAtk * diff.atkMult);
    }
}

// Quando avança pro próximo inimigo, reaplica
(function hookAdvanceForDifficulty() {
    const _origAdvance = window.advanceStoryEnemy;
    if (typeof _origAdvance !== 'function') return;

    window.advanceStoryEnemy = async function() {
        const result = await _origAdvance.apply(this, arguments);

        // Reaplica multiplicadores no novo inimigo
        if (window._storyMode && storyEnemiesRemaining.length > 0) {
            applyDifficultyToCurrentEnemy();
            if (typeof updateBossCard === 'function') updateBossCard();
        }

        return result;
    };

    console.log('✅ Hook de avanço de inimigo com dificuldade instalado.');
})();

// =================================================================
// 5. RECOMPENSAS ESCALADAS POR DIFICULDADE
// =================================================================
(function hookRewardsForDifficulty() {
    const _origVictory = window.handleStoryPhaseVictory;
    if (typeof _origVictory !== 'function') {
        console.warn('[dificuldade] handleStoryPhaseVictory não encontrada.');
        return;
    }

    window.handleStoryPhaseVictory = function(phase, drops, finalScore, rankSnapshot) {
        // Multiplica XP e ouro da fase pela dificuldade
        const diff = STORY_DIFFICULTIES[storyCurrentDifficulty];
        if (diff && storyCurrentDifficulty !== 'normal' && phase && phase.reward) {
            phase.reward.xp = Math.ceil(phase.reward.xp * diff.rewardMult);
            phase.reward.gold = Math.ceil(phase.reward.gold * diff.rewardMult);
        }

        // Guarda dificuldade no rankSnapshot
        if (rankSnapshot) {
            rankSnapshot.difficulty = storyCurrentDifficulty;
        }

        return _origVictory.apply(this, arguments);
    };

    console.log('✅ Hook de recompensas por dificuldade instalado.');
})();

// =================================================================
// 6. REGISTRAR ZERAR DO JOGO
// -----------------------------------------------------------------
// Hook no showStoryVictoryScreen pra detectar quando o Ato 13 termina.
// =================================================================
(function hookVictoryForClear() {
    const _origShowVictory = window.showStoryVictoryScreen;
    if (typeof _origShowVictory !== 'function') return;

    window.showStoryVictoryScreen = function(phase, drops, rewards, meta) {
        // Detecta final boss
        if (phase && phase.isFinalBoss) {
            // Marca a dificuldade como zerada
            if (!Array.isArray(STORY_PROGRESS.clearedDifficulties)) {
                STORY_PROGRESS.clearedDifficulties = [];
            }
            if (!STORY_PROGRESS.clearedDifficulties.includes(storyCurrentDifficulty)) {
                STORY_PROGRESS.clearedDifficulties.push(storyCurrentDifficulty);

                // Toast de novo desbloqueio
                const nextDiff = getNextDifficultyAfter(storyCurrentDifficulty);
                if (nextDiff) {
                    setTimeout(() => {
                        showToast(
                            `${nextDiff.icon} NOVA DIFICULDADE!`,
                            `${nextDiff.nome} desbloqueada!`,
                            nextDiff.icon
                        );
                    }, 2000);
                }

                saveStoryProgress();
            }
        }

        return _origShowVictory.apply(this, arguments);
    };

    console.log('✅ Hook de vitória final instalado.');
})();

function getNextDifficultyAfter(current) {
    const order = ['normal', 'dificil', 'pesadelo'];
    const idx = order.indexOf(current);
    if (idx === -1 || idx >= order.length - 1) return null;

    const nextId = order[idx + 1];
    const next = STORY_DIFFICULTIES[nextId];
    if (next && isDifficultyUnlocked(nextId)) return next;
    return null;
}

// =================================================================
// 7. SALVAR ESTRELAS POR DIFICULDADE
// -----------------------------------------------------------------
// Sobrescreve saveStarsForPhase pra guardar separadamente por dificuldade.
// =================================================================
(function hookStarsForDifficulty() {
    const _origSaveStars = window.saveStarsForPhase;
    if (typeof _origSaveStars !== 'function') return;

    window.saveStarsForPhase = function(phaseId, stars) {
        const diff = STORY_DIFFICULTIES[storyCurrentDifficulty];

        // Aplica bônus de estrelas por dificuldade
        let effectiveStars = stars;
        if (diff && diff.starsBonus > 0) {
            effectiveStars = Math.min(3, stars + diff.starsBonus);
        }

        // Salva no progresso geral (comportamento original)
        const result = _origSaveStars.apply(this, arguments);

        // Salva também na estrutura por dificuldade
        if (!STORY_PROGRESS.difficultyProgress) {
            STORY_PROGRESS.difficultyProgress = {};
        }
        if (!STORY_PROGRESS.difficultyProgress[storyCurrentDifficulty]) {
            STORY_PROGRESS.difficultyProgress[storyCurrentDifficulty] = {
                completed: [],
                stars: {},
            };
        }

        const diffProg = STORY_PROGRESS.difficultyProgress[storyCurrentDifficulty];
        const current = diffProg.stars[phaseId] || 0;
        diffProg.stars[phaseId] = Math.max(current, effectiveStars);
        saveStoryProgress();

        return result;
    };

    console.log('✅ Hook de estrelas por dificuldade instalado.');
})();

// =================================================================
// 8. UI — SELETOR DE DIFICULDADE NA TELA DE FASES
// -----------------------------------------------------------------
// Sobrescreve renderChapterPhases pra adicionar o seletor no topo.
// =================================================================
(function addDifficultySelectorToChapter() {
    const _origRender = window.renderChapterPhases;
    if (typeof _origRender !== 'function') {
        console.warn('[dificuldade] renderChapterPhases não encontrada.');
        return;
    }

    window.renderChapterPhases = function(ch) {
        _origRender.apply(this, arguments);

        // Procura o header da tela
        const header = document.querySelector('.story-header');
        if (!header) return;

        // Evita duplicar
        if (header.querySelector('.story-difficulty-selector')) return;

        // Monta o seletor
        const selector = document.createElement('div');
        selector.className = 'story-difficulty-selector';

        const diffs = Object.values(STORY_DIFFICULTIES);
        const buttonsHTML = diffs.map(d => {
            const unlocked = isDifficultyUnlocked(d.id);
            const active = d.id === storyCurrentDifficulty;
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

        selector.innerHTML = `
            <div class="story-difficulty-label">DIFICULDADE</div>
            <div class="story-difficulty-buttons">${buttonsHTML}</div>
        `;

        // Insere depois do subtitle
        header.appendChild(selector);

        // Handler dos botões
        selector.querySelectorAll('.story-difficulty-btn:not(.locked)').forEach(btn => {
            btn.addEventListener('click', function() {
                const diffId = this.dataset.diff;
                if (diffId === storyCurrentDifficulty) return;

                storyCurrentDifficulty = diffId;
                saveDifficultyToProgress();

                // Re-renderiza
                renderChapterPhases(ch);

                const d = STORY_DIFFICULTIES[diffId];
                showToast(`${d.icon}`, `Dificuldade: ${d.nome}`, d.icon);
            });
        });
    };

    console.log('✅ Seletor de dificuldade adicionado à tela de fases.');
})();

// =================================================================
// 9. UI — BADGE DE DIFICULDADE NAS FASES
// -----------------------------------------------------------------
// Sobrescreve renderChapterPhases pra adicionar badges nas fases.
// Como o item 8 já sobrescreveu, fazemos um segundo patch em cima.
// =================================================================
(function addDifficultyBadgesToPhases() {
    const _origRender = window.renderChapterPhases;
    if (typeof _origRender !== 'function') return;

    window.renderChapterPhases = function(ch) {
        _origRender.apply(this, arguments);

        // Se estamos no modo Normal, não mostra badges
        if (storyCurrentDifficulty === 'normal') return;

        const diff = STORY_DIFFICULTIES[storyCurrentDifficulty];
        if (!diff) return;

        // Adiciona um badge global indicando a dificuldade ativa
        const header = document.querySelector('.story-header');
        if (header && !header.querySelector('.story-difficulty-active-badge')) {
            const badge = document.createElement('div');
            badge.className = 'story-difficulty-active-badge';
            badge.style.setProperty('--diff-color', diff.color);
            badge.innerHTML = `
                ${diff.icon} JOGANDO EM ${diff.nome.toUpperCase()}
                <span class="story-difficulty-active-hint">
                    (HP ×${diff.hpMult} · ATK ×${diff.atkMult} · Recompensa ×${diff.rewardMult})
                </span>
            `;
            // Insere antes do seletor
            const selector = header.querySelector('.story-difficulty-selector');
            if (selector) {
                selector.parentNode.insertBefore(badge, selector);
            } else {
                header.appendChild(badge);
            }
        }
    };
})();

// =================================================================
// 10. PATCH EM startStoryPhase — usa a dificuldade atual
// =================================================================
(function hookStartPhaseForDifficulty() {
    const _origStart = window.startStoryPhase;
    if (typeof _origStart !== 'function') return;

    window.startStoryPhase = function(cid, pid) {
        // Garante que a dificuldade está salva
        saveDifficultyToProgress();

        return _origStart.apply(this, arguments);
    };

    console.log('✅ startStoryPhase agora respeita a dificuldade.');
})();

// =================================================================
// 11. UI — MOSTRAR DIFICULDADE NA ALDEIA
// -----------------------------------------------------------------
// Pequeno badge na Aldeia mostrando a dificuldade atual.
// =================================================================
(function showDifficultyInAldeia() {
    const _origRender = window.renderAldeiaScreen;
    if (typeof _origRender !== 'function') return;

    window.renderAldeiaScreen = function() {
        _origRender.apply(this, arguments);

        const saveInfo = document.querySelector('.story-ald-save-info');
        if (!saveInfo) return;
        if (saveInfo.querySelector('.story-ald-difficulty-badge')) return;

        const diff = STORY_DIFFICULTIES[storyCurrentDifficulty];
        if (!diff) return;

        // Só mostra se for diferente de Normal
        if (storyCurrentDifficulty === 'normal') return;

        const badge = document.createElement('div');
        badge.className = 'story-ald-difficulty-badge';
        badge.style.setProperty('--diff-color', diff.color);
        badge.innerHTML = `${diff.icon} ${diff.nome.toUpperCase()}`;
        saveInfo.appendChild(badge);
    };
})();

// =================================================================
// 12. CSS
// =================================================================
(function injectDifficultyCSS() {
    if (document.getElementById('storyDifficultyStyle')) return;
    const style = document.createElement('style');
    style.id = 'storyDifficultyStyle';
    style.textContent = `
        /* ---- Seletor de dificuldade ---- */
        .story-difficulty-selector {
            margin-top: 18px;
            padding: 12px 16px;
            background: rgba(10, 6, 2, 0.5);
            border: 1px solid rgba(201, 162, 39, 0.25);
            border-radius: 6px;
        }

        .story-difficulty-label {
            font-family: 'Cinzel', serif;
            font-size: 0.75rem;
            color: #8a7a52;
            letter-spacing: 2px;
            text-align: center;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        .story-difficulty-buttons {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
        }

        .story-difficulty-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 18px;
            background: linear-gradient(135deg, #2a1f10, #1a1208);
            color: #c8b787;
            border: 2px solid rgba(201, 162, 39, 0.3);
            border-radius: 6px;
            cursor: pointer;
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 0.85rem;
            letter-spacing: 1px;
            transition: all 0.2s;
            position: relative;
        }

        .story-difficulty-btn:hover:not(.locked) {
            border-color: var(--diff-color, #c9a227);
            color: #e8dcc4;
            transform: translateY(-2px);
        }

        .story-difficulty-btn.active {
            background:
                linear-gradient(180deg, rgba(232, 185, 35, 0.15), transparent 50%),
                linear-gradient(135deg, #3d2d18, #2a1f10);
            border-color: var(--diff-color, #c9a227);
            border-width: 3px;
            color: #fff5dc;
            box-shadow: 0 0 18px color-mix(in srgb, var(--diff-color, #c9a227) 50%, transparent);
        }

        .story-difficulty-btn.locked {
            opacity: 0.45;
            cursor: not-allowed;
            filter: grayscale(0.7);
        }

        .story-difficulty-icon {
            font-size: 1.2rem;
            line-height: 1;
        }

        .story-difficulty-lock {
            font-size: 0.9rem;
            opacity: 0.7;
            margin-left: 4px;
        }

        /* ---- Badge ativo ---- */
        .story-difficulty-active-badge {
            margin-top: 14px;
            padding: 10px 16px;
            background:
                linear-gradient(180deg, color-mix(in srgb, var(--diff-color, #c9a227) 15%, transparent), transparent 60%),
                rgba(10, 6, 2, 0.6);
            border: 2px solid var(--diff-color, #c9a227);
            border-radius: 6px;
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 0.85rem;
            color: var(--diff-color, #c9a227);
            text-align: center;
            letter-spacing: 1.5px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            align-items: center;
        }

        .story-difficulty-active-hint {
            font-family: 'EB Garamond', serif;
            font-size: 0.75rem;
            font-weight: 400;
            color: #b8a577;
            font-style: italic;
            letter-spacing: 0.5px;
        }

        /* ---- Badge na Aldeia ---- */
        .story-ald-difficulty-badge {
            padding: 6px 14px;
            background:
                linear-gradient(180deg, color-mix(in srgb, var(--diff-color, #c9a227) 20%, transparent), transparent 60%),
                rgba(10, 6, 2, 0.6);
            border: 2px solid var(--diff-color, #c9a227);
            border-radius: 20px;
            font-family: 'Cinzel', serif;
            font-weight: 700;
            font-size: 0.8rem;
            color: var(--diff-color, #c9a227);
            letter-spacing: 1.5px;
            white-space: nowrap;
        }

        @media (max-width: 600px) {
            .story-difficulty-btn {
                padding: 8px 12px;
                font-size: 0.75rem;
            }
            .story-difficulty-icon {
                font-size: 1rem;
            }
            .story-difficulty-active-badge {
                font-size: 0.75rem;
            }
        }
    `;
    document.head.appendChild(style);
    console.log('✅ CSS de dificuldade injetado.');
})();

// =================================================================
// 13. EXPOR NO WINDOW
// =================================================================
window.STORY_DIFFICULTIES = STORY_DIFFICULTIES;
window.isDifficultyUnlocked = isDifficultyUnlocked;
window.getCurrentStoryDifficulty = () => storyCurrentDifficulty;
window.setStoryDifficulty = (id) => {
    if (STORY_DIFFICULTIES[id] && isDifficultyUnlocked(id)) {
        storyCurrentDifficulty = id;
        saveDifficultyToProgress();
        return true;
    }
    return false;
};

console.log('✅ BLOCO CORRETIVO 8 (V9.1 — Dificuldade Progressiva) carregado.');
console.log('💡 Dificuldades:', Object.keys(STORY_DIFFICULTIES).join(', '));
console.log('💡 Atual:', storyCurrentDifficulty);
console.log('💡 Zeradas:', STORY_PROGRESS.clearedDifficulties || []);