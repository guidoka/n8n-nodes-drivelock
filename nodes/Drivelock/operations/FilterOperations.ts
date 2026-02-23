import type { INodeProperties } from 'n8n-workflow';

/**
 * makeFilterProperties — returns the full set of filter UI parameters
 * (filterMode, filterCombinator, filterGroups, filterRaw) scoped to the
 * provided resource/operation combinations via displayOptions.
 *
 * fieldDropdown controls Field input inside the condition builder:
 *   always:true       — always a loadOptions dropdown (e.g. for binaries)
 *   entityNames:[...] — dropdown only for those entityName values;
 *                       other entity types keep the free-text + Field Type inputs
 *   omitted           — free-text string + Field Type (status quo)
 */
export function makeFilterProperties(
	resourceValues: string[],
	operationValues: string[],
	fieldDropdown?: { always?: boolean; entityNames?: string[] },
): INodeProperties[] {
	/* ------------------------------------------------------------------
	 * Build the condition row "values" array based on fieldDropdown config
	 * ------------------------------------------------------------------ */
	/* eslint-disable n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options */
	const dropdownFieldParam: INodeProperties = {
		displayName: 'Field',
		name: 'field',
		type: 'options',
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		options: [],
		typeOptions: { loadOptionsMethod: 'getFilterFields' },
	};
	/* eslint-enable n8n-nodes-base/node-param-display-name-wrong-for-dynamic-options */

	const stringFieldParam: INodeProperties = {
		displayName: 'Field',
		name: 'field',
		type: 'string',
		default: '',
		description:
			'The field name to filter on. You can type any custom field name, or use known entity fields (e.g. name, ID, createdAt).',
	};

	const fieldTypeParam: INodeProperties = {
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
		description: 'Data type of the field — controls value quoting in the query',
	};

	let conditionFieldParams: INodeProperties[];

	if (fieldDropdown?.always) {
		// Single entity type resource (e.g. binaries) — always show dropdown, no Field Type
		conditionFieldParams = [dropdownFieldParam];
	} else if (fieldDropdown?.entityNames?.length) {
		// Multi-entity resource (e.g. entity) — dropdown for target types, string for others
		const targets = fieldDropdown.entityNames;
		conditionFieldParams = [
			{ ...dropdownFieldParam, displayOptions: { show: { '/entityName': targets } } },
			{ ...stringFieldParam,   displayOptions: { hide: { '/entityName': targets } } },
			{ ...fieldTypeParam,     displayOptions: { hide: { '/entityName': targets } } },
		];
	} else {
		// Status quo — free-text field + Field Type dropdown
		conditionFieldParams = [stringFieldParam, fieldTypeParam];
	}

	// FIXME: double check RSQL if it supports "contains", "startsWith", "endsWith" for strings, or if we need to do some special handling for those (e.g. convert to eq and add wildcards)
	const operatorParam: INodeProperties = {
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
	};

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
									values: [
										...conditionFieldParams,
										operatorParam,
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
				'DriveLock RQL filter expression, e.g. eq(name,MyComputer). Passed to API as-is.',
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
