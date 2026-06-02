import type { INodeProperties } from 'n8n-workflow';
import * as create from './create.operation';
import * as get from './get.operation';
import * as getAll from './getAll.operation';
import * as search from './search.operation';
import * as updateStatus from './updateStatus.operation';

export { create, get, getAll, search, updateStatus };

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['contact'] } },
    options: [
      { name: 'Add or Update Status', value: 'updateStatus', action: 'Add or update the status of a contact' },
      { name: 'Create or Update', value: 'create', action: 'Create or update a contact' },
      { name: 'Get', value: 'get', action: 'Get a contact' },
      { name: 'Get Many', value: 'getAll', action: 'Get many contacts' },
      { name: 'Search', value: 'search', action: 'Search contacts with filters' },
    ],
    default: 'getAll',
  },
  ...create.description,
  ...get.description,
  ...getAll.description,
  ...search.description,
  ...updateStatus.description,
];
