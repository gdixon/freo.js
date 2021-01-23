import { clone } from "../clone.js";

export function arrayBuffer(given) {

    return (given && given instanceof ArrayBuffer ? clone(given) : new ArrayBuffer());
}

export const castArrayBuffer = (given) => {

    return (given && given instanceof ArrayBuffer ? clone(given) : undefined);
};