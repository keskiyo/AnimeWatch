/** Lets any component (e.g. «Войдите» in comments) open the auth modal
 *  that lives in the Header, without prop drilling. */

const AUTH_MODAL_EVENT = 'aw:open-auth-modal'

export function openAuthModal(): void {
	window.dispatchEvent(new Event(AUTH_MODAL_EVENT))
}

export function subscribeAuthModal(open: () => void): () => void {
	window.addEventListener(AUTH_MODAL_EVENT, open)
	return () => window.removeEventListener(AUTH_MODAL_EVENT, open)
}
