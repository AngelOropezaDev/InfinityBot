import { tenants, users, products } from "./schema";

export type Tenant = typeof tenants.$inferSelect;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;


export type NewTenant = typeof tenants.$inferInsert;
export type NewUser = typeof users.$inferInsert;
export type NewProduct = typeof products.$inferInsert;