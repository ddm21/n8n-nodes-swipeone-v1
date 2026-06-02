import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeListSearchItems,
  ILoadOptionsFunctions,
  INodeListSearchResult,
  INodePropertyOptions,
  INodeType,
  INodeTypeBaseDescription,
  INodeTypeDescription,
  JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { router } from './actions/router';
import { versionDescription } from './actions/versionDescription';
import { apiRequest } from './transport';

// Property names already shown as dedicated top-level fields in the create operation
const DEFAULT_PROPERTY_NAMES = new Set([
  'firstName',
  'lastName',
  'email',
]);

// Operators available per fieldType
const OPERATORS_BY_FIELD_TYPE: Record<string, Array<{ name: string; value: string }>> = {
  text: [
    { name: 'Is', value: 'is' },
    { name: 'Is Not', value: 'is_not' },
    { name: 'Contains', value: 'contains' },
    { name: 'Does Not Contain', value: 'does_not_contain' },
    { name: 'Has Any Value', value: 'is_known' },
    { name: 'Is Not Specified', value: 'is_unknown' },
  ],
  email: [
    { name: 'Is', value: 'is' },
    { name: 'Is Not', value: 'is_not' },
    { name: 'Contains', value: 'contains' },
    { name: 'Does Not Contain', value: 'does_not_contain' },
    { name: 'Has Any Value', value: 'is_known' },
    { name: 'Is Not Specified', value: 'is_unknown' },
  ],
  url: [
    { name: 'Is', value: 'is' },
    { name: 'Is Not', value: 'is_not' },
    { name: 'Contains', value: 'contains' },
    { name: 'Does Not Contain', value: 'does_not_contain' },
    { name: 'Has Any Value', value: 'is_known' },
    { name: 'Is Not Specified', value: 'is_unknown' },
  ],
  select: [
    { name: 'Is', value: 'is' },
    { name: 'Is Not', value: 'is_not' },
    { name: 'Has Any Value', value: 'is_known' },
    { name: 'Is Not Specified', value: 'is_unknown' },
  ],
  multiselect: [
    { name: 'Contains', value: 'contains' },
    { name: 'Does Not Contain', value: 'does_not_contain' },
    { name: 'Has Any Value', value: 'is_known' },
    { name: 'Is Not Specified', value: 'is_unknown' },
  ],
  number: [
    { name: 'Is', value: 'is' },
    { name: 'Is Not', value: 'is_not' },
    { name: 'Greater Than', value: 'greater_than' },
    { name: 'Less Than', value: 'less_than' },
    { name: 'Has Any Value', value: 'is_known' },
    { name: 'Is Not Specified', value: 'is_unknown' },
  ],
  date: [
    { name: 'Is More Than (X Days Ago)', value: 'is_more_than' },
    { name: 'Is in the Last', value: 'is_in_the_last' },
    { name: 'Is in the Next', value: 'is_in_the_next' },
    { name: 'Is On', value: 'is_on' },
    { name: 'Is Before', value: 'is_before' },
    { name: 'Is After', value: 'is_after' },
    { name: 'Is Between Dates', value: 'is_between_dates' },
    { name: 'Has Any Value', value: 'is_known' },
    { name: 'Is Unknown', value: 'is_unknown' },
  ],
  phone: [
    { name: 'Is', value: 'is' },
    { name: 'Is Not', value: 'is_not' },
    { name: 'Contains', value: 'contains' },
    { name: 'Does Not Contain', value: 'does_not_contain' },
    { name: 'Has Any Value', value: 'is_known' },
    { name: 'Is Not Specified', value: 'is_unknown' },
  ],
  address: [
    { name: 'Has Any Value', value: 'is_known' },
    { name: 'Is Not Specified', value: 'is_unknown' },
  ],
  tags: [
    { name: 'Includes', value: 'includes' },
    { name: 'Excludes', value: 'excludes' },
    { name: 'Has Any Value', value: 'is_known' },
    { name: 'Is Not Specified', value: 'is_unknown' },
  ],
};

