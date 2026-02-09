import type { INodeProperties } from 'n8n-workflow';

export const policyOperations: INodeProperties[] = [
    // =====================================
    // Policy Operations
    // =====================================
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['policy'],
            },
        },
        options: [
            {
                name: 'Assign to Groups',
                value: 'assignToGroups',
                description: 'Assign policy to groups',
                action: 'Assign policy to groups',
            },
            {
                name: 'Create',
                value: 'create',
                description: 'Create a new policy',
                action: 'Create policy',
            },
            {
                name: 'Delete',
                value: 'delete',
                description: 'Delete a policy',
                action: 'Delete policy',
            },
            {
                name: 'Get',
                value: 'get',
                description: 'Get policy details',
                action: 'Get policy',
            },
            {
                name: 'Get Assignments',
                value: 'getAssignments',
                description: 'Get policy group assignments',
                action: 'Get policy assignments',
            },
            {
                name: 'Update',
                value: 'update',
                description: 'Update a policy',
                action: 'Update policy',
            },
        ],
        default: 'get',
    },

    {
        displayName: 'Policy ID',
        name: 'policyId',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['policy'],
                operation: ['get', 'update', 'delete', 'assignToGroups', 'getAssignments'],
            },
        },
        default: '',
        required: true,
    },

    {
        displayName: 'Policy Data',
        name: 'policyData',
        type: 'json',
        displayOptions: {
            show: {
                resource: ['policy'],
                operation: ['create', 'update'],
            },
        },
        default: '{\n  "name": "My Policy",\n  "description": ""\n}',
        required: true,
    },

    {
        displayName: 'Group IDs',
        name: 'groupIds',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['policy'],
                operation: ['assignToGroups'],
            },
        },
        default: '',
        required: true,
        description: 'Comma-separated list of group IDs',
    },
];