import { Routes, Route } from 'react-router-dom';
import { MdError } from 'react-icons/md';
import { IoSettingsSharp, IoShieldSharp } from 'react-icons/io5';
import { FaBookOpen, FaHome, FaServer, FaTable } from 'react-icons/fa';
import {
  setSystemName,
  setNavigation,
  setHandleLogout
} from '../../lib/utilities/navigation.utilities.js';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { SettingsPage } from '../pages/SettingsPage';
import { TablePage } from '../pages/TablePage/index.jsx';
import { FormPage } from '../pages/FormPage/index.jsx';

const AppRoutes = () => {
  setSystemName('Blackborne');
  setHandleLogout(() => console.log('logout'));
  setNavigation([
    {
      label: 'Inicio',
      path: '/',
      icon: <FaHome size={18} />
    },
    {
      label: 'DataTable',
      path: '/table',
      icon: <FaTable size={18} />
    },
    {
      label: 'DataForm',
      path: '/form',
      icon: <FaBookOpen size={18} />
    },
    {
      label: 'Login',
      path: '/login',
      icon: <IoShieldSharp size={18} />
    },
    {
      label: 'Storage',
      path: '/storage',
      icon: <FaServer size={18} />
    },
    {
      label: 'Not Found',
      path: '/not-found',
      icon: <MdError size={18} />
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: <IoSettingsSharp size={18} />
    }
  ]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/form" element={<FormPage />} />
      <Route path="/table" element={<TablePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/not-found" element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export { AppRoutes };
