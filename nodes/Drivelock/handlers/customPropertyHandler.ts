import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { driveLockApiRequest } from '../helper/GenericFunctions';
import * as customPropHelper from '../helper/CustomPropertyHelper';
import type { CustomPropsResponse, CustomProps, ExtensionGroup } from '../helper/utils';

export async function executeCustomPropertyOperation(
	ctx: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject> {
	const schema = ctx.getNodeParameter('schema', i) as string;
	const schemaExtention = `${schema}Extensions`;

	if (operation === 'check') {
		const createOrUpdateIfNotExists = ctx.getNodeParameter('createOrUpdateIfNotExists', i) as boolean;
		const customProperties = (ctx.getNodeParameter('customProperties', i) as IDataObject).customPropertyValues as IDataObject[];

		let customSchemes = await (driveLockApiRequest<CustomPropsResponse>).call(
			ctx, 'GET', '/api/administration/entity/customSchema/getCustomSchemas', {},
		);

		if (Array.isArray(customSchemes.data)) {
			throw new NodeApiError(ctx.getNode(), { message: 'invalid API response. data should be an object' });
		} else if (!customSchemes.data.customProps) {
			throw new NodeApiError(ctx.getNode(), { message: 'invalid API response. object is missing' });
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
				ctx, 'POST', endpoint, body, {}, { returnFullResponse: true },
			);

			const statusCode = (updateResult as Record<string, unknown>).statusCode as number | undefined;
			if (statusCode !== undefined && statusCode !== 200) {
				throw new NodeOperationError(
					ctx.getNode(),
					`The update errored - returned status-code ${statusCode}. ${JSON.stringify((updateResult as Record<string, unknown>).body)}`,
					{ itemIndex: i },
				);
			}

			customSchemes = await (driveLockApiRequest<CustomPropsResponse>).call(
				ctx, 'GET', '/api/administration/entity/customSchema/getCustomSchemas', {},
			);
			if (Array.isArray(customSchemes.data)) {
				throw new NodeApiError(ctx.getNode(), { message: 'invalid API response. data should be an object' });
			} else if (!customSchemes.data.customProps) {
				throw new NodeApiError(ctx.getNode(), { message: 'invalid API response. object is missing' });
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
			return responseData;
		}

		const outputData = JSON.stringify(responseData);

		if (!createOrUpdateIfNotExists) {
			throw new NodeOperationError(
				ctx.getNode(),
				`Please configure the Custom properties proper here or in DOC. Tick the 'Create properties ...' Button to create missing entries here (or in DOC).\n\nCheck says ${outputData}`,
				{ itemIndex: i },
			);
		} else if (!allPropertiesFound) {
			throw new NodeOperationError(
				ctx.getNode(),
				`While trying to create: Some custom properties are missing or have incorrect data types. Details: ${outputData}`,
				{ itemIndex: i },
			);
		} else {
			throw new NodeOperationError(
				ctx.getNode(),
				`Some custom properties have incorrect data types. Details: ${outputData}`,
				{ itemIndex: i },
			);
		}
	}

	if (operation === 'update') {
		const customPropertyId = ctx.getNodeParameter('customPropertyId', i) as IDataObject;
		const updateProperties = (ctx.getNodeParameter('updateProperties', i) as IDataObject).customPropertiesValues as IDataObject[];
		const payload = customPropHelper.createSetPayload(customPropertyId.value as string, updateProperties);

		const url = `/api/administration/entity/customSchema/setCustomData/${schemaExtention}`;
		await driveLockApiRequest.call(ctx, 'POST', url, payload);

		return { success: true, payload };
	}

	throw new NodeOperationError(ctx.getNode(), `Unknown operation: ${operation}`);
}
