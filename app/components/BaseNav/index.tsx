import Link from "next/link";
import styles from './styles.module.css'

export interface NavItem {
    label?: string
    isCurrent: boolean
    href: string
}

interface BaseNavProps {
    items: NavItem[]
}

export default function BaseNav({ items }: BaseNavProps) {
    return (
        <nav className={styles.nav}>
            <ul className={styles.list}>
                {items.map((navitem) => (
                    <li key={navitem.href} className={styles.navItem} data-current={navitem.isCurrent}>
                        {navitem.isCurrent ? (
                            <span className={styles.navItemContent}>
                                {navitem.label}
                            </span>
                        ) : (
                            <Link href={navitem.href} className={styles.navItemContent}>
                                {navitem.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    )
}
