import { Content } from 'innet';
interface WatchTarget<R = any> {
    (update?: boolean): R;
}
declare type OfPropStatic<T = any> = T[] | Set<T>;
declare type OfProp<T = any> = OfPropStatic<T> | WatchTarget<OfPropStatic<T>>;
interface ForProps<T = any> {
    of: OfProp<T>;
    else?: Content;
    size?: number | WatchTarget<number>;
    key?: keyof T | ((item: T) => any);
}
declare function For(target: any, parent: any, plugins: any, plugin: any): void;
export default For;
export { ForProps };
