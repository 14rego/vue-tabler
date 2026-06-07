import { reactive } from "vue";
import { cloneDeep } from "lodash";
import { TablerDto } from "./types";

export const TablerDefaults: TablerDto = {
    columns: {
        data: {
            title: "",
            column: "",
            type: "String",
        },
        style: {
            head: {
                classes: "px-2 py-1",
                xAlign: "center",
                yAlign: "bottom",
                formatter: null
            },
            body: {
                classes: "px-2 py-1",
                xAlign: "left",
                yAlign: "middle",
                formatter: null
            }
        },
        sort: {
            current: false,
            asc: false,
            hide: false
        },
        events: []
    },
    filters: {
        element: {
            identifier: "",
            type: "",
        },
        ajax: {
            param: "",
            transformer: (val: any) => {
                return val;
            }
        },
        current: {
            field: "",
            type: "",
            value: "",
        },
        default: {
            field: "",
            type: "",
            value: "",
        }
    },
    options: {
        rowKey: "id",
        disable: {
            head: false,
            body: false,
            paging: false
        },
        style: {
            type: "table",
            classes: "",
            formatter: null
        },
        ajax: {
            remote: false,
            url: null,
            type: "GET",
            params: "String",
            responseMap: {
                data: "", // map response.data.x to rows
                count: "", // total unpaginated row count = response.data.x
            },
            after: null
        },
        transformer: null, // must return row
        initCallback: null
    },
    paging: {
        skip: 0,
        take: 999,
        page: 1,
        options: [
            10,
            25,
            50,
            100,
            250,
            500
        ],
        start: 1,
        end: 999,
        last: 1,
        list: [],
        count: 0
    },
    table: {
        id: "foo",
        version: 0,
        loading: true,
        querying: false,
        head: [],
        body: [],
        filtered: [],
        filters: [],
        options: {
            rowKey: "",
            disable: {
                head: false,
                body: false,
                paging: false
            },
            style: {
                type: "table",
                classes: "",
                formatter: null
            },
            ajax: {
                remote: false,
                url: null,
                type: "GET",
                params: "String",
                responseMap: {
                    data: "", // map response.data.x to rows
                    count: "", // total unpaginated row count = response.data.x
                },
                after: null
            },
            transformer: null,
            initCallback: undefined
        },
        paging: {
            skip: 0,
            take: 0,
            page: 0,
            options: [],
            start: 0,
            end: 0,
            last: 0,
            list: [],
            count: 0
        }
    }
};

TablerDefaults.table.options = cloneDeep(TablerDefaults.options);
TablerDefaults.table.paging = cloneDeep(TablerDefaults.paging);

export const TablerData = reactive<any[]>([]);

// Used for debugging in the browser console
(window as any).TablerData = TablerData;