// Fallback operators when fieldType is unknown
const DEFAULT_OPERATORS = [
  { name: 'Is', value: 'is' },
  { name: 'Is Not', value: 'is_not' },
  { name: 'Contains', value: 'contains' },
  { name: 'Does Not Contain', value: 'does_not_contain' },
  { name: 'Greater Than', value: 'greater_than' },
  { name: 'Less Than', value: 'less_than' },
  { name: 'Has Any Value', value: 'is_known' },
  { name: 'Is Not Specified', value: 'is_unknown' },
];

// No more hardcoded built-in list — we detect it from the API's createdBy.type field

export class SwipeOneV1 implements INodeType {
  description: INodeTypeDescription;

  constructor(baseDescription: INodeTypeBaseDescription) {
    this.description = { ...baseDescription, ...versionDescription, usableAsTool: true };
  }

  methods = {
    listSearch: {
      async searchContacts(
        this: ILoadOptionsFunctions,
        filter?: string,
        paginationToken?: string,
      ): Promise<INodeListSearchResult> {
        const credentials = await this.getCredentials('swipeOneApi');
        const workspaceId = credentials.workspaceId as string;
        const query: IDataObject = { limit: 20 };
        if (filter) query.searchText = filter;
        if (paginationToken) query.searchAfter = paginationToken;
        const response = await apiRequest.call(
          this, 'GET', `/workspaces/${workspaceId}/contacts`, {}, query,
        );
        const inner = response?.data ?? {};
        const contacts: IDataObject[] = inner.contacts ?? [];
        const results: INodeListSearchItems[] = contacts.map((c: IDataObject) => {
          const parts = [c.firstName, c.lastName].filter(Boolean).join(' ');
          const display = c.email ? (parts ? `${parts} (${c.email})` : (c.email as string)) : (parts || (c._id as string));
          return { name: display, value: c._id as string, url: '' };
        });
        const nextToken = inner.searchAfter as string | undefined;
        return {
          results,
          paginationToken: nextToken && contacts.length >= 20 ? nextToken : undefined,
        };
      },

      async searchNotes(
        this: ILoadOptionsFunctions,
        filter?: string,
        paginationToken?: string,
      ): Promise<INodeListSearchResult> {
        const credentials = await this.getCredentials('swipeOneApi');
        const workspaceId = credentials.workspaceId as string;
        const page = paginationToken ? parseInt(paginationToken, 10) : 1;
        const query: IDataObject = { limit: 20, page };
        if (filter) query.search = filter;
        const response = await apiRequest.call(
          this, 'GET', `/workspaces/${workspaceId}/notes`, {}, query,
        );
        const inner = response?.data ?? {};
        const notes: IDataObject[] = inner.notes ?? inner.data ?? [];
        const results: INodeListSearchItems[] = notes.map((n: IDataObject) => {
          let contentStr = '';
          if (typeof n.content === 'string') {
            contentStr = n.content;
          } else if (n.content && typeof n.content === 'object') {
            // Extract plain text from Tiptap/ProseMirror JSON content
            const extractText = (node: IDataObject): string => {
              if (node.text) return node.text as string;
              if (Array.isArray(node.content)) {
                return (node.content as IDataObject[]).map(extractText).join(' ');
              }
              return '';
            };
            contentStr = extractText(n.content as IDataObject).trim();
          }
          const title = (n.title as string) || contentStr.substring(0, 80) || (n._id as string);
          return { name: title, value: n._id as string, url: '' };
        });
        const total = (inner.total as number) ?? 0;
        const hasMore = page * 20 < total;
        return {
          results,
          paginationToken: hasMore ? String(page + 1) : undefined,
        };
      },

      async searchTasks(
        this: ILoadOptionsFunctions,
        filter?: string,
      ): Promise<INodeListSearchResult> {
        const credentials = await this.getCredentials('swipeOneApi');
        const workspaceId = credentials.workspaceId as string;
        const response = await apiRequest.call(
          this, 'GET', `/workspaces/${workspaceId}/tasks`, {}, { limit: 100 },
        );
        const inner = response?.data ?? {};
        const tasks: IDataObject[] = inner.tasks ?? inner.data ?? [];
        const filtered = filter
          ? tasks.filter((t: IDataObject) =>
              ((t.name as string) || '').toLowerCase().includes(filter.toLowerCase()))
          : tasks;
        const results: INodeListSearchItems[] = filtered.map((t: IDataObject) => ({
          name: (t.name as string) || (t._id as string),
          value: t._id as string,
          url: '',
        }));
        return { results };
      },

      async searchDeals(
        this: ILoadOptionsFunctions,
        filter?: string,
      ): Promise<INodeListSearchResult> {
        const credentials = await this.getCredentials('swipeOneApi');
        const workspaceId = credentials.workspaceId as string;

        // Get all pipelines to discover stages
        const pipelinesResponse = await apiRequest.call(
          this, 'GET', `/workspaces/${workspaceId}/pipelines`,
        );
        const pipelines: IDataObject[] =
          (pipelinesResponse?.data?.pipelines?.pipelines as IDataObject[]) ??
          (pipelinesResponse?.data?.pipelines as IDataObject[]) ?? [];

        // Collect all deals across all stages of all pipelines
        const allDeals: IDataObject[] = [];
        for (const pipeline of pipelines) {
          const stages = (pipeline.stageIds as IDataObject[]) ?? [];
          for (const stage of stages) {
            const stageId = (stage._id ?? stage.id) as string;
            const searchBody = {
              filter: { type: 'and', predicates: [] },
              sort: [{ type: 'deal', property: 'value', order: 'desc' }],
              limit: 50,
              contactProperties: [],
            };
            const dealsResponse = await apiRequest.call(
              this, 'POST', `/stages/${stageId}/deals/search`, searchBody,
            );
            const deals: IDataObject[] = dealsResponse?.data?.deals ?? [];
            for (const deal of deals) {
              (deal as IDataObject)._pipelineName = pipeline.name;
              (deal as IDataObject)._stageName = (stage as IDataObject).name;
            }
            allDeals.push(...deals);
          }
        }

        // Filter by search term if provided
        const filtered = filter
          ? allDeals.filter((d: IDataObject) =>
              ((d.name as string) || '').toLowerCase().includes(filter.toLowerCase()))
          : allDeals;

        const results: INodeListSearchItems[] = filtered.map((d: IDataObject) => {
          const name = (d.name as string) || (d._id as string);
          const value = (d.value as number) ?? 0;
          const pipeline = d._pipelineName as string;
          const stage = d._stageName as string;
          const contact = d.contact as IDataObject | undefined;
          const contactName = contact
            ? ((contact.fullName as string) || (contact.email as string) || '')
            : '';
          const display = `${name} ($${value}) — ${pipeline} / ${stage}${contactName ? ` — ${contactName}` : ''}`;
          return { name: display, value: d._id as string, url: '' };
        });

        return { results };
      },
    },

    loadOptions: {
      async getContactProperties(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('swipeOneApi');
        const workspaceId = credentials.workspaceId as string;
        const response = await apiRequest.call(
          this,
          'GET',
          `/workspaces/${workspaceId}/contact-properties`,
        );
        const properties = response?.data?.contactProperties ?? response?.data ?? [];
        return properties
          .filter((p: { name: string }) => !DEFAULT_PROPERTY_NAMES.has(p.name))
          .map((p: { name: string; label: string }) => ({
            name: p.label,
            value: p.name,
          }));
      },
      async getEventDefinitions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('swipeOneApi');
        const workspaceId = credentials.workspaceId as string;
        const response = await apiRequest.call(
          this,
          'GET',
          `/workspaces/${workspaceId}/event-definitions`,
        );
        const definitions = response?.data?.eventDefinitions ?? response?.data ?? [];
        return definitions.map((d: { name: string; label: string }) => ({
          name: d.label,
          value: d.name,
        }));
      },
      async getEventProperties(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('swipeOneApi');
        const workspaceId = credentials.workspaceId as string;
        const eventType = this.getCurrentNodeParameter('type') as string;
        if (!eventType) return [];
        const response = await apiRequest.call(
          this,
          'GET',
          `/workspaces/${workspaceId}/event-definitions`,
        );
        const definitions = response?.data?.eventDefinitions ?? response?.data ?? [];
        const definition = definitions.find((d: { name: string }) => d.name === eventType);
        if (!definition || !definition.properties) return [];
        return definition.properties.map((p: { name: string; label: string; fieldType: string; options?: Array<{ label: string }> }) => {
          let description = `Type: ${p.fieldType}`;
          if ((p.fieldType === 'select' || p.fieldType === 'multiselect') && p.options?.length) {
            const MAX_INLINE = 5;
            if (p.options.length <= MAX_INLINE) {
              description += ` — Options: ${p.options.map((o) => o.label).join(', ')}`;
            } else {
              const preview = p.options.slice(0, 3).map((o) => o.label).join(', ');
              description += ` — ${p.options.length} options (e.g. ${preview}, …). Use "Get Event Definitions" to see all.`;
            }
          }
          return {
            name: p.label,
            value: p.name,
            description,
          };
        });
      },
      async getContactStatuses(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('swipeOneApi');
        const workspaceId = credentials.workspaceId as string;
        const response = await apiRequest.call(
          this, 'GET', `/workspaces/${workspaceId}/statuses`,
        );
        const statuses = response?.data?.statuses ?? [];
        return statuses.map((s: { name: string; label: string; color?: string }) => ({
          name: s.color ? `${s.label} (${s.color})` : s.label,
          value: s.name,
        }));
      },
      async getWorkspaceTags(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('swipeOneApi');
        const workspaceId = credentials.workspaceId as string;
        const response = await apiRequest.call(
          this, 'GET', `/workspaces/${workspaceId}/tags`,
        );
        const tags = response?.data?.tags ?? [];
        return tags.map((t: { _id: string; name: string; label: string; color: string }) => ({
          name: `${t.label} (${t.color})`,
          value: t.name,
        }));
      },
      async getWorkspaceTagsById(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('swipeOneApi');
        const workspaceId = credentials.workspaceId as string;
        const response = await apiRequest.call(
          this, 'GET', `/workspaces/${workspaceId}/tags`,
        );
        const tags = response?.data?.tags ?? [];
        return tags.map((t: { _id: string; name: string; label: string; color: string }) => ({
          name: `${t.label} (${t.color})`,
          value: t._id,
        }));
      },
      async getWorkspaceUsers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const response = await apiRequest.call(
          this, 'GET', '', {}, {}, 'https://api.swipeone.com/accounts',
        );
        const users = response?.data?.users ?? [];
        return users
          .filter((u: { status: string }) => u.status === 'active')
          .map((u: { id: string; email: string; role: string }) => ({
            name: `${u.email} (${u.role})`,
            value: u.id,
          }));
      },
      async getWorkspaceSegments(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('swipeOneApi');
        const workspaceId = credentials.workspaceId as string;
        const response = await apiRequest.call(
          this, 'GET', `/workspaces/${workspaceId}/segments`,
        );
        const segments = response?.data?.segments ?? [];
        return [
          { name: 'All People (Default)', value: 'all_people' },
          ...segments.map((s: { _id: string; name: string }) => ({
            name: s.name,
            value: s._id,
          })),
        ];
      },
      async getWorkspaceSegmentsById(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('swipeOneApi');
        const workspaceId = credentials.workspaceId as string;
        const response = await apiRequest.call(
          this, 'GET', `/workspaces/${workspaceId}/segments`,
        );
        const segments = response?.data?.segments ?? [];
        return segments.map((s: { _id: string; name: string }) => ({
          name: s.name,
          value: s._id,
        }));
      },
      async getWorkspacePipelines(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('swipeOneApi');
        const workspaceId = credentials.workspaceId as string;
        const response = await apiRequest.call(
          this, 'GET', `/workspaces/${workspaceId}/pipelines`,
        );
        const pipelines =
          response?.data?.pipelines?.pipelines ?? response?.data?.pipelines ?? [];
        return pipelines.map((p: { _id: string; name: string; currency?: string }) => ({
          name: p.currency ? `${p.name} (${p.currency})` : p.name,
          value: p._id,
        }));
      },
      async getPipelineStages(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const pipelineId = this.getCurrentNodeParameter('pipelineId') as string;
        if (!pipelineId) return [];
        const response = await apiRequest.call(this, 'GET', `/pipelines/${pipelineId}`);
        const stages = response?.data?.pipeline?.stageIds ?? [];
        return stages.map((s: { _id: string; name: string; color?: string }) => ({
          name: s.color ? `${s.name} (${s.color})` : s.name,
          value: s._id,
        }));
      },
      async getPipelineStagesForUpdate(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const pipelineId = this.getCurrentNodeParameter('pipelineId') as string;
        if (!pipelineId) return [{ name: '— Select a Pipeline First —', value: '' }];
        const response = await apiRequest.call(this, 'GET', `/pipelines/${pipelineId}`);
        const stages = response?.data?.pipeline?.stageIds ?? [];
        return stages.map((s: { _id: string; name: string; color?: string }) => ({
          name: s.color ? `${s.name} (${s.color})` : s.name,
          value: s._id,
        }));
      },
      async getContactPropertiesById(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('swipeOneApi');
        const workspaceId = credentials.workspaceId as string;
        const response = await apiRequest.call(
          this, 'GET', `/workspaces/${workspaceId}/contact-properties`,
        );
        const properties = response?.data?.contactProperties ?? response?.data ?? [];
        return properties.map((p: { _id: string; label: string; fieldType?: string }) => ({
          name: `${p.label} (${p.fieldType ?? 'unknown'})`,
          value: p._id,
        }));
      },
      async getOperatorsForProperty(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const selectedProperty = this.getCurrentNodeParameter('property') as string;
        if (!selectedProperty) return DEFAULT_OPERATORS;
        const credentials = await this.getCredentials('swipeOneApi');
        const workspaceId = credentials.workspaceId as string;
        const response = await apiRequest.call(
          this, 'GET', `/workspaces/${workspaceId}/contact-properties`,
        );
        const properties = response?.data?.contactProperties ?? response?.data ?? [];
        // Match by name — handle both plain and customProperties. prefixed values
        const plainName = selectedProperty.replace(/^customProperties\./, '');
        const prop = properties.find((p: { name: string }) => p.name === plainName);
        if (!prop?.fieldType) return DEFAULT_OPERATORS;
        return OPERATORS_BY_FIELD_TYPE[prop.fieldType] ?? DEFAULT_OPERATORS;
      },
      async getValuesForProperty(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const selectedProperty = this.getCurrentNodeParameter('property') as string;
        if (!selectedProperty) return [];
        const credentials = await this.getCredentials('swipeOneApi');
        const workspaceId = credentials.workspaceId as string;
        const response = await apiRequest.call(
          this, 'GET', `/workspaces/${workspaceId}/contact-properties`,
        );
        const properties = response?.data?.contactProperties ?? response?.data ?? [];
        const plainName = selectedProperty.replace(/^customProperties\./, '');
        const prop = properties.find((p: { name: string }) => p.name === plainName);
        if (!prop?.options?.length) return [];
        return prop.options.map((o: { label: string; name: string }) => ({
          name: o.label,
          value: o.name,
        }));
      },
      async getAllContactProperties(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const credentials = await this.getCredentials('swipeOneApi');
        const workspaceId = credentials.workspaceId as string;
        const response = await apiRequest.call(
          this,
          'GET',
          `/workspaces/${workspaceId}/contact-properties`,
        );
        const properties = response?.data?.contactProperties ?? response?.data ?? [];
        return properties.map((p: { name: string; label: string; fieldType?: string; createdBy?: { type: string } }) => {
          const isBuiltIn = p.createdBy?.type === 'system';
          const value = isBuiltIn ? p.name : `customProperties.${p.name}`;
          const NOTABLE_TYPES = new Set(['select', 'multiselect', 'tag']);
          const description = p.fieldType && NOTABLE_TYPES.has(p.fieldType)
            ? `Type: ${p.fieldType}`
            : '';
          return { name: p.label, value, description };
        });
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    try {
      return await router.call(this);
    } catch (error) {
      if (this.continueOnFail()) {
        return [[{ json: { error: (error as Error).message } }]];
      }
      throw new NodeApiError(this.getNode(), error as JsonObject);
    }
  }
}
