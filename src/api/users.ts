import { createCrudApi } from "./crudFactory";
import type { UserAccountEntry, UserAccountWritePayload } from "./types";

// No .remove() is ever called. The backend doesn't expose DELETE for
// this resource (deactivate via is_active instead, never hard-delete a
// user: past sales/closings still reference them by FK).
export const usersApi = createCrudApi<UserAccountEntry, Partial<UserAccountWritePayload>>(
  "/core/users/"
);
