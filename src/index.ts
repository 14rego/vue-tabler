import dayjs from "dayjs";
import { cloneDeep, merge, get, set } from "lodash";
import axios from "axios";
import { Router } from "vue-router";
import { TablerData, TablerDefaults } from "./store";
import type { TablerInstanceDto, TablerFiltersDto, TablerColumnDto, TablerPagingDto, TablerOptionsDto } from "./types";

/**
 * Tabler
 * @namespace Tabler
 * @module Tabler
 */

const Tabler: any = {};

const shouldDebug = false;
const visible = "TablerShowRow";

/** 
 */
Tabler.addRows = (id: string, arr: any[], shouldReplace: boolean = false) => {
    let i = Tabler.get(id);
    if (!i) return false;
    let placeholder = shouldReplace ? [] : cloneDeep(i.body);
    i.loading = true;
    arr.forEach(row => {
        row[visible] = true;
        if (!shouldReplace) {
            let old = Tabler.getRow(id, row[i.options.rowKey], placeholder);
            if (old) {
                placeholder = placeholder.filter((z: any) => z[i.options.rowKey] != old[i.options.rowKey]); // filter out old
                row[visible] = old[visible];
            }
        }
        if (i.options.transformer) row = i.options.transformer(row);
        placeholder.push(row);
    });
    i.body = cloneDeep(placeholder);
    Tabler.updateAllUI(id, i);
    i.loading = false;
    if (shouldDebug) console.debug("addRows", arr.length);
};

const waitForElement = (tableId: string, selector: string) => {
    let waitMax = 2500,
        waitInc = 50,
        waitCount = 0;
    if (shouldDebug) console.debug("waiting start", selector);
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            waitCount += waitInc;
            const Tabler = document.getElementById(tableId);
            if (Tabler || waitCount >= waitMax) {
                const elements = Array.from(Tabler?.querySelectorAll(selector) || []);
                if (elements.length > 0 || waitCount >= waitMax) {
                    if (shouldDebug && elements.length > 0) console.debug("waiting found", selector, waitCount);
                    else if (shouldDebug && waitCount >= waitMax) console.debug("waiting expired", selector, waitMax);
                    clearInterval(interval);
                    resolve(elements);
                }
            }
        }, waitInc);
    });
};

/** 
 */
Tabler.attachEvents = (i: TablerInstanceDto) => {
    if (!i) return false;
    i.head.forEach(col => {
        col.events.forEach((e: any) => {
            waitForElement(i.id, e.selector).then((elements: unknown) => {
                    const els = elements as HTMLElement[];
                    els.forEach((el) => {
                        el.removeEventListener(e.type, e.callback);
                        el.addEventListener(e.type, e.callback);
                    });
                if (shouldDebug) console.debug("attachEvents", i.id, e.selector);
            });
        });
    });
};

/**
 */
Tabler.buildFilterAjaxParams = (id: string, form: string) => {
    let i = Tabler.get(id);
    if (!i) return null;
    let q: any = form == "object" ? {} : ``;
    i.filters.forEach((g: TablerFiltersDto) => {
        if (g.current.value !== "" && g.ajax.param != "") {
            if (form == "object") q[g.ajax.param] = g.current.value;
            else q += `&${g.ajax.param}=${g.current.value}`;
        }
    });
    if (shouldDebug) console.debug("buildFilterAjaxParams", q);
    if (form == "object") return q;
    else return encodeURI(q);
};

/** 
 */
Tabler.changedFilters = (id: string, elementId: string | null = null) => {
    let i = Tabler.get(id);
    if (!i) return null;
    Tabler.getFilterDomValues(id, elementId);
    Tabler.changePage(id, 1);
    if (i.options.ajax.remote) Tabler.refreshData(id);
    else Tabler.updateAllUI(id, i);
    if (shouldDebug) console.debug("changedFilters", i.version);
    return i;
};

/** 
 */
