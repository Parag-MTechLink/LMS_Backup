"""
Lab recommendation engine data access.
Reads from lab_engine schema in NeonDB (LAB_ENGINE_DATABASE_URL).
No plugins; single service. Used by LabRecommendationEngine.
"""
import logging
from typing import Any

import psycopg2
from psycopg2.extras import RealDictCursor

logger = logging.getLogger(__name__)


class LabRecommendationService:
    """Data access for lab recommendation engine. Uses dedicated lab_engine DB (NeonDB)."""

    def __init__(self, database_url: str):
        if not database_url or not database_url.strip():
            raise ValueError("LAB_ENGINE_DATABASE_URL is required for lab recommendation engine")
        self._database_url = database_url.strip()

    def _get_conn(self):
        return psycopg2.connect(self._database_url)

    def health(self) -> dict[str, Any]:
        """Return health info: status, active_labs count or error."""
        try:
            conn = self._get_conn()
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM labs WHERE deleted_at IS NULL")
            lab_count = cur.fetchone()[0]
            cur.close()
            conn.close()
            return {"status": "healthy", "database": "connected", "active_labs": lab_count}
        except Exception as e:
            logger.warning("Lab recommendation engine health check failed: %s", e)
            return {"status": "unhealthy", "error": str(e)}

    def search_labs(
        self,
        test_name: str = "",
        standard: str = "",
        domain: str = "",
        state: str = "",
        city: str = "",
        limit: int = 50,
    ) -> tuple[list[dict], str | None]:
        """Search labs by test/standard/domain/state/city. Returns (results, error_message)."""
        if not any([test_name, standard, domain, state, city]):
            return [], "At least one search parameter (test_name, standard, domain, state, or city) is required"
        try:
            conn = self._get_conn()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            conditions = ["l.deleted_at IS NULL"]
            params: list[Any] = []
            if test_name:
                conditions.append("LOWER(t.test_name) LIKE LOWER(%s)")
                params.append(f"%{test_name}%")
            if standard:
                conditions.append("LOWER(s.standard_code) LIKE LOWER(%s)")
                params.append(f"%{standard}%")
            if domain:
                conditions.append("d.domain_name = %s")
                params.append(domain)
            if state:
                conditions.append("l.state = %s")
                params.append(state)
            if city:
                conditions.append("l.city = %s")
                params.append(city)
            query = f"""
                SELECT DISTINCT
                    l.lab_id,
                    l.lab_name,
                    l.state,
                    l.city,
                    l.prime_address,
                    l.group_name,
                    l.sub_group_name,
                    l.latitude,
                    l.longitude,
                    t.test_name,
                    s.standard_code,
                    s.full_code,
                    s.standard_body,
                    d.domain_name
                FROM labs l
                JOIN lab_capabilities lc ON lc.lab_id = l.lab_id
                JOIN tests t ON t.test_id = lc.test_id
                JOIN standards s ON s.standard_id = lc.standard_id
                JOIN domains d ON d.domain_id = lc.domain_id
                WHERE {' AND '.join(conditions)}
                ORDER BY l.lab_name, t.test_name
                LIMIT %s
            """
            params.append(limit)
            cur.execute(query, params)
            results = [dict(row) for row in cur.fetchall()]
            cur.close()
            conn.close()
            return results, None
        except Exception as e:
            logger.exception("Lab search failed")
            return [], str(e)

    def recommend_labs(
        self,
        test_name: str = "",
        standard: str = "",
        domain: str = "",
        state: str = "",
        city: str = "",
        limit: int = 20,
    ) -> tuple[list[dict], str | None]:
        """Ranked lab recommendations. Returns (results, error_message)."""
        if not any([test_name, standard, domain, state, city]):
            return [], "At least one search parameter is required"
        try:
            conn = self._get_conn()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            conditions = ["l.deleted_at IS NULL"]
            params: list[Any] = []
            if test_name:
                conditions.append("LOWER(t.test_name) LIKE LOWER(%s)")
                params.append(f"%{test_name}%")
            if standard:
                conditions.append("LOWER(s.standard_code) LIKE LOWER(%s)")
                params.append(f"%{standard}%")
            if domain:
                conditions.append("d.domain_name = %s")
                params.append(domain)
            if state:
                conditions.append("l.state = %s")
                params.append(state)
            if city:
                conditions.append("l.city = %s")
                params.append(city)
            query = f"""
                WITH lab_scores AS (
                    SELECT
                        l.lab_id,
                        l.lab_name,
                        l.state,
                        l.city,
                        l.prime_address,
                        l.group_name,
                        l.sub_group_name,
                        l.latitude,
                        l.longitude,
                        COUNT(DISTINCT lc.test_id) AS matching_tests,
                        COUNT(DISTINCT lc.standard_id) AS matching_standards,
                        COUNT(DISTINCT lc.domain_id) AS matching_domains,
                        COUNT(*) AS total_matches,
                        array_agg(DISTINCT t.test_name) AS test_names,
                        array_agg(DISTINCT s.standard_code) AS standard_codes
                    FROM labs l
                    JOIN lab_capabilities lc ON lc.lab_id = l.lab_id
                    JOIN tests t ON t.test_id = lc.test_id
                    JOIN standards s ON s.standard_id = lc.standard_id
                    JOIN domains d ON d.domain_id = lc.domain_id
                    WHERE {' AND '.join(conditions)}
                    GROUP BY
                        l.lab_id,
                        l.lab_name,
                        l.state,
                        l.city,
                        l.prime_address,
                        l.group_name,
                        l.sub_group_name,
                        l.latitude,
                        l.longitude
                )
                SELECT
                    lab_id,
                    lab_name,
                    state,
                    city,
                    prime_address,
                    group_name,
                    sub_group_name,
                    latitude,
                    longitude,
                    matching_tests,
                    matching_standards,
                    matching_domains,
                    total_matches,
                    test_names[1:5] AS sample_tests,
                    standard_codes[1:5] AS sample_standards,
                    (matching_tests * 10 + matching_standards * 5 + matching_domains * 1) AS relevance_score
                FROM lab_scores
                WHERE total_matches > 0
                ORDER BY relevance_score DESC, matching_tests DESC, matching_standards DESC
                LIMIT %s
            """
            params.append(limit)
            cur.execute(query, params)
            results = [dict(row) for row in cur.fetchall()]
            cur.close()
            conn.close()
            return results, None
        except Exception as e:
            logger.exception("Lab recommend failed")
            return [], str(e)

    def get_lab_details(self, lab_id: int) -> tuple[dict | None, str | None]:
        """Get lab by id with capabilities and domain summary. Returns (data, error_message)."""
        try:
            conn = self._get_conn()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                """
                SELECT
                    lab_id,
                    lab_name,
                    created_at,
                    updated_at,
                    state,
                    city,
                    scope_url,
                    prime_address,
                    group_name,
                    sub_group_name,
                    latitude,
                    longitude
                FROM labs
                WHERE lab_id = %s AND deleted_at IS NULL
                """,
                (lab_id,),
            )
            lab = cur.fetchone()
            if not lab:
                cur.close()
                conn.close()
                return None, "Lab not found"
            cur.execute(
                """
                SELECT
                    t.test_name,
                    s.standard_code,
                    s.full_code,
                    s.standard_body,
                    d.domain_name
                FROM lab_capabilities lc
                JOIN tests t ON t.test_id = lc.test_id
                JOIN standards s ON s.standard_id = lc.standard_id
                JOIN domains d ON d.domain_id = lc.domain_id
                WHERE lc.lab_id = %s
                ORDER BY d.domain_name, t.test_name
                """,
                (lab_id,),
            )
            capabilities = [dict(c) for c in cur.fetchall()]
            cur.execute(
                """
                SELECT
                    d.domain_name,
                    COUNT(*) AS capability_count
                FROM lab_capabilities lc
                JOIN domains d ON d.domain_id = lc.domain_id
                WHERE lc.lab_id = %s
                GROUP BY d.domain_id, d.domain_name
                ORDER BY capability_count DESC
                """,
                (lab_id,),
            )
            domain_summary = [dict(d) for d in cur.fetchall()]
            cur.close()
            conn.close()
            return {
                "lab": dict(lab),
                "capabilities": capabilities,
                "domain_summary": domain_summary,
                "total_capabilities": len(capabilities),
            }, None
        except Exception as e:
            logger.exception("Get lab details failed")
            return None, str(e)

    def get_domains(self) -> tuple[list[dict], str | None]:
        """List all domains with counts. Returns (domains, error_message)."""
        try:
            conn = self._get_conn()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT
                    d.domain_id,
                    d.domain_name,
                    COUNT(*) AS total_capabilities,
                    COUNT(DISTINCT lc.lab_id) AS lab_count
                FROM domains d
                LEFT JOIN lab_capabilities lc ON lc.domain_id = d.domain_id
                GROUP BY d.domain_id, d.domain_name
                ORDER BY total_capabilities DESC
            """)
            domains = [dict(d) for d in cur.fetchall()]
            cur.close()
            conn.close()
            return domains, None
        except Exception as e:
            logger.exception("Get domains failed")
            return [], str(e)

    def search_labs_by_name(
        self, query: str = "", limit: int = 100
    ) -> tuple[list[dict], str | None]:
        """Search labs by name. Returns (list of { lab_id, lab_name, capability_count }, error)."""
        try:
            conn = self._get_conn()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            if query and query.strip():
                pattern = f"%{query.strip()}%"
                cur.execute("""
                    SELECT
                        l.lab_id,
                        l.lab_name,
                        COUNT(lc.lab_id) AS capability_count
                    FROM labs l
                    LEFT JOIN lab_capabilities lc ON lc.lab_id = l.lab_id
                    WHERE l.deleted_at IS NULL
                      AND LOWER(l.lab_name) LIKE LOWER(%s)
                    GROUP BY l.lab_id, l.lab_name
                    ORDER BY capability_count DESC, l.lab_name
                    LIMIT %s
                """, (pattern, limit))
            else:
                cur.execute("""
                    SELECT
                        l.lab_id,
                        l.lab_name,
                        COUNT(lc.lab_id) AS capability_count
                    FROM labs l
                    LEFT JOIN lab_capabilities lc ON lc.lab_id = l.lab_id
                    WHERE l.deleted_at IS NULL
                    GROUP BY l.lab_id, l.lab_name
                    ORDER BY capability_count DESC, l.lab_name
                    LIMIT %s
                """, (limit,))
            results = [dict(r) for r in cur.fetchall()]
            cur.close()
            conn.close()
            return results, None
        except Exception as e:
            logger.exception("Search labs by name failed")
            return [], str(e)

    def get_statistics(self) -> tuple[dict[str, Any], str | None]:
        """Database statistics: counts, domain distribution, top labs. Returns (data, error)."""
        try:
            conn = self._get_conn()
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM labs WHERE deleted_at IS NULL")
            active_labs = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM lab_capabilities")
            total_capabilities = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM tests")
            unique_tests = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM standards")
            unique_standards = cur.fetchone()[0]
            cur.close()

            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT
                    d.domain_name,
                    COUNT(*) AS capability_count,
                    COUNT(DISTINCT lc.lab_id) AS lab_count
                FROM domains d
                JOIN lab_capabilities lc ON lc.domain_id = d.domain_id
                JOIN labs l ON l.lab_id = lc.lab_id
                WHERE l.deleted_at IS NULL
                GROUP BY d.domain_id, d.domain_name
                ORDER BY capability_count DESC
            """)
            domain_distribution = [dict(r) for r in cur.fetchall()]

            cur.execute("""
                SELECT
                    l.lab_id,
                    l.lab_name,
                    COUNT(*) AS total_capabilities,
                    COUNT(DISTINCT lc.test_id) AS unique_tests,
                    COUNT(DISTINCT lc.standard_id) AS unique_standards,
                    COUNT(DISTINCT lc.domain_id) AS unique_domains
                FROM labs l
                JOIN lab_capabilities lc ON lc.lab_id = l.lab_id
                WHERE l.deleted_at IS NULL
                GROUP BY l.lab_id, l.lab_name
                ORDER BY total_capabilities DESC
                LIMIT 20
            """)
            top_labs = [dict(r) for r in cur.fetchall()]
            cur.close()
            conn.close()

            return {
                "active_labs": active_labs,
                "total_capabilities": total_capabilities,
                "unique_tests": unique_tests,
                "unique_standards": unique_standards,
                "domain_distribution": domain_distribution,
                "top_labs": top_labs,
            }, None
        except Exception as e:
            logger.exception("Get statistics failed")
            return {}, str(e)

    def get_locations(self) -> tuple[dict[str, list[str]], str | None]:
        """Distinct state/city for filters. Returns ({ state: [city, ...] }, error_message)."""
        try:
            conn = self._get_conn()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT DISTINCT state, city
                FROM labs
                WHERE deleted_at IS NULL AND state IS NOT NULL
                ORDER BY state, city
            """)
            rows = cur.fetchall()
            cur.close()
            conn.close()
            locations: dict[str, list[str]] = {}
            for r in rows:
                st = r.get("state")
                ct = r.get("city")
                if st not in locations:
                    locations[st] = []
                if ct and ct not in locations[st]:
                    locations[st].append(ct)
            return locations, None
        except Exception as e:
            logger.exception("Get locations failed")
            return {}, str(e)

    def search_tests(self, q: str, limit: int = 20) -> tuple[list[dict], str | None]:
        """Search tests by name. Returns (results, error_message)."""
        if not q or not q.strip():
            return [], "Search query is required"
        try:
            conn = self._get_conn()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT DISTINCT
                    t.test_id,
                    t.test_name,
                    COUNT(DISTINCT lc.lab_id) AS lab_count
                FROM tests t
                JOIN lab_capabilities lc ON lc.test_id = t.test_id
                JOIN labs l ON l.lab_id = lc.lab_id
                WHERE LOWER(t.test_name) LIKE LOWER(%s)
                  AND l.deleted_at IS NULL
                GROUP BY t.test_id, t.test_name
                ORDER BY lab_count DESC, t.test_name
                LIMIT %s
            """, (f"%{q.strip()}%", limit))
            results = [dict(r) for r in cur.fetchall()]
            cur.close()
            conn.close()
            return results, None
        except Exception as e:
            logger.exception("Search tests failed")
            return [], str(e)

    def search_standards(self, q: str, limit: int = 20) -> tuple[list[dict], str | None]:
        """Search standards by code. Returns (results, error_message)."""
        if not q or not q.strip():
            return [], "Search query is required"
        try:
            conn = self._get_conn()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("""
                SELECT DISTINCT
                    s.standard_id,
                    s.standard_code,
                    s.full_code,
                    s.standard_body,
                    COUNT(DISTINCT lc.lab_id) AS lab_count
                FROM standards s
                JOIN lab_capabilities lc ON lc.standard_id = s.standard_id
                JOIN labs l ON l.lab_id = lc.lab_id
                WHERE LOWER(s.standard_code) LIKE LOWER(%s)
                  AND l.deleted_at IS NULL
                GROUP BY s.standard_id, s.standard_code, s.full_code, s.standard_body
                ORDER BY lab_count DESC, s.standard_code
                LIMIT %s
            """, (f"%{q.strip()}%", limit))
            results = [dict(r) for r in cur.fetchall()]
            cur.close()
            conn.close()
            return results, None
        except Exception as e:
            logger.exception("Search standards failed")
            return [], str(e)
