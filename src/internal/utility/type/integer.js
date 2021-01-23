export function integer (given) {

    return (typeof given !== "object" && !isNaN(given.toString()) ? parseInt(given) : 0);
}

export const castInteger = (given) => {

    return (given instanceof Date || typeof given !== "object" && !isNaN(given) ? parseInt(given) : undefined);
};