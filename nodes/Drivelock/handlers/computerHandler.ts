import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { driveLockApiRequest, extractResponseData } from '../helper/GenericFunctions';
import { parseJsonParameter, validateCommaSeparatedIds } from '../helper/ValidationHelpers';

export async function executeComputerOperation(
	ctx: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject> {
	if (operation === 'delete') {
		const computerIdsStr = ctx.getNodeParameter('computerIds', i) as string;
		const computerIds = validateCommaSeparatedIds(computerIdsStr, ctx.getNode(), i, 'computerIds');
		const deleteRecoveryData = ctx.getNodeParameter('deleteRecoveryData', i) as boolean;
		const deleteEvents = ctx.getNodeParameter('deleteEvents', i) as boolean;
		const deleteGroupDefinitions = ctx.getNodeParameter('deleteGroupDefinitions', i) as boolean;

		const body: IDataObject = { computerIds, deleteRecoveryData, deleteEvents, deleteGroupDefinitions };
		const response = await driveLockApiRequest.call(ctx, 'POST', '/api/administration/computer/delete', body);
		return extractResponseData(response);
	}

	if (operation === 'executeActions') {
		const computerIdsStr = ctx.getNodeParameter('computerIds', i) as string;
		const computerIds = validateCommaSeparatedIds(computerIdsStr, ctx.getNode(), i, 'computerIds');
		const actionsStr = ctx.getNodeParameter('actions', i) as string;
		const notifyAgent = ctx.getNodeParameter('notifyAgent', i) as boolean;

		const actions = parseJsonParameter(actionsStr, ctx.getNode(), i, 'actions') as IDataObject;

		const body: IDataObject = { computerIds, actions, notifyAgent };
		const response = await driveLockApiRequest.call(ctx, 'POST', '/api/administration/computer/actions', body);
		return extractResponseData(response);
	}

	if (operation === 'onlineUnlock') {
		const computerId = ctx.getNodeParameter('computerId', i) as string;
		const unlockDataStr = ctx.getNodeParameter('unlockData', i) as string;

		const data = parseJsonParameter(unlockDataStr, ctx.getNode(), i, 'unlockData') as IDataObject;

		const body: IDataObject = { computerId, data };
		const response = await driveLockApiRequest.call(ctx, 'POST', '/api/administration/computer/online/unlock', body);
		return extractResponseData(response);
	}

	if (operation === 'stopOnlineUnlock') {
		const computerId = ctx.getNodeParameter('computerId', i) as string;

		const body: IDataObject = { computerId };
		const response = await driveLockApiRequest.call(ctx, 'POST', '/api/administration/computer/online/stopUnlock', body);
		return extractResponseData(response);
	}

	if (operation === 'markForRejoin') {
		const computerIdsStr = ctx.getNodeParameter('computerIds', i) as string;
		const computerIds = validateCommaSeparatedIds(computerIdsStr, ctx.getNode(), i, 'computerIds');
		const allowToRejoin = ctx.getNodeParameter('allowToRejoin', i) as boolean;

		const body: IDataObject = { computerIds, allowToRejoin };
		const response = await driveLockApiRequest.call(ctx, 'POST', '/api/administration/computer/markAgentForRejoin', body);
		return extractResponseData(response);
	}

	if (operation === 'clearAgentIdToken') {
		const computerId = ctx.getNodeParameter('computerId', i) as string;

		const body: IDataObject = { computerId };
		const response = await driveLockApiRequest.call(ctx, 'POST', '/api/administration/computer/clearAgentIdToken', body);
		return extractResponseData(response);
	}

	if (operation === 'setImageFlag') {
		const computerId = ctx.getNodeParameter('computerId', i) as string;
		const imageFlag = ctx.getNodeParameter('imageFlag', i);

		const body: IDataObject = { computerId, imageFlag };
		const response = await driveLockApiRequest.call(ctx, 'POST', '/api/administration/computer/setImageFlag', body);
		return extractResponseData(response);
	}

	if (operation === 'stopOnlineUnlocks') {
		const computerIdsStr = ctx.getNodeParameter('computerIds', i) as string;
		// Parse without strict validation — API handles its own limits per user decision
		// Partial failures treated as success with failure details in output
		const computerIds = computerIdsStr.split(',').map((id) => id.trim()).filter(Boolean);

		const body: IDataObject = { computerIds };
		const response = await driveLockApiRequest.call(ctx, 'POST', '/api/administration/computer/stopOnlineUnlocks', body);
		return extractResponseData(response);
	}

	if (operation === 'bitlockerRecovery') {
		const recoveryId = ctx.getNodeParameter('recoveryId', i) as string;

		const body: IDataObject = { recoveryId };
		const response = await driveLockApiRequest.call(ctx, 'POST', '/api/administration/computer/recovery/bitlockerRecovery', body);
		return extractResponseData(response);
	}

	if (operation === 'bitlocker2goRecovery') {
		const recoveryId = ctx.getNodeParameter('recoveryId', i) as string;

		const body: IDataObject = { recoveryId };
		const response = await driveLockApiRequest.call(ctx, 'POST', '/api/administration/computer/recovery/bitlocker2goRecovery', body);
		return extractResponseData(response);
	}

	throw new NodeOperationError(ctx.getNode(), `Unknown operation: ${operation}`);
}