Tabler.changePage = (id: string, n: string | number) => {
    let i = Tabler.get(id);
    if (!i) return null;
    i.loading = true;
    if (n == "first") i.paging.page = 1;
    else if (n == "prev") i.paging.page--;
    else if (n == "next") i.paging.page++;
    else if (n == "last") i.paging.page = i.paging.last;
    else i.paging.page = +n;

    i.paging.skip = (i.paging.page - 1) * i.paging.take;
    if (i.options.ajax.remote) Tabler.refreshData(id);
    else {
        Tabler.paginate(i);
        Tabler.attachEvents(i);
    }
    i.loading = false;
    if (shouldDebug) console.debug("changePage", n);
    return i;
};

/** 
 */
Tabler.changeSort = (id: string, col: any) => {
    let i = Tabler.get(id);
    if (!i) return null;
    i.loading = true;
    const th = i.head.find((c: TablerColumnDto) => c.data.column == col.data.column);
    if (th) {
        i.head.forEach((c: TablerColumnDto) => c.sort.current = false);
        th.sort.current = true;
        th.sort.asc = !th.sort.asc;
    }
    if (i.options.ajax.remote) Tabler.refreshData(id);
    else Tabler.updateAllUI(id, i);
    i.loading = false;
    if (shouldDebug) console.debug("changeSort", col.data.column);
    return i;
};

/** 
 */
Tabler.changeTake = (id: string, n: string | number) => {
    let i = Tabler.get(id);
    if (!i) return null;
    i.loading = true;
    i.paging.take = Math.min(+n, 1000); // never allow more than
    Tabler.changePage(id, 1);
    i.loading = false;
    if (shouldDebug) console.debug("changeTake", n);
    return i;
};

/** 
 */
Tabler.deleteRow = (id: string, rowIder: string) => {
    if (shouldDebug) console.debug("deleteRow", rowIder);
    return Tabler.updateRow(id, rowIder, null);
};

/** 
 */
Tabler.get = (id: string, key: string | null = null) => {
    let i = TablerData.find(d => d.id == id);
    if (!i) return null;
    else if (!key) return i;
    else return get(i, key);
};

/** 
 */
Tabler.getFilterDomValues = (id: string, elementId: string | null = null) => {
    let i = Tabler.get(id),
        list = [];
    if (!i) return null;
    if (elementId) list.push(i.filters.find((g: TablerFiltersDto) => g.element.identifier == elementId));
    else list = cloneDeep(i.filters);
    let returning: any[] = [];
    list.forEach((grp: TablerFiltersDto) => {
        let domByID: HTMLElement | null = document.getElementById(grp.element.identifier),
            domByName: HTMLElement[] = Array.from(document.getElementsByName(grp.element.identifier));
        if (domByID || domByName.length > 0) {
            switch (grp.element.type) {
                case "select":
                    if (domByID instanceof HTMLSelectElement) {
                        if (domByID.selectedIndex < 0) grp.current.value = "";
                        else {
                            if (domByID.multiple) {
                                grp.current.value = Array.from(domByID.selectedOptions).map(({ value }) => Tabler.parseTypedValue(value));
                            } else {
                                grp.current.value = Tabler.parseTypedValue(domByID.options[domByID.selectedIndex].value);
                            }
                        }
                    } else {
                        grp.current.value = "";
                    }
                    break;
                case "toggle":
                    if (domByID instanceof HTMLInputElement) {
                        let theTrue = domByID.hasAttribute("true-value") ? Tabler.parseTypedValue(domByID.getAttribute("true-value")) : true;
                        let theFalse = domByID.hasAttribute("false-value") ? Tabler.parseTypedValue(domByID.getAttribute("false-value")) : false;
                        grp.current.value = domByID.checked ? theTrue : theFalse;
                    } else {
                        grp.current.value = "";
                    }
                    break;
                case "checkbox":
                    if (domByID instanceof HTMLInputElement) {
                        grp.current.value = domByID.checked ? Tabler.parseTypedValue(domByID.value) : "";
                    } else {
                        let vals: any[] = [];
                        domByName.forEach((el) => {
                            const input = el as HTMLInputElement;
                            if (input.checked) vals.push(Tabler.parseTypedValue(input.value));
                        });
                        grp.current.value = vals;
                    }
                    break;
                case "radio":
                    if (domByID instanceof HTMLInputElement) {
                        grp.current.value = domByID.checked ? Tabler.parseTypedValue(domByID.value) : "";
                    } else {
                        let val: any = false;
                        domByName.forEach((el) => {
                            const input = el as HTMLInputElement;
                            if (input.checked) val = Tabler.parseTypedValue(input.value);
                        });
                        grp.current.value = val;
                    }
                    break;
                case "static":
                    grp.current.value = grp.default.value;
                    break;
                default:
                    if (domByID instanceof HTMLInputElement || domByID instanceof HTMLTextAreaElement || domByID instanceof HTMLSelectElement) {
                        grp.current.value = domByID.value;
                    } else {
                        grp.current.value = "";
                    }
                    break;
            }
            i.filters.find((g: TablerFiltersDto) => g.element.identifier == grp.element.identifier).current = grp.current;
        }
        if (shouldDebug) console.debug("getFilterDomValues", elementId, grp.current.value);
        returning.push(grp.current.value);
    });
    if (returning.length == 1 || elementId) return returning[0];
    return returning;
};

