import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/app.routes';

const App = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
