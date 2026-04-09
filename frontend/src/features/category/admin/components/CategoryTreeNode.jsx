export default function CategoryTreeNode({ node, level = 0, selectedId, expandedMap, onToggle, onSelect }) {
  const hasChildren = Array.isArray(node.children) && node.children.length > 0
  const isExpanded = Boolean(expandedMap[node._id])
  const isSelected = String(selectedId) === String(node._id)

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1" style={{ paddingLeft: `${level * 14}px` }}>
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node._id)}
            className="inline-flex h-6 w-6 items-center justify-center rounded text-xs text-text-secondary hover:bg-surface-3"
            aria-label={isExpanded ? 'Collapse category branch' : 'Expand category branch'}
          >
            {isExpanded ? '-' : '+'}
          </button>
        ) : <span className="inline-flex h-6 w-6" />}

        <button
          type="button"
          onClick={() => onSelect(node._id)}
          className={`w-full rounded-md px-sm py-1.5 text-left text-sm transition ${isSelected ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-3 hover:text-text-primary'}`}
        >
          <span className="flex items-center gap-2">
            {node?.image ? (
              <img
                src={node.image}
                alt={node.name}
                className="h-6 w-6 rounded object-cover"
              />
            ) : (
              <span className="inline-flex h-6 w-6 rounded bg-surface-3" />
            )}
            <span>{node.name}</span>
          </span>
        </button>
      </div>

      {hasChildren && isExpanded ? (
        <div className="space-y-1">
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child._id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              expandedMap={expandedMap}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
