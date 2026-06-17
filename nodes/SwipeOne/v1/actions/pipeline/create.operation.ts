import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest } from '../../transport';
import { resolveColor } from '../../colors';

export const description: INodeProperties[] = [
  {
    displayName: 'Pipeline Name',
    name: 'name',
    type: 'string',
    required: true,
    default: '',
    displayOptions: { show: { resource: ['pipeline'], operation: ['create'] } },
  },
  {
    displayName: 'Currency',
    name: 'currency',
    type: 'string',
    required: true,
    default: 'USD',
    description: 'ISO 4217 currency code (e.g. USD, EUR, INR)',
    displayOptions: { show: { resource: ['pipeline'], operation: ['create'] } },
  },
  {
    displayName: 'Stages',
    name: 'stages',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true },
    required: true,
    default: { stageValues: [{ name: 'New Lead', color: 'blue' }] },
    displayOptions: { show: { resource: ['pipeline'], operation: ['create'] } },
    options: [
      {
        name: 'stageValues',
        displayName: 'Stage',
        values: [
          {
            displayName: 'Name',
            name: 'name',
            type: 'string',
            required: true,
            default: '',
          },
          {
            displayName: 'Color',
            name: 'color',
            type: 'options',
            options: [
              { name: 'Amber', value: 'amber' },
              { name: 'Blue', value: 'blue' },
              { name: 'Bronze', value: 'bronze' },
              { name: 'Brown', value: 'brown' },
              { name: 'Crimson', value: 'crimson' },
              { name: 'Cyan', value: 'cyan' },
              { name: 'Gold', value: 'gold' },
              { name: 'Grass', value: 'grass' },
              { name: 'Gray', value: 'gray' },
              { name: 'Green', value: 'green' },
              { name: 'Indigo', value: 'indigo' },
              { name: 'Iris', value: 'iris' },
              { name: 'Jade', value: 'jade' },
              { name: 'Lime', value: 'lime' },
              { name: 'Mint', value: 'mint' },
              { name: 'Orange', value: 'orange' },
              { name: 'Pink', value: 'pink' },
              { name: 'Plum', value: 'plum' },
              { name: 'Purple', value: 'purple' },
              { name: 'Random', value: 'random' },
              { name: 'Red', value: 'red' },
              { name: 'Ruby', value: 'ruby' },
              { name: 'Sky', value: 'sky' },
              { name: 'Teal', value: 'teal' },
              { name: 'Tomato', value: 'tomato' },
              { name: 'Violet', value: 'violet' },
              { name: 'Yellow', value: 'yellow' },
            ],
            default: 'random',
          },
        ],
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
      const stagesRaw = this.getNodeParameter('stages', i) as IDataObject;
      const stageValues = (stagesRaw.stageValues as IDataObject[]) ?? [];

      const body: IDataObject = {
        name: this.getNodeParameter('name', i) as string,
        currency: this.getNodeParameter('currency', i) as string,
        stages: stageValues.map((s) => ({
          name: s.name,
          color: resolveColor(s.color as string),
        })),
      };

      const responseData = await apiRequest.call(
        this,
        'POST',
        `/workspaces/${workspaceId}/pipelines`,
        body,
      );

      returnData.push(
        ...this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(responseData?.data?.pipeline ?? responseData),
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
