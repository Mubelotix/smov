console.log("hello from mantalon !");
self.addEventListener('message', (event) => {
    if (event.data.type === 'PROXY_URL') {
        console.log("PROXY_URL", event.data.url);
    } else {
        console.log("unknown message", event.data);
    }
});

// self.addEventListener('install', (event) => {
//     console.log("installing mantalon");
//     self.skipWaiting();
// });

var initError = null;
try {
    importScripts("/assets/mantalon_client.js");

    // const { init, proxiedFetch, getProxiedDomains, overrideCookie } = wasm_bindgen;
    // async function run() {
    //     await wasm_bindgen("/pkg/mantalon_client_bg.wasm?version=LIB_VERSION");
    //     await init("/pkg/config/manifest.json?version=MANIFEST_VERSION");
    //     self.proxiedFetch = proxiedFetch;
    //     self.proxiedDomains = getProxiedDomains();
    //     self.overrideCookie = overrideCookie;
    //     initialized = true;
    //     console.log("Successfully initialized Mantalon. Proxying ", self.proxiedDomains);
    // }

    // run().catch((e) => {
    //     initError = e;
    //     console.error("Failed to initialize Mantalon", e);
    // })
} catch (e) {
    initError = e;
    console.error("Failed to load Mantalon", e);
}

