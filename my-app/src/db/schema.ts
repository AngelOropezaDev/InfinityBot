import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";


export const tenants = sqliteTable('tenants', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    botPersonality: text('bot_personality').default('amigable').notNull(),
    metaPageAccessToken: text('meta_page_access_token'),
    metaAppSecret: text('meta_app_secret'),
    metaVerifyToken: text('meta_verify_token'),
    metaPageId: text('meta_page_id'),
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
    embedding: text('embedding').notNull()
})