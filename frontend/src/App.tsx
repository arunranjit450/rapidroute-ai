import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Emergencies from './pages/Emergencies';
import Resources from './pages/Resources';
import Settings from './pages/Settings';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { EmergencyProvider } from './context/EmergencyContext';
import EmergencyDetailsModal from './components/EmergencyDetailsModal';
import CommandPalette from './components/CommandPalette';
import SystemBootSequence from './components/SystemBootSequence';

function App() {
  return (
    <Router>
      <EmergencyProvider>
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
          <Sidebar />
          <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
            <Header />
            <main className="flex-1 overflow-auto p-4 md:p-6 bg-slate-900">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/emergencies" element={<Emergencies />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </div>
        <EmergencyDetailsModal />
        <CommandPalette />
        <SystemBootSequence />
      </EmergencyProvider>
    </Router>
  );
}

export default App;
