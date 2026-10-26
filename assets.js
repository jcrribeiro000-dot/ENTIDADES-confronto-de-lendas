// =================================================================
// assets.js — Catálogo central de Sprites e Sons (V2)
// -----------------------------------------------------------------
// Carregar no FINAL do index.html (último <script>).
//
// REGRAS:
//   ✓  = URL presente (edite para trocar)
//   ⬜  = vazio (usa emoji / fallback do código)
//
// Este arquivo NUNCA redeclara const. Só muta propriedades.
// =================================================================


// ================================================================
// 🦸 A_SPRITES — Base (entidades.js)
// ================================================================
const A_SPRITES = {
    Tupa:    'https://i.imgur.com/R2WKPky.gif',   // ✓
    Sume:    'https://i.imgur.com/xXwuVKW.gif',   // ✓
    Caipora: 'https://i.imgur.com/3bayQJu.gif',   // ✓

    BOITATA:     'https://i.imgur.com/4PEG3BL.gif',   // ✓
    MAPINGUARI:  'https://i.imgur.com/oIhDjT8.gif',   // ✓
    SACI:        'https://i.imgur.com/NTcI6G2.gif',   // ✓
    IARA:        'https://i.imgur.com/NxMl4Cj.gif',   // ✓
    MULA:        'https://i.imgur.com/SpEsN9P.gif',   // ✓
    CORPOSECO:   'https://i.imgur.com/5Tkoqxg.gif',   // ✓
    LOBISOMEM:   'https://i.imgur.com/EL12OX1.gif',   // ✓
    CUCA:        'https://i.imgur.com/ubm1PCp.gif',   // ✓
    BOTO:        'https://i.imgur.com/Soc8uvn.gif',   // ✓
    BOI:         'https://i.imgur.com/EOLfnHU.gif',   // ✓
    JACI:        'https://i.imgur.com/h1BTjLU.gif',   // ✓
    GUARACI:     'https://i.imgur.com/ViX8EKj.gif',   // ✓
    ANHANGA:     'https://i.imgur.com/q43m2km.gif',   // ✓

    // ---- FX de combate ----
    SwordFX:       'https://i.imgur.com/pHVNBWZ.png',  // ✓
    ArrowFX:       'https://i.imgur.com/3Vxt7Ri.png',  // ✓
    MagicFX:       'https://i.imgur.com/XKRYqtf.png',  // ✓
    BiteFX:        'https://i.imgur.com/NzruuNb.png',  // ✓
    RockFX:        'https://cdn-icons-png.flaticon.com/128/12912/12912366.png', // ✓
    FireballFX:    'https://cdn-icons-png.flaticon.com/512/1163/1163657.png',   // ✓
    ClawFX:        'https://i.imgur.com/g49gBYb.png',  // ✓
    PotionFX:      'https://i.imgur.com/1ngilGX.png',  // ✓
    PoisonFX:      'https://i.imgur.com/1ngilGX.png',  // ✓
    BrokenHeartFX: 'https://i.imgur.com/gFlYuI5.png',  // ✓
    ScaryFaceFX:   'https://i.imgur.com/ao8mHA6.png',  // ✓
    MoonFX:        'https://i.imgur.com/fFNsTAu.png',  // ✓
    SunFX:         'https://i.imgur.com/CKWHQa3.png',  // ✓
    VortexFX:      'https://i.imgur.com/XHq6PVm.png',  // ✓
    Muiraquita:    'https://i.imgur.com/WAWqKeB.png',  // ✓

    // ---- Bravely (base) ----
    BRAVELY_TUPA:    'https://i.imgur.com/pCrboAh.gif',  // ✓
    BRAVELY_SUME:    'https://i.imgur.com/jDxEk8j.gif',  // ✓
    BRAVELY_CAIPORA: 'https://i.imgur.com/xPUhbKG.gif',  // ✓
};


// ================================================================
// 🐾 A_ANIMAIS — Animais dos Atos 1-12 (SPRITES_STORY)
// ================================================================
const A_ANIMAIS = {
    // Ato 1
    porco_espinho: 'https://i.imgur.com/vO5J9ft.gif',  // ✓
    jacare:        'https://i.imgur.com/oTZzXX2.gif',  // ✓
    cervo:         'https://i.imgur.com/iH2bRRx.gif',  // ✓
    onca_parda:    'https://i.imgur.com/jN7AuyW.gif',  // ✓

    // Ato 2
    tamandua: 'https://i.imgur.com/8Breoi9.gif',  // ✓
    anta:     'https://i.imgur.com/0avAEnD.gif',  // ✓
    queixada: 'https://i.imgur.com/0fsGkKs.gif',  // ✓
    sucuri:   'https://i.imgur.com/0dt6Jk2.gif',  // ✓

    // Ato 3
    piranha:  'https://i.imgur.com/KKOPhc5.gif',  // ✓
    lontra:   'https://i.imgur.com/wOHYX2a.gif',  // ✓
    ariranha: 'https://i.imgur.com/7obkFIq.gif',  // ✓
    pirarucu: 'https://i.imgur.com/4dHWgkT.gif',  // ✓

    // Ato 4
    cascavel: 'https://i.imgur.com/4QjmPV2.gif',  // ✓
    coral:    'https://i.imgur.com/8kstFde.gif',  // ✓
    jararaca: 'https://i.imgur.com/5Ll9B9h.gif',  // ✓
    tartaruga:'https://i.imgur.com/wr0u1rt.gif',  // ✓

    // Ato 5
    bode:           'https://i.imgur.com/vknDxdA.gif',  // ✓
    carneiro:       'https://i.imgur.com/UlmnSrt.gif',  // ✓
    cavalo_selvagem:'https://i.imgur.com/Y8LuBY1.gif',  // ✓
    touro_bravo:    'https://i.imgur.com/YAGfZmd.gif',  // ✓

    // Ato 6
    urubu:      'https://i.imgur.com/h4N8ZzS.gif',  // ✓
    carcaara:   'https://i.imgur.com/1A2lqg8.gif',  // ✓
    tatu:       'https://i.imgur.com/5unG9x9.gif',  // ✓
    lobo_guara: 'https://i.imgur.com/f7KgIRB.gif',  // ✓

    // Ato 7
    cachorro_mato: 'https://i.imgur.com/easvBrN.gif',  // ✓
    raposa:        'https://i.imgur.com/rwNleG8.gif',  // ✓
    guaxinim:      'https://i.imgur.com/pFcDvhd.gif',  // ✓
    jaguatirica:   'https://i.imgur.com/vNt4HlF.gif',  // ✓

    // Ato 8
    morcego:      'https://i.imgur.com/rC8e5DI.gif',  // ✓
    coruja:       'https://i.imgur.com/QQoBAVC.gif',  // ✓
    sapo_cururu:  'https://i.imgur.com/LyWtqKO.gif',  // ✓
    seriema:      'https://i.imgur.com/99uSnNa.gif',  // ✓

    // Ato 9
    tucunare: 'https://i.imgur.com/aczVyaZ.gif',  // ✓
    piraiba:  'https://i.imgur.com/muGrFBa.gif',  // ✓
    dourada:  'https://i.imgur.com/4CNoskE.gif',  // ✓
    peixe_boi:'https://i.imgur.com/7VtvsnP.gif',  // ✓

    // Ato 10
    bufalo:      'https://i.imgur.com/TX4UTzH.gif',  // ✓
    vaca_louca:  'https://i.imgur.com/ln3g7es.gif',  // ✓
    cabra_preta: 'https://i.imgur.com/hEu2mzb.gif',  // ✓
    zebu:        'https://i.imgur.com/WNzUfc0.gif',  // ✓

    // Ato 11
    gato_mato:        'https://i.imgur.com/adS0y5o.gif',  // ✓
    mariposa_gigante: 'https://i.imgur.com/WR5SQ3Z.gif',  // ✓
    quati:            'https://i.imgur.com/ZoRG8Ng.gif',  // ✓
    sucuarana:        'https://i.imgur.com/8ym13mq.gif',  // ✓

    // Ato 12
    gaviao:        'https://i.imgur.com/rVfBySE.gif',  // ✓
    falcao:        'https://i.imgur.com/9A1dPFJ.gif',  // ✓
    urutau:        'https://i.imgur.com/M1uYuKk.gif',  // ✓
    aguia_cinzenta:'https://i.imgur.com/0KCW5k4.gif',  // ✓

    // Ato 13 — Espectros (vazios → usam boss base + spectral-boss)
    espectro_saci:        '',  // ⬜
    espectro_mapinguari:  '',  // ⬜
    espectro_iara:        '',  // ⬜
    espectro_boitata:     '',  // ⬜
    espectro_mula:        '',  // ⬜
    espectro_corposeco:   '',  // ⬜
    espectro_lobisomem:   '',  // ⬜
    espectro_cuca:        '',  // ⬜
    espectro_boto:        '',  // ⬜
    espectro_boi:         '',  // ⬜
    espectro_jaci:        '',  // ⬜
    espectro_guaraci:     '',  // ⬜
};


