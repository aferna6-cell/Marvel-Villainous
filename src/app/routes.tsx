import { Link, Route, Routes } from 'react-router-dom';

function MainMenu(): JSX.Element {
  return (
    <main className="screen screen--menu">
      <h1 className="title">Marvel Villainous</h1>
      <p className="subtitle">Infinite Power</p>
      <Link className="button button--primary" to="/setup">
        New Game
      </Link>
    </main>
  );
}

function VillainPickerStub(): JSX.Element {
  return (
    <main className="screen screen--setup">
      <p>Villain picker — coming in M2.</p>
      <Link className="button" to="/">
        Back
      </Link>
    </main>
  );
}

export function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/setup" element={<VillainPickerStub />} />
    </Routes>
  );
}
