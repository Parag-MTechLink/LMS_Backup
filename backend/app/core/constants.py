"""
Application-wide constants. Avoid magic numbers in routes and services.
"""
# RFQ Excel upload
RFQ_ALLOWED_EXTENSIONS = (".xlsx",)
RFQ_CONTENT_TYPES = frozenset({
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",  # some clients send this for .xlsx
})

# Response cache limits (RAG)
RAG_RESPONSE_CACHE_MAX = 500

# Logging
LOG_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"
