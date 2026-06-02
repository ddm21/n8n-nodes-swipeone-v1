import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import * as contact from './contact/Contact.resource';
import * as note from './note/Note.resource';
import * as task from './task/Task.resource';
import * as tag from './tag/Tag.resource';
import * as segment from './segment/Segment.resource';
import * as event from './event/Event.resource';
import * as contactProperty from './contactProperty/ContactProperty.resource';
import * as pipeline from './pipeline/Pipeline.resource';
import * as deal from './deal/Deal.resource';

type OperationModule = {
  description: INodeProperties[];
  execute: (
    this: IExecuteFunctions,
    items: INodeExecutionData[],
  ) => Promise<INodeExecutionData[]>;
};

type ResourceModule = Record<string, OperationModule>;

export async function router(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const resource = this.getNodeParameter('resource', 0) as string;
  const operation = this.getNodeParameter('operation', 0) as string;
  let returnData: INodeExecutionData[] = [];

  const resourceMap: Record<string, ResourceModule> = {
    contact: contact as unknown as ResourceModule,
    note: note as unknown as ResourceModule,
    task: task as unknown as ResourceModule,
    tag: tag as unknown as ResourceModule,
    segment: segment as unknown as ResourceModule,
    event: event as unknown as ResourceModule,
    contactProperty: contactProperty as unknown as ResourceModule,
    pipeline: pipeline as unknown as ResourceModule,
    deal: deal as unknown as ResourceModule,
  };

  const mod = resourceMap[resource];
  if (!mod) {
    throw new NodeOperationError(this.getNode(), `Unknown resource: "${resource}"`);
  }

  returnData = await mod[operation].execute.call(this, items);

  return [returnData];
}
