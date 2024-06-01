import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 
          'text-foreground hover:border-transparent hover:bg-primary/90 hover:text-primary-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

/**
 * 导入语句和变量定义
 * - 使用 * as React 从 'react' 导入所有内容
 * - 从 'class-variance-authority' 导入 cva 函数和 VariantProps 类型
 * - 从 '@/lib/utils' 导入 cn 函数
 * - 定义名为 badgeVariants 的变量，使用 cva 函数配置不同的徽章样式变体
 */

// 定义 Badge 组件的属性接口，继承了 HTMLDivElement 的属性以及 badgeVariants 的变体属性
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}
/**
 * Badge 组件
 * - 用于展示一个徽章样式的小组件
 * - 接收 className, variant 等属性来定义徽章的样式和行为
 * - 返回一个 div 元素，应用了徽章的样式
 * 
 * @param {BadgeProps} props - 组件的属性
 * @returns {React.Element<HTMLDivElement>} - 返回一个配置了徽章样式的 div 元素
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
