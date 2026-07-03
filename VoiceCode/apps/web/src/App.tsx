// VoiceCode - Main Application with Routing

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ProfessionalModeProvider } from './contexts/ProfessionalModeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AgentProvider } from './contexts/AgentContext';
import ProtectedRoute from './components/ProtectedRoute';
import { SimpleErrorBoundary } from './components/ErrorBoundary';
import { GlobalAgentOverlay } from './components/agent';

// Route-based code splitting (lazy-loaded pages)
const LandingPage = lazy(() => import('./pages/LandingPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const ModernDashboard = lazy(() => import('./pages/ModernDashboard'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const AIMLTestPage = lazy(() => import('./pages/AIMLTestPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const CaseStudiesPage = lazy(() => import('./pages/CaseStudiesPage'));
const HelpCenterPage = lazy(() => import('./pages/HelpCenterPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));

// Medical Pages
const MedicalDictationPage = lazy(
  () => import('./pages/medical/MedicalDictationPage')
);
const SOAPNotesPage = lazy(() => import('./pages/medical/SOAPNotesPage'));
const ClinicalNotesPage = lazy(
  () => import('./pages/medical/ClinicalNotesPage')
);
const PatientEncounterPage = lazy(
  () => import('./pages/medical/PatientEncounterPage')
);
const BillingCodesPage = lazy(() => import('./pages/medical/BillingCodesPage'));
const TemplateLibraryPage = lazy(
  () => import('./pages/medical/TemplateLibraryPage')
);

// Recording Pages
const RecordingLibraryPage = lazy(
  () => import('./pages/recordings/RecordingLibraryPage')
);

// AI Pages
const AISummaryPage = lazy(() => import('./pages/ai/AISummaryPage'));
const AIKeyPointsPage = lazy(() => import('./pages/ai/AIKeyPointsPage'));
const AIActionItemsPage = lazy(() => import('./pages/ai/AIActionItemsPage'));

// Team Pages
const TeamManagementPage = lazy(
  () => import('./pages/team/TeamManagementPage')
);

// Integration Pages
const IntegrationsHubPage = lazy(
  () => import('./pages/integrations/IntegrationsHubPage')
);

// Analytics Pages
const ProductivityDashboardPage = lazy(
  () => import('./pages/analytics/ProductivityDashboardPage')
);

// Automation Pages
const AutomationBuilderPage = lazy(
  () => import('./pages/automation/AutomationBuilderPage')
);

// Additional Medical Pages
const ProgressNotesPage = lazy(
  () => import('./pages/medical/ProgressNotesPage')
);
const DischargeNotesPage = lazy(
  () => import('./pages/medical/DischargeNotesPage')
);
const EHRIntegrationPage = lazy(
  () => import('./pages/medical/EHRIntegrationPage')
);
const HIPAACompliancePage = lazy(
  () => import('./pages/medical/HIPAACompliancePage')
);

// Editing Pages
const TranscriptEditorPage = lazy(
  () => import('./pages/editing/TranscriptEditorPage')
);

// Export Pages
const ExportManagerPage = lazy(
  () => import('./pages/export/ExportManagerPage')
);

// Transcription Pages
const SpeakerIdentificationPage = lazy(
  () => import('./pages/transcription/SpeakerIdentificationPage')
);

// Search Pages
const TranscriptSearchPage = lazy(
  () => import('./pages/search/TranscriptSearchPage')
);

// Settings Pages
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));

// Additional Transcription Pages
const LiveTranscriptionPage = lazy(
  () => import('./pages/transcription/LiveTranscriptionPage')
);
const VocabularyPage = lazy(
  () => import('./pages/transcription/VocabularyPage')
);
const TranscriptDetailPage = lazy(
  () => import('./pages/transcription/TranscriptDetailPage')
);

// Library Pages
const FolderManagementPage = lazy(
  () => import('./pages/library/FolderManagementPage')
);

// Chat Page
const ChatPage = lazy(() => import('./pages/chat/ChatPage'));

// Additional Settings Pages
const KeyboardShortcutsPage = lazy(
  () => import('./pages/settings/KeyboardShortcutsPage')
);
const ProfilePage = lazy(() => import('./pages/settings/ProfilePage'));

// Loading component
const LoadingFallback: React.FC = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
    }}
  >
    <div
      style={{
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#4f46e5',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem',
        }}
      />
      <p
        style={{
          color: '#6b7280',
          fontSize: '1rem',
        }}
      >
        Loading...
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
);

