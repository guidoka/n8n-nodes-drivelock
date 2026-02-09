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
	{
		displayName: 'Filter Groups',
		name: 'filterGroupsUi',
		type: 'fixedCollection',
		default: {},
		placeholder: 'Add Filter Group',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				resource: ['binaries'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				name: 'filterGroupsValues',
				displayName: 'Filter Group',
				values: [
					{
						displayName: 'Filters',
						name: 'filtersUi',
						type: 'fixedCollection',
						default: {},
						placeholder: 'Add Filter',
						typeOptions: {
							multipleValues: true,
						},
						options: [
							{
								name: 'filterValues',
								displayName: 'Filter',
								// eslint-disable-next-line n8n-nodes-base/node-param-fixed-collection-type-unsorted-items
								values: [
									{
										displayName: 'Property Name or ID',
										name: 'propertyName',
										type: 'options',
										description:
											'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
										typeOptions: {
											loadOptionsMethod: 'getContactPropertiesWithType',
										},
										default: '',
									},
									{
										displayName: 'Type',
										name: 'type',
										type: 'hidden',
										default: '={{$parameter["&propertyName"].split("|")[1]}}',
									},
									{
										displayName: 'Operator',
										name: 'operator',
										type: 'options',
										displayOptions: {
											hide: {
												type: ['number'],
											},
										},
										// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
										options: [
											{
												name: 'Equal',
												value: 'EQ',
											},
											{
												name: 'Not Equal',
												value: 'NEQ',
											},
											{
												name: 'Starts With',
												value: 'sw',
											},
											{
												name: 'NOT NULL',
												value: 'IS_NOT_NULL',
											},
											{
												name: 'Is NULL',
												value: 'IS_NULL',
											},
										],
										default: 'EQ',
									},
									{
										displayName: 'Operator',
										name: 'operator',
										type: 'options',
										displayOptions: {
											show: {
												type: ['number'],
											},
										},
										options: [
											{
												name: 'Contains Exactly',
												value: 'CONTAINS_TOKEN',
											},
											{
												name: 'Equal',
												value: 'EQ',
											},
											{
												name: 'Greater Than',
												value: 'GT',
											},
											{
												name: 'Greater Than Or Equal',
												value: 'GTE',
											},
											{
												name: 'Is Known',
												value: 'HAS_PROPERTY',
											},
											{
												name: 'Is Unknown',
												value: 'NOT_HAS_PROPERTY',
											},
											{
												name: 'Less Than',
												value: 'LT',
											},
											{
												name: 'Less Than Or Equal',
												value: 'LTE',
											},
											{
												name: 'Not Equal',
												value: 'NEQ',
											},
										],
										default: 'EQ',
									},
									{
										displayName: 'Value',
										name: 'value',
										displayOptions: {
											hide: {
												operator: ['HAS_PROPERTY', 'NOT_HAS_PROPERTY'],
											},
										},
										required: true,
										type: 'string',
										default: '',
									},
								],
							},
						],
						description:
							'Use filters to limit the results to only CRM objects with matching property values. More info <a href="https://developers.hubspot.com/docs/api/crm/search">here</a>.',
					},
				],
			},
		],
		description:
			'When multiple filters are provided within a Filter Group, they will be combined using a logical AND operator. When multiple Filter Groups are provided, they will be combined using a logical OR operator. The system supports a maximum of three Filter Groups with up to three filters each. More info <a href="https://developers.hubspot.com/docs/api/crm/search">here</a>',
	},
	{
		displayName: 'Options',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add option',
		default: {},
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['search'],
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
					loadOptionsMethod: 'getContactProperties',
				},
				default: ['firstname', 'lastname', 'email'],
				description:
					'Whether to include specific Contact properties in the returned results. Choose from a list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Perform a text search against all property values for an object type',
			},
			{
				// eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options
				displayName: 'Sort By',
				name: 'sortBy',
				type: 'options',
				description:
					'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				typeOptions: {
					loadOptionsMethod: 'getContactProperties',
				},
				default: 'createdate',
			},
		],
	},
];