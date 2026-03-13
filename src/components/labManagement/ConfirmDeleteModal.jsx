import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Trash2 } from 'lucide-react'

/**
 * Reusable confirmation modal for delete actions.
 * Use for any entity delete; ensure backend enforces role-based access.
 */
export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete entry',
  message = 'Are you sure you want to delete this entry? This action cannot be undone.',
  entityName = '',
  loading = false,
}) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center gap-3 text-red-600 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                    {title}
                  </Dialog.Title>
                </div>
                <p className="text-gray-600 text-sm mb-6">
                  {message}
                  {entityName && (
                    <span className="mt-2 block font-medium text-gray-900">{entityName}</span>
                  )}
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
