import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './app/auth';
import { Providers } from './app/providers';
import { router } from './app/router';

function App() {
  return (
    <Providers>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </Providers>
  );
}

export default App;
