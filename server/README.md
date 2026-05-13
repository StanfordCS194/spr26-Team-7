# Report email API

Express server: `POST /api/report-different-issue` with JSON `{ category, tag, desc, locationMain, locationSub }`.

**From / To** are set in `index.js` (`MAIL_FROM`, `MAIL_TO`). For Gmail, `MAIL_FROM` must be the same Google account you use for OAuth or SMTP auth.

## Run

```bash
cd server
npm install
npm start
```

## Expo app

Set `EXPO_PUBLIC_REPORT_API_URL` (e.g. `http://127.0.0.1:3001` or your LAN IP + port). On a physical device, `127.0.0.1` is the phone itself—use your computer’s IP.

## Email delivery (priority)

1. **Gmail OAuth2** — if all of `GMAIL_OAUTH_CLIENT_ID`, `GMAIL_OAUTH_CLIENT_SECRET`, `GMAIL_OAUTH_REFRESH_TOKEN` are set, mail is sent via `smtp.gmail.com` with XOAUTH2 (no App Password). Response: `{ ok: true, mode: 'gmail-oauth' }`.
2. **SMTP (App Password or other host)** — if OAuth is not configured: `SMTP_URL` **or** `SMTP_HOST` + `SMTP_USER` + `SMTP_PASS` (optional `SMTP_PORT`, `SMTP_SECURE`). For Gmail App Passwords: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER` = your Gmail, `SMTP_PASS` = 16-character app password. Response: `{ ok: true, mode: 'smtp' }`.
3. **Log** — if neither path is configured, the message is printed to the server console. Response: `{ ok: true, mode: 'log' }`.

Optional: `PORT` (default `3001`).

### Gmail OAuth2 setup (Google Cloud)

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → **Enable Gmail API** (optional for SMTP XOAUTH2; enabling is fine).
2. **Credentials** → Create **OAuth client ID** → Application type **Desktop** (or Web with redirect you control).
3. Add scope for sending: when you obtain the refresh token, include scope `https://mail.google.com/` (or `https://www.googleapis.com/auth/gmail.send` if you switch to Gmail API later; Nodemailer SMTP OAuth2 commonly uses `https://mail.google.com/` for full SMTP access).
4. Run an OAuth consent flow once (e.g. Google’s OAuth Playground, or a small local script) to get a **refresh token** for your Gmail user.
5. Export on the server (never commit):

```bash
export GMAIL_OAUTH_CLIENT_ID='...apps.googleusercontent.com'
export GMAIL_OAUTH_CLIENT_SECRET='...'
export GMAIL_OAUTH_REFRESH_TOKEN='1//...'
```

`MAIL_FROM` in `index.js` must match the Gmail account that authorized that refresh token.

### Gmail SMTP (simpler)

Use a [Google App Password](https://myaccount.google.com/apppasswords) with 2-Step Verification enabled:

```bash
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER='you@gmail.com'
export SMTP_PASS='xxxx xxxx xxxx xxxx'
npm start
```

Ensure `MAIL_FROM` / `SMTP_USER` align with the mailbox you authenticate as.
