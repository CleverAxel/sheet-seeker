import { createSignal, For, Show } from "solid-js";
import { createStore, produce, SetStoreFunction } from "solid-js/store"
import clickOutside from "../directives/clickOutside";

const excelExtension = ".xlsm";

//https://github.com/solidjs/solid/discussions/564
//https://techoverflow.net/2021/11/26/how-to-compute-sha-hash-of-local-file-in-javascript-using-subtlecrypto-api/
true && clickOutside;

export interface FileHandlerRef {
    getFiles: () => File[];
}

export default function FileHandler(props: { ref: any }) {
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
        setFileStore("files", (prevFiles) => [...prevFiles, ...Array.from(e.target.files!)]);
        e.target.value = "";
    }

    const onDropDropZone = (e: DragEvent & {
        currentTarget: HTMLDivElement;
        target: Element;
    }) => {
        e.preventDefault();
        const newFiles = Array.from(e.dataTransfer!.files).filter((file) => file.name.endsWith(excelExtension));
        setFileStore("files", (prevFiles) => [...prevFiles, ...newFiles]);
    }

    const removeFile = (index: number) => {
        let filesClone = [...fileStore.files];
        filesClone.splice(index, 1);
        setFileStore("files", filesClone);
    }

    const uniqueFiles = () => {
        const seen = new Set();
        const uniqueFiles:File[] = [];

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
                    <input onChange={onChangeFileInput} ref={fileInputRef} type="file" multiple hidden accept={excelExtension} />
                </div>

                <div class="flex gap-1 mt-1 text-sm">
                    <button onClick={uniqueFiles} class="grow px-1 bg-slate-700 text-white hover:bg-slate-600 rounded-md py-2">Supprimer les possibles doublons</button>
                    <button onClick={emptyFiles} class=" px-2 bg-slate-700 text-white hover:bg-slate-600 rounded-md py-2">Vider la liste</button>
                </div>

                <Show when={('showDirectoryPicker' in window)}>
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


interface IPropsFileAPI {
    setFileStore: SetStoreFunction<{
        files: File[];
    }>
}
function FileSystemAPI(props: IPropsFileAPI) {
    const [togglePopUp, setTogglePopUP] = createSignal(false);

    const startScan = async () => {
        const dirHandle = await window.showDirectoryPicker();
        await scanDirectoryRecursive(dirHandle);
    }

    const scanDirectoryRecursive = async (dirHandle: FileSystemDirectoryHandle, path = "") => {
        for await (const entry of dirHandle.values()) {
            const fullPath = `${path}/${entry.name}`;

            if (entry.kind === "file") {
                const file = await entry.getFile();
                if (file.name.endsWith(excelExtension)) {
                    props.setFileStore(produce(store => store.files.push(file)));
                }
                // console.log(`📄 File: ${fullPath}`);
            } else if (entry.kind === "directory") {
                // console.log(`📁 Folder: ${fullPath}`);
                // // Recursively scan subdirectory
                await scanDirectoryRecursive(entry, fullPath);
            }
        }
    }


    return (
        <div class="border-t border-gray-300 border-b my-5 py-3" >
            <p class="text-green-700 text-base">Il semblerait que votre navigateur supporte une interface avancée d'explorateur de fichiers.</p>
            <div class="mt-2">
                <button onClick={() => setTogglePopUP(true)} class="w-full bg-slate-700 text-white hover:bg-slate-600 rounded-md py-2">En savoir plus</button>
            </div>
            <div class="mt-2">
                <button onClick={startScan} class="w-full bg-slate-700 text-white hover:bg-slate-600 rounded-md py-2">Sélectionner & scanner un dossier</button>
            </div>

            <Show when={togglePopUp()}>
                <div style={{ "background-color": "rgba(0, 0, 0, 0.75)" }} class="fixed top-0 left-0 w-full h-full flex justify-center items-center p-2">
                    <ModalExplanationFileSystemAPI setTogglePopUp={setTogglePopUP}></ModalExplanationFileSystemAPI>
                </div>
            </Show>

        </div>
    )
}

function ModalExplanationFileSystemAPI(props: { setTogglePopUp: any }) {
    return (
        <div class="bg-white max-w-md p-2 rounded-md max-h-full overflow-y-auto" use:clickOutside={() => props.setTogglePopUp(false)}>
            <div class="flex items-start mb-2">
                <h3 class="text-slate-700 text-2xl font-black">File System API</h3>
                <button onClick={() => props.setTogglePopUp(false)} class="ml-auto text-2xl">&#x2715;</button>
            </div>
            <p class="mb-4">
                Cette fonctionnalité n'est pas disponible dans tous les navigateurs web,
                car elle est relativement récente. Elle est uniquement supportée par les
                navigateurs utilisant Chromium comme moteur de rendu.
                Cela inclut des navigateurs populaires tels que Google Chrome, Microsoft Edge, Opera et Brave.
            </p>
            <p class="mb-4">
                Cette fonctionnalité ne sera pas compatible avec Safari ni avec Firefox.
                Si vous utilisez un iPhone, il n'est pas nécessaire d'installer un autre navigateur.
                En effet, tous les navigateurs disponibles sur l'App Store utilisent le même moteur de
                rendu que Safari, ce qui signifie qu'ils offrent les mêmes fonctionnalités ainsi que celles qui manquent également. En tant que
                développeur web, Safari est très frustrant :)
            </p>
            <p class="mb-4">
                Grâce à cette fonctionnalité, vous pourrez sélectionner un dossier, et l'application sera en mesure d'y récupérer tous les fichiers Excel,
                y compris ceux situés dans les sous-dossiers. Lorsque vous cliquerez sur "Sélectionner & scanner un dossier", votre navigateur vous demandera d'autoriser
                cette action. Il vous faudra accepter si vous souhaitez permettre à l'application de rechercher automatiquement tous les fichiers Excel dans un dossier spécifique.
            </p>
            <p>
                Il est également possible que le scan rate si le navigateur rencontre des fichiers/dossiers protégés par le système d'exploitation lui-même pour des raisons de
                sécurité.
            </p>
        </div>
    )
}


function FileDetails(props: { index: number; fileName: string; fileSize: number; isDuplicate: boolean; removeFileCallback: (index: number) => void; }) {

    const formatFileSize = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
    }
    return (
        <div class={`${props.isDuplicate ? "bg-red-200" : "bg-white"} p-2 border-dotted border-2 border-gray-400 shadow-xl rounded-md `}>
            <div class="flex items-center">
                <div class="text-2xl"><span>{props.fileName} </span><span class="text-xl text-red-950">~{formatFileSize(props.fileSize)}</span></div>
                <button onClick={() => props.removeFileCallback(props.index)} title="Retirer ce fichier de la liste" class="ml-auto text-3xl font-black text-black">&#x2715;</button>
            </div>
            <Show when={props.isDuplicate}>
                <div class="text-large flex items-center gap-1">
                    <div class="w-5 shrink-0"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480L40 480c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24l0 112c0 13.3 10.7 24 24 24s24-10.7 24-24l0-112c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z" /></svg></div>
                    <b>Il semblerait que vous ayez déjà uploadé ce fichier quelque part dans la liste.</b>
                </div>
            </Show>

        </div>
    )
}