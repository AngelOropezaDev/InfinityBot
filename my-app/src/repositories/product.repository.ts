import { getDb } from '../db/index'
import { products } from '../db/schema'

export class ProductRepository {
    private db: ReturnType<typeof getDb>

    constructor(d1: D1Database) {
        this.db = getDb(d1)
    }

    async create(data: typeof products.$inferInsert) {
        try {

            console.log("Datos a insertar:", data);
            return await this.db.insert(products).values(data).returning()
        } catch (error) {
            console.error("DEBUG ERROR DB:", error); // <-- ¡MIRA ESTO EN LA TERMINAL!
            throw error;
        }
    }
}