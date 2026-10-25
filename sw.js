// =================================================================
// sw.js — Service Worker do ENTIDADES: Confronto de Lendas
// -----------------------------------------------------------------
// ⚠️ REGRA DE OURO: SEMPRE que subir uma versão nova do jogo,
//    mude CACHE_VERSION (v1 → v2 → v3 ...).
//    É isso que faz o navegador detectar que o sw.js mudou,
//    instalar a nova versão e apagar o cache antigo.
// =================================================================

const CACHE_VERSION = 'v31'; // ← MUDE A CADA DEPLOY
const CACHE_NAME    = `entidades-cache-${CACHE_VERSION}`;

// =================================================================
// ARQUIVOS PARA PRÉ-CACHE (app shell)
// -----------------------------------------------------------------
// Só coloque aqui o que é ESSENCIAL para o jogo abrir offline.
// Não coloque sprites/áudios grandes aqui — eles são cacheados
// sob demanda pela estratégia "cache-first" abaixo.
// =================================================================
const PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
    './entidades.js',
    './historia.js',
    './fx.js',
    './coop.js',
    './pvp.js',
    './icon-192.png',
    './icon-512.png',
    // Fontes do Google (opcional — se quiser offline total)
    // 'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@500;600;700;900&family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=IM+Fell+English:ital@0;1&display=swap',
];

// =================================================================
// INSTALL — pré-cache + skipWaiting
// -----------------------------------------------------------------
// skipWaiting() força o novo SW a ativar imediatamente, sem
// esperar o jogador fechar todas as abas.
// =================================================================
self.addEventListener('install', (event) => {
    console.log(`[SW] Instalando versão ${CACHE_VERSION}...`);
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Pré-cacheando app shell...');
                // Usa addAll com try/catch por item pra não falhar
                // se um arquivo estiver faltando no servidor
                return Promise.all(
                    PRECACHE_URLS.map((url) =>
                        cache.add(url).catch((err) => {
                            console.warn(`[SW] Falha ao pré-cachear ${url}:`, err.message);
                        })
                    )
                );
            })
            .then(() => {
                console.log(`[SW] Versão ${CACHE_VERSION} instalada.`);
            })
    );
});

// =================================================================
// ACTIVATE — limpa caches antigos + assume controle
// -----------------------------------------------------------------
// clients.claim() faz o novo SW assumir o controle das abas
// abertas imediatamente (sem esperar reload).
// =================================================================
self.addEventListener('activate', (event) => {
    console.log(`[SW] Ativando versão ${CACHE_VERSION}...`);

    event.waitUntil(
        caches.keys()
            .then((keys) => {
                return Promise.all(
                    keys
                        .filter((key) => key !== CACHE_NAME)
                        .map((key) => {
                            console.log(`[SW] Removendo cache antigo: ${key}`);
                            return caches.delete(key);
                        })
                );
            })
            .then(() => {
                console.log(`[SW] Versão ${CACHE_VERSION} ativa.`);
                return self.clients.claim();
            })
    );
});

// =================================================================
// FETCH — estratégias por tipo de recurso
// -----------------------------------------------------------------
// • HTML / JS / JSON  → Network-first (pega a versão nova,
//                        cai pro cache se offline)
// • Imagens / áudio    → Cache-first   (rápido, e o cache
//                        nunca precisa invalidar manualmente)
// • Tudo o resto       → Network-first
// =================================================================
self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Só lida com GET
    if (req.method !== 'GET') return;

    // Ignora requisições do Firebase/Firestore (não cachear)
    const url = new URL(req.url);
    if (
        url.hostname.includes('firebaseio.com') ||
        url.hostname.includes('googleapis.com') && url.pathname.includes('/firestore') ||
        url.hostname.includes('firebaseapp.com') ||
        url.hostname.includes('dreamlo.com') ||
        url.hostname.includes('corsproxy.io')
    ) {
        return; // deixa o navegador cuidar
    }

    // Detecta o tipo pelo destino ou extensão
    const dest = req.destination; // 'script', 'style', 'image', 'audio', 'document', 'font', ...
    const isImage = dest === 'image' || /\.(png|jpe?g|gif|webp|svg|ico)(\?|$)/i.test(url.pathname);
    const isAudio = dest === 'audio'  || /\.(mp3|ogg|wav|m4a)(\?|$)/i.test(url.pathname);
    const isFont  = dest === 'font'   || /\.(woff2?|ttf|otf|eot)(\?|$)/i.test(url.pathname);

    // =========================================================
    // CACHE-FIRST — imagens, áudio, fontes
    // =========================================================
    if (isImage || isAudio || isFont) {
        event.respondWith(
            caches.match(req).then((cached) => {
                if (cached) return cached;

                return fetch(req)
                    .then((res) => {
                        // Só cacheia respostas válidas
                        if (!res || res.status !== 200 || res.type === 'opaque') {
                            return res;
                        }
                        const resClone = res.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(req, resClone).catch(() => {});
                        });
                        return res;
                    })
                    .catch(() => {
                        // Offline e não está em cache → devolve 404 silencioso
                        // (o jogo tem fallback em emoji, então não quebra)
                        return new Response('', { status: 404, statusText: 'Offline' });
                    });
            })
        );
        return;
    }

    // =========================================================
    // NETWORK-FIRST — HTML, JS, JSON, CSS (o resto)
    // =========================================================
    event.respondWith(
        fetch(req)
            .then((res) => {
                // Cacheia a versão nova
                if (res && res.status === 200 && res.type === 'basic') {
                    const resClone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(req, resClone).catch(() => {});
                    });
                }
                return res;
            })
            .catch(() => {
                // Offline → tenta o cache
                return caches.match(req).then((cached) => {
                    if (cached) return cached;

                    // Se for navegação (HTML) e nada no cache, devolve o index
                    if (req.mode === 'navigate') {
                        return caches.match('./index.html');
                    }

                    // Último recurso
                    return new Response('', { status: 503, statusText: 'Offline' });
                });
            })
    );
});

// =================================================================
// MESSAGE — permite forçar atualização via postMessage
// -----------------------------------------------------------------
// No console do jogo você pode chamar:
//   navigator.serviceWorker.controller.postMessage({type:'SKIP_WAITING'})
// útil pra debugar sem fechar a aba.
// =================================================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// =================================================================
// LOG DE BOOT
// =================================================================
console.log(`[SW] Service Worker carregado (versão ${CACHE_VERSION}).`);