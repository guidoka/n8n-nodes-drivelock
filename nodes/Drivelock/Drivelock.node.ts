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
import { buildFilterQuery, FilterGroupsParam } from './helper/FilterBuilder';

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
import { parseJsonParameter, validateCommaSeparatedIds } from './helper/ValidationHelpers';
import * as customPropHelper from './helper/CustomPropertyHelper';
import {
	DriveLockItem,
	CustomPropsResponse,
	CustomProps,
	ExtensionGroup,
} from './helper/utils';

import { applicationRuleOperations } from './operations/ApplicationRuleOperations';
import { computerOperations } from './operations/ComputerOperations';
import { customPropertyOperations } from './operations/CustomPropertyOperations';
import { deviceRuleOperations } from './operations/DeviceRuleOperations';
import { driveRuleOperations } from './operations/DriveRuleOperations';
import { entityOperations } from './operations/EntityOperations';
import { groupOperations } from './operations/GroupOperations';

/**
 * Safely extract response data and avoid circular references.
 * Normalizes API responses into a consistent shape with a `success` flag.
 */
function extractResponseData(response: unknown): IDataObject {
	if (!response) return { success: true };
	if (typeof response === 'string') return { data: response };

	if (typeof response === 'object' && response !== null) {
		const responseObj = response as Record<string, unknown>;
		const { errorId, error, data, total, additionalInfo, ...rest } = responseObj;

		const result: IDataObject = {
			success: !error,
		};

		if (errorId !== undefined && errorId !== null) result.errorId = errorId;
		if (error !== undefined && error !== null) result.error = error;
		if (data !== undefined) result.data = data;
		if (total !== undefined) result.total = total;
		if (additionalInfo !== undefined && additionalInfo !== null) {
			result.additionalInfo = additionalInfo;
		}

		for (const key of Object.keys(rest)) {
			if (rest[key] !== undefined && rest[key] !== null) {
				result[key] = rest[key];
			}
		}

		return result;
	}

	return { success: true, data: response };
}

/**
 * Determine rule sub-path and body key from the operation name.
 */
function getControlRuleConfig(operation: string): { ruleSubPath: string; bodyKey: string } {
	if (operation.includes('Collection')) {
		return { ruleSubPath: 'collections', bodyKey: 'collections' };
	}
	if (operation.includes('Behavior')) {
		return { ruleSubPath: 'behaviorRules', bodyKey: 'rules' };
	}
	return { ruleSubPath: 'rules', bodyKey: 'rules' };
}

/**
 * Shared handler for applicationControl, deviceControl, and driveControl rule CRUD.
 */
