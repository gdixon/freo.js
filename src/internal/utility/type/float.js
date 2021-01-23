export function float (given) {

    return (typeof given !== "object" && !isNaN(given.toString()) ? parseFloat(given) : 0);
}

export const castFloat = (given) => {

    return (typeof given !== "object" && !isNaN(given && given.toString()) ? parseFloat(given) : undefined);
};