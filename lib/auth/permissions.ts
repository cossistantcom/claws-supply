type Actor = {
  id: string;
  role?: string | null;
};

export function isAdmin(actor: Actor): boolean {
  return actor.role === "admin";
}

export function canUserAccess(actor: Actor, targetUserId: string): boolean {
  return isAdmin(actor) || actor.id === targetUserId;
}

export function canUserEdit(actor: Actor, targetUserId: string): boolean {
  return isAdmin(actor) || actor.id === targetUserId;
}

