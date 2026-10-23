import { UIElement } from '../types/index.ts';

export function parseHierarchyXml(xmlString: string): { rootElements: UIElement[]; allElements: UIElement[] } {
  if (!xmlString || typeof xmlString !== 'string') {
    return { rootElements: [], allElements: [] };
  }

  const allElements: UIElement[] = [];
  const elementStack: UIElement[] = [];
  let elementCount = 0;

  // Match XML tags (opening, closing, self-closing)
  const tagRegex = /<(\/)?([a-zA-Z0-9_.-]+)([^>]*?)(\/)?>/g;
  let match;

  while ((match = tagRegex.exec(xmlString)) !== null) {
    const isClosing = match[1] === '/';
    const tagName = match[2];
    const attributes = match[3] || '';
    const isSelfClosing = match[4] === '/';

    if (tagName.toLowerCase() === 'hierarchy' || tagName.toLowerCase() === '?xml') {
      continue;
    }

    if (isClosing) {
      if (elementStack.length > 0) {
        elementStack.pop();
      }
    } else {
      const boundsMatch = attributes.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
      if (boundsMatch) {
        elementCount++;
        const [, x1, y1, x2, y2] = boundsMatch;

        const classMatch = attributes.match(/class="([^"]*)"/);
        const textMatch = attributes.match(/text="([^"]*)"/);
        const contentDescMatch = attributes.match(/content-desc="([^"]*)"/);
        const resourceIdMatch = attributes.match(/resource-id="([^"]*)"/);
        const packageMatch = attributes.match(/package="([^"]*)"/);
        const originalIndexMatch = attributes.match(/index="([^"]*)"/);

        const isFocusableMatch = attributes.match(/focusable="([^"]*)"/);
        const isClickableMatch = attributes.match(/clickable="([^"]*)"/);
        const isEnabledMatch = attributes.match(/enabled="([^"]*)"/);
        const isSelectedMatch = attributes.match(/selected="([^"]*)"/);
        const isCheckedMatch = attributes.match(/checked="([^"]*)"/);
        const isScrollableMatch = attributes.match(/scrollable="([^"]*)"/);
        const isCheckableMatch = attributes.match(/checkable="([^"]*)"/);
        const isLongClickableMatch = attributes.match(/long-clickable="([^"]*)"/);
        const isPasswordMatch = attributes.match(/password="([^"]*)"/);

        const element: UIElement = {
          id: `el_${elementCount}`,
          index: elementCount,
          originalIndex: originalIndexMatch ? originalIndexMatch[1] : '',
          tagName,
          className: classMatch ? classMatch[1] : '',
          text: textMatch ? textMatch[1] : '',
          contentDesc: contentDescMatch ? contentDescMatch[1] : '',
          resourceId: resourceIdMatch ? resourceIdMatch[1] : '',
          package: packageMatch ? packageMatch[1] : '',
          bounds: `[${x1},${y1}][${x2},${y2}]`,
          x1: parseInt(x1, 10),
          y1: parseInt(y1, 10),
          x2: parseInt(x2, 10),
          y2: parseInt(y2, 10),
          width: parseInt(x2, 10) - parseInt(x1, 10),
          height: parseInt(y2, 10) - parseInt(y1, 10),
          depth: 0,
          properties: {
            isFocusable: isFocusableMatch ? isFocusableMatch[1] === 'true' : false,
            isClickable: isClickableMatch ? isClickableMatch[1] === 'true' : false,
            isEnabled: isEnabledMatch ? isEnabledMatch[1] === 'true' : true,
            isSelected: isSelectedMatch ? isSelectedMatch[1] === 'true' : false,
            isChecked: isCheckedMatch ? isCheckedMatch[1] === 'true' : false,
            isScrollable: isScrollableMatch ? isScrollableMatch[1] === 'true' : false,
            isCheckable: isCheckableMatch ? isCheckableMatch[1] === 'true' : false,
            isLongClickable: isLongClickableMatch ? isLongClickableMatch[1] === 'true' : false,
            isPassword: isPasswordMatch ? isPasswordMatch[1] === 'true' : false,
          },
          children: []
        };

        if (elementStack.length > 0) {
          const parent = elementStack[elementStack.length - 1];
          element.parent = parent;
          parent.children.push(element);
        }

        allElements.push(element);

        if (!isSelfClosing) {
          elementStack.push(element);
        }
      }
    }
  }

  // Calculate depths
  const setDepth = (el: UIElement, d = 0) => {
    el.depth = d;
    for (const child of el.children) {
      setDepth(child, d + 1);
    }
  };

  const rootElements = allElements.filter(el => !el.parent);
  rootElements.forEach(r => setDepth(r, 0));

  return { rootElements, allElements };
}

