import {
  makeProviders,
  makeStandardFetcher,
  targets,
} from "@movie-web/providers";

import { isExtensionActiveCached } from "@/backend/extension/messaging";
import {
  makeExtensionFetcher,
  makeLoadBalancedSimpleProxyFetcher,
  makeMantalonFetcher,
} from "@/backend/providers/fetchers";

export function getProviders() {
  if ('serviceWorker' in navigator) {
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
    proxiedFetcher: makeMantalonFetcher(),
    target: targets.ANY,
    consistentIpForRequests: true,
  });
}

export function getAllProviders() {
  return makeProviders({
    fetcher: makeStandardFetcher(fetch),
    externalSources: "all",
    target: targets.ANY,
    consistentIpForRequests: true
  });
}
