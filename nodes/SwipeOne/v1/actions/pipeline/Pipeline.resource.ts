import type { INodeProperties } from 'n8n-workflow';
import * as create from './create.operation';
import * as get from './get.operation';
import * as getAll from './getAll.operation';
import * as deletePipeline from './deletePipeline.operation';

export { create, get, getAll, deletePipeline };

export const description: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    noDataExpression: true,
    displayOptions: { show: { resource: ['pipeline'] } },
    options: [
      { name: 'Create', value: 'create', action: 'Create a pipeline' },
      { name: 'Delete', value: 'deletePipeline', action: 'Delete a pipeline' },
      { name: 'Get', value: 'get', action: 'Get a pipeline' },
      { name: 'Get Many', value: 'getAll', action: 'Get many pipelines' },
    ],
    default: 'getAll',
  },
  ...create.description,
  ...get.description,
  ...getAll.description,
  ...deletePipeline.description,
];
