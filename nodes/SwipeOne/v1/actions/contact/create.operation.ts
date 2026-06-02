import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'First Name',
    name: 'firstName',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['contact'], operation: ['create'] } },
    description: 'At least one of First Name, Full Name, or Email is required',
  },
  {
    displayName: 'Last Name',
    name: 'lastName',
    type: 'string',
    default: '',
    displayOptions: { show: { resource: ['contact'], operation: ['create'] } },
  },
  {
    displayName: 'Email',
    name: 'email',
    type: 'string',
    placeholder: 'name@email.com',
    default: '',
    displayOptions: { show: { resource: ['contact'], operation: ['create'] } },
  },
  {
    displayName: 'Additional Properties',
    name: 'additionalProperties',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true },
    placeholder: 'Add Property',
    default: {},
    displayOptions: { show: { resource: ['contact'], operation: ['create'] } },
    description: 'Set additional contact properties from your workspace',
    options: [
      {
        displayName: 'Property',
        name: 'property',
        values: [
          {
            displayName: 'Property Name or ID',
            name: 'name',
            type: 'options',
            typeOptions: { loadOptionsMethod: 'getContactProperties' },
            default: '',
            description: 'Choose from your workspace\'s contact properties. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
          },
          {
            displayName: 'Value',
            name: 'value',
            type: 'string',
            default: '',
            description: 'Value to set for this property',
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
      const firstName = this.getNodeParameter('firstName', i) as string;
      const lastName = this.getNodeParameter('lastName', i) as string;
      const email = this.getNodeParameter('email', i) as string;
      const additionalProperties = this.getNodeParameter('additionalProperties', i, {}) as {
        property?: Array<{ name: string; value: string }>;
      };

      const body: IDataObject = {};
      if (firstName) body.firstName = firstName;
      if (lastName) body.lastName = lastName;
      if (email) body.email = email;

      if (additionalProperties.property) {
        for (const prop of additionalProperties.property) {
          body[prop.name] = prop.value;
        }
      }

      const responseData = await apiRequest.call(
        this,
        'POST',
        `/workspaces/${workspaceId}/contacts`,
        body,
      );

      returnData.push(
        ...this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(responseData?.data?.contact ?? responseData),
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
