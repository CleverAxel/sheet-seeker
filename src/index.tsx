/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import App from './App.tsx'

const root = document.getElementById('root');
// const webworker = new Worker(new URL("./services/WebWorkerExcel.ts", import.meta.url));
// console.log(webworker);
// webworker.postMessage({file: new File([], ""), search: ""});
// webworker.onmessage = (e) => {
//     console.log(e.data);
    
// }

render(() => <App />, root!)
