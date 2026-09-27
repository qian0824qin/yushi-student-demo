(() => {
  const event = document.querySelector('meta[name="rain-event"]').content;
  const current = document.querySelector('meta[name="rain-version"]').content;
  const status = document.getElementById('version-status');
  const button = document.getElementById('refresh-information');
  let next = null, busy = false, active = null;
  const failure = () => {
    next = null; button.textContent = '刷新信息';
    status.textContent = '无法确认是否有更新。当前显示的是已加载内容，可能已经过时；请联网重试或通过既有学校通知核实。';
    status.className = 'attention';
  };
  async function check() {
    if (busy) return;
    busy = true; button.disabled = true; next = null;
    status.className = 'attention'; status.textContent = '正在核验当前上线版本…';
    active = new AbortController(); const timer = setTimeout(() => active.abort(), 6000);
    try {
      const url = new URL('./version.json', location.href); url.searchParams.set('_check', Date.now());
      const response = await fetch(url, {cache:'no-store', signal:active.signal, credentials:'omit', redirect:'error'});
      if (!response.ok) throw new Error('Unavailable');
      const data = await response.json();
      if (data.event !== event || !/^[a-f0-9]{64}$/.test(data.version)) throw new Error('Wrong event');
      if (data.version !== current) {
        next = data.version; status.textContent = '已有新版本。这一页是旧内容，请加载新版本后再查看安排。';
        button.textContent = '加载新版本';
      } else {
        status.className = 'muted'; status.textContent = '已核验：当前上线版本。核验时间：' + new Date().toLocaleString('zh-CN');
        button.textContent = '刷新信息';
      }
    } catch (_) { failure(); }
    finally { clearTimeout(timer); busy = false; button.disabled = false; active = null; }
  }
  button.addEventListener('click', () => {
    if (next) { const url = new URL(location.href); url.searchParams.set('_version', next); location.replace(url.href); }
    else check();
  });
  window.addEventListener('offline', () => { if (active) active.abort(); failure(); });
  window.addEventListener('online', check);
  window.addEventListener('focus', check);
  window.addEventListener('pageshow', check);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  setInterval(() => { if (!document.hidden) check(); }, 60000);
  check();
})();