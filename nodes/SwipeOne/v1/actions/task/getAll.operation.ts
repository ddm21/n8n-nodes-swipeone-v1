import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest, apiRequestAllItemsPages } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Scope',
    name: 'scope',
    type: 'options',
    options: [
      { name: 'All Workspace Tasks', value: 'workspace' },
      { name: 'Contact Tasks', value: 'contact' },
    ],
    default: 'workspace',
    displayOptions: { show: { resource: ['task'], operation: ['getAll'] } },
  },
  {
    displayName: 'Contact',
    name: 'contactId',
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    required: true,
    displayOptions: { show: { resource: ['task'], operation: ['getAll'], scope: ['contact'] } },
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
    displayOptions: { show: { resource: ['task'], operation: ['getAll'] } },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
				description: 'Max number of results to return',
    default: 50,
    typeOptions: { minValue: 1 },
    displayOptions: { show: { resource: ['task'], operation: ['getAll'], returnAll: [false] } },
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
      const scope = this.getNodeParameter('scope', i) as string;
      const returnAll = this.getNodeParameter('returnAll', i) as boolean;
      const qs: IDataObject = {};

      let endpoint: string;
      if (scope === 'contact') {
        const contactId = this.getNodeParameter('contactId', i, undefined, { extractValue: true }) as string;
        endpoint = `/workspaces/${workspaceId}/contacts/${contactId}/tasks`;
      } else {
        endpoint = `/workspaces/${workspaceId}/tasks`;
      }

      let responseData: IDataObject[];
      if (returnAll) {
        responseData = await apiRequestAllItemsPages.call(this, 'GET', endpoint, {}, qs, 'tasks');
      } else {
        const limit = this.getNodeParameter('limit', i) as number;
        qs.limit = limit;
        qs.page = 1;
        const response = await apiRequest.call(this, 'GET', endpoint, {}, qs);
        const data = response?.data ?? response ?? {};
        responseData = (data.tasks ?? data ?? []) as IDataObject[];
        if (!Array.isArray(responseData)) responseData = [];
        responseData = responseData.slice(0, limit);
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
