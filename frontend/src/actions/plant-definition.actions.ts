import type { Plant } from "@/domain/plants/plant";
import type { ActionResult } from "./types";

export async function upsertPlantDefinition(formData: FormData): Promise<ActionResult> {

  console.log(formData)

  return {
    success: true,
  } satisfies ActionResult
}


export async function deletePlantDefinition(id: Plant["id"]): Promise<ActionResult> {

  console.log(id)

  return {
    success: true,
  } satisfies ActionResult
}

