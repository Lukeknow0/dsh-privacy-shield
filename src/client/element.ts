import { createElement } from 'react'
import type { ReactNode } from 'react'

export function h(tag: string, props?: Record<string, unknown> | null, ...children: ReactNode[]): ReactNode
export function h<Props>(
  component: (props: Props) => ReactNode,
  props: Props & { key?: string | number },
  ...children: ReactNode[]
): ReactNode
export function h(
  tag: string | ((props: never) => ReactNode),
  props?: Record<string, unknown> | null,
  ...children: ReactNode[]
): ReactNode {
  return createElement(tag as string, props ?? null, ...children)
}

/**
 * 高级矢量护盾图标（用于左侧导航栏、面板标题及状态徽章）
 * 16x16 矢量网格，双层细线几何美学，不使用粗糙 emoji
 */
export function ShieldIcon({ size = 16, className, style }: { size?: number | string; className?: string; style?: Record<string, unknown> }): ReactNode {
  return h('svg', {
    viewBox: '0 0 16 16',
    width: size,
    height: size,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.25',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    style,
    'aria-hidden': 'true',
  },
    // 外层护盾轮廓
    h('path', {
      d: 'M8 1.5 L13.5 3.5 V7.8 C13.5 11.2 10.8 13.8 8 14.8 C5.2 13.8 2.5 11.2 2.5 7.8 V3.5 Z',
    }),
    // 内部对勾/安全核心线
    h('path', {
      d: 'M6.2 8 L7.4 9.2 L9.8 6.8',
      strokeWidth: '1.3',
    }),
  )
}
