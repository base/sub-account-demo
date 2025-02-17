export function clearObjectStore(db: IDBDatabase, storeName: string) {
    const transaction = db.transaction(storeName, 'readwrite');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.clear();
    request.onerror = (event: any) => {
      console.error(`Error clearing object store "${storeName}":`, event.target?.error);
    };
  }