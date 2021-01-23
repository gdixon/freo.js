import { merge } from "../merge.js";

export function array (given) {

    return (Array.isArray(given) ? merge([], given) : []);
}

export const castArray = (given) => {

    return (Array.isArray(given) ? merge([], given) : undefined);
};