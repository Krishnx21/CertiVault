/**
 * Skeleton Loader Components
 * Reusable loading states for various UI elements
 */

export function DocumentCardSkeleton() {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5">
      <div className="flex justify-between items-start mb-3">
        <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
        <div className="w-8 h-8 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
      </div>
      <div className="h-5 bg-[var(--bg-tertiary)] rounded mb-2 w-3/4 animate-pulse" />
      <div className="h-4 bg-[var(--bg-tertiary)] rounded mb-3 w-1/2 animate-pulse" />
      <div className="flex justify-between items-center">
        <div className="h-4 bg-[var(--bg-tertiary)] rounded w-16 animate-pulse" />
        <div className="h-6 bg-[var(--bg-tertiary)] rounded-full w-16 animate-pulse" />
      </div>
      <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--border-color)]">
        <div className="flex-1 h-8 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        <div className="flex-1 h-8 bg-[var(--bg-tertiary)] rounded animate-pulse" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <article className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-[var(--bg-tertiary)] rounded mb-2 w-20 animate-pulse" />
          <div className="h-6 bg-[var(--bg-tertiary)] rounded mb-1 w-16 animate-pulse" />
          <div className="h-3 bg-[var(--bg-tertiary)] rounded w-24 animate-pulse" />
        </div>
      </div>
    </article>
  );
}

export function TableRowSkeleton() {
  return (
    <tr>
      <td>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-[var(--bg-tertiary)] rounded mb-1 w-32 animate-pulse" />
            <div className="h-3 bg-[var(--bg-tertiary)] rounded w-24 animate-pulse" />
          </div>
        </div>
      </td>
      <td><div className="h-4 bg-[var(--bg-tertiary)] rounded w-16 animate-pulse" /></td>
      <td><div className="h-4 bg-[var(--bg-tertiary)] rounded w-12 animate-pulse" /></td>
      <td><div className="h-6 bg-[var(--bg-tertiary)] rounded-full w-16 animate-pulse" /></td>
      <td><div className="h-4 bg-[var(--bg-tertiary)] rounded w-20 animate-pulse" /></td>
      <td>
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          <div className="w-8 h-8 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          <div className="w-8 h-8 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          <div className="w-8 h-8 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        </div>
      </td>
    </tr>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </>
  );
}
