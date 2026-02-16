import type {
	IExecuteFunctions,
	IHookFunctions,
	IDataObject,
	ILoadOptionsFunctions,
	JsonObject,
	IHttpRequestMethods,
	IHttpRequestOptions,
} from 'n8n-workflow';

import { NodeApiError, sleep } from 'n8n-workflow';
import { DriveLockApiResponse } from './utils';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function isRetryableStatusCode(httpCode: string | null | undefined): boolean {
	if (!httpCode) return false;
	const code = Number(httpCode);
	return code === 429 || (code >= 500 && code <= 599);
}

function sanitizeErrorForLogging(error: unknown): JsonObject {
	if (error && typeof error === 'object') {
		const err = { ...(error as Record<string, unknown>) };
		// Remove axios request config which contains headers including apikey
		delete err.config;
		// Remove request object which may contain raw socket/headers
		delete err.request;
		return err as JsonObject;
	}
	return error as JsonObject;
}

/**
 * Make an API request to DriveLock
 */
export async function driveLockApiRequest<T = unknown>(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: unknown = {},
	query?: IDataObject,
	option: IDataObject = {},
): Promise<DriveLockApiResponse<T>> {

	const options: IHttpRequestOptions = {
		method,
		headers: {
			'User-Agent': 'n8n',
		},
		body: body as IDataObject,
		qs: query,
		url: '',
		json: true,
	};

	if (Object.keys(option).length !== 0) {
		Object.assign(options, option);
	}

	const credentialType = 'driveLockApi';
	const credentials = await this.getCredentials(credentialType);

	const baseUrl = credentials.baseUrl || 'https://api.drivelock.cloud';
	options.url = `${baseUrl}${endpoint}`;

	let lastError: NodeApiError | undefined;
	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		try {
			const responseData = await this.helpers.httpRequestWithAuthentication.call(
				this,
				credentialType,
				options,
			);
			return responseData as DriveLockApiResponse<T>;
		} catch (error) {
			const apiError =
				error instanceof NodeApiError
					? error
					: new NodeApiError(this.getNode(), sanitizeErrorForLogging(error));

			if (!isRetryableStatusCode(apiError.httpCode) || attempt === MAX_RETRIES) {
				throw apiError;
			}

			const baseDelay = BASE_DELAY_MS * Math.pow(2, attempt);
			const jitteredDelay = baseDelay * (0.8 + Math.random() * 0.4);
			await sleep(Math.min(jitteredDelay, 30_000));
			lastError = apiError;
		}
	}
	throw lastError!;
}

export function isBase64(content: string) {
	const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
	return base64regex.test(content);
}

/**
 * @deprecated Use parseJsonParameter from ValidationHelpers.ts instead.
 * This function silently returns undefined on parse errors.
 */
export function validateJSON(json: string | undefined): string {
	let result;
	try {
		result = JSON.parse(json!);
	} catch {
		result = undefined;
	}
	return result;
}
