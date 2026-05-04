
import os

path = r'c:\Users\Ritesh\Downloads\anigo - Copy\package.json'
if os.path.exists(path):
    with open(path, 'rb') as f:
        content = f.read()
        print(f"File Size: {len(content)}")
        print(f"First 10 bytes: {content[:10]}")
        try:
            text = content.decode('utf-8')
            print(f"Decoded successfully. First char: {repr(text[0])}")
        except Exception as e:
            print(f"Decode error: {e}")
else:
    print("File not found.")
