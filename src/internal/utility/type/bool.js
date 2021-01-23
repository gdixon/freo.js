export function bool(given) {

    return (given === true ? true : false);
}

export const castBool = (given) => {

    return (given === true ? true : (given === false ? false : undefined));
};