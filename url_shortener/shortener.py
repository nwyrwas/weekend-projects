import json
import time
from datetime import datetime, timedelta
from utils import is_valid_url

class URLShortener:
    def __init__(self, base_url='http://short.url/', data_file='url_data.json'):
        self.base_url = base_url
        self.data_file = data_file
        self.counter = 0

        # Core hashmaps
        self.url_to_short = {}  # original_url -> short_code
        self.short_to_url = {}  # short_code -> original_url

        # Bonus feature data
        self.expiration = {}    # short_code -> expiration timestamp
        self.analytics = {}     # short_code -> {'clicks': int, 'timestamps': list}
        self.custom_codes = set()  # track which codes are custom

        # Rate limiting
        self.rate_limit_window = 60  # seconds
        self.rate_limit_max = 10     # max requests per window
        self.request_log = {}        # ip/user -> list of timestamps

        # Load persisted data if exists
        self._load_data()

    #----------------------------------------------------------#
    # Generate unique short codes
    # Base 62 encoding with an incrementing counter
    #----------------------------------------------------------#
    def generate_short_code(self):
        chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        code = ''
        num = self.counter

        while num >= 0:
            code = chars[num % 62] + code
            num = num // 62 - 1
            if num < 0:
                break
        self.counter += 1

        return code or chars[0]

    #----------------------------------------------------------#
    # URL Validation
    #----------------------------------------------------------#
    def shorten(self, original_url, custom_code=None, expires_in_hours=None, user_id='default'):
        # Rate limiting check
        if not self._check_rate_limit(user_id):
            raise ValueError('Rate limit exceeded. Please wait before making more requests.')

        # URL validation
        if not is_valid_url(original_url):
            raise ValueError('Invalid URL format. Must be a valid http/https URL.')

        # Check if URL was already shortened (no duplicates)
        if original_url in self.url_to_short:
            existing_code = self.url_to_short[original_url]
            # Check if existing short URL has expired
            if existing_code in self.expiration:
                if time.time() > self.expiration[existing_code]:
                    # Expired - remove and create new
                    self._remove_url(existing_code)
                else:
                    return self.base_url + existing_code
            else:
                return self.base_url + existing_code

        # Handle custom short code
        if custom_code:
            if custom_code in self.short_to_url:
                raise ValueError(f'Custom code "{custom_code}" is already in use.')
            if len(custom_code) < 3 or len(custom_code) > 20:
                raise ValueError('Custom code must be 3-20 characters.')
            if not custom_code.isalnum():
                raise ValueError('Custom code must be alphanumeric.')
            short_code = custom_code
            self.custom_codes.add(custom_code)
        else:
            short_code = self.generate_short_code()

        # Store in both hashmaps
        self.url_to_short[original_url] = short_code
        self.short_to_url[short_code] = original_url

        # Set expiration if specified
        if expires_in_hours:
            self.expiration[short_code] = time.time() + (expires_in_hours * 3600)

        # Initialize analytics
        self.analytics[short_code] = {'clicks': 0, 'timestamps': []}

        # Persist data
        self._save_data()

        return self.base_url + short_code

    #----------------------------------------------------------#
    # Expand URL with analytics tracking
    #----------------------------------------------------------#
    def expand(self, short_url, track_click=True):
        # Extract short code from URL
        short_code = short_url.replace(self.base_url, '')

        # Check if exists
        if short_code not in self.short_to_url:
            raise ValueError('Short URL not found!')

        # Check expiration
        if short_code in self.expiration:
            if time.time() > self.expiration[short_code]:
                self._remove_url(short_code)
                raise ValueError('Short URL has expired!')

        # Track analytics
        if track_click and short_code in self.analytics:
            self.analytics[short_code]['clicks'] += 1
            self.analytics[short_code]['timestamps'].append(
                datetime.now().isoformat()
            )
            self._save_data()

        return self.short_to_url[short_code]

    #----------------------------------------------------------#
    # Analytics methods
    #----------------------------------------------------------#
    def get_analytics(self, short_code):
        """Get click analytics for a short URL."""
        code = short_code.replace(self.base_url, '')
        if code not in self.analytics:
            raise ValueError('Short URL not found!')

        stats = self.analytics[code]
        return {
            'short_code': code,
            'original_url': self.short_to_url.get(code, 'Unknown'),
            'total_clicks': stats['clicks'],
            'recent_clicks': stats['timestamps'][-10:],  # Last 10 clicks
            'is_custom': code in self.custom_codes,
            'expires': self._format_expiration(code)
        }

    def _format_expiration(self, short_code):
        """Format expiration time for display."""
        if short_code not in self.expiration:
            return 'Never'
        exp_time = self.expiration[short_code]
        if time.time() > exp_time:
            return 'Expired'
        remaining = exp_time - time.time()
        hours = int(remaining // 3600)
        minutes = int((remaining % 3600) // 60)
        return f'{hours}h {minutes}m remaining'

    #----------------------------------------------------------#
    # Rate limiting
    #----------------------------------------------------------#
    def _check_rate_limit(self, user_id):
        """Check if user has exceeded rate limit."""
        now = time.time()

        if user_id not in self.request_log:
            self.request_log[user_id] = []

        # Remove old requests outside the window
        self.request_log[user_id] = [
            t for t in self.request_log[user_id]
            if now - t < self.rate_limit_window
        ]

        # Check if under limit
        if len(self.request_log[user_id]) >= self.rate_limit_max:
            return False

        # Log this request
        self.request_log[user_id].append(now)
        return True

    #----------------------------------------------------------#
    # Data persistence
    #----------------------------------------------------------#
    def _save_data(self):
        """Save all data to JSON file."""
        data = {
            'counter': self.counter,
            'url_to_short': self.url_to_short,
            'short_to_url': self.short_to_url,
            'expiration': self.expiration,
            'analytics': self.analytics,
            'custom_codes': list(self.custom_codes)
        }
        try:
            with open(self.data_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save data: {e}")

    def _load_data(self):
        """Load data from JSON file if it exists."""
        try:
            with open(self.data_file, 'r') as f:
                data = json.load(f)
                self.counter = data.get('counter', 0)
                self.url_to_short = data.get('url_to_short', {})
                self.short_to_url = data.get('short_to_url', {})
                self.expiration = data.get('expiration', {})
                self.analytics = data.get('analytics', {})
                self.custom_codes = set(data.get('custom_codes', []))
        except FileNotFoundError:
            pass  # No saved data yet
        except Exception as e:
            print(f"Warning: Could not load data: {e}")

    def _remove_url(self, short_code):
        """Remove a URL mapping (used for expired URLs)."""
        if short_code in self.short_to_url:
            original_url = self.short_to_url[short_code]
            del self.short_to_url[short_code]
            if original_url in self.url_to_short:
                del self.url_to_short[original_url]
        if short_code in self.expiration:
            del self.expiration[short_code]
        if short_code in self.analytics:
            del self.analytics[short_code]
        if short_code in self.custom_codes:
            self.custom_codes.remove(short_code)
        self._save_data()
