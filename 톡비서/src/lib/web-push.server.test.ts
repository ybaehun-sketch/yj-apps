import { describe, expect, it } from "vitest";
import { encryptWebPushPayload } from "./web-push.server";

describe("web-push.server", () => {
  it("encrypts payload into aes128gcm binary packet with valid header", async () => {
    const kp = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    const rawPub = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
    const toB64u = (u: Uint8Array) => Buffer.from(u).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const auth = toB64u(crypto.getRandomValues(new Uint8Array(16)));

    const packet = await encryptWebPushPayload(JSON.stringify({ title: "톡비서 알림", body: "테스트" }), toB64u(rawPub), auth);
    // 16B salt + 4B rs + 1B idlen(65) + 65B pubkey + ciphertext
    expect(packet.byteLength).toBeGreaterThan(86);
    expect(packet[20]).toBe(65);
  });
});
