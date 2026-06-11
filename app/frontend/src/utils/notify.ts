import { toast } from 'react-toastify'

// Thin wrapper — position/theme/autoClose come from the ToastContainer in
// App.tsx; this keeps a single import point if we ever swap the library.

export function notifySuccess(message: string) {
	toast.success(message)
}

export function notifyError(message: string) {
	toast.error(message)
}

export function notifyInfo(message: string) {
	toast.info(message)
}
