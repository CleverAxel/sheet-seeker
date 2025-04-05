import { createSignal } from 'solid-js'
import "./extensions/string.extension"
import Header from "./components/layouts/Header"
import Tabs from "./components/layouts/Tabs"
import { EnumTab } from "./enums/tabs";
import FileHandler, { FileHandlerRef } from "./components/FileHandler";
import SearchSheets from "./components/SearchSheets";



function App() {
    const [selectTab, setSelectedTab] = createSignal(EnumTab.fileHandler);
    let fileComponentRef: FileHandlerRef | undefined;

    const getFiles = () => {
        return fileComponentRef!.getFiles();
    }

    return (
        <>
            <Header></Header>
            <Tabs selectTab={selectTab} setSelectTab={setSelectedTab}></Tabs>

            <div hidden={selectTab() != EnumTab.fileHandler}>
                <FileHandler ref={fileComponentRef}></FileHandler>
            </div>
            <div hidden={selectTab() != EnumTab.searchSheets}>
                <SearchSheets callbackGetFiles={getFiles}></SearchSheets>
            </div>
        </>
    )
}

export default App
