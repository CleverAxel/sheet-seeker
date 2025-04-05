
import { createEffect, createSignal, For, JSX, onMount, Setter, Show } from "solid-js";
import { IAuditVisitReport, IUncommonCabNumber, WorkBookSearch } from "../services/WorkBookSearch";
import clickOutside from "../directives/clickOutside";

true && clickOutside;

interface IProps {
    callbackGetFiles: () => File[];
}
export default function SearchSheets(props: IProps) {
    const [isSeeking, setIsSeeking] = createSignal(false);
    const [processedSheetCount, setProcessedSheetCount] = createSignal(0);
    const [processedFileCount, setProcessedFileCount] = createSignal(0);
    const [totalFiles, setTotalFiles] = createSignal(0);
    const [referenceFoundCount, setReferenceFoundCount] = createSignal(0);

    const [data, setData] = createSignal<IAuditVisitReport[]>([]);
    const [singleData, setSingleData] = createSignal<IAuditVisitReport>();
    const [unCommonCabNumbers, setUnCommonCabNumbers] = createSignal<IUncommonCabNumber[]>([]);

    const [toggleInfringementsDisplay, setToggleInfringementsDisplay] = createSignal(false);

    const sheetsToSkip = ["Liste cabines", "Phrases codifiées", "Données"];
    let inputRef!: HTMLInputElement;

    createEffect(() => {
        // if (totalFiles())
            // console.log(Math.ceil((processedFileCount() / totalFiles()) * 100));

    })

    const onSearchClick = () => {
        if (isSeeking() || inputRef.value.trim() == "") {
            return;
        }

        const now = Date.now();

        setIsSeeking(true)
        seek().then(() => {
            setIsSeeking(false);
            console.log(Date.now() - now);
            
        });
    }

    const seek = async () => {
        const files = props.callbackGetFiles();
        setTotalFiles(files.length);
        let workBook = new WorkBookSearch(files, sheetsToSkip);

        workBook.setSetters(setProcessedFileCount, setProcessedSheetCount, setReferenceFoundCount);

        await workBook.startSeeking(inputRef.value);
        setData(workBook.getData())
        // console.log(workBook.getUncommonCabNumbers());
        // setUnCommonCabNumbers(workBook.getUncommonCabNumbers());

    }

    return (
        <div>
            <Show when={toggleInfringementsDisplay()}>
                <InfringementsDisplay data={singleData()} setToggleInfringementsDisplay={setToggleInfringementsDisplay}></InfringementsDisplay>
            </Show>
            <div class="max-w-5xl mx-auto px-2">
                <h3 class="font-thin text-2xl">Rentrez le numéro de cabine souhaité. Le programme vous renverra toutes les informations trouvés à partir du numéro donné.</h3>
                <h3 class="font-thin italic text-xl mt-3">Plus le nombre de feuilles est important dans un fichier excel plus le programme mettra du temps à l'intèrpreter.</h3>
                <h3 class="font-thin italic text-xl mt-3">Un test a été effectué pour rechercher une référence dans 100 fichiers. La première moitié  comptait 100 feuilles, l'autre motié comptait 40 feuilles. Et le programme a mis plus ou moins 2 minutes pour rechercher une référence dans les 7000 feuilles données.</h3>
                <div class="max-w-lg mt-2 flex">
                    <input value={"61R00132"} onkeydown={(e) => { if (e.key.toUpperCase() == "ENTER") { onSearchClick() } }} ref={inputRef} disabled={isSeeking()} class={`${isSeeking() ? "cursor-not-allowed opacity-40" : ""} w-full p-3 text-xl border border-slate-700`} type="text" placeholder="Numéro de cabine à rechercher" />
                    <button disabled={isSeeking()} onClick={onSearchClick} class={`${isSeeking() ? `cursor-not-allowed opacity-40` : `hover:bg-slate-600`}  w-11 bg-slate-700 shrink-0 p-2 `}>
                        <svg xmlns="http://www.w3.org/2000/svg" class="fill-white" viewBox="0 0 512 512"><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" /></svg>
                    </button>
                </div>
                <Show when={isSeeking()}>
                    <div>
                        <b class="text-green-600">Recherche en cours...</b>
                    </div>
                </Show>
                <Show when={isSeeking() || processedFileCount() || processedSheetCount() || referenceFoundCount()}>
                    <div>
                        <i>{processedFileCount()} fichier(s) traité(s)</i>
                    </div>
                    <div>
                        <i>{processedSheetCount()} feuille(s) traitée(s)</i>
                    </div>
                    <div>
                        <i>{referenceFoundCount()} référence(s) trouvée(s)</i>
                    </div>
                </Show>
            </div>

            <div class="max-w-5xl mx-auto mt-5 px-2">
                <For each={data()}>
                    {(item) =>
                        <div class="bg-white shadow-lg overflow-hidden mb-8 rounded-md">
                            <DataRow title="Nom de fichier">{item.filename}</DataRow>
                            <DataRow title="Ordre de mission">{item.assignmentOrder}</DataRow>
                            <DataRow title="Numéro de cabine">{item.cabNumber}</DataRow>
                            <DataRow title="Adresse">{item.address}</DataRow>
                            <DataRow title="Date de visite">{item.date}</DataRow>
                            <DataRow title="Effectué par">{item.technician}</DataRow>
                            <DataRow title="Base d'examen">{item.baseOfReview}</DataRow>
                            <DataRow title="Article de référence">{item.referenceArticle}</DataRow>
                            <DataRow title="Schéma de mise à la terre">{item.groundDiagram}</DataRow>
                            <DataRow title="Tension de service">{item.operatingVoltage}</DataRow>
                            <DataRow title="Dispositif de mise à la terre">{item.groundingDevice}</DataRow>
                            <DataRow title="Mesure de terre déconnectée">{item.disconnectedGroundMeasurement}</DataRow>
                            <DataRow title="Conclusion">{item.conclusion}</DataRow>
                            <button onClick={() => {
                                setToggleInfringementsDisplay(true);
                                setSingleData(item);
                            }} class="w-full text-center bg-slate-700 text-lg text-white uppercase font-black py-2 px-1 hover:bg-slate-600">
                                Voir les infractions/remarques
                            </button>
                        </div>
                    }
                </For>
            </div>
        </div>
    );
}

