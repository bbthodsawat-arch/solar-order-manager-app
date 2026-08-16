import html2canvas, { Options } from 'html2canvas';

const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
if (canvas) {
  canvas.width = 1;
  canvas.height = 1;
}
const ctx = canvas ? canvas.getContext('2d') : null;

function replaceColorFunc(str: string, funcName: string): string {
  if (!str || !str.includes(funcName + '(')) return str;
  let idx = 0;
  while ((idx = str.indexOf(funcName + '(', idx)) !== -1) {
    let openCount = 0;
    let endIdx = -1;
    for (let i = idx + funcName.length; i < str.length; i++) {
      if (str[i] === '(') openCount++;
      else if (str[i] === ')') {
        openCount--;
        if (openCount === 0) {
          endIdx = i;
          break;
        }
      }
    }

    if (endIdx !== -1) {
      const match = str.substring(idx, endIdx + 1);
      let replacement = match;
      if (ctx) {
        ctx.fillStyle = '#010203';
        ctx.fillStyle = match;
        const res = ctx.fillStyle;
        if (res && res !== '#010203' && res !== 'rgb(1, 2, 3)') {
          replacement = res;
        } else {
          // Fallback to transparent or neutral gray if parsing fails
          replacement = 'transparent';
        }
      } else {
        replacement = 'transparent';
      }
      str = str.substring(0, idx) + replacement + str.substring(endIdx + 1);
      idx += replacement.length;
    } else {
      idx += funcName.length;
    }
  }
  return str;
}

export function sanitizeColorsInCss(cssText: string): string {
  if (!cssText) return cssText;
  let result = cssText;
  const funcs = ['oklch', 'oklab', 'color-mix', 'light-dark'];
  for (const fn of funcs) {
    if (result.includes(fn + '(')) {
      result = replaceColorFunc(result, fn);
    }
  }
  return result;
}

export async function html2canvasSafe(element: HTMLElement, options: Partial<Options> = {}): Promise<HTMLCanvasElement> {
  const originalOnClone = options.onclone;

  const safeOptions: Partial<Options> = {
    ...options,
    onclone: (clonedDoc: Document, clonedEl: HTMLElement) => {
      // 1. Run custom onclone if supplied
      if (originalOnClone) {
        originalOnClone(clonedDoc, clonedEl);
      }

      // 2. Sanitize all <style> tags in cloned document
      try {
        clonedDoc.querySelectorAll('style').forEach((styleEl) => {
          if (styleEl.textContent) {
            styleEl.textContent = sanitizeColorsInCss(styleEl.textContent);
          }
        });

        // 3. Sanitize inline style attributes on all cloned elements
        clonedDoc.querySelectorAll('*').forEach((node) => {
          const el = node as HTMLElement;
          const styleAttr = el.getAttribute('style');
          if (styleAttr) {
            el.setAttribute('style', sanitizeColorsInCss(styleAttr));
          }

          ['fill', 'stroke', 'color', 'background-color', 'border-color'].forEach((attr) => {
            const val = el.getAttribute(attr);
            if (val) {
              el.setAttribute(attr, sanitizeColorsInCss(val));
            }
          });
        });
      } catch (err) {
        console.warn('Warning during html2canvas DOM sanitization:', err);
      }
    }
  };

  return html2canvas(element, safeOptions);
}
