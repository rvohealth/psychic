type NestedObject = {
    [k: string]: string | number | boolean | string[] | number[] | boolean[] | NestedObject;
};
export default function pathifyNestedObject(obj: NestedObject, prefix?: string): NestedObject;
export {};
