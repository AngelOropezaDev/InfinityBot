import { verify } from "hono/jwt";
import { HTTPException } from "hono/http-exception";
import { MiddlewareHandler } from "hono";
import { Env, Variables } from "../types/bindings";

export const jwtAuthMiddleware = (): MiddlewareHandler<{ Bindings: Env; Variables: Variables }> => {
    return async (c, next) => {
        const authHeader = c.req.header("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new HTTPException(401, { message: "Missing or invalid Authorization header" });
        }

        const token = authHeader.split(" ")[1];
        try {
            const payload = await verify(token, c.env.JWT_SECRET, "HS256");
            if (!payload || !payload.tenantId || !payload.sub) {
                throw new HTTPException(401, { message: "Invalid token payload" });
            }

            c.set("tenantId", payload.tenantId as string);
            c.set("userId", payload.sub as string);
            c.set("email", payload.email as string);

            await next();
        } catch (e: any) {
            throw new HTTPException(401, { message: e.message || "Unauthorized" });
        }
    };
};