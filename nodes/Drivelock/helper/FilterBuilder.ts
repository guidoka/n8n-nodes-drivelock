// FilterBuilder.ts — RQL serializer and field metadata for the DriveLock filter GUI.
// Pure logic: no n8n-workflow imports needed here.

export type FieldType = 'string' | 'number' | 'boolean' | 'date';

export interface ConditionRow {
	field: string;
	fieldType?: FieldType;
	operator: string;
	negate: boolean;
	value?: string;
	valueList?: string;
}

export interface FilterGroup {
	combinator: 'and' | 'or';
	conditions: { condition?: ConditionRow[] };
}

export interface FilterGroupsParam {
	groups?: FilterGroup[];
}

export interface FieldDefinition {
	name: string;
	displayName: string;
	type: FieldType;
}

// ---------------------------------------------------------------------------
// Field metadata per DriveLock entity type
// The ESLint n8n-nodes-base plugin incorrectly treats FieldDefinition objects
// as INodeProperties (due to shared property names like name/displayName/type).
/* eslint-disable n8n-nodes-base/node-param-default-missing */
const _fieldDefs: Record<string, FieldDefinition[]> = ((): Record<string, FieldDefinition[]> => {
	type FD = FieldDefinition;
	const s = (name: string, displayName: string): FD => ({ name, displayName, type: 'string' });
	const n = (name: string, displayName: string): FD => ({ name, displayName, type: 'number' });
	const b = (name: string, displayName: string): FD => ({ name, displayName, type: 'boolean' });
	const d = (name: string, displayName: string): FD => ({ name, displayName, type: 'date' });

	return {
		Computers: [
			s('name', 'Name'),
			s('id', 'ID'),
			d('createdAt', 'Created At'),
			d('lastSeen', 'Last Seen'),
			s('agentVersion', 'Agent Version'),
			s('operatingSystem', 'Operating System'),
			s('domain', 'Domain'),
			b('active', 'Active'),
		],
		Devices: [
			s('id', 'ID'),
			s('name', 'Name'),
			s('description', 'Description'),
			d('createdAt', 'Created At'),
			s('deviceClass', 'Device Class'),
			s('vendorId', 'Vendor ID'),
			s('productId', 'Product ID'),
			s('serialNumber', 'Serial Number'),
		],
		Drives: [
			s('id', 'ID'),
			s('name', 'Name'),
			s('description', 'Description'),
			d('createdAt', 'Created At'),
			s('driveType', 'Drive Type'),
			s('volumeLabel', 'Volume Label'),
			s('serialNumber', 'Serial Number'),
			s('fileSystem', 'File System'),
		],
		Events: [
			s('id', 'ID'),
			s('eventType', 'Event Type'),
			d('createdAt', 'Created At'),
			s('computerId', 'Computer ID'),
			s('userId', 'User ID'),
			n('severity', 'Severity'),
			s('description', 'Description'),
		],
		Groups: [
			s('id', 'ID'),
			s('name', 'Name'),
			s('description', 'Description'),
			d('createdAt', 'Created At'),
			s('groupType', 'Group Type'),
		],
		Users: [
			s('id', 'ID'),
			s('name', 'Name'),
			s('description', 'Description'),
			d('createdAt', 'Created At'),
			s('domain', 'Domain'),
			s('email', 'Email'),
			b('active', 'Active'),
		],
		Softwares: [
			s('id', 'ID'),
			s('name', 'Name'),
			s('description', 'Description'),
			d('createdAt', 'Created At'),
			s('version', 'Version'),
			s('vendor', 'Vendor'),
			d('installDate', 'Install Date'),
		],
		WhiteLists: [
			s('id', 'ID'),
			s('name', 'Name'),
			s('description', 'Description'),
			d('createdAt', 'Created At'),
			s('listType', 'List Type'),
		],
		AcBinaries: [
			s('displayName', 'Display Name'),
			s('fileHash', 'File Hash'),
			s('product', 'Product'),
			s('versionInfo', 'Version Info'),
			n('fileSize', 'File Size'),
			d('createdDate', 'Created Date'),
		],
		DefinedGroupMemberships: [
			s('id', 'ID'),
			s('name', 'Name'),
			s('description', 'Description'),
			d('createdAt', 'Created At'),
			s('groupId', 'Group ID'),
			s('memberId', 'Member ID'),
		],
		DriveLockConfigs: [
			s('id', 'ID'),
			s('name', 'Name'),
			s('description', 'Description'),
			d('createdAt', 'Created At'),
			s('configType', 'Config Type'),
			s('version', 'Version'),
			b('active', 'Active'),
		],
	};
})();
/* eslint-enable n8n-nodes-base/node-param-default-missing */

export const ENTITY_FIELDS: Record<string, FieldDefinition[]> = _fieldDefs;

// ---------------------------------------------------------------------------
// RQL serialization helpers
// ---------------------------------------------------------------------------

function serializeCondition(row: ConditionRow): string {
	const { field, operator, negate, value = '', valueList = '' } = row;

	const op = operator.toLowerCase();
	let expr: string;
	if (op === 'in') {
		const values = valueList
			.split(',')
			.map(v => v.trim())
			.join(',');
		expr = `in(${field},${values})`;
	} else {
		expr = `${op}(${field},${value})`;
	}

	return negate ? `not(${expr})` : expr;
}

function serializeGroup(group: FilterGroup): string {
	const conditions = group.conditions?.condition ?? [];
	if (conditions.length === 0) return '';
	if (conditions.length === 1) return serializeCondition(conditions[0]);
	const parts = conditions.map(serializeCondition).join(',');
	return `${group.combinator}(${parts})`;
}

export function buildFilterQuery(
	mode: 'builder' | 'raw',
	filterRaw: string,
	filterCombinator: 'and' | 'or',
	filterGroupsParam: FilterGroupsParam,
): string | null {
	if (mode === 'raw') return filterRaw || null;

	const groups = (filterGroupsParam.groups ?? [])
		.map(serializeGroup)
		.filter(Boolean);

	if (groups.length === 0) return null;
	if (groups.length === 1) return groups[0];
	return `${filterCombinator}(${groups.join(',')})`;
}
