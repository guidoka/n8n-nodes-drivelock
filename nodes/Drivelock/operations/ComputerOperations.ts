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
            {
                name: 'Clear Agent ID Token',
                value: 'clearAgentIdToken',
                description:
                    'WARNING: This irreversibly clears the agent ID token. The computer will need to re-register with the DriveLock Enterprise Service. Use with caution.',
                action: 'Clear agent ID token',
            },
            {
                name: 'Set Image Flag',
                value: 'setImageFlag',
                description: 'Set the image flag on a computer (marks it as an image/template)',
                action: 'Set image flag on a computer',
            },
            {
                name: 'Stop Online Unlocks (Bulk)',
                value: 'stopOnlineUnlocks',
                description: 'Stop online unlocks for multiple computers at once',
                action: 'Stop online unlocks for multiple computers',
            },
            {
                name: 'BitLocker Recovery',
                value: 'bitlockerRecovery',
                description:
                    'Retrieve BitLocker recovery key. Note: Recovery keys are returned as plain text. Ensure execution logs are secured appropriately.',
                action: 'Get bit locker recovery key',
            },
            {
                name: 'BitLocker2Go Recovery',
                value: 'bitlocker2goRecovery',
                description:
                    'Retrieve BitLocker2Go recovery key for removable drives. Note: Recovery keys are returned as plain text. Ensure execution logs are secured appropriately.',
                action: 'Get bit locker2 go recovery key',
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

    // Clear Agent ID Token / Set Image Flag Fields
    {
        displayName: 'Computer Name or ID',
        name: 'computerId',
        type: 'options',
        typeOptions: {
            loadOptionsMethod: 'getComputerIds',
        },
        displayOptions: {
            show: {
                resource: ['computer'],
                operation: ['clearAgentIdToken', 'setImageFlag'],
            },
        },
        default: '',
        required: true,
        description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
    },
    {
        displayName: 'Image Flag',
        name: 'imageFlag',
        type: 'options',
        displayOptions: {
            show: {
                resource: ['computer'],
                operation: ['setImageFlag'],
            },
        },
        options: [
            {
                name: 'Set (Mark as Image)',
                value: true,
                description: 'Mark this computer as an image/template',
            },
            {
                name: 'Clear (Unmark as Image)',
                value: false,
                description: 'Remove the image/template flag from this computer',
            },
        ],
        default: true,
        required: true,
        description: 'Choose the image flag value to set on the computer',
    },

    // Stop Online Unlocks (Bulk) Fields
    {
        displayName: 'Computer IDs',
        name: 'computerIds',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['computer'],
                operation: ['stopOnlineUnlocks'],
            },
        },
        default: '',
        required: true,
        description: 'Comma-separated list of computer IDs to stop online unlocks for',
    },

    // BitLocker Recovery Fields
    {
        displayName: 'Recovery ID',
        name: 'recoveryId',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['computer'],
                operation: ['bitlockerRecovery'],
            },
        },
        default: '',
        required: true,
        description: 'The BitLocker recovery identifier (volume ID or recovery password ID)',
    },

    // BitLocker2Go Recovery Fields
    {
        displayName: 'Recovery ID',
        name: 'recoveryId',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['computer'],
                operation: ['bitlocker2goRecovery'],
            },
        },
        default: '',
        required: true,
        description: 'The BitLocker2Go recovery identifier for the removable drive',
    },
];