/**
 */
Tabler.getFilterQueryParams = (router: Router, id: string) => {
    let i = Tabler.get(id);
    if (!i) return null;
    const query = router.currentRoute.value.query;
    let hasParams = false;
    Object.keys(query).forEach((k) => {
        const match = i.filters.find((g: TablerFiltersDto) => g.default.field == k),
            likeSearch = i.filters.find((g: TablerFiltersDto) => g.default.type == "like" && g.element.identifier == "FilterTextSearch");
        // there is one exception where "FilterFieldSearch" sets the "FilterTextSearch" field
        if (match) {
            Tabler.setFilterDom(match, query[k]);
        } else if (likeSearch) {
            const filterFieldSearch = document.getElementById("FilterFieldSearch") as HTMLInputElement;
            if (filterFieldSearch) filterFieldSearch.value = k;
            likeSearch.default.field = k;
            Tabler.setFilterField(id, "FilterFieldSearch", "FilterTextSearch");
            Tabler.setFilterDom(likeSearch, query[k]);
        }
        hasParams = true;
    });
    return hasParams;
};

/** 
 */
Tabler.rowFinder = (i: any, rowIder: string) => {
    return ((r: any) => r[i.options.rowKey] == rowIder);
};

/** 
 */
Tabler.getRow = (id: string, rowIder: string, body: any[] | null = null) => {
    let i = Tabler.get(id);
    if (!i) return null;
    if (body) return body.find(Tabler.rowFinder(i, rowIder));
    return i.body.find(Tabler.rowFinder(i, rowIder));
};

/** 
 */
Tabler.init = (id: string, head: any[], paging: TablerPagingDto | null = null, filters: TablerFiltersDto[] | null = null, options: TablerOptionsDto | null = null) => {
    Tabler.unset(id);
    let x = merge({}, TablerDefaults.table, {
        id: id
    });
    head.forEach((col: TablerColumnDto) => {
        x.head.push(merge({}, TablerDefaults.columns, col));
    });
    if (paging) x.paging = merge({}, TablerDefaults.paging, paging);
    if (paging?.options) x.paging.options = paging.options;
    if (filters) filters.forEach((grp: TablerFiltersDto) => {
        x.filters.push(merge({}, TablerDefaults.filters, grp, {
            current: cloneDeep(grp.default) 
        }));
    });
    if (options) x.options = merge({}, TablerDefaults.options, options);
    x.loading = false;
    TablerData.push(x);
    Tabler.resetFilters(id);
    if (options?.initCallback) setTimeout(() => options.initCallback(), 500);
    if (shouldDebug) console.debug("init", id);
};

/** 
 */
Tabler.isIndexShown = (i: any, ind: number) => {
    return (ind + 1) >= i.paging.start && (ind + 1) <= i.paging.end;
};

/** 
 */
Tabler.moveRow = (fromId: string, toId: string, rowIder: string) => {
    const old = Tabler.getRow(fromId, rowIder);
    if (old) {
        Tabler.addRows(toId, [old], false);
        Tabler.deleteRow(fromId, rowIder);
    }
    if (shouldDebug) console.debug("moveRow", rowIder);
};

