export function string (given){

    return (!isNaN(given) ? given.toString() : (typeof given === "string" ? given : ""));
}

export const castString = (given) => {

    return (typeof given !== "object" && !isNaN(given && given.toString()) ? given.toString() : (typeof given === "string" ? given : undefined));
};