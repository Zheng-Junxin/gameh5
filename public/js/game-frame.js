document.addEventListener('DOMContentLoaded', () => {
  const iframe = document.getElementById('gameIframe');
  const wrapper = document.getElementById('gameFrameWrapper');
  const fullscreenBtn = document.getElementById('fullscreenBtn');

  if (!iframe || !fullscreenBtn) return;

  function resizeIframe() {
    const width = wrapper.clientWidth;
    const height = Math.min(width * 0.75, window.innerHeight - 200);
    iframe.style.height = height + 'px';
  }

  resizeIframe();
  window.addEventListener('resize', resizeIframe);

  fullscreenBtn.addEventListener('click', () => {
    const el = wrapper;
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      fullscreenBtn.textContent = '✕ 退出全屏';
    } else {
      fullscreenBtn.textContent = '⛶ 全屏';
    }
  });
});
