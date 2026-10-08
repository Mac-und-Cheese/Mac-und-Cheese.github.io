/* --- Safely Handle Theme Toggle --- */
const themeToggleBtn = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;

function getSavedTheme() {
    try {
        return localStorage.getItem('theme');
    } catch(e) {
        return null;
    }
}

function setSavedTheme(theme) {
    try {
        localStorage.setItem('theme', theme);
    } catch(e) {}
}

const savedTheme = getSavedTheme();
if (savedTheme === 'light' || (!savedTheme && window.matchMedia('(prefers-color-scheme: light)').matches)) {
    htmlElement.classList.remove('dark');
} else {
    htmlElement.classList.add('dark');
}

/* --- Signal Interference Transition for Leaving Curse Mode --- */
function triggerSignalInterference(callback) {
    const overlay = document.createElement('div');
    overlay.className = 'signal-interference-overlay';
    document.body.appendChild(overlay);

    // 中途（0.4 秒）於背景執行 Theme 與 Curse Mode 的清除
    setTimeout(() => {
        if (callback) callback();
    }, 400);

    // 0.85 秒後干擾結束，移除覆蓋層
    setTimeout(() => {
        overlay.remove();
    }, 850);
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        if (htmlElement.classList.contains('dark')) {
            if (isSpooky) {
                // 若處於 Curse Mode，觸發電視訊號干擾效果
                triggerSignalInterference(() => {
                    htmlElement.classList.remove('dark');
                    setSavedTheme('light');
                    clearCurseMode();
                    updateDoodleColorDefault();
                    runMonteCarloDemo();
                });
            } else {
                htmlElement.classList.remove('dark');
                setSavedTheme('light');
                clearCurseMode();
                updateDoodleColorDefault();
                runMonteCarloDemo();
            }
        } else {
            htmlElement.classList.add('dark');
            setSavedTheme('dark');
            updateDoodleColorDefault();
            runMonteCarloDemo();
        }
    });
}

/* --- Hero Canvas & Particles System --- */
const canvas = document.getElementById('hero-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const heroSection = document.getElementById('hero-section');

let width = 0, height = 0;
let particles = [];
const numParticles = 650;
let mouse = { x: -1000, y: -1000, isDown: false, radius: 140 };
let isSpooky = false;

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
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (mouse.isDown) {
            if (distance < mouse.radius * 3) {
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let force = (mouse.radius * 3 - distance) / (mouse.radius * 3);
                this.vx += forceDirectionX * force * 1.5 / this.mass;
                this.vy += forceDirectionY * force * 1.5 / this.mass;
                this.hue = (this.hue + 1) % 360;
            }
        } else {
            if (distance < mouse.radius) {
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let force = (mouse.radius - distance) / mouse.radius;
                this.vx -= forceDirectionX * force * 0.5;
                this.vy -= forceDirectionY * force * 0.5;
            }
            let homeDx = this.baseX - this.x;
            let homeDy = this.baseY - this.y;
            this.vx += homeDx * 0.001;
            this.vy += homeDy * 0.001;
        }

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        if (!isSpooky) {
            this.hue = (this.x / (width || 1)) * 360;
            if (mouse.isDown) this.hue += 5; 
        }
    }

    draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);

        if (isSpooky) {
            ctx.fillStyle = `hsl(0, 100%, ${Math.random() * 50 + 40}%)`;
        } else {
            const isDarkMode = htmlElement.classList.contains('dark');
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            
            if (isDarkMode) {
                const lightness = Math.min(speed * 5 + 50, 80); 
                ctx.fillStyle = `hsl(${this.hue}, 90%, ${lightness}%)`;
            } else {
                ctx.fillStyle = `hsl(${this.hue}, 80%, 45%)`;
            }
        }
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
    }
}

function animate() {
    if (!ctx) return;
    const isDarkMode = htmlElement.classList.contains('dark');

    if (isSpooky) {
        ctx.fillStyle = 'rgba(20, 0, 0, 0.25)';
    } else if (isDarkMode) {
        ctx.fillStyle = 'rgba(3, 7, 18, 0.25)';
    } else {
        ctx.fillStyle = 'rgba(248, 250, 252, 0.25)';
    }
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    requestAnimationFrame(animate);
}

if (heroSection) {
    heroSection.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
    });
    heroSection.addEventListener('mousedown', () => mouse.isDown = true);
    window.addEventListener('mouseup', () => mouse.isDown = false);
    heroSection.addEventListener('mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
        mouse.isDown = false;
    });
}

