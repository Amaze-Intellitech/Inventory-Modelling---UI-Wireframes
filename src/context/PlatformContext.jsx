import React, { createContext, useContext, useState } from 'react';
import { ROLE_CONTEXT, DEFAULT_ROLE, MATERIALS } from '../data/mockData';
import { DEPENDENT_VARIABLE, defaultParameterSelection, returningParameterSelection, requiredConnectors } from '../data/parameterCatalog';
import { currentSession } from '../lib/portal';

const PlatformContext = createContext(null);

// Whether this user has already loaded their data. First-time users go through onboarding once;
// returning users are sent straight to the dashboard. It survives sign-out (it describes the user's data, not the session).
const ONBOARDED_KEY = 'aitek-onboarded';

// The user's data setup: which parameters they chose (and the source declared for each), and which data
// sources are connected. It survives sign-out for the same reason as the flag above.
// v2: the catalogue moved to the model's dependent/independent variables, so older selections are ignored.
const PARAMS_KEY = 'aitek-parameters-v2';
const CONNECTED_KEY = 'aitek-connected-sources';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // storage can be blocked; the setup then lasts for this session only
  }
}

function readParameterSelection() {
  const stored = readJson(PARAMS_KEY, null);
  const base = defaultParameterSelection();
  if (!stored || !stored.rows) return base;
  // keep any parameter added to the catalogue since the selection was stored; the dependent variable is always in the model
  const rows = { ...base.rows, ...stored.rows };
  rows[DEPENDENT_VARIABLE.id] = { ...rows[DEPENDENT_VARIABLE.id], on: true };
  return { fromYear: stored.fromYear || base.fromYear, toYear: stored.toYear || base.toYear, rows };
}

function readOnboarded() {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

// The signed-in user comes from the portal's launch ticket: name, email, tenant, plants and role.
const userFromSession = (s) => (s ? { name: s.name, email: s.email, tenant: s.tenant, plants: s.plants || [], role: s.role } : null);

export function PlatformProvider({ children }) {
  const [user, setUser] = useState(() => userFromSession(currentSession()));
  // A role from the ticket that IM knows (e.g. Head of Supply Chain) also picks the starting persona and scope.
  const startRole = ROLE_CONTEXT[user?.role] ? user.role : DEFAULT_ROLE;
  const [role, setRoleState] = useState(startRole);
  const [scope, setScope] = useState(ROLE_CONTEXT[startRole].scope);
  const [persona, setPersona] = useState(ROLE_CONTEXT[startRole].persona);
  const [selectedMaterialId, setSelectedMaterialId] = useState('MAT-1082');
  // Focus items the user has approved or snoozed this session (in memory only; sign-out clears it).
  const [resolvedFocus, setResolvedFocus] = useState({});
  const [onboarded, setOnboardedState] = useState(readOnboarded);
  const [parameterSelection, setParameterSelectionState] = useState(readParameterSelection);
  const [connectedSources, setConnectedSourcesState] = useState(() => readJson(CONNECTED_KEY, []));

  function setParameterSelection(next) {
    setParameterSelectionState(next);
    writeJson(PARAMS_KEY, next);
  }

  function setConnectedSources(next) {
    setConnectedSourcesState(next);
    writeJson(CONNECTED_KEY, next);
  }

  // Prototype helpers: a first-time user has chosen and connected nothing yet;
  // a returning user has a complete setup (a typical variable set, every required source connected).
  function resetSetup() {
    setParameterSelection(defaultParameterSelection());
    setConnectedSources([]);
  }

  function seedReturningSetup() {
    const selection = returningParameterSelection();
    setParameterSelection(selection);
    setConnectedSources(requiredConnectors(selection.rows).map((c) => c.id));
  }

  function setOnboarded(next) {
    setOnboardedState(next);
    try {
      localStorage.setItem(ONBOARDED_KEY, String(next));
    } catch (e) {
      // storage can be blocked; the flag then lasts for this session only
    }
  }

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

  // The persona tabs also move the plant scope: plant roles see their own plant, the Head of Supply Chain and procurement see all plants.
  function choosePersona(key) {
    setPersona(key);
    const ctx = Object.values(ROLE_CONTEXT).find((c) => c.persona === key);
    if (ctx) setScope(ctx.scope);
  }

  function signInFromTicket(session) {
    setUser(userFromSession(session));
    if (ROLE_CONTEXT[session.role]) setRole(session.role);
  }

  function resolveFocus(id, status) {
    setResolvedFocus((prev) => ({ ...prev, [id]: status }));
  }

  function resetSession() {
    setRoleState(DEFAULT_ROLE);
    const ctx = ROLE_CONTEXT[DEFAULT_ROLE];
    if (ctx) {
      setScope(ctx.scope);
      setPersona(ctx.persona);
    }
    setSelectedMaterialId('MAT-1082');
    setResolvedFocus({});
    setUser(null);
  }

  const department = ROLE_CONTEXT[role]?.dept ?? '';

  const value = {
    user,
    signInFromTicket,
    role,
    setRole,
    scope,
    setScope,
    persona,
    setPersona: choosePersona,
    department,
    resetSession,
    resolvedFocus,
    resolveFocus,
    selectedMaterialId,
    setSelectedMaterialId,
    selectedMaterial,
    onboarded,
    setOnboarded,
    parameterSelection,
    setParameterSelection,
    connectedSources,
    setConnectedSources,
    resetSetup,
    seedReturningSetup,
  };
  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform must be used within a PlatformProvider');
  return ctx;
}
