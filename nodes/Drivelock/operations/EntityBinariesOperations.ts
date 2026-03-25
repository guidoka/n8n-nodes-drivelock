import type { INodeProperties } from 'n8n-workflow';

export const entityBinariesOperations: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                 binaries:getAll                             */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['entity'],
				operation: ['getList'],
				entityName: ['AcBinaries'],
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
				resource: ['entity'],
				operation: ['getList'],
				entityName: ['AcBinaries'],
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
		displayName: 'Get Full Object Return',
		name: 'getFullObject',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['entity'],
				operation: ['getList'],
				entityName: ['AcBinaries'],
			},
		},
		default: true,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Properties to Include',
		name: 'properties',
		type: 'multiOptions',
		default: [],
		displayOptions: {
			show: {
				resource: ['entity'],
				operation: ['getList'],
				entityName: ['AcBinaries'],
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
		displayName: 'Extension Properties to Include',
		name: 'extentionproperties',
		type: 'multiOptions',
		default: [],
		displayOptions: {
			show: {
				resource: ['entity'],
				operation: ['getList'],
				entityName: ['AcBinaries'],
				getFullObject: [false],
			},
		},
		description:
			'Whether to include specific Company properties in the returned results. Choose from a list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		typeOptions: {
			loadOptionsMethod: 'getEntityExtentions',
		},
	
	},
];
