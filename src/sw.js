console.log('Hello, world!');

self.addEventListener("fetch", (event) => {
    event.respondWith(fetch(event.request));
});

self.addEventListener('install', function(event) {
    self.skipWaiting();
});

let script_url = undefined;
if (self.location.hostname === 'localhost') {
    script_url = "/node_modules/mantalon-client/mantalon_client.js";
} else {
    script_url = "/mantalon-lib/mantalon_client.js";
}

importScripts(script_url);
