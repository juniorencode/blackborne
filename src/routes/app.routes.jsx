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
    </Routes>
  );
};

export { AppRoutes };
