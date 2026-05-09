/**
 * Product Colors Manager
 * Extracts color data from product pages and manages color switching on listing cards
 */
const ProductColorsManager = {
  colorCache: {},

  async fetchColorDataFromProductPage(productPageUrl) {
    if (this.colorCache[productPageUrl]) return this.colorCache[productPageUrl];

    try {
      const response = await fetch(productPageUrl);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const colorSwatches = doc.querySelectorAll('.color-swatch');
      const colors = [];
      colorSwatches.forEach(swatch => {
        if (swatch.dataset.color) {
          colors.push({
            name: swatch.dataset.color,
            bgColor: swatch.style.backgroundColor || '#ccc'
          });
        }
      });

      // Extract image mappings from the script tag in the product page
      const scriptMatch = html.match(/const productImages = (\{[\s\S]*?\});/);
      let productImages = {};
      if (scriptMatch && scriptMatch[1]) {
        try {
          // Convert JS object string to valid JSON for parsing
          let jsonStr = scriptMatch[1]
            .replace(/'/g, '"')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']');
          productImages = JSON.parse(jsonStr);
        } catch (e) {
          // Fallback regex if JSON parse fails
          const colorMatches = html.matchAll(/['"]([^'"]+)['"]:\s*\{\s*['"]front['"]:\s*['"]([^'"]+)['"]/g);
          const type = html.match(/let currentProductType = '([^']+)';/)?.[1] || 'Product';
          productImages[type] = {};
          for (const match of colorMatches) { productImages[type][match[1]] = { front: match[2] }; }
        }
      }

      const data = { colors, productImages };
      this.colorCache[productPageUrl] = data;
      return data;
    } catch (error) {
      return { colors: [], productImages: {} };
    }
  },

  updateCardImage(card, selectedColor, productImages) {
    const img = card.querySelector('img');
    const productType = Object.keys(productImages)[0];
    if (img && productType && productImages[productType][selectedColor]) {
      const newSrc = productImages[productType][selectedColor].front;
      if (newSrc) img.src = newSrc;
    }
  },

  async initializeCard(card) {
    const link = card.querySelector('a');
    if (!link) return;

    const { colors, productImages } = await this.fetchColorDataFromProductPage(link.href);
    if (colors.length === 0) return;

    const desc = card.querySelector('p');
    if (desc && desc.textContent.includes('Description')) {
      let html = `<div class="product-card-colors"><div class="color-swatches-container">`;
      colors.forEach((c, i) => {
        html += `<button class="listing-color-swatch ${i===0?'active':''}" data-color="${c.name}" style="background-color: ${c.bgColor}"></button>`;
      });
      html += `</div></div>`;
      desc.outerHTML = html;

      card.querySelectorAll('.listing-color-swatch').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation();
          card.querySelectorAll('.listing-color-swatch').forEach(s => s.classList.remove('active'));
          btn.classList.add('active');
          this.updateCardImage(card, btn.dataset.color, productImages);
        });
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.product').forEach(card => ProductColorsManager.initializeCard(card));
});
