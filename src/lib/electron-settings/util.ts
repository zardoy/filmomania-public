export const filterValues = <K extends any>(obj: Record<string, K>, filterFn: (key: string, value: K) => boolean) => {
    return Object.fromEntries(
        Object.entries(obj).filter(arr => filterFn(...arr))
    );
};

export const isStringOneOf = <T extends string>(input: T, positiveVariants: T[]) => positiveVariants.includes(input);
