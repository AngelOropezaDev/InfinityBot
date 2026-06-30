import { AuthRepository } from "../repositories/auth.repository";
import { NewTenant, NewUser } from "../db/types";
import { HTTPException } from "hono/http-exception";
import bcrypt from 'bcryptjs'
import { sign } from "hono/jwt";
import bcryptjs from "bcryptjs";

export class AuthService {
    private repo: AuthRepository


    constructor(d1: D1Database, private jwtSecret: string) {

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

    async login(email: string, password: string) {
        const users = await this.repo.userExists(email)
        const user = users[0]

        if (!user) {
            throw new HTTPException(401, { message: 'Credenciales inválidas' });
        }

        const isPasswordMatch = await bcryptjs.compare(password, user.password)

        if (!isPasswordMatch) {
            throw new HTTPException(401, { message: 'Credenciales inválidas' });
        }

        const token = await this.generateAuthToken(user.id, user.tenantId!, user.email, this.jwtSecret)

        return { token, user: { id: user.id, email: user.email } }
    }




    async generateAuthToken(userId: string, tenantId: string, email: string, secret: string) {
        const payload = {
            sub: userId,
            tenantId: tenantId,
            email: email,
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
        }

        const token = await sign(payload, secret)

        return token
    }


}