interface IPropsD {
    title: string,
    children?: string | JSX.Element,
}
function DataRow(props: IPropsD) {
    return (
        <div class="flex items-start border-b border-gray-400 last:border-b-0">
            <div class="bg-gray-800 p-3 self-stretch text-sm sm:text-xl text-center sm:w-64 shrink-0 w-40 text-white"><b>{props.title}</b></div>
            <div class="grow p-3 bg-white"><span>{props.children ?? "-"}</span></div>
        </div>
    )
}

interface IPropsI {
    setToggleInfringementsDisplay: Setter<boolean>,
    data: IAuditVisitReport | undefined,
}
function InfringementsDisplay(props: IPropsI) {
    let refContent!: HTMLDivElement;
    let refContainer!: HTMLDivElement;
    let startX = 0;
    let endX = 0;

    const onTouchStart = (e: TouchEvent) => {
        startX = e.touches[0].clientX;
    }

    const onTouchMove = (e: TouchEvent) => {
        endX = e.touches[0].clientX;
    }

    const onTouchEnd = () => {
        const deltaX = endX - startX;
        if (deltaX < -50) {
            close();
        }
    }

    const close = () => {
        refContent.ontransitionend = () => {
            refContainer.style.opacity = "0";
            refContent.ontransitionend = null;

            setTimeout(() => {
                props.setToggleInfringementsDisplay(false);
            }, 150);
        };

        refContent.classList.add("-translate-x-full");
        document.body.style.overflowY = "";
    };

    onMount(() => {
        refContent.getBoundingClientRect();
        refContent.classList.remove("-translate-x-full");
        document.body.style.overflowY = "hidden";
        refContent.ontransitionend = () => {
            refContainer.style.backgroundColor = "rgba(0,0,0,0.75)";
            refContent.ontransitionend = null;
        }
    });
    return (
        <div ref={refContainer} class="fixed top-0 left-0 z-50 w-full h-full transition-all duration-150 overflow-y-auto pointer-events-none">
            <div use:clickOutside={close} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} class="pointer-events-auto bg-white transition-all max-w-lg duration-100 h-full -translate-x-full" ref={refContent}>
                <div class="flex justify-end">
                    <button onClick={close} class="text-4xl mr-2">
                        &#x2715;
                    </button>
                </div>
                <div class="text-center px-2 py-2 mt-2 bg-slate-700 text-white font-thin text-3xl border-t border-b border-slate-700">
                    <h2>Infractions/remarques de la cabine : </h2>
                    <div class=""><i class="underline underline-offset-2 ">{props.data?.cabNumber}</i></div>
                </div>


                <div class=" [&>*:nth-child(odd)]:bg-gray-200 [&>*:nth-child(even)]:bg-white text-lg">
                    <Show when={props.data}>
                        <For each={props.data?.infringementsAndComments}>
                            {
                                (item) =>
                                    <div class="px-2 py-3">
                                        <p>{item.infringement}</p>

                                        <Show when={item.comments}>
                                            <div class="border-t border-dashed border-gray-500 my-2"></div>
                                            <div class="ml-4 ">
                                                <span>&#x2192; </span><i>{item.comments}</i>
                                            </div>
                                        </Show>
                                    </div>
                            }
                        </For>
                    </Show>
                </div>
            </div>
        </div>
    )
}