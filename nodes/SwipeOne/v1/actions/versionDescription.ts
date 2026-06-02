/* eslint-disable n8n-nodes-base/node-filename-against-convention */
import { NodeConnectionTypes, type INodeTypeDescription } from 'n8n-workflow';
import * as contact from './contact/Contact.resource';
import * as note from './note/Note.resource';
import * as task from './task/Task.resource';
import * as tag from './tag/Tag.resource';
import * as segment from './segment/Segment.resource';
import * as event from './event/Event.resource';
import * as contactProperty from './contactProperty/ContactProperty.resource';
import * as pipeline from './pipeline/Pipeline.resource';
import * as deal from './deal/Deal.resource';

export const versionDescription: INodeTypeDescription = {
  displayName: 'SwipeOne',
  name: 'swipeOne',
  group: ['transform'],
  version: 1,
  subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
  description: 'Interact with the SwipeOne CRM API',
  defaults: { name: 'SwipeOne' },
  inputs: [NodeConnectionTypes.Main],
  outputs: [NodeConnectionTypes.Main],
  credentials: [{ name: 'swipeOneApi', required: true }],
  properties: [
    {
      displayName: 'Resource',
      name: 'resource',
      type: 'options',
      noDataExpression: true,
      options: [
        { name: 'Contact', value: 'contact' },
        { name: 'Contact Property', value: 'contactProperty' },
        { name: 'Deal', value: 'deal' },
        { name: 'Event', value: 'event' },
        { name: 'Note', value: 'note' },
        { name: 'Pipeline', value: 'pipeline' },
        { name: 'Segment', value: 'segment' },
        { name: 'Tag', value: 'tag' },
        { name: 'Task', value: 'task' },
      ],
      default: 'contact',
    },
    ...contact.description,
    ...note.description,
    ...task.description,
    ...tag.description,
    ...segment.description,
    ...event.description,
    ...contactProperty.description,
    ...pipeline.description,
    ...deal.description,
  ],
};
