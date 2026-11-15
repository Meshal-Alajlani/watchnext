import { createContext, useContext } from 'react';

export const ServicesContext = createContext(null);

/**
 * The injected services. Components ask for what they need here instead of creating it,
 * so they never depend on a concrete class.
 * @returns {{auth: import('../../services/auth/AuthService.js').AuthService, api: import('../../services/api/MovieApi.js').MovieApi}}
 */
export function useServices() {
  const services = useContext(ServicesContext);
  if (!services) throw new Error('useServices must be used inside <ServicesProvider>.');
  return services;
}
