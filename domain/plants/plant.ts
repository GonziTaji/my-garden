export interface Plant {
    id: number

    nickname: string
    source?: string

    plantDefinitionId: number

    acquiredAt?: Date
    location?: string

    notes?: string
}
