import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import {
  registerStart, registerFinish, loginStart, loginFinish, passwordLogin, getPasskeys, deletePasskey,
  registerQrStart, getQrStatus, loginUsernamelessStart, loginUsernamelessFinish,
  // Cognito imports
  cognitoPasswordLogin, cognitoRegisterStart, cognitoRegisterFinish, cognitoLoginStart, cognitoLoginFinish, cognitoSignUp, cognitoConfirmSignUp
} from './webauthnService';

function App() {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [message, setMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [authMode, setAuthMode] = useState('local'); // 'local' or 'cognito'
  const [cognitoToken, setCognitoToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // ... (existing code)

  const handleCognitoSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    console.log('Starting Cognito Sign Up for:', username);

    try {
      const response = await cognitoSignUp(username, password);
      console.log('Cognito Sign Up response:', response);
      setMessage('Sign Up successful! Please enter verification code sent to your email.');
      console.log('Switching to signup-confirm tab');
      setActiveTab('signup-confirm');
    } catch (error) {
      console.error('Cognito Sign Up error:', error);
      setMessage(error.message || 'Sign Up failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCognitoConfirmSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      await cognitoConfirmSignUp(username, confirmationCode);
      setMessage('Confirmation successful! You can now login.');
      setActiveTab('login');
      setConfirmationCode('');
    } catch (error) {
      setMessage(error.message || 'Confirmation failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ... (rest of component)



  const [token, setToken] = useState(localStorage.getItem('token'));
  const [passkeys, setPasskeys] = useState([]);
  const [qrCode, setQrCode] = useState(null);
  const [qrSessionId, setQrSessionId] = useState(null);
  const [qrStatus, setQrStatus] = useState('waiting');
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);
  const wsRef = useRef(null);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  useEffect(() => {
    console.log("APP VERSION: v1.1 - Fix Applied (Transports)");
    // Only fetch user info for local auth mode
    if (token && authMode === 'local') {
      fetchUserInfo();
    }
  }, [token, authMode]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setUsername(data.username);  // Set username from server response
        setHasPasskey(data.has_passkey);
        setIsAuthenticated(true);
        fetchPasskeys();

        // Don't show prompt on page load, only after fresh password login
        setShowRegistrationPrompt(false);
      } else {
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchPasskeys = async () => {
    try {
      const data = await getPasskeys(token);
      setPasskeys(data.passkeys || []);
    } catch (error) {
      console.error('Error fetching passkeys:', error);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      if (authMode === 'local') {
        const result = await passwordLogin(username, password);
        setToken(result.access_token);
        localStorage.setItem('token', result.access_token);
        setMessage('Login successful!');
        setIsAuthenticated(true);
        setUser(result);
        setUsername(result.username);  // Set username from login response
        setHasPasskey(result.has_passkey);

        // Show registration prompt if user doesn't have a passkey
        if (!result.has_passkey) {
          setShowRegistrationPrompt(true);
        }
        setActiveTab('dashboard');
      } else {
        // Cognito Password Login
        const result = await cognitoPasswordLogin(username, password);
        setCognitoToken(result.AccessToken);
        setMessage('Cognito Login successful! You can now register a passkey.');
        setActiveTab('cognito-register');
      }
    } catch (error) {
      setMessage(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterPasskey = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      if (authMode === 'local') {
        const { challenge, options } = await registerStart(username, displayName, token);
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: base64urlToBytes(options.challenge),
            rp: options.rp,
            user: {
              id: base64urlToBytes(options.user.id),
              name: options.user.name,
              displayName: options.user.displayName,
            },
            pubKeyCredParams: options.pubKeyCredParams,
            timeout: options.timeout,
            attestation: options.attestation,
            authenticatorSelection: options.authenticatorSelection,
          },
        });

        await registerFinish(username, displayName, credentialToObject(credential), challenge, token);
        setMessage('Passkey registered successfully!');
        setHasPasskey(true);
        setShowRegistrationPrompt(false);
        fetchPasskeys();
      } else {
        // Cognito Passkey Registration
        const options = await cognitoRegisterStart(cognitoToken);
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: base64urlToBytes(options.challenge),
            rp: options.rp,
            user: {
              id: base64urlToBytes(options.user.id),
              name: options.user.name,
              displayName: options.user.displayName,
            },
            pubKeyCredParams: options.pubKeyCredParams,
            timeout: options.timeout,
            attestation: options.attestation,
            authenticatorSelection: options.authenticatorSelection,
          },
        });

        await cognitoRegisterFinish(cognitoToken, credentialToObject(credential));
        setMessage('Cognito Passkey registered successfully!');
        setHasPasskey(true);
      }
    } catch (error) {
      setMessage(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQrRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setQrStatus('waiting');

    try {
      const result = await registerQrStart(username, displayName, token);
      setQrCode(result.qr_code);
      setQrSessionId(result.session_id);

      // Connect to WebSocket for real-time updates
      const wsUrl = API_BASE.replace(/^http/, 'ws');
      const ws = new WebSocket(`${wsUrl}/ws/register/${result.session_id}`);

      ws.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.status === 'completed' || data.success) {
          setQrStatus('completed');
          setMessage('Passkey registered successfully via QR code!');
          setHasPasskey(true);
          setShowRegistrationPrompt(false); // Hide the prompt after successful registration
          fetchPasskeys();
          ws.close();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
      };

      wsRef.current = ws;

      // Poll for status as fallback
      const pollInterval = setInterval(async () => {
        try {
          const status = await getQrStatus(result.session_id);
          if (status.completed) {
            clearInterval(pollInterval);
            setQrStatus('completed');
            setMessage('Passkey registered successfully via QR code!');
            setHasPasskey(true);
            setShowRegistrationPrompt(false); // Hide the prompt after successful registration
            fetchPasskeys();
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 2000);

      // Stop polling after 5 minutes
      setTimeout(() => clearInterval(pollInterval), 300000);

    } catch (error) {
      setMessage(error.message || 'QR registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      if (authMode === 'local') {
        const { challenge, options } = await loginStart(username);

        const credential = await navigator.credentials.get({
          publicKey: {
            challenge: base64urlToBytes(options.challenge),
            rpId: options.rpId,
            timeout: options.timeout,
            allowCredentials: options.allowCredentials?.map(cred => ({
              id: base64urlToBytes(cred.id),
              type: cred.type,
            })),
            userVerification: options.userVerification,
          },
        });

        const result = await loginFinish(username, assertionToObject(credential), challenge);
        setToken(result.access_token);
        localStorage.setItem('token', result.access_token);
        setMessage('Authentication successful!');
        setIsAuthenticated(true);
        setUser(result);
        setHasPasskey(true);
        setActiveTab('dashboard');
      } else {
        // Cognito Passkey Login
        const startResponse = await cognitoLoginStart(username);
        console.log("Cognito Login Start Response:", startResponse);

        if (!startResponse.ChallengeParameters) {
          throw new Error("Missing ChallengeParameters. User might not be set up for WebAuthn.");
        }

        const options = JSON.parse(startResponse.ChallengeParameters.CREDENTIAL_REQUEST_OPTIONS);
        console.log("Full Options from Cognito:", options);

        const challenge = options.challenge || startResponse.ChallengeParameters.CHALLENGE;
        const allowCredentials = options.allowCredentials;

        console.log("Using Challenge:", challenge);
        console.log("Allow Credentials:", allowCredentials);

        const credential = await navigator.credentials.get({
          publicKey: {
            challenge: base64urlToBytes(challenge),
            rpId: 'localhost', // Or your RP ID
            allowCredentials: allowCredentials.map(cred => ({
              id: base64urlToBytes(cred.id),
              type: cred.type
            })),
            userVerification: 'preferred'
          }
        });

        const assertion = assertionToObject(credential);

        // This must match what Cognito expects for WEB_AUTHN challenge response
        const challengeResponses = {
          'USERNAME': username,
          'CREDENTIAL': JSON.stringify(assertion)
        };

        const result = await cognitoLoginFinish(username, challengeResponses, startResponse.Session);
        setMessage('Cognito Authentication Successful!');
        setIsAuthenticated(true);
        const userInfo = { username: username, display_name: username };
        setUser(userInfo);
        setActiveTab('dashboard');
      }
    } catch (error) {
      setMessage(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernamelessLogin = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const { challenge, options } = await loginUsernamelessStart();

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: base64urlToBytes(options.challenge),
          rpId: options.rpId,
          timeout: options.timeout,
          allowCredentials: options.allowCredentials?.map(cred => ({
            id: base64urlToBytes(cred.id),
            type: cred.type,
          })),
          userVerification: options.userVerification,
        },
      });

      const result = await loginUsernamelessFinish(assertionToObject(credential), challenge);
      setToken(result.access_token);
      localStorage.setItem('token', result.access_token);
      setMessage(`Authentication successful! Welcome, ${result.username}!`);
      setIsAuthenticated(true);
      setUser(result);
      setHasPasskey(true);
      setActiveTab('dashboard');
      setUsername(result.username); // Set username after successful login
    } catch (error) {
      setMessage(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePasskey = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!window.confirm('Are you sure you want to delete your passkey? You will need to login with password after this.')) {
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      await deletePasskey(token);
      setMessage('Passkey deleted successfully!');
      setHasPasskey(false);
      setPasskeys([]);
    } catch (error) {
      setMessage(error.message || 'Delete failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSwitch = (mode) => {
    setAuthMode(mode);
    setActiveTab('login');
    setMessage('');
    setIsAuthenticated(false);
    setUser(null);
    setHasPasskey(false);
    setPasskeys([]);
    setQrCode(null);
    setQrStatus('waiting');

    // Clear Cognito state if switching away/to (resetting session)
    setCognitoToken(null);
  };

  const handleLogout = () => {
    if (authMode === 'local') {
      localStorage.removeItem('token');
      setToken(null);
    } else {
      setCognitoToken(null);
    }

    setIsAuthenticated(false);
    setUser(null);
    setUsername('');
    setPassword('');
    setDisplayName('');
    setMessage('');
    setHasPasskey(false);
    setPasskeys([]);
    setActiveTab('login');
    setQrCode(null);
    setQrSessionId(null);
    setQrStatus('waiting');

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  function base64urlToBytes(base64url) {
    if (!base64url) {
      console.error("base64urlToBytes received empty input");
      return new Uint8Array(0);
    }
    const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
    const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  function bytesToBase64url(bytes) {
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  function credentialToObject(credential) {
    const credentialObj = {
      id: credential.id,
      rawId: bytesToBase64url(new Uint8Array(credential.rawId)),
      type: credential.type,
      response: {
        clientDataJSON: bytesToBase64url(new Uint8Array(credential.response.clientDataJSON)),
        attestationObject: bytesToBase64url(new Uint8Array(credential.response.attestationObject)),
        transports: credential.response.getTransports ? credential.response.getTransports() || [] : [],
      },
      clientExtensionResults: credential.getClientExtensionResults ? credential.getClientExtensionResults() : {},
    };
    console.log('Credential Object:', JSON.stringify(credentialObj, null, 2));
    return credentialObj;
  }

  function assertionToObject(assertion) {
    return {
      id: assertion.id,
      rawId: bytesToBase64url(new Uint8Array(assertion.rawId)),
      type: assertion.type,
      response: {
        clientDataJSON: bytesToBase64url(new Uint8Array(assertion.response.clientDataJSON)),
        authenticatorData: bytesToBase64url(new Uint8Array(assertion.response.authenticatorData)),
        signature: bytesToBase64url(new Uint8Array(assertion.response.signature)),
        userHandle: assertion.response.userHandle
          ? bytesToBase64url(new Uint8Array(assertion.response.userHandle))
          : null,
      },
    };
  }

  // Simplified Dashboard for Cognito
  if (isAuthenticated && user && authMode === 'cognito') {
    return (
      <div className="App">
        <div className="container">
          <header className="header">
            <h1>Cognito FIDO2 Auth</h1>
          </header>
          <div className="card">
            <h2>Welcome, {user.username}!</h2>
            <div className="alert alert-success">Authenticated via AWS Cognito</div>
            <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="App">
        <div className="container">
          <header className="header">
            <h1>FIDO2 Passkey Authentication</h1>
          </header>
          <div className="card">
            <h2>Welcome, {user.display_name || user.username}!</h2>
            <p className="success">You are successfully authenticated.</p>

            <div className="tabs">
              <button
                className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                Dashboard
              </button>
              <button
                className={`tab ${activeTab === 'manage-passkeys' ? 'active' : ''}`}
                onClick={() => setActiveTab('manage-passkeys')}
              >
                Manage Passkeys
              </button>
            </div>

            {activeTab === 'dashboard' && (
              <div className="tab-content">
                {/* Registration Prompt Banner */}
                {showRegistrationPrompt && !hasPasskey && (
                  <div className="registration-prompt-banner">
                    <div className="banner-content">
                      <div className="banner-icon">🔐</div>
                      <div className="banner-text">
                        <h3>Set Up Biometric Login for Faster Access!</h3>
                        <p>Register a passkey now to login instantly with Face ID, Touch ID, or Windows Hello - no password needed next time!</p>
                      </div>
                    </div>
                    <div className="banner-actions">
                      <button
                        onClick={() => {
                          setActiveTab('manage-passkeys');
                          setShowRegistrationPrompt(false);
                        }}
                        className="btn btn-primary"
                      >
                        Set Up Biometric Login
                      </button>
                      <button
                        onClick={() => setShowRegistrationPrompt(false)}
                        className="btn btn-secondary"
                      >
                        Skip for Now
                      </button>
                    </div>
                  </div>
                )}

                <div className="user-info">
                  <p><strong>Username:</strong> {user.username}</p>
                  <p><strong>Display Name:</strong> {user.display_name}</p>
                  <p><strong>Passkey Status:</strong> {hasPasskey ? 'Registered' : 'Not Registered'}</p>
                </div>
                <button onClick={handleLogout} className="btn btn-secondary">
                  Logout
                </button>
              </div>
            )}

            {activeTab === 'manage-passkeys' && (
              <div className="tab-content">
                <h3>Manage Your Passkeys</h3>

                {hasPasskey && passkeys.length > 0 ? (
                  <div className="passkey-list">
                    {passkeys.map((pk, index) => (
                      <div key={index} className="passkey-item">
                        <div className="passkey-info">
                          <p><strong>Passkey #{index + 1}</strong></p>
                          <p className="passkey-id">ID: {pk.credential_id.substring(0, 20)}...</p>
                        </div>
                        <button
                          onClick={handleDeletePasskey}
                          className="btn btn-danger"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="hint">No passkeys registered yet.</p>
                )}

                <div className="passkey-actions">
                  <h4>Add New Passkey</h4>

                  <div className="passkey-options">
                    <div className="passkey-option">
                      <h5>Option 1: Register on this device</h5>
                      <form onSubmit={handleRegisterPasskey}>
                        <div className="form-group">
                          <label htmlFor="display-name">Display Name</label>
                          <input
                            id="display-name"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                            placeholder="Enter a name for this passkey"
                          />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                          {isLoading ? 'Registering...' : 'Register on This Device'}
                        </button>
                      </form>
                    </div>

                    <div className="divider">OR</div>

                    <div className="passkey-option">
                      <h5>Option 2: Register with QR Code (Cross-Device)</h5>
                      <p className="hint">Register a passkey on your phone by scanning the QR code.</p>
                      <form onSubmit={handleQrRegister}>
                        <div className="form-group">
                          <label htmlFor="qr-display-name">Display Name</label>
                          <input
                            id="qr-display-name"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                            placeholder="e.g., iPhone Face ID"
                          />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                          {isLoading ? 'Generating QR...' : 'Generate QR Code'}
                        </button>
                      </form>

                      {qrCode && (
                        <div className="qr-container">
                          <h5>Scan this QR code with your phone:</h5>
                          <div className="qr-code-wrapper">
                            <img src={qrCode} alt="Registration QR Code" className="qr-code" />
                          </div>
                          <div className="qr-status">
                            {qrStatus === 'waiting' && (
                              <p className="hint">⏳ Waiting for passkey registration...</p>
                            )}
                            {qrStatus === 'completed' && (
                              <p className="success">✓ Passkey registered successfully!</p>
                            )}
                          </div>
                          <p className="qr-instructions">
                            1. Open your phone's camera app<br />
                            2. Point at the QR code<br />
                            3. Tap the link to open registration page<br />
                            4. Follow the prompts to register passkey
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button onClick={() => setActiveTab('dashboard')} className="btn btn-secondary">
                  Back to Dashboard
                </button>
              </div>
            )}

            {message && (
              <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>FIDO2 Passkey Authentication</h1>
          <p>Secure passwordless authentication using WebAuthn</p>
          <div className="mode-switch">
            <button
              className={`mode-btn ${authMode === 'local' ? 'active' : ''}`}
              onClick={() => handleModeSwitch('local')}
            >
              Local Auth
            </button>
            <button
              className={`mode-btn ${authMode === 'cognito' ? 'active' : ''}`}
              onClick={() => handleModeSwitch('cognito')}
            >
              Cognito Auth
            </button>
          </div>
        </header>

        <div className="card">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Start
            </button>
            {authMode === 'cognito' && !isAuthenticated && (
              <button
                className={`tab ${activeTab === 'signup' ? 'active' : ''}`}
                onClick={() => setActiveTab('signup')}
              >
                Sign Up
              </button>
            )}
            {authMode === 'cognito' && cognitoToken && (
              <button
                className={`tab ${activeTab === 'cognito-register' ? 'active' : ''}`}
                onClick={() => setActiveTab('cognito-register')}
              >
                Register Passkey
              </button>
            )}
          </div>

          {activeTab === 'signup' && (
            <div className="tab-content">
              <h2>Cognito Sign Up</h2>
              <form onSubmit={handleCognitoSignUp}>
                <div className="form-group">
                  <label htmlFor="signup-username">Username (Email)</label>
                  <input
                    id="signup-username"
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="signup-password">Password</label>
                  <input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter a strong password"
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'signup-confirm' && (
            <div className="tab-content">
              <h2>Confirm Sign Up</h2>
              <p>Please enter the verification code sent to {username}</p>
              <form onSubmit={handleCognitoConfirmSignUp}>
                <div className="form-group">
                  <label htmlFor="confirmation-code">Verification Code</label>
                  <input
                    id="confirmation-code"
                    type="text"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value)}
                    required
                    placeholder="Enter code"
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? 'Confirming...' : 'Confirm Account'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('signup')}
                  style={{ marginTop: '10px' }}
                >
                  Back to Sign Up
                </button>
              </form>
            </div>
          )}

          {activeTab === 'login' && (
            <div className="tab-content">
              <h2>{authMode === 'local' ? 'Local Login' : 'Cognito Login'}</h2>

              <div className="login-methods">
                {/* Usernameless Passkey Login - Only for Local currently */}
                {authMode === 'local' && (
                  <div className="login-method login-method-recommended">
                    <div className="recommended-badge">⭐ RECOMMENDED</div>
                    <h3>🔐 Login with Passkey (No Username)</h3>
                    <p className="hint">Use your registered passkey to login instantly - no username needed! The fastest and most secure way to login.</p>
                    <button onClick={handleUsernamelessLogin} className="btn btn-primary" disabled={isLoading}>
                      {isLoading ? 'Authenticating...' : 'Login with Passkey'}
                    </button>
                  </div>
                )}

                <div className="divider">OR</div>

                <div className="login-method">
                  <h3>Login with Passkey</h3>
                  <p className="hint">Already have a passkey? Enter your username to login.</p>
                  <form onSubmit={handlePasskeyLogin}>
                    <div className="form-group">
                      <label htmlFor="passkey-username">Username</label>
                      <input
                        id="passkey-username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        placeholder="Enter your username"
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                      {isLoading ? 'Authenticating...' : 'Login with Passkey'}
                    </button>
                  </form>
                </div>

                <div className="divider">OR</div>

                <div className="login-method">
                  <h3>Login with Password</h3>
                  <p className="hint">{authMode === 'local' ? "Use your password if you haven't set up biometric login yet." : "Authenticate with Cognito User Pool to register a passkey."}</p>
                  <form onSubmit={handlePasswordLogin}>
                    <div className="form-group">
                      <label htmlFor="password-username">Username</label>
                      <input
                        id="password-username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        placeholder="Enter your username"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="password">Password</label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                      />
                    </div>
                    <button type="submit" className="btn btn-secondary" disabled={isLoading}>
                      {isLoading ? 'Logging in...' : 'Login with Password'}
                    </button>
                  </form>
                </div>
              </div>

              {authMode === 'local' && (
                <div className="hint">
                  <p>Default credentials: user / user</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cognito-register' && (
            <div className="tab-content">
              <h3>Register Cognito Passkey</h3>
              <p>You have authenticated with password. Now you can register a passkey for passwordless login next time.</p>
              <button onClick={handleRegisterPasskey} className="btn btn-primary" disabled={isLoading}>
                {isLoading ? "Registering..." : "Register Passkey on this Device"}
              </button>
            </div>
          )}

          {message && (
            <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
        </div>

        <footer className="footer">
          <p>Built with FastAPI, React, and WebAuthn ({authMode} mode)</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
