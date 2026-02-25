import type { INodeProperties } from 'n8n-workflow';

export const groupOperations: INodeProperties[] = [
	// =====================================
	// Group Operations
	// =====================================
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['group'],
			},
		},
		options: [
			{
				name: 'Add Computer To Group',
				value: 'addComputerToGroup',
				description: 'Add a computer to a group by computer name',
				action: 'Add computer to group',
			},
			{
				name: 'Remove Computer From Group',
				value: 'removeComputerFromGroup',
				description: 'Remove a computer from a group by computer name',
				action: 'Remove computer from group',
			},
			{
				name: 'Remove Group Memberships',
				value: 'removeGroupMemberships',
				description: 'Remove group memberships by membership IDs',
				action: 'Remove group memberships',
			},
		],
		default: 'addComputerToGroup',
	},

	// Group ID — shared by Add and Remove Computer
	{
		displayName: 'Group ID',
		name: 'groupId',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['group'],
				operation: ['addComputerToGroup', 'removeComputerFromGroup'],
			},
		},
		default: '',
		required: true,
		description: 'The unique identifier (UUID) of the group',
	},

	// Memberships fixedCollection — shared by Add and Remove Computer
	{
		displayName: 'Memberships',
		name: 'memberships',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		displayOptions: {
			show: {
				resource: ['group'],
				operation: ['addComputerToGroup', 'removeComputerFromGroup'],
			},
		},
		default: {},
		description: 'One or more computers to add or remove',
		options: [
			{
				name: 'membershipValues',
				displayName: 'Membership',
				values: [
					{
						displayName: 'Computer Name',
						name: 'computerName',
						type: 'string',
						default: '',
						required: true,
						description: 'The name of the computer',
					},
					{
						displayName: 'Comment',
						name: 'comment',
						type: 'string',
						default: '',
						description: 'Optional comment for this membership',
					},
				],
			},
		],
	},

	// Remove Memberships - IDs
	{
		displayName: 'Membership IDs',
		name: 'membershipIds',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['group'],
				operation: ['removeGroupMemberships'],
			},
		},
		default: '',
		required: true,
		description: 'Comma-separated list of membership IDs (UUIDs) to remove',
	},
];
