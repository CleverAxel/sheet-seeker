import { IPropsFileDetails } from "@/tabs/excelFileHandler/types";
import { Show } from "solid-js";

export function FileDetails(props: IPropsFileDetails) {

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