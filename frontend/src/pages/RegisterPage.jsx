import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    adminSecret: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      return toast.error('Please fill all fields');
    }

    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    try {
      setLoading(true);

      await register(
        form.name,
        form.email,
        form.password,
        form.adminSecret
      );

      navigate('/dashboard');
      toast.success('Account created!');

    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              className="input"
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
            />

            <input
              className="input"
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />

            <input
              className="input"
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />

            {/* 🔐 Admin Secret */}
            <input
              className="input"
              type="text"
              name="adminSecret"
              placeholder="Admin Secret (optional)"
              value={form.adminSecret}
              onChange={handleChange}
            />

            <button className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>

          </form>
        </div>

        <p className="text-center text-sm mt-4">
          Already have an account? <Link to="/login">Login</Link>
        </p>

      </div>
    </div>
  );
}