import {
  makeProviders,
  makeStandardFetcher,
  targets,
} from "@movie-web/providers";

import { isExtensionActiveCached } from "@/backend/extension/messaging";
import {
  getLoadbalancedProxyUrl,
  makeExtensionFetcher,
  makeLoadBalancedSimpleProxyFetcher,
  makeMantalonFetcher,
} from "@/backend/providers/fetchers";

export function getProviders() {
  if ("serviceWorker" in navigator) {
    const myAssetUrl = new URL('/mantalon-sw.js', import.meta.url).href;
    console.log(myAssetUrl);

    navigator.serviceWorker
      .register(myAssetUrl, { scope: "/mantalon" }).then(
      (registration) => {
        console.log("Service worker registration succeeded:", registration);
        registration.active?.postMessage({
          type: "PROXY_URL",
          url: getLoadbalancedProxyUrl(),
        });
      },
      (error) => {
        console.error(`Service worker registration failed: ${error}`);
      },
    );
    return makeProviders({
      fetcher: makeStandardFetcher(fetch),
      proxiedFetcher: makeMantalonFetcher(),
      target: targets.ANY,
      consistentIpForRequests: true,
    });
  }

  if (isExtensionActiveCached()) {
    return makeProviders({
      fetcher: makeStandardFetcher(fetch),
      proxiedFetcher: makeExtensionFetcher(),
      target: targets.BROWSER_EXTENSION,
      consistentIpForRequests: true,
    });
  }

  return makeProviders({
    fetcher: makeStandardFetcher(fetch),
    //proxiedFetcher: makeLoadBalancedSimpleProxyFetcher(),
    target: targets.BROWSER,
  });
}

export function getAllProviders() {
  return makeProviders({
    fetcher: makeStandardFetcher(fetch),
    target: targets.ANY,
    consistentIpForRequests: true
  });
}
