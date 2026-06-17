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
    description: 'The human-readable label for the contact property',
    displayOptions: { show: { resource: ['contactProperty'], operation: ['create'] } },
  },
  {
    displayName: 'Field Type',
    name: 'fieldType',
    type: 'options',
    required: true,
    options: [
      { name: 'Address', value: 'address' },
      { name: 'Country', value: 'country' },
      { name: 'Date', value: 'date' },
      { name: 'Email', value: 'email' },
      { name: 'Multi-Select', value: 'multiselect' },
      { name: 'Number', value: 'number' },
      { name: 'Person', value: 'person' },
      { name: 'Phone', value: 'phone' },
      { name: 'Select', value: 'select' },
      { name: 'Text', value: 'text' },
      { name: 'URL', value: 'url' },
    ],
    default: 'text',
    displayOptions: { show: { resource: ['contactProperty'], operation: ['create'] } },
  },

  // --- Options for Select / Multi-Select ---
  {
    displayName: 'Options',
    name: 'selectOptions',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true },
    default: {},
    placeholder: 'Add Option',
    description: 'Options for the select or multi-select property',
    displayOptions: {
      show: { resource: ['contactProperty'], operation: ['create'], fieldType: ['select', 'multiselect'] },
    },
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

  // --- Number Format (only when fieldType = number) ---
  {
    displayName: 'Number Format',
    name: 'numberFormat',
    type: 'options',
    options: [
      { name: 'Number', value: 'number' },
      { name: 'Comma', value: 'comma' },
      { name: 'Percentage', value: 'percentage' },
      { name: 'Currency', value: 'currency' },
    ],
    default: 'number',
    displayOptions: {
      show: { resource: ['contactProperty'], operation: ['create'], fieldType: ['number'] },
    },
  },
  {
    displayName: 'Currency',
    name: 'currency',
    type: 'string',
    default: 'USD',
    description: 'Currency code (e.g. USD, EUR)',
    displayOptions: {
      show: { resource: ['contactProperty'], operation: ['create'], fieldType: ['number'], numberFormat: ['currency'] },
    },
  },

  // --- Date fields (only when fieldType = date) ---
  {
    displayName: 'Date Format',
    name: 'dateFormat',
    type: 'options',
    required: true,
    options: [
      { name: 'MMM Dd, Yyyy', value: 'MMM dd, yyyy' },
      { name: 'dd/MM/yyyy', value: 'dd/MM/yyyy' },
      { name: 'MM/dd/yyyy', value: 'MM/dd/yyyy' },
    ],
    default: 'MMM dd, yyyy',
    displayOptions: {
      show: { resource: ['contactProperty'], operation: ['create'], fieldType: ['date'] },
    },
  },
  {
    displayName: 'Include Time',
    name: 'includeTime',
    type: 'boolean',
    default: false,
    displayOptions: {
      show: { resource: ['contactProperty'], operation: ['create'], fieldType: ['date'] },
    },
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
      const fieldType = this.getNodeParameter('fieldType', i) as string;
      const body: IDataObject = {
        label: this.getNodeParameter('label', i) as string,
        fieldType,
      };

      // Select / Multi-Select: build options array
      if (fieldType === 'select' || fieldType === 'multiselect') {
        const selectOptions = this.getNodeParameter('selectOptions', i, {}) as IDataObject;
        const optionValues = (selectOptions.optionValues as IDataObject[]) ?? [];
        if (optionValues.length > 0) {
          body.options = optionValues.map((opt) => ({
            label: opt.label,
            color: resolveColor(opt.color as string),
          }));
        }
      }

      // Number: format & currency
      if (fieldType === 'number') {
        const numberFormat = this.getNodeParameter('numberFormat', i, 'number') as string;
        body.numberFormat = numberFormat;
        if (numberFormat === 'currency') {
          body.currency = this.getNodeParameter('currency', i, 'USD') as string;
        }
      }

      // Date: format & include time
      if (fieldType === 'date') {
        body.dateFormat = this.getNodeParameter('dateFormat', i) as string;
        body.includeTime = this.getNodeParameter('includeTime', i, false) as boolean;
      }

      // Address: API requires all address fields
      if (fieldType === 'address') {
        body.addressFields = {
          line1: true,
          line2: true,
          city: true,
          state: true,
          country: true,
          zipcode: true,
        };
      }

      const responseData = await apiRequest.call(
        this,
        'POST',
        `/workspaces/${workspaceId}/contact-properties`,
        body,
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
