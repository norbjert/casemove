import { CheckCircleIcon } from "@heroicons/react/24/solid";

export function RowMoveable({itemRow, settingsData}) { 
    
    return (
        <>
          {settingsData.columns.includes('Moveable') ? (
                <td
                  className="hidden md:table-cell px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right"
                >
                  <div className="flex justify-center rounded-full drop-shadow-lg">
                    {itemRow.item_moveable == true ? (
                      <CheckCircleIcon
                        className="h-5 w-5 text-green-500"
                        aria-hidden="true"
                      />
                    ) : (
                      ''
                    )}
                  </div>
                </td>
              ) : (
                ''
              )}
            
        </>
      );
}