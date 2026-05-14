# Thoughts import correction rules

Regenerate markdown thoughts from the assigned raw chunk only.

## Output
- RU file: `content/thoughts/ru/<slug>.md`
- EN file: `content/thoughts/en/<same-slug>.md`
- One RU and one EN file per raw entry.
- Matching slug filenames across RU/EN.
- Frontmatter fields only:
  - `id`
  - `date`
  - `tags`
  - `sourceIndex`
- Body starts with H1 title, then text.
- Remove raw `#мысль` markers and raw date lines from body.
- Do not edit app code. Do not commit.

## Names
- Preserve public names / public authors / public figures / known theorists / surnames that clearly refer to public people or concepts. Examples: Дюран, Фрейд, Лихачев, Kafka, etc.
- Do not replace public names with generic phrases like “один автор”.
- Private/personal first names should be shortened to a single initial with a dot in RU, and a Latin initial with a dot in EN.
  - Таня -> Т. / T.
  - Катя -> К. / K.
  - Юля -> Ю. / Y.
  - Оля -> О. / O.
- If unsure whether a person is public, preserve surname/title; shorten only obvious private first names.

## Language
- RU: preserve the original thought meaning and important wording; light cleanup is OK.
- EN: natural full translation of the corrected RU thought.

## Dates
- One date only in frontmatter.
- Use `YYYY-MM-DD` if day is explicit, otherwise `YYYY-MM`.
- Infer from raw date line or neighboring entries if absent.

## Tags
Use ONLY this fixed taxonomy. Pick 1–3 tags per thought.
RU tags for RU files; EN tags for EN files.

| EN | RU |
| --- | --- |
| society | общество |
| ethics | этика |
| communication | коммуникация |
| relationships | отношения |
| psychology | психология |
| economics | экономика |
| education | образование |
| future | будущее |
| culture | культура |
| technology | технологии |
| politics | политика |
| management | управление |
| history | история |
| art | искусство |
| philosophy | философия |
| work | работа |
| science | наука |
| business | бизнес |
