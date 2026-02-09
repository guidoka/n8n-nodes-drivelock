import type { INodeProperties } from 'n8n-workflow';

export const applicationRuleOperations: INodeProperties[] = [
	// =====================================
	// Application Rules Operations
	// =====================================
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['applicationRules'],
			},
		},
		options: [
			{
				name: 'Get Rules',
				value: 'getRules',
				description: 'Get application rules from a policy',
				action: 'Get application rules',
			},
			{
				name: 'Create Rules',
				value: 'createRules',
				description: 'Create application rules',
				action: 'Create application rules',
			},
			{
				name: 'Update Rules',
				value: 'updateRules',
				description: 'Update application rules',
				action: 'Update application rules',
			},
			{
				name: 'Delete Rules',
				value: 'deleteRules',
				description: 'Delete application rules',
				action: 'Delete application rules',
			},
		],
		default: 'getRules',
	},

	// Application Rules Common Fields
	{
		displayName: 'Config ID',
		name: 'configId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['applicationRules'],
			},
		},
		default: '',
		required: true,
		description: 'The policy ID',
	},
	{
		displayName: 'Config Version',
		name: 'configVersion',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['applicationRules'],
			},
		},
		default: 0,
		description: 'Policy version (0 for latest)',
	},

	// Create/Update Rules
	{
		displayName: 'Rules',
		name: 'rules',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['applicationRules'],
				operation: ['createRules', 'updateRules'],
			},
		},
		default: '[]',
		required: true,
		description: 'Array of rules in JSON format',
	},

	// Delete Rules
	{
		displayName: 'Rule IDs',
		name: 'ruleIds',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['applicationRules'],
				operation: ['deleteRules'],
			},
		},
		default: '',
		required: true,
		description: 'Comma-separated list of rule IDs to delete',
	},
	// {
	// 	displayName: 'Operation',
	// 	name: 'operation',
	// 	type: 'options',
	// 	noDataExpression: true,
	// 	displayOptions: {
	// 		show: {
	// 			resource: ['applicationrule'],
	// 		},
	// 	},
	// 	options: [
	// 		{
	// 			name: 'Create',
	// 			value: 'create',
	// 			description: 'Create a new Application Rule',
	// 			action: 'Create a application rule',
	// 		},
	// 		{
	// 			name: 'Delete',
	// 			value: 'delete',
	// 			description: 'Delete an Application Rule',
	// 			action: 'Delete an application rule',
	// 		},
	// 		{
	// 			name: 'Get',
	// 			value: 'get',
	// 			description: 'Get an Application Rule',
	// 			action: 'Get an application rule',
	// 		},
	// 		{
	// 			name: 'Get Many',
	// 			value: 'getAll',
	// 			description: 'Get many Application Rules',
	// 			action: 'Get many application rules',
	// 		},
	// 		{
	// 			name: 'Update',
	// 			value: 'update',
	// 			description: 'Update an Application Rule',
	// 			action: 'Update an application rule',
	// 		},
	// 	],
	// 	default: 'create',
	// }
];