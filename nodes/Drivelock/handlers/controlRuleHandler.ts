import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { driveLockApiRequest, extractResponseData } from '../helper/GenericFunctions';
import { parseJsonParameter, validateCommaSeparatedIds } from '../helper/ValidationHelpers';

function getControlRuleConfig(operation: string): { ruleSubPath: string; bodyKey: string } {
	if (operation.includes('Collection')) {
		return { ruleSubPath: 'collections', bodyKey: 'collections' };
	}
	if (operation.includes('Behavior')) {
		return { ruleSubPath: 'behaviorRules', bodyKey: 'rules' };
	}
	return { ruleSubPath: 'rules', bodyKey: 'rules' };
}

export async function executeControlRuleOperation(
	ctx: IExecuteFunctions,
	controlPath: string,
	dataParamName: string,
	operation: string,
	i: number,
): Promise<IDataObject> {
	const configId = ctx.getNodeParameter('configId', i) as string;
	const configVersion = ctx.getNodeParameter('configVersion', i) as number;
	const { ruleSubPath, bodyKey } = getControlRuleConfig(operation);
	const basePath = `/api/administration/${controlPath}/${ruleSubPath}`;

	if (operation.startsWith('get')) {
		const qs: IDataObject = {};
		if (configVersion > 0) qs.configVersion = configVersion;

		const response = await driveLockApiRequest.call(
			ctx, 'GET', `${basePath}/${configId}`, {}, qs,
		);
		return extractResponseData(response);
	}

	if (operation.startsWith('create') || operation.startsWith('update')) {
		const dataStr = ctx.getNodeParameter(dataParamName, i) as string;
		const parsedData = parseJsonParameter(dataStr, ctx.getNode(), i, dataParamName) as IDataObject;

		const body: IDataObject = { configId };
		if (configVersion > 0) body.configVersion = configVersion;
		body[bodyKey] = parsedData;

		const method = operation.startsWith('create') ? 'POST' : 'PATCH';
		const response = await driveLockApiRequest.call(ctx, method, basePath, body);
		return extractResponseData(response);
	}

	if (operation.startsWith('delete')) {
		const ruleIdsStr = ctx.getNodeParameter('ruleIds', i) as string;
		const ruleIds = validateCommaSeparatedIds(ruleIdsStr, ctx.getNode(), i, 'ruleIds');

		const body: IDataObject = { configId, ruleIds };
		if (configVersion > 0) body.configVersion = configVersion;

		const response = await driveLockApiRequest.call(ctx, 'DELETE', basePath, body);
		return extractResponseData(response);
	}

	throw new NodeOperationError(ctx.getNode(), `Unknown operation: ${operation}`);
}

export async function executeApplicationRulesOperation(
	ctx: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject> {
	return executeControlRuleOperation(ctx, 'applicationControl', 'rules', operation, i);
}

export async function executeDeviceRulesOperation(
	ctx: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject> {
	if (operation === 'getRule') {
		const ruleId = ctx.getNodeParameter('ruleId', i) as string;
		const response = await driveLockApiRequest.call(
			ctx, 'GET', `/api/administration/deviceControl/rules/${ruleId}`,
		);
		return extractResponseData(response);
	}
	return executeControlRuleOperation(ctx, 'deviceControl', 'rulesData', operation, i);
}

export async function executeDriveRulesOperation(
	ctx: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject> {
	if (operation === 'getRule') {
		const ruleId = ctx.getNodeParameter('ruleId', i) as string;
		const response = await driveLockApiRequest.call(
			ctx, 'GET', `/api/administration/driveControl/rules/${ruleId}`,
		);
		return extractResponseData(response);
	}
	return executeControlRuleOperation(ctx, 'driveControl', 'rulesData', operation, i);
}
