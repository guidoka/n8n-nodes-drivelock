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
                value: 'addComputers',
                description: 'Add computers to a group',
                action: 'Add computers to group',
            },
            {
                name: 'Remove Computers From Group',
                value: 'removeComputers',
                description: 'Remove computers from a group',
                action: 'Remove computers from group',
            },
            {
                name: 'Get Group Members',
                value: 'getMembers',
                description: 'Get all members of a group',
                action: 'Get group members',
            },
            {
                name: 'Set Group Members',
                value: 'setMembers',
                description: 'Replace all group members',
                action: 'Set group members',
            },
        ],
        default: 'addComputers',
    },

    // Group Common Fields
    {
        displayName: 'Group ID',
        name: 'groupId',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['group'],
            },
        },
        default: '',
        required: true,
        description: 'The unique identifier of the group',
    },

    // Add/Remove/Set Computers
    {
        displayName: 'Computer IDs',
        name: 'computerIds',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['group'],
                operation: ['addComputers', 'removeComputers', 'setMembers'],
            },
        },
        default: '',
        required: true,
        description: 'Comma-separated list of computer IDs (UUIDs) to add/remove/set',
    },
];