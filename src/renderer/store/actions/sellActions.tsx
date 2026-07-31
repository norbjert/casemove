export const sellSetQty = (itemID: string, totalItems: Array<string>, itemName: string) => {
    return {
        type: 'SELL_TOTAL_TO_ADD',
        payload: {
            itemID: itemID,
            toSell: totalItems,
            itemName: itemName,
        }
    }
}

export const sellSetPrice = (itemID: string, price: string) => {
    return {
        type: 'SELL_SET_PRICE',
        payload: {
            itemID: itemID,
            price: price,
        }
    }
}

export const sellClearAll = () => {
    return {
        type: 'SELL_CLEAR_ALL'
    }
}

export const sellSetSearchField = (searchField: string) => {
    return {
        type: 'SELL_SET_SEARCH',
        payload: {
            searchField: searchField,
        }
    }
}
