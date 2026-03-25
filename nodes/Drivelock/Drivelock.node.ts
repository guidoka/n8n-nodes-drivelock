import type {
	INodeType,
	INodeTypeDescription,
	IExecuteFunctions,
	INodeExecutionData,
	IDataObject,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';

import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';

import { driveLockApiRequest } from './helper/GenericFunctions';

import acBinariesFields from './helper/fields/AcBinaries.json';
import computersFields from './helper/fields/Computers.json';
import definedGroupMembershipsFields from './helper/fields/DefinedGroupMemberships.json';
import driveLockConfigsFields from './helper/fields/DriveLockConfigs.json';
import devicesFields from './helper/fields/Devices.json';
import drivesFields from './helper/fields/Drives.json';
import eventsFields from './helper/fields/Events.json';
import groupsFields from './helper/fields/Groups.json';
import softwaresFields from './helper/fields/Softwares.json';
import usersFields from './helper/fields/Users.json';
import whiteListsFields from './helper/fields/WhiteLists.json';

type FilterFieldEntry = { id: string; name: string; type: string };

const FILTER_FIELDS: Record<string, FilterFieldEntry[]> = {
	AcBinaries: acBinariesFields as FilterFieldEntry[],
	Computers: computersFields as FilterFieldEntry[],
	DefinedGroupMemberships: definedGroupMembershipsFields as FilterFieldEntry[],
	DriveLockConfigs: driveLockConfigsFields as FilterFieldEntry[],
	Devices: devicesFields as FilterFieldEntry[],
	Drives: drivesFields as FilterFieldEntry[],
	Events: eventsFields as FilterFieldEntry[],
	Groups: groupsFields as FilterFieldEntry[],
	Softwares: softwaresFields as FilterFieldEntry[],
	Users: usersFields as FilterFieldEntry[],
	WhiteLists: whiteListsFields as FilterFieldEntry[],
};
import {
	DriveLockItem,
	CustomPropsResponse,
	ExtensionGroup,
} from './helper/utils';

import { applicationRuleOperations } from './operations/ApplicationRuleOperations';
import { computerOperations } from './operations/ComputerOperations';
import { customPropertyOperations } from './operations/CustomPropertyOperations';
import { deviceRuleOperations } from './operations/DeviceRuleOperations';
import { driveRuleOperations } from './operations/DriveRuleOperations';
import { entityOperations } from './operations/EntityOperations';
import { groupOperations } from './operations/GroupOperations';

import { executeCustomPropertyOperation } from './handlers/customPropertyHandler';
import { executeComputerOperation } from './handlers/computerHandler';
import { executeEntityOperation } from './handlers/entityHandler';
import { executeGroupOperation } from './handlers/groupHandler';
import {
	executeApplicationRulesOperation,
	executeDeviceRulesOperation,
	executeDriveRulesOperation,
} from './handlers/controlRuleHandler';

type ResourceHandler = (ctx: IExecuteFunctions, operation: string, i: number) => Promise<IDataObject>;

const RESOURCE_HANDLERS: Record<string, ResourceHandler> = {
	customproperty:   executeCustomPropertyOperation,
	computer:         executeComputerOperation,
	entity:           executeEntityOperation,
	group:            executeGroupOperation,
	applicationRules: executeApplicationRulesOperation,
	deviceRules:      executeDeviceRulesOperation,
	driveRules:       executeDriveRulesOperation,
};


export class Drivelock implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'DriveLock API',
		name: 'drivelock',
		icon: 'file:drivelock.svg',
		group: ['transform'],
		version: [1],
		defaultVersion: 1,
		subtitle: '={{$if($parameter["operation"], $parameter["operation"] + " : ", "") + $parameter["resource"]}}',
		description: 'Consume DriveLock API',
		defaults: {
			name: 'DriveLock API',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'driveLockApi',
				required: true,
				testedBy: 'driveLockApiTest',
			},
		],
		usableAsTool: true,
		properties: [
			{
				displayName: 'DriveLock Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Application Rule',
						value: 'applicationRules',
						description: 'Manage application rules',
					},
					{
						name: 'Computer',
						value: 'computer',
						description: 'Manage computers',
					},
					{
						name: 'Device Rule',
						value: 'deviceRules',
						description: 'Manage device rules',
					},
					{
						name: 'Drive Rule',
						value: 'driveRules',
						description: 'Manage drive rules',
					},
					{
						name: 'Entity',
						value: 'entity',
						description: 'Manage entities',
					},
					{
						name: 'Group',
						value: 'group',
						description: 'Manage groups',
					},
					{
						name: 'Manage Schema Extension',
						value: 'customproperty',
						description: 'Check and manage schema extensions for entities computer, drives, devices, software and binaries',
					},
				],
				default: 'applicationRules',
			},
			...applicationRuleOperations,
			...computerOperations,
			...customPropertyOperations,
			...deviceRuleOperations,
			...driveRuleOperations,
			...entityOperations,
			...groupOperations,
		],
	};

	methods = {
		loadOptions: {
			async getFilterFields(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				const resource = this.getCurrentNodeParameter('resource') as string;

				let entityKey: string;
				if (resource === 'entity') {
					entityKey = this.getCurrentNodeParameter('entityName') as string;
				} else {
					return [];
				}

				const fields = FILTER_FIELDS[entityKey] ?? [];
				return fields.map((f) => ({ name: f.name, value: f.id }));
			},

			async getSortFields(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				const resource = this.getCurrentNodeParameter('resource') as string;

				let entityKey: string;
				if (resource === 'entity') {
					entityKey = this.getCurrentNodeParameter('entityName') as string;
				} else {
					return [];
				}

				const staticFields = (FILTER_FIELDS[entityKey] ?? []).map((f) => ({
					name: f.name,
					value: f.id,
				}));

				const supportedEntities = ['AcBinaries', 'Computers', 'Users', 'Devices', 'Softwares'];
				if (!supportedEntities.includes(entityKey)) {
					return staticFields;
				}

				try {
					const customSchemes = await (driveLockApiRequest<CustomPropsResponse>).call(
						this, 'GET', '/api/administration/entity/customSchema/getCustomSchemas', {},
					);
					if (!Array.isArray(customSchemes.data) && customSchemes.data?.customProps) {
						const extensionGroupItems =
							customSchemes.data.customProps[`${entityKey}Extensions`] as ExtensionGroup | undefined;
						if (extensionGroupItems) {
							const extFields = Object.keys(extensionGroupItems).map((key) => ({
								name: `Extension: ${key}`,
								value: `extensions.${key}`,
							}));
							return [...staticFields, ...extFields];
						}
					}
				} catch {
					// fall through to static fields only
				}

				return staticFields;
			},

			async getSchemaExtentions(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				const customSchemes = await (driveLockApiRequest<CustomPropsResponse>).call(
					this, 'GET', '/api/administration/entity/customSchema/getCustomSchemas', {},
				);

				const resource = this.getNodeParameter('resource');

				let schemaExtention: string;
				if (resource === 'customproperty') {
					const schema = this.getNodeParameter('schema') as string;
					schemaExtention = `${schema}Extensions`;
				} else if (resource === 'entity') {
					const entityName = this.getCurrentNodeParameter('entityName') as string;
					const supportedEntities = ['AcBinaries', 'Computers', 'Users', 'Devices', 'Softwares'];
					if (!supportedEntities.includes(entityName)) {
						throw new NodeApiError(this.getNode(), {
							message: `Schema extensions are not available for entity type: ${entityName}`,
						});
					}
					schemaExtention = `${entityName}Extensions`;
				} else {
					throw new NodeApiError(this.getNode(), {
						message: `Unsupported resource for schema extensions: ${resource}`,
					});
				}

				if (Array.isArray(customSchemes.data)) {
					throw new NodeApiError(this.getNode(), { message: 'invalid API response. data should be an object' });
				} else if (!customSchemes.data.customProps) {
					throw new NodeApiError(this.getNode(), { message: 'invalid API response. object is missing' });
				}

				const extensionGroupItems: ExtensionGroup | undefined =
					customSchemes.data.customProps[schemaExtention] as ExtensionGroup | undefined;

				if (!extensionGroupItems) {
					throw new NodeApiError(this.getNode(), {
						message: `Schema extension '${schemaExtention}' not found`,
					});
				}

				return Object.keys(extensionGroupItems).map((key) => ({
					name: key,
					value: key,
				}));
			},

			async getEntityExtentions(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				const customSchemes = await (driveLockApiRequest<CustomPropsResponse>).call(
					this, 'GET', '/api/administration/entity/customSchema/getCustomSchemas', {},
				);

				const entityName = this.getNodeParameter('entityName');
				const schemaExtention = `${entityName}Extensions`;

				if (Array.isArray(customSchemes.data)) {
					throw new NodeApiError(this.getNode(), { message: 'invalid API response. data should be an object' });
				} else if (!customSchemes.data.customProps) {
					throw new NodeApiError(this.getNode(), { message: 'invalid API response. object is missing' });
				}

				const extensionGroupItems: ExtensionGroup | undefined =
					customSchemes.data.customProps[schemaExtention] as ExtensionGroup | undefined;

				if (!extensionGroupItems) {
					throw new NodeApiError(this.getNode(), {
						message: `Schema extension '${schemaExtention}' not found`,
					});
				}

				return Object.keys(extensionGroupItems).map((key) => ({
					name: key,
					value: key,
				}));
			},

			async getComputerIds(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				const response = await (driveLockApiRequest<DriveLockItem[]>).call(
					this,
					'GET',
					'/api/administration/entity/Computers',
					{},
					{ take: 200, select: 'id,name', getTotalCount: false },
				);

				if (!Array.isArray(response.data)) return [];

				return response.data.map((item) => ({
					name: (item.name as string) ?? (item.id as string) ?? 'Unknown',
					value: (item.id as string) ?? '',
				}));
			},

			async getEntityIds(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				const entityName = this.getNodeParameter('entityName', 0) as string;
				const response = await (driveLockApiRequest<DriveLockItem[]>).call(
					this,
					'GET',
					`/api/administration/entity/${entityName}`,
					{},
					{ take: 200, select: 'id,name', getTotalCount: false },
				);

				if (!Array.isArray(response.data)) return [];

				return response.data.map((item) => ({
					name: (item.name as string) ?? (item.id as string) ?? 'Unknown',
					value: (item.id as string) ?? '',
				}));
			},

			async getDeviceRuleIds(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				const qs: IDataObject = { take: 200, select: 'id,name', getTotalCount: false };
				try {
					const configId = this.getNodeParameter('configId', 0) as string;
					if (configId) qs.configId = configId;
				} catch { /* configId not available in getRule context */ }
				try {
					const configVersion = this.getNodeParameter('configVersion', 0) as number;
					if (configVersion) qs.configVersion = configVersion;
				} catch { /* configVersion not available in getRule context */ }
				const response = await (driveLockApiRequest<DriveLockItem[]>).call(
					this,
					'GET',
					'/api/administration/deviceControl/rules',
					{},
					qs,
				);

				if (!Array.isArray(response.data)) return [];

				return response.data.map((item) => ({
					name: (item.name as string) ?? (item.id as string) ?? 'Unknown',
					value: (item.id as string) ?? '',
				}));
			},

			async getDriveRuleIds(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				const qs: IDataObject = { take: 200, select: 'id,name', getTotalCount: false };
				try {
					const configId = this.getNodeParameter('configId', 0) as string;
					if (configId) qs.configId = configId;
				} catch { /* configId not available in getRule context */ }
				try {
					const configVersion = this.getNodeParameter('configVersion', 0) as number;
					if (configVersion) qs.configVersion = configVersion;
				} catch { /* configVersion not available in getRule context */ }
				const response = await (driveLockApiRequest<DriveLockItem[]>).call(
					this,
					'GET',
					'/api/administration/driveControl/rules',
					{},
					qs,
				);

				if (!Array.isArray(response.data)) return [];

				return response.data.map((item) => ({
					name: (item.name as string) ?? (item.id as string) ?? 'Unknown',
					value: (item.id as string) ?? '',
				}));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const handler = RESOURCE_HANDLERS[resource];
				if (!handler) {
					throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`);
				}
				returnData.push(await handler(this, operation, i));
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: (error as Error).message });
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
