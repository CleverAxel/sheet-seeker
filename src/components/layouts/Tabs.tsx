import { Accessor, JSX, Setter } from "solid-js";
import { EnumTab } from "../../enums/tabs";

interface IProps {
    selectTab: Accessor<EnumTab>,
    setSelectTab: Setter<EnumTab>
}

export default function Tabs(props: IProps) {
    return (
        <nav class="text-sm sm:text-lg font-thin bg-gray-300 pt-2">
            <div class="max-w-5xl mx-auto overflow-x-auto ">
                <div class="flex min-w-96">
                    <Tab onClick={() => props.setSelectTab(EnumTab.fileHandler)} isActive={props.selectTab() == EnumTab.fileHandler}>
                        Importer les fichiers à rechercher
                    </Tab>
                    <Tab onClick={() => props.setSelectTab(EnumTab.searchSheets)} isActive={props.selectTab() == EnumTab.searchSheets}>
                        Réaliser une recherche parmi les fichiers importés
                    </Tab>
                </div>
            </div>
        </nav>
    );
}


interface _IProps {
    onClick: JSX.EventHandler<HTMLButtonElement, Event>,
    isActive: boolean,
    children: JSX.Element | string
}
function Tab(props: _IProps) {
    return (
        <button
            onClick={props.onClick}
            class={"hover:bg-gray-200 px-3 py-3 rounded-tl-md rounded-tr-md " + (props.isActive ? "bg-gray-100" : "")}>
            {props.children}
        </button>
    )
}