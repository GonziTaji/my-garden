import { cva } from "class-variance-authority";
import Link from "next/link";

const linkVariants = cva([
    "h-20",
    "inline-block",
    "content-center",
    "cursor-pointer",
    "text-center",
    "text-xl",
    "font-bold",
    "rounded-xl",
    "text-olive-500 active:text-white",
    "bg-rose-100 active:bg-rose-200",
    "border-4",
    "border-rose-200",
], {
    variants: {},
})

export default function Home() {
    return (
        <div>
            <div className="text-center p-8 grid gap-8">
                <hr className="text-olive-400" />
                <h1 className="text-4xl italic">Mi jardín</h1>
                <hr className="text-olive-400" />
            </div>

            <div className="grid gap-8 p-8">
                <Link href={`/plants`} className={linkVariants()}>
                    Plantas
                </Link>

                <Link href="/catalog" className={linkVariants()}>
                    Go to catalog
                </Link>
            </div>
        </div>
    );
}
