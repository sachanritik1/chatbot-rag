/**
 * Factory for creating service containers in API routes
 *
 * This will be implemented once we move repositories and services to packages.
 * For now, this provides the type interface.
 */

import type { ServiceContainer } from "../container";

/**
 * Create a service container for an API route request
 *
 * This handles:
 * 1. Creating Supabase client with auth (cookies or Bearer token)
 * 2. Authenticating the user
 * 3. Setting up the container with all services
 *
 * @example
 * ```ts
 * export const POST = async (req: Request) => {
 *   const container = await createAPIContainer(req);
 *   const conversationService = container.get('ConversationService');
 *   // ...
 * };
 * ```
 */
export function createAPIContainer(
  _request: Request,
): Promise<ServiceContainer> {
  // TODO: Implement once repositories are moved to packages
  // For now, we'll implement this in the middleware
  throw new Error("Not implemented - use middleware instead");
}
