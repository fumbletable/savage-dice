import { useEffect, useState } from 'react';
import OBR from '@owlbear-rodeo/sdk';
import { useObrReady, useSelf, BROADCAST_CHANNEL } from './lib/obr';
import { rollTraitCheck, rollDamage, type DieType, type TraitResult, type DamageResult } from './lib/dice';
import { DieIcon } from './lib/DieIcon';
import { playSound } from './lib/sounds';

type Mode = 'trait' | 'damage';
const DIE_OPTIONS: DieType[] = [4, 6, 8, 10, 12];

interface TraitLog { kind: 'trait'; id: number; result: TraitResult; time: string; playerName: string; playerColor: string; private?: boolean }
interface DamageLog { kind: 'damage'; id: number; result: DamageResult; time: string; playerName: string; playerColor: string; private?: boolean }
type LogEntry = TraitLog | DamageLog;

export default function App() {
  const ready = useObrReady();
  const self = useSelf(ready);

  const [mode, setMode] = useState<Mode>('trait');
  const [traitDie, setTraitDie] = useState<DieType>(8);
  const [modifier, setModifier] = useState(0);
  const [tn, setTn] = useState(4);
  const [mapPenalty, setMapPenalty] = useState(0);

  // Damage
  const [dmgDice, setDmgDice] = useState<DieType[]>([6, 6]);
  const [dmgMod, setDmgMod] = useState(0);
  const [bonusD6, setBonusD6] = useState(false);

  // GM private toggle
  const [privateRoll, setPrivateRoll] = useState(false);

  // Sound
  const [soundOn, setSoundOn] = useState(() => {
    const saved = localStorage.getItem('savage-dice.sound');
    return saved === null ? true : saved === 'true';
  });
  const toggleSound = () => {
    setSoundOn((v) => {
      localStorage.setItem('savage-dice.sound', String(!v));
      return !v;
    });
  };

  const [lastTrait, setLastTrait] = useState<TraitResult | null>(null);
  const [lastDamage, setLastDamage] = useState<DamageResult | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [shakeKey, setShakeKey] = useState(0);

  // Listen for broadcast rolls from other players
  useEffect(() => {
    if (!ready) return;
    return OBR.broadcast.onMessage(BROADCAST_CHANNEL, (event) => {
      const entry = event.data as LogEntry;
      setLog((prev) => [entry, ...prev].slice(0, 20));
    });
  }, [ready]);

  if (!ready) return <div className="status">Connecting to Owlbear Rodeo…</div>;
  if (!self) return <div className="status">Loading…</div>;

  const role = self.role;
  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const emit = (entry: LogEntry) => {
    setLog((prev) => [entry, ...prev].slice(0, 20));
    if (!entry.private) {
      OBR.broadcast.sendMessage(BROADCAST_CHANNEL, entry as unknown as Record<string, unknown>, {
        destination: 'REMOTE',
      });
    }
  };

  const baseMeta = () => ({
    playerName: self.name,
    playerColor: self.color,
    private: role === 'GM' && privateRoll,
    time: now(),
    id: Date.now(),
  });

  const handleTraitRoll = (wild: boolean) => {
    const result = rollTraitCheck({ traitDie, wild, modifier: modifier + mapPenalty, tn });
    setLastTrait(result);
    setLastDamage(null);
    setShakeKey((k) => k + 1);
    playSound('shake', soundOn);
    emit({ kind: 'trait', result, ...baseMeta() });
  };

  const handleDamageRoll = () => {
    const result = rollDamage({ dice: dmgDice, modifier: dmgMod, bonusD6 });
    setLastDamage(result);
    setLastTrait(null);
    setShakeKey((k) => k + 1);
    playSound('shake', soundOn);
    emit({ kind: 'damage', result, ...baseMeta() });
  };

  const addDmgDie = () => setDmgDice((d) => (d.length < 4 ? [...d, 6] : d));
  const removeDmgDie = (i: number) => setDmgDice((d) => d.filter((_, idx) => idx !== i));
  const setDmgDie = (i: number, v: DieType) =>
    setDmgDice((d) => d.map((x, idx) => (idx === i ? v : x)));

  return (
    <div className="panel">
      <header>
        <h1>Savage Dice <span style={{fontSize:'10px',opacity:0.4,fontWeight:400}}>v0.5.1</span></h1>
        <div className="header-right">
          <button className="sound-btn" onClick={toggleSound} title={soundOn ? 'Sound on' : 'Sound off'}>
            {soundOn ? '🔊' : '🔇'}
          </button>
          <span className="role-badge">{role}</span>
        </div>
      </header>

      <div className="mode-switch">
        <button
          className={mode === 'trait' ? 'mode active' : 'mode'}
          onClick={() => setMode('trait')}
        >
          Trait
        </button>
        <button
          className={mode === 'damage' ? 'mode active damage' : 'mode'}
          onClick={() => setMode('damage')}
        >
          Damage
        </button>
      </div>

      {role === 'GM' && (
        <label className="private-toggle">
          <input
            type="checkbox"
            checked={privateRoll}
            onChange={(e) => setPrivateRoll(e.target.checked)}
          />
          <span>🔒 Private roll (hidden from players)</span>
        </label>
      )}

      {mode === 'trait' ? (
        <>
          <div className="form">
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

            <div className="roll-pair">
              <button className="roll-btn wild" onClick={() => handleTraitRoll(true)}>
                Roll Wild
                <span className="hint">trait + d6</span>
              </button>
              <button className="roll-btn extra" onClick={() => handleTraitRoll(false)}>
                Roll Extra
                <span className="hint">trait only</span>
              </button>
            </div>
          </div>

          {lastTrait && <TraitResultView key={shakeKey} result={lastTrait} />}
        </>
      ) : (
        <>
          <div className="form">
            <div className="mode-hint">DAMAGE — all dice add together</div>

            <div className="dmg-dice">
              {dmgDice.map((d, i) => (
                <div key={i} className="dmg-die-row">
                  <div className="btn-group">
                    {DIE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        className={d === opt ? 'btn active' : 'btn'}
                        onClick={() => setDmgDie(i, opt)}
                      >
                        d{opt}
                      </button>
                    ))}
                  </div>
                  {dmgDice.length > 1 && (
                    <button className="remove" onClick={() => removeDmgDie(i)} title="Remove">
                      ×
                    </button>
                  )}
                </div>
              ))}
              {dmgDice.length < 4 && (
                <button className="add-die" onClick={addDmgDie}>
                  + add die
                </button>
              )}
            </div>

            <div className="row split">
              <label className="mini">
                <span>Mod</span>
                <input
                  type="number"
                  value={dmgMod}
                  onChange={(e) => setDmgMod(Number(e.target.value) || 0)}
                />
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={bonusD6}
                  onChange={(e) => setBonusD6(e.target.checked)}
                />
                <span>+d6 (raise)</span>
              </label>
            </div>

            <button className="roll-btn damage" onClick={handleDamageRoll}>
              Roll Damage
            </button>
          </div>

          {lastDamage && <DamageResultView key={shakeKey} result={lastDamage} />}
        </>
      )}

      {log.length > 0 && (
        <div className="log">
          <div className="log-header">Recent</div>
          {log.map((entry) => (
            <LogRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  const playerTag = (
    <span className="log-player">
      <span className="player-dot" style={{ background: entry.playerColor }} />
      <span className="player-name">{entry.playerName}</span>
      {entry.private && <span className="private-tag">🔒</span>}
    </span>
  );
  if (entry.kind === 'trait') {
    const r = entry.result;
    return (
      <div className="log-entry">
        {playerTag}
        <span className="log-kind">{r.wild ? 'Wild' : 'Extra'}</span>
        <span className={`log-outcome ${traitOutcomeClass(r)}`}>{traitOutcomeLabel(r)}</span>
        <span className="log-total">{r.finalTotal}</span>
        <span className="log-time">{entry.time}</span>
      </div>
    );
  }
  return (
    <div className="log-entry">
      {playerTag}
      <span className="log-kind">Dmg</span>
      <span className="log-outcome damage">{entry.result.dice.map((d) => `d${d.die}`).join('+')}</span>
      <span className="log-total">{entry.result.total}</span>
      <span className="log-time">{entry.time}</span>
    </div>
  );
}

function traitOutcomeClass(r: TraitResult) {
  if (r.criticalFailure) return 'crit';
  if (r.raises > 0) return 'raise';
  if (r.success) return 'success';
  return 'fail';
}

function traitOutcomeLabel(r: TraitResult) {
  if (r.criticalFailure) return 'CRIT FAIL';
  if (r.raises > 0) return `+${r.raises} raise${r.raises > 1 ? 's' : ''}`;
  if (r.success) return 'Success';
  return 'Failed';
}

function DieChain({
  die,
  chain,
  total,
  aced,
}: {
  die: DieType;
  chain: number[];
  total: number;
  aced: boolean;
}) {
  return (
    <div className={`die-chain ${aced ? 'aced' : ''}`}>
      <div className="die-visual">
        {chain.map((n, i) => (
          <DieIcon key={i} die={die} value={n} aced={n === die} shaking size={40} />
        ))}
      </div>
      {chain.length > 1 && (
        <div className="chain-math">
          {chain.join(' + ')} = <strong>{total}</strong>
        </div>
      )}
      {chain.length === 1 && <div className="chain-math single">= <strong>{total}</strong></div>}
    </div>
  );
}

function TraitResultView({ result }: { result: TraitResult }) {
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
      <div className="dice-display">
        <div className={best === 'trait' ? 'die-row picked' : 'die-row'}>
          <div className="die-row-label">Trait</div>
          <DieChain die={trait.die} chain={trait.chain} total={trait.total} aced={trait.aced} />
          {best === 'trait' && <span className="best-tag">BEST</span>}
        </div>
        {wild && (
          <div className={best === 'wild' ? 'die-row picked' : 'die-row'}>
            <div className="die-row-label">Wild</div>
            <DieChain die={wild.die} chain={wild.chain} total={wild.total} aced={wild.aced} />
            {best === 'wild' && <span className="best-tag">BEST</span>}
          </div>
        )}
      </div>
      <div className="calc">
        Use best: <strong>{best === 'trait' ? trait.total : wild!.total}</strong>
        {modifier !== 0 && (
          <>
            {' '}
            <span className={modifier > 0 ? 'mod-plus' : 'mod-minus'}>
              {modifier > 0 ? '+' : ''}
              {modifier}
            </span>
          </>
        )}
        {' = '}
        <strong className="final">{finalTotal}</strong> <span className="muted">vs TN {tn}</span>
      </div>
      <div className={bannerClass}>{traitOutcomeLabel(result)}</div>
    </div>
  );
}

function DamageResultView({ result }: { result: DamageResult }) {
  const { dice, modifier, total } = result;
  return (
    <div className="result">
      <div className="dice-display">
        {dice.map((r, i) => (
          <div key={i} className="die-row">
            <div className="die-row-label">d{r.die}</div>
            <DieChain die={r.die} chain={r.chain} total={r.total} aced={r.aced} />
          </div>
        ))}
      </div>
      <div className="calc">
        <span className="muted">Sum:</span>{' '}
        {dice.map((r) => r.total).join(' + ')}
        {modifier !== 0 && (
          <span className={modifier > 0 ? 'mod-plus' : 'mod-minus'}>
            {' '}
            {modifier > 0 ? '+' : ''}
            {modifier}
          </span>
        )}
        {' = '}
        <strong className="final">{total}</strong>
      </div>
      <div className="banner damage-banner">Damage: {total}</div>
    </div>
  );
}
