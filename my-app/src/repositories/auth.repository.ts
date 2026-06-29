import { D1Database } from "@cloudflare/workers-types"
import { getDb } from "../db"
import * as schema from "../db/schema"
import { NewTenant, NewUser, User } from "../db/types"
import { eq } from "drizzle-orm"

export class AuthRepository {
    private db: ReturnType<typeof getDb>

    constructor(d1: D1Database) {
        this.db = getDb(d1)
    }

    async createTenantAndUser(tenantData: Omit<NewTenant, 'id'>, userData: Omit<NewUser, 'id' | 'tenantId'>) {
        const tenantId = crypto.randomUUID()
        const userId = crypto.randomUUID()

        const [tenantRows, userRows] = await this.db.batch([
            this.db.insert(schema.tenants).values({
                ...tenantData,
                id: tenantId
            }).returning(),
            this.db.insert(schema.users).values({
                ...userData,
                id: userId,
                tenantId: tenantId
            }).returning()
        ])

        const newTenant = tenantRows[0]
        const newUser = userRows[0]

        return { tenant: newTenant, user: newUser }
    }

    async userExists(email: string) {
        return await this.db.select().from(schema.users).where(eq(schema.users.email, email))
    }

}