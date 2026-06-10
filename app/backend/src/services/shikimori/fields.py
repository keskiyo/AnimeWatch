"""GraphQL field sets requested from Shikimori."""

# Full set of fields for the anime detail page
GQL_ANIME_FIELDS = """
    id
    name
    russian
    status
    kind
    score
    episodes
    episodesAired
    airedOn { date }
    releasedOn { date }
    nextEpisodeAt
    duration
    rating
    description
    url
    poster { originalUrl mainUrl previewUrl }
    genres { id russian name kind }
    studios { id name }
    scoresStats { score count }
"""

# Fields for catalog sync: list fields + releasedOn/duration/url (no heavy description)
GQL_SYNC_FIELDS = """
    id
    name
    russian
    status
    kind
    score
    rating
    episodes
    episodesAired
    airedOn { date }
    releasedOn { date }
    nextEpisodeAt
    duration
    url
    poster { originalUrl mainUrl previewUrl }
    genres { id russian name kind }
    studios { id name }
"""

# Shorter field set for bulk/list queries (no description/scoresStats to save bandwidth)
GQL_LIST_FIELDS = """
    id
    name
    russian
    status
    kind
    score
    rating
    episodes
    episodesAired
    airedOn { date }
    nextEpisodeAt
    poster { originalUrl mainUrl previewUrl }
    genres { russian kind }
    studios { name }
"""
