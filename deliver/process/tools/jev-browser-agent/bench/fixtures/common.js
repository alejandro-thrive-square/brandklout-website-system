// Every fixture reports what the agent did to the bench server; the scorer reads the events.
window.BENCH = 'http://127.0.0.1:8801';
window.report = (task, ev, data) => {
  const body = JSON.stringify({ task, ev, data: data ?? null, at: Date.now() });
  fetch(window.BENCH + '/report', { method: 'POST', body, mode: 'no-cors', keepalive: true });
};
