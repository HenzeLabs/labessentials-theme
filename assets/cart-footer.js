/**
 * Cart Footer Functionality
 * Handles the sticky cart footer display and updates
 */

function initializeCartFooter() {
  const footerId = "sticky-cart-footer-direct";
  const countId = "sticky-cart-count-direct";

  function forceFooterVisible() {
    const footer = document.getElementById(footerId);
    if (footer) {
      footer.style.cssText =
        "position: fixed !important; bottom: 0 !important; left: 0 !important; width: 100% !important; background: #1b3353 !important; color: #fff !important; z-index: 999999 !important; padding: 16px !important; text-align: center !important; font-size: 18px !important; font-weight: 500 !important; display: block !important; box-shadow: 0 -2px 10px rgba(0,0,0,0.1) !important;";
    }
  }

  function updateCartCount() {
    fetch("/cart.js")
      .then((res) => res.json())
      .then((cart) => {
        const count = document.getElementById(countId);
        if (count) {
          count.textContent = cart.item_count;
        }
        forceFooterVisible();
      })
      .catch(() => forceFooterVisible());
  }

  // Initialize immediately
  forceFooterVisible();

  // Update cart count when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateCartCount);
  } else {
    updateCartCount();
  }

  // Listen for cart updates
  document.addEventListener("cart:updated", function (event) {
    if (event.detail && event.detail.cart) {
      const count = document.getElementById(countId);
      if (count) {
        count.textContent = event.detail.cart.item_count;
      }
    }
    forceFooterVisible();
  });

  // Fallback to keep it visible (reduced frequency)
  setInterval(forceFooterVisible, 5000);
}

// Initialize when script loads
initializeCartFooter();
