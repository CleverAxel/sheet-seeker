import { createSignal, Show } from "solid-js";
import { produce } from "solid-js/store";
import { EXCEL_EXTENSIONS } from "@/tabs/excelFileHandler/ExcelFileHandler";
import { IPropsFileSystemAPI } from "@/tabs/excelFileHandler/types";
import { clickOutside } from "@/directives/clickOutside";

true && clickOutside;

export function FileSystemAPI(props: IPropsFileSystemAPI) {
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
                if (EXCEL_EXTENSIONS.some(ext => file.name.endsWith(ext))) {
                    props.setFileStore(produce(store => {
                        store.files.push(file);
                    }));
                }
            } else if (entry.kind === "directory") {
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