export default function Scopes({
  scopes,
  onChange,
  currentScope,
}: {
  scopes: string[]
  currentScope: string | null
  onChange: (newScope: string | null) => void
}) {
  return (
    <>
      <div className="model-scopes">
        <button onClick={() => onChange(null)}>clear</button>

        {scopes.map((scope, index) => (
          <div className={`scope-display ${scope === currentScope ? 'selected' : ''}`} key={index}>
            <button
              onClick={() => {
                onChange(scope)
              }}
            >
              {scope}
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
