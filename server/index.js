const express = require('express')
const cors = require('cors')
const nodemailer = require('nodemailer')

const PORT = Number(process.env.PORT || 3001)
const MAIL_FROM = 'zasemota@gmail.com'
const MAIL_TO = 'zasemota@gmail.com'

const buildEmailContent = (payload) => {
  const { category, tag, desc, locationMain, locationSub } = payload
  const subject = `City issue report — ${tag}`
  const text = [
    `Category: ${category}`,
    `Issue type: ${tag}`,
    '',
    'Description:',
    desc,
    '',
    'Location:',
    locationMain,
    locationSub,
  ].join('\n')
  return { subject, text }
}

/** Gmail via OAuth2 (XOAUTH2) — no App Password. Needs Google Cloud OAuth client + refresh token. */
const hasGmailOAuthConfig = () => {
  const id = process.env.GMAIL_OAUTH_CLIENT_ID && String(process.env.GMAIL_OAUTH_CLIENT_ID).trim()
  const secret =
    process.env.GMAIL_OAUTH_CLIENT_SECRET && String(process.env.GMAIL_OAUTH_CLIENT_SECRET).trim()
  const refresh =
    process.env.GMAIL_OAUTH_REFRESH_TOKEN && String(process.env.GMAIL_OAUTH_REFRESH_TOKEN).trim()
  return Boolean(id && secret && refresh)
}

const createGmailOAuthTransporter = () =>
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      type: 'OAuth2',
      user: MAIL_FROM,
      clientId: process.env.GMAIL_OAUTH_CLIENT_ID.trim(),
      clientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET.trim(),
      refreshToken: process.env.GMAIL_OAUTH_REFRESH_TOKEN.trim(),
    },
  })

const hasSmtpConfig = () => {
  if (process.env.SMTP_URL && String(process.env.SMTP_URL).trim()) {
    return true
  }
  const host = process.env.SMTP_HOST && String(process.env.SMTP_HOST).trim()
  const user = process.env.SMTP_USER && String(process.env.SMTP_USER).trim()
  const pass = process.env.SMTP_PASS && String(process.env.SMTP_PASS).trim()
  return Boolean(host && user && pass)
}

const createSmtpTransporter = () => {
  if (process.env.SMTP_URL && String(process.env.SMTP_URL).trim()) {
    return nodemailer.createTransport(process.env.SMTP_URL)
  }
  const port = Number(process.env.SMTP_PORT || 587)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465 || process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

const app = express()
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }),
)
app.use(express.json({ limit: '256kb' }))

app.post('/api/report-different-issue', async (req, res) => {
  const { category, tag, desc, locationMain, locationSub } = req.body || {}
  if (
    typeof category !== 'string' ||
    typeof tag !== 'string' ||
    typeof desc !== 'string' ||
    typeof locationMain !== 'string' ||
    typeof locationSub !== 'string'
  ) {
    return res.status(400).json({
      ok: false,
      error: 'Expected JSON body: { category, tag, desc, locationMain, locationSub } (all strings)',
    })
  }

  const { subject, text } = buildEmailContent({
    category,
    tag,
    desc,
    locationMain,
    locationSub,
  })

  if (hasGmailOAuthConfig()) {
    try {
      const transporter = createGmailOAuthTransporter()
      const info = await transporter.sendMail({
        from: MAIL_FROM,
        to: MAIL_TO,
        subject,
        text,
      })
      console.log('[report-different-issue] Gmail OAuth send ok', info.messageId)
      return res.status(200).json({ ok: true, mode: 'gmail-oauth' })
    } catch (err) {
      console.error('[report-different-issue] Gmail OAuth error:', err)
      return res.status(500).json({ ok: false, error: err.message || String(err) })
    }
  }

  if (!hasSmtpConfig()) {
    console.log('[report-different-issue] mode=log (no Gmail OAuth/SMTP). Full email:\n', {
      from: MAIL_FROM,
      to: MAIL_TO,
      subject,
      text,
    })
    return res.status(200).json({ ok: true, mode: 'log' })
  }

  try {
    const transporter = createSmtpTransporter()
    const info = await transporter.sendMail({
      from: MAIL_FROM,
      to: MAIL_TO,
      subject,
      text,
    })
    console.log('[report-different-issue] SMTP send ok', info.messageId)
    return res.status(200).json({ ok: true, mode: 'smtp' })
  } catch (err) {
    console.error('[report-different-issue] SMTP error:', err)
    return res.status(500).json({ ok: false, error: err.message || String(err) })
  }
})

app.listen(PORT, () => {
  console.log(`Report server listening on http://127.0.0.1:${PORT}`)
})
