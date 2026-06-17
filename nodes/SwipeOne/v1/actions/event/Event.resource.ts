import type { INodeProperties } from 'n8n-workflow';
import * as createDefinition from './createDefinition.operation';
import * as create from './create.operation';
import * as getAll from './getAll.operation';
import * as getDefinitions from './getDefinitions.operation';

export { createDefinition, create, getAll, getDefinitions };

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['event'] } },
    options: [
      {
        name: 'Create Event Definition',
        value: 'createDefinition',
        action: 'Create a custom event definition',
      },
      { name: 'Fire Event', value: 'create', action: 'Fire a custom event for a contact' },
      {
        name: 'Get Event Definitions',
        value: 'getDefinitions',
        action: 'Get all event definitions with their properties',
      },
      { name: 'Get Many', value: 'getAll', action: 'Get many events for a contact' },
    ],
    default: 'create',
  },
  ...createDefinition.description,
  ...create.description,
  ...getDefinitions.description,
  ...getAll.description,
];
