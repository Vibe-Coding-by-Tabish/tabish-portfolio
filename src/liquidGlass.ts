// Liquid glass, the parts CSS can't do alone (styles live in index.css):
//
// 1. A specular highlight that follows the pointer across any glass surface,
//    like light catching the material. Written as --mx / --my on the element.
// 2. Edge refraction for the dock: an SVG displacement filter used as a
//    backdrop-filter, bending what's behind the rim the way a lens edge does.
//    Only Chromium supports SVG filters in backdrop-filter; elsewhere the
//    dock keeps its frosted glass, so the class below gates it.

const GLASS = '.dock, .btn, .nav-resume, .theme-toggle, .stack-nav-btn, .social-icon-btn';

function trackSpecular() {
  const onPointer = (e: PointerEvent) => {
    const el = (e.target as Element | null)?.closest?.<HTMLElement>(GLASS);
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  document.addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('pointerdown', onPointer, { passive: true });
}

// Displacement map: red encodes horizontal shift, green vertical; 128 is
// "no shift". Neutral across the middle, ramping only in the outer 20% on
// each side, so the centre stays clear and only the rim bends light.
const MAP = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" preserveAspectRatio="none">
  <defs>
    <linearGradient id="x" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0" stop-color="#000000"/><stop offset="0.2" stop-color="#800000"/>
      <stop offset="0.8" stop-color="#800000"/><stop offset="1" stop-color="#ff0000"/>
    </linearGradient>
    <linearGradient id="y" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#000000"/><stop offset="0.2" stop-color="#008000"/>
      <stop offset="0.8" stop-color="#008000"/><stop offset="1" stop-color="#00ff00"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" fill="url(#x)"/>
  <rect width="200" height="200" fill="url(#y)" style="mix-blend-mode:screen"/>
</svg>`)}`;

const SVG_NS = 'http://www.w3.org/2000/svg';

function isChromium(): boolean {
  const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } })
    .userAgentData?.brands;
  return !!brands?.some(b => /Chromium/i.test(b.brand));
}

function mountRefraction() {
  if (!isChromium()) return;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.innerHTML = `
    <filter id="liquid-glass" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feImage href="${MAP}" x="0" y="0" width="200" height="50" preserveAspectRatio="none" result="map"/>
      <feDisplacementMap in="SourceGraphic" in2="map" scale="26" xChannelSelector="R" yChannelSelector="G"/>
    </filter>`;
  document.body.appendChild(svg);
  const map = svg.querySelector('feImage')!;

  // The map must cover the dock exactly. The dock changes size as it opens
  // and closes, and is a new element after the resume viewer unmounts it.
  // Layout size, not getBoundingClientRect: framer animates the dock's
  // resize with a scale transform, so its on-screen box lags behind
  const ro = new ResizeObserver(([entry]) => {
    const [box] = entry.borderBoxSize;
    map.setAttribute('width', String(Math.round(box.inlineSize)));
    map.setAttribute('height', String(Math.round(box.blockSize)));
  });
  let observed: Element | null = null;
  const follow = () => {
    const dock = document.querySelector('.dock');
    if (dock === observed) return;
    if (observed) ro.unobserve(observed);
    if (dock) ro.observe(dock);
    observed = dock;
  };
  follow();
  new MutationObserver(follow).observe(document.body, { childList: true, subtree: true });

  document.documentElement.classList.add('glass-refract');
}

export function initLiquidGlass() {
  trackSpecular();
  mountRefraction();
}
