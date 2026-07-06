import { AppContext } from "../types/bindings";
import { ProductRepository } from "../repositories/product.repository";
import { HTTPException } from "hono/http-exception";

// HMAC-SHA256 Web Crypto Helper for signature verification
async function verifySignature(signatureHeader: string, rawBody: string, appSecret: string): Promise<boolean> {
    try {
        const signature = signatureHeader.startsWith("sha256=") ? signatureHeader.slice(7) : signatureHeader;
        const encoder = new TextEncoder();
        const keyData = encoder.encode(appSecret);
        const bodyData = encoder.encode(rawBody);

        const key = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const sigBuffer = await crypto.subtle.sign(
            "HMAC",
            key,
            bodyData
        );

        const hashHex = Array.from(new Uint8Array(sigBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        return hashHex === signature;
    } catch {
        return false;
    }
}

export const verifyMetaWebhook = async (c: AppContext) => {
    const tenantId = c.req.param("tenantId");
    if (!tenantId) {
        throw new HTTPException(400, { message: "tenantId parameter is required" });
    }

    const { "hub.mode": mode, "hub.verify_token": token, "hub.challenge": challenge } = c.req.query();

    if (mode && token) {
        if (mode === "subscribe") {
            const repo = new ProductRepository(c.env.infinitybot);
            const tenantConfig = await repo.getTenantConfig(tenantId);

            if (tenantConfig && tenantConfig.metaVerifyToken === token) {
                return c.text(challenge);
            }
        }
    }

    throw new HTTPException(403, { message: "Verification failed - Invalid token or mode" });
};

export const processMetaWebhook = async (c: AppContext) => {
    const tenantId = c.req.param("tenantId");
    if (!tenantId) {
        throw new HTTPException(400, { message: "tenantId parameter is required" });
    }

    const signatureHeader = c.req.header("x-hub-signature-256");
    if (!signatureHeader) {
        throw new HTTPException(401, { message: "Missing x-hub-signature-256 header" });
    }

    const rawBody = await c.req.text();

    const repo = new ProductRepository(c.env.infinitybot);
    const tenantConfig = await repo.getTenantConfig(tenantId);

    if (!tenantConfig || !tenantConfig.metaAppSecret) {
        throw new HTTPException(400, { message: "Meta App Secret not configured for this tenant" });
    }

    const isValid = await verifySignature(signatureHeader, rawBody, tenantConfig.metaAppSecret);
    if (!isValid) {
        throw new HTTPException(403, { message: "Invalid webhook signature" });
    }

    // Process the verified webhook payload
    const payload = JSON.parse(rawBody);
    console.log("Verified Meta Webhook Payload:", payload);

    return c.json({ success: true, message: "Webhook processed successfully" });
};