// ================================================================
// 🦸 A_HEROIS — Heróis da História (SPRITES_STORY)
// ================================================================
const A_HEROIS = {
    heroi_Kanarott:        'https://i.imgur.com/6Y2qBQh.gif',  // ✓
    heroi_Jurua:           'https://i.imgur.com/R8Tf3nI.gif',  // ✓
    heroi_BichoFolharal:   'https://i.imgur.com/NCbRRFK.gif',  // ✓
    heroi_Eru:             'https://i.imgur.com/WJZUsKI.gif',  // ✓
    heroi_Teperesik:       'https://i.imgur.com/SzgasL5.gif',  // ✓
    heroi_Andure:          'https://i.imgur.com/XKsY67z.gif',  // ✓
    heroi_PajeAnhanguera:  'https://i.imgur.com/gpb5vvQ.gif',  // ✓
    heroi_MaeDaMata:       'https://i.imgur.com/MjcLAzy.gif',  // ✓
    heroi_Araci:           'https://i.imgur.com/x8gAPJH.gif',  // ✓
    heroi_Tapyrayawara:    'https://i.imgur.com/m0tdSWA.gif',  // ✓
    heroi_Curupira:        'https://i.imgur.com/x47LlSn.gif',  // ✓
    heroi_Kianumanka:      'https://i.imgur.com/khzS8ap.gif',  // ✓
    heroi_AnhangaMirim:    'https://i.imgur.com/2IvBU2b.gif',  // ✓
    heroi_Matinta:         'https://i.imgur.com/1czUJ9V.gif',  // ✓
    heroi_Naia:            'https://i.imgur.com/pOWy6qU.gif',  // ✓
    heroi_Kuati:           'https://i.imgur.com/LrS3Pl8.gif',  // ✓
    heroi_CabocloAgua:     'https://i.imgur.com/e8HyuJQ.gif',  // ✓
    heroi_Tupinamba:       'https://i.imgur.com/wunRaOG.gif',  // ✓
    heroi_Mbaraka:         'https://i.imgur.com/XbG8CIV.gif',  // ✓
    heroi_MaeDoOuro:       'https://i.imgur.com/2W8jVZS.gif',  // ✓
    heroi_PajeAcu:         'https://i.imgur.com/bpt2idM.gif',  // ✓
    heroi_Negrinho:        'https://i.imgur.com/TD6Wz71.gif',  // ✓
    heroi_Ruda:            'https://i.imgur.com/fCvtKEx.gif',  // ✓
};


