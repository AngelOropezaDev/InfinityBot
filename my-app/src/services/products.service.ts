import { ProductRepository } from "../repositories/product.repository";
import { Env } from "../types/bindings";
import { SYSTEM_PROMPTS, BotPersonality } from "../utils/prompts";

export class ProductService {
    private repo: ProductRepository;
    private env: Env;

    constructor(env: Env) {
        this.env = env;
        this.repo = new ProductRepository(env.infinitybot);
    }

    async generateEmbedding(text: string): Promise<number[]> {
        const response: any = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', { text });
        if (!response || !response.data || !response.data[0]) {
            throw new Error("Failed to generate embedding");
        }
        return response.data[0];
    }

    async createProduct(data: {
        tenantId: string;
        name: string;
        description: string;
        metadata: Record<string, any>;
    }) {
        // Convert metadata object and text fields into a single unique context string
        const contextText = `name: ${data.name}\ndescription: ${data.description}\nmetadata: ${JSON.stringify(data.metadata)}`;

        // Get embedding
        const embedding = await this.generateEmbedding(contextText);

        // Insert record into D1 using Drizzle
        const [product] = await this.repo.create({
            tenantId: data.tenantId,
            name: data.name,
            description: data.description,
            metadata: JSON.stringify(data.metadata),
            embedding: JSON.stringify(embedding)
        });

        if (!product) {
            throw new Error("Failed to insert product into database");
        }

        // Insert vector into VECTORIZE with tenantId in metadata for security isolation
        await this.env.VECTORIZE.upsert([{ 
            id: product.id, 
            values: embedding,
            metadata: { tenantId: data.tenantId }
        }]);

        return product;
    }

    async searchProduct(tenantId: string, query: string) {
        const queryEmbedding = await this.generateEmbedding(query)

        // Query VECTORIZE with filter to isolate search to this tenant only
        const matches = await this.env.VECTORIZE.query(queryEmbedding, { 
            topK: 1,
            filter: { tenantId }
        })

        if (matches.matches.length === 0) return null

        const productId = matches.matches[0].id
        const product = await this.repo.findById(productId)

        // Extra defense-in-depth verification: check database tenantId matches
        if (!product || product.tenantId !== tenantId) {
            return null
        }

        return product
    }

    async chatWithProduct(tenantId: string, userMessage: string) {
        // 1. Find the most relevant product strictly isolated by tenantId
        const product = await this.searchProduct(tenantId, userMessage);

        // 2. Fetch tenant personality configuration
        const tenantConfig = await this.repo.getTenantPersonality(tenantId);
        const personalityKey = (tenantConfig?.personality || "amigable") as BotPersonality;
        const systemPromptTemplate = SYSTEM_PROMPTS[personalityKey] || SYSTEM_PROMPTS.amigable;

        // 3. Setup context boundary
        let productContext = "No se encontró ningún producto relacionado en la base de datos.";
        if (product) {
            productContext = `Producto Relacionado:
Nombre: ${product.name}
Descripción: ${product.description}
Metadata/Ficha Técnica (JSON): ${product.metadata}`;
        }

        const finalSystemPrompt = `${systemPromptTemplate}\n\nContexto actual:\n${productContext}`;

        // 4. Execute LLM instruction
        const response: any = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct-fast', {
            messages: [
                { role: 'system', content: finalSystemPrompt },
                { role: 'user', content: userMessage }
            ]
        });

        return {
            response: response.response,
            productFound: !!product,
            product: product ? { id: product.id, name: product.name } : null
        };
    }

    async getTenantConfig(tenantId: string) {
        const config = await this.repo.getTenantConfig(tenantId);
        if (!config) {
            throw new Error("Tenant config not found");
        }
        return {
            name: config.name,
            botPersonality: config.botPersonality,
            metaConnected: !!(config.metaPageId && config.metaPageAccessToken)
        };
    }

    async updateTenantConfig(tenantId: string, data: {
        botPersonality?: string;
        metaPageAccessToken?: string;
        metaAppSecret?: string;
        metaVerifyToken?: string;
        metaPageId?: string;
    }) {
        const [updated] = await this.repo.updateTenantConfig(tenantId, data);
        if (!updated) {
            throw new Error("Failed to update tenant config");
        }
        return {
            name: updated.name,
            botPersonality: updated.botPersonality,
            metaConnected: !!(updated.metaPageId && updated.metaPageAccessToken)
        };
    }

    async batchUploadProducts(tenantId: string, productsList: Array<{ name: string; description: string; metadata: Record<string, any> }>) {
        const results = [];
        for (const item of productsList) {
            const product = await this.createProduct({
                tenantId,
                name: item.name,
                description: item.description,
                metadata: item.metadata
            });
            results.push(product);
        }
        return results;
    }
}