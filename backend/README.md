# Umang Backend

Express + MongoDB backend for the Umang e-commerce app.

## Run

```bash
npm install
npm run dev
```

Configure `.env` from `.env.example` before starting.

## MongoDB Atlas

This backend now expects `MONGO_URI` to be a MongoDB Atlas connection string.

1. Create a cluster in MongoDB Atlas.
2. Add your current IP in Atlas Network Access.
3. Create a database user in Atlas Database Access.
4. Put the Atlas URI in `backend/.env`:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/umang_store?retryWrites=true&w=majority&appName=Cluster0
```

5. After switching databases, recreate your login/admin user:

```bash
npm run admin:reset
npm run seed:products
```

If login shows `Invalid credentials`, the Atlas database does not yet contain that user. Register again or run `npm run admin:reset`.

## Deploy

Deploy this folder as a standalone Node service.

- Start command: `npm start`
- Health endpoint: `/api/health`
- Port: `PORT`

For Render, use the repo root [render.yaml](/c:/Users/sshss/OneDrive/Desktop/ecomer-website/render.yaml) and configure:

- `MONGO_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- `FRONTEND_URLS`
