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

    let newHeaders = new Headers();
    for (let [key, value] of event.request.headers.entries()) {
        newHeaders.append(key, value);
    }
    newHeaders.set("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36");
    newHeaders.set("Origin", url.origin);
    newHeaders.set("Referer", url.origin);
    newHeaders.set("Sec-Ch-Ua", '"Brave";v="129", "Not=A?Brand";v="8", "Chromium";v="129"');
    newHeaders.set("Sec-Ch-Ua-Mobile", "?0");
    newHeaders.set("Sec-Ch-Ua-Platform", "Linux");
    newHeaders.set("Sec-Fetch-Mode", "navigate");
    newHeaders.set("Sec-Fetch-Site", "none");
    newHeaders.set("Sec-Fetch-User", "?1");
    newHeaders.set("Sec-GPC", "1");
    newHeaders.set("Cache-Control", "no-cache");
    newHeaders.set("Pragma", "no-cache");
    newHeaders.set("Accept-Language", "en-US,en;q=0.9");

    console.log("Fetch intercepted for:", url);
    event.respondWith(
        self.proxiedFetch(url, {
            method: event.request.method,
            headers: newHeaders,
            body: event.request.body,
        })
            .then((response) => {
                // If that is a redirect, we need to update the location header
                if (response.headers.has("location")) {
                    let location = response.headers.get("location");
                    if (location.includes("?")) {
                        location += "&mantalon=true";
                    } else {
                        location += "?mantalon=true";
                    }

                    let newRespHeaders = new Headers();
                    for (let [key, value] of response.headers.entries()) {
                        newRespHeaders.append(key, value);
                    }
                    newRespHeaders.set("location", location);

                    return new Response(response.body, {
                        status: response.status,
                        headers: newRespHeaders,
                    });
                }

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
