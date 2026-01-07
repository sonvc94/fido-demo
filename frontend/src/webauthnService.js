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

async function registerFinish(username, displayName, credential, challenge, token) {
  const response = await fetch(`${API_BASE}/auth/register/finish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      username,
      display_name: displayName,
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

// Usernameless login functions
async function loginUsernamelessStart() {
  const response = await fetch(`${API_BASE}/auth/login/usernameless/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Usernameless login start failed');
  }

  return response.json();
}

async function loginUsernamelessFinish(assertion, challenge) {
  const response = await fetch(`${API_BASE}/auth/login/usernameless/finish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      assertion,
      challenge,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Usernameless authentication failed');
  }

  return response.json();
}

// Cognito functions
async function cognitoPasswordLogin(username, password) {
  const response = await fetch(`${API_BASE}/auth/cognito/login-password`, {
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
    throw new Error(error.detail || 'Cognito password login failed');
  }

  return response.json();
}

async function cognitoRegisterStart(accessToken) {
  const response = await fetch(`${API_BASE}/auth/cognito/register/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      access_token: accessToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Cognito registration start failed');
  }

  return response.json();
}

async function cognitoRegisterFinish(accessToken, credential) {
  const response = await fetch(`${API_BASE}/auth/cognito/register/finish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      access_token: accessToken,
      credential,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Cognito registration failed');
  }

  return response.json();
}

async function cognitoLoginStart(username) {
  const response = await fetch(`${API_BASE}/auth/cognito/login/start`, {
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
    throw new Error(error.detail || 'Cognito login start failed');
  }

  return response.json();
}

async function cognitoLoginFinish(username, challengeResponses, session) {
  const response = await fetch(`${API_BASE}/auth/cognito/login/finish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      challenge_responses: challengeResponses,
      session,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Cognito authentication failed');
  }

  return response.json();
}

async function cognitoSignUp(username, password) {
  const response = await fetch(`${API_BASE}/auth/cognito/signup`, {
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
    throw new Error(error.detail || 'Cognito sign up failed');
  }

  return response.json();
}
async function cognitoConfirmSignUp(username, code) {
  const response = await fetch(`${API_BASE}/auth/cognito/confirm-signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Cognito sign up confirmation failed');
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
  loginUsernamelessStart,
  loginUsernamelessFinish,
  // Cognito exports
  cognitoPasswordLogin,
  cognitoRegisterStart,
  cognitoRegisterFinish,
  cognitoLoginStart,
  cognitoLoginFinish,
  cognitoSignUp,
  cognitoConfirmSignUp,
};
