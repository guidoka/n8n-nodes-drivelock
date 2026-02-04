import type { INodeProperties } from 'n8n-workflow';

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
			'Whether to include specific Company properties in the returned results. Choose from a list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
 		//eslint-disable-next-line n8n-nodes-base/node-param-multi-options-type-unsorted-items	
		options: [
			{
				name: 'File Hash', 
				value: 'fileHash',
			},
			{
				name: 'Version',
				value: 'versionInfo'
			},
			{
				name: 'Version Description',
				value: 'verDescription'
			},
			{
				name: 'Product',
				value: 'product'
			},
			{
				name: 'Date Created',
				value: 'createdDate'
			},
			{
				name: 'Certificate ID',
				value: 'acCertificateID'
			},
			{
				name: 'File Size',
				value: 'fileSize'
			},
			{
				name: 'Binary',
				value: 'displayName'
			},
			{
				name: 'Nested Filter',
				value: 'associatedRule'
			},
			{
				name: 'AcCertificates (Relation)',
				value: 'acCertificates.*'
			},
			{
				name: 'AcFile (Relation)',
				value: 'acFile.*'
			},						
		]
		
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
			'Whether to include specific Company properties in the returned results. Choose from a list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		typeOptions: {
			loadOptionsMethod: 'getSchemaExtentions',
		},
	
	},
];