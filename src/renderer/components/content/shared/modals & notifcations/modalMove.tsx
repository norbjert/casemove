import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { useDispatch, useSelector } from 'react-redux';
import {
  cancelModal,
  closeMoveModal,
  modalResetStorageIdsToClearFrom,
  moveModalAddToFail,
  moveModalResetPayload,
} from 'renderer/store/actions/modalMove actions';
import { moveToClearAll } from 'renderer/store/actions/moveToActions';
import {
  moveFromClearAll,
} from 'renderer/store/actions/moveFromActions';

// Number of concurrent workers used in fast-consistent mode.
const FAST_WORKERS = 5;

export default function MoveModal() {
  const dispatch = useDispatch();
  const modalData = useSelector((state: any) => state.modalMoveReducer);
  const settingsData = useSelector((state: any) => state.settingsReducer);

  // Keep a ref so async workers always read the latest cancel list.
  const doCancelRef = useRef<string[]>(modalData.doCancel);
  useEffect(() => {
    doCancelRef.current = modalData.doCancel;
  }, [modalData.doCancel]);

  // Local progress state updated by workers — avoids Redux overhead per item.
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  // ── Cancel handler ───────────────────────────────────────────────────────────
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

  // ── Move driver ──────────────────────────────────────────────────────────────
  // Triggered once when the modal opens with a non-empty queue.
  useEffect(() => {
    if (!modalData.moveOpen || modalData.query.length === 0) return;

    const queue: any[] = [...modalData.query];
    setProgress({ done: 0, total: queue.length });

    const fastConsistentMove: boolean = settingsData.fastConsistentMove;
    const fastMove: boolean = settingsData.fastMove;

    function doCleanup() {
      window.electron.ipcRenderer.refreshInventory();
      const hasTo = queue.some((i: any) => i.type === 'to');
      const hasFrom = queue.some((i: any) => i.type === 'from');
      if (hasTo) dispatch(moveToClearAll());
      if (hasFrom) dispatch(moveFromClearAll());
      dispatch(modalResetStorageIdsToClearFrom());
      dispatch(moveModalResetPayload());
      dispatch(closeMoveModal());
    }

    async function executeMove(item: any): Promise<void> {
      if (item.type === 'to') {
        await window.electron.ipcRenderer.moveToStorageUnit(item.storageID, item.itemID, false);
      } else {
        await window.electron.ipcRenderer.moveFromStorageUnit(item.storageID, item.itemID, false);
      }
    }

    if (fastConsistentMove) {
      // ── Mode 3: N concurrent workers, each awaiting its own GC ack ──────────
      let nextIndex = 0;
      const firstPassFailed: any[] = [];

      const runWorker = async (): Promise<void> => {
        while (nextIndex < queue.length) {
          const item = queue[nextIndex++];
          if (doCancelRef.current.includes(item.key)) {
            setProgress((p) => ({ ...p, done: p.done + 1 }));
            continue;
          }
          try {
            await executeMove(item);
          } catch {
            firstPassFailed.push(item);
          }
          setProgress((p) => ({ ...p, done: p.done + 1 }));
        }
      };

      Promise.all(Array.from({ length: FAST_WORKERS }, runWorker)).then(async () => {
        for (const item of firstPassFailed) {
          if (doCancelRef.current.includes(item.key)) continue;
          try {
            await executeMove(item);
          } catch {
            dispatch(moveModalAddToFail());
          }
        }
        doCleanup();
      });

    } else if (fastMove) {
      // ── Mode 2: original fast move — fire-and-forget with 100ms spacing ─────
      (async () => {
        for (const item of queue) {
          if (doCancelRef.current.includes(item.key)) {
            setProgress((p) => ({ ...p, done: p.done + 1 }));
            continue;
          }
          if (item.type === 'to') {
            window.electron.ipcRenderer.moveToStorageUnit(item.storageID, item.itemID, true);
          } else {
            window.electron.ipcRenderer.moveFromStorageUnit(item.storageID, item.itemID, true);
          }
          setProgress((p) => ({ ...p, done: p.done + 1 }));
          await new Promise((r) => setTimeout(r, 100));
        }
        doCleanup();
      })();

    } else {
      // ── Mode 1: default slow — sequential, each awaiting GC ack ─────────────
      let nextIndex = 0;
      const firstPassFailed: any[] = [];

      const runSingle = async (): Promise<void> => {
        while (nextIndex < queue.length) {
          const item = queue[nextIndex++];
          if (doCancelRef.current.includes(item.key)) {
            setProgress((p) => ({ ...p, done: p.done + 1 }));
            continue;
          }
          try {
            await executeMove(item);
          } catch {
            firstPassFailed.push(item);
          }
          setProgress((p) => ({ ...p, done: p.done + 1 }));
        }
      };

      runSingle().then(async () => {
        for (const item of firstPassFailed) {
          if (doCancelRef.current.includes(item.key)) continue;
          try {
            await executeMove(item);
          } catch {
            dispatch(moveModalAddToFail());
          }
        }
        doCleanup();
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalData.moveOpen]);

  // ── Display ──────────────────────────────────────────────────────────────────
  const fastMode = settingsData.fastMove;
  const fastConsistentMode = settingsData.fastConsistentMove;
  const open = modalData.doCancel.includes(modalData.modalPayload?.['key'])
    ? false
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
                <span className="text-white dark:text-dark-white text-sm font-medium">
                  {progress.total > 0
                    ? `${progress.done}/${progress.total}`
                    : '…'}
                </span>
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <Dialog.Title
                  as="h3"
                  className="text-lg leading-6 font-medium text-gray-900 dark:text-dark-white"
                >
                  Moving items
                </Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Please wait while the app moves your items.
                    {fastConsistentMode
                      ? ` Running ${FAST_WORKERS} workers in parallel.`
                      : fastMode
                      ? ' Fast move enabled.'
                      : ' Enable fastmove in settings to speed this up.'}
                  </p>
                  {modalData.totalFailed > 0 && (
                    <p className="text-sm text-red-500">
                      Failed after retry: {modalData.totalFailed}
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
