/**
 * Headless happy-dom environment for running Instatic's own CSS importer
 * outside the browser. Mirrors src/__tests__/setup.ts — GlobalWindow, not
 * Window, because the CSS parser needs JS built-ins (SyntaxError) reachable
 * as window.* properties.
 */
import { GlobalWindow } from 'happy-dom'
const happyWindow: any = new GlobalWindow({
  url: 'http://localhost/',
  settings: { disableCSSFileLoading: true, disableJavaScriptFileLoading: true },
})
const g = globalThis as Record<string, unknown>
g.window = happyWindow
g.document = happyWindow.document
for (const k of ['CSSStyleSheet', 'CSSRule', 'CSSStyleDeclaration', 'HTMLElement', 'Element', 'Node', 'DOMParser', 'XMLSerializer']) {
  if (happyWindow[k]) g[k] = happyWindow[k]
}
