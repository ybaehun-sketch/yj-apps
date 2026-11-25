const ENC = new TextEncoder();

function b64UrlToBytes(b64u: string): Uint8Array {
  const pad = "=".repeat((4 - (b64u.length % 4)) % 4);
  const b64 = (b64u + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function bytesToB64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concatBytes(...chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(u8.byteLength);
  copy.set(u8);
  return copy.buffer;
}

async function hmacSha256(keyBytes: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", toArrayBuffer(keyBytes), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, toArrayBuffer(data));
  return new Uint8Array(sig);
}

async function hkdfExpand(prk: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const t1 = await hmacSha256(prk, concatBytes(info, new Uint8Array([0x01])));
  return t1.slice(0, length);
}

async function createVapidAuthHeader(endpoint: string, subject: string, publicKeyB64: string, privateKeyB64: string): Promise<string> {
  const origin = new URL(endpoint).origin;
  const header = bytesToB64Url(ENC.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600;
  const payload = bytesToB64Url(ENC.encode(JSON.stringify({ aud: origin, exp, sub: subject })));
  const signingInput = `${header}.${payload}`;

  const pubBytes = b64UrlToBytes(publicKeyB64);
  const x = bytesToB64Url(pubBytes.slice(1, 33));
  const y = bytesToB64Url(pubBytes.slice(33, 65));
  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "EC", crv: "P-256", x, y, d: privateKeyB64 },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, toArrayBuffer(ENC.encode(signingInput)));
  const sig = bytesToB64Url(new Uint8Array(sigBuf));
  return `vapid t=${signingInput}.${sig}, k=${publicKeyB64}`;
}

/** Encrypt payload per RFC 8291 (aes128gcm) using Web Crypto API. */
export async function encryptWebPushPayload(
  payloadText: string,
  uaPublicB64: string,
  authSecretB64: string,
): Promise<Uint8Array> {
  const uaPubBytes = b64UrlToBytes(uaPublicB64);
  const authSecret = b64UrlToBytes(authSecretB64);
  const uaKey = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(uaPubBytes),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  const asKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPubBytes = new Uint8Array(await crypto.subtle.exportKey("raw", asKeyPair.publicKey));
  const sharedBits = await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, asKeyPair.privateKey, 256);
  const ecdhSecret = new Uint8Array(sharedBits);

  const prkKey = await hmacSha256(authSecret, ecdhSecret);
  const keyInfo = concatBytes(ENC.encode("WebPush: info\0"), uaPubBytes, asPubBytes);
  const ikm = await hkdfExpand(prkKey, keyInfo, 32);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmacSha256(salt, ikm);
  const cek = await hkdfExpand(prk, ENC.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdfExpand(prk, ENC.encode("Content-Encoding: nonce\0"), 12);

  const plaintext = concatBytes(ENC.encode(payloadText), new Uint8Array([0x02]));
  const aesKey = await crypto.subtle.importKey("raw", toArrayBuffer(cek), { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(nonce) }, aesKey, toArrayBuffer(plaintext)));

  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096, false);
  const header = concatBytes(salt, rs, new Uint8Array([asPubBytes.length]), asPubBytes);
  return concatBytes(header, ciphertext);
}

export type PushSubscriptionData = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function sendWebPush(
  sub: PushSubscriptionData,
  payload: Record<string, unknown>,
  vapid: { publicKey: string; privateKey: string; subject: string },
): Promise<{ ok: boolean; status: number; expired?: boolean }> {
  const body = await encryptWebPushPayload(JSON.stringify(payload), sub.keys.p256dh, sub.keys.auth);
  const auth = await createVapidAuthHeader(sub.endpoint, vapid.subject, vapid.publicKey, vapid.privateKey);
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
    },
    body: toArrayBuffer(body),
  });
  return {
    ok: res.ok,
    status: res.status,
    expired: res.status === 404 || res.status === 410,
  };
}
