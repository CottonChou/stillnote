import type { Context } from "hono";
import type { CloudflareStorageBindings } from "./cloudflare-storage-adapter";
import type { StorageAdapter } from "./storage-contract";

export type Bindings = {
  /** Runtime driver for public-only egress; no platform-specific business logic. */
  publicNetworkFetch?: (input: string, init: RequestInit) => Promise<Response>;
  /** The only persistence dependency exposed to application code. */
  storage: StorageAdapter;
  STILLNOTE_AUTH_USERNAME?: string;
  STILLNOTE_RUNTIME?: string;
  STILLNOTE_CONTAINER_IMAGE?: string;
  STILLNOTE_DEPLOYMENT_TRIGGER?: string;
  STILLNOTE_DEPLOYMENT_METHOD?: string;
  STILLNOTE_BUILD_CREATED_AT?: string;
  STILLNOTE_BUILD_TRIGGER?: string;
  STILLNOTE_BUILD_METHOD?: string;
  /** Creation time of the active deployment version, supplied by a runtime adapter. */
  deploymentVersionCreatedAt?: string;
  STILLNOTE_AUTH_PASSWORD?: string;
  STILLNOTE_AUTH_PASSWORD_HASH?: string;
  STILLNOTE_AUTH_PASSWORD_FALLBACK?: string;
  STILLNOTE_SESSION_TTL_DAYS?: string;
  STILLNOTE_AUTH_LOGIN_WINDOW_SECONDS?: string;
  STILLNOTE_AUTH_LOGIN_USERNAME_MAX_ATTEMPTS?: string;
  STILLNOTE_AUTH_LOGIN_USERNAME_COOLDOWN_SECONDS?: string;
  STILLNOTE_AUTH_LOGIN_IP_MAX_ATTEMPTS?: string;
  STILLNOTE_AUTH_LOGIN_IP_COOLDOWN_SECONDS?: string;
  STILLNOTE_R2_BUCKET_NAME?: string;
  /** Legacy decryption fallback; new credentials use auth-derived keys. */
  STILLNOTE_STORAGE_ENCRYPTION_KEY?: string;
  STILLNOTE_CREDENTIALS_ENCRYPTION_KEY?: string;
  STILLNOTE_CREDENTIALS_ENCRYPTION_KEY_PREVIOUS?: string;
  STILLNOTE_DEMO_MODE?: string;
  STILLNOTE_LOCAL_DEMO_SEED?: string;
  STILLNOTE_ALLOW_UNAUTHENTICATED?: string;
  /** HTTPS URL of the signed community registry. Unset disables the catalog. */
  STILLNOTE_COMMUNITY_REGISTRY_URL?: string;
};

export type WorkerBindings = Omit<Bindings, "storage" | "publicNetworkFetch" | "deploymentVersionCreatedAt"> & CloudflareStorageBindings & {
  ASSETS: Fetcher;
  CF_VERSION_METADATA?: { timestamp?: string };
};

export type AuthContext = {
  kind: "user" | "agent";
  actorType: "user" | "agent";
  actorId: string | null;
  username: string;
  displayName: string | null;
  scopes: string[];
  workspaceId: string;
  role: "owner" | "member";
  sessionId?: string;
  tokenId?: string;
};

export type AuditActor = {
  actorType: "user" | "agent";
  actorId: string | null;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    auth: AuthContext;
  };
};

export type AppContext = Context<AppEnv>;
