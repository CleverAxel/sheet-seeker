import { SetStoreFunction } from "solid-js/store";

export interface IPropsFileSystemAPI {
    setFileStore: SetStoreFunction<{
        files: File[];
    }>
}

export interface IExcelFileHandlerRef {
    getFiles: () => File[];
}

export interface IPropsFileDetails {
    index:number,
    fileName:string,
    fileSize:number,
    isDuplicate:boolean,
    removeFileCallback: (index: number) => void;
}