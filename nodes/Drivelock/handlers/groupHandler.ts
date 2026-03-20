import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { driveLockApiRequest, extractResponseData } from '../helper/GenericFunctions';
import { validateCommaSeparatedIds } from '../helper/ValidationHelpers';

export async function executeGroupOperation(
	ctx: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject> {
	if (operation === 'addComputerToGroup' || operation === 'removeComputerFromGroup') {
		const groupId = ctx.getNodeParameter('groupId', i) as string;
		const membershipsParam = ctx.getNodeParameter('memberships', i, {}) as {
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
			ctx, 'POST', '/api/administration/group/definedGroupMemberships/computers', body,
		);
		return extractResponseData(response);
	}

	if (operation === 'removeGroupMemberships') {
		const membershipIdsStr = ctx.getNodeParameter('membershipIds', i) as string;
		const membershipIds = validateCommaSeparatedIds(membershipIdsStr, ctx.getNode(), i, 'membershipIds');

		const response = await driveLockApiRequest.call(
			ctx, 'DELETE', '/api/administration/group/definedGroupMemberships', membershipIds,
		);
		return extractResponseData(response);
	}

	throw new NodeOperationError(ctx.getNode(), `Unknown operation: ${operation}`);
}
