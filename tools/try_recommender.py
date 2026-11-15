"""Try the CineCompass recommender in the terminal, using the two CSV files from Colab.

It does what the PHP API will do later, so you can see the app's lists before building it.
It only reads items_seed.csv and item_neighbors.csv. It needs plain Python 3.8+ and nothing else.

Run from the project folder:
    python tools/try_recommender.py                                  # interactive
    python tools/try_recommender.py --like "Casino" --like "Interstellar"
    python tools/try_recommender.py --check                          # check the CSV files
    python tools/try_recommender.py --data some/other/folder         # CSV files somewhere else
"""
import argparse
import csv
import difflib
import re
import sys
from collections import defaultdict
from pathlib import Path

TOP = 10          # picks in "Picked for you"
ROW = 5           # movies per "More like" or "More from" row
FULL_PICKS_AT = 5  # from this many likes on, show "Picked for you" instead of "More like" rows
RECENT_DECAY = 0.9  # older likes count less: newest 1, then 0.9, 0.81... Replace with the notebook's best_decay


# ---------------------------------------------------------------- loading

def load(folder):
    items = {}
    with open(folder / "items_seed.csv", encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            items[row["imdb_id"]] = row
    # links[method][movie] = [(neighbour, score), ...], highest score first
    links = defaultdict(lambda: defaultdict(list))
    with open(folder / "item_neighbors.csv", encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            links[row["method"]][row["imdb_id"]].append((row["neighbor_imdb_id"], float(row["score"])))
    for by_movie in links.values():
        for neighbours in by_movie.values():
            neighbours.sort(key=lambda pair: -pair[1])
    return items, links


def name(items, imdb_id):
    row = items.get(imdb_id)
    if not row:
        return imdb_id
    return f'{row["title"]} ({row["year"]})' if row["year"] else row["title"]


# ---------------------------------------------------------------- searching

def search(items, text, limit=8):
    """Find movies by part of the title. 'casino 1995' also filters by year."""
    text = text.strip().lower()
    year = None
    m = re.match(r"^(.*?)\s+(\d{4})$", text)
    if m:
        text, year = m.group(1), m.group(2)
    hits = [i for i, r in items.items() if text in r["title"].lower() and (not year or r["year"] == year)]
    if not hits:
        by_title = {r["title"].lower(): i for i, r in items.items()}
        hits = [by_title[t] for t in difflib.get_close_matches(text, list(by_title), n=limit, cutoff=0.6)]
    hits.sort(key=lambda i: (items[i]["title"].lower() != text,
                             not items[i]["title"].lower().startswith(text),
                             len(items[i]["title"])))
    return hits[:limit]


# ---------------------------------------------------------------- recommending

def popular(items, seen=(), genre=None, n=ROW):
    """Most-liked movies, optionally in one genre. Empty if the file has no popularity column."""
    if "popularity" not in next(iter(items.values())):
        return []
    films = [i for i, r in items.items() if i not in seen and (not genre or genre.lower() in r["genres"].lower())]
    return sorted(films, key=lambda i: -int(items[i]["popularity"]))[:n]


def recommend(items, links, liked, disliked, decay=RECENT_DECAY):
    """liked must be in the order the user liked them, oldest first."""
    seen = set(liked) | set(disliked)
    out = {}

    # The model: add up the EASE scores from every liked movie, with older likes counting less.
    total, reason = defaultdict(float), {}
    for k, m in enumerate(liked):
        weight = decay ** (len(liked) - 1 - k)
        for n, s in links["ease"].get(m, []):
            if n in seen:
                continue
            total[n] += s * weight
            if s * weight > reason.get(n, (None, -1.0))[1]:
                reason[n] = (m, s * weight)
    out["picks"] = [(n, total[n], reason[n][0]) for n in sorted(total, key=lambda n: -total[n])[:TOP]]
    out["more_like"] = [(m, [n for n, _ in links["ease"].get(m, []) if n not in seen][:ROW]) for m in liked]

    # Rule: the next films in each liked movie's series, nearest first.
    series, added = [], set()
    for m in liked:
        for n, s in links["next_in_series"].get(m, []):
            if n not in seen and n not in added:
                series.append((n, s, m))
                added.add(n)
    out["series"] = sorted(series, key=lambda x: -x[1])

    # Rule: other films by the directors of liked movies, best-known first.
    by_director = {}
    for m in liked:
        director = items.get(m, {}).get("director", "")
        if not director:
            continue
        films = by_director.setdefault(director.replace("|", " and "), [])
        for n, _ in links["same_director"].get(m, []):
            if n not in seen and n not in films:
                films.append(n)
    out["directors"] = {d: f[:ROW] for d, f in by_director.items() if f}
    return out


def show(items, links, liked, disliked, decay):
    if not liked:
        top = popular(items, set(disliked), n=TOP)
        if top:
            print("\nPopular movies  [popularity]")
            print("  " + ", ".join(name(items, n) for n in top))
        print("\nLike a movie first: type part of its title.")
        return
    r = recommend(items, links, liked, disliked, decay)
    print("\nYou liked (oldest first): " + ", ".join(name(items, m) for m in liked))
    if disliked:
        print("You didn't like: " + ", ".join(name(items, m) for m in disliked))

    if len(liked) < FULL_PICKS_AT:
        for m, films in r["more_like"]:
            print(f"\nMore like {name(items, m)}  [model]")
            print("  " + (", ".join(name(items, n) for n in films) or "nothing new"))
        top = popular(items, set(liked) | set(disliked))
        if top:
            print("\nPopular movies you haven't rated  [popularity]")
            print("  " + ", ".join(name(items, n) for n in top))
    else:
        print("\nPicked for you  [model" + (f", recent likes count more: decay {decay}]" if decay < 1 else "]"))
        for k, (n, score, because) in enumerate(r["picks"], 1):
            print(f"  {k:>2}. {name(items, n):<45} because you liked {items[because]['title']}  ({score:.3f})")

    if r["series"]:
        print("\nContinue the series  [rule]")
        for n, s, after in r["series"]:
            step = "next" if s >= 1 else f"{round(1 / s)} films"
            print(f"  - {name(items, n)}  ({step} after {items[after]['title']})")
    for director, films in r["directors"].items():
        print(f"\nMore from {director}  [rule]")
        print("  " + ", ".join(name(items, n) for n in films))


# ---------------------------------------------------------------- checking the files

def check(items, links):
    problems = 0

    def result(ok, text):
        nonlocal problems
        problems += not ok
        print(("PASS  " if ok else "FAIL  ") + text)

    cols = list(next(iter(items.values())).keys())
    base = ["imdb_id", "title", "year", "genres", "director", "series"]
    result(cols in (base, base + ["popularity"]), f"items_seed.csv columns: {cols}")
    if "popularity" in cols:
        result(all(r["popularity"].isdigit() for r in items.values()), "every popularity is a whole number")
    else:
        print("      no popularity column yet: rerun the notebook to add it")
    result(all(re.fullmatch(r"tt\d{7,}", i) for i in items), f"{len(items):,} movies, every ID looks like tt1234567")
    counts = {m: sum(len(v) for v in by.values()) for m, by in links.items()}
    print(f"      rows per method: {counts}")
    result({"ease", "next_in_series", "same_director"} <= set(links), "all three methods are present")
    per_movie = [len(v) for v in links["ease"].values()]
    result(len(links["ease"]) == len(items) and min(per_movie) == max(per_movie) == 50,
           f"every movie has 50 model neighbours ({len(links['ease']):,} movies)")
    unknown = sum(n not in items for by in links.values() for m, v in by.items() for n, _ in v)
    unknown += sum(m not in items for by in links.values() for m in by)
    result(unknown == 0, f"every ID in item_neighbors.csv is in items_seed.csv ({unknown} unknown)")
    self_links = sum(n == m for by in links.values() for m, v in by.items() for n, _ in v)
    result(self_links == 0, f"no movie is linked to itself ({self_links})")
    dupes = sum(len(v) - len({n for n, _ in v}) for by in links.values() for v in by.values())
    result(dupes == 0, f"no duplicate links ({dupes})")
    year = {i: r["year"] for i, r in items.items()}
    backwards = [(m, n) for m, v in links["next_in_series"].items() for n, _ in v
                 if year.get(m) and year.get(n) and year[n] < year[m]]
    result(not backwards, f"no sequel comes out before the film it follows ({len(backwards)})")

    print(f"\n      movies with a director: {sum(bool(r['director']) for r in items.values()):,}")
    print(f"      movies in a series: {sum(bool(r['series']) for r in items.values()):,}")
    lists = sum("list of" in r["series"].lower() for r in items.values())
    print(f"      series names that are really Wikipedia lists (e.g. 'list of Pixar films'): {lists}")

    stop = {"the", "a", "an", "of", "and", "part", "in", "to", "ii", "iii", "2", "3", "4", "movie"}
    def words(i):
        return set(re.findall(r"[a-z0-9]+", items.get(i, {}).get("title", "").lower())) - stop
    odd = [(m, n) for m, v in links["next_in_series"].items() for n, s in v if s >= 1 and not words(m) & words(n)]
    print(f"      'next film' links whose titles share no word (worth a look): {len(odd)}")
    for m, n in odd[:8]:
        print(f"        {name(items, m)} -> {name(items, n)}")
    print(f"\n{'No problems found.' if problems == 0 else f'{problems} check(s) failed.'}")
    return problems


# ---------------------------------------------------------------- terminal

HELP = """Type part of a movie title to like it (add a year if needed: casino 1995).
  -title    you watched it but didn't like it
  popular   the most-liked movies, like the onboarding grid (also: popular comedy)
  list      show your likes and dislikes
  remove N  remove item N from the list
  clear     start again
  recs      show recommendations again
  quit      leave"""


def pick(items, text):
    hits = search(items, text)
    if not hits:
        print("  No movie found. It may not be in the model (it needs 200+ ratings and a release before 2024).")
        return None
    if len(hits) == 1 or items[hits[0]]["title"].lower() == text.strip().lower():
        return hits[0]
    for k, i in enumerate(hits, 1):
        print(f"  {k}. {name(items, i)}")
    choice = input("  Pick a number (Enter to cancel): ").strip()
    return hits[int(choice) - 1] if choice.isdigit() and 1 <= int(choice) <= len(hits) else None


def interactive(items, links, decay):
    liked, disliked = [], []
    print(f"CineCompass recommender: {len(items):,} movies loaded.\n{HELP}")
    while True:
        try:
            cmd = input("\n> ").strip()
        except (EOFError, KeyboardInterrupt):
            break
        low = cmd.lower()
        if not cmd:
            continue
        if low in ("quit", "exit", "q"):
            break
        if low == "help":
            print(HELP)
        elif low == "list":
            entries = [("liked", m) for m in liked] + [("didn't like", m) for m in disliked]
            for k, (kind, m) in enumerate(entries, 1):
                print(f"  {k}. {name(items, m)}  ({kind})")
            if not entries:
                print("  Nothing yet.")
        elif low.startswith("remove "):
            entries = liked + disliked
            n = low.split()[1]
            if n.isdigit() and 1 <= int(n) <= len(entries):
                m = entries[int(n) - 1]
                (liked if m in liked else disliked).remove(m)
                show(items, links, liked, disliked, decay)
        elif low == "clear":
            liked, disliked = [], []
            print("  Cleared.")
        elif low == "recs":
            show(items, links, liked, disliked, decay)
        elif low == "popular" or low.startswith("popular "):
            genre = low[len("popular"):].strip() or None
            top = popular(items, set(liked) | set(disliked), genre, n=TOP)
            if top:
                print(f"\nPopular{' ' + genre if genre else ''} movies  [popularity]")
                for k, n in enumerate(top, 1):
                    print(f"  {k:>2}. {name(items, n)}")
            else:
                print("  No popularity column in items_seed.csv yet (rerun the notebook), or no movies in that genre.")
        else:
            dislike = cmd.startswith("-")
            m = pick(items, cmd[1:] if dislike else cmd)
            if m and m not in liked + disliked:
                (disliked if dislike else liked).append(m)
                print(f"  {'Disliked' if dislike else 'Liked'}: {name(items, m)}")
                show(items, links, liked, disliked, decay)


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    p = argparse.ArgumentParser(description="Try the CineCompass recommender in the terminal.")
    p.add_argument("--data", type=Path, default=Path(__file__).resolve().parent.parent,
                   help="folder with items_seed.csv and item_neighbors.csv (default: the project folder)")
    p.add_argument("--like", action="append", default=[], help="a movie you liked (repeat for more)")
    p.add_argument("--dislike", action="append", default=[], help="a movie you didn't like (repeat for more)")
    p.add_argument("--check", action="store_true", help="check the two CSV files and exit")
    p.add_argument("--decay", type=float, default=RECENT_DECAY,
                   help=f"how much less each older like counts (1 = all equal, default {RECENT_DECAY})")
    args = p.parse_args()
    decay = args.decay
    items, links = load(args.data)
    if args.check:
        sys.exit(1 if check(items, links) else 0)
    if args.like or args.dislike:
        liked = [h[0] for h in (search(items, t) for t in args.like) if h]
        disliked = [h[0] for h in (search(items, t) for t in args.dislike) if h]
        show(items, links, liked, disliked, decay)
        return
    interactive(items, links, decay)


if __name__ == "__main__":
    main()
