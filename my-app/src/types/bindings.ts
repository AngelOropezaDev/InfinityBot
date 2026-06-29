import { Context } from 'hono'

export interface Env {
    infinitybot: D1Database
}

export type AppContext = Context<{ Bindings: Env }>