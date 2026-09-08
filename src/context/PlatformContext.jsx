import React, { createContext, useContext, useState } from 'react';
import { ROLE_CONTEXT, MATERIALS } from '../data/mockData';

const PlatformContext = createContext(null);

export function PlatformProvider({ children }) {
  const [role, setRoleState] = useState('VP, Supply Chain Operations');
  const [scope, setScope] = useState(ROLE_CONTEXT['VP, Supply Chain Operations'].scope);
  const [persona, setPersona] = useState(ROLE_CONTEXT['VP, Supply Chain Operations'].persona);
  const [selectedMaterialId, setSelectedMaterialId] = useState('MAT-1082');

  const selectedMaterial = MATERIALS.find((m) => m.id === selectedMaterialId) || MATERIALS[0];

  // Changing role in the header updates department/scope and sets a
  // sensible default persona lens — the user can still override the
  // lens manually afterward via the persona switch.
  function setRole(nextRole) {
    setRoleState(nextRole);
    const ctx = ROLE_CONTEXT[nextRole];
    if (ctx) {
      setScope(ctx.scope);
      setPersona(ctx.persona);
    }
  }

  function resetSession() {
    const defaultRole = 'VP, Supply Chain Operations';
    setRoleState(defaultRole);
    const ctx = ROLE_CONTEXT[defaultRole];
    if (ctx) {
      setScope(ctx.scope);
      setPersona(ctx.persona);
    }
    setSelectedMaterialId('MAT-1082');
  }

  const department = ROLE_CONTEXT[role]?.dept ?? '';

  const value = {
    role,
    setRole,
    scope,
    setScope,
    persona,
    setPersona,
    department,
    resetSession,
    selectedMaterialId,
    setSelectedMaterialId,
    selectedMaterial,
  };
  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used within a PlatformProvider');
  return ctx;
}

// Convenience wrapper for persona-gated content, e.g.:
//   <ForPersona allow={['ds']}><ModelDiagnostics /></ForPersona>
export function ForPersona({ allow, children }) {
  const { persona } = usePlatform();
  if (!allow.includes(persona)) return null;
  return children;
}
