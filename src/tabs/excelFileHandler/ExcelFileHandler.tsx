import { For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { FileSystemAPI } from "@/tabs/excelFileHandler/FileSystemAPI";
import { FileDetails } from "@/tabs/excelFileHandler/FileDetails";
export const EXCEL_EXTENSIONS = [".xlsm", ".xls", ".xlsx"];

export function ExcelFileHandler(props: { ref: any }) {
    const [fileStore, setFileStore] = createStore<{ files: File[] }>({ files: [] });

    let fileInputRef!: HTMLInputElement;
    let fileDropZoneRef!: HTMLDivElement;

    //frick those types
    props.ref({
        getFiles: () => {
            return [...fileStore.files];
        }
    })

    const onClickDropZone = () => {
        fileInputRef.click();
    }

    const onDragHoverDropZone = (e: DragEvent) => {
        e.preventDefault();
        fileDropZoneRef.classList.add("shadow-2xl");
    }
    const onDragLeaveDropZone = (e: DragEvent) => {
        e.preventDefault();
        fileDropZoneRef.classList.remove("shadow-2xl");
    }

    const onChangeFileInput = (e: Event & {
        currentTarget: HTMLInputElement;
        target: HTMLInputElement;
    }) => {
        setFileStore("files", (prevFiles) => [...prevFiles, ...Array.from(e.target.files!).filter((file) =>
            EXCEL_EXTENSIONS.some((ext) => file.name.endsWith(ext))
        )]);
        e.target.value = "";
    }

    const onDropDropZone = (e: DragEvent & {
        currentTarget: HTMLDivElement;
        target: Element;
    }) => {
        e.preventDefault();
        const newFiles = Array.from(e.dataTransfer!.files).filter((file) =>
            EXCEL_EXTENSIONS.some((ext) => file.name.endsWith(ext))
        );
        setFileStore("files", (prevFiles) => [...prevFiles, ...newFiles]);
    }

    const removeFile = (index: number) => {
        let filesClone = [...fileStore.files];
        filesClone.splice(index, 1);
        setFileStore("files", filesClone);
    }

    const uniqueFiles = () => {
        const seen = new Set();
        const uniqueFiles: File[] = [];

        for (const file of fileStore.files) {
            const key = `${file.name}-${file.size}`;

            if (!seen.has(key)) {
                seen.add(key);
                uniqueFiles.push(file);
            }
        }

        setFileStore("files", uniqueFiles);
    }

    const emptyFiles = () => {
        setFileStore("files", []);
    }

    return (
        <div class="max-w-5xl mx-auto relative flex flex-col md:flex-row gap-3 pt-4 items-start px-2">

            <div class="md:w-96 sticky top-3 w-full md:shrink-0">
                <div
                    ref={fileDropZoneRef}
                    class="border-dashed border-2 border-gray-300 p-3 bg-white cursor-pointer transition-all hover:shadow-2xl"
                    aria-roledescription="file drop zone"
                    onClick={onClickDropZone}
                    onDragOver={onDragHoverDropZone}
                    onDragLeave={onDragLeaveDropZone}
                    onDrop={onDropDropZone}>
                    <div class="text-center">&#x2752;</div>
                    <div class="text-center"><span>Glissez et déposez vos fichiers ici ou cliquez pour ouvrir votre explorateur de fichiers.</span></div>
                    <div class="text-center mt-2 text-xs"><i>({EXCEL_EXTENSIONS.join(", ")})</i></div>
                    <input onChange={onChangeFileInput} ref={fileInputRef} type="file" multiple hidden accept={EXCEL_EXTENSIONS.join(",")} />
                </div>

                <div class="flex gap-1 mt-1 text-sm">
                    <button onClick={uniqueFiles} class="grow px-1 bg-slate-700 text-white hover:bg-slate-600 rounded-md py-2">Supprimer les possibles doublons</button>
                    <button onClick={emptyFiles} class=" px-2 bg-slate-700 text-white hover:bg-slate-600 rounded-md py-2">Vider la liste</button>
                </div>

                <Show when={("showDirectoryPicker" in window)}>
                    <FileSystemAPI setFileStore={setFileStore}></FileSystemAPI>
                </Show>

                <div><i>Le programme devra analyser : {fileStore.files.length} fichier(s).</i></div>
            </div>

            <div class="md:grow w-full flex flex-col gap-3">

                <For each={fileStore.files}>
                    {(file, index) => (
                        <FileDetails
                            fileName={file.name}
                            fileSize={file.size}
                            isDuplicate={fileStore.files.some((_file, _index) => _file.name == file.name && _file.size == file.size && _index != index())}
                            removeFileCallback={removeFile} index={index()}></FileDetails>
                    )}
                </For>
            </div>
        </div>
    )
}