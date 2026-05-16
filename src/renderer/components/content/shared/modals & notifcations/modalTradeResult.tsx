import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { useDispatch, useSelector } from 'react-redux';
import { setTradeMoveResult } from 'renderer/store/actions/modalTrade';
import { tradeUpResetPossible } from 'renderer/store/actions/tradeUpActions';
import { createCSGOImage } from '../../../../functionsClasses/createCSGOImage';

export default function TradeResultModal() {
  const dispatch = useDispatch();
  const modalData = useSelector((state: any) => state.modalTradeReducer);

  const devMode = false;

  async function setDone() {
    dispatch(setTradeMoveResult())
    dispatch(tradeUpResetPossible())
  }

  return (
    <Dialog
      open={devMode ? true : modalData.openResult}
      as="div"
      className="relative z-10"
      onClose={() => dispatch(setTradeMoveResult())}
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
              <div className='flex items-center justify-center'>
                <img
                  className="max-w-none h-16 w-16 dark:from-gray-300 dark:to-gray-400 rounded-full ring-2 ring-transparent object-cover bg-gradient-to-t from-gray-100 to-gray-300"
                  src={
                    createCSGOImage(modalData.rowToMatch?.item_url)
                  }
                />
              </div>
              <div className="mt-3 text-center sm:mt-5">
                <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900 dark:text-dark-white">
                  {modalData.rowToMatch.item_name}
                </Dialog.Title>
                <div className="mt-2 text-gray-400 dark:text-gray-400 text-lg">
                  Trade Up Contract Reward
                </div>
              </div>
            </div>

            <div className="mt-5 sm:mt-6">
              <button
                type="button"
                className="dark:bg-dark-level-two dark:text-dark-white mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:col-start-1 sm:text-sm"
                onClick={() => setDone()}
              >
                Done
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
