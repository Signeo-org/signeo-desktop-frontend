# This code downloads a large word list from a public GitHub repository,
# approximately 500k words, filters it to include only alphabetic words,

import urllib.request

URL = "https://raw.githubusercontent.com/nlile/dictionary-word-list/master/largest_possible_aspell_wordlist_without_diacritic.txt"
OUT = "words.txt"

with urllib.request.urlopen(URL) as r:
    data = r.read().decode("utf-8")

# filter to letters only, lowercase, one per line
words = set()
for w in data.splitlines():
    w = w.strip()
    if w.isalpha():
        words.add(w.lower())

with open(OUT, "w", encoding="utf-8") as f:
    for w in sorted(words):
        f.write(w + "\n")
print(len(words))
