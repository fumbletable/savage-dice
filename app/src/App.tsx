import { useState } from 'react';
import { useObrReady, useRole } from './lib/obr';
import { rollTraitCheck, type DieType, type TraitResult } from './lib/dice';

const DIE_OPTIONS: DieType[] = [4, 6, 8, 10, 12];

interface LogEntry {
  id: number;
  name: string;
  result: TraitResult;
  time: string;
}

export default function App() {
  const ready = useObrReady();
  const role = useRole(ready);

  const [name, setName] = useState('Fighting');
  const [traitDie, setTraitDie] = useState<DieType>(8);
  const [wild, setWild] = useState(true);
  const [modifier, setModifier] = useState(0);
  const [tn, setTn] = useState(4);
  const [mapPenalty, setMapPenalty] = useState(0);
  const [lastRoll, setLastRoll] = useState<TraitResult | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);

  if (!ready) return <div className="status">Connecting to Owlbear Rodeo…</div>;
  if (!role) return <div className="status">Loading…</div>;

  const handleRoll = () => {
    const result = rollTraitCheck({
      traitDie,
      wild,
      modifier: modifier + mapPenalty,
      tn,
    });
    setLastRoll(result);
    setLog((prev) => [
      {
        id: Date.now(),
        name: name || 'Roll',
        result,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev,
    ].slice(0, 8));
  };

  return (
    <div className="panel">
      <header>
        <h1>Savage Dice</h1>
        <span className="role-badge">{role}</span>
      </header>

      <div className="form">
        <label className="row">
          <span>Trait</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Fighting"
          />
        </label>

        <div className="row">
          <span>Die</span>
          <div className="btn-group">
            {DIE_OPTIONS.map((d) => (
              <button
                key={d}
                className={traitDie === d ? 'btn active' : 'btn'}
                onClick={() => setTraitDie(d)}
              >
                d{d}
              </button>
            ))}
          </div>
        </div>

        <div className="row">
          <span>Wild</span>
          <label className="toggle">
            <input type="checkbox" checked={wild} onChange={(e) => setWild(e.target.checked)} />
            <span>Wild Card (+d6)</span>
          </label>
        </div>

        <div className="row split">
          <label className="mini">
            <span>Mod</span>
            <input
              type="number"
              value={modifier}
              onChange={(e) => setModifier(Number(e.target.value) || 0)}
            />
          </label>
          <label className="mini">
            <span>TN</span>
            <input
              type="number"
              value={tn}
              onChange={(e) => setTn(Number(e.target.value) || 4)}
            />
          </label>
        </div>

        <div className="row">
          <span>MAP</span>
          <div className="btn-group">
            {[0, -2, -4].map((p) => (
              <button
                key={p}
                className={mapPenalty === p ? 'btn active' : 'btn'}
                onClick={() => setMapPenalty(p)}
              >
                {p === 0 ? 'None' : p}
              </button>
            ))}
          </div>
        </div>

        <button className="roll-btn" onClick={handleRoll}>
          Roll
        </button>
      </div>

      {lastRoll && <RollResult result={lastRoll} name={name} />}

      {log.length > 0 && (
        <div className="log">
          <div className="log-header">Recent</div>
          {log.map((entry) => (
            <div key={entry.id} className="log-entry">
              <span className="log-name">{entry.name}</span>
              <span className={`log-outcome ${outcomeClass(entry.result)}`}>
                {outcomeLabel(entry.result)}
              </span>
              <span className="log-total">{entry.result.finalTotal}</span>
              <span className="log-time">{entry.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function outcomeClass(r: TraitResult): string {
  if (r.criticalFailure) return 'crit';
  if (r.raises > 0) return 'raise';
  if (r.success) return 'success';
  return 'fail';
}

function outcomeLabel(r: TraitResult): string {
  if (r.criticalFailure) return 'CRIT FAIL';
  if (r.raises > 0) return `+${r.raises} raise${r.raises > 1 ? 's' : ''}`;
  if (r.success) return 'Success';
  return 'Failed';
}

function DieChain({ die, chain, total, aced }: { die: number; chain: number[]; total: number; aced: boolean }) {
  return (
    <div className={`die-chain ${aced ? 'aced' : ''}`}>
      <span className="die-label">d{die}</span>
      <span className="die-rolls">
        {chain.map((n, i) => (
          <span key={i} className={n === die ? 'roll ace' : 'roll'}>
            {n}
            {i < chain.length - 1 && <span className="arrow">→</span>}
          </span>
        ))}
      </span>
      <span className="die-total">= {total}</span>
    </div>
  );
}

function RollResult({ result, name }: { result: TraitResult; name: string }) {
  const { trait, wild, modifier, tn, best, finalTotal, success, raises, criticalFailure } = result;

  const bannerClass = criticalFailure
    ? 'banner crit'
    : raises > 0
    ? 'banner raise'
    : success
    ? 'banner success'
    : 'banner fail';

  return (
    <div className="result">
      <div className="result-name">{name || 'Roll'}</div>
      <div className="dice-display">
        <div className={best === 'trait' ? 'picked' : ''}>
          <DieChain {...trait} />
          {best === 'trait' && <span className="best-badge">BEST</span>}
        </div>
        {wild && (
          <div className={best === 'wild' ? 'picked' : ''}>
            <DieChain {...wild} />
            {best === 'wild' && <span className="best-badge">BEST</span>}
          </div>
        )}
      </div>
      <div className="calc">
        {best === 'trait' ? trait.total : wild!.total}
        {modifier !== 0 && (
          <span className={modifier > 0 ? 'mod-plus' : 'mod-minus'}>
            {' '}
            {modifier > 0 ? '+' : ''}
            {modifier}
          </span>
        )}
        {' '}= <strong>{finalTotal}</strong> <span className="muted">vs TN {tn}</span>
      </div>
      <div className={bannerClass}>{outcomeLabel(result)}</div>
    </div>
  );
}