async function executeControlRuleOperation(
	execFns: IExecuteFunctions,
	controlPath: string,
	dataParamName: string,
	operation: string,
	i: number,
): Promise<IDataObject> {
	const configId = execFns.getNodeParameter('configId', i) as string;
	const configVersion = execFns.getNodeParameter('configVersion', i) as number;
	const { ruleSubPath, bodyKey } = getControlRuleConfig(operation);
	const basePath = `/api/administration/${controlPath}/${ruleSubPath}`;

	if (operation.startsWith('get')) {
		const qs: IDataObject = {};
		if (configVersion > 0) qs.configVersion = configVersion;

		const response = await driveLockApiRequest.call(
			execFns, 'GET', `${basePath}/${configId}`, {}, qs,
		);
		return extractResponseData(response);
	}

	if (operation.startsWith('create') || operation.startsWith('update')) {
		const dataStr = execFns.getNodeParameter(dataParamName, i) as string;
		const parsedData = parseJsonParameter(dataStr, execFns.getNode(), i, dataParamName) as IDataObject;

		const body: IDataObject = { configId };
		if (configVersion > 0) body.configVersion = configVersion;
		body[bodyKey] = parsedData;

		const method = operation.startsWith('create') ? 'POST' : 'PATCH';
		const response = await driveLockApiRequest.call(execFns, method, basePath, body);
		return extractResponseData(response);
	}

	if (operation.startsWith('delete')) {
		const ruleIdsStr = execFns.getNodeParameter('ruleIds', i) as string;
		const ruleIds = validateCommaSeparatedIds(ruleIdsStr, execFns.getNode(), i, 'ruleIds');

		const body: IDataObject = { configId, ruleIds };
		if (configVersion > 0) body.configVersion = configVersion;

		const response = await driveLockApiRequest.call(execFns, 'DELETE', basePath, body);
		return extractResponseData(response);
	}

	throw new NodeOperationError(execFns.getNode(), `Unknown operation: ${operation}`);
}


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
						name: 'Manage Schema Extention',
						value: 'customproperty',
						description: 'Check and manage schema extensions for entities computer, drives, devices, software and binaries',
					},
				],
				default: 'customproperty',
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

		const length = items.length;

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < length; i++) {
			try {

				if (resource === 'customproperty') {

					const schema = this.getNodeParameter('schema', i) as string;
					const schemaExtention = `${schema}Extensions`;

					if (operation === 'check') {

						const createOrUpdateIfNotExists = this.getNodeParameter('createOrUpdateIfNotExists', i) as boolean;
						const customProperties = (this.getNodeParameter('customProperties', i) as IDataObject).customPropertyValues as IDataObject[];

						let customSchemes = await (driveLockApiRequest<CustomPropsResponse>).call(
							this, 'GET', '/api/administration/entity/customSchema/getCustomSchemas', {},
						);

						if (Array.isArray(customSchemes.data)) {
							throw new NodeApiError(this.getNode(), { message: 'invalid API response. data should be an object' });
						} else if (!customSchemes.data.customProps) {
							throw new NodeApiError(this.getNode(), { message: 'invalid API response. object is missing' });
						}

						let checkResult = customPropHelper.checkPropsAndTypes(
							customSchemes.data.customProps[schemaExtention] as ExtensionGroup,
							customProperties,
						);

						let allPropertiesFound = Object.values(checkResult).every((v) => v.name === true);
						let allDataTypesCorrect = Object.values(checkResult).every((v) => v.datatype === true);
						let allNotChanged = Object.values(checkResult).every((v) => v.changed === false);

						if (allDataTypesCorrect && createOrUpdateIfNotExists) {

							const adjustedProps = customPropHelper.adjustProps(
								checkResult,
								schemaExtention,
								customSchemes.data.customProps as CustomProps,
								customProperties,
							);
							const endpoint = '/api/administration/entity/customSchema/setCustomSchemas';
							const body = { customProps: adjustedProps };
							const updateResult = await driveLockApiRequest.call(
								this, 'POST', endpoint, body, {}, { returnFullResponse: true },
							);

							const statusCode = (updateResult as Record<string, unknown>).statusCode as number | undefined;
							if (statusCode !== undefined && statusCode !== 200) {
								throw new NodeOperationError(
									this.getNode(),
									`The update errored - returned status-code ${statusCode}. ${JSON.stringify((updateResult as Record<string, unknown>).body)}`,
									{ itemIndex: i },
								);
							}

							customSchemes = await (driveLockApiRequest<CustomPropsResponse>).call(
								this, 'GET', '/api/administration/entity/customSchema/getCustomSchemas', {},
							);
							if (Array.isArray(customSchemes.data)) {
								throw new NodeApiError(this.getNode(), { message: 'invalid API response. data should be an object' });
							} else if (!customSchemes.data.customProps) {
								throw new NodeApiError(this.getNode(), { message: 'invalid API response. object is missing' });
							}
							checkResult = customPropHelper.checkPropsAndTypes(
								customSchemes.data.customProps[schemaExtention] as ExtensionGroup,
								customProperties,
							);
							allPropertiesFound = Object.values(checkResult).every((v) => v.name === true);
							allDataTypesCorrect = Object.values(checkResult).every((v) => v.datatype === true);
							allNotChanged = Object.values(checkResult).every((v) => v.changed === false);
						}

						const success: boolean = allPropertiesFound && allDataTypesCorrect;
						const responseData: IDataObject = { allPropertiesFound, allDataTypesCorrect, allNotChanged, details: checkResult };

						if (success) {

							returnData.push(responseData);

						} else {

							const outputData = JSON.stringify(responseData);

							if (!createOrUpdateIfNotExists) {
								throw new NodeOperationError(
									this.getNode(),
									`Please configure the Custom properties proper here or in DOC. Tick the 'Create properties ...' Button to create missing entries here (or in DOC).\n\nCheck says ${outputData}`,
									{ itemIndex: i },
								);
							} else if (!allPropertiesFound) {
								throw new NodeOperationError(
									this.getNode(),
									`While trying to create: Some custom properties are missing or have incorrect data types. Details: ${outputData}`,
									{ itemIndex: i },
								);
							} else if (!allDataTypesCorrect) {
								throw new NodeOperationError(
									this.getNode(),
									`Some custom properties have incorrect data types. Details: ${outputData}`,
									{ itemIndex: i },
								);
							}
						}

					} else if (operation === 'update') {

						const customPropertyId = this.getNodeParameter('customPropertyId', i) as IDataObject;
						const updateProperties = (this.getNodeParameter('updateProperties', i) as IDataObject).customPropertiesValues as IDataObject[];
						const payload = customPropHelper.createSetPayload(customPropertyId.value as string, updateProperties);

						const url = `/api/administration/entity/customSchema/setCustomData/${schemaExtention}`;
						await driveLockApiRequest.call(this, 'POST', url, payload);

						returnData.push({ success: true, payload });
					}

				} else if (resource === 'computer') {
					// =====================================
					// Computer Operations
					// =====================================
					if (operation === 'delete') {
						const computerIdsStr = this.getNodeParameter('computerIds', i) as string;
						const computerIds = validateCommaSeparatedIds(computerIdsStr, this.getNode(), i, 'computerIds');
						const deleteRecoveryData = this.getNodeParameter('deleteRecoveryData', i) as boolean;
						const deleteEvents = this.getNodeParameter('deleteEvents', i) as boolean;
						const deleteGroupDefinitions = this.getNodeParameter('deleteGroupDefinitions', i) as boolean;

						const body: IDataObject = {
							computerIds,
							deleteRecoveryData,
							deleteEvents,
							deleteGroupDefinitions,
						};

						const response = await driveLockApiRequest.call(
							this, 'POST', '/api/administration/computer/delete', body,
						);
						returnData.push(extractResponseData(response));

					} else if (operation === 'executeActions') {
						const computerIdsStr = this.getNodeParameter('computerIds', i) as string;
						const computerIds = validateCommaSeparatedIds(computerIdsStr, this.getNode(), i, 'computerIds');
						const actionsStr = this.getNodeParameter('actions', i) as string;
						const notifyAgent = this.getNodeParameter('notifyAgent', i) as boolean;

						const actions = parseJsonParameter(actionsStr, this.getNode(), i, 'actions') as IDataObject;

						const body: IDataObject = { computerIds, actions, notifyAgent };
						const response = await driveLockApiRequest.call(
							this, 'POST', '/api/administration/computer/actions', body,
						);
						returnData.push(extractResponseData(response));

					} else if (operation === 'onlineUnlock') {
						const computerId = this.getNodeParameter('computerId', i) as string;
						const unlockDataStr = this.getNodeParameter('unlockData', i) as string;

						const data = parseJsonParameter(unlockDataStr, this.getNode(), i, 'unlockData') as IDataObject;

						const body: IDataObject = { computerId, data };
						const response = await driveLockApiRequest.call(
							this, 'POST', '/api/administration/computer/online/unlock', body,
						);
						returnData.push(extractResponseData(response));

					} else if (operation === 'stopOnlineUnlock') {
						const computerId = this.getNodeParameter('computerId', i) as string;

						const body: IDataObject = { computerId };
						const response = await driveLockApiRequest.call(
							this, 'POST', '/api/administration/computer/online/stopUnlock', body,
						);
						returnData.push(extractResponseData(response));

					} else if (operation === 'markForRejoin') {
						const computerIdsStr = this.getNodeParameter('computerIds', i) as string;
						const computerIds = validateCommaSeparatedIds(computerIdsStr, this.getNode(), i, 'computerIds');
						const allowToRejoin = this.getNodeParameter('allowToRejoin', i) as boolean;

						const body: IDataObject = { computerIds, allowToRejoin };
						const response = await driveLockApiRequest.call(
							this, 'POST', '/api/administration/computer/markAgentForRejoin', body,
						);
						returnData.push(extractResponseData(response));

					} else if (operation === 'clearAgentIdToken') {
						const computerId = this.getNodeParameter('computerId', i) as string;

						const body: IDataObject = { computerId };
						const response = await driveLockApiRequest.call(
							this, 'POST', '/api/administration/computer/clearAgentIdToken', body,
						);
						returnData.push(extractResponseData(response));

					} else if (operation === 'setImageFlag') {
						const computerId = this.getNodeParameter('computerId', i) as string;
						const imageFlag = this.getNodeParameter('imageFlag', i);

						const body: IDataObject = { computerId, imageFlag };
						const response = await driveLockApiRequest.call(
							this, 'POST', '/api/administration/computer/setImageFlag', body,
						);
						returnData.push(extractResponseData(response));

					} else if (operation === 'stopOnlineUnlocks') {
						const computerIdsStr = this.getNodeParameter('computerIds', i) as string;
						// Parse without strict validation — API handles its own limits per user decision
						// Partial failures treated as success with failure details in output
						const computerIds = computerIdsStr.split(',').map((id) => id.trim()).filter(Boolean);

						const body: IDataObject = { computerIds };
						const response = await driveLockApiRequest.call(
							this, 'POST', '/api/administration/computer/stopOnlineUnlocks', body,
						);
						returnData.push(extractResponseData(response));

					} else if (operation === 'bitlockerRecovery') {
						const recoveryId = this.getNodeParameter('recoveryId', i) as string;

						const body: IDataObject = { recoveryId };
						const response = await driveLockApiRequest.call(
							this, 'POST', '/api/administration/computer/recovery/bitlockerRecovery', body,
						);
						returnData.push(extractResponseData(response));

					} else if (operation === 'bitlocker2goRecovery') {
						const recoveryId = this.getNodeParameter('recoveryId', i) as string;

						const body: IDataObject = { recoveryId };
						const response = await driveLockApiRequest.call(
							this, 'POST', '/api/administration/computer/recovery/bitlocker2goRecovery', body,
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

						if (['AcBinaries', 'Computers', 'Users', 'Devices', 'Softwares', 'DefinedGroupMemberships', 'DriveLockConfigs', 'Drives', 'Events', 'Groups', 'WhiteLists'].includes(entityName)) {
							const propertiesMode = this.getNodeParameter('propertiesMode', i, 'builder') as 'builder' | 'raw';
							if (propertiesMode === 'raw') {
								const propertiesRaw = this.getNodeParameter('propertiesRaw', i, '') as string;
								if (propertiesRaw) qs.select = `id,${propertiesRaw}`;
							} else {
								const propertiesToInclude = this.getNodeParameter('properties', i, []) as string[];
								if (Array.isArray(propertiesToInclude) && propertiesToInclude.length) {
									qs.select = `id,${propertiesToInclude.join(',')}`;
								}
							}
							const sortMode = this.getNodeParameter('sortMode', i, 'builder') as 'builder' | 'raw';
							if (sortMode === 'raw') {
								const sortRaw = this.getNodeParameter('sortRaw', i, '') as string;
								if (sortRaw) qs.sortBy = sortRaw;
							} else {
								const sortFieldsParam = this.getNodeParameter('sortFields', i, { fields: [] }) as { fields?: Array<{ field: string; direction: string }> };
								if (sortFieldsParam.fields?.length) {
									qs.sortBy = sortFieldsParam.fields.map((f) => `${f.direction}${f.field}`).join(',');
								}
							}
							if (additionalFields.getFullObjects !== undefined)
								qs.getFullObjects = additionalFields.getFullObjects;
						} else {
							if (additionalFields.select) qs.select = additionalFields.select;
							if (additionalFields.sortBy) qs.sortBy = additionalFields.sortBy;
						}
						if (additionalFields.groupBy) qs.groupBy = additionalFields.groupBy;
						if (additionalFields.skip !== undefined) qs.skip = additionalFields.skip;
						if (additionalFields.take !== undefined) qs.take = additionalFields.take;
						if (additionalFields.getTotalCount !== undefined)
							qs.getTotalCount = additionalFields.getTotalCount;
						if (additionalFields.includeLinkedObjects !== undefined)
							qs.includeLinkedObjects = additionalFields.includeLinkedObjects;
						if (additionalFields.getAsFlattenedList !== undefined)
							qs.getAsFlattenedList = additionalFields.getAsFlattenedList;

						const filterMode = this.getNodeParameter('filterMode', i, 'builder') as 'builder' | 'raw';
						const filterRaw = this.getNodeParameter('filterRaw', i, '') as string;
						const filterCombinator = this.getNodeParameter('filterCombinator', i, 'and') as 'and' | 'or';
						const filterGroupsParam = this.getNodeParameter('filterGroups', i, { groups: [] }) as FilterGroupsParam;
						const builtQuery = buildFilterQuery(filterMode, filterRaw, filterCombinator, filterGroupsParam);
						if (builtQuery) qs.query = builtQuery;

						const response = await driveLockApiRequest.call(
							this, 'GET', `/api/administration/entity/${entityName}`, {}, qs,
						);
						returnData.push(extractResponseData(response));

					} else if (operation === 'getCount') {
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

						const qs: IDataObject = {};
						if (additionalFields.groupBy) qs.groupBy = additionalFields.groupBy;

						const filterMode = this.getNodeParameter('filterMode', i, 'builder') as 'builder' | 'raw';
						const filterRaw = this.getNodeParameter('filterRaw', i, '') as string;
						const filterCombinator = this.getNodeParameter('filterCombinator', i, 'and') as 'and' | 'or';
						const filterGroupsParam = this.getNodeParameter('filterGroups', i, { groups: [] }) as FilterGroupsParam;
						const builtQuery = buildFilterQuery(filterMode, filterRaw, filterCombinator, filterGroupsParam);
						if (builtQuery) qs.query = builtQuery;

						const response = await driveLockApiRequest.call(
							this, 'GET', `/api/administration/entity/${entityName}/count`, {}, qs,
						);
						returnData.push(extractResponseData(response));

					} else if (operation === 'getById') {
						const entityId = this.getNodeParameter('entityId', i) as string;
						const includeLinkedObjects = this.getNodeParameter('includeLinkedObjects', i) as boolean;

						const qs: IDataObject = { includeLinkedObjects };

						const response = await driveLockApiRequest.call(
							this, 'GET', `/api/administration/entity/${entityName}/${entityId}`, {}, qs,
						);
						returnData.push(extractResponseData(response));

					} else if (operation === 'export') {
						const exportFormat = this.getNodeParameter('exportFormat', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
						const exportOptions = this.getNodeParameter('exportOptions', i) as IDataObject;

						const qs: IDataObject = { exportFormat };

						if (['AcBinaries', 'Computers', 'Users', 'Devices', 'Softwares', 'DefinedGroupMemberships', 'DriveLockConfigs', 'Drives', 'Events', 'Groups', 'WhiteLists'].includes(entityName)) {
							const propertiesMode = this.getNodeParameter('propertiesMode', i, 'builder') as 'builder' | 'raw';
							if (propertiesMode === 'raw') {
								const propertiesRaw = this.getNodeParameter('propertiesRaw', i, '') as string;
								if (propertiesRaw) qs.select = `id,${propertiesRaw}`;
							} else {
								const propertiesToInclude = this.getNodeParameter('properties', i, []) as string[];
								if (Array.isArray(propertiesToInclude) && propertiesToInclude.length) {
									qs.select = `id,${propertiesToInclude.join(',')}`;
								}
							}
							const sortMode = this.getNodeParameter('sortMode', i, 'builder') as 'builder' | 'raw';
							if (sortMode === 'raw') {
								const sortRaw = this.getNodeParameter('sortRaw', i, '') as string;
								if (sortRaw) qs.sortBy = sortRaw;
							} else {
								const sortFieldsParam = this.getNodeParameter('sortFields', i, { fields: [] }) as { fields?: Array<{ field: string; direction: string }> };
								if (sortFieldsParam.fields?.length) {
									qs.sortBy = sortFieldsParam.fields.map((f) => `${f.direction}${f.field}`).join(',');
								}
							}
							if (additionalFields.getFullObjects !== undefined)
								qs.getFullObjects = additionalFields.getFullObjects;
						} else {
							if (additionalFields.select) qs.select = additionalFields.select;
							if (additionalFields.sortBy) qs.sortBy = additionalFields.sortBy;
						}
						if (additionalFields.groupBy) qs.groupBy = additionalFields.groupBy;
						if (additionalFields.skip !== undefined) qs.skip = additionalFields.skip;
						if (additionalFields.take !== undefined) qs.take = additionalFields.take;
						if (additionalFields.includeLinkedObjects !== undefined)
							qs.includeLinkedObjects = additionalFields.includeLinkedObjects;
						if (additionalFields.getAsFlattenedList !== undefined)
							qs.getAsFlattenedList = additionalFields.getAsFlattenedList;
						if (additionalFields.maskUserProperties !== undefined)
							qs.maskUserProperties = additionalFields.maskUserProperties;
						if (additionalFields.maskComputerProperties !== undefined)
							qs.maskComputerProperties = additionalFields.maskComputerProperties;

						const filterMode = this.getNodeParameter('filterMode', i, 'builder') as 'builder' | 'raw';
						const filterRaw = this.getNodeParameter('filterRaw', i, '') as string;
						const filterCombinator = this.getNodeParameter('filterCombinator', i, 'and') as 'and' | 'or';
						const filterGroupsParam = this.getNodeParameter('filterGroups', i, { groups: [] }) as FilterGroupsParam;
						const builtQuery = buildFilterQuery(filterMode, filterRaw, filterCombinator, filterGroupsParam);
						if (builtQuery) qs.query = builtQuery;

						if (exportOptions.readability !== undefined)
							qs.readability = exportOptions.readability;
						if (exportOptions.separator) qs.separator = exportOptions.separator;
						if (exportOptions.language) qs.language = exportOptions.language;

						// Export may return non-JSON (e.g. CSV), disable default JSON parsing
						const response = await driveLockApiRequest.call(
							this, 'GET', `/api/administration/entity/${entityName}/export`,
							{}, qs, { json: false },
						);
						returnData.push(extractResponseData(response));

					} else if (operation === 'getPermissions') {
						const entityId = this.getNodeParameter('entityId', i) as string;

						const body: IDataObject = { entityName, entityId };
						const permResponse = await driveLockApiRequest.call(
							this, 'POST', '/api/administration/entity/getEntityPermissions', body,
						);
						returnData.push(extractResponseData(permResponse));
					}

				} else if (resource === 'group') {
					// =====================================
					// Group Operations
					// =====================================
					if (operation === 'addComputerToGroup' || operation === 'removeComputerFromGroup') {
						const groupId = this.getNodeParameter('groupId', i) as string;
						const membershipsParam = this.getNodeParameter('memberships', i, {}) as {
							membershipValues?: Array<{ computerName: string; comment: string }>;
						};
						const isExclude = operation === 'removeComputerFromGroup';
						const memberships = (membershipsParam.membershipValues ?? []).map((m) => ({
							name: m.computerName,
							isExclude,
							comment: m.comment ?? '',
						}));

						const body: IDataObject = { groupId, memberships };
						const response = await driveLockApiRequest.call(
							this, 'POST', '/api/administration/group/definedGroupMemberships/computers', body,
						);
						returnData.push(extractResponseData(response));

					} else if (operation === 'removeGroupMemberships') {
						const membershipIdsStr = this.getNodeParameter('membershipIds', i) as string;
						const membershipIds = validateCommaSeparatedIds(membershipIdsStr, this.getNode(), i, 'membershipIds');

						const response = await driveLockApiRequest.call(
							this, 'DELETE', '/api/administration/group/definedGroupMemberships', membershipIds,
						);
						returnData.push(extractResponseData(response));
					}

				} else if (resource === 'applicationRules') {
					// =====================================
					// Application Rules Operations
					// =====================================
					returnData.push(
						await executeControlRuleOperation(this, 'applicationControl', 'rules', operation, i),
					);

				} else if (resource === 'deviceRules') {
					// =====================================
					// Device Rules Operations
					// =====================================
					if (operation === 'getRule') {
						const ruleId = this.getNodeParameter('ruleId', i) as string;
						const response = await driveLockApiRequest.call(
							this, 'GET', `/api/administration/deviceControl/rules/${ruleId}`,
						);
						returnData.push(extractResponseData(response));
					} else {
						returnData.push(
							await executeControlRuleOperation(this, 'deviceControl', 'rulesData', operation, i),
						);
					}

				} else if (resource === 'driveRules') {
					// =====================================
					// Drive Rules Operations
					// =====================================
					if (operation === 'getRule') {
						const ruleId = this.getNodeParameter('ruleId', i) as string;
						const response = await driveLockApiRequest.call(
							this, 'GET', `/api/administration/driveControl/rules/${ruleId}`,
						);
						returnData.push(extractResponseData(response));
					} else {
						returnData.push(
							await executeControlRuleOperation(this, 'driveControl', 'rulesData', operation, i),
						);
					}

				}

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
