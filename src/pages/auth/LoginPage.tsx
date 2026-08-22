import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { paths } from '../../routes/paths';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const { error } = await signIn({ email, password });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    const from = (location.state as { from?: Location })?.from?.pathname ?? paths.dashboard;
    navigate(from, { replace: true });
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