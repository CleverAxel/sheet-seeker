import { For, onMount, Show } from "solid-js";
import { IPropsInfringementsDisplay } from "@/tabs/excelSearch/types";
import { clickOutside } from "@/directives/clickOutside";

true && clickOutside;

export function InfringementsDisplay(props: IPropsInfringementsDisplay) {
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
        <div ref={refContainer} class="fixed top-0 left-0 z-50 w-full h-full transition-all duration-150  pointer-events-none">
            <div use:clickOutside={close} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} class="pointer-events-auto bg-white transition-all max-w-lg duration-100 h-full overflow-y-auto -translate-x-full" ref={refContent}>
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
                                        <p><b>Remarque/Infraction : </b>{item.infringement}</p>

                                        <Show when={item.comments}>
                                            <div class="border-t border-dashed border-gray-500 my-2"></div>
                                            <div class="ml-4 ">
                                                <b>&#x2192; Commentaire : </b><i>{item.comments}</i>
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