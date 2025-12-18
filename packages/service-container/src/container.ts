import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ContainerContext,
  ServiceConstructor,
  ServiceFactory,
} from "./types";

/**
 * Simple Dependency Injection Container
 *
 * Provides lazy instantiation and caching of services per request.
 * Services and repositories are created once per container instance (request-scoped).
 *
 * @example
 * ```ts
 * const container = new ServiceContainer(supabaseClient, userId);
 * container.register('ConversationService', (ctx) => new ConversationService(
 *   new SupabaseConversationsRepository(ctx.supabase),
 *   new SupabaseChatsRepository(ctx.supabase)
 * ));
 * const service = container.get('ConversationService');
 * ```
 */
export class ServiceContainer {
  private services = new Map<string | ServiceConstructor, unknown>();
  private factories = new Map<
    string | ServiceConstructor,
    ServiceFactory<unknown>
  >();
  private context: ContainerContext;

  constructor(supabase: SupabaseClient, userId?: string) {
    this.context = { supabase, userId };
  }

  /**
   * Register a service factory
   */
  register<T>(
    key: string | ServiceConstructor<T>,
    factory: ServiceFactory<T>,
  ): void {
    this.factories.set(key, factory as ServiceFactory<unknown>);
  }

  /**
   * Get or create a service instance
   */
  get<T>(key: string | ServiceConstructor<T>): T {
    // Return cached instance if exists
    if (this.services.has(key)) {
      return this.services.get(key) as T;
    }

    // Get factory
    const factory = this.factories.get(key);
    if (!factory) {
      throw new Error(
        `Service not registered: ${typeof key === "string" ? key : key.name}`,
      );
    }

    // Create and cache instance
    const instance = factory(this.context) as T;
    this.services.set(key, instance);
    return instance;
  }

  /**
   * Get the Supabase client
   */
  getSupabase(): SupabaseClient {
    return this.context.supabase;
  }

  /**
   * Get the current user ID (if authenticated)
   */
  getUserId(): string | undefined {
    return this.context.userId;
  }
}
