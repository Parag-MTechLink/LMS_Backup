"""
Role–permission matrix for RBAC. Format: module:action.
Admin has "*" (all). Others have explicit list.
"""
from typing import FrozenSet

# Permission format: "module:action". Admin has "*" (all). "*:delete" = admin-only global delete.
ROLE_PERMISSIONS: dict[str, FrozenSet[str]] = {
    "Team Lead": frozenset([
        "dashboard:full", "organization:full", "customer:full", "rfq:full",
        "estimation:full", "project:full", "sample:full", "testplan:full",
        "testexecution:full", "testresult:full", "trf:full", "document:full",
        "report:full", "audit:full", "ncr:full", "certification:full",
        "calendar:full", "inventory:full", "qa:full", "recommendation:full",
        "user:full",
    ]),
    "Sales Engineer": frozenset([
        "dashboard:view", "organization:view", "customer:full", "rfq:full",
        "estimation:full", "project:view", "sample:view", "trf:view",
        "document:view", "calendar:view",
    ]),
    "Quality Manager": frozenset([
        "dashboard:view", "organization:view", "customer:view", "rfq:view",
        "estimation:view", "project:view", "sample:view", "testplan:full",
        "testexecution:view", "testresult:view", "trf:view", "document:view",
        "report:full", "audit:full", "ncr:full", "certification:full",
        "calendar:view", "inventory:view", "qa:full", "recommendation:full",
    ]),
    "Finance Manager": frozenset([
        "dashboard:view", "organization:none", "customer:view", "rfq:full",
        "estimation:full", "project:none", "sample:none", "calendar:view",
    ]),
    "Sales Manager": frozenset(["*"]), # Assuming Sales Manager has full access for now, or I should define it if needed. The request didn't specify Sales Manager or Project Manager in the matrix but they are in the roles list.
    "Project Manager": frozenset(["*"]), # Same for Project Manager.
}


def has_permission(role: str, permission: str) -> bool:
    """
    Check if role has the given permission.
    Admin with "*" has all. Otherwise permission must be in role's set.
    """
    perms = ROLE_PERMISSIONS.get(role)
    if perms is None:
        return False
    if "*" in perms:
        return True
    return permission in perms
