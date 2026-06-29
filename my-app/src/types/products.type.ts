import { z } from 'zod'

export const createProductSchema = z.object({
    name: z.string().min(3),
    tenantId: z.string(),
    description: z.string().min(3),
    metadata: z.record(z.string(), z.any())
})