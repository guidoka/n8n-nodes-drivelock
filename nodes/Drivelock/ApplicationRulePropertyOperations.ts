import type { INodeProperties } from 'n8n-workflow';

export const applicationRulePropertyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['applicationrule'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new Application Rule',
				action: 'Create a application rule',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an Application Rule',
				action: 'Delete an application rule',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get an Application Rule',
				action: 'Get an application rule',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get many Application Rules',
				action: 'Get many application rules',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update an Application Rule',
				action: 'Update an application rule',
			},
		],
		default: 'create',
	}
];