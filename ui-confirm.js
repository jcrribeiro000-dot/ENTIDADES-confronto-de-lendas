// =================================================================
// ui-confirm.js — Diálogos de confirmação DENTRO do jogo
// -----------------------------------------------------------------
// Substitui o alert()/confirm() do navegador (aquela caixinha cinza
// do sistema, que quebra a imersão do app).
//
// Uso:
//   await uiConfirm('Mensagem', { titulo: 'Título', ok: 'Sim', cancelar: 'Não' })
//   await uiAlert('Mensagem')
//
// Carregar depois de historia.js (usa as fontes do jogo) e antes de
// aldeia.js, que já faz uso dele.
// =================================================================
(function uiConfirmV1() {
    if (window.uiConfirm) return;

    const CSS_ID = 'uiConfirmStyles';

    function injetarCSS() {
        if (document.getElementById(CSS_ID)) return;
        const st = document.createElement('style');
        st.id = CSS_ID;
        st.textContent = `
            .ui-confirm-overlay {
                position: fixed; inset: 0;
                display: flex; align-items: center; justify-content: center;
                background: rgba(10, 6, 2, .9);
                z-index: 50000;
                padding: 20px;
                animation: uiConfirmFade .18s ease;
            }
            @keyframes uiConfirmFade { from { opacity: 0; } to { opacity: 1; } }
            .ui-confirm-panel {
                background: linear-gradient(180deg, #2a1f10, #1a1208);
                border: 2px solid #c9a227;
                border-radius: 10px;
                max-width: 440px; width: 100%;
                padding: 22px;
                box-shadow: 0 20px 60px rgba(0,0,0,.9), 0 0 30px rgba(201,162,39,.25);
                animation: uiConfirmUp .2s ease;
            }
            @keyframes uiConfirmUp { from { transform: translateY(10px); opacity: .6; } to { transform: none; opacity: 1; } }
            .ui-confirm-title {
                font-family: 'Cinzel', serif;
                color: #e8b923;
                font-size: .9rem;
                letter-spacing: 2px;
                text-align: center;
                margin-bottom: 12px;
                text-transform: uppercase;
            }
            .ui-confirm-text {
                font-family: 'EB Garamond', serif;
                color: #e8ddc4;
                font-size: 1.02rem;
                line-height: 1.55;
                text-align: center;
                white-space: pre-line;
            }
            .ui-confirm-actions { display: flex; gap: 10px; margin-top: 20px; }
            .ui-confirm-btn {
                flex: 1;
                padding: 12px 10px;
                border-radius: 6px;
                font-family: 'Cinzel', serif;
                font-size: .8rem;
                letter-spacing: 1px;
                font-weight: 700;
                cursor: pointer;
                transition: filter .15s ease, transform .1s ease;
            }
            .ui-confirm-btn:hover { filter: brightness(1.2); }
            .ui-confirm-btn:active { transform: scale(.98); }
            .ui-confirm-cancel {
                background: rgba(60, 45, 25, .85);
                border: 1px solid #6b5a35;
                color: #c8b787;
            }
            .ui-confirm-ok {
                background: rgba(120, 90, 20, .4);
                border: 1px solid #e8b923;
                color: #f3e6bf;
            }
        `;
        document.head.appendChild(st);
    }

    function escapar(txt) {
        return String(txt)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // Confirmar (Cancelar / OK) -> Promise<boolean>
    window.uiConfirm = function (mensagem, opcoes) {
        injetarCSS();
        const opt = opcoes || {};
        const titulo = opt.titulo || 'Confirmar';
        const rotuloOk = opt.ok || 'Confirmar';
        const rotuloCancelar = opt.cancelar || 'Cancelar';

        return new Promise((resolve) => {
            const ov = document.createElement('div');
            ov.className = 'ui-confirm-overlay';
            ov.innerHTML =
                '<div class="ui-confirm-panel">' +
                    '<div class="ui-confirm-title">' + escapar(titulo) + '</div>' +
                    '<div class="ui-confirm-text">' + escapar(mensagem) + '</div>' +
                    '<div class="ui-confirm-actions">' +
                        '<button type="button" class="ui-confirm-btn ui-confirm-cancel">' + escapar(rotuloCancelar) + '</button>' +
                        '<button type="button" class="ui-confirm-btn ui-confirm-ok">' + escapar(rotuloOk) + '</button>' +
                    '</div>' +
                '</div>';

            document.body.appendChild(ov);

            let respondido = false;
            function fechar(valor) {
                if (respondido) return;
                respondido = true;
                document.removeEventListener('keydown', aoTeclar, true);
                ov.remove();
                resolve(valor);
            }
            function aoTeclar(e) {
                if (e.key === 'Enter') { e.preventDefault(); fechar(true); }
                else if (e.key === 'Escape') { e.preventDefault(); fechar(false); }
            }

            ov.querySelector('.ui-confirm-cancel').addEventListener('click', () => fechar(false));
            ov.querySelector('.ui-confirm-ok').addEventListener('click', () => fechar(true));
            ov.addEventListener('click', (e) => { if (e.target === ov) fechar(false); });
            document.addEventListener('keydown', aoTeclar, true);

            setTimeout(() => {
                const b = ov.querySelector('.ui-confirm-ok');
                if (b) b.focus();
            }, 40);
        });
    };

    // Aviso (só OK) -> Promise<void>
    window.uiAlert = function (mensagem, opcoes) {
        injetarCSS();
        const opt = opcoes || {};
        const titulo = opt.titulo || 'Aviso';
        const rotuloOk = opt.ok || 'Entendi';

        return new Promise((resolve) => {
            const ov = document.createElement('div');
            ov.className = 'ui-confirm-overlay';
            ov.innerHTML =
                '<div class="ui-confirm-panel">' +
                    '<div class="ui-confirm-title">' + escapar(titulo) + '</div>' +
                    '<div class="ui-confirm-text">' + escapar(mensagem) + '</div>' +
                    '<div class="ui-confirm-actions">' +
                        '<button type="button" class="ui-confirm-btn ui-confirm-ok">' + escapar(rotuloOk) + '</button>' +
                    '</div>' +
                '</div>';

            document.body.appendChild(ov);

            let respondido = false;
            function fechar() {
                if (respondido) return;
                respondido = true;
                document.removeEventListener('keydown', aoTeclar, true);
                ov.remove();
                resolve();
            }
            function aoTeclar(e) {
                if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); fechar(); }
            }

            ov.querySelector('.ui-confirm-ok').addEventListener('click', fechar);
            ov.addEventListener('click', (e) => { if (e.target === ov) fechar(); });
            document.addEventListener('keydown', aoTeclar, true);

            setTimeout(() => {
                const b = ov.querySelector('.ui-confirm-ok');
                if (b) b.focus();
            }, 40);
        });
    };

    // Aviso rápido: toast do jogo. Só abre diálogo se o toast não existir.
    // Substitui alert() sem travar a tela nem sair do visual do app.
    window.uiAviso = function (mensagem, titulo) {
        const txt = (mensagem === null || mensagem === undefined) ? '' : String(mensagem);
        const tit = titulo || '⚠️ Aviso';

        if (typeof window.showToast === 'function') {
            window.showToast(tit, txt, '⚠️');
            return;
        }
        if (typeof window.uiAlert === 'function') {
            window.uiAlert(txt, { titulo: tit });
            return;
        }
        // Último recurso (jogo ainda não carregou)
        alert(txt);
    };

    console.log('✅ [ui-confirm] Diálogos internos disponíveis: window.uiConfirm / window.uiAlert / window.uiAviso');
})();
