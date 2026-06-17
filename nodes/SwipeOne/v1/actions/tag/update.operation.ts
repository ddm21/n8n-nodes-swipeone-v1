import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest } from '../../transport';
import { COLOR_OPTIONS, resolveColor } from '../../colors';

export const description: INodeProperties[] = [
  {
    displayName: 'Tag Name or ID',
    name: 'tagId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getWorkspaceTagsById' },
    required: true,
    default: '',
    description: 'Select a tag to update. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: { show: { resource: ['tag'], operation: ['update'] } },
  },
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['tag'], operation: ['update'] } },
    options: [
      { displayName: 'Label', name: 'label', type: 'string', default: '' },
      {
        displayName: 'Color',
        name: 'color',
        type: 'options',
        options: COLOR_OPTIONS,
        default: 'random',
        description: 'Color for the tag (Random picks a color automatically)',
      },
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
      const tagId = this.getNodeParameter('tagId', i) as string;
      const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
      if (updateFields.color) {
        updateFields.color = resolveColor(updateFields.color as string);
      }

      const responseData = await apiRequest.call(this, 'PATCH', `/tags/${tagId}`, updateFields);

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
