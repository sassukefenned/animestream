/**
 * AnimeStream - Cloudflare Worker de pagamentos VIP (Asaas + Firestore REST)
 * Endpoints:
 *   POST /api/payment/create
 *   POST /api/payment/webhook
 *   GET  /api/payment/status/:paymentId
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Asaas-Event,X-Asaas-Signature",
  "Content-Type": "application/json; charset=utf-8",
};

const ASAAS_BASE = "https://api.asaas.com/v3";
const VIP_VALUE = 5;
const VIP_DAYS = 30;

export default {
  async fetch(request, env) {
    try {
      if (request.method === "OPTIONS") return json({ ok: true }, 200);

      const url = new URL(request.url);
      const path = url.pathname;

      if (request.method === "POST" && path.endsWith("/api/payment/create")) {
        return await handleCreate(request, env);
      }
      if (request.method === "POST" && path.endsWith("/api/payment/webhook")) {
        return await handleWebhook(request, env);
      }
      if (request.method === "GET" && path.includes("/api/payment/status/")) {
        const paymentId = decodeURIComponent(path.split("/").pop() || "");
        return await handleStatus(paymentId, env);
      }

      // Serve static files from GitHub
      if (path === '/' || path.startsWith('/css/') || path.startsWith('/js/') || path.startsWith('/pages/') || path === '/index.html' || path === '/README.md' || path === '/wrangler.toml') {
        const filePath = path === '/' ? '/index.html' : path;
        try {
          const response = await fetch(`https://raw.githubusercontent.com/sassukefenned/animestream/main${filePath}`);
          if (response.ok) {
            return new Response(response.body, {
              headers: {
                'Content-Type': getContentType(filePath),
                ...CORS_HEADERS
              }
            });
          }
        } catch (e) {
          // Ignore and fall to not found
        }
      }

      return json({ error: "Route not found" }, 404);
    } catch (error) {
      return json(
        {
          error: "Unhandled worker error",
          message: safeError(error),
        },
        500
      );
    }
  },
};

function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, ...extraHeaders },
  });
}

function safeError(err) {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  return err.message || "Unknown error";
}

function getContentType(path) {
  if (path.endsWith('.html')) return 'text/html';
  if (path.endsWith('.css')) return 'text/css';
  if (path.endsWith('.js')) return 'application/javascript';
  if (path.endsWith('.json')) return 'application/json';
  if (path.endsWith('.md')) return 'text/markdown';
  if (path.endsWith('.toml')) return 'application/toml';
  return 'text/plain';
}

function requireEnv(env, key) {
  const value = env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

async function parseJsonSafe(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function normalizeDocFields(data = {}) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === null || v === undefined) {
      fields[k] = { nullValue: null };
    } else if (typeof v === "boolean") {
      fields[k] = { booleanValue: v };
    } else if (typeof v === "number") {
      if (Number.isInteger(v)) fields[k] = { integerValue: String(v) };
      else fields[k] = { doubleValue: v };
    } else if (typeof v === "string") {
      fields[k] = { stringValue: v };
    } else if (v instanceof Date) {
      fields[k] = { timestampValue: v.toISOString() };
    } else {
      fields[k] = { stringValue: JSON.stringify(v) };
    }
  }
  return { fields };
}

async function asaasRequest(env, method, endpoint, body) {
  const apiKey = requireEnv(env, "ASAAS_API_KEY");
  const res = await fetch(`${ASAAS_BASE}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Asaas ${method} ${endpoint} failed (${res.status}): ${JSON.stringify(data)}`
    );
  }
  return data;
}

async function getOrCreateAsaasCustomer(env, { email, name, cpfCnpj }) {
  const found = await asaasRequest(
    env,
    "GET",
    `/customers?email=${encodeURIComponent(email)}&limit=1`
  );
  const existing = found?.data?.[0];
  if (existing?.id) return existing.id;

  const created = await asaasRequest(env, "POST", "/customers", {
    name,
    email,
    cpfCnpj,
  });
  if (!created?.id) throw new Error("Falha ao criar customer no Asaas.");
  return created.id;
}

function buildDueDate(daysAhead = 1) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

async function handleCreate(request, env) {
  const projectId = requireEnv(env, "FIREBASE_PROJECT_ID");
  const payload = await parseJsonSafe(request);
  const uid = String(payload?.uid || "").trim();
  const email = String(payload?.email || "").trim().toLowerCase();
  const name = String(payload?.name || "").trim();
  const cpfCnpj = String(payload?.cpfCnpj || "").replace(/\D/g, "");

  if (!uid || !email || !name || cpfCnpj.length < 11) {
    return json(
      {
        error: "Invalid payload",
        message: "Campos obrigatórios: uid, email, name, cpfCnpj válido.",
      },
      400
    );
  }

  try {
    const customerId = await getOrCreateAsaasCustomer(env, { email, name, cpfCnpj });
    const billing = await asaasRequest(env, "POST", "/payments", {
      customer: customerId,
      billingType: "UNDEFINED",
      value: VIP_VALUE,
      dueDate: buildDueDate(1),
      description: "AnimeStream VIP - Mensal",
      externalReference: `vip:${uid}`,
    });

    const paymentId = billing?.id;
    if (!paymentId) throw new Error("Asaas não retornou o ID da cobrança.");

    const pix = await asaasRequest(env, "GET", `/payments/${paymentId}/pixQrCode`);

    await setFirestoreDoc(env, projectId, `paymentMap/${paymentId}`, {
      uid,
      email,
      name,
      cpfCnpj,
      paymentId,
      customerId,
      status: billing?.status || "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return json({
      success: true,
      paymentId,
      asaasStatus: billing?.status || null,
      pix: {
        encodedImage: pix?.encodedImage || "",
        payload: pix?.payload || "",
        expirationDate: pix?.expirationDate || null,
      },
    });
  } catch (error) {
    return json(
      {
        error: "Failed to create payment",
        message: safeError(error),
      },
      500
    );
  }
}

async function handleWebhook(request, env) {
  const projectId = requireEnv(env, "FIREBASE_PROJECT_ID");
  const payload = await parseJsonSafe(request);
  if (!payload) {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const event = String(payload?.event || "").toUpperCase();
  const payment = payload?.payment || {};
  const paymentId = String(payment?.id || "").trim();
  const externalReference = String(payment?.externalReference || "");

  if (!paymentId) return json({ error: "Missing payment id" }, 400);

  const uidFromReference = externalReference.startsWith("vip:")
    ? externalReference.slice(4)
    : "";

  try {
    const paymentMap = await getFirestoreDoc(env, projectId, `paymentMap/${paymentId}`);
    const mappedUid = paymentMap?.uid || uidFromReference;
    if (!mappedUid) {
      return json({ ok: false, message: "UID não encontrado para este pagamento." }, 200);
    }

    await setFirestoreDoc(
      env,
      projectId,
      `paymentMap/${paymentId}`,
      {
        uid: mappedUid,
        paymentId,
        status: payment?.status || "UNKNOWN",
        event,
        updatedAt: new Date(),
      },
      true
    );

    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      const vipExpiresAt = new Date(Date.now() + VIP_DAYS * 24 * 60 * 60 * 1000);
      await setFirestoreDoc(
        env,
        projectId,
        `users/${mappedUid}`,
        {
          isVIP: true,
          plan: "vip",
          vipExpiresAt,
          vipUpdatedAt: new Date(),
        },
        true
      );
    }

    return json({ success: true, paymentId, event });
  } catch (error) {
    return json(
      {
        error: "Webhook processing failed",
        message: safeError(error),
      },
      500
    );
  }
}

async function handleStatus(paymentId, env) {
  const projectId = requireEnv(env, "FIREBASE_PROJECT_ID");
  if (!paymentId) return json({ error: "Missing paymentId" }, 400);
  try {
    const payment = await asaasRequest(env, "GET", `/payments/${paymentId}`);
    const status = String(payment?.status || "");

    if (["RECEIVED", "CONFIRMED"].includes(status)) {
      const mapped = await getFirestoreDoc(env, projectId, `paymentMap/${paymentId}`);
      const uid = mapped?.uid || "";
      if (uid) {
        const vipExpiresAt = new Date(Date.now() + VIP_DAYS * 24 * 60 * 60 * 1000);
        await setFirestoreDoc(
          env,
          projectId,
          `users/${uid}`,
          {
            isVIP: true,
            plan: "vip",
            vipExpiresAt,
            vipUpdatedAt: new Date(),
          },
          true
        );
      }
    }

    return json({
      success: true,
      paymentId,
      status,
      rawStatus: payment?.status || null,
    });
  } catch (error) {
    return json(
      {
        error: "Failed to check payment status",
        message: safeError(error),
      },
      500
    );
  }
}

async function getFirestoreDoc(env, projectId, docPath) {
  const token = await getGoogleAccessToken(env);
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${docPath}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore GET failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return parseFirestoreDoc(data);
}

async function setFirestoreDoc(env, projectId, docPath, data, merge = false) {
  const token = await getGoogleAccessToken(env);
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${docPath}`;
  const url = merge
    ? `${baseUrl}?currentDocument.exists=true`
    : baseUrl;

  const method = merge ? "PATCH" : "PATCH";
  const body = normalizeDocFields(data);
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore write failed (${res.status}): ${text}`);
  }
  return await res.json();
}

function parseFirestoreDoc(doc) {
  if (!doc?.fields) return null;
  const out = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    if ("stringValue" in v) out[k] = v.stringValue;
    else if ("booleanValue" in v) out[k] = v.booleanValue;
    else if ("integerValue" in v) out[k] = Number(v.integerValue);
    else if ("doubleValue" in v) out[k] = Number(v.doubleValue);
    else if ("timestampValue" in v) out[k] = v.timestampValue;
    else if ("nullValue" in v) out[k] = null;
    else out[k] = v;
  }
  return out;
}

async function getGoogleAccessToken(env) {
  const clientEmail = requireEnv(env, "FIREBASE_CLIENT_EMAIL");
  const privateKeyRaw = requireEnv(env, "FIREBASE_PRIVATE_KEY");
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
  const tokenUri = env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token";

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: tokenUri,
    exp: now + 3600,
    iat: now,
  };

  const unsignedJwt = `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify(claimSet)
  )}`;
  const signature = await signJwtRS256(unsignedJwt, privateKey);
  const jwt = `${unsignedJwt}.${signature}`;

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });

  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token request failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  if (!data?.access_token) throw new Error("Google token response sem access_token.");
  return data.access_token;
}

function base64url(input) {
  let str;
  if (typeof input === "string") str = input;
  else str = JSON.stringify(input);
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signJwtRS256(unsignedJwt, pem) {
  const keyData = pemToArrayBuffer(pem);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedJwt)
  );

  const bytes = new Uint8Array(signature);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}