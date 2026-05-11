/**
 * Product Colors Manager (Final Fix)
 * Robust extraction and view detection.
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
      
      // 1. Extract Colors from Swatches
      const colorSwatches = doc.querySelectorAll('.color-swatch');
      const colors = [];
      colorSwatches.forEach(swatch => {
        const name = swatch.dataset.color || swatch.getAttribute('data-color');
        if (name) {
          colors.push({
            name: name,
            bgColor: swatch.style.backgroundColor || '#ccc'
          });
        }
      });

      // 2. Extract Image Mappings from Script
      const scriptMatch = html.match(/const productImages = (\{[\s\S]*?\});/);
      let productImages = {};
      
      if (scriptMatch && scriptMatch[1]) {
        const scriptContent = scriptMatch[1];
        const typeMatch = html.match(/let currentProductType = ['"]([^'"]+)['"]/);
        const type = typeMatch ? typeMatch[1] : 'Product';
        productImages[type] = {};

        const colorBlockRegex = /['"]([^'"]+)['"]:\s*\{([\s\S]*?)\}/g;
        let blockMatch;
        
        while ((blockMatch = colorBlockRegex.exec(scriptContent)) !== null) {
          const colorName = blockMatch[1];
          const blockContent = blockMatch[2];
          const frontMatch = blockContent.match(/['"]front['"]:\s*['"]([^'"]+)['"]/);
          const backMatch = blockContent.match(/['"]back['"]:\s*['"]([^'"]+)['"]/);
          
          if (frontMatch || backMatch) {
            productImages[type][colorName] = {
              front: frontMatch ? frontMatch[1] : null,
              back: backMatch ? backMatch[1] : null
            };
          }
        }
      }

      const data = { colors, productImages };
      this.colorCache[productPageUrl] = data;
      return data;
    } catch (error) {
      console.error("Failed to fetch product data:", error);
      return { colors: [], productImages: {} };
    }
  },

  detectCurrentView(imgSrc) {
    const decodedSrc = decodeURIComponent(imgSrc);
    return (decodedSrc.includes('²') || decodedSrc.toLowerCase().includes('back')) ? 'back' : 'front';
  },

  updateCardImage(card, selectedColor, productImages) {
    const img = card.querySelector('img');
    if (!img) return;

    const currentView = this.detectCurrentView(img.src);
    const productType = Object.keys(productImages)[0];
    
    if (productType && productImages[productType][selectedColor]) {
      const colorData = productImages[productType][selectedColor];
      const newSrc = colorData[currentView] || colorData.front || colorData.back;
      if (newSrc) {
        img.src = newSrc;
      }
    }
  },

  async initializeCard(card) {
    const link = card.querySelector('a');
    if (!link) return;

    const productPageUrl = link.getAttribute('href');
    const { colors, productImages } = await this.fetchColorDataFromProductPage(productPageUrl);
    
    if (colors.length === 0) return;

    const paragraphs = card.querySelectorAll('p');
    let descPara = null;
    for (const p of paragraphs) {
      if (p.textContent.toLowerCase().includes('description')) {
        descPara = p;
        break;
      }
    }

    if (descPara) {
      const container = document.createElement('div');
      container.className = 'product-card-colors';
      const swatchesContainer = document.createElement('div');
      swatchesContainer.className = 'color-swatches-container';
      
      colors.forEach((c, i) => {
        const btn = document.createElement('button');
        btn.className = 'listing-color-swatch' + (i === 0 ? ' active' : '');
        btn.style.backgroundColor = c.bgColor;
        btn.dataset.color = c.name;
        btn.title = c.name;
        
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          container.querySelectorAll('.listing-color-swatch').forEach(s => s.classList.remove('active'));
          btn.classList.add('active');
          this.updateCardImage(card, c.name, productImages);
        });
        swatchesContainer.appendChild(btn);
      });
      
      container.appendChild(swatchesContainer);
      descPara.replaceWith(container);
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.product').forEach(card => ProductColorsManager.initializeCard(card));
  });
} else {
  document.querySelectorAll('.product').forEach(card => ProductColorsManager.initializeCard(card));
}
