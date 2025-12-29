const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

async function registerStart(username, displayName, token) {
  const response = await fetch(`${API_BASE}/auth/register/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      username,
      display_name: displayName,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration start failed');
  }

  return response.json();
}

async function registerFinish(username, credential, challenge, token) {
  const response = await fetch(`${API_BASE}/auth/register/finish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      username,
      credential,
      challenge,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }

  return response.json();
}

async function loginStart(username) {
  const response = await fetch(`${API_BASE}/auth/login/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login start failed');
  }

  return response.json();
}

async function loginFinish(username, assertion, challenge) {
  const response = await fetch(`${API_BASE}/auth/login/finish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      assertion,
      challenge,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Authentication failed');
  }

  return response.json();
}

async function passwordLogin(username, password) {
  const response = await fetch(`${API_BASE}/auth/password/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }

  return response.json();
}

async function getPasskeys(token) {
  const response = await fetch(`${API_BASE}/auth/passkeys`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch passkeys');
  }

  return response.json();
}

async function deletePasskey(token) {
  const response = await fetch(`${API_BASE}/auth/passkeys`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete passkey');
  }

  return response.json();
}

async function registerQrStart(username, displayName, token) {
  const response = await fetch(`${API_BASE}/auth/register/qr/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      username,
      display_name: displayName,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'QR registration start failed');
  }

  return response.json();
}

async function getQrStatus(sessionId, token) {
  const response = await fetch(`${API_BASE}/auth/register/qr/${sessionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get QR status');
  }

  return response.json();
}

export {
  registerStart,
  registerFinish,
  loginStart,
  loginFinish,
  passwordLogin,
  getPasskeys,
  deletePasskey,
  registerQrStart,
  getQrStatus,
};
