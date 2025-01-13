import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { MdError } from 'react-icons/md';
import { IoSettingsSharp, IoShieldSharp } from 'react-icons/io5';
import { FaBookOpen, FaHome, FaServer, FaTable } from 'react-icons/fa';
import { Navigation } from '../lib/components/Navigation';

const App = () => {
  const [isCollapse, setIsCollapse] = useState(false);

  return (
    <BrowserRouter>
      <Navigation
        systemName={'Blackborne'}
        options={[
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
        ]}
        isCollapse={isCollapse}
        setIsCollapse={setIsCollapse}
        handleLogout={() => {}}
      />
    </BrowserRouter>
  );
};

export default App;
