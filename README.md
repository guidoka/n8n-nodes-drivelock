# n8n-nodes-drivelock

This is an n8n community node. It lets you use the DriveLock API in your n8n workflows.

_App/service name_ is _one or two sentences describing the service this node integrates with_.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)
[Codebase Structure - Directory Layout](##codebase-structure-directory-layout)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

_List the operations supported by your node._

## Credentials

_If users need to authenticate with the app/service, provide details here. You should include prerequisites (such as signing up with the service), available authentication methods, and how to set them up._

## Compatibility

_State the minimum n8n version, as well as which versions you test against. You can also include any known version incompatibility issues._

## Usage

_This is an optional section. Use it to help users with any difficult or confusing aspects of the node._

_By the time users are looking for community nodes, they probably already know n8n basics. But if you expect new users, you can link to the [Try it out](https://docs.n8n.io/try-it-out/) documentation to help them get started._

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* _Link to app/service documentation._

## Version history

_This is another optional section. If your node has multiple versions, include a short description of available versions and what changed, as well as any compatibility impact._

## Codebase Structure - Directory Layout

```
n8n-nodes-drivelock/
├── credentials/                 # Credential type definitions
│   └── DrivelockApi.credentials.ts
├── nodes/                       # n8n node implementations
│   └── Drivelock/
│       ├── Drivelock.node.ts      # Main node executor + metadata
│       ├── Drivelock.node.json     # Node manifest for n8n registry
│       ├── helper/                 # Shared utilities
│       │   ├── GenericFunctions.ts
│       │   ├── CustomPropertyHelper.ts
│       │   └── utils.ts
│       └── operations/             # Resource-specific operation definitions
│           ├── ApplicationRuleOperations.ts
│           ├── BinariesOperations.ts
│           ├── ComputerOperations.ts
│           ├── CustomPropertyOperations.ts
│           ├── DeviceRuleOperations.ts
│           ├── DriveRuleOperations.ts
│           ├── EntityBinariesOperations.ts
│           ├── EntityOperations.ts
│           ├── GroupOperations.ts
│           └── PolicyOperations.ts
├── icons/                       # Node icon assets
│   └── drivelock.svg
├── .github/                     # GitHub workflows
│   └── workflows/
├── .vscode/                     # IDE configuration
├── .prettierrc.js              # Prettier config
├── eslint.config.mjs           # ESLint config
├── tsconfig.json               # TypeScript config
├── package.json                # Package definition
├── package-lock.json           # Locked dependencies
├── README.md                   # Project documentation
└── CHANGELOG.md                # Version history
```