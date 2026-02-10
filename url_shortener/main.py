from shortener import URLShortener

def main():
    shortener = URLShortener()
    print("Welcome to URL Shortener!")
    print("Data will be saved to url_data.json")

    while True:
        print('\n' + '='*40)
        print('1. Shorten URL')
        print('2. Shorten URL (with options)')
        print('3. Expand URL')
        print('4. List all URLs')
        print('5. View analytics')
        print('6. Exit')
        print('='*40)

        choice = input('Choose an option: ')

        if choice == '1':
            url = input("\nEnter a URL to shorten: ")
            try:
                result = shortener.shorten(url)
                print(f"\nShortened: {result}")
            except ValueError as e:
                print(f"\nError: {e}")

        elif choice == '2':
            url = input("\nEnter a URL to shorten: ")

            custom = input("Custom short code (or press Enter to auto-generate): ").strip()
            custom_code = custom if custom else None

            exp = input("Expiration in hours (or press Enter for never): ").strip()
            expires = int(exp) if exp.isdigit() else None

            try:
                result = shortener.shorten(url, custom_code=custom_code, expires_in_hours=expires)
                print(f"\nShortened: {result}")
                if expires:
                    print(f"Expires in: {expires} hours")
            except ValueError as e:
                print(f"\nError: {e}")

        elif choice == '3':
            url = input("\nEnter short URL to expand: ")
            try:
                result = shortener.expand(url)
                print(f"\nOriginal: {result}")
            except ValueError as e:
                print(f"\nError: {e}")

        elif choice == '4':
            if not shortener.url_to_short:
                print("\nNo URLs stored yet!")
            else:
                print(f"\n{'Original URL':<50} {'Short URL':<30} {'Clicks':<10}")
                print('-' * 90)
                for original_url, short_code in shortener.url_to_short.items():
                    clicks = shortener.analytics.get(short_code, {}).get('clicks', 0)
                    short_url = shortener.base_url + short_code
                    # Truncate long URLs for display
                    display_url = original_url[:47] + '...' if len(original_url) > 50 else original_url
                    print(f"{display_url:<50} {short_url:<30} {clicks:<10}")

        elif choice == '5':
            code = input("\nEnter short URL or code to view analytics: ")
            try:
                stats = shortener.get_analytics(code)
                print(f"\n{'='*40}")
                print(f"Analytics for: {stats['short_code']}")
                print(f"{'='*40}")
                print(f"Original URL: {stats['original_url']}")
                print(f"Total clicks: {stats['total_clicks']}")
                print(f"Custom code: {'Yes' if stats['is_custom'] else 'No'}")
                print(f"Expiration: {stats['expires']}")
                if stats['recent_clicks']:
                    print(f"\nRecent clicks:")
                    for ts in stats['recent_clicks']:
                        print(f"  - {ts}")
            except ValueError as e:
                print(f"\nError: {e}")

        elif choice == '6':
            print("\nGoodbye!")
            break

        else:
            print("\nInvalid option. Please choose 1-6.")

if __name__ == "__main__":
    main()
