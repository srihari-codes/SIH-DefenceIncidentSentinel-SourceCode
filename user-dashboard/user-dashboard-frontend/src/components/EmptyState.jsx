/**
 * Empty State Component
 * Shows when no data is available
 */

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-2 text-gray-600">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
