import { Hono } from 'hono'
import { Env } from './types/bindings'
import { 
    createProduct, 
    searchHandler, 
    testSearchHandler, 
    chatHandler,
    getAdminConfig,
    patchAdminConfig,
    uploadProducts
} from './controllers/products.controller'
import { verifyMetaWebhook, processMetaWebhook } from './controllers/webhook.controller'
import { jwtAuthMiddleware } from './middleware/auth'
import { globalErrorHandler } from './utils/errors'
import { login, register } from './controllers/auth.controller'

const app = new Hono<{ Bindings: Env }>()

// Global Error Handler
app.onError(globalErrorHandler)

// Public Authentication
app.post('/auth/register', register)
app.post('/auth/login', login)

// Meta Webhooks (Internally verify signature, not through JWT)
app.get('/webhook/meta/:tenantId', verifyMetaWebhook)
app.post('/webhook/meta/:tenantId', processMetaWebhook)

// Protected API Routes (Requires Bearer JWT token)
app.use('/api/products', jwtAuthMiddleware())
app.use('/api/search', jwtAuthMiddleware())
app.use('/api/chat', jwtAuthMiddleware())
app.use('/api/admin/*', jwtAuthMiddleware())

// Protected Product / Search / Chat handlers
app.post('/api/products', createProduct)
app.get('/api/search', searchHandler)
app.post('/api/chat', chatHandler)

// Admin Config & Bulk operations
app.get('/api/admin/config', getAdminConfig)
app.patch('/api/admin/config', patchAdminConfig)
app.post('/api/admin/products/upload', uploadProducts)

// Public test-search endpoint (protected by raw x-test-token)
app.post('/api/test-search', testSearchHandler)

export default app
