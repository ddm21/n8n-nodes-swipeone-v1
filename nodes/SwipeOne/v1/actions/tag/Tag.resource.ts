import type { INodeProperties } from 'n8n-workflow';
import * as create from './create.operation';
import * as get from './get.operation';
import * as getAll from './getAll.operation';
import * as update from './update.operation';
import * as addToContact from './addToContact.operation';
import * as getContacts from './getContacts.operation';

export { create, get, getAll, update, addToContact, getContacts };

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['tag'] } },
    options: [
      { name: 'Add to Contact', value: 'addToContact', action: 'Add tags to a contact replaces existing' },
      { name: 'Create', value: 'create', action: 'Create a tag' },
      { name: 'Get', value: 'get', action: 'Get a tag' },
      { name: 'Get Contacts', value: 'getContacts', action: 'Get contacts with a tag' },
      { name: 'Get Many', value: 'getAll', action: 'Get many tags' },
      { name: 'Update', value: 'update', action: 'Update a tag' },
    ],
    default: 'getAll',
  },
  ...create.description,
  ...get.description,
  ...getAll.description,
  ...update.description,
  ...addToContact.description,
  ...getContacts.description,
];
