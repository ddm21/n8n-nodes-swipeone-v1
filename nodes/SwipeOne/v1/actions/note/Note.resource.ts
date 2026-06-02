import type { INodeProperties } from 'n8n-workflow';
import * as create from './create.operation';
import * as get from './get.operation';
import * as getAll from './getAll.operation';
import * as update from './update.operation';

export { create, get, getAll, update };

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['note'] } },
    options: [
      { name: 'Create', value: 'create', action: 'Create a note' },
      { name: 'Get', value: 'get', action: 'Get a note' },
      { name: 'Get Many', value: 'getAll', action: 'Get many notes' },
      { name: 'Update', value: 'update', action: 'Update a note' },
    ],
    default: 'getAll',
  },
  ...create.description,
  ...get.description,
  ...getAll.description,
  ...update.description,
];
