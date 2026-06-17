import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Segment Name or ID',
    name: 'segmentId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getWorkspaceSegmentsById' },
    required: true,
    default: '',
    description: 'Select a segment or use an expression to pass an ID. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: { show: { resource: ['segment'], operation: ['update'] } },
  },
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['segment'], operation: ['update'] } },
    options: [
      { displayName: 'Name', name: 'name', type: 'string', default: '' },
    ],
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
      const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

      const responseData = await apiRequest.call(
        this,
        'PATCH',
        `/segments/${segmentId}`,
        updateFields,
      );

      returnData.push(
        ...this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(responseData?.data?.segment ?? responseData),
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
