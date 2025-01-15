import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/app.routes';
import { ToastProvider } from '../lib/components/Toast';

const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
