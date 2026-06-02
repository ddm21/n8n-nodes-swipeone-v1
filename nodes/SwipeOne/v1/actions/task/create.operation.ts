import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Task Name',
    name: 'name',
    type: 'string',
    required: true,
    default: '',
    displayOptions: { show: { resource: ['task'], operation: ['create'] } },
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['task'], operation: ['create'] } },
    options: [
      {
        displayName: 'Assigned To Name or ID',
        name: 'assignedTo',
        type: 'options',
        typeOptions: { loadOptionsMethod: 'getWorkspaceUsers' },
        default: '',
        description: 'The workspace user to assign this task to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
      },
      {
        displayName: 'Contact',
        name: 'contactId',
        type: 'resourceLocator',
        default: { mode: 'list', value: '' },
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
      { displayName: 'Due Date', name: 'dueDate', type: 'dateTime', default: '' },
      { displayName: 'Reminder', name: 'reminder', type: 'dateTime', default: '' },
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
      const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

      // Extract contactId from resourceLocator if present
      if (additionalFields.contactId) {
        const contactIdRaw = additionalFields.contactId as IDataObject;
        additionalFields.contactId = (contactIdRaw.value ?? contactIdRaw) as string;
      }

      const body: IDataObject = {
        name: this.getNodeParameter('name', i) as string,
        ...additionalFields,
      };

      const responseData = await apiRequest.call(
        this,
        'POST',
        `/workspaces/${workspaceId}/tasks`,
        body,
      );

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
