import { HashRouter } from 'react-router-dom';
import { AppRoutes } from './routes';

export function App(): JSX.Element {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
