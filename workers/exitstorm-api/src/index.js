const FIELD_LABELS = {
  name: "Name",
  email: "Email",
  inquiry: "Inquiry",
  message: "Message",
  company: "Company",
  usecase: "Use case",
  organization: "Organization",
  team_size: "Team size",
  goals: "Goals",
  source_page: "Source page",
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const origin = request.headers.get("Origin")
    const headers = corsHeaders(origin, env)

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers })
    if (url.pathname !== "/api/contact") return json({ ok: false, error: "Not found." }, 404, headers)
    if (request.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405, headers)
    if (origin && origin !== env.ALLOWED_ORIGIN) return json({ ok: false, error: "Origin not allowed." }, 403, headers)

    let data
    try {
      data = await request.json()
    } catch {
      return json({ ok: false, error: "Invalid JSON." }, 400, headers)
    }

    const payload = normalizePayload(data)
    if (payload.website || payload.honeypot) return json({ ok: true }, 200, headers)
    if (!payload.name || !isValidEmail(payload.email)) {
      return json({ ok: false, error: "Name and email are required." }, 400, headers)
    }

    try {
      await env.EMAIL.send({
        from: env.FROM_EMAIL,
        to: env.OWNER_EMAIL,
        replyTo: payload.email,
        subject: `ExitStorm form: ${payload.name}`,
        text: buildOwnerText(payload),
        html: buildOwnerHtml(payload),
      })

      await env.EMAIL.send({
        from: env.FROM_EMAIL,
        to: payload.email,
        replyTo: env.OWNER_EMAIL,
        subject: "We received your ExitStorm message",
        text: buildSubmitterText(payload),
        html: buildSubmitterHtml(payload),
      })

      return json({ ok: true }, 200, headers)
    } catch (error) {
      console.error("Email send failed", error)
      return json({ ok: false, error: "Email could not be sent." }, 502, headers)
    }
  },
}

function normalizePayload(data) {
  const payload = {}
  for (const [key, value] of Object.entries(data || {})) {
    if (typeof value === "string") payload[key] = value.trim()
  }
  return payload
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""))
}

function buildOwnerText(payload) {
  const lines = ["New ExitStorm website form submission", ""]
  for (const [key, value] of Object.entries(payload)) {
    if (!value || key === "website" || key === "honeypot") continue
    lines.push(`${labelFor(key)}: ${value}`)
  }
  return lines.join("\n")
}

function buildOwnerHtml(payload) {
  const rows = Object.entries(payload)
    .filter(([key, value]) => value && key !== "website" && key !== "honeypot")
    .map(([key, value]) => `<tr><th align="left">${escapeHtml(labelFor(key))}</th><td>${escapeHtml(value)}</td></tr>`)
    .join("")
  return `<h1>New ExitStorm website form submission</h1><table cellpadding="8" cellspacing="0" border="0">${rows}</table>`
}

function buildSubmitterText(payload) {
  return [
    `Hi ${payload.name},`,
    "",
    "We received your ExitStorm message and will reply soon.",
    "",
    "Your message:",
    payload.message || payload.usecase || payload.goals || "No message provided.",
  ].join("\n")
}

function buildSubmitterHtml(payload) {
  const message = payload.message || payload.usecase || payload.goals || "No message provided."
  return `<p>Hi ${escapeHtml(payload.name)},</p><p>We received your ExitStorm message and will reply soon.</p><p><strong>Your message:</strong></p><blockquote>${escapeHtml(message)}</blockquote>`
}

function labelFor(key) {
  return FIELD_LABELS[key] || key.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char])
}

function corsHeaders(origin, env) {
  const allowedOrigin = origin === env.ALLOWED_ORIGIN ? origin : env.ALLOWED_ORIGIN
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  }
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers })
}
