# Changelog

All notable changes to `n8n-nodes-swipeone` are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## 0.1.1 — Initial release

First public release of the SwipeOne community node for n8n.

### Added

- **SwipeOne** node with 9 resources and 31 operations:
  - **Contact** — Create or Update, Get, Get Many, Search, Add or Update Status
  - **Contact Property** — Create, Get, Get Many
  - **Deal** — Create, Get, Search, Update, Delete
  - **Event** — Fire Event, Create Definition, Get Definitions, Get Many
  - **Note** — Create, Get, Get Many, Update
  - **Pipeline** — Create, Get, Get Many, Delete
  - **Segment** — Get, Get Many, Get Contacts
  - **Tag** — Create, Get, Get Many, Update, Add to Contact, Get Contacts
  - **Task** — Create, Get, Get Many, Update
- **SwipeOne API** credential (API key + Workspace ID) with built-in connection test.
- Searchable dropdowns for contacts, deals, notes, tasks, tags, and pipelines.
- Cascading pipeline → stage selection.
- Automatic pagination with a "Return All" toggle on list operations.
- Usable as an AI agent tool.
