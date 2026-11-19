import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Library from './pages/Library';
import Summary from './pages/Summary';
import Compare from './pages/Compare';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 md:p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/library" element={<Library />} />
              <Route path="/summary" element={<Summary />} />
              <Route path="/compare" element={<Compare />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
