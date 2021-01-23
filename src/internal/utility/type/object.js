import { merge } from "../merge.js";

export function object (given) {

    return (typeof given == "object" ? merge({}, given) : {});
}

export const castObject = (given) => {

    return (typeof given === "object" && !Array.isArray(given) && !(given instanceof Date) && !(given instanceof ArrayBuffer) ? merge({}, given) : undefined);
};