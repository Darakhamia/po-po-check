# POlyglot

A web-based translation editor for .po files with AI integration.

🌐 **Live:** https://polyglot.sbs

## Features

- Upload and parse .po files (drag & drop or file picker)
- View all translation entries in a table format
- Inline editing for translations
- Search and filter entries (untranslated, fuzzy, issues)
- AI-powered automatic translation (ChatGPT)
- Batch translation of selected entries
- "Translate All" for entire project
- Format validation (capitalization, punctuation, placeholders)
- Auto-fix for formatting issues
- Undo/redo translation changes
- Export back to .po file format
- Translation history tracking

## Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Database:** PostgreSQL with Prisma ORM
- **AI:** OpenAI API (GPT-4o-mini)
- **Containerization:** Docker
- **Reverse Proxy:** Traefik with automatic SSL

## Quick Start with Docker

```bash
# Clone the repository
git clone <repo-url>
cd polyglot

# Create .env file
cp .env.example .env
# Edit .env with your OPENAI_API_KEY

# Run with Docker Compose
docker-compose up -d

# Open http://localhost:5173
```

## Production Deployment

See [DEPLOY.md](DEPLOY.md) for detailed deployment instructions with Traefik and SSL.

## Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL and OpenAI API key
npx prisma db push
npm run dev
```

### Frontend

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
- `POST /api/entries/:id/undo` - Undo last change
- `POST /api/entries/:id/restore/:historyId` - Restore to specific version

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
