import type { IExecuteFunctions, INode } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

/**
 * Parse JSON parameter with consistent error handling
 * @param jsonString - JSON string to parse
 * @param node - Current node instance for error context
 * @param itemIndex - Item index for error context
 * @param parameterName - Parameter name for error message
 * @returns Parsed JSON value
 * @throws NodeOperationError with parameter name and item index context
 */
export function parseJsonParameter(
	jsonString: string,
	node: INode,
	itemIndex: number,
	parameterName: string,
): unknown {
	try {
		return JSON.parse(jsonString);
	} catch (error) {
		throw new NodeOperationError(
			node,
			`Invalid JSON in parameter "${parameterName}": ${(error as Error).message}`,
			{ itemIndex },
		);
	}
}

/**
 * Validate and parse comma-separated ID list
 * @param idsString - Comma-separated ID string
 * @param node - Current node instance for error context
 * @param itemIndex - Item index for error context
 * @param parameterName - Parameter name for error message
 * @returns Array of validated ID strings
 * @throws NodeOperationError if string is empty or contains invalid ID characters
 */
export function validateCommaSeparatedIds(
	idsString: string,
	node: INode,
	itemIndex: number,
	parameterName: string,
): string[] {
	const trimmed = idsString.trim();
	if (trimmed === '') {
		throw new NodeOperationError(
			node,
			`Parameter "${parameterName}" cannot be empty`,
			{ itemIndex },
		);
	}

	const idPattern = /^[a-zA-Z0-9\-_]+$/;
	const ids = trimmed.split(',').map(id => id.trim());

	for (const id of ids) {
		if (!idPattern.test(id)) {
			throw new NodeOperationError(
				node,
				`Invalid ID format in "${parameterName}": "${id}"`,
				{ itemIndex },
			);
		}
	}

	return ids;
}

/**
 * Get string parameter with type-safe validation
 * @param execFns - Execution functions
 * @param parameterName - Parameter name to retrieve
 * @param itemIndex - Item index
 * @param required - Whether parameter is required (default: true)
 * @returns String value
 * @throws NodeOperationError if parameter is missing (when required) or wrong type
 */
export function getStringParameter(
	execFns: IExecuteFunctions,
	parameterName: string,
	itemIndex: number,
	required: boolean = true,
): string {
	const value = execFns.getNodeParameter(parameterName, itemIndex);

	if (value === undefined || value === null) {
		if (required) {
			throw new NodeOperationError(
				execFns.getNode(),
				`Parameter "${parameterName}" is required`,
				{ itemIndex },
			);
		}
		return '';
	}

	if (typeof value !== 'string') {
		throw new NodeOperationError(
			execFns.getNode(),
			`Parameter "${parameterName}" must be a string, got ${typeof value}`,
			{ itemIndex },
		);
	}

	return value;
}

/**
 * Get number parameter with type-safe validation
 * @param execFns - Execution functions
 * @param parameterName - Parameter name to retrieve
 * @param itemIndex - Item index
 * @param required - Whether parameter is required (default: true)
 * @returns Number value
 * @throws NodeOperationError if parameter is missing (when required) or wrong type
 */
export function getNumberParameter(
	execFns: IExecuteFunctions,
	parameterName: string,
	itemIndex: number,
	required: boolean = true,
): number {
	const value = execFns.getNodeParameter(parameterName, itemIndex);

	if (value === undefined || value === null) {
		if (required) {
			throw new NodeOperationError(
				execFns.getNode(),
				`Parameter "${parameterName}" is required`,
				{ itemIndex },
			);
		}
		return 0;
	}

	if (typeof value !== 'number') {
		throw new NodeOperationError(
			execFns.getNode(),
			`Parameter "${parameterName}" must be a number, got ${typeof value}`,
			{ itemIndex },
		);
	}

	return value;
}

/**
 * Get boolean parameter with type-safe validation
 * @param execFns - Execution functions
 * @param parameterName - Parameter name to retrieve
 * @param itemIndex - Item index
 * @returns Boolean value
 * @throws NodeOperationError if parameter is wrong type
 */
export function getBooleanParameter(
	execFns: IExecuteFunctions,
	parameterName: string,
	itemIndex: number,
): boolean {
	const value = execFns.getNodeParameter(parameterName, itemIndex);

	if (typeof value !== 'boolean') {
		throw new NodeOperationError(
			execFns.getNode(),
			`Parameter "${parameterName}" must be a boolean, got ${typeof value}`,
			{ itemIndex },
		);
	}

	return value;
}
