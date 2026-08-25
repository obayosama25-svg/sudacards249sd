import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetails from './pages/UserDetails';
import Reviews from './pages/Reviews';
import Transactions from './pages/Transactions';
import Cards from './pages/Cards';
import Settings from './pages/Settings';
import Revenue from './pages/Revenue';
import Branches from './pages/Branches';
import Audit from './pages/Audit';
import BankSettings from './pages/BankSettings';
import Devices from './pages/Devices';
import DeviceDetails from './pages/DeviceDetails';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetails />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="revenue" element={<Revenue />} />
          <Route path="branches" element={<Branches />} />
          <Route path="audit" element={<Audit />} />
          <Route path="devices" element={<Devices />} />
          <Route path="devices/:id" element={<DeviceDetails />} />
          <Route path="cards" element={<Cards />} />
          <Route path="bank-settings" element={<BankSettings />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<div className="text-white">الصفحة غير موجودة</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
