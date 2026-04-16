import { buttonVariants } from "@/ui/classVariants/button";
import Link from "next/link";

export default function Home() {
    return (
        <div>
            <h1>HOME</h1>
            <Link href="/catalog" className={buttonVariants({ variant: 'primary', className: 'h-12' })}>Go to catalog</Link>
        </div>
    );
}
