import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Filter Type',
    name: 'filterType',
    type: 'options',
    options: [
      { name: 'AND', value: 'and' },
      { name: 'OR', value: 'or' },
    ],
    default: 'and',
    displayOptions: { show: { resource: ['contact'], operation: ['search'] } },
  },
  {
    displayName: 'Filter Condition',
    name: 'predicates',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true },
    default: {},
    displayOptions: { show: { resource: ['contact'], operation: ['search'] } },
    options: [
      {
        name: 'predicate',
        displayName: 'Condition',
        values: [
          {
            displayName: 'Property Name or ID',
            name: 'property',
            type: 'options',
            typeOptions: { loadOptionsMethod: 'getAllContactProperties' },
            default: '',
            description: 'Choose from your workspace\'s contact properties. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
          },
          {
            displayName: 'Operator',
            name: 'operator',
            type: 'options',
            options: [
              { name: 'Contains', value: 'contains' },
              { name: 'Does Not Contain', value: 'does_not_contain' },
              { name: 'Greater Than', value: 'greater_than' },
              { name: 'Is', value: 'is' },
              { name: 'Is Known', value: 'is_known' },
              { name: 'Is Not', value: 'is_not' },
              { name: 'Is Unknown', value: 'is_unknown' },
              { name: 'Less Than', value: 'less_than' },
              { name: 'Starts With', value: 'starts_with' },
            ],
            default: 'is',
          },
          { displayName: 'Value', name: 'value', type: 'string', default: '' },
          {
            displayName: 'Data Type',
            name: 'dataType',
            type: 'options',
            options: [
              { name: 'String', value: 'string' },
              { name: 'Number', value: 'number' },
              { name: 'Date', value: 'date' },
              { name: 'Boolean', value: 'boolean' },
            ],
            default: 'string',
          },
        ],
      },
    ],
  },
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    default: false,
    description: 'Whether to return all results or only up to a given limit',
    displayOptions: { show: { resource: ['contact'], operation: ['search'] } },
  },
  {
    displayName: 'Limit',
    name: 'limit',
    type: 'number',
				description: 'Max number of results to return',
    default: 50,
    typeOptions: { minValue: 1 },
    displayOptions: { show: { resource: ['contact'], operation: ['search'], returnAll: [false] } },
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
      const filterType = this.getNodeParameter('filterType', i) as string;
      const predicatesRaw = this.getNodeParameter('predicates', i) as IDataObject;
      const returnAll = this.getNodeParameter('returnAll', i) as boolean;

      const predicates = ((predicatesRaw.predicate as IDataObject[]) ?? []).map((p) => ({
        property: p.property,
        operator: p.operator,
        value: p.value,
        dataType: p.dataType,
      }));

      const body: IDataObject = {
        filter: { type: filterType, predicates },
        limit: returnAll ? 100 : (this.getNodeParameter('limit', i) as number),
      };

      let allContacts: IDataObject[] = [];

      if (returnAll) {
        let searchAfter: string | undefined;
        for (;;) {
          if (searchAfter) body.searchAfter = searchAfter;
          const response = await apiRequest.call(
            this,
            'POST',
            `/workspaces/${workspaceId}/contacts/search`,
            body,
          );
          const contacts: IDataObject[] = response?.data?.contacts ?? response?.data ?? [];
          allContacts.push(...contacts);
          searchAfter = response?.data?.searchAfter ?? undefined;
          if (!searchAfter || contacts.length < 100) break;
        }
      } else {
        const response = await apiRequest.call(
          this,
          'POST',
          `/workspaces/${workspaceId}/contacts/search`,
          body,
        );
        allContacts = response?.data?.contacts ?? response?.data ?? [];
      }

      returnData.push(
        ...this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(allContacts), {
          itemData: { item: i },
        }),
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
