import { useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setMessage('');

    const { data, error } = await signUp({ email, password, full_name: fullName });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    if (data?.requires_email_verification) {
      setMessage('Signup successful! Check your email to verify your account.');
    } else {
      setMessage('Signup successful! You can now sign in.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Sign Up</h1>
      <input
        type="text"
        placeholder="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
      />
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
      {message && <p style={{ color: 'green' }}>{message}</p>}
      <button type="submit">Sign Up</button>
    </form>
  );
}