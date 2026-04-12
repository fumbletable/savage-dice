import { useEffect, useState } from 'react';
import OBR from '@owlbear-rodeo/sdk';

export type Role = 'GM' | 'PLAYER';

export function useObrReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (OBR.isReady) {
      setReady(true);
      return;
    }
    return OBR.onReady(() => setReady(true));
  }, []);
  return ready;
}

export function useRole(ready: boolean): Role | null {
  const [role, setRole] = useState<Role | null>(null);
  useEffect(() => {
    if (!ready) return;
    OBR.player.getRole().then(setRole);
    return OBR.player.onChange((p) => setRole(p.role));
  }, [ready]);
  return role;
}
