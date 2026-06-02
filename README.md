# n8n-nodes-swipeone

![n8n community node](https://img.shields.io/badge/n8n-community%20node-ff6d5a)
![n8n version](https://img.shields.io/badge/n8n-%E2%89%A5%201.54.4-green)
![License: MIT](https://img.shields.io/badge/license-MIT-blue)
![Node.js](https://img.shields.io/badge/node-%E2%89%A5%2022-brightgreen)

n8n community node for the [SwipeOne](https://swipeone.com) API. Automate your contacts, deals, tasks, tags, events, and more directly from n8n workflows.

It works as a regular workflow node and as a tool for AI agents, so you can let an [AI Agent](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/) read and update your SwipeOne data in natural language.

## Table of Contents

- [Installation](#installation)
- [Credentials](#credentials)
- [Resources & Operations](#resources--operations)
- [Operation Reference](#operation-reference)
- [Features](#features)
- [Usage Examples](#usage-examples)
- [Use as an AI Agent tool](#use-as-an-ai-agent-tool)
- [Troubleshooting](#troubleshooting)
- [Compatibility](#compatibility)
- [Maintainers & Contributing](#maintainers--contributing)
- [License](#license)
- [Links](#links)

## Installation

1. Open your n8n instance
2. Go to **Settings** > **Community Nodes**
3. Select **Install a community node**
4. Enter `n8n-nodes-swipeone` and click **Install**

For self-hosted n8n, you can also install via npm:

```bash
npm install n8n-nodes-swipeone
```

See the [n8n community nodes installation docs](https://docs.n8n.io/integrations/community-nodes/installation/) for more detail.

## Credentials

You need two things from your SwipeOne account:

### API Key

1. Click the workspace name in the top-left corner to open the menu
2. Go to **Workspace Settings** > **API Keys**
3. Click **Create API Key**, give it a name, and copy the key

### Workspace ID

Your Workspace ID is visible in the URL when you're logged into SwipeOne:

```
https://app.swipeone.com/workspaces/{{WORKSPACE_ID}}/people
```

Copy the ID between `/workspaces/` and `/people`.

---

In n8n, go to **Credentials** > **Add Credential** > search **SwipeOne API**, enter both values, and save. The credential test will verify your connection automatically.

Under the hood the node calls the SwipeOne API at `https://api.swipeone.com/api` and authenticates with your key via the `x-api-key` request header. Your key is stored encrypted by n8n and never appears in workflow output.

## Resources & Operations

| Resource | Operations |
|----------|-----------|
| **Contact** | Create or Update, Get, Get Many, Search, Add or Update Status |
| **Contact Property** | Create, Get, Get Many |
| **Deal** | Create, Get, Search, Update, Delete |
| **Event** | Fire Event, Create Definition, Get Definitions, Get Many |
| **Note** | Create, Get, Get Many, Update |
| **Pipeline** | Create, Get, Get Many, Delete |
| **Segment** | Get, Get Many, Get Contacts |
| **Tag** | Create, Get, Get Many, Update, Add to Contact, Get Contacts |
| **Task** | Create, Get, Get Many, Update |

## Operation Reference

Every operation that returns a list (**Get Many**, **Search**, **Get Contacts**) supports a **Return All** toggle and a **Limit** — see [Features](#features) for how pagination is handled.

### Contact

| Operation | Description |
|-----------|-------------|
| **Create or Update** | Create a contact, or update it if the email already exists. At least one of First Name, Full Name, or Email is required. Set any custom workspace property via **Additional Properties**. |
| **Get** | Fetch a single contact by ID (searchable dropdown). |
| **Get Many** | List contacts in the workspace. |
| **Search** | Filter contacts by one or more property conditions. Operators adapt to the property type (text, email, select, number, date, phone, etc.). |
| **Add or Update Status** | Set or change a contact's status. Status values load from your workspace. |

### Contact Property

| Operation | Description |
|-----------|-------------|
| **Create** | Define a new custom contact property. |
| **Get** | Fetch a single contact property. |
| **Get Many** | List all contact properties (built-in and custom) in the workspace. |

### Deal

| Operation | Description |
|-----------|-------------|
| **Create** | Create a deal. Select a pipeline and stage from cascading dropdowns, link a contact, and set the deal value. |
| **Get** | Fetch a single deal by ID. |
| **Search** | Filter deals by pipeline, stage, and property conditions. |
| **Update** | Update an existing deal's fields, stage, or value. |
| **Delete** | Delete a deal. |

### Event

| Operation | Description |
|-----------|-------------|
| **Fire Event** | Record a custom event for a contact. Select the event type from your workspace definitions and pass any event properties. |
| **Create Definition** | Create a new custom event definition (the event schema). |
| **Get Definitions** | List all event definitions and their properties. |
| **Get Many** | List the events recorded for a given contact. |

### Note

| Operation | Description |
|-----------|-------------|
| **Create** | Add a note to a contact. Supports rich-text (Tiptap/ProseMirror JSON) content. |
| **Get** | Fetch a single note. |
| **Get Many** | List notes for a contact. |
| **Update** | Edit an existing note. |

### Pipeline

| Operation | Description |
|-----------|-------------|
| **Create** | Create a deal pipeline. |
| **Get** | Fetch a single pipeline (including its stages). |
| **Get Many** | List all pipelines. |
| **Delete** | Delete a pipeline. |

### Segment

| Operation | Description |
|-----------|-------------|
| **Get** | Fetch a single segment. |
| **Get Many** | List all segments. |
| **Get Contacts** | List the contacts that belong to a segment. |

### Tag

| Operation | Description |
|-----------|-------------|
| **Create** | Create a tag. |
| **Get** | Fetch a single tag. |
| **Get Many** | List all tags. |
| **Update** | Rename or update a tag. |
| **Add to Contact** | Apply tags to a contact (replaces the contact's existing tags). |
| **Get Contacts** | List contacts that carry a given tag. |

### Task

| Operation | Description |
|-----------|-------------|
| **Create** | Create a task, optionally linked to a contact, with a due date and assignee. |
| **Get** | Fetch a single task. |
| **Get Many** | List tasks. |
| **Update** | Update a task's fields or mark it complete. |

## Features

- **Smart dropdowns** — Select contacts, deals, notes, tasks, tags, and pipelines from searchable dropdown lists instead of pasting IDs.
- **Cascading fields** — Pipeline stages auto-update when you select a different pipeline. Search operators adapt to each property's type.
- **Workspace-aware properties** — Custom contact properties, event definitions, statuses, and tags are loaded live from your SwipeOne workspace.
- **Pagination built-in** — "Get Many", "Search", and "Get Contacts" handle pagination automatically. Turn on **Return All** to fetch every record, or set a **Limit** (default 100 per page). The node uses cursor- or page-based pagination as required by each endpoint.

## Usage Examples

### Create a contact and add a tag

1. Add a **SwipeOne** node > Resource: **Contact** > Operation: **Create or Update**
2. Fill in email, first name, last name
3. Add a second **SwipeOne** node > Resource: **Tag** > Operation: **Add to Contact**
4. Select the contact and tag from the dropdowns

### Fire a custom event

1. Add a **SwipeOne** node > Resource: **Event** > Operation: **Fire Event**
2. Select the event type from the dropdown (loads your custom event definitions)
3. Choose the contact by name or email
4. Fill in any event properties

### Build a deal pipeline workflow

1. Add a **SwipeOne** node > Resource: **Deal** > Operation: **Create**
2. Select a pipeline and stage from the cascading dropdowns
3. Link it to a contact and set the deal value

## Use as an AI Agent tool

This node is **usable as a tool**, so it can be attached to an n8n [AI Agent](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/). The agent can then call SwipeOne operations on its own — for example "find the contact john@acme.com and create a follow-up task for tomorrow." Add the SwipeOne node to the agent's tool list and the agent picks the resource, operation, and parameters from your prompt.

## Troubleshooting

- **Credential test fails** — Double-check the Workspace ID (the segment between `/workspaces/` and `/people` in the app URL) and that the API key is active in **Workspace Settings > API Keys**. The key must belong to the same workspace.
- **Dropdowns are empty** — The node loads dropdown values from the API using your credential. If a list is empty, confirm the credential is selected and valid, and that the workspace actually contains that data (e.g. no tags yet means an empty Tag dropdown).
- **Only 100 records returned** — List operations return one page by default. Enable **Return All** to fetch every record, or raise the **Limit**.
- **`x-api-key` / 401 errors** — Regenerate the API key in SwipeOne and update the n8n credential.

## Compatibility

- Requires **n8n v1.54.4** or later
- Node.js 22+

## Maintainers & Contributing

This is a community node, maintained by a member of the SwipeOne team.

Contributions are welcome! Open an issue or pull request on [GitHub](https://github.com/dhruv-so/n8n-nodes-swipeone-v1) — bug reports, new operations, and docs improvements are all appreciated.

## License

[MIT](LICENSE)

## Links

- [SwipeOne](https://swipeone.com) — email marketing platform
- [SwipeOne API Docs](https://api.swipeone.com/docs)
- [n8n Community Nodes Docs](https://docs.n8n.io/integrations/community-nodes/)
- [Changelog](CHANGELOG.md)
