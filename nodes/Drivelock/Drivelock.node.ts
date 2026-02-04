//import { snakeCase } from 'change-case';

import type {
	INodeType,
	INodeTypeDescription,
    IExecuteFunctions,
    INodeExecutionData,
    JsonObject,
	ICredentialDataDecryptedObject,
	ICredentialsDecrypted,
	ICredentialTestFunctions,    
	INodeCredentialTestResult,
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
    validateCredentials,
} from './GenericFunctions';

import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
    // LoggerProxy as Logger,
} from 'n8n-workflow';

import { customPropertyOperations } from './CustomPropertyOperations';
import { binariesOperations } from './BinariesOperations';
import * as customPropHelper from './CustomPropertyHelper';
import { DriveLockItem, CustomPropsResponse, CustomProps, ExtensionGroup, DriveLockQuery } from './utils';

import { applicationRulePropertyOperations } from './ApplicationRulePropertyOperations';

export class Drivelock implements INodeType {
	description: INodeTypeDescription = {
        displayName: 'DriveLock',
        name: 'drivelock',
        icon: 'file:drivelock.svg',
        group: ['transform'],
        version: [1],
        defaultVersion: 1,        
        subtitle: '={{$if($parameter["operation"], $parameter["operation"] + " : ", "") + $parameter["resource"]}}',
        description: 'Consume DriveLock API',
        defaults: {
            name: 'DriveLock Software',
        },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'driveLockApi',
				required: true,
                testedBy: 'driveLockApiTest'
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
						name: 'Manage Computer',
						value: 'computers',
						description: 'Manage the computers',
					},
					{
						name: 'Manage User',
						value: 'users',
						description: 'Manage the users',
					},
					{
						name: 'Manage Device',
						value: 'devices',
						description: 'Manage the devices',
					},
					{
						name: 'Manage Software',
						value: 'software',
						description: 'Manage the software',
					},					
					{
						name: 'Manage Binary',
						value: 'binaries',
						description: 'Manage binaries',
					},
					{
						name: 'Manage Schema Extention',
						value: 'customproperty',
						description: 'Check and manage schema extensions for entities computer, drives, devices, software and binaries',
					},
				],
				default: 'customproperty',
			},
            ...customPropertyOperations,
			...binariesOperations,
            ...applicationRulePropertyOperations,
        ],
	}

	methods = {
		credentialTest: {
			async driveLockApiTest(
				this: ICredentialTestFunctions,
				credential: ICredentialsDecrypted,
			): Promise<INodeCredentialTestResult> {
				try {
					await validateCredentials.call(this, credential.data as ICredentialDataDecryptedObject);
				} catch (error) {
					const err = error as JsonObject;
					if (err.statusCode === 401) {
						return {
							status: 'Error',
							message: 'Invalid credentials',
						};
					}
				}
				return {
					status: 'OK',
					message: 'Authentication successful',
				};
			},
		},
		loadOptions: {
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
        },
	}; 

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const length = items.length;
		// let responseData;
		// const qs: IDataObject = {};
		// const version = this.getNode().typeVersion;


		for (let i = 0; i < length; i++) {

			try {

				const resource = this.getNodeParameter('resource', i);
				const operation = this.getNodeParameter('operation', i);

				if (resource === 'customproperty') {

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

							const executionData = this.helpers.constructExecutionMetaData(
								this.helpers.returnJsonArray(responseData),
								{ itemData: { item: i } },
							);
							returnData.push(...executionData);

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

						const executionData = this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray({success:true, payload:payload}),
							{ itemData: { item: i } },
						);
						returnData.push(...executionData);

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


						qs.take = 10; //this is my internal limit of this custom-node FIXME make this global const
						
						if (!returnAll) { //if not every should be returned - in case the limt number (of returned items) is less then take ... lower take to this value
							const limit = this.getNodeParameter('limit', i) as number;
							if (qs.take>limit)
								qs.take = limit;
						}

						const responseData  = await (driveLockApiRequest<DriveLockItem[]>).call(this, 'GET', endpoint, {}, qs); //first of all - fire request
						const total = responseData.total ?? 0; //now we got the total counter - this is always set by the API
						
						if (total > qs.take) {
							while(responseData.data?.length < total) {
								qs.skip = responseData.data?.length;
								const additionalData = await (driveLockApiRequest<DriveLockItem[]>).call(this, 'GET', endpoint, {}, qs);							
								if (!Array.isArray(additionalData.data)) {
									throw new NodeOperationError(this.getNode(), `Some custom properties are missing or have incorrect data types. Details`, { itemIndex: i });
								}
								responseData.data.push(...additionalData.data as []);
							}
						}

						responseData.n8nProcessedTotal = responseData.data?.length;

						if (responseData) {

							const executionData = this.helpers.constructExecutionMetaData(
								this.helpers.returnJsonArray(responseData as IDataObject),
								{ itemData: { item: i } },
							);
							returnData.push(...executionData);

						}
					}

				}

			} catch (error) {

				if (this.continueOnFail()) {
					const executionErrorData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: error.message }),
						{ itemData: { item: i } },
					);

					returnData.push(...executionErrorData);
					continue;
				}
				throw error;

			}

		}

		return [returnData];

    };

}
