import { getDb } from '../db/index'
import { products, tenants } from '../db/schema'
import { eq } from 'drizzle-orm'

export class ProductRepository {
    private db: ReturnType<typeof getDb>

    constructor(d1: D1Database) {
        this.db = getDb(d1)
    }

    async create(data: typeof products.$inferInsert) {
        return await this.db.insert(products).values(data).returning()
    }

    async findById(id: string) {
        return await this.db.select().from(products).where(eq(products.id, id)).get()
    }

    async getTenantPersonality(tenantId: string) {
        return await this.db.select({
            personality: tenants.botPersonality
        }).from(tenants).where(eq(tenants.id, tenantId)).get()
    }

    async getTenantConfig(tenantId: string) {
        return await this.db.select().from(tenants).where(eq(tenants.id, tenantId)).get()
    }

    async updateTenantConfig(tenantId: string, data: Partial<typeof tenants.$inferInsert>) {
        return await this.db.update(tenants).set(data).where(eq(tenants.id, tenantId)).returning()
    }
}