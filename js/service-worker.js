// Service Worker for Heroes 3: ERA Creature Bank Editor
const CACHE_NAME = 'heroes3-cb-editor-v1.1';
const filesToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/main.js',
    '/manifest.json',
    '/lang/en.json',
    '/lang/ru.json',
    '/icon-64.png',
    '/icon-192.png',
    '/icon-512.png'
];

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(filesToCache))
            .catch((error) => console.error('Failed to cache files during install:', error))
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
            .catch((error) => console.error('Fetch failed:', error))
    );
});