/** 
 */
Tabler.paginate = (i: any) => {
    if (!i) return null;
    if (i.options.ajax.remote) {
        i.paging.start = 1;
        i.paging.end = i.paging.take;
    } else {
        i.paging.start = i.paging.skip + 1;
        i.paging.end = Math.min(
            (i.paging.skip + i.paging.take),
            i.filtered.length // not more than total tho
        );
        i.paging.count = i.filtered.length;
    }
    i.paging.last = Math.ceil(i.paging.count / i.paging.take);
    i.paging.list = [];
    for (let x = -2; x < 3; x++) {
        let proposed = i.paging.page + x;
        if (proposed > 0 && proposed <= i.paging.last) i.paging.list.push(proposed);
    }
    if (i.paging.take < i.body.length && i.paging.options.indexOf(i.paging.take) < 0) i.paging.options.push(i.paging.take);
    if (shouldDebug) console.debug("paginate");
};

/**
 * If the string represents a boolean or number (likely an ID), parse it please
 * @param {string} strValue    The value from a DOM input field
 * @returns {object} strValue  *IF* the string is a valid number or boolean, return it as such
 */
Tabler.parseTypedValue = (strValue: any) => {
    if (strValue.toString().toLowerCase() == "true") {
        return true;
    } else if (strValue.toString().toLowerCase() == "false") {
        return false;
    } else if (!isNaN(parseFloat(strValue)) && isFinite(strValue)) {
        return parseFloat(strValue);
    }
    return strValue;
};

/** 
 */
Tabler.refreshData = (id: string) => {
    let i = Tabler.get(id);
    if (!i || i.querying || !i.options.ajax.remote) return null;
    i.querying = true;
    i.loading = true;
    let isQueryString = i.options.ajax.params == "String";
    Tabler.getFilterDomValues(id);
    const buildQuery = () => {
        if (isQueryString) {
            let params: string = "?";
            params += `&Skip=${i.paging.skip}&Take=${i.paging.take}&Page=${i.paging.page}`;
            i.filters.forEach((f: TablerFiltersDto) => {
                let v = f.ajax.transformer(f.current.value);
                if (v !== "") {
                    if (typeof v == "object" && v.length > 0) {
                        v.forEach((x: any) => {
                            params += `&${f.ajax.param}=${x.toString()}`;
                        });
                    } else params += `&${f.ajax.param}=${v.toString()}`;
                }
            });
            if (shouldDebug) console.debug(params);
        } else {
            let params: TablerPagingDto = cloneDeep(TablerDefaults.paging);
            params.skip = i.paging.skip;
            params.take = i.paging.take;
            params.page = i.paging.page;
            i.filters.forEach((f: TablerFiltersDto) => {
                let v = f.ajax.transformer(f.current.value);
                if (v !== "") {
                    set(params, f.ajax.param, v);
                }
            });
            if (shouldDebug) console.debug(params);
        }
    };
    if (i.options.ajax.type == "GET") {
        axios.get(`${i.options.ajax.url}${buildQuery()}`)
            .then(res => {
                if (shouldDebug) console.debug(res.data);
                let rows = i.options.ajax.responseMap.data != "" ? get(res.data, i.options.ajax.responseMap.data) : res.data;
                i.paging.count = i.options.ajax.responseMap.count != "" ? get(res.data, i.options.ajax.responseMap.count) : rows.length;
                Tabler.addRows(id, rows, true);
                if (i.options.ajax.after) i.options.ajax.after(res.data);
                i.querying = false;
                i.loading = false;
            });
    }
    if (shouldDebug) console.debug("refreshData");
    return i;
};

/** 
 */
Tabler.resetFilters = (id: string) => {
    let i = Tabler.get(id);
    if (!i) return null;
    i.filters.forEach((group: TablerFiltersDto) => {
        group.current = cloneDeep(group.default);  // Directly modify the original group
        Tabler.setFilterDom(group, group.current.value);
    });
    Tabler.changedFilters(id);
    if (shouldDebug) console.debug("resetFilters");
    return i;
};

/** 
 */
