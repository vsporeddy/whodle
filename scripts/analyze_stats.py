import json
from collections import Counter, defaultdict

INPUT_FILE = './public/final_game_data.json' 

CHANNEL_MAP = {
    454492770682404877: "general",
    538641451211292673: "cowboy-thoughts",
    1077821285566001252: "stream-archive",
    1318834323163447337: "antisocial-book-club",
    1063742740766134322: "jelley-events",
    902348468302020628: "🚜-tractor-hands",
    924833852030062694: "tft-containment",
    827391154655461376: "valorant",
    933087762557579365: "arom-stats",
    1114109093171437648: "mlee-pocket-ride",
    1311195432545812491: "phrecia-enjoyers",
    1345227643406123101: "ptcgp",
    648376150447357962: "howdy-chat",
    822283830396059650: "sussy-hours",
    827401801383936041: "frick-rankings",
    922674739892338728: "weeb-zone",
    833083167081758801: "game-recs",
    1151786645536903309: "defendant-donald",
    1299504661585203292: "t",
    941068107009650738: "lost-ark"
}

def main():
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: Could not find {INPUT_FILE}")
        return

    users = data.get('users', {})
    messages = data.get('messages', [])
    
    # --- USER STATS ---
    user_counts = Counter(msg['author_id'] for msg in messages)
    sorted_users = user_counts.most_common()

    print("\n" + "="*70)
    print(f"{'RANK':<6} {'USER (Nickname)':<35} {'MSGS':<8} {'% TOTAL'}")
    print("="*70)
    for i, (uid, count) in enumerate(sorted_users, 1):
        user = users.get(uid, {})
        name = user.get('nickname', f"Unknown({uid})")
        percent = (count / len(messages)) * 100
        print(f"{i:<6} {name[:34]:<35} {count:<8} {percent:.1f}%")

    # --- CHANNEL STATS ---
    chan_word_counts = defaultdict(int)
    chan_msg_counts = defaultdict(int)

    for msg in messages:
        if msg['type'] == 'text':
            cid = int(msg.get('channel_id', 0))
            word_count = len(msg['content'].split())
            chan_word_counts[cid] += word_count
            chan_msg_counts[cid] += 1

    channel_stats = []
    for cid in chan_msg_counts:
        avg = chan_word_counts[cid] / chan_msg_counts[cid]
        channel_stats.append((cid, avg, chan_msg_counts[cid]))

    channel_stats.sort(key=lambda x: x[2], reverse=True)

    print("\n" + "="*70)
    print(f"{'RANK':<6} {'CHANNEL NAME':<35} {'AVG WORDS':<12} {'MSGS'}")
    print("="*70)
    for i, (cid, avg, count) in enumerate(channel_stats, 1):
        cname = CHANNEL_MAP.get(cid, f"ID: {cid}")
        print(f"{i:<6} {cname[:34]:<35} {avg:<12.2f} {count}")

    print("="*70)
    print(f"Total Messages Analyzed: {len(messages)}")

if __name__ == "__main__":
    main()