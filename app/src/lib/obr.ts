import { useEffect, useState } from 'react';
import OBR from '@owlbear-rodeo/sdk';

export type Role = 'GM' | 'PLAYER';

export const BROADCAST_CHANNEL = 'com.fumbletable.savage-dice/roll';

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

export interface SelfInfo {
  id: string;
  name: string;
  color: string;
  role: Role;
}

export function useSelf(ready: boolean): SelfInfo | null {
  const [self, setSelf] = useState<SelfInfo | null>(null);
  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      const [id, name, color, role] = await Promise.all([
        OBR.player.getId(),
        OBR.player.getName(),
        OBR.player.getColor(),
        OBR.player.getRole(),
      ]);
      setSelf({ id, name, color, role });
    };
    load();
    return OBR.player.onChange((p) => {
      setSelf({ id: p.id, name: p.name, color: p.color, role: p.role });
    });
  }, [ready]);
  return self;
}
