import { Context } from 'hono'

export interface Env {
    infinitybot: D1Database,
    JWT_SECRET: string,
    VECTORIZE: VectorizeIndex,
    AI: Ai
}

export interface Variables {
    userId: string,
    tenantId: string,
    email: string
}

export type AppContext = Context<{ Bindings: Env, Variables: Variables }>