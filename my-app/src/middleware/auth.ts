import { createMiddleware } from 'hono/factory';

export const authMiddleware = createMiddleware(async (c, next) => {
    const tenantId = c.req.header('x-tenant-id');

    if (!tenantId) {
        return c.json({ error: 'Tenant ID requerido' }, 401);
    }

    c.set('tenantId', tenantId);
    await next();
});