import { Hono } from 'hono'
import { Env } from './types/bindings'
import { createProduct } from './controllers/products.controller'
import { globalErrorHandler } from './utils/errors'
import { login, register } from './controllers/auth.controller'

const app = new Hono<{ Bindings: Env }>()

app.post('/api/products', createProduct)
app.post('/auth/register', register)
app.post('/auth/login', login)

app.onError(globalErrorHandler)

export default app
