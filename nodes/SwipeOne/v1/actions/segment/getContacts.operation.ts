import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest, apiRequestAllItemsCursor } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Segment Name or ID',
    name: 'segmentId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getWorkspaceSegmentsById' },
    required: true,
    default: '',
    description: 'Select a segment or use an expression to pass an ID. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: { show: { resource: ['segment'], operation: ['getContacts'] } },
  },
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    description: 'Whether to return all results or only up to a given limit',
    displayOptions: { show: { resource: ['segment'], operation: ['getContacts'] } },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
				description: 'Max number of results to return',
    default: 50,
    typeOptions: { minValue: 1 },
    displayOptions: {
      show: { resource: ['segment'], operation: ['getContacts'], returnAll: [false] },
    },
  },
];

export async function execute(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    try {
      const segmentId = this.getNodeParameter('segmentId', i) as string;
      const returnAll = this.getNodeParameter('returnAll', i) as boolean;
      const qs: IDataObject = {};

      let responseData: IDataObject[];
      if (returnAll) {
        responseData = await apiRequestAllItemsCursor.call(
          this,
          'GET',
          `/segments/${segmentId}/contacts`,
          {},
          qs,
          'contacts',
        );
      } else {
        qs.limit = this.getNodeParameter('limit', i) as number;
        const response = await apiRequest.call(
          this,
          'GET',
          `/segments/${segmentId}/contacts`,
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
