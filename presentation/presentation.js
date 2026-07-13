(function () {
  const slideFiles = [
    'cover.html',
    '1.html',
    'engine.html',
    'use-cases.html',
    '2.html',
    'how-we-extend.html',
    'scene-understanding.html',
    'ai-pipeline.html',
    'ai-features.html',
    'future.html'
  ];

  const stage = document.getElementById('stage');
  const counter = document.getElementById('counter');
  const total = slideFiles.length;
  let current = 0;
  let frames = [];
  let preloaded = new Set();
  let isTransitioning = false;

  function getSlideFromHash() {
    const hash = parseInt(location.hash.replace('#', ''), 10);
    if (!Number.isNaN(hash) && hash >= 1 && hash <= total) {
      return hash;
    }
    return 1;
  }

  function updateHash(replace) {
    const url = '#' + current;
    if (replace) {
      history.replaceState(null, '', url);
    } else {
      history.pushState(null, '', url);
    }
  }

  function updateCounter() {
    counter.textContent = current + ' / ' + total;
  }

  function bindIframeEvents(iframe) {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.addEventListener('keydown', handleKeydown);
    doc.addEventListener('wheel', handleWheel, { passive: false });
    doc.addEventListener('touchstart', handleTouchStart, { passive: true });
    doc.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  function createFrame(index) {
    const frame = document.createElement('div');
    frame.className = 'slide-frame';
    frame.dataset.index = index;
    const iframe = document.createElement('iframe');
    iframe.src = slideFiles[index - 1];
    iframe.setAttribute('title', 'Slide ' + index);
    iframe.setAttribute('loading', index === current ? 'eager' : 'lazy');
    iframe.addEventListener('load', () => bindIframeEvents(iframe));
    frame.appendChild(iframe);
    frame.style.setProperty('--slide-scale', '1');
    return frame;
  }

  function updateFrameScale(frame) {
    if (!frame) return;
    const scale = Math.min(stage.clientWidth / 1920, stage.clientHeight / 1080);
    frame.style.setProperty('--slide-scale', scale.toFixed(6));
  }

  function refreshFrameScales() {
    frames.forEach(frame => updateFrameScale(frame));
  }

  function activate(index) {
    if (index === current) return;
    if (isTransitioning) return;
    const target = frames[index - 1];
    if (!target) return;
    frames.forEach((frame, i) => {
      if (!frame) return;
      frame.classList.toggle('active', i + 1 === index);
      updateFrameScale(frame);
    });
    current = index;
    updateCounter();
    updateHash(false);
    isTransitioning = true;
    window.setTimeout(() => { isTransitioning = false; }, 260);
    preloadNear(index);
  }

  function preloadNear(index) {
    const nearby = [index - 1, index + 1].filter(n => n >= 1 && n <= total && !preloaded.has(n));
    nearby.forEach(n => {
      const frame = createFrame(n);
      stage.appendChild(frame);
      frames[n - 1] = frame;
      preloaded.add(n);
    });
  }

  function showSlide(index) {
    if (index < 1) index = 1;
    if (index > total) index = total;
    if (!Array.isArray(frames) || frames.length !== total) {
      frames = Array(total).fill(null);
    }
    if (!frames[index - 1]) {
      const frame = createFrame(index);
      stage.appendChild(frame);
      frames[index - 1] = frame;
      preloaded.add(index);
    }
    preloadNear(index);
    activate(index);
  }

  function next() {
    showSlide(current + 1);
  }

  function prev() {
    showSlide(current - 1);
  }

  function first() {
    showSlide(1);
  }

  function last() {
    showSlide(total);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  function handleKeydown(event) {
    const key = event.key;
    if (['ArrowRight', ' ', 'Enter', 'PageDown'].includes(key)) {
      event.preventDefault();
      next();
    } else if (['ArrowLeft', 'PageUp'].includes(key)) {
      event.preventDefault();
      prev();
    } else if (key === 'Home') {
      event.preventDefault();
      first();
    } else if (key === 'End') {
      event.preventDefault();
      last();
    } else if (key.toLowerCase() === 'f') {
      event.preventDefault();
      toggleFullscreen();
    }
  }

  let wheelTimer = null;
  function handleWheel(event) {
    event.preventDefault();
    if (wheelTimer) return;
    wheelTimer = window.setTimeout(() => { wheelTimer = null; }, 220);
    if (event.deltaY > 0) next();
    if (event.deltaY < 0) prev();
  }

  function handleTouchStart(event) {
    touchStartX = event.touches[0].clientX;
  }

  let touchStartX = 0;
  function handleTouchEnd(event) {
    const touchEndX = event.changedTouches[0].clientX;
    const delta = touchEndX - touchStartX;
    if (delta > 70) prev();
    if (delta < -70) next();
  }

  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('wheel', handleWheel, { passive: false });
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchend', handleTouchEnd, { passive: true });
  window.addEventListener('dblclick', toggleFullscreen);
  window.addEventListener('hashchange', () => showSlide(getSlideFromHash()));
  window.addEventListener('popstate', () => showSlide(getSlideFromHash()));

  document.addEventListener('fullscreenchange', () => {
    document.body.classList.toggle('fullscreen', !!document.fullscreenElement);
    refreshFrameScales();
  });
  window.addEventListener('resize', refreshFrameScales);

  current = getSlideFromHash();
  updateCounter();
  if (!location.hash) {
    updateHash(true);
  }
  showSlide(current);
})();
