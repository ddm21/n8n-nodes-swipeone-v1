import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest } from '../../transport';
import { COLOR_OPTIONS, resolveColor } from '../../colors';

export const description: INodeProperties[] = [
  {
    displayName: 'Label',
    name: 'label',
    type: 'string',
    required: true,
    default: '',
    displayOptions: { show: { resource: ['tag'], operation: ['create'] } },
  },
  {
    displayName: 'Color',
    name: 'color',
    type: 'options',
    required: true,
    options: COLOR_OPTIONS,
    default: 'random',
    description: 'Color for the tag (Random picks a color automatically)',
    displayOptions: { show: { resource: ['tag'], operation: ['create'] } },
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
      const body: IDataObject = {
        label: this.getNodeParameter('label', i) as string,
        color: resolveColor(this.getNodeParameter('color', i) as string),
      };

      const responseData = await apiRequest.call(
        this,
        'POST',
        `/workspaces/${workspaceId}/tags`,
        body,
      );

      returnData.push(
        ...this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(responseData?.data?.tag ?? responseData),
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
