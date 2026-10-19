// Inventory Modelling does not sign users in itself: the central AITEK portal (AiTek-Authentication) does, and
// opens this app at /launch with a launch ticket in the URL fragment.
// PROTOTYPE STAND-IN: in production this app is its own Entra ID (OIDC) client and signs in silently against the
// identity-provider session; the ticket below only simulates that hand-over.

export const APP_ID = 'inventory-modelling';
export const PORTAL_URL = (import.meta.env.VITE_PORTAL_URL || 'http://localhost:5170').replace(/\/$/, '');
const SESSION_KEY = 'aitek-im-session';

const decode = (raw) => JSON.parse(decodeURIComponent(escape(atob(raw.replace(/-/g, '+').replace(/_/g, '/')))));

// Read the ticket from the fragment, strip it from the URL, and accept it only if it is for this app and not expired.
// Returns { session } or { error: 'missing' | 'invalid' | 'expired' | 'audience' }.
export function readTicket() {
  const match = window.location.hash.match(/ticket=([^&]+)/);
  if (!match) return { error: 'missing' };
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  let ticket;
  try {
    ticket = decode(match[1]);
  } catch (e) {
    return { error: 'invalid' };
  }
  if (ticket.aud !== APP_ID) return { error: 'audience' };
  if (!ticket.exp || ticket.exp < Date.now()) return { error: 'expired' };
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(ticket));
  } catch (e) {
    // storage can be blocked; the session then lasts for this page only
  }
  return { session: ticket };
}

export function currentSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (e) {
    // nothing stored
  }
}

export function goToPortal(path = '/') {
  window.location.assign(`${PORTAL_URL}${path}`);
}
