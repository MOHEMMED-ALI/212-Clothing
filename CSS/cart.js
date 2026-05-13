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

  // Add to Cart Button Click
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
        // UPDATE THIS LINE: It checks if selectedColor exists. If not, it says 'Standard'
        color: typeof selectedColor !== 'undefined' ? selectedColor : 'Standard', 
        image: productImage,
        quantity: 1
      };
      
      addToCart(product);
    });
  }

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

/**
 * 212 CLOTHING - ULTIMATE COLOR SWITCHER
 * This script imports colors from product pages and handles image switching.
 */
const ColorSwitcher = {
    cache: {},

    async init() {
        // Check if running on file:// protocol
        if (window.location.protocol === 'file:') {
            console.warn("COLOR SWITCHER: You are running on file://. Fetch is blocked by browsers. Please use a local server (Live Server).");
        }

        const cards = document.querySelectorAll('.product');
        for (let card of cards) {
            const link = card.querySelector('a');
            if (link) {
                const url = link.getAttribute('href');
                this.setupCard(card, url);
            }
        }
    },

    async setupCard(card, url) {
        try {
            // Resolve absolute URL for fetching
            const absoluteUrl = new URL(url, window.location.href).href;
            
            if (!this.cache[absoluteUrl]) {
                const resp = await fetch(absoluteUrl);
                const html = await resp.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');
                
                // 1. Extract Colors from swatches
                const colors = Array.from(doc.querySelectorAll('.color-swatch')).map(s => ({
                    name: (s.dataset.color || s.getAttribute('data-color') || "").trim().toLowerCase(),
                    label: (s.dataset.color || s.getAttribute('data-color') || ""),
                    css: s.style.backgroundColor || "#ccc"
                })).filter(c => c.name);

                // 2. Extract Images (Handles nested objects and unquoted keys)
                const imgData = {};
                const scriptMatch = html.match(/const productImages = (\{[\s\S]*?\});/);
                if (scriptMatch) {
                    const content = scriptMatch[1];
                    // Regex to find any block that contains "front"
                    const blocks = content.matchAll(/([a-zA-Z0-9_-]+|['"][^'"]+['"])\s*:\s*\{([^{}]*?['"]?front['"]?[^{}]*?)\}/g);
                    for (const b of blocks) {
                        const key = b[1].replace(/['"]/g, "").trim().toLowerCase();
                        const blockContent = b[2];
                        const f = blockContent.match(/['"]?front['"]?\s*:\s*['"]([^'"]+)['"]/);
                        const bk = blockContent.match(/['"]?back['"]?\s*:\s*['"]([^'"]+)['"]/);
                        if (f || bk) imgData[key] = { front: f?.[1], back: bk?.[1] };
                    }
                }

                this.cache[absoluteUrl] = { 
                    colors, 
                    imgData, 
                    base: absoluteUrl.substring(0, absoluteUrl.lastIndexOf('/') + 1) 
                };
            }

            const { colors, imgData, base } = this.cache[absoluteUrl];
            if (colors.length === 0) return;

            // 3. Replace Description with Swatches
            const pTags = card.querySelectorAll('p');
            let targetP = Array.from(pTags).find(p => p.textContent.toLowerCase().includes('description'));
            
            if (targetP) {
                const container = document.createElement('div');
                container.className = 'product-card-colors';
                container.style.cssText = "display:flex; justify-content:center; gap:8px; padding:12px 0; border-top:1px solid rgba(255,255,255,0.1); margin-top:10px;";
                
                colors.forEach((c, i) => {
                    const btn = document.createElement('button');
                    btn.className = 'listing-color-swatch' + (i === 0 ? ' active' : '');
                    btn.style.cssText = `background-color:${c.css}; width:24px; height:24px; border-radius:50%; border:2px solid #444; cursor:pointer; transition:0.3s;`;
                    btn.title = c.label;
                    
                    btn.onclick = (e) => {
                        e.preventDefault(); e.stopPropagation();
                        
                        // UI Update
                        container.querySelectorAll('button').forEach(b => {
                            b.style.borderColor = "#444"; b.style.transform = "scale(1)";
                        });
                        btn.style.borderColor = "#ff4500"; btn.style.transform = "scale(1.2)";
                        
                        // Image Update
                        const img = card.querySelector('img');
                        const isBack = decodeURIComponent(img.src).includes('²');
                        const data = imgData[c.name];
                        
                        if (data) {
                            let newPath = (isBack && data.back) ? data.back : (data.front || data.back);
                            if (newPath) {
                                // Fix pathing: if it starts with / it's absolute, otherwise relative to product page
                                img.src = newPath.startsWith('/') ? newPath : base + newPath;
                            }
                        }
                    };
                    container.appendChild(btn);
                });
                targetP.replaceWith(container);
            }
        } catch (err) {
            console.error("ColorSwitcher Error:", url, err);
        }
    }
};

// Auto-run
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ColorSwitcher.init());
} else {
    ColorSwitcher.init();
}
