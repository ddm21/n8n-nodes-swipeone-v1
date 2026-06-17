import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Pipeline Name or ID',
    name: 'pipelineId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getWorkspacePipelines' },
    required: true,
    default: '',
    description: 'The pipeline to create the deal in. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: { show: { resource: ['deal'], operation: ['create'] } },
  },
  {
    displayName: 'Stage Name or ID',
    name: 'stageId',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getPipelineStages',
      loadOptionsDependsOn: ['pipelineId'],
    },
    required: true,
    default: '',
    description: 'The stage to place the deal in. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: { show: { resource: ['deal'], operation: ['create'] } },
  },
  {
    displayName: 'Deal Name',
    name: 'name',
    type: 'string',
    required: true,
    default: '',
    displayOptions: { show: { resource: ['deal'], operation: ['create'] } },
  },
  {
    displayName: 'Contact',
    name: 'contactId',
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    required: true,
    description: 'The contact to associate with this deal',
    displayOptions: { show: { resource: ['deal'], operation: ['create'] } },
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
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['deal'], operation: ['create'] } },
    options: [
      {
        displayName: 'Value',
        name: 'value',
        type: 'number',
        default: 0,
        description: 'The monetary value of the deal',
      },
      {
        displayName: 'Expected Close Date',
        name: 'expectedCloseDate',
        type: 'dateTime',
        default: '',
      },
      {
        displayName: 'Owner Name or ID',
        name: 'ownerId',
        type: 'options',
								description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
        typeOptions: { loadOptionsMethod: 'getWorkspaceUsers' },
        default: '',
      },
      {
        displayName: 'Priority',
        name: 'priority',
        type: 'options',
        options: [
          { name: 'None', value: 0 },
          { name: 'Low', value: 1 },
          { name: 'Medium', value: 2 },
          { name: 'High', value: 3 },
        ],
        default: 0,
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
      const stageId = this.getNodeParameter('stageId', i) as string;
      const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

      const body: IDataObject = {
        name: this.getNodeParameter('name', i) as string,
        contactId: this.getNodeParameter('contactId', i, undefined, { extractValue: true }) as string,
        ...additionalFields,
      };

      const responseData = await apiRequest.call(
        this,
        'POST',
        `/stages/${stageId}/deals`,
        body,
      );

      returnData.push(
        ...this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(responseData?.data?.deal ?? responseData),
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
