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
    displayOptions: { show: { resource: ['task'] } },
    options: [
      { name: 'Create', value: 'create', action: 'Create a task' },
      { name: 'Get', value: 'get', action: 'Get a task' },
      { name: 'Get Many', value: 'getAll', action: 'Get many tasks' },
      { name: 'Update', value: 'update', action: 'Update a task' },
    ],
    default: 'getAll',
  },
  ...create.description,
  ...get.description,
  ...getAll.description,
  ...update.description,
];
