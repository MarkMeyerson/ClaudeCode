import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import AssessmentPage from './pages/AssessmentPage';
import ResultsPage from './pages/ResultsPage';
import FrameworkInfoPage from './pages/FrameworkInfoPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Navigate to="/framework" replace />} />
          <Route path="/framework" element={<FrameworkInfoPage />} />
          <Route path="/assessment" element={<WelcomePage />} />
          <Route path="/assessment/questions" element={<AssessmentPage />} />
          <Route path="/assessment/results/:assessmentId" element={<ResultsPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
