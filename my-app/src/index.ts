import { Hono } from 'hono'
import { Env } from './types/bindings'
import { createProduct } from './controllers/products.controller'
import { globalErrorHandler } from './utils/errors'

const app = new Hono<{ Bindings: Env }>()

app.post('/api/products', createProduct)

app.onError(globalErrorHandler)

export default app
