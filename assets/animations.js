const SCROLL_ANIMATION_TRIGGER_CLASSNAME = "scroll-trigger";
const SCROLL_ANIMATION_OFFSCREEN_CLASSNAME = "scroll-trigger--offscreen";
const SCROLL_ZOOM_IN_TRIGGER_CLASSNAME = "animate--zoom-in";
const SCROLL_ANIMATION_CANCEL_CLASSNAME = "scroll-trigger--cancel";

// Optimized throttle for better performance
function throttle(func, limit = 16) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Scroll in animation logic with optimized observer
function onIntersection(elements, observer) {
  elements.forEach((element, index) => {
    if (element.isIntersecting) {
      const elementTarget = element.target;
      if (
        elementTarget.classList.contains(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME)
      ) {
        elementTarget.classList.remove(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
        if (elementTarget.hasAttribute("data-cascade"))
          elementTarget.setAttribute("style", `--animation-order: ${index};`);
      }
      observer.unobserve(elementTarget);
    } else {
      element.target.classList.add(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
      element.target.classList.remove(SCROLL_ANIMATION_CANCEL_CLASSNAME);
    }
  });
}

function initializeScrollAnimationTrigger(
  rootEl = document,
  isDesignModeEvent = false
) {
  const animationTriggerElements = Array.from(
    rootEl.getElementsByClassName(SCROLL_ANIMATION_TRIGGER_CLASSNAME)
  );
  if (animationTriggerElements.length === 0) return;

  if (isDesignModeEvent) {
    animationTriggerElements.forEach((element) => {
      element.classList.add("scroll-trigger--design-mode");
    });
    return;
  }

  // Optimized observer options for better performance
  const observer = new IntersectionObserver(onIntersection, {
    rootMargin: "0px 0px -50px 0px",
    threshold: 0.1,
  });
  animationTriggerElements.forEach((element) => observer.observe(element));
}

// Zoom in animation logic with performance improvements
function initializeScrollZoomAnimationTrigger() {
  // Respect user's motion preferences
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const animationTriggerElements = Array.from(
    document.getElementsByClassName(SCROLL_ZOOM_IN_TRIGGER_CLASSNAME)
  );

  if (animationTriggerElements.length === 0) return;

  const scaleAmount = 0.2 / 100;

  // Create a single observer for all zoom elements
  const zoomObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.dataset.isVisible = "true";
          entry.target.style.setProperty(
            "--zoom-in-ratio",
            1 + scaleAmount * percentageSeen(entry.target)
          );
        } else {
          entry.target.dataset.isVisible = "false";
        }
      });
    },
    {
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
    }
  );

  animationTriggerElements.forEach((element) => {
    zoomObserver.observe(element);
    element.style.setProperty(
      "--zoom-in-ratio",
      1 + scaleAmount * percentageSeen(element)
    );
  });

  // Use a single throttled scroll listener
  const scrollHandler = throttle(() => {
    animationTriggerElements.forEach((element) => {
      if (element.dataset.isVisible === "true") {
        element.style.setProperty(
          "--zoom-in-ratio",
          1 + scaleAmount * percentageSeen(element)
        );
      }
    });
  });

  window.addEventListener("scroll", scrollHandler, { passive: true });
}

function percentageSeen(element) {
  const viewportHeight = window.innerHeight;
  const scrollY = window.scrollY;
  const elementPositionY = element.getBoundingClientRect().top + scrollY;
  const elementHeight = element.offsetHeight;

  if (elementPositionY > scrollY + viewportHeight) {
    // If we haven't reached the image yet
    return 0;
  } else if (elementPositionY + elementHeight < scrollY) {
    // If we've completely scrolled past the image
    return 100;
  }

  // When the image is in the viewport
  const distance = scrollY + viewportHeight - elementPositionY;
  let percentage = distance / ((viewportHeight + elementHeight) / 100);
  return Math.round(percentage);
}

// Initialize when DOM is ready with requestIdleCallback for better performance
function initializeAnimations() {
  initializeScrollAnimationTrigger();
  initializeScrollZoomAnimationTrigger();
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(initializeAnimations);
} else {
  // Fallback for browsers without requestIdleCallback
  setTimeout(initializeAnimations, 1);
}

// Shopify design mode handlers
if (Shopify.designMode) {
  document.addEventListener("shopify:section:load", (event) =>
    initializeScrollAnimationTrigger(event.target, true)
  );
  document.addEventListener("shopify:section:reorder", () =>
    initializeScrollAnimationTrigger(document, true)
  );
}
