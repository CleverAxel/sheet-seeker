import { IPropsDataRow } from "@/tabs/excelSearch/types"

export function DataRow(props: IPropsDataRow) {
    return (
        <div class="flex items-start border-b border-gray-400 last:border-b-0">
            <div class="bg-gray-800 p-3 self-stretch text-sm sm:text-xl text-center sm:w-64 shrink-0 w-40 text-white"><b>{props.title}</b></div>
            <div class="grow p-3 bg-white"><span>{props.children ?? "-"}</span></div>
        </div>
    )
}