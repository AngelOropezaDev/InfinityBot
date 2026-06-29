import { ProductRepository } from "../repositories/product.repository";

export class ProductService {
    private repo: ProductRepository

    constructor(d1: D1Database) {
        this.repo = new ProductRepository(d1)
    }

    async registerProduct(data: any) {
        return await this.repo.create({
            tenantId: data.tenantId,
            name: data.name,
            description: data.description,
            metadata: JSON.stringify(data.metadata)
        })
    }
}