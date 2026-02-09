import type { INodeProperties } from 'n8n-workflow';

export const computerOperations: INodeProperties[] = [
    // =====================================
    // Computer Operations
    // =====================================
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['computer'],
            },
        },
        // eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
        options: [
            {
                name: 'Delete',
                value: 'delete',
                description: 'Delete computers',
                action: 'Delete computers',
            },
            {
                name: 'Execute Actions',
                value: 'executeActions',
                description: 'Execute actions on computers',
                action: 'Execute actions on computers',
            },
            {
                name: 'Online Unlock',
                value: 'onlineUnlock',
                description: 'Unlock a computer online',
                action: 'Unlock a computer online',
            },
            {
                name: 'Stop Online Unlock',
                value: 'stopOnlineUnlock',
                description: 'Stop online unlock here',
                action: 'Stop online unlock',
            },
            {
                name: 'Mark for Rejoin',
                value: 'markForRejoin',
                description: 'Mark computers for rejoin',
                action: 'Mark computers for rejoin',
            },
        ],
        default: 'delete',
    },

    // Computer Delete Fields
    {
        displayName: 'Computer IDs',
        name: 'computerIds',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['computer'],
                operation: ['delete', 'executeActions', 'markForRejoin'],
            },
        },
        default: '',
        required: true,
        description: 'Comma-separated list of computer IDs (UUIDs)',
    },
    {
        displayName: 'Delete Recovery Data',
        name: 'deleteRecoveryData',
        type: 'boolean',
        displayOptions: {
            show: {
                resource: ['computer'],
                operation: ['delete'],
            },
        },
        default: false,
        description: 'Whether to delete recovery data',
    },
    {
        displayName: 'Delete Events',
        name: 'deleteEvents',
        type: 'boolean',
        displayOptions: {
            show: {
                resource: ['computer'],
                operation: ['delete'],
            },
        },
        default: false,
        description: 'Whether to delete all events from the computers',
    },
    {
        displayName: 'Delete Group Definitions',
        name: 'deleteGroupDefinitions',
        type: 'boolean',
        displayOptions: {
            show: {
                resource: ['computer'],
                operation: ['delete'],
            },
        },
        default: false,
        description: 'Whether to remove computers from static group definitions',
    },

    // Computer Execute Actions Fields
    {
        displayName: 'Actions',
        name: 'actions',
        type: 'json',
        displayOptions: {
            show: {
                resource: ['computer'],
                operation: ['executeActions'],
            },
        },
        default: '{\n  "configUpdate": {\n    "delayInSeconds": 0\n  }\n}',
        description: 'Actions to execute (JSON format)',
    },
    {
        displayName: 'Notify Agent',
        name: 'notifyAgent',
        type: 'boolean',
        displayOptions: {
            show: {
                resource: ['computer'],
                operation: ['executeActions'],
            },
        },
        default: false,
        description: 'Whether to notify the agent immediately',
    },

    // Online Unlock Fields
    {
        displayName: 'Computer ID',
        name: 'computerId',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['computer'],
                operation: ['onlineUnlock', 'stopOnlineUnlock'],
            },
        },
        default: '',
        required: true,
        description: 'Computer ID (UUID)',
    },
    {
        displayName: 'Unlock Data',
        name: 'unlockData',
        type: 'json',
        displayOptions: {
            show: {
                resource: ['computer'],
                operation: ['onlineUnlock'],
            },
        },
        default: '{\n  "secondsToUnlock": 1800,\n  "allDrives": true,\n  "allDevices": true\n}',
        description: 'Unlock configuration (JSON format)',
    },

    // Mark for Rejoin Fields
    {
        displayName: 'Allow to Rejoin',
        name: 'allowToRejoin',
        type: 'boolean',
        displayOptions: {
            show: {
                resource: ['computer'],
                operation: ['markForRejoin'],
            },
        },
        default: true,
        description: 'Whether to allow one-time ID token change',
    },
];