// ================================================================
// 🖼️ A_CENARIOS — BGs, capas, aldeia, UI, elementos (SPRITES_STORY)
// ================================================================
const A_CENARIOS = {
    // ---- BGs (fundos das fases) ----
    bg_1_1:   'https://i.imgur.com/OWIsmOc.png',  // ✓
    bg_1_2:   'https://i.imgur.com/XBd9za6.png',  // ✓
    bg_1_3:   'https://i.imgur.com/iNDxFfh.png',  // ✓
    bg_1_4:   'https://i.imgur.com/A25ehvZ.png',  // ✓
    bg_1_boss:'https://i.imgur.com/s6xi6kN.png',  // ✓

    bg_2_1:'', bg_2_2:'', bg_2_3:'', bg_2_4:'', bg_2_boss:'', // ⬜
    bg_3_1:'', bg_3_2:'', bg_3_3:'', bg_3_4:'', bg_3_boss:'', // ⬜
    bg_4_1:'', bg_4_2:'', bg_4_3:'', bg_4_4:'', bg_4_boss:'', // ⬜
    bg_5_1:'', bg_5_2:'', bg_5_3:'', bg_5_4:'', bg_5_boss:'', // ⬜
    bg_6_1:'', bg_6_2:'', bg_6_3:'', bg_6_4:'', bg_6_boss:'', // ⬜
    bg_7_1:'', bg_7_2:'', bg_7_3:'', bg_7_4:'', bg_7_boss:'', // ⬜
    bg_8_1:'', bg_8_2:'', bg_8_3:'', bg_8_4:'', bg_8_boss:'', // ⬜
    bg_9_1:'', bg_9_2:'', bg_9_3:'', bg_9_4:'', bg_9_boss:'', // ⬜
    bg_10_1:'', bg_10_2:'', bg_10_3:'', bg_10_4:'', bg_10_boss:'', // ⬜
    bg_11_1:'', bg_11_2:'', bg_11_3:'', bg_11_4:'', bg_11_boss:'', // ⬜
    bg_12_1:'', bg_12_2:'', bg_12_3:'', bg_12_4:'', bg_12_boss:'', // ⬜
    bg_13_1:'', bg_13_2:'', bg_13_3:'', bg_13_4:'', // ⬜

    // ---- Capas (Atos) ----
    capa_ato1: 'https://i.imgur.com/pEXoYe0.jpeg',  // ✓
    capa_ato2: 'https://i.imgur.com/tkn3w1A.jpeg',  // ✓
    capa_ato3: 'https://i.imgur.com/enf4Ffa.jpeg',  // ✓
    capa_ato4: 'https://i.imgur.com/BNl5IGf.jpeg',  // ✓
    capa_ato5: 'https://i.imgur.com/TCeWp2u.jpeg',  // ✓
    capa_ato6: 'https://i.imgur.com/1hsYJGY.jpeg',  // ✓
    capa_ato7: 'https://i.imgur.com/Ajkb19b.jpeg',  // ✓
    capa_ato8: 'https://i.imgur.com/clamKCi.jpeg',  // ✓
    capa_ato9: 'https://i.imgur.com/N2a1yXT.jpeg',  // ✓
    capa_ato10:'https://i.imgur.com/13DFRys.jpeg',  // ✓
    capa_ato11:'https://i.imgur.com/wAdrEXH.jpeg',  // ✓
    capa_ato12:'https://i.imgur.com/cFTni7W.jpeg',  // ✓
    capa_ato13:'https://i.imgur.com/J3lDlLS.jpeg',  // ✓

    // ---- Aldeia ----
    aldeia_bg:         'https://i.imgur.com/ld3V2eD.png',  // ✓
    aldeia_atos:       'https://i.imgur.com/BrloIjF.png',  // ✓
    aldeia_oca:        'https://i.imgur.com/419FdCx.png',  // ✓
    aldeia_loja:       'https://i.imgur.com/dFSunKa.png',  // ✓
    aldeia_ritual:     'https://i.imgur.com/wb2Nu4l.png',  // ✓
    aldeia_bestiario:  'https://i.imgur.com/RQn91EK.png',  // ✓
    aldeia_tesouraria: 'https://i.imgur.com/vrurP0D.png',  // ✓

    // ---- Armas (ícones) ----
    arma_cajado:  'https://i.imgur.com/gPTB4uf.png',  // ✓
    arma_arco:    'https://i.imgur.com/gc0JbJn.png',  // ✓
    arma_manopla: 'https://i.imgur.com/zWnVhxt.png',  // ✓

    // ---- UI ----
    ui_gold:       'https://i.imgur.com/eot4lpq.png',  // ✓
    ui_xp:         'https://i.imgur.com/gDpWAVD.png',  // ✓
    ui_swap:       'https://i.imgur.com/12PFW5I.png',  // ✓
    ui_home:       'https://i.imgur.com/ld3V2eD.png',  // ✓
    ui_play:       'https://i.imgur.com/zX6fo9T.png',  // ✓
    ui_gift:       'https://i.imgur.com/a5t2pWl.png',  // ✓
    ui_crown:      'https://i.imgur.com/Ejd2WD1.png',  // ✓
    ui_skull:      'https://i.imgur.com/GPSPBly.png',  // ✓
    ui_lock:       'https://i.imgur.com/wGgq9l7.png',  // ✓
    ui_check:      'https://i.imgur.com/f9OAlJd.png',  // ✓
    ui_arrow:      'https://i.imgur.com/zX6fo9T.png',  // ✓
    ui_warn:       'https://i.imgur.com/p1w8rbr.png',  // ✓
    ui_medal:      'https://i.imgur.com/hjkcQaX.png',  // ✓
    ui_star:       'https://i.imgur.com/2sAWf9l.png',  // ✓
    ui_star_empty: 'https://i.imgur.com/E2pcuI7.png',  // ✓
    ui_sparkle:    '',  // ⬜

    // ---- Elementos ----
    elem_fogo:  'https://i.imgur.com/JouEZbM.png',  // ✓
    elem_agua:  'https://i.imgur.com/tMRUv48.png',  // ✓
    elem_terra: 'https://i.imgur.com/ZVPQ9iH.png',  // ✓
    elem_ar:    'https://i.imgur.com/HLqTdbd.png',  // ✓

    // ---- Ícones auxiliares ----
    icon_story:   'https://i.imgur.com/aL5KByZ.png',  // ✓
    icon_locked:  'https://i.imgur.com/wGgq9l7.png',  // ✓
    icon_unlocked:'',  // ⬜
    icon_skull:   'https://i.imgur.com/GPSPBly.png',  // ✓
    icon_drop:    'https://i.imgur.com/a5t2pWl.png',  // ✓
    icon_gold:    'https://i.imgur.com/LIfKWB8.png',  // ✓
};


// ================================================================
// 🔔 A_ICONS — Sistema ICONS do entidades.js
// ================================================================
const A_ICONS = {
    tutorial:        'https://i.imgur.com/CLLlmsL.png',  // ✓
    jogar_turno:     'https://i.imgur.com/EFtaaXG.png',  // ✓
    continuar:       'https://i.imgur.com/EFtaaXG.png',  // ✓
    fechar:          'https://i.imgur.com/dSAFF6Z.png',  // ✓
    menu:            'https://i.imgur.com/aRBr7IW.png',  // ✓
    mecanicas:       'https://i.imgur.com/YZvjiau.png',  // ✓
    modo_boss:       'https://i.imgur.com/MNJszBU.png',  // ✓
    modo_pvp:        'https://i.imgur.com/sl0XfJ0.png',  // ✓
    poder_ancestral: 'https://i.imgur.com/2IMTxPN.png',  // ✓
    elem_fogo:       'https://i.imgur.com/C83hieX.png',  // ✓
    elem_agua:       'https://i.imgur.com/HkngnNK.png',  // ✓
    elem_terra:      'https://i.imgur.com/mI0GiX5.png',  // ✓
    elem_ar:         'https://i.imgur.com/f1iVHmr.png',  // ✓
    turno:           'https://i.imgur.com/IxwGkhV.png',  // ✓
    vitoria:         'https://i.imgur.com/XiWkjxX.png',  // ✓
    derrota:         'https://i.imgur.com/gsGOKMB.png',  // ✓
};


