# Prompt: source Markdown to DECK_BRIEF.md

Attach one README or Markdown source and docs/DECK_BRIEF.schema.md, then paste:

~~~txt
Create one complete DECK_BRIEF.md with a YAML frontmatter block that conforms to the supplied schema.

This milestone supports only recommended_direction: developer-demo. Preserve the source language by default; Korean, English, and mixed-language sources are valid. Use source-supported wording in key_points. Do not invent users, revenue, accuracy, performance, adoption, research results, team roles, features, architecture, or implementation details. Never replace missing quantitative evidence with a number.

Preserve material source qualifiers instead of polishing them away. If the source says a project is sunset, archived, deprecated, historical, experimental, no longer maintained, or otherwise limited, keep that status visible in the brief when it changes how the audience should understand the project. Preserve quantitative qualifiers such as "about", "approximately", "under", "up to", or source-attributed estimates; do not strengthen them into exact values, guarantees, or independently verified claims.

Use missing_information for unavailable evidence. Use auto_filled_assumptions only for visible, low-risk framing defaults. If the source gives no audience, default to a university student-developer demo audience and record that exact choice as an assumption. Recommend approximately 5–8 slides unless the source supports fewer or more; record the target.

For required_links, include only presentation-essential links that should actually be visible in the deck — typically the project/repository, live demo, portfolio/contact, or another link required by the presentation goal. Do NOT put every URL from the source into required_links. Setup/install URLs, dependency documentation, developer portals, issue/contribution links, and other reference URLs stay out unless the presentation specifically needs them.

This workflow receives source text/Markdown, not referenced image files. A Markdown/HTML image reference or relative image path is evidence that the source mentions an image; it is NOT evidence that the image asset is available to the deck generator. Do not put such an image into required_images as though it were supplied. If a referenced screenshot/diagram is important to the presentation but the actual image file was not separately supplied, record that unavailable asset in missing_information. Never invent, fetch, or hotlink an image to fill the gap.

Set confidence to high only when the goal, core story, audience/context, and key points are well supported; medium when reviewable gaps remain; low when the source is thin or ambiguous. Use source_materials to describe the supplied source without copying private contents.

Return only the complete DECK_BRIEF.md. Do not add prose before or after it.
~~~
