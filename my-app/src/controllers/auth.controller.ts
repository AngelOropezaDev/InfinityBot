import { HTTPException } from "hono/http-exception";
import { registerSchema } from "../types/auth.type";
import { AppContext } from "../types/bindings";
import { AuthService } from "../services/auth.service";
import { success } from "zod";

export const register = async (c: AppContext) => {
    const body = await c.req.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
        throw new HTTPException(400, { message: "Datos inválidos" });
    }

    const service = new AuthService(c.env.infinitybot)

    const result = await service.register({
        tenant: { name: validation.data.name },
        user: { email: validation.data.email, password: validation.data.password }
    })

    return c.json({ success: true, data: result }, 201)
}