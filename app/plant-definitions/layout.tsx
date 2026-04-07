import plantDefinitionsService from '@/services/plant-definitions.service'
import PlantDefinitionsList from './components/PlantDefinitionsList'
import styles from './layout.module.css'

export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
    const definitionsList = await plantDefinitionsService.list()

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <PlantDefinitionsList definitionsList={definitionsList} />
            </header>

            <article className={styles.content}>
                {children}
            </article>
        </main>
    )
}
