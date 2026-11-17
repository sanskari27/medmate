import { Outlet } from "react-router-dom";

export function App() {
  return (
    <main className="min-h-screen bg-surface-2 text-ink">
      <div className="p-6">
        <Outlet />
      </div>
    </main>
  );
}
