import { AppContext } from "../types/bindings";
import { ProductService } from "../services/products.service";
import { createProductSchema } from "../types/products.type";
import { HTTPException } from "hono/http-exception";



export const createProduct = async (c: AppContext) => {
    const body = await c.req.json()
    const service = new ProductService(c.env.infinitybot)

    const validation = createProductSchema.safeParse(body)

    if (!validation.success) {
        throw new HTTPException(400, { message: validation.error.issues[0].message });
    }

    const newProduct = await service.registerProduct(validation.data)


    return c.json({ success: true, data: newProduct }, 201)
}