class URLShortener:
    def __init__(self, base_url = 'http://short.url/'):

        # creating a hashmap for shortening/elongating urls
        self.url_to_short = {}
        self.short_to_url = {}

        self.base_url = base_url

        self.counter = 0 #Generating unique codes

    #----------------------------------------------------------#
    # Generate unique short codes
    # Base 62 encoding with an incrementing counter
    # Random string generation with collision checking
    # Hash of the URL (first 6-8 chars)
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
    
    def shorten(self, original_url):

        #check to see if url was already shortened (no duplicates)
        if original_url in self.url_to_short:
            return self.base_url + self.url_to_short[original_url]
        
        # Generate a new short code
        short_code = self.generate_short_code()

        # Store in both hashmaps
        self.url_to_short[original_url] = short_code
        self.short_to_url[short_code] = original_url

        return self.base_url + short_code
    
    def expand(self, short_url):
        
        # Extract short code from URL
        short_code = short_url.replace(self.base_url, '')

        # O(1) lookup within the hashmaps
        if short_code in self.short_to_url:
            return self.short_to_url[short_code]
        

        raise ValueError('Short URL not found!')