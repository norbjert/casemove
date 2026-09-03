import { useEffect, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { useDispatch, useSelector } from 'react-redux';
import {
  cancelModal,
  closeMoveModal,
  modalResetStorageIdsToClearFrom,
  moveModalAddToFail,
  moveModalResetPayload,
  moveModalUpdate,
} from 'renderer/store/actions/modalMove actions';
import { moveToClearAll } from 'renderer/store/actions/moveToActions';
import {
  moveFromClearAll,
  moveFromReset,
} from 'renderer/store/actions/moveFromActions';

export default function MoveModal() {
  const waitTime = 100;
  const [seenID, setID] = useState('');
  const [seenStorage, setStorage] = useState('');
  const dispatch = useDispatch();
  const modalData = useSelector((state: any) => state.modalMoveReducer);
  const settingsData = useSelector((state: any) => state.settingsReducer);

  async function cancelMe() {
    window.electron.ipcRenderer.refreshInventory();
    dispatch(closeMoveModal());
    dispatch(cancelModal(modalData.modalPayload['key']));
    dispatch(closeMoveModal());
    if (modalData.modalPayload['type'] == 'to') {
      dispatch(moveToClearAll());
    }
    if (modalData.modalPayload['type'] == 'from') {
      dispatch(moveFromClearAll());
    }
    dispatch(modalResetStorageIdsToClearFrom());
    dispatch(moveModalResetPayload());
  }

  const fastMode = settingsData.fastMove;

  async function runModal() {
    if (modalData.moveOpen) {
      if (modalData.doCancel.includes(modalData.modalPayload['key']) == false) {
        if (modalData.modalPayload['type'] == 'to') {
          if (fastMode && modalData.query.length > 1) {
            // fire and forget: fastMode does not wait for GC confirmation
            window.electron.ipcRenderer.moveToStorageUnit(
              modalData.modalPayload['storageID'],
              modalData.modalPayload['itemID'],
              true
            ).catch(() => {});
            await new Promise(r => setTimeout(r, waitTime));
          } else {
            try {
              await window.electron.ipcRenderer.moveToStorageUnit(
                modalData.modalPayload['storageID'],
                modalData.modalPayload['itemID'],
                false
              );
            } catch {
              dispatch(moveModalAddToFail());
            }
          }
          dispatch(moveModalUpdate());
          if (modalData.modalPayload['isLast']) {
            dispatch(moveToClearAll());
          }
        }
        if (modalData.modalPayload['type'] == 'from') {
          if (fastMode) {
            // fire and forget: fastMode does not wait for GC confirmation
            window.electron.ipcRenderer.moveFromStorageUnit(
              modalData.modalPayload['storageID'],
              modalData.modalPayload['itemID'],
              true
            ).catch(() => {});
            await new Promise(r => setTimeout(r, waitTime));
          } else {
            try {
              await window.electron.ipcRenderer.moveFromStorageUnit(
                modalData.modalPayload['storageID'],
                modalData.modalPayload['itemID'],
                false
              );
            } catch {
              dispatch(moveModalAddToFail());
            }
          }
          dispatch(moveModalUpdate());
        }
        if (modalData.modalPayload['isLast']) {
          window.electron.ipcRenderer.refreshInventory();
        }
      }
    }
  }

  useEffect(() => {
    if (
      Object.keys(modalData.modalPayload).length !== 0 &&
      seenID != modalData.modalPayload.itemID
    ) {
      if (modalData.modalPayload.storageID != seenStorage) {
        dispatch(moveFromReset());
      }
      setID(modalData.modalPayload.itemID);
      runModal();
    }
  }, [modalData.modalPayload.itemID]);

  const devMode = false;
  const open = modalData.doCancel.includes(modalData.modalPayload['key'])
    ? false
    : Object.keys(modalData.modalPayload).length == 0
    ? devMode
    : modalData.moveOpen;

  return (
    <Dialog
      open={open}
      as="div"
      className="relative z-10"
      onClose={() => cancelMe()}
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
            className="inline-block align-bottom bg-white dark:bg-dark-level-two rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6 ease-out duration-300 data-[closed]:opacity-0 data-[closed]:translate-y-4 sm:data-[closed]:translate-y-0 sm:data-[closed]:scale-95 data-[leave]:ease-in data-[leave]:duration-200"
          >
            <div>
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-blue-500 dark:bg-blue-700">
                <span className="animate-ping absolute inline-flex h-14 w-14 rounded-full dark:bg-blue-700 opacity-75"></span>
                <span className="text-white dark:text-dark-white">
                  {modalData.modalPayload['number']}
                </span>
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <Dialog.Title
                  as="h3"
                  className="text-lg leading-6 font-medium text-gray-900 dark:text-dark-white"
                >
                  {modalData.modalPayload['name']}
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Please wait while the app moves your items.
                    {fastMode == false ? ' \nWant to speed this up? Enable fastmove in the settings.' : ''}
                  </p>
                  {modalData.totalFailed == 0 ? (
                    ''
                  ) : (
                    <p className="text-sm text-red-500">
                      Total failed: {modalData.totalFailed}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 sm:mt-6">
              <button
                type="button"
                className="dark:bg-dark-level-two dark:text-dark-white mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:col-start-1 sm:text-sm"
                onClick={() => cancelMe()}
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
