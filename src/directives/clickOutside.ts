import { onCleanup } from "solid-js";

export function clickOutside(el:any, accessor:any) {
    const onClick = (e:Event) => !el.contains(e.target) && accessor()?.();
    document.body.addEventListener("click", onClick);
  
    onCleanup(() => document.body.removeEventListener("click", onClick));
  }