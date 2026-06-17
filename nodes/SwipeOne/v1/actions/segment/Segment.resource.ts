import type { INodeProperties } from 'n8n-workflow';
import * as get from './get.operation';
import * as getAll from './getAll.operation';
import * as getContacts from './getContacts.operation';

export { get, getAll, getContacts };

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['segment'] } },
    options: [
      { name: 'Get', value: 'get', action: 'Get a segment' },
      { name: 'Get Many', value: 'getAll', action: 'Get many segments' },
      { name: 'Get Contacts', value: 'getContacts', action: 'Get contacts in a segment' },
    ],
    default: 'getAll',
  },
  ...get.description,
  ...getAll.description,
  ...getContacts.description,
];
