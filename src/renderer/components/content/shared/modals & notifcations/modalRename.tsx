/* This example requires Tailwind CSS v2.0+ */
import { useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { useDispatch, useSelector } from 'react-redux';
import { closeRenameModal } from 'renderer/store/actions/modalMove actions';
import { classNames } from '../filters/inventoryFunctions';
import { createCSGOImage } from '../../../../functionsClasses/createCSGOImage';

export default function RenameModal() {

  const dispatch = useDispatch();
  const modalData = useSelector((state: any) => state.modalRenameReducer);

  async function renameStorageUnit(newName) {
    await window.electron.ipcRenderer.renameStorageUnit(
      modalData.modalPayload.itemID,
      newName
    );
    dispatch(closeRenameModal());
  }
  renameStorageUnit


  const [inputState, setInputState] = useState('');
  return (
    <Dialog
      open={modalData.renameOpen}
      as="div"
      className="relative z-10"
      onClose={() => dispatch(closeRenameModal())}
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500 bg-opacity-50 dark:bg-opacity-60 transition-opacity ease-out duration-300 data-[closed]:opacity-0 data-[leave]:ease-in data-[leave]:duration-200"
      />

      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <DialogPanel
            transition
            className="inline-block align-bottom dark:bg-dark-level-two bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 ease-out duration-300 data-[closed]:opacity-0 data-[closed]:translate-y-4 sm:data-[closed]:translate-y-0 sm:data-[closed]:scale-95 data-[leave]:ease-in data-[leave]:duration-200"
          >
            <div>
              <div className="mx-auto flex items-center justify-center h-16 w-16">
                <img
                  className="w-16 text-green-600"
                  src={
                    createCSGOImage("econ/tools/casket")
                  }
                ></img>
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <Dialog.Title
                  as="h3"
                  className="text-lg leading-6 font-medium text-gray-900"
                ></Dialog.Title>
                <div className="pl-20 pr-20 mt-2">
                  <div className="relative border border-gray-300 rounded-md px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-indigo-600 focus-within:border-indigo-600 dark:focus-within:ring-indigo-800 dark:focus-within:border-indigo-800">
                    <label
                      htmlFor="name"
                      className="absolute -top-2 left-2 -mt-px inline-block px-1 bg-white dark:text-dark-white dark:bg-dark-level-two text-xs font-medium text-gray-900"
                    >
                      New name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className="block w-full border-0 p-0 focus:outline-none text-gray-900 placeholder-gray-500 focus:ring-0 sm:text-sm dark:bg-dark-level-two dark:text-dark-white"
                      placeholder={modalData.modalPayload.itemName}
                      onChange={(e) => setInputState(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
              <button
                type="button"
                className={classNames(
                  inputState.length == 0
                    ? 'pointer-events-none\tbg-indigo-300 dark:bg-dark-level-three'
                    : 'bg-indigo-600',
                  'w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white  sm:col-start-2 sm:text-sm'
                )}
                onClick={() => renameStorageUnit(inputState)}
              >
                Confirm
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 dark:bg-dark-level-two dark:text-dark-white sm:mt-0 sm:col-start-1 sm:text-sm"
                onClick={() => dispatch(closeRenameModal())}
              >
                Cancel
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
