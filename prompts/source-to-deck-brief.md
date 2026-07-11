# Prompt: source Markdown to DECK_BRIEF.md

Attach one README or Markdown source and docs/DECK_BRIEF.schema.md, then paste:

~~~txt
Create one complete DECK_BRIEF.md with a YAML frontmatter block that conforms to the supplied schema.

This milestone supports only recommended_direction: developer-demo. Preserve the source language by default; Korean, English, and mixed-language sources are valid. Use source-supported wording in key_points. Do not invent users, revenue, accuracy, performance, adoption, research results, team roles, features, architecture, or implementation details. Never replace missing quantitative evidence with a number.

Use missing_information for unavailable evidence. Use auto_filled_assumptions only for visible, low-risk framing defaults. If the source gives no audience, default to a university student-developer demo audience and record that exact choice as an assumption. Recommend approximately 5–8 slides unless the source supports fewer or more; record the target. Include all supported links in required_links.

Set confidence to high only when the goal, core story, audience/context, and key points are well supported; medium when reviewable gaps remain; low when the source is thin or ambiguous. Use source_materials to describe the supplied source without copying private contents.

Return only the complete DECK_BRIEF.md. Do not add prose before or after it.
~~~
