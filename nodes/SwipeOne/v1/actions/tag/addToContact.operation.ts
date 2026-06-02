import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Contact ID',
    name: 'contactId',
    type: 'string',
    required: true,
    default: '',
    displayOptions: { show: { resource: ['tag'], operation: ['addToContact'] } },
  },
  {
    displayName: 'Tags',
    name: 'tags',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true },
    required: true,
    default: {},
    description: 'This REPLACES all existing tags on the contact — it does not append. To create new tags, use the "Create" operation first.',
    displayOptions: { show: { resource: ['tag'], operation: ['addToContact'] } },
    options: [
      {
        name: 'tag',
        displayName: 'Tag',
        values: [
          {
            displayName: 'Tag Name or ID',
            name: 'tagName',
            type: 'options',
            typeOptions: { loadOptionsMethod: 'getWorkspaceTags' },
            default: '',
            description: 'Select an existing tag to add to the contact. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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

  for (let i = 0; i < items.length; i++) {
    try {
      const contactId = this.getNodeParameter('contactId', i) as string;
      const tagsRaw = this.getNodeParameter('tags', i) as IDataObject;
      const tagItems = (tagsRaw.tag as IDataObject[]) ?? [];

      const tags = tagItems.map((t) => t.tagName as string);

      const responseData = await apiRequest.call(
        this,
        'POST',
        `/contacts/${contactId}/tags`,
        { tags },
      );

      returnData.push(
        ...this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(responseData?.data ?? responseData),
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
