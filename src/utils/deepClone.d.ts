export type Code = {
    withProto: boolean;
    freeze: boolean;
};
export type Codes = {
    [key: number]: Code;
};
export declare const deepClone: any;
export default deepClone;
