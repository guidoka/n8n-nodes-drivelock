import type { INodeProperties } from 'n8n-workflow';
import { makeFilterProperties } from './FilterOperations';
import acBinariesFields from '../helper/fields/AcBinaries.json';

export const binariesOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['binaries'],
			},
		},
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get Many Binaries',
				action: 'Get many acbinaries',
			},
		],
		default: 'getAll',
	},
	/* -------------------------------------------------------------------------- */
	/*                                 binaries:getAll                             */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['binaries'],				
				operation: ['getAll'],
			},
		},
		default: true,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Get Full Object Return',
		name: 'getFullObject',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['binaries'],				
				operation: ['getAll'],
			},
		},
		default: true,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['binaries'],				
				operation: ['getAll'],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 250,
		},
		default: 50,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Properties to Include',
		name: 'properties',
		type: 'multiOptions',
		default: [],
		displayOptions: {
			show: {
				resource: ['binaries'],
				operation: ['getAll'],
				getFullObject: [false],
			},
		},
		description:
			'Whether to include specific properties in the returned results. Choose from a list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		options: acBinariesFields.map((f) => ({ name: f.name, value: f.id })),
	},
	{
		displayName: 'Extention-Properties to Include',
		name: 'extentionproperties',
		type: 'multiOptions',
		default: [],
		displayOptions: {
			show: {
				resource: ['binaries'],
				operation: ['getAll'],
				getFullObject: [false],
			},
		},
		description:
			'Whether to include specific properties in the returned results. Choose from a list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		typeOptions: {
			loadOptionsMethod: 'getSchemaExtentions',
		},
	
	},
	// Filter Builder — for binaries getAll
	...makeFilterProperties(['binaries'], ['getAll'], { always: true }),
	{
		displayName: 'Options',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: {
			show: {
				resource: ['binaries'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'Sort Order',
				name: 'direction',
				type: 'options',
				options: [
					{
						name: 'Ascending',
						value: 'ASCENDING',
					},
					{
						name: 'Descending',
						value: 'DESCENDING',
					},
				],
				default: 'DESCENDING',
				description:
					'Defines the direction in which search results are ordered. Default value is Descending.',
			},
			{
				displayName: 'Field Names or IDs',
				name: 'properties',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getBinaryProps',
				},
				default: [],
				description:
					'Whether to include specific Contact properties in the returned results. Choose from a list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				// eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options
				displayName: 'Sort By',
				name: 'sortBy',
				type: 'options',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getBinaryProps',
				},
				default: '',
			},
		],
	},
];