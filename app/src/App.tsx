import { useObrReady, useRole } from './lib/obr';

export default function App() {
  const ready = useObrReady();
  const role = useRole(ready);

  if (!ready) return <div className="status">Connecting to Owlbear Rodeo…</div>;
  if (!role) return <div className="status">Loading…</div>;

  return (
    <div className="panel">
      <header>
        <h1>Savage Dice</h1>
        <span className="role-badge">{role}</span>
      </header>
      <div className="placeholder">
        <p>🎲 Ready to roll.</p>
        <p className="muted">Dice UI coming next session. See <code>PLAN.md</code>.</p>
      </div>
    </div>
  );
}
