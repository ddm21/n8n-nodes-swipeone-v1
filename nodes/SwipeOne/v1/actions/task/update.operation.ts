import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Task',
    name: 'taskId',
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    required: true,
    displayOptions: { show: { resource: ['task'], operation: ['update'] } },
    modes: [
      {
        displayName: 'From List',
        name: 'list',
        type: 'list',
        typeOptions: { searchListMethod: 'searchTasks', searchable: true },
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
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['task'], operation: ['update'] } },
    options: [
      {
        displayName: 'Assigned To Name or ID',
        name: 'assignedTo',
        type: 'options',
        typeOptions: { loadOptionsMethod: 'getWorkspaceUsers' },
        default: '',
        description: 'The workspace user to assign this task to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
      },
      { displayName: 'Due Date', name: 'dueDate', type: 'dateTime', default: '' },
      { displayName: 'Name', name: 'name', type: 'string', default: '' },
      { displayName: 'Reminder', name: 'reminder', type: 'dateTime', default: '' },
      {
        displayName: 'Status',
        name: 'status',
        type: 'options',
        options: [
          { name: 'Not Started', value: 'not_started' },
          { name: 'In Progress', value: 'in_progress' },
          { name: 'Completed', value: 'completed' },
        ],
        default: 'not_started',
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
      const taskId = this.getNodeParameter('taskId', i, undefined, { extractValue: true }) as string;
      const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;

      const responseData = await apiRequest.call(this, 'PATCH', `/tasks/${taskId}`, updateFields);

      returnData.push(
        ...this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(responseData?.data?.task ?? responseData),
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
