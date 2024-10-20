var PROXY_URL = undefined;

self.addEventListener("fetch", (event) => {
    event.respondWith(proxiedFetch(event.request));
});

self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
    if (event.data.type === 'PROXY_URL') {
        if (PROXY_URL !== event.data.url) {
            console.log("Received proxy url", event.data.url);
            PROXY_URL = event.data.url;
            initMantalon();
        }
    } else {
        console.error("Unknown message", event.data);
    }
});

let script_url, wasm_url = undefined;
if (self.location.hostname === 'localhost') {
    script_url = "/node_modules/mantalon-client/mantalon_client.js";
    wasm_url = "/node_modules/mantalon-client/mantalon_client_bg.wasm";
} else {
    script_url = "/mantalon-lib/mantalon_client.js";
    wasm_url = "/mantalon-lib/mantalon_client_bg.wasm";
}

var initError = null;
try {
    importScripts(script_url);
} catch (e) {
    initError = e;
    console.error("Failed to load Mantalon", e);
}

function initMantalon() {
    const { init, proxiedFetch } = wasm_bindgen;
    async function run() {
        await wasm_bindgen(wasm_url);
        await init(PROXY_URL);
        self.proxiedFetch = proxiedFetch;
        console.log("Successfully initialized Mantalon");
    }
    run().catch((e) => {
        initError = e;
        console.error("Failed to initialize Mantalon", e);
    })
}
