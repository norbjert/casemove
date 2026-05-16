/* This example requires Tailwind CSS v2.0+ */
import { useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useDispatch } from 'react-redux'
import { setSteamLoginShow } from '../../store/actions/settings'
// import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid'


export default function SteamCloseModal({ open, setOpen, loginWithouClosingSteam, setLoadingButton }) {
  const [isCheck, setIsCheck] = useState(false)
  const dispatch = useDispatch()

  async function setSetting() {
    if (!isCheck) {
      return
    }
    await window.electron.store.set('steamLogin', false);
    dispatch(setSteamLoginShow(false))
  }
  async function confirm() {
    setSetting()
    setOpen(false)
    await window.electron.ipcRenderer.closeSteam()
    loginWithouClosingSteam()
  }

  async function cancel() {
    setSetting()

    setLoadingButton(false)
    setOpen(false)
  }

  return (
    <Dialog open={open} as="div" className="relative z-10" onClose={() => cancel()}>
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500 bg-opacity-50 dark:bg-opacity-60 transition-opacity ease-out duration-300 data-[closed]:opacity-0 data-[leave]:ease-in data-[leave]:duration-200"
      />

      <div className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-end sm:items-center justify-center min-h-full p-4 text-center sm:p-0">
          <DialogPanel
            transition
            className="relative bg-dark-level-three px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full sm:p-6 ease-out duration-300 data-[closed]:opacity-0 data-[closed]:translate-y-4 sm:data-[closed]:translate-y-0 sm:data-[closed]:scale-95 data-[leave]:ease-in data-[leave]:duration-200"
          >
            <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
              <button
                type="button"
                className=" rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-0"
                onClick={() => cancel()}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="sm:flex sm:items-start">
              {/* <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12  sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationCircleIcon className="h-12 w-12 text-yellow-500" aria-hidden="true" />
              </div> */}
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-dark-white">
                  Steam is currently running
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-400">
                    You can continue to use the app, but it is recommended to close Steam as it can otherwise require a restart of your pc
                    before Valve allows you to connect to VAC secured servers.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center  hover:bg-green-800 text-dark-white shadow-sm px-4 py-2 bg-green-700 text-base font-medium sm:mt-0 sm:w-auto sm:text-sm"
                onClick={() => confirm()}
              >
                Close and login
              </button>
              <button
                type="button"
                className="mt-3 w-full ml-2 mr-2 inline-flex justify-center  hover:bg-dark-level-four text-dark-white shadow-sm px-4 py-2 bg-dark-level-three text-base font-medium text-gray-700 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={() => {
                  setSetting()
                  loginWithouClosingSteam()
                  setOpen(false)
                }}
              >
                Login without closing
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center  hover:bg-dark-level-four text-dark-white shadow-sm px-4 py-2 bg-dark-level-three text-base font-medium text-gray-700 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={() => cancel()}
              >
                Cancel
              </button>
            </div>
            <div className="relative mt-3 flex place-content-end">
              <div className="mr-3 text-sm">
                <label htmlFor="comments" className="font-medium text-gray-500">
                  Dont show this again
                </label>
              </div>
              <div className="flex h-5 items-center">
                <input
                  id="comments"
                  checked={isCheck}
                  onChange={() => setIsCheck(!isCheck)}
                  name="comments"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
