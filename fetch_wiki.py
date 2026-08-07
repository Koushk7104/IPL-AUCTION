import json
import urllib.request
import urllib.parse
import time

def fetch_wiki_images():
    with open('backend/content/players.json', 'r', encoding='utf-8') as f:
        players = json.load(f)
    
    missing_players = [p for p in players if 'ui-avatars.com' in p.get('image', '')]
    
    headers = {
        'User-Agent': 'IPLAuctionBot/1.0 (test@example.com)'
    }
    
    changed = 0
    for p in missing_players:
        name = p['name']
        # Try both the name and "Name (cricketer)"
        titles = [name, f"{name} (cricketer)"]
        found = False
        
        for title in titles:
            if found: break
            
            url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=pageimages&format=json&pithumbsize=500"
            req = urllib.request.Request(url, headers=headers)
            try:
                with urllib.request.urlopen(req) as response:
                    data = json.loads(response.read().decode())
                    pages = data['query']['pages']
                    for page_id in pages:
                        if page_id != "-1" and 'thumbnail' in pages[page_id]:
                            img_url = pages[page_id]['thumbnail']['source']
                            p['image'] = img_url
                            print(f"Found for {name}: {img_url}")
                            found = True
                            changed += 1
                            break
            except Exception as e:
                print(f"Error for {title}: {e}")
            time.sleep(0.5)
            
        if not found:
            print(f"Not found on Wikipedia: {name}")

    if changed > 0:
        with open('backend/content/players.json', 'w', encoding='utf-8') as f:
            json.dump(players, f, indent=2)
        print(f"Updated {changed} players.")
    else:
        print("No new images found via Wikipedia.")

if __name__ == "__main__":
    fetch_wiki_images()
