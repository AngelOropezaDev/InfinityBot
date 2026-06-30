import { Context } from 'hono'

export interface Env {
    infinitybot: D1Database,
    JWT_SECRET: string
}

export type AppContext = Context<{ Bindings: Env }>