// ================================================================
// ⚔️ A_WEAPONS — 39 armas (STORY_WEAPON_SPRITES)
// ================================================================
const A_WEAPONS = {
    // ---- Tacapes ----
    tacape_1:  'https://i.imgur.com/JeMUGif.png',  // ✓
    tacape_2:  'https://i.imgur.com/bonFE6Q.png',  // ✓
    tacape_3:  'https://i.imgur.com/CKbLG63.png',  // ✓
    tacape_4:  'https://i.imgur.com/vDTc5ET.png',  // ✓
    tacape_5:  'https://i.imgur.com/0KV05fS.png',  // ✓
    tacape_6:  'https://i.imgur.com/7FI3hyM.png',  // ✓
    tacape_7:  'https://i.imgur.com/fc432IH.png',  // ✓
    tacape_8:  'https://i.imgur.com/60239w2.png',  // ✓
    tacape_9:  'https://i.imgur.com/o0wTy1Q.png',  // ✓
    tacape_10: 'https://i.imgur.com/iMlw6g5.png',  // ✓
    tacape_11: 'https://i.imgur.com/JO3VQKP.png',  // ✓
    tacape_12: 'https://i.imgur.com/yXW92BI.png',  // ✓
    tacape_13: 'https://i.imgur.com/AFY5TpJ.png',  // ✓

    // ---- Flechas ----
    flecha_1:  'https://i.imgur.com/W1SWNIm.png',  // ✓
    flecha_2:  'https://i.imgur.com/brvmlds.png',  // ✓
    flecha_3:  'https://i.imgur.com/s6UQFIB.png',  // ✓
    flecha_4:  'https://i.imgur.com/UZogzVw.png',  // ✓
    flecha_5:  'https://i.imgur.com/9RHZmRc.png',  // ✓
    flecha_6:  'https://i.imgur.com/V32dqsu.png',  // ✓
    flecha_7:  'https://i.imgur.com/V32dqsu.png',  // ✓
    flecha_8:  'https://i.imgur.com/gB6NQb6.png',  // ✓
    flecha_9:  'https://i.imgur.com/QEKCFfr.png',  // ✓
    flecha_10: 'https://i.imgur.com/lr6637l.png',  // ✓
    flecha_11: 'https://i.imgur.com/7e4xi88.png',  // ✓
    flecha_12: 'https://i.imgur.com/TlFeeUD.png',  // ✓
    flecha_13: 'https://i.imgur.com/jIrYoSM.png',  // ✓

    // ---- Cajados ----
    cajado_1:  'https://i.imgur.com/ektoPWs.png',  // ✓
    cajado_2:  'https://i.imgur.com/ghogsnB.png',  // ✓
    cajado_3:  'https://i.imgur.com/mncGqpv.png',  // ✓
    cajado_4:  'https://i.imgur.com/e8R6ily.png',  // ✓
    cajado_5:  'https://i.imgur.com/vtgLK9Y.png',  // ✓
    cajado_6:  'https://i.imgur.com/bfRaJq1.png',  // ✓
    cajado_7:  'https://i.imgur.com/aE7lwvY.png',  // ✓
    cajado_8:  'https://i.imgur.com/aKOdqRJ.png',  // ✓
    cajado_9:  'https://i.imgur.com/IoEtQGB.png',  // ✓
    cajado_10: 'https://i.imgur.com/0uKsLbe.png',  // ✓
    cajado_11: 'https://i.imgur.com/xzLYPZQ.png',  // ✓
    cajado_12: 'https://i.imgur.com/M7tBX5E.png',  // ✓
    cajado_13: 'https://i.imgur.com/uzAOiFu.png',  // ✓
};


// ================================================================
// 🧿 A_AMULETS — 13 amuletos (STORY_AMULET_SPRITES)
// ================================================================
const A_AMULETS = {
    amuleto_1:  'https://i.imgur.com/wZNdnfe.png',  // ✓
    amuleto_2:  'https://i.imgur.com/grxwdL7.png',  // ✓
    amuleto_3:  'https://i.imgur.com/1Au85vR.png',  // ✓
    amuleto_4:  'https://i.imgur.com/cBaWgUV.png',  // ✓
    amuleto_5:  'https://i.imgur.com/NCSB2In.png',  // ✓
    amuleto_6:  'https://i.imgur.com/nbWin30.png',  // ✓
    amuleto_7:  'https://i.imgur.com/SdrNTgW.png',  // ✓
    amuleto_8:  'https://i.imgur.com/MZqecGu.png',  // ✓
    amuleto_9:  'https://i.imgur.com/60PhZcr.png',  // ✓
    amuleto_10: 'https://i.imgur.com/GhVUlJ8.png',  // ✓
    amuleto_11: 'https://i.imgur.com/Ugx2s1z.png',  // ✓
    amuleto_12: 'https://i.imgur.com/rRwaKTH.png',  // ✓
    amuleto_13: 'https://i.imgur.com/oDtZdxA.png',  // ✓
};


