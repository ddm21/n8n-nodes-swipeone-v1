import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest, apiRequestAllItemsCursor } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    description: 'Whether to return all results or only up to a given limit',
    displayOptions: { show: { resource: ['contact'], operation: ['getAll'] } },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
				description: 'Max number of results to return',
    default: 50,
    typeOptions: { minValue: 1 },
    displayOptions: { show: { resource: ['contact'], operation: ['getAll'], returnAll: [false] } },
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['contact'], operation: ['getAll'] } },
    options: [
      { displayName: 'Search Text', name: 'searchText', type: 'string', default: '' },
      {
        displayName: 'Sort Field',
        name: 'sort',
        type: 'string',
        default: '',
        description: 'Field name to sort by',
      },
      {
        displayName: 'Sort Order',
        name: 'order',
        type: 'options',
        options: [
          { name: 'Ascending', value: 1 },
          { name: 'Descending', value: -1 },
        ],
        default: -1,
      },
    ],
  },
];

export async function execute(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];
  const credentials = await this.getCredentials('swipeOneApi');
  const workspaceId = credentials.workspaceId as string;

  for (let i = 0; i < items.length; i++) {
    try {
      const returnAll = this.getNodeParameter('returnAll', i) as boolean;
      const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
      const qs: IDataObject = { ...additionalFields };

      let responseData: IDataObject[];

      if (returnAll) {
        responseData = await apiRequestAllItemsCursor.call(
          this,
          'GET',
          `/workspaces/${workspaceId}/contacts`,
          {},
          qs,
          'contacts',
        );
      } else {
        qs.limit = this.getNodeParameter('limit', i) as number;
        const response = await apiRequest.call(
          this,
          'GET',
          `/workspaces/${workspaceId}/contacts`,
          {},
          qs,
        );
        responseData = response?.data?.contacts ?? response?.data ?? [];
      }

      returnData.push(
        ...this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(responseData), {
          itemData: { item: i },
        }),
      );
    } catch (error) {
      if (this.continueOnFail()) {
        returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
        continue;
      }
      throw new NodeApiError(this.getNode(), error as JsonObject);
    }
  }
  return returnData;
}
