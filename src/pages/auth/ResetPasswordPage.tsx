import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  requestPasswordReset,
  updatePassword,
} from '../../features/auth/auth.service';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery') || hash.includes('access_token=')) {
      setIsRecoveryMode(true);
    }
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMessage('');

    const { error } = await requestPasswordReset(email);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setMessage('Password reset email sent. Check your inbox.');
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMessage('');

    const { error } = await updatePassword(newPassword);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setMessage('Password updated successfully. Redirecting to login...');
    setTimeout(() => navigate('/login'), 2000);
  };

  return (
    <div>
      {!isRecoveryMode ? (
        <form onSubmit={handleRequestReset}>
          <h1>Reset Password</h1>
          <p>Enter your email to receive a password reset link.</p>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
          {message && <p style={{ color: 'green' }}>{message}</p>}
          <button type="submit">Send Reset Link</button>
        </form>
      ) : (
        <form onSubmit={handleUpdatePassword}>
          <h1>Set New Password</h1>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
          {message && <p style={{ color: 'green' }}>{message}</p>}
          <button type="submit">Update Password</button>
        </form>
      )}
    </div>
  );
}