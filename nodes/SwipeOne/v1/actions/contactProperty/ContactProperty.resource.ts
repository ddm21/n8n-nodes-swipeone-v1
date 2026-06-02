import type { INodeProperties } from 'n8n-workflow';
import * as create from './create.operation';
import * as get from './get.operation';
import * as getAll from './getAll.operation';

export { create, get, getAll };

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['contactProperty'] } },
    options: [
      { name: 'Create', value: 'create', action: 'Create a contact property' },
      { name: 'Get', value: 'get', action: 'Get a contact property' },
      { name: 'Get Many', value: 'getAll', action: 'Get many contact properties' },
    ],
    default: 'getAll',
  },
  ...create.description,
  ...get.description,
  ...getAll.description,
];
