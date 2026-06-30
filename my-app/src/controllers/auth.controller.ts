import { HTTPException } from "hono/http-exception";
import { loginSchema, registerSchema } from "../types/auth.type";
import { AppContext } from "../types/bindings";
import { AuthService } from "../services/auth.service";


export const register = async (c: AppContext) => {
    const body = await c.req.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
        throw new HTTPException(400, { message: "Datos inválidos" });
    }

    const service = new AuthService(c.env.infinitybot, c.env.JWT_SECRET)

    const result = await service.register({
        tenant: { name: validation.data.name },
        user: { email: validation.data.email, password: validation.data.password }
    })

    return c.json({ success: true, data: result }, 201)
}

export const login = async (c: AppContext) => {
    const body = await c.req.json()
    const validation = loginSchema.safeParse(body)

    if (!validation.success) {
        throw new HTTPException(400, { message: "Datos inválidos" });
    }

    const service = new AuthService(c.env.infinitybot, c.env.JWT_SECRET)

    const result = await service.login(validation.data.email, validation.data.password)

    return c.json(result)
}