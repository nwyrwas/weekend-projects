import pytest
import os
import sys
import time

# Add parent directory to path so we can import shortener
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shortener import URLShortener
from utils import is_valid_url


class TestURLValidation:
    """Tests for URL validation utility."""

    def test_valid_http_url(self):
        assert is_valid_url('http://example.com') == True

    def test_valid_https_url(self):
        assert is_valid_url('https://example.com') == True

    def test_valid_url_with_path(self):
        assert is_valid_url('https://example.com/path/to/page') == True

    def test_invalid_url_no_scheme(self):
        assert is_valid_url('example.com') == False

    def test_invalid_url_bad_scheme(self):
        assert is_valid_url('ftp://example.com') == False

    def test_invalid_url_empty(self):
        assert is_valid_url('') == False

    def test_invalid_url_random_string(self):
        assert is_valid_url('not a url at all') == False


class TestURLShortener:
    """Tests for core URLShortener functionality."""

    @pytest.fixture
    def shortener(self, tmp_path):
        """Create a shortener with a temp data file."""
        data_file = tmp_path / "test_data.json"
        return URLShortener(data_file=str(data_file))

    def test_shorten_valid_url(self, shortener):
        result = shortener.shorten('https://example.com')
        assert result.startswith(shortener.base_url)

    def test_shorten_returns_unique_codes(self, shortener):
        url1 = shortener.shorten('https://example1.com')
        url2 = shortener.shorten('https://example2.com')
        assert url1 != url2

    def test_shorten_duplicate_returns_same(self, shortener):
        url1 = shortener.shorten('https://example.com')
        url2 = shortener.shorten('https://example.com')
        assert url1 == url2

    def test_shorten_invalid_url_raises(self, shortener):
        with pytest.raises(ValueError, match='Invalid URL'):
            shortener.shorten('not-a-valid-url')

    def test_expand_returns_original(self, shortener):
        original = 'https://example.com'
        short = shortener.shorten(original)
        result = shortener.expand(short)
        assert result == original

    def test_expand_invalid_code_raises(self, shortener):
        with pytest.raises(ValueError, match='not found'):
            shortener.expand('http://short.url/nonexistent')

    def test_expand_tracks_clicks(self, shortener):
        short = shortener.shorten('https://example.com')
        short_code = short.replace(shortener.base_url, '')

        assert shortener.analytics[short_code]['clicks'] == 0
        shortener.expand(short)
        assert shortener.analytics[short_code]['clicks'] == 1
        shortener.expand(short)
        assert shortener.analytics[short_code]['clicks'] == 2


class TestCustomCodes:
    """Tests for custom short code feature."""

    @pytest.fixture
    def shortener(self, tmp_path):
        data_file = tmp_path / "test_data.json"
        return URLShortener(data_file=str(data_file))

    def test_custom_code_works(self, shortener):
        result = shortener.shorten('https://example.com', custom_code='mycode')
        assert result == shortener.base_url + 'mycode'

    def test_custom_code_duplicate_raises(self, shortener):
        shortener.shorten('https://example1.com', custom_code='taken')
        with pytest.raises(ValueError, match='already in use'):
            shortener.shorten('https://example2.com', custom_code='taken')

    def test_custom_code_too_short_raises(self, shortener):
        with pytest.raises(ValueError, match='3-20 characters'):
            shortener.shorten('https://example.com', custom_code='ab')

    def test_custom_code_too_long_raises(self, shortener):
        with pytest.raises(ValueError, match='3-20 characters'):
            shortener.shorten('https://example.com', custom_code='a' * 21)

    def test_custom_code_non_alphanumeric_raises(self, shortener):
        with pytest.raises(ValueError, match='alphanumeric'):
            shortener.shorten('https://example.com', custom_code='my-code!')


class TestExpiration:
    """Tests for URL expiration feature."""

    @pytest.fixture
    def shortener(self, tmp_path):
        data_file = tmp_path / "test_data.json"
        return URLShortener(data_file=str(data_file))

    def test_expiration_is_set(self, shortener):
        short = shortener.shorten('https://example.com', expires_in_hours=1)
        short_code = short.replace(shortener.base_url, '')
        assert short_code in shortener.expiration

    def test_no_expiration_by_default(self, shortener):
        short = shortener.shorten('https://example.com')
        short_code = short.replace(shortener.base_url, '')
        assert short_code not in shortener.expiration


class TestAnalytics:
    """Tests for analytics feature."""

    @pytest.fixture
    def shortener(self, tmp_path):
        data_file = tmp_path / "test_data.json"
        return URLShortener(data_file=str(data_file))

    def test_get_analytics(self, shortener):
        short = shortener.shorten('https://example.com', custom_code='test123')
        shortener.expand(short)

        stats = shortener.get_analytics('test123')
        assert stats['total_clicks'] == 1
        assert stats['original_url'] == 'https://example.com'
        assert stats['is_custom'] == True

    def test_analytics_not_found_raises(self, shortener):
        with pytest.raises(ValueError, match='not found'):
            shortener.get_analytics('nonexistent')


class TestPersistence:
    """Tests for data persistence."""

    def test_data_persists(self, tmp_path):
        data_file = tmp_path / "test_data.json"

        # Create shortener and add URL
        shortener1 = URLShortener(data_file=str(data_file))
        short = shortener1.shorten('https://example.com')

        # Create new shortener with same file
        shortener2 = URLShortener(data_file=str(data_file))

        # Should be able to expand the URL
        result = shortener2.expand(short)
        assert result == 'https://example.com'

    def test_counter_persists(self, tmp_path):
        data_file = tmp_path / "test_data.json"

        shortener1 = URLShortener(data_file=str(data_file))
        shortener1.shorten('https://example1.com')
        shortener1.shorten('https://example2.com')
        counter_after = shortener1.counter

        shortener2 = URLShortener(data_file=str(data_file))
        assert shortener2.counter == counter_after


class TestRateLimiting:
    """Tests for rate limiting feature."""

    @pytest.fixture
    def shortener(self, tmp_path):
        data_file = tmp_path / "test_data.json"
        s = URLShortener(data_file=str(data_file))
        s.rate_limit_max = 3  # Lower limit for testing
        s.rate_limit_window = 60
        return s

    def test_rate_limit_allows_under_limit(self, shortener):
        # Should allow 3 requests
        shortener.shorten('https://example1.com', user_id='testuser')
        shortener.shorten('https://example2.com', user_id='testuser')
        shortener.shorten('https://example3.com', user_id='testuser')

    def test_rate_limit_blocks_over_limit(self, shortener):
        shortener.shorten('https://example1.com', user_id='testuser')
        shortener.shorten('https://example2.com', user_id='testuser')
        shortener.shorten('https://example3.com', user_id='testuser')

        with pytest.raises(ValueError, match='Rate limit exceeded'):
            shortener.shorten('https://example4.com', user_id='testuser')

    def test_rate_limit_separate_users(self, shortener):
        # User1 hits limit
        shortener.shorten('https://example1.com', user_id='user1')
        shortener.shorten('https://example2.com', user_id='user1')
        shortener.shorten('https://example3.com', user_id='user1')

        # User2 should still work
        result = shortener.shorten('https://example4.com', user_id='user2')
        assert result is not None
