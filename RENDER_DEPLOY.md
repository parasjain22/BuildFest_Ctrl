# Render Deployment

This project is set up to deploy on Render as a single Node web service.

Render will:

- build the frontend in `BharatVoteFrontend`
- start the backend in `bharatvote-backend`
- serve the compiled frontend from the Express server

The deployment blueprint lives in [render.yaml](/c:/Users/user/Desktop/BuildFest%20BharatVote/render.yaml).

## Deploy Steps

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. In Render, open `New` -> `Blueprint`.
3. Connect the repo and keep the Blueprint path set to `render.yaml`.
4. Fill in the required environment variables:

- `MONGO_URI`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Render generates these secrets automatically:

- `JWT_SECRET`
- `HASH_SECRET_SALT`
- `VOTE_ENCRYPTION_KEY`

## Production Defaults

- `NODE_ENV=production`
- `OTP_MOCK=true`
- `FACE_MATCH_MOCK=true`
- `MAX_FILE_SIZE_MB=5`

That means OTP and face verification stay in mock/demo mode until you configure real external providers.

## Notes

- The health check path is `/api/health`.
- Frontend routes are served by Express, so React Router works on refresh.
- Uploaded files are stored on Render's ephemeral filesystem. For durable production storage, move uploads to S3, Cloudinary, or another object store.