Tabler.setFilterDom = (group: TablerFiltersDto, val: any) => {
    let domByID = document.getElementById(group.element.identifier),
        domByName = Array.from(document.getElementsByName(group.element.identifier)) as HTMLInputElement[];
    if (domByID || domByName.length > 0) {
        switch (group.element.type) {
            case "select":
                if (domByID && domByID instanceof HTMLSelectElement) {
                    Array.from(domByID.options).forEach((o: HTMLOptionElement, i: number) => {
                        if (o.value == val) {
                            o.selected = true;
                            domByID.selectedIndex = i;
                        }
                    });
                    domByID.value = val;
                }
                break;
            case "toggle":
                if (domByID && domByID instanceof HTMLInputElement) {
                    let theTrue = domByID.hasAttribute("true-value") ? Tabler.parseTypedValue(domByID.getAttribute("true-value")) : true;
                    domByID.checked = (val == theTrue);
                    if (!domByID.checked) domByID.removeAttribute("checked");
                }
                break;
            case "checkbox":
            case "radio":
                if (domByID && domByID instanceof HTMLInputElement) {
                    domByID.checked = typeof val == "object" ? val.includes(Tabler.parseTypedValue(domByID.value)) : Tabler.parseTypedValue(domByID.value) == Tabler.parseTypedValue(val);
                    if (!domByID.checked) domByID.removeAttribute("checked");
                } else {
                    domByName.forEach((el: HTMLInputElement, i: number) => {
                        el.checked = val.includes(Tabler.parseTypedValue(el.value));
                        if (!el.checked) el.removeAttribute("checked");
                    });
                }
                break;
            case "static":
                // nothing changes for static
                break;
            case "date":
                if (domByID && domByID instanceof HTMLInputElement) {
                    if (val == "") domByID.value = "";
                    else domByID.value = val;
                }
                break;
            default:
                if (domByID && (domByID instanceof HTMLInputElement || domByID instanceof HTMLSelectElement)) domByID.value = val;
                break;
        }
    }
    if (shouldDebug) console.debug("setFilterDom", group.element.identifier);
};

/** 
 */
Tabler.setFiltered = (i: TablerInstanceDto) => {
    if (!i) return false;
    if (i.filters.length < 1 || i.options.ajax.remote) i.body.forEach(rw => rw[visible] = true);
    else i.body.forEach((rw: any, index: number) => rw[visible] = i.filters.every((grp: TablerFiltersDto) => {
        if (
            grp.current.field == "" ||
            grp.current.value === "" ||
            (Array.isArray(grp.current.value) && grp.current.value.length === 0)
        ) return true;
        const v = get(rw, grp.current.field);
        switch (grp.current.type) {
            case "=":
                if (grp.element.type == "date") return dayjs(v).isSame(grp.current.value, "day");
                return v == grp.current.value;
                break;
            case "!=":
                if (grp.element.type == "date") return !dayjs(v).isSame(grp.current.value, "day");
                return v != grp.current.value;
                break;
            case "<=":
                if (grp.element.type == "date") return dayjs(v).isSame(grp.current.value) || dayjs(v).isBefore(grp.current.value);
                return +v <= +grp.current.value;
                break;
            case ">=":
                if (grp.element.type == "date") return dayjs(v).isSame(grp.current.value) || dayjs(v).isAfter(grp.current.value);
                return +v >= +grp.current.value;
                break;
            case "like":
                return v.toLowerCase().indexOf(grp.current.value.toLowerCase()) >= 0;
                break;
            case "starts":
                return v.toLowerCase().indexOf(grp.current.value.toLowerCase()) == 0;
                break;
            case "in":
                if (typeof v == "object" && typeof grp.current.value == "object") return grp.current.value.some((item: any) => v.includes(item));
                else return grp.current.value.includes(v);
                break;
            default:
                console.warn("Unknown type:", grp.current.type);
        }
    }));
    i.filtered = i.body.filter(r => get(r, visible) != false);
    if (shouldDebug) console.debug("setFiltered", i.filtered.length, i.body.length);
};

/**
 */
