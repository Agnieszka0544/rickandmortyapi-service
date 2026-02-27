# Rick and Morty Service

Small TypeScript + Express API that proxies and aggregates data from the public [Rick and Morty API](https://rickandmortyapi.com/).

## Requirements

- Node.js 18 or later
- npm

## Installation

```bash
npm install
```

## Run

```bash
npm start
```

Server starts on:

- `http://localhost:3000`

---

## Endpoints

### `GET /search`

Searches characters, locations, and episodes by name and returns a merged list.

#### Query parameters

- `term` (required): search phrase
- `limit` (optional): maximum number of returned results

---

### `GET /top-pairs`

Returns character pairs who appear together in episodes, sorted descending by number of common episodes.

#### Query parameters

- `min` (optional): minimum number of common episodes
- `max` (optional): maximum number of common episodes
- `limit` (optional, default `20`): maximum number of returned results
