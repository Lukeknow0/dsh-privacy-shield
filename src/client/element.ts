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
