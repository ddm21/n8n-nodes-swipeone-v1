import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest, apiRequestAllItemsPages } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Contact',
    name: 'contactId',
    type: 'resourceLocator',
    required: true,
    default: { mode: 'list', value: '' },
    description: 'The contact whose events to fetch. Pick from the list (searchable by name/email) or pass a raw contact ID.',
    displayOptions: { show: { resource: ['event'], operation: ['getAll'] } },
    modes: [
      {
        displayName: 'From List',
        name: 'list',
        type: 'list',
        typeOptions: { searchListMethod: 'searchContacts', searchable: true },
      },
      {
        displayName: 'By ID',
        name: 'id',
        type: 'string',
        placeholder: 'e.g. 507f1f77bcf86cd799439011',
      },
    ],
  },
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    description: 'Whether to return all results or only up to a given limit',
    displayOptions: { show: { resource: ['event'], operation: ['getAll'] } },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
				description: 'Max number of results to return',
    default: 50,
    typeOptions: { minValue: 1 },
    displayOptions: { show: { resource: ['event'], operation: ['getAll'], returnAll: [false] } },
  },
];

export async function execute(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    try {
      const contactId = this.getNodeParameter('contactId', i, undefined, { extractValue: true }) as string;
      const returnAll = this.getNodeParameter('returnAll', i) as boolean;
      const qs: IDataObject = {};

      let responseData: IDataObject[];
      if (returnAll) {
        responseData = await apiRequestAllItemsPages.call(
          this,
          'GET',
          `/contacts/${contactId}/events`,
          {},
          qs,
          'events',
        );
      } else {
        qs.limit = this.getNodeParameter('limit', i) as number;
        const response = await apiRequest.call(
          this,
          'GET',
          `/contacts/${contactId}/events`,
          {},
          qs,
        );
        responseData = response?.data?.events ?? response?.data ?? [];
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
