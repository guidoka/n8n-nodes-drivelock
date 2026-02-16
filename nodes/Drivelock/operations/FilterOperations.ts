import type { INodeProperties } from 'n8n-workflow';

/**
 * makeFilterProperties — returns the full set of filter UI parameters
 * (filterMode, filterCombinator, filterGroups, filterRaw) scoped to the
 * provided resource/operation combinations via displayOptions.
 */
export function makeFilterProperties(
	resourceValues: string[],
	operationValues: string[],
): INodeProperties[] {
	return [
		/* ------------------------------------------------------------------ */
		/* filterMode — top-level mode switch (Builder vs Raw)                */
		/* ------------------------------------------------------------------ */
		{
			displayName: 'Filter Mode',
			name: 'filterMode',
			type: 'options',
			options: [
				{
					name: 'Builder',
					value: 'builder',
					description: 'Visual query builder — add groups and conditions',
				},
				{
					name: 'Raw Query',
					value: 'raw',
					description: 'Advanced: type DriveLock RQL directly',
				},
			],
			default: 'builder',
			displayOptions: {
				show: {
					resource: resourceValues,
					operation: operationValues,
				},
			},
		},

		/* ------------------------------------------------------------------ */
		/* filterCombinator — how to combine multiple filter groups            */
		/* ------------------------------------------------------------------ */
		{
			displayName: 'Top-Level Combinator',
			name: 'filterCombinator',
			type: 'options',
			options: [
				{ name: 'AND (All Groups Must Match)', value: 'and' },
				{ name: 'OR (Any Group Must Match)', value: 'or' },
			],
			default: 'and',
			displayOptions: {
				show: {
					resource: resourceValues,
					operation: operationValues,
					filterMode: ['builder'],
				},
			},
		},

		/* ------------------------------------------------------------------ */
		/* filterGroups — two-level fixedCollection: groups of conditions      */
		/* ------------------------------------------------------------------ */
		{
			displayName: 'Filter Groups',
			name: 'filterGroups',
			type: 'fixedCollection',
			typeOptions: {
				multipleValues: true,
			},
			placeholder: 'Add Filter Group',
			default: {},
			displayOptions: {
				show: {
					resource: resourceValues,
					operation: operationValues,
					filterMode: ['builder'],
				},
			},
			options: [
				{
					displayName: 'Group',
					name: 'groups',
					values: [
						{
							displayName: 'Group Combinator',
							name: 'combinator',
							type: 'options',
							options: [
								{ name: 'AND (All Conditions Must Match)', value: 'and' },
								{ name: 'OR (Any Condition Must Match)', value: 'or' },
							],
							default: 'and',
						},
						{
							displayName: 'Conditions',
							name: 'conditions',
							type: 'fixedCollection',
							typeOptions: {
								multipleValues: true,
							},
							placeholder: 'Add Condition',
							default: {},
							options: [
								{
									displayName: 'Condition',
									name: 'condition',
									// eslint-disable-next-line n8n-nodes-base/node-param-fixed-collection-type-unsorted-items
									values: [
										{
											displayName: 'Field',
											name: 'field',
											type: 'string',
											default: '',
											description:
												'The field name to filter on. You can type any custom field name, or use known entity fields (e.g. name, ID, createdAt).',
										},
										{
											displayName: 'Field Type',
											name: 'fieldType',
											type: 'options',
											options: [
												{ name: 'String', value: 'string' },
												{ name: 'Number', value: 'number' },
												{ name: 'Boolean', value: 'boolean' },
												{ name: 'Date/Time', value: 'date' },
											],
											default: 'string',
											description:
												'Data type of the field — controls value quoting in the query',
										},
										{
											displayName: 'Operator',
											name: 'operator',
											type: 'options',
											// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
											options: [
												{ name: 'Equals (Eq)', value: 'eq' },
												{ name: 'Not Equals (Ne)', value: 'ne' },
												{ name: 'Contains (String)', value: 'contains' },
												{ name: 'Starts With (String)', value: 'startsWith' },
												{ name: 'Ends With (String)', value: 'endsWith' },
												{ name: 'Greater Than (Gt)', value: 'gt' },
												{ name: 'Less Than (Lt)', value: 'lt' },
												{ name: 'Greater Than or Equal (Ge)', value: 'ge' },
												{ name: 'Less Than or Equal (Le)', value: 'le' },
												{ name: 'In (Any Of)', value: 'in' },
											],
											default: 'eq',
										},
										{
											displayName: 'Negate (NOT)',
											name: 'negate',
											type: 'boolean',
											default: false,
											description:
												'Whether to wrap this condition in not()',
										},
										{
											displayName: 'Value',
											name: 'value',
											type: 'string',
											default: '',
											displayOptions: {
												hide: {
													operator: ['in'],
												},
											},
										},
										{
											displayName: 'Values (Comma-Separated)',
											name: 'valueList',
											type: 'string',
											default: '',
											description:
												'Comma-separated list of values for the "in" operator',
											displayOptions: {
												show: {
													operator: ['in'],
												},
											},
										},
									],
								},
							],
						},
					],
				},
			],
		},

		/* ------------------------------------------------------------------ */
		/* filterRaw — raw RQL string for advanced users                       */
		/* ------------------------------------------------------------------ */
		{
			displayName: 'Raw Query (RQL)',
			name: 'filterRaw',
			type: 'string',
			default: '',
			description:
				'DriveLock RQL filter expression, e.g. eq(name,"MyComputer"). Passed to API as-is.',
			displayOptions: {
				show: {
					resource: resourceValues,
					operation: operationValues,
					filterMode: ['raw'],
				},
			},
		},
	];
}
