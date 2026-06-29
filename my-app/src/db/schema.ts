import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";


export const tenants = sqliteTable('tenants', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});


export const users = sqliteTable('users', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    tenantId: text('tenant_id').references(() => tenants.id),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
});

export const products = sqliteTable('products', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    tenantId: text('tenant_id').notNull().references(() => tenants.id),
    name: text('name').notNull(),
    description: text('description').notNull(),
    metadata: text('metadata').notNull(),
})