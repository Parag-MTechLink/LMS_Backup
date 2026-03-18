from app.core.permissions import has_permission
import json

roles_to_test = ["Admin", "Sales Manager", "Project Manager", "Technical Manager", "Finance Manager", "Team Lead", "Quality Manager"]
perms_to_test = ["rfq:view", "rfq:full", "project:view", "project:full"]

results = {}
for role in roles_to_test:
    results[role] = {}
    for perm in perms_to_test:
        results[role][perm] = has_permission(role, perm)

with open("test_results.json", "w") as f:
    json.dump(results, f, indent=4)
print("Done")
