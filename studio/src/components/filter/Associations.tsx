export default function Associations({ associationNames }: { associationNames: string[] }) {
  return (
    <>
      <div className="model-associations">
        {associationNames.map((associationName, index) => (
          <div className="association-display" key={index}>
            {associationName}
          </div>
        ))}
      </div>
    </>
  )
}
