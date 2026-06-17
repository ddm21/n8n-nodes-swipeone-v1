import type { IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Contact Property Name or ID',
    name: 'contactPropertyId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getContactPropertiesById' },
    required: true,
    default: '',
    description: 'Select a contact property to retrieve. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: { show: { resource: ['contactProperty'], operation: ['get'] } },
  },
];

export async function execute(
  this: IExecuteFunctions,
  items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    try {
      const contactPropertyId = this.getNodeParameter('contactPropertyId', i) as string;
      const responseData = await apiRequest.call(
        this,
        'GET',
        `/contact-properties/${contactPropertyId}`,
      );

      returnData.push(
        ...this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(
            responseData?.data?.contactProperty ?? responseData?.data ?? responseData,
          ),
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
