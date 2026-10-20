/**
 * Small dependency-free fuzzy search for table rows.
 *
 * A query is split into whitespace-separated tokens; a row matches when EVERY
 * token matches at least one of the row's field values. A token matches a field
 * when any of these hold (checked from strictest to loosest):
 *   1. plain substring                        "acme"     → "Acme Consulting"
 *   2. substring ignoring punctuation/spaces  "inv1048"  → "INV-1048", "4500" → "$4,500.00"
 *   3. a word within typo distance            "nortstar" → "Northstar" (1 typo for 4–7 chars, 2 for 8+)
 *   4. a tight in-order subsequence           "nrthstr"  → "Northstar"
 * Tokens containing digits only use rules 1–2, so numbers never match approximately.
 */

export type SearchValue = string | number | null | undefined
export type SearchFields<T> = (item: T) => SearchValue[]

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
}

/** Drops punctuation and spaces but keeps the decimal point, so "4500" can't match "$145.00". */
function compact(value: string) {
  return value.replace(/[^a-z0-9.]/g, '')
}

function allowedTypos(length: number) {
  if (length < 4) return 0
  if (length < 8) return 1
  return 2
}

/** Optimal string alignment distance (Levenshtein + adjacent transpositions), exiting early past `max`. */
function editDistance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1
  const rows: number[][] = [Array.from({ length: b.length + 1 }, (_, j) => j)]
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let value = Math.min(rows[i - 1][j] + 1, row[j - 1] + 1, rows[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, rows[i - 2][j - 2] + 1)
      }
      row.push(value)
      rowMin = Math.min(rowMin, value)
    }
    if (rowMin > max) return max + 1
    rows.push(row)
  }
  return rows[a.length][b.length]
}

/** Length of the shortest window of `text` that contains `token`'s characters in order, or Infinity. */
function subsequenceSpan(token: string, text: string) {
  let best = Infinity
  for (let start = text.indexOf(token[0]); start !== -1; start = text.indexOf(token[0], start + 1)) {
    let t = 0
    let i = start
    for (; i < text.length && t < token.length; i++) {
      if (text[i] === token[t]) t++
    }
    if (t === token.length) best = Math.min(best, i - start)
  }
  return best
}

type Haystack = { text: string; compacted: string; words: string[] }

function toHaystack(value: SearchValue): Haystack | null {
  if (value === null || value === undefined || value === '') return null
  const text = normalize(String(value))
  return { text, compacted: compact(text), words: text.split(/[^a-z0-9]+/).filter(Boolean) }
}

function tokenMatches(token: string, field: Haystack) {
  if (field.text.includes(token)) return true

  const compactToken = compact(token)
  if (compactToken && field.compacted.includes(compactToken)) return true

  // Numbers (amounts, dates, invoice numbers) must match exactly — "1048" shouldn't find "1043".
  if (/\d/.test(compactToken)) return false

  const typos = allowedTypos(compactToken.length)
  if (typos > 0) {
    for (const word of field.words) {
      // Compare against the whole word and against its prefix, so partially typed words still match.
      if (editDistance(compactToken, word, typos) <= typos) return true
      if (word.length > compactToken.length && editDistance(compactToken, word.slice(0, compactToken.length), typos) <= typos) {
        return true
      }
    }
  }

  return compactToken.length >= 3 && subsequenceSpan(compactToken, field.compacted) <= compactToken.length + 2
}

/** Returns the items whose field values fuzzily match every token of `query`, preserving order. */
export function fuzzyFilter<T>(items: T[], query: string, fields: SearchFields<T>): T[] {
  const tokens = normalize(query).split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return items

  return items.filter((item) => {
    const haystacks = fields(item)
      .map(toHaystack)
      .filter((field): field is Haystack => field !== null)
    return tokens.every((token) => haystacks.some((field) => tokenMatches(token, field)))
  })
}
