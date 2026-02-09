import type {
	IExecuteFunctions,
	IHookFunctions,
	IDataObject,
	ILoadOptionsFunctions,
	JsonObject,
	IHttpRequestMethods,
	IHttpRequestOptions,
	// ICredentialDataDecryptedObject,
	// ICredentialTestFunctions,
} from 'n8n-workflow';

import { NodeApiError } from 'n8n-workflow';
import { DriveLockApiResponse } from './utils';

// function assertDriveLockResponse(x: unknown): asserts x is DriveLockApiResponse<unknown> {
// 	if (
// 		typeof x !== 'object' || 
// 		x === null
// 	) throw new Error('Unerwartete DriveLock API Response');

// 	const obj = x as Record<string, unknown>;
// 	if (!Array.isArray(obj.data)) {
// 		throw new Error('Unerwartete DriveLock API Response');
// 	}
// }

/**
 * Make an API request to DriveLock
 *
 */
export async function driveLockApiRequest<T = unknown>(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query?: IDataObject,
	option: IDataObject = {},
): Promise<DriveLockApiResponse<T>> {
	
	const options: IHttpRequestOptions = {
		method,
		headers: {
			'User-Agent': 'n8n',
		},
		body,
		qs: query,
		url: '',
		json: true,
	};

	if (Object.keys(option).length !== 0) {
		Object.assign(options, option);
	}

	try {

		const credentialType = 'driveLockApi';
		const credentials = await this.getCredentials(credentialType);
		

		const baseUrl = credentials.baseUrl || 'https://api.drivelock.cloud';
		options.url = `${baseUrl}${endpoint}`;


		const responseData = await this.helpers.httpRequestWithAuthentication.call(this, credentialType, options);
		return responseData as DriveLockApiResponse<T>;

	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}

}

// export async function driveLockApiRequestAllItems(
// 	this: IHookFunctions | IExecuteFunctions,
// 	method: IHttpRequestMethods,
// 	endpoint: string,

// 	body: unknown = {},
// 	query: IDataObject = {},
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// ): Promise<any> {
// 	const returnData: IDataObject[] = [];

// 	let responseData;

// 	query.per_page = 100;
// 	query.page = 1;

// 	do {
// 		responseData = await driveLockApiRequest.call(this, method, endpoint, body as IDataObject, query, {
// 			resolveWithFullResponse: true,
// 		});
// 		query.page++;
// 		returnData.push.apply(returnData, responseData.body as IDataObject[]);
		
// 	} while (responseData.headers?.link?.includes('next'));
	
// 	return returnData;
// }

export function isBase64(content: string) {
	const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
	return base64regex.test(content);
}

export function validateJSON(json: string | undefined): string {
	let result;
	try {
		result = JSON.parse(json!);
	} catch {
		result = undefined;
	}
	return result;
}

// export async function validateCredentials(
// 	this: ICredentialTestFunctions,
// 	decryptedCredentials: ICredentialDataDecryptedObject,
// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// ): Promise<any> {
// 	const credentials = decryptedCredentials;

// 	const { apiKey } = credentials as {
// 		apiKey: string;
// 	};

// 	const options: IHttpRequestOptions = {
// 		method: 'GET',
// 		headers: {},
// 		url: String(credentials.server || 'https://api.hubapi.com/deals/v1/deal/paged'),
// 		json: true,
// 	};

// 	options.headers = { Authorization: `Bearer ${apiKey}` };

// 	// eslint-disable-next-line @n8n/community-nodes/no-deprecated-workflow-functions
// 	return await this.helpers.request(options);
// }
