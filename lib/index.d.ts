interface WatchTarget<R = any> {
    (update?: boolean): R;
}
declare type OfPropStatic<T = any> = T[] | Set<T>;
declare type OfProp<T = any> = OfPropStatic<T> | WatchTarget<OfPropStatic<T>>;
export interface ForProps<T = any> {
    of: OfProp<T>;
    size?: number | WatchTarget<number>;
    key?: keyof T | ((item: T) => any);
}
declare function For({ children: [callback, ...elseProp], props: { size: sizeProp, key, of: ofProp, } }: {
    children: [any, ...any[]];
    props: {
        size?: number;
        key: any;
        of: any;
    };
}, parent: any, plugins: any, plugin: any): void;
export default For;
