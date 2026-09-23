// RMC01.js - JavaScript for RMC01 website

// =============================
// Mobile Menu Toggle
// =============================
const hamburger = document.getElementById('hamburger');
const menu = document.getElementById('main-menu');

if (hamburger && menu) {
    hamburger.addEventListener('click', () => {
        menu.classList.toggle('active');
        hamburger.innerHTML = menu.classList.contains('active')
            ? '<i class="fas fa-times"></i>'
            : '<i class="fas fa-bars"></i>';
    });
}

// =============================
// Hero Slider
// =============================
const slides = document.querySelectorAll('.slide');
let currentSlide = 0;

if (slides.length > 0) {
    function showSlide(n) {
        slides.forEach(slide => slide.classList.remove('active'));
        currentSlide = (n + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
    }

    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    // Change slide every 5 seconds
    setInterval(nextSlide, 5000);
}

// =============================
// Back to Top Button
// =============================
const backToTop = document.getElementById('backToTop');

if (backToTop) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('active');
        } else {
            backToTop.classList.remove('active');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// =============================
// News Ticker Animation
// =============================
const tickerItems = document.querySelector('.ticker-items');
const items = document.querySelectorAll('.ticker-item');

if (tickerItems && items.length > 0) {
    items.forEach(item => {
        const clone = item.cloneNode(true);
        tickerItems.appendChild(clone);
    });
}
