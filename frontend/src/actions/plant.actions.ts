import type { Plant } from "@/domain/plants/plant";
import type { ActionResult } from "./types";


export async function upsertPlant(fd: FormData): Promise<ActionResult<{ id: string }>> {
  console.log(fd)

  return { success: true, id: '1' }
}

export async function toggleWatering(plantid: Plant["id"], date: string): Promise<ActionResult> {

  console.log({ plantid, date })

  return { success: true }
}
