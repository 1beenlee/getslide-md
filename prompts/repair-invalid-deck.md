# Prompt: repair an invalid standalone deck

~~~txt
INPUTS: generated HTML deck; validate-deck.mjs output; HTML_DECK_CONTRACT.md; base-onefile-deck.html; approved DECK_BRIEF.md.

Repair only the identified validation or contract failures. Preserve every supported content claim, design token, valid slide ID, and valid structural convention unless it directly causes a failure. Do not broadly redesign or rewrite the deck. Do not add claims, features, metrics, team roles, or missing data.

Remove unresolved placeholders and private/internal traces. Restore dynamic navigation, dynamic page numbers, print CSS, and keyboard navigation only if they are missing or broken. Use unique kebab-case data-slide-id values and documented patterns. Return one complete corrected HTML file in one code block. After it, list every structural change and any issue that cannot be repaired safely.
~~~
