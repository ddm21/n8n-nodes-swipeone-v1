import type { INodeProperties } from 'n8n-workflow';
import * as create from './create.operation';
import * as get from './get.operation';
import * as search from './search.operation';
import * as update from './update.operation';
import * as deleteDeal from './deleteDeal.operation';

export { create, get, search, update, deleteDeal };

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['deal'] } },
    options: [
      { name: 'Create', value: 'create', action: 'Create a deal' },
      { name: 'Delete', value: 'deleteDeal', action: 'Delete a deal' },
      { name: 'Get', value: 'get', action: 'Get a deal' },
      { name: 'Search', value: 'search', action: 'Search deals' },
      { name: 'Update', value: 'update', action: 'Update a deal' },
    ],
    default: 'create',
  },
  ...create.description,
  ...get.description,
  ...search.description,
  ...update.description,
  ...deleteDeal.description,
];
