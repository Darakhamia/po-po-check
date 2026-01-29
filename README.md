# PO Editor

A web-based translation editor for .po files with ChatGPT integration.

## Features

- Upload and parse .po files (drag & drop or file picker)
- View all translation entries in a table format
- Inline editing for translations
- Search and filter entries
- ChatGPT-powered automatic translation
- Batch translation of selected entries
- Export back to .po file format
- Translation history tracking

## Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Frontend:** React, TypeScript, Tailwind CSS
- **Database:** PostgreSQL with Prisma ORM
- **AI:** OpenAI API (GPT-4o-mini)
- **Containerization:** Docker

## Quick Start with Docker

1. Clone the repository
2. Create `.env` file in the root directory:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
3. Run with Docker Compose:
   ```bash
   docker-compose up -d
   ```
4. Open http://localhost:5173 in your browser

## Manual Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL and OpenAI API key
npx prisma db push
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects/upload` - Upload a .po file
- `GET /api/projects/:id/export` - Export project as .po
- `DELETE /api/projects/:id` - Delete project
- `PATCH /api/projects/:id` - Update project metadata

### Entries
- `GET /api/entries/project/:projectId` - Get entries with filtering
- `PATCH /api/entries/:id` - Update an entry
- `POST /api/entries/batch-update` - Batch update entries
- `GET /api/entries/:id/history` - Get entry change history

### Translation
- `POST /api/translate/single` - Translate single entry
- `POST /api/translate/batch` - Translate multiple entries
- `POST /api/translate/project/:projectId` - Translate all untranslated entries

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings/:key` - Update a setting
- `GET /api/settings/api-key-status` - Check API key configuration

## License

MIT
