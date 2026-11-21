import React, { useState } from 'react';
import { QuizProvider, useQuiz } from './context/QuizContext';
import { Header } from './components/common/Header';
import { ProjectorDisplay } from './components/display/ProjectorDisplay';
import { QuizmasterConsole } from './components/quizmaster/QuizmasterConsole';
import { AdminPanel } from './components/admin/AdminPanel';
import { MobileParticipantView } from './components/mobile/MobileParticipantView';
import { MultiDeviceSimulator } from './components/simulator/MultiDeviceSimulator';

function MainRouter() {
  const { role } = useQuiz();
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      <Header onOpenSimulator={() => setIsSimulatorOpen(true)} />

      <main className="flex-1">
        {role === 'projector' && <ProjectorDisplay />}
        {role === 'quizmaster' && <QuizmasterConsole />}
        {role === 'admin' && <AdminPanel />}
        {role === 'mobile' && <MobileParticipantView />}
      </main>

      <MultiDeviceSimulator
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <QuizProvider>
      <MainRouter />
    </QuizProvider>
  );
}
