import type { ReactNode } from 'react'

// Inline markers from the comment toolbar: **bold** *italic* __underline__ ~~strike~~
const TOKEN_RE = /(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*]+\*)/g

/** Renders comment text with the B/I/U/S markers applied (no HTML injection —
 *  everything stays plain React text nodes). */
export function FormattedText({ text }: { text: string }) {
	return <>{formatInline(text)}</>
}

function formatInline(text: string): ReactNode[] {
	const parts = text.split(TOKEN_RE)

	return parts.map((part, index) => {
		if (part.startsWith('**') && part.endsWith('**')) {
			return <strong key={index}>{part.slice(2, -2)}</strong>
		}
		if (part.startsWith('__') && part.endsWith('__')) {
			return <u key={index}>{part.slice(2, -2)}</u>
		}
		if (part.startsWith('~~') && part.endsWith('~~')) {
			return <s key={index}>{part.slice(2, -2)}</s>
		}
		if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
			return <em key={index}>{part.slice(1, -1)}</em>
		}
		return part
	})
}