// Skip to main content link for keyboard users
const SkipLink: React.FC = () => (
  <a
    href="#main-content"
    style={{
      position: 'absolute',
      left: '-10000px',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
    }}
    onFocus={(e) => {
      e.currentTarget.style.position = 'fixed';
      e.currentTarget.style.left = '1rem';
      e.currentTarget.style.top = '1rem';
      e.currentTarget.style.width = 'auto';
      e.currentTarget.style.height = 'auto';
      e.currentTarget.style.overflow = 'visible';
      e.currentTarget.style.zIndex = '9999';
      e.currentTarget.style.padding = '0.5rem 1rem';
      e.currentTarget.style.backgroundColor = '#4f46e5';
      e.currentTarget.style.color = '#ffffff';
      e.currentTarget.style.borderRadius = '0.5rem';
      e.currentTarget.style.textDecoration = 'none';
      e.currentTarget.style.fontWeight = '600';
    }}
    onBlur={(e) => {
      e.currentTarget.style.position = 'absolute';
      e.currentTarget.style.left = '-10000px';
      e.currentTarget.style.width = '1px';
      e.currentTarget.style.height = '1px';
      e.currentTarget.style.overflow = 'hidden';
    }}
  >
    Skip to main content
  </a>
);

// Navigation Component
const Navigation: React.FC = () => {
  return (
    <nav
      aria-label="Main navigation"
      style={{
        padding: '1rem 2rem',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link
          to="/"
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#4f46e5',
            textDecoration: 'none',
          }}
        >
          VoiceCode
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link
            to="/"
            style={{
              color: '#374151',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Home
          </Link>
          <Link
            to="/features"
            style={{
              color: '#374151',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Features
          </Link>
          <Link
            to="/pricing"
            style={{
              color: '#374151',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Pricing
          </Link>
          <Link
            to="/blog"
            style={{
              color: '#374151',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Blog
          </Link>
          <Link
            to="/case-studies"
            style={{
              color: '#374151',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Cases
          </Link>
          <Link
            to="/help"
            style={{
              color: '#374151',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Help
          </Link>
          <Link
            to="/app"
            style={{
              color: '#374151',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            App
          </Link>
          <Link
            to="/medical/dictation"
            style={{
              color: '#374151',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Medical
          </Link>
          <Link
            to="/recordings"
            style={{
              color: '#374151',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Recordings
          </Link>
        </div>
      </div>
      <div>
        <button
          style={{
            padding: '0.5rem 1.5rem',
            backgroundColor: '#4f46e5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Get Started
        </button>
      </div>
    </nav>
  );
};

// App Content with Router
const AppContent: React.FC = () => {
  return (
    <Router>
      <SkipLink />
      <Navigation />
      <main id="main-content" role="main">
      <SimpleErrorBoundary message="Failed to load page content">
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/features" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/case-studies" element={<CaseStudiesPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected Routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <ModernDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classic"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/aiml-demo"
            element={
              <ProtectedRoute>
                <AIMLTestPage />
              </ProtectedRoute>
            }
          />

          {/* Medical Routes */}
          <Route
            path="/medical/dictation"
            element={
              <ProtectedRoute>
                <MedicalDictationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medical/soap-notes"
            element={
              <ProtectedRoute>
                <SOAPNotesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medical/clinical-notes"
            element={
              <ProtectedRoute>
                <ClinicalNotesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medical/patient-encounter"
            element={
              <ProtectedRoute>
                <PatientEncounterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medical/billing-codes"
            element={
              <ProtectedRoute>
                <BillingCodesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medical/templates"
            element={
              <ProtectedRoute>
                <TemplateLibraryPage />
              </ProtectedRoute>
            }
          />

          {/* Recording Routes */}
          <Route
            path="/recordings"
            element={
              <ProtectedRoute>
                <RecordingLibraryPage />
              </ProtectedRoute>
            }
          />

          {/* AI Routes */}
          <Route
            path="/ai/summary"
            element={
              <ProtectedRoute>
                <AISummaryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai/key-points"
            element={
              <ProtectedRoute>
                <AIKeyPointsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai/action-items"
            element={
              <ProtectedRoute>
                <AIActionItemsPage />
              </ProtectedRoute>
            }
          />

          {/* Team Routes */}
          <Route
            path="/team"
            element={
              <ProtectedRoute>
                <TeamManagementPage />
              </ProtectedRoute>
            }
          />

          {/* Integration Routes */}
          <Route
            path="/integrations"
            element={
              <ProtectedRoute>
                <IntegrationsHubPage />
              </ProtectedRoute>
            }
          />

          {/* Analytics Routes */}
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <ProductivityDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Automation Routes */}
          <Route
            path="/automation"
            element={
              <ProtectedRoute>
                <AutomationBuilderPage />
              </ProtectedRoute>
            }
          />

          {/* Additional Medical Routes */}
          <Route
            path="/medical/progress-notes"
            element={
              <ProtectedRoute>
                <ProgressNotesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medical/discharge"
            element={
              <ProtectedRoute>
                <DischargeNotesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medical/ehr"
            element={
              <ProtectedRoute>
                <EHRIntegrationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medical/hipaa"
            element={
              <ProtectedRoute>
                <HIPAACompliancePage />
              </ProtectedRoute>
            }
          />

          {/* Editing Routes */}
          <Route
            path="/editor"
            element={
              <ProtectedRoute>
                <TranscriptEditorPage />
              </ProtectedRoute>
            }
          />

          {/* Export Routes */}
          <Route
            path="/export"
            element={
              <ProtectedRoute>
                <ExportManagerPage />
              </ProtectedRoute>
            }
          />

          {/* Transcription Routes */}
          <Route
            path="/speakers"
            element={
              <ProtectedRoute>
                <SpeakerIdentificationPage />
              </ProtectedRoute>
            }
          />

          {/* Search Routes */}
          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <TranscriptSearchPage />
              </ProtectedRoute>
            }
          />

          {/* Settings Routes */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Live Transcription Routes */}
          <Route
            path="/transcribe"
            element={
              <ProtectedRoute>
                <LiveTranscriptionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vocabulary"
            element={
              <ProtectedRoute>
                <VocabularyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transcript/:id"
            element={
              <ProtectedRoute>
                <TranscriptDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Library Routes */}
          <Route
            path="/folders"
            element={
              <ProtectedRoute>
                <FolderManagementPage />
              </ProtectedRoute>
            }
          />

          {/* Additional Settings Routes */}
          <Route
            path="/shortcuts"
            element={
              <ProtectedRoute>
                <KeyboardShortcutsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Chat Route */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
      </SimpleErrorBoundary>
      </main>
    </Router>
  );
};

// Main App Component with Providers
const App: React.FC = () => {
  const handleNavigateToChat = (prefillMessage?: string) => {
    // Navigate to chat with optional prefill
    window.location.href = `/chat${prefillMessage ? `?message=${encodeURIComponent(prefillMessage)}` : ''}`;
  };

  return (
    <ThemeProvider defaultTheme="auto">
      <SettingsProvider>
        <ProfessionalModeProvider defaultMode="general">
          <AuthProvider>
            <AgentProvider onNavigateToChat={handleNavigateToChat}>
              <AppContent />
              <GlobalAgentOverlay />
            </AgentProvider>
          </AuthProvider>
        </ProfessionalModeProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
};

export default App;
