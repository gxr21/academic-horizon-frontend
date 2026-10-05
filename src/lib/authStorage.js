/**
 * Auth persistence.
 *
 * sessionStorage keeps each browser tab logged in as the account that
 * opened it, so a provider tab and a student tab can run side by side.
 * localStorage remembers the last login for a newly opened tab.
 */

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const getToken = () =>
  sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);

export const getStoredUserRaw = () =>
  sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);

/**
 * Pin this tab to whatever account is already saved, so a login in another
 * tab cannot replace this tab's token.
 */
export const pinAuthToThisTab = () => {
  if (!sessionStorage.getItem(TOKEN_KEY) && localStorage.getItem(TOKEN_KEY)) {
    sessionStorage.setItem(TOKEN_KEY, localStorage.getItem(TOKEN_KEY));
    const user = localStorage.getItem(USER_KEY);
    if (user) sessionStorage.setItem(USER_KEY, user);
  }
};

export const setAuthSession = (token, user) => {
  const userRaw = JSON.stringify(user);
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, userRaw);
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, userRaw);
};

export const setStoredUser = (user) => {
  const userRaw = JSON.stringify(user);
  sessionStorage.setItem(USER_KEY, userRaw);
  if (localStorage.getItem(TOKEN_KEY) === sessionStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(USER_KEY, userRaw);
  }
};

export const clearAuthSession = () => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  if (!token || localStorage.getItem(TOKEN_KEY) === token) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};
