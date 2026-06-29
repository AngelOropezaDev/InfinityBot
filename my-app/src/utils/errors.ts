// src/utils/error-handler.ts
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

export const globalErrorHandler = (err: any, c: any) => {
    // 1. Errores de Validación (Zod)
    if (err instanceof ZodError) {
        return c.json({ success: false, error: err.issues[0].message }, 400);
    }

    // 2. Errores de Hono (HTTPException) - Son los que tú lanzas intencionalmente
    if (err instanceof HTTPException) {
        return c.json({ success: false, error: err.message }, err.status);
    }

    // 3. Errores de Base de Datos (SQLITE)
    if (err.message?.includes('SQLITE_CONSTRAINT')) {
        return c.json({ success: false, error: "Conflicto en la base de datos: registro duplicado o inválido." }, 409);
    }

    // 4. Fallback: Todo lo demás es 500
    console.error("ERROR NO CONTROLADO:", err);
    return c.json({ success: false, error: "Error interno del servidor" }, 500);
};