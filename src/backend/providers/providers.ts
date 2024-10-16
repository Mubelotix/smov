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
  // TODO
  // if (isExtensionActiveCached()) {
  //   return makeProviders({
  //     fetcher: makeStandardFetcher(fetch),
  //     proxiedFetcher: makeExtensionFetcher(),
  //     target: targets.BROWSER_EXTENSION,
  //     consistentIpForRequests: true,
  //   });
  // }

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
    target: targets.ANY,
    consistentIpForRequests: true
  });
}
