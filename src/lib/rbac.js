import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Validates authentication, user status, and role-based permissions.
 *
 * @param {Request} request Next.js Route Handler request
 * @param {string[]} [allowedRoles=[]] Optional list of authorized roles (e.g. ['farmer'], ['admin'], ['farmer', 'admin'])
 * @returns {Promise<{ error?: NextResponse, session?: object, user?: object, role?: string }>}
 */
export async function requireAuth(request, allowedRoles = []) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return {
        error: NextResponse.json(
          { error: "Unauthorized. Please log in first." },
          { status: 401 }
        ),
      };
    }

    const role = (session.user.role || "farmer").toLowerCase();

    // Check account suspension status
    if (session.user.isSuspended) {
      return {
        error: NextResponse.json(
          {
            error:
              "Your account has been temporarily suspended. Please contact FarmWise support for assistance.",
            isSuspended: true,
          },
          { status: 403 }
        ),
      };
    }

    // Role-based permission check
    if (allowedRoles.length > 0) {
      const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());
      if (!normalizedAllowed.includes(role)) {
        return {
          error: NextResponse.json(
            {
              error: `Forbidden. This action requires ${allowedRoles.join(" or ")} privileges.`,
              currentRole: role,
              requiredRoles: allowedRoles,
            },
            { status: 403 }
          ),
        };
      }
    }

    return {
      session,
      user: {
        ...session.user,
        role,
      },
      role,
    };
  } catch (error) {
    console.error("RBAC authorization check error:", error);
    return {
      error: NextResponse.json(
        { error: "Authentication verification failed." },
        { status: 500 }
      ),
    };
  }
}

/**
 * Returns the current session if authenticated, or null if visitor.
 * Never throws 401.
 *
 * @param {Request} request
 * @returns {Promise<{ session: object|null, user: object|null, role: string|null }>}
 */
export async function getOptionalSession(request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return { session: null, user: null, role: null };
    }

    const role = (session.user.role || "farmer").toLowerCase();
    return {
      session,
      user: {
        ...session.user,
        role,
      },
      role,
    };
  } catch {
    return { session: null, user: null, role: null };
  }
}
