// --- Shopping Cart Logic ---
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
        alert('Proceeding to checkout with ' + cart.length + ' total items.');
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