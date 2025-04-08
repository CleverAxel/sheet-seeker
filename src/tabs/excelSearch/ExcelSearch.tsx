import { createEffect, createSignal, For, Show } from "solid-js";
import { IPropsExcelSearch } from "@/tabs/excelSearch/types";
import { DataRow } from "@/tabs/excelSearch/DataRow";
import { InfringementsDisplay } from "@/tabs/excelSearch/InfringementsDisplay";
import { IAuditVisitReport, IAuditVisitReportWithDuplicates } from "@/types/workbook";
import { AuditReportPdf } from "@/services/pdf/AuditReportPdf";
import { WorkBookSearch } from "@/services/search/WorkBookSearch";

export function ExcelSearch(props: IPropsExcelSearch) {
    const originalDocumentTitle = document.title;
    const soundSearchDone = new Audio(`${import.meta.env.BASE_URL}/notification_done.mp3`);
    const [isSeeking, setIsSeeking] = createSignal(false);
    const [processedSheetCount, setProcessedSheetCount] = createSignal(0);
    const [processedFileCount, setProcessedFileCount] = createSignal(0);
    const [totalFiles, setTotalFiles] = createSignal(0);
    const [referenceFoundCount, setReferenceFoundCount] = createSignal(0);

    const [auditVisitReports, setAuditVisitReports] = createSignal<IAuditVisitReportWithDuplicates[]>([]);
    const [singleVisitReport, setSingleVisitReport] = createSignal<IAuditVisitReport>();

    const [toggleInfringementsDisplay, setToggleInfringementsDisplay] = createSignal(false);
    let cabSearch = "";

    const sheetsToSkip = ["Liste cabines", "Phrases codifiées", "Données"];
    let inputRef!: HTMLInputElement;
    let progressBarRef!: HTMLDivElement;

    createEffect(() => {
        if (totalFiles()) {
            let progress = (processedFileCount() / totalFiles());
            let percent = Math.ceil(progress * 100);
            if (percent > 100) {
                percent = 100;
            }
            progressBarRef.style.transform = `scaleX(${progress})`;

            if (percent == 100) {                    
                document.title = `Fini - ${originalDocumentTitle}`;
            } else {
                document.title = `${percent}% - ${originalDocumentTitle}`;
            }
            // console.log(Math.ceil((processedFileCount() / totalFiles()) * 100));
        }

    })

    const onSearchClick = () => {
        cabSearch = inputRef.value.trim();
        if (isSeeking() || cabSearch == "") {
            return;
        }
        const files = props.callbackGetFiles();
        if (files.length == 0) {
            window.alert("Aucun fichier importé. Allez dans l'onglet 'Importer les fichiers à rechercher' pour y importer des fichiers.");
            return;
        }
        const now = Date.now();
        setAuditVisitReports([]);
        setIsSeeking(true)

        seek(files).then(() => {
            console.log("Took : " + (Date.now() - now).toString() + "ms");
            setIsSeeking(false);
        });
    }

    const seek = async (files: File[]) => {
        setTotalFiles(files.length);
        let workBook = new WorkBookSearch(files, sheetsToSkip);
        workBook.setSetters(setProcessedFileCount, setProcessedSheetCount, setReferenceFoundCount);
        let reports = await workBook.startSeeking(inputRef.value);
        soundSearchDone.play();
        setAuditVisitReports(workBook.filterUniqueReports(reports));
    }

    return (
        <div>
            <Show when={toggleInfringementsDisplay()}>
                <InfringementsDisplay data={singleVisitReport()} setToggleInfringementsDisplay={setToggleInfringementsDisplay}></InfringementsDisplay>
            </Show>
            <div class="max-w-5xl mx-auto px-2">
                <h3 class="font-thin text-2xl">Rentrez le numéro de cabine souhaité. Le programme vous renverra toutes les informations trouvés à partir du numéro donné.</h3>
                {/* <h3 class="font-thin italic text-xl mt-3">Plus le nombre de feuilles est important dans un fichier excel plus le programme mettra du temps à l'interpréter.</h3> */}
                {/* <h3 class="font-thin italic text-xl mt-3">
                    Un test a été effectué sur plus de 100 fichiers et plus 7000 feuilles. Le programme a pris plus ou moins une minute pour tout analyser. Ce test a été réalisé sur Windows 11 avec un processeur 4,20 GHz 8 Cores, avec 32GB de RAM DDR5 6400MHz.
                </h3> */}

                <Show when={!isSeeking()}>
                    <div class="max-w-lg mt-2 flex">
                        {/* //61R00132 */}
                        <input value={cabSearch} onkeydown={(e) => { if (e.key.toUpperCase() == "ENTER") { onSearchClick() } }} ref={inputRef} disabled={isSeeking()} class={`${isSeeking() ? "cursor-not-allowed opacity-40" : ""} w-full p-3 text-xl border border-slate-700`} type="text" placeholder="Numéro de cabine à rechercher" />
                        <button disabled={isSeeking()} onClick={onSearchClick} class={`${isSeeking() ? `cursor-not-allowed opacity-40` : `hover:bg-slate-600`}  w-11 bg-slate-700 shrink-0 p-2 `}>
                            <svg xmlns="http://www.w3.org/2000/svg" class="fill-white" viewBox="0 0 512 512"><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" /></svg>
                        </button>
                    </div>
                </Show>
                <Show when={isSeeking()}>
                    <div class="w-full rounded-full mt-2 overflow-hidden relative h-8 border border-slate-700">
                        <div class="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 ">
                            <div class="animation_loader"></div>
                        </div>
                        <div ref={progressBarRef} role="progressbar" class="bg-green-300  origin-left scale-0 w-full h-full transition-all">
                        </div>
                    </div>
                </Show>
                <Show when={isSeeking()}>
                    <div>
                        <b class="text-green-600">Recherche en cours...</b>
                    </div>
                </Show>
                <Show when={isSeeking() || processedFileCount() || processedSheetCount() || referenceFoundCount()}>
                    <div>
                        <i>{processedFileCount()} / {totalFiles()} fichier(s) traité(s) <Show when={!isSeeking()}><span class="text-green-700">&#x2713;</span></Show></i>
                    </div>
                    <div>
                        <i>{processedSheetCount()} feuille(s) traitée(s) <Show when={!isSeeking()}><span class="text-green-700">&#x2713;</span></Show></i>
                    </div>
                    <div>
                        <i>{referenceFoundCount()} référence(s) trouvée(s) <Show when={!isSeeking()}>{referenceFoundCount() != 0 ? <span class="text-green-700">&#x2713;</span> : <span class="text-red-700">&#x2715;</span>}</Show></i>
                    </div>
                </Show>
            </div>

            <div class="max-w-5xl mx-auto mt-5 px-2">
                <For each={auditVisitReports()}>
                    {(audit) =>
                        <>
                            <Show when={audit.duplicates.length != 0}> {/*The original is in the duplicate meh*/}
                                <div class="border-gray-500 border-t border-l p-2">
                                    <h5 class="font-thin">Nous avons probablement trouvé des fichiers doublons pour ce rapport avec les mêmes données :</h5>
                                    <ul class="pl-4 list-disc text-sm">
                                        <For each={audit.duplicates}>
                                            {(duplicate) =>
                                                <li>{duplicate.filename} (<b>{duplicate.sheetName}</b>)</li>
                                            }
                                        </For>
                                    </ul>
                                </div>
                            </Show>
                            <div class={"flex  gap-1 items-end p-2 " + (audit.duplicates.length != 0 ? "border-gray-500 border-l" : "")}>
                                <h5 class="font-thin text-lg">Télécharger au format PDF :</h5>
                                <button onClick={() => AuditReportPdf.generate(audit.report)} class="w-8 h-8 fill-red-500 hover:fill-red-400">
                                    <svg class="w-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 144-208 0c-35.3 0-64 28.7-64 64l0 144-48 0c-35.3 0-64-28.7-64-64L0 64zm384 64l-128 0L256 0 384 128zM176 352l32 0c30.9 0 56 25.1 56 56s-25.1 56-56 56l-16 0 0 32c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-48 0-80c0-8.8 7.2-16 16-16zm32 80c13.3 0 24-10.7 24-24s-10.7-24-24-24l-16 0 0 48 16 0zm96-80l32 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-32 0c-8.8 0-16-7.2-16-16l0-128c0-8.8 7.2-16 16-16zm32 128c8.8 0 16-7.2 16-16l0-64c0-8.8-7.2-16-16-16l-16 0 0 96 16 0zm80-112c0-8.8 7.2-16 16-16l48 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 32 32 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 48c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-64 0-64z" /></svg>
                                </button>
                            </div>
                            <div class="bg-white shadow-lg overflow-hidden mb-8 rounded-md">
                                <DataRow title="Nom de fichier">{audit.report.filename}</DataRow>
                                <DataRow title="Nom de la feuille">{audit.report.sheetName}</DataRow>
                                <DataRow title="Ordre de mission">{audit.report.assignmentOrder}</DataRow>
                                <DataRow title="Numéro de cabine">{audit.report.cabNumber}</DataRow>
                                <DataRow title="Adresse">{audit.report.address}</DataRow>
                                <DataRow title="Date de visite">{audit.report.date}</DataRow>
                                <DataRow title="Effectué par">{audit.report.technician}</DataRow>
                                <DataRow title="Base d'examen">{audit.report.baseOfReview}</DataRow>
                                <DataRow title="Article de référence">{audit.report.referenceArticle}</DataRow>
                                <DataRow title="Schéma de mise à la terre">{audit.report.groundDiagram}</DataRow>
                                <DataRow title="Tension de service">{audit.report.operatingVoltage}</DataRow>
                                <DataRow title="Dispositif de mise à la terre">{audit.report.groundingDevice}</DataRow>
                                <DataRow title="Mesure de terre déconnectée">{audit.report.disconnectedGroundMeasurement}</DataRow>
                                <DataRow title="Conclusion">{audit.report.conclusion}</DataRow>
                                <button onClick={() => {
                                    setToggleInfringementsDisplay(true);
                                    setSingleVisitReport(audit.report);
                                }} class="w-full text-center bg-slate-700 text-lg text-white uppercase font-black py-2 px-1 hover:bg-slate-600">
                                    Voir les infractions/remarques
                                </button>
                            </div>
                        </>
                    }
                </For>
            </div>
        </div>
    );
}