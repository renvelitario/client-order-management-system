import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

import './css/form.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('login-page');
    return () => {
      document.body.classList.remove('login-page');
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      navigate('/dashboard');
    } catch (err) {
      setError(`${err.message} Invalid email or password.`);
    }
  };

  return (
    <>
      <div className="container">
        <div className="logo">
          <img src="/logo.png" alt="Logo" />
        </div>
        <h2>FEU Alabang Book Store Inventory Management System</h2>
        <form onSubmit={handleLogin}>
          <br />
          <label>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          /><br />
          <label>Password:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          /><br />
          <br />
          <input type="submit" value="Log In" />
          
          {error && (
            <p className="error">
              {error}
            </p>
          )}
        </form>
        <br />
      </div>
    </>
  );
};

export default Login;
