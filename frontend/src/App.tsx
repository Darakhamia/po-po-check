import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AuthProvider from './components/AuthProvider';
import ProjectList from './pages/ProjectList';
import ProjectEditor from './pages/ProjectEditor';
import Settings from './pages/Settings';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ProjectList />} />
          <Route path="project/:id" element={<ProjectEditor />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