Tabler.setFilterQueryParams = (router: Router, id: string) => {
    let i = Tabler.get(id);
    if (!i) return null;
    const q: any = {};
    i.filters.forEach((g: TablerFiltersDto) => {
        q[g.current.field] = g.current.value;
    });
    router.replace({ 
        name: router.currentRoute.value.name || "", 
        query: q 
    });
    return q;
};

/**
 */
Tabler.setFilterField = (id: string, getterId: string, setterId: string) => {
    let i = Tabler.get(id);
    if (!i) return null;
    let getEl = document.getElementById(getterId) as HTMLInputElement,
        filt = i.filters.find((f: TablerFiltersDto) => f.element.identifier == setterId);
    if (getEl && filt) {
        filt.current.field = getEl.value;
        Tabler.changedFilters(id, setterId);
    }
    if (shouldDebug) console.debug("setFilterField", setterId);
};

/** 
 */
Tabler.set = (id: string, key: string, val: any) => {
    set(Tabler.get(id), key, val);
};

/** 
 */
Tabler.sortBody = (i: TablerInstanceDto, col: TablerColumnDto | null = null) => {
    if (!i) return null;
    const current = (!col) ?
        i.head.find((c: TablerColumnDto) => c.sort.current == true) :
        i.head.find((c: TablerColumnDto) => c.data.column == col.data.column);
    if (current) {
        i.body.sort((a, b) => {
            let va = get(a, current.data.column),
                vb = get(b, current.data.column);
            if (current.data.type == "String") {
                va = va?.toString().toLowerCase().replace(/\s/, "") || "";
                vb = vb?.toString().toLowerCase().replace(/\s/, "") || "";
            }
            if (va === vb) return 0;
            else if (va === undefined || va === null || va === "null") return (current.sort.asc ? -1 : 1);
            else if (vb === undefined || vb === null || vb === "null") return (current.sort.asc ? 1 : -1);
            switch (current.data.type) {
                case "Date":
                case "Time":
                case "DateTime":
                    let aAsUnix = dayjs(va).unix(),
                        bAsUnix = dayjs(vb).unix();
                    return current.sort.asc ? aAsUnix - bAsUnix : bAsUnix - aAsUnix;
                    break;
                case "Boolean":
                case "Bool":
                    return va == true ? (current.sort.asc ? 1 : -1) : (current.sort.asc ? -1 : 1);
                    break;
                case "String":
                    return va.toString().toLowerCase().replace(" ", "") > vb.toString().toLowerCase().replace(" ", "") ? (current.sort.asc ? 1 : -1) : (current.sort.asc ? -1 : 1);
                    break;
                default:
                    return va > vb ? (current.sort.asc ? 1 : -1) : (current.sort.asc ? -1 : 1);
                    break;
            }
        });
        if (shouldDebug) console.debug("sortBody", current.data.title, current.sort.asc);
    }
};

/** 
 */
Tabler.unset = (id: string) => {
    let i = Tabler.get(id);
    if (!i) return false;
    let ind = TablerData.indexOf(i);
    if (ind > -1) {
        TablerData.splice(ind, 1);
        return true;
    } else return false;
};

/** 
 */
Tabler.updateRow = (id: string, rowIder: string, replacement = null) => {
    let i = Tabler.get(id),
        old = i.body.find(Tabler.rowFinder(i, rowIder));
    if (!i || !old) return false;
    if (!replacement) {
        i.body = i.body.filter((r: any) => r[i.options.rowKey] != rowIder);
    } else {
        i.body[i.body.indexOf(old)] = replacement;
    }
    Tabler.updateAllUI(id, i);
    if (shouldDebug) console.debug("updateRow", rowIder);
    return true;
};

/** 
 */
Tabler.updateAllUI = (id: string, i: TablerInstanceDto | null = null) => {
    if (!i) i = Tabler.get(id);
    if (!i) return false;
    i.loading = true;
    Tabler.sortBody(i);
    Tabler.setFiltered(i);
    Tabler.paginate(i);
    Tabler.attachEvents(i);
    i.loading = false;
    i.version++;
    if (shouldDebug) console.debug("updateUI", id, i.version);
    return true;
};

export { Tabler };