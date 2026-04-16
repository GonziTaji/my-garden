'use client'

import { useTransition } from "react";
import { buttonVariants } from "../classVariants/button";
import { upsertPlantDefinition } from "@/app/catalog/actions"

export default function SubmitButton() {
    const [isPending, startTransition] = useTransition()

    const submitAction = async (fd: FormData) => {
        startTransition(async () => {
            const { error } = await upsertPlantDefinition(fd)

            if (error) {
                alert(error)
            }
        })
    }

    return (
        <button
            className={buttonVariants({ variant: 'primary' })}
            formAction={submitAction}
            type="submit"
            disabled={isPending}
        >
            {isPending ? 'Guardando' : 'Guardar'}
        </button>
    )

}
