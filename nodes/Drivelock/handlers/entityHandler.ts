import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { driveLockApiRequest, extractResponseData } from '../helper/GenericFunctions';
import { buildFilterQuery, FilterGroupsParam } from '../helper/FilterBuilder';

export async function executeEntityOperation(
	ctx: IExecuteFunctions,
	operation: string,
	i: number,
): Promise<IDataObject> {
	const entityName = ctx.getNodeParameter('entityName', i) as string;

	const STANDARD_ENTITIES = [
		'AcBinaries', 'Computers', 'Users', 'Devices', 'Softwares',
		'DefinedGroupMemberships', 'DriveLockConfigs', 'Drives', 'Events', 'Groups', 'WhiteLists',
	];
	

	function applyFilterQuery(qs: IDataObject): void {
		const filterMode = ctx.getNodeParameter('filterMode', i, 'builder') as 'builder' | 'raw';
		const filterRaw = ctx.getNodeParameter('filterRaw', i, '') as string;
		const filterCombinator = ctx.getNodeParameter('filterCombinator', i, 'and') as 'and' | 'or';
		const filterGroupsParam = ctx.getNodeParameter('filterGroups', i, { groups: [] }) as FilterGroupsParam;
		const builtQuery = buildFilterQuery(filterMode, filterRaw, filterCombinator, filterGroupsParam);
		if (builtQuery) qs.query = builtQuery;
	}

	function applyPropertiesAndSort(qs: IDataObject): void {
		const propertiesMode = ctx.getNodeParameter('propertiesMode', i, 'builder') as 'builder' | 'raw';
		if (propertiesMode === 'raw') {
			const propertiesRaw = ctx.getNodeParameter('propertiesRaw', i, '') as string;
			if (propertiesRaw) qs.select = `id,${propertiesRaw}`;
		} else {
			const propertiesToInclude = ctx.getNodeParameter('properties', i, []) as string[];
			if (Array.isArray(propertiesToInclude) && propertiesToInclude.length) {
				qs.select = `id,${propertiesToInclude.join(',')}`;
			}
		}
		const sortMode = ctx.getNodeParameter('sortMode', i, 'builder') as 'builder' | 'raw';
		if (sortMode === 'raw') {
			const sortRaw = ctx.getNodeParameter('sortRaw', i, '') as string;
			if (sortRaw) qs.sortBy = sortRaw;
		} else {
			const sortFieldsParam = ctx.getNodeParameter('sortFields', i, { fields: [] }) as {
				fields?: Array<{ field: string; direction: string }>;
			};
			if (sortFieldsParam.fields?.length) {
				qs.sortBy = sortFieldsParam.fields.map((f) => `${f.direction}${f.field}`).join(',');
			}
		}
	}

	if (operation === 'getList') {
		const additionalFields = ctx.getNodeParameter('additionalFields', i) as IDataObject;
		const qs: IDataObject = {};

		if (STANDARD_ENTITIES.includes(entityName)) {
			applyPropertiesAndSort(qs);
			if (additionalFields.getFullObjects !== undefined) qs.getFullObjects = additionalFields.getFullObjects;
		} else {
			if (additionalFields.select) qs.select = additionalFields.select;
			if (additionalFields.sortBy) qs.sortBy = additionalFields.sortBy;
		}
		if (additionalFields.groupBy) qs.groupBy = additionalFields.groupBy;
		if (additionalFields.skip !== undefined) qs.skip = additionalFields.skip;
		if (additionalFields.take !== undefined) qs.take = additionalFields.take;
		if (additionalFields.getTotalCount !== undefined) qs.getTotalCount = additionalFields.getTotalCount;
		if (additionalFields.includeLinkedObjects !== undefined) qs.includeLinkedObjects = additionalFields.includeLinkedObjects;
		if (additionalFields.getAsFlattenedList !== undefined) qs.getAsFlattenedList = additionalFields.getAsFlattenedList;

		applyFilterQuery(qs);

		const response = await driveLockApiRequest.call(ctx, 'GET', `/api/administration/entity/${entityName}`, {}, qs);
		return extractResponseData(response);
	}

	if (operation === 'getCount') {
		const additionalFields = ctx.getNodeParameter('additionalFields', i) as IDataObject;
		const qs: IDataObject = {};
		if (additionalFields.groupBy) qs.groupBy = additionalFields.groupBy;

		applyFilterQuery(qs);

		const response = await driveLockApiRequest.call(
			ctx, 'GET', `/api/administration/entity/${entityName}/count`, {}, qs,
		);
		return extractResponseData(response);
	}

	if (operation === 'getById') {
		const entityId = ctx.getNodeParameter('entityId', i) as string;
		const includeLinkedObjects = ctx.getNodeParameter('includeLinkedObjects', i) as boolean;

		const qs: IDataObject = { includeLinkedObjects };
		const response = await driveLockApiRequest.call(
			ctx, 'GET', `/api/administration/entity/${entityName}/${entityId}`, {}, qs,
		);
		return extractResponseData(response);
	}

	if (operation === 'export') {
		const exportFormat = ctx.getNodeParameter('exportFormat', i) as string;
		const additionalFields = ctx.getNodeParameter('additionalFields', i) as IDataObject;
		const exportOptions = ctx.getNodeParameter('exportOptions', i) as IDataObject;
		const qs: IDataObject = { exportFormat };

		if (STANDARD_ENTITIES.includes(entityName)) {
			applyPropertiesAndSort(qs);
			if (additionalFields.getFullObjects !== undefined) qs.getFullObjects = additionalFields.getFullObjects;
		} else {
			if (additionalFields.select) qs.select = additionalFields.select;
			if (additionalFields.sortBy) qs.sortBy = additionalFields.sortBy;
		}
		if (additionalFields.groupBy) qs.groupBy = additionalFields.groupBy;
		if (additionalFields.skip !== undefined) qs.skip = additionalFields.skip;
		if (additionalFields.take !== undefined) qs.take = additionalFields.take;
		if (additionalFields.includeLinkedObjects !== undefined) qs.includeLinkedObjects = additionalFields.includeLinkedObjects;
		if (additionalFields.getAsFlattenedList !== undefined) qs.getAsFlattenedList = additionalFields.getAsFlattenedList;
		if (additionalFields.maskUserProperties !== undefined) qs.maskUserProperties = additionalFields.maskUserProperties;
		if (additionalFields.maskComputerProperties !== undefined) qs.maskComputerProperties = additionalFields.maskComputerProperties;

		applyFilterQuery(qs);

		if (exportOptions.readability !== undefined) qs.readability = exportOptions.readability;
		if (exportOptions.separator) qs.separator = exportOptions.separator;
		if (exportOptions.language) qs.language = exportOptions.language;

		// Export may return non-JSON (e.g. CSV), disable default JSON parsing
		const response = await driveLockApiRequest.call(
			ctx, 'GET', `/api/administration/entity/${entityName}/export`, {}, qs, { json: false },
		);
		return extractResponseData(response);
	}

	if (operation === 'getPermissions') {
		const entityId = ctx.getNodeParameter('entityId', i) as string;

		const body: IDataObject = { entityName, entityId };
		const permResponse = await driveLockApiRequest.call(
			ctx, 'POST', '/api/administration/entity/getEntityPermissions', body,
		);
		return extractResponseData(permResponse);
	}

	throw new NodeOperationError(ctx.getNode(), `Unknown operation: ${operation}`);
}