/**
 * Filter elements by text query across all attributes
 */
export function filterElements(elements: UIElement[], query: string): UIElement[] {
  if (!query.trim()) return elements;
  const q = query.toLowerCase();

  return elements.filter(el =>
    el.tagName.toLowerCase().includes(q) ||
    el.className.toLowerCase().includes(q) ||
    el.text.toLowerCase().includes(q) ||
    el.contentDesc.toLowerCase().includes(q) ||
    el.resourceId.toLowerCase().includes(q) ||
    el.bounds.includes(query)
  );
}

/**
 * Search elements using standard XPath via DOMParser
 */
export function searchByXPath(xmlString: string, xpathQuery: string, allElements: UIElement[]): UIElement[] {
  if (!xpathQuery.trim() || !xmlString) return allElements;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    const result = doc.evaluate(
      xpathQuery,
      doc,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );

    const matchedBounds = new Set<string>();
    for (let i = 0; i < result.snapshotLength; i++) {
      const node = result.snapshotItem(i);
      if (node && node.nodeType === Node.ELEMENT_NODE) {
        const bounds = (node as Element).getAttribute('bounds');
        if (bounds) {
          matchedBounds.add(bounds);
        }
      }
    }

    return allElements.filter(el => matchedBounds.has(el.bounds));
  } catch (err) {
    console.warn('XPath evaluation failed:', err);
    return [];
  }
}

/**
 * Generate automation selectors for test frameworks (Appium, Maestro, UIAutomator2)
 */
export function generateSelectors(element: UIElement): { label: string; code: string; framework: string }[] {
  const selectors: { label: string; code: string; framework: string }[] = [];

  // Resource ID
  if (element.resourceId) {
    selectors.push({
      label: 'Resource ID',
      code: `driver.find_element(AppiumBy.ID, "${element.resourceId}")`,
      framework: 'Appium / Selenium'
    });
    selectors.push({
      label: 'Maestro ID',
      code: `- tapOn:\n    id: "${element.resourceId}"`,
      framework: 'Maestro'
    });
  }

  // Accessibility ID / Content-Desc
  if (element.contentDesc) {
    selectors.push({
      label: 'Accessibility ID',
      code: `driver.find_element(AppiumBy.ACCESSIBILITY_ID, "${element.contentDesc}")`,
      framework: 'Appium'
    });
    selectors.push({
      label: 'Maestro text/desc',
      code: `- tapOn: "${element.contentDesc}"`,
      framework: 'Maestro'
    });
  }

  // Text
  if (element.text) {
    selectors.push({
      label: 'Exact Text',
      code: `driver.find_element(AppiumBy.XPATH, "//*[@text='${element.text}']")`,
      framework: 'Appium'
    });
    selectors.push({
      label: 'UIAutomator2 Text',
      code: `d(text="${element.text}").click()`,
      framework: 'UIAutomator2 (Python)'
    });
  }

  // Unique XPath
  let xpath = `//${element.className || '*'}`;
  if (element.resourceId) {
    xpath += `[@resource-id='${element.resourceId}']`;
  } else if (element.contentDesc) {
    xpath += `[@content-desc='${element.contentDesc}']`;
  } else if (element.text) {
    xpath += `[@text='${element.text}']`;
  } else {
    xpath += `[@bounds='${element.bounds}']`;
  }

  selectors.push({
    label: 'Standard XPath',
    code: xpath,
    framework: 'Generic XPath'
  });

  return selectors;
}

/**
 * Extracts the primary active application package from the UI hierarchy elements
 */
export function extractActivePackage(elements: UIElement[]): string {
  if (!elements || elements.length === 0) return 'com.android.unknown';

  const counts: { [pkg: string]: number } = {};
  for (const el of elements) {
    if (el.package && el.package !== 'com.android.systemui' && el.package !== 'android') {
      counts[el.package] = (counts[el.package] || 0) + 1;
    }
  }

  let dominantPkg = '';
  let maxCount = 0;
  for (const [pkg, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantPkg = pkg;
    }
  }

  return dominantPkg || elements.find(e => e.package)?.package || 'com.android.launcher';
}

/**
 * Formats a timestamp into Brazilian standard: DD/MM/YY - HH:mm:ss
 */
export function formatBrazilianDateTime(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
}
