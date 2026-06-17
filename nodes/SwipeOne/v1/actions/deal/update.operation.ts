import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Deal',
    name: 'dealId',
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    required: true,
    displayOptions: { show: { resource: ['deal'], operation: ['update'] } },
    modes: [
      {
        displayName: 'From List',
        name: 'list',
        type: 'list',
        typeOptions: { searchListMethod: 'searchDeals', searchable: true },
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
    displayName: 'Pipeline Name or ID',
    name: 'pipelineId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getWorkspacePipelines' },
    default: '',
    description: 'Select a pipeline to move the deal (also loads stages below). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: { show: { resource: ['deal'], operation: ['update'] } },
  },
  {
    displayName: 'Stage Name or ID',
    name: 'stageId',
    type: 'options',
    typeOptions: {
      loadOptionsMethod: 'getPipelineStagesForUpdate',
      loadOptionsDependsOn: ['pipelineId'],
    },
    default: '',
    description: 'Move the deal to a different stage. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: { show: { resource: ['deal'], operation: ['update'] } },
  },
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['deal'], operation: ['update'] } },
    options: [
      {
        displayName: 'Expected Close Date',
        name: 'expectedCloseDate',
        type: 'dateTime',
        default: '',
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
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
      {
        displayName: 'Value',
        name: 'value',
        type: 'number',
        default: 0,
        description: 'The monetary value of the deal',
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
      const dealId = this.getNodeParameter('dealId', i, undefined, { extractValue: true }) as string;
      const stageId = this.getNodeParameter('stageId', i) as string;
      const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

      // pipelineId is only used in the UI to load stages — don't send it
      // stageId is sent only if a value was selected
      if (stageId) {
        updateFields.stageId = stageId;
      }

      const responseData = await apiRequest.call(
        this,
        'PATCH',
        `/deals/${dealId}`,
        updateFields,
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
