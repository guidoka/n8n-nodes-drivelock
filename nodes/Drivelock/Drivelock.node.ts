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
import { parseJsonParameter, validateCommaSeparatedIds } from './helper/ValidationHelpers';
import * as customPropHelper from './helper/CustomPropertyHelper';
import {
	DriveLockItem,
	CustomPropsResponse,
	CustomProps,
	ExtensionGroup,
	DriveLockQuery,
} from './helper/utils';

import { applicationRuleOperations } from './operations/ApplicationRuleOperations';
import { binariesOperations } from './operations/BinariesOperations';
import { computerOperations } from './operations/ComputerOperations';
import { customPropertyOperations } from './operations/CustomPropertyOperations';
import { deviceRuleOperations } from './operations/DeviceRuleOperations';
import { driveRuleOperations } from './operations/DriveRuleOperations';
import { entityOperations } from './operations/EntityOperations';
import { groupOperations } from './operations/GroupOperations';
import { policyOperations } from './operations/PolicyOperations';

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
				// eslint-disable-next-line n8n-nodes-base/node-param-options-type-unsorted-items
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
						name: 'Binary',
						value: 'binaries',
						description: 'Manage binaries',
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
						name: 'Policy',
						value: 'policy',
						description: 'Manage policies',
					},
					{
						name: 'Tool',
						value: 'tool',
						description: 'Tool to handle DriveLock node data',
					},
					{
						name: 'Manage Schema Extention',
						value: 'customproperty',
						description: 'Check and manage schema extensions for entities computer, drives, devices, software and binaries',
					},
				],
				default: 'customproperty',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['tool'],
					},
				},
				options: [
					{
						name: 'Change JSON Data-Return to Item Array',
						value: 'changeoutput',
						description: 'Change the output',
						action: 'Change JSON data return to item array',
					},
				],
				default: 'changeoutput',
			},
			...applicationRuleOperations,
			...binariesOperations,
			...computerOperations,
			...customPropertyOperations,
			...deviceRuleOperations,
			...driveRuleOperations,
			...entityOperations,
			...groupOperations,
			...policyOperations,
		],
	};

	methods = {
		loadOptions: {
			async getBinaryProps(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				const allOptions = (binariesOperations.find(
					(field) => field.name === 'properties',
				)?.options || []) as Array<{ name: string; value: string }>;

				return allOptions.map((option) => ({
					name: option.value,
					value: option.value,
				}));
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
				} else if (resource === 'binaries') {
					schemaExtention = 'AcBinariesExtensions';
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

				if (resource === 'tool') {

					if (operation === 'changeoutput') {
						const toolOutput = items.flatMap((item) => {
							const dataArray = item?.json?.data;

							if (!Array.isArray(dataArray)) {
								return [];
							}

							return dataArray.map((dataItem: unknown) => ({
								json: dataItem as IDataObject,
							}));
						});

						return [toolOutput];
					}

				} else if (resource === 'customproperty') {

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

				} else if (resource === 'binaries') {

					if (operation === 'getAll') {

						const endpoint = '/api/administration/entity/AcBinaries';
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const getFullObject = this.getNodeParameter('getFullObject', i) as boolean;

						let selectFields: string | undefined;

						if (!getFullObject) {
							const propertiesToInclude = this.getNodeParameter('properties', i);
							const extentionPropertiesToInclude = this.getNodeParameter('extentionproperties', i);

							if (Array.isArray(propertiesToInclude)) {
								selectFields = propertiesToInclude.join(',');
							}
							if (Array.isArray(extentionPropertiesToInclude)) {
								const extFields = extentionPropertiesToInclude
									.map((key) => `extensions.${key}`)
									.join(',');
								if (extFields) {
									selectFields = selectFields ? `${selectFields},${extFields}` : extFields;
								}
							}
						}

						const qs: DriveLockQuery = {
							sortBy: '-extensions.VirusTotalLastFetch',
							select: null,
							getTotalCount: true,
							getFullObjects: getFullObject,
							getAsFlattenedList: false,
						};

						if (!getFullObject && selectFields) {
							qs.select = `id,${selectFields}`;
						}

						const pageSize = 500;
						qs.take = pageSize;

						const filterMode = this.getNodeParameter('filterMode', i, 'builder') as 'builder' | 'raw';
						const filterRaw = this.getNodeParameter('filterRaw', i, '') as string;
						const filterCombinator = this.getNodeParameter('filterCombinator', i, 'and') as 'and' | 'or';
						const filterGroupsParam = this.getNodeParameter('filterGroups', i, { groups: [] }) as FilterGroupsParam;
						const builtQuery = buildFilterQuery(filterMode, filterRaw, filterCombinator, filterGroupsParam);
						if (builtQuery) qs.query = builtQuery;

						let limit = -1;
						if (!returnAll) {
							limit = this.getNodeParameter('limit', i) as number;
							if (qs.take > limit) qs.take = limit;
						}

						const responseData = await (driveLockApiRequest<DriveLockItem[]>).call(
							this, 'GET', endpoint, {}, qs,
						);
						const total = responseData.total ?? 0;

						if (Array.isArray(responseData.data)) {
							const targetCount = returnAll ? total : Math.min(limit, total);

							if (responseData.data.length < targetCount) {
								while (responseData.data.length < targetCount) {
									qs.skip = responseData.data.length;

									if (!returnAll) {
										const remaining = limit - responseData.data.length;
										qs.take = Math.min(pageSize, remaining);
									}

									try {
										const additionalData = await (driveLockApiRequest<DriveLockItem[]>).call(
											this, 'GET', endpoint, {}, qs,
										);
										if (!Array.isArray(additionalData.data)) {
											(responseData as Record<string, unknown>).paginationWarning =
												'Unexpected API response during pagination: data is not an array. Returning partial results.';
											break;
										}
										responseData.data.push(...(additionalData.data as DriveLockItem[]));

										if (!returnAll && responseData.data.length >= limit) break;
									} catch (error) {
										(responseData as Record<string, unknown>).paginationWarning =
											`Pagination stopped after fetching ${responseData.data.length} of ${targetCount} items: ${(error as Error).message}`;
										break;
									}
								}
							}
						}

						responseData.n8nProcessedTotal = Array.isArray(responseData.data)
							? responseData.data.length
							: 0;

						returnData.push(responseData as IDataObject);
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
						if (additionalFields.select) qs.select = additionalFields.select;
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

						if (additionalFields.select) qs.select = additionalFields.select;
						if (additionalFields.sortBy) qs.sortBy = additionalFields.sortBy;
						if (additionalFields.groupBy) qs.groupBy = additionalFields.groupBy;
						if (additionalFields.skip !== undefined) qs.skip = additionalFields.skip;
						if (additionalFields.take !== undefined) qs.take = additionalFields.take;
						if (additionalFields.includeLinkedObjects !== undefined)
							qs.includeLinkedObjects = additionalFields.includeLinkedObjects;
						if (additionalFields.getFullObjects !== undefined)
							qs.getFullObjects = additionalFields.getFullObjects;
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
					if (operation === 'addComputersToGroup') {
						const groupId = this.getNodeParameter('groupId', i) as string;
						const membershipsStr = this.getNodeParameter('memberships', i) as string;

						const memberships = parseJsonParameter(membershipsStr, this.getNode(), i, 'memberships') as IDataObject;

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

				} else if (resource === 'policy') {
					// =====================================
					// Policy Operations
					// =====================================
					if (operation === 'get') {
						const policyId = this.getNodeParameter('policyId', i) as string;

						const response = await driveLockApiRequest.call(
							this, 'GET', `/api/administration/policy/${policyId}`,
						);
						returnData.push(extractResponseData(response));

					} else if (operation === 'create') {
						const policyDataStr = this.getNodeParameter('policyData', i) as string;

						const policyData = parseJsonParameter(policyDataStr, this.getNode(), i, 'policyData');

						const response = await driveLockApiRequest.call(
							this, 'POST', '/api/administration/policy', policyData,
						);
						returnData.push(extractResponseData(response));

					} else if (operation === 'update') {
						const policyId = this.getNodeParameter('policyId', i) as string;
						const policyDataStr = this.getNodeParameter('policyData', i) as string;

						const policyData = parseJsonParameter(policyDataStr, this.getNode(), i, 'policyData');

						const response = await driveLockApiRequest.call(
							this, 'PATCH', `/api/administration/policy/${policyId}`, policyData,
						);
						returnData.push(extractResponseData(response));

					} else if (operation === 'delete') {
						const policyId = this.getNodeParameter('policyId', i) as string;

						const response = await driveLockApiRequest.call(
							this, 'DELETE', `/api/administration/policy/${policyId}`,
						);
						returnData.push(extractResponseData(response));

					} else if (operation === 'getAssignments') {
						const policyId = this.getNodeParameter('policyId', i) as string;

						const response = await driveLockApiRequest.call(
							this, 'GET', `/api/administration/policy/${policyId}/assignments`,
						);
						returnData.push(extractResponseData(response));

					} else if (operation === 'assignToGroups') {
						const policyId = this.getNodeParameter('policyId', i) as string;
						const groupIdsStr = this.getNodeParameter('groupIds', i) as string;
						const groupIds = validateCommaSeparatedIds(groupIdsStr, this.getNode(), i, 'groupIds');

						const body: IDataObject = { policyId, groupIds };
						const response = await driveLockApiRequest.call(
							this, 'POST', `/api/administration/policy/${policyId}/assign`, body,
						);
						returnData.push(extractResponseData(response));
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
