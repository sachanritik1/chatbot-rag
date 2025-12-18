import type { SupabaseClient } from "@supabase/supabase-js";

import { ServiceContainer } from "@chatbot-rag/service-container";
import type { ConversationService } from "@chatbot-rag/domain/conversations";
import { ConversationService as ConversationServiceClass } from "@chatbot-rag/domain/conversations";
import { UserService } from "@chatbot-rag/domain/users";
import { SupabaseChatsRepository } from "@/utils/repositories";
import { SupabaseConversationsRepository } from "@/utils/repositories";
import { createAPIUsersRepository } from "@/utils/repositories";
import { createAPIClient } from "@/utils/supabase/api";

interface ZodSchema<T> {
  safeParse(
    data: unknown,
  ):
    | { success: true; data: T }
    | { success: false; error: { message: string; issues: unknown[] } };
}

/**
 * Service registry type
 */
interface ServiceRegistry {
  ConversationService: ConversationService;
}

/**
 * Typed service container wrapper
 */
export class TypedServiceContainer extends ServiceContainer {
  get<K extends keyof ServiceRegistry>(key: K): ServiceRegistry[K];
  get<T>(key: string): T;
  get(key: string): unknown {
    return super.get(key);
  }

  override getSupabase(): ApiSupabaseClient {
    return super.getSupabase() as ApiSupabaseClient;
  }
}

/**
 * Context provided to authenticated handlers
 */
export interface AuthContext {
  user: { id: string };
  container: TypedServiceContainer;
}

type ApiSupabaseClient = SupabaseClient;

/**
 * Handler that receives auth context
 */
export type AuthenticatedHandler = (
  req: Request,
  ctx: AuthContext,
) => Promise<Response>;

/**
 * Handler that receives validated data
 */
export type ValidatedHandler<T> = (
  req: Request,
  data: T,
  ctx: AuthContext,
) => Promise<Response>;

/**
 * Middleware: Authenticate request and provide user context
 *
 * Eliminates 45+ occurrences of duplicate auth setup code
 *
 * @example
 * ```ts
 * export const POST = withAuth(async (req, { user, container }) => {
 *   const service = container.get('ConversationService');
 *   // ...
 * });
 * ```
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: Request) => {
    try {
      // Create Supabase client (supports both cookies and Bearer tokens)
      const supabase = (await createAPIClient(req)) as ApiSupabaseClient;

      // Authenticate user
      const usersRepo = await createAPIUsersRepository(req);
      const userService = new UserService(usersRepo);
      const user = await userService.requireCurrentUser().catch(() => null);

      if (!user?.id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Create service container
      const container = new TypedServiceContainer(supabase, user.id);

      // Register services
      container.register(
        "ConversationService",
        (ctx) =>
          new ConversationServiceClass(
            new SupabaseConversationsRepository(ctx.supabase),
            new SupabaseChatsRepository(ctx.supabase),
          ),
      );
      // Note: UserService is already created above for auth,
      // so we don't need to register it in the container

      // Call handler with context
      return handler(req, { user, container });
    } catch (error) {
      console.error("Auth middleware error:", error);
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  };
}

/**
 * Middleware: Validate request body against Zod schema
 *
 * @example
 * ```ts
 * export const POST = withValidation(createConversationSchema)(
 *   async (req, data) => {
 *     // data is typed and validated
 *   }
 * );
 * ```
 */
export function withValidation<T>(schema: ZodSchema<T>) {
  return function (handler: ValidatedHandler<T>): AuthenticatedHandler {
    return async (req: Request, ctx: AuthContext) => {
      try {
        const body: unknown = await req.json();
        const result = schema.safeParse(body);

        if (!result.success) {
          return Response.json(
            { error: result.error.message, issues: result.error.issues },
            { status: 400 },
          );
        }

        return handler(req, result.data, ctx);
      } catch {
        return Response.json(
          { error: "Invalid JSON in request body" },
          { status: 400 },
        );
      }
    };
  };
}

/**
 * Middleware: Wrap handler with error handling
 *
 * @example
 * ```ts
 * export const POST = withErrorHandling(async (req) => {
 *   // Any errors thrown here will be caught
 * });
 * ```
 */
export function withErrorHandling(
  handler: (req: Request) => Promise<Response>,
) {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error) {
      console.error("API error:", error);
      return Response.json(
        {
          error:
            error instanceof Error ? error.message : "Internal server error",
        },
        { status: 500 },
      );
    }
  };
}

/**
 * Compose auth + validation middlewares with error handling
 *
 * This is a specialized compose function that properly types the middleware chain:
 * withErrorHandling -> withAuth -> withValidation -> handler
 *
 * @example
 * ```ts
 * export const POST = composeAuthValidation(schema)(
 *   async (_req, data, { user, container }) => {
 *     // data is typed from schema
 *     // user and container are properly typed
 *   }
 * );
 * ```
 */
export function composeAuthValidation<T>(schema: ZodSchema<T>) {
  return (
    handler: ValidatedHandler<T>,
  ): ((req: Request) => Promise<Response>) => {
    return withErrorHandling(withAuth(withValidation(schema)(handler)));
  };
}

/**
 * Compose auth middleware with error handling (no validation)
 *
 * @example
 * ```ts
 * export const GET = composeAuth(async (_req, { user, container }) => {
 *   // user and container are properly typed
 * });
 * ```
 */
export function composeAuth(
  handler: AuthenticatedHandler,
): (req: Request) => Promise<Response> {
  return withErrorHandling(withAuth(handler));
}
