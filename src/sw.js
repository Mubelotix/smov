var PROXY_URL = undefined;

self.addEventListener("fetch", (event) => {
    let url = new URL(event.request.url);
    let searchParams = new URLSearchParams(url.search);
    
    if (searchParams.get("mantalon") !== "true") {
        event.respondWith(fetch(event.request));
        return;
    }

    searchParams.delete("mantalon");
    url.search = searchParams.toString();

    console.log("Fetch intercepted for:", url);
    event.respondWith(
        self.proxiedFetch(url, {
            method: event.request.method,
            headers: event.request.headers,
            body: event.request.body,
        })
            .then((response) => {
                // Return the response from proxiedFetch if successful
                return response;
            })
            .catch((error) => {
                console.error("Proxied fetch failed:", error);

                // Provide a fallback response in case of an error
                return new Response("Something went wrong with the proxied fetch.", {
                    status: 500,
                    statusText: `Error: ${error}`,
                });
            })
    );
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
