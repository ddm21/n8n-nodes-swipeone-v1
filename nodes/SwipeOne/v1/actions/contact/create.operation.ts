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
            // This is a value picker, not an ID picker — the standard "Names or IDs"
            // naming / "Choose from the list…" description rules don't fit, so they're
            // disabled here intentionally.
            // eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-multi-options
            displayName: 'Value',
            name: 'value',
            type: 'multiOptions',
            typeOptions: {
              loadOptionsMethod: 'getContactPropertyValues',
              loadOptionsDependsOn: ['&name'],
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

  // Fetch property field types once so we can shape each value correctly:
  // multiselect → always an array; everything else → scalar.
  const fieldTypeByName: Record<string, string> = {};
  try {
    const propsResponse = await apiRequest.call(
      this,
      'GET',
      `/workspaces/${workspaceId}/contact-properties`,
    );
    const props = propsResponse?.data?.contactProperties ?? propsResponse?.data ?? [];
    for (const p of props as Array<{ name: string; fieldType?: string }>) {
      if (p.name && p.fieldType) fieldTypeByName[p.name] = p.fieldType;
    }
  } catch {
    // Non-fatal: without field types we fall back to length-based shaping below.
  }

  for (let i = 0; i < items.length; i++) {
    try {
      const firstName = this.getNodeParameter('firstName', i) as string;
      const lastName = this.getNodeParameter('lastName', i) as string;
      const email = this.getNodeParameter('email', i) as string;
      const additionalProperties = this.getNodeParameter('additionalProperties', i, {}) as {
        property?: Array<{ name: string; value: string | string[] }>;
      };

      const body: IDataObject = {};
      if (firstName) body.firstName = firstName;
      if (lastName) body.lastName = lastName;
      if (email) body.email = email;

      if (additionalProperties.property) {
        // The Value field is multiOptions → value is an array of chosen labels
        // (or a string when the user switched to Expression). Collect all values
        // per property name across rows, then shape by field type.
        const grouped: Record<string, string[]> = {};
        for (const prop of additionalProperties.property) {
          if (!prop.name) continue;
          const vals = Array.isArray(prop.value)
            ? prop.value
            : prop.value === '' || prop.value === undefined
              ? []
              : [prop.value];
          (grouped[prop.name] ??= []).push(...vals);
        }
        for (const [key, vals] of Object.entries(grouped)) {
          const plainKey = key.replace(/^customProperties\./, '');
          const fieldType = fieldTypeByName[plainKey];
          if (fieldType === 'multiselect') {
            // Multi-select → always an array, even for a single chosen value.
            body[key] = vals;
          } else if (fieldType && fieldType !== 'multiselect') {
            // Known non-multi (single-select, text, etc.) → scalar. If the user
            // over-picked multiple chips on a single-select, send only the first.
            body[key] = vals[0];
          } else {
            // Unknown type (field type lookup failed) → best-effort: array if many.
            body[key] = vals.length > 1 ? vals : vals[0];
          }
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
