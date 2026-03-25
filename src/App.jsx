import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import api from './utils/api';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ProductsList from './pages/ProductsList';
import ProductsAdd from './pages/ProductsAdd';
import CustomersList from './pages/CustomersList';
import CustomersAdd from './pages/CustomersAdd';
import OrdersList from './pages/OrdersList';
import OrdersAdd from './pages/OrdersAdd';
import PurchasesList from './pages/PurchasesList';
import PurchasesAdd from './pages/PurchasesAdd';
import Register from './pages/Register';
import ProductsUpdate from './pages/ProductsUpdate';
import CustomersUpdate from './pages/CustomersUpdate';
import Settings from './pages/Settings';
import ChangePassword from './pages/ChangePassword';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const validateSession = async (nextSession) => {
      if (!mounted) return;
      if (!nextSession) {
        setSession(null);
        setLoading(false);
        return;
      }

      try {
        await api.get('/auth/me');
        if (mounted) setSession(nextSession);
      } catch {
        await supabase.auth.signOut();
        if (mounted) setSession(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      validateSession(currentSession);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      validateSession(nextSession);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <div className="App">
        {session ? (
          <>
            <Header />
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products_list" element={<ProductsList />} />
              <Route path="/products_add" element={<ProductsAdd />} />
              <Route path="/products_update" element={<ProductsUpdate />} />
              <Route path="/cust_list" element={<CustomersList />} />
              <Route path="/cust_add" element={<CustomersAdd />} />
              <Route path="/cust_update" element={<CustomersUpdate />} />
              <Route path="/orders_list" element={<OrdersList />} />
              <Route path="/orders" element={<OrdersAdd />} />
              <Route path="/purchases_list" element={<PurchasesList />} />
              <Route path="/purchases" element={<PurchasesAdd />} />
              <Route path="/register" element={<Register />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/change_pass" element={<ChangePassword />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
