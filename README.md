# BackEnd API

FastAPI-based backend providing user management, booking operations, and admin tooling.

## Authentication Flow

1. **Obtain tokens**
   ```bash
   curl -X POST http://127.0.0.1:8000/token \
        -H 'Content-Type: application/x-www-form-urlencoded' \
        -d 'username=<email>&password=<password>'
   ```
   Response:
   ```json
   {
     "access_token": "<jwt>",
     "refresh_token": "<long-random-string>",
     "token_type": "bearer"
   }
   ```
   Store both tokens client-side. Use the `access_token` in the `Authorization: Bearer <jwt>` header for authenticated calls.

2. **Refresh the session**
   ```bash
   curl -X POST http://127.0.0.1:8000/token/refresh \
        -H 'Content-Type: application/json' \
        -d '{"refresh_token": "<long-random-string>"}'
   ```
   Each refresh call rotates the refresh token. Replace the stored pair with the new `access_token` and `refresh_token`. Re-using an old refresh token will return `401 Invalid or expired refresh token`.

3. **Handling expiry**
   - Access tokens expire after 30 minutes (see `ACCESS_TOKEN_EXPIRE_MINUTES`).
   - Refresh tokens expire after 7 days and can be rotated early on every refresh to maintain a sliding session window.
   - When the refresh endpoint returns 401, prompt the user to log in again.

## Admin Utilities

- `PUT /admin/users/{user_id}` can elevate or demote users via the `is_admin` flag.
- Use the admin token from the `/token` call when invoking admin routes.
- Swagger UI (`/docs`) can be used to interactively exercise endpoints; click “Authorize” and paste your access token.

## Password Management

- **Users** can change their own password via `POST /users/me/password` with:
  ```json
  {"current_password": "old", "new_password": "new"}
  ```
  The endpoint returns 400 if the current password is incorrect.
- **Admins** can reset any user’s password with `POST /admin/users/{user_id}/password` supplying:
  ```json
  {"new_password": "temporary"}
  ```
  This hashes and stores the new password immediately.

## Running Locally

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
venv/bin/python -m uvicorn app.main:app --reload
```

On startup, the application auto-creates database tables (including the new `refresh_tokens` table). Restart Uvicorn after pulling updates to ensure migrations are applied.

## Frontend (React)

The `frontend/` directory contains the Vite + React client for visitor bookings and admin dashboards.

1. Install dependencies (Node 20.19+ recommended):
   ```bash
   cd frontend
   npm install
   ```
2. Create a `.env` file and point the app at your FastAPI server:
   ```bash
   echo "VITE_API_BASE_URL=http://127.0.0.1:8000" > .env
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   npm run preview
   ```

The client automatically injects the stored access token on every request and refreshes it when a 401 is received. Logout clears both tokens and cached profile data.
