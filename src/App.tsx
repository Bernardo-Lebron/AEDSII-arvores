import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Home } from './pages/Home';
import { TriePage } from './pages/TriePage';
import { PatriciaPage } from './pages/PatriciaPage';
import { SplayPage } from './pages/SplayPage';
import { TreapPage } from './pages/TreapPage';
import { KDTreePage } from './pages/KDTreePage';
import { ExperimentsPage } from './pages/ExperimentsPage';

export function App() {
  return (
    <HashRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/trie" element={<TriePage />} />
          <Route path="/patricia" element={<PatriciaPage />} />
          <Route path="/splay" element={<SplayPage />} />
          <Route path="/treap" element={<TreapPage />} />
          <Route path="/kdtree" element={<KDTreePage />} />
          <Route path="/experimentos" element={<ExperimentsPage />} />
        </Routes>
      </AppLayout>
    </HashRouter>
  );
}
