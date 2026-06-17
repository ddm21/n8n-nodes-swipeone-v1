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
            // This is a value picker, not an ID picker — the standard "Names or IDs"
            // naming / "Choose from the list…" description rules don't fit, so they're
            // disabled here intentionally.
            // eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-multi-options
            displayName: 'Value',
            name: 'value',
            type: 'multiOptions',
            typeOptions: {
              loadOptionsMethod: 'getEventPropertyValues',
              loadOptionsDependsOn: ['type', '&name'],
            },
            default: [],
            // eslint-disable-next-line n8n-nodes-base/node-param-description-wrong-for-dynamic-multi-options
            description:
              'Pick value(s) from the list. For a SINGLE-SELECT property, choose only ONE. For a MULTI-SELECT property, choose one or MORE. For text/number/date properties the list is empty — switch this field to Expression to type a value.',
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

  // Fetch event definitions once so we can shape each property value by its field
  // type: multiselect → always an array; everything else → scalar. Keyed by
  // "<eventType>:<propertyName>".
  const fieldTypeByKey: Record<string, string> = {};
  try {
    const defsResponse = await apiRequest.call(
      this,
      'GET',
      `/workspaces/${workspaceId}/event-definitions`,
    );
    const definitions = defsResponse?.data?.eventDefinitions ?? defsResponse?.data ?? [];
    for (const def of definitions as Array<{ name: string; properties?: Array<{ name: string; fieldType?: string }> }>) {
      for (const p of def.properties ?? []) {
        if (p.name && p.fieldType) fieldTypeByKey[`${def.name}:${p.name}`] = p.fieldType;
      }
    }
  } catch {
    // Non-fatal: without field types we fall back to length-based shaping below.
  }

  for (let i = 0; i < items.length; i++) {
    try {
      const eventType = this.getNodeParameter('type', i) as string;
      const contactIdentifier = this.getNodeParameter('contactIdentifier', i) as string;
      const contact: IDataObject = {};
      if (contactIdentifier === 'id') {
        contact.id = this.getNodeParameter('contactId', i, undefined, { extractValue: true }) as string;
      } else {
        contact.email = this.getNodeParameter('contactEmail', i) as string;
      }

      // Build properties object from the fixedCollection. The Value field is
      // multiOptions → an array of chosen labels (or a string if the user switched
      // to Expression). Collect all values per property across rows, then shape by
      // the event property's field type.
      const eventPropertiesRaw = this.getNodeParameter('eventProperties', i, {}) as IDataObject;
      const propertyValues = (eventPropertiesRaw.propertyValues as IDataObject[]) ?? [];
      const grouped: Record<string, string[]> = {};
      for (const prop of propertyValues) {
        if (!prop.name) continue;
        const raw = prop.value;
        const vals = Array.isArray(raw)
          ? (raw as string[])
          : raw === '' || raw === undefined
            ? []
            : [raw as string];
        (grouped[prop.name as string] ??= []).push(...vals);
      }
      const properties: IDataObject = {};
      for (const [key, vals] of Object.entries(grouped)) {
        const fieldType = fieldTypeByKey[`${eventType}:${key}`];
        if (fieldType === 'multiselect') {
          properties[key] = vals;
        } else if (fieldType && fieldType !== 'multiselect') {
          properties[key] = vals[0];
        } else {
          properties[key] = vals.length > 1 ? vals : vals[0];
        }
      }

      const body: IDataObject = {
        type: eventType,
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
