import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("skeleton-pulse rounded-md", className)}
      {...props}
    />
  )
}

function SkeletonText({
  lines = 1,
  className,
  ...props
}: React.ComponentProps<"div"> & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 && lines > 1 ? "w-4/5" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

function SkeletonAvatar({
  size = "md",
  className,
  ...props
}: React.ComponentProps<"div"> & { size?: "sm" | "md" | "lg" | "xl" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
    xl: "h-24 w-24"
  }

  return (
    <Skeleton
      className={cn("rounded-full", sizeClasses[size], className)}
      {...props}
    />
  )
}

function SkeletonButton({
  variant = "default",
  className,
  ...props
}: React.ComponentProps<"div"> & { variant?: "default" | "sm" | "lg" }) {
  const variantClasses = {
    sm: "h-9 w-24",
    default: "h-11 w-32",
    lg: "h-14 w-40"
  }

  return (
    <Skeleton
      className={cn("rounded-lg", variantClasses[variant], className)}
      {...props}
    />
  )
}

function SkeletonCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6 space-y-4",
        "shadow-premium-sm",
        className
      )}
      {...props}
    >
      {/* Header with avatar and text */}
      <div className="flex items-center gap-4">
        <SkeletonAvatar size="lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>

      {/* Image */}
      <Skeleton className="aspect-[4/3] w-full rounded-lg" />

      {/* Content lines */}
      <SkeletonText lines={3} />

      {/* Footer with buttons */}
      <div className="flex items-center gap-3 pt-2">
        <SkeletonButton variant="default" className="flex-1" />
        <SkeletonButton variant="default" className="w-20" />
      </div>
    </div>
  )
}

function SkeletonProfileCard({
  variant = "default",
  className,
  ...props
}: React.ComponentProps<"div"> & { variant?: "default" | "compact" }) {
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "rounded-xl border bg-card overflow-hidden",
          "shadow-premium-sm",
          className
        )}
        {...props}
      >
        <div className="flex gap-4 p-4">
          <SkeletonAvatar size="lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card overflow-hidden",
        "shadow-premium-sm hover:shadow-premium-md transition-smooth",
        className
      )}
      {...props}
    >
      {/* Profile Image */}
      <Skeleton className="aspect-[3/4] w-full" />

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name and age */}
        <div>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        {/* Details */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <SkeletonButton className="flex-1" />
          <Skeleton className="h-11 w-11 rounded-lg" />
          <Skeleton className="h-11 w-11 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

function SkeletonGrid({
  count = 6,
  cardVariant = "default",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  count?: number
  cardVariant?: "default" | "compact"
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        className
      )}
      {...props}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProfileCard
          key={i}
          variant={cardVariant}
          className={`stagger-${Math.min(i + 1, 6)} animate-fade-in`}
        />
      ))}
    </div>
  )
}

function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  rows?: number
  columns?: number
}) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {/* Header */}
      <div className="grid gap-4 pb-3 border-b" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-10 w-full rounded" />
          ))}
        </div>
      ))}
    </div>
  )
}

function SkeletonForm({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Form fields */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ))}

      {/* Submit button */}
      <div className="pt-4">
        <SkeletonButton variant="lg" className="w-full" />
      </div>
    </div>
  )
}

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  SkeletonProfileCard,
  SkeletonGrid,
  SkeletonTable,
  SkeletonForm
}
