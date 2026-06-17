import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest } from '../../transport';
import { COLOR_OPTIONS, resolveColor } from '../../colors';

export const description: INodeProperties[] = [
  {
    displayName: 'Event Name',
    name: 'label',
    type: 'string',
    required: true,
    default: '',
    description: 'Display name for the event, e.g. "Page Viewed". The internal name is auto-generated.',
    displayOptions: { show: { resource: ['event'], operation: ['createDefinition'] } },
  },
  {
    displayName: 'Record Summary',
    name: 'recordSummary',
    type: 'boolean',
    required: true,
    default: false,
    description: 'Whether to show this event in the contact timeline summary',
    displayOptions: { show: { resource: ['event'], operation: ['createDefinition'] } },
  },
  {
    displayName: 'Properties',
    name: 'properties',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true },
    default: {},
    displayOptions: { show: { resource: ['event'], operation: ['createDefinition'] } },
    options: [
      {
        name: 'property',
        displayName: 'Property',
        values: [
          { displayName: 'Label', name: 'label', type: 'string', default: '' },
          {
            displayName: 'Field Type',
            name: 'fieldType',
            type: 'options',
            options: [
              { name: 'Date', value: 'date' },
              { name: 'Email', value: 'email' },
              { name: 'Multi-Select', value: 'multiselect' },
              { name: 'Number', value: 'number' },
              { name: 'Phone', value: 'phone' },
              { name: 'Select', value: 'select' },
              { name: 'Text', value: 'text' },
              { name: 'URL', value: 'url' },
            ],
            default: 'text',
          },
          {
            displayName: 'Options',
            name: 'selectOptions',
            type: 'fixedCollection',
            typeOptions: { multipleValues: true },
            default: {},
            placeholder: 'Add Option',
            description: 'Options for the select or multi-select field',
            displayOptions: { show: { fieldType: ['select', 'multiselect'] } },
            options: [
              {
                name: 'optionValues',
                displayName: 'Option',
                values: [
                  {
                    displayName: 'Label',
                    name: 'label',
                    type: 'string',
                    default: '',
                    required: true,
                    description: 'Display label for this option',
                  },
                  {
                    displayName: 'Color',
                    name: 'color',
                    type: 'options',
                    options: COLOR_OPTIONS,
                    default: 'random',
                    description: 'Color for this option (Random picks a color automatically)',
                  },
                ],
              },
            ],
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
      const label = this.getNodeParameter('label', i) as string;
      const name = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

      const propertiesRaw = this.getNodeParameter('properties', i) as IDataObject;
      const properties = ((propertiesRaw.property as IDataObject[]) ?? []).map((p) => {
        const prop: IDataObject = {
          label: p.label,
          name: (p.label as string).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
          fieldType: p.fieldType,
        };

        if (p.fieldType === 'select' || p.fieldType === 'multiselect') {
          const selectOptions = p.selectOptions as IDataObject | undefined;
          const optionValues = (selectOptions?.optionValues as IDataObject[]) ?? [];
          if (optionValues.length > 0) {
            prop.options = optionValues.map((opt) => ({
              label: opt.label,
              color: resolveColor(opt.color as string),
            }));
          }
        }

        return prop;
      });

      const body: IDataObject = {
        name,
        label,
        recordSummary: this.getNodeParameter('recordSummary', i) as boolean,
        properties,
      };

      // API key is passed via x-api-key header (handled by credentials) — NOT as query param
      const responseData = await apiRequest.call(
        this,
        'POST',
        `/workspaces/${workspaceId}/event-definitions`,
        body,
      );

      returnData.push(
        ...this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(responseData?.data?.eventDefinition ?? responseData?.data ?? responseData),
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
