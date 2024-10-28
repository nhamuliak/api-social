export interface PaginationModel<T = unknown> {
    records: T[];
    total: number;
}