// ================================================================
// 💎 A_MATERIALS — Materiais (STORY_MATERIAL_SPRITES)
// ================================================================
const A_MATERIALS = {
    // ---- Ato 1 ----
    espinho:          'https://i.imgur.com/lEnuaey.png',  // ✓
    espinho_raro:     'https://i.imgur.com/YNUNntc.png',  // ✓
    pele_jacare:      'https://i.imgur.com/BG6eT8i.png',  // ✓
    escama_brilhante: 'https://i.imgur.com/FKvYzZ3.png',  // ✓
    chifre_cervo:     'https://i.imgur.com/I41gtiJ.png',  // ✓
    chifre_ancestral: 'https://i.imgur.com/8kPnUtX.png',  // ✓
    garra_onca:       'https://i.imgur.com/TLwSsmn.png',  // ✓
    garra_lendaria:   'https://i.imgur.com/8yK7V89.png',  // ✓
    gorro_saci:       'https://i.imgur.com/5KCdWWZ.png',  // ✓
    amuleto_saci:     'https://i.imgur.com/wZNdnfe.png',  // ✓

    // ---- Ato 2 ----
    pelo_tamandua:      'https://i.imgur.com/nkvQ3EG.png',  // ✓
    garra_tamandua:     'https://i.imgur.com/g8MZYeu.png',  // ✓
    couro_anta:         'https://i.imgur.com/WDIf5e7.png',  // ✓
    chifre_anta:        'https://i.imgur.com/DUAD1UB.png',  // ✓
    cera_queixada:      'https://i.imgur.com/lp2iykt.png',  // ✓
    presa_queixada:     'https://i.imgur.com/yi9oRFy.png',  // ✓
    escama_sucuri:      'https://i.imgur.com/ITchbmQ.png',  // ✓
    pele_sucuri:        'https://i.imgur.com/TQAUp0L.png',  // ✓
    pelo_mapinguari:    'https://i.imgur.com/Mgy0IG8.png',  // ✓
    amuleto_mapinguari: 'https://i.imgur.com/grxwdL7.png',  // ✓

    // ---- Ato 3 ----
    escama_piranha:  'https://i.imgur.com/kgoUTpU.png',  // ✓
    dente_piranha:   'https://i.imgur.com/3zk4fmC.png',  // ✓
    pelo_lontra:     'https://i.imgur.com/kI3a2zX.png',  // ✓
    garra_lontra:    'https://i.imgur.com/kNdKrkP.png',  // ✓
    pelo_ariranha:   'https://i.imgur.com/zCM98NX.png',  // ✓
    dente_ariranha:  'https://i.imgur.com/EdSUqjg.png',  // ✓
    escama_pirarucu: 'https://i.imgur.com/XpUjh4G.png',  // ✓
    lingua_pirarucu: 'https://i.imgur.com/DRTmmiT.png',  // ✓
    joia_iara:       'https://i.imgur.com/j2zjNYG.png',  // ✓
    amuleto_iara:    'https://i.imgur.com/1Au85vR.png',  // ✓

    // ---- Ato 4 ----
    pele_cascavel:     'https://i.imgur.com/l8tPijz.png',  // ✓
    chocalho_cascavel: 'https://i.imgur.com/HpZIXLn.png',  // ✓
    anel_coral:        'https://i.imgur.com/ecZV4QI.png',  // ✓
    veneno_coral:      'https://i.imgur.com/ItUix5K.png',  // ✓
    pele_jararaca:     'https://i.imgur.com/hOJwfmd.png',  // ✓
    presa_jararaca:    'https://i.imgur.com/4MBzwuX.png',  // ✓
    casco_tartaruga:   'https://i.imgur.com/O4HKJzr.png',  // ✓
    ovo_tartaruga:     'https://i.imgur.com/4Rtovom.png',  // ✓
    escama_boitata:    'https://i.imgur.com/9NBxzxu.png',  // ✓
    amuleto_boitata:   'https://i.imgur.com/cBaWgUV.png',  // ✓

    // ---- Ato 5 ----
    chifre_bode:     'https://i.imgur.com/PEUng6v.png',  // ✓
    pelo_bode:       'https://i.imgur.com/K1iK21s.png',  // ✓
    la_carneiro:     'https://i.imgur.com/RDgvubw.png',  // ✓
    chifre_carneiro: 'https://i.imgur.com/akmk5Rc.png',  // ✓
    crina_cavalo:    'https://i.imgur.com/4YV8EKn.png',  // ✓
    casco_cavalo:    'https://i.imgur.com/ZowdhMC.png',  // ✓
    chifre_touro:    'https://i.imgur.com/YRtPJ8l.png',  // ✓
    couro_touro:     'https://i.imgur.com/gZeLGoE.png',  // ✓
    ferradura_mula:  'https://i.imgur.com/j0KDfvl.png',  // ✓
    amuleto_mula:    'https://i.imgur.com/NCSB2In.png',  // ✓

    // ---- Ato 6 ----
    pena_urubu:      'https://i.imgur.com/rXrxotX.png',  // ✓
    bico_urubu:      'https://i.imgur.com/5taPpjh.png',  // ✓
    pena_carcara:    'https://i.imgur.com/WZ6M71Z.png',  // ✓
    garra_carcara:   'https://i.imgur.com/mnVsZ8c.png',  // ✓
    placa_tatu:      'https://i.imgur.com/PWN8WJN.png',  // ✓
    garra_tatu:      'https://i.imgur.com/0GVyG4N.png',  // ✓
    pelo_lobo_guara: 'https://i.imgur.com/SACZHLY.png',  // ✓
    presa_lobo_guara:'https://i.imgur.com/4xBtg0m.png',  // ✓
    osso_corpo_seco: 'https://i.imgur.com/yCGLbk6.png',  // ✓
    amuleto_corpo_seco: 'https://i.imgur.com/nbWin30.png', // ✓

    // ---- Ato 7 ----
    pelo_cachorro_mato: 'https://i.imgur.com/CzuZlmm.png',  // ✓
    presa_cachorro_mato:'https://i.imgur.com/OKvf39t.png',  // ✓
    cauda_raposa:       'https://i.imgur.com/VA8rW74.png',  // ✓
    pelo_raposa:        'https://i.imgur.com/whEu4si.png',  // ✓
    mascara_guaxinim:   'https://i.imgur.com/hpcbhjV.png',  // ✓
    garra_guaxinim:     'https://i.imgur.com/vlxB7Zf.png',  // ✓
    pelo_jaguatirica:   'https://i.imgur.com/PJpgkA5.png',  // ✓
    garra_jaguatirica:  'https://i.imgur.com/BJbRLkT.png',  // ✓
    pelo_lobisomem:     'https://i.imgur.com/Q6GTFIi.png',  // ✓
    amuleto_lobisomem:  'https://i.imgur.com/SdrNTgW.png',  // ✓

    // ---- Ato 8 ----
    asa_morcego:    'https://i.imgur.com/ZGi0F9K.png',  // ✓
    presa_morcego:  'https://i.imgur.com/rlTYIxR.png',  // ✓
    pena_coruja:    'https://i.imgur.com/5vpxoKa.png',  // ✓
    olho_coruja:    'https://i.imgur.com/Y7A1wW9.png',  // ✓
    pele_sapo:      'https://i.imgur.com/Oug9mNH.png',  // ✓
    veneno_sapo:    'https://i.imgur.com/1AZH1rO.png',  // ✓
    pena_seriema:   'https://i.imgur.com/udfo4lA.png',  // ✓
    bico_seriema:   'https://i.imgur.com/2Pu8FLf.png',  // ✓
    caldeirao_cuca: 'https://i.imgur.com/D73xfFj.png',  // ✓
    amuleto_cuca:   'https://i.imgur.com/MZqecGu.png',  // ✓

    // ---- Ato 9 ----
    escama_tucunare:  'https://i.imgur.com/ATGdiol.png',  // ✓
    dente_tucunare:   'https://i.imgur.com/mnVsZ8c.png',  // ✓
    escama_piraiba:   'https://i.imgur.com/ow8TFQ9.png',  // ✓
    lingua_piraiba:   'https://i.imgur.com/TNMkNZH.png',  // ✓
    escama_dourada:   'https://i.imgur.com/oJEjSCR.png',  // ✓
    barbatana_dourada:'https://i.imgur.com/M0yxEz8.png',  // ✓
    couro_peixe_boi:  'https://i.imgur.com/hMxADzR.png',  // ✓
    osso_peixe_boi:   'https://i.imgur.com/wpLp3Fz.png',  // ✓
    flor_boto:        'https://i.imgur.com/VjU6qOb.png',  // ✓
    amuleto_boto:     'https://i.imgur.com/60PhZcr.png',  // ✓

    // ---- Ato 10 ----
    chifre_bufalo: 'https://i.imgur.com/81JTkR3.png',  // ✓
    couro_bufalo:  'https://i.imgur.com/ZNeUIi9.png',  // ✓
    sino_vaca:     'https://i.imgur.com/eC6RONh.png',  // ✓
    chifre_vaca:   'https://i.imgur.com/8mLj2H3.png',  // ✓
    chifre_cabra:  'https://i.imgur.com/2Ef2uzL.png',  // ✓
    pelo_cabra:    'https://i.imgur.com/jZuInjs.png',  // ✓
    corcova_zebu:  'https://i.imgur.com/ricPmaF.png',  // ✓
    chifre_zebu:   'https://i.imgur.com/QdR6ZbI.png',  // ✓
    chifre_boi:    'https://i.imgur.com/HaNOyts.png',  // ✓
    amuleto_boi:   'https://i.imgur.com/GhVUlJ8.png',  // ✓

    // ---- Ato 11 ----
    pelo_gato_mato:  'https://i.imgur.com/KKWzAjN.png',  // ✓
    garra_gato_mato: 'https://i.imgur.com/OVzXdR7.png',  // ✓
    asa_mariposa:    'https://i.imgur.com/tVh2HIp.png',  // ✓
    po_mariposa:     'https://i.imgur.com/eHR7wl4.png',  // ✓
    mascara_quati:   'https://i.imgur.com/u3u0t9f.png',  // ✓
    cauda_quati:     'https://i.imgur.com/4YSOwAo.png',  // ✓
    pelo_sucuarana:  'https://i.imgur.com/VxUQeoh.png',  // ✓
    garra_sucuarana: 'https://i.imgur.com/baOFA8X.png',  // ✓
    raio_lunar:      'https://i.imgur.com/rRMX5zO.png',  // ✓
    amuleto_jaci:    'https://i.imgur.com/Ugx2s1z.png',  // ✓

    // ---- Ato 12 ----
    pena_gaviao:  'https://i.imgur.com/uKsKkCO.png',  // ✓
    garra_gaviao: 'https://i.imgur.com/pAcExMf.png',  // ✓
    pena_falcao:  'https://i.imgur.com/e0Jl4m6.png',  // ✓
    garra_falcao: 'https://i.imgur.com/OVzXdR7.png',  // ✓
    pena_urutau:  'https://i.imgur.com/RJ5R30X.png',  // ✓
    olho_urutau:  'https://i.imgur.com/MXv4iR4.png',  // ✓
    pena_aguia:   'https://i.imgur.com/Voa3glg.png',  // ✓
    garra_aguia:  'https://i.imgur.com/mnVsZ8c.png',  // ✓
    coroa_solar:  'https://i.imgur.com/eU5rrOA.png',  // ✓
    amuleto_guaraci: 'https://i.imgur.com/rRwaKTH.png', // ✓

    // ---- Ato 13 ----
    fragmento_abismo: 'https://i.imgur.com/mEsrwkS.png',  // ✓
    essencia_anhanga: 'https://i.imgur.com/cfBkyLL.png',  // ✓

    // ---- V10.80 — NOVOS (vazios → usa emoji) ----
    coracao_vazio:    '',  // ⬜ 🖤
    essencia_sombria: '',  // ⬜ 🌑
    nucleo_abismo:    '',  // ⬜ 💀
    fragmento_teju:   'https://i.imgur.com/KZLVehp.png',  // ⬜ 🔥 (ver A_EVENTO)
    fragmento_mboi:   'https://i.imgur.com/UbqoKLo.png',  // ⬜ 💧 (ver A_EVENTO)
    fragmento_monai:  'https://i.imgur.com/tsb1S32.png',  // ⬜ 🌪️ (ver A_EVENTO)
    fragmento_jasy:   'https://i.imgur.com/eHA6G7Y.png',  // ⬜ ☀️ (ver A_EVENTO)
    fragmento_kurupi: 'https://i.imgur.com/lZUTJtt.png',  // ⬜ 🌱 (ver A_EVENTO)
    fragmento_aoao:   'https://i.imgur.com/kFp1ZU4.png',  // ⬜ 🐾 (ver A_EVENTO)
    fragmento_luison: 'https://i.imgur.com/khrbQlR.png',  // ⬜ 🌑 (ver A_EVENTO)
};


