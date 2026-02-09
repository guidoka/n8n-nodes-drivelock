import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeOperationError,
} from 'n8n-workflow';

export class Drivelockrawapi implements INodeType {
	description: INodeTypeDescription = {
		usableAsTool: true,
		displayName: 'DriveLock Management RAW API',
		name: 'drivelockrawapi',
		icon: 'file:drivelock.svg',
		group: ['transform'],
		version: [1],
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'DriveLock Management API - Computer, Entity, Group, Rules & Policy',
		defaults: {
			name: 'DriveLock',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'driveLockApi',
				required: true,
			},
		],
		properties: [
			// Resource Selection
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Application Rule',
						value: 'applicationRules',
					},
					{
						name: 'Computer',
						value: 'computer',
					},
					{
						name: 'Device Rule',
						value: 'deviceRules',
					},
					{
						name: 'Drive Rule',
						value: 'driveRules',
					},
					{
						name: 'Entity',
						value: 'entity',
					},
					{
						name: 'Group',
						value: 'group',
					},
					{
						name: 'Policy',
						value: 'policy',
					},
				],
				default: 'computer',
			},

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
						name: 'Get List',
						value: 'getList',
						description: 'Get a list of entities',
						action: 'Get a list of entities',
					},
					{
						name: 'Get Count',
						value: 'getCount',
						description: 'Get count of entities',
						action: 'Get count of entities',
					},
					{
						name: 'Get by ID',
						value: 'getById',
						description: 'Get entity by ID',
						action: 'Get entity by ID',
					},
					{
						name: 'Export',
						value: 'export',
						description: 'Export entities to CSV or JSON',
						action: 'Export entities',
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
				// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
				options: [
					{
						name: 'ACBinaries',
						value: 'ACBinaries',
					},
					{
						name: 'Computers',
						value: 'Computers',
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
						name: 'Policies',
						value: 'Policies',
					},
					{
						name: 'Software',
						value: 'Software',
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
					},
				},
				default: false,
				description: 'Whether to include one-to-one relation properties',
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
						displayName: 'Query (RQL)',
						name: 'query',
						type: 'string',
						default: '',
						description: 'RQL query for filtering (e.g., eq(name,"MyComputer"))',
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
				],
			},

			// Export Specific Fields
			{
				displayName: 'Export Format',
				name: 'exportFormat',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['entity'],
						operation: ['export'],
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

			// =====================================
			// Application Rules Operations
			// =====================================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['applicationRules'],
					},
				},
				options: [
					{
						name: 'Get Rules',
						value: 'getRules',
						description: 'Get application rules from a policy',
						action: 'Get application rules',
					},
					{
						name: 'Create Rules',
						value: 'createRules',
						description: 'Create application rules',
						action: 'Create application rules',
					},
					{
						name: 'Update Rules',
						value: 'updateRules',
						description: 'Update application rules',
						action: 'Update application rules',
					},
					{
						name: 'Delete Rules',
						value: 'deleteRules',
						description: 'Delete application rules',
						action: 'Delete application rules',
					},
				],
				default: 'getRules',
			},

			// Application Rules Common Fields
			{
				displayName: 'Config ID',
				name: 'configId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['applicationRules'],
					},
				},
				default: '',
				required: true,
				description: 'The policy ID',
			},
			{
				displayName: 'Config Version',
				name: 'configVersion',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['applicationRules'],
					},
				},
				default: 0,
				description: 'Policy version (0 for latest)',
			},

			// Create/Update Rules
			{
				displayName: 'Rules',
				name: 'rules',
				type: 'json',
				displayOptions: {
					show: {
						resource: ['applicationRules'],
						operation: ['createRules', 'updateRules'],
					},
				},
				default: '[]',
				required: true,
				description: 'Array of rules in JSON format',
			},

			// Delete Rules
			{
				displayName: 'Rule IDs',
				name: 'ruleIds',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['applicationRules'],
						operation: ['deleteRules'],
					},
				},
				default: '',
				required: true,
				description: 'Comma-separated list of rule IDs to delete',
			},

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
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentialType = 'driveLockApi';
		const credentials = await this.getCredentials(credentialType);
		const baseUrl = (credentials.baseUrl as string || 'https://api.drivelock.cloud').replace(/\/$/, '');

		// Helper function to safely extract response data and avoid circular references
		const extractResponseData = (response: unknown): IDataObject => {
			if (!response) return { success: true };
			if (typeof response === 'string') return { data: response };
			if (typeof response === 'object' && response !== null) {
				// Remove circular references and only keep serializable data
				const responseObj = response as Record<string, unknown>;
				const { errorId, error, data, total, additionalInfo, ...rest } = responseObj;
				
				const result: IDataObject = {
					success: !error,
				};
				
				if (errorId !== undefined && errorId !== null) {
					result.errorId = errorId;
				}
				if (error !== undefined && error !== null) {
					result.error = error;
				}
				if (data !== undefined) {
					result.data = data;
				}
				if (total !== undefined) {
					result.total = total;
				}
				if (additionalInfo !== undefined && additionalInfo !== null) {
					result.additionalInfo = additionalInfo;
				}
				
				// Add remaining properties
				Object.keys(rest).forEach(key => {
					if (rest[key] !== undefined && rest[key] !== null) {
						result[key] = rest[key];
					}
				});
				
				return result;
			}
			return { success: true, data: response };
		};

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'computer') {
					// =====================================
					// Computer Operations
					// =====================================
					if (operation === 'delete') {
						const computerIdsStr = this.getNodeParameter('computerIds', i) as string;
						const computerIds = computerIdsStr.split(',').map(id => id.trim());
						const deleteRecoveryData = this.getNodeParameter('deleteRecoveryData', i) as boolean;
						const deleteEvents = this.getNodeParameter('deleteEvents', i) as boolean;
						const deleteGroupDefinitions = this.getNodeParameter('deleteGroupDefinitions', i) as boolean;

						const body = {
							computerIds,
							deleteRecoveryData,
							deleteEvents,
							deleteGroupDefinitions,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'POST',
								url: `${baseUrl}/api/administration/computer/delete`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'executeActions') {
						const computerIdsStr = this.getNodeParameter('computerIds', i) as string;
						const computerIds = computerIdsStr.split(',').map(id => id.trim());
						const actionsStr = this.getNodeParameter('actions', i) as string;
						const notifyAgent = this.getNodeParameter('notifyAgent', i) as boolean;

						let actions;
						try {
							actions = JSON.parse(actionsStr);
						} catch {
							throw new NodeOperationError(this.getNode(), 'Invalid JSON in actions field');
						}

						const body = {
							computerIds,
							actions,
							notifyAgent,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'POST',
								url: `${baseUrl}/api/administration/computer/actions`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'onlineUnlock') {
						const computerId = this.getNodeParameter('computerId', i) as string;
						const unlockDataStr = this.getNodeParameter('unlockData', i) as string;

						let data;
						try {
							data = JSON.parse(unlockDataStr);
						} catch {
							throw new NodeOperationError(this.getNode(), 'Invalid JSON in unlock data field');
						}

						const body = {
							computerId,
							data,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'POST',
								url: `${baseUrl}/api/administration/computer/online/unlock`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'stopOnlineUnlock') {
						const computerId = this.getNodeParameter('computerId', i) as string;

						const body = {
							computerId,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'POST',
								url: `${baseUrl}/api/administration/computer/online/stopUnlock`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'markForRejoin') {
						const computerIdsStr = this.getNodeParameter('computerIds', i) as string;
						const computerIds = computerIdsStr.split(',').map(id => id.trim());
						const allowToRejoin = this.getNodeParameter('allowToRejoin', i) as boolean;

						const body = {
							computerIds,
							allowToRejoin,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'POST',
								url: `${baseUrl}/api/administration/computer/markAgentForRejoin`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					}
				} else if (resource === 'entity') {
					// =====================================
					// Entity Operations
					// =====================================
					const entityName = this.getNodeParameter('entityName', i) as string;

					if (operation === 'getList') {
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

						const qs: IDataObject = {};
						if (additionalFields.select) qs.select = additionalFields.select;
						if (additionalFields.query) qs.query = additionalFields.query;
						if (additionalFields.sortBy) qs.sortBy = additionalFields.sortBy;
						if (additionalFields.groupBy) qs.groupBy = additionalFields.groupBy;
						if (additionalFields.skip !== undefined) qs.skip = additionalFields.skip;
						if (additionalFields.take !== undefined) qs.take = additionalFields.take;
						if (additionalFields.getTotalCount !== undefined)
							qs.getTotalCount = additionalFields.getTotalCount;
						if (additionalFields.includeLinkedObjects !== undefined)
							qs.includeLinkedObjects = additionalFields.includeLinkedObjects;
						if (additionalFields.getFullObjects !== undefined)
							qs.getFullObjects = additionalFields.getFullObjects;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'GET',
								url: `${baseUrl}/api/administration/entity/${entityName}`,
								qs,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'getCount') {
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

						const qs: IDataObject = {};
						if (additionalFields.query) qs.query = additionalFields.query;
						if (additionalFields.groupBy) qs.groupBy = additionalFields.groupBy;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'GET',
								url: `${baseUrl}/api/administration/entity/${entityName}/count`,
								qs,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'getById') {
						const entityId = this.getNodeParameter('entityId', i) as string;
						const includeLinkedObjects = this.getNodeParameter(
							'includeLinkedObjects',
							i,
						) as boolean;

						const qs: IDataObject = {
							includeLinkedObjects,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'GET',
								url: `${baseUrl}/api/administration/entity/${entityName}/${entityId}`,
								qs,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'export') {
						const exportFormat = this.getNodeParameter('exportFormat', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
						const exportOptions = this.getNodeParameter('exportOptions', i) as IDataObject;

						const qs: IDataObject = {
							exportFormat,
						};

						if (additionalFields.select) qs.select = additionalFields.select;
						if (additionalFields.query) qs.query = additionalFields.query;
						if (additionalFields.sortBy) qs.sortBy = additionalFields.sortBy;
						if (additionalFields.groupBy) qs.groupBy = additionalFields.groupBy;
						if (additionalFields.skip !== undefined) qs.skip = additionalFields.skip;
						if (additionalFields.take !== undefined) qs.take = additionalFields.take;
						if (additionalFields.includeLinkedObjects !== undefined)
							qs.includeLinkedObjects = additionalFields.includeLinkedObjects;
						if (additionalFields.getFullObjects !== undefined)
							qs.getFullObjects = additionalFields.getFullObjects;

						if (exportOptions.readability !== undefined)
							qs.readability = exportOptions.readability;
						if (exportOptions.separator) qs.separator = exportOptions.separator;
						if (exportOptions.language) qs.language = exportOptions.language;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'GET',
								url: `${baseUrl}/api/administration/entity/${entityName}/export`,
								qs,
							},
						);

						returnData.push(extractResponseData(response));
					}
				} else if (resource === 'group') {
					// =====================================
					// Group Operations
					// =====================================
					const groupId = this.getNodeParameter('groupId', i) as string;

					if (operation === 'addComputers') {
						const computerIdsStr = this.getNodeParameter('computerIds', i) as string;
						const computerIds = computerIdsStr.split(',').map((id) => id.trim());

						const body = {
							groupId,
							computerIds,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'POST',
								url: `${baseUrl}/api/administration/group/${groupId}/members/add`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'removeComputers') {
						const computerIdsStr = this.getNodeParameter('computerIds', i) as string;
						const computerIds = computerIdsStr.split(',').map((id) => id.trim());

						const body = {
							groupId,
							computerIds,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'POST',
								url: `${baseUrl}/api/administration/group/${groupId}/members/remove`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'setMembers') {
						const computerIdsStr = this.getNodeParameter('computerIds', i) as string;
						const computerIds = computerIdsStr.split(',').map((id) => id.trim());

						const body = {
							groupId,
							computerIds,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'PUT',
								url: `${baseUrl}/api/administration/group/${groupId}/members`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'getMembers') {
						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'GET',
								url: `${baseUrl}/api/administration/group/${groupId}/members`,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					}
				} else if (resource === 'applicationRules') {
					// =====================================
					// Application Rules Operations
					// =====================================
					const configId = this.getNodeParameter('configId', i) as string;
					const configVersion = this.getNodeParameter('configVersion', i) as number;

					if (operation === 'getRules') {
						const qs: IDataObject = {
							configVersion: configVersion || undefined,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'GET',
								url: `${baseUrl}/api/administration/applicationControl/rules/${configId}`,
								qs,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'createRules') {
						const rulesStr = this.getNodeParameter('rules', i) as string;

						let rules;
						try {
							rules = JSON.parse(rulesStr);
						} catch {
							throw new NodeOperationError(this.getNode(), 'Invalid JSON in rules field');
						}

						const body = {
							configId,
							configVersion: configVersion || undefined,
							rules,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'POST',
								url: `${baseUrl}/api/administration/applicationControl/rules`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'updateRules') {
						const rulesStr = this.getNodeParameter('rules', i) as string;

						let rules;
						try {
							rules = JSON.parse(rulesStr);
						} catch {
							throw new NodeOperationError(this.getNode(), 'Invalid JSON in rules field');
						}

						const body = {
							configId,
							configVersion: configVersion || undefined,
							rules,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'PATCH',
								url: `${baseUrl}/api/administration/applicationControl/rules`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'deleteRules') {
						const ruleIdsStr = this.getNodeParameter('ruleIds', i) as string;
						const ruleIds = ruleIdsStr.split(',').map((id) => id.trim());

						const body = {
							configId,
							configVersion: configVersion || undefined,
							ruleIds,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'DELETE',
								url: `${baseUrl}/api/administration/applicationControl/rules`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					}
				} else if (resource === 'deviceRules') {
					// =====================================
					// Device Rules Operations
					// =====================================
					const configId = this.getNodeParameter('configId', i) as string;
					const configVersion = this.getNodeParameter('configVersion', i) as number;

					if (operation === 'getRules') {
						const qs: IDataObject = {
							configVersion: configVersion || undefined,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'GET',
								url: `${baseUrl}/api/administration/deviceControl/rules/${configId}`,
								qs,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'getCollections') {
						const qs: IDataObject = {
							configVersion: configVersion || undefined,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'GET',
								url: `${baseUrl}/api/administration/deviceControl/collections/${configId}`,
								qs,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'createRules') {
						const rulesDataStr = this.getNodeParameter('rulesData', i) as string;

						let rules;
						try {
							rules = JSON.parse(rulesDataStr);
						} catch {
							throw new NodeOperationError(this.getNode(), 'Invalid JSON in rules data field');
						}

						const body = {
							configId,
							configVersion: configVersion || undefined,
							rules,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'POST',
								url: `${baseUrl}/api/administration/deviceControl/rules`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'updateRules') {
						const rulesDataStr = this.getNodeParameter('rulesData', i) as string;

						let rules;
						try {
							rules = JSON.parse(rulesDataStr);
						} catch {
							throw new NodeOperationError(this.getNode(), 'Invalid JSON in rules data field');
						}

						const body = {
							configId,
							configVersion: configVersion || undefined,
							rules,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'PATCH',
								url: `${baseUrl}/api/administration/deviceControl/rules`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'updateCollections') {
						const rulesDataStr = this.getNodeParameter('rulesData', i) as string;

						let collections;
						try {
							collections = JSON.parse(rulesDataStr);
						} catch {
							throw new NodeOperationError(
								this.getNode(),
								'Invalid JSON in collections data field',
							);
						}

						const body = {
							configId,
							configVersion: configVersion || undefined,
							collections,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'PATCH',
								url: `${baseUrl}/api/administration/deviceControl/collections`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'deleteRules') {
						const ruleIdsStr = this.getNodeParameter('ruleIds', i) as string;
						const ruleIds = ruleIdsStr.split(',').map((id) => id.trim());

						const body = {
							configId,
							configVersion: configVersion || undefined,
							ruleIds,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'DELETE',
								url: `${baseUrl}/api/administration/deviceControl/rules`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					}
				} else if (resource === 'driveRules') {
					// =====================================
					// Drive Rules Operations
					// =====================================
					const configId = this.getNodeParameter('configId', i) as string;
					const configVersion = this.getNodeParameter('configVersion', i) as number;

					if (operation === 'getRules') {
						const qs: IDataObject = {
							configVersion: configVersion || undefined,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'GET',
								url: `${baseUrl}/api/administration/driveControl/rules/${configId}`,
								qs,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'getCollections') {
						const qs: IDataObject = {
							configVersion: configVersion || undefined,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'GET',
								url: `${baseUrl}/api/administration/driveControl/collections/${configId}`,
								qs,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'createRules') {
						const rulesDataStr = this.getNodeParameter('rulesData', i) as string;

						let rules;
						try {
							rules = JSON.parse(rulesDataStr);
						} catch {
							throw new NodeOperationError(this.getNode(), 'Invalid JSON in rules data field');
						}

						const body = {
							configId,
							configVersion: configVersion || undefined,
							rules,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'POST',
								url: `${baseUrl}/api/administration/driveControl/rules`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'updateRules') {
						const rulesDataStr = this.getNodeParameter('rulesData', i) as string;

						let rules;
						try {
							rules = JSON.parse(rulesDataStr);
						} catch {
							throw new NodeOperationError(this.getNode(), 'Invalid JSON in rules data field');
						}

						const body = {
							configId,
							configVersion: configVersion || undefined,
							rules,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'PATCH',
								url: `${baseUrl}/api/administration/driveControl/rules`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'updateCollections') {
						const rulesDataStr = this.getNodeParameter('rulesData', i) as string;

						let collections;
						try {
							collections = JSON.parse(rulesDataStr);
						} catch {
							throw new NodeOperationError(
								this.getNode(),
								'Invalid JSON in collections data field',
							);
						}

						const body = {
							configId,
							configVersion: configVersion || undefined,
							collections,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'PATCH',
								url: `${baseUrl}/api/administration/driveControl/collections`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'deleteRules') {
						const ruleIdsStr = this.getNodeParameter('ruleIds', i) as string;
						const ruleIds = ruleIdsStr.split(',').map((id) => id.trim());

						const body = {
							configId,
							configVersion: configVersion || undefined,
							ruleIds,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'DELETE',
								url: `${baseUrl}/api/administration/driveControl/rules`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					}
				} else if (resource === 'policy') {
					// =====================================
					// Policy Operations
					// =====================================
					if (operation === 'get') {
						const policyId = this.getNodeParameter('policyId', i) as string;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'GET',
								url: `${baseUrl}/api/administration/policy/${policyId}`,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'create') {
						const policyDataStr = this.getNodeParameter('policyData', i) as string;

						let policyData;
						try {
							policyData = JSON.parse(policyDataStr);
						} catch {
							throw new NodeOperationError(
								this.getNode(),
								'Invalid JSON in policy data field',
							);
						}

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'POST',
								url: `${baseUrl}/api/administration/policy`,
								body: policyData,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'update') {
						const policyId = this.getNodeParameter('policyId', i) as string;
						const policyDataStr = this.getNodeParameter('policyData', i) as string;

						let policyData;
						try {
							policyData = JSON.parse(policyDataStr);
						} catch {
							throw new NodeOperationError(
								this.getNode(),
								'Invalid JSON in policy data field',
							);
						}

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'PATCH',
								url: `${baseUrl}/api/administration/policy/${policyId}`,
								body: policyData,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'delete') {
						const policyId = this.getNodeParameter('policyId', i) as string;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'DELETE',
								url: `${baseUrl}/api/administration/policy/${policyId}`,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'getAssignments') {
						const policyId = this.getNodeParameter('policyId', i) as string;

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'GET',
								url: `${baseUrl}/api/administration/policy/${policyId}/assignments`,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'assignToGroups') {
						const policyId = this.getNodeParameter('policyId', i) as string;
						const groupIdsStr = this.getNodeParameter('groupIds', i) as string;
						const groupIds = groupIdsStr.split(',').map((id) => id.trim());

						const body = {
							policyId,
							groupIds,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'POST',
								url: `${baseUrl}/api/administration/policy/${policyId}/assign`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: error.message });
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}