/* --- Curse Mode & Glitch Logic --- */
let clickCount = 0;
let errorBannerTimer = null;
let floatingErrorInterval = null;
let textCorruptInterval = null;
let continuousBleedInterval = null;

let lastPageX = -1000;
let lastPageY = -1000;

const profilePic = document.getElementById('profile-pic');
const heroTitle = document.getElementById('hero-title');
const originalTitleHTML = heroTitle ? heroTitle.innerHTML : '';
const spookyBanner = document.getElementById('spooky-error-banner');
const errorBannerText = document.getElementById('error-banner-text');

const errorMessages = [
    "CRITICAL_EXCEPTION: Memory stack corrupted at 0x00F48A.",
    "FATAL_ERROR: Unauthorized presence detected in kernel thread.",
    "SYSTEM_FAILURE: Failed to render reality buffer.",
    "SEGMENTATION_FAULT: Entity escaping process memory bounds.",
    "WARNING: System boundary breached. Do not look behind you."
];

const hexErrors = [
    "0x00F48A", "0x000000", "ERR_MEM_LEAK", "0x89FA3", 
    "SEGMENTATION_FAULT", "0xDEADBEEF", "FATAL_EXCEPTION", 
    "SYSTEM_CORRUPT", "0x7F0014", "STACK_OVERFLOW", "CRITICAL_FAILURE"
];

const creepyWhispers = [
    "BEHIND YOU", "HELP ME", "RUN", "0x666", "I SEE YOU", 
    "DONT LOOK", "IT BURNS", "†", "‡", "HE IS HERE", "SYSTEM_DEAD",
    "NULL_POINTER", "VOID", "CANNOT_ESCAPE", "NO_SIGNAL", "0x000000"
];

function hideErrorBanner() {
    if (spookyBanner) {
        spookyBanner.classList.add('opacity-0', 'pointer-events-none', 'scale-90');
        spookyBanner.classList.remove('opacity-100', 'pointer-events-auto', 'scale-100');
    }
}

function scheduleRandomErrorBanner() {
    if (!isSpooky) return;

    const delay = Math.random() * 3000 + 2500;

    errorBannerTimer = setTimeout(() => {
        if (!isSpooky) return;

        if (errorBannerText) {
            errorBannerText.textContent = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        }

        if (spookyBanner) {
            spookyBanner.classList.remove('opacity-0', 'pointer-events-none', 'scale-90');
            spookyBanner.classList.add('opacity-100', 'pointer-events-auto', 'scale-100');
        }

        const displayDuration = Math.random() * 1000 + 1800;
        setTimeout(() => {
            hideErrorBanner();
            scheduleRandomErrorBanner();
        }, displayDuration);

    }, delay);
}

function spawnFloatingError() {
    if (!isSpooky) return;

    const errCode = document.createElement('div');
    errCode.className = 'floating-error-code';
    errCode.textContent = hexErrors[Math.floor(Math.random() * hexErrors.length)];

    const x = Math.random() * (window.innerWidth - 120);
    const y = Math.random() * (window.innerHeight - 40);

    errCode.style.left = `${x}px`;
    errCode.style.top = `${y}px`;
    errCode.style.fontSize = `${Math.floor(Math.random() * 8 + 12)}px`;

    document.body.appendChild(errCode);

    setTimeout(() => {
        errCode.remove();
    }, 1200);
}

function corruptRandomText() {
    if (!isSpooky) return;
    const targets = document.querySelectorAll('p, h2, h3, span.interest-tag');
    if (targets.length === 0) return;

    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
    const originalText = randomTarget.innerText;

    const glitchChars = '01#\$&%@!X§Øµ†‡¶/\\<>[]{}=+~?*|_';
    let scrambled = '';
    for (let i = 0; i < Math.min(originalText.length, 15); i++) {
        scrambled += glitchChars[Math.floor(Math.random() * glitchChars.length)];
    }

    randomTarget.innerText = scrambled;

    setTimeout(() => {
        randomTarget.innerText = originalText;
    }, 800);
}

