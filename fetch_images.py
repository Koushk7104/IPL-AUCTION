import json
from duckduckgo_search import DDGS
import time

def fetch_images():
    with open('backend/content/players.json', 'r', encoding='utf-8') as f:
        players = json.load(f)
    
    missing_players = [p for p in players if 'ui-avatars.com' in p.get('image', '')]
    
    with DDGS() as ddgs:
        for p in missing_players:
            query = f"{p['name']} cricketer ipl"
            print(f"Searching for {query}...")
            try:
                results = list(ddgs.images(query, max_results=1))
                if results:
                    p['image'] = results[0]['image']
                    print(f"Found: {p['image']}")
                else:
                    print("Not found")
            except Exception as e:
                print(f"Error searching {p['name']}: {e}")
            time.sleep(1) # Be nice to the API
            
    with open('backend/content/players.json', 'w', encoding='utf-8') as f:
        json.dump(players, f, indent=2)

if __name__ == "__main__":
    fetch_images()
