import { AuthRepository } from "../repositories/auth.repository";
import { NewTenant, NewUser } from "../db/types";
import { HTTPException } from "hono/http-exception";
import bcrypt from 'bcryptjs'

export class AuthService {
    private repo: AuthRepository

    constructor(d1: D1Database) {
        this.repo = new AuthRepository(d1)
    }

    async register(data: { tenant: Omit<NewTenant, 'id'>, user: Omit<NewUser, 'id' | 'tenantId'> }) {
        const userExists = await this.repo.userExists(data.user.email)

        if (!userExists) {
            throw new HTTPException(409, { message: 'El usuario ya existe' })
        }

        const hashPassword = await bcrypt.hash(data.user.password, 10)

        return await this.repo.createTenantAndUser(data.tenant, {
            email: data.user.email,
            password: hashPassword
        })
    }


}