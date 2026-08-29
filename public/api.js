const Api = (() => {
  function token() { return localStorage.getItem('deliva_token'); }
  function user() { return JSON.parse(localStorage.getItem('deliva_user') || 'null'); }

  async function call(path, opts = {}) {
    const res = await fetch(`/api${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
        ...(opts.headers || {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  async function login(phone, password) {
    const data = await call('/auth/login', { method: 'POST', body: { phone, password } });
    localStorage.setItem('deliva_token', data.token);
    localStorage.setItem('deliva_user', JSON.stringify(data.user));
    return data.user;
  }

  function logout() {
    localStorage.removeItem('deliva_token');
    localStorage.removeItem('deliva_user');
    window.location.href = '/';
  }

  function requireRole(role) {
    const u = user();
    if (!u || u.role !== role) window.location.href = '/';
    return u;
  }

  return { call, login, logout, user, token, requireRole };
})();
