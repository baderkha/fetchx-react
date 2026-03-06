# FetchX

Desktop API client built with Electron + React for composing requests, previewing payloads, and inspecting responses.

![Electron](https://img.shields.io/badge/Electron-36-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=111111)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![MUI](https://img.shields.io/badge/MUI-6-007FFF?logo=mui&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22C55E)

## Built by
**Developed by Ahmad Baderkhan <ahmad@baderkhan.org>**

## What FetchX includes
- Multi-namespace workspaces with custom icons.
- Request folders + drag-and-drop request organization.
- HTTP methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`.
- Composer tabs for JSON body, query params, headers, and a final request preview.
- Template variables like `{{token}}` with autocomplete/validation in composer fields.
- Quick search modal with `Cmd/Ctrl + P`.
- Response tabs for body, headers, cookies, and request timeline.
- JSONPath filtering for JSON responses.
- Body rendering modes for JSON/text, image, video, CSV table, PDF, HTML, and binary download fallback.
- OpenAPI/Swagger import from URL or local JSON/YAML.
- OpenAPI namespace refresh (for URL-imported specs).
- Local app-state persistence through Electron (`electron-store`).

## Screenshots
### Main workspace
![Main View](screenshots/main_view.png)

### Request preview
![Request Preview](screenshots/req_preview.png)

### Response inspector
![Response](screenshots/response.png)

### Search dialog
![Search Bar](screenshots/search-bar.png)

### Settings dialog
![Settings](screenshots/settings.png)

### Create namespace
![Create Namespace](screenshots/create_n_namespace.png)

### Import API spec (This includes swagger)
![Import API Spec](screenshots/import_api_spec.png)

## Run locally
### Prerequisites
- Node.js
- npm

### Start development app (Vite + Electron)
```bash
npm install
npm run dev:all
```

### Build frontend bundle
```bash
npm run build
```

### Makefile shortcuts
```bash
make install
make dev
make build
```

## Tech stack
- Electron
- React 18
- Vite
- Material UI
- Monaco Editor
- `@hello-pangea/dnd`
- `js-yaml`
- `jsonpath-plus`

## Future work
- [ ] GraphQL support
- [ ] WebSocket support
- [ ] Global variables
- [ ] Import requests from Postman / Insomnia
- [ ] Request/response history

## License
MIT. See [LICENSE](LICENSE).
