import AppRouter from './routes/AppRouter';
import ToastProvider from './components/feedback/ToastProvider';

function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-neutral-50 font-sans text-neutral-700">
        <AppRouter />
      </div>
    </ToastProvider>
  );
}

export default App;