// ================================================================
// 🎉 A_EVENTO — Bosses + Armas + Fragmentos (EVENTO_SPRITES)
// ================================================================
const A_EVENTO = {
    // ---- Bosses do Evento ----
    teju_jagua:  'https://i.imgur.com/0atgaFe.gif',  // ✓
    mboi_tui:    'https://i.imgur.com/69aaS7o.gif',  // ✓
    monai:       'https://i.imgur.com/iJl1nlQ.gif',  // ✓
    jasy_jatere: 'https://i.imgur.com/sAeJs3R.gif',  // ✓
    kurupi:      'https://i.imgur.com/gMVyzEk.gif',  // ✓
    ao_ao:       'https://i.imgur.com/CxdJ0y5.gif',  // ✓
    luison:      'https://i.imgur.com/PRdbFLR.gif',  // ✓
    pesadelo:    'https://i.imgur.com/L43Dzl2.gif',  // ✓

    // ---- Armas do Evento (21) ----
    arma_teju_tacape:   'https://i.imgur.com/lLVprTE.png',  // ✓
    arma_teju_flecha:   'https://i.imgur.com/zuBrBm1.png',  // ✓
    arma_teju_cajado:   'https://i.imgur.com/Z5fZdzT.png',  // ✓
    arma_mboi_tacape:   'https://i.imgur.com/yG0vaOB.png',  // ✓
    arma_mboi_flecha:   'https://i.imgur.com/quiGqux.png',  // ✓
    arma_mboi_cajado:   'https://i.imgur.com/TmWTowF.png',  // ✓
    arma_monai_tacape:  'https://i.imgur.com/6wI2Ctu.png',  // ✓
    arma_monai_flecha:  'https://i.imgur.com/AtwwLRj.png',  // ✓
    arma_monai_cajado:  'https://i.imgur.com/yIazf0k.png',  // ✓
    arma_jasy_tacape:   'https://i.imgur.com/JiE579L.png',  // ✓
    arma_jasy_flecha:   'https://i.imgur.com/VY6BuM3.png',  // ✓
    arma_jasy_cajado:   'https://i.imgur.com/t3gPgqF.png',  // ✓
    arma_kurupi_tacape: 'https://i.imgur.com/OfTmKyD.png',  // ✓
    arma_kurupi_flecha: 'https://i.imgur.com/PICIZDe.png',  // ✓
    arma_kurupi_cajado: 'https://i.imgur.com/S55ogba.png',  // ✓
    arma_aoao_tacape:   'https://i.imgur.com/vcd54H6.png',  // ✓
    arma_aoao_flecha:   'https://i.imgur.com/Hb9fKsR.png',  // ✓
    arma_aoao_cajado:   'https://i.imgur.com/BVMs4O9.png',  // ✓
    arma_luison_tacape: 'https://i.imgur.com/3gfyDqQ.png',  // ✓
    arma_luison_flecha: 'https://i.imgur.com/xmJQr2B.png',  // ✓
    arma_luison_cajado: 'https://i.imgur.com/IUL7382.png',  // ✓

    // ---- Fragmentos Divinos (7) ----
    fragmento_teju:   'https://i.imgur.com/KZLVehp.png',  // ✓
    fragmento_mboi:   'https://i.imgur.com/UbqoKLo.png',  // ✓
    fragmento_monai:  'https://i.imgur.com/tsb1S32.png',  // ✓
    fragmento_jasy:   'https://i.imgur.com/eHA6G7Y.png',  // ✓
    fragmento_kurupi: 'https://i.imgur.com/lZUTJtt.png',  // ✓
    fragmento_aoao:   'https://i.imgur.com/kFp1ZU4.png',  // ✓
    fragmento_luison: 'https://i.imgur.com/khrbQlR.png',  // ✓
};


