/*
  Service Worker — "Para Ti, Angie"
  Cachea todo el observatorio (HTML, fotos, audio, íconos) para que
  funcione instalado y sin conexión, como un regalo que vive en su teléfono.
*/

const CACHE_NAME = "cantares-6-9-v10";

const ARCHIVOS_CORE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./Cara.mp3",
  "./Carainstrumental.mp3",
  "./icons/icon-72.png",
  "./icons/icon-96.png",
  "./icons/icon-128.png",
  "./icons/icon-144.png",
  "./icons/icon-152.png",
  "./icons/icon-192.png",
  "./icons/icon-384.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
  "./icons/favicon-16.png",
  "./img/amor.jpeg",
  "./img/boda1.jpeg",
  "./img/boda2.jpeg",
  "./img/boda3.jpeg",
  "./img/caraangie1.jpeg",
  "./img/caraangie2.jpeg",
  "./img/caraangie3.jpeg",
  "./img/caraangie4.jpeg",
  "./img/caraangie5.jpeg",
  "./img/caraangie6.jpeg",
  "./img/caraangie7.jpeg",
  "./img/tiernaangie.jpeg",
  "./img/tiernaangie1.jpeg",
  "./img/tiernaangie2.jpeg",
  "./img/tiernaangie3.jpeg",
  "./img/tiernaangie4.jpeg",
  "./img/tiernaangie5.jpeg",
  "./img/tiernaangie6.jpeg",
  "./img/tiernaangie7.jpeg",
  "./img/manos.jpeg",
  "./img/cora.jpeg",
  "./img/dedos.jpeg",
  "./img/risas1.jpeg",
  "./img/risas2.jpeg",
  "./img/caraacara.jpeg",
  "./img/juntos.jpeg",
  "./img/juntos1.jpeg",
  "./img/juntos2.jpeg",
  "./img/juntos3.jpeg",
  "./img/juntos4.jpeg",
  "./img/juntos5.jpeg",
  "./img/mejilla1.jpeg",
  "./img/mejilla2.jpeg",
  "./img/mejilla3.jpeg",
  "./img/mejilla4.jpeg",
  "./img/beso.jpeg",
  "./img/beso1.jpeg",
  "./img/beso2.jpeg",
  "./img/beso3.jpeg",
  "./img/beso4.jpeg",
  "./img/beso5.jpeg"
];

/* Instala: intenta cachear todo lo del proyecto.
   Si falta algún archivo (foto que aún no subiste), no rompe la instalación entera:
   cachea uno por uno y sigue de largo con los que sí existan. */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        ARCHIVOS_CORE.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("[SW] No se pudo cachear (¿falta el archivo?):", url);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

/* Activa: limpia versiones viejas de caché */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres
          .filter((nombre) => nombre !== CACHE_NAME)
          .map((nombre) => caches.delete(nombre))
      )
    )
  );
  self.clients.claim();
});

/* Auto-reparación: si la página avisa (al abrir con internet) que quiere
   "completar caché", revisa archivo por archivo y descarga solo los que
   falten — por ejemplo, si una conexión floja interrumpió la descarga
   inicial de algún audio o foto. Así no depende de subir una nueva versión
   cada vez que algo no se alcanzó a cachear. */
self.addEventListener("message", (event) => {
  if (event.data && event.data.tipo === "completarCache"){
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        await Promise.all(
          ARCHIVOS_CORE.map(async (url) => {
            const yaEsta = await cache.match(url);
            if (!yaEsta){
              try{ await cache.add(url); }
              catch(err){ console.warn("[SW] Sigue sin poder cachear:", url); }
            }
          })
        );
      })
    );
  }
});

/* Fetch: cache-first para todo lo del propio sitio (offline-friendly),
   network-first para fuentes/externos (NASA, Google Fonts) que no son críticos. */
self.addEventListener("fetch", (event) => {

  const url = new URL(event.request.url);
  const esMismoOrigen = url.origin === self.location.origin;

  if (!esMismoOrigen) {
    // recursos externos: intenta red, si falla y hay algo en cache, usa cache
    event.respondWith(
      fetch(event.request)
        .then((respuesta) => {
          const copia = respuesta.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
          return respuesta;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // mismo origen: cache-first
  event.respondWith(
    caches.match(event.request).then((cacheada) => {
      if (cacheada) return cacheada;

      return fetch(event.request).then((respuesta) => {
        if (respuesta.ok) {
          const copia = respuesta.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
        }
        return respuesta;
      });
    })
  );

});