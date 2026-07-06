import { AppContext } from "../types/bindings";
import { ProductService } from "../services/products.service";
import { createProductSchema } from "../types/products.type";
import { HTTPException } from "hono/http-exception";
import { getDb } from "../db/index";
import { tenants } from "../db/schema";



export const createProduct = async (c: AppContext) => {
    const body = await c.req.json()
    const tenantId = c.get('tenantId')
    if (!tenantId) {
        throw new HTTPException(401, { message: "Unauthorized - missing tenant" });
    }

    const validation = createProductSchema.safeParse(body)
    if (!validation.success) {
        throw new HTTPException(400, { message: validation.error.issues[0].message });
    }

    const service = new ProductService(c.env)
    const newProduct = await service.createProduct({
        ...validation.data,
        tenantId
    })

    return c.json({ success: true, data: newProduct }, 201)
}

export const searchHandler = async (c: AppContext) => {
    const { q } = c.req.query()
    if (!q) return c.json({ error: 'No query provided' }, 400)

    const tenantId = c.get('tenantId')
    if (!tenantId) {
        throw new HTTPException(401, { message: "Unauthorized" });
    }

    const productService = new ProductService(c.env)
    const result = await productService.searchProduct(tenantId, q)

    if (!result) return c.json({ message: 'No encontre nada relacionado' })

    return c.json({
        query: q,
        found: result.name,
        metadata: JSON.parse(result.metadata)
    })
}

export const testSearchHandler = async (c: AppContext) => {
    // 1. Basic token protection - Hardcoded to ensure production works without env dependencies
    const token = c.req.header("x-test-token")?.trim();
    const expectedToken = "ASD232FAFD2GASDFASD232_231343434324ADSADGC";
    if (token !== expectedToken) {
        return c.json({ error: "Unauthorized - Invalid test token" }, 401);
    }

    let body: any = {};
    try {
        body = await c.req.json();
    } catch {
        // Fallback to empty if no JSON body is sent
    }

    const db = getDb(c.env.infinitybot);

    // Ensure we have a valid tenant to prevent foreign key errors
    let tenant = await db.select().from(tenants).limit(1).get();
    if (!tenant) {
        [tenant] = await db.insert(tenants).values({ name: "Test Tenant" }).returning();
    }

    // Step A: Setup test product & search keyword
    const testProduct = {
        tenantId: body.tenantId || tenant.id,
        name: body.name || "Audífonos Bluetooth Premium X1",
        description: body.description || "Audífonos inalámbricos con cancelación de ruido activa y 40 horas de batería.",
        metadata: body.metadata || { category: "electronics", brand: "Sony" }
    };
    const searchKeyword = body.searchKeyword || "auriculares inalámbricos";

    const service = new ProductService(c.env);

    // Step B: Persist in D1 and index in Vectorize
    const createdProduct = await service.createProduct(testProduct);

    // Step C: Search immediately using Vectorize + DB lookup
    const searchResult = await service.searchProduct(testProduct.tenantId, searchKeyword);

    // Step D: Return response to compare matches
    return c.json({
        success: true,
        inserted: {
            id: createdProduct.id,
            name: createdProduct.name,
            description: createdProduct.description,
            metadata: JSON.parse(createdProduct.metadata)
        },
        search: {
            keywordUsed: searchKeyword,
            foundProduct: searchResult ? {
                id: searchResult.id,
                name: searchResult.name,
                description: searchResult.description,
                metadata: JSON.parse(searchResult.metadata)
            } : null,
            match: searchResult && searchResult.id === createdProduct.id
        }
    }, 200);
}

export const chatHandler = async (c: AppContext) => {
    let body: any = {};
    try {
        body = await c.req.json();
    } catch {
        throw new HTTPException(400, { message: "Invalid JSON body" });
    }

    const { message } = body;
    if (!message) {
        throw new HTTPException(400, { message: "Message is required" });
    }

    const tenantId = c.get('tenantId') || body.tenantId;
    if (!tenantId) {
        throw new HTTPException(400, { message: "tenantId is required" });
    }

    const service = new ProductService(c.env);
    const chatResult = await service.chatWithProduct(tenantId, message);

    return c.json(chatResult);
}

export const getAdminConfig = async (c: AppContext) => {
    const tenantId = c.get("tenantId");
    if (!tenantId) {
        throw new HTTPException(401, { message: "Unauthorized" });
    }

    const service = new ProductService(c.env);
    const config = await service.getTenantConfig(tenantId);
    return c.json({ success: true, data: config });
}

export const patchAdminConfig = async (c: AppContext) => {
    const tenantId = c.get("tenantId");
    if (!tenantId) {
        throw new HTTPException(401, { message: "Unauthorized" });
    }

    let body: any = {};
    try {
        body = await c.req.json();
    } catch {
        throw new HTTPException(400, { message: "Invalid JSON body" });
    }

    const service = new ProductService(c.env);
    const updated = await service.updateTenantConfig(tenantId, {
        botPersonality: body.botPersonality,
        metaPageAccessToken: body.metaPageAccessToken,
        metaAppSecret: body.metaAppSecret,
        metaVerifyToken: body.metaVerifyToken,
        metaPageId: body.metaPageId
    });

    return c.json({ success: true, data: updated });
}

export const uploadProducts = async (c: AppContext) => {
    const tenantId = c.get("tenantId");
    if (!tenantId) {
        throw new HTTPException(401, { message: "Unauthorized" });
    }

    let body: any = {};
    try {
        body = await c.req.json();
    } catch {
        throw new HTTPException(400, { message: "Invalid JSON body" });
    }

    const { products } = body;
    if (!products || !Array.isArray(products)) {
        throw new HTTPException(400, { message: "Invalid payload: 'products' array is required" });
    }

    const service = new ProductService(c.env);
    const uploaded = await service.batchUploadProducts(tenantId, products);

    return c.json({ success: true, count: uploaded.length, data: uploaded }, 201);
}