// ================================================================
// 🎬 A_BRAVELY — GIFs dos PAs dos heróis novos
// -----------------------------------------------------------------
// Vazios → usam fallback por arquétipo (BRAVELY_TUPA/SUME/CAIPORA)
// ================================================================
const A_BRAVELY = {
    Kanarott:         '',  // ⬜
    'Juruá':          '',  // ⬜
    'Bicho Folharal': '',  // ⬜
    Eru:              '',  // ⬜
    Teperesik:        '',  // ⬜
    'Anduré':         '',  // ⬜
    'Pajé Anhanguera':'',  // ⬜
    'Mãe da Mata':    '',  // ⬜
    Araci:            '',  // ⬜
    "Tapyra'yawara":  '',  // ⬜
    'Curupira':       '',  // ⬜
    'Kianumanka-Manã':'',  // ⬜
    'Anhanga-Mirim':  '',  // ⬜
    'Matinta Pereira':'',  // ⬜
    'Naiá':           '',  // ⬜
    'Kuatí':          '',  // ⬜
    "Caboclo d'Água": '',  // ⬜
    'Tupinambá':      '',  // ⬜
    'Mbaraká':        '',  // ⬜
    'Mãe-do-Ouro':    '',  // ⬜
    'Pajé-Açu':       '',  // ⬜
    'Negrinho do Pastoreio': '', // ⬜
    'Rudá':           '',  // ⬜
};


// ================================================================
// 🖼️ A_HERO_PA_IMAGES — Imagens reais do PA (opcional)
// ================================================================
const A_HERO_PA_IMAGES = {
    Tupa: '', Sume: '', Caipora: '',
    Kanarott: '', 'Juruá': '', 'Bicho Folharal': '', Eru: '', Teperesik: '',
    'Anduré': '', 'Mãe da Mata': '', 'Pajé Anhanguera': '', Araci: '',
    "Tapyra'yawara": '',
};


// ================================================================
// 🔊 A_SFX — Sons curtos (via CUSTOM_SFX)
// -----------------------------------------------------------------
// Valores atuais são NOMES DE ARQUIVO (não URLs).
// Você pode colocar caminho local ("meus_sons/x.mp3") ou URL.
// Aliases (boto_skill2 = iara2) são tratados separadamente:
// customizar "boto_skill2" NÃO afeta "iara2".
// ================================================================
const A_SFX = {
    // ---- Combate ----
    skill1:  'dramatic-synth-echo-43970.mp3',  // ✓
    atkg:    'atkg.mp3',                       // ✓
    atkm:    'atkm.mp3',                       // ✓
    atka:    'atka.mp3',                       // ✓
    click:   'click.mp3',                      // ✓
    garras:  'garras.mp3',                     // ✓
    bote:    'bote.mp3',                       // ✓
    chifre:  'chifre.mp3',                     // ✓
    coice:   'coice.mp3',                      // ✓
    splash:  'splash.mp3',                     // ✓
    felino:  'felino.mp3',                     // ✓
    asas:    'asas.mp3',                       // ✓
    aguia:   'aguia.mp3',                      // ✓
    mariposa:'mariposa.mp3',                   // ✓
    rosnado: 'rosnado.mp3',                    // ✓
    urro:    'urro.mp3',                       // ✓
    chocalho:'chocalho.mp3',                   // ✓
    horse:   'horse.mp3',                      // ✓

    // ---- Habilidades de boss (base) ----
    saci1:   'saci1.mp3',                      // ✓
    saci:    'saci.mp3',                       // ✓
    iara1:   'iara1.mp3',                      // ✓
    iara2:   'iara2.mp3',                      // ✓
    minoa1:  'minoa1.mp3',                     // ✓
    minoa2:  'minoa2.mp3',                     // ✓
    cucask1: 'cucask1.mp3',                    // ✓
    cucask2: 'cucask2.mp3',                    // ✓
    boto_skill1: 'boto_skill1.mp3',            // ✓
    boto_skill2: 'iara2.mp3',                  // ✓ (alias)
    boi_skill1:  'boi_skill1.mp3',             // ✓
    boi_skill2:  'boi_skill2.mp3',             // ✓
    jaci_skill1: 'saci1.mp3',                  // ✓ (alias)
    jaci_skill2: 'jaciskill2.mp3',             // ✓
    guaraci_skill1: 'dramatic-synth-echo-43970.mp3', // ✓ (alias)
    guaraci_skill2: 'guaraciskill2.mp3',       // ✓
    anhanga_skill1: 'dramatic-synth-echo-43970.mp3', // ✓ (alias)
    anhanga_skill2: 'cucask2.mp3',             // ✓ (alias)

    // ---- Fim / UI ----
    win:      'win.mp3',                       // ✓
    gameover: 'gameover.mp3',                  // ✓
    purificacao: 'purificacao.mp3',            // ✓
    forja:    'forja.mp3',                     // ✓
    intro:    'intro.mp3',                     // ✓
};


// ================================================================
// 🎵 A_BGM — Temas de boss (mutação de sfx[k].src)
// ================================================================
const A_BGM = {
    bgm:             'fundoboss.mp3',           // ✓
    sacitema:        'sacitema.mp3',            // ✓
    mapinguaritema:  'mapinguariteme.mp3',      // ✓
    boitatatema:     'boitatatema.mp3',         // ✓
    iaratema:        'iarateme.mp3',            // ✓
    mulatema:        'mulasemcabeca.mp3',       // ✓
    corposecotema:   'corposeco.mp3',           // ✓
    lobisomemtema:   'lobisomem.mp3',           // ✓
    cucatema:        'cuca.mp3',                // ✓
    bototema:        'boto.mp3',                // ✓
    boitema:         'boi.mp3',                 // ✓
    jacitema:        'jaci.mp3',                // ✓
    guaracitema:     'guaraci.mp3',             // ✓
    anhangatema:     'anhanga.mp3',             // ✓
};


// ================================================================
// 🔧 APLICADOR
// ================================================================
(function aplicarAssets() {
    if (window._assetsAplicados) return;

    // Aguarda tabelas existirem
    if (typeof SPRITES === 'undefined' || typeof sfx === 'undefined') {
        setTimeout(aplicarAssets, 500);
        return;
    }
    window._assetsAplicados = true;

    let count = 0;

    const aplicarObj = (src, dst) => {
        if (!src || !dst) return;
        for (const k in src) {
            const v = src[k];
            if (v && String(v).trim() !== '') {
                dst[k] = v;
                count++;
            }
        }
    };

    // ---- Sprites ----
    aplicarObj(A_SPRITES, typeof SPRITES !== 'undefined' ? SPRITES : null);
    aplicarObj(A_ANIMAIS, typeof SPRITES_STORY !== 'undefined' ? SPRITES_STORY : null);
    aplicarObj(A_HEROIS, typeof SPRITES_STORY !== 'undefined' ? SPRITES_STORY : null);
    aplicarObj(A_CENARIOS, typeof SPRITES_STORY !== 'undefined' ? SPRITES_STORY : null);
    aplicarObj(A_ICONS, typeof ICONS !== 'undefined' ? ICONS : null);
    aplicarObj(A_WEAPONS, typeof STORY_WEAPON_SPRITES !== 'undefined' ? STORY_WEAPON_SPRITES : null);
    aplicarObj(A_AMULETS, typeof STORY_AMULET_SPRITES !== 'undefined' ? STORY_AMULET_SPRITES : null);
    aplicarObj(A_MATERIALS, typeof STORY_MATERIAL_SPRITES !== 'undefined' ? STORY_MATERIAL_SPRITES : null);
    aplicarObj(A_EVENTO, typeof EVENTO_SPRITES !== 'undefined' ? EVENTO_SPRITES : null);
    aplicarObj(A_BRAVELY, typeof STORY_BRAVELY_GIFS !== 'undefined' ? STORY_BRAVELY_GIFS : null);
    aplicarObj(A_HERO_PA_IMAGES, typeof STORY_HERO_PA_IMAGES !== 'undefined' ? STORY_HERO_PA_IMAGES : null);

    // ---- SFX via CUSTOM_SFX ----
    window.CUSTOM_SFX = window.CUSTOM_SFX || {};
    for (const k in A_SFX) {
        if (A_SFX[k] && String(A_SFX[k]).trim() !== '') {
            window.CUSTOM_SFX[k] = A_SFX[k];
            count++;
        }
    }

    // ---- BGM via sfx[k].src ----
    for (const k in A_BGM) {
        if (A_BGM[k] && String(A_BGM[k]).trim() !== '' && sfx[k]) {
            try { sfx[k].src = A_BGM[k]; count++; } catch(e) {}
        }
    }

    // ---- Hook playSfx (usa CUSTOM_SFX) ----
    const _orig = window.playSfx;
    if (typeof _orig === 'function' && !_orig._assetsHook) {
        window.playSfx = function(name) {
            const custom = window.CUSTOM_SFX?.[name];
            if (custom && String(custom).trim() !== '') {
                if (typeof audioUnlocked !== 'undefined' && !audioUnlocked) return;
                try {
                    const a = new Audio(custom);
                    a.volume = 0.6 * (window._sfxVolumeMultiplier || 1);
                    a.play().catch(() => {});
                } catch (e) { console.warn('[assets] SFX falhou:', name, e); }
                return;
            }
            return _orig.apply(this, arguments);
        };
        window.playSfx._assetsHook = true;
    }

    console.log(`✅ [assets.js] ${count} valor(es) aplicado(s).`);
})();


// ================================================================
// 🐛 DEBUG
// ================================================================
window._debugAssets = function() {
    console.log('═══ [assets.js] Catálogo ═══');
    const tabelas = {
        'A_SPRITES': A_SPRITES,
        'A_ANIMAIS': A_ANIMAIS,
        'A_HEROIS': A_HEROIS,
        'A_CENARIOS': A_CENARIOS,
        'A_ICONS': A_ICONS,
        'A_WEAPONS': A_WEAPONS,
        'A_AMULETS': A_AMULETS,
        'A_MATERIALS': A_MATERIALS,
        'A_EVENTO': A_EVENTO,
        'A_BRAVELY': A_BRAVELY,
        'A_HERO_PA_IMAGES': A_HERO_PA_IMAGES,
        'A_SFX': A_SFX,
        'A_BGM': A_BGM,
    };
    let totalGeral = 0, totalVazios = 0;
    for (const [nome, obj] of Object.entries(tabelas)) {
        const total = Object.keys(obj).length;
        const preenchidos = Object.values(obj).filter(v => v && String(v).trim() !== '').length;
        const vazios = total - preenchidos;
        totalGeral += preenchidos;
        totalVazios += vazios;
        console.log(`${nome}: ${preenchidos}/${total} preenchido(s) · ${vazios} vazio(s)`);
    }
    console.log('─────────────────────────────────────');
    console.log(`TOTAL: ${totalGeral} preenchidos · ${totalVazios} vazios`);
    console.log('═══════════════════════════════════');
};

console.log('');
console.log('═══════════════════════════════════════════════════');
console.log('📦 assets.js V2 carregado');
console.log('═══════════════════════════════════════════════════');
console.log('• Todos os URLs atuais já estão preenchidos');
console.log('• Edite qualquer linha para trocar o asset');
console.log('• Slots ⬜ usam emoji/fallback do código');
console.log('• Debug: window._debugAssets()');
console.log('═══════════════════════════════════════════════════');