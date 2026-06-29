import { AppContext } from "../types/bindings";
import { ProductService } from "../services/products.service";


export const createProduct = async (c: AppContext) => {
    try {
        const body = await c.req.json()
        const service = new ProductService(c.env.infinitybot)

        const newProduct = await service.registerProduct(body)

        return c.json({ success: true, data: newProduct })

    } catch (error) {
        return c.json({ success: false, error: error }, 500)
    }
}