"""
Role–permission matrix for RBAC. Format: module:action.
Admin has "*" (all). Others have explicit list.
"""
from typing import FrozenSet

# Permission format: "module:action". Admin has "*" (all). "*:delete" = admin-only global delete.
ROLE_PERMISSIONS: dict[str, FrozenSet[str]] = {
    "Admin": frozenset(["*"]),  # includes "*:delete" for all modules
    "Lab Manager": frozenset([
        "rfq:view", "rfq:approve",
        "estimation:review",
        "project:assign",
        "testplan:approve", "testresult:approve",
        "report:view", "audit:manage", "ncr:review",
        "inventory:view", "qa:manage",
        "organization:view", "scope:view", "customer:view", "project:view",
        "sample:view", "testplan:view", "testexecution:view", "testresult:view",
        "trf:view", "document:view", "certification:view", "calendar:view",
    ]),
    "Sales Engineer": frozenset([
        "rfq:create", "rfq:view_own", "rfq:edit_draft",
        "estimation:create", "customer:manage", "report:view_limited",
        "project:view", "customer:view", "rfq:view",
    ]),
    "Testing Engineer": frozenset([
        "project:view_assigned", "sample:view_assigned",
        "testplan:create", "testexecution:update", "testresult:submit",
        "trf:generate", "inventory:view",
        "project:view", "sample:view", "testplan:view", "testexecution:view",
        "testresult:view", "trf:view", "document:view", "calendar:view",
    ]),
    "Technician": frozenset([
        "sample:view_assigned", "testexecution:update_status",
        "inventory:update_usage", "calendar:view",
        "sample:view", "testexecution:view", "inventory:view",
    ]),
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
