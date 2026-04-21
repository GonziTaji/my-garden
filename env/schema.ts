import * as z from 'zod/mini'


const envSchema = z.object({
    uploadsFolder: z.string(),
    databaseFilepath: z.string(),
})

export const env = envSchema.parse({
    uploadsFolder: process.env.MY_GARDEN_UPLOADS_FOLDER,
    databaseFilepath: process.env.MY_GARDEN_DB_FILEPATH,
})

export type EnvSchema = z.infer<typeof envSchema>
