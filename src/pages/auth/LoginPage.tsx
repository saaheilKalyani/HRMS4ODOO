import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { signIn, profile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const { error } = await signIn({ email, password });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    navigate(profile?.role === 'admin' ? '/admin' : '/employee', { replace: true });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Sign In</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
      <button type="submit">Sign In</button>
    </form>
  );
}