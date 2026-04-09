import plantDefinitionsService from '@/services/plant-definitions.service'
import PlantDefinitionsList from './components/PlantDefinitionsList'

export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
    const definitionsList = await plantDefinitionsService.list()

    return (
        <main className="min-h-dvh flex flex-col max-w-xl mx-auto">
            <header>
                <PlantDefinitionsList definitionsList={definitionsList} />
            </header>

            <article className="grow">
                {children}
            </article>
        </main>
    )
}
