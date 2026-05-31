import { Link } from "@/router/components/Link"

interface PlantDefinitionHeaderProps {
  mode: 'form' | 'link'
  slug: string
  defid: string
  commonName: string
  scientificName: string
}
export default function PlantDefinitionHeader({ defid, commonName, scientificName }: PlantDefinitionHeaderProps) {
  return <div className="pb-4">
    <hr className="text-olive-600/40 my-4" />
    <Link className="flex flex-col items-center" to="/catalog/:plantdefid" params={{ plantdefid: defid }}>
      <span className="text-4xl">
        {commonName}
      </span>
      <span className="text-2xl italic">
        {scientificName}
      </span>
    </Link>
    <hr className="text-olive-600/40 my-4" />
  </div >
}
