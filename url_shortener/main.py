from shortener import URLShortener

def main():
    shortener = URLShortener()

    while True:
        print('\n1. shorten URL')
        print('2. expand URL')
        print('3. list all URLS')
        print('4. exit')

        choice = input('Choose an option: 4'
        '')

        if choice == '1':
            url = input("\n\nEnter a URL that you would like to shorten: ")
            result = shortener.shorten(url)
            print(f"Shortened: {result}")
        
        if choice == '2':
            url = input("\n\nEnter a short URL to expand: ")
            result = shortener.expand(url)
            print(f"Original: {result}")

        if choice == '3':
            if not shortener.url_to_short:
                print("\n\nNo URLs store yet!")
            else:
                for original_url, short_code in shortener.url_to_short.items():
                    print(f"{original_url} -> {shortener.base_url}{short_code}")

        if choice == '4':
            break

if __name__ == "__main__":
    main()