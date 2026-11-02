# WordleIt dictionary

Derived from **Morph-it! 0.4.8**, Copyright © 2004–2009 **Marco Baroni and Eros Zanchetta**.

Source: https://docs.sslmit.unibo.it/doku.php?id=resources:morph-it

Archive: https://docs.sslmit.unibo.it/lib/exe/fetch.php?media=resources:morph-it.tgz

The generated word list in `src/lib/wordleit/dictionary.ts` is distributed under **Creative Commons Attribution-ShareAlike 2.0**: https://creativecommons.org/licenses/by-sa/2.0/

Full license: https://creativecommons.org/licenses/by-sa/2.0/legalcode

Original authorship and license notices: [morph-it-readme.txt](./morph-it-readme.txt).

Changes: retain five-letter lowercase ASCII forms; exclude proper nouns and abbreviations; uppercase, deduplicate and sort. Accents are not stripped. The separate curated answer list is unchanged. Morph-it! includes inflected forms and conjugations; gaps and uncommon forms are possible.

Regenerate with `python3 scripts/update-wordleit-dictionary.py` (requires Python 3 and curl). The upstream archive is verified with a pinned SHA-256 checksum.
