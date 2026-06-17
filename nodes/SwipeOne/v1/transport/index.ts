import type {
  IDataObject,
  IExecuteFunctions,
  IHookFunctions,
  IHttpRequestMethods,
  IHttpRequestOptions,
  ILoadOptionsFunctions,
  IPollFunctions,
} from 'n8n-workflow';

const BASE_URL = 'https://api.swipeone.com/api';

export async function apiRequest(
  this: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions | IHookFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
  query: IDataObject = {},
  uri?: string,
  option: IDataObject = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const options: IHttpRequestOptions = {
    method,
    url: uri ?? `${BASE_URL}${endpoint}`,
    body,
    qs: query,
    json: true,
  };
  if (Object.keys(option).length) Object.assign(options, option);
  if (!Object.keys(body).length) delete options.body;
  return await this.helpers.httpRequestWithAuthentication.call(this, 'swipeOneApi', options);
}

export async function apiRequestAllItemsCursor(
  this: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
  query: IDataObject = {},
  itemsKey = 'data',
): Promise<IDataObject[]> {
  const returnData: IDataObject[] = [];
  query.limit = query.limit ?? 100;
  let searchAfter: string | undefined;

  for (;;) {
    if (searchAfter) query.searchAfter = searchAfter;
    const responseData = await apiRequest.call(this, method, endpoint, body, query);
    const inner = responseData?.data ?? responseData ?? {};
    const items: IDataObject[] = inner[itemsKey] ?? inner ?? [];
    if (!Array.isArray(items)) break;
    returnData.push(...items);
    searchAfter = inner.searchAfter ?? responseData.searchAfter ?? responseData.meta?.searchAfter ?? undefined;
    if (!searchAfter || items.length < (query.limit as number)) break;
  }

  return returnData;
}

export async function apiRequestAllItemsPages(
  this: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions,
  method: IHttpRequestMethods,
  endpoint: string,
  body: IDataObject = {},
  query: IDataObject = {},
  itemsKey = 'data',
): Promise<IDataObject[]> {
  const returnData: IDataObject[] = [];
  query.limit = query.limit ?? 100;
  let page = 1;

  for (;;) {
    query.page = page;
    const responseData = await apiRequest.call(this, method, endpoint, body, query);
    const inner = responseData?.data ?? responseData ?? {};
    const items: IDataObject[] = inner[itemsKey] ?? inner ?? [];
    if (!Array.isArray(items)) break;
    returnData.push(...items);
    const total: number = inner.total ?? responseData.total ?? 0;
    const limit = query.limit as number;
    if (items.length < limit || (total > 0 && returnData.length >= total)) break;
    page++;
  }

  return returnData;
}
