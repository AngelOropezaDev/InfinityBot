import { Hono } from 'hono'
import { Env } from './types/bindings'
import { createProduct } from './controllers/products.controller'

const app = new Hono<{ Bindings: Env }>()

app.onError((err, c) => {
    console.error("🔥 ERROR DETECTADO:", err); // Esto imprimirá el error real en tu terminal
    return c.json({
        success: false,
        message: "Error en el servidor",
        details: err.message // Esto lo veremos en Postman
    }, 500);
});

app.post('/api/products', createProduct)

export default app
