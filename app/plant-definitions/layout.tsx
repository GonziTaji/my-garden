export default async function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <main className="min-h-dvh flex flex-col max-w-xl mx-auto">
            {children}
        </main>
    )
}
