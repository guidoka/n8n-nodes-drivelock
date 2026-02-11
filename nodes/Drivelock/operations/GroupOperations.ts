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
                name: 'Add Computers to Group',
                value: 'addComputersToGroup',
                description: 'Add computers to a group by computer names',
                action: 'Add computers to group',
            },
            {
                name: 'Remove Group Memberships',
                value: 'removeGroupMemberships',
                description: 'Remove group memberships by membership IDs',
                action: 'Remove group memberships',
            },
        ],
        default: 'addComputersToGroup',
    },

    // Group Common Fields
    {
        displayName: 'Group ID',
        name: 'groupId',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['group'],
                operation: ['addComputersToGroup'],
            },
        },
        default: '',
        required: true,
        description: 'The unique identifier (UUID) of the group',
    },

    // Add Computers - Memberships
    {
        displayName: 'Memberships',
        name: 'memberships',
        type: 'json',
        displayOptions: {
            show: {
                resource: ['group'],
                operation: ['addComputersToGroup'],
            },
        },
        default: '[\n  {\n    "name": "COMPUTER-NAME",\n    "isExclude": false,\n    "comment": ""\n  }\n]',
        required: true,
        description: 'Array of computer memberships (name, isExclude, comment)',
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