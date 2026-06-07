export type TablerRow = Record<string, any>;

export interface TablerColumnDataDto {
  title: string;
  column: string;
  type: string;
}

export interface TablerColumnStylePartDto {
  classes: string;
  xAlign: string;
  yAlign: string;
  formatter: ((val: any) => any) | null;
}

export interface TablerColumnStyleDto {
  head: TablerColumnStylePartDto;
  body: TablerColumnStylePartDto;
}

export interface TablerColumnSortDto {
  current: boolean;
  asc: boolean;
  hide: boolean;
}

export interface TablerColumnDto {
  data: TablerColumnDataDto;
  style: TablerColumnStyleDto;
  sort: TablerColumnSortDto;
  events: any[];
}

export interface TablerFilterElementDto {
  identifier: string;
  type: string;
}

export interface TablerFilterAjaxDto {
  param: string;
  transformer: (val: any) => any;
}

export interface TablerFilterCurrentDefaultDto {
  field: string;
  type: string;
  value: any;
}

export interface TablerFiltersDto {
  element: TablerFilterElementDto;
  ajax: TablerFilterAjaxDto;
  current: TablerFilterCurrentDefaultDto;
  default: TablerFilterCurrentDefaultDto;
}

export interface TablerOptionsDisableDto {
  head: boolean;
  body: boolean;
  paging: boolean;
}

export interface TablerOptionsStyleDto {
  type: string;
  classes: string;
  formatter: ((val: any) => any) | null;
}

export interface TablerOptionsAjaxResponseMapDto {
  data: string;
  count: string;
}

export interface TablerOptionsAjaxDto {
  remote: boolean;
  url: string | null;
  type: string;
  params: string;
  responseMap: TablerOptionsAjaxResponseMapDto;
  after: any | null;
}

export interface TablerOptionsDto {
  rowKey: string;
  disable: TablerOptionsDisableDto;
  style: TablerOptionsStyleDto;
  ajax: TablerOptionsAjaxDto;
  transformer: ((row: any) => any) | null;
  initCallback: any | null;
}

export interface TablerPagingDto {
  skip: number;
  take: number;
  page: number;
  options: number[];
  start: number;
  end: number;
  last: number;
  list: any[];
  count: number;
}

export interface TablerInstanceDto {
  id: string;
  version: number;
  loading: boolean;
  querying: boolean;
  head: any[];
  body: any[];
  filtered: any[];
  filters: any[];
  options: TablerOptionsDto;
  paging: TablerPagingDto;
}

export interface TablerDto {
  columns: TablerColumnDto[];
  filters: TablerFiltersDto[];
  options: TablerOptionsDto;
  paging: TablerPagingDto;
  table: TablerInstanceDto;
}

export default {} as {};
