import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class SwipeOneApi implements ICredentialType {
  name = 'swipeOneApi';

  displayName = 'SwipeOne API';

  documentationUrl = 'https://api.swipeone.com/docs';

  icon = 'file:swipeone.svg' as const;

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
    },
    {
      displayName: 'Workspace ID',
      name: 'workspaceId',
      type: 'string',
      default: '',
      required: true,
      description: 'Your SwipeOne workspace ID, found in your workspace settings',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        'x-api-key': '={{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.swipeone.com/api',
      url: '=/workspaces/{{$credentials.workspaceId}}/contacts?limit=1',
      method: 'GET',
    },
  };
}