function spawnCurseParticle(x, y) {
    if (!isSpooky || x < 0 || y < 0) return;

    const particle = document.createElement('div');
    particle.className = 'curse-trail-particle';

    const offsetX = (Math.random() - 0.5) * 8;
    const offsetY = (Math.random() - 0.5) * 6;

    particle.style.left = `${x + offsetX}px`;
    particle.style.top = `${y + offsetY}px`;

    if (Math.random() > 0.35) {
        particle.classList.add('curse-trail-drip');
    } else {
        particle.classList.add('curse-trail-text');
        particle.textContent = creepyWhispers[Math.floor(Math.random() * creepyWhispers.length)];

        const dx = (Math.random() - 0.5) * 45;
        const rot = (Math.random() - 0.5) * 35;
        particle.style.setProperty('--dx', `${dx}px`);
        particle.style.setProperty('--rot', `${rot}deg`);
    }

    document.body.appendChild(particle);

    setTimeout(() => {
        particle.remove();
    }, 1000);
}

document.addEventListener('mousemove', (e) => {
    lastPageX = e.pageX;
    lastPageY = e.pageY;

    if (!isSpooky) return;
    if (Math.random() > 0.4) return;
    spawnCurseParticle(lastPageX, lastPageY);
});

function clearCurseMode() {
    isSpooky = false;
    clickCount = 0;
    if (errorBannerTimer) clearTimeout(errorBannerTimer);
    if (floatingErrorInterval) clearInterval(floatingErrorInterval);
    if (textCorruptInterval) clearInterval(textCorruptInterval);
    if (continuousBleedInterval) clearInterval(continuousBleedInterval);

    hideErrorBanner();

    document.body.classList.remove('spooky-mode');
    if (heroTitle) {
        heroTitle.classList.remove('glitch-text');
        heroTitle.innerHTML = originalTitleHTML;
    }
}

function triggerCurseMode() {
    if (!htmlElement.classList.contains('dark')) return;

    isSpooky = true;
    document.body.classList.add('spooky-mode');
    if (heroTitle) {
        heroTitle.classList.add('glitch-text');
        heroTitle.innerHTML = "RUN WHILE YOU STILL CAN...";
    }

    scheduleRandomErrorBanner();
    floatingErrorInterval = setInterval(spawnFloatingError, 200);
    textCorruptInterval = setInterval(corruptRandomText, 1500);

    continuousBleedInterval = setInterval(() => {
        if (isSpooky && lastPageX >= 0 && lastPageY >= 0) {
            spawnCurseParticle(lastPageX, lastPageY);
        }
    }, 130);
}

if (profilePic) {
    profilePic.addEventListener('click', () => {
        if (!htmlElement.classList.contains('dark')) return;
        clickCount++;
        if (clickCount === 5) {
            triggerCurseMode();
        }
    });
}

const creepyBadge = document.getElementById('creepy-badge');
if (creepyBadge) {
    creepyBadge.addEventListener('click', triggerCurseMode);
}

/* --- Monte Carlo Visualizer Logic --- */
function runMonteCarloDemo() {
    const mcCanvas = document.getElementById('mc-canvas');
    if (!mcCanvas) return;
    const mcCtx = mcCanvas.getContext('2d');

    mcCanvas.width = mcCanvas.clientWidth || 350;
    mcCanvas.height = mcCanvas.clientHeight || 200;
    const w = mcCanvas.width;
    const h = mcCanvas.height;

    mcCtx.fillStyle = isSpooky ? '#200005' : '#020617';
    mcCtx.fillRect(0, 0, w, h);

    mcCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    mcCtx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
        mcCtx.beginPath();
        mcCtx.moveTo(x, 0);
        mcCtx.lineTo(x, h);
        mcCtx.stroke();
    }
    for (let y = 0; y < h; y += 25) {
        mcCtx.beginPath();
        mcCtx.moveTo(0, y);
        mcCtx.lineTo(w, y);
        mcCtx.stroke();
    }

    const numSimulations = 18;
    const steps = 30;
    const stepWidth = w / steps;

    for (let sim = 0; sim < numSimulations; sim++) {
        mcCtx.beginPath();
        let currentY = h * 0.65;
        mcCtx.moveTo(0, currentY);

        for (let step = 1; step <= steps; step++) {
            const x = step * stepWidth;
            const drift = -0.3;
            const volatility = (Math.random() - 0.48) * 12;
            currentY += drift + volatility;
            currentY = Math.max(10, Math.min(h - 10, currentY));
            mcCtx.lineTo(x, currentY);
        }

        if (isSpooky) {
            mcCtx.strokeStyle = `hsla(0, 100%, ${Math.random() * 40 + 40}%, 0.9)`;
        } else {
            const hue = 190 + (sim * 8) % 90;
            mcCtx.strokeStyle = `hsla(${hue}, 85%, 65%, 0.8)`;
        }
        mcCtx.lineWidth = 1.8;
        mcCtx.stroke();
    }
}

