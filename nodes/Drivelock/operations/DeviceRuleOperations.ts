import type { INodeProperties } from 'n8n-workflow';

export const deviceRuleOperations: INodeProperties[] = [
    // =====================================
    // Device Rules Operations
    // =====================================
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['deviceRules'],
            },
        },
        options: [
            {
                name: 'Create Rules',
                value: 'createRules',
                description: 'Create device control rules',
                action: 'Create device rules',
            },
            {
                name: 'Delete Rules',
                value: 'deleteRules',
                description: 'Delete device control rules',
                action: 'Delete device rules',
            },
            {
                name: 'Get Collections',
                value: 'getCollections',
                description: 'Get device collections',
                action: 'Get device collections',
            },
            {
                name: 'Get Rules',
                value: 'getRules',
                description: 'Get device control rules',
                action: 'Get device rules',
            },
            {
                name: 'Update Collections',
                value: 'updateCollections',
                description: 'Update device collections',
                action: 'Update device collections',
            },
            {
                name: 'Update Rules',
                value: 'updateRules',
                description: 'Update device control rules',
                action: 'Update device rules',
            },
        ],
        default: 'getRules',
    },

    {
        displayName: 'Config ID',
        name: 'configId',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['deviceRules'],
            },
        },
        default: '',
        required: true,
    },
    {
        displayName: 'Config Version',
        name: 'configVersion',
        type: 'number',
        displayOptions: {
            show: {
                resource: ['deviceRules'],
            },
        },
        default: 0,
    },

    {
        displayName: 'Rules/Collections',
        name: 'rulesData',
        type: 'json',
        displayOptions: {
            show: {
                resource: ['deviceRules'],
                operation: ['createRules', 'updateRules', 'updateCollections'],
            },
        },
        default: '[]',
        required: true,
    },

    {
        displayName: 'Rule IDs',
        name: 'ruleIds',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['deviceRules'],
                operation: ['deleteRules'],
            },
        },
        default: '',
        required: true,
    },
];