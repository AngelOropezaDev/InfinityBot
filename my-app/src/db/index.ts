import { drizzle } from 'drizzle-orm/d1'


export const getDb = (d1Binding: D1Database) => {
    return drizzle(d1Binding)
}