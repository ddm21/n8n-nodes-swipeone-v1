# Changelog

All notable changes to `n8n-nodes-swipeone` are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## 0.2.0 — 2026-06-02

### Added

- **Contact → Create or Update**: the *Additional Properties* **Value** field is now a chips picker (`multiOptions`) of the real option labels for select/multiselect properties, instead of a free-text box. Single-select → choose one; multi-select → choose many. Text/number/date properties show an empty list — switch to Expression to type a value.
- **Event → Fire Event**: the *Event Properties* **Value** field is now the same chips picker (`multiOptions`), driven by the chosen event definition's property options.
- **Event → Get Many**: the **Contact** field is now a resource locator — pick a contact *From List* (searchable by name/email, resolves to the internal contact ID) or pass a raw ID *By ID* (supports expressions), instead of a plain Contact ID text box.
- **Tag → Add to Contact**: the **Contact** field is now a resource locator (*From List* searchable / *By ID*), matching the Note → Create selector, instead of a raw Contact ID text box.

### Changed

- Select/multiselect values now send the option **label** (e.g. `"1 Days Before"`) to the SwipeOne API, matching what the API expects. Multi-select properties always send an **array** of labels; single-select and other types send a scalar.
- **Event → Fire Event**: the *Property Name* dropdown no longer crams the property's option labels into its helper text (looked cluttered for properties with many options); it now shows only the field type. The actual options are picked in the Value chips field.

### Fixed

- Contact / Event property value pickers populate correctly for the property chosen in the same row (sibling lookup via the `&name` relative reference).
- Excluded system-managed contact properties (`createdAt`, `lastActivityDate`, `updatedAt`) from the property picker — they are read-only / server-generated.

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
