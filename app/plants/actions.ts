'use server'

import plantsStore from "@/db/store"
import { refresh } from 'next/cache'

export async function createPlant(formData: FormData) {
    const alias = formData.get('alias')?.toString()
    const name = formData.get('name')?.toString()

    if (!alias || !name) {
        // Bad request
        throw new Error('alias or name empty')
    }

    plantsStore.create(alias, name)

    refresh()
}
