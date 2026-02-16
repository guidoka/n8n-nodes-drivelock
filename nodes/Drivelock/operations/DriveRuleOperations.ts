import type { INodeProperties } from 'n8n-workflow';

export const driveRuleOperations: INodeProperties[] = [
    // =====================================
    // Drive Rules Operations
    // =====================================
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['driveRules'],
            },
        },
        options: [
            {
                name: 'Create Rules',
                value: 'createRules',
                description: 'Create drive control rules',
                action: 'Create drive rules',
            },
            {
                name: 'Delete Rules',
                value: 'deleteRules',
                description: 'Delete drive control rules',
                action: 'Delete drive rules',
            },
            {
                name: 'Get Collections',
                value: 'getCollections',
                description: 'Get drive collections',
                action: 'Get drive collections',
            },
            {
                name: 'Get Rule by ID',
                value: 'getRule',
                description: 'Get a single drive control rule by its rule ID',
                action: 'Get drive rule by ID',
            },
            {
                name: 'Get Rules',
                value: 'getRules',
                description: 'Get drive control rules',
                action: 'Get drive rules',
            },
            {
                name: 'Update Collections',
                value: 'updateCollections',
                description: 'Update drive collections',
                action: 'Update drive collections',
            },
            {
                name: 'Update Rules',
                value: 'updateRules',
                description: 'Update drive control rules',
                action: 'Update drive rules',
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
                resource: ['driveRules'],
                operation: ['createRules', 'deleteRules', 'getCollections', 'getRules', 'updateCollections', 'updateRules'],
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
                resource: ['driveRules'],
                operation: ['createRules', 'deleteRules', 'getCollections', 'getRules', 'updateCollections', 'updateRules'],
            },
        },
        default: 0,
    },

    {
        displayName: 'Rule Name or ID',
        name: 'ruleId',
        type: 'options',
        typeOptions: {
            loadOptionsMethod: 'getDriveRuleIds',
        },
        displayOptions: {
            show: {
                resource: ['driveRules'],
                operation: ['getRule'],
            },
        },
        default: '',
        required: true,
        description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
    },

    {
        displayName: 'Rules/Collections',
        name: 'rulesData',
        type: 'json',
        displayOptions: {
            show: {
                resource: ['driveRules'],
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
                resource: ['driveRules'],
                operation: ['deleteRules'],
            },
        },
        default: '',
        required: true,
    },
];