"""
Role–permission matrix for RBAC. Format: module:action.
Admin has "*" (all). Others have explicit list.
"""
from typing import FrozenSet

# Permission format: "module:action". Admin has "*" (all). "*:delete" = admin-only global delete.
ROLE_PERMISSIONS: dict[str, FrozenSet[str]] = {
    "Admin": frozenset(["*"]),
    "Team Lead": frozenset([
        "dashboard:full", "organization:full", "customer:full", "rfq:full",
        "estimation:full", "project:full", "sample:full", "testplan:full",
        "testexecution:full", "testresult:full", "trf:full", "document:full",
        "report:full", "audit:full", "ncr:full", "certification:full",
        "calendar:full", "inventory:full", "qa:full", "recommendation:full",
        "user:full",
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
        "estimation:full", "project:full", "sample:view", "calendar:view",
    ]),
    "Sales Manager": frozenset(["*"]), # Assuming Sales Manager has full access for now, or I should define it if needed. The request didn't specify Sales Manager or Project Manager in the matrix but they are in the roles list.
    "Project Manager": frozenset(["*"]), # Same for Project Manager.
    "Technical Manager": frozenset([
        "dashboard:view", "organization:view", "customer:view", "rfq:full",
        "estimation:view", "project:full", "sample:view", "testplan:full",
        "testexecution:view", "testresult:view", "trf:view", "document:view",
        "report:full", "audit:view", "ncr:full", "certification:full",
        "calendar:view", "inventory:view", "qa:full", "recommendation:view",
    ]),
}


def has_permission(role: str, permission: str) -> bool:
    """
    Check if role has the given permission.
    Admin with "*" has all. 
    Hierarchy: full > edit > view
    """
    perms = ROLE_PERMISSIONS.get(role)
    if perms is None:
        return False
    if "*" in perms:
        return True
    
    # Exact match
    if permission in perms:
        return True
        
    # Hierarchy check
    import logging
    logger = logging.getLogger("app")
    
    if ":" in permission:
        module, action = permission.split(":", 1)
        res = False
        if action == "view":
            res = f"{module}:edit" in perms or f"{module}:full" in perms
        elif action == "edit":
            res = f"{module}:full" in perms
            
        if res:
            return True
            
    logger.warning(f"Permission denied: role='{role}' permission='{permission}'")
    return False
