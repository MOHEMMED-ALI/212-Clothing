// 1. Vanta.js NET Effect - The "Crazy" Background
// This creates a futuristic, interactive digital net that reacts to your mouse.
function initVanta() {
    VANTA.NET({
        el: "body", // Target the entire page background
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0xff4500, // Orange color to match your theme
        backgroundColor: 0x0, // Black background
        points: 15.00,
        maxDistance: 20.00,
        spacing: 15.00
    });
}

// 2. Vanilla-Tilt - The 3D Hover Effect
// This makes your product cards tilt in 3D when you hover over them.
function initTilt() {
    VanillaTilt.init(document.querySelectorAll(".product"), {
        max: 25,
        speed: 400,
        glare: true,
        "max-glare": 0.5,
    });
}

// Initialize everything when the page loads
window.addEventListener('DOMContentLoaded', () => {
    // We need to wait for the external scripts to load
    // so we'll check if the libraries are available
    const checkInterval = setInterval(() => {
        if (typeof VANTA !== 'undefined' && typeof VanillaTilt !== 'undefined') {
            initVanta();
            initTilt();
            clearInterval(checkInterval);
        }
    }, 100);
});