import type { IDataObject, IExecuteFunctions, INodeExecutionData, INodeProperties, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { apiRequest } from '../../transport';

export const description: INodeProperties[] = [
	{
		displayName: 'Pipeline Name or ID',
		name: 'pipelineId',
		type: 'options',
		typeOptions: { loadOptionsMethod: 'getWorkspacePipelines' },
		required: true,
		default: '',
		description: 'The pipeline to search deals in. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: { show: { resource: ['deal'], operation: ['search'] } },
	},
	{
		displayName: 'Search By',
		name: 'searchBy',
		type: 'options',
		options: [
			{ name: 'Contact Email', value: 'email' },
			{ name: 'Deal Name', value: 'name' },
		],
		default: 'email',
		displayOptions: { show: { resource: ['deal'], operation: ['search'] } },
	},
	{
		displayName: 'Email',
		name: 'emailValue',
		type: 'string',
		placeholder: 'e.g. john@example.com',
		default: '',
		required: true,
		description: 'The contact email to search deals for (exact match)',
		displayOptions: { show: { resource: ['deal'], operation: ['search'], searchBy: ['email'] } },
	},
	{
		displayName: 'Deal Name',
		name: 'nameValue',
		type: 'string',
		placeholder: 'e.g. Enterprise Deal',
		default: '',
		required: true,
		description: 'The deal name to search for (exact match, case sensitive)',
		displayOptions: { show: { resource: ['deal'], operation: ['search'], searchBy: ['name'] } },
	},
];

export async function execute(
	this: IExecuteFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	const returnData: INodeExecutionData[] = [];

	for (let i = 0; i < items.length; i++) {
		try {
			const pipelineId = this.getNodeParameter('pipelineId', i) as string;
			const searchBy = this.getNodeParameter('searchBy', i) as string;

			let predicate: IDataObject;
			if (searchBy === 'email') {
				const email = this.getNodeParameter('emailValue', i) as string;
				predicate = {
					property: 'email',
					operator: 'is',
					dataType: 'string',
					value: email,
					type: 'contact',
				};
			} else {
				const name = this.getNodeParameter('nameValue', i) as string;
				predicate = {
					property: 'name',
					operator: 'is',
					dataType: 'string',
					value: name,
					type: 'deal',
				};
			}

			const filter = {
				type: 'and',
				predicates: [predicate],
			};

			// Get all stages for the pipeline
			const pipelineResponse = await apiRequest.call(this, 'GET', `/pipelines/${pipelineId}`);
			const stages: IDataObject[] = pipelineResponse?.data?.pipeline?.stageIds ?? [];

			// Search deals across all stages with the filter
			const allDeals: IDataObject[] = [];
			for (const stage of stages) {
				const stageId = (stage._id ?? stage.id) as string;
				const searchBody = {
					filter,
					sort: [{ type: 'deal', property: 'value', order: 'desc' }],
					limit: 50,
					contactProperties: [],
				};
				const response = await apiRequest.call(
					this,
					'POST',
					`/stages/${stageId}/deals/search`,
					searchBody,
				);
				const deals: IDataObject[] = response?.data?.deals ?? [];
				for (const deal of deals) {
					deal.stageName = stage.name;
				}
				allDeals.push(...deals);
			}

			if (allDeals.length === 0) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { success: false, message: 'No deals found matching the search criteria' },
						pairedItem: { item: i },
					});
					continue;
				}
			}

			returnData.push(
				...this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(allDeals),
					{ itemData: { item: i } },
				),
			);
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
				continue;
			}
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}
	}
	return returnData;
}