const runMcBtn = document.getElementById('run-mc-btn');
if (runMcBtn) {
    runMcBtn.addEventListener('click', runMonteCarloDemo);
}

/* --- Interactive Doodle Pad Logic --- */
const doodleCanvas = document.getElementById('doodle-canvas');
const dCtx = doodleCanvas ? doodleCanvas.getContext('2d') : null;
let isDrawing = false;
let strokeColor = '#6366f1';

function updateDoodleColorDefault() {
    if (!dCtx) return;
    if (strokeColor === 'auto') {
        dCtx.strokeStyle = htmlElement.classList.contains('dark') ? '#ffffff' : '#0f172a';
    }
}

function resizeDoodleCanvas() {
    if (!doodleCanvas || !dCtx) return;
    doodleCanvas.width = doodleCanvas.clientWidth;
    doodleCanvas.height = doodleCanvas.clientHeight;
    dCtx.lineCap = 'round';
    dCtx.lineJoin = 'round';
    dCtx.lineWidth = 3;
    dCtx.strokeStyle = strokeColor === 'auto' ? (htmlElement.classList.contains('dark') ? '#ffffff' : '#0f172a') : strokeColor;
}

if (doodleCanvas && dCtx) {
    function startDrawing(e) {
        isDrawing = true;
        const rect = doodleCanvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
        dCtx.beginPath();
        dCtx.moveTo(x, y);
    }

    function draw(e) {
        if (!isDrawing) return;
        const rect = doodleCanvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
        dCtx.lineTo(x, y);
        dCtx.stroke();
    }

    function stopDrawing() {
        isDrawing = false;
    }

    doodleCanvas.addEventListener('mousedown', startDrawing);
    doodleCanvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDrawing);

    doodleCanvas.addEventListener('touchstart', startDrawing, { passive: true });
    doodleCanvas.addEventListener('touchmove', draw, { passive: true });
    doodleCanvas.addEventListener('touchend', stopDrawing);
}

document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.color-btn').forEach(b => b.classList.replace('border-indigo-700', 'border-transparent'));
        btn.classList.replace('border-transparent', 'border-indigo-700');
        
        const col = btn.dataset.color;
        strokeColor = col;
        if (dCtx) {
            dCtx.strokeStyle = (col === 'auto') ? (htmlElement.classList.contains('dark') ? '#ffffff' : '#0f172a') : col;
        }
    });
});

const clearBtn = document.getElementById('clear-doodle-btn');
if (clearBtn && doodleCanvas && dCtx) {
    clearBtn.addEventListener('click', () => {
        dCtx.clearRect(0, 0, doodleCanvas.width, doodleCanvas.height);
    });
}

/* --- Eats Generator --- */
const budgetEats = [
    "AC1 Canteen - Roast Meat Combo Rice",
    "AC1 Canteen - Two Dishes Rice",
    "AC2 Canteen - Carbonara",
    "Nam Shan Estate - Ban Heung Lau",
    "AC3 Canteen - Pork Roll Rice",
    "Festival Walk Food Court"
];

const foodBtn = document.getElementById('pick-food-btn');
if (foodBtn) {
    foodBtn.addEventListener('click', function() {
        const display = document.getElementById('food-result');
        if (!display) return;
        display.classList.add('animate-pulse');
        display.textContent = "Spinning...";

        setTimeout(() => {
            const randomEat = budgetEats[Math.floor(Math.random() * budgetEats.length)];
            display.classList.remove('animate-pulse');
            display.textContent = randomEat;
        }, 300);
    });
}

/* --- Eye Tracker Pupil Movement --- */
document.addEventListener('mousemove', (e) => {
    const pupils = document.querySelectorAll('.pupil');
    pupils.forEach(pupil => {
        const eye = pupil.parentElement;
        const rect = eye.getBoundingClientRect();
        const eyeX = rect.left + rect.width / 2;
        const eyeY = rect.top + rect.height / 2;

        const angle = Math.atan2(e.clientY - eyeY, e.clientX - eyeX);
        const distance = 4;

        const pupilX = Math.cos(angle) * distance;
        const pupilY = Math.sin(angle) * distance;

        pupil.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
    });
});

/* --- Initialize Everything Safely --- */
window.addEventListener('resize', () => {
    resize();
    resizeDoodleCanvas();
    runMonteCarloDemo();
});

document.addEventListener('DOMContentLoaded', () => {
    resize();
    initParticles();
    animate();
    resizeDoodleCanvas();
    runMonteCarloDemo();
});