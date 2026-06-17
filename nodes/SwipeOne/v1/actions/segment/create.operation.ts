import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
  {
    displayName: 'Name',
    name: 'name',
    type: 'string',
    required: true,
    default: '',
    description: 'Must be unique within the workspace',
    displayOptions: { show: { resource: ['segment'], operation: ['create'] } },
  },
  {
    displayName: 'Copy View From Name or ID',
    name: 'copyViewFrom',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getWorkspaceSegments' },
    required: true,
    default: 'all_people',
    description: 'The view/column layout to use for the new segment. "All People" is the default. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: { show: { resource: ['segment'], operation: ['create'] } },
  },
  {
    displayName: 'Filter Type',
    name: 'filterType',
    type: 'options',
    options: [
      { name: 'AND — All Criteria Must Match', value: 'and' },
      { name: 'OR — Any Criterion Must Match', value: 'or' },
    ],
    default: 'and',
    displayOptions: { show: { resource: ['segment'], operation: ['create'] } },
  },
  {
    displayName: 'Criteria',
    name: 'criteria',
    type: 'fixedCollection',
    typeOptions: { multipleValues: true },
    default: {},
    displayOptions: { show: { resource: ['segment'], operation: ['create'] } },
    options: [
      {
        name: 'predicate',
        displayName: 'Predicate',
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
            displayName: 'Operator Name or ID',
            name: 'operator',
            type: 'options',
            typeOptions: { loadOptionsMethod: 'getOperatorsForProperty' },
            default: '',
            description: 'Operators are filtered based on the selected property type. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
          },
          {
            displayName: 'Value',
            name: 'value',
            type: 'string',
            default: '',
            description: 'The value to compare against. For select/multiselect properties, use the exact option name.',
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

  // Fetch properties once to resolve dataType automatically
  const propsResponse = await apiRequest.call(
    this, 'GET', `/workspaces/${workspaceId}/contact-properties`,
  );
  const allProps = propsResponse?.data?.contactProperties ?? propsResponse?.data ?? [];
  const fieldTypeMap = new Map<string, string>();
  for (const prop of allProps as Array<{ name: string; dataType?: string }>) {
    fieldTypeMap.set(prop.name, prop.dataType ?? 'string');
  }

  for (let i = 0; i < items.length; i++) {
    try {
      const filterType = this.getNodeParameter('filterType', i) as string;
      const criteriaRaw = this.getNodeParameter('criteria', i) as IDataObject;

      const predicates = ((criteriaRaw.predicate as IDataObject[]) ?? []).map((p) => {
        const plainName = (p.property as string).replace(/^customProperties\./, '');
        return {
          property: p.property,
          operator: p.operator,
          value: p.value,
          dataType: fieldTypeMap.get(plainName) ?? 'string',
          type: 'contact',
        };
      });

      const body: IDataObject = {
        name: this.getNodeParameter('name', i) as string,
        copyViewFrom: this.getNodeParameter('copyViewFrom', i) as string,
        criteria: { type: filterType, predicates },
      };

      const responseData = await apiRequest.call(
        this,
        'POST',
        `/workspaces/${workspaceId}/segments`,
        body,
      );

      returnData.push(
        ...this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(responseData?.data?.segment ?? responseData),
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
