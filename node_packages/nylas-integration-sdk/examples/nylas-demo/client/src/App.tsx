import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { NylasCalendar } from './components/NylasCalendar';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/toaster';

function Home() {
  return (
    <div className="container py-16 px-4 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-8">Nylas Integration Demo</h1>
      <p className="text-lg text-center max-w-xl mb-6 text-muted-foreground">
        This demo showcases calendar integration with Nylas, allowing you to connect, view, and manage your calendar events.
      </p>
      <ul className="list-disc text-left max-w-xl mx-auto mb-8 text-muted-foreground pl-6">
        <li className="mb-2">Connect your calendar with OAuth</li>
        <li className="mb-2">Create, edit, and delete events</li>
        <li className="mb-2">Detect scheduling conflicts in your calendar</li>
        <li className="mb-2">View detailed account and calendar information</li>
      </ul>
      <Link to="/calendar">
        <Button size="lg">View Calendar Demo</Button>
      </Link>
    </div>
  );
}

function ErrorPage() {
  const params = new URLSearchParams(window.location.search);
  const errorMessage = params.get('message') || 'An error occurred';

  return (
    <div className="container py-16 px-4 flex flex-col items-center">
      <div className="p-6 bg-destructive/10 rounded-lg mb-8 max-w-xl w-full">
        <h2 className="text-2xl font-semibold text-destructive mb-4">Error</h2>
        <p className="text-destructive">{errorMessage}</p>
      </div>
      <Link to="/">
        <Button variant="outline">Back to Home</Button>
      </Link>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b py-4">
          <div className="container flex justify-between items-center">
            <Link to="/" className="font-semibold text-lg">Nylas Demo</Link>
      </div>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/calendar" element={<NylasCalendar />} />
            <Route path="/error" element={<ErrorPage />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
