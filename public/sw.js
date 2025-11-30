// Simple Service Worker - SkyTemp
const CACHE_NAME = 'skytemp-v3';

// Install event
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker installing...');
  self.skipWaiting(); // Important - immediately activate
});

// Activate event  
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated!');
  event.waitUntil(self.clients.claim()); // Take control immediately
});

// Fetch event - basic
self.addEventListener('fetch', (event) => {
  // Let all requests go to network
  event.respondWith(fetch(event.request));
});