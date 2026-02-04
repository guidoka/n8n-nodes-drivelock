import type { INodeProperties } from 'n8n-workflow';

export const customPropertyOperations: INodeProperties[] = [
	{
		displayName: 'Schema to Extend',
		name: 'schema',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['customproperty'],
			},
		},
		options: [
			{
				name: 'Binaries',
				value: 'AcBinaries',
				description: 'Extent binary schema',
				action: 'Update an custom property',
			},			
			{
				name: 'Computers',
				value: 'Computers',
				description: 'Extent computer schema',
				action: 'Create a custom property',
			},
			{
				name: 'Devices',
				value: 'Devices',
				description: 'Extent device schema',
				action: 'Get many custom properties',
			},			
			{
				name: 'Drive',
				value: 'Drives',
				description: 'Extent drive schema',
				action: 'Get an custom property',
			},
			{
				name: 'Software',
				value: 'Softwares',
				description: 'Extent software schema',
				action: 'Update an custom property',
			},
			{
				name: 'User',
				value: 'Users',
				description: 'Extent user schema',
				action: 'Delete an custom property',
			},				
		],
		default: 'AcBinaries',
	},
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['customproperty'],
			},
		},
		options: [
			{
				name: 'Check',
				value: 'check',
				description: 'Check a Custom Property',
				action: 'Check a custom property',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an Custom Property',
				action: 'Delete an custom property',
			},
			// {
			// 	name: 'Get Many',
			// 	value: 'getAll',
			// 	description: 'Get Many Custom Properties',
			// 	action: 'Get many custom properties',
			// },
			{
				name: 'Update',
				value: 'update',
				description: 'Update Custom Property',
				action: 'Update custom properties',
			}
		],
		default: 'check',
	},
	{
		displayName: 'Create Missing or Update Properties',
		name: 'createOrUpdateIfNotExists',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['check'],
			},
		},
		default: false,
	},
	{
		displayName: 'Please notice: Update is only possible for description, english or german display name changed. DataType is on update ignored. On Property name change a new property is created and the old one remains. Do delete properties you have to go to the DOC and delete them there.',
		name: 'createNotice',
		type: 'notice',
		displayOptions: {
			show: {
				resource: ['customproperty'],				
				operation: ['check'],
			},
		},
		default: '',
	},
	{
		displayName: 'Custom Properties',
		name: 'customProperties',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		placeholder: 'Add Custom Property',
		default: {},
		displayOptions: {
			show: {
				resource: ['customproperty'],
				operation: ['check'],
			},
		},
		
		options: [
			{
				displayName: 'Add Property Text Field',
				name: 'customPropertyValues',
				// eslint-disable-next-line n8n-nodes-base/node-param-fixed-collection-type-unsorted-items
				values: [
					{
						displayName: 'Name of the Custom Property',
						name: 'propertyname',
						type: 'string',
						default: '',
						description: 'The name of the custom property to be added',
						required: true,		
					},
					{
						displayName: 'Data Type',
						name: 'propertydatatype',
						type: 'options',
						noDataExpression: true,
						options: [
							{
								name: 'String',
								value: 'String',
							},
							{
								name: 'Int',
								value: 'Int',
							},
							{
								name: 'Boolean',
								value: 'Bool',
							},
							{
								name: 'Datetime',
								value: 'DateTime',
							},
						],
						required: true,
						default: 'String',
						description: 'Which data type the custom property should be',
					},
					{
						displayName: 'Property Group is automatically set to base group of schema extension choosen',
						name: 'propertynotice',
						type: 'notice',
						default: '',
					},
					{
						displayName: 'Description',
						name: 'propertydescription',
						type: 'string',
						typeOptions: {
							rows: 2,
						},
						default: '',
						description: 'The name of the custom property to be added',			
					},
					{
						displayName: 'English Display Name',
						name: 'propertyenglishdisplayname',
						type: 'string',
						default: '',
						description: 'The name of the custom property to be added',
						required: true,
					},
					{
						displayName: 'German Display Name',
						name: 'propertygermandisplayname',
						type: 'string',
						default: '',
						description: 'The name of the custom property to be added',
					},
				],
			},
		],
	},
	/* -------------------------------------------------------------------------- */
	/*                                 customproperty:update                      */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Schema to Update',
		name: 'customPropertyId',
		type: 'resourceLocator',
		default: { mode: 'id', value: '' },
		required: true,
		displayOptions: {
			show: {
				resource: ['customproperty'],
				operation: ['update'],
			},
		},
		modes: [
			{
				displayName: 'By Id',
				name: 'id',
				type: 'string',
				placeholder: '00000000-0000-0000-0000-000000000000',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '[0-9]+',
							errorMessage: 'Not a valid Schema Extention ID',
						},
					},
				],
			},
		],
	},
	{
		displayName: 'Update Property-Values',
		name: 'updateProperties',
		placeholder: 'Add Custom Property',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		required: true,
		default: {},
		options: [
			{
				name: 'customPropertiesValues',
				displayName: 'Custom Property',
				values: [
					{
						// eslint-disable-next-line n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options
						displayName: 'Property Name',
						name: 'property',
						type: 'options',
						typeOptions: {
							loadOptionsMethod: 'getSchemaExtentions',
						},
						default: '',
						description:
							'Name of the property. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string', // normally i need this to check type dynamic
						default: '',
						required: true,
						description: 'Value of the property',
					},
				],
			},
		],
	}
];