type InputMeta = Record<string, { label: string; description?: string }>

export function createEnumWithMeta<
    const T extends InputMeta
>(meta: T) {
    const values = Object.keys(meta) as (keyof T)[]

    const options = values.map((v) => ({
        value: v,
        label: meta[v].label,
    }))

    return {
        values,
        meta,
        options,
    }
}
