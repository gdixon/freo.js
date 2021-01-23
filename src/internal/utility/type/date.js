export function date (given) {

    return (given instanceof Date ? new Date(given) : new Date());
}

export const castDate = (given) => {

    return (given instanceof Date || !isNaN(given) ? new Date(given) : undefined);
};