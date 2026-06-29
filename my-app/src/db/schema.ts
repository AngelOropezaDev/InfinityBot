
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable('products', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    tenantId: text('tenant_id').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    metadata: text('metadata').notNull(),
})