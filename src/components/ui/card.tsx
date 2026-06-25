import * as React from 'react'

import { cn } from '@/lib/utils'

/**
 * ponytail: 删除未使用的子组件导出,只保留基础 Card
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      className,
    )}
    {...props}
  />
))
Card.displayName = 'Card'

export { Card }
