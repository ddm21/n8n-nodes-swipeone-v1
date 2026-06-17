import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Filter',
    name: 'filter',
    type: 'options',
    options: [
      { name: 'All Event Definitions', value: 'all' },
      { name: 'Specific Event', value: 'specific' },
    ],
    default: 'all',
    description: 'Return all event definitions or filter by a specific event',
    displayOptions: { show: { resource: ['event'], operation: ['getDefinitions'] } },
  },
  {
    displayName: 'Event Name or ID',
    name: 'eventType',
    type: 'options',
    default: '',
    required: true,
    description: 'Select the event definition to retrieve. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    typeOptions: { loadOptionsMethod: 'getEventDefinitions' },
    displayOptions: { show: { resource: ['event'], operation: ['getDefinitions'], filter: ['specific'] } },
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
      const response = await apiRequest.call(
        this,
        'GET',
        `/workspaces/${workspaceId}/event-definitions`,
      );
      const definitions: IDataObject[] = response?.data?.eventDefinitions ?? response?.data ?? [];

      const filter = this.getNodeParameter('filter', i) as string;
      let results: IDataObject[];

      if (filter === 'specific') {
        const eventType = this.getNodeParameter('eventType', i) as string;
        const match = definitions.find((d) => d.name === eventType);
        results = match ? [match] : [];
      } else {
        results = definitions;
      }

      returnData.push(
        ...this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(results),
          { itemData: { item: i } },
        ),
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
