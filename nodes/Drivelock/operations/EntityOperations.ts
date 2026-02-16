import type { INodeProperties } from 'n8n-workflow';
import { makeFilterProperties } from './FilterOperations';

export const entityOperations: INodeProperties[] = [
    // =====================================
    // Entity Operations
    // =====================================
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
            show: {
                resource: ['entity'],
            },
        },
        options: [
            {
                name: 'Export',
                value: 'export',
                description: 'Export entities to CSV or JSON',
                action: 'Export entities',
            },
            {
                name: 'Get by ID',
                value: 'getById',
                description: 'Get entity by ID',
                action: 'Get entity by ID',
            },
            {
                name: 'Get Count',
                value: 'getCount',
                description: 'Get count of entities',
                action: 'Get count of entities',
            },
            {
                name: 'Get List',
                value: 'getList',
                description: 'Get a list of entities',
                action: 'Get a list of entities',
            },
            {
                name: 'Get Permissions',
                value: 'getPermissions',
                description: 'Get permissions for an entity',
                action: 'Get entity permissions',
            },
        ],
        default: 'getList',
    },

    // Entity Name Selection
    {
        displayName: 'Entity Name',
        name: 'entityName',
        type: 'options',
        displayOptions: {
            show: {
                resource: ['entity'],
            },
        },
        options: [
            {
                name: 'ACBinaries',
                value: 'AcBinaries',
            },
            {
                name: 'Computers',
                value: 'Computers',
            },
            {
                name: 'Defined Group Memberships',
                value: 'DefinedGroupMemberships',
            },
            {
                name: 'Devices',
                value: 'Devices',
            },
            {
                name: 'DriveLock Configs',
                value: 'DriveLockConfigs',
            },            
            {
                name: 'Drives',
                value: 'Drives',
            },
            {
                name: 'Events',
                value: 'Events',
            },
            {
                name: 'Groups',
                value: 'Groups',
            },
            {
                name: 'Software',
                value: 'Softwares',
            },
            {
                name: 'Users',
                value: 'Users',
            },            
            {
                name: 'White Lists',
                value: 'WhiteLists',
            },
        ],
        default: 'Computers',
        required: true,
    },

    // Entity Get by ID
    {
        displayName: 'Entity ID',
        name: 'entityId',
        type: 'string',
        displayOptions: {
            show: {
                resource: ['entity'],
                operation: ['getById'],
                // entityName: ['Computers','Devices','DriveLockConfigs','Drives', 'Events','Groups','Softwares','Users','WhiteLists']
            },
        },
        default: '',
        required: true,
        description: 'The unique identifier of the entity',
    },
    {
        displayName: 'Include Linked Objects',
        name: 'includeLinkedObjects',
        type: 'boolean',
        displayOptions: {
            show: {
                resource: ['entity'],
                operation: ['getById'],
                // entityName: ['Computers','Devices','DefinedGroupMemberships','DriveLockConfigs','Drives', 'Events','Groups','Softwares','Users','WhiteLists']
            },
        },
        default: false,
        description: 'Whether to include one-to-one relation properties',
    },

    // Entity Get Permissions
    {
        displayName: 'Entity Name or ID',
        name: 'entityId',
        type: 'options',
        typeOptions: {
            loadOptionsMethod: 'getEntityIds',
        },
        displayOptions: {
            show: {
                resource: ['entity'],
                operation: ['getPermissions'],
            },
        },
        default: '',
        required: true,
        description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
    },

    // Entity List/Export Common Fields
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
            show: {
                resource: ['entity'],
                operation: ['getList', 'getCount', 'export'],
                // entityName: ['Computers','Devices','DefinedGroupMemberships','DriveLockConfigs','Drives', 'Events','Groups','Softwares','Users','WhiteLists']
            },
        },
        // eslint-disable-next-line n8n-nodes-base/node-param-collection-type-unsorted-items
        options: [
            {
                displayName: 'Select',
                name: 'select',
                type: 'string',
                default: '',
                description: 'Comma-separated list of properties to return (e.g., name,createdAt)',
            },
            {
                displayName: 'Sort By',
                name: 'sortBy',
                type: 'string',
                default: '',
                description: 'Property name to sort by (prefix with - for descending)',
            },
            {
                displayName: 'Group By',
                name: 'groupBy',
                type: 'string',
                default: '',
                description: 'Property name to group by',
            },
            {
                displayName: 'Skip',
                name: 'skip',
                type: 'number',
                default: 0,
                description: 'Number of objects to skip (pagination)',
            },
            {
                displayName: 'Take',
                name: 'take',
                type: 'number',
                default: 100,
                description: 'Maximum number of objects to return',
            },
            {
                displayName: 'Get Total Count',
                name: 'getTotalCount',
                type: 'boolean',
                default: false,
                description: 'Whether to return total count',
            },
            {
                displayName: 'Include Linked Objects',
                name: 'includeLinkedObjects',
                type: 'boolean',
                default: false,
                description: 'Whether you want linked objects in output',
            },
            {
                displayName: 'Get Full Object Data',
                name: 'getFullObjects',
                type: 'boolean',
                default: false,
                description: 'Whether you want the complete data',
            },
            {
                displayName: 'Get as Flattened List',
                name: 'getAsFlattenedList',
                type: 'boolean',
                default: false,
                description: 'Whether to return a flattened list instead of a nested object tree',
            },
        ],
    },
    // Export-only Additional Fields (mask params)
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
            show: {
                resource: ['entity'],
                operation: ['export'],
            },
        },
        options: [
            {
                displayName: 'Mask Computer Properties',
                name: 'maskComputerProperties',
                type: 'boolean',
                default: false,
                description: 'Whether to mask computer-related properties in the export response',
            },
            {
                displayName: 'Mask User Properties',
                name: 'maskUserProperties',
                type: 'boolean',
                default: false,
                description: 'Whether to mask user-related properties in the export response',
            },
        ],
    },
    // Filter Builder — for getList, getCount, export
    ...makeFilterProperties(['entity'], ['getList', 'getCount', 'export']),

    // Export Specific Fields
    {
        displayName: 'Export Format',
        name: 'exportFormat',
        type: 'options',
        displayOptions: {
            show: {
                resource: ['entity'],
                operation: ['export'],
                // entityName: ['Computers','Devices','DefinedGroupMemberships','DriveLockConfigs','Drives', 'Events','Groups','Softwares','Users','WhiteLists']
            },
        },
        options: [
            {
                name: 'CSV',
                value: 'csv',
            },
            {
                name: 'JSON',
                value: 'json',
            },
        ],
        default: 'csv',
        description: 'Export file format',
    },
    {
        displayName: 'Export Options',
        name: 'exportOptions',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        displayOptions: {
            show: {
                resource: ['entity'],
                operation: ['export'],
                // entityName: ['Computers','Devices','DefinedGroupMemberships','DriveLockConfigs','Drives', 'Events','Groups','Softwares','Users','WhiteLists']
            },
        },
        options: [
            {
                displayName: 'Readability',
                name: 'readability',
                type: 'options',
                options: [
                    {
                        name: 'Raw Values',
                        value: 0,
                    },
                    {
                        name: 'Human Readable',
                        value: 1,
                    },
                ],
                default: 0,
                description: 'CSV readability mode',
            },
            {
                displayName: 'Separator',
                name: 'separator',
                type: 'string',
                default: ',',
                description: 'CSV separator character',
            },
            {
                displayName: 'Language',
                name: 'language',
                type: 'options',
                options: [
                    {
                        name: 'English',
                        value: 'en',
                    },
                    {
                        name: 'German',
                        value: 'de',
                    },
                ],
                default: 'en',
                description: 'Language for headers and values',
            },
        ],
    },
    // ...entityBinariesOperations
];