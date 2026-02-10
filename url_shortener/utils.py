import re
from urllib.parse import urlparse

def is_valid_url(url):
    """Check if a string is a valid URL format."""
    try:
        result = urlparse(url)
        # Must have scheme (http/https) and netloc (domain)
        if not all([result.scheme, result.netloc]):
            return False
        # Scheme must be http or https
        if result.scheme not in ['http', 'https']:
            return False
        # Basic domain pattern check
        domain_pattern = re.compile(
            r'^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?'
            r'(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
        )
        return bool(domain_pattern.match(result.netloc.split(':')[0]))
    except Exception:
        return False
