import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	Icon
} from 'n8n-workflow';

export class DrivelockApi implements ICredentialType {
	name = 'driveLockApi';

	displayName = 'DriveLock API';

	icon: Icon = 'file:../icons/drivelock.svg';

	documentationUrl = 'https://dev.drivelock.cloud';

	httpRequestNode = {
		name: 'DriveLock',
		docsUrl: 'https://dev.drivelock.cloud/ui/assets/api/api-documentation.html',
		apiBaseUrl: 'https://dev.drivelock.cloud/api/administration',
	};

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
		{
			displayName:
				'Notice: Please make sure to use the correct Base URL for your environment. Normally the Uri "https://api.drivelock.cloud" should work fine.',
			name: 'notice',
			type: 'notice',
			default: '',
		},		
		{
			displayName: 'Base URL',
			description: 'The API URL of the DriveLock API',
			name: 'baseUrl',
			type: 'options',
			required: true,
			options: [
				{
					name: 'https://api.drivelock.cloud',
					value: 'https://api.drivelock.cloud',
				},
				{
					name: 'https://alpha.drivelock.cloud',
					value: 'https://alpha.drivelock.cloud',
				},
				{
					name: 'https://dev.drivelock.cloud',
					value: 'https://dev.drivelock.cloud',
				},				
			],
			default: 'api.drivelock.cloud',
		},		
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'apikey': '={{$credentials?.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{ $credentials.baseUrl }}',
			url: '/api/administration/entity/Computers?query=eq(name,MyComputer)',
			method: 'GET',
		},
	};
	
}
