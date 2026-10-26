const html = document.documentElement;
const themeToggleBtn = document.getElementById('theme-toggle');

const getSavedTheme = () => { try { return localStorage.getItem('theme'); } catch { return null; } };
const setSavedTheme = (t) => { try { localStorage.setItem('theme', t); } catch {} };

const savedTheme = getSavedTheme();
if (savedTheme === 'light' || (!savedTheme && window.matchMedia('(prefers-color-scheme: light)').matches)) {
    html.classList.remove('dark');
} else {
    html.classList.add('dark');
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const isDark = html.classList.contains('dark');
        html.classList.toggle('dark', !isDark);
        setSavedTheme(isDark ? 'light' : 'dark');
        runMonteCarloDemo();
    });
}

/* --- Particle Canvas --- */
const canvas = document.getElementById('hero-canvas');
const ctx = canvas?.getContext('2d');
const heroSection = document.getElementById('hero-section');

let width = 0, height = 0, particles = [];
let mouse = { x: -1000, y: -1000, isDown: false, radius: 140 };

function resize() {
    if (!canvas || !heroSection) return;
    width = canvas.width = heroSection.clientWidth || window.innerWidth;
    height = canvas.height = heroSection.clientHeight || 500;
}

class Particle {
    constructor() {
        this.x = Math.random() * (width || 800);
        this.y = Math.random() * (height || 600);
        this.vx = (Math.random() - 0.5) * 1.8;
        this.vy = (Math.random() - 0.5) * 1.8;
        this.baseX = this.x;
        this.baseY = this.y;
        this.hue = (this.x / (width || 800)) * 360;
        this.size = Math.random() * 2 + 0.5;
        this.friction = Math.random() * 0.04 + 0.94;
        this.mass = Math.random() * 2 + 1;
    }

    update() {
        const dx = mouse.x - this.x, dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (mouse.isDown && dist < mouse.radius * 3) {
            const force = (mouse.radius * 3 - dist) / (mouse.radius * 3);
            this.vx += (dx / dist) * force * 1.5 / this.mass;
            this.vy += (dy / dist) * force * 1.5 / this.mass;
            this.hue = (this.hue + 1) % 360;
        } else {
            if (dist < mouse.radius) {
                const force = (mouse.radius - dist) / mouse.radius;
                this.vx -= (dx / dist) * force * 0.5;
                this.vy -= (dy / dist) * force * 0.5;
            }
            this.vx += (this.baseX - this.x) * 0.001;
            this.vy += (this.baseY - this.y) * 0.001;
        }

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        this.hue = (this.x / (width || 1)) * 360;
        if (mouse.isDown) this.hue += 5;
    }

    draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        const isDark = html.classList.contains('dark');
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        ctx.fillStyle = isDark 
            ? `hsl(${this.hue}, 90%, ${Math.min(speed * 5 + 50, 80)}%)`
            : `hsl(${this.hue}, 80%, 45%)`;
        ctx.fill();
    }
}

function animate() {
    if (!ctx) return;
    ctx.fillStyle = html.classList.contains('dark') ? 'rgba(3,7,18,0.25)' : 'rgba(248,250,252,0.25)';
    ctx.fillRect(0, 0, width, height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
}

if (heroSection) {
    heroSection.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    heroSection.addEventListener('mousedown', () => mouse.isDown = true);
    window.addEventListener('mouseup', () => mouse.isDown = false);
    heroSection.addEventListener('mouseleave', () => {
        mouse.x = mouse.y = -1000;
        mouse.isDown = false;
    });
}

/* --- Monte Carlo Visualizer --- */
function runMonteCarloDemo() {
    const mcCanvas = document.getElementById('mc-canvas');
    if (!mcCanvas) return;
    const mcCtx = mcCanvas.getContext('2d');
    const w = mcCanvas.width = mcCanvas.clientWidth || 350;
    const h = mcCanvas.height = mcCanvas.clientHeight || 200;

    mcCtx.fillStyle = '#020617';
    mcCtx.fillRect(0, 0, w, h);

    mcCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    mcCtx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) { mcCtx.beginPath(); mcCtx.moveTo(x, 0); mcCtx.lineTo(x, h); mcCtx.stroke(); }
    for (let y = 0; y < h; y += 25) { mcCtx.beginPath(); mcCtx.moveTo(0, y); mcCtx.lineTo(w, y); mcCtx.stroke(); }

    const steps = 30, stepWidth = w / steps;
    for (let sim = 0; sim < 18; sim++) {
        mcCtx.beginPath();
        let currentY = h * 0.65;
        mcCtx.moveTo(0, currentY);

        for (let step = 1; step <= steps; step++) {
            currentY = Math.max(10, Math.min(h - 10, currentY - 0.3 + (Math.random() - 0.48) * 12));
            mcCtx.lineTo(step * stepWidth, currentY);
        }

        mcCtx.strokeStyle = `hsla(${190 + (sim * 8) % 90}, 85%, 65%, 0.8)`;
        mcCtx.lineWidth = 1.8;
        mcCtx.stroke();
    }
}
document.getElementById('run-mc-btn')?.addEventListener('click', runMonteCarloDemo);

/* --- Initialization --- */
window.addEventListener('resize', () => { resize(); runMonteCarloDemo(); });
document.addEventListener('DOMContentLoaded', () => {
    resize();
    particles = Array.from({ length: 650 }, () => new Particle());
    animate();
    runMonteCarloDemo();
});
