/* ============================================================
   NOCTURN FILMS — interaction script
   Nav, scroll reveal, active section, count-up, modals,
   cookie consent, mobile menu, graceful image errors.
   ============================================================ */
(function () {
    'use strict';
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Mobile menu ──
    var mobileToggle = document.getElementById('mobileToggle');
    var mobileMenu = document.getElementById('mobileMenu');

    function closeMobileMenu() {
        mobileToggle.classList.remove('active');
        mobileMenu.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', function () {
            var isOpen = mobileMenu.classList.toggle('open');
            mobileToggle.classList.toggle('active');
            mobileToggle.setAttribute('aria-expanded', String(isOpen));
            document.body.style.overflow = isOpen ? 'hidden' : '';
            if (isOpen) {
                var firstLink = mobileMenu.querySelector('a, button');
                if (firstLink) firstLink.focus();
            }
        });
        mobileMenu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', closeMobileMenu);
        });
        // Trap keyboard focus inside the open menu (ADA / WCAG)
        mobileMenu.addEventListener('keydown', function (e) {
            if (e.key !== 'Tab' || !mobileMenu.classList.contains('open')) return;
            var focusable = mobileMenu.querySelectorAll('a, button');
            if (!focusable.length) return;
            var first = focusable[0], last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
            else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
        });
    }

    // ── Navbar: scrolled state + auto-hide + scroll progress ──
    var navbar = document.getElementById('navbar');
    var progress = document.getElementById('scrollProgress');
    var lastScroll = 0;

    function onScroll() {
        var current = window.pageYOffset || document.documentElement.scrollTop;
        if (navbar) navbar.classList.toggle('scrolled', current > 20);
        if (navbar && !(mobileMenu && mobileMenu.classList.contains('open'))) {
            if (current > lastScroll && current > 240) { navbar.classList.add('hidden'); }
            else { navbar.classList.remove('hidden'); }
        }
        lastScroll = current;
        if (progress) {
            var docHeight = document.documentElement.scrollHeight - window.innerHeight;
            var ratio = docHeight > 0 ? current / docHeight : 0;
            progress.style.transform = 'scaleX(' + ratio + ')';
        }
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) { window.requestAnimationFrame(function () { onScroll(); ticking = false; }); ticking = true; }
    }, { passive: true });
    onScroll();

    // ── Scroll reveal ──
    if ('IntersectionObserver' in window) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        document.querySelectorAll('.reveal').forEach(function (el) { revealObserver.observe(el); });
    } else {
        document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
    }

    // ── Active section highlighting ──
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link[data-nav]'));
    var sections = ['hero', 'films', 'shop', 'about', 'team']
        .map(function (id) { return document.getElementById(id); }).filter(Boolean);

    if ('IntersectionObserver' in window && sections.length) {
        var sectionObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var id = entry.target.id;
                    navLinks.forEach(function (link) {
                        var match = link.getAttribute('href') === '#' + id;
                        link.classList.toggle('active', match);
                        if (match) { link.setAttribute('aria-current', 'true'); } else { link.removeAttribute('aria-current'); }
                    });
                }
            });
        }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
        sections.forEach(function (s) { sectionObserver.observe(s); });
    }

    // ── Count-up animation ──
    function animateCount(el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        if (isNaN(target)) return;
        var duration = 1400, start = null;
        function step(ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            var val = Math.round(eased * target);
            el.innerHTML = '<span class="accent">' + val + suffix + '</span>';
            if (p < 1) window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
    }

    var counters = document.querySelectorAll('.stat-value[data-count]');
    if (!prefersReduced && 'IntersectionObserver' in window && counters.length) {
        var countObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) { animateCount(entry.target); countObserver.unobserve(entry.target); }
            });
        }, { threshold: 0.5 });
        counters.forEach(function (c) { countObserver.observe(c); });
    }

    // ── Smooth scroll for in-page anchors ──
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var href = this.getAttribute('href');
            if (href === '#' || href.length < 2) return;
            var target = document.querySelector(href);
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' }); }
        });
    });

    // ── Modals (Terms / Privacy) ──
    var termsModal = document.getElementById('termsModal');
    var privacyModal = document.getElementById('privacyModal');
    var lastFocused = null;

    function openModal(modal) {
        if (!modal) return;
        lastFocused = document.activeElement;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        var closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) closeBtn.focus();
    }
    function closeModal(modal) {
        if (!modal || !modal.classList.contains('active')) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
        if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    var termsLink = document.getElementById('termsLink');
    var privacyLink = document.getElementById('privacyLink');
    var closeTerms = document.getElementById('closeTerms');
    var closePrivacy = document.getElementById('closePrivacy');
    if (termsLink) termsLink.addEventListener('click', function (e) { e.preventDefault(); openModal(termsModal); });
    if (privacyLink) privacyLink.addEventListener('click', function (e) { e.preventDefault(); openModal(privacyModal); });
    if (closeTerms) closeTerms.addEventListener('click', function () { closeModal(termsModal); });
    if (closePrivacy) closePrivacy.addEventListener('click', function () { closeModal(privacyModal); });

    [termsModal, privacyModal].forEach(function (modal) {
        if (!modal) return;
        modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(modal); });
    });

    function trapFocus(modal) {
        if (!modal) return;
        modal.addEventListener('keydown', function (e) {
            if (e.key !== 'Tab') return;
            var focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (!focusable.length) return;
            var first = focusable[0], last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
            else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
        });
    }
    trapFocus(termsModal);
    trapFocus(privacyModal);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeModal(termsModal); closeModal(privacyModal);
            if (mobileMenu && mobileMenu.classList.contains('open')) { closeMobileMenu(); mobileToggle.focus(); }
        }
    });

    // ── Cookie consent ──
    var cookieBanner = document.getElementById('cookieBanner');
    var cookieAccept = document.getElementById('cookieAccept');
    var cookieDecline = document.getElementById('cookieDecline');
    var cookiePrivacyLink = document.getElementById('cookiePrivacyLink');

    if (cookieBanner) {
        try { if (!localStorage.getItem('nocturn_cookie_consent')) cookieBanner.classList.add('active'); }
        catch (err) { cookieBanner.classList.add('active'); }

        var setConsent = function (value) {
            try { localStorage.setItem('nocturn_cookie_consent', value); } catch (err) {}
            cookieBanner.classList.remove('active');
        };
        if (cookieAccept) cookieAccept.addEventListener('click', function () { setConsent('all'); });
        if (cookieDecline) cookieDecline.addEventListener('click', function () { setConsent('essential'); });
        if (cookiePrivacyLink) cookiePrivacyLink.addEventListener('click', function (e) { e.preventDefault(); cookieBanner.classList.remove('active'); openModal(privacyModal); });
    }

    // ── Graceful image error handling ──
    document.querySelectorAll('img').forEach(function (img) {
        img.addEventListener('error', function () { this.style.opacity = '0.25'; });
    });

    // ── SR announcer ──
    var announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);
})();
