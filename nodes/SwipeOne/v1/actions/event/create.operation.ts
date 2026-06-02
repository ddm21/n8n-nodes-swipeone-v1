import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Event Type Name or ID',
    name: 'type',
    type: 'options',
    required: true,
    default: '',
    description: 'Select the event definition to fire. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    typeOptions: { loadOptionsMethod: 'getEventDefinitions' },
    displayOptions: { show: { resource: ['event'], operation: ['create'] } },
  },
  {
    displayName: 'Contact',
    name: 'contactIdentifier',
    type: 'options',
    options: [
      { name: 'By Contact ID', value: 'id' },
      { name: 'By Email', value: 'email' },
    ],
    default: 'id',
    displayOptions: { show: { resource: ['event'], operation: ['create'] } },
  },
  {
    displayName: 'Contact',
    name: 'contactId',
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    displayOptions: {
      show: { resource: ['event'], operation: ['create'], contactIdentifier: ['id'] },
    },
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
    displayName: 'Contact Email',
    name: 'contactEmail',
    type: 'string',
    placeholder: 'name@email.com',
    default: '',
    displayOptions: {
      show: { resource: ['event'], operation: ['create'], contactIdentifier: ['email'] },
    },
  },
  {
    displayName: 'Event Properties',
    name: 'eventProperties',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true },
    default: {},
    placeholder: 'Add Property',
    description: 'Properties to include with this event. The available properties are defined in the event definition.',
    displayOptions: { show: { resource: ['event'], operation: ['create'] } },
    options: [
      {
        name: 'propertyValues',
        displayName: 'Property',
        values: [
          {
            displayName: 'Property Name or ID',
            name: 'name',
            type: 'options',
            default: '',
            description: 'Select the event property to set. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
            typeOptions: {
              loadOptionsMethod: 'getEventProperties',
              loadOptionsDependsOn: ['type'],
            },
          },
          {
            displayName: 'Value',
            name: 'value',
            type: 'string',
            default: '',
            description: 'Value for this property. For select/multiselect options, use the "Get Event Definitions" operation to see all valid values.',
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
      const contactIdentifier = this.getNodeParameter('contactIdentifier', i) as string;
      const contact: IDataObject = {};
      if (contactIdentifier === 'id') {
        contact.id = this.getNodeParameter('contactId', i, undefined, { extractValue: true }) as string;
      } else {
        contact.email = this.getNodeParameter('contactEmail', i) as string;
      }

      // Build properties object from the fixedCollection
      const eventPropertiesRaw = this.getNodeParameter('eventProperties', i, {}) as IDataObject;
      const propertyValues = (eventPropertiesRaw.propertyValues as IDataObject[]) ?? [];
      const properties: IDataObject = {};
      for (const prop of propertyValues) {
        if (prop.name) {
          properties[prop.name as string] = prop.value;
        }
      }

      const body: IDataObject = {
        type: this.getNodeParameter('type', i) as string,
        contact,
      };

      if (Object.keys(properties).length > 0) {
        body.properties = properties;
      }

      const responseData = await apiRequest.call(
        this,
        'POST',
        `/workspaces/${workspaceId}/events`,
        body,
      );

      returnData.push(
        ...this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(responseData?.data ?? { accepted: true }),
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
