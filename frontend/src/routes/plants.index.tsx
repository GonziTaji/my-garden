import { createFileRoute, Link } from "@tanstack/react-router"
import { useState, type SubmitEvent } from "react"

export const Route = createFileRoute("/plants/")({
  component: PlantsList,
})

