import { db } from './connect'

async function createPlant(name: string, alias: string) {
    return db.insertInto('plants').values({ name, alias }).returning('id').execute()
}

async function listAllPlants() {
    return db.selectFrom('plants').selectAll().execute()
}

const plantsStore = {
    create: createPlant,
    listAll: listAllPlants,
}

export default plantsStore
