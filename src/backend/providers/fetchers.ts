import { Fetcher, makeSimpleProxyFetcher, makeStandardFetcher } from "@movie-web/providers";

import { sendExtensionRequest } from "@/backend/extension/messaging";
import { getApiToken, setApiToken } from "@/backend/helpers/providerApi";
import { getProviderApiUrls, getProxyUrls } from "@/utils/proxyUrls";

import { convertBodyToObject, getBodyTypeFromBody } from "../extension/request";

function makeLoadbalancedList(getter: () => string[]) {
  let listIndex = -1;
  return () => {
    const fetchers = getter();
    if (listIndex === -1 || listIndex >= fetchers.length) {
      listIndex = Math.floor(Math.random() * fetchers.length);
    }
    const proxyUrl = fetchers[listIndex];
    listIndex = (listIndex + 1) % fetchers.length;
    return proxyUrl;
  };
}

export const getLoadbalancedProxyUrl = makeLoadbalancedList(getProxyUrls);
export const getLoadbalancedProviderApiUrl =
  makeLoadbalancedList(getProviderApiUrls);

async function fetchButWithApiTokens(
  input: RequestInfo | URL,
  init?: RequestInit | undefined,
): Promise<Response> {
  const apiToken = await getApiToken();
  const headers = new Headers(init?.headers);
  if (apiToken) headers.set("X-Token", apiToken);
  const response = await fetch(
    input,
    init
      ? {
          ...init,
          headers,
        }
      : undefined,
  );
  const newApiToken = response.headers.get("X-Token");
  if (newApiToken) setApiToken(newApiToken);
  return response;
}

export function makeLoadBalancedSimpleProxyFetcher() {
  const fetcher: Fetcher = async (a, b) => {
    const currentFetcher = makeSimpleProxyFetcher(
      getLoadbalancedProxyUrl(),
      fetchButWithApiTokens,
    );
    return currentFetcher(a, b);
  };
  return fetcher;
}

// The maps need to be copied to src/sw.js

const headerMap: Record<string, string> = {
  cookie: 'X-Cookie',
  referer: 'X-Referer',
  origin: 'X-Origin',
  'user-agent': 'X-User-Agent',
  'x-real-ip': 'X-X-Real-Ip',
};

const responseHeaderMap: Record<string, string> = {
  'x-set-cookie': 'Set-Cookie',
};

export type FetchOps = {
  headers: Record<string, string>;
  method: string;
  body: any;
  credentials?: 'include' | 'same-origin' | 'omit';
};

export type FetchHeaders = {
  get(key: string): string | null;
  set(key: string, value: string): void;
};

export type FetchReply = {
  text(): Promise<string>;
  json(): Promise<any>;
  extraHeaders?: FetchHeaders;
  extraUrl?: string;
  headers: FetchHeaders;
  url: string;
  status: number;
};

export type FetchLike = (url: string, ops?: FetchOps | undefined) => Promise<FetchReply>;
export type FullUrlOptions = Pick<FetcherOptions, 'query' | 'baseUrl'>;
export type FetcherOptions = {
  baseUrl?: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  method?: 'HEAD' | 'GET' | 'POST';
  readHeaders?: string[];
  body?: Record<string, any> | string | FormData | URLSearchParams;
  credentials?: 'include' | 'same-origin' | 'omit';
};


// make url with query params and base url used correctly
export function makeFullUrl(url: string, ops?: FullUrlOptions): string {
  // glue baseUrl and rest of url together
  let leftSide = ops?.baseUrl ?? '';
  let rightSide = url;

  // left side should always end with slash, if its set
  if (leftSide.length > 0 && !leftSide.endsWith('/')) leftSide += '/';

  // right side should never start with slash
  if (rightSide.startsWith('/')) rightSide = rightSide.slice(1);

  const fullUrl = leftSide + rightSide;

  // we need the data scheme for base64 encoded hls playlists
  // this is for playlists that themselves have cors but not their parts
  // this allows us to proxy them, encode them into base64 and then fetch the parts normally
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://') && !fullUrl.startsWith('data:'))
    throw new Error(`Invald URL -- URL doesn't start with a http scheme: '${fullUrl}'`);

  const parsedUrl = new URL(fullUrl);
  Object.entries(ops?.query ?? {}).forEach(([k, v]) => {
    parsedUrl.searchParams.set(k, v);
  });

  return parsedUrl.toString();
}

// Heavily inspired from the SimpleProxyFetch
export function makeMantalonFetcher(): Fetcher {
  const proxiedFetch: Fetcher = async (url, ops) => {

    const fetcher = makeStandardFetcher(async (a, b) => {
      const res: FetchReply = await fetchButWithApiTokens(a, b);

      // set extra headers that cant normally be accessed
      res.extraHeaders = new Headers();
      Object.entries(responseHeaderMap).forEach((entry) => {
        const value = res.headers.get(entry[0]);
        if (!value) return;
        res.extraHeaders?.set(entry[1].toLowerCase(), value);
      });

      // set correct final url
      res.extraUrl = res.headers.get('X-Final-Destination') ?? res.url;
      return res;
    });

    const fullUrl = makeFullUrl(url, ops);

    const headerEntries = Object.entries(ops.headers).map((entry) => {
      const key = entry[0].toLowerCase();
      if (headerMap[key]) return [headerMap[key], entry[1]];
      return entry;
    });

    return fetcher(fullUrl, {
      ...ops,
      query: {
        mantalon: "true",
      },
      headers: Object.fromEntries(headerEntries),
      baseUrl: undefined,
    });
  };

  return proxiedFetch;
}

function makeFinalHeaders(
  readHeaders: string[],
  headers: Record<string, string>,
): Headers {
  const lowercasedHeaders = readHeaders.map((v) => v.toLowerCase());
  return new Headers(
    Object.entries(headers).filter((entry) =>
      lowercasedHeaders.includes(entry[0].toLowerCase()),
    ),
  );
}

export function makeExtensionFetcher() {
  const fetcher: Fetcher = async (url, ops) => {
    const result = await sendExtensionRequest<any>({
      url,
      ...ops,
      body: convertBodyToObject(ops.body),
      bodyType: getBodyTypeFromBody(ops.body),
    });
    if (!result?.success) throw new Error(`extension error: ${result?.error}`);
    const res = result.response;
    return {
      body: res.body,
      finalUrl: res.finalUrl,
      statusCode: res.statusCode,
      headers: makeFinalHeaders(ops.readHeaders, res.headers),
    };
  };
  return fetcher;
}
