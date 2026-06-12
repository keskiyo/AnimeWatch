import { toast } from 'react-toastify'

// ToastContainer owns position/theme/autoClose; app code imports only this file.

export function notifySuccess(message: string) {
	toast.success(message)
}

export function notifyError(message: string) {
	toast.error(message)
}

export function notifyInfo(message: string) {
	toast.info(message)
}
