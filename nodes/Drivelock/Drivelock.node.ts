//import { snakeCase } from 'change-case';

import type {
	INodeType,
	INodeTypeDescription,
    IExecuteFunctions,
    INodeExecutionData,
    // JsonObject,
	// ICredentialDataDecryptedObject,
	// ICredentialsDecrypted,
	// ICredentialTestFunctions, 
	// INodeCredentialTestResult,
	IDataObject,
	//GenericValue,
    ILoadOptionsFunctions,
    INodePropertyOptions,
} from 'n8n-workflow';

import {
    driveLockApiRequest,
	// driveLockApiRequestAllItems,
	// isBase64,
	// validateJSON,
    // validateCredentials,
} from './helper/GenericFunctions';

import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
    // LoggerProxy as Logger,
} from 'n8n-workflow';

import * as customPropHelper from './helper/CustomPropertyHelper';
import { DriveLockItem, CustomPropsResponse, CustomProps, ExtensionGroup, DriveLockQuery } from './helper/utils';

import { applicationRuleOperations } from './operations/ApplicationRuleOperations';
import { binariesOperations } from './operations/BinariesOperations';
import { computerOperations } from './operations/ComputerOperations';
import { customPropertyOperations } from './operations/CustomPropertyOperations';
import { deviceRuleOperations } from './operations/DeviceRuleOperations';
import { driveRuleOperations } from './operations/DriveRuleOperations';
import { entityOperations } from './operations/EntityOperations';
import { groupOperations } from './operations/GroupOperations';
import { policyOperations } from './operations/PolicyOperations';


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
				// displayOptions: {
				// 	show: {
				// 		resource: ['computers','users','devices','software','binaries','customproperty']
				// 	},
				// },				
			}
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
	}

	methods = {
		// credentialTest: {
		// 	async driveLockApiTest(
		// 		this: ICredentialTestFunctions,
		// 		credential: ICredentialsDecrypted,
		// 	): Promise<INodeCredentialTestResult> {
		// 		try {
		// 			await validateCredentials.call(this, credential.data as ICredentialDataDecryptedObject);
		// 		} catch (error) {
		// 			const err = error as JsonObject;
		// 			if (err.statusCode === 401) {
		// 				return {
		// 					status: 'Error',
		// 					message: 'Invalid credentials',
		// 				};
		// 			}
		// 		}
		// 		return {
		// 			status: 'OK',
		// 			message: 'Authentication successful',
		// 		};
		// 	},
		// },
		loadOptions: {
			
			async getBinaryProps(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				
				const returnData: INodePropertyOptions[] = [];

				const allOptions = (binariesOperations.find(
  				field => field.name === 'properties'
				)?.options || []) as Array<{ name: string; value: string }>;

				const allValues = allOptions.map(option => option.value);

				Object.entries(allValues).forEach(([, name]) => {
					const propertyName = name
					const propertyId = name
					returnData.push({
						name: propertyName,
						value: propertyId,
					});
				});
				return returnData;
			},

			// Get all the company custom properties to display them to user so that they can
			// select them easily
			async getSchemaExtentions(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				
				const returnData: INodePropertyOptions[] = [];
				

				const customSchemes = await (driveLockApiRequest<CustomPropsResponse>).call(this, 'GET', '/api/administration/entity/customSchema/getCustomSchemas', {});

				const resource = this.getNodeParameter('resource');
				
				let  schemaExtention;
				if (resource=="customproperty") {
					const schema  = this.getNodeParameter('schema') as string;
					schemaExtention = `${schema}Extensions`;
				} else if (resource == "binaries"){
					schemaExtention = `AcBinariesExtensions`;
				}

				if (Array.isArray(customSchemes.data)) {
					throw new NodeApiError(this.getNode(), { message: "invalid API response. data should be an object" });
				} else if (!customSchemes.data.customProps) {
					throw new NodeApiError(this.getNode(), { message: "invalid API response. object is missing" });
				}

				const extensionGroupItems: ExtensionGroup = customSchemes.data.customProps?.[schemaExtention as string] as ExtensionGroup;

				Object.entries(extensionGroupItems).forEach(([key, ]) => {
					const propertyName = key
					const propertyId = key
					returnData.push({
						name: propertyName,
						value: propertyId,
					});
				});
				return returnData;
			},
			async getEntityExtentions(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				
				const returnData: INodePropertyOptions[] = [];
				

				const customSchemes = await (driveLockApiRequest<CustomPropsResponse>).call(this, 'GET', '/api/administration/entity/customSchema/getCustomSchemas', {});

				const entityName = this.getNodeParameter('entityName');
				const  schemaExtention = `${entityName}Extensions`;

				if (Array.isArray(customSchemes.data)) {
					throw new NodeApiError(this.getNode(), { message: "invalid API response. data should be an object" });
				} else if (!customSchemes.data.customProps) {
					throw new NodeApiError(this.getNode(), { message: "invalid API response. object is missing" });
				}

				const extensionGroupItems: ExtensionGroup = customSchemes.data.customProps?.[schemaExtention as string] as ExtensionGroup;

				Object.entries(extensionGroupItems).forEach(([key, ]) => {
					const propertyName = key
					const propertyId = key
					returnData.push({
						name: propertyName,
						value: propertyId,
					});
				});
				return returnData;
			},			
        },
	}; 

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		
		const items = this.getInputData();
		//const returnData: INodeExecutionData[] = [];
		const returnData: IDataObject[] = [];

		const length = items.length;

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

		for (let i = 0; i < length; i++) {

			try {

				// const resource = this.getNodeParameter('resource', i);
				// const operation = this.getNodeParameter('operation', i);

				if (resource === 'tool') {

					if (operation === 'changeoutput') {
						const items = this.getInputData();

						const returnData = items.flatMap((item) => {
							const dataArray = item?.json?.data;
							
							if (!Array.isArray(dataArray)) {
								return [];
							}
							
							return dataArray.map((dataItem: unknown) => ({ 
								json: dataItem as IDataObject 
							}));
						});

						return [returnData];
					}

				} else if (resource === 'customproperty') {

					

					const schema  = this.getNodeParameter('schema', i) as string;
					const schemaExtention = `${schema}Extensions`; //Check is on Extensions

					if (operation === 'check') {

						const createOrUpdateIfNotExists = this.getNodeParameter('createOrUpdateIfNotExists', i);
						const customProperties = (this.getNodeParameter('customProperties', i) as IDataObject).customPropertyValues as IDataObject[];

						//request custom schemes (you get all - there is no filter)
						let customSchemes = await (driveLockApiRequest<CustomPropsResponse>).call(this, 'GET', '/api/administration/entity/customSchema/getCustomSchemas', {});

						if (Array.isArray(customSchemes.data)) {
							throw new NodeApiError(this.getNode(), { message: "invalid API response. data should be an object" });
						} else if (!customSchemes.data.customProps) {
							throw new NodeApiError(this.getNode(), { message: "invalid API response. object is missing" });
						}

						let checkResult = customPropHelper.checkPropsAndTypes(customSchemes.data?.customProps?.[schemaExtention as string] as ExtensionGroup,
																			customProperties
																			);

						let allPropertiesFound = !Object.values(checkResult).some(v => v.name !== true);
						let allDataTypesCorrect = !Object.values(checkResult).some(v => v.datatype !== true);
						let allNotChanged = !Object.values(checkResult).some(v => v.changed !== false);						

						if (allDataTypesCorrect && (createOrUpdateIfNotExists || !allNotChanged)) {

							const adjustedProps = customPropHelper.adjustProps(checkResult, schemaExtention as string, customSchemes.data?.customProps as CustomProps, customProperties as IDataObject[]);
							const endpoint = `/api/administration/entity/customSchema/setCustomSchemas`;
							const body = {"customProps": adjustedProps};
							const updateResult = await driveLockApiRequest.call(this, 'POST', endpoint, body, {}, {returnFullResponse: true});

							if (updateResult.statusCode !== 200) {
								throw new NodeOperationError(this.getNode(), `The update errored for some reasons - returned not with status-code 200. ${updateResult.body}`, { itemIndex: i });
							} else {
								customSchemes = await (driveLockApiRequest<CustomPropsResponse>).call(this, 'GET', '/api/administration/entity/customSchema/getCustomSchemas', {});
								if (Array.isArray(customSchemes.data)) {
									throw new NodeApiError(this.getNode(), { message: "invalid API response. data should be an object" });
								} else if (!customSchemes.data.customProps) {
									throw new NodeApiError(this.getNode(), { message: "invalid API response. object is missing" });
								}								
								checkResult = customPropHelper.checkPropsAndTypes(customSchemes.data?.customProps?.[schemaExtention as string] as ExtensionGroup, customProperties);
								//fixme - rework this
								allPropertiesFound = !Object.values(checkResult).some(v => v.name !== true);
								allDataTypesCorrect = !Object.values(checkResult).some(v => v.datatype !== true);
								allNotChanged = !Object.values(checkResult).some(v => v.changed !== false);
							}

						}

						const success : boolean = (allPropertiesFound && allDataTypesCorrect);
						const responseData: IDataObject = { allPropertiesFound, allDataTypesCorrect, allNotChanged, details: checkResult };

						if (success) {

							returnData.push(responseData);

						} else {

							const outputData = JSON.stringify(responseData);

							if (!createOrUpdateIfNotExists){
								const errorMsg = `Please configure the Custom properties proper here or in DOC. Tick the 'Create properties ...' Button to create missing entires here (or in DOC).\n\nCheck says ${outputData}`;
								throw new NodeOperationError(this.getNode(), errorMsg, { itemIndex: i });
							} else if (!allPropertiesFound) {
								throw new NodeOperationError(this.getNode(), `While trying to create Some custom properties are missing or have incorrect data types. Details: ${outputData}`, { itemIndex: i });
							} else if (!allDataTypesCorrect){
								throw new NodeOperationError(this.getNode(), `Some custom properties are missing or have incorrect data types. Details: ${outputData}`, { itemIndex: i });
							}

						}

					} else if (operation === 'update') {

						const customPropertyId = (this.getNodeParameter('customPropertyId', i) as IDataObject);
						const updateProperties = (this.getNodeParameter('updateProperties', i) as IDataObject).customPropertiesValues as IDataObject[];
						const payload = customPropHelper.createSetPayload(customPropertyId.value as string, updateProperties);

						const url = `/api/administration/entity/customSchema/setCustomData/${schemaExtention}`;
						await driveLockApiRequest.call(this, 'POST', url, payload);

						returnData.push({success:true, payload:payload});

					}

				} else if (resource === 'binaries') {

					if (operation === 'getAll') {

						const endpoint = `/api/administration/entity/AcBinaries`
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const getFullObject = this.getNodeParameter('getFullObject', i) as boolean;

						let select_fields;

						if (!getFullObject) {
							const propertiesToInclude = this.getNodeParameter('properties', i);
							const extentionPropertiesToInclude = this.getNodeParameter('extentionproperties', i);

							if (Array.isArray(propertiesToInclude)) {
								select_fields = propertiesToInclude.map(key => `${key}`).join(',');
							}
							if (Array.isArray(extentionPropertiesToInclude)) {
								const select_extentionfields = extentionPropertiesToInclude.map(key => `extensions.${key}`).join(',');
								if (select_extentionfields)
									select_fields += `,${select_extentionfields}`;
							}
						}

						const qs: DriveLockQuery = {
							sortBy: '-extensions.VirusTotalLastFetch',
							select: null,
							query: null,
							getTotalCount: true,
							getFullObjects: getFullObject,
							getAsFlattenedList: false,
						};

						if (!getFullObject)
							qs.select = `id,${select_fields},`;


						qs.take = 500; //this is my internal limit of this custom-node FIXME make this global const
						
						let limit: number = -1;
						if (!returnAll) { //if not every should be returned - in case the limt number (of returned items) is less then take ... lower take to this value

							limit = this.getNodeParameter('limit', i) as number;
							if (qs.take>limit)
								qs.take = limit;

						}

						const responseData  = await (driveLockApiRequest<DriveLockItem[]>).call(this, 'GET', endpoint, {}, qs); //first of all - fire request
						const total = responseData.total ?? 0; //now we got the total counter - this is always set by the API
	
						if (
							(returnAll && qs.take < total) ||
							(!returnAll && qs.take < limit)
						) {

							while (responseData.data?.length < total) {

								qs.skip = responseData.data?.length;
								
								if (!returnAll){
									const nextAll: number = responseData.data?.length + qs.take;
									if (nextAll>limit)
										qs.take = nextAll - (nextAll-limit);
								}

								const additionalData = await (driveLockApiRequest<DriveLockItem[]>).call(this, 'GET', endpoint, {}, qs);							
								if (!Array.isArray(additionalData.data)) {
									throw new NodeOperationError(this.getNode(), `Some custom properties are missing or have incorrect data types. Details`, { itemIndex: i });
								}
								responseData.data.push(...additionalData.data as []);

								if (!returnAll && responseData.data?.length >= limit)
									break;

							}

						}

						responseData.n8nProcessedTotal = responseData.data?.length;

						if (responseData) {

							returnData.push(responseData as IDataObject);

						}
					}

				} else if (resource === 'computer') {
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

					//1st Version of AcBinaries
					// if (entityName === 'AcBinaries' && operation === 'getList') {

					// 	const endpoint = `/api/administration/entity/AcBinaries`
					// 	const returnAll = this.getNodeParameter('returnAll', i) as boolean;
					// 	const getFullObject = this.getNodeParameter('getFullObject', i) as boolean;

					// 	let select_fields;

					// 	if (!getFullObject) {
					// 		const propertiesToInclude = this.getNodeParameter('properties', i);
					// 		const extentionPropertiesToInclude = this.getNodeParameter('extentionproperties', i);

					// 		if (Array.isArray(propertiesToInclude)) {
					// 			select_fields = propertiesToInclude.map(key => `${key}`).join(',');
					// 		}
					// 		if (Array.isArray(extentionPropertiesToInclude)) {
					// 			const select_extentionfields = extentionPropertiesToInclude.map(key => `extensions.${key}`).join(',');
					// 			if (select_extentionfields)
					// 				select_fields += `,${select_extentionfields}`;
					// 		}
					// 	}

					// 	const qs: DriveLockQuery = {
					// 		sortBy: '-extensions.VirusTotalLastFetch',
					// 		select: null,
					// 		query: null,
					// 		getTotalCount: true,
					// 		getFullObjects: getFullObject,
					// 		getAsFlattenedList: false,
					// 	};

					// 	if (!getFullObject)
					// 		qs.select = `id,${select_fields},`;


					// 	qs.take = 500; //this is my internal limit of this custom-node FIXME make this global const
						
					// 	let limit: number = -1;
					// 	if (!returnAll) { //if not every should be returned - in case the limt number (of returned items) is less then take ... lower take to this value

					// 		limit = this.getNodeParameter('limit', i) as number;
					// 		if (qs.take>limit)
					// 			qs.take = limit;

					// 	}

					// 	const responseData  = await (driveLockApiRequest<DriveLockItem[]>).call(this, 'GET', endpoint, {}, qs); //first of all - fire request
					// 	const total = responseData.total ?? 0; //now we got the total counter - this is always set by the API
	
					// 	if (
					// 		(returnAll && qs.take < total) ||
					// 		(!returnAll && qs.take < limit)
					// 	) {

					// 		while (responseData.data?.length < total) {

					// 			qs.skip = responseData.data?.length;
								
					// 			if (!returnAll){
					// 				const nextAll: number = responseData.data?.length + qs.take;
					// 				if (nextAll>limit)
					// 					qs.take = nextAll - (nextAll-limit);
					// 			}

					// 			const additionalData = await (driveLockApiRequest<DriveLockItem[]>).call(this, 'GET', endpoint, {}, qs);							
					// 			if (!Array.isArray(additionalData.data)) {
					// 				throw new NodeOperationError(this.getNode(), `Some custom properties are missing or have incorrect data types. Details`, { itemIndex: i });
					// 			}
					// 			responseData.data.push(...additionalData.data as []);

					// 			if (!returnAll && responseData.data?.length >= limit)
					// 				break;

					// 		}

					// 	}

					// 	responseData.n8nProcessedTotal = responseData.data?.length;
						
					// 	returnData.push(responseData);

					// } else {
						
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

					// }

				} else if (resource === 'group') {

					// =====================================
					// Group Operations
					// =====================================
					if (operation === 'addComputersToGroup') {
						const groupId = this.getNodeParameter('groupId', i) as string;
						const membershipsStr = this.getNodeParameter('memberships', i) as string;

						let memberships;
						try {
							memberships = JSON.parse(membershipsStr);
						} catch {
							throw new NodeOperationError(
								this.getNode(),
								'Invalid JSON in memberships field',
							);
						}

						const body = {
							groupId,
							memberships,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'POST',
								url: `${baseUrl}/api/administration/group/definedGroupMemberships/computers`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'removeGroupMemberships') {
						const membershipIdsStr = this.getNodeParameter('membershipIds', i) as string;
						const membershipIds = membershipIdsStr.split(',').map((id) => id.trim());

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'DELETE',
								url: `${baseUrl}/api/administration/group/definedGroupMemberships`,
								body: membershipIds,
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

					} else if (operation === 'getBehaviorRules') {
						const qs: IDataObject = {
							configVersion: configVersion || undefined,
						};

						const response = await this.helpers.httpRequestWithAuthentication.call(
							this,
							credentialType,
							{
								method: 'GET',
								url: `${baseUrl}/api/administration/applicationControl/behaviorRules/${configId}`,
								qs,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));

					} else if (operation === 'createBehaviorRules') {
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
								url: `${baseUrl}/api/administration/applicationControl/behaviorRules`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'updateBehaviorRules') {
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
								url: `${baseUrl}/api/administration/applicationControl/behaviorRules`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					} else if (operation === 'deleteBehaviorRules') {
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
								url: `${baseUrl}/api/administration/applicationControl/behaviorRules`,
								body,
								json: true,
							},
						);

						returnData.push(extractResponseData(response));
					}




				} else if (resource === 'deviceRules') {
					// ===================================
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

				// if (this.continueOnFail()) {
				// 	const executionErrorData = this.helpers.constructExecutionMetaData(
				// 		this.helpers.returnJsonArray({ error: error.message }),
				// 		{ itemData: { item: i } },
				// 	);

				// 	returnData.push(...executionErrorData);
				// 	continue;
				// }
				// throw error;

				if (this.continueOnFail()) {
					returnData.push({ error: error.message });
					continue;
				}
				throw error;				
			}

		}

		return [this.helpers.returnJsonArray(returnData)];

    };

}
