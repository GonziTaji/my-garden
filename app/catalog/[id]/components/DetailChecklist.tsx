import { cn } from "@sglara/cn"
import { FC } from "react"
import { PlantDefinition } from "../../actions"
import { cva } from "class-variance-authority"

const checkboxLabelVariants = cva([
    "px-1",
    "content-center",
    "block",
    "w-full",
    "min-w-24",
    "min-h-12",
    "has-checked:border-rose-100",
    "not-[:has(:checked)]:border-olive-200"
], {
    variants: {
        disabled: {
            true: "has-checked:border-3",
            false: "cursor-pointer border-3",
        },
    },
})

interface DetailOption { value: string, label: string, selected: boolean }

type DetailChecklistKey = keyof Pick<PlantDefinition,
    | 'categories'
    | 'waterProfile'
    | 'lightLevel'
    | 'soilType'
    | 'petToxicity'
>

type DetailChecklistType = 'radio' | 'checkbox'

export const DetailChecklist: FC<{
    className?: string
    name: DetailChecklistKey,
    type: DetailChecklistType,
    options: DetailOption[],
    disabled?: boolean
}> = ({ name, type, options, disabled, className }) => (
    <ul className={cn("grid grid-cols-[repeat(auto-fit,minmax(72px,1fr))] gap-4 justify-items-center items-center", className)}>
        {options.map((opt) => (
            <li key={opt.value}>
                <label className={checkboxLabelVariants({ disabled })}>
                    <input
                        className="hidden"
                        name={name}
                        type={type}
                        defaultValue={opt.value}
                        defaultChecked={opt.selected}
                        disabled={disabled}
                    />
                    {opt.label}
                </label>
            </li>
        ))}
    </ul>
)
