import type { INodeTypeBaseDescription, IVersionedNodeType } from 'n8n-workflow';
import { VersionedNodeType } from 'n8n-workflow';
import { SwipeOneV1 } from './v1/SwipeOneV1';

export class SwipeOne extends VersionedNodeType {
  constructor() {
    const baseDescription: INodeTypeBaseDescription = {
      displayName: 'SwipeOne',
      name: 'swipeOne',
      icon: 'file:swipeone.svg',
      group: ['transform'],
      description: 'Interact with the SwipeOne CRM API',
      defaultVersion: 1,
    };
    const nodeVersions: IVersionedNodeType['nodeVersions'] = {
      1: new SwipeOneV1(baseDescription),
    };
    super(nodeVersions, baseDescription);
  }
}
