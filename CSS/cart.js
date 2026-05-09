let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

function saveCart() {
  localStorage.setItem('shoppingCart', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const cartItemCount = document.getElementById('cartItemCount');
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  if (cartItemCount) {
    cartItemCount.textContent = totalItems;
    cartItemCount.style.display = totalItems > 0 ? 'inline-block' : 'none';
  }
  
  renderCartItems();
  updateCartTotal();
}

function addToCart(product) {
  const existingItemIndex = cart.findIndex(item =>
    item.id === product.id &&
    item.color === product.color &&
    item.size === product.size
  );

  if (existingItemIndex > -1) {
    // If it's already in the cart, just add 1 more
    cart[existingItemIndex].quantity += 1;
  } else {
    // Otherwise, add the new product
    cart.push(product);
  }
  
  saveCart();
  // Automatically open the cart so they can see it and adjust quantity
  showCartModal(); 
}

// NEW FUNCTION: Updates quantity when user changes the number inside the cart
function updateCartItemQuantity(productId, color, size, newQuantity) {
  const item = cart.find(i => i.id === productId && i.color === color && i.size === size);
  if (item) {
    const qty = parseInt(newQuantity);
    if (qty <= 0) {
      removeFromCart(productId, color, size); // Remove if they set it to 0
    } else {
      item.quantity = qty;
      saveCart();
    }
  }
}

function removeFromCart(productId, color, size) {
  cart = cart.filter(item => !(item.id === productId && item.color === color && item.size === size));
  saveCart();
}

function clearCart() {
  cart = [];
  saveCart();
  hideCartModal();
}

function renderCartItems() {
  const cartItemsContainer = document.getElementById('cartItems');
  if (!cartItemsContainer) return;
  
  cartItemsContainer.innerHTML = '';
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p style="text-align: center; color: #aaa;">Your cart is empty.</p>';
    return;
  }
  
  cart.forEach(item => {
    const cartItemDiv = document.createElement('div');
    cartItemDiv.classList.add('cart-item');
    
    // Notice the new <input> tag replacing the static quantity text
    cartItemDiv.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-details">
        <h4>${item.name}</h4>
        <p>Color: ${item.color}, Size: ${item.size}</p>
        <div class="cart-quantity-control">
          <label>Qty:</label>
          <input type="number" class="cart-qty-input" data-product-id="${item.id}" data-color="${item.color}" data-size="${item.size}" value="${item.quantity}" min="1">
        </div>
      </div>
      <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
      <button class="remove-item-button" data-product-id="${item.id}" data-color="${item.color}" data-size="${item.size}">X</button>
    `;
    cartItemsContainer.appendChild(cartItemDiv);
  });

  // Listen for clicks on the Remove (X) button
  document.querySelectorAll('.remove-item-button').forEach(button => {
    button.addEventListener('click', (event) => {
      const productId = event.target.dataset.productId;
      const color = event.target.dataset.color;
      const size = event.target.dataset.size;
      removeFromCart(productId, color, size);
    });
  });

  // Listen for changes in the Quantity input boxes
  document.querySelectorAll('.cart-qty-input').forEach(input => {
    input.addEventListener('change', (event) => {
      const id = event.target.dataset.productId;
      const color = event.target.dataset.color;
      const size = event.target.dataset.size;
      const newQty = event.target.value;
      updateCartItemQuantity(id, color, size, newQty);
    });
  });
}

function updateCartTotal() {
  const cartTotalSpan = document.getElementById('cartTotal');
  if (!cartTotalSpan) return;
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  cartTotalSpan.textContent = total.toFixed(2);
}

function showCartModal() {
  const cartModal = document.getElementById('cartModal');
  if (cartModal) {
    cartModal.style.display = 'block';
    renderCartItems();
    updateCartTotal();
  }
}

function hideCartModal() {
  const cartModal = document.getElementById('cartModal');
  if (cartModal) {
    cartModal.style.display = 'none';
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  const cartIcon = document.getElementById('cartIcon');
  if (cartIcon) {
    cartIcon.addEventListener('click', (event) => {
      event.preventDefault();
      showCartModal();
    });
  }

  const closeButton = document.querySelector('#cartModal .close-button');
  if (closeButton) {
    closeButton.addEventListener('click', hideCartModal);
  }

  window.addEventListener('click', (event) => {
    const cartModal = document.getElementById('cartModal');
    if (event.target === cartModal) {
      hideCartModal();
    }
  });

  // Add to Cart Button Click (product pages)
  const addToCartButton = document.getElementById('addToCartButton');
  if (addToCartButton) {
    addToCartButton.addEventListener('click', () => {
      const productName = document.getElementById('productName').textContent;
      const productPrice = parseFloat(document.getElementById('productPrice').textContent);
      const sizeElement = document.getElementById('productSize');
      const productSize = sizeElement ? sizeElement.value : 'One Size';
      const productImage = document.getElementById('mainProductImage').src;

      const product = {
        id: productName.replace(/\s/g, '').toLowerCase(),
        name: productName,
        price: productPrice,
        size: productSize,
        // product page already has a selectedColor variable
        color: typeof selectedColor !== 'undefined' ? selectedColor : 'Standard',
        image: productImage,
        quantity: 1
      };

      addToCart(product);
    });
  }

  // ===== Listing card color selection (no product page needed) =====
  // Expected markup per card:
  // - .product[data-product-page="/path/product-x.html"]
  // - .product[data-product-id="some-id"]
  // - .product [data-description] (we will replace text content)
  // - .product [data-color-target] container for color buttons (optional)
  // - .product [data-add-to-cart] button (optional) to add directly to cart

  async function getAvailableColorsFromProductPage(productPageUrl) {
    try {
      const res = await fetch(productPageUrl, { credentials: 'same-origin' });
      if (!res.ok) return [];
      const htmlText = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const swatches = Array.from(doc.querySelectorAll('button.color-swatch[data-color]'));
      const colors = swatches.map(b => b.getAttribute('data-color')).filter(Boolean);
      // unique preserving order
      const seen = new Set();
      const unique = [];
      for (const c of colors) {
        const key = String(c);
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(c);
        }
      }
      return unique;
    } catch (e) {
      console.error('Failed to fetch colors for', productPageUrl, e);
      return [];
    }
  }

  function ensureCardState(card, productId) {
    if (!card.__listingState) {
      card.__listingState = { productId, color: null, colorsLoaded: false };
    }
    return card.__listingState;
  }

  function setCardColor(card, color) {
    const descEl = card.querySelector('[data-description]');
    if (descEl) {
      const h3 = card.querySelector('h3');
      const base = h3 ? `${h3.textContent}`.trim() : '';
      // Replace “Description goes here.” with selected color representation
      descEl.textContent = base ? `Description (${color})` : `Description (${color})`;
    }

    const state = ensureCardState(card, card.dataset.productId || 'unknown');
    state.color = color;
    card.dataset.selectedColor = color;

    // UI active state
    card.querySelectorAll('[data-color-button]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color === color);
    });
  }

  async function renderCardColors(card) {
    const productPageUrl = card.dataset.productPage;
    const productId = card.dataset.productId;
    if (!productPageUrl || !productId) return;

    const state = ensureCardState(card, productId);
    if (state.colorsLoaded) return;

    const colors = await getAvailableColorsFromProductPage(productPageUrl);
    state.colorsLoaded = true;
    if (!colors.length) return;

    const container = card.querySelector('[data-color-target]');
    if (!container) return;

    container.innerHTML = '';
    colors.forEach((color, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.color = color;
      btn.dataset.colorButton = '1';
      btn.setAttribute('data-color-button', '');
      btn.className = 'color-swatch' + (idx === 0 ? ' active' : '');
      // If color is a valid CSS color, use it; otherwise just keep default styling
      btn.style.backgroundColor = (() => {
        try {
          const s = String(color).trim();
          // quick check: if it's hex/rgb/rgba/named might work; otherwise leave
          return s;
        } catch {
          return '';
        }
      })();

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCardColor(card, color);
      });

      container.appendChild(btn);
    });

    // set default color
    setCardColor(card, colors[0]);
  }

  function tryHookAddToCart(card) {
    const addBtn = card.querySelector('[data-add-to-cart]');
    if (!addBtn) return;

    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const state = ensureCardState(card, card.dataset.productId || 'unknown');
      const selectedColor = state.color || card.dataset.selectedColor || 'Standard';

      // We don’t have real price/size elements on listing cards currently.
      // Use placeholders compatible with cart modal rendering.
      const name = (card.querySelector('h3')?.textContent || 'Product').trim();
      const priceText = card.querySelector('p strong')?.textContent || '$0.00';
      const price = parseFloat(String(priceText).replace(/[^0-9.]/g, '')) || 0;

      const product = {
        id: card.dataset.productId || name.replace(/\s/g, '').toLowerCase(),
        name,
        price,
        size: 'One Size',
        color: selectedColor,
        image: (card.querySelector('img')?.getAttribute('src') || '').trim(),
        quantity: 1
      };

      addToCart(product);
    });
  }

  // initialize listing cards on any page that includes cart.js
  const listingCards = document.querySelectorAll('.product[data-product-page][data-product-id]');
  listingCards.forEach(card => {
    // default placeholder description replacement will happen after colors load
    tryHookAddToCart(card);
    renderCardColors(card);
  });


  const checkoutButton = document.getElementById('checkoutButton');
  if (checkoutButton) {
    checkoutButton.addEventListener('click', () => {
      if (cart.length > 0) {
        window.location.href = '/checkout.html';
      } else {
        alert('Your cart is empty.');
      }
    });
  }

  const clearCartButton = document.getElementById('clearCartButton');
  if (clearCartButton) {
    clearCartButton.addEventListener('click', clearCart);
  }

  